"use client"

import type { CardStyle, Player } from "@/lib/gaffer/types"

interface PlayerCardProps {
  player: Player
  layout?: "pitch" | "list"
  cardStyle?: CardStyle
  selected?: boolean
  dim?: boolean
  onClick?: () => void
}

const FOIL_SHEEN =
  "linear-gradient(125deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.22) 48%, rgba(0,229,199,.16) 54%, rgba(255,255,255,0) 64%)"

/**
 * A fantasy player card. Renders in two layouts:
 *  - "pitch": compact vertical card used on the formation pitch and bench
 *  - "list": horizontal row used in the list view
 */
export function PlayerCard({
  player,
  layout = "pitch",
  cardStyle = "foil",
  selected = false,
  dim = false,
  onClick,
}: PlayerCardProps) {
  const isFoil = cardStyle === "foil"

  if (layout === "list") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          width: "100%",
          height: 58,
          cursor: onClick ? "pointer" : "default",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 13px",
          borderRadius: 14,
          textAlign: "left",
          background: selected ? "rgba(255,46,126,.12)" : "rgba(255,255,255,.04)",
          border: `1px solid ${selected ? "rgba(255,46,126,.4)" : "rgba(255,255,255,.07)"}`,
          opacity: dim ? 0.4 : 1,
          transition: "opacity .15s, background .15s",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: player.jersey,
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
          {player.num}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 600,
              fontSize: 14,
              color: "#F2F5FF",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {player.name}
            {player.captain ? <CaptainBadge size={15} /> : null}
          </div>
          <div style={{ fontSize: 11, color: "#8A93A8" }}>
            {player.pos} · {player.club}
          </div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 16, color: "#00E5C7", lineHeight: 1 }}>
            {player.pts}
          </div>
          <div style={{ fontSize: 9, color: "#8A93A8", letterSpacing: ".06em", marginTop: 2 }}>PTS</div>
        </div>
      </button>
    )
  }

  // pitch layout
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        height: 100,
        cursor: onClick ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "8px 4px 7px",
        borderRadius: 13,
        overflow: "hidden",
        background: "rgba(7,11,22,.55)",
        border: `1.5px solid ${selected ? "#FF2E7E" : "rgba(255,255,255,.14)"}`,
        boxShadow: selected ? "0 0 0 2px rgba(255,46,126,.35)" : "0 4px 12px rgba(0,0,0,.3)",
        opacity: dim ? 0.4 : 1,
        transition: "opacity .15s, border-color .15s",
      }}
    >
      {/* jersey */}
      <div
        aria-hidden
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: player.jersey,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 14,
          color: "#fff",
          marginBottom: 5,
          boxShadow: "inset 0 -6px 12px rgba(0,0,0,.25)",
        }}
      >
        {player.num}
      </div>
      <div
        style={{
          fontFamily: "var(--font-space-grotesk)",
          fontWeight: 600,
          fontSize: 11,
          color: "#F2F5FF",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {player.name.split(" ").slice(-1)[0]}
      </div>
      <div
        style={{
          marginTop: 3,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontFamily: "var(--font-archivo)",
          fontWeight: 900,
          fontSize: 12,
          color: "#00E5C7",
        }}
      >
        {player.pts}
        <span style={{ fontSize: 8, color: "#8A93A8", fontWeight: 600, letterSpacing: ".04em" }}>PTS</span>
      </div>

      {player.captain ? (
        <span style={{ position: "absolute", top: 6, left: 6 }}>
          <CaptainBadge size={16} />
        </span>
      ) : null}

      {isFoil ? (
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, background: FOIL_SHEEN, pointerEvents: "none", mixBlendMode: "screen" }}
        />
      ) : null}
    </button>
  )
}

function CaptainBadge({ size }: { size: number }) {
  return (
    <span
      aria-label="Captain"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#E8B23A",
        color: "#1a1300",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-archivo)",
        fontWeight: 900,
        fontSize: size * 0.62,
        flex: "none",
      }}
    >
      C
    </span>
  )
}
