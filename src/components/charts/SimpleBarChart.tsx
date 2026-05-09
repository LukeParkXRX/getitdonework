"use client";

export type ChartPoint = { date: string; value: number };

type Props = {
  data: ChartPoint[];
  height?: number;
  color?: string;
  label?: string;
};

export default function SimpleBarChart({
  data,
  height = 80,
  color = "#60a5fa",
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
  const PAD = { top: 8, right: 4, bottom: 24, left: 4 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const gap = 2;
  const barW = Math.max(1, innerW / data.length - gap);

  const toX = (i: number) => PAD.left + i * (innerW / data.length);
  const toBarH = (v: number) => Math.max(1, (v / maxVal) * innerH);

  const labelIndices = [0, Math.floor(data.length / 2), data.length - 1].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );

  // 최대값 인덱스
  const maxIdx = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

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
        {/* 그리드 */}
        {[0.5, 1].map((ratio) => {
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

        {/* 막대 */}
        {data.map((d, i) => {
          const bh = toBarH(d.value);
          const x = toX(i);
          const y = PAD.top + innerH - bh;
          const isMax = i === maxIdx && d.value > 0;
          return (
            <rect
              key={i}
              x={x + gap / 2}
              y={y}
              width={barW}
              height={bh}
              fill={color}
              opacity={isMax ? 1 : 0.55}
              rx={1.5}
            />
          );
        })}

        {/* 최대값 라벨 */}
        {data[maxIdx].value > 0 && (
          <text
            x={toX(maxIdx) + barW / 2}
            y={PAD.top + innerH - toBarH(data[maxIdx].value) - 4}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            fill={color}
          >
            {data[maxIdx].value.toLocaleString()}
          </text>
        )}

        {/* x축 날짜 */}
        {labelIndices.map((idx) => {
          const x = toX(idx) + barW / 2;
          const dateStr = data[idx].date.slice(5);
          return (
            <text
              key={idx}
              x={x}
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
