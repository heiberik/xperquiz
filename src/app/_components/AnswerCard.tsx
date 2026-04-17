const OPT_COLORS = [
  "var(--opt-1)",
  "var(--opt-2)",
  "var(--opt-3)",
  "var(--opt-4)",
];

const OPT_LETTERS = ["A", "B", "C", "D"];

type State = "idle" | "selected" | "correct" | "wrong" | "dim";

export function AnswerCard({
  index,
  option,
  state = "idle",
  disabled = false,
  onClick,
  revealDelay = 0,
}: {
  index: number;
  option: string;
  state?: State;
  disabled?: boolean;
  onClick?: () => void;
  revealDelay?: number;
}) {
  const color = OPT_COLORS[index % OPT_COLORS.length];
  const letter = OPT_LETTERS[index % OPT_LETTERS.length];

  const baseClasses =
    "anim-card-stagger card-offset-ink group relative block w-full min-h-[64px] text-left rounded-[6px] px-4 py-3.5 transition-all";

  const interactive = !disabled && state === "idle";

  const cornerStyle: React.CSSProperties = {
    background: color,
    color: "var(--ink)",
    animationDelay: `${revealDelay}ms`,
  };

  const dim = state === "dim";
  const correct = state === "correct";
  const selected = state === "selected";
  const wrong = state === "wrong";

  const Tag: "button" | "div" = interactive ? "button" : "div";

  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      disabled={Tag === "button" ? disabled : undefined}
      onClick={interactive ? onClick : undefined}
      className={[
        baseClasses,
        dim ? "opacity-45 saturate-50" : "",
        correct ? "anim-pulse-correct ring-4 ring-bone" : "",
        wrong ? "ring-4 ring-flare" : "",
        selected ? "ring-4 ring-bone" : "",
      ].join(" ")}
      style={cornerStyle}
      aria-pressed={selected || undefined}
    >
      <div className="flex items-center gap-3">
        <span
          className="grid shrink-0 place-items-center rounded-full border-2 border-ink font-mono text-sm font-black"
          style={{
            width: 30,
            height: 30,
            background: "rgba(11,10,8,0.14)",
          }}
        >
          {letter}
        </span>
        <span className="font-body text-base font-semibold leading-snug sm:text-lg">
          {option}
        </span>
      </div>
      {correct && (
        <span className="absolute right-3 top-3 font-mono text-[10px] font-black uppercase tracking-widest">
          Riktig
        </span>
      )}
      {wrong && (
        <span className="absolute right-3 top-3 font-mono text-[10px] font-black uppercase tracking-widest">
          Feil
        </span>
      )}
    </Tag>
  );
}
