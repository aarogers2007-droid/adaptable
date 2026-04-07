# Knowledge Base Eval Report

Run: 2026-04-07T21:37:28.115Z
Tests: coverage gap, citation hallucination scan, cross-model quality re-eval
Judge: claude-opus-4-6 (cross-model — entries written by Sonnet, judged by Opus)

## TL;DR

### Coverage
- **22/22** lessons have solid KB coverage (2+ entries)
- **0/22** lessons have thin coverage (only 1 entry)
- **0/22** lessons have ZERO KB coverage (silent RAG failure)

### Citations
- **395** total citations across all entries
- **140 (35%)** verified
- **140 (35%)** unverified (may be real, can't confirm)
- **115 (29%)** likely hallucinated — these need to be reviewed and either replaced or flagged

### Quality (cross-model Opus judge)
- **Average score: 23.36/30** across 25 entries
- **4** entries scored 26+/30 (strong)
- **6** entries scored <22/30 (weak — candidates for regeneration)

## Coverage Detail

### 🟢 SOLID COVERAGE

| Module.Lesson | Title | Hits | Tags |
|---|---|---|---|
| M1.L1 | Welcome to Adaptable | 9 | why, purpose, ikigai, golden-circle, getting-started, mindset |
| M1.L2 | What Makes a Good Business Niche? | 6 | niche-validation, validation, product-market-fit, lean-startup, business-model |
| M1.L3 | Research Your Competition | 5 | competition, differentiation, niche-selection, positioning |
| M1.L4 | Define Your Target Customer | 4 | target-customer, customer-personas, jobs-to-be-done, niche-selection, value-proposition |
| M2.L1 | The Customer Interview | 4 | customer-interviews, validation, talking-to-users |
| M2.L2 | What Did You Learn? | 6 | customer-interviews, validation, iteration, pivoting, growth-mindset |
| M2.L3 | Set Your Price | 5 | pricing, set-your-price, revenue-model, pricing-confidence |
| M2.L4 | Your First 3 Customers | 7 | first-customers, customer-acquisition, marketing, pitching, sales |
| M3.L1 | Brand Identity and Voice | 4 | branding, brand-identity, differentiation, positioning |
| M3.L2 | Naming Your Business | 9 | naming, branding, visual-identity, getting-started |
| M3.L3 | Designing Your First Impression | 3 | branding, visual-identity, customer-experience |
| M4.L1 | Zero-Budget Marketing | 12 | marketing, first-customers, customer-acquisition, getting-started |
| M4.L2 | Social Media for a Service Business | 3 | social-media, content-marketing, tiktok, audience-building, marketing |
| M4.L3 | Word of Mouth and Referrals | 8 | customer-acquisition, first-customers, marketing, customer-experience |
| M4.L4 | Writing Your First Pitch | 7 | pitching, storytelling, elevator-pitch, communication, first-customers |
| M5.L1 | Understanding Your Costs | 5 | financial-literacy, costs, unit-economics, pricing |
| M5.L2 | Setting Profitable Prices | 4 | pricing, pricing-confidence, profit-margins, unit-economics, self-worth |
| M5.L3 | Reading Simple Financials | 2 | financial-literacy, bookkeeping, tracking, habit-building |
| M6.L1 | Shipping Before You're Ready | 9 | shipping, getting-started, mvp, iteration, constraints |
| M6.L2 | Handling Your First Customer | 2 | service-delivery, customer-experience, operations, reliability |
| M6.L3 | Getting Feedback | 6 | customer-interviews, iteration, validation, growth-mindset |
| M6.L4 | What to Do After Your First Sale | 6 | iteration, growth, scaling, mindset, growth-mindset |

## Citation Hallucination Scan

Entries ordered by hallucination risk (most concerning first).

### 🔴 The 30-Day Zero-Budget Social Media Sprint: A Step-by-Step Content Plan for Teen Entrepreneurs
- Total citations: 20
- Verified: 4 · Unverified: 3 · Likely hallucinated: 13

**Concerning citations:**
- ? `Content creator Justin Welsh developed the 1-1-1 rule: post 1 piece showing your work process, 1 piece featuring a custo`
  - Justin Welsh is a real creator and solopreneur, but the specific '1-1-1 rule' with this exact formulation is not a well-known framework attributable to him and may be fabricated or conflated.
- ? `Welsh grew his personal brand to 500K+ followers and $2M annual revenue using this exact framework.`
  - Justin Welsh has publicly claimed multi-million-dollar revenue and has a large LinkedIn following, but tying it specifically to the '1-1-1 rule' framework is not confirmable.
- ✗ `Marketing expert Gary Vaynerchuk's data shows posting once daily for 30 days generates 340% more engagement than sporadi`
  - Gary Vaynerchuk advocates for high-volume posting, but the specific '340% more engagement' statistic is not a recognized or verifiable claim from him.
- ✗ `Social media strategist Jasmine Star's analysis of 50,000 small business interactions found that direct messages convert`
  - Jasmine Star is a real social media strategist, but the specific claim of analyzing 50,000 interactions and the precise '10x' conversion figure is not a recognized or verifiable study from her.
- ✗ `Teen jewelry maker Tiana Soto (@TianaMakesJewelry) got 4 paying customers in 30 days by responding to every story commen`
  - There is no verifiable evidence that Tiana Soto or the handle @TianaMakesJewelry is a real person/account; this appears to be a fabricated illustrative example.
- ✗ `TikTok growth expert Sean Cannell identified the top-performing hooks for teen audiences: 'Before/After' (87% completion`
  - Sean Cannell is a real YouTube/video expert (Think Media), but he is primarily known as a YouTube expert, not a TikTok growth expert, and these specific completion rate percentages are not verifiable claims from him.
- ✗ `Tiana Soto, 15, jewelry maker from Phoenix — 200 followers, 4 customers paying $15-45 each, $180 revenue in 30 days.`
  - This appears to be a fabricated case study with specific but unverifiable details about a person who cannot be confirmed to exist.
- ✗ `Marcus Thompson, 16, lawn care service in suburban Dallas — Got 15 neighbor inquiries through Instagram DMs, converted 8`
  - This appears to be a fabricated illustrative example; no verifiable evidence of this specific teen entrepreneur or these specific results exists.
- ✗ `Sofia Chen, 14, tutoring service in Vancouver — Got 50 DMs from classmates' parents, booked 12 tutoring sessions at $25/`
  - This appears to be a fabricated illustrative example; no verifiable evidence of this specific teen entrepreneur or these specific results exists.
- ✗ `"The algorithm doesn't care about your follower count. It cares about engagement rate and posting consistency. A 16-year`
  - Justin Welsh does publish 'The Saturday Solopreneur' newsletter, but this specific quote with the reference to a 16-year-old is not a recognizable quote from him and appears fabricated for this content.
- ✗ `"I made my first $1,000 online at 15 by DMing every single person who liked my posts. Comments are public performances. `
  - Tiana Soto does not appear to be a verifiable public figure, and this quote appears to be entirely fabricated.
- ? `The Instagram algorithm rewards consistent creators with better reach.`
  - This is a widely repeated claim in social media marketing circles and is directionally plausible, but Instagram has not officially confirmed this as a specific algorithmic feature.
- ✗ `Sofia Chen's post: 'Here's what I learned helping my friend raise her math grade from C to A' with screenshot proof.`
  - This is part of the fabricated Sofia Chen case study with unverifiable specific details.
- ✗ `Marcus Thompson used hooks like 'This yard transformation surprised everyone on the street.'`
  - This is part of the fabricated Marcus Thompson case study.
- ✗ `Tiana Soto shared customer wearing her jewelry at homecoming (Week 2 of the sprint).`
  - This is part of the fabricated Tiana Soto case study with unverifiable specific details.
- ✗ `Sean Cannell is a TikTok growth expert.`
  - Sean Cannell is a real person known primarily as a YouTube growth expert (Think Media), not specifically as a TikTok growth expert; this characterization appears inaccurate.

### 🔴 The 5 Teen-Executable Business Models: From Dog Walking to TikTok Fame
- Total citations: 18
- Verified: 3 · Unverified: 4 · Likely hallucinated: 11

**Concerning citations:**
- ✗ `Stripe Atlas data on small business formations shows service-based businesses have a 78% 12-month survival rate compared`
  - Stripe Atlas focuses on incorporation services for startups and does not publish survival rate breakdowns by business type in this manner; these specific percentages are not recognizable.
- ? `Harvard Business School's William Kerr found that introverted entrepreneurs succeed 40% more often in product and subscr`
  - William Kerr is a real HBS professor who studies entrepreneurship, but the specific claim about introvert/extrovert success rates of 40% in these specific model categories is not a recognizable finding from his published work.
- ✗ `Small Business Administration data shows businesses requiring under $1,000 initial investment have 65% higher survival r`
  - The SBA publishes small business statistics but does not publish survival rate data specifically segmented by entrepreneurs under 20 with this specific threshold and percentage.
- ✗ `Jason Cohen, founder of WP Engine, analyzed 500+ small businesses and found service (most unpredictable income), resell `
  - Jason Cohen is the real founder of WP Engine and writes about SaaS/startups, but this specific analysis of 500+ small businesses with this exact taxonomy is not a recognizable claim from his known work.
- ✗ `Rachel Roy Greenheart, age 16, started 'Pet Palace' dog walking service in Portland, Oregon, earning $1,500/month with 2`
  - This person and business cannot be verified and reads like a fabricated illustrative example; the name also oddly echoes fashion designer Rachel Roy.
- ✗ `Maya Patel, 15, sells handmade ceramic mugs on Etsy as 'Maya's Clay Creations', selling 40 mugs monthly at $25 each`
  - This specific person and business cannot be verified and appears to be a fabricated illustrative example.
- ? `Emma Chamberlain now earns $2M+ annually through sponsorships`
  - Emma Chamberlain earns significant income (some estimates put it much higher than $2M), but the exact figure is not publicly confirmed and may be understated.
- ✗ `Coffee Meets Bagel paid Emma Chamberlain $50K for one video in 2019`
  - Coffee Meets Bagel is a dating app, not a typical Chamberlain sponsor; this specific sponsorship deal and amount are not recognizable and appear fabricated.
- ? `97% of teen creators never monetize successfully`
  - Various statistics about creator economy failure rates circulate, but this specific 97% figure for teen creators specifically is not from a verifiable source.
- ✗ `Gymshark sold for $1.3 billion in 2021`
  - Gymshark was not sold; in 2020 General Atlantic acquired a 21% stake valuing the company at approximately £1.3 billion, but Ben Francis retained ownership and the company was not 'sold.'
- ✗ `@sneakerhead_jack on Instagram makes consistent $800/month buying/reselling limited sneakers`
  - This specific Instagram account and earnings claim cannot be verified and appears to be a fabricated illustrative example.
- ✗ `Isabella Dymalovski, 17, started 'Fresh Loaf Weekly' subscription service delivering artisan bread to 45 neighbors, gene`
  - Isabella Dymalovski is a real Australian teen entrepreneur (known for Luv Ur Skin skincare), but 'Fresh Loaf Weekly' bread subscription is not associated with her and appears fabricated.
- ✗ `Reid Hoffman, LinkedIn founder, said 'The best business for a teenager is one where you can fail fast, fail cheap, and l`
  - Reid Hoffman is indeed LinkedIn's co-founder and advocates 'fail fast' philosophy, but this exact quote specifically addressing teenagers is not a recognizable quote from him.
- ✗ `Melanie Perkins, Canva founder, said 'I started with dog walking because it taught me everything about business...'`
  - Melanie Perkins is the real founder of Canva, but she is known for starting with a yearbook design company (Fusion Books), not dog walking; this quote appears fabricated.
- ? `MrBeast (Jimmy Donaldson) said 'Ninety-seven percent of people trying to make money from content creation earn less than`
  - MrBeast (Jimmy Donaldson) is a real creator who discusses creator economy dynamics, and this sentiment aligns with things he's said, but this exact quote with the 97% figure cannot be confirmed as his specific words.

### 🔴 Zero-Budget Branding: The 24-Hour Name Test and 1-Color Rule
- Total citations: 20
- Verified: 5 · Unverified: 7 · Likely hallucinated: 8

**Concerning citations:**
- ? `Igor International's research on 2,000+ brand names shows invented names like 'Xerox' or 'Kodak' are remembered 3x bette`
  - Igor International (now Igor Naming) is a real naming agency, but the specific '2,000+ brand names' study and the '3:1 recall' statistic cannot be confirmed from known publications.
- ? `Lexicon Branding's analysis of Fortune 500 companies found that brands using just one signature color achieved higher re`
  - Lexicon Branding is a real naming firm, but they specialize in naming, not color analysis; this specific study on Fortune 500 color recognition is not attributable to them.
- ✗ `Igor Naming's 'overnight test' - text 3 friends your potential names, ask which they remember the next day - correlates `
  - Igor Naming exists, but the specific '85% correlation with actual customer recall rates' claim and the formal 'overnight test' methodology with this statistic are not confirmable and appear fabricated.
- ✗ `Lexicon Branding's phonetic analysis found that names ending in /li/ or /i/ sounds score 40% higher on 'approachable' ra`
  - Lexicon Branding does study phonetics in naming, but the specific '40% higher approachable ratings' figure is not a known published finding, and examples like Swiffer and Febreze don't actually end in /li/ or /i/ sounds.
- ✗ `Swiffer and Febreze as examples of names ending in /li/ sounds`
  - Swiffer ends in an /ər/ sound and Febreze ends in /iːz/ — neither ends in /li/, contradicting the claim's own examples.
- ✗ `Cluely (social polling app) got 10x more organic mentions on TikTok than 'Teen Opinion Tracker' within first month`
  - There is no verifiable social polling app called 'Cluely' with this specific TikTok performance metric; this appears to be a fabricated example.
- ? `Suno (AI music platform) chose one-word name over 'AI Music Generator Pro', saved $50k on trademark searches, gained 2M `
  - Suno is a real AI music platform, but the specific claims about saving $50k on trademark searches, the rejected alternative name, and the 2M users in 6 months are unverifiable.
- ? `Glossier used only pink color for 3 years, became $1.8B company before adding second color`
  - Glossier is real and was valued at $1.8B in 2021, and pink is their signature color, but the claim they used 'only pink for 3 years before adding a second color' is an oversimplification that isn't precisely documented.
- ? `David Placek said 'The best brand names are short, unique, and easy to say. If your grandmother can't pronounce it, your`
  - While this sentiment aligns with Placek's known views on naming, the exact quote cannot be verified from a known source and may be paraphrased or fabricated.
- ✗ `Igor Elbert as a person associated with Igor International naming research`
  - Igor International (Igor Naming) was not founded by anyone named 'Igor Elbert'; the firm is associated with other principals, and this name appears fabricated.
- ✗ `Igor Elbert said 'We've tested thousands of names. The ones that stick are either really short or have a great story. Ev`
  - The person 'Igor Elbert' at Igor International does not appear to be a real individual, making this quote likely fabricated.
- ? `Steve Manning associated with Igor International's 24-hour test methodology`
  - Steve Manning is a real naming professional (associated with Igor International historically), but the specific '24-hour test methodology' attributed to him and this exact quote cannot be confirmed.
- ✗ `Steve Manning said 'If three friends can't remember your name after one day, a thousand customers won't remember it afte`
  - While Steve Manning is a real naming consultant, this specific quote cannot be traced to any known source and appears fabricated.
- ? `Spotify and Shopify as examples of names ending in /i/ sounds that score higher on approachability`
  - Spotify and Shopify are real companies with names ending in /i/ sounds, but the specific claim that this ending scores higher on approachability ratings is not confirmed by known research.
- ✗ `Short, made-up names outperform descriptive ones by 3:1 in recall tests`
  - This specific 3:1 ratio in recall tests is not traceable to any known published research and appears to be a fabricated statistic.

### 🔴 The 3-Column Money Tracking System: How Teen Entrepreneurs Track Every Dollar in 5 Minutes Per Week
- Total citations: 20
- Verified: 5 · Unverified: 7 · Likely hallucinated: 8

**Concerning citations:**
- ✗ `The 3-Column System was popularized by small business owner Dave Ramsey`
  - Dave Ramsey is a well-known personal finance personality, not typically described as a 'small business owner' who popularized a '3-Column System'; his methods focus on personal budgeting (envelope system, baby steps), not a specific 3-column ledger.
- ✗ `72% of successful small businesses use this system before hiring accountants, according to SCORE mentorship data`
  - This specific 72% statistic attributed to SCORE is not verifiable and has the hallmarks of a fabricated statistic.
- ? `Dan Ariely's behavioral economics research at Duke University shows people who physically write down financial transacti`
  - Dan Ariely is a real behavioral economist at Duke who studies financial decision-making, but these specific percentages (12-18% less spending, 23% more saving) for physical writing vs. digital tracking cannot be confirmed as findings from his published research.
- ? `Financial advisor Suze Orman recommends keeping every business receipt in a physical box or envelope`
  - Suze Orman is a real financial advisor who has given receipt-keeping advice, but she is primarily a personal finance advisor; the specific 'shoebox receipt system' framing for business use is not a well-known Orman recommendation.
- ? `15-year-old Moziah Bridges tracked his bow tie business Mo's Bows from $0 to $200,000 in revenue by age 16`
  - Moziah Bridges and Mo's Bows are real, and he started young, but the specific claim of $200,000 in revenue by age 16 and the attribution to a 'shoebox receipt system' cannot be confirmed with these exact figures.
- ? `Mike Michalowicz's research in 'Profit First' found entrepreneurs who spend 5 minutes weekly reviewing their numbers are`
  - Mike Michalowicz and 'Profit First' are real, and the book advocates regular financial review, but the specific '3x more likely to be profitable' claim from 5-minute weekly reviews is not a verified finding from the book.
- ✗ `Sunday 7pm works for 89% of teen entrepreneurs`
  - This highly specific 89% statistic about teen entrepreneurs preferring Sunday 7pm has no identifiable source and appears fabricated.
- ? `Hart Main started Mandles (candles for men) at age 13 using a composition notebook with three columns`
  - Hart Main and ManCans (often called man candles) are real — he started around age 13, but the specific claim about a composition notebook with three columns is unverifiable.
- ? `Hart Main grew to $1M+ revenue by age 18`
  - Hart Main's candle business was successful, but the specific $1M+ revenue by age 18 figure cannot be confirmed.
- ? `Alina Morse tracked Zollipops in Google Sheets starting at age 9`
  - Alina Morse and Zollipops are real, and she started around age 7-9, but the specific Google Sheets tracking method is unverifiable.
- ✗ `Teen reseller Jacob Komar tracks his sneaker flipping business with Mike Michalowicz's envelope system and made $40,000 `
  - There is no widely known teen entrepreneur named Jacob Komar associated with sneaker flipping and the envelope system; this appears to be a fabricated example.
- ✗ `"I kept every single receipt in a shoebox for two years. That shoebox taught me more about business than any class ever `
  - Moziah Bridges is real and founded Mo's Bows, but this specific quote cannot be found in any known interview or source and appears to be fabricated.
- ✗ `"When you physically write down what you spend, your brain processes it differently than swiping a card. It becomes real`
  - Dan Ariely has discussed the psychology of spending and pain of paying, but this exact quote cannot be verified from his published works or interviews and appears to be a paraphrased fabrication presented as a direct quote.
- ✗ `Hart Main's specific transaction example: Date 11/15/2010, Money In $20 (sold 4 candles), Money Out $12 (wax supplies), `
  - This overly specific ledger entry with exact dates, amounts, and a named customer appears to be a fabricated illustrative example presented as factual.
- ✗ `Alina Morse's specific transaction example: '3/12/2016 | $47.50 | $23.80 | Sold 95 lollipops at soccer game'`
  - This highly specific ledger entry with exact date, amounts, and context appears to be a fabricated illustrative example presented as an actual record.

### 🔴 Why Facts Don't Sell: Using Story Structure to Turn Your 15-Second Hallway Pitch Into Customer Gold
- Total citations: 18
- Verified: 5 · Unverified: 7 · Likely hallucinated: 6

**Concerning citations:**
- ? `Andy Raskin analyzed 100+ successful startup pitches and found the pattern: identify a shift in the world that creates w`
  - Andy Raskin is a real pitch strategist known for his 'Greatest Sales Deck' article, and he does advocate a narrative structure about naming a shift in the world, but the specific claim of analyzing '100+ successful startup pitches' is not a well-known statistic attributed to him.
- ? `Chip Heath's 'Made to Stick' research shows concrete details make stories 6x more memorable than abstract concepts.`
  - Chip Heath and Dan Heath's 'Made to Stick' does emphasize concreteness as a key principle of sticky ideas, but the specific '6x more memorable' statistic is not a well-known finding from the book in that exact form.
- ✗ `The teen baker who said 'I make cakes shaped like the kid's favorite thing - last week I made one shaped like a Switch c`
  - This appears to be a fabricated illustrative example presented as if it were a real documented case with specific conversion statistics.
- ✗ `Maya Chen, 16, Phoenix - went from 10% conversion to 60% conversion rate, $3,000 monthly revenue with her cookie busines`
  - This reads as a fabricated example; there is no verifiable record of a specific teen entrepreneur named Maya Chen in Phoenix with these exact metrics.
- ✗ `Marcus Thompson, 17, Detroit - tutoring business revenue increased from $200 to $1,200 monthly after changing his pitch`
  - This reads as a fabricated example; there is no verifiable record of a specific teen entrepreneur named Marcus Thompson in Detroit with these exact metrics.
- ? `Airbnb's original pitch deck used the Pixar story spine structure`
  - Airbnb's original pitch deck is publicly known and did use narrative elements, but the specific claim that it followed the Pixar story spine format is an interpretive overlay, not a documented fact about how the deck was constructed.
- ? `Airbnb raised $7.2 million Series A`
  - Airbnb's Series A is often reported as $7.2 million (led by Greylock and Sequoia in 2009-2010), though some sources cite slightly different figures; the number is plausible but not precisely confirmable from a single authoritative source.
- ? `"If you confuse, you lose. Customers don't buy the best products; they buy the ones they can understand the fastest." — `
  - Donald Miller does use the phrase 'if you confuse, you'll lose' in his StoryBrand material, but the full quote as presented here may be a paraphrase or composite rather than an exact citation from the book.
- ? `"The most powerful person in the world is the storyteller. The storyteller sets the vision, values, and agenda of an ent`
  - This quote is widely attributed to Steve Jobs (reportedly from a 1994 internal Apple meeting), and Carmine Gallo's book is real, but whether this exact quote appears in that specific book and whether Steve Jobs said these exact words is not firmly verified.
- ✗ `"Facts tell, but stories sell. Your customers' brains are wired to remember stories, not statistics." — Seth Godin, All `
  - Seth Godin's 'All Marketers Are Liars' (later retitled 'All Marketers Tell Stories') is a real book, but this specific quote does not appear to be a recognized passage from it; the phrasing 'facts tell, but stories sell' is a common marketing aphorism not specifically attributed to Godin.
- ? `Chip Heath wrote 'Made to Stick'`
  - Chip Heath co-authored 'Made to Stick' with Dan Heath; attributing it solely to Chip Heath is incomplete but not entirely wrong.
- ✗ `A teen's last student went from D+ to A- in 6 weeks (tutoring example in principles section)`
  - This is presented as a real example with specific grades and timeframe but appears to be a fabricated illustration.
- ✗ `Study group had a 90% pass rate (Pixar story spine example)`
  - This specific statistic appears in a hypothetical example and is not attributed to any verifiable source or real case.

### 🔴 Build Customer Personas From One Real Person You Know
- Total citations: 14
- Verified: 4 · Unverified: 4 · Likely hallucinated: 6

**Concerning citations:**
- ? `IDEO's Tim Brown advocates the 'design for one' principle - start with one specific person's needs rather than broad dem`
  - Tim Brown is the former CEO of IDEO and advocates human-centered design, but the specific 'design for one' principle as a named concept attributed to him is not a well-documented phrase.
- ✗ `Harvard Business School teaches the '5 person rule': if you can't name 5 real people who match your persona, it's a fant`
  - There is no widely documented HBS teaching called the '5 person rule' for customer personas; this specific attribution appears fabricated.
- ? `Revella's research with 100+ companies showed generic personas fail because they don't reveal buying triggers, success f`
  - Revella has conducted extensive research on buyer personas and criticizes demographic-only personas, but the specific '100+ companies' figure is not readily confirmable.
- ✗ `17-year-old Alex Chen built a $2,000/month tutoring business by starting with 'Marcus, a sophomore on my robotics team s`
  - This reads as a fabricated illustrative example; there is no verifiable public record of this specific teen entrepreneur story with these exact details.
- ? `Melanie Perkins started Canva by focusing on her specific persona: 'My university classmates who struggle with design so`
  - Melanie Perkins did co-found Canva and her initial venture (Fusion Books) involved yearbook design, but the specific 'yearbook committee' persona framing and the quote are not verified as her own words.
- ✗ `16-year-old Emma Rodriguez built a $500/month social media management service for 'Mrs. Peterson, owner of the flower sh`
  - This reads as a fabricated illustrative example; there is no verifiable public record of this specific person or business story.
- ✗ `"Don't design for everyone, because then you're designing for no one. Pick one person and design something perfect for t`
  - This specific quote is not attributable to Tim Brown in any verified source; the phrasing appears fabricated, though the general sentiment aligns loosely with design thinking principles.
- ? `"Personas based on demographics and psychographics are not just useless—they're harmful because they give you false conf`
  - Revella has made similar arguments about the inadequacy of demographic personas, but this exact quote cannot be confirmed as her verbatim words.
- ✗ `"If you can't name five real people who represent your target customer, you don't have a customer segment—you have a hyp`
  - This quote is not traceable to any specific HBS case study or methodology; attributing it to 'HBS case study methodology' as a source appears fabricated.
- ✗ `Alex Chen charged $30/hour, found customers through team Slack channels, and scaled to 15 regular students within 4 mont`
  - These specific numerical details are part of the likely fabricated Alex Chen example with no verifiable source.

### 🔴 Operations Excellence for Teen Entrepreneurs: Systems Over Hustle
- Total citations: 12
- Verified: 3 · Unverified: 4 · Likely hallucinated: 5

**Concerning citations:**
- ✗ `Atul Gawande's research at Johns Hopkins showed that simple surgical checklists reduced deaths by 47%`
  - The famous checklist study was a WHO initiative led by Gawande conducted across 8 hospitals worldwide (not specifically 'at Johns Hopkins'), and the commonly cited figure is a 47% reduction in deaths, but that figure comes from the Peter Pronovost central-line checklist study at Johns Hopkins — two different studies are being conflated here.
- ? `McKinsey's customer research shows businesses that deliver on-time 95%+ of the time can charge 15-30% more than competit`
  - McKinsey has published research on reliability and pricing power, but the specific claim of 95%+ on-time delivery commanding exactly 15-30% premium pricing cannot be confirmed as a specific McKinsey finding.
- ? `Profit First recommended allocation for teen businesses: 30% profit, 20% operations/supplies, 50% time/labor`
  - Michalowicz's Profit First does recommend percentage-based allocations, but these specific percentages for 'teen businesses' do not appear to come from the book and seem to be the author's adaptation.
- ✗ `Maya Rodriguez, 14, built a dog-walking business in Brooklyn from 1 to 8 weekly clients using a shared Google Calendar`
  - This reads as a fabricated illustrative example; there is no verifiable public record of this specific teen entrepreneur with these specific metrics.
- ✗ `James Chen, 16, runs a lawn care service in suburban Dallas with a 6-item pre-job checklist and charges $35 vs competito`
  - This reads as a fabricated illustrative example; there is no verifiable public record of this specific teen entrepreneur with these specific metrics.
- ✗ `Sarah Ahmed, 15, operates a tutoring service using Calendly, Venmo, and Google Docs, serving 12 students weekly at $25/h`
  - This reads as a fabricated illustrative example; there is no verifiable public record of this specific teen entrepreneur with these specific metrics.
- ✗ `"Revenue is vanity, profit is sanity, but cash is reality." — Mike Michalowicz, Profit First`
  - This quote is widely attributed to various business figures (often anonymous or attributed to Alan Miltz or others), and is not specifically from Michalowicz's Profit First; misattribution is likely.
- ? `"The customer doesn't care how hard you work, they care that you show up when you say you will." — Danny Meyer, Setting `
  - Danny Meyer is the author of Setting the Table and discusses hospitality and reliability extensively, but this specific quote cannot be confirmed as appearing verbatim in the book.
- ? `Dollar Tree sells $5 supply totes`
  - Dollar Tree has expanded beyond $1 items to include $5 items, but the specific claim of a '$5 supply tote' as a product cannot be specifically confirmed.

### 🔴 Creating Disney-Level Magic Moments in $20 Services: The One-Delight Delivery System
- Total citations: 20
- Verified: 5 · Unverified: 10 · Likely hallucinated: 5

**Concerning citations:**
- ? `Disney's Three-Step Service Model: Look (make eye contact within 10 seconds), Smile, Greet (use the guest's name when po`
  - Disney does have service guidelines and the general spirit is consistent with Disney's training philosophy, but the specific '10 seconds' detail and this exact three-step formulation are not clearly documented in public sources.
- ? `Disney's Net Promoter Score is 77 vs industry average of 31`
  - Disney is known for high NPS scores, but the specific figure of 77 vs. 31 industry average is not reliably confirmed in public sources and varies by division and year.
- ✗ `Danny Meyer's Union Square Hospitality Group proved that when staff feel valued, customer satisfaction scores increase 2`
  - While Meyer advocates for employee-first culture, the specific 23% increase in customer satisfaction scores is not a recognized or documented finding from USHG.
- ? `CustomerThermometer shows 86% of customers will pay more for better experience`
  - A widely cited statistic (often attributed to various sources including PwC and others) states most customers will pay more for better experience, but the specific 86% figure is commonly linked to a different source and the CustomerThermometer attribution is uncertain.
- ✗ `A $1 delight gesture creates 70% repeat customers generating $19 in saved acquisition costs per customer on a $20 servic`
  - These specific numbers (70% repeat rate, $19 saved, $1 gesture) appear to be fabricated illustrative math, not from any published research.
- ? `Sophia, 16, runs a neighborhood dog-walking service for $20/walk with 85% recurring booking rate within one month`
  - This appears to be a hypothetical or composite example; there is no way to verify this specific teen's business or the 85% figure.
- ? `Marcus, 17, offers lawn mowing for $20 with a waiting list that grew to 3 weeks within 2 months`
  - This appears to be a hypothetical or composite example; there is no way to verify this specific teen's business or the waiting list claim.
- ✗ `Emma's homemade cookie delivery ($20 for dozen) achieves 73% reorder rate vs 23% industry average for food delivery`
  - This appears to be a hypothetical example, and the specific '23% industry average reorder rate for food delivery' is not a recognized published statistic.
- ? `Maya Angelou quote is often cited in Disney training materials`
  - While this quote is popular in customer service training contexts, the specific claim that it appears in Disney's official training materials cannot be confirmed from public sources.
- ? `The One-Delight-Per-Delivery Rule as a named framework`
  - This does not appear to be a recognized named framework from any published business or service design literature.
- ? `The $1 Magic Moment Economics as a named concept`
  - This does not appear to be a recognized named framework from any published source.
- ? `Sophia's specific method: texts photo, includes exact route taken, leaves small dog treat with handwritten note`
  - These are plausible best practices but presented as a specific person's documented approach, which cannot be verified.
- ? `Marcus draws a chalk smiley face on the sidewalk and leaves wildflower seeds with instructions`
  - These are plausible creative touches but presented as a specific person's documented approach, which cannot be verified.
- ✗ `Emma asks customers' favorite color during ordering and arranges cookies to spell customer's name`
  - Spelling a customer's name with a dozen cookies is impractical for most names, suggesting this example was fabricated without considering logistics.

### 🔴 Pricing Scripts That Work: How to Quote Your Price Without Apology
- Total citations: 16
- Verified: 5 · Unverified: 6 · Likely hallucinated: 5

**Concerning citations:**
- ? `Ramit Sethi documented in 'I Will Teach You to Be Rich' that every time you undercharge or work for free, you're trainin`
  - Ramit Sethi wrote 'I Will Teach You to Be Rich' and does discuss charging what you're worth, but the specific phrasing about 'training the market' may be paraphrased from his broader body of work (blog, courses) rather than that specific book.
- ✗ `He tracked freelancers who raised rates 1% per week and found they doubled income within a year without losing clients.`
  - There is no known documented study or claim by Ramit Sethi tracking freelancers raising rates 1% per week to double income; this specific numerical claim appears fabricated.
- ✗ `Harvard Business School professor Rafi Mohammed found in 'The Art of Pricing' that businesses adding value through bundl`
  - Rafi Mohammed wrote 'The Art of Pricing' but he is a pricing consultant, not a Harvard Business School professor; additionally, the specific 30-60% and 20-50% figures are not verifiably attributed to his book.
- ? `Zara, a 16-year-old in Atlanta, braided hair for $40 per head and raised to $80, with 6 out of 12 new clients saying yes`
  - This appears to be an illustrative anecdote likely created for the content; there is no way to verify this specific individual or these specific numbers.
- ? `Marcus, 17, tutored math for $15/hour and used Chris Voss's mirroring technique to get $35/hour.`
  - This appears to be a constructed illustrative example; the individual and specific numbers cannot be independently verified.
- ? `Priya, 15, sold custom phone cases for $12 each and increased average sale to $27 using bundling.`
  - This appears to be a constructed illustrative example; the individual and specific numbers cannot be independently verified.
- ✗ `"He who has learned to disagree without being disagreeable has discovered the most valuable secret of negotiation." — Ch`
  - This quote is widely attributed to Robert Estabrook, not Chris Voss, and does not appear in 'Never Split the Difference.'
- ? `"My rate is $X. Does that work for you?" — Ramit Sethi's exact script from I Will Teach You to Be Rich`
  - Ramit Sethi discusses pricing scripts across his courses and blog, but calling this the 'exact script from I Will Teach You to Be Rich' specifically cannot be confirmed; it may come from his other material.
- ✗ `Rafi Mohammed is a Harvard Business School professor`
  - Rafi Mohammed is a pricing strategy consultant and author, not a Harvard Business School professor.
- ? `Rafi Mohammed authored 'The Art of Pricing'`
  - Rafi Mohammed authored 'The Art of Pricing' (2005) and 'The 1% Windfall,' so this book title is correct, though the specific claims attributed to it are unverified.

### 🔴 Marketing Your First Business: Pitching Customers With Zero Budget
- Total citations: 22
- Verified: 10 · Unverified: 8 · Likely hallucinated: 4

**Concerning citations:**
- ? `Glossier spent 4 years building Into The Gloss blog community before launching.`
  - Into The Gloss launched in 2010 and Glossier launched in 2014, which is 4 years, but the claim that it was deliberately a pre-launch strategy from the start is a common narrative simplification; Emily Weiss started the blog as a separate project.
- ? `Glossier: 70% of sales from word of mouth.`
  - Glossier has frequently cited high word-of-mouth and organic growth figures, and some sources mention 70%, but the exact percentage is difficult to independently verify with certainty.
- ? `'If you can convince people to pay $40 for a $4 box of cereal, maybe you can get strangers to stay in other strangers' h`
  - Paul Graham has discussed the Airbnb cereal story and it influenced his decision to accept them into YC, but the exact wording of this quote is not reliably sourced and may be paraphrased or embellished.
- ? `Dollar Shave Club: Servers crashed in 1 hour.`
  - It is well documented that their servers crashed shortly after the video went viral, but the exact '1 hour' timeframe is not consistently reported across sources.
- ? `Dollar Shave Club: 4.75M views in 3 months.`
  - The video went massively viral and accumulated millions of views quickly, but the exact figure of 4.75M in 3 months is difficult to precisely confirm; some sources cite different numbers and timeframes.
- ✗ `Airbnb cereal boxes sold during 2008 DNC.`
  - The cereal boxes were sold around the 2008 presidential election and the Democratic National Convention timing, but most sources say they were sold around the DNC and also beyond it; however, associating the sales specifically with the DNC is a common but slightly imprecise claim — the boxes were created around that time period but sales extended beyond the DNC.
- ✗ `Dollar Shave Club video was 90 seconds long.`
  - The original Dollar Shave Club launch video ('Our Blades Are F***ing Great') is actually about 1 minute and 33 seconds, but it's more commonly described as a roughly 1.5-minute video; however, some descriptions round differently — the actual runtime is closer to 93 seconds, so 90 seconds is a rough approximation but calling it 90 seconds is slightly inaccurate.
- ✗ `Paul Graham quote referencing '$4 box of cereal'`
  - The $4 figure for the base cost of the cereal is a specific detail that is not consistently found in reliable retellings of this story; the actual cost basis of the cereal is not typically specified as $4.
- ? `Cereal boxes sold for $40 each (repeated in examples section)`
  - While $40 is the most commonly cited price, some sources report slightly different prices; the figure is widely repeated but not always consistently verified.

### 🔴 Learning From Failure: How the Best Entrepreneurs Turn Setbacks Into Breakthroughs
- Total citations: 22
- Verified: 12 · Unverified: 6 · Likely hallucinated: 4

**Concerning citations:**
- ? `Dalton Caldwell (YC): 'A pivot means you changed strategy without changing vision.'`
  - Dalton Caldwell is a real YC partner, but this specific quote is more commonly attributed to Eric Ries; cannot confirm Caldwell said this exact phrasing.
- ? `Amazon Fire Phone: $170M write-down.`
  - Amazon took a write-down on Fire Phone inventory; the commonly cited figure is around $170M, but some sources report different amounts and the exact figure is not consistently confirmed.
- ✗ `Echo has sold 500M+ units.`
  - Estimates of Echo/Alexa device sales are typically in the range of 100-200 million units; 500M+ is significantly higher than any credible estimate.
- ? `'I have not failed. I have found 5,126 ways that don't work.' — James Dyson (paraphrasing Edison)`
  - While the content acknowledges it paraphrases Edison, attributing this specific phrasing with the number 5,126 to Dyson cannot be confirmed as a direct quote from him.
- ? `The voice team that built Fire Phone became the Alexa team.`
  - While there is overlap in personnel and the Fire Phone experience contributed to Alexa development, the claim that the Fire Phone voice team directly 'became' the Alexa team is a simplification that cannot be precisely confirmed.
- ? `Founders of YouTube noticed people uploading random clips instead of dating videos and pivoted.`
  - The pivot story is broadly accurate, but the specific narrative that 'nobody uploaded dating videos' and founders observed 'random clips' is a commonly repeated simplification; co-founder accounts vary on exact details.
- ? `Instagram founders noticed users only used photo sharing feature of Burbn and stripped it to one feature.`
  - While this is the broadly accepted narrative, the simplification to 'only used photo sharing' is a popular retelling; the actual pivot process was more nuanced according to co-founder Kevin Systrom's detailed accounts.

### 🔴 The Creative Act: Rick Rubin's Principles Applied to Building Ventures
- Total citations: 20
- Verified: 8 · Unverified: 8 · Likely hallucinated: 4

**Concerning citations:**
- ? `Def Jam started with $5,000`
  - While Def Jam was famously started on a shoestring budget, the specific $5,000 figure is not a widely confirmed number and may be an approximation or fabrication.
- ? `Rubin had zero music industry experience when starting Def Jam`
  - Rubin was a music enthusiast and had been involved in punk and hip-hop scenes, so 'zero experience' is an oversimplification that's hard to confirm as stated.
- ? `First release sold 120K copies`
  - Def Jam's early releases (such as LL Cool J's 'I Need a Beat' or the T La Rock single) were successful, but the specific 120K figure is not a widely confirmed number.
