#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# Runs as root, creates 'pegasus' non-root user for the desktop session.

MARKER="/workspace/.pegasus-kde-ready"
PEGASUS_USER="pegasus"

# Ensure /workspace exists (RunPod mounts a volume here; Vast.ai just uses the disk)
mkdir -p /workspace

# ── Install desktop if packages missing ────────────────────────────────────────
if [ ! -f "$MARKER" ] || ! command -v vncserver >/dev/null 2>&1; then
    echo "[pegasus] Installing KDE Plasma desktop..."
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        dbus-x11 \
        kde-plasma-desktop konsole \
        tigervnc-standalone-server \
        novnc python3-websockify \
        curl ca-certificates sudo

    # noVNC: serve vnc.html directly
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] Desktop setup complete."
fi

# ── Steam — install if missing ──────────────────────────────────────────────────
if ! command -v steam >/dev/null 2>&1; then
    echo "[pegasus] Installing Steam..."
    export DEBIAN_FRONTEND=noninteractive
    dpkg --add-architecture i386 || true
    apt-get update -qq || true
    # Install 32-bit libs Steam needs
    apt-get install -y libc6:i386 libgl1:i386 2>/dev/null || true
    curl -fsSL -o /tmp/steam.deb \
        https://cdn.akamai.steamstatic.com/client/installer/steam.deb || true
    dpkg -i /tmp/steam.deb || true
    apt-get install -fy -qq || true
    rm -f /tmp/steam.deb
    echo "[pegasus] Steam install done."
fi

# ── Every boot ─────────────────────────────────────────────────────────────────
# Enable user namespaces — required by Steam's sandbox (Proton/bubblewrap)
sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true

# Allow bubblewrap (Steam's sandbox tool) to create namespaces via setuid.
# Needed when the Docker seccomp profile blocks unshare(CLONE_NEWUSER).
command -v bwrap >/dev/null 2>&1 && chmod u+s /usr/bin/bwrap 2>/dev/null || true

# Ensure non-root user exists
id -u "$PEGASUS_USER" &>/dev/null || useradd -m -s /bin/bash "$PEGASUS_USER"

# Passwordless sudo so user can install packages from the desktop
echo "$PEGASUS_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/pegasus
chmod 440 /etc/sudoers.d/pegasus

# Workspace permissions
chown "$PEGASUS_USER":"$PEGASUS_USER" /workspace 2>/dev/null || true

# VNC xstartup — re-create every boot in case container disk was reset
mkdir -p /home/"$PEGASUS_USER"/.vnc
printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startplasma-x11\n' \
    > /home/"$PEGASUS_USER"/.vnc/xstartup
chmod +x /home/"$PEGASUS_USER"/.vnc/xstartup
chown -R "$PEGASUS_USER":"$PEGASUS_USER" /home/"$PEGASUS_USER"

echo "[pegasus] Starting TigerVNC as $PEGASUS_USER on :1..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

su - "$PEGASUS_USER" -c "HOME=/home/$PEGASUS_USER vncserver -kill :1 2>/dev/null" || true
su - "$PEGASUS_USER" -c "HOME=/home/$PEGASUS_USER vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes None"

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
exec python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901
