"use client";

import { useState, useMemo } from "react";
import { Pagination, EmptyState, Modal, useToast } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";
import type { CreditTransactionType } from "@/types";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

type FilterTab = "전체" | CreditTransactionType;

const FILTER_TABS: FilterTab[] = [
  "전체",
  "purchase",
  "allocate",
  "use",
  "hold",
  "confirm",
  "release",
  "refund",
  "expire",
];

const TX_BADGE: Record<
  CreditTransactionType,
  { label: string; bg: string; color: string }
> = {
  purchase: { label: "구매", bg: "oklch(0.35 0.1 145)", color: "oklch(0.85 0.18 145)" },
  allocate: { label: "배정", bg: "oklch(0.28 0.08 245)", color: "oklch(0.75 0.18 245)" },
  use:      { label: "사용", bg: "oklch(0.32 0.1 50)",  color: "oklch(0.82 0.18 50)"  },
  hold:     { label: "홀드", bg: "oklch(0.32 0.1 80)",  color: "oklch(0.82 0.15 80)"  },
  confirm:  { label: "확정", bg: "oklch(0.35 0.1 145)", color: "oklch(0.85 0.18 145)" },
  release:  { label: "반환", bg: "oklch(0.28 0.08 300)", color: "oklch(0.75 0.18 300)" },
  refund:   { label: "환불", bg: "oklch(0.30 0.1 15)",  color: "oklch(0.80 0.2 15)"   },
  expire:   { label: "만료", bg: "oklch(0.22 0.01 250)", color: "oklch(0.55 0.02 250)" },
};

export type TransactionRecord = {
  id: string;
  txType: CreditTransactionType;
  amount: number;
  startupName?: string;
  enablerName?: string;
  orgName?: string;
  bookingId?: string;
  description: string;
  createdAt: string;
};

export type CreditSummary = {
  totalCirculation: number;
  thisMonthUsed: number;
  thisMonthPurchased: number;
  thisMonthRefunded: number;
};

type Props = {
  transactions: TransactionRecord[];
  summary: CreditSummary;
  startups?: Array<{ id: string; full_name: string; email: string; credit_balance: number }>;
  organizations?: Array<{ id: string; name: string; total_credits: number }>;
};

