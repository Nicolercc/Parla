(function () {
  const { useState, useCallback } = React;
  const Q = window.PARLA_QUESTIONS;
  const { Pip, ProgressBar, HeartsDisplay, OptionButton, QuestionCard, FeedbackBar, ActionButton, ResultScreen, LockedScreen, OnboardingFlow } = window;

  const CONFIG = {
    maxHearts: 3,
    showMascot: true,
    optionColumns: 2,
    accent: { c: '#3DDC84', d: '#22B567' },
  };

  function useQuizState(maxHearts) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [hearts, setHearts] = useState(maxHearts);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isChecked, setIsChecked] = useState(false);
    const [phase, setPhase] = useState('quiz');

    const currentQuestion = Q[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctIndex;

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
      setHearts((h) => {
        const next = h - 1;
        if (next <= 0) setPhase('locked');
        return next;
      });
    }, [isChecked, selectedOption, currentQuestion]);

    const advance = useCallback(() => {
      if (phase === 'locked') return;
      if (currentIndex + 1 >= Q.length) {
        setPhase('complete');
        return;
      }
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsChecked(false);
    }, [currentIndex, phase]);

    const resetQuiz = useCallback(() => {
      setCurrentIndex(0);
      setScore(0);
      setHearts(maxHearts);
      setSelectedOption(null);
      setIsChecked(false);
      setPhase('quiz');
    }, [maxHearts]);

    return {
      currentIndex,
      score,
      hearts,
      selectedOption,
      isChecked,
      phase,
      currentQuestion,
      isCorrect,
      total: Q.length,
      selectOption,
      checkAnswer,
      advance,
      resetQuiz,
    };
  }

  function mascotMood({ isChecked, isCorrect, selectedOption }) {
    if (isChecked) return isCorrect ? 'happy' : 'sad';
    if (selectedOption !== null) return 'thinking';
    return 'idle';
  }

  function bubbleText({ isChecked, isCorrect }) {
    if (!isChecked) return '¿Cómo se dice…?';
    return isCorrect ? '¡Sí! Perfecto.' : '¡Uy! Casi.';
  }

  function App() {
    const q = useQuizState(CONFIG.maxHearts);
    const mood = mascotMood(q);
    const rootStyle = { '--green': CONFIG.accent.c, '--green-d': CONFIG.accent.d, '--opt-cols': CONFIG.optionColumns };

    // Onboarding runs once per session, before the quiz (PRD section 11).
    const [profile, setProfile] = useState(null);

    const onAction = () => {
      if (q.isChecked) q.advance();
      else q.checkAnswer();
    };

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

              {CONFIG.showMascot && (
                <div className="scene">
                  <Pip mood={mood} size={108} />
                  <div className={'bubble ' + (q.isChecked ? (q.isCorrect ? 'bubble--ok' : 'bubble--no') : '')}>
                    {bubbleText({ isChecked: q.isChecked, isCorrect: q.isCorrect })}
                  </div>
                </div>
              )}

              <div className="quiz-scroll" key={q.currentIndex}>
                <QuestionCard hint={q.currentQuestion.hint} prompt={q.currentQuestion.prompt}>
                  {q.currentQuestion.options.map((opt, i) => (
                    <OptionButton
                      key={i}
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
                  <ActionButton
                    label={q.isChecked ? 'Continue' : 'Check'}
                    onClick={onAction}
                    disabled={!q.isChecked && q.selectedOption === null}
                    variant="green"
                  />
                </div>
              )}

              <FeedbackBar
                isVisible={q.isChecked}
                isCorrect={q.isCorrect}
                correctAnswer={q.currentQuestion.options[q.currentQuestion.correctIndex]}
                onContinue={q.advance}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
