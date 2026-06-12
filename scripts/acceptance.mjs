/**
 * Headless acceptance checks for first-session spine.
 * Run: npm run dev (or serve -l 3456) then npm run acceptance
 */
import { chromium } from 'playwright';

const BASE = process.env.PARLA_URL || 'http://localhost:3456';
const STORE_KEY = 'parla.account.v2';

const results = [];
const pass = (n, d = '') => { results.push({ ok: true, n, d }); console.log('✓', n, d ? `— ${d}` : ''); };
const fail = (n, d = '') => { results.push({ ok: false, n, d }); console.error('✗', n, d ? `— ${d}` : ''); };

async function clickButton(page, name) {
  await page.getByRole('button', { name, exact: false }).first().click();
}

async function assertCheck16SingleOnboardingPath(page) {
  const legacyAccount = await page.getByRole('button', { name: /already have an account/i }).count();
  if (legacyAccount === 0) pass('16c no fake account CTA');
  else fail('16c no fake account CTA', 'legacy CTA still in DOM');

  const legacyLanding = await page.locator('.landing-headline, .landing-actions').count();
  if (legacyLanding === 0) pass('16d no legacy landing screen DOM');
  else fail('16d no legacy landing screen DOM', String(legacyLanding));

  const legacyLangScreen = await page.locator('.language.screen, .lang-header .lang-title').count();
  if (legacyLangScreen === 0) pass('16e no legacy language-select screen DOM');
  else fail('16e no legacy language-select screen DOM', String(legacyLangScreen));

  await page.evaluate((k) => {
    const acc = JSON.parse(localStorage.getItem(k) || '{}');
    acc.hasStarted = true;
    acc.selectedLanguage = 'es';
    acc.source = 'friends';
    acc.level = 'new';
    acc.dailyGoal = 'casual';
    acc.reason = null;
    localStorage.setItem(k, JSON.stringify(acc));
  }, STORE_KEY);
  await page.reload({ waitUntil: 'networkidle' });

  const onIncompleteOb = await page.locator('.ob').isVisible().catch(() => false);
  const onIncompleteHome = await page.locator('.home').isVisible().catch(() => false);
  if (onIncompleteOb && !onIncompleteHome) pass('16f incomplete profile → onboarding (not home)');
  else fail('16f incomplete profile → onboarding', `ob=${onIncompleteOb} home=${onIncompleteHome}`);

  await page.evaluate((k) => {
    localStorage.setItem(k, JSON.stringify({
      hasStarted: true,
      selectedLanguage: 'es',
      source: 'friends',
      reason: 'travel',
      level: 'new',
      dailyGoal: 'casual',
      hearts: 3,
      gems: 120,
      xp: 0,
      streak: 0,
      completedLessons: 0,
      isPlus: false,
      lastHeartAt: null,
      lastPlayedDate: null,
    }));
  }, STORE_KEY);
  await page.reload({ waitUntil: 'networkidle' });

  const onCompleteHome = await page.locator('.home').isVisible().catch(() => false);
  const onCompleteOb = await page.locator('.ob').isVisible().catch(() => false);
  if (onCompleteHome && !onCompleteOb) pass('16g complete profile → home (skips onboarding)');
  else fail('16g complete profile → home', `home=${onCompleteHome} ob=${onCompleteOb}`);

  await page.evaluate((k) => localStorage.removeItem(k), STORE_KEY);
  await page.reload({ waitUntil: 'networkidle' });
  const freshOb = await page.locator('.ob').isVisible().catch(() => false);
  const freshHome = await page.locator('.home').isVisible().catch(() => false);
  if (freshOb && !freshHome) pass('16h fresh localStorage → onboarding only');
  else fail('16h fresh localStorage → onboarding only', `ob=${freshOb} home=${freshHome}`);
}

