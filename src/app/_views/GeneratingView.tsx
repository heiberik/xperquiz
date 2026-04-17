export function GeneratingView({ topic }: { topic: string | null }) {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-8">
      <header className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          · Redaksjonen jobber ·
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-spot">
          Stand-by
        </span>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-10">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            Kveldens tema
          </p>
          <h1 className="font-display text-5xl font-black leading-[0.85] sm:text-6xl">
            {topic ? (
              <span className="italic text-spot">«{topic}»</span>
            ) : (
              <span className="italic text-bone">Hemmelig</span>
            )}
            <span className="text-acid">.</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-1.5">
            <Dot delay={0} />
            <Dot delay={180} />
            <Dot delay={360} />
            <Dot delay={540} />
            <Dot delay={720} />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
            AI lager 3 spørsmål
          </span>
        </div>

        <div className="border-t-2 border-bone/15 pt-6">
          <p className="font-body text-base text-bone-dim leading-snug max-w-md">
            Når lyset kommer tilbake på scenen er det din tur.
            <br />
            <span className="font-display italic text-bone">
              Raskere svar, mer poeng.
            </span>
          </p>
        </div>
      </main>

      <footer className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
        <span>Maks 30 sek</span>
        <span>Powered by AI</span>
      </footer>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full bg-acid"
      style={{
        animation: `pulseCorrect 1.4s ease-in-out ${delay}ms infinite`,
      }}
    />
  );
}
