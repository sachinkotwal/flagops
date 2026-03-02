# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (runs on port 9002)
npm run dev

# Production build
npm run build

# Type checking (errors are ignored during build per next.config.ts, but useful for development)
npm run typecheck

# Lint
npm run lint

# Genkit AI dev server (separate process for testing AI flows)
npm run genkit:dev
npm run genkit:watch
```

## Architecture

**FlagOps** is a Next.js 15 (App Router) governance dashboard for Optimizely feature flags. It is **not** a Vite/React SPA — despite the original design prompt describing a Vite setup, the actual implementation uses Next.js with the App Router and `"use client"` directives.

### Data Architecture

The app merges two data sources at runtime in `src/app/page.tsx`:
1. **Optimizely FX REST API** (`src/lib/optimizely.ts`) — source of truth for flag config (key, name, description, environments, timestamps)
2. **Firebase Firestore** (`src/lib/firebase.ts`) — source of truth for governance metadata (owner, team, notes)

Both are fetched in parallel via `Promise.all` and merged into a unified flag object. Governance fields (`owner`, `team`, `notes`, `hasGovernance`) are overlaid onto the Optimizely flag shape.

**Fallback behavior**: Both API clients include embedded mock data. If `NEXT_PUBLIC_OPTIMIZELY_API_TOKEN`/`PROJECT_ID` are missing, mock flags are returned. If Firestore is unreachable or empty, hardcoded `MOCK_GOVERNANCE` is returned.

### Environment Variables

Required in `.env.local`:

```
# Server-only (no NEXT_PUBLIC_ — never sent to browser)
OPTIMIZELY_API_TOKEN
OPTIMIZELY_PROJECT_ID

# Client-side Firebase (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

GOOGLE_GENAI_API_KEY  # for Genkit AI flow
```

The Optimizely token is **server-only** — it is proxied through a Next.js API route (`/api/optimizely/flags`) and never exposed to the browser.

### Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Single-page app — all tab layout and UI; uses React Query hooks for data |
| `src/app/api/optimizely/flags/route.ts` | Server-side proxy to Optimizely API; keeps token out of the browser |
| `src/hooks/useFlags.ts` | React Query hooks: `useMergedFlags`, `useOptimizelyFlags`, `useGovernanceData`, `useSettings`, `useUpdateGovernance` |
| `src/providers/query-provider.tsx` | `QueryClientProvider` wrapper (staleTime: 5 min for flags) |
| `src/lib/optimizely.ts` | Fetches from `/api/optimizely/flags` (internal route); throws `OptimizelyUnconfiguredError` if env vars are missing |
| `src/lib/firebase.ts` | Firestore client for governance CRUD; no mock data fallback |
| `src/utils/naming.ts` | Core governance logic: `isValidName()`, `getViolations()`, `getHealthScore()`, `daysSince()` |
| `src/ai/flows/suggest-governance-correction-flow.ts` | Genkit flow using Gemini 2.5 Flash for AI-powered governance suggestions |
| `src/ai/genkit.ts` | Genkit + Google AI plugin configuration |

### Firestore Collections

- `governance/{flagKey}` — per-flag governance metadata (owner, team, notes)
- `settings/config` — app-wide config (teams list, owners list, naming pattern, stale threshold)

If `settings/config` is missing, defaults are used (teams: Platform/Growth/Checkout/Search/Mobile/Infra, staleDays: 90).

### Violation System

`getViolations(flag)` in `src/utils/naming.ts` returns typed `FlagViolation[]` with `severity: 'error' | 'warning'`:
- **error**: invalid naming pattern, missing owner, missing team
- **warning**: missing description, stale (>90 days), no governance record

Health score = percentage of flags with zero violations.

### UI Conventions

- Dark theme only — all colors are defined as CSS custom properties in `globals.css` and Tailwind tokens in `tailwind.config.ts`
- `font-code` class applies JetBrains Mono (flag keys, stat values)
- `glass` CSS class = `rgba(255,255,255,0.03)` bg + `backdrop-filter: blur(20px)` + subtle border
- UI components are shadcn/ui (Radix-based) in `src/components/ui/`
- Custom dashboard components (`StatCard`, `HealthGauge`, `BarChart`) are in `src/components/dashboard/`
- `Badge` and `EnvDots` are in `src/components/shared/`

### AI Flow (Genkit)

`suggestGovernanceCorrection` in `src/ai/flows/` is a server-side Genkit flow marked `'use server'`. It takes a merged flag + settings and returns structured suggestions (corrected key, suggested owner/team/description, stale action). The flow uses Gemini 2.5 Flash via `@genkit-ai/google-genai`. Run the Genkit dev server separately with `npm run genkit:dev` to test flows in the Genkit UI.

### TypeScript / Build Notes

`next.config.ts` has `ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true` — builds succeed even with type errors. Use `npm run typecheck` to catch type issues during development.
