(function () {
  const { useEffect, useRef } = React;

  const MOUTHS = {
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
    const mouth = happy ? MOUTHS.happy : sad || dizzy ? MOUTHS.sad : thinking ? MOUTHS.thinking : MOUTHS.idle;

    return (
      <div ref={ref} className={'pip pip--' + mood} style={{ width: size, height: size, color }} aria-hidden="true">
        <svg viewBox="0 0 200 210" width={size} height={size * (210 / 200)}>
          <ellipse className="pip-shadow" cx="100" cy="196" rx="46" ry="9" fill="rgba(43,42,74,.13)" />

          <g className="pip-accents">
            {happy && (
              <g className="pip-spark">
                <path d="M40 44 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 z" fill="var(--yellow)" />
                <path d="M158 60 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="var(--blue)" />
                <circle cx="150" cy="30" r="4" fill="var(--purple)" />
              </g>
            )}
            {sad && <ellipse className="pip-tear" cx="70" cy="104" rx="5" ry="7" fill="var(--blue)" />}
            {dizzy && (
              <g className="pip-swirl">
                <circle cx="64" cy="40" r="3.5" fill="var(--purple)" />
                <circle cx="100" cy="30" r="3.5" fill="var(--yellow)" />
                <circle cx="136" cy="40" r="3.5" fill="var(--coral)" />
              </g>
            )}
          </g>

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
            <ellipse cx="100" cy="138" rx="40" ry="44" fill="rgba(255,255,255,.32)" />
            <ellipse className="pip-arm pip-arm-l" cx="34" cy="128" rx="11" ry="15" fill={color} />
            <ellipse className="pip-arm pip-arm-r" cx="166" cy="128" rx="11" ry="15" fill={color} />
            <ellipse cx="78" cy="192" rx="15" ry="9" fill="var(--green-d)" />
            <ellipse cx="122" cy="192" rx="15" ry="9" fill="var(--green-d)" />

            <g className="pip-face" transform={thinking ? 'rotate(-6 100 116)' : ''}>
              {happy ? (
                <g stroke="#2B2A4A" strokeWidth="6" strokeLinecap="round" fill="none">
                  <path d="M68 108 Q78 98 88 108" />
                  <path d="M112 108 Q122 98 132 108" />
                </g>
              ) : dizzy ? (
                <g stroke="#2B2A4A" strokeWidth="5" strokeLinecap="round" fill="none">
                  <path d="M70 102 L86 116 M86 102 L70 116" />
                  <path d="M114 102 L130 116 M130 102 L114 116" />
                </g>
              ) : (
                <g className="pip-eyes">
                  <ellipse cx="78" cy="110" rx="11" ry="13" fill="#fff" />
                  <ellipse cx="122" cy="110" rx="11" ry="13" fill="#fff" />
                  <circle className="pip-pupil" cx="80" cy="112" r="6" fill="#2B2A4A" />
                  <circle className="pip-pupil" cx="124" cy="112" r="6" fill="#2B2A4A" />
                  <circle cx="83" cy="109" r="2" fill="#fff" />
                  <circle cx="127" cy="109" r="2" fill="#fff" />
                  <rect className="pip-lid" x="66" y="95" width="24" height="0" rx="3" fill={color} />
                  <rect className="pip-lid" x="110" y="95" width="24" height="0" rx="3" fill={color} />
                </g>
              )}
              <circle cx="58" cy="128" r="8" fill="rgba(255,90,122,.4)" />
              <circle cx="142" cy="128" r="8" fill="rgba(255,90,122,.4)" />
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

  window.Pip = Pip;
})();
