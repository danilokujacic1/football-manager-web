"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { Spinner } from "@/components/common/phone-screen"
import { BackButton, SectionLabel } from "@/components/gaffer/ui"
import { fetchPlayer, fetchPlayerAchievements, type PlayerAchievement } from "@/lib/api/players"
import { colorFromString } from "@/lib/visual"

const ACH_LIMIT = 20

export function PlayerDetailView({
  leagueId,
  playerId,
  onBack,
}: {
  leagueId: string
  playerId: string
  onBack: () => void
}) {
  const playerQuery = useQuery({
    queryKey: ["player", leagueId, playerId],
    queryFn: () => fetchPlayer(leagueId, playerId),
  })

  const achievementsQuery = useInfiniteQuery({
    queryKey: ["player-achievements", leagueId, playerId, ACH_LIMIT],
    queryFn: ({ pageParam }) => fetchPlayerAchievements(leagueId, playerId, pageParam, ACH_LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined),
  })

  const player = playerQuery.data
  const kit = colorFromString(player?.id ?? playerId)

  if (playerQuery.isPending) {
    return (
      <div style={{ minHeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner />
      </div>
    )
  }

  if (playerQuery.isError || !player) {
    return (
      <div style={{ padding: "54px 18px" }}>
        <BackButton onClick={onBack} />
        <p style={{ color: "#9BA6BC", fontSize: 14, textAlign: "center", paddingTop: 40 }}>
          Couldn&apos;t load this player.
        </p>
      </div>
    )
  }

  const rows = achievementsQuery.data?.pages.flatMap((p) => p.data) ?? []
  const total = achievementsQuery.data?.pages[0]?.total ?? 0
  const games = groupByGame(rows)
  const price = formatValue(player.value)

  return (
    <div>
      <div style={{ padding: "54px 18px 18px", background: `linear-gradient(170deg, ${kit}22 0%, rgba(7,11,22,0) 75%)` }}>
        <BackButton onClick={onBack} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span
            aria-hidden
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: kit,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 18,
              color: "#fff",
              flex: "none",
              boxShadow: "inset 0 -8px 16px rgba(0,0,0,.25)",
            }}
          >
            {player.position}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#00E5C7", letterSpacing: ".04em" }}>
              {player.position}
              {player.club ? ` · ${player.club}` : ""}
            </div>
            <h1 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 26, color: "#fff", margin: "4px 0 0", lineHeight: 1.05 }}>
              {player.name}
            </h1>
            <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
              {price ? <Stat value={price} label="VALUE" valueColor="#fff" /> : null}
              <Stat value={String(total)} label="ACHIEVEMENTS" valueColor="#00E5C7" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "8px 18px 24px" }}>
        <SectionLabel style={{ marginBottom: 10 }}>ACHIEVEMENTS</SectionLabel>

        {achievementsQuery.isPending ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "30px 0" }}>
            <Spinner size={28} />
          </div>
        ) : achievementsQuery.isError ? (
          <p style={{ color: "#8A93A8", fontSize: 13 }}>Couldn&apos;t load achievements.</p>
        ) : games.length === 0 ? (
          <p style={{ color: "#8A93A8", fontSize: 13 }}>No achievements yet.</p>
        ) : (
          <div className="scrl" style={{ display: "flex", gap: 9, overflowX: "auto", paddingBottom: 4 }}>
            {games.map((g) => (
              <GameAchievementBox key={g.gameId} group={g} />
            ))}
            {achievementsQuery.hasNextPage ? (
              <button
                type="button"
                onClick={() => achievementsQuery.fetchNextPage()}
                disabled={achievementsQuery.isFetchingNextPage}
                style={{
                  flex: "none",
                  width: 92,
                  borderRadius: 14,
                  border: "1px dashed rgba(255,255,255,.18)",
                  background: "rgba(255,255,255,.03)",
                  color: "#9BA6BC",
                  fontFamily: "var(--font-space-grotesk)",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: achievementsQuery.isFetchingNextPage ? "default" : "pointer",
                }}
              >
                {achievementsQuery.isFetchingNextPage ? "…" : "More"}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

/** One box per game (gameId), combining all stats earned in that game. */
function GameAchievementBox({ group }: { group: GameGroup }) {
  return (
    <div
      style={{
        flex: "none",
        width: 138,
        borderRadius: 14,
        padding: 12,
        background: "rgba(0,229,199,.08)",
        border: "1px solid rgba(0,229,199,.22)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {group.stats.map((s) => (
            <span key={s.name} title={s.name} style={{ fontSize: 18, lineHeight: 1 }}>
              {statIcon(s.name)}
              {s.count > 1 ? (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#00E5C7", verticalAlign: "super" }}>×{s.count}</span>
              ) : null}
            </span>
          ))}
        </div>
        <span style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 15, color: "#00E5C7" }}>
          {group.points >= 0 ? `+${group.points}` : group.points}
        </span>
      </div>
      <div style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 12, color: "#F2F5FF", lineHeight: 1.2 }}>
        {group.stats.map((s) => s.name).join(", ")}
      </div>
      <div style={{ fontSize: 10, color: "#8A93A8", marginTop: 4 }}>{formatDate(group.date)}</div>
    </div>
  )
}

function Stat({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, padding: "8px 12px" }}>
      <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 900, fontSize: 19, color: valueColor, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 9, color: "#8A93A8", letterSpacing: ".06em", marginTop: 3 }}>{label}</div>
    </div>
  )
}

// --- grouping ---

interface StatTally {
  name: string
  count: number
}

interface GameGroup {
  gameId: string
  date: string
  points: number
  stats: StatTally[]
}

/** Collapse a player's achievement rows into one entry per game. */
function groupByGame(rows: PlayerAchievement[]): GameGroup[] {
  const byGame = new Map<string, GameGroup>()
  for (const a of rows) {
    const name = a.statistic?.name ?? "Achievement"
    const points = a.statistic?.points ?? 0
    const existing = byGame.get(a.gameId)
    if (existing) {
      const tally = existing.stats.find((s) => s.name === name)
      if (tally) tally.count += 1
      else existing.stats.push({ name, count: 1 })
      existing.points += points
      if (a.createdAt < existing.date) existing.date = a.createdAt
    } else {
      byGame.set(a.gameId, {
        gameId: a.gameId,
        date: a.createdAt,
        points,
        stats: [{ name, count: 1 }],
      })
    }
  }
  // Most recent game first.
  return [...byGame.values()].sort((a, b) => (a.date < b.date ? 1 : -1))
}

const STAT_ICONS: Record<string, string> = {
  goal: "⚽",
  assist: "🅰️",
  "clean sheet": "🧤",
  save: "🧤",
  "yellow card": "🟨",
  yellow: "🟨",
  "red card": "🟥",
  red: "🟥",
  motm: "⭐",
  "man of the match": "⭐",
  penalty: "🎯",
  "own goal": "🙈",
}

function statIcon(name: string): string {
  return STAT_ICONS[name.trim().toLowerCase()] ?? "🏅"
}

function formatValue(value: string): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ""
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(d)
}
