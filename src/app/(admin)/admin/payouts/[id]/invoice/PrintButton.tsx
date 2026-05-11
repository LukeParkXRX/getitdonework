"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--color-primary, #6366f1)",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "10px 20px",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 32,
      }}
    >
      인쇄 / PDF로 저장
    </button>
  );
}
