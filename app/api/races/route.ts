import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament } from "@/lib/store";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { playerIds } = body;

  if (!Array.isArray(playerIds) || playerIds.length < 2 || playerIds.length > 4) {
    return NextResponse.json({ error: "Minimaal 2, maximaal 4 spelers" }, { status: 400 });
  }

  const tournament = readTournament();

  if (tournament.status !== "open") {
    return NextResponse.json({ error: "Kan geen race starten tijdens finale" }, { status: 400 });
  }

  const activeRaces = tournament.races.filter(
    (r) => r.status === "lobby" || r.status === "racing"
  );
  for (const pid of playerIds) {
    if (activeRaces.some((r) => r.playerIds.includes(pid))) {
      const player = tournament.players.find((p) => p.id === pid);
      return NextResponse.json(
        { error: `${player?.name ?? pid} zit al in een actieve race` },
        { status: 400 }
      );
    }
  }

  const validPlayerIds = playerIds.filter((id) =>
    tournament.players.some((p) => p.id === id)
  );
  if (validPlayerIds.length !== playerIds.length) {
    return NextResponse.json({ error: "Ongeldige speler IDs" }, { status: 400 });
  }

  const raceNumber = tournament.races.length + 1;
  const race = {
    id: uuidv4(),
    raceNumber,
    playerIds,
    results: null,
    status: "lobby" as const,
    createdAt: new Date().toISOString(),
    finishedAt: null,
  };

  tournament.races.push(race);
  await writeTournament(tournament);

  return NextResponse.json({ race }, { status: 201 });
}
