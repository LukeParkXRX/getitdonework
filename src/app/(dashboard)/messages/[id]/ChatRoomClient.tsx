"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { DbMessage, DbUser } from "@/lib/db/types";

type Props = {
  conversationId: string;
  currentUserId: string;
  initialMessages: DbMessage[];
  otherUser: Pick<DbUser, "id" | "full_name" | "avatar_url">;
};

export default function ChatRoomClient({
  conversationId,
  currentUserId,
  initialMessages,
  otherUser,
}: Props) {
  const [messages, setMessages] = useState<DbMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayName = otherUser.full_name ?? "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  // 자동 스크롤
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // read 처리 (마운트 시)
  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" }).catch((err) => {
      console.error("[messages] mark-as-read failed:", err);
    });
  }, [conversationId]);

  // Supabase Realtime 구독
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as DbMessage;
          // 내가 보낸 메시지는 optimistic으로 이미 추가됨 — id 중복 방지
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // 상대방 메시지 수신 시 read 처리
          if (newMsg.sender_id !== currentUserId) {
            fetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" }).catch((err) => {
      console.error("[messages] mark-as-read failed:", err);
    });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  async function sendMessage() {
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    setInput("");

    // optimistic 추가
    const optimisticMsg: DbMessage = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        // 실패 시 optimistic 제거
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setInput(body);
      }
      // 성공 시 Realtime이 실제 메시지로 교체 (중복 체크로 처리됨)
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setInput(body);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        paddingTop: "56px",
        backgroundColor: "var(--color-dark)",
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 20px",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-dark)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/messages"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
            color: "var(--color-dim)",
            textDecoration: "none",
            fontSize: "16px",
            flexShrink: 0,
          }}
          aria-label="목록으로"
        >
          ←
        </Link>

        {otherUser.avatar_url ? (
          <Image
            src={otherUser.avatar_url}
            alt={displayName}
            width={36}
            height={36}
            style={{
              borderRadius: "50%",
              objectFit: "cover", flexShrink: 0,
              border: "1px solid var(--color-border)",
            }}
          />
        ) : (
          <span
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "var(--color-accent)", color: "oklch(0.1 0 0)",
              fontSize: "14px", fontWeight: "700", flexShrink: 0,
              fontFamily: "var(--font-display)",
            }}
          >
            {initial}
          </span>
        )}

        <span
          style={{
            fontSize: "15px", fontWeight: "600",
            color: "var(--color-text)", fontFamily: "var(--font-body)",
          }}
        >
          {displayName}
        </span>
      </div>

      {/* 메시지 리스트 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "var(--color-dim)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              marginTop: "40px",
            }}
          >
            첫 메시지를 보내보세요.
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          const isOptimistic = msg.id.startsWith("optimistic-");
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMine ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "70%",
                  padding: "10px 14px",
                  borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  backgroundColor: isMine ? "var(--color-accent)" : "var(--color-card)",
                  border: isMine ? "none" : "1px solid var(--color-border)",
                  opacity: isOptimistic ? 0.6 : 1,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: isMine ? "oklch(0.1 0 0)" : "var(--color-text)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {msg.body}
                </p>
              </div>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--color-dim)",
                  marginTop: "3px",
                  fontFamily: "var(--font-body)",
                }}
              >
                {formatTime(msg.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: "12px 16px",
          backgroundColor: "var(--color-dark)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            maxWidth: "860px",
            margin: "0 auto",
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지 입력... (Enter 전송, Shift+Enter 줄바꿈)"
            rows={1}
            maxLength={4000}
            style={{
              flex: 1,
              resize: "none",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-card)",
              color: "var(--color-text)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              lineHeight: "1.5",
              outline: "none",
              overflowY: "auto",
              maxHeight: "120px",
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = Math.min(el.scrollHeight, 120) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: input.trim() && !sending ? "var(--color-accent)" : "var(--color-border)",
              color: input.trim() && !sending ? "oklch(0.1 0 0)" : "var(--color-dim)",
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              flexShrink: 0,
              transition: "background-color 0.15s",
              fontSize: "18px",
            }}
            aria-label="전송"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
