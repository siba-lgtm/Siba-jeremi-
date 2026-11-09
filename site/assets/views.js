// Les différentes pages de l'espace membre
(function () {
  const { cfg, sb, esc, avatar, toast, relTime, fmtDateTime, fmtTime } = window.App;

  const ROLE_BADGE = { admin: "Coach", coach: "Coach" };

  function linkify(escapedText) {
    return escapedText.replace(/https?:\/\/[^\s<]+/g, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  }
  function safeUrl(url) {
    return /^https?:\/\//i.test(url || "") ? url : null;
  }
  // Miniature d'un module (config.js > MODULE_COVERS)
  function moduleCover(title) {
    const t = String(title || "").trim().toLowerCase();
    const hit = (cfg.MODULE_COVERS || []).find((c) => t.startsWith(String(c.match || "").toLowerCase()));
    return hit ? hit.image : null;
  }
  // Numéro des modules : les parties « live » (rediffusions) ne comptent pas
  const isLive = (m) => /live/i.test(m.category || "");
  function moduleLabels(modules) {
    let n = 0;
    return new Map(modules.map((m) => [m.id, isLive(m) ? "Rediffusion live" : `Module ${++n}`]));
  }
  // Encadrés « petit livre » d'un module (config.js > MODULE_NOTES)
  function moduleNotes(title) {
    const t = String(title || "").trim().toLowerCase();
    return (cfg.MODULE_NOTES || []).filter((n) => t.startsWith(String(n.match || "").toLowerCase()));
  }
  function must({ data, error }) {
    if (error) throw error;
    return data;
  }

  // =================================================================
  //  PAGE DE PAIEMENT (avant d'avoir accès)
  // =================================================================
  // Accès bloqué : 2e versement non payé après la date limite. Un clic pour payer, et tout revient.
  async function splitBlocked(el, ctx) {
    const s = ctx.split, amount = Number(s.second_amount).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
    const due = new Date(s.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    el.innerHTML = `
      <div class="paywall"><div class="card">
        <span class="badge" style="background:#c62828;color:#fff">Accès suspendu</span>
        <h1 style="margin-top:.8rem">Ton 2e versement n'est pas encore payé</h1>
        <p class="muted">Il était à payer le ${esc(due)}. Comme prévu dans ton contrat, ton accès est suspendu jusqu'au paiement. Dès que tu paies, tout se débloque automatiquement.</p>
        <div class="price" style="margin:1rem 0">${esc(amount)}</div>
        <button class="btn btn-primary btn-lg" style="width:100%" type="button" id="pay2">Payer mon 2e versement</button>
        <p class="muted small" style="margin:.8rem 0 0"><a href="contrat.html?id=${encodeURIComponent(s.contract_id)}&t=${encodeURIComponent(s.token)}" target="_blank" rel="noopener">Voir mon contrat</a> · Une difficulté ? Écris au coach sur WhatsApp.</p>
      </div></div>`;
    // retour du paiement : SasPay est revérifié, puis la page se recharge si c'est payé
    const { data: pend } = await sb.from("payments").select("id").eq("contract_id", s.contract_id).eq("kind", "second").eq("status", "pending").limit(1);
    if (pend?.length) {
      await sb.functions.invoke("saspay", { body: { action: "sync" } });
      const { data } = await sb.rpc("my_split_status");
      if (!data?.[0]) { toast("2e versement reçu : ton accès est débloqué 🎉"); return setTimeout(() => location.reload(), 1200); }
    }
    el.querySelector("#pay2").addEventListener("click", async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = "Ouverture du paiement…";
      const { data, error } = await sb.functions.invoke("saspay", { body: { action: "second_create" } });
      if (error || !data?.checkout_url) { b.disabled = false; b.textContent = "Payer mon 2e versement"; return toast(await window.App.fnErrorMessage(error, data), true); }
      window.location.assign(data.checkout_url);
    });
  }

  async function paywall(el, ctx) {
    if (ctx.split?.blocked) return splitBlocked(el, ctx);
    const alive = ctx.isCurrent;
    const modules = must(await sb.from("modules").select("id, title, description, category").order("position").order("created_at"));
    const labels = moduleLabels(modules);
    if (!alive()) return;

    const saspay = cfg.PAYMENT_PROVIDER === "saspay";
    const configured = saspay || !cfg.STRIPE_PAYMENT_LINK.includes("VOTRE_LIEN");
    const sep = cfg.STRIPE_PAYMENT_LINK.includes("?") ? "&" : "?";
    const link = cfg.STRIPE_PAYMENT_LINK + sep +
      "client_reference_id=" + encodeURIComponent(ctx.user.id) +
      "&prefilled_email=" + encodeURIComponent(ctx.user.email || "");

    const firstName = (ctx.profile.full_name || "").split(" ")[0];
    el.innerHTML = `
      <div class="paywall">
        <div class="card">
          <span class="badge">Dernière étape</span>
          <h1 style="margin-top:.8rem">Bienvenue ${esc(firstName)} 👋</h1>
          <p class="muted">Débloque l'accès complet à la formation : tous les modules vidéo, la communauté, les coachs et les appels en direct.</p>
          <div class="price" style="margin:1rem 0 .2rem">${esc(cfg.PRICE_LABEL)} <small>paiement unique · accès à vie</small></div>
          ${saspay && cfg.PRICE_LOCAL_LABEL ? `<div class="muted small" style="margin-bottom:1rem">Soit ${esc(cfg.PRICE_LOCAL_LABEL)}, montant débité</div>` : ""}
          <a class="btn btn-primary btn-lg" style="width:100%" ${configured && !saspay ? `href="${esc(link)}"` : ""} id="pay-btn" role="button" tabindex="0">
            Payer et accéder à la formation
          </a>
          <p class="muted small" style="margin:.8rem 0 0">${saspay
            ? "🔒 Paiement sécurisé par mobile money (Wave, Orange, MTN, Moov, Djamo) · Accès immédiat"
            : "🔒 Paiement sécurisé par Stripe · Accès immédiat après paiement"}</p>
          ${modules.length ? `
          <div class="locked-list">
            <h3 style="font-size:1rem">Au programme</h3>
            ${modules.map((m) => `
              <div class="item"><span>🔒</span><div><strong>${labels.get(m.id)} — ${esc(m.title)}</strong>
              ${m.description ? `<div class="muted small">${esc(m.description)}</div>` : ""}</div></div>`).join("")}
          </div>` : ""}
        </div>
        <p class="muted small" style="margin-top:1rem">Déjà payé ? Ton accès s'ouvre dès que ton paiement est vérifié (en général en quelques heures). <a href="#" id="refresh">Rafraîchir mon accès</a></p>
      </div>`;

    const payBtn = el.querySelector("#pay-btn");
    if (window.App.demo) {
      payBtn.removeAttribute("href");
      payBtn.textContent = `Simuler le paiement de ${cfg.PRICE_LABEL} (démo)`;
      payBtn.addEventListener("click", async () => {
        payBtn.textContent = "Paiement en cours…";
        await new Promise((r) => setTimeout(r, 900));
        window.DemoBackend.setMe({ paid: true });
        window.location.reload();
      });
    } else if (saspay) {
      payBtn.addEventListener("click", async () => {
        if (payBtn.dataset.busy) return;
        payBtn.dataset.busy = "1";
        payBtn.textContent = "Ouverture du paiement sécurisé…";
        const { data, error } = await sb.functions.invoke("saspay", { body: { action: "create" } });
        if (data?.paid) return window.location.reload();
        if (error || !data?.checkout_url) {
          delete payBtn.dataset.busy;
          payBtn.textContent = "Payer et accéder à la formation";
          return toast(await window.App.fnErrorMessage(error, data), true);
        }
        if (data.manual) {
          toast(`Sur la page de paiement, indique bien ton e-mail ${ctx.user.email}. Ton accès s'ouvrira après vérification.`);
          await new Promise((r) => setTimeout(r, 3000));
        }
        window.location.assign(data.checkout_url);
      });
    } else if (!configured) {
      payBtn.addEventListener("click", () => toast("Lien de paiement Stripe non configuré (config.js)", true));
    }
    el.querySelector("#refresh").addEventListener("click", async (e) => {
      e.preventDefault();
      if (saspay && !window.App.demo) await sb.functions.invoke("saspay", { body: { action: "sync" } });
      window.location.reload();
    });
  }

  // =================================================================
  //  ACCUEIL : tableau de bord du membre
  // =================================================================
  // 1) La vidéo d'accueil (réglée dans Admin › Page d'accueil), 2) le fil de messages de tout le monde.
  // Paiement en 2 fois : le 2e versement en attente s'affiche sur l'Accueil.
  // Avant la date : information seulement · à la date prévue : le lien « Payer mon 2e versement » apparaît.
  // Le lendemain de la date sans paiement : accès bloqué (écran splitBlocked), débloqué dès le paiement.
  async function splitBanner(box, ctx) {
    let s = ctx.split;
    if (!box || window.App.demo || !s) return;
    // retour du paiement du 2e versement : on fait revérifier SasPay une fois
    const { data: pend } = await sb.from("payments").select("id").eq("contract_id", s.contract_id).eq("kind", "second").eq("status", "pending").limit(1);
    if (pend?.length) {
      await sb.functions.invoke("saspay", { body: { action: "sync" } });
      const { data } = await sb.rpc("my_split_status"); s = data?.[0];
      if (!s) { toast("2e versement reçu : merci, tout est payé ! 🎉"); return; }
    }
    if (!ctx.isCurrent()) return;
    const amount = Number(s.second_amount).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
    const dueTxt = new Date(s.due_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const left = Math.ceil((new Date(s.due_at) - Date.now()) / 86400000);
    const [col, title, text] = s.pay_open
      ? ["#c62828", "C'est le jour de ton 2e versement", `Paie tes ${amount} aujourd'hui : sans paiement, ton accès sera suspendu dès demain, jusqu'au paiement.`]
      : ["var(--accent)", "2e versement en attente", `${amount} à payer le ${dueTxt} (dans ${left} jour${left > 1 ? "s" : ""}). Le lien de paiement apparaîtra ici ce jour-là.`];
    box.innerHTML = `<div class="card" style="border-left:4px solid ${col};margin-bottom:1rem;display:flex;gap:1rem;align-items:center;flex-wrap:wrap;justify-content:space-between">
      <div style="min-width:220px;flex:1"><strong>${esc(title)}</strong><div class="muted small" style="margin-top:.2rem">${esc(text)}</div></div>
      <div class="row"><a class="btn btn-sm" href="contrat.html?id=${encodeURIComponent(s.contract_id)}&t=${encodeURIComponent(s.token)}" target="_blank" rel="noopener">Voir mon contrat</a>
      ${s.pay_open ? `<button class="btn btn-primary btn-sm" type="button" data-pay2>Payer mon 2e versement (${esc(amount)})</button>` : ""}</div></div>`;
    box.querySelector("[data-pay2]")?.addEventListener("click", async (e) => {
      const b = e.currentTarget; b.disabled = true; b.textContent = "Ouverture du paiement…";
      const { data, error } = await sb.functions.invoke("saspay", { body: { action: "second_create" } });
      if (error || !data?.checkout_url) { b.disabled = false; b.textContent = `Payer mon 2e versement (${amount})`; return toast(await window.App.fnErrorMessage(error, data), true); }
      window.location.assign(data.checkout_url);
    });
  }

  async function dashboard(el, ctx) {
    const alive = ctx.isCurrent;
    const [setting, channels] = await Promise.all([
      sb.from("site_settings").select("value").eq("key", "accueil_video").maybeSingle().then(must),
      sb.from("channels").select("id, slug, name, staff_only").order("position").then(must),
    ]);
    if (!alive()) return;

    const link = setting?.value || "";
    const vid = window.App.youtubeId(link);
    // vidéo MP4 hébergée sur le site (affiche = même nom + « -poster.jpg »)
    const file = !vid && /^https:\/\/\S+\.(mp4|webm|mov)(\?.*)?$/i.test(link) ? link : "";
    const channel = channels.find((c) => c.slug === "general") || channels.find((c) => !c.staff_only) || channels[0];
    const firstName = (ctx.profile.full_name || "").split(" ")[0];

    el.innerHTML = `
      <div class="home">
        <div class="page-head" style="margin-bottom:1rem">
          <div><h1>Bienvenue ${esc(firstName)} 👋</h1><div class="muted">Commence par cette vidéo, puis dis bonjour à la communauté.</div></div>
          <a class="btn btn-primary" href="#/formation">Voir les modules</a>
        </div>
        <div id="split-banner"></div>
        ${vid ? `<div id="home-video" class="home-video"></div>`
          : file ? `<div class="home-video"><video src="${esc(file)}" poster="${esc(file.replace(/\.(mp4|webm|mov)(\?.*)?$/i, "-poster.jpg"))}" controls playsinline preload="metadata" controlslist="nodownload" oncontextmenu="return false" style="display:block;width:100%;aspect-ratio:16/9;background:#000;border-radius:14px"></video></div>`
          : ctx.isAdmin ? `<div class="empty home-video-empty">Ta vidéo d'accueil apparaîtra ici. Ajoute-la dans <a href="#/admin/accueil">Admin › Page d'accueil</a>.</div>` : ""}
        ${channel ? `<div class="home-feed"></div>` : `<div class="empty">Aucun salon de discussion pour l'instant.</div>`}
      </div>`;

    splitBanner(el.querySelector("#split-banner"), ctx).catch((e) => console.warn(e));
    if (vid) {
      const player = await window.ProtectedPlayer.mount(el.querySelector("#home-video"), vid);
      ctx.onCleanup(() => player.destroy());
    }
    if (!channel || !alive()) return;
    await mountFeed(el.querySelector(".home-feed"), ctx, channel);
  }

  // =================================================================
  //  FIL COLLECTIF : messages + réponses en dessous + réactions emoji
  // =================================================================
  const REACTIONS = ["👍", "❤️", "🔥", "😂", "👏", "💯"];

  async function mountFeed(box, ctx, channel) {
    const alive = ctx.isCurrent;
    const me = ctx.user.id;
    const cache = ctx.profileCache;
    const canPost = !channel.staff_only || ctx.isStaff;
    const cols = "id, content, created_at, user_id, parent_id";

    box.innerHTML = `
      <div class="feed-head"><h2>💬 Messages de la communauté</h2><div class="muted small">Présente-toi, pose tes questions, partage tes avancées. Tout le monde voit ce fil et peut répondre.</div></div>
      ${canPost ? `<form class="card feed-compose"><textarea maxlength="4000" placeholder="Écris un message à tout le monde…" aria-label="Nouveau message"></textarea>
        <div class="row" style="justify-content:flex-end"><button class="btn btn-primary" type="submit">Publier</button></div></form>` : ""}
      <div class="feed-list"><div class="loading">Chargement…</div></div>`;
    const list = box.querySelector(".feed-list");

    const posts = must(await sb.from("messages").select(cols).eq("channel_id", channel.id).is("parent_id", null)
      .order("created_at", { ascending: false }).limit(40));
    const replies = posts.length
      ? must(await sb.from("messages").select(cols).in("parent_id", posts.map((p) => p.id)).order("created_at"))
      : [];
    const allIds = [...posts, ...replies].map((m) => m.id);
    const reactRows = allIds.length ? must(await sb.from("message_reactions").select("message_id, user_id, emoji").in("message_id", allIds)) : [];
    if (!alive()) return;

    // État local
    const reacts = new Map();
    reactRows.forEach((r) => { if (!reacts.has(r.message_id)) reacts.set(r.message_id, []); reacts.get(r.message_id).push(r); });
    const repliesBy = new Map();
    replies.forEach((r) => { if (!repliesBy.has(r.parent_id)) repliesBy.set(r.parent_id, []); repliesBy.get(r.parent_id).push(r); });

    async function loadAuthors(ids) {
      const missing = [...new Set(ids)].filter((id) => id && !cache.has(id));
      if (!missing.length) return;
      const { data } = await sb.from("profiles").select("id, full_name, avatar_url, role").in("id", missing);
      (data || []).forEach((p) => cache.set(p.id, p));
      missing.forEach((id) => { if (!cache.has(id)) cache.set(id, { id, full_name: "Membre" }); });
    }
    await loadAuthors([...posts, ...replies].map((m) => m.user_id));
    if (!alive()) return;

    const reactBar = (id) => {
      const rs = reacts.get(id) || [];
      const chips = REACTIONS.map((e) => ({ e, n: rs.filter((r) => r.emoji === e).length, mine: rs.some((r) => r.emoji === e && r.user_id === me) }))
        .filter((x) => x.n);
      return `<span class="react-bar" data-react-bar="${id}">
        ${chips.map((x) => `<button type="button" class="react-chip ${x.mine ? "mine" : ""}" data-react="${x.e}" data-mid="${id}" title="${x.mine ? "Retirer ma réaction" : "Réagir"}">${x.e} <b>${x.n}</b></button>`).join("")}
        <span class="react-add">
          <button type="button" class="react-plus" data-picker="${id}" aria-label="Ajouter une réaction">☺︎＋</button>
          <span class="react-picker hidden" data-picker-for="${id}">${REACTIONS.map((e) => `<button type="button" data-react="${e}" data-mid="${id}">${e}</button>`).join("")}</span>
        </span>
      </span>`;
    };

    const msgHtml = (m, isReply) => {
      const p = cache.get(m.user_id) || { full_name: "Membre" };
      const canDel = m.user_id === me || ctx.isStaff;
      return `
        <div class="feed-msg ${isReply ? "reply" : ""}" data-id="${m.id}">
          ${avatar(p)}
          <div class="body grow">
            <div class="meta"><strong>${esc(p.full_name)}</strong>${ROLE_BADGE[p.role] ? ` <span class="badge">${ROLE_BADGE[p.role]}</span>` : ""} <span class="muted">${esc(relTime(m.created_at))}</span></div>
            <div class="text">${linkify(esc(m.content))}</div>
            <div class="feed-actions">
              ${reactBar(m.id)}
              ${canPost ? `<button type="button" class="link-btn" data-reply="${isReply ? m.parent_id : m.id}">Répondre</button>` : ""}
              ${canDel ? `<button type="button" class="link-btn danger" data-del="${m.id}">Supprimer</button>` : ""}
            </div>
          </div>
        </div>`;
    };

    const postHtml = (m) => {
      const rs = repliesBy.get(m.id) || [];
      return `
        <article class="card feed-post" data-post="${m.id}">
          ${msgHtml(m, false)}
          <div class="feed-replies" data-replies="${m.id}">${rs.map((r) => msgHtml(r, true)).join("")}</div>
          <form class="feed-reply-form hidden" data-reply-form="${m.id}">
            <input maxlength="2000" placeholder="Écrire une réponse…" aria-label="Répondre">
            <button class="btn btn-sm btn-primary" type="submit">Envoyer</button>
          </form>
        </article>`;
    };

    list.innerHTML = posts.length ? posts.map(postHtml).join("") : `<div class="empty" data-empty>Aucun message pour l'instant. Sois le premier à dire bonjour 👋</div>`;

    const refreshBar = (id) => {
      const bar = box.querySelector(`[data-react-bar="${id}"]`);
      if (bar) bar.outerHTML = reactBar(id);
    };
    const addPost = (m) => {
      if (box.querySelector(`[data-post="${m.id}"]`)) return;
      list.querySelector("[data-empty]")?.remove();
      list.insertAdjacentHTML("afterbegin", postHtml(m));
    };
    const addReply = (m) => {
      if (box.querySelector(`[data-id="${m.id}"]`)) return;
      const wrap = box.querySelector(`[data-replies="${m.parent_id}"]`);
      if (!wrap) return;
      if (!repliesBy.has(m.parent_id)) repliesBy.set(m.parent_id, []);
      repliesBy.get(m.parent_id).push(m);
      wrap.insertAdjacentHTML("beforeend", msgHtml(m, true));
    };
    const setReact = (r, on) => {
      const rs = reacts.get(r.message_id) || [];
      const i = rs.findIndex((x) => x.user_id === r.user_id && x.emoji === r.emoji);
      if (on && i === -1) rs.push({ message_id: r.message_id, user_id: r.user_id, emoji: r.emoji });
      if (!on && i !== -1) rs.splice(i, 1);
      reacts.set(r.message_id, rs);
      refreshBar(r.message_id);
    };

    // Publier un message
    const compose = box.querySelector(".feed-compose");
    if (compose) {
      const ta = compose.querySelector("textarea");
      compose.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = ta.value.trim();
        if (!content) return;
        const btn = compose.querySelector("button");
        btn.disabled = true;
        const { data, error } = await sb.from("messages").insert({ channel_id: channel.id, user_id: me, content }).select(cols).single();
        btn.disabled = false;
        if (error) return toast(error.message, true);
        ta.value = "";
        addPost(data);
      });
    }

    // Répondre
    box.addEventListener("submit", async (e) => {
      const form = e.target.closest("[data-reply-form]");
      if (!form) return;
      e.preventDefault();
      const input = form.querySelector("input");
      const content = input.value.trim();
      if (!content) return;
      input.disabled = true;
      const { data, error } = await sb.from("messages").insert({ channel_id: channel.id, user_id: me, content, parent_id: form.dataset.replyForm }).select(cols).single();
      input.disabled = false;
      if (error) return toast(error.message, true);
      input.value = "";
      addReply(data);
      input.focus();
    });

    box.addEventListener("click", async (e) => {
      const picker = e.target.closest("[data-picker]");
      if (picker) {
        const el = box.querySelector(`[data-picker-for="${picker.dataset.picker}"]`);
        box.querySelectorAll(".react-picker").forEach((p) => { if (p !== el) p.classList.add("hidden"); });
        el.classList.toggle("hidden");
        return;
      }
      const react = e.target.closest("[data-react]");
      if (react) {
        const r = { message_id: react.dataset.mid, user_id: me, emoji: react.dataset.react };
        const mine = (reacts.get(r.message_id) || []).some((x) => x.user_id === me && x.emoji === r.emoji);
        setReact(r, !mine);
        const res = mine
          ? await sb.from("message_reactions").delete().eq("message_id", r.message_id).eq("user_id", me).eq("emoji", r.emoji)
          : await sb.from("message_reactions").insert(r);
        if (res.error) { setReact(r, mine); toast(res.error.message, true); }
        return;
      }
      const reply = e.target.closest("[data-reply]");
      if (reply) {
        const form = box.querySelector(`[data-reply-form="${reply.dataset.reply}"]`);
        form.classList.remove("hidden");
        form.querySelector("input").focus();
        return;
      }
      const del = e.target.closest("[data-del]");
      if (del && (await window.App.confirmDialog("Supprimer ce message ?", "Supprimer"))) {
        const { error } = await sb.from("messages").delete().eq("id", del.dataset.del);
        if (error) return toast(error.message, true);
        (box.querySelector(`[data-post="${del.dataset.del}"]`) || box.querySelector(`[data-id="${del.dataset.del}"]`))?.remove();
      }
    });

    // Temps réel : nouveaux messages, réponses, suppressions et réactions des autres membres
    const rt = sb.channel("feed-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, async ({ new: m }) => {
        await loadAuthors([m.user_id]);
        if (m.parent_id) addReply(m); else addPost(m);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "messages" }, ({ old }) => {
        (box.querySelector(`[data-post="${old.id}"]`) || box.querySelector(`[data-id="${old.id}"]`))?.remove();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" }, ({ new: r }) => setReact(r, true))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" }, ({ old: r }) => setReact(r, false))
      .subscribe();
    ctx.onCleanup(() => sb.removeChannel(rt));
  }

  // =================================================================
  //  FORMATION : liste des modules
  // =================================================================
  async function formation(el, ctx, parts) {
    if (parts[1] === "lecon" && parts[2]) return lesson(el, ctx, parts[2]);
    const alive = ctx.isCurrent;

    const [modules, lessons, progress] = await Promise.all([
      sb.from("modules").select("id, title, description, category").order("position").order("created_at").then(must),
      sb.from("lessons").select("id, module_id, title, youtube_id").order("position").order("created_at").then(must),
      sb.from("lesson_progress").select("lesson_id").eq("user_id", ctx.user.id).then(must),
    ]);
    if (!alive()) return;

    const done = new Set(progress.map((p) => p.lesson_id));
    const byModule = (id) => lessons.filter((l) => l.module_id === id);
    const nextLesson = modules.flatMap((m) => byModule(m.id)).find((l) => !done.has(l.id));
    const pct = lessons.length ? Math.round((lessons.filter((l) => done.has(l.id)).length / lessons.length) * 100) : 0;

    // Regroupe les modules par parcours (TikTok, YouTube, Afrique…) dans l'ordre des modules
    const labels = moduleLabels(modules);
    const groups = [];
    modules.forEach((m) => {
      const cat = m.category || "Modules";
      let g = groups.find((x) => x.name === cat);
      if (!g) groups.push((g = { name: cat, items: [] }));
      g.items.push({ m, live: isLive(m) });
    });

    const card = ({ m, live }) => {
      const ls = byModule(m.id);
      const d = ls.filter((l) => done.has(l.id)).length;
      const target = ls.find((l) => !done.has(l.id)) || ls[0];
      const yt = ls.find((l) => l.youtube_id)?.youtube_id;
      const cover = moduleCover(m.title) || (live && yt ? `https://i.ytimg.com/vi/${yt}/hq720.jpg` : null);
      return `
        <a class="card module-card ${ls.length ? "" : "module-soon"} ${cover ? "has-cover" : ""}" ${target ? `href="#/formation/lecon/${target.id}"` : ""}>
          ${cover ? `<img class="module-cover" src="${esc(cover)}" alt="">` : ""}
          <div class="module-num ${live ? "live-badge" : ""}">${live ? "● " : ""}${labels.get(m.id)}</div>
          <h3 style="margin:0">${esc(m.title)}</h3>
          ${m.description ? `<p class="muted small" style="margin:0">${esc(m.description)}</p>` : ""}
          <div style="margin-top:auto">
            <div class="row small muted" style="justify-content:space-between;margin-bottom:.35rem">
              <span>${ls.length ? `${ls.length} vidéo${ls.length > 1 ? "s" : ""}` : "Bientôt disponible"}</span>
              <span>${ls.length ? (d === ls.length ? "✓ Terminé" : `${d}/${ls.length}`) : ""}</span>
            </div>
            <div class="progress"><div style="width:${ls.length ? (d / ls.length) * 100 : 0}%"></div></div>
          </div>
        </a>`;
    };

    el.innerHTML = `
      <div class="page-head">
        <div>
          <h1>Formation</h1>
          <div class="muted">${lessons.length} vidéo${lessons.length > 1 ? "s" : ""} · ${pct}% terminé</div>
        </div>
        ${nextLesson ? `<a class="btn btn-primary" href="#/formation/lecon/${nextLesson.id}">▶ Continuer : ${esc(nextLesson.title)}</a>` : ""}
      </div>
      ${groups.length ? groups.map((g) => `
        <section class="track">
          <h2 class="track-title">${esc(g.name)} <span class="muted small">${g.items.length} module${g.items.length > 1 ? "s" : ""}</span></h2>
          <div class="modules-grid">${g.items.map(card).join("")}</div>
        </section>`).join("")
        : `<div class="empty">Les modules arrivent bientôt.${ctx.isAdmin ? ` <a href="#/admin">Ajoute ton premier module</a>.` : ""}</div>`}`;
  }

  // =================================================================
  //  FORMATION : une leçon (vidéo)
  // =================================================================
  async function lesson(el, ctx, lessonId) {
    const alive = ctx.isCurrent;
    const current = must(await sb.from("lessons").select("id, module_id, title, description, youtube_id").eq("id", lessonId).maybeSingle());
    if (!current) { el.innerHTML = `<div class="empty">Leçon introuvable. <a href="#/formation">Retour</a></div>`; return; }

    const [modules, siblings, progress] = await Promise.all([
      sb.from("modules").select("id, title, category").order("position").order("created_at").then(must),
      sb.from("lessons").select("id, title").eq("module_id", current.module_id).order("position").order("created_at").then(must),
      sb.from("lesson_progress").select("lesson_id").eq("user_id", ctx.user.id).then(must),
    ]);
    if (!alive()) return;

    const done = new Set(progress.map((p) => p.lesson_id));
    const modIndex = modules.findIndex((m) => m.id === current.module_id);
    const mod = modules[modIndex];
    const idx = siblings.findIndex((l) => l.id === current.id);
    const prev = siblings[idx - 1], next = siblings[idx + 1];

    el.innerHTML = `
      <div class="muted small" style="margin-bottom:.8rem">
        <a href="#/formation">Formation</a> › ${moduleLabels(modules).get(mod?.id) || "Module"} — ${esc(mod?.title)}
      </div>
      <div class="course">
        <div>
          <div id="player-slot"></div>
          <div class="page-head" style="margin:1.2rem 0 .8rem;align-items:center">
            <h1 style="font-size:1.5rem">${esc(current.title)}</h1>
            <button class="btn" id="done-btn"></button>
          </div>
          ${current.description ? `<div class="card" style="white-space:pre-wrap">${linkify(esc(current.description))}</div>` : ""}
          <div class="row" style="justify-content:space-between;margin-top:1.2rem">
            ${prev ? `<a class="btn" href="#/formation/lecon/${prev.id}">← Précédente</a>` : "<span></span>"}
            ${next ? `<a class="btn btn-primary" href="#/formation/lecon/${next.id}">Suivante →</a>` : ""}
          </div>
        </div>
        <div class="card lesson-list">
          <div class="side-title muted small" style="padding:.5rem .7rem;font-weight:700">MODULE ${modIndex + 1}</div>
          ${siblings.map((l, i) => `
            <a class="lesson-item ${l.id === current.id ? "active" : ""}" href="#/formation/lecon/${l.id}">
              <span class="lesson-dot ${done.has(l.id) ? "done" : ""}" data-dot="${l.id}">${done.has(l.id) ? "✓" : ""}</span>
              <span>${i + 1}. ${/^live\s*:/i.test(l.title) ? `<span class="live-tag">● Live</span> ${esc(l.title.replace(/^live\s*:\s*/i, ""))}` : esc(l.title)}</span>
            </a>`).join("")}
          ${moduleNotes(mod?.title).map((n) => `
            <details class="module-note">
              <summary><span class="note-ico">📖</span><span><strong>${esc(n.title)}</strong>${n.subtitle ? `<span class="muted small">${esc(n.subtitle)}</span>` : ""}</span></summary>
              <div class="note-body">${n.paragraphs.map((p) => `<p>${linkify(esc(p))}</p>`).join("")}${(n.links || []).length ? `<p class="row">${n.links.map((l) => l.url.startsWith("#/") ? `<a class="btn btn-sm" href="${esc(l.url)}">${esc(l.label)}</a>` : safeUrl(l.url) ? `<a class="btn btn-primary btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a>` : "").join("")}</p>` : ""}</div>
            </details>`).join("")}
          <div id="wa-box"></div>
        </div>
      </div>`;

    // Module d'entrée : si le numéro WhatsApp n'a pas été donné au paiement, on le demande ici (une seule fois)
    if (/^bienvenue/i.test(String(mod?.title || "").trim()) && !window.App.demo && !ctx.isAdmin) {
      sb.rpc("my_whatsapp").then(({ data }) => {
        if (data || !alive()) return;
        const box = el.querySelector("#wa-box");
        box.innerHTML = `<form class="module-note" style="padding:.8rem;display:grid;gap:.5rem">
          <strong>📇 Ton numéro WhatsApp</strong><span class="muted small">Pour que le coach puisse te suivre et te répondre plus vite.</span>
          <input name="wa" type="tel" autocomplete="tel" maxlength="25" placeholder="Ex : +225 07 00 00 00 00" required>
          <button class="btn btn-primary btn-sm" type="submit">Envoyer au coach</button></form>`;
        box.querySelector("form").addEventListener("submit", async (e) => {
          e.preventDefault();
          const { error } = await sb.rpc("set_my_whatsapp", { num: e.target.wa.value });
          if (error) return toast(error.message, true);
          box.innerHTML = `<div class="module-note" style="padding:.8rem">✅ Merci ! Ton numéro a été envoyé au coach.</div>`;
        });
      });
    }

    const btn = el.querySelector("#done-btn");
    const paint = () => {
      const isDone = done.has(current.id);
      btn.textContent = isDone ? "✓ Leçon terminée" : "Marquer comme terminée";
      btn.className = "btn " + (isDone ? "badge-ok" : "");
      const dot = el.querySelector(`[data-dot="${current.id}"]`);
      if (dot) { dot.classList.toggle("done", isDone); dot.textContent = isDone ? "✓" : ""; }
    };
    async function setDone(value) {
      if (value === done.has(current.id)) return;
      const res = value
        ? await sb.from("lesson_progress").upsert({ user_id: ctx.user.id, lesson_id: current.id })
        : await sb.from("lesson_progress").delete().eq("user_id", ctx.user.id).eq("lesson_id", current.id);
      if (res.error) return toast(res.error.message, true);
      value ? done.add(current.id) : done.delete(current.id);
      paint();
    }
    btn.addEventListener("click", () => setDone(!done.has(current.id)));
    paint();

    const player = await window.ProtectedPlayer.mount(el.querySelector("#player-slot"), current.youtube_id, {
      onEnded: () => setDone(true),
    });
    ctx.onCleanup(() => player.destroy());
  }

  // =================================================================
  //  Composant de discussion réutilisé (salons + messages privés)
  // =================================================================
  async function mountChat(box, ctx, opts) {
    const alive = ctx.isCurrent;
    box.innerHTML = `
      <div class="chat-head"><h2>${opts.title}</h2>${opts.subtitle ? `<div class="muted small">${opts.subtitle}</div>` : ""}</div>
      <div class="chat-msgs"><div class="loading">Chargement…</div></div>
      ${opts.canPost
        ? `<form class="chat-form"><textarea placeholder="${esc(opts.placeholder || "Écris un message…")}" maxlength="4000"></textarea>
             <button class="btn btn-primary" type="submit">Envoyer</button></form>`
        : `<div class="chat-form muted small" style="justify-content:center">Seule l'équipe peut publier ici.</div>`}`;

    const list = box.querySelector(".chat-msgs");
    const cache = ctx.profileCache;

    async function author(id) {
      if (!cache.has(id)) {
        const { data } = await sb.from("profiles").select("id, full_name, avatar_url, role").eq("id", id).maybeSingle();
        cache.set(id, data || { id, full_name: "Membre" });
      }
      return cache.get(id);
    }

    function render(m) {
      if (list.querySelector(`[data-id="${m.id}"]`)) return;
      const p = cache.get(m[opts.authorField]) || { full_name: "Membre" };
      const canDelete = opts.onDelete && (m[opts.authorField] === ctx.user.id || ctx.isStaff);
      const div = document.createElement("div");
      div.className = "msg";
      div.dataset.id = m.id;
      div.innerHTML = `
        ${avatar(p)}
        <div class="body">
          <div class="meta">
            <strong>${esc(p.full_name)}</strong>
            ${ROLE_BADGE[p.role] ? `<span class="badge">${ROLE_BADGE[p.role]}</span>` : ""}
            <span class="muted">${esc(relTime(m.created_at))}</span>
            ${canDelete ? `<button class="del" type="button">Supprimer</button>` : ""}
          </div>
          <div class="text">${linkify(esc(m.content))}</div>
        </div>`;
      const del = div.querySelector(".del");
      if (del) del.addEventListener("click", async () => {
        if (!(await window.App.confirmDialog("Supprimer ce message ?", "Supprimer"))) return;
        const { error } = await opts.onDelete(m.id);
        if (error) toast(error.message, true); else div.remove();
      });
      const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
      list.appendChild(div);
      if (nearBottom || m[opts.authorField] === ctx.user.id) list.scrollTop = list.scrollHeight;
    }

    const rows = must(await opts.load()).reverse();
    if (!alive()) return;
    await Promise.all([...new Set(rows.map((r) => r[opts.authorField]))].map(author));
    list.innerHTML = rows.length ? "" : `<div class="empty" data-empty>${opts.emptyText || "Aucun message pour l'instant. Lance la discussion !"}</div>`;
    rows.forEach(render);
    list.scrollTop = list.scrollHeight;

    // Nouveaux messages en temps réel
    const channel = sb
      .channel(opts.realtime.key + "-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: opts.realtime.table, filter: opts.realtime.filter }, async ({ new: m }) => {
        if (opts.realtime.accept && !opts.realtime.accept(m)) return;
        await author(m[opts.authorField]);
        list.querySelector("[data-empty]")?.remove();
        render(m);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: opts.realtime.table }, ({ old }) => {
        list.querySelector(`[data-id="${old.id}"]`)?.remove();
      })
      .subscribe();
    ctx.onCleanup(() => sb.removeChannel(channel));

    const form = box.querySelector("form");
    if (!form) return;
    const input = form.querySelector("textarea");
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = input.value.trim();
      if (!content) return;
      input.disabled = true;
      const { data, error } = await opts.send(content);
      input.disabled = false;
      if (error) return toast(error.message, true);
      input.value = "";
      input.focus();
      list.querySelector("[data-empty]")?.remove();
      render(data);
    });
  }

  // =================================================================
  //  COMMUNAUTÉ : salons de discussion générale
  // =================================================================
  async function community(el, ctx, parts) {
    const alive = ctx.isCurrent;
    const channels = must(await sb.from("channels").select("id, slug, name, description, emoji, staff_only").order("position"));
    if (!alive()) return;
    if (!channels.length) { el.innerHTML = `<div class="empty">Aucun salon pour l'instant.</div>`; return; }

    const current = channels.find((c) => c.slug === parts[1]) || channels[0];
    el.innerHTML = `
      <div class="page-head"><h1>Communauté</h1></div>
      <div class="chat-layout">
        <div class="card chat-side">
          <div class="side-title">Salons</div>
          ${channels.map((c) => `
            <a class="chat-link ${c.id === current.id ? "active" : ""}" href="#/communaute/${encodeURIComponent(c.slug)}">
              <span>${esc(c.emoji || "💬")}</span><span>${esc(c.name)}</span>
            </a>`).join("")}
        </div>
        <div class="card chat-box"></div>
      </div>`;

    await mountChat(el.querySelector(".chat-box"), ctx, {
      title: `${esc(current.emoji || "💬")} ${esc(current.name)}`,
      subtitle: esc(current.description || ""),
      canPost: !current.staff_only || ctx.isStaff,
      placeholder: `Écrire dans #${current.name}…`,
      authorField: "user_id",
      load: () => sb.from("messages").select("id, content, created_at, user_id").eq("channel_id", current.id).is("parent_id", null).order("created_at", { ascending: false }).limit(100),
      send: (content) => sb.from("messages").insert({ channel_id: current.id, user_id: ctx.user.id, content }).select("id, content, created_at, user_id").single(),
      onDelete: (id) => sb.from("messages").delete().eq("id", id),
      realtime: { key: "salon", table: "messages", filter: `channel_id=eq.${current.id}`, accept: (m) => !m.parent_id },
    });
  }

  // =================================================================
  //  MESSAGES PRIVÉS : chaque membre peut écrire en privé à n'importe quel membre
  // =================================================================
  async function coachs(el, ctx, parts) {
    const alive = ctx.isCurrent;
    const me = ctx.user.id;
    const [members, rows] = await Promise.all([
      sb.from("profiles").select("id, full_name, avatar_url, role, paid").neq("id", me).order("full_name").then(must),
      sb.from("private_messages").select("id, sender_id, recipient_id, content, created_at")
        .or(`sender_id.eq.${me},recipient_id.eq.${me}`)
        .order("created_at", { ascending: false }).limit(500).then(must),
    ]);
    if (!alive()) return;

    // Seuls les membres qui ont accès (payé, coach ou admin) apparaissent
    const people = members.filter((p) => p.paid || p.role === "coach" || p.role === "admin");
    people.forEach((p) => ctx.profileCache.set(p.id, p));
    const byId = new Map(people.map((p) => [p.id, p]));

    // Conversations récentes : une ligne par personne, la plus récente en haut
    const convs = [];
    const seen = new Set();
    for (const r of rows) {
      const other = r.sender_id === me ? r.recipient_id : r.sender_id;
      if (seen.has(other)) continue;
      seen.add(other);
      convs.push({ person: byId.get(other) || { id: other, full_name: "Membre" }, last: r });
    }
    const current = byId.get(parts[1]) || null;
    const others = people.filter((p) => !seen.has(p.id));

    const link = (p, last) => `
      <a class="chat-link ${current && p.id === current.id ? "active" : ""}" href="#/coachs/${p.id}" data-search="${esc((p.full_name || "").toLowerCase())}">
        ${avatar(p)}
        <span class="grow" style="min-width:0">
          <span style="display:block">${esc(p.full_name)} ${ROLE_BADGE[p.role] ? `<span class="badge">${ROLE_BADGE[p.role]}</span>` : ""}</span>
          ${last ? `<span class="muted small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${last.sender_id === me ? "Toi : " : ""}${esc(last.content)}</span>` : ""}
        </span>
      </a>`;

    el.innerHTML = `
      <div class="page-head"><div><h1>Messages privés</h1><div class="muted">Écris en privé à n'importe quel membre de la communauté.</div></div></div>
      <div class="chat-layout">
        <div class="card chat-side dm-side">
          <input class="dm-search" id="dm-search" placeholder="Rechercher un membre…" aria-label="Rechercher un membre">
          ${convs.length ? `<div class="side-title">Conversations</div>${convs.map((c) => link(c.person, c.last)).join("")}` : ""}
          <div class="side-title">Membres</div>
          ${others.length ? others.map((p) => link(p)).join("") : `<div class="muted small" style="padding:.7rem">Aucun autre membre pour l'instant.</div>`}
        </div>
        <div class="card chat-box">${current ? "" : `<div class="empty" style="margin:auto;border:0">Choisis un membre à gauche pour lui écrire.</div>`}</div>
      </div>`;

    el.querySelector("#dm-search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      el.querySelectorAll(".dm-side .chat-link").forEach((a) => a.classList.toggle("hidden", !!q && !a.dataset.search.includes(q)));
    });

    if (!current) {
      // Nouveau message reçu → on rafraîchit la liste des conversations
      const ch = sb.channel("dm-inbox-" + Math.random().toString(36).slice(2))
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "private_messages", filter: `recipient_id=eq.${me}` }, () => {
          sb.removeChannel(ch);
          if (alive()) coachs(el, ctx, parts);
        })
        .subscribe();
      ctx.onCleanup(() => sb.removeChannel(ch));
      return;
    }

    const chatBox = el.querySelector(".chat-box");
    await mountChat(chatBox, ctx, {
      title: esc(current.full_name),
      subtitle: "Conversation privée : seuls vous deux pouvez la lire.",
      canPost: true,
      placeholder: `Écrire à ${current.full_name}…`,
      authorField: "sender_id",
      emptyText: `Dis bonjour à ${esc((current.full_name || "").split(" ")[0])} 👋`,
      load: () => sb.from("private_messages").select("id, content, created_at, sender_id")
        .or(`and(sender_id.eq.${me},recipient_id.eq.${current.id}),and(sender_id.eq.${current.id},recipient_id.eq.${me})`)
        .order("created_at", { ascending: false }).limit(200),
      send: (content) => sb.from("private_messages").insert({ sender_id: me, recipient_id: current.id, content })
        .select("id, content, created_at, sender_id").single(),
      realtime: { key: "dm", table: "private_messages", filter: `recipient_id=eq.${me}`, accept: (m) => m.sender_id === current.id },
    });
    if (ctx.isAdmin && alive()) pinnedCard(chatBox, current, me).catch((e) => console.warn(e));
  }

  // Coach : en haut de chaque conversation, épinglés dans l'ordre : 1. coordonnées (Gmail + WhatsApp), 2. fiche « Ma niche », 3. contrat
  async function pinnedCard(box, who, me) {
    const [card, niche, contract] = await Promise.all([
      sb.rpc("admin_member_card", { target: who.id }).then(({ data }) => data?.[0]),
      sb.from("private_messages").select("content, created_at").eq("sender_id", who.id).eq("recipient_id", me)
        .like("content", "📝 MA FICHE NICHE%").order("created_at", { ascending: false }).limit(1).then(({ data }) => data?.[0]),
      sb.from("contracts").select("id, token, status, second_amount, first_paid_at, signed_at").eq("user_id", who.id)
        .order("signed_at", { ascending: false }).limit(1).then(({ data }) => data?.[0]),
    ]);
    if (!card) return;
    const wa = String(card.whatsapp || "").replace(/\D/g, "");
    const contractLine = contract ? (contract.status === "paid" ? "Payé en totalité"
      : `Reste ${Number(contract.second_amount).toLocaleString("fr-FR")} FCFA · J+${Math.floor((Date.now() - new Date(contract.first_paid_at || contract.signed_at)) / 86400000)}`) : "";
    const pin = document.createElement("div");
    pin.className = "dm-pinned";
    pin.style.cssText = "border-bottom:1px solid var(--line, #2a2540);padding:.6rem .9rem;display:grid;gap:.45rem;font-size:.92rem";
    pin.innerHTML = `
      <div><span class="muted small">📌 1 · Coordonnées</span><div><strong>${esc(card.full_name)}</strong> · ${esc(card.email || "")} · ${wa ? `WhatsApp <strong>${esc(card.whatsapp)}</strong> <a class="btn btn-sm" href="https://wa.me/${wa}" target="_blank" rel="noopener">Ouvrir WhatsApp</a>` : `<span class="muted">WhatsApp pas encore donné</span>`}</div></div>
      <details><summary class="muted small" style="cursor:pointer">📌 2 · Fiche « Ma niche » ${niche ? `(reçue ${esc(relTime(niche.created_at))})` : "(pas encore remplie)"}</summary>${niche ? `<div style="white-space:pre-wrap;margin-top:.4rem">${linkify(esc(niche.content))}</div>` : ""}</details>
      ${contract ? `<div><span class="muted small">📌 3 · Paiement en 2 fois :</span> ${esc(contractLine)} <a class="btn btn-sm" href="contrat.html?id=${encodeURIComponent(contract.id)}&t=${encodeURIComponent(contract.token)}" target="_blank" rel="noopener">Contrat</a></div>` : ""}`;
    box.querySelector(".chat-head")?.after(pin);
  }
  // =================================================================
  //  FORMULAIRE « MA NICHE » : les réponses partent en message privé au coach (admin)
  // =================================================================
  const NICHE_FORM = [
    { title: "Toi", fields: [
      { name: "pays", label: "Tu vis dans quel pays ?", type: "text", required: true },
      { name: "age", label: "Ton âge", type: "select", options: ["Moins de 18 ans", "18 à 24 ans", "25 à 34 ans", "35 à 44 ans", "45 ans et plus"] },
      { name: "activite", label: "Qu'est-ce que tu fais aujourd'hui dans la vie ? (travail, études...)", type: "text" },
    ] },
    { title: "Ton parcours", fields: [
      { name: "experience", label: "Tu as déjà créé du contenu sur les réseaux ?", type: "select", required: true, options: ["Jamais, je pars de zéro", "J'ai essayé mais j'ai arrêté", "Je publie déjà régulièrement"] },
      { name: "historique", label: "Raconte-moi : comment tu as commencé, ce qui a marché, ce qui n'a pas marché (et le lien de ton compte si tu en as un)", type: "textarea" },
      { name: "decouverte", label: "Comment tu as connu Siba Cash Empire ?", type: "text" },
      { name: "pourquoi", label: "Pourquoi tu as rejoint l'accompagnement ?", type: "textarea", required: true },
    ] },
    { title: "Tes goûts", fields: [
      { name: "passions", label: "Qu'est-ce que tu aimes ? Tes passions, ce qui te parle", type: "textarea", required: true },
      { name: "regarde", label: "Quelles vidéos tu regardes le plus sur TikTok ou YouTube ?", type: "textarea" },
    ] },
    { title: "Ta niche", fields: [
      { name: "niche", label: "La niche que tu as choisie (regarde la liste des niches juste avant)", type: "select", required: true, optionsFrom: "NICHES", extra: ["Je n'ai pas encore choisi", "Autre (je l'écris en dessous)"] },
      { name: "theme", label: "Ta sous-niche ou ta thématique précise (ex. : histoires de joueurs africains)", type: "text" },
      { name: "modeles", label: "2 ou 3 comptes que tu veux prendre comme modèle (liens ou noms)", type: "textarea" },
      { name: "pourquoiNiche", label: "Pourquoi cette niche ?", type: "textarea" },
    ] },
    { title: "Ton objectif", fields: [
      { name: "plateforme", label: "Sur quelle plateforme tu veux commencer ?", type: "select", required: true, options: ["TikTok", "YouTube", "Les deux"] },
      { name: "cible", label: "Quel pays tu veux viser avec tes vidéos ?", type: "text" },
      { name: "gains", label: "Comment tu veux gagner de l'argent ?", type: "checks", options: ["Programme de récompenses TikTok", "Monétisation YouTube (pubs)", "Affiliation (vendre les produits des autres)", "Partenariats avec des marques", "Vendre mes propres produits", "Je ne sais pas encore"] },
      { name: "objectif", label: "Combien tu veux gagner par mois avec tes vidéos ?", type: "select", required: true, options: ["Moins de 100 €", "100 à 500 €", "500 à 1 500 €", "1 500 à 5 000 €", "Plus de 5 000 €"] },
      { name: "delai", label: "En combien de temps tu veux y arriver ?", type: "select", options: ["1 mois", "3 mois", "6 mois", "1 an", "Je prends le temps qu'il faut"] },
      { name: "temps", label: "Combien de temps tu peux y consacrer par jour ?", type: "select", required: true, options: ["Moins de 30 minutes", "30 minutes à 1 heure", "1 à 2 heures", "Plus de 2 heures"] },
      { name: "materiel", label: "Avec quoi tu vas créer tes vidéos ?", type: "select", options: ["Téléphone seulement", "Ordinateur seulement", "Téléphone et ordinateur"] },
      { name: "blocage", label: "Qu'est-ce qui te bloque ou te fait peur aujourd'hui ?", type: "textarea" },
      { name: "autre", label: "Autre chose à me dire ?", type: "textarea" },
    ] },
  ];

  async function maNiche(el, ctx) {
    const admins = must(await sb.from("profiles").select("id, full_name, role").eq("role", "admin").limit(1));
    const coach = admins[0];
    const niches = cfg.NICHES || [];
    const fieldHtml = (f) => {
      const req = f.required ? " required" : "";
      const star = f.required ? ' <span style="color:var(--accent)">*</span>' : "";
      let input;
      if (f.type === "textarea") input = `<textarea name="${f.name}" rows="3" maxlength="600"${req}></textarea>`;
      else if (f.type === "select") {
        const opts = [...(f.optionsFrom ? niches : f.options), ...(f.extra || [])];
        input = `<select name="${f.name}"${req}><option value="">Choisis…</option>${opts.map((o) => `<option>${esc(o)}</option>`).join("")}</select>`;
      } else if (f.type === "checks") {
        input = f.options.map((o) => `<label class="row" style="gap:.5rem;font-weight:400;margin:.3rem 0"><input type="checkbox" name="${f.name}" value="${esc(o)}" style="width:auto"> ${esc(o)}</label>`).join("");
      } else input = `<input name="${f.name}" maxlength="200"${req}>`;
      return `<div class="field"><label>${esc(f.label)}${star}</label>${input}</div>`;
    };

    el.innerHTML = `
      <div class="page-head"><div><h1>📝 Ma niche</h1><div class="muted">Réponds tranquillement : tes réponses m'arrivent en message privé. Comme ça, je te connais déjà avant notre échange et je peux t'aider à choisir et à rendre ta niche virale.</div></div></div>
      <form class="card" id="niche-form" style="max-width:720px">
        ${NICHE_FORM.map((s, i) => `<h2 style="font-size:1.15rem;margin:${i ? "1.6rem" : "0"} 0 .8rem">${i + 1}. ${esc(s.title)}</h2>${s.fields.map(fieldHtml).join("")}`).join("")}
        <button class="btn btn-primary" type="submit">Envoyer mes réponses</button>
        <div class="muted small" style="margin-top:.6rem">Les champs avec * sont obligatoires.</div>
      </form>
      <div id="niche-preview"></div>`;

    el.querySelector("#niche-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const lines = ["📝 MA FICHE NICHE", ""];
      NICHE_FORM.forEach((s) => {
        lines.push(`▶ ${s.title.toUpperCase()}`);
        s.fields.forEach((f) => {
          const v = (f.type === "checks" ? fd.getAll(f.name).join(", ") : String(fd.get(f.name) || "")).trim();
          if (v) lines.push(`• ${f.label} : ${v.slice(0, 600)}`);
        });
        lines.push("");
      });
      const content = lines.join("\n").trim().slice(0, 4000);
      if (!coach || coach.id === ctx.user.id) {
        el.querySelector("#niche-preview").innerHTML = `<div class="card" style="max-width:720px;margin-top:1rem;white-space:pre-wrap"><strong>Aperçu (tu es le coach, le message n'est pas envoyé) :</strong>\n\n${esc(content)}</div>`;
        return;
      }
      const btn = e.target.querySelector("button[type=submit]");
      btn.disabled = true;
      const { error } = await sb.from("private_messages").insert({ sender_id: ctx.user.id, recipient_id: coach.id, content });
      if (error) { btn.disabled = false; toast(error.message, true); return; }
      toast("Merci ! Tes réponses ont bien été envoyées.");
      window.location.hash = `#/coachs/${coach.id}`;
    });
  }

  // =================================================================
  //  CALENDRIER des appels en direct
  // =================================================================
  function gcalLink(ev) {
    const start = new Date(ev.starts_at);
    const end = new Date(start.getTime() + ev.duration_min * 60000);
    const f = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const p = new URLSearchParams({
      action: "TEMPLATE",
      text: ev.title,
      dates: `${f(start)}/${f(end)}`,
      details: [ev.description, ev.meeting_url].filter(Boolean).join("\n\n"),
    });
    return "https://calendar.google.com/calendar/render?" + p.toString();
  }

  function eventHtml(ev, ctx) {
    const start = new Date(ev.starts_at);
    const end = new Date(start.getTime() + ev.duration_min * 60000);
    const now = Date.now();
    const live = now >= start - 10 * 60000 && now <= end;
    const past = now > end;
    const url = safeUrl(ev.meeting_url);
    return `
      <div class="event-item" data-ev="${ev.id}">
        <div class="event-date">${live ? `<span class="live-dot"></span>En direct · ` : ""}${esc(fmtDateTime.format(start))} – ${esc(fmtTime.format(end))}</div>
        <strong style="display:block;margin:.2rem 0">${esc(ev.title)}</strong>
        ${ev.description ? `<div class="muted small" style="white-space:pre-wrap">${linkify(esc(ev.description))}</div>` : ""}
        <div class="row" style="margin-top:.6rem">
          ${url && !past ? `<a class="btn btn-sm ${live ? "btn-primary" : ""}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${live ? "Rejoindre l'appel" : "Lien de l'appel"}</a>` : ""}
          ${!past ? `<a class="btn btn-sm" href="${esc(gcalLink(ev))}" target="_blank" rel="noopener noreferrer">+ Mon agenda</a>` : `<span class="muted small">Terminé</span>`}
          ${ctx.isStaff ? `<button class="btn btn-sm btn-danger" data-del-ev="${ev.id}">Supprimer</button>` : ""}
        </div>
      </div>`;
  }

  async function calendar(el, ctx, parts) {
    const alive = ctx.isCurrent;
    const today = new Date();
    const m = /^(\d{4})-(\d{2})$/.exec(parts[1] || "");
    const year = m ? +m[1] : today.getFullYear();
    const month = m ? +m[2] - 1 : today.getMonth();

    const first = new Date(year, month, 1);
    const gridStart = new Date(first);
    gridStart.setDate(1 - ((first.getDay() + 6) % 7)); // lundi
    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 42);

    const [monthEvents, upcoming] = await Promise.all([
      sb.from("events").select("*").gte("starts_at", gridStart.toISOString()).lt("starts_at", gridEnd.toISOString()).order("starts_at").then(must),
      sb.from("events").select("*").gte("starts_at", new Date(Date.now() - 3 * 3600000).toISOString()).order("starts_at").limit(12).then(must),
    ]);
    if (!alive()) return;
    const stillRelevant = upcoming.filter((e) => new Date(e.starts_at).getTime() + e.duration_min * 60000 > Date.now());

    const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const prev = ym(new Date(year, month - 1, 1)), next = ym(new Date(year, month + 1, 1));
    const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(first);
    const allById = new Map([...monthEvents, ...upcoming].map((e) => [e.id, e]));

    const days = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const evs = monthEvents.filter((e) => new Date(e.starts_at).toDateString() === d.toDateString());
      days.push(`
        <div class="cal-day ${d.getMonth() !== month ? "out" : ""} ${d.toDateString() === today.toDateString() ? "today" : ""}">
          <div class="n">${d.getDate()}</div>
          ${evs.map((e) => `<span class="cal-ev" data-show="${e.id}" title="${esc(e.title)}">${esc(fmtTime.format(new Date(e.starts_at)))} ${esc(e.title)}</span>`).join("")}
        </div>`);
    }

    el.innerHTML = `<div id="cal-root">
      <div class="page-head">
        <div><h1>Calendrier</h1><div class="muted">Les prochains appels et cours en direct.</div></div>
        ${ctx.isStaff ? `<button class="btn btn-primary" id="new-ev">+ Planifier un appel</button>` : ""}
      </div>
      ${ctx.isStaff ? `
      <form class="card hidden" id="ev-form" style="margin-bottom:1.5rem">
        <h3>Nouvel appel</h3>
        <div class="row">
          <div class="field grow"><label>Titre</label><input name="title" required placeholder="Ex : Session questions/réponses"></div>
          <div class="field"><label>Date et heure</label><input name="starts_at" type="datetime-local" required></div>
          <div class="field" style="width:110px"><label>Durée (min)</label><input name="duration_min" type="number" min="5" value="60" required></div>
        </div>
        <div class="field"><label>Lien Zoom / Google Meet</label><input name="meeting_url" type="url" placeholder="https://meet.google.com/…"></div>
        <div class="field"><label>Description</label><textarea name="description" rows="2"></textarea></div>
        <button class="btn btn-primary" type="submit">Enregistrer</button>
      </form>` : ""}
      <div class="cal-layout">
        <div class="card">
          <div class="cal-head">
            <a class="btn btn-sm" href="#/calendrier/${prev}">←</a>
            <h2>${esc(monthLabel)}</h2>
            <a class="btn btn-sm" href="#/calendrier/${next}">→</a>
          </div>
          <div class="cal-grid">
            ${["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}
            ${days.join("")}
          </div>
        </div>
        <div>
          <div class="card hidden" id="ev-detail" style="margin-bottom:1rem"></div>
          <div class="card">
            <h3 style="font-size:1.05rem">Prochains appels</h3>
            ${stillRelevant.length ? stillRelevant.map((e) => eventHtml(e, ctx)).join("") : `<p class="muted small" style="margin:0">Aucun appel prévu pour l'instant.</p>`}
          </div>
        </div>
      </div></div>`;

    el.querySelector("#cal-root").addEventListener("click", async (e) => {
      const show = e.target.closest("[data-show]");
      if (show) {
        const detail = el.querySelector("#ev-detail");
        detail.innerHTML = eventHtml(allById.get(show.dataset.show), ctx);
        detail.classList.remove("hidden");
        detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      const del = e.target.closest("[data-del-ev]");
      if (del && (await window.App.confirmDialog("Supprimer cet appel ?", "Supprimer"))) {
        const { error } = await sb.from("events").delete().eq("id", del.dataset.delEv);
        if (error) return toast(error.message, true);
        toast("Appel supprimé");
        calendar(el, ctx, parts);
      }
    });

    const form = el.querySelector("#ev-form");
    if (form) {
      el.querySelector("#new-ev").addEventListener("click", () => form.classList.toggle("hidden"));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = new FormData(form);
        const { error } = await sb.from("events").insert({
          title: f.get("title"),
          description: f.get("description") || null,
          starts_at: new Date(f.get("starts_at")).toISOString(),
          duration_min: +f.get("duration_min"),
          meeting_url: f.get("meeting_url") || null,
        });
        if (error) return toast(error.message, true);
        toast("Appel planifié ✓");
        calendar(el, ctx, parts);
      });
    }
  }

  window.Views = { paywall, dashboard, formation, community, coachs, maNiche, calendar, safeUrl, must };
})();
