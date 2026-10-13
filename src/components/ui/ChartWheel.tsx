"use client";
import { useMemo } from "react";
import type { ChartPoint, ChartAspect } from "@/lib/astrologyTypes";
const SIGNS = [
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
export const polar = (longitude: number, radius: number, ascendant = 0) => {
  const angle = ((180 - longitude + ascendant) * Math.PI) / 180;
  return {
    x: 250 + Math.cos(angle) * radius,
    y: 250 - Math.sin(angle) * radius,
  };
};
export default function ChartWheel({
  points,
  transits,
  houses,
  aspects,
  selected,
  onSelect,
  tilt,
}: {
  points: ChartPoint[];
  transits?: ChartPoint[];
  houses: ChartPoint[];
  aspects: ChartAspect[];
  selected: string;
  onSelect: (name: string) => void;
  tilt: boolean;
}) {
  const asc = houses[0]?.longitude ?? 0;
  const markers = useMemo(
    () =>
      points.map((point, index) => {
        const collision = points
          .slice(0, index)
          .filter(
            (p) =>
              Math.abs(((p.longitude - point.longitude + 540) % 360) - 180) < 8,
          ).length;
        return {
          ...point,
          ...polar(point.longitude, 155 - (collision % 3) * 16, asc),
        };
      }),
    [points, asc],
  );
  return (
    <div className={`native-wheel ${tilt ? "native-wheel-tilt" : ""}`}>
      <svg
        viewBox="0 0 500 500"
        aria-label="Interactive geocentric chart; placements can also be selected from the inspector"
        role="group"
      >
        <defs>
          <radialGradient id="wheel-shade">
            <stop stopColor="var(--panel-strong-bg)" />
            <stop offset="1" stopColor="var(--app-bg)" />
          </radialGradient>
        </defs>
        <circle
          cx="250"
          cy="250"
          r="235"
          fill="url(#wheel-shade)"
          stroke="#c59b48"
          strokeWidth="1.5"
        />
        {[210, 185, 130, 55].map((r) => (
          <circle
            key={r}
            cx="250"
            cy="250"
            r={r}
            fill="none"
            stroke="#b68e43"
            strokeOpacity=".35"
          />
        ))}
        {SIGNS.map((sign, i) => {
          const a = polar(i * 30, 185, asc),
            b = polar(i * 30, 235, asc),
            t = polar(i * 30 + 15, 223, asc);
          return (
            <g key={sign}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#b68e43"
                strokeOpacity=".5"
              />
              <text
                x={t.x}
                y={t.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--astral-gold)"
                fontSize="21"
              >
                {sign}
              </text>
            </g>
          );
        })}
        {houses.map((house, i) => {
          const a = polar(house.longitude, 55, asc),
            b = polar(house.longitude, 185, asc),
            next = houses[(i + 1) % houses.length],
            middle =
              house.longitude +
              ((next.longitude - house.longitude + 360) % 360) / 2,
            t = polar(middle, 75, asc);
          return (
            <g key={house.name}>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#7feaff"
                strokeOpacity=".35"
              />
              <text
                x={t.x}
                y={t.y}
                textAnchor="middle"
                fill="var(--app-text)"
                opacity=".55"
                fontSize="11"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        {aspects
          .filter(
            (a) =>
              !selected ||
              [a.first, a.second, a.natal, a.transit].includes(selected),
          )
          .slice(0, 24)
          .map((a, i) => {
            const first = points.find((p) => p.name === (a.first ?? a.natal)),
              second = (a.transit ? transits : points)?.find(
                (p) => p.name === (a.second ?? a.transit),
              );
            if (!first || !second) return null;
            const x = polar(first.longitude, 130, asc),
              y = polar(second.longitude, 130, asc);
            return (
              <line
                key={i}
                x1={x.x}
                y1={x.y}
                x2={y.x}
                y2={y.y}
                stroke={
                  ["square", "opposition"].includes(a.aspect.toLowerCase())
                    ? "#d79772"
                    : "#69c6db"
                }
                strokeOpacity={selected ? 0.7 : 0.18}
                strokeWidth="1.2"
              >
                <title>
                  {first.name} {a.aspect} {second.name}, orb {a.orb.toFixed(2)}{" "}
                  degrees
                </title>
              </line>
            );
          })}
        {markers.map((p) => {
          const anchor = polar(p.longitude, 185, asc);
          return (
            <g
              key={p.name}
              role="button"
              tabIndex={0}
              aria-label={`${p.name}, ${p.sign}, ${p.degree.toFixed(2)} degrees`}
              aria-pressed={selected === p.name}
              onClick={() => onSelect(p.name)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(p.name);
                }
              }}
              className="wheel-point"
            >
              <line
                x1={anchor.x}
                y1={anchor.y}
                x2={p.x}
                y2={p.y}
                stroke="#d4a437"
                strokeOpacity=".5"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="16"
                fill={
                  selected === p.name ? "#d4a437" : "var(--panel-strong-bg)"
                }
                stroke="#d4a437"
              />
              <text
                x={p.x}
                y={p.y + 3}
                textAnchor="middle"
                fill={selected === p.name ? "#101422" : "var(--app-text)"}
                fontSize="9"
              >
                {p.name.slice(0, 3)}
              </text>
            </g>
          );
        })}
        {transits?.map((p) => {
          const at = polar(p.longitude, 197, asc);
          return (
            <g key={p.name}>
              <circle cx={at.x} cy={at.y} r="4" fill="#7feaff" />
              <title>
                Transiting {p.name}: {p.sign} {p.degree.toFixed(2)}°
              </title>
            </g>
          );
        })}
        <text
          x="250"
          y="248"
          textAnchor="middle"
          fill="var(--astral-gold)"
          fontSize="16"
        >
          myAeon
        </text>
        <text
          x="250"
          y="266"
          textAnchor="middle"
          fill="var(--app-text)"
          opacity=".5"
          fontSize="8"
        >
          GEOCENTRIC · TROPICAL
        </text>
      </svg>
    </div>
  );
}
