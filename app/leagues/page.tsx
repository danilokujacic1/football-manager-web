"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { Field, FormError, PrimaryButton } from "@/components/auth/auth-ui"
import { CenteredPhoneScreen, LoadingScreen } from "@/components/common/phone-screen"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { fetchLeagues, joinLeagueByCode, type League } from "@/lib/api/leagues"

export default function LeaguesPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["leagues"],
    queryFn: fetchLeagues,
    retry: false,
  })

  if (isPending) {
    return <LoadingScreen message="Loading your leagues…" />
  }

  if (isError) {
    return (
      <CenteredPhoneScreen>
        <div style={{ textAlign: "center", maxWidth: 300 }}>
          <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 8px" }}>
            Couldn&apos;t load leagues
          </h1>
          <p style={{ fontSize: 14, color: "#9BA6BC", margin: "0 0 24px" }}>
            Your session may have expired. Please log in again.
          </p>
          <Link
            href="/login"
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
            Back to login
          </Link>
        </div>
      </CenteredPhoneScreen>
    )
  }

  const leagues = data ?? []

  return (
    <PhoneFrame>
      <div className="scrl" style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}>
        <div style={{ minHeight: 850, padding: "70px 26px 40px", display: "flex", flexDirection: "column" }}>
          <Header />
          {leagues.length === 0 ? <EmptyState /> : <LeagueList leagues={leagues} />}
        </div>
      </div>
    </PhoneFrame>
  )
}

function Header() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
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
  )
}

function LeagueList({ leagues }: { leagues: League[] }) {
  return (
    <>
      <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 30, color: "#fff", margin: "40px 0 4px" }}>
        Your leagues
      </h1>
      <p style={{ fontSize: 14, color: "#9BA6BC", margin: "0 0 24px" }}>
        {leagues.length} {leagues.length === 1 ? "league" : "leagues"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {leagues.map((league, i) => (
          <LeagueCard key={league.id ?? `${league.name}-${i}`} league={league} />
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        <CreateLeagueButton />
      </div>

      <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", color: "#7C879B", margin: "0 0 14px" }}>
          JOIN ANOTHER LEAGUE
        </p>
        <JoinByCodeForm />
      </div>
    </>
  )
}

/** CTA that takes the user to the multi-step league creation flow. */
function CreateLeagueButton() {
  return (
    <Link
      href="/leagues/new"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        width: "100%",
        height: 54,
        borderRadius: 16,
        textDecoration: "none",
        background: "linear-gradient(150deg,#00E5C7,#0AAE9B)",
        color: "#062018",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: ".01em",
        boxShadow: "0 10px 24px rgba(0,229,199,.32)",
      }}
    >
      <span aria-hidden style={{ fontSize: 20, lineHeight: 1 }}>
        +
      </span>
      Create a league
    </Link>
  )
}

function LeagueCard({ league }: { league: League }) {
  const badge = (
    <div
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: "rgba(0,229,199,.12)",
        border: "1px solid rgba(0,229,199,.28)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-archivo)",
        fontWeight: 800,
        color: "#00E5C7",
        fontSize: 16,
        flex: "none",
      }}
    >
      {league.name.charAt(0).toUpperCase()}
    </div>
  )

  const name = (
    <span
      style={{
        flex: 1,
        minWidth: 0,
        fontFamily: "var(--font-archivo)",
        fontWeight: 700,
        fontSize: 16,
        color: "#fff",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {league.name}
    </span>
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
  } as const

  // Only navigable when the backend provides an id.
  if (league.id == null) {
    return (
      <div style={rowStyle}>
        {badge}
        {name}
      </div>
    )
  }

  return (
    <Link href={`/leagues/${league.id}`} style={rowStyle}>
      {badge}
      {name}
      <span aria-hidden style={{ color: "#566", fontSize: 18, flex: "none" }}>
        ›
      </span>
    </Link>
  )
}

function EmptyState() {
  return (
    <div style={{ marginTop: 40 }}>
      <div
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "rgba(0,229,199,.12)",
          border: "1px solid rgba(0,229,199,.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 30,
        }}
      >
        🎟️
      </div>
      <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 28, color: "#fff", margin: "20px 0 8px" }}>
        No leagues yet
      </h1>
      <p style={{ fontSize: 14, lineHeight: 1.5, color: "#9BA6BC", margin: "0 0 28px", maxWidth: 290 }}>
        Start your own league, or ask an admin for an invite code and enter it below to take your seat.
      </p>

      <CreateLeagueButton />

      <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".08em", color: "#7C879B", margin: "0 0 14px" }}>
          JOIN BY CODE
        </p>
        <JoinByCodeForm />
      </div>
    </div>
  )
}

function JoinByCodeForm() {
  const queryClient = useQueryClient()
  const [code, setCode] = useState("")

  const mutation = useMutation({
    mutationFn: () => joinLeagueByCode(code.trim()),
    onSuccess: () => {
      setCode("")
      queryClient.invalidateQueries({ queryKey: ["leagues"] })
    },
  })

  const canSubmit = code.trim().length > 0 && !mutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    mutation.mutate()
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {mutation.isError ? <FormError message="That code didn't work. Double-check it and try again." /> : null}
      <Field
        id="league-code"
        label="LEAGUE CODE"
        value={code}
        onChange={setCode}
        placeholder="e.g. THUNDER-2026"
        autoComplete="off"
      />
      <PrimaryButton disabled={!canSubmit} style={{ marginTop: 4 }}>
        {mutation.isPending ? "Joining…" : "Enter league"}
      </PrimaryButton>
    </form>
  )
}
