import { api, unwrapArray } from "./client"
import type { Player, PlayerPosition } from "./teams"

export type { Player } from "./teams"

/** All players in a league (for squad selection). Hits {API_BASE_URL}/leagues/{leagueId}/players. */
export async function fetchLeaguePlayers(leagueId: string): Promise<Player[]> {
  const { data } = await api.get(`/leagues/${leagueId}/players`)
  return unwrapArray<Player>(data)
}

/** Statistic summary embedded in an achievement row. */
export interface AchievementStatistic {
  id: string
  name: string
  points: number
}

/** A flattened achievement row as returned by the player achievements endpoint. */
export interface PlayerAchievement {
  id: string
  createdAt: string
  gameId: string
  side: "HOME" | "AWAY"
  statistic: AchievementStatistic
}

/** Paginated achievements response for a single player. */
export interface PlayerAchievementsPage {
  player: { id: string; name: string; position: PlayerPosition }
  data: PlayerAchievement[]
  page: number
  limit: number
  total: number
  totalPages: number
}

/** A single player. Hits {API_BASE_URL}/leagues/{leagueId}/players/{playerId}. */
export async function fetchPlayer(leagueId: string, playerId: string): Promise<Player> {
  const { data } = await api.get<Player>(`/leagues/${leagueId}/players/${playerId}`)
  return data
}

/**
 * Paginated achievements for one player (paginated by achievement).
 * Hits {API_BASE_URL}/leagues/{leagueId}/players/{playerId}/achievements?page=&limit=.
 */
export async function fetchPlayerAchievements(
  leagueId: string,
  playerId: string,
  page: number,
  limit: number,
): Promise<PlayerAchievementsPage> {
  const { data } = await api.get<PlayerAchievementsPage>(
    `/leagues/${leagueId}/players/${playerId}/achievements`,
    { params: { page, limit } },
  )
  return data
}
