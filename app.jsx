(function () {
  const { useState, useCallback, useEffect, useMemo } = React;
  const LESSONS = window.PARLA_LESSONS;
  const OnboardingFlow = window.OnboardingFlow;
  const { personalizeHome, isProfileComplete } = window.PARLA_META;
  const { quizBubble } = window.PARLA_COPY;
  const {
    ProgressBar,
    HeartsDisplay,
    OptionButton,
    QuestionCard,
    FeedbackBar,
    ActionButton,
    ResultScreen,
    LockedScreen,
    LessonMapScreen,
    QuizMascot,
  } = window;

  const CONFIG = {
    maxHearts: 5,
    refillSeconds: 4 * 60 * 60,
    refillCost: 350,
    practiceReward: 1,
    practiceGems: 15,
    accent: { c: '#58CC02', d: '#46A302' },
  };

  const STORE_KEY = 'parla.account.v2';
  const DAY_MS = 24 * 60 * 60 * 1000;

  function todayKey(time = Date.now()) {
    return new Date(time).toISOString().slice(0, 10);
  }

  function defaultAccount() {
    return {
      hasStarted: false,
      selectedLanguage: null,
      source: null,
      reason: null,
      level: null,
      dailyGoal: null,
      hearts: CONFIG.maxHearts,
      gems: 120,
      xp: 0,
      streak: 0,
      completedLessons: 0,
      isPlus: false,
      lastHeartAt: null,
      lastPlayedDate: null,
    };
  }

  function loadAccount() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      return { ...defaultAccount(), ...stored };
    } catch (error) {
      return defaultAccount();
    }
  }

  function applyHeartRefills(account, now = Date.now()) {
    if (account.isPlus) {
      return { ...account, hearts: CONFIG.maxHearts, lastHeartAt: null };
    }

    if (account.hearts >= CONFIG.maxHearts) {
      return { ...account, hearts: CONFIG.maxHearts, lastHeartAt: null };
    }

    if (!account.lastHeartAt) return account;

    const elapsed = Math.max(0, now - account.lastHeartAt);
    const earned = Math.floor(elapsed / (CONFIG.refillSeconds * 1000));
    if (earned <= 0) return account;

    const hearts = Math.min(CONFIG.maxHearts, account.hearts + earned);
    const lastHeartAt = hearts >= CONFIG.maxHearts
      ? null
      : account.lastHeartAt + earned * CONFIG.refillSeconds * 1000;

    return { ...account, hearts, lastHeartAt };
  }

  function secondsToNextHeart(account, now = Date.now()) {
    if (account.isPlus || account.hearts >= CONFIG.maxHearts || !account.lastHeartAt) return 0;
    const nextAt = account.lastHeartAt + CONFIG.refillSeconds * 1000;
    return Math.max(0, Math.ceil((nextAt - now) / 1000));
  }

  function formatCountdown(totalSeconds) {
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  function useAccount() {
    const [account, setAccount] = useState(() => applyHeartRefills(loadAccount()));
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
      localStorage.setItem(STORE_KEY, JSON.stringify(account));
    }, [account]);

    useEffect(() => {
      const timer = setInterval(() => {
        setNow(Date.now());
        setAccount((current) => applyHeartRefills(current));
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    const update = useCallback((recipe) => {
      setAccount((current) => applyHeartRefills(recipe(applyHeartRefills(current))));
    }, []);

    const completeOnboarding = useCallback((profile) => {
      update((current) => ({
        ...current,
        hasStarted: true,
        selectedLanguage: profile.language || profile.selectedLanguage || 'es',
        source: profile.source || null,
        reason: profile.reason || null,
        level: profile.level || null,
        dailyGoal: profile.dailyGoal || profile.goal || null,
      }));
    }, [update]);

    const loseHeart = useCallback(() => {
      update((current) => {
        if (current.isPlus) return { ...current, hearts: CONFIG.maxHearts, lastHeartAt: null };
        const hearts = Math.max(0, current.hearts - 1);
        return {
          ...current,
          hearts,
          lastHeartAt: hearts < CONFIG.maxHearts && !current.lastHeartAt ? Date.now() : current.lastHeartAt,
        };
      });
    }, [update]);

    const completeLesson = useCallback((lesson, score) => {
      const passed = score >= Math.ceil(lesson.questions.length * 0.6);
      update((current) => {
        const today = todayKey();
        const yesterday = todayKey(Date.now() - DAY_MS);
        let streak = current.streak;
        let lastPlayedDate = current.lastPlayedDate;

        if (passed) {
          streak = current.lastPlayedDate === today
            ? current.streak
            : current.lastPlayedDate === yesterday
              ? current.streak + 1
              : 1;
          lastPlayedDate = today;
        }

        return {
          ...current,
          xp: current.xp + (passed ? lesson.xp + score * 2 : score),
          gems: current.gems + (passed ? 25 : 5),
          streak,
          completedLessons: passed ? Math.max(current.completedLessons, 1) : current.completedLessons,
          lastPlayedDate,
        };
      });
    }, [update]);

    const buyRefill = useCallback(() => {
      update((current) => {
        if (current.gems < CONFIG.refillCost) return current;
        return { ...current, gems: current.gems - CONFIG.refillCost, hearts: CONFIG.maxHearts, lastHeartAt: null };
      });
    }, [update]);

    const earnPracticeHeart = useCallback(() => {
      update((current) => ({
        ...current,
        hearts: Math.min(CONFIG.maxHearts, current.hearts + CONFIG.practiceReward),
        gems: current.gems + CONFIG.practiceGems,
        lastHeartAt: current.hearts + CONFIG.practiceReward >= CONFIG.maxHearts ? null : current.lastHeartAt,
      }));
    }, [update]);

    const activatePlus = useCallback(() => {
      update((current) => ({ ...current, isPlus: true, hearts: CONFIG.maxHearts, lastHeartAt: null }));
    }, [update]);

    return {
      account,
      now,
      completeOnboarding,
      loseHeart,
      completeLesson,
      buyRefill,
      earnPracticeHeart,
      activatePlus,
      refillLabel: formatCountdown(secondsToNextHeart(account, now)),
    };
  }

  function useQuizState({ lesson, account, loseHeart, completeLesson }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [phase, setPhase] = useState('quiz');
    const [pendingLock, setPendingLock] = useState(false);
    const [wasCompleted, setWasCompleted] = useState(false);

    const questions = lesson.questions;
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctIndex;

    const resetQuiz = useCallback(() => {
      setCurrentIndex(0);
      setScore(0);
      setSelectedOption(null);
      setIsChecked(false);
      setPendingLock(false);
      setWasCompleted(false);
      setPhase('quiz');
    }, []);

    const lockQuiz = useCallback(() => {
      setSelectedOption(null);
      setIsChecked(false);
      setPendingLock(false);
      setPhase('locked');
    }, []);

    const selectOption = useCallback((i) => {
      if (!isChecked) setSelectedOption(i);
    }, [isChecked]);

    const checkAnswer = useCallback(() => {
      if (isChecked || selectedOption === null) return;
      setIsChecked(true);
      if (selectedOption === currentQuestion.correctIndex) {
        setScore((s) => s + 1);
        return;
      }

      const shouldLock = !account.isPlus && account.hearts <= 1;
      loseHeart();
      setPendingLock(shouldLock);
    }, [account.hearts, account.isPlus, currentQuestion, isChecked, loseHeart, selectedOption]);

    const finish = useCallback((finalScore) => {
      if (!wasCompleted) {
        completeLesson(lesson, finalScore);
        setWasCompleted(true);
      }
      setPhase('complete');
    }, [completeLesson, lesson, wasCompleted]);

    const advance = useCallback(() => {
      if (pendingLock) {
        setPendingLock(false);
        setPhase('locked');
        return;
      }
      if (currentIndex + 1 >= questions.length) {
        finish(score);
        return;
      }
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecked(false);
    }, [currentIndex, finish, pendingLock, questions.length, score]);

    return {
      currentIndex,
      score,
      selectedOption,
      isChecked,
      phase,
      currentQuestion,
      isCorrect,
      total: questions.length,
      selectOption,
      checkAnswer,
      advance,
      resetQuiz,
      lockQuiz,
    };
  }

  function lessonRewards(lesson, score, total) {
    const passed = score >= Math.ceil(total * 0.6);
    return {
      passed,
      xpEarned: passed ? lesson.xp + score * 2 : score,
      gemsEarned: passed ? 25 : 5,
    };
  }

  function QuizScreen({ q, account, economy, lesson, rootStyle, onExit }) {
    const canAct = q.selectedOption !== null;

    const recoverAndExit = (action) => {
      action();
      onExit();
    };

    if (q.phase === 'locked') {
      return (
        <LockedScreen
          account={account}
          maxHearts={CONFIG.maxHearts}
          refillCost={CONFIG.refillCost}
          refillLabel={economy.refillLabel}
          onTryPlus={() => recoverAndExit(economy.activatePlus)}
          onBuyRefill={() => recoverAndExit(economy.buyRefill)}
          onPractice={() => recoverAndExit(economy.earnPracticeHeart)}
          onBack={onExit}
        />
      );
    }

    if (q.phase === 'complete') {
      const rewards = lessonRewards(lesson, q.score, q.total);
      return (
        <ResultScreen
          score={q.score}
          total={q.total}
          hearts={account.hearts}
          passed={rewards.passed}
          xpEarned={rewards.xpEarned}
          gemsEarned={rewards.gemsEarned}
          onContinue={onExit}
          onPractice={q.resetQuiz}
        />
      );
    }

    return (
      <div className="screen quiz screen-fade" style={rootStyle}>
        <div className="topbar">
          <button type="button" className="close-btn" onClick={onExit} aria-label="Exit lesson">
            ✕
          </button>
          <ProgressBar current={q.currentIndex + 1} total={q.total} />
          <HeartsDisplay
            hearts={account.isPlus ? CONFIG.maxHearts : account.hearts}
            maxHearts={CONFIG.maxHearts}
            isPlus={account.isPlus}
          />
        </div>

        <div className="scene">
          <QuizMascot
            isChecked={q.isChecked}
            isCorrect={q.isCorrect}
            selectedOption={q.selectedOption}
            size={104}
          />
          <div className={'bubble ' + (q.isChecked ? (q.isCorrect ? 'bubble--ok' : 'bubble--no') : '')}>
            {quizBubble({ isChecked: q.isChecked, isCorrect: q.isCorrect, hearts: account.hearts })}
          </div>
        </div>

        <div className="quiz-scroll" key={q.currentIndex}>
          <QuestionCard instruction={q.currentQuestion.instruction} prompt={q.currentQuestion.prompt}>
            {q.currentQuestion.options.map((opt, i) => (
              <OptionButton
                key={opt}
                label={opt}
                index={i}
                isSelected={q.selectedOption === i}
                isChecked={q.isChecked}
                isCorrect={q.isCorrect}
                isAnswer={i === q.currentQuestion.correctIndex}
                onClick={() => q.selectOption(i)}
              />
            ))}
          </QuestionCard>
        </div>

        {!q.isChecked && (
          <div className="footer">
            <ActionButton label="Check" onClick={q.checkAnswer} disabled={!canAct} variant="green" />
          </div>
        )}

        <FeedbackBar
          isVisible={q.isChecked}
          isCorrect={q.isCorrect}
          correctAnswer={q.currentQuestion.options[q.currentQuestion.correctIndex]}
          explanation={q.currentQuestion.explain}
          onContinue={q.advance}
        />
      </div>
    );
  }

  function initialPhase() {
    const acc = loadAccount();
    if (!isProfileComplete(acc)) return 'onboarding';
    return 'home';
  }

  function App() {
    const economy = useAccount();
    const { account } = economy;
    const [appPhase, setAppPhase] = useState(initialPhase);
    const lesson = LESSONS[0];
    const homeCopy = useMemo(() => personalizeHome(account), [account]);
    const q = useQuizState({
      lesson,
      account,
      loseHeart: economy.loseHeart,
      completeLesson: economy.completeLesson,
    });
    const rootStyle = useMemo(() => ({ '--green': CONFIG.accent.c, '--green-d': CONFIG.accent.d }), []);

    const goHome = useCallback(() => {
      q.resetQuiz();
      setAppPhase('home');
    }, [q.resetQuiz]);

    const finishOnboarding = useCallback((profile) => {
      economy.completeOnboarding(profile);
      setAppPhase('home');
    }, [economy]);

    const startLesson = useCallback(() => {
      q.resetQuiz();
      if (!account.isPlus && account.hearts <= 0) {
        q.lockQuiz();
        setAppPhase('quiz');
        return;
      }
      setAppPhase('quiz');
    }, [account.hearts, account.isPlus, q.lockQuiz, q.resetQuiz]);

    return (
      <div className="app">
        <div className={'phone' + (appPhase === 'quiz' ? ' phone--quiz' : '')}>
          {appPhase === 'onboarding' && (
            <OnboardingFlow
              initialProfile={account}
              onComplete={finishOnboarding}
            />
          )}
          {appPhase === 'home' && (
            <LessonMapScreen
              account={account}
              lesson={lesson}
              homeCopy={homeCopy}
              maxHearts={CONFIG.maxHearts}
              refillCost={CONFIG.refillCost}
              refillLabel={economy.refillLabel}
              onStartLesson={startLesson}
              onTryPlus={economy.activatePlus}
              onBuyRefill={economy.buyRefill}
              onPractice={economy.earnPracticeHeart}
            />
          )}
          {appPhase === 'quiz' && (
            <QuizScreen
              q={q}
              account={account}
              economy={economy}
              lesson={lesson}
              rootStyle={rootStyle}
              onExit={goHome}
            />
          )}
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
