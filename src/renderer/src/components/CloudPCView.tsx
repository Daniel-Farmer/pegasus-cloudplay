import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface CloudPCViewProps {
  streamUrl: string
  onBack: () => void
}

type WebviewEl = HTMLElement & { executeJavaScript: (code: string) => Promise<unknown> }

function CloudPCView({ streamUrl, onBack }: CloudPCViewProps): JSX.Element {
  const webviewRef = useRef<WebviewEl>(null)

  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const autoFillPassword = () => {
      // noVNC v1.4+ removed ?password= URL param. Use MutationObserver to detect
      // when the credential dialog appears and fill it instantly.
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

    wv.addEventListener('dom-ready', autoFillPassword)
    return () => wv.removeEventListener('dom-ready', autoFillPassword)
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
          Disconnect ✕
        </button>
      </div>

      {/* Full-screen webview */}
      {streamUrl ? (
        <webview
          ref={webviewRef as unknown as RefObject<HTMLElement>}
          src={streamUrl}
          className="flex-1 w-full"
          allowpopups
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/30 text-[13px]">Connecting…</p>
        </div>
      )}
    </div>
  )
}

export default CloudPCView
