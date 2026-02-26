import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'

// ── Pricing constants (internal — not shown to customers) ──
const HOURS_ACTIVE     = 8 * 30    // 240 h/mo assumed usage
const HOURS_STOPPED    = 16 * 30   // 480 h/mo stopped
const DISK_RATE_PER_GB = 0.00014   // $/GB/hr — RunPod actual
const GPU_RATE         = 0.30      // $/GPU/hr — blended pool rate
const SERVICE_CHARGE   = 5.00      // flat $5/mo — for the people

// GPU pool — shown for transparency, not selectable
const GPU_POOL = [
  { name: 'RTX A4000', vram: '14 GB', ram: '62 GB', vcpu: '16 vCPU' },
  { name: 'RTX A4500', vram: '20 GB', ram: '62 GB', vcpu: '12 vCPU' },
  { name: 'RTX A5000', vram: '24 GB', ram: '25 GB', vcpu:  '9 vCPU' },
]

function calcBreakdown(gpuCount: number, storage: number) {
  const gpuCost       = GPU_RATE * gpuCount * HOURS_ACTIVE
  const diskCost      = storage * 2 * DISK_RATE_PER_GB * HOURS_ACTIVE
                      + storage * DISK_RATE_PER_GB * HOURS_STOPPED
  const baseCost      = gpuCost + diskCost
  const serviceCharge = SERVICE_CHARGE
  const total         = Math.ceil(baseCost + serviceCharge)
  return { gpuCost, diskCost, serviceCharge, total }
}

interface StoreScreenProps {
  onSubscribe: () => void
}

