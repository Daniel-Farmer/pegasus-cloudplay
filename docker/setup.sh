#!/bin/bash
# Pegasus CloudPlay — onstart setup script.
# Fetched and run by Vast.ai on every boot from a base ubuntu:22.04 image.
# Installs desktop, Steam, VNC, then runs the desktop as non-root 'pegasus' user.

set -e

MARKER="/workspace/.pegasus-desktop-ready"
PEGASUS_USER="pegasus"

mkdir -p /workspace
export DEBIAN_FRONTEND=noninteractive
dpkg --configure -a 2>/dev/null || true

# ── Install desktop + dependencies if missing ────────────────────────────────
if [ ! -f "$MARKER" ] || ! command -v vncserver >/dev/null 2>&1; then
    echo "[pegasus] Installing desktop environment..."

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        software-properties-common \
        curl ca-certificates sudo \
        dbus-x11 x11-utils x11-xserver-utils \
        xfce4 xfce4-terminal thunar \
        tigervnc-standalone-server \
        novnc python3-websockify \
        policykit-1 \
        uidmap bubblewrap \
        virtualgl

    # noVNC: serve vnc.html directly
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] Desktop setup complete."
fi

# ── Steam — install if missing ───────────────────────────────────────────────
if [ ! -f /usr/bin/steam ]; then
    echo "[pegasus] Installing Steam..."
    dpkg --add-architecture i386 || true
    apt-get update -qq || true
    apt-get install -y libc6:i386 libgl1:i386 2>/dev/null || true
    curl -fsSL -o /tmp/steam.deb \
        https://cdn.akamai.steamstatic.com/client/installer/steam.deb || true
    dpkg -i /tmp/steam.deb || true
    apt-get install -fy -qq || true
    rm -f /tmp/steam.deb
    echo "[pegasus] Steam install done."
fi

# ── Create non-root user ────────────────────────────────────────────────────
# Steam refuses to run as root. The desktop session runs as 'pegasus' (UID 1000).
id -u "$PEGASUS_USER" &>/dev/null || useradd -m -s /bin/bash -G video "$PEGASUS_USER"
echo "$PEGASUS_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/pegasus
chmod 440 /etc/sudoers.d/pegasus

# ── Namespace config for Steam sandbox ───────────────────────────────────────
# Enable unprivileged user namespaces (best-effort — may be read-only on Vast.ai)
echo 1 > /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || true
echo 15000 > /proc/sys/user/max_user_namespaces 2>/dev/null || true
sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true

# SUID on bwrap — allows non-root users to create sandboxed namespaces
command -v bwrap >/dev/null 2>&1 && chmod u+s /usr/bin/bwrap 2>/dev/null || true

# subuid/subgid mappings for newuidmap/newgidmap
grep -q "^${PEGASUS_USER}:" /etc/subuid 2>/dev/null || echo "${PEGASUS_USER}:100000:65536" >> /etc/subuid
grep -q "^${PEGASUS_USER}:" /etc/subgid 2>/dev/null || echo "${PEGASUS_USER}:100000:65536" >> /etc/subgid

# ── GPU device permissions ───────────────────────────────────────────────────
# Vast.ai mounts NVIDIA devices at runtime; ensure pegasus can access them
for dev in /dev/nvidia* /dev/dri/*; do
    [ -e "$dev" ] && chmod 666 "$dev" 2>/dev/null || true
done

# ── Workspace permissions ────────────────────────────────────────────────────
chown "$PEGASUS_USER":"$PEGASUS_USER" /workspace 2>/dev/null || true

# ── VNC setup for pegasus ────────────────────────────────────────────────────
mkdir -p /home/$PEGASUS_USER/.vnc
chmod 700 /home/$PEGASUS_USER/.vnc

printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startxfce4\n' \
    > /home/$PEGASUS_USER/.vnc/xstartup
chmod +x /home/$PEGASUS_USER/.vnc/xstartup

echo "${VNC_PW:-pegasus}" | vncpasswd -f > /home/$PEGASUS_USER/.vnc/passwd
chmod 600 /home/$PEGASUS_USER/.vnc/passwd

chown -R $PEGASUS_USER:$PEGASUS_USER /home/$PEGASUS_USER/.vnc

# ── Steam autostart ─────────────────────────────────────────────────────────
mkdir -p /home/$PEGASUS_USER/.config/autostart
cat > /home/$PEGASUS_USER/.config/autostart/steam.desktop << 'DESKTOP'
[Desktop Entry]
Type=Application
Name=Steam
Exec=env STEAM_RUNTIME_PREFER_HOST_LIBRARIES=0 PRESSURE_VESSEL_FILESYSTEMS_RO=/ vglrun -d egl:/dev/nvidia0 steam -silent -no-cef-sandbox
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
DESKTOP
chown -R $PEGASUS_USER:$PEGASUS_USER /home/$PEGASUS_USER/.config

# ── D-Bus + polkit ───────────────────────────────────────────────────────────
mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true
sleep 1
/usr/lib/polkit-1/polkitd --no-debug &>/dev/null &

# ── Start VNC as pegasus ─────────────────────────────────────────────────────
echo "[pegasus] Starting TigerVNC as $PEGASUS_USER on :1..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true
su - $PEGASUS_USER -c "vncserver -kill :1 2>/dev/null" || true

su - $PEGASUS_USER -c "
    export DISPLAY=:1
    vncserver :1 \
        -geometry 1920x1080 \
        -depth 24 \
        -rfbport 5901 \
        -SecurityTypes VncAuth
"

sleep 2

# ── Start noVNC ──────────────────────────────────────────────────────────────
echo "[pegasus] Starting noVNC on port 6901..."
while true; do
    python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901 2>&1 | tee -a /workspace/novnc.log
    echo "[pegasus] noVNC exited at $(date), restarting in 5s..."
    sleep 5
done
