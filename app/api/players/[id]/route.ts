import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament } from "@/lib/store";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournament = await readTournament();

  const player = tournament.players.find((p) => p.id === id);
  if (!player) {
    return NextResponse.json({ error: "Speler niet gevonden" }, { status: 404 });
  }

  const hasRaces = tournament.races.some((r) => r.playerIds.includes(id));
  if (hasRaces) {
    return NextResponse.json({ error: "Speler heeft al races gespeeld" }, { status: 400 });
  }

  tournament.players = tournament.players.filter((p) => p.id !== id);
  await writeTournament(tournament);

  return NextResponse.json({ ok: true });
}
