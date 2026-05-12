import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import Link from "next/link";

interface UnsubscribePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-dark)",
          fontFamily: "var(--font-body)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "40px 32px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-red)", fontSize: 16, marginBottom: 16 }}>
            유효하지 않은 링크입니다.
          </p>
          <Link
            href="/"
            style={{
              color: "var(--color-accent)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const userId = verifyUnsubscribeToken(token);

  if (!userId) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-dark)",
          fontFamily: "var(--font-body)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "40px 32px",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 16,
            textAlign: "center",
          }}
        >
          <p style={{ color: "var(--color-red)", fontSize: 16, marginBottom: 16 }}>
            링크가 만료됐거나 유효하지 않습니다.
          </p>
          <Link
            href="/settings"
            style={{
              color: "var(--color-accent)",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            설정에서 직접 변경하기
          </Link>
        </div>
      </main>
    );
  }

  // service role로 upsert (인증 불필요)
  let db: ReturnType<typeof createServiceClient>;
  try {
    db = createServiceClient();
  } catch {
    redirect("/");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbAny = db as any;

  await dbAny.from("email_unsubscribes").upsert(
    { user_id: userId, unsubscribed_at: new Date().toISOString() },
    { onConflict: "user_id", ignoreDuplicates: true }
  );

  // notification_prefs.marketing = false 동시 처리
  const { data: userRow } = await dbAny
    .from("users")
    .select("notification_prefs")
    .eq("id", userId)
    .maybeSingle();

  if (userRow) {
    const prefs = (userRow as { notification_prefs: Record<string, boolean> | null })
      .notification_prefs ?? {};
    await dbAny
      .from("users")
      .update({ notification_prefs: { ...prefs, marketing: false } })
      .eq("id", userId);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-dark)",
        fontFamily: "var(--font-body)",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          padding: "40px 32px",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "oklch(0.75 0.2 140 / 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 24,
          }}
        >
          &#10003;
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text)",
            margin: "0 0 12px",
          }}
        >
          수신 거부 완료
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-dim)",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          마케팅 이메일 수신 거부가 처리됐습니다.
          <br />
          다시 받으시려면{" "}
          <Link
            href="/settings"
            style={{ color: "var(--color-accent)", textDecoration: "none" }}
          >
            설정
          </Link>
          에서 활성화하세요.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 8,
            backgroundColor: "var(--color-accent)",
            color: "var(--color-black)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
