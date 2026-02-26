import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

interface SettingsModalProps {
  onClose: () => void
}

const labelClass = 'block text-text-muted text-[10px] font-semibold uppercase tracking-[0.15em] mb-1.5'
const selectClass =
  'w-full bg-bg-surface border border-bg-border rounded-lg px-3 py-2 text-text-primary text-xs focus:outline-none focus:ring-1 focus:ring-accent-purple transition-colors appearance-none cursor-pointer'

function SettingsModal({ onClose }: SettingsModalProps): JSX.Element {
  const [fps, setFps] = useState<'30' | '60' | '120'>('60')
  const [vsync, setVsync] = useState(true)
  const [audioBitrate, setAudioBitrate] = useState(320)

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        key="settings-panel"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="absolute top-0 right-0 bottom-0 w-80 bg-bg-elevated border-l border-bg-border z-30 flex flex-col"
      >
        {/* Panel header */}
        <div className="drag-region flex items-center justify-between px-5 py-4 border-b border-bg-border shrink-0">
          <span className="no-drag text-text-primary text-sm font-semibold">Settings</span>
          <button
            onClick={onClose}
            className="no-drag w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-text-primary hover:bg-bg-border transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* ── Display & Quality ── */}
          <section>
            <h3 className="text-text-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="flex-1 h-px bg-bg-border" />
              Display &amp; Quality
              <span className="flex-1 h-px bg-bg-border" />
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Resolution</label>
                <div className="relative">
                  <select defaultValue="1080p" className={selectClass}>
                    <option>720p</option>
                    <option>1080p</option>
                    <option>1440p</option>
                    <option>4K</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>
              <div>
                <label className={labelClass}>Stream Quality</label>
                <div className="relative">
                  <select defaultValue="High" className={selectClass}>
                    <option>Auto</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Ultra</option>
                  </select>
                  <ChevronIcon />
                </div>
              </div>
            </div>
          </section>

          {/* ── Performance ── */}
          <section>
            <h3 className="text-text-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="flex-1 h-px bg-bg-border" />
              Performance
              <span className="flex-1 h-px bg-bg-border" />
            </h3>
            <div className="space-y-4">
              {/* FPS pill radio */}
              <div>
                <label className={labelClass}>Target FPS</label>
                <div className="flex gap-2">
                  {(['30', '60', '120'] as const).map((val) => (
                    <button
                      key={val}
                      onClick={() => setFps(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        fps === val
                          ? 'bg-accent-purple border-accent-purple text-white shadow-glow-purple'
                          : 'bg-bg-surface border-bg-border text-text-secondary hover:border-text-muted'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* V-Sync toggle */}
              <div className="flex items-center justify-between">
                <label className={labelClass + ' mb-0'}>V-Sync</label>
                <button
                  onClick={() => setVsync(!vsync)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    vsync ? 'bg-accent-purple' : 'bg-bg-border'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      vsync ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* ── Audio ── */}
          <section>
            <h3 className="text-text-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="flex-1 h-px bg-bg-border" />
              Audio
              <span className="flex-1 h-px bg-bg-border" />
            </h3>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass + ' mb-0'}>Audio Bitrate</label>
                <span className="text-accent-cyan text-[10px] font-mono">{audioBitrate} kbps</span>
              </div>
              <input
                type="range"
                min={64}
                max={512}
                step={32}
                value={audioBitrate}
                onChange={(e) => setAudioBitrate(Number(e.target.value))}
                className="w-full h-1 rounded-full cursor-pointer"
                style={{ accentColor: '#7c3aed' }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-text-muted text-[9px]">64 kbps</span>
                <span className="text-text-muted text-[9px]">512 kbps</span>
              </div>
            </div>
          </section>

          {/* ── Network ── */}
          <section>
            <h3 className="text-text-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="flex-1 h-px bg-bg-border" />
              Network
              <span className="flex-1 h-px bg-bg-border" />
            </h3>
            <div>
              <label className={labelClass}>Region</label>
              <div className="relative">
                <select defaultValue="Auto" className={selectClass}>
                  <option>Auto</option>
                  <option>US East</option>
                  <option>US West</option>
                  <option>EU West</option>
                  <option>Asia Pacific</option>
                </select>
                <ChevronIcon />
              </div>
            </div>
          </section>
        </div>

        {/* Panel footer */}
        <div className="px-5 py-4 border-t border-bg-border shrink-0">
          <p className="text-text-muted text-[10px] text-center">
            Settings are saved automatically
          </p>
        </div>
      </motion.div>
    </>
  )
}

function ChevronIcon(): JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 3.5l3 3 3-3" stroke="#4f4f6e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default SettingsModal
