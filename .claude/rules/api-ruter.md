---
paths:
  - "src/app/api/**/*.ts"
---

# API-ruter

- Tynne ruter — ruten parser input og kaller funksjoner i `lib/`, ingen forretningslogikk i ruten selv
- Zod-validering på alle API-inputs — valider body med `.safeParse()` og returner 400 ved feil
- async/await, ingen `.then()`-chains
- Feilhåndtering med try/catch og meningsfulle feilmeldinger

## Autentisering

- `join/`, `answer/`, `select-topic/` krever gyldig Better Auth session
- Hent session med `auth.api.getSession({ headers: await headers() })`
- Returner 401 hvis ingen session

## Race conditions

- Alle state-overganger bruker atomiske updates: `UPDATE ... SET status = 'new' WHERE status = 'expected'`
- Sjekk `rowCount === 0` — betyr at en annen request allerede tok overgangen, returner tidlig uten feil
- Kun requesten som vinner den atomiske overgangen starter side-effects (f.eks. AI-generering)

## Sikkerhet

- `correctIndex` sendes ALDRI til klienten under `question_active` — kun under `showing_answer`
- Strip `correctIndex` fra response før sending når status er `question_active`
