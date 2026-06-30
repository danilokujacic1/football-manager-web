"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Spinner } from "@/components/common/phone-screen"
import { fetchLeagueGames, type GameStatus, type LeagueGame } from "@/lib/api/games"
import { colorFromString, initials } from "@/lib/visual"

const LIMIT = 8

export function LeagueGamesTab({ leagueId }: { leagueId: string }) {
  const [page, setPage] = useState(1)

  const { data, isPending, isError, isFetching } = useQuery({
    queryKey: ["league-games", leagueId, page, LIMIT],
    queryFn: () => fetchLeagueGames(leagueId, page, LIMIT),
    placeholderData: keepPreviousData,
  })

  const games = data ?? []
  const liveCount = games.filter((g) => isLive(g.status)).length
  // No total count from the API: "next" is available only while the page is full.
  const hasNext = games.length === LIMIT
  const hasPrev = page > 1

  return (
    <div style={{ padding: "58px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>FIXTURES</div>
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: "3px 0 0" }}>
            Games
          </h1>
        </div>
        {liveCount > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 11px",
              borderRadius: 30,
              background: "rgba(255,46,126,.14)",
              border: "1px solid rgba(255,46,126,.32)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF2E7E", animation: "fl-pulse 1.4s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#FF2E7E" }}>{liveCount} LIVE</span>
          </div>
        ) : null}
      </div>

      {isPending ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "90px 0" }}>
          <Spinner />
        </div>
      ) : isError ? (
        <p style={{ textAlign: "center", color: "#9BA6BC", fontSize: 14, padding: "60px 0" }}>
          Couldn&apos;t load fixtures. Please try again.
        </p>
      ) : games.length === 0 ? (
        <p style={{ textAlign: "center", color: "#8A93A8", fontSize: 14, padding: "60px 0" }}>
          No fixtures yet.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: isFetching ? 0.6 : 1, transition: "opacity .15s" }}>
            {games.map((g) => (
              <GameRow key={g.id} game={g} />
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}>
            <PagerButton label="‹" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!hasPrev} />
            <span style={{ fontSize: 13, color: "#8A93A8", fontWeight: 600, minWidth: 72, textAlign: "center" }}>
              Page {page}
            </span>
            <PagerButton label="›" onClick={() => setPage((p) => p + 1)} disabled={!hasNext} />
          </div>
        </>
      )}
    </div>
  )
}

function GameRow({ game }: { game: LeagueGame }) {
  const home = game.gameTeams.find((t) => t.side === "HOME") ?? game.gameTeams[0]
  const away = game.gameTeams.find((t) => t.side === "AWAY") ?? game.gameTeams[1]
  const live = isLive(game.status)
  const meta = statusMeta(game.status)

  return (
    <div
      style={{
        width: "100%",
        borderRadius: 18,
        padding: "13px 15px",
        background: live ? "rgba(255,46,126,.07)" : "rgba(255,255,255,.035)",
        border: `1px solid ${live ? "rgba(255,46,126,.28)" : "rgba(255,255,255,.07)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", color: "#8A93A8" }}>
          {formatKickoff(game.startDate)}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: ".04em",
            color: meta.color,
          }}
        >
          {live ? (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF2E7E", animation: "fl-pulse 1.3s infinite" }} />
          ) : null}
          {meta.label}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Crest name={home?.name ?? "?"} />
          <span style={teamNameStyle}>{home?.name ?? "TBD"}</span>
        </div>
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 13, color: "#4D566B", padding: "0 12px", flex: "none" }}>
          vs
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
          <span style={{ ...teamNameStyle, textAlign: "right" }}>{away?.name ?? "TBD"}</span>
          <Crest name={away?.name ?? "?"} />
        </div>
      </div>
    </div>
  )
}

const teamNameStyle: React.CSSProperties = {
  fontFamily: "var(--font-space-grotesk)",
  fontWeight: 600,
  fontSize: 15,
  color: "#F2F5FF",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}

function Crest({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: colorFromString(name),
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
      {initials(name)}
    </span>
  )
}

function PagerButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,.12)",
        background: "rgba(255,255,255,.04)",
        color: "#fff",
        fontSize: 16,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  )
}

// --- helpers ---

function isLive(status: GameStatus): boolean {
  return status === "LIVE"
}

function statusMeta(status: GameStatus): { label: string; color: string } {
  if (status === "LIVE") return { label: "LIVE", color: "#FF2E7E" }
  if (status === "FINISHED") return { label: "Full time", color: "#22B07A" }
  return { label: "Scheduled", color: "#8A93A8" }
}

function formatKickoff(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}
