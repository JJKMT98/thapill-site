// Pilly — thaPill mascot. Semi-transparent neon green capsule with stick limbs.
// Exposes window.Pilly with SVG variants and placement helpers.
(function () {
  const NEON = '#5BFF7F';
  const BODY_FILL = 'rgba(91,255,127,0.22)';
  const DARK = '#222';

  // Body + legs + feet (drawn first — legs behind body)
  const LEGS = `
    <path d="M 122,260 L 113,288 L 108,315" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 178,260 L 187,288 L 192,315" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="103" cy="319" rx="13" ry="6" fill="${NEON}"/>
    <ellipse cx="197" cy="319" rx="13" ry="6" fill="${NEON}"/>
  `;

  const BODY = (fill = BODY_FILL) => `
    <path d="M 85,132 A 65,65 0 0,1 215,132 L 215,202 A 65,65 0 0,1 85,202 Z"
      fill="${fill}" stroke="${DARK}" stroke-width="5" stroke-linejoin="round"/>
  `;

  const FACE_DEFAULT = `
    <line x1="114" y1="134" x2="134" y2="131" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="166" y1="131" x2="186" y2="134" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="125" cy="148" r="8" fill="${DARK}"/>
    <circle cx="128" cy="145" r="2.8" fill="white"/>
    <circle cx="175" cy="148" r="8" fill="${DARK}"/>
    <circle cx="178" cy="145" r="2.8" fill="white"/>
    <path d="M 138 188 Q 150 196, 162 188" stroke="${DARK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  `;

  const FACE_HAPPY = `
    <line x1="112" y1="133" x2="136" y2="130" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="164" y1="130" x2="188" y2="133" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M 115 149 Q 125 138, 135 149" stroke="${DARK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M 165 149 Q 175 138, 185 149" stroke="${DARK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <path d="M 128 185 Q 150 205, 172 185" stroke="${DARK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  `;

  const FACE_SIDE = `
    <line x1="124" y1="132" x2="144" y2="134" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="176" y1="134" x2="196" y2="130" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="135" cy="148" r="8" fill="${DARK}"/>
    <circle cx="138" cy="145" r="2.8" fill="white"/>
    <circle cx="185" cy="148" r="8" fill="${DARK}"/>
    <circle cx="188" cy="145" r="2.8" fill="white"/>
    <line x1="140" y1="190" x2="162" y2="190" stroke="${DARK}" stroke-width="3.5" stroke-linecap="round"/>
  `;

  const FACE_SURPRISED = `
    <line x1="112" y1="128" x2="136" y2="126" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="164" y1="126" x2="188" y2="128" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="125" cy="146" r="11" fill="${DARK}"/>
    <circle cx="129" cy="142" r="3.5" fill="white"/>
    <circle cx="175" cy="146" r="11" fill="${DARK}"/>
    <circle cx="179" cy="142" r="3.5" fill="white"/>
    <ellipse cx="150" cy="190" rx="10" ry="10" fill="none" stroke="${DARK}" stroke-width="3.5"/>
  `;

  const FACE_DETERMINED = `
    <line x1="112" y1="136" x2="134" y2="130" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <line x1="166" y1="130" x2="188" y2="136" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="125" cy="148" r="8" fill="${DARK}"/>
    <circle cx="128" cy="145" r="2.8" fill="white"/>
    <circle cx="175" cy="148" r="8" fill="${DARK}"/>
    <circle cx="178" cy="145" r="2.8" fill="white"/>
    <line x1="138" y1="190" x2="162" y2="190" stroke="${DARK}" stroke-width="3.5" stroke-linecap="round"/>
  `;

  const ARMS_DEFAULT = `
    <path d="M 85,165 L 60,180 L 45,208" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 215,165 L 240,180 L 255,208" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  const ARMS_UP = `
    <path d="M 85,150 L 55,125 L 35,95" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 215,150 L 245,125 L 265,95" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  const ARMS_WIDE = `
    <path d="M 85,150 L 48,140 L 22,152" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 215,150 L 252,140 L 278,152" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  const ARMS_DROOPY = `
    <path d="M 85,185 L 55,210 L 38,240" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 215,185 L 245,210 L 262,240" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  const WAVE_ARM = `
    <path d="M 85,165 L 60,180 L 45,208" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <g>
      <path d="M 215,145 L 248,118 L 260,88" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="260" y1="88" x2="268" y2="74" stroke="${NEON}" stroke-width="5" stroke-linecap="round"/>
      <line x1="260" y1="88" x2="274" y2="86" stroke="${NEON}" stroke-width="5" stroke-linecap="round"/>
      <line x1="260" y1="88" x2="271" y2="97" stroke="${NEON}" stroke-width="5" stroke-linecap="round"/>
      <animateTransform attributeName="transform" type="rotate" values="0 215 145;-8 215 145;8 215 145;0 215 145" dur="0.7s" repeatCount="indefinite"/>
    </g>
  `;

  function wrap(inner, viewBox = '0 0 300 350') {
    return `<svg viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">${inner}</svg>`;
  }

  const variants = {
    idle:      () => wrap(LEGS + BODY() + ARMS_DEFAULT + FACE_DEFAULT),
    happy:     () => wrap(LEGS + BODY() + ARMS_UP + FACE_HAPPY),
    sideEye:   () => wrap(LEGS + BODY() + ARMS_DEFAULT + FACE_SIDE),
    surprised: () => wrap(LEGS + BODY() + ARMS_WIDE + FACE_SURPRISED),
    waving:    () => wrap(LEGS + BODY() + WAVE_ARM + FACE_DEFAULT),
    sleepy: () => wrap(`
      <g opacity="0.5">${LEGS + BODY('rgba(91,255,127,0.12)') + ARMS_DROOPY}
        <line x1="112" y1="135" x2="136" y2="138" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
        <line x1="164" y1="138" x2="188" y2="135" stroke="${DARK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M 115 150 Q 125 143, 135 150" stroke="${DARK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <path d="M 165 150 Q 175 143, 185 150" stroke="${DARK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="150" cy="190" rx="7" ry="6" fill="none" stroke="${DARK}" stroke-width="3"/>
      </g>
      <text x="228" y="90" font-family="'Space Grotesk', sans-serif" font-size="18" fill="${NEON}" opacity="0.3" font-weight="700">z</text>
      <text x="246" y="64" font-family="'Space Grotesk', sans-serif" font-size="24" fill="${NEON}" opacity="0.45" font-weight="700">z</text>
      <text x="266" y="34" font-family="'Space Grotesk', sans-serif" font-size="30" fill="${NEON}" opacity="0.6" font-weight="700">z</text>
    `),
    marching: () => `<svg viewBox="0 0 300 370" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
      <g>
        <path d="M 122,260 L 113,288 L 108,315" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="103" cy="319" rx="13" ry="6" fill="${NEON}"/>
        <animateTransform attributeName="transform" type="rotate"
          values="0 122 260; -50 122 260; -50 122 260; 0 122 260; 30 122 260; 30 122 260; 0 122 260"
          keyTimes="0; 0.15; 0.25; 0.4; 0.55; 0.65; 1" dur="0.7s" repeatCount="indefinite"/>
      </g>
      <g>
        <path d="M 178,260 L 187,288 L 192,315" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <ellipse cx="197" cy="319" rx="13" ry="6" fill="${NEON}"/>
        <animateTransform attributeName="transform" type="rotate"
          values="30 178 260; 30 178 260; 0 178 260; -50 178 260; -50 178 260; 0 178 260; 30 178 260"
          keyTimes="0; 0.15; 0.4; 0.55; 0.65; 0.9; 1" dur="0.7s" repeatCount="indefinite"/>
      </g>
      <g>
        ${BODY() + FACE_DETERMINED}
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 -3; 0 0; 0 -3; 0 0" dur="0.7s" repeatCount="indefinite"/>
      </g>
      <g>
        <path d="M 85,165 L 60,180 L 45,208" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <animateTransform attributeName="transform" type="rotate"
          values="30 85 165; 30 85 165; 0 85 165; -40 85 165; -40 85 165; 0 85 165; 30 85 165"
          keyTimes="0; 0.15; 0.4; 0.55; 0.65; 0.9; 1" dur="0.7s" repeatCount="indefinite"/>
      </g>
      <g>
        <path d="M 215,165 L 240,180 L 255,208" fill="none" stroke="${NEON}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <animateTransform attributeName="transform" type="rotate"
          values="0 215 165; 40 215 165; 40 215 165; 0 215 165; -30 215 165; -30 215 165; 0 215 165"
          keyTimes="0; 0.15; 0.25; 0.4; 0.55; 0.65; 1" dur="0.7s" repeatCount="indefinite"/>
      </g>
    </svg>`,
  };

  // Shared animations (only injected once)
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pillyBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes pillyWiggle { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
    @keyframes pillyWalkAcross { 0% { left: -90px; } 100% { left: calc(100% + 90px); } }
    @keyframes pillyPopIn {
      0% { opacity: 0; transform: translateY(10px) scale(0.8); }
      60% { opacity: 1; transform: translateY(-4px) scale(1.05); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pillyFadeOut { to { opacity: 0; transform: translateY(-6px) scale(0.9); } }
    .pilly { display: inline-block; pointer-events: none; }
    .pilly svg { display: block; width: 100%; height: 100%; }
    .pilly-bob { animation: pillyBob 2.6s ease-in-out infinite; }
    .pilly-wiggle { animation: pillyWiggle 1.8s ease-in-out infinite; }
  `;
  document.head.appendChild(style);

  function make(variant, className = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'pilly ' + className;
    wrapper.innerHTML = variants[variant] ? variants[variant]() : variants.idle();
    return wrapper;
  }

  // Placement: Pilly sits on the LOCK IN nav button, legs dangling
  function sitOnButton(btnEl, opts = {}) {
    if (!btnEl) return;
    const size = opts.size || 48;

    // Wrap the button in a relative-positioned span so Pilly anchors to it
    const wrapper = document.createElement('span');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    btnEl.parentNode.insertBefore(wrapper, btnEl);
    wrapper.appendChild(btnEl);

    const pilly = make('idle', 'pilly-bob');
    Object.assign(pilly.style, {
      position: 'absolute',
      bottom: 'calc(100% - 16px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: size + 'px',
      height: (size * 350 / 300) + 'px',
      zIndex: '2',
      pointerEvents: 'none',
    });
    wrapper.appendChild(pilly);

    btnEl.addEventListener('mouseenter', () => { pilly.innerHTML = variants.happy(); });
    btnEl.addEventListener('mouseleave', () => { pilly.innerHTML = variants.idle(); });
  }

  // Placement: soldier march across a section
  function marchAcross(sectionEl, opts = {}) {
    if (!sectionEl) return;
    if (getComputedStyle(sectionEl).position === 'static') sectionEl.style.position = 'relative';
    sectionEl.style.overflow = sectionEl.style.overflow || 'hidden';

    const size = opts.size || 70;
    const pilly = make('marching');
    Object.assign(pilly.style, {
      position: 'absolute',
      bottom: (opts.bottom ?? 20) + 'px',
      left: '-90px',
      width: size + 'px',
      height: (size * 370 / 300) + 'px',
      zIndex: opts.zIndex || '2',
      animation: `pillyWalkAcross ${opts.duration || 14}s linear infinite`,
    });
    sectionEl.appendChild(pilly);
  }

  // Placement: surprised pop-up near an element (e.g. cart icon)
  function popUpAt(anchorEl, opts = {}) {
    if (!anchorEl) return;
    const size = opts.size || 42;
    const variant = opts.variant || 'surprised';

    const existing = document.querySelector('.pilly-popup-live');
    if (existing) existing.remove();

    const pilly = make(variant, 'pilly-popup-live');
    const rect = anchorEl.getBoundingClientRect();
    Object.assign(pilly.style, {
      position: 'fixed',
      left: (rect.right - size / 2) + 'px',
      top: (rect.bottom + 6) + 'px',
      width: size + 'px',
      height: (size * 350 / 300) + 'px',
      zIndex: '10000',
      animation: 'pillyPopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
      pointerEvents: 'none',
    });
    document.body.appendChild(pilly);

    setTimeout(() => {
      pilly.style.animation = 'pillyFadeOut 0.4s ease forwards';
      setTimeout(() => pilly.remove(), 500);
    }, opts.duration || 2400);
  }

  // Placement: large sleepy Pilly (for 404 / empty states)
  function sleepyAt(container, opts = {}) {
    if (!container) return;
    const size = opts.size || 180;
    const pilly = make('sleepy', 'pilly-wiggle');
    Object.assign(pilly.style, {
      width: size + 'px',
      height: (size * 350 / 300) + 'px',
      margin: '0 auto',
    });
    container.appendChild(pilly);
  }

  window.Pilly = { make, sitOnButton, marchAcross, popUpAt, sleepyAt, variants };
})();
