"use client";

import { useState, useCallback } from "react";

/**
 * BusinessPlanFolder — manila folder preview of a student's completed business plan.
 * Click to open, click through 8 pages, interactive timeline with checkboxes.
 *
 * Props are optional — defaults to Elsa Martinez mock data for the demo page.
 * For the platform /plan page, pass real student data.
 */

interface BusinessPlanFolderProps {
  studentName?: string;
  businessName?: string;
  dateCreated?: string;
  // Page 1: Vision & Ikigai
  ikigai?: { love: string; goodAt: string; needs: string; paid: string };
  whatWeDo?: string;
  whyMatters?: string;
  goldenCircle?: { why: string; how: string; what: string };
  // Page 2: Customer
  targetCustomer?: string;
  customerProfile?: string;
  revenueModel?: string;
  interviewInsights?: string;
  interviewCount?: number;
  // Page 3: Competition
  competitors?: string;
  edge?: string;
  realCompetition?: string;
  // Page 4: Brand
  brandWords?: string;
  brandNot?: string;
  businessNameChoice?: string;
  visualIdentity?: string;
  // Page 5: Marketing
  zeroBudget?: string;
  socialMedia?: string;
  wordOfMouth?: string;
  pitchText?: string;
  // Page 6: Numbers
  costBreakdown?: string;
  pricingRationale?: string;
  trackingSystem?: string;
  // Page 7: Launch
  mvp?: string;
  firstCustomer?: string;
  feedback?: string;
  afterSale?: string;
  // Page 8: Timeline (interactive)
  week1Tasks?: string[];
  week2Tasks?: string[];
  week3Tasks?: string[];
  week4Tasks?: string[];
  foundersLog?: string;
}

// ── Default Elsa Martinez mock data ──

