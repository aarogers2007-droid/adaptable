# Design System — Adaptable

## Product Context
- **What this is:** AI-native entrepreneurship learning platform where students build real, personalized businesses
- **Who it's for:** K-12 students (ages 12-18) across 155 countries, via institutional access through VentureLab
- **Space/industry:** Edtech, entrepreneurship education
- **Project type:** Web app (educational, student-facing, institutional sales)
- **Design references:** Notion (personal workspace clarity), Linear (density without clutter), Duolingo (warmth at celebration moments)

## Aesthetic Direction
- **Direction:** Warm Precision
- **Decoration level:** Intentional. Minimal chrome, but the Ikigai diagram is the decorative centerpiece. Color comes from meaning (circle colors, progress, states), not from decoration.
- **Mood:** Serious but encouraging. Respects teenagers as real builders. Feels like a tool that someone cared about making, not a template. The student's business is always the loudest thing on screen.
- **Anti-patterns:** No purple gradients, no 3-column icon grids, no centered-everything layouts, no decorative blobs, no generic SaaS card grids. Cards must earn their existence.

## Typography
- **Display/Hero:** Satoshi (geometric sans with warmth, distinctive without being loud) — via Fontshare CDN
- **Body:** DM Sans (clean, readable, slightly warmer than Inter, excellent weight range) — via Google Fonts
- **UI/Labels:** DM Sans (same as body, 500 weight for labels)
- **Data/Tables:** DM Sans with `font-variant-numeric: tabular-nums`
- **Code:** JetBrains Mono — via Google Fonts
- **Loading:** CDN (Fontshare for Satoshi, Google Fonts for DM Sans + JetBrains Mono)
- **Scale:**
  - 48px / 700 weight — Display (page titles, Ikigai reveal)
  - 32px / 600 weight — H1 (business name on dashboard)
  - 24px / 600 weight — H2 (section headings, lesson titles)
  - 20px / 400 weight — Large body (lead paragraphs, Ikigai questions)
  - 16px / 400 weight — Body (default text, lesson content)
  - 14px / 400-500 weight — Small (captions, labels, metadata)
  - 12px / 500 weight — Tiny (badges, uppercase labels)

## Color

### Approach: Balanced
Color is meaningful, not decorative. Every color has a job.

### Core Palette
- **Primary:** #0D9488 (teal, trust, education, primary actions and focus states)
- **Primary Light:** #14B8A6 (hover states)
- **Primary Dark:** #0F766E (pressed states, dark text on light teal backgrounds)
- **Accent:** #F59E0B (amber, celebration, warmth, the "aha" color for achievements and CTAs)
- **Accent Light:** #FBBF24 (hover on accent)

### Ikigai Diagram Palette
These colors are specific to the interactive Ikigai Venn diagram. Earthy, natural tones.

**Main Circles:**
- Love (top): #F5E642 (yellow-green)
- Good At (left): #A8DB5A (light green)
- Needs (right): #F4A79D (salmon pink)
- Paid For (bottom): #6DD5D0 (teal cyan)

**Intersection Zones:**
- Passion (Love + Good At): #C8E86A (yellow-green overlap)
- Mission (Love + Needs): #F7C89B (peach overlap)
- Profession (Good At + Paid For): #8FCF8F (mid green overlap)
- Vocation (Needs + Paid For): #C5B99A (tan/khaki overlap)

**Center:**
- Outer center: #8B9E6A (olive green)
- Inner Ikigai circle: #4A6741 (dark forest green)

### Neutrals (warm grays)
- Text Primary: #111827
- Text Secondary: #4B5563
- Text Muted: #9CA3AF
- Border: #E5E7EB
- Border Strong: #D1D5DB
- Background: #FFFFFF
- Background Subtle: #F9FAFB
- Background Muted: #F3F4F6

### Semantic
- Success: #059669
- Warning: #D97706
- Error: #DC2626
- Info: #3B82F6

### Dark mode
Not in v1 scope. Students use this on school Chromebooks in bright classrooms.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable (not compact like Linear, not spacious like a marketing site)
- **Scale:** 2px (2xs) / 4px (xs) / 8px (sm) / 12px (md-sm) / 16px (md) / 24px (lg) / 32px (xl) / 48px (2xl) / 64px (3xl)

## Layout
- **Approach:** Hybrid. Composition for student screens (dashboard hero, Ikigai diagram). Clean grid for data views (instructor dashboard, progress tables).
- **Grid:** 12 columns on desktop, 8 on tablet, 4 on mobile
- **Max content width:** 1200px
- **Border radius:**
  - sm: 4px (small elements, badges)
  - md: 8px (buttons, inputs, cards)
  - lg: 12px (sections, dashboard panels)
  - full: 9999px (chips, progress bars, Ikigai circles)

### Breakpoints
- Desktop: 1280px+ (primary design target)
- Tablet: 768-1279px (school iPads, must be usable)
- Mobile: <768px (graceful degradation, not optimized)

## Motion
- **Approach:** Intentional. Motion has meaning, not decoration.
- **Easing:**
  - Enter: ease-out (elements arriving)
  - Exit: ease-in (elements leaving)
  - Move: ease-in-out (elements transitioning)
- **Duration:**
  - Micro: 100ms (hover, focus, toggle)
  - Short: 150ms (button press, chip select)
  - Medium: 250ms (page transitions, panel open/close)
  - Ikigai zoom: 400ms ease-out (signature interaction)
  - Confetti reveal: 700ms (celebration burst at Ikigai completion)
- **prefers-reduced-motion:** Respected. All animations become instant transitions. Confetti is suppressed.

## Key UI Patterns

### Ikigai Wizard
The Venn diagram IS the interface. Four overlapping circles. Active circle zooms in (CSS transforms), others dim. Inside: question, text input, AI suggestion chips (toggle-select). Completed circles glow with checkmark. Center reveals business idea with confetti.

### Dashboard
Composition, not card grid. Business identity is a full-width hero (name, niche, pricing). Progress bar integrated into hero. Current Lesson is a prominent CTA below. Check-in and Resources are secondary sections.

### Suggestion Chips
Toggle-select. Tap to highlight (filled background), tap again to deselect. Selected chips get primary color fill. Unselected chips have border only.

### Empty States
Every empty state has: warmth (encouraging language), a primary action (CTA), and context (why it's empty and what to do). Never just "No items found."

## Accessibility (WCAG AA)
- All interactive elements keyboard-navigable
- Focus indicators: 2px primary color outline on all focusable elements
- Touch targets: 44px minimum on tablet
- Color contrast: 4.5:1 for body text, 3:1 for large text (AA)
- Screen reader: ARIA labels on Ikigai circles, progress indicators, all interactive elements
- prefers-reduced-motion respected throughout

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-31 | Initial design system created | Created by /design-consultation. Warm Precision aesthetic. |
| 2026-03-31 | Satoshi over Inter for display | Inter is overused. Satoshi has geometric warmth that gives Adaptable its own face. |
| 2026-03-31 | No dark mode for v1 | School Chromebooks in bright classrooms. One mode to perfect. |
| 2026-03-31 | Ikigai diagram is the brand moment | The interaction IS the brand. No other edtech product has this. |
| 2026-04-01 | Custom Ikigai color palette | Earthy, natural tones (yellow-green, salmon, teal cyan) with olive/forest green center. Matches traditional Ikigai diagram aesthetic. |
| 2026-04-01 | Composition dashboard, not card grid | Student's business IS the page. Hero section, not a widget grid. Inspired by Notion's workspace feel. |
