export function CountdownView({ timeRemaining }: { timeRemaining: number }) {
  const seconds = Math.max(0, Math.ceil(timeRemaining / 1000));
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-8">
      <header className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          Opptak starter
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-spot">
          T-minus
        </span>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="relative text-center">
          <span
            key={seconds}
            className="anim-countdown-in font-display block leading-none tabular-nums"
            style={{
              fontSize: "clamp(9rem, 42vw, 22rem)",
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1',
              color: seconds <= 2 ? "var(--flare)" : "var(--acid)",
              textShadow: `0.06em 0.06em 0 var(--ink-2)`,
            }}
          >
            {seconds}
          </span>
          <span className="mt-2 block font-mono text-xs uppercase tracking-[0.4em] text-bone-dim">
            — sekunder igjen —
          </span>
        </div>
      </main>

      <footer className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
        <span>Hold fokus</span>
        <span>Ch. 0451</span>
      </footer>
    </div>
  );
}
