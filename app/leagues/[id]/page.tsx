"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CenteredPhoneScreen, LoadingScreen } from "@/components/common/phone-screen"
import { LeagueDetail } from "@/components/league/league-detail"
import { TeamBuilder } from "@/components/league/team-builder"
import { fetchLeague } from "@/lib/api/leagues"
import { fetchMyTeamStatus } from "@/lib/api/teams"

export default function LeaguePage() {
  const params = useParams<{ id: string }>()
  const id = params.id

  const {
    data: league,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["league", id],
    queryFn: () => fetchLeague(id),
    enabled: Boolean(id),
    // Membership check rarely changes within a session — cache it.
    staleTime: 5 * 60_000,
    retry: false,
  })

  // Gate: a member without a team must build one before entering the league.
  const teamStatus = useQuery({
    queryKey: ["my-team-status", id],
    queryFn: () => fetchMyTeamStatus(id),
    enabled: Boolean(league),
    retry: false,
  })

  if (isPending) {
    return <LoadingScreen message="Opening league…" />
  }

  if (isError || !league) {
    return (
      <CenteredPhoneScreen>
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <div
            aria-hidden
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              margin: "0 auto",
              background: "rgba(255,107,107,.12)",
              border: "1px solid rgba(255,107,107,.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
            }}
          >
            🔒
          </div>
          <h1
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 22,
              color: "#fff",
              margin: "20px 0 8px",
            }}
          >
            League unavailable
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "0 0 24px" }}>
            This league doesn&apos;t exist or you&apos;re not a member of it.
          </p>
          <Link
            href="/leagues"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 50,
              padding: "0 26px",
              borderRadius: 16,
              textDecoration: "none",
              background: "linear-gradient(150deg,#00E5C7,#0AAE9B)",
              color: "#062018",
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            Back to leagues
          </Link>
        </div>
      </CenteredPhoneScreen>
    )
  }

  // Still resolving whether the user has a team in this league.
  if (teamStatus.isPending) {
    return <LoadingScreen message="Checking your team…" />
  }

  // Couldn't determine team status — don't grant access on an unknown state.
  if (teamStatus.isError) {
    return (
      <CenteredPhoneScreen>
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 8px" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#9BA6BC", margin: "0 0 24px" }}>
            We couldn&apos;t load your team status. Please try again.
          </p>
          <button
            type="button"
            onClick={() => teamStatus.refetch()}
            style={{
              height: 50,
              padding: "0 26px",
              borderRadius: 16,
              border: 0,
              cursor: "pointer",
              background: "linear-gradient(150deg,#00E5C7,#0AAE9B)",
              color: "#062018",
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 15,
            }}
          >
            Retry
          </button>
        </div>
      </CenteredPhoneScreen>
    )
  }

  // No team yet → force team creation before the league is accessible.
  if (!teamStatus.data?.hasTeam) {
    return <TeamBuilder leagueId={id} leagueName={league.name} />
  }

  return <LeagueDetail league={league} leagueId={id} />
}
