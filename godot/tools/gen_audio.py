#!/usr/bin/env python3
"""Генератор музики й звуків «Хронік Дивосвіту» (Godot-версія).

Порт процедурної музики старої версії (src/js/music.js) у безшовні петлі .ogg і звукові ефекти .wav.
Запуск: python3 godot/tools/gen_audio.py   (потрібні numpy, scipy, ffmpeg)
"""
import os
import sys
import subprocess
import wave

import numpy as np
from scipy.signal import butter, lfilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_M = os.path.join(ROOT, "assets", "audio", "music")
OUT_S = os.path.join(ROOT, "assets", "audio", "sfx")
SR = 32000

SCALE = {
    "major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10], "harm": [0, 2, 3, 5, 7, 8, 11],
    "dorian": [0, 2, 3, 5, 7, 9, 10], "phrygian": [0, 1, 3, 5, 7, 8, 10],
}
TRACKS = {
    "title": dict(bpm=128, key=10, scale="major", prog=[[0, 4, 5, 3], [0, 4, 5, 3], [5, 3, 0, 4], [5, 3, 4, 4]], lead="square", pad="saw", drums="rock", melody=0.85, octave=1, swing=0),
    "field": dict(bpm=98, key=7, scale="major", prog=[[0, 3, 4, 0], [5, 3, 1, 4]], lead="triangle", pad="sine", drums="soft", melody=0.6, octave=1, swing=0.1),
    "forest": dict(bpm=90, key=2, scale="dorian", prog=[[0, 3, 0, 6], [0, 3, 4, 4]], lead="triangle", pad="sine", drums="soft", melody=0.65, octave=1, swing=0.12),
    "desert": dict(bpm=104, key=4, scale="harm", prog=[[0, 1, 0, 1], [0, 6, 5, 4]], lead="square", pad="sine", drums="polka", melody=0.75, octave=1, swing=0.08),
    "winter": dict(bpm=76, key=1, scale="minor", prog=[[0, 5, 2, 6], [0, 3, 4, 4]], lead="sine", pad="triangle", drums="slow", melody=0.5, octave=1, swing=0),
    "town": dict(bpm=118, key=2, scale="major", prog=[[0, 4, 0, 4], [3, 0, 4, 0]], lead="square", pad="triangle", drums="polka", melody=0.8, octave=1, swing=0),
    "tavern": dict(bpm=132, key=9, scale="dorian", prog=[[0, 0, 6, 6], [0, 0, 4, 4]], lead="saw", pad="triangle", drums="polka", melody=0.9, octave=1, swing=0.15),
    "home": dict(bpm=84, key=5, scale="major", prog=[[0, 5, 3, 4], [0, 2, 3, 4]], lead="triangle", pad="sine", drums="soft", melody=0.55, octave=1, swing=0.18),
    "dark": dict(bpm=72, key=9, scale="minor", prog=[[0, 5, 3, 4], [0, 5, 6, 4]], lead="sine", pad="saw", drums="slow", melody=0.35, octave=0, swing=0),
    "battle": dict(bpm=150, key=4, scale="harm", prog=[[0, 5, 6, 4], [0, 3, 6, 4]], lead="saw", pad="square", drums="battle", melody=0.9, octave=1, swing=0),
    "boss": dict(bpm=164, key=2, scale="harm", prog=[[0, 1, 0, 6], [0, 5, 4, 4]], lead="square", pad="saw", drums="battle", melody=1, octave=1, swing=0),
    "sea": dict(bpm=112, key=7, scale="dorian", prog=[[0, 6, 3, 0], [0, 6, 4, 4]], lead="triangle", pad="saw", drums="polka", melody=0.85, octave=1, swing=0.22),
    "demon": dict(bpm=84, key=4, scale="phrygian", prog=[[0, 1, 0, 6], [0, 1, 3, 1]], lead="saw", pad="saw", drums="slow", melody=0.5, octave=0, swing=0),
    # v0.16: варіації настроїв — Audio.music("field") сам обирає field / field2 / field3 у перемішку
    "title2": dict(bpm=140, key=5, scale="major", prog=[[0, 5, 3, 4], [0, 5, 1, 4]], lead="square", pad="saw", drums="rock", melody=0.9, octave=1, swing=0),
    "field2": dict(bpm=108, key=0, scale="major", prog=[[0, 4, 5, 3], [0, 1, 3, 4]], lead="square", pad="triangle", drums="rock", melody=0.7, octave=1, swing=0),
    "field3": dict(bpm=92, key=9, scale="dorian", prog=[[0, 3, 0, 4], [5, 3, 0, 4]], lead="triangle", pad="sine", drums="soft", melody=0.6, octave=1, swing=0.14),
    "forest2": dict(bpm=96, key=7, scale="minor", prog=[[0, 6, 5, 6], [0, 3, 4, 4]], lead="sine", pad="triangle", drums="soft", melody=0.6, octave=1, swing=0.1),
    "desert2": dict(bpm=112, key=2, scale="phrygian", prog=[[0, 1, 0, 6], [0, 1, 4, 4]], lead="square", pad="sine", drums="polka", melody=0.8, octave=1, swing=0.05),
    "winter2": dict(bpm=70, key=6, scale="major", prog=[[0, 4, 5, 3], [0, 3, 4, 4]], lead="triangle", pad="sine", drums="slow", melody=0.45, octave=1, swing=0),
    "town2": dict(bpm=124, key=7, scale="major", prog=[[0, 3, 4, 0], [5, 1, 4, 0]], lead="triangle", pad="square", drums="polka", melody=0.85, octave=1, swing=0.05),
    "tavern2": dict(bpm=144, key=2, scale="minor", prog=[[0, 6, 5, 4], [0, 6, 5, 4]], lead="square", pad="triangle", drums="polka", melody=0.95, octave=1, swing=0.2),
    "home2": dict(bpm=78, key=10, scale="major", prog=[[0, 3, 0, 4], [5, 3, 4, 0]], lead="sine", pad="triangle", drums="soft", melody=0.5, octave=1, swing=0.12),
    "sea2": dict(bpm=120, key=0, scale="minor", prog=[[0, 5, 6, 0], [0, 3, 4, 4]], lead="square", pad="saw", drums="polka", melody=0.85, octave=1, swing=0.18),
    "dark2": dict(bpm=66, key=1, scale="harm", prog=[[0, 5, 0, 4], [0, 1, 0, 4]], lead="triangle", pad="saw", drums="slow", melody=0.35, octave=0, swing=0),
    "battle2": dict(bpm=158, key=9, scale="minor", prog=[[0, 5, 3, 4], [0, 6, 3, 4]], lead="square", pad="saw", drums="battle", melody=0.95, octave=1, swing=0),
    "boss2": dict(bpm=172, key=11, scale="phrygian", prog=[[0, 1, 0, 1], [0, 5, 6, 4]], lead="saw", pad="square", drums="battle", melody=1, octave=1, swing=0),
}
DRUMS = {
    "rock": dict(k="x...x...x...x...", s="....x.......x...", h="x.x.x.x.x.x.x.x."),
    "soft": dict(k="x.......x.......", s="........x.......", h="..x...x...x...x."),
    "polka": dict(k="x...x...x...x...", s="..x...x...x...x.", h="................"),
    "slow": dict(k="x...............", s="........x.......", h="....x.......x..."),
    "battle": dict(k="x..x..x.x..x..x.", s="....x.......x..x", h="xxxxxxxxxxxxxxxx"),
}


