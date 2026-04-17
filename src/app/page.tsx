"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import {
  POLL_INTERVAL,
  COUNTDOWN_TIME,
  QUESTION_TIME,
  SHOW_ANSWER_TIME,
  TOPIC_SELECTION_TIME,
} from "@/lib/constants";
import type { GameState, GameStatus } from "@/lib/types";

const PHASE_DURATIONS: Partial<Record<GameStatus, number>> = {
  countdown: COUNTDOWN_TIME,
  question_active: QUESTION_TIME,
  showing_answer: SHOW_ANSWER_TIME,
  topic_selection: TOPIC_SELECTION_TIME,
};

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    score: number;
  } | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const [topicInput, setTopicInput] = useState("");
  const [topicSubmitted, setTopicSubmitted] = useState(false);

  const [localTimeRemaining, setLocalTimeRemaining] = useState(0);
  const lastPollTimeRef = useRef<number>(0);
  const lastPollRemainingRef = useRef<number>(0);
  const prevStatusRef = useRef<GameStatus | null>(null);

  const resetRoundState = useCallback(() => {
    setSelectedAnswer(null);
    setAnswerResult(null);
    setSubmittingAnswer(false);
    setTopicInput("");
    setTopicSubmitted(false);
  }, []);

  useEffect(() => {
    if (!session || !hasJoined) return;

    const poll = async () => {
      try {
        const res = await fetch("/api/game-state");
        if (!res.ok) return;
        const data: GameState = await res.json();

        if (
          data.status === "generating" &&
          prevStatusRef.current !== "generating"
        ) {
          resetRoundState();
        }

        if (
          data.status === "question_active" &&
          prevStatusRef.current === "showing_answer"
        ) {
          setSelectedAnswer(null);
          setAnswerResult(null);
          setSubmittingAnswer(false);
        }

        prevStatusRef.current = data.status;
        setGameState(data);
        lastPollTimeRef.current = Date.now();
        lastPollRemainingRef.current = data.timeRemaining;
      } catch {
        // ignore poll errors
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [session, hasJoined, resetRoundState]);

  useEffect(() => {
    if (!gameState) return;
    const duration = PHASE_DURATIONS[gameState.status];
    if (!duration) {
      setLocalTimeRemaining(0);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - lastPollTimeRef.current;
      const remaining = Math.max(0, lastPollRemainingRef.current - elapsed);
      setLocalTimeRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [gameState]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await fetch("/api/join", { method: "POST" });
      if (res.ok) setHasJoined(true);
    } finally {
      setJoining(false);
    }
  };

  const handleAnswer = async (index: number) => {
    if (selectedAnswer !== null || !gameState?.questionId) return;
    setSelectedAnswer(index);
    setSubmittingAnswer(true);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: gameState.questionId,
          selectedIndex: index,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnswerResult({ correct: data.correct, score: data.score });
      }
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSelectTopic = async () => {
    if (!topicInput.trim() || topicSubmitted) return;
    setTopicSubmitted(true);
    try {
      await fetch("/api/select-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicInput.trim() }),
      });
    } catch {
      setTopicSubmitted(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-5xl font-black tracking-tight">XprQuiz</h1>
        <p className="text-zinc-400">Live quiz i sanntid</p>
        <button
          onClick={() => authClient.signIn.social({ provider: "google" })}
          className="flex items-center gap-3 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-black transition-transform active:scale-95"
        >
          <GoogleIcon />
          Logg inn med Google
        </button>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <h1 className="text-5xl font-black tracking-tight">XprQuiz</h1>
        <p className="text-zinc-400">
          Logget inn som {session.user.name}
        </p>
        <button
          onClick={handleJoin}
          disabled={joining}
          className="rounded-xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
        >
          {joining ? "Blir med..." : "Bli med"}
        </button>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      {gameState.status === "waiting_for_players" && (
        <WaitingView playerCount={gameState.players.length} />
      )}

      {gameState.status === "countdown" && (
        <CountdownView timeRemaining={localTimeRemaining} />
      )}

      {gameState.status === "generating" && (
        <GeneratingView topic={gameState.topic} />
      )}

      {gameState.status === "question_active" && gameState.currentQuestion && (
        <QuestionView
          question={gameState.currentQuestion}
          questionIndex={gameState.questionIndex}
          questionsPerRound={gameState.questionsPerRound}
          timeRemaining={localTimeRemaining}
          totalTime={QUESTION_TIME}
          selectedAnswer={selectedAnswer}
          submittingAnswer={submittingAnswer}
          onAnswer={handleAnswer}
        />
      )}

      {gameState.status === "showing_answer" && gameState.currentQuestion && (
        <ShowingAnswerView
          question={gameState.currentQuestion}
          questionIndex={gameState.questionIndex}
          questionsPerRound={gameState.questionsPerRound}
          selectedAnswer={selectedAnswer}
          answerResult={answerResult}
        />
      )}

      {gameState.status === "topic_selection" && (
        <TopicSelectionView
          players={gameState.players}
          roundWinner={gameState.roundWinner}
          isWinner={
            gameState.roundWinner != null &&
            gameState.playerId === gameState.roundWinner.id
          }
          topicInput={topicInput}
          topicSubmitted={topicSubmitted}
          topic={gameState.topic}
          timeRemaining={localTimeRemaining}
          onTopicChange={setTopicInput}
          onSubmitTopic={handleSelectTopic}
        />
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function WaitingView({ playerCount }: { playerCount: number }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-black tracking-tight">XprQuiz</h1>
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <span className="text-lg text-zinc-300">
            {playerCount} {playerCount === 1 ? "spiller" : "spillere"} tilkoblet
          </span>
        </div>
        <p className="text-zinc-500">Venter på spillere...</p>
      </div>
    </div>
  );
}

function CountdownView({ timeRemaining }: { timeRemaining: number }) {
  const seconds = Math.ceil(timeRemaining / 1000);
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
      <p className="text-xl text-zinc-400">Spillet starter om...</p>
      <span
        key={seconds}
        className="animate-bounce text-8xl font-black tabular-nums text-indigo-400"
      >
        {seconds}
      </span>
    </div>
  );
}

function GeneratingView({ topic }: { topic: string | null }) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
      <Spinner />
      <p className="text-xl font-semibold text-zinc-300">
        Genererer spørsmål...
      </p>
      {topic && (
        <p className="rounded-lg bg-zinc-800 px-4 py-2 text-indigo-400 font-medium">
          Tema: {topic}
        </p>
      )}
    </div>
  );
}

function ProgressBar({
  timeRemaining,
  totalTime,
}: {
  timeRemaining: number;
  totalTime: number;
}) {
  const fraction = Math.max(0, Math.min(1, timeRemaining / totalTime));
  const barColor =
    fraction > 0.5
      ? "bg-emerald-500"
      : fraction > 0.2
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full transition-[width] duration-100 ease-linear ${barColor}`}
        style={{ width: `${fraction * 100}%` }}
      />
    </div>
  );
}

const OPTION_COLORS = [
  "bg-rose-600 hover:bg-rose-500",
  "bg-sky-600 hover:bg-sky-500",
  "bg-amber-600 hover:bg-amber-500",
  "bg-emerald-600 hover:bg-emerald-500",
];

const OPTION_COLORS_SELECTED = [
  "bg-rose-700 ring-2 ring-rose-300",
  "bg-sky-700 ring-2 ring-sky-300",
  "bg-amber-700 ring-2 ring-amber-300",
  "bg-emerald-700 ring-2 ring-emerald-300",
];

function QuestionView({
  question,
  questionIndex,
  questionsPerRound,
  timeRemaining,
  totalTime,
  selectedAnswer,
  submittingAnswer,
  onAnswer,
}: {
  question: { questionText: string; options: string[] };
  questionIndex: number;
  questionsPerRound: number;
  timeRemaining: number;
  totalTime: number;
  selectedAnswer: number | null;
  submittingAnswer: boolean;
  onAnswer: (index: number) => void;
}) {
  const disabled = selectedAnswer !== null || submittingAnswer;

  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-400">
          Spørsmål {questionIndex + 1} av {questionsPerRound}
        </span>
        <span className="text-sm font-bold tabular-nums text-zinc-300">
          {Math.ceil(timeRemaining / 1000)}s
        </span>
      </div>
      <ProgressBar timeRemaining={timeRemaining} totalTime={totalTime} />
      <h2 className="text-xl font-bold leading-snug">
        {question.questionText}
      </h2>
      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          const colorClass = isSelected
            ? OPTION_COLORS_SELECTED[i]
            : OPTION_COLORS[i];
          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={disabled}
              className={`rounded-xl px-5 py-4 text-left text-lg font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-80 ${colorClass}`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selectedAnswer !== null && (
        <p className="text-center text-sm text-zinc-400">Svar registrert!</p>
      )}
    </div>
  );
}

function ShowingAnswerView({
  question,
  questionIndex,
  questionsPerRound,
  selectedAnswer,
  answerResult,
}: {
  question: { questionText: string; options: string[]; correctIndex?: number };
  questionIndex: number;
  questionsPerRound: number;
  selectedAnswer: number | null;
  answerResult: { correct: boolean; score: number } | null;
}) {
  const correctIndex = question.correctIndex;

  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <span className="text-sm font-medium text-zinc-400">
        Spørsmål {questionIndex + 1} av {questionsPerRound}
      </span>
      <h2 className="text-xl font-bold leading-snug">
        {question.questionText}
      </h2>
      <div className="flex flex-col gap-3">
        {question.options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const isSelectedWrong = i === selectedAnswer && !isCorrect;
          let cls =
            "rounded-xl px-5 py-4 text-left text-lg font-semibold text-white";
          if (isCorrect) {
            cls += " bg-emerald-600 ring-2 ring-emerald-300";
          } else if (isSelectedWrong) {
            cls += " bg-red-700 ring-2 ring-red-400";
          } else {
            cls += " bg-zinc-800 opacity-50";
          }
          return (
            <div key={i} className={cls}>
              {option}
            </div>
          );
        })}
      </div>
      {answerResult && (
        <div className="text-center">
          {answerResult.correct ? (
            <p className="text-lg font-bold text-emerald-400">
              Riktig! +{answerResult.score} poeng
            </p>
          ) : (
            <p className="text-lg font-bold text-red-400">Feil svar</p>
          )}
        </div>
      )}
      {selectedAnswer === null && (
        <p className="text-center text-sm text-zinc-500">Du svarte ikke</p>
      )}
    </div>
  );
}

function TopicSelectionView({
  players,
  roundWinner,
  isWinner,
  topicInput,
  topicSubmitted,
  topic,
  timeRemaining,
  onTopicChange,
  onSubmitTopic,
}: {
  players: { id: number; name: string; score: number }[];
  roundWinner: { id: number; name: string; score: number } | null;
  isWinner: boolean;
  topicInput: string;
  topicSubmitted: boolean;
  topic: string | null;
  timeRemaining: number;
  onTopicChange: (value: string) => void;
  onSubmitTopic: () => void;
}) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <h2 className="text-center text-2xl font-black">Leaderboard</h2>
      <div className="flex flex-col gap-2">
        {players.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center justify-between rounded-xl px-5 py-3 ${
              i === 0
                ? "bg-amber-600/20 ring-1 ring-amber-500/40"
                : "bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-lg font-bold ${
                  i === 0
                    ? "text-amber-400"
                    : i === 1
                      ? "text-zinc-300"
                      : i === 2
                        ? "text-orange-400"
                        : "text-zinc-500"
                }`}
              >
                {i + 1}.
              </span>
              <span className="font-semibold">{player.name}</span>
            </div>
            <span className="font-bold tabular-nums">{player.score} p</span>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-xl bg-zinc-800/60 p-5">
        {topicSubmitted ? (
          <p className="text-center text-zinc-300">
            Tema valgt: <span className="font-bold text-indigo-400">{topicInput || topic}</span>
          </p>
        ) : isWinner ? (
          <div className="flex flex-col gap-3">
            <p className="text-center font-semibold text-amber-400">
              Du vant runden! Velg neste tema:
            </p>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="Skriv et tema..."
              maxLength={100}
              className="rounded-lg bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 outline-none ring-1 ring-zinc-700 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmitTopic();
              }}
            />
            <button
              onClick={onSubmitTopic}
              disabled={!topicInput.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-3 font-bold text-white transition-all hover:bg-indigo-500 active:scale-95 disabled:opacity-40"
            >
              Velg tema
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-zinc-300">
              Venter på at{" "}
              <span className="font-bold text-amber-400">
                {roundWinner?.name ?? "vinneren"}
              </span>{" "}
              velger tema...
            </p>
            <span className="text-sm tabular-nums text-zinc-500">
              {Math.ceil(timeRemaining / 1000)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