- ? `Rubin produced Adele pop`
  - Rubin is widely reported to have worked with Adele on her album '25' (2015), but his contributions were complicated — some tracks were reportedly scrapped and re-recorded with other producers; the extent of his final credited production is debatable.
- ? `"Creativity is not a rare ability. It is not difficult to access. Creativity is a fundamental aspect of being human. Its`
  - This is consistent with themes in The Creative Act: A Way of Being, but the exact wording may be paraphrased rather than a verbatim quote.
- ? `"The ability to look deeply is the root of creativity. To see past the ordinary and mundane and get to what might otherw`
  - This aligns with the book's themes, but exact wording cannot be confirmed as a verbatim quote.
- ? `"The goal is not to fit in. If anything, its to amplify the differences, what doesnt fit, the special characteristics un`
  - Consistent with the book's themes but exact verbatim wording cannot be confirmed.
- ? `"Setting the bar low frees you to play, explore, and test without attachment to results." — Rick Rubin, The Creative Act`
  - This sentiment appears in the book's philosophy, but the exact phrasing may not be a direct quote and could be paraphrased.
- ✗ `"The more times we can bring ourselves to release our work, the less weight insecurity has." — Rick Rubin, The Creative `
  - While the sentiment is consistent with Rubin's philosophy, this specific phrasing is not a widely recognized quote from the book and appears earlier in the content attributed as a Rubin quote without clear sourcing.
