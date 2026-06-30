"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { Field, FormError } from "@/components/auth/auth-ui"
import { AdminShell, adminPrimaryStyle } from "@/components/admin/admin-shell"
import { Spinner } from "@/components/common/phone-screen"
import { createLeagueGame, deleteLeagueGame, fetchLeagueGames, type LeagueGame } from "@/lib/api/games"

const PAGE_LIMIT = 50

export default function AdminGamesPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AdminShell leagueId={id} title="Games" subtitle="Schedule fixtures or remove the ones you no longer need.">
      <GamesManager leagueId={id} />
    </AdminShell>
  )
}

function GamesManager({ leagueId }: { leagueId: string }) {
  const queryClient = useQueryClient()
  const { data, isPending, isError } = useQuery({
    queryKey: ["league-games", leagueId],
    queryFn: () => fetchLeagueGames(leagueId, 1, PAGE_LIMIT),
    retry: false,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["league-games", leagueId] })

  const [home, setHome] = useState("")
  const [away, setAway] = useState("")
  const [startDate, setStartDate] = useState("")
  const [error, setError] = useState("")

  const createMutation = useMutation({
    mutationFn: () =>
      createLeagueGame(leagueId, {
        startDate: new Date(startDate).toISOString(),
        home: { name: home.trim() },
        away: { name: away.trim() },
      }),
    onSuccess: () => {
      setHome("")
      setAway("")
      setStartDate("")
      invalidate()
    },
    onError: () => setError("Couldn't create the fixture. Check the details and try again."),
  })

  const deleteMutation = useMutation({
    mutationFn: (gameId: string) => deleteLeagueGame(leagueId, gameId),
    onSuccess: invalidate,
  })

  function create() {
    setError("")
    if (home.trim().length === 0 || away.trim().length === 0) return setError("Enter both team names.")
    if (!startDate || Number.isNaN(new Date(startDate).getTime())) return setError("Pick a valid kick-off date and time.")
    createMutation.mutate()
  }

  return (
    <div>
      {/* Create fixture */}
      <div style={{ borderRadius: 16, border: "1px solid rgba(0,229,199,.28)", background: "rgba(0,229,199,.06)", padding: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#7C879B" }}>NEW FIXTURE</span>
        {error ? <div style={{ marginTop: 10 }}><FormError message={error} /></div> : null}
        <div style={{ marginTop: 12 }}>
          <Field id="home" label="HOME TEAM" value={home} onChange={setHome} placeholder="e.g. Rovers" autoComplete="off" />
          <Field id="away" label="AWAY TEAM" value={away} onChange={setAway} placeholder="e.g. United" autoComplete="off" />

          <div style={{ marginBottom: 14 }}>
            <label htmlFor="start" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#7C879B" }}>
              KICK-OFF
            </label>
            <input
              id="start"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
                colorScheme: "dark",
              }}
            />
          </div>

          <button type="button" onClick={create} disabled={createMutation.isPending} style={adminPrimaryStyle(createMutation.isPending)}>
            {createMutation.isPending ? "Adding…" : "Add fixture"}
          </button>
        </div>
      </div>

      {/* Existing fixtures */}
      <div style={{ marginTop: 26 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", color: "#7C879B", margin: "0 0 14px" }}>FIXTURES</p>

        {isPending ? (
          <Spinner />
        ) : isError ? (
          <FormError message="Couldn't load fixtures." />
        ) : (data ?? []).length === 0 ? (
          <p style={{ fontSize: 14, color: "#9BA6BC" }}>No fixtures yet. Add your first one above.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {(data ?? []).map((game) => (
              <GameRow
                key={game.id}
                game={game}
                deleting={deleteMutation.isPending}
                onDelete={() => deleteMutation.mutate(game.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GameRow({ game, deleting, onDelete }: { game: LeagueGame; deleting: boolean; onDelete: () => void }) {
  const homeName = game.gameTeams.find((t) => t.side === "HOME")?.name ?? "Home"
  const awayName = game.gameTeams.find((t) => t.side === "AWAY")?.name ?? "Away"
  const when = new Date(game.startDate)
  const whenLabel = Number.isNaN(when.getTime())
    ? game.startDate
    : when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 16,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 15, color: "#fff" }}>
          {homeName} <span style={{ color: "#566" }}>vs</span> {awayName}
        </div>
        <div style={{ fontSize: 12, color: "#7C879B", marginTop: 2 }}>
          {whenLabel} · {game.status}
        </div>
      </div>
      <button
        type="button"
        disabled={deleting}
        onClick={onDelete}
        style={{
          height: 38,
          padding: "0 14px",
          borderRadius: 12,
          cursor: deleting ? "default" : "pointer",
          background: "rgba(255,107,107,.1)",
          border: "1px solid rgba(255,107,107,.35)",
          color: "#FF6B6B",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 13,
          flex: "none",
        }}
      >
        Delete
      </button>
    </div>
  )
}
