import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 }, // ramp up
    { duration: "1m",  target: 10 }, // hold
    { duration: "30s", target: 0  }, // ramp down
  ],
  thresholds: {
    http_req_failed:   ["rate<0.01"],   // 1% 이하 실패
    http_req_duration: ["p(95)<1500"],  // p95 1.5s 이하
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  const paths = ["/", "/enablers", "/credits", "/about", "/faq"];

  for (const p of paths) {
    const res = http.get(`${BASE}${p}`);
    check(res, {
      [`${p} status 200`]: (r) => r.status === 200,
      [`${p} body has content`]: (r) => r.body && r.body.length > 100,
    });
    sleep(0.5);
  }
}
