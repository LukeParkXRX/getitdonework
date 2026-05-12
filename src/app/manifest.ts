import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Get It Done at Work",
    short_name: "GIDW",
    description: "한국 스타트업의 미국 진출 파트너",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    icons: [{ src: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }],
  };
}
