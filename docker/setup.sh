#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# On first boot: installs KDE Plasma desktop (~10-15 min).
# On resume: skips install (marker exists), starts services in ~30 sec.

MARKER="/workspace/.pegasus-kde-ready"

# ── First boot only ────────────────────────────────────────────────────────────
if [ ! -f "$MARKER" ]; then
    echo "[pegasus] First boot — installing KDE Plasma desktop..."
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        dbus-x11 \
        kde-plasma-desktop konsole \
        tigervnc-standalone-server \
        novnc python3-websockify \
        wget curl ca-certificates

    # VNC xstartup — launches KDE Plasma on connect
    mkdir -p /root/.vnc
    printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startplasma-x11\n' \
        > /root/.vnc/xstartup
    chmod +x /root/.vnc/xstartup

    # noVNC: serve vnc.html directly (skips Lite/Full redirect page)
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] KDE Plasma setup complete."
fi

# ── Steam — install if missing (runs on every boot if needed) ──────────────────
if ! command -v steam >/dev/null 2>&1; then
    echo "[pegasus] Steam not found — installing..."
    export DEBIAN_FRONTEND=noninteractive
    dpkg --add-architecture i386 || true
    apt-get update -qq || true
    wget -qO /tmp/steam.deb \
        https://cdn.akamai.steamstatic.com/client/installer/steam.deb || true
    dpkg -i /tmp/steam.deb || true
    apt-get install -fy -qq || true
    rm -f /tmp/steam.deb
    echo "[pegasus] Steam install done."
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

echo "[pegasus] Starting noVNC on port 6901...")
exec python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901
