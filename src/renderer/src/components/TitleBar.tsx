import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Bell, HelpCircle, Settings } from 'lucide-react'

type AppView = 'home' | 'store'

interface TitleBarProps {
  onOpenSettings?: () => void
  currentView?: AppView
  onViewChange?: (view: AppView) => void
}

const isElectron = typeof (window as any).electronAPI !== 'undefined'

function TitleBar({ onOpenSettings = () => {}, currentView = 'home', onViewChange }: TitleBarProps): JSX.Element {
  return (
    <div className={`${isElectron ? 'drag-region' : ''} h-11 flex items-center justify-between px-5 shrink-0 border-b border-bg-border/40 relative`}>
      {/* Brand — text only, no icon */}
      <span className="no-drag text-text-primary text-[13px] font-semibold tracking-wide select-none">
        Pegasus Cloud
      </span>

      {/* Center nav — absolutely centered so brand/controls stay in place */}
      <div className="absolute left-1/2 -translate-x-1/2 no-drag flex items-center gap-0.5">
        <NavTab active={currentView === 'home'} onClick={() => onViewChange?.('home')}>Home</NavTab>
        <NavTab active={currentView === 'store'} onClick={() => onViewChange?.('store')}>Store</NavTab>
      </div>

      {/* Right side: nav icons → settings → window controls */}
      <div className="no-drag flex items-center gap-0.5">
        {/* Placeholder nav icons (future: notifications, help) */}
        <NavIconBtn title="Notifications">
          <Bell size={13} />
        </NavIconBtn>
        <NavIconBtn title="Help">
          <HelpCircle size={13} />
        </NavIconBtn>

        <Divider />

        {/* Settings — gear spin on hover */}
        <motion.button
          onClick={onOpenSettings}
          whileHover={{ rotate: 45 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
          title="Settings"
        >
          <Settings size={13} />
        </motion.button>

        {isElectron && (
          <>
            <Divider />

            {/* Minimize */}
            <button
              onClick={() => window.electronAPI?.minimize()}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
              title="Minimize"
            >
              <svg width="10" height="2" viewBox="0 0 10 2" fill="none">
                <rect width="10" height="2" rx="1" fill="currentColor" />
              </svg>
            </button>

            {/* Close */}
            <button
              onClick={() => window.electronAPI?.close()}
              className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-white hover:bg-red-600 transition-colors"
              title="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1l8 8M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function NavTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }): JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`px-3 h-6 rounded text-[11px] font-medium transition-colors cursor-pointer ${
        active
          ? 'text-text-primary bg-bg-elevated'
          : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated/50'
      }`}
    >
      {children}
    </button>
  )
}

function NavIconBtn({ children, title }: { children: ReactNode; title: string }): JSX.Element {
  return (
    <button
      className="w-8 h-8 flex items-center justify-center rounded text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors"
      title={title}
    >
      {children}
    </button>
  )
}

function Divider(): JSX.Element {
  return <div className="w-px h-4 bg-bg-border/70 mx-1.5" />
}

export default TitleBar
