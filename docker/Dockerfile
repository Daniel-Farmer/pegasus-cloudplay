FROM ubuntu:22.04

# NVIDIA Container Runtime injects the host GPU driver libs at runtime.
# Never bake NVIDIA drivers into the image — they must match the host kernel.
ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=all

ENV DEBIAN_FRONTEND=noninteractive
ENV VNC_PW=pegasus
ENV DISPLAY=:1
ENV HOME=/root
ENV USER=root

# ── System packages ────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
        tini \
        dbus-x11 x11-utils x11-xserver-utils \
        xfce4 xfce4-terminal thunar \
        tigervnc-standalone-server \
        novnc python3-websockify \
        virtualgl \
        curl wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ── Steam ─────────────────────────────────────────────────────────────────────
# i386 architecture required for Steam's 32-bit runtime and older games
RUN dpkg --add-architecture i386 \
    && apt-get update \
    && wget -qO /tmp/steam.deb \
         https://cdn.akamai.steamstatic.com/client/installer/steam.deb \
    && dpkg -i /tmp/steam.deb; apt-get install -fy \
    && rm /tmp/steam.deb \
    && rm -rf /var/lib/apt/lists/*

# ── VNC ───────────────────────────────────────────────────────────────────────
RUN mkdir -p /root/.vnc && chmod 700 /root/.vnc

# xstartup: launched by vncserver to start the desktop session
RUN printf '#!/bin/bash\nexport XDG_SESSION_TYPE=x11\nexec startxfce4\n' \
    > /root/.vnc/xstartup && chmod +x /root/.vnc/xstartup

# ── noVNC ─────────────────────────────────────────────────────────────────────
# App loads /vnc.html directly (skips the redirect landing page)
RUN ln -sf /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# ── Steam autostart on desktop login ──────────────────────────────────────────
# vglrun -d egl:/dev/nvidia0: routes OpenGL to the NVIDIA GPU via EGL.
# This uses /dev/nvidia0 (available in RunPod) rather than /dev/dri (not available).
RUN mkdir -p /root/.config/autostart
COPY steam.desktop /root/.config/autostart/steam.desktop

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 6901

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/start.sh"]
