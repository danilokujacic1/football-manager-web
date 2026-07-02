"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
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

/**
 * Presets are written outfield-only (DEF-MID-FWD); a keeper is always implied.
 * The list covers every starting-XI size from 4 to 11 so a shape can always be
 * matched to the squad size chosen in step 2.
 */
type Preset = { key: string; def: number; mid: number; fwd: number }
const PRESETS: Preset[] = [
  { key: "1-1-1", def: 1, mid: 1, fwd: 1 }, // 4 starters
  { key: "2-1-1", def: 2, mid: 1, fwd: 1 }, // 5
  { key: "1-2-1", def: 1, mid: 2, fwd: 1 }, // 5
  { key: "2-2-1", def: 2, mid: 2, fwd: 1 }, // 6
  { key: "2-1-2", def: 2, mid: 1, fwd: 2 }, // 6
  { key: "3-2-1", def: 3, mid: 2, fwd: 1 }, // 7
  { key: "2-2-2", def: 2, mid: 2, fwd: 2 }, // 7
  { key: "3-3-1", def: 3, mid: 3, fwd: 1 }, // 8
  { key: "3-2-2", def: 3, mid: 2, fwd: 2 }, // 8
  { key: "3-3-2", def: 3, mid: 3, fwd: 2 }, // 9
  { key: "4-3-1", def: 4, mid: 3, fwd: 1 }, // 9
  { key: "4-3-2", def: 4, mid: 3, fwd: 2 }, // 10
  { key: "4-4-1", def: 4, mid: 4, fwd: 1 }, // 10
  { key: "4-4-2", def: 4, mid: 4, fwd: 2 }, // 11
  { key: "4-3-3", def: 4, mid: 3, fwd: 3 }, // 11
  { key: "3-5-2", def: 3, mid: 5, fwd: 2 }, // 11
]

/** Size of the starting XI a preset describes (outfield players + the implied GK). */
const startersOf = (p: Preset) => 1 + p.def + p.mid + p.fwd

/** A single editable row of the players field array. Strings, parsed on submit. */
interface PlayerRow {
  name: string
  position: PlayerPosition
  value: string
}

const emptyPlayer = (): PlayerRow => ({ name: "", position: "GK", value: "" })

