import { Wordmark } from "../_components/Wordmark";
import { Oscilloscope } from "../_components/Oscilloscope";

export function WaitingView({ playerCount }: { playerCount: number }) {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-8">
      <header className="flex items-start justify-between">
        <Wordmark size="md" />
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-acid">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
          </span>
          Live
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-12 py-12">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            Sending pågår
          </p>
          <h1 className="font-display text-5xl font-black leading-[0.85] sm:text-6xl">
            Venter på
            <br />
            <span className="italic text-spot">flere stemmer</span>
            <span className="text-acid">.</span>
          </h1>
        </div>

        <div className="-mx-6 border-y-2 border-bone/15 px-6 py-8">
          <Oscilloscope />
        </div>

        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
              Tilkoblet
            </p>
            <p className="font-display text-7xl font-black leading-[0.85] tabular-nums">
              {String(playerCount).padStart(2, "0")}
            </p>
            <p className="font-body text-sm text-bone-dim">
              {playerCount === 1 ? "spiller" : "spillere"}
            </p>
          </div>
          <span className="font-mono text-right text-[10px] uppercase tracking-[0.3em] text-bone-faint">
            Auto-start
            <br />
            ved 1 spiller
          </span>
        </div>
      </main>

      <footer className="flex items-center justify-between overflow-hidden border-t-2 border-bone/10 py-3">
        <div className="whitespace-nowrap">
          <div className="anim-marquee inline-flex gap-8 font-mono text-[10px] uppercase tracking-[0.3em] text-bone-dim">
            <span>XprQuiz</span>
            <span>·</span>
            <span>Live &amp; unscripted</span>
            <span>·</span>
            <span>AI-drevet</span>
            <span>·</span>
            <span>Ch. 0451</span>
            <span>·</span>
            <span>XprQuiz</span>
            <span>·</span>
            <span>Live &amp; unscripted</span>
            <span>·</span>
            <span>AI-drevet</span>
            <span>·</span>
            <span>Ch. 0451</span>
            <span>·</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
