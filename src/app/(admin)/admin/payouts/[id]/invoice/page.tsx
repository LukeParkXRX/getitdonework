import { createServiceClient } from "@/lib/supabase/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PrintButton from "./PrintButton";

async function getAdminOrRedirect() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase as any)
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (me?.role !== "super_admin") redirect("/");
}

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getAdminOrRedirect();
  const { id } = await params;

  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    return (
      <div style={{ color: "var(--color-error, #ef4444)", padding: 32 }}>
        서비스 설정 오류: SUPABASE_SERVICE_ROLE_KEY를 확인하세요.
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  const { data: invoice } = await dbAny
    .from("invoices")
    .select(
      `id, enabler_id, period_start, period_end, total_credits, total_net,
       status, created_at,
       enabler:enabler_id ( id, full_name, email )`
    )
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const { data: earnings } = await dbAny
    .from("enabler_earnings")
    .select(
      `id, booking_id, credits_earned, fee_pct, net_amount, credit_rate,
       accrued_at,
       booking:booking_id ( id, type, scheduled_at )`
    )
    .eq("invoice_id", id)
    .order("accrued_at", { ascending: true });

  const enabler = invoice.enabler as {
    id: string;
    full_name: string;
    email: string;
  } | null;

  const rows = (earnings ?? []) as Array<{
    id: string;
    credits_earned: number;
    fee_pct: number;
    net_amount: number;
    credit_rate: number;
    accrued_at: string;
    booking: { id: string; type: string; scheduled_at: string } | null;
  }>;

  const invoiceNumber = `INV-${(invoice.id as string).slice(0, 8).toUpperCase()}`;
  const periodStart = invoice.period_start as string;
  const periodEnd = invoice.period_end as string;
  const totalNet = (invoice.total_net as number) ?? 0;
  const totalCredits = (invoice.total_credits as number) ?? 0;
  const totalGross = rows.reduce((acc, r) => acc + r.credits_earned * r.credit_rate, 0);
  const totalFee = totalGross - totalNet;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fff; color: #111; font-family: 'Helvetica Neue', Arial, sans-serif; }
        .invoice-wrap { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
        .header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #e5e7eb;
        }
        .company h1 { font-size: 22px; font-weight: 700; color: #111; }
        .company p { font-size: 13px; color: #6b7280; margin-top: 4px; line-height: 1.5; }
        .invoice-meta { text-align: right; }
        .invoice-meta .label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
        .invoice-meta .value { font-size: 15px; font-weight: 600; color: #111; margin-top: 2px; }
        .invoice-meta .status {
          display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px;
          font-size: 12px; font-weight: 600; background: #d1fae5; color: #065f46;
        }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 36px; }
        .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
        .party p { font-size: 14px; color: #111; line-height: 1.6; }
        .party .name { font-weight: 600; font-size: 15px; }
        .period-bar { background: #f3f4f6; border-radius: 8px; padding: 14px 20px; margin-bottom: 28px; font-size: 14px; color: #374151; }
        .period-bar strong { color: #111; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px; }
        thead th {
          background: #f9fafb; padding: 10px 12px; text-align: left;
          font-size: 11px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; color: #6b7280; border-bottom: 1px solid #e5e7eb;
        }
        thead th:last-child, tbody td:last-child, tfoot td:last-child { text-align: right; }
        tbody tr:nth-child(even) { background: #fafafa; }
        tbody td { padding: 10px 12px; color: #374151; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
        .type-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; background: #ede9fe; color: #5b21b6; }
        tfoot td { padding: 10px 12px; font-size: 13px; color: #374151; }
        tfoot .total-row td { font-weight: 700; font-size: 15px; color: #111; border-top: 2px solid #e5e7eb; padding-top: 14px; }
        .footer-note { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; line-height: 1.6; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .invoice-wrap { padding: 24px; }
        }
      `}</style>

      <div className="invoice-wrap">
        <div className="no-print">
          <PrintButton />
        </div>

        <div className="header">
          <div className="company">
            <h1>Get It Done at Work</h1>
            <p>
              getitdonework.com<br />
              luke@xrx.studio<br />
              [사업자 번호 플레이스홀더]
            </p>
          </div>
          <div className="invoice-meta">
            <div className="label">인보이스 번호</div>
            <div className="value">{invoiceNumber}</div>
            <div className="label" style={{ marginTop: 12 }}>발행일</div>
            <div className="value">
              {(invoice.created_at as string).slice(0, 10)}
            </div>
            <div>
              <span className="status">
                {invoice.status === "approved" ? "승인 완료" : String(invoice.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="parties">
          <div className="party">
            <h3>지급처 (Payer)</h3>
            <p className="name">Get It Done at Work</p>
            <p>getitdonework.com</p>
          </div>
          <div className="party">
            <h3>수취인 (Enabler)</h3>
            <p className="name">{enabler?.full_name ?? "—"}</p>
            <p>{enabler?.email ?? "—"}</p>
            <p>Stripe Connect 계정 연동</p>
          </div>
        </div>

        <div className="period-bar">
          정산 기간: <strong>{periodStart}</strong> ~ <strong>{periodEnd}</strong>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          총 크레딧: <strong>{totalCredits.toLocaleString()} credits</strong>
        </div>

        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>유형</th>
              <th>크레딧</th>
              <th>단가 (USD)</th>
              <th>수수료율</th>
              <th>정산액 (USD)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "24px 0" }}>
                  세션 내역 없음
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.accrued_at?.slice(0, 10) ?? "—"}</td>
                  <td>
                    <span className="type-badge">{r.booking?.type ?? "—"}</span>
                  </td>
                  <td>{r.credits_earned.toLocaleString()}</td>
                  <td>${r.credit_rate.toFixed(4)}</td>
                  <td>{(r.fee_pct * 100).toFixed(0)}%</td>
                  <td>${r.net_amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ textAlign: "right", color: "#6b7280" }}>소계 (Gross)</td>
              <td>${totalGross.toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={5} style={{ textAlign: "right", color: "#6b7280" }}>플랫폼 수수료</td>
              <td>- ${totalFee.toFixed(2)}</td>
            </tr>
            <tr className="total-row">
              <td colSpan={5} style={{ textAlign: "right" }}>최종 정산액 (Net)</td>
              <td>${totalNet.toFixed(2)} USD</td>
            </tr>
          </tfoot>
        </table>

        <div className="footer-note">
          본 인보이스는 Get It Done at Work 관리자 전용 문서입니다.
          Stripe Transfer를 통해 Enabler의 Connect 계정으로 송금됩니다.
          문의: luke@xrx.studio
        </div>
      </div>
    </>
  );
}
