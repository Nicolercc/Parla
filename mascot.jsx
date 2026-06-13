// Pip: single SVG character for onboarding, home, quiz, and recovery.
// Mascot / QuizMascot: thin compatibility wrappers (legacy state → mood).
(function () {
  const { useEffect, useRef } = React;

  const PIP_MOUTHS = {
    happy: 'M78 120 Q100 146 122 120 Q100 132 78 120 Z',
    sad: 'M82 128 Q100 112 118 128',
    thinking: 'M88 124 Q100 131 112 124',
    idle: 'M84 122 Q100 138 116 122',
    gentleCorrection: 'M88 124 Q100 131 112 124',
    listening: 'M84 122 Q100 138 116 122',
    worried: 'M88 124 Q100 131 112 124',
  };

  const MOOD_ALIASES = {
    proud: 'celebrating',
    correct: 'happy',
    wrong: 'gentleCorrection',
    complete: 'celebrating',
  };

  function resolveMood(mood) {
    return MOOD_ALIASES[mood] || mood;
  }

  function Pip({ mood = 'idle', size = 132, color = 'var(--green)' }) {
    const ref = useRef(null);
    const resolved = resolveMood(mood);
    const happy = resolved === 'happy' || resolved === 'celebrating';
    const sad = resolved === 'sad';
    const listening = resolved === 'listening';
    const mouthKey = PIP_MOUTHS[resolved] ? resolved : 'idle';
    const mouth = PIP_MOUTHS[mouthKey];
    const showSpark = resolved === 'celebrating';
    const pupilOffset = listening ? 3 : 0;

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.classList.remove('pip-react');
      void el.offsetWidth;
      if (resolved === 'happy' || resolved === 'celebrating' || resolved === 'sad' || resolved === 'dizzy') {
        el.classList.add('pip-react');
      }
    }, [resolved]);

    return (
      <div ref={ref} className={'pip pip--' + resolved} style={{ width: size, height: size, color }} aria-hidden="true">
        <svg viewBox="0 0 200 210" width={size} height={size * (210 / 200)}>
          <ellipse className="pip-shadow" cx="100" cy="196" rx="46" ry="9" fill="rgba(43,42,74,.13)" />
          <g className="pip-body">
            <g className="pip-sprout">
              <rect x="96" y="18" width="8" height="22" rx="4" fill="var(--green-d)" />
              <path className="pip-leaf pip-leaf-l" d="M98 30 C78 22 66 30 70 46 C86 50 98 44 98 30 Z" fill={color} />
              <path className="pip-leaf pip-leaf-r" d="M102 26 C124 16 138 26 132 44 C114 48 102 40 102 26 Z" fill={color} />
            </g>
            <path
              className="pip-blob"
              d="M100 44 C146 44 168 78 168 120 C168 170 138 196 100 196 C62 196 32 170 32 120 C32 78 54 44 100 44 Z"
              fill={color}
            />
            {showSpark && (
              <g className="pip-spark" aria-hidden="true">
                <circle cx="148" cy="58" r="5" fill="var(--yellow)" />
                <circle cx="158" cy="72" r="3.5" fill="var(--blue)" />
                <circle cx="140" cy="78" r="3" fill="var(--purple)" />
              </g>
            )}
            <g className="pip-face">
              {happy ? (
                <g stroke="#2B2A4A" strokeWidth="6" strokeLinecap="round" fill="none">
                  <path d="M68 108 Q78 98 88 108" />
                  <path d="M112 108 Q122 98 132 108" />
                </g>
              ) : (
                <g className="pip-eyes">
                  <ellipse cx="78" cy="110" rx="11" ry="13" fill="#fff" />
                  <ellipse cx="122" cy="110" rx="11" ry="13" fill="#fff" />
                  <circle className="pip-pupil" cx={80 + pupilOffset} cy="112" r="6" fill="#2B2A4A" />
                  <circle className="pip-pupil" cx={124 + pupilOffset} cy="112" r="6" fill="#2B2A4A" />
                </g>
              )}
              {sad && <ellipse className="pip-tear" cx="70" cy="104" rx="5" ry="7" fill="var(--blue)" />}
              <path
                d={mouth}
                fill={happy ? '#7A1F33' : 'none'}
                stroke="#2B2A4A"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </div>
    );
  }

  const STATE_TO_MOOD = {
    idle: 'idle',
    correct: 'happy',
    wrong: 'gentleCorrection',
    complete: 'celebrating',
  };

  function Mascot({ state = 'idle', size = 132, color = 'var(--green)' }) {
    return <Pip mood={STATE_TO_MOOD[state] || 'idle'} size={size} color={color} />;
  }

  window.Mascot = Mascot;
  window.Pip = Pip;
})();
