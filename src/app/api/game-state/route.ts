import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { computeTransition, computeTimeRemaining } from "@/lib/game-logic";
import {
  getOrCreateGame,
  getPlayer,
  updateLastPolledAt,
  countActivePlayers,
  getActivePlayers,
  atomicStatusUpdate,
  resetForNewRound,
  getCurrentQuestion,
  getLeaderboard,
  getRoundWinner,
  getGameById,
  updateGameTopic,
  incrementQuestionIndex,
  getAnswerDistribution,
} from "@/lib/db/queries";
import { QUESTIONS_PER_ROUND, RANDOM_TOPICS } from "@/lib/constants";
import type { GameStatus, GameState } from "@/lib/types";

function pickRandomTopic(): string {
  return RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];
}

async function triggerGenerateQuestions(
  origin: string,
  gameId: number,
  topic: string
) {
  try {
    const res = await fetch(`${origin}/api/generate-questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId, topic }),
    });
    if (!res.ok) {
      console.error("generate-questions failed:", await res.text());
      await atomicStatusUpdate(
        gameId,
        "generating",
        "waiting_for_players",
        new Date()
      );
    }
  } catch (error) {
    console.error("generate-questions error:", error);
    await atomicStatusUpdate(
      gameId,
      "generating",
      "waiting_for_players",
      new Date()
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const game = await getOrCreateGame();
    const player = await getPlayer(game.id, session.user.id);

    if (!player) {
      const activePlayers = await getActivePlayers(game.id);
      return NextResponse.json<GameState>({
        status: game.status as GameStatus,
        timeRemaining: computeTimeRemaining(
          game.status as GameStatus,
          game.phaseStartedAt,
          new Date()
        ),
        players: activePlayers,
        currentQuestion: null,
        questionId: null,
        answerDistribution: null,
        questionIndex: game.currentQuestionIndex,
        questionsPerRound: QUESTIONS_PER_ROUND,
        topic: game.currentTopic,
        roundWinner: null,
        playerId: null,
      });
    }

    await updateLastPolledAt(player.id);

    const activePlayerCount = await countActivePlayers(game.id);
    const now = new Date();
    const transition = computeTransition(game, activePlayerCount, now);

    let currentStatus = game.status as GameStatus;
    let currentPhaseStartedAt = game.phaseStartedAt;
    let currentQuestionIdx = game.currentQuestionIndex;
    let currentTopic = game.currentTopic;

    if (transition.shouldTransition && transition.newStatus) {
      const result = await atomicStatusUpdate(
        game.id,
        game.status as GameStatus,
        transition.newStatus,
        now
      );

      if (result.rowCount === 0) {
        const freshGame = (await getGameById(game.id))!;
        currentStatus = freshGame.status as GameStatus;
        currentPhaseStartedAt = freshGame.phaseStartedAt;
        currentQuestionIdx = freshGame.currentQuestionIndex;
        currentTopic = freshGame.currentTopic;
      } else {
        currentStatus = transition.newStatus;
        currentPhaseStartedAt = now;

        const origin = new URL(request.url).origin;

        if (
          transition.reason === "countdown_elapsed" ||
          transition.reason === "topic_selection_timeout"
        ) {
          await resetForNewRound(game.id);
          currentQuestionIdx = 0;
          const topic = pickRandomTopic();
          await updateGameTopic(game.id, topic);
          currentTopic = topic;
          await triggerGenerateQuestions(origin, game.id, topic);
        }

        if (transition.reason === "next_question") {
          await incrementQuestionIndex(game.id);
          currentQuestionIdx = game.currentQuestionIndex + 1;
        }
      }
    }

    const activePlayers = await getActivePlayers(game.id);

    let currentQuestion = null;
    let questionId: number | null = null;
    const question = await getCurrentQuestion(game.id, currentQuestionIdx);
    if (question) {
      questionId = question.id;
      currentQuestion = {
        questionText: question.questionText,
        options: question.options,
        ...(currentStatus === "showing_answer"
          ? { correctIndex: question.correctIndex }
          : {}),
      };
    }

    let roundWinner = null;
    if (currentStatus === "topic_selection") {
      roundWinner = await getRoundWinner(game.id);
    }

    let answerDistribution: number[] | null = null;
    if (currentStatus === "showing_answer" && questionId !== null) {
      answerDistribution = await getAnswerDistribution(questionId);
    }

    const playersList =
      currentStatus === "topic_selection"
        ? await getLeaderboard(game.id)
        : activePlayers;

    return NextResponse.json<GameState>({
      status: currentStatus,
      timeRemaining: computeTimeRemaining(
        currentStatus,
        currentPhaseStartedAt,
        new Date()
      ),
      players: playersList,
      currentQuestion,
      questionId,
      answerDistribution,
      questionIndex: currentQuestionIdx,
      questionsPerRound: QUESTIONS_PER_ROUND,
      topic: currentTopic,
      roundWinner,
      playerId: player.id,
    });
  } catch (error) {
    console.error("game-state error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
