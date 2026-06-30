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
  addTeamPlayer,
  createTeam,
  fetchMyTeamStatus,
  type Player,
  type PlayerPosition,
} from "@/lib/api/teams"
import { colorFromString } from "@/lib/visual"
import { TeamPlayerCard } from "./team-player-card"

// Starting XI in a 4-4-2. Each slot is bound to a position.
const FORMATION: { pos: PlayerPosition; count: number }[] = [
  { pos: "GK", count: 1 },
  { pos: "DEF", count: 4 },
  { pos: "MID", count: 4 },
  { pos: "FWD", count: 2 },
]

interface Slot {
  key: string
  pos: PlayerPosition
  player: Player | null
}

function initialSlots(): Slot[] {
  const slots: Slot[] = []
  for (const row of FORMATION) {
    for (let i = 0; i < row.count; i++) slots.push({ key: `${row.pos}-${i}`, pos: row.pos, player: null })
  }
  return slots
}

export function TeamBuilder({ leagueId, leagueName }: { leagueId: string; leagueName?: string }) {
  const queryClient = useQueryClient()
  const playersQuery = useQuery({ queryKey: ["league-players", leagueId], queryFn: () => fetchLeaguePlayers(leagueId) })

  const [name, setName] = useState("")
  const [slots, setSlots] = useState<Slot[]>(initialSlots)
  const [pickerKey, setPickerKey] = useState<string | null>(null)
  const [error, setError] = useState("")

  const selectedIds = useMemo(() => slots.filter((s) => s.player).map((s) => s.player!.id), [slots])
  const kit = colorFromString(name || leagueId)
  const allFilled = slots.every((s) => s.player)
  const canSubmit = name.trim().length >= 2 && allFilled

  const mutation = useMutation({
    mutationFn: async () => {
      // Create (or resume an already-created team), then add each starter.
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

      for (const slot of slots) {
        if (!slot.player) continue
        try {
          await addTeamPlayer(leagueId, teamId, slot.player.id, "STARTER")
        } catch (e) {
          // Ignore "already in this team" on a resumed submit; rethrow real errors.
          if (!isAlreadyInTeam(e)) throw e
        }
      }
      return teamId
    },
    onSuccess: () => {
      // Flip the gate immediately, then refresh team lists.
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

  const pickerSlot = pickerKey ? slots.find((s) => s.key === pickerKey) ?? null : null

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
            Name your team, then tap each slot to pick your starting XI.
          </p>

          <Field id="team-name" label="TEAM NAME" value={name} onChange={setName} placeholder="e.g. Net Gains FC" autoComplete="off" />

          {error ? <FormError message={error} /> : null}

          {/* pitch */}
          <div
            style={{
              margin: "8px 0 0",
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              background: "linear-gradient(175deg,#0E7A4A 0%,#0A6B40 50%,#085C37 100%)",
              padding: "16px 8px 14px",
            }}
          >
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 44px, transparent 44px 88px)", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
              {FORMATION.map((row) => (
                <div key={row.pos} style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                  {slots
                    .filter((s) => s.pos === row.pos)
                    .map((slot) => (
                      <div key={slot.key} style={{ width: 74 }}>
                        {slot.player ? (
                          <TeamPlayerCard player={slot.player} kitColor={kit} onClick={() => setPickerKey(slot.key)} />
                        ) : (
                          <EmptySlot pos={slot.pos} onClick={() => setPickerKey(slot.key)} />
                        )}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "14px 2px 16px" }}>
            <SectionLabel>STARTING XI</SectionLabel>
            <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: allFilled ? "#00E5C7" : "#8A93A8" }}>
              {selectedIds.length}/{slots.length}
            </span>
          </div>

          <PrimaryButton disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? "Creating your team…" : "Create team & enter league"}
          </PrimaryButton>
        </form>
      </div>

      {pickerSlot ? (
        <PlayerPicker
          position={pickerSlot.pos}
          players={playersQuery.data ?? []}
          loading={playersQuery.isPending}
          error={playersQuery.isError}
          excludeIds={selectedIds.filter((id) => id !== pickerSlot.player?.id)}
          hasSelection={Boolean(pickerSlot.player)}
          onPick={(player) => {
            setSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player } : s)))
            setPickerKey(null)
          }}
          onRemove={() => {
            setSlots((prev) => prev.map((s) => (s.key === pickerSlot.key ? { ...s, player: null } : s)))
            setPickerKey(null)
          }}
          onClose={() => setPickerKey(null)}
        />
      ) : null}
    </PhoneFrame>
  )
}

function EmptySlot({ pos, onClick }: { pos: PlayerPosition; onClick: () => void }) {
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
        {pos}
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
  position: PlayerPosition
  players: Player[]
  loading: boolean
  error: boolean
  excludeIds: string[]
  hasSelection: boolean
  onPick: (player: Player) => void
  onRemove: () => void
  onClose: () => void
}) {
  const available = players.filter((p) => p.position === position && !excludeIds.includes(p.id))

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 80, background: "rgba(7,11,22,.97)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "54px 18px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>CHOOSE A PLAYER</div>
          <h2 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "2px 0 0" }}>{position}</h2>
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
          <p style={{ color: "#8A93A8", fontSize: 14, textAlign: "center", padding: "40px 0" }}>No available {position} players.</p>
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

// --- helpers ---

function formatValue(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function isAlreadyInTeam(e: unknown): boolean {
  return isAxiosError(e) && typeof e.response?.data?.message === "string" && e.response.data.message.toLowerCase().includes("already")
}

function messageOf(e: unknown): string {
  if (isAxiosError(e)) {
    const m = e.response?.data?.message
    if (Array.isArray(m)) return m.join(", ")
    if (typeof m === "string") return m
  }
  return "Couldn't create your team. Please try again."
}
