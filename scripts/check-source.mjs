import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(new URL('..', import.meta.url).pathname);

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
  !read('index.html').toLowerCase().includes('already have an account'),
  'index.html must not expose fake account CTA copy',
);

const onboardingFlowExports = (onboarding.match(/function OnboardingFlow/g) || []).length;
assert(onboardingFlowExports === 1, 'onboarding.jsx must define exactly one OnboardingFlow');

assert(onboarding.includes('PlanSummaryStep'), 'onboarding.jsx must include Plan Summary step');
assert(onboarding.includes('pipAcknowledgement'), 'onboarding.jsx must use Pip acknowledgement copy');
assert(!onboarding.includes('PlanTray'), 'onboarding.jsx must not include visible Plan Tray');
assert(!onboarding.includes('ob-plan-tray'), 'onboarding.jsx must not render plan tray UI');
assert(!onboarding.includes('Pip says'), 'onboarding.jsx must not use third-person Pip copy');
assert(!read('profile.js').includes('Pip says'), 'profile.js must not use third-person Pip copy');

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
