"use client"

import type { Team } from "@/lib/gaffer/types"

interface LeagueTabProps {
  standings: Team[]
  onOpenTeam: (id: number) => void
}

export function LeagueTab({ standings, onOpenTeam }: LeagueTabProps) {
  return (
    <div style={{ padding: "58px 18px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>PREMIER FANTASY · 12 MANAGERS</div>
      <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: "3px 0 16px" }}>
        League Table
      </h1>

      <div style={{ display: "flex", alignItems: "center", padding: "0 14px 8px", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", color: "#677085" }}>
        <span style={{ width: 26 }}>#</span>
        <span style={{ flex: 1 }}>MANAGER</span>
        <span style={{ width: 42, textAlign: "center" }}>GW</span>
        <span style={{ width: 52, textAlign: "right" }}>TOTAL</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {standings.map((t) => (
          <StandingRow key={t.id} team={t} onOpen={() => onOpenTeam(t.id)} />
        ))}
      </div>
    </div>
  )
}

function StandingRow({ team: t, onOpen }: { team: Team; onOpen: () => void }) {
  const isMe = t.id === 0
  const rankColor = t.rank <= 3 ? "#E8B23A" : "#8A93A8"

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "11px 14px",
        borderRadius: 15,
        background: isMe ? "rgba(0,229,199,.08)" : "rgba(255,255,255,.035)",
        border: `1px solid ${isMe ? "rgba(0,229,199,.3)" : "rgba(255,255,255,.07)"}`,
      }}
    >
      <span style={{ width: 26, fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 15, color: rankColor }}>{t.rank}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: t.crestColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 12,
            color: "#fff",
            flex: "none",
          }}
        >
          {t.crest}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 14, color: "#F2F5FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t.name}
          </div>
          <div style={{ fontSize: 11, color: "#8A93A8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.owner}</div>
        </div>
      </div>
      <span style={{ width: 42, textAlign: "center", fontFamily: "var(--font-archivo)", fontWeight: 700, fontSize: 13, color: "#B9C2D6" }}>{t.gw}</span>
      <span style={{ width: 52, textAlign: "right", fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 17, color: "#fff" }}>{t.pts}</span>
    </button>
  )
}
