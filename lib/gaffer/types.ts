export type Position = "GK" | "DEF" | "MID" | "FWD"

export interface Player {
  id: number
  name: string
  pos: Position
  rating: number
  club: string
  clubShort: string
  num: number
  pts: number
  jersey: string
  captain?: boolean
}

export interface Squad {
  starters: Player[]
  bench: Player[]
}

export interface Team {
  id: number
  name: string
  owner: string
  crest: string
  crestColor: string
  squad: Squad
  pts: number
  gw: number
  rank: number
}

export type GameStatus = "live" | "ft" | "up"
export type EventType = "goal" | "assist" | "yellow" | "red" | "sub" | "save"

export interface MatchEvent {
  minute: number
  type: EventType
  icon: string
  player: string
  detail: string
  home: boolean
}

export interface Game {
  id: number
  home: string
  away: string
  homeScore: number
  awayScore: number
  status: GameStatus
  statusLabel: string
  live: boolean
  upcoming: boolean
  homeCrest: string
  awayCrest: string
  homeColor: string
  awayColor: string
  events: MatchEvent[]
}

export interface Achievement {
  icon: string
  title: string
  meta: string
  bg: string
  border: string
}

export type CardStyle = "foil" | "clean"
export type AuthState = "guest" | "noleague" | "inleague"
export type Tab = "games" | "league" | "team"

export interface Detail {
  type: "game" | "team" | "player"
  id: number
}
