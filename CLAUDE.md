# XprQuiz

Live quiz-app der publikum spiller på mobilen i sanntid. AI genererer spørsmål basert på tilfeldige temaer.

## Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript, src/)
- **Styling:** Tailwind CSS 4
- **Database:** Neon Postgres (`@neondatabase/serverless`)
- **ORM:** Drizzle ORM
- **Auth:** Better Auth (`better-auth`) med email/passord
- **AI:** Vercel AI SDK med OpenRouter (`@openrouter/ai-sdk-provider`)
- **Deploy:** Vercel

## Arkitektur

Serverless-kompatibel. All game state lagres i Postgres med timestamps — ingen server som tikker.

- Klienter poller `GET /api/game-state` hvert sekund
- Game state beregnes fra timestamps ved hver request (ingen cron jobs)
- Klienten beregner nedtelling lokalt fra timestamps mellom polls for jevn UI — poll-responsen korrigerer/synkroniserer
- Poll-requests driver spillet fremover: hvis beregnet state viser at tiden er ute, trigger requesten selv overgangen
- Atomiske `UPDATE ... WHERE status = 'expected'` for å unngå race conditions — `rowCount === 0` betyr at en annen request allerede tok overgangen, gjør ingenting
- `countdown → generating` og `topic_selection → generating` trigger AI-spørsmålsgenerering — kun requesten som vinner den atomiske overgangen starter genereringen
- En spiller regnes som aktiv hvis de har pollet i løpet av de siste 10 sekundene — spillet går til `waiting_for_players` når ingen aktive spillere gjenstår
- `correctIndex` sendes ALDRI til klienten under `question_active` — kun under `showing_answer`
- Scoring: raskere svar = mer poeng. Maks 1000, min 100, lineær interpolering basert på tid brukt
- Én enkelt side (`src/app/page.tsx`) med ulike visninger basert på game state
- Temaer velges tilfeldig fra en predefinert liste

## Autentisering

Spillere må logge inn for å spille. Better Auth håndterer autentisering:

- **Metode:** Kun Google OAuth ("Logg inn med Google") — ingen email/passord
- **Adapter:** Drizzle med Neon Postgres
- **Config:** `src/lib/auth.ts` — Better Auth server-instans
- **API-rute:** `src/app/api/auth/[...all]/route.ts` — catch-all for auth-endepunkter
- **Klient:** `src/lib/auth-client.ts` — Better Auth klient for frontend
- Player-tabellen har en `user_id`-kolonne som lenker til auth-brukeren
- Join- og answer-endepunkter krever gyldig session
- Spillernavn hentes fra auth-brukerens `name`-felt ved registrering

## State Machine

waiting_for_players
→ countdown (5s) [triggers ved 1+ spillere]
→ generating [AI lager 3 spørsmål, tilfeldig tema første gang]
→ question_active (10s) [spørsmål 1, 4 alternativer]
→ showing_answer (3s)
→ question_active (10s) [spørsmål 2, 4 alternativer]
→ showing_answer (3s)
→ question_active (10s) [spørsmål 3, 4 alternativer]
→ showing_answer (3s)
→ topic_selection (15s) [vis leaderboard + vinneren av denne runden velger neste tema]
→ generating [AI lager 3 nye spørsmål basert på valgt tema]
→ ... [løkke fortsetter]
→ waiting_for_players [når ingen aktive spillere gjenstår]

Ingen runder eller `game_over` — spillet kjører kontinuerlig i en løkke: 3 spørsmål → leaderboard + temavalg → 3 spørsmål → ...
Spillet starter automatisk når første spiller joiner. Ingen admin-funksjonalitet.
Spillet stopper og går tilbake til `waiting_for_players` når ingen spillere har pollet de siste 10 sekundene.

**Temavalg:** Etter hver runde med 3 spørsmål får spilleren med høyest score på den runden 15 sekunder til å velge neste tema via fritekst-input (`POST /api/select-topic`). Hvis vinneren ikke velger innen tiden, velger AI et tilfeldig tema.

**Scoring:** Poeng nullstilles etter hver 3-spørsmålsrunde. Leaderboardet i `topic_selection` viser kun poeng fra de siste 3 spørsmålene.

**Aktivitet:** Hver spiller har en `last_polled_at`-timestamp som oppdateres ved hver `GET /api/game-state`-request. Spillere som ikke har pollet innen `INACTIVE_TIMEOUT` regnes som inaktive.

Spillere må være innlogget for å se `waiting_for_players`-skjermen og joine.

## Timing-konstanter

Alle timing-verdier skal ligge i `src/lib/constants.ts`:

| Konstant                  | Verdi | Beskrivelse                                          |
| ------------------------- | ----- | ---------------------------------------------------- |
| COUNTDOWN_TIME            | 5000  | Nedtelling før spillet starter (ms)                  |
| QUESTION_TIME             | 10000 | Tid per spørsmål (ms)                                |
| SHOW_ANSWER_TIME          | 3000  | Vis riktig svar (ms)                                 |
| TOPIC_SELECTION_TIME      | 15000 | Tid for vinneren å velge neste tema (ms)             |
| POLL_INTERVAL             | 1000  | Klient-polling intervall (ms)                        |
| QUESTIONS_PER_ROUND       | 3     | Antall spørsmål per temarunde                        |
| ALTERNATIVES_PER_QUESTION | 4     | Antall svaralternativer                              |
| MIN_PLAYERS               | 1     | Minimum spillere for å starte                        |
| INACTIVE_TIMEOUT          | 10000 | Tid uten polling før spiller regnes som inaktiv (ms) |

## Kodestil

- Alltid async/await (ingen .then()-chains)
- Zod-validering på alle API-inputs
- Tynne API-ruter — forretningslogikk i `lib/`
- Typer i `src/lib/types.ts`, ikke inline
- Feilhåndtering med try/catch og meningsfulle feilmeldinger

## Kommandoer

```bash
npm run dev          # Start utviklingsserver
npm run build        # Bygg for produksjon
npx drizzle-kit push # Push schema til database
npx drizzle-kit studio # Åpne Drizzle Studio
vercel --prod        # Deploy til Vercel
```

## Mappestruktur

src/
├── app/
│ ├── api/
│ │ ├── auth/[...all]/route.ts # Better Auth catch-all
│ │ ├── game-state/route.ts # GET: poll game state
│ │ ├── join/route.ts # POST: registrer spiller (krever session)
│ │ ├── answer/route.ts # POST: registrer svar (krever session)
│ │ ├── select-topic/route.ts # POST: vinneren velger neste tema (krever session)
│ │ └── generate-questions/route.ts # POST: generer spørsmål
│ ├── layout.tsx
│ └── page.tsx # Hele UI-et (use client)
└── lib/
├── auth.ts # Better Auth server config
├── auth-client.ts # Better Auth klient
├── ai.ts # OpenRouter provider setup
├── constants.ts # Timing-konstanter
├── types.ts # TypeScript-typer
├── game-logic.ts # Ren state-beregning
├── ai/
│ └── generate-questions.ts # Quiz-generering med prompt
└── db/
├── index.ts # Neon connection
├── schema.ts # Drizzle schema
└── queries.ts # Database-queries
