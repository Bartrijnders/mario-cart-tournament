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
  imageUrl?: string; // pad naar /public/characters/<bestand>.png
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

const IMG = (file: string) => `/characters/mario%20kart%20images/240px-MKWorld${file}Emblem.png`;

export const CHARACTERS: Character[] = [
  // Hoofdpersonages
  { id: "mario",        name: "Mario",          color: "#E52222", abbreviation: "MA", imageUrl: IMG("Mario") },
  { id: "luigi",        name: "Luigi",          color: "#3F9B0B", abbreviation: "LU", imageUrl: IMG("Luigi") },
  { id: "peach",        name: "Peach",          color: "#F06FAE", abbreviation: "PE", imageUrl: IMG("Peach") },
  { id: "daisy",        name: "Daisy",          color: "#F5C518", abbreviation: "DA", imageUrl: IMG("Daisy") },
  { id: "rosalina",     name: "Rosalina",       color: "#6DCFF6", abbreviation: "RS", imageUrl: IMG("Rosalina") },
  { id: "pauline",      name: "Pauline",        color: "#C62828", abbreviation: "PA", imageUrl: IMG("Pauline") },
  { id: "yoshi",        name: "Yoshi",          color: "#5BAD5A", abbreviation: "YO", imageUrl: IMG("Yoshi") },
  { id: "birdo",        name: "Birdo",          color: "#E75480", abbreviation: "BI", imageUrl: IMG("Birdo") },
  { id: "toad",         name: "Toad",           color: "#4169E1", abbreviation: "TO", imageUrl: IMG("Toad") },
  { id: "toadette",     name: "Toadette",       color: "#D4537E", abbreviation: "TD", imageUrl: IMG("Toadette") },
  { id: "bowser",       name: "Bowser",         color: "#C47A2B", abbreviation: "BW", imageUrl: IMG("Bowser") },
  { id: "bowserjr",     name: "Bowser Jr.",     color: "#E8861A", abbreviation: "BJ", imageUrl: IMG("BowserJr") },
  { id: "wario",        name: "Wario",          color: "#D4A800", abbreviation: "WA", imageUrl: IMG("Wario") },
  { id: "waluigi",      name: "Waluigi",        color: "#7B2D8B", abbreviation: "WL", imageUrl: IMG("Waluigi") },
  { id: "donkeykong",   name: "Donkey Kong",    color: "#8B4513", abbreviation: "DK", imageUrl: IMG("DonkeyKong") },
  { id: "koopa",        name: "Koopa Troopa",   color: "#1D9E75", abbreviation: "KO", imageUrl: IMG("KoopaTroopa") },
  { id: "shyguy",       name: "Shy Guy",        color: "#CC2200", abbreviation: "SG", imageUrl: IMG("ShyGuy") },
  { id: "kingboo",      name: "King Boo",       color: "#9B59B6", abbreviation: "KB", imageUrl: IMG("KingBoo") },
  { id: "drybones",     name: "Dry Bones",      color: "#888780", abbreviation: "DB", imageUrl: IMG("DryBones") },
  { id: "lakitu",       name: "Lakitu",         color: "#378ADD", abbreviation: "LK", imageUrl: IMG("Lakitu") },
  { id: "nabbit",       name: "Nabbit",         color: "#FF6B1A", abbreviation: "NA", imageUrl: IMG("Nabbit") },
  { id: "pianta",       name: "Pianta",         color: "#1E5BA0", abbreviation: "PI", imageUrl: IMG("Pianta") },
  { id: "hammerbro",    name: "Hammer Bro",     color: "#2A7A3B", abbreviation: "HB", imageUrl: IMG("HammerBro") },
  { id: "wiggler",      name: "Wiggler",        color: "#E8B400", abbreviation: "WI", imageUrl: IMG("Wiggler") },
  { id: "piranhaplant", name: "Piranha Plant",  color: "#4A8C2A", abbreviation: "PP", imageUrl: IMG("PiranhaPlant") },
  { id: "goomba",       name: "Goomba",         color: "#8B6914", abbreviation: "GO", imageUrl: IMG("Goomba") },
  { id: "montymole",    name: "Monty Mole",     color: "#5C4033", abbreviation: "MM", imageUrl: IMG("MontyMole") },
  { id: "rockywrench",  name: "Rocky Wrench",   color: "#666666", abbreviation: "RW", imageUrl: IMG("RockyWrench") },
  { id: "charginchuck", name: "Chargin' Chuck", color: "#C85A2A", abbreviation: "CK", imageUrl: IMG("CharginChuck") },
  { id: "spike",        name: "Spike",          color: "#3A7A3A", abbreviation: "SP", imageUrl: IMG("Spike") },
  { id: "pokey",        name: "Pokey",          color: "#8AB825", abbreviation: "PK", imageUrl: IMG("Pokey") },
  { id: "cheepcheep",   name: "Cheep Cheep",    color: "#E85A40", abbreviation: "CC", imageUrl: IMG("CheepCheep") },
  { id: "snowman",      name: "Snowman",        color: "#B0D0E8", abbreviation: "SN", imageUrl: IMG("Snowman") },
  { id: "cow",          name: "Cow",            color: "#D0B88A", abbreviation: "CW", imageUrl: IMG("Cow") },
  { id: "cataquack",    name: "Cataquack",      color: "#4A9BD4", abbreviation: "CA", imageUrl: IMG("Cataquack") },
  { id: "fishbone",     name: "Fish Bone",      color: "#888888", abbreviation: "FB", imageUrl: IMG("FishBone") },
  { id: "conkdor",      name: "Conkdor",        color: "#444444", abbreviation: "CN", imageUrl: IMG("Conkdor") },
  { id: "sidestepper",  name: "Sidestepper",    color: "#CC4422", abbreviation: "SS", imageUrl: IMG("Sidestepper") },
  { id: "dolphin",      name: "Dolphin",        color: "#2288CC", abbreviation: "DO", imageUrl: IMG("Dolphin") },
  { id: "coincoffer",   name: "Coin Coffer",    color: "#C4940A", abbreviation: "CF", imageUrl: IMG("CoinCoffer") },
  { id: "peepa",        name: "Peepa",          color: "#AAAACC", abbreviation: "GP", imageUrl: IMG("Peepa") },
  { id: "stingby",      name: "Stingby",        color: "#D4B000", abbreviation: "ST", imageUrl: IMG("Stingby") },
  { id: "swoop",        name: "Swoop",          color: "#6644AA", abbreviation: "SW", imageUrl: IMG("Swoop") },
  { id: "parabiddybud", name: "Para-Biddybud",  color: "#D46090", abbreviation: "PB", imageUrl: IMG("ParaBiddybud") },
  { id: "penguin",      name: "Penguin",        color: "#334466", abbreviation: "PG", imageUrl: IMG("Penguin") },
  // Baby personages
  { id: "babymario",    name: "Baby Mario",     color: "#FF6666", abbreviation: "BM", imageUrl: IMG("BabyMario") },
  { id: "babyluigi",    name: "Baby Luigi",     color: "#7FBA5A", abbreviation: "BL", imageUrl: IMG("BabyLuigi") },
  { id: "babypeach",    name: "Baby Peach",     color: "#FFB6C1", abbreviation: "BP", imageUrl: IMG("BabyPeach") },
  { id: "babydaisy",    name: "Baby Daisy",     color: "#FFE066", abbreviation: "BD", imageUrl: IMG("BabyDaisy") },
  { id: "babyrosalina", name: "Baby Rosalina",  color: "#A8E6F0", abbreviation: "BR", imageUrl: IMG("BabyRosalina") },
];

export const POINTS_MAP: Record<number, number> = {
  1: 15,
  2: 10,
  3: 6,
  4: 3,
};
