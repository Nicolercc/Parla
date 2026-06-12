(function () {
  const LANGUAGES = [
    { id: 'es', name: 'Spanish', learners: '34M learners', enabled: true },
    { id: 'fr', name: 'French', learners: '17M learners', enabled: false },
    { id: 'ja', name: 'Japanese', learners: '12M learners', enabled: false },
    { id: 'de', name: 'German', learners: '9M learners', enabled: false },
    { id: 'it', name: 'Italian', learners: '7M learners', enabled: false },
    { id: 'pt', name: 'Portuguese', learners: '5M learners', enabled: false },
  ];

  const GOALS = [
    { id: 'casual', label: 'Casual', detail: '5 min / day', minutes: 5 },
    { id: 'regular', label: 'Regular', detail: '10 min / day', minutes: 10 },
    { id: 'serious', label: 'Serious', detail: '15 min / day', minutes: 15 },
    { id: 'intense', label: 'Intense', detail: '20 min / day', minutes: 20 },
  ];

  const SOURCES = [
    { id: 'friends', emoji: '👥', label: 'Friends / family' },
    { id: 'tiktok', emoji: '🎵', label: 'TikTok' },
    { id: 'youtube', emoji: '▶️', label: 'YouTube' },
    { id: 'instagram', emoji: '📸', label: 'Instagram' },
    { id: 'search', emoji: '🔍', label: 'Google Search' },
    { id: 'other', emoji: '✨', label: 'Other' },
  ];

  const REASONS = [
    { id: 'people', emoji: '🗣️', label: 'Connect with people' },
    { id: 'career', emoji: '💼', label: 'Boost my career' },
    { id: 'school', emoji: '🎓', label: 'Support my education' },
    { id: 'travel', emoji: '✈️', label: 'Prepare for travel' },
    { id: 'fun', emoji: '🎉', label: 'Just for fun' },
    { id: 'brain', emoji: '🧠', label: 'Train my brain' },
  ];

  const REASON_HOME_TAGLINES = {
    people: (lang) => 'Connect with people — your ' + lang + ' path starts here.',
    career: (lang) => 'Career-ready ' + lang + ' starts here.',
    school: (lang) => 'School support in ' + lang + ' starts here.',
    travel: (lang) => 'Travel-ready ' + lang + ' starts here.',
    fun: (lang) => 'Learn ' + lang + ' for the joy of it — Pip is with you.',
    brain: (lang) => 'Train your brain with daily ' + lang + '.',
  };

  const GOAL_MINUTES = { casual: 5, regular: 10, serious: 15, intense: 20 };

  const REASON_SUMMARY_LABELS = {
    people: 'Connect with people',
    career: 'Career-focused learning',
    school: 'School support',
    travel: 'Travel-ready basics',
    fun: 'Learning for fun',
    brain: 'Daily brain training',
  };

  const LEVEL_SUMMARY_LABELS = {
    new: 'Starting from scratch',
    some: 'Warming up what you know',
  };

  function languageById(id) {
    return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
  }

  function levelsFor(langName) {
    return [
      {
        id: 'new',
        emoji: '🌱',
        label: 'I’m new to ' + langName,
        detail: 'Lesson 1 is the same starter path — we’ll tailor more soon.',
      },
      {
        id: 'some',
        emoji: '📚',
        label: 'I know some ' + langName,
        detail: 'Lesson 1 reviews basics — placement tests come later.',
      },
    ];
  }

  function buildPlanSummary(profile) {
    const langId = profile.language || profile.selectedLanguage;
    const lang = languageById(langId).name;
    const goal = GOALS.find((g) => g.id === profile.dailyGoal);
    return {
      rows: [
        { key: 'language', label: lang },
        { key: 'reason', label: REASON_SUMMARY_LABELS[profile.reason] || '' },
        { key: 'level', label: LEVEL_SUMMARY_LABELS[profile.level] || '' },
        { key: 'dailyGoal', label: goal ? goal.minutes + ' min/day' : '' },
      ].filter((row) => row.label),
    };
  }

  function pipAcknowledgement(field, value, langName) {
    if (field === 'language') {
      return 'Great — I\u2019ll build your ' + langName + ' path.';
    }
    if (field === 'reason') {
      const copy = {
        travel: 'Got it. I\u2019ll keep this practical for your trip.',
        people: 'Love that. We\u2019ll focus on words you can actually use with people.',
        school: 'Got it. I\u2019ll help you build a steady foundation.',
        career: 'Nice — we\u2019ll keep it useful and clear.',
        fun: 'Fun choice. I\u2019ll keep things light and rewarding.',
        brain: 'Smart. We\u2019ll train your brain a little each day.',
      };
      return copy[value] || 'Got it. I\u2019ll shape your path around that.';
    }
    if (field === 'level') {
      if (value === 'new') return 'Perfect. We\u2019ll start from the ground up.';
      if (value === 'some') return 'Great. I\u2019ll still keep the first lesson light so we can warm up.';
      return 'Got it. I\u2019ll meet you where you are.';
    }
    if (field === 'dailyGoal') {
      const copy = {
        casual: 'Nice. Five focused minutes is a real start.',
        regular: 'Solid. Ten minutes gives us room to build momentum.',
        serious: 'Love the energy. I\u2019ll help you stay consistent.',
        intense: 'Love the energy. I\u2019ll help you stay consistent.',
      };
      return copy[value] || 'Great — we\u2019ll build from here.';
    }
    return '';
  }

  function isProfileComplete(account) {
    return !!(
      account
      && account.hasStarted
      && account.selectedLanguage
      && account.reason
      && account.dailyGoal
    );
  }

  function personalizeHome(account) {
    const lang = languageById(account.selectedLanguage).name;
    const taglineFn = account.reason && REASON_HOME_TAGLINES[account.reason];
    const tagline = taglineFn
      ? taglineFn(lang)
      : 'Finish onboarding to personalize this path with Pip.';
    const minutes = account.dailyGoal && GOAL_MINUTES[account.dailyGoal];
    const dailyGoal = minutes ? "Today's goal: " + minutes + ' min' : null;
    const levelNote = account.level === 'some'
      ? 'You told Pip you know some ' + lang + ' — lesson 1 still reviews core words.'
      : account.level === 'new'
        ? 'Starting from scratch — lesson 1 builds your foundation.'
        : null;

    return {
      courseTitle: lang + ' Foundations',
      tagline,
      dailyGoal,
      levelNote,
    };
  }

  /**
   * Pip is the named guide in onboarding/home/recovery.
   * Mascot (green blob) is Pip's in-lesson animated form — same character, lesson context.
   */
  function quizBubble({ isChecked, isCorrect, hearts }) {
    if (!isChecked && hearts <= 1) return 'Last heart — stay focused.';
    if (!isChecked) return 'You got this.';
    return isCorrect ? 'Nice work!' : 'Not quite — check the hint below.';
  }

  function resultCopy(passed) {
    if (passed) {
      return {
        title: 'Lesson complete!',
        sub: 'I marked progress on your path.',
      };
    }
    return {
      title: 'Keep going',
      sub: 'You missed the mark this time. Review the lesson and try again when you have hearts.',
    };
  }

  Object.assign(window, {
    PARLA_META: {
      LANGUAGES,
      GOALS,
      SOURCES,
      REASONS,
      languageById,
      levelsFor,
      personalizeHome,
      isProfileComplete,
      buildPlanSummary,
      pipAcknowledgement,
      GOAL_MINUTES,
    },
    PARLA_COPY: {
      quizBubble,
      resultCopy,
    },
  });
})();
