(function () {
  const { useState, useCallback } = React;
  const Q = window.PARLA_QUESTIONS;
  const {
    ProgressBar,
    HeartsDisplay,
    OptionButton,
    QuestionCard,
    FeedbackBar,
    ActionButton,
    ResultScreen,
    LockedScreen,
    LandingScreen,
    LanguageSelectScreen,
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
      hearts: CONFIG.maxHearts,
      gems: 520,
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
      return { ...defaultAccount(), ...JSON.parse(localStorage.getItem(STORE_KEY) || '{}') };
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

    const start = useCallback((languageId) => {
      update((current) => ({ ...current, hasStarted: true, selectedLanguage: languageId || 'es' }));
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
        const streak = current.lastPlayedDate === today
          ? current.streak
          : current.lastPlayedDate === yesterday
            ? current.streak + 1
            : 1;

        return {
          ...current,
          xp: current.xp + lesson.xp + score * 2,
          gems: current.gems + (passed ? 25 : 8),
          streak,
          completedLessons: passed ? Math.max(current.completedLessons, 1) : current.completedLessons,
          lastPlayedDate: today,
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
      start,
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

  function bubbleText({ isChecked, isCorrect, hearts }) {
    if (!isChecked && hearts <= 1) return 'Last heart. Focus.';
    if (!isChecked) return 'You got this.';
    return isCorrect ? 'Nice!' : 'Review it once.';
  }

  function QuizScreen({ q, account, economy, rootStyle, onExit }) {
    const canAct = q.selectedOption !== null;
    const recoverToPath = (action) => {
      action();
      onExit();
  function QuizScreen({ q, rootStyle }) {
    const mood = mascotMood(q);

    // Onboarding runs once per session, before the quiz (PRD section 11).
    const [profile, setProfile] = useState(null);

    const onAction = () => {
      if (q.isChecked) q.advance();
      else q.checkAnswer();
    };

    if (q.phase === 'locked') {
      return (
        <LockedScreen
          account={account}
          maxHearts={CONFIG.maxHearts}
          refillCost={CONFIG.refillCost}
          refillLabel={economy.refillLabel}
          onTryPlus={() => recoverToPath(economy.activatePlus)}
          onBuyRefill={() => recoverToPath(economy.buyRefill)}
          onPractice={() => recoverToPath(economy.earnPracticeHeart)}
          onBack={onExit}
        />
      );
    }

    if (q.phase === 'complete') {
      return (
        <ResultScreen
          score={q.score}
          total={q.total}
          hearts={account.hearts}
          xpEarned={LESSONS[0].xp + q.score * 2}
          gemsEarned={q.score >= Math.ceil(q.total * 0.6) ? 25 : 8}
          onContinue={onExit}
          onPractice={q.resetQuiz}
        />
      );
    }

    return (
      <div className="app" style={rootStyle}>
        <div className="phone">
          {profile === null ? (
            <OnboardingFlow onComplete={setProfile} />
          ) : q.phase === 'locked' ? (
            <LockedScreen onReset={q.resetQuiz} />
          ) : q.phase === 'complete' ? (
            <ResultScreen score={q.score} total={q.total} hearts={q.hearts} onReset={q.resetQuiz} />
          ) : (
            <div className="screen quiz">
              <div className="topbar">
                <button type="button" className="close-btn" onClick={q.resetQuiz} aria-label="Restart">
                  ✕
                </button>
                <ProgressBar current={q.currentIndex} total={q.total} />
                <HeartsDisplay hearts={q.hearts} maxHearts={CONFIG.maxHearts} />
              </div>
      <div className="screen quiz screen-fade" style={rootStyle}>
        <div className="topbar">
          <button type="button" className="close-btn" onClick={onExit} aria-label="Exit lesson">
            ✕
          </button>
          <ProgressBar current={q.currentIndex + 1} total={q.total} />
          <HeartsDisplay hearts={account.isPlus ? CONFIG.maxHearts : account.hearts} maxHearts={CONFIG.maxHearts} isPlus={account.isPlus} />
        </div>

        <div className="scene">
          <QuizMascot
            isChecked={q.isChecked}
            isCorrect={q.isCorrect}
            selectedOption={q.selectedOption}
            size={104}
          />
          <div className={'bubble ' + (q.isChecked ? (q.isCorrect ? 'bubble--ok' : 'bubble--no') : '')}>
            {bubbleText({ isChecked: q.isChecked, isCorrect: q.isCorrect, hearts: account.hearts })}
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

  function App() {
    const economy = useAccount();
    const { account } = economy;
    const [appPhase, setAppPhase] = useState(() => (loadAccount().hasStarted ? 'home' : 'landing'));
    const lesson = LESSONS[0];
    const q = useQuizState({ lesson, account, loseHeart: economy.loseHeart, completeLesson: economy.completeLesson });
    const rootStyle = useMemo(() => ({ '--green': CONFIG.accent.c, '--green-d': CONFIG.accent.d }), []);

    const goHome = useCallback(() => {
      q.resetQuiz();
      setAppPhase('home');
    }, [q.resetQuiz]);

    const beginLanguage = useCallback((languageId) => {
      economy.start(languageId);
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
          {appPhase === 'landing' && <LandingScreen onNext={() => setAppPhase('language')} />}
          {appPhase === 'language' && <LanguageSelectScreen onNext={beginLanguage} onBack={() => setAppPhase('landing')} />}
          {appPhase === 'home' && (
            <LessonMapScreen
              account={account}
              lesson={lesson}
              maxHearts={CONFIG.maxHearts}
              refillCost={CONFIG.refillCost}
              refillLabel={economy.refillLabel}
              onStartLesson={startLesson}
              onTryPlus={economy.activatePlus}
              onBuyRefill={economy.buyRefill}
              onPractice={economy.earnPracticeHeart}
            />
          )}
          {appPhase === 'quiz' && <QuizScreen q={q} account={account} economy={economy} rootStyle={rootStyle} onExit={goHome} />}
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
