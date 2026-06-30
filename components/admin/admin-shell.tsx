"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import type { ReactNode } from "react"
import { CenteredPhoneScreen, LoadingScreen } from "@/components/common/phone-screen"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { fetchMe } from "@/lib/api/auth"
import { fetchLeague } from "@/lib/api/leagues"

/**
 * Shared shell for every admin screen. Resolves the league + current user,
 * enforces owner-only access, and renders a back-button header above `children`.
 * Sub-screens just render their content; the guard lives here.
 */
export function AdminShell({
  leagueId,
  title,
  subtitle,
  backHref,
  children,
}: {
  leagueId: string
  title: string
  subtitle?: string
  /** Where the back arrow goes. Defaults to the dashboard landing. */
  backHref?: string
  children: ReactNode
}) {
  const leagueQuery = useQuery({
    queryKey: ["league", leagueId],
    queryFn: () => fetchLeague(leagueId),
    enabled: Boolean(leagueId),
    retry: false,
    staleTime: 5 * 60_000,
  })
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false, staleTime: 5 * 60_000 })

  if (leagueQuery.isPending || meQuery.isPending) {
    return <LoadingScreen message="Opening admin…" />
  }

  const league = leagueQuery.data
  const me = meQuery.data
  const isOwner = Boolean(league && me && league.ownerId && league.ownerId === me.id)

  if (!isOwner) {
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
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "20px 0 8px" }}>
            Owners only
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "0 0 24px" }}>
            Only the league owner can open the admin dashboard.
          </p>
          <Link
            href={`/leagues/${leagueId}`}
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
            Back to league
          </Link>
        </div>
      </CenteredPhoneScreen>
    )
  }

  return (
    <PhoneFrame>
      <div className="scrl" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ minHeight: 850, padding: "60px 26px 40px", display: "flex", flexDirection: "column" }}>
          <Link
            href={backHref ?? `/leagues/${leagueId}/admin`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "#9BA6BC",
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <span aria-hidden style={{ fontSize: 18 }}>
              ‹
            </span>
            {backHref ? "Back" : league?.name ?? "League"}
          </Link>

          <div style={{ marginTop: 22 }}>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: 0 }}>{title}</h1>
            {subtitle ? (
              <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "8px 0 0", maxWidth: 320 }}>{subtitle}</p>
            ) : null}
          </div>

          <div style={{ marginTop: 24, flex: 1 }}>{children}</div>
        </div>
      </div>
    </PhoneFrame>
  )
}

/** Shared gradient button styling for admin actions. */
export const adminPrimaryStyle = (disabled = false) =>
  ({
    width: "100%",
    height: 52,
    border: 0,
    borderRadius: 16,
    cursor: disabled ? "default" : "pointer",
    background: disabled ? "rgba(255,255,255,.07)" : "linear-gradient(150deg,#00E5C7,#0AAE9B)",
    color: disabled ? "#5E6878" : "#062018",
    fontFamily: "var(--font-archivo)",
    fontWeight: 800,
    fontSize: 15,
    boxShadow: disabled ? "none" : "0 10px 24px rgba(0,229,199,.32)",
  }) as const
