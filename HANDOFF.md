# Parla — Technical Handoff

**Last updated:** June 2026  
**Repo:** [github.com/Nicolercc/Parla](https://github.com/Nicolercc/Parla)  
**Production:** [https://parla-rho.vercel.app](https://parla-rho.vercel.app)  
**Vercel dashboard:** [https://vercel.com/nicolerccs-projects/parla](https://vercel.com/nicolerccs-projects/parla)

This document is the single source of truth for a co-founder or senior engineer picking up Parla with zero verbal context. Read sections 1–4 first, then dive into state architecture and file breakdown as needed.

---

## 1. Project Overview

Parla is a mobile-first, Duolingo-inspired language learning web app. Users complete bite-sized multiple-choice quizzes (vocabulary and translation) inside a phone-frame UI, with a hearts/lives system, animated mascot feedback, and gamified end states (stars, XP, confetti). The entire app runs in the browser with **no build step**: React 18 and Babel Standalone load from CDN, JSX files are transpiled at runtime, and question data lives in a plain JavaScript array.

**Target user:** Casual language learners (primarily English speakers learning Spanish) who want short daily practice sessions on mobile or desktop — people who respond to game mechanics (hearts, progress bars, mascot encouragement) rather than textbook drills.

**Core thesis / product bet:** A polished, zero-friction demo can validate demand for “Duolingo-feel” learning without the complexity of accounts, spaced repetition, or native apps. Ship delight first (onboarding → pick language → quiz loop → emotional payoff), then layer persistence and curriculum. Spanish is the only live language; everything else is visible but gated as “Coming soon” to signal roadmap without building content yet.

---

## 2. Current State (as of today)

### Fully working

| Area | Details |
|------|---------|
| **Onboarding (6 steps)** | Neutral Pip welcome → language → source → reason → level → daily goal; back navigation on steps 1–5; full profile persisted to `parla.account.v2` |
| **Home / lesson map** | Personalized course title, reason tagline, daily goal pill, level note; streak/gems/hearts; unit path with one live lesson |
| **Quiz loop** | 10 questions from `PARLA_LESSONS[0]`, Check → feedback → Continue, 5 hearts, progress bar, Pip-branded bubble copy |
| **Result screen** | Star rating, pass/fail copy, confetti on pass, reduced rewards on fail |
| **Locked screen** | Feedback-before-lock on last heart; practice/refill/Plus recovery returns home |
| **Persistence** | `localStorage` account v2: economy + onboarding profile fields |
| **Deployment** | Static Vercel deploy; `npm run dev` + `npm run test` (source smoke) |

### Partially working

| Area | Details |
|------|---------|
| **Progress bar** | Renders and animates, but uses `currentIndex` (0-based) as the numerator — first question shows **0%** fill, last question shows **90%** (not 100% until after completion) |
| **“I already have an account”** | Navigates to language select — same as “Get Started”. No auth, no differentiated flow |
| **XP & streak copy** | Result screen shows `+{score * 12}` XP and says “You kept your streak alive” — **nothing is persisted**; values reset every session |
| **Heart refill countdown** | Counts down from 4:00:00 visually, but **resets on every LockedScreen mount** and does not block re-entry or sync across tabs |
| **Close button (✕) in quiz** | Calls `resetQuiz()` — resets question index/hearts/score but **stays in quiz**; does not return to landing or language select |
| **Language → quiz wiring** | Tapping Spanish always loads the same `PARLA_QUESTIONS` array; language `id` is never passed to quiz or stored |

### Stubbed / placeholder

| Item | Location | Behavior |
|------|----------|----------|
| **Parla+ subscription** | `LockedScreen` — “Try Parla+ free” button | No `onClick`, no navigation, no payment |
| **User accounts** | Landing ghost link | Copy only; no login/signup |
| **French, Japanese, Mandarin, Portuguese, Italian** | `LanguageSelectScreen` | `disabled`, “Coming soon” badge |
| **`phone--quiz` CSS class** | `app.jsx` line 187 | Applied when `appPhase === 'quiz'` but **no matching rules in `index.html`** — dead class |
| **Tests** | `package.json` | No test script; no test files |
| **`npm test`** | Removed from scripts | Was placeholder; not present |

### Known bugs / broken states

1. **Progress bar off-by-one:** `ProgressBar current={q.currentIndex}` — should likely be `currentIndex + 1` or use a “questions completed” count for accurate UX.
2. **Duplicate `linearGradient id="hg"` on hearts:** Each `Heart` SVG defines `<linearGradient id="hg">`. With 3 hearts rendered, IDs collide in DOM (browsers usually use first definition; fragile if heart count changes).
3. **Star “off” colors in `screens.jsx`:** `Star` component uses hardcoded light-theme fills (`#E9E6F2`, `#DAD6E6`) while app is dark-themed — CSS override exists for `.rstar--off path` in `index.html` but inline SVG attrs may fight specificity in some cases.
4. **Quiz state survives app navigation:** `useQuizState` lives in `App()` and is always mounted. Going landing → language → quiz calls `resetQuiz()` on entry (good). If user later adds a way back from quiz without reset, stale state would remain.
5. **No error boundary:** If `PARLA_QUESTIONS` is empty or `currentIndex` is out of bounds, app will throw on `currentQuestion.correctIndex`.
6. **CSP requires `'unsafe-eval'`:** Babel Standalone transpiles JSX in-browser; production CSP in `vercel.json` explicitly allows this. A future build pipeline could remove that requirement.

---

## 3. File-by-File Breakdown

### Application source

| File | Purpose | Exports / key symbols | Dependencies | Notes / gotchas |
|------|---------|----------------------|--------------|-----------------|
| **`index.html`** | Single-page entry: meta, Nunito font, all global CSS, script load order, `#root` mount point | None (not a module) | CDN: React 18.3.1, ReactDOM, Babel Standalone 7.29.0; local scripts below | **Load order:** `questions.js` → `profile.js` → `mascot.jsx` → `ui.jsx` → `screens.jsx` → `onboarding.jsx` → `app.jsx`. |
| **`profile.js`** | Onboarding metadata + home personalization + Pip copy helpers | `window.PARLA_META`, `window.PARLA_COPY` | None | Single source for language list, reason taglines, goal minutes. |
| **`app.jsx`** | Root React app: routing, economy, quiz hook | Mounts `<App />` | `PARLA_LESSONS`, `OnboardingFlow`, `PARLA_META`, `PARLA_COPY`, screen/UI exports | `parla.account.v2` stores economy + onboarding profile. Phases: onboarding → home → quiz. |
| **`onboarding.jsx`** | 6-step first-run flow | `window.OnboardingFlow` | `PARLA_META`, `Pip`, `ActionButton`, `BackButton` | Back on steps 1–5; neutral welcome before language pick. |
| **`screens.jsx`** | Home map, results, locked recovery | `ResultScreen`, `LockedScreen`, `LessonMapScreen`, `QuizMascot` | `Pip`, `Mascot`, `PARLA_COPY` (result) | Legacy `LandingScreen` / `LanguageSelectScreen` removed. |
| **`ui.jsx`** | Reusable UI primitives for quiz and onboarding | `window.Heart`, `ProgressBar`, `HeartsDisplay`, `OptionButton`, `QuestionCard`, `FeedbackBar`, `ActionButton`, `BackButton`, `PillButton`, `GhostLink`, `LanguageCard` | `React` only | `getOptionState()` is module-private. Option keys hardcoded A–D (assumes ≤4 options). `Heart` gradient id collision risk. |
| **`mascot.jsx`** | SVG mascot “Pip” with mood-driven face/animations | `window.Pip` | `React` | Moods: `idle`, `thinking`, `happy`, `sad`, `dizzy`. `dizzy` is implemented but **never used** by app. Retriggers CSS react animation on mood change via `pip-react` class. |
| **`questions.js`** | Static question bank | `window.PARLA_QUESTIONS` (array of 10 objects) | None | Must load before `app.jsx`. No validation at runtime. |

### Config / deploy / docs

| File | Purpose | Exports | Dependencies | Notes |
|------|---------|---------|--------------|-------|
| **`vercel.json`** | Vercel static deploy config + HTTP headers | N/A | Vercel platform | `framework: null`, empty build/install commands. CSP allows unpkg + `'unsafe-eval'` for Babel. |
| **`package.json`** | Project metadata and npm scripts | N/A | None at runtime | No `dependencies`. Scripts: `dev`, `deploy`, `deploy:preview`. |
| **`package-lock.json`** | Lockfile for empty dependency tree | N/A | N/A | No packages installed. |
| **`.vercelignore`** | Files excluded from Vercel upload | N/A | N/A | Ignores `.git`, `node_modules`, `.DS_Store`, `.shots`. |
| **`.gitignore`** | Git ignore rules | N/A | N/A | Includes `.vercel` (local Vercel link metadata). |
| **`README.md`** | Public-facing project documentation | N/A | N/A | Describes architecture, quick start, deployment — may drift from this handoff; treat **HANDOFF.md** as engineering source of truth. |
| **`HANDOFF.md`** | This document | N/A | N/A | — |

### Not in repo (external)

| Resource | Role |
|----------|------|
| `https://unpkg.com/react@18.3.1/...` | React runtime |
| `https://unpkg.com/react-dom@18.3.1/...` | ReactDOM |
| `https://unpkg.com/@babel/standalone@7.29.0/...` | In-browser JSX transform |
| `https://fonts.googleapis.com/...Nunito...` | Typography |

---

## 4. App Flow

Two independent state layers drive the UI:

1. **`appPhase`** (`app.jsx`) — top-level navigation: `'onboarding' | 'home' | 'quiz'`
2. **`phase`** inside `useQuizState` — quiz sub-states: `'quiz' | 'locked' | 'complete'`

### Journey diagram

```
┌──────────────┐  6 steps + back   ┌─────────────┐  start lesson  ┌─────────────┐
│ ONBOARDING   │──────────────────▶│    HOME     │───────────────▶│    QUIZ     │
│OnboardingFlow│  completeOnboarding │LessonMap    │                │ QuizScreen  │
└──────────────┘  → localStorage     └──────▲──────┘                └──────┬──────┘
       ▲                                  │                              │
       │ hasStarted=false                   │ return user                  │ hearts→0 / done
       └──────── refresh ──────────────────┘                              ▼
                                                                  ┌────────────┐
                                                                  │ LOCKED or  │
                                                                  │ COMPLETE   │
                                                                  └─────┬──────┘
                                                                        │ ✕ / recovery → home
```

### Phase-by-phase detail

| Step | Component | User action | State transition |
|------|-----------|-------------|------------------|
| 1. Onboarding | `OnboardingFlow` | Complete 6 steps (back on 1–5) | `completeOnboarding(profile)` → `appPhase = 'home'` |
| 2. Home | `LessonMapScreen` | Tap lesson node | `startLesson()` → `appPhase = 'quiz'` (or locked if 0 hearts) |
| 3. Quiz | `QuizScreen` | Check → Continue | `advance()`; last-heart wrong defers lock until Continue |
| 4a. Locked | `LockedScreen` | Practice / refill / Plus / ✕ | Recovery → `goHome()` |
| 4b. Complete | `ResultScreen` | Continue | `goHome()` |
| Return visit | — | Load app | `hasStarted` → skip onboarding → `home` |

---

## 5. State Architecture

### Top-level: `appPhase` (`App` component)

| State | Type | Initial | Mutations |
|-------|------|---------|-----------|
| `appPhase` | `'onboarding' \| 'home' \| 'quiz'` | `onboarding` if `!hasStarted` else `home` | `setAppPhase` |

**`goTo(phase)` behavior:**
- If `phase === 'quiz'`, calls `q.resetQuiz()` first (full quiz reset)
- Then `setAppPhase(phase)`

### `useQuizState(maxHearts)` — full reference

Hook signature: `useQuizState(maxHearts)` where `maxHearts` comes from `CONFIG.maxHearts` (currently **3**).

#### State variables

| Variable | Type | Initial | What changes it |
|----------|------|---------|-----------------|
| `currentIndex` | `number` | `0` | `advance()` increments; `resetQuiz()` → 0 |
| `score` | `number` | `0` | `checkAnswer()` increments on correct; `resetQuiz()` → 0 |
| `hearts` | `number` | `maxHearts` | `checkAnswer()` decrements on wrong; `resetQuiz()` → maxHearts |
| `selectedOption` | `number \| null` | `null` | `selectOption(i)` sets index; `advance()` / `resetQuiz()` → null |
| `isChecked` | `boolean` | `false` | `checkAnswer()` → true; `advance()` / `resetQuiz()` → false |
| `phase` | `'quiz' \| 'locked' \| 'complete'` | `'quiz'` | `checkAnswer()` → `'locked'` if hearts hit 0; `advance()` → `'complete'` if last Q done; `resetQuiz()` → `'quiz'` |

#### Derived values (recomputed each render)

| Name | Computation |
|------|-------------|
| `currentQuestion` | `Q[currentIndex]` — direct array access, no bounds check |
| `isCorrect` | `selectedOption === currentQuestion.correctIndex` |
| `total` | `Q.length` (10) |

#### Callbacks

| Callback | Signature | When called | Exact behavior |
|----------|-----------|-------------|----------------|
| `selectOption(i)` | `(number) => void` | Option button click | If `!isChecked`, set `selectedOption` to `i`. Ignored after check. |
| `checkAnswer()` | `() => void` | Check button | No-op if already checked or no selection. Sets `isChecked=true`. If correct: `score+1`. If wrong: `hearts-1`; if hearts would hit 0, sets `phase='locked'`. |
| `advance()` | `() => void` | Continue in feedback bar (also wired to Check when checked — see below) | No-op if `phase==='locked'`. If `currentIndex+1 >= Q.length`, set `phase='complete'`. Else increment index, clear selection, clear checked. |
| `resetQuiz()` | `() => void` | Enter quiz from language, ✕ button, Practice again, Locked reset | Resets all six state vars to initial quiz values. |

**Note:** Footer `ActionButton` is hidden when `isChecked` (`{!q.isChecked && ...}`), so after checking, only `FeedbackBar`'s Continue calls `advance()`.

#### Quiz phase state machine

```
                    ┌──────────────────────────────────────┐
                    │              phase: 'quiz'            │
                    │  (active question UI, hearts > 0)     │
                    └───────────┬──────────────────────────┘
                                │
              wrong answer      │         advance past last question
              + hearts → 0      │         (currentIndex + 1 >= total)
                    │           │
                    ▼           ▼
         ┌──────────────┐  ┌──────────────┐
         │ phase:       │  │ phase:       │
         │  'locked'    │  │  'complete'  │
         └──────┬───────┘  └──────┬───────┘
                │                 │
                │  resetQuiz()    │  resetQuiz()
                └────────┬────────┘
                         ▼
                    phase: 'quiz'
```

Valid `phase` values: `'quiz'`, `'locked'`, `'complete'`. There is no `'idle'` or back-navigation from locked/complete to landing without adding new handlers.

#### Mascot helpers (module-level in `app.jsx`, not hook)

| Function | Input | Output |
|----------|-------|--------|
| `mascotMood({ isChecked, isCorrect, selectedOption })` | quiz UI state | `'happy' \| 'sad' \| 'thinking' \| 'idle'` |
| `bubbleText({ isChecked, isCorrect })` | quiz UI state | Spanish/English encouragement string |

---

## 6. Design System

### Color tokens

Defined in `index.html` `:root`:

| Token | Hex / value | Usage |
|-------|-------------|-------|
| `--green` | `#3DDC84` | Primary CTA, progress fill, correct states |
| `--green-d` | `#22B567` | Button borders, darker green accents |
| `--blue` | `#38BDF8` | Selected option border |
| `--blue-d` | `#1F93D8` | Blue depth |
| `--purple` | `#A974FF` | Confetti, mascot accents |
| `--yellow` | `#FFD23C` | Stars, XP highlight |
| `--yellow-d` | `#E9A800` | XP text on result screen |
| `--coral` | `#FF5A7A` | Wrong answers, hearts, error feedback |
| `--coral-d` | `#E5274C` | Heart stroke |
| `--bg-deep` | `#0E1117` | Page + phone background |
| `--surface` | `#161B22` | Cards, options, bubbles |
| `--border` | `#30363D` | Borders, progress track |
| `--text` | `#FFFFFF` | Primary text |
| `--text-muted` | `#8B949E` | Secondary text, labels |
| `--sel-bg` | `rgba(56,189,248,.12)` | Selected option background |
| `--ok-bg` | `rgba(61,220,132,.14)` | Correct feedback/option |
| `--no-bg` | `rgba(255,90,122,.14)` | Wrong feedback/option |
| `--transition` | `200ms ease` | Default transition |

Legacy aliases: `--ink`, `--muted`, `--line`, `--card`, `--bg` map to the above.

`CONFIG.accent` in `app.jsx` injects `--green` and `--green-d` inline on quiz screen; `--opt-cols` sets option grid columns (default 2).

### Typography

| Element | Font | Weight | Size (approx) |
|---------|------|--------|---------------|
| Body | Nunito (Google Fonts) | 400 / 700 | 15–18px |
| Display / headings | Nunito | 800 | 22–34px |
| `.font-display` | Nunito | 800 | — |
| Landing headline | Nunito | 800 | `clamp(28px, 7vw, 34px)` |
| Question prompt | Nunito | 800 | 30px |
| Option labels | Nunito | 800 | 18px |
| Uppercase labels | Nunito | 800 | 12px, `letter-spacing: .14em` |

Fallback stack: `'Nunito', system-ui, sans-serif`.

### Component inventory (`ui.jsx`)

| Component | Props | Renders |
|-----------|-------|---------|
| `Heart` | `filled`, `broken` | Single heart SVG |
| `ProgressBar` | `current`, `total` | Horizontal bar, `role="progressbar"` |
| `HeartsDisplay` | `hearts`, `maxHearts?` | Row of hearts; shake + break anim on loss |
| `OptionButton` | `label`, `index`, `isSelected`, `isChecked`, `isCorrect`, `isAnswer`, `onClick` | Multiple-choice tile with A–D key |
| `QuestionCard` | `hint`, `prompt`, `children` | Hint label + quoted prompt + option grid |
| `FeedbackBar` | `isVisible`, `isCorrect`, `correctAnswer`, `onContinue` | Bottom sheet feedback + Continue |
| `ActionButton` | `label`, `onClick`, `disabled?`, `variant?` | Full-width quiz CTA (`green` default) |
| `BackButton` | `onClick`, `label?` | Chevron back control |
| `PillButton` | `label`, `onClick`, `variant?` | Full-width pill CTA (landing) |
| `GhostLink` | `label`, `onClick` | Text-only secondary action |
| `LanguageCard` | `flag`, `name`, `available`, `onSelect` | Language tile with optional “Coming soon” |

### Screen components (`screens.jsx`)

| Component | Props |
|-----------|-------|
| `LandingScreen` | `onNext` |
| `LanguageSelectScreen` | `onNext`, `onBack` |
| `ResultScreen` | `score`, `total`, `hearts`, `onReset` |
| `LockedScreen` | `onReset` |
| `Confetti` | `run` (internal) |
| `Star` | `on` (internal) |

### Mascot (`mascot.jsx`)

| Component | Props | Moods used in app |
|-----------|-------|-------------------|
| `Pip` | `mood?`, `size?`, `color?` | `idle`, `thinking`, `happy`, `sad` |

### Animation patterns

| Pattern | CSS / trigger | Duration |
|---------|---------------|----------|
| Screen enter | `.screen-fade` → `screenFade` | 150ms |
| Landing mascot | `.landing-enter-mascot` → `landingMascot` | 400ms ease-out |
| Landing text/CTA | `.landing-enter-headline/sub/cta` → `fadeIn` with delays 200/280/400ms | 350ms |
| Pill button press | `.btn-pill:active` → `scale(0.97)` | 100ms |
| Language card tap | `.lang-card:active` → `scale(0.96)` | 100ms |
| Question enter | `.quiz-scroll` → `qIn` | 420ms |
| Heart loss | `.hearts--lost` → `heartsShake`; `.heart--break` → `heartBreak` | 400–500ms |
| Wrong option | `.opt--wrong` → `nudge` | 350ms |
| Feedback slide | `.feedback--in` | 340ms cubic-bezier |
| Pip idle bob | `.pip-body` → `pipBob` | 2.6s loop |
| Pip mood react | `.pip-react` on mood change | hop/shake/wobble |
| Result stars | `.star-slot.pop` → `starPop` | staggered via JS timeouts |
| Confetti | `.confetti-bit` → `fall` | 1.6–3s random |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | Disables animations |

---

## 7. Data Layer

### Question schema (`questions.js`)

Each object in `window.PARLA_QUESTIONS`:

```javascript
{
  id: number,           // Unique within array (1–10 today); not used by app logic
  prompt: string,       // English word/phrase shown in quotes
  hint: string,         // Uppercase label above prompt, e.g. "How do you say" | "Translate"
  options: string[],    // Exactly 4 Spanish options (UI assumes A–D keys)
  correctIndex: number  // 0-based index into options
}
```

Question types in current bank:
- **`hint: 'How do you say'`** — English vocabulary → pick Spanish word
- **`hint: 'Translate'`** — English phrase → pick Spanish translation

No shuffle: options appear in array order every time.

### How to add a new question

1. Open `questions.js`
2. Append an object to `window.PARLA_QUESTIONS` with the schema above
3. Ensure `options.length === 4` and `0 <= correctIndex <= 3`
4. Refresh browser — no build step

Progress bar, star thresholds, and XP (`score * 12`) automatically scale with array length.

### How to add a new language / lesson

**Today there is no multi-language data layer.** Spanish is implicit.

To add a language properly:

1. **`screens.jsx`** — Set `available: true` on the language in `LANGUAGES`
2. **Create question data** — e.g. `questions-fr.js` exporting `window.PARLA_QUESTIONS_FR`
3. **`index.html`** — Add script tag for new file (or refactor to a map)
4. **`app.jsx`** — Store selected language id in `App` state (e.g. `selectedLang`); pass correct question array into `useQuizState` instead of hardcoded `window.PARLA_QUESTIONS`
5. **`LanguageSelectScreen`** — Pass `lang.id` in `onNext('quiz', lang.id)` instead of bare `'quiz'`

Until step 4–5 are done, enabling a language card would still run Spanish questions.

---

## 8. Deployment

### Architecture

| Layer | Choice |
|-------|--------|
| Hosting | Vercel (static) |
| Build | **None** — files served as-is from repo root |
| React | CDN (`unpkg.com`) |
| JSX transform | Babel Standalone in browser |
| Backend | None |
| Env vars | None |

### `vercel.json` explained

| Field | Value | Meaning |
|-------|-------|---------|
| `framework` | `null` | No Next.js/Vite auto-detection |
| `buildCommand` | `""` | Skip build |
| `installCommand` | `""` | Skip npm install |
| Headers on `/(.*)` | Security + CSP | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CSP allowing self + unpkg + Google Fonts + `'unsafe-eval'` for Babel |
| Headers on `/:file.js` and `/:file.jsx` | Cache 24h + SWR 7d | JSX/JS cached at edge |
| Headers on `/index.html` | `max-age=0, must-revalidate` | HTML always fresh (picks up script/CSS changes) |

### Deploy commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Runs `npx serve .` — static server (default port **3000** for `serve` package; may prompt to use another if busy) |
| `npm run deploy:preview` | `vercel` — preview deployment URL |
| `npm run deploy` | `vercel --prod` — promotes to production alias |

First-time setup requires `npx vercel login` (OAuth device flow). Project is linked to **`nicolerccs-projects/parla`**.

Alternative local serve:

```bash
python3 -m http.server 8080
```

### URLs

| Environment | URL |
|-------------|-----|
| **Production** | [https://parla-rho.vercel.app](https://parla-rho.vercel.app) |
| **Vercel dashboard** | [https://vercel.com/nicolerccs-projects/parla](https://vercel.com/nicolerccs-projects/parla) |
| **GitHub** | [https://github.com/Nicolercc/Parla](https://github.com/Nicolercc/Parla) |

Vercel is connected to GitHub; pushes to linked branch can trigger auto-deploy (confirm in dashboard → Git settings).

---

## 9. Immediate Next Steps (prioritized)

### 1. Fix progress bar to reflect actual completion

**What:** Progress fill should show meaningful progress (e.g. question 1 of 10 → 10%, not 0%).  
**Why:** Visible in every demo screen recording; looks broken to investors/users.  
**How:** In `app.jsx`, change `ProgressBar current={q.currentIndex}` to `current={q.currentIndex + 1}` or pass `isChecked` and count completed questions. One-line fix in `QuizScreen`.

### 2. Wire selected language into quiz data

**What:** Store `selectedLanguage` in `App` when user taps a language card; load the matching question set.  
**Why:** Without this, adding French/Japanese content is fake — cards lie about what you're learning.  
**How:** Extend `goTo(phase, langId?)`; refactor `useQuizState` to accept `questions` array param; structure data as `window.PARLA_LESSONS = { es: [...], fr: [...] }`. Spanish keeps current array.

### 3. Persist hearts refill + basic localStorage session

**What:** Save `hearts`, `lastHeartLossTimestamp`, `xp`, `streak` to `localStorage`; heart countdown survives refresh.  
**Why:** Locked screen and “streak alive” copy are demo-critical Duolingo mechanics; currently dishonest on reload.  
**How:** Create `storage.js` with get/set helpers; hydrate `useQuizState` initial hearts from storage; on wrong answer write timestamp; LockedScreen reads persisted countdown. Keep it minimal — no backend.

### 4. Differentiate “I already have an account” (even as stub)

**What:** Second landing CTA opens a simple “Sign in” modal or screen (email field + “Continue” that proceeds to language select).  
**Why:** Demo narrative often includes “returning user” path; today both CTAs are identical (looks unfinished).  
**How:** Add `appPhase: 'signin'` or modal in `LandingScreen`; reuse language select as next step. No real auth needed for demo — toast “Coming soon” or skip straight through.

### 5. Exit path from quiz + polish close button

**What:** ✕ should confirm “Leave lesson?” and return to `language` or `landing`; “Practice again” could offer “Back to languages”.  
**Why:** Users feel trapped in quiz during demo; standard mobile pattern.  
**How:** Replace `onClick={q.resetQuiz}` on close with handler that sets `appPhase` and optionally resets; add confirm dialog via simple `window.confirm` or custom modal component in `ui.jsx`.

---

## 10. Future Roadmap (post-demo)

| Initiative | Notes |
|------------|-------|
| **Rive animations for Pip** | Replace SVG + CSS moods with Rive state machine; requires runtime lib and asset pipeline — conflicts with zero-build unless Rive loaded via CDN |
| **Backend / user accounts** | Auth (Clerk/Supabase/Firebase), sync progress cross-device, real Parla+ billing |
| **Streak system** | Daily login tracking, streak freeze, push notifications — needs persistence + timezone logic |
| **More languages** | Separate question banks per language, CEFR levels, unit/lesson hierarchy |
| **Adaptive difficulty** | Track per-word accuracy, spaced repetition (SM-2 or similar), wrong-answer resurfacing |
| **Mobile app (React Native)** | Reuse question schema and game logic; replace window-global pattern with proper modules; Rive/SVG mascot portable |
| **Build pipeline (Vite)** | Precompile JSX, tree-shake, remove `'unsafe-eval'` from CSP, faster loads |
| **Audio pronunciation** | TTS or recorded clips per prompt/answer — Web Speech API for demo, assets for prod |
| **Analytics** | PostHog/Mixpanel on funnel: landing → language → Q1 → completion |

---

## 11. How to Run Locally

### Prerequisites

- Node.js 18+ (for `npx serve` and `npx vercel`)
- Modern browser (Chrome, Safari, Firefox, Edge)
- **No** `npm install` required for local viewing

### Commands

```bash
# Clone
git clone https://github.com/Nicolercc/Parla.git
cd Parla

# Option A — npm script (recommended)
npm run dev
# Opens static server; default http://localhost:3000 (serve picks next free port if taken)

# Option B — Python
python3 -m http.server 8080
# http://localhost:8080

# Option C — open file directly
open index.html
# Works but a local server is preferred (some browsers treat file:// differently)
```

### Environment variables

**None.** No `.env` file exists or is read.

### Verify the happy path

1. Open app → landing with Pip on dark background  
2. Tap **Get Started** → language grid  
3. Tap **Spanish** → question 1 of 10, 3 hearts  
4. Select answer → **Check** → feedback → **Continue**  
5. Complete all 10 → result screen with stars and XP  

Test viewport: **390×844** (iPhone 15) in DevTools.

### Deploy to production

```bash
npx vercel login          # once
npm run deploy            # vercel --prod
```

---

## Appendix: Script load order (critical)

```
index.html
  ├── questions.js          (data)
  ├── mascot.jsx            → window.Pip
  ├── ui.jsx                → window.ProgressBar, etc.
  ├── screens.jsx           → window.LandingScreen, etc. (uses ui + Pip)
  └── app.jsx               → mounts App (uses everything)
```

If load order changes, `window.*` dependencies will be `undefined` and the app will white-screen.

---

## Appendix: `CONFIG` reference (`app.jsx`)

```javascript
const CONFIG = {
  maxHearts: 3,        // Starting lives per quiz run
  showMascot: true,    // Hide Pip + bubble in quiz when false
  optionColumns: 2,    // CSS grid columns for options
  accent: { c: '#3DDC84', d: '#22B567' },
};
```

---

*End of handoff. Questions → open an issue or check git history on `main`.*
