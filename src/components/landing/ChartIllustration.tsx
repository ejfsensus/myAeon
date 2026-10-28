const symbols = [
  "♈",
  "♉",
  "♊",
  "♋",
  "♌",
  "♍",
  "♎",
  "♏",
  "♐",
  "♑",
  "♒",
  "♓",
];
const point = (angle: number, radius: number) => [
  200 + Math.cos(angle) * radius,
  200 + Math.sin(angle) * radius,
];

/** Editorial illustration, deliberately independent of a visitor's natal data. */
export default function ChartIllustration() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="landing-chart"
      role="img"
      aria-label="Illustrative zodiac wheel with twelve signs and intersecting aspect lines; not a personal birth chart"
    >
      <defs>
        <radialGradient id="chart-wash">
          <stop stopColor="#7feaff" stopOpacity=".08" />
          <stop offset="1" stopColor="#7feaff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="200" r="195" fill="url(#chart-wash)" />
      {[182, 174, 142, 134, 86].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={r === 182 ? 1 : 0.6}
          opacity={r === 86 ? 0.2 : 0.5}
        />
      ))}
      {Array.from({ length: 72 }, (_, i) => {
        const a = (i / 72) * Math.PI * 2;
        const [x1, y1] = point(a, 174),
          [x2, y2] = point(a, i % 6 === 0 ? 142 : 169);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            opacity=".4"
            strokeWidth=".7"
          />
        );
      })}
      {symbols.map((symbol, i) => {
        const angle = ((i + 0.5) / 12) * Math.PI * 2;
        const [x, y] = point(angle, 158);
        return (
          <text
            key={symbol}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize="18"
          >
            {symbol}
          </text>
        );
      })}
      {[0, 2, 5, 7, 9, 11].map((n, i, all) => {
        const [x1, y1] = point((n / 12) * Math.PI * 2 + 0.14, 129);
        const [x2, y2] = point(
          (all[(i + 2) % all.length] / 12) * Math.PI * 2 + 0.14,
          129,
        );
        return (
          <g key={n}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 2 ? "#7feaff" : "currentColor"}
              opacity=".4"
              strokeWidth=".8"
            />
            <circle cx={x1} cy={y1} r="3" fill="currentColor" />
          </g>
        );
      })}
      <circle
        cx="200"
        cy="200"
        r="8"
        fill="none"
        stroke="currentColor"
        opacity=".6"
      />
      <circle cx="200" cy="200" r="2" fill="currentColor" />
    </svg>
  );
}
