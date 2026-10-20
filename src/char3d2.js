// Char3D v2 — smooth toon chibi with pixel-art face/clothes textures and wearable slots.
// build(THREE, L) where L = { skin, hair, hairColor, eyes, mouth,
//   top:{style,c1,c2,sleeve}, lower:{style,c}, hat:{style,c,c2}, face:{style,c}, shoes:{style,c},
//   back:{style,c,c2}, hand:{style,c,c2} }   (any slot may be null)
const Char3D = (() => {
  let gradMap = null;
  const matCache = new Map();
  function toon(THREE, color, map, extra) {
    if (!gradMap) {
      const d = new Uint8Array([150, 150, 150, 255, 210, 210, 210, 255, 255, 255, 255, 255]);
      gradMap = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat); gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true;
    }
    if (!map && !extra) { const k = color; if (matCache.has(k)) return matCache.get(k); }
    const m = new THREE.MeshToonMaterial(Object.assign({ color: map ? color : new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.14), map: map || null, gradientMap: gradMap }, map && map.userData.alpha ? { transparent: true, alphaTest: 0.5 } : {}, extra || {}));
    if (!map && !extra) matCache.set(color, m);
    return m;
  }
  function canvasTex(THREE, w, h, draw, alpha, S) {
    S = S || 6;
    const c = document.createElement('canvas'); c.width = w * S; c.height = h * S;
    const g = c.getContext('2d'); g.scale(S, S); g.lineCap = 'round'; g.lineJoin = 'round'; draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4;
    t.userData.alpha = !!alpha; return t;
  }
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1); };

  /* ---------- face (smooth vector drawing on a 16x12 unit canvas) ---------- */
  function faceTex(THREE, L) {
    return canvasTex(THREE, 16, 12, (g) => {
      const eye = '#3a2e4a', hair = L.hairColor, F = L.face, E = [4, 12], ey = 5.6;
      if (L.animal && L.animal.type === 'panda'){ g.fillStyle = 'rgba(70,62,78,.9)'; g.beginPath(); g.ellipse(4, 5.9, 2.3, 2.7, -0.4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(12, 5.9, 2.3, 2.7, 0.4, 0, Math.PI * 2); g.fill(); }
      const ell = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
      const arc = (x, y, r, a0, a1, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); };
      const ln = (pts, c, w) => { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
      // brows
      E.forEach((x, i) => ln([[x - 1.4, ey - 3.1 + (i ? 0.1 : 0.3)], [x + 1.4, ey - 3.1 + (i ? 0.3 : 0.1)]], shade(hair, 0.8), 0.55));
      const eyes = L.eyes || 'round';
      if (eyes === 'round' || eyes === 'star') E.forEach(x => {
        ell(x, ey, 1.35, 1.75, eye); ell(x, ey + 0.7, 0.9, 0.7, '#6a5aa8');
        if (eyes === 'star') { g.fillStyle = '#ffe28a'; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.35 : 0.85, a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, ey + Math.sin(a) * r); } g.fill(); }
        else { ell(x - 0.45, ey - 0.6, 0.48, 0.55, '#ffffff'); ell(x + 0.5, ey + 0.65, 0.22, 0.22, '#ffffff'); }
      });
      if (eyes === 'smile') E.forEach(x => arc(x, ey + 0.9, 1.25, Math.PI * 1.15, Math.PI * 1.85, eye, 0.6));
      if (eyes === 'dot') E.forEach(x => ell(x, ey, 0.6, 0.8, eye));
      if (eyes === 'sleepy') E.forEach(x => { arc(x, ey - 0.4, 1.25, Math.PI * 0.15, Math.PI * 0.85, eye, 0.55); });
      if (eyes === 'lash') E.forEach((x, i) => { ell(x, ey + 0.2, 1.2, 1.55, eye); ell(x - 0.4, ey - 0.4, 0.42, 0.5, '#ffffff'); ell(x + 0.4, ey + 0.7, 0.2, 0.2, '#ffffff'); const s2 = i ? 1 : -1; ln([[x + 1.0 * s2, ey - 0.9], [x + 1.9 * s2, ey - 1.6]], eye, 0.4); ln([[x + 1.25 * s2, ey - 0.3], [x + 2.1 * s2, ey - 0.7]], eye, 0.35); });
      if (eyes === 'wink') { ell(4, ey, 1.35, 1.75, eye); ell(4, ey + 0.7, 0.9, 0.7, '#6a5aa8'); ell(3.55, ey - 0.6, 0.48, 0.55, '#ffffff'); ln([[10.8, ey - 0.9], [13, ey], [10.8, ey + 0.9]], eye, 0.6); }
      if (eyes === 'heart') E.forEach(x => { g.fillStyle = '#ff5c8a'; g.beginPath(); g.moveTo(x, ey + 1.6); g.bezierCurveTo(x - 2.4, ey, x - 1.3, ey - 2.0, x, ey - 0.7); g.bezierCurveTo(x + 1.3, ey - 2.0, x + 2.4, ey, x, ey + 1.6); g.fill(); ell(x - 0.7, ey - 0.5, 0.35, 0.25, '#ffffff'); });
      if (eyes === 'sparkle') E.forEach(x => { ell(x, ey, 1.55, 1.9, eye); ell(x, ey + 0.6, 1.1, 0.9, '#8a6ad8'); ell(x - 0.5, ey - 0.7, 0.6, 0.65, '#ffffff'); ell(x + 0.6, ey + 0.6, 0.3, 0.3, '#ffffff'); ell(x + 0.7, ey - 0.9, 0.18, 0.18, '#ffffff'); });
      if (eyes === 'droopy') E.forEach((x, i) => { ell(x, ey + 0.3, 1.2, 1.3, eye); ell(x - 0.4, ey - 0.1, 0.4, 0.42, '#ffffff'); const s2 = i ? 1 : -1; ln([[x - 1.5 * s2, ey - 1.3], [x + 1.4 * s2, ey - 0.6]], shade(hair, 0.8), 0.45); });
      if (eyes === 'closed') E.forEach(x => { arc(x, ey - 0.2, 1.2, Math.PI * 0.12, Math.PI * 0.88, eye, 0.6); ln([[x - 1.3, ey + 0.15], [x - 1.7, ey + 0.6]], eye, 0.35); });
      if (eyes === 'ouch') E.forEach((x, i) => { const s2 = i ? -1 : 1; ln([[x - 1.1 * s2, ey - 1.0], [x + 0.9 * s2, ey], [x - 1.1 * s2, ey + 1.0]], eye, 0.6); });
      // blush
      g.globalAlpha = 0.55; ell(1.3, 8.6, 1.5, 0.8, '#ff9eb0'); ell(14.7, 8.6, 1.5, 0.8, '#ff9eb0'); g.globalAlpha = 1;
      const nose = L.nose || 'none', nc = 'rgba(176,110,110,.75)';
      if (!L.animal && nose !== 'none'){
        if (nose === 'dot') ell(8, 7.2, 0.35, 0.3, nc);
        else if (nose === 'button') { ell(8, 7.2, 0.75, 0.55, 'rgba(255,170,170,.8)'); ell(7.75, 7.0, 0.22, 0.15, 'rgba(255,255,255,.7)'); }
        else if (nose === 'pink') ell(8, 7.2, 0.6, 0.45, '#ff8fa6');
        else if (nose === 'arc') arc(8, 6.9, 0.55, 0.15 * Math.PI, 0.85 * Math.PI, nc, 0.35);
        else if (nose === 'line') ln([[8.2, 6.0], [7.7, 7.3], [8.3, 7.4]], nc, 0.3);
        else if (nose === 'tri') { g.fillStyle = nc; g.beginPath(); g.moveTo(8, 6.6); g.lineTo(8.55, 7.5); g.lineTo(7.45, 7.5); g.fill(); }
        else if (nose === 'freckle') { ell(8, 7.2, 0.3, 0.25, nc); [[5.4, 7.6], [6.1, 8.0], [5.2, 8.3], [10.6, 7.6], [9.9, 8.0], [10.8, 8.3]].forEach(([x, y]) => ell(x, y, 0.18, 0.18, 'rgba(176,110,90,.6)')); }
        else if (nose === 'heart') { g.fillStyle = '#ff7f9f'; g.beginPath(); g.moveTo(8, 7.7); g.bezierCurveTo(7.0, 7.1, 7.4, 6.4, 8, 6.9); g.bezierCurveTo(8.6, 6.4, 9.0, 7.1, 8, 7.7); g.fill(); }
        else if (nose === 'piggy') { ell(8, 7.2, 0.8, 0.55, '#ffb0c0'); ell(7.7, 7.2, 0.14, 0.2, '#c0607a'); ell(8.3, 7.2, 0.14, 0.2, '#c0607a'); }
      }
      const mouth = L.mouth || 'smile', mc = '#b0566a';
      if (mouth === 'open') { g.fillStyle = '#8a3a4a'; g.beginPath(); g.moveTo(6.9, 8.6); g.quadraticCurveTo(8, 11.2, 9.1, 8.6); g.closePath(); g.fill(); ell(8, 9.8, 0.6, 0.35, '#f08a9a'); }
      else if (mouth === 'wavy') ln([[6.4, 9.0], [7.2, 8.4], [8, 9.0], [8.8, 8.4], [9.6, 9.0]], mc, 0.45);
      else if (mouth === 'o') { ell(8, 9.0, 0.7, 0.85, '#8a3a4a'); }
      else if (mouth === 'grin') { g.fillStyle = '#8a3a4a'; g.beginPath(); g.moveTo(6.5, 8.4); g.quadraticCurveTo(8, 10.6, 9.5, 8.4); g.closePath(); g.fill(); g.fillStyle = '#ffffff'; g.fillRect(6.9, 8.4, 2.2, 0.55); }
      else if (mouth === 'tongue') { arc(8, 8.2, 1.1, 0.2 * Math.PI, 0.8 * Math.PI, mc, 0.45); ell(8.35, 9.35, 0.5, 0.55, '#ff8098'); }
      else if (mouth === 'pout') { ell(8, 8.9, 0.75, 0.5, '#e0708a'); ln([[7.4, 8.9], [8.6, 8.9]], '#b0566a', 0.2); }
      else if (mouth === 'laugh') { g.fillStyle = '#8a3a4a'; g.beginPath(); g.moveTo(6.6, 8.3); g.lineTo(9.4, 8.3); g.quadraticCurveTo(9.3, 10.8, 8, 10.8); g.quadraticCurveTo(6.7, 10.8, 6.6, 8.3); g.fill(); ell(8, 10.1, 0.8, 0.45, '#f08a9a'); }
      else if (mouth === 'smirk') ln([[7.0, 8.9], [8.4, 8.9], [9.3, 8.3]], mc, 0.45);
      else if (mouth === 'tiny') arc(8, 8.5, 0.5, 0.2 * Math.PI, 0.8 * Math.PI, mc, 0.4);
      else if (mouth === 'cat') { arc(7.3, 8.7, 0.7, 0.1, Math.PI - 0.1, mc, 0.42); arc(8.7, 8.7, 0.7, 0.1, Math.PI - 0.1, mc, 0.42); }
      else arc(8, 8.2, 1.1, 0.25 * Math.PI, 0.75 * Math.PI, mc, 0.45);
      if (L.animal){
        const A = L.animal.type;
        g.fillStyle = A==='rabbit' || A==='sheep' ? '#ff9eb0' : A==='cat' ? '#ff8fa6' : '#5a3a3a'; g.beginPath(); g.moveTo(7.2, 7.1); g.quadraticCurveTo(8, 6.6, 8.8, 7.1); g.quadraticCurveTo(8, 8.2, 7.2, 7.1); g.fill();
        if (A === 'cat' || A === 'fox'){ g.strokeStyle = 'rgba(90,70,90,.55)'; g.lineWidth = 0.22; [[-1,0.6],[0,0.9],[1,1.2]].forEach(([d,y]) => { g.beginPath(); g.moveTo(5.2, 7.6 + d*0.5); g.lineTo(2.2, 7.2 + d*1.1); g.stroke(); g.beginPath(); g.moveTo(10.8, 7.6 + d*0.5); g.lineTo(13.8, 7.2 + d*1.1); g.stroke(); }); }
        if (A === 'rabbit'){ g.fillStyle = '#ffffff'; g.fillRect(7.55, 9.0, 0.9, 0.8); g.strokeStyle = 'rgba(176,86,106,.6)'; g.lineWidth = 0.15; g.strokeRect(7.55, 9.0, 0.9, 0.8); }
      }
      if (L.beard) { g.fillStyle = shade(hair, 0.95); g.beginPath(); g.moveTo(0.5, 7.2); g.quadraticCurveTo(1.5, 12.5, 8, 12); g.quadraticCurveTo(14.5, 12.5, 15.5, 7.2); g.lineTo(15.5, 12); g.lineTo(0.5, 12); g.fill(); g.beginPath(); g.ellipse(5.8, 9.0, 1.6, 0.55, 0.15, 0, Math.PI * 2); g.ellipse(10.2, 9.0, 1.6, 0.55, -0.15, 0, Math.PI * 2); g.fill(); arc(8, 9.2, 0.9, 0.2 * Math.PI, 0.8 * Math.PI, mc, 0.4); }
      if (F) {
        const c = F.c || '#2a2440';
        const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
        if (F.style === 'glasses') { g.strokeStyle = c; g.lineWidth = 0.5; E.forEach(x => { rr(x - 2.3, ey - 2.1, 4.6, 4.0, 1.0); g.stroke(); }); ln([[6.3, ey - 0.6], [9.7, ey - 0.6]], c, 0.45); }
        if (F.style === 'round') { E.forEach(x => arc(x, ey, 2.2, 0, Math.PI * 2, c, 0.42)); ln([[6.2, ey - 0.4], [9.8, ey - 0.4]], c, 0.4); }
        if (F.style === 'sun') { E.forEach(x => { g.fillStyle = c; rr(x - 2.4, ey - 1.8, 4.8, 3.4, 1.5); g.fill(); ell(x - 1, ey - 0.8, 0.7, 0.35, 'rgba(255,255,255,.45)'); }); ln([[6.4, ey - 0.8], [9.6, ey - 0.8]], c, 0.5); }
        if (F.style === 'heart') { E.forEach(x => { g.fillStyle = c; g.beginPath(); g.moveTo(x, ey + 2.2); g.bezierCurveTo(x - 3.2, ey, x - 1.8, ey - 2.6, x, ey - 1); g.bezierCurveTo(x + 1.8, ey - 2.6, x + 3.2, ey, x, ey + 2.2); g.fill(); ell(x - 1, ey - 0.6, 0.45, 0.3, 'rgba(255,255,255,.6)'); }); ln([[6.6, ey - 0.6], [9.4, ey - 0.6]], c, 0.45); }
        if (F.style === 'starsun') { E.forEach(x => { g.fillStyle = c; g.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 1.15 : 2.6, a = -Math.PI / 2 + k * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, ey + 0.1 + Math.sin(a) * r); } g.closePath(); g.fill(); ell(x - 0.7, ey - 0.6, 0.5, 0.3, 'rgba(255,255,255,.55)'); }); ln([[6.4, ey - 0.5], [9.6, ey - 0.5]], c, 0.45); }
        if (F.style === 'monocle') { arc(12, ey, 2.2, 0, Math.PI * 2, c, 0.5); g.fillStyle = 'rgba(200,230,255,.25)'; g.beginPath(); g.arc(12, ey, 2.0, 0, Math.PI * 2); g.fill(); ln([[13.6, ey + 1.5], [14.6, ey + 3.5], [15.6, ey + 5.5]], c, 0.25); }
        if (F.style === 'whiskers') { g.strokeStyle = c; g.lineWidth = 0.28; [[-0.5, 0], [0, 0.35], [0.5, 0.7]].forEach(([d, y]) => { g.beginPath(); g.moveTo(5.0, 8.0 + y); g.lineTo(1.8, 7.4 + d * 1.6); g.stroke(); g.beginPath(); g.moveTo(11.0, 8.0 + y); g.lineTo(14.2, 7.4 + d * 1.6); g.stroke(); }); ell(8, 7.4, 0.6, 0.45, '#ff8fa6'); }
        if (F.style === 'cheekheart') [1.6, 14.4].forEach(x => { g.fillStyle = c; g.beginPath(); g.moveTo(x, 9.6); g.bezierCurveTo(x - 1.4, 8.6, x - 0.8, 7.6, x, 8.3); g.bezierCurveTo(x + 0.8, 7.6, x + 1.4, 8.6, x, 9.6); g.fill(); ell(x - 0.35, 8.4, 0.2, 0.14, 'rgba(255,255,255,.7)'); });
        if (F.style === 'mask') { g.fillStyle = c; rr(2.6, 7.4, 10.8, 4.4, 1.6); g.fill(); ln([[2.6, 8.2], [0, 7.2]], shade(c, 0.85), 0.35); ln([[13.4, 8.2], [16, 7.2]], shade(c, 0.85), 0.35); ln([[4, 9.6], [12, 9.6]], shade(c, 0.9), 0.25); }
      }
    }, true, 24);
  }

  /* ---------- torso texture (64x32; front centred at x=32) ---------- */
  function topTex(THREE, T, lowerC) {
    const st = T.style, c1 = T.c1, c2 = T.c2 || '#ffffff';
    return canvasTex(THREE, 64, 32, (g, W, H) => {
      const px = (c, x, y, w = 1, h = 1) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      px(c1, 0, 0, W, H);
      const tuck = () => { if (lowerC) { px(lowerC, 0, 24, W, 8); px(shade(lowerC, 0.75), 0, 23, W, 1); } };
      switch (st) {
        case 'tee': px(shade(c1, 0.85), 27, 0, 10, 2); tuck(); break;
        case 'stripe': for (let y = 0; y < 24; y += 4) px(c2, 0, y + 2, W, 2); px(shade(c1, 0.85), 27, 0, 10, 2); tuck(); break;
        case 'dots': for (let y = 2; y < 24; y += 5) for (let x = (y % 2) * 3; x < W; x += 6) px(c2, x, y, 2, 2); tuck(); break;
        case 'check': for (let x = 0; x < W; x += 8) px(shade(c1, 0.75), x, 0, 3, H); for (let y = 0; y < H; y += 8) px(shade(c1, 0.75), 0, y, W, 3); for (let x = 0; x < W; x += 8) for (let y = 0; y < H; y += 8) px(c2, x + 1, y + 1, 1, 1); tuck(); break;
        case 'hoodie': px(shade(c1, 0.86), 24, 15, 16, 9); px(shade(c1, 0.8), 0, 28, W, 4); px('#ffffff', 29, 1, 1, 7); px('#ffffff', 34, 1, 1, 7); break;
        case 'sweater': for (let x = 2; x < W; x += 6) for (let y = 0; y < 28; y += 2) px(shade(c1, y % 4 ? 1.08 : 0.92), x, y, 2, 1); px(shade(c1, 0.8), 0, 28, W, 4); px(shade(c1, 0.8), 26, 0, 12, 2); break;
        case 'shirt': px('#f4f4f4', 0, 0, W, H); px('#ffffff', 26, 0, 5, 3); px('#ffffff', 33, 0, 5, 3); px(c2, 31, 1, 2, 2); px(c2, 30, 3, 4, 14); px(shade(c2, 0.8), 31, 16, 2, 2); tuck(); break;
        case 'sailor': px(c2, 22, 0, 20, 3); px(c2, 26, 3, 12, 3); px(c2, 29, 6, 6, 3); px('#ef4f5e', 29, 8, 6, 3); px('#ef4f5e', 28, 11, 2, 3); px('#ef4f5e', 34, 11, 2, 3); px(c2, 0, 0, 12, 10); px(c2, 52, 0, 12, 10); px('#ffffff', 0, 8, 12, 1); px('#ffffff', 52, 8, 12, 1); tuck(); break;
        case 'jacket': px('#ffffff', 29, 0, 6, 24); px(shade(c1, 0.8), 28, 0, 1, 26); px(shade(c1, 0.8), 35, 0, 1, 26); px('#ffd34e', 26, 8, 1, 1); px('#ffd34e', 26, 14, 1, 1); px(shade(c1, 0.85), 20, 6, 5, 4); px(shade(c1, 0.85), 39, 6, 5, 4); tuck(); break;
        case 'overalls': px(c2, 0, 0, W, H); px(c1, 0, 17, W, 15); px(c1, 24, 6, 16, 12); [26, 36].forEach(x => { px(c1, x, 0, 3, 8); px('#ffd34e', x, 6, 2, 2); }); [6, 54].forEach(x => px(c1, x, 0, 3, 17)); px(shade(c1, 0.82), 29, 10, 6, 4); break;
        case 'dress': px(c2, 0, 20, W, 3); break;
        case 'floral': for (let y = 2; y < H; y += 6) for (let x = (y % 4); x < W; x += 7) { px(c2, x, y, 1, 1); px(c2, x - 1, y + 1, 3, 1); px(c2, x, y + 2, 1, 1); px('#ffd34e', x, y + 1, 1, 1); } px('#ffffff', 0, 20, W, 2); break;
        case 'hanbok': px(c1, 0, 0, W, 20); px('#ffffff', 26, 0, 3, 12); px('#ffffff', 29, 10, 8, 2); px(c2, 0, 18, W, 2); px(c2, 33, 11, 3, 12); px(c2, 36, 11, 2, 9); px(lowerC || c2, 0, 20, W, 12); break;
        case 'robe': for (let i = 0; i < 26; i++) { const x = (i * 23) % W, y = (i * 11) % H; px(c2, x, y, 1, 1); if (i % 3 === 0) { px(c2, x - 1, y, 3, 1); px(c2, x, y - 1, 1, 3); } } px('#ffd34e', 0, 26, W, 2); break;
        case 'astro': px('#f2f4f8', 0, 0, W, H); px('#8a9ab8', 26, 6, 12, 8); px('#ef4f5e', 28, 8, 2, 2); px('#4fc7a4', 31, 8, 2, 2); px('#ffd34e', 34, 8, 2, 2); px('#3c6fd1', 18, 4, 5, 3); px('#c8ccd8', 0, 26, W, 2); break;
        case 'chef': px('#ffffff', 0, 0, W, H); [27, 36].forEach(x => [5, 10, 15].forEach(y => px('#c8ccd8', x, y, 2, 2))); px(c2, 22, 18, 20, 14); px(shade(c2, 0.85), 22, 18, 20, 1); break;
        case 'tux': px('#ffffff', 28, 0, 8, 26); px(c1, 0, 0, 28, H); px(c1, 36, 0, 28, H); px(c2, 29, 2, 6, 3); px('#24304a', 31, 9, 2, 1); px('#24304a', 31, 14, 2, 1); px(shade(c1, 0.75), 27, 0, 1, 24); px(shade(c1, 0.75), 36, 0, 1, 24); break;
        case 'rain': px(shade(c1, 0.85), 31, 0, 2, H); [6, 12, 18, 24].forEach(y => px('#ffffff', 29, y, 2, 2)); px(shade(c1, 0.8), 22, 16, 6, 4); px(shade(c1, 0.8), 36, 16, 6, 4); break;
        case 'dino': px(c2, 24, 4, 16, 22); px(shade(c2, 0.88), 24, 10, 16, 1); px(shade(c2, 0.88), 24, 16, 16, 1); px(shade(c2, 0.88), 24, 22, 16, 1); for (let x = 2; x < 22; x += 7) px(shade(c1, 0.8), x, 6 + (x % 3), 3, 3); break;
        case 'bear': px(c2, 24, 6, 16, 18); px(shade(c1, 0.8), 0, 28, W, 4); px('#ffffff', 31, 2, 2, 2); break;
        case 'pajama': for (let x = 0; x < W; x += 6) px(c2, x, 0, 2, H); px('#ffffff', 31, 2, 2, 22); [6, 12, 18].forEach(y => px(shade(c2, 0.8), 31, y, 2, 2)); break;
        case 'pirate': px('#ffffff', 22, 0, 20, H); for (let y = 0; y < H; y += 4) px(shade('#ffffff', 0.85), 22, y, 20, 1); px(c1, 0, 0, 22, H); px(c1, 42, 0, 22, H); px('#ffd34e', 20, 4, 2, 2); px('#ffd34e', 20, 12, 2, 2); px('#4a2a1a', 0, 22, W, 3); px('#ffd34e', 30, 22, 4, 3); break;
        case 'heart': { const hx = 32, hy = 10; g.fillStyle = c2; g.beginPath(); g.moveTo(hx, hy + 6); g.bezierCurveTo(hx - 8, hy, hx - 4, hy - 5, hx, hy - 1); g.bezierCurveTo(hx + 4, hy - 5, hx + 8, hy, hx, hy + 6); g.fill(); px(shade(c1, 0.85), 27, 0, 10, 2); tuck(); break; }
        case 'ribbon': px('#ffffff', 26, 0, 12, 3); g.fillStyle = c2; g.beginPath(); g.moveTo(32, 4); g.lineTo(26, 1); g.lineTo(26, 7); g.closePath(); g.fill(); g.beginPath(); g.moveTo(32, 4); g.lineTo(38, 1); g.lineTo(38, 7); g.closePath(); g.fill(); px(shade(c2, 0.8), 31, 3, 2, 2); px(c2, 30, 6, 2, 6); px(c2, 33, 6, 2, 5); tuck(); break;
        case 'cardigan': px(c2, 28, 0, 8, 26); px(shade(c1, 0.82), 27, 0, 1, 26); px(shade(c1, 0.82), 36, 0, 1, 26); [5, 10, 15, 20].forEach(y => px('#ffffff', 26, y, 1, 1)); px(shade(c1, 0.8), 0, 25, W, 3); break;
        case 'frill': for (let x = 22; x < 42; x += 3) px('#ffffff', x, 0, 2, 3 + (x % 2)); for (let y = 4; y < 22; y += 3) { px('#ffffff', 30, y, 4, 2); } px(shade(c1, 0.9), 0, 22, W, 1); tuck(); break;
        case 'varsity': px(c2, 0, 0, 20, H); px(c2, 44, 0, 20, H); px('#ffffff', 26, 0, 12, 2); px('#ffffff', 0, 26, W, 2); px('#ffffff', 22, 8, 2, 8); px('#ffffff', 24, 14, 3, 2); px('#ffffff', 27, 8, 2, 8); break;
        case 'apron': px('#ffffff', 22, 4, 20, 26); px('#ffffff', 24, 0, 3, 5); px('#ffffff', 37, 0, 3, 5); for (let x = 22; x < 42; x += 3) px(shade('#ffffff', 0.85), x, 29, 2, 1); px(c2, 29, 12, 6, 4); break;
        case 'starry': for (let i = 0; i < 30; i++) { const x = (i * 29) % W, y = (i * 13) % 26; px(i % 3 ? '#ffffff' : c2, x, y, 1, 1); if (i % 4 === 0) { px(c2, x - 1, y, 3, 1); px(c2, x, y - 1, 1, 3); } } px(c2, 0, 22, W, 2); break;
        case 'cherry': for (let y = 3; y < 22; y += 7) for (let x = (y % 2) * 4 + 2; x < W; x += 9) { px('#e8384f', x, y + 2, 2, 2); px('#e8384f', x + 3, y + 2, 2, 2); px('#4a8a3a', x + 2, y, 1, 2); px('#4a8a3a', x + 1, y - 1, 3, 1); } px('#ffffff', 0, 20, W, 2); break;
        case 'tennis': px(c2, 0, 0, W, 1); px(c2, 26, 0, 12, 2); px(c2, 0, 20, W, 1); px(c2, 40, 6, 3, 3); tuck(); break;
        case 'uniform': px('#ffffff', 26, 0, 12, 4); px(c2, 30, 3, 4, 3); px(c2, 31, 6, 2, 8); px(shade(c1, 0.8), 25, 0, 1, 24); px(shade(c1, 0.8), 38, 0, 1, 24); px('#ffd34e', 20, 8, 3, 3); tuck(); break;
        case 'berry': for (let y = 3; y < 24; y += 7) for (let x = (y % 2) * 5 + 2; x < W; x += 10) { px('#e8384f', x, y + 1, 4, 3); px('#e8384f', x + 1, y + 4, 2, 1); px('#fff2a8', x + 1, y + 2, 1, 1); px('#fff2a8', x + 3, y + 3, 1, 1); px('#5fbf5a', x + 1, y, 2, 1); } px(shade(c1, 0.88), 27, 0, 10, 2); tuck(); break;
        case 'puffer': for (let y = 3; y < 30; y += 6) px(shade(c1, 0.85), 0, y, W, 1); px(shade(c1, 0.75), 31, 0, 2, H); px('#ffffff', 31, 2, 1, 1); px(c2, 26, 0, 12, 3); break;
        case 'vest': px('#f4f4f4', 0, 0, W, H); px(c1, 0, 4, 26, 24); px(c1, 38, 4, 26, 24); px(c1, 26, 10, 12, 18); for (let x = 2; x < 62; x += 8) for (let y = 8; y < 26; y += 8) { px(c2, x + 3, y, 2, 1); px(c2, x + 2, y + 1, 4, 1); px(c2, x + 3, y + 2, 2, 1); } px('#ffffff', 28, 0, 3, 3); px('#ffffff', 33, 0, 3, 3); px(shade(c1, 0.8), 0, 26, W, 2); tuck(); break;
        case 'rainbow': ['#ff9a9a', '#ffc98a', '#fff09a', '#a8e6a8', '#9ad0ff', '#c8a8f0'].forEach((cc, k) => px(cc, 0, k * 4 + 2, W, 4)); px(shade(c1, 0.85), 0, 26, W, 6); px('#ffffff', 26, 0, 12, 2); break;
        case 'cloud': for (let i = 0; i < 7; i++) { const x = (i * 19) % W, y = 3 + (i * 7) % 16; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y + 2, 2.2, 0, Math.PI * 2); g.arc(x + 2.5, y + 1, 2.8, 0, Math.PI * 2); g.arc(x + 5, y + 2, 2.2, 0, Math.PI * 2); g.fill(); } px(shade(c1, 0.88), 27, 0, 10, 2); tuck(); break;
        case 'collar': for (let y = 6; y < 24; y += 5) for (let x = (y % 2) * 3 + 1; x < W; x += 6) px(c2, x, y, 1, 1); px(shade(c1, 0.92), 31, 4, 2, 18); tuck(); break;
        case 'bee': for (let y = 0; y < 30; y += 8) px('#2a2440', 0, y + 4, W, 4); px(shade(c1, 0.85), 26, 0, 12, 2); break;
        case 'penguin': px('#ffffff', 22, 2, 20, 28); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(32, 18, 11, 14, 0, 0, Math.PI * 2); g.fill(); px('#ffa53a', 30, 2, 4, 2); break;
        case 'prince': px('#ffffff', 28, 0, 8, 26); px('#ffcf3a', 27, 0, 1, 26); px('#ffcf3a', 36, 0, 1, 26); [5, 10, 15, 20].forEach(y => { px('#ffcf3a', 24, y, 2, 2); px('#ffcf3a', 38, y, 2, 2); px(shade(c1, 1.2), 26, y, 2, 1); px(shade(c1, 1.2), 36, y, 2, 1); }); px(c2, 0, 22, W, 3); px('#ffcf3a', 0, 25, W, 1); break;
        case 'idol': for (let i = 0; i < 70; i++) { const x = (i * 37) % W, y = (i * 17) % 28; px(i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? c2 : shade(c1, 1.25), x, y, 1, 1); } px(c2, 0, 0, W, 2); px(c2, 0, 26, W, 2); px('#ffffff', 31, 6, 2, 2); px('#ffffff', 30, 7, 4, 1); break;
        default: tuck();
      }
      g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(0, 0, W, H);
    });
  }


  /* ---------- hand-held instruments: built once, carried at the side, posed for playing by the game ---------- */
  const INST_STYLES = ['violin', 'ukulele', 'flute', 'tambourine', 'trumpet', 'maracas'];
  function buildInst(THREE, HI, add, toon, handL, handR) {
    const st = HI.style, m = toon(THREE, HI.c || '#c8784a'), g = new THREE.Group(); let bow = null, extra = null;
    const dark = toon(THREE, '#3a2a22');
    if (st === 'violin' || st === 'ukulele') {
      const big = st === 'violin', k = big ? 1 : 0.92;
      add(new THREE.SphereGeometry(0.1 * k, 16, 12), m, 0, 0, 0, g).scale.set(1, 1.3, 0.38);
      add(new THREE.SphereGeometry(0.08 * k, 16, 12), m, 0, 0.13 * k, 0, g).scale.set(1, 1, 0.38);
      if (big) { add(new THREE.BoxGeometry(0.03, 0.26, 0.022), dark, 0, 0.3, 0.012, g); add(new THREE.SphereGeometry(0.026, 10, 8), dark, 0, 0.45, 0, g).scale.set(0.8, 1.2, 0.8); add(new THREE.BoxGeometry(0.05, 0.03, 0.03), dark, 0, -0.1, 0.03, g); add(new THREE.BoxGeometry(0.012, 0.36, 0.006), toon(THREE, '#f2e6c8'), 0, 0.12, 0.04, g); }
      else { add(new THREE.CylinderGeometry(0.03, 0.03, 0.01, 14), dark, 0, 0.02, 0.036, g).rotation.x = Math.PI / 2; add(new THREE.BoxGeometry(0.035, 0.24, 0.022), toon(THREE, '#8a5a34'), 0, 0.3, 0.008, g); add(new THREE.BoxGeometry(0.05, 0.06, 0.026), toon(THREE, '#5a3a2a'), 0, 0.44, 0.004, g); add(new THREE.BoxGeometry(0.014, 0.34, 0.005), toon(THREE, '#f6efe6'), 0, 0.15, 0.04, g); }
      if (big) { bow = new THREE.Group(); const b1 = add(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 5), toon(THREE, '#6a3a22'), 0, 0.25, 0, bow); const b2 = add(new THREE.CylinderGeometry(0.004, 0.004, 0.46, 4), toon(THREE, '#fbf6ec'), 0.018, 0.25, 0, bow); b1.castShadow = b2.castShadow = false; }
    }
    if (st === 'flute') { add(new THREE.CylinderGeometry(0.014, 0.014, 0.5, 10), m, 0, 0, 0, g); for (let q = 0; q < 5; q++) add(new THREE.SphereGeometry(0.011, 6, 4), toon(THREE, '#a8b0c4'), 0, -0.12 + q * 0.06, 0.014, g); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#a8b0c4'), 0, 0.2, 0.014, g); }
    if (st === 'trumpet') { add(new THREE.CylinderGeometry(0.017, 0.017, 0.3, 10), m, 0, 0.15, 0, g); add(new THREE.ConeGeometry(0.065, 0.11, 16, 1, true), toon(THREE, HI.c, null, { side: THREE.DoubleSide }), 0, 0.33, 0, g).rotation.x = Math.PI; add(new THREE.CylinderGeometry(0.012, 0.008, 0.04, 8), m, 0, 0.0, 0, g); add(new THREE.TorusGeometry(0.04, 0.012, 6, 14, Math.PI), m, 0, 0.12, -0.04, g).rotation.set(0, Math.PI / 2, Math.PI / 2); [0, 1, 2].forEach(q => add(new THREE.CylinderGeometry(0.011, 0.011, 0.06, 6), toon(THREE, '#f2e6b0'), 0, 0.1 + q * 0.035, 0.035, g).rotation.x = Math.PI / 2); }
    if (st === 'tambourine') { const r = add(new THREE.TorusGeometry(0.11, 0.022, 8, 20), m, 0, 0, 0, g); add(new THREE.CircleGeometry(0.11, 20), toon(THREE, '#fff4e6', null, { side: THREE.DoubleSide }), 0, 0, 0, g); for (let q = 0; q < 6; q++) { const a = q / 6 * Math.PI * 2; add(new THREE.CylinderGeometry(0.024, 0.024, 0.01, 10), toon(THREE, '#e6e0ea'), Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0, g).rotation.x = Math.PI / 2; } }
    const mk = () => { const h = new THREE.Group(); add(new THREE.CylinderGeometry(0.012, 0.016, 0.14, 8), toon(THREE, '#e6c8a6'), 0, 0.07, 0, h); add(new THREE.SphereGeometry(0.07, 12, 10), m, 0, 0.19, 0, h).scale.set(1, 1.2, 1); [0, 1, 2].forEach(q => add(new THREE.SphereGeometry(0.018, 6, 4), toon(THREE, ['#ffe6a3', '#9fdcc4', '#ffffff'][q]), Math.cos(q * 2.1) * 0.065, 0.2, Math.sin(q * 2.1) * 0.065, h)); return h; };
    if (st === 'maracas') { g.add(mk()); extra = mk(); }
    // default: carried at the side in the right hand (handL, -x side); bow / 2nd maraca in the other hand
    carryInst(THREE, { style: st, g, bow, extra, handL, handR });
    return { style: st, g, bow, extra, handL, handR };
  }
  function carryInst(THREE, I) {
    const g = I.g, st = I.style; I.handL.add(g); g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1);
    if (st === 'violin' || st === 'ukulele') { g.position.set(0, -0.2, 0.05); g.rotation.set(0.15, -Math.PI / 2, 0); }
    else if (st === 'flute') { g.position.set(0, -0.01, 0.12); g.rotation.set(1.25, 0, 0); }
    else if (st === 'trumpet') { g.position.set(0, -0.01, -0.12); g.rotation.set(1.45, 0, 0); }
    else if (st === 'tambourine') { g.position.set(0, -0.11, 0.03); g.rotation.set(0, Math.PI / 2, 0); }
    else if (st === 'maracas') { g.position.set(0, 0, 0.02); g.rotation.set(1.0, 0, 0); }
    if (I.bow) { I.handR.add(I.bow); I.bow.position.set(0, 0, 0.02); I.bow.rotation.set(Math.PI - 0.2, 0, 0); I.bow.visible = false; }
    if (I.extra) { I.handR.add(I.extra); I.extra.position.set(0, 0, 0.02); I.extra.rotation.set(1.0, 0, 0); }
  }

  const hoodCache = {};
  function hoodGeo(THREE, R, al) {
    const k = R.toFixed(4) + '|' + al; if (hoodCache[k]) return hoodCache[k];
    const src = new THREE.SphereGeometry(R, 56, 36).toNonIndexed(), P = src.attributes.position, N = src.attributes.normal, keepP = [], keepN = [], ca = Math.cos(al - 0.03), cb = Math.cos(Math.PI * 0.82);
    for (let t = 0; t < P.count; t += 3) {
      let cx = 0, cy = 0, cz = 0, y0 = 9, y1 = -9; for (let v = 0; v < 3; v++) { const y = P.getY(t + v); cx += P.getX(t + v); cy += y; cz += P.getZ(t + v); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const l = Math.hypot(cx, cy, cz) || 1; if (cz / l > ca || (y0 + y1) / 2 / R < cb) continue; // band midpoint keeps whole quads → straight neck edge
      for (let v = 0; v < 3; v++) { keepP.push(P.getX(t + v), P.getY(t + v), P.getZ(t + v)); keepN.push(N.getX(t + v), N.getY(t + v), N.getZ(t + v)); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(keepP, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(keepN, 3));
    return hoodCache[k] = g;
  }
  function build(THREE, L) {
    const root = new THREE.Group();
    const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = false; (parent || root).add(m); return m; };
    const flatX = (shape, d) => { const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };
    const starX = (r, d) => { const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, rr = k % 2 ? r * 0.45 : r; k ? sh.lineTo(Math.sin(a) * rr, Math.cos(a) * rr) : sh.moveTo(0, r); } return flatX(sh, d); };
    const heartX = (r, d) => { const sh = new THREE.Shape(); sh.moveTo(0, -r); sh.bezierCurveTo(r * 1.4, -r * 0.1, r * 0.8, r * 1.05, 0, r * 0.45); sh.bezierCurveTo(-r * 0.8, r * 1.05, -r * 1.4, -r * 0.1, 0, -r); return flatX(sh, d); };
    const skinM = toon(THREE, L.skin);
    const hairM = toon(THREE, L.hairColor);
    const T = L.top || { style: 'tee', c1: '#ffffff', sleeve: 'short' };
    const Lo = L.lower || { style: 'pants', c: '#3a5a8c' };
    const sleeve = T.sleeve || 'short';
    const lowerStyle = Lo.style;
    const legsVisible = lowerStyle !== 'longskirt'; const pantsLike = lowerStyle === 'pants' || lowerStyle === 'cargo';

    // legs & shoes
    const legs = [];
    const shoes = L.shoes || { style: 'sneaker', c: '#f2f2f2' };
    [-1, 1].forEach(s => {
      const leg = new THREE.Group(); leg.position.set(0.085 * s, 0.33, 0); root.add(leg); legs.push(leg);
      if (lowerStyle === 'shorts') { add(new THREE.CapsuleGeometry(0.074, 0.05, 4, 10), toon(THREE, Lo.c), 0, -0.06, 0, leg); add(new THREE.CapsuleGeometry(0.06, 0.12, 4, 10), skinM, 0, -0.15, 0, leg); }
      else add(new THREE.CapsuleGeometry(0.068, 0.16, 4, 10), (pantsLike ? toon(THREE, Lo.c) : skinM), 0, -0.13, 0, leg);
      if (lowerStyle === 'cargo') { const pk = add(new THREE.BoxGeometry(0.035, 0.07, 0.07), toon(THREE, shade(Lo.c, 0.85)), 0.068 * s, -0.12, 0, leg); add(new THREE.BoxGeometry(0.038, 0.015, 0.072), toon(THREE, shade(Lo.c, 0.7)), 0.069 * s, -0.08, 0, leg); }
      const sc = toon(THREE, shoes.c || '#f2f2f2');
      if (shoes.style === 'boot') { add(new THREE.CylinderGeometry(0.078, 0.082, 0.16, 12), sc, 0, -0.2, 0, leg); }
      const shoe = add(new THREE.SphereGeometry(0.09, 12, 8), sc, 0, -0.27, 0.025, leg); shoe.scale.set(0.95, 0.62, 1.3);
      if (shoes.style === 'bunnyslipper' || shoes.style === 'bearslipper') { shoe.scale.set(1.15, 0.8, 1.45); const bunnyS = shoes.style === 'bunnyslipper'; [-1, 1].forEach(e => { const ear = add(bunnyS ? new THREE.CapsuleGeometry(0.018, 0.06, 4, 6) : new THREE.SphereGeometry(0.025, 8, 6), sc, 0.03 * e, bunnyS ? -0.2 : -0.22, 0.09, leg); if (bunnyS) ear.rotation.x = -0.4; }); [-1, 1].forEach(e => add(new THREE.SphereGeometry(0.009, 6, 4), toon(THREE, '#3a2e4a'), 0.025 * e, -0.25, 0.135, leg)); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, bunnyS ? '#ff9eb0' : '#5a3a2a'), 0, -0.262, 0.142, leg); }
      if (shoes.style === 'rollers') { add(new THREE.CylinderGeometry(0.078, 0.082, 0.12, 12), sc, 0, -0.21, 0, leg); [-0.05, 0.08].forEach(z => [-1, 1].forEach(e => { const w = add(new THREE.CylinderGeometry(0.028, 0.028, 0.025, 10), toon(THREE, shoes.c2 || '#ffd34e'), 0.045 * e, -0.335, z, leg); w.rotation.z = Math.PI / 2; })); add(new THREE.BoxGeometry(0.1, 0.02, 0.22), toon(THREE, '#e6e0f0'), 0, -0.31, 0.02, leg); }
      if (shoes.style === 'maryjane') { const st2 = add(new THREE.TorusGeometry(0.06, 0.009, 4, 12, Math.PI), toon(THREE, shade(shoes.c || '#d93a5a', 0.75)), 0, -0.25, 0.05, leg); st2.rotation.set(0, Math.PI / 2, 0); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#ffd34e'), 0.06 * s, -0.27, 0.05, leg); add(new THREE.SphereGeometry(0.02, 8, 6), toon(THREE, '#ffffff'), 0, -0.25, 0.12, leg).scale.set(1.3, 0.6, 0.6); }
      if (shoes.style === 'sneaker') { const sole = add(new THREE.CylinderGeometry(0.085, 0.085, 0.025, 12), toon(THREE, '#ffffff'), 0, -0.31, 0.03, leg); sole.scale.set(1, 1, 1.35); }
    });
    // body
    const body = add(new THREE.CapsuleGeometry(0.175, 0.17, 6, 16), toon(THREE, '#ffffff', topTex(THREE, T, Lo.c)), 0, 0.5, 0);
    body.scale.set(1.08, 1, 0.86); body.rotation.y = Math.PI;
    if (lowerStyle === 'skirt') { const sk = add(new THREE.CylinderGeometry(0.19, 0.3, 0.22, 20, 1, true), toon(THREE, Lo.c, null, { side: THREE.DoubleSide }), 0, 0.39, 0); add(new THREE.TorusGeometry(0.29, 0.017, 6, 24), toon(THREE, shade(Lo.c, 0.82)), 0, 0.28, 0).rotation.x = Math.PI / 2; }
    if (lowerStyle === 'tutu') { [0, 1].forEach(k => { const t = add(new THREE.CylinderGeometry(0.2, 0.36 - k * 0.05, 0.1, 22, 1, true), new THREE.MeshToonMaterial({ color: k ? shade(Lo.c, 1.05) : Lo.c, side: THREE.DoubleSide, gradientMap: gradMap }), 0, 0.37 - k * 0.04, 0); }); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; add(new THREE.SphereGeometry(0.03, 6, 4), toon(THREE, shade(Lo.c, 1.12)), Math.sin(a) * 0.34, 0.33, Math.cos(a) * 0.34).scale.set(1, 0.6, 1); } }
    if (lowerStyle === 'balloon') { const b = add(new THREE.SphereGeometry(0.25, 22, 14), toon(THREE, Lo.c), 0, 0.35, 0); b.scale.set(1.1, 0.62, 1.0); add(new THREE.TorusGeometry(0.2, 0.02, 6, 22), toon(THREE, shade(Lo.c, 0.8)), 0, 0.22, 0).rotation.x = Math.PI / 2; if (Lo.dots) for (let k = 0; k < 10; k++) { const a = k * 2.4, y = 0.3 + (k % 3) * 0.05; add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, Lo.dots), Math.sin(a) * 0.27, y, Math.cos(a) * 0.24); } }
    if (lowerStyle === 'longskirt') { add(new THREE.CylinderGeometry(0.19, 0.34, 0.42, 22, 1, true), toon(THREE, Lo.c, null, { side: THREE.DoubleSide }), 0, 0.27, 0); add(new THREE.TorusGeometry(0.335, 0.02, 6, 26), toon(THREE, shade(Lo.c, 0.82)), 0, 0.07, 0).rotation.x = Math.PI / 2; }
    if (T.style === 'hoodie') { const h = add(new THREE.TorusGeometry(0.13, 0.055, 8, 18, Math.PI * 1.2), toon(THREE, shade(T.c1, 0.92)), 0, 0.68, -0.04); h.rotation.set(Math.PI / 2 - 0.25, 0, Math.PI * 1.4); }
    if (T.style === 'puffer') [0.42, 0.53, 0.64].forEach(y => { const r = add(new THREE.TorusGeometry(y > 0.6 ? 0.155 : 0.18, 0.03, 8, 22), toon(THREE, shade(T.c1, 0.94)), 0, y, 0); r.rotation.x = Math.PI / 2; r.scale.set(1.08, 0.88, 1); });
    if (T.style === 'prince') [-1, 1].forEach(s => { add(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), toon(THREE, '#ffcf3a'), 0.17 * s, 0.66, 0); for (let k = 0; k < 4; k++) add(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 4), toon(THREE, '#ffcf3a'), 0.17 * s + (k - 1.5) * 0.025, 0.635, 0.04); });
    if (T.style === 'collar') { [-1, 1].forEach(s => { const c = add(new THREE.SphereGeometry(0.08, 12, 8), toon(THREE, T.c2 || '#ffffff'), 0.06 * s, 0.67, 0.1); c.scale.set(1.1, 0.35, 0.9); c.rotation.z = -0.25 * s; }); add(new THREE.SphereGeometry(0.02, 8, 6), toon(THREE, '#ff8fb3'), 0, 0.66, 0.15); }
    if (T.style === 'sailor' || T.style === 'astro') { const c = add(new THREE.TorusGeometry(0.11, 0.04, 6, 16), toon(THREE, T.style === 'astro' ? '#c8ccd8' : T.c2), 0, 0.69, 0); c.rotation.x = Math.PI / 2; }
    // arms
    const arms = [];
    let handR = null, handL = null;
    [-1, 1].forEach(s => {
      const arm = new THREE.Group(); arm.position.set(0.21 * s, 0.62, 0); arm.rotation.z = 0.28 * s; root.add(arm); arms.push(arm);
      const slM = toon(THREE, T.style === 'overalls' ? (T.c2 || '#ffffff') : (T.style === 'shirt' || T.style === 'vest') ? '#f4f4f4' : T.style === 'astro' ? '#f2f4f8' : T.style === 'chef' ? '#ffffff' : T.style === 'pirate' ? '#ffffff' : T.style === 'varsity' ? (T.c2 || '#ffffff') : T.c1);
      if (sleeve === 'long') add(new THREE.CapsuleGeometry(0.056, 0.15, 4, 10), slM, 0, -0.1, 0, arm);
      else { add(new THREE.CapsuleGeometry(0.058, 0.06, 4, 10), slM, 0, -0.045, 0, arm); add(new THREE.CapsuleGeometry(0.045, 0.09, 4, 10), skinM, 0, -0.15, 0, arm); }
      const hand = add(new THREE.SphereGeometry(0.058, 12, 8), sleeve === 'glove' ? toon(THREE, '#ffffff') : skinM, 0, -0.24, 0.01, arm);
      if (s > 0) handR = hand; else handL = hand;
    });
    // neck + head
    add(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 10), skinM, 0, 0.7, 0);
    const head = new THREE.Group(); head.position.set(0, 1.0, 0); root.add(head);
    const R = 0.36;
    add(new THREE.SphereGeometry(R, 28, 20), skinM, 0, 0, 0, head).scale.set(1.1, 0.98, 1);
    if (!L.animal) [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.06, 10, 8), skinM, 0.39 * s, -0.03, 0, head).scale.set(0.6, 1, 0.8));
    const face = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 20, 16, Math.PI / 2 - 0.5, 1.0, Math.PI / 2 - 0.3, 0.75), toon(THREE, '#ffffff', faceTex(THREE, L)));
    face.scale.set(1.1, 0.98, 1); head.add(face);

    // hair
    const H = L.hat || null, hst = H ? H.style : 'none';
    const hoodHat = ['dinohood', 'bearhood', 'ghosthood', 'penguinhood', 'helmet'].includes(hst);
    const coversBangs = ['cap', 'beanie', 'wizard', 'chef', 'rainhat', 'dinohood', 'bearhood', 'ghosthood', 'penguinhood', 'pirate', 'bucket', 'santa', 'froghat', 'berryhat'].includes(hst);
    const st = L.hair || 'short', HR = R * 1.075;
    if (!hoodHat || hst === 'helmet') {
      add(new THREE.SphereGeometry(HR, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), hairM, 0, 0, -0.01, head).scale.set(1.1, 1.02, 1.02);
      const backLen = { short: 0.62, bob: 0.74, long: 0.8, ponytail: 0.62, bun: 0.62, spiky: 0.6, twin: 0.66, wavy: 0.8, hime: 0.8, curly: 0.72, braid: 0.66, spacebuns: 0.64, sidepart: 0.64, fluffy: 0.76, bow: 0.62, afro: 0.7, mohawk: 0.5, topknot: 0.62, lowtwin: 0.66, wolf: 0.72, bowl: 0.6, halfup: 0.8, longcurl: 0.8, pixie: 0.56, sidetail: 0.64 }[st] || 0.62;
      add(new THREE.SphereGeometry(HR, 28, 16, Math.PI - 0.35, Math.PI + 0.7, 0, Math.PI * backLen), hairM, 0, 0, -0.01, head).scale.set(1.1, 1.02, 1.02);
      if (!coversBangs) for (let i = -2; i <= 2; i++) {
        const a = i * 0.36;
        const lock = add(new THREE.SphereGeometry(0.15, 14, 10), hairM, Math.sin(a) * HR * 0.98, 0.15 - Math.abs(i) * 0.025, Math.cos(a) * HR * 0.8, head);
        lock.scale.set(1.0, 0.62, 0.42); lock.rotation.set(-0.35, a, 0);
      }
      const hairStart = head.children.length;
      if (st === 'bob' || st === 'long') [-1, 1].forEach(s => { const l = add(new THREE.CapsuleGeometry(0.075, st === 'long' ? 0.42 : 0.14, 4, 10), hairM, 0.36 * s, st === 'long' ? -0.28 : -0.12, 0.1, head); l.rotation.z = 0.08 * s; });
      if (st === 'long') add(new THREE.CapsuleGeometry(0.3, 0.3, 6, 16), hairM, 0, -0.33, -0.2, head).scale.set(1.25, 1, 0.5);
      if (st === 'bob') add(new THREE.SphereGeometry(HR, 28, 10, Math.PI - 0.6, Math.PI + 1.2, Math.PI * 0.55, Math.PI * 0.22), hairM, 0, 0, 0, head).scale.set(1.16, 1.05, 1.08);
      if (st === 'ponytail') { add(new THREE.SphereGeometry(0.06, 10, 8), toon(THREE, '#ff6f91'), 0, 0.1, -0.38, head); add(new THREE.CapsuleGeometry(0.09, 0.26, 4, 12), hairM, 0, -0.1, -0.44, head).rotation.x = 0.35; }
      if (st === 'twin') [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.05, 10, 8), toon(THREE, '#ff6f91'), 0.36 * s, 0.08, -0.12, head); const t = add(new THREE.CapsuleGeometry(0.08, 0.22, 4, 12), hairM, 0.44 * s, -0.12, -0.16, head); t.rotation.z = -0.25 * s; });
      if (st === 'bun' && !coversBangs) { add(new THREE.SphereGeometry(0.15, 16, 12), hairM, 0, 0.4, -0.08, head); add(new THREE.TorusGeometry(0.11, 0.025, 6, 16), toon(THREE, '#ff6f91'), 0, 0.31, -0.06, head).rotation.x = Math.PI / 2; }
      const ribbonM = toon(THREE, '#ff6f91');
      if (st === 'wavy') { [-1, 1].forEach(s => { for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.1 - k * 0.006, 12, 10), hairM, (0.37 + Math.sin(k * 1.6) * 0.04) * s, -0.08 - k * 0.11, 0.05 - k * 0.02, head); }); for (let k = 0; k < 4; k++) [-0.16, 0, 0.16].forEach(x => add(new THREE.SphereGeometry(0.13, 12, 10), hairM, x + Math.sin(k * 1.7 + x * 9) * 0.04, -0.15 - k * 0.11, -0.27 + k * 0.01, head)); }
      if (st === 'hime') { [-1, 1].forEach(s => { add(new THREE.CapsuleGeometry(0.075, 0.2, 4, 10), hairM, 0.37 * s, -0.12, 0.14, head); add(new THREE.CapsuleGeometry(0.08, 0.46, 4, 10), hairM, 0.33 * s, -0.36, -0.1, head); }); add(new THREE.CapsuleGeometry(0.3, 0.36, 6, 16), hairM, 0, -0.38, -0.2, head).scale.set(1.25, 1, 0.5); }
      if (st === 'curly') { for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; add(new THREE.SphereGeometry(0.11, 10, 8), hairM, Math.sin(a) * HR * 1.02, -0.03 + Math.cos(k * 2.3) * 0.04, Math.cos(a) * HR * 0.95 - 0.02, head).visible = Math.cos(a) < 0.0; } [[-0.15, 0.3], [0.12, 0.33], [0, 0.36], [-0.25, 0.18], [0.25, 0.18]].forEach(([x, y]) => add(new THREE.SphereGeometry(0.12, 10, 8), hairM, x, y, -0.05, head)); [-0.2, 0, 0.2].forEach(x => add(new THREE.SphereGeometry(0.12, 10, 8), hairM, x, -0.2, -0.3, head)); }
      if (st === 'braid') { add(new THREE.SphereGeometry(0.05, 10, 8), ribbonM, 0.34, -0.1, -0.12, head); for (let k = 0; k < 5; k++) add(new THREE.SphereGeometry(0.085 - k * 0.007, 10, 8), hairM, 0.38 - k * 0.012, -0.18 - k * 0.1, 0.04 + k * 0.03, head); const bw = add(new THREE.TorusGeometry(0.035, 0.018, 6, 10), ribbonM, 0.33, -0.7, 0.17, head); }
      if (st === 'spacebuns' && !coversBangs) [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.13, 14, 10), hairM, 0.24 * s, 0.34, -0.06, head); const r = add(new THREE.TorusGeometry(0.1, 0.022, 6, 14), ribbonM, 0.2 * s, 0.27, -0.05, head); r.rotation.set(Math.PI / 2, 0, 0.5 * s); });
      if (st === 'sidepart') { const sw = add(new THREE.SphereGeometry(0.2, 14, 10), hairM, -0.15, 0.2, 0.25, head); sw.scale.set(1.3, 0.6, 0.5); sw.rotation.set(-0.4, 0, 0.35); add(new THREE.CapsuleGeometry(0.07, 0.12, 4, 10), hairM, -0.37, -0.08, 0.1, head); }
      if (st === 'fluffy') { for (let k = 0; k <= 10; k++) { const a = Math.PI * 0.5 + k / 10 * Math.PI; add(new THREE.SphereGeometry(0.15, 12, 10), hairM, Math.sin(a) * HR * 0.98, -0.1 + Math.cos(k * 1.9) * 0.025, Math.cos(a) * HR * 0.9 - 0.02, head); } [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.13, 12, 10), hairM, 0.36 * s, -0.12, 0.04, head)); }
      if (st === 'bow') { add(new THREE.CapsuleGeometry(0.09, 0.3, 4, 12), hairM, 0, 0.05, -0.46, head).rotation.x = 0.55; [-1, 1].forEach(s => { const b = add(new THREE.ConeGeometry(0.1, 0.16, 4), ribbonM, 0.1 * s, 0.26, -0.38, head); b.rotation.z = Math.PI / 2 * s; }); add(new THREE.SphereGeometry(0.045, 8, 6), ribbonM, 0, 0.26, -0.38, head); }
      if (st === 'afro') { for (let k = 0; k < 22; k++) { const a = k * 2.399, yy = 0.42 - (k / 22) * 0.6, r = Math.sqrt(Math.max(0, 1 - Math.pow((yy - 0.05) / 0.45, 2))) * 0.46; const sx = Math.sin(a) * r, sz = Math.cos(a) * r * 0.95 - 0.04; if (sz > 0.18 && yy < 0.2) continue; add(new THREE.SphereGeometry(0.15, 10, 8), hairM, sx, yy, sz, head); } }
      if (st === 'mohawk' && !H) for (let k = 0; k < 6; k++) { const c = add(new THREE.ConeGeometry(0.075, 0.24, 8), hairM, 0, 0.42 - Math.abs(k - 1.5) * 0.02, 0.22 - k * 0.11, head); c.rotation.x = -0.3 + k * 0.18; }
      if (st === 'topknot') { add(new THREE.SphereGeometry(0.12, 14, 10), hairM, 0, 0.47, -0.04, head); add(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 12), toon(THREE, '#5b4b78'), 0, 0.38, -0.04, head); }
      if (st === 'lowtwin') [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.045, 10, 8), ribbonM, 0.3 * s, -0.24, -0.2, head); const t = add(new THREE.CapsuleGeometry(0.075, 0.26, 4, 12), hairM, 0.33 * s, -0.44, -0.16, head); t.rotation.z = 0.12 * s; });
      if (st === 'wolf') { for (let k = 0; k < 7; k++) { const a = Math.PI * 0.6 + k / 6 * Math.PI * 0.8; const c = add(new THREE.ConeGeometry(0.08, 0.28, 6), hairM, Math.sin(a) * HR * 0.92, -0.2, Math.cos(a) * HR * 0.92 - 0.02, head); c.rotation.x = Math.PI; } [-1, 1].forEach(s => { const c = add(new THREE.ConeGeometry(0.07, 0.26, 6), hairM, 0.37 * s, -0.12, 0.08, head); c.rotation.x = Math.PI; }); }
      if (st === 'bowl') { const b = add(new THREE.SphereGeometry(HR * 1.08, 28, 10, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.16), hairM, 0, 0, -0.01, head); b.scale.set(1.12, 1.02, 1.05); }
      if (st === 'halfup') { add(new THREE.SphereGeometry(0.09, 12, 10), hairM, 0, 0.25, -0.38, head); add(new THREE.SphereGeometry(0.04, 8, 6), ribbonM, 0, 0.33, -0.36, head); add(new THREE.CapsuleGeometry(0.28, 0.34, 6, 16), hairM, 0, -0.36, -0.21, head).scale.set(1.25, 1, 0.5); [-1, 1].forEach(s => add(new THREE.CapsuleGeometry(0.075, 0.4, 4, 10), hairM, 0.36 * s, -0.28, 0.06, head)); }
      if (st === 'longcurl') { [-1, 1].forEach(s => { for (let k = 0; k < 6; k++) add(new THREE.TorusGeometry(0.06, 0.035, 6, 12), hairM, (0.37 + (k % 2) * 0.03) * s, -0.06 - k * 0.1, 0.04, head).rotation.y = Math.PI / 2; }); for (let k = 0; k < 5; k++) [-0.15, 0, 0.15].forEach(x => add(new THREE.SphereGeometry(0.1, 10, 8), hairM, x + (k % 2 ? 0.05 : -0.05), -0.12 - k * 0.1, -0.28, head)); }
      if (st === 'pixie') { const f = add(new THREE.SphereGeometry(0.17, 12, 10), hairM, 0.12, 0.24, 0.26, head); f.scale.set(1.3, 0.45, 0.5); f.rotation.z = -0.3; }
      if (st === 'sidetail') { add(new THREE.SphereGeometry(0.05, 10, 8), ribbonM, 0.36, 0.12, -0.16, head); const t = add(new THREE.CapsuleGeometry(0.09, 0.34, 4, 12), hairM, 0.46, -0.12, -0.18, head); t.rotation.z = -0.35; }
      if (st === 'spiky' && !H) [[-0.2, 0.05], [0, -0.1], [0.2, 0.02], [-0.1, 0.18], [0.12, 0.2]].forEach(([x, z]) => { const c = add(new THREE.ConeGeometry(0.08, 0.2, 8), hairM, x, 0.38, z, head); c.rotation.set(z * 1.5, 0, -x * 1.5); });
      if (H) { const extra = head.children.slice(hairStart); extra.forEach(o => { if (o.position.y > 0.02) head.remove(o); }); }
    }

    // hats
    if (H) {
      const c = H.c || '#3c6fd1', hm = toon(THREE, c), hd = toon(THREE, shade(c, 0.85));
      const dome = (r, th, y, sx = 1.1, sy = 1.0, sz = 1.04, m = hm) => { const mm = m.clone(); mm.side = THREE.DoubleSide; const d = add(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI * th), mm, 0, y, 0, head); d.scale.set(sx, sy, sz); return d; };
      switch (hst) {
        case 'cap': dome(HR * 1.04, 0.44, 0.02); { const v = add(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 20, 1, false, -Math.PI / 2, Math.PI), hd, 0, 0.09, 0.3, head); v.scale.set(1.25, 1, 0.9); } add(new THREE.SphereGeometry(0.03, 8, 6), hm, 0, 0.4, 0, head); break;
        case 'beanie': dome(HR * 1.06, 0.47, 0, 1.1, 1.08); { const r = add(new THREE.TorusGeometry(HR * 1.13, 0.045, 8, 28), hd, 0, 0.04, 0, head); r.rotation.x = Math.PI / 2; r.scale.set(1.04, 0.94, 1); } add(new THREE.SphereGeometry(0.08, 12, 10), toon(THREE, H.c2 || '#ffffff'), 0, 0.45, 0, head); break;
        case 'straw': { const b = add(new THREE.CylinderGeometry(0.62, 0.62, 0.03, 28), hm, 0, 0.2, 0, head); dome(HR * 0.95, 0.5, 0.2, 1.05, 0.8, 1.0); const band = add(new THREE.CylinderGeometry(0.36, 0.38, 0.07, 24, 1, true), toon(THREE, H.c2 || '#ef4f5e', null, { side: THREE.DoubleSide }), 0, 0.25, 0, head); band.scale.set(1.04, 1, 1); } break;
        case 'beret': { const b = add(new THREE.SphereGeometry(0.34, 22, 12), hm, -0.06, 0.3, -0.02, head); b.scale.set(1.15, 0.36, 1.1); b.rotation.z = 0.18; add(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6), hd, -0.08, 0.43, 0, head); } break;
        case 'crown': { const g = toon(THREE, '#ffcf3a'); add(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 18, 1, true), toon(THREE, '#ffcf3a', null, { side: THREE.DoubleSide }), 0, 0.38, 0, head); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; add(new THREE.ConeGeometry(0.04, 0.1, 6), g, Math.sin(a) * 0.19, 0.47, Math.cos(a) * 0.19, head); add(new THREE.SphereGeometry(0.022, 8, 6), toon(THREE, k % 2 ? '#ef4f5e' : '#3c6fd1'), Math.sin(a) * 0.205, 0.38, Math.cos(a) * 0.205, head); } } break;
        case 'bunny': { const b = add(new THREE.TorusGeometry(0.4, 0.02, 6, 20, Math.PI), hm, 0, 0.12, 0.0, head); b.rotation.y = Math.PI / 2; b.scale.set(1, 1.0, 1.08); [-1, 1].forEach(s => { const e = add(new THREE.CapsuleGeometry(0.06, 0.28, 4, 10), hm, 0.13 * s, 0.6, -0.02, head); e.rotation.z = -0.15 * s; const inn = add(new THREE.CapsuleGeometry(0.03, 0.2, 4, 8), toon(THREE, '#ffb3c6'), 0.13 * s + 0.0, 0.6, 0.04, head); inn.rotation.z = -0.15 * s; }); } break;
        case 'cat': [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(0.1, 0.17, 4), hm, 0.2 * s, 0.4, 0.0, head); e.rotation.set(0, Math.PI / 4, -0.35 * s); const i2 = add(new THREE.ConeGeometry(0.05, 0.1, 4), toon(THREE, '#ffb3c6'), 0.2 * s, 0.39, 0.04, head); i2.rotation.set(0, Math.PI / 4, -0.35 * s); }); break;
        case 'flower': { const r = add(new THREE.TorusGeometry(0.33, 0.03, 6, 24), toon(THREE, '#5aa84a'), 0, 0.28, -0.02, head); r.rotation.x = Math.PI / 2 - 0.15; r.scale.set(1.1, 1, 1); const cols = ['#ff7fa8', '#ffd34e', '#ffffff', '#b48cf2']; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; add(new THREE.SphereGeometry(0.055, 10, 8), toon(THREE, cols[k % 4]), Math.sin(a) * 0.36, 0.28 + Math.cos(a) * 0.05, Math.cos(a) * 0.33 - 0.02, head); } } break;
        case 'party': { const p = add(new THREE.ConeGeometry(0.14, 0.34, 16), hm, 0.05, 0.5, 0, head); p.rotation.z = -0.15; add(new THREE.SphereGeometry(0.045, 8, 6), toon(THREE, H.c2 || '#ffd34e'), 0.08, 0.68, 0, head); } break;
        case 'wizard': { add(new THREE.CylinderGeometry(0.58, 0.58, 0.03, 28), hm, 0, 0.18, 0, head); const c2 = add(new THREE.ConeGeometry(0.33, 0.62, 20), hm, 0, 0.48, -0.02, head); c2.rotation.x = -0.18; add(new THREE.SphereGeometry(0.05, 8, 6), toon(THREE, '#ffd34e'), 0.0, 0.45, 0.26, head); dome(HR * 1.04, 0.42, 0.02); } break;
        case 'chef': { add(new THREE.CylinderGeometry(0.33, 0.33, 0.16, 22), toon(THREE, '#ffffff'), 0, 0.33, 0, head); const p = add(new THREE.SphereGeometry(0.3, 20, 12), toon(THREE, '#ffffff'), 0, 0.5, 0, head); p.scale.set(1.25, 0.75, 1.2); dome(HR * 1.04, 0.36, 0.02, 1.1, 1, 1.04, toon(THREE, '#ffffff')); } break;
        case 'rainhat': { dome(HR * 1.05, 0.45, 0.02); const b = add(new THREE.CylinderGeometry(0.42, 0.52, 0.06, 26, 1, true), toon(THREE, c, null, { side: THREE.DoubleSide }), 0, 0.12, 0, head); b.scale.set(1.05, 1, 1.1); } break;
        case 'pirate': { const h = add(new THREE.SphereGeometry(0.36, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), hm, 0, 0.12, 0, head); h.scale.set(1.15, 0.9, 1.1); const brim = add(new THREE.TorusGeometry(0.36, 0.07, 6, 3), hm, 0, 0.16, 0, head); brim.rotation.x = Math.PI / 2; brim.scale.set(1.3, 1.1, 0.6); add(new THREE.SphereGeometry(0.05, 8, 6), toon(THREE, '#ffffff'), 0, 0.3, 0.33, head); } break;
        case 'dinohood': case 'bearhood': case 'ghosthood': case 'penguinhood': {
          // closed hood: a whole shell with one round face opening (rim sits exactly on its edge) and the neck left open underneath
          const hg2 = new THREE.Group(); hg2.position.set(0, -0.02, -0.01); hg2.scale.set(1.1, 1.04, 1.04); head.add(hg2);
          const HRh = HR * 1.12, al = 0.78;
          add(hoodGeo(THREE, HRh, al), toon(THREE, c, null, { side: THREE.DoubleSide }), 0, 0, 0, hg2);
          add(new THREE.TorusGeometry(HRh * Math.sin(al), 0.055, 10, 40), hd, 0, 0, HRh * Math.cos(al), hg2);
          if (hst === 'bearhood') [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.1, 12, 10), hm, 0.27 * s, 0.33, -0.02, head).scale.set(1, 1, 0.6); add(new THREE.SphereGeometry(0.055, 10, 8), toon(THREE, H.c2 || '#f2d2b0'), 0.27 * s, 0.33, 0.04, head).scale.set(1, 1, 0.5); });
          else if (hst === 'dinohood') for (let k = 0; k < 5; k++) { const a = -0.3 + k * 0.42; const sp = add(new THREE.ConeGeometry(0.06, 0.13, 6), toon(THREE, H.c2 || '#ffd34e'), 0, 0.42 * Math.cos(a), -0.42 * Math.sin(a), head); sp.rotation.x = -a; }
          if (hst === 'penguinhood') { const bk = add(new THREE.ConeGeometry(0.05, 0.1, 10), toon(THREE, '#ffa53a'), 0, 0.33, 0.33, head); bk.rotation.x = Math.PI / 2 + 0.3; [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.03, 8, 6), toon(THREE, '#ffffff'), 0.1 * s, 0.4, 0.3, head); add(new THREE.SphereGeometry(0.016, 6, 4), toon(THREE, '#2a2440'), 0.1 * s, 0.405, 0.325, head); }); }
          if (hst === 'dinohood') for (let k = -2; k <= 2; k++) add(new THREE.ConeGeometry(0.025, 0.05, 4), toon(THREE, '#ffffff'), k * 0.07, 0.2, 0.33, head).rotation.x = Math.PI;
        } break;
        case 'pumpkin': { const pm = toon(THREE, c); [-1, 0, 1].forEach(k => { const b = add(new THREE.SphereGeometry(0.13, 16, 12), pm, 0.05 + k * 0.07, 0.43, 0, head); b.scale.set(0.75, 0.82, 1.15); }); add(new THREE.CylinderGeometry(0.022, 0.03, 0.09, 8), toon(THREE, '#5a8a3a'), 0.06, 0.56, 0, head).rotation.z = -0.25; const lf = add(new THREE.SphereGeometry(0.05, 10, 8), toon(THREE, '#7ac25a'), 0.12, 0.56, 0.02, head); lf.scale.set(1.3, 0.3, 0.8); } break;
        case 'bonnet': { dome(HR * 1.06, 0.5, 0.0, 1.1, 1.05, 1.06); const br = add(new THREE.TorusGeometry(0.36, 0.06, 8, 26, Math.PI * 1.2), hm, 0, 0.02, 0.06, head); br.rotation.set(0, 0, -0.1 * Math.PI); br.scale.set(1.15, 1.05, 1); [-1, 1].forEach(s => { const r = add(new THREE.CapsuleGeometry(0.014, 0.28, 4, 6), toon(THREE, H.c2 || '#ff8fb3'), 0.33 * s, -0.25, 0.1, head); r.rotation.z = 0.25 * s; }); const bw = new THREE.Group(); bw.position.set(0.3, 0.22, 0.2); head.add(bw); [-1, 1].forEach(s => { const b = add(new THREE.ConeGeometry(0.06, 0.1, 10), toon(THREE, H.c2 || '#ff8fb3'), 0.05 * s, 0, 0, bw); b.rotation.z = Math.PI / 2 * s; }); add(new THREE.SphereGeometry(0.025, 8, 6), toon(THREE, H.c2 || '#ff8fb3'), 0, 0, 0, bw); add(new THREE.SphereGeometry(0.04, 8, 6), toon(THREE, '#ffd34e'), -0.28, 0.25, 0.2, head); add(new THREE.SphereGeometry(0.035, 8, 6), toon(THREE, '#ffffff'), -0.22, 0.3, 0.22, head); } break;
        case 'froghat': { dome(HR * 1.07, 0.47, 0.0, 1.1, 1.06); [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.1, 14, 10), hm, 0.17 * s, 0.4, 0.06, head); add(new THREE.SphereGeometry(0.075, 12, 10), toon(THREE, '#ffffff'), 0.17 * s, 0.42, 0.11, head); add(new THREE.SphereGeometry(0.04, 10, 8), toon(THREE, '#2a2440'), 0.17 * s, 0.43, 0.17, head); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#ffffff'), 0.16 * s, 0.45, 0.2, head); }); const r = add(new THREE.TorusGeometry(HR * 1.12, 0.04, 8, 28), hd, 0, 0.03, 0, head); r.rotation.x = Math.PI / 2; r.scale.set(1.04, 0.94, 1); [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.03, 8, 6), toon(THREE, '#ff9eb0'), 0.3 * s, 0.2, 0.28, head).scale.set(1, 0.6, 0.4)); } break;
        case 'chick': { const g2 = new THREE.Group(); g2.position.set(0.02, 0.4, 0); head.add(g2); add(new THREE.SphereGeometry(0.12, 14, 12), toon(THREE, '#ffe066'), 0, 0.05, 0, g2).scale.set(1.05, 0.9, 1); add(new THREE.SphereGeometry(0.085, 14, 12), toon(THREE, '#ffe066'), 0, 0.17, 0.03, g2); const bk = add(new THREE.ConeGeometry(0.025, 0.05, 8), toon(THREE, '#ff9a3a'), 0, 0.16, 0.12, g2); bk.rotation.x = Math.PI / 2; [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#2a2440'), 0.035 * s, 0.19, 0.1, g2); const w = add(new THREE.SphereGeometry(0.05, 10, 8), toon(THREE, '#ffd84a'), 0.11 * s, 0.05, 0, g2); w.scale.set(0.4, 0.8, 1); w.rotation.z = 0.4 * s; }); const tf = add(new THREE.ConeGeometry(0.015, 0.05, 6), toon(THREE, '#ffe066'), 0, 0.27, 0.02, g2); tf.rotation.z = 0.3; } break;
        case 'sunflower': { for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2; const p = add(new THREE.SphereGeometry(0.08, 10, 8), toon(THREE, k % 2 ? '#ffd23a' : '#ffc21a'), Math.sin(a) * 0.46, 0.02 + Math.cos(a) * 0.44, 0.08, head); p.scale.set(0.55, 1.2, 0.35); p.rotation.z = -a; } const rim = add(new THREE.TorusGeometry(0.38, 0.05, 8, 28), toon(THREE, '#8a5a2a'), 0, 0.02, 0.1, head); rim.scale.set(1.12, 1.05, 1); } break;
        case 'headphones': { const b = add(new THREE.TorusGeometry(0.42, 0.03, 8, 26, Math.PI), hm, 0, 0.02, 0, head); b.scale.set(1.06, 1.0, 1); [-1, 1].forEach(s => { const cup = add(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 18), hm, 0.44 * s, -0.02, 0, head); cup.rotation.z = Math.PI / 2; const pad = add(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 16), toon(THREE, H.c2 || '#ffffff'), 0.48 * s, -0.02, 0, head); pad.rotation.z = Math.PI / 2; const d = add(heartX(0.04, 0.012), toon(THREE, H.c2 || '#ffffff'), 0.485 * s, -0.02, 0, head); d.rotation.y = Math.PI / 2 * s; }); } break;
        case 'bucket': { dome(HR * 1.05, 0.46, 0.02); const br = add(new THREE.CylinderGeometry(0.4, 0.52, 0.09, 26, 1, true), toon(THREE, c, null, { side: THREE.DoubleSide }), 0, 0.1, 0, head); br.scale.set(1.08, 1, 1.1); const bd = add(new THREE.CylinderGeometry(0.405, 0.405, 0.05, 26, 1, true), toon(THREE, H.c2 || '#ffffff', null, { side: THREE.DoubleSide }), 0, 0.17, 0, head); bd.scale.set(1.07, 1, 1.02); } break;
        case 'earmuffs': { const b = add(new THREE.TorusGeometry(0.41, 0.018, 6, 24, Math.PI), toon(THREE, '#e6e0f0'), 0, 0.02, -0.02, head); b.scale.set(1.08, 1.0, 1); [-1, 1].forEach(s => { for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; add(new THREE.SphereGeometry(0.06, 10, 8), hm, 0.44 * s, -0.03 + Math.cos(a) * 0.05, -0.02 + Math.sin(a) * 0.05, head); } add(new THREE.SphereGeometry(0.075, 12, 10), toon(THREE, shade(c, 1.08)), 0.46 * s, -0.03, -0.02, head); }); } break;
        case 'santa': { dome(HR * 1.05, 0.45, 0.02, 1.1, 1.0, 1.04, toon(THREE, '#e8384f')); const cn = add(new THREE.ConeGeometry(0.3, 0.42, 20), toon(THREE, '#e8384f'), -0.08, 0.5, -0.06, head); cn.rotation.z = 0.55; const r = add(new THREE.TorusGeometry(HR * 1.1, 0.07, 10, 28), toon(THREE, '#ffffff'), 0, 0.08, 0, head); r.rotation.x = Math.PI / 2; r.scale.set(1.05, 0.95, 1); add(new THREE.SphereGeometry(0.08, 12, 10), toon(THREE, '#ffffff'), -0.3, 0.6, -0.08, head); } break;
        case 'berryhat': { dome(HR * 1.07, 0.48, 0.0, 1.1, 1.08); for (let k = 0; k < 16; k++) { const a = k * 2.4, el = 0.3 + (k % 4) * 0.2; add(new THREE.SphereGeometry(0.014, 6, 4), toon(THREE, '#fff2a8'), Math.sin(a) * Math.cos(el) * 0.43, Math.sin(el) * 0.41, Math.cos(a) * Math.cos(el) * 0.42, head).scale.set(0.7, 1.2, 0.7); } for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const lf = add(new THREE.ConeGeometry(0.05, 0.16, 6), toon(THREE, '#5fbf5a'), Math.sin(a) * 0.09, 0.4, Math.cos(a) * 0.09, head); lf.rotation.set(Math.cos(a) * 1.1, 0, -Math.sin(a) * 1.1); } add(new THREE.CylinderGeometry(0.015, 0.02, 0.08, 6), toon(THREE, '#4a8a3a'), 0, 0.46, 0, head); } break;
        case 'bee': { const b = add(new THREE.TorusGeometry(0.405, 0.02, 6, 24, Math.PI), toon(THREE, '#2a2440'), 0, 0.02, 0, head); b.scale.set(1.08, 1, 1); [-1, 1].forEach(s => { const a = add(new THREE.CapsuleGeometry(0.01, 0.2, 4, 6), toon(THREE, '#2a2440'), 0.12 * s, 0.5, 0, head); a.rotation.z = -0.35 * s; add(new THREE.SphereGeometry(0.04, 10, 8), toon(THREE, '#ffd23a'), 0.17 * s, 0.62, 0, head); }); } break;
        case 'starband': break;
        case 'helmet': { const g = add(new THREE.SphereGeometry(0.5, 24, 18), new THREE.MeshToonMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.32, gradientMap: gradMap }), 0, 0.03, 0.02, head); g.castShadow = false; const r = add(new THREE.TorusGeometry(0.32, 0.06, 8, 24), toon(THREE, '#c8ccd8'), 0, -0.38, 0, head); r.rotation.x = Math.PI / 2; } break;
      }
    }


    // accessories (장신구)
    const AC = L.acc;
    if (AC) {
      const am = c => toon(THREE, c);
      const headPt = (az, el, r) => [Math.sin(az) * Math.cos(el) * r * 1.1, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r];
      const bodyR = y => y > 0.585 ? Math.sqrt(Math.max(0.0004, 0.175 * 0.175 - (y - 0.585) * (y - 0.585))) : 0.175;
      const chain = (top, drop, n, sr, mat) => { const g = new THREE.SphereGeometry(sr, 8, 6); for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, f = Math.max(0, Math.cos(a)), y = top - f * f * drop, rr = bodyR(y); add(g, mat, Math.sin(a) * (rr * 1.08 + 0.012), y, Math.cos(a) * (rr * 0.86 + 0.012)); } return { y: top - drop, z: bodyR(top - drop) * 0.86 + 0.03 }; };
      const flat = (shape, d) => { const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2); return g; };
      const starG = (r, d) => { const sh = new THREE.Shape(); for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, rr = k % 2 ? r * 0.45 : r; k ? sh.lineTo(Math.sin(a) * rr, Math.cos(a) * rr) : sh.moveTo(0, r); } return flat(sh, d); };
      const heartG = (r, d) => { const sh = new THREE.Shape(); sh.moveTo(0, -r); sh.bezierCurveTo(r * 1.4, -r * 0.1, r * 0.8, r * 1.05, 0, r * 0.45); sh.bezierCurveTo(-r * 0.8, r * 1.05, -r * 1.4, -r * 0.1, 0, -r); return flat(sh, d); };
      const pin = (az, el) => { const g = new THREE.Group(); const p = headPt(az, el, 0.42); g.position.set(p[0], p[1], p[2]); g.lookAt(p[0] * 3, p[1] * 3, p[2] * 3); head.add(g); g.scale.setScalar(1.3); return g; };
      const gold = am('#f2c95a'), silver = am('#e8e6f0');
      const hatOn = !!H && !['flower', 'bunny', 'cat', 'party'].includes(hst);
      switch (AC.style) {
        case 'pearl': chain(0.675, 0.075, 16, 0.032, am('#f3e8fa')); break;
        case 'locket': { const p = chain(0.675, 0.09, 30, 0.01, gold); add(heartG(0.06, 0.025), am(AC.c || '#ff7fa8'), 0, p.y - 0.045, p.z + 0.005); } break;
        case 'clover': { const p = chain(0.675, 0.09, 30, 0.01, silver); [[0, 0.028], [0.028, 0], [0, -0.028], [-0.028, 0]].forEach(([x, y]) => add(new THREE.SphereGeometry(0.025, 10, 8), am(AC.c || '#5fbf5a'), x, p.y - 0.045 + y, p.z + 0.005).scale.set(1, 1, 0.45)); add(new THREE.SphereGeometry(0.01, 6, 4), am('#ffffff'), 0, p.y - 0.045, p.z + 0.02); } break;
        case 'crystal': { const p = chain(0.675, 0.09, 30, 0.01, silver); const gm = new THREE.MeshToonMaterial({ color: '#8fd0ff', transparent: true, opacity: 0.9, gradientMap: gradMap }); const o = add(new THREE.OctahedronGeometry(0.06), gm, 0, p.y - 0.06, p.z + 0.01); o.scale.set(0.8, 1.35, 0.6); } break;
        case 'choker': { const t = add(new THREE.TorusGeometry(0.135, 0.024, 8, 26), am(AC.c || '#9a86e0'), 0, 0.665, 0); t.rotation.x = Math.PI / 2; t.scale.set(1.08, 0.86, 1); add(new THREE.SphereGeometry(0.04, 12, 10), gold, 0, 0.62, 0.135); } break;
        case 'starear': case 'moonear': [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.012, 6, 4), gold, 0.415 * s, -0.08, 0.03, head);
          if (AC.style === 'starear') { const st = add(starG(0.05, 0.016), am(AC.c || '#ffd34e'), 0.425 * s, -0.15, 0.03, head); st.rotation.y = Math.PI / 2 * s; }
          else { const mo = add(new THREE.TorusGeometry(0.04, 0.014, 6, 14, Math.PI * 1.25), am(AC.c || '#ffe08a'), 0.425 * s, -0.15, 0.03, head); mo.rotation.set(0, Math.PI / 2 * s, -0.6); } }); break;
        case 'ribbon': { const g = pin(1.05, 0.62); [-1, 1].forEach(s => { const b = add(new THREE.ConeGeometry(0.08, 0.14, 12), am(AC.c || '#ff8fb3'), 0.07 * s, 0, 0, g); b.rotation.z = Math.PI / 2 * s; b.scale.set(1, 1, 0.55); const t = add(new THREE.CapsuleGeometry(0.018, 0.08, 4, 6), am(AC.c || '#ff8fb3'), 0.03 * s, -0.07, 0, g); t.rotation.z = 0.35 * s; }); add(new THREE.SphereGeometry(0.035, 10, 8), am(shade(AC.c || '#ff8fb3', 0.85)), 0, 0, 0.01, g); } break;
        case 'sakura': { const g = pin(-0.95, 0.55); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; const pt = add(new THREE.SphereGeometry(0.035, 10, 8), am(AC.c || '#ffc2d6'), Math.sin(a) * 0.04, Math.cos(a) * 0.04, 0, g); pt.scale.set(1, 1, 0.4); } add(new THREE.SphereGeometry(0.018, 8, 6), am('#ffd34e'), 0, 0, 0.012, g); const g2 = pin(-1.2, 0.4); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + 0.4; add(new THREE.SphereGeometry(0.024, 8, 6), am('#ffe4ee'), Math.sin(a) * 0.027, Math.cos(a) * 0.027, 0, g2).scale.set(1, 1, 0.4); } } break;
        case 'butterfly': { const g = pin(0.95, 0.5); g.rotation.z += 0.3; [-1, 1].forEach(s => { const w1 = add(new THREE.SphereGeometry(0.06, 12, 8), am(AC.c || '#c8b0f8'), 0.055 * s, 0.03, 0, g); w1.scale.set(0.9, 1.1, 0.2); w1.rotation.z = -0.5 * s; const w2 = add(new THREE.SphereGeometry(0.042, 10, 8), am(AC.c2 || '#ffb3d9'), 0.045 * s, -0.045, 0, g); w2.scale.set(0.9, 1, 0.2); w2.rotation.z = 0.4 * s; }); add(new THREE.CapsuleGeometry(0.012, 0.08, 4, 6), am('#5b4b78'), 0, 0, 0.01, g); } break;
        case 'rainbow': { const g = pin(-1.0, 0.55); ['#ff8a8a', '#ffd36a', '#8fdca0', '#8fb8f0'].forEach((cc, k) => add(new THREE.TorusGeometry(0.075 - k * 0.016, 0.009, 6, 16, Math.PI), am(cc), 0, -0.02, 0, g)); [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.026, 8, 6), am('#ffffff'), 0.06 * s, -0.025, 0.01, g)); } break;
        case 'tiara': if (!hatOn) { const bm = add(new THREE.TorusGeometry(0.3, 0.014, 6, 24, Math.PI), silver, 0, 0.27, -0.02, head); bm.rotation.x = Math.PI / 2 - 0.3; bm.scale.set(1.12, 1, 1);
          [[Math.PI / 2, 0.13, AC.c || '#ff9fc8'], [Math.PI / 2 - 0.55, 0.08, '#bfe8ff'], [Math.PI / 2 + 0.55, 0.08, '#bfe8ff']].forEach(([ph, h, gc]) => { const x = Math.cos(ph) * 0.3 * 1.12, z = Math.sin(ph) * 0.3 * Math.cos(0.3) - 0.02, y = 0.27 + Math.sin(ph) * 0.3 * Math.sin(0.3); add(new THREE.ConeGeometry(0.03, h, 6), silver, x, y + h / 2, z, head); const gm = add(new THREE.OctahedronGeometry(0.026), am(gc), x, y + 0.03, z + 0.02, head); gm.scale.set(1, 1.3, 0.6); }); } break;
        case 'halo': { const t = add(new THREE.TorusGeometry(0.2, 0.026, 8, 28), new THREE.MeshBasicMaterial({ color: AC.c || '#ffe27a' }), 0, 0.56, -0.03, head); t.rotation.x = Math.PI / 2 - 0.25; t.castShadow = false; } break;
        case 'sparkle': { const g = new THREE.Group(); g.position.set(0, 1.0, 0); root.add(g); ['#ffe27a', '#ffb3d9', '#bfe8ff', '#c8b0f8', '#b9f0d0'].forEach((cc, k) => { const a = k / 5 * Math.PI * 2; const st = add(starG(0.045, 0.012), new THREE.MeshBasicMaterial({ color: cc }), Math.sin(a) * 0.58, 0.05 + Math.sin(k * 2.1) * 0.18, Math.cos(a) * 0.58, g); st.castShadow = false; st.userData.tw = k; }); root.userData.spin = g; } break;
        case 'starband': if (!hatOn) { const b = add(new THREE.TorusGeometry(0.405, 0.022, 6, 24, Math.PI), am(AC.c || '#ffd34e'), 0, 0.02, 0.02, head); b.scale.set(1.08, 1, 1); [-0.45, 0, 0.45].forEach((x, k) => { const st = add(starG(k === 1 ? 0.07 : 0.05, 0.02), am(k === 1 ? (AC.c2 || '#ff9fc8') : (AC.c || '#ffd34e')), x * 0.55, 0.4 - Math.abs(x) * 0.12, 0.05, head); st.rotation.z = x * 0.6; }); } break;
        case 'lei': { const cs = ['#ff8fb3', '#ffd36a', '#ffffff', '#c8b0f8', '#8fdca0']; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, f = Math.max(0, Math.cos(a)), y = 0.67 - f * f * 0.09, rr = bodyR(y); const fl = add(new THREE.SphereGeometry(0.03, 8, 6), am(cs[k % 5]), Math.sin(a) * (rr * 1.08 + 0.02), y, Math.cos(a) * (rr * 0.86 + 0.02)); fl.scale.set(1, 0.7, 1); } } break;
        case 'scarf': { const sc2 = am(AC.c || '#ef4f5e'); const t = add(new THREE.TorusGeometry(0.115, 0.045, 10, 24), sc2, 0, 0.68, 0); t.rotation.x = Math.PI / 2; t.scale.set(1.1, 0.95, 1); const tl = add(new THREE.BoxGeometry(0.07, 0.17, 0.035), sc2, 0.06, 0.58, 0.13); tl.rotation.z = 0.12; for (let k = 0; k < 3; k++) add(new THREE.BoxGeometry(0.012, 0.03, 0.03), am(AC.c2 || '#ffffff'), 0.04 + k * 0.022, 0.485, 0.135); [0.62, 0.66, 0.7].forEach(y => { const st = add(new THREE.TorusGeometry(0.12, 0.008, 4, 24), am(AC.c2 || '#ffffff'), 0, y, 0); st.rotation.x = Math.PI / 2; st.scale.set(1.12, 0.98, 1); }); } break;
        case 'cherryear': [-1, 1].forEach(s => { const g = new THREE.Group(); g.position.set(0.42 * s, -0.08, 0.03); head.add(g); add(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 4), am('#4a8a3a'), 0.012, -0.03, 0, g).rotation.z = 0.35; add(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 4), am('#4a8a3a'), -0.012, -0.03, 0, g).rotation.z = -0.35; [-1, 1].forEach(e => { add(new THREE.SphereGeometry(0.025, 10, 8), am(AC.c || '#e8384f'), 0.025 * e, -0.075, 0, g); add(new THREE.SphereGeometry(0.007, 4, 4), am('#ffffff'), 0.025 * e - 0.008, -0.068, 0.018, g); }); const lf = add(new THREE.SphereGeometry(0.02, 6, 4), am('#5fbf5a'), 0.02, 0.005, 0, g); lf.scale.set(1.4, 0.5, 0.8); }); break;
        case 'cloud': { const g = new THREE.Group(); g.position.set(0.05, 1.66, -0.02); root.add(g); const wm = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradMap }); [[0, 0, 0.09], [0.09, -0.01, 0.07], [-0.09, -0.01, 0.07], [0.04, 0.05, 0.07], [-0.04, 0.05, 0.065]].forEach(([x, y, r]) => { const c = add(new THREE.SphereGeometry(r, 12, 10), wm, x, y, 0, g); c.castShadow = false; }); [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.008, 6, 4), am('#3a2e4a'), 0.03 * s, 0.0, 0.085, g)); add(new THREE.SphereGeometry(0.012, 6, 4), am('#ff9eb0'), 0.06, -0.015, 0.075, g); [0, 1, 2].forEach(k => { const d = add(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: AC.c || '#8fd0ff' }), (k - 1) * 0.06, -0.12 - (k % 2) * 0.05, 0, g); d.scale.set(0.7, 1.3, 0.7); d.castShadow = false; }); root.userData.cloud = g; } break;
        case 'antler': if (!hatOn) { const band = add(new THREE.TorusGeometry(0.405, 0.022, 6, 24, Math.PI), am(AC.c || '#ffb3c6'), 0, 0.02, 0.02, head); band.scale.set(1.08, 1.0, 1); const an = am(AC.c2 || '#7a4a2c');
          [-1, 1].forEach(s => { const g = new THREE.Group(); g.position.set(0.2 * s, 0.36, 0.02); g.rotation.z = -0.3 * s; head.add(g); add(new THREE.CapsuleGeometry(0.03, 0.16, 4, 8), an, 0, 0.1, 0, g); const b1 = add(new THREE.CapsuleGeometry(0.025, 0.08, 4, 8), an, 0.06 * s, 0.13, 0, g); b1.rotation.z = -0.9 * s; const b2 = add(new THREE.CapsuleGeometry(0.024, 0.07, 4, 8), an, -0.04 * s, 0.2, 0, g); b2.rotation.z = 0.7 * s; }); } break;
      }
    }
    // animal folk: ears + tail
    if (L.animal){
      const A = L.animal.type, fm = toon(THREE, L.animal.fur), im = toon(THREE, L.animal.inner || '#ffd6e0');
      if (A === 'rabbit') [-1, 1].forEach(s => { const e = add(new THREE.CapsuleGeometry(0.075, 0.34, 6, 12), fm, 0.13 * s, 0.55, -0.04, head); e.rotation.z = -0.16 * s; e.scale.set(1, 1, 0.7); const i = add(new THREE.CapsuleGeometry(0.04, 0.26, 4, 10), im, 0.13 * s + 0.005 * s, 0.55, 0.0, head); i.rotation.z = -0.16 * s; i.scale.set(1, 1, 0.5); });
      if (A === 'cat' || A === 'fox') [-1, 1].forEach(s => { const big = A === 'fox'; const e = add(new THREE.ConeGeometry(big ? 0.14 : 0.11, big ? 0.3 : 0.2, 14), fm, 0.22 * s, big ? 0.4 : 0.36, -0.02, head); e.rotation.set(0, 0, -0.38 * s); e.scale.set(1, 1, 0.65); const i = add(new THREE.ConeGeometry(big ? 0.08 : 0.06, big ? 0.18 : 0.12, 12), im, 0.215 * s, big ? 0.39 : 0.35, 0.03, head); i.rotation.set(0, 0, -0.38 * s); i.scale.set(1, 1, 0.4); });
      if (A === 'rabbit') add(new THREE.SphereGeometry(0.1, 14, 10), toon(THREE, L.animal.tail || '#ffffff'), 0, 0.34, -0.22);
      if (A === 'dog') [-1, 1].forEach(s => { const e = add(new THREE.CapsuleGeometry(0.08, 0.2, 6, 12), fm, 0.36 * s, 0.12, -0.02, head); e.rotation.z = 0.35 * s; e.scale.set(1, 1, 0.55); });
      if (A === 'dog'){ const t = add(new THREE.CapsuleGeometry(0.05, 0.16, 4, 10), fm, 0, 0.42, -0.28); t.rotation.x = 0.7; }
      if (A === 'bear' || A === 'panda') [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.1, 14, 10), toon(THREE, A === 'panda' ? '#3a3440' : L.animal.fur), 0.26 * s, 0.33, -0.03, head).scale.set(1, 1, 0.6); add(new THREE.SphereGeometry(0.055, 10, 8), im, 0.26 * s, 0.33, 0.02, head).scale.set(1, 1, 0.4); });
      if (A === 'bear' || A === 'panda') add(new THREE.SphereGeometry(0.07, 10, 8), fm, 0, 0.3, -0.22);
      if (A === 'sheep'){ [-1, 1].forEach(s => { const e = add(new THREE.SphereGeometry(0.08, 12, 10), toon(THREE, L.animal.inner || '#f6d6c8'), 0.38 * s, 0.05, 0, head); e.scale.set(1.5, 0.7, 0.8); e.rotation.z = -0.3 * s; }); for (let k = 0; k < 9; k++){ const a2 = k / 9 * Math.PI * 2; add(new THREE.SphereGeometry(0.11, 12, 10), fm, Math.cos(a2) * 0.25, 0.3 + Math.sin(a2 * 2) * 0.03, Math.sin(a2) * 0.22 - 0.02, head); } add(new THREE.SphereGeometry(0.09, 10, 8), fm, 0, 0.32, -0.22); }
      if (A === 'cat'){ const t1 = add(new THREE.CapsuleGeometry(0.045, 0.28, 4, 10), fm, 0, 0.33, -0.3); t1.rotation.x = -1.0; const t2 = add(new THREE.CapsuleGeometry(0.045, 0.22, 4, 10), fm, 0, 0.55, -0.45); t2.rotation.x = 0.25; }
      if (A === 'fox'){ const t = add(new THREE.SphereGeometry(0.16, 16, 12), fm, 0, 0.36, -0.38); t.scale.set(0.9, 0.9, 2.0); t.rotation.x = -0.55; add(new THREE.SphereGeometry(0.1, 12, 10), toon(THREE, '#fff8f0'), 0, 0.55, -0.63); }
    }
    // back
    const B = L.back;
    if (B) {
      const bm = toon(THREE, B.c || '#ef4f5e');
      if (B.style === 'backpack') { const p = add(new THREE.CapsuleGeometry(0.13, 0.08, 4, 12), bm, 0, 0.52, -0.2); p.scale.set(1.05, 1, 0.6); add(new THREE.CapsuleGeometry(0.08, 0.02, 4, 10), toon(THREE, shade(B.c, 0.85)), 0, 0.45, -0.28).scale.set(1, 1, 0.5); [-1, 1].forEach(s => { const st2 = add(new THREE.TorusGeometry(0.12, 0.016, 4, 12, Math.PI), toon(THREE, shade(B.c, 0.75)), 0.1 * s, 0.55, -0.02); st2.rotation.set(0, Math.PI / 2, 0); st2.scale.set(1, 1.2, 1.6); }); }
      if (B.style === 'cape') { const c = add(new THREE.CylinderGeometry(0.16, 0.34, 0.6, 20, 1, true, Math.PI / 2 + 0.6, Math.PI * 2 - 1.2 - Math.PI * 0.9), toon(THREE, B.c, null, { side: THREE.DoubleSide }), 0, 0.38, -0.03); add(new THREE.TorusGeometry(0.11, 0.025, 6, 16), toon(THREE, '#ffd34e'), 0, 0.68, 0).rotation.x = Math.PI / 2; }
      if (B.style === 'wings') [-1, 1].forEach(s => { const w = add(new THREE.SphereGeometry(0.2, 14, 10), toon(THREE, B.c || '#ffffff'), 0.17 * s, 0.62, -0.22); w.scale.set(0.5, 1.0, 0.18); w.rotation.set(0.2, 0.5 * s, -0.6 * s); const w2 = add(new THREE.SphereGeometry(0.13, 12, 8), toon(THREE, B.c2 || B.c || '#ffffff'), 0.25 * s, 0.5, -0.23); w2.scale.set(0.5, 1, 0.18); w2.rotation.set(0.2, 0.5 * s, -1.0 * s); });
      if (B.style === 'bearpack') { const p = add(new THREE.SphereGeometry(0.15, 16, 12), bm, 0, 0.52, -0.22); p.scale.set(1, 1, 0.65); [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.05, 10, 8), bm, 0.11 * s, 0.65, -0.24); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#2a2440'), 0.045 * s, 0.55, -0.32); const st2 = add(new THREE.TorusGeometry(0.12, 0.016, 4, 12, Math.PI), toon(THREE, shade(B.c, 0.75)), 0.1 * s, 0.55, -0.02); st2.rotation.set(0, Math.PI / 2, 0); st2.scale.set(1, 1.2, 1.6); }); add(new THREE.SphereGeometry(0.04, 10, 8), toon(THREE, '#f2d2b0'), 0, 0.5, -0.31).scale.set(1.2, 0.9, 0.6); add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#3a2a2a'), 0, 0.51, -0.335); }
      if (B.style === 'bflywings') [-1, 1].forEach(s => { const w = new THREE.Group(); w.position.set(0.08 * s, 0.62, -0.24); w.rotation.y = 0.35 * s; w.scale.setScalar(1.45); root.add(w); const u = add(new THREE.SphereGeometry(0.2, 16, 10), new THREE.MeshToonMaterial({ color: B.c || '#ffb3d9', transparent: true, opacity: 0.88, gradientMap: gradMap }), 0.18 * s, 0.1, 0, w); u.scale.set(0.9, 1.1, 0.08); u.rotation.z = -0.5 * s; const l = add(new THREE.SphereGeometry(0.13, 14, 10), new THREE.MeshToonMaterial({ color: B.c2 || '#c8b0f8', transparent: true, opacity: 0.88, gradientMap: gradMap }), 0.13 * s, -0.12, 0, w); l.scale.set(0.9, 1.1, 0.08); l.rotation.z = 0.5 * s; [[0.22, 0.16], [0.12, -0.14]].forEach(([x, y]) => add(new THREE.SphereGeometry(0.035, 8, 6), toon(THREE, '#ffffff'), x * s, y, 0.012, w).scale.set(1, 1, 0.2)); });
      if (B.style === 'turtle') { const sh = add(new THREE.SphereGeometry(0.22, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), bm, 0, 0.47, -0.16); sh.rotation.x = -Math.PI / 2; sh.scale.set(1.05, 0.75, 1.15); const rim = add(new THREE.TorusGeometry(0.21, 0.025, 6, 22), toon(THREE, B.c2 || '#f2e0a0'), 0, 0.47, -0.16); rim.scale.set(1.05, 1.15, 1); [[0, 0.47], [0.1, 0.56], [-0.1, 0.56], [0.1, 0.38], [-0.1, 0.38], [0, 0.62], [0, 0.32]].forEach(([x, y]) => add(new THREE.SphereGeometry(0.05, 6, 4), toon(THREE, shade(B.c, 0.8)), x, y, -0.33 + (x * x + (y - 0.47) * (y - 0.47)) * 3.2).scale.set(1, 1, 0.3)); }
      if (B.style === 'foxtail') { const t = add(new THREE.SphereGeometry(0.15, 16, 12), bm, 0, 0.36, -0.36); t.scale.set(0.9, 0.9, 2.1); t.rotation.x = -0.6; add(new THREE.SphereGeometry(0.095, 12, 10), toon(THREE, B.c2 || '#fff8f0'), 0, 0.56, -0.61); }
      if (B.style === 'dragon') [-1, 1].forEach(s => { const w = new THREE.Group(); w.position.set(0.08 * s, 0.6, -0.2); w.rotation.y = 0.5 * s; root.add(w); add(new THREE.CapsuleGeometry(0.02, 0.32, 4, 8), toon(THREE, B.c2 || '#7a5ac8'), 0.15 * s, 0.1, 0, w).rotation.z = -1.0 * s; for (let k = 0; k < 3; k++) { const m2 = add(new THREE.ConeGeometry(0.09, 0.3, 4), toon(THREE, B.c || '#a88ae8'), (0.12 + k * 0.08) * s, -0.04 + k * 0.03, 0, w); m2.scale.set(1, 1, 0.15); m2.rotation.z = Math.PI + (0.25 + k * 0.3) * s; } }); 
      if (B.style === 'beewings') [-1, 1].forEach(s => { const m2 = new THREE.MeshToonMaterial({ color: '#e8f6ff', transparent: true, opacity: 0.7, gradientMap: gradMap }); const w = add(new THREE.SphereGeometry(0.13, 12, 8), m2, 0.13 * s, 0.66, -0.22); w.scale.set(0.5, 1.0, 0.1); w.rotation.set(0.2, 0.5 * s, -0.7 * s); const w2 = add(new THREE.SphereGeometry(0.08, 10, 8), m2, 0.15 * s, 0.53, -0.22); w2.scale.set(0.5, 1, 0.1); w2.rotation.set(0.2, 0.5 * s, -1.4 * s); });
      if (B.style === 'batwings') [-1, 1].forEach(s => { const wg = new THREE.Group(); wg.position.set(0.1 * s, 0.6, -0.2); wg.rotation.set(0, 0.45 * s, 0); root.add(wg); add(new THREE.CapsuleGeometry(0.018, 0.34, 4, 8), toon(THREE, B.c2 || '#6a4f8a'), 0.17 * s, 0.08, 0, wg).rotation.z = -1.0 * s; for (let k = 0; k < 3; k++) { const m2 = add(new THREE.SphereGeometry(0.11, 12, 8), toon(THREE, B.c || '#3a2f4a'), (0.1 + k * 0.09) * s, -0.02 + k * 0.05, 0, wg); m2.scale.set(0.55, 1.0, 0.12); m2.rotation.z = (0.3 + k * 0.25) * s; } });
      if (B.style === 'tail') { const t = add(new THREE.ConeGeometry(0.12, 0.42, 12), bm, 0, 0.3, -0.33); t.rotation.x = -1.2; for (let k = 0; k < 3; k++) add(new THREE.ConeGeometry(0.035, 0.07, 6), toon(THREE, B.c2 || '#ffd34e'), 0, 0.38 - k * 0.04, -0.24 - k * 0.12); }
      if (B.style === 'guitar') { const gb = add(new THREE.SphereGeometry(0.15, 14, 10), bm, 0.05, 0.4, -0.24); gb.scale.set(1, 1.2, 0.35); const n = add(new THREE.BoxGeometry(0.05, 0.45, 0.03), toon(THREE, '#7a4f2c'), -0.05, 0.72, -0.24); n.rotation.z = 0.3; }
    }
    // hand item (right hand)
    const HI = L.hand; let instInfo = null;
    if (HI && handR) {
      const hg = new THREE.Group(); hg.position.copy(handR.position); handR.parent.add(hg);
      const m = toon(THREE, HI.c || '#ef4f5e');
      if (HI.style === 'balloon') { const line = add(new THREE.CylinderGeometry(0.004, 0.004, 0.75, 4), toon(THREE, '#ffffff'), 0, 0.37, 0, hg); line.castShadow = false; const b = add(new THREE.SphereGeometry(0.16, 16, 12), m, 0, 0.82, 0, hg); b.scale.set(1, 1.15, 1); }
      if (HI.style === 'umbrella') { hg.rotation.z = -0.28; add(new THREE.CylinderGeometry(0.012, 0.012, 1.2, 6), toon(THREE, '#5a4a3a'), 0, 0.58, 0, hg); add(new THREE.ConeGeometry(0.6, 0.32, 10, 1, true), toon(THREE, HI.c, null, { side: THREE.DoubleSide }), 0, 1.22, 0, hg); add(new THREE.SphereGeometry(0.025, 6, 4), toon(THREE, '#5a4a3a'), 0, 1.39, 0, hg); }
      if (HI.style === 'bouquet') { add(new THREE.ConeGeometry(0.07, 0.2, 10), toon(THREE, '#fff4e6'), 0, 0.06, 0.04, hg).rotation.x = Math.PI; ['#ff7fa8', '#ffd34e', '#ef4f5e', '#b48cf2'].forEach((cc, k) => add(new THREE.SphereGeometry(0.045, 8, 6), toon(THREE, cc), Math.sin(k * 1.6) * 0.05, 0.19, Math.cos(k * 1.6) * 0.05 + 0.04, hg)); }
      if (HI.style === 'lollipop') { add(new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), toon(THREE, '#ffffff'), 0, 0.1, 0.03, hg); const d = add(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), m, 0, 0.25, 0.03, hg); d.rotation.x = Math.PI / 2; add(new THREE.TorusGeometry(0.05, 0.012, 6, 14), toon(THREE, '#ffffff'), 0, 0.25, 0.05, hg); }
      if (HI.style === 'teddy') { add(new THREE.SphereGeometry(0.08, 12, 10), m, 0, 0.03, 0.07, hg); add(new THREE.SphereGeometry(0.065, 12, 10), m, 0, 0.14, 0.07, hg); [-1, 1].forEach(s => add(new THREE.SphereGeometry(0.025, 8, 6), m, 0.05 * s, 0.2, 0.07, hg)); }
      if (INST_STYLES.includes(HI.style)) { hg.parent.remove(hg); instInfo = buildInst(THREE, HI, add, toon, handL, handR); }
      if (HI.style === 'wand') { hg.rotation.z = -0.35; hg.scale.setScalar(1.35); add(new THREE.CylinderGeometry(0.01, 0.012, 0.32, 6), toon(THREE, '#ffffff'), 0, 0.14, 0.03, hg); const st = add(starX(0.07, 0.025), toon(THREE, HI.c || '#ffd34e'), 0, 0.33, 0.03, hg); [0, 1, 2].forEach(k => add(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: ['#ffb3d9', '#bfe8ff', '#fff2a8'][k] }), Math.sin(k * 2.1) * 0.1, 0.36 + Math.cos(k * 2.1) * 0.06, 0.03, hg)); add(new THREE.ConeGeometry(0.02, 0.04, 6), toon(THREE, '#ff8fb3'), 0, 0.29, 0.03, hg).rotation.x = Math.PI; }
      if (HI.style === 'cottoncandy') { hg.scale.setScalar(1.3); add(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 6), toon(THREE, '#f6efe6'), 0, 0.1, 0.03, hg); [[0, 0.3, 0.03, 0.09], [0.06, 0.27, 0.03, 0.07], [-0.06, 0.28, 0.04, 0.07], [0, 0.36, 0.02, 0.07], [0.03, 0.31, 0.09, 0.06]].forEach(([x, y, z, r], k) => add(new THREE.SphereGeometry(r, 12, 10), toon(THREE, k % 2 ? (HI.c2 || '#bfe0ff') : (HI.c || '#ffb3d9')), x, y, z, hg)); }
      if (HI.style === 'pinwheel') { hg.scale.setScalar(1.3); add(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), toon(THREE, '#f6efe6'), 0, 0.15, 0.03, hg); const pw = new THREE.Group(); pw.position.set(0, 0.34, 0.05); hg.add(pw); ['#ff8a8a', '#ffd36a', '#8fdca0', '#8fb8f0'].forEach((cc, k) => { const tr = new THREE.Shape(); tr.moveTo(0, 0); tr.lineTo(0.09, 0.02); tr.lineTo(0.02, 0.09); tr.lineTo(0, 0); const m2 = add(flatX(tr, 0.006), toon(THREE, cc), 0, 0, 0, pw); m2.rotation.z = k * Math.PI / 2; }); add(new THREE.SphereGeometry(0.014, 6, 4), toon(THREE, '#ffffff'), 0, 0.34, 0.06, hg); }
      if (HI.style === 'boba') { hg.scale.setScalar(1.3); const cup = add(new THREE.CylinderGeometry(0.05, 0.04, 0.13, 14), new THREE.MeshToonMaterial({ color: HI.c || '#e8c8a8', transparent: true, opacity: 0.92, gradientMap: gradMap }), 0, 0.05, 0.05, hg); add(new THREE.SphereGeometry(0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshToonMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, gradientMap: gradMap }), 0, 0.115, 0.05, hg); for (let k = 0; k < 6; k++) add(new THREE.SphereGeometry(0.012, 6, 4), toon(THREE, '#3a2420'), Math.sin(k * 1.1) * 0.025, 0.0 + (k % 2) * 0.012, 0.05 + Math.cos(k * 1.1) * 0.025, hg); const sw = add(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6), toon(THREE, HI.c2 || '#ff8fb3'), 0.015, 0.17, 0.05, hg); sw.rotation.z = -0.2; }
      if (HI.style === 'catplush') { hg.scale.setScalar(1.3); const pm = toon(THREE, HI.c || '#f2b06a'); add(new THREE.SphereGeometry(0.07, 12, 10), pm, 0, 0.02, 0.07, hg); add(new THREE.SphereGeometry(0.07, 12, 10), pm, 0, 0.13, 0.07, hg).scale.set(1.15, 0.95, 1); [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(0.03, 0.05, 4), pm, 0.045 * s, 0.2, 0.07, hg); e.rotation.z = -0.3 * s; add(new THREE.SphereGeometry(0.009, 6, 4), toon(THREE, '#2a2440'), 0.025 * s, 0.14, 0.135, hg); }); add(new THREE.SphereGeometry(0.008, 6, 4), toon(THREE, '#ff8fa6'), 0, 0.125, 0.14, hg); const tl = add(new THREE.CapsuleGeometry(0.014, 0.08, 4, 6), pm, 0.07, 0.03, 0.03, hg); tl.rotation.z = -0.8; }
      if (HI.style === 'lantern') { hg.scale.setScalar(1.3); add(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 4), toon(THREE, '#5a4a3a'), 0, 0.02, 0.04, hg); const lb = add(new THREE.SphereGeometry(0.08, 14, 10), new THREE.MeshBasicMaterial({ color: HI.c || '#ffb35a' }), 0, -0.1, 0.04, hg); lb.scale.set(1, 1.15, 1); lb.castShadow = false; [-0.19, -0.01].forEach(y => add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), toon(THREE, '#b04a3a'), 0, y, 0.04, hg)); add(new THREE.CapsuleGeometry(0.008, 0.06, 4, 4), toon(THREE, '#ffd34e'), 0, -0.24, 0.04, hg); }
      if (HI.style === 'heartballoon') { hg.rotation.z = -0.3; const line = add(new THREE.CylinderGeometry(0.004, 0.004, 1.0, 4), toon(THREE, '#ffffff'), 0, 0.5, 0, hg); line.castShadow = false; add(heartX(0.17, 0.11), m, 0, 1.12, 0, hg); add(new THREE.SphereGeometry(0.03, 8, 6), toon(THREE, '#ffffff'), -0.06, 1.17, 0.06, hg).scale.set(1, 0.6, 0.4); }
      if (HI.style === 'mic') { hg.scale.setScalar(1.3); add(new THREE.CylinderGeometry(0.02, 0.014, 0.16, 10), toon(THREE, HI.c || '#ff8fb3'), 0, 0.06, 0.04, hg); add(new THREE.SphereGeometry(0.045, 12, 10), toon(THREE, '#d8d8e8'), 0, 0.17, 0.04, hg); add(new THREE.TorusGeometry(0.03, 0.006, 4, 12), toon(THREE, '#ffd34e'), 0, 0.14, 0.04, hg).rotation.x = Math.PI / 2; }
      if (HI.style === 'pumpkinbag') { const b = add(new THREE.SphereGeometry(0.1, 14, 10), m, 0, -0.02, 0.08, hg); b.scale.set(1.1, 0.85, 1); const hd2 = add(new THREE.TorusGeometry(0.08, 0.01, 6, 14, Math.PI), toon(THREE, '#3a2f4a'), 0, 0.03, 0.08, hg); [-1, 1].forEach(s => { const e = add(new THREE.ConeGeometry(0.018, 0.03, 3), toon(THREE, '#3a2f4a'), 0.035 * s, 0.0, 0.17, hg); e.rotation.x = Math.PI / 2; }); const mo = add(new THREE.BoxGeometry(0.07, 0.012, 0.01), toon(THREE, '#3a2f4a'), 0, -0.04, 0.175, hg); }
      if (HI.style === 'icecream') { add(new THREE.ConeGeometry(0.05, 0.14, 10), toon(THREE, '#e0a868'), 0, 0.05, 0.04, hg).rotation.x = Math.PI; add(new THREE.SphereGeometry(0.06, 10, 8), m, 0, 0.15, 0.04, hg); }
    }
    root.userData = { head, arms, legs, inst: instInfo };
    return root;
  }
  // Toni & Kini: chubby round rabbits (full animal, not human)
  function bunny(THREE, o){
    const root = new THREE.Group(), fur = o.fur, inner = o.inner || '#ffc6d6', fm = toon(THREE, fur), im = toon(THREE, inner), wm = toon(THREE, o.belly || '#fffaf6');
    const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || root).add(m); return m; };
    const body = new THREE.Group(); root.add(body);
    add(new THREE.SphereGeometry(0.34, 22, 18), fm, 0, 0.36, 0, body).scale.set(1, 0.92, 0.95);
    add(new THREE.SphereGeometry(0.22, 18, 14), wm, 0, 0.32, 0.17, body).scale.set(1, 1.1, 0.6);
    const head = new THREE.Group(); head.position.set(0, 0.86, 0.02); body.add(head);
    add(new THREE.SphereGeometry(0.34, 24, 20), fm, 0, 0, 0, head).scale.set(1.12, 0.96, 1);
    const ears = [];
    [-1, 1].forEach(s => { const e = new THREE.Group(); e.position.set(0.15 * s, 0.24, -0.04); e.rotation.z = -0.18 * s; head.add(e); ears.push(e);
      add(new THREE.CapsuleGeometry(0.095, 0.42, 8, 14), fm, 0, 0.27, 0, e).scale.set(1, 1, 0.62);
      add(new THREE.CapsuleGeometry(0.05, 0.34, 6, 12), im, 0, 0.27, 0.035, e).scale.set(1, 1, 0.4); });
    if (o.bow){ [-1, 1].forEach(s => add(new THREE.ConeGeometry(0.07, 0.14, 12), toon(THREE, o.bow), 0.17 + 0.07 * s, 0.3, 0.05, head).rotation.set(0, 0, s * Math.PI / 2)); add(new THREE.SphereGeometry(0.035, 8, 6), toon(THREE, o.bow), 0.17, 0.3, 0.06, head); }
    // face texture
    const c = document.createElement('canvas'); c.width = 16 * 24; c.height = 12 * 24; const g = c.getContext('2d'); g.scale(24, 24); g.lineCap = 'round';
    const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); };
    const bl = (pts, w) => { g.strokeStyle = '#3a2e4a'; g.lineWidth = w; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); };
    if (o.eyes === 'closed') [4.2, 11.8].forEach(x => { g.strokeStyle = '#3a2e4a'; g.lineWidth = 0.6; g.beginPath(); g.arc(x, 5.0, 1.4, Math.PI * 0.12, Math.PI * 0.88); g.stroke(); });
    else if (o.eyes === 'ouch') [4.2, 11.8].forEach((x, i) => { const s2 = i ? -1 : 1; bl([[x - 1.2 * s2, 4.0], [x + 1.0 * s2, 5.2], [x - 1.2 * s2, 6.4]], 0.65); });
    else [4.2, 11.8].forEach(x => { ell(x, 5.2, 1.6, 1.95, '#3a2e4a'); ell(x, 6.0, 1.05, 0.75, '#7a6ab8'); ell(x - 0.55, 4.5, 0.6, 0.65, '#fff'); ell(x + 0.55, 5.9, 0.25, 0.25, '#fff'); });
    g.globalAlpha = 0.6; ell(1.6, 8.2, 1.6, 0.9, '#ff9eb0'); ell(14.4, 8.2, 1.6, 0.9, '#ff9eb0'); g.globalAlpha = 1;
    g.fillStyle = '#ff8fa6'; g.beginPath(); g.moveTo(7.2, 7.0); g.quadraticCurveTo(8, 6.5, 8.8, 7.0); g.quadraticCurveTo(8, 8.0, 7.2, 7.0); g.fill();
    g.strokeStyle = '#b0566a'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(8, 7.7); g.lineTo(8, 8.3); g.stroke(); g.beginPath(); g.arc(7.4, 8.3, 0.6, 0.1, Math.PI - 0.6); g.stroke(); g.beginPath(); g.arc(8.6, 8.3, 0.6, 0.6, Math.PI - 0.1); g.stroke();
    const t = new THREE.CanvasTexture(c); t.minFilter = THREE.LinearMipmapLinearFilter;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.343, 20, 16, Math.PI / 2 - 0.45, 0.9, Math.PI / 2 - 0.27, 0.66), new THREE.MeshToonMaterial({ map: t, transparent: true, alphaTest: 0.4, gradientMap: gradMap }));
    face.scale.set(1.12, 0.96, 1); head.add(face);
    // paws, feet, tail
    const arms = [], legs = [];
    [-1, 1].forEach(s => { const a = new THREE.Group(); a.position.set(0.26 * s, 0.5, 0.06); body.add(a); arms.push(a); add(new THREE.SphereGeometry(0.085, 12, 10), fm, 0, -0.08, 0.03, a).scale.set(1, 1.3, 1);
      const l = new THREE.Group(); l.position.set(0.15 * s, 0.12, 0.08); root.add(l); legs.push(l); add(new THREE.SphereGeometry(0.11, 12, 10), fm, 0, -0.03, 0.06, l).scale.set(1, 0.65, 1.5); add(new THREE.SphereGeometry(0.045, 8, 6), im, 0, -0.04, 0.22, l).scale.set(1, 0.5, 0.5); });
    add(new THREE.SphereGeometry(0.12, 14, 12), toon(THREE, o.tail || '#ffffff'), 0, 0.3, -0.32, body);
    if (o.scarf){ const sc = add(new THREE.TorusGeometry(0.2, 0.06, 8, 20), toon(THREE, o.scarf), 0, 0.64, 0, body); sc.rotation.x = Math.PI / 2; }
    root.scale.setScalar(o.scale || 1);
    root.userData = { head, arms, legs, ears, body, bunny: true };
    return root;
  }
  // Lulu the pink deer (gift-giver): big round head, cream mask, brown antlers & hooves
  function deer(THREE, o){
    o = o || {};
    const root = new THREE.Group(), fm = toon(THREE, o.fur || '#f59ab8'), cm = toon(THREE, o.cream || '#fff4ee'), bm = toon(THREE, o.brown || '#6b3f2a'), im = toon(THREE, o.inner || '#f58aa6');
    const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || root).add(m); return m; };
    const body = new THREE.Group(); root.add(body);
    add(new THREE.CapsuleGeometry(0.19, 0.12, 6, 16), fm, 0, 0.4, 0, body).scale.set(1.05, 1, 0.92);
    add(new THREE.SphereGeometry(0.15, 16, 12), cm, 0, 0.39, 0.11, body).scale.set(0.95, 1.15, 0.55);
    const head = new THREE.Group(); head.position.set(0, 0.95, 0.02); body.add(head);
    add(new THREE.SphereGeometry(0.42, 28, 22), fm, 0, 0, 0, head).scale.set(1.08, 0.94, 0.98);
    const tuft = add(new THREE.SphereGeometry(0.075, 12, 10), fm, 0.03, 0.39, 0.06, head); tuft.scale.set(1.4, 0.7, 0.9); tuft.rotation.z = -0.5;
    // face
    const c = document.createElement('canvas'), U = 24; c.width = 20 * U; c.height = 19 * U; const g = c.getContext('2d'); g.scale(U, U);
    g.fillStyle = o.fur || '#f59ab8'; g.fillRect(0, 0, 20, 19);
    const ell = (x, y, rx, ry, col, a) => { g.globalAlpha = a == null ? 1 : a; g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; };
    const CR = o.cream || '#fff4ee';
    ell(5.6, 8.0, 3.7, 3.6, CR); ell(14.4, 8.0, 3.7, 3.6, CR); ell(10, 12.0, 5.2, 4.4, CR); ell(10, 9.6, 2.6, 2.2, CR);
    ell(3.4, 12.0, 1.5, 0.95, '#ff9fb4', 0.55); ell(16.6, 12.0, 1.5, 0.95, '#ff9fb4', 0.55);
    [5.7, 14.3].forEach(x => { ell(x, 8.2, 2.0, 2.2, '#2b1a16'); ell(x + 0.6, 7.4, 0.6, 0.62, '#ffffff'); ell(x - 0.6, 9.1, 0.25, 0.25, '#ffffff', 0.85); });
    g.fillStyle = o.brown || '#6b3f2a'; g.beginPath(); g.moveTo(8.9, 10.6); g.quadraticCurveTo(10, 10.0, 11.1, 10.6); g.quadraticCurveTo(10.9, 11.6, 10, 11.8); g.quadraticCurveTo(9.1, 11.6, 8.9, 10.6); g.fill();
    ell(9.7, 10.6, 0.3, 0.18, '#a07060', 0.8);
    g.strokeStyle = '#3a2420'; g.lineWidth = 0.32; g.lineCap = 'round';
    g.beginPath(); g.moveTo(10, 11.8); g.lineTo(10, 12.3); g.stroke();
    g.beginPath(); g.arc(9.3, 12.2, 0.7, 0.15, Math.PI - 0.5); g.stroke(); g.beginPath(); g.arc(10.7, 12.2, 0.7, 0.5, Math.PI - 0.15); g.stroke();
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearMipmapLinearFilter;
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.4225, 26, 20, Math.PI / 2 - 0.75, 1.5, Math.PI / 2 - 0.55, 1.4), new THREE.MeshToonMaterial({ map: tex, gradientMap: gradMap }));
    face.scale.set(1.08, 0.94, 0.98); head.add(face);
    // ears
    const ears = [];
    [-1, 1].forEach(s => { const e = new THREE.Group(); e.position.set(0.41 * s, 0.13, -0.03); e.rotation.set(0, 0.35 * s, -1.0 * s); head.add(e); ears.push(e);
      add(new THREE.SphereGeometry(0.15, 16, 12), fm, 0, 0.1, 0, e).scale.set(1.0, 0.78, 0.38);
      add(new THREE.SphereGeometry(0.115, 14, 10), cm, 0, 0.1, 0.035, e).scale.set(1.0, 0.76, 0.3);
      add(new THREE.SphereGeometry(0.08, 12, 10), im, 0, 0.1, 0.055, e).scale.set(1.0, 0.75, 0.25); });
    // antlers
    [-1, 1].forEach(s => { const a = new THREE.Group(); a.position.set(0.17 * s, 0.33, -0.03); a.rotation.z = -0.22 * s; head.add(a);
      add(new THREE.CapsuleGeometry(0.042, 0.2, 6, 10), bm, 0, 0.13, 0, a);
      const p1 = add(new THREE.CapsuleGeometry(0.036, 0.1, 6, 10), bm, 0.07 * s, 0.17, 0, a); p1.rotation.z = -1.05 * s;
      const p2 = add(new THREE.CapsuleGeometry(0.034, 0.08, 6, 10), bm, -0.045 * s, 0.25, 0, a); p2.rotation.z = 0.75 * s; });
    // arms & legs with brown hooves
    const arms = [], legs = [];
    [-1, 1].forEach(s => {
      const a = new THREE.Group(); a.position.set(0.2 * s, 0.53, 0.02); a.rotation.z = 0.45 * s; body.add(a); arms.push(a);
      add(new THREE.CapsuleGeometry(0.065, 0.12, 6, 10), fm, 0, -0.08, 0, a); add(new THREE.SphereGeometry(0.066, 10, 8), bm, 0, -0.17, 0.005, a).scale.set(1, 0.7, 1);
      const l = new THREE.Group(); l.position.set(0.1 * s, 0.22, 0.01); root.add(l); legs.push(l);
      add(new THREE.CapsuleGeometry(0.075, 0.1, 6, 10), fm, 0, -0.05, 0, l); add(new THREE.SphereGeometry(0.08, 12, 10), bm, 0, -0.15, 0.02, l).scale.set(1, 0.6, 1.2);
    });
    add(new THREE.SphereGeometry(0.07, 12, 10), cm, 0, 0.35, -0.2, body);
    root.scale.setScalar(o.scale || 1);
    root.userData = { head, arms, legs, ears, body, deer: true };
    return root;
  }
  return { build, shade, bunny, carryInst, deer };
})();
