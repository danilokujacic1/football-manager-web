"use client"

import type { Game } from "@/lib/gaffer/types"

interface GamesTabProps {
  games: Game[]
  page: number
  totalPages: number
  onOpenGame: (id: number) => void
  onPrev: () => void
  onNext: () => void
}

export function GamesTab({ games, page, totalPages, onOpenGame, onPrev, onNext }: GamesTabProps) {
  return (
    <div style={{ padding: "58px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>MATCHWEEK 24</div>
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: "3px 0 0" }}>
            Fixtures
          </h1>
        </div>
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
          <span style={{ fontSize: 11, fontWeight: 700, color: "#FF2E7E" }}>2 LIVE</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {games.map((g) => (
          <GameRow key={g.id} game={g} onOpen={() => onOpenGame(g.id)} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18 }}>
        <PagerButton label="‹" onClick={onPrev} disabled={page <= 1} />
        <span style={{ fontSize: 13, color: "#8A93A8", fontWeight: 600, minWidth: 96, textAlign: "center" }}>
          Page {page} of {totalPages}
        </span>
        <PagerButton label="›" onClick={onNext} disabled={page >= totalPages} />
      </div>
    </div>
  )
}

function GameRow({ game: g, onOpen }: { game: Game; onOpen: () => void }) {
  const statusColor = g.live ? "#FF2E7E" : g.upcoming ? "#8A93A8" : "#22B07A"
  const homeScore = g.upcoming ? "–" : g.homeScore
  const awayScore = g.upcoming ? "–" : g.awayScore
  const homeScoreColor = g.upcoming ? "#566" : g.homeScore >= g.awayScore ? "#fff" : "#7C879B"
  const awayScoreColor = g.upcoming ? "#566" : g.awayScore >= g.homeScore ? "#fff" : "#7C879B"
  const when = g.upcoming ? "Matchweek 24" : "Matchweek 23"

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        borderRadius: 18,
        padding: "13px 15px",
        background: g.live ? "rgba(255,46,126,.07)" : "rgba(255,255,255,.035)",
        border: `1px solid ${g.live ? "rgba(255,46,126,.28)" : "rgba(255,255,255,.07)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".06em", color: "#8A93A8" }}>{when}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: ".04em", color: statusColor }}>
          {g.live ? (
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#FF2E7E", animation: "fl-pulse 1.3s infinite" }} />
          ) : null}
          {g.statusLabel}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <Crest color={g.homeColor} label={g.homeCrest} />
          <span style={teamNameStyle}>{g.home}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", flex: "none" }}>
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 22, color: homeScoreColor }}>{homeScore}</span>
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 13, color: "#4D566B" }}>:</span>
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 22, color: awayScoreColor }}>{awayScore}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, justifyContent: "flex-end" }}>
          <span style={{ ...teamNameStyle, textAlign: "right" }}>{g.away}</span>
          <Crest color={g.awayColor} label={g.awayCrest} />
        </div>
      </div>
    </button>
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

function Crest({ color, label }: { color: string; label: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        background: color,
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
      {label}
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