def N(semi):
    return 261.63 * 2 ** (semi / 12)


class Rand:
    def __init__(self, seed):
        self.s = seed

    def __call__(self):
        self.s = (self.s * 16807) % 2147483647
        return (self.s - 1) / 2147483646


def osc(kind, freq, n, vibrato=False):
    t = np.arange(n) / SR
    if vibrato:
        ph = 2 * np.pi * np.cumsum(freq * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t * 4, 0, 1))) / SR
    else:
        ph = 2 * np.pi * freq * t
    if kind == "sine":
        return np.sin(ph)
    if kind == "triangle":
        return 2 / np.pi * np.arcsin(np.sin(ph))
    if kind == "square":
        return np.tanh(np.sin(ph) * 6) * 0.8
    x = (ph / (2 * np.pi)) % 1.0  # saw
    return (2 * x - 1) * 0.8


def lowpass(x, cutoff):
    b, a = butter(2, min(0.99, cutoff / (SR / 2)))
    return lfilter(b, a, x)


def env(n, attack, rel_n):
    e = np.ones(n)
    an = max(1, int(attack * SR))
    e[:an] = np.linspace(0, 1, an)
    if rel_n > 0:
        e[-rel_n:] *= np.exp(-np.linspace(0, 6, rel_n))
    return e


