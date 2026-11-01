// Studio Voix & Vidéo — voix off ElevenLabs + montage vidéo 100 % navigateur.
'use strict';

const API = 'https://api.elevenlabs.io/v1';
const $ = (id) => document.getElementById(id);

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};

const state = {
  apiKey: '',
  voices: [],
  audioBlob: null,   // voix off courante (générée ou importée)
  media: [],         // [{ kind: 'image'|'video', el, url }]
};

function setStatus(el, msg, kind = '') {
  el.textContent = msg;
  el.className = 'status' + (kind ? ' ' + kind : '');
}

async function apiError(res) {
  try {
    const j = await res.json();
    const d = j.detail;
    return (d && (d.message || (typeof d === 'string' ? d : JSON.stringify(d)))) || res.statusText;
  } catch { return `${res.status} ${res.statusText}`; }
}

/* ---------- 1. Connexion ---------- */

async function connect() {
  const key = $('apiKey').value.trim();
  if (!key) return setStatus($('keyStatus'), 'Colle ta clé API ElevenLabs.', 'err');
  setStatus($('keyStatus'), 'Connexion…');
  try {
    const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': key } });
    if (!res.ok) throw new Error(await apiError(res));
    const data = await res.json();
    state.apiKey = key;
    state.voices = data.voices || [];
    store.set('elevenlabs_key', key);
    fillVoices();
    setStatus($('keyStatus'), `✅ Connecté — ${state.voices.length} voix disponibles.`, 'ok');
  } catch (e) {
    setStatus($('keyStatus'), '❌ ' + e.message, 'err');
  }
}

function fillVoices() {
  const sel = $('voice');
  sel.innerHTML = '';
  const isFr = (v) => /fr/i.test(v.labels?.language || '') || /fran[cç]/i.test(v.description || '');
  const groups = [
    ['Voix françaises', state.voices.filter(isFr)],
    ['Autres voix (multilingues)', state.voices.filter((v) => !isFr(v))],
  ];
  for (const [label, list] of groups) {
    if (!list.length) continue;
    const g = document.createElement('optgroup');
    g.label = label;
    for (const v of list) {
      const o = document.createElement('option');
      o.value = v.voice_id;
      const tags = [v.labels?.gender, v.labels?.accent].filter(Boolean).join(', ');
      o.textContent = v.name + (tags ? ` (${tags})` : '');
      g.appendChild(o);
    }
    sel.appendChild(g);
  }
  const saved = store.get('elevenlabs_voice');
  if (saved && state.voices.some((v) => v.voice_id === saved)) sel.value = saved;
}

let previewAudio = null;
function previewVoice() {
  const v = state.voices.find((x) => x.voice_id === $('voice').value);
  if (!v?.preview_url) return;
  previewAudio?.pause();
  previewAudio = new Audio(v.preview_url);
  previewAudio.play();
}

/* ---------- 2. Voix off ---------- */

function setAudio(blob, filename) {
  state.audioBlob = blob;
  const url = URL.createObjectURL(blob);
  $('audio').src = url;
  $('downloadAudio').href = url;
  $('downloadAudio').download = filename;
  $('audioBox').hidden = false;
}

async function generate() {
  const text = $('text').value.trim();
  const voiceId = $('voice').value;
  const st = $('ttsStatus');
  if (!state.apiKey) return setStatus(st, 'Connecte-toi d\'abord (étape 1).', 'err');
  if (!voiceId) return setStatus(st, 'Choisis une voix.', 'err');
  if (!text) return setStatus(st, 'Écris un texte.', 'err');

  const btn = $('generate');
  btn.disabled = true;
  setStatus(st, 'Génération en cours…');
  try {
    const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': state.apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: $('model').value }),
    });
    if (!res.ok) throw new Error(await apiError(res));
    setAudio(await res.blob(), 'voix-off.mp3');
    store.set('elevenlabs_voice', voiceId);
    setStatus(st, '✅ Voix off prête.', 'ok');
  } catch (e) {
    setStatus(st, '❌ ' + e.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

/* ---------- 3. Médias ---------- */

function loadMedia(files) {
  for (const m of state.media) URL.revokeObjectURL(m.url);
  state.media = [];
  $('thumbs').innerHTML = '';
  for (const f of files) {
    const url = URL.createObjectURL(f);
    let el;
    if (f.type.startsWith('video/')) {
      el = document.createElement('video');
      Object.assign(el, { src: url, muted: true, loop: true, playsInline: true, preload: 'auto' });
      state.media.push({ kind: 'video', el, url });
    } else if (f.type.startsWith('image/')) {
      el = new Image();
      el.src = url;
      state.media.push({ kind: 'image', el, url });
    } else continue;
    $('thumbs').appendChild(el.cloneNode());
  }
}

/* ---------- 4. Rendu vidéo ---------- */

function pickMime() {
  const c = ['video/mp4;codecs=avc1,mp4a', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return c.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || '';
}

// Découpe le texte en sous-titres courts, minutés au prorata du nombre de caractères.
function buildSubtitles(text, duration) {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?…;:]+[.!?…;:]*/g) || [];
  const chunks = [];
  for (const p of parts) {
    const words = p.trim().split(' ');
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > 70 && cur) { chunks.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    }
    if (cur) chunks.push(cur);
  }
  const total = chunks.reduce((s, c) => s + c.length, 0) || 1;
  let t = 0;
  return chunks.map((c) => {
    const d = (c.length / total) * duration;
    const sub = { start: t, end: t + d, text: c };
    t += d;
    return sub;
  });
}

