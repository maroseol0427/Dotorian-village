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

  function build(THREE, L) {
    const root = new THREE.Group();
    const add = (geo, mat, x, y, z, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = false; (parent || root).add(m); return m; };
    const skinM = toon(THREE, L.skin);
    const hairM = toon(THREE, L.hairColor);
    const T = L.top || { style: 'tee', c1: '#ffffff', sleeve: 'short' };
    const Lo = L.lower || { style: 'pants', c: '#3a5a8c' };
    const sleeve = T.sleeve || 'short';
    const lowerStyle = Lo.style;
    const legsVisible = lowerStyle !== 'longskirt';

    // legs & shoes
    const legs = [];
    const shoes = L.shoes || { style: 'sneaker', c: '#f2f2f2' };
    [-1, 1].forEach(s => {
      const leg = new THREE.Group(); leg.position.set(0.085 * s, 0.33, 0); root.add(leg); legs.push(leg);
      if (lowerStyle === 'shorts') { add(new THREE.CapsuleGeometry(0.074, 0.05, 4, 10), toon(THREE, Lo.c), 0, -0.06, 0, leg); add(new THREE.CapsuleGeometry(0.06, 0.12, 4, 10), skinM, 0, -0.15, 0, leg); }
      else add(new THREE.CapsuleGeometry(0.068, 0.16, 4, 10), (lowerStyle === 'pants' ? toon(THREE, Lo.c) : skinM), 0, -0.13, 0, leg);
      const sc = toon(THREE, shoes.c || '#f2f2f2');
      if (shoes.style === 'boot') { add(new THREE.CylinderGeometry(0.078, 0.082, 0.16, 12), sc, 0, -0.2, 0, leg); }
      const shoe = add(new THREE.SphereGeometry(0.09, 12, 8), sc, 0, -0.27, 0.025, leg); shoe.scale.set(0.95, 0.62, 1.3);
      if (shoes.style === 'sneaker') { const sole = add(new THREE.CylinderGeometry(0.085, 0.085, 0.025, 12), toon(THREE, '#ffffff'), 0, -0.31, 0.03, leg); sole.scale.set(1, 1, 1.35); }
    });
    // body
    const body = add(new THREE.CapsuleGeometry(0.175, 0.17, 6, 16), toon(THREE, '#ffffff', topTex(THREE, T, Lo.c)), 0, 0.5, 0);
    body.scale.set(1.08, 1, 0.86); body.rotation.y = Math.PI;
    if (lowerStyle === 'skirt') { const sk = add(new THREE.CylinderGeometry(0.19, 0.3, 0.22, 20, 1, true), toon(THREE, Lo.c, null, { side: THREE.DoubleSide }), 0, 0.39, 0); add(new THREE.TorusGeometry(0.29, 0.017, 6, 24), toon(THREE, shade(Lo.c, 0.82)), 0, 0.28, 0).rotation.x = Math.PI / 2; }
    if (lowerStyle === 'longskirt') { add(new THREE.CylinderGeometry(0.19, 0.34, 0.42, 22, 1, true), toon(THREE, Lo.c, null, { side: THREE.DoubleSide }), 0, 0.27, 0); add(new THREE.TorusGeometry(0.335, 0.02, 6, 26), toon(THREE, shade(Lo.c, 0.82)), 0, 0.07, 0).rotation.x = Math.PI / 2; }
    if (T.style === 'hoodie') { const h = add(new THREE.TorusGeometry(0.13, 0.055, 8, 18, Math.PI * 1.2), toon(THREE, shade(T.c1, 0.92)), 0, 0.68, -0.04); h.rotation.set(Math.PI / 2 - 0.25, 0, Math.PI * 1.4); }
    if (T.style === 'sailor' || T.style === 'astro') { const c = add(new THREE.TorusGeometry(0.11, 0.04, 6, 16), toon(THREE, T.style === 'astro' ? '#c8ccd8' : T.c2), 0, 0.69, 0); c.rotation.x = Math.PI / 2; }
    // arms
    const arms = [];
    let handR = null, handL = null;
    [-1, 1].forEach(s => {
      const arm = new THREE.Group(); arm.position.set(0.21 * s, 0.62, 0); arm.rotation.z = 0.28 * s; root.add(arm); arms.push(arm);
      const slM = toon(THREE, T.style === 'overalls' ? (T.c2 || '#ffffff') : T.style === 'shirt' ? '#f4f4f4' : T.style === 'astro' ? '#f2f4f8' : T.style === 'chef' ? '#ffffff' : T.style === 'pirate' ? '#ffffff' : T.style === 'varsity' ? (T.c2 || '#ffffff') : T.c1);
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
    const hoodHat = ['dinohood', 'bearhood', 'helmet'].includes(hst);
    const coversBangs = ['cap', 'beanie', 'wizard', 'chef', 'rainhat', 'dinohood', 'bearhood', 'pirate'].includes(hst);
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
      const dome = (r, th, y, sx = 1.1, sy = 1.0, sz = 1.04, m = hm) => { const d = add(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI * th), m, 0, y, 0, head); d.scale.set(sx, sy, sz); return d; };
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
        case 'dinohood': case 'bearhood': {
          const hood = add(new THREE.SphereGeometry(HR * 1.12, 28, 18, Math.PI / 2 + 0.95, Math.PI * 2 - 1.9, 0, Math.PI * 0.82), hm, 0, -0.02, -0.01, head); hood.scale.set(1.1, 1.04, 1.04);
          const rim = add(new THREE.TorusGeometry(0.3, 0.05, 8, 24), hd, 0, -0.02, 0.27, head); rim.scale.set(1.05, 1.05, 1);
          if (hst === 'bearhood') [-1, 1].forEach(s => { add(new THREE.SphereGeometry(0.1, 12, 10), hm, 0.27 * s, 0.33, -0.02, head).scale.set(1, 1, 0.6); add(new THREE.SphereGeometry(0.055, 10, 8), toon(THREE, H.c2 || '#f2d2b0'), 0.27 * s, 0.33, 0.04, head).scale.set(1, 1, 0.5); });
          else for (let k = 0; k < 5; k++) { const a = -0.3 + k * 0.42; const sp = add(new THREE.ConeGeometry(0.06, 0.13, 6), toon(THREE, H.c2 || '#ffd34e'), 0, 0.42 * Math.cos(a), -0.42 * Math.sin(a), head); sp.rotation.x = -a; }
          if (hst === 'dinohood') for (let k = -2; k <= 2; k++) add(new THREE.ConeGeometry(0.025, 0.05, 4), toon(THREE, '#ffffff'), k * 0.07, 0.2, 0.33, head).rotation.x = Math.PI;
        } break;
        case 'helmet': { const g = add(new THREE.SphereGeometry(0.5, 24, 18), new THREE.MeshToonMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.32, gradientMap: gradMap }), 0, 0.03, 0.02, head); g.castShadow = false; const r = add(new THREE.TorusGeometry(0.32, 0.06, 8, 24), toon(THREE, '#c8ccd8'), 0, -0.38, 0, head); r.rotation.x = Math.PI / 2; } break;
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
      if (B.style === 'cape') { const c = add(new THREE.CylinderGeometry(0.16, 0.34, 0.6, 20, 1, true, Math.PI / 2 + 0.6, Math.PI * 2 - 1.2 - Math.PI * 0.9), toon(THREE, B.c, null, { side: THREE.DoubleSide }), 0, 0.38, -0.03); c.rotation.y = Math.PI; add(new THREE.TorusGeometry(0.11, 0.025, 6, 16), toon(THREE, '#ffd34e'), 0, 0.68, 0).rotation.x = Math.PI / 2; }
      if (B.style === 'wings') [-1, 1].forEach(s => { const w = add(new THREE.SphereGeometry(0.2, 14, 10), toon(THREE, B.c || '#ffffff'), 0.17 * s, 0.62, -0.22); w.scale.set(0.5, 1.0, 0.18); w.rotation.set(0.2, 0.5 * s, -0.6 * s); const w2 = add(new THREE.SphereGeometry(0.13, 12, 8), toon(THREE, B.c2 || B.c || '#ffffff'), 0.25 * s, 0.5, -0.23); w2.scale.set(0.5, 1, 0.18); w2.rotation.set(0.2, 0.5 * s, -1.0 * s); });
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
  return { build, shade, bunny, carryInst };
})();