- ✗ `Rubin: "You are either engaging in the practice or you are not. It makes no sense to say you are not good at it."`
  - This specific phrasing is not a widely recognized verbatim Rubin quote and appears to be a paraphrase or fabrication presented as a direct quote.
- ✗ `Rubin: "Make the thing YOU want to exist in the world. If you build for an imagined audience, you build something generi`
  - While Rubin espouses this philosophy generally, this specific phrasing does not match any widely confirmed direct quote and reads like a paraphrase presented as a quotation.

### 🔴 Brand as Gut Feeling: Building a Memorable Identity from Your Bedroom
- Total citations: 20
- Verified: 9 · Unverified: 7 · Likely hallucinated: 4

**Concerning citations:**
- ? `Bernadette Jiwa argues in The Right Story that specificity creates connection.`
  - Bernadette Jiwa is a real brand strategist and author, but her book is titled 'The Right Story' — the specific argument about 'specificity creates connection' as a core thesis is a reasonable paraphrase but not precisely confirmable.
- ? `Trapstar founders Mikey, Lee, and Will started with £1,000 in a Tottenham bedroom.`
  - Trapstar was founded by Mikey Sherpa Trapstar, Lee, and Will in London and began modestly, but the specific £1,000 figure and Tottenham location are not clearly confirmed in reliable sources.
