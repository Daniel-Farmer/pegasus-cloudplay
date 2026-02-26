#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# On first boot: installs all packages (~10 min).
# On resume: skips install (marker exists), starts services in ~30 sec.
set -e

MARKER="/workspace/.pegasus-ready"

# ── First boot only ────────────────────────────────────────────────────────────
if [ ! -f "$MARKER" ]; then
    echo "[pegasus] First boot — installing desktop + Steam (~10 min)..."
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        tini \
        dbus-x11 x11-utils x11-xserver-utils \
        xfce4 xfce4-terminal \
        tigervnc-standalone-server \
        novnc python3-websockify \
        curl wget ca-certificates

    # Steam needs i386 for 32-bit runtime and older games
    dpkg --add-architecture i386
    apt-get update -qq
    wget -qO /tmp/steam.deb \
        https://cdn.akamai.steamstatic.com/client/installer/steam.deb
    dpkg -i /tmp/steam.deb || true
    apt-get install -fy -qq
    rm -f /tmp/steam.deb

    # VNC xstartup — launches XFCE on connect
    mkdir -p /root/.vnc
    printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec startxfce4\n' \
        > /root/.vnc/xstartup
    chmod +x /root/.vnc/xstartup

    # noVNC: serve /vnc.html directly (app skips the redirect page)
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    # Steam autostart on desktop login
    mkdir -p /root/.config/autostart
    printf '[Desktop Entry]\nType=Application\nName=Steam\nExec=steam -silent\nHidden=false\n' \
        > /root/.config/autostart/steam.desktop

    touch "$MARKER"
    echo "[pegasus] Setup complete — starting services..."
fi

# ── Every boot ─────────────────────────────────────────────────────────────────
echo "[pegasus] Setting VNC password..."
mkdir -p /root/.vnc
echo "${VNC_PW:-pegasus}" | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

echo "[pegasus] Starting TigerVNC on :1..."
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
vncserver -kill :1 2>/dev/null || true
vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes VncAuth

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
exec python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901
