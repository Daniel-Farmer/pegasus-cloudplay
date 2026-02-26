import { motion } from 'framer-motion'

function StatusIndicator(): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="flex items-center gap-2 bg-bg-elevated border border-bg-border rounded-full px-3 py-1.5"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-ready opacity-60" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-status-ready" />
      </span>
      <span className="text-text-secondary text-xs font-medium">Ready to Stream</span>
    </motion.div>
  )
}

export default StatusIndicator
