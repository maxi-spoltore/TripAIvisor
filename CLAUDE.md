
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## Design Context

### Users
Mixed audience — from casual vacationers to frequent travelers organizing complex multi-city itineraries. The app should feel intuitive for first-timers while being powerful enough for experienced planners. Users are in planning mode: building routes, comparing options, and organizing details.

### Brand Personality
**Friendly, smart, reliable** — like a knowledgeable travel buddy who has everything organized. Approachable and trustworthy, never cold or corporate.

### Emotional Goals
- **Excitement & anticipation**: The interface should channel the thrill of planning an adventure. Visuals, motion, and color should feel inspiring and energizing.
- **Delight & discovery**: Sprinkle playful moments of joy as users build their itinerary — small surprises, satisfying interactions, rewarding feedback.

### Aesthetic Direction
- **References**: Wanderlog/TripIt (itinerary-focused, detail-oriented), Airbnb/Booking.com (warm, visual, travel-flavored)
- **Visual tone**: Warm and inviting with a travel-forward identity. Not sterile productivity — it should feel like planning a trip, not managing a spreadsheet.
- **Theme**: Light + dark mode. Warm canvas (`#f6f7f5`), deep teal primary (`#0a4d68`), coral accent (`#ff6b4a`), teal route (`#2cb1a5`).
- **Typography**: Manrope (body) + Space Grotesk (display). Custom type scale from `label-sm` to `display-lg`.
- **Motion**: Purposeful animations — staggered reveals, view transitions, subtle hover lifts. Respects `prefers-reduced-motion`.

### Design Principles
1. **Travel-first identity** — Every design choice should reinforce that this is a trip planner, not a generic tool. Use travel metaphors, route-inspired visuals, and destination imagery where appropriate.
2. **Progressive detail** — Show the right level of information at each stage. Summaries first, details on demand. Don't overwhelm with options upfront.
3. **Warmth over sterility** — Prefer rounded corners, soft shadows, warm tones, and friendly copy. The interface should feel inviting, not clinical.
4. **Satisfying interactions** — Micro-animations, smooth transitions, and responsive feedback make the app feel alive. Every action should feel good.
5. **Clarity at scale** — Multi-city trips get complex fast. Use visual hierarchy, color coding, and spatial organization to keep things scannable even with many destinations.
