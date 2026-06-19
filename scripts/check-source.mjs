import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(read('questions.js'), context, { filename: 'questions.js' });
vm.runInContext(read('profile.js'), context, { filename: 'profile.js' });
vm.runInContext(read('events.js'), context, { filename: 'events.js' });

const lessons = context.window.PARLA_LESSONS;
assert(Array.isArray(lessons) && lessons.length > 0, 'PARLA_LESSONS must be a non-empty array');

for (const lesson of lessons) {
  assert(typeof lesson.id === 'string' && lesson.id, 'lesson.id is required');
  assert(typeof lesson.title === 'string' && lesson.title, `${lesson.id} needs a title`);
  assert(Number.isInteger(lesson.xp) && lesson.xp > 0, `${lesson.id} needs positive XP`);
  assert(Array.isArray(lesson.questions) && lesson.questions.length > 0, `${lesson.id} needs questions`);

  for (const question of lesson.questions) {
    assert(typeof question.prompt === 'string' && question.prompt, `${lesson.id} question needs prompt`);
    assert(typeof question.instruction === 'string' && question.instruction, `${lesson.id} question needs instruction`);
    assert(Array.isArray(question.options) && question.options.length >= 2, `${lesson.id} question needs options`);
    assert(Number.isInteger(question.correctIndex), `${lesson.id} question needs correctIndex`);
    assert(question.correctIndex >= 0 && question.correctIndex < question.options.length, `${lesson.id} question correctIndex is out of range`);
  }
}

const app = read('app.jsx');
const screens = read('screens.jsx');
const ui = read('ui.jsx');
const onboarding = read('onboarding.jsx');

for (const file of ['app.jsx', 'screens.jsx', 'ui.jsx', 'onboarding.jsx', 'profile.js']) {
  assert(!read(file).includes('<<<<<<<'), `${file} must not contain merge conflict markers`);
}

assert(onboarding.includes('function OnboardingFlow'), 'onboarding.jsx must define OnboardingFlow');
assert(app.includes('OnboardingFlow'), 'app.jsx must wire OnboardingFlow');
assert(app.includes('completeOnboarding'), 'app.jsx must persist full onboarding profile');
assert(!app.includes('LandingScreen'), 'app.jsx must not wire legacy landing flow');
assert(!screens.includes('function LandingScreen'), 'screens.jsx must not define legacy LandingScreen');
assert(context.window.PARLA_META && context.window.PARLA_COPY, 'profile.js must export PARLA_META and PARLA_COPY');
assert(typeof context.window.PARLA_META.isProfileComplete === 'function', 'profile.js must export isProfileComplete');
assert(app.includes('isProfileComplete'), 'app.jsx must gate home on complete profile');

for (const field of ['selectedLanguage', 'source', 'reason', 'level', 'dailyGoal']) {
  assert(app.includes(field), `app.jsx account must include ${field}`);
}

for (const required of ['LessonMapScreen', 'LockedScreen', 'ResultScreen']) {
  assert(app.includes(required), `app.jsx must wire ${required}`);
  assert(screens.includes(required), `screens.jsx must define/export ${required}`);
}

for (const required of ['HeartsDisplay', 'FeedbackBar', 'QuestionCard']) {
  assert(ui.includes(required), `ui.jsx must define/export ${required}`);
}

// Event Tab (PRD 11.3)
const events = context.window.PARLA_EVENTS;
assert(Array.isArray(events) && events.length >= 3, 'PARLA_EVENTS must have at least 3 events (2 standard + 1 special)');
const VALID_EVENT_METRICS = new Set(['correctAnswers', 'lessonsCompleted', 'lessonScore']);
const VALID_REWARD_TYPES = new Set(['gems', 'hearts', 'unlimited', 'streak', 'shield', 'badge']);
const lessonIds = new Set(lessons.map((l) => l.id));
function assertReward(reward, ctx) {
  assert(reward && VALID_REWARD_TYPES.has(reward.type), `${ctx} needs a valid reward.type`);
  assert(typeof reward.label === 'string' && reward.label, `${ctx} reward needs a label`);
}
let specialEvents = 0;
for (const event of events) {
  assert(typeof event.id === 'string' && event.id, 'event.id is required');
  assert(event.kind === 'standard' || event.kind === 'special', `${event.id} needs kind 'standard' or 'special'`);
  assert(typeof event.title === 'string' && event.title, `${event.id} needs a title`);
  assert(typeof event.description === 'string' && event.description, `${event.id} needs a description`);
  assert(VALID_EVENT_METRICS.has(event.metric), `${event.id} has unknown metric: ${event.metric}`);
  if (event.metric === 'lessonScore') {
    assert(lessonIds.has(event.lessonId), `${event.id} references unknown lessonId: ${event.lessonId}`);
  }
  if (event.tiers) {
    assert(Array.isArray(event.tiers) && event.tiers.length > 0, `${event.id} tiers must be a non-empty array`);
    for (const tier of event.tiers) {
      assert(Number.isInteger(tier.at) && tier.at > 0, `${event.id} tier needs a positive 'at'`);
      assertReward(tier.reward, `${event.id} tier ${tier.at}`);
    }
  } else {
    assert(Number.isInteger(event.target) && event.target > 0, `${event.id} needs a positive target`);
    assertReward(event.reward, event.id);
  }
  if (event.kind === 'special') specialEvents += 1;
}
assert(specialEvents >= 1, 'PARLA_EVENTS must include at least one special event');
assert(
  context.window.PARLA_EVENT_UTILS && typeof context.window.PARLA_EVENT_UTILS.eventView === 'function',
  'events.js must export PARLA_EVENT_UTILS.eventView',
);

