import type { Achievement, Game, MatchEvent, Player, Position, Squad, Team } from "./types"

/** Seeded pseudo-random generator (deterministic). */
function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const JERSEYS = [
  "linear-gradient(160deg,#E23B3B,#8E1414)",
  "linear-gradient(160deg,#2A6FDB,#143E86)",
  "linear-gradient(160deg,#22B07A,#0E6440)",
  "linear-gradient(160deg,#E8B23A,#9A6B12)",
  "linear-gradient(160deg,#7B4DE0,#3F227F)",
  "linear-gradient(160deg,#1B2330,#0A0E16)",
  "linear-gradient(160deg,#E2622A,#9A3C10)",
  "linear-gradient(160deg,#16A0C0,#0A5C72)",
]

const CREST_COLORS = [
  "#E23B3B",
  "#2A6FDB",
  "#22B07A",
  "#E8B23A",
  "#7B4DE0",
  "#3B4252",
  "#E2622A",
  "#16A0C0",
  "#D6428A",
  "#5A8F2E",
  "#C0392B",
  "#2C7A7B",
]

const FIRST = [
  "Leo", "Marco", "Diego", "Kai", "Yuki", "Omar", "Tariq", "Pavel", "Noah", "Ezra",
  "Luca", "Felix", "Ravi", "Cole", "Ari", "Theo", "Milo", "Dane", "Ivo", "Sol",
]

const LAST = [
  "Castellan", "Rivera", "Volkov", "Saint-Cloud", "Mbeki", "Okafor", "Maldonado", "Ferro",
  "Stone", "Wingate", "De Vault", "Hargrove", "Pike", "Nunes", "Adeyemi", "Brandt",
  "Okonkwo", "Halsey", "Varga", "Renner", "Costa", "Dubois", "Sato", "Klein",
]

const CLUBS: [string, string][] = [
  ["Thunder", "THB"], ["Rovers", "ROV"], ["Athletic", "ATH"], ["City", "CTY"],
  ["United", "UTD"], ["Albion", "ALB"], ["Wanderers", "WAN"], ["Hotspur", "HOT"],
]

function makeSquad(seed: number, ownColors: string): Squad {
  const rnd = rng(seed)
  const formation: { pos: Position; n: number }[] = [
    { pos: "GK", n: 1 },
    { pos: "DEF", n: 4 },
    { pos: "MID", n: 3 },
    { pos: "FWD", n: 3 },
  ]
  const benchPlan: Position[] = ["GK", "DEF", "MID", "FWD"]
  let id = seed * 100

  const mk = (pos: Position, _idx: number, isBench: boolean): Player => {
    const c = CLUBS[Math.floor(rnd() * CLUBS.length)]
    const base = pos === "FWD" ? 82 : pos === "MID" ? 80 : pos === "DEF" ? 78 : 76
    const rating = Math.min(93, base + Math.floor(rnd() * 12) - (isBench ? 6 : 0))
    const nm = FIRST[Math.floor(rnd() * FIRST.length)] + " " + LAST[Math.floor(rnd() * LAST.length)]
    return {
      id: id++,
      name: nm,
      pos,
      rating,
      club: c[0],
      clubShort: c[1],
      num: Math.floor(rnd() * 30) + 1,
      pts: Math.floor(rnd() * 90) + 18 - (isBench ? 10 : 0),
      jersey: ownColors,
    }
  }

  const starters: Player[] = []
  formation.forEach((f) => {
    for (let i = 0; i < f.n; i++) starters.push(mk(f.pos, i, false))
  })
  starters[0].rating = Math.min(89, starters[0].rating)

  // captain = highest-rated outfield player
  let cap = starters[1]
  starters.forEach((p) => {
    if (p.pos !== "GK" && p.rating > cap.rating) cap = p
  })
  cap.captain = true

  const bench = benchPlan.map((p, i) => mk(p, i, true))
  return { starters, bench }
}

const EV_ICONS: Record<string, string> = {
  goal: "⚽",
  assist: "🅰️",
  yellow: "🟨",
  red: "🟥",
  sub: "🔁",
  save: "🧤",
}

const GAME_DEFS: [string, string, number, number, "live" | "ft" | "up", string][] = [
  ["Thunder", "Rovers", 2, 1, "live", "67' LIVE"],
  ["City", "United", 1, 1, "live", "54' LIVE"],
  ["Athletic", "Albion", 3, 0, "ft", "Full time"],
  ["Wanderers", "Hotspur", 0, 2, "ft", "Full time"],
  ["Rovers", "City", 2, 2, "ft", "Full time"],
  ["United", "Athletic", 1, 3, "ft", "Full time"],
  ["Albion", "Thunder", 0, 0, "up", "Sat 15:00"],
  ["Hotspur", "Wanderers", 0, 0, "up", "Sun 14:00"],
  ["City", "Albion", 4, 1, "ft", "Full time"],
  ["Thunder", "United", 2, 2, "ft", "Full time"],
]

const CLUB_COLOR: Record<string, string> = {
  Thunder: "#E8B23A",
  Rovers: "#2A6FDB",
  Athletic: "#22B07A",
  City: "#7B4DE0",
  United: "#E23B3B",
  Albion: "#16A0C0",
  Wanderers: "#E2622A",
  Hotspur: "#3B4252",
}

const crestShort = (n: string) => n.slice(0, 3).toUpperCase()

export interface GafferData {
  teams: Team[]
  sorted: Team[]
  games: Game[]
  achievements: Achievement[]
}

