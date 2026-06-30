"use client"

import type { Game, MatchEvent } from "@/lib/gaffer/types"
import { BackButton, SectionLabel } from "./ui"

function eventDot(type: MatchEvent["type"]) {
  return type === "goal" ? "#00E5C7" : type === "yellow" ? "#E8B23A" : type === "save" ? "#7B4DE0" : "#4D566B"
}

export function GameDetail({ game, onBack }: { game: Game; onBack: () => void }) {
  const statusColor = game.live ? "#FF2E7E" : game.upcoming ? "#8A93A8" : "#22B07A"
  const homeScore = game.upcoming ? "–" : game.homeScore
  const awayScore = game.upcoming ? "–" : game.awayScore

  return (
    <div>
      <div style={{ padding: "54px 18px 18px", background: "linear-gradient(165deg, rgba(0,229,199,.16), rgba(7,11,22,0) 80%)" }}>
        <BackButton onClick={onBack} />
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".04em", color: statusColor, marginBottom: 14 }}>
            {game.live ? (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF2E7E", animation: "fl-pulse 1.3s infinite" }} />
            ) : null}
            {game.statusLabel}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <TeamBlock color={game.homeColor} crest={game.homeCrest} name={game.home} />
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span style={scoreStyle}>{homeScore}</span>
              <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 22, color: "#4D566B" }}>-</span>
              <span style={scoreStyle}>{awayScore}</span>
            </div>
            <TeamBlock color={game.awayColor} crest={game.awayCrest} name={game.away} />
          </div>
        </div>
      </div>

      <div style={{ padding: "6px 18px 0" }}>
        <SectionLabel style={{ marginBottom: 12 }}>MATCH EVENTS</SectionLabel>
        <div style={{ position: "relative", paddingLeft: 8 }}>
          <div aria-hidden style={{ position: "absolute", left: 7, top: 6, bottom: 6, width: 2, background: "rgba(255,255,255,.08)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {game.events.map((ev, i) => (
              <EventRow key={i} event={ev} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const scoreStyle: React.CSSProperties = {
  fontFamily: "var(--font-archivo)",
  fontWeight: 900,
  fontSize: 46,
  color: "#fff",
  lineHeight: 1,
}

function TeamBlock({ color, crest, name }: { color: string; crest: string; name: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div
        aria-hidden
        style={{
          width: 54,
          height: 54,
          borderRadius: 15,
          margin: "0 auto 8px",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-archivo)",
          fontWeight: 900,
          fontSize: 18,
          color: "#fff",
        }}
      >
        {crest}
      </div>
      <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 13, color: "#E6EBF5" }}>{name}</div>
    </div>
  )
}

function EventRow({ event: ev }: { event: MatchEvent }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexDirection: ev.home ? "row" : "row-reverse" }}>
      <div
        aria-hidden
        style={{
          position: "relative",
          zIndex: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: eventDot(ev.type),
          flex: "none",
          boxShadow: "0 0 0 4px #070B16",
        }}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 9,
          flexDirection: ev.home ? "row" : "row-reverse",
          textAlign: ev.home ? "left" : "right",
        }}
      >
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: "#8A93A8", minWidth: 32 }}>{ev.minute}&apos;</span>
        <div style={{ borderRadius: 12, padding: "9px 13px", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexDirection: ev.home ? "row" : "row-reverse" }}>
            <span style={{ fontSize: 14 }}>{ev.icon}</span>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 13, color: "#F2F5FF" }}>{ev.player}</span>
          </div>
          <div style={{ fontSize: 11, color: "#8A93A8", marginTop: 2 }}>{ev.detail}</div>
        </div>
      </div>
    </div>
  )
}
