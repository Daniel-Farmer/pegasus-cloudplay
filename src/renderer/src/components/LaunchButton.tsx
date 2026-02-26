import { motion } from 'framer-motion'
import { MonitorPlay, Wifi } from 'lucide-react'
import type { PodStatus } from '../App'

interface LaunchButtonProps {
  podStatus: PodStatus
  streamUrl: string
  onLaunch: () => void
  onConnect: () => void
  onStop: () => void
}

function LaunchButton({ podStatus, onLaunch, onConnect, onStop }: LaunchButtonProps): JSX.Element {

  if (podStatus === 'starting') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-2"
      >
        <div className="flex items-center gap-3 px-12 h-[52px] rounded-xl border border-bg-border bg-bg-elevated text-text-secondary text-[13px] font-semibold tracking-wide">
          <span className="flex gap-1">
            {[0, 0.15, 0.3].map((delay) => (
              <motion.span
                key={delay}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay }}
                className="w-1.5 h-1.5 rounded-full bg-accent-purple inline-block"
              />
            ))}
          </span>
          Setting up your Cloud PC…
        </div>
        <p className="text-text-muted text-[10px]">First launch downloads the gaming image (~10 min)</p>
      </motion.div>
    )
  }

  if (podStatus === 'running') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center gap-2.5"
      >
        <motion.button
          onClick={onConnect}
          whileHover={{ scale: 1.05, boxShadow: '0 0 38px 10px rgba(34,197,94,0.45)' }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-3 px-12 h-[52px] rounded-xl bg-green-500 text-white font-semibold tracking-[0.1em] text-[13px] uppercase cursor-pointer transition-none"
          style={{ willChange: 'transform, box-shadow' }}
        >
          <Wifi size={17} strokeWidth={1.8} />
          Connect
        </motion.button>
        <button
          onClick={onStop}
          className="text-text-muted text-[11px] hover:text-text-secondary transition-colors cursor-pointer"
        >
          Stop PC
        </button>
      </motion.div>
    )
  }

  // none or stopped
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2"
    >
      <motion.button
        onClick={onLaunch}
        whileHover={{ scale: 1.05, boxShadow: '0 0 38px 10px rgba(124,58,237,0.55), 0 0 80px 20px rgba(6,182,212,0.2)' }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-3 px-12 h-[52px] rounded-xl bg-gradient-accent text-white font-semibold tracking-[0.1em] text-[13px] uppercase shadow-glow-purple cursor-pointer transition-none"
        style={{ willChange: 'transform, box-shadow' }}
      >
        <MonitorPlay size={17} strokeWidth={1.8} />
        {podStatus === 'stopped' ? 'Resume My Cloud PC' : 'Launch My Cloud PC'}
      </motion.button>
      {podStatus === 'stopped' && (
        <p className="text-text-muted text-[10px]">Your games and files are saved.</p>
      )}
    </motion.div>
  )
}

export default LaunchButton
