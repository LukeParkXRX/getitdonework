"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type PayoutAccount = {
  user_id: string;
  stripe_account_id: string | null;
  status: "pending" | "incomplete" | "active" | "restricted" | "rejected";
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  bank_account_last4: string | null;
  bank_currency: string | null;
  bank_country: string | null;
  requirements_pending: string[] | null;
  tax_form_type?: "w9" | "w8ben" | "w8ben_e" | "none";
  tax_form_completed?: boolean;
  tax_form_url?: string | null;
} | null;

export type InvoiceSummary = {
  id: string;
  period_start: string;
  period_end: string;
  total_credits: number;
  total_net: number;
  status: string;
  created_at: string;
};

export type EarningsSummary = {
  accrued: number;
  invoiced: number;
  paid: number;
};

type Props = {
  account: PayoutAccount;
  invoices: InvoiceSummary[];
  earnings: EarningsSummary;
};

// ─── 스타일 상수 ──────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 12,
  padding: "24px",
  marginBottom: 20,
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "var(--color-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  marginBottom: 6,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "var(--font-display)",
  cursor: "pointer",
  border: "none",
  background: "var(--color-accent)",
  color: "var(--color-bg)",
};

const btnOutline: React.CSSProperties = {
  ...btn,
  background: "transparent",
  border: "1px solid var(--color-border)",
  color: "var(--color-text)",
};

