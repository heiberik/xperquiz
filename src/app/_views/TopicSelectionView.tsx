import type { Player } from "@/lib/types";

export function TopicSelectionView({
  players,
  roundWinner,
  isWinner,
  topicInput,
  topicSubmitted,
  topic,
  timeRemaining,
  onTopicChangeAction,
  onSubmitTopicAction,
}: {
  players: Player[];
  roundWinner: Player | null;
  isWinner: boolean;
  topicInput: string;
  topicSubmitted: boolean;
  topic: string | null;
  timeRemaining: number;
  onTopicChangeAction: (value: string) => void;
  onSubmitTopicAction: () => void;
}) {
  const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));

  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-5 py-6 gap-6">
      <header className="flex items-start justify-between">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            Pause
          </span>
          <h1 className="font-display text-4xl font-black leading-[0.9]">
            <span className="italic">Topp</span>
            <span className="text-acid">.</span>
          </h1>
        </div>
        <span className="font-mono text-right text-[11px] uppercase tracking-[0.3em] text-spot tabular-nums">
          {seconds}s igjen
        </span>
      </header>

      <section className="flex flex-col">
        {players.map((player, i) => (
          <LeaderRow
            key={player.id}
            rank={i}
            player={player}
            highlight={roundWinner?.id === player.id}
          />
        ))}
      </section>

      <section className="rounded-[6px] border-2 border-bone/25 bg-ink-2 p-5">
        {topicSubmitted ? (
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
              Tema låst inn
            </span>
            <span className="font-display text-3xl font-black italic text-acid">
              «{topicInput || topic}»
            </span>
          </div>
        ) : isWinner ? (
          <div className="flex flex-col gap-3">
            <p className="font-display text-2xl font-black italic leading-tight text-spot">
              Du vant runden.
            </p>
            <p className="font-body text-sm text-bone-dim">
              Velg neste tema for spørsmålene.
            </p>
            <div className="relative">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => onTopicChangeAction(e.target.value)}
                placeholder="Dinosaurer, 90-tallet, norsk geografi..."
                maxLength={100}
                autoFocus
                className="w-full rounded-[4px] border-2 border-bone/40 bg-ink px-4 py-3.5 font-body text-base text-bone placeholder-bone-faint outline-none focus:border-acid"
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSubmitTopicAction();
                }}
              />
            </div>
            <button
              onClick={onSubmitTopicAction}
              disabled={!topicInput.trim()}
              className="card-offset rounded-[6px] bg-acid px-4 py-3.5 font-mono text-sm font-bold uppercase tracking-[0.2em] text-ink disabled:opacity-40"
            >
              Lås inn tema →
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim">
              Venter på
            </span>
            <span className="font-display text-3xl font-black italic text-spot">
              {roundWinner?.name ?? "vinneren"}
            </span>
            <span className="font-body text-sm text-bone-dim">
              velger neste tema
              <span className="anim-blink">_</span>
            </span>
          </div>
        )}
      </section>

      <footer className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
        Poeng nullstilles før neste runde
      </footer>
    </div>
  );
}

function LeaderRow({
  rank,
  player,
  highlight,
}: {
  rank: number;
  player: Player;
  highlight: boolean;
}) {
  const isTop = rank === 0;
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-baseline gap-4 border-b-2 py-4 ${
        highlight ? "border-acid" : "border-bone/10"
      }`}
    >
      <span
        className="font-display font-black italic leading-none tabular-nums"
        style={{
          fontSize: isTop ? "clamp(3rem, 14vw, 5rem)" : "clamp(2rem, 9vw, 3.25rem)",
          color: highlight ? "var(--acid)" : "var(--bone-dim)",
        }}
      >
        {String(rank + 1).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar src={player.image} name={player.name} highlight={highlight} />
        <div className="min-w-0">
          <p
            className={`truncate font-body text-lg font-semibold ${
              highlight ? "text-bone" : "text-bone-dim"
            }`}
          >
            {player.name}
          </p>
          {highlight && (
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-acid">
              Runde-vinner
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p
          className="font-mono text-2xl font-bold tabular-nums"
          style={{ color: highlight ? "var(--acid)" : "var(--bone)" }}
        >
          {player.score}
        </p>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bone-faint">
          runde
        </p>
      </div>
    </div>
  );
}

function Avatar({
  src,
  name,
  highlight,
}: {
  src: string | null;
  name: string;
  highlight: boolean;
}) {
  const ring = highlight ? "border-acid" : "border-bone/25";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className={`h-10 w-10 shrink-0 rounded-full border-2 object-cover ${ring}`}
      />
    );
  }
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 bg-ink-2 font-mono text-sm font-black text-bone-dim ${ring}`}
    >
      {initial}
    </div>
  );
}
