import { NextRequest, NextResponse } from "next/server";
import { readTournament, writeTournament } from "@/lib/store";
import { CHARACTERS } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, characterId } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Naam mag niet leeg zijn" }, { status: 400 });
  }

  const tournament = await readTournament();

  if (tournament.status !== "open") {
    return NextResponse.json({ error: "Inschrijvingen zijn gesloten" }, { status: 400 });
  }

  const trimmedName = name.trim();
  if (tournament.players.some((p) => p.name.toLowerCase() === trimmedName.toLowerCase())) {
    return NextResponse.json({ error: "Deze naam is al in gebruik" }, { status: 400 });
  }

  const character = CHARACTERS.find((c) => c.id === characterId);
  if (!character) {
    return NextResponse.json({ error: "Ongeldig personage" }, { status: 400 });
  }

  if (tournament.players.some((p) => p.character.id === characterId)) {
    return NextResponse.json({ error: "Dit personage is al gekozen" }, { status: 400 });
  }

  const player = {
    id: uuidv4(),
    name: trimmedName,
    character,
    joinedAt: new Date().toISOString(),
  };

  tournament.players.push(player);
  await writeTournament(tournament);

  return NextResponse.json({ player }, { status: 201 });
}
