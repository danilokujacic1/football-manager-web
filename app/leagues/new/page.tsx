"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Field, FormError } from "@/components/auth/auth-ui"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { createLeague, type NewLeaguePlayer, type PlayerPosition } from "@/lib/api/leagues"

const STEPS = ["Name", "Settings", "Formation", "Players"] as const
const POSITIONS: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]

/** Per-position counts of a starting XI. GK is always 1. */
interface Formation {
  GK: number
  DEF: number
  MID: number
  FWD: number
}

/** Presets are written outfield-only (DEF-MID-FWD); a keeper is always implied. */
const PRESETS: { key: string; def: number; mid: number; fwd: number }[] = [
  { key: "2-1-1", def: 2, mid: 1, fwd: 1 },
  { key: "1-2-1", def: 1, mid: 2, fwd: 1 },
  { key: "2-2-1", def: 2, mid: 2, fwd: 1 },
  { key: "3-2-1", def: 3, mid: 2, fwd: 1 },
  { key: "4-4-2", def: 4, mid: 4, fwd: 2 },
  { key: "4-3-3", def: 4, mid: 3, fwd: 3 },
  { key: "3-5-2", def: 3, mid: 5, fwd: 2 },
]

/** A single editable row of the players field array. Strings, parsed on submit. */
interface PlayerRow {
  name: string
  position: PlayerPosition
  value: string
  club: string
}

const emptyPlayer = (): PlayerRow => ({ name: "", position: "GK", value: "", club: "" })
const sumFormation = (f: Formation) => f.GK + f.DEF + f.MID + f.FWD