export default function NewLeaguePage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(0)
  const [error, setError] = useState("")

  // Step 1 — name
  const [name, setName] = useState("")

  // Step 2 — configuration (squad size lives here; the formation only sets the shape)
  const [totalPlayers, setTotalPlayers] = useState("11")
  const [benchPlayers, setBenchPlayers] = useState("3")
  const [unlimitedBudget, setUnlimitedBudget] = useState(false)
  const [budget, setBudget] = useState("100")
  const [transfersPerRound, setTransfersPerRound] = useState("1")

  // Step 3 — formation (shape only; the starter count comes from step 2)
  const [formationMode, setFormationMode] = useState<"preset" | "free">("preset")
  const [presetKey, setPresetKey] = useState(PRESETS[0].key)

  // Step 4 — players field array
  const [players, setPlayers] = useState<PlayerRow[]>([emptyPlayer()])

  // ---- derived squad figures (size comes from step 2, shape from step 3) ----
  const totalNum = Number(totalPlayers)
  const benchNum = Number(benchPlayers)
  const validSizes = Number.isInteger(totalNum) && Number.isInteger(benchNum)
  const starters = validSizes ? totalNum - benchNum : 0

  // Presets whose starting XI (GK + outfield) matches the required starter count.
  const availablePresets = PRESETS.filter((p) => startersOf(p) === starters)
  const preset = availablePresets.find((p) => p.key === presetKey) ?? availablePresets[0] ?? null

  // Minimum players the pool must hold per position so a valid XI can be fielded.
  const required: Formation =
    formationMode === "preset" && preset
      ? { GK: 1, DEF: preset.def, MID: preset.mid, FWD: preset.fwd }
      : { GK: 1, DEF: 1, MID: 1, FWD: 1 }
  const minSquad = validSizes ? starters + benchNum : 0

  // Keep the selected preset valid whenever the starter count changes.
  useEffect(() => {
    if (availablePresets.length > 0 && !availablePresets.some((p) => p.key === presetKey)) {
      setPresetKey(availablePresets[0].key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starters])

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
          // Persist the chosen starting formation. Preset mode's `required` sums
          // to `starters` (= maxPlayers), which the backend requires. Free mode has
          // no fixed shape, so it's omitted and the backend keeps its defaults.
          ...(formationMode === "preset" && preset ? { positionCounts: required } : {}),
        },
        players: named.map<NewLeaguePlayer>((p) => ({
          name: p.name.trim(),
          position: p.position,
          ...(p.value.trim() ? { value: Number(p.value) } : {}),
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
      if (!inRange(totalPlayers, 4, 11)) return "Total squad size must be a whole number between 4 and 11."
      if (!inRange(benchPlayers, 0, 3)) return "Bench size must be a whole number between 0 and 3."
      if (starters < 4)
        return "Leave room for at least 4 starters (total players minus bench must be 4 or more)."
      if (!unlimitedBudget && !inRange(budget, 0, Number.MAX_SAFE_INTEGER))
        return "Budget must be a whole number of 0 or more (or set it to unlimited)."
      if (!inRange(transfersPerRound, 0, 50)) return "Transfers per round must be between 0 and 50."
      return null
    }

    if (current === 2) {
      if (formationMode === "preset" && !preset)
        return "No preset fits this squad size. Switch to a free formation or adjust the squad size."
      return null
    }

    if (current === 3) {
      if (named.length === 0) return "Add at least one player (a name is required)."
      if (named.some((p) => p.name.trim().length > 80)) return "Player names must be 80 characters or fewer."
      if (named.some((p) => p.value.trim() && !(Number(p.value) >= 0))) return "Player values must be 0 or more."
      // With a budget in play, every player needs a value to draft against it.
      if (budgetTotal != null && named.some((p) => !p.value.trim() || !(Number(p.value) >= 0)))
        return "Every player needs a value when the league has a budget."

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

  /**
   * Spread the whole budget evenly across every player row. Any indivisible
   * remainder is handed out a unit at a time so the values sum to exactly the
   * budget (no rounding drift). Only meaningful when a finite budget is set.
   */
  const autofillValues = () =>
    setPlayers((rows) => {
      if (budgetTotal == null || rows.length === 0) return rows
      const base = Math.floor(budgetTotal / rows.length)
      let remainder = budgetTotal - base * rows.length
      return rows.map((row) => {
        const extra = remainder > 0 ? 1 : 0
        remainder -= extra
        return { ...row, value: String(base + extra) }
      })
    })

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
              {step === 1 && "Set the squad size, bench, budget and transfer rules. You can change these later."}
              {step === 2 && "Pick the starting shape. Only formations that fit your squad size are shown."}
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
                totalPlayers={totalPlayers}
                benchPlayers={benchPlayers}
                budget={budget}
                unlimitedBudget={unlimitedBudget}
                transfersPerRound={transfersPerRound}
                onTotalPlayers={setTotalPlayers}
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
                availablePresets={availablePresets}
                required={required}
                starters={starters}
                onMode={setFormationMode}
                onPreset={setPresetKey}
              />
            )}

            {step === 3 && (
              <PlayersStep
                players={players}
                onUpdate={updatePlayer}
                onRemove={removePlayer}
                onAdd={addPlayer}
                onAutofill={autofillValues}
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
  totalPlayers,
  benchPlayers,
  budget,
  unlimitedBudget,
  transfersPerRound,
  onTotalPlayers,
  onBenchPlayers,
  onBudget,
  onUnlimitedBudget,
  onTransfersPerRound,
}: {
  totalPlayers: string
  benchPlayers: string
  budget: string
  unlimitedBudget: boolean
  transfersPerRound: string
  onTotalPlayers: (v: string) => void
  onBenchPlayers: (v: string) => void
  onBudget: (v: string) => void
  onUnlimitedBudget: (v: boolean) => void
  onTransfersPerRound: (v: string) => void
}) {
  const total = Number(totalPlayers)
  const bench = Number(benchPlayers)
  const starters = Number.isInteger(total) && Number.isInteger(bench) ? total - bench : null

  return (
    <div>
      <NumberField id="total-players" label="TOTAL SQUAD SIZE (MAX 11)" value={totalPlayers} onChange={onTotalPlayers} />
      <NumberField id="bench-players" label="BENCH SIZE (MAX 3)" value={benchPlayers} onChange={onBenchPlayers} />
      <p style={{ fontSize: 13, color: "#9BA6BC", margin: "-4px 0 14px", fontFamily: "var(--font-space-grotesk)" }}>
        {starters != null && starters >= 1
          ? `${starters} starter${starters === 1 ? "" : "s"} + ${bench} bench = ${total} players per team.`
          : "Total minus bench sets how many starters each team fields."}
      </p>

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
  availablePresets,
  required,
  starters,
  onMode,
  onPreset,
}: {
  mode: "preset" | "free"
  presetKey: string
  availablePresets: Preset[]
  required: Formation
  starters: number
  onMode: (m: "preset" | "free") => void
  onPreset: (key: string) => void
}) {
  const hasPresets = availablePresets.length > 0

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <ModeTab label="Preset formation" active={mode === "preset"} onClick={() => onMode("preset")} />
        <ModeTab label="Free formation" active={mode === "free"} onClick={() => onMode("free")} />
      </div>

      <Pitch formation={mode === "preset" ? required : { GK: 1, DEF: 1, MID: 1, FWD: 1 }} free={mode === "free"} />

      {mode === "preset" ? (
        hasPresets ? (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
              {availablePresets.map((p) => {
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
              {starters} starters: 1 GK · {required.DEF} DEF · {required.MID} MID · {required.FWD} FWD. The pool must
              cover at least this many of each position.
            </p>
          </>
        ) : (
          <p style={{ fontSize: 13, color: "#FFB454", margin: "18px 0 0", fontFamily: "var(--font-space-grotesk)" }}>
            No preset fits a {starters}-player starting XI. Switch to a free formation, or go back and adjust the squad
            size.
          </p>
        )
      ) : (
        <p style={{ fontSize: 13, color: "#9BA6BC", margin: "18px 0 0", fontFamily: "var(--font-space-grotesk)" }}>
          {starters} starters, any shape. The pool just needs at least one player in every position (GK, DEF, MID, FWD).
        </p>
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
      {/* goal — sits behind the GK at the bottom of the pitch */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 6,
          left: "50%",
          transform: "translateX(-50%)",
          width: 96,
          height: 26,
          borderTop: "3px solid rgba(255,255,255,.85)",
          borderLeft: "3px solid rgba(255,255,255,.85)",
          borderRight: "3px solid rgba(255,255,255,.85)",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 1px, transparent 1px 9px)," +
            "repeating-linear-gradient(0deg, rgba(255,255,255,.22) 0 1px, transparent 1px 9px)",
          zIndex: 0,
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
  onAutofill,
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
  onAutofill: () => void
  budgetTotal: number | null
  spent: number
  remaining: number | null
  required: Formation
  counts: Formation
  minSquad: number
  namedCount: number
}) {
  // Indices of cards the user has collapsed; new cards start expanded.
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const toggleCollapsed = (index: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })

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

      {budgetTotal != null && budgetTotal > 0 ? (
        <button
          type="button"
          onClick={onAutofill}
          style={{
            height: 46,
            borderRadius: 14,
            border: "1.5px solid rgba(0,229,199,.4)",
            background: "rgba(0,229,199,.1)",
            color: "#00E5C7",
            cursor: "pointer",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 13,
          }}
        >
          Autofill values to spend the {budgetTotal} budget
        </button>
      ) : null}

      {players.map((player, i) => {
        const isCollapsed = collapsed.has(i)
        return (
          <div
            key={i}
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.1)",
              background: "rgba(255,255,255,.04)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isCollapsed ? 0 : 6 }}>
              <button
                type="button"
                onClick={() => toggleCollapsed(i)}
                aria-expanded={!isCollapsed}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  color: "#7C879B",
                }}
              >
                <span aria-hidden style={{ fontSize: 12, transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform .15s" }}>
                  ▾
                </span>
                PLAYER {i + 1}
              </button>
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

            {isCollapsed ? (
              <button
                type="button"
                onClick={() => toggleCollapsed(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  marginTop: 10,
                  background: "none",
                  border: 0,
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    minWidth: 40,
                    textAlign: "center",
                    borderRadius: 8,
                    padding: "4px 8px",
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#00E5C7",
                    background: "rgba(0,229,199,.12)",
                    border: "1px solid rgba(0,229,199,.35)",
                    fontFamily: "var(--font-archivo)",
                  }}
                >
                  {player.position}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    color: player.name.trim() ? "#F2F5FF" : "#7C879B",
                    fontFamily: "var(--font-space-grotesk)",
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {player.name.trim() || "Unnamed player"}
                </span>
                {player.value.trim() ? (
                  <span style={{ flex: "none", fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 14, color: "#00E5C7" }}>
                    {player.value}
                  </span>
                ) : null}
              </button>
            ) : (
              <>
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

                <div style={{ marginTop: 14 }}>
                  <NumberField
                    id={`player-value-${i}`}
                    label={budgetTotal != null ? "VALUE" : "VALUE (OPTIONAL)"}
                    value={player.value}
                    onChange={(v) => onUpdate(i, { value: v })}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>
        )
      })}

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
