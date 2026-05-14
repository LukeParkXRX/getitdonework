/**
 * GET /api/admin/payouts/[id]/pdf
 * super_admin 또는 해당 enabler 본인 → 인보이스 PDF 다운로드
 */

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { jsx as _jsx } from "react/jsx-runtime";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { InvoicePdf } from "@/lib/pdf/InvoicePdf";
import type { InvoicePdfData } from "@/lib/pdf/InvoicePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 인증
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userSupabase = supabase as any;
    const { data: me } = await userSupabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // service client
    let db: ReturnType<typeof createServiceClient>;
    try {
      db = createServiceClient();
    } catch {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;

    // invoice + enabler 정보 조회
    const { data: invoice, error: invErr } = await dbAny
      .from("invoices")
      .select(
        `id, enabler_id, period_start, period_end,
         total_credits, total_net, total_net_usd,
         status, created_at,
         enabler:enabler_id ( id, full_name, email )`
      )
      .eq("id", id)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 권한 확인: super_admin 또는 해당 enabler 본인
    const isSuperAdmin = me?.role === "super_admin";
    const isOwner = invoice.enabler_id === user.id;
    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // earnings 조회
    const { data: earningsRaw, error: earnErr } = await dbAny
      .from("enabler_earnings")
      .select("credits_earned, fee_pct, net_amount, credit_rate, accrued_at")
      .eq("invoice_id", id)
      .order("accrued_at", { ascending: true });

    if (earnErr) {
      return NextResponse.json({ error: earnErr.message }, { status: 500 });
    }

    const enablerName =
      (Array.isArray(invoice.enabler)
        ? invoice.enabler[0]?.full_name
        : invoice.enabler?.full_name) ?? "Enabler";
    const enablerEmail =
      (Array.isArray(invoice.enabler)
        ? invoice.enabler[0]?.email
        : invoice.enabler?.email) ?? "";

    // earnings → PDF 행 변환
    const earnings = (earningsRaw ?? []).map((e: {
      credits_earned: number;
      fee_pct: number;
      net_amount: number;
      credit_rate: number;
      accrued_at: string;
    }) => {
      const tokens = Number(e.credits_earned);
      const rate = Number(e.credit_rate) || 1;
      const grossUsd = tokens * rate;
      const netUsd = Number(e.net_amount);
      return {
        date: new Date(e.accrued_at).toISOString().slice(0, 10),
        tokens,
        usd: grossUsd,
        net: netUsd,
      };
    });

    // 합계 계산
    const totalGrossUsd = earnings.reduce((s: number, r: { usd: number }) => s + r.usd, 0);
    const totalNetUsd =
      invoice.total_net_usd != null
        ? Number(invoice.total_net_usd)
        : earnings.reduce((s: number, r: { net: number }) => s + r.net, 0);
    const totalFeeUsd = totalGrossUsd - totalNetUsd;

    // 대표 fee_pct (첫 행 기준, 없으면 0)
    const feePct =
      earningsRaw && earningsRaw.length > 0 ? Number(earningsRaw[0].fee_pct) : 0;

    const pdfData: InvoicePdfData = {
      invoiceNumber: invoice.id,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      enablerName,
      enablerEmail,
      earnings,
      totalGrossUsd,
      totalFeeUsd,
      totalNetUsd,
      feePct,
      status: invoice.status,
    };

    // PDF 생성 — _jsx()로 생성해 renderToBuffer에 전달
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = _jsx(InvoicePdf, { data: pdfData }) as any;
    const buffer = await renderToBuffer(element);

    const safeId = invoice.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${safeId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