export default function NewLeaguePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(0)
  const [error, setError] = useState("")

  // Step 1 — name
  const [name, setName] = useState("")

  // Step 2 — configuration (squad size now comes from the formation, not here)
  const [benchPlayers, setBenchPlayers] = useState("4")
  const [unlimitedBudget, setUnlimitedBudget] = useState(false)
  const [budget, setBudget] = useState("100")
  const [transfersPerRound, setTransfersPerRound] = useState("1")

  // Step 3 — formation
  const [formationMode, setFormationMode] = useState<"preset" | "free">("preset")
  const [presetKey, setPresetKey] = useState(PRESETS[0].key)
  const [freeSquadSize, setFreeSquadSize] = useState("5")

  // Step 4 — players field array
  const [players, setPlayers] = useState<PlayerRow[]>([emptyPlayer()])

  // ---- derived formation requirements ----
  const preset = PRESETS.find((p) => p.key === presetKey) ?? PRESETS[0]
  const freeSize = Number(freeSquadSize)
  // Minimum players the pool must hold per position so a valid XI can be fielded.
  const required: Formation =
    formationMode === "preset"
      ? { GK: 1, DEF: preset.def, MID: preset.mid, FWD: preset.fwd }
      : { GK: 1, DEF: 1, MID: 1, FWD: 1 }
  const starters =
    formationMode === "preset" ? sumFormation(required) : Number.isInteger(freeSize) ? freeSize : 0
  const benchNum = Number(benchPlayers)
  const minSquad = starters + (Number.isInteger(benchNum) ? benchNum : 0)

  // ---- derived budget / pool figures ----
  const budgetTotal = unlimitedBudget ? null : Number(budget)
  const spent = players.reduce((sum, p) => {
    const v = Number(p.value)
    return sum + (p.value.trim() && Number.isFinite(v) ? v : 0)
  }, 0)
  const remaining = budgetTotal == null ? null : budgetTotal - spent

  const named = players.filter((p) => p.name.trim().length > 0)
  const counts: Formation = {
    GK: named.filter((p) => p.position === "GK").length,
    DEF: named.filter((p) => p.position === "DEF").length,
    MID: named.filter((p) => p.position === "MID").length,
    FWD: named.filter((p) => p.position === "FWD").length,
  }

  const mutation = useMutation({
    mutationFn: () =>
      createLeague({
        name: name.trim(),
        configuration: {
          maxPlayers: starters,
          benchPlayers: Number(benchPlayers),
          budget: unlimitedBudget ? null : Number(budget),
          transfersPerRound: Number(transfersPerRound),
        },
        players: named.map<NewLeaguePlayer>((p) => ({
          name: p.name.trim(),
          position: p.position,
          ...(p.value.trim() ? { value: Number(p.value) } : {}),
          ...(p.club.trim() ? { club: p.club.trim() } : {}),
        })),
      }),
    onSuccess: (league) => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] })
      router.replace(league.id ? `/leagues/${league.id}` : "/leagues")
    },
    onError: () => setError("Something went wrong creating the league. Please try again."),
  })

  // ---- per-step validation ----
  function validateStep(current: number): string | null {
    const inRange = (v: string, lo: number, hi: number) => {
      const num = Number(v)
      return Number.isInteger(num) && num >= lo && num <= hi
    }

    if (current === 0) {
      const n = name.trim()
      if (n.length < 3) return "League name must be at least 3 characters."
      if (n.length > 60) return "League name must be 60 characters or fewer."
      return null
    }

    if (current === 1) {
      if (!inRange(benchPlayers, 0, 15)) return "Bench size must be a whole number between 0 and 15."
      if (!unlimitedBudget && !inRange(budget, 0, Number.MAX_SAFE_INTEGER))
        return "Budget must be a whole number of 0 or more (or set it to unlimited)."
      if (!inRange(transfersPerRound, 0, 50)) return "Transfers per round must be between 0 and 50."
      return null
    }

    if (current === 2) {
      if (formationMode === "free" && !inRange(freeSquadSize, 4, 30))
        return "A free squad needs between 4 and 30 starters (at least one per position)."
      return null
    }

    if (current === 3) {
      if (named.length === 0) return "Add at least one player (a name is required)."
      if (named.some((p) => p.name.trim().length > 80)) return "Player names must be 80 characters or fewer."
      if (named.some((p) => p.value.trim() && !(Number(p.value) >= 0))) return "Player values must be 0 or more."

      // Each position needs at least the formation's requirement, or no manager can field a valid XI.
      const short = POSITIONS.filter((pos) => counts[pos] < required[pos])
      if (short.length > 0) {
        const detail = short.map((pos) => `${pos} ${counts[pos]}/${required[pos]}`).join(", ")
        return `Not enough players per position for this formation: ${detail}.`
      }

      // Enough total players for a full squad (starters + bench).
      if (named.length < minSquad)
        return `Add at least ${minSquad} players (${starters} starters + ${benchNum} bench) so managers can fill a full squad.`
      return null
    }
    return null
  }

  function next() {
    const problem = validateStep(step)
    if (problem) return setError(problem)
    setError("")
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  function back() {
    setError("")
    if (step === 0) return router.push("/leagues")
    setStep((s) => Math.max(0, s - 1))
  }

  function submit() {
    const problem = validateStep(3)
    if (problem) return setError(problem)
    setError("")
    mutation.mutate()
  }

  // ---- players field array helpers ----
  const updatePlayer = (index: number, patch: Partial<PlayerRow>) =>
    setPlayers((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  const addPlayer = () => setPlayers((rows) => [...rows, emptyPlayer()])
  const removePlayer = (index: number) =>
    setPlayers((rows) => (rows.length === 1 ? rows : rows.filter((_, i) => i !== index)))

  const isLast = step === STEPS.length - 1
  const submitting = mutation.isPending

  return (
    <PhoneFrame>
      <div className="scrl" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ minHeight: 850, padding: "60px 26px 40px", display: "flex", flexDirection: "column" }}>
          <TopBar onBack={back} backLabel={step === 0 ? "Leagues" : "Back"} />
          <Stepper current={step} />

          <div style={{ marginTop: 26 }}>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: 0 }}>
              {step === 0 && "Name your league"}
              {step === 1 && "League settings"}
              {step === 2 && "Pick a formation"}
              {step === 3 && "Add players"}
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "8px 0 0", maxWidth: 300 }}>
              {step === 0 && "This is what your mates will see when they join."}
              {step === 1 && "Set the budget, bench and transfer rules. You can change these later."}
              {step === 2 && "This sets the squad shape and how many of each position the pool must cover."}
              {step === 3 && "Build the player pool managers will draft from."}
            </p>
          </div>

          <div style={{ marginTop: 24, flex: 1 }}>
            {error ? <FormError message={error} /> : null}

            {step === 0 && (
              <Field
                id="league-name"
                label="LEAGUE NAME"
                value={name}
                onChange={setName}
                placeholder="e.g. Sunday League Legends"
                autoComplete="off"
              />
            )}

            {step === 1 && (
              <ConfigStep
                benchPlayers={benchPlayers}
                budget={budget}
                unlimitedBudget={unlimitedBudget}
                transfersPerRound={transfersPerRound}
                onBenchPlayers={setBenchPlayers}
                onBudget={setBudget}
                onUnlimitedBudget={setUnlimitedBudget}
                onTransfersPerRound={setTransfersPerRound}
              />
            )}

            {step === 2 && (
              <FormationStep
                mode={formationMode}
                presetKey={presetKey}
                freeSquadSize={freeSquadSize}
                required={required}
                starters={starters}
                onMode={setFormationMode}
                onPreset={setPresetKey}
                onFreeSquadSize={setFreeSquadSize}
              />
            )}

            {step === 3 && (
              <PlayersStep
                players={players}
                onUpdate={updatePlayer}
                onRemove={removePlayer}
                onAdd={addPlayer}
                budgetTotal={budgetTotal}
                spent={spent}
                remaining={remaining}
                required={required}
                counts={counts}
                minSquad={minSquad}
                namedCount={named.length}
              />
            )}
          </div>

          <div style={{ marginTop: 28 }}>
            {isLast ? (
              <button type="button" onClick={submit} disabled={submitting} style={primaryButtonStyle(submitting)}>
                {submitting ? "Creating league…" : "Create league"}
              </button>
            ) : (
              <button type="button" onClick={next} style={primaryButtonStyle(false)}>
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

/* ---------------------------------------------------------------- shell bits */

function TopBar({ onBack, backLabel }: { onBack: () => void; backLabel: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: 0,
          cursor: "pointer",
          color: "#9BA6BC",
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 600,
          fontSize: 14,
          padding: 0,
        }}
      >
        <span aria-hidden style={{ fontSize: 18 }}>
          ‹
        </span>
        {backLabel}
      </button>
      <Link
        href="/leagues"
        style={{ color: "#566", fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
      >
        Cancel
      </Link>
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
      {STEPS.map((label, i) => (
        <div
          key={label}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            background: i <= current ? "#00E5C7" : "rgba(255,255,255,.12)",
          }}
        />
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- step two */

function ConfigStep({
  benchPlayers,
  budget,
  unlimitedBudget,
  transfersPerRound,
  onBenchPlayers,
  onBudget,
  onUnlimitedBudget,
  onTransfersPerRound,
}: {
  benchPlayers: string
  budget: string
  unlimitedBudget: boolean
  transfersPerRound: string
  onBenchPlayers: (v: string) => void
  onBudget: (v: string) => void
  onUnlimitedBudget: (v: boolean) => void
  onTransfersPerRound: (v: string) => void
}) {
  return (
    <div>
      <NumberField id="bench-players" label="BENCH SIZE" value={benchPlayers} onChange={onBenchPlayers} />

      <NumberField
        id="budget"
        label="BUDGET"
        value={unlimitedBudget ? "" : budget}
        onChange={onBudget}
        disabled={unlimitedBudget}
        placeholder={unlimitedBudget ? "Unlimited" : undefined}
      />
      <ToggleRow label="Unlimited budget" checked={unlimitedBudget} onChange={onUnlimitedBudget} />

      <div style={{ marginTop: 14 }}>
        <NumberField id="transfers" label="TRANSFERS PER ROUND" value={transfersPerRound} onChange={onTransfersPerRound} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- step three */

function FormationStep({
  mode,
  presetKey,
  freeSquadSize,
  required,
  starters,
  onMode,
  onPreset,
  onFreeSquadSize,
}: {
  mode: "preset" | "free"
  presetKey: string
  freeSquadSize: string
  required: Formation
  starters: number
  onMode: (m: "preset" | "free") => void
  onPreset: (key: string) => void
  onFreeSquadSize: (v: string) => void
}) {
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <ModeTab label="Preset formation" active={mode === "preset"} onClick={() => onMode("preset")} />
        <ModeTab label="Free formation" active={mode === "free"} onClick={() => onMode("free")} />
      </div>

      <Pitch formation={mode === "preset" ? required : { GK: 1, DEF: 1, MID: 1, FWD: 1 }} free={mode === "free"} />

      {mode === "preset" ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            {PRESETS.map((p) => {
              const active = p.key === presetKey
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => onPreset(p.key)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    cursor: "pointer",
                    fontFamily: "var(--font-archivo)",
                    fontWeight: 800,
                    fontSize: 14,
                    border: `1.5px solid ${active ? "rgba(0,229,199,.55)" : "rgba(255,255,255,.12)"}`,
                    background: active ? "rgba(0,229,199,.14)" : "rgba(255,255,255,.05)",
                    color: active ? "#00E5C7" : "#9BA6BC",
                  }}
                >
                  {p.key}
                </button>
              )
            })}
          </div>
          <p style={{ fontSize: 13, color: "#9BA6BC", margin: "14px 0 0", fontFamily: "var(--font-space-grotesk)" }}>
            {starters} starters: 1 GK · {required.DEF} DEF · {required.MID} MID · {required.FWD} FWD. The pool must cover
            at least this many of each position.
          </p>
        </>
      ) : (
        <div style={{ marginTop: 18 }}>
          <NumberField id="free-squad-size" label="STARTERS PER TEAM" value={freeSquadSize} onChange={onFreeSquadSize} />
          <p style={{ fontSize: 13, color: "#9BA6BC", margin: "4px 0 0", fontFamily: "var(--font-space-grotesk)" }}>
            Managers can field any shape. The pool just needs at least one player in every position (GK, DEF, MID, FWD).
          </p>
        </div>
      )}
    </div>
  )
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        height: 44,
        borderRadius: 12,
        cursor: "pointer",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        fontSize: 13,
        border: `1.5px solid ${active ? "rgba(0,229,199,.55)" : "rgba(255,255,255,.12)"}`,
        background: active ? "rgba(0,229,199,.14)" : "rgba(255,255,255,.05)",
        color: active ? "#00E5C7" : "#9BA6BC",
      }}
    >
      {label}
    </button>
  )
}

