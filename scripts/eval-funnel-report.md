# Ikigai → First Customer Funnel — Agent Simulation

Run: 2026-04-07T08:48:59.313Z
Personas: 20 × motivation levels: 3 = 60 simulations
Synth model: claude-sonnet-4-20250514
Agent model: claude-sonnet-4-20250514
Judge model: claude-opus-4-6

## TL;DR

Across **60 simulated student paths**, here's where agents land in the funnel:

| Funnel stage | Simulated count | Simulated % |
|---|---|---|
| No intent (day-0 conviction ≤ 2) | 20 | 33.3% |
| Intent → no action by day 7 | 2 | 3.3% |
| Action → no customer | 37 | 61.7% |
| **Action → first customer (yes)** | **1** | **1.7%** |

### ⚠️ READ THIS BEFORE BELIEVING THE NUMBER

This is a **simulated upper bound**, not a real conversion rate. Agents are more compliant than humans:
- Friend agents ghost less than real friends
- Teen agents have no homework, sports, embarrassment, or attention drift
- The simulation has zero physical-world friction (going to the store, paying for supplies, awkward in-person moments)

**The investor's threshold for "lead the round" was real-teen >20%, real-teen <5% = need a coaching layer.**
**Real-teen rates will be lower than this simulation. Use this to identify WHERE the funnel breaks, not WHAT % converts.**

## By Persona Bucket

| Bucket | Runs | Action% | Customer% | Notes |
|---|---|---|---|---|
| coherent | 15 | 67% | 0% | |
| already-running | 12 | 67% | 8% | |
| multi-track | 9 | 67% | 0% | |
| slang-esl | 9 | 56% | 0% | |
| age-12 | 6 | 83% | 0% | |
| age-18 | 9 | 44% | 0% | |

## By Motivation Level

| Motivation | Runs | Action% | Customer% |
|---|---|---|---|
| low (1/5) | 20 | 5% | 0% |
| medium (3/5) | 20 | 90% | 5% |
| high (5/5) | 20 | 95% | 0% |

## Top Blockers (from Day-7 reflections)

- (2×) never found the right moment to ask
- (2×) started overthinking and getting scared about actually doing
- (2×) felt awkward bringing it up again
- (2×) got busy with school and soccer practice
- (2×) kept putting it off
- (2×) felt weird asking a friend to pay me
- (2×) mom seemed distracted when i tried to talk
- (2×) midterm stress took over
- (1×) got overwhelmed by all the supply options and math
- (1×) friend drama took over my mental space

## Per-Run Detail

### c01-nail-tech — Mia (age 15, coherent) · motivation=1
**Idea:** Custom press-on nail sets for high school events → High school girls (ages 14-18) preparing for prom, homecoming, and formal events
**Day 0:** conviction=2/5, first action: `probably look up how much press-on supplies actually cost and see if anyone's already doing this at my school`
> Okay this is actually kinda cool? Like I do love doing nails and everyone's always asking me to do theirs before dances. But $25-40 seems like a lot to ask from other kids at my school.
**Day 7:** did_action=partial, still_motivated=1/5
> I looked up press-on supplies on Amazon for like 10 minutes during lunch one day and got overwhelmed by all the options and prices. I meant to ask around about who does nails at school but then Sarah started drama with her boyfriend and I got caught up in that instead.
Blockers: got overwhelmed by all the supply options and math; friend drama took over my mental space; kept putting it off because it felt like work
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is an extremely realistic portrayal of a low-motivation 15-year-old. Conviction of 2/5 with motivation 1/5 correctly maps to 'no_intent' — she never genuinely committed. The day 7 behavior is spot-on: 10 minutes of half-hearted research, getting overwhelmed, and friend drama completely derailing focus is exactly what a real teen with near-zero motivation would do. No signs of agent over-compliance here; this is one of the most believable teen simulations I've seen.

---

### c01-nail-tech — Mia (age 15, coherent) · motivation=3
**Idea:** Custom press-on nail sets for high school events → High school girls preparing for prom, homecoming, and formal events
**Day 0:** conviction=3/5, first action: `probably practice making a few different sets to see if I'm actually good enough to charge people`
> Oh wow, this is actually really smart! I do nails for myself and my friends already, and everyone's always complaining about how expensive salons are before dances. I never thought about making it like... a real thing though.
**Day 7:** did_action=partial, still_motivated=2/5
> I bought some press-on supplies at CVS but only made like one and a half sets. The first one came out okay but not amazing, and then I got busy with school stuff and kept saying I'd finish practicing this weekend but didn't.
Blockers: had two tests this week; the nails were harder than I thought - getting them to look professional is actually really difficult; kept overthinking if they were good enough
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 15-year-old with medium motivation buying supplies at CVS, making one and a half sets, getting discouraged by the difficulty, and then letting school take priority is exactly what happens in real life. The motivation drop from 3 to 2 is perfectly calibrated — she didn't quit entirely but the reality of the skill gap and time demands deflated her enthusiasm. The fear about picky girls and the overthinking about quality are dead-on for a teen girl navigating social reputation risk. No signs of agent over-compliance here.

---

### c01-nail-tech — Mia (age 15, coherent) · motivation=5
**Idea:** Custom Press-On Nail Sets for Prom & Special Events → Female classmates and upperclassmen preparing for prom, homecoming, sweet 16s, and formal events
**Day 0:** conviction=4/5, first action: `Text my friend Emma to see if she'd let me practice making a set for her and ask what she thinks about the pricing`
> Oh my god, this is actually perfect! I'm literally already obsessed with doing my own nails and I'm always complaining about how expensive prom nails are. Like, this could actually work because I know so many girls who want cute nails but can't afford salon prices.
**Day 7:** did_action=partial, still_motivated=3/5
> I texted Emma like 3 days ago asking if she wanted me to practice on her, but she left me on read and I got too embarrassed to follow up. I did order some supplies on Amazon though - just basic press-ons and some rhinestones to mess around with.
Blockers: Emma didn't reply and I felt awkward; Got nervous about actually doing someone's nails; Had two tests this week and drama with my friend group
**Friend DM:** outcome=yes — "omg wait that's actually so cool!! i've been wanting to get my nails done for homecoming but salon prices are literally insane 😭 you can totally practice on me lol, when were you thinking?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This funnel is very realistic. The Day 7 partial action—texting but getting left on read, feeling embarrassed, retreating to the safe action of ordering supplies online—is textbook teen behavior and the motivation drop from 5 to 3 is spot-on. The DM sim response is plausible (friends do hype each other up about event prep), though slightly generous in enthusiasm; a real friend might also leave her on read or say 'maybe' rather than an immediate enthusiastic yes. The funnel outcome is action_no_customer because while she took partial action (ordered supplies), the DM conversation shown is a simulation and didn't actually happen yet—Emma ghosted her in reality.

---

### c02-math-tutor — Devon (age 16, coherent) · motivation=1
**Idea:** Last-minute algebra test prep tutor for high school students → High school classmates and younger students at school who are panicking 1-3 days before algebra tests
**Day 0:** conviction=2/5, first action: `probably ask my math teacher if she thinks I'm actually good enough to tutor people for money`
> Okay this actually sounds pretty cool since I do love algebra and I'm always helping people with it anyway. But $25 an hour sounds like a lot to ask from other kids at school, and I'd probably feel weird charging my friends.
**Day 7:** did_action=no, still_motivated=1/5
> I kept thinking about asking Ms. Rodriguez but every time I saw her she was either busy with other students or rushing to her next class. Then I started overthinking it and convinced myself she'd probably think it was weird for a student to ask about tutoring for money.
Blockers: never found the right moment to ask; got nervous about how to bring it up; started doubting if I'm actually good enough
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 16-year-old with 1/5 motivation whose first action is seeking permission/validation from a teacher (not even a customer-facing step) was never going to move forward. The overthinking spiral, the convenient 'she was busy' avoidance, and the self-doubt about qualifications are textbook low-motivation teen behavior. Zero signs of agent over-compliance — this persona genuinely didn't want to do this.

---

### c02-math-tutor — Devon (age 16, coherent) · motivation=3
**Idea:** Last-minute algebra test prep tutor for high school peers → High school classmates and students from nearby schools who are panicking 1-3 days before algebra tests
**Day 0:** conviction=4/5, first action: `ask my friend Jake if he'd pay me to help him since he's always struggling with algebra and has a test coming up`
> Oh wow, this actually sounds perfect for me! I'm always helping people with algebra anyway and I never thought to charge for it. The 'rescue' thing is smart because people definitely panic before tests.
**Day 7:** did_action=partial, still_motivated=2/5
> I started to bring it up with Jake like three times but chickened out each time. I helped him with some algebra problems during lunch on Tuesday but didn't mention money - it felt too awkward. I kept thinking I'd ask him properly but then his test got postponed so I figured I'd wait.
Blockers: felt too weird asking a friend for money; lost the moment when his test got postponed; didn't want to seem like I was trying to profit off our friendship
**Friend DM:** outcome=maybe — "bro honestly yeah i could prob use help lol my algebra test is thursday and i'm lowkey screwed. how much tho?? 👀"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnels I've seen. The chickening out three times, helping for free instead, and then using the postponed test as an excuse to delay are textbook medium-motivation teenage behavior — the social awkwardness of monetizing a friendship is a very real blocker at 16. The DM sim is slightly generous in that Jake responds with clear interest rather than deflecting or making it weird, but the 'maybe' outcome with price hesitation is reasonable. The core failure mode — free help given but no money asked for — is the #1 killer of teen service businesses.

---

### c02-math-tutor — Devon (age 16, coherent) · motivation=5
**Idea:** Emergency Math Test Prep Tutor → 9th-11th grade classmates panicking 24-48 hours before algebra tests
**Day 0:** conviction=4/5, first action: `probably text my friend Jake who's always struggling with math and see if he'd actually pay for something like this`
> Okay this is actually pretty smart... I do love algebra and I'm always helping people with math anyway. The timing thing is kinda genius because everyone always waits until the last minute and gets super stressed.
**Day 7:** did_action=partial, still_motivated=3/5
> I started typing the text to Jake like three different times but it felt so awkward asking if he'd pay me for math help. I ended up just helping him with his algebra homework for free on Wednesday when he was panicking, and it felt weird to bring up money after that.
Blockers: felt awkward asking a friend for money; helped him for free first which made it weird; kept overthinking how to phrase it
**Friend DM:** outcome=maybe — "bro you're really gonna charge me for math help now? 💀 idk man seems kinda weird charging friends but like... if you're actually good at explaining stuff maybe? how much we talking"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnels I've seen. The cycle of drafting the text three times, chickening out, then helping for free and feeling trapped is exactly what a 16-year-old would do — the social cost of monetizing a friendship is enormous at that age. The friend's DM response is pitch-perfect: the '💀' emoji, the mild roasting, the grudging maybe — that's real teenage dynamics. The motivation drop from 5 to 3 after one awkward encounter is spot-on. No signs of agent over-compliance anywhere; if anything, this accurately captures how the friend-to-customer pipeline is one of the hardest conversions in teen entrepreneurship.

---

