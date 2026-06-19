// Event Tab data + pure progress/schedule helpers (PRD 11.3).
// Loaded before components in main.jsx; validated by npm run test.
// Rewards are hardcoded for the MVP — claiming grants real economy effects
// where cheap (gems, heart refill, temporary unlimited hearts, streak saver).

window.PARLA_EVENTS = [
  {
    id: 'daily-warmup',
    kind: 'standard',
    icon: '🎯',
    title: 'Daily Warm-up',
    description: 'Answer 5 questions correctly.',
    metric: 'correctAnswers',
    target: 5,
    reward: { type: 'gems', amount: 40, label: '+40 gems' },
    window: { kind: 'daily' },
  },
  {
    id: 'accuracy-ladder',
    kind: 'standard',
    icon: '🎖️',
    title: 'Accuracy Ladder',
    description: 'Rack up correct answers to climb the ladder.',
    metric: 'correctAnswers',
    tiers: [
      { at: 3, medal: '🥉', reward: { type: 'gems', amount: 20, label: '+20 gems' } },
      { at: 8, medal: '🥈', reward: { type: 'gems', amount: 60, label: '+60 gems' } },
      { at: 15, medal: '🥇', reward: { type: 'hearts', label: 'Full hearts' } },
    ],
  },
  {
    id: 'weekend-travel-sprint',
    kind: 'special',
    featured: true,
    theme: 'travel',
    icon: '✈️',
    badge: 'Special',
    title: 'Weekend Travel Sprint',
    description: 'Score 3 in the Travel phrase pack.',
    metric: 'lessonScore',
    lessonId: 'travel-1',
    target: 3,
    reward: { type: 'unlimited', days: 1, label: 'Unlimited hearts · 1 day' },
    window: { kind: 'weekend' },
  },
  {
    id: 'summer-fiesta',
    kind: 'special',
    theme: 'fiesta',
    icon: '🎉',
    badge: 'Holiday',
    title: 'Summer Fiesta',
    description: 'A limited holiday challenge — protect your streak.',
    metric: 'lessonsCompleted',
    target: 1,
    reward: { type: 'shield', label: 'Streak Saver' },
    window: { kind: 'fixed', startDate: '2026-06-21', durationDays: 3 },
  },
];

const DAY_MS = 86400000;