function statusBadge(s: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pending", color: "var(--color-amber)", bg: "oklch(0.78 0.15 75 / 0.1)" },
    approved: { label: "Approved", color: "var(--color-green)", bg: "oklch(0.72 0.19 155 / 0.1)" },
    paid: { label: "Paid", color: "var(--color-accent)", bg: "var(--color-accent-dim, rgba(200,255,0,0.1))" },
    cancelled: { label: "Cancelled", color: "var(--color-muted)", bg: "rgba(107,114,128,0.1)" },
  };
  const cfg = map[s] ?? { label: s, color: "var(--color-muted)", bg: "transparent" };
  return (
    <span style={{
      padding: "2px 10px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

// Match the server-side conversion in page.tsx (KRW → USD at a fixed rate).
const DEFAULT_KRW_PER_USD = 1350;

function formatUsd(krw: number) {
  const usd = Number(krw) / DEFAULT_KRW_PER_USD;
  return "$" + usd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " USD";
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export default function PayoutsClient({ account, invoices, earnings }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tax Form States
  const [taxFormType, setTaxFormType] = useState<"w9" | "w8ben" | "w8ben_e" | "none">(
    account?.tax_form_type ?? "none"
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "US", business_type: "individual" }),
      });
      const json = await res.json() as { onboarding_url?: string; error?: string };
      if (!res.ok || !json.onboarding_url) {
        setError(json.error ?? "Failed to create account.");
        return;
      }
      window.location.href = json.onboarding_url;
    } catch {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account/onboarding-link", { method: "POST" });
      const json = await res.json() as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Failed to create onboarding link.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enabler/payout-account/refresh", { method: "POST" });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to refresh information.");
        return;
      }
      router.refresh();
    } catch {
      setError("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTaxFormSubmit() {
    if (taxFormType === "none") {
      setError("Please select a tax form type.");
      return;
    }
    if (!selectedFile && !account?.tax_form_url) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let fileUrl = account?.tax_form_url ?? null;

      if (selectedFile) {
        const supabase = createClient();
        
        // 1. Get current authenticated user id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Unauthorized");
          return;
        }

        // 2. Upload file to private 'tax-forms' bucket
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_tax_form.${fileExt}`;
        
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from("tax-forms")
          .upload(fileName, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadErr) {
          setError(`File upload failed: ${uploadErr.message}`);
          return;
        }

        // Save the raw storage path as tax_form_url
        fileUrl = uploadData.path;
      }

      // 3. Update database via PATCH API
      const res = await fetch("/api/enabler/payout-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tax_form_type: taxFormType,
          tax_form_url: fileUrl,
        }),
      });

      const json = await res.json() as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Failed to save tax form details.");
        return;
      }

      setSelectedFile(null);
      router.refresh();
    } catch (e) {
      setError("An error occurred while uploading the tax document.");
    } finally {
      setUploading(false);
    }
  }

  // Get private file url for downloading/viewing (Supabase Storage Signed URL or Direct download via client)
  async function handleDownloadTaxForm() {
    if (!account?.tax_form_url) return;
    try {
      const supabase = createClient();
      const { data, error: dlErr } = await supabase.storage
        .from("tax-forms")
        .createSignedUrl(account.tax_form_url, 60); // 60 seconds validity
      
      if (dlErr) {
        setError(`Failed to retrieve download link: ${dlErr.message}`);
        return;
      }
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch {
      setError("Failed to open document.");
    }
  }

  const accountStatus = account?.status ?? "pending";

  return (
    <div style={{ color: "var(--color-text)", fontFamily: "var(--font-body)", maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: "var(--font-display)", margin: 0 }}>
          Payouts
        </h1>
        <p style={{ fontSize: 14, color: "var(--color-muted)", marginTop: 6 }}>
          Receive payouts to your U.S. bank account via Stripe Connect.
        </p>
      </div>

      {/* 에러 */}
      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.4)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 20,
          fontSize: 14,
          color: "#ef4444",
        }}>
          {error}
        </div>
      )}

      {/* 상태 카드 */}
      <div style={card}>
        <div style={{ ...label }}>Payout account status</div>

        {/* pending / 계정 없음 — 결제 모듈 연동 전: 안내 + 버튼 비활성화 */}
        {(!account || accountStatus === "pending") && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "12px 0 16px" }}>
              No Stripe payout account is connected yet. Once you create one, you can receive payouts directly to your U.S. bank.
            </p>

            {/* 결제 모듈 연동 안내 (영문) */}
            <div
              style={{
                background: "var(--color-accent-dim)",
                border: "1px solid var(--color-accent)",
                borderRadius: 10,
                padding: "14px 16px",
                margin: "0 0 20px",
                fontSize: 13.5,
                lineHeight: 1.6,
                color: "var(--color-text)",
              }}
            >
              <strong style={{ color: "var(--color-accent)", fontFamily: "var(--font-display)" }}>
                Bank payouts are coming soon.
              </strong>
              <br />
              Our payout system (Stripe Connect) is being integrated and is pending
              payment-processor approval, which may take a few weeks. We&apos;ll announce
              availability separately. In the meantime, you can submit your tax documents
              below so your account is ready the moment payouts go live.
            </div>

            <button
              style={{ ...btn, opacity: 0.5, cursor: "not-allowed" }}
              disabled
              title="Coming soon — being integrated"
            >
              Create payout account (coming soon)
            </button>
          </div>
        )}

        {/* incomplete */}
        {accountStatus === "incomplete" && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-muted)", margin: "12px 0 8px" }}>
              Onboarding isn't complete. Provide the required items below to receive payouts.
            </p>
            {account?.requirements_pending && account.requirements_pending.length > 0 && (
              <ul style={{ margin: "8px 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--color-muted)" }}>
                {account.requirements_pending.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <button style={btn} onClick={handleContinue} disabled={loading}>
              {loading ? "Processing..." : "Continue onboarding"}
            </button>
          </div>
        )}

        {/* active */}
        {accountStatus === "active" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", background: "var(--color-green)",
                display: "inline-block",
              }} />
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--color-green)" }}>Payout account active</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16, marginBottom: 20 }}>
              <div>
                <div style={label}>Bank country</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{account?.bank_country ?? "-"}</div>
              </div>
              <div>
                <div style={label}>Account last 4</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                  {account?.bank_account_last4 ? `****${account.bank_account_last4}` : "-"}
                </div>
              </div>
              <div>
                <div style={label}>Currency</div>
                <div style={{ fontSize: 15, fontWeight: 600, textTransform: "uppercase" }}>
                  {account?.bank_currency ?? "-"}
                </div>
              </div>
            </div>
            <button style={btnOutline} onClick={handleRefresh} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh info"}
            </button>
          </div>
        )}

        {/* restricted / rejected */}
        {(accountStatus === "restricted" || accountStatus === "rejected") && (
          <div>
            <p style={{ fontSize: 15, color: "var(--color-red)", margin: "12px 0 12px" }}>
              {accountStatus === "rejected"
                ? "Your payout account was rejected. Please contact support."
                : "Your payout account is restricted. Stripe is requesting additional information."}
            </p>
            {account?.requirements_pending && account.requirements_pending.length > 0 && (
              <ul style={{ margin: "0 0 16px", paddingLeft: 20, fontSize: 13, color: "var(--color-muted)" }}>
                {account.requirements_pending.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            {accountStatus === "restricted" && (
              <button style={btn} onClick={handleContinue} disabled={loading}>
                {loading ? "Processing..." : "Resolve on Stripe"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 세무 서류 업로드 카드 */}
      <div style={card}>
        <div style={{ ...label }}>Submit tax documents (W-9 / W-8BEN)</div>
        <p style={{ fontSize: 14, color: "var(--color-muted)", margin: "8px 0 16px" }}>
          U.S. payouts and tax reporting require a tax form. Upload your completed form as a PDF or image file.
        </p>

        {/* 세무 서식 다운로드 링크 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 13 }}>
          <a href="https://www.irs.gov/pub/irs-pdf/fw9.pdf" target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline", fontWeight: 600 }}>
            📥 Download IRS W-9 (U.S. person/entity)
          </a>
          <a href="https://www.irs.gov/pub/irs-pdf/fw8ben.pdf" target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)", textDecoration: "underline", fontWeight: 600 }}>
            📥 Download IRS W-8BEN (non-U.S. individual)
          </a>
        </div>

        {/* 양식 유형 선택 라디오 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...label, fontSize: 11, marginBottom: 8 }}>Select tax form type</div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {([
              { value: "w9", label: "W-9 (US Citizen/Entity)" },
              { value: "w8ben", label: "W-8BEN (Foreign Individual)" },
              { value: "w8ben_e", label: "W-8BEN-E (Foreign Entity)" },
            ] as const).map((t) => (
              <label key={t.value} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input
                  type="radio"
                  name="taxFormType"
                  value={t.value}
                  checked={taxFormType === t.value}
                  onChange={() => setTaxFormType(t.value)}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>

        {/* 파일 업로드 UI */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              style={{
                fontSize: 13,
                color: "var(--color-muted)",
              }}
            />
            {account?.tax_form_url && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-green)",
                  background: "oklch(0.72 0.19 155 / 0.1)",
                }}>
                  Submitted ✓ ({account.tax_form_type?.toUpperCase()})
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTaxForm}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontSize: 12,
                    textDecoration: "underline",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  View uploaded file
                </button>
              </div>
            )}
          </div>

          <button
            style={{
              ...btn,
              marginLeft: "auto",
              opacity: uploading ? 0.7 : 1,
              cursor: uploading ? "not-allowed" : "pointer"
            }}
            onClick={handleTaxFormSubmit}
            disabled={uploading || taxFormType === "none"}
          >
            {uploading ? "Uploading..." : "Upload & submit"}
          </button>
        </div>
      </div>

      {/* 누적 수익 */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 16 }}>Total earnings (USD)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {([
            { key: "accrued", title: "Accrued", value: earnings.accrued, color: "var(--color-text)" },
            { key: "invoiced", title: "Invoiced", value: earnings.invoiced, color: "var(--color-amber)" },
            { key: "paid", title: "Paid", value: earnings.paid, color: "var(--color-green)" },
          ] as const).map(({ key, title, value, color }) => (
            <div key={key}>
              <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>
                ${value.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 정산 인보이스 */}
      <div style={card}>
        <div style={{ ...label, marginBottom: 16 }}>Recent payout invoices</div>
        {invoices.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
            No invoices yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoices.map((inv) => (
              <div key={inv.id} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "var(--color-bg)",
                borderRadius: 8,
                border: "1px solid var(--color-border)",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(inv.period_start)} ~ {formatDate(inv.period_end)}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>
                    {Number(inv.total_credits).toLocaleString("en-US")} credits · {formatUsd(inv.total_net)}
                  </div>
                </div>
                {statusBadge(inv.status)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
