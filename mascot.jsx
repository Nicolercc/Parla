import React, { useEffect, useRef } from 'react';

// Pip: single SVG character for onboarding, home, quiz, and recovery.
// Mascot / QuizMascot: thin compatibility wrappers (legacy state → mood).
  let pipInstance = 0;

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
    const idRef = useRef('pip-' + (++pipInstance));
    const resolved = resolveMood(mood);
    const happy = resolved === 'happy' || resolved === 'celebrating';
    const sad = resolved === 'sad';
    const listening = resolved === 'listening';
    const detailed = size >= 120;
    const mouthKey = PIP_MOUTHS[resolved] ? resolved : 'idle';
    const mouth = PIP_MOUTHS[mouthKey];
    const showSpark = resolved === 'celebrating';
    const pupilOffset = listening ? 3 : 0;
    const furGradient = idRef.current + '-fur';
    const creamGradient = idRef.current + '-cream';

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
          <defs>
            <linearGradient id={furGradient} x1="54" y1="42" x2="150" y2="186" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#E57A3E" />
              <stop offset="0.58" stopColor="var(--panda)" />
              <stop offset="1" stopColor="var(--panda-d)" />
            </linearGradient>
            <linearGradient id={creamGradient} x1="72" y1="72" x2="126" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#FFF8E7" />
              <stop offset="1" stopColor="var(--cream)" />
            </linearGradient>
          </defs>
          <ellipse className="pip-shadow" cx="100" cy="196" rx={detailed ? 46 : 34} ry="9" fill="rgba(43,42,74,.13)" />
          <g className="pip-body">
            {detailed && (
              <g className="pip-tail" aria-hidden="true">
                <path d="M138 114 C184 102 190 154 158 174 C142 184 126 176 132 160 C138 144 166 146 164 130 C162 118 148 116 138 124 Z" fill={'url(#' + furGradient + ')'} />
                <path d="M162 120 C178 132 176 154 158 168" fill="none" stroke="#F6B05F" strokeWidth="10" strokeLinecap="round" opacity=".8" />
                <path d="M148 132 C164 140 166 156 150 169" fill="none" stroke="var(--cream)" strokeWidth="9" strokeLinecap="round" opacity=".78" />
              </g>
            )}
            {detailed && (
              <g className="pip-torso" aria-hidden="true">
                <ellipse cx="100" cy="154" rx="43" ry="38" fill={'url(#' + furGradient + ')'} />
                <ellipse cx="100" cy="162" rx="26" ry="23" fill={'url(#' + creamGradient + ')'} opacity=".95" />
                <path d="M68 151 C56 164 58 178 72 180" fill="none" stroke="var(--panda-d)" strokeWidth="12" strokeLinecap="round" opacity=".9" />
                <path d="M132 151 C144 164 142 178 128 180" fill="none" stroke="var(--panda-d)" strokeWidth="12" strokeLinecap="round" opacity=".9" />
              </g>
            )}
            <g className="pip-ears">
              <path d="M60 72 C48 42 62 26 90 50 C84 68 74 76 60 72 Z" fill="var(--panda-d)" />
              <path d="M140 72 C152 42 138 26 110 50 C116 68 126 76 140 72 Z" fill="var(--panda-d)" />
              <path d="M65 62 C61 47 68 40 82 53 C78 63 72 67 65 62 Z" fill="var(--cream)" opacity=".9" />
              <path d="M135 62 C139 47 132 40 118 53 C122 63 128 67 135 62 Z" fill="var(--cream)" opacity=".9" />
            </g>
            <path
              className="pip-head-fur"
              d="M100 48 C140 48 164 76 164 113 C164 154 137 179 100 179 C63 179 36 154 36 113 C36 76 60 48 100 48 Z"
              fill={'url(#' + furGradient + ')'}
            />
            <path
              className="pip-face-mask"
              d="M63 99 C68 75 88 70 100 86 C112 70 132 75 137 99 C146 139 126 162 100 162 C74 162 54 139 63 99 Z"
              fill={'url(#' + creamGradient + ')'}
            />
            <path d="M56 101 C63 85 76 78 90 84 C86 100 77 111 63 116 Z" fill="rgba(80,36,27,.28)" />
            <path d="M144 101 C137 85 124 78 110 84 C114 100 123 111 137 116 Z" fill="rgba(80,36,27,.28)" />
            <path d="M92 86 C96 80 104 80 108 86 C105 93 95 93 92 86 Z" fill="var(--cream)" opacity=".78" />
            {showSpark && (
              <g className="pip-spark" aria-hidden="true">
                <circle cx="148" cy="58" r="5" fill="var(--yellow)" />
                <circle cx="158" cy="72" r="3.5" fill="var(--blue)" />
                <circle cx="140" cy="78" r="3" fill="var(--purple)" />
              </g>
            )}
            <g className="pip-face">
              {happy ? (
                <g className="pip-eyes" stroke="#2B2A4A" strokeWidth="6" strokeLinecap="round" fill="none">
                  <path d="M68 108 Q78 98 88 108" />
                  <path d="M112 108 Q122 98 132 108" />
                </g>
              ) : (
                <g className="pip-eyes">
                  <ellipse cx="78" cy="110" rx="11" ry="13" fill="#fff" />
                  <ellipse cx="122" cy="110" rx="11" ry="13" fill="#fff" />
                  <circle className="pip-pupil" cx={80 + pupilOffset} cy="112" r="6" fill="#2B2A4A" />
                  <circle className="pip-pupil" cx={124 + pupilOffset} cy="112" r="6" fill="#2B2A4A" />
                  <circle cx={82 + pupilOffset} cy="109" r="2" fill="#fff" />
                  <circle cx={126 + pupilOffset} cy="109" r="2" fill="#fff" />
                </g>
              )}
              {sad && <ellipse className="pip-tear" cx="70" cy="104" rx="5" ry="7" fill="var(--blue)" />}
              <path d="M94 116 Q100 112 106 116 Q104 123 100 124 Q96 123 94 116 Z" fill="#2B2A4A" />
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
