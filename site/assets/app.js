// Point d'entrée de l'espace membre : connexion, vérification du paiement, navigation
(async function () {
  const { cfg, sb, demo, esc, avatar, toast } = window.App;
  const view = document.getElementById("view");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  document.title = cfg.SITE_NAME + " — Espace membre";
  document.querySelectorAll("[data-site-name]").forEach((el) => (el.textContent = cfg.SITE_NAME));

  if (demo) {
    window.DemoBackend.ensureSession();
    const me = window.DemoBackend.me();
    const bar = document.getElementById("demo-bar");
    const mode = me.role === "admin" ? "admin" : me.paid ? "member" : "new";
    bar.innerHTML = `
      <span><strong>Mode démo</strong> · données d'exemple, rien n'est envoyé</span>
      <span class="row" style="gap:.35rem">Voir comme :
        <button class="btn btn-sm ${mode === "new" ? "on" : ""}" data-demo="new">Nouveau visiteur</button>
        <button class="btn btn-sm ${mode === "member" ? "on" : ""}" data-demo="member">Élève</button>
        <button class="btn btn-sm ${mode === "admin" ? "on" : ""}" data-demo="admin">Toi (admin)</button>
      </span>
      <button class="btn btn-sm" data-demo="reset">Réinitialiser</button>
      <a class="btn btn-sm" href="index.html">← Page d'accueil</a>`;
    bar.classList.remove("hidden");
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-demo]");
      if (!b) return;
      const m = b.dataset.demo;
      if (m === "reset") window.DemoBackend.reset();
      if (m === "new") window.DemoBackend.setMe({ role: "student", paid: false });
      if (m === "member") window.DemoBackend.setMe({ role: "student", paid: true });
      if (m === "admin") window.DemoBackend.setMe({ role: "admin", paid: true });
      window.location.hash = m === "admin" ? "#/admin" : "#/accueil";
      window.location.reload();
    });
  }

  const { data: { session } } = await sb.auth.getSession();
  if (!session) return window.location.replace("index.html");
  const user = session.user;

  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace("index.html");
  });

  async function loadProfile() {
    const { data } = await sb.from("profiles").select("id, full_name, avatar_url, role, paid").eq("id", user.id).maybeSingle();
    return data;
  }

  let profile = await loadProfile();
  if (!profile) { await sleep(1500); profile = await loadProfile(); }
  if (!profile) {
    console.error("Profil introuvable pour", user.id, user.email);
    view.innerHTML = `<div class="empty">Ton compte est bien connecté (${esc(user.email || "")}), mais ton profil n'a pas pu être chargé.<br><br>
      <button class="btn btn-primary" onclick="location.reload()">Réessayer</button>
      <button class="btn" id="relogin">Me reconnecter</button><br><br>
      <span class="muted small">Si ça continue, envoie une capture de cet écran au coach.</span></div>`;
    view.querySelector("#relogin").addEventListener("click", async () => { await sb.auth.signOut(); window.location.replace("index.html"); });
    return;
  }

  // Retour de la page de paiement : on attend que le paiement soit confirmé
  const params = new URLSearchParams(window.location.search);
  if (params.get("paiement") === "ok") {
    history.replaceState(null, "", window.location.pathname + window.location.hash);
    if (!profile.paid) {
      view.innerHTML = `<div class="paywall"><div class="card"><h2>Paiement reçu 🎉</h2><p class="muted">Activation de ton accès en cours, ça prend quelques secondes…</p></div></div>`;
      for (let i = 0; i < 20 && !profile.paid; i++) {
        // SasPay : on demande au serveur de revérifier le paiement (en plus du webhook)
        if (cfg.PAYMENT_PROVIDER === "saspay" && i % 3 === 0) {
          await sb.functions.invoke("saspay", { body: { action: "sync" } });
        }
        await sleep(2000);
        profile = (await loadProfile()) || profile;
      }
      if (profile.paid) toast("Bienvenue dans l'accompagnement ! 🎉");
      else toast("Paiement en cours de validation. Rafraîchis la page dans une minute.", true);
    }
  } else if (!profile.paid && profile.role === "student" && !demo && cfg.PAYMENT_PROVIDER === "saspay") {
    // A peut-être payé AVANT de se connecter (page d'accueil) : on rattache son paiement
    const { data } = await sb.functions.invoke("saspay", { body: { action: "sync" } });
    if (data?.paid) {
      profile = (await loadProfile()) || profile;
      toast("Paiement retrouvé : bienvenue dans l'accompagnement ! 🎉");
    }
  }
  if (profile.paid) {
    try { localStorage.removeItem("sce_payment_id"); localStorage.removeItem("sce_payment_email"); } catch (_) {}
  }

  // Paiement en 2 fois : 2e versement non payé le lendemain de la date limite → accès bloqué jusqu'au paiement
  let split = null;
  if (profile.paid && profile.role === "student" && !demo) {
    const { data } = await sb.rpc("my_split_status");
    split = data?.[0] || null;
  }

  const ctx = {
    user,
    profile,
    split,
    isAdmin: profile.role === "admin",
    isStaff: profile.role === "coach" || profile.role === "admin",
    hasAccess: (profile.paid && !split?.blocked) || profile.role === "coach" || profile.role === "admin",
    cleanups: [],
    onCleanup(fn) { this.cleanups.push(fn); },
    profileCache: new Map([[profile.id, profile]]),
  };

  // Barre latérale
  const roleLabel = { admin: "Admin", coach: "Coach", student: profile.paid ? "Membre" : "Invité" }[profile.role];
  document.getElementById("me").innerHTML = `
    ${avatar(profile)}
    <div class="grow">
      <div class="name">${esc(profile.full_name)}</div>
      <div class="muted small">${esc(roleLabel)}</div>
    </div>
    <button class="btn btn-sm" data-logout title="Déconnexion">⎋</button>`;
  document.querySelectorAll("[data-logout]").forEach((b) =>
    b.addEventListener("click", async () => {
      await sb.auth.signOut();
      window.location.replace("index.html");
    })
  );
  if (ctx.isAdmin) document.querySelector('[data-nav="admin"]').classList.remove("hidden");

  const routes = {
    accueil: window.Views.dashboard,
    formation: window.Views.formation,
    communaute: window.Views.community,
    coachs: window.Views.coachs,
    "ma-niche": window.Views.maNiche,
    calendrier: window.Views.calendar,
    admin: window.Admin.render,
  };

  let routeToken = 0;
  async function route() {
    const token = ++routeToken;
    ctx.cleanups.splice(0).forEach((fn) => { try { fn(); } catch (_) {} });

    const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
    let name = parts[0] || "accueil";
    if (!routes[name] || (name === "admin" && !ctx.isAdmin)) name = "accueil";

    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
    view.innerHTML = `<div class="loading">Chargement…</div>`;
    ctx.isCurrent = () => token === routeToken;

    try {
      if (!ctx.hasAccess) await window.Views.paywall(view, ctx);
      else await routes[name](view, ctx, parts);
    } catch (err) {
      console.error(err);
      if (token === routeToken) view.innerHTML = `<div class="empty">Une erreur est survenue : ${esc(err.message || err)}</div>`;
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();
