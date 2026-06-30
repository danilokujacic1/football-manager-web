"use client"

import type { ReactNode } from "react"
import { PhoneFrame } from "@/components/gaffer/phone-frame"

/** A phone-frame screen with content centered both axes (loaders, status). */
export function CenteredPhoneScreen({ children }: { children: ReactNode }) {
  return (
    <PhoneFrame>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          background: "radial-gradient(120% 60% at 50% 0%, rgba(0,229,199,.14), transparent 55%)",
        }}
      >
        {children}
      </div>
    </PhoneFrame>
  )
}

/** Teal ring spinner (relies on the fl-spin keyframe in globals.css). */
export function Spinner({ size = 44 }: { size?: number }) {
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        margin: "0 auto",
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,.12)",
        borderTopColor: "#00E5C7",
        animation: "fl-spin .8s linear infinite",
      }}
    />
  )
}

/** Full-screen loader inside the phone frame. */
export function LoadingScreen({ message = "Loading…" }: { message?: string }) {
  return (
    <CenteredPhoneScreen>
      <div style={{ textAlign: "center" }}>
        <Spinner />
        <p
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: 14,
            color: "#9BA6BC",
            margin: "20px 0 0",
          }}
        >
          {message}
        </p>
      </div>
    </CenteredPhoneScreen>
  )
}
