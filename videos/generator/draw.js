// Cartoon drawing library for the 1080x1920 vertical videos.
// Everything is drawn with flat shapes + dark outlines (sticker / cartoon style).

const W = 1080, H = 1920;
const INK = '#2a2420';

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function fillStroke(c, fill, lw = 6) {
  if (fill) { c.fillStyle = fill; c.fill(); }
  c.lineWidth = lw; c.strokeStyle = INK; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke();
}
function circle(c, x, y, r, fill, lw = 6) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); fillStroke(c, fill, lw); }
function ellipse(c, x, y, rx, ry, fill, lw = 6) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); fillStroke(c, fill, lw); }

// ---------------------------------------------------------------- backgrounds
function gingham(c, x, y, w, h, sq, col) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.fillStyle = '#fff6f6'; c.fillRect(x, y, w, h);
  c.fillStyle = col + '88';
  for (let i = 0; i * sq < w; i += 2) c.fillRect(x + i * sq, y, sq, h);
  for (let j = 0; j * sq < h; j += 2) c.fillRect(x, y + j * sq, w, sq);
  c.restore();
}
function windowFrame(c, x, y, w, h, night) {
  rr(c, x, y, w, h, 10);
  const g = c.createLinearGradient(0, y, 0, y + h);
  if (night) { g.addColorStop(0, '#1d2550'); g.addColorStop(1, '#3a3f7a'); }
  else { g.addColorStop(0, '#8fd3ff'); g.addColorStop(1, '#ffd7b0'); }
  c.fillStyle = g; c.fill();
  if (night) { circle(c, x + w * 0.7, y + h * 0.3, 26, '#fff7d6', 0); for (let i = 0; i < 9; i++) { c.fillStyle = '#fff'; c.fillRect(x + (i * 97) % w, y + (i * 61) % (h * 0.8) + 10, 4, 4); } }
  else { cloud(c, x + w * 0.3, y + h * 0.3, 0.8); }
  rr(c, x, y, w, h, 10); fillStroke(c, null, 10);
  c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); fillStroke(c, null, 10);
}
function cloud(c, x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.arc(-40, 10, 35, 0, 7); c.arc(0, -10, 45, 0, 7); c.arc(45, 10, 35, 0, 7); c.fillStyle = '#fff'; c.fill();
  c.restore();
}

