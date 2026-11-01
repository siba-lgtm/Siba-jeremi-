// Usage: node render.js <story> <outDir> [--preview]
// Renders frames with headless Chromium, pipes them to ffmpeg, writes timeline JSON + SRT.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const [story, outDir, flag] = process.argv.slice(2);
const FPS = 30;

const srtTime = s => {
  const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(__dirname, 'engine.html'));
  await page.evaluate(() => document.fonts.load('900 40px Inter'));
  const info = await page.evaluate(([s, r]) => window.setup(s, r), [story, process.env.RATE ? Number(process.env.RATE) : undefined]);
  fs.writeFileSync(path.join(outDir, `${story}.timeline.json`), JSON.stringify(info, null, 1));
  let n = 1, srt = '';
  info.scenes.forEach(sc => sc.chunks.forEach(c => { srt += `${n++}\n${srtTime(c.t0)} --> ${srtTime(c.t1)}\n${c.text}\n\n`; }));
  fs.writeFileSync(path.join(outDir, `${story}.srt`), srt);

  if (flag === '--preview') {
    // one still per scene, mid-scene
    for (let i = 0; i < info.scenes.length; i++) {
      const sc = info.scenes[i];
      await page.evaluate(t => window.renderAt(t), sc.chunks[sc.chunks.length - 1].t0 + 0.2);
      await page.locator('canvas').screenshot({ path: path.join(outDir, `prev_${story}_${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 });
    }
    await browser.close(); return;
  }

  const frames = Math.ceil(info.duration * FPS);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', path.join(outDir, `${story}.silent.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < frames; f++) {
    const b64 = await page.evaluate(t => { window.renderAt(t); return window.frameJpeg(); }, f / FPS);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`${story}: ${f}/${frames}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log(`${story}: done, ${info.duration.toFixed(1)}s`);
})();