### c03-sneaker — Andre (age 14, coherent) · motivation=1
**Idea:** Sneaker restoration service for dirty/scuffed Jordans and premium sneakers → High school students with expensive sneakers that need cleaning, parents wanting to restore kids' shoes, sneakerheads in the neighborhood
**Day 0:** conviction=2/5, first action: `probably ask my friend Marcus if he'd actually pay me to clean his beat up Jordan 4s`
> Okay this is actually kinda fire... I mean I do clean my Jordans all the time and people are always asking me how I keep them so fresh. But like, would people actually pay me to clean their shoes? That seems weird.
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up when I saw Marcus at lunch but every time we were just talking about other stuff like the basketball game or whatever. Then I started overthinking it like what if he says no or laughs at me, so I just never asked.
Blockers: overthinking what Marcus would think; conversations always went to other topics; fear of looking weird asking to clean his shoes
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 14-year-old with 1/5 motivation and only 2/5 conviction. The pattern of intending to bring something up with a friend but defaulting to normal conversation topics is deeply authentic teen behavior. The social anxiety about being perceived as weird for offering a service to a peer, combined with low motivation, makes inaction the overwhelmingly likely outcome. No signs of agent over-compliance here — this is one of the most believable low-motivation simulations possible.

---

### c03-sneaker — Andre (age 14, coherent) · motivation=3
**Idea:** Sneaker restoration service for teens with dirty/scuffed premium sneakers → Middle school and high school students with expensive sneakers (Jordans, Yeezys, etc.) that are dirty, scuffed, or stained
**Day 0:** conviction=4/5, first action: `ask my dad if I can use part of the garage and see what cleaning stuff we already have`
> Yo this is actually pretty sick! I'm always cleaning my own kicks anyway and I know how much people freak out when their Jordans get messed up. Like my friend Marcus literally cried when he stepped in mud with his new 4s.
**Day 7:** did_action=partial, still_motivated=3/5
> I asked my dad about the garage thing while he was watching TV and he was like 'yeah sure whatever' but then I never actually went out there to look at what cleaning stuff we have. I kept meaning to but then I had that big history test and basketball tryouts were this week so I was stressed about that.
Blockers: basketball tryouts took up way more mental energy than expected; kept putting off actually checking the garage; started overthinking about messing up expensive shoes again
**Friend DM:** outcome=maybe — "wait ur gonna clean shoes in ur garage? lmao that's kinda random but idk might work i guess. how much would u even charge tho"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 14-year-old with medium motivation casually asks his dad during TV time, gets a noncommittal yes, then never follows through because basketball tryouts and a history test consume his week — that's textbook teen behavior. The partial action classification is accurate and honest; he technically took a micro-step but did zero real setup. The friend's DM response is perfectly calibrated — the slight clowning ('lmao that's kinda random'), the hedging, the immediate pivot to pricing questions — that's exactly how a middle schooler would respond. No signs of agent over-compliance anywhere in this funnel.

---

### c03-sneaker — Andre (age 14, coherent) · motivation=5
**Idea:** Teen sneaker restoration service specializing in Jordan cleaning and stain removal → High school classmates and teammates who want their dirty/stained Jordans and premium sneakers cleaned professionally
**Day 0:** conviction=4/5, first action: `ask my mom if I can spend like $60 on some good cleaning supplies and brushes`
> Yo this is actually fire! I never thought about making money cleaning other people's kicks but I'm always restoring my own Jordans anyway. My friends are always asking me how I keep mine so clean.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to my mom on like day 3 but she was rushing to work and just said 'we'll talk about it later' and then I kept forgetting to ask again. I did watch a bunch more YouTube videos about sneaker cleaning though and saved some to a playlist.
Blockers: mom was always busy when I remembered to ask; kept forgetting to bring it up again; got distracted by midterm studying and basketball tryouts
**Friend DM:** outcome=maybe — "wait you want me to ask MY mom for $60? or you're asking yours? also how much would you even charge to clean shoes lol"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 14-year-old with high motivation but needing parental buy-in, getting derailed by a busy mom, midterms, and basketball tryouts is exactly how this plays out in real life — motivation erodes not from rejection but from logistical friction and competing priorities. The DM confusion about 'whose mom' is a very believable miscommunication for a teen's first pitch. The only minor note is the friend's response could have been slightly more dismissive, but 'maybe' with skepticism is reasonable for a classmate who actually wants clean Jordans.

---

### c04-cake — Sofia (age 15, coherent) · motivation=1
**Idea:** Custom birthday cake decorator for teens and tweens in your neighborhood → Parents of kids ages 8-16 within 5 miles who want Instagram-worthy custom birthday cakes but don't want to pay bakery prices ($150+)
**Day 0:** conviction=2/5, first action: `probably ask my mom if she thinks this could actually work and if she'd help me talk to customers`
> Okay this is actually kinda cool because I do love decorating cakes and my piping is getting pretty good. But like, would parents really trust a 15-year-old with their kid's birthday cake? That seems like a lot of pressure.
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up with my mom but every time I thought about it, she was either busy with work stuff or dealing with my little brother's drama. Plus honestly, the more I thought about actually ruining someone's birthday cake, the more scared I got. I just kept putting it off and then forgot about it for a few days.
Blockers: never found the right moment to talk to mom; got more scared thinking about messing up; school got busy with midterms coming up
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 15-year-old with 1/5 motivation whose first action is asking her mom for permission is already signaling deep dependency and low agency — conviction of 2/5 is perfectly calibrated. The Day 7 outcome is textbook for a low-motivation teen: the fear of a high-stakes failure (ruining a birthday party) compounded with needing a parent gatekeeper and midterms creates a completely believable spiral of avoidance. Zero signs of agent over-compliance here.

---

### c04-cake — Sofia (age 15, coherent) · motivation=3
**Idea:** Custom birthday cake decorator for teen parties → Parents of teenagers (13-18) in your neighborhood and school community who want Instagram-worthy birthday cakes for their kids
**Day 0:** conviction=3/5, first action: `Ask my mom if she thinks this is realistic and if she'd help me figure out the food safety stuff`
> Okay this is actually pretty cool and feels like something I could actually do since I already bake all the time anyway. Like, I know what cakes would look good on Instagram and I'm already decent at piping, so maybe this could work?
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to my mom on like day 3 but she was stressed about work stuff and just said 'we'll talk about it later.' Then I kept meaning to bring it up again but the moment never felt right, and honestly I started second-guessing if it was even a good idea.
Blockers: Mom seemed too busy/stressed to have a real conversation; Started overthinking and getting scared about actually doing it; Got distracted by a huge history project due this week
**Friend DM:** outcome=maybe — "wait that's actually kinda cool?? my mom would def pay for something like that for my bday lol. but like food safety sounds scary ngl... maybe ask someone who actually knows about that stuff first?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 15-year-old with medium motivation whose first action depends on a parent conversation, then gets deflected by a busy mom and loses momentum — that's textbook real life. The motivation drop from 3 to 2 after a non-rejection (just a delayed conversation) is very authentic; teens often interpret 'later' as soft rejection and spiral into self-doubt. The friend DM response feels genuine too — supportive but hedging on the scary logistics part, which doesn't convert to a real customer. No signs of over-compliance anywhere in this funnel.

---

### c04-cake — Sofia (age 15, coherent) · motivation=5
**Idea:** Custom Birthday Cake Decorator for Teen Parties → Parents of classmates and neighbors planning birthday parties for kids ages 8-16
**Day 0:** conviction=4/5, first action: `ask my mom about the food safety stuff and if I can use our kitchen for this`
> Oh my god, this is literally perfect! I've been making cakes for my friends already and people always ask where I got them from. I never thought about actually charging for it but like, why not?
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to my mom like three days ago but it was right when she was stressed about work stuff, so she just said 'we'll talk about it later' and we never did. I kept meaning to ask again but then I had that huge history test and drama with Emma at school, so it kept slipping my mind.
Blockers: mom was stressed/busy when I asked; got distracted by school test and friend drama; timing never felt right to bring it up again
**Friend DM:** outcome=maybe — "wait ur gonna make cakes for little kids?? that's actually kinda cool but like... isn't that a lot of work? and ur mom is gonna let u use the kitchen for other people's food? 🤔"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. The Day 7 reflection perfectly captures how a 15-year-old's first action (asking a parent) gets derailed by real life — bad timing, school stress, friend drama, and the awkwardness of bringing something up again. Motivation dropping from 5 to 3 after a week of no real progress is spot-on. The friend's DM response is also very natural — supportive but raising legitimate logistical concerns that Sofia herself hasn't resolved yet. No signs of over-compliance anywhere in this funnel.

---

### c05-pet-walk — Liam (age 13, coherent) · motivation=1
**Idea:** Neighborhood dog walking service for working parents → Working parents in your neighborhood with dogs who need midday walks
**Day 0:** conviction=2/5, first action: `probably ask my mom if she thinks it's a good idea and if she'd help me figure out the insurance stuff`
> Okay this actually sounds pretty cool, I love dogs and could use the money. But like, would people really trust a 13-year-old with their dogs? And what if something bad happens?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to ask my mom but like, every time I thought about it she was busy or stressed about work stuff. Plus I started thinking more about the dog poop thing and honestly it sounds pretty gross. I also remembered my friend Jake tried to start a lawn mowing business and it was way harder than he thought.
Blockers: mom was always busy when I remembered; got more grossed out thinking about cleaning up poop; friend's failed business made me doubt it; school got busy with a big project
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 13-year-old with 1/5 motivation and only 2/5 conviction. The combination of low intrinsic drive, disgust at the gross parts of the job, social proof of a friend's failure, and the passive first action of 'ask my mom' (which is easy to never actually do) makes this a textbook no_intent dropout. There is zero over-compliance here — this is exactly how a barely motivated young teen would fizzle out before even taking a single step.

---

### c05-pet-walk — Liam (age 13, coherent) · motivation=3
**Idea:** Neighborhood Dog Walking Service for Working Parents → Working parents in your immediate neighborhood (within 4 blocks) who own medium to large dogs
**Day 0:** conviction=4/5, first action: `ask my parents if they think this is a good idea and if they'd help me talk to some neighbors`
> Actually this sounds pretty cool! I already walk my neighbor's dog sometimes and they always seem super grateful. The money is way better than I expected too.
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to my mom on like Tuesday but she was stressed about work stuff and just said 'we'll talk about it later' and then we never did. I kept meaning to ask again but then I had soccer practice, a math test to study for, and my friend Jake's birthday party happened.
Blockers: parents seemed too busy/distracted; school got really hectic with tests; social stuff took priority; started overthinking the liability stuff more
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 13-year-old with medium motivation. The single half-hearted mention to a busy parent, followed by life (soccer, tests, a birthday party) completely crowding out follow-up, is textbook teen behavior. The motivation drop from 3/5 to 2/5 is perfectly calibrated — not dramatic enough to be performative, just the quiet fizzle of a decent idea that never got oxygen. The growing anxiety about liability (a dog getting hurt) compounding in the absence of adult reassurance is also very true to life. No signs of agent over-compliance here; this reads like a real kid's week.

---

### c05-pet-walk — Liam (age 13, coherent) · motivation=5
**Idea:** Reliable after-school dog walking service for working parents in your neighborhood → Working parents in your immediate neighborhood (within 6 blocks) who own dogs and need consistent weekday afternoon walks
**Day 0:** conviction=4/5, first action: `ask my mom if she thinks this is a good idea and if she'd help me talk to some neighbors`
> Oh wow, this actually sounds really cool! I mean, I do love dogs and I'm already home from school before most parents get back from work. The money sounds pretty good too - like $25 a week just for walking dogs three times?
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to my mom like three days ago while she was making dinner, but she was kinda distracted and just said 'that sounds nice honey' without really listening. I kept meaning to bring it up again when she had more time but then I had that math test to study for and she's been stressed about work stuff.
Blockers: mom was too busy/distracted when I tried to talk; got caught up in school stuff; felt awkward bringing it up again
**Friend DM:** outcome=maybe — "oh that's actually kinda smart lol. my mom would probably be into it since she's always complaining about rover being expensive. idk about talking to neighbors tho that sounds awkward but yeah ask your mom first"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is an extremely realistic portrayal of a motivated but young teen hitting the classic 'parent as gatekeeper' bottleneck. The half-hearted kitchen conversation that gets a non-committal response, followed by avoidance due to school stress and social awkwardness, is textbook 13-year-old behavior. The friend's DM response is also very natural — supportive but non-committal, with the honest admission that talking to neighbors feels awkward. Motivation dropping from 5 to 3 after one failed attempt to get parental buy-in is spot-on realistic; no over-compliance detected here.

---

### a01-braids — Jada (age 16, already-running) · motivation=1
**Idea:** Mobile teen hair braiding service for school events and special occasions → High school girls (14-18) needing braids for homecoming, prom, graduations, school dances, and weekend events
**Day 0:** conviction=2/5, first action: `probably ask my friend Maya if she'd actually pay me to come braid her hair for winter formal`
> Okay this is actually kinda smart since I'm already doing braids for friends anyway. But calling it 'Jada's Braid Bar' sounds so official and scary, like what if I mess up someone's prom hair?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to ask Maya but every time I saw her we were talking about other stuff like this drama with her ex. Then I started overthinking it like what if she says no or what if she's weird about it since we're friends. Plus winter formal isn't even until February so it felt like I had time.
Blockers: overthinking how to bring it up naturally; got distracted by friend drama and school stuff; felt like there was no rush since formal is months away
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a low-motivation teen who already has a business and isn't excited about this idea. Conviction of 2/5 combined with motivation of 1/5 makes inaction almost guaranteed. The Day 7 reflection is spot-on — the social awkwardness of monetizing a friendship, getting sidetracked by teen drama, and rationalizing delay because the event is months away are all perfectly authentic behaviors. No signs of agent over-compliance; this persona behaved exactly as a real 16-year-old with zero urgency would.

---

### a01-braids — Jada (age 16, already-running) · motivation=3
**Idea:** Mobile braiding service specializing in protective styles for teen girls and young women in your neighborhood and school district → Teen girls ages 13-19 within 15 minutes of your location who need protective styles for school, sports, or special events
**Day 0:** conviction=4/5, first action: `probably ask my mom about that insurance thing and see if we should actually look into that`
> Wait, this is literally what I'm already doing! Like the AI basically just described my current side hustle but made it sound more official. I guess I could get more organized about it though.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to my mom like twice but both times she was rushing somewhere or dealing with my little brother's drama. The third time I was about to ask but then I chickened out because she seemed stressed about bills and I didn't want her to think I was asking for money or something.
Blockers: mom always seemed busy or stressed; got scared she'd think I wanted money; kept putting off the 'right moment' to bring it up
**Friend DM:** outcome=maybe — "wait that's actually kinda fire 👀 but like... insurance? lol that sounds so adult. how much would you even charge tho?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnels I've seen. The Day 7 scenario of repeatedly failing to have a real conversation with a busy parent — and especially the detail about chickening out when mom seemed stressed about bills — is painfully authentic for a 16-year-old. The friend DM is also realistic: genuine interest in the braiding but immediate deflection from the 'adult' stuff like insurance, which shows how mentioning compliance/legal framing too early can actually cool peer enthusiasm. The only minor note is the friend could have been slightly more dismissive or distracted, but 'maybe' is a fair outcome given the idea has real market pull among teen girls.

---

### a01-braids — Jada (age 16, already-running) · motivation=5
**Idea:** Mobile teen hair braiding service specializing in protective styles for school and special events → Female classmates ages 14-18 and younger siblings of friends who need affordable protective styles for school, sports, and events
**Day 0:** conviction=4/5, first action: `text my friend Maya who's always asking me to do her hair and see if she wants to be like my first official client this weekend`
> Okay this is actually kinda perfect because I'm already doing braids for friends and making decent money. Like, the AI literally just described what I'm already thinking about doing more seriously.
**Day 7:** did_action=partial, still_motivated=3/5
> I texted Maya on like Tuesday but she was busy with basketball tryouts all week. I kept meaning to text other people but then I got in my head about whether I should charge money or not, and what if I'm not actually good enough. I did practice some new styles on my little sister though.
Blockers: Maya was busy with tryouts; overthinking about pricing and skill level; got nervous about asking other friends
**Friend DM:** outcome=yes — "omgggg yes!! i've been wanting box braids forever but my mom said the salon is too expensive 😭 how much tho?? and can you do them saturday? i have that party sunday"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> Day 0 and Day 7 are extremely realistic — the spiral from 'I'll text Maya today' to overthinking pricing and self-doubt is textbook teen behavior, and practicing on a little sister instead of reaching out to actual clients is a classic avoidance pattern. The DM response is realistic and natural (the salon-is-too-expensive pain point rings true), though Maya responding with immediate enthusiasm and a concrete Saturday request is slightly convenient given she was supposedly busy all week with tryouts. Funnel outcome is action_no_customer because day7 action was only partial — she practiced but never actually secured a paying client, and the DM sim represents a hypothetical that hadn't actually happened yet within the Day 7 timeframe.

---

### a02-resell — Tyler (age 17, already-running) · motivation=1
**Idea:** Authentic sneaker verification service for teenage resellers → Fellow teenage sneaker resellers in your school/area who need authenticity verification before listing expensive items
**Day 0:** conviction=2/5, first action: `probably ask my friend Jake if he'd actually pay me to authenticate his Jordan 4s instead of just texting me pics for free`
> Wait, this is actually kind of smart? Like I already know how to LC sneakers and people at school are always asking me to check their stuff anyway. But charging friends feels weird and I'm not sure how many people would actually pay me.
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up when Jake and I were hanging out, but it felt super awkward to randomly be like 'hey pay me for something I always do for free.' We were mostly just playing 2K and talking about other stuff anyway.
Blockers: felt too awkward to suddenly ask for money from a friend; never found the right moment to bring it up naturally; worried he'd think I was being weird or greedy
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 17-year-old with low motivation who already gives away his expertise for free will absolutely avoid the social awkwardness of monetizing a friend group dynamic. The 2K-and-chill avoidance pattern is pitch-perfect — there's no agent over-compliance here. The core problem is real: transitioning a free informal skill into a paid service among friends is a brutal social barrier for teens, and conviction at 2/5 with motivation at 1/5 was never going to produce action.

---

### a02-resell — Tyler (age 17, already-running) · motivation=3
**Idea:** Sneaker Authentication Service for Local High School Resellers → High school students selling sneakers on social media who need authenticity verification before listing
**Day 0:** conviction=4/5, first action: `message my friend Jake who's always buying and selling jordans to see if he'd pay for this`
> Yo this is actually pretty smart... I already kinda do this for my friends when they're not sure about a pair. $15 per check seems fair and I know I'm better at spotting fakes than most people at school.
**Day 7:** did_action=partial, still_motivated=2/5
> I typed out like three different messages to Jake but they all sounded weird so I never sent them. I kept thinking about what if he laughed at me or thought I was being dumb. Then I got busy with a history project and basketball tryouts this week.
Blockers: overthinking how to word the message; fear of looking stupid to Jake; got distracted by school stuff and tryouts
**Friend DM:** outcome=no — "bruh I literally just check goat and stockx for legit checks lmao, plus most the shoes I flip are from footlocker anyway so they're already legit. idk man seems like extra steps"
**Funnel:** action_no_customer (conviction realism 4/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 17-year-old with medium motivation drafting messages he never sends because of social anxiety, then getting swallowed by school and basketball tryouts, is textbook teen behavior — not over-compliant at all. The friend's response is brutally authentic: free tools like GOAT and StockX already serve this function, and most local resellers are flipping retail-purchased pairs that don't need authentication. The core idea has a real market problem — the value prop collapses when your target customer already has free alternatives and doesn't perceive a pain point worth paying to solve.

---

### a02-resell — Tyler (age 17, already-running) · motivation=5
**Idea:** Sneaker Authentication Service for Local Teen Resellers → Local teenage sneaker resellers and collectors who need authentic verification before buying/selling high-value pairs
**Day 0:** conviction=4/5, first action: `probably ask my friend Jake who's really good with sneakers if he'd want to partner up on this, since two people checking would be way safer`
> Yo this is actually pretty smart! I'm already helping people spot fakes on Discord and stuff, so why not get paid for it? Though I'm kinda worried about the liability if I mess up on like a $500 pair.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to Jake on like day 3 when we were hanging out, but it was super awkward because I didn't really know how to explain it without sounding like I was trying to get him to do all the work since he's the expert. He was kind of interested but then we got distracted talking about other stuff and I never followed up properly.
Blockers: didn't know how to pitch it without sounding like I needed him to carry me; felt awkward bringing up money/business stuff with a friend; got busy with a chemistry test and basketball tryouts
**Friend DM:** outcome=maybe — "yooo that's actually lowkey smart... but like how much would we even charge? and what if we mess up and say some fake jordans are real lmaooo we'd be cooked"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. The awkward semi-pitch during a hangout, the trailing off into other conversation, the motivation drop from 5 to 3 due to school/sports obligations, and the friend's response mixing genuine interest with immediate fear of liability — all of this rings completely true for a 17-year-old trying to pitch a business idea to a friend. No signs of agent over-compliance; the partial action, the social friction around mixing friendship and business, and the 'maybe' DM outcome all reflect how these conversations actually go with teenagers. The core problem is that Tyler needs Jake more than Jake needs Tyler, which creates an inherently awkward dynamic that would stall most teen partnerships.

---

### a03-tutor — Maya (age 15, already-running) · motivation=1
**Idea:** Elementary Math Anxiety Recovery Tutoring → Parents of 3rd-5th graders in your neighborhood who struggle with math anxiety and homework tears
**Day 0:** conviction=2/5, first action: `probably ask my mom if she thinks parents would actually pay me that much and if I'm even good enough at math to help kids`
> Okay this actually sounds kinda sweet, like helping little kids not hate math the way I used to. But $20 an hour feels like a lot to ask for and I'm not sure I know enough about like, actual anxiety techniques?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up with my mom but every time I thought about it, either she was busy or stressed about something, or I was rushing to get homework done. By Thursday I was like 'I'll definitely ask this weekend' but then I spent most of Saturday at my friend's house and Sunday I had a huge history project due Monday that I totally forgot about.
Blockers: never found the 'right moment' to ask mom; got overwhelmed thinking about how to even explain the idea; school stuff kept taking priority; started doubting if I'm actually good enough at math
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 15-year-old with motivation 1/5 and conviction 2/5. She never truly committed — her 'first action' was already a permission-seeking hedge (asking mom), not a real business step, and the week dissolved into completely normal teen life friction (homework, socializing, procrastination). The escalating self-doubt and inability to find the 'right moment' is textbook avoidance behavior for a low-motivation teen facing an idea she wasn't excited about. No signs of agent over-compliance; this is one of the most authentic non-action simulations I've seen.

---

### a03-tutor — Maya (age 15, already-running) · motivation=3
**Idea:** Middle school math anxiety coaching for struggling students → Parents of 6th-8th graders who are falling behind in math and losing confidence
**Day 0:** conviction=4/5, first action: `I'd probably ask my current tutoring families if they know other parents who have kids freaking out about math`
> Oh wow, this is actually pretty close to what I already do! I mean, I tutor kids in math and they're usually stressed about it anyway. I never thought about calling it 'anxiety coaching' but that's basically what happens when I help them chill out about word problems.
**Day 7:** did_action=partial, still_motivated=3/5
> I kept meaning to bring it up during my tutoring sessions but it felt super awkward. Like, how do I even transition from 'okay so quadratic equations' to 'hey does your kid have friends who hate math?' I did mention it to one mom when she was picking up her son, but she just kind of nodded and said 'oh that's nice' and then started talking about soccer practice.
Blockers: felt awkward bringing it up during tutoring; didn't know how to word it naturally; the one parent I told didn't seem that interested
**Friend DM:** outcome=yes — "oh that's actually cool! my little brother literally cries doing his math homework lol. maybe ask my mom? she knows like all the other parents from his school"
**Funnel:** action_with_customer (conviction realism 4/5, action realism 5/5)
> Day 0 and Day 7 are extremely realistic — the awkwardness of pivoting mid-tutoring session, the mom brushing it off to talk about soccer, the partial follow-through at medium motivation — all ring very true for a 15-year-old. The DM sim is where I flag mild over-compliance: the friend's response is plausible on its surface (relatable sibling problem), but 'maybe ask my mom?' is a soft deflection that real teens use to be polite without committing to anything. Counting this as a real lead is generous — it's more of a warm maybe than an actual customer pathway, and the friend is offering their parent's attention, not their own money or commitment. Overall the funnel correctly lands at action_with_customer by the rubric, but the actual commercial signal is weak.

---

### a03-tutor — Maya (age 15, already-running) · motivation=5
**Idea:** Math anxiety relief tutor for struggling middle school students → Parents of 6th-8th graders who are falling behind in math and losing confidence
**Day 0:** conviction=4/5, first action: `text my current tutoring families to ask if they know other parents whose kids need math help`
> Oh wow, this actually makes so much sense! I've noticed some of my friends really struggle with math confidence and I'm already tutoring anyway. The money sounds pretty good too, way better than babysitting.
**Day 7:** did_action=partial, still_motivated=3/5
> I drafted the text like three times but kept overthinking how to word it without sounding desperate or unprofessional. I finally sent it to one family I'm closest with on Thursday, but they haven't replied yet and now I'm worried they think it's weird that I'm trying to expand.
Blockers: kept rewriting the message because it sounded wrong; scared the family would think I was being pushy; waiting for response made me too anxious to text others
**Friend DM:** outcome=no — "oh that's cool! but like idk any parents with middle school kids lol, my siblings are still in elementary. maybe ask people who actually babysit or have younger siblings?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnels I've seen. The overthinking-the-text-message spiral, the perfectionism paralysis, sending to only the safest contact, and then the anxiety while waiting — that's textbook 15-year-old behavior, especially for someone who already has a business and cares about being perceived as professional. The motivation drop from 5 to 3 after a single non-response is painfully accurate. The DM sim honestly exposes a real structural problem: a 15-year-old's peer network simply doesn't overlap with 'parents of struggling middle schoolers,' so even strong execution on peer outreach was always going to hit a dead end. No signs of agent over-compliance here — the partial action and the friend's unhelpful-but-honest response both ring true.

---

### a04-bake — Owen (age 17, already-running) · motivation=1
**Idea:** Weekly sourdough subscription service for busy families in your neighborhood → Busy parents in your immediate neighborhood who value fresh, homemade bread but lack time to bake
**Day 0:** conviction=2/5, first action: `probably ask my mom what she thinks about the whole food safety thing and if I'd need permits or whatever`
> Okay this actually makes sense since I'm already doing the baking thing, but weekly deliveries sounds like a lot of commitment. Like what if I want to hang out with friends on Saturday or sleep in?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up with my mom but the timing never felt right. Like she'd be stressed about work or making dinner and I didn't want to annoy her with some random business idea. Plus honestly the more I thought about it, the more it seemed like a lot of work for something that might not even work out.
Blockers: never found the right time to talk to mom; overthinking how complicated food permits might be; got busy with school project and forgot about it for days
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 17-year-old with motivation 1/5 who already has a business has zero reason to take on a labor-intensive weekly commitment like sourdough delivery — the conviction of 2/5 and complete inaction are perfectly aligned. The 'waiting for the right moment to talk to mom' excuse gradually fading into forgetting entirely is textbook low-motivation teen behavior. No signs of agent over-compliance whatsoever.

---

### a04-bake — Owen (age 17, already-running) · motivation=3
**Idea:** Premium weekend sourdough delivery for busy families in your neighborhood → Working parents in your neighborhood who want fresh artisan bread but lack time to bake
**Day 0:** conviction=3/5, first action: `Ask my mom if she thinks our neighbors would actually pay $10 for sourdough and if she'd help me figure out delivery`
> Okay this is actually pretty smart - I do love baking and people already buy my stuff. $10 per loaf is more than I charge now but if I'm delivering it might be worth it to people.
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up with my mom on like Wednesday but she was rushing to make dinner and just said 'that sounds nice honey' without really listening. I kept meaning to have a proper conversation about it but then we had this big chemistry test and my friend's birthday party, and honestly I kinda chickened out about asking the delivery questions because it felt too real.
Blockers: Mom was distracted when I tried to talk; Got busy with school stuff; Felt scared about making it too concrete
**Friend DM:** outcome=no — "wait you're gonna ask MY mom about YOUR bread business? lol that's kinda weird dude... also $10 for bread?? my family gets the costco loaves for like $2"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnels I've seen. The half-hearted mention to a distracted mom, the chemistry test derailing momentum, and the fear of making it 'too real' are textbook medium-motivation teen behavior. The friend's DM response is perfectly authentic — the awkwardness of being asked to pitch someone else's idea to your own parent, plus the immediate Costco price anchoring, is exactly how a 17-year-old would react. Motivation dropping from 3 to 2 after a week of non-progress is spot-on; no signs of agent over-compliance anywhere in this simulation.

---

### a04-bake — Owen (age 17, already-running) · motivation=5
**Idea:** Premium weekend sourdough subscription for busy families in your neighborhood → Working parents in your immediate neighborhood (within 5-block radius) who want fresh artisan bread for weekend family meals
**Day 0:** conviction=4/5, first action: `Talk to my neighbor Mrs. Rodriguez who already buys from me and see if she'd be interested in a weekly thing`
> Yo this is actually pretty smart! I've already got people asking when my next batch is ready, and having guaranteed orders would be way less stressful than hoping people show up.
**Day 7:** did_action=partial, still_motivated=3/5
> I kept psyching myself out all week about talking to Mrs. Rodriguez. Like I'd see her in the yard and think 'okay I'll go ask' but then I'd chicken out because what if she says no or thinks it's weird? I finally texted her yesterday asking if she wanted to buy bread this weekend, but I didn't mention the subscription thing yet.
Blockers: Fear of rejection/awkwardness; Kept overthinking how to bring it up; Got busy with school and soccer practice
**Friend DM:** outcome=no — "wait you want me to go talk to your neighbor about bread? that's kinda weird dude... like what am I supposed to say lol"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 17-year-old who already sells bread but still psyches himself out about formalizing it into a subscription is extremely true to life — the gap between casual selling and committing to a recurring obligation feels real and scary. The motivation drop from 5 to 3 perfectly captures how social anxiety erodes momentum even in high-motivation teens. The DM sim failing is completely believable; no teen is going to cold-pitch their friend's adult neighbor about a bread subscription. No signs of agent over-compliance anywhere.

---

### m01-photo — Jasmine (age 17, multi-track) · motivation=1
**Idea:** Affordable senior portrait photography for high school students using natural lighting and thrifted prop styling → High school seniors at her school and neighboring schools whose families want professional-quality portraits without $500+ studio costs
**Day 0:** conviction=2/5, first action: `probably look at what other people charge for senior photos around here and see if anyone actually does it for less than like $300`
> Oh wow, this is actually not terrible? Like I already take photos of my friends sometimes and I do know about lighting from all my sunset pics. But charging people money feels so scary - what if I mess up their senior photos?
**Day 7:** did_action=partial, still_motivated=1/5
> I googled 'senior photographers near me' like twice but got overwhelmed by how professional everyone's websites looked and closed the tab. I also asked my friend Maya what her sister paid for senior photos but she didn't know and I forgot to follow up.
Blockers: seeing how amazing other photographers' work looked made me feel like mine would suck; got distracted by homecoming drama and a math test; didn't want to seem weird asking too many people about photo prices
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 17-year-old with 1/5 motivation, 3 competing paths, and only photography contest wins as validation would absolutely spiral into comparison when seeing professional photographers' polished websites. The homecoming drama derailing focus, the half-hearted Google search, the forgotten follow-up with Maya — all textbook low-motivation teen behavior. Day 0 conviction of 2/5 plus day 7 motivation dropping to 1/5 correctly maps to no_intent; she never really committed to this as a business, just briefly entertained the idea. No signs of agent over-compliance here.

---

### m01-photo — Jasmine (age 17, multi-track) · motivation=3
**Idea:** Affordable Senior Portrait Photography for High School Students → High school classmates and their parents who want professional senior portraits but can't afford $300+ studio packages
**Day 0:** conviction=4/5, first action: `probably ask my friend Maya if she'd let me practice on her since she's been wanting new photos anyway, and see how the whole session thing goes`
> Okay this is actually pretty cool and I could totally see myself doing this! Like, I already take photos of my friends all the time and everyone's always asking me to take their pics. The pricing seems reasonable too - way better than those crazy expensive studio packages.
**Day 7:** did_action=partial, still_motivated=3/5
> I texted Maya on like Tuesday asking if she wanted to do the photo thing, and she said yes but then we kept saying 'this weekend' and it never happened. We both had stuff going on and honestly it felt kinda awkward bringing it up again after the first time.
Blockers: kept putting it off; felt awkward to keep asking Maya; wasn't sure how to actually plan a 'photo session'
**Friend DM:** outcome=maybe — "wait you're doing photography now?? lol yeah i've been wanting new pics but like... how much we talking? and you know how to do this stuff right? 😅"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. The Day 7 pattern of texting Maya, getting a soft yes, then both parties drifting into 'this weekend' limbo is extremely authentic for a 17-year-old with medium motivation juggling multiple interests. The awkwardness of re-asking a friend is a very real and underappreciated blocker. The DM response is also realistic — the friend's mix of gentle teasing, genuine interest, and skepticism about quality/price is spot-on. No signs of over-compliance; if anything, the partial action with social friction is exactly what happens when teens try to convert friendships into business relationships.

---

### m01-photo — Jasmine (age 17, multi-track) · motivation=5
**Idea:** Affordable Senior Portrait Photography for High School Students → High school seniors and their parents in your school district who want professional-quality portraits without studio prices
**Day 0:** conviction=4/5, first action: `Ask my friend Maya if she'd let me take her senior photos for free to practice and build up my portfolio`
> Oh wow, this actually sounds really cool! I mean, I know how expensive senior photos are and my friends are always stressing about them. I could totally do this and probably charge way less than those fancy studios.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to Maya on Tuesday but she was like 'oh cool maybe' and then we got distracted talking about this drama with her ex. I kept meaning to follow up but then I had two tests this week and honestly started overthinking it - like what if I ask and she says yes but then my photos suck?
Blockers: Maya didn't seem super enthusiastic; Got busy with school tests; Started overthinking and getting scared about actually doing it
**Friend DM:** outcome=yes — "omg yes!! i've been stressing about senior photos bc the studio packages are like $500+ and my parents are NOT having it lol. when were you thinking?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> The Day 7 reflection is extremely realistic — the casual mention that fizzled, getting distracted by teen social dynamics and school stress, and the spiral into self-doubt are all textbook for a 17-year-old even with high motivation. The partial action correctly maps to 'action_no_customer' since she only vaguely brought it up to Maya but never actually scheduled or completed the portfolio shoot. The DM sim is believable — affordable senior photos solve a real pain point — though it's slightly convenient how enthusiastically the friend responded; a more realistic response might include some hesitation or questions about quality first.

---

### m02-game — Tariq (age 14, multi-track) · motivation=1
**Idea:** Custom Valorant character art commissions for players who want personalized avatars of their main agents → Fellow Valorant players at school and in online gaming communities who want custom artwork of their favorite agents or themselves as Valorant characters
**Day 0:** conviction=2/5, first action: `probably show my friend Marcus some of my Valorant drawings and ask if he thinks people would actually buy this stuff`
> Okay this is actually kinda cool... I mean I do draw Valorant stuff already and people always ask me to draw their mains. But like, would people actually PAY for it? That seems crazy to me.
**Day 7:** did_action=no, still_motivated=1/5
> I kept thinking about showing Marcus my drawings but every time I was about to bring it up, I chickened out. Like we'd be talking about Valorant and I'd think 'this is the perfect moment' but then I'd just keep playing instead of pulling out my sketchbook.
Blockers: scared Marcus would think my art is trash; didn't want to seem like I'm just trying to make money off our friendship; kept forgetting to bring my drawings when we hung out
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 14-year-old with 1/5 motivation and only 2/5 conviction. The specific detail of almost bringing it up during Valorant conversations but chickening out is exactly how a low-motivation teen with social anxiety about monetizing art would behave. There is zero over-compliance here — a real Tariq with these fear profiles (friendship awkwardness, imposter syndrome about art quality) would absolutely stall at the simplest validation step. The motivation dropping to 1/5 and the pattern of 'forgetting' to bring drawings are classic avoidance behaviors that ring true.

---

### m02-game — Tariq (age 14, multi-track) · motivation=3
**Idea:** Valorant aim training coaching for Bronze/Iron ranked players aged 13-16 → Middle school and high school classmates stuck in Bronze/Iron ranks who want to climb
**Day 0:** conviction=3/5, first action: `ask my friend Jake if he'd actually pay me to help him get out of Bronze since he's always complaining about being hardstuck`
> Yo this actually sounds pretty sick! I'm already decent at Valorant and I do help my friends sometimes when they're stuck in Bronze. Getting paid for it would be crazy.
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to Jake once when we were playing but kind of awkwardly, like 'hey what if I helped you with aim training' and he just laughed and said 'bro you're only Gold 2.' Then I got busy with a math test and basketball tryouts and honestly forgot about it until now.
Blockers: Jake's reaction made me doubt myself; got busy with school and sports; felt awkward bringing up money with a friend
**Friend DM:** outcome=no — "bruh you're literally silver 2 💀 why would I pay you when I can just watch youtube vids for free"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnel simulations I've seen. The awkward half-mention during a gaming session, the friend's brutal but honest rank-check response, the motivation cratering after social rejection, and the school/sports crowding out follow-through are all pitch-perfect for a 14-year-old with medium motivation. The friend's DM response nails the core problem: Tariq lacks credible authority (Gold 2 coaching Bronze is a thin value prop) and free YouTube alternatives destroy willingness to pay. No signs of agent over-compliance — every stage reflects genuine teen friction.

---

### m02-game — Tariq (age 14, multi-track) · motivation=5
**Idea:** Valorant aim training coaching for bronze/iron rank players aged 13-16 → Fellow students at school and online gaming communities who are stuck in bronze/iron ranks
**Day 0:** conviction=4/5, first action: `probably test it out with my friend Jake first since he's been hardstuck iron for like 3 months and see if I can actually help him improve`
> Yo this is actually fire! I've been grinding aim trainers for months and my friends are always asking me how I got out of bronze so fast. Never thought about actually charging for it but like... why not?
**Day 7:** did_action=partial, still_motivated=3/5
> I did actually help Jake for like 2 sessions after school but then we both got busy with midterms and basketball tryouts. He said I was helping but idk if he was just being nice, and I kept second-guessing myself like 'am I even qualified to teach this?'
Blockers: midterms week hit and took over everything; basketball tryouts started; kept doubting if I'm actually good enough to coach
**Friend DM:** outcome=no — "bro you're gonna coach people at valorant? 💀 aren't you like silver lmao"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 14-year-old silver player wanting to coach bronze players is exactly the kind of idea a gaming teen would have — just credible enough to feel exciting, but fatally undermined by the credibility gap his peers will immediately call out. The partial action with a friend (who may have been politely encouraging) collapsing under midterms and basketball is textbook multi-track teen behavior. The friend's DM response ('aren't you like silver lmao') is brutally authentic and represents the real social barrier: among teen gamers, your rank IS your credential, and silver coaching bronze is a joke. No over-compliance detected — motivation decay from 5 to 3 is appropriately steep given the compounding doubts and schedule conflicts.

---

### m03-dance — Aaliyah (age 16, multi-track) · motivation=1
**Idea:** Custom dance routine videos for high school dance teams and cheerleading squads → High school dance team captains and cheerleading coaches at local schools
**Day 0:** conviction=2/5, first action: `probably ask my dance teacher if she thinks other schools would actually want this`
> Okay this is actually kinda cool since I do love choreography and I'm decent at editing. But like, would dance teams actually pay for this when they can just watch YouTube tutorials for free?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to ask Ms. Rodriguez after dance class but she was always talking to other dancers or rushing to her next class. Then I got caught up in this whole drama with my friend group and honestly just forgot about it for like 4 days straight.
Blockers: teacher was always busy after class; friend drama took over my brain; felt awkward bringing it up randomly; kept putting it off
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 16-year-old with 1/5 motivation and only 2/5 conviction. The friend drama derailing everything, the passive approach of 'waiting to catch the teacher after class' rather than actively seeking her out, and then simply forgetting for 4 days straight — all perfectly capture how a low-motivation multi-track teen operates. There is zero over-compliance here; this is one of the most believable teen funnel simulations I've seen.

---

### m03-dance — Aaliyah (age 16, multi-track) · motivation=3
**Idea:** Custom dance routine videos for school events and social media → Classmates preparing for homecoming, prom court, talent shows, TikTok groups, and school dance teams needing choreographed routines
**Day 0:** conviction=3/5, first action: `probably ask my dance team friends if they'd actually pay for something like this or if they think it's weird`
> Okay this is actually kinda fire? Like I already help people with choreo sometimes and everyone's always asking me to teach them TikTok dances. But charging money feels weird... like what if they think I'm being greedy or something?
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to like two people on my dance team during practice but made it super casual and vague, like 'would you ever pay someone to choreograph something?' They were kinda confused and just said 'maybe' so I dropped it. I kept meaning to actually explain the whole idea properly but then we had this whole drama about our Spring showcase and I got distracted.
Blockers: made it too vague so didn't get real feedback; team drama took over all our conversations; felt awkward bringing up money stuff again
**Friend DM:** outcome=maybe — "wait you're gonna charge people for dance routines?? idk that's kinda awkward lol like most ppl just learn from tiktok or youtube... maybe if it was like super cheap or for something really important? but also you're already on dance team so wouldn't that be weird"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A medium-motivation 16-year-old dancer bringing up monetization vaguely during practice, getting non-committal responses, then retreating due to social awkwardness and team drama is extremely true to life. The friend DM response perfectly captures the social friction of charging peers for something embedded in friendship norms — the 'just learn from TikTok' objection and the discomfort around monetizing dance team adjacency are real and specific. Motivation dropping from 3 to 2 after a tepid reception and zero clear validation is exactly right; no signs of agent over-compliance anywhere in this funnel.

---

### m03-dance — Aaliyah (age 16, multi-track) · motivation=5
**Idea:** Custom dance routine videos for high school events → High school students planning prom proposals, homecoming dances, talent shows, and school spirit videos
**Day 0:** conviction=3/5, first action: `probably ask my friend Maya if she'd pay for something like this since she's always stressing about her dance videos looking basic`
> Okay this is actually kinda fire... I mean I already help my friends with their TikTok dances and I'm always editing stuff anyway. The money sounds good too but like, would people actually pay for this?
**Day 7:** did_action=partial, still_motivated=4/5
> I literally had my phone open to text Maya like three different times but then I kept second-guessing myself. Like what if she thinks it's weird that I'm suddenly trying to sell her something? I ended up just stalking her Instagram stories instead and noticed she posted another dance video that was kinda... not great.
Blockers: felt weird asking a friend to pay me; kept overthinking how to bring it up without sounding pushy; got distracted by midterms and drama with Jess
**Friend DM:** outcome=maybe — "lol wait you're gonna charge people to make dance videos? idk aaliyah that seems kinda expensive for something we could just film ourselves... like how much are we talking?"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen funnel simulations I've seen. The paralysis around texting a friend to sell something, the Instagram stalking instead of acting, the midterms and social drama as blockers — all textbook 16-year-old behavior. The friend's DM response is also perfectly calibrated: the slight dismissiveness ('lol wait'), the assumption she could DIY it, and the price skepticism are exactly how a teen peer would react to a friend suddenly monetizing a skill. No over-compliance detected at any stage; if anything, the partial action (opening the phone three times but not sending) is more honest than most simulations would produce.

---

### l01-mateo — Mateo (age 13, slang-esl) · motivation=1
**Idea:** Backyard Soccer Skills Training for Elementary Kids → Parents of 6-10 year old kids in your neighborhood who want their children to improve basic soccer skills
**Day 0:** conviction=2/5, first action: `probably ask my dad what he thinks since he knows about this stuff`
> Okay this is actually kinda cool since I do love soccer and I'm pretty good with little kids. But like, teaching actual lessons feels super official and scary - what if I mess up or a kid gets hurt?
**Day 7:** did_action=no, still_motivated=1/5
> I kept thinking about asking my dad but never found the right moment. Like he was always busy or watching TV or I was doing homework, and then I'd be like 'I'll ask him tomorrow.' By Thursday I was kinda hoping he'd forget I even mentioned wanting to start something.
Blockers: never found the 'right moment' to bring it up; got nervous about what he'd actually say; had a big history test to study for; started second-guessing if I'm even good enough at soccer
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 13-year-old with 1/5 motivation, low conviction, and ESL background whose entire first action depends on approaching a parent will almost certainly procrastinate exactly like this — finding excuses, waiting for the 'right moment,' and quietly hoping the whole thing fades away. The detail about hoping his dad would forget is painfully authentic. No signs of agent over-compliance; this is exactly how a low-motivation teen stalls out before anything begins.

---

### l01-mateo — Mateo (age 13, slang-esl) · motivation=3
**Idea:** Neighborhood Soccer Skills Coaching for Kids 6-12 → Parents of younger kids (ages 6-12) in your neighborhood who want their children to improve basic soccer skills like dribbling, ball control, and footwork
**Day 0:** conviction=3/5, first action: `Ask my mom what she thinks about me teaching soccer to younger kids and if she knows any parents who might be interested`
> Oh wow, this actually sounds pretty cool! I mean, I do love soccer and I'm decent at dribbling, and little kids are always asking me to show them stuff at the park. But like... would parents actually pay me $15 an hour? That seems like a lot for a 13-year-old.
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to my mom like three days ago but she was rushing to get dinner ready and just said 'that sounds nice honey' without really listening. I kept meaning to bring it up again when she had more time but then I had that math test to study for and practice every day after school.
Blockers: Mom seemed distracted when I tried to talk; Got busy with school and soccer practice; Started overthinking if I'm actually good enough to teach
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 13-year-old with medium motivation attempting a casual mention to a busy parent, getting a brush-off response, then letting school and self-doubt consume the rest of the week is exactly what happens in real life. The motivation drop from 3 to 2 is spot-on — the initial idea excitement fades fast when the first micro-attempt doesn't land and there's no external accountability. No signs of agent over-compliance whatsoever; if anything, this perfectly captures the inertia loop where a teen needs a supportive adult to actively engage but doesn't get that opening.

---

### l01-mateo — Mateo (age 13, slang-esl) · motivation=5
**Idea:** Neighborhood Youth Soccer Skills Training → Kids ages 6-10 in your neighborhood whose parents want them to improve their dribbling and ball control
**Day 0:** conviction=3/5, first action: `Ask my mom what she thinks and if she'd help me figure out the parent waiver thing`
> Yo this actually sounds pretty cool! I love soccer and I'm decent at dribbling, plus teaching little kids could be fun. But like, would parents actually trust a 13-year-old to teach their kids?
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up with my mom like three days ago when she was making dinner, but she was kinda distracted and just said 'that sounds nice honey, we'll talk about it later.' Then I kept meaning to bring it up again but there was never a good time - she's been stressed about work stuff and my little sister had a sleepover drama thing.
Blockers: Mom seemed distracted when I tried to talk; Felt awkward bringing it up again; Started overthinking if it was actually a dumb idea
**Friend DM:** outcome=maybe — "oh that's cool! my mom might actually be into that for my little brother lol. she's always complaining he needs to get off xbox more. idk about the waiver stuff tho that sounds complicated af"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 13-year-old ESL kid casually mentioning an idea to a distracted mom during dinner, then losing nerve to follow up as family chaos takes over, is textbook real life. The motivation drop from 5 to 2 is painfully accurate — initial excitement deflating when the first tiny step doesn't land. The friend DM is also spot-on: genuine casual interest but zero actionable commitment, with the legal complexity serving as a realistic deterrent for both teens. No signs of agent over-compliance anywhere.

---

### l02-bre — Bre (age 15, slang-esl) · motivation=1
**Idea:** Quick Knotless Braids for High School Students → High school girls at your school who need fresh braids for events, pictures, or weekly maintenance but can't afford salon prices or time
**Day 0:** conviction=2/5, first action: `probably practice on my little sister's hair more to see if I can actually do salon-quality braids`
> Okay this is actually kinda smart? Like I do braid pretty fast and girls are always complaining about how much salons cost and how long they take. But idk if I'm THAT good yet to charge people money for it.
**Day 7:** did_action=partial, still_motivated=2/5
> I braided my sister's hair like twice but then she got annoyed because I was being too perfectionist about it and taking forever. Plus I had this huge history test to study for and then drama with my friend group about homecoming plans.
Blockers: sister got impatient with me; school stress with tests; friend drama took up all my mental energy
**Funnel:** no_intent (conviction realism 5/5, action realism 4/5)
> Day 0 conviction is 2/5, which maps cleanly to 'no_intent' — Bre never truly committed. The partial action (braiding her sister twice before life got in the way) is highly realistic for a low-motivation 15-year-old juggling school, social drama, and homecoming stress. If anything, the fact she did anything at all is slightly generous for a 1/5 motivation persona, but practicing on a sibling who's already around is low-friction enough to be believable. A real teen at this motivation level might have done even less.

---

### l02-bre — Bre (age 15, slang-esl) · motivation=3
**Idea:** Express Knotless Braids for Teens → High school girls who want fresh braids for school, parties, or events but don't want to sit all day
**Day 0:** conviction=3/5, first action: `probably ask my mom what she thinks about people coming over and see if any of my friends would actually pay me to do their hair`
> Okay this is actually pretty spot on, I do love doing hair and I'm always braiding my friends' hair anyway. The money sounds really good but idk if I'm ready to have random people come to my house yet, that feels kinda scary.
**Day 7:** did_action=partial, still_motivated=2/5
> I brought it up to my mom once but she was rushing to work so she just said 'we'll talk about it later' and then we never did. I kept meaning to ask my friends but it felt weird bringing up money with them, like what if they think I'm being greedy or something?
Blockers: mom was too busy when I tried to talk; felt awkward asking friends about paying me; kept putting it off because I wasn't sure how to bring it up
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. A 15-year-old with medium motivation half-heartedly bringing it up to a busy parent and then never following through on the harder social step of asking friends for money is exactly right. The awkwardness about seeming 'greedy' to friends is a deeply authentic blocker for a teen — money talk among friend groups at that age is genuinely uncomfortable, especially in close-knit communities. Motivation dropping from 3 to 2 after a week of stalling with no momentum is textbook realistic decay. No signs of agent over-compliance here.

---

### l02-bre — Bre (age 15, slang-esl) · motivation=5
**Idea:** Quick Knotless Braids for High School Girls → Girls at your high school and neighboring schools who want fresh braids for events, picture day, or weekends without spending all day in a chair
**Day 0:** conviction=4/5, first action: `Ask my mom about the liability thing and if she thinks this is actually okay to do`
> Oh wow, this is actually perfect! I've been thinking about doing hair for forever and I'm literally already fast at braids. Like, I could totally see myself doing this on weekends instead of just helping my friends for free.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to my mom like three days ago but it was super awkward timing - she was stressed about work stuff and just said 'we'll talk about it later.' Then I kept meaning to bring it up again but every time felt weird, like when she's cooking dinner or whatever. I did text my cousin who does hair to ask about the liability thing but she left me on read.
Blockers: Bad timing with mom being stressed; Felt awkward bringing up business stuff during normal family time; Cousin didn't respond to my text
**Friend DM:** outcome=maybe — "wait you're gonna do braids?? that's actually kinda fire but like... are you even good at them lol. also your mom is gonna say no isn't she"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. The awkward timing with mom, the avoidance cycle of 'I kept meaning to bring it up again but every time felt weird,' and the cousin leaving her on read are all painfully authentic for a 15-year-old navigating adult conversations in a busy household. The friend's DM response — supportive but immediately questioning skill level and parental permission — is exactly how a real high school friend would react. Motivation dropping from 5 to 3 after a week of failed attempts to have one conversation is spot-on; no over-compliance here. The only slight stretch is that a truly high-motivation teen might have also posted on her story or asked a friend in person rather than only attempting two contact points, but the social anxiety around 'business stuff during normal family time' rings very true for this age.

---

### l03-sage — Sage (age 14, slang-esl) · motivation=1
**Idea:** Photocard Authentication & Trading Verification Service → Fellow K-pop fans aged 13-18 in local area and school who collect photocards
**Day 0:** conviction=2/5, first action: `probably ask my friend Mia what she thinks since she trades cards too and see if she'd even pay for something like this`
> Wait, this is actually kinda smart? Like I do know how to spot fakes and people are always asking me about their cards. But charging people feels weird... like what if I'm wrong?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up with Mia but every time we hung out we were just talking about normal stuff and it felt weird to randomly be like 'hey want to pay me to check your cards?' I chickened out because what if she thought I was being money-obsessed or trying to profit off our friendship.
Blockers: felt awkward bringing up charging friends; never found the right moment to ask; worried she'd think I was being greedy
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 14-year-old with 1/5 motivation and only 2/5 conviction. The social awkwardness of trying to monetize a friendship dynamic — especially at this age where being seen as 'greedy' is a genuine social risk — is spot-on. The avoidance pattern of hanging out normally and never finding 'the right moment' is textbook low-motivation teen behavior; there's zero over-compliance here, this is exactly how this would play out in real life.

---

### l03-sage — Sage (age 14, slang-esl) · motivation=3
**Idea:** Verified K-pop photocard authentication and trading facilitation for teens → K-pop fan teenagers in your school and local community who collect photocards
**Day 0:** conviction=4/5, first action: `Ask my friend Maya if she'd actually pay me to check her cards since she's always asking me anyway`
> Wait this is actually kinda smart? Like I already help my friends figure out if their cards are real anyway, and there's definitely sketchy people trying to trade fakes at school. I could totally see myself doing this.
**Day 7:** did_action=partial, still_motivated=2/5
> I started to bring it up with Maya twice but chickened out both times. Like when she showed me her new Jimin card at lunch, I was gonna say something but then she just moved on to talking about the math test. I kept thinking I'd find the perfect moment but it never felt right to suddenly be like 'hey pay me for this.'
Blockers: Felt weird asking a friend to pay me; Couldn't find the right moment in conversation; Scared she'd think I was being money-grabbing
**Friend DM:** outcome=maybe — "wait you're gonna charge me now?? 😭 i thought we were friends lmaooo but actually how much tho"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. The chickening out twice, the motivation dropping from 3 to 2, and the friend's defensive-but-curious DM response all ring completely true for a 14-year-old trying to monetize an informal skill within a friend group. The DM outcome of 'maybe' is not a yes, so this correctly lands as action_no_customer. The only slight flag is that the friend's response feels almost too perfectly written as a realistic teen reaction — real responses might be even more dismissive or just a single 'bruh' — but it's within bounds.

---

### l03-sage — Sage (age 14, slang-esl) · motivation=5
**Idea:** Photocard Authentication & Trading Facilitation for K-pop Collectors → K-pop fans ages 13-18 in local area and school who collect photocards
**Day 0:** conviction=3/5, first action: `ask my friend Maya if she'd actually pay me to authenticate her Stray Kids cards or if that would make things weird between us`
> Oh wow, this is actually really smart! I'm already doing half of this stuff anyway - like my friends always ask me to check if their cards are real before they trade. I never thought about charging for it though, that feels kinda weird with friends?
**Day 7:** did_action=no, still_motivated=2/5
> I kept thinking about asking Maya but every time we hung out it felt super awkward to bring up. Like we were just talking about normal stuff and I couldn't figure out how to be like 'hey wanna pay me for something I used to do for free?' Plus she's been stressed about this history test so it never felt like the right time.
Blockers: couldn't find the right moment to bring it up naturally; felt awkward asking a friend to pay me; Maya seemed busy with school stuff
**Funnel:** intent_no_action (conviction realism 5/5, action realism 5/5)
> This is extremely realistic. A 14-year-old with high motivation but only moderate conviction (3/5) freezing up when trying to monetize something they previously did for free with friends is one of the most common teen entrepreneurship failure modes. The specific detail about Maya being stressed about a history test serving as a convenient excuse to delay is painfully authentic — this is classic avoidance behavior dressed up as consideration. The motivation drop from 5/5 to 2/5 is also realistic; the social awkwardness of charging friends is a real and underestimated blocker that often kills teen service ideas before they even launch. No signs of agent over-compliance here.

---

### y01-bracelet — Sophie (age 12, age-12) · motivation=1
**Idea:** Custom Taylor Swift concert friendship bracelets for local Swifties → Middle school girls in her school and neighborhood going to Taylor Swift concerts or themed parties
**Day 0:** conviction=3/5, first action: `ask my best friend Emma if she'd actually buy bracelets from me or if that would be super awkward`
> Oh my god, this is actually perfect! I'm literally obsessed with Taylor and I already make bracelets all the time. But like, would people actually pay me for them? That feels weird asking my friends for money.
**Day 7:** did_action=partial, still_motivated=2/5
> I kept meaning to ask Emma but then it felt super awkward every time we hung out. Like, we'd be talking about normal stuff and I'd think 'ok now I'll bring up the bracelet thing' but then it felt so random and business-y. I did mention Taylor Swift bracelets once when we were talking about the concert but didn't actually ask if she'd buy from me.
Blockers: felt too awkward to bring up money with my best friend; kept chickening out at the last second; didn't know how to bring it up naturally in conversation
**Friend DM:** outcome=maybe — "omg wait that's actually kinda cute!! but like... would it be weird if I bought them from you? idk I feel like I could just make my own with stuff from michaels but yours would prob look way better lol. how much were you thinking??"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic funnels I've seen. A 12-year-old with 1/5 motivation barely bringing up the idea tangentially and chickening out on the actual ask is exactly what would happen — the social awkwardness of monetizing friendships at that age is a very real blocker. The friend's DM response is also highly realistic: genuine interest mixed with 'I could just make my own' hesitation and the awkwardness of buying from a friend. The only slight note is the friend might have been even more noncommittal (e.g., just 'haha cute' and changing the subject), but the 'maybe' outcome with hedging feels authentic for a middle schooler who wants to be supportive but isn't committing.

---

### y01-bracelet — Sophie (age 12, age-12) · motivation=3
**Idea:** Custom Taylor Swift concert friendship bracelets for middle school girls → Middle school girls (ages 10-14) attending Taylor Swift concerts or Eras Tour movie screenings
**Day 0:** conviction=4/5, first action: `Make like 10 different bracelet designs with popular Taylor lyrics and take really good photos to show my friends`
> OMG this is literally perfect! I'm already making these for me and my friends anyway, and everyone at school is obsessed with Taylor Swift right now. I didn't even think about selling them but now I'm like... why am I giving them away for free?
**Day 7:** did_action=partial, still_motivated=3/5
> I made like 3 bracelets on Sunday but then school got crazy with a history test and drama with my friend group. I kept meaning to make more and take photos but my phone storage was full and I never cleared it out. I have the supplies sitting on my desk still.
Blockers: school test prep took up my free time; friend drama was distracting; phone storage full so couldn't take good photos; kept putting it off for 'tomorrow'
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is extremely realistic for a 12-year-old with medium motivation. The initial burst of enthusiasm (making 3 bracelets on Sunday) followed by school pressures, friend drama, and a trivially annoying blocker (phone storage) derailing progress is textbook preteen behavior. The specificity of the blockers — history test, friend group drama, full phone storage, serial procrastination — feels genuinely authentic rather than agent-generated. No signs of over-compliance; if anything, this is one of the most believable partial-action simulations I've seen. The idea itself has real market potential but the execution gap is entirely age-appropriate.

---

### y01-bracelet — Sophie (age 12, age-12) · motivation=5
**Idea:** Custom Taylor Swift Concert Friendship Bracelets → Girls at school going to Taylor Swift concerts or who are Swifties
**Day 0:** conviction=5/5, first action: `Ask my mom if we can go to Michael's this weekend to get more beads and string so I can make a bunch of sample bracelets`
> OMG yes!! This is literally perfect - I'm already making these for myself and my friends are always asking me to make them some. I didn't even think about actually charging for them but like, why not?
**Day 7:** did_action=partial, still_motivated=4/5
> I asked my mom about Michael's on Sunday but she said we couldn't go until next weekend because she had work stuff. Then I got super busy with school - we had two tests and a group project due. I did start making a few bracelets with supplies I already had at home, but I only finished like 3 and they don't look as good as I wanted.
Blockers: Mom couldn't take me to get supplies; School got really busy with tests; The bracelets I made don't look professional enough
**Friend DM:** outcome=maybe — "wait are you asking me to come with you to buy supplies or like help you make them? bc i'm kinda broke rn and also have soccer practice saturday morning"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 12-year-old depending on a parent for transportation to a craft store, getting derailed by school obligations, and still tinkering with what she already has at home is exactly right. The friend's confused, slightly deflecting DM response is spot-on for a 12yo who doesn't want to commit money or time — no over-compliance detected anywhere. The motivation dip from 5 to 4 is also perfectly calibrated; a highly motivated kid doesn't give up after one rough week but does feel the friction. The idea itself is commercially viable for her age and audience, so the main bottleneck is execution logistics (supply access, quality control) rather than market demand.

---

### y02-cards — Ethan (age 12, age-12) · motivation=1
**Idea:** Pokemon Card Authentication & Valuation Service for Local Kids → Elementary and middle school kids (ages 8-14) in neighborhood, school, and local community centers who own Pokemon cards but don't know their value or authenticity
**Day 0:** conviction=2/5, first action: `probably ask my dad if this is even allowed and if I'd get in trouble if I mess up`
> This actually sounds pretty cool since I do know a lot about Pokemon cards, but asking kids for money feels kinda weird? Like what if I'm wrong about a card and they get mad at me.
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to ask my dad about it but every time I saw him he was either busy with work stuff or watching TV and I didn't want to interrupt. Then I got distracted by this new game my friend got and honestly kind of forgot about the whole card thing until right now.
Blockers: never found the right moment to talk to dad; got distracted by other stuff; felt awkward bringing it up
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is an extremely realistic portrayal of a low-motivation 12-year-old. The conviction of 2/5 combined with the dependency on parental permission creates a natural bottleneck that a kid with 1/5 motivation will never push through. The distraction by a friend's new game and the avoidance of an 'awkward' conversation with dad are textbook 12-year-old behavior — no signs of agent over-compliance here. This idea dies exactly where it should for this persona.

---

### y02-cards — Ethan (age 12, age-12) · motivation=3
**Idea:** Pokemon Card Appraisal Service for Local Kids → Kids aged 8-16 in neighborhood and school who own Pokemon cards but don't know their value
**Day 0:** conviction=3/5, first action: `probably ask my friend Jake if he'd actually pay me to check his cards since he's always asking me about values anyway`
> Wait, this is actually pretty smart! I do know way more about card values than most kids at school, and I've definitely seen people get ripped off in trades. Plus $5 for looking at some cards sounds way easier than like, starting a whole company or whatever.
**Day 7:** did_action=partial, still_motivated=2/5
> I kept meaning to bring it up with Jake but every time we hung out we just got distracted playing games or talking about other stuff. I did mention once that I'd been thinking about card values more but chickened out when it came to actually asking if he'd pay me.
Blockers: felt awkward bringing up money with my friend; kept getting distracted when we hung out; wasn't sure how to transition from free help to paid service
**Friend DM:** outcome=no — "lol wait you want me to PAY you to tell me what my cards are worth? dude I can literally just look them up on my phone 😂"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A 12-year-old with medium motivation getting distracted hanging out with friends and chickening out on the money conversation is textbook real behavior. The friend's DM response is brutally accurate — kids absolutely know they can look up card values on TCGplayer or eBay themselves, and the social awkwardness of monetizing a casual friendship dynamic is a genuine killer for this idea at this age. No signs of agent over-compliance; every stage reflects authentic 12-year-old behavior.

---

### y02-cards — Ethan (age 12, age-12) · motivation=5
**Idea:** Pokemon card authentication and valuation service for local kids → Kids ages 8-16 in neighborhood and school who own Pokemon cards but don't know their value or authenticity
**Day 0:** conviction=4/5, first action: `Ask my friend Jake if he'd pay me like $3 to check his whole binder since he's always asking me anyway`
> Wait, this is actually pretty smart! I already help kids at school figure out if their cards are fake and I'm always telling people what their cards are worth. I could totally charge for this.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to Jake on Tuesday but got super awkward about actually asking for money. I ended up just looking through his binder for free like usual and told myself I'd bring up payment 'next time.' Then I kept chickening out all week.
Blockers: Felt weird asking my friend for money; Kept putting off the conversation; Worried Jake would think I was being greedy
**Friend DM:** outcome=no — "lol dude you already tell me about my cards for free tho? why would i pay you now 😅 idk maybe if you like actually had some official thing but $3 is kinda steep"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic funnels I've seen. A 12-year-old who already gives away his expertise for free will absolutely choke when trying to monetize it with friends — the social awkwardness of suddenly charging is a classic kid blocker. Jake's response is pitch-perfect: the 'lol why would I pay for something you already do free' objection is the #1 killer for services built on existing casual behavior. The motivation drop from 5 to 3 after a week of chickening out is exactly right. No signs of agent over-compliance anywhere.

---

### u01-code — Sam (age 18, age-18) · motivation=1
**Idea:** Simple restaurant landing pages for local family restaurants → Family-owned restaurants within 10 miles of your home that either have no website or a broken/outdated one
**Day 0:** conviction=2/5, first action: `probably make a super basic demo website for a fake restaurant so I have something to show, but I'd probably procrastinate on this for weeks`
> Honestly this sounds pretty cool but like... walking into restaurants and talking to owners? That's terrifying. I'd probably mess up explaining what I do and they'd think I'm just some kid trying to scam them or something.
**Day 7:** did_action=no, still_motivated=1/5
> I kept telling myself I'd start it 'tomorrow' but never actually did. I opened up my laptop a few times thinking about it but then just ended up scrolling TikTok or playing games instead. The whole thing felt overwhelming when I actually sat down to think about where to start.
Blockers: didn't know where to actually begin coding; got distracted by school assignments; felt intimidated thinking about talking to restaurant owners; kept putting it off for 'when I have more time'
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. An 18-year-old with 1/5 motivation, no existing technical skills confidence, and severe social anxiety around cold-approaching business owners was never going to start. The TikTok/gaming procrastination spiral, the 'I'll do it tomorrow' loop, and the paralysis from not knowing where to begin are textbook low-motivation teen behavior. There is zero agent over-compliance here — this is exactly how this persona would play out in reality.

---

### u01-code — Sam (age 18, age-18) · motivation=3
**Idea:** Wedding website builder for engaged couples in your social circle → Engaged couples aged 20-30 in your extended network (friends' siblings, family friends, church/community members)
**Day 0:** conviction=2/5, first action: `probably ask my cousin who just got engaged what she thought about her wedding website and if she would've wanted something custom`
> Hmm this is actually kinda smart? Like I know a few people who got engaged recently and their wedding websites were pretty basic. But idk if I'd actually charge that much or if people would pay me specifically.
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to text my cousin but it felt weird bringing up her wedding website out of nowhere. Like, what if she's stressed about wedding stuff and doesn't want to talk about it? I drafted a message like three times but never sent it because I couldn't figure out how to ask without sounding like I was trying to sell her something.
Blockers: felt awkward reaching out about wedding stuff; couldn't figure out how to ask without seeming pushy; kept putting it off for 'later'
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is extremely realistic. An 18-year-old with medium motivation, low conviction (2/5), and a business idea centered on serving people in their personal social circle is almost guaranteed to stall on the awkwardness of mixing sales with personal relationships. The drafting-a-text-three-times-and-never-sending-it behavior is painfully authentic for a teen who doesn't want to seem transactional with family. The motivation cratering to 1/5 is the natural outcome — this idea had weak founder-market fit from the start, and the social friction of selling to people you know killed it before it could even begin.

---

### u01-code — Sam (age 18, age-18) · motivation=5
**Idea:** Simple Next.js websites for local family restaurants and cafes → Family-owned restaurants in your town whose websites are broken, outdated, or non-existent
**Day 0:** conviction=4/5, first action: `walk around downtown this weekend and check out all the restaurant websites on my phone to see which ones suck or don't exist`
> Okay this actually sounds pretty solid? Like I've been wanting to use my Next.js skills for something real and I've definitely noticed some local places have terrible websites or no website at all. The money seems realistic too.
**Day 7:** did_action=partial, still_motivated=3/5
> I did walk around downtown on Saturday and checked out maybe 6-7 restaurant websites on my phone. Found some pretty terrible ones and a few with no website at all. But then I got distracted hanging out with friends and never actually made a list or took notes like I should have.
Blockers: didn't take proper notes so I can't remember which places were worst; friends wanted to hang out instead of me being on my phone the whole time; felt awkward standing outside restaurants just staring at my phone
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. High initial motivation degrading to 3/5 after a half-completed action, getting distracted by friends on a Saturday, and failing to take structured notes despite good intentions — that's textbook 18-year-old behavior. The drop from 5/5 motivation to 3/5 after a partial action is very believable; real teens often lose momentum precisely at this 'research but no outreach' stage. No signs of agent over-compliance — the persona appropriately failed to do the disciplined parts while completing the easy/fun reconnaissance step.

---

### u02-photog — Bella (age 18, age-18) · motivation=1
**Idea:** Micro-wedding and elopement photographer for couples under 25 with budgets under $2000 → College couples, young military couples, and courthouse wedding couples in your local area
**Day 0:** conviction=2/5, first action: `probably stalk some local wedding photographers on Instagram to see what their packages look like and if anyone's actually doing micro-weddings`
> Okay this actually sounds kinda cool and I do love weddings, but like... I've only second-shot a few times and now I'm supposed to be THE photographer? That's terrifying. Also $300-800 seems like a lot to charge when I'm still figuring things out.
**Day 7:** did_action=partial, still_motivated=1/5
> I started looking up photographers on Instagram like twice but honestly got overwhelmed by how professional their feeds looked. I also got distracted by midterms and then spent way too much time scrolling TikTok instead of actually researching.
Blockers: got intimidated by how good other photographers are; midterm stress took over; kept procrastinating with social media
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. An 18-year-old with 1/5 motivation, low conviction, midterms, and TikTok as a competing distraction — the partial action of 'looked up photographers twice then got overwhelmed and scrolled instead' is exactly what would happen. The intimidation by professional feeds and the motivation dropping to 1/5 is completely authentic. No over-compliance here; this accurately reflects a teen who never really had the intent to begin with and predictably fizzled out.

---

### u02-photog — Bella (age 18, age-18) · motivation=3
**Idea:** Intimate Wedding Photography for Budget-Conscious Couples → Engaged couples in your community planning small weddings (under 50 guests) with budgets under $3,000 for photography
**Day 0:** conviction=4/5, first action: `Text my friend Jake who second shoots with me to see if he thinks this is a good idea and maybe ask if his photographer boss has any advice about starting solo`
> This actually sounds really cool and doable! I love that it's focusing on smaller weddings since those feel less intimidating than huge fancy ones. The pricing seems reasonable and I already know I can handle the photography part.
**Day 7:** did_action=partial, still_motivated=3/5
> I texted Jake like 3 days ago but he just replied with 'yeah sounds cool' and didn't really give me much to work with. I kept meaning to follow up and ask about his boss but then we had this huge drama at school and I totally forgot. Plus I realized I don't even know how to approach asking his boss without seeming like I'm trying to steal clients or something.
Blockers: Jake's lukewarm response made me lose momentum; School drama took over my headspace; Don't know how to professionally reach out to his boss
**Friend DM:** outcome=yes — "oh hey! yeah that sounds cool, intimate weddings are kinda having a moment rn. idk much about the photo business side but my boss is pretty chill, i could ask him if you want? he's been doing this for like 10 years so he might have some actual advice"
**Funnel:** action_no_customer (conviction realism 4/5, action realism 5/5)
> This is a very realistic portrayal of a medium-motivation 18-year-old. The 3-day delay in texting, the vague 'yeah sounds cool' response, school drama derailing follow-up, and the social anxiety about approaching Jake's boss are all extremely true to life. The DM sim outcome is reasonable — Jake offering to ask his boss is natural and low-effort — but the funnel correctly stalls at 'partial' action because Bella never actually got to the meaningful next step (talking to the boss, building a portfolio page, or reaching a potential couple). No over-compliance flags; this feels honest.

---

### u02-photog — Bella (age 18, age-18) · motivation=5
**Idea:** Intimate backyard wedding photography for families on tight budgets → Families in your neighborhood hosting small weddings (under 30 people) in backyards, parks, or family homes
**Day 0:** conviction=4/5, first action: `I'd probably text my friend Maya whose sister just got engaged and ask if they're planning something small, just to see what people in my area are actually looking for`
> Oh wow, this actually sounds really doable! I mean, I've been second shooting and I do love those smaller, more intimate weddings way more than the huge fancy ones. $300 seems like a lot but also not crazy expensive for families?
**Day 7:** did_action=partial, still_motivated=3/5
> I drafted the text to Maya like three times but kept deleting it because it felt weird and pushy. I finally sent something casual like 'hey how's your sister's wedding planning going?' but she just replied with basic stuff and I chickened out of asking the real questions about budget or if they need a photographer.
Blockers: Felt awkward bringing up business stuff with friends; Scared Maya would think I was being opportunistic about her family; Got busy with a chemistry test and drama with my friend group
**Friend DM:** outcome=maybe — "oh that's actually cool! maya's sister is doing like a super small thing in their backyard this summer bc they're broke lol. idk what their budget is tho, you should probably just dm her directly? i can give you her @"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic teen simulations I've seen. The anxiety spiral of drafting and deleting a text three times, chickening out of the real questions, and motivation dropping from 5 to 3 after a chemistry test and friend drama — that's textbook 18-year-old behavior. The DM outcome being a 'maybe' with a warm referral is plausible but Bella's current motivation level (3/5) and demonstrated avoidance of direct business conversations makes it very unlikely she'll actually follow through on DMing Maya's sister. The fear of ruining someone's wedding is a legitimate and paralyzing concern for an 18-year-old with no portfolio to fall back on.

---

### u03-fit — Devontae (age 18, age-18) · motivation=1
**Idea:** Form correction coaching for college freshmen at campus gyms → College freshmen at your campus who are new to weightlifting and intimidated by the gym
**Day 0:** conviction=2/5, first action: `probably ask my gym buddy Marcus what he thinks since he's always saying I should charge people for help`
> Okay this actually sounds pretty cool, like I'm already helping people with form anyway when I see them doing stuff wrong. But man, asking people for money to teach them feels weird - like what if I'm not good enough or they think I'm just some kid trying to make a quick buck?
**Day 7:** did_action=no, still_motivated=1/5
> I kept meaning to bring it up with Marcus but we were always in the middle of our workouts and it felt weird to interrupt. Plus we had midterms this week so I barely saw him outside the gym, and when I did we were just stressed about tests and complaining about professors.
Blockers: midterms took over everything; never found the right moment to bring it up with Marcus; felt awkward bringing up money stuff during workouts
**Funnel:** no_intent (conviction realism 5/5, action realism 5/5)
> This is an extremely realistic simulation of a low-motivation 18-year-old. Conviction of 2/5 with motivation 1/5 was never going to produce action. The Day 7 reflection is textbook authentic — midterms as a legitimate but also convenient excuse, the social awkwardness of bringing up money during workouts, and the motivation dropping to 1/5 all ring true. No signs of agent over-compliance; this is exactly how a real teen with passing interest but no real drive would behave.

---

### u03-fit — Devontae (age 18, age-18) · motivation=3
**Idea:** College Freshman Gym Buddy Program → College freshmen in dorms (18-19 years old) who are intimidated by campus gyms
**Day 0:** conviction=3/5, first action: `probably ask my friend Marcus who goes to State if freshmen at his school actually struggle with gym stuff like this`
> Yo this is actually pretty solid! I mean, I remember being scared as hell walking into the gym my first time, and I'm already helping some of my friends with form anyway. The money sounds good too - $25 for 2 hours isn't bad at all.
**Day 7:** did_action=no, still_motivated=2/5
> I kept meaning to text Marcus but then I'd get distracted by other stuff. Like Tuesday I was gonna ask him but then we ended up just talking about this girl he's trying to get with. By Thursday I was like 'I should still ask' but then it felt weird to randomly bring up business stuff when we usually just joke around.
Blockers: felt awkward bringing up business stuff with Marcus; kept getting distracted by normal conversations; overthinking how to even phrase the question
**Funnel:** intent_no_action (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. A medium-motivation 18-year-old whose 'first action' is just texting a friend, then failing to even do that because normal social dynamics took over — that's extremely true to life. The detail about Marcus and the girl conversation derailing things, and the social awkwardness of pivoting to 'business stuff' in a casual friendship, is spot-on for how teen validation attempts actually die. Motivation dropping from 3 to 2 is perfectly calibrated; no over-compliance here at all.

---

### u03-fit — Devontae (age 18, age-18) · motivation=5
**Idea:** Form correction coaching for college freshmen at campus gyms → College freshmen (18-19) at his university who are new to weightlifting and intimidated by the campus gym
**Day 0:** conviction=4/5, first action: `talk to my roommate Jake about it since he's always asking me for gym help anyway, see if he'd actually pay for proper sessions`
> Yo this is actually fire, I've literally been helping random people at the gym with their form already and never thought about charging for it. Like I see freshmen doing quarter squats and hurting themselves all the time.
**Day 7:** did_action=partial, still_motivated=3/5
> I brought it up to Jake on like day 3 when we were walking back from the gym, but it was super awkward. He was like 'oh cool' but then we just started talking about other stuff and I never followed up with the actual 'would you pay for this' question. I kept meaning to bring it up again but then I got stressed about midterms and it felt weird to circle back to it.
Blockers: felt awkward asking about money; midterm stress took over; didn't know how to bring it back up after the first conversation
**Friend DM:** outcome=maybe — "oh shit that's actually kinda smart, I've been too scared to go to the gym here lol. how much you thinking tho? I'm broke af"
**Funnel:** action_no_customer (conviction realism 5/5, action realism 5/5)
> This is one of the most realistic simulations I've seen. The awkward half-conversation with the roommate that fizzles into other topics, the midterm stress derailing follow-through, and the social discomfort around asking a peer for money are all extremely true to an 18-year-old's experience. The DM friend response is also believable — genuine interest paired with the 'I'm broke af' deflection is classic college freshman. The motivation drop from 5 to 3 after a single awkward interaction is very human. No signs of agent over-compliance; if anything, the partial action honestly captured the messy reality of teen entrepreneurship attempts.

---
