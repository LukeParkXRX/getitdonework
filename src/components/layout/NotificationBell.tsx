"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

function sendDesktopNotification(n: Notification) {
  if (typeof window === "undefined" || window.Notification?.permission !== "granted") return;
  const notif = new window.Notification("Get It Done at Work", {
    body: `${n.title}: ${n.body.slice(0, 80)}`,
    icon: "/favicon.ico",
    tag: n.id,
  });
  notif.onclick = () => {
    window.focus();
    notif.close();
    if (n.link) window.location.href = n.link;
  };
}

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function typeIcon(type: string): string {
  switch (type) {
    case "booking_requested": return "📋";
    case "booking_confirmed": return "✅";
    case "booking_cancelled": return "❌";
    case "review_received": return "⭐";
    case "application_received": return "📩";
    case "application_status": return "📢";
    default: return "🔔";
  }
}

function timeAgo(
  dateStr: string,
  tt: (key: string, values?: Record<string, string | number>) => string,
): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return tt("justNow");
  if (diff < 3600) return tt("minutesAgo", { n: Math.floor(diff / 60) });
  if (diff < 86400) return tt("hoursAgo", { n: Math.floor(diff / 3600) });
  return tt("daysAgo", { n: Math.floor(diff / 86400) });
}

export default function NotificationBell() {
  const t = useTranslations("Notifications");
  const tb = useTranslations("NotificationBell");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const prevUnreadRef = useRef<number>(-1);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notification[] };
      const incoming = data.notifications ?? [];
      setNotifications(incoming);

      // 데스크탑 알림: 이전보다 unread 증가 시 최신 1건 발송
      const newUnread = incoming.filter((n) => !n.read_at).length;
      if (prevUnreadRef.current >= 0 && newUnread > prevUnreadRef.current) {
        const latest = incoming.find((n) => !n.read_at);
        if (latest) sendDesktopNotification(latest);
      }
      prevUnreadRef.current = newUnread;
    } catch {
      // 네트워크 오류 무시
    }
  }, []);

  // 마운트 시 1회 + 30초 polling
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // tab title unread count 반영
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\)\s/, "");
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${original}`;
    } else {
      document.title = original;
    }
    return () => {
      document.title = original;
    };
  }, [unreadCount]);

  // outside click 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    );
  }

  async function handleItemClick(n: Notification) {
    if (!n.read_at) await markRead(n.id);
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-flex" }}>
      {/* 종 버튼 */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? t("ariaLabel", { count: unreadCount }) : t("title")}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: open ? "var(--color-card)" : "transparent",
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-card)";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }}
      >
        {/* 종 SVG */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-dim)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* 배지 */}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "8px",
              backgroundColor: "#ef4444",
              color: "#fff",
              fontSize: "10px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
              fontFamily: "var(--font-body)",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "340px",
            maxWidth: "calc(100vw - 24px)",
            backgroundColor: "var(--color-dark)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            boxShadow: "0 16px 40px oklch(0 0 0 / 0.5)",
            zIndex: 60,
            overflow: "hidden",
          }}
        >
          {/* 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span
              style={{
                color: "var(--color-text)",
                fontSize: "14px",
                fontWeight: "600",
                fontFamily: "var(--font-display)",
              }}
            >
              {t("title")}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                style={{
                  color: "var(--color-accent)",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  background: "none",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.5 : 1,
                  padding: "2px 0",
                }}
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* 리스트 */}
          <div
            style={{
              maxHeight: "480px",
              overflowY: "auto",
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: "40px 16px",
                  textAlign: "center",
                  color: "var(--color-dim)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                }}
              >
                {t("empty")}
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  style={{
                    display: "flex",
                    gap: "12px",
                    width: "100%",
                    padding: "12px 16px",
                    textAlign: "left",
                    backgroundColor: n.read_at ? "transparent" : "oklch(0.18 0 0)",
                    border: "none",
                    borderBottom: "1px solid var(--color-border)",
                    cursor: n.link ? "pointer" : "default",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-card)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      n.read_at ? "transparent" : "oklch(0.18 0 0)";
                  }}
                >
                  {/* 타입 아이콘 */}
                  <span
                    style={{
                      fontSize: "18px",
                      lineHeight: 1.4,
                      flexShrink: 0,
                    }}
                  >
                    {typeIcon(n.type)}
                  </span>

                  {/* 내용 */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        margin: 0,
                        color: n.read_at ? "var(--color-dim)" : "var(--color-text)",
                        fontSize: "13px",
                        fontWeight: "600",
                        fontFamily: "var(--font-body)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {n.title}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        color: "var(--color-dim)",
                        fontSize: "12px",
                        fontFamily: "var(--font-body)",
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {n.body}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0",
                        color: "var(--color-dim)",
                        fontSize: "11px",
                        fontFamily: "var(--font-body)",
                        opacity: 0.6,
                      }}
                    >
                      {timeAgo(n.created_at, tb)}
                    </p>
                  </div>

                  {/* unread dot */}
                  {!n.read_at && (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-accent)",
                        flexShrink: 0,
                        marginTop: "6px",
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
