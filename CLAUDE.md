# Mario Kart Tournament App — The DOC Spelletjesavond

## Project Overview

Een lokale webapplicatie voor een Mario Kart toernooi tijdens de spelletjesavond van The DOC. De app draait op één laptop en is bereikbaar voor alle devices op hetzelfde WiFi-netwerk. Spelers kunnen zich de hele avond door inschrijven — het toernooiformat is ontworpen voor late joiners.

**Tech stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS  
**Opslag:** Lokale `tournament.json` file via API routes (fs read/write)  
**Hosting:** `next dev -H 0.0.0.0 -p 3000` op het lokale netwerk  
**Doelgroep:** 8-16 spelers, max 4 tegelijk per race, één avond gebruik

---

## Toernooi Format

### Fase 1 — Open Grand Prix (hele avond door)

- Spelers schrijven zich in wanneer ze willen
- Een admin (of het systeem) stelt per race een lobby samen van 2-4 spelers
- Na elke race wordt de finish-volgorde ingevoerd en bevestigd
- Punten per positie: **1e → 15 pts, 2e → 10 pts, 3e → 6 pts, 4e → 3 pts**
- Het klassement is gerangschikt op **gemiddelde punten per race** (niet totaal)
- Het systeem probeert matchups te variëren (niet steeds dezelfde tegenstanders)

### Fase 2 — Grand Final

- Wordt handmatig gestart door de admin wanneer het tijd is
- **Top 4 spelers** (op basis van gemiddeld) kwalificeren zich
- **Minimum 3 gespeelde races** om te kwalificeren
- De finale is een **best-of-3** (3 races, meeste 1e-plekken wint; bij gelijkspel telt het totaal aantal punten over de 3 finale-races)
- Tijdens de finale kunnen er geen reguliere races meer gestart worden

---

## Datamodel (tournament.json)

```typescript
interface Tournament {
  status: "open" | "finale" | "finished";
  players: Player[];
  races: Race[];
  finale: Finale | null;
  createdAt: string; // ISO timestamp
}

interface Player {
  id: string; // uuid
  name: string;
  character: Character;
  joinedAt: string; // ISO timestamp
}

interface Character {
  id: string; // bijv. "racer-rood"
  name: string; // bijv. "Racer Rood"
  color: string; // hex kleur bijv. "#E24B4A"
  abbreviation: string; // bijv. "MR" (2 letters)
}

interface Race {
  id: string; // uuid
  raceNumber: number; // oplopend: 1, 2, 3...
  playerIds: string[]; // 2-4 player ids
  results: RaceResult[] | null; // null = nog niet gespeeld
  status: "lobby" | "racing" | "finished";
  createdAt: string;
  finishedAt: string | null;
}

interface RaceResult {
  playerId: string;
  position: number; // 1, 2, 3, of 4
  points: number; // 15, 10, 6, of 3
}

interface Finale {
  qualifiedPlayerIds: string[]; // top 4 player ids
  races: FinaleRace[];
  winnerId: string | null;
}

interface FinaleRace {
  raceNumber: number; // 1, 2, of 3
  results: RaceResult[] | null;
  status: "pending" | "racing" | "finished";
}
```

---

## Beschikbare Personages (12 stuks)

Elk personage heeft een unieke kleur en 2-letter afkorting die als avatar dient. De personages zijn NIET de echte Mario Kart characters (vanwege copyright) maar eigen racers:

```typescript
const CHARACTERS: Character[] = [
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
```

---

## API Routes

Alle routes lezen/schrijven naar `tournament.json` in de project root.

### `GET /api/tournament`
Retourneert de volledige tournament state inclusief berekende standings.

**Response:**
```typescript
{
  tournament: Tournament;
  standings: StandingEntry[];
}

interface StandingEntry {
  player: Player;
  totalPoints: number;
  racesPlayed: number;
  averagePoints: number; // totalPoints / racesPlayed
  wins: number; // aantal 1e plekken
  qualified: boolean; // racesPlayed >= 3
}
```

Standings zijn gesorteerd op `averagePoints` (desc), dan `wins` (desc) als tiebreaker.

### `POST /api/players`
Schrijf een nieuwe speler in.

**Body:** `{ name: string, characterId: string }`  
**Validatie:**
- Naam mag niet leeg zijn en niet al bestaan
- Character mag niet al gekozen zijn door een andere speler
- Toernooi status moet "open" zijn (niet tijdens finale)

### `DELETE /api/players/:id`
Verwijder een speler (alleen als ze nog geen races gespeeld hebben).

### `POST /api/races`
Maak een nieuwe race/lobby aan.

**Body:** `{ playerIds: string[] }` (2-4 speler IDs)  
**Validatie:**
- Minimaal 2, maximaal 4 spelers
- Geen speler mag al in een actieve race zitten (status "lobby" of "racing")
- Toernooi status moet "open" zijn

### `PUT /api/races/:id/results`
Voer de uitslag van een race in.

