"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FormError } from "@/components/auth/auth-ui"
import { AdminShell, adminPrimaryStyle } from "@/components/admin/admin-shell"
import { Spinner } from "@/components/common/phone-screen"
import { fetchLeagueConfiguration, updateLeagueConfiguration } from "@/lib/api/leagues"

export default function AdminConfigurationPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AdminShell leagueId={id} title="Configuration" subtitle="Squad rules and budget for this league.">
      <ConfigurationForm leagueId={id} />
    </AdminShell>
  )
}

function ConfigurationForm({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ["league-configuration", leagueId],
    queryFn: () => fetchLeagueConfiguration(leagueId),
    retry: false,
  })

  const [maxPlayers, setMaxPlayers] = useState("")
  const [benchPlayers, setBenchPlayers] = useState("")
  const [unlimitedBudget, setUnlimitedBudget] = useState(false)
  const [budget, setBudget] = useState("")
  const [transfersPerRound, setTransfersPerRound] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)

  // Seed the form once the config loads.
  useEffect(() => {
    if (!data) return
    setMaxPlayers(String(data.maxPlayers))
    setBenchPlayers(String(data.benchPlayers))
    setUnlimitedBudget(data.budget == null)
    setBudget(data.budget == null ? "" : String(Math.trunc(Number(data.budget))))
    setTransfersPerRound(String(data.transfersPerRound))
  }, [data])

  const mutation = useMutation({
    mutationFn: () =>
      updateLeagueConfiguration(leagueId, {
        maxPlayers: Number(maxPlayers),
        benchPlayers: Number(benchPlayers),
        budget: unlimitedBudget ? null : Number(budget),
        transfersPerRound: Number(transfersPerRound),
      }),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ["league-configuration", leagueId] })
    },
    onError: () => setError("Couldn't save the configuration. Please try again."),
  })

  if (isPending) {
    return (
      <div style={{ marginTop: 40 }}>
        <Spinner />
      </div>
    )
  }
  if (isError) {
    return <FormError message="Couldn't load the configuration." />
  }

  function save() {
    setError("")
    setSaved(false)
    const inRange = (v: string, lo: number, hi: number) => {
      const n = Number(v)
      return Number.isInteger(n) && n >= lo && n <= hi
    }
    if (!inRange(maxPlayers, 1, 30)) return setError("Squad size must be a whole number between 1 and 30.")
    if (!inRange(benchPlayers, 0, 15)) return setError("Bench size must be a whole number between 0 and 15.")
    if (!unlimitedBudget && !inRange(budget, 0, Number.MAX_SAFE_INTEGER))
      return setError("Budget must be a whole number of 0 or more (or unlimited).")
    if (!inRange(transfersPerRound, 0, 50)) return setError("Transfers per round must be between 0 and 50.")
    mutation.mutate()
  }

  return (
    <div>
      {error ? <FormError message={error} /> : null}

      <AdminNumber id="cfg-max" label="SQUAD SIZE" value={maxPlayers} onChange={(v) => { setMaxPlayers(v); setSaved(false) }} />
      <AdminNumber id="cfg-bench" label="BENCH SIZE" value={benchPlayers} onChange={(v) => { setBenchPlayers(v); setSaved(false) }} />

      <AdminNumber
        id="cfg-budget"
        label="BUDGET"
        value={unlimitedBudget ? "" : budget}
        disabled={unlimitedBudget}
        placeholder={unlimitedBudget ? "Unlimited" : undefined}
        onChange={(v) => { setBudget(v); setSaved(false) }}
      />
      <ToggleRow
        label="Unlimited budget"
        checked={unlimitedBudget}
        onChange={(v) => { setUnlimitedBudget(v); setSaved(false) }}
      />

      <div style={{ marginTop: 14 }}>
        <AdminNumber
          id="cfg-transfers"
          label="TRANSFERS PER ROUND"
          value={transfersPerRound}
          onChange={(v) => { setTransfersPerRound(v); setSaved(false) }}
        />
      </div>

      <button type="button" onClick={save} disabled={mutation.isPending} style={{ ...adminPrimaryStyle(mutation.isPending), marginTop: 18 }}>
        {mutation.isPending ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </div>
  )
}

function AdminNumber({
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
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
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
