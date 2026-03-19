"use client";

import { useEffect, useState } from "react";
import { CHARACTERS, Tournament, Character } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

export default function JoinPage() {
  const [name, setName] = useState("");
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [takenCharacters, setTakenCharacters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  async function fetchTournament() {
    const res = await fetch("/api/tournament");
    const data = await res.json();
    setTournament(data.tournament);
    const taken: Record<string, string> = {};
    for (const player of data.tournament.players) {
      taken[player.character.id] = player.name;
    }
    setTakenCharacters(taken);
  }

  useEffect(() => {
    fetchTournament();
    const interval = setInterval(fetchTournament, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCharId) { setError("Kies een personage"); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), characterId: selectedCharId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Er ging iets mis"); return; }
    setSuccess(true);
  }

  if (success) {
    const char = CHARACTERS.find((c) => c.id === selectedCharId)!;
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#091B2A" }}>
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div className="flex justify-center mb-4">
            <Avatar character={char} size="xl" />
          </div>
          <h1 className="font-display text-2xl tracking-wide mb-1 text-white">JE DOET MEE!</h1>
          <p className="text-xl font-bold mb-1" style={{ color: char.color }}>{name}</p>
          <p className="mb-5" style={{ color: "#818181" }}>als {char.name}</p>
          <div
            className="rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "rgba(247,212,72,0.08)", color: "#E2C142", border: "1px solid rgba(247,212,72,0.2)" }}
          >
            🏁 Wacht op je eerste race. Succes!
          </div>
        </div>
      </div>
    );
  }

  const isClosed = tournament?.status !== "open";
  const selectedChar = CHARACTERS.find((c) => c.id === selectedCharId);

  return (
    <div className="min-h-screen" style={{ background: "#091B2A" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 py-5 text-center"
        style={{ background: "linear-gradient(135deg, #091B2A 0%, #132F45 80%, #0F2A3E 100%)" }}
      >
        <h1 className="font-display text-2xl text-white tracking-wider mb-0.5">MARIO KART TOERNOOI</h1>
        <p className="text-white/60 text-sm">The DOC Spelletjesavond</p>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {isClosed && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-center font-semibold"
            style={{ background: "rgba(247,212,72,0.08)", color: "#E2C142", border: "1px solid rgba(247,212,72,0.2)" }}
          >
            🔒 Inschrijvingen zijn gesloten
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pb-28">
          {/* Naam */}
          <div className="card p-4">
            <label className="block font-bold mb-2 text-sm text-white">
              🏎️ Jouw naam
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Voer je naam in..."
              disabled={isClosed}
              className="w-full text-base px-4 py-3 rounded-xl border-2 focus:outline-none transition-all disabled:opacity-50"
              style={{
                borderColor: name.trim() ? "#F7D448" : "rgba(255,255,255,0.15)",
                background: "#091B2A",
                color: "white",
              }}
              maxLength={30}
              required
            />
          </div>

          {/* Personage grid */}
          <div className="card p-4">
            <label className="block font-bold mb-3 text-sm text-white">
              🎮 Kies je personage
              {selectedChar && (
                <span className="ml-2 font-normal" style={{ color: selectedChar.color }}>
                  — {selectedChar.name}
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHARACTERS.map((char: Character) => {
                const taken = takenCharacters[char.id];
                const selected = selectedCharId === char.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => !taken && !isClosed && setSelectedCharId(char.id)}
                    disabled={!!taken || isClosed}
                    className="rounded-xl p-2.5 text-center transition-all relative overflow-hidden"
                    style={{
                      border: `2px solid ${selected ? char.color : taken ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)"}`,
                      background: selected ? `${char.color}18` : taken ? "#0A1F30" : "#0F2A3E",
                      opacity: taken ? 0.45 : 1,
                      boxShadow: selected ? `0 0 0 3px ${char.color}30, 0 4px 12px ${char.color}25` : "none",
                    }}
                  >
                    <div className="flex justify-center mb-1.5">
                      <Avatar character={char} size="lg" />
                    </div>
                    <div className="text-xs font-semibold leading-tight" style={{ color: taken ? "#818181" : "#FFFFFF" }}>
                      {char.name}
                    </div>
                    {taken && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: "#818181" }}>
                        {taken}
                      </div>
                    )}
                    {selected && (
                      <div
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: char.color }}
                      >
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold px-4 py-3 rounded-xl" style={{ background: "#E24B4A18", color: "#E24B4A", border: "1px solid #E24B4A30" }}>
              ⚠️ {error}
            </p>
          )}

          {/* Sticky submit button */}
          <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3" style={{ background: "linear-gradient(to top, #091B2A 70%, transparent)" }}>
            <div className="max-w-md mx-auto">
              <button
                type="submit"
                disabled={loading || isClosed || !name.trim() || !selectedCharId}
                className="btn-primary w-full py-4 text-lg font-bold rounded-2xl disabled:opacity-40 disabled:shadow-none disabled:transform-none"
              >
                {loading ? "Bezig..." : "🏁 Doe mee!"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
