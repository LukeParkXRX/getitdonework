import http from "k6/http";
import { check } from "k6";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_duration: ["p(95)<800"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // 인증 없이 호출 — 401 응답이 정상
  const res = http.get(`${BASE}/api/notifications`);
  check(res, {
    "401 expected (no auth)": (r) => r.status === 401,
  });
}
