FROM ubuntu:22.04

# NVIDIA Container Runtime injects the host GPU driver libs at runtime.
# Never bake NVIDIA drivers into the image — they must match the host kernel.
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all

ENV DEBIAN_FRONTEND=noninteractive
ENV VNC_PW=pegasus
ENV DISPLAY=:1
ENV HOME=/home/pegasus
ENV USER=pegasus

# ── System packages ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        tini sudo \
        dbus-x11 x11-utils x11-xserver-utils \
        xfce4 xfce4-terminal thunar \
        tigervnc-standalone-server \
        novnc python3-websockify \
        virtualgl \
        curl wget ca-certificates \
        policykit-1 \
        uidmap bubblewrap gcc \
    && rm -rf /var/lib/apt/lists/*

# ── Steam ──────────────────────────────────────────────────────────────────────
# i386 architecture required for Steam's 32-bit runtime and older games
RUN dpkg --add-architecture i386 \
    && apt-get update \
    && wget -qO /tmp/steam.deb \
         https://cdn.akamai.steamstatic.com/client/installer/steam.deb \
    && dpkg -i /tmp/steam.deb; apt-get install -fy \
    && rm /tmp/steam.deb \
    && rm -rf /var/lib/apt/lists/*

# ── Non-root user ─────────────────────────────────────────────────────────────
# Steam refuses to run as root. The desktop session runs as 'pegasus' (UID 1000).
# Container still starts as root so start.sh can do privileged runtime setup.
RUN useradd -m -s /bin/bash -G video pegasus \
    && echo "pegasus ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/pegasus \
    && chmod 440 /etc/sudoers.d/pegasus

# ── Namespace pre-config for Steam sandbox ─────────────────────────────────────
# subuid/subgid mappings for newuidmap/newgidmap (used by Steam's bubblewrap)
RUN echo "pegasus:100000:65536" >> /etc/subuid \
    && echo "pegasus:100000:65536" >> /etc/subgid

# SUID on bwrap — allows non-root users to create sandboxed namespaces
RUN chmod u+s /usr/bin/bwrap 2>/dev/null || true

# ── LD_PRELOAD shim (emergency fallback only) ─────────────────────────────────
# Fakes getuid()/geteuid() to return 1000. Only used if running as root is
# unavoidable for some future reason. Not loaded by default.
RUN printf '#include <sys/types.h>\n\
uid_t getuid(void)  { return 1000; }\n\
uid_t geteuid(void) { return 1000; }\n\
gid_t getgid(void)  { return 1000; }\n\
gid_t getegid(void) { return 1000; }\n' > /tmp/steamuid.c \
    && gcc -shared -fPIC -nostartfiles -o /usr/local/lib/steamuid.so /tmp/steamuid.c \
    && rm -f /tmp/steamuid.c

# ── VNC for pegasus user ──────────────────────────────────────────────────────
RUN mkdir -p /home/pegasus/.vnc && chmod 700 /home/pegasus/.vnc
RUN printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec dbus-launch --exit-with-session startxfce4\n' \
    > /home/pegasus/.vnc/xstartup && chmod +x /home/pegasus/.vnc/xstartup

# ── Steam autostart in pegasus XFCE session ───────────────────────────────────
RUN mkdir -p /home/pegasus/.config/autostart
COPY steam.desktop /home/pegasus/.config/autostart/steam.desktop

# ── noVNC ──────────────────────────────────────────────────────────────────────
RUN ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# ── Workspace for game storage ─────────────────────────────────────────────────
RUN mkdir -p /workspace && chown pegasus:pegasus /workspace

# ── Fix ownership ──────────────────────────────────────────────────────────────
RUN chown -R pegasus:pegasus /home/pegasus

# ── Entrypoint ─────────────────────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 6901

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/start.sh"]
