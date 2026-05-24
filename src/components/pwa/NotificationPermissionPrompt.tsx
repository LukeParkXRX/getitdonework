"use client";
import { useEffect, useState } from "react";

const STORAGE_KEY = "__notification_prompted";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr.buffer as ArrayBuffer;
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return null;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sub),
  });

  return sub;
}

export default function NotificationPermissionPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "default" ||
      localStorage.getItem(STORAGE_KEY)
    ) {
      return;
    }
    setVisible(true);
  }, []);

  async function handleAllow() {
    const result = await Notification.requestPermission();
    localStorage.setItem(STORAGE_KEY, result);
    setVisible(false);

    if (result === "granted") {
      subscribeToPush().catch((err) => {
        console.error("[push] subscribe failed:", err);
      });
    }
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        backgroundColor: "var(--color-dark)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: "0 16px 40px oklch(0 0 0 / 0.5)",
        maxWidth: "calc(100vw - 48px)",
        width: "380px",
      }}
    >
      <span style={{ fontSize: "20px", flexShrink: 0 }}>&#128276;</span>
      <p
        style={{
          margin: 0,
          color: "var(--color-text)",
          fontSize: "13px",
          fontFamily: "var(--font-body)",
          flex: 1,
          lineHeight: 1.5,
        }}
      >
        새 알림을 데스크탑에서 바로 받으세요.
      </p>
      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleAllow}
          style={{
            backgroundColor: "var(--color-accent)",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            fontWeight: "600",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          허용
        </button>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: "transparent",
            color: "var(--color-dim)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "6px 10px",
            fontSize: "12px",
            fontFamily: "var(--font-body)",
            cursor: "pointer",
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
}
