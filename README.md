# Sift

Point your camera at anything in the real world — a product, a restaurant, a meal — and get back a score, a verdict, and smarter alternatives.

## What it does

- **Scan anything** — point your camera and tap. Sift identifies what it's looking at.
- **Score 0–100** — weighted by what you actually care about: price, quality, ethics, health, speed.
- **Verdict** — Buy/Skip for products, Go/Pass for restaurants. Confident, no hedging.
- **Nearby alternatives** — local places within your preferred radius, sorted by distance.
- **Online alternatives** — price comparisons with direct links.
- **Learns over time** — your preferences shape every score.

## Stack

| Layer | Choice |
|---|---|
| Framework | Expo (React Native) SDK 54 |
| Styling | NativeWind v4 (Tailwind for React Native) |
| Vision | Gemini 2.5 Flash |
| Local alternatives | Google Places API |
| Price comparison | Serper.dev (Google Shopping) |
| Backend | Supabase (Auth + Postgres + Edge Functions) |

All API keys live server-side in Supabase Edge Functions. Nothing sensitive touches the client.

## Screens

- **Onboarding** — set your preference weights (price vs quality vs ethics, etc.), budget range, dietary restrictions, distance radius
- **Scan** — full-screen camera with animated viewfinder
- **Results** — animated score ring, verdict badge, reasoning, local + online alternatives
- **History** — every past scan with score and verdict
- **Profile** — edit preferences anytime, auto-saved

## Running locally

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase project URL and anon key:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. In your Supabase project, run `supabase/migrations/001_initial.sql` to set up the schema.
5. Deploy the edge functions and set their secrets:
   ```
   GEMINI_API_KEY
   GOOGLE_PLACES_KEY
   SERPER_API_KEY
   ```
6. Start the app:
   ```bash
   npx expo start
   ```
   Scan the QR code in Expo Go.

## Project structure

```
app/
  (auth)/          # Login and signup
  (onboarding)/    # Welcome + preference setup
  (tabs)/          # Main tab screens (Scan, History, Profile)
  results/         # Results screen [scanId]
components/
  camera/          # SiftCamera wrapper
  results/         # ScoreRing, VerdictBadge, cards
  ui/              # Shared UI components
lib/               # Supabase client, types, utilities
hooks/             # useAuth, usePreferences
store/             # Zustand store
supabase/
  functions/       # Edge functions (analyze-item, find-alternatives)
  migrations/      # Database schema
```
