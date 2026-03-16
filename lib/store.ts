import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { Tournament, StandingEntry } from "./types";

const DATA_FILE = path.join(process.cwd(), "tournament.json");

let writeLock = false;

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (writeLock) {
    await new Promise((r) => setTimeout(r, 10));
  }
  writeLock = true;
  try {
    return await fn();
  } finally {
    writeLock = false;
  }
}

const DEFAULT_TOURNAMENT: Tournament = {
  status: "open",
  players: [],
  races: [],
  finale: null,
  createdAt: new Date().toISOString(),
};

export function readTournament(): Tournament {
  if (!existsSync(DATA_FILE)) {
    writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_TOURNAMENT, null, 2));
    return DEFAULT_TOURNAMENT;
  }
  const raw = readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Tournament;
}

export async function writeTournament(tournament: Tournament): Promise<void> {
  await withLock(async () => {
    writeFileSync(DATA_FILE, JSON.stringify(tournament, null, 2));
  });
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
