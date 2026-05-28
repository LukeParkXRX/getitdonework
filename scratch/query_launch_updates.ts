import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Fetching latest 10 rows from launch_updates...");
  
  const { data, error } = await supabase
    .from("launch_updates")
    .select(`
      id,
      author_name,
      author_role,
      type,
      title,
      body,
      related_item_id,
      resolved,
      created_at
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("❌ Error fetching launch updates:", error.message);
    return;
  }

  console.log("✅ Fetch successful! Found", data.length, "updates:");
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
