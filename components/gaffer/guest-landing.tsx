"use client"

import Link from "next/link"

export function GuestLanding({ onSignUp }: { onSignUp: () => void }) {
  // onSignUp is kept for the in-app demo flow; the landing CTAs now route to
  // the dedicated /register and /login screens.
  void onSignUp
  return (
    <div
      style={{
        minHeight: 850,
        padding: "78px 26px 40px",
        display: "flex",
        flexDirection: "column",
        background: "radial-gradient(120% 60% at 50% 0%, rgba(0,229,199,.14), transparent 55%)",
      }}
    >
      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: "auto" }}>
        <div
          aria-hidden
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "linear-gradient(150deg,#00E5C7,#0F9C8B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-archivo)",
            fontWeight: 900,
            color: "#062018",
            fontSize: 16,
          }}
        >
          G
        </div>
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 16, letterSpacing: ".02em", color: "#fff" }}>
          GAFFER
        </span>
      </div>

      <div style={{ margin: "40px 0 0" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 11px",
            borderRadius: 30,
            background: "rgba(0,229,199,.12)",
            border: "1px solid rgba(0,229,199,.3)",
            marginBottom: 20,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5C7", animation: "fl-pulse 1.6s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#00E5C7", letterSpacing: ".04em" }}>SEASON 12 · NOW LIVE</span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-archivo)",
            fontWeight: 900,
            fontSize: 46,
            lineHeight: 0.96,
            letterSpacing: "-.02em",
            color: "#fff",
            margin: 0,
            textWrap: "balance",
          }}
        >
          BUILD YOUR
          <br />
          <span style={{ color: "#00E5C7" }}>DREAM XI.</span>
          <br />
          RULE THE LEAGUE.
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "#9BA6BC", margin: "18px 0 0", maxWidth: 300 }}>
          Draft real players, play your perks, and climb the table against your mates — one matchweek at a time.
        </p>
      </div>

      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 11 }}>
        <Link
          href="/register"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            height: 54,
            borderRadius: 16,
            background: "linear-gradient(150deg,#00E5C7,#0AAE9B)",
            color: "#062018",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 16,
            letterSpacing: ".01em",
            boxShadow: "0 10px 24px rgba(0,229,199,.32)",
          }}
        >
          Create your account
        </Link>
        <Link
          href="/login"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,.14)",
            height: 54,
            borderRadius: 16,
            background: "rgba(255,255,255,.04)",
            color: "#fff",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          I already have an account
        </Link>
        <p style={{ textAlign: "center", fontSize: 11, color: "#677085", margin: "6px 0 0" }}>
          Free to play · No card required
        </p>
      </div>
    </div>
  )
}
