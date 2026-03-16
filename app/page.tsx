"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Avatar } from "@/components/Avatar";
import { Tournament, StandingEntry } from "@/lib/types";

interface TournamentData {
  tournament: Tournament;
  standings: StandingEntry[];
}

interface ServerInfo {
  ip: string;
  url: string;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<TournamentData | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  async function fetchData() {
    const [tRes, sRes] = await Promise.all([
      fetch("/api/tournament"),
      fetch("/api/server-info"),
    ]);
    setData(await tRes.json());
    setServerInfo(await sRes.json());
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#F0EEE9" }}>
        <p className="text-lg font-display" style={{ color: "#888780" }}>Laden...</p>
      </div>
    );
  }

  const { tournament, standings } = data;
  const finishedRaces = tournament.races.filter((r) => r.status === "finished").length;
  const activeRaces = tournament.races.filter((r) => r.status === "lobby" || r.status === "racing");
  const nextRaceNumber = tournament.races.length + 1;
  const joinUrl = serverInfo ? `${serverInfo.url}/join` : `http://localhost:3000/join`;

  function getPlayer(id: string) {
    return tournament.players.find((p) => p.id === id);
  }
  function getStanding(id: string) {
    return standings.find((s) => s.player.id === id);
  }

  const bannerGradient =
    tournament.status === "open"
      ? "linear-gradient(135deg, #3a6b1a 0%, #4a8520 40%, #639922 100%)"
      : tournament.status === "finale"
      ? "linear-gradient(135deg, #a06b0a 0%, #c88010 40%, #EF9F27 100%)"
      : "linear-gradient(135deg, #444442 0%, #666664 100%)";

  const statusText =
    tournament.status === "open"
      ? "🏁 Toernooi open — inschrijvingen welkom"
      : tournament.status === "finale"
      ? "⚡ Grand Final bezig!"
      : "🏆 Toernooi afgelopen";

  const positionEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="min-h-screen" style={{ background: "#F0EEE9" }}>
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
              style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
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
                  <div className="font-display text-xl lg:text-2xl" style={{ color: "#D85A30" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: "#888780" }}>{stat.label}</div>
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
                      background: "linear-gradient(135deg, #1e1e1c 0%, #2C2C2A 100%)",
                      boxShadow: "0 0 0 2px #EF9F27, 0 8px 24px rgba(239,159,39,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#EF9F27" }} />
                      <span className="font-display text-sm tracking-wide" style={{ color: "#EF9F27" }}>
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
                            style={{ background: "rgba(255,255,255,0.07)" }}
                          >
                            <Avatar character={player.character} size="sm" />
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white truncate">{player.name}</div>
                              {standing && standing.racesPlayed > 0 ? (
                                <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                                  <span className="font-bold" style={{ color: "#EF9F27" }}>
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
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#EF9F2725", color: "#BA7517", border: "1px solid #EF9F2740" }}>
                ⭐ Min. 3 races om te kwalificeren
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: "#D85A3025", color: "#D85A30", border: "1px solid #D85A3040" }}>
                🏆 Top 4 naar finale
              </span>
            </div>

            {/* Klassement */}
            <div className="card overflow-hidden">
              <div className="px-4 lg:px-5 py-3 lg:py-4" style={{ borderBottom: "1px solid #f0ede8" }}>
                <h2 className="font-display text-lg lg:text-xl tracking-wide" style={{ color: "#2C2C2A" }}>
                  KLASSEMENT
                </h2>
              </div>

              {standings.length === 0 ? (
                <div className="p-8 text-center" style={{ color: "#888780" }}>
                  Nog geen spelers ingeschreven
                </div>
              ) : (
                <div>
                  {standings.map((entry, index) => {
                    const pos = index + 1;
                    const podiumClass = pos === 1 ? "podium-1" : pos === 2 ? "podium-2" : pos === 3 ? "podium-3" : "";
                    const medalColor = pos === 1 ? "#BA7517" : pos === 2 ? "#888780" : pos === 3 ? "#D85A30" : "#aaa";

                    return (
                      <div
                        key={entry.player.id}
                        className={`flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-3.5 ${podiumClass}`}
                        style={pos > 3 ? { borderBottom: "1px solid #f0ede8" } : { borderBottom: "1px solid rgba(0,0,0,0.05)" }}
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
                          <div className="font-semibold truncate text-sm lg:text-base">{entry.player.name}</div>
                          <div className="text-xs truncate" style={{ color: "#888780" }}>{entry.player.character.name}</div>
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-display text-lg lg:text-2xl" style={{ color: pos <= 3 ? medalColor : "#D85A30" }}>
                            {entry.averagePoints.toFixed(1)}
                          </div>
                          <div className="text-xs" style={{ color: "#888780" }}>gem.</div>
                        </div>

                        <div className="text-right w-10 lg:w-12 flex-shrink-0 hidden sm:block">
                          <div className="font-semibold text-sm">{entry.racesPlayed}</div>
                          <div className="text-xs" style={{ color: "#888780" }}>races</div>
                        </div>

                        <div className="text-right w-10 lg:w-12 flex-shrink-0 hidden sm:block">
                          <div className="font-semibold text-sm">{entry.wins}</div>
                          <div className="text-xs" style={{ color: "#888780" }}>overw.</div>
                        </div>

                        {entry.qualified && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                            style={{ background: "#63992222", color: "#639922", border: "1px solid #63992240" }}
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
              <p className="font-display text-sm tracking-wide mb-3" style={{ color: "#2C2C2A" }}>
                SCAN & SPEEL MEE
              </p>
              <div className="flex justify-center">
                <QRCodeSVG value={joinUrl} size={140} />
              </div>
              <p className="text-xs mt-3 break-all" style={{ color: "#888780" }}>{joinUrl}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
