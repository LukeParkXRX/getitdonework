import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Get It Done at Work";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
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
        {/* 상단: 액센트 도트 + 브랜드명 */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              background: "#d4f000",
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: "#888",
              letterSpacing: "0.05em",
            }}
          >
            GET IT DONE AT WORK
          </div>
        </div>

        {/* 중앙: 메인 카피 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: 96,
              color: "#f5f5f5",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {"한국 스타트업의"}
            <br />
            {"미국 진출 파트너"}
          </div>
          <div
            style={{
              fontSize: 40,
              color: "#d4f000",
              fontWeight: 600,
            }}
          >
            We don&apos;t advise. We execute.
          </div>
        </div>

        {/* 하단: 부제 + 도메인 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ fontSize: 22, color: "#888" }}>
            {"실시간 매칭 · US Market Enabler"}
          </div>
          <div style={{ fontSize: 22, color: "#666" }}>getitdonework.com</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "NotoSansKR",
              data: fontData,
              weight: 700,
              style: "normal",
            },
          ]
        : undefined,
    }
  );
}
