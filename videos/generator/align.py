"""Align scenes to a real voice-over.
Usage: python3 align.py <voice.mp3> <timeline.json> <out_durations.json>
Finds pauses in the voice with ffmpeg silencedetect, then snaps each scene
boundary (estimated from text length) to the nearest pause."""
import json, re, subprocess, sys
voice, tlp, out = sys.argv[1:4]
tl = json.load(open(tlp))
texts = [s['text'] for s in tl['scenes']]
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',voice],capture_output=True,text=True).stdout)
log = subprocess.run(['ffmpeg','-i',voice,'-af','silencedetect=noise=-35dB:d=0.18','-f','null','-'],capture_output=True,text=True).stderr
starts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',log)]
ends=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',log)]
pauses=[(a+b)/2 for a,b in zip(starts,ends) if b-a>0.18]
lead = ends[0] if starts and starts[0] < 0.05 else 0.0
w=[len(t)+ (8 if t.rstrip()[-1] in '.!?:' else 3) for t in texts]
tot=sum(w); cum=0; bounds=[]
for x in w[:-1]:
    cum+=x; est=lead+(dur-lead)*cum/tot
    prev = bounds[-1] if bounds else 0
    cand=[p for p in pauses if p>prev+0.4]
    bounds.append(min(cand,key=lambda p:abs(p-est)) if cand else est)
edges=[0.0]+bounds+[dur+0.3]
d=[round(edges[i+1]-edges[i],3) for i in range(len(texts))]
json.dump(d,open(out,'w'))
print(f"voice {dur:.1f}s, {len(pauses)} pauses, scenes {len(d)}")
for i,(t,x) in enumerate(zip(texts,d),1): print(f"{i:02d} {edges[i-1]:6.2f} {x:5.2f}  {t[:60]}")
