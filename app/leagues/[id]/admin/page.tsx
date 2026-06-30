"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import type { ReactNode } from "react"
import { AdminShell } from "@/components/admin/admin-shell"

export default function AdminDashboardPage() {
  const { id } = useParams<{ id: string }>()

  return (
    <AdminShell leagueId={id} title="Admin dashboard" subtitle="Manage everything about your league." backHref={`/leagues/${id}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <DashboardCard
          href={`/leagues/${id}/admin/games`}
          icon="⚽"
          title="Games"
          desc="Schedule, edit and remove fixtures."
        />
        <DashboardCard
          href={`/leagues/${id}/admin/members`}
          icon="👥"
          title="Members"
          desc="Change roles or remove members."
        />
        <DashboardCard
          href={`/leagues/${id}/admin/configuration`}
          icon="⚙"
          title="Configuration"
          desc="Budget, bench size and transfer rules."
        />
        <DashboardCard icon="📩" title="Requests to join" desc="Approve people asking to join." comingSoon />
      </div>
    </AdminShell>
  )
}

function DashboardCard({
  href,
  icon,
  title,
  desc,
  comingSoon,
}: {
  href?: string
  icon: string
  title: string
  desc: string
  comingSoon?: boolean
}) {
  const body: ReactNode = (
    <>
      <div
        aria-hidden
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          flex: "none",
          background: "rgba(0,229,199,.12)",
          border: "1px solid rgba(0,229,199,.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 16, color: "#fff" }}>{title}</span>
          {comingSoon ? (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".06em",
                color: "#FFB454",
                background: "rgba(255,180,84,.12)",
                border: "1px solid rgba(255,180,84,.35)",
                borderRadius: 999,
                padding: "2px 8px",
              }}
            >
              COMING SOON
            </span>
          ) : null}
        </div>
        <p style={{ fontSize: 13, color: "#9BA6BC", margin: "3px 0 0" }}>{desc}</p>
      </div>
      {!comingSoon ? (
        <span aria-hidden style={{ color: "#566", fontSize: 18, flex: "none" }}>
          ›
        </span>
      ) : null}
    </>
  )

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 16,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    textDecoration: "none",
    opacity: comingSoon ? 0.6 : 1,
  } as const

  if (comingSoon || !href) {
    return <div style={rowStyle}>{body}</div>
  }
  return (
    <Link href={href} style={rowStyle}>
      {body}
    </Link>
  )
}
