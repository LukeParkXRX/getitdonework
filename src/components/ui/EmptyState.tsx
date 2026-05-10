"use client";

import Link from "next/link";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "56px 32px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        textAlign: "center",
      }}
    >
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            marginBottom: 16,
            color: "var(--color-dim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      )}
      <p
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--color-text)",
          margin: 0,
          fontFamily: "var(--font-display)",
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            fontSize: 14,
            color: "var(--color-dim)",
            margin: "8px 0 0",
            maxWidth: 360,
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 20 }}>
          {action.href ? (
            <Link
              href={action.href}
              style={{
                display: "inline-block",
                padding: "9px 20px",
                background: "var(--color-accent)",
                color: "var(--color-black)",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              style={{
                padding: "9px 20px",
                background: "var(--color-accent)",
                color: "var(--color-black)",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