// --- Metric -> account counters ----------------------------------------------
function eventDateKey(now = Date.now()) {
  const d = new Date(now);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dailyProgressFor(account, now) {
  return ((account.dailyProgress || {})[eventDateKey(now)] || {});
}

function eventMetricValue(account, event, now = Date.now()) {
  const metric = event.metric;
  const daily = event.window && event.window.kind === 'daily';
  const progress = daily ? dailyProgressFor(account, now) : null;

  if (metric === 'correctAnswers') return daily ? (progress.correctAnswers || 0) : (account.correctAnswersTotal || 0);
  if (metric === 'lessonsCompleted') return daily ? (progress.lessonsCompleted || 0) : (account.lessonsCompletedTotal || 0);
  if (metric === 'lessonScore') return (account.lessonResults || {})[event.lessonId] || 0;
  return 0;
}

// --- Time windows ------------------------------------------------------------
function startOfLocalDay(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
function endOfLocalDay(now) {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
function endOfNextSunday(now) {
  const d = new Date(now);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
function nextFridayStart(now) {
  const d = new Date(now);
  let add = (5 - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function currentFridayStart(now) {
  const d = new Date(now);
  const day = d.getDay();
  const subtract = day === 0 ? 2 : Math.max(0, day - 5);
  d.setDate(d.getDate() - subtract);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function localDateStart(dateKey) {
  const [yyyy, mm, dd] = String(dateKey || '').split('-').map(Number);
  if (!yyyy || !mm || !dd) return NaN;
  return new Date(yyyy, mm - 1, dd).getTime();
}

function secondsUntil(target, now) {
  return Math.max(0, Math.ceil((target - now) / 1000));
}

// Schedule view-model: phase 'open' | 'upcoming' | 'closed', plus a live countdown.
function eventSchedule(now, event) {
  const w = event.window;
  if (!w) return { timed: false, phase: 'open' };

  if (w.kind === 'daily') {
    const endsAt = endOfLocalDay(now);
    return { timed: true, phase: 'open', endsAt, capLabel: 'Ends in', remainingSec: secondsUntil(endsAt, now) };
  }

  if (w.kind === 'weekend') {
    const day = new Date(now).getDay(); // 0 Sun … 6 Sat
    if (day === 5 || day === 6 || day === 0) {
      const endsAt = endOfNextSunday(now);
      return { timed: true, phase: 'open', endsAt, capLabel: 'Ends in', remainingSec: secondsUntil(endsAt, now) };
    }
    const startsAt = nextFridayStart(now);
    return { timed: true, phase: 'upcoming', startsAt, capLabel: 'Opens in', remainingSec: secondsUntil(startsAt, now) };
  }

  if (w.kind === 'fixed') {
    const startsAt = Number.isFinite(w.startsAt)
      ? w.startsAt
      : localDateStart(w.startDate);
    const endsAt = startsAt + (w.durationDays || 1) * DAY_MS;
    if (now < startsAt) return { timed: true, phase: 'upcoming', startsAt, endsAt, capLabel: 'Opens in', remainingSec: secondsUntil(startsAt, now) };
    if (now <= endsAt) return { timed: true, phase: 'open', endsAt, capLabel: 'Ends in', remainingSec: secondsUntil(endsAt, now) };
    return { timed: true, phase: 'closed', endsAt, capLabel: 'Ended', remainingSec: 0 };
  }

  return { timed: false, phase: 'open' };
}

function eventWindowKey(event, now) {
  const w = event.window;
  if (!w) return '';
  if (w.kind === 'daily') return eventDateKey(now);
  if (w.kind === 'weekend') return eventDateKey(currentFridayStart(now));
  if (w.kind === 'fixed') return w.startDate || eventDateKey(w.startsAt);
  return '';
}

function eventClaimKey(event, now, suffix) {
  const parts = [event.id];
  if (suffix) parts.push(String(suffix));
  const windowKey = eventWindowKey(event, now);
  if (windowKey) parts.push(windowKey);
  return parts.join('#');
}

// --- Card view-model (pure) --------------------------------------------------
function isClaimed(account, key) {
  return (account.claimedEvents || []).includes(key);
}

function eventView(account, event, now) {
  const schedule = eventSchedule(now, event);
  const open = schedule.phase === 'open';
  const value = eventMetricValue(account, event, now);

  if (event.tiers) {
    const maxAt = event.tiers[event.tiers.length - 1].at;
    const tiers = event.tiers.map((tier) => {
      const reached = value >= tier.at;
      const claimKey = eventClaimKey(event, now, tier.at);
      const claimed = isClaimed(account, claimKey);
      return {
        at: tier.at,
        medal: tier.medal,
        reward: tier.reward,
        claimKey,
        reached,
        claimed,
        claimable: reached && !claimed && open,
      };
    });
    return {
      tiered: true,
      value,
      maxAt,
      pct: Math.min(100, Math.round((value / maxAt) * 100)),
      tiers,
      anyClaimable: tiers.some((t) => t.claimable),
      schedule,
      open,
    };
  }

  const current = Math.min(value, event.target);
  const complete = value >= event.target;
  const claimKey = eventClaimKey(event, now);
  const claimed = isClaimed(account, claimKey);
  return {
    tiered: false,
    current,
    target: event.target,
    pct: Math.round((current / event.target) * 100),
    complete,
    claimed,
    claimKey,
    claimable: complete && !claimed && open,
    schedule,
    open,
    playable: !!event.lessonId && !complete && open,
  };
}

function anyEventClaimable(account, now) {
  return window.PARLA_EVENTS.some((event) => {
    const view = eventView(account, event, now);
    return view.tiered ? view.anyClaimable : view.claimable;
  });
}

window.PARLA_EVENT_UTILS = { eventMetricValue, eventView, anyEventClaimable, eventSchedule, eventDateKey, eventClaimKey };
