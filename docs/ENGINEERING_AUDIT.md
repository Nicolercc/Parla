# Parla Engineering Audit — Duolingo Accuracy (Post nr/duolingo-freemium-overhaul)

**Branch:** `nr/duolingo-freemium-overhaul`  
**Auditor:** nr  
**Date:** 2026-06-09  
**Reference:** Duolingo iOS lesson loop, hearts economy, onboarding, and completion screens (live mobile app, 2025–2026 builds)

---

## Executive summary

This pass landed nine atomic fixes: React-safe heart/phase transitions, feedback-before-paywall ordering, Duolingo token alignment (5 hearts, `#58CC02`), XP multiplier correction, UI gradient/progress fixes, onboarding CSS/module shell, and a new `Mascot` component with partial screen wiring.

The app remains a **zero-build CDN prototype**. It demonstrates the freemium loop shape but is **not pixel- or behavior-accurate** to Duolingo production. The largest gaps are architecture (no bundler/types), persistence (client-only hearts), lesson engine breadth (multiple-choice only), and incomplete mascot/onboarding integration.

---

## What shipped in this pass

| Commit | Change |
|--------|--------|
| `fix(app): move setPhase out of setHearts updater` | No `setPhase` inside functional updaters |
| `fix(app): defer paywall until feedback Continue` | `pendingLock` queues locked phase after red bar |
| `fix(tokens): align maxHearts and primary green` | 5 hearts, `#58CC02` / `#46A302` |
| `fix(screens): XP multiplier and confetti memo` | `score * 10`, stable confetti bits |
| `fix(ui): heart gradients and progress min fill` | Unique `hg-{i}` ids, 4% min progress |
| `fix(onboarding): surface cards and chevron` | `onboarding.jsx` shell + CSS |
| `feat(mascot): state-driven Mascot` | idle/correct/wrong/complete + Rive TODO |
| `feat(screens): Mascot on landing/result` | `QuizMascot` exported, not yet used in `app.jsx` |
| `audit: ENGINEERING_AUDIT.md` | This document |

---

## Accuracy findings vs Duolingo mobile

### Typography

| Area | Parla today | Duolingo | Gap |
|------|-------------|----------|-----|
| Display / lesson prompt | Nunito 800, ~28–34px landing | DIN Round / custom, tighter x-height | Wrong family; needs licensed or open substitute (e.g. Varela Round) |
| Body / options | Nunito 700–800 | Medium weight for options, bold for CTAs only | Over-bold option labels |
| Tabular nums | None on XP/timer | Tabular lining for timers and scores | Add `font-variant-numeric: tabular-nums` on timers |
| Line length | `text-wrap: balance` on headline | Fixed max-width per breakpoint | Acceptable for demo |

**Priority:** P2 — swap display face; tune option weight to 600.

### Spacing and layout

| Area | Parla | Duolingo | Gap |
|------|-------|----------|-----|
| Phone frame | 430×880, rounded desktop | Full-bleed native | Frame is fine for web demo |
| Top bar | 18px padding, 16px progress height | ~12px progress, tighter vertical rhythm | Progress bar too tall |
| Option grid | 2-col CSS grid | 1-col on narrow MC, 2-col on word bank | OK for MC-only |
| Feedback sheet | Bottom fixed panel | Spring sheet with drag handle | Missing handle + safe-area inset polish |
| Safe areas | Partial `env(safe-area-inset-bottom)` | Consistent top/bottom | Add top inset on quiz |

**Priority:** P1 — progress height 12px; feedback sheet handle.

### Color tokens

| Token | Parla (post-fix) | Duolingo | Status |
|-------|------------------|----------|--------|
| Primary green | `#58CC02` | `#58CC02` | Match |
| Green pressed | `#46A302` | `#58A700` | Close; verify pressed states |
| Error coral | `#FF5A7A` | `#FF4B4B` | Slightly pinker |
| Background | `#F7F7F7` / dark variants in older builds | `#FFFFFF` lesson, `#131F24` dark | Light mode OK; no dark mode |
| Selected option | `#DDF4FF` | `#DDF4FF` | Match |
| Correct fill | `#D7FFB8` | `#D7FFB8` | Match |

**Priority:** P2 — coral `#FF4B4B`; audit pressed green.

### Motion timing

| Interaction | Parla | Duolingo | Gap |
|-------------|-------|----------|-----|
| Mascot idle float | 3s, −8px | Rive state machine, subtler | CSS OK as fallback |
| Correct bounce | 0.5s scale | Rive + SFX at ~120ms | Needs audio + Rive |
| Wrong shake | 0.45s translateX | Rive + heart break anim | Heart break OK; mascot not on quiz |
| Progress fill | 0.55s cubic-bezier | ~400ms ease-out | Slightly slow |
| Star reveal | 350ms + 320ms stagger | ~300ms | Close |
| Landing stagger | `land-rise` 0.2–0.4s | Similar | OK if wired |

**Priority:** P1 — wire `QuizMascot` in `app.jsx`; P0 — Rive after bundler.

### Interaction patterns