async function answerWrong(page) {
  const n = await page.locator('.opt').count();
  for (let i = 0; i < n; i++) {
    await page.locator('.opt').nth(i).click();
    await page.getByRole('button', { name: 'Check' }).click();
    const title = await page.locator('.feedback-title').textContent().catch(() => '');
    if (/Good try/i.test(title)) return title;
    if (/Correct/i.test(title) && i < n - 1) {
      await page.getByRole('button', { name: 'Continue' }).click();
      return answerWrong(page);
    }
  }
  return '';
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.evaluate((k) => localStorage.removeItem(k), STORE_KEY);
    await page.reload({ waitUntil: 'networkidle' });

    const greeting = await page.locator('h1').first().textContent();
    if (/Hi, I/i.test(greeting) && !/^¡?Hola/i.test(greeting?.trim())) pass('1 Neutral greeting', greeting?.trim());
    else fail('1 Neutral greeting', greeting);

    await clickButton(page, 'Continue');
    await clickButton(page, 'Spanish');
    const ackSpanish = await page.locator('.ob-pip-ack').textContent().catch(() => '');
    if (/build your Spanish path/i.test(ackSpanish)) pass('3 Pip acknowledges Spanish', ackSpanish.trim());
    else fail('3 Pip acknowledges Spanish', ackSpanish || 'no ack');
    await clickButton(page, 'Continue');
    await clickButton(page, 'Friends');
    await clickButton(page, 'Continue');
    await clickButton(page, 'travel');
    const ackTravel = await page.locator('.ob-pip-ack').textContent().catch(() => '');
    if (/practical for your trip/i.test(ackTravel)) pass('4 Pip acknowledges travel', ackTravel.trim());
    else fail('4 Pip acknowledges travel', ackTravel || 'no ack');
    const travelSelected = await page.getByRole('button', { name: /Prepare for travel/i }).evaluate((el) => el.classList.contains('goal-row--sel'));
    if (travelSelected) pass('16b reason selection before back');
    else fail('16b reason selection before back', 'travel row not selected');
    await page.getByRole('button', { name: 'Back' }).first().click();
    await clickButton(page, 'Continue');
    const travelStillSelected = await page.getByRole('button', { name: /Prepare for travel/i }).evaluate((el) => el.classList.contains('goal-row--sel'));
    if (travelStillSelected) pass('16a back navigation preserves reason choice');
    else fail('16a back navigation preserves reason choice', 'travel row lost selection after back');
    await clickButton(page, 'Continue');
    const staleTravelAck = await page.locator('.ob-pip-ack').count();
    if (staleTravelAck === 0) pass('4b level step hides travel ack until level selected');
    else {
      const staleText = await page.locator('.ob-pip-ack').textContent();
      if (!/trip/i.test(staleText || '')) pass('4b level step hides travel ack until level selected');
      else fail('4b level step hides travel ack until level selected', staleText);
    }
    await clickButton(page, 'new to Spanish');
    const ackLevel = await page.locator('.ob-pip-ack').textContent().catch(() => '');
    if (/ground up/i.test(ackLevel)) pass('7 Pip acknowledges beginner level', ackLevel.trim());
    else fail('7 Pip acknowledges beginner level', ackLevel || 'no ack');
    await clickButton(page, 'Continue');
    await clickButton(page, 'Casual');
    const ackGoal = await page.locator('.ob-pip-ack').textContent().catch(() => '');
    if (/Five focused minutes/i.test(ackGoal)) pass('9 Pip acknowledges casual goal', ackGoal.trim());
    else fail('9 Pip acknowledges casual goal', ackGoal || 'no ack');
    await clickButton(page, 'Continue');

    await page.waitForSelector('text=Your plan is ready');
    pass('10 Plan Summary screen appears');

    const summaryText = await page.locator('.ob-summary').innerText();
    const summaryChecks = [
      ['Spanish', /Spanish/i.test(summaryText)],
      ['travel', /Travel-ready basics/i.test(summaryText)],
      ['beginner', /Starting from scratch/i.test(summaryText)],
      ['5 min/day', /5 min\/day/i.test(summaryText)],
    ];
    for (const [label, ok] of summaryChecks) {
      if (ok) pass(`11 Summary shows ${label}`);
      else fail(`11 Summary shows ${label}`, summaryText.slice(0, 120));
    }

    await page.getByRole('button', { name: 'Back' }).first().click();
    const casualStillSelected = await page.getByRole('button', { name: /Casual/i }).evaluate((el) => el.classList.contains('goal-row--sel'));
    if (casualStillSelected) pass('12 Back from summary preserves daily goal');
    else fail('12 Back from summary preserves daily goal');
    await clickButton(page, 'Continue');
    await page.waitForSelector('text=Your plan is ready');
    await clickButton(page, 'Start my first lesson');

    const stored = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}'), STORE_KEY);
    for (const [field, val] of Object.entries({
      selectedLanguage: 'es', source: 'friends', reason: 'travel', level: 'new', dailyGoal: 'casual',
    })) {
      if (stored[field] === val) pass(`5 localStorage.${field}`, val);
      else fail(`5 localStorage.${field}`, `got ${stored[field]}`);
    }

    await page.waitForSelector('text=Travel-ready');
    pass('6 Home reason tagline');

    const goalText = await page.locator('.home-goal-pill').textContent();
    if (/5/.test(goalText)) pass('6 Daily goal pill', goalText.trim());
    else fail('6 Daily goal pill', goalText);

    await page.locator('.lesson-node--active').click();
    await page.waitForSelector('text=Check');
    pass('7 Lesson started');

    const correctIdx = await page.evaluate(() => window.PARLA_LESSONS[0].questions[0].correctIndex);
    await page.locator('.opt').nth(correctIdx).click();
    await page.getByRole('button', { name: 'Check' }).click();
    if (/Correct/i.test(await page.locator('.feedback-title').textContent())) pass('8 Correct feedback');
    else fail('8 Correct feedback');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.waitForTimeout(120);
    const flicker = await page.locator('.feedback--no').count();
    if (flicker === 0) pass('9 No wrong-feedback flicker after correct Continue');
    else fail('9 No wrong-feedback flicker', String(flicker));

    let sawGoodTry = false;
    for (let i = 0; i < 5; i++) {
      const fb = await answerWrong(page);
      if (/Good try/i.test(fb)) sawGoodTry = true;
      await page.getByRole('button', { name: 'Continue' }).click().catch(() => {});
      if (await page.locator('.locked-title').isVisible().catch(() => false)) break;
    }

    const lockedTitle = await page.locator('.locked-title').textContent().catch(() => '');
    if (/out of hearts/i.test(lockedTitle || '')) pass('10–11 Out-of-hearts locked screen');
    else fail('10–11 Out-of-hearts locked screen', lockedTitle || 'title not found');

    if (sawGoodTry) pass('10 Feedback before lock');
    else fail('10 Feedback before lock');

    await page.getByRole('button', { name: /Practice/i }).first().click();
    await page.waitForSelector('.lesson-node--active');
    pass('11 Practice recovery returns home');

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('text=Travel-ready');
    if (!(await page.getByText("Hi, I'm Pip").isVisible().catch(() => false))) pass('12–13 Refresh skips onboarding');
    else fail('12–13 Refresh skips onboarding');

    if (!pageErrors.length) pass('14–15 No page errors');
    else fail('14–15 Page errors', pageErrors.join('; '));

    await assertCheck16SingleOnboardingPath(page);
  } catch (e) {
    fail('Acceptance run', e.message);
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
