import { generateText, Output } from "ai";
import { z } from "zod";
import { openrouter } from "@/lib/ai";
import {
  QUESTIONS_PER_ROUND,
  ALTERNATIVES_PER_QUESTION,
} from "@/lib/constants";

const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        questionText: z.string(),
        options: z.array(z.string()).length(ALTERNATIVES_PER_QUESTION),
        correctIndex: z.number().min(0).max(ALTERNATIVES_PER_QUESTION - 1),
      })
    )
    .length(QUESTIONS_PER_ROUND),
});

export async function generateQuestions(topic: string) {
  const { output } = await generateText({
    model: openrouter("x-ai/grok-4.1-fast"),
    output: Output.object({ schema: questionsSchema }),
    prompt: `Lag ${QUESTIONS_PER_ROUND} quizspørsmål på norsk om temaet: "${topic}".

Krav:
- Spørsmålene skal være interessante og morsomme, ikke kjedelige lærebokspørsmål
- Varier vanskelighetsgraden — noen lette, noen vanskelige
- Hvert spørsmål skal ha ${ALTERNATIVES_PER_QUESTION} svaralternativer
- Kun ett alternativ skal være riktig
- Feil alternativer skal være troverdige, ikke åpenbart gale
- correctIndex er indeksen (0-${ALTERNATIVES_PER_QUESTION - 1}) til det riktige svaret
- Varier plasseringen av riktig svar mellom spørsmålene`,
  });

  if (!output) throw new Error("No output generated");

  return output.questions;
}