const ELSA_DEFAULTS: Required<BusinessPlanFolderProps> = {
  studentName: "Elsa Martinez",
  businessName: "Elsa's Art Studio",
  dateCreated: "April 2026",
  ikigai: {
    love: "Drawing, painting, pet portraits, watercolors",
    goodAt: "Capturing likeness, color mixing, working from photo references",
    needs: "Affordable custom pet portraits, gifts that feel personal",
    paid: "Per-portrait pricing, $15-35 depending on size and detail",
  },
  whatWeDo: "Custom watercolor pet portraits for classmates and their families \u2014 hand-painted from photos, delivered framed or unframed",
  whyMatters: "I've been drawing animals since I was 8 and people always say my portraits \u201clook alive.\u201d Every portrait I paint is a gift someone gives to a person who loves their pet.",
  goldenCircle: {
    why: "Every pet owner wants to freeze a moment with their best friend. I believe art should be personal, not mass-produced.",
    how: "Hand-painted from the owner's favorite photo.",
    what: "Custom watercolor pet portraits.",
  },
  targetCustomer: "Girls at school whose families have pets \u2014 especially around Christmas, Mother's Day, and pet birthdays. The buyer is usually a parent paying for a gift, or a student buying for their own room.",
  customerProfile: "Sarah, 15. Has a golden retriever named Biscuit that she posts on Instagram constantly. Her mom's birthday is next month and she wants something personal but can\u2019t afford a $200 Etsy commission.",
  revenueModel: "$15 for a 5\u00d77 pencil sketch, $25 for an 8\u00d710 watercolor, $35 for 11\u00d714 with background detail. Payment via Venmo or cash. Takes 3-5 days per portrait.",
  interviewInsights: "People don't just want a picture of their pet \u2014 they want the PERSONALITY captured. \u201cMake him look goofy, that\u2019s how he really is.\u201d The emotional connection matters more than technical accuracy.",
  interviewCount: 4,
  competitors: "My main competitors are Etsy portrait artists ($60-200, 2-4 week wait) and phone filter apps (free but generic). My edge: I'm local, fast (3-5 days), cheap ($15-35), and I know the pets personally \u2014 I can capture personality, not just appearance.",
  edge: "Local, fast (3-5 days), affordable ($15-35), and I know the pets personally.",
  realCompetition: "I'm not competing with professional artists. I'm competing with the \u201cI'll just print a photo at Walgreens\u201d default. My customer is someone who wants something more personal than a photo but can't justify $100+ for professional art.",
  brandWords: "warm, personal, handmade, joyful, real",
  brandNot: "corporate, mass-produced, sterile, generic, \u201cluxury\u201d",
  businessNameChoice: "Elsa's Art Studio \u2014 tested with 5 friends over 24 hours. Runner-ups: \u201cPaws & Paint,\u201d \u201cPet Canvas.\u201d Chose the personal name because customers are buying from ME, not a brand.",
  visualIdentity: "Color: Warm cream (#FFF8F0) \u2014 feels handmade, not clinical. Font: Hand-written category \u2014 matches the hand-painted product. First impression: \u201cThis was made by a real person who cares about your pet.\u201d",
  zeroBudget: "Three channels: (1) Instagram \u2014 post process videos of paintings, (2) school art hallway \u2014 display sample portraits with QR code, (3) word of mouth through friends who have pets. First action: DM 5 classmates with pet Instagrams offering a free sample portrait this week.",
  socialMedia: "1-1-1 rule: one process timelapse, one happy customer reaction, one behind-the-scenes of my workspace. Post 3x/week. Film the painting process on my phone propped against a book.",
  wordOfMouth: "Remarkable moment: include a tiny pencil sketch of the pet on the back of the portrait as a surprise bonus. Referral script: \u201cHey, I painted [friend]'s dog \u2014 she loved it. Want me to do yours? I have two spots open this week.\u201d 5 people to tell: Mom (she knows everyone), my art teacher, Sarah, Diego, Coach Kim (she has 3 dogs).",
  pitchText: "You know how everyone has a million photos of their pet on their phone but nothing on their wall? I paint custom watercolor portraits from your favorite photo \u2014 hand-painted, not printed \u2014 so you get something that actually captures their personality. Most people pay $25 and have it in less than a week.",
  costBreakdown: "Paper: $2 \u00b7 Paints/water: $1 \u00b7 Frame (if included): $4 \u00b7 My time: ~2 hours. Total hard cost: $7. At $25 price \u2192 $18 profit per portrait.",
  pricingRationale: "Etsy custom portraits start at $60. Local print shops charge $15 just for framing. At $25, I'm the only option between \u201cfree phone photo\u201d and \u201c$60+ professional art.\u201d The $15 sketch tier exists for friends who want something but can't spend $25.",
  trackingSystem: "Google Sheet: Date | Money In | Money Out | What For. Review every Sunday at 7pm. Two questions: Am I making more than I'm spending? What's my biggest cost I could cut?",
  mvp: "MVP: one 5\u00d77 pencil sketch for Sarah's dog Biscuit. Not watercolor, not framed \u2014 just the sketch. Perfectionism traps I'm ignoring: \u201cI need a website first,\u201d \u201cI should practice more breeds,\u201d \u201cwhat if the likeness isn't perfect.\u201d Delivering Thursday after school.",
  firstCustomer: "Confirmation: \u201cHey Sarah! I'll have Biscuit's portrait ready by Thursday. I'm working from that photo you posted last week \u2014 the one where he's sleeping on the couch. I'll text you when it's done.\u201d Risk #1: likeness is off \u2192 show her a work-in-progress and ask if she wants changes. Risk #2: she doesn't like it \u2192 offer a redo at no charge. Remarkable moment: include a tiny bonus sketch of Biscuit with sunglasses on the back.",
  feedback: "Two questions: \u201cWalk me through what happened when you showed it to your mom\u201d and \u201cIf you could change one thing about the whole experience \u2014 ordering, waiting, the portrait itself \u2014 what would it be?\u201d Pre-committed response to \u201cit took too long\u201d: offer a rush option at $5 extra for 2-day turnaround.",
  afterSale: "Celebration: photo of me holding the finished portrait \u2192 post on Instagram. 24-hour next action: DM three people who liked the post. Customer #2 targets: Diego (has a cat), my neighbor Mrs. Chen (just got a puppy), my art teacher (has two rescue dogs). Wisdom: \u201cThe hardest part wasn't painting \u2014 it was sending that first DM. Everything after that was just doing the thing I already know how to do.\u201d",
  week1Tasks: [
    "Paint & deliver the MVP sketch of Biscuit to Sarah",
    "Send confirmation DM, deliver, include surprise sketch",
    "Ask Sarah the 2 feedback questions",
    "Post a photo of you holding the finished portrait on Instagram",
  ],
  week2Tasks: [
    "DM Diego, Mrs. Chen, and art teacher with referral script",
    "Set up the Google Sheet tracker, log Sarah's payment as row #1",
    "Post first process timelapse (1-1-1 rule: work post)",
    "Complete and deliver portrait #2",
  ],
  week3Tasks: [
    "Display a sample portrait in the school art hallway with QR code",
    "Post a customer reaction story (1-1-1 rule: customer post)",
    "Sunday 7pm: first weekly financial review",
    "Complete and deliver portrait #3",
  ],
  week4Tasks: [
    "Post a behind-the-scenes photo of your workspace",
    "Review all 3 customers' feedback \u2014 what pattern do you see?",
    "Decide: should you raise your price?",
    "Set your next 30-day goal. Write it down.",
  ],
  foundersLog: "I used to think art was just a hobby. Now I know it\u2019s a skill people will pay for. The weirdest part is that charging money made me take my own work more seriously.",
};

