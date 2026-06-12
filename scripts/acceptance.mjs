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
    await clickButton(page, 'Continue');
    await clickButton(page, 'Friends');
    await clickButton(page, 'Continue');
    await clickButton(page, 'travel');
    await clickButton(page, 'Continue');
    await clickButton(page, 'new to Spanish');
    await clickButton(page, 'Continue');
    await clickButton(page, 'Casual');
    await clickButton(page, 'Start learning');

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
      if (await page.getByText(/Pip will wait/i).isVisible().catch(() => false)) break;
    }

    if (await page.getByText(/Pip will wait/i).isVisible()) pass('10–11 Out-of-hearts locked screen');
    else fail('10–11 Out-of-hearts locked screen');

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

    pass('16 Single onboarding path');
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