let cached: GafferData | null = null

export function getData(): GafferData {
  if (cached) return cached

  const ownColor = JERSEYS[3]
  const ownerNames = [
    "You", "Marcus T.", "Priya N.", "Diego R.", "Sam W.", "Yuki H.",
    "Omar A.", "Lena K.", "Theo B.", "Fran D.", "Nils E.", "Ravi S.",
  ]
  const teamNames = [
    "Thunderbolts FC", "Galloping Gnus", "Park Bench FC", "The Invincibles",
    "Midfield Mayhem", "Net Gains", "Real Sofa Madrid", "Toon Army XI",
    "Goal Diggers", "Bench Warmers", "Box to Box", "Last Minute Larry",
  ]

  const teams: Team[] = teamNames.map((nm, i) => {
    const sq = makeSquad(i + 1, JERSEYS[i % JERSEYS.length])
    return {
      id: i,
      name: nm,
      owner: ownerNames[i],
      crest: nm.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase(),
      crestColor: CREST_COLORS[i % CREST_COLORS.length],
      squad: sq,
      pts: 0,
      gw: 0,
      rank: 0,
    }
  })

  // custom "my" squad
  teams[0].squad = makeSquad(777, ownColor)
  teams[0].crestColor = "#E8B23A"

  // standings: assign points, then sort
  const rnd = rng(42)
  teams.forEach((t, i) => {
    t.pts = 1100 - i * 38 - Math.floor(rnd() * 30)
    t.gw = Math.floor(rnd() * 45) + 30
  })
  teams[0].pts = 1012
  teams[0].gw = 71
  const sorted = [...teams].sort((a, b) => b.pts - a.pts)
  sorted.forEach((t, i) => (t.rank = i + 1))

  // games with generated events
  const games: Game[] = GAME_DEFS.map((g, i) => {
    const erng = rng(i + 9)
    const total = g[2] + g[3] || 2
    const evs: MatchEvent[] = []
    const names = [
      "L. Castellan", "M. Rivera", "D. Volkov", "K. Saint-Cloud",
      "O. Okafor", "T. Mbeki", "P. Ferro", "N. Stone",
    ]
    let mn = 5
    for (let k = 0; k < Math.max(total + 2, 4); k++) {
      mn += 6 + Math.floor(erng() * 15)
      if (mn > 90) break
      const r = erng()
      const type: MatchEvent["type"] = r < 0.5 ? "goal" : r < 0.7 ? "yellow" : r < 0.85 ? "save" : "sub"
      const home = erng() < 0.5
      const pl = names[Math.floor(erng() * names.length)]
      const detailMap: Record<string, string> = {
        goal: "Goal · assist " + names[Math.floor(erng() * names.length)].split(" ")[1],
        yellow: "Yellow card · foul",
        save: "Crucial save",
        sub: "Substitution",
      }
      evs.push({ minute: mn, type, icon: EV_ICONS[type], player: pl, detail: detailMap[type], home })
    }
    return {
      id: i,
      home: g[0],
      away: g[1],
      homeScore: g[2],
      awayScore: g[3],
      status: g[4],
      statusLabel: g[5],
      live: g[4] === "live",
      upcoming: g[4] === "up",
      homeCrest: crestShort(g[0]),
      awayCrest: crestShort(g[1]),
      homeColor: CLUB_COLOR[g[0]],
      awayColor: CLUB_COLOR[g[1]],
      events: evs,
    }
  })

  const achievements: Achievement[] = [
    { icon: "🏆", title: "Hat-trick Hero", meta: "MW 19 vs United", bg: "rgba(232,178,58,.12)", border: "rgba(232,178,58,.3)" },
    { icon: "⭐", title: "Player of the Month", meta: "November", bg: "rgba(0,229,199,.1)", border: "rgba(0,229,199,.28)" },
    { icon: "🔥", title: "5-game streak", meta: "Returns in every game", bg: "rgba(255,46,126,.1)", border: "rgba(255,46,126,.28)" },
    { icon: "🧤", title: "Wall of the Week", meta: "MW 21 clean sheet", bg: "rgba(123,77,224,.12)", border: "rgba(123,77,224,.3)" },
  ]

  cached = { teams, sorted, games, achievements }
  return cached
}

/** Generate the synthetic recent-match list shown on the player detail screen. */
export function playerMatches(playerId: number) {
  const prng = rng(playerId + 5)
  const opps = ["ROV", "CTY", "UTD", "ATH", "ALB", "HOT", "WAN"]
  const oppC = ["#2A6FDB", "#7B4DE0", "#E23B3B", "#22B07A", "#16A0C0", "#3B4252", "#E2622A"]
  return Array.from({ length: 6 }).map((_, i) => {
    const oi = Math.floor(prng() * opps.length)
    const pts = Math.floor(prng() * 14) + 1
    const goals = Math.floor(prng() * 3)
    const assists = Math.floor(prng() * 2)
    let tags = ""
    if (goals) tags += "⚽".repeat(goals)
    if (assists) tags += "🅰️"
    return {
      opp: opps[oi],
      oppColor: oppC[oi],
      label: "Matchweek " + (23 - i),
      line: (prng() < 0.5 ? "Home" : "Away") + " · 90 mins",
      pts,
      ptsColor: pts >= 8 ? "#00E5C7" : pts >= 4 ? "#fff" : "#7C879B",
      tags,
    }
  })
}
