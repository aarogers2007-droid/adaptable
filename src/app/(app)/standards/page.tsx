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
  // ─────────────────────────────────────────────────────────────
  // MODULE 3 — Build Your Brand
  // ─────────────────────────────────────────────────────────────
  {
    moduleId: 3,
    lessonId: 1,
    title: "Brand Identity and Voice",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 3 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Define and develop a brand identity that differentiates a business from its competitors and communicates value to its target market.",
      },
      {
        framework: "ISTE",
        code: "6a — Creative Communicator",
        description:
          "Students choose the appropriate platforms and tools for meeting the desired objectives of their creation or communication.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.3",
        description:
          "Use narrative techniques to develop experiences, events, and characters — applied here to crafting an authentic brand voice.",
      },
      {
        framework: "Jump$tart",
        code: "Employment and Income — Standard 2",
        description:
          "Identify sources of personal income and the role of personal brand in career and entrepreneurial opportunities.",
      },
    ],
  },
  {
    moduleId: 3,
    lessonId: 2,
    title: "Naming Your Business",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 3 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Apply principles of brand positioning, including selecting a memorable name that supports the value proposition and resonates with the target market.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.L.9-10.5",
        description:
          "Demonstrate understanding of figurative language, word relationships, and nuances in word meanings to evaluate the impact of word choice.",
      },
      {
        framework: "ISTE",
        code: "6c — Creative Communicator",
        description:
          "Students communicate complex ideas clearly and effectively by creating or using a variety of digital objects such as visualizations, models, or simulations.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.1d",
        description:
          "Respond thoughtfully to diverse perspectives, summarize points of agreement and disagreement, and qualify or justify their own views — applied to peer name-testing feedback.",
      },
    ],
  },
  {
    moduleId: 3,
    lessonId: 3,
    title: "Designing Your First Impression",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 3 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Design visual and verbal brand elements (color, typography, voice) that support a coherent customer experience and competitive positioning.",
      },
      {
        framework: "ISTE",
        code: "6b — Creative Communicator",
        description:
          "Students create original works or responsibly repurpose or remix digital resources into new creations.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.5",
        description:
          "Make strategic use of digital media (e.g., textual, graphical, audio, visual elements) in presentations to enhance understanding of findings, reasoning, and evidence.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 2",
        description:
          "Develop a system for keeping and using financial records — applied here to the principle of constraint-driven design (one color, one font, one message).",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  // MODULE 4 — Get Your First Customer
  // ─────────────────────────────────────────────────────────────
  {
    moduleId: 4,
    lessonId: 1,
    title: "Zero-Budget Marketing",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 4 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Develop and implement a promotional strategy that reaches the target market through low-cost or no-cost channels appropriate to the business stage.",
      },
      {
        framework: "ISTE",
        code: "7a — Global Collaborator",
        description:
          "Students use digital tools to connect with learners from a variety of backgrounds and cultures, engaging with them in ways that broaden mutual understanding and learning.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.6",
        description:
          "Use technology, including the Internet, to produce, publish, and update individual or shared writing products, taking advantage of technology\u2019s capacity to link to other information.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 4",
        description:
          "Apply consumer skills to spending and saving decisions, including evaluating the cost-benefit trade-offs of marketing channels.",
      },
    ],
  },
  {
    moduleId: 4,
    lessonId: 2,
    title: "Social Media for a Service Business",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 4 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Apply digital marketing principles, including content planning, audience engagement, and platform selection, to a real business.",
      },
      {
        framework: "ISTE",
        code: "6d — Creative Communicator",
        description:
          "Students publish or present content that customizes the message and medium for their intended audiences.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.4",
        description:
          "Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience.",
      },
      {
        framework: "ISTE",
        code: "2c — Digital Citizen",
        description:
          "Students demonstrate an understanding of and respect for the rights and obligations of using and sharing intellectual property — including responsible content creation as a young business owner.",
      },
    ],
  },
  {
    moduleId: 4,
    lessonId: 3,
    title: "Word of Mouth and Referrals",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 4 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Build and manage customer relationships, including designing experiences that generate referrals and repeat business.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.4",
        description:
          "Present information, findings, and supporting evidence clearly, concisely, and logically — applied here to crafting referral asks in the student\u2019s authentic voice.",
      },
      {
        framework: "ISTE",
        code: "7c — Global Collaborator",
        description:
          "Students contribute constructively to project teams, assuming various roles and responsibilities to work effectively toward a common goal.",
      },
      {
        framework: "Jump$tart",
        code: "Financial Decision Making — Standard 2",
        description:
          "Identify the sources of help and information that can guide financial and business decisions, including the role of trusted personal networks.",
      },
    ],
  },
  {
    moduleId: 4,
    lessonId: 4,
    title: "Writing Your First Pitch",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 4 && l.lesson_id === 4)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Communicate the business concept clearly and persuasively to a variety of audiences using a structured pitch format.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.4",
        description:
          "Present information, findings, and supporting evidence clearly, concisely, and logically such that listeners can follow the line of reasoning, with organization, development, substance, and style appropriate to purpose, audience, and task.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.4",
        description:
          "Produce clear and coherent writing in which the development, organization, and style are appropriate to task, purpose, and audience — applied to a 4-part story-based pitch.",
      },
      {
        framework: "ISTE",
        code: "6c — Creative Communicator",
        description:
          "Students communicate complex ideas clearly and effectively by creating or using a variety of digital objects such as visualizations, models, or simulations.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  // MODULE 5 — Run the Numbers
  // ─────────────────────────────────────────────────────────────
  {
    moduleId: 5,
    lessonId: 1,
    title: "Understanding Your Costs",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 5 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard IV",
        description:
          "Identify and calculate the fixed and variable costs of producing a product or delivering a service, including the value of the entrepreneur\u2019s own time.",
      },
      {
        framework: "Common Core Math",
        code: "CCSS.MATH.CONTENT.7.RP.A.3",
        description:
          "Use proportional relationships to solve multi-step ratio and percent problems, including unit cost calculations.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 1",
        description:
          "Develop a plan for spending and saving that accounts for both explicit costs and the implicit cost of time.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard III",
        description:
          "Apply economic concepts of opportunity cost to business decisions, recognizing that uncounted time is uncounted value.",
      },
    ],
  },
  {
    moduleId: 5,
    lessonId: 2,
    title: "Setting Profitable Prices",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 5 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard IV",
        description:
          "Determine pricing strategies that cover total costs (including time) and generate a sustainable profit margin appropriate to the business model.",
      },
      {
        framework: "Common Core Math",
        code: "CCSS.MATH.CONTENT.HSA.CED.A.3",
        description:
          "Represent constraints by equations or inequalities, and interpret solutions as viable or non-viable options in a modeling context — applied to floor pricing calculations.",
      },
      {
        framework: "Jump$tart",
        code: "Spending and Saving — Standard 1",
        description:
          "Discuss how spending, saving, and pricing decisions affect future opportunities, with explicit attention to the confidence gap that leads first-time entrepreneurs (especially young women and minority students) to underprice their work.",
      },
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard III",
        description:
          "Explain the concept of price in terms of supply and demand, value-based pricing, and the role of confidence in defending a price point.",
      },
    ],
  },
  {
    moduleId: 5,
    lessonId: 3,
    title: "Reading Simple Financials",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 5 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard IV",
        description:
          "Maintain basic financial records and interpret them to make informed business decisions, using a simple cash-in/cash-out tracking system.",
      },
      {
        framework: "Common Core Math",
        code: "CCSS.MATH.CONTENT.HSS.ID.B.6",
        description:
          "Represent data on two quantitative variables on a scatter plot, and describe how the variables are related — applied to weekly financial review.",
      },
      {
        framework: "Jump$tart",
        code: "Financial Decision Making — Standard 4",
        description:
          "Apply systematic decision-making processes to evaluate financial information and revise business approaches based on what the numbers reveal.",
      },
      {
        framework: "ISTE",
        code: "5b — Computational Thinker",
        description:
          "Students collect data or identify relevant data sets, use digital tools to analyze them, and represent data in various ways to facilitate problem-solving and decision-making.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────
  // MODULE 6 — Launch and Learn
  // ─────────────────────────────────────────────────────────────
  {
    moduleId: 6,
    lessonId: 1,
    title: "Shipping Before You're Ready",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 6 && l.lesson_id === 1)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Develop and execute an implementation plan that identifies specific activities, timelines, and a defined launch milestone for a real venture.",
      },
      {
        framework: "ISTE",
        code: "4a — Innovative Designer",
        description:
          "Students know and use a deliberate design process for generating ideas, testing theories, creating innovative artifacts, or solving authentic problems.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.10",
        description:
          "Write routinely over extended time frames (time for research, reflection, and revision) and shorter time frames (a single sitting or a day or two) for a range of tasks, purposes, and audiences.",
      },
      {
        framework: "Jump$tart",
        code: "Employment and Income — Standard 4",
        description:
          "Apply entrepreneurial thinking to identify, evaluate, and act on opportunities — including the discipline to launch before perfect.",
      },
    ],
  },
  {
    moduleId: 6,
    lessonId: 2,
    title: "Handling Your First Customer",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 6 && l.lesson_id === 2)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard II",
        description:
          "Implement customer service standards and protocols that build trust, manage expectations, and create the conditions for repeat business.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.6",
        description:
          "Adapt speech to a variety of contexts and tasks, demonstrating command of formal English when indicated or appropriate — applied to professional customer communication.",
      },
      {
        framework: "Jump$tart",
        code: "Risk Management and Insurance — Standard 1",
        description:
          "Identify common types of risks and basic risk management methods — applied to anticipating what could go wrong with a first delivery and planning accordingly.",
      },
      {
        framework: "ISTE",
        code: "7b — Global Collaborator",
        description:
          "Students use collaborative technologies to work with others, including peers, experts, or community members, to examine issues and problems from multiple viewpoints.",
      },
    ],
  },
  {
    moduleId: 6,
    lessonId: 3,
    title: "Getting Feedback",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 6 && l.lesson_id === 3)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Use feedback from customers and stakeholders to evaluate and refine the business plan and operational practices in a continuous improvement cycle.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.SL.9-10.1c",
        description:
          "Propel conversations by posing and responding to questions that probe reasoning and evidence — applied to behavior-based feedback questioning that gets honest answers instead of polite noise.",
      },
      {
        framework: "ISTE",
        code: "1c — Empowered Learner",
        description:
          "Students use technology to seek feedback that informs and improves their practice, and to demonstrate their learning in a variety of ways.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.5",
        description:
          "Develop and strengthen writing as needed by planning, revising, editing, rewriting, or trying a new approach — applied to revising the business based on customer feedback.",
      },
    ],
  },
  {
    moduleId: 6,
    lessonId: 4,
    title: "What to Do After Your First Sale",
    objective:
      LESSON_PLANS.find((l) => l.module_id === 6 && l.lesson_id === 4)
        ?.objective ?? "",
    standards: [
      {
        framework: "NBEA",
        code: "Entrepreneurship Standard V",
        description:
          "Develop a growth strategy that scales an initial sale into a sustainable system, identifying repeatable steps and the next set of customers.",
      },
      {
        framework: "Jump$tart",
        code: "Financial Decision Making — Standard 4",
        description:
          "Apply systematic decision-making processes to evaluate the success of a financial venture and plan next steps based on results, not feelings.",
      },
      {
        framework: "ISTE",
        code: "1b — Empowered Learner",
        description:
          "Students build networks and customize their learning environments in ways that support the learning process — including identifying the next 3 specific people for sale #2.",
      },
      {
        framework: "Common Core ELA",
        code: "CCSS.ELA-LITERACY.W.9-10.10",
        description:
          "Write routinely for reflection — applied to capturing one wisdom takeaway from the entire 22-lesson journey.",
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
              literacy, and career readiness. This page maps all 22 lessons across
              the six modules — Find Your Niche, Know Your Customer, Build Your Brand,
              Get Your First Customer, Run the Numbers, and Launch and Learn — to
              specific standards for easy reference during curriculum reviews and
              procurement.
            </p>
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

          {/* Lesson cards grouped by module */}
          <div className="space-y-10">
            {[
              { id: 1, name: "Find Your Niche" },
              { id: 2, name: "Know Your Customer" },
              { id: 3, name: "Build Your Brand" },
              { id: 4, name: "Get Your First Customer" },
              { id: 5, name: "Run the Numbers" },
              { id: 6, name: "Launch and Learn" },
            ].map((mod) => {
              const moduleLessons = LESSON_STANDARDS.filter((l) => l.moduleId === mod.id);
              if (moduleLessons.length === 0) return null;
              return (
                <div key={mod.id}>
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="font-[family-name:var(--font-display)] text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                      Module {mod.id}
                    </span>
                    <h2 className="font-[family-name:var(--font-display)] text-[24px] font-bold text-[var(--text-primary)]">
                      {mod.name}
                    </h2>
                    <span className="text-xs text-[var(--text-muted)]">
                      {moduleLessons.length} {moduleLessons.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <div className="space-y-6">
                    {moduleLessons.map((lesson) => (
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
                </div>
              );
            })}
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
