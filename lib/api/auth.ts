import { api } from "./client"

export interface OpenIdCallbackParams {
  /** Authorization code returned by the IdP on the redirect. */
  code: string
  /** Opaque state value for CSRF protection; forwarded to the backend if present. */
  state?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken?: string
  expiresIn?: number
}

/**
 * Exchanges the IdP authorization code for app tokens.
 * Hits {API_BASE_URL}/auth/openid/callback (i.e. {backend}/api/auth/openid/callback).
 */
export async function exchangeOpenIdCode({ code, state }: OpenIdCallbackParams): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>("/auth/openid/callback", { code, state })
  return data
}

/** The authenticated user's profile (mirrors the backend User model). */
export interface MeProfile {
  id: string
  email: string
  displayName: string | null
}

/**
 * Returns the current user's profile, or rejects (401) when not authenticated.
 * Hits {API_BASE_URL}/auth/me (i.e. {backend}/api/auth/me).
 */
export async function fetchMe(): Promise<MeProfile> {
  const { data } = await api.get<MeProfile>("/auth/me")
  return data
}
