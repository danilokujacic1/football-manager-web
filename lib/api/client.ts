import axios from "axios"

/**
 * Base URL for all backend calls.
 * Configurable via the NEXT_PUBLIC_API_BASE_URL env var (see .env);
 * falls back to the local backend default.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api"

/** Shared axios instance. Import this everywhere instead of raw axios. */
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Send/receive auth cookies set by the backend during the OIDC exchange.
  withCredentials: true,
})

/**
 * Normalizes a list response to an array. Accepts a bare array or a paginated
 * envelope ({ data | items | results | ... : [...] }); falls back to the first
 * array-valued property, then to an empty array.
 */
export function unwrapArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    for (const key of ["data", "items", "results", "content", "games", "teams", "players", "achievements"]) {
      if (Array.isArray(obj[key])) return obj[key] as T[]
    }
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return value as T[]
    }
  }
  return []
}
