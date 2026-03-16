"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { Tournament, Player, FinaleRace, POINTS_MAP } from "@/lib/types";

export default function FinalePage() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeScoreRace, setActiveScoreRace] = useState<number | null>(null);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    const res = await fetch("/api/tournament");
    const d = await res.json();
    setTournament(d.tournament);
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!tournament) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0EEE9" }}>
      <p className="font-display tracking-wide" style={{ color: "#888780" }}>Laden...</p>
    </div>
  );

  if (tournament.status === "open") {
    return (
      <div className="flex items-center justify-center min-h-screen px-4" style={{ background: "#F0EEE9" }}>
        <div className="text-center">
          <p className="text-lg mb-4" style={{ color: "#888780" }}>De finale is nog niet begonnen</p>
          <a href="/admin" className="btn-primary px-6 py-3 rounded-xl text-white font-bold inline-block">
            Naar Admin
          </a>
        </div>
      </div>
    );
  }

  const finale = tournament.finale!;
  const qualifiedPlayers = finale.qualifiedPlayerIds
    .map((id) => tournament.players.find((p) => p.id === id))
    .filter(Boolean) as Player[];

  if (tournament.status === "finished" && finale.winnerId) {
    const winner = tournament.players.find((p) => p.id === finale.winnerId);
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 racing-stripe"
        style={{ background: "linear-gradient(135deg, #1e1e1c 0%, #2C2C2A 60%, #3a3a00 100%)" }}
      >
        <div className="text-center">
          <div className="text-7xl mb-6 animate-bounce">🏆</div>
          <h1 className="font-display text-4xl lg:text-6xl text-white tracking-widest mb-6">KAMPIOEN!</h1>
          {winner && (
            <>
              <div className="flex justify-center mb-4">
                <div
                  className="p-2 rounded-full"
                  style={{ background: `${winner.character.color}30`, boxShadow: `0 0 40px ${winner.character.color}60` }}
                >
                  <Avatar character={winner.character} size="xl" />
                </div>
              </div>
              <p className="text-2xl lg:text-4xl font-bold mb-2" style={{ color: winner.character.color }}>
                {winner.name}
              </p>
              <p className="text-base lg:text-lg mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
                als {winner.character.name}
              </p>
            </>
          )}
          <a href="/" className="btn-primary px-8 py-3 rounded-2xl text-white font-bold inline-block text-lg">
            🏁 Terug naar Leaderboard
          </a>
        </div>
      </div>
    );
  }

  const winsPerPlayer: Record<string, number> = {};
  for (const race of finale.races) {
    if (race.status !== "finished" || !race.results) continue;
    const winner = race.results.find((r) => r.position === 1);
    if (winner) winsPerPlayer[winner.playerId] = (winsPerPlayer[winner.playerId] ?? 0) + 1;
  }

  const nextPendingRace = finale.races.find((r) => r.status === "pending");
  const finishedRaces = finale.races.filter((r) => r.status === "finished");
  const maxWins = Math.max(0, ...Object.values(winsPerPlayer));
  const race3Needed = finishedRaces.length < 2 || (finishedRaces.length === 2 && maxWins < 2);

  async function submitFinaleScore(raceNumber: number) {
    if (Object.keys(positions).length !== qualifiedPlayers.length) { setError("Wijs alle posities toe"); return; }
    setSubmitting(true);
    setError(null);
    const results = Object.entries(positions).map(([pos, pid]) => ({ playerId: pid, position: parseInt(pos, 10) }));
    const res = await fetch(`/api/finale/races/${raceNumber}/results`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ results }),
    });
    const d = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(d.error ?? "Er ging iets mis"); return; }
    setActiveScoreRace(null);
    setPositions({});
    await fetchData();
  }

  const assignedPlayerIds = new Set(Object.values(positions));

  return (
    <div className="min-h-screen" style={{ background: "#F0EEE9" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 py-4 lg:py-5"
        style={{ background: "linear-gradient(135deg, #a06b0a 0%, #c88010 40%, #EF9F27 100%)" }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-white text-xl lg:text-2xl tracking-widest">⚡ GRAND FINAL ⚡</h1>
          <div className="flex gap-2">
            <a href="/" className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Leaderboard</a>
            <a href="/admin" className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>Admin</a>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">

          {/* Finalisten */}
          <div className="card p-4 lg:p-5 mb-4 lg:mb-5">
            <h2 className="font-display tracking-wide mb-3 text-sm" style={{ color: "#888780" }}>FINALISTEN</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {qualifiedPlayers.map((player) => {
                const wins = winsPerPlayer[player.id] ?? 0;
                return (
                  <div
                    key={player.id}
                    className="text-center rounded-xl p-3"
                    style={{
                      background: wins > 0 ? `${player.character.color}12` : "#f8f7f4",
                      border: `2px solid ${wins > 0 ? player.character.color + "40" : "#ede9e3"}`,
                    }}
                  >
                    <div className="flex justify-center mb-2">
                      <Avatar character={player.character} size="lg" />
                    </div>
                    <div className="text-sm font-bold truncate">{player.name}</div>
                    <div className="text-xs" style={{ color: "#888780" }}>{player.character.name}</div>
                    {wins > 0 && (
                      <div className="mt-1.5">
                        {Array.from({ length: wins }).map((_, i) => (
                          <span key={i} className="text-base">⭐</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Race tracker */}
          <div className="space-y-3 lg:space-y-4">
            {finale.races.map((finaleRace: FinaleRace) => {
              const isRace3 = finaleRace.raceNumber === 3;
              if (isRace3 && !race3Needed && finaleRace.status === "pending") {
                return (
                  <div key={finaleRace.raceNumber} className="card p-4 opacity-40">
                    <div className="flex items-center justify-between">
                      <span className="font-display tracking-wide text-sm" style={{ color: "#888780" }}>FINALE RACE 3</span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: "#88878022", color: "#888780" }}>Niet nodig</span>
                    </div>
                  </div>
                );
              }

              const isNext = nextPendingRace?.raceNumber === finaleRace.raceNumber;
              const isActive = activeScoreRace === finaleRace.raceNumber;
              const isDone = finaleRace.status === "finished";

              return (
                <div
                  key={finaleRace.raceNumber}
                  className="card p-4 lg:p-5"
                  style={isNext ? { boxShadow: "0 0 0 2px #EF9F27, 0 4px 16px rgba(239,159,39,0.15)" } : undefined}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display tracking-wide text-base lg:text-lg" style={{ color: "#2C2C2A" }}>
                      FINALE RACE {finaleRace.raceNumber}
                    </span>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{
                        background: isDone ? "#63992222" : isNext ? "#EF9F2722" : "#88878022",
                        color: isDone ? "#639922" : isNext ? "#BA7517" : "#888780",
                        border: `1px solid ${isDone ? "#63992240" : isNext ? "#EF9F2740" : "#88878030"}`,
                      }}
                    >
                      {isDone ? "✓ Gespeeld" : isNext ? "▶ Volgende" : "Later"}
                    </span>
                  </div>

                  {isDone && finaleRace.results && (
                    <div className="space-y-2 mb-3 p-3 rounded-xl" style={{ background: "#f8f7f4" }}>
                      {[...finaleRace.results].sort((a, b) => a.position - b.position).map((result) => {
                        const player = tournament.players.find((p) => p.id === result.playerId);
                        if (!player) return null;
                        const posEmoji = result.position === 1 ? "🥇" : result.position === 2 ? "🥈" : result.position === 3 ? "🥉" : `${result.position}.`;
                        return (
                          <div key={result.playerId} className="flex items-center gap-2 text-sm">
                            <span className="w-6 flex-shrink-0 text-center">{posEmoji}</span>
                            <Avatar character={player.character} size="sm" />
                            <span className="flex-1 truncate font-semibold">{player.name}</span>
                            <span className="font-bold flex-shrink-0" style={{ color: "#D85A30" }}>{result.points}pt</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isNext && !isActive && (
                    <button
                      onClick={() => setActiveScoreRace(finaleRace.raceNumber)}
                      className="btn-warning w-full py-2.5 font-bold rounded-xl text-white"
                    >
                      Uitslag invoeren
                    </button>
                  )}

                  {isActive && (
                    <div className="space-y-3">
                      {error && (
                        <p className="text-sm px-3 py-2 rounded-xl font-semibold" style={{ background: "#E24B4A18", color: "#E24B4A" }}>
                          ⚠️ {error}
                        </p>
                      )}
                      {Array.from({ length: qualifiedPlayers.length }, (_, i) => i + 1).map((pos) => {
                        const posColors: Record<number, string> = { 1: "#BA7517", 2: "#888780", 3: "#D85A30", 4: "#5F5E5A" };
                        const selectedPlayer = positions[pos] ? qualifiedPlayers.find((p) => p.id === positions[pos]) : null;
                        return (
                          <div key={pos} className="flex items-center gap-2 lg:gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-display flex-shrink-0 shadow-md"
                              style={{ backgroundColor: posColors[pos] }}
                            >
                              {pos}
                            </div>
                            <select
                              value={positions[pos] ?? ""}
                              onChange={(e) => setPositions((prev) => ({ ...prev, [pos]: e.target.value }))}
                              className="flex-1 min-w-0 px-3 py-2 rounded-xl border-2 text-sm transition-all"
                              style={{ borderColor: positions[pos] ? posColors[pos] : "#e5e7eb", background: "white" }}
                            >
                              <option value="">— Kies speler —</option>
                              {qualifiedPlayers.map((player) => {
                                const usedElsewhere = assignedPlayerIds.has(player.id) && positions[pos] !== player.id;
                                return (
                                  <option key={player.id} value={player.id} disabled={usedElsewhere}>
                                    {player.name}
                                  </option>
                                );
                              })}
                            </select>
                            <span className="text-sm font-bold w-12 text-right flex-shrink-0" style={{ color: "#D85A30" }}>
                              +{POINTS_MAP[pos]}pt
                            </span>
                            {selectedPlayer && <Avatar character={selectedPlayer.character} size="sm" />}
                          </div>
                        );
                      })}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => { setActiveScoreRace(null); setPositions({}); setError(null); }}
                          className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 border-gray-200 bg-white"
                        >
                          Annuleren
                        </button>
                        <button
                          onClick={() => submitFinaleScore(finaleRace.raceNumber)}
                          disabled={submitting || Object.keys(positions).length !== qualifiedPlayers.length}
                          className="btn-warning flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 disabled:shadow-none"
                        >
                          {submitting ? "Bezig..." : "✓ Bevestigen"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
