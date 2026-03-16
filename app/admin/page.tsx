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
    <div className="flex items-center justify-center min-h-screen" style={{ background: "#091B2A" }}>
      <p className="font-display tracking-wide" style={{ color: "#818181" }}>Laden...</p>
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
    <div className="min-h-screen" style={{ background: "#091B2A" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 lg:px-6 py-4"
        style={{ background: "linear-gradient(135deg, #091B2A 0%, #0F2A3E 100%)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-display text-white text-lg lg:text-xl tracking-wide">ADMIN</h1>
          <a href="/" className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
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
                <h2 className="font-display tracking-wide mb-3 text-white">
                  🏎️ NIEUWE RACE
                </h2>
                <p className="text-sm mb-3" style={{ color: "#818181" }}>
                  Selecteer 2–4 spelers ({selectedPlayerIds.length}/4)
                </p>
                {availablePlayers.length === 0 ? (
                  <p className="text-sm py-4 text-center" style={{ color: "#818181" }}>Geen beschikbare spelers</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {availablePlayers.map((player) => {
                      const selected = selectedPlayerIds.includes(player.id);
                      return (
                        <button
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all"
                          style={{
                            border: `2px solid ${selected ? player.character.color : "rgba(255,255,255,0.1)"}`,
                            background: selected ? `${player.character.color}12` : "#0A1F30",
                            boxShadow: selected ? `0 0 0 2px ${player.character.color}25` : "none",
                          }}
                        >
                          <Avatar character={player.character} size="sm" />
                          <span className="text-sm font-semibold truncate text-white">{player.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={autoFill}
                    className="flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors"
                    style={{ border: "2px solid rgba(255,255,255,0.12)", background: "#0A1F30", color: "white" }}
                  >
                    🎲 Auto-vullen
                  </button>
                  <button
                    onClick={startRace}
                    disabled={loadingRace || selectedPlayerIds.length < 2}
                    className="btn-primary flex-1 py-2.5 text-sm font-bold rounded-xl disabled:opacity-40 disabled:shadow-none disabled:transform-none"
                  >
                    {loadingRace ? "Bezig..." : "🏁 Start Race"}
                  </button>
                </div>
              </div>
            )}

            {/* Actieve races */}
            <div className="card p-4 lg:p-5">
              <h2 className="font-display tracking-wide mb-3 text-white">
                ⚡ ACTIEVE RACES
              </h2>
              {activeRaces.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "#818181" }}>Geen actieve races</p>
              ) : (
                <div className="space-y-3">
                  {activeRaces.map((race: Race) => (
                    <div key={race.id} className="rounded-xl p-3" style={{ border: "2px solid rgba(247,212,72,0.25)", background: "rgba(247,212,72,0.04)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-white">Race #{race.raceNumber}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: race.status === "racing" ? "rgba(247,212,72,0.12)" : "rgba(39,173,160,0.12)",
                            color: race.status === "racing" ? "#E2C142" : "#27ADA0",
                          }}
                        >
                          {race.status === "racing" ? "🟡 Bezig" : "🟢 Lobby"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {race.playerIds.map((pid) => {
                          const p = getPlayer(pid);
                          return p ? (
                            <div key={pid} className="flex items-center gap-1.5 rounded-lg px-2 py-1" style={{ background: "#0A1F30" }}>
                              <Avatar character={p.character} size="sm" />
                              <span className="text-xs font-semibold text-white">{p.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                      <button
                        onClick={() => router.push(`/race/${race.id}/score`)}
                        className="btn-primary w-full py-2 text-sm font-bold rounded-lg"
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
              <h2 className="font-display tracking-wide mb-3 text-white">
                📋 RECENTE RACES
              </h2>
              {recentRaces.length === 0 ? (
                <p className="text-sm py-4 text-center" style={{ color: "#818181" }}>Nog geen races gespeeld</p>
              ) : (
                <div className="space-y-2">
                  {recentRaces.map((race: Race) => {
                    const sortedResults = [...(race.results ?? [])].sort((a, b) => a.position - b.position);
                    return (
                      <div key={race.id} className="rounded-xl p-3" style={{ background: "#132F45", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="text-xs font-display tracking-wide mb-2" style={{ color: "#818181" }}>RACE #{race.raceNumber}</div>
                        <div className="space-y-1">
                          {sortedResults.map((result) => {
                            const p = getPlayer(result.playerId);
                            return p ? (
                              <div key={result.playerId} className="flex items-center gap-2 text-sm">
                                <span className="w-5 font-bold flex-shrink-0" style={{ color: result.position === 1 ? "#F7D448" : "#818181" }}>
                                  {result.position === 1 ? "🥇" : result.position === 2 ? "🥈" : result.position === 3 ? "🥉" : `${result.position}.`}
                                </span>
                                <Avatar character={p.character} size="sm" />
                                <span className="flex-1 truncate font-medium text-white">{p.name}</span>
                                <span className="font-bold flex-shrink-0" style={{ color: "#F7D448" }}>{result.points}pt</span>
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
              <h2 className="font-display tracking-wide mb-3 text-white">
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
                      <p className="text-xs mt-1.5" style={{ color: "#818181" }}>
                        {qualifiedCount}/4 spelers gekwalificeerd (min. 3 races)
                      </p>
                    )}
                  </div>
                )}

                {tournament.status === "open" && finalePickerOpen && (
                  <div className="rounded-xl p-4 space-y-3" style={{ border: "2px solid #F7D448", background: "rgba(247,212,72,0.04)" }}>
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ color: "#E2C142" }}>
                        Kies 4 finalisten ({finalePlayerIds.length}/4)
                      </p>
                      <p className="text-xs" style={{ color: "#818181" }}>
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
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all"
                            style={
                              selected
                                ? { border: "2px solid #F7D448", background: "rgba(247,212,72,0.08)" }
                                : { border: "2px solid rgba(255,255,255,0.1)", background: "#0A1F30" }
                            }
                          >
                            <Avatar character={entry.player.character} size="sm" />
                            <span className="flex-1 text-sm font-semibold truncate text-white">{entry.player.name}</span>
                            <span className="text-xs flex-shrink-0" style={{ color: "#818181" }}>
                              {entry.averagePoints.toFixed(1)} · {entry.racesPlayed}r
                            </span>
                            {entry.qualified && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold" style={{ background: "rgba(39,173,160,0.15)", color: "#27ADA0" }}>Q</span>
                            )}
                            {selected && <span style={{ color: "#F7D448" }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFinalePickerOpen(false)}
                        className="flex-1 py-2.5 text-sm font-semibold rounded-xl"
                        style={{ border: "2px solid rgba(255,255,255,0.12)", background: "#0A1F30", color: "white" }}
                      >
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
                  className={`w-full py-3 font-bold rounded-xl transition-all ${confirmReset ? "bg-red-600 text-white" : ""}`}
                  style={!confirmReset ? { border: "2px solid rgba(255,255,255,0.12)", background: "#0A1F30", color: "#818181" } : { border: "2px solid #dc2626" }}
                >
                  {loadingReset ? "Bezig..." : confirmReset ? "⚠️ Nogmaals klikken om te bevestigen" : "🔄 Reset Toernooi"}
                </button>
                {confirmReset && (
                  <p className="text-xs" style={{ color: "#E24B4A" }}>Alle data wordt verwijderd!</p>
                )}
              </div>

              {/* Spelers */}
              <div className="mt-5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <h3 className="font-display text-xs tracking-widest mb-3" style={{ color: "#818181" }}>
                  SPELERS ({tournament.players.length})
                </h3>
                <div className="space-y-2">
                  {tournament.players.map((player) => {
                    const standing = standings.find((s) => s.player.id === player.id);
                    return (
                      <div key={player.id} className="flex items-center gap-2">
                        <Avatar character={player.character} size="sm" />
                        <span className="text-sm font-semibold flex-1 truncate text-white">{player.name}</span>
                        <span className="text-xs flex-shrink-0" style={{ color: "#818181" }}>{standing?.racesPlayed ?? 0}r</span>
                        {standing?.qualified && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 font-bold" style={{ background: "rgba(39,173,160,0.15)", color: "#27ADA0" }}>Q</span>
                        )}
                        {(standing?.racesPlayed ?? 0) === 0 && (
                          <button
                            onClick={async () => {
                              if (!confirm(`Verwijder ${player.name}?`)) return;
                              await fetch(`/api/players/${player.id}`, { method: "DELETE" });
                              fetchData();
                            }}
                            className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                            style={{ border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
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
