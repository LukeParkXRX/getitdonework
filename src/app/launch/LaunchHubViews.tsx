"use client";

import { useState, useEffect } from "react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function relTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

// ─── View type ────────────────────────────────────────────────────────────────

export type View = "checklist" | "about" | "features" | "credits" | "pages" | "services" | "accounts" | "timeline" | "notes";

export function getViewFromUrl(): View | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("view");
  const valid: View[] = ["checklist", "about", "features", "credits", "pages", "services", "accounts", "timeline", "notes"];
  return valid.includes(v as View) ? (v as View) : null;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarItem { view: View; icon: string; label: string; }

const SIDEBAR_GROUPS: SidebarItem[][] = [
  [{ view: "checklist", icon: "📋", label: "Checklist" }],
  [
    { view: "about", icon: "📖", label: "About" },
    { view: "features", icon: "⚡", label: "Features" },
    { view: "credits", icon: "🪙", label: "Credits Policy" },
    { view: "pages", icon: "🖥️", label: "Pages Preview" },
  ],
  [
    { view: "services", icon: "🔌", label: "Services" },
    { view: "accounts", icon: "🔑", label: "Accounts" },
    { view: "timeline", icon: "📈", label: "Dev Timeline" },
    { view: "notes", icon: "📝", label: "Notes" },
  ],
];

interface SidebarProps {
  view: View;
  onViewChange: (v: View) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarNav({ view, onViewChange, onMobileClose }: Omit<SidebarProps, "mobileOpen">) {
  return (
    <nav style={{ padding: "12px 0" }}>
      {SIDEBAR_GROUPS.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "8px 12px" }} />}
          {group.map((item) => {
            const active = view === item.view;
            return (
              <button
                key={item.view}
                onClick={() => { onViewChange(item.view); onMobileClose(); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", margin: "1px 6px",
                  width: "calc(100% - 12px)",
                  backgroundColor: active ? "var(--color-accent)" : "transparent",
                  color: active ? "var(--color-black)" : "var(--color-dim)",
                  border: "none", borderRadius: "var(--radius-md)",
                  cursor: "pointer", textAlign: "left",
                  fontSize: "15px", fontWeight: active ? 700 : 500,
                  fontFamily: "var(--font-display)", transition: "all 0.12s",
                }}
                onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "oklch(0.22 0.005 280)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)"; } }}
                onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)"; } }}
              >
                <span style={{ fontSize: "15px", lineHeight: 1 }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ view, onViewChange, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      <aside className="launch-sidebar" style={{ width: 200, flexShrink: 0, borderRight: "1px solid var(--color-border)", position: "sticky", top: 56, height: "calc(100vh - 56px)", overflowY: "auto", backgroundColor: "var(--color-black)" }}>
        <SidebarNav view={view} onViewChange={onViewChange} onMobileClose={onMobileClose} />
      </aside>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "fixed", left: 0, top: 56, bottom: 0, width: 220, backgroundColor: "var(--color-black)", borderRight: "1px solid var(--color-border)", overflowY: "auto", zIndex: 201 }}>
            <SidebarNav view={view} onViewChange={onViewChange} onMobileClose={onMobileClose} />
          </div>
          <div onClick={onMobileClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 200 }} />
        </div>
      )}
    </>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

