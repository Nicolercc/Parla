(function () {
  const { useState, useEffect, useRef } = React;

  const OPTION_KEYS = ['A', 'B', 'C', 'D'];

  function Heart({ filled, broken, gradientId = 'hg' }) {
    return (
      <svg
        className={'heart ' + (filled ? 'heart--on' : 'heart--off') + (broken ? ' heart--break' : '')}
        viewBox="0 0 32 30"
        width="30"
        height="28"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF7E97" />
            <stop offset="1" stopColor="#FF3D63" />
          </linearGradient>
        </defs>
        <path
          d="M16 28C16 28 2 19.5 2 10.4 2 5.5 5.8 2 10 2c2.6 0 4.8 1.3 6 3.3C17.2 3.3 19.4 2 22 2c4.2 0 8 3.5 8 8.4C30 19.5 16 28 16 28Z"
          fill={filled ? 'url(#' + gradientId + ')' : '#30363D'}
          stroke={filled ? '#E5274C' : '#484F58'}
          strokeWidth="1.5"
        />
        {filled && (
          <path
            d="M10 7c-1.8.2-3.2 1.6-3.4 3.4"
            stroke="rgba(255,255,255,.7)"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    );
  }

  function ProgressBar({ current, total }) {
    const raw = total > 0 ? (current / total) * 100 : 0;
    const pct = current > 0 ? Math.max(4, Math.min(100, raw)) : 0;
    return (
      <div className="progress" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
        <div className="progress-fill" style={{ width: pct + '%' }}>
          <span className="progress-shine" />
        </div>
      </div>
    );
  }

  function HeartsDisplay({ hearts, maxHearts = 5, isPlus = false }) {
    const prev = useRef(hearts);
    const [pulse, setPulse] = useState(false);

    useEffect(() => {
      if (hearts < prev.current) {
        setPulse(true);
        const t = setTimeout(() => setPulse(false), 480);
        prev.current = hearts;
        return () => clearTimeout(t);
      }
      prev.current = hearts;
    }, [hearts]);

    return (
      <div className={'hearts ' + (pulse ? 'hearts--lost' : '') + (isPlus ? ' hearts--plus' : '')}>
        {isPlus ? (
          <span className="plus-heart">∞</span>
        ) : (
          Array.from({ length: maxHearts }).map((_, i) => (
            <Heart key={i} gradientId={'hg-' + i} filled={i < hearts} broken={i === hearts && pulse} />
          ))
        )}
      </div>
    );
  }

  function getOptionState({ isSelected, isChecked, isCorrect, isAnswer }) {
    if (!isChecked) return isSelected ? 'sel' : 'idle';
    if (isSelected && isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'wrong';
    if (isAnswer) return 'reveal';
    return 'dim';
  }

  function OptionButton({ label, index, isSelected, isChecked, isCorrect, isAnswer, onClick }) {
    const state = getOptionState({ isSelected, isChecked, isCorrect, isAnswer });
    return (
      <button type="button" className={'opt opt--' + state} disabled={isChecked} onClick={onClick}>
        <span className="opt-key">{OPTION_KEYS[index]}</span>
        <span className="opt-label">{label}</span>
        {state === 'correct' && <span className="opt-mark opt-mark--ok">✓</span>}
        {state === 'wrong' && <span className="opt-mark opt-mark--no">✕</span>}
      </button>
    );
  }

  function QuestionCard({ hint, instruction, prompt, children }) {
    return (
      <div className="qcard">
        <div className="qcard-label">{instruction || hint}</div>
        <h1 className="qcard-prompt font-display">
          <span className="qcard-quote">“</span>
          {prompt}
          <span className="qcard-quote">”</span>
        </h1>
        <div className="opt-grid">{children}</div>
      </div>
    );
  }

  function FeedbackBar({ isVisible, isCorrect, correctAnswer, explanation, onContinue }) {
    if (!isVisible) return null;

    const tone = isCorrect ? 'feedback--ok' : 'feedback--no';

    return (
      <div className={'feedback feedback--in ' + tone}>
        <div className="feedback-inner">
          <div className="feedback-row">
            <span className={'feedback-badge ' + (isCorrect ? 'fb-ok' : 'fb-no')}>{isCorrect ? '✓' : '✕'}</span>
            <div className="feedback-text">
              <div className="feedback-title font-display">{isCorrect ? 'Correct' : 'Good try'}</div>
              <div className="feedback-sub">
                {isCorrect ? (explanation || 'Nice work — keep going.') : <span>Correct answer: <b>{correctAnswer}</b>. {explanation}</span>}
              </div>
            </div>
          </div>
          <button type="button" className={'btn btn--block ' + (isCorrect ? 'btn--green' : 'btn--coral')} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  function ActionButton({ label, onClick, disabled, variant = 'green' }) {
    return (
      <button
        type="button"
        className={'btn btn--block btn--lg ' + (disabled ? 'btn--ghost' : 'btn--' + variant)}
        disabled={disabled}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }

  function BackButton({ onClick, label = 'Back', showLabel = false }) {
    return (
      <button type="button" className={'back-btn' + (showLabel ? ' back-btn--labeled' : '')} onClick={onClick} aria-label={label}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {showLabel && <span className="back-label">Back</span>}
      </button>
    );
  }

  function PillButton({ label, onClick, variant = 'green' }) {
    return (
      <button type="button" className={'btn-pill btn-pill--' + variant} onClick={onClick}>
        {label}
      </button>
    );
  }

  function GhostLink({ label, onClick }) {
    return (
      <button type="button" className="link-ghost" onClick={onClick}>
        {label}
      </button>
    );
  }

  function LanguageCard({ flag, name, available, onSelect }) {
    return (
      <button
        type="button"
        className={'lang-card' + (available ? '' : ' lang-card--disabled')}
        disabled={!available}
        onClick={onSelect}
      >
        {!available && <span className="lang-badge">Coming soon</span>}
        <span className="lang-flag">{flag}</span>
        <span className="lang-name">{name}</span>
      </button>
    );
  }

  Object.assign(window, {
    Heart,
    ProgressBar,
    HeartsDisplay,
    OptionButton,
    QuestionCard,
    FeedbackBar,
    ActionButton,
    BackButton,
    PillButton,
    GhostLink,
    LanguageCard,
  });
})();
