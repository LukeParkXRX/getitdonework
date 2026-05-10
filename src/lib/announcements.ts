import { sendEmail } from "@/lib/email";
import { announcementEmail } from "@/lib/emails/templates/announcement";
import { logAdminAction } from "@/lib/admin-audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDB = any;

type UserRow = {
  id: string;
  full_name: string | null;
  email: string;
};

// audience에 따라 수신자 목록 조회
async function fetchRecipients(db: AnyDB, announcement: AnyDB): Promise<UserRow[]> {
  const { audience, audience_target_id, target_user_ids } = announcement;

  let query = db.from("users").select("id, full_name, email");

  switch (audience) {
    case "all":
      break;
    case "startups":
      query = query.eq("role", "startup");
      break;
    case "enablers":
      query = query.eq("role", "enabler");
      break;
    case "org_admins":
      query = query.eq("role", "org_admin");
      break;
    case "super_admins":
      query = query.eq("role", "super_admin");
      break;
    case "org":
      if (!audience_target_id) return [];
      query = query.eq("org_id", audience_target_id);
      break;
    case "specific_users":
      if (!target_user_ids || target_user_ids.length === 0) return [];
      query = query.in("id", target_user_ids);
      break;
    default:
      return [];
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchRecipients error", error);
    return [];
  }
  return (data ?? []) as UserRow[];
}

// 공지 발송 핵심 로직 — route.ts와 send/route.ts 양쪽에서 재사용
export async function sendAnnouncementToRecipients(
  db: AnyDB,
  announcementId: string,
  actorId: string
): Promise<{ status: string; recipient_count: number; sent_count: number; failed_count: number }> {
  // 1. 공지 조회
  const { data: announcement, error: fetchError } = await db
    .from("announcements")
    .select("*")
    .eq("id", announcementId)
    .maybeSingle();

  if (fetchError || !announcement) {
    throw new Error("공지를 찾을 수 없습니다");
  }
  if (announcement.status !== "draft") {
    throw new Error(`발송 불가 상태: ${announcement.status}`);
  }

  // 2. sending 상태로 변경
  await db
    .from("announcements")
    .update({ status: "sending" })
    .eq("id", announcementId);

  // 3. 수신자 목록
  const recipients = await fetchRecipients(db, announcement);
  const recipientCount = recipients.length;

  await db
    .from("announcements")
    .update({ recipient_count: recipientCount })
    .eq("id", announcementId);

  let sentCount = 0;
  let failedCount = 0;

  const channel: string = announcement.channel;

  // 4-A. in_app 알림 일괄 INSERT
  if (channel === "in_app" || channel === "in_app_and_email") {
    if (recipients.length > 0) {
      const notifs = recipients.map((u) => ({
        user_id: u.id,
        type: "announcement",
        title: announcement.title,
        body: (announcement.body as string).slice(0, 200),
        link: announcement.link ?? null,
      }));
      const { error: notifError } = await db.from("notifications").insert(notifs);
      if (notifError) {
        console.warn("in_app batch insert error", notifError);
        failedCount += recipients.length;
      } else {
        sentCount += recipients.length;
      }
    }
  }

  // 4-B. email 발송
  if (channel === "email" || channel === "in_app_and_email") {
    // email 전용일 때는 sentCount 리셋 (in_app 카운트와 중복 방지)
    if (channel === "email") sentCount = 0;

    for (const u of recipients) {
      const payload = announcementEmail({
        title: announcement.title,
        body: announcement.body,
        link: announcement.link ?? undefined,
        recipientName: u.full_name ?? undefined,
      });
      const result = await sendEmail(u.email, payload);
      if (result.ok) {
        sentCount += 1;
      } else {
        failedCount += 1;
        console.warn(`email send failed for ${u.email}:`, result.error);
      }
    }
  }

  // 5. 결과 업데이트
  const finalStatus = failedCount === recipientCount && recipientCount > 0 ? "failed" : "sent";
  await db
    .from("announcements")
    .update({
      status: finalStatus,
      sent_count: sentCount,
      failed_count: failedCount,
      sent_at: new Date().toISOString(),
    })
    .eq("id", announcementId);

  // 6. audit log
  await logAdminAction(db, actorId, {
    action: "send_announcement",
    targetType: "announcement",
    targetId: announcementId,
    metadata: {
      audience: announcement.audience,
      channel: announcement.channel,
      recipient_count: recipientCount,
      sent_count: sentCount,
      failed_count: failedCount,
    },
  });

  return {
    status: finalStatus,
    recipient_count: recipientCount,
    sent_count: sentCount,
    failed_count: failedCount,
  };
}
