import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface CloudPCViewProps {
  streamUrl: string
  onBack: () => void
}

type WebviewEl = HTMLElement & { executeJavaScript: (code: string) => Promise<unknown> }

const isElectron = typeof (window as any).electronAPI !== 'undefined'
const api = (window as any).electronAPI as {
  enterCloudPC: () => void
  exitCloudPC: () => void
} | undefined

function CloudPCView({ streamUrl, onBack }: CloudPCViewProps): JSX.Element {
  const webviewRef = useRef<WebviewEl>(null)

  // Maximize window on mount, restore on unmount (Electron only)
  useEffect(() => {
    api?.enterCloudPC()
    return () => api?.exitCloudPC()
  }, [])

  // Electron webview: auto-fill VNC password + forward console
  useEffect(() => {
    if (!isElectron) return
    const wv = webviewRef.current
    if (!wv) return

    const onDomReady = () => {
      wv.executeJavaScript(`
        (function() {
          function tryFill() {
            var pw = document.getElementById('noVNC_password_input') ||
                     document.querySelector('input[type=password]');
            if (pw && pw.offsetParent !== null) {
              pw.value = 'pegasus';
              var btn = document.getElementById('noVNC_credentials_button') ||
                        document.getElementById('noVNC_connect_button');
              if (btn) btn.click();
              return true;
            }
            return false;
          }
          if (!tryFill()) {
            var obs = new MutationObserver(function() {
              if (tryFill()) obs.disconnect();
            });
            obs.observe(document.body, {
              childList: true, subtree: true,
              attributeFilter: ['class', 'style', 'display']
            });
          }
        })();
      `).catch(() => {})
    }

    const onConsole = (e: Event) => {
      const msg = (e as any).message
      if (msg) console.log('[noVNC]', msg)
    }

    wv.addEventListener('dom-ready', onDomReady)
    wv.addEventListener('console-message', onConsole)
    return () => {
      wv.removeEventListener('dom-ready', onDomReady)
      wv.removeEventListener('console-message', onConsole)
    }
  }, [streamUrl])

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Minimal top bar */}
      <div
        className="drag-region h-8 flex items-center justify-between px-4 shrink-0"
        style={{ background: 'rgba(0,0,0,0.85)' }}
      >
        <span className="text-white/40 text-[11px] select-none">Pegasus Cloud</span>
        <button
          onClick={onBack}
          className="no-drag text-white/40 hover:text-white text-[11px] transition-colors cursor-pointer"
        >
          ← Back
        </button>
      </div>

      {/* Stream view — webview in Electron, iframe in browser */}
      {streamUrl ? (
        isElectron ? (
          <webview
            ref={webviewRef as unknown as RefObject<HTMLElement>}
            src={streamUrl}
            className="flex-1 w-full"
            allowpopups
          />
        ) : (
          <iframe
            src={streamUrl}
            className="flex-1 w-full border-0"
            allow="fullscreen"
          />
        )
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-[13px]">Connecting…</p>
        </div>
      )}
    </div>
  )
}

export default CloudPCView
