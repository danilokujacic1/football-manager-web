/** Deterministic visual helpers for entities that carry no color/crest data. */

const PALETTE = ["#E23B3B", "#2A6FDB", "#22B07A", "#E8B23A", "#7B4DE0", "#16A0C0", "#E2622A", "#D6428A"]

/** Stable color picked from a string (team/player name, id, …). */
export function colorFromString(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Up to 3 uppercase initials from a name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts.map((w) => w[0]).join("").slice(0, 3).toUpperCase()
}

/** Last token of a name (for compact pitch labels). */
export function lastName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length ? parts[parts.length - 1] : name
}