const eventsJsx = read('events.jsx');
assert(eventsJsx.includes('function EventTabScreen'), 'events.jsx must define EventTabScreen');
assert(eventsJsx.includes('function BottomNav'), 'events.jsx must define BottomNav');
assert(eventsJsx.includes('onPlay'), 'events.jsx must support a themed Play CTA (onPlay)');
for (const required of ['EventTabScreen', 'BottomNav']) {
  assert(app.includes(required), `app.jsx must wire ${required}`);
}
assert(app.includes('lessonById'), 'app.jsx must launch lessons by id (themed events)');
assert(app.includes('claimReward'), 'app.jsx must expose the event claim handler');

const sample = context.window.PARLA_META.personalizeHome({
  selectedLanguage: 'es',
  reason: 'travel',
  level: 'new',
  dailyGoal: 'casual',
});
assert(sample.courseTitle.includes('Spanish'), 'personalizeHome must reflect selected language');
assert(sample.tagline.toLowerCase().includes('travel'), 'personalizeHome must reflect reason');
assert(sample.dailyGoal.includes('5'), 'personalizeHome must reflect daily goal');

const acceptance = read('scripts/acceptance.mjs');
assert(
  !/^\s*pass\(\s*['"]16[^'"]*['"]\s*\)\s*;?\s*$/m.test(acceptance),
  'acceptance.mjs must not contain an unconditional pass() for check 16',
);
assert(
  acceptance.includes('assertCheck16SingleOnboardingPath'),
  'acceptance.mjs must implement real check-16 onboarding-path assertions',
);
assert(
  acceptance.includes('goal-row--sel'),
  'acceptance.mjs must assert onboarding back-navigation preserves selections',
);

assert(
  acceptance.includes('Your plan is ready'),
  'acceptance.mjs must assert Plan Summary screen',
);
assert(
  acceptance.includes('ob-pip-ack'),
  'acceptance.mjs must assert Pip acknowledgement copy',
);
assert(
  acceptance.includes('buildPlanSummary') || acceptance.includes('Travel-ready basics'),
  'acceptance.mjs must assert Plan Summary content',
);

for (const legacy of [
  "goTo('landing')",
  "goTo('language')",
  "appPhase === 'landing'",
  "appPhase === 'language'",
  "'landing' | 'language'",
]) {
  assert(!app.includes(legacy), `app.jsx must not reference legacy route: ${legacy}`);
}

assert(
  !read('index.html').includes('text/babel'),
  'index.html must not load raw JSX through browser Babel',
);
assert(
  read('index.html').includes('type="module"'),
  'index.html must load the Vite bundle entry',
);
assert(
  !read('index.html').toLowerCase().includes('already have an account'),
  'index.html must not expose fake account CTA copy',
);

const onboardingFlowExports = (onboarding.match(/function OnboardingFlow/g) || []).length;
assert(onboardingFlowExports === 1, 'onboarding.jsx must define exactly one OnboardingFlow');

const mascot = read('mascot.jsx');
assert(!mascot.includes('MASCOT_CSS'), 'mascot.jsx must not inject duplicate MASCOT_CSS');
assert(mascot.includes('function Pip('), 'mascot.jsx must define Pip as the single SVG implementation');
assert(mascot.includes('STATE_TO_MOOD'), 'Mascot must map legacy states to Pip moods');
assert(mascot.includes('gentleCorrection'), 'Pip must support gentleCorrection mood for wrong answers');
assert(screens.includes('mood="listening"'), 'QuizMascot must use listening mood when an option is selected');

const BANNED_PIP_VOICE = /Pip says|told Pip|Pip saved|Pip agrees|Pip marked|Pip will wait/i;
for (const file of ['app.jsx', 'screens.jsx', 'ui.jsx', 'onboarding.jsx', 'profile.js', 'mascot.jsx']) {
  assert(!BANNED_PIP_VOICE.test(read(file)), `${file} must not use banned third-person Pip copy`);
}

assert(onboarding.includes('PlanSummaryStep'), 'onboarding.jsx must include Plan Summary step');
assert(onboarding.includes('pipAcknowledgement'), 'onboarding.jsx must use Pip acknowledgement copy');
assert(!onboarding.includes('PlanTray'), 'onboarding.jsx must not include visible Plan Tray');
assert(!onboarding.includes('ob-plan-tray'), 'onboarding.jsx must not render plan tray UI');

const summarySample = context.window.PARLA_META.buildPlanSummary({
  selectedLanguage: 'es',
  reason: 'travel',
  level: 'new',
  dailyGoal: 'casual',
});
const summaryLabels = summarySample.rows.map((row) => row.label).join(' ');
assert(summaryLabels.includes('Spanish'), 'buildPlanSummary must include language');
assert(summaryLabels.includes('Travel-ready basics'), 'buildPlanSummary must include reason');
assert(summaryLabels.includes('Starting from scratch'), 'buildPlanSummary must include level');
assert(summaryLabels.includes('5 min/day'), 'buildPlanSummary must include daily goal');

console.log(`Validated ${lessons.length} lesson pack(s), profile spine, and core UI exports.`);