export default function BusinessPlanFolder(props: BusinessPlanFolderProps) {
  const d = { ...ELSA_DEFAULTS, ...props };
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [weekProgress, setWeekProgress] = useState<Record<string, boolean[]>>({
    w1: new Array(d.week1Tasks.length).fill(false),
    w2: new Array(d.week2Tasks.length).fill(false),
    w3: new Array(d.week3Tasks.length).fill(false),
    w4: new Array(d.week4Tasks.length).fill(false),
  });

  const TOTAL_PAGES = 8;

  const openFolder = useCallback(() => {
    setIsOpen(true);
    setCurrentPage(0);
  }, []);

  const closeFolder = useCallback(() => {
    setIsOpen(false);
  }, []);

  const goPage = useCallback((n: number) => {
    setCurrentPage(n);
  }, []);

  const toggleTask = useCallback((week: string, index: number) => {
    setWeekProgress((prev) => {
      const updated = { ...prev };
      updated[week] = [...prev[week]];
      updated[week][index] = !updated[week][index];
      return updated;
    });
  }, []);

  const weekCount = (week: string) => weekProgress[week].filter(Boolean).length;
  const totalChecked = Object.values(weekProgress).flat().filter(Boolean).length;
  const totalTasks = Object.values(weekProgress).flat().length;

  const dots = Array.from({ length: TOTAL_PAGES }, (_, i) => (
    <span
      key={i}
      onClick={() => goPage(i)}
      className={`inline-block w-[7px] h-[7px] rounded-full cursor-pointer transition-all ${
        i === currentPage ? "bg-[var(--primary)] scale-[1.3]" : "bg-[var(--border)]"
      }`}
    />
  ));

  const PageNav = ({ back, next }: { back?: number | "close"; next?: number | "close" }) => (
    <div className="absolute bottom-5 left-9 right-9 flex justify-between items-center z-[5]">
      {back !== undefined ? (
        <button
          onClick={() => (back === "close" ? closeFolder() : goPage(back as number))}
          className="bg-transparent border border-[var(--border)] rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
        >
          &larr; Back
        </button>
      ) : (
        <span />
      )}
      <div className="flex gap-[6px]">{dots}</div>
      {next !== undefined ? (
        <button
          onClick={() => (next === "close" ? closeFolder() : goPage(next as number))}
          className="bg-transparent border border-[var(--border)] rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] cursor-pointer transition-all hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
        >
          {next === "close" ? "Close folder" : "Next \u2192"}
        </button>
      ) : null}
    </div>
  );

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mb-4 last:mb-0">
      <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-[0.05em] mb-[3px]">{label}</div>
      <div className="text-[13px] text-[var(--text-primary)] leading-[1.6]">{children}</div>
    </div>
  );

  const Decision = ({ lesson, text }: { lesson: string; text: string }) => (
    <div className="py-[10px] border-b border-[var(--paper-line)] last:border-b-0">
      <div className="text-[10px] text-[var(--text-muted)] font-medium mb-[2px]">{lesson}</div>
      <div className="text-[13px] text-[var(--text-primary)] leading-[1.55]">{text}</div>
    </div>
  );

  const TaskRow = ({ week, index, text }: { week: string; index: number; text: string }) => (
    <label className="flex items-start gap-2 py-[7px] border-b border-[var(--paper-line)] last:border-b-0 cursor-pointer">
      <input
        type="checkbox"
        checked={weekProgress[week][index]}
        onChange={() => toggleTask(week, index)}
        className="appearance-none w-4 h-4 min-w-[16px] border-2 border-[#D6D3D1] rounded mt-[1px] cursor-pointer transition-all relative bg-white checked:bg-[var(--primary)] checked:border-[var(--primary)] after:content-['\\2713'] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:text-white after:text-[11px] after:font-bold after:opacity-0 checked:after:opacity-100"
      />
      <span className={`text-[12px] text-[var(--text-primary)] leading-[1.45] transition-opacity ${weekProgress[week][index] ? "line-through opacity-50" : ""}`}>
        {text}
      </span>
    </label>
  );

  const WeekBlock = ({ week, label, title, tasks }: { week: string; label: string; title: string; tasks: string[] }) => (
    <div className="mb-4">
      <div className="font-[family-name:var(--font-display)] text-sm font-semibold text-[var(--text-primary)] mb-2 flex justify-between items-center">
        <span>
          <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-[0.08em]">{label}</span> {title}
        </span>
        <span className={`text-[11px] font-semibold ${weekCount(week) === tasks.length ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
          {weekCount(week)}/{tasks.length}
        </span>
      </div>
      {tasks.map((t, i) => (
        <TaskRow key={i} week={week} index={i} text={t} />
      ))}
    </div>
  );

  // Page wrapper with paper styling
  const Page = ({ index, children }: { index: number; children: React.ReactNode }) => (
    <div
      className={`${currentPage === index ? "block" : "hidden"} relative min-h-[660px] m-5 p-10 pb-20 rounded-sm bg-[var(--paper)] animate-[pageIn_0.35s_ease]`}
      style={{
        boxShadow: "0 1px 2px rgba(0,0,0,0.04), 1px 0 0 var(--paper-line), 2px 0 0 #F5F0E8, 3px 0 0 var(--paper-line), 4px 0 0 #F0EBE2",
      }}
    >
      {/* Ruled lines */}
      <div className="absolute inset-0 pointer-events-none rounded-inherit" style={{ background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, var(--paper-line) 27px, var(--paper-line) 28px)", opacity: 0.3 }} />
      {/* Red margin */}
      <div className="absolute left-7 top-0 bottom-0 w-px pointer-events-none" style={{ background: "#E8B4B4", opacity: 0.35 }} />
      {/* Content */}
      <div className="relative z-[1]">{children}</div>
    </div>
  );

  return (
    <div className="relative w-full max-w-[640px]">
      {/* Tab */}
      <div
        className="relative w-[200px] h-8 ml-10 flex items-center justify-center font-[family-name:var(--font-display)] text-xs font-semibold tracking-[0.03em] z-[2]"
        style={{ background: "var(--manila-tab, #CAAD88)", borderRadius: "8px 8px 0 0", color: "var(--text-folder, #6B5B3E)", boxShadow: "0 -1px 3px rgba(0,0,0,0.05)" }}
      >
        {d.businessName}
      </div>

      {/* Folder body */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "var(--manila, #D4B896)",
          borderRadius: "4px 12px 12px 12px",
          minHeight: "700px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.1), inset 0 1px 0 var(--manila-light, #E8D5B8)",
        }}
      >
        {/* Texture */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.008) 3px, rgba(0,0,0,0.008) 4px)", borderRadius: "inherit" }} />
        {/* Crease */}
        <div className="absolute left-6 top-0 bottom-0 w-px pointer-events-none" style={{ background: "linear-gradient(to bottom, transparent 0%, var(--manila-shadow, #B8956A) 10%, var(--manila-shadow, #B8956A) 90%, transparent 100%)", opacity: 0.3 }} />

        {/* ═══ COVER ═══ */}
        <div
          onClick={openFolder}
          className={`absolute inset-0 flex flex-col items-center justify-center p-[60px_40px] cursor-pointer z-10 transition-all duration-500 ${isOpen ? "opacity-0 pointer-events-none -translate-y-[10px]" : ""}`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] opacity-60" style={{ color: "var(--text-folder, #6B5B3E)" }}>Business Plan</div>
          <div className="mt-6 font-[family-name:var(--font-display)] text-4xl font-bold text-center leading-[1.15]" style={{ color: "var(--text-folder, #6B5B3E)" }}>{d.studentName}</div>
          <div className="mt-2 text-base opacity-70" style={{ color: "var(--text-folder, #6B5B3E)" }}>{d.businessName}</div>
          <div className="mt-[6px] text-[13px] opacity-45" style={{ color: "var(--text-folder, #6B5B3E)" }}>Created {d.dateCreated}</div>
          {/* Ikigai circles */}
          <div className="mt-[60px] relative w-[180px] h-[180px]">
            <div className="absolute w-[110px] h-[110px] rounded-full opacity-35 top-0 left-1/2 -translate-x-1/2" style={{ background: "var(--love, #F5E642)" }} />
            <div className="absolute w-[110px] h-[110px] rounded-full opacity-35 top-[35px] left-0" style={{ background: "var(--good-at, #A8DB5A)" }} />
            <div className="absolute w-[110px] h-[110px] rounded-full opacity-35 top-[35px] right-0" style={{ background: "var(--needs, #F4A79D)" }} />
            <div className="absolute w-[110px] h-[110px] rounded-full opacity-35 bottom-0 left-1/2 -translate-x-1/2" style={{ background: "var(--paid, #6DD5D0)" }} />
          </div>
          <div className="mt-12 text-xs opacity-40 tracking-[0.04em]" style={{ color: "var(--text-folder, #6B5B3E)" }}>click to open</div>
        </div>

        {/* ═══ PAGES ═══ */}
        <div className={`relative min-h-[700px] transition-opacity duration-500 delay-200 ${isOpen ? "opacity-100" : "opacity-0"}`}>

          {/* Page 1: Vision & Ikigai */}
          <Page index={0}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 1 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Vision</div>
            <div className="grid grid-cols-2 gap-[6px] mb-5">
              <div className="rounded-[10px] p-[12px_14px]" style={{ background: "var(--love)" }}><div className="text-[10px] font-semibold uppercase tracking-[0.04em] opacity-65 mb-1">What I Love</div><div className="text-xs leading-[1.5] text-[#1C1917]">{d.ikigai.love}</div></div>
              <div className="rounded-[10px] p-[12px_14px]" style={{ background: "var(--good-at)" }}><div className="text-[10px] font-semibold uppercase tracking-[0.04em] opacity-65 mb-1">What I&apos;m Good At</div><div className="text-xs leading-[1.5] text-[#1C1917]">{d.ikigai.goodAt}</div></div>
              <div className="rounded-[10px] p-[12px_14px]" style={{ background: "var(--needs)" }}><div className="text-[10px] font-semibold uppercase tracking-[0.04em] opacity-65 mb-1">What People Need</div><div className="text-xs leading-[1.5] text-[#1C1917]">{d.ikigai.needs}</div></div>
              <div className="rounded-[10px] p-[12px_14px]" style={{ background: "var(--paid)" }}><div className="text-[10px] font-semibold uppercase tracking-[0.04em] opacity-65 mb-1">How I Get Paid</div><div className="text-xs leading-[1.5] text-[#1C1917]">{d.ikigai.paid}</div></div>
            </div>
            <Field label="What We Do">{d.whatWeDo}</Field>
            <Field label="Why This Matters to Me">{d.whyMatters}</Field>
            <Field label="The Golden Circle"><strong>WHY:</strong> {d.goldenCircle.why} <strong>HOW:</strong> {d.goldenCircle.how} <strong>WHAT:</strong> {d.goldenCircle.what}</Field>
            <PageNav next={1} />
          </Page>

          {/* Page 2: Customer */}
          <Page index={1}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 2 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Customer</div>
            <Field label="Target Customer">{d.targetCustomer}</Field>
            <Field label="Customer Profile"><strong>{d.customerProfile.split(".")[0]}.</strong>{d.customerProfile.slice(d.customerProfile.indexOf(".") + 1)}</Field>
            <Field label="Revenue Model">{d.revenueModel}</Field>
            <Field label="Interview Insights"><span className="inline-block px-[9px] py-[2px] rounded-full text-[10px] font-semibold" style={{ background: "rgba(13,148,136,0.08)", color: "var(--primary)" }}>{d.interviewCount} interviews completed</span><br />{d.interviewInsights}</Field>
            <PageNav back={0} next={2} />
          </Page>

          {/* Page 3: Competition */}
          <Page index={2}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 3 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Competition &amp; Differentiation</div>
            <Decision lesson="Research Your Competition" text={d.competitors} />
            <Decision lesson="Define Your Target Customer" text={d.realCompetition} />
            <PageNav back={1} next={3} />
          </Page>

          {/* Page 4: Brand */}
          <Page index={3}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 4 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Brand</div>
            <Field label="Brand Voice"><strong>Gut-feeling words:</strong> {d.brandWords}<br /><strong>We are NOT:</strong> {d.brandNot}</Field>
            <Field label="Business Name">{d.businessNameChoice}</Field>
            <Field label="Visual Identity">{d.visualIdentity}</Field>
            <PageNav back={2} next={4} />
          </Page>

          {/* Page 5: Marketing */}
          <Page index={4}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 5 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Marketing &amp; Sales</div>
            <Decision lesson="Zero-Budget Marketing" text={d.zeroBudget} />
            <Decision lesson="Social Media Strategy" text={d.socialMedia} />
            <Decision lesson="Word of Mouth & Referrals" text={d.wordOfMouth} />
            <div className="mt-2 rounded-xl p-6" style={{ border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)" }}>
              <div className="font-[family-name:var(--font-display)] text-[17px] font-medium text-[var(--text-primary)] leading-[1.65] italic">&ldquo;{d.pitchText}&rdquo;</div>
              <div className="mt-3 text-xs font-medium text-[var(--text-muted)]">&mdash; {d.studentName.split(" ")[0]}, Founder of {d.businessName}</div>
            </div>
            <PageNav back={3} next={5} />
          </Page>

          {/* Page 6: Numbers */}
          <Page index={5}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 6 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">The Numbers</div>
            <Field label="Cost Per Portrait (8&times;10 watercolor)">{d.costBreakdown}</Field>
            <Field label="Pricing Rationale">{d.pricingRationale}</Field>
            <Field label="Tracking System">{d.trackingSystem}</Field>
            <PageNav back={4} next={6} />
          </Page>

          {/* Page 7: Launch */}
          <Page index={6}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 7 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Launch &amp; First Sale</div>
            <Decision lesson="Shipping Before I'm Ready" text={d.mvp} />
            <Decision lesson="First Customer Protocol" text={d.firstCustomer} />
            <Decision lesson="Getting Feedback" text={d.feedback} />
            <Decision lesson="After the First Sale" text={d.afterSale} />
            <PageNav back={5} next={7} />
          </Page>

          {/* Page 8: Timeline */}
          <Page index={7}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-1">Page 8 of {TOTAL_PAGES}</div>
            <div className="font-[family-name:var(--font-display)] text-[22px] font-bold text-[var(--text-primary)] mb-5 leading-[1.25]">Your 4-Week Launch Plan</div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4 leading-[1.5]">Everything you decided across 22 lessons, organized into a month of real action. Check off each task as you go.</p>
            <WeekBlock week="w1" label="Week 1 \u2014" title="Ship to One Person" tasks={d.week1Tasks} />
            <WeekBlock week="w2" label="Week 2 \u2014" title="Get Customers #2 and #3" tasks={d.week2Tasks} />
            <WeekBlock week="w3" label="Week 3 \u2014" title="Build the System" tasks={d.week3Tasks} />
            <WeekBlock week="w4" label="Week 4 \u2014" title="Decide What\u2019s Next" tasks={d.week4Tasks} />
            {/* Progress bar */}
            <div className="mt-5">
              <div className="h-[6px] bg-[var(--bg-muted,#F5F5F4)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(totalChecked / totalTasks) * 100}%`, background: "linear-gradient(90deg, var(--primary), var(--accent))" }} />
              </div>
              <div className="mt-2 text-center text-[13px] font-medium text-[var(--text-secondary)]">{totalChecked}/{totalTasks} tasks complete</div>
            </div>
            {/* Founder's Log */}
            <div className="mt-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--primary)] mb-2">Founder&apos;s Log</div>
              <div className="p-4 rounded-lg border border-dashed border-[var(--border)]" style={{ background: "var(--paper, #FFFEF9)" }}>
                <div className="text-[13px] italic text-[var(--text-secondary)] leading-[1.6]">&ldquo;{d.foundersLog}&rdquo;</div>
              </div>
            </div>
            <PageNav back={6} next="close" />
          </Page>
        </div>
      </div>

      {/* Keyframe for page animation */}
      <style jsx>{`
        @keyframes pageIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
