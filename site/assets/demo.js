// MODE DÉMO : imite Supabase dans le navigateur (aucun compte nécessaire).
// Il s'active tout seul tant que config.js n'est pas rempli.
(function () {
  const DB_KEY = "demo_db_v3";
  const SESSION_KEY = "demo_session_v2";
  const memory = {};
  const store = {
    get(k) { try { const v = localStorage.getItem(k); return v == null ? memory[k] ?? null : JSON.parse(v); } catch (_) { return memory[k] ?? null; } },
    set(k, v) { memory[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} },
    del(k) { delete memory[k]; try { localStorage.removeItem(k); } catch (_) {} },
  };
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36));
  const ago = (min) => new Date(Date.now() - min * 60000).toISOString();
  const at = (days, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(h, m, 0, 0); return d.toISOString(); };

  const ME = { id: "me", email: "demo@exemple.fr" };

  // Courts-métrages libres de la Blender Foundation, utilisés comme vidéos d'exemple
  const VIDEOS = ["aqz-KE-bpKQ", "R6MlUcmOul8", "eRsGyueVLvQ", "Y-rmzh0PI3c", "mN0zPOpADL4", "WhWc3b3KhnY", "SkVqJ1SGeL0", "PVGeM40dABA", "_cMxraX_5RE", "UXqq0ZvbOnk"];
  const LESSONS = [
    ["C'est quoi une chaîne faceless ?", "Les modèles de chaînes faceless qui gagnent de l'argent", "TikTok vs YouTube en faceless", "Créer et optimiser tes comptes", "Ton plan de publication sur 30 jours"],
    ["Les niches faceless les plus rentables", "Analyser une niche avant de te lancer", "Repérer les chaînes qui marchent dans ta niche", "Construire ta banque de 100 idées", "Valider une idée avant de produire"],
    ["La structure d'un script qui retient", "Écrire un script en 20 minutes", "Enregistrer une voix off propre", "Utiliser une voix IA naturelle", "Le rythme de la narration", "Produire 5 scripts en une heure"],
    ["Trouver des images et vidéos libres de droits", "Créer des visuels avec l'IA", "Prise en main de CapCut", "Sous-titres dynamiques", "Musique et effets sonores", "Les 3 premières secondes", "Exporter en qualité maximale"],
    ["Écrire un hook qui arrête le scroll", "Les titres YouTube qui font cliquer", "Une miniature efficace sans visage", "Descriptions, hashtags et mots-clés", "Corriger une vidéo qui ne décolle pas"],
    ["Les programmes de rémunération TikTok et YouTube", "L'affiliation sur une chaîne faceless", "Décrocher des partenariats sans se montrer", "Vendre tes propres produits digitaux", "Construire des revenus réguliers"],
    ["Se lancer face caméra sans stress", "Tourner avec son téléphone", "Monter une vidéo face caméra"],
  ];

  function seed() {
    const program = (window.APP_CONFIG && window.APP_CONFIG.PROGRAM) || [];
    const modules = [], lessons = [];
    let v = 0;
    program.forEach((p, i) => {
      const mid = "mod-" + (i + 1);
      modules.push({ id: mid, title: p.title, description: p.desc, position: i + 1, created_at: ago(9000 - i) });
      const titles = LESSONS[i] || Array.from({ length: p.lessons || 3 }, (_, k) => `Leçon ${k + 1}`);
      titles.forEach((t, k) => lessons.push({
        id: `les-${i + 1}-${k + 1}`, module_id: mid, title: t, position: k + 1, created_at: ago(8000),
        youtube_id: VIDEOS[v++ % VIDEOS.length],
        description: k === 0 ? "Vidéo d'exemple pour la démo. Sur ton site, tu colles ici le lien de ta vidéo YouTube non répertoriée.\n\nRessource : la fiche récap de la leçon (exemple)." : null,
      }));
    });
    const coach1 = { id: "coach-1", full_name: "Coach Inès", avatar_url: null, role: "coach", paid: true, email: "ines@exemple.fr", created_at: ago(20000) };
    const coach2 = { id: "coach-2", full_name: "Coach Malik", avatar_url: null, role: "coach", paid: true, email: "malik@exemple.fr", created_at: ago(19000) };
    const lea = { id: "mem-1", full_name: "Léa M.", avatar_url: null, role: "student", paid: true, email: "lea@exemple.fr", created_at: ago(5000) };
    const yanis = { id: "mem-2", full_name: "Yanis B.", avatar_url: null, role: "student", paid: true, email: "yanis@exemple.fr", created_at: ago(3000) };
    const sarah = { id: "mem-3", full_name: "Sarah K.", avatar_url: null, role: "student", paid: false, email: "sarah@exemple.fr", created_at: ago(400) };
    const me = { id: ME.id, full_name: "Toi (démo)", avatar_url: null, role: "student", paid: false, email: ME.email, created_at: ago(1) };

    const ch = (slug, name, description, emoji, staff_only, position) => ({ id: "ch-" + slug, slug, name, description, emoji, staff_only, position });
    const channels = [
      ch("general", "Général", "Discussion générale entre tous les membres", "💬", false, 1),
      ch("annonces", "Annonces", "Les infos importantes de l'équipe", "📢", true, 2),
      ch("feedback", "Feedback vidéos", "Poste ta vidéo et reçois des retours", "🎬", false, 3),
      ch("victoires", "Victoires", "Partage tes résultats et tes progrès", "🏆", false, 4),
    ];
    const msg = (channel, user, content, min) => ({ id: uid(), channel_id: "ch-" + channel, user_id: user, content, created_at: ago(min) });
    const messages = [
      msg("annonces", "coach-1", "Bienvenue à tous ! Le live de cette semaine est dans le calendrier. Préparez vos questions.", 2900),
      msg("general", "mem-1", "Salut tout le monde ! Je commence le module 2 aujourd'hui.", 1500),
      msg("general", "mem-2", "Bienvenue Léa ! Commence par le module niches, c'est lui qui m'a débloqué pour ma chaîne faceless.", 1400),
      msg("general", "coach-2", "Pensez à poster vos vidéos dans #Feedback vidéos, on y répond chaque jour.", 900),
      msg("feedback", "mem-1", "Voilà ma première vidéo, vos avis sur l'accroche ? https://www.tiktok.com/", 600),
      msg("feedback", "coach-1", "Très bon début ! Ta voix off démarre trop lentement : attaque directement par la phrase choc, tu vas gagner en rétention.", 560),
      msg("victoires", "mem-2", "Première vidéo à 10 000 vues sur TikTok. Merci pour les retours !", 300),
    ];
    const events = [
      { id: uid(), title: "Live : vos questions / réponses", description: "On répond à toutes vos questions sur les modules.", starts_at: at(2, 19), duration_min: 60, meeting_url: "https://meet.google.com/", created_by: "coach-1", created_at: ago(100) },
      { id: uid(), title: "Analyse de chaînes en direct", description: "Envoyez votre chaîne avant le live, on en analyse 5 en direct.", starts_at: at(5, 20), duration_min: 90, meeting_url: "https://zoom.us/", created_by: "coach-2", created_at: ago(100) },
      { id: uid(), title: "Lancement du défi « 7 vidéos en 7 jours »", description: null, starts_at: at(9, 18, 30), duration_min: 45, meeting_url: "https://meet.google.com/", created_by: "coach-1", created_at: ago(100) },
      { id: uid(), title: "Live : les miniatures qui font cliquer", description: null, starts_at: at(-4, 19), duration_min: 60, meeting_url: null, created_by: "coach-1", created_at: ago(9000) },
    ];
    const direct_messages = [
      { id: uid(), student_id: ME.id, coach_id: "coach-1", sender_id: "coach-1", content: "Bienvenue dans la formation ! Si tu bloques sur quoi que ce soit, écris-moi ici.", created_at: ago(30) },
      { id: uid(), student_id: "mem-1", coach_id: "coach-1", sender_id: "mem-1", content: "Bonjour Inès, tu peux regarder ma miniature ?", created_at: ago(200) },
    ];
    return { profiles: [me, coach1, coach2, lea, yanis, sarah], modules, lessons, lesson_progress: [], channels, messages, direct_messages, events };
  }

  let db = store.get(DB_KEY) || seed();
  const save = () => store.set(DB_KEY, db);
  save();

  // ---------- Temps réel simulé ----------
  const listeners = new Set();
  function emit(event, table, row) {
    listeners.forEach((l) => {
      if (l.event !== event || l.table !== table) return;
      if (l.filter) {
        const [col, rest] = l.filter.split("=");
        if (String(row[col]) !== rest.replace(/^eq\./, "")) return;
      }
      setTimeout(() => l.cb({ new: row, old: row }), 50);
    });
  }

  // ---------- Requêtes ----------
  class Query {
    constructor(table) { this.t = table; this.op = "select"; this.filters = []; this.sorts = []; this.lim = null; this.one = null; this.cols = ""; this.payload = null; }
    select(cols = "*") { this.cols = cols; return this; }
    insert(p) { this.op = "insert"; this.payload = p; return this; }
    update(p) { this.op = "update"; this.payload = p; return this; }
    upsert(p) { this.op = "upsert"; this.payload = p; return this; }
    delete() { this.op = "delete"; return this; }
    eq(k, v) { this.filters.push((r) => r[k] === v); return this; }
    ilike(k, v) { this.filters.push((r) => String(r[k]).toLowerCase() === String(v).toLowerCase()); return this; }
    in(k, vs) { this.filters.push((r) => vs.includes(r[k])); return this; }
    gte(k, v) { this.filters.push((r) => r[k] >= v); return this; }
    lt(k, v) { this.filters.push((r) => r[k] < v); return this; }
    order(k, o = {}) { this.sorts.push([k, o.ascending !== false]); return this; }
    limit(n) { this.lim = n; return this; }
    maybeSingle() { this.one = "maybe"; return this; }
    single() { this.one = "one"; return this; }
    then(res, rej) { return new Promise((r) => setTimeout(r, 60)).then(() => this.exec()).then(res, rej); }

    exec() {
      const rows = db[this.t] || (db[this.t] = []);
      const match = (r) => this.filters.every((f) => f(r));
      let out = [];
      if (this.op === "select") {
        out = rows.filter(match);
        if (this.sorts.length) out.sort((a, b) => {
          for (const [k, asc] of this.sorts) {
            if (a[k] === b[k]) continue;
            return (a[k] > b[k] ? 1 : -1) * (asc ? 1 : -1);
          }
          return 0;
        });
        if (this.lim != null) out = out.slice(0, this.lim);
        // Jointures du type  student:profiles!xxx(...)
        const embeds = [...String(this.cols).matchAll(/(\w+):profiles[^(]*\(/g)].map((m) => m[1]);
        out = out.map((r) => {
          const copy = { ...r };
          embeds.forEach((alias) => { copy[alias] = db.profiles.find((p) => p.id === r[alias + "_id"]) || null; });
          return copy;
        });
      } else if (this.op === "insert") {
        out = [].concat(this.payload).map((r) => ({ id: uid(), created_at: new Date().toISOString(), position: 0,
          ...(this.t === "associates" ? { token: uid().replace(/-/g, ""), number: rows.length + 1, status: "pending" } : {}), ...r }));
        rows.push(...out);
        save();
        out.forEach((r) => { emit("INSERT", this.t, r); afterInsert(this.t, r); });
      } else if (this.op === "update") {
        out = rows.filter(match);
        out.forEach((r) => Object.assign(r, this.payload));
        save();
      } else if (this.op === "upsert") {
        out = [].concat(this.payload).map((p) => {
          const existing = rows.find((r) => (p.id && r.id === p.id) || (p.lesson_id && r.lesson_id === p.lesson_id && r.user_id === p.user_id));
          if (existing) return Object.assign(existing, p);
          const row = { created_at: new Date().toISOString(), ...p };
          rows.push(row);
          return row;
        });
        save();
      } else if (this.op === "delete") {
        out = rows.filter(match);
        db[this.t] = rows.filter((r) => !match(r));
        if (this.t === "modules") db.lessons = db.lessons.filter((l) => !out.some((m) => m.id === l.module_id));
        if (this.t === "channels") db.messages = db.messages.filter((m) => !out.some((c) => c.id === m.channel_id));
        save();
        out.forEach((r) => emit("DELETE", this.t, r));
      }
      out = JSON.parse(JSON.stringify(out));
      if (this.one) {
        if (!out.length && this.one === "one") return { data: null, error: { message: "Introuvable" } };
        return { data: out[0] || null, error: null };
      }
      return { data: out, error: null };
    }
  }

  // Réponse automatique d'un coach en démo
  function afterInsert(table, row) {
    if (table !== "direct_messages" || row.sender_id !== row.student_id) return;
    setTimeout(() => {
      new Query("direct_messages").insert({
        student_id: row.student_id, coach_id: row.coach_id, sender_id: row.coach_id,
        content: "Bien reçu ! (Réponse automatique de la démo : sur le vrai site, le coach te répond ici en personne.)",
      }).exec();
    }, 1800);
  }

  const authCallbacks = [];
  const client = {
    from: (t) => new Query(t),
    async rpc(name, args = {}) {
      if (name === "admin_list_users") {
        return { data: [...db.profiles].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), error: null };
      }
      if (name === "admin_update_user") {
        const p = db.profiles.find((x) => x.id === args.target);
        if (p) Object.assign(p, { role: args.new_role, paid: args.new_paid });
        save();
        return { data: null, error: null };
      }
      // Associés (démo) : mêmes réponses que les fonctions SQL associate_get / associate_sign / admin_associate_left
      const asso = () => (db.associates || []).find((x) => x.id === (args.a_id) && (args.a_token === undefined || x.token === args.a_token));
      if (name === "associate_get") return { data: asso() ? JSON.parse(JSON.stringify(asso())) : null, error: null };
      if (name === "associate_sign") {
        const a = asso();
        if (!a) return { data: null, error: { message: "Ce lien n'est pas valable. Demande un nouveau lien à Siba." } };
        if (a.status !== "pending") return { data: null, error: { message: "Ce contrat est déjà signé." } };
        Object.assign(a, { status: "signed", email: args.p_email, phone: args.p_phone, country: args.p_country, signature: args.p_signature,
          signed_at: new Date().toISOString(), ip: "127.0.0.1 (démo)", user_agent: navigator.userAgent });
        save();
        return { data: JSON.parse(JSON.stringify(a)), error: null };
      }
      if (name === "admin_associate_left") {
        const a = asso();
        if (a && a.status === "signed") Object.assign(a, { status: "left", left_at: new Date().toISOString() });
        save();
        return { data: null, error: null };
      }
      return { data: null, error: { message: "Fonction inconnue" } };
    },
    channel() {
      const own = [];
      const ch = {
        on(type, cfg, cb) { const l = { event: cfg.event, table: cfg.table, filter: cfg.filter, cb }; own.push(l); listeners.add(l); return ch; },
        subscribe() { return ch; },
        _own: own,
      };
      return ch;
    },
    removeChannel(ch) { (ch && ch._own || []).forEach((l) => listeners.delete(l)); },
    auth: {
      async getSession() { const s = store.get(SESSION_KEY); return { data: { session: s }, error: null }; },
      onAuthStateChange(cb) { authCallbacks.push(cb); return { data: { subscription: { unsubscribe() {} } } }; },
      async signInWithOAuth({ options }) {
        store.set(SESSION_KEY, { user: ME });
        window.location.assign(options.redirectTo);
        return { error: null };
      },
      async signOut() { store.del(SESSION_KEY); authCallbacks.forEach((cb) => cb("SIGNED_OUT", null)); return { error: null }; },
    },
  };

  window.DemoBackend = {
    client,
    ensureSession() { if (!store.get(SESSION_KEY)) store.set(SESSION_KEY, { user: ME }); },
    me() { return db.profiles.find((p) => p.id === ME.id); },
    setMe(patch) { Object.assign(this.me(), patch); save(); },
    reset() { db = seed(); save(); },
  };
})();
