#!/bin/bash
set -e

echo "[pegasus] ===== Pegasus CloudPlay starting ====="

# ── Phase 1: Privileged setup (runs as root) ─────────────────────────────────

# Enable unprivileged user namespaces (best-effort — may be read-only on Vast.ai)
echo 1 > /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || true
echo 15000 > /proc/sys/user/max_user_namespaces 2>/dev/null || true
sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true

# Re-apply SUID on bwrap (container runtime may strip it between restarts)
chmod u+s /usr/bin/bwrap 2>/dev/null || true

# Ensure workspace is writable by pegasus (persists across Vast.ai restarts)
chown pegasus:pegasus /workspace 2>/dev/null || true

# Ensure pegasus can access NVIDIA devices (mounted at runtime by Vast.ai)
for dev in /dev/nvidia* /dev/dri/*; do
    [ -e "$dev" ] && chmod 666 "$dev" 2>/dev/null || true
done

# Start D-Bus system daemon (required by polkit, which Steam needs)
mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true
sleep 1

# Start polkit daemon
/usr/lib/polkit-1/polkitd --no-debug &>/dev/null &

# ── Phase 2: VNC setup for pegasus ───────────────────────────────────────────

echo "[pegasus] Setting VNC password..."
mkdir -p /home/pegasus/.vnc && chmod 700 /home/pegasus/.vnc
echo "${VNC_PW:-pegasus}" | vncpasswd -f > /home/pegasus/.vnc/passwd
chmod 600 /home/pegasus/.vnc/passwd
chown -R pegasus:pegasus /home/pegasus/.vnc

# Clean up stale VNC state
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
su - pegasus -c "vncserver -kill :1 2>/dev/null" || true

# ── Phase 3: Start VNC as pegasus ────────────────────────────────────────────

echo "[pegasus] Starting TigerVNC as pegasus on :1 (port 5901)..."
su - pegasus -c "
    export DISPLAY=:1
    vncserver :1 \
        -geometry 1920x1080 \
        -depth 24 \
        -rfbport 5901 \
        -SecurityTypes VncAuth
"

# Give XFCE a moment to initialize before noVNC connects
sleep 3

# ── Phase 4: Start noVNC (runs as root — just a WebSocket proxy) ─────────────

echo "[pegasus] Starting noVNC WebSocket bridge on port 6901..."
exec python3 -m websockify \
    --web=/usr/share/novnc \
    6901 \
    localhost:5901
