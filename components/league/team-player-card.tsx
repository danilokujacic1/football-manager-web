"use client"

import type { Player } from "@/lib/api/teams"
import { lastName } from "@/lib/visual"

const FOIL_SHEEN =
  "linear-gradient(125deg, rgba(255,255,255,0) 38%, rgba(255,255,255,.22) 48%, rgba(0,229,199,.16) 54%, rgba(255,255,255,0) 64%)"

interface TeamPlayerCardProps {
  player: Player
  kitColor: string
  layout?: "pitch" | "list"
  isCaptain?: boolean
  isVice?: boolean
  selected?: boolean
  dim?: boolean
  onClick?: () => void
}

/** Player card for API-backed teams. Two layouts: compact "pitch" and "list" row. */
export function TeamPlayerCard({
  player,
  kitColor,
  layout = "pitch",
  isCaptain = false,
  isVice = false,
  selected = false,
  dim = false,
  onClick,
}: TeamPlayerCardProps) {
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
        <Kit color={kitColor} label={player.position} size={34} radius={9} fontSize={11} />
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
            {isCaptain ? <Armband kind="C" size={15} /> : isVice ? <Armband kind="V" size={15} /> : null}
          </div>
          <div style={{ fontSize: 11, color: "#8A93A8" }}>
            {player.position}
            {player.club ? ` · ${player.club}` : ""}
          </div>
        </div>
        {formatValue(player.value) ? (
          <div style={{ textAlign: "right", flex: "none" }}>
            <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 16, color: "#00E5C7", lineHeight: 1 }}>
              {formatValue(player.value)}
            </div>
            <div style={{ fontSize: 9, color: "#8A93A8", letterSpacing: ".06em", marginTop: 2 }}>VALUE</div>
          </div>
        ) : null}
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
      <Kit color={kitColor} label={player.position} size={38} radius={10} fontSize={13} marginBottom={5} inset />
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
        {lastName(player.name)}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 9,
          color: "#8A93A8",
          fontWeight: 600,
          letterSpacing: ".04em",
          maxWidth: "100%",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {player.club ?? player.position}
      </div>

      {isCaptain ? (
        <span style={{ position: "absolute", top: 6, left: 6 }}>
          <Armband kind="C" size={16} />
        </span>
      ) : isVice ? (
        <span style={{ position: "absolute", top: 6, left: 6 }}>
          <Armband kind="V" size={16} />
        </span>
      ) : null}

      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, background: FOIL_SHEEN, pointerEvents: "none", mixBlendMode: "screen" }}
      />
    </button>
  )
}

/** Formats the Decimal-string price to a compact label, or "" when zero/absent. */
function formatValue(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function Kit({
  color,
  label,
  size,
  radius,
  fontSize,
  marginBottom,
  inset,
}: {
  color: string
  label: string
  size: number
  radius: number
  fontSize: number
  marginBottom?: number
  inset?: boolean
}) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        fontSize,
        color: "#fff",
        flex: "none",
        marginBottom,
        boxShadow: inset ? "inset 0 -6px 12px rgba(0,0,0,.25)" : undefined,
      }}
    >
      {label}
    </span>
  )
}

function Armband({ kind, size }: { kind: "C" | "V"; size: number }) {
  const bg = kind === "C" ? "#E8B23A" : "#9BA6BC"
  return (
    <span
      aria-label={kind === "C" ? "Captain" : "Vice-captain"}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
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
      {kind}
    </span>
  )
}
