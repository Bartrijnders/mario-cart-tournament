import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament, computeStandings } from "@/lib/store";

export async function POST(req: NextRequest) {
  const tournament = await readTournament();

  if (tournament.status !== "open") {
    return NextResponse.json({ error: "Toernooi is niet open" }, { status: 400 });
  }

  const standings = computeStandings(tournament);

  let finalistIds: string[];

  const body = await req.json().catch(() => ({}));

  if (Array.isArray(body.playerIds) && body.playerIds.length === 4) {
    // Manual selection — validate all 4 exist
    const invalidId = body.playerIds.find(
      (id: string) => !tournament.players.some((p) => p.id === id)
    );
    if (invalidId) {
      return NextResponse.json({ error: "Ongeldige speler ID" }, { status: 400 });
    }
    finalistIds = body.playerIds;
  } else {
    // Auto: top 4 qualified players
    const qualified = standings.filter((s) => s.qualified);
    if (qualified.length < 4) {
      return NextResponse.json(
        { error: "Minimaal 4 spelers moeten 3+ races gespeeld hebben" },
        { status: 400 }
      );
    }
    finalistIds = qualified.slice(0, 4).map((s) => s.player.id);
  }

  // Cancel active lobbies
  tournament.races = tournament.races.map((r) => {
    if (r.status === "lobby" || r.status === "racing") {
      return { ...r, status: "finished" as const, finishedAt: new Date().toISOString(), results: r.results ?? null };
    }
    return r;
  });

  tournament.status = "finale";
  tournament.finale = {
    qualifiedPlayerIds: finalistIds,
    races: [
      { raceNumber: 1, results: null, status: "pending" },
      { raceNumber: 2, results: null, status: "pending" },
      { raceNumber: 3, results: null, status: "pending" },
    ],
    winnerId: null,
  };

  await writeTournament(tournament);

  return NextResponse.json({ ok: true, qualifiedPlayerIds: finalistIds });
}
