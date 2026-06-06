import Link from "next/link";
import { legalDocuments, type LegalDocument } from "@/lib/legal/documents";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
  { href: "/cookie-policy", label: "Cookie" },
] as const;

const LEGAL_SECTIONS = [
  { id: "terms", label: "Terms", document: legalDocuments.terms },
  { id: "privacy", label: "Privacy", document: legalDocuments.privacy },
  { id: "refund", label: "Refund", document: legalDocuments.refund },
  { id: "cookie-policy", label: "Cookie", document: legalDocuments.cookie },
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

export function LegalCenterPage() {
  return (
    <main
      style={{
        backgroundColor: "var(--color-black)",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "120px 24px 80px",
        }}
      >
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
          Official U.S. Policies
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
          Legal Center
        </h1>

        <p
          style={{
            color: "var(--color-dim)",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "720px",
          }}
        >
          Public policy links for visitors and account holders. Contract templates and internal reference
          materials are not published here.
        </p>

        <div
          className="legal-center-card-grid"
          style={{
            display: "grid",
            gap: "14px",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          {LEGAL_SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={section.document.canonical}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                color: "inherit",
                display: "block",
                minWidth: 0,
                padding: "22px",
                textDecoration: "none",
              }}
            >
              <article
                key={section.id}
                style={{
                  display: "grid",
                  gap: "10px",
                }}
              >
                <h2
                  style={{
                    color: "var(--color-text)",
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {section.document.title}
                </h2>
                <p
                  style={{
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {section.document.description}
                </p>
                <p
                  style={{
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    margin: 0,
                  }}
                >
                  Effective Date: {section.document.effectiveDate} · Version {section.document.version}
                </p>
                <span
                  style={{
                    color: "var(--color-accent)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                  }}
                >
                  Open policy
                </span>
              </article>
            </Link>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .legal-center-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
