"use client";

export type ChartPoint = { date: string; value: number };

type Props = {
  data: ChartPoint[];
  height?: number;
  color?: string;
  label?: string;
};

export default function SimpleLineChart({
  data,
  height = 80,
  color = "#7b68ee",
  label,
}: Props) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-dim)",
          fontSize: 13,
        }}
      >
        데이터 없음
      </div>
    );
  }

  const W = 300;
  const H = height;
  const PAD = { top: 8, right: 8, bottom: 24, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;

  const toX = (i: number) =>
    PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const toY = (v: number) =>
    PAD.top + innerH - ((v - minVal) / (maxVal - minVal)) * innerH;

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value), ...d }));

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points
          .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
          .join(" ");

  // 마지막 값
  const last = points[points.length - 1];
  const lastLabel = data[data.length - 1].value.toLocaleString();

  // x축 날짜 라벨 (첫·중간·마지막)
  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  return (
    <div style={{ width: "100%", position: "relative" }}>
      {label && (
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--color-dim)",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        {/* 그리드 라인 */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD.top + innerH * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={PAD.left}
              x2={PAD.left + innerW}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={0.5}
              strokeDasharray="3 3"
            />
          );
        })}

        {/* 라인 */}
        <path d={pathD} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />

        {/* 점 */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={data.length > 15 ? 0 : 2.5} fill={color} />
        ))}

        {/* 마지막 값 라벨 */}
        <text
          x={last.x}
          y={last.y - 6}
          textAnchor={last.x > W * 0.8 ? "end" : "middle"}
          fontSize={11}
          fontWeight={700}
          fill={color}
        >
          {lastLabel}
        </text>

        {/* x축 날짜 */}
        {labelIndices.map((idx) => {
          const p = points[idx];
          const dateStr = data[idx].date.slice(5); // MM-DD
          return (
            <text
              key={idx}
              x={p.x}
              y={H - 4}
              textAnchor={idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"}
              fontSize={9}
              fill="var(--color-dim)"
            >
              {dateStr}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
