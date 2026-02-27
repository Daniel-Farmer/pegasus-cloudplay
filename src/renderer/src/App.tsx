import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Session } from '@supabase/supabase-js'
import { ShoppingCart } from 'lucide-react'
import { supabase } from './lib/supabase'
import TitleBar from './components/TitleBar'
import HeroSection from './components/HeroSection'
import LaunchButton from './components/LaunchButton'
import SettingsModal from './components/SettingsModal'
import AuthScreen from './components/AuthScreen'
import StoreScreen from './components/StoreScreen'
import CloudPCView from './components/CloudPCView'

type AppView = 'home' | 'store' | 'cloudpc'
type SubStatus = 'loading' | 'active' | 'none'
export type PodStatus = 'none' | 'starting' | 'running' | 'stopped'

function App(): JSX.Element {
  const [session,    setSession]    = useState<Session | null | undefined>(undefined)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view,       setView]       = useState<AppView>('home')
  const [subStatus,  setSubStatus]  = useState<SubStatus>('loading')
  const [podStatus,  setPodStatus]  = useState<PodStatus>('none')
  const [streamUrl,  setStreamUrl]  = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setSubStatus('loading')
    supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(({ data }) => setSubStatus(data ? 'active' : 'none'))

    // Restore pod state from DB on load
    supabase
      .from('pods')
      .select('status, stream_url')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data: pod }) => {
        if (!pod) return
        if (pod.status === 'running') {
          setStreamUrl(pod.stream_url ?? '')
          setPodStatus('running')
        } else if (pod.status === 'starting') {
          setPodStatus('starting')
          startPolling()
        } else if (pod.status === 'stopped') {
          setPodStatus('stopped')
        }
      })
  }, [session])

  function startPolling() {
    const interval = setInterval(async () => {
      const { data } = await supabase.functions.invoke('pod-manage', { body: { action: 'status' } })
      if (data?.status === 'running') {
        clearInterval(interval)
        setStreamUrl(data.streamUrl ?? '')
        setPodStatus('running')
      } else if (data?.status === 'stopped') {
        clearInterval(interval)
        setPodStatus('stopped')
      } else if (data?.status === 'none') {
        // Pod was never created or was cleaned up — stop polling and reset
        clearInterval(interval)
        setPodStatus('none')
      }
    }, 5000)
  }

  async function handleLaunch() {
    setPodStatus('starting')
    const { data, error } = await supabase.functions.invoke('pod-manage', { body: { action: 'start' } })
    if (error || data?.error) {
      setPodStatus('none')
      return
    }
    startPolling()
  }

  async function handleStop() {
    await supabase.functions.invoke('pod-manage', { body: { action: 'stop' } })
    setPodStatus('stopped')
    setStreamUrl('')
  }

  async function handleDisconnect() {
    await handleStop()
    setView('home')
  }

  if (session === undefined) return <div className="fixed inset-0 bg-bg-base" />
  if (session === null)      return <AuthScreen />

  if (view === 'cloudpc') {
    return <CloudPCView streamUrl={streamUrl} onBack={handleDisconnect} />
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col overflow-hidden">
      <TitleBar
        onOpenSettings={() => setSettingsOpen(true)}
        currentView={view as 'home' | 'store'}
        onViewChange={(v) => setView(v)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === 'store' ? (
          <StoreScreen onSubscribe={() => { setSubStatus('active'); setView('home') }} />
        ) : (
          <>
            <HeroSection />
            <div className="flex items-center justify-center pb-10 pt-1 shrink-0">
              {subStatus === 'active' ? (
                <LaunchButton
                  podStatus={podStatus}
                  streamUrl={streamUrl}
                  onLaunch={handleLaunch}
                  onConnect={() => setView('cloudpc')}
                  onStop={handleStop}
                />
              ) : subStatus === 'none' ? (
                <GetCloudPCButton onClick={() => setView('store')} />
              ) : null}
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

function GetCloudPCButton({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.45, ease: 'easeOut' }}
        onClick={onClick}
        whileHover={{ scale: 1.05, boxShadow: '0 0 38px 10px rgba(124,58,237,0.55), 0 0 80px 20px rgba(6,182,212,0.2)' }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center gap-3 px-12 h-[52px] rounded-xl bg-gradient-accent text-white font-semibold tracking-[0.1em] text-[13px] uppercase shadow-glow-purple cursor-pointer transition-none"
        style={{ willChange: 'transform, box-shadow' }}
      >
        <ShoppingCart size={17} strokeWidth={1.8} />
        Get a Cloud PC
      </motion.button>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="text-text-muted text-[11px]"
      >
        No subscription yet.{' '}
        <button onClick={onClick} className="text-accent-cyan hover:underline cursor-pointer">
          View plans
        </button>
      </motion.p>
    </div>
  )
}

export default App
