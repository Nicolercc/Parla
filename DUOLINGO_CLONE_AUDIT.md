# Parla Duolingo-Style Freemium Audit

## Current Upgrade In This Branch

- Added an account economy instead of lesson-local hearts: hearts, gems, XP, streak, Plus, refill timer, and progress persist in `localStorage`.
- Moved the flow from `landing -> language -> quiz` to `landing -> language -> unit map -> lesson -> result/locked`.
- Rebuilt the hearts model around scarcity: wrong answers cost hearts, zero hearts blocks lessons, recovery is wait/practice/spend gems/subscribe.
- Added a visible freemium surface on the home map and locked screen so the market model is always visible.
- Expanded question data into a lesson schema with instructions, XP, explanations, and future room for multiple lesson types.

## Ruthless Gaps To Close Next

1. Replace the zero-build browser Babel stack.
   - Current CDN/global scripts are good for a demo, but not for a serious product.
   - Move to Vite + React + TypeScript, with `src/` modules, strict types, ESLint, Prettier, and Vitest.
   - Add CI checks for typecheck, lint, unit tests, and Playwright smoke tests.

2. Build a real lesson engine.
   - The app still only supports multiple choice.
   - Duolingo-style lessons need a typed activity registry: multiple choice, listening, speaking, matching pairs, word bank translation, fill blank, reorder sentence, and mistake review.
   - Questions need validation, difficulty, skill tags, localization, audio assets, and adaptive sequencing.

3. Treat hearts as server-owned account state.
   - `localStorage` is fine for prototype proof, but users can edit it.
   - Production needs auth, server time, server-side refill logic, purchase receipts, subscription state, abuse limits, and analytics events.

4. Improve the unit path.
   - The current map demonstrates the loop, but it is not yet a full progression system.
   - Add units, sections, crowns/legendary levels, node completion, locked gates, review nodes, daily quests, and personalized practice nodes.

5. Upgrade mascot animation with Rive.
   - Keep the SVG Pip only as a fallback.
   - Create a Rive state machine with inputs like `idle`, `thinking`, `correct`, `wrong`, `low_hearts`, `plus_offer`, and `celebrate`.
   - Use `@rive-app/react-canvas` after moving to a bundler. For the current CDN prototype, Rive can be loaded from a hosted runtime, but that should be temporary.

6. Add audio and haptics.
   - Duolingo’s feel depends heavily on feedback timing, success/failure sounds, button press depth, and small celebrations.
   - Add Web Audio hooks and optional vibration on mobile for correct, wrong, heart lost, streak, and completion states.

7. Make monetization more honest and measurable.
   - Add explicit plan comparison, free trial state, ad recovery placeholder, gem purchase placeholder, and analytics events for every conversion point.
   - Track funnel events: lesson_start, answer_wrong, heart_lost, heart_zero, paywall_view, plus_trial_start, gem_refill, practice_recovery, lesson_complete.

8. Improve UI fidelity.
   - Current UI is much closer, but still not pixel-grade.
   - Needs screenshot-driven iteration across iPhone SE, iPhone 15, iPad, and desktop.
   - Lock down typography scales, button heights, bottom-sheet behavior, scroll containment, and empty/long-text states.

9. Add accessibility and internationalization.
   - Add keyboard flow, focus states, aria-live feedback, reduced-motion behavior per animation, and text scaling checks.
   - All course text should come from localized content objects, not inline JSX strings.

10. Add product analytics and experiment flags.
    - Freemium products are tuned by experiments.
    - Add config flags for heart count, refill duration, refill price, trial copy, reward amounts, and paywall placement.

## Recommended Target Stack

- App: Vite, React, TypeScript
- State: Zustand or Redux Toolkit for client state; TanStack Query for server state
- Backend: Supabase/Firebase for prototype, then a small API service when purchase logic matters
- Tests: Vitest + React Testing Library + Playwright
- Animation: Rive for mascot/state machines, CSS transitions for UI microinteractions
- Payments: RevenueCat for mobile subscription prototyping; Stripe for web
- Analytics: PostHog, Amplitude, or Segment
- Content: JSON schema validated lesson packs, later CMS-backed

## North-Star Experience

The first 60 seconds should feel like this:

1. User chooses Spanish.
2. User lands on a unit path, not a generic quiz.
3. User starts a bite-sized lesson.
4. Correct answers feel fast and satisfying.
5. Wrong answers cost a visible heart and explain the answer.
6. At zero hearts, the user sees the business model: wait, practice, spend gems, or subscribe.
7. Completing a lesson feeds XP, streak, gems, and path progress back into the home screen.
