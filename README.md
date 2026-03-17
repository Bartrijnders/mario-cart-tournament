# 🏎️ Mario Kart Toernooi

Een real-time toernooi-app voor Mario Kart spelletjesavonden. Beheer races vanaf je telefoon, laat het leaderboard zien op een groot scherm, en laat spelers zich inschrijven door een QR-code te scannen.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss)
![Upstash Redis](https://img.shields.io/badge/Upstash-Redis-DC382D?logo=redis)

---

## ✨ Features

**Voor spelers**
- 📱 QR-code scannen om mee te doen
- 🎮 Kies je eigen Mario Kart personage (50+ characters)
- 📊 Live klassement volgen op je eigen telefoon

**Voor de organisator**
- 🏁 Races aanmaken en uitslagen invoeren vanaf je telefoon
- 🎲 Slim auto-vullen: suggereert spelers die het minst samen geraced hebben
- ⚡ Grand Final modus (best-of-3) voor de top 4
- 🔄 Toernooi resetten voor de volgende avond

**Het klassement**
- 🏆 Ranking op gemiddelde punten per race
- ⭐ Minimaal 3 races nodig om te kwalificeren voor de finale
- 🥇 Top 4 gekwalificeerden gaan door naar de Grand Final

## 📐 Puntensysteem

| Positie | Punten |
|---------|--------|
| 🥇 1e   | 15     |
| 🥈 2e   | 10     |
| 🥉 3e   | 6      |
| 4e      | 3      |

## 🚀 Aan de slag

### Vereisten

- Node.js 18+
- Een [Upstash Redis](https://console.upstash.com) database (gratis)

### Installatie

```bash
git clone https://github.com/Bartrijnders/mario-cart-tournament.git
cd mario-cart-tournament
npm install
```

Maak een `.env.local` bestand aan:

```env
UPSTASH_REDIS_REST_URL=je-upstash-url
UPSTASH_REDIS_REST_TOKEN=je-upstash-token
```

Start de dev server:

```bash
npm run dev
```

### Deploy naar Vercel

1. Push je repo naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en importeer het project
3. Voeg de Upstash environment variables toe
4. Deploy — klaar!

## 🎮 Hoe het werkt

### Opzet (voor het toernooi)

1. Open de app op een **groot scherm** (TV/monitor) → dit is je leaderboard
2. Open `/admin` op je **telefoon** → dit is je beheer-dashboard
3. Spelers scannen de **QR-code** op het leaderboard om zich in te schrijven

### Tijdens het toernooi

1. **Maak een race aan** via de admin pagina (of gebruik auto-vullen)
2. **Speel de race** in Mario Kart
3. **Voer de uitslag in** op je telefoon
4. Het leaderboard updatet automatisch elke 5 seconden

### De finale

Zodra minimaal 4 spelers elk 3+ races gespeeld hebben, kun je de **Grand Final** starten. De top 4 spelen een best-of-3 — de eerste speler met 2 overwinningen is kampioen! 🏆

## 🗂️ Pagina's

| Route | Beschrijving |
|-------|-------------|
| `/` | Leaderboard — toon op groot scherm |
| `/join` | Inschrijfpagina — spelers komen hier via QR-code |
| `/admin` | Beheer — races aanmaken, uitslagen invoeren |
| `/finale` | Grand Final — best-of-3 finale tracker |

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Taal**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: Upstash Redis (REST)
- **QR Codes**: qrcode.react
- **Hosting**: Vercel

## 📝 Licentie

MIT
