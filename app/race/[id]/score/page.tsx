"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Tournament, Player, POINTS_MAP } from "@/lib/types";

export default function ScorePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tournament").then((r) => r.json()).then((d) => setTournament(d.tournament));
  }, []);

  if (!tournament) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0EEE9" }}>
      <p className="font-display tracking-wide" style={{ color: "#888780" }}>Laden...</p>
    </div>
  );

  const race = tournament.races.find((r) => r.id === id);
  if (!race) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0EEE9" }}>
      <p style={{ color: "#888780" }}>Race niet gevonden</p>
    </div>
  );

  if (race.status === "finished") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: "#F0EEE9" }}>
        <div className="card p-8 max-w-sm w-full text-center">
          <p className="text-lg font-semibold mb-4">Race #{race.raceNumber} is al afgerond</p>
          <button onClick={() => router.push("/admin")} className="btn-primary px-6 py-2 rounded-xl text-white font-bold">
            Terug naar admin
          </button>
        </div>
      </div>
    );
  }

  const racePlayers = race.playerIds.map((pid) => tournament.players.find((p) => p.id === pid)).filter(Boolean) as Player[];
  const numPositions = racePlayers.length;
  const allAssigned = Object.keys(positions).length === numPositions && Object.values(positions).every((v) => v !== "");
  const assignedPlayerIds = new Set(Object.values(positions));

  const positionColors: Record<number, string> = { 1: "#BA7517", 2: "#888780", 3: "#D85A30", 4: "#5F5E5A" };
  const positionLabels: Record<number, string> = { 1: "1e 🥇", 2: "2e 🥈", 3: "3e 🥉", 4: "4e" };

  async function handleConfirm() {
    if (!allAssigned) return;
    setSubmitting(true);
    setError(null);
    const results = Object.entries(positions).map(([pos, pid]) => ({ playerId: pid, position: parseInt(pos, 10) }));
    const res = await fetch(`/api/races/${id}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(d.error ?? "Er ging iets mis"); return; }
    router.push("/admin");
  }

  return (
    <div className="min-h-screen" style={{ background: "#F0EEE9" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 py-4"
        style={{ background: "linear-gradient(135deg, #1e1e1c 0%, #2C2C2A 100%)" }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
          >
            ← Terug
          </button>
          <div className="min-w-0">
            <h1 className="font-display text-white tracking-wide text-base lg:text-lg">
              RACE #{race.raceNumber} — UITSLAG
            </h1>
            <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.55)" }}>
              {racePlayers.map((p) => p.name).join(", ")}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 max-w-md mx-auto">
        {error && (
          <div className="rounded-xl px-4 py-3 mb-4 text-sm font-semibold" style={{ background: "#E24B4A18", color: "#E24B4A", border: "1px solid #E24B4A30" }}>
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-3 mb-5">
          {Array.from({ length: numPositions }, (_, i) => i + 1).map((pos) => {
            const color = positionColors[pos];
            const pts = POINTS_MAP[pos];
            const selectedPlayer = positions[pos] ? racePlayers.find((p) => p.id === positions[pos]) : null;

            return (
              <div key={pos} className="card p-3 lg:p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display text-lg flex-shrink-0 shadow-md"
                    style={{ backgroundColor: color }}
                  >
                    {pos}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm">{positionLabels[pos]}</span>
                      <span className="text-sm font-bold" style={{ color: "#D85A30" }}>+{pts} pts</span>
                    </div>
                    <select
                      value={positions[pos] ?? ""}
                      onChange={(e) => setPositions((prev) => ({ ...prev, [pos]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border-2 bg-gray-50 text-sm focus:outline-none transition-all"
                      style={{ borderColor: positions[pos] ? color : "#e5e7eb" }}
                    >
                      <option value="">— Kies speler —</option>
                      {racePlayers.map((player) => {
                        const usedElsewhere = assignedPlayerIds.has(player.id) && positions[pos] !== player.id;
                        return (
                          <option key={player.id} value={player.id} disabled={usedElsewhere}>
                            {player.name} ({player.character.name})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  {selectedPlayer && <Avatar character={selectedPlayer.character} size="md" />}
                </div>
              </div>
            );
          })}
        </div>

        {allAssigned && (
          <div className="card p-4 mb-4" style={{ borderLeft: "4px solid #639922" }}>
            <h3 className="font-display tracking-wide text-sm mb-3" style={{ color: "#2C2C2A" }}>SAMENVATTING</h3>
            <div className="space-y-2">
              {Array.from({ length: numPositions }, (_, i) => i + 1).map((pos) => {
                const player = racePlayers.find((p) => p.id === positions[pos]);
                if (!player) return null;
                return (
                  <div key={pos} className="flex items-center gap-3 text-sm">
                    <span className="font-bold w-5 flex-shrink-0" style={{ color: positionColors[pos] }}>{pos}.</span>
                    <Avatar character={player.character} size="sm" />
                    <span className="flex-1 font-semibold truncate">{player.name}</span>
                    <span className="font-bold flex-shrink-0" style={{ color: "#D85A30" }}>{POINTS_MAP[pos]} pt</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "#888780" }}>
              Iedereen akkoord? Resultaat is definitief na bevestiging.
            </p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!allAssigned || submitting}
          className="btn-primary w-full py-4 text-base lg:text-lg font-bold rounded-2xl text-white disabled:opacity-40 disabled:shadow-none disabled:transform-none"
        >
          {submitting ? "Bezig..." : "🏁 Uitslag bevestigen"}
        </button>
      </div>
    </div>
  );
}
