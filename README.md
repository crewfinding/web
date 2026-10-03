# CrewFinding Web

`app.crewfinding.com` — the central office for CrewFinding: dispatch, scheduling,
customers, invoicing, team and billing on a big screen. The mobile app stays the
full product for field workers; this is the desk side. Both use the same API and
the same `@fonderie/*` packages.

See [docs/PLAN.md](docs/PLAN.md) for the screens, the phases, and the rules
(billing per client, development style).

## Develop

```bash
npm ci
cp .env.example .env.local   # point VITE_API_URL at a running CrewFinding API
npm run dev                  # http://localhost:5173
```

## Gates (before every push)

```bash
npm run lint
npm run typecheck
npm run build
npm run check:brand          # no other product's name in the source
npm run test:e2e             # needs the API running — see tests/e2e/README.md
```

Stack: Vite, React 19, TypeScript, Tailwind 4, React Router, react-hook-form,
sonner, Phosphor icons, oxlint, Playwright.
