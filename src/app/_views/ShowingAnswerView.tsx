import { AnswerCard } from "../_components/AnswerCard";
import { Confetti } from "../_components/Confetti";

export function ShowingAnswerView({
  question,
  questionIndex,
  questionsPerRound,
  selectedAnswer,
  answerResult,
  answerDistribution,
}: {
  question: { questionText: string; options: string[]; correctIndex?: number };
  questionIndex: number;
  questionsPerRound: number;
  selectedAnswer: number | null;
  answerResult: { correct: boolean; score: number } | null;
  answerDistribution: number[] | null;
}) {
  const correctIndex = question.correctIndex;
  const totalAnswers = (answerDistribution ?? []).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(1, ...(answerDistribution ?? [1]));

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
          Fasit
        </span>
      </header>

      <div className="rounded-[6px] border-2 border-bone/25 bg-ink-2 px-5 py-6">
        <h2
          className="font-display text-2xl sm:text-3xl font-black italic leading-[1.05]"
          style={{ fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
        >
          {question.questionText}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => {
          const isCorrect = i === correctIndex;
          const isSelectedWrong = i === selectedAnswer && !isCorrect;
          const state = isCorrect
            ? "correct"
            : isSelectedWrong
              ? "wrong"
              : "dim";
          const count = answerDistribution?.[i] ?? 0;
          const widthPct = (count / maxCount) * 100;
          return (
            <div key={i} className="flex flex-col gap-2">
              <AnswerCard index={i} option={option} state={state} disabled />
              {answerDistribution && (
                <div className="flex items-center gap-3 px-1">
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bone/10">
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700"
                      style={{
                        width: `${widthPct}%`,
                        background: isCorrect
                          ? "var(--acid)"
                          : `var(--opt-${(i % 4) + 1})`,
                        opacity: isCorrect ? 1 : 0.55,
                      }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-[10px] uppercase tracking-[0.2em] tabular-nums text-bone-dim">
                    {count} / {totalAnswers}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-2 rounded-[6px] border-2 border-bone/25 bg-ink-2 px-5 py-5 text-center">
        {answerResult?.correct && <Confetti />}
        {answerResult ? (
          answerResult.correct ? (
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
                Riktig svar
              </span>
              <span className="font-display text-4xl font-black italic text-bone">
                +{answerResult.score}
                <span className="ml-2 font-mono text-base text-bone-dim not-italic">
                  poeng
                </span>
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-flare">
                Feil svar
              </span>
              <span className="font-display text-3xl font-black italic text-bone-dim">
                0 poeng
              </span>
            </div>
          )
        ) : selectedAnswer === null ? (
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-faint">
            Du rakk ikke å svare
          </span>
        ) : null}
      </div>
    </div>
  );
}
