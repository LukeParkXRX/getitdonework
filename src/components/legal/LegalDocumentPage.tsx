import Link from "next/link";
import { legalDocuments, type LegalDocument } from "@/lib/legal/documents";

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refund" },
  { href: "/acceptable-use", label: "Acceptable Use" },
  { href: "/cookie-policy", label: "Cookie" },
  { href: "/dpa", label: "DPA" },
] as const;

const LEGAL_SECTIONS = [
  { id: "terms", label: "Terms", document: legalDocuments.terms },
  { id: "privacy", label: "Privacy", document: legalDocuments.privacy },
  { id: "refund", label: "Refund", document: legalDocuments.refund },
  { id: "acceptable-use", label: "Acceptable Use", document: legalDocuments.acceptableUse },
  { id: "cookie-policy", label: "Cookie", document: legalDocuments.cookie },
  { id: "dpa", label: "DPA", document: legalDocuments.dpa },
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
          All official Get It Done policies are collected here. Use the side menu to jump to a specific
          document.
        </p>

        <div
          className="legal-center-grid"
          style={{
            alignItems: "start",
            display: "grid",
            gap: "32px",
            gridTemplateColumns: "minmax(0, 220px) minmax(0, 1fr)",
          }}
        >
          <aside
            className="legal-center-sidebar"
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "8px",
              padding: "12px",
              position: "sticky",
              top: "84px",
            }}
          >
            <nav aria-label="Legal center sections" style={{ display: "grid", gap: "6px" }}>
              {LEGAL_SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  style={{
                    borderRadius: "6px",
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    padding: "10px 11px",
                    textDecoration: "none",
                  }}
                >
                  {section.label}
                </a>
              ))}
            </nav>
          </aside>

          <div style={{ display: "grid", gap: "56px", minWidth: 0 }}>
            {LEGAL_SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                style={{
                  borderTop: "1px solid var(--color-border)",
                  paddingTop: "32px",
                  scrollMarginTop: "90px",
                }}
              >
                <div
                  style={{
                    alignItems: "baseline",
                    display: "flex",
                    gap: "12px",
                    justifyContent: "space-between",
                    marginBottom: "18px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        color: "var(--color-text)",
                        fontFamily: "var(--font-display)",
                        fontSize: "24px",
                        fontWeight: 700,
                        lineHeight: 1.2,
                        margin: "0 0 6px",
                      }}
                    >
                      {section.document.title}
                    </h2>
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
                  </div>

                  <Link
                    href={section.document.canonical}
                    style={{
                      color: "var(--color-accent)",
                      flexShrink: 0,
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      textDecoration: "none",
                    }}
                  >
                    Open
                  </Link>
                </div>

                <article
                  style={{
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-body)",
                    fontSize: "15px",
                    lineHeight: 1.82,
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {section.document.body}
                </article>
              </section>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          .legal-center-grid {
            grid-template-columns: 1fr !important;
          }

          .legal-center-sidebar {
            position: static !important;
          }
        }
      `}</style>
    </main>
  );
}
