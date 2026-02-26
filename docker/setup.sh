#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# Runs as root, creates 'pegasus' non-root user for the desktop session.
# Steam and other apps require a non-root user to run.

MARKER="/workspace/.pegasus-kde-ready"
USER="pegasus"

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

    # noVNC: serve vnc.html directly (skips Lite/Full redirect page)
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] Desktop setup complete."
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
# Ensure non-root user exists (Steam and most apps refuse to run as root)
id -u "$USER" &>/dev/null || useradd -m -s /bin/bash "$USER"

# Ensure workspace is writable by the user (Steam library, saves, etc.)
chown "$USER":"$USER" /workspace 2>/dev/null || true

# VNC xstartup — re-create on every boot in case container disk was reset
mkdir -p /home/"$USER"/.vnc
printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startplasma-x11\n' \
    > /home/"$USER"/.vnc/xstartup
chmod +x /home/"$USER"/.vnc/xstartup
chown -R "$USER":"$USER" /home/"$USER"

echo "[pegasus] Starting TigerVNC as $USER on :1 (no password)..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

# Kill any existing VNC server
su - "$USER" -c "vncserver -kill :1 2>/dev/null" || true

# Start VNC as non-root user — no password (RunPod HTTPS proxy is the boundary)
su - "$USER" -c "vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes None"

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
exec python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901
