const COLORS = [
  "var(--acid)",
  "var(--spot)",
  "var(--opt-2)",
  "var(--opt-4)",
  "var(--bone)",
];

export function Confetti() {
  const shards = Array.from({ length: 14 });
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible"
      aria-hidden="true"
    >
      {shards.map((_, i) => {
        const x = (i - 7) * 18 + (Math.random() * 20 - 10);
        const rot = (Math.random() * 720 - 360).toFixed(0);
        const delay = Math.random() * 120;
        const duration = 700 + Math.random() * 600;
        const color = COLORS[i % COLORS.length];
        const size = 6 + Math.floor(Math.random() * 6);
        const shape = i % 3;
        const style: React.CSSProperties = {
          left: "50%",
          top: "0",
          width: size,
          height: size * (shape === 1 ? 2 : 1),
          background: color,
          ["--confetti-x" as string]: `${x}px`,
          ["--confetti-r" as string]: `${rot}deg`,
          animation: `confettiFall ${duration}ms cubic-bezier(0.2, 0.7, 0.4, 1) ${delay}ms forwards`,
          borderRadius: shape === 2 ? "50%" : 0,
          transform: "translate(-50%, 0)",
        };
        return <span key={i} className="absolute block" style={style} />;
      })}
    </div>
  );
}
