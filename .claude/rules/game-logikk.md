---
paths:
  - "src/lib/game-logic.ts"
  - "src/lib/constants.ts"
  - "src/lib/types.ts"
---

# Spillogikk

## State machine

```
waiting_for_players
  → countdown (5s)                    [1+ spillere]
    → generating                      [AI lager 3 spørsmål]
      → question_active (10s)         [spørsmål 1]
        → showing_answer (3s)
      → question_active (10s)         [spørsmål 2]
        → showing_answer (3s)
      → question_active (10s)         [spørsmål 3]
        → showing_answer (3s)
      → topic_selection (15s)         [leaderboard + temavalg]
        → generating                  [løkke fortsetter]
  → waiting_for_players               [0 aktive spillere]
```

- Ingen `game_over` — kontinuerlig løkke
- Starter automatisk ved `MIN_PLAYERS` (1) spillere
- Stopper når ingen spillere har pollet innen `INACTIVE_TIMEOUT`

## Scoring

- Raskere svar = mer poeng
- Maks 1000, min 100, lineær interpolering basert på tid brukt
- Poeng nullstilles etter hver 3-spørsmålsrunde
- Leaderboard i `topic_selection` viser kun poeng fra siste runde

## Temavalg

- Vinneren av runden får velge neste tema via fritekst (`POST /api/select-topic`)
- Hvis vinneren ikke velger innen `TOPIC_SELECTION_TIME` — AI velger tilfeldig tema
- Første runde: tilfeldig tema fra predefinert liste

## Regler

- Bruk konstanter fra `constants.ts` — aldri hardkodede verdier
- Typer i `types.ts`, ikke inline
- `correctIndex` aldri i klient-response under `question_active`
- Spillere er aktive hvis de har pollet innen `INACTIVE_TIMEOUT` (10s)
