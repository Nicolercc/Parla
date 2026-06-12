(function () {
  const Pip = window.Pip;

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
            <Pip mood="idle" size={148} />
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
    OnboardingLandingScreen: LandingScreen,
    OnboardingLanguageSelectScreen: LanguageSelectScreen,
  });
})();
