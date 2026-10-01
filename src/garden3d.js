/* =====================================================================
   3D PET GARDEN: a living, explorable 3D world for your pets.
   · three.js (loaded on demand from a CDN, falls back to the 2D garden)
   · Rolling terrain, swaying grass, flowers, trees, a pet house, fence,
     mountains, clouds, sun / moon / stars from your real clock
   · Your pets as paper-doll billboards with real shadows: they wander,
     hop, sleep at night, chase the ball and talk
   · 8 themes (beach, snow, desert, candy, zen, volcano, moon…), every
     decoration you own, loot you can click, photo mode, fullscreen
   ===================================================================== */
(() => {
  try {
    const CDN = [
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js',
      'https://unpkg.com/three@0.160.0/build/three.module.min.js',
    ];
    let THREE = null,
      loadP = null,
      disabled = false;
    const loadThree = () => {
      if (THREE) return Promise.resolve(THREE);
      if (loadP) return loadP;
      loadP = (async () => {
        let err;
        for (const u of CDN) {
          try {
            const m = await import(/* webpackIgnore: true */ u);
            if (m && m.WebGLRenderer) {
              THREE = m;
              return m;
            }
          } catch (e) {
            err = e;
          }
        }
        loadP = null;
        throw err || new Error('three.js failed to load');
      })();
      return loadP;
    };
    const webglOK = () => {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (e) {
        return false;
      }
    };
    const LS = (k, d) => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch (e) {
        return d;
      }
    };
    const want3D = () => !disabled && LS('pb2.g3d', '1') === '1' && webglOK();
    const isPhone = () => innerWidth < 700;
    const PG = () => window.PBGarden;
    const E = s => (typeof esc === 'function' ? esc(s) : String(s));
    const R = a => a[Math.floor(Math.random() * a.length)];
    const rnd = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const smooth = t => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ---------------- noise ---------------- */
    const hash = (x, y) => {
      const n = Math.sin(x * 127.1 + y * 311.7 + 0.37) * 43758.5453;
      return n - Math.floor(n);
    };
    function vnoise(x, y) {
      const xi = Math.floor(x),
        yi = Math.floor(y),
        xf = x - xi,
        yf = y - yi,
        u = xf * xf * (3 - 2 * xf),
        v = yf * yf * (3 - 2 * yf),
        a = hash(xi, yi),
        b = hash(xi + 1, yi),
        c = hash(xi, yi + 1),
        d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    const fbm = (x, y) => vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 5.3, y * 2.1 + 7.1) * 0.3 + vnoise(x * 4.3 + 11.7, y * 4.3 + 3.9) * 0.1;

    /* ---------------- themes ---------------- */
    const SKY_DEF = {
      day: ['#3b8de6', '#9fd3ff', '#e6f4ff'],
      dawn: ['#3f4fb8', '#f4a39c', '#ffe1b8'],
      dusk: ['#2a2560', '#ff8666', '#ffd6a0'],
      night: ['#03060f', '#0d1636', '#1b2757'],
    };
    const THEMES = {
      meadow: { ground: ['#66c452', '#3e9636'], hill: '#3a8a33', mount: ['#93b7db', '#7398c0'], cap: true, trees: 'blob', fence: 'white', grass: ['#47a83a', '#b6ef7a'], grassN: 1, flowers: 1, cloud: '#ffffff' },
      beach: { ground: ['#f3dda4', '#e3c98a'], hill: '#d9bd7d', mount: null, ocean: true, trees: 'palm', fence: null, grass: ['#c9b872', '#efe6a8'], grassN: 0.25, flowers: 0, cloud: '#ffffff', sky: { day: ['#2f86e8', '#8fd0ff', '#e0f5ff'] } },
      snow: { ground: ['#f7fbff', '#dbe8f6'], hill: '#c9dbee', mount: ['#e7eef8', '#c9d7ea'], cap: true, trees: 'pine', fence: 'white', grass: null, grassN: 0, flowers: 0, cloud: '#ffffff', snow: true, sky: { day: ['#6aa3e0', '#c9e2fb', '#f1f7ff'] } },
      desert: { ground: ['#ecc07f', '#d9a565'], hill: '#c88f50', mount: ['#c96e45', '#a8532f'], mesa: true, trees: 'cactus', fence: null, grass: ['#b39a48', '#e6d37e'], grassN: 0.2, flowers: 0.15, cloud: '#ffffff', sky: { day: ['#3e8fe6', '#ffd9a6', '#ffe9c8'], dusk: ['#3a2a5a', '#ff7a4a', '#ffc98a'] } },
      candy: { ground: ['#ffb8de', '#ff9ccf'], hill: '#f28bc4', mount: ['#fff0d8', '#ffd3ee'], cap: false, trees: 'lolli', fence: 'candy', grass: ['#ff7fc0', '#ffc9ea'], grassN: 0.6, flowers: 1.4, cloud: '#ffd9ef', sky: { day: ['#7cc4ff', '#ffd1f0', '#fff3fb'] } },
      zen: { ground: ['#8fc76b', '#6ea850'], hill: '#5f9a44', mount: ['#8ea6bd', '#728ca6'], cap: true, trees: 'bamboo', fence: 'wood', grass: ['#5fae45', '#c3ef86'], grassN: 0.8, flowers: 0.6, cloud: '#ffffff', sakuraTrees: true },
      volcano: { ground: ['#4a3c37', '#332826'], hill: '#2b201d', mount: ['#4a2f28', '#33201b'], cap: false, trees: 'dead', fence: null, grass: null, grassN: 0, flowers: 0, cloud: '#6b5a58', volcano: true, embers: true, sky: { day: ['#3a1a1a', '#b04a2e', '#ffae70'], dawn: ['#2a1414', '#a8402a', '#ffb070'], dusk: ['#1e0e12', '#8a2e22', '#ff9a5c'], night: ['#050205', '#1a0808', '#3a1410'] } },
      space: { ground: ['#b9bcc6', '#8d9099'], hill: '#7b7e88', mount: null, trees: null, fence: null, grass: null, grassN: 0, flowers: 0, cloud: null, space: true, sky: { day: ['#000000', '#02030a', '#05060f'], dawn: ['#000000', '#02030a', '#05060f'], dusk: ['#000000', '#02030a', '#05060f'], night: ['#000000', '#02030a', '#05060f'] } },
    };
    const PHASES = {
      day: { sunDir: [0.55, 0.78, 0.35], sun: ['#fff3d8', 3.0], hemi: ['#bfe1ff', '#5f7d3f', 1.15], amb: 0.22, tint: '#ffffff', stars: 0, cloud: 0.95, moon: 0, win: 0, lantern: 0, fly: 0, sunSprite: 1 },
      dawn: { sunDir: [0.88, 0.2, 0.42], sun: ['#ffb27a', 2.3], hemi: ['#f0a8b4', '#3a3552', 0.9], amb: 0.2, tint: '#ffdcc6', stars: 0.25, cloud: 0.8, moon: 0, win: 0.6, lantern: 0.5, fly: 0.15, sunSprite: 1 },
      dusk: { sunDir: [-0.88, 0.17, 0.4], sun: ['#ff9a5a', 2.1], hemi: ['#ff9d7c', '#2a2848', 0.85], amb: 0.2, tint: '#ffd3b6', stars: 0.35, cloud: 0.7, moon: 0, win: 0.9, lantern: 0.8, fly: 0.35, sunSprite: 1 },
      night: { sunDir: [-0.35, 0.68, -0.55], sun: ['#8ea6ff', 0.8], hemi: ['#1c2a58', '#06070f', 0.6], amb: 0.14, tint: '#9fadd9', stars: 1, cloud: 0.16, moon: 1, win: 1, lantern: 1, fly: 1, sunSprite: 0 },
    };
    const PH_ORDER = ['day', 'dusk', 'night', 'dawn'];
    const PH_LBL = { day: '☀️ Sunny day', dawn: '🌅 Sunrise', dusk: '🌇 Sunset', night: '🌙 Night' };

    /* ---------------- state ---------------- */
    let renderer = null,
      scene = null,
      camera = null,
      stage = null,
      ui = null,
      raf = 0,
      lastT = 0,
      T = 0,
      Q = null,
      built = false,
      theme = null,
      thId = 'meadow',
      phOverride = null,
      cur = null, // current phase (for lerps)
      world = null, // everything themed: lights, meshes, particles
      actors = [],
      sel = null,
      hover = null,
      ball = null,
      loot = [],
      lootT = 18,
      idleT = 0,
      intro = null,
      fps = { acc: 0, n: 0, slow: 0 },
      lastSync = 0,
      lastBank = 0;
    const texCache = new Map(),
      petTex = new Set();
    const uTime = { value: 0 };
    const cam = { theta: 0.18, phi: 1.1, r: 17, vt: 0, vp: 0, tgt: null };
    const tmpV = () => new THREE.Vector3();
    let V1, V2;

    /* ---------------- canvas textures ---------------- */
    function cnv(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return [c, c.getContext('2d')];
    }
    const mkTex = c => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return t;
    };
    let softDot = null,
      cloudTex = null,
      sunTex = null,
      moonTex = null,
      flowerTex = {},
      bflyTex = null,
      earthTex = null;
    function softDotTex() {
      if (softDot) return softDot;
      const [c, x] = cnv(64, 64);
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,.85)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      return (softDot = mkTex(c));
    }
    function cloudTexture() {
      if (cloudTex) return cloudTex;
      const [c, x] = cnv(256, 128);
      const puff = (px, py, r) => {
        const g = x.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.7, 'rgba(255,255,255,.75)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g;
        x.fillRect(px - r, py - r, r * 2, r * 2);
      };
      [[70, 80, 44], [120, 62, 52], [170, 76, 46], [100, 90, 40], [145, 92, 42], [200, 90, 30]].forEach(([a, b, r]) => puff(a, b, r));
      return (cloudTex = mkTex(c));
    }
    function glowTex(c1, c2) {
      const [c, x] = cnv(128, 128);
      const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, c1);
      g.addColorStop(0.25, c1);
      g.addColorStop(0.5, c2);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      return mkTex(c);
    }
    function moonTexture() {
      if (moonTex) return moonTex;
      const [c, x] = cnv(128, 128);
      x.fillStyle = '#fff8e0';
      x.beginPath();
      x.arc(64, 64, 56, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = 'rgba(190,180,150,.55)';
      [[44, 50, 12], [80, 42, 8], [72, 84, 14], [50, 86, 6], [90, 70, 5]].forEach(([a, b, r]) => {
        x.beginPath();
        x.arc(a, b, r, 0, Math.PI * 2);
        x.fill();
      });
      return (moonTex = mkTex(c));
    }
    function flowerTexture(col) {
      if (flowerTex[col]) return flowerTex[col];
      const [c, x] = cnv(64, 96);
      x.strokeStyle = '#2f7d2b';
      x.lineWidth = 5;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(32, 94);
      x.quadraticCurveTo(28, 60, 32, 34);
      x.stroke();
      x.fillStyle = '#3f9a3a';
      x.beginPath();
      x.ellipse(24, 66, 9, 4, -0.6, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        x.beginPath();
        x.ellipse(32 + Math.cos(a) * 13, 30 + Math.sin(a) * 13, 11, 8, a, 0, Math.PI * 2);
        x.fill();
      }
      x.fillStyle = '#ffd23f';
      x.beginPath();
      x.arc(32, 30, 8, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = 'rgba(255,255,255,.55)';
      x.beginPath();
      x.arc(29, 27, 3, 0, Math.PI * 2);
      x.fill();
      return (flowerTex[col] = mkTex(c));
    }
    function butterflyTexture() {
      if (bflyTex) return bflyTex;
      const [c, x] = cnv(64, 48);
      const wing = (cx, cy, rx, ry, col) => {
        x.fillStyle = col;
        x.beginPath();
        x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        x.fill();
      };
      wing(18, 18, 16, 14, '#ff9ecf');
      wing(46, 18, 16, 14, '#ff9ecf');
      wing(22, 34, 11, 9, '#ffd34d');
      wing(42, 34, 11, 9, '#ffd34d');
      x.fillStyle = '#2a1a2e';
      x.fillRect(30, 6, 4, 36);
      return (bflyTex = mkTex(c));
    }
    function textTex(txt, bg, fg, w = 256, h = 96, size = 44) {
      const [c, x] = cnv(w, h);
      x.fillStyle = bg;
      x.beginPath();
      if (x.roundRect) x.roundRect(0, 0, w, h, 18);
      else x.rect(0, 0, w, h);
      x.fill();
      x.fillStyle = fg;
      x.font = `900 ${size}px system-ui, sans-serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(txt, w / 2, h / 2 + 2);
      return mkTex(c);
    }
    function emojiTex(ch, size = 96) {
      const [c, x] = cnv(size, size);
      x.font = `${size * 0.78}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText(ch, size / 2, size / 2 + size * 0.04);
      return mkTex(c);
    }
    function earthTexture() {
      if (earthTex) return earthTex;
      const [c, x] = cnv(256, 256);
      const g = x.createRadialGradient(100, 96, 10, 128, 128, 128);
      g.addColorStop(0, '#5fb0ff');
      g.addColorStop(0.8, '#1f6fd6');
      g.addColorStop(1, '#0a2e6b');
      x.fillStyle = g;
      x.beginPath();
      x.arc(128, 128, 124, 0, Math.PI * 2);
      x.fill();
      x.save();
      x.beginPath();
      x.arc(128, 128, 124, 0, Math.PI * 2);
      x.clip();
      x.fillStyle = '#3fae5c';
      const blob = (px, py, r, n) => {
        x.beginPath();
        for (let i = 0; i <= n; i++) {
          const a = (i / n) * Math.PI * 2,
            rr = r * (0.7 + 0.3 * hash(i, px));
          x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.8);
        }
        x.closePath();
        x.fill();
      };
      blob(80, 90, 42, 11);
      blob(170, 150, 36, 9);
      blob(120, 200, 26, 8);
      x.fillStyle = '#c9b078';
      blob(90, 100, 12, 7);
      x.fillStyle = 'rgba(255,255,255,.75)';
      for (let i = 0; i < 9; i++) {
        x.beginPath();
        x.ellipse(40 + i * 24, 60 + ((i * 37) % 140), 28, 7, 0.4, 0, Math.PI * 2);
        x.fill();
      }
      x.restore();
      return (earthTex = mkTex(c));
    }

    /* ---------------- pet textures ---------------- */
    function svgTexture(key, svg) {
      if (texCache.has(key)) return texCache.get(key);
      const p = new Promise(res => {
        let s = String(svg)
          .replace(/<ellipse cx="32" cy="60(?:\.\d+)?"[^>]*\/>/g, '')
          .replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" ');
        if (!/ width="/.test(s.slice(0, 200))) s = s.replace(/<svg /, '<svg width="256" height="256" ');
        const img = new Image();
        img.onload = () => {
          const [c, x] = cnv(256, 256);
          x.drawImage(img, 0, 0, 256, 256);
          const t = mkTex(c);
          t.generateMipmaps = true;
          petTex.add(t);
          res(t);
        };
        img.onerror = () => res(null);
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
      });
      texCache.set(key, p);
      return p;
    }

    /* ---------------- terrain ---------------- */
    const R_FLAT = 11,
      R_EDGE = 21;
    let craters = [];
    function terrainH(x, z) {
      const r = Math.hypot(x, z);
      let h = 0;
      const t = smooth((r - R_FLAT) / (R_EDGE - R_FLAT));
      if (t > 0) {
        const n = fbm(x * 0.085 + 3.1, z * 0.085 + 9.7) * 2 - 1;
        h = t * (1.1 + 1.7 * n + (r - R_FLAT) * 0.07);
        if (theme.space) h *= 0.55;
      }
      if (theme.ocean) h -= smooth((-z - 10.5) / 3) * 1.4 + smooth((-z - 14) / 6) * 0.8;
      if (theme.space)
        for (const c of craters) {
          const d = Math.hypot(x - c.x, z - c.z) / c.r;
          if (d < 1.4) h += -c.d * (1 - smooth(d)) + c.d * 0.35 * Math.exp(-Math.pow((d - 1) / 0.16, 2));
        }
      return h;
    }
    const blockers = [];
    const blocked = (x, z, pad = 0) => blockers.some(b => !b.grassOnly && Math.hypot(x - b.x, z - b.z) < b.r + pad);
    const onGround = (x, z) => terrainH(x, z);
    function freeSpot(rmax, tries = 30) {
      for (let i = 0; i < tries; i++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.sqrt(Math.random()) * rmax,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        if (!blocked(x, z, 0.6)) return [x, z];
      }
      return [0, 3];
    }

    /* ---------------- materials / helpers ---------------- */
    const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.9, metalness: 0 }, o));
    const lam = (color, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color }, o));
    function mesh(g, m, x = 0, y = 0, z = 0, shadow = true) {
      const o = new THREE.Mesh(g, m);
      o.position.set(x, y, z);
      o.castShadow = shadow;
      o.receiveShadow = shadow;
      return o;
    }
    const grp = (x = 0, y = 0, z = 0) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      return g;
    };
    function swayShader(mat, amp, freq) {
      mat.customProgramCacheKey = () => 'sway' + amp + '_' + freq + '_' + (mat.map ? 'm' : 'v');
      mat.onBeforeCompile = sh => {
        sh.uniforms.uTime = uTime;
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uTime;')
          .replace(
            '#include <begin_vertex>',
            `vec3 transformed = vec3(position);
            #ifdef USE_INSTANCING
              float ph = instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.9;
              float sw = sin(uTime * ${freq.toFixed(2)} + ph) * ${amp.toFixed(3)} + sin(uTime * ${(freq * 1.7).toFixed(2)} + ph * 1.7) * ${(amp * 0.35).toFixed(3)};
              transformed.x += sw * position.y * position.y;
              transformed.z += cos(uTime * ${(freq * 0.8).toFixed(2)} + ph) * ${(amp * 0.3).toFixed(3)} * position.y;
            #endif`
          );
      };
      return mat;
    }
    function pointsMat(color, size, opacity, additive, attenuate) {
      return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uTime: uTime, uColor: { value: new THREE.Color(color) }, uSize: { value: size }, uOpacity: { value: opacity }, uMap: { value: softDotTex() }, uPix: { value: renderer.getPixelRatio() }, uAtt: { value: attenuate ? 1 : 0 } },
        vertexShader: `attribute float seed; varying float vA; uniform float uTime, uSize, uPix, uAtt;
          void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = 0.6 + 0.4*sin(uTime*2.6 + seed*6.283);
          float s = uSize * uPix * (0.6 + 0.5*fract(seed*7.31)); gl_PointSize = uAtt > 0.5 ? s * (30.0 / max(1.0,-mv.z)) : s; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uColor; uniform float uOpacity; uniform sampler2D uMap; varying float vA;
          void main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * uOpacity); }`,
      });
    }
    function points(n, color, size, opacity, additive, attenuate, fill) {
      const pos = new Float32Array(n * 3),
        seed = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = fill(i);
        pos[i * 3] = p[0];
        pos[i * 3 + 1] = p[1];
        pos[i * 3 + 2] = p[2];
        seed[i] = Math.random();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
      const m = new THREE.Points(g, pointsMat(color, size, opacity, additive, attenuate));
      m.frustumCulled = false;
      return m;
    }

    /* ---------------- world building ---------------- */
    function buildWorld() {
      const W = { lights: {}, anim: [], parts: [], lanterns: [], windows: [], smoke: [], clouds: [], koi: [], fountain: null, tint: new THREE.Color('#ffffff') };
      world = W;
      blockers.length = 0;
      craters = [];
      theme = THEMES[thId] || THEMES.meadow;
      const sky = Object.assign({}, SKY_DEF, theme.sky || {});
      W.sky = sky;
      const g = PG().G(),
        own = PG().own;

      /* lights */
      W.lights.hemi = new THREE.HemisphereLight('#bfe1ff', '#5f7d3f', 1.1);
      W.lights.amb = new THREE.AmbientLight('#ffffff', 0.2);
      const sun = new THREE.DirectionalLight('#fff3d8', 3);
      sun.castShadow = true;
      sun.shadow.mapSize.set(Q.shadow, Q.shadow);
      sun.shadow.camera.near = 1;
      sun.shadow.camera.far = 140;
      sun.shadow.camera.left = sun.shadow.camera.bottom = -24;
      sun.shadow.camera.right = sun.shadow.camera.top = 24;
      sun.shadow.bias = -0.0015;
      sun.shadow.normalBias = 0.02;
      sun.target.position.set(0, 0, 0);
      W.lights.sun = sun;
      scene.add(W.lights.hemi, W.lights.amb, sun, sun.target);

      /* sky dome */
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color(sky.day[0]) }, mid: { value: new THREE.Color(sky.day[1]) }, bot: { value: new THREE.Color(sky.day[2]) } },
        vertexShader: 'varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: 'uniform vec3 top,mid,bot; varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, clamp(-h*4.0, 0.0, 1.0)); gl_FragColor = vec4(c, 1.0); }',
      });
      W.skyMat = skyMat;
      const skyM = new THREE.Mesh(new THREE.SphereGeometry(220, 28, 14), skyMat);
      skyM.renderOrder = -10;
      scene.add(skyM);
      scene.fog = new THREE.Fog(sky.day[1], 28, theme.space ? 90 : 130);

      /* stars */
      W.stars = points(theme.space ? 1600 : Q.stars, '#ffffff', theme.space ? 2.4 : 2.2, 0, true, false, () => {
        const a = Math.random() * Math.PI * 2,
          e = theme.space ? Math.random() * Math.PI * 0.5 : Math.random() * Math.PI * 0.46 + 0.04;
        return [Math.cos(a) * Math.cos(e) * 190, Math.sin(e) * 190, Math.sin(a) * Math.cos(e) * 190];
      });
      scene.add(W.stars);

      /* sun + moon sprites */
      W.sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,250,225,1)', 'rgba(255,200,120,.5)'), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      W.sunSprite.scale.set(38, 38, 1);
      W.moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), transparent: true, depthWrite: false, fog: false }));
      W.moon.scale.set(14, 14, 1);
      W.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(200,215,255,.7)', 'rgba(150,170,255,.25)'), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
      W.moonGlow.scale.set(40, 40, 1);
      scene.add(W.sunSprite, W.moon, W.moonGlow);
      if (theme.space) {
        const earth = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 24), new THREE.MeshBasicMaterial({ map: earthTexture(), fog: false }));
        earth.position.set(-42, 24, -130);
        scene.add(earth);
        W.earth = earth;
        const eg = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(120,180,255,.55)', 'rgba(80,140,255,.2)'), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
        eg.position.copy(earth.position);
        eg.scale.set(48, 48, 1);
        scene.add(eg);
        const sat = new THREE.Mesh(new THREE.SphereGeometry(5, 24, 16), new THREE.MeshBasicMaterial({ color: '#e0a86a', fog: false }));
        sat.position.set(75, 30, -115);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 1.1, 8, 40), new THREE.MeshBasicMaterial({ color: '#f3d3a0', fog: false }));
        ring.rotation.x = 1.2;
        sat.add(ring);
        scene.add(sat);
      }

      /* clouds */
      if (theme.cloud)
        for (let i = 0; i < (isPhone() ? 6 : 9); i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, opacity: 0.9, color: theme.cloud }));
          const w = rnd(10, 18);
          s.scale.set(w, w * 0.5, 1);
          s.position.set(rnd(-70, 70), rnd(16, 26), rnd(-75, 20));
          s.userData.v = rnd(0.25, 0.6);
          scene.add(s);
          W.clouds.push(s);
        }

      /* craters (moon) */
      if (theme.space) {
        for (let i = 0; i < 9; i++) {
          const a = i * 0.8 + 0.3,
            r = 14 + (i % 3) * 5;
          craters.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, r: rnd(2.2, 4.5), d: rnd(0.8, 1.6) });
        }
        craters.push({ x: 5, z: 6, r: 2.2, d: 0.22 }, { x: -4, z: 7, r: 1.6, d: 0.16 }, { x: 7, z: -3, r: 1.8, d: 0.2 });
      }

      /* terrain */
      const SEG = isPhone() ? 96 : 130,
        SIZE = 110;
      const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
      tg.rotateX(-Math.PI / 2);
      const P = tg.attributes.position,
        col = new Float32Array(P.count * 3),
        c1 = new THREE.Color(theme.ground[0]),
        c2 = new THREE.Color(theme.ground[1]),
        c3 = new THREE.Color(theme.hill),
        cc = new THREE.Color();
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i),
          z = P.getZ(i),
          h = terrainH(x, z);
        P.setY(i, h);
        const n = fbm(x * 0.35 + 50, z * 0.35 + 20);
        cc.copy(c1).lerp(c2, clamp(n * 1.3 - 0.15, 0, 1)).lerp(c3, smooth(h / 3.5));
        if (theme.space) cc.multiplyScalar(0.85 + 0.3 * n);
        if (theme.ocean && h < -0.2) cc.lerp(new THREE.Color('#c9b27a'), 0.5);
        col[i * 3] = cc.r;
        col[i * 3 + 1] = cc.g;
        col[i * 3 + 2] = cc.b;
      }
      tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      tg.computeVertexNormals();
      const terrain = new THREE.Mesh(tg, std('#ffffff', { vertexColors: true, roughness: 1 }));
      terrain.receiveShadow = true;
      scene.add(terrain);
      W.terrain = terrain;

      /* ocean (beach) */
      if (theme.ocean) {
        W.water = waterMesh(new THREE.PlaneGeometry(260, 140), '#1f8fe0', '#6fd3ff', 0.9);
        W.water.rotation.x = -Math.PI / 2;
        W.water.position.set(0, -0.05, -78);
        scene.add(W.water);
        // foam line
        const foam = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.1, 4), std('#fff'));
        foam.visible = false;
        scene.add(foam);
      }

      /* house + path */
      const hp = theme.ocean ? [-7.5, -1.5] : [-6.5, -6.5];
      buildHouse(W, hp[0], hp[1]);
      blockers.push({ x: hp[0], z: hp[1], r: 2.9 });
      const gate = [0, 11.3];
      buildPath(W, hp, gate);

      /* decorations */
      if (own('pond') || theme.ocean === 'x') buildPond(W, 6.5, 4.5);
      if (own('fountain')) buildFountain(W, 0, -5.5);
      if (own('gazebo')) buildGazebo(W, -7, 5.5);
      if (own('crystal')) buildCrystal(W, 9, -1);
      if (own('sakura') || theme.sakuraTrees) buildSakura(W, 7.5, -6.5);
      if (own('lanterns')) buildLanterns(W);
      if (own('rainbow')) buildRainbow(W);
      if (theme.volcano) buildVolcano(W);
      if (theme.space) buildMoonBase(W);
      if (theme.snow) buildSnowman(W, 8, -4);
      if (theme.trees === 'bamboo') buildTorii(W, 8.5, -8);

      /* fence */
      if (theme.fence) buildFence(W, 11.3, theme.fence);

      /* trees + mountains */
      buildTrees(W);
      if (theme.mount) buildMountains(W);
      if (theme.ocean) buildIslands(W);

      /* grass + flowers */
      if (theme.grass && theme.grassN > 0) buildGrass(W, Math.round(Q.grass * theme.grassN));
      const nF = Math.round((own('flowers') ? Q.flowers * 2.2 : Q.flowers * 0.55) * theme.flowers);
      if (nF > 0) buildFlowers(W, nF);

      /* ambient particles */
      W.fireflies = points(theme.space ? 0 : 42, '#ffef7a', 7, 0, true, true, () => {
        const [x, z] = freeSpot(10.5, 3);
        return [x, rnd(0.4, 2.2), z];
      });
      W.fireflies.userData.base = W.fireflies.geometry.attributes.position.array.slice();
      scene.add(W.fireflies);
      if (theme.snow) {
        W.snow = points(isPhone() ? 320 : 520, '#ffffff', 5, 0.95, false, true, () => [rnd(-24, 24), rnd(0, 16), rnd(-24, 24)]);
        scene.add(W.snow);
      }
      if (theme.embers) {
        W.embers = points(160, '#ff8a3d', 6, 0.9, true, true, () => [rnd(-16, 16), rnd(0, 12), rnd(-20, 12)]);
        scene.add(W.embers);
      }
      if (own('sakura') || theme.sakuraTrees) {
        W.petals = points(140, '#ffb7d5', 5, 0.95, false, true, () => [7.5 + rnd(-6, 6), rnd(0, 6), -6.5 + rnd(-6, 6)]);
        scene.add(W.petals);
      }
      // butterflies (daytime)
      W.bflies = [];
      if (!theme.space && !theme.volcano)
        for (let i = 0; i < 5; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: butterflyTexture(), transparent: true, depthWrite: false, color: ['#ffffff', '#c9e6ff', '#ffe9a8', '#e0c9ff', '#c9ffd6'][i] }));
          s.scale.set(0.42, 0.32, 1);
          s.userData = { ph: rnd(0, 9), cx: rnd(-7, 7), cz: rnd(-6, 7), rx: rnd(2, 5), rz: rnd(2, 4) };
          scene.add(s);
          W.bflies.push(s);
        }

      /* companion ring */
      W.ring = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.045, 10, 48), new THREE.MeshBasicMaterial({ color: '#ffcf3a', transparent: true, opacity: 0.85 }));
      W.ring.rotation.x = Math.PI / 2;
      W.ring.visible = false;
      scene.add(W.ring);

      cur = null; // forces a snap to the current phase on the first frame
    }

    function waterMesh(geo, ca, cb, alpha) {
      const m = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: uTime, c1: { value: new THREE.Color(ca) }, c2: { value: new THREE.Color(cb) }, uA: { value: alpha }, fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 100 }, uSun: { value: new THREE.Vector3(0.5, 0.8, 0.3) } },
        vertexShader: `varying vec2 vUv; varying vec3 vP; varying float vFog; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; vec4 mv = viewMatrix * w; vFog = -mv.z; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uTime, uA, fogNear, fogFar; uniform vec3 c1, c2, fogColor, uSun; varying vec2 vUv; varying vec3 vP; varying float vFog;
          void main(){ float w = sin(vP.x*1.7 + uTime*0.9) * 0.5 + sin(vP.z*2.1 - uTime*0.7 + sin(vP.x*0.8)*1.5) * 0.5;
            vec3 col = mix(c1, c2, 0.5 + 0.5*w*0.7);
            float sp = smoothstep(0.86, 1.0, sin(vP.x*6.0 + uTime*1.6 + sin(vP.z*4.0 + uTime)*2.0) * sin(vP.z*5.0 - uTime*1.1)) * 0.45 * max(0.0, uSun.y);
            col += sp; float f = smoothstep(fogNear, fogFar, vFog); col = mix(col, fogColor, f);
            gl_FragColor = vec4(col, uA * (1.0 - f*0.6)); }`,
      });
      const mm = new THREE.Mesh(geo, m);
      mm.userData.water = true;
      if (world) (world.waters ||= []).push(mm);
      return mm;
    }

    function buildHouse(W, x, z) {
      const t = theme,
        H = grp(x, onGround(x, z), z);
      H.rotation.y = Math.atan2(-x, -z);
      const wall = t.space ? '#dfe4ee' : t.volcano ? '#3a2a24' : t.candy ? '#fff0f8' : t.trees === 'cactus' ? '#d9986a' : t.trees === 'palm' ? '#f6e3b8' : t.trees === 'bamboo' ? '#8a6a4a' : t.snow ? '#eef3ff' : '#fff1d6';
      const roofC = t.candy ? '#ff6fae' : t.trees === 'cactus' ? '#a04a2a' : t.trees === 'palm' ? '#c9a15a' : t.trees === 'bamboo' ? '#2b2b2b' : t.snow ? '#5d7fb8' : t.volcano ? '#1a1010' : '#d94b41';
      if (t.space) {
        const dome = mesh(new THREE.SphereGeometry(2.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#9fd8ff', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0, side: THREE.DoubleSide, depthWrite: false }), 0, 0, 0, false);
        const base = mesh(new THREE.CylinderGeometry(2.7, 2.9, 0.35, 32), std('#c9ccd6'), 0, 0.17, 0);
        const lock = mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), std(wall), 0, 0.6, 2.6);
        lock.rotation.x = Math.PI / 2;
        const bed = mesh(new THREE.BoxGeometry(1.4, 0.6, 1), std('#e8eaf0'), 0, 0.65, 0);
        H.add(dome, base, lock, bed);
        for (let i = 0; i < 2; i++) {
          const w = mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshStandardMaterial({ color: '#ffd36b', emissive: '#ffb020', emissiveIntensity: 0 }), i ? 1.2 : -1.2, 1.2, 1.8, false);
          W.windows.push(w);
          H.add(w);
        }
        scene.add(H);
        W.house = H;
        return;
      }
      const body = mesh(new THREE.BoxGeometry(3.4, 2.3, 3), std(wall), 0, 1.15, 0);
      const roof = mesh(new THREE.ConeGeometry(2.95, 1.7, 4), std(roofC, { roughness: 0.8 }), 0, 2.3 + 0.85, 0);
      roof.rotation.y = Math.PI / 4;
      const door = mesh(new THREE.BoxGeometry(0.9, 1.3, 0.12), std(t.volcano ? '#6b3a20' : '#8a5a3c'), 0, 0.65, 1.53);
      const knob = mesh(new THREE.SphereGeometry(0.06, 8, 8), std('#ffd34d', { metalness: 0.7, roughness: 0.3 }), 0.28, 0.65, 1.62, false);
      const step = mesh(new THREE.BoxGeometry(1.3, 0.14, 0.7), std('#c9b28a'), 0, 0.07, 1.85);
      const chim = mesh(new THREE.BoxGeometry(0.5, 1.2, 0.5), std(t.candy ? '#ff9ecf' : '#8a5a3c'), 0.95, 3.0, -0.6);
      H.add(body, roof, door, knob, step, chim);
      if (t.snow) H.add(mesh(new THREE.ConeGeometry(2.6, 0.5, 4), std('#ffffff'), 0, 3.85, 0, false));
      if (t.candy) {
        for (let i = 0; i < 6; i++) H.add(mesh(new THREE.SphereGeometry(0.16, 10, 8), std(['#ff6fae', '#ffd34d', '#6fd3ff', '#b388ff', '#7ae582', '#ff8a5c'][i]), -1.2 + i * 0.48, 2.42, 1.5, false));
      }
      for (const sx of [-1.05, 1.05]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.62, 0.1), new THREE.MeshStandardMaterial({ color: '#bfe6ff', emissive: '#ffb84a', emissiveIntensity: 0 }));
        win.position.set(sx, 1.35, 1.53);
        const frame = mesh(new THREE.BoxGeometry(0.74, 0.74, 0.06), std('#ffffff'), sx, 1.35, 1.5, false);
        H.add(frame, win);
        W.windows.push(win);
      }
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.48), new THREE.MeshBasicMaterial({ map: textTex('PETS', t.volcano ? '#2a1a1a' : '#ffffff', t.volcano ? '#ffb070' : roofC, 256, 96, 56), transparent: true }));
      sign.position.set(0, 1.85, 1.56);
      H.add(sign);
      const wl = new THREE.PointLight('#ffb84a', 0, 9, 2);
      wl.position.set(0, 1.5, 2.2);
      H.add(wl);
      W.houseLight = wl;
      // chimney smoke
      for (let i = 0; i < 7; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDotTex(), transparent: true, depthWrite: false, opacity: 0.35, color: t.volcano ? '#555' : '#ffffff' }));
        s.userData.t = i / 7;
        H.add(s);
        W.smoke.push(s);
      }
      W.smokeOrigin = new THREE.Vector3(0.95, 3.7, -0.6);
      scene.add(H);
      W.house = H;
    }
    function buildPath(W, from, to) {
      const t = theme;
      const col = t.space ? '#d3d6de' : t.volcano ? '#ff6a1a' : t.snow ? '#cfdcec' : t.candy ? '#fff5c2' : t.trees === 'palm' ? '#fff0cf' : '#e6cf9a';
      const p0 = new THREE.Vector3(from[0], 0, from[1]),
        p2 = new THREE.Vector3(to[0], 0, to[1]),
        dir = p2.clone().sub(p0).normalize();
      p0.addScaledVector(dir, 2.3);
      const p1 = new THREE.Vector3((p0.x + p2.x) / 2 + 2.5, 0, (p0.z + p2.z) / 2 - 1.5);
      const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
      const N = 40,
        w = 0.65,
        pos = [],
        idx = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N,
          p = curve.getPoint(u),
          tg = curve.getTangent(u),
          nx = -tg.z,
          nz = tg.x,
          ww = w * (0.85 + 0.15 * Math.sin(u * 9));
        pos.push(p.x + nx * ww, onGround(p.x + nx * ww, p.z + nz * ww) + 0.03, p.z + nz * ww, p.x - nx * ww, onGround(p.x - nx * ww, p.z - nz * ww) + 0.03, p.z - nz * ww);
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
        if (i % 4 === 0) blockers.push({ x: p.x, z: p.z, r: 0.01, grassOnly: true });
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      gg.setIndex(idx);
      gg.computeVertexNormals();
      const m = new THREE.Mesh(gg, t.volcano ? new THREE.MeshStandardMaterial({ color: col, emissive: '#ff5a10', emissiveIntensity: 0.9, roughness: 0.6 }) : std(col, { roughness: 1 }));
      m.receiveShadow = true;
      scene.add(m);
      W.path = curve;
      W.pathMesh = m;
    }
    function buildPond(W, x, z) {
      blockers.push({ x, z, r: 3.7 });
      const water = waterMesh(new THREE.CircleGeometry(3.3, 48), theme.space ? '#7cc6ff' : '#2a8fe6', '#7fd6ff', 0.84);
      water.rotation.x = -Math.PI / 2;
      water.position.set(x, 0.04, z);
      scene.add(water);
      W.pond = water;
      const rim = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.75, 48), std(theme.snow ? '#dfe8f4' : '#8a7a62'));
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(x, 0.02, z);
      rim.receiveShadow = true;
      scene.add(rim);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + hash(i, 3) * 0.3,
          r = 3.55 + hash(i, 5) * 0.3;
        scene.add(mesh(new THREE.IcosahedronGeometry(0.22 + hash(i, 9) * 0.16, 0), std('#9a9186'), x + Math.cos(a) * r, 0.12, z + Math.sin(a) * r));
      }
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3,
          pad = mesh(new THREE.CircleGeometry(0.42, 12), std('#4caf50'), x + Math.cos(a) * rnd(1, 2.4), 0.07, z + Math.sin(a) * rnd(1, 2.4), false);
        pad.rotation.x = -Math.PI / 2;
        scene.add(pad);
        if (i % 2) scene.add(mesh(new THREE.SphereGeometry(0.12, 8, 8), std('#ff9ecf'), pad.position.x, 0.16, pad.position.z, false));
      }
      for (let i = 0; i < 4; i++) {
        const k = mesh(new THREE.SphereGeometry(0.2, 10, 8), std(i % 2 ? '#ff8a3d' : '#fff'), x, -0.12, z, false);
        k.scale.set(1, 0.45, 1.9);
        k.userData = { a: i * 1.6, r: 1.2 + i * 0.4, s: 0.5 + i * 0.12 };
        scene.add(k);
        W.koi.push({ m: k, cx: x, cz: z });
      }
    }
    function buildFountain(W, x, z) {
      blockers.push({ x, z, r: 2.1 });
      const F = grp(x, 0, z);
      F.add(mesh(new THREE.CylinderGeometry(1.75, 1.9, 0.5, 32), std('#a89a86'), 0, 0.25, 0));
      const w = waterMesh(new THREE.CircleGeometry(1.55, 32), '#3aa0f0', '#8fe0ff', 0.85);
      w.rotation.x = -Math.PI / 2;
      w.position.y = 0.42;
      F.add(w);
      F.add(mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.5, 16), std('#ffd34d', { metalness: 0.5, roughness: 0.35 }), 0, 1.15, 0));
      F.add(mesh(new THREE.CylinderGeometry(0.75, 0.55, 0.22, 24), std('#ffd34d', { metalness: 0.5, roughness: 0.35 }), 0, 1.95, 0));
      F.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), std('#fff2b0', { metalness: 0.6, roughness: 0.3 }), 0, 2.15, 0));
      scene.add(F);
      const n = 90,
        spray = points(n, '#dff4ff', 5, 0.9, false, true, () => [x, 2.2, z]);
      spray.userData.v = Array.from({ length: n }, () => [0, 0, 0, Math.random()]);
      spray.userData.o = [x, 2.15, z];
      scene.add(spray);
      W.fountain = spray;
    }
    function buildGazebo(W, x, z) {
      blockers.push({ x, z, r: 2.7 });
      const Gz = grp(x, onGround(x, z), z);
      Gz.add(mesh(new THREE.CylinderGeometry(2.5, 2.6, 0.3, 6), std('#c9b28a'), 0, 0.15, 0));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        Gz.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 10), std('#fff6e3'), Math.cos(a) * 2.2, 1.5, Math.sin(a) * 2.2));
      }
      const rail = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.05, 8, 48), std('#fff6e3'));
      rail.rotation.x = Math.PI / 2;
      rail.position.y = 1;
      Gz.add(rail);
      const roof = mesh(new THREE.ConeGeometry(2.9, 1.4, 6), std(theme.candy ? '#ff6fae' : '#c2527f'), 0, 3.35, 0);
      Gz.add(roof);
      Gz.add(mesh(new THREE.SphereGeometry(0.18, 10, 8), std('#ffd34d', { metalness: 0.6, roughness: 0.3 }), 0, 4.1, 0, false));
      scene.add(Gz);
    }
    function buildCrystal(W, x, z) {
      blockers.push({ x, z, r: 1.3 });
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.85, 0), new THREE.MeshStandardMaterial({ color: '#c9a8ff', emissive: '#7a3fff', emissiveIntensity: 1.1, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.92 }));
      c.scale.set(1, 1.9, 1);
      c.position.set(x, 2.1, z);
      c.castShadow = true;
      scene.add(c);
      const l = new THREE.PointLight('#a06bff', 6, 10, 2);
      l.position.set(x, 2.2, z);
      scene.add(l);
      const base = mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 8), std('#5b4a7a'), x, 0.2, z);
      scene.add(base);
      const sp = points(24, '#d6b8ff', 6, 0.9, true, true, () => [x + rnd(-1.4, 1.4), rnd(0.6, 3.6), z + rnd(-1.4, 1.4)]);
      scene.add(sp);
      W.crystal = { m: c, l, sp, x, z };
    }
    function buildSakura(W, x, z) {
      blockers.push({ x, z, r: 1.1 });
      const Tg = grp(x, onGround(x, z), z);
      Tg.add(mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 10), std('#6b3f24'), 0, 1.3, 0));
      for (const [dx, dy, dz, r] of [[0, 3.6, 0, 1.9], [-1.4, 3.0, 0.3, 1.4], [1.3, 3.1, -0.4, 1.5], [0.2, 2.9, 1.3, 1.2], [-0.3, 3.0, -1.3, 1.25]]) Tg.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(['#ffb7d5', '#ff9ecf', '#ffc8e0'][Math.floor(hash(dx, dz) * 3)], { flatShading: true }), dx, dy, dz));
      scene.add(Tg);
    }
    function buildLanterns(W) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5,
          x = Math.cos(a) * 9.2,
          z = Math.sin(a) * 9.2;
        if (blocked(x, z, 0.5)) continue;
        blockers.push({ x, z, r: 0.45 });
        const L = grp(x, onGround(x, z), z);
        L.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.7, 8), std('#5a3a22'), 0, 0.85, 0));
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.36), new THREE.MeshStandardMaterial({ color: '#ff5b3d', emissive: '#ff8a3d', emissiveIntensity: 0 }));
        box.position.y = 1.85;
        box.castShadow = true;
        L.add(box);
        L.add(mesh(new THREE.ConeGeometry(0.3, 0.2, 4), std('#3a2a1a'), 0, 2.15, 0, false));
        const pl = new THREE.PointLight('#ffa040', 0, 7, 2);
        pl.position.y = 1.85;
        L.add(pl);
        scene.add(L);
        W.lanterns.push({ box, pl });
      }
    }
    function buildRainbow(W) {
      const cols = ['#ff5b5b', '#ffa54d', '#ffe066', '#6fdc6f', '#5ab4ff', '#8a6bff'];
      const Rb = grp(0, -1, -19);
      cols.forEach((c, i) => {
        const t = new THREE.Mesh(new THREE.TorusGeometry(15.5 - i * 0.42, 0.2, 8, 64, Math.PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.72 }));
        Rb.add(t);
      });
      scene.add(Rb);
    }
    function buildFence(W, r, kind) {
      const gapA = Math.PI / 2,
        gapW = 0.16;
      const white = kind === 'candy' ? '#ffffff' : kind === 'wood' ? '#b8a36a' : '#fffaf0',
        alt = kind === 'candy' ? '#ff4d6d' : white;
      const n = 84,
        geo = new THREE.BoxGeometry(0.14, 0.95, 0.06),
        im1 = new THREE.InstancedMesh(geo, std(white), n),
        im2 = new THREE.InstancedMesh(geo, std(alt), n);
      im1.castShadow = im2.castShadow = true;
      const M = new THREE.Matrix4(),
        Qn = new THREE.Quaternion(),
        S = new THREE.Vector3(1, 1, 1),
        Pv = new THREE.Vector3();
      let k1 = 0,
        k2 = 0;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        if (Math.abs(((a - gapA + Math.PI) % (Math.PI * 2)) - Math.PI) < gapW) continue;
        const x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        Pv.set(x, onGround(x, z) + 0.5, z);
        Qn.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + Math.PI / 2);
        M.compose(Pv, Qn, S);
        if (i % 2 || kind !== 'candy') im1.setMatrixAt(k1++, M);
        else im2.setMatrixAt(k2++, M);
      }
      im1.count = k1;
      im2.count = k2;
      scene.add(im1);
      if (k2) scene.add(im2);
      for (const y of [0.38, 0.72]) {
        const rail = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 6, 96, Math.PI * 2 - gapW * 2), std(kind === 'candy' ? '#ff4d6d' : white));
        rail.rotation.x = Math.PI / 2;
        rail.rotation.z = gapA + gapW;
        rail.position.y = y;
        scene.add(rail);
      }
      for (const s of [-1, 1]) {
        const a = gapA + s * (gapW + 0.02),
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        const post = mesh(new THREE.BoxGeometry(0.26, 1.3, 0.26), std(white), x, 0.65, z);
        scene.add(post, mesh(new THREE.SphereGeometry(0.17, 10, 8), std(kind === 'candy' ? '#ff4d6d' : '#ffd34d'), x, 1.42, z, false));
      }
    }
    function treeBlob(x, z, k, t) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      Tg.add(mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.1, 9), std('#7a4a2a'), 0, 1.05, 0));
      const greens = t.candy ? ['#ff6fae', '#b388ff', '#ffd34d'] : t.snow ? ['#2f6f58', '#3f8a6c'] : ['#3f9a45', '#58b957', '#2f8a3a'];
      [[0, 3.1, 0, 1.45], [-1.05, 2.6, 0.2, 1.05], [1.0, 2.7, -0.3, 1.1], [0.1, 2.5, 1.0, 0.95]].forEach(([dx, dy, dz, r], i) => Tg.add(mesh(new THREE.IcosahedronGeometry(r, 1), std(greens[i % greens.length], { flatShading: true }), dx, dy, dz)));
      if (!t.candy && hash(x, z) > 0.55) for (let i = 0; i < 4; i++) Tg.add(mesh(new THREE.SphereGeometry(0.13, 8, 8), std('#ff4d4d'), rnd(-1.2, 1.2), rnd(2.2, 3.6), rnd(-0.8, 1.2), false));
      return Tg;
    }
    function treePine(x, z, k) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      Tg.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 8), std('#5a3a22'), 0, 0.7, 0));
      [[1.5, 1.9, 1.6], [1.2, 1.7, 2.7], [0.85, 1.5, 3.7]].forEach(([r, h, y]) => {
        Tg.add(mesh(new THREE.ConeGeometry(r, h, 8), std('#2f6f58', { flatShading: true }), 0, y, 0));
        if (theme.snow) Tg.add(mesh(new THREE.ConeGeometry(r * 0.72, h * 0.5, 8), std('#ffffff'), 0, y + h * 0.28, 0, false));
      });
      return Tg;
    }
    function treePalm(x, z, k) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      const lean = rnd(-0.18, 0.18);
      for (let i = 0; i < 6; i++) Tg.add(mesh(new THREE.CylinderGeometry(0.16 - i * 0.012, 0.19 - i * 0.012, 0.75, 8), std('#9a6a3a'), lean * i * 0.7, 0.35 + i * 0.72, 0));
      const top = grp(lean * 4, 4.7, 0);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2,
          fr = mesh(new THREE.ConeGeometry(0.42, 2.6, 5), std('#2e9e4f', { flatShading: true }), Math.cos(a) * 1.1, -0.35, Math.sin(a) * 1.1);
        fr.rotation.set(Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25);
        fr.scale.set(1, 1, 0.35);
        top.add(fr);
      }
      for (let i = 0; i < 3; i++) top.add(mesh(new THREE.SphereGeometry(0.2, 8, 8), std('#6b4a2a'), Math.cos(i * 2.1) * 0.28, -0.2, Math.sin(i * 2.1) * 0.28, false));
      Tg.add(top);
      return Tg;
    }
    function treeCactus(x, z, k) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      const g = std('#4f9a4a');
      Tg.add(mesh(new THREE.CapsuleGeometry(0.42, 2.4, 6, 12), g, 0, 1.6, 0));
      const arm = (sx, y) => {
        const a1 = mesh(new THREE.CapsuleGeometry(0.22, 0.7, 4, 10), g, sx * 0.75, y, 0);
        a1.rotation.z = Math.PI / 2;
        const a2 = mesh(new THREE.CapsuleGeometry(0.22, 0.8, 4, 10), g, sx * 1.1, y + 0.6, 0);
        Tg.add(a1, a2);
      };
      arm(-1, 1.5);
      arm(1, 2.1);
      Tg.add(mesh(new THREE.SphereGeometry(0.18, 8, 8), std('#ff7aa8'), 0, 3.05, 0, false));
      return Tg;
    }
    function treeLolli(x, z, k, i) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      const c = ['#ff6fae', '#b388ff', '#ffd34d', '#6fd3ff', '#7ae582'][i % 5];
      Tg.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 10), std('#ffffff'), 0, 1.3, 0));
      Tg.add(mesh(new THREE.SphereGeometry(1.15, 20, 14), std(c, { roughness: 0.35 }), 0, 3.5, 0));
      const sw = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.09, 8, 40, Math.PI * 1.6), std('#ffffff'));
      sw.position.set(0, 3.5, 1.02);
      sw.scale.set(1, 1, 0.3);
      Tg.add(sw);
      return Tg;
    }
    function treeBamboo(x, z, k) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      for (let i = 0; i < 4; i++) {
        const h = rnd(3.2, 5.2),
          bx = rnd(-0.5, 0.5),
          bz = rnd(-0.5, 0.5);
        Tg.add(mesh(new THREE.CylinderGeometry(0.09, 0.11, h, 7), std('#6fae4a'), bx, h / 2, bz));
        for (let j = 1; j < h; j += 1.1) {
          const ring = mesh(new THREE.TorusGeometry(0.1, 0.02, 5, 10), std('#4a7f30'), bx, j, bz, false);
          ring.rotation.x = Math.PI / 2;
          Tg.add(ring);
        }
        for (let j = 0; j < 3; j++) {
          const lf = mesh(new THREE.ConeGeometry(0.16, 0.9, 4), std('#5fa845', { flatShading: true }), bx + rnd(-0.4, 0.4), h - rnd(0.2, 1.6), bz + rnd(-0.4, 0.4), false);
          lf.rotation.set(rnd(-1.4, 1.4), 0, rnd(-1.4, 1.4));
          Tg.add(lf);
        }
      }
      return Tg;
    }
    function treeDead(x, z, k) {
      const Tg = grp(x, onGround(x, z), z);
      Tg.scale.setScalar(k);
      const w = std('#2a1a14');
      Tg.add(mesh(new THREE.CylinderGeometry(0.14, 0.3, 2.6, 7), w, 0, 1.3, 0));
      for (let i = 0; i < 3; i++) {
        const b = mesh(new THREE.CylinderGeometry(0.05, 0.11, 1.3, 6), w, 0, 1.8 + i * 0.4, 0);
        b.rotation.set(rnd(-0.9, 0.9), rnd(0, 6), rnd(-0.9, 0.9));
        b.position.x += Math.sin(i * 2) * 0.3;
        Tg.add(b);
      }
      return Tg;
    }
    function rock(x, z, r, c) {
      const m = mesh(new THREE.IcosahedronGeometry(r, 0), std(c, { flatShading: true }), x, onGround(x, z) + r * 0.45, z);
      m.rotation.set(rnd(0, 3), rnd(0, 3), 0);
      m.scale.set(1, rnd(0.6, 0.9), rnd(0.8, 1.3));
      return m;
    }
    function buildTrees(W) {
      const t = theme,
        kind = t.trees;
      const n = isPhone() ? 16 : 24;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rnd(-0.12, 0.12),
          r = rnd(13.5, 26),
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        if (t.ocean && z < -9) continue;
        if (blocked(x, z, 1.5)) continue;
        if (Math.abs(a - Math.PI / 2) < 0.2 && r < 16) continue; // keep the gate view open
        const k = rnd(0.8, 1.35);
        let m = null;
        if (kind === 'blob') m = treeBlob(x, z, k, t);
        else if (kind === 'pine') m = treePine(x, z, k);
        else if (kind === 'palm') m = treePalm(x, z, k);
        else if (kind === 'cactus') m = i % 3 ? treeCactus(x, z, k * 0.8) : rock(x, z, rnd(0.5, 1.1), '#c48a52');
        else if (kind === 'lolli') m = treeLolli(x, z, k, i);
        else if (kind === 'bamboo') m = i % 4 === 0 ? treeBlob(x, z, k, { candy: false, snow: false }) : treeBamboo(x, z, k);
        else if (kind === 'dead') m = i % 2 ? treeDead(x, z, k) : rock(x, z, rnd(0.6, 1.4), '#2c211e');
        else if (t.space) m = rock(x, z, rnd(0.4, 1.3), '#80848f');
        if (m) {
          scene.add(m);
          blockers.push({ x, z, r: 0.9 });
        }
      }
      // a few big ones far back for a forest edge
      if (kind && !t.space && !t.ocean)
        for (let i = 0; i < 14; i++) {
          const a = rnd(0, Math.PI * 2),
            r = rnd(27, 36),
            x = Math.cos(a) * r,
            z = Math.sin(a) * r;
          const k = rnd(1.2, 1.8);
          const m = kind === 'pine' ? treePine(x, z, k) : kind === 'palm' ? treePalm(x, z, k) : kind === 'cactus' ? rock(x, z, rnd(1, 2.2), '#b8703f') : kind === 'lolli' ? treeLolli(x, z, k, i) : kind === 'bamboo' ? treeBamboo(x, z, k) : kind === 'dead' ? treeDead(x, z, k) : treeBlob(x, z, k, t);
          m.traverse(o => (o.castShadow = false));
          scene.add(m);
        }
      // bushes near the play area
      if (kind === 'blob' || kind === 'bamboo' || kind === 'pine')
        for (let i = 0; i < 8; i++) {
          const [x, z] = freeSpot(10.5, 20);
          if (Math.hypot(x, z) < 6) continue;
          const b = grp(x, onGround(x, z), z);
          b.add(mesh(new THREE.IcosahedronGeometry(0.55, 1), std('#3f9a45', { flatShading: true }), 0, 0.4, 0), mesh(new THREE.IcosahedronGeometry(0.45, 1), std('#58b957', { flatShading: true }), 0.45, 0.35, 0.1), mesh(new THREE.IcosahedronGeometry(0.4, 1), std('#2f8a3a', { flatShading: true }), -0.4, 0.3, -0.1));
          if (i % 2) b.add(mesh(new THREE.SphereGeometry(0.09, 6, 6), std('#ff6fae'), 0.2, 0.85, 0.2, false));
          scene.add(b);
          blockers.push({ x, z, r: 0.9 });
        }
    }
    function buildMountains(W) {
      const t = theme,
        n = 13;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.2,
          r = rnd(44, 60),
          x = Math.cos(a) * r,
          z = Math.sin(a) * r,
          h = rnd(11, 24),
          rr = rnd(9, 15);
        if (t.mesa) {
          const m = mesh(new THREE.CylinderGeometry(rr * 0.8, rr, h * 0.6, 8), std(i % 2 ? t.mount[0] : t.mount[1], { flatShading: true }), x, h * 0.3, z, false);
          scene.add(m);
          scene.add(mesh(new THREE.CylinderGeometry(rr * 0.5, rr * 0.82, 1.2, 8), std('#e0a06a'), x, h * 0.6 + 0.5, z, false));
          continue;
        }
        const m = mesh(new THREE.ConeGeometry(rr, h, 7), std(i % 2 ? t.mount[0] : t.mount[1], { flatShading: true }), x, h / 2 - 1, z, false);
        m.rotation.y = rnd(0, 1);
        scene.add(m);
        if (t.cap) {
          const cap = mesh(new THREE.ConeGeometry(rr * 0.42, h * 0.42, 7), std('#ffffff'), x, h - 1 - h * 0.21 + 0.01, z, false);
          cap.rotation.y = m.rotation.y;
          scene.add(cap);
        }
      }
    }
    function buildIslands(W) {
      for (const [x, z, r, h] of [[-38, -70, 12, 6], [30, -78, 9, 4.5], [-4, -95, 16, 7]]) {
        scene.add(mesh(new THREE.ConeGeometry(r, h, 9), std('#3f8a3f', { flatShading: true }), x, h / 2 - 1.5, z, false));
        scene.add(mesh(new THREE.ConeGeometry(r * 1.25, 1.2, 9), std('#f3dda4'), x, -0.4, z, false));
      }
    }
    function buildVolcano(W) {
      const V = grp(-8, -1, -36);
      V.add(mesh(new THREE.ConeGeometry(18, 28, 9), std('#4a2f28', { flatShading: true }), 0, 14, 0, false));
      const crater = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1, 12), new THREE.MeshStandardMaterial({ color: '#ff6a1a', emissive: '#ff5a10', emissiveIntensity: 2.2 }));
      crater.position.y = 27.6;
      V.add(crater);
      // lava river down the front
      const lv = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 26, 1, 8), new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff5a10', emissiveIntensity: 1.8, side: THREE.DoubleSide }));
      lv.position.set(2, 14.2, 11.8);
      lv.rotation.x = -Math.atan2(18, 28) - Math.PI / 2 + 0.02;
      V.add(lv);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(4.5, 24), new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff5a10', emissiveIntensity: 1.6 }));
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(3, 1.06, 20.5);
      V.add(pool);
      const gl = new THREE.PointLight('#ff6a1a', 60, 60, 1.6);
      gl.position.set(0, 28, 0);
      V.add(gl);
      const s = points(60, '#ff8a3d', 9, 0.9, true, true, () => [rnd(-2, 2), 28 + rnd(0, 8), rnd(-2, 2)]);
      V.add(s);
      W.craterSmoke = s;
      scene.add(V);
      for (let i = 0; i < 5; i++) {
        const a = rnd(0, 6.28),
          r = rnd(13, 20),
          p = new THREE.Mesh(new THREE.CircleGeometry(rnd(0.8, 1.8), 16), new THREE.MeshStandardMaterial({ color: '#ff7a1a', emissive: '#ff5a10', emissiveIntensity: 1.4 }));
        p.rotation.x = -Math.PI / 2;
        p.position.set(Math.cos(a) * r, onGround(Math.cos(a) * r, Math.sin(a) * r) + 0.05, Math.sin(a) * r);
        scene.add(p);
      }
    }
    function buildMoonBase(W) {
      // rocket
      const Rk = grp(7.5, onGround(7.5, -7), -7);
      blockers.push({ x: 7.5, z: -7, r: 1.8 });
      Rk.add(mesh(new THREE.CylinderGeometry(0.8, 0.9, 3.4, 20), std('#eef0f5', { metalness: 0.3, roughness: 0.4 }), 0, 2.2, 0));
      Rk.add(mesh(new THREE.ConeGeometry(0.8, 1.6, 20), std('#e0584f'), 0, 4.7, 0));
      Rk.add(mesh(new THREE.SphereGeometry(0.34, 14, 10), new THREE.MeshStandardMaterial({ color: '#5ab4ff', emissive: '#3a90ff', emissiveIntensity: 0.6 }), 0, 2.9, 0.75, false));
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2,
          fin = mesh(new THREE.BoxGeometry(0.14, 1.2, 0.9), std('#e0584f'), Math.cos(a) * 1.05, 0.7, Math.sin(a) * 1.05);
        fin.rotation.y = -a;
        Rk.add(fin);
      }
      Rk.add(mesh(new THREE.CylinderGeometry(0.5, 0.75, 0.5, 16), std('#7a7f8c'), 0, 0.25, 0));
      scene.add(Rk);
      // flag
      const Fg = grp(-4.5, onGround(-4.5, 6), 6);
      Fg.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), std('#c9ccd6'), 0, 1.1, 0, false));
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ map: textTex('PAPERBULL', '#ff8a1f', '#ffffff', 256, 128, 42), side: THREE.DoubleSide }));
      flag.position.set(0.62, 1.85, 0);
      Fg.add(flag);
      scene.add(Fg);
      // solar panel
      const sp = mesh(new THREE.BoxGeometry(2.2, 0.08, 1.3), std('#1f3a78', { metalness: 0.6, roughness: 0.3 }), -9, 1.0, 1.5);
      sp.rotation.x = -0.6;
      scene.add(sp, mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 8), std('#c9ccd6'), -9, 0.5, 1.5));
    }
    function buildSnowman(W, x, z) {
      blockers.push({ x, z, r: 1.1 });
      const S = grp(x, onGround(x, z), z);
      S.add(mesh(new THREE.SphereGeometry(0.85, 18, 14), std('#ffffff'), 0, 0.8, 0), mesh(new THREE.SphereGeometry(0.62, 18, 14), std('#ffffff'), 0, 1.95, 0), mesh(new THREE.SphereGeometry(0.46, 18, 14), std('#ffffff'), 0, 2.85, 0));
      const nose = mesh(new THREE.ConeGeometry(0.1, 0.55, 8), std('#ff8a3d'), 0, 2.85, 0.65, false);
      nose.rotation.x = Math.PI / 2;
      S.add(nose);
      for (const sx of [-0.16, 0.16]) S.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), std('#222'), sx, 2.98, 0.42, false));
      for (const y of [1.95, 1.7, 1.45]) S.add(mesh(new THREE.SphereGeometry(0.05, 6, 6), std('#222'), 0, y, 0.6, false));
      const hat = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 14), std('#222'), 0, 3.45, 0);
      S.add(hat, mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 14), std('#222'), 0, 3.22, 0));
      const scarf = mesh(new THREE.TorusGeometry(0.45, 0.1, 8, 20), std('#e0584f'), 0, 2.45, 0, false);
      scarf.rotation.x = Math.PI / 2;
      S.add(scarf);
      scene.add(S);
    }
    function buildTorii(W, x, z) {
      blockers.push({ x, z, r: 2 });
      const Tr = grp(x, onGround(x, z), z);
      Tr.rotation.y = Math.atan2(-x, -z);
      const red = std('#d9322b');
      Tr.add(mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.6, 12), red, -1.4, 1.8, 0), mesh(new THREE.CylinderGeometry(0.16, 0.2, 3.6, 12), red, 1.4, 1.8, 0));
      const top = mesh(new THREE.BoxGeometry(4.2, 0.3, 0.42), std('#1a1a1a'), 0, 3.75, 0);
      top.rotation.z = 0.0;
      Tr.add(top, mesh(new THREE.BoxGeometry(3.4, 0.22, 0.3), red, 0, 3.1, 0));
      scene.add(Tr);
      // stone lantern
      const St = grp(x - 3, onGround(x - 3, z + 1), z + 1);
      St.add(mesh(new THREE.BoxGeometry(0.6, 0.3, 0.6), std('#9aa0a6'), 0, 0.15, 0), mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.1, 8), std('#9aa0a6'), 0, 0.85, 0), mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), std('#b0b6bc'), 0, 1.65, 0), mesh(new THREE.ConeGeometry(0.55, 0.4, 4), std('#8a9096'), 0, 2.1, 0));
      scene.add(St);
    }
    function clumpGeo(h, w, dark, light) {
      const pos = [],
        col = [],
        d = new THREE.Color(dark),
        l = new THREE.Color(light),
        c = new THREE.Color();
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI,
          ca = Math.cos(a),
          sa = Math.sin(a),
          x0 = -w / 2,
          x1 = w / 2,
          xt = w * 0.08;
        for (const [x, y] of [[x0, 0], [x1, 0], [xt, h], [x0, 0], [xt, h], [-xt, h]]) {
          pos.push(x * ca, y, x * sa);
          c.copy(d).lerp(l, y / h);
          col.push(c.r, c.g, c.b);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      return g;
    }
    function buildGrass(W, n) {
      const geo = clumpGeo(0.4, 0.15, theme.grass[0], theme.grass[1]);
      const mat = swayShader(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), 0.22, 1.6);
      const im = new THREE.InstancedMesh(geo, mat, n);
      im.receiveShadow = true;
      const M = new THREE.Matrix4(),
        Qn = new THREE.Quaternion(),
        S = new THREE.Vector3(),
        Pv = new THREE.Vector3(),
        Y = new THREE.Vector3(0, 1, 0),
        C = new THREE.Color();
      let k = 0;
      for (let i = 0; i < n * 3 && k < n; i++) {
        const a = Math.random() * Math.PI * 2,
          r = Math.pow(Math.random(), 0.75) * 26,
          x = Math.cos(a) * r,
          z = Math.sin(a) * r;
        if (theme.ocean && z < -9.5) continue;
        if (blockers.some(b => Math.hypot(x - b.x, z - b.z) < (b.grassOnly ? 0.95 : b.r + 0.1))) continue;
        Pv.set(x, onGround(x, z) - 0.02, z);
        Qn.setFromAxisAngle(Y, Math.random() * Math.PI);
        const s = rnd(0.75, 1.25);
        S.set(s, s * rnd(0.75, 1.15), s);
        M.compose(Pv, Qn, S);
        im.setMatrixAt(k, M);
        C.setHSL(0, 0, rnd(0.45, 0.62));
        im.setColorAt(k, C);
        k++;
      }
      im.count = k;
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      scene.add(im);
      W.grass = im;
    }
    function buildFlowers(W, n) {
      const cols = theme.candy ? ['#ff4d8d', '#ffd34d', '#6fd3ff', '#b388ff'] : theme.snow ? ['#ffffff', '#c9e6ff'] : ['#ff6fae', '#ffd34d', '#ffffff', '#b388ff', '#ff8a5c'];
      const geo = new THREE.PlaneGeometry(0.34, 0.5);
      geo.translate(0, 0.25, 0);
      const cross = new THREE.BufferGeometry();
      const a = geo.attributes.position.array,
        u = geo.attributes.uv.array,
        idx = Array.from(geo.index.array);
      // second quad rotated 90°
      const pos2 = [];
      for (let i = 0; i < a.length; i += 3) pos2.push(a[i + 2] || 0, a[i + 1], a[i]);
      cross.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...pos2], 3));
      cross.setAttribute('uv', new THREE.Float32BufferAttribute([...u, ...u], 2));
      cross.setIndex([...idx, ...idx.map(i => i + a.length / 3)]);
      cross.computeVertexNormals();
      const per = Math.ceil(n / cols.length);
      const M = new THREE.Matrix4(),
        Qn = new THREE.Quaternion(),
        S = new THREE.Vector3(),
        Pv = new THREE.Vector3(),
        Y = new THREE.Vector3(0, 1, 0);
      cols.forEach(c => {
        const mat = swayShader(new THREE.MeshLambertMaterial({ map: flowerTexture(c), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), 0.12, 1.3);
        const im = new THREE.InstancedMesh(cross, mat, per);
        let k = 0;
        for (let i = 0; i < per * 4 && k < per; i++) {
          const ang = Math.random() * Math.PI * 2,
            r = Math.pow(Math.random(), 0.7) * 16,
            x = Math.cos(ang) * r,
            z = Math.sin(ang) * r;
          if (theme.ocean && z < -9) continue;
          if (blockers.some(b => Math.hypot(x - b.x, z - b.z) < (b.grassOnly ? 1 : b.r + 0.15))) continue;
          Pv.set(x, onGround(x, z), z);
          Qn.setFromAxisAngle(Y, Math.random() * Math.PI);
          const s = rnd(0.8, 1.3);
          S.set(s, s, s);
          M.compose(Pv, Qn, S);
          im.setMatrixAt(k++, M);
        }
        im.count = k;
        im.instanceMatrix.needsUpdate = true;
        scene.add(im);
      });
    }

    /* ---------------- phase (time of day) ---------------- */
    function phaseNow() {
      if (theme && theme.space) return 'day';
      return phOverride || PG().phase();
    }
    function applyPhase(dt) {
      const W = world;
      if (!W) return;
      const ph = phaseNow(),
        P = PHASES[ph],
        sky = W.sky[ph] || SKY_DEF[ph];
      const snap = !cur;
      if (snap) cur = { top: new THREE.Color(), mid: new THREE.Color(), bot: new THREE.Color(), sunC: new THREE.Color(), hemiS: new THREE.Color(), hemiG: new THREE.Color(), tint: new THREE.Color(), sunDir: new THREE.Vector3(), sunI: 0, hemiI: 0, amb: 0, stars: 0, cloud: 0, moon: 0, win: 0, lantern: 0, fly: 0, sunSprite: 0 };
      const k = snap ? 1 : 1 - Math.exp(-dt * 1.6);
      const C = cur;
      C.top.lerp(new THREE.Color(sky[0]), k);
      C.mid.lerp(new THREE.Color(sky[1]), k);
      C.bot.lerp(new THREE.Color(sky[2]), k);
      C.sunC.lerp(new THREE.Color(P.sun[0]), k);
      C.hemiS.lerp(new THREE.Color(P.hemi[0]), k);
      C.hemiG.lerp(new THREE.Color(P.hemi[1]), k);
      C.tint.lerp(new THREE.Color(theme.space ? '#ffffff' : P.tint), k);
      C.sunDir.lerp(new THREE.Vector3(...P.sunDir), k);
      for (const key of ['sunI', 'hemiI', 'amb', 'stars', 'cloud', 'moon', 'win', 'lantern', 'fly', 'sunSprite']) {
        const target = key === 'sunI' ? P.sun[1] : key === 'hemiI' ? P.hemi[2] : key === 'stars' && theme.space ? 1 : P[key];
        C[key] = lerp(C[key], target, k);
      }
      W.skyMat.uniforms.top.value.copy(C.top);
      W.skyMat.uniforms.mid.value.copy(C.mid);
      W.skyMat.uniforms.bot.value.copy(C.bot);
      scene.fog.color.copy(theme.space ? new THREE.Color('#000000') : C.mid);
      W.lights.hemi.color.copy(C.hemiS);
      W.lights.hemi.groundColor.copy(C.hemiG);
      W.lights.hemi.intensity = C.hemiI * (theme.space ? 0.7 : 1);
      W.lights.amb.intensity = C.amb;
      const sd = C.sunDir.clone().normalize();
      W.lights.sun.position.copy(sd).multiplyScalar(48);
      W.lights.sun.color.copy(C.sunC);
      W.lights.sun.intensity = C.sunI * (theme.space ? 1.25 : 1);
      W.sunSprite.position.copy(sd).multiplyScalar(180);
      W.sunSprite.material.opacity = C.sunSprite * (theme.space ? 0.7 : 1);
      W.sunSprite.scale.setScalar(theme.space ? 18 : 38 - 10 * (1 - sd.y));
      const md = new THREE.Vector3(-0.35, 0.68, -0.55).normalize().multiplyScalar(175);
      W.moon.position.copy(md);
      W.moonGlow.position.copy(md);
      W.moon.material.opacity = C.moon;
      W.moonGlow.material.opacity = C.moon * 0.9;
      W.stars.material.uniforms.uOpacity.value = C.stars;
      for (const c of W.clouds) c.material.opacity = C.cloud * 0.92;
      for (const w of W.windows) w.material.emissiveIntensity = C.win * 1.6;
      if (W.houseLight) W.houseLight.intensity = C.win * 5;
      for (const l of W.lanterns) {
        l.box.material.emissiveIntensity = C.lantern * 1.8;
        l.pl.intensity = C.lantern * 6;
      }
      W.fireflies.material.uniforms.uOpacity.value = C.fly;
      W.tint.copy(C.tint);
      for (const a of actors) if (a.mat) a.mat.color.copy(C.tint);
      for (const b of W.bflies) b.material.opacity = 1 - C.fly;
      // fog uniforms for water shaders
      for (const o of W.waters || []) {
        o.material.uniforms.fogColor.value.copy(scene.fog.color);
        o.material.uniforms.fogNear.value = scene.fog.near;
        o.material.uniforms.fogFar.value = scene.fog.far;
        o.material.uniforms.uSun.value.copy(sd);
      }
      const chip = stage && stage.querySelector('.pg-top .pg-chip');
      if (chip && chip.dataset.ph !== ph) {
        chip.dataset.ph = ph;
        chip.textContent = (PG().PH_LBL || PH_LBL)[ph] || PH_LBL[ph];
      }
    }

    /* ---------------- pets ---------------- */
    const FLY_IDS = new Set(['eagle', 'owl', 'peacock', 'swan', 'phoenix', 'griffin', 'snowowl', 'bat', 'butterfly', 'bee', 'parrot']);
    const flies = d => {
      if (!d) return false;
      if (d.exotic && window.ExoticArt) {
        const x = ExoticArt.PETS.find(p => p.id === d.id);
        return !!(x && (x.f.some(f => ['wings', 'batwings', 'crystalwings', 'cosmicwings'].includes(f)) || x.ghost || x.f.includes('tentacles')));
      }
      return FLY_IDS.has(d.id);
    };
    function makeActor(p) {
      const d = PET[p.id];
      if (!d) return null;
      const fly = flies(d),
        [x, z] = freeSpot(9);
      const a = { p, d, fly, x, z, tx: x, tz: z, y: 0, mode: 'idle', t: rnd(0.5, 3), ph: rnd(0, 6), v: (fly ? 1.5 : 1.15) * rnd(0.85, 1.2), grp: new THREE.Group(), mat: null, mesh: null, sh: null, scale: 1, pop: 0, hasHelmet: false };
      a.grp.position.set(x, onGround(x, z), z);
      scene.add(a.grp);
      const key = p.id + '|' + (p.mut || '');
      svgTexture(key, petArt(p.id)).then(tex => {
        if (!tex || !a.grp.parent) return;
        const size = d.r === 's' || d.ultra ? 2.35 : d.r === 'x' || d.r === 'm' ? 2.15 : 1.9;
        a.size = size;
        const geo = new THREE.PlaneGeometry(size, size);
        a.mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.18, depthWrite: true, side: THREE.DoubleSide, color: world ? world.tint : '#ffffff' });
        a.mesh = new THREE.Mesh(geo, a.mat);
        a.mesh.position.y = size * 0.5 - size * 0.06;
        a.mesh.renderOrder = 2;
        // shadow-only cutout that always faces the sun
        const shm = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 });
        a.sh = new THREE.Mesh(geo, shm);
        a.sh.castShadow = true;
        a.sh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
        a.sh.position.y = a.mesh.position.y;
        a.grp.add(a.mesh, a.sh);
        if (theme.space) {
          const helmet = new THREE.Mesh(new THREE.SphereGeometry(size * 0.6, 24, 16), new THREE.MeshPhysicalMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0, clearcoat: 1, side: THREE.FrontSide, depthWrite: false }));
          helmet.position.y = size * 0.62;
          helmet.renderOrder = 3;
          a.grp.add(helmet);
          a.hasHelmet = true;
        }
        a.pop = 1;
      });
      return a;
    }
    function syncActors(force) {
      const home = PG().home(),
        want = new Map(home.map(p => [p.uid, p]));
      let changed = false;
      for (let i = actors.length - 1; i >= 0; i--)
        if (!want.has(actors[i].p.uid)) {
          scene.remove(actors[i].grp);
          if (sel === actors[i]) closeCard();
          actors.splice(i, 1);
          changed = true;
        }
      for (const p of home)
        if (!actors.some(a => a.p.uid === p.uid)) {
          const a = makeActor(p);
          if (a) actors.push(a);
          changed = true;
        }
      if (changed || force) {
        const c = stage && stage.querySelector('#pgCount');
        if (c) c.textContent = `🐾 ${actors.length} pet${actors.length === 1 ? '' : 's'}`;
      }
    }
    function pickTarget(a) {
      const [x, z] = freeSpot(a.fly ? 10 : 9.2);
      a.tx = x;
      a.tz = z;
    }
    const LINES = () => (PG().LINES || ['*happy wiggle*', '♥', 'To the moon! 🚀']);
    function updateActors(dt, night) {
      const camPos = camera.position,
        sunDir = cur ? cur.sunDir : new THREE.Vector3(0.5, 0.8, 0.3),
        shRot = Math.atan2(sunDir.x, sunDir.z),
        reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      for (const a of actors) {
        if (a.p.mission) {
          a.grp.visible = false;
          continue;
        }
        a.grp.visible = true;
        a.t -= dt;
        a.ph += dt;
        if (a.mode === 'sleep' && a.t <= 0) {
          a.mode = 'idle';
          a.t = 1;
          if (a.zz) {
            a.zz.remove();
            a.zz = null;
          }
        }
        if (a.mode === 'idle' && a.t <= 0) {
          if (night && !a.fly && Math.random() < 0.45) {
            a.mode = 'sleep';
            a.t = 10 + Math.random() * 22;
          } else if (Math.random() < 0.2 && !a.fly) {
            a.mode = 'hop';
            a.t = 0.62;
          } else {
            a.mode = 'walk';
            pickTarget(a);
          }
        } else if (a.mode === 'hop' && a.t <= 0) {
          a.mode = 'idle';
          a.t = 1 + Math.random() * 3;
        }
        if ((a.mode === 'walk' || a.mode === 'chase') && !reduce) {
          const dx = a.tx - a.x,
            dz = a.tz - a.z,
            dist = Math.hypot(dx, dz),
            step = a.v * dt * (a.mode === 'chase' ? 2.6 : 1);
          if (a.mode === 'chase' && dist <= Math.max(step, 0.55)) caught(a);
          else if (dist <= step) {
            a.x = a.tx;
            a.z = a.tz;
            a.mode = 'idle';
            a.t = 1.5 + Math.random() * 4;
            if (Math.random() < 0.25) say(a, R(LINES()));
          } else {
            const nx = a.x + (dx / dist) * step,
              nz = a.z + (dz / dist) * step;
            if (!a.fly && blocked(nx, nz, 0.3)) {
              pickTarget(a);
            } else {
              a.x = nx;
              a.z = nz;
            }
            a.lean = clamp((dx / dist) * -0.12, -0.12, 0.12);
          }
        } else a.lean = (a.lean || 0) * 0.9;
        const g = onGround(a.x, a.z),
          gravity = theme.space ? 0.45 : 1;
        let bob = 0,
          sx = 1,
          sy = 1,
          rz = a.lean || 0;
        if (a.fly) {
          a.y = 2.3 + Math.sin(a.ph * 1.7) * 0.35 + (a.d.r === 'x' ? 0.4 : 0);
          rz += Math.sin(a.ph * 1.2) * 0.05;
        } else if (a.mode === 'sleep') {
          a.y = 0;
          sx = 1.06;
          sy = 0.9 + Math.sin(a.ph * 1.8) * 0.02;
          rz = -0.08;
        } else if (a.mode === 'hop') {
          const u = (0.62 - a.t) / 0.62;
          bob = Math.sin(u * Math.PI) * (1.05 / gravity);
          sy = 1 + Math.sin(u * Math.PI) * 0.12;
          sx = 1 - Math.sin(u * Math.PI) * 0.06;
        } else if (a.mode === 'walk' || a.mode === 'chase') {
          const f = a.mode === 'chase' ? 16 : 9,
            s = Math.abs(Math.sin(a.ph * f));
          bob = s * (a.mode === 'chase' ? 0.3 : 0.16) / Math.sqrt(gravity);
          sy = 1 + s * 0.07;
          sx = 1 - s * 0.04;
        } else {
          sy = 1 + Math.sin(a.ph * 2.2) * 0.018;
          sx = 1 - Math.sin(a.ph * 2.2) * 0.012;
        }
        if (a.pop > 0 && a.pop < 1) a.pop = Math.min(1, a.pop + dt * 3);
        const pop = a.pop >= 1 || a.pop === 0 ? 1 : 1.25 - 0.25 * a.pop + Math.sin(a.pop * Math.PI) * 0.15;
        a.grp.position.set(a.x, g + a.y + bob, a.z);
        if (a.mesh) {
          a.mesh.rotation.y = Math.atan2(camPos.x - a.x, camPos.z - a.z);
          a.mesh.rotation.z = rz;
          a.mesh.scale.set(sx * pop, sy * pop, 1);
          a.sh.rotation.y = shRot;
          a.sh.scale.copy(a.mesh.scale);
        }
        if (a.mode === 'sleep' && !a.zz && !a.fly) {
          a.zz = document.createElement('span');
          a.zz.className = 'g3-z';
          a.zz.innerHTML = 'z<i>z</i><i>Z</i>';
          ui.appendChild(a.zz);
        }
      }
      // companion ring
      const comp = actors.find(a => a.p.uid === acct.pets.active && !a.p.mission && !a.fly);
      world.ring.visible = !!comp;
      if (comp) {
        world.ring.position.set(comp.x, onGround(comp.x, comp.z) + 0.03, comp.z);
        world.ring.rotation.z += dt * 0.8;
        world.ring.scale.setScalar(1 + Math.sin(T * 3) * 0.04);
      }
      // meet-ups make hearts
      if (!reduce && Math.random() < dt * 0.35)
        for (let i = 0; i < actors.length; i++)
          for (let j = i + 1; j < actors.length; j++) {
            const A = actors[i],
              B = actors[j];
            if (A.fly !== B.fly || A.p.mission || B.p.mission) continue;
            if (Math.hypot(A.x - B.x, A.z - B.z) < 1.4) {
              floatAt(((A.x + B.x) / 2), (A.fly ? 3.4 : 2.1), ((A.z + B.z) / 2), '💕');
              i = j = 1e9;
            }
          }
    }

    /* ---------------- HTML overlay (labels, bubbles, floats) ---------------- */
    let stRect = null;
    const dbg = { render: 0, frame: 0 };
    function project(x, y, z, out) {
      V1.set(x, y, z).project(camera);
      const r = stRect || (stRect = stage.getBoundingClientRect());
      out.x = ((V1.x + 1) / 2) * r.width;
      out.y = ((1 - V1.y) / 2) * r.height;
      out.ok = V1.z < 1 && out.x > -60 && out.x < r.width + 60 && out.y > -60 && out.y < r.height + 60;
      return out;
    }
    const pr = { x: 0, y: 0, ok: false };
    function say(a, text) {
      if (!ui) return;
      if (a.bubble) a.bubble.remove();
      const b = document.createElement('div');
      b.className = 'g3-say';
      b.textContent = text;
      ui.appendChild(b);
      a.bubble = b;
      a.bubbleT = 2.8;
    }
    function floatAt(x, y, z, ic) {
      if (!ui) return;
      project(x, y, z, pr);
      if (!pr.ok) return;
      const e = document.createElement('span');
      e.className = 'g3-float';
      e.textContent = ic;
      e.style.left = pr.x + 'px';
      e.style.top = pr.y + 'px';
      ui.appendChild(e);
      setTimeout(() => e.remove(), 1500);
    }
    function updateOverlay(dt) {
      for (const a of actors) {
        const top = a.fly ? a.y + (a.size || 1.9) + 0.35 : (a.size || 1.9) + 0.25;
        if (a.bubble) {
          a.bubbleT -= dt;
          if (a.bubbleT <= 0 || a.p.mission) {
            a.bubble.remove();
            a.bubble = null;
          } else {
            project(a.x, a.grp.position.y + top + 0.55, a.z, pr);
            if (pr.y < 40) pr.y = 40;
            a.bubble.style.transform = `translate(${pr.x.toFixed(0)}px, ${pr.y.toFixed(0)}px) translate(-50%, -100%)`;
            a.bubble.style.opacity = pr.ok ? (a.bubbleT < 0.4 ? a.bubbleT / 0.4 : 1) : 0;
          }
        }
        if (a.zz) {
          if (a.mode !== 'sleep') {
            a.zz.remove();
            a.zz = null;
          } else {
            project(a.x + 0.5, a.grp.position.y + top - 0.3, a.z, pr);
            a.zz.style.transform = `translate(${pr.x.toFixed(0)}px, ${pr.y.toFixed(0)}px)`;
            a.zz.style.opacity = pr.ok ? 1 : 0;
          }
        }
        const showLbl = a === sel || a === hover || a.p.uid === acct.pets.active;
        if (showLbl && !a.lbl) {
          a.lbl = document.createElement('span');
          a.lbl.className = 'g3-lbl' + (a.p.uid === acct.pets.active ? ' comp' : '');
          a.lbl.textContent = a.p.name;
          ui.appendChild(a.lbl);
        } else if (!showLbl && a.lbl) {
          a.lbl.remove();
          a.lbl = null;
        }
        if (a.lbl) {
          a.lbl.classList.toggle('comp', a.p.uid === acct.pets.active);
          project(a.x, a.grp.position.y + top - 0.05, a.z, pr);
          a.lbl.style.transform = `translate(${pr.x.toFixed(0)}px, ${pr.y.toFixed(0)}px) translate(-50%, -100%)`;
          a.lbl.style.opacity = pr.ok && !a.p.mission ? 1 : 0;
        }
      }
    }

    /* ---------------- tapping pets, the card ---------------- */
    function closeCard() {
      sel = null;
      const card = stage && stage.querySelector('.pg-card');
      if (card) card.classList.remove('on');
    }
    function tapPet(a) {
      const p = a.p,
        d = a.d;
      if (p.mission) return toast(`${p.name} is away on a mission`, 'info');
      sel = a;
      if (a.mode === 'sleep') {
        a.mode = 'idle';
        a.t = 2;
        say(a, '*yawns* ...huh?');
      } else say(a, R(PET_LINES));
      floatAt(a.x, a.grp.position.y + (a.size || 1.9) + 0.2, a.z, '♥');
      const card = stage.querySelector('.pg-card');
      if (!card) return;
      const cd = PET_COOLDOWN - (Date.now() - (p.lastPet || 0)),
        treats = ITEMS.filter(i => i.type === 'treat' && acct.inv[i.id] > 0),
        M = window.PBExotic && p.mut ? PBExotic.MUT[p.mut] : null,
        rate = Math.round(PG().petRate(p) * PG().boost());
      card.innerHTML = `<button class="pg-x" aria-label="Close">×</button><span class="pg-cart">${petArt(p.id)}</span>
        <div class="pg-ct"><b>${E(p.name)}</b><small style="color:${RARITY[d.r].color}">${d.r === 'x' ? '<span class="x-rar">' + (d.ultra ? 'ULTRA Exotic' : 'Exotic') + '</span>' : d.r === 'm' ? '<span class="m-rar">Mythic</span>' : d.r === 's' ? '<span class="s-rar">SECRET</span>' : RARITY[d.r].name} · Lv ${p.lvl}${M && window.PBExotic ? ' ' + PBExotic.pill(p.mut) : ''}</small>
        ${moodBar(p.mood)}<small class="muted">Earns ${rate} garden coins an hour</small>
        <div class="pg-cb"><button class="btn sm primary" data-a="pet" ${cd > 0 ? 'disabled' : ''}>${cd > 0 ? 'Pet in ' + fmtDur(cd / 1000) : 'Pet'}</button>${treats.length ? `<button class="btn sm" data-a="feed">Feed ${E(treats[0].name)}</button>` : ''}${p.uid !== acct.pets.active ? '<button class="btn sm" data-a="comp">Make companion</button>' : '<span class="pg-comp">Companion</span>'}<button class="btn sm" data-a="look">👀 Look</button></div></div>`;
      card.classList.add('on');
      card.onclick = e => {
        const b = e.target.closest('[data-a], .pg-x');
        if (!b) return;
        if (b.classList.contains('pg-x')) return closeCard();
        const k = b.dataset.a;
        if (k === 'pet') {
          if (petPet(p)) {
            for (let i = 0; i < 5; i++) setTimeout(() => floatAt(a.x + rnd(-0.4, 0.4), a.grp.position.y + (a.size || 1.9) + 0.1, a.z, '❤️'), i * 110);
            say(a, '*purrs*');
            try {
              SFX.play('flip');
            } catch (x) {}
          }
        } else if (k === 'feed' && treats[0]) {
          feedPet(p, treats[0].id);
          floatAt(a.x, a.grp.position.y + (a.size || 1.9) + 0.1, a.z, '😋');
        } else if (k === 'comp') {
          acct.pets.active = p.uid;
          saveAcct(true);
          toast(`${p.name} is now your companion`, 'ok');
        } else if (k === 'look') {
          idleT = 0;
          cam.follow = a;
          setTimeout(() => (cam.follow = null), 4000);
          return;
        }
        tapPet(a);
      };
    }

    /* ---------------- ball, pet all, loot ---------------- */
    function throwBall() {
      const runners = actors.filter(a => !a.fly && !a.p.mission);
      if (!runners.length) return toast('No pets on the ground to play fetch', 'info');
      if (ball) scene.remove(ball.m);
      const [tx, tz] = freeSpot(8.5);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 14), std('#d4f542', { roughness: 0.6 }));
      const seam = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.025, 6, 32), std('#ffffff'));
      seam.rotation.x = 0.7;
      m.add(seam);
      m.castShadow = true;
      const from = camera.position.clone().add(new THREE.Vector3(0, -0.6, 0));
      ball = { m, from, to: new THREE.Vector3(tx, onGround(tx, tz) + 0.26, tz), t: 0, dur: 1.05, landed: false, spin: 0 };
      m.position.copy(from);
      scene.add(m);
      for (const a of runners) {
        a.mode = 'chase';
        a.tx = tx;
        a.tz = tz;
        if (a.zz) {
          a.zz.remove();
          a.zz = null;
        }
        if (Math.random() < 0.45) say(a, R(['BALL!', '!!!', '*zoom*', 'Mine!', 'Dibs!']));
      }
      try {
        SFX.play('flip');
      } catch (e) {}
    }
    function caught(a) {
      if (!ball) {
        a.mode = 'idle';
        a.t = 1;
        return;
      }
      const b = ball;
      ball = null;
      scene.remove(b.m);
      say(a, R(['Got it! 🎾', 'Mine!!', '*proud wiggle*', 'Again! Again!']));
      for (let i = 0; i < 6; i++) setTimeout(() => floatAt(a.x + rnd(-0.6, 0.6), a.grp.position.y + rnd(1.5, 2.6), a.z, R(['⭐', '✨', '🎾'])), i * 70);
      for (const o of actors) {
        if (o.mode === 'chase') {
          o.mode = 'idle';
          o.t = 1 + Math.random() * 2;
        }
        o.p.mood = Math.min(100, o.p.mood + 4);
      }
      petGainXP(a.p, 10);
      saveAcct();
      try {
        SFX.play('coin');
      } catch (e) {}
    }
    function updateBall(dt) {
      if (!ball) return;
      const b = ball;
      if (!b.landed) {
        b.t += dt / b.dur;
        const u = Math.min(1, b.t);
        b.m.position.lerpVectors(b.from, b.to, u);
        b.m.position.y += Math.sin(u * Math.PI) * 4.5 * (theme.space ? 1.6 : 1);
        b.m.rotation.x += dt * 9;
        if (u >= 1) {
          b.landed = true;
          b.bt = 0;
        }
      } else {
        b.bt += dt;
        b.m.position.y = b.to.y + Math.abs(Math.sin(Math.min(b.bt, 0.5) * Math.PI * 2)) * 0.6 * Math.max(0, 1 - b.bt * 2);
        b.m.rotation.x += dt * 3;
      }
    }
    function petAll() {
      let n = 0;
      for (const a of actors) {
        if (a.p.mission) continue;
        if (petPet(a.p)) {
          n++;
          const k = n;
          setTimeout(() => floatAt(a.x, a.grp.position.y + (a.size || 1.9) + 0.1, a.z, '❤️'), k * 90);
          if (a.mode === 'sleep') {
            a.mode = 'idle';
            a.t = 1;
          }
          if (Math.random() < 0.5) say(a, R(['♥', '*purrs*', 'more!', '*happy wiggle*']));
        }
      }
      toast(n ? `You petted ${n} pet${n === 1 ? '' : 's'}. They love you!` : 'Everyone was petted recently. Try again soon.', n ? 'ok' : 'info');
    }
    function spawnLoot() {
      if (!PG().lootOK() || loot.length >= 2) return;
      const [x, z] = freeSpot(9);
      const kind = Math.random() < 0.22 && ITEMS.some(i => i.type === 'treat') ? 'treat' : Math.random() < 0.5 ? 'coin' : 'gem';
      let m;
      if (kind === 'coin') {
        m = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.08, 28), new THREE.MeshStandardMaterial({ color: '#ffd23f', emissive: '#7a4a00', emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.25 }));
        m.rotation.x = Math.PI / 2;
        const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.09, 28), new THREE.MeshStandardMaterial({ color: '#ffb52e', metalness: 0.6, roughness: 0.3 }));
        m.add(inner);
      } else if (kind === 'gem') {
        m = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), new THREE.MeshStandardMaterial({ color: '#7ce7ff', emissive: '#1fa0ff', emissiveIntensity: 0.9, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.95 }));
        m.scale.set(1, 1.5, 1);
      } else {
        m = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex('🦴'), transparent: true, depthWrite: false }));
        m.scale.set(0.9, 0.9, 1);
      }
      const holder = new THREE.Group();
      holder.position.set(x, onGround(x, z), z);
      holder.add(m);
      m.position.y = 0.7;
      m.castShadow = kind !== 'treat';
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(kind === 'gem' ? 'rgba(120,230,255,.9)' : 'rgba(255,230,140,.9)', kind === 'gem' ? 'rgba(60,170,255,.3)' : 'rgba(255,190,60,.3)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
      glow.scale.set(1.8, 1.8, 1);
      glow.position.y = 0.7;
      holder.add(glow);
      scene.add(holder);
      loot.push({ kind, holder, m, glow, born: T, hit: m });
    }
    function takeLoot(L) {
      const msg = PG().lootTake(L.kind);
      loot = loot.filter(x => x !== L);
      if (!msg) {
        scene.remove(L.holder);
        return;
      }
      L.dying = 0;
      try {
        SFX.play('coin');
      } catch (e) {}
      const p = L.holder.position;
      for (let i = 0; i < 6; i++) setTimeout(() => floatAt(p.x + rnd(-0.6, 0.6), p.y + rnd(0.8, 1.8), p.z, L.kind === 'gem' ? '💎' : L.kind === 'treat' ? '🦴' : '🪙'), i * 60);
      toast(msg, 'ok');
      const rm = () => scene.remove(L.holder);
      L.anim = { t: 0, rm };
      dying.push(L);
    }
    let dying = [];
    function updateLoot(dt) {
      for (const L of loot) {
        L.m.rotation.y += dt * 2.2;
        if (L.kind === 'gem') L.m.rotation.y += dt;
        L.m.position.y = 0.7 + Math.sin((T - L.born) * 2.4) * 0.12;
        L.glow.material.opacity = 0.55 + Math.sin((T - L.born) * 4) * 0.25;
        if (T - L.born > 45) {
          scene.remove(L.holder);
          loot = loot.filter(x => x !== L);
        }
      }
      for (let i = dying.length - 1; i >= 0; i--) {
        const L = dying[i];
        L.anim.t += dt * 2;
        L.holder.position.y += dt * 3;
        L.holder.scale.setScalar(Math.max(0.01, 1 - L.anim.t));
        if (L.anim.t >= 1) {
          L.anim.rm();
          dying.splice(i, 1);
        }
      }
    }

    /* ---------------- particles & ambient motion ---------------- */
    function updateAmbient(dt) {
      const W = world,
        night = cur ? cur.fly : 0;
      for (const c of W.clouds) {
        c.position.x += dt * c.userData.v;
        if (c.position.x > 80) c.position.x = -80;
      }
      // fireflies drift
      if (night > 0.02) {
        const P = W.fireflies.geometry.attributes.position,
          base = W.fireflies.userData.base;
        for (let i = 0; i < P.count; i++) {
          const s = i * 0.37;
          P.setXYZ(i, base[i * 3] + Math.sin(T * 0.7 + s) * 0.9, base[i * 3 + 1] + Math.sin(T * 1.1 + s * 2) * 0.4, base[i * 3 + 2] + Math.cos(T * 0.6 + s) * 0.9);
        }
        P.needsUpdate = true;
      }
      if (W.snow) fall(W.snow, dt, 1.6, 16, 24, 0.6);
      if (W.petals) fall(W.petals, dt, 0.7, 6, 6, 1.2, [7.5, -6.5]);
      if (W.embers) rise(W.embers, dt, 1.2, 12);
      if (W.craterSmoke) rise(W.craterSmoke, dt, 2.2, 10, 28);
      if (W.fountain) {
        const P = W.fountain.geometry.attributes.position,
          v = W.fountain.userData.v,
          o = W.fountain.userData.o;
        for (let i = 0; i < P.count; i++) {
          const q = v[i];
          if (q[3] <= 0) {
            const a = Math.random() * Math.PI * 2,
              sp = rnd(0.6, 1.4);
            q[0] = Math.cos(a) * sp;
            q[1] = rnd(3.2, 4.4);
            q[2] = Math.sin(a) * sp;
            q[3] = 1;
            P.setXYZ(i, o[0], o[1], o[2]);
          }
          q[1] -= 9.8 * dt;
          P.setXYZ(i, P.getX(i) + q[0] * dt, P.getY(i) + q[1] * dt, P.getZ(i) + q[2] * dt);
          if (P.getY(i) < 0.45) q[3] = 0;
        }
        P.needsUpdate = true;
      }
      for (const k of W.koi) {
        const u = k.m.userData;
        u.a += dt * u.s;
        k.m.position.set(k.cx + Math.cos(u.a) * u.r, -0.1, k.cz + Math.sin(u.a) * u.r);
        k.m.rotation.y = -u.a;
      }
      if (W.crystal) {
        W.crystal.m.rotation.y += dt * 0.6;
        W.crystal.m.position.y = 2.1 + Math.sin(T * 1.3) * 0.25;
        W.crystal.l.intensity = 5 + Math.sin(T * 2.5) * 1.5;
        W.crystal.sp.rotation.y += dt * 0.4;
      }
      for (let i = 0; i < W.smoke.length; i++) {
        const s = W.smoke[i];
        s.userData.t += dt * 0.22;
        if (s.userData.t > 1) s.userData.t -= 1;
        const u = s.userData.t;
        s.position.set(W.smokeOrigin.x + Math.sin(u * 5 + i) * 0.35 * u, W.smokeOrigin.y + u * 3.2, W.smokeOrigin.z + Math.cos(u * 4) * 0.25 * u);
        const sc = 0.5 + u * 1.6;
        s.scale.set(sc, sc, 1);
        s.material.opacity = (1 - u) * 0.38 * (u < 0.1 ? u * 10 : 1);
      }
      const day = 1 - night;
      for (const b of W.bflies) {
        const u = b.userData;
        u.ph += dt;
        b.position.set(u.cx + Math.sin(u.ph * 0.6) * u.rx, 1.4 + Math.sin(u.ph * 1.9) * 0.5 + Math.sin(u.ph * 7) * 0.08, u.cz + Math.cos(u.ph * 0.45) * u.rz);
        b.scale.x = 0.42 * (0.45 + 0.55 * Math.abs(Math.sin(u.ph * 14)));
        b.visible = day > 0.05;
      }
      if (W.earth) W.earth.rotation.y += dt * 0.03;
    }
    function fall(pts, dt, speed, height, half, sway, center) {
      const P = pts.geometry.attributes.position,
        cx = center ? center[0] : 0,
        cz = center ? center[1] : 0;
      for (let i = 0; i < P.count; i++) {
        let y = P.getY(i) - dt * speed * (0.7 + 0.6 * ((i * 7) % 10) / 10);
        let x = P.getX(i) + Math.sin(T * 1.3 + i) * dt * sway,
          z = P.getZ(i) + Math.cos(T * 0.9 + i * 0.7) * dt * sway * 0.6;
        if (y < onGround(x, z)) {
          y = height;
          x = cx + rnd(-half, half);
          z = cz + rnd(-half, half);
        }
        P.setXYZ(i, x, y, z);
      }
      P.needsUpdate = true;
    }
    function rise(pts, dt, speed, height, base = 0) {
      const P = pts.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) {
        let y = P.getY(i) + dt * speed * (0.6 + ((i * 13) % 10) / 10);
        const x = P.getX(i) + Math.sin(T * 2 + i) * dt * 0.5,
          z = P.getZ(i) + Math.cos(T * 1.5 + i) * dt * 0.5;
        if (y > base + height) y = base + Math.random() * 0.5;
        P.setXYZ(i, x, y, z);
      }
      P.needsUpdate = true;
    }

    /* ---------------- camera & input ---------------- */
    function placeCamera() {
      const t = cam.tgt;
      camera.position.set(t.x + cam.r * Math.sin(cam.phi) * Math.sin(cam.theta), t.y + cam.r * Math.cos(cam.phi), t.z + cam.r * Math.sin(cam.phi) * Math.cos(cam.theta));
      camera.lookAt(t);
    }
    const ptrs = new Map();
    let dragging = false,
      moved = 0,
      downAt = 0,
      pinch0 = 0,
      r0 = 0;
    function bindInput(cv) {
      cv.addEventListener('pointerdown', e => {
        ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        dragging = true;
        moved = 0;
        downAt = Date.now();
        idleT = 0;
        intro = null;
        cam.follow = null;
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
          r0 = cam.r;
        }
        try {
          cv.setPointerCapture(e.pointerId);
        } catch (x) {}
      });
      cv.addEventListener('pointermove', e => {
        const p = ptrs.get(e.pointerId);
        if (!p) {
          hoverAt(e);
          return;
        }
        const dx = e.clientX - p.x,
          dy = e.clientY - p.y;
        moved += Math.abs(dx) + Math.abs(dy);
        p.x = e.clientX;
        p.y = e.clientY;
        idleT = 0;
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()],
            d = Math.hypot(a.x - b.x, a.y - b.y);
          if (pinch0 > 0) cam.r = clamp((r0 * pinch0) / d, 6.5, 32);
          cam.phi = clamp(cam.phi - dy * 0.004, 0.32, 1.48);
        } else {
          cam.theta -= dx * 0.0055;
          cam.phi = clamp(cam.phi - dy * 0.0045, 0.32, 1.48);
          cam.vt = -dx * 0.0055;
        }
      });
      const up = e => {
        const was = ptrs.has(e.pointerId);
        ptrs.delete(e.pointerId);
        if (!ptrs.size) dragging = false;
        if (was && moved < 8 && Date.now() - downAt < 450 && !ptrs.size) tapAt(e);
      };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', e => {
        ptrs.delete(e.pointerId);
        if (!ptrs.size) dragging = false;
      });
      cv.addEventListener(
        'wheel',
        e => {
          e.preventDefault();
          idleT = 0;
          intro = null;
          cam.r = clamp(cam.r * (1 + Math.sign(e.deltaY) * 0.09), 6.5, 32);
        },
        { passive: false }
      );
      cv.addEventListener('dblclick', () => {
        idleT = 0;
        intro = { t: 0, from: { theta: cam.theta, phi: cam.phi, r: cam.r }, to: { theta: 0.18, phi: 1.2, r: 18 }, dur: 0.9 };
      });
    }
    const ray = () => new THREE.Raycaster();
    let rc = null;
    function pointerNDC(e) {
      const r = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    }
    function pickAt(e) {
      rc = rc || ray();
      rc.setFromCamera(pointerNDC(e), camera);
      const petMeshes = actors.filter(a => a.mesh && a.grp.visible).map(a => a.mesh);
      const hits = rc.intersectObjects(petMeshes, false);
      if (hits.length) return { pet: actors.find(a => a.mesh === hits[0].object) };
      const lootHits = rc.intersectObjects(loot.map(L => L.hit), true);
      if (lootHits.length) {
        const o = lootHits[0].object;
        return { loot: loot.find(L => L.hit === o || L.hit === o.parent) };
      }
      return null;
    }
    let hoverT = 0;
    function hoverAt(e) {
      if (isPhone()) return;
      const now = performance.now();
      if (now - hoverT < 70) return;
      hoverT = now;
      const h = pickAt(e);
      hover = h && h.pet ? h.pet : null;
      renderer.domElement.style.cursor = h ? 'pointer' : dragging ? 'grabbing' : 'grab';
    }
    function tapAt(e) {
      const h = pickAt(e);
      if (h && h.pet) return tapPet(h.pet);
      if (h && h.loot) return takeLoot(h.loot);
      closeCard();
    }

    /* ---------------- photo mode ---------------- */
    function photo() {
      try {
        renderer.render(scene, camera);
        const src = renderer.domElement,
          [c, x] = cnv(src.width, src.height);
        x.drawImage(src, 0, 0);
        const s = Math.max(1, src.width / 900);
        x.font = `900 ${Math.round(22 * s)}px system-ui, sans-serif`;
        x.textBaseline = 'bottom';
        x.fillStyle = 'rgba(0,0,0,.35)';
        x.fillRect(0, src.height - 46 * s, src.width, 46 * s);
        x.fillStyle = '#ffffff';
        x.fillText('PAPERBULL', 18 * s, src.height - 12 * s);
        x.font = `600 ${Math.round(15 * s)}px system-ui, sans-serif`;
        x.fillStyle = 'rgba(255,255,255,.85)';
        x.fillText(`${(acct && acct.name) || 'My'}'s Pet Garden · ${actors.length} pet${actors.length === 1 ? '' : 's'} · ${PG().curTheme().name}`, 160 * s, src.height - 13 * s);
        c.toBlob(b => {
          if (!b) return;
          const u = URL.createObjectURL(b),
            a = document.createElement('a');
          a.href = u;
          a.download = `paperbull-garden-${new Date().toISOString().slice(0, 10)}.png`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(u);
          }, 2000);
        }, 'image/png');
        const fl = document.createElement('div');
        fl.className = 'g3-flash';
        stage.appendChild(fl);
        setTimeout(() => fl.remove(), 500);
        try {
          SFX.play('flip');
        } catch (e) {}
        toast('📸 Photo saved', 'ok');
      } catch (e) {
        console.error(e);
        toast('Could not take a photo here', 'err');
      }
    }

    /* ---------------- loop ---------------- */
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (!stage || !stage.isConnected) return leave();
      if (document.hidden && !window.__g3force) {
        lastT = 0;
        return;
      }
      if (document.documentElement.classList.contains('ab-on')) {
        lastT = 0;
        return;
      }
      const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 1 / 60);
      lastT = now;
      T += dt;
      uTime.value = T;
      // perf watchdog: shed shadows if the device struggles
      fps.acc += now - (fps.last || now);
      fps.last = now;
      fps.n++;
      if (fps.n >= 90) {
        const avg = fps.acc / fps.n;
        fps.acc = 0;
        fps.n = 0;
        if (avg > 40 && renderer.shadowMap.enabled) {
          renderer.shadowMap.enabled = false;
          renderer.setPixelRatio(1);
          scene.traverse(o => o.material && (o.material.needsUpdate = true));
        }
      }
      applyPhase(dt);
      const night = cur ? cur.fly > 0.6 : false;
      if (T - lastSync > 1) {
        lastSync = T;
        syncActors();
      }
      updateActors(dt, night && phaseNow() === 'night');
      updateBall(dt);
      updateLoot(dt);
      updateAmbient(dt);
      lootT -= dt;
      if (lootT <= 0) {
        lootT = 22 + Math.random() * 38;
        spawnLoot();
      }
      if (T - lastBank > 2.5) {
        lastBank = T;
        try {
          PG().accrue();
          PG().paintBank();
        } catch (e) {}
      }
      // camera
      idleT += dt;
      if (intro) {
        intro.t += dt / (intro.dur || 2.6);
        const u = Math.min(1, intro.t),
          k = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        cam.theta = lerp(intro.from.theta, intro.to.theta, k);
        cam.phi = lerp(intro.from.phi, intro.to.phi, k);
        cam.r = lerp(intro.from.r, intro.to.r, k);
        if (u >= 1) intro = null;
      } else if (cam.follow) {
        const a = cam.follow;
        cam.tgt.lerp(new THREE.Vector3(a.x, a.grp.position.y + 0.9, a.z), 1 - Math.exp(-dt * 3));
        cam.r = lerp(cam.r, 7.5, 1 - Math.exp(-dt * 2));
      } else {
        cam.tgt.lerp(new THREE.Vector3(0, 2.0, 0), 1 - Math.exp(-dt * 2));
        if (!dragging) {
          cam.theta += cam.vt;
          cam.vt *= 0.9;
          if (idleT > 9) cam.theta += dt * 0.05;
        }
      }
      placeCamera();
      stRect = null;
      updateOverlay(dt);
      const tr0 = performance.now();
      renderer.render(scene, camera);
      dbg.render = performance.now() - tr0;
      dbg.frame = performance.now() - now;
    }

    /* ---------------- enter / leave ---------------- */
    function ensureRenderer() {
      if (renderer) return;
      renderer = new THREE.WebGLRenderer({ antialias: !isPhone(), alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Q.dpr);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.className = 'g3-canvas';
      renderer.domElement.addEventListener('webglcontextlost', e => {
        e.preventDefault();
        toast('The 3D garden lost its graphics context. Showing the 2D garden.', 'info');
        disabled = true;
        leave();
        const v = document.getElementById('view');
        if (v && (curRoute || '').startsWith('garden')) PG().Garden.mount(v);
      });
      bindInput(renderer.domElement);
      V1 = new THREE.Vector3();
      V2 = new THREE.Vector3();
      cam.tgt = new THREE.Vector3(0, 2.0, 0);
    }
    function resize() {
      if (!renderer || !stage) return;
      const w = stage.clientWidth,
        h = stage.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    let ro = null;
    function disposeScene() {
      if (!scene) return;
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of ms) {
            for (const k in m) if (m[k] && m[k].isTexture && !isShared(m[k])) m[k].dispose();
            m.dispose();
          }
        }
      });
      scene.clear();
      for (const a of actors) {
        if (a.bubble) a.bubble.remove();
        if (a.lbl) a.lbl.remove();
        if (a.zz) a.zz.remove();
      }
      actors = [];
      loot = [];
      dying = [];
      ball = null;
      world = null;
      sel = null;
      hover = null;
    }
    const isShared = t => petTex.has(t) || t === softDot || t === cloudTex || t === sunTex || t === moonTex || t === bflyTex || t === earthTex || Object.values(flowerTex).includes(t);
    function leave() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (ro) {
        ro.disconnect();
        ro = null;
      }
      disposeScene();
      if (renderer && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      if (ui && ui.parentNode) ui.parentNode.removeChild(ui);
      ui = null;
      if (stage) stage.classList.remove('g3d');
      stage = null;
      document.documentElement.classList.remove('g3d-on');
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('keydown', onKey);
    }
    function onFs() {
      resize();
      if (renderer) renderer.domElement.style.touchAction = document.fullscreenElement ? 'none' : 'pan-y';
    }
    function onKey(e) {
      if (e.key === 'Escape') closeCard();
    }
    let enterSeq = 0;
    async function enter(st) {
      const my = ++enterSeq;
      stage = st;
      stage.classList.add('g3d');
      document.documentElement.classList.add('g3d-on');
      try {
        PG().stop2D();
      } catch (e) {}
      const loader = document.createElement('div');
      loader.className = 'g3-load';
      loader.innerHTML = '<div class="g3-spin"></div><b>Building your 3D garden…</b><small>Planting grass, waking up the pets</small>';
      stage.appendChild(loader);
      try {
        await loadThree();
      } catch (e) {
        console.warn('3D garden: three.js unavailable', e && e.message);
        loader.remove();
        st.classList.remove('g3d');
        document.documentElement.classList.remove('g3d-on');
        disabled = true;
        if (my !== enterSeq || stage !== st) return;
        stage = null;
        toast('The 3D garden needs an internet connection. Showing the 2D garden for now.', 'info');
        const v = document.getElementById('view');
        if (v) PG().Garden.mount(v);
        return;
      }
      if (my !== enterSeq || !stage || !stage.isConnected) return;
      Q = isPhone() ? { grass: 1500, shadow: 1024, dpr: Math.min(devicePixelRatio || 1, 1.5), flowers: 90, stars: 500 } : { grass: 3400, shadow: 2048, dpr: Math.min(devicePixelRatio || 1, 2), flowers: 170, stars: 900 };
      ensureRenderer();
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, 1, 0.1, 600);
      thId = PG().curTheme().id;
      T = 0;
      lastT = 0;
      cur = null;
      buildWorld();
      syncActors(true);
      stage.insertBefore(renderer.domElement, stage.firstChild);
      renderer.domElement.style.touchAction = document.fullscreenElement ? 'none' : 'pan-y';
      ui = document.createElement('div');
      ui.className = 'g3-ui';
      stage.appendChild(ui);
      const fade = document.createElement('div');
      fade.className = 'g3-fade';
      stage.appendChild(fade);
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(stage);
      document.addEventListener('fullscreenchange', onFs);
      document.addEventListener('keydown', onKey);
      // cinematic reveal
      cam.theta = -1.1;
      cam.phi = 0.62;
      cam.r = 38;
      cam.vt = 0;
      cam.follow = null;
      idleT = 0;
      intro = { t: 0, from: { theta: -1.1, phi: 0.62, r: 38 }, to: { theta: 0.18, phi: 1.2, r: isPhone() ? 20 : 18 }, dur: 2.8 };
      lootT = 14;
      placeCamera();
      renderer.render(scene, camera);
      loader.remove();
      requestAnimationFrame(() => fade.classList.add('off'));
      setTimeout(() => fade.remove(), 1600);
      const hint = document.createElement('div');
      hint.className = 'g3-hint';
      hint.textContent = isPhone() ? 'Drag to look around · pinch to zoom · tap a pet' : 'Drag to look around · scroll to zoom · click a pet';
      stage.appendChild(hint);
      setTimeout(() => hint.classList.add('off'), 5000);
      setTimeout(() => hint.remove(), 6200);
      wireButtons();
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }
    function wireButtons() {
      const top = stage.querySelector('.pg-top');
      if (!top) return;
      const pa = stage.querySelector('#pgPetAll'),
        pb = stage.querySelector('#pgBall');
      if (pa) pa.onclick = petAll;
      if (pb) pb.onclick = throwBall;
      if (!top.querySelector('#g3Photo'))
        top.insertAdjacentHTML('beforeend', `<button class="pg-act g3-b" id="g3Time" title="Change the time of day">${PH_LBL[phaseNow()].split(' ')[0]}<span> Time</span></button><button class="pg-act g3-b" id="g3Photo" title="Save a photo">📸<span> Photo</span></button><button class="pg-act g3-b" id="g3Full" title="Full screen">⛶<span> Full</span></button><button class="pg-act g3-b g3-tog" id="g3Toggle" title="Switch to the 2D garden">2D</button>`);
      stage.querySelector('#g3Photo').onclick = photo;
      stage.querySelector('#g3Full').onclick = () => {
        if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen();
        else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => toast('Full screen is not available here', 'info'));
        else toast('Full screen is not available on this device. Rotate your phone for a bigger view.', 'info');
      };
      stage.querySelector('#g3Time').onclick = e => {
        const now = phaseNow(),
          next = PH_ORDER[(PH_ORDER.indexOf(now) + 1) % PH_ORDER.length];
        phOverride = next;
        e.currentTarget.innerHTML = `${PH_LBL[next].split(' ')[0]}<span> Time</span>`;
        if (theme.space) toast('The Moon has no weather, but it does have a great view of Earth.', 'info');
      };
      stage.querySelector('#g3Toggle').onclick = () => {
        try {
          localStorage.setItem('pb2.g3d', '0');
        } catch (e) {}
        leave();
        const v = document.getElementById('view');
        if (v) PG().Garden.mount(v);
      };
    }

    /* ---------------- hooks ---------------- */
    function afterMount() {
      const st = document.getElementById('pgStage');
      if (!st) return;
      const top = st.querySelector('.pg-top');
      if (want3D()) {
        enter(st);
        return;
      }
      if (top && !top.querySelector('#g3On') && webglOK() && !disabled) {
        top.insertAdjacentHTML('beforeend', '<button class="pg-act g3-b g3-tog on" id="g3On" title="Switch to the 3D garden">✨ 3D</button>');
        top.querySelector('#g3On').onclick = () => {
          try {
            localStorage.setItem('pb2.g3d', '1');
          } catch (e) {}
          const v = document.getElementById('view');
          if (v) PG().Garden.mount(v);
        };
      }
    }
    const hook = () => {
      const G = PG() && PG().Garden;
      if (!G || G.__g3d) return !!G;
      G.__g3d = true;
      const m0 = G.mount;
      G.mount = function () {
        leave();
        const r = m0.apply(this, arguments);
        try {
          afterMount();
        } catch (e) {
          console.error('garden3d', e);
        }
        return r;
      };
      const u0 = G.unmount;
      G.unmount = function () {
        try {
          leave();
        } catch (e) {}
        return u0 ? u0.apply(this, arguments) : undefined;
      };
      return true;
    };
    if (!hook()) setTimeout(hook, 0);
    // preload three.js quietly once the game is idle so the first visit is instant
    setTimeout(() => {
      if (want3D() && acct && acct.pets && acct.pets.list.length && navigator.onLine !== false && 'requestIdleCallback' in window) requestIdleCallback(() => loadThree().catch(() => {}), { timeout: 8000 });
    }, 6000);
    window.PBGarden3D = {
      enter,
      leave,
      photo,
      throwBall,
      petAll,
      setPhase: p => (phOverride = p),
      tap: uid => {
        const a = actors.find(x => x.p.uid === uid);
        if (a) tapPet(a);
      },
      snap: (theta, phi, r) => {
        intro = null;
        cam.theta = theta;
        cam.phi = phi;
        cam.r = r;
        idleT = 0;
      },
      state: () => ({ actors: actors.length, theme: thId, phase: phaseNow(), three: !!THREE, loot: loot.length }),
      debug: () => ({ renderMs: +dbg.render.toFixed(1), frameMs: +dbg.frame.toFixed(1), info: renderer && { calls: renderer.info.render.calls, tris: renderer.info.render.triangles, programs: renderer.info.programs.length, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures }, shadows: renderer && renderer.shadowMap.enabled, dpr: renderer && renderer.getPixelRatio(), lights: (() => { let n = 0; scene && scene.traverse(o => o.isLight && n++); return n; })() }),
    };
  } catch (e) {
    console.error('garden3d', e);
  }
})();
