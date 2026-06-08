export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createUntypedAdminClient } from "@/lib/supabase/server";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const RESUME_EXTENSIONS = new Set(["pdf", "doc", "docx"]);
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_RESUME_BYTES = 10 * 1024 * 1024;

function extensionFromName(name: string): string {
  return name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
}

function safeFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "");
  const ext = extensionFromName(name);
  return `${base || "file"}.${ext}`;
}

export async function POST(request: Request) {
  const rl = await rateLimit(`enabler-apply-upload:${getClientKey(request)}`, {
    max: 8,
    windowMs: 60 * 60 * 1000,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many upload attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const formData = await request.formData();
  const kind = formData.get("kind");
  const file = formData.get("file");

  if (kind !== "photo" && kind !== "resume") {
    return NextResponse.json({ error: "Invalid upload type." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please select a file." }, { status: 400 });
  }

  const ext = extensionFromName(file.name);

  if (kind === "photo") {
    if (!PHOTO_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Profile photo must be a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Profile photo must be 5MB or smaller." }, { status: 400 });
    }
  }

  if (kind === "resume") {
    if (!RESUME_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Resume must be a PDF, DOC, or DOCX file." }, { status: 400 });
    }
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json({ error: "Resume must be 10MB or smaller." }, { status: 400 });
    }
  }

  const supabase = createUntypedAdminClient();
  const buffer = await file.arrayBuffer();

  if (kind === "photo") {
    const path = `applications/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return NextResponse.json({
      kind,
      fileName: file.name,
      publicUrl: data.publicUrl,
    });
  }

  const fileName = safeFileName(file.name);
  const path = `resumes/${crypto.randomUUID()}_${fileName}`;
  const { error } = await supabase.storage.from("application-assets").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    kind,
    fileName: file.name,
    filePath: path,
  });
}
