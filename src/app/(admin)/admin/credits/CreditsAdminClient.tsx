"use client";

import { useState, useMemo } from "react";
import { Pagination, EmptyState } from "@/components/ui";
import { downloadCSV } from "@/lib/utils/csv-export";
import type { CreditTransactionType } from "@/types";

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
};

export default function CreditsAdminClient({ transactions, summary }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("전체");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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
            모든 크레딧 트랜잭션 내역을 확인하고 감사합니다.
          </p>
        </div>
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
    </div>
  );
}
