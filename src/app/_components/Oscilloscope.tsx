"use client";

import { useEffect, useState } from "react";

export function Oscilloscope({ active = true }: { active?: boolean }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = performance.now();
    const loop = (now: number) => {
      setT((now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const W = 320;
  const H = 80;
  const mid = H / 2;
  const steps = 80;
  const amp = 20;
  const freq = 2.4;

  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const phase = (i / steps) * Math.PI * freq + t * 3.2;
    const envelope = Math.sin((i / steps) * Math.PI);
    const y =
      mid +
      Math.sin(phase) * amp * envelope +
      Math.sin(phase * 2.1) * (amp * 0.3) * envelope;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full max-w-md"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--acid)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke="var(--acid)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.18}
      />
      <line
        x1={0}
        x2={W}
        y1={mid}
        y2={mid}
        stroke="var(--bone-faint)"
        strokeWidth={1}
        strokeDasharray="2 4"
      />
    </svg>
  );
}
