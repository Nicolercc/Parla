(function () {
  const { useState } = React;
  const Pip = window.Pip;
  const ActionButton = window.ActionButton;
  const BackButton = window.BackButton;
  const { LANGUAGES, GOALS, SOURCES, REASONS, levelsFor } = window.PARLA_META;

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

  function ObNav({ showBack, onBack }) {
    if (!showBack) return <div className="ob-nav ob-nav--spacer" aria-hidden="true" />;
    return (
      <div className="ob-nav">
        <BackButton onClick={onBack} label="Back to previous step" showLabel />
      </div>
    );
  }

  function WelcomeStep({ onContinue }) {
    return (
      <div className="screen screen--center ob-welcome">
        <Pip mood="happy" size={170} />
        <h1 className="ob-title font-display">Hi, I&rsquo;m Pip.</h1>
        <p className="ob-sub">
          A few minutes a day is enough to build a language habit. Let&rsquo;s personalize your path.
        </p>
        <div className="ob-cta">
          <ActionButton label="Continue" onClick={onContinue} variant="green" />
        </div>
      </div>
    );
  }

  function LanguageStep({ selected, onSelect, onContinue, onBack }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
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

  function SurveyStep({ title, sub, options, selected, onSelect, onContinue, onBack, cta }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
        <div className="ob-head">
          <h1 className="ob-title font-display">{title}</h1>
          {sub && <p className="ob-sub">{sub}</p>}
        </div>
        <div className="ob-scroll">
          <div className="goal-list">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={'goal-row ' + (selected === opt.id ? 'goal-row--sel' : '')}
                onClick={() => onSelect(opt.id)}
              >
                {opt.emoji && <span className="row-emoji" aria-hidden="true">{opt.emoji}</span>}
                <span className="row-text">
                  <span className="goal-label">{opt.label}</span>
                  {opt.detail && <span className="row-detail">{opt.detail}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="footer">
          <ActionButton label={cta || 'Continue'} onClick={onContinue} disabled={selected === null} variant="green" />
        </div>
      </div>
    );
  }

  function GoalStep({ selected, onSelect, onContinue, onBack }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
        <div className="ob-head">
          <h1 className="ob-title font-display">Pick a daily goal</h1>
          <p className="ob-sub">Pip will remind you on your home path. You can change this later.</p>
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
                <span className="row-text">
                  <span className="goal-label">{goal.label}</span>
                  <span className="goal-detail">{goal.detail}</span>
                </span>
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

  function OnboardingFlow({ onComplete, initialProfile = {} }) {
    const [step, setStep] = useState(0);
    const [language, setLanguage] = useState(initialProfile.language || initialProfile.selectedLanguage || null);
    const [source, setSource] = useState(initialProfile.source || null);
    const [reason, setReason] = useState(initialProfile.reason || null);
    const [level, setLevel] = useState(initialProfile.level || null);
    const [goal, setGoal] = useState(initialProfile.dailyGoal || initialProfile.goal || null);

    const langName = language ? LANGUAGES.find((l) => l.id === language).name : '';
    const goBack = () => setStep((s) => Math.max(0, s - 1));

    return (
      <div className="ob">
        <StepDots step={step} total={6} />
        {step === 0 && <WelcomeStep onContinue={() => setStep(1)} />}
        {step === 1 && (
          <LanguageStep
            selected={language}
            onSelect={setLanguage}
            onContinue={() => setStep(2)}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <SurveyStep
            title="How did you hear about Parla?"
            options={SOURCES}
            selected={source}
            onSelect={setSource}
            onContinue={() => setStep(3)}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <SurveyStep
            title={'Why are you learning ' + langName + '?'}
            options={REASONS}
            selected={reason}
            onSelect={setReason}
            onContinue={() => setStep(4)}
            onBack={goBack}
          />
        )}
        {step === 4 && (
          <SurveyStep
            title={'Where are you in your ' + langName + ' studies?'}
            sub="We use this to personalize your home screen. Lesson 1 is the same starter path for now."
            options={levelsFor(langName)}
            selected={level}
            onSelect={setLevel}
            onContinue={() => setStep(5)}
            onBack={goBack}
          />
        )}
        {step === 5 && (
          <GoalStep
            selected={goal}
            onSelect={setGoal}
            onContinue={() => onComplete({ language, source, reason, level, dailyGoal: goal })}
            onBack={goBack}
          />
        )}
      </div>
    );
  }

  Object.assign(window, { OnboardingFlow });
})();
