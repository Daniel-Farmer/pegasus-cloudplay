#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# Runs as root, creates 'pegasus' non-root user for the desktop session.

MARKER="/workspace/.pegasus-kde-ready"
PEGASUS_USER="pegasus"

# Ensure /workspace exists (RunPod mounts a volume here; Vast.ai just uses the disk)
mkdir -p /workspace

# ── Recover from any interrupted dpkg state ────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
dpkg --configure -a 2>/dev/null || true

# ── Install desktop if packages missing ────────────────────────────────────────
if [ ! -f "$MARKER" ] || ! command -v vncserver >/dev/null 2>&1; then
    echo "[pegasus] Installing KDE Plasma desktop..."

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        dbus-x11 \
        kde-plasma-desktop konsole \
        tigervnc-standalone-server \
        novnc python3-websockify \
        curl ca-certificates sudo \
        policykit-1

    # noVNC: serve vnc.html directly
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    # ── Win11OS-dark KDE theme ──────────────────────────────────────────────────
    apt-get install -y --no-install-recommends git qt5-style-kvantum 2>/dev/null || true
    # Clone and install as the pegasus user (creates ~/.local/share/plasma/...)
    id -u "$PEGASUS_USER" &>/dev/null || useradd -m -s /bin/bash "$PEGASUS_USER"
    su - "$PEGASUS_USER" -c "
        HOME=/home/$PEGASUS_USER
        git clone --depth=1 https://github.com/yeyushengfan258/Win11OS-kde /tmp/Win11OS-kde 2>/dev/null || true
        if [ -f /tmp/Win11OS-kde/install.sh ]; then
            cd /tmp/Win11OS-kde && bash install.sh -d 2>/dev/null || true
        fi
        rm -rf /tmp/Win11OS-kde
        # Write theme into KDE config so it loads on first plasma start
        kwriteconfig5 --file kdeglobals --group KDE \
            --key LookAndFeelPackage 'com.github.yeyushengfan258.Win11OS-dark' 2>/dev/null || true
    " || true

    touch "$MARKER"
    echo "[pegasus] Desktop setup complete."
fi

# ── Steam — install if missing ──────────────────────────────────────────────────
if ! command -v steam >/dev/null 2>&1; then
    echo "[pegasus] Installing Steam..."
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

# Disable KWallet (no password prompts) and screen locker — re-apply every boot
su - "$PEGASUS_USER" -c "
    HOME=/home/$PEGASUS_USER
    kwriteconfig5 --file kwalletrc --group Wallet --key Enabled false 2>/dev/null || true
    kwriteconfig5 --file kwalletrc --group Wallet --key 'First Use' false 2>/dev/null || true
    kwriteconfig5 --file kscreenlockerrc --group Daemon --key Autolock false 2>/dev/null || true
    kwriteconfig5 --file kscreenlockerrc --group Daemon --key LockOnResume false 2>/dev/null || true
" || true

chown -R "$PEGASUS_USER":"$PEGASUS_USER" /home/"$PEGASUS_USER"

# Start D-Bus system daemon + polkit (needed by Steam for package privilege escalation)
mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true
sleep 1
/usr/lib/polkit-1/polkitd --no-debug &>/dev/null &

echo "[pegasus] Starting TigerVNC as $PEGASUS_USER on :1..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

su - "$PEGASUS_USER" -c "HOME=/home/$PEGASUS_USER vncserver -kill :1 2>/dev/null" || true
su - "$PEGASUS_USER" -c "HOME=/home/$PEGASUS_USER vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes None"

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
# Loop instead of exec — if websockify exits for any reason, restart it.
# This keeps the onstart process alive so Vast.ai doesn't mark the instance stopped.
while true; do
    python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901 2>&1 | tee -a /workspace/novnc.log
    echo "[pegasus] noVNC exited at $(date), restarting in 5s..."
    sleep 5
done
