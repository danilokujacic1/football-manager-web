"use client"

import {
  resolvePositionCounts,
  type LeagueConfigurationRecord,
  type PlayerPosition,
  type PositionCounts,
} from "@/lib/api/leagues"
import { PitchField } from "./pitch-field"

/**
 * Shows the starting formation the league owner configured, as a top-down pitch
 * (FWD line at the top, GK in goal at the bottom). Reads the `position*` counts
 * off the league's configuration (as returned nested by GET /leagues/{id}).
 */
export function LeagueFormation({
  configuration,
}: {
  configuration: LeagueConfigurationRecord | null | undefined
}) {
  const counts = configuration ? resolvePositionCounts(configuration) : null

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(0,229,199,.28)",
        background: "rgba(0,229,199,.05)",
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".1em", color: "#7C879B" }}>FORMATION</span>
        {counts ? (
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 13, color: "#00E5C7" }}>
            {formationLabel(counts)}
          </span>
        ) : null}
      </div>

      {counts ? (
        <FormationPitch counts={counts} />
      ) : (
        <p style={{ textAlign: "center", color: "#8A93A8", fontSize: 13, padding: "20px 0", margin: 0 }}>
          Formation isn&apos;t available for this league.
        </p>
      )}
    </div>
  )
}

/** Outfield formation label with the keeper implied, e.g. "4-4-2". */
function formationLabel(counts: PositionCounts): string {
  return `${counts.DEF}-${counts.MID}-${counts.FWD}`
}

/** A top-down pitch using the shared PitchField chrome: FWD at top, GK (in goal) at bottom. */
function FormationPitch({ counts }: { counts: PositionCounts }) {
  const lines: { pos: PlayerPosition; count: number }[] = [
    { pos: "FWD", count: counts.FWD },
    { pos: "MID", count: counts.MID },
    { pos: "DEF", count: counts.DEF },
    { pos: "GK", count: counts.GK },
  ]

  return (
    <PitchField
      style={{ borderRadius: 14, padding: "16px 12px 20px" }}
      contentStyle={{ gap: 12, minHeight: 200 }}
    >
      {lines.map((line) => (
        <div
          key={line.pos}
          style={{ display: "flex", justifyContent: "center", gap: 8, flex: 1, alignItems: "center" }}
        >
          {Array.from({ length: Math.max(1, line.count) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: line.count > 0 ? "#00E5C7" : "rgba(255,255,255,.2)",
                border: "2px solid rgba(255,255,255,.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: "#062018",
                fontFamily: "var(--font-archivo)",
              }}
            >
              {line.pos}
            </span>
          ))}
        </div>
      ))}
    </PitchField>
  )
}
