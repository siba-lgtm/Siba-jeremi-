"""Synthesises a light, royalty-free background track + whoosh SFX on scene cuts.
Usage: python3 music.py <timeline.json> <out.wav>
"""
import json, sys, wave
import numpy as np

SR = 44100
tl = json.load(open(sys.argv[1]))
dur = tl["duration"]
n = int(SR * dur)
out = np.zeros(n)
rng = np.random.default_rng(7)

def note(f, length, amp=0.2, decay=4.0):
    t = np.arange(int(SR * length)) / SR
    env = np.exp(-decay * t) * np.minimum(1, t * 400)
    w = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) + 0.18 * np.sin(6 * np.pi * f * t)
    return amp * env * w

def add(sig, at):
    i = int(at * SR)
    if i >= n: return
    j = min(n, i + len(sig))
    out[i:j] += sig[: j - i]

midi = lambda m: 440 * 2 ** ((m - 69) / 12)
bpm = 112; beat = 60 / bpm
# C - Am - F - G, ukulele-ish strum pattern + bass + soft shaker
chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]]
bass = [36, 33, 29, 31]
pattern = [0, 1, 1.5, 2.5, 3]  # strum positions within a bar (beats)
bar = 4 * beat
b = 0
while b * bar < dur:
    ch = chords[b % 4]
    for k, pos in enumerate(pattern):
        t0 = b * bar + pos * beat
        for i, m in enumerate(ch):
            add(note(midi(m), 0.9, 0.05 if k else 0.065, 5.0), t0 + i * 0.012)
    add(note(midi(bass[b % 4]), 1.6, 0.16, 2.0), b * bar)
    add(note(midi(bass[b % 4] + 7), 0.8, 0.10, 3.0), b * bar + 2 * beat)
    # melody bell on off-bars
    if b % 2 == 1:
        mel = [ch[3] + 12, ch[2] + 12, ch[3] + 12, ch[1] + 12]
        for i, m in enumerate(mel):
            add(note(midi(m), 0.5, 0.035, 6.0), b * bar + i * beat + 0.5 * beat)
    # shaker on 8ths
    for i in range(8):
        sh = rng.standard_normal(int(0.05 * SR)) * np.exp(-np.linspace(0, 8, int(0.05 * SR)))
        sh = np.diff(sh, prepend=0)  # high-pass-ish
        add(sh * (0.025 if i % 2 else 0.012), b * bar + i * beat / 2)
    b += 1

# whoosh at every scene cut
for sc in tl["scenes"][1:]:
    L = int(0.32 * SR)
    noise = rng.standard_normal(L)
    # simple moving filter that opens over time
    env = np.sin(np.linspace(0, np.pi, L)) ** 2
    k = 12
    smooth = np.convolve(noise, np.ones(k) / k, mode="same")
    add((smooth * 0.6 + np.diff(noise, prepend=0) * 0.08) * env * 0.35, sc["t0"] - 0.12)

# fade in / out, normalise
fade = int(1.2 * SR)
out[:int(0.05 * SR)] *= np.linspace(0, 1, int(0.05 * SR))
out[-fade:] *= np.linspace(1, 0, fade)
out = out / np.max(np.abs(out)) * 0.8
pcm = (out * 32767).astype(np.int16)
stereo = np.repeat(pcm[:, None], 2, axis=1)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(stereo.tobytes())
