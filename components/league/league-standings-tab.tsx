"use client"

import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/common/phone-screen"
import { fetchMe } from "@/lib/api/auth"
import type { LeagueConfigurationRecord } from "@/lib/api/leagues"
import { fetchLeagueTeams, type Team } from "@/lib/api/teams"
import { colorFromString } from "@/lib/visual"
import { LeagueFormation } from "@/components/league/league-formation"

export function LeagueStandingsTab({
  leagueId,
  configuration,
}: {
  leagueId: string
  configuration: LeagueConfigurationRecord | null | undefined
}) {
  const router = useRouter()
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false })
  const teamsQuery = useQuery({ queryKey: ["league-teams", leagueId], queryFn: () => fetchLeagueTeams(leagueId) })

  const standings = [...(teamsQuery.data ?? [])].sort((a, b) => b.points - a.points)

  return (
    <div style={{ padding: "58px 18px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", color: "#00E5C7" }}>
        {standings.length} {standings.length === 1 ? "MANAGER" : "MANAGERS"}
      </div>
      <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: "3px 0 16px" }}>
        League Table
      </h1>

      <LeagueFormation configuration={configuration} />

      {teamsQuery.isPending ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "90px 0" }}>
          <Spinner />
        </div>
      ) : teamsQuery.isError ? (
        <p style={{ textAlign: "center", color: "#9BA6BC", fontSize: 14, padding: "60px 0" }}>
          Couldn&apos;t load the table. Please try again.
        </p>
      ) : standings.length === 0 ? (
        <p style={{ textAlign: "center", color: "#8A93A8", fontSize: 14, padding: "60px 0" }}>No teams yet.</p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", padding: "0 14px 8px", fontSize: 10, fontWeight: 600, letterSpacing: ".06em", color: "#677085" }}>
            <span style={{ width: 26 }}>#</span>
            <span style={{ flex: 1 }}>MANAGER</span>
            <span style={{ width: 52, textAlign: "right" }}>TOTAL</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {standings.map((team, i) => (
              <StandingRow
                key={team.id}
                team={team}
                rank={i + 1}
                isMe={meQuery.data?.id === team.ownerId}
                onOpen={() => router.push(`/leagues/${leagueId}/teams/${team.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function StandingRow({ team, rank, isMe, onOpen }: { team: Team; rank: number; isMe: boolean; onOpen: () => void }) {
  const rankColor = rank <= 3 ? "#E8B23A" : "#8A93A8"

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        display: "flex",
        alignItems: "center",
        padding: "11px 14px",
        borderRadius: 15,
        background: isMe ? "rgba(0,229,199,.08)" : "rgba(255,255,255,.035)",
        border: `1px solid ${isMe ? "rgba(0,229,199,.3)" : "rgba(255,255,255,.07)"}`,
      }}
    >
      <span style={{ width: 26, fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 15, color: rankColor }}>{rank}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: colorFromString(team.id),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 12,
            color: "#fff",
            flex: "none",
          }}
        >
          {team.name.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 600, fontSize: 14, color: "#F2F5FF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {team.name}
          </div>
          <div style={{ fontSize: 11, color: "#8A93A8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {team.teamPlayers?.length ?? 0} players{isMe ? " · You" : ""}
          </div>
        </div>
      </div>
      <span style={{ width: 52, textAlign: "right", fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 17, color: "#fff" }}>{team.points}</span>
    </button>
  )
}
