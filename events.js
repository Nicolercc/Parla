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
    window: { kind: 'fixed', startsInDays: 2, durationDays: 3 },
  },
];

const DAY_MS = 86400000;

// --- Metric -> account counters ----------------------------------------------
function eventMetricValue(account, event) {
  const metric = event.metric;
  if (metric === 'correctAnswers') return account.correctAnswersTotal || 0;
  if (metric === 'lessonsCompleted') return account.lessonsCompletedTotal || 0;
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
    const startsAt = startOfLocalDay(now) + (w.startsInDays || 0) * DAY_MS;
    const endsAt = startsAt + (w.durationDays || 1) * DAY_MS;
    if (now < startsAt) return { timed: true, phase: 'upcoming', startsAt, endsAt, capLabel: 'Opens in', remainingSec: secondsUntil(startsAt, now) };
    if (now <= endsAt) return { timed: true, phase: 'open', endsAt, capLabel: 'Ends in', remainingSec: secondsUntil(endsAt, now) };
    return { timed: true, phase: 'closed', endsAt, capLabel: 'Ended', remainingSec: 0 };
  }

  return { timed: false, phase: 'open' };
}

// --- Card view-model (pure) --------------------------------------------------
function isClaimed(account, key) {
  return (account.claimedEvents || []).includes(key);
}

function eventView(account, event, now) {
  const schedule = eventSchedule(now, event);
  const open = schedule.phase === 'open';
  const value = eventMetricValue(account, event);

  if (event.tiers) {
    const maxAt = event.tiers[event.tiers.length - 1].at;
    const tiers = event.tiers.map((tier) => {
      const reached = value >= tier.at;
      const claimed = isClaimed(account, event.id + '#' + tier.at);
      return {
        at: tier.at,
        medal: tier.medal,
        reward: tier.reward,
        claimKey: event.id + '#' + tier.at,
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
  const claimed = isClaimed(account, event.id);
  return {
    tiered: false,
    current,
    target: event.target,
    pct: Math.round((current / event.target) * 100),
    complete,
    claimed,
    claimKey: event.id,
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

window.PARLA_EVENT_UTILS = { eventMetricValue, eventView, anyEventClaimable, eventSchedule };
