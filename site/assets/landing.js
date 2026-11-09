// Remplit la page d'accueil à partir de config.js et de la base (vidéo, résultats)
(async function () {
  const { cfg, sb, demo, esc, toast, youtubeId, signInWithGoogle } = window.App;
  const $ = (s) => document.querySelector(s);
  const fill = (sel, text) => document.querySelectorAll(sel).forEach((el) => (el.textContent = text));
  const rich = (text) => esc(text).replace(/\*(.+?)\*/g, '<span class="grad-text">$1</span>');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { localStorage.removeItem(k); } catch (_) {} },
  };

  // ---------- Statistiques (Admin › Statistiques) : d'où vient le visiteur et jusqu'où il va ----------
  // Aucune donnée personnelle : un identifiant au hasard, la source, la vidéo d'origine (?video=nom), le fuseau horaire.
  const track = (() => {
    if (demo) return () => {};
    const qs = new URLSearchParams(location.search);
    const ua = navigator.userAgent || "";
    const rid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
    let visitor = store.get("sce_visitor");
    if (!visitor) { visitor = rid(); store.set("sce_visitor", visitor); }
    const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : "";
    const seen = ua + " " + ref;
    let host = ""; try { host = ref ? new URL(ref).hostname.replace(/^www\./, "") : ""; } catch (_) {}
    const source = qs.get("utm_source") || qs.get("src") || (
      /tiktok|musical_ly|bytedance/i.test(seen) ? "TikTok" :
      /instagram/i.test(seen) ? "Instagram" :
      /FBAN|FBAV|facebook|fb\.com/i.test(seen) ? "Facebook" :
      /youtube|youtu\.be/i.test(ref) ? "YouTube" :
      /whatsapp|wa\.me/i.test(seen) ? "WhatsApp" :
      /google\./i.test(ref) ? "Google" : host || "Direct");
    let tz = null; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch (_) {}
    const base = {
      visitor, session: rid(),
      source: source.slice(0, 40),
      campaign: (qs.get("video") || qs.get("utm_content") || qs.get("utm_campaign") || "").slice(0, 60) || null,
      referrer: ref.slice(0, 200) || null, tz,
      lang: (navigator.language || "").slice(0, 10) || null,
      device: /Mobi|Android|iPhone|iPad/i.test(ua) ? "Téléphone" : "Ordinateur",
    };
    const done = new Set();
    return (event) => {
      if (done.has(event)) return;
      done.add(event);
      sb.from("site_visits").insert({ ...base, event }).then(() => {}, () => {});
    };
  })();
  track("visit");
  document.addEventListener("click", (e) => { if (e.target.closest("[data-cta], a[href='#rejoindre']")) track("cta"); });

  document.title = cfg.SITE_NAME;
  fill("[data-site-name]", cfg.SITE_NAME);
  fill("[data-eyebrow]", cfg.HERO_EYEBROW || "Accompagnement en ligne");
  fill("[data-cta]", cfg.CTA_LABEL || "Je rejoins l'accompagnement");
  fill("[data-price]", cfg.PRICE_LABEL);
  fill("[data-price-local]", cfg.PRICE_LOCAL_LABEL ? `soit ${cfg.PRICE_LOCAL_LABEL}` : "");
  fill("[data-price-note]", cfg.PRICE_NOTE || "");
  fill("[data-contact]", cfg.CONTACT_EMAIL);
  $("#year").textContent = new Date().getFullYear();
  $("#hero-title").innerHTML = rich(cfg.HERO_TITLE);
  document.querySelectorAll("[data-subtitle]").forEach((el) => (el.innerHTML = rich(cfg.HERO_SUBTITLE)));
  if (cfg.OLD_PRICE_LABEL) { $("#old-price").textContent = cfg.OLD_PRICE_LABEL; $("#old-price").classList.remove("hidden"); }
  if (demo) $("#demo-note").classList.remove("hidden");
  if (cfg.PRICE_INCREASE_NOTE) {
    fill("[data-price-increase]", cfg.PRICE_INCREASE_NOTE);
    $("#price-increase").classList.remove("hidden");
  }

  // Chiffres
  $("#stats").innerHTML = (cfg.STATS || []).map((s) => `<div class="stat"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join("");

  // Programme, par parcours
  $("#program").innerHTML = (cfg.PROGRAM || []).map((m, i) => `
    <article class="mod">
      <div class="num">${String(i + 1).padStart(2, "0")}</div>
      <h3>${esc(m.title)}</h3>
      <p>${esc(m.desc)}</p>
      <div class="meta"><span class="chip">${esc(m.lessons)}</span><span class="chip">${esc(m.duration)}</span></div>
    </article>`).join("");

  // Avantages
  const ICONS = {
    play: '<path d="M8 5v14l11-7z"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>',
    coach: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    live: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    infinity: '<path d="M7 8a4 4 0 1 0 0 8c3 0 7-8 10-8a4 4 0 1 1 0 8c-3 0-7-8-10-8Z"/>',
  };
  $("#benefits").innerHTML = (cfg.BENEFITS || []).map((b) => `
    <div class="benefit">
      <div class="ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[b.icon] || ICONS.play}</svg></div>
      <div><h3>${esc(b.title)}</h3><p>${esc(b.text)}</p></div>
    </div>`).join("");

  $("#for-you").innerHTML = (cfg.FOR_YOU || []).map((t) => `<li>${esc(t)}</li>`).join("");
  $("#not-for-you").innerHTML = (cfg.NOT_FOR_YOU || []).map((t) => `<li>${esc(t)}</li>`).join("");
  $("#compare").innerHTML = (cfg.COMPARISON || []).map((t) => `<tr><td>${esc(t)}</td><td class="no">✕</td><td class="us">✓</td></tr>`).join("");

  if ((cfg.TESTIMONIALS || []).length) {
    $("#avis").classList.remove("hidden");
    $("#quotes").innerHTML = cfg.TESTIMONIALS.map((q) => `
      <figure class="quote" style="margin:0">
        <p>« ${esc(q.text)} »</p>
        <figcaption class="who"><div class="avatar">${esc(window.App.initials(q.name))}</div><div><strong>${esc(q.name)}</strong><div class="muted">${esc(q.role || "")}</div></div></figcaption>
      </figure>`).join("");
  }

  $("#faq-list").innerHTML = (cfg.FAQ || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");

  // Réseaux : TikTok et YouTube
  const SOCIAL_SVG = {
    tiktok: '<path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.4 7.4 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z"/>',
    youtube: '<path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3Z"/>',
  };
  $("#socials").innerHTML = Object.entries(cfg.SOCIALS || {})
    .filter(([k, url]) => url && SOCIAL_SVG[k])
    .map(([k, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${k}"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">${SOCIAL_SVG[k]}</svg></a>`).join("");

  if (cfg.WHATSAPP) {
    const wa = $("#wa");
    wa.href = "https://wa.me/" + String(cfg.WHATSAPP).replace(/\D/g, "");
    wa.classList.remove("hidden");
  }

  // Compte à rebours : uniquement pour une vraie date de fin d'offre
  const end = cfg.OFFER_END ? new Date(cfg.OFFER_END) : null;
  if (end && end > new Date()) {
    const cd = $("#countdown");
    cd.classList.remove("hidden");
    const tick = () => {
      const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const parts = [[Math.floor(s / 86400), "jours"], [Math.floor(s / 3600) % 24, "h"], [Math.floor(s / 60) % 60, "min"], [s % 60, "s"]];
      cd.innerHTML = parts.map(([v, l]) => `<div><b>${String(v).padStart(2, "0")}</b><span>${l}</span></div>`).join("");
      if (s === 0) cd.classList.add("hidden");
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------- 1. Vidéo de présentation (réglée dans Admin › Page d'accueil) ----------
  async function setupVideo() {
    let link = cfg.HERO_VIDEO || "";
    if (!demo) {
      const { data } = await sb.from("site_settings").select("value").eq("key", "presentation_video").maybeSingle();
      if (data?.value) link = data.value;
    }
    const vid = youtubeId(link);
    // Une vidéo MP4 hébergée chez nous : sa couverture porte le même nom + « -poster.jpg »
    const file = !vid && /^https:\/\/\S+\.(mp4|webm|mov)(\?.*)?$/i.test(link) ? link : null;
    const vsl = $("#vsl");
    if (!vid && !file) {
      // Pas encore de vidéo : on garde le cadre visible (à remplir dans Admin › Page d'accueil)
      vsl.classList.add("vsl-empty");
      vsl.querySelector(".label").textContent = "Vidéo de présentation bientôt en ligne";
      vsl.addEventListener("click", () => document.getElementById("rejoindre").scrollIntoView({ behavior: "smooth" }));
      return;
    }
    vsl.style.backgroundImage = file
      ? `url('${file.replace(/\.(mp4|webm|mov)(\?.*)?$/i, "-poster.jpg")}')`
      : `url('https://i.ytimg.com/vi/${encodeURIComponent(vid)}/maxresdefault.jpg'), url('https://i.ytimg.com/vi/${encodeURIComponent(vid)}/sddefault.jpg')`;
    const play = () => {
      if (vsl.querySelector("iframe, video")) return;
      track("video");
      vsl.insertAdjacentHTML("beforeend", file
        ? `<video src="${esc(file)}" controls autoplay playsinline preload="auto" title="Vidéo de présentation"></video>`
        : `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(vid)}?autoplay=1&rel=0&modestbranding=1&playsinline=1&vq=hd1080" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Vidéo de présentation"></iframe>`);
      // Jusqu'où les gens regardent (seulement pour une vidéo MP4 hébergée chez nous)
      const v = vsl.querySelector("video");
      if (v) v.addEventListener("timeupdate", () => {
        const p = v.duration ? v.currentTime / v.duration : 0;
        if (p >= 0.25) track("video_25");
        if (p >= 0.5) track("video_50");
        if (p >= 0.95) track("video_fin");
      });
    };
    vsl.addEventListener("click", play);
    vsl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); } });
  }

  // ---------- 3. Cases qui défilent : les vidéos des membres qui ont de bons résultats ----------
  // Une rangée défile toute seule quand elle a assez de cases (sinon elle reste centrée, immobile)
  function marquee(box, cards, min = 3) {
    const track = box.querySelector(".mq-track");
    track.innerHTML = cards.join("");
    if (cards.length >= min) { track.insertAdjacentHTML("beforeend", cards.join("")); box.classList.add("run"); track.style.setProperty("--n", cards.length); }
    else box.classList.add("still");
  }
  const ytId = (u) => youtubeId(u || "");
  async function setupResults() {
    if (demo || !sb) return;
    const { data } = await sb.from("results").select("image_url, video_url, name, caption").order("position").order("created_at", { ascending: false }).limit(30);
    if (!data?.length) return;
    const cards = data.map((r, i) => {
      const yt = ytId(r.video_url), poster = r.image_url || (yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : "");
      const cap = `<figcaption>${r.name ? `<strong>${esc(r.name)}</strong>` : ""}${r.caption ? `<small>${esc(r.caption)}</small>` : ""}</figcaption>`;
      if (r.video_url) return `<button type="button" class="mq-card mq-tall mq-video" data-res="${i}" aria-label="Regarder le résultat de ${esc(r.name || "ce membre")}">${poster ? `<img src="${esc(poster)}" alt="" loading="lazy">` : `<video src="${esc(r.video_url)}#t=1" muted playsinline preload="metadata"></video>`}<span class="mq-play">▶</span>${cap}</button>`;
      return /^https:\/\//.test(r.image_url || "") ? `<button type="button" class="mq-card mq-tall" data-res="${i}" aria-label="Voir le résultat de ${esc(r.name || "ce membre")}"><img src="${esc(r.image_url)}" alt="Résultat de ${esc(r.name || "membre")}" loading="lazy">${cap}</button>` : "";
    }).filter(Boolean);
    if (!cards.length) return;
    $("#mq-results-head").classList.remove("hidden"); $("#mq-results").classList.remove("hidden");
    marquee($("#mq-results"), cards, 3);
    // lecture : fenêtre par-dessus la page, avec le son
    const modal = $("#vmodal"), body = modal.querySelector(".vmodal-body");
    const close = () => { modal.classList.add("hidden"); body.innerHTML = ""; document.body.style.overflow = ""; };
    $("#mq-results").addEventListener("click", (e) => {
      const b = e.target.closest("[data-res]"); if (!b) return;
      const r = data[+b.dataset.res], yt = ytId(r.video_url);
      body.innerHTML = !r.video_url
        ? `<img src="${esc(r.image_url)}" alt="Résultat de ${esc(r.name || "membre")}">${r.caption ? `<p class="vmodal-cap"><strong>${esc(r.name || "")}</strong> ${esc(r.caption)}</p>` : ""}`
        : yt
        ? `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt)}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Résultat"></iframe>`
        : `<video src="${esc(r.video_url)}" controls autoplay playsinline ${r.image_url ? `poster="${esc(r.image_url)}"` : ""}></video>`;
      modal.classList.remove("hidden"); document.body.style.overflow = "hidden";
    });
    modal.addEventListener("click", (e) => { if (e.target === modal || e.target.closest(".vmodal-x")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.classList.contains("hidden")) close(); });
  }

  // ---------- 2. Paiement AVANT connexion ----------
  const payForm = $("#pay-form");
  const payBtn = $("#pay-submit");
  const payOk = $("#pay-ok");

  function showPaid(email) {
    payOk.innerHTML = `✅ <strong>Paiement confirmé !</strong> Clique maintenant sur « Se connecter avec Google » avec <strong>${esc(email || "le même Gmail")}</strong>.`;
    payOk.classList.remove("hidden");
    payBtn.classList.add("hidden");
    $("#login-step").classList.add("highlight");
  }

  payForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    track("paiement");
    const email = $("#pay-email").value.trim().toLowerCase();
    const name = $("#pay-name").value.trim();
    const phone = $("#pay-phone").value.trim();
    if (name.length < 2) { $("#pay-name").focus(); return toast("Écris ton nom et ton prénom.", true); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      $("#pay-email").focus();
      return toast("Entre une adresse Gmail valide.", true);
    }
    if (phone.replace(/\D/g, "").length < 8) { $("#pay-phone").focus(); return toast("Écris ton numéro WhatsApp avec l'indicatif du pays (ex. +225…).", true); }
    payBtn.disabled = true;
    payBtn.textContent = "Ouverture du paiement sécurisé…";

    if (demo) {
      await new Promise((r) => setTimeout(r, 800));
      window.DemoBackend.ensureSession();
      window.DemoBackend.setMe({ paid: true });
      return window.location.assign("app.html");
    }

    const { data, error } = await sb.functions.invoke("saspay", { body: { action: "guest_create", email, name, phone } });
    if (error || !data?.checkout_url) {
      payBtn.disabled = false;
      payBtn.textContent = "Payer et rejoindre";
      return toast(await window.App.fnErrorMessage(error, data), true);
    }
    store.set("sce_payment_id", data.payment_id);
    store.set("sce_payment_email", email);
    if (data.manual) {
      // Lien de paiement : SasPay ne renvoie pas automatiquement sur le site, on prévient avant de partir
      payOk.innerHTML = `Tu vas être redirigé vers la page de paiement sécurisée. <strong>Indique le même e-mail (${esc(email)})</strong>, paie, puis reviens ici et clique sur « Se connecter avec Google ». Ton accès est activé dès que ton paiement est vérifié.`;
      payOk.classList.remove("hidden");
      await new Promise((r) => setTimeout(r, 3500));
    }
    window.location.assign(data.checkout_url);
  });

  // ---------- Partie discrète sous le numéro WhatsApp : code donné par le coach pour payer en 2 fois
  //            (ce n'est pas une réduction : le prix total reste le même, il est seulement payé en 2 versements)
  const fcfa = (n) => Number(n).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
  const promoMsg = (html, ok) => { const m = $("#promo-msg"); m.innerHTML = html; m.style.color = ok ? "#16a34a" : "#e11d48"; };
  function resetCode() { $("#split-go").classList.add("hidden"); payBtn.classList.remove("hidden"); }
  $("#promo-toggle")?.addEventListener("click", (e) => { e.preventDefault(); $("#promo-box").classList.toggle("hidden"); $("#pay-code").focus(); });
  $("#promo-apply")?.addEventListener("click", async () => {
    const code = $("#pay-code").value.trim();
    resetCode();
    if (!code) { promoMsg(""); return $("#pay-code").focus(); }
    if (demo) return promoMsg("Les codes marchent sur le site en ligne.");
    $("#promo-apply").disabled = true; promoMsg("Vérification du code…", true);
    const { data } = await sb.functions.invoke("saspay", { body: { action: "code_check", code } });
    $("#promo-apply").disabled = false;
    if (!data?.ok) return promoMsg(esc(data?.error || "Ce code n'est pas valable."));
    promoMsg(`✓ Paiement en 2 fois : <strong>${fcfa(data.first)}</strong> aujourd'hui, puis <strong>${fcfa(data.second)}</strong> dans ${data.days} jours (total ${fcfa(data.total)}). Signe d'abord ton contrat.`, true);
    $("#split-go").classList.remove("hidden"); payBtn.classList.add("hidden");
  });
  $("#pay-code")?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("#promo-apply").click(); } });
  $("#pay-code")?.addEventListener("input", () => { resetCode(); promoMsg(""); });
  // Paiement en 2 fois : le code mène au contrat à signer (le 1er versement se paie juste après la signature)
  $("#split-go")?.addEventListener("click", () => {
    const p = new URLSearchParams({ code: $("#pay-code").value.trim(), email: $("#pay-email").value.trim().toLowerCase(), name: $("#pay-name").value.trim(), phone: $("#pay-phone").value.trim() });
    window.location.assign("contrat.html?" + p.toString());
  });

  // Retour de la page de paiement
  async function checkReturn() {
    const params = new URLSearchParams(window.location.search);
    const paymentId = store.get("sce_payment_id");
    if (params.get("paiement") !== "ok" && !paymentId) return;
    if (params.get("paiement") === "ok") history.replaceState(null, "", window.location.pathname + "#rejoindre");
    if (!paymentId || demo) return;

    const email = store.get("sce_payment_email");
    payOk.innerHTML = "⏳ Vérification de ton paiement…";
    payOk.classList.remove("hidden");
    for (let i = 0; i < 8; i++) {
      const { data } = await sb.functions.invoke("saspay", { body: { action: "guest_status", payment_id: paymentId } });
      if (data?.manual) {
        payOk.innerHTML = `⏳ <strong>Paiement en cours de vérification.</strong> Connecte-toi maintenant avec Google avec <strong>${esc(data.email || email || "le même Gmail")}</strong> : ton accès s'ouvrira automatiquement dès que ton paiement sera validé (en général en quelques heures).`;
        $("#login-step").classList.add("highlight");
        return;
      }
      if (data?.paid) {
        showPaid(data.email || email);
        document.getElementById("rejoindre").scrollIntoView({ behavior: "smooth" });
        return;
      }
      if (params.get("paiement") !== "ok") break; // simple visite : on ne boucle pas
      await new Promise((r) => setTimeout(r, 2500));
    }
    payOk.innerHTML = params.get("paiement") === "ok"
      ? "Ton paiement est en cours de validation. Connecte-toi avec le même Gmail : ton accès s'ouvrira dès qu'il sera confirmé."
      : "";
    if (!payOk.innerHTML) payOk.classList.add("hidden");
  }

  // ---------- Connexion ----------
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session) {
      const nav = document.querySelector(".l-nav [data-login]");
      if (nav) nav.textContent = "Mon espace";
    }
  }
  document.querySelectorAll("[data-login]").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const { data } = await sb.auth.getSession();
      if (data.session) return window.location.assign("app.html");
      const { error } = await signInWithGoogle();
      if (error) toast(error.message, true);
    })
  );

  setupVideo().catch(() => {});
  setupResults().catch(() => {});
  checkReturn().catch(() => {});
})();