def add(buf, start, sig, pan=0.0):
    i = int(start * SR)
    n = len(sig)
    L = len(buf)
    idx = (np.arange(n) + i) % L  # петля: хвости загортаються на початок
    np.add.at(buf[:, 0], idx, sig * (1 - pan) * 0.5 * 2 ** 0.5)
    np.add.at(buf[:, 1], idx, sig * (1 + pan) * 0.5 * 2 ** 0.5)


def voice(buf, freq, t, dur, kind, vol, cutoff=None, attack=0.01, release=0.08, vibrato=False, pan=0.0):
    rel_n = int(release * SR * 3)
    n = int(dur * SR) + rel_n
    s = osc(kind, freq, n, vibrato)
    if cutoff:
        s = lowpass(s, cutoff)
    add(buf, t, s * env(n, attack, rel_n) * vol, pan)


_noise = np.random.default_rng(7).uniform(-1, 1, SR * 2)


def noise(buf, t, dur, vol, ftype, freq, pan=0.0):
    n = int(dur * SR)
    x = _noise[:n].copy()
    if ftype == "bandpass":
        b, a = butter(2, [max(0.01, freq * 0.6 / (SR / 2)), min(0.99, freq * 1.5 / (SR / 2))], "band")
    else:
        b, a = butter(2, min(0.99, freq / (SR / 2)), "high")
    x = lfilter(b, a, x) * np.exp(-np.linspace(0, 7, n)) * vol
    add(buf, t, x, pan)


def kick(buf, t):
    n = int(0.2 * SR)
    tt = np.arange(n) / SR
    f = 42 + (140 - 42) * np.exp(-tt / 0.04)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.05) * 0.55
    add(buf, t, s)


def compose(T, rnd):
    motif = [(int(rnd() * 5) - 1) if rnd() < T["melody"] * (1 if i % 4 == 0 else 0.6) else None for i in range(16)]
    rhythm = [2 if rnd() < 0.25 else 1 for _ in motif]
    return motif, rhythm