**Body:** `{ results: { playerId: string, position: number }[] }`  
**Validatie:**
- Race moet bestaan en status "lobby" of "racing" hebben
- Alle spelers uit de race moeten een resultaat hebben
- Posities moeten uniek zijn (1 t/m aantal spelers)
- Punten worden automatisch berekend: pos 1→15, 2→10, 3→6, 4→3

### `POST /api/finale/start`
Start de Grand Final.

**Validatie:**
- Toernooi status moet "open" zijn
- Er moeten minimaal 4 spelers zijn met >= 3 gespeelde races
- Pakt de top 4 op basis van gemiddelde punten

**Effect:**
- Zet tournament.status op "finale"
- Maakt finale object aan met 3 pending races
- Annuleert eventuele actieve lobbies

### `PUT /api/finale/races/:raceNumber/results`
Voer de uitslag van een finale-race in.

**Body:** `{ results: { playerId: string, position: number }[] }`  
**Effect:**
- Na elke race wordt gecheckt of iemand 2x gewonnen heeft → winnaar
- Na 3 races: winnaar op basis van meeste 1e plekken, tiebreaker totaal punten
- Als er een winnaar is: tournament.status → "finished", finale.winnerId wordt gezet

### `POST /api/tournament/reset`
Reset het hele toernooi (verse start). Vraagt om bevestiging via query param `?confirm=true`.

### `GET /api/races/suggest`
Suggereert een lobby-samenstelling op basis van beschikbare spelers.

**Logica:**
- Filter spelers die niet in een actieve race zitten
- Prioriteer spelers die het langst niet gespeeld hebben
- Probeer spelers te matchen die nog niet vaak tegen elkaar gespeeld hebben
- Retourneert een array van 2-4 player IDs

---

## Pagina's / Schermen

### 1. Hoofdscherm / Leaderboard (`/`)

Het scherm dat op de laptop/TV staat. Toont:

- **Status banner** bovenaan: "Toernooi open — inschrijvingen welkom" (groen) of "Grand Final bezig" (oranje)
- **QR-code** die linkt naar `http://<server-ip>:3000/join` zodat mensen op hun telefoon kunnen inschrijven
- **Stats bar**: aantal spelers, races gereden, volgende race nummer
- **Klassement tabel** met:
  - Positie (1e, 2e, 3e met goud/zilver/brons kleuren)
  - Speler avatar (karakter kleur + afkorting)
  - Speler naam
  - Karakter naam
  - Gemiddelde punten (groot, vet)
  - Aantal gespeelde races
- **Kwalificatie info**: tags met "min. 3 races om te kwalificeren" en "top 4 naar finale"
- **Auto-refresh**: poll elke 5 seconden voor updates (of gebruik Server-Sent Events)

Gebruik de npm package `qrcode.react` om de QR-code te genereren. De QR-code URL moet dynamisch het IP-adres van de server bevatten — gebruik een API route `GET /api/server-info` die het lokale IP-adres retourneert (via `os.networkInterfaces()`).

### 2. Inschrijven (`/join`)

Mobile-friendly pagina voor spelers om zich in te schrijven:

- **Naam invoerveld** (groot, duidelijk)
- **Personage grid** (4 kolommen op mobiel, 4-6 op desktop):
  - Elke karakter als kaart met gekleurde avatar cirkel + naam
  - Beschikbare karakters: klikbaar met hover-effect
  - Gekozen karakters: uitgegreyed met "Gekozen door [naam]" eronder
  - Geselecteerd karakter: highlighted met border
- **"Doe mee" knop** (groot, opvallend, oranje/rood)
- Na succesvolle inschrijving: bevestigingsscherm met "Je doet mee! Wacht op je eerste race."

### 3. Admin / Lobby beheer (`/admin`)

Pagina voor de toernooibeheerder (Bart):

- **Nieuwe race aanmaken:**
  - Grid met beschikbare spelers (niet in een actieve race)
  - Klik om spelers toe te voegen aan de lobby (max 4)
  - "Auto-vullen" knop die `/api/races/suggest` aanroept
  - "Start race" knop om de lobby te bevestigen
- **Actieve races** overzicht:
  - Per race: race nummer, spelers met avatars, status
  - Knop om score invoer te openen
- **Race geschiedenis:**
  - Laatste 5-10 races met uitslagen
- **Toernooi acties:**
  - "Start Grand Final" knop (alleen enabled als er genoeg gekwalificeerde spelers zijn)
  - "Reset toernooi" knop (met bevestigingsdialoog)

### 4. Score invoer (`/race/:id/score`)

Scherm om na een race de uitslag in te voeren:

- **Race info** bovenaan: race nummer, welke spelers
- **Positie-slots** (1e t/m 4e, afhankelijk van aantal spelers):
  - Elke positie heeft een groot nummer (1e goud, 2e zilver, 3e brons, 4e grijs)
  - Dropdown/select met de spelers uit deze race
  - Punten worden automatisch getoond (15, 10, 6, 3)
  - Validatie: elke speler mag maar op één positie staan