/** A simple top-down pitch: FWD line at the top, GK at the bottom. */
function Pitch({ formation, free }: { formation: Formation; free?: boolean }) {
  const lines: { pos: PlayerPosition; count: number }[] = [
    { pos: "FWD", count: formation.FWD },
    { pos: "MID", count: formation.MID },
    { pos: "DEF", count: formation.DEF },
    { pos: "GK", count: formation.GK },
  ]
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        padding: "18px 14px",
        background: "linear-gradient(180deg, #0B7A4F 0%, #096A45 100%)",
        border: "1px solid rgba(255,255,255,.12)",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,.08)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 220,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.18)",
        }}
      />
      {lines.map((line) => (
        <div key={line.pos} style={{ display: "flex", justifyContent: "center", gap: 10, position: "relative", zIndex: 1, flex: 1, alignItems: "center" }}>
          {Array.from({ length: Math.max(1, line.count) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: free ? "rgba(255,255,255,.35)" : "#00E5C7",
                border: "2px solid rgba(255,255,255,.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: "#062018",
                fontFamily: "var(--font-archivo)",
              }}
            >
              {line.pos}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------------- step four */

function PlayersStep({
  players,
  onUpdate,
  onRemove,
  onAdd,
  budgetTotal,
  spent,
  remaining,
  required,
  counts,
  minSquad,
  namedCount,
}: {
  players: PlayerRow[]
  onUpdate: (index: number, patch: Partial<PlayerRow>) => void
  onRemove: (index: number) => void
  onAdd: () => void
  budgetTotal: number | null
  spent: number
  remaining: number | null
  required: Formation
  counts: Formation
  minSquad: number
  namedCount: number
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <PoolSummary
        budgetTotal={budgetTotal}
        spent={spent}
        remaining={remaining}
        required={required}
        counts={counts}
        minSquad={minSquad}
        namedCount={namedCount}
      />

      {players.map((player, i) => (
        <div
          key={i}
          style={{
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,.1)",
            background: "rgba(255,255,255,.04)",
            padding: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#7C879B" }}>PLAYER {i + 1}</span>
            {players.length > 1 ? (
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{ background: "none", border: 0, cursor: "pointer", color: "#FF6B6B", fontSize: 12, fontWeight: 600, padding: 4 }}
              >
                Remove
              </button>
            ) : null}
          </div>

          <Field
            id={`player-name-${i}`}
            label="NAME"
            value={player.name}
            onChange={(v) => onUpdate(i, { name: v })}
            placeholder="e.g. Alex Morgan"
            autoComplete="off"
          />

          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#7C879B" }}>POSITION</span>
          <PositionPicker value={player.position} onChange={(pos) => onUpdate(i, { position: pos })} />

          <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1 }}>
              <NumberField
                id={`player-value-${i}`}
                label="VALUE (OPTIONAL)"
                value={player.value}
                onChange={(v) => onUpdate(i, { value: v })}
                placeholder="0"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                id={`player-club-${i}`}
                label="CLUB (OPTIONAL)"
                value={player.club}
                onChange={(v) => onUpdate(i, { club: v })}
                placeholder="e.g. Rovers"
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        style={{
          height: 50,
          borderRadius: 16,
          border: "1.5px dashed rgba(0,229,199,.45)",
          background: "rgba(0,229,199,.06)",
          color: "#00E5C7",
          cursor: "pointer",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 14,
        }}
      >
        + Add another player
      </button>
    </div>
  )
}

/** Players-step header: per-position requirement progress + (informational) budget tally. */
function PoolSummary({
  budgetTotal,
  spent,
  remaining,
  required,
  counts,
  minSquad,
  namedCount,
}: {
  budgetTotal: number | null
  spent: number
  remaining: number | null
  required: Formation
  counts: Formation
  minSquad: number
  namedCount: number
}) {
  const squadOk = namedCount >= minSquad
  const overBudget = remaining != null && remaining < 0

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(0,229,199,.28)",
        background: "rgba(0,229,199,.06)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#7C879B" }}>SQUAD POOL</span>
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: squadOk ? "#00E5C7" : "#9BA6BC" }}>
          {namedCount} / {minSquad} players
        </span>
      </div>

      {/* per-position requirement chips */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {POSITIONS.map((pos) => {
          const ok = counts[pos] >= required[pos]
          return (
            <div
              key={pos}
              style={{
                flex: 1,
                textAlign: "center",
                borderRadius: 10,
                padding: "8px 4px",
                background: ok ? "rgba(0,229,199,.12)" : "rgba(255,255,255,.05)",
                border: `1px solid ${ok ? "rgba(0,229,199,.4)" : "rgba(255,255,255,.12)"}`,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: ok ? "#00E5C7" : "#7C879B" }}>{pos}</div>
              <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: "#fff", marginTop: 2 }}>
                {counts[pos]}/{required[pos]}
              </div>
            </div>
          )
        })}
      </div>

      {budgetTotal != null ? (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 14 }}>
          <span style={{ fontSize: 13, color: "#9BA6BC", fontFamily: "var(--font-space-grotesk)" }}>
            Budget {spent} / {budgetTotal}
          </span>
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 14, color: overBudget ? "#FFB454" : "#fff" }}>
            {overBudget ? `${remaining} over` : `${remaining} left`}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function PositionPicker({ value, onChange }: { value: PlayerPosition; onChange: (p: PlayerPosition) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
      {POSITIONS.map((pos) => {
        const active = pos === value
        return (
          <button
            key={pos}
            type="button"
            onClick={() => onChange(pos)}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 12,
              cursor: "pointer",
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 13,
              border: `1.5px solid ${active ? "rgba(0,229,199,.55)" : "rgba(255,255,255,.12)"}`,
              background: active ? "rgba(0,229,199,.14)" : "rgba(255,255,255,.05)",
              color: active ? "#00E5C7" : "#9BA6BC",
              transition: "all .15s",
            }}
          >
            {pos}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------- small inputs */

/** Numeric variant of the shared Field (mobile numeric keypad). */
function NumberField({
  id,
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 14, opacity: disabled ? 0.5 : 1 }}>
      <label htmlFor={id} style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#7C879B" }}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 56,
          marginTop: 8,
          borderRadius: 16,
          background: "rgba(255,255,255,.05)",
          border: "1.5px solid rgba(255,255,255,.12)",
          padding: "0 18px",
          color: "#fff",
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 500,
          fontSize: 15,
          outline: "none",
        }}
      />
    </div>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "none",
        border: 0,
        cursor: "pointer",
        padding: "2px 2px 6px",
        marginTop: -4,
      }}
    >
      <span style={{ color: "#9BA6BC", fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 14 }}>{label}</span>
      <span
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: checked ? "#00E5C7" : "rgba(255,255,255,.15)",
          position: "relative",
          transition: "background .15s",
          flex: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "left .15s",
          }}
        />
      </span>
    </button>
  )
}

function primaryButtonStyle(disabled: boolean) {
  return {
    width: "100%",
    height: 54,
    border: 0,
    borderRadius: 16,
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "rgba(255,255,255,.07)" : "linear-gradient(150deg,#00E5C7,#0AAE9B)",
    color: disabled ? "#5E6878" : "#062018",
    fontFamily: "var(--font-archivo)",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: ".01em",
    boxShadow: disabled ? "none" : "0 10px 24px rgba(0,229,199,.32)",
  } as const
}
