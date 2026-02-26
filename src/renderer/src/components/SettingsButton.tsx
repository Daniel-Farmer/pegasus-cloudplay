import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

interface SettingsButtonProps {
  onOpen: () => void
}

function SettingsButton({ onOpen }: SettingsButtonProps): JSX.Element {
  return (
    <motion.button
      onClick={onOpen}
      whileHover={{ rotate: 45 }}
      whileTap={{ scale: 0.88 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="w-10 h-10 flex items-center justify-center bg-bg-elevated hover:bg-bg-border border border-bg-border rounded-xl transition-colors"
      title="Settings"
    >
      <Settings size={18} className="text-text-secondary" />
    </motion.button>
  )
}

export default SettingsButton
