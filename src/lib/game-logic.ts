import type { GameStatus } from "./types";
import {
  COUNTDOWN_TIME,
  QUESTION_TIME,
  SHOW_ANSWER_TIME,
  TOPIC_SELECTION_TIME,
  GENERATING_TIMEOUT,
  MIN_PLAYERS,
  QUESTIONS_PER_ROUND,
} from "./constants";

type Game = {
  id: number;
  status: string;
  currentQuestionIndex: number;
  phaseStartedAt: Date | null;
};

export type TransitionResult = {
  shouldTransition: boolean;
  newStatus: GameStatus | null;
  reason: string | null;
};

const PHASE_DURATIONS: Partial<Record<GameStatus, number>> = {
  countdown: COUNTDOWN_TIME,
  question_active: QUESTION_TIME,
  showing_answer: SHOW_ANSWER_TIME,
  topic_selection: TOPIC_SELECTION_TIME,
  generating: GENERATING_TIMEOUT,
};

function elapsed(phaseStartedAt: Date | null, now: Date): number {
  if (!phaseStartedAt) return 0;
  return now.getTime() - phaseStartedAt.getTime();
}

export function computeTransition(
  game: Game,
  activePlayers: number,
  now: Date
): TransitionResult {
  const status = game.status as GameStatus;
  const elapsedMs = elapsed(game.phaseStartedAt, now);

  const noTransition: TransitionResult = {
    shouldTransition: false,
    newStatus: null,
    reason: null,
  };

  if (
    status !== "waiting_for_players" &&
    status !== "generating" &&
    activePlayers === 0
  ) {
    return {
      shouldTransition: true,
      newStatus: "waiting_for_players",
      reason: "no_active_players",
    };
  }

  switch (status) {
    case "waiting_for_players":
      if (activePlayers >= MIN_PLAYERS) {
        return {
          shouldTransition: true,
          newStatus: "countdown",
          reason: "enough_players",
        };
      }
      return noTransition;

    case "countdown":
      if (elapsedMs >= COUNTDOWN_TIME) {
        return {
          shouldTransition: true,
          newStatus: "generating",
          reason: "countdown_elapsed",
        };
      }
      return noTransition;

    case "generating":
      if (elapsedMs >= GENERATING_TIMEOUT) {
        return {
          shouldTransition: true,
          newStatus: "waiting_for_players",
          reason: "generating_timeout",
        };
      }
      return noTransition;

    case "question_active":
      if (elapsedMs >= QUESTION_TIME) {
        return {
          shouldTransition: true,
          newStatus: "showing_answer",
          reason: "question_time_elapsed",
        };
      }
      return noTransition;

    case "showing_answer":
      if (elapsedMs >= SHOW_ANSWER_TIME) {
        const isLastQuestion =
          game.currentQuestionIndex >= QUESTIONS_PER_ROUND - 1;
        if (isLastQuestion) {
          return {
            shouldTransition: true,
            newStatus: "topic_selection",
            reason: "round_complete",
          };
        }
        return {
          shouldTransition: true,
          newStatus: "question_active",
          reason: "next_question",
        };
      }
      return noTransition;

    case "topic_selection":
      if (elapsedMs >= TOPIC_SELECTION_TIME) {
        return {
          shouldTransition: true,
          newStatus: "generating",
          reason: "topic_selection_timeout",
        };
      }
      return noTransition;

    default:
      return noTransition;
  }
}

export function computeTimeRemaining(
  status: GameStatus,
  phaseStartedAt: Date | null,
  now: Date
): number {
  const duration = PHASE_DURATIONS[status];
  if (!duration || !phaseStartedAt) return 0;
  const remaining = duration - (now.getTime() - phaseStartedAt.getTime());
  return Math.max(0, remaining);
}
