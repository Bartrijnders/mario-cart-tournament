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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#F0EEE9" }}>
        <div className="card p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <div className="flex justify-center mb-4">
            <Avatar character={char} size="xl" />
          </div>
          <h1 className="font-display text-2xl tracking-wide mb-1" style={{ color: "#2C2C2A" }}>JE DOET MEE!</h1>
          <p className="text-xl font-bold mb-1" style={{ color: char.color }}>{name}</p>
          <p className="mb-5" style={{ color: "#888780" }}>als {char.name}</p>
          <div
            className="rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "#EF9F2715", color: "#BA7517", border: "1px solid #EF9F2730" }}
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
    <div className="min-h-screen" style={{ background: "#F0EEE9" }}>
      {/* Header */}
      <div
        className="racing-stripe checkered-bg px-4 py-5 text-center"
        style={{ background: "linear-gradient(135deg, #1e1e1c 0%, #2C2C2A 80%, #3a3a38 100%)" }}
      >
        <h1 className="font-display text-2xl text-white tracking-wider mb-0.5">MARIO KART TOERNOOI</h1>
        <p className="text-white/60 text-sm">The DOC Spelletjesavond</p>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {isClosed && (
          <div
            className="rounded-xl px-4 py-3 mb-5 text-center font-semibold"
            style={{ background: "#EF9F2720", color: "#BA7517", border: "1px solid #EF9F2740" }}
          >
            🔒 Inschrijvingen zijn gesloten
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Naam */}
          <div className="card p-4">
            <label className="block font-bold mb-2 text-sm" style={{ color: "#2C2C2A" }}>
              🏎️ Jouw naam
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Voer je naam in..."
              disabled={isClosed}
              className="w-full text-base px-4 py-3 rounded-xl border-2 bg-gray-50 focus:outline-none transition-all disabled:opacity-50"
              style={{ borderColor: name.trim() ? "#D85A30" : "#e5e7eb" }}
              maxLength={30}
              required
            />
          </div>

          {/* Personage grid */}
          <div className="card p-4">
            <label className="block font-bold mb-3 text-sm" style={{ color: "#2C2C2A" }}>
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
                      border: `2px solid ${selected ? char.color : taken ? "#e5e7eb" : "#e5e7eb"}`,
                      background: selected ? `${char.color}18` : taken ? "#f9f9f9" : "white",
                      opacity: taken ? 0.45 : 1,
                      boxShadow: selected ? `0 0 0 3px ${char.color}30, 0 4px 12px ${char.color}25` : "none",
                    }}
                  >
                    <div className="flex justify-center mb-1.5">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white"
                        style={{ backgroundColor: char.color }}
                      >
                        {char.abbreviation}
                      </div>
                    </div>
                    <div className="text-xs font-semibold leading-tight" style={{ color: taken ? "#aaa" : "#2C2C2A" }}>
                      {char.name}
                    </div>
                    {taken && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: "#999" }}>
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

          <button
            type="submit"
            disabled={loading || isClosed || !name.trim() || !selectedCharId}
            className="btn-primary w-full py-4 text-lg font-bold rounded-2xl text-white disabled:opacity-40 disabled:shadow-none disabled:transform-none"
          >
            {loading ? "Bezig..." : "🏁 Doe mee!"}
          </button>
        </form>
      </div>
    </div>
  );
}
