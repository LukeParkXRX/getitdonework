"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const GlobalSearchModal = dynamic(
  () => import("@/components/admin/GlobalSearchModal"),
  { ssr: false, loading: () => null }
);

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: "대시보드",
    items: [
      { label: "대시보드 홈", href: "/admin/dashboard" },
    ],
  },
  {
    groupLabel: "사용자",
    items: [
      { label: "Enabler 관리", href: "/admin/enablers" },
      { label: "사용자", href: "/admin/users" },
      { label: "기관 관리", href: "/admin/organizations" },
    ],
  },
  {
    groupLabel: "결제·정산",
    items: [
      { label: "크레딧 거래", href: "/admin/credits" },
      { label: "결제 패키지", href: "/admin/credit-packages" },
      { label: "결제 승인 대기", href: "/admin/payment-approvals" },
      { label: "정산 인보이스", href: "/admin/payouts" },
      { label: "정산 정책", href: "/admin/payout-settings" },
    ],
  },
  {
    groupLabel: "운영 처리",
    items: [
      { label: "Enabler 지원", href: "/admin/applications" },
      { label: "문의함", href: "/admin/inquiries" },
      { label: "신고 검토", href: "/admin/review-reports" },
      { label: "분쟁 처리", href: "/admin/disputes" },
      { label: "공지사항", href: "/admin/announcements" },
    ],
  },
  {
    groupLabel: "분석",
    items: [
      { label: "KPI 퍼널", href: "/admin/analytics" },
      { label: "Webhook 모니터링", href: "/admin/webhooks" },
    ],
  },
  {
    groupLabel: "시스템",
    items: [
      { label: "활동 로그", href: "/admin/audit-log" },
      { label: "설정", href: "/admin/settings" },
    ],
  },
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

        {/* 검색 힌트 버튼 */}
        <SearchHintButton />

        {/* Nav */}
        <nav style={{ padding: "8px 12px 12px", flex: 1, overflowY: "auto" }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel}>
              {/* Group header */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                  padding: "16px 12px 6px",
                  fontFamily: "var(--font-display)",
                }}
              >
                {group.groupLabel}
              </div>

              {/* Items */}
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: 8,
                      marginBottom: 2,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--color-accent)" : "var(--color-text)",
                      background: isActive
                        ? "rgba(var(--color-accent-rgb, 123, 104, 238), 0.12)"
                        : "transparent",
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
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
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

      {/* 글로벌 검색 모달 — 모든 admin 페이지에서 Cmd+K로 작동 */}
      <GlobalSearchModal />
    </div>
  );
}

// ─── 검색 힌트 버튼 ───────────────────────────────────────────────────────

function SearchHintButton() {
  function openSearch() {
    // Cmd+K 이벤트를 직접 dispatch해서 GlobalSearchModal 토글
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  }

  return (
    <button
      onClick={openSearch}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "10px 12px 4px",
        padding: "8px 12px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        cursor: "pointer",
        width: "calc(100% - 24px)",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-dim)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <span
        style={{
          fontSize: 13,
          color: "var(--color-dim)",
          flex: 1,
          textAlign: "left",
          fontFamily: "var(--font-body)",
        }}
      >
        검색
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-dim)",
          background: "var(--color-dark)",
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          padding: "1px 5px",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.02em",
          flexShrink: 0,
        }}
      >
        ⌘K
      </span>
    </button>
  );
}
