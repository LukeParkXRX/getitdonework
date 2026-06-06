import Link from "next/link";
import type { LegalDocument } from "@/lib/legal/documents";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/cookie-policy", label: "Cookie" },
  { href: "/dpa", label: "DPA" },
] as const;

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <main
      style={{
        backgroundColor: "var(--color-black)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "120px 24px 80px",
        }}
      >
        <nav
          aria-label="Legal documents"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          {LEGAL_LINKS.map((link) => {
            const active = link.href === document.canonical;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  border: active ? "1px solid var(--color-accent)" : "1px solid var(--color-border)",
                  borderRadius: "6px",
                  color: active ? "var(--color-accent)" : "var(--color-dim)",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  lineHeight: 1,
                  padding: "9px 11px",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <p
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: 0,
            marginBottom: "14px",
            textTransform: "uppercase",
          }}
        >
          Official U.S. Policy
        </p>

        <h1
          style={{
            color: "var(--color-text)",
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "12px",
          }}
        >
          {document.title}
        </h1>

        <p
          style={{
            color: "var(--color-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            marginBottom: "36px",
          }}
        >
          Effective Date: {document.effectiveDate} · Version {document.version}
        </p>

        <article
          style={{
            borderTop: "1px solid var(--color-border)",
            color: "var(--color-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            lineHeight: 1.82,
            overflowWrap: "anywhere",
            paddingTop: "36px",
            whiteSpace: "pre-wrap",
          }}
        >
          {document.body}
        </article>
      </div>
    </main>
  );
}