- ✗ `Trapstar founders are described as 'three London teenagers'.`
  - The founders were young men in their early twenties when they started Trapstar around 2005-2008, not teenagers.
- ? `Trapstar is now worth £200+ million.`
  - Trapstar was acquired by Puma in 2023, but the exact valuation of £200+ million is not publicly confirmed.
- ? `Emily Weiss built Into the Gloss beauty blog from her apartment, creating a community of 10 million readers before launc`
  - Into the Gloss was a successful blog that preceded Glossier, but the specific figure of 10 million readers before Glossier's launch is not clearly confirmed and may be inflated.
- ? `Wine Library TV had 90,000 viewers.`
  - Wine Library TV was popular and garnered significant viewership, but the specific 90,000 viewer figure is not precisely confirmable.
- ? `VaynerMedia has $100M+ revenue.`
  - VaynerMedia is a large agency and various reports suggest revenue in this range, but precise revenue figures for the private company are not consistently confirmed.
- ? `'The right story makes people care enough to act' — Bernadette Jiwa, The Right Story`
  - Bernadette Jiwa wrote a book called 'The Right Story,' but this specific quote cannot be confirmed as a direct quote from the book.
- ✗ `'Supreme' suggests exclusivity as a brand name.`
  - While Supreme is a real brand known for exclusivity, claiming the name itself 'suggests exclusivity' is the author's interpretation presented as fact; the word 'supreme' means highest/greatest, not exclusive per se.
- ✗ `'Glossier' suggests effortless beauty as a brand name.`
  - Glossier is derived from 'glossy' which relates to shine/magazines rather than specifically 'effortless beauty'; this is the author's subjective interpretation presented as established fact.

### 🔴 The Hidden Cost Trap: Why Teen Entrepreneurs Accidentally Work for $3/Hour
- Total citations: 15
- Verified: 6 · Unverified: 5 · Likely hallucinated: 4

**Concerning citations:**
- ? `Brad Feld and Jason Mendelson in 'Venture Deals' define contribution margin as revenue per unit minus variable costs per`
  - Brad Feld and Jason Mendelson co-authored 'Venture Deals,' but the book focuses on venture capital term sheets and deal structures, not on defining basic accounting concepts like contribution margin.
- ? `Crumbl Cookies prices their gourmet cookies at $4-5 each when ingredients cost under $1`
  - Crumbl cookies are priced in the $4-5 range, but the specific claim that ingredient costs are under $1 per cookie is not publicly confirmed and may be an approximation.
- ? `Crumbl Cookies solved this by systematizing recipes and charging $4.50 per cookie with $0.75 ingredient cost`
  - The $4.50 price point is roughly plausible, but the specific $0.75 ingredient cost figure is not publicly verified.
- ? `Kylie Cosmetics: LTV of loyal customers exceeds $200 over 2 years while CAC stays under $10`
  - While Kylie Jenner's social media presence kept CAC very low, the specific $200 LTV and sub-$10 CAC figures are not from any publicly confirmed source.
- ? `"Profit is not an event. Profit is not something that happens at year-end after you pay everyone else. Profit must come `
  - The sentiment is entirely consistent with Michalowicz's book, but the exact wording may be paraphrased rather than a verbatim quote.
- ✗ `"If the unit economics don't work, the business doesn't work. Period." — Brad Feld, Venture Deals`
  - This specific quote is not a recognized passage from 'Venture Deals,' and the book's focus is on deal terms rather than unit economics aphorisms.
- ✗ `"The biggest mistake young entrepreneurs make is not valuing their time. If you're making less per hour than you could e`
  - Barbara Corcoran is a real Shark Tank investor, but this specific quote with the 'expensive hobby' phrasing is not verifiably attributed to her and appears to be a commonly paraphrased sentiment fabricated as a direct quote.
- ✗ `Sarah's Cookie Trap example (Made $400 selling 100 cookies at $4 each...)`
  - This appears to be a fabricated illustrative example presented as if it were a real case study of a named person.
- ✗ `Marcus's Tutoring Business example (Charges $25/hour for math tutoring...)`
  - This appears to be a fabricated illustrative example presented as if it were a real case study of a named person.

### 🔴 The 30-Second Pitch as Your Confidence Superpower: How Storytelling Changes Your Posture
- Total citations: 16
- Verified: 6 · Unverified: 6 · Likely hallucinated: 4

**Concerning citations:**
- ? `Amy Cuddy's research at Harvard Business School showed that practicing power poses for 2 minutes increased testosterone `
  - Cuddy's original 2010 study claimed power poses for 2 minutes affected hormones, but the specific figures cited (20% testosterone increase, 25% cortisol decrease) are approximate and the findings have been widely contested and failed to replicate; the exact percentages don't precisely match the original paper.
- ? `Claude Steele's self-affirmation research at Stanford found that when people articulate their values and identity clearl`
  - Claude Steele is a real Stanford psychologist known for self-affirmation theory and stereotype threat research, but the specific claim of '40% less stress response' is not a widely recognized finding and appears to be a fabricated or heavily rounded number.
- ? `Keith Johnstone's improv training research shows that agreement-first responses (acknowledging before adding) create psy`
  - Keith Johnstone is a real improv pioneer who developed foundational improv principles, but characterizing his work as 'research' showing 'psychological safety' is a loose modern reframing, and 'Yes, And' is more associated with Viola Spolin and Del Close than Johnstone specifically.
- ? `Daniel Kahneman's research on cognitive load shows that when responses become automatic (through 10+ repetitions), the b`
  - Kahneman's work on System 1/System 2 thinking does address automaticity and cognitive load, but the specific claim about '10+ repetitions' and the framing about pitching is an extrapolation, not a direct finding from his research.
- ✗ `Maya Chen, 14, created handmade jewelry and practiced her pitch, sold 47 pairs in 3 months, and got 8 orders at her mom'`
  - This reads as a fabricated illustrative example with suspiciously specific details; there is no verifiable record of this person or story.
- ? `David Karp practiced his Tumblr pitch hundreds of times before age 21, starting with 'Tumblr makes it easy to share the `
  - David Karp founded Tumblr at age 20-21 and is known for simple messaging, but the specific claim of 'hundreds of times' of practice and that exact pitch phrasing cannot be confirmed.
- ? `"I didn't know what I was doing, but I knew I had to sound like I knew what I was doing." — Sara Blakely, Spanx founder`
  - While this is consistent with Blakely's style and she has made similar sentiments in interviews, this exact phrasing cannot be confirmed as a direct quote.
- ✗ `"If you can't explain it simply, you don't understand it well enough." — Albert Einstein`
  - This quote is widely attributed to Einstein on the internet but there is no verified source confirming he actually said or wrote it; it is a common misattribution.
- ✗ `Keith Johnstone developed the 'Yes, And' principle.`
  - 'Yes, And' is most associated with the Chicago improv tradition (Viola Spolin, Del Close, Second City), not Keith Johnstone, who is known for Theatresports and status work; attributing 'Yes, And' specifically to Johnstone is inaccurate.
- ✗ `Practicing power poses for 2 minutes is based on Amy Cuddy's research at Harvard Business School.`
  - Cuddy's original power pose research was conducted while she was at Harvard Business School, but the research was co-authored with Dana Carney at UC Berkeley; more importantly, the specific numerical claims (20% testosterone, 25% cortisol) do not match the original 2010 paper's reported figures and the core hormonal findings failed replication, with co-author Carney publicly disavowing them.

### 🔴 Jobs-To-Be-Done Framework: Understanding WHY Customers Hire You
- Total citations: 18
- Verified: 6 · Unverified: 8 · Likely hallucinated: 4

**Concerning citations:**
- ? `A teen tutor discovered parents weren't hiring her for 'math help for struggling student' but for '60 minutes of quiet w`
  - This appears to be an illustrative anecdote; there is no verifiable source for this specific teen tutor story in published JTBD literature.
- ? `Tony Ulwick's Outcome-Driven Innovation research found successful products address all three: functional, emotional, and`
  - Tony Ulwick is a real JTBD researcher who developed Outcome-Driven Innovation, but his framework focuses primarily on functional outcomes and desired outcomes; the three-dimension framing (functional, emotional, social) is more commonly attributed to Christensen and Moesta, not specifically to Ulwick's ODI.
- ? `Airbnb succeeded because it wasn't just 'cheap lodging' - it was 'feel like a local' (emotional) and 'I'm a savvy travel`
  - Airbnb's 'live like a local' branding is well known, but attributing its success specifically to these JTBD dimensions as a research finding is an editorial interpretation, not a verified cited study.
- ? `Harvard Business School research shows the same product often gets hired for different jobs by different people.`
  - This is a general JTBD principle associated with HBS-affiliated researchers like Christensen, but no specific HBS study is cited to verify this exact claim.
- ? `Netflix gets hired for 'background noise while I clean' by some customers and 'family bonding time' by others.`
  - Netflix competing with a wide range of activities is a concept Reed Hastings has discussed (e.g., 'we compete with sleep'), but these specific job descriptions are illustrative examples, not verified research findings.
- ? `Sarah, a 16-year-old from Kenya, started tutoring younger students... raised her rates 40%.`
  - This appears to be a constructed illustrative example for educational purposes; no verifiable source exists for this specific person or outcome.
- ? `Marcus, 17, from Detroit, sold custom phone cases on Instagram... increasing sales 3x in two months.`
  - This appears to be a constructed illustrative example for educational purposes; no verifiable source exists for this specific person or outcome.
- ? `Clayton Christensen's McDonald's milkshake study found 40% of milkshakes were sold before 8am.`
  - The milkshake study is real and morning commuters were a large segment, but the specific '40%' figure is not consistently cited in published accounts of the study and may be approximate or fabricated.
- ✗ `Understanding the job led to specific product improvements that increased morning sales by 7x.`
  - The '7x increase in morning sales' is not a figure found in Christensen's published accounts of the milkshake study; this specific numerical claim appears fabricated.
- ? `"We hire products to do jobs for us. And if they do the job well, we'll hire them again. If they do it poorly, we fire t`
  - This captures Christensen's core idea accurately and he was at HBS, but the exact phrasing may be a paraphrase rather than a verbatim quote from a specific source.
- ✗ `Sarah pivoted to marketing 'homework supervision' instead of 'math tutoring' — described as demonstrating 'same service,`
  - This is presented as a real case study but is almost certainly a fabricated illustrative example, as no verifiable source exists.
- ✗ `Marcus switched from advertising durability to featuring unique designs — described as demonstrating 'emotional and soci`
  - This is presented as a real case study but is almost certainly a fabricated illustrative example with unverifiable specific numerical claims (3x sales increase).

### 🔴 Lean Canvas: Map Your Business Idea on One Page Before Spending a Dollar
- Total citations: 16
- Verified: 5 · Unverified: 7 · Likely hallucinated: 4

**Concerning citations:**
- ✗ `He found that 70% of failed startups built something nobody wanted because they started with their solution instead of v`
  - The commonly cited statistic (from CB Insights) is that 42% of startups fail because there's no market need; the 70% figure attributed specifically to Maurya with this framing is not a recognized statistic.
- ✗ `Alexander Osterwalder's research on 500+ business models shows that vague revenue plans like 'we'll charge for premium f`
  - While Osterwalder is a real business model researcher, there is no known published study by him citing 500+ business models with an 85% failure rate for vague revenue plans.
- ✗ `Steve Blank's analysis of 3,200 startups found that 92% of failed companies had great products but terrible customer acq`
  - Steve Blank is a well-known startup educator, but the specific claim of analyzing 3,200 startups with a 92% channel-failure finding is not a recognized publication or statement of his.
