"use client";

import { useState } from "react";

const SECTIONS = [
  {
    title: "A 1:1 AI Mentor for Every Student",
    body: "Adaptable delivers what no human-staffed program can: a dedicated AI mentor for every single student, available 24/7, personalized to their specific business idea, adapted to their grade level, and trained on real entrepreneurship frameworks. A single teacher with 30 students cannot provide 1:1 Socratic mentoring. Adaptable can. The platform replaces $2.5M-4M/year in equivalent human mentoring labor with a system that scales to unlimited students without degrading quality. Each student receives 22 conversation-style lessons across six modules, with an AI that asks questions instead of lecturing, references their business by name in every response, and gates progression on demonstrated understanding rather than seat time.",
  },
  {
    title: "The Ikigai Discovery Engine",
    body: "The hardest moment in a teenager\u2019s entrepreneurial journey is the blank page before the business exists. Adaptable solves it in under two minutes. An Ikigai-based wizard generates a specific, executable business idea grounded in what the student already loves and is already good at. This is not a random business generator. It is an eval-validated synthesis system that has been stress-tested against 60 synthetic student personas spanning coherent inputs, multi-track interests, slang and ESL voices, sarcastic refusals, and prompt injection attempts. The result: 93% of simulated students flipped from \u201cbusiness is something other people do\u201d to \u201cthis could be me\u201d after a single Ikigai session.",
  },
  {
    title: "K-12 Grade Adaptation",
    body: "A single platform that serves every grade level from kindergarten through 12th grade. Four tiers adapt vocabulary, sentence length, tone, examples, capital limits, and business scope: K-2 students get neighborhood-only ideas with zero startup cost and parent involvement at every step. High school students get full-range businesses with online components and up to $100 in startup capital. The AI mentor adjusts its entire personality and teaching approach per tier. No other entrepreneurship platform on the market covers K-12 in a single product.",
  },
  {
    title: "AI Guide with Full Student Context",
    body: "Beyond the structured curriculum, every student gets an always-available AI Guide that knows their business, their Ikigai, their decisions across all completed lessons, their recent reflections, and their emotional state. The Guide uses hybrid semantic retrieval from a 38-entry fact-checked knowledge base, re-ranked per message so different questions surface different knowledge. It detects when a student has been stuck on a lesson for days and proactively offers help. It remembers what the student asked in previous sessions. It reads the Founder\u2019s Mirror reflections and adjusts its tone based on the student\u2019s emotional trajectory. No edtech chatbot on the market has this depth of student context.",
  },
  {
    title: "The Founder\u2019s Mirror",
    body: "Entrepreneurship education that ignores the inner game produces students who know what a business plan is but don\u2019t believe they can build one. The Founder\u2019s Mirror is a private reflection layer that shows students their own behavior back to them after every lesson. One observation and one question. Maximum 40 words. No advice. No praise. No \u201cfailure is growth\u201d platitudes. Over 22 lessons, those reflections accumulate into a Founder\u2019s Log that no teacher sees, no algorithm analyzes, and no leaderboard ranks. This is the student\u2019s private record of who they were becoming while they were building. No competitor has anything like this.",
  },
  {
    title: "Invention Mode for Events",
    body: "For large-scale events, Adaptable includes a completely separate Invention Mode that replaces the business curriculum with a five-circle discovery wizard designed for group formation. A five-step grouping algorithm sorts hundreds of students into balanced teams optimized across invention category, thinking archetype, knowledge diversity, ambition scale, and communication style. The admin dashboard provides real-time completion tracking, archetype distribution breakdowns, a live algorithm terminal replay, manual student overrides, group reveal controls, and print-ready outputs for wall rosters and door handout slips. This is a complete event facilitation system that would cost $50K-100K to build as a standalone product.",
  },
  {
    title: "Enterprise-Grade Safety",
    body: "Every student input passes through three safety layers: regex-based content moderation covering profanity and threats in 12+ languages, ML-based moderation via Claude Haiku that catches subtle toxicity and coded language, and crisis detection that identifies self-harm signals, suicidal ideation, and abuse indicators. Crisis signals fire real-time teacher alerts with email notification. The student is never abandoned \u2014 they see a supportive response with 988 Lifeline, Crisis Text Line, and Trevor Project resources while the teacher is notified instantly. COPPA compliance is built in with age-gated parental consent, token-hashed verification, and role-based data access. Output moderation filters every AI response before it reaches the student. This safety infrastructure alone would take a funded team 6+ months to build.",
  },
  {
    title: "Factual Floor & Knowledge Integrity",
    body: "The AI mentor draws from 38 fact-checked knowledge base entries covering Lean Canvas, Jobs-to-be-Done, Mom Test, Golden Circle, Build-Measure-Learn, value-based pricing, and more. Every entry passes the Adaptable Factual Floor: any claim a student could see must be traceable to a source a 16-year-old could independently verify in 60 seconds. Zero invented statistics. Zero fabricated case studies. Zero misattributed quotes. Retrieval is hybrid: tag-based candidate fetch plus per-message semantic re-ranking via pgvector. A student asking about pricing gets pricing knowledge, not generic content. 22 of 22 lessons have verified context with at least 3 topically matched entries each.",
  },
  {
    title: "Teacher & Parent Tools",
    body: "Teachers get a real-time dashboard with student progress tracking, smart alerts for stuck and inactive students, one-click nudges, live activity feeds, and follow-up management. The system automatically detects when students are struggling and surfaces alerts before the teacher would notice. Parents get a PIN-protected view designed for 60 seconds of context: their child\u2019s progress, business idea, Ikigai, and specific guidance on how to help. The business plan assembles itself from student decisions across all 22 lessons \u2014 students never \u201cwrite a business plan,\u201d they build one through conversation. All 22 lessons are mapped to NBEA, Common Core, ISTE, and Jump$tart standards with full curriculum alignment documentation available for procurement committees.",
  },
  {
    title: "Eval-Driven Quality Assurance",
    body: "Every prompt change runs through a regression test suite before reaching a single student. 60 synthetic student personas across 3 motivation levels (low, medium, high), spanning coherent cases, multi-track interests, slang and ESL voices, age 12 and 18 boundaries, and students who already run businesses. Synthesizer: Claude Sonnet. Judge: Claude Opus. Cross-model evaluation eliminates self-preference bias. The eval system tracks self-confidence gain (+1.09 average on a 5-point scale), understanding gain (+1.48), alien-to-accessible flip rate (93%), and RAG faithfulness (0.83, zero low-faithfulness turns). The students who needed it most \u2014 low-motivation, youngest, ESL speakers \u2014 showed the largest gains. This level of measurement infrastructure is what well-funded AI companies build after Series A. Adaptable has it at launch.",
  },
  {
    title: "The Mission",
    body: "The mission is transformation, not education. A kid walks in thinking entrepreneurship is something other people do, and walks out with a business, a private record of their own growth, and the confidence that comes from building something real. Adaptable is not a course. It is not a chatbot. It is a complete AI-native venture studio that delivers personalized 1:1 mentoring at a scale no human program can match, with safety infrastructure that exceeds industry standards, measurement rigor that proves it works, and a product experience that treats teenagers as real builders.",
  },
] as const;

export default function SummaryAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-2">
      {SECTIONS.map((s, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] overflow-hidden transition-colors"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[var(--bg-muted)] transition-colors"
            >
              <span
                className="font-[family-name:var(--font-display)] font-semibold"
                style={{ fontSize: "17px", color: "var(--text-primary)" }}
              >
                {s.title}
              </span>
              <svg
                className={`shrink-0 w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                style={{ color: "var(--text-muted)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <div
              className={`grid transition-all duration-200 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p
                  className="px-5 pb-5 font-[family-name:var(--font-display)]"
                  style={{
                    lineHeight: 1.75,
                    fontSize: "15px",
                    color: "var(--text-secondary)",
                    textIndent: "2em",
                  }}
                >
                  {s.body}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <div className="pt-4 mt-4 border-t border-[var(--border)]">
        <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>
          — AJ Rogers, founder, age 19
        </p>
      </div>
    </div>
  );
}