function bgKitchen(c, o) {
  c.fillStyle = o.wall || '#f7dcc6'; c.fillRect(0, 0, W, H);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  for (let x = 0; x < W; x += 90) c.fillRect(x, 0, 40, H);
  windowFrame(c, 90, 230, 360, 420, o.night);
  // shelf with jars
  rr(c, 600, 380, 400, 22, 6); fillStroke(c, '#b9805a');
  const jars = ['#7cc6a4', '#f29f80', '#f4d06f', '#9bb6f0'];
  jars.forEach((j, i) => { rr(c, 620 + i * 95, 290, 70, 90, 14); fillStroke(c, j); rr(c, 630 + i * 95, 275, 50, 22, 6); fillStroke(c, '#eee'); });
  // lamp
  c.beginPath(); c.moveTo(540, 0); c.lineTo(540, 120); fillStroke(c, null, 6);
  c.beginPath(); c.moveTo(470, 190); c.quadraticCurveTo(540, 90, 610, 190); c.closePath(); fillStroke(c, '#ffcf5a');
  // floor
  c.fillStyle = '#c99872'; c.fillRect(0, 1500, W, 420);
}
function table(c, y = 1230, col = '#ef8fa4') {
  gingham(c, 0, y, W, H - y, 48, col);
  c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); fillStroke(c, null, 8);
}
function bgClassroom(c, o) {
  c.fillStyle = '#eef1e4'; c.fillRect(0, 0, W, H);
  windowFrame(c, 60, 260, 260, 360, false);
  windowFrame(c, 760, 260, 260, 360, false);
  if (o.poster) poster(c, o.poster, 540, 470);
  // desks
  c.fillStyle = '#f7f7f7'; c.fillRect(0, 1330, W, 590);
  c.beginPath(); c.moveTo(0, 1330); c.lineTo(W, 1330); fillStroke(c, null, 10);
  c.fillStyle = '#3c3c46'; c.fillRect(0, 1300, W, 34);
  for (let x = 120; x < W; x += 280) { rr(c, x, 1420, 200, 300, 8); fillStroke(c, '#ececec', 5); }
}
function poster(c, kind, x, y) {
  rr(c, x - 190, y - 250, 380, 500, 12); fillStroke(c, '#fffdf5', 8);
  c.save(); c.translate(x, y);
  if (kind === 'dna') {
    const cols = ['#e94f4f', '#f2a93b', '#4fb3e9', '#5fbf6a'];
    for (let i = 0; i < 16; i++) {
      const yy = -210 + i * 28, a = Math.sin(i * 0.55) * 110;
      c.strokeStyle = cols[i % 4]; c.lineWidth = 8; c.beginPath(); c.moveTo(-a, yy); c.lineTo(a, yy); c.stroke();
    }
    c.lineWidth = 8; c.strokeStyle = '#3d4fa8'; c.beginPath();
    for (let i = 0; i <= 60; i++) { const yy = -210 + i * 7.5, a = Math.sin(i * 0.55 * 28 / 7.5 / 3.73) * 110; i ? c.lineTo(a, yy) : c.moveTo(a, yy); } c.stroke();
    c.strokeStyle = '#a83d6f'; c.beginPath();
    for (let i = 0; i <= 60; i++) { const yy = -210 + i * 7.5, a = -Math.sin(i * 0.55 * 28 / 7.5 / 3.73) * 110; i ? c.lineTo(a, yy) : c.moveTo(a, yy); } c.stroke();
  } else if (kind === 'molecule') {
    const pts = [[0, -60], [-90, 0], [90, 0], [-60, 110], [60, 110], [0, -170], [-170, -50], [170, -50]];
    const links = [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [0, 5], [1, 6], [2, 7]];
    links.forEach(([a, b]) => { c.beginPath(); c.moveTo(...pts[a]); c.lineTo(...pts[b]); fillStroke(c, null, 10); });
    pts.forEach((p, i) => circle(c, p[0], p[1], i < 5 ? 34 : 24, ['#e94f4f', '#4fb3e9', '#f2d14b', '#5fbf6a'][i % 4]));
  } else if (kind === 'tongue') {
    c.beginPath(); c.moveTo(-130, -160); c.quadraticCurveTo(-170, 150, 0, 200); c.quadraticCurveTo(170, 150, 130, -160); c.closePath(); fillStroke(c, '#f28a9a');
    c.beginPath(); c.moveTo(0, -150); c.lineTo(0, 120); fillStroke(c, null, 5);
    [[-60, -60], [60, -60], [-50, 60], [50, 60], [0, 150]].forEach(([a, b], i) => circle(c, a, b, 20, i === 4 ? '#7a7a7a' : '#ffe46b', 4));
  } else if (kind === 'cross') {
    c.fillStyle = '#e94f4f'; c.fillRect(-50, -150, 100, 300); c.fillRect(-150, -50, 300, 100);
  } else if (kind === 'heart') {
    heart(c, 0, 0, 2.2, '#ff7a8a');
  }
  c.restore();
}
function bgBathroom(c) {
  c.fillStyle = '#dff1f6'; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(80,140,160,0.35)'; c.lineWidth = 4;
  for (let x = 0; x <= W; x += 108) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
  for (let y = 0; y <= H; y += 108) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  rr(c, 290, 220, 500, 560, 40); fillStroke(c, '#bfe6ef', 10);
  c.fillStyle = 'rgba(255,255,255,0.5)'; c.save(); rr(c, 290, 220, 500, 560, 40); c.clip(); c.beginPath(); c.moveTo(340, 780); c.lineTo(520, 220); c.lineTo(600, 220); c.lineTo(420, 780); c.fill(); c.restore();
  rr(c, 140, 1300, 800, 90, 20); fillStroke(c, '#ffffff', 8);
  c.fillStyle = '#9fd0dc'; c.fillRect(0, 1390, W, 530);
}
function bgDoctor(c) {
  c.fillStyle = '#e3eefc'; c.fillRect(0, 0, W, H);
  poster(c, 'cross', 780, 470);
  rr(c, 80, 300, 320, 900, 16); fillStroke(c, '#9cb3d6', 8);
  circle(c, 360, 760, 16, '#ffd25a', 5);
  c.fillStyle = '#c7d6ea'; c.fillRect(0, 1400, W, 520);
  c.beginPath(); c.moveTo(0, 1400); c.lineTo(W, 1400); fillStroke(c, null, 8);
}
function bgDark(c, t) {
  const g = c.createRadialGradient(540, 820, 50, 540, 820, 1100);
  g.addColorStop(0, '#2c3566'); g.addColorStop(1, '#0d1024');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function bgGlow(c, t) {
  const g = c.createRadialGradient(540, 860, 40, 540, 860, 1100);
  g.addColorStop(0, '#fff6c4'); g.addColorStop(0.5, '#ffd56a'); g.addColorStop(1, '#3a3020');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(540, 860); c.rotate(t * 0.15);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, -1400); c.lineTo(90, -1400); c.closePath(); c.fill(); }
  c.restore();
}