- ? `16-year-old Maya from Toronto planned to sell hand-painted phone cases... Made $2,400 in her first month`
  - This appears to be an illustrative example likely created for educational purposes; there is no way to confirm this specific individual or these specific numbers.
- ? `Warby Parker founders used a lean canvas equivalent in 2008 to identify their key assumption: people would buy glasses o`
  - Warby Parker was founded around 2010 (launched 2010), not 2008, and while they did test online glasses buying, whether they used a formal lean canvas equivalent is not publicly confirmed.
- ? `Warby Parker validated the model with $1M revenue in first year`
  - Warby Parker reportedly sold out of its initial inventory very quickly, but the specific $1M first-year revenue figure is not a widely confirmed public number.
- ? `Warby Parker now worth $3 billion`
  - Warby Parker went public in 2021 and its valuation has fluctuated significantly; at various points it was valued around $3B but this depends on the date referenced.
- ? `17-year-old James in Lagos, Nigeria wanted to start a tutoring service... Now tutors 15 students weekly earning $150/wee`
  - This appears to be a constructed illustrative example for educational purposes; the specific individual and numbers cannot be confirmed.
- ? `"The biggest risk is not taking any risk... In a world that's changing quickly, the only strategy that is guaranteed to `
  - This quote is widely attributed to Zuckerberg, but its specific attribution to the F8 Conference 2011 is not reliably confirmed; it may originate from a different setting.
- ✗ `Warby Parker founders used a lean canvas equivalent in 2008`
  - Warby Parker was conceived in 2009 and launched in 2010; the 2008 date appears to be inaccurate.
- ? `Maya got 50,000 views in one week on TikTok`
  - This is part of an illustrative anecdote that cannot be independently verified.

### 🔴 Pricing Confidence: Breaking the Undercharging Pattern for Women and Minority Entrepreneurs
- Total citations: 20
- Verified: 7 · Unverified: 9 · Likely hallucinated: 4

**Concerning citations:**
- ? `Linda Babcock's Carnegie Mellon research found women negotiate salary 4x less than men.`
  - Linda Babcock at Carnegie Mellon did find women negotiate less often, but her commonly cited figure is that men initiate negotiations about 4x more often; the exact '4x' framing varies across her publications and may be slightly simplified.
- ? `Black women entrepreneurs charge 30-40% less than white men for equivalent services according to Project Diane's 2018 st`
  - Project Diane (by digitalundivided) studied Black and Latina women-led startups, but the specific claim of 30-40% lower pricing and the figure of 88,000 startups cannot be confirmed; the studies focused more on funding gaps than pricing gaps.
- ? `Financial educator Patrice Washington teaches switching from 'Am I worth this?' to 'Is this fair for the value I'm provi`
  - Patrice Washington is a real financial educator and author, but this specific reframing technique with these exact terms cannot be confirmed as her specific teaching.
- ✗ `Business coach Tara McMullin's 'mirror technique' involves saying your price out loud 10 times while looking at yourself`
  - Tara McMullin (formerly Tara Gentile) is a real business strategist, but the specific 'mirror technique' of saying your price 10 times is not a recognized teaching attributed to her and appears fabricated.
- ? `Studies show physical practice reduces cortisol (stress hormone) when stating prices in real situations.`
  - While rehearsal and exposure therapy are known to reduce stress responses, no specific study about cortisol reduction when stating prices can be confirmed.
- ? `Sociologist Gloria Steinem documented how women are socialized to be caregivers first, creating guilt about 'taking too `
  - Gloria Steinem is a feminist activist and writer (not typically described as a sociologist) who has written extensively about gender socialization, but the specific framing about guilt around 'taking too much' is loosely attributed.
- ? `Sara Blakely priced Spanx at $20 when 'reasonable' comparable products were $6-8.`
  - Spanx launched around $20 retail, but the claim that comparable products were specifically $6-8 is not well-documented and may be an approximation or fabrication.
- ✗ `Whitney Wolfe Herd initially wanted to give away Bumble for free because she felt guilty charging for dating.`
  - While Whitney Wolfe Herd founded Bumble, there is no well-documented account of her wanting to make it entirely free out of guilt; the freemium model was a standard business strategy, and the guilt narrative appears fabricated.
- ? `Bumble premium was priced at $9.99/month.`
  - Bumble's premium pricing has varied over time and by region; $9.99/month is plausible but not precisely confirmable as the initial or standard price point.
- ? `Bumble reached $2.2 billion valuation by 2021.`
  - Bumble's IPO in February 2021 valued the company at roughly $8.2 billion, far exceeding $2.2 billion; the $2.2 billion figure may confuse an earlier private valuation, making this claim misleading.
- ? `Sixteen-year-old Moziah Bridges (Mo's Bows) initially priced custom bow ties at $15.`
  - Moziah Bridges is the real founder of Mo's Bows and appeared on Shark Tank, but the specific initial price of $15 cannot be independently confirmed.
- ? `Mo's Bows revenue jumped from $1,000 to $150,000 annually.`
  - Mo's Bows did experience significant revenue growth, but the specific figures of $1,000 to $150,000 cannot be precisely confirmed from public sources.
- ✗ `"I've never met a woman who negotiated her salary. I've met thousands who wished they had." — Linda Babcock, Women Don't`
  - Linda Babcock co-authored 'Women Don't Ask,' but this specific quote does not match known excerpts from the book; it appears to be a fabricated or paraphrased attribution.
- ? `"The question isn't whether you're worth it. The question is whether your price reflects the transformation you provide.`
  - Patrice Washington is a real financial educator, but this specific quote cannot be confirmed from public sources and may be paraphrased or fabricated.
- ✗ `"I knew if I could make women feel better about themselves, they would pay $20 for it." — Sara Blakely, Spanx founder`
  - While Sara Blakely has spoken publicly about her confidence in Spanx's value, this specific quote with this exact phrasing does not appear in verified public interviews or speeches.

### 🔴 Content-First Strategy: Building Your Audience Before Your Product Using TikTok and Instagram Reels
- Total citations: 20
- Verified: 6 · Unverified: 10 · Likely hallucinated: 4

**Concerning citations:**
- ? `Marie Poulin built a 6-figure business by focusing specifically on Notion tutorials for entrepreneurs.`
  - Marie Poulin is a real person known for Notion-related content and courses, but the specific claim of a 6-figure business specifically from Notion tutorials for entrepreneurs is not precisely confirmable.
- ? `Marketing research shows people need an average of 7 exposures to a brand before making a purchase decision (Seven-Touch`
  - The 'Rule of 7' is a widely cited marketing heuristic, but its origin is often attributed loosely to 1930s movie industry research and lacks a single definitive peer-reviewed source confirming exactly 7 exposures.
- ? `Chamberlain Coffee generated over $1 million in first-year revenue.`
  - Chamberlain Coffee's specific first-year revenue figures are not publicly confirmed; $1 million is plausible but not verifiable from public sources.
- ? `Marie Poulin spent 18 months creating free Notion tutorials on YouTube and Instagram.`
  - Marie Poulin is known for Notion content, but the specific 18-month timeline is not confirmable from public sources.
- ? `Marie Poulin built an email list of 15,000 people before launching her $1,997 Notion course.`
  - Marie Poulin did sell Notion-related courses, but the specific email list size of 15,000 and exact price of $1,997 are not publicly verified.
- ? `Marie Poulin's Notion course generated $300,000 in the first launch.`
  - This specific revenue figure for a first launch is not confirmable from public sources.
- ? `Eitan Bernath started documenting his cooking experiments at age 12 on TikTok.`
  - Eitan Bernath is a real young food content creator who gained fame on TikTok, but the exact age of 12 for starting TikTok specifically is not precisely confirmed (he was known on social media from a young age but initially gained attention on other platforms).
- ? `Eitan Bernath grew to 2.3 million followers on TikTok.`
  - Eitan Bernath has millions of TikTok followers, but the exact figure of 2.3 million may not reflect any confirmed snapshot and follower counts fluctuate.
- ? `Eitan Bernath published a cookbook that became a New York Times bestseller at age 19.`
  - Eitan Bernath did publish a cookbook ('Eitan Eats the World', 2022), but its status as a NYT bestseller is not clearly confirmed in reliable sources.
- ? `Wisdom Kaye had brand partnerships with Nike, Converse, and his own clothing line collaborations worth six figures annua`
  - Wisdom Kaye has had high-profile fashion partnerships (he notably walked for Balmain), but specific partnerships with Nike and Converse and the six-figure annual figure are not publicly confirmed in detail.
- ✗ `"Document your journey. The world will learn with you, and you will build an audience along the way." — Gary Vaynerchuk,`
  - While Gary Vaynerchuk wrote 'Crushing It!' and advocates documenting, this exact quote phrasing does not appear to be a verified direct quote from the book.
- ✗ `"I think the biggest mistake people make is thinking they need to have everything figured out before they start sharing.`
  - Marie Poulin may have appeared on ConvertKit content, but this exact quote and its specific attribution to a 'ConvertKit Creator Stories interview' cannot be verified and reads like a fabricated paraphrase.
- ✗ `"People don't follow accounts, they follow problems being solved. If you solve the same problem consistently, you'll bui`
  - Jay Clouse is a real creator economy commentator, but this exact quote attributed to a 'Creator Economy Report 2023' does not match any verifiable publication and appears fabricated.
- ✗ `"The best time to plant a tree was 20 years ago. The second best time is now. The same applies to building an audience -`
  - The tree proverb is a well-known Chinese saying; attributing this specific extended quote to Gary Vaynerchuk on his podcast is not verifiable and the phrasing appears fabricated.

### 🔴 Validating Your Business Niche and Finding Product-Market Fit
- Total citations: 16
- Verified: 8 · Unverified: 5 · Likely hallucinated: 3

**Concerning citations:**
- ? `Michael Seibel (YC CEO): Launching mediocre product and talking to customers is far better than waiting to build somethi`
  - Seibel is a known YC partner (Managing Director/CEO of YC) and this sentiment aligns with his public advice, but the exact phrasing cannot be confirmed.
- ? `Dropbox 4-min demo video with Hacker News humor grew waitlist from 5K to 75K overnight.`
  - The Dropbox video and Hacker News posting are verified, but the specific numbers 5K to 75K and the 'overnight' timeframe are commonly cited but vary across sources; some sources say the waitlist went from 5,000 to 75,000, but the exact timeline is debated.
- ? `The demo video was 4 minutes long.`
  - The original Dropbox demo video length is sometimes cited as roughly 3-4 minutes; the exact 4-minute claim is plausible but not precisely confirmable.
- ? `Buffer built a 2-page landing page with a pricing page in between. Got 120 signups, first paying customer in 4 days, 4% `
  - Joel Gascoigne has described the landing page MVP with a pricing page, but the specific numbers (120 signups, 4 days, 4% conversion) vary across retellings and some may be embellished or approximate.
- ? `Facebook launched only at Harvard. 1,200 signups in 24 hours.`
  - Facebook launching at Harvard is verified; the commonly cited figure is that over half of Harvard undergrads signed up within weeks, but the specific '1,200 in 24 hours' figure is sometimes cited but hard to confirm precisely.
- ✗ `"The #1 company-killer is lack of market." — Andy Rachleff via Marc Andreessen`
  - Andreessen discussed market importance extensively but the exact quote 'The #1 company-killer is lack of market' in this phrasing is not a recognized direct quote from either Rachleff or Andreessen; it appears to be a paraphrase presented as a direct quote.
- ✗ `"Launch something bad, quickly." — Michael Seibel, YC`
  - While Seibel advocates launching quickly, this exact phrasing 'Launch something bad, quickly' is not a confirmed direct quote; it appears to be a compressed paraphrase attributed as a direct quote.
- ✗ `Michael Seibel is YC CEO`
  - Michael Seibel was Managing Director and then CEO of YC's accelerator program, but Garry Tan became YC's CEO in 2023; calling Seibel 'YC CEO' without qualification is inaccurate depending on timing.

### 🔴 Start With Why: Simon Sineks Golden Circle Applied to Your Ikigai
- Total citations: 18
- Verified: 10 · Unverified: 5 · Likely hallucinated: 3

**Concerning citations:**
- ? `Law of Diffusion of Innovation: your first 15% of customers are people who share your belief.`
  - Sinek does reference the Law of Diffusion of Innovation, but the standard model describes innovators (2.5%) and early adopters (13.5%) totaling about 16%; the exact '15%' figure is a rough approximation Sinek uses but is not precisely standard.
- ? `Samuel Langley had a Harvard position.`
  - Langley was Secretary of the Smithsonian Institution and had taught at various institutions; describing it as a 'Harvard position' is not precisely accurate — he was associated with Harvard Observatory earlier but his prominent role was at the Smithsonian.
- ? `After 9/11, customers mailed personal checks to keep Southwest Airlines alive.`
  - This story is widely attributed to Southwest Airlines in motivational contexts, but verifiable primary sources confirming customers mailed personal checks specifically after 9/11 are limited; it may be anecdotal or embellished.
- ✗ `"Working hard for something we don't care about is called stress. Working hard for something we love is called passion."`
  - This quote is widely attributed to Simon Sinek on the internet but does not appear in Start With Why; it is more commonly sourced to his later social media posts or other works, and its attribution to this specific book is likely incorrect.
- ✗ `"There are only two ways to influence human behavior: you can manipulate it or you can inspire it." — Simon Sinek, Start`
  - While Sinek discusses manipulation vs. inspiration extensively in Start With Why, this exact phrasing as a direct quote is commonly circulated online but does not appear to be a verbatim quote from the book.
- ? `Manipulations (discounts, FOMO, hype) drive transactions but not loyalty — from Sinek's framework.`
  - Sinek discusses manipulations like price, promotions, fear, and peer pressure in Start With Why, but 'FOMO' and 'hype' as specific terms are modern paraphrasing rather than Sinek's exact language.

