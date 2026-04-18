<div align="center">

# Sift

**Point your camera. Get a score. Make better decisions.**

[![Expo](https://img.shields.io/badge/Expo-SDK%2055-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.83-61DAFB?style=flat-square&logo=react&logoColor=white)](https://reactnative.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat-square&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini)
[![NativeWind](https://img.shields.io/badge/NativeWind-v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://nativewind.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

Sift is a personal decision engine. Scan any product, restaurant, or food item with your camera and get back an AI-powered score (0–100), a confident verdict, and smarter local and online alternatives — all weighted by what actually matters to you.

## Screenshots

| Scan | Results | History | Profile |
|------|---------|---------|---------|
| ![Scan](assets/screenshots/scan.png) | ![Results](assets/screenshots/results.png) | ![History](assets/screenshots/history.png) | ![Profile](assets/screenshots/profile.png) |

## Features

- **Camera scan** — point at anything and capture. Sift identifies it instantly.
- **AI scoring** — every item gets a 0–100 score weighted by your preferences (price, quality, ethics, health, speed).
- **Confident verdicts** — Buy/Skip for products, Go/Pass for restaurants. No hedging.
- **Score breakdown** — see how each dimension contributed to the final score.
- **Nearby alternatives** — local places within your radius, ranked by distance.
- **Online alternatives** — price comparisons with direct purchase links.
- **Preference engine** — set your weights once; every scan reflects them automatically.
- **Scan history** — every decision saved, searchable, with timestamps.
- **Guest mode** — works without an account.
- **Dark mode** — premium dark UI throughout.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Expo (React Native)                  │
│                                                         │
│  ┌──────────┐   ┌──────────┐   ┌──────────────────┐   │
│  │  Camera  │──▶│  Zustand │◀──│  Supabase Client │   │
│  │  Capture │   │  Store   │   │  (Auth + DB)      │   │
│  └──────────┘   └──────────┘   └──────────────────┘   │
└──────────────────────────┬──────────────────────────────┘
                           │ supabase.functions.invoke
         ┌─────────────────┴─────────────────┐
         │                                   │
┌────────▼──────────┐             ┌──────────▼──────────┐
│   analyze-item    │             │  find-alternatives  │
│   (Deno + Gemini) │             │  (Places + Serper)  │
│                   │             │                     │
│  Image → JSON     │             │  Query → Local +    │
│  score/verdict/   │             │  Online results     │
│  breakdown        │             │                     │
└───────────────────┘             └─────────────────────┘
```

**Data flow:**
1. Camera captures image → base64 encoded
2. `analyze-item` edge function calls Gemini 2.5 Flash with the image and user preferences
3. Gemini returns structured JSON: score, verdict, reasoning, 5-dimension breakdown
4. `find-alternatives` queries Google Places (nearby) and Serper (online shopping) in parallel
5. Result saved to Supabase, displayed in results screen

All API keys live in Supabase edge function secrets. Nothing sensitive is bundled into the client.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 / React Native 0.83 |
| Routing | Expo Router (file-based) |
| Styling | NativeWind v4 (Tailwind CSS for React Native) |
| Animations | React Native Reanimated 4 |
| State | Zustand |
| AI Vision | Google Gemini 2.5 Flash |
| Local search | Google Places API (New) |
| Price comparison | Serper.dev — Google Shopping |
| Backend | Supabase (Auth, Postgres, Edge Functions, Storage) |
| Language | TypeScript (strict) |

## Project Structure

```
app/
├── (auth)/                # Login + signup screens
├── (onboarding)/          # Welcome + preference setup flow
├── (tabs)/                # Main app: Scan, History, Profile
│   ├── index.tsx          # Camera scan screen
│   ├── history.tsx        # Scan history list
│   └── profile.tsx        # Preferences + account
└── results/
    └── [scanId].tsx       # Score, verdict, and alternatives

components/
├── camera/
│   └── SiftCamera.tsx     # expo-camera wrapper with permission handling
├── results/
│   ├── ScoreRing.tsx      # Animated SVG score ring (0–100)
│   ├── VerdictBadge.tsx   # Colored verdict pill
│   ├── ReasoningCard.tsx  # AI reasoning + animated score breakdown
│   ├── LocalAlternativeCard.tsx
│   └── OnlineAlternativeCard.tsx
└── ui/
    ├── PreferenceSlider.tsx
    └── LoadingOverlay.tsx

lib/
├── supabase.ts            # Supabase client
├── theme.ts               # Design system color tokens
├── types.ts               # TypeScript interfaces
└── utils.ts               # Color helpers, formatters

hooks/
├── useAuth.ts
└── usePreferences.ts

store/
└── index.ts               # Zustand store

supabase/
├── functions/
│   ├── analyze-item/      # Gemini vision + scoring
│   └── find-alternatives/ # Google Places + Serper
└── migrations/
    └── 001_initial.sql
```

## Local Setup

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)
- [Supabase account](https://supabase.com) (free tier works)
- [Expo Go](https://expo.dev/go) on your phone (for mobile testing)

### 1. Clone and install

```bash
git clone https://github.com/AddisonTech/Sift.git
cd Sift
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set up Supabase

**Database schema** — run the migration in your Supabase SQL editor:

```bash
# Using Supabase CLI
supabase db push

# Or copy-paste supabase/migrations/001_initial.sql into the Supabase SQL editor
```

**Edge function secrets** — set these in your Supabase project dashboard under Project Settings → Edge Functions:

| Secret | Where to get it |
|--------|----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `GOOGLE_PLACES_KEY` | [Google Cloud Console](https://console.cloud.google.com) — enable Places API (New) |
| `SERPER_API_KEY` | [Serper.dev](https://serper.dev) |

**Deploy edge functions:**

```bash
supabase functions deploy analyze-item
supabase functions deploy find-alternatives
```

### 4. Run the app

```bash
# Mobile (scan the QR code with Expo Go)
npx expo start

# Web
npx expo start --web

# iOS simulator
npx expo start --ios

# Android emulator
npx expo start --android
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public key |

Edge function secrets (set in Supabase dashboard, not `.env`):

| Secret | Required | Description |
|--------|----------|-------------|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for vision analysis |
| `GOOGLE_PLACES_KEY` | ⚠️ | Google Places API key — local alternatives only work with this |
| `SERPER_API_KEY` | ⚠️ | Serper API key — online alternatives only work with this |

The app functions without Places and Serper keys — those features just return empty results.

## Database Schema

The Supabase schema has three main tables:

- **`profiles`** — user display name and avatar, linked to auth.users
- **`user_preferences`** — per-user scoring weights, dietary filters, budget, radius
- **`scans`** — every scan result including score, verdict, reasoning, and alternatives (stored as JSONB)

Row-level security is enabled on all tables.

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with a clean message
4. Push and open a pull request

## License

MIT
