# Qeemly Frontend UI

Frontend-only implementation of the Qeemly marketing site and dashboard shell. Stack: Next.js (App Router) + TypeScript + Tailwind v4 with Poppins.

## Run locally

```bash
npm install
npm run dev
# visit http://localhost:3000
```

## Structure
- `app/(marketing)/*` - marketing pages (home, search, pricing, contact) plus root route.
- `app/(dashboard)/*` - dashboard shell with placeholder pages for benchmarks, reports, compliance, settings.
- `app/login`, `app/register` - auth placeholders for future Supabase auth.
- `components/ui` - shared primitives (button, badge, card, chip, input).
- `components/layout` - nav and footer; `components/dashboard` - sidebar.
- `lib/constants.ts` - mock data for tiles and chips.

## Branding
Primary purple palette with teal accent:
- brand: `#824ae1`, `#6a2ed3`, `#5523aa`, `#3f1c82`
- accent teal: `#2ec0aa`, `#16aa94`
- backgrounds: `#f7f6fb`, cards `#ffffff`, muted `#f1ecfb`

## Supabase handoff notes
- Auth: wire `/login` and `/register` to Supabase Auth (magic links/OTP). Button primitives are ready for client handlers.
- Data: replace mock data in `lib/constants.ts` and dashboard cards with Supabase RPC/queries for salary ranges, expat vs local diffs, and activity feeds.
- Routing: protected dashboard group lives under `/dashboard/*`; wrap `(dashboard)/layout.tsx` with Supabase session provider when backend is ready.
- Forms: contact and register forms are static; point submit handlers to Supabase edge functions or tables once available.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - lint with Next config
