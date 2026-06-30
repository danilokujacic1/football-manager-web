"use client"

import type { Tab } from "@/lib/gaffer/types"

const NAV_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: "games", label: "Fixtures", icon: "⚽" },
  { key: "league", label: "League", icon: "🏆" },
  { key: "team", label: "My Team", icon: "👕" },
]

export function BottomNav({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  return (
    <nav
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 78,
        background: "rgba(9,13,24,.92)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(255,255,255,.08)",
        display: "flex",
        alignItems: "flex-start",
        padding: "11px 8px 0",
        zIndex: 50,
      }}
    >
      {NAV_ITEMS.map((n) => {
        const isActive = active === n.key
        return (
          <button
            key={n.key}
            type="button"
            onClick={() => onSelect(n.key)}
            style={{
              flex: 1,
              background: "none",
              border: 0,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              paddingTop: 3,
            }}
          >
            <span
              aria-hidden
              style={{
                fontSize: 21,
                lineHeight: 1,
                filter: isActive ? "none" : "grayscale(1) opacity(.55)",
              }}
            >
              {n.icon}
            </span>
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 600,
                fontSize: 10.5,
                color: isActive ? "#00E5C7" : "#6B7588",
              }}
            >
              {n.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
