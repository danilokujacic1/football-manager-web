"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { useMemo, useState } from "react"
import { Field, FormError, PrimaryButton } from "@/components/auth/auth-ui"
import { Spinner } from "@/components/common/phone-screen"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { SectionLabel } from "@/components/gaffer/ui"
import { fetchLeaguePlayers } from "@/lib/api/players"
import {
  fetchLeagueConfiguration,
  resolvePositionCounts,
  type LeagueConfigurationRecord,
  type PositionCounts,
} from "@/lib/api/leagues"
import {
  addTeamPlayer,
  createTeam,
  fetchMyTeamStatus,
  type Player,
  type PlayerPosition,
} from "@/lib/api/teams"
import { colorFromString } from "@/lib/visual"
import { PitchField } from "./pitch-field"
import { TeamPlayerCard } from "./team-player-card"

// FWD at the top → GK at the bottom (matching goal at GK end).
const PITCH_ORDER: PlayerPosition[] = ["FWD", "MID", "DEF", "GK"]

// ---------------------------------------------------------------------------
// Slot types
// ---------------------------------------------------------------------------

interface StarterSlot {
  key: string
  slot: "STARTER"
  pos: PlayerPosition
  player: Player | null
}

interface BenchSlot {
  key: string
  slot: "BENCH"
  /** Bench is position-agnostic; the picker will show all positions. */
  pos: null
  player: Player | null
}

type Slot = StarterSlot | BenchSlot

// ---------------------------------------------------------------------------
// Slot factories
// ---------------------------------------------------------------------------

function buildStarterSlots(counts: PositionCounts): StarterSlot[] {
  const slots: StarterSlot[] = []
  const rows: { pos: PlayerPosition; count: number }[] = [
    { pos: "GK", count: counts.GK },
    { pos: "DEF", count: counts.DEF },
    { pos: "MID", count: counts.MID },
    { pos: "FWD", count: counts.FWD },
  ]
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      slots.push({ key: `${row.pos}-${i}`, slot: "STARTER", pos: row.pos, player: null })
    }
  }
  return slots
}

function buildBenchSlots(count: number): BenchSlot[] {
  return Array.from({ length: count }, (_, i) => ({
    key: `BENCH-${i}`,
    slot: "BENCH" as const,
    pos: null,
    player: null,
  }))
}

/**
 * Fallback when positionCounts is absent: 1 GK, remainder split evenly across
 * DEF / MID / FWD (any excess goes to DEF then MID).
 */
function fallbackCounts(maxPlayers: number): PositionCounts {
  const outfield = Math.max(0, maxPlayers - 1)
  const base = Math.floor(outfield / 3)
  const extra = outfield % 3
  return {
    GK: 1,
    DEF: base + (extra > 0 ? 1 : 0),
    MID: base + (extra > 1 ? 1 : 0),
    FWD: base,
  }
}

// ---------------------------------------------------------------------------
// Public export — fetches config, delegates to TeamBuilderForm
// ---------------------------------------------------------------------------

export function TeamBuilder({ leagueId, leagueName }: { leagueId: string; leagueName?: string }) {
  const configQuery = useQuery({
    queryKey: ["league-configuration", leagueId],
    queryFn: () => fetchLeagueConfiguration(leagueId),
    // Configuration is stable per session; re-fetch only when explicitly invalidated.
    staleTime: 5 * 60_000,
    retry: false,
  })

  if (configQuery.isPending) {
    return (
      <PhoneFrame>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spinner />
        </div>
      </PhoneFrame>
    )
  }

  if (configQuery.isError || !configQuery.data) {
    return (
      <PhoneFrame>
        <div style={{ padding: "80px 26px", textAlign: "center" }}>
          <p style={{ color: "#9BA6BC", fontSize: 14 }}>
            Couldn&apos;t load league configuration. Please try again.
          </p>
        </div>
      </PhoneFrame>
    )
  }

  return (
    <TeamBuilderForm
      leagueId={leagueId}
      leagueName={leagueName}
      config={configQuery.data}
    />
  )
}

// ---------------------------------------------------------------------------
// Inner form — receives stable config so useState can initialise from it
// ---------------------------------------------------------------------------

