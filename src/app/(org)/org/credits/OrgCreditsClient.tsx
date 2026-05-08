"use client";

import { useState } from "react";
import { useToast, Pagination } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────────────────────

type CreditStatus = "active" | "low" | "depleted";

type TxType =
  | "purchase"
  | "allocate"
  | "use"
  | "hold"
  | "confirm"
  | "release"
  | "refund"
  | "expire";

export type OrgInfo = {
  id: string;
  name: string;
  program_name: string;
  total_credits: number;
  invite_code: string;
};

export type MemberRow = {
  id: string;
  full_name: string | null;
  email: string;
};

export type ProfileRow = {
  user_id: string;
  company_name: string;
  credit_balance: number;
};

export type TxRow = {
  id: string;
  tx_type: string;
  amount: number;
  startup_id: string | null;
  enabler_id: string | null;
  booking_id: string | null;
  description: string;
  balance_after: number | null;
  created_at: string;
};

type Props = {
  org: OrgInfo;
  members: MemberRow[];
  profiles: ProfileRow[];
  txs: TxRow[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CreditStatus, { label: string; color: string }> = {
  active: { label: "정상", color: "var(--color-green)" },
  low: { label: "부족", color: "var(--color-amber)" },
  depleted: { label: "소진", color: "var(--color-red)" },
};

const TX_TYPE_LABEL: Partial<Record<TxType, string>> = {
  purchase: "구매",
  allocate: "배분",
  use: "사용",
  hold: "홀드",
  confirm: "확정",
  release: "반환",
  refund: "환불",
  expire: "만료",
};

const TX_TYPE_COLOR: Partial<Record<TxType, string>> = {
  purchase: "var(--color-blue)",
  allocate: "var(--color-green)",
  use: "var(--color-red)",
  hold: "var(--color-amber)",
  confirm: "var(--color-red)",
  release: "var(--color-green)",
  refund: "var(--color-amber)",
  expire: "var(--color-dim)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function ColLabel({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        fontSize: "14px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase" as const,
        color: "var(--color-dim)",
        padding: "10px 16px",
        textAlign: "left" as const,
        whiteSpace: "nowrap" as const,
        backgroundColor: "var(--color-dark)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {children}
    </th>
  );
}

function KpiCard({
  label,
  value,
  unit,
  sub,
  subColor,
  valueColor,
}: {
  label: string;
  value: number | string;
  unit?: string;
  sub?: string;
  subColor?: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <p
        style={{
          fontSize: "15px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-dim)",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "28px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          color: valueColor ?? "var(--color-text)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: "6px",
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: "16px",
              fontWeight: 500,
              color: "var(--color-dim)",
              marginLeft: "3px",
            }}
          >
            {unit}
          </span>
        )}
      </p>
      {sub && (
        <p
          style={{
            fontSize: "14px",
            fontFamily: "var(--font-body)",
            color: subColor ?? "var(--color-dim)",
            fontWeight: 500,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrgCreditsClient({
  org,
  members,
  profiles,
  txs,
}: Props) {
  const { info, error: showError } = useToast();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState("");
  const [allocateDesc, setAllocateDesc] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);
  const [txPage, setTxPage] = useState(1);
  const TX_PAGE_SIZE = 10;

  // 프로필 맵
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  // 스타트업 행 계산
  const startupRows = members.map((m) => {
    const profile = profileMap.get(m.id);
    const balance = profile?.credit_balance ?? 0;
    const name = profile?.company_name || m.full_name || m.email;

    // allocate 트랜잭션에서 이 멤버에게 배분된 총량
    const allocated = txs
      .filter((t) => t.tx_type === "allocate" && t.startup_id === m.id)
      .reduce((sum, t) => sum + t.amount, 0);

    // use/hold/confirm 트랜잭션에서 이 멤버가 사용한 총량
    const used = txs
      .filter(
        (t) =>
          (t.tx_type === "use" || t.tx_type === "confirm") &&
          t.startup_id === m.id
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    let status: CreditStatus = "active";
    if (balance <= 0) status = "depleted";
    else if (allocated > 0 && balance / allocated <= 0.2) status = "low";

    return { id: m.id, name, balance, allocated, used, status };
  });

  // KPI
  const totalAllocated = startupRows.reduce((sum, r) => sum + r.allocated, 0);
  const totalUsed = startupRows.reduce((sum, r) => sum + r.used, 0);
  const totalRemaining = org.total_credits - totalAllocated;
  const remainingPct = org.total_credits > 0 ? (totalRemaining / org.total_credits) * 100 : 100;
  const remainingColor =
    remainingPct > 20
      ? "var(--color-green)"
      : remainingPct > 5
        ? "var(--color-amber)"
        : "var(--color-red)";

  // 트랜잭션 페이지
  const sortedTxs = [...txs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const pagedTxs = sortedTxs.slice(
    (txPage - 1) * TX_PAGE_SIZE,
    txPage * TX_PAGE_SIZE
  );
  const txTotalPages = Math.ceil(sortedTxs.length / TX_PAGE_SIZE);

  function handleAllocateOpen(memberId: string) {
    setSelectedMemberId(memberId === selectedMemberId ? null : memberId);
    setAllocateAmount("");
    setAllocateDesc("");
  }

  async function handleAllocateConfirm(startupUserId: string) {
    const amount = Number(allocateAmount);
    if (!amount || amount <= 0 || amount > totalRemaining) return;

    setIsAllocating(true);
    try {
      const res = await fetch("/api/org/credits/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_user_id: startupUserId,
          amount,
          description: allocateDesc || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError(data.error ?? "배분 중 오류가 발생했습니다");
      } else {
        info("크레딧이 배분되었습니다. 페이지를 새로고침하세요.");
        setSelectedMemberId(null);
        setAllocateAmount("");
        setAllocateDesc("");
      }
    } catch {
      showError("네트워크 오류가 발생했습니다");
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        fontFamily: "var(--font-body)",
        padding: "28px 32px 56px",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--color-text)",
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              marginBottom: "4px",
            }}
          >
            크레딧 관리
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--color-dim)",
              fontFamily: "var(--font-body)",
              lineHeight: 1.4,
            }}
          >
            {org.name} · {org.program_name}
          </p>
        </div>

        <button
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            backgroundColor: "var(--color-accent)",
            border: "none",
            color: "oklch(0.1 0 0)",
            cursor: "pointer",
            transition: "opacity 0.15s",
            lineHeight: 1.4,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
          onClick={() => info("관리자에게 문의하여 크레딧을 구매하세요")}
        >
          크레딧 구매
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        <KpiCard
          label="총 크레딧"
          value={org.total_credits}
          unit="C"
          sub="프로그램 전체 구매량"
          subColor="var(--color-dim)"
        />
        <KpiCard
          label="배분 완료"
          value={totalAllocated}
          unit="C"
          sub={`${members.length}개 스타트업에 배분`}
          subColor="var(--color-blue)"
        />
        <KpiCard
          label="사용됨"
          value={totalUsed}
          unit="C"
          sub={
            totalAllocated > 0
              ? `사용률 ${Math.round((totalUsed / totalAllocated) * 100)}%`
              : "사용 없음"
          }
          subColor="var(--color-dim)"
        />
        <KpiCard
          label="잔여 (미배분)"
          value={totalRemaining}
          unit="C"
          sub={`전체의 ${Math.round(remainingPct)}%`}
          subColor={remainingColor}
          valueColor={remainingColor}
        />
      </div>

      {/* ── Credit Allocation Table ── */}
      <div
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text)",
              lineHeight: 1.3,
            }}
          >
            스타트업별 크레딧 배분 현황
          </p>
          <span
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
            }}
          >
            {members.length}개 스타트업
          </span>
        </div>

        {members.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-dim)",
              fontSize: "15px",
            }}
          >
            아직 등록된 멤버가 없어요.
            <br />
            초대 코드{" "}
            <strong style={{ color: "var(--color-accent)" }}>
              {org.invite_code}
            </strong>
            로 멤버를 초대하세요.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <ColLabel>스타트업</ColLabel>
                  <ColLabel>배분</ColLabel>
                  <ColLabel>사용</ColLabel>
                  <ColLabel>잔여</ColLabel>
                  <ColLabel>상태</ColLabel>
                  <ColLabel>액션</ColLabel>
                </tr>
              </thead>
              <tbody>
                {startupRows.map((row, i) => {
                  const status = STATUS_CONFIG[row.status];
                  const usagePct =
                    row.allocated > 0
                      ? Math.round((row.used / row.allocated) * 100)
                      : 0;
                  const isExpanded = selectedMemberId === row.id;

                  return (
                    <>
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: "1px solid var(--color-border)",
                          transition: "background-color 0.1s",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.backgroundColor =
                            "oklch(0.24 0.008 280 / 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLTableRowElement
                          ).style.backgroundColor = "transparent";
                        }}
                      >
                        {/* 스타트업 이름 + 진행바 */}
                        <td
                          style={{
                            padding: "14px 16px 10px",
                            minWidth: "160px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "15px",
                              fontFamily: "var(--font-body)",
                              fontWeight: 600,
                              color: "var(--color-text)",
                              marginBottom: "6px",
                              lineHeight: 1.3,
                            }}
                          >
                            {row.name}
                          </p>
                          <div
                            style={{
                              height: "4px",
                              borderRadius: "2px",
                              backgroundColor: "var(--color-border)",
                              overflow: "hidden",
                              width: "120px",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.min(usagePct, 100)}%`,
                                backgroundColor:
                                  usagePct >= 100
                                    ? "var(--color-red)"
                                    : usagePct >= 80
                                      ? "var(--color-amber)"
                                      : "var(--color-accent)",
                                borderRadius: "2px",
                                transition: "width 0.3s ease",
                              }}
                            />
                          </div>
                          <p
                            style={{
                              fontSize: "14px",
                              fontFamily: "var(--font-mono)",
                              color: "var(--color-dim)",
                              marginTop: "3px",
                              lineHeight: 1.3,
                            }}
                          >
                            {usagePct}% 사용
                          </p>
                        </td>

                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "15px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-dim)",
                            verticalAlign: "top",
                          }}
                        >
                          {row.allocated}C
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "15px",
                            fontFamily: "var(--font-mono)",
                            color: "var(--color-dim)",
                            verticalAlign: "top",
                          }}
                        >
                          {row.used}C
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: "15px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color:
                              row.balance <= 0
                                ? "var(--color-red)"
                                : row.balance <= 3
                                  ? "var(--color-amber)"
                                  : "var(--color-text)",
                            verticalAlign: "top",
                          }}
                        >
                          {row.balance}C
                        </td>
                        <td
                          style={{ padding: "14px 16px", verticalAlign: "top" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              fontSize: "14px",
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              color: status.color,
                            }}
                          >
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: status.color,
                                flexShrink: 0,
                              }}
                            />
                            {status.label}
                          </span>
                        </td>
                        <td
                          style={{ padding: "14px 16px", verticalAlign: "top" }}
                        >
                          <button
                            onClick={() => handleAllocateOpen(row.id)}
                            style={{
                              padding: "5px 11px",
                              borderRadius: "6px",
                              fontSize: "14px",
                              fontFamily: "var(--font-display)",
                              fontWeight: 600,
                              backgroundColor: "transparent",
                              border: isExpanded
                                ? "1px solid var(--color-accent)"
                                : "1px solid var(--color-border)",
                              color: isExpanded
                                ? "var(--color-accent)"
                                : "var(--color-text)",
                              cursor: "pointer",
                              transition: "all 0.15s",
                              lineHeight: 1.4,
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded) {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.borderColor =
                                  "oklch(0.91 0.2 110 / 0.5)";
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.color = "var(--color-accent)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isExpanded) {
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.borderColor = "var(--color-border)";
                                (
                                  e.currentTarget as HTMLButtonElement
                                ).style.color = "var(--color-text)";
                              }
                            }}
                          >
                            {isExpanded ? "닫기" : "추가 배분"}
                          </button>
                        </td>
                      </tr>

                      {/* Inline allocation form */}
                      {isExpanded && (
                        <tr
                          key={`${row.id}-form`}
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <td
                            colSpan={6}
                            style={{
                              padding: "0",
                              backgroundColor: "oklch(0.18 0.01 280 / 0.6)",
                            }}
                          >
                            <div
                              style={{
                                padding: "16px 20px",
                                borderLeft: "3px solid var(--color-accent)",
                              }}
                            >
                              <p
                                style={{
                                  fontSize: "14px",
                                  fontFamily: "var(--font-display)",
                                  fontWeight: 700,
                                  color: "var(--color-accent)",
                                  letterSpacing: "0.05em",
                                  textTransform: "uppercase",
                                  marginBottom: "12px",
                                }}
                              >
                                {row.name} — 추가 크레딧 배분
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <label
                                  style={{
                                    fontSize: "14px",
                                    fontFamily: "var(--font-body)",
                                    color: "var(--color-dim)",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  배분할 크레딧 수
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={totalRemaining}
                                  placeholder="0"
                                  value={allocateAmount}
                                  onChange={(e) =>
                                    setAllocateAmount(e.target.value)
                                  }
                                  style={{
                                    width: "96px",
                                    padding: "7px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-dark)",
                                    color: "var(--color-text)",
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    outline: "none",
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="사유 (선택)"
                                  value={allocateDesc}
                                  onChange={(e) =>
                                    setAllocateDesc(e.target.value)
                                  }
                                  style={{
                                    width: "180px",
                                    padding: "7px 10px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-dark)",
                                    color: "var(--color-text)",
                                    fontFamily: "var(--font-body)",
                                    fontSize: "14px",
                                    outline: "none",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontFamily: "var(--font-body)",
                                    color: "var(--color-dim)",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  (미배분 잔여: {totalRemaining}C)
                                </span>
                                <button
                                  onClick={() =>
                                    handleAllocateConfirm(row.id)
                                  }
                                  disabled={
                                    isAllocating ||
                                    !allocateAmount ||
                                    Number(allocateAmount) <= 0 ||
                                    Number(allocateAmount) > totalRemaining
                                  }
                                  style={{
                                    padding: "7px 14px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "var(--font-display)",
                                    fontWeight: 700,
                                    backgroundColor:
                                      isAllocating ||
                                      !allocateAmount ||
                                      Number(allocateAmount) <= 0 ||
                                      Number(allocateAmount) > totalRemaining
                                        ? "oklch(0.91 0.2 110 / 0.3)"
                                        : "var(--color-accent)",
                                    border: "none",
                                    color: "oklch(0.1 0 0)",
                                    cursor:
                                      isAllocating ||
                                      !allocateAmount ||
                                      Number(allocateAmount) <= 0 ||
                                      Number(allocateAmount) > totalRemaining
                                        ? "not-allowed"
                                        : "pointer",
                                    transition: "opacity 0.15s",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {isAllocating ? "처리 중..." : "확인"}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedMemberId(null);
                                    setAllocateAmount("");
                                    setAllocateDesc("");
                                  }}
                                  style={{
                                    padding: "7px 14px",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontFamily: "var(--font-display)",
                                    fontWeight: 600,
                                    backgroundColor: "transparent",
                                    border: "1px solid var(--color-border)",
                                    color: "var(--color-dim)",
                                    cursor: "pointer",
                                    transition:
                                      "border-color 0.15s, color 0.15s",
                                    lineHeight: 1.4,
                                  }}
                                  onMouseEnter={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.borderColor = "var(--color-text)";
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.color = "var(--color-text)";
                                  }}
                                  onMouseLeave={(e) => {
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.borderColor =
                                      "var(--color-border)";
                                    (
                                      e.currentTarget as HTMLButtonElement
                                    ).style.color = "var(--color-dim)";
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Transaction History ── */}
      <div
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <p
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--color-text)",
              lineHeight: 1.3,
            }}
          >
            거래 내역
          </p>
          <span
            style={{
              fontSize: "15px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
            }}
          >
            총 {txs.length}건
          </span>
        </div>

        {txs.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "var(--color-dim)",
              fontSize: "15px",
            }}
          >
            아직 거래 내역이 없어요.
          </div>
        ) : (
          <>
            <div style={{ padding: "4px 0" }}>
              {pagedTxs.map((tx, i) => {
                const txType = tx.tx_type as TxType;
                const typeLabel = TX_TYPE_LABEL[txType] ?? tx.tx_type;
                const typeColor =
                  TX_TYPE_COLOR[txType] ?? "var(--color-dim)";
                const isPositive = tx.amount > 0;

                return (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 20px",
                      borderBottom:
                        i < pagedTxs.length - 1
                          ? "1px solid var(--color-border)"
                          : "none",
                      transition: "background-color 0.1s",
                      gap: "12px",
                    }}
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor =
                        "oklch(0.24 0.008 280 / 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (
                        e.currentTarget as HTMLDivElement
                      ).style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-dim)",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {tx.created_at.slice(0, 10)}
                      </span>

                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "14px",
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          color: typeColor,
                          backgroundColor: `color-mix(in oklch, ${typeColor} 12%, transparent)`,
                          border: `1px solid color-mix(in oklch, ${typeColor} 25%, transparent)`,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {typeLabel}
                      </span>

                      <p
                        style={{
                          fontSize: "15px",
                          fontFamily: "var(--font-body)",
                          color: "var(--color-text)",
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {tx.description}
                      </p>
                    </div>

                    <span
                      style={{
                        fontSize: "16px",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 700,
                        color: isPositive
                          ? "var(--color-green)"
                          : "var(--color-red)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {tx.amount}C
                    </span>
                  </div>
                );
              })}
            </div>
            <Pagination
              currentPage={txPage}
              totalPages={txTotalPages}
              onPageChange={setTxPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
