# Parla — Technical Handoff

**Last updated:** June 2026  
**Repo:** [github.com/Nicolercc/Parla](https://github.com/Nicolercc/Parla)  
**Production:** [https://parla-rho.vercel.app](https://parla-rho.vercel.app)  
**Vercel dashboard:** [https://vercel.com/nicolerccs-projects/parla](https://vercel.com/nicolerccs-projects/parla)

This document is the engineering source of truth for a co-founder or senior engineer picking up Parla with zero verbal context. Read sections 1–4 first, then use the file breakdown and state sections when changing behavior.

---

## 1. Project Overview

Parla is a mobile-first, Duolingo-inspired language learning web app. Users complete onboarding with Pip, land on a personalized home path, then run bite-sized multiple-choice lessons with account-level hearts, gems, XP, streaks, and recovery flows when hearts run out.

**Stack:** React 19, Vite 8, plain JavaScript/JSX. JSX is precompiled at build time. There is no in-browser Babel or CDN React runtime in production.

**Target user:** Casual language learners (primarily English speakers learning Spanish) who respond to game mechanics — hearts, progress, mascot feedback, streaks — rather than textbook drills.

**Product bet:** Ship a polished freemium demo loop (onboarding → home → lesson → result/lock → recovery) with local persistence before adding auth, billing, or multi-language curriculum.

---

## 2. Current State

### Fully working

| Area | Details |
|------|---------|
| **Onboarding (7 steps)** | Welcome → language → source → reason → level → daily goal → plan summary; back on steps 1–6; subtle Pip acks on steps 1, 3, 4, 5; profile saved to `parla.account.v2` |
| **Home / lesson map** | Personalized title, reason tagline, daily goal pill, level note; streak/gems/hearts; one live lesson node |
| **Quiz loop** | 10 questions from `PARLA_LESSONS[0]`; Check → feedback → Continue; account hearts deducted on wrong answers; progress bar uses 1-based index |
| **Result screen** | Pass/fail copy, stars, XP/gems earned, confetti on pass |
| **Locked screen** | Feedback before lock on last heart; practice refill, gem refill, Parla+ demo activation; returns home |
| **Persistence** | `localStorage` key `parla.account.v2`: profile fields + economy (hearts, gems, XP, streak, refill timing) |
| **Build & deploy** | Vite → `dist/`; Vercel uses `framework: vite`, CSP without `unsafe-eval` |
| **Tests** | `npm run test` (source invariants); `npm run acceptance` (35 Playwright checks against preview server) |

### Partially working / demo stubs

| Area | Details |
|------|---------|
| **Parla+ billing** | `activatePlus()` sets `isPlus: true` locally — no payment or subscription backend |
| **Multi-language content** | Onboarding lists six languages; only Spanish is enabled. `selectedLanguage` is stored but quiz always uses `PARLA_LESSONS[0]` |
| **Single lesson** | One lesson pack (`basics-1`); additional nodes on the map are visual only |
| **Heart refill timer** | Persists via `lastHeartAt` in account; ticks every second while app is open |

### Removed (do not reintroduce)

| Item | Notes |
|------|-------|
| Legacy landing / language-select screens | Replaced by `OnboardingFlow` |
| “I already have an account” CTA | Removed; guarded by `check-source.mjs` and acceptance 16c |
| Visible plan tray during onboarding | Removed; plan summary step only |
| Browser Babel / CDN React | Replaced by Vite bundle via `main.jsx` |

### Known engineering gaps (factual)

1. **Hybrid module pattern:** ES module imports in Vite plus `window.*` exports — transitional; new code should follow existing files until a full module refactor.
2. **No error boundary:** Empty or malformed lesson data will throw at runtime.
3. **Acceptance requires preview server:** Default `PARLA_URL` is `http://localhost:3456`; run `vite preview --port 3456` after build.

---

## 3. File-by-File Breakdown

### Application source

| File | Purpose | Key exports | Notes |
|------|---------|-------------|-------|
| **`index.html`** | Shell, global CSS, Vite entry | — | Loads `<script type="module" src="/main.jsx">`. Typography: Nunito 400/700/800 from Google Fonts. |
| **`main.jsx`** | Vite bundle entry | — | Import order: questions → profile → mascot → ui → screens → onboarding → app. |
| **`questions.js`** | Lesson + question data | `window.PARLA_LESSONS`, `window.PARLA_QUESTIONS` (alias to lesson 0 questions) | Validated by `npm run test`. |
| **`profile.js`** | Onboarding metadata, plan copy, home personalization | `window.PARLA_META`, `window.PARLA_COPY` | Single source for languages, reasons, goals, Pip acks, plan summary rows. |
| **`onboarding.jsx`** | 7-step first-run flow | `window.OnboardingFlow` | `PlanSummaryStep` on final step; no visible plan tray. |
| **`mascot.jsx`** | Pip SVG + legacy wrappers | `window.Pip`, `window.Mascot` | Unified SVG; `Mascot` maps quiz states to Pip moods. |
| **`ui.jsx`** | Shared UI primitives | `ProgressBar`, `HeartsDisplay`, `OptionButton`, `QuestionCard`, `FeedbackBar`, `ActionButton`, etc. | Registers on `window`. |
| **`screens.jsx`** | Home, results, locked recovery | `LessonMapScreen`, `ResultScreen`, `LockedScreen`, `QuizMascot` | First-person Pip copy on locked screen. |
| **`app.jsx`** | Root app, economy, quiz hook | Mounts `<App />` via `ReactDOM.createRoot` | Phases: `onboarding` → `home` → `quiz`. |

### Tooling & deploy

| File | Purpose |
|------|---------|
| **`vite.config.js`** | Vite + `@vitejs/plugin-react`; output `dist/` with sourcemaps |
| **`vercel.json`** | Vite framework, build/install commands, security headers + CSP |
| **`package.json`** | Scripts: `dev`, `build`, `preview`, `test`, `acceptance`, `deploy`; `engines.node >= 22.12.0` |
| **`.nvmrc`** | Pins Node `22.12.0` for collaborators |
| **`scripts/check-source.mjs`** | `npm run test` — lesson schema, spine guards, voice/mascot/Vite invariants |
| **`scripts/acceptance.mjs`** | `npm run acceptance` — 35 behavioral Playwright checks |

---

## 4. App Flow

Two state layers drive the UI:

1. **`appPhase`** (`app.jsx`) — `'onboarding' | 'home' | 'quiz'`
2. **`phase`** inside `useQuizState` — `'quiz' | 'locked' | 'complete'`

```
┌──────────────┐  complete profile  ┌─────────────┐  start lesson  ┌─────────────┐
│ ONBOARDING   │───────────────────▶│    HOME     │───────────────▶│    QUIZ     │
│ 7 steps      │  → localStorage    │ Lesson map  │                │ QuizScreen  │
└──────────────┘                    └──────▲──────┘                └──────┬──────┘
       ▲                                 │                               │
       │ incomplete profile on load      │ ✕ / recovery / continue       │ hearts→0 / done
       └─────────────────────────────────┘                               ▼
                                                                   ┌────────────┐
                                                                   │ LOCKED or  │
                                                                   │ COMPLETE   │
                                                                   └────────────┘
```

| Step | Component | Transition |
|------|-----------|--------------|
| Onboarding | `OnboardingFlow` | `finishOnboarding(profile)` → `appPhase = 'home'` |
| Home | `LessonMapScreen` | `startLesson()` → `appPhase = 'quiz'` (or locked if 0 hearts) |
| Quiz | `QuizScreen` | Wrong answers → feedback → Continue; last heart defers lock until Continue |
| Locked | `LockedScreen` | Recovery actions → `goHome()` |
| Complete | `ResultScreen` | Continue → `goHome()`; Practice again → `resetQuiz()` |
| Return visit | — | `isProfileComplete(account)` → skip onboarding → `home` |

---

## 5. State Architecture

### Account storage (`parla.account.v2`)

| Field | Type | Purpose |
|-------|------|---------|
| `hasStarted` | boolean | Onboarding completed |
| `selectedLanguage` | string \| null | e.g. `'es'` |
| `source`, `reason`, `level`, `dailyGoal` | string \| null | Onboarding profile |
| `hearts` | number | Account hearts (max `CONFIG.maxHearts`) |
| `gems`, `xp`, `streak`, `completedLessons` | number | Economy |
| `isPlus` | boolean | Demo Parla+ flag |
| `lastHeartAt` | number \| null | Timestamp for timed heart refill |
| `lastPlayedDate` | string \| null | ISO date for streak logic |

`useAccount()` loads on mount, persists on change, applies heart refills every second, and exposes `completeOnboarding`, `loseHeart`, `completeLesson`, `buyRefill`, `earnPracticeHeart`, `activatePlus`.

### `useQuizState({ lesson, account, loseHeart, completeLesson })`

| Variable | Purpose |
|----------|---------|
| `currentIndex`, `score`, `selectedOption`, `isChecked` | Per-question UI |
| `phase` | `'quiz'`, `'locked'`, or `'complete'` |
| `pendingLock` | Defers lock until user taps Continue after last-heart wrong answer |

Key callbacks: `selectOption`, `checkAnswer`, `advance`, `resetQuiz`, `lockQuiz`.

### `CONFIG` (`app.jsx`)

```javascript
const CONFIG = {
  maxHearts: 5,
  refillSeconds: 4 * 60 * 60,
  refillCost: 350,
  practiceReward: 1,
  practiceGems: 15,
  accent: { c: '#58CC02', d: '#46A302' },
};
```

`CONFIG.accent` overrides `--green` / `--green-d` on the quiz screen via inline `rootStyle`.

---

## 6. Design System

### Color tokens (`index.html` `:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--green` / `--green-d` | `#58CC02` / `#46A302` | Primary CTA, progress, correct states |
| `--blue` / `--blue-d` | `#1CB0F6` / `#1789C8` | Selected options, Pip ack text |
| `--coral` / `--coral-d` | `#FF5A7A` / `#E5274C` | Wrong answers, hearts |
| `--yellow` / `--yellow-d` | `#FFD23C` / `#E9A800` | Stars, Parla+ accents |
| `--purple` | `#8549BA` | Unit kicker, confetti |
| `--bg` / `--surface` / `--border` | `#F7F7F7` / `#FFFFFF` / `#E5E5E5` | Layout surfaces |
| `--text` / `--text-muted` | `#3C3C3C` / `#777777` | Body and secondary copy |

Legacy aliases `--ink`, `--muted`, `--line`, `--card` map to the above.

### Typography

Single family: **[Nunito](https://fonts.google.com/specimen/Nunito)** (weights 400, 700, 800) loaded in `index.html`.

| Usage | Weight | Typical size |
|-------|--------|--------------|
| Body | 400 / 700 | 15–18px |
| Headings / `.font-display` | 800 | 22–34px |
| Question prompt | 800 | 30px |
| Uppercase labels | 900 | 12px, letter-spacing |

Fallback: `'Nunito', system-ui, sans-serif`.

### Motion

Respects `prefers-reduced-motion`. Key patterns: screen fade, quiz question enter, heart-break shake, feedback slide, Pip mood react, confetti on pass.

---

## 7. Data Layer

### Lesson schema (`questions.js`)

```javascript
window.PARLA_LESSONS = [
  {
    id: 'basics-1',           // string slug
    unit: 'Unit 1',
    title: 'Essential words',
    subtitle: '…',
    xp: 15,                     // positive integer
    questions: [ /* … */ ],
  },
];
```

### Question schema (inside `lesson.questions`)

```javascript
{
  id: 1,
  type: 'choice',
  prompt: 'apple',                              // shown in quotes
  instruction: 'How do you say this in Spanish?', // label above prompt
  options: ['manzana', 'naranja', 'uva', 'pera'],
  correctIndex: 0,                              // 0-based into options
  explain: 'Manzana means apple.',              // shown on wrong feedback
}
```

### Adding a question

1. Open `questions.js`.
2. Append an object to `PARLA_LESSONS[0].questions` using the schema above.
3. Ensure `correctIndex` is in range and `options.length >= 2`.
4. Run `npm run test` — schema is validated automatically.
5. With `npm run dev`, changes hot-reload; run `npm run build` before deploy.

Do **not** edit `window.PARLA_QUESTIONS` separately — it is a compatibility alias to `PARLA_LESSONS[0].questions`.

### Adding a new lesson

Add another object to `PARLA_LESSONS` and wire `app.jsx` to select the lesson (today hardcoded to `LESSONS[0]`).

---

## 8. Deployment

| Layer | Choice |
|-------|--------|
| Hosting | Vercel |
| Build | `npm run build` → `dist/` |
| Runtime | Static assets + hashed JS bundle |
| Node | 22.12+ required locally and on CI |
| Env vars | None |

### Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (default port 5173) |
| `npm run build` | Production bundle to `dist/` |
| `npm run preview` | Serve `dist/` locally (default port 4173) |
| `npm run test` | Source invariant checks |
| `npm run acceptance` | Playwright suite (needs preview at `PARLA_URL`) |
| `npm run deploy` | `vercel --prod` |

### CSP (`vercel.json`)

Scripts: `'self'` only (no `unsafe-eval`). Styles allow `'unsafe-inline'` plus Google Fonts. Fonts from `fonts.gstatic.com`.

---

## 9. How to Run Locally

### Prerequisites

- **Node.js 22.12+** (`nvm use` reads `.nvmrc`)
- Modern browser

### Setup

```bash
git clone https://github.com/Nicolercc/Parla.git
cd Parla
nvm use          # optional
npm install
npm run dev      # http://localhost:5173
```

### Verify before shipping

```bash
npm run test
npm run build
npm run build && npx vite preview --port 3456 --host 127.0.0.1
PARLA_URL=http://127.0.0.1:3456 npm run acceptance
```

### Happy path (manual)

1. Fresh profile → onboarding with Pip greeting  
2. Complete 7 steps including plan summary  
3. Home shows personalized tagline and daily goal  
4. Start lesson → 10 questions, 5 hearts  
5. Wrong answers show feedback; last heart locks after Continue  
6. Refresh → skips onboarding, returns to home  

Test viewport: **390×844** in DevTools.

---

## Appendix: `main.jsx` import order

```
questions.js → profile.js → mascot.jsx → ui.jsx → screens.jsx → onboarding.jsx → app.jsx
```

Order matters while the codebase uses `window.*` registration between files.

---

*End of handoff. For public overview, see `README.md`. For product critique, see `DUOLINGO_CLONE_AUDIT.md`.*
