// World map renderer: pre-rendered terrain + political layers, camera, labels, armies, player.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const S = 8; // pixels per cell in base layer

  const TCOL = {
    0: [22, 52, 92], 1: [36, 86, 140], 2: [214, 200, 150], 3: [128, 170, 88], 4: [62, 118, 62], 5: [150, 150, 96],
    6: [128, 118, 108], 7: [235, 238, 245], 8: [222, 190, 120], 9: [172, 186, 178], 10: [86, 104, 72], 11: [74, 38, 40], 12: [40, 102, 60],
  };

  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function shade(rgb, f) { return rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * f)))); }

  const R = {
    canvas: null, ctx: null, G: null, base: null, layers: {}, mode: 'terrain',
    cam: { x: 0, y: 0, z: 1 }, selected: null, hover: null, route: null, travel: null, t: 0, dpr: 1,
  };

  function init(canvas, G) {
    R.canvas = canvas; R.ctx = canvas.getContext('2d'); R.G = G;
    R.layers = {};
    buildBase();
    resize();
    centerOn(G.player.location, 1.6);
  }

  function resize() {
    const dpr = window.devicePixelRatio || 1; R.dpr = dpr;
    R.canvas.width = Math.floor(R.canvas.clientWidth * dpr);
    R.canvas.height = Math.floor(R.canvas.clientHeight * dpr);
  }

  function buildBase() {
    const w = R.G.world; const { W, H } = ISK.world;
    const SEA = 0.42;
    // 1) per-cell colour canvas, upscaled with smoothing → soft biome transitions
    const small = document.createElement('canvas'); small.width = W; small.height = H;
    const sg = small.getContext('2d'); const sd = sg.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const t = w.terrain[i];
      const col = t <= 1 ? TCOL[2] : TCOL[t];
      sd.data[i * 4] = col[0]; sd.data[i * 4 + 1] = col[1]; sd.data[i * 4 + 2] = col[2]; sd.data[i * 4 + 3] = 255;
    }
    sg.putImageData(sd, 0, 0);
    const big = document.createElement('canvas'); big.width = W * S; big.height = H * S;
    const bgx = big.getContext('2d'); bgx.imageSmoothingEnabled = true; bgx.imageSmoothingQuality = 'high';
    bgx.drawImage(small, 0, 0, W * S, H * S);
    const bd = bgx.getImageData(0, 0, W * S, H * S).data;
    // 2) per-pixel bilinear height → crisp smooth coastlines + smooth hillshade
    const hgt = w.height;
    const hb = (fx, fy) => {
      fx = Math.max(0, Math.min(W - 1.001, fx)); fy = Math.max(0, Math.min(H - 1.001, fy));
      const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
      const a = hgt[y0 * W + x0], b = hgt[y0 * W + x0 + 1], c = hgt[(y0 + 1) * W + x0], d = hgt[(y0 + 1) * W + x0 + 1];
      return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
    };
    const c2 = document.createElement('canvas'); c2.width = W * S; c2.height = H * S;
    const g2 = c2.getContext('2d');
    const img = g2.createImageData(W * S, H * S); const data = img.data;
    const PW = W * S, PH = H * S;
    for (let py = 0; py < PH; py++) {
      const fy = py / S - 0.5;
      for (let px = 0; px < PW; px++) {
        const fx = px / S - 0.5;
        const hh = hb(fx, fy);
        const k = (py * PW + px) * 4;
        const n = ISK.noise.hash2(px, py, 3) * 0.08 + 0.96;
        let r, g, b;
        if (hh < SEA) {
          const depth = Math.min(1, (SEA - hh) / 0.16);
          const wave = Math.sin(px * 0.05 + py * 0.11 + ISK.noise.valueNoise(px / 40, py / 40, 5) * 6) * 0.03;
          r = 70 + (20 - 70) * depth; g = 150 + (58 - 150) * depth; b = 196 + (108 - 196) * depth;
          const f = 1 + wave; r *= f; g *= f; b *= f;
          if (SEA - hh < 0.006) { r = r * 0.5 + 120; g = g * 0.5 + 125; b = b * 0.5 + 125; }
        } else {
          r = bd[k]; g = bd[k + 1]; b = bd[k + 2];
          if (hh < SEA + 0.012) { const f = (hh - SEA) / 0.012; r = 222 + (r - 222) * f; g = 206 + (g - 206) * f; b = 158 + (b - 158) * f; }
          if (hh > 0.79) { const f = Math.min(1, (hh - 0.79) / 0.04); r += (240 - r) * f; g += (243 - g) * f; b += (250 - b) * f; }
          const dx = hb(fx + 0.5, fy) - hb(fx - 0.5, fy), dy = hb(fx, fy + 0.5) - hb(fx, fy - 0.5);
          const light = Math.max(0.68, Math.min(1.32, 1 + (-dx - dy) * 3.4));
          r *= light; g *= light; b *= light;
        }
        data[k] = Math.min(255, r * n); data[k + 1] = Math.min(255, g * n); data[k + 2] = Math.min(255, b * n); data[k + 3] = 255;
      }
    }
    g2.putImageData(img, 0, 0);
    // glyphs
    const rnd = (a, b) => ISK.noise.hash2(a, b, 77);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = w.terrain[i];
      const cx = x * S + S / 2, cy = y * S + S / 2;
      if ((t === 4 || t === 12) && rnd(x, y) < 0.55) {
        g2.fillStyle = t === 12 ? 'rgba(20,70,35,0.85)' : 'rgba(28,72,34,0.8)';
        g2.beginPath(); g2.moveTo(cx, cy - 5); g2.lineTo(cx + 4, cy + 3); g2.lineTo(cx - 4, cy + 3); g2.closePath(); g2.fill();
        g2.fillStyle = 'rgba(60,40,20,0.7)'; g2.fillRect(cx - 0.6, cy + 3, 1.2, 2);
      } else if ((t === 6 || t === 7) && rnd(x, y) < 0.4) {
        g2.fillStyle = t === 7 ? 'rgba(255,255,255,0.9)' : 'rgba(90,80,74,0.9)';
        g2.beginPath(); g2.moveTo(cx, cy - 7); g2.lineTo(cx + 7, cy + 5); g2.lineTo(cx - 7, cy + 5); g2.closePath(); g2.fill();
        g2.fillStyle = 'rgba(255,255,255,0.75)';
        g2.beginPath(); g2.moveTo(cx, cy - 7); g2.lineTo(cx + 2.5, cy - 2.5); g2.lineTo(cx - 2.5, cy - 2.5); g2.closePath(); g2.fill();
      } else if (t === 5 && rnd(x, y) < 0.25) {
        g2.strokeStyle = 'rgba(90,85,50,0.7)'; g2.lineWidth = 1.3;
        g2.beginPath(); g2.arc(cx, cy + 3, 4.5, Math.PI * 1.1, Math.PI * 1.9); g2.stroke();
      } else if (t === 8 && rnd(x, y) < 0.18) {
        g2.strokeStyle = 'rgba(170,130,70,0.6)'; g2.lineWidth = 1;
        g2.beginPath(); g2.moveTo(cx - 4, cy); g2.quadraticCurveTo(cx, cy - 3, cx + 4, cy); g2.stroke();
      } else if (t === 10 && rnd(x, y) < 0.3) {
        g2.strokeStyle = 'rgba(60,90,70,0.8)'; g2.lineWidth = 1;
        g2.beginPath(); g2.moveTo(cx - 3, cy + 2); g2.lineTo(cx + 3, cy + 2); g2.moveTo(cx - 1, cy); g2.lineTo(cx, cy - 3); g2.stroke();
      } else if (t === 11 && rnd(x, y) < 0.22) {
        g2.fillStyle = 'rgba(255,90,40,0.55)'; g2.beginPath(); g2.arc(cx, cy, 1.8, 0, 7); g2.fill();
      }
    }
    // rivers
    g2.strokeStyle = 'rgba(70,140,210,0.9)'; g2.lineCap = 'round'; g2.lineWidth = 2.2;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!w.river[i]) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const j = (y + dy) * W + (x + dx);
        if (w.river[j] || (w.terrain[j] < 2)) { g2.beginPath(); g2.moveTo(x * S + S / 2, y * S + S / 2); g2.lineTo((x + dx) * S + S / 2, (y + dy) * S + S / 2); g2.stroke(); }
      }
    }
    // roads
    const drawPath = (path, width, color, dash) => {
      g2.beginPath();
      path.forEach((cell, k) => { const px = (cell % W) * S + S / 2, py = ((cell / W) | 0) * S + S / 2; k ? g2.lineTo(px, py) : g2.moveTo(px, py); });
      g2.setLineDash(dash || []); g2.lineWidth = width; g2.strokeStyle = color; g2.lineJoin = 'round'; g2.stroke(); g2.setLineDash([]);
    };
    for (const t of w.trails) drawPath(t.path, 1.4, 'rgba(70,45,25,0.75)', [2, 4]);
    for (const r of w.roads) drawPath(r.path, r.major ? 4.2 : 2.8, 'rgba(40,25,12,0.55)');
    for (const r of w.roads) drawPath(r.path, r.major ? 2.4 : 1.5, r.major ? 'rgba(236,206,150,0.95)' : 'rgba(205,170,120,0.85)', r.major ? null : [5, 3]);
    // ash glow
    const wst = w.wastes; const grd = g2.createRadialGradient(wst.x * S, wst.y * S, 0, wst.x * S, wst.y * S, wst.r * S * 1.2);
    grd.addColorStop(0, 'rgba(255,60,30,0.25)'); grd.addColorStop(1, 'rgba(255,60,30,0)');
    g2.fillStyle = grd; g2.fillRect(0, 0, c2.width, c2.height);
    R.base = c2;
  }

  function buildLayer(mode) {
    const w = R.G.world; const { W, H } = ISK.world;
    const c = document.createElement('canvas'); c.width = W * S; c.height = H * S;
    const g = c.getContext('2d');
    const img = g.createImageData(W, H); const d = img.data;
    const colorOf = (b) => {
      const B = w.baronies[b];
      if (mode === 'political') { if (B.owner < 0) return null; return hexToRgb(w.realms[B.owner].color); }
      if (mode === 'dejure') {
        const base = hexToRgb(w.realms[B.realm].color);
        const f = 0.65 + ((B.duchy * 37) % 7) * 0.09;
        return shade(base, f);
      }
      if (mode === 'danger') { const t = Math.min(1, B.danger / 24); return [Math.round(60 + 195 * t), Math.round(220 - 170 * t), 70]; }
      return null;
    };
    const cache = {};
    for (let i = 0; i < W * H; i++) {
      const b = w.cellBarony[i];
      if (b < 0) continue;
      const col = cache[b] || (cache[b] = colorOf(b));
      if (!col) continue;
      let alpha = 135;
      const B = w.baronies[b];
      if (mode === 'political' && B.occ >= 0) {
        const x = i % W, y = (i / W) | 0;
        if ((x + y) % 3 === 0) { const oc = hexToRgb(w.realms[B.occ].color); d[i * 4] = oc[0]; d[i * 4 + 1] = oc[1]; d[i * 4 + 2] = oc[2]; d[i * 4 + 3] = 200; continue; }
      }
      d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = alpha;
    }
    const small = document.createElement('canvas'); small.width = W; small.height = H;
    small.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(small, 0, 0, W * S, H * S);
    // borders
    const keyOf = (b, lvl) => {
      const B = w.baronies[b];
      if (lvl === 'realm') return mode === 'dejure' ? B.realm : B.owner;
      if (lvl === 'duchy') return B.duchy;
      if (lvl === 'county') return B.county;
      return b;
    };
    const drawBorders = (lvl, width, color) => {
      g.strokeStyle = color; g.lineWidth = width; g.beginPath();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, b = w.cellBarony[i]; if (b < 0) continue;
        const k = keyOf(b, lvl);
        if (x + 1 < W) { const b2 = w.cellBarony[i + 1]; if (b2 >= 0 && keyOf(b2, lvl) !== k) { g.moveTo((x + 1) * S, y * S); g.lineTo((x + 1) * S, (y + 1) * S); } }
        if (y + 1 < H) { const b2 = w.cellBarony[i + W]; if (b2 >= 0 && keyOf(b2, lvl) !== k) { g.moveTo(x * S, (y + 1) * S); g.lineTo((x + 1) * S, (y + 1) * S); } }
      }
      g.stroke();
    };
    if (mode === 'political' || mode === 'dejure') {
      drawBorders('barony', 0.6, 'rgba(0,0,0,0.18)');
      drawBorders('county', 1, 'rgba(255,255,255,0.28)');
      if (mode === 'dejure') drawBorders('duchy', 1.8, 'rgba(255,255,255,0.55)');
      drawBorders('realm', 3.2, 'rgba(15,10,20,0.85)');
    } else if (mode === 'danger') drawBorders('barony', 0.6, 'rgba(0,0,0,0.25)');
    R.layers[mode] = c;
  }

  function invalidatePolitical() { delete R.layers.political; }

  function worldToScreen(x, y) { return [(x - R.cam.x) * R.cam.z * R.dpr, (y - R.cam.y) * R.cam.z * R.dpr]; }
  function screenToWorld(sx, sy) { return [sx / R.cam.z + R.cam.x, sy / R.cam.z + R.cam.y]; }

  function centerOn(node, zoom) {
    const p = ISK.world.nodeXY(R.G.world, node);
    if (zoom) R.cam.z = zoom;
    const vw = R.canvas.clientWidth / R.cam.z, vh = R.canvas.clientHeight / R.cam.z;
    R.cam.x = p.x * S + S / 2 - vw / 2; R.cam.y = p.y * S + S / 2 - vh / 2;
    clampCam();
  }
  function clampCam() {
    const { W, H } = ISK.world;
    const vw = R.canvas.clientWidth / R.cam.z, vh = R.canvas.clientHeight / R.cam.z;
    R.cam.x = Math.max(-vw * 0.3, Math.min(W * S - vw * 0.7, R.cam.x));
    R.cam.y = Math.max(-vh * 0.3, Math.min(H * S - vh * 0.7, R.cam.y));
  }

  function realmLabelPositions() {
    const w = R.G.world; const out = [];
    for (const realm of w.realms) {
      const st = R.G.P.realms[realm.id]; if (st.dead) continue;
      let sx = 0, sy = 0, n = 0;
      for (const B of w.baronies) if (B.owner === realm.id) { sx += B.x; sy += B.y; n++; }
      if (!n) continue;
      out.push({ realm, x: (sx / n) * S, y: (sy / n) * S, n });
    }
    return out;
  }

  let labelCache = null, labelCacheT = 0;

  function draw() {
    const g = R.ctx, G = R.G, w = G.world;
    if (!g || !R.base) return;
    R.t += 1;
    if (w._ownerDirty) { invalidatePolitical(); w._ownerDirty = false; labelCache = null; }
    const z = R.cam.z * R.dpr;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#143a6c'; g.fillRect(0, 0, R.canvas.width, R.canvas.height);
    g.setTransform(z, 0, 0, z, -R.cam.x * z, -R.cam.y * z);
    g.imageSmoothingEnabled = true;
    g.drawImage(R.base, 0, 0);
    if (R.mode !== 'terrain') {
      if (!R.layers[R.mode]) buildLayer(R.mode);
      g.drawImage(R.layers[R.mode], 0, 0);
    }
    const inv = 1 / R.cam.z;
    // route preview
    const route = R.travel ? R.travel.route : R.route;
    if (route && route.legs.length) {
      g.save();
      g.lineWidth = 3.2 * inv + 1.2; g.strokeStyle = 'rgba(255,126,182,0.9)'; g.setLineDash([8 * inv + 2, 6 * inv + 2]);
      g.lineDashOffset = -R.t * 0.6;
      g.beginPath();
      let first = true;
      route.legs.forEach((leg, li) => {
        if (R.travel && li < R.travel.leg) return;
        leg.path.forEach((cell, k) => {
          const px = (cell % ISK.world.W) * S + S / 2, py = ((cell / ISK.world.W) | 0) * S + S / 2;
          if (first) { g.moveTo(px, py); first = false; } else g.lineTo(px, py);
        });
      });
      g.stroke(); g.restore();
    }
    // settlements
    const showNames = R.cam.z > 0.95;
    for (const B of w.baronies) {
      const known = G.discovered['b:' + B.id];
      const x = B.x * S + S / 2, y = B.y * S + S / 2;
      const big = B.type === 'capital' ? 9 : B.type === 'city' ? 7 : ['town', 'castle'].includes(B.type) ? 5.5 : 4;
      const r = big * Math.max(0.8, Math.min(1.6, inv * 1.2));
      const ctrl = B.occ >= 0 ? B.occ : B.owner;
      const col = ctrl >= 0 ? w.realms[ctrl].color : '#888';
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = known ? col : 'rgba(80,80,90,0.7)'; g.fill();
      g.lineWidth = Math.max(1, 1.5 * inv); g.strokeStyle = B.type === 'capital' ? '#fff3c4' : 'rgba(10,8,15,0.9)'; g.stroke();
      if (B.type === 'capital') { g.fillStyle = '#fff3c4'; g.font = `${r * 1.25}px serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♛', x, y + 0.5); }
      if (R.cam.z > 1.5 && known) {
        g.font = `${10 * inv * 1.2 + 6}px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(ISK.world.SETTLEMENT[B.type].icon, x, y - r - 7 * inv - 4);
      }
      if (showNames && known && (B.type !== 'village' || R.cam.z > 1.6)) {
        const fs = (B.type === 'capital' ? 15 : B.type === 'city' ? 13 : 11.5) * inv * 1.05 + 2;
        g.font = `${B.type === 'capital' || B.type === 'city' ? 700 : 600} ${fs}px Georgia, serif`;
        g.textAlign = 'center'; g.textBaseline = 'top';
        g.lineWidth = 3 * inv + 0.5; g.strokeStyle = 'rgba(8,10,18,0.85)'; g.strokeText(B.name, x, y + r + 2);
        g.fillStyle = B.type === 'capital' ? '#ffe7a6' : '#f4f0e6'; g.fillText(B.name, x, y + r + 2);
      }
      if (G.player.ownedBarony === B.id) { g.font = `${14 * inv + 4}px serif`; g.fillText('🏠', x + r + 4, y - r); }
    }
    // dungeons
    for (const Dg of w.dungeons) {
      if (!G.discovered['d:' + Dg.id] && !(Dg.relic && G.player.flags.relicsRevealed) && !(Dg.final && G.player.flags.relicsRevealed)) continue;
      const x = Dg.x * S + S / 2, y = Dg.y * S + S / 2;
      const s = (Dg.final ? 26 : 16) * Math.max(0.9, Math.min(1.5, inv * 1.2));
      g.save();
      if (Dg.relic && !G.cleared[Dg.id] && G.player.flags.relicsRevealed) {
        g.beginPath(); g.arc(x, y, s * 0.8 + Math.sin(R.t / 12) * 2, 0, 7); g.fillStyle = 'rgba(255,126,182,0.35)'; g.fill();
      }
      g.beginPath(); g.arc(x, y, s * 0.55, 0, 7); g.fillStyle = G.cleared[Dg.id] ? 'rgba(40,60,40,0.85)' : 'rgba(25,10,30,0.85)'; g.fill();
      g.lineWidth = 1.5 * inv; g.strokeStyle = Dg.final ? '#ff5c3c' : '#c9a6ff'; g.stroke();
      g.font = `${s * 0.75}px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(G.cleared[Dg.id] ? '✔️' : Dg.icon, x, y + 1);
      g.restore();
      if (R.cam.z > 1.3) {
        g.font = `600 ${10.5 * inv + 2}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'top';
        g.lineWidth = 3 * inv; g.strokeStyle = 'rgba(8,10,18,0.85)'; const label = `${Dg.name} (${Dg.level})`;
        g.strokeText(label, x, y + s * 0.6); g.fillStyle = '#e8d6ff'; g.fillText(label, x, y + s * 0.6);
      }
    }
    // armies
    const adj = ISK.politics.bfsPath ? null : null;
    for (const a of G.P.armies) {
      const B = w.baronies[a.node];
      let x = B.x * S + S / 2, y = B.y * S + S / 2;
      if (a.path.length && a.prog > 0) { const N = w.baronies[a.path[0]]; x += (N.x * S + S / 2 - x) * a.prog; y += (N.y * S + S / 2 - y) * a.prog; }
      const k = Math.max(0.9, Math.min(1.6, inv * 1.2));
      const col = w.realms[a.realm].color;
      g.save(); g.translate(x + 8 * k, y - 12 * k);
      g.fillStyle = 'rgba(10,10,15,0.9)'; g.fillRect(-1 * k, -10 * k, 2 * k, 22 * k);
      g.fillStyle = col; g.beginPath(); g.moveTo(1 * k, -10 * k); g.lineTo(16 * k, -6 * k); g.lineTo(1 * k, -2 * k); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 0.8 * k; g.stroke();
      const txt = a.size >= 1000 ? (a.size / 1000).toFixed(1) + 'k' : String(a.size);
      g.font = `800 ${8.5 * k}px "Segoe UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText(txt).width + 6 * k;
      g.fillStyle = 'rgba(10,12,20,0.88)'; g.fillRect(-tw / 2 + 8 * k, 3 * k, tw, 11 * k);
      g.fillStyle = a.siege > 0 ? '#ffb0b8' : '#fff'; g.fillText(txt, 8 * k, 8.8 * k);
      if (a.siege > 0) { g.font = `${10 * k}px serif`; g.fillText('🔥', -6 * k, -12 * k); }
      g.restore();
    }
    // realm labels (zoomed out)
    if (R.cam.z < 1.25 && R.mode !== 'danger') {
      if (!labelCache || R.t - labelCacheT > 120) { labelCache = realmLabelPositions(); labelCacheT = R.t; }
      for (const L of labelCache) {
        const fs = Math.min(42, 10 + Math.sqrt(L.n) * 4.2) * inv * 0.9 + 4;
        g.font = `700 ${fs}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 5 * inv; g.strokeStyle = 'rgba(10,8,16,0.7)';
        const text = L.realm.name.toUpperCase();
        g.strokeText(text, L.x, L.y); g.fillStyle = 'rgba(255,245,220,0.92)'; g.fillText(text, L.x, L.y);
        g.font = `600 ${fs * 0.42}px Georgia, serif`;
        const sub = L.realm.title; g.strokeText(sub, L.x, L.y + fs * 0.72); g.fillStyle = 'rgba(255,230,180,0.85)'; g.fillText(sub, L.x, L.y + fs * 0.72);
      }
    }
    // selection
    if (R.selected) {
      const p = ISK.world.nodeXY(w, R.selected);
      g.beginPath(); g.arc(p.x * S + S / 2, p.y * S + S / 2, 16 * Math.max(1, inv) + Math.sin(R.t / 10) * 2, 0, 7);
      g.strokeStyle = '#ffdf8e'; g.lineWidth = 2.2 * inv + 0.8; g.stroke();
    }
    // player
    let px, py;
    if (R.travel && R.travel.pos) { px = R.travel.pos.x; py = R.travel.pos.y; }
    else { const p = ISK.world.nodeXY(w, G.player.location); px = p.x * S + S / 2; py = p.y * S + S / 2; }
    const pk = Math.max(1, Math.min(1.8, inv * 1.3));
    g.beginPath(); g.arc(px, py, (12 + Math.sin(R.t / 8) * 3) * pk, 0, 7); g.fillStyle = 'rgba(255,126,182,0.25)'; g.fill();
    g.beginPath(); g.arc(px, py, 8 * pk, 0, 7); g.fillStyle = '#ff7eb6'; g.fill(); g.lineWidth = 2 * pk; g.strokeStyle = '#fff'; g.stroke();
    g.font = `${13 * pk}px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(G.player.gender === 'f' ? '🧝‍♀️' : '🧝', px, py - 18 * pk);
  }

  function pick(sx, sy) {
    const [wx, wy] = screenToWorld(sx, sy);
    const w = R.G.world; let best = null, bd = (14 / R.cam.z) + 8;
    for (const B of w.baronies) { const d = Math.hypot(B.x * S + S / 2 - wx, B.y * S + S / 2 - wy); if (d < bd) { bd = d; best = 'b:' + B.id; } }
    for (const Dg of w.dungeons) {
      if (!R.G.discovered['d:' + Dg.id] && !(R.G.player.flags.relicsRevealed && (Dg.relic || Dg.final))) continue;
      const d = Math.hypot(Dg.x * S + S / 2 - wx, Dg.y * S + S / 2 - wy); if (d < bd) { bd = d; best = 'd:' + Dg.id; }
    }
    // army?
    return best;
  }

  function cellAt(sx, sy) {
    const [wx, wy] = screenToWorld(sx, sy);
    const x = Math.floor(wx / S), y = Math.floor(wy / S);
    if (x < 0 || y < 0 || x >= ISK.world.W || y >= ISK.world.H) return -1;
    return y * ISK.world.W + x;
  }

  function cellToPx(cell) { return { x: (cell % ISK.world.W) * S + S / 2, y: ((cell / ISK.world.W) | 0) * S + S / 2 }; }

  ISK.render = { R, init, draw, resize, centerOn, clampCam, pick, cellAt, cellToPx, screenToWorld, invalidatePolitical, S, buildBase };
})();
