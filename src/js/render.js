// Map renderer v2: smooth terrain, always-visible feudal regions, zone tints, sea lanes, pixel settlements, armies, quest markers, minimap, WASD.
(function () {
  const ISK = (globalThis.ISK = globalThis.ISK || {});
  const S = 8;
  const EMOJI = '"Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif';
  const TCOL = { 0: [22, 52, 92], 1: [36, 86, 140], 2: [222, 206, 158], 3: [128, 170, 88], 4: [62, 118, 62], 5: [150, 150, 96], 6: [128, 118, 108], 7: [235, 238, 245], 8: [222, 190, 120], 9: [172, 186, 178], 10: [86, 104, 72], 11: [70, 34, 36], 12: [40, 102, 60] };
  const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const shade = (rgb, f) => rgb.map((c) => Math.max(0, Math.min(255, Math.round(c * f))));

  const R = { canvas: null, ctx: null, G: null, base: null, layers: {}, mode: 'terrain', cam: { x: 0, y: 0, z: 1 }, selected: null, route: null, travel: null, t: 0, dpr: 1, keys: new Set(), mini: null, labels: null };

  function init(canvas, G) {
    R.canvas = canvas; R.ctx = canvas.getContext('2d'); R.G = G; R.layers = {}; R.labels = null;
    buildBase(); buildLabels(); resize(); centerOn(G.player.location, 1.6);
    R.mini = document.getElementById('minimap');
    if (R.mini) { R.mini.width = 240; R.mini.height = Math.round(240 * ISK.world.H / ISK.world.W); }
  }
  function resize() { const dpr = window.devicePixelRatio || 1; R.dpr = dpr; R.canvas.width = Math.floor(R.canvas.clientWidth * dpr); R.canvas.height = Math.floor(R.canvas.clientHeight * dpr); }

  function buildBase() {
    const w = R.G.world; const { W, H } = ISK.world; const SEA = w.SEA, PEAK = w.PEAK;
    const small = document.createElement('canvas'); small.width = W; small.height = H;
    const sg = small.getContext('2d'); const sd = sg.createImageData(W, H);
    const light = new Float32Array(W * H); const hgt = w.height;
    for (let i = 0; i < W * H; i++) {
      const t = w.terrain[i]; const col = t <= 1 ? TCOL[2] : TCOL[t];
      sd.data[i * 4] = col[0]; sd.data[i * 4 + 1] = col[1]; sd.data[i * 4 + 2] = col[2]; sd.data[i * 4 + 3] = 255;
      const x = i % W, y = (i / W) | 0;
      const dx = hgt[Math.min(W - 1, x + 1) + y * W] - hgt[Math.max(0, x - 1) + y * W], dy = hgt[x + Math.min(H - 1, y + 1) * W] - hgt[x + Math.max(0, y - 1) * W];
      light[i] = Math.max(0.68, Math.min(1.32, 1 + (-dx - dy) * 1.7));
    }
    sg.putImageData(sd, 0, 0);
    const big = document.createElement('canvas'); big.width = W * S; big.height = H * S;
    const bgx = big.getContext('2d'); bgx.imageSmoothingEnabled = true; bgx.imageSmoothingQuality = 'high'; bgx.drawImage(small, 0, 0, W * S, H * S);
    const bd = bgx.getImageData(0, 0, W * S, H * S).data;
    const bil = (arr, fx, fy) => { fx = Math.max(0, Math.min(W - 1.001, fx)); fy = Math.max(0, Math.min(H - 1.001, fy)); const x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0; const a = arr[y0 * W + x0], b = arr[y0 * W + x0 + 1], c = arr[(y0 + 1) * W + x0], d = arr[(y0 + 1) * W + x0 + 1]; return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty; };
    const c2 = document.createElement('canvas'); c2.width = W * S; c2.height = H * S; const g2 = c2.getContext('2d');
    const img = g2.createImageData(W * S, H * S); const data = img.data; const PW = W * S, PH = H * S;
    const hash = ISK.noise.hash2;
    for (let py = 0; py < PH; py++) {
      const fy = py / S - 0.5;
      for (let px = 0; px < PW; px++) {
        const fx = px / S - 0.5; const hh = bil(hgt, fx, fy); const k = (py * PW + px) * 4;
        const n = hash(px, py, 3) * 0.08 + 0.96; let r, g, b;
        if (hh < SEA) {
          const depth = Math.min(1, (SEA - hh) / 0.16);
          r = 70 - 50 * depth; g = 150 - 92 * depth; b = 196 - 88 * depth;
          const wave = 1 + Math.sin(px * 0.05 + py * 0.11) * 0.025; r *= wave; g *= wave; b *= wave;
          if (SEA - hh < 0.006) { r = r * 0.5 + 120; g = g * 0.5 + 125; b = b * 0.5 + 125; }
        } else {
          r = bd[k]; g = bd[k + 1]; b = bd[k + 2];
          if (hh < SEA + 0.012) { const f = (hh - SEA) / 0.012; r = 222 + (r - 222) * f; g = 206 + (g - 206) * f; b = 158 + (b - 158) * f; }
          if (hh > PEAK) { const f = Math.min(1, (hh - PEAK) / 0.03); r += (240 - r) * f; g += (243 - g) * f; b += (250 - b) * f; }
          const l = bil(light, fx, fy); r *= l; g *= l; b *= l;
        }
        data[k] = Math.min(255, r * n); data[k + 1] = Math.min(255, g * n); data[k + 2] = Math.min(255, b * n); data[k + 3] = 255;
      }
    }
    g2.putImageData(img, 0, 0);
    // landmark zone tints
    for (const L of w.landmarks) {
      g2.save(); g2.globalAlpha = 0.28; g2.fillStyle = `rgb(${L.color.join(',')})`;
      for (let y = Math.max(0, L.y - L.r - 3); y < Math.min(H, L.y + L.r + 3); y++) for (let x = Math.max(0, L.x - L.r - 3); x < Math.min(W, L.x + L.r + 3); x++) if (w.cellLandmark[y * W + x] === L.id) g2.fillRect(x * S, y * S, S, S);
      g2.restore();
    }
    // glyphs
    const rnd = (a, b) => ISK.noise.hash2(a, b, 77);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, t = w.terrain[i]; const cx = x * S + S / 2, cy = y * S + S / 2;
      const lm = w.cellLandmark[i];
      if ((t === 4 || t === 12) && rnd(x, y) < 0.55) {
        const dead = lm >= 0 && w.landmarks[lm].key === 'deathforest';
        g2.fillStyle = dead ? 'rgba(30,10,40,0.9)' : t === 12 ? 'rgba(20,70,35,0.85)' : 'rgba(28,72,34,0.8)';
        g2.beginPath(); g2.moveTo(cx, cy - 5); g2.lineTo(cx + 4, cy + 3); g2.lineTo(cx - 4, cy + 3); g2.closePath(); g2.fill();
        g2.fillStyle = 'rgba(60,40,20,0.7)'; g2.fillRect(cx - 0.6, cy + 3, 1.2, 2);
      } else if ((t === 6 || t === 7) && rnd(x, y) < 0.4) {
        g2.fillStyle = t === 7 ? 'rgba(255,255,255,0.9)' : 'rgba(90,80,74,0.9)';
        g2.beginPath(); g2.moveTo(cx, cy - 7); g2.lineTo(cx + 7, cy + 5); g2.lineTo(cx - 7, cy + 5); g2.closePath(); g2.fill();
        g2.fillStyle = 'rgba(255,255,255,0.75)'; g2.beginPath(); g2.moveTo(cx, cy - 7); g2.lineTo(cx + 2.5, cy - 2.5); g2.lineTo(cx - 2.5, cy - 2.5); g2.closePath(); g2.fill();
      } else if (t === 5 && rnd(x, y) < 0.25) { g2.strokeStyle = 'rgba(90,85,50,0.7)'; g2.lineWidth = 1.3; g2.beginPath(); g2.arc(cx, cy + 3, 4.5, Math.PI * 1.1, Math.PI * 1.9); g2.stroke(); }
      else if (t === 8 && rnd(x, y) < 0.18) { g2.strokeStyle = 'rgba(170,130,70,0.6)'; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(cx - 4, cy); g2.quadraticCurveTo(cx, cy - 3, cx + 4, cy); g2.stroke(); }
      else if (t === 10 && rnd(x, y) < 0.3) { g2.strokeStyle = 'rgba(60,90,70,0.8)'; g2.lineWidth = 1; g2.beginPath(); g2.moveTo(cx - 3, cy + 2); g2.lineTo(cx + 3, cy + 2); g2.moveTo(cx - 1, cy); g2.lineTo(cx, cy - 3); g2.stroke(); }
      else if (t === 11 && rnd(x, y) < 0.25) { g2.fillStyle = 'rgba(255,90,40,0.6)'; g2.beginPath(); g2.arc(cx, cy, 1.8, 0, 7); g2.fill(); }
      if (lm >= 0 && w.landmarks[lm].key === 'boneplains' && rnd(x + 3, y) < 0.12) { g2.fillStyle = 'rgba(250,250,240,0.9)'; g2.fillRect(cx - 3, cy, 6, 1.4); g2.fillRect(cx - 1, cy - 2, 1.4, 5); }
      if (lm >= 0 && w.landmarks[lm].key === 'crystal' && rnd(x + 5, y) < 0.16) { g2.fillStyle = 'rgba(170,230,255,0.95)'; g2.beginPath(); g2.moveTo(cx, cy - 5); g2.lineTo(cx + 2, cy + 2); g2.lineTo(cx - 2, cy + 2); g2.fill(); }
    }
    // rivers
    g2.strokeStyle = 'rgba(70,140,210,0.9)'; g2.lineCap = 'round'; g2.lineWidth = 2.2;
    for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
      const i = y * W + x; if (!w.river[i]) continue;
      for (const [dx, dy] of [[1, 0], [0, 1]]) { const j = (y + dy) * W + (x + dx); if (w.river[j] || w.terrain[j] < 2) { g2.beginPath(); g2.moveTo(x * S + S / 2, y * S + S / 2); g2.lineTo((x + dx) * S + S / 2, (y + dy) * S + S / 2); g2.stroke(); } }
    }
    const drawPath = (path, width, color, dash) => {
      g2.beginPath(); path.forEach((cell, k) => { const px = (cell % W) * S + S / 2, py = ((cell / W) | 0) * S + S / 2; k ? g2.lineTo(px, py) : g2.moveTo(px, py); });
      g2.setLineDash(dash || []); g2.lineWidth = width; g2.strokeStyle = color; g2.lineJoin = 'round'; g2.stroke(); g2.setLineDash([]);
    };
    for (const s of w.seaRoutes) drawPath(s.path, 1.6, 'rgba(220,240,255,0.55)', [3, 7]);
    for (const t of w.trails) drawPath(t.path, 1.4, t.kind === 'sea' ? 'rgba(220,240,255,0.5)' : 'rgba(70,45,25,0.75)', [2, 4]);
    for (const r of w.roads) drawPath(r.path, r.major ? 4.2 : 2.8, 'rgba(40,25,12,0.55)');
    for (const r of w.roads) drawPath(r.path, r.major ? 2.4 : 1.5, r.major ? 'rgba(236,206,150,0.95)' : 'rgba(205,170,120,0.85)', r.major ? null : [5, 3]);
    R.base = c2;
  }

  function buildLabels() {
    const w = R.G.world; const avg = (bs) => { let x = 0, y = 0; for (const b of bs) { x += w.baronies[b].x; y += w.baronies[b].y; } return { x: (x / bs.length) * S + S / 2, y: (y / bs.length) * S + S / 2 }; };
    R.labels = { duchies: w.duchies.map((d) => ({ name: d.name, ...avg(d.baronies), n: d.baronies.length })), counties: w.counties.map((c) => ({ name: c.name, ...avg(c.baronies) })) };
  }

  function buildLayer(mode) {
    const w = R.G.world; const { W, H } = ISK.world;
    const c = document.createElement('canvas'); c.width = W * S; c.height = H * S; const g = c.getContext('2d');
    const realmCol = (id) => (id >= 0 ? hexToRgb(w.realms[id].color) : null);
    if (mode !== 'terrain') {
      const img = g.createImageData(W, H); const d = img.data; const cache = {};
      const colorOf = (b) => {
        const B = w.baronies[b];
        if (mode === 'political') return realmCol(B.owner);
        if (mode === 'dejure') return shade(hexToRgb(w.realms[B.realm].color), 0.65 + ((B.duchy * 37) % 7) * 0.09);
        if (mode === 'danger') { const t = Math.min(1, B.danger / 30); return [Math.round(60 + 195 * t), Math.round(220 - 170 * t), 70]; }
        return null;
      };
      for (let i = 0; i < W * H; i++) {
        const b = w.cellBarony[i]; if (b < 0) continue;
        const col = cache[b] || (cache[b] = colorOf(b)); if (!col) continue;
        const B = w.baronies[b];
        if (mode === 'political' && B.occ >= 0) { const x = i % W, y = (i / W) | 0; if ((x + y) % 3 === 0) { const oc = realmCol(B.occ); d[i * 4] = oc[0]; d[i * 4 + 1] = oc[1]; d[i * 4 + 2] = oc[2]; d[i * 4 + 3] = 210; continue; } }
        d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 140;
      }
      const sm = document.createElement('canvas'); sm.width = W; sm.height = H; sm.getContext('2d').putImageData(img, 0, 0);
      g.imageSmoothingEnabled = false; g.drawImage(sm, 0, 0, W * S, H * S);
    }
    const keyOf = (b, lvl) => { const B = w.baronies[b]; if (lvl === 'realm') return mode === 'dejure' ? B.realm : B.owner; if (lvl === 'bloc') { const o = mode === 'dejure' ? B.realm : B.owner; return o >= 0 && w.realms[o].liege >= 0 ? w.realms[o].liege : o; } if (lvl === 'duchy') return B.duchy; if (lvl === 'county') return B.county; return b; };
    const borders = (lvl, width, color, dash) => {
      g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash || []); g.beginPath();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, b = w.cellBarony[i]; if (b < 0) continue; const k = keyOf(b, lvl);
        if (x + 1 < W) { const b2 = w.cellBarony[i + 1]; if (b2 >= 0 && keyOf(b2, lvl) !== k) { g.moveTo((x + 1) * S, y * S); g.lineTo((x + 1) * S, (y + 1) * S); } }
        if (y + 1 < H) { const b2 = w.cellBarony[i + W]; if (b2 >= 0 && keyOf(b2, lvl) !== k) { g.moveTo(x * S, (y + 1) * S); g.lineTo((x + 1) * S, (y + 1) * S); } }
      }
      g.stroke(); g.setLineDash([]);
    };
    if (mode === 'terrain') {
      borders('county', 0.8, 'rgba(255,250,230,0.22)', [2, 3]);
      borders('duchy', 1.4, 'rgba(255,245,215,0.42)');
      borders('realm', 3.4, 'rgba(15,10,22,0.6)');
      // colored inner glow for realm borders
      g.globalAlpha = 0.55;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x, b = w.cellBarony[i]; if (b < 0) continue; const o = w.baronies[b].owner; if (o < 0) continue;
        const edge = (x + 1 < W && w.cellBarony[i + 1] >= 0 && w.baronies[w.cellBarony[i + 1]].owner !== o) || (x > 0 && w.cellBarony[i - 1] >= 0 && w.baronies[w.cellBarony[i - 1]].owner !== o) || (y + 1 < H && w.cellBarony[i + W] >= 0 && w.baronies[w.cellBarony[i + W]].owner !== o) || (y > 0 && w.cellBarony[i - W] >= 0 && w.baronies[w.cellBarony[i - W]].owner !== o);
        if (edge) { g.fillStyle = w.realms[o].color; g.fillRect(x * S + 1, y * S + 1, S - 2, S - 2); }
      }
      g.globalAlpha = 1;
      borders('bloc', 2, 'rgba(255,215,110,0.75)', [6, 4]);
    } else if (mode === 'political' || mode === 'dejure') {
      borders('barony', 0.6, 'rgba(0,0,0,0.18)'); borders('county', 1, 'rgba(255,255,255,0.28)');
      if (mode === 'dejure') borders('duchy', 1.8, 'rgba(255,255,255,0.55)');
      borders('realm', 3.2, 'rgba(15,10,20,0.85)'); borders('bloc', 2.4, 'rgba(255,215,110,0.9)', [8, 4]);
    } else borders('barony', 0.6, 'rgba(0,0,0,0.25)');
    R.layers[mode] = c;
  }
  function invalidatePolitical() { R.layers = {}; }

  const screenToWorld = (sx, sy) => [sx / R.cam.z + R.cam.x, sy / R.cam.z + R.cam.y];
  function centerOn(node, zoom) {
    const p = ISK.world.nodeXY(R.G.world, node); if (zoom) R.cam.z = zoom;
    R.cam.x = p.x * S + S / 2 - R.canvas.clientWidth / R.cam.z / 2; R.cam.y = p.y * S + S / 2 - R.canvas.clientHeight / R.cam.z / 2; clampCam();
  }
  function clampCam() {
    const { W, H } = ISK.world; const vw = R.canvas.clientWidth / R.cam.z, vh = R.canvas.clientHeight / R.cam.z;
    R.cam.x = Math.max(-vw * 0.3, Math.min(W * S - vw * 0.7, R.cam.x)); R.cam.y = Math.max(-vh * 0.3, Math.min(H * S - vh * 0.7, R.cam.y));
  }

  function realmLabelPositions() {
    const w = R.G.world; const out = [];
    for (const realm of w.realms) {
      if (R.G.P.realms[realm.id].dead) continue;
      let sx = 0, sy = 0, n = 0; for (const B of w.baronies) if (B.owner === realm.id) { sx += B.x; sy += B.y; n++; }
      if (n) out.push({ realm, x: (sx / n) * S, y: (sy / n) * S, n });
    }
    return out;
  }
  let realmLabels = null, rlT = 0, markers = [], mkT = 0;

  function text(g, str, x, y, size, color, weight = 700, stroke = 4, font = 'Georgia, serif') {
    g.font = `${weight} ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = stroke; g.strokeStyle = 'rgba(8,8,16,0.8)'; g.strokeText(str, x, y); g.fillStyle = color; g.fillText(str, x, y);
  }

  function draw() {
    const g = R.ctx, G = R.G; if (!g || !R.base) return; const w = G.world;
    R.t++;
    // WASD / arrows pan
    if (R.keys.size) {
      const sp = 14 / R.cam.z;
      if (R.keys.has('KeyW') || R.keys.has('ArrowUp')) R.cam.y -= sp; if (R.keys.has('KeyS') || R.keys.has('ArrowDown')) R.cam.y += sp;
      if (R.keys.has('KeyA') || R.keys.has('ArrowLeft')) R.cam.x -= sp; if (R.keys.has('KeyD') || R.keys.has('ArrowRight')) R.cam.x += sp;
      if (R.keys.has('KeyQ')) R.cam.z = Math.max(0.22, R.cam.z * 0.98); if (R.keys.has('KeyE')) R.cam.z = Math.min(4, R.cam.z * 1.02);
      clampCam();
    }
    if (w._ownerDirty) { invalidatePolitical(); w._ownerDirty = false; realmLabels = null; }
    const z = R.cam.z * R.dpr, inv = 1 / R.cam.z;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#143a6c'; g.fillRect(0, 0, R.canvas.width, R.canvas.height);
    g.setTransform(z, 0, 0, z, -R.cam.x * z, -R.cam.y * z); g.imageSmoothingEnabled = true;
    g.drawImage(R.base, 0, 0);
    if (!R.layers[R.mode]) buildLayer(R.mode);
    g.drawImage(R.layers[R.mode], 0, 0);
    // route
    const route = R.travel ? R.travel.route : R.route;
    if (route && route.legs.length) {
      g.save(); g.lineWidth = 3.2 * inv + 1.2; g.setLineDash([8 * inv + 2, 6 * inv + 2]); g.lineDashOffset = -R.t * 0.6;
      route.legs.forEach((leg, li) => {
        if (R.travel && li < R.travel.leg) return;
        g.strokeStyle = leg.kind === 'sea' ? 'rgba(120,220,255,0.95)' : 'rgba(255,126,182,0.95)';
        g.beginPath(); leg.path.forEach((cell, k) => { const px = (cell % ISK.world.W) * S + S / 2, py = ((cell / ISK.world.W) | 0) * S + S / 2; k ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke();
      });
      g.restore();
    }
    g.imageSmoothingEnabled = false;
    // settlements
    const z1 = R.cam.z;
    const VX0 = R.cam.x - 80, VY0 = R.cam.y - 80, VX1 = R.cam.x + R.canvas.clientWidth / R.cam.z + 80, VY1 = R.cam.y + R.canvas.clientHeight / R.cam.z + 80;
    const vis = (x, y) => x > VX0 && x < VX1 && y > VY0 && y < VY1;
    for (const B of w.baronies) {
      const known = G.discovered['b:' + B.id];
      const x = B.x * S + S / 2, y = B.y * S + S / 2;
      if (!vis(x, y)) continue;
      const big = B.type === 'capital' ? 1.5 : B.type === 'city' ? 1.25 : ['town', 'fortress', 'hellfort'].includes(B.type) ? 1.05 : 0.85;
      const sc = Math.max(1.1, Math.min(2.4, inv * 1.6)) * big;
      const ctrl = B.occ >= 0 ? B.occ : B.owner; const col = ctrl >= 0 ? w.realms[ctrl].color : '#888';
      g.beginPath(); g.ellipse(x, y + 4 * sc, 7 * sc, 2.6 * sc, 0, 0, 7); g.fillStyle = known ? col : 'rgba(60,60,70,0.7)'; g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1;
      if (known || z1 > 0.9) { const ic = ISK.sprites.icon(B.type === 'capital' || B.type === 'city' || B.type === 'fortress' || B.type === 'town' || B.type === 'port' || B.type === 'mine' || B.type === 'hellfort' ? B.type : 'village'); g.globalAlpha = known ? 1 : 0.55; g.drawImage(ic, x - 6 * sc, y - 7 * sc, 12 * sc, ic.height * sc); g.globalAlpha = 1; }
      if (B.holder === 'player') text(g, '🏠', x + 7 * sc, y - 7 * sc, 9 * sc, '#fff', 400, 0, EMOJI);
      if (known && z1 > 0.85 && (B.type !== 'village' || z1 > 1.7)) {
        const fs = (B.type === 'capital' ? 14 : B.type === 'city' ? 12 : 10.5) * inv * 1.1 + 2;
        text(g, B.name, x, y + 8 * sc + fs * 0.6, fs, B.type === 'capital' ? '#ffe7a6' : '#f4f0e6', B.type === 'capital' || B.type === 'city' ? 700 : 600, 3 * inv + 0.5);
      }
    }
    g.imageSmoothingEnabled = true;
    // landmark labels
    if (z1 > 0.55) for (const L of w.landmarks) {
      text(g, `${L.icon} ${L.name}`, L.x * S, (L.y - L.r * 0.6) * S, 12 * inv + 5, `rgb(${shade(L.color, 1.35).join(',')})`, 700, 4 * inv, 'Georgia, serif');
    }
    // dungeons
    for (const Dg of w.dungeons) {
      if (!G.discovered['d:' + Dg.id] && !(G.player.flags.relicsRevealed && (Dg.relic || Dg.final))) continue;
      const x = Dg.x * S + S / 2, y = Dg.y * S + S / 2; const s = (Dg.final ? 26 : 16) * Math.max(0.9, Math.min(1.5, inv * 1.2));
      if (Dg.relic && !G.cleared[Dg.id] && G.player.flags.relicsRevealed) { g.beginPath(); g.arc(x, y, s * 0.8 + Math.sin(R.t / 12) * 2, 0, 7); g.fillStyle = 'rgba(255,126,182,0.35)'; g.fill(); }
      g.beginPath(); g.arc(x, y, s * 0.55, 0, 7); g.fillStyle = G.cleared[Dg.id] ? 'rgba(40,60,40,0.85)' : 'rgba(25,10,30,0.85)'; g.fill();
      g.lineWidth = 1.5 * inv; g.strokeStyle = Dg.final ? '#ff5c3c' : '#c9a6ff'; g.stroke();
      g.font = `${s * 0.72}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(G.cleared[Dg.id] ? '✔️' : Dg.icon, x, y + 1);
      if (z1 > 1.3) text(g, `${Dg.name} (${Dg.level})`, x, y + s * 0.95, 10 * inv + 2, '#e8d6ff', 600, 3 * inv);
    }
    // smooth world-clock fraction (time passes gradually while travelling / time-flow)
    const frac = G.time - Math.floor(G.time);
    // resource sites
    if (z1 > 1.05) for (const B of w.baronies) {
      if (!vis(B.x * S, B.y * S)) continue;
      if (!B.sites || !B.sites.length || !G.discovered['b:' + B.id]) continue;
      B.sites.forEach((st, k) => { const S2 = ISK.data.RESOURCE_SITES[st.key]; if (!S2) return; const x = B.x * S + S / 2 + (k ? -14 : 14), y = B.y * S + S / 2 + 10;
        g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fillStyle = 'rgba(15,20,30,0.65)'; g.fill(); g.strokeStyle = 'rgba(255,230,160,0.7)'; g.lineWidth = 1; g.stroke();
        g.font = `9px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(S2.icon, x, y + 0.5);
        if (z1 > 2.2) text(g, S2.name, x, y + 11, 5.5, '#ffe9b8', 600, 2); });
    }
    // recent battles: dust clouds & crossed swords
    for (const bt of G.P.battles || []) {
      const age = G.time - bt.day; if (age > 3 || age < 0) continue;
      const x = bt.x * S + S / 2, y = bt.y * S + S / 2; const k = Math.max(1, Math.min(1.8, inv * 1.3));
      for (let c = 0; c < 5; c++) { const ang = c * 1.26 + R.t / 30; const rr = (10 + Math.sin(R.t / 7 + c) * 3) * k; g.beginPath(); g.arc(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * 0.6, (6 + c % 3 * 2) * k, 0, 7); g.fillStyle = `rgba(200,190,170,${0.35 * (1 - age / 3)})`; g.fill(); }
      g.font = `${18 * k}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = 1 - age / 3.5; g.fillText('⚔️', x, y - 4 * k + Math.sin(R.t / 4) * 2); g.globalAlpha = 1;
    }
    // position of a marching unit along its real road path
    const along = (node, next, prog) => {
      const A = w.baronies[node], Bn = w.baronies[next];
      const e = (w.graph['b:' + node] || []).find((x) => x.to === 'b:' + next);
      if (!e || e.path.length < 2) return { x: (A.x + (Bn.x - A.x) * prog) * S + S / 2, y: (A.y + (Bn.y - A.y) * prog) * S + S / 2, dir: Bn.x >= A.x ? 1 : -1 };
      const f = Math.max(0, Math.min(0.999, prog)) * (e.path.length - 1); const i = f | 0, t = f - i; const W0 = ISK.world.W;
      const c1 = e.path[i], c2 = e.path[Math.min(e.path.length - 1, i + 1)];
      const x1 = c1 % W0, y1 = (c1 / W0) | 0, x2 = c2 % W0, y2 = (c2 / W0) | 0;
      return { x: (x1 + (x2 - x1) * t) * S + S / 2, y: (y1 + (y2 - y1) * t) * S + S / 2, dir: x2 >= x1 ? 1 : -1 };
    };
    const unitPos = (u) => {
      if (u.path && u.path.length) return along(u.node, u.path[0], Math.min(1, (u.prog || 0) + frac / (u.legDays || 3)));
      const B = w.baronies[u.node]; return { x: B.x * S + S / 2, y: B.y * S + S / 2, dir: 1, idle: true };
    };
    // armies: little marching squads with banners
    for (const a of G.P.armies) {
      const pos = unitPos(a); if (!vis(pos.x, pos.y)) continue; const k = Math.max(0.9, Math.min(1.7, inv * 1.25)); const dark = ISK.politics.isDemon(G.P, a.realm);
      const col = dark ? '#3a0a10' : w.realms[a.realm].color; const n = Math.max(2, Math.min(6, Math.round(Math.log10(Math.max(100, a.size)) * 1.6 - 2)));
      const ox = pos.x + 8 * k, oy = pos.y - 6 * k; const walk = !pos.idle;
      g.save(); g.translate(ox, oy);
      for (let i = 0; i < n; i++) {
        const fx = (i % 3) * 5.2 * k - 5 * k + (i >= 3 ? 2.6 * k : 0), fy = (i >= 3 ? 4.5 : 0) * k;
        const bob = walk ? Math.abs(Math.sin(R.t / 5 + i * 1.7)) * 1.6 * k : 0;
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(fx - 2 * k, fy + 5 * k, 4 * k, 1.2 * k);
        g.fillStyle = dark ? '#1a0508' : col; g.fillRect(fx - 1.7 * k, fy - 1 * k - bob, 3.4 * k, 5 * k);
        g.fillStyle = dark ? '#ff3030' : '#f1c9a5'; g.fillRect(fx - 1.3 * k, fy - 3.8 * k - bob, 2.6 * k, 2.6 * k);
        g.fillStyle = dark ? '#ff2020' : '#cfd6e4'; g.fillRect(fx + 1.9 * k * pos.dir, fy - 5 * k - bob, 0.7 * k, 7 * k);
      }
      // banner / demon icon
      if (dark) { g.font = `${13 * k}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(a.icon || '😈', -11 * k, -10 * k + Math.sin(R.t / 8 + a.id) * 1.5 * k); }
      else { g.fillStyle = 'rgba(10,10,15,0.95)'; g.fillRect(-11 * k, -16 * k, 1.4 * k, 18 * k); g.fillStyle = col; g.beginPath(); g.moveTo(-9.6 * k, -16 * k); g.lineTo((-9.6 + 10 + Math.sin(R.t / 6 + a.id) * 1.5) * k, -13 * k); g.lineTo(-9.6 * k, -10 * k); g.fill(); g.strokeStyle = '#000'; g.lineWidth = 0.7 * k; g.stroke(); if (a.patrol) { g.font = `${6 * k}px ${EMOJI}`; g.fillText('🛡️', -7 * k, -13 * k); } }
      const txt = a.size >= 1000 ? (a.size / 1000).toFixed(1) + 'k' : String(a.size);
      g.font = `800 ${8 * k}px "Segoe UI", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const tw = g.measureText(txt).width + 6 * k; g.fillStyle = dark ? 'rgba(90,0,0,0.9)' : a.patrol ? 'rgba(20,40,60,0.88)' : 'rgba(10,12,20,0.88)'; g.fillRect(-tw / 2, 9 * k, tw, 10 * k);
      g.fillStyle = a.siege > 0 ? '#ffb0b8' : '#fff'; g.fillText(txt, 0, 14.3 * k);
      if (a.siege > 0) { g.font = `${10 * k}px ${EMOJI}`; g.fillText('🔥', 9 * k, -12 * k); }
      if (z1 > 2 && R.mode !== 'danger') text(g, a.name, 0, 24 * k, 6.5 * k, dark ? '#ffb0a0' : '#fff2d6', 600, 2.5);
      g.restore();
    }
    // NPC heroes
    for (const hh of G.P.heroes || []) {
      if (!hh.alive || hh.joined) continue;
      const pos = unitPos(hh); if (!vis(pos.x, pos.y)) continue; const k = Math.max(0.9, Math.min(1.6, inv * 1.2)); const x = pos.x - 10 * k, y = pos.y - 12 * k + Math.sin(R.t / 7 + hh.id) * 1.5;
      g.beginPath(); g.arc(x, y, 6.5 * k, 0, 7); g.fillStyle = hh.rival ? 'rgba(255,126,182,0.85)' : 'rgba(255,215,110,0.85)'; g.fill(); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1; g.stroke();
      g.font = `${8 * k}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(hh.icon, x, y + 0.5);
      if (z1 > 1.5) text(g, `${hh.name.split(' ')[0]} · ${hh.lvl}`, x, y - 10 * k, 6 * k + 1, hh.rival ? '#ffc2dc' : '#ffe9a8', 700, 2.5);
    }
    // labels by zoom
    if (z1 < 1.25 && R.mode !== 'danger') {
      if (!realmLabels || R.t - rlT > 120) { realmLabels = realmLabelPositions(); rlT = R.t; }
      for (const L of realmLabels) {
        const fs = Math.min(22, 10 + Math.sqrt(L.n) * 1.6) * inv;
        text(g, L.realm.name.toUpperCase(), L.x, L.y, fs, L.realm.isDemon ? '#ff9a8a' : 'rgba(255,245,220,0.95)', 700, 5 * inv);
        const sub = L.realm.liege >= 0 ? `${L.realm.title} (васал Імперії)` : L.realm.title;
        text(g, sub, L.x, L.y + fs * 0.72, fs * 0.42, 'rgba(255,230,180,0.9)', 600, 3 * inv);
      }
    }
    if (z1 >= 0.8 && z1 < 2.2 && R.labels) for (const d of R.labels.duchies) if (d.n >= 3) text(g, d.name, d.x, d.y - 14 * inv, 11 * inv + 3, 'rgba(255,235,200,0.7)', 600, 3 * inv, 'Georgia, serif');
    if (z1 >= 2.2 && R.labels) for (const c of R.labels.counties) text(g, 'гр. ' + c.name, c.x, c.y - 18 * inv, 9 * inv + 3, 'rgba(255,250,230,0.6)', 500, 3 * inv, 'Georgia, serif');
    if (z1 < 0.65) for (const C of w.continents) text(g, C.name, C.x * S, (C.y - C.ry * ISK.world.H * 0.85) * S, 30 * inv, 'rgba(210,235,255,0.75)', 700, 6 * inv, 'Georgia, serif');
    // quest markers
    if (R.t - mkT > 30) { markers = ISK.game.questMarkers(G); mkT = R.t; }
    for (const m of markers) {
      const p = ISK.world.nodeXY(w, m.node); const bob = Math.sin(R.t / 9) * 3;
      const k = Math.max(1, Math.min(1.8, inv * 1.3));
      g.font = `${15 * k}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.beginPath(); g.arc(p.x * S + S / 2, p.y * S - 22 * k + bob, 10 * k, 0, 7); g.fillStyle = m.main ? 'rgba(255,126,182,0.85)' : 'rgba(255,215,110,0.85)'; g.fill();
      g.fillText(m.icon, p.x * S + S / 2, p.y * S - 22 * k + bob);
    }
    // selection
    if (R.selected) { const p = ISK.world.nodeXY(w, R.selected); g.beginPath(); g.arc(p.x * S + S / 2, p.y * S + S / 2, 16 * Math.max(1, inv) + Math.sin(R.t / 10) * 2, 0, 7); g.strokeStyle = '#ffdf8e'; g.lineWidth = 2.2 * inv + 0.8; g.stroke(); }
    // player (pixel hero)
    let px, py;
    if (R.travel && R.travel.pos) { px = R.travel.pos.x; py = R.travel.pos.y; } else { const p = ISK.world.nodeXY(w, G.player.location); px = p.x * S + S / 2; py = p.y * S + S / 2; }
    const pk = Math.max(1.4, Math.min(3, inv * 2));
    g.beginPath(); g.ellipse(px, py + 2, 9 * pk / 1.4, 3 * pk / 1.4, 0, 0, 7); g.fillStyle = 'rgba(255,126,182,0.35)'; g.fill();
    g.imageSmoothingEnabled = false;
    const hop = R.travel ? Math.abs(Math.sin(R.t / 4)) * 2 * pk : Math.sin(R.t / 20) * pk * 0.5;
    g.drawImage(ISK.sprites.hero(G.player), px - 8 * pk, py - 16 * pk - hop, 16 * pk, 16 * pk);
    g.imageSmoothingEnabled = true;
    if (G.player.mount !== 'feet' && R.travel) { g.font = `${11 * pk}px ${EMOJI}`; g.fillText(ISK.data.MOUNTS[G.player.mount].icon, px + 9 * pk, py - 2); }
    drawMini();
  }

  function drawMini() {
    const m = R.mini; if (!m || R.t % 6) return; const g = m.getContext('2d');
    g.drawImage(R.base, 0, 0, m.width, m.height);
    if (R.layers[R.mode === 'terrain' ? 'terrain' : R.mode]) { g.globalAlpha = 0.7; g.drawImage(R.layers[R.mode], 0, 0, m.width, m.height); g.globalAlpha = 1; }
    const k = m.width / (ISK.world.W * S);
    g.strokeStyle = '#ffdf8e'; g.lineWidth = 1.5; g.strokeRect(R.cam.x * k, R.cam.y * k, R.canvas.clientWidth / R.cam.z * k, R.canvas.clientHeight / R.cam.z * k);
    const p = ISK.world.nodeXY(R.G.world, R.G.player.location); g.fillStyle = '#ff7eb6'; g.beginPath(); g.arc(p.x * S * k, p.y * S * k, 3, 0, 7); g.fill();
  }
  function miniClick(e) {
    const m = R.mini; const r = m.getBoundingClientRect(); const k = (ISK.world.W * S) / r.width;
    R.cam.x = (e.clientX - r.left) * k - R.canvas.clientWidth / R.cam.z / 2; R.cam.y = (e.clientY - r.top) * k - R.canvas.clientHeight / R.cam.z / 2; clampCam();
  }

  function pick(sx, sy) {
    const [wx, wy] = screenToWorld(sx, sy); const w = R.G.world; let best = null, bd = (14 / R.cam.z) + 8;
    for (const B of w.baronies) { const d = Math.hypot(B.x * S + S / 2 - wx, B.y * S + S / 2 - wy); if (d < bd) { bd = d; best = 'b:' + B.id; } }
    for (const Dg of w.dungeons) { if (!R.G.discovered['d:' + Dg.id] && !(R.G.player.flags.relicsRevealed && (Dg.relic || Dg.final))) continue; const d = Math.hypot(Dg.x * S + S / 2 - wx, Dg.y * S + S / 2 - wy); if (d < bd) { bd = d; best = 'd:' + Dg.id; } }
    return best;
  }
  const cellToPx = (cell) => ({ x: (cell % ISK.world.W) * S + S / 2, y: ((cell / ISK.world.W) | 0) * S + S / 2 });

  ISK.render = { R, init, draw, resize, centerOn, clampCam, pick, cellToPx, screenToWorld, invalidatePolitical, S, miniClick };
})();
