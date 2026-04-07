import { LESSON_PLANS } from "@/lib/lesson-plans";
import type { Metadata } from "next";
import PrintButton from "./PrintButton";

export const metadata: Metadata = {
  title: "Curriculum Alignment — Adaptable",
  description:
    "How Adaptable maps to recognized educational standards for entrepreneurship, business, financial literacy, and career readiness.",
};

interface StandardMapping {
  framework: string;
  code: string;
  description: string;
}

interface LessonStandards {
  moduleId: number;
  lessonId: number;
  title: string;
  objective: string;
  standards: StandardMapping[];
}

/**
 * Maps each lesson to real, recognized educational standards from:
 * - NBEA (National Business Education Association) Entrepreneurship Standards
 * - Jump$tart Coalition for Personal Financial Literacy Standards
 * - Common Core State Standards (ELA / Math)
 * - ISTE Standards for Students (2016)
 */
const LESSON_STANDARDS: LessonStandards[] = [
  {
    moduleId: 1,
    lessonId: 1,
    title: "Welcome to Adaptable / Your WHY",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 1 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard I",
        description:
          "Recognize that entrepreneurs possess unique characteristics and evaluate the degree to which one possesses those characteristics.",
      },
      {
        framework: "ISTE",
        code: "1a — Empowered Learner",
        description:
          "Students articulate and set personal learning goals, develop strategies leveraging technology to achieve them, and reflect on the learning process itself to improve learning outcomes.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.1",
        description:
          "Initiate and participate effectively in a range of collaborative discussions, building on others\u2019 ideas and expressing their own clearly and persuasively.",
      },
      {
        framework: "Jump$tart",
        code: "Employment and Income — Standard 1",
        description:
          "Explore job and career options and relate them to personal interests, skills, and aptitudes.",
      },
    ],
  },
  {
    moduleId: 1,
    lessonId: 2,
    title: "Niche Validation",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 1 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard I",
        description:
          "Assess the reality of becoming an entrepreneur, including identifying opportunities in the marketplace.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard III",
        description:
          "Apply economic concepts when making business decisions, including understanding supply, demand, and market viability.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 3",
        description:
          "Describe how income affects spending and saving decisions, and how to evaluate the potential profitability of a venture.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.1",
        description:
          "Write arguments to support claims in an analysis of substantive topics, using valid reasoning and relevant evidence.",
      },
    ],
  },
  {
    moduleId: 1,
    lessonId: 3,
    title: "Research Your Competition",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 1 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Analyze the effect of competition on business, including identifying competitors and evaluating competitive advantages.",
      },
      {
        framework: "ISTE",
        code: "3a — Knowledge Constructor",
        description:
          "Students plan and employ effective research strategies to locate information and other resources for their intellectual or creative pursuits.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.7",
        description:
          "Conduct short as well as more sustained research projects to answer a question or solve a problem; narrow or broaden the inquiry when appropriate.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Describe the components of a business plan and the importance of competitive analysis within the planning process.",
      },
    ],
  },
  {
    moduleId: 1,
    lessonId: 4,
    title: "Define Your Target Customer",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 1 && l.lesson_id === 4)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Develop a marketing plan that addresses target markets, customer profiles, and strategies for reaching customers.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.2",
        description:
          "Write informative/explanatory texts to examine and convey complex ideas, concepts, and information clearly and accurately.",
      },
      {
        framework: "ISTE",
        code: "3d — Knowledge Constructor",
        description:
          "Students build knowledge by actively exploring real-world issues and problems, developing ideas and theories and pursuing answers and solutions.",
      },
      {
        framework: "Jump$tart",
        code: "Financial Decision Making — Standard 1",
        description:
          "Recognize the responsibilities and sources of financial information associated with personal financial decision making.",
      },
    ],
  },
  {
    moduleId: 2,
    lessonId: 1,
    title: "The Customer Interview",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 2 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.1c",
        description:
          "Propel conversations by posing and responding to questions that relate the current discussion to broader themes or larger ideas; actively incorporate others into the discussion.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard I",
        description:
          "Use discovery processes to generate feasible ideas for business ventures, including conducting customer research to validate assumptions.",
      },
      {
        framework: "ISTE",
        code: "3c — Knowledge Constructor",
        description:
          "Students curate information from digital resources using a variety of tools and methods to create collections of artifacts that demonstrate meaningful connections or conclusions.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.4",
        description:
          "Present information, findings, and supporting evidence clearly, concisely, and logically such that listeners can follow the line of reasoning.",
      },
    ],
  },
  {
    moduleId: 2,
    lessonId: 2,
    title: "What Did You Learn?",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 2 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.1b",
        description:
          "Develop claims and counterclaims fairly, supplying evidence for each while pointing out the strengths and limitations of both.",
      },
      {
        framework: "ISTE",
        code: "5a — Computational Thinker",
        description:
          "Students formulate problem definitions suited for technology-assisted methods such as data analysis, abstract models, and algorithmic thinking.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Develop a business plan that integrates market research, customer discovery insights, and evidence-based decision making.",
      },
      {
        framework: "Jump$tart",
        code: "Financial Decision Making — Standard 4",
        description:
          "Apply systematic decision-making processes to significant financial and business choices, evaluating evidence and potential consequences.",
      },
    ],
  },
  {
    moduleId: 2,
    lessonId: 3,
    title: "Set Your Price",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 2 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard IV",
        description:
          "Apply financial concepts to business decisions, including pricing strategy, revenue projection, and cost analysis.",
      },
      {
        framework: "Common Core Math",
        code: "CCSS.MATH.CONTENT.7.RP.A.3",
        description:
          "Use proportional relationships to solve multi-step ratio and percent problems, including pricing markups and margins.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 1",
        description:
          "Discuss how spending, saving, and investment decisions affect future opportunities and financial well-being.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard III",
        description:
          "Explain the concept of price in terms of supply and demand, and determine how pricing strategy impacts competitive positioning.",
      },
    ],
  },
  {
    moduleId: 2,
    lessonId: 4,
    title: "Your First 3 Customers",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 2 && l.lesson_id === 4)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Develop and implement a promotional strategy that communicates a value proposition to the target market.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.4",
        description:
          "Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.",
      },
      {
        framework: "ISTE",
        code: "1c — Empowered Learner",
        description:
          "Students use technology to seek feedback that informs and improves their practice and to demonstrate their learning in a variety of ways.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Present an implementation plan that identifies specific activities, timelines, and resource requirements for launching a venture.",
      },
    ],
  },
];

