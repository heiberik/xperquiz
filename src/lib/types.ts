export type GameStatus =
  | "waiting_for_players"
  | "countdown"
  | "generating"
  | "question_active"
  | "showing_answer"
  | "topic_selection";

export type Player = {
  id: number;
  name: string;
  score: number;
};

export type Question = {
  questionText: string;
  options: string[];
  correctIndex?: number;
};

export type GameState = {
  status: GameStatus;
  timeRemaining: number;
  players: Player[];
  currentQuestion: Question | null;
  questionId: number | null;
  questionIndex: number;
  questionsPerRound: number;
  topic: string | null;
  roundWinner: Player | null;
  playerId: number | null;
};
