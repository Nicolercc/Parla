(function () {
  const { useState } = React;
  const Pip = window.Pip;
  const ActionButton = window.ActionButton;

  const LANGUAGES = [
    { id: 'es', name: 'Spanish',    learners: '34M learners', enabled: true },
    { id: 'fr', name: 'French',     learners: '17M learners', enabled: false },
    { id: 'ja', name: 'Japanese',   learners: '12M learners', enabled: false },
    { id: 'de', name: 'German',     learners: '9M learners',  enabled: false },
    { id: 'it', name: 'Italian',    learners: '7M learners',  enabled: false },
    { id: 'pt', name: 'Portuguese', learners: '5M learners',  enabled: false },
  ];

  const GOALS = [
    { id: 'casual',  label: 'Casual',  detail: '5 min / day' },
    { id: 'regular', label: 'Regular', detail: '10 min / day' },
    { id: 'serious', label: 'Serious', detail: '15 min / day' },
    { id: 'intense', label: 'Intense', detail: '20 min / day' },
  ];

  function Flag({ id }) {
    const flags = {
      es: (
        <g>
          <rect width="36" height="27" fill="#C60B1E" />
          <rect y="7" width="36" height="13" fill="#FFC400" />
        </g>
      ),
      fr: (
        <g>
          <rect width="36" height="27" fill="#fff" />
          <rect width="12" height="27" fill="#0055A4" />
          <rect x="24" width="12" height="27" fill="#EF4135" />
        </g>
      ),
      ja: (
        <g>
          <rect width="36" height="27" fill="#fff" />
          <circle cx="18" cy="13.5" r="7" fill="#BC002D" />
        </g>
      ),
      de: (
        <g>
          <rect width="36" height="9" fill="#1f1f1f" />
          <rect y="9" width="36" height="9" fill="#DD0000" />
          <rect y="18" width="36" height="9" fill="#FFCE00" />
        </g>
      ),
      it: (
        <g>
          <rect width="36" height="27" fill="#fff" />
          <rect width="12" height="27" fill="#009246" />
          <rect x="24" width="12" height="27" fill="#CE2B37" />
        </g>
      ),
      pt: (
        <g>
          <rect width="36" height="27" fill="#009C3B" />
          <path d="M18 3.5 32 13.5 18 23.5 4 13.5Z" fill="#FFDF00" />
          <circle cx="18" cy="13.5" r="5" fill="#002776" />
        </g>
      ),
    };
    return (
      <svg className="lang-flag" viewBox="0 0 36 27" width="44" height="33" aria-hidden="true">
        <defs>
          <clipPath id={'flag-clip-' + id}>
            <rect width="36" height="27" rx="5" />
          </clipPath>
        </defs>
        <g clipPath={'url(#flag-clip-' + id + ')'}>{flags[id]}</g>
        <rect width="36" height="27" rx="5" fill="none" stroke="rgba(43,42,74,.15)" strokeWidth="1.5" />
      </svg>
    );
  }

  function StepDots({ step, total }) {
    return (
      <div className="ob-dots" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={'ob-dot ' + (i === step ? 'ob-dot--on' : i < step ? 'ob-dot--done' : '')} />
        ))}
      </div>
    );
  }

  function WelcomeStep({ onContinue }) {
    return (
      <div className="screen screen--center ob-welcome">
        <Pip mood="happy" size={170} />
        <h1 className="ob-title font-display">&iexcl;Hola! I&rsquo;m Pip.</h1>
        <p className="ob-sub">
          Just 5 minutes a day is all it takes to learn a new language. Ready? Let&rsquo;s set you up.
        </p>
        <div className="ob-cta">
          <ActionButton label="Continue" onClick={onContinue} variant="green" />
        </div>
      </div>
    );
  }

  function LanguageStep({ selected, onSelect, onContinue }) {
    return (
      <div className="screen ob-step">
        <div className="ob-head">
          <h1 className="ob-title font-display">What do you want to learn?</h1>
        </div>
        <div className="ob-scroll">
          <div className="lang-grid">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                className={
                  'lang-card ' +
                  (selected === lang.id ? 'lang-card--sel ' : '') +
                  (!lang.enabled ? 'lang-card--soon' : '')
                }
                disabled={!lang.enabled}
                onClick={() => onSelect(lang.id)}
              >
                <Flag id={lang.id} />
                <span className="lang-name">{lang.name}</span>
                <span className="lang-meta">{lang.enabled ? lang.learners : 'Coming soon'}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="footer">
          <ActionButton label="Continue" onClick={onContinue} disabled={selected === null} variant="green" />
        </div>
      </div>
    );
  }

  function GoalStep({ selected, onSelect, onContinue }) {
    return (
      <div className="screen ob-step">
        <div className="ob-head">
          <h1 className="ob-title font-display">Pick a daily goal</h1>
          <p className="ob-sub">You can always change this later.</p>
        </div>
        <div className="ob-scroll">
          <div className="goal-list">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className={'goal-row ' + (selected === goal.id ? 'goal-row--sel' : '')}
                onClick={() => onSelect(goal.id)}
              >
                <span className="goal-label">{goal.label}</span>
                <span className="goal-detail">{goal.detail}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="footer">
          <ActionButton label="Start learning" onClick={onContinue} disabled={selected === null} variant="green" />
        </div>
      </div>
    );
  }

  function OnboardingFlow({ onComplete }) {
    const [step, setStep] = useState(0);
    const [language, setLanguage] = useState(null);
    const [goal, setGoal] = useState(null);

    return (
      <div className="ob">
        <StepDots step={step} total={3} />
        {step === 0 && <WelcomeStep onContinue={() => setStep(1)} />}
        {step === 1 && (
          <LanguageStep selected={language} onSelect={setLanguage} onContinue={() => setStep(2)} />
        )}
        {step === 2 && (
          <GoalStep selected={goal} onSelect={setGoal} onContinue={() => onComplete({ language, goal })} />
        )}
      </div>
    );
  }

  Object.assign(window, { OnboardingFlow });
})();
