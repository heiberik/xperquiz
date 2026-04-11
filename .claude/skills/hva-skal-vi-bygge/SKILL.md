---
name: hva-skal-vi-bygge
description: Bruk denne når brukeren spør "Hva skal vi bygge?", "Hva er XperQuiz?", "Hva er planen?", "Hva er dette prosjektet?", eller lignende spørsmål om hva som skal bygges.
---

# Hva skal vi bygge?

Svar kort og uformelt. Ikke referer til workshoppen — svar som om hvem som helst kunne spurt.

---

**XperQuiz** — en live quiz-app der publikum spiller på mobilen i sanntid.

Du logger inn med Google, ett klikk, og er med. AI-en genererer spørsmål om tilfeldige temaer, og du har 10 sekunder per spørsmål — raskere svar gir mer poeng. Vinneren av hver runde velger neste tema. Spillet kjører kontinuerlig uten noen admin.

Under panseret har vi Google OAuth for innlogging, AI-generering med structured output, serverless polling, atomiske database-oppdateringer for å håndtere race conditions, og en state machine som er styrt av timestamps.

Tech-stacken er Next.js 15, Tailwind, Neon Postgres, Drizzle, Better Auth, Vercel AI SDK med OpenRouter. Alt deployes på Vercel.
