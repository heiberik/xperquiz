import { eq, and, sql, desc, gt } from "drizzle-orm";
import { db } from ".";
import { games, players, questions, answers } from "./schema";
import {
  ALTERNATIVES_PER_QUESTION,
  INACTIVE_TIMEOUT,
  QUESTION_TIME,
} from "../constants";
import type { GameStatus } from "../types";

export async function getOrCreateGame() {
  const existing = await db.select().from(games).limit(1);
  if (existing.length > 0) return existing[0];

  const [game] = await db
    .insert(games)
    .values({ status: "waiting_for_players" })
    .returning();
  return game;
}

export async function joinGame(
  gameId: number,
  userId: string,
  name: string,
  image: string | null
) {
  const [player] = await db
    .insert(players)
    .values({ gameId, userId, name, image, lastPolledAt: new Date() })
    .onConflictDoNothing()
    .returning();

  if (!player) {
    const existing = await db
      .select()
      .from(players)
      .where(and(eq(players.gameId, gameId), eq(players.userId, userId)));
    return existing[0];
  }
  return player;
}

export async function getPlayer(gameId: number, userId: string) {
  const result = await db
    .select()
    .from(players)
    .where(and(eq(players.gameId, gameId), eq(players.userId, userId)));
  return result[0] ?? null;
}

export async function updateLastPolledAt(playerId: number) {
  await db
    .update(players)
    .set({ lastPolledAt: new Date() })
    .where(eq(players.id, playerId));
}

export async function countActivePlayers(gameId: number) {
  const cutoff = new Date(Date.now() - INACTIVE_TIMEOUT);
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(players)
    .where(and(eq(players.gameId, gameId), gt(players.lastPolledAt, cutoff)));
  return result[0]?.count ?? 0;
}

export async function getActivePlayers(gameId: number) {
  const cutoff = new Date(Date.now() - INACTIVE_TIMEOUT);
  return db
    .select({
      id: players.id,
      name: players.name,
      image: players.image,
      score: players.score,
      totalScore: players.totalScore,
    })
    .from(players)
    .where(and(eq(players.gameId, gameId), gt(players.lastPolledAt, cutoff)));
}

export async function submitAnswer(
  questionId: number,
  playerId: number,
  selectedIndex: number,
  score: number
) {
  const [answer] = await db
    .insert(answers)
    .values({ questionId, playerId, selectedIndex, score })
    .onConflictDoNothing()
    .returning();
  return answer ?? null;
}

export async function getPlayerAnswer(questionId: number, playerId: number) {
  const result = await db
    .select()
    .from(answers)
    .where(
      and(eq(answers.questionId, questionId), eq(answers.playerId, playerId))
    );
  return result[0] ?? null;
}

export async function getCurrentQuestion(
  gameId: number,
  questionIndex: number
) {
  const result = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.gameId, gameId),
        eq(questions.orderIndex, questionIndex)
      )
    );
  return result[0] ?? null;
}

export async function getQuestions(gameId: number) {
  return db.select().from(questions).where(eq(questions.gameId, gameId));
}

export async function getLeaderboard(gameId: number) {
  const cutoff = new Date(Date.now() - INACTIVE_TIMEOUT);
  return db
    .select({
      id: players.id,
      name: players.name,
      image: players.image,
      score: players.score,
      totalScore: players.totalScore,
    })
    .from(players)
    .where(and(eq(players.gameId, gameId), gt(players.lastPolledAt, cutoff)))
    .orderBy(desc(players.score));
}

export async function getRoundWinner(gameId: number) {
  const cutoff = new Date(Date.now() - INACTIVE_TIMEOUT);
  const result = await db
    .select({
      id: players.id,
      name: players.name,
      image: players.image,
      score: players.score,
      totalScore: players.totalScore,
    })
    .from(players)
    .where(and(eq(players.gameId, gameId), gt(players.lastPolledAt, cutoff)))
    .orderBy(desc(players.score))
    .limit(1);
  return result[0] ?? null;
}

export async function atomicStatusUpdate(
  gameId: number,
  expectedStatus: GameStatus,
  newStatus: GameStatus,
  phaseStartedAt: Date
) {
  const result = await db
    .update(games)
    .set({
      status: newStatus,
      phaseStartedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(games.id, gameId), eq(games.status, expectedStatus)));
  return result;
}

export async function resetForNewRound(gameId: number) {
  await db
    .update(games)
    .set({ currentQuestionIndex: 0, updatedAt: new Date() })
    .where(eq(games.id, gameId));

  await db
    .update(players)
    .set({ score: 0 })
    .where(eq(players.gameId, gameId));

  await db.delete(questions).where(eq(questions.gameId, gameId));
}

export async function updateGameTopic(gameId: number, topic: string) {
  await db
    .update(games)
    .set({ currentTopic: topic, updatedAt: new Date() })
    .where(eq(games.id, gameId));
}

export async function insertQuestions(
  gameId: number,
  questionData: {
    questionText: string;
    options: string[];
    correctIndex: number;
  }[]
) {
  const values = questionData.map((q, i) => ({
    gameId,
    questionText: q.questionText,
    options: q.options,
    correctIndex: q.correctIndex,
    orderIndex: i,
  }));
  await db.insert(questions).values(values);
}

export async function updateGameForQuestionPhase(gameId: number) {
  return db
    .update(games)
    .set({
      status: "question_active",
      phaseStartedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(games.id, gameId), eq(games.status, "generating")));
}

export async function incrementQuestionIndex(gameId: number) {
  await db
    .update(games)
    .set({
      currentQuestionIndex: sql`${games.currentQuestionIndex} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(games.id, gameId));
}

export async function addPlayerScore(playerId: number, scoreToAdd: number) {
  await db
    .update(players)
    .set({
      score: sql`${players.score} + ${scoreToAdd}`,
      totalScore: sql`${players.totalScore} + ${scoreToAdd}`,
    })
    .where(eq(players.id, playerId));
}

export async function getGameById(gameId: number) {
  const result = await db
    .select()
    .from(games)
    .where(eq(games.id, gameId));
  return result[0] ?? null;
}

export async function getAnswerDistribution(
  questionId: number
): Promise<number[]> {
  const rows = await db
    .select({
      selectedIndex: answers.selectedIndex,
      count: sql<number>`count(*)::int`,
    })
    .from(answers)
    .where(eq(answers.questionId, questionId))
    .groupBy(answers.selectedIndex);

  const distribution = new Array(ALTERNATIVES_PER_QUESTION).fill(0);
  for (const row of rows) distribution[row.selectedIndex] = row.count;
  return distribution;
}

export function calculateScore(
  isCorrect: boolean,
  phaseStartedAt: Date | null
): number {
  if (!isCorrect || !phaseStartedAt) return 0;
  const timeUsedMs = Date.now() - phaseStartedAt.getTime();
  const score = Math.round(1000 - (900 * timeUsedMs) / QUESTION_TIME);
  return Math.max(100, Math.min(1000, score));
}
