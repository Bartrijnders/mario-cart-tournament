import { NextResponse } from "next/server";
import { readTournament } from "@/lib/store";

export async function GET() {
  const tournament = readTournament();

  const activeRaces = tournament.races.filter(
    (r) => r.status === "lobby" || r.status === "racing"
  );
  const busyPlayerIds = new Set(activeRaces.flatMap((r) => r.playerIds));
  const availablePlayers = tournament.players.filter((p) => !busyPlayerIds.has(p.id));

  if (availablePlayers.length < 2) {
    return NextResponse.json({ playerIds: [] });
  }

  const finishedRaces = tournament.races.filter((r) => r.status === "finished");

  // Count races played per player (to prioritize those who've played least)
  const racesPlayedMap: Record<string, number> = {};
  // Count how many times each pair has raced together
  const pairCount: Record<string, number> = {};

  for (const race of finishedRaces) {
    const ids = race.playerIds;
    for (const pid of ids) {
      racesPlayedMap[pid] = (racesPlayedMap[pid] ?? 0) + 1;
    }
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join("|");
        pairCount[key] = (pairCount[key] ?? 0) + 1;
      }
    }
  }

  function pairScore(a: string, b: string): number {
    return pairCount[[a, b].sort().join("|")] ?? 0;
  }

  // Total "togetherness" score of a candidate with the current lobby
  function scoreWithLobby(candidateId: string, lobby: string[]): number {
    return lobby.reduce((sum, id) => sum + pairScore(candidateId, id), 0);
  }

  const lobbySize = Math.min(4, availablePlayers.length);

  // Start with the player who has played the fewest races
  const pool = [...availablePlayers].sort((a, b) => {
    const ar = racesPlayedMap[a.id] ?? 0;
    const br = racesPlayedMap[b.id] ?? 0;
    return ar - br;
  });

  const lobby: string[] = [pool[0].id];
  const remaining = pool.slice(1);

  // Greedily add the player with the lowest pair-overlap score with the current lobby
  while (lobby.length < lobbySize && remaining.length > 0) {
    // Sort remaining by: lowest total pair-score with lobby, then fewest races played
    remaining.sort((a, b) => {
      const scoreA = scoreWithLobby(a.id, lobby);
      const scoreB = scoreWithLobby(b.id, lobby);
      if (scoreA !== scoreB) return scoreA - scoreB;
      return (racesPlayedMap[a.id] ?? 0) - (racesPlayedMap[b.id] ?? 0);
    });
    lobby.push(remaining.shift()!.id);
  }

  return NextResponse.json({ playerIds: lobby });
}
