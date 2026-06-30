import { api } from "./client"

export interface League {
  /** Present when the backend includes it; falls back to name for keys. */
  id?: string
  name: string
  /** Invite code, included by the single-league endpoint. */
  code?: string
  /** The owning user's id — compare to the current user to detect ownership. */
  ownerId?: string
  /** League rules, included by GET /leagues/{id}. budget may arrive as a string. */
  configuration?: LeagueConfigurationRecord | null
}

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER"

/** A league member as returned by GET /leagues/{id}/members. */
export interface LeagueMember {
  role: MembershipRole
  joinedAt: string
  user: { id: string; email: string; displayName: string | null }
}

/** Configuration as stored/returned by the backend (budget serialized as string|null). */
export interface LeagueConfigurationRecord {
  maxPlayers: number
  benchPlayers: number
  budget: string | null
  transfersPerRound: number
}

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD"

/** League-wide rules. Mirrors the backend Configuration model. */
export interface LeagueConfiguration {
  maxPlayers: number
  benchPlayers: number
  /** `null` means an unlimited / infinite budget. */
  budget: number | null
  transfersPerRound: number
}

/** One entry of the players field array on the create-league form. */
export interface NewLeaguePlayer {
  name: string
  position: PlayerPosition
  value?: number
  club?: string
}

export interface CreateLeagueInput {
  name: string
  configuration: LeagueConfiguration
  players: NewLeaguePlayer[]
}

/**
 * Returns the leagues the current user can see.
 * Hits {API_BASE_URL}/leagues (i.e. {backend}/api/leagues).
 */
export async function fetchLeagues(): Promise<League[]> {
  const { data } = await api.get<League[]>("/leagues")
  return data
}

/**
 * Confirms a single league exists and that the current user is a member.
 * Rejects (404/403) otherwise. Hits {API_BASE_URL}/leagues/{id}.
 */
export async function fetchLeague(id: string): Promise<League> {
  const { data } = await api.get<League>(`/leagues/${id}`)
  return data
}

/**
 * Joins a league by its invite code.
 * Hits {API_BASE_URL}/leagues/join (i.e. {backend}/api/leagues/join).
 */
export async function joinLeagueByCode(code: string): Promise<League> {
  const { data } = await api.post<League>("/leagues/join", { code })
  return data
}

/** Creates a bare league (name only); the backend seeds a default configuration. */
async function createLeagueNamed(name: string): Promise<League> {
  const { data } = await api.post<League>("/leagues", { name })
  return data
}

/** Overwrites a league's configuration. Owner-only on the backend. */
export async function updateLeagueConfiguration(
  leagueId: string,
  configuration: LeagueConfiguration,
): Promise<void> {
  await api.patch(`/leagues/${leagueId}/configuration`, configuration)
}

/** Reads a league's configuration. Hits GET /leagues/{id}/configuration. */
export async function fetchLeagueConfiguration(leagueId: string): Promise<LeagueConfigurationRecord> {
  const { data } = await api.get<LeagueConfigurationRecord>(`/leagues/${leagueId}/configuration`)
  return data
}

/** League members with roles. Hits GET /leagues/{id}/members. */
export async function fetchLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
  const { data } = await api.get<LeagueMember[]>(`/leagues/${leagueId}/members`)
  return data
}

/** Changes a member's role (owner-only). PATCH /leagues/{id}/members/{userId}/role. */
export async function updateMemberRole(
  leagueId: string,
  userId: string,
  role: MembershipRole,
): Promise<void> {
  await api.patch(`/leagues/${leagueId}/members/${userId}/role`, { role })
}

/** Removes a member from the league. DELETE /leagues/{id}/members/{userId}. */
export async function removeMember(leagueId: string, userId: string): Promise<void> {
  await api.delete(`/leagues/${leagueId}/members/${userId}`)
}

/** Creates the whole player pool in one atomic request. Admin/owner-only on the backend. */
async function bulkCreateLeaguePlayers(leagueId: string, players: NewLeaguePlayer[]): Promise<void> {
  // Backend DTO (BulkCreatePlayersDto) wraps the array as { players: [...] }.
  await api.post(`/leagues/${leagueId}/players/bulk`, { players })
}

/**
 * Creates a league end-to-end from the multi-step form: the league itself
 * (POST /leagues), its configuration (PATCH .../configuration), then the whole
 * player pool in one shot (POST .../players/bulk). Returns the created league.
 */
export async function createLeague(input: CreateLeagueInput): Promise<League> {
  const league = await createLeagueNamed(input.name)
  if (league.id == null) {
    throw new Error("League was created but the server did not return its id.")
  }

  await updateLeagueConfiguration(league.id, input.configuration)

  if (input.players.length > 0) {
    await bulkCreateLeaguePlayers(league.id, input.players)
  }

  return league
}
