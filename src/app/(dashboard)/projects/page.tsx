import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/supabase/guards";
import ProjectsListClient from "./ProjectsListClient";
import type { ProjectSummary } from "./ProjectsListClient";

export default async function ProjectsPage() {
  const { userId } = await requireRole(["startup"], "/projects").catch(() => {
    redirect("/my");
  }) as { userId: string };

  const supabase = await createServerSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = await db
    .from("projects")
    .select("id, title, category, description, duration, budget, status, created_at")
    .eq("startup_id", userId)
    .order("created_at", { ascending: false });

  const projects: ProjectSummary[] = (data ?? []).map((r: ProjectSummary) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    description: r.description,
    duration: r.duration,
    budget: r.budget,
    status: r.status,
    created_at: r.created_at,
  }));

  return <ProjectsListClient projects={projects} />;
}