export default function CreditsAdminClient({ transactions, summary, startups = [], organizations = [] }: Props) {
  const { success, error: toastError } = useToast();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<"startup" | "org">("startup");
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<FilterTab>("전체");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const selectedBalance = useMemo(() => {
    if (!selectedId) return null;
    if (targetType === "startup") {
      return startups.find((s) => s.id === selectedId)?.credit_balance ?? null;
    }
    return organizations.find((o) => o.id === selectedId)?.total_credits ?? null;
  }, [organizations, selectedId, startups, targetType]);

  const wouldOverdraw =
    selectedBalance !== null &&
    amount < 0 &&
    Math.abs(amount) > selectedBalance;

  const SUMMARY_CARDS = [
    { label: "총 유통 크레딧", value: summary.totalCirculation, suffix: "C" },
    { label: "이번 달 사용", value: summary.thisMonthUsed, suffix: "C" },
    { label: "이번 달 구매", value: summary.thisMonthPurchased, suffix: "C" },
    { label: "이번 달 환불", value: summary.thisMonthRefunded, suffix: "C" },
  ];

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (activeTab !== "전체") {
      list = list.filter((t) => t.txType === activeTab);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const org = t.orgName?.toLowerCase() ?? "";
        const startup = t.startupName?.toLowerCase() ?? "";
        return org.includes(q) || startup.includes(q);
      });
    }

    return list;
  }, [activeTab, search, transactions]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "32px 36px",
        background: "var(--color-black)",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 24,
              color: "var(--color-text)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            크레딧 거래 내역
          </h1>
          <p style={{ marginTop: 6, fontSize: 14, color: "var(--color-dim)", margin: "6px 0 0" }}>
            Stripe 공식 결제 전에는 여기에서 크레딧을 수동 지급하고 회수합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => {
              setAmount(1);
              setDescription("Stripe 인증 전 수동 지급");
              setModalOpen(true);
            }}
            style={{
              padding: "9px 18px",
              background: "var(--color-accent)",
              border: "none",
              borderRadius: 8,
              color: "var(--color-black)",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            크레딧 수동 지급/회수
          </button>
          <button
            onClick={() => {
              const headers = ["ID", "유형", "금액", "스타트업", "Enabler", "기관", "설명", "일시"];
              const csvRows = transactions.map((t) => [
                t.id,
                TX_BADGE[t.txType]?.label ?? t.txType,
                String(t.amount),
                t.startupName ?? "",
                t.enablerName ?? "",
                t.orgName ?? "",
                t.description,
                t.createdAt,
              ]);
              downloadCSV("credit_transactions", headers, csvRows);
            }}
            style={{
              padding: "9px 18px",
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-text)",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            CSV 내보내기
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.label}
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                color: "var(--color-dim)",
                marginBottom: 8,
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontSize: 28,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                color: "var(--color-text)",
                letterSpacing: "-0.02em",
              }}
            >
              {card.value.toLocaleString()}
              <span
                style={{ fontSize: 14, color: "var(--color-dim)", marginLeft: 4 }}
              >
                {card.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs + Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: "1px solid",
                  borderColor: isActive
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                  background: isActive
                    ? "rgba(123, 104, 238, 0.15)"
                    : "transparent",
                  color: isActive ? "var(--color-accent)" : "var(--color-dim)",
                  fontSize: 13,
                  fontFamily: "var(--font-body)",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {tab === "전체"
                  ? tab
                  : TX_BADGE[tab as CreditTransactionType].label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="기관명 또는 스타트업명 검색..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            background: "oklch(0.14 0.005 280 / 0.6)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: "8px 14px",
            fontSize: 14,
            fontFamily: "var(--font-body)",
            color: "var(--color-text)",
            outline: "none",
            width: 240,
          }}
        />
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "140px 90px 80px 120px 120px 110px 110px 1fr",
            padding: "10px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "oklch(0.12 0.005 280 / 0.4)",
          }}
        >
          {["일시", "유형", "금액", "기관", "스타트업", "Enabler", "예약 ID", "메모"].map(
            (col) => (
              <div
                key={col}
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                  color: "var(--color-dim)",
                }}
              >
                {col}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        {pageItems.length === 0 ? (
          <EmptyState title="트랜잭션이 없습니다" description="해당 조건에 맞는 크레딧 거래 내역이 없습니다." />
        ) : (
          pageItems.map((tx, idx) => {
            const badge = TX_BADGE[tx.txType];
            const isNeg = tx.amount < 0;
            return (
              <div
                key={tx.id}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "140px 90px 80px 120px 120px 110px 110px 1fr",
                  padding: "12px 20px",
                  borderBottom:
                    idx < pageItems.length - 1
                      ? "1px solid var(--color-border)"
                      : "none",
                  alignItems: "center",
                }}
              >
                {/* 일시 */}
                <div style={{ fontSize: 13, color: "var(--color-dim)" }}>
                  {new Date(tx.createdAt).toLocaleString("ko-KR", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* 유형 badge */}
                <div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 9px",
                      borderRadius: 5,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      letterSpacing: "0.04em",
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* 금액 */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    color: isNeg
                      ? "oklch(0.72 0.18 25)"
                      : "oklch(0.78 0.18 145)",
                  }}
                >
                  {isNeg ? "" : "+"}{tx.amount}C
                </div>

                {/* 기관 */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tx.orgName ?? "—"}
                </div>

                {/* 스타트업 */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tx.startupName ?? "—"}
                </div>

                {/* Enabler */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tx.enablerName ?? "—"}
                </div>

                {/* 예약 ID */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--color-dim)",
                    fontFamily: "var(--font-mono, monospace)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tx.bookingId ? `#${tx.bookingId.slice(0, 8).toUpperCase()}` : "—"}
                </div>

                {/* 메모 */}
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--color-dim)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={tx.description}
                >
                  {tx.description || "—"}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer: total + pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--color-dim)" }}>
          총{" "}
          <strong style={{ color: "var(--color-text)" }}>
            {filtered.length}
          </strong>
          건
        </span>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* 크레딧 발급/회수 모달 */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="크레딧 수동 지급 / 회수"
        size="sm"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedId) {
              toastError("대상을 선택해 주세요.");
              return;
            }
            if (amount === 0) {
              toastError("크레딧 금액은 0이 아니어야 합니다.");
              return;
            }
            if (wouldOverdraw) {
              toastError(`현재 잔액 ${selectedBalance}C보다 많이 회수할 수 없습니다.`);
              return;
            }

            setSubmitting(true);
            try {
              const res = await fetch("/api/admin/credits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  startup_id: targetType === "startup" ? selectedId : undefined,
                  org_id: targetType === "org" ? selectedId : undefined,
                  amount,
                  description: description || undefined,
                }),
              });

              if (res.ok) {
                success(`크레딧이 성공적으로 ${amount > 0 ? "발급" : "회수"}되었습니다.`);
                setModalOpen(false);
                setSelectedId("");
                setAmount(1);
                setDescription("");
                router.refresh();
              } else {
                const json = await res.json().catch(() => ({}));
                toastError(json.error ?? "크레딧 처리에 실패했습니다.");
              }
            } catch {
              toastError("네트워크 오류가 발생했습니다.");
            } finally {
              setSubmitting(false);
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* 대상 구분 라디오 */}
          <div>
            <label style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>지급 대상 구분</label>
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="targetType"
                  value="startup"
                  checked={targetType === "startup"}
                  onChange={() => { setTargetType("startup"); setSelectedId(""); setAmount(1); }}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                스타트업 개인
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="targetType"
                  value="org"
                  checked={targetType === "org"}
                  onChange={() => { setTargetType("org"); setSelectedId(""); setAmount(1); }}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                기관 (Organization)
              </label>
            </div>
          </div>

          {/* 대상 선택 select */}
          <div>
            <label style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>대상 선택</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
              style={{
                width: "100%",
                background: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-text)",
                outline: "none",
              }}
            >
              <option value="">-- 선택하세요 --</option>
              {targetType === "startup"
                ? startups?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.email}) · 보유 {s.credit_balance}C
                    </option>
                  ))
                : organizations?.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} · 보유 {o.total_credits}C
                    </option>
                  ))}
            </select>
            {selectedBalance !== null && (
              <p style={{ fontSize: 12, color: "var(--color-dim)", marginTop: 6 }}>
                현재 잔액: {selectedBalance.toLocaleString()}C
              </p>
            )}
          </div>

          {/* 크레딧 수량 */}
          <div>
            <label style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>
              크레딧 금액 (회수는 음수 입력 예: -3)
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              {[1, 2, 5, 10, -1].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setAmount(quickAmount)}
                  style={{
                    minWidth: 48,
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: quickAmount === amount
                      ? "1px solid var(--color-accent)"
                      : "1px solid var(--color-border)",
                    background: quickAmount === amount
                      ? "color-mix(in oklch, var(--color-accent) 16%, transparent)"
                      : "transparent",
                    color: quickAmount > 0 ? "var(--color-text)" : "var(--color-red, #ef4444)",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {quickAmount > 0 ? `+${quickAmount}` : quickAmount}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="예: 1 또는 -1"
              required
              style={{
                width: "100%",
                background: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-text)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: wouldOverdraw ? "oklch(0.72 0.18 25)" : "var(--color-dim)",
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              양수는 지급, 음수는 회수입니다. 회수 금액은 현재 잔액보다 클 수 없습니다.
            </p>
          </div>

          {/* 메모 */}
          <div>
            <label style={{ fontSize: 13, color: "var(--color-dim)", display: "block", marginBottom: 6 }}>사유 및 메모</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: Stripe 인증 전 수동 지급"
              style={{
                width: "100%",
                background: "var(--color-dark)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 14,
                color: "var(--color-text)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* 버튼 제출 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-dim)",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || wouldOverdraw}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                background: "var(--color-accent)",
                color: "var(--color-black)",
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting || wouldOverdraw ? "not-allowed" : "pointer",
                opacity: submitting || wouldOverdraw ? 0.55 : 1,
              }}
            >
              {submitting ? "처리 중..." : "확인"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
