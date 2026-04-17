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
import { LoginView } from "./_views/LoginView";
import { JoinView } from "./_views/JoinView";
import { WaitingView } from "./_views/WaitingView";
import { CountdownView } from "./_views/CountdownView";
import { GeneratingView } from "./_views/GeneratingView";
import { QuestionView } from "./_views/QuestionView";
import { ShowingAnswerView } from "./_views/ShowingAnswerView";
import { TopicSelectionView } from "./_views/TopicSelectionView";

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
    return <FullscreenSpinner />;
  }

  if (!session) {
    return <LoginView />;
  }

  if (!hasJoined) {
    return (
      <JoinView
        name={session.user.name}
        onJoin={handleJoin}
        joining={joining}
      />
    );
  }

  if (!gameState) {
    return <FullscreenSpinner />;
  }

  return (
    <>
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
          onAnswerAction={handleAnswer}
        />
      )}

      {gameState.status === "showing_answer" && gameState.currentQuestion && (
        <ShowingAnswerView
          question={gameState.currentQuestion}
          questionIndex={gameState.questionIndex}
          questionsPerRound={gameState.questionsPerRound}
          selectedAnswer={selectedAnswer}
          answerResult={answerResult}
          answerDistribution={gameState.answerDistribution}
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
          onTopicChangeAction={setTopicInput}
          onSubmitTopicAction={handleSelectTopic}
        />
      )}
    </>
  );
}

function FullscreenSpinner() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-bone-faint border-t-acid" />
    </div>
  );
}
