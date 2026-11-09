// Lecteur vidéo "protégé" basé sur YouTube.
// La vidéo YouTube est affichée sous un calque transparent : les élèves ne peuvent
// cliquer ni sur le titre, ni sur le logo, ni sur "Partager" / "Regarder sur YouTube".
// Toutes les commandes (lecture, avance, volume, vitesse, plein écran) sont les nôtres.
(function () {
  let apiPromise;
  function loadYouTubeApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (!apiPromise) {
      apiPromise = new Promise((resolve, reject) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { prev && prev(); resolve(); };
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.onerror = () => reject(new Error("YouTube bloqué"));
        document.head.appendChild(s);
        setTimeout(() => reject(new Error("YouTube ne répond pas")), 8000);
      });
      apiPromise.catch(() => { apiPromise = null; });
    }
    return apiPromise;
  }

  const fmt = (t) => {
    t = Math.max(0, Math.floor(t || 0));
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(s).padStart(2, "0");
  };

  // container : élément DOM ; videoId : identifiant YouTube ; onEnded : appelé à la fin
  async function mount(container, videoId, { onEnded } = {}) {
    container.innerHTML = `
      <div class="player paused">
        <div class="yt"><div></div></div>
        <div class="shield"></div>
        <div class="cover" style="background-image:url('https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/maxresdefault.jpg'), url('https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/sddefault.jpg')">
          <div class="big-play">▶</div><div class="cover-text"></div>
        </div>
        <div class="controls">
          <button data-play title="Lecture / Pause">▶</button>
          <span class="time" data-time>0:00 / 0:00</span>
          <input type="range" data-seek min="0" max="1000" value="0" aria-label="Avancer dans la vidéo">
          <button data-mute title="Son">🔊</button>
          <button data-speed title="Vitesse">1×</button>
          <button data-fs title="Plein écran">⛶</button>
        </div>
      </div>`;

    const root = container.querySelector(".player");
    const cover = root.querySelector(".cover");
    const coverText = root.querySelector(".cover-text");
    const playBtn = root.querySelector("[data-play]");
    const timeEl = root.querySelector("[data-time]");
    const seek = root.querySelector("[data-seek]");
    const muteBtn = root.querySelector("[data-mute]");
    const speedBtn = root.querySelector("[data-speed]");
    if (matchMedia("(hover: none)").matches) root.classList.add("touch");

    // Empêche le clic droit (copier l'URL de la vidéo…)
    root.addEventListener("contextmenu", (e) => e.preventDefault());

    try {
      await loadYouTubeApi();
    } catch (_) {
      root.querySelector(".big-play").textContent = "!";
      coverText.textContent = "Impossible de charger la vidéo ici. Sur ton site en ligne, elle se lit normalement.";
      coverText.style.cssText = "left:1rem;right:1rem;text-align:center";
      root.querySelector(".controls").remove();
      return { destroy() {} };
    }
    if (!root.isConnected) return { destroy() {} };

    let seeking = false, ticker = null, started = false;
    const speeds = [1, 1.25, 1.5, 2];

    const player = new YT.Player(root.querySelector(".yt > div"), {
      host: "https://www.youtube-nocookie.com",
      videoId,
      playerVars: {
        controls: 0, rel: 0, modestbranding: 1, disablekb: 1, fs: 0,
        iv_load_policy: 3, playsinline: 1, cc_load_policy: 0,
        vq: "hd1080", // demande la meilleure qualité disponible
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          try { player.setPlaybackQuality("hd1080"); } catch (_) {}
          update();
        },
        onStateChange: (e) => {
          const playing = e.data === YT.PlayerState.PLAYING;
          root.classList.toggle("paused", !playing);
          playBtn.textContent = playing ? "❚❚" : "▶";
          // Quand la vidéo est en pause/terminée, YouTube affiche ses suggestions :
          // on les masque avec notre propre écran.
          if (playing) {
            if (!started) { try { player.setPlaybackQuality("hd1080"); } catch (_) {} }
            started = true; cover.classList.add("hidden");
          }
          else if (e.data === YT.PlayerState.PAUSED) { cover.classList.remove("hidden"); coverText.textContent = "En pause"; }
          else if (e.data === YT.PlayerState.ENDED) {
            cover.classList.remove("hidden"); coverText.textContent = "Leçon terminée ✓ — cliquer pour revoir";
            onEnded && onEnded();
          }
          clearInterval(ticker);
          if (playing) ticker = setInterval(update, 500);
        },
      },
    });

    function update() {
      if (!player.getDuration) return;
      const d = player.getDuration() || 0, t = player.getCurrentTime() || 0;
      timeEl.textContent = `${fmt(t)} / ${fmt(d)}`;
      if (!seeking && d) seek.value = Math.round((t / d) * 1000);
    }
    function toggle() {
      if (!player.getPlayerState) return;
      const st = player.getPlayerState();
      if (st === YT.PlayerState.PLAYING) player.pauseVideo();
      else {
        if (st === YT.PlayerState.ENDED) player.seekTo(0, true);
        player.playVideo();
      }
    }

    root.querySelector(".shield").addEventListener("click", toggle);
    cover.addEventListener("click", toggle);
    playBtn.addEventListener("click", toggle);
    seek.addEventListener("input", () => { seeking = true; });
    seek.addEventListener("change", () => {
      player.seekTo((seek.value / 1000) * player.getDuration(), true);
      seeking = false;
    });
    muteBtn.addEventListener("click", () => {
      if (player.isMuted()) { player.unMute(); muteBtn.textContent = "🔊"; }
      else { player.mute(); muteBtn.textContent = "🔇"; }
    });
    speedBtn.addEventListener("click", () => {
      const next = speeds[(speeds.indexOf(player.getPlaybackRate()) + 1) % speeds.length];
      player.setPlaybackRate(next);
      speedBtn.textContent = next + "×";
    });
    root.querySelector("[data-fs]").addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    });

    return {
      destroy() { clearInterval(ticker); try { player.destroy(); } catch (_) {} },
      get started() { return started; },
    };
  }

  window.ProtectedPlayer = { mount };
})();
