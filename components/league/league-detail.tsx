"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import type { Tab } from "@/lib/gaffer/types"
import type { League } from "@/lib/api/leagues"
import { fetchMe } from "@/lib/api/auth"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { BottomNav } from "@/components/gaffer/bottom-nav"
import { LeagueGamesTab } from "@/components/league/league-games-tab"
import { LeagueStandingsTab } from "@/components/league/league-standings-tab"
import { MyTeamTab } from "@/components/league/team-view"

/**
 * Tabbed view for a single league: Games (default) / League / Team, with the
 * bottom navigation. All three tabs are wired to the real API. The owner also
 * gets a floating shortcut into the admin dashboard.
 */
export function LeagueDetail({ league, leagueId }: { league: League; leagueId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("games")

  // Ownership: the current user owns this league when their id matches ownerId.
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false, staleTime: 5 * 60_000 })
  const isOwner = Boolean(me && league.ownerId && me.id === league.ownerId)

  return (
    <PhoneFrame>
      <div
        className="scrl"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 78,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {activeTab === "games" ? <LeagueGamesTab leagueId={leagueId} /> : null}
        {activeTab === "league" ? (
          <LeagueStandingsTab leagueId={leagueId} configuration={league.configuration} />
        ) : null}
        {activeTab === "team" ? <MyTeamTab leagueId={leagueId} /> : null}
      </div>

      {isOwner ? (
        <Link
          href={`/leagues/${leagueId}/admin`}
          aria-label="Admin dashboard"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            zIndex: 50,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            height: 38,
            padding: "0 14px",
            borderRadius: 19,
            textDecoration: "none",
            background: "rgba(0,229,199,.14)",
            border: "1px solid rgba(0,229,199,.4)",
            color: "#00E5C7",
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            fontSize: 13,
            backdropFilter: "blur(6px)",
          }}
        >
          <span aria-hidden style={{ fontSize: 15 }}>
            ⚙
          </span>
          Admin
        </Link>
      ) : null}

      <BottomNav active={activeTab} onSelect={setActiveTab} />
    </PhoneFrame>
  )
}