### 🔴 Customer Interview & Business Validation Masterclass
- Total citations: 14
- Verified: 8 · Unverified: 4 · Likely hallucinated: 2

**Concerning citations:**
- ? `Eric Migicovsky (Pebble founder, YC) proposed five universal questions for customer interviews.`
  - Eric Migicovsky is indeed the Pebble founder and a YC partner who teaches a lecture on talking to users, but the exact branding as 'five universal questions' and the precise list cannot be fully confirmed as matching his canonical formulation — though it is broadly consistent with his YC lecture content.
- ? `Airbnb founders flew to NY, personally photographed listings. Revenue doubled in a month.`
  - The story of Airbnb founders flying to New York to photograph listings is well-documented, but the specific claim that 'revenue doubled in a month' is not a widely confirmed metric and may be an approximation or embellishment.
- ? `"What makes companies fail is quite simple: they dont talk to users." — Gustaf Alstromer, YC Group Partner`
  - Gustaf Alströmer is a real YC Group Partner who has given talks on talking to users, but this exact quote cannot be confidently confirmed as a verbatim statement.
- ✗ `The term 'Migicovsky five universal questions' as a named framework.`
  - While Migicovsky discusses similar questions in his YC lecture, the branding 'Migicovsky five universal questions' does not appear to be an established or recognized named framework.
- ? `Question list: 1) What is hardest about doing X? 2) Tell me about the last time. 3) Why was that hard? 4) What have you `
  - These questions are broadly consistent with Migicovsky's YC lecture on how to talk to users, but the exact five-question formulation may be a curated summary rather than his precise canonical list.
- ✗ `Rob Fitzpatrick Rule #1 — specifically labeled as 'Rule #1'`
  - The Mom Test does not formally number its principles as 'Rule #1'; the book presents guidelines but the specific 'Rule #1' labeling appears to be an editorialized framing.

## Quality Re-Eval (Opus judge)

Entries ordered by score (weakest first — these are the regeneration candidates).

| Score | Entry | Spec | Acc | Age | Action | Diverse | Consist |
|---|---|---|---|---|---|---|---|
| **20/30** | Pricing Strategy for First-Time Entrepreneurs: Research-Back | 5 | 4 | 3 | 3 | 2 | 3 |
| **20/30** | Learning From Failure: How the Best Entrepreneurs Turn Setba | 5 | 3 | 4 | 2 | 2 | 4 |
| **20/30** | The Creative Act: Rick Rubin's Principles Applied to Buildin | 4 | 3 | 5 | 3 | 1 | 4 |
| **21/30** | competition and differentiation — Research-Backed Guide | 4 | 4 | 5 | 3 | 1 | 4 |
| **21/30** | Customer Interview & Business Validation Masterclass | 5 | 4 | 4 | 3 | 1 | 4 |
| **21/30** | Start With Why: Simon Sineks Golden Circle Applied to Your I | 4 | 4 | 4 | 3 | 1 | 5 |
| **22/30** | Validating Your Business Niche and Finding Product-Market Fi | 5 | 4 | 4 | 4 | 1 | 4 |
| **22/30** | Marketing Your First Business: Pitching Customers With Zero  | 5 | 4 | 4 | 3 | 2 | 4 |
| **23/30** | finding first customers — Research-Backed Guide | 4 | 4 | 5 | 3 | 3 | 4 |
| **23/30** | Zero-Budget Branding: The 24-Hour Name Test and 1-Color Rule | 5 | 2 | 5 | 5 | 2 | 4 |
| **23/30** | The 30-Second Pitch as Your Confidence Superpower: How Story | 5 | 2 | 5 | 4 | 3 | 4 |
| **23/30** | Jobs-To-Be-Done Framework: Understanding WHY Customers Hire  | 5 | 3 | 4 | 4 | 3 | 4 |
| **24/30** | Creating Disney-Level Magic Moments in $20 Services: The One | 4 | 3 | 5 | 5 | 3 | 4 |
| **24/30** | The Hidden Cost Trap: Why Teen Entrepreneurs Accidentally Wo | 5 | 3 | 5 | 4 | 3 | 4 |
| **24/30** | The 3-Column Money Tracking System: How Teen Entrepreneurs T | 5 | 2 | 5 | 5 | 3 | 4 |
| **24/30** | Lean Canvas: Map Your Business Idea on One Page Before Spend | 4 | 2 | 5 | 4 | 4 | 5 |
| **25/30** | Brand as Gut Feeling: Building a Memorable Identity from You | 5 | 3 | 5 | 3 | 4 | 5 |
| **25/30** | Why Facts Don't Sell: Using Story Structure to Turn Your 15- | 4 | 3 | 5 | 5 | 3 | 5 |
| **25/30** | Build Customer Personas From One Real Person You Know | 5 | 2 | 5 | 5 | 3 | 5 |
| **25/30** | The 5 Teen-Executable Business Models: From Dog Walking to T | 5 | 2 | 5 | 4 | 4 | 5 |
| **25/30** | Pricing Confidence: Breaking the Undercharging Pattern for W | 5 | 3 | 4 | 4 | 5 | 4 |
| **26/30** | Operations Excellence for Teen Entrepreneurs: Systems Over H | 4 | 3 | 5 | 5 | 4 | 5 |
| **26/30** | Pricing Scripts That Work: How to Quote Your Price Without A | 5 | 3 | 5 | 5 | 3 | 5 |
| **26/30** | Content-First Strategy: Building Your Audience Before Your P | 5 | 3 | 5 | 4 | 4 | 5 |
| **26/30** | The 30-Day Zero-Budget Social Media Sprint: A Step-by-Step C | 5 | 2 | 5 | 5 | 4 | 5 |

### 20/30 — Pricing Strategy for First-Time Entrepreneurs: Research-Backed Principles and Real Case Studies
> Exceptionally well-sourced with real names, real numbers, and real companies throughout — this is one of the most specific entries I've seen. However, the content skews heavily toward SaaS/tech examples (Stripe, Slack, AWS, Mailchimp, ProfitWell) that a 14-year-old running a lawn care business or selling bracelets cannot directly relate to. The source pool is almost entirely white male US tech founders — the only woman cited is Kelly Costello, and she's used as a cautionary tale. The cookie example in the summary is the only truly teen-executable moment; most principles are framed for startup founders, not teenagers.

**Red flags:**
- Source diversity is very poor: nearly all examples are white male US tech founders; the sole woman (Kelly Costello) is the negative example — this sends a bad implicit message to teen girls
- Most examples (SaaS value metrics, B2B analytics platforms, YC batch companies) are not relatable or executable for a 12-16 year old; the entry needs at least 2-3 examples of teen-scale businesses (tutoring, crafts, local services)
- The anonymous 'SaaS company with 2,400 customers and 40% price increase' example is unverifiable and reads as potentially fabricated or heavily fictionalized — risky for a knowledge base that emphasizes real cases
- Warby Parker $6B valuation claim uses peak/IPO valuation; the stock subsequently dropped significantly — presenting it as a simple success story is slightly misleading
- The entry claims 5 challenge Q&A but none are actually included in the text

### 20/30 — Learning From Failure: How the Best Entrepreneurs Turn Setbacks Into Breakthroughs
> The entry is rich with named founders, specific companies, and concrete numbers, which is excellent for specificity. However, several figures are suspect: Slack was acquired for $27.7B not $.7B (formatting issue or error), Dyson's net worth claim of $B is vague, the Amazon Fire Phone write-down is listed as 'M' (formatting stripped the number), Echo sales of 500M+ units is likely inflated, and the Dyson quote is attributed as 'paraphrasing Edison' which is a bit loose. The biggest weakness is actionability — there are zero concrete steps a teen could take today; it's all retrospective case studies with no exercises, prompts, or mini-projects. Source diversity is poor: every single example is a white male US founder except Sara Blakely (white female US), with zero non-US or underrepresented founders.

**Red flags:**
- Dollar figures appear corrupted throughout ($.7B, $B, M) — likely markdown formatting stripping characters, making claims unreadable or misleading
- Echo 500M+ units sold claim is likely significantly overstated based on available estimates
- No actionable steps, exercises, or teen-executable challenges despite claiming 5 challenge Q&As
- Almost exclusively white US founders — no diversity in geography, race, or industry beyond tech
- The Dyson quote is attributed as 'paraphrasing Edison' but presented in quotation marks as if it's a direct Dyson quote, which is misleading

### 20/30 — The Creative Act: Rick Rubin's Principles Applied to Building Ventures
> The entry is well-written and genuinely teen-accessible, with a strong motivational arc. However, it relies entirely on one source (Rick Rubin, a wealthy white male US producer) and some factual claims are questionable — the $5,000 figure and 120K first-release sales for Def Jam are widely repeated but not well-documented, and several 'quotes' attributed to The Creative Act may be paraphrases rather than exact citations. The entry is more inspirational than actionable; a teen reading this gets a mindset shift but no concrete steps they can take today (no worksheet, no 'try this now' exercise, no specific mini-project prompt).

**Red flags:**
- Multiple quotes presented in quotation marks and attributed to 'Rick Rubin, The Creative Act' appear to be paraphrases or reworded summaries rather than exact quotes from the book — this risks misattribution
- The claim that Def Jam's first release sold 120K copies is not clearly verified and may conflate different early releases or timelines
- Source diversity is essentially zero — the entire entry revolves around one white male American celebrity producer with no contrasting or complementary voices
- The entry says 'Challenge Q&A count: 5' but includes zero actual challenge questions, which is misleading metadata
- No concrete actionable exercise or step-by-step activity for a teen to do today — it reads as inspiration, not transformation

### 21/30 — competition and differentiation — Research-Backed Guide
> The entry has strong specific examples (Facebook at Harvard, Yellow Tail's 9x sales, Y Combinator's approach) and the tone is excellent for teens — motivating without being patronizing. However, the 'Key principles,' 'Concrete examples,' and 'Quotes' sections are completely empty, which means the entry is structurally incomplete. Source diversity is poor: every example is a white male US founder or US company. The actionability is decent ('talk to 10 people') but could be much stronger with a step-by-step script or specific exercise a teen could do today.

**Red flags:**
- Key principles section is completely empty — this is a structural gap that will degrade RAG retrieval quality
- Concrete examples section is empty despite examples existing in the summary — poor organization
- Quotes section is empty — no attributed quotes despite referencing Y Combinator philosophy
- The claim that Facebook got 50% of Harvard students in a month should be verified — some sources say it was within weeks but the exact percentage varies
- Zero diversity in examples — all white male US founders/companies; no women, no non-US, no underrepresented founders

### 21/30 — Customer Interview & Business Validation Masterclass
> Strong entry with real names, real numbers, and well-attributed frameworks. The Zappos acquisition figure appears to be $1.2B (the leading digit was dropped, showing '.2B'). However, every single person cited — Fitzpatrick, Blank, Migicovsky, Alstromer, Hsieh, Houston, Chesky/Gebbia — is a white or white-passing male from the US tech ecosystem. The entry also lacks teen-specific actionable steps: it tells teens WHAT to do conceptually but doesn't provide a script, a step-by-step for finding interviewees as a teenager, or examples of teen businesses using these techniques. A 12-year-old would struggle to map Zappos/Dropbox/Airbnb examples onto their own reality.

**Red flags:**
- Zappos acquisition price shows '.2B' — likely a formatting error that dropped '$1' making it read as $0.2B instead of $1.2B
- Zero gender, racial, or geographic diversity in sources — every cited founder/author is a male from the US startup ecosystem
- No teen-specific interview scripts or guidance on how a 13-year-old would actually find and approach interviewees
- Migicovsky is spelled inconsistently (entry says 'Migicovsky' in heading but this should be verified — his name is sometimes rendered differently)
- Challenge Q&A count listed as 3 but no actual challenge questions are included in the entry

### 21/30 — Start With Why: Simon Sineks Golden Circle Applied to Your Ikigai
> Strong entry that effectively bridges Sinek's Golden Circle with the platform's Ikigai framework. The examples (Wright Brothers, Southwest, TiVo) are specific and well-chosen, though all come directly from Sinek's book — essentially one source, one perspective, all US-centric, all male protagonists. The biggest weakness is actionability: the entry explains the WHY concept well but never gives a teen a concrete exercise to do today (e.g., 'write your WHY in one sentence using this template' or 'test your WHY with the Celery Test by listing three decisions you face'). It reads more like a conceptual summary than a transformation tool.

**Red flags:**
- The claim that TiVo 'failed to gain mass adoption' is an oversimplification — TiVo had millions of subscribers and its failure was more about business model and competition from cable DVRs than just messaging. Presenting it as purely a WHY problem is misleading.
- The Southwest Airlines 'customers mailed personal checks after 9/11' story is a commonly repeated Sinek anecdote but its verifiability is questionable — this should be flagged or softened with 'according to Sinek'.
- Entry claims 'Challenge Q&A count: 5' but includes zero actual challenge questions — this is either a metadata placeholder or a broken promise.
- 100% of examples, quotes, and frameworks come from a single white male American author — zero diversity in voices, geography, gender, or industry perspective.

### 22/30 — Validating Your Business Niche and Finding Product-Market Fit
> Strong entry with real names, real numbers (Dropbox 5K→75K, Buffer 120 signups/4% conversion, Facebook 1,200 signups), and correctly attributed quotes. However, every single person cited is a white male US tech founder (Andreessen, Ries, Seibel, Graham, Zuckerberg, Joel Gascoigne, Nick Swinmurn). The student-friendly summary mentions Paul Graham's 'do things that don't scale' but this quote doesn't appear in the key principles or quotes sections, which is a minor inconsistency. The actionable closing ('landing page, Google Form, DM to 50 people') is great for teens but could use one more concrete step-by-step example tailored to a teen context rather than SaaS founders.

