(function () {
  const { useEffect, useMemo, useState } = React;
  const Pip = window.Pip;
  const Mascot = window.Mascot;

  function QuizMascot({ isChecked, isCorrect, selectedOption, size = 104 }) {
    if (isChecked) return <Mascot state={isCorrect ? 'correct' : 'wrong'} size={size} />;
    if (selectedOption !== null) return <Mascot state="idle" size={size} />;
    return <Mascot state="idle" size={size} />;
  }

  const CONFETTI_COLORS = ['var(--green)', 'var(--blue)', 'var(--purple)', 'var(--yellow)', 'var(--coral)'];

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

  function StatPill({ icon, value, label, tone = '' }) {
    return (
      <div className={'stat-pill ' + tone}>
        <span className="stat-icon">{icon}</span>
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    );
  }

  function MiniOffer({ account, maxHearts, refillCost, refillLabel, onTryPlus, onBuyRefill, onPractice }) {
    const canBuy = account.gems >= refillCost;
    const needsHearts = !account.isPlus && account.hearts <= 0;

    return (
      <div className={'mini-offer ' + (needsHearts ? 'mini-offer--urgent' : '')}>
        <div>
          <div className="mini-title">{account.isPlus ? 'Parla+ active' : needsHearts ? 'No hearts left' : 'Keep your run alive'}</div>
          <div className="mini-copy">
            {account.isPlus ? 'Unlimited hearts are on.' : needsHearts ? 'Wait, practice, spend gems, or start Parla+.' : 'Mistakes cost hearts. Premium removes the limit.'}
          </div>
        </div>
        {!account.isPlus && (
          <div className="mini-actions">
            <button type="button" className="mini-link" onClick={onPractice}>Practice +1</button>
            <button type="button" className="mini-link" disabled={!canBuy} onClick={onBuyRefill}>Refill {refillCost}</button>
            <button type="button" className="mini-plus" onClick={onTryPlus}>Try Plus</button>
          </div>
        )}
        {!account.isPlus && account.hearts < maxHearts && <div className="mini-timer">Next free heart {refillLabel}</div>}
      </div>
    );
  }

  function LessonMapScreen({ account, lesson, homeCopy, maxHearts, refillCost, refillLabel, onStartLesson, onTryPlus, onBuyRefill, onPractice }) {
    const locked = !account.isPlus && account.hearts <= 0;

    return (
      <div className="screen home screen-fade">
        <header className="home-top">
          <div>
            <div className="unit-kicker">{lesson.unit}</div>
            <h1 className="home-title">{homeCopy.courseTitle}</h1>
            <p className="home-tagline">{homeCopy.tagline}</p>
            <div className="home-meta">
              {homeCopy.dailyGoal && <div className="home-goal-pill">{homeCopy.dailyGoal}</div>}
              {homeCopy.levelNote && <p className="home-level-note">{homeCopy.levelNote}</p>}
            </div>
          </div>
          <Pip mood={locked ? 'sad' : 'idle'} size={68} />
        </header>

        <div className="stats-row">
          <StatPill icon="🔥" value={account.streak} label="streak" tone="tone-fire" />
          <StatPill icon="💎" value={account.gems} label="gems" tone="tone-gem" />
          <StatPill icon={account.isPlus ? '∞' : '♥'} value={account.isPlus ? 'Plus' : account.hearts + '/' + maxHearts} label="hearts" tone="tone-heart" />
        </div>

        <MiniOffer
          account={account}
          maxHearts={maxHearts}
          refillCost={refillCost}
          refillLabel={refillLabel}
          onTryPlus={onTryPlus}
          onBuyRefill={onBuyRefill}
          onPractice={onPractice}
        />

        <main className="path">
          <div className="path-line" />
          <button type="button" className="lesson-node lesson-node--active" onClick={onStartLesson}>
            <span className="node-crown">★</span>
            <span className="node-title">{lesson.title}</span>
            <span className="node-sub">{locked ? 'Unlock hearts to continue' : lesson.xp + ' XP lesson'}</span>
          </button>
          <button type="button" className="lesson-node lesson-node--locked" disabled>
            <span className="node-crown">🔒</span>
            <span className="node-title">Talk to staff</span>
            <span className="node-sub">Complete the first lesson</span>
          </button>
          <button type="button" className="lesson-node lesson-node--locked" disabled>
            <span className="node-crown">🔒</span>
            <span className="node-title">Daily review</span>
            <span className="node-sub">Personalized practice</span>
          </button>
        </main>
      </div>
    );
  }

  function Star({ on }) {
    return (
      <svg className={'rstar ' + (on ? 'rstar--on' : 'rstar--off')} viewBox="0 0 52 52" width="56" height="56">
        <path
          d="M26 3l6.9 14 15.4 2.2-11.1 10.9 2.6 15.3L26 38.1 12.2 45.4l2.6-15.3L3.7 19.2 19.1 17 26 3z"
          fill={on ? 'var(--yellow)' : '#E5E5E5'}
          stroke={on ? '#E9A800' : '#D7D7D7'}
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

  function ResultScreen({ score, total, hearts, xpEarned, gemsEarned, passed, onContinue, onPractice }) {
    const stars = starCount(score, total);
    const [shown, setShown] = useState(0);
    const didPass = passed !== undefined ? passed : score >= Math.ceil(total * 0.6);
    const copy = window.PARLA_COPY.resultCopy(didPass);

    useEffect(() => {
      setShown(0);
      const timers = [];
      for (let i = 1; i <= stars; i++) timers.push(setTimeout(() => setShown(i), 350 + i * 320));
      return () => timers.forEach(clearTimeout);
    }, [stars]);

    return (
      <div className="screen screen--center result">
        <Confetti run={didPass} />
        <div className="result-stars">
          {[0, 1, 2].map((i) => (
            <span key={i} className={'star-slot ' + (shown > i ? 'pop' : '')}>
              <Star on={i < stars} />
            </span>
          ))}
        </div>
        <div className="result-mascot">
          <Mascot state={didPass ? 'complete' : 'wrong'} size={150} />
        </div>
        <h1 className="result-title font-display">{copy.title}</h1>
        <p className="result-sub">{copy.sub}</p>
        <div className="result-scorecard">
          <div className="score-pill">
            <span className="score-num font-display">{score}<span className="score-den">/{total}</span></span>
            <span className="score-cap">Correct</span>
          </div>
          <div className="score-pill">
            <span className="score-num font-display" style={{ color: 'var(--yellow-d)' }}>+{xpEarned}</span>
            <span className="score-cap">XP</span>
          </div>
          <div className="score-pill">
            <span className="score-num font-display" style={{ color: 'var(--blue-d)' }}>+{gemsEarned}</span>
            <span className="score-cap">Gems</span>
          </div>
        </div>
        <div className="result-actions">
          <button type="button" className="btn btn--block btn--lg btn--green" onClick={onContinue}>Continue</button>
          {hearts > 0 && <button type="button" className="btn btn--block btn--ghost-action" onClick={onPractice}>Practice again</button>}
        </div>
      </div>
    );
  }

  function LockedScreen({ account, maxHearts, refillCost, refillLabel, onTryPlus, onBuyRefill, onPractice, onBack }) {
    const canBuy = account.gems >= refillCost;

    return (
      <div className="screen screen--center locked">
        <button type="button" className="close-btn locked-close" onClick={onBack} aria-label="Back to path">✕</button>
        <div className="locked-mascot">
          <Pip mood="sad" size={132} />
        </div>
        <h1 className="locked-title font-display">You’re out of hearts</h1>
        <p className="locked-sub">Pip will wait with you. Practice, spend gems, upgrade, or come back when a heart refills.</p>

        <div className="super-card">
          <div className="super-head">
            <span className="super-badge font-display">PARLA<span>+</span></span>
            <span className="super-tag">Best value</span>
          </div>
          <div className="super-title font-display">Unlimited hearts</div>
          <ul className="super-list">
            <li><span className="tick">✓</span> Make mistakes without waiting</li>
            <li><span className="tick">✓</span> Remove ads from recovery flows</li>
            <li><span className="tick">✓</span> Keep practicing after hard lessons</li>
          </ul>
          <button type="button" className="btn btn--block btn--lg btn--gold" onClick={onTryPlus}>Try Parla+ free</button>
          <div className="super-fine">7 days free, then $6.99/mo</div>
        </div>

        <div className="recovery-grid">
          <button type="button" className="recovery-card" onClick={onPractice}>
            <span className="recovery-icon">＋</span>
            <span><b>Practice</b><small>Earn 1 heart</small></span>
          </button>
          <button type="button" className="recovery-card" disabled={!canBuy} onClick={onBuyRefill}>
            <span className="recovery-icon">💎</span>
            <span><b>Refill all</b><small>{refillCost} gems · {account.gems} owned</small></span>
          </button>
        </div>

        <div className="refill-row">
          <div className="refill-timer">
            <span className="refill-cap">Free heart in</span>
            <span className="refill-clock font-display">{refillLabel}</span>
          </div>
          <div className="heart-meter">{account.hearts}/{maxHearts} hearts</div>
        </div>
      </div>
    );
  }

  Object.assign(window, {
    ResultScreen,
    LockedScreen,
    Confetti,
    Star,
    LessonMapScreen,
    QuizMascot,
  });
})();
