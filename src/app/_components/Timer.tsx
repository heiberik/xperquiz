export function Timer({
  timeRemaining,
  totalTime,
  label,
}: {
  timeRemaining: number;
  totalTime: number;
  label?: string;
}) {
  const fraction = Math.max(0, Math.min(1, timeRemaining / totalTime));
  const seconds = Math.ceil(timeRemaining / 1000);

  const color =
    fraction > 0.5
      ? "var(--acid)"
      : fraction > 0.2
        ? "var(--spot)"
        : "var(--flare)";

  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);

  return (
    <div className="flex items-center gap-3">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--bone-faint)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 100ms linear, stroke 300ms ease",
            }}
          />
        </svg>
        <span
          className="absolute inset-0 grid place-items-center font-mono text-xl font-bold tabular-nums"
          style={{ color }}
        >
          {seconds}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-[11px] uppercase tracking-[0.22em] text-bone-dim mb-1.5">
            {label}
          </p>
        )}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(243,236,217,0.15)" }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${fraction * 100}%`,
              background: color,
              transition: "width 100ms linear, background 300ms ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}
