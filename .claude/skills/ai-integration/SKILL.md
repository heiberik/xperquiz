---
name: ai-integrasjon
description: >
  Integrasjonsmønstre for OpenRouter og Vercel AI SDK for AI-drevet quiz-spørsmålsgenerering.
  Dekker provider-oppsett, modellvalg (x-ai/grok-4.1-fast via OpenRouter), generateObject
  med Zod-schema for strukturert output, prompt engineering-teknikker og output-validering.
---

# AI-integrasjon — OpenRouter + Vercel AI SDK

## Provider-setup
```typescript
// src/lib/ai.ts
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});
```

## Modell

Bruk `x-ai/grok-4.1-fast` som standard (rask, rimelig, mer enn god nok for quiz-generering). Modellen spesifiseres slik:
```typescript
openrouter("x-ai/grok-4.1-fast")
```

## Genereringsmetode

Bruk `generateObject` fra Vercel AI SDK med Zod-schema for structured output. Dette gir typesikker output, automatisk validering, og retry ved schema-brudd.
```typescript
import { generateObject } from "ai";
import { openrouter } from "@/lib/ai";
import { z } from "zod";

const { object: questions } = await generateObject({
  model: openrouter("x-ai/grok-4.1-fast"),
  schema: QuestionsSchema,
  prompt: "...",
});
// questions er allerede typet og validert — ingen manuell parsing
```

## Quiz-prompt

Prompten bruker flere etablerte prompt engineering-teknikker for best mulig resultat:
Du er en erfaren quiz-master som lager spørsmål for en live quiz-konkurranse.
Lag 3 unike quiz-spørsmål om temaet: "${topic}"
TENK STEG FOR STEG:

Velg 3 ulike deltemaer innenfor "${topic}" for variasjon
Formuler entydige spørsmål med kun ett riktig svar
Lag 3 troverdige distraktorer per spørsmål som er feil men realistiske
Dobbeltsjekk at correctIndex peker på riktig svar

EKSEMPEL 1 (tema: "verdensrommet"):
[
{
"question": "Hvilken planet i solsystemet har flest bekrefta måner?",
"alternatives": ["Jupiter", "Saturn", "Uranus", "Neptun"],
"correctIndex": 1,
"topic": "verdensrommet"
}
]
EKSEMPEL 2 (tema: "norsk mat"):
[
{
"question": "Hvilken norsk by er kjent som 'klippfiskbyen'?",
"alternatives": ["Kristiansund", "Ålesund", "Bergen", "Tromsø"],
"correctIndex": 0,
"topic": "norsk mat"
}
]
REGLER:

Svar KUN med en JSON-array med 3 objekter
Hvert objekt har: question (string), alternatives (array med 4 strings), correctIndex (0-3), topic (string)
Spørsmålene skal ha varierende vanskelighetsgrad
Ingen åpenbart dumme svaralternativer — alle skal virke troverdige
Spørsmålene skal være på norsk
Ikke inkluder forklaringer, kun JSON


## Zod-schema for structured output
```typescript
const QuestionSchema = z.object({
  question: z.string(),
  alternatives: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  topic: z.string(),
});

const QuestionsSchema = z.object({
  questions: z.array(QuestionSchema).length(3),
});
```
`generateObject` krever et objekt som toppnivå-schema — derfor wrapper vi arrayen i `{ questions: [...] }`.

## Predefinerte temaer

Bruk en liste med varierte temaer som velges tilfeldig per runde:
```typescript
const THEMES = [
  "norsk geografi",
  "80-talls musikk",
  "vitenskap og oppfinnelser",
  "sport og OL",
  "verdenshistorie",
  "mat fra hele verden",
  "film og TV",
  "dyr og natur",
  "teknologi",
  "kuriosa og rare fakta",
];
```

## Prompt Engineering-teknikker brukt

| Teknikk | Hvor | Hvorfor |
|---|---|---|
| **Rolle-setting** | "Du er en erfaren quiz-master..." | Gir modellen kontekst for tone og kvalitet |
| **Chain of Thought** | "TENK STEG FOR STEG: 1. velg deltemaer..." | Tvinger modellen til systematisk gjennomgang |
| **Few-shot examples** | To komplette JSON-eksempler | Viser eksakt ønsket format og kvalitetsnivå |
| **Negative constraints** | "Ingen åpenbart dumme svar" | Forbedrer kvaliteten på distraktorer |
| **Structured output** | Zod-schema via `generateObject` | Garantert gyldig, typesikker output — ingen manuell parsing |
