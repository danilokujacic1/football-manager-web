"use client"

import type { CSSProperties } from "react"

/** Small "‹ Back" pill used across the detail screens. */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(0,0,0,.25)",
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 30,
        padding: "6px 13px 6px 9px",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 16,
      }}
    >
      ‹ Back
    </button>
  )
}

/** Uppercase muted section heading. */
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".08em",
        color: "#7C879B",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
