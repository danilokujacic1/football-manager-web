import { api, unwrapArray } from "./client"

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"
export type TeamSlot = "STARTER" | "BENCH"

/** Player as stored in a league (matches the Prisma Player model). */
export interface Player {
  id: string
  name: string
  position: PlayerPosition
  /** Real-world club, optional. */
  club: string | null
  /** Price counted against budget. Decimal serialized as a string. */
  value: string
  leagueId: string
  createdAt: string
  updatedAt: string
}

export interface TeamPlayer {
  teamId: string
  playerId: string
  leagueId: string
  slot: TeamSlot
  addedAt: string
  player: Player
}

export interface Team {
  id: string
  name: string
  leagueId: string
  ownerId: string
  captainId: string | null
  viceCaptainId: string | null
  /** Denormalized cached total points. */
  points: number
  createdAt: string
  updatedAt: string
  /** Included by both the list and single-team endpoints. */
  teamPlayers?: TeamPlayer[]
  /** Only the single-team endpoint includes captain/vice. */
  captain?: Player | null
  viceCaptain?: Player | null
}

/** Teams in a league (standings). Hits {API_BASE_URL}/leagues/{leagueId}/teams. */
export async function fetchLeagueTeams(leagueId: string): Promise<Team[]> {
  const { data } = await api.get(`/leagues/${leagueId}/teams`)
  return unwrapArray<Team>(data)
}

/** A single team incl. its roster + captain/vice. Hits {API_BASE_URL}/leagues/{leagueId}/teams/{teamId}. */
export async function fetchTeam(leagueId: string, teamId: string): Promise<Team> {
  const { data } = await api.get<Team>(`/leagues/${leagueId}/teams/${teamId}`)
  return data
}

export interface MyTeamStatus {
  hasTeam: boolean
  team?: Team | null
}

/** Whether the current user owns a team in this league. Hits {API_BASE_URL}/leagues/{leagueId}/teams/me. */
export async function fetchMyTeamStatus(leagueId: string): Promise<MyTeamStatus> {
  const { data } = await api.get<MyTeamStatus>(`/leagues/${leagueId}/teams/me`)
  return data
}

/** Creates the current user's team. Hits POST {API_BASE_URL}/leagues/{leagueId}/teams. */
export async function createTeam(leagueId: string, name: string): Promise<Team> {
  const { data } = await api.post<Team>(`/leagues/${leagueId}/teams`, { name })
  return data
}

/** Adds a player to a team. Hits POST {API_BASE_URL}/leagues/{leagueId}/teams/{teamId}/players. */
export async function addTeamPlayer(
  leagueId: string,
  teamId: string,
  playerId: string,
  slot: TeamSlot,
): Promise<TeamPlayer> {
  const { data } = await api.post<TeamPlayer>(`/leagues/${leagueId}/teams/${teamId}/players`, { playerId, slot })
  return data
}