// ---------------------------------------------------------------- characters
const PRESETS = {
  kid: { skin: '#f3c39d', hair: '#6b3e1f', style: 'spiky', shirt: '#ff8a3d', pants: '#3d4f8a' },
  mum: { skin: '#e9b48e', hair: '#3a2418', style: 'bun', shirt: '#c94f7c', apron: true },
  dad: { skin: '#d9a07a', hair: '#2b1b12', style: 'short', shirt: '#4a7bd0', beard: true },
  brother: { skin: '#f3c39d', hair: '#8a5a2b', style: 'short', shirt: '#6cc070' },
  oma: { skin: '#f0c7a8', hair: '#dcdcdc', style: 'bun', shirt: '#8e6bbf', glasses: true },
  teacher: { skin: '#8d5a3b', hair: '#1d1d1d', style: 'long', shirt: '#ffffff', coat: true, glasses: true },
  chemTeacher: { skin: '#f0c7a8', hair: '#7a7a7a', style: 'bald', shirt: '#ffffff', coat: true, glasses: true, beard: true },
  doctor: { skin: '#f3c39d', hair: '#5a4636', style: 'short', shirt: '#ffffff', coat: true, glasses: true },
  pupil1: { skin: '#7a4a2e', hair: '#151515', style: 'short', shirt: '#5aa9e6' },
  pupil2: { skin: '#f3d2b5', hair: '#e0a040', style: 'long', shirt: '#e87ea1' },
  pupil3: { skin: '#e0b08a', hair: '#222', style: 'spiky', shirt: '#4fbf8f' },
};

function hair(c, p, R) {
  c.fillStyle = p.hair;
  if (p.style === 'spiky') {
    // tufts on top, then a wavy fringe that sits on the forehead
    c.beginPath(); c.moveTo(-R * 1.0, -R * 0.05);
    const n = 9;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * 1.05 + (i / n) * Math.PI * 0.9;
      const rr2 = i % 2 ? R * 1.28 : R * 1.02;
      c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2 - R * 0.05);
    }
    c.lineTo(R * 1.0, -R * 0.05);
    c.quadraticCurveTo(R * 0.8, -R * 0.35, R * 0.5, -R * 0.3);
    c.quadraticCurveTo(R * 0.35, -R * 0.5, R * 0.1, -R * 0.33);
    c.quadraticCurveTo(-R * 0.15, -R * 0.52, -R * 0.4, -R * 0.32);
    c.quadraticCurveTo(-R * 0.75, -R * 0.4, -R * 1.0, -R * 0.05);
    fillStroke(c, p.hair, R * 0.055);
  } else if (p.style === 'bun') {
    circle(c, 0, -R * 1.12, R * 0.38, p.hair);
    c.beginPath(); c.arc(0, -R * 0.05, R * 1.06, Math.PI * 1.02, Math.PI * 1.98); c.quadraticCurveTo(0, -R * 0.5, -R * 1.05, -R * 0.1); fillStroke(c, p.hair);
  } else if (p.style === 'long') {
    c.beginPath(); c.moveTo(-R * 1.1, R * 0.9); c.lineTo(-R * 1.12, -R * 0.1); c.arc(0, -R * 0.05, R * 1.12, Math.PI, 0); c.lineTo(R * 1.1, R * 0.9); c.lineTo(R * 0.8, R * 0.9); c.lineTo(R * 0.85, -R * 0.2); c.quadraticCurveTo(0, -R * 0.6, -R * 0.85, -R * 0.2); c.lineTo(-R * 0.8, R * 0.9); c.closePath(); fillStroke(c, p.hair);
  } else if (p.style === 'short') {
    c.beginPath(); c.arc(0, -R * 0.05, R * 1.05, Math.PI * 1.0, Math.PI * 2.0); c.quadraticCurveTo(R * 0.3, -R * 0.45, -R * 1.05, -R * 0.05); fillStroke(c, p.hair);
  } else if (p.style === 'bald') {
    ellipse(c, -R * 0.95, -R * 0.05, R * 0.22, R * 0.35, p.hair); ellipse(c, R * 0.95, -R * 0.05, R * 0.22, R * 0.35, p.hair);
  }
}

