#!/bin/bash
set -e

echo "[pegasus] Setting VNC password..."
mkdir -p /root/.vnc && chmod 700 /root/.vnc
echo "${VNC_PW:-pegasus}" | vncpasswd -f > /root/.vnc/passwd
chmod 600 /root/.vnc/passwd

echo "[pegasus] Cleaning up stale VNC state..."
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
vncserver -kill :1 2>/dev/null || true

echo "[pegasus] Starting TigerVNC on display :1 (port 5901)..."
vncserver :1 \
    -geometry 1920x1080 \
    -depth 24 \
    -rfbport 5901 \
    -SecurityTypes VncAuth

# Give XFCE a moment to initialize before Steam autostart fires
sleep 3

echo "[pegasus] Starting noVNC WebSocket bridge on port 6901..."
exec python3 -m websockify \
    --web=/usr/share/novnc \
    6901 \
    localhost:5901
