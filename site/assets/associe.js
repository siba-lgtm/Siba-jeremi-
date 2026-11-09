// Contrat d'associé : associe.html?id=…&t=… (lien secret créé dans Admin › Associés)
//   en attente → l'associé remplit, coche, signe au doigt → accès gratuit ouvert
//   signé / parti → contrat signé à imprimer
(async () => {
  const { sb, esc } = window.App;
  const $ = (s) => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const fill = (k, v) => document.querySelectorAll(`[data-f="${k}"]`).forEach((el) => { el.textContent = v; });
  const day = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fail = (t) => { const m = $("#err"); m.textContent = t; m.style.display = "block"; };
  $("#print").onclick = () => window.print();

  if (!q.get("id") || !q.get("t")) return fail("Ce lien n'est pas complet. Demande ton lien de contrat à Siba.");
  const { data: a, error } = await sb.rpc("associate_get", { a_id: q.get("id"), a_token: q.get("t") });
  if (error || !a) return fail("Ce lien n'est pas valable. Demande un nouveau lien à Siba.");

  function show(a) {
    const share = Number(a.share_siba);
    fill("num", `SCE-A-${new Date(a.signed_at || Date.now()).getFullYear()}-${String(a.number || 0).padStart(4, "0")}`);
    fill("nom", a.full_name); fill("prenom", (a.full_name || "").split(" ")[0]);
    fill("pSiba", share); fill("pAsso", 100 - share);
    $("#barS").style.flex = Math.max(share, 8); $("#barA").style.flex = Math.max(100 - share, 8);
    fill("videos", a.videos_per_day);
    const accts = Array.isArray(a.accounts) && a.accounts.length ? a.accounts : [{ name: "à créer ensemble", owner: "associe" }];
    fill("nbComptes", accts.length);
    $("#acctRows").innerHTML = accts.map((c, i) => `<tr><td>${i + 1}</td><td>${esc(c.name)}</td><td>${c.owner === "siba" ? "Siba" : esc(a.full_name)}</td></tr>`).join("");
    $("#c_associe").hidden = !accts.some((c) => c.owner !== "siba");
    $("#c_siba").hidden = !accts.some((c) => c.owner === "siba");
    document.title = `Contrat de ${a.full_name} · Siba Cash Empire`;
    if (a.status !== "pending") {
      fill("signedDate", day(a.signed_at)); fill("email", a.email || "…"); fill("phone", a.phone || "…"); fill("country", a.country || "…");
      const img = $("#sigImg"); img.src = a.signature; img.hidden = false;
      const pr = $("#proof"); pr.hidden = false;
      pr.textContent = `Preuve de signature électronique : signé le ${new Date(a.signed_at).toLocaleString("fr-FR")} · adresse IP ${a.ip || "inconnue"} · appareil : ${(a.user_agent || "").slice(0, 120)}`;
      $("#signForm").hidden = true;
      if (a.status === "left") { fill("leftDate", day(a.left_at)); $("#leftNote").hidden = false; }
    }
    $("#doc").hidden = false;
  }
  show(a);
  if (a.status !== "pending") return;

  // ---------- signature
  const form = $("#signForm"); form.hidden = false;
  for (const k of ["email", "phone", "country"]) form[k].addEventListener("input", () => fill(k, form[k].value.trim() || "à la signature"));
  const cv = $("#pad"), ctx = cv.getContext("2d");
  let drawn = 0, last = null;
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const keep = drawn ? cv.toDataURL() : null;
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.lineWidth = 2.6; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1b1530";
    if (keep) { const i = new Image(); i.onload = () => ctx.drawImage(i, 0, 0, r.width, r.height); i.src = keep; }
  }
  size(); window.addEventListener("resize", size);
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener("pointerdown", (e) => { try { cv.setPointerCapture(e.pointerId); } catch (_) {} last = pt(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.1, 0, 7); ctx.fillStyle = "#1b1530"; ctx.fill(); });
  cv.addEventListener("pointermove", (e) => { if (!last) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); drawn += Math.hypot(p.x - last.x, p.y - last.y); last = p; });
  const up = () => { last = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("pointerleave", up);
  $("#clear").onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); drawn = 0; };

  const msg = (t, ok) => { const m = $("#msg"); m.textContent = t; m.className = "msg" + (ok ? " ok" : ""); m.style.display = t ? "block" : "none"; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); msg("");
    const v = (k) => form[k].value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) return msg("Écris ton adresse Gmail (celle avec laquelle tu te connecteras).");
    if (v("phone").replace(/\D/g, "").length < 8) return msg("Écris ton numéro WhatsApp avec l'indicatif du pays.");
    if (v("country").length < 2) return msg("Écris ton pays de résidence.");
    if (!form.c1.checked || !form.c2.checked) return msg("Coche les 2 cases avant de signer.");
    if (drawn < 60) return msg("Signe dans le cadre (avec ton doigt ou la souris).");
    const out = document.createElement("canvas"); out.width = 700; out.height = Math.round(700 * cv.height / cv.width);
    out.getContext("2d").drawImage(cv, 0, 0, out.width, out.height);
    const btn = $("#go"); btn.disabled = true; btn.textContent = "Signature en cours…";
    const { data, error } = await sb.rpc("associate_sign", {
      a_id: q.get("id"), a_token: q.get("t"), p_email: v("email").toLowerCase(), p_phone: v("phone"), p_country: v("country"), p_signature: out.toDataURL("image/png"),
    });
    if (error || !data) { btn.disabled = false; btn.textContent = "Signer le contrat"; return msg(error?.message || "La signature n'est pas passée. Réessaie dans un instant."); }
    show(data); $("#welcome").hidden = false;
    $("#welcome").scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
