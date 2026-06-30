"use client"

import { useParams, useRouter } from "next/navigation"
import { PhoneFrame } from "@/components/gaffer/phone-frame"
import { TeamView } from "@/components/league/team-view"

export default function TeamPage() {
  const router = useRouter()
  const params = useParams<{ id: string; teamId: string }>()
  const { id: leagueId, teamId } = params

  return (
    <PhoneFrame>
      <div
        className="scrl"
        style={{ position: "absolute", inset: 0, overflowY: "auto", overflowX: "hidden" }}
      >
        <TeamView leagueId={leagueId} teamId={teamId} onBack={() => router.push(`/leagues/${leagueId}`)} />
      </div>
    </PhoneFrame>
  )
}
