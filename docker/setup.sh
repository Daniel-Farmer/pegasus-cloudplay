#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# On first boot: installs desktop environment (~5-10 min).
# On resume: skips install (marker exists), starts services in ~30 sec.
# NOTE: no set -e — script must always reach the service-start section.

MARKER="/workspace/.pegasus-ready"

# ── First boot only ────────────────────────────────────────────────────────────
if [ ! -f "$MARKER" ]; then
    echo "[pegasus] First boot — installing desktop environment..."
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        dbus-x11 \
        xfce4 xfce4-terminal \
        tigervnc-standalone-server \
        novnc python3-websockify

    # VNC xstartup — launches XFCE on connect
    mkdir -p /root/.vnc
    printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec startxfce4\n' > /root/.vnc/xstartup
    chmod +x /root/.vnc/xstartup

    # noVNC: serve vnc.html directly (skips the Lite/Full redirect page)
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] Desktop setup complete."
fi

# ── Every boot ─────────────────────────────────────────────────────────────────
echo "[pegasus] Starting TigerVNC on :1 (no password)..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
vncserver -kill :1 2>/dev/null || true

# No VNC password — RunPod HTTPS proxy is the access boundary
vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes None

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
exec python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901
