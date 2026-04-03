/**
 * Lesson plans define what the AI teaches through conversation.
 * Each lesson has:
 * - Key concepts the student must understand
 * - Checkpoints (questions the AI asks to gauge understanding)
 * - Completion criteria (what the student must demonstrate)
 *
 * The AI uses this as a roadmap but delivers everything conversationally.
 * It never shows the student the raw plan.
 */

export interface LessonCheckpoint {
  id: string;
  concept: string;
  question: string; // The AI's opening question for this checkpoint
  mastery_signal: string; // What a good response looks like (for AI evaluation)
}

export interface LessonPlan {
  lesson_id: number; // matches lesson_sequence within module
  module_id: number; // matches module_sequence
  title: string;
  objective: string; // What the student should be able to do after this lesson
  opener: string; // The AI's first message to start the conversation
  checkpoints: LessonCheckpoint[];
  completion_criteria: string; // What the AI evaluates for mastery
  personalization_hooks: string[]; // Which business_idea fields to reference
}

/**
 * All lesson plans. The AI uses these to guide conversations.
 */
export const LESSON_PLANS: LessonPlan[] = [
  // MODULE 1: Find Your Niche
  {
    lesson_id: 1,
    module_id: 1,
    title: "Welcome to Adaptable",
    objective: "Student understands the venture studio concept, connects their Ikigai to their WHY, and feels excited to start",
    opener: "Hey {{name}}! Welcome to your venture studio. Before we get into the business stuff, I want to talk about something Simon Sinek calls your 'WHY.' You already found yours, actually. That Ikigai you just completed? The center of those four circles, where what you love, what you're good at, what the world needs, and what you can be paid for all overlap? That's your WHY. Every great business starts there. Apple doesn't lead with computer specs. They lead with 'Think Different.' The Wright Brothers didn't have funding or degrees, but they had a WHY so strong they beat a Harvard professor with a $50K government grant. Your Ikigai center is that same thing. So tell me, {{name}}, in your own words... why does {{niche}} matter to you?",
    checkpoints: [
      {
        id: "welcome-1",
        concept: "Connecting their Ikigai to their WHY",
        question: "Why does this matter to you? Not the business part, the personal part. What drew you to {{niche}} in the first place?",
        mastery_signal: "Student articulates a personal reason connected to their passions/skills, not just 'to make money'",
      },
      {
        id: "welcome-2",
        concept: "Understanding the venture studio concept",
        question: "Here's what this program is: a venture studio where you'll design every part of your business, from who your customers are to how you'll find them to what you'll charge. Think of it like a flight simulator for entrepreneurs. You make every real decision, build a launch-ready portfolio, and when you're ready, you take it live. Every lesson is personalized to {{business_name}}. What part of building this venture are you most excited about? Or most nervous about?",
        mastery_signal: "Student engages with the venture studio concept and shares excitement or honest nerves",
      },
      {
        id: "welcome-3",
        concept: "Understanding that WHY drives every decision",
        question: "One more thing. Sinek says 'people don't buy what you do, they buy why you do it.' When you eventually pitch {{business_name}} to a customer, what would you want them to feel? Not what you'd tell them about the product, but the belief you want them to share with you.",
        mastery_signal: "Student can articulate a feeling or belief their customers would connect with, beyond just the product features",
      },
    ],
    completion_criteria: "Student has connected their Ikigai to their personal WHY, understands the venture studio concept, and can articulate the belief behind their venture (not just the product)",
    personalization_hooks: ["niche", "name"],
  },
  {
    lesson_id: 2,
    module_id: 1,
    title: "What Makes a Good Business Niche?",
    objective: "Student can evaluate whether their niche has demand, they can deliver, and people will pay",
    opener: "So your niche is {{niche}}. I like it. But let me ask you something... do you actually know if people will pay for this? Like, real money? Let's find out. Who specifically do you think wants {{niche}}?",
    checkpoints: [
      {
        id: "niche-1",
        concept: "Identifying specific demand (not 'everyone')",
        question: "Who specifically wants this? And I mean specifically. Not 'everyone' or 'people who like {{niche}}'. Give me a real person you can picture.",
        mastery_signal: "Student describes a specific type of person with a specific need, not a vague audience",
      },
      {
        id: "niche-2",
        concept: "Understanding their credibility to deliver",
        question: "Okay, now the honest question. Why should someone trust YOU to deliver this? What skill or experience do you have that makes you credible?",
        mastery_signal: "Student identifies a real skill or experience, even if small",
      },
      {
        id: "niche-3",
        concept: "Identifying a revenue model",
        question: "Last one. How would someone actually pay you? Like, what's the transaction? Do they pay per session? Monthly? Per item? What feels natural for {{niche}}?",
        mastery_signal: "Student describes a specific payment model that makes sense for their niche",
      },
    ],
    completion_criteria: "Student can articulate who wants their product/service, why they're credible, and how people would pay. All three answers should be specific to their niche, not generic.",
    personalization_hooks: ["niche", "target_customer"],
  },
  {
    lesson_id: 3,
    module_id: 1,
    title: "Research Your Competition",
    objective: "Student has identified real competitors and can articulate how they're different",
    opener: "{{name}}, let me ask you something. Do you know who else is doing something similar to {{business_name}}? And before you say 'nobody', trust me, someone is. Competition is actually good news. It means there's demand. The question is: how will you be different?",
    checkpoints: [
      {
        id: "comp-1",
        concept: "Identifying real competitors",
        question: "Name one business or person you've seen doing something similar. Could be local, could be online. What do they offer and roughly what do they charge?",
        mastery_signal: "Student names a real competitor with specific details about their offering and pricing",
      },
      {
        id: "comp-2",
        concept: "Finding a differentiation angle",
        question: "Interesting. So what could {{business_name}} do differently or better than them? Think about it from the customer's perspective. What would make someone choose you?",
        mastery_signal: "Student identifies a specific differentiator, not just 'better service' but something concrete",
      },
      {
        id: "comp-3",
        concept: "Understanding competitive positioning",
        question: "Peter Thiel, the guy who started PayPal, says 'competition is for losers'. He means don't compete head-on. Find the corner of the market they're ignoring. Is there a specific group of people that your competitor doesn't serve well?",
        mastery_signal: "Student identifies an underserved segment or angle their competitor misses",
      },
    ],
    completion_criteria: "Student has identified at least one real competitor, articulated a specific differentiator, and identified an underserved angle for their business.",
    personalization_hooks: ["niche", "name", "target_customer"],
  },
  {
    lesson_id: 4,
    module_id: 1,
    title: "Define Your Target Customer",
    objective: "Student has a vivid picture of their ideal customer as a real person",
    opener: "Right now your target customer is '{{target_customer}}'. That's a start, but I want you to make it way more specific. I want you to describe ONE person. Give them a name. How old are they? What's their day like? Why do they need {{business_name}}?",
    checkpoints: [
      {
        id: "customer-1",
        concept: "Creating a specific customer profile",
        question: "Describe this person to me like they're someone you know. Name, age, what's their life like?",
        mastery_signal: "Student creates a vivid, specific person, not a demographic category",
      },
      {
        id: "customer-2",
        concept: "Understanding the customer's problem",
        question: "What specific problem does {{business_name}} solve for this person? And what are they doing right now instead of using you?",
        mastery_signal: "Student articulates a specific pain point and current alternative",
      },
      {
        id: "customer-3",
        concept: "Understanding why they'd switch",
        question: "Here's the hard question. Why would this person switch from whatever they're doing now to YOUR thing? What makes {{business_name}} worth the change?",
        mastery_signal: "Student gives a compelling reason that goes beyond 'it's better' to something specific",
      },
    ],
    completion_criteria: "Student has created a vivid customer profile with a name, specific problem, current alternative, and compelling reason to switch.",
    personalization_hooks: ["niche", "name", "target_customer"],
  },
  // MODULE 2: Know Your Customer
  {
    lesson_id: 1,
    module_id: 2,
    title: "The Customer Interview",
    objective: "Student understands The Mom Test, practices behavior-based questions with AI customers, and learns to distinguish real data from polite noise",
    opener: "{{name}}, you think you know what {{target_customer}} wants. But do you really? There's this book called The Mom Test that says if you ask people 'do you like my idea?', they'll always say yes to be nice. Even your mom. So how do you actually find out the truth? You ask about THEIR life, not your idea. Let me show you what I mean.",
    checkpoints: [
      {
        id: "interview-1",
        concept: "Understanding why direct pitching gives bad data",
        question: "If you walked up to someone and said 'would you use {{business_name}}?', what do you think they'd say? And why might that answer be useless?",
        mastery_signal: "Student understands that people are polite and will say yes even if they don't mean it",
      },
      {
        id: "interview-2",
        concept: "Crafting behavior-based questions",
        question: "Instead of asking about your idea, you ask about their life. Write me 3 questions you'd ask a potential customer. Remember: ask about their past behavior, not hypothetical futures.",
        mastery_signal: "Student writes questions about past behavior ('when was the last time you...') not opinions ('would you use...')",
      },
      {
        id: "interview-sandbox",
        concept: "Practicing interviews with AI customers",
        question: "Great questions. Now let's practice. I've set up 4 potential customers for you to interview. They'll respond just like real people would. Some are genuinely interested, some aren't, and some are just being polite. Your job: figure out which is which using the questions you just learned. Interview at least 2 of them.",
        mastery_signal: "Student has completed the Interview Sandbox and reviewed the debrief. Automatically marked when sandbox is complete.",
      },
    ],
    completion_criteria: "Student understands The Mom Test framework, has crafted behavior-based questions, and has practiced interviewing AI customers in the sandbox, experiencing firsthand how question quality affects response quality.",
    personalization_hooks: ["niche", "name", "target_customer"],
    // Special flag: this lesson triggers the Interview Sandbox after checkpoint 2
  },
  {
    lesson_id: 2,
    module_id: 2,
    title: "What Did You Learn?",
    objective: "Student can extract insights from customer interviews and translate them into business decisions",
    opener: "Okay {{name}}, you just interviewed some potential customers for {{business_name}}. Let's debrief. Not all of those people were real prospects. Some were genuinely interested, some were just being polite, and some were never going to buy. Could you tell the difference? What stood out to you?",
    checkpoints: [
      {
        id: "learn-1",
        concept: "Distinguishing real data from polite noise",
        question: "Which of the people you talked to gave you the most useful information? And which one was just being nice? How could you tell?",
        mastery_signal: "Student can identify that vague enthusiastic responses are less valuable than specific behavioral responses, even if the enthusiastic ones felt better",
      },
      {
        id: "learn-2",
        concept: "Identifying surprising insights",
        question: "Tell me one thing that surprised you from those conversations. Something that made you think differently about {{business_name}}.",
        mastery_signal: "Student shares a genuine surprise or unexpected insight, not a confirmation of what they already believed",
      },
      {
        id: "learn-3",
        concept: "Translating insights into action",
        question: "Based on what you learned, is there anything about {{business_name}} you'd change? Maybe the way you describe it, who you target, or what you offer?",
        mastery_signal: "Student connects interview insights to a specific change in their business approach",
      },
    ],
    completion_criteria: "Student can distinguish genuine interest from polite noise, has identified a surprising insight, and connected it to a concrete change in their business approach.",
    personalization_hooks: ["niche", "name"],
  },
  {
    lesson_id: 3,
    module_id: 2,
    title: "Set Your Price",
    objective: "Student has chosen a specific launch price with reasoning",
    opener: "{{name}}, this is the big one. What should {{business_name}} charge? Before you answer, let me tell you something. Almost every first-time entrepreneur prices too low. Warby Parker almost sold their glasses for $45, but a professor told them people would think they were cheap junk. They went with $95 and built a $6 billion company. So... what are you thinking for your price?",
    checkpoints: [
      {
        id: "price-1",
        concept: "Understanding competitor pricing",
        question: "What do similar businesses charge for something like what you're offering? Give me real numbers if you can.",
        mastery_signal: "Student has done basic research and can cite competitor prices",
      },
      {
        id: "price-2",
        concept: "Choosing a price with reasoning",
        question: "Based on that, what price are you going with for your launch? And more importantly, why that number?",
        mastery_signal: "Student states a specific price and explains their reasoning beyond 'it feels right'",
      },
      {
        id: "price-3",
        concept: "Understanding price as a signal",
        question: "Here's something to think about. Your price tells customers a story about your business before they ever try it. What story does your price tell? Does it say 'premium quality' or 'budget option' or something else?",
        mastery_signal: "Student can articulate what their price signals to customers",
      },
    ],
    completion_criteria: "Student has chosen a specific price, backed it with competitor research, and understands what their pricing signals to customers.",
    personalization_hooks: ["niche", "name", "target_customer"],
  },
  {
    lesson_id: 4,
    module_id: 2,
    title: "Your First 3 Customers",
    objective: "Student has a concrete plan to find and close their first 3 paying customers",
    opener: "{{name}}, you've got {{business_name}}, you know your customer, you've set your price. Now you need customers. Not 100. Not 1,000. Three. Three real people who pay you real money. Paul Graham from Y Combinator says 'do things that don't scale'. The Airbnb founders literally went door to door. So where are YOUR first 3 customers?",
    checkpoints: [
      {
        id: "first3-1",
        concept: "Identifying where customers are",
        question: "Where do your potential customers hang out? Online, in person, both? Be specific. Not 'social media'. Which platform? Which community? Which location?",
        mastery_signal: "Student identifies specific places (a Discord, a local spot, a subreddit, a school club) not vague channels",
      },
      {
        id: "first3-2",
        concept: "Crafting the pitch",
        question: "Write me the exact message or pitch you'd use to reach out to your first potential customer. Like, the actual words you'd say or type.",
        mastery_signal: "Student writes a specific, natural-sounding pitch that mentions the customer's problem and their solution",
      },
      {
        id: "first3-3",
        concept: "Setting a deadline",
        question: "Last thing. When are you doing this? Give me a specific day this week. Not 'soon'. A day.",
        mastery_signal: "Student commits to a specific date",
      },
    ],
    completion_criteria: "Student has identified specific channels, written a real pitch, and committed to a specific date to reach out.",
    personalization_hooks: ["niche", "name", "target_customer"],
  },
];

/**
 * Find a lesson plan by module and lesson sequence.
 */
export function getLessonPlan(
  moduleSequence: number,
  lessonSequence: number
): LessonPlan | null {
  return (
    LESSON_PLANS.find(
      (p) => p.module_id === moduleSequence && p.lesson_id === lessonSequence
    ) ?? null
  );
}