def render_track(name, T, bars=16):
    spb = 60 / T["bpm"] / 4
    steps = bars * 16
    L = int(round(steps * spb * SR))
    buf = np.zeros((L, 2))
    rnd = Rand(1 + list(TRACKS).index(name) * 977)
    themes = [compose(T, rnd), compose(T, rnd)]
    sc = SCALE[T["scale"]]
    D = DRUMS[T["drums"]]
    k = T["key"]
    for step in range(steps):
        bar, s16 = divmod(step, 16)
        sec = T["prog"][(bar // 4) % len(T["prog"])]
        deg = sec[bar % 4]
        root = k + sc[deg % 7] + (12 if deg >= 7 else 0)
        t = step * spb + (T["swing"] * spb if s16 % 2 else 0)
        motif, rhythm = themes[(bar // 8) % 2]
        if s16 == 0:
            for i, d in enumerate((0, 2, 4)):
                semi = k + sc[(deg + d) % 7] + (deg + d) // 7 * 12 - 12
                voice(buf, N(semi), t, spb * 15, T["pad"], 0.035, cutoff=1400, attack=0.08, release=0.3, pan=(-0.4, 0, 0.4)[i])
        bass = [0, 8] if T["drums"] == "polka" else [0, 3, 6, 8, 11, 14] if T["drums"] == "battle" else [0, 6, 8, 12]
        if s16 in bass:
            off = 7 if T["drums"] == "polka" and s16 == 8 else 0
            voice(buf, N(root - 24 + off), t, spb * (1.6 if T["drums"] == "battle" else 3), "saw" if T["drums"] == "battle" else "triangle", 0.13, cutoff=700)
        if T["drums"] == "polka" and s16 % 4 == 2:
            for d in (2, 4):
                voice(buf, N(k + sc[(deg + d) % 7] + (deg + d) // 7 * 12), t, spb * 1.2, "square", 0.025, cutoff=2200, pan=0.3)
        if T["drums"] in ("rock", "soft") and s16 % 2 == 0:
            d = [0, 2, 4, 2][(s16 // 2) % 4]
            voice(buf, N(k + sc[(deg + d) % 7] + (deg + d) // 7 * 12 + 12), t, spb * 1.5, "triangle", 0.028, cutoff=3000, pan=0.35)
        m = motif[s16]
        if m is not None and not (bar % 8 == 7 and s16 > 8):
            vary = 1 if bar % 2 == 1 and s16 >= 8 else 0
            d2 = deg + [0, 2, 4, 5, 7][(m + vary) % 5]
            semi = k + sc[d2 % 7] + d2 // 7 * 12 + 12 * T["octave"]
            voice(buf, N(semi), t, spb * (rhythm[s16] + 0.2), T["lead"], 0.07 if T["lead"] == "sine" else 0.045,
                  cutoff=2600 if T["lead"] == "saw" else 4200, attack=0.015, release=0.1, vibrato=True, pan=-0.15)
        if D["k"][s16] == "x":
            kick(buf, t)
        if D["s"][s16] == "x":
            noise(buf, t, 0.14, 0.22, "bandpass", 1800)
        if D["h"][s16] == "x":
            noise(buf, t, 0.04, 0.05, "highpass", 7000, pan=0.25)
        if bar % 4 == 3 and s16 >= 12 and T["drums"] != "slow":
            noise(buf, t, 0.08, 0.12, "bandpass", 1200 + s16 * 120)
    # кімнатне відлуння (теж по колу, щоб петля була безшовною)
    for delay, g in ((0.23, 0.22), (0.37, 0.15), (0.61, 0.08)):
        dn = int(delay * SR)
        buf += np.roll(buf, dn, axis=0)[:, ::-1] * g
    buf = np.tanh(buf / max(1e-6, np.abs(buf).max()) * 1.3) * 0.72
    return buf


def write_wav(path, data):
    data = np.atleast_2d(data.T).T if data.ndim == 1 else data
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(pcm.shape[1] if pcm.ndim == 2 else 1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ---------------------------------------------------------------- звукові ефекти

def tt(d):
    return np.arange(int(d * SR)) / SR


def sweep(f0, f1, d, kind="sine", curve=1.0):
    t = tt(d)
    f = f0 + (f1 - f0) * (t / d) ** curve
    ph = 2 * np.pi * np.cumsum(f) / SR
    return {"sine": np.sin(ph), "square": np.tanh(np.sin(ph) * 5) * 0.8, "triangle": 2 / np.pi * np.arcsin(np.sin(ph)),
            "saw": ((ph / (2 * np.pi)) % 1 * 2 - 1) * 0.8}[kind]


def dec(d, k=6.0):
    return np.exp(-np.linspace(0, k, int(d * SR)))


def nz(d, lo=None, hi=None, seed=1):
    x = np.random.default_rng(seed).uniform(-1, 1, int(d * SR))
    if lo and hi:
        b, a = butter(2, [lo / (SR / 2), min(0.99, hi / (SR / 2))], "band")
        x = lfilter(b, a, x)
    elif hi:
        b, a = butter(2, hi / (SR / 2))
        x = lfilter(b, a, x)
    elif lo:
        b, a = butter(2, lo / (SR / 2), "high")
        x = lfilter(b, a, x)
    return x


def cat(*parts, gap=0.0):
    out = []
    for p in parts:
        out.append(p)
        if gap:
            out.append(np.zeros(int(gap * SR)))
    return np.concatenate(out)


def mix(*parts):
    n = max(len(p) for p in parts)
    out = np.zeros(n)
    for p in parts:
        out[:len(p)] += p
    return out


def tone(f, d, kind="square", k=5.0, a=0.005):
    s = sweep(f, f, d, kind) * dec(d, k)
    an = int(a * SR)
    s[:an] *= np.linspace(0, 1, an)
    return s


def sfx():
    S = {}
    # фузи: свист, удар
    w = nz(0.18, 600, 4000, 2)
    S["swing"] = w * np.sin(np.linspace(0, np.pi, len(w))) ** 2 * 0.8
    S["dash"] = nz(0.22, 1500, 7000, 3) * np.sin(np.linspace(0, np.pi, int(0.22 * SR))) ** 3 * 0.7
    S["hit"] = mix(sweep(180, 60, 0.12) * dec(0.12, 5) * 0.9, nz(0.05, 1000, 5000, 4) * dec(0.05, 8) * 0.6)
    S["crit"] = mix(S["hit"], tone(1568, 0.35, "sine", 7) * 0.35, tone(2093, 0.3, "sine", 8) * 0.25)
    S["hurt"] = mix(sweep(330, 140, 0.22, "square") * dec(0.22, 4) * 0.45, nz(0.08, 300, 2000, 5) * dec(0.08, 6) * 0.4)
    S["kill"] = mix(sweep(600, 120, 0.25, "square") * dec(0.25, 4) * 0.35,
                    cat(np.zeros(int(0.08 * SR)), tone(1760, 0.12, "sine", 6) * 0.3, tone(2637, 0.18, "sine", 6) * 0.25))
    S["coin"] = cat(tone(988, 0.07, "square", 3) * 0.4, tone(1319, 0.25, "square", 6) * 0.4)
    S["levelup"] = cat(*[tone(N(s + 12), 0.11, "square", 3) * 0.35 for s in (0, 4, 7)], tone(N(24), 0.55, "square", 4) * 0.4)
    S["quest"] = cat(tone(N(7), 0.14, "triangle", 2) * 0.5, tone(N(12), 0.14, "triangle", 2) * 0.5, tone(N(16), 0.5, "triangle", 3) * 0.55)
    S["click"] = tone(1800, 0.035, "sine", 8) * 0.35
    S["open"] = mix(sweep(700, 1200, 0.16, "sine") * dec(0.16, 4) * 0.25, tone(1500, 0.2, "sine", 6) * 0.12)
    S["error"] = cat(tone(220, 0.1, "square", 2) * 0.3, tone(185, 0.18, "square", 3) * 0.3, gap=0.03)
    S["door"] = mix(tone(110, 0.18, "triangle", 8) * 0.7, nz(0.12, 200, 900, 6) * dec(0.12, 7) * 0.5,
                    cat(np.zeros(int(0.12 * SR)), tone(95, 0.15, "triangle", 8) * 0.6))
    creak = sweep(300, 520, 0.3, "saw") * dec(0.3, 3) * 0.15
    S["chest"] = cat(lowpass(creak, 1500), mix(*[cat(np.zeros(int(i * 0.06 * SR)), tone(N(19 + s), 0.2, "sine", 6) * 0.25) for i, s in enumerate((0, 4, 7, 12))]))
    S["mine"] = mix(*[tone(f, 0.3, "sine", 9) * a for f, a in ((1830, 0.4), (2950, 0.25), (4210, 0.15))], nz(0.03, 2000, 9000, 8) * 0.5)
    glug = [sweep(250 + i * 60, 520 + i * 80, 0.08) * dec(0.08, 3) * 0.35 for i in range(4)]
    S["potion"] = cat(*glug, gap=0.03)
    sp = mix(*[cat(np.zeros(int(i * 0.05 * SR)), tone(N(24 + s), 0.25, "sine", 5) * 0.18) for i, s in enumerate((0, 7, 12, 16, 19))])
    S["magic"] = mix(sp, nz(0.4, 3000, 9000, 9) * dec(0.4, 4) * 0.12)
    wave_ = nz(1.4, None, 900, 10)
    S["sail"] = mix(wave_ * np.sin(np.linspace(0, np.pi, len(wave_))) ** 1.5 * 0.8,
                    cat(np.zeros(int(0.5 * SR)), tone(N(7), 0.6, "triangle", 3) * 0.25))
    S["roar"] = mix(lowpass(sweep(90, 55, 1.0, "saw") * (1 + 0.5 * np.sin(2 * np.pi * 23 * tt(1.0))), 600) * dec(1.0, 3) * 0.8,
                    nz(1.0, 100, 600, 11) * dec(1.0, 3) * 0.5)
    S["stairs"] = cat(*[tone(N(s), 0.1, "triangle", 4) * 0.4 for s in (12, 7, 4, 0)])
    S["buy"] = mix(S["coin"], cat(np.zeros(int(0.05 * SR)), tone(1568, 0.2, "sine", 6) * 0.2))
    S["horse"] = cat(*[mix(tone(140, 0.06, "triangle", 9) * 0.6, nz(0.03, 800, 3000, 12 + i) * 0.4) for i in range(4)], gap=0.07)
    # v0.16: клаксон вантажівки-куна і дзвіночок богині
    S["horn"] = cat(mix(tone(370, 0.32, "saw", 1.5) * 0.35, tone(466, 0.32, "saw", 1.5) * 0.3),
                    mix(tone(370, 0.55, "saw", 2.5) * 0.35, tone(466, 0.55, "saw", 2.5) * 0.3), gap=0.06)
    S["goddess"] = mix(*[cat(np.zeros(int(i * 0.07 * SR)), tone(N(24 + s), 0.6, "sine", 4) * 0.2) for i, s in enumerate((0, 4, 7, 11, 14, 19))],
                       nz(0.9, 4000, 10000, 13) * dec(0.9, 3) * 0.08)
    # голос-«бурмотіння» для діалогів (висоту змінює Voice.blip)
    S["blip"] = mix(tone(620, 0.05, "square", 7) * 0.35, tone(1240, 0.04, "triangle", 9) * 0.15)
    return S


def main():
    os.makedirs(OUT_M, exist_ok=True)
    os.makedirs(OUT_S, exist_ok=True)
    only = sys.argv[1:]  # напр. gen_audio.py field2 town2 — лише ці треки, без звуків; «sfx» — лише звуки
    if only == ["sfx"]:
        TRACKS.clear()
    for name, T in TRACKS.items():
        if only and name not in only:
            continue
        buf = render_track(name, T)
        tmp = "/tmp/_dyvo_%s.wav" % name
        write_wav(tmp, buf)
        dst = os.path.join(OUT_M, name + ".ogg")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-c:a", "libvorbis", "-q:a", "3", dst], check=True)
        os.remove(tmp)
        print("music", name, "%.1f с" % (len(buf) / SR), os.path.getsize(dst) // 1024, "КБ")
    if only and only != ["sfx"]:
        return
    for name, s in sfx().items():
        s = s / max(1e-6, np.abs(s).max()) * 0.9
        fade = min(len(s), int(0.01 * SR))
        s[-fade:] *= np.linspace(1, 0, fade)
        write_wav(os.path.join(OUT_S, name + ".wav"), s)
    print("sfx", len(sfx()))


if __name__ == "__main__":
    main()
