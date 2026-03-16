import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament } from "@/lib/store";
import { POINTS_MAP } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ raceNumber: string }> }
) {
  const { raceNumber: raceNumberStr } = await params;
  const raceNumber = parseInt(raceNumberStr, 10);
  const body = await req.json();
  const { results } = body;

  const tournament = readTournament();

  if (tournament.status !== "finale" || !tournament.finale) {
    return NextResponse.json({ error: "Geen actieve finale" }, { status: 400 });
  }

  const finaleRaceIndex = tournament.finale.races.findIndex(
    (r) => r.raceNumber === raceNumber
  );
  if (finaleRaceIndex === -1) {
    return NextResponse.json({ error: "Finale race niet gevonden" }, { status: 404 });
  }

  const finaleRace = tournament.finale.races[finaleRaceIndex];
  if (finaleRace.status === "finished") {
    return NextResponse.json({ error: "Race is al afgerond" }, { status: 400 });
  }

  const qualifiedIds = tournament.finale.qualifiedPlayerIds;

  if (!Array.isArray(results) || results.length !== qualifiedIds.length) {
    return NextResponse.json({ error: "Onjuist aantal resultaten" }, { status: 400 });
  }

  const positions = results.map((r: { position: number }) => r.position);
  if (new Set(positions).size !== positions.length) {
    return NextResponse.json({ error: "Posities moeten uniek zijn" }, { status: 400 });
  }

  const enrichedResults = results.map((r: { playerId: string; position: number }) => ({
    playerId: r.playerId,
    position: r.position,
    points: POINTS_MAP[r.position] ?? 0,
  }));

  tournament.finale.races[finaleRaceIndex] = {
    ...finaleRace,
    results: enrichedResults,
    status: "finished",
  };

  // Determine winner
  const finishedRaces = tournament.finale.races.filter((r) => r.status === "finished");
  const winsPerPlayer: Record<string, number> = {};
  const pointsPerPlayer: Record<string, number> = {};

  for (const race of finishedRaces) {
    if (!race.results) continue;
    for (const result of race.results) {
      if (result.position === 1) {
        winsPerPlayer[result.playerId] = (winsPerPlayer[result.playerId] ?? 0) + 1;
      }
      pointsPerPlayer[result.playerId] = (pointsPerPlayer[result.playerId] ?? 0) + result.points;
    }
  }

  // Check if someone has 2 wins
  const playerWith2Wins = Object.entries(winsPerPlayer).find(([, wins]) => wins >= 2);
  if (playerWith2Wins) {
    tournament.finale.winnerId = playerWith2Wins[0];
    tournament.status = "finished";
  } else if (finishedRaces.length === 3) {
    // All 3 races done, pick by most wins, then most points
    const sorted = qualifiedIds.sort((a, b) => {
      const winsA = winsPerPlayer[a] ?? 0;
      const winsB = winsPerPlayer[b] ?? 0;
      if (winsB !== winsA) return winsB - winsA;
      return (pointsPerPlayer[b] ?? 0) - (pointsPerPlayer[a] ?? 0);
    });
    tournament.finale.winnerId = sorted[0];
    tournament.status = "finished";
  }

  await writeTournament(tournament);

  return NextResponse.json({ ok: true, tournament });
}
