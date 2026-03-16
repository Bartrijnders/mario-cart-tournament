import { NextResponse } from "next/server";
import { readTournament, computeStandings } from "@/lib/store";

export async function GET() {
  const tournament = readTournament();
  const standings = computeStandings(tournament);
  return NextResponse.json({ tournament, standings });
}
