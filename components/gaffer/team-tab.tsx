"use client"

import type { CardStyle, Player, Position, Team } from "@/lib/gaffer/types"
import { PlayerCard } from "./player-card"
import { BackButton, SectionLabel } from "./ui"

interface TeamTabProps {
  team: Team
  isDetail: boolean
  canEdit: boolean
  pitchView: boolean
  transferMode: boolean
  cardStyle: CardStyle
  transfers: number[]
  onBack: () => void
  onSetPitch: () => void
  onSetList: () => void
  onToggleTransfer: () => void
  onPlayerAction: (id: number) => void
}

const PERKS = [
  { label: "Triple Captain", icon: "©", used: false, accent: "#E8B23A" },
  { label: "Bench Boost", icon: "⬆", used: false, accent: "#00E5C7" },
  { label: "Free Hit", icon: "⚡", used: true, accent: "#FF2E7E" },
  { label: "Wildcard", icon: "🃏", used: false, accent: "#7B4DE0" },
]

const POS_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABEL: Record<Position, string> = {
  GK: "Goalkeeper",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
}

export function TeamTab(props: TeamTabProps) {
  const { team, isDetail, canEdit, pitchView, transferMode, cardStyle, transfers, onBack } = props
  const starters = team.squad.starters
  const bench = team.squad.bench

  const enrich = (p: Player) => {
    const selected = transfers.includes(p.id)
    return {
      key: p.id,
      player: p,
      selected,
      dim: transferMode && !selected,
      onClick: () => props.onPlayerAction(p.id),
    }
  }

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* header / banner */}
      <div style={{ padding: "54px 18px 16px", background: `linear-gradient(160deg, ${team.crestColor}33 0%, rgba(7,11,22,0) 78%)` }}>
        {isDetail ? <BackButton onClick={onBack} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span
            aria-hidden
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: team.crestColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-archivo)",
              fontWeight: 900,
              fontSize: 18,
              color: "#fff",
              boxShadow: "0 6px 16px rgba(0,0,0,.3)",
            }}
          >
            {team.crest}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 23, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {team.name}
            </h1>
            <div style={{ fontSize: 13, color: "#B9C2D6" }}>
              {team.owner} · Rank {team.rank}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 24, color: "#00E5C7", lineHeight: 1 }}>{team.pts}</div>
            <div style={{ fontSize: 10, color: "#8A93A8", letterSpacing: ".06em" }}>TOTAL PTS</div>
          </div>
        </div>
      </div>

      {/* perks */}
      <div style={{ padding: "4px 18px 0" }}>
        <SectionLabel style={{ marginBottom: 8 }}>CHIPS &amp; PERKS</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {PERKS.map((pk) => (
            <div
              key={pk.label}
              style={{
                flex: 1,
                borderRadius: 14,
                padding: "11px 6px 9px",
                textAlign: "center",
                background: pk.used ? "rgba(255,255,255,.025)" : "rgba(255,255,255,.05)",
                border: `1px solid ${pk.used ? "rgba(255,255,255,.06)" : pk.accent + "44"}`,
                position: "relative",
              }}
            >
              <div
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  margin: "0 auto 6px",
                  borderRadius: 9,
                  background: pk.used ? "rgba(255,255,255,.06)" : pk.accent + "22",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                }}
              >
                {pk.icon}
              </div>
              <div style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.15, color: pk.used ? "#5E6878" : "#C7CFDE" }}>{pk.label}</div>
              {pk.used ? (
                <div style={{ position: "absolute", top: 6, right: 6, fontSize: 8, fontWeight: 700, color: "#FF2E7E" }}>USED</div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* mode bar */}
      <div style={{ padding: "16px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 3 }}>
          <ModeButton label="Pitch" active={pitchView} onClick={props.onSetPitch} />
          <ModeButton label="List" active={!pitchView} onClick={props.onSetList} />
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={props.onToggleTransfer}
            style={{
              border: `1px solid ${transferMode ? "#FF2E7E" : "rgba(255,46,126,.32)"}`,
              cursor: "pointer",
              padding: "8px 15px",
              borderRadius: 11,
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: 13,
              background: transferMode ? "#FF2E7E" : "rgba(255,46,126,.12)",
              color: transferMode ? "#fff" : "#FF8AB6",
            }}
          >
            {transferMode ? "Done" : "Transfers"}
          </button>
        ) : null}
      </div>

      {transferMode ? (
        <div
          style={{
            margin: "0 18px 4px",
            padding: "9px 13px",
            borderRadius: 12,
            background: "rgba(255,46,126,.1)",
            border: "1px solid rgba(255,46,126,.3)",
            fontSize: 12,
            color: "#FFA9CC",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>⇄</span> Tap players to mark them for transfer.
        </div>
      ) : null}

      {/* PITCH VIEW */}
      {pitchView ? (
        <>
          <div
            style={{
              margin: "8px 14px 0",
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              background: "linear-gradient(175deg,#0E7A4A 0%,#0A6B40 50%,#085C37 100%)",
              padding: "14px 8px 12px",
            }}
          >
            {/* pitch lines */}
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 44px, transparent 44px 88px)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 90, height: 90, border: "1.5px solid rgba(255,255,255,.16)", borderRadius: "50%", borderTop: "none", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 150, height: 46, border: "1.5px solid rgba(255,255,255,.16)", borderTop: "none", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 13 }}>
              {POS_ORDER.map((pos) => (
                <div key={pos} style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                  {starters
                    .filter((p) => p.pos === pos)
                    .map(enrich)
                    .map((e) => (
                      <div key={e.key} style={{ width: 74 }}>
                        <PlayerCard player={e.player} selected={e.selected} dim={e.dim} cardStyle={cardStyle} onClick={e.onClick} />
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
          {/* bench */}
          <div style={{ margin: "12px 18px 0" }}>
            <SectionLabel style={{ marginBottom: 9 }}>SUBSTITUTES</SectionLabel>
            <div style={{ display: "flex", gap: 9 }}>
              {bench.map(enrich).map((e) => (
                <div key={e.key} style={{ flex: 1 }}>
                  <PlayerCard player={e.player} selected={e.selected} dim={e.dim} cardStyle={cardStyle} onClick={e.onClick} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* LIST VIEW */
        <div style={{ padding: "6px 18px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {POS_ORDER.map((pos) => (
            <div key={pos}>
              <SectionLabel style={{ marginBottom: 8 }}>{POS_LABEL[pos]}</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {starters
                  .filter((p) => p.pos === pos)
                  .map(enrich)
                  .map((e) => (
                    <PlayerCard key={e.key} player={e.player} layout="list" selected={e.selected} dim={e.dim} onClick={e.onClick} />
                  ))}
              </div>
            </div>
          ))}
          <div>
            <SectionLabel style={{ marginBottom: 8 }}>Substitutes</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {bench.map(enrich).map((e) => (
                <PlayerCard key={e.key} player={e.player} layout="list" selected={e.selected} dim={e.dim} onClick={e.onClick} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        cursor: "pointer",
        padding: "7px 14px",
        borderRadius: 9,
        fontFamily: "var(--font-space-grotesk)",
        fontWeight: 600,
        fontSize: 13,
        background: active ? "#00E5C7" : "transparent",
        color: active ? "#062018" : "#9BA6BC",
      }}
    >
      {label}
    </button>
  )
}
