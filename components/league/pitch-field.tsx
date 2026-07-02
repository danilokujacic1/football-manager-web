import type { CSSProperties, ReactNode } from "react"

/**
 * Shared pitch chrome used by team-builder, team-view, and league-formation.
 *
 * Renders:
 *  - Grass gradient background
 *  - Alternating mow-stripe overlay
 *  - Full centre circle (centred)
 *  - Goal frame with net at the GK end (bottom-centre, zIndex 0 — behind player cards)
 *
 * Orientation: attack flows upward (FWD at top → GK at bottom → goal at bottom).
 * Callers should render rows from FWD down to GK.
 *
 * `contentStyle` controls the inner flex wrapper; use it to set gap, minHeight, etc.
 */
export function PitchField({
  children,
  style,
  contentStyle,
}: {
  children: ReactNode
  /** Extra styles merged onto the outer pitch wrapper (e.g. margin, borderRadius override). */
  style?: CSSProperties
  /** Styles for the inner content wrapper — defaults to flex column with gap 14. */
  contentStyle?: CSSProperties
}) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        background: "linear-gradient(175deg,#0E7A4A 0%,#0A6B40 50%,#085C37 100%)",
        padding: "16px 8px 14px",
        ...style,
      }}
    >
      {/* Alternating mow stripes */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 44px, transparent 44px 88px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Centre circle */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,.16)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Goal frame at GK end (bottom-centre). zIndex 0 keeps it behind player cards. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: 4,
          left: "50%",
          transform: "translateX(-50%)",
          width: 66,
          height: 20,
          borderTop: "2px solid rgba(255,255,255,.75)",
          borderLeft: "2px solid rgba(255,255,255,.75)",
          borderRight: "2px solid rgba(255,255,255,.75)",
          borderTopLeftRadius: 4,
          borderTopRightRadius: 4,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,.18) 0 1px, transparent 1px 8px), repeating-linear-gradient(0deg, rgba(255,255,255,.18) 0 1px, transparent 1px 8px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content — sits above all pitch decorations */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
