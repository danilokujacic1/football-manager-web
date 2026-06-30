"use client"

import type { Achievement, CardStyle, Player } from "@/lib/gaffer/types"
import { playerMatches } from "@/lib/gaffer/data"
import { PlayerCard } from "./player-card"
import { BackButton, SectionLabel } from "./ui"

interface PlayerDetailProps {
  player: Player
  achievements: Achievement[]
  cardStyle: CardStyle
  onBack: () => void
}

export function PlayerDetail({ player, achievements, cardStyle, onBack }: PlayerDetailProps) {
  const tint = player.jersey.includes("E8B23A") ? "rgba(232,178,58,.16)" : "rgba(0,229,199,.13)"
  const matches = playerMatches(player.id)

  return (
    <div>
      <div style={{ padding: "54px 18px 18px", background: `linear-gradient(170deg, ${tint} 0%, rgba(7,11,22,0) 75%)` }}>
        <BackButton onClick={onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 96, flex: "none" }}>
            <PlayerCard player={player} cardStyle={cardStyle} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#00E5C7", letterSpacing: ".04em" }}>
              {player.pos} · {player.club}
            </div>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 26, color: "#fff", margin: "4px 0 10px", lineHeight: 1.05 }}>
              {player.name}
            </h1>
            <div style={{ display: "flex", gap: 8 }}>
              <Stat value={player.pts} label="SEASON PTS" valueColor="#00E5C7" />
              <Stat value={player.rating} label="RATING" valueColor="#fff" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 18px 0" }}>
        <SectionLabel style={{ marginBottom: 10 }}>ACHIEVEMENTS</SectionLabel>
        <div className="scrl" style={{ display: "flex", gap: 9, overflowX: "auto" }}>
          {achievements.map((a) => (
            <div key={a.title} style={{ flex: "none", width: 118, borderRadius: 14, padding: 12, background: a.bg, border: `1px solid ${a.border}` }}>
              <div style={{ fontSize: 22, marginBottom: 7 }}>{a.icon}</div>
              <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 13, color: "#F2F5FF", lineHeight: 1.15 }}>{a.title}</div>
              <div style={{ fontSize: 10, color: "#8A93A8", marginTop: 3 }}>{a.meta}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "18px 18px 0" }}>
        <SectionLabel style={{ marginBottom: 10 }}>RECENT MATCHES</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {matches.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", borderRadius: 13, background: "rgba(255,255,255,.035)", border: "1px solid rgba(255,255,255,.07)" }}>
              <span
                aria-hidden
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: m.oppColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-archivo)",
                  fontWeight: 800,
                  fontSize: 10,
                  color: "#fff",
                  flex: "none",
                }}
              >
                {m.opp}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 13, color: "#F2F5FF" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#8A93A8" }}>{m.line}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "none" }}>
                <span style={{ fontSize: 12 }}>{m.tags}</span>
                <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 17, color: m.ptsColor, minWidth: 30, textAlign: "right" }}>{m.pts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, valueColor }: { value: number; label: string; valueColor: string }) {
  return (
    <div style={{ flex: 1, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 10px" }}>
      <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 21, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: "#8A93A8", letterSpacing: ".06em", marginTop: 2 }}>{label}</div>
    </div>
  )
}
