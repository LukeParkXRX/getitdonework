import { redirect } from "next/navigation";

// 과거 목업(데모) 세션 화면을 제거하고 실제 흐름으로 리디렉트한다.
// 실제 세션 목록/이력은 /bookings, 라이브 화상은 /meeting/[roomName] 에 있다.
// 남아있는 링크·북마크가 가짜 데모로 가지 않도록 예약 목록으로 보낸다.
export default function SessionRedirect() {
  redirect("/bookings");
}
