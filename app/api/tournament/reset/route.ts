import { NextRequest, NextResponse } from "next/server";
import { writeTournament } from "@/lib/store";
import { Tournament } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("confirm") !== "true") {
    return NextResponse.json({ error: "Voeg ?confirm=true toe" }, { status: 400 });
  }

  const fresh: Tournament = {
    status: "open",
    players: [],
    races: [],
    finale: null,
    createdAt: new Date().toISOString(),
  };

  await writeTournament(fresh);
  return NextResponse.json({ ok: true });
}
