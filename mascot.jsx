// Pip: named guide in onboarding, home, and locked recovery (mood-based).
// Mascot: Pip's in-lesson animated form (state-based: idle/correct/wrong/complete).
(function () {
  const { useEffect, useRef } = React;

  const MASCOT_CSS = [
    '.mascot{display:inline-block;line-height:0}',
    '.mascot svg{overflow:visible}',
    '.mascot--idle{animation:mascot-float 3s ease-in-out infinite}',
    '@keyframes mascot-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
    '.mascot--correct.mascot-react{animation:mascot-bounce .5s cubic-bezier(.36,.07,.19,.97)}',
    '@keyframes mascot-bounce{0%,100%{transform:scale(1)}30%{transform:scale(1.18)}60%{transform:scale(.93)}}',
    '.mascot--wrong.mascot-react{animation:mascot-shake .45s cubic-bezier(.36,.07,.19,.97)}',
    '@keyframes mascot-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}60%{transform:translateX(8px)}80%{transform:translateX(-4px)}}',
    '.mascot--complete{animation:mascot-pulse 1.8s ease-in-out infinite}',
    '@keyframes mascot-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}',
  ].join('');

  function ensureMascotStyles() {
    if (document.getElementById('mascot-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'mascot-keyframes';
    style.textContent = MASCOT_CSS;
    document.head.appendChild(style);
  }

  const MOUTHS = {
    correct: 'M78 120 Q100 146 122 120 Q100 132 78 120 Z',
    wrong: 'M82 128 Q100 112 118 128',
    idle: 'M84 122 Q100 138 116 122',
    complete: 'M78 120 Q100 146 122 120 Q100 132 78 120 Z',
  };

  function Mascot({ state = 'idle', size = 132, color = 'var(--green)' }) {
    const ref = useRef(null);

    useEffect(() => {
      ensureMascotStyles();
    }, []);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.classList.remove('mascot-react');
      void el.offsetWidth;
      if (state === 'correct' || state === 'wrong') {
        el.classList.add('mascot-react');
      }
    }, [state]);

    const happy = state === 'correct' || state === 'complete';
    const sad = state === 'wrong';
    const mouth = happy ? MOUTHS.correct : sad ? MOUTHS.wrong : MOUTHS.idle;

  // TODO: replace with @rive-app/react-canvas

    return (
      <div ref={ref} className={'mascot mascot--' + state} style={{ width: size, height: size, color }} aria-hidden="true">
        <svg viewBox="0 0 200 210" width={size} height={size * (210 / 200)}>
          <ellipse cx="100" cy="196" rx="46" ry="9" fill="rgba(43,42,74,.13)" />
          <g>
            <rect x="96" y="18" width="8" height="22" rx="4" fill="var(--green-d)" />
            <path d="M98 30 C78 22 66 30 70 46 C86 50 98 44 98 30 Z" fill={color} />
            <path d="M102 26 C124 16 138 26 132 44 C114 48 102 40 102 26 Z" fill={color} />
            <path
              d="M100 44 C146 44 168 78 168 120 C168 170 138 196 100 196 C62 196 32 170 32 120 C32 78 54 44 100 44 Z"
              fill={color}
            />
            <ellipse cx="100" cy="138" rx="40" ry="44" fill="rgba(255,255,255,.32)" />
            {happy && (
              <g stroke="#2B2A4A" strokeWidth="6" strokeLinecap="round" fill="none">
                <path d="M68 108 Q78 98 88 108" />
                <path d="M112 108 Q122 98 132 108" />
              </g>
            )}
            {!happy && (
              <g>
                <ellipse cx="78" cy="110" rx="11" ry="13" fill="#fff" />
                <ellipse cx="122" cy="110" rx="11" ry="13" fill="#fff" />
                <circle cx="80" cy="112" r="6" fill="#2B2A4A" />
                <circle cx="124" cy="112" r="6" fill="#2B2A4A" />
              </g>
            )}
            {sad && <ellipse cx="70" cy="104" rx="5" ry="7" fill="var(--blue)" />}
            <path
              d={mouth}
              fill={happy ? '#7A1F33' : 'none'}
              stroke="#2B2A4A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>
    );
  }

  const PIP_MOUTHS = {
    happy: 'M78 120 Q100 146 122 120 Q100 132 78 120 Z',
    sad: 'M82 128 Q100 112 118 128',
    thinking: 'M88 124 Q100 131 112 124',
    idle: 'M84 122 Q100 138 116 122',
  };

  function Pip({ mood = 'idle', size = 132, color = 'var(--green)' }) {
    const ref = useRef(null);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      el.classList.remove('pip-react');
      void el.offsetWidth;
      if (mood === 'happy' || mood === 'sad' || mood === 'dizzy') {
        el.classList.add('pip-react');
      }
    }, [mood]);

    const happy = mood === 'happy';
    const sad = mood === 'sad';
    const dizzy = mood === 'dizzy';
    const thinking = mood === 'thinking';
    const mouth = happy ? PIP_MOUTHS.happy : sad || dizzy ? PIP_MOUTHS.sad : thinking ? PIP_MOUTHS.thinking : PIP_MOUTHS.idle;

    return (
      <div ref={ref} className={'pip pip--' + mood} style={{ width: size, height: size, color }} aria-hidden="true">
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
                  <circle cx="80" cy="112" r="6" fill="#2B2A4A" />
                  <circle cx="124" cy="112" r="6" fill="#2B2A4A" />
                </g>
              )}
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

  window.Mascot = Mascot;
  window.Pip = Pip;
})();
