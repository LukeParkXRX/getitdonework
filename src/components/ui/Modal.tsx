// Modal 컴포넌트 — 포커스 트랩 및 접근성(aria) 지원
"use client";

import { useEffect, useCallback, useRef, useId } from "react";
import { createPortal } from "react-dom";

type ModalSize = "sm" | "md" | "lg";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
}

const sizeWidths: Record<ModalSize, string> = {
  sm: "400px",
  md: "560px",
  lg: "720px",
};

// 포커스 가능한 요소를 찾기 위한 셀렉터
const FOCUSABLE_SELECTOR =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export function Modal({ isOpen, onClose, title, size = "md", children }: ModalProps) {
  // useId()로 고유 ID 생성 — 다중 모달 충돌 방지
  const uniqueId = useId();
  const titleId = `modal-title-${uniqueId}`;

  // 모달 패널 ref (포커스 트랩 범위)
  const panelRef = useRef<HTMLDivElement>(null);
  // 모달 열기 전 포커스를 가지고 있던 요소 (닫을 때 복원용)
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 모달 내 포커스 가능한 요소 목록 가져오기
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!panelRef.current) return [];
    return Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  }, []);

  // Escape 키로 모달 닫기 + Tab 키 포커스 트랩
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Tab 키 순환: 마지막 → 첫 번째, Shift+Tab 첫 번째 → 마지막
      if (e.key === "Tab") {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: 첫 번째 요소에서 뒤로 → 마지막 요소로
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: 마지막 요소에서 앞으로 → 첫 번째 요소로
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose, getFocusableElements]
  );

  useEffect(() => {
    if (!isOpen) return;

    // 모달 열릴 때: 현재 포커스 저장
    previousFocusRef.current = document.activeElement as HTMLElement;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // 약간의 딜레이 후 첫 번째 포커스 가능 요소로 이동
    // (Portal 렌더링 완료 후 DOM에 접근해야 하므로 requestAnimationFrame 사용)
    const raf = requestAnimationFrame(() => {
      const focusable = getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // 포커스 가능한 요소가 없으면 패널 자체에 포커스
        panelRef.current?.focus();
      }
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      cancelAnimationFrame(raf);

      // 모달 닫힐 때: 이전 포커스 복원
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown, getFocusableElements]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fade-in 0.2s ease forwards",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "oklch(0 0 0 / 0.6)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Panel — tabIndex={-1}은 포커스 가능 요소가 없을 때 패널 자체에 포커스하기 위함 */}
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: sizeWidths[size],
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          animation: "slide-up 0.25s var(--ease-out-expo) forwards",
          maxHeight: "calc(100vh - 48px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          outline: "none",
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 24px",
              borderBottom: "1px solid var(--color-border)",
              flexShrink: 0,
            }}
          >
            <h2
              id={titleId}
              style={{
                fontSize: "17px",
                fontWeight: 700,
                color: "var(--color-text)",
                fontFamily: "var(--font-display)",
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--color-dim)",
                cursor: "pointer",
                fontSize: "20px",
                lineHeight: 1,
                transition: "background-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-border)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-text)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--color-dim)";
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

export type { ModalProps, ModalSize };
