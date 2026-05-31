import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DbConversation } from "@/lib/db/types";

type OtherUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type ConversationWithOther = DbConversation & {
  other_user: OtherUser;
};

export async function generateMetadata() {
  const t = await getTranslations("MessagesPage");
  return { title: t("metaTitle") };
}

export default async function MessagesPage() {
  const t = await getTranslations("MessagesPage");
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: rows } = await db
    .from("conversations")
    .select("*")
    .or(`startup_id.eq.${user.id},enabler_id.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const conversations: DbConversation[] = rows ?? [];

  const otherIds = conversations.map((c: DbConversation) =>
    c.startup_id === user.id ? c.enabler_id : c.startup_id
  );
  const uniqueOtherIds = [...new Set(otherIds)];
  const userMap = new Map<string, OtherUser>();

  if (uniqueOtherIds.length > 0) {
    const { data: usersData } = await db
      .from("users")
      .select("id, full_name, avatar_url")
      .in("id", uniqueOtherIds);
    (usersData ?? []).forEach((u: OtherUser) => {
      userMap.set(u.id, u);
    });
  }

  const list: ConversationWithOther[] = conversations.map((c: DbConversation) => {
    const otherId = c.startup_id === user.id ? c.enabler_id : c.startup_id;
    return {
      ...c,
      other_user: userMap.get(otherId) ?? { id: otherId, full_name: null, avatar_url: null },
    };
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--color-dark)",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "var(--color-text)",
            fontFamily: "var(--font-display)",
            marginBottom: "24px",
          }}
        >
          {t("title")}
        </h1>

        {list.length === 0 ? (
          <div
            style={{
              padding: "64px 24px",
              textAlign: "center",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p style={{ color: "var(--color-dim)", fontSize: "15px", fontFamily: "var(--font-body)" }}>
              {t("emptyTitle")}
            </p>
            <p style={{ color: "var(--color-dim)", fontSize: "13px", fontFamily: "var(--font-body)", marginTop: "8px" }}>
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "2px" }}>
            {list.map((conv) => {
              const other = conv.other_user;
              const displayName = other.full_name ?? "Unknown";
              const initial = displayName.charAt(0).toUpperCase();
              const timeStr = conv.last_message_at
                ? new Date(conv.last_message_at).toLocaleString("ko-KR", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })
                : "";

              return (
                <li key={conv.id}>
                  <Link
                    href={`/messages/${conv.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "14px 16px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      textDecoration: "none",
                      transition: "background-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-border)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "var(--color-card)";
                    }}
                  >
                    {other.avatar_url ? (
                      <Image
                        src={other.avatar_url}
                        alt={displayName}
                        width={40}
                        height={40}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover", flexShrink: 0,
                          border: "1px solid var(--color-border)",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "40px", height: "40px", borderRadius: "50%",
                          backgroundColor: "var(--color-accent)", color: "oklch(0.1 0 0)",
                          fontSize: "15px", fontWeight: "700", flexShrink: 0,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {initial}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0, fontSize: "14px", fontWeight: "600",
                        color: "var(--color-text)", fontFamily: "var(--font-body)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {displayName}
                      </p>
                      {conv.last_message_preview && (
                        <p style={{
                          margin: "2px 0 0", fontSize: "13px", color: "var(--color-dim)",
                          fontFamily: "var(--font-body)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {conv.last_message_preview}
                        </p>
                      )}
                    </div>
                    {timeStr && (
                      <span style={{
                        fontSize: "11px", color: "var(--color-dim)", whiteSpace: "nowrap",
                        fontFamily: "var(--font-body)", flexShrink: 0,
                      }}>
                        {timeStr}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
