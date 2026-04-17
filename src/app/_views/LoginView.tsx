"use client";

import { authClient } from "@/lib/auth-client";
import { Wordmark } from "../_components/Wordmark";
import { Oscilloscope } from "../_components/Oscilloscope";

export function LoginView() {
  return (
    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-10">
      <header className="flex items-start justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          Kl. {new Date().toLocaleTimeString("no", { hour: "2-digit", minute: "2-digit" })} · Oslo
        </span>
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] text-bone-dim">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-acid opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-acid" />
          </span>
          On Air
        </span>
      </header>

      <main className="flex flex-1 flex-col items-start justify-center gap-10 py-16">
        <div className="flex flex-col gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-spot">
            · Kveldens sending ·
          </span>
          <h1 className="leading-[0.82]">
            <Wordmark size="xl" />
          </h1>
          <p className="max-w-md font-body text-lg text-bone-dim leading-snug">
            En sanntids-quiz der <em className="font-display italic text-bone">publikum</em> spiller
            sammen fra mobilen. AI velger spørsmål. Rask finger vinner.
          </p>
        </div>

        <div className="w-full max-w-md">
          <Oscilloscope />
        </div>

        <button
          onClick={() => authClient.signIn.social({ provider: "google" })}
          className="card-offset inline-flex items-center gap-3 rounded-[6px] bg-bone px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.2em] text-ink"
        >
          <GoogleIcon />
          Logg inn med Google
          <span aria-hidden="true" className="text-lg leading-none">→</span>
        </button>
      </main>

      <footer className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-bone-faint">
        <span>Ch. 0451</span>
        <span>Live &amp; unscripted</span>
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
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
