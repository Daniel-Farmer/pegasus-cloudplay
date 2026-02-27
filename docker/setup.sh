#!/bin/bash
# Self-contained setup + start script for Pegasus CloudPlay.
# Runs as root, creates 'pegasus' non-root user for the desktop session.

MARKER="/workspace/.pegasus-desktop-ready"
PEGASUS_USER="pegasus"

# Ensure /workspace exists
mkdir -p /workspace

# ── Recover from any interrupted dpkg state ────────────────────────────────────
export DEBIAN_FRONTEND=noninteractive
dpkg --configure -a 2>/dev/null || true

# ── Install desktop if packages missing ────────────────────────────────────────
if [ ! -f "$MARKER" ] || ! command -v vncserver >/dev/null 2>&1; then
    echo "[pegasus] Installing Zorin OS Lite desktop..."

    apt-get update -qq
    apt-get install -y --no-install-recommends \
        software-properties-common \
        curl ca-certificates sudo \
        dbus-x11 \
        tigervnc-standalone-server \
        novnc python3-websockify \
        policykit-1

    # Add Zorin OS official PPAs
    add-apt-repository -y ppa:zorinos/stable
    add-apt-repository -y ppa:zorinos/patches
    apt-get update -qq

    # Install Zorin OS Lite desktop (XFCE-based)
    apt-get install -y zorin-os-lite-desktop

    # uidmap provides newuidmap/newgidmap setuid helpers — needed for Steam namespaces
    apt-get install -y --no-install-recommends uidmap gcc 2>/dev/null || true

    # Compile a tiny LD_PRELOAD shim — makes Steam think it's running as UID 1000
    # (Steam refuses to launch as root; the shim fakes getuid/geteuid while the
    #  process remains root so user-namespace creation still works)
    cat > /tmp/steamuid.c << 'CSRC'
#include <sys/types.h>
uid_t getuid(void)  { return 1000; }
uid_t geteuid(void) { return 1000; }
gid_t getgid(void)  { return 1000; }
gid_t getegid(void) { return 1000; }
CSRC
    gcc -shared -fPIC -nostartfiles -o /usr/local/lib/steamuid.so /tmp/steamuid.c 2>/dev/null || true
    rm -f /tmp/steamuid.c

    # Steam wrapper — shadows /usr/bin/steam, injects the UID shim
    cat > /usr/local/bin/steam << 'WRAPPER'
#!/bin/bash
export LD_PRELOAD=/usr/local/lib/steamuid.so
export HOME=/root
exec /usr/bin/steam "$@"
WRAPPER
    chmod +x /usr/local/bin/steam

    # noVNC: serve vnc.html directly
    ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

    touch "$MARKER"
    echo "[pegasus] Zorin OS desktop setup complete."
fi

# ── Steam — install if missing ──────────────────────────────────────────────────
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

# ── Every boot ─────────────────────────────────────────────────────────────────
# Enable user namespaces — try every available method (Vast.ai ignores --cap-add)
echo 1 > /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || true
echo 15000 > /proc/sys/user/max_user_namespaces 2>/dev/null || true
sysctl -w kernel.unprivileged_userns_clone=1 2>/dev/null || true

# setuid on unshare + bwrap so non-root users can create namespaces (Steam check)
command -v unshare >/dev/null 2>&1 && chmod u+s /usr/bin/unshare 2>/dev/null || true
command -v bwrap   >/dev/null 2>&1 && chmod u+s /usr/bin/bwrap   2>/dev/null || true

# UID/GID mappings for pegasus — required by newuidmap/newgidmap for Steam sandbox
grep -q "^pegasus:" /etc/subuid 2>/dev/null || echo "pegasus:100000:65536" >> /etc/subuid
grep -q "^pegasus:" /etc/subgid 2>/dev/null || echo "pegasus:100000:65536" >> /etc/subgid

# Ensure non-root user exists
id -u "$PEGASUS_USER" &>/dev/null || useradd -m -s /bin/bash "$PEGASUS_USER"

# Passwordless sudo so user can install packages from the desktop
echo "$PEGASUS_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/pegasus
chmod 440 /etc/sudoers.d/pegasus

# Workspace permissions
chown "$PEGASUS_USER":"$PEGASUS_USER" /workspace 2>/dev/null || true

# VNC xstartup — run as root so Steam can create user namespaces
mkdir -p /root/.vnc
printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startxfce4\n' \
    > /root/.vnc/xstartup
chmod +x /root/.vnc/xstartup

# Disable screen locker for root session
xfconf-query -c xfce4-screensaver -p /saver/enabled -s false --create -t bool 2>/dev/null || true
xfconf-query -c xfce4-screensaver -p /lock/enabled -s false --create -t bool 2>/dev/null || true

# Start D-Bus system daemon + polkit (needed by Steam)
mkdir -p /run/dbus
dbus-daemon --system --fork 2>/dev/null || true
sleep 1
/usr/lib/polkit-1/polkitd --no-debug &>/dev/null &

echo "[pegasus] Starting TigerVNC as root on :1..."
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X1-lock /tmp/.X11-unix/X1 2>/dev/null || true

HOME=/root vncserver -kill :1 2>/dev/null || true
HOME=/root vncserver :1 -geometry 1920x1080 -depth 24 -rfbport 5901 -SecurityTypes None

sleep 2

echo "[pegasus] Starting noVNC on port 6901..."
# Loop instead of exec — if websockify exits for any reason, restart it.
while true; do
    python3 -m websockify --web=/usr/share/novnc 6901 localhost:5901 2>&1 | tee -a /workspace/novnc.log
    echo "[pegasus] noVNC exited at $(date), restarting in 5s..."
    sleep 5
done