export function AboutView() {
  const card: React.CSSProperties = { backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px 28px", transition: "border-color 0.15s ease" };
  const h2: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 };
  const body: React.CSSProperties = { fontSize: "16px", color: "var(--color-text)", lineHeight: 1.7 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>Get It Done at Work</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)", lineHeight: 1.65 }}>한국 스타트업과 미국 전문가를 연결하는 B2B 자문 플랫폼 · B2B advisory platform connecting Korean startups with US experts</div>
      </div>
      <div style={card}>
        <div style={h2}>사이트 목적 · Purpose</div>
        <div style={body}><strong>한국어:</strong> 한국 스타트업이 미국 시장에서 첫 고객을 만나는 가장 빠른 길. 검증된 미국 MBA Enabler들과 1:1 영상 세션을 통해 GTM, Fundraising, Compliance 등 실전 자문을 받습니다.</div>
        <div style={{ height: 12 }} />
        <div style={body}><strong>English:</strong> The fastest path for Korean startups to land their first US customer. Get hands-on advisory from verified US MBA Enablers via 1:1 video sessions — covering GTM, fundraising, compliance, and more.</div>
      </div>
      <div style={card}>
        <div style={h2}>타깃 유저 · Target Users</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { icon: "🚀", label: "Startup", desc: "미국 진출 준비 한국 스타트업 · Korean startups preparing for US market entry" },
            { icon: "🎓", label: "Enabler", desc: "미국 MBA 출신 검증된 자문가 · Vetted US MBA advisors with domain expertise" },
            { icon: "🏢", label: "Org Admin", desc: "양측 매칭을 운영하는 조직 관리자 · Organization admins managing matchmaking" },
          ].map((u) => (
            <div key={u.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span style={{ fontSize: "20px", lineHeight: 1.4 }}>{u.icon}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{u.label}</div>
                <div style={{ fontSize: "15px", color: "oklch(0.72 0.01 280)", lineHeight: 1.65 }}>{u.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={h2}>핵심 가치 · Core Values</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {[
            { n: "①", t: "Verified Enablers", d: "모든 Enabler는 심사 후 승인 · Each Enabler reviewed before approval" },
            { n: "②", t: "Credit-based Fairness", d: "투명한 크레딧 시스템 · Transparent credit-based pricing" },
            { n: "③", t: "KO + EN Support", d: "완전한 한/영 양국어 · Full Korean and English language support" },
            { n: "④", t: "Built-in Video", d: "예약부터 세션까지 원스톱 · One-stop from booking to live session" },
          ].map((v) => (
            <div key={v.n} style={{ backgroundColor: "oklch(0.15 0.005 280 / 0.6)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "14px 16px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700, color: "var(--color-accent)", marginBottom: 4 }}>{v.n} {v.t}</div>
              <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", lineHeight: 1.6 }}>{v.d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}>
          <div style={h2}>현재 단계 · Status</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--color-accent)", display: "inline-block" }} />
            <span style={{ fontSize: "16px", color: "var(--color-text)", fontWeight: 600 }}>Beta → Launch Prep</span>
          </div>
          <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", marginTop: 6 }}>Sprint 54 — 정식 런칭 준비 중</div>
        </div>
        <div style={card}>
          <div style={h2}>연락처 · Contact</div>
          <a href="mailto:support@getitdonework.com" style={{ fontSize: "14px", color: "var(--color-accent)", textDecoration: "none", fontFamily: "var(--font-mono)" }}>support@getitdonework.com</a>
          <div style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)", marginTop: 6 }}>고객 지원 / Customer support</div>
        </div>
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEAT_GROUPS = [
  { cat: "인증/온보딩 · Auth & Onboarding", icon: "🔐", items: [{ l: "이메일 가입 · Email signup", s: 1 }, { l: "2FA (TOTP)", s: 36 }, { l: "역할별 첫진입 · Role-based onboarding", s: 5 }, { l: "Google OAuth", s: 10 }] },
  { cat: "매칭/예약 · Matching & Booking", icon: "📅", items: [{ l: "Enabler 검색+필터", s: 8 }, { l: "1:1 매칭", s: 12 }, { l: "시간 슬롯 예약", s: 15 }, { l: "Chemistry/Standard/Project 세션", s: 20 }] },
  { cat: "결제/크레딧 · Payment & Credits", icon: "💳", items: [{ l: "Stripe 결제", s: 18 }, { l: "크레딧 시스템", s: 22 }, { l: "환불 처리", s: 25 }, { l: "Enabler 정산 (Payouts)", s: 30 }, { l: "인보이스 PDF", s: 32 }, { l: "Stripe idempotency", s: 48 }] },
  { cat: "영상 세션 · Video Sessions", icon: "🎥", items: [{ l: "LiveKit WebRTC", s: 40 }, { l: "Pre-call lobby", s: 50 }, { l: "자동 완료", s: 50 }, { l: "시간 가드", s: 51 }, { l: "세션 종료 페이지", s: 50 }] },
  { cat: "소통 · Communication", icon: "💬", items: [{ l: "1:1 채팅", s: 28 }, { l: "알림 센터", s: 33 }, { l: "Web Push", s: 39 }, { l: "이메일 다이제스트", s: 42 }] },
  { cat: "콘텐츠 · Content", icon: "📝", items: [{ l: "Insights 글", s: 35 }, { l: "리뷰/평점", s: 38 }, { l: "북마크", s: 41 }, { l: "검색", s: 44 }] },
  { cat: "운영 · Operations", icon: "⚙️", items: [{ l: "Admin panel", s: 20 }, { l: "KPI funnel", s: 45 }, { l: "Audit log", s: 38 }, { l: "분쟁 처리", s: 43 }, { l: "Impersonation", s: 38 }, { l: "활동 로그", s: 37 }] },
  { cat: "인프라 · Infrastructure", icon: "🏗️", items: [{ l: "PWA", s: 46 }, { l: "i18n (KO/EN)", s: 10 }, { l: "SEO", s: 47 }, { l: "Cookie consent v2", s: 48 }, { l: "GDPR/CCPA", s: 48 }, { l: "에러 페이지", s: 48 }] },
];

export function FeaturesView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>주요 기능 · Features</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>스프린트별 구현 기능 목록 · Features implemented per sprint</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {FEAT_GROUPS.map((g) => (
          <div key={g.cat} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", transition: "border-color 0.15s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: "20px" }}>{g.icon}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--color-text)" }}>{g.cat}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((item) => (
                <div key={item.l} style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5, flex: 1 }}>{item.l}</span>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-display)", fontWeight: 700, color: "oklch(0.72 0.01 280)", backgroundColor: "oklch(0.15 0.005 280 / 0.6)", padding: "1px 6px", borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}>S{item.s}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export function CreditsView({ email }: { email: string }) {
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    void fetch("/api/launch/state", { headers: { Authorization: `Bearer ${email}` } })
      .then((r) => { if (!r.ok) setErr(true); })
      .catch(() => setErr(true))
      .finally(() => setReady(true));
  }, [email]);

  const card: React.CSSProperties = { backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "24px 28px", transition: "border-color 0.15s ease" };
  const h2: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 700, color: "var(--color-accent)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 };

  if (!ready) return <div style={{ color: "var(--color-dim)", fontSize: "15px", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>크레딧 정책 · Credits Policy</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>세션 유형별 크레딧 소모량 및 정책</div>
      </div>
      {err && <div style={{ fontSize: "14px", color: "oklch(0.63 0.2 25)", padding: "10px 14px", border: "1px solid oklch(0.63 0.2 25 / 0.3)", borderRadius: "var(--radius-md)" }}>DB 연결 오류 — 기본값 표시 중</div>}
      <div style={card}>
        <div style={h2}>세션별 크레딧</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ icon: "🔮", title: "Chemistry Session", credits: 1, desc: "30분 무료 상담 · 30-min intro call" }, { icon: "⚡", title: "Standard Session", credits: 3, desc: "60분 전문 자문 · 60-min expert advisory" }, { icon: "🏗️", title: "Project Session", credits: 8, desc: "지속 프로젝트 · Ongoing project engagement" }].map((p) => (
            <div key={p.title} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", backgroundColor: "oklch(0.15 0.005 280 / 0.6)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <span style={{ fontSize: "22px" }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)" }}>{p.desc}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--color-accent)" }}>{p.credits}</div>
                <div style={{ fontSize: "12px", color: "oklch(0.72 0.01 280)" }}>credits</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={card}>
          <div style={h2}>크레딧 단가</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 700, color: "var(--color-text)" }}>$10</div>
          <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", marginTop: 4 }}>1 credit</div>
        </div>
        <div style={card}>
          <div style={h2}>Enabler 정산율</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 700, color: "var(--color-text)" }}>70%</div>
          <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", marginTop: 4 }}>세션 크레딧 가치 기준</div>
        </div>
      </div>
      <div style={card}>
        <div style={h2}>정책 세부</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "만료 · Expiry", value: "구매 후 12개월 · 12 months from purchase" },
            { label: "환불 · Refund", value: "세션 전 취소 시 전액 환급 · Full refund on pre-session cancellation" },
            { label: "홀드 · Hold", value: "예약 시 선차감, 취소 시 복원" },
            { label: "Org 할당", value: "Org Admin이 팀원에게 크레딧 배분 가능" },
          ].map((p) => (
            <div key={p.label} style={{ display: "flex", gap: 12 }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "oklch(0.72 0.01 280)", whiteSpace: "nowrap", minWidth: 140 }}>{p.label}</span>
              <span style={{ fontSize: "15px", color: "var(--color-text)", lineHeight: 1.6 }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Pages Preview ────────────────────────────────────────────────────────────

const PAGE_GROUPS = [
  { role: "Public", icon: "🌐", pages: [
    { path: "/", ko: "홈 랜딩", en: "Home landing page" },
    { path: "/enablers", ko: "Enabler 목록/검색", en: "Enabler listing & search" },
    { path: "/insights", ko: "인사이트 글 목록", en: "Insights article feed" },
    { path: "/about", ko: "서비스 소개", en: "About" },
    { path: "/faq", ko: "FAQ", en: "FAQ" },
    { path: "/credits", ko: "크레딧 패키지", en: "Buy credits" },
    { path: "/privacy", ko: "개인정보 처리방침", en: "Privacy policy" },
    { path: "/terms", ko: "이용약관", en: "Terms of service" },
    { path: "/refund", ko: "환불 정책", en: "Refund policy" },
    { path: "/search", ko: "통합 검색", en: "Global search" },
    { path: "/contact", ko: "문의", en: "Contact us" },
    { path: "/careers", ko: "채용", en: "Careers" },
  ]},
  { role: "Auth", icon: "🔑", pages: [{ path: "/login", ko: "로그인", en: "Sign in" }, { path: "/signup", ko: "회원가입", en: "Create account" }] },
  { role: "Startup", icon: "🚀", pages: [
    { path: "/my", ko: "스타트업 대시보드", en: "Startup dashboard" },
    { path: "/bookings", ko: "예약 목록", en: "My bookings" },
    { path: "/matching", ko: "Enabler 매칭", en: "Enabler matching" },
    { path: "/messages", ko: "1:1 채팅", en: "Direct messages" },
    { path: "/projects", ko: "프로젝트 목록", en: "My projects" },
  ]},
  { role: "Enabler", icon: "🎓", pages: [
    { path: "/enabler-dashboard", ko: "Enabler 대시보드", en: "Enabler dashboard" },
    { path: "/enabler-dashboard/profile", ko: "프로필 관리", en: "Manage profile" },
    { path: "/enabler-dashboard/availability", ko: "가용 시간 설정", en: "Set availability" },
    { path: "/enabler-dashboard/earnings", ko: "수익 현황", en: "Earnings overview" },
  ]},
  { role: "Org Admin", icon: "🏢", pages: [{ path: "/org/dashboard", ko: "조직 대시보드", en: "Org admin dashboard" }] },
  { role: "Super Admin", icon: "⚙️", pages: [
    { path: "/admin", ko: "관리자 홈", en: "Admin home" },
    { path: "/admin/enablers", ko: "Enabler 심사/관리", en: "Enabler review & management" },
    { path: "/admin/users", ko: "유저 관리", en: "User management" },
    { path: "/admin/applications", ko: "지원서 검토", en: "Application review" },
    { path: "/admin/disputes", ko: "분쟁 처리", en: "Dispute resolution" },
    { path: "/admin/payouts", ko: "정산 관리", en: "Payout management" },
    { path: "/admin/audit-log", ko: "감사 로그", en: "Audit log" },
    { path: "/admin/announcements", ko: "공지사항", en: "Announcements" },
    { path: "/admin/inquiries", ko: "문의 관리", en: "Inquiry management" },
    { path: "/admin/credit-packages", ko: "크레딧 패키지 관리", en: "Credit package management" },
  ]},
];

export function PagesView() {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>페이지 미리보기 · Pages Preview</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>역할별 접근 페이지 목록</div>
      </div>
      {PAGE_GROUPS.map((group) => (
        <div key={group.role} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", transition: "border-color 0.15s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: "20px" }}>{group.icon}</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--color-text)" }}>{group.role}</span>
            <span style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", marginLeft: 4 }}>({group.pages.length})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {group.pages.map((page) => (
              <div key={page.path} style={{ backgroundColor: "oklch(0.15 0.005 280 / 0.6)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--color-accent)", fontWeight: 600 }}>{page.path}</div>
                <div style={{ fontSize: "14px", color: "var(--color-text)", lineHeight: 1.5 }}>{page.ko}</div>
                <div style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)", lineHeight: 1.5 }}>{page.en}</div>
                {appUrl && <a href={`${appUrl}${page.path}`} target="_blank" rel="noopener noreferrer" style={{ marginTop: 4, fontSize: "12px", color: "oklch(0.65 0.15 250)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600 }}>새 탭에서 열기 ↗</a>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Services ─────────────────────────────────────────────────────────────────

interface LaunchService { id: string; name: string; category: string; url: string | null; description: string; monthly_cost_usd: number; cost_note: string; is_active: boolean; display_order: number; updated_at: string; }

const CAT_ICONS: Record<string, string> = { "Database/Auth": "🗄️", "Hosting": "☁️", "Payment": "💳", "Video": "🎥", "Email": "📧", "Monitoring": "📊", "Rate Limit": "🚦", "AI": "🤖", "Analytics": "📈", "Code": "💻", "Domain": "🌐" };

export function ServicesView({ email }: { email: string }) {
  const [services, setServices] = useState<LaunchService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCost, setEditCost] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/launch/services", { headers: { Authorization: `Bearer ${email}` } })
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { services: LaunchService[] }; setServices(j.services); } })
      .finally(() => setLoading(false));
  }, [email]);

  const saveEdit = async (id: string) => {
    const val = parseFloat(editCost);
    if (isNaN(val) || val < 0) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/launch/services/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${email}` }, body: JSON.stringify({ monthly_cost_usd: val }) });
      if (r.ok) { const j = (await r.json()) as { service: LaunchService }; setServices((p) => p.map((s) => s.id === id ? j.service : s)); setEditId(null); }
    } finally { setSaving(false); }
  };

  const total = services.reduce((s, v) => s + v.monthly_cost_usd, 0);
  if (loading) return <div style={{ color: "var(--color-dim)", fontSize: "14px", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>외부 서비스 · Services</div>
          <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>사용 중인 외부 서비스 + 월 비용</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--color-accent)" }}>~${total.toFixed(0)}/mo</div>
          <div style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)" }}>고정비 합계 (usage-based excluded)</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {services.map((svc) => (
          <div key={svc.id} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10, opacity: svc.is_active ? 1 : 0.5, transition: "border-color 0.15s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "22px" }}>{CAT_ICONS[svc.category] ?? "🔧"}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{svc.name}</div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "oklch(0.72 0.01 280)", backgroundColor: "oklch(0.15 0.005 280 / 0.8)", padding: "2px 7px", borderRadius: "var(--radius-full)", fontFamily: "var(--font-display)" }}>{svc.category}</span>
                </div>
              </div>
              {svc.url && <a href={svc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "oklch(0.65 0.15 250)", textDecoration: "none", whiteSpace: "nowrap", fontFamily: "var(--font-display)", fontWeight: 600 }}>Open ↗</a>}
            </div>
            <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", lineHeight: 1.6 }}>{svc.description}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
              {editId === svc.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "13px", color: "oklch(0.65 0.01 280)" }}>$</span>
                  <input type="number" value={editCost} onChange={(e) => setEditCost(e.target.value)} style={{ width: 70, backgroundColor: "var(--color-dark)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "3px 6px", fontSize: "13px", color: "var(--color-text)", outline: "none" }} autoFocus />
                  <button onClick={() => void saveEdit(svc.id)} disabled={saving} style={{ fontSize: "12px", color: "var(--color-accent)", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{saving ? "..." : "저장"}</button>
                  <button onClick={() => setEditId(null)} style={{ fontSize: "12px", color: "oklch(0.65 0.01 280)", background: "none", border: "none", cursor: "pointer" }}>취소</button>
                </div>
              ) : (
                <button onClick={() => { setEditId(svc.id); setEditCost(String(svc.monthly_cost_usd)); }} style={{ display: "flex", alignItems: "baseline", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: svc.monthly_cost_usd === 0 ? "oklch(0.72 0.19 155)" : "var(--color-text)" }}>{svc.monthly_cost_usd === 0 ? "Free" : `$${svc.monthly_cost_usd}`}</span>
                  {svc.monthly_cost_usd > 0 && <span style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)" }}>/mo</span>}
                  <span style={{ fontSize: "12px", color: "oklch(0.65 0.15 250)", marginLeft: 4 }}>✏️</span>
                </button>
              )}
              <span style={{ fontSize: "12px", color: "oklch(0.72 0.01 280)", lineHeight: 1.5, textAlign: "right", maxWidth: 120 }}>{svc.cost_note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Accounts ─────────────────────────────────────────────────────────────────

interface LaunchAccount { id: string; name: string; account_id: string; url: string | null; description: string; notes: string; display_order: number; updated_at: string; }

export function AccountsView({ email }: { email: string }) {
  const [accounts, setAccounts] = useState<LaunchAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ account_id: string; notes: string }>({ account_id: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/launch/accounts", { headers: { Authorization: `Bearer ${email}` } })
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { accounts: LaunchAccount[] }; setAccounts(j.accounts); } })
      .finally(() => setLoading(false));
  }, [email]);

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const r = await fetch(`/api/launch/accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${email}` }, body: JSON.stringify(editFields) });
      if (r.ok) { const j = (await r.json()) as { account: LaunchAccount }; setAccounts((p) => p.map((a) => a.id === id ? j.account : a)); setEditId(null); }
    } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = { width: "100%", backgroundColor: "var(--color-dark)", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", padding: "6px 10px", fontSize: "13px", color: "var(--color-text)", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-mono)" };

  if (loading) return <div style={{ color: "var(--color-dim)", fontSize: "15px", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>계정 정보 · Accounts</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>서비스별 계정 ID + 대시보드 링크</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {accounts.map((acc) => (
          <div key={acc.id} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.15s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--color-text)", marginBottom: 4 }}>{acc.name}</div>
                <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)" }}>{acc.description}</div>
              </div>
              {acc.url && <a href={acc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: "oklch(0.65 0.15 250)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600, whiteSpace: "nowrap", marginLeft: 8 }}>Open ↗</a>}
            </div>
            {editId === acc.id ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ fontSize: "12px", color: "oklch(0.72 0.01 280)", marginBottom: 4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Account ID</div>
                  <input value={editFields.account_id} onChange={(e) => setEditFields((f) => ({ ...f, account_id: e.target.value }))} placeholder="account ID or project ID" style={inp} autoFocus />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "oklch(0.72 0.01 280)", marginBottom: 4, fontFamily: "var(--font-display)", fontWeight: 600 }}>Notes</div>
                  <input value={editFields.notes} onChange={(e) => setEditFields((f) => ({ ...f, notes: e.target.value }))} placeholder="메모..." style={{ ...inp, fontFamily: "var(--font-body)" }} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => void saveEdit(acc.id)} disabled={saving} style={{ flex: 1, padding: "6px 0", backgroundColor: "var(--color-accent)", color: "var(--color-black)", border: "none", borderRadius: "var(--radius-md)", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-display)" }}>{saving ? "저장 중..." : "저장"}</button>
                  <button onClick={() => setEditId(null)} style={{ padding: "6px 12px", backgroundColor: "transparent", color: "var(--color-dim)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "12px", cursor: "pointer" }}>취소</button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: acc.account_id ? "var(--color-text)" : "oklch(0.72 0.01 280)", backgroundColor: "oklch(0.15 0.005 280 / 0.6)", padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>{acc.account_id || "(비어 있음 · empty)"}</div>
                {acc.notes && <div style={{ fontSize: "14px", color: "oklch(0.72 0.01 280)", fontStyle: "italic", lineHeight: 1.6 }}>{acc.notes}</div>}
                <button onClick={() => { setEditId(acc.id); setEditFields({ account_id: acc.account_id, notes: acc.notes }); }} style={{ alignSelf: "flex-start", fontSize: "12px", color: "oklch(0.65 0.15 250)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 600, padding: 0 }}>✏️ 편집</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Dev Timeline ─────────────────────────────────────────────────────────────

interface GitCommit { sha: string; commit: { message: string; author: { name: string; date: string } }; html_url: string; }

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  feat: { bg: "oklch(0.72 0.19 155 / 0.15)", text: "oklch(0.72 0.19 155)" },
  fix: { bg: "oklch(0.91 0.2 110 / 0.12)", text: "var(--color-accent)" },
  chore: { bg: "oklch(0.52 0.01 280 / 0.2)", text: "var(--color-dim)" },
  refactor: { bg: "oklch(0.65 0.15 250 / 0.15)", text: "oklch(0.65 0.15 250)" },
  docs: { bg: "oklch(0.78 0.15 55 / 0.15)", text: "oklch(0.78 0.15 55)" },
};

function commitType(msg: string): string { return /^(\w+)[:(]/.exec(msg)?.[1] ?? "other"; }
function sprintLabel(msg: string): string | null { const m = /[Ss]print\s*(\d+)/i.exec(msg); return m ? `Sprint ${m[1]}` : null; }

function groupBySprint(commits: GitCommit[]): { label: string; commits: GitCommit[] }[] {
  const map = new Map<string, GitCommit[]>();
  for (const c of commits) { const k = sprintLabel(c.commit.message) ?? "기타 · Other"; (map.get(k) ?? (map.set(k, []), map.get(k)!)).push(c); }
  return [...map.entries()].sort(([a], [b]) => (parseInt(/(\d+)/.exec(b)?.[1] ?? "0") - parseInt(/(\d+)/.exec(a)?.[1] ?? "0"))).map(([label, commits]) => ({ label, commits }));
}

export function TimelineView() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PER = 50;

  const load = async (p: number) => {
    setLoading(true);
    try {
      const r = await fetch(`https://api.github.com/repos/LukeParkXRX/getitdonework/commits?per_page=${PER}&page=${p}`, { headers: { Accept: "application/vnd.github.v3+json" } });
      if (r.status === 404) { setError("저장소를 찾을 수 없음 (비공개 또는 주소 오류)"); return; }
      if (!r.ok) { setError(`GitHub API 오류: ${r.status}`); return; }
      const data = (await r.json()) as GitCommit[];
      setCommits((prev) => p === 1 ? data : [...prev, ...data]);
      setHasMore(data.length === PER);
    } catch { setError("네트워크 오류 — GitHub API 접근 불가"); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(1); }, []);

  const grouped = groupBySprint(commits);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>개발 흐름 · Dev Timeline</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>GitHub 커밋 히스토리 → Sprint별 그룹</div>
      </div>
      {error && <div style={{ padding: "16px 20px", backgroundColor: "oklch(0.63 0.2 25 / 0.08)", border: "1px solid oklch(0.63 0.2 25 / 0.3)", borderRadius: "var(--radius-lg)", fontSize: "15px", color: "oklch(0.63 0.2 25)" }}>⚠ {error}</div>}
      {!error && loading && commits.length === 0 && <div style={{ color: "var(--color-dim)", fontSize: "15px", padding: 24 }}>GitHub에서 커밋 로딩 중...</div>}
      {grouped.map((g) => (
        <div key={g.label} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 700, color: "var(--color-text)" }}>{g.label}</span>
            <span style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)" }}>{g.commits.length} commits</span>
          </div>
          {g.commits.map((c, i) => {
            const type = commitType(c.commit.message);
            const ts = TYPE_STYLES[type] ?? { bg: "oklch(0.15 0.005 280 / 0.6)", text: "var(--color-dim)" };
            return (
              <div key={c.sha} style={{ padding: "12px 20px", borderBottom: i < g.commits.length - 1 ? "1px solid var(--color-border)" : "none", display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "var(--font-display)", backgroundColor: ts.bg, color: ts.text, padding: "2px 7px", borderRadius: "var(--radius-full)", whiteSpace: "nowrap", marginTop: 2 }}>{type}</span>
                <a href={c.html_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, fontSize: "14px", color: "var(--color-text)", textDecoration: "none", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.commit.message.split("\n")[0]}</a>
                <span style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)", whiteSpace: "nowrap", marginTop: 2 }}>{relTime(c.commit.author.date)}</span>
              </div>
            );
          })}
        </div>
      ))}
      {!error && hasMore && <button onClick={() => { const n = page + 1; setPage(n); void load(n); }} disabled={loading} style={{ padding: "10px 0", backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-dim)", fontSize: "13px", cursor: loading ? "default" : "pointer", fontFamily: "var(--font-display)", fontWeight: 600 }}>{loading ? "로딩 중..." : "더 보기 · Load more"}</button>}
    </div>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────────

interface LaunchNote { id: string; title: string; body: string; pinned: boolean; author_email: string; created_at: string; updated_at: string; }

function renderMd(text: string): React.ReactNode {
  return text.split("\n").map((line, i, arr) => {
    const parts: React.ReactNode[] = [];
    let last = 0; let m: RegExpExecArray | null;
    const pat = /\*\*(.+?)\*\*/g;
    while ((m = pat.exec(line)) !== null) { if (m.index > last) parts.push(line.slice(last, m.index)); parts.push(<strong key={m.index}>{m[1]}</strong>); last = m.index + m[0].length; }
    parts.push(line.slice(last));
    return <span key={i}>{parts}{i < arr.length - 1 && <br />}</span>;
  });
}

export function NotesView({ email }: { email: string }) {
  const [notes, setNotes] = useState<LaunchNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/launch/notes", { headers: { Authorization: `Bearer ${email}` } })
      .then(async (r) => { if (r.ok) { const j = (await r.json()) as { notes: LaunchNote[] }; setNotes(j.notes); } })
      .finally(() => setLoading(false));
  }, [email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch("/api/launch/notes", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${email}` }, body: JSON.stringify({ title, body }) });
      if (r.ok) { const j = (await r.json()) as { note: LaunchNote }; setNotes((p) => [j.note, ...p]); setTitle(""); setBody(""); }
    } finally { setSubmitting(false); }
  };

  const togglePin = async (note: LaunchNote) => {
    const r = await fetch(`/api/launch/notes/${note.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${email}` }, body: JSON.stringify({ pinned: !note.pinned }) });
    if (r.ok) { const j = (await r.json()) as { note: LaunchNote }; setNotes((p) => [...p.map((n) => n.id === note.id ? j.note : n)].sort((a, b) => { if (a.pinned !== b.pinned) return b.pinned ? 1 : -1; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); })); }
  };

  const del = async (id: string) => {
    if (!confirm("이 노트를 삭제할까요? · Delete this note?")) return;
    const r = await fetch(`/api/launch/notes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${email}` } });
    if (r.ok) setNotes((p) => p.filter((n) => n.id !== id));
  };

  const inp: React.CSSProperties = { width: "100%", backgroundColor: "var(--color-dark)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "10px 14px", fontSize: "15px", color: "var(--color-text)", outline: "none", boxSizing: "border-box", lineHeight: 1.6, fontFamily: "var(--font-body)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--color-text)", marginBottom: 6, lineHeight: 1.2 }}>메모 · Notes</div>
        <div style={{ fontSize: "16px", color: "oklch(0.72 0.01 280)" }}>자유 메모 — 중요 정보 기록 · Free-form notes</div>
      </div>
      <form onSubmit={(e) => void submit(e)} style={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--color-accent)" }}>새 노트 작성 · New Note</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목 · Title" required style={inp} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder={"내용 입력. **굵게** 사용 가능 · Enter content. **bold** supported"} required rows={4} style={{ ...inp, resize: "vertical" }} />
        <button type="submit" disabled={submitting || !title.trim() || !body.trim()} style={{ alignSelf: "flex-end", padding: "7px 20px", backgroundColor: "var(--color-accent)", color: "var(--color-black)", border: "none", borderRadius: "var(--radius-md)", fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-display)", cursor: "pointer", opacity: submitting || !title.trim() || !body.trim() ? 0.5 : 1 }}>{submitting ? "저장 중..." : "저장 →"}</button>
      </form>
      {loading && <div style={{ color: "var(--color-dim)", fontSize: "14px", padding: 16 }}>Loading...</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notes.map((note) => (
          <div key={note.id} style={{ backgroundColor: note.pinned ? "oklch(0.91 0.2 110 / 0.05)" : "var(--color-card)", border: `1px solid ${note.pinned ? "oklch(0.91 0.2 110 / 0.25)" : "var(--color-border)"}`, borderRadius: "var(--radius-lg)", padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {note.pinned && <span style={{ fontSize: "14px" }}>📌</span>}
                <span style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--color-text)" }}>{note.title}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => void togglePin(note)} style={{ fontSize: "14px", background: "none", border: "none", cursor: "pointer", opacity: note.pinned ? 1 : 0.4 }}>📌</button>
                <button onClick={() => void del(note.id)} style={{ fontSize: "14px", background: "none", border: "none", cursor: "pointer", opacity: 0.5 }}>🗑️</button>
              </div>
            </div>
            <div style={{ fontSize: "15px", color: "var(--color-text)", lineHeight: 1.7, marginBottom: 10 }}>{renderMd(note.body)}</div>
            <div style={{ fontSize: "13px", color: "oklch(0.72 0.01 280)", display: "flex", gap: 10 }}>
              <span>{note.author_email}</span><span>·</span><span>{relTime(note.created_at)}</span>
            </div>
          </div>
        ))}
        {!loading && notes.length === 0 && (
          <div style={{ padding: "32px 16px", textAlign: "center", color: "oklch(0.65 0.01 280)", fontSize: "14px", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ fontSize: "24px", marginBottom: 8 }}>📝</div>
            아직 메모가 없습니다. 첫 메모를 남겨보세요!<br />
            <span style={{ fontSize: "14px" }}>No notes yet. Write your first note above.</span>
          </div>
        )}
      </div>
    </div>
  );
}