function StoreScreen({ onSubscribe }: StoreScreenProps): JSX.Element {
  const [gpuCount, setGpuCount] = useState(1)
  const [storage,  setStorage]  = useState(50)
  const [loading,  setLoading]  = useState(false)

  const breakdown = calcBreakdown(gpuCount, storage)

  async function handleGetStarted() {
    setLoading(true)
    await supabase.functions.invoke('pod-manage', {
      body: { action: 'subscribe', gpuCount, storageGb: storage }
    })
    onSubscribe()
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col px-14 py-5 gap-4 relative">

      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 60% 80% at 25% 50%, rgba(124,58,237,0.07) 0%, transparent 65%)',
            'radial-gradient(ellipse 35% 50% at 72% 38%, rgba(6,182,212,0.05) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 shrink-0"
      >
        <span className="text-accent-cyan/70 text-[10px] font-medium uppercase tracking-[0.28em]">
          Plans & Pricing
        </span>
        <h2 className="text-text-primary text-[20px] font-bold leading-tight mt-1">
          Configure your <span className="text-gradient-accent">cloud PC</span>
        </h2>
      </motion.div>

      {/* Two-column layout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 flex gap-5 flex-1 min-h-0"
      >

        {/* ── Left: GPU pool info ── */}
        <div className="flex flex-col w-[310px] shrink-0 min-h-0">
          <p className="text-text-muted text-[9px] uppercase tracking-[0.2em] font-medium mb-2 shrink-0">
            GPU Pool
          </p>
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            {GPU_POOL.map((g) => (
              <div
                key={g.name}
                className="flex-1 rounded-xl px-4 flex flex-col justify-center"
                style={{
                  background: 'rgba(20,20,31,0.9)',
                  border: '1px solid rgba(30,30,48,0.9)',
                }}
              >
                <p className="text-text-secondary text-[13px] font-semibold">{g.name}</p>
                <p className="text-text-muted text-[10px] mt-0.5">
                  {g.vram} VRAM · {g.ram} RAM · {g.vcpu}
                </p>
              </div>
            ))}
          </div>
          <p className="text-text-muted text-[9px] mt-2 shrink-0 leading-relaxed">
            A GPU from this pool is assigned when you launch. You always get dedicated, unshared hardware.
          </p>
        </div>

        {/* ── Right: Configure panel ── */}
        <div className="flex-1 min-h-0 overflow-hidden bg-bg-elevated border border-bg-border/80 rounded-2xl flex flex-col">

          {/* GPU Count */}
          <div className="px-5 py-3.5 border-b border-bg-border/60 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-[11px] font-semibold">Number of GPUs</p>
                <p className="text-text-muted text-[10px] mt-0.5">Up to 3 GPUs active simultaneously</p>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setGpuCount(n)}
                    className={`w-9 h-8 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                      gpuCount === n
                        ? 'bg-gradient-accent text-white'
                        : 'bg-bg-base border border-bg-border text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="px-5 py-3.5 border-b border-bg-border/60 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-text-secondary text-[11px] font-semibold">Storage</p>
                <p className="text-text-muted text-[10px] mt-0.5">
                  <span className="text-text-secondary">{storage} GB system</span>
                  {' '}+{' '}
                  <span className="text-text-secondary">{storage} GB persistent</span>
                </p>
              </div>
              <DiskStepper value={storage} onChange={setStorage} />
            </div>
          </div>

          {/* Monthly price */}
          <div className="flex-1 px-5 py-4 flex flex-col justify-between border-b border-bg-border/60">
            <div>
              <p className="text-text-muted text-[9px] uppercase tracking-[0.2em] font-medium mb-3">
                Your monthly price
              </p>
              <div className="flex items-end gap-1.5 mb-1">
                <motion.span
                  key={breakdown.total}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-text-primary text-[36px] font-bold leading-none"
                >
                  ${breakdown.total}
                </motion.span>
                <span className="text-text-muted text-[13px] pb-1">/month</span>
              </div>
              <p className="text-text-muted text-[10px]">
                Billed monthly · Unlimited sessions
              </p>
            </div>

            {/* Cost breakdown */}
            <div className="flex flex-col gap-1.5">
              <BillRow label={`GPU × ${gpuCount}`}              value={breakdown.gpuCost} />
              <BillRow label={`Disk (${storage * 2} GB total)`} value={breakdown.diskCost} />
              <BillRow label="Service charge"                   value={breakdown.serviceCharge} muted />
              <div className="h-px bg-bg-border/50 my-0.5" />
              <BillRow label="Total" value={breakdown.total} bold />
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 py-4 shrink-0">
            <motion.button
              onClick={handleGetStarted}
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.02, boxShadow: '0 0 24px 4px rgba(124,58,237,0.45)' }}
              whileTap={loading ? {} : { scale: 0.98 }}
              className="w-full h-10 rounded-xl bg-gradient-accent text-white font-semibold text-[12px] tracking-wide cursor-pointer transition-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up…' : 'Get Started — Free Beta Access'}
            </motion.button>
            <p className="text-text-muted text-[10px] text-center mt-2">
              No payment required during beta.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function BillRow({ label, value, muted, bold }: {
  label: string
  value: number
  muted?: boolean
  bold?: boolean
}): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-[11px] ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>{label}</span>
      <span className={`text-[12px] font-semibold ${bold ? 'text-text-primary' : muted ? 'text-text-muted' : 'text-text-secondary'}`}>
        ${value.toFixed(2)}<span className="text-[9px] font-normal text-text-muted">/mo</span>
      </span>
    </div>
  )
}

function DiskStepper({ value, onChange }: { value: number; onChange: (v: number) => void }): JSX.Element {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(20, value - 10))}
        className="w-7 h-7 rounded-lg bg-bg-base border border-bg-border text-text-muted hover:text-text-secondary text-[16px] flex items-center justify-center cursor-pointer transition-colors leading-none"
      >−</button>
      <span className="text-text-primary text-[12px] font-semibold w-14 text-center">{value} GB</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(500, value + 10))}
        className="w-7 h-7 rounded-lg bg-bg-base border border-bg-border text-text-muted hover:text-text-secondary text-[16px] flex items-center justify-center cursor-pointer transition-colors leading-none"
      >+</button>
    </div>
  )
}

export default StoreScreen