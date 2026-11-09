// Contrat de paiement en 2 fois : signature au doigt puis 1er versement, ou affichage d'un contrat signé (à imprimer)
//   contrat.html?code=MOITIE&email=…&name=…  → le membre remplit, signe et paie
//   contrat.html?id=…&t=…                     → contrat signé (lien secret), bouton Imprimer / PDF
//   contrat.html                              → modèle vierge
(async () => {
  const { sb, esc, toast, fnErrorMessage } = window.App;
  const $ = (s) => document.querySelector(s);
  const q = new URLSearchParams(location.search);
  const fmt = (n) => Number(n || 0).toLocaleString("fr-FR").replace(/ /g, " ");
  const day = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const DAYS = 45;
  function fill(k, v) { document.querySelectorAll(`[data-f="${k}"]`).forEach((el) => { el.textContent = v; }); }
  const store = { set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} } };

  // ---------- contrat signé : affichage + impression
  if (q.get("id") && q.get("t")) {
    $("#bar").style.display = "flex";
    $("#print").onclick = () => window.print();
    const { data, error } = await sb.functions.invoke("saspay", { body: { action: "contract_get", id: q.get("id"), t: q.get("t") } });
    if (error || !data?.contract) { document.querySelector(".page").insertAdjacentHTML("afterbegin", `<p class="msg" style="display:block">${esc(await fnErrorMessage(error, data))}</p>`); return; }
    const c = data.contract;
    fill("number", `SCE-${new Date(c.signed_at).getFullYear()}-${String(c.number).padStart(4, "0")}`);
    fill("signedDate", day(c.signed_at));
    fill("dueDate", day(new Date(c.first_paid_at || c.signed_at).getTime() + (c.delay_days || DAYS) * 86400000)); fill("days", String(c.delay_days || DAYS));
    for (const k of ["full_name", "email", "phone", "country", "code"]) fill(k, c[k] || "…");
    fill("first", fmt(c.first_amount)); fill("second", fmt(c.second_amount)); fill("total", fmt(c.total));
    const img = $("#sigImg"); img.src = c.signature; img.hidden = false;
    const st = { signed: "1er versement en attente", first_paid: `1er versement payé le ${c.first_paid_at ? day(c.first_paid_at) : "…"}, 2e versement à payer`, paid: `Payé en totalité (2e versement le ${c.second_paid_at ? day(c.second_paid_at) : "…"})`, cancelled: "Annulé" }[c.status] || c.status;
    const proof = $("#proof"); proof.hidden = false;
    proof.innerHTML = `Preuve de signature électronique : signé le ${esc(new Date(c.signed_at).toLocaleString("fr-FR"))} · adresse IP ${esc(c.ip || "inconnue")} · appareil : ${esc((c.user_agent || "").slice(0, 120))}<br>État des paiements : <b>${esc(st)}</b>`;
    document.title = `Contrat ${c.full_name} · Siba Cash Empire`;
    return;
  }

  // ---------- modèle vierge
  const code = (q.get("code") || "").trim();
  if (!code) { $("#bar").style.display = "flex"; $("#back").hidden = true; $("#print").onclick = () => window.print(); return; }

  // ---------- signature : le code doit être valable
  const { data: chk } = await sb.functions.invoke("saspay", { body: { action: "split_check", code } });
  if (!chk?.ok) { document.querySelector(".page").insertAdjacentHTML("afterbegin", `<p class="msg" style="display:block">${esc(chk?.error || "Ce code n'est pas valable.")} <a href="index.html#rejoindre">Retour</a></p>`); return; }
  fill("code", chk.code); fill("first", fmt(chk.first)); fill("second", fmt(chk.second)); fill("total", fmt(chk.total));
  fill("signedDate", day(Date.now())); fill("days", String(chk.days)); fill("dueDate", day(Date.now() + chk.days * 86400000));
  const form = $("#signForm"); form.hidden = false;
  $("#sigs").querySelector(".sigbox").hidden = true; // la signature du membre se fait dans le formulaire
  if (q.get("email")) form.email.value = q.get("email");
  if (q.get("name")) form.full_name.value = q.get("name");
  if (q.get("phone")) form.phone.value = q.get("phone");
  for (const k of ["full_name", "email", "phone", "country"]) form[k].addEventListener("input", () => fill(k, form[k].value.trim() || "…"));
  for (const k of ["full_name", "email", "phone"]) fill(k, form[k].value.trim() || "…");

  // zone de signature (doigt, stylet ou souris)
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
  cv.addEventListener("pointerdown", (e) => { try { cv.setPointerCapture(e.pointerId); } catch (_) { /* certains navigateurs refusent : on dessine quand même */ } last = pt(e); ctx.beginPath(); ctx.arc(last.x, last.y, 1.1, 0, 7); ctx.fillStyle = "#1b1530"; ctx.fill(); });
  cv.addEventListener("pointermove", (e) => { if (!last) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); drawn += Math.hypot(p.x - last.x, p.y - last.y); last = p; });
  const up = () => { last = null; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("pointerleave", up);
  $("#clear").onclick = () => { ctx.clearRect(0, 0, cv.width, cv.height); drawn = 0; };

  const msg = (t, ok) => { const m = $("#msg"); m.textContent = t; m.className = "msg" + (ok ? " ok" : ""); m.style.display = t ? "block" : "none"; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); msg("");
    const v = (k) => form[k].value.trim();
    if (v("full_name").length < 3) return msg("Écris ton nom et ton prénom.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) return msg("Écris ton adresse Gmail (celle avec laquelle tu te connecteras).");
    if (v("phone").replace(/\D/g, "").length < 8) return msg("Écris ton numéro WhatsApp avec l'indicatif du pays.");
    if (v("country").length < 2) return msg("Écris ton pays de résidence.");
    if (!form.c1.checked || !form.c2.checked || !form.c3.checked) return msg("Coche les 3 cases avant de signer.");
    if (drawn < 60) return msg("Signe dans le cadre (avec ton doigt ou la souris).");
    // signature exportée sur fond transparent, à taille raisonnable
    const out = document.createElement("canvas"); out.width = 700; out.height = Math.round(700 * cv.height / cv.width);
    out.getContext("2d").drawImage(cv, 0, 0, out.width, out.height);
    const btn = $("#go"); btn.disabled = true; btn.textContent = "Ouverture du paiement sécurisé…";
    const { data, error } = await sb.functions.invoke("saspay", { body: {
      action: "split_create", code, full_name: v("full_name"), email: v("email").toLowerCase(), phone: v("phone"), country: v("country"),
      signature: out.toDataURL("image/png"), accept: [form.c1.checked, form.c2.checked, form.c3.checked],
    } });
    if (error || !data?.checkout_url) {
      btn.disabled = false; btn.innerHTML = `Signer et payer ${fmt(chk.first)} FCFA`;
      return msg(await fnErrorMessage(error, data));
    }
    // même suite que le paiement normal : retour sur l'accueil, vérification, puis connexion Google avec ce Gmail
    store.set("sce_payment_id", data.payment_id); store.set("sce_payment_email", v("email").toLowerCase());
    if (data.contract) store.set("sce_contract", JSON.stringify(data.contract));
    msg("Contrat signé ✓ Redirection vers le paiement…", true);
    location.assign(data.checkout_url);
  });
})();
