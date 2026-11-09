// Outils partagés entre la page d'accueil et l'espace membre
(function () {
  const cfg = window.APP_CONFIG;

  const configured =
    !cfg.SUPABASE_URL.includes("VOTRE-PROJET") && !cfg.SUPABASE_ANON_KEY.includes("VOTRE_CLE");

  // Tant que Supabase n'est pas configuré, le site tourne en mode démo (assets/demo.js)
  const demo = !configured;
  // Retour de Google : on garde l'adresse AVANT que Supabase ne la nettoie (jeton ou erreur dedans)
  const authReturn = (() => {
    const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#\/?/, ""));
    const pick = (k) => q.get(k) || h.get(k);
    return {
      signedIn: !!(h.get("access_token") || q.get("code")),
      error: pick("error_description") || pick("error") || "",
      errorCode: pick("error_code") || pick("error") || "",
    };
  })();
  const sb = configured
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : window.DemoBackend.client;

  // Fenêtre de confirmation (remplace confirm(), bloqué sur certains hébergements)
  function confirmDialog(message, okLabel = "Confirmer") {
    return new Promise((resolve) => {
      const back = document.createElement("div");
      back.className = "modal-back";
      back.innerHTML = `
        <div class="card modal" role="dialog" aria-modal="true">
          <p></p>
          <div class="row"><button class="btn btn-sm" data-no>Annuler</button><button class="btn btn-sm btn-primary" data-yes></button></div>
        </div>`;
      back.querySelector("p").textContent = message;
      back.querySelector("[data-yes]").textContent = okLabel;
      const close = (v) => { back.remove(); resolve(v); };
      back.querySelector("[data-yes]").addEventListener("click", () => close(true));
      back.querySelector("[data-no]").addEventListener("click", () => close(false));
      back.addEventListener("click", (e) => { if (e.target === back) close(false); });
      document.body.appendChild(back);
      back.querySelector("[data-yes]").focus();
    });
  }

  // Échappe le texte saisi par les utilisateurs avant de l'afficher (anti-piratage XSS)
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function initials(name) {
    return (name || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  function avatar(profile, cls = "") {
    const name = profile?.full_name || "Membre";
    if (profile?.avatar_url && /^https:\/\//.test(profile.avatar_url)) {
      return `<img class="avatar ${cls}" src="${esc(profile.avatar_url)}" alt="" referrerpolicy="no-referrer">`;
    }
    return `<div class="avatar ${cls}">${esc(initials(name))}</div>`;
  }

  function toast(message, isError = false) {
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  // Extrait l'identifiant d'une vidéo YouTube depuis n'importe quel format de lien
  function youtubeId(input) {
    const s = String(input || "").trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/|\/v\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const fmtDateTime = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const fmtTime = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const fmtShort = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  function relTime(iso) {
    const d = new Date(iso);
    const diff = (Date.now() - d) / 1000;
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (new Date().toDateString() === d.toDateString()) return fmtTime.format(d);
    return fmtShort.format(d);
  }

  // Google refuse la connexion dans les navigateurs intégrés aux applis (TikTok, Instagram, Facebook…) :
  // erreur « 403 disallowed_useragent ». On rouvre la page dans le vrai navigateur du téléphone.
  const inAppBrowser = () => /FBAN|FBAV|FB_IAB|Instagram|musical_ly|Bytedance|TikTok|Snapchat|Line\/|; wv\)/i.test(navigator.userAgent || "");
  // Fenêtre d'aide qui reste à l'écran (un simple message disparaît trop vite sur iPhone)
  function helpDialog(title, html, actions = "") {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="card modal" role="dialog" aria-modal="true" style="max-width:420px">
        <h3 style="margin:0 0 .5rem"></h3>
        <div class="muted" style="line-height:1.55">${html}</div>
        <div class="row" style="margin-top:1rem;gap:.5rem;flex-wrap:wrap">${actions}<button class="btn btn-sm" data-close>Fermer</button></div>
      </div>`;
    back.querySelector("h3").textContent = title;
    back.addEventListener("click", (e) => { if (e.target === back || e.target.closest("[data-close]")) back.remove(); });
    document.body.appendChild(back);
    return back;
  }

  // iPhone dans TikTok / Instagram / Facebook : on ne peut pas ouvrir Safari tout seul, on guide l'élève
  function openInBrowserHelp() {
    const url = location.origin + location.pathname;
    const back = helpDialog("Ouvre la page dans Safari",
      `Google bloque la connexion à l'intérieur de TikTok, Instagram et Facebook.<br><br>
       <strong>1.</strong> Appuie sur <strong>···</strong> ou <strong>↗</strong> (en haut ou en bas de l'écran)<br>
       <strong>2.</strong> Choisis <strong>« Ouvrir dans le navigateur »</strong> (Safari)<br>
       <strong>3.</strong> Clique à nouveau sur « Se connecter avec Google »<br><br>
       Tu ne trouves pas ? Copie le lien ci-dessous et colle-le dans Safari.`,
      `<button class="btn btn-sm btn-primary" data-copy>📋 Copier le lien</button>`);
    back.querySelector("[data-copy]").addEventListener("click", async (e) => {
      try { await navigator.clipboard.writeText(url); e.target.textContent = "✓ Lien copié, colle-le dans Safari"; }
      catch (_) { prompt("Copie ce lien et colle-le dans Safari :", url); }
    });
  }

  function signInWithGoogle() {
    if (inAppBrowser()) {
      const ua = navigator.userAgent || "";
      if (/Android/i.test(ua)) {
        toast("Ouverture dans ton navigateur (Chrome) pour la connexion Google…");
        location.href = `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;S.browser_fallback_url=${encodeURIComponent(location.href)};end`;
      } else {
        openInBrowserHelp();
      }
      return Promise.resolve({ error: null });
    }
    const redirectTo = new URL("app.html", window.location.href).href;
    return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }

  // Récupère le message d'erreur renvoyé par une fonction serveur (ex. "Adresse email invalide.")
  async function fnErrorMessage(error, data) {
    if (data?.error) return data.error;
    try { const body = await error?.context?.json(); if (body?.error) return body.error; } catch (_) {}
    return "Le paiement est momentanément indisponible. Réessaie dans un instant.";
  }

  window.App = { cfg, sb, configured, demo, authReturn, helpDialog, confirmDialog, fnErrorMessage, esc, initials, avatar, toast, youtubeId, relTime, fmtDateTime, fmtTime, signInWithGoogle };
})();
