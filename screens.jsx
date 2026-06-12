(function () {
  const { useEffect, useMemo, useState, useRef } = React;
  const Pip = window.Pip;
  const Mascot = window.Mascot;

  function QuizMascot({ isChecked, isCorrect, selectedOption, size = 104 }) {
    if (isChecked) return <Mascot state={isCorrect ? 'correct' : 'wrong'} size={size} />;
    if (selectedOption !== null) return <Mascot state="idle" size={size} />;
    return <Mascot state="idle" size={size} />;
  }

  const CONFETTI_COLORS = ['var(--green)', 'var(--blue)', 'var(--purple)', 'var(--yellow)', 'var(--coral)'];
  const REFILL_SECONDS = 4 * 60 * 60;

  function Confetti({ run }) {
    const bits = useMemo(() => Array.from({ length: 34 }).map((_, i) => ({
      left: Math.random() * 100,
      top: 4 + Math.random() * 78,
      delay: Math.random() * 0.4,
      dur: 1.6 + Math.random() * 1.4,
      rot: Math.random() * 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: Math.random() > 0.5,
    })), [run]);

    if (!run) return null;

    return (
      <div className="confetti">
        {bits.map((b, i) => (
          <span
            key={i}
            className="confetti-bit"
            style={{
              left: b.left + '%',
              top: b.top + '%',
              background: b.color,
              animationDelay: b.delay + 's',
              animationDuration: b.dur + 's',
              borderRadius: b.round ? '50%' : '2px',
              transform: 'rotate(' + b.rot + 'deg)',
            }}
          />
        ))}
      </div>
    );
  }

  function Star({ on }) {
    return (
      <svg className={'rstar ' + (on ? 'rstar--on' : 'rstar--off')} viewBox="0 0 52 52" width="56" height="56">
        <path
          d="M26 3l6.9 14 15.4 2.2-11.1 10.9 2.6 15.3L26 38.1 12.2 45.4l2.6-15.3L3.7 19.2 19.1 17 26 3z"
          fill={on ? 'var(--yellow)' : '#E9E6F2'}
          stroke={on ? '#E9A800' : '#DAD6E6'}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  function starCount(score, total) {
    if (score >= total) return 3;
    if (score >= Math.ceil(total * 0.6)) return 2;
    return 1;
  }

  function ResultScreen({ score, total, hearts, onReset }) {
    const stars = starCount(score, total);
    const [shown, setShown] = useState(0);

    useEffect(() => {
      setShown(0);
      const timers = [];
      for (let i = 1; i <= stars; i++) {
        timers.push(setTimeout(() => setShown(i), 450 + i * 350));
      }
      return () => timers.forEach(clearTimeout);
    }, [stars]);

    const survived = hearts > 0;

    return (
      <div className="screen screen--center result">
        <Confetti run={survived} />
        <div className="result-stars">
          {[0, 1, 2].map((i) => (
            <span key={i} className={'star-slot ' + (shown > i ? 'pop' : '')}>
              <Star on={i < stars} />
            </span>
          ))}
        </div>
        <div className="result-mascot">
          <Mascot state={survived ? 'complete' : 'wrong'} size={150} />
        </div>
        <h1 className="result-title font-display">{survived ? 'Lesson complete!' : 'You made it!'}</h1>
        <p className="result-sub">
          {survived ? 'You kept your streak alive.' : 'A little bruised, but you finished. ¡Bravo!'}
        </p>
        <div className="result-scorecard">
          <div className="score-pill">
            <span className="score-num font-display">
              {score}
              <span className="score-den">/{total}</span>
            </span>
            <span className="score-cap">Correct</span>
          </div>
          <div className="score-pill">
            <span className="score-num font-display" style={{ color: 'var(--yellow-d)' }}>
              +{score * 10}
            </span>
            <span className="score-cap">XP earned</span>
          </div>
        </div>
        <button type="button" className="btn btn--block btn--lg btn--green" onClick={onReset}>
          Practice again
        </button>
      </div>
    );
  }

  function formatCountdown(totalSeconds) {
    const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const ss = String(totalSeconds % 60).padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
  }

  function LockedScreen({ onReset }) {
    const [time, setTime] = useState(REFILL_SECONDS);
    const tick = useRef(null);

    useEffect(() => {
      tick.current = setInterval(() => setTime((t) => (t > 0 ? t - 1 : 0)), 1000);
      return () => clearInterval(tick.current);
    }, []);

    return (
      <div className="screen screen--center locked">
        <div className="locked-mascot">
          <Pip mood="sad" size={138} />
        </div>
        <h1 className="locked-title font-display">You’re out of hearts!</h1>
        <p className="locked-sub">No more lives this round. Refill to keep the streak — or wait it out.</p>

        <div className="super-card">
          <div className="super-glow" />
          <div className="super-head">
            <span className="super-badge font-display">
              PARLA<span>+</span>
            </span>
            <span className="super-tag">Most popular</span>
          </div>
          <div className="super-title font-display">Unlimited hearts</div>
          <ul className="super-list">
            <li><span className="tick">✓</span> Never run out of lives</li>
            <li><span className="tick">✓</span> No waiting, no ads</li>
            <li><span className="tick">✓</span> Personalized practice</li>
          </ul>
          <button type="button" className="btn btn--block btn--lg btn--gold">Try Parla+ free</button>
          <div className="super-fine">7 days free, then $6.99/mo</div>
        </div>

        <div className="refill-row">
          <div className="refill-timer">
            <span className="refill-cap">Free hearts in</span>
            <span className="refill-clock font-display">{formatCountdown(time)}</span>
          </div>
        </div>

        <button type="button" className="locked-reset" onClick={onReset}>
          Or start over with full hearts
        </button>
      </div>
    );
  }

  const LANGUAGES = [
    { id: 'es', flag: '🇪🇸', name: 'Spanish', available: true },
    { id: 'fr', flag: '🇫🇷', name: 'French', available: false },
    { id: 'ja', flag: '🇯🇵', name: 'Japanese', available: false },
    { id: 'zh', flag: '🇨🇳', name: 'Mandarin', available: false },
    { id: 'pt', flag: '🇧🇷', name: 'Portuguese', available: false },
    { id: 'it', flag: '🇮🇹', name: 'Italian', available: false },
  ];

  function LandingScreen({ onNext }) {
    const { PillButton, GhostLink } = window;

    return (
      <div className="screen landing screen-fade">
        <div className="landing-glow" aria-hidden="true" />
        <div className="landing-body">
          <div className="landing-mascot landing-enter-mascot">
            <Mascot state="idle" size={148} />
          </div>
          <h1 className="landing-headline landing-enter-headline">
            Learn a language in minutes a day.
          </h1>
          <p className="landing-sub landing-enter-sub">Bite-sized lessons. Real progress.</p>
        </div>
        <div className="landing-actions landing-enter-cta">
          <PillButton label="Get Started" onClick={() => onNext('language')} />
          <GhostLink label="I already have an account" onClick={() => onNext('language')} />
        </div>
      </div>
    );
  }

  function LanguageSelectScreen({ onNext, onBack }) {
    const { BackButton, LanguageCard } = window;

    return (
      <div className="screen language screen-fade">
        <header className="lang-header">
          <BackButton onClick={() => onBack('landing')} />
          <h1 className="lang-title">What do you want to learn?</h1>
        </header>
        <div className="lang-grid">
          {LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang.id}
              flag={lang.flag}
              name={lang.name}
              available={lang.available}
              onSelect={() => onNext('quiz')}
            />
          ))}
        </div>
      </div>
    );
  }

  Object.assign(window, {
    ResultScreen,
    LockedScreen,
    Confetti,
    Star,
    LandingScreen,
    LanguageSelectScreen,
    QuizMascot,
  });
})();