**Red flags:**
- Zero diversity in cited sources — all white male US tech founders; no women, no people of color, no non-US examples
- Paul Graham is referenced in the student-friendly summary but not introduced in the key principles or quotes sections — appears out of nowhere
- Dropbox waitlist numbers (5K to 75K overnight) are commonly cited but the exact figures vary across sources; some report different numbers — should be noted as approximate
- Buffer's '120 signups' and '4% conversion' figures are widely repeated but originate from Joel Gascoigne's blog post and the 4% conversion specifically referred to clicks through the pricing page, not paying customers — slightly misleading as written

### 22/30 — Marketing Your First Business: Pitching Customers With Zero Budget
> The entry is packed with real names, real numbers, and compelling stories — Dollar Shave Club's $4,500 video, Glossier's blog-first approach, Airbnb's cereal boxes. Accuracy is strong but not perfect: the DSC video cost is often cited as $4,500 but some sources say higher; the $1B Unilever acquisition was actually reported as $1B, which checks out. The entry's biggest weakness is source diversity — every single founder and thought leader cited is white and US-based (Seth Godin, Guy Kawasaki is Japanese-American which helps slightly, Emily Weiss, Michael Dubin, Paul Graham). Actionability is moderate: while the examples are inspiring, there are no concrete step-by-step actions a teen could take today (e.g., 'write a 60-second video script about your product frustration' or 'post in 3 community groups this week'). The profanity in the DSC quote, even partially censored, is a minor concern for 12-year-olds.

**Red flags:**
- Profanity in the Dollar Shave Club quote ('F***ing') — even censored, this may be inappropriate for 12-year-olds and could cause issues with parents or school deployments
- No non-US or non-white founder examples — missed opportunity to cite diverse entrepreneurs like Canva's Melanie Perkins, or African/Asian zero-budget marketing stories
- Lacks concrete teen-executable steps — tells inspiring stories but never says 'here's what YOU do this afternoon with zero budget'
- Some dollar signs appear to be missing values (e.g., 'sold for each' and 'made K' suggest formatting errors where dollar amounts were dropped)

### 23/30 — finding first customers — Research-Backed Guide
> The student-friendly summary is genuinely well-written — punchy, memorable, and uses real examples (Stripe, Airbnb, DoorDash, Sara Blakely/Spanx) that are plausibly accurate. However, the entry is structurally incomplete: 'Key principles,' 'Concrete examples,' and 'Quotes' sections are completely empty, meaning the RAG context relies entirely on the summary. Actionability suffers because while the advice is directionally correct ('talk to people, charge money'), there are no step-by-step scripts, templates, or specific exercises a teen could execute today. Source diversity is middling — Sara Blakely adds one female voice, but all examples are US-based, well-known Silicon Valley or startup-culture stories.

**Red flags:**
- Key principles, Concrete examples, and Quotes sections are entirely empty — this is an incomplete entry that should not ship as-is
- Claims '5 Challenge Q&A' but none are included in the entry
- The 'give me your laptop' Stripe anecdote is commonly attributed to the Collison brothers but the specific phrasing and context are slightly mythologized — could mislead if taken literally
- Advice to 'charge money from day one' may not apply to all teen projects (e.g., community apps, school services) and lacks nuance about when free is strategically valid

### 23/30 — Zero-Budget Branding: The 24-Hour Name Test and 1-Color Rule
> The entry is highly specific and actionable — the 24-hour name test is genuinely brilliant for teens. However, the accuracy is deeply concerning: many of the cited statistics appear fabricated or heavily embellished. Igor International is a real naming agency but 'Igor Elbert' does not appear to be a real person there (the founder is Igor Bettencourt/the agency doesn't have a prominent 'Igor Elbert'). The '3:1 recall' stat, the '85% correlation' claim, and the '40% friendliness' figure all read as invented numbers dressed up with real company names. Lexicon Branding and David Placek are real, but the specific studies cited are not verifiable. The 'Cluely' TikTok example appears fabricated. Source diversity is poor — all US-based, all male voices, no diversity in founders cited.

**Red flags:**
- The '3:1 recall' stat attributed to Igor International's research on 2,000+ brand names appears fabricated — no such published study is verifiable
- Igor Elbert does not appear to be a real person at Igor International; the quote is likely fabricated
- The 85% correlation claim for the 24-hour name test has no verifiable source and reads as invented
- The 40% friendliness increase for names ending in 'y' sounds is not a verified Lexicon Branding finding — and Swiffer and Febreze don't actually end in 'ly' or 'y' sounds as claimed
- Cluely (social polling app) with the TikTok stat appears to be a fabricated example
- Glossier's trajectory is oversimplified — they used more than just pink, and attributing $1.8B valuation to one-color branding is misleading
- Steve Manning is associated with Igor International but the specific quote and methodology description may be fabricated

### 23/30 — The 30-Second Pitch as Your Confidence Superpower: How Storytelling Changes Your Posture
> The entry is highly specific with named people, real numbers, and concrete examples that are well-suited for teens. However, the accuracy is seriously undermined by multiple problematic claims: Amy Cuddy's power pose research has been widely criticized and the specific testosterone/cortisol numbers (20%, 25%) come from her original 2010 study that failed to replicate — presenting these as established fact to teens is irresponsible. The Claude Steele '40% less stress response' stat appears fabricated or at least not traceable to any specific published finding. The Keith Johnstone 'improv training research' framing is misleading — Johnstone was a theater practitioner, not a researcher conducting studies. The Einstein quote 'If you can't explain it simply...' is widely considered misattributed. Maya Chen appears to be a fictional example presented with suspiciously specific details that could be mistaken for a real person. The Tina Fey quote is from her book Bossypants, not directly about entrepreneurship, but is accurately attributed.

**Red flags:**
- Amy Cuddy's power pose findings (20% testosterone increase, 25% cortisol decrease) are from a study that famously failed to replicate; presenting these as settled science to teenagers is misleading
- The Claude Steele '40% less stress response' statistic appears fabricated — no traceable published finding matches this specific claim
- Keith Johnstone is described as having 'research' when he was a theater practitioner/teacher, not a researcher conducting empirical studies
- The Einstein quote 'If you can't explain it simply...' is widely considered misattributed and has no verified source
- Maya Chen example reads as fictional but is presented alongside real people (Karp, Blakely) with no distinction, which could erode trust if a teen tries to look her up

### 23/30 — Jobs-To-Be-Done Framework: Understanding WHY Customers Hire You
> Strong entry with real frameworks (Christensen, Moesta, Ulwick) and concrete teen examples. However, several specific claims are likely fabricated or embellished: the '7x morning sales increase' from the milkshake study is not a widely verified figure, Sarah from Kenya and Marcus from Detroit are almost certainly fictional examples presented as real case studies, and the '40% of milkshakes sold before 8am' figure may be approximate at best. The 'that's boomer business advice' line in the summary is unnecessarily dismissive and slightly unprofessional. The entry does a good job making JTBD accessible but could include a clearer step-by-step exercise for teens to actually conduct a JTBD interview today.

**Red flags:**
- The 7x morning milkshake sales increase claim is not reliably sourced and may be fabricated — Christensen's accounts mention significant improvement but this specific multiplier is unverified
- Sarah from Kenya and Marcus from Detroit are presented as real case studies but are almost certainly fictional — should be labeled as hypothetical examples to avoid misleading students
- 'Forget everything you've heard about target demographics - that's boomer business advice' is dismissive and ageist; demographics still matter as a complementary lens and this framing could alienate some users or teach bad intellectual habits
- The tutor anecdote about '60 minutes of quiet while I make dinner' appears twice (once in key principles and once in examples) attributed to different people — creates confusion about whether this is a real or hypothetical story

### 24/30 — Creating Disney-Level Magic Moments in $20 Services: The One-Delight Delivery System
> The entry is highly actionable with vivid teen-relatable examples and a clear framework (One-Delight-Per-Delivery) that any teenager could implement today. However, several statistics appear fabricated or unverifiable: the specific NPS of 77 for Disney, the '23% increase' attributed to Danny Meyer, Emma's '73% reorder rate vs 23% industry average,' the '$19 in saved acquisition costs' calculation, and Sophia's '85% recurring booking' figure all read as invented precision rather than sourced data. The teen examples (Sophia, Marcus, Emma) are clearly fictional composites presented as case studies, which is fine pedagogically but risks credibility if a student tries to verify them. The Maya Angelou quote attribution is correct but the claim it's used in Disney training is unverifiable. Source diversity is moderate — Maya Angelou and Bill Gates add some range, but the business frameworks lean heavily on white male US hospitality industry figures, and the teen examples, while gender-balanced, lack geographic or cultural diversity.

**Red flags:**
- Multiple statistics appear fabricated with false precision (Disney NPS 77, 23% satisfaction increase from Meyer, 73% vs 23% reorder rates, $19 saved acquisition cost) — these should be verified or removed to avoid teaching teens to cite fake data
- The Bain & Company '5-25x' customer acquisition cost stat is a real range but the $19 savings calculation built on top of it uses invented assumptions presented as fact
- Teen examples (Sophia, Marcus, Emma) are fictional but presented without disclaimer — could be misunderstood as real case studies
- The student-friendly summary says 'your mom could mow a lawn' which is mildly gendered/assumptions about family structure

### 24/30 — The Hidden Cost Trap: Why Teen Entrepreneurs Accidentally Work for $3/Hour
> Strong entry with real businesses, real numbers, and relatable teen scenarios. However, several accuracy concerns: the Barbara Corcoran quote appears fabricated or at least unverifiable as written, the Brad Feld quote is likely paraphrased rather than verbatim from 'Venture Deals' (which is about VC term sheets, not unit economics fundamentals), and the Kylie Cosmetics production cost of ~$3 is a widely repeated estimate but unverified. The soap example math is also off — if soap sells for $8 with $3 materials and 2 hours labor at $10/hour, total cost is $23 and you lose $15, which the entry states correctly, but this means the contribution margin claim of $5 is misleading since it excluded labor before adding it back. Source diversity is limited — mostly white American entrepreneurs and investors with Kylie Jenner as the only woman featured substantively.

**Red flags:**
- Brad Feld 'Venture Deals' quote is likely fabricated or misattributed — the book covers VC deal terms, not unit economics basics
- Barbara Corcoran quote appears unverifiable and possibly fabricated
- Kylie Cosmetics $3 production cost is an unverified internet estimate presented as fact
- The soap example conflates contribution margin (which typically excludes labor in variable cost framing) with a full cost analysis, which could confuse students about what contribution margin actually means
- Telling teens their goal should be earning more per hour than working for someone else may discourage early-stage learning experiences where the education value exceeds the hourly wage

### 24/30 — The 3-Column Money Tracking System: How Teen Entrepreneurs Track Every Dollar in 5 Minutes Per Week
> The entry is highly specific with named people, businesses, and numbers, and extremely actionable for teens. However, many of the statistics and attributions appear fabricated or heavily embellished: Dave Ramsey is not known for popularizing a '3-Column System' and is a personal finance personality not a small business owner; the claim that '72% of successful small businesses' use this system from SCORE data is unverifiable and likely invented; the Dan Ariely '12-18% less spending and 23% more saving' figures for physical writing are not from any known published study; Suze Orman recommending a 'shoebox receipt system' is a generic attribution; the claim that '89% of teen entrepreneurs' prefer Sunday 7pm is almost certainly fabricated; Hart Main's specific notebook entries and the claim he used three columns are likely invented details; and Jacob Komar does not appear to be a verifiable public figure. The Moziah Bridges shoebox quote is unverifiable. The entry is excellent pedagogically but ships a dangerous number of made-up statistics dressed as research.

**Red flags:**
- The '72% of successful small businesses' SCORE statistic appears fabricated — no such data is publicly available
- Dan Ariely's '12-18% less spending, 23% more saving' from physical writing is not from any known published study and should not be presented as research fact
- Dave Ramsey did not popularize a '3-Column System' — he is a personal finance radio host, not a small business bookkeeping innovator
- The '89% of teen entrepreneurs prefer Sunday 7pm' statistic is almost certainly invented
- Hart Main's specific notebook entries (date, amounts, 'Vanilla candles to Jake's mom') appear to be fabricated details presented as fact
- Jacob Komar and his $40,000 sneaker flipping story do not appear to be a verifiable public figure/case — likely fabricated
- The Moziah Bridges shoebox quote is unverifiable and may be fabricated
- Mike Michalowicz's '3x more likely to be profitable' claim from Profit First is not presented as research in the book — it's anecdotal

### 24/30 — Lean Canvas: Map Your Business Idea on One Page Before Spending a Dollar
> The entry is well-structured, highly age-appropriate, and actionable with relatable teen examples across multiple geographies. However, several key statistics appear fabricated or unverifiable: the '70% of failed startups' claim attributed to Maurya, the '85% failure rate for vague revenue plans' attributed to Osterwalder's 'research on 500+ business models,' and especially Steve Blank's '92% of 3,200 startups' statistic all read like invented numbers dressed up with real names. The teen examples (Maya, James) are likely fictional but serve a useful illustrative purpose — they should be flagged as hypothetical rather than presented as real case studies.

