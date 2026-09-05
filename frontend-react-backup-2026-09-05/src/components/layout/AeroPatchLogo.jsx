/**
 * AeroPatchLogo — High-precision native vector logo component for AeroPatch.
 * 
 * Recreates the original AeroPatch visual identity as a scalable inline SVG:
 * - Stylized dual-cable suspension bridge (civil road/bridge infrastructure)
 * - Dynamic swooping roadway and orange aerial flight trajectory
 * - Climbing quadcopter drone with rotor discs and camera gimbal
 * - Left orange crescent bracket framing the wordmark
 * - "AERO" (vibrant technical blue / azure on dark, navy on light)
 * - "PATCH" (vibrant safety orange / amber)
 * - "INFRASTRUCTURE DRONE SOLUTIONS" tracked subtitle with precision spacing
 */
export default function AeroPatchLogo({
  className = 'h-12 w-auto',
  variant = 'dark', // 'dark' | 'light' | 'original'
  subtitle = 'INFRASTRUCTURE DRONE SOLUTIONS',
  showSubtitle = true,
  ...props
}) {
  const isLight = variant === 'light';

  // High-contrast, brand-accurate color scheme
  const bluePrimary = isLight ? '#0f3e6e' : '#38bdf8';
  const blueSecondary = isLight ? '#164e87' : '#0284c7';
  const blueDark = isLight ? '#0a294a' : '#0369a1';
  const blueGlow = isLight ? '#0284c7' : '#7dd3fc';

  const orangePrimary = '#f97316';
  const orangeSecondary = '#ea580c';
  const orangeLight = '#fb923c';

  const subtitleColor = isLight ? '#334155' : '#94a3b8';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="20 18 430 200"
      fill="none"
      className={`select-none ${className}`}
      aria-label="AeroPatch — Infrastructure Drone Solutions"
      role="img"
      {...props}
    >
      <defs>
        {/* Blue Gradients */}
        <linearGradient id="apBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={blueGlow} />
          <stop offset="100%" stopColor={blueSecondary} />
        </linearGradient>

        <linearGradient id="apBlueDeep" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={blueDark} />
          <stop offset="60%" stopColor={blueSecondary} />
          <stop offset="100%" stopColor={bluePrimary} />
        </linearGradient>

        <linearGradient id="apTextBlue" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={bluePrimary} />
          <stop offset="100%" stopColor={isLight ? '#164e87' : '#60a5fa'} />
        </linearGradient>

        {/* Orange Gradients */}
        <linearGradient id="apOrangeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={orangeSecondary} />
          <stop offset="60%" stopColor={orangePrimary} />
          <stop offset="100%" stopColor={orangeLight} />
        </linearGradient>

        <linearGradient id="apSwooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={orangeSecondary} />
          <stop offset="70%" stopColor={orangePrimary} />
          <stop offset="100%" stopColor="#fdba74" />
        </linearGradient>
      </defs>

      {/* ==================================================================== */}
      {/* 1. SUSPENSION BRIDGE (CIVIL INFRASTRUCTURE)                          */}
      {/* ==================================================================== */}
      <g id="ap-bridge" opacity="0.96">
        {/* Rear Orange Tower (in perspective) */}
        <g id="rear-tower" stroke="url(#apOrangeGrad)" strokeWidth="1.8" strokeLinecap="round">
          {/* Main vertical tower legs */}
          <line x1="126" y1="124" x2="130" y2="54" />
          <line x1="138" y1="124" x2="132" y2="54" />
          {/* Cross struts */}
          <line x1="128" y1="64" x2="134" y2="64" />
          <line x1="127" y1="73" x2="135" y2="83" />
          <line x1="135" y1="73" x2="127" y2="83" />
          <line x1="127" y1="83" x2="135" y2="83" />
          <line x1="126" y1="104" x2="136" y2="104" />
          {/* Rear tower top cap */}
          <polygon points="129,54 133,54 131,48" fill={orangePrimary} stroke="none" />
        </g>

        {/* Rear Orange Suspension Cable & Suspenders */}
        <path
          d="M 131 54 Q 165 92, 204 114"
          fill="none"
          stroke="url(#apOrangeGrad)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <g stroke="url(#apOrangeGrad)" strokeWidth="1.3" opacity="0.85">
          <line x1="148" y1="74" x2="148" y2="120" />
          <line x1="164" y1="87" x2="164" y2="122" />
          <line x1="180" y1="99" x2="180" y2="124" />
          <line x1="194" y1="109" x2="194" y2="125" />
        </g>

        {/* Front Blue Suspension Cable (Left Backstay & Main Span) */}
        <path
          d="M 38 126 Q 74 88, 112 48 Q 148 94, 194 120"
          fill="none"
          stroke="url(#apBlueGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
        />

        {/* Front Blue Vertical Suspenders */}
        <g stroke={blueSecondary} strokeWidth="1.6" opacity="0.9">
          <line x1="56" y1="112" x2="56" y2="126" />
          <line x1="74" y1="92" x2="74" y2="126" />
          <line x1="92" y1="70" x2="92" y2="126" />
          <line x1="128" y1="68" x2="128" y2="126" />
          <line x1="144" y1="85" x2="144" y2="126" />
          <line x1="160" y1="99" x2="160" y2="126" />
          <line x1="176" y1="110" x2="176" y2="126" />
        </g>

        {/* Front Blue Tower */}
        <g id="front-tower" stroke="url(#apBlueGrad)" strokeWidth="2.4" strokeLinecap="round">
          {/* Main vertical tower legs */}
          <line x1="106" y1="128" x2="111" y2="48" />
          <line x1="120" y1="128" x2="113" y2="48" />
          {/* Cross struts */}
          <line x1="110" y1="58" x2="114" y2="58" />
          <line x1="108" y1="68" x2="116" y2="78" />
          <line x1="116" y1="68" x2="108" y2="78" />
          <line x1="108" y1="78" x2="116" y2="78" />
          <line x1="107" y1="100" x2="118" y2="100" />
          {/* Tower top finial */}
          <polygon points="109,48 115,48 112,40" fill={bluePrimary} stroke="none" />
        </g>
      </g>

      {/* ==================================================================== */}
      {/* 2. ROADWAY & SWOOPING FLIGHT TRAIL                                   */}
      {/* ==================================================================== */}
      <g id="ap-roadway-flight-trail">
        {/* Lower Left Orange Crescent Accent */}
        <path
          d="M 50 144 C 40 160, 44 178, 64 188 C 82 196, 102 193, 116 185 C 100 187, 82 184, 70 176 C 58 166, 56 154, 60 144 Z"
          fill="url(#apOrangeGrad)"
        />

        {/* Lower Blue Sweeping Highway Ribbon */}
        <path
          d="M 36 125 C 28 144, 32 166, 52 182 C 72 197, 98 193, 122 178 C 152 158, 186 144, 222 134 C 265 122, 304 96, 332 66 C 314 86, 276 109, 234 121 C 194 132, 158 147, 130 166 C 108 180, 88 184, 70 173 C 54 163, 50 144, 54 127 Z"
          fill="url(#apBlueDeep)"
        />

        {/* Upper Blue Flight Trajectory Ribbon (Deck -> Drone) */}
        <path
          d="M 54 126 C 96 126, 136 128, 176 123 C 218 116, 260 98, 296 72 C 314 59, 328 46, 342 34 C 331 46, 316 61, 294 76 C 258 98, 216 116, 174 122 C 136 127, 96 126, 54 126 Z"
          fill="url(#apBlueGrad)"
        />

        {/* Dynamic Orange Flight Jet Trail (trails underneath climbing drone) */}
        <path
          d="M 168 134 C 210 128, 254 114, 292 88 C 318 70, 340 48, 354 32 C 344 50, 324 71, 298 89 C 262 113, 218 129, 174 136 Z"
          fill="url(#apSwooshGrad)"
        />
      </g>

      {/* ==================================================================== */}
      {/* 3. QUADCOPTER INSPECTION DRONE (AI AERIAL SENSING)                   */}
      {/* ==================================================================== */}
      <g id="ap-drone" transform="translate(352, 34) rotate(11)">
        {/* Left Rotor Assembly */}
        <g id="left-rotor" transform="translate(-44, -2)">
          {/* Rotor disc guard */}
          <ellipse cx="0" cy="0" rx="21" ry="6.5" fill="none" stroke="url(#apBlueGrad)" strokeWidth="2.4" />
          {/* Propeller Blade */}
          <path d="M -18 0 Q 0 -2, 18 0" stroke={isLight ? '#0f3e6e' : '#ffffff'} strokeWidth="1.8" strokeLinecap="round" />
          {/* Motor Hub */}
          <circle cx="0" cy="0" r="3.2" fill={isLight ? '#0f3e6e' : '#ffffff'} />
        </g>

        {/* Right Rotor Assembly */}
        <g id="right-rotor" transform="translate(46, 2)">
          {/* Rotor disc guard */}
          <ellipse cx="0" cy="0" rx="19" ry="5.8" fill="none" stroke="url(#apBlueGrad)" strokeWidth="2.4" />
          {/* Propeller Blade */}
          <path d="M -16 0 Q 0 -2, 16 0" stroke={isLight ? '#0f3e6e' : '#ffffff'} strokeWidth="1.8" strokeLinecap="round" />
          {/* Motor Hub */}
          <circle cx="0" cy="0" r="3" fill={isLight ? '#0f3e6e' : '#ffffff'} />
        </g>

        {/* Left & Right Motor Arms */}
        <line x1="-16" y1="2" x2="-44" y2="-2" stroke="url(#apBlueGrad)" strokeWidth="3.4" strokeLinecap="round" />
        <line x1="16" y1="2" x2="46" y2="2" stroke="url(#apBlueGrad)" strokeWidth="3.4" strokeLinecap="round" />

        {/* Central Aerodynamic Drone Fuselage */}
        <path
          d="M -22 6 C -20 -3, -10 -9, 2 -9 C 14 -9, 23 -3, 25 6 C 18 11, -12 11, -22 6 Z"
          fill="url(#apBlueGrad)"
        />

        {/* Canopy Glass Highlight */}
        <path
          d="M -11 -2 C -7 -7, 3 -7, 9 -2 C 3 -1, -5 -1, -11 -2 Z"
          fill="#ffffff"
          opacity="0.85"
        />

        {/* Camera Sensor Gimbal (Civil Inspection Camera) */}
        <line x1="-6" y1="8" x2="-9" y2="14" stroke={blueSecondary} strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="8" x2="9" y2="14" stroke={blueSecondary} strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="11" r="2.8" fill={orangePrimary} />
      </g>

      {/* ==================================================================== */}
      {/* 4. WORDMARK & TYPOGRAPHY                                            */}
      {/* ==================================================================== */}
      <g id="ap-wordmark">
        {/* Left Orange Crescent Accent hugging the 'A' */}
        <path
          d="M 92 148 C 74 163, 74 187, 92 202 C 80 187, 80 163, 92 148 Z"
          fill="url(#apOrangeGrad)"
        />

        {/* Combined "AEROPATCH" wordmark for seamless font rendering */}
        <text
          y="196"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Montserrat', 'Segoe UI', Roboto, sans-serif"
          fontSize="44"
          fontWeight="900"
          letterSpacing="-0.02em"
        >
          <tspan x="104" fill="url(#apTextBlue)">AERO</tspan>
          <tspan fill="url(#apOrangeGrad)">PATCH</tspan>
        </text>

        {/* Subtitle: "INFRASTRUCTURE DRONE SOLUTIONS" - exact span matching wordmark */}
        {showSubtitle && (
          <text
            x="105"
            y="214"
            textLength="330"
            lengthAdjust="spacing"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif"
            fontSize="10.8"
            fontWeight="800"
            fill={subtitleColor}
          >
            {subtitle}
          </text>
        )}
      </g>
    </svg>
  );
}