function face(c, p, R, expr, t) {
  const ink = INK; c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = R * 0.07; c.lineCap = 'round';
  const ex = R * 0.38, ey = R * 0.05;
  const blink = (Math.sin(t * 2.3 + (p.seed || 0)) > 0.985);
  const dot = (x) => { if (blink) { c.beginPath(); c.moveTo(x - R * 0.1, ey); c.lineTo(x + R * 0.1, ey); c.stroke(); } else { c.beginPath(); c.ellipse(x, ey, R * 0.085, R * 0.12, 0, 0, 7); c.fill(); } };
  const arcUp = (x) => { c.beginPath(); c.arc(x, ey + R * 0.06, R * 0.13, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); };
  const arcDown = (x) => { c.beginPath(); c.arc(x, ey - R * 0.06, R * 0.13, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); };
  const brow = (x, tilt) => { c.beginPath(); c.moveTo(x - R * 0.15, ey - R * 0.26 - tilt * R * 0.08); c.lineTo(x + R * 0.15, ey - R * 0.26 + tilt * R * 0.08); c.stroke(); };
  const my = R * 0.45;
  switch (expr) {
    case 'happy': dot(-ex); dot(ex); c.beginPath(); c.arc(0, my - R * 0.12, R * 0.22, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); break;
    case 'joy': arcUp(-ex); arcUp(ex); c.beginPath(); c.moveTo(-R * 0.25, my - R * 0.08); c.quadraticCurveTo(0, my + R * 0.35, R * 0.25, my - R * 0.08); c.closePath(); c.fillStyle = '#7a2a2a'; c.fill(); c.stroke(); break;
    case 'proud': arcDown(-ex); arcDown(ex); brow(-ex, 1); brow(ex, -1); c.beginPath(); c.moveTo(-R * 0.25, my - R * 0.1); c.quadraticCurveTo(0, my + R * 0.25, R * 0.28, my - R * 0.15); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.stroke(); break;
    case 'disgust':
      c.beginPath(); c.moveTo(-ex - R * 0.12, ey - R * 0.1); c.lineTo(-ex + R * 0.1, ey); c.lineTo(-ex - R * 0.12, ey + R * 0.1); c.stroke();
      c.beginPath(); c.moveTo(ex + R * 0.12, ey - R * 0.1); c.lineTo(ex - R * 0.1, ey); c.lineTo(ex + R * 0.12, ey + R * 0.1); c.stroke();
      c.beginPath(); c.moveTo(-R * 0.25, my); for (let i = 1; i <= 6; i++) c.lineTo(-R * 0.25 + i * R * 0.083, my + (i % 2 ? -1 : 1) * R * 0.06); c.stroke(); break;
    case 'sad': dot(-ex); dot(ex); brow(-ex, -1); brow(ex, 1); c.beginPath(); c.arc(0, my + R * 0.12, R * 0.18, 1.2 * Math.PI, 1.8 * Math.PI); c.stroke();
      c.fillStyle = '#7cc8ff'; c.beginPath(); c.ellipse(ex + R * 0.05, ey + R * 0.25 + ((t * 60) % 40) * R * 0.004, R * 0.06, R * 0.1, 0, 0, 7); c.fill(); break;
    case 'surprised': c.fillStyle = '#fff'; c.beginPath(); c.arc(-ex, ey, R * 0.15, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(ex, ey, R * 0.15, 0, 7); c.fill(); c.stroke();
      c.fillStyle = ink; c.beginPath(); c.arc(-ex, ey, R * 0.06, 0, 7); c.arc(ex, ey, R * 0.06, 0, 7); c.fill();
      c.fillStyle = '#7a2a2a'; c.beginPath(); c.ellipse(0, my, R * 0.1, R * 0.14, 0, 0, 7); c.fill(); c.stroke(); break;
    case 'angry': dot(-ex); dot(ex); brow(-ex, 1.6); brow(ex, -1.6); c.beginPath(); c.moveTo(-R * 0.18, my); c.lineTo(R * 0.18, my); c.stroke(); break;
    case 'smug': c.beginPath(); c.moveTo(-ex - R * .12, ey); c.lineTo(-ex + R * .12, ey); c.moveTo(ex - R * .12, ey); c.lineTo(ex + R * .12, ey); c.stroke(); brow(-ex, 0.5); brow(ex, -0.5);
      c.beginPath(); c.moveTo(-R * 0.15, my); c.quadraticCurveTo(R * 0.1, my + R * 0.1, R * 0.25, my - R * 0.08); c.stroke(); break;
    case 'laugh': arcUp(-ex); arcUp(ex); c.beginPath(); c.moveTo(-R * 0.3, my - R * 0.12); c.quadraticCurveTo(0, my + R * 0.45, R * 0.3, my - R * 0.12); c.closePath(); c.fillStyle = '#7a2a2a'; c.fill(); c.stroke(); break;
    case 'think': dot(-ex); dot(ex); brow(-ex, -0.6); c.beginPath(); c.moveTo(-R * 0.1, my); c.quadraticCurveTo(R * 0.05, my - R * 0.06, R * 0.2, my + R * 0.02); c.stroke(); break;
    default: dot(-ex); dot(ex); c.beginPath(); c.moveTo(-R * 0.14, my); c.lineTo(R * 0.14, my); c.stroke();
  }
  if (!['disgust'].includes(expr)) {
    c.fillStyle = 'rgba(255,120,120,0.35)';
    c.beginPath(); c.ellipse(-R * 0.62, R * 0.3, R * 0.16, R * 0.1, 0, 0, 7); c.ellipse(R * 0.62, R * 0.3, R * 0.16, R * 0.1, 0, 0, 7); c.fill();
  }
}

// a: {who, x, y (head centre), s, expr, green, hold, armUp, flip}
function person(c, a, t) {
  const p = Object.assign({}, PRESETS[a.who] || PRESETS.kid, a.over || {});
  const R = 110 * (a.s || 1);
  const bob = Math.sin(t * 3 + (a.x || 0) * 0.01) * R * 0.03;
  c.save(); c.translate(a.x, a.y + bob);
  if (a.flip) c.scale(-1, 1);
  // body
  const bw = R * 2.0, bh = R * 2.3;
  rr(c, -bw / 2, R * 0.85, bw, bh, R * 0.45); fillStroke(c, p.shirt, R * 0.055);
  if (p.coat) { c.beginPath(); c.moveTo(0, R * 0.9); c.lineTo(-R * 0.25, R * 1.6); c.moveTo(0, R * 0.9); c.lineTo(R * 0.25, R * 1.6); fillStroke(c, null, R * 0.05); circle(c, R * 0.0, R * 1.9, R * 0.05, '#ddd', R * 0.03); }
  if (p.apron) { rr(c, -R * 0.6, R * 1.25, R * 1.2, R * 1.7, R * 0.2); fillStroke(c, '#ffffff', R * 0.05); }
  if (p.stripes) { /* reserved */ }
  // arms
  const armCol = p.shirt;
  const armL = () => { rr(c, -bw / 2 - R * 0.3, R * 1.05, R * 0.38, R * 1.5, R * 0.19); fillStroke(c, armCol, R * 0.05); circle(c, -bw / 2 - R * 0.11, R * 2.55, R * 0.2, p.skin, R * 0.05); };
  armL();
  if (a.armUp) {
    c.save(); c.translate(bw / 2 - R * 0.05, R * 1.15); c.rotate(-2.5 + Math.sin(t * 6) * 0.08);
    rr(c, -R * 0.19, 0, R * 0.38, R * 1.4, R * 0.19); fillStroke(c, armCol, R * 0.05); circle(c, 0, R * 1.5, R * 0.2, p.skin, R * 0.05);
    if (a.hold) { c.save(); c.translate(0, R * 1.75); c.rotate(2.5); prop(c, { name: a.hold, x: 0, y: -R * 0.2, s: (a.s || 1) * 0.55 }, t); c.restore(); }
    c.restore();
  } else {
    rr(c, bw / 2 - R * 0.08, R * 1.05, R * 0.38, R * 1.5, R * 0.19); fillStroke(c, armCol, R * 0.05); circle(c, bw / 2 + R * 0.11, R * 2.55, R * 0.2, p.skin, R * 0.05);
    if (a.hold) prop(c, { name: a.hold, x: bw / 2 + R * 0.15, y: R * 2.2, s: (a.s || 1) * 0.55 }, t);
  }
  // head
  circle(c, -R * 1.0, R * 0.08, R * 0.2, p.skin, R * 0.05); circle(c, R * 1.0, R * 0.08, R * 0.2, p.skin, R * 0.05);
  circle(c, 0, 0, R, p.skin, R * 0.055);
  if (a.green) {
    c.save(); c.beginPath(); c.arc(0, 0, R - 3, 0, 7); c.clip();
    c.fillStyle = 'rgba(126,196,74,0.85)'; c.fillRect(-R, -R * 0.15 - Math.sin(t * 2) * R * 0.05, R * 2, R * 2); c.restore();
    c.beginPath(); c.arc(0, 0, R, 0, 7); fillStroke(c, null, R * 0.055);
  }
  hair(c, p, R);
  face(c, p, R, a.expr || 'happy', t);
  if (p.glasses) { c.lineWidth = R * 0.045; c.strokeStyle = INK; c.beginPath(); c.arc(-R * 0.38, R * 0.05, R * 0.22, 0, 7); c.moveTo(R * 0.6, R * 0.05); c.arc(R * 0.38, R * 0.05, R * 0.22, 0, 7); c.moveTo(-R * 0.16, R * 0.05); c.lineTo(R * 0.16, R * 0.05); c.stroke(); }
  if (p.beard) { c.beginPath(); c.arc(0, R * 0.25, R * 0.75, 0.15 * Math.PI, 0.85 * Math.PI); c.quadraticCurveTo(0, R * 1.25, R * 0.75 * Math.cos(0.15 * Math.PI), R * 0.25 + R * 0.75 * Math.sin(0.15 * Math.PI)); c.fillStyle = p.hair; c.globalAlpha = 0.9; c.fill(); c.globalAlpha = 1; }
  if (a.green) stink(c, 0, -R * 0.2, R, t);
  if (a.sweat) { c.fillStyle = '#8fd3ff'; c.beginPath(); c.moveTo(R * 0.85, -R * 0.6); c.quadraticCurveTo(R * 1.05, -R * 0.25, R * 0.85, -R * 0.2); c.quadraticCurveTo(R * 0.65, -R * 0.25, R * 0.85, -R * 0.6); fillStroke(c, '#8fd3ff', R * 0.04); }
  c.restore();
}
function stink(c, x, y, R, t) {
  c.strokeStyle = '#6fbf3a'; c.lineWidth = R * 0.06; c.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const bx = x + i * R * 0.75, by = y - R * 1.2 - ((t * 40 + i * 20) % 30);
    c.beginPath(); c.moveTo(bx, by + R * 0.4);
    c.bezierCurveTo(bx - R * 0.15, by + R * 0.25, bx + R * 0.15, by + R * 0.15, bx, by); c.stroke();
  }
}
function heart(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 30); c.bezierCurveTo(-60, -10, -30, -60, 0, -30); c.bezierCurveTo(30, -60, 60, -10, 0, 30); fillStroke(c, col, 4); c.restore();
}

