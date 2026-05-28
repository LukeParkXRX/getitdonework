import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Fetching non-empty launch_checklist_items...");
  
  const { data, error } = await supabase
    .from("launch_checklist_items")
    .select(`
      id,
      category,
      title_ko,
      title_en,
      is_complete,
      notes,
      value
    `)
    .or("notes.neq.'',value.neq.''");

  if (error) {
    console.error("❌ Error fetching checklist items:", error.message);
    return;
  }

  console.log("✅ Fetch successful! Found", data.length, "items with notes/value:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