function TeamBuilderForm({
  leagueId,
  leagueName,
  config,
}: {
  leagueId: string
  leagueName?: string
  config: LeagueConfigurationRecord
}) {
  const queryClient = useQueryClient()
  const playersQuery = useQuery({
    queryKey: ["league-players", leagueId],
    queryFn: () => fetchLeaguePlayers(leagueId),
  })

  // Resolve formation; fall back to an even split when absent.
  const counts = resolvePositionCounts(config) ?? fallbackCounts(config.maxPlayers)

  const [name, setName] = useState("")
  const [starterSlots, setStarterSlots] = useState<StarterSlot[]>(() => buildStarterSlots(counts))
  const [benchSlots, setBenchSlots] = useState<BenchSlot[]>(() => buildBenchSlots(config.benchPlayers))
  const [pickerKey, setPickerKey] = useState<string | null>(null)
  const [error, setError] = useState("")

  const allSlots: Slot[] = useMemo(() => [...starterSlots, ...benchSlots], [starterSlots, benchSlots])

  const selectedIds = useMemo(
    () => allSlots.filter((s) => s.player).map((s) => s.player!.id),
    [allSlots],
  )

  const kit = colorFromString(name || leagueId)
  const startersFilled = starterSlots.every((s) => s.player !== null)
  const benchFilled = benchSlots.every((s) => s.player !== null)
  const canSubmit = name.trim().length >= 2 && startersFilled && benchFilled

  const starterCount = starterSlots.filter((s) => s.player).length
  const benchCount = benchSlots.filter((s) => s.player).length

  const mutation = useMutation({
    mutationFn: async () => {
      // Create (or resume an already-created) team.
      let teamId: string | undefined
      try {
        const team = await createTeam(leagueId, name.trim())
        teamId = team.id
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 409) {
          const status = await fetchMyTeamStatus(leagueId)
          teamId = status.team?.id ?? undefined
        }
        if (!teamId) throw e
      }

      // Add all starters, then bench players.
      for (const slot of starterSlots) {
        if (!slot.player) continue
        try {
          await addTeamPlayer(leagueId, teamId, slot.player.id, "STARTER")
        } catch (e) {
          if (!isAlreadyInTeam(e)) throw e
        }
      }
      for (const slot of benchSlots) {
        if (!slot.player) continue
        try {
          await addTeamPlayer(leagueId, teamId, slot.player.id, "BENCH")
        } catch (e) {
          if (!isAlreadyInTeam(e)) throw e
        }
      }
      return teamId
    },
    onSuccess: () => {
      queryClient.setQueryData(["my-team-status", leagueId], { hasTeam: true })
      queryClient.invalidateQueries({ queryKey: ["my-team-status", leagueId] })
      queryClient.invalidateQueries({ queryKey: ["league-teams", leagueId] })
    },
    onError: (e) => setError(messageOf(e)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (canSubmit) mutation.mutate()
  }

  // Resolve which slot is open for the player picker.
  const pickerSlot = pickerKey ? allSlots.find((s) => s.key === pickerKey) ?? null : null

  function handlePick(player: Player) {
    if (!pickerSlot) return
    if (pickerSlot.slot === "STARTER") {
      setStarterSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player } : s)))
    } else {
      setBenchSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player } : s)))
    }
    setPickerKey(null)
  }

  function handleRemove() {
    if (!pickerSlot) return
    if (pickerSlot.slot === "STARTER") {
      setStarterSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player: null } : s)))
    } else {
      setBenchSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player: null } : s)))
    }
    setPickerKey(null)
  }

  return (
    <PhoneFrame>
      <div className="scrl" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
        <form onSubmit={handleSubmit} style={{ minHeight: 850, padding: "62px 18px 32px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>
            {leagueName ? leagueName.toUpperCase() : "NEW SQUAD"}
          </div>
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 27, color: "#fff", margin: "3px 0 4px" }}>
            Build your team
          </h1>
          <p style={{ fontSize: 13, color: "#9BA6BC", margin: "0 0 18px" }}>
            Name your team, then fill in your starters and substitutes.
          </p>

          <Field id="team-name" label="TEAM NAME" value={name} onChange={setName} placeholder="e.g. Net Gains FC" autoComplete="off" />

          {error ? <FormError message={error} /> : null}

          {/* Pitch — FWD on top, GK (goal) at bottom */}
          <PitchField style={{ margin: "8px 0 0" }}>
            {PITCH_ORDER.map((pos) => {
              const row = starterSlots.filter((s) => s.pos === pos)
              if (row.length === 0) return null
              return (
                <div key={pos} style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                  {row.map((slot) => (
                    <div key={slot.key} style={{ width: 74 }}>
                      {slot.player ? (
                        <TeamPlayerCard player={slot.player} kitColor={kit} onClick={() => setPickerKey(slot.key)} />
                      ) : (
                        <EmptySlot label={slot.pos} onClick={() => setPickerKey(slot.key)} />
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </PitchField>

          {/* Starters counter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 2px 10px" }}>
            <SectionLabel>STARTERS</SectionLabel>
            <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: startersFilled ? "#00E5C7" : "#8A93A8" }}>
              {starterCount}/{config.maxPlayers}
            </span>
          </div>

          {/* Bench section */}
          {config.benchPlayers > 0 ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 2px 8px" }}>
                <SectionLabel>SUBSTITUTES</SectionLabel>
                <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: benchFilled ? "#00E5C7" : "#8A93A8" }}>
                  {benchCount}/{config.benchPlayers}
                </span>
              </div>
              <div style={{ display: "flex", gap: 9, marginBottom: 16 }}>
                {benchSlots.map((slot) => (
                  <div key={slot.key} style={{ flex: 1 }}>
                    {slot.player ? (
                      <TeamPlayerCard player={slot.player} kitColor={kit} onClick={() => setPickerKey(slot.key)} />
                    ) : (
                      <EmptySlot label="SUB" onClick={() => setPickerKey(slot.key)} />
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ marginBottom: 16 }} />
          )}

          <PrimaryButton disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating your team…" : "Create team & enter league"}
          </PrimaryButton>
        </form>
      </div>

      {pickerSlot ? (
        <PlayerPicker
          // Bench slots pass null → picker shows all positions
          position={pickerSlot.pos}
          players={playersQuery.data ?? []}
          loading={playersQuery.isPending}
          error={playersQuery.isError}
          excludeIds={selectedIds.filter((id) => id !== pickerSlot.player?.id)}
          hasSelection={Boolean(pickerSlot.player)}
          onPick={handlePick}
          onRemove={handleRemove}
          onClose={() => setPickerKey(null)}
        />
      ) : null}
    </PhoneFrame>
  )
}

// ---------------------------------------------------------------------------
// Presentational sub-components
// ---------------------------------------------------------------------------

function EmptySlot({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        height: 100,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 13,
        background: "rgba(7,11,22,.4)",
        border: "1.5px dashed rgba(255,255,255,.32)",
      }}
    >
      <span style={{ fontSize: 22, color: "rgba(255,255,255,.7)", lineHeight: 1 }}>+</span>
      <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 11, color: "rgba(255,255,255,.7)", letterSpacing: ".04em" }}>
        {label}
      </span>
    </button>
  )
}

function PlayerPicker({
  position,
  players,
  loading,
  error,
  excludeIds,
  hasSelection,
  onPick,
  onRemove,
  onClose,
}: {
  /** null means bench — show all positions */
  position: PlayerPosition | null
  players: Player[]
  loading: boolean
  error: boolean
  excludeIds: string[]
  hasSelection: boolean
  onPick: (player: Player) => void
  onRemove: () => void
  onClose: () => void
}) {
  const available = players.filter(
    (p) => (position === null || p.position === position) && !excludeIds.includes(p.id),
  )

  const heading = position ?? "ANY POSITION"
  const emptyMsg = position
    ? `No available ${position} players.`
    : "No available players."

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(7,11,22,.97)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "54px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>CHOOSE A PLAYER</div>
          <h2 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "2px 0 0" }}>{heading}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,.14)",
            background: "rgba(255,255,255,.05)",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>

      {hasSelection ? (
        <button
          type="button"
          onClick={onRemove}
          style={{
            margin: "0 18px 8px",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid rgba(255,46,126,.3)",
            background: "rgba(255,46,126,.1)",
            color: "#FF8AB6",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Remove from slot
        </button>
      ) : null}

      <div className="scrl" style={{ flex: 1, overflowY: "auto", padding: "0 18px 24px", display: "flex", flexDirection: "column", gap: 7 }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Spinner />
          </div>
        ) : error ? (
          <p style={{ color: "#9BA6BC", fontSize: 14, textAlign: "center", padding: "40px 0" }}>Couldn&apos;t load players.</p>
        ) : available.length === 0 ? (
          <p style={{ color: "#8A93A8", fontSize: 14, textAlign: "center", padding: "40px 0" }}>{emptyMsg}</p>
        ) : (
          available.map((p) => <PickerRow key={p.id} player={p} onPick={() => onPick(p)} />)
        )}
      </div>
    </div>
  )
}

function PickerRow({ player, onPick }: { player: Player; onPick: () => void }) {
  const value = formatValue(player.value)
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 13px",
        borderRadius: 13,
        textAlign: "left",
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.07)",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: colorFromString(player.id),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 11,
          color: "#fff",
          flex: "none",
        }}
      >
        {player.position}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 14, color: "#F2F5FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {player.name}
        </div>
        <div style={{ fontSize: 11, color: "#8A93A8" }}>{player.club ?? player.position}</div>
      </div>
      {value ? (
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 15, color: "#00E5C7", flex: "none" }}>{value}</span>
      ) : null}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function isAlreadyInTeam(e: unknown): boolean {
  return (
    isAxiosError(e) &&
    typeof e.response?.data?.message === "string" &&
    e.response.data.message.toLowerCase().includes("already")
  )
}

function messageOf(e: unknown): string {
  if (isAxiosError(e)) {
    const m = e.response?.data?.message
    if (Array.isArray(m)) return m.join(", ")
    if (typeof m === "string") return m
  }
  return "Couldn't create your team. Please try again."
}
