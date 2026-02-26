import { motion } from 'framer-motion'

function UpdateGraphic(): JSX.Element {
  const arcVariants = (delay: number) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 1.1, delay, ease: 'easeOut' }
    }
  })

  const floatVariants = (duration: number, yRange: number) => ({
    animate: {
      y: [-yRange, yRange, -yRange],
      transition: { duration, repeat: Infinity, ease: 'easeInOut' }
    }
  })

  return (
    <svg
      viewBox="0 0 320 260"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[240px] select-none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="45%" r="45%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="strokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <radialGradient id="monitorGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="cloudFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* Background glow */}
      <ellipse cx="160" cy="115" rx="90" ry="75" fill="url(#bgGlow)" />

      {/* Cloud body */}
      <path
        d="M108 105
           C108 105 100 105 96 98
           C92 91 96 82 104 82
           C104 73 110 66 120 66
           C124 58 132 53 142 55
           C148 48 158 44 168 47
           C180 44 192 50 196 62
           C204 62 212 68 212 78
           C218 80 222 87 220 94
           C220 102 214 107 206 107
           Z"
        fill="url(#cloudFill)"
        stroke="url(#strokeGrad)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Signal arcs — draw-on animation */}
      <motion.path
        d="M148 125 Q160 118 172 125"
        fill="none"
        stroke="url(#strokeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        variants={arcVariants(0.5)}
        initial="hidden"
        animate="visible"
      />
      <motion.path
        d="M138 140 Q160 128 182 140"
        fill="none"
        stroke="url(#strokeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        variants={arcVariants(0.75)}
        initial="hidden"
        animate="visible"
      />
      <motion.path
        d="M126 156 Q160 140 194 156"
        fill="none"
        stroke="url(#strokeGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        variants={arcVariants(1.0)}
        initial="hidden"
        animate="visible"
      />

      {/* Monitor glow */}
      <ellipse cx="160" cy="212" rx="34" ry="12" fill="url(#monitorGlow)" />

      {/* Monitor body */}
      <rect x="128" y="174" width="64" height="40" rx="4" fill="#0f0f1a" stroke="#1e1e30" strokeWidth="1.5" />

      {/* Screen background */}
      <rect x="132" y="178" width="56" height="32" rx="2" fill="#090912" />

      {/* Desktop wallpaper — subtle gradient strip */}
      <rect x="132" y="178" width="56" height="20" rx="2" fill="#0d0d1f" />

      {/* App window 1 — browser/file manager style */}
      <rect x="134" y="180" width="24" height="14" rx="1.5" fill="#12122a" stroke="#7c3aed" strokeWidth="0.6" strokeOpacity="0.7" />
      {/* Window 1 title bar */}
      <rect x="134" y="180" width="24" height="3" rx="1" fill="#7c3aed" fillOpacity="0.3" />
      {/* Window 1 content lines */}
      <rect x="136" y="185" width="14" height="1" rx="0.5" fill="#9999b3" fillOpacity="0.5" />
      <rect x="136" y="188" width="10" height="1" rx="0.5" fill="#9999b3" fillOpacity="0.3" />

      {/* App window 2 — game/app */}
      <rect x="162" y="180" width="24" height="14" rx="1.5" fill="#0a1a1f" stroke="#06b6d4" strokeWidth="0.6" strokeOpacity="0.7" />
      {/* Window 2 title bar */}
      <rect x="162" y="180" width="24" height="3" rx="1" fill="#06b6d4" fillOpacity="0.25" />
      {/* Window 2 — small play triangle (game running) */}
      <polygon points="170,185 170,191 175,188" fill="#06b6d4" fillOpacity="0.7" />

      {/* Taskbar at bottom of screen */}
      <rect x="132" y="198" width="56" height="12" rx="0" fill="#0b0b1e" />
      <rect x="132" y="198" width="56" height="0.75" fill="#1e1e30" />
      {/* Taskbar icons */}
      <rect x="135" y="201" width="5" height="5" rx="1" fill="#7c3aed" fillOpacity="0.7" />
      <rect x="142" y="201" width="5" height="5" rx="1" fill="#06b6d4" fillOpacity="0.5" />
      <rect x="149" y="201" width="5" height="5" rx="1" fill="#9999b3" fillOpacity="0.3" />
      {/* System tray */}
      <rect x="173" y="202" width="12" height="3" rx="1" fill="#4f4f6e" fillOpacity="0.5" />

      {/* Monitor stand */}
      <rect x="157" y="214" width="6" height="8" rx="1" fill="#1e1e30" />
      <rect x="148" y="221" width="24" height="3" rx="1.5" fill="#1e1e30" />

      {/* Floating particles */}
      <motion.circle cx="90"  cy="80"  r="3"   fill="#7c3aed" fillOpacity="0.8" variants={floatVariants(3.2, 5)} animate="animate" />
      <motion.circle cx="76"  cy="130" r="2"   fill="#06b6d4" fillOpacity="0.6" variants={floatVariants(2.8, 6)} animate="animate" />
      <motion.circle cx="240" cy="75"  r="2.5" fill="#9d5cf6" fillOpacity="0.7" variants={floatVariants(3.6, 4)} animate="animate" />
      <motion.circle cx="252" cy="138" r="2"   fill="#22d3ee" fillOpacity="0.6" variants={floatVariants(2.5, 7)} animate="animate" />
      <motion.circle cx="115" cy="170" r="1.5" fill="#7c3aed" fillOpacity="0.5" variants={floatVariants(4.0, 5)} animate="animate" />
      <motion.circle cx="210" cy="165" r="1.5" fill="#06b6d4" fillOpacity="0.5" variants={floatVariants(3.0, 6)} animate="animate" />
    </svg>
  )
}

export default UpdateGraphic
