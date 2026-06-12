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

for (const file of ['app.jsx', 'screens.jsx', 'ui.jsx', 'onboarding.jsx']) {
  assert(!read(file).includes('<<<<<<<'), `${file} must not contain merge conflict markers`);
}

assert(onboarding.includes('function OnboardingFlow'), 'onboarding.jsx must define OnboardingFlow');
assert(app.includes('OnboardingFlow'), 'app.jsx must wire OnboardingFlow');

for (const required of ['LessonMapScreen', 'LockedScreen', 'ResultScreen']) {
  assert(app.includes(required), `app.jsx must wire ${required}`);
  assert(screens.includes(required), `screens.jsx must define/export ${required}`);
}

for (const required of ['HeartsDisplay', 'FeedbackBar', 'QuestionCard']) {
  assert(ui.includes(required), `ui.jsx must define/export ${required}`);
}

console.log(`Validated ${lessons.length} lesson pack(s) and core UI exports.`);
