import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  getOrCreateGame,
  getPlayer,
  getPlayerAnswer,
  getCurrentQuestion,
  submitAnswer,
  addPlayerScore,
  calculateScore,
} from "@/lib/db/queries";

const answerSchema = z.object({
  questionId: z.number(),
  selectedIndex: z.number(),
});

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { questionId, selectedIndex } = parsed.data;

    const game = await getOrCreateGame();
    if (game.status !== "question_active") {
      return NextResponse.json(
        { error: "Not accepting answers right now" },
        { status: 400 }
      );
    }

    const player = await getPlayer(game.id, session.user.id);
    if (!player) {
      return NextResponse.json(
        { error: "Player not found. Join the game first." },
        { status: 400 }
      );
    }

    const question = await getCurrentQuestion(
      game.id,
      game.currentQuestionIndex
    );
    if (!question || question.id !== questionId) {
      return NextResponse.json(
        { error: "Invalid question" },
        { status: 400 }
      );
    }

    const existing = await getPlayerAnswer(questionId, player.id);
    if (existing) {
      return NextResponse.json({
        success: true,
        correct: existing.selectedIndex === question.correctIndex,
        score: existing.score,
        alreadyAnswered: true,
      });
    }

    const isCorrect = selectedIndex === question.correctIndex;
    const score = calculateScore(isCorrect, game.phaseStartedAt);

    const answer = await submitAnswer(questionId, player.id, selectedIndex, score);

    if (!answer) {
      const existingAnswer = await getPlayerAnswer(questionId, player.id);
      return NextResponse.json({
        success: true,
        correct: existingAnswer?.selectedIndex === question.correctIndex,
        score: existingAnswer?.score ?? 0,
        alreadyAnswered: true,
      });
    }

    if (score > 0) {
      await addPlayerScore(player.id, score);
    }

    return NextResponse.json({
      success: true,
      correct: isCorrect,
      score,
    });
  } catch (error) {
    console.error("answer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
