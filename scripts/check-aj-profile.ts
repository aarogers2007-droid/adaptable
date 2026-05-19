import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) { const m = line.match(/^([^#=]+)=(.*)$/); if(m) process.env[m[1].trim()]=m[2].trim(); }
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  const { data } = await supabase.from("profiles").select("id, email, role, org_id, is_platform_owner, business_idea, full_name").eq("email", "aarogers2007@gmail.com").single();
  console.log("AJ Profile:");
  console.log(JSON.stringify(data, null, 2));
}
main().catch(console.error);
