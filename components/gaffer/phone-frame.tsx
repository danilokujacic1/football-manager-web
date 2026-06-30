import type { ReactNode } from "react"

/**
 * Full-bleed app container. Fills the entire viewport on every screen size
 * (no device frame, no status bar) and provides the positioning context for
 * the absolutely-positioned screen content.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        position: "relative",
        overflow: "hidden",
        background: "#070B16",
        fontFamily: "var(--font-space-grotesk), sans-serif",
      }}
    >
      {children}
    </div>
  )
}
