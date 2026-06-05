"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/db/types";
import { ROLE_HOME } from "@/lib/auth/roles";

const INDUSTRY_OPTIONS = [
  "SaaS / B2B 소프트웨어",
  "핀테크",
  "헬스케어",
  "이커머스",
  "딥테크 / AI",
  "콘텐츠 / 미디어",
  "제조 / 하드웨어",
  "기타",
];

const INDUSTRY_LABEL_KEYS: Record<string, string> = {
  "SaaS / B2B 소프트웨어": "industrySaas",
  "핀테크": "industryFintech",
  "헬스케어": "industryHealthcare",
  "이커머스": "industryEcommerce",
  "딥테크 / AI": "industryDeeptech",
  "콘텐츠 / 미디어": "industryContent",
  "제조 / 하드웨어": "industryManufacturing",
  "기타": "industryOther",
};

const STAGE_OPTIONS = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B+" },
  { value: "growth", label: "Growth" },
];

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  color: "var(--color-dim)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--color-border)",
  backgroundColor: "oklch(0.14 0.005 280 / 0.5)",
  color: "var(--color-text)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
  outline: "none",
  boxSizing: "border-box",
};

// ── Startup Form ──────────────────────────────────────────────────────────────

function StartupProfileForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const t = useTranslations("OnboardingProfile");
  const toast = useToast();
  const [industries, setIndustries] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [usGoal, setUsGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleIndustry = (item: string) => {
    setIndustries((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const { error } = await db
        .from("startup_profiles")
        .update({ industry: industries, stage, us_goal: usGoal })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(t("saveSuccess"));
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* 산업군 */}
      <div>
        <label style={labelStyle}>{t("industryLabel")}</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {INDUSTRY_OPTIONS.map((item) => {
            const active = industries.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleIndustry(item)}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  fontWeight: active ? 600 : 400,
                  borderRadius: "9999px",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  backgroundColor: active ? "oklch(0.91 0.2 110 / 0.1)" : "transparent",
                  color: active ? "var(--color-accent)" : "var(--color-dim)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {t(INDUSTRY_LABEL_KEYS[item])}
              </button>
            );
          })}
        </div>
      </div>

      {/* 단계 */}
      <div>
        <label style={labelStyle}>{t("stageLabel")}</label>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
        >
          <option value="">{t("stagePlaceholder")}</option>
          {STAGE_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* 미국 진출 목표 */}
      <div>
        <label style={labelStyle}>{t("usGoalLabel")}</label>
        <textarea
          value={usGoal}
          onChange={(e) => setUsGoal(e.target.value)}
          placeholder={t("usGoalPlaceholder")}
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-accent)",
          color: "oklch(0.1 0 0)",
          fontSize: "14px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}

// ── Enabler Form ──────────────────────────────────────────────────────────────

function EnablerProfileForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const t = useTranslations("OnboardingProfile");
  const toast = useToast();
  const [degree, setDegree] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (bio.trim().length < 50) {
      toast.error(t("bioMinError"));
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;
      const specialtyArray = specialties
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const { error } = await db
        .from("enabler_profiles")
        .update({
          degree_type: degree,
          specialties: specialtyArray,
          location,
          bio,
        })
        .eq("user_id", userId);
      if (error) throw error;
      toast.success(t("saveSuccess"));
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <label style={labelStyle}>{t("degreeLabel")}</label>
        <input
          type="text"
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
          placeholder={t("degreePlaceholder")}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={labelStyle}>{t("specialtiesLabel")}</label>
        <input
          type="text"
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          placeholder={t("specialtiesPlaceholder")}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={labelStyle}>{t("locationLabel")}</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("locationPlaceholder")}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={labelStyle}>
          {t("bioLabel")}{" "}
          <span style={{ color: bio.length < 50 && bio.length > 0 ? "oklch(0.65 0.2 25)" : "var(--color-dim)", fontWeight: 400 }}>
            {t("bioCount", { count: bio.length })}
          </span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t("bioPlaceholder")}
          style={{ ...inputStyle, minHeight: "120px", resize: "vertical", lineHeight: 1.6 }}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-accent)",
          color: "oklch(0.1 0 0)",
          fontSize: "14px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}

// ── Org Admin Form ────────────────────────────────────────────────────────────

function OrgAdminProfileForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const t = useTranslations("OnboardingProfile");
  const toast = useToast();
  const [programName, setProgramName] = useState("");
  const [website, setWebsite] = useState("");
  const [intro, setIntro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any;

      // org_id 조회
      const { data: userRow } = await db
        .from("users")
        .select("org_id")
        .eq("id", userId)
        .single();

      if (userRow?.org_id) {
        const { error } = await db
          .from("organizations")
          .update({ program_name: programName, website, intro })
          .eq("id", userRow.org_id);
        if (error) throw error;
      }
      toast.success(t("saveSuccess"));
      onDone();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("saveError"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <label style={labelStyle}>{t("programNameLabel")}</label>
        <input
          type="text"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          placeholder={t("programNamePlaceholder")}
          style={inputStyle}
          required
        />
      </div>

      <div>
        <label style={labelStyle}>{t("websiteLabel")}</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://your-org.com"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>{t("introLabel")}</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder={t("introPlaceholder")}
          style={{ ...inputStyle, minHeight: "100px", resize: "vertical", lineHeight: 1.6 }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "14px 20px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-accent)",
          color: "oklch(0.1 0 0)",
          fontSize: "14px",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.65 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const ROLE_TITLE_KEYS: Record<string, string> = {
  startup: "titleStartup",
  enabler: "titleEnabler",
  org_admin: "titleOrgAdmin",
};

const ROLE_DESC_KEYS: Record<string, string> = {
  startup: "descStartup",
  enabler: "descEnabler",
  org_admin: "descOrgAdmin",
};

export default function OnboardingProfilePage() {
  const t = useTranslations("OnboardingProfile");
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // 역할 미선택 상태로 직접 진입 시 역할 선택 단계로 보냄 (ROLE_HOME[null] → undefined 푸시 방지)
  useEffect(() => {
    if (!loading && user && profile && !profile.role) {
      router.replace("/onboarding/role");
    }
  }, [loading, user, profile, router]);

  if (loading || !user || !profile || !profile.role) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "var(--color-black)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "var(--color-dim)", fontSize: "14px", fontFamily: "var(--font-body)" }}>
          {t("loading")}
        </div>
      </div>
    );
  }

  const role = profile.role as UserRole;
  const destination = ROLE_HOME[role];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-black)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 24px",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* 워드마크 */}
      <div style={{ marginBottom: "48px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--color-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Get It Done at Work
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* 스텝 인디케이터 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
            justifyContent: "center",
          }}
        >
          {[t("stepRole"), t("stepProfile")].map((step, i) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: i === 1 ? "var(--color-accent)" : "var(--color-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: i === 1 ? "oklch(0.1 0 0)" : "var(--color-dim)",
                  flexShrink: 0,
                }}
              >
                {i === 0 ? "✓" : "2"}
              </div>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: i === 1 ? "var(--color-text)" : "var(--color-dim)",
                }}
              >
                {step}
              </span>
              {i < 1 && (
                <div
                  style={{
                    width: "32px",
                    height: "1px",
                    backgroundColor: "var(--color-border)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 헤딩 */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "24px",
              color: "var(--color-text)",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "10px",
            }}
          >
            {ROLE_TITLE_KEYS[role] ? t(ROLE_TITLE_KEYS[role]) : t("titleFallback")}
          </h1>
          <p style={{ fontSize: "14px", color: "var(--color-dim)", lineHeight: 1.6 }}>
            {ROLE_DESC_KEYS[role] ? t(ROLE_DESC_KEYS[role]) : t("descFallback")}
          </p>
        </div>

        {/* 카드 */}
        <div
          style={{
            backgroundColor: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "28px",
            marginBottom: "20px",
          }}
        >
          {role === "startup" && (
            <StartupProfileForm userId={user.id} onDone={() => router.push(destination)} />
          )}
          {role === "enabler" && (
            <EnablerProfileForm userId={user.id} onDone={() => router.push(destination)} />
          )}
          {role === "org_admin" && (
            <OrgAdminProfileForm userId={user.id} onDone={() => router.push(destination)} />
          )}
        </div>

        {/* 나중에 하기 */}
        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => router.push(destination)}
            style={{
              fontSize: "13px",
              fontFamily: "var(--font-body)",
              color: "var(--color-dim)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {t("skipForNow")}
          </button>
        </div>
      </div>
    </div>
  );
}