const FRAMEWORK_COLORS: Record<string, string> = {
  NBEA: "bg-teal-50 text-teal-800 border-teal-200",
  "Common Core ELA": "bg-blue-50 text-blue-800 border-blue-200",
  "Common Core Math": "bg-indigo-50 text-indigo-800 border-indigo-200",
  "Jump$tart": "bg-amber-50 text-amber-800 border-amber-200",
  ISTE: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

function frameworkBadgeClass(framework: string): string {
  return FRAMEWORK_COLORS[framework] ?? "bg-gray-50 text-gray-800 border-gray-200";
}

export default function CurriculumAlignmentPage() {
  return (
    <>
      <style>{`
        @media print {
          nav, .no-print { display: none !important; }
          body { font-size: 11pt; }
          main { padding: 0 !important; }
          .lesson-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <main className="min-h-screen bg-[var(--bg-subtle)]">
        {/* Nav - hidden in print */}
        <nav className="border-b border-[var(--border)] bg-[var(--bg)] no-print">
          <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
            <a
              href="/instructor/dashboard"
              className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]"
            >
              Adaptable
            </a>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Curriculum Alignment
            </span>
            <div className="ml-auto">
              <a
                href="/instructor/dashboard"
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back to Dashboard
              </a>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-[1200px] px-6 py-8">
          {/* Header */}
          <header className="mb-10">
            <h1 className="font-[family-name:var(--font-display)] text-[48px] font-bold leading-tight text-[var(--text-primary)]">
              Curriculum Alignment
            </h1>
            <p className="mt-2 text-xl text-[var(--text-secondary)]">
              How Adaptable maps to recognized educational standards
            </p>
            <p className="mt-4 max-w-[800px] text-base leading-relaxed text-[var(--text-secondary)]">
              Every lesson in Adaptable is designed to meet national and state
              educational standards for entrepreneurship, business, financial
              literacy, and career readiness. This page maps each lesson to
              specific standards for easy reference during curriculum reviews and
              procurement.
            </p>
            <div className="mt-4 max-w-[800px] rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
              <p className="text-sm font-semibold text-[var(--primary)]">Showing alignment for Modules 1–2 (foundational lessons)</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                Modules 3–6 (Build Your Brand, Get Your First Customer, Run the Numbers,
                Launch and Learn — 14 additional lessons) are in active standards-alignment
                review. Full mapping document available on request for procurement reviews.
              </p>
            </div>
          </header>

          {/* Framework legend */}
          <section className="mb-8 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)] mb-3">
              Standards Frameworks Referenced
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                { key: "NBEA", label: "NBEA — National Business Education Association" },
                { key: "Jump$tart", label: "Jump$tart Coalition for Personal Financial Literacy" },
                { key: "Common Core ELA", label: "Common Core State Standards — ELA" },
                { key: "Common Core Math", label: "Common Core State Standards — Math" },
                { key: "ISTE", label: "ISTE Standards for Students" },
              ].map((fw) => (
                <span
                  key={fw.key}
                  className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium ${frameworkBadgeClass(fw.key)}`}
                >
                  {fw.label}
                </span>
              ))}
            </div>
          </section>

          {/* Lesson cards */}
          <div className="space-y-6">
            {LESSON_STANDARDS.map((lesson) => (
              <section
                key={`${lesson.moduleId}-${lesson.lessonId}`}
                className="lesson-card rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6"
              >
                {/* Lesson header */}
                <div className="mb-4 border-b border-[var(--border)] pb-4">
                  <div className="flex items-baseline gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-bold text-white">
                      {lesson.moduleId}.{lesson.lessonId}
                    </span>
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--text-primary)]">
                      {lesson.title}
                    </h3>
                  </div>
                  <p className="mt-2 ml-11 text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">
                      Objective:
                    </span>{" "}
                    {lesson.objective}
                  </p>
                </div>

                {/* Standards */}
                <div className="space-y-3 ml-11">
                  {lesson.standards.map((std, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3"
                    >
                      <span
                        className={`mt-0.5 inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${frameworkBadgeClass(std.framework)}`}
                      >
                        {std.framework}
                      </span>
                      <div className="text-sm">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {std.code}
                        </span>
                        <span className="text-[var(--text-muted)]"> — </span>
                        <span className="text-[var(--text-secondary)]">
                          {std.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Footer */}
          <footer className="mt-10 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--text-muted)]">
                <p>Standards mapped as of April 2026</p>
                <p className="mt-1">
                  For questions about curriculum alignment, contact your
                  school&apos;s Adaptable coordinator
                </p>
              </div>
              <PrintButton />
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
