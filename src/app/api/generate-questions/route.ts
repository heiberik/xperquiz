import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getGameById,
  insertQuestions,
  updateGameForQuestionPhase,
  atomicStatusUpdate,
} from "@/lib/db/queries";
import { generateQuestions } from "@/lib/ai/generate-questions";

const requestSchema = z.object({
  gameId: z.number(),
  topic: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { gameId, topic } = parsed.data;

  try {
    const game = await getGameById(gameId);
    if (!game || game.status !== "generating") {
      return NextResponse.json(
        { error: "Game is not in generating state" },
        { status: 400 }
      );
    }

    const generated = await generateQuestions(topic);

    await insertQuestions(gameId, generated);
    await updateGameForQuestionPhase(gameId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to generate questions:", error);

    try {
      await atomicStatusUpdate(
        gameId,
        "generating",
        "waiting_for_players",
        new Date()
      );
    } catch {
      console.error("Failed to reset game status after error");
    }

    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
