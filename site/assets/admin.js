// Espace administrateur : modules, vidéos, salons, membres
(function () {
  const { sb, esc, avatar, toast, youtubeId } = window.App;
  const must = (res) => { if (res.error) throw res.error; return res.data; };

  async function render(el, ctx, parts) {
    const tab = parts[1] || "formation";
    el.innerHTML = `
      <div class="page-head"><div><h1>Administration</h1><div class="muted">Ton espace à toi seul : vidéos, page d'accueil, communauté et membres.</div></div></div>
      <div class="tabs">
        ${[["formation", "🎬 Vidéos de cours"], ["accueil", "🏠 Page d'accueil"], ["salons", "💬 Salons"], ["membres", "👥 Membres"], ["promos", "💳 Paiement en 2 fois"], ["associes", "🤝 Associés"], ["stats", "📊 Statistiques"], ["aide", "❓ Aide"]]
          .map(([k, l]) => `<a class="tab ${k === tab ? "active" : ""}" href="#/admin/${k}">${l}</a>`).join("")}
      </div>
      <div id="admin-body"><div class="loading">Chargement…</div></div>`;
    const body = el.querySelector("#admin-body");
    const alive = ctx.isCurrent;
    const tabs = { formation: formationTab, accueil: homeTab, salons: channelsTab, membres: membersTab, promos: promoTab, associes: associatesTab, stats: statsTab, aide: helpTab };
    await (tabs[tab] || formationTab)(body, ctx, alive);
  }

  // ---------------------------------------------------------------
  //  MODULES & VIDÉOS
  // ---------------------------------------------------------------
  async function formationTab(body, ctx, alive) {
    const [modules, lessons] = await Promise.all([
      sb.from("modules").select("*").order("position").order("created_at").then(must),
      sb.from("lessons").select("*").order("position").order("created_at").then(must),
    ]);
    if (!alive()) return;

    const lessonForm = (moduleId, l = {}) => `
      <form class="card" data-lesson-form data-module="${moduleId}" ${l.id ? `data-id="${l.id}"` : ""} style="margin-top:.8rem;background:var(--surface-2);box-shadow:none">
        <div class="row">
          <div class="field grow"><label>Titre de la leçon</label><input name="title" required value="${esc(l.title || "")}"></div>
          <div class="field" style="width:100px"><label>Ordre</label><input name="position" type="number" value="${l.position ?? ""}"></div>
        </div>
        <div class="field"><label>Lien de la vidéo YouTube (non répertoriée)</label>
          <input name="youtube" required placeholder="https://youtu.be/…" value="${l.youtube_id ? `https://youtu.be/${esc(l.youtube_id)}` : ""}"></div>
        <div class="field"><label>Description / ressources (facultatif)</label><textarea name="description" rows="3">${esc(l.description || "")}</textarea></div>
        <div class="row">
          <button class="btn btn-primary btn-sm" type="submit">${l.id ? "Enregistrer" : "Ajouter la leçon"}</button>
          <button class="btn btn-sm" type="button" data-cancel>Annuler</button>
        </div>
      </form>`;

    const categories = [...new Set(modules.map((m) => m.category).filter(Boolean))];
    const moduleForm = (m = {}) => `
      <form class="card" data-module-form ${m.id ? `data-id="${m.id}"` : ""} style="margin-bottom:1rem">
        <h3 style="font-size:1rem">${m.id ? "Modifier le module" : "Nouveau module"}</h3>
        <div class="row">
          <div class="field grow"><label>Titre</label><input name="title" required value="${esc(m.title || "")}"></div>
          <div class="field" style="width:100px"><label>Ordre</label><input name="position" type="number" value="${m.position ?? modules.length + 1}"></div>
        </div>
        <div class="field"><label>Parcours (TikTok, YouTube, Afrique…)</label>
          <input name="category" list="cat-list" required value="${esc(m.category || categories[0] || "")}" placeholder="Choisis ou écris un nouveau parcours">
          <datalist id="cat-list">${categories.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></div>
        <div class="field"><label>Description</label><textarea name="description" rows="2">${esc(m.description || "")}</textarea></div>
        <div class="row">
          <button class="btn btn-primary btn-sm" type="submit">${m.id ? "Enregistrer" : "Créer le module"}</button>
          ${m.id ? `<button class="btn btn-sm" type="button" data-cancel>Annuler</button>` : ""}
        </div>
      </form>`;

    body.innerHTML = `
      <div class="row" style="justify-content:flex-end;margin-bottom:1rem">
        <button class="btn btn-primary" data-new-module>+ Nouveau module</button>
      </div>
      <div data-new-module-slot></div>
      <p class="muted small" style="margin-top:0">Les vidéos de cours ne sont visibles que par les membres qui ont payé. Mets-les sur YouTube en <strong>non répertoriée</strong>, puis colle le lien avec « + Ajouter une vidéo ».</p>
      ${modules.length ? "" : `<div class="empty">Aucun module. Crée ton premier module, puis ajoute-y tes vidéos YouTube.</div>`}
      ${modules.map((m, i) => {
        const ls = lessons.filter((l) => l.module_id === m.id);
        const newGroup = i === 0 || modules[i - 1].category !== m.category;
        return `
        ${newGroup ? `<h2 class="track-title" style="margin-top:1.4rem">${esc(m.category || "Modules")}</h2>` : ""}
        <div class="card admin-module" data-module-card="${m.id}">
          <div class="row" style="justify-content:space-between">
            <div><div class="module-num">Module ${i + 1} · ordre ${m.position} · ${ls.length} vidéo${ls.length > 1 ? "s" : ""}</div><h3 style="margin:.2rem 0 0">${esc(m.title)}</h3></div>
            <div class="row">
              <button class="btn btn-sm" data-edit-module="${m.id}">Modifier</button>
              <button class="btn btn-sm btn-danger" data-del-module="${m.id}">Supprimer</button>
            </div>
          </div>
          <div data-module-edit-slot="${m.id}"></div>
          <div style="margin-top:.8rem">
            ${ls.map((l) => `
              <div class="admin-lesson">
                <img src="https://i.ytimg.com/vi/${encodeURIComponent(l.youtube_id)}/mqdefault.jpg" alt="">
                <div class="grow"><strong>${esc(l.title)}</strong><div class="muted small">ordre ${l.position}</div></div>
                <a class="btn btn-sm" href="#/formation/lecon/${l.id}">Voir</a>
                <button class="btn btn-sm" data-edit-lesson="${l.id}">Modifier</button>
                <button class="btn btn-sm btn-danger" data-del-lesson="${l.id}">✕</button>
              </div>
              <div data-lesson-edit-slot="${l.id}"></div>`).join("")}
          </div>
          <div data-add-lesson-slot="${m.id}"></div>
          <button class="btn btn-sm" style="margin-top:.8rem" data-add-lesson="${m.id}">+ Ajouter une vidéo</button>
        </div>`;
      }).join("")}`;

    const rerender = () => formationTab(body, ctx, alive);
    const nextPos = (moduleId) => Math.max(0, ...lessons.filter((l) => l.module_id === moduleId).map((l) => l.position)) + 1;

    body.onclick = async (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const d = t.dataset;
      if ("newModule" in d) body.querySelector("[data-new-module-slot]").innerHTML = moduleForm();
      if (d.editModule) body.querySelector(`[data-module-edit-slot="${d.editModule}"]`).innerHTML = moduleForm(modules.find((m) => m.id === d.editModule));
      if (d.addLesson) {
        body.querySelector(`[data-add-lesson-slot="${d.addLesson}"]`).innerHTML = lessonForm(d.addLesson, { position: nextPos(d.addLesson) });
      }
      if (d.editLesson) {
        const l = lessons.find((x) => x.id === d.editLesson);
        body.querySelector(`[data-lesson-edit-slot="${l.id}"]`).innerHTML = lessonForm(l.module_id, l);
      }
      if ("cancel" in d) t.closest("form").remove();
      if (d.delModule && (await window.App.confirmDialog("Supprimer ce module ET toutes ses leçons ?", "Supprimer"))) {
        const { error } = await sb.from("modules").delete().eq("id", d.delModule);
        if (error) return toast(error.message, true);
        toast("Module supprimé"); rerender();
      }
      if (d.delLesson && (await window.App.confirmDialog("Supprimer cette leçon ?", "Supprimer"))) {
        const { error } = await sb.from("lessons").delete().eq("id", d.delLesson);
        if (error) return toast(error.message, true);
        toast("Leçon supprimée"); rerender();
      }
    };

    body.onsubmit = async (e) => {
      e.preventDefault();
      const form = e.target;
      const f = new FormData(form);
      const id = form.dataset.id;
      let res;

      if ("moduleForm" in form.dataset) {
        const row = {
          title: f.get("title"),
          description: f.get("description") || null,
          category: String(f.get("category") || "").trim() || "Modules",
          position: +f.get("position") || 0,
        };
        res = id ? await sb.from("modules").update(row).eq("id", id) : await sb.from("modules").insert(row);
      } else if ("lessonForm" in form.dataset) {
        const vid = youtubeId(f.get("youtube"));
        if (!vid) return toast("Lien YouTube invalide", true);
        const row = {
          module_id: form.dataset.module,
          title: f.get("title"),
          youtube_id: vid,
          description: f.get("description") || null,
          position: +f.get("position") || nextPos(form.dataset.module),
        };
        res = id ? await sb.from("lessons").update(row).eq("id", id) : await sb.from("lessons").insert(row);
      }
      if (res?.error) return toast(res.error.message, true);
      toast("Enregistré ✓");
      rerender();
    };
  }

  // ---------------------------------------------------------------
  //  PAGE D'ACCUEIL : vidéo de présentation + résultats des membres
  // ---------------------------------------------------------------
  const isVideoFile = (u) => /^https:\/\/\S+\.(mp4|webm|mov)(\?.*)?$/i.test(u || "");

  async function homeTab(body, ctx, alive) {
    const [setting, homeSetting, results] = await Promise.all([
      sb.from("site_settings").select("value").eq("key", "presentation_video").maybeSingle().then(must),
      sb.from("site_settings").select("value").eq("key", "accueil_video").maybeSingle().then(must),
      sb.from("results").select("*").order("position").order("created_at", { ascending: false }).then(must),
    ]);
    if (!alive()) return;
    const current = setting?.value || "";
    const vid = youtubeId(current);
    const homeCurrent = homeSetting?.value || "";
    const homeVid = youtubeId(homeCurrent);

    body.innerHTML = `
      <form class="card" id="home-video-form" style="margin-bottom:1.2rem">
        <h3 style="font-size:1.05rem">Vidéo d'accueil (espace membre)</h3>
        <p class="muted small">Elle s'affiche en haut de l'onglet <strong>Accueil</strong>, au-dessus des messages, pour les membres connectés. C'est une vidéo différente de la vidéo de présentation du site.</p>
        <div class="row" style="align-items:flex-end">
          <div class="field grow" style="margin:0"><label for="hv-link">Lien YouTube ou MP4</label><input id="hv-link" name="link" placeholder="https://youtu.be/…" value="${esc(homeCurrent)}"></div>
          <button class="btn btn-primary" type="submit">Enregistrer</button>
          ${homeCurrent ? `<button class="btn btn-danger" type="button" data-clear-home-video>Retirer</button>` : ""}
        </div>
        ${homeVid ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(homeVid)}/mqdefault.jpg" alt="" style="width:220px;border-radius:10px;margin-top:1rem">` : ""}
      </form>
`;
    body.innerHTML += `
      <form class="card" id="video-form" style="margin-bottom:1.2rem">
        <h3 style="font-size:1.05rem">Vidéo de présentation (page publique du site)</h3>
        <p class="muted small">Elle s'affiche tout en haut de la page de vente, visible par tout le monde avant l'inscription. Lien YouTube (« non répertoriée » ou « publique ») ou lien d'une vidéo MP4 hébergée sur le site.</p>
        <div class="row" style="align-items:flex-end">
          <div class="field grow" style="margin:0"><label for="pv-link">Lien YouTube ou MP4</label><input id="pv-link" name="link" placeholder="https://youtu.be/…" value="${esc(current)}"></div>
          <button class="btn btn-primary" type="submit">Enregistrer</button>
          ${current ? `<button class="btn btn-danger" type="button" data-clear-video>Retirer</button>` : ""}
        </div>
        ${vid ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(vid)}/mqdefault.jpg" alt="" style="width:220px;border-radius:10px;margin-top:1rem">`
          : isVideoFile(current) ? `<img src="${esc(current.replace(/\.(mp4|webm|mov)(\?.*)?$/i, "-poster.jpg"))}" alt="" style="width:220px;border-radius:10px;margin-top:1rem">` : ""}
      </form>

      <form class="card" id="result-form" style="margin-bottom:1.2rem">
        <h3 style="font-size:1.05rem">Ajouter un résultat de membre (vidéo ou capture)</h3>
        <p class="muted small">Il apparaît dans la rangée « 🏆 Résultats des membres » qui défile sous ta vidéo de présentation. Publie uniquement de vrais résultats, avec l'accord du membre.</p>
        <div class="field"><label for="r-image">Vidéo (MP4 ou MOV, 50 Mo maximum) ou capture d'écran (JPG, PNG, 5 Mo maximum)</label><input id="r-image" name="image" type="file" accept="video/mp4,video/quicktime,video/webm,image/png,image/jpeg,image/webp"></div>
        <div class="field"><label for="r-yt">… ou lien YouTube de la vidéo (pratique si elle est lourde : mets-la en « non répertoriée »)</label><input id="r-yt" name="yt" placeholder="https://youtu.be/…"></div>
        <div class="row">
          <div class="field grow"><label for="r-name">Prénom du membre</label><input id="r-name" name="name" maxlength="60" placeholder="Ex : Moussa"></div>
          <div class="field" style="width:100px"><label for="r-pos">Ordre</label><input id="r-pos" name="position" type="number" value="${results.length + 1}"></div>
        </div>
        <div class="field"><label for="r-caption">Légende</label><input id="r-caption" name="caption" maxlength="140" placeholder="Ex : 120 000 vues en 2 semaines sur sa chaîne faceless"></div>
        <button class="btn btn-primary" type="submit" id="r-submit">Ajouter le résultat</button>
      </form>

      <div class="card">
        <h3 style="font-size:1.05rem">Résultats affichés (${results.length})</h3>
        ${results.length ? `<div class="results-admin">${results.map((r) => `
          <div class="admin-lesson">
            ${r.image_url ? `<img src="${esc(r.image_url)}" alt="" style="width:72px;aspect-ratio:9/16;object-fit:cover;border-radius:8px">` : r.video_url && youtubeId(r.video_url) ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(youtubeId(r.video_url))}/mqdefault.jpg" alt="" style="width:72px;border-radius:8px">` : ""}
            <div class="grow"><strong>${r.video_url ? "🎬 " : "🖼️ "}${esc(r.name || "Sans nom")}</strong><div class="muted small">${esc(r.caption || "")} · ordre ${r.position}</div></div>
            <button class="btn btn-sm btn-danger" data-del-result="${r.id}">Supprimer</button>
          </div>`).join("")}</div>`
          : `<p class="muted small" style="margin:0">Aucun résultat pour l'instant : la section reste cachée sur la page d'accueil tant qu'elle est vide.</p>`}
      </div>`;

    const rerender = () => homeTab(body, ctx, alive);
    const saveVideo = async (value) => {
      const { error } = await sb.from("site_settings").upsert({ key: "presentation_video", value, updated_at: new Date().toISOString() });
      if (error) return toast(error.message, true);
      toast(value ? "Vidéo de présentation enregistrée ✓" : "Vidéo retirée");
      rerender();
    };

    const saveHomeVideo = async (value) => {
      const { error } = await sb.from("site_settings").upsert({ key: "accueil_video", value, updated_at: new Date().toISOString() });
      if (error) return toast(error.message, true);
      toast(value ? "Vidéo d'accueil enregistrée ✓" : "Vidéo d'accueil retirée");
      rerender();
    };

    body.onsubmit = async (e) => {
      e.preventDefault();
      if (e.target.id === "home-video-form") {
        const link = e.target.link.value.trim();
        if (link && !youtubeId(link) && !isVideoFile(link)) return toast("Lien YouTube ou MP4 invalide", true);
        return saveHomeVideo(link);
      }
      if (e.target.id === "video-form") {
        const link = e.target.link.value.trim();
        if (link && !youtubeId(link) && !isVideoFile(link)) return toast("Colle un lien YouTube ou le lien d'une vidéo MP4", true);
        return saveVideo(link);
      }
      if (e.target.id === "result-form") {
        const f = e.target;
        const file = f.image.files[0], yt = f.yt.value.trim();
        if (!file && !yt) return toast("Choisis une vidéo ou une capture, ou colle un lien YouTube", true);
        if (yt && !youtubeId(yt)) return toast("Lien YouTube invalide", true);
        const isVideo = !!file && /^video\//.test(file.type);
        if (file && isVideo && file.size > 50 * 1024 * 1024) return toast("Vidéo trop lourde (50 Mo maximum) : mets-la sur YouTube en « non répertoriée » et colle le lien.", true);
        if (file && !isVideo && file.size > 5 * 1024 * 1024) return toast("Image trop lourde (5 Mo maximum)", true);
        const btn = f.querySelector("#r-submit");
        const fail = (m) => { btn.disabled = false; btn.textContent = "Ajouter le résultat"; toast(m, true); };
        btn.disabled = true; btn.textContent = isVideo ? "Envoi de la vidéo… (garde la page ouverte)" : "Envoi…";
        const put = async (blob, ext, type) => {
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const up = await sb.storage.from("resultats").upload(path, blob, { contentType: type, upsert: false });
          if (up.error) throw up.error;
          return sb.storage.from("resultats").getPublicUrl(path).data.publicUrl;
        };
        let image_url = null, video_url = yt || null;
        try {
          if (file) {
            const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
            const url = await put(file, ext, file.type || (isVideo ? "video/mp4" : "image/jpeg"));
            if (isVideo) { video_url = url; const poster = await videoPoster(file); if (poster) image_url = await put(poster, "jpg", "image/jpeg"); }
            else image_url = url;
          }
        } catch (err) { return fail(err.message || String(err)); }
        const { error } = await sb.from("results").insert({
          image_url, video_url,
          name: f.name.value.trim() || null,
          caption: f.caption.value.trim() || null,
          position: +f.position.value || 0,
        });
        if (error) { btn.disabled = false; btn.textContent = "Ajouter le résultat"; return toast(error.message, true); }
        toast("Résultat ajouté ✓");
        rerender();
      }
    };

    body.onclick = async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if ("clearVideo" in b.dataset && (await window.App.confirmDialog("Retirer la vidéo de présentation ?", "Retirer"))) saveVideo("");
      if ("clearHomeVideo" in b.dataset && (await window.App.confirmDialog("Retirer la vidéo d'accueil ?", "Retirer"))) saveHomeVideo("");
      if (b.dataset.delResult && (await window.App.confirmDialog("Supprimer ce résultat ?", "Supprimer"))) {
        const r = results.find((x) => x.id === b.dataset.delResult);
        const { error } = await sb.from("results").delete().eq("id", r.id);
        if (error) return toast(error.message, true);
        const files = [r.image_url, r.video_url].map((u) => (u || "").split("/resultats/")[1]).filter(Boolean).map(decodeURIComponent);
        if (files.length) await sb.storage.from("resultats").remove(files);
        toast("Résultat supprimé");
        rerender();
      }
    };
  }

  // ---------------------------------------------------------------
  //  SALONS DE LA COMMUNAUTÉ
  // ---------------------------------------------------------------
  async function channelsTab(body, ctx, alive) {
    const channels = must(await sb.from("channels").select("*").order("position"));
    if (!alive()) return;

    body.innerHTML = `
      <form class="card" id="ch-form" style="margin-bottom:1rem">
        <h3 style="font-size:1rem">Nouveau salon</h3>
        <div class="row">
          <div class="field" style="width:80px"><label>Emoji</label><input name="emoji" value="💬"></div>
          <div class="field grow"><label>Nom</label><input name="name" required placeholder="Ex : Entraide"></div>
          <div class="field" style="width:100px"><label>Ordre</label><input name="position" type="number" value="${channels.length + 1}"></div>
        </div>
        <div class="field"><label>Description</label><input name="description"></div>
        <label class="row" style="font-weight:500;gap:.5rem"><input type="checkbox" name="staff_only" style="width:auto"> Seuls les coachs peuvent publier (annonces)</label>
        <button class="btn btn-primary btn-sm" type="submit" style="margin-top:.8rem">Créer le salon</button>
      </form>
      <div class="card">
        ${channels.map((c) => `
          <div class="admin-lesson">
            <span style="font-size:1.4rem">${esc(c.emoji)}</span>
            <div class="grow"><strong>${esc(c.name)}</strong> ${c.staff_only ? `<span class="badge">Annonces</span>` : ""}
              <div class="muted small">${esc(c.description || "")}</div></div>
            <button class="btn btn-sm btn-danger" data-del="${c.id}">Supprimer</button>
          </div>`).join("") || `<p class="muted">Aucun salon.</p>`}
      </div>`;

    const rerender = () => channelsTab(body, ctx, alive);
    body.onsubmit = async (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = f.get("name").trim();
      const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "salon";
      const { error } = await sb.from("channels").insert({
        name, slug: slug + (channels.some((c) => c.slug === slug) ? "-" + Date.now().toString(36) : ""),
        emoji: f.get("emoji") || "💬", description: f.get("description") || null,
        staff_only: f.get("staff_only") === "on", position: +f.get("position") || 0,
      });
      if (error) return toast(error.message, true);
      toast("Salon créé ✓"); rerender();
    };
    body.onclick = async (e) => {
      const b = e.target.closest("[data-del]");
      if (!b || !(await window.App.confirmDialog("Supprimer ce salon et tous ses messages ?", "Supprimer"))) return;
      const { error } = await sb.from("channels").delete().eq("id", b.dataset.del);
      if (error) return toast(error.message, true);
      toast("Salon supprimé"); rerender();
    };
  }

  // Image d'aperçu d'une vidéo de résultat (prise à 1 seconde, dans le navigateur) ; null si impossible
  function videoPoster(file) {
    return new Promise((resolve) => {
      const v = document.createElement("video"); v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = URL.createObjectURL(file);
      const done = (b) => { URL.revokeObjectURL(v.src); resolve(b); };
      setTimeout(() => done(null), 15000);
      v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 2) / 2); };
      v.onseeked = () => {
        const w = 540, h = Math.round(w * v.videoHeight / v.videoWidth) || 960, c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(v, 0, 0, w, h); c.toBlob((b) => done(b), "image/jpeg", 0.82);
      };
      v.onerror = () => done(null);
    });
  }

  // ---------------------------------------------------------------
  //  CODES PROMO : l'admin choisit le code, le %, la durée et le nombre de personnes
  // ---------------------------------------------------------------
  const BASE_PRICE = Number(String(window.App.cfg.PRICE_LOCAL_LABEL || "65000").replace(/\D/g, "")) || 65000;
  const fcfa = (n) => Number(n).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
  function promoState(c) {
    const now = Date.now(), end = c.expires_at ? new Date(c.expires_at).getTime() : null;
    if (!c.active) return ["Désactivé", "#6b7280"];
    if (end && end < now) return ["Expiré", "#c62828"];
    if (c.max_uses && c.uses >= c.max_uses) return ["Complet", "#c62828"];
    return ["Actif", "#16a34a"];
  }
  function timeLeft(c) {
    if (!c.expires_at) return "sans limite de temps";
    const ms = new Date(c.expires_at).getTime() - Date.now(), d = new Date(c.expires_at).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    if (ms <= 0) return `a expiré le ${d}`;
    const days = Math.floor(ms / 86400000), hours = Math.floor((ms % 86400000) / 3600000);
    return `expire le ${d} (dans ${days ? `${days} jour${days > 1 ? "s" : ""}` : ""}${days && hours ? " et " : ""}${!days || hours ? `${hours} h` : ""})`;
  }
  async function promoTab(body, ctx, alive) {
    const codes = await sb.from("promo_codes").select("*").order("created_at", { ascending: false }).then(must);
    if (!alive()) return;
    const first = (p) => Math.round(BASE_PRICE * p / 100);
    body.innerHTML = `
      <div class="card" style="margin-bottom:1rem">
        <h3 style="font-size:1.05rem;margin-top:0">💳 Créer un code « paiement en 2 fois »</h3>
        <p class="muted small">Ce n'est pas une réduction : le client paie toujours ${fcfa(BASE_PRICE)} au total, en 2 versements. Tu donnes le code par message au client avec qui tu t'es mis d'accord ; il le tape dans la petite partie cachée « ⊕ J'ai un code », sous son numéro WhatsApp. Il signe le contrat, paie le 1er versement, et le lien du 2e versement apparaît dans son espace à la date prévue. Sans paiement le lendemain : accès bloqué jusqu'au paiement.</p>
        <form id="promo-form" class="row" style="align-items:flex-end;gap:.8rem">
          <div class="field" style="flex:1;min-width:150px;margin:0"><label>Nom du code</label><input name="code" required maxlength="20" placeholder="Ex : MOITIE" style="text-transform:uppercase"></div>
          <div class="field" style="width:150px;margin:0"><label>1er versement (%)</label><input name="percent" type="number" min="10" max="90" required value="50"></div>
          <div class="field" style="width:170px;margin:0"><label>2e versement après</label>
            <select name="delay"><option value="15">15 jours</option><option value="30">30 jours</option><option value="45" selected>45 jours (1 mois et demi)</option><option value="60">60 jours</option><option value="90">90 jours</option></select></div>
          <div class="field" style="width:170px;margin:0"><label>Code valable pendant</label>
            <select name="dur"><option value="">Sans limite</option><option value="1">24 heures</option><option value="3">3 jours</option><option value="7">7 jours</option><option value="15">15 jours</option><option value="30">30 jours</option><option value="date">Jusqu'à une date…</option></select></div>
          <div class="field hidden" style="width:170px;margin:0" id="promo-date"><label>Date de fin</label><input name="until" type="datetime-local"></div>
          <div class="field" style="width:170px;margin:0"><label>Pour combien de personnes</label><input name="max" type="number" min="1" placeholder="Vide = sans limite"></div>
          <button class="btn btn-primary" type="submit">Créer le code</button>
        </form>
        <div class="muted small" id="promo-preview" style="margin-top:.6rem"></div>
      </div>
      <div class="card">
        <h3 style="font-size:1.05rem;margin-top:0">Tes codes (${codes.length})</h3>
        ${codes.length ? codes.map((c) => { const [st, col] = promoState(c); return `
          <div class="admin-lesson" style="flex-wrap:wrap">
            <div class="grow" style="min-width:220px"><strong style="font-size:1.05rem">${esc(c.code)}</strong> <span class="badge" style="background:${col};color:#fff">${st}</span>
              <div class="muted small">1er versement <strong>${fcfa(first(c.percent))}</strong> (${c.percent} %), puis <strong>${fcfa(BASE_PRICE - first(c.percent))}</strong> après ${c.delay_days} jours · utilisé par <strong>${c.uses}${c.max_uses ? ` / ${c.max_uses}` : ""}</strong> personne${c.uses > 1 ? "s" : ""}${c.max_uses ? ` (reste ${Math.max(0, c.max_uses - c.uses)})` : ""} · ${esc(timeLeft(c))}</div></div>
            <button class="btn btn-sm" data-toggle="${esc(c.code)}" data-active="${c.active}">${c.active ? "Désactiver" : "Réactiver"}</button>
            <button class="btn btn-sm btn-danger" data-del="${esc(c.code)}">Supprimer</button>
          </div>`; }).join("") : `<p class="muted small" style="margin:0">Aucun code pour l'instant : crée ton premier code au-dessus.</p>`}
      </div>`;

    const f = body.querySelector("#promo-form");
    const preview = () => {
      const p = Number(f.percent.value);
      body.querySelector("#promo-preview").textContent = p >= 10 && p <= 90 ? `Avec ce code, ton client paiera ${fcfa(first(p))} à la signature, puis ${fcfa(BASE_PRICE - first(p))} après ${f.delay.value} jours (total ${fcfa(BASE_PRICE)}).` : "";
    };
    f.percent.addEventListener("input", preview); f.delay.addEventListener("change", preview); preview();
    f.dur.addEventListener("change", () => body.querySelector("#promo-date").classList.toggle("hidden", f.dur.value !== "date"));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = f.code.value.trim().toUpperCase().replace(/\s+/g, "");
      const percent = Number(f.percent.value), max = f.max.value ? Number(f.max.value) : null;
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return toast("Le code : 3 à 20 lettres ou chiffres, sans espace ni accent.", true);
      if (!(percent >= 10 && percent <= 90)) return toast("Le 1er versement doit être entre 10 et 90 % du prix.", true);
      let expires = null;
      if (f.dur.value === "date") { if (!f.until.value) return toast("Choisis la date de fin.", true); expires = new Date(f.until.value).toISOString(); }
      else if (f.dur.value) expires = new Date(Date.now() + Number(f.dur.value) * 86400000).toISOString();
      const { error } = await sb.from("promo_codes").insert({ code, percent, delay_days: Number(f.delay.value), expires_at: expires, max_uses: max });
      if (error) return toast(/duplicate|unique/i.test(error.message) ? "Ce code existe déjà." : error.message, true);
      toast(`Code ${code} créé ✓`); promoTab(body, ctx, alive);
    });
    body.onclick = async (e) => {
      const t = e.target.closest("[data-toggle]"), d = e.target.closest("[data-del]");
      if (t) {
        const { error } = await sb.from("promo_codes").update({ active: t.dataset.active !== "true" }).eq("code", t.dataset.toggle);
        if (error) return toast(error.message, true); return promoTab(body, ctx, alive);
      }
      if (d) {
        if (!(await window.App.confirmDialog(`Supprimer le code ${d.dataset.del} ? Il ne marchera plus.`, "Supprimer"))) return;
        const { error } = await sb.from("promo_codes").delete().eq("code", d.dataset.del);
        if (error) return toast(error.message, true); toast("Code supprimé"); return promoTab(body, ctx, alive);
      }
    };
  }

  // ---------------------------------------------------------------
  //  PAIEMENTS EN 2 FOIS : contrats, relances J+14 / J+21 / J+45, mise en demeure à J+60
  // ---------------------------------------------------------------
  // étapes de relance WhatsApp (brouillons) : J+14, J+21, jour J, puis mise en demeure 15 jours après
  const stepsOf = (c) => { const n = c.delay_days || 45; return [
    { key: "demeure", at: n + 15, label: "Mise en demeure" },
    { key: "j45", at: n, label: `Jour J (J+${n}) : versement dû` },
    { key: "j21", at: 21, label: "2e relance (J+21)" },
    { key: "j14", at: 14, label: "1re relance (J+14)" },
  ]; };
  function waDraft(step, c, link) {
    const first = (c.full_name || "").split(" ")[0], amount = Number(c.second_amount).toLocaleString("fr-FR").replace(/ /g, " ") + " FCFA";
    const start = new Date(c.first_paid_at || c.signed_at), due = new Date(start.getTime() + (c.delay_days || 45) * 86400000).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const num = `SCE-${start.getFullYear()}-${String(c.number).padStart(4, "0")}`;
    return {
      j14: `Bonjour ${first}, j'espère que tu avances bien avec tes vidéos 💪 Petit rappel : il reste ${amount} à payer pour ton accompagnement Siba Cash Empire, au plus tard le ${due}. Le lien de paiement apparaîtra sur l'accueil de ton espace membre ce jour-là. Merci !`,
      j21: `Bonjour ${first}, 2e rappel : ton 2e versement de ${amount} est à payer avant le ${due}. Le bouton « Payer le reste » est sur l'accueil de ton espace membre. Si tu as une difficulté, dis-le-moi, on trouve une solution.`,
      j45: `Bonjour ${first}, c'est aujourd'hui le jour de ton 2e versement de ${amount}. Le bouton « Payer mon 2e versement » est sur l'accueil de ton espace membre. Sans paiement, ton accès sera suspendu dès demain, jusqu'au paiement. Ton contrat : ${link}`,
      demeure: `MISE EN DEMEURE\n\nBonjour ${c.full_name}, malgré mes rappels, le 2e versement de ${amount} prévu à l'article 3 de ton contrat n° ${num} n'est toujours pas payé. Je te mets en demeure de le payer sous 15 jours. Sans paiement dans ce délai, j'engagerai une procédure de recouvrement, amiable puis judiciaire, comme prévu à l'article 4.\n\nTon contrat signé : ${link}\n\nSiba Kouadio, Siba Cash Empire`,
    }[step];
  }
  function contractsCard(list) {
    if (!list.length) return `<div class="card" style="margin-bottom:1rem"><h3 style="font-size:1.05rem">✍️ Paiements en 2 fois (0)</h3><p class="muted small" style="margin:0">Aucun contrat signé pour l'instant. Tes clients choisissent « Payer en 2 fois ? J'ai un code » sur la page d'accueil et tapent le code <strong>MOITIE</strong>.</p></div>`;
    const site = location.origin + location.pathname.replace(/[^/]*$/, "");
    const rows = list.map((c) => {
      const link = `${site}contrat.html?id=${c.id}&t=${c.token}`;
      const start = new Date(c.first_paid_at || c.signed_at).getTime(), d = Math.floor((Date.now() - start) / 86400000);
      const done = c.reminders || {};
      const STEPS = stepsOf(c), step = c.status === "first_paid" ? STEPS.find((s) => d >= s.at) : null;
      const todo = step && !done[step.key];
      const phone = String(c.phone || "").replace(/\D/g, "");
      const badge = c.status === "paid" ? `<span class="badge badge-ok">Payé en totalité</span>`
        : c.status === "signed" ? `<span class="badge" style="background:#475569;color:#fff">Signé · 1er versement de ${esc(Number(c.first_amount).toLocaleString("fr-FR"))} FCFA pas encore reçu</span>`
        : `<span class="badge" style="background:${d >= 45 ? "#c62828" : d >= 14 ? "#d97706" : "var(--accent)"};color:#fff">Reste ${esc(Number(c.second_amount).toLocaleString("fr-FR"))} FCFA · J+${d}</span>`;
      return `<div class="admin-lesson" style="flex-wrap:wrap">
        <div class="grow" style="min-width:200px"><strong>${esc(c.full_name)}</strong> ${badge}
          <div class="muted small">${esc(c.email)} · ${esc(c.phone || "")} · ${esc(c.country || "")} · signé le ${esc(new Date(c.signed_at).toLocaleDateString("fr-FR"))}${Object.keys(done).length ? ` · relances envoyées : ${esc(Object.keys(done).join(", "))}` : ""}</div></div>
        <a class="btn btn-sm" href="${esc(link)}" target="_blank" rel="noopener">Contrat</a>
        ${c.status === "first_paid" && phone ? `<a class="btn btn-sm ${todo ? "btn-primary" : ""}" data-wa="${c.id}" data-step="${(step || STEPS[3]).key}" href="https://wa.me/${phone}?text=${encodeURIComponent(waDraft((step || STEPS[3]).key, c, link))}" target="_blank" rel="noopener">${todo ? "📲 " + esc(step.label) : "📲 WhatsApp"}</a>` : ""}
        ${c.status === "signed" ? `<button class="btn btn-sm btn-primary" data-paid1="${c.id}">1er versement reçu (Chariow, carte…)</button>` : ""}
        ${c.status === "first_paid" ? `<button class="btn btn-sm" data-paid2="${c.id}">2e versement reçu</button>` : ""}
      </div>`;
    }).join("");
    const late = list.filter((c) => c.status === "first_paid" && (Date.now() - new Date(c.first_paid_at || c.signed_at)) / 86400000 >= 14).length;
    return `<div class="card" style="margin-bottom:1rem;${late ? "border-color:#d97706" : ""}">
      <h3 style="font-size:1.05rem">✍️ Paiements en 2 fois (${list.length})</h3>
      <p class="muted small">Les codes se règlent dans l'onglet <a href="#/admin/promos">💳 Paiement en 2 fois</a>. Le membre reçoit tout seul ses messages (1er versement reçu, rappels J+14 et J+21, jour J avec le lien) ; sans paiement le lendemain, son accès est bloqué jusqu'au paiement. Le bouton WhatsApp ouvre en plus un <strong>brouillon</strong> de relance adapté au jour : c'est toi qui l'envoies.</p>
      ${rows}</div>`;
  }

  // ---------------------------------------------------------------
  //  ASSOCIÉS : accès gratuit au programme contre un partage des revenus (table associates)
  // ---------------------------------------------------------------
  const ASSO_ST = { pending: ["En attente de signature", "#d97706"], signed: ["Signé · accès ouvert", "#16a34a"], left: ["Parti · comptes à 50/50", "#6b7280"] };
  function assoWa(a, link) {
    const first = (a.full_name || "").split(" ")[0];
    return `Salut ${first} ! Voici ton contrat d'associé Siba Cash Empire : ${a.share_siba} % pour moi, ${100 - a.share_siba} % pour toi, sur ${(a.accounts || []).length} compte(s). Tu as accès gratuitement à tout le programme. Lis-le, signe avec ton doigt, puis connecte-toi avec le même Gmail : ${link}`;
  }
  async function associatesTab(body, ctx, alive) {
    const list = await sb.from("associates").select("*").order("created_at", { ascending: false }).then(must);
    if (!alive()) return;
    const site = location.origin + location.pathname.replace(/[^/]*$/, "");
    const linkOf = (a) => `${site}associe.html?id=${a.id}&t=${a.token}`;
    body.innerHTML = `
      <div class="card" style="margin-bottom:1rem">
        <h3 style="font-size:1.05rem;margin-top:0">🤝 Créer le contrat d'un associé</h3>
        <p class="muted small">L'associé ne paie rien : il a accès gratuitement au programme, applique ta stratégie, publie, et vous partagez l'argent des comptes. Tu crées son contrat ici, tu lui envoies son lien sur WhatsApp, il signe avec son doigt, et son accès s'ouvre tout seul quand il se connecte avec le même Gmail.</p>
        <form id="asso-form">
          <div class="row" style="align-items:flex-end;gap:.8rem;flex-wrap:wrap">
            <div class="field" style="flex:1;min-width:200px;margin:0"><label>Nom et prénom de l'associé</label><input name="full_name" required maxlength="80" placeholder="Ex : Jean Kouassi"></div>
            <div class="field" style="width:200px;margin:0"><label>Partage</label>
              <select name="share"><option value="50">50 % moi / 50 % lui</option><option value="60" selected>60 % moi / 40 % lui</option><option value="40">40 % moi / 60 % lui</option><option value="70">70 % moi / 30 % lui</option><option value="custom">Autre…</option></select></div>
            <div class="field hidden" style="width:130px;margin:0" id="asso-custom"><label>Ma part (%)</label><input name="custom" type="number" min="0" max="100" value="55"></div>
            <div class="field" style="width:140px;margin:0"><label>Nombre de comptes</label><input name="nb" type="number" min="1" max="20" value="1"></div>
            <div class="field" style="width:170px;margin:0"><label>Vidéos par jour (par compte)</label><input name="videos" type="number" min="1" max="20" value="3"></div>
          </div>
          <div id="asso-accts" style="display:grid;gap:.5rem;margin-top:.8rem"></div>
          <button class="btn btn-primary" type="submit" style="margin-top:.8rem">Créer son contrat</button>
        </form>
      </div>
      <div class="card">
        <h3 style="font-size:1.05rem;margin-top:0">Tes associés (${list.length})</h3>
        ${list.length ? list.map((a) => {
          const [st, col] = ASSO_ST[a.status] || ASSO_ST.pending, link = linkOf(a), phone = String(a.phone || "").replace(/\D/g, "");
          const accts = (a.accounts || []).map((c) => `${esc(c.name)} (à ${c.owner === "siba" ? "moi" : "lui"})`).join(", ");
          return `<div class="admin-lesson" style="flex-wrap:wrap">
            <div class="grow" style="min-width:220px"><strong>${esc(a.full_name)}</strong> <span class="badge" style="background:${col};color:#fff">${st}</span>
              <div class="muted small">${a.status === "left" ? "50 / 50 depuis son départ" : `${a.share_siba} % moi / ${100 - a.share_siba} % lui`} · ${a.videos_per_day} vidéo(s)/jour · ${(a.accounts || []).length} compte(s) : ${accts}</div>
              ${a.status !== "pending" ? `<div class="muted small">${esc(a.email || "")} · ${esc(a.phone || "")} · ${esc(a.country || "")} · signé le ${esc(new Date(a.signed_at).toLocaleDateString("fr-FR"))}${a.left_at ? ` · parti le ${esc(new Date(a.left_at).toLocaleDateString("fr-FR"))}` : ""}</div>` : ""}</div>
            <button class="btn btn-sm" data-copy="${esc(link)}">Copier le lien</button>
            <a class="btn btn-sm" href="${esc(link)}" target="_blank" rel="noopener">Contrat</a>
            ${a.status === "pending" ? `<a class="btn btn-sm btn-primary" href="https://wa.me/?text=${encodeURIComponent(assoWa(a, link))}" target="_blank" rel="noopener">📲 Message WhatsApp</a>` : ""}
            ${a.status === "signed" && phone ? `<a class="btn btn-sm" href="https://wa.me/${phone}" target="_blank" rel="noopener">📲 WhatsApp</a>` : ""}
            ${a.status === "signed" ? `<button class="btn btn-sm" data-left="${a.id}" data-name="${esc(a.full_name)}">Il est parti</button>` : ""}
            ${a.status === "pending" ? `<button class="btn btn-sm btn-danger" data-del="${a.id}" data-name="${esc(a.full_name)}">Supprimer</button>` : ""}
          </div>`; }).join("") : `<p class="muted small" style="margin:0">Aucun associé pour l'instant : crée le premier au-dessus.</p>`}
      </div>`;

    const f = body.querySelector("#asso-form"), box = body.querySelector("#asso-accts");
    const drawAccts = () => {
      const want = Math.max(1, Math.min(20, Number(f.nb.value) || 1));
      while (box.children.length < want) {
        const k = box.children.length + 1, d = document.createElement("div");
        d.className = "row"; d.style.cssText = "gap:.8rem;flex-wrap:wrap;align-items:flex-end";
        d.innerHTML = `<div class="field" style="flex:1;min-width:180px;margin:0"><label>Compte ${k} : nom</label><input data-an maxlength="40" placeholder="@nomducompte (vide = à créer ensemble)"></div>
          <div class="field" style="width:260px;margin:0"><label>Compte ${k} : appartient à</label><select data-ao><option value="associe">L'associé (l'argent arrive chez lui)</option><option value="siba">Moi (l'argent arrive chez moi)</option></select></div>`;
        box.appendChild(d);
      }
      while (box.children.length > want) box.lastChild.remove();
    };
    f.nb.addEventListener("input", drawAccts); drawAccts();
    f.share.addEventListener("change", () => body.querySelector("#asso-custom").classList.toggle("hidden", f.share.value !== "custom"));
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const full_name = f.full_name.value.trim();
      if (full_name.length < 2) return toast("Écris le nom et le prénom de l'associé.", true);
      const share = f.share.value === "custom" ? Number(f.custom.value) : Number(f.share.value);
      if (!(share >= 0 && share <= 100)) return toast("Ta part doit être entre 0 et 100 %.", true);
      const accounts = [...box.children].map((d) => ({ name: d.querySelector("[data-an]").value.trim().replace(/[<>]/g, "") || "à créer ensemble", owner: d.querySelector("[data-ao]").value }));
      const { error } = await sb.from("associates").insert({ full_name, share_siba: share, videos_per_day: Math.max(1, Number(f.videos.value) || 3), accounts });
      if (error) return toast(error.message, true);
      toast(`Contrat de ${full_name} créé ✓ Envoie-lui son lien.`); associatesTab(body, ctx, alive);
    });
    body.onclick = async (e) => {
      const c = e.target.closest("[data-copy]"), l = e.target.closest("[data-left]"), d = e.target.closest("[data-del]");
      if (c) {
        try { await navigator.clipboard.writeText(c.dataset.copy); toast("Lien copié ✓"); } catch (_) { toast("Copie impossible : ouvre « Contrat » et copie l'adresse.", true); }
        return;
      }
      if (l) {
        if (!(await window.App.confirmDialog(`${l.dataset.name} est parti ? Son accès gratuit au programme se ferme, et ses comptes passent à 50/50.`, "Oui, il est parti"))) return;
        const { error } = await sb.rpc("admin_associate_left", { a_id: l.dataset.left });
        if (error) return toast(error.message, true); toast("C'est noté"); return associatesTab(body, ctx, alive);
      }
      if (d) {
        if (!(await window.App.confirmDialog(`Supprimer le contrat de ${d.dataset.name} ? Son lien ne marchera plus.`, "Supprimer"))) return;
        const { error } = await sb.from("associates").delete().eq("id", d.dataset.del);
        if (error) return toast(error.message, true); toast("Contrat supprimé"); return associatesTab(body, ctx, alive);
      }
    };
  }

  // ---------------------------------------------------------------
  //  STATISTIQUES de la page de vente (table site_visits)
  // ---------------------------------------------------------------
  const TZ_PAYS = {
    "Africa/Abidjan": "Côte d'Ivoire", "Africa/Dakar": "Sénégal", "Africa/Bamako": "Mali", "Africa/Ouagadougou": "Burkina Faso",
    "Africa/Conakry": "Guinée", "Africa/Lome": "Togo", "Africa/Porto-Novo": "Bénin", "Africa/Niamey": "Niger",
    "Africa/Nouakchott": "Mauritanie", "Africa/Douala": "Cameroun", "Africa/Libreville": "Gabon", "Africa/Kinshasa": "RD Congo",
    "Africa/Lubumbashi": "RD Congo", "Africa/Brazzaville": "Congo", "Africa/Ndjamena": "Tchad", "Africa/Bangui": "Centrafrique",
    "Africa/Lagos": "Afrique (UTC+1 : Bénin, Cameroun, Niger…)", "Africa/Casablanca": "Maroc", "Africa/Algiers": "Algérie",
    "Africa/Tunis": "Tunisie", "Africa/Kigali": "Rwanda", "Africa/Bujumbura": "Burundi", "Africa/Djibouti": "Djibouti",
    "Indian/Antananarivo": "Madagascar", "Europe/Paris": "France", "Europe/Brussels": "Belgique", "Europe/Zurich": "Suisse",
    "Europe/Luxembourg": "Luxembourg", "Europe/Berlin": "Allemagne", "Europe/Madrid": "Espagne", "Europe/Rome": "Italie",
    "Europe/London": "Royaume-Uni", "America/Montreal": "Canada", "America/Toronto": "Canada",
    "America/New_York": "États-Unis", "America/Chicago": "États-Unis", "America/Los_Angeles": "États-Unis",
  };
  const STEPS = [
    ["visit", "Visiteurs"], ["video", "Ont lancé la vidéo"], ["video_50", "Ont vu la moitié"], ["video_fin", "Ont vu jusqu'au bout"],
    ["cta", "Ont cliqué « Je rejoins »"], ["paiement", "Ont lancé le paiement"],
  ];

  async function statsTab(body, ctx, alive) {
    const days = Number(sessionStorage.getItem("statsDays") || 7);
    const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - (days - 1));
    // Lecture par paquets de 1 000 (limite de la base)
    const rows = [];
    for (let from = 0; from < 50000; from += 1000) {
      const part = must(await sb.from("site_visits").select("created_at, event, visitor, source, campaign, tz, device")
        .gte("created_at", since.toISOString()).order("created_at").range(from, from + 999));
      rows.push(...part);
      if (part.length < 1000) break;
    }
    const sales = must(await sb.from("payments").select("id, created_at").eq("status", "paid").gte("created_at", since.toISOString()));
    if (!alive()) return;

    // Personnes uniques par étape
    const who = (ev, list = rows) => new Set(list.filter((r) => r.event === ev).map((r) => r.visitor));
    const visitors = who("visit");
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
    const steps = STEPS.map(([ev, label]) => ({ ev, label, n: who(ev).size }));

    // Le plus gros trou dans le parcours = le point faible n°1
    let worst = null;
    for (let i = 1; i < steps.length; i++) {
      const prev = steps[i - 1].n, cur = steps[i].n;
      if (prev >= 5 && (!worst || cur / prev < worst.rate)) worst = { from: steps[i - 1], to: steps[i], rate: cur / prev };
    }

    // Tableau par groupe (source, vidéo, pays, appareil)
    const groupTable = (keyOf, title, empty) => {
      const map = new Map();
      rows.forEach((r) => {
        const k = keyOf(r) || "Inconnu";
        if (!map.has(k)) map.set(k, { visit: new Set(), video: new Set(), cta: new Set(), paiement: new Set() });
        const g = map.get(k);
        if (g[r.event]) g[r.event].add(r.visitor);
      });
      const list = [...map.entries()].map(([k, g]) => ({ k, v: g.visit.size, video: g.video.size, cta: g.cta.size, pay: g.paiement.size }))
        .filter((x) => x.v).sort((a, b) => b.v - a.v);
      return `
        <div class="card" style="margin-bottom:1rem">
          <h3 style="font-size:1rem;margin-top:0">${title}</h3>
          ${list.length ? `<div style="overflow-x:auto"><table class="stats-table">
            <tr><th></th><th>Visiteurs</th><th>Vidéo lancée</th><th>Clic « Je rejoins »</th><th>Paiement lancé</th></tr>
            ${list.slice(0, 15).map((x) => `<tr><td><strong>${esc(x.k)}</strong></td><td>${x.v}</td><td>${pct(x.video, x.v)} %</td><td>${pct(x.cta, x.v)} %</td><td>${x.pay} <span class="muted">(${pct(x.pay, x.v)} %)</span></td></tr>`).join("")}
          </table></div>` : `<p class="muted small" style="margin:0">${empty}</p>`}
        </div>`;
    };

    // Visiteurs par jour
    const perDay = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since); d.setDate(d.getDate() + i);
      const key = d.toDateString();
      perDay.push({ d, n: new Set(rows.filter((r) => r.event === "visit" && new Date(r.created_at).toDateString() === key).map((r) => r.visitor)).size });
    }
    const maxDay = Math.max(1, ...perDay.map((x) => x.n));
    const site = location.origin;

    body.innerHTML = `
      <div class="row" style="gap:.5rem;margin-bottom:1rem;flex-wrap:wrap">
        ${[[1, "Aujourd'hui"], [7, "7 jours"], [30, "30 jours"], [90, "90 jours"]].map(([d, l]) =>
          `<button class="btn btn-sm ${d === days ? "btn-primary" : ""}" data-days="${d}">${l}</button>`).join("")}
      </div>

      <div class="stats-grid">
        <div class="card stat"><div class="muted small">Visiteurs</div><div class="stat-n">${visitors.size}</div></div>
        <div class="card stat"><div class="muted small">Ont lancé la vidéo</div><div class="stat-n">${pct(steps[1].n, visitors.size)} %</div></div>
        <div class="card stat"><div class="muted small">Clic « Je rejoins »</div><div class="stat-n">${pct(steps[4].n, visitors.size)} %</div></div>
        <div class="card stat"><div class="muted small">Ventes payées</div><div class="stat-n">${sales.length}</div></div>
      </div>

      <div class="card" style="margin-bottom:1rem">
        <h3 style="font-size:1rem;margin-top:0">Le parcours de tes visiteurs</h3>
        ${steps.map((s) => `
          <div style="margin:.45rem 0">
            <div class="row small" style="justify-content:space-between"><span>${s.label}</span><span><strong>${s.n}</strong> <span class="muted">(${pct(s.n, visitors.size)} %)</span></span></div>
            <div class="progress"><div style="width:${pct(s.n, visitors.size)}%"></div></div>
          </div>`).join("")}
        <div class="row small" style="justify-content:space-between;margin-top:.45rem"><span>Ont payé (ventes validées)</span><strong>${sales.length}</strong></div>
        ${worst ? `<p class="stats-alert">⚠️ Point faible n°1 : seulement <strong>${Math.round(worst.rate * 100)} %</strong> des personnes qui « ${esc(worst.from.label.toLowerCase())} » ${esc(worst.to.label.toLowerCase())}. C'est là qu'il faut améliorer en premier.</p>`
          : `<p class="muted small" style="margin:.8rem 0 0">Il faut au moins quelques visites pour voir ton point faible.</p>`}
      </div>

      <div class="card" style="margin-bottom:1rem">
        <h3 style="font-size:1rem;margin-top:0">Visiteurs par jour</h3>
        <div class="stats-bars">${perDay.map((x) => `<div title="${x.d.toLocaleDateString("fr-FR")} : ${x.n} visiteur${x.n > 1 ? "s" : ""}"><span style="height:${Math.round((x.n / maxDay) * 100)}%"></span><small>${days <= 31 ? x.d.getDate() : ""}</small></div>`).join("")}</div>
      </div>

      ${groupTable((r) => r.source, "D'où ils viennent", "Pas encore de visite sur cette période.")}
      ${groupTable((r) => r.campaign, "Quelle vidéo les a amenés", "Aucune visite avec un lien de vidéo : crée tes liens juste en dessous.")}
      ${groupTable((r) => TZ_PAYS[r.tz] || r.tz, "Leur pays (d'après l'heure du téléphone)", "Pas encore de visite sur cette période.")}
      ${groupTable((r) => r.device, "Téléphone ou ordinateur", "Pas encore de visite sur cette période.")}

      <form class="card" id="stats-link">
        <h3 style="font-size:1rem;margin-top:0">Créer le lien d'une vidéo</h3>
        <p class="muted small">Mets ce lien dans la bio ou en commentaire de ta vidéo : tu sauras exactement combien de visiteurs et de ventes elle t'apporte.</p>
        <div class="row" style="align-items:flex-end;flex-wrap:wrap">
          <div class="field grow" style="margin:0"><label for="sl-name">Nom de la vidéo</label><input id="sl-name" placeholder="Ex : tiktok-chiens-01" maxlength="50"></div>
          <button class="btn btn-primary" type="submit">Créer le lien</button>
        </div>
        <div id="sl-out" class="hidden" style="margin-top:.8rem"><input id="sl-url" readonly style="width:100%"><button class="btn btn-sm" type="button" id="sl-copy" style="margin-top:.5rem">Copier le lien</button></div>
      </form>`;

    body.querySelectorAll("[data-days]").forEach((b) => b.addEventListener("click", () => {
      sessionStorage.setItem("statsDays", b.dataset.days);
      statsTab(body, ctx, alive);
    }));
    body.querySelector("#stats-link").addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const name = body.querySelector("#sl-name").value.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (!name) return toast("Donne un nom à ta vidéo", true);
      body.querySelector("#sl-url").value = `${site}/?video=${name}`;
      body.querySelector("#sl-out").classList.remove("hidden");
    });
    body.querySelector("#sl-copy").addEventListener("click", async () => {
      const v = body.querySelector("#sl-url").value;
      try { await navigator.clipboard.writeText(v); toast("Lien copié ✓"); } catch (_) { body.querySelector("#sl-url").select(); }
    });
  }

  // ---------------------------------------------------------------
  //  MEMBRES
  // ---------------------------------------------------------------
  async function membersTab(body, ctx, alive) {
    const [users, toVerify, , contracts] = await Promise.all([
      sb.rpc("admin_list_users").then(must),
      sb.from("payments").select("id, email, amount, created_at, user_id").eq("status", "to_verify").order("created_at", { ascending: false }).then(must),
      sb.rpc("admin_split_tick_all").then(() => null, () => null), // messages automatiques dus (1er versement reçu, rappels, jour J)
      sb.from("contracts").select("id, number, token, full_name, email, phone, country, status, signed_at, first_paid_at, second_paid_at, first_amount, second_amount, delay_days, reminders")
        .in("status", ["signed", "first_paid", "paid"]).order("signed_at", { ascending: false }).limit(100).then(must),
    ]);
    if (!alive()) return;
    const paid = users.filter((u) => u.paid).length;
    const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    const timeFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

    body.innerHTML = `
      <div class="card" style="margin-bottom:1rem;${toVerify.length ? "border-color:var(--pink)" : ""}">
        <h3 style="font-size:1.05rem">💰 Paiements à vérifier (${toVerify.length})</h3>
        <p class="muted small">Ces personnes ont cliqué sur « Payer ». Ouvre ton <a href="https://app.saspay.me/dashboard/transactions" target="_blank" rel="noopener noreferrer">tableau de bord SasPay › Transactions</a> : si tu vois bien un paiement réussi de 65 000 FCFA avec cet e-mail, clique sur « Valider ». Son accès s'ouvre aussitôt (ou à sa première connexion avec ce Gmail).</p>
        ${toVerify.length ? toVerify.map((p) => `
          <div class="admin-lesson">
            <div class="grow"><strong>${esc(p.email || "—")}</strong>
              <div class="muted small">${esc(Number(p.amount).toLocaleString("fr-FR"))} FCFA · ${esc(timeFmt.format(new Date(p.created_at)))} · ${users.some((u) => (u.email || "").toLowerCase() === (p.email || "").toLowerCase()) ? "déjà inscrit sur le site" : "pas encore connecté au site"}</div></div>
            <button class="btn btn-sm btn-primary" data-validate="${p.id}">✓ Valider</button>
            <button class="btn btn-sm btn-danger" data-reject="${p.id}">Refuser</button>
          </div>`).join("") : `<p class="muted small" style="margin:0">Aucun paiement en attente.</p>`}
      </div>
      ${contractsCard(contracts)}
      <div class="row" style="margin-bottom:1rem">
        <div class="card grow"><div class="muted small">Inscrits</div><div class="price" style="font-size:2rem">${users.length}</div></div>
        <div class="card grow"><div class="muted small">Ont payé</div><div class="price" style="font-size:2rem">${paid}</div></div>
        <div class="card grow"><div class="muted small">Pas encore payé</div><div class="price" style="font-size:2rem">${users.length - paid}</div></div>
      </div>
      <div class="field"><input id="search" placeholder="Rechercher un nom ou un email…"></div>
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>Membre</th><th>Email</th><th>Inscrit le</th><th>Rôle</th><th>Accès</th></tr></thead>
          <tbody>
            ${users.map((u) => `
              <tr data-user="${u.id}" data-search="${esc((u.full_name + " " + u.email).toLowerCase())}">
                <td><div class="row" style="flex-wrap:nowrap">${avatar(u)}<strong>${esc(u.full_name)}</strong></div></td>
                <td class="muted">${esc(u.email)}</td>
                <td class="muted">${esc(dateFmt.format(new Date(u.created_at)))}</td>
                <td><select data-role ${u.id === ctx.user.id ? "disabled" : ""} style="width:auto">
                  ${["student", "coach", "admin"].map((r) => `<option value="${r}" ${u.role === r ? "selected" : ""}>${{ student: "Élève", coach: "Coach", admin: "Admin" }[r]}</option>`).join("")}
                </select></td>
                <td><label class="row" style="gap:.4rem;font-weight:500;margin:0;flex-wrap:nowrap">
                  <input type="checkbox" data-paid ${u.paid ? "checked" : ""} style="width:auto"> ${u.paid ? `<span class="badge badge-ok">Payé</span>` : `<span class="muted small">Non</span>`}
                </label></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <p class="muted small" style="margin-top:.8rem">Cocher « Accès » permet d'offrir la formation sans paiement. Un « Coach » apparaît dans la page Coachs et peut répondre aux élèves.</p>`;

    body.querySelector("#search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      body.querySelectorAll("tr[data-user]").forEach((tr) => tr.classList.toggle("hidden", q && !tr.dataset.search.includes(q)));
    });
    body.onclick = async (e) => {
      // paiement en 2 fois : relance WhatsApp (brouillon que tu envoies toi-même) ou 2e versement reçu autrement
      const w = e.target.closest("[data-wa]");
      if (w) { await sb.rpc("admin_contract_reminded", { c_id: w.dataset.wa, step: w.dataset.step }); setTimeout(() => membersTab(body, ctx, alive), 800); return; }
      const c1 = e.target.closest("[data-paid1]");
      if (c1) {
        if (!(await window.App.confirmDialog("Tu as bien reçu le 1er versement (Chariow, carte, transfert…) ? Son accès s'ouvre et le compte à rebours du 2e versement démarre aujourd'hui.", "Oui, reçu"))) return;
        const { error } = await sb.rpc("admin_contract_first_paid", { c_id: c1.dataset.paid1 });
        if (error) return toast(error.message, true);
        toast("1er versement noté ✓ Son accès est ouvert"); return membersTab(body, ctx, alive);
      }
      const c2 = e.target.closest("[data-paid2]");
      if (c2) {
        if (!(await window.App.confirmDialog("Marquer le 2e versement comme reçu (espèces, transfert…) ?", "Oui, reçu"))) return;
        const { error } = await sb.rpc("admin_contract_paid", { c_id: c2.dataset.paid2 });
        if (error) return toast(error.message, true);
        toast("Contrat marqué comme payé ✓"); return membersTab(body, ctx, alive);
      }
      const b = e.target.closest("[data-validate], [data-reject]");
      if (!b) return;
      const approve = "validate" in b.dataset;
      const id = b.dataset.validate || b.dataset.reject;
      const p = toVerify.find((x) => x.id === id);
      const ok = await window.App.confirmDialog(
        approve ? `Valider le paiement de ${p.email} et ouvrir son accès ?` : `Refuser ce paiement (${p.email}) ?`,
        approve ? "Valider" : "Refuser");
      if (!ok) return;
      const { error } = await sb.rpc("admin_validate_payment", { p_id: id, approve });
      if (error) return toast(error.message, true);
      toast(approve ? "Paiement validé : accès ouvert ✓" : "Paiement refusé");
      membersTab(body, ctx, alive);
    };
    body.onchange = async (e) => {
      const tr = e.target.closest("tr[data-user]");
      if (!tr) return;
      const { error } = await sb.rpc("admin_update_user", {
        target: tr.dataset.user,
        new_role: tr.querySelector("[data-role]").value,
        new_paid: tr.querySelector("[data-paid]").checked,
      });
      if (error) return toast(error.message, true);
      toast("Membre mis à jour ✓");
      membersTab(body, ctx, alive);
    };
  }

  // ---------------------------------------------------------------
  //  AIDE
  // ---------------------------------------------------------------
  async function helpTab(body) {
    body.innerHTML = `
      <div class="card">
        <h3>Ajouter une vidéo</h3>
        <ol>
          <li>Sur YouTube Studio, mets ta vidéo en ligne en visibilité <strong>« Non répertoriée »</strong>.</li>
          <li>Dans <em>Détails</em>, laisse cochée l'option <strong>« Autoriser l'intégration »</strong>.</li>
          <li>Copie le lien de la vidéo (bouton Partager) et colle-le dans « + Ajouter une vidéo » d'un module.</li>
        </ol>
        <h3>Changer la vidéo de présentation ou ajouter un résultat</h3>
        <p>Onglet <a href="#/admin/accueil">Page d'accueil</a> : colle le lien YouTube de ta vidéo de présentation, et ajoute les captures d'écran des résultats de tes membres.</p>
        <h3>Planifier un appel</h3>
        <p>Va dans <a href="#/calendrier">Calendrier</a> › « + Planifier un appel » et colle ton lien Zoom ou Google Meet.</p>
        <h3>Ajouter un coach</h3>
        <p>Demande-lui de se connecter une fois au site avec son Gmail, puis dans l'onglet <a href="#/admin/membres">Membres</a>, passe son rôle à « Coach ».</p>
      </div>`;
  }

  window.Admin = { render };
})();
