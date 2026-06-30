"use client"

import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Spinner } from "@/components/common/phone-screen"
import { BackButton, SectionLabel } from "@/components/gaffer/ui"
import { fetchMe } from "@/lib/api/auth"
import { fetchLeagueTeams, fetchTeam, type Player, type PlayerPosition, type TeamPlayer } from "@/lib/api/teams"
import { colorFromString } from "@/lib/visual"
import { TeamPlayerCard } from "./team-player-card"
import { PlayerDetailView } from "./player-detail-view"

const POS_ORDER: PlayerPosition[] = ["GK", "DEF", "MID", "FWD"]
const POS_LABEL: Record<PlayerPosition, string> = {
  GK: "Goalkeeper",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
}

/** Resolves the current user's team in this league and renders it (with owner actions). */
export function MyTeamTab({ leagueId }: { leagueId: string }) {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false })
  const teamsQuery = useQuery({ queryKey: ["league-teams", leagueId], queryFn: () => fetchLeagueTeams(leagueId) })

  if (meQuery.isPending || teamsQuery.isPending) {
    return <CenteredSpinner />
  }

  const myTeam = teamsQuery.data?.find((t) => t.ownerId === meQuery.data?.id)
  if (!myTeam) {
    return (
      <div style={{ padding: "80px 26px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 22, color: "#fff", margin: "0 0 8px" }}>
          No team yet
        </h1>
        <p style={{ fontSize: 14, color: "#9BA6BC", margin: 0 }}>You don&apos;t have a team in this league.</p>
      </div>
    )
  }

  return <TeamView leagueId={leagueId} teamId={myTeam.id} />
}

export function TeamView({
  leagueId,
  teamId,
  onBack,
}: {
  leagueId: string
  teamId: string
  onBack?: () => void
}) {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: fetchMe, retry: false })
  const teamQuery = useQuery({ queryKey: ["team", leagueId, teamId], queryFn: () => fetchTeam(leagueId, teamId) })

  const [pitchView, setPitchView] = useState(true)
  const [transferMode, setTransferMode] = useState(false)
  const [transfers, setTransfers] = useState<string[]>([])
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null)

  if (teamQuery.isPending) {
    return <CenteredSpinner />
  }

  if (teamQuery.isError || !teamQuery.data) {
    return (
      <div style={{ padding: "54px 18px" }}>
        {onBack ? <BackButton onClick={onBack} /> : null}
        <p style={{ color: "#9BA6BC", fontSize: 14, textAlign: "center", paddingTop: 40 }}>Couldn&apos;t load this team.</p>
      </div>
    )
  }

  const team = teamQuery.data
  const isOwner = Boolean(meQuery.data && meQuery.data.id === team.ownerId)
  const kit = colorFromString(team.id)

  // Player detail overlay.
  if (openPlayerId) {
    return <PlayerDetailView leagueId={leagueId} playerId={openPlayerId} onBack={() => setOpenPlayerId(null)} />
  }

  const roster = team.teamPlayers ?? []
  const subtitle = `${roster.length} ${roster.length === 1 ? "player" : "players"}${isOwner ? " · You" : ""}`
  const starters = roster.filter((tp) => tp.slot === "STARTER")
  const bench = roster.filter((tp) => tp.slot === "BENCH")

  const toggleSel = (id: string) =>
    setTransfers((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))

  const onPlayerClick = (p: Player) => {
    if (transferMode) toggleSel(p.id)
    else setOpenPlayerId(p.id)
  }

  const cardProps = (tp: TeamPlayer) => ({
    player: tp.player,
    kitColor: kit,
    isCaptain: team.captainId === tp.playerId,
    isVice: team.viceCaptainId === tp.playerId,
    selected: transfers.includes(tp.playerId),
    dim: transferMode && !transfers.includes(tp.playerId),
    onClick: () => onPlayerClick(tp.player),
  })

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* header */}
      <div style={{ padding: "54px 18px 16px", background: `linear-gradient(160deg, ${kit}33 0%, rgba(7,11,22,0) 78%)` }}>
        {onBack ? <BackButton onClick={onBack} /> : null}
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <span
            aria-hidden
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              background: kit,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-archivo)",
              fontWeight: 900,
              fontSize: 18,
              color: "#fff",
              boxShadow: "0 6px 16px rgba(0,0,0,.3)",
            }}
          >
            {team.name.charAt(0).toUpperCase()}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 23, color: "#fff", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {team.name}
            </h1>
            <div style={{ fontSize: 13, color: "#B9C2D6" }}>{subtitle}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 24, color: "#00E5C7", lineHeight: 1 }}>{team.points}</div>
            <div style={{ fontSize: 10, color: "#8A93A8", letterSpacing: ".06em" }}>TOTAL PTS</div>
          </div>
        </div>
      </div>

      {/* mode bar */}
      <div style={{ padding: "12px 18px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: 3 }}>
          <ModeButton label="Pitch" active={pitchView} onClick={() => setPitchView(true)} />
          <ModeButton label="List" active={!pitchView} onClick={() => setPitchView(false)} />
        </div>
        {isOwner ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setTransferMode((m) => !m)
                setTransfers([])
              }}
              style={{
                border: `1px solid ${transferMode ? "#FF2E7E" : "rgba(255,46,126,.32)"}`,
                cursor: "pointer",
                padding: "8px 15px",
                borderRadius: 11,
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 700,
                fontSize: 13,
                background: transferMode ? "#FF2E7E" : "rgba(255,46,126,.12)",
                color: transferMode ? "#fff" : "#FF8AB6",
              }}
            >
              {transferMode ? "Done" : "Transfers"}
            </button>
            {!transferMode ? (
              <button
                type="button"
                // TODO: open team edit (name / captain) once the edit API is defined.
                onClick={() => {}}
                style={{
                  border: "1px solid rgba(255,255,255,.14)",
                  cursor: "pointer",
                  padding: "8px 15px",
                  borderRadius: 11,
                  fontFamily: "var(--font-space-grotesk)",
                  fontWeight: 700,
                  fontSize: 13,
                  background: "rgba(255,255,255,.05)",
                  color: "#C7CFDE",
                }}
              >
                Edit
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {transferMode ? (
        <div
          style={{
            margin: "0 18px 4px",
            padding: "9px 13px",
            borderRadius: 12,
            background: "rgba(255,46,126,.1)",
            border: "1px solid rgba(255,46,126,.3)",
            fontSize: 12,
            color: "#FFA9CC",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>⇄</span> Tap players to mark them for transfer.
        </div>
      ) : null}

      {pitchView ? (
        <>
          {/* pitch */}
          <div
            style={{
              margin: "8px 14px 0",
              borderRadius: 18,
              overflow: "hidden",
              position: "relative",
              background: "linear-gradient(175deg,#0E7A4A 0%,#0A6B40 50%,#085C37 100%)",
              padding: "14px 8px 12px",
            }}
          >
            <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 44px, transparent 44px 88px)", pointerEvents: "none" }} />
            <div aria-hidden style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", width: 90, height: 90, border: "1.5px solid rgba(255,255,255,.16)", borderRadius: "50%", borderTop: "none", pointerEvents: "none" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 13 }}>
              {POS_ORDER.map((pos) => {
                const row = starters.filter((tp) => tp.player.position === pos)
                if (row.length === 0) return null
                return (
                  <div key={pos} style={{ display: "flex", justifyContent: "center", gap: 9 }}>
                    {row.map((tp) => (
                      <div key={tp.playerId} style={{ width: 74 }}>
                        <TeamPlayerCard {...cardProps(tp)} />
                      </div>
                    ))}
                  </div>
                )
              })}
              {starters.length === 0 ? (
                <p style={{ textAlign: "center", color: "rgba(255,255,255,.6)", fontSize: 13, padding: "20px 0" }}>No starters set.</p>
              ) : null}
            </div>
          </div>

          {/* bench row */}
          {bench.length > 0 ? (
            <div style={{ margin: "12px 18px 0" }}>
              <SectionLabel style={{ marginBottom: 9 }}>SUBSTITUTES</SectionLabel>
              <div style={{ display: "flex", gap: 9 }}>
                {bench.map((tp) => (
                  <div key={tp.playerId} style={{ flex: 1 }}>
                    <TeamPlayerCard {...cardProps(tp)} />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        /* list view */
        <div style={{ padding: "6px 18px 0", display: "flex", flexDirection: "column", gap: 14 }}>
          {POS_ORDER.map((pos) => {
            const row = starters.filter((tp) => tp.player.position === pos)
            if (row.length === 0) return null
            return (
              <div key={pos}>
                <SectionLabel style={{ marginBottom: 8 }}>{POS_LABEL[pos]}</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {row.map((tp) => (
                    <TeamPlayerCard key={tp.playerId} layout="list" {...cardProps(tp)} />
                  ))}
                </div>
              </div>
            )
          })}
          {bench.length > 0 ? (
            <div>
              <SectionLabel style={{ marginBottom: 8 }}>Substitutes</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {bench.map((tp) => (
                  <TeamPlayerCard key={tp.playerId} layout="list" {...cardProps(tp)} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 0,
        cursor: "pointer",
        padding: "7px 14px",
        borderRadius: 9,
        fontFamily: "var(--font-space-grotesk)",
        fontWeight: 600,
        fontSize: 13,
        background: active ? "#00E5C7" : "transparent",
        color: active ? "#062018" : "#9BA6BC",
      }}
    >
      {label}
    </button>
  )
}

function CenteredSpinner() {
  return (
    <div style={{ minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  )
}
