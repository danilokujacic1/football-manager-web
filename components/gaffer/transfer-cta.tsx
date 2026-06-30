"use client"

interface TransferCTAProps {
  count: number
  bottomInset: number
  onConfirm: () => void
}

/** Floating confirm bar shown while marking players for transfer. */
export function TransferCTA({ count, bottomInset, onConfirm }: TransferCTAProps) {
  const noun = count === 1 ? "player" : "players"
  const cost = (count * 4.5).toFixed(1)

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomInset,
        padding: "14px 18px 16px",
        background: "linear-gradient(0deg,#070B16 60%,transparent)",
        zIndex: 55,
        animation: "fl-rise .25s ease",
      }}
    >
      <button
        type="button"
        onClick={onConfirm}
        style={{
          width: "100%",
          height: 52,
          border: 0,
          borderRadius: 16,
          cursor: "pointer",
          background: "linear-gradient(150deg,#FF2E7E,#D11860)",
          color: "#fff",
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: 15,
          boxShadow: "0 10px 26px rgba(255,46,126,.36)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
        }}
      >
        <span>
          Transfer {count} {noun}
        </span>
        <span style={{ background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "2px 8px", fontSize: 13 }}>
          £{cost}m
        </span>
      </button>
    </div>
  )
}
