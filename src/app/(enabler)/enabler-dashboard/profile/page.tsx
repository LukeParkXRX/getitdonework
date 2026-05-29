import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbEnablerProfile, DbUser, CareerItem } from "@/lib/db/types";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function EnablerProfilePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // OAuth 프로바이더에서 받아온 아바타 URL (Google, GitHub 등)
  const rawMeta: unknown = user.user_metadata;
  let oauthAvatarUrl: string | null = null;
  if (rawMeta !== null && typeof rawMeta === "object") {
    const meta = rawMeta as Record<string, unknown>;
    const candidate = meta["avatar_url"] ?? meta["picture"];
    if (typeof candidate === "string" && candidate.length > 0) {
      oauthAvatarUrl = candidate;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: userRow } = await db
    .from("users")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single() as { data: Pick<DbUser, "full_name" | "avatar_url" | "role"> | null };

  const { data: enablerProfile } = await db
    .from("enabler_profiles")
    .select("university, degree_type, specialties, location, bio, credit_rate, career")
    .eq("user_id", user.id)
    .single() as {
      data: Pick<DbEnablerProfile, "university" | "degree_type" | "specialties" | "location" | "bio" | "credit_rate" | "career"> | null;
    };

  // enabler 또는 super_admin만 접근 허용
  const role = userRow?.role;
  if (role !== "enabler" && role !== "super_admin") redirect("/");

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--color-black)",
      color: "var(--color-text)",
      fontFamily: "var(--font-body)",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{
            fontSize: "13px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: "8px",
          }}>
            Enabler
          </p>
          <h1 style={{
            fontSize: "28px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
            marginBottom: "8px",
          }}>
            프로필 편집
          </h1>
          <p style={{ color: "var(--color-dim)", fontSize: "15px", lineHeight: 1.6, margin: 0 }}>
            스타트업에게 보여지는 프로필 정보를 업데이트하세요.
          </p>
        </div>

        <ProfileEditForm
          initial={{
            full_name: userRow?.full_name ?? "",
            avatar_url: userRow?.avatar_url ?? "",
            university: enablerProfile?.university ?? "",
            degree_type: enablerProfile?.degree_type ?? "",
            specialties: enablerProfile?.specialties ?? [],
            location: enablerProfile?.location ?? "",
            bio: enablerProfile?.bio ?? "",
            credit_rate: enablerProfile?.credit_rate ?? 1,
            career: (enablerProfile?.career as CareerItem[] | undefined) ?? [],
          }}
          oauthAvatarUrl={oauthAvatarUrl}
        />
      </div>
    </div>
  );
}
