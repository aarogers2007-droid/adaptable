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
  lesson_tags: string[]; // Topic tags matching knowledge_base.lesson_tags for RAG context
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
    opener: "Hey {{name}}! So {{business_name}} just got real. Before we go anywhere — picture it actually existing. Your first customer just paid you. What did they pay you for? Tell me in one sentence — what does {{business_name}} actually do?",
    checkpoints: [
      {
        id: "welcome-1",
        concept: "Visualizing the actual transaction",
        question: "Picture your first customer. They just paid you. What did they walk away with — a product, a service, an experience? Tell me what {{business_name}} actually delivers in one sentence.",
        mastery_signal: "Student describes a concrete deliverable — what the customer receives — not an abstract concept",
      },
      {
        id: "welcome-2",
        concept: "Connecting their Ikigai to their personal WHY",
        question: "Now the personal part. You picked {{niche}} for a reason that's bigger than money. Look back at your Ikigai — what about your passions or who you are points you toward this? What drew you in?",
        mastery_signal: "Student articulates a personal reason connected to their passions/skills, not just 'to make money'",
      },
      {
        id: "welcome-3",
        concept: "Understanding that WHY drives every decision",
        question: "One more. Sinek says 'people don't buy what you do, they buy why you do it.' When you eventually pitch {{business_name}} to a customer, what's the belief you want them to share with you? Not the product features. The feeling.",
        mastery_signal: "Student can articulate a feeling or belief their customers would connect with, beyond just the product features",
      },
    ],
    completion_criteria: "Student has connected their Ikigai to their personal WHY, understands the venture studio concept, and can articulate the belief behind their venture (not just the product)",
    personalization_hooks: ["niche", "name"],
    lesson_tags: ["why", "purpose", "ikigai", "golden-circle", "getting-started", "mindset"],
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
    lesson_tags: ["niche-validation", "validation", "product-market-fit", "lean-startup", "business-model"],
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
    lesson_tags: ["competition", "differentiation", "niche-selection", "positioning"],
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
    lesson_tags: ["target-customer", "customer-personas", "jobs-to-be-done", "niche-selection", "value-proposition"],
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
    lesson_tags: ["customer-interviews", "validation", "talking-to-users"],
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
    lesson_tags: ["customer-interviews", "validation", "iteration", "pivoting", "growth-mindset"],
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
    lesson_tags: ["pricing", "set-your-price", "revenue-model", "pricing-confidence"],
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
    lesson_tags: ["first-customers", "customer-acquisition", "marketing", "pitching", "sales"],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 3: Build Your Brand
  // ─────────────────────────────────────────────────────────────
  {
    lesson_id: 1,
    module_id: 3,
    title: "Brand Identity and Voice",
    objective: "Student understands that brand is the gut feeling people have about their business, not the logo, and can describe the feeling {{business_name}} should leave behind",
    opener: "{{name}}, here's a thing most first-time founders get wrong. Brand isn't your logo. Brand isn't your colors. Brand is the GUT FEELING someone has about {{business_name}} when they're not in the room. Jeff Bezos said that. So let me ask you — when someone tells their friend about {{business_name}}, what's the one feeling you want them to walk away with?",
    checkpoints: [
      {
        id: "brand-1",
        concept: "Brand as gut feeling, not visual identity",
        question: "Forget logos for a second. If a customer of {{business_name}} described you to a friend in 5 words, what 5 words would you want them to use? Real teen words, not LinkedIn words.",
        mastery_signal: "Student names 3-5 specific feeling/personality words that aren't generic ('professional', 'quality') but specific ('chill', 'fast', 'real')",
      },
      {
        id: "brand-2",
        concept: "Voice — how the business sounds in writing",
        question: "Now write me one sentence that sounds like {{business_name}} talking. Like, if {{business_name}} sent a DM to a customer, what would the energy of the message be? Show me, don't tell me.",
        mastery_signal: "Student writes a sentence with a recognizable voice — not generic 'we offer X services' corporate-speak",
      },
      {
        id: "brand-3",
        concept: "What the brand is NOT",
        question: "Just as important — what does {{business_name}} NOT want to be? Name something other businesses in your space do that you'd never do. The 'not' tells us who you are.",
        mastery_signal: "Student names a specific anti-pattern they're rejecting (e.g., 'I'm not gonna be the kind that takes 2 weeks to reply' or 'no fake hype')",
      },
    ],
    completion_criteria: "Student has defined the gut-feeling words, written a sample of their brand voice, and named what they're explicitly not.",
    personalization_hooks: ["niche", "name", "business_name", "target_customer"],
    lesson_tags: ["branding", "brand-identity", "differentiation", "positioning"],
  },
  {
    lesson_id: 2,
    module_id: 3,
    title: "Naming Your Business",
    objective: "Student has tested 3 business names with real friends and chosen one that's memorable, ownable, and feels like them",
    opener: "{{name}}, here's the truth about names. The name {{business_name}} is a placeholder. It might be the right name, it might not. Real teen brands like Press Pause, Drip District, Fade Lab — they're SHORT. They evoke a vibe. They don't describe what the business does. So let's find out if {{business_name}} is actually the name, or if there's something better waiting.",
    checkpoints: [
      {
        id: "name-1",
        concept: "Brainstorm 3-5 alternative names",
        question: "Give me 3 to 5 other names you could use for this business. They should be SHORT — 1-3 words. They should not include the words Studio, Lab, Co, Solutions, Services, or Academy. Think feeling, not description.",
        mastery_signal: "Student generates 3+ short, brandable names that don't describe the service literally",
      },
      {
        id: "name-2",
        concept: "The 24-hour name test",
        question: "Pick your top 2 names from that list (including {{business_name}} if it's still in the running). Now here's the test — text them to 3 friends right now. Ask which one they remember tomorrow. Tell me which 2 you sent and who you sent them to.",
        mastery_signal: "Student commits to specific names AND specific people to test with — not 'I'll think about it'",
      },
      {
        id: "name-3",
        concept: "Choosing with conviction",
        question: "Whatever name you end up with, you need to be able to say it out loud without flinching. Practice saying 'Hi, I'm with [name]' three times right now, in your head. Which name doesn't make you cringe? That's the one.",
        mastery_signal: "Student commits to one name with confidence-based reasoning",
      },
    ],
    completion_criteria: "Student has 3+ candidate names, has committed to testing 2 of them with specific friends in the next 24 hours, and has selected a final name they can say out loud.",
    personalization_hooks: ["niche", "name", "business_name"],
    lesson_tags: ["naming", "branding", "visual-identity", "getting-started"],
  },
  {
    lesson_id: 3,
    module_id: 3,
    title: "Designing Your First Impression",
    objective: "Student has chosen 1 color, 1 font, and 1 visual element that represent {{business_name}} — the minimum viable visual identity",
    opener: "{{name}}, here's the rule: pick 1 color and 1 font, and stop. Most first-time entrepreneurs spend 3 weeks on logos and never launch. Glossier built a billion-dollar brand with one shade of pink and Helvetica. So your job today is to PICK. One color. One font. One thing that's recognizably yours.",
    checkpoints: [
      {
        id: "design-1",
        concept: "Choosing one color",
        question: "What ONE color is {{business_name}}? Not three colors, not a palette — one color. Tell me the color and one sentence on why it fits the gut-feeling words you picked in the last lesson.",
        mastery_signal: "Student names one specific color and ties it to the brand feeling",
      },
      {
        id: "design-2",
        concept: "Choosing one font",
        question: "Now ONE font. Hand-written, serif, or sans-serif? Don't tell me a font name yet — tell me which OF THOSE THREE feels right for {{business_name}} and why.",
        mastery_signal: "Student picks one font category with reasoning that ties back to brand voice",
      },
      {
        id: "design-3",
        concept: "The first-impression test",
        question: "Imagine someone sees {{business_name}} for the first time on Instagram. They have 2 seconds. What's the ONE thing they need to immediately understand about you? Not 5 things. One. What is it?",
        mastery_signal: "Student picks one core message they want communicated in 2 seconds",
      },
    ],
    completion_criteria: "Student has committed to 1 color, 1 font category, and 1 first-impression message — the minimum viable visual identity.",
    personalization_hooks: ["business_name", "niche"],
    lesson_tags: ["branding", "visual-identity", "customer-experience"],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 4: Get Your First Customer
  // ─────────────────────────────────────────────────────────────
  {
    lesson_id: 1,
    module_id: 4,
    title: "Zero-Budget Marketing",
    objective: "Student has identified 3 specific zero-budget channels they will use to find their first customer this week",
    opener: "{{name}}, you have $0. Good. Some of the best businesses in history started with $0 of marketing. The secret isn't a budget — it's showing up where your customer already is, with something they actually want. So let's get specific. Where are the people who would pay for {{business_name}} ALREADY hanging out, today, this week, for free?",
    checkpoints: [
      {
        id: "zerom-1",
        concept: "Identifying specific places customers gather",
        question: "Where do your potential customers physically or digitally show up? I need 3 specific places. Not 'social media' — like 'the bus stop at 7am where the moms wait with their kids' or 'the discord for r/teenagers'. Specific.",
        mastery_signal: "Student names 3 SPECIFIC places (named platforms, named locations) where their customer actually is",
      },
      {
        id: "zerom-2",
        concept: "Showing up authentically",
        question: "For the most promising of those 3 places, what's the most natural, non-spammy thing you could DO there this week? Not 'promote my business' — what would help, entertain, or teach the people there?",
        mastery_signal: "Student names a specific helpful action, not a sales pitch",
      },
      {
        id: "zerom-3",
        concept: "Setting the deadline",
        question: "When this week are you doing it? Pick a day and a time. Block it like a real meeting. What's the day?",
        mastery_signal: "Student commits to a specific day this week",
      },
    ],
    completion_criteria: "Student has 3 specific channels, a non-promotional first action, and a committed date this week.",
    personalization_hooks: ["business_name", "niche", "target_customer"],
    lesson_tags: ["marketing", "first-customers", "customer-acquisition", "getting-started"],
  },
  {
    lesson_id: 2,
    module_id: 4,
    title: "Social Media for a Service Business",
    objective: "Student has a 30-day content plan with the 1-1-1 rule — work, customer story, behind-the-scenes — every week",
    opener: "{{name}}, here's the cheat code for social media when you have a service business and zero followers. The 1-1-1 rule: every week, post ONE thing showing the work, ONE thing showing the customer, ONE thing showing the human behind the business. That's it. Three posts a week, 12 a month, every one of them landing a different message. Let's plan yours.",
    checkpoints: [
      {
        id: "social-1",
        concept: "The work post",
        question: "What does 'showing the work' look like for {{business_name}}? Like, give me one specific post idea — what's in the photo or video?",
        mastery_signal: "Student describes a specific 'show the work' post idea (before/after, time-lapse, finished product)",
      },
      {
        id: "social-2",
        concept: "The customer post",
        question: "Now the customer post. You don't need 100 customers — you need ONE story. What's the first customer story you could tell? Even if your first customer is your cousin or your neighbor.",
        mastery_signal: "Student identifies a real or near-future customer they could feature",
      },
      {
        id: "social-3",
        concept: "The behind-the-scenes post",
        question: "And finally — the human post. People follow PEOPLE, not businesses. What's something about YOU that connects to {{business_name}}? Could be why you started, your setup, your morning routine, your weird obsession.",
        mastery_signal: "Student names a personal element that humanizes the business",
      },
    ],
    completion_criteria: "Student has 3 specific post ideas mapping to the 1-1-1 framework that they could shoot in the next 7 days.",
    personalization_hooks: ["business_name", "niche", "name"],
    lesson_tags: ["social-media", "content-marketing", "tiktok", "audience-building", "marketing"],
  },
  {
    lesson_id: 3,
    module_id: 4,
    title: "Word of Mouth and Referrals",
    objective: "Student has a specific word-of-mouth strategy — what they'll say to their first customer to make them tell 2 friends",
    opener: "{{name}}, here's the boring truth about getting customers as a teen: your most powerful channel is the people who already know you. Not Instagram. Not TikTok. Mouths. So the question isn't 'how do I get followers' — it's 'how do I make my first customer love me so much they tell 2 people?'",
    checkpoints: [
      {
        id: "wom-1",
        concept: "The remarkable moment",
        question: "What's ONE thing you can do for your first customer that's small for you but memorable for them? Free upgrade, handwritten thank-you, a tiny extra they didn't expect. Give me your idea.",
        mastery_signal: "Student names one specific small-cost gesture that creates a moment to talk about",
      },
      {
        id: "wom-2",
        concept: "The ask",
        question: "Most teens are scared to ask for referrals. Here's a script that works: 'If you know anyone else who needs this, I'd love it if you sent them my way.' That's it. Now write YOUR version of that line in your own voice — how would you actually say it?",
        mastery_signal: "Student writes a natural-sounding referral ask in their own voice",
      },
      {
        id: "wom-3",
        concept: "The first 5 people you'll tell",
        question: "Forget marketing for a second. Make a list of 5 specific people in your life who you trust enough to tell about {{business_name}} this week. Family doesn't count. Who are they?",
        mastery_signal: "Student lists 5 specific named people from their existing network",
      },
    ],
    completion_criteria: "Student has a remarkable-moment plan, a referral script in their own voice, and a list of 5 specific people they'll tell this week.",
    personalization_hooks: ["business_name", "niche", "name"],
    lesson_tags: ["customer-acquisition", "first-customers", "marketing", "customer-experience"],
  },
  {
    lesson_id: 4,
    module_id: 4,
    title: "Writing Your First Pitch",
    objective: "Student has a 30-second pitch for {{business_name}} they can say out loud without flinching, using a story structure not a feature list",
    opener: "{{name}}, the 30-second pitch is the most underrated tool in your toolkit. It's not for investors. It's for the moment a friend's parent says 'so what are you up to lately?' and you have one chance to plant a seed. We're going to write yours using a 4-part structure: who it's for, what bugs them, what you do, what changes.",
    checkpoints: [
      {
        id: "pitch-1",
        concept: "Who and what bugs them",
        question: "Start with this template: 'You know how [type of person] really wants [thing] but [problem]?' Fill it in for {{business_name}}. Make it sound like a real human said it, not a marketing slide.",
        mastery_signal: "Student writes a specific, problem-first opener that sounds natural",
      },
      {
        id: "pitch-2",
        concept: "What you do, what changes",
        question: "Now finish it: 'Well, I [what you do] so they can [what changes for them].' Same vibe. Specific, not corporate.",
        mastery_signal: "Student completes the pitch with a specific solution and outcome",
      },
      {
        id: "pitch-3",
        concept: "The mirror test",
        question: "Now read your full pitch out loud, twice. Did you flinch? Did anything sound forced? What would a real teen change about it?",
        mastery_signal: "Student edits the pitch based on how it sounded out loud — looking for natural voice over polish",
      },
    ],
    completion_criteria: "Student has a 4-part pitch in their own voice, has read it out loud twice, and made at least one edit for naturalness.",
    personalization_hooks: ["business_name", "niche", "target_customer"],
    lesson_tags: ["pitching", "storytelling", "elevator-pitch", "communication", "first-customers"],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 5: Run the Numbers
  // ─────────────────────────────────────────────────────────────
  {
    lesson_id: 1,
    module_id: 5,
    title: "Understanding Your Costs",
    objective: "Student can list every cost involved in delivering one unit of {{business_name}}, including the trap most teens miss: their own time",
    opener: "{{name}}, this is the lesson that decides whether {{business_name}} pays you back or quietly drains your time. We're going to count EVERY cost. And here's the trap most teens fall into: they forget to count their own hours. If you spend 12 hours making $100 of cookies, you made $8.33 an hour. That's below minimum wage. So let's start counting.",
    checkpoints: [
      {
        id: "cost-1",
        concept: "Counting hard costs (supplies, materials)",
        question: "List every physical thing you need to deliver ONE unit of {{business_name}} (one session, one product, whatever). Be specific — the bottle of polish, the printer paper, the bus ride. Rough cost each.",
        mastery_signal: "Student lists at least 3-5 specific cost items with rough numbers",
      },
      {
        id: "cost-2",
        concept: "Counting time as a cost",
        question: "Now the part teens skip. How many MINUTES does it take to deliver one unit, including prep, the work itself, and follow-up? At minimum wage in your area (call it $15/hour for round numbers), what's that worth?",
        mastery_signal: "Student honestly counts their time and converts to a dollar value",
      },
      {
        id: "cost-3",
        concept: "True total cost per unit",
        question: "Add it up. Hard costs + time cost = the REAL cost of one unit. What's the number?",
        mastery_signal: "Student arrives at a single total cost number that includes time",
      },
    ],
    completion_criteria: "Student has listed hard costs, counted their own time, and arrived at a total per-unit cost figure.",
    personalization_hooks: ["business_name", "niche"],
    lesson_tags: ["financial-literacy", "costs", "unit-economics", "pricing"],
  },
  {
    lesson_id: 2,
    module_id: 5,
    title: "How Real Teens Price Their Work",
    objective: "Student understands the three things that go into a price (time, materials, what comparable work goes for) and walks away with a starting price they understand, can explain, and feel good about",
    opener: "{{name}}, pricing is one of the parts of running a venture that almost nobody teaches well. Let's fix that. By the end of this conversation you'll know exactly what your price represents — the time you put in, the materials you spend, and what other teens are getting for similar work. None of these numbers are right or wrong. They're just the building blocks of a price you can explain to anyone. What kind of work would you most like to put a price on first?",
    checkpoints: [
      {
        id: "ppp-1",
        concept: "What a price actually represents",
        question: "Every price is made of three things: the materials you spend, the time you put in, and the value the customer gets. Pick one specific thing you could sell or do for {{business_name}}. What materials would it take, and roughly how long would the work take?",
        mastery_signal: "Student names a specific deliverable and ballparks the materials cost and time it takes",
      },
      {
        id: "ppp-2",
        concept: "What real teens actually charge",
        question: "Now the comparison piece. Real teens running similar ventures usually charge somewhere in a known range (think Etsy sellers, sneaker customizers, tutoring sites, food creators). Where do you think your work fits in that range, based on what you've seen friends or other teens charge? Just your best guess — there's no wrong answer.",
        mastery_signal: "Student references at least one real comparison point (a friend, an Etsy listing, a tutoring rate they've seen) and places themselves somewhere in that range",
      },
      {
        id: "ppp-3",
        concept: "A starting price you understand",
        question: "Pick a starting number. It's a starting number — not a forever number. You can raise it, lower it, or test it with a few real customers and adjust. What number feels like a fair starting place given what you know now? And in one sentence, how would you explain it to a customer if they asked?",
        mastery_signal: "Student names a starting price and can explain what it represents in their own words (covers materials + time + reflects what comparable work goes for)",
      },
    ],
    completion_criteria: "Student has named a deliverable, costed it out (materials + time), placed themselves in the range of what real teens charge for comparable work, and chosen a starting price they can explain in one sentence.",
    personalization_hooks: ["business_name", "niche"],
    lesson_tags: ["pricing", "pricing-confidence", "profit-margins", "unit-economics"],
  },
  {
    lesson_id: 3,
    module_id: 5,
    title: "Reading Simple Financials",
    objective: "Student has set up a 3-column money-tracking system (date, in, out, why) and committed to a 5-minute weekly review habit",
    opener: "{{name}}, real talk: most teen businesses die from invisible bookkeeping. The owner has no idea if they're making or losing money because they never wrote it down. The fix is dumber than you think: a notebook or a Google Sheet with 4 columns. Date, in, out, why. That's it. No QuickBooks, no apps. Let's set it up.",
    checkpoints: [
      {
        id: "fin-1",
        concept: "Setting up the 4-column system",
        question: "Open a Google Sheet (or grab a notebook) and make 4 columns: Date | In | Out | Why. Tell me when you've done it — and write your first row, even if it's $0 today.",
        mastery_signal: "Student commits to creating the sheet and writes at least one row",
      },
      {
        id: "fin-2",
        concept: "The weekly review habit",
        question: "Pick a day and time every week to spend 5 minutes reviewing the sheet. Sundays at 8pm? Friday after school? When are you doing it?",
        mastery_signal: "Student commits to a specific recurring day and time",
      },
      {
        id: "fin-3",
        concept: "The two questions to ask each week",
        question: "Every week, you ask yourself two questions when you review the sheet: (1) Am I making or losing money this week? (2) What's the biggest cost I could cut? Tell me back what those two questions are so I know it stuck.",
        mastery_signal: "Student can repeat the two questions in their own words",
      },
    ],
    completion_criteria: "Student has set up the 4-column tracking system, committed to a recurring review time, and internalized the two weekly questions.",
    personalization_hooks: ["business_name"],
    lesson_tags: ["financial-literacy", "bookkeeping", "tracking", "habit-building"],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 6: Launch and Learn
  // ─────────────────────────────────────────────────────────────
  {
    lesson_id: 1,
    module_id: 6,
    title: "Shipping Before You're Ready",
    objective: "Student has committed to a specific 'launch' moment this week that's intentionally smaller than they want it to be",
    opener: "{{name}}, this is the one. Reid Hoffman, who built LinkedIn, said: 'If you're not embarrassed by the first version of your product, you launched too late.' Most teen businesses die in the 'almost ready' stage. We're going to fix that. Today. What's the SMALLEST possible version of {{business_name}} you could put in front of a real human this week?",
    checkpoints: [
      {
        id: "ship-1",
        concept: "The minimum viable launch",
        question: "Forget perfect. What's the smallest thing you could deliver to ONE real person in the next 7 days? Not the website, not the logo — the actual product or service, in its crappiest acceptable form. Describe it.",
        mastery_signal: "Student describes a stripped-down deliverable that's intentionally not polished",
      },
      {
        id: "ship-2",
        concept: "Killing the perfectionism trap",
        question: "What are you tempted to wait for before launching? List the things in your head that say 'just one more week and it'll be ready.' Be honest.",
        mastery_signal: "Student names at least 2 specific perfectionism blockers",
      },
      {
        id: "ship-3",
        concept: "The one-person promise",
        question: "Pick ONE specific person you'll deliver this MVL (minimum viable launch) to this week. Name them. Day of the week. Where. What you'll say.",
        mastery_signal: "Student commits to a specific person, day, and opening line",
      },
    ],
    completion_criteria: "Student has defined the smallest possible launch, named their perfectionism traps, and committed to one specific person and day.",
    personalization_hooks: ["business_name", "niche", "name"],
    lesson_tags: ["shipping", "getting-started", "mvp", "iteration", "constraints"],
  },
  {
    lesson_id: 2,
    module_id: 6,
    title: "Handling Your First Customer",
    objective: "Student has a clear protocol for what to do when a real person says yes — communication, delivery, follow-up",
    opener: "{{name}}, let's pretend it just happened. Someone said yes to {{business_name}}. Real money is on the line. Most first-time founders fumble this exact moment. They get scared, they over-promise, they ghost. Today we're building your customer protocol so when it happens, you're ready.",
    checkpoints: [
      {
        id: "first-1",
        concept: "The yes-confirmation message",
        question: "Customer says yes. What's the FIRST message you send them within an hour to confirm everything? Write the actual words.",
        mastery_signal: "Student writes a specific confirmation message that re-states what was agreed and sets a clear next step",
      },
      {
        id: "first-2",
        concept: "Reliability under pressure",
        question: "What could go wrong between now and delivery? List 2 things. For each one, what's your plan if it happens? (Hint: 'tell the customer immediately' is always part of the answer.)",
        mastery_signal: "Student identifies 2 risks and has a 'tell the customer' plan for each",
      },
      {
        id: "first-3",
        concept: "The delivery moment",
        question: "When you actually hand over the thing (or finish the service), what's the one extra small touch that turns this customer into someone who tells their friends? Bring back the remarkable-moment idea from module 4.",
        mastery_signal: "Student names a specific small-cost extra touch tied to their brand",
      },
    ],
    completion_criteria: "Student has a confirmation message, two risk-and-plan pairs, and a remarkable-moment for delivery.",
    personalization_hooks: ["business_name", "niche", "name"],
    lesson_tags: ["service-delivery", "customer-experience", "operations", "reliability"],
  },
  {
    lesson_id: 3,
    module_id: 6,
    title: "Getting Feedback",
    objective: "Student has a 3-question post-delivery feedback script that gets honest answers, not polite noise — and a plan to use what they learn",
    opener: "{{name}}, the moment after the customer pays is the most valuable moment in your business. They're warm, they're open, and they have ONE honest opinion that will save you a hundred bad guesses. Most founders waste it. The Mom Test rule from module 2 still applies: don't ask 'how was it?', ask about specific behavior. Let's write your feedback script.",
    checkpoints: [
      {
        id: "fb-1",
        concept: "The behavior-based feedback question",
        question: "Don't ask 'did you like it?' Ask something behavior-based instead. Try this format: 'What were you doing right before you booked this?' or 'Walk me through what happened when you used it the first time.' Write YOUR version of a behavior question for {{business_name}}.",
        mastery_signal: "Student writes a specific, behavior-based feedback question",
      },
      {
        id: "fb-2",
        concept: "The improvement question",
        question: "The second question is the gold one: 'If you could change ONE thing about this, what would it be?' Most customers will either say 'nothing' (politeness — keep digging) or give you the most valuable answer in your entire business. Write how you'd ask this.",
        mastery_signal: "Student writes the question in their own voice and acknowledges the polite-deflection trap",
      },
      {
        id: "fb-3",
        concept: "Using the feedback",
        question: "Imagine you got an honest answer that says 'the price felt high' or 'I wasn't sure when you'd deliver'. What would you ACTUALLY change? Pick one likely answer and tell me your response.",
        mastery_signal: "Student commits to a concrete change they'd make in response to a specific likely feedback",
      },
    ],
    completion_criteria: "Student has a 2-question feedback script and a pre-committed response to one likely answer.",
    personalization_hooks: ["business_name", "niche"],
    lesson_tags: ["customer-interviews", "iteration", "validation", "growth-mindset"],
  },
  {
    lesson_id: 4,
    module_id: 6,
    title: "What to Do After Your First Sale",
    objective: "Student understands the difference between celebrating one sale (great) and assuming success (dangerous), and has a plan for sale #2",
    opener: "{{name}}, picture it. {{business_name}} just made its first real sale. Real money. Real customer. Now what? This is the moment most teen businesses either become real or become a one-time story. The difference is a single decision: do you treat sale #1 as a fluke or as a system? Today we make it a system.",
    checkpoints: [
      {
        id: "after-1",
        concept: "Celebrating without resting",
        question: "First, the celebration is real. What are you going to do to actually CELEBRATE the first sale? (Tell someone, take a photo, mark it on a calendar — something that makes it count.) Then I want you to commit to ONE thing you'll do within 24 hours of the sale to set up sale #2.",
        mastery_signal: "Student names a celebration AND a 24-hour follow-up action",
      },
      {
        id: "after-2",
        concept: "Repeat the playbook",
        question: "Sale #1 was probably a person you knew. Sale #2 is the test. Who are 3 specific people who are NOT your close friends or family who could be customer #2? Be specific.",
        mastery_signal: "Student names 3 specific people outside their immediate circle",
      },
      {
        id: "after-3",
        concept: "The one thing you'd do differently",
        question: "Looking back at the whole journey from lesson 1 — the Ikigai, the niche, the customer, the price, the launch — what's ONE thing you'd do differently next time? This isn't a regret question, it's a wisdom question.",
        mastery_signal: "Student identifies a specific learning that came from doing the work",
      },
    ],
    completion_criteria: "Student has a celebration plan, a 24-hour next-step, three specific names for sale #2, and one wisdom takeaway.",
    personalization_hooks: ["business_name", "niche", "name"],
    lesson_tags: ["iteration", "growth", "scaling", "mindset", "growth-mindset"],
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
