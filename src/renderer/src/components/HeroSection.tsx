import { motion } from 'framer-motion'
import { Monitor, Cpu, Gamepad2 } from 'lucide-react'
import UpdateGraphic from './UpdateGraphic'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: 'easeOut' }
})

const features = [
  { Icon: Monitor,  text: 'Linux gaming environment with Steam + Proton, plays Windows games',    color: '#22d3ee' },
  { Icon: Cpu,      text: 'Dedicated NVIDIA GPU and 32 GB RAM, yours alone',                      color: '#9d5cf6' },
  { Icon: Gamepad2, text: 'Your games and saves persist between sessions. Just launch and play.',  color: '#22c55e' },
]

function HeroSection(): JSX.Element {
  return (
    <div className="flex-1 relative flex items-center px-14 gap-10 overflow-hidden">

      {/* Ambient background — soft, non-distracting gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 60% 80% at 25% 50%, rgba(124,58,237,0.07) 0%, transparent 65%)',
            'radial-gradient(ellipse 35% 50% at 72% 38%, rgba(6,182,212,0.05) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      {/* ── Left column — primary focal point ── */}
      <div className="relative z-10 flex flex-col gap-5 w-[330px] shrink-0">

        {/* Eyebrow */}
        <motion.span
          {...fadeUp(0)}
          className="text-accent-cyan/70 text-[10px] font-medium uppercase tracking-[0.28em]"
        >
          What&apos;s new · v2.1
        </motion.span>

        {/* Heading */}
        <motion.h1
          {...fadeUp(0.08)}
          className="text-text-primary text-[27px] font-bold leading-[1.3]"
        >
          Your PC lives{' '}
          <span className="text-gradient-accent">in the cloud</span>
        </motion.h1>

        {/* Body */}
        <motion.p
          {...fadeUp(0.16)}
          className="text-text-secondary text-[13px] leading-[1.75]"
        >
          Pegasus Cloud gives you a dedicated Linux gaming machine powered by an NVIDIA GPU. Launch it through this app, connect in seconds, and pick up right where you left off. No hardware to buy.
        </motion.p>

        {/* Feature list with icons */}
        <motion.ul {...fadeUp(0.24)} className="flex flex-col gap-3">
          {features.map(({ Icon, text, color }) => (
            <li key={text} className="flex items-center gap-3">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${color}1a` }}
              >
                <Icon size={13} style={{ color }} strokeWidth={2} />
              </span>
              <span className="text-text-secondary text-[12px] leading-snug">{text}</span>
            </li>
          ))}
        </motion.ul>

        {/* Version badge */}
        <motion.div {...fadeUp(0.32)}>
          <span className="inline-flex items-center gap-1.5 bg-bg-elevated/70 border border-bg-border/60 rounded-full px-3 py-1 text-[11px] text-text-muted">
            <span
              className="w-1 h-1 rounded-full bg-accent-cyan"
              style={{ boxShadow: '0 0 5px rgba(6,182,212,0.8)' }}
            />
            v2.1 is live
          </span>
        </motion.div>
      </div>

      {/* ── Right column — illustration (secondary, softened) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 0.5, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex-1 flex items-center justify-center"
      >
        <UpdateGraphic />
      </motion.div>
    </div>
  )
}

export default HeroSection
