import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Find Your US Market Enabler — Get It Done at Work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function EnablersOG() {
  const fontData = await fetch(
    "https://fonts.gstatic.com/s/notosanskr/v39/PbyxFmXiEBPT4ITbgNA5Cgms3VYcOA-vvnIzzg01eLQ.ttf"
  )
    .then((r) => r.arrayBuffer())
    .catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          fontFamily: "NotoSansKR, sans-serif",
        }}
      >
        {/* 상단 브랜드 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#d4f000",
            }}
          />
          <div style={{ fontSize: 22, color: "#888", letterSpacing: "0.05em" }}>
            GET IT DONE AT WORK
          </div>
        </div>

        {/* 중앙 메인 카피 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: 80,
              color: "#f5f5f5",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Find Your
            <br />
            <span style={{ color: "#d4f000" }}>US Market Enabler</span>
          </div>
          <div style={{ fontSize: 32, color: "#aaa", fontWeight: 500 }}>
            Stanford · Wharton · HBS Verified MBAs
          </div>
        </div>

        {/* 하단 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", gap: "32px" }}>
            {["50+ Enablers", "4.7 Rating", "Real Execution"].map((tag) => (
              <div
                key={tag}
                style={{
                  fontSize: 18,
                  color: "#d4f000",
                  background: "rgba(212,240,0,0.08)",
                  border: "1px solid rgba(212,240,0,0.25)",
                  borderRadius: 6,
                  padding: "6px 14px",
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 20, color: "#666" }}>getitdonework.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "NotoSansKR", data: fontData, weight: 700, style: "normal" }]
        : undefined,
    }
  );
}
