import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbEnablerProfile, CareerItem } from "@/lib/db/types";
import { NextResponse } from "next/server";

type PatchBody = Partial<Pick<
  DbEnablerProfile,
  "university" | "degree_type" | "specialties" | "location" | "bio" | "credit_rate" | "career"
>>;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function sanitizeCareer(raw: unknown): CareerItem[] | null {
  if (!Array.isArray(raw)) return null;
  const result: CareerItem[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const company = typeof item["company"] === "string" ? item["company"].trim() : "";
    if (!company) continue; // company 빈 항목 제외
    result.push({
      company,
      title: typeof item["title"] === "string" ? item["title"].trim() : "",
      period: typeof item["period"] === "string" ? item["period"].trim() : "",
      description: typeof item["description"] === "string" ? item["description"].trim() : "",
    });
  }
  return result;
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as PatchBody;

    const { university, degree_type, specialties, location, bio, credit_rate, career } = body;

    // credit_rate 검증: 1 이상 정수
    if (credit_rate !== undefined) {
      if (!Number.isInteger(credit_rate) || credit_rate < 1) {
        return NextResponse.json({ error: "credit_rate는 1 이상의 정수여야 합니다." }, { status: 400 });
      }
    }

    // specialties 검증: 배열 + 문자열만
    if (specialties !== undefined) {
      if (!Array.isArray(specialties) || specialties.some((s) => typeof s !== "string")) {
        return NextResponse.json({ error: "specialties는 문자열 배열이어야 합니다." }, { status: 400 });
      }
    }

    // bio 검증: 500~2000자
    if (bio !== undefined) {
      const trimmedBio = bio.trim();
      if (trimmedBio.length < 500 || trimmedBio.length > 2000) {
        return NextResponse.json({ error: "자기소개는 500자 이상 2000자 이하로 작성해 주세요." }, { status: 400 });
      }
    }

    // career 검증 및 화이트리스트 추출
    let sanitizedCareer: CareerItem[] | undefined;
    if (career !== undefined) {
      const result = sanitizeCareer(career);
      if (result === null) {
        return NextResponse.json({ error: "career는 배열이어야 합니다." }, { status: 400 });
      }
      sanitizedCareer = result;
    }

    const { data, error } = await db
      .from("enabler_profiles")
      .update({
        ...(university !== undefined && { university }),
        ...(degree_type !== undefined && { degree_type }),
        ...(specialties !== undefined && { specialties }),
        ...(location !== undefined && { location }),
        ...(bio !== undefined && { bio }),
        ...(credit_rate !== undefined && { credit_rate }),
        ...(sanitizedCareer !== undefined && { career: sanitizedCareer }),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data as DbEnablerProfile });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
