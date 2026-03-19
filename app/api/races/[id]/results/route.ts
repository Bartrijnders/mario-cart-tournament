import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament } from "@/lib/store";
import { POINTS_MAP } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { results } = body;

  const tournament = await readTournament();

  const raceIndex = tournament.races.findIndex((r) => r.id === id);
  if (raceIndex === -1) {
    return NextResponse.json({ error: "Race niet gevonden" }, { status: 404 });
  }

  const race = tournament.races[raceIndex];

  if (race.status === "finished") {
    return NextResponse.json({ error: "Race is al afgerond" }, { status: 400 });
  }

  if (!Array.isArray(results) || results.length !== race.playerIds.length) {
    return NextResponse.json({ error: "Onjuist aantal resultaten" }, { status: 400 });
  }

  const positions = results.map((r: { playerId: string; position: number }) => r.position);
  const uniquePositions = new Set(positions);
  if (uniquePositions.size !== positions.length) {
    return NextResponse.json({ error: "Posities moeten uniek zijn" }, { status: 400 });
  }

  for (const pid of race.playerIds) {
    if (!results.some((r: { playerId: string }) => r.playerId === pid)) {
      return NextResponse.json({ error: "Niet alle spelers hebben een resultaat" }, { status: 400 });
    }
  }

  const enrichedResults = results.map((r: { playerId: string; position: number }) => ({
    playerId: r.playerId,
    position: r.position,
    points: POINTS_MAP[r.position] ?? 0,
  }));

  tournament.races[raceIndex] = {
    ...race,
    results: enrichedResults,
    status: "finished",
    finishedAt: new Date().toISOString(),
  };

  await writeTournament(tournament);

  return NextResponse.json({ race: tournament.races[raceIndex] });
}
