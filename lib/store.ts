import { Redis } from "@upstash/redis";
import { Tournament, StandingEntry } from "./types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const TOURNAMENT_KEY = "tournament";

const DEFAULT_TOURNAMENT: Tournament = {
  status: "open",
  players: [],
  races: [],
  finale: null,
  createdAt: new Date().toISOString(),
};

export async function readTournament(): Promise<Tournament> {
  const data = await redis.get<Tournament>(TOURNAMENT_KEY);
  return data ?? DEFAULT_TOURNAMENT;
}

export async function writeTournament(tournament: Tournament): Promise<void> {
  await redis.set(TOURNAMENT_KEY, tournament);
}

export function computeStandings(tournament: Tournament): StandingEntry[] {
  const finishedRaces = tournament.races.filter((r) => r.status === "finished" && r.results);

  const standings: StandingEntry[] = tournament.players.map((player) => {
    const playerRaces = finishedRaces.filter((r) => r.playerIds.includes(player.id));
    const totalPoints = playerRaces.reduce((sum, race) => {
      const result = race.results?.find((res) => res.playerId === player.id);
      return sum + (result?.points ?? 0);
    }, 0);
    const racesPlayed = playerRaces.length;
    const averagePoints = racesPlayed > 0 ? totalPoints / racesPlayed : 0;
    const wins = playerRaces.filter((race) => {
      const result = race.results?.find((res) => res.playerId === player.id);
      return result?.position === 1;
    }).length;

    return {
      player,
      totalPoints,
      racesPlayed,
      averagePoints,
      wins,
      qualified: false, // set below after sorting
    };
  });

  standings.sort((a, b) => {
    if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
    return b.wins - a.wins;
  });

  // Only the top 4 with >= 3 races qualify
  let qualifiedCount = 0;
  for (const entry of standings) {
    if (entry.racesPlayed >= 3 && qualifiedCount < 4) {
      entry.qualified = true;
      qualifiedCount++;
    }
  }

  return standings;
}
