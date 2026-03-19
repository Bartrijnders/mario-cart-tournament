"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Avatar } from "@/components/Avatar";
import { Tournament, StandingEntry } from "@/lib/types";

interface TournamentData {
  tournament: Tournament;
  standings: StandingEntry[];
}

export default function LeaderboardPage() {
  const [data, setData] = useState<TournamentData | null>(null);

  async function fetchData() {
    const res = await fetch("/api/tournament");
    setData(await res.json());
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#091B2A" }}>
        <p className="text-lg font-display" style={{ color: "#818181" }}>Laden...</p>
      </div>
    );
  }

  const { tournament, standings } = data;
  const finishedRaces = tournament.races.filter((r) => r.status === "finished").length;
  const activeRaces = tournament.races.filter((r) => r.status === "lobby" || r.status === "racing");
  const nextRaceNumber = tournament.races.length + 1;
  const joinUrl = `${window.location.origin}/join`;

  function getPlayer(id: string) {
    return tournament.players.find((p) => p.id === id);
  }
  function getStanding(id: string) {
    return standings.find((s) => s.player.id === id);
  }

  const bannerGradient =
    tournament.status === "open"
      ? "linear-gradient(135deg, #091B2A 0%, #0F2A3E 60%, #27ADA0 100%)"
      : tournament.status === "finale"
      ? "linear-gradient(135deg, #091B2A 0%, #132F45 60%, #F7D448 100%)"
      : "linear-gradient(135deg, #091B2A 0%, #0F2A3E 100%)";

  const statusText =
    tournament.status === "open"
      ? "🏁 Toernooi open — inschrijvingen welkom"
      : tournament.status === "finale"
      ? "⚡ Grand Final bezig!"
      : "🏆 Toernooi afgelopen";

  const positionEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="min-h-screen" style={{ background: "#091B2A" }}>
      {/* Hero banner */}
      <div className="racing-stripe checkered-bg" style={{ background: bannerGradient }}>
        <div className="px-4 lg:px-6 py-4 lg:py-5">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <h1 className="font-display text-white text-xl lg:text-3xl tracking-wide">
                MARIO KART TOERNOOI
              </h1>
              <p className="text-white/80 text-sm lg:text-base font-semibold mt-0.5">{statusText}</p>
            </div>
            <a
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
            >
              Admin →
            </a>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-6xl mx-auto">
          {/* Main content */}
          <div className="flex-1 min-w-0">

            {/* Stats bar */}
            <div className="flex gap-3 mb-5">
              {[
                { label: "Spelers", value: tournament.players.length, icon: "👤" },
                { label: "Races", value: finishedRaces, icon: "🏎️" },
                { label: "Volgende", value: `#${nextRaceNumber}`, icon: "🎯" },
              ].map((stat) => (
                <div key={stat.label} className="card flex-1 p-3 lg:p-4 text-center">
                  <div className="text-lg lg:text-xl mb-0.5">{stat.icon}</div>
                  <div className="font-display text-xl lg:text-2xl" style={{ color: "#F7D448" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: "#818181" }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Actieve races */}
            {activeRaces.length > 0 && (
              <div className="mb-5 space-y-3">
                {activeRaces.map((race) => (
                  <div
                    key={race.id}
                    className="rounded-2xl p-4 lg:p-5"
                    style={{
                      background: "linear-gradient(135deg, #091B2A 0%, #132F45 100%)",
                      boxShadow: "0 0 0 2px #F7D448, 0 8px 24px rgba(247,212,72,0.12)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#F7D448" }} />
                      <span className="font-display text-sm tracking-wide" style={{ color: "#F7D448" }}>
                        RACE #{race.raceNumber} — NU BEZIG
                      </span>
                    </div>
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${Math.min(race.playerIds.length, 2)}, minmax(0, 1fr))` }}
                    >
                      {race.playerIds.map((pid) => {
                        const player = getPlayer(pid);
                        const standing = getStanding(pid);
                        if (!player) return null;
                        return (
                          <div
                            key={pid}
                            className="flex items-center gap-2 rounded-xl p-2.5"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <Avatar character={player.character} size="sm" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{player.name}</div>
                              {standing && standing.racesPlayed > 0 ? (
                                <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  <span className="font-bold" style={{ color: "#F7D448" }}>
                                    {standing.averagePoints.toFixed(1)}
                                  </span>{" "}
                                  gem. · {standing.racesPlayed}r · {standing.wins}w
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>nieuwkomer</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Kwalificatie info */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(247,212,72,0.1)", color: "#E2C142", border: "1px solid rgba(247,212,72,0.25)" }}>
                ⭐ Min. 3 races om te kwalificeren
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "rgba(39,173,160,0.1)", color: "#27ADA0", border: "1px solid rgba(39,173,160,0.25)" }}>
                🏆 Top 4 naar finale
              </span>
            </div>

            {/* Klassement */}
            <div className="card overflow-hidden">
              <div className="px-4 lg:px-5 py-3 lg:py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: "#132F45" }}>
                <h2 className="font-display text-lg lg:text-xl tracking-wide text-white">
                  KLASSEMENT
                </h2>
              </div>

              {standings.length === 0 ? (
                <div className="p-8 text-center" style={{ color: "#818181" }}>
                  Nog geen spelers ingeschreven
                </div>
              ) : (
                <div>
                  {standings.map((entry, index) => {
                    const pos = index + 1;
                    const podiumClass = pos === 1 ? "podium-1" : pos === 2 ? "podium-2" : pos === 3 ? "podium-3" : "";
                    const medalColor = pos === 1 ? "#F7D448" : pos === 2 ? "#818181" : pos === 3 ? "#27ADA0" : "#818181";

                    return (
                      <div
                        key={entry.player.id}
                        className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-3.5 ${podiumClass}`}
                        style={pos > 3 ? { borderBottom: "1px solid rgba(255,255,255,0.07)" } : { borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {/* Position */}
                        <div className="w-8 flex-shrink-0 text-center">
                          {pos <= 3 ? (
                            <span className="text-xl">{positionEmoji[pos]}</span>
                          ) : (
                            <span className="font-display text-base" style={{ color: medalColor }}>{pos}</span>
                          )}
                        </div>

                        <Avatar character={entry.player.character} size="md" />

                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate text-sm lg:text-base text-white">{entry.player.name}</div>
                          <div className="text-xs truncate" style={{ color: "#818181" }}>{entry.player.character.name}</div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-lg lg:text-2xl" style={{ color: pos <= 3 ? medalColor : "#F7D448" }}>
                            {entry.averagePoints.toFixed(1)}
                          </div>
                          <div className="text-xs" style={{ color: "#818181" }}>gem.</div>
                        </div>

                        <div className="text-right w-10 lg:w-12 flex-shrink-0 hidden sm:block">
                          <div className="font-semibold text-sm text-white">{entry.racesPlayed}</div>
                          <div className="text-xs" style={{ color: "#818181" }}>races</div>
                        </div>

                        <div className="text-right w-10 lg:w-12 flex-shrink-0 hidden sm:block">
                          <div className="font-semibold text-sm text-white">{entry.wins}</div>
                          <div className="text-xs" style={{ color: "#818181" }}>overw.</div>
                        </div>

                        {entry.qualified && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: "rgba(39,173,160,0.15)", color: "#27ADA0", border: "1px solid rgba(39,173,160,0.3)" }}
                          >
                            Q
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* QR Code sidebar */}
          <div className="w-full lg:w-48 xl:w-52 lg:flex-shrink-0">
            <div className="card p-4 lg:p-5 lg:sticky lg:top-6 text-center">
              <p className="font-display text-sm tracking-wide mb-3 text-white">
                SCAN & SPEEL MEE
              </p>
              <div className="flex justify-center rounded-xl overflow-hidden">
                <QRCodeSVG value={joinUrl} size={140} fgColor="#F7D448" bgColor="#091B2A" />
              </div>
              <p className="text-xs mt-3 break-all" style={{ color: "#818181" }}>{joinUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
