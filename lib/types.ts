export interface Tournament {
  status: "open" | "finale" | "finished";
  players: Player[];
  races: Race[];
  finale: Finale | null;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  character: Character;
  joinedAt: string;
}

export interface Character {
  id: string;
  name: string;
  color: string;
  abbreviation: string;
}

export interface Race {
  id: string;
  raceNumber: number;
  playerIds: string[];
  results: RaceResult[] | null;
  status: "lobby" | "racing" | "finished";
  createdAt: string;
  finishedAt: string | null;
}

export interface RaceResult {
  playerId: string;
  position: number;
  points: number;
}

export interface Finale {
  qualifiedPlayerIds: string[];
  races: FinaleRace[];
  winnerId: string | null;
}

export interface FinaleRace {
  raceNumber: number;
  results: RaceResult[] | null;
  status: "pending" | "racing" | "finished";
}

export interface StandingEntry {
  player: Player;
  totalPoints: number;
  racesPlayed: number;
  averagePoints: number;
  wins: number;
  qualified: boolean;
}

export const CHARACTERS: Character[] = [
  { id: "racer-rood", name: "Racer Rood", color: "#E24B4A", abbreviation: "RR" },
  { id: "sterrenrijder", name: "Sterrenrijder", color: "#378ADD", abbreviation: "ST" },
  { id: "groene-bliksem", name: "Groene Bliksem", color: "#639922", abbreviation: "GB" },
  { id: "roze-raket", name: "Roze Raket", color: "#D4537E", abbreviation: "RK" },
  { id: "gouden-schild", name: "Gouden Schild", color: "#BA7517", abbreviation: "GS" },
  { id: "paarse-pijl", name: "Paarse Pijl", color: "#534AB7", abbreviation: "PP" },
  { id: "turbo-teal", name: "Turbo Teal", color: "#1D9E75", abbreviation: "TT" },
  { id: "vurige-loper", name: "Vurige Loper", color: "#D85A30", abbreviation: "VL" },
  { id: "zilveren-wolk", name: "Zilveren Wolk", color: "#5F5E5A", abbreviation: "ZW" },
  { id: "donkere-bol", name: "Donkere Bol", color: "#185FA5", abbreviation: "DB" },
  { id: "bananenschil", name: "Bananenschil", color: "#EF9F27", abbreviation: "BS" },
  { id: "blokkeansen", name: "Blokkeansen", color: "#854F0B", abbreviation: "BK" },
];

export const POINTS_MAP: Record<number, number> = {
  1: 15,
  2: 10,
  3: 6,
  4: 3,
};
