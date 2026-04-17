export function Wordmark({
  size = "md",
  tilt = false,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  tilt?: boolean;
}) {
  const sizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
    xl: "text-7xl sm:text-8xl",
  };
  return (
    <span
      className={`font-display font-black leading-[0.85] tracking-tight ${sizes[size]}`}
      style={{
        fontVariationSettings: '"opsz" 144, "SOFT" 30, "WONK" 1',
        transform: tilt ? "rotate(-3deg)" : undefined,
        display: "inline-block",
      }}
    >
      <span className="italic">Xpr</span>
      <span className="text-acid">Quiz</span>
      <span className="text-acid">.</span>
    </span>
  );
}