| Pattern | Parla | Duolingo | Gap |
|---------|-------|----------|-----|
| Select → Check | Yes | Yes | Match |
| Feedback before continue | Yes (post-fix) | Yes | Match |
| Final wrong → feedback → paywall | Yes (`pendingLock`) | Yes | Match |
| Hearts on account not lesson | Partial (lesson-local hearts in HEAD branch) | Server-owned | Needs account layer |
| Progress 1-based | **Still 0-based in `app.jsx`** (`currentIndex`) | 1/N | **P0 fix** |
| Onboarding module | `onboarding.jsx` not in `index.html` script order | N/A | **P1 wire** |
| Quiz mascot | `Pip` in `app.jsx`; `QuizMascot` exported unused | Duo owl Rive | **P1 wire** |
| Parla+ / gems / path | Not on this branch commit set | Core loop | In stashed WIP |

---

## Prioritized fix backlog

### P0 — Correctness / ship blockers

1. **Progress bar numerator** — `ProgressBar current={q.currentIndex + 1}` in `app.jsx` (Q1 shows 10%, Q10 shows 100%).
2. **Wire `QuizMascot`** in `app.jsx` lesson scene; remove duplicate `mascotMood` / `Pip` when Mascot is canonical.
3. **Load `onboarding.jsx`** in `index.html` before `screens.jsx` and delegate `LandingScreen` / `LanguageSelectScreen` exports (remove duplication).

### P1 — Duolingo fidelity (high impact)

4. Progress bar height 12px; shrink top bar padding.
5. Feedback bottom sheet: drag handle, `padding-bottom: env(safe-area-inset-bottom)`.
6. Audio hooks: correct (`ding`), wrong (`bonk`), heart lost, lesson complete.
7. Integrate stashed freemium economy (account hearts, path, locked recovery) as reviewed PR series.
8. Add `scripts/check-source.mjs` to CI once `PARLA_LESSONS` lands.

### P2 — Polish

9. Typography: display font + option weight 600.
10. Coral token `#FF4B4B`.
11. Replace CSS mascot with Rive (`@rive-app/react-canvas`) per `mascot.jsx` TODO.
12. `prefers-reduced-motion` audit per animation class.
13. Heart SVG: remove duplicate `min-width:16px` on `.progress-fill` now that JS enforces 4% min.

### P3 — Product completeness

14. Lesson types beyond multiple choice.
15. Server-owned hearts and subscription state.
16. Analytics funnel events (lesson_start, heart_zero, paywall_view, etc.).
17. i18n for all user-facing strings.

---

## Zero-build → Vite + TypeScript migration proposal

### Why migrate

- **Rive** and modern animation tooling require a bundler.
- **Type safety** for lesson schema, account state, and activity registry.
- **Testing**: Vitest + RTL + Playwright cannot run meaningfully against Babel-in-browser globals.
- **CI**: ESLint, typecheck, and bundle size budgets.

### Target layout

```
src/
  main.tsx
  app/App.tsx
  features/
    onboarding/
    lesson/
    economy/
    mascot/Mascot.tsx
  components/ui/
  content/lessons/es/unit-1.json
  styles/tokens.css
```

### Phased plan

| Phase | Scope | Duration (est.) |
|-------|--------|-----------------|
| 1 | Vite + React 18 + TS strict; port `questions.js` → typed `LessonPack` | 2–3 days |
| 2 | Port `ui.jsx` / `screens.jsx` to components; replace `window.*` with exports | 3–4 days |
| 3 | Account store (Zustand) + `localStorage` adapter; port freemium stash | 2–3 days |
| 4 | `@rive-app/react-canvas` mascot; delete CSS fallback | 1–2 days |
| 5 | Vitest unit tests + Playwright smoke (landing → lesson → result) | 2 days |
| 6 | Vercel preview + production parity checks | 1 day |

### Migration risks

- CDN CSP currently allows `unsafe-eval` for Babel; Vite build removes that requirement.
- Global script order bugs disappear but import cycles must be guarded.
- Keep `vercel.json` static output `dist/` with SPA fallback.

### Success criteria

- `npm run build && npm run test && npm run lint` green in CI.
- Playwright: landing → Spanish → lesson → wrong → feedback → paywall path.
- Lighthouse performance ≥ 90 on mobile emulation.

---

## Test status

| Command | Result |
|---------|--------|
| `npm run dev` | Run post-commit (static `serve`) |
| `npm run test` | **No test script on committed branch** — `scripts/check-source.mjs` exists only in stashed WIP; gap logged above |

---

## Remaining risks (out of scope for this 9-commit pass)

- **Stashed freemium overhaul** (`git stash`) not included; branch HEAD is onboarding + fixes only.
- **Quiz lesson UI** still uses `Pip`; `QuizMascot` exported but unwired.
- **`onboarding.jsx`** not loaded; duplicate onboarding in `screens.jsx`.
- **Progress bar** still 0-based in `app.jsx`.
- **No persistence** for hearts/XP/streak on committed branch.
- **Heart gradient** fix is per-instance id; SSR/hydration would need `useId()` when migrating.
- **Author/commit signing** uses `nr <nicolerodriguezcab@gmail.com>` per team convention.

---

## Sign-off

This audit captures post-merge accuracy against Duolingo mobile as of the nine-commit fix pass. Next engineering slice should land P0 items, then merge stashed freemium work behind typed lesson packs and CI.
