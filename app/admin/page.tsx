"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Tournament, StandingEntry, Player, Race } from "@/lib/types";

interface TournamentData {
  tournament: Tournament;
  standings: StandingEntry[];
}

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<TournamentData | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loadingRace, setLoadingRace] = useState(false);
  const [loadingFinale, setLoadingFinale] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [finalePickerOpen, setFinalePickerOpen] = useState(false);
  const [finalePlayerIds, setFinalePlayerIds] = useState<string[]>([]);

  async function fetchData() {
    const res = await fetch("/api/tournament");
    const d = await res.json();
    setData(d);
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0EEE9" }}>
      <p className="font-display tracking-wide" style={{ color: "#888780" }}>Laden...</p>
    </div>
  );

  const { tournament, standings } = data;
  const activeRaces = tournament.races.filter((r) => r.status === "lobby" || r.status === "racing");
  const busyPlayerIds = new Set(activeRaces.flatMap((r) => r.playerIds));
  const availablePlayers = tournament.players.filter((p) => !busyPlayerIds.has(p.id));
  const recentRaces = [...tournament.races].filter((r) => r.status === "finished").reverse().slice(0, 8);
  const qualifiedCount = standings.filter((s) => s.qualified).length;
  const canStartFinale = tournament.status === "open" && qualifiedCount >= 4;

  function openFinalePicker() {
    const top4 = standings.filter((s) => s.qualified).slice(0, 4).map((s) => s.player.id);
    setFinalePlayerIds(top4);
    setFinalePickerOpen(true);
  }

  function toggleFinalePick(id: string) {
    setFinalePlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  function togglePlayer(id: string) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  }

  async function autoFill() {
    const res = await fetch("/api/races/suggest");
    const d = await res.json();
    setSelectedPlayerIds(d.playerIds ?? []);
  }

  async function startRace() {
    if (selectedPlayerIds.length < 2) { setError("Selecteer minimaal 2 spelers"); return; }
    setLoadingRace(true);
    setError(null);
    const res = await fetch("/api/races", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: selectedPlayerIds }),
    });
    const d = await res.json();
    setLoadingRace(false);
    if (!res.ok) { setError(d.error ?? "Fout bij aanmaken race"); return; }
    setSelectedPlayerIds([]);
    await fetchData();
  }

  async function startFinale() {
    setLoadingFinale(true);
    setError(null);
    const res = await fetch("/api/finale/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: finalePlayerIds }),
    });
    const d = await res.json();
    setLoadingFinale(false);
    if (!res.ok) { setError(d.error ?? "Fout bij starten finale"); return; }
    setFinalePickerOpen(false);
    await fetchData();
    router.push("/finale");
  }

  async function resetTournament() {
    if (!confirmReset) { setConfirmReset(true); return; }
    setLoadingReset(true);
    await fetch("/api/tournament/reset?confirm=true", { method: "POST" });
    setLoadingReset(false);
    setConfirmReset(false);
    await fetchData();
  }

  function getPlayer(id: string): Player | undefined {
    return tournament.players.find((p) => p.id === id);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F0EEE9" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 lg:px-6 py-4"
        style={{ background: "linear-gradient(135deg, #1e1e1c 0%, #2C2C2A 100%)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-white text-lg lg:text-xl tracking-wide">ADMIN</h1>
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
            ← Leaderboard
          </a>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="rounded-xl px-4 py-3 mb-4 font-semibold text-sm" style={{ background: "#E24B4A18", color: "#E24B4A", border: "1px solid #E24B4A30" }}>
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">

            {/* Nieuwe race */}
            {tournament.status === "open" && (
              <div className="card p-4 lg:p-5">
                <h2 className="font-display tracking-wide mb-3" style={{ color: "#2C2C2A" }}>
                  🏎️ NIEUWE RACE
                </h2>
                <p className="text-sm mb-3" style={{ color: "#888780" }}>
                  Selecteer 2–4 spelers ({selectedPlayerIds.length}/4)
                </p>
                {availablePlayers.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: "#888780" }}>Geen beschikbare spelers</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {availablePlayers.map((player) => {
                      const selected = selectedPlayerIds.includes(player.id);
                      return (
                        <button
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          className="flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all"
                          style={{
                            borderColor: selected ? player.character.color : "#e5e7eb",
                            background: selected ? `${player.character.color}12` : "white",
                            boxShadow: selected ? `0 0 0 2px ${player.character.color}25` : "none",
                          }}
                        >
                          <Avatar character={player.character} size="sm" />
                          <span className="text-sm font-semibold truncate">{player.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={autoFill}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                  >
                    🎲 Auto-vullen
                  </button>
                  <button
                    onClick={startRace}
                    disabled={loadingRace || selectedPlayerIds.length < 2}
                    className="btn-primary flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 disabled:shadow-none disabled:transform-none"
                  >
                    {loadingRace ? "Bezig..." : "🏁 Start Race"}
                  </button>
                </div>
              </div>
            )}

            {/* Actieve races */}
            <div className="card p-4 lg:p-5">
              <h2 className="font-display tracking-wide mb-3" style={{ color: "#2C2C2A" }}>
                ⚡ ACTIEVE RACES
              </h2>
              {activeRaces.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "#888780" }}>Geen actieve races</p>
              ) : (
                <div className="space-y-3">
                  {activeRaces.map((race: Race) => (
                    <div key={race.id} className="rounded-xl border-2 p-3" style={{ borderColor: "#EF9F2750", background: "#EF9F2708" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Race #{race.raceNumber}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: race.status === "racing" ? "#EF9F2725" : "#63992225",
                            color: race.status === "racing" ? "#BA7517" : "#639922",
                          }}
                        >
                          {race.status === "racing" ? "🟡 Bezig" : "🟢 Lobby"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {race.playerIds.map((pid) => {
                          const p = getPlayer(pid);
                          return p ? (
                            <div key={pid} className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: "white" }}>
                              <Avatar character={p.character} size="sm" />
                              <span className="text-xs font-semibold">{p.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                      <button
                        onClick={() => router.push(`/race/${race.id}/score`)}
                        className="w-full py-2 text-sm font-bold rounded-lg text-white"
                        style={{ background: "linear-gradient(135deg, #E8622A, #D85A30)" }}
                      >
                        Uitslag invoeren →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Race geschiedenis */}
            <div className="card p-4 lg:p-5">
              <h2 className="font-display tracking-wide mb-3" style={{ color: "#2C2C2A" }}>
                📋 RECENTE RACES
              </h2>
              {recentRaces.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "#888780" }}>Nog geen races gespeeld</p>
              ) : (
                <div className="space-y-2">
                  {recentRaces.map((race: Race) => {
                    const sortedResults = [...(race.results ?? [])].sort((a, b) => a.position - b.position);
                    return (
                      <div key={race.id} className="rounded-xl p-3" style={{ background: "#f8f7f4", border: "1px solid #ede9e3" }}>
                        <div className="text-xs font-display tracking-wide mb-2" style={{ color: "#888780" }}>RACE #{race.raceNumber}</div>
                        <div className="space-y-1">
                          {sortedResults.map((result) => {
                            const p = getPlayer(result.playerId);
                            return p ? (
                              <div key={result.playerId} className="flex items-center gap-2 text-sm">
                                <span className="w-5 font-bold flex-shrink-0" style={{ color: result.position === 1 ? "#BA7517" : "#bbb" }}>
                                  {result.position === 1 ? "🥇" : result.position === 2 ? "🥈" : result.position === 3 ? "🥉" : `${result.position}.`}
                                </span>
                                <Avatar character={p.character} size="sm" />
                                <span className="flex-1 truncate font-medium">{p.name}</span>
                                <span className="font-bold flex-shrink-0" style={{ color: "#D85A30" }}>{result.points}pt</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Toernooi acties */}
            <div className="card p-4 lg:p-5">
              <h2 className="font-display tracking-wide mb-3" style={{ color: "#2C2C2A" }}>
                🎯 TOERNOOI ACTIES
              </h2>

              <div className="space-y-3">
                {tournament.status === "open" && !finalePickerOpen && (
                  <div>
                    <button
                      onClick={openFinalePicker}
                      disabled={!canStartFinale}
                      className="btn-warning w-full py-3 font-bold rounded-xl text-white disabled:opacity-40 disabled:shadow-none disabled:transform-none"
                    >
                      ⚡ Start Grand Final
                    </button>
                    {!canStartFinale && (
                      <p className="text-xs mt-1.5" style={{ color: "#888780" }}>
                        {qualifiedCount}/4 spelers gekwalificeerd (min. 3 races)
                      </p>
                    )}
                  </div>
                )}

                {tournament.status === "open" && finalePickerOpen && (
                  <div className="rounded-xl border-2 p-4 space-y-3" style={{ borderColor: "#EF9F27", background: "#EF9F2708" }}>
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ color: "#BA7517" }}>
                        Kies 4 finalisten ({finalePlayerIds.length}/4)
                      </p>
                      <p className="text-xs" style={{ color: "#888780" }}>
                        Standaard de top 4 — pas aan als iemand eerder naar huis is gegaan.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {standings.map((entry) => {
                        const selected = finalePlayerIds.includes(entry.player.id);
                        return (
                          <button
                            key={entry.player.id}
                            onClick={() => toggleFinalePick(entry.player.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-left transition-all"
                            style={
                              selected
                                ? { borderColor: "#EF9F27", background: "#EF9F2718" }
                                : { borderColor: "#e5e7eb", background: "white" }
                            }
                          >
                            <Avatar character={entry.player.character} size="sm" />
                            <span className="flex-1 text-sm font-semibold truncate">{entry.player.name}</span>
                            <span className="text-xs flex-shrink-0" style={{ color: "#888780" }}>
                              {entry.averagePoints.toFixed(1)} · {entry.racesPlayed}r
                            </span>
                            {entry.qualified && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold" style={{ background: "#63992222", color: "#639922" }}>Q</span>
                            )}
                            {selected && <span style={{ color: "#EF9F27" }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setFinalePickerOpen(false)} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border-2 border-gray-200 bg-white">
                        Annuleren
                      </button>
                      <button
                        onClick={startFinale}
                        disabled={finalePlayerIds.length !== 4 || loadingFinale}
                        className="btn-warning flex-1 py-2.5 text-sm font-bold rounded-xl text-white disabled:opacity-40 disabled:shadow-none"
                      >
                        {loadingFinale ? "Bezig..." : "⚡ Bevestigen & Start"}
                      </button>
                    </div>
                  </div>
                )}

                {tournament.status === "finale" && (
                  <button onClick={() => router.push("/finale")} className="btn-warning w-full py-3 font-bold rounded-xl text-white">
                    ⚡ Naar Finale →
                  </button>
                )}

                <button
                  onClick={resetTournament}
                  disabled={loadingReset}
                  className={`w-full py-3 font-bold rounded-xl border-2 transition-all ${
                    confirmReset ? "bg-red-600 text-white border-red-600" : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                >
                  {loadingReset ? "Bezig..." : confirmReset ? "⚠️ Nogmaals klikken om te bevestigen" : "🔄 Reset Toernooi"}
                </button>
                {confirmReset && (
                  <p className="text-xs" style={{ color: "#E24B4A" }}>Alle data wordt verwijderd!</p>
                )}
              </div>

              {/* Spelers */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid #ede9e3" }}>
                <h3 className="font-display text-xs tracking-widest mb-3" style={{ color: "#888780" }}>
                  SPELERS ({tournament.players.length})
                </h3>
                <div className="space-y-2">
                  {tournament.players.map((player) => {
                    const standing = standings.find((s) => s.player.id === player.id);
                    return (
                      <div key={player.id} className="flex items-center gap-2">
                        <Avatar character={player.character} size="sm" />
                        <span className="text-sm font-semibold flex-1 truncate">{player.name}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: "#888780" }}>{standing?.racesPlayed ?? 0}r</span>
                        {standing?.qualified && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold" style={{ background: "#63992222", color: "#639922" }}>Q</span>
                        )}
                        {(standing?.racesPlayed ?? 0) === 0 && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Verwijder ${player.name}?`)) return;
                              await fetch(`/api/players/${player.id}`, { method: "DELETE" });
                              fetchData();
                            }}
                            className="text-xs px-2 py-0.5 rounded-lg border font-semibold"
                            style={{ borderColor: "#fca5a5", color: "#ef4444" }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