function drawCover(ctx, el, W, H, scale) {
  const sw = el.videoWidth || el.naturalWidth, sh = el.videoHeight || el.naturalHeight;
  if (!sw || !sh) return;
  const r = Math.max(W / sw, H / sh) * scale;
  const dw = sw * r, dh = sh * r;
  ctx.drawImage(el, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function wrapLines(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawText(ctx, text, W, y, size, { box = false, alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `700 ${size}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = wrapLines(ctx, text, W * 0.86);
  const lh = size * 1.25;
  const top = y - ((lines.length - 1) * lh) / 2;
  if (box) {
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size;
    const bh = lines.length * lh + size * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect((W - bw) / 2, top - lh / 2 - size * 0.25, bw, bh, size * 0.3);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = size * 0.15;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
  ctx.restore();
}

async function render() {
  const st = $('renderStatus');
  if (!state.audioBlob) return setStatus(st, 'Génère ou importe d\'abord une voix off (étape 2).', 'err');
  const mime = pickMime();
  if (!mime) return setStatus(st, 'Ton navigateur ne permet pas l\'enregistrement vidéo. Essaie Chrome, Edge ou Safari récent.', 'err');

  const btn = $('render');
  btn.disabled = true;
  $('videoBox').hidden = true;
  setStatus(st, 'Préparation…');

  const [W, H] = $('format').value.split('x').map(Number);
  const canvas = $('canvas');
  canvas.width = W; canvas.height = H;
  canvas.classList.add('active');
  const ctx = canvas.getContext('2d');

  const actx = new AudioContext();
  try {
    await Promise.all(state.media.map((m) => m.kind === 'image'
      ? m.el.decode().catch(() => {})
      : new Promise((r) => (m.el.readyState >= 2 ? r() : (m.el.onloadeddata = r)))));

    const buffer = await actx.decodeAudioData(await state.audioBlob.arrayBuffer());
    const duration = buffer.duration;
    const dest = actx.createMediaStreamDestination();
    const src = actx.createBufferSource();
    src.buffer = buffer;
    src.connect(dest);
    src.connect(actx.destination); // pour entendre pendant le rendu

    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));

    const subs = $('subs').checked ? buildSubtitles($('text').value.trim(), duration) : [];
    const title = $('title').value.trim();
    const kenburns = $('kenburns').checked;
    const n = state.media.length;
    const seg = n ? duration / n : duration;
    let current = -1;

    rec.start(250);
    const t0 = actx.currentTime + 0.1;
    src.start(t0);
    let running = true;
    src.onended = () => { running = false; setTimeout(() => rec.stop(), 300); };

    const frame = () => {
      const t = Math.max(0, actx.currentTime - t0);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (n) {
        const i = Math.min(n - 1, Math.floor(t / seg));
        const m = state.media[i];
        if (i !== current) {
          state.media[current]?.kind === 'video' && state.media[current].el.pause();
          if (m.kind === 'video') { m.el.currentTime = 0; m.el.play().catch(() => {}); }
          current = i;
        }
        const local = (t - i * seg) / seg;
        const scale = m.kind === 'image' && kenburns ? 1 + 0.08 * local : 1;
        drawCover(ctx, m.el, W, H, scale);
        // fondu entre les plans
        const edge = Math.min(local, 1 - local) * seg;
        if (n > 1 && edge < 0.3) { ctx.fillStyle = `rgba(0,0,0,${1 - edge / 0.3})`; ctx.fillRect(0, 0, W, H); }
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#3b2fd1'); g.addColorStop(1, '#c2185b');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      const base = Math.min(W, H);
      if (title && t < 3.5) drawText(ctx, title, W, H / 2, base * 0.09, { alpha: Math.min(1, (3.5 - t) / 0.5) });
      const sub = subs.find((s) => t >= s.start && t < s.end);
      if (sub) drawText(ctx, sub.text, W, H * 0.85, base * 0.045, { box: true });

      setStatus(st, `Enregistrement… ${Math.min(100, Math.round((t / duration) * 100))} % (garde cet onglet ouvert et visible)`);
      if (running) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    await done;
    state.media.forEach((m) => m.kind === 'video' && m.el.pause());
    const blob = new Blob(chunks, { type: mime.split(';')[0] });
    const url = URL.createObjectURL(blob);
    $('output').src = url;
    $('downloadVideo').href = url;
    $('downloadVideo').download = 'video.' + (mime.startsWith('video/mp4') ? 'mp4' : 'webm');
    $('videoBox').hidden = false;
    canvas.classList.remove('active');
    setStatus(st, '✅ Vidéo prête !', 'ok');
  } catch (e) {
    setStatus(st, '❌ ' + e.message, 'err');
  } finally {
    actx.close();
    btn.disabled = false;
  }
}

/* ---------- Branchements ---------- */

$('saveKey').onclick = connect;
$('apiKey').onkeydown = (e) => e.key === 'Enter' && connect();
$('previewVoice').onclick = previewVoice;
$('generate').onclick = generate;
$('render').onclick = render;
$('text').oninput = () => ($('charCount').textContent = $('text').value.length);
$('audioFile').onchange = (e) => e.target.files[0] && setAudio(e.target.files[0], e.target.files[0].name);
$('media').onchange = (e) => loadMedia([...e.target.files]);

const savedKey = store.get('elevenlabs_key');
if (savedKey) { $('apiKey').value = savedKey; connect(); }
