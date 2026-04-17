import { AnswerCard } from "../_components/AnswerCard";
import { Timer } from "../_components/Timer";

export function QuestionView({
  question,
  questionIndex,
  questionsPerRound,
  timeRemaining,
  totalTime,
  selectedAnswer,
  submittingAnswer,
  onAnswerAction,
}: {
  question: { questionText: string; options: string[] };
  questionIndex: number;
  questionsPerRound: number;
  timeRemaining: number;
  totalTime: number;
  selectedAnswer: number | null;
  submittingAnswer: boolean;
  onAnswerAction: (index: number) => void;
}) {
  const disabled = selectedAnswer !== null || submittingAnswer;
  const words = question.questionText.split(" ");

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-5 py-6 gap-5">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-black italic leading-none tabular-nums text-spot">
            {String(questionIndex + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            / {String(questionsPerRound).padStart(2, "0")}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
          Spørsmål
        </span>
      </header>

      <div className="scanlines rounded-[6px] border-2 border-bone/25 bg-ink-2 px-5 py-6">
        <h2
          key={question.questionText}
          className="anim-word-reveal font-display text-2xl sm:text-3xl font-black leading-[1.05]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {words.map((w, i) => (
            <span
              key={`${i}-${w}`}
              style={{ animationDelay: `${i * 45}ms`, marginRight: "0.28em" }}
              className="italic"
            >
              {w}
            </span>
          ))}
        </h2>
      </div>

      <Timer
        timeRemaining={timeRemaining}
        totalTime={totalTime}
        label="Tid igjen"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => (
          <AnswerCard
            key={i}
            index={i}
            option={option}
            state={selectedAnswer === i ? "selected" : "idle"}
            disabled={disabled}
            onClick={() => onAnswerAction(i)}
            revealDelay={120 + i * 70}
          />
        ))}
      </div>

      <div className="min-h-[1.5rem] text-center">
        {selectedAnswer !== null && (
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
            ✓ Svar registrert
          </p>
        )}
      </div>
    </div>
  );
}
