/**
 * overnight-browse-smoke.ts — unattended end-to-end smoke test against prod.
 * Walks the friends/family path: landing → demo → for-schools → join (NETT01)
 * Verifies every step renders with expected text. No screenshots, no costs.
 *
 * Exit code 0 if all steps pass, 1 if any fail.
 */

import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const BROWSE_CANDIDATES = [
  join(homedir(), ".claude/skills/gstack/browse/dist/browse"),
  ".claude/skills/gstack/browse/dist/browse",
];
const BROWSE = BROWSE_CANDIDATES.find((p) => existsSync(p));
if (!BROWSE) {
  console.error("FAIL: browse binary not found");
  process.exit(1);
}

const PROD = "https://adaptable-aarogers2007-droids-projects.vercel.app";

function browse(...args: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync(BROWSE!, args, { encoding: "utf-8", timeout: 30000 });
  return {
    ok: r.status === 0,
    stdout: r.stdout ?? "",
    stderr: r.stderr ?? "",
  };
}

interface Step {
  name: string;
  url: string;
  expect: string[]; // strings that must appear in the page text
  forbid?: string[]; // strings that must NOT appear
}

const STEPS: Step[] = [
  {
    name: "landing",
    url: `${PROD}/`,
    expect: ["Adaptable", "Join a Class", "Sign In"],
  },
  {
    name: "demo",
    url: `${PROD}/demo`,
    expect: [
      "Ikigai Discovery",
      "Student Dashboard",
      "AI Lesson Conversations",
      "Business Card Designer",
      "Auto-Assembled Business Plan",
      "Instructor Dashboard",
      "Parent View",
      "The Reveals",
      "Watch Ikigai Reveal",
      "Watch Graduation Ceremony",
      "20 entries",
      "0 likely-hallucinated",
      "22 of 22 lessons",
      "+1.15",
      "+1.53",
      "97%",
    ],
    forbid: [
      "Bloomgives", // JSX whitespace bug regression
      "Hoverto",    // same
      "Elsa Martinez Sign out", // means studentName leaked back into nav
    ],
  },
  {
    name: "for-schools",
    url: `${PROD}/for-schools`,
    expect: [
      "Every student designs a real business",
      "The Student Journey",
      "Find Your Niche",
      "Frequently Asked Questions",
      "See the Demo",
      "NBEA",
      "Common Core",
      "ISTE",
    ],
  },
  {
    name: "join",
    url: `${PROD}/join`,
    expect: ["Join a Class", "Invite code"],
  },
];

let passed = 0;
let failed = 0;
const fails: { step: string; reason: string }[] = [];

for (const step of STEPS) {
  process.stderr.write(`[smoke] ${step.name} ... `);
  const goto = browse("goto", step.url);
  if (!goto.ok) {
    failed++;
    fails.push({ step: step.name, reason: `goto failed: ${goto.stderr.slice(0, 200)}` });
    process.stderr.write("FAIL (goto)\n");
    continue;
  }
  // small wait — let SSR/CSR settle
  spawnSync("sleep", ["2"]);
  const text = browse("text");
  if (!text.ok) {
    failed++;
    fails.push({ step: step.name, reason: `text fetch failed` });
    process.stderr.write("FAIL (text)\n");
    continue;
  }
  const body = text.stdout;
  const missing = step.expect.filter((s) => !body.includes(s));
  const present = (step.forbid ?? []).filter((s) => body.includes(s));
  if (missing.length === 0 && present.length === 0) {
    passed++;
    process.stderr.write("OK\n");
  } else {
    failed++;
    if (missing.length) {
      fails.push({ step: step.name, reason: `missing: ${missing.join(", ")}` });
    }
    if (present.length) {
      fails.push({ step: step.name, reason: `forbidden present: ${present.join(", ")}` });
    }
    process.stderr.write(`FAIL (${missing.length} missing, ${present.length} forbidden)\n`);
  }
}

// Bonus: verify NETT01 still resolves to "Entrepreneurship 101"
process.stderr.write(`[smoke] join+nett01 ... `);
browse("goto", `${PROD}/join`);
spawnSync("sleep", ["2"]);
browse("fill", "#code", "nett01");
spawnSync("sleep", ["1"]);
browse("click", "button[type=submit]");
spawnSync("sleep", ["3"]);
const after = browse("text");
if (after.ok && after.stdout.includes("Entrepreneurship 101")) {
  passed++;
  process.stderr.write("OK\n");
} else {
  failed++;
  fails.push({ step: "join+nett01", reason: "did not resolve to 'Entrepreneurship 101'" });
  process.stderr.write("FAIL\n");
}

console.log("");
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
if (fails.length) {
  console.log("");
  console.log("Failures:");
  for (const f of fails) {
    console.log(`  - ${f.step}: ${f.reason}`);
  }
}

process.exit(failed === 0 ? 0 : 1);