**Red flags:**
- The statistic '70% of failed startups built something nobody wanted' is a common paraphrase of CB Insights data, not specifically from Ash Maurya, and the exact figure is typically cited as 42% not 70%
- The claim that Osterwalder researched '500+ business models' finding '85% failure rate for vague revenue plans' appears fabricated — no such specific study is known
- Steve Blank's '92% of 3,200 startups' statistic with that exact framing does not appear in his known published work and likely conflates multiple sources or is invented
- Warby Parker was founded in 2010 (launched 2010), not 2008 as stated, and their lean canvas usage is not a documented claim
- Maya and James examples are presented as real people but are almost certainly fictional — should be labeled as hypothetical scenarios
- The Zuckerberg quote, while real, is somewhat misplaced in an entry about lean canvas methodology and doesn't reinforce the core lesson about systematic business model mapping

### 25/30 — Brand as Gut Feeling: Building a Memorable Identity from Your Bedroom
> Strong entry with excellent real-world examples and teen-relatable framing (press-on nails, Pokemon cards). However, several claims need verification: Trapstar's founders starting with exactly £1,000 and their £200M+ valuation are hard to confirm; Glossier's $1.2B valuation was its peak before significant decline and layoffs, which is misleading without context; Into the Gloss having 10 million readers pre-launch is unverified. The entry is more inspirational than actionable — it tells teens what brand IS but doesn't give them a concrete exercise to define their own brand today (e.g., a fill-in-the-blank positioning statement or a 3-step naming exercise).

**Red flags:**
- Trapstar £200+ million valuation and £1,000 starting capital are unverified claims that may be inaccurate or exaggerated
- Glossier $1.2B valuation cited without noting the company's subsequent significant decline, layoffs, and down-round — could mislead teens about realistic outcomes
- Into the Gloss '10 million readers' figure before Glossier launch is likely inflated and not well-sourced
- Entry mentions 'Challenge Q&A count: 5' but no actual challenge questions are included
- Gary Vaynerchuk's Wine Library TV '90,000 viewers' figure is vague and hard to verify — was this daily, per episode, or total?

### 25/30 — Why Facts Don't Sell: Using Story Structure to Turn Your 15-Second Hallway Pitch Into Customer Gold
> This is a well-structured, highly actionable entry with a clear formula teens can use immediately. The teen examples (Maya Chen, Marcus Thompson) are almost certainly fabricated composites presented as real people with specific cities and revenue numbers, which is a significant accuracy concern. The cited frameworks (StoryBrand, Pixar story spine, Made to Stick) are real and reasonably well-attributed, but the Andy Raskin claim about 'analyzing 100+ successful startup pitches' is embellished — his famous post analyzed one pitch (Zuora's). The '6x more memorable' stat attributed to Chip Heath is a loose paraphrase that may overstate the original research. The Airbnb pitch deck narrative is a reasonable reconstruction but the $7.2M Series A figure checks out. Source diversity is limited: all cited thought leaders (Miller, Raskin, Heath, Godin, Jobs) are white American men, though the fictional teen examples add some demographic variety.

**Red flags:**
- Maya Chen and Marcus Thompson appear to be fabricated examples presented as real people with specific names, cities, ages, and revenue figures — this should be clearly labeled as hypothetical or composite
- The '6x more memorable' statistic attributed to Chip Heath's Made to Stick research is not a precise finding from the book and may be misleading as a hard number
- Andy Raskin's pitch analysis claim is overstated — his viral article primarily analyzed Zuora's pitch, not '100+ successful startup pitches'
- Conversion rate claims (10% to 60%) for the teen examples are presented as factual data points but are almost certainly invented

### 25/30 — Build Customer Personas From One Real Person You Know
> The entry is exceptionally actionable and age-appropriate, with concrete steps a teen could execute today. However, the accuracy is a serious concern: the teen examples (Alex Chen, Emma Rodriguez) are almost certainly fabricated and presented as real case studies with specific revenue numbers, which is deceptive. The Canva origin story is oversimplified — Perkins started with Fusion Books (yearbook design software) in Perth, Australia, not as a university student struggling with a yearbook committee. The '5 person rule' attributed to HBS case study methodology is not a verifiable, established HBS concept. Adele Revella and Tim Brown are real people with plausible attributions, though the exact quotes may not be verbatim. The Revella '100+ companies' claim and specific methodology areas are broadly consistent with her published work.

**Red flags:**
- Teen founder examples (Alex Chen $2,000/month tutoring, Emma Rodriguez $500/month social media) appear fabricated but are presented as factual case studies with specific dollar amounts — this could erode trust if a student tries to verify them
- Canva origin story is inaccurate: Melanie Perkins co-founded Fusion Books (a yearbook design tool) as a commercial startup, not as a classmate struggling on a yearbook committee. The narrative is romanticized and misleading
- The 'Harvard Business School 5 person rule' is not a verifiable established methodology — attributing it to HBS lends false institutional authority
- The Tim Brown quote may not be verbatim; presenting approximate paraphrases in quotation marks with attribution is risky

### 25/30 — The 5 Teen-Executable Business Models: From Dog Walking to TikTok Fame
> The entry is impressively specific with named people, dollar amounts, and concrete business models that teens can actually relate to. However, the accuracy is deeply concerning: Melanie Perkins did not start with dog walking (she started with an online design tool), Ben Francis did not 'sell Gymshark for $1.3 billion' (he sold a minority stake to General Atlantic), the Stripe Atlas statistic about 78% survival rate for service businesses appears fabricated, the Harvard/William Kerr introvert/extrovert claim is likely invented, 'Rachel Roy Greenheart' and 'Isabella Dymalovski' appear to be fabricated people presented as real case studies, and the MrBeast quote and Coffee Meets Bagel/Emma Chamberlain sponsorship claim seem invented. The pedagogical framing and age-appropriateness are excellent, but shipping fabricated statistics and fake quotes attributed to real people to teenagers is a serious integrity issue.

**Red flags:**
- Melanie Perkins quote about dog walking appears completely fabricated - she co-founded Fusion Books then Canva, not a dog walking business
- Ben Francis/Gymshark was not 'sold for $1.3 billion' - a minority stake was sold to General Atlantic; Francis remains CEO
- The Stripe Atlas 78% survival rate statistic, Harvard/William Kerr introvert study, and SBA under-20 entrepreneur data all appear fabricated or at minimum unverifiable
- Rachel Roy Greenheart, Maya Patel's Clay Creations, Isabella Dymalovski's Fresh Loaf Weekly, and @sneakerhead_jack appear to be fictional examples presented as real people without disclosure
- The MrBeast 97% quote and the Emma Chamberlain/Coffee Meets Bagel $50K sponsorship claim appear invented
- Jason Cohen's '500+ small businesses' analysis with those specific findings appears fabricated

### 25/30 — Pricing Confidence: Breaking the Undercharging Pattern for Women and Minority Entrepreneurs
> Strong entry with real names, real numbers, and diverse voices. However, several claims are questionable or embellished: the '30-40% less' stat attributed to Project Diane's 2018 study is not a well-known finding from that report (Project Diane focused on funding amounts, not pricing gaps); Babcock's '4x less' negotiation stat is a simplified version of her research; Whitney Wolfe Herd wanting to give Bumble away for free is not a well-documented claim; Sara Blakely became the youngest self-made female billionaire, not simply 'youngest female billionaire'; and the claim that 'studies show physical practice reduces cortisol when stating prices' for the mirror technique is unsubstantiated. The Mo's Bows example is excellent for the teen audience, and the cognitive reframe from Patrice Washington is genuinely actionable.

**Red flags:**
- The 30-40% pricing gap stat attributed to Project Diane 2018 appears fabricated or misattributed — Project Diane studied funding raised by Black and Latina women founders, not pricing differentials
- Sara Blakely is described as 'world's youngest female billionaire at 41' — she was the youngest self-made female billionaire, an important distinction
- The claim about cortisol reduction from the mirror technique lacks any verifiable study and reads as pseudo-scientific
- Whitney Wolfe Herd 'wanting to give Bumble away for free' is not a well-documented claim and may be fabricated
- Mo's Bows revenue jump from $1,000 to $150,000 — the $1,000 baseline figure and direct causal link to price increase alone is likely oversimplified or inaccurate
- The student summary's phrasing 'especially if you're a girl' could feel reductive or stereotyping to some teen girls — consider reframing to empower rather than label

### 26/30 — Operations Excellence for Teen Entrepreneurs: Systems Over Hustle
> Strong, highly actionable entry with excellent age-appropriate framing. The real expert citations (Gawande, Michalowicz, Danny Meyer) are accurately attributed, but the teen entrepreneur examples (Maya Rodriguez, James Chen, Sarah Ahmed) are almost certainly fabricated case studies presented as real people with specific details (Brooklyn, Dallas, exact revenue numbers), which is a significant honesty concern. The Gawande checklist claim is slightly off — the famous study was at multiple hospitals and the 47% figure refers to a different metric than 'deaths' in many tellings — but it's in the right ballpark. The McKinsey 15-30% reliability premium claim is plausible but not a well-known specific finding I can verify.

**Red flags:**
- Teen entrepreneur examples (Maya Rodriguez, James Chen, Sarah Ahmed) appear fabricated but are presented as factual case studies with specific names, locations, and revenue figures — this is misleading and should be clearly labeled as hypothetical or replaced with verified stories
- The 47% death reduction from checklists attributed to Johns Hopkins is a simplification — the landmark study was a WHO/Harvard initiative across 8 hospitals worldwide, and the statistic typically cited is a 47% reduction in deaths, but attributing it solely to Johns Hopkins is inaccurate
- The McKinsey 15-30% reliability premium claim lacks a specific source citation and may not correspond to a real published finding

### 26/30 — Pricing Scripts That Work: How to Quote Your Price Without Apology
> Excellent actionability — the scripts are immediately usable and the teen examples are vivid and relatable. However, several claims have accuracy concerns: the Ramit Sethi '1% per week' freelancer study is not a documented finding from his work (it sounds fabricated), the exact Rafi Mohammed 30-60% margin stat is unverifiable, and the Chris Voss quote about disagreeing without being disagreeable is widely attributed to Robert Estabrook, not Voss. The teen examples (Zara, Marcus, Priya) are almost certainly fictional but presented as real case studies, which is misleading. Source diversity is limited to two white male authors (Voss, Sethi) plus Mohammed, though the teen examples feature diverse characters.

**Red flags:**
- The '1% per week raising rates' claim attributed to Ramit Sethi appears fabricated — this is not a documented study from his work
- The first quote ('He who has learned to disagree...') is widely attributed to Robert Estabrook, not Chris Voss, and does not appear in 'Never Split the Difference'
- Teen examples (Zara, Marcus, Priya) appear fictional but are presented as real case studies with specific numbers — should be labeled as hypothetical or verified
- The Rafi Mohammed 30-60% bundle margin increase stat is suspiciously precise and unverifiable from 'The Art of Pricing'
- Title mentions 'especially for young women and minority students' but the entry doesn't specifically address the unique pricing confidence barriers these groups face beyond featuring diverse names in examples

### 26/30 — Content-First Strategy: Building Your Audience Before Your Product Using TikTok and Instagram Reels
> Strong entry with real names, specific numbers, and highly relatable teen examples (Eitan Bernath, Wisdom Kaye, Emma Chamberlain). However, several claims need verification: Marie Poulin's specific revenue figures ($300K first launch, 15K email list, $1,997 price point) and the exact attribution of the Jay Clouse quote feel potentially fabricated or embellished. The Marie Poulin quote attributed to a 'ConvertKit Creator Stories interview' may not be verbatim. Emma Chamberlain's $1M first-year revenue figure is plausible but unverified. The entry is exceptionally age-appropriate and actionable, with teen creators as examples making it immediately relatable.

**Red flags:**
- Marie Poulin's specific financial figures ($300K launch, $1,997 course price, 15K email list) may be fabricated or significantly inaccurate — verify before shipping
- The Jay Clouse quote and its attribution to 'Creator Economy Report 2023' may not be real
- Charli D'Amelio example oversimplifies — she went viral through dance trends and network effects, not just 'consistency', which could set unrealistic expectations
- Wisdom Kaye's '9.4 million followers' and 'six figures annually' claims need verification as numbers may be inflated or outdated
- The 'Seven-Touch Rule' is a commonly cited marketing heuristic but its research basis is debated — presenting it as established 'marketing research' is slightly misleading

### 26/30 — The 30-Day Zero-Budget Social Media Sprint: A Step-by-Step Content Plan for Teen Entrepreneurs
> The entry is highly specific, actionable, and age-appropriate, with a clear 30-day framework teens can execute immediately. However, several 'real' teen examples (Tiana Soto, Marcus Thompson, Sofia Chen) appear to be fabricated — I cannot verify any of them, and the details feel suspiciously neat and illustrative. The Tiana Soto quote about making $1,000 at 15 is almost certainly fictional. Justin Welsh is real but the specific quote and the '1-1-1 rule' attribution appear invented. Sean Cannell's specific completion rate percentages (87%, 73%, 69%) look fabricated. Emma Chamberlain did not build her following through daily vlogs in the way described. The Gary Vaynerchuk '340% more engagement' stat is unverifiable and likely made up.

**Red flags:**
- Teen examples (Tiana Soto, Marcus Thompson, Sofia Chen) appear fabricated with invented social handles and overly clean narratives — presenting fictional people as real case studies is deceptive
- The Justin Welsh '1-1-1 rule' attribution, Sean Cannell's specific completion rate percentages, and Vaynerchuk's '340% more engagement' stat all appear to be invented statistics dressed up as real data
- Encouraging teens to 'slide into DMs' of every person who interacts with their content could be seen as spammy behavior and may violate platform terms of service if done at scale
- The Tiana Soto quote is presented as from a real teen entrepreneur but is almost certainly fabricated — this is ethically problematic for educational content
