import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/guards";
import ProjectDetailClient from "./ProjectDetailClient";
import type { Project } from "./ProjectDetailClient";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await requireRole(["startup"], "/projects").catch(() => {
    redirect("/my");
  }) as { userId: string };

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data, error } = await db
    .from("projects")
    .select("id, title, category, description, duration, budget, requirements, attachment_url, status, created_at")
    .eq("id", id)
    .eq("startup_id", userId)
    .single();

  if (error || !data) {
    notFound();
  }

  const project: Project = {
    id: data.id,
    title: data.title,
    category: data.category,
    description: data.description,
    duration: data.duration,
    budget: data.budget,
    requirements: data.requirements ?? [],
    attachment_url: data.attachment_url,
    status: data.status,
    created_at: data.created_at,
  };

  return <ProjectDetailClient project={project} />;
}
