"use client"

import { useMemo, useState } from "react"
import { getData } from "@/lib/gaffer/data"
import type { AuthState, CardStyle, Detail, Player, Tab } from "@/lib/gaffer/types"
import { PhoneFrame } from "./phone-frame"
import { GuestLanding } from "./guest-landing"
import { JoinLeague } from "./join-league"
import { GamesTab } from "./games-tab"
import { LeagueTab } from "./league-tab"
import { TeamTab } from "./team-tab"
import { GameDetail } from "./game-detail"
import { PlayerDetail } from "./player-detail"
import { BottomNav } from "./bottom-nav"
import { TransferCTA } from "./transfer-cta"

const PER_PAGE = 5

export function GafferApp({ cardStyle = "foil" }: { cardStyle?: CardStyle }) {
  const data = useMemo(() => getData(), [])

  const [authState, setAuthState] = useState<AuthState>("guest")
  const [leagueCode, setLeagueCode] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("team")
  const [detail, setDetail] = useState<Detail | null>(null)
  const [pitchView, setPitchView] = useState(true)
  const [teamMode, setTeamMode] = useState<"preview" | "transfer">("preview")
  const [transfers, setTransfers] = useState<number[]>([])
  const [page, setPage] = useState(1)

  // ---- navigation helpers ----
  const signUp = () => setAuthState("noleague")
  const submitCode = () => {
    setAuthState("inleague")
    setActiveTab("team")
    setDetail(null)
  }
  const back = () => setDetail(null)
  const openGame = (id: number) => setDetail({ type: "game", id })
  const openTeam = (id: number) => {
    setDetail({ type: "team", id })
    setTeamMode("preview")
  }
  const openPlayer = (id: number) => setDetail({ type: "player", id })
  const setTab = (t: Tab) => {
    setActiveTab(t)
    setDetail(null)
    setTeamMode("preview")
  }
  const toggleTransfer = () => {
    setTeamMode((m) => (m === "transfer" ? "preview" : "transfer"))
    setTransfers([])
  }
  const toggleSel = (id: number) =>
    setTransfers((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  const confirmTransfer = () => {
    setTeamMode("preview")
    setTransfers([])
  }

  // ---- derived view state ----
  const inApp = authState === "inleague"
  const isDetail = !!detail
  const showNav = inApp && !detail
  const bottomInset = showNav ? 78 : 0

  const totalPages = Math.max(1, Math.ceil(data.games.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageGames = data.games.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const prevPage = () => setPage((p) => Math.max(1, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages, p + 1))

  const showGuest = authState === "guest"
  const showNoLeague = authState === "noleague"
  const showGames = inApp && activeTab === "games" && !detail
  const showLeague = inApp && activeTab === "league" && !detail
  const showTeam = inApp && ((activeTab === "team" && !detail) || (!!detail && detail.type === "team"))
  const showGameDetail = inApp && !!detail && detail.type === "game"
  const showPlayerDetail = inApp && !!detail && detail.type === "player"

  // team being viewed (own tab => team 0, else the opened team)
  const teamId = detail && detail.type === "team" ? detail.id : 0
  const team = data.teams[teamId]
  const canEdit = inApp && !detail
  const transferMode = canEdit && teamMode === "transfer"

  const onPlayerAction = (id: number) => (transferMode ? toggleSel(id) : openPlayer(id))

  // resolve player for player detail
  let detailPlayer: Player = data.teams[0].squad.starters[0]
  if (showPlayerDetail && detail) {
    for (const t of data.teams) {
      const found = [...t.squad.starters, ...t.squad.bench].find((p) => p.id === detail.id)
      if (found) {
        detailPlayer = found
        break
      }
    }
  }

  const showTransferCTA = transferMode && transfers.length >= 1

  return (
    <PhoneFrame>
      {/* scroll area */}
      <div
        className="scrl"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: bottomInset,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {showGuest ? <GuestLanding onSignUp={signUp} /> : null}

        {showNoLeague ? <JoinLeague code={leagueCode} onCodeChange={setLeagueCode} onSubmit={submitCode} /> : null}

        {showGames ? (
          <GamesTab
            games={pageGames}
            page={safePage}
            totalPages={totalPages}
            onOpenGame={openGame}
            onPrev={prevPage}
            onNext={nextPage}
          />
        ) : null}

        {showLeague ? <LeagueTab standings={data.sorted} onOpenTeam={openTeam} /> : null}

        {showTeam ? (
          <TeamTab
            team={team}
            isDetail={isDetail}
            canEdit={canEdit}
            pitchView={pitchView}
            transferMode={transferMode}
            cardStyle={cardStyle}
            transfers={transfers}
            onBack={back}
            onSetPitch={() => setPitchView(true)}
            onSetList={() => setPitchView(false)}
            onToggleTransfer={toggleTransfer}
            onPlayerAction={onPlayerAction}
          />
        ) : null}

        {showGameDetail && detail ? <GameDetail game={data.games[detail.id]} onBack={back} /> : null}

        {showPlayerDetail ? (
          <PlayerDetail player={detailPlayer} achievements={data.achievements} cardStyle={cardStyle} onBack={back} />
        ) : null}
      </div>

      {showTransferCTA ? <TransferCTA count={transfers.length} bottomInset={bottomInset} onConfirm={confirmTransfer} /> : null}

      {showNav ? <BottomNav active={activeTab} onSelect={setTab} /> : null}
    </PhoneFrame>
  )
}
