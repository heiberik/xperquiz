import { Wordmark } from "../_components/Wordmark";

export function JoinView({
  name,
  onJoin,
  joining,
}: {
  name: string;
  onJoin: () => void;
  joining: boolean;
}) {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col items-start px-6 py-10">
      <header className="w-full">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          · Backstage ·
        </span>
      </header>

      <main className="flex flex-1 w-full flex-col justify-center gap-10 py-10">
        <Wordmark size="lg" tilt />

        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            Deltaker
          </p>
          <p className="font-display text-4xl sm:text-5xl font-black leading-[0.9]">
            <span className="italic text-spot">{name}</span>
          </p>
          <p className="font-body text-base text-bone-dim">
            Du er logget inn. Ta plass på scenen.
          </p>
        </div>

        <button
          onClick={onJoin}
          disabled={joining}
          className="card-offset group relative w-full max-w-md overflow-hidden rounded-[6px] bg-acid px-6 py-6 text-left disabled:opacity-60"
        >
          <span className="block font-mono text-[11px] uppercase tracking-[0.3em] text-ink/70">
            {joining ? "Kobler opp..." : "Trykk for å delta"}
          </span>
          <span className="mt-1 block font-display text-3xl font-black italic leading-none text-ink">
            Bli med →
          </span>
        </button>
      </main>

      <footer className="font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
        <span>Spillet starter når første spiller er inne</span>
      </footer>
    </div>
  );
}
