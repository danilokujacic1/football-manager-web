import { api, unwrapArray } from "./client"

export type GameSide = "HOME" | "AWAY"

/** Backend GameStatus enum. */
export type GameStatus = "SCHEDULED" | "LIVE" | "FINISHED"

export interface GameTeam {
  id: string
  side: GameSide
  name: string
}

/** A fixture as returned by GET /leagues/{leagueId}/games. */
export interface LeagueGame {
  id: string
  leagueId: string
  /** ISO date string (Date serialized over JSON). */
  startDate: string
  status: GameStatus
  createdAt: string
  updatedAt: string
  gameTeams: GameTeam[]
}

/**
 * Paginated fixtures for a league.
 * Hits {API_BASE_URL}/leagues/{leagueId}/games?page=&limit=.
 *
 * The endpoint may return either a bare array or a paginated envelope
 * ({ data | items | games | results: [...] }); we normalize to an array.
 */
export async function fetchLeagueGames(leagueId: string, page: number, limit: number): Promise<LeagueGame[]> {
  const { data } = await api.get(`/leagues/${leagueId}/games`, {
    params: { page, limit },
  })
  return unwrapArray<LeagueGame>(data)
}

export interface CreateGameInput {
  /** ISO datetime string (the backend validates @IsDateString). */
  startDate: string
  home: { name: string }
  away: { name: string }
}

/** Creates a fixture. Admin/owner-only. POST /leagues/{leagueId}/games. */
export async function createLeagueGame(leagueId: string, input: CreateGameInput): Promise<LeagueGame> {
  const { data } = await api.post<LeagueGame>(`/leagues/${leagueId}/games`, input)
  return data
}

/** Deletes a fixture. Admin/owner-only. DELETE /leagues/{leagueId}/games/{gameId}. */
export async function deleteLeagueGame(leagueId: string, gameId: string): Promise<void> {
  await api.delete(`/leagues/${leagueId}/games/${gameId}`)
}
