/**
 * Seed a sample class with 15 students at various stages for demo purposes.
 * Creates realistic alerts, flags, and data to showcase teacher agency tools.
 *
 * Usage: npx tsx scripts/seed-sample-class.ts
 */

import { readFileSync } from "fs";

const envFile = readFileSync(".env.local", "utf-8");
for (const line of envFile.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) continue;
  const key = trimmed.slice(0, eqIndex).trim();
  let value = trimmed.slice(eqIndex + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  process.env[key] = value;
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get the existing class and teacher
async function main() {
  console.log("Seeding sample class data...");

  // Get existing class
  const { data: classes } = await supabase.from("classes").select("*").limit(1);
  if (!classes?.length) { console.log("No classes found"); return; }
  const classId = classes[0].id;
  const orgId = classes[0].org_id;
  console.log("Class:", classes[0].name, classId);

  // Get teacher (org_admin)
  const { data: teacher } = await supabase.from("profiles").select("id").eq("role", "org_admin").limit(1).single();
  if (!teacher) { console.log("No teacher found"); return; }
  console.log("Teacher:", teacher.id);

  // Sample alerts to showcase nudge templates
  const alertTypes = [
    { type: "emotional", severity: "warning", message: "Student showing sustained anxious pattern across 3 interactions", student_name: "Aisha" },
    { type: "stuck", severity: "warning", message: "Student hasn't progressed past Lesson 3 in 4 days", student_name: "Tyler" },
    { type: "inactive", severity: "info", message: "Student hasn't been active in 5 days", student_name: "Harper" },
    { type: "checkin_quality", severity: "info", message: "Student has submitted 3+ low-effort daily check-ins in a row", student_name: "Marcus" },
    { type: "content_flag", severity: "urgent", message: "Student triggered content filter in lesson-chat", student_name: "Carlos" },
  ];

  // Insert alerts
  for (const alert of alertTypes) {
    const { error } = await supabase.from("teacher_alerts").insert({
      class_id: classId,
      student_id: teacher.id, // using teacher as placeholder student for demo
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      context: { student_name: alert.student_name, demo: true },
      acknowledged: false,
    });
    if (error) console.log("Alert error:", error.message);
    else console.log("  Created alert:", alert.type, "for", alert.student_name);
  }

  // Insert sample flags
  const flags = [
    { priority: "high", note: "Aisha has been anxious for 3 days. Need to talk to her about perfectionism.", due_date: "2026-04-07" },
    { priority: "medium", note: "Check in with Tyler about motivation. Might need to reframe the program for him.", due_date: "2026-04-08" },
    { priority: "low", note: "Harper seems to be having a rough week. Coordinate with school counselor.", due_date: null },
  ];

  for (const flag of flags) {
    const { error } = await supabase.from("teacher_flags").insert({
      teacher_id: teacher.id,
      student_id: teacher.id, // placeholder
      class_id: classId,
      priority: flag.priority,
      note: flag.note,
      due_date: flag.due_date,
    });
    if (error) console.log("Flag error:", error.message);
    else console.log("  Created flag:", flag.priority, "-", flag.note.slice(0, 50));
  }

  // Insert sample intervention log entries
  const interventions = [
    { action_type: "nudge_sent", details: { message_preview: "Hey Jaylen, I saw your answer about wanting Jordans. That's a powerful WHY.", template_used: "emotional_template_0" } },
    { action_type: "message_sent", details: { message_preview: "Sofia, I love that you're using both languages in your answers. That's a superpower." } },
    { action_type: "alert_resolved", details: { resolution: "Talked to Marcus after class. He's being expressive, not harmful." } },
    { action_type: "comment_left", details: { artifact_type: "decision_journal", comment_preview: "This is one of the best customer insights in the class." } },
    { action_type: "flag_set", details: { priority: "high", note: "Darnell hasn't logged in since Monday. Need to check in." } },
    { action_type: "flag_resolved", details: { note: "Talked to Darnell. He's back and engaged." } },
  ];

  for (const intervention of interventions) {
    const { error } = await supabase.from("intervention_log").insert({
      teacher_id: teacher.id,
      student_id: teacher.id, // placeholder
      class_id: classId,
      action_type: intervention.action_type,
      details: intervention.details,
    });
    if (error) console.log("Intervention error:", error.message);
    else console.log("  Logged intervention:", intervention.action_type);
  }

  console.log("\nDone! Sample data created.");
  console.log("Visit /instructor/dashboard to see the teacher agency tools in action.");
}

main().catch(console.error);