- **Bevestigingssectie:**
  - Samenvatting: "1. Bart — 15 punten, 2. Lisa — 10 punten..."
  - Tekst: "Iedereen akkoord? Resultaat is definitief na bevestiging."
  - Grote "Uitslag bevestigen" knop
- Na bevestiging: redirect naar `/admin` of `/`

### 5. Grand Final (`/finale`)

Speciaal scherm voor de finale:

- **Gekwalificeerde spelers** (4 kaarten met avatar, naam, gemiddelde score)
- **Finale race tracker:**
  - 3 race slots: "Race 1", "Race 2", "Race 3"
  - Gespeelde races tonen de winnaar + "Gespeeld" badge
  - Volgende race toont "Volgende" badge met "Start finale race" knop
  - Race 3 alleen als nodig (als er na 2 races geen winnaar is met 2 zeges)
- **Score invoer** per finale-race (zelfde flow als reguliere score invoer, maar met alleen de 4 finalisten)
- **Winnaar scherm:** als er een winnaar is, groot scherm met confetti-animatie, winnaar avatar, "KAMPIOEN!" tekst

---

## UI Design Richtlijnen

### Kleurenpalet

- **Primair accent:** `#D85A30` (warm oranje, voor knoppen en highlights)
- **Achtergrond:** wit / lichtgrijs (`#F8F7F4`)
- **Goud/Zilver/Brons:** `#BA7517` / `#888780` / `#D85A30`
- **Status groen:** `#639922` (toernooi open)
- **Status oranje:** `#EF9F27` (finale bezig)
- **Tekst primair:** `#2C2C2A`
- **Tekst secundair:** `#888780`

### Typografie

- Gebruik het standaard Tailwind font-systeem
- Koppen: `font-semibold` of `font-bold`
- Body: `font-normal`
- Stats/getallen: `text-2xl font-bold` voor grote metrics

### Componenten

- **Avatar cirkel:** ronde div met karakter kleur als achtergrond, witte tekst met afkorting. Maten: sm (28px), md (36px), lg (52px), xl (64px)
- **Kaarten:** witte achtergrond, subtiele border (`border-gray-200`), rounded-lg, padding
- **Knoppen:** primair = oranje (`bg-[#D85A30]`), secundair = wit met border
- **Status badges:** kleine tags met gekleurde achtergrond + tekst

### Responsive

- Leaderboard (`/`): geoptimaliseerd voor laptop/TV scherm (breed)
- Join pagina (`/join`): geoptimaliseerd voor mobiel (smal)
- Admin (`/admin`): laptop/tablet
- Score invoer (`/race/:id/score`): werkt op zowel mobiel als laptop
- Finale (`/finale`): geoptimaliseerd voor TV/laptop

---

## Technische Details

### Server IP detectie

Maak een API route `GET /api/server-info` die het lokale IP-adres retourneert:

```typescript
import { networkInterfaces } from "os";

// Vind het eerste niet-interne IPv4 adres
function getLocalIP(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}
```

### Polling vs Realtime

Gebruik simpele polling met `setInterval` (elke 3-5 seconden) op alle pagina's die live data tonen. Dit is simpeler dan WebSockets en goed genoeg voor een toernooi met 8-16 spelers. Gebruik `SWR` of `React Query` voor data fetching met automatische revalidatie.

### File Locking

Omdat meerdere requests tegelijk naar `tournament.json` kunnen schrijven, gebruik een simpele in-memory lock:

```typescript
let writeLock = false;

async function withLock<T>(fn: () => Promise<T>): Promise<T> {
  while (writeLock) {
    await new Promise((r) => setTimeout(r, 10));
  }
  writeLock = true;
  try {
    return await fn();
  } finally {
    writeLock = false;
  }
}
```

### QR Code

Gebruik `qrcode.react` package:
```bash
npm install qrcode.react
```

De QR code linkt naar: `http://<server-ip>:3000/join`

### Startup

Voeg toe aan `package.json`:
```json
{
  "scripts": {
    "dev": "next dev -H 0.0.0.0 -p 3000",
    "tournament": "next dev -H 0.0.0.0 -p 3000"
  }
}
```

---

## Stappenplan voor Development

Bouw het project in deze volgorde:

1. **Project setup:** Next.js 15, TypeScript, Tailwind CSS, project structuur
2. **Datamodel + JSON opslag:** Types definieren, read/write helpers, initiële tournament.json
3. **API routes:** Alle endpoints implementeren met validatie
4. **Leaderboard pagina (`/`):** Hoofdscherm met klassement, QR-code, stats
5. **Join pagina (`/join`):** Inschrijving met karakter selectie
6. **Admin pagina (`/admin`):** Lobby beheer, race aanmaken, overzicht
7. **Score invoer (`/race/:id/score`):** Uitslag invoeren en bevestigen
8. **Grand Final (`/finale`):** Finale flow met race tracker en winnaar scherm
9. **Polish:** Animaties, error handling, edge cases, responsive finetuning
10. **Test:** Handmatig doorlopen van complete flow met testdata