// ---------------------------------------------------------------- props
function leaf(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-30, -20, -25, -60, 0, -70); c.bezierCurveTo(25, -60, 30, -20, 0, 0); fillStroke(c, '#59b84a', 4);
  c.beginPath(); c.moveTo(0, -5); c.lineTo(0, -60); c.strokeStyle = '#2f7a2a'; c.lineWidth = 3; c.stroke();
  c.restore();
}
function plate(c, x, y, s, fill = '#ffffff') { ellipse(c, x, y, 230 * s, 80 * s, fill, 6); ellipse(c, x, y, 170 * s, 55 * s, null, 3); }
function glass(c, x, y, s, liquid, level = 0.8) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(-70, -170); c.lineTo(-55, 120); c.lineTo(55, 120); c.lineTo(70, -170); c.closePath();
  c.save(); c.clip(); c.fillStyle = 'rgba(220,240,255,0.6)'; c.fillRect(-80, -180, 160, 310);
  c.fillStyle = liquid; c.fillRect(-80, 120 - 290 * level, 160, 300); c.restore();
  c.beginPath(); c.moveTo(-70, -170); c.lineTo(-55, 120); c.lineTo(55, 120); c.lineTo(70, -170); c.closePath(); fillStroke(c, null, 7);
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-45, -140, 14, 220);
  c.restore();
}
function prop(c, p, t) {
  const s = p.s || 1, x = p.x, y = p.y;
  switch (p.name) {
    case 'koriander': {
      c.save(); c.translate(x, y); c.scale(s, s);
      c.strokeStyle = '#2f7a2a'; c.lineWidth = 8;
      for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(0, 120); c.quadraticCurveTo(i * 15, 40, i * 40, -40 - Math.abs(i) * 5); c.stroke(); }
      for (let i = -3; i <= 3; i++) { leaf(c, i * 40, -30 - Math.abs(i) * 5, 1.1, i * 0.35); leaf(c, i * 40 - 18, -10, 0.8, i * 0.3 - 0.9); leaf(c, i * 40 + 18, -10, 0.8, i * 0.3 + 0.9); }
      c.restore(); break;
    }
    case 'korianderPile': {
      plate(c, x, y + 40 * s, 1.3 * s);
      for (let i = 0; i < 40; i++) { const a = i * 2.4, r = (i % 7) * 22 * s; leaf(c, x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 0.45 - (40 - i) * 2.2 * s, 1.0 * s, a); }
      break;
    }
    case 'pot': {
      c.save(); c.translate(x, y); c.scale(s, s);
      rr(c, -170, -90, 340, 180, 30); fillStroke(c, '#d64f3f');
      rr(c, -200, -110, 400, 40, 18); fillStroke(c, '#b23b2f');
      rr(c, -250, -70, 60, 26, 12); fillStroke(c, '#555'); rr(c, 190, -70, 60, 26, 12); fillStroke(c, '#555');
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 8;
      for (let i = -1; i <= 1; i++) { const o = Math.sin(t * 3 + i) * 10; c.beginPath(); c.moveTo(i * 70, -140); c.bezierCurveTo(i * 70 - 25 + o, -180, i * 70 + 25 + o, -210, i * 70, -250); c.stroke(); }
      c.restore();
      for (let i = 0; i < 6; i++) leaf(c, x - 60 + i * 25, y - 140 * s - ((t * 260 + i * 70) % 160) * s * -1 - 160 * s, 0.6 * s, t * 4 + i);
      break;
    }
    case 'bowls': {
      const items = [['#7bbf54', 'Suppe'], ['#9fd36b', 'Salat'], ['#86c45a', 'Guac']];
      items.forEach((it, i) => {
        const bx = x + (i - 1) * 300 * s, by = y + (i === 1 ? -30 : 20) * s;
        c.beginPath(); c.moveTo(bx - 130 * s, by); c.quadraticCurveTo(bx, by + 190 * s, bx + 130 * s, by); c.closePath(); fillStroke(c, '#ffffff');
        ellipse(c, bx, by, 130 * s, 35 * s, it[0]);
        for (let k = 0; k < 4; k++) leaf(c, bx - 60 * s + k * 40 * s, by - 5 * s, 0.6 * s, k - 1.5);
      });
      break;
    }
    case 'milk': glass(c, x, y, s, '#ffffff', 0.85); break;
    case 'milkEmpty': glass(c, x, y, s, '#ffffff', 0.08); break;
    case 'oatmilk': glass(c, x, y, s, '#efe0c0', 0.85);
      c.save(); c.translate(x + 100 * s, y + 20 * s); c.rotate(0.15); rr(c, 0, 0, 220 * s, 150 * s, 10); fillStroke(c, '#fff59a', 5);
      c.fillStyle = INK; c.font = `900 ${34 * s}px Inter`; c.fillText('Sorry ♥', 22 * s, 85 * s); c.restore(); break;
    case 'oj': glass(c, x, y, s, '#ffa726', 0.8); break;
    case 'oranges': for (let i = 0; i < 3; i++) { circle(c, x + (i - 1) * 120 * s, y + (i === 1 ? -50 : 0) * s, 70 * s, '#ff9f1c'); leaf(c, x + (i - 1) * 120 * s + 10 * s, y + (i === 1 ? -50 : 0) * s - 60 * s, 0.6 * s, 0.6); } break;
    case 'coffee': { c.save(); c.translate(x, y); c.scale(s, s); rr(c, -80, -90, 160, 180, 26); fillStroke(c, '#ffffff'); c.beginPath(); c.arc(95, 0, 40, -1.4, 1.4); fillStroke(c, null, 14);
      c.fillStyle = '#6b3e1f'; c.fillRect(-70, -80, 140, 18); c.strokeStyle = 'rgba(120,120,120,0.6)'; c.lineWidth = 7; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * 35, -110); c.quadraticCurveTo(i * 35 + 20 * Math.sin(t * 3 + i), -150, i * 35, -190); c.stroke(); } c.restore(); break; }
    case 'toothbrush': { c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.5); rr(c, -160, -18, 320, 36, 18); fillStroke(c, '#4fb3e9'); rr(c, 90, -60, 80, 44, 8); fillStroke(c, '#ffffff');
      for (let i = 0; i < 5; i++) circle(c, 100 + i * 16, -78 - (i % 2) * 10, 16, '#ffffff', 3); c.restore(); break; }
    case 'clock': { c.save(); c.translate(x, y); c.scale(s, s); circle(c, 0, 0, 150, '#ffffff', 10); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.beginPath(); c.moveTo(Math.cos(a) * 120, Math.sin(a) * 120); c.lineTo(Math.cos(a) * 138, Math.sin(a) * 138); fillStroke(c, null, 8); }
      const m = t * 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(m - 1.57) * 110, Math.sin(m - 1.57) * 110); fillStroke(c, null, 10); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(m / 12 - 1) * 70, Math.sin(m / 12 - 1) * 70); fillStroke(c, null, 14); circle(c, 0, 0, 12, INK, 0); c.restore(); break; }
    case 'paper': { c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.08); rr(c, -150, -200, 300, 400, 10); fillStroke(c, '#ffffff'); c.fillStyle = '#c9c9c9'; for (let i = 0; i < 6; i++) c.fillRect(-110, -140 + i * 45, i === 5 ? 120 : 220, 14);
      c.fillStyle = '#e94f4f'; c.font = '900 64px Inter'; c.fillText('✓', 60, 170); c.restore(); break; }
    case 'tummy': { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = '#e94f4f'; c.lineWidth = 10; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.beginPath(); const r = 60 + i * 35 + (t * 60) % 35; c.arc(0, 0, r, -0.6, 0.6); c.stroke(); c.beginPath(); c.arc(0, 0, r, Math.PI - 0.6, Math.PI + 0.6); c.stroke(); } c.restore(); break; }
    case 'lactose': { c.save(); c.translate(x, y); c.scale(s, s); glass(c, -220, 0, 0.8, '#fff', 0.85);
      c.beginPath(); c.moveTo(-100, 0); c.lineTo(60, 0); fillStroke(c, null, 12); c.beginPath(); c.moveTo(40, -25); c.lineTo(70, 0); c.lineTo(40, 25); fillStroke(c, null, 12);
      ellipse(c, 220, 0, 110, 90, '#f6a5a5'); c.strokeStyle = '#e02020'; c.lineWidth = 22; c.beginPath(); c.moveTo(150, -70); c.lineTo(290, 70); c.moveTo(290, -70); c.lineTo(150, 70); c.stroke(); c.restore(); break; }
    case 'bubbles': for (let i = 0; i < 14; i++) { const bx = x + Math.sin(i * 7.3) * 380 * s, by = y + 300 * s - ((t * 120 + i * 97) % 900) * s, r = (18 + (i * 13) % 40) * s; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fillStyle = 'rgba(220,240,255,0.55)'; c.fill(); c.lineWidth = 4; c.strokeStyle = 'rgba(80,150,200,0.9)'; c.stroke(); c.beginPath(); c.arc(bx - r * 0.35, by - r * 0.35, r * 0.2, 0, 7); c.fillStyle = '#fff'; c.fill(); } break;
    case 'soap': { c.save(); c.translate(x, y); c.scale(s, s); rr(c, -110, -60, 220, 120, 40); fillStroke(c, '#ff9ecb'); c.fillStyle = '#fff'; c.font = '900 40px Inter'; c.textAlign = 'center'; c.fillText('SOAP', 0, 14); c.restore(); break; }
    case 'rain': { const cx = x, cy = y; cloud(c, cx, cy, 2.2 * s); c.fillStyle = '#8a95a8'; c.beginPath(); c.arc(cx - 88 * s, cy + 22 * s, 77 * s, 0, 7); c.arc(cx, cy - 22 * s, 99 * s, 0, 7); c.arc(cx + 99 * s, cy + 22 * s, 77 * s, 0, 7); c.fill();
      c.strokeStyle = '#7cc8ff'; c.lineWidth = 7; for (let i = 0; i < 9; i++) { const rx = cx - 160 * s + i * 40 * s, ry = cy + 90 * s + ((t * 500 + i * 53) % 220) * s; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 8, ry + 30); c.stroke(); } break; }
    case 'sparkles': for (let i = 0; i < 10; i++) { const a = i * 0.63 + t * 0.6, r = (330 + (i % 3) * 60) * s, sz = (18 + 12 * Math.sin(t * 5 + i)) * s; star(c, x + Math.cos(a) * r, y + Math.sin(a) * r * 1.2, sz); } break;
    case 'question': { c.font = `900 ${160 * s}px Inter`; c.textAlign = 'center'; c.lineWidth = 14; c.strokeStyle = INK; c.fillStyle = '#ffd23f'; const o = Math.sin(t * 4) * 15; c.strokeText('?', x, y + o); c.fillText('?', x, y + o); break; }
    case 'haha': { c.font = `900 ${90 * s}px Inter`; c.textAlign = 'center'; c.lineWidth = 12; c.strokeStyle = INK; c.fillStyle = '#ff6b6b';
      [[-300, -60], [280, -120], [-220, 200], [300, 160]].forEach(([dx, dy], i) => { const o = Math.sin(t * 8 + i) * 12; c.save(); c.translate(x + dx * s, y + dy * s + o); c.rotate((i % 2 ? 0.2 : -0.2)); c.strokeText('HA', 0, 0); c.fillText('HA', 0, 0); c.restore(); }); break; }
    case 'bigword': { const sc = 1 + 0.04 * Math.sin(t * 4); c.save(); c.translate(x, y); c.scale(sc * s, sc * s); c.font = `900 ${p.size || 110}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.lineWidth = 26; c.strokeStyle = INK; c.lineJoin = 'round'; c.strokeText(p.text, 0, 0); c.fillStyle = p.color || '#7ee06b'; c.fillText(p.text, 0, 0); c.restore(); break; }
    case 'frame': { const g = 0.5 + 0.5 * Math.sin(t * 3); rr(c, x - 330 * s, y - 380 * s, 660 * s, 760 * s, 40 * s); c.lineWidth = 26 * s; c.strokeStyle = `rgba(255,200,40,${0.6 + 0.4 * g})`; c.stroke(); c.lineWidth = 8 * s; c.strokeStyle = INK; c.stroke(); break; }
    case 'arrowRight': { c.beginPath(); c.moveTo(x - 80 * s, y); c.lineTo(x + 60 * s, y); fillStroke(c, null, 16 * s); c.beginPath(); c.moveTo(x + 30 * s, y - 35 * s); c.lineTo(x + 75 * s, y); c.lineTo(x + 30 * s, y + 35 * s); fillStroke(c, null, 16 * s); break; }
    case 'sugarBlock': { c.save(); c.translate(x, y); c.scale(s, s);
      // sweet: wrapped candy, crossed out
      c.save(); c.translate(-190, 0);
      c.beginPath(); c.moveTo(-40, 0); c.lineTo(-85, -35); c.lineTo(-85, 35); c.closePath(); fillStroke(c, '#ff8fc0', 5);
      c.beginPath(); c.moveTo(40, 0); c.lineTo(85, -35); c.lineTo(85, 35); c.closePath(); fillStroke(c, '#ff8fc0', 5);
      ellipse(c, 0, 0, 50, 38, '#ff5fa2', 5);
      c.strokeStyle = '#e02020'; c.lineWidth = 18; c.beginPath(); c.arc(0, 0, 105, 0, 7); c.moveTo(-74, -74); c.lineTo(74, 74); c.stroke(); c.restore();
      // bitter: green drop with arrow up
      c.save(); c.translate(170, 10);
      c.beginPath(); c.moveTo(0, -80); c.quadraticCurveTo(65, 10, 0, 60); c.quadraticCurveTo(-65, 10, 0, -80); fillStroke(c, '#7ac943', 6);
      c.beginPath(); c.moveTo(100, 50); c.lineTo(100, -60); fillStroke(c, null, 14); c.beginPath(); c.moveTo(70, -30); c.lineTo(100, -65); c.lineTo(130, -30); fillStroke(c, null, 14);
      c.restore(); c.restore(); break; }
  }
}
function star(c, x, y, r) {
  c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fillStyle = '#fff6b0'; c.fill();
}

const BG = { kitchen: bgKitchen, classroom: bgClassroom, bathroom: bgBathroom, doctor: bgDoctor, dark: bgDark, glow: bgGlow };
