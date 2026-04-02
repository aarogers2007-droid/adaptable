/*
 * Seed data: sample curriculum for development/testing.
 * Two modules, 4 lessons each. Content uses personalization tokens.
 */

-- Module 1: Find Your Niche
insert into lessons (module_name, module_sequence, lesson_sequence, title, content_template, personalization_prompts, video_url) values
(
  'Find Your Niche', 1, 1,
  'Welcome to Adaptable',
  E'# Welcome to Adaptable\n\nYou''re about to build a real business. Not a pretend one for a grade, a real one that solves a real problem for real people.\n\nIn this program, every lesson is personalized to **your** business idea. The examples, the exercises, the tools... they all reference what you''re actually building.\n\nLet''s start by watching this quick intro from AJ.',
  null,
  'https://www.youtube.com/embed/placeholder-intro'
),
(
  'Find Your Niche', 1, 2,
  'What Makes a Good Business Niche?',
  E'# What Makes a Good Business Niche?\n\nYour niche is **{{niche}}**. That''s a solid starting point. But what makes a niche *good*?\n\nA good niche has three things:\n1. **People who want it** — there''s demand\n2. **You can deliver it** — you have the skills or can learn them\n3. **They''ll pay for it** — there''s a business model\n\nLet''s evaluate your niche against these three criteria.\n\n## Your Exercise\n\nFor your **{{niche}}** business, answer these three questions:\n- Who specifically wants this? (Be concrete: "busy pet owners in my neighborhood," not "everyone")\n- What skill do you already have that makes you credible?\n- How would someone pay you? (Per session? Monthly? Per project?)',
  '{"example_prompt": "Generate 2-3 examples of successful businesses in the {{niche}} space. For each, describe: what they offer, who their customers are, and how they charge. Keep it concrete and relevant to a teenager starting out."}',
  null
),
(
  'Find Your Niche', 1, 3,
  'Research Your Competition',
  E'# Research Your Competition\n\nYou''re building **{{business_name}}** in the **{{niche}}** space. You''re not alone. Other people are already doing something similar, and that''s actually good news.\n\nCompetition means there''s demand. The question isn''t "is anyone else doing this?" It''s "how will I do it differently or better?"\n\n## Your Exercise\n\nFind 3 real businesses or people offering something similar to **{{business_name}}**. For each one:\n- What do they offer?\n- How much do they charge?\n- What do their customers say (reviews, testimonials)?\n- What could you do better or differently?',
  '{"example_prompt": "For a {{niche}} business called {{business_name}} targeting {{target_customer}}, describe 3 real competitors or similar businesses. Include what they charge, what they do well, and where a new entrant could differentiate."}',
  null
),
(
  'Find Your Niche', 1, 4,
  'Define Your Target Customer',
  E'# Define Your Target Customer\n\nRight now your target is: **{{target_customer}}**. Let''s make that sharper.\n\nThe best businesses don''t serve "everyone." They serve a specific person with a specific problem. The more specific you get, the easier everything else becomes: your marketing, your pricing, your product.\n\n## Your Exercise\n\nCreate a customer profile for **{{business_name}}**:\n- **Name:** Give them a first name (makes it real)\n- **Age:** How old are they?\n- **Problem:** What specific problem does your business solve for them?\n- **Current solution:** What are they doing right now instead of using you?\n- **Why you:** Why would they switch to **{{business_name}}**?',
  '{"example_prompt": "Create a sample customer profile for a {{niche}} business targeting {{target_customer}}. Make it vivid and specific. Include a realistic name, age, problem, current solution, and reason to switch."}',
  'https://www.youtube.com/embed/placeholder-customer'
),

-- Module 2: Know Your Customer
(
  'Know Your Customer', 2, 1,
  'The Customer Interview',
  E'# The Customer Interview\n\nYou think you know what **{{target_customer}}** wants. But do you really?\n\nThe fastest way to find out is to ask them. A customer interview is a 10-minute conversation where you learn what real people actually think about the problem your business solves.\n\n## Your Exercise\n\nPrepare 5 questions to ask a potential customer of **{{business_name}}**. Rules:\n- No yes/no questions\n- No leading questions ("Don''t you think...")\n- Start with their problem, not your solution\n- Ask about their current behavior, not hypothetical futures',
  '{"example_prompt": "Generate 5 sample customer interview questions for a {{niche}} business. The business is {{business_name}} targeting {{target_customer}}. Questions should uncover real pain points without leading the customer."}',
  null
),
(
  'Know Your Customer', 2, 2,
  'What Did You Learn?',
  E'# What Did You Learn?\n\nYou talked to real people about **{{niche}}**. What surprised you?\n\nThe best entrepreneurs are surprised by their customer interviews. If nothing surprised you, you probably asked the wrong questions or talked to the wrong people.\n\n## Your Exercise\n\nWrite down your top 3 insights from your customer conversations:\n1. Something that confirmed what you already believed\n2. Something that surprised you\n3. Something that might change how **{{business_name}}** works',
  null,
  null
),
(
  'Know Your Customer', 2, 3,
  'Set Your Price',
  E'# Set Your Price\n\nThis is the moment. How much will **{{business_name}}** charge?\n\nPricing is not math. It''s psychology. Your price tells customers what kind of business you are. Too low = "probably not very good." Too high = "not for me." Just right = "this feels like a fair deal."\n\nYour current thinking: **{{revenue_model}}**\n\n## Your Exercise\n\nResearch and decide:\n- What do competitors charge for similar services?\n- What would make your target customer ({{target_customer}}) feel like they got a great deal?\n- Set your launch price. You can always change it later.',
  '{"example_prompt": "For a {{niche}} business targeting {{target_customer}}, provide pricing research: what do 3 similar businesses charge? What pricing model works best (hourly, per session, monthly, per project)? Recommend a launch price for a teenager just starting out."}',
  'https://www.youtube.com/embed/placeholder-pricing'
),
(
  'Know Your Customer', 2, 4,
  'Your First 3 Customers',
  E'# Your First 3 Customers\n\nYou have a business idea (**{{business_name}}**), a target customer (**{{target_customer}}**), and a price (**{{revenue_model}}**). Now you need customers.\n\nNot 100 customers. Not 1,000. Three.\n\nThree real customers who pay you real money. That''s the goal of this lesson.\n\n## Your Exercise\n\nWrite a plan to get your first 3 paying customers:\n- **Where are they?** (Online? Local? School? Community?)\n- **How will you reach them?** (Post? DM? Flyer? Word of mouth?)\n- **What will you say?** (Write the actual message or pitch)\n- **When will you do it?** (Set a date this week)',
  '{"example_prompt": "For a {{niche}} business called {{business_name}} at {{revenue_model}}, suggest 3 concrete strategies to find the first 3 paying customers. Target audience: {{target_customer}}. Strategies should be realistic for a teenager with no marketing budget."}',
  null
);
