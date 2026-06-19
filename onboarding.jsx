import React, { useState, useMemo } from 'react';

const Pip = window.Pip;
const ActionButton = window.ActionButton;
const BackButton = window.BackButton;
  const {
    LANGUAGES,
    GOALS,
    SOURCES,
    REASONS,
    levelsFor,
    buildPlanSummary,
    pipAcknowledgement,
  } = window.PARLA_META;

  const TOTAL_STEPS = 7;

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

  function PipAck({ message }) {
    if (!message) return null;
    return (
      <p className="ob-pip-ack" role="status">
        {message}
      </p>
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

  function LanguageStep({ selected, onSelect, onContinue, onBack, ack }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
        <div className="ob-head">
          <h1 className="ob-title font-display">What do you want to learn?</h1>
          <PipAck message={ack} />
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

  function SurveyStep({ title, sub, options, selected, onSelect, onContinue, onBack, cta, ack }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
        <div className="ob-head">
          <h1 className="ob-title font-display">{title}</h1>
          {sub && (
            <p className="ob-sub">{sub}</p>
          )}
          <PipAck message={ack} />
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
                {opt.emoji && (
                  <span className="row-emoji" aria-hidden="true">{opt.emoji}</span>
                )}
                <span className="row-text">
                  <span className="goal-label">{opt.label}</span>
                  {opt.detail && (
                    <span className="row-detail">{opt.detail}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="footer">
          <ActionButton
            label={cta ? cta : 'Continue'}
            onClick={onContinue}
            disabled={selected === null}
            variant="green"
          />
        </div>
      </div>
    );
  }

  function GoalStep({ selected, onSelect, onContinue, onBack, ack }) {
    return (
      <div className="screen ob-step">
        <ObNav showBack onBack={onBack} />
        <div className="ob-head">
          <h1 className="ob-title font-display">Pick a daily goal</h1>
          <p className="ob-sub">I&rsquo;ll remind you on your home path. You can change this later.</p>
          <PipAck message={ack} />
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
          <ActionButton label="Continue" onClick={onContinue} disabled={selected === null} variant="green" />
        </div>
      </div>
    );
  }

  function PlanSummaryStep({ summary, onContinue, onBack }) {
    return (
      <div className="screen screen--center ob-step ob-summary">
        <ObNav showBack onBack={onBack} />
        <div className="ob-summary-body">
          <Pip mood="happy" size={140} />
          <p className="ob-pip-bubble">I wrote it down. Let&rsquo;s start with one quick lesson.</p>
          <h1 className="ob-title font-display">Your plan is ready</h1>
          <ul className="plan-summary-list" aria-label="Your personalized plan">
            {summary.rows.map((row) => (
              <li key={row.key} className="plan-summary-row">
                {row.label}
              </li>
            ))}
          </ul>
        </div>
        <div className="footer">
          <ActionButton label="Start my first lesson" onClick={onContinue} variant="green" />
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

    const summary = useMemo(() => buildPlanSummary({ language, reason, level, dailyGoal: goal }), [language, reason, level, goal]);

    const stepAck = useMemo(() => {
      if (step === 1 && language) {
        return pipAcknowledgement('language', language, langName);
      }
      if (step === 3 && reason) {
        return pipAcknowledgement('reason', reason, langName);
      }
      if (step === 4 && level) {
        return pipAcknowledgement('level', level, langName);
      }
      if (step === 5 && goal) {
        return pipAcknowledgement('dailyGoal', goal, langName);
      }
      return '';
    }, [step, language, reason, level, goal, langName]);

    const finish = () => onComplete({ language, source, reason, level, dailyGoal: goal });

    return (
      <div className="ob">
        <StepDots step={step} total={TOTAL_STEPS} />
        {step === 0 && <WelcomeStep onContinue={() => setStep(1)} />}
        {step === 1 && (
          <LanguageStep
            selected={language}
            onSelect={setLanguage}
            onContinue={() => setStep(2)}
            onBack={goBack}
            ack={stepAck}
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
            ack={stepAck}
          />
        )}
        {step === 4 && (
          <SurveyStep
            title={'Where are you in your ' + langName + ' studies?'}
            sub="I use this to personalize your home screen. Lesson 1 is the same starter path for now."
            options={levelsFor(langName)}
            selected={level}
            onSelect={setLevel}
            onContinue={() => setStep(5)}
            onBack={goBack}
            ack={stepAck}
          />
        )}
        {step === 5 && (
          <GoalStep
            selected={goal}
            onSelect={setGoal}
            onContinue={() => setStep(6)}
            onBack={goBack}
            ack={stepAck}
          />
        )}
        {step === 6 && (
          <PlanSummaryStep
            summary={summary}
            onContinue={finish}
            onBack={goBack}
          />
        )}
      </div>
    );
  }

Object.assign(window, { OnboardingFlow });
