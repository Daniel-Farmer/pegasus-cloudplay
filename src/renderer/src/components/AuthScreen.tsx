import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import TitleBar from './TitleBar'

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: 'easeOut' }
})

function AuthScreen(): JSX.Element {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'discord' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Listen for OAuth callback from main process (protocol handler)
  useEffect(() => {
    const unsub = window.electronAPI.onAuthCallback(async (url) => {
      try {
        // Parse pegasus://auth-callback#access_token=...&refresh_token=...
        const parsed = new URL(url.replace(/^pegasus:\/\//, 'https://x/'))
        const hash = new URLSearchParams(parsed.hash.slice(1))
        const access_token = hash.get('access_token')
        const refresh_token = hash.get('refresh_token')
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) setError(error.message)
        } else {
          setError('Auth failed: no tokens in callback.')
        }
      } catch {
        setError('Auth callback failed.')
      }
    })
    return unsub
  }, [])

  async function handleOAuth(provider: 'google' | 'discord'): Promise<void> {
    setOauthLoading(provider)
    setError(null)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'pegasus://auth-callback',
        skipBrowserRedirect: true,
      }
    })
    if (error) { setError(error.message); setOauthLoading(null); return }
    if (data.url) window.electronAPI.openExternal(data.url)
    setOauthLoading(null)
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-bg-base flex flex-col overflow-hidden">
      {/* Ambient glow — same as HeroSection */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse 60% 70% at 30% 60%, rgba(124,58,237,0.07) 0%, transparent 65%)',
            'radial-gradient(ellipse 40% 50% at 75% 35%, rgba(6,182,212,0.05) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <TitleBar />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 gap-7">

        {/* Wordmark */}
        <motion.div {...fadeUp(0)} className="text-center">
          <h1 className="text-text-primary text-[22px] font-bold tracking-tight">
            Pegasus <span className="text-gradient-accent">Cloud</span>
          </h1>
          <p className="text-text-muted text-[11px] mt-1.5 tracking-wide uppercase">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </motion.div>

        <div className="w-full max-w-[300px] flex flex-col gap-3">

          {/* SSO buttons */}
          <motion.div {...fadeUp(0.08)} className="flex flex-col gap-2">
            <SSOButton
              onClick={() => {}}
              loading={false}
              disabled
              icon={<GoogleIcon />}
              label="Continue with Google"
            />
            <SSOButton
              onClick={() => handleOAuth('discord')}
              loading={oauthLoading === 'discord'}
              icon={<DiscordIcon />}
              label="Continue with Discord"
            />
          </motion.div>

          {/* Divider */}
          <motion.div {...fadeUp(0.14)} className="flex items-center gap-3">
            <div className="flex-1 h-px bg-bg-border/60" />
            <span className="text-text-muted text-[10px] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-bg-border/60" />
          </motion.div>

          {/* Email / password */}
          <motion.form {...fadeUp(0.18)} onSubmit={handleSubmit} className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-lg bg-bg-elevated border border-bg-border text-text-primary text-[12px] placeholder:text-text-muted outline-none focus:border-accent-purple/50 transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full h-9 px-3 rounded-lg bg-bg-elevated border border-bg-border text-text-primary text-[12px] placeholder:text-text-muted outline-none focus:border-accent-purple/50 transition-colors"
            />

            {error && <p className="text-red-400 text-[11px] px-0.5">{error}</p>}
            {message && <p className="text-accent-cyan text-[11px] px-0.5">{message}</p>}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-0.5 h-9 rounded-lg bg-gradient-accent text-white font-semibold text-[12px] tracking-wide cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </motion.button>
          </motion.form>

          <motion.p {...fadeUp(0.24)} className="text-center text-text-muted text-[11px]">
            {mode === 'login' ? "No account? " : 'Already signed up? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null) }}
              className="text-accent-cyan hover:underline cursor-pointer"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </motion.p>
        </div>
      </div>
    </div>
  )
}

function SSOButton({
  onClick, loading, disabled, icon, label, tag
}: {
  onClick: () => void
  loading: boolean
  disabled?: boolean
  icon: React.ReactNode
  label: string
  tag?: string
}): JSX.Element {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className="w-full h-9 flex items-center justify-center gap-2.5 rounded-lg bg-bg-elevated border border-bg-border text-text-secondary text-[12px] font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer hover:enabled:border-bg-border/80 hover:enabled:bg-bg-elevated/80"
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border border-text-muted border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {label}
      {tag && (
        <span className="ml-auto text-[9px] uppercase tracking-wider text-text-muted bg-bg-base px-1.5 py-0.5 rounded-full border border-bg-border/60">
          {tag}
        </span>
      )}
    </motion.button>
  )
}

function GoogleIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function DiscordIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  )
}

export default AuthScreen