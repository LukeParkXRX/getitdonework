"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { icon: "📊", label: "대시보드", href: "/admin/dashboard" },
  { icon: "👤", label: "Enabler 심사", href: "/admin/enablers" },
  { icon: "🏢", label: "기관 관리", href: "/admin/organizations" },
  { icon: "👥", label: "사용자 관리", href: "/admin/users" },
  { icon: "💰", label: "크레딧 감사", href: "/admin/credits" },
  { icon: "🛍️", label: "결제 패키지", href: "/admin/credit-packages" },
  { icon: "📋", label: "Enabler 지원", href: "/admin/applications" },
  { icon: "💬", label: "문의함", href: "/admin/inquiries" },
  { icon: "✅", label: "결제 승인 대기", href: "/admin/payment-approvals" },
  { icon: "🚩", label: "신고 검토", href: "/admin/review-reports" },
  { icon: "🧾", label: "정산 인보이스", href: "/admin/payouts" },
  { icon: "💸", label: "정산 정책", href: "/admin/payout-settings" },
  { icon: "⚙️", label: "시스템 설정", href: "/admin/settings" },
];

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: "var(--color-dark)",
          borderRight: "1px solid var(--color-border)",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "24px 20px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
            }}
          >
            Get It Done
          </span>
          <span
            style={{
              background: "var(--color-accent)",
              color: "var(--color-black)",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            Admin
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border)", margin: "0 20px" }} />

        {/* Nav */}
        <nav style={{ padding: "12px 12px", flex: 1 }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginBottom: 2,
                  textDecoration: "none",
                  fontSize: 16,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--color-accent)" : "var(--color-text)",
                  background: isActive ? "rgba(var(--color-accent-rgb, 123, 104, 238), 0.12)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-card)";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-text)";
                  }
                }}
              >
                <span style={{ fontSize: 17, lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border)", margin: "0 20px" }} />

        {/* Admin user info */}
        <div
          style={{
            padding: "16px 20px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-black)",
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Get It Done 운영팀
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-accent)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                marginTop: 1,
              }}
            >
              super_admin
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px 48px",
          background: "var(--color-black)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
