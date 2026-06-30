"use client"

interface JoinLeagueProps {
  code: string
  onCodeChange: (value: string) => void
  onSubmit: () => void
}

export function JoinLeague({ code, onCodeChange, onSubmit }: JoinLeagueProps) {
  const hasCode = code.length > 0

  return (
    <div style={{ minHeight: 850, padding: "84px 26px 40px", display: "flex", flexDirection: "column" }}>
      <div style={{ textAlign: "center" }}>
        <div
          aria-hidden
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            margin: "0 auto",
            background: "rgba(0,229,199,.12)",
            border: "1px solid rgba(0,229,199,.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 30 }}>🎟️</span>
        </div>
        <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 27, color: "#fff", margin: "24px 0 8px" }}>
          Join a league
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "0 auto", maxWidth: 280 }}>
          Ask your league admin for the invite code, then enter it below to take your seat.
        </p>
      </div>

      <div style={{ marginTop: 36 }}>
        <label htmlFor="league-code" style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".1em", color: "#7C879B" }}>
          LEAGUE CODE
        </label>
        <input
          id="league-code"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="e.g. THUNDER-2026"
          style={{
            marginTop: 8,
            width: "100%",
            height: 58,
            borderRadius: 16,
            background: "rgba(255,255,255,.05)",
            border: "1.5px solid rgba(255,255,255,.12)",
            padding: "0 18px",
            color: "#fff",
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          style={{
            marginTop: 14,
            width: "100%",
            border: 0,
            cursor: "pointer",
            height: 54,
            borderRadius: 16,
            background: hasCode ? "linear-gradient(150deg,#00E5C7,#0AAE9B)" : "rgba(255,255,255,.07)",
            color: hasCode ? "#062018" : "#5E6878",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 16,
            transition: "all .2s",
          }}
        >
          Enter league
        </button>
      </div>

      <div style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,.08)", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#7C879B", margin: "0 0 6px" }}>Don&apos;t have a code?</p>
        <button
          type="button"
          onClick={onSubmit}
          style={{
            background: "none",
            border: 0,
            cursor: "pointer",
            color: "#00E5C7",
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Start a new league →
        </button>
      </div>

      <span style={{ marginTop: "auto", textAlign: "center", fontSize: 11, color: "#566" }}>
        Tip: try any code to continue the demo
      </span>
    </div>
  )
}
