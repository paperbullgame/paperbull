/* =====================================================================
   THE OFFICE IN 3D — a trading floor you look over from behind the desks.
   Screens show each worker's last trade, managers walk the aisles,
   the city outside follows your clock. three.js loads on demand;
   anything goes wrong and the 2D office takes over.
   ===================================================================== */
(() => {
  try {
    const CDN = [
      'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js',
      'https://unpkg.com/three@0.160.0/build/three.module.min.js',
    ];
    let T = null,
      loadP = null;
    const load = () => {
      if (T) return Promise.resolve(T);
      if (loadP) return loadP;
      loadP = (async () => {
        let err;
        for (const u of CDN) {
          try {
            const m = await import(/* webpackIgnore: true */ u);
            if (m && m.WebGLRenderer) return (T = m);
          } catch (e) {
            err = e;
          }
        }
        loadP = null;
        throw err || new Error('three.js failed to load');
      })();
      return loadP;
    };
    const webgl = () => {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (e) {
        return false;
      }
    };
    const reduced = () => matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

    const FLOORS = {
      garage: { floor: '#7d8288', wall: '#9aa0a6', trim: '#5b6168', rug: null },
      loft: { floor: '#9a6a3f', wall: '#b9624a', trim: '#3d2b20', rug: '#2f4858' },
      office: { floor: '#4f5b73', wall: '#e8e6e1', trim: '#8b93a3', rug: '#394559' },
      floor: { floor: '#2c3342', wall: '#1d2330', trim: '#0f1320', rug: '#1f5f8b' },
      tower: { floor: '#d8d3ca', wall: '#f4f2ee', trim: '#b8a987', rug: '#1c2b3f' },
    };
    const SX = 3.3,
      SZ = 3.6;

    let S = null; // live scene state
    let enterSeq = 0;

    function skyCanvas(w, h) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d'),
        hr = new Date().getHours(),
        night = hr < 6 || hr >= 20,
        dusk = (hr >= 17 && hr < 20) || (hr >= 6 && hr < 8);
      const sky = g.createLinearGradient(0, 0, 0, h);
      if (night) sky.addColorStop(0, '#0b1026'), sky.addColorStop(1, '#27305a');
      else if (dusk) sky.addColorStop(0, '#3b3f8f'), sky.addColorStop(0.6, '#f08a5d'), sky.addColorStop(1, '#ffd29d');
      else sky.addColorStop(0, '#5aa9f0'), sky.addColorStop(1, '#cfe9ff');
      g.fillStyle = sky;
      g.fillRect(0, 0, w, h);
      if (night)
        for (let i = 0; i < 90; i++) {
          g.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
          g.fillRect(Math.random() * w, Math.random() * h * 0.5, 1.5, 1.5);
        }
      // two layers of towers
      for (const [shade, base, hmin, hmax, lit] of [
        [night ? '#1a2140' : dusk ? '#6d5a7a' : '#8aa4c4', 0.62, 0.15, 0.4, 0.15],
        [night ? '#0d1226' : dusk ? '#3d3350' : '#5f7899', 0.75, 0.25, 0.62, 0.35],
      ]) {
        let x = -10;
        while (x < w) {
          const bw = 30 + Math.random() * 70,
            bh = h * (hmin + Math.random() * (hmax - hmin));
          g.fillStyle = shade;
          g.fillRect(x, h - bh, bw, bh);
          for (let yy = h - bh + 8; yy < h - 6; yy += 12)
            for (let xx = x + 6; xx < x + bw - 6; xx += 10)
              if (Math.random() < (night ? lit + 0.25 : 0.08)) {
                g.fillStyle = night ? '#ffd98a' : 'rgba(255,255,255,.55)';
                g.fillRect(xx, yy, 5, 6);
              }
          x += bw + 4;
        }
        void base;
      }
      return c;
    }
    function monitorCanvas() {
      const c = document.createElement('canvas');
      c.width = 128;
      c.height = 80;
      return c;
    }
    function drawMonitor(m, state, sym) {
      const g = m.canvas.getContext('2d'),
        col = state === 'win' ? '#22c55e' : state === 'loss' ? '#ef4444' : state === 'buy' ? '#38bdf8' : '#64748b';
      g.fillStyle = '#0b1220';
      g.fillRect(0, 0, 128, 80);
      g.strokeStyle = 'rgba(148,163,184,.18)';
      for (let y = 20; y < 80; y += 20) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(128, y);
        g.stroke();
      }
      g.strokeStyle = col;
      g.lineWidth = 3;
      g.beginPath();
      let y = 50;
      const dir = state === 'loss' ? 1 : state === 'idle' ? 0 : -1;
      for (let x = 4; x <= 124; x += 8) {
        y = Math.max(10, Math.min(70, y + (Math.random() - 0.5) * 16 + dir * 2.4));
        x === 4 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      if (sym) {
        g.fillStyle = '#e2e8f0';
        g.font = 'bold 15px sans-serif';
        g.fillText(sym, 6, 17);
      }
      m.tex.needsUpdate = true;
    }
    function boardCanvas() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 160;
      return c;
    }
    function drawBoard(api) {
      if (!S) return;
      const o = api.O(),
        c = S.board.canvas,
        g = c.getContext('2d'),
        v = o.stats.pnl;
      g.fillStyle = '#05080f';
      g.fillRect(0, 0, 512, 160);
      g.fillStyle = '#94a3b8';
      g.font = '600 20px sans-serif';
      g.fillText('OFFICE P/L', 22, 36);
      g.fillStyle = v >= 0 ? '#34d399' : '#f87171';
      g.font = '800 58px sans-serif';
      g.fillText((v >= 0 ? '+' : '−') + api.money(Math.abs(v)), 22, 98);
      const l = o.log[0];
      g.fillStyle = '#cbd5e1';
      g.font = '500 20px sans-serif';
      if (l) g.fillText(((l.by ? l.by.split(' ')[0] + ' ' : '') + l.text).slice(0, 44), 22, 140);
      S.board.tex.needsUpdate = true;
    }

    function person(p, api, standing) {
      const g = new T.Group(),
        r = api.roleOf(p),
        L = p.look || {},
        shirt = new T.MeshStandardMaterial({ color: r.color, roughness: 0.7 }),
        skin = new T.MeshStandardMaterial({ color: L.skin || '#e8b996', roughness: 0.6 }),
        hair = new T.MeshStandardMaterial({ color: L.hair || '#3b2618', roughness: 0.9 }),
        dark = new T.MeshStandardMaterial({ color: '#1f2937', roughness: 0.8 });
      const torso = new T.Mesh(new T.CapsuleGeometry(0.3, 0.46, 6, 12), shirt);
      torso.position.y = standing ? 1.25 : 1.05;
      torso.castShadow = true;
      g.add(torso);
      const head = new T.Mesh(new T.SphereGeometry(0.25, 20, 16), skin);
      head.position.y = torso.position.y + 0.62;
      head.castShadow = true;
      g.add(head);
      const hr = new T.Mesh(new T.SphereGeometry(0.265, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
      hr.position.copy(head.position);
      hr.position.y += 0.02;
      hr.rotation.x = -0.25;
      g.add(hr);
      if (p.kind === 'mgr') {
        const tie = new T.Mesh(new T.BoxGeometry(0.08, 0.34, 0.03), new T.MeshStandardMaterial({ color: '#111827' }));
        tie.position.set(0, torso.position.y + 0.12, 0.29);
        g.add(tie);
      }
      const armG = new T.CapsuleGeometry(0.085, 0.42, 4, 8),
        arms = [];
      for (const s of [-1, 1]) {
        const a = new T.Mesh(armG, shirt);
        a.position.set(s * 0.36, torso.position.y + 0.12, standing ? 0 : -0.18);
        a.rotation.x = standing ? 0 : -1.1;
        a.castShadow = true;
        g.add(a);
        arms.push(a);
      }
      if (standing) {
        for (const s of [-1, 1]) {
          const leg = new T.Mesh(new T.CapsuleGeometry(0.11, 0.55, 4, 8), dark);
          leg.position.set(s * 0.14, 0.42, 0);
          leg.castShadow = true;
          g.add(leg);
        }
      }
      g.userData = { id: p.id, head, arms, torso, base: torso.position.y };
      return g;
    }
    function desk(api, empty) {
      const g = new T.Group(),
        wood = new T.MeshStandardMaterial({ color: S.pal.trim === '#3d2b20' ? '#6b4a2f' : '#e7e2d8', roughness: 0.6 }),
        metal = new T.MeshStandardMaterial({ color: '#2b313c', roughness: 0.4, metalness: 0.5 });
      const top = new T.Mesh(new T.BoxGeometry(2.1, 0.08, 1.05), wood);
      top.position.y = 0.95;
      top.castShadow = top.receiveShadow = true;
      g.add(top);
      for (const [x, z] of [
        [-0.98, -0.45],
        [0.98, -0.45],
        [-0.98, 0.45],
        [0.98, 0.45],
      ]) {
        const leg = new T.Mesh(new T.BoxGeometry(0.06, 0.95, 0.06), metal);
        leg.position.set(x, 0.475, z);
        g.add(leg);
      }
      // monitor faces the worker (and us, looking over their shoulder)
      const mc = monitorCanvas(),
        tex = new T.CanvasTexture(mc);
      tex.colorSpace = T.SRGBColorSpace;
      const frame = new T.Mesh(new T.BoxGeometry(1.0, 0.64, 0.05), metal);
      frame.position.set(0, 1.42, -0.32);
      g.add(frame);
      const scr = new T.Mesh(new T.PlaneGeometry(0.92, 0.56), new T.MeshBasicMaterial({ map: tex }));
      scr.position.set(0, 1.42, -0.29);
      g.add(scr);
      const stand = new T.Mesh(new T.BoxGeometry(0.08, 0.36, 0.08), metal);
      stand.position.set(0, 1.12, -0.34);
      g.add(stand);
      const kb = new T.Mesh(new T.BoxGeometry(0.62, 0.03, 0.2), metal);
      kb.position.set(0, 1.0, 0.05);
      g.add(kb);
      const mug = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.14, 12), new T.MeshStandardMaterial({ color: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][(Math.random() * 4) | 0] }));
      mug.position.set(0.72, 1.06, 0.15);
      g.add(mug);
      // chair behind the desk, on the camera side
      const seat = new T.Mesh(new T.BoxGeometry(0.62, 0.1, 0.6), new T.MeshStandardMaterial({ color: '#111827', roughness: 0.8 }));
      seat.position.set(0, 0.55, 0.85);
      g.add(seat);
      const back = new T.Mesh(new T.BoxGeometry(0.62, 0.7, 0.08), seat.material);
      back.position.set(0, 0.95, 1.14);
      g.add(back);
      const pole = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.5, 8), metal);
      pole.position.set(0, 0.28, 0.85);
      g.add(pole);
      const mon = { canvas: mc, tex, state: 'idle' };
      drawMonitor(mon, empty ? 'idle' : 'idle', empty ? '' : '');
      g.userData = { mon };
      return g;
    }

    function build(api) {
      const o = api.O(),
        { desks, map, staff } = api.seated(),
        lv = api.level(),
        pal = FLOORS[lv.floor] || FLOORS.office;
      S.pal = pal;
      const cols = desks.length ? desks[0].cols : 2,
        rows = desks.length ? desks[0].rows : 1,
        W = cols * SX + 5,
        D = rows * SZ + 7;
      S.dim = { W, D };
      const root = new T.Group();
      // floor
      const fl = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ color: pal.floor, roughness: 0.85 }));
      fl.rotation.x = -Math.PI / 2;
      fl.receiveShadow = true;
      root.add(fl);
      if (pal.rug) {
        const rug = new T.Mesh(new T.PlaneGeometry(W - 3, D - 5), new T.MeshStandardMaterial({ color: pal.rug, roughness: 1 }));
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.01, 0.4);
        rug.receiveShadow = true;
        root.add(rug);
      }
      // back wall: one long window onto the city, with the board in the middle
      const wallM = new T.MeshStandardMaterial({ color: pal.wall, roughness: 0.9 });
      const back = new T.Mesh(new T.PlaneGeometry(W, 5), wallM);
      back.position.set(0, 2.5, -D / 2);
      root.add(back);
      const sky = new T.CanvasTexture(skyCanvas(1024, 256));
      sky.colorSpace = T.SRGBColorSpace;
      const win = new T.Mesh(new T.PlaneGeometry(W - 1.2, 2.6), new T.MeshBasicMaterial({ map: sky }));
      win.position.set(0, 2.55, -D / 2 + 0.02);
      root.add(win);
      const trimM = new T.MeshStandardMaterial({ color: pal.trim, roughness: 0.5 });
      for (let x = -(W - 1.2) / 2; x <= (W - 1.2) / 2 + 0.01; x += (W - 1.2) / Math.max(2, Math.round(W / 3.5))) {
        const mull = new T.Mesh(new T.BoxGeometry(0.08, 2.6, 0.06), trimM);
        mull.position.set(x, 2.55, -D / 2 + 0.05);
        root.add(mull);
      }
      const sill = new T.Mesh(new T.BoxGeometry(W - 1.1, 0.1, 0.25), trimM);
      sill.position.set(0, 1.22, -D / 2 + 0.1);
      root.add(sill);
      // side walls
      for (const s of [-1, 1]) {
        const sw = new T.Mesh(new T.PlaneGeometry(D, 5), wallM);
        sw.position.set((s * W) / 2, 2.5, 0);
        sw.rotation.y = (-s * Math.PI) / 2;
        root.add(sw);
      }
      // the P/L board hangs in front of the window
      const bc = boardCanvas(),
        btex = new T.CanvasTexture(bc);
      btex.colorSpace = T.SRGBColorSpace;
      S.board = { canvas: bc, tex: btex };
      const bw = Math.min(5.5, W * 0.45);
      const board = new T.Mesh(new T.PlaneGeometry(bw, bw * 0.3125), new T.MeshBasicMaterial({ map: btex }));
      board.position.set(0, 4.3, -D / 2 + 0.3);
      root.add(board);
      const bframe = new T.Mesh(new T.BoxGeometry(bw + 0.14, bw * 0.3125 + 0.14, 0.08), new T.MeshStandardMaterial({ color: '#0b0f18' }));
      bframe.position.set(0, 4.3, -D / 2 + 0.25);
      root.add(bframe);
      // plants in the corners, a water cooler
      const potM = new T.MeshStandardMaterial({ color: '#c2410c', roughness: 0.8 }),
        leafM = new T.MeshStandardMaterial({ color: '#16a34a', roughness: 0.7 });
      for (const [x, z] of [
        [-W / 2 + 0.8, -D / 2 + 0.9],
        [W / 2 - 0.8, -D / 2 + 0.9],
        [-W / 2 + 0.8, D / 2 - 1],
      ]) {
        const pot = new T.Mesh(new T.CylinderGeometry(0.3, 0.24, 0.5, 14), potM);
        pot.position.set(x, 0.25, z);
        pot.castShadow = true;
        root.add(pot);
        for (let i = 0; i < 5; i++) {
          const lf = new T.Mesh(new T.SphereGeometry(0.34, 10, 8), leafM);
          lf.position.set(x + Math.sin(i * 1.3) * 0.18, 0.75 + i * 0.14, z + Math.cos(i * 1.3) * 0.18);
          lf.scale.set(1, 1.3, 1);
          lf.castShadow = true;
          root.add(lf);
        }
      }
      const cool = new T.Mesh(new T.CylinderGeometry(0.22, 0.22, 0.5, 14), new T.MeshStandardMaterial({ color: '#7dd3fc', transparent: true, opacity: 0.75, roughness: 0.1 }));
      cool.position.set(W / 2 - 0.8, 1.35, D / 2 - 1);
      root.add(cool);
      const coolB = new T.Mesh(new T.BoxGeometry(0.5, 1.1, 0.5), new T.MeshStandardMaterial({ color: '#e5e7eb' }));
      coolB.position.set(W / 2 - 0.8, 0.55, D / 2 - 1);
      root.add(coolB);
      // desks and people
      S.desks = [];
      S.people = {};
      S.walkers = [];
      const x0 = -((cols - 1) * SX) / 2,
        z0 = -D / 2 + 3.2;
      const byDesk = {};
      for (const p of staff) if (map[p.id]) byDesk[map[p.id].i] = p;
      for (const d of desks) {
        const p = byDesk[d.i],
          dk = desk(api, !p);
        dk.position.set(x0 + d.c * SX, 0, z0 + d.r * SZ);
        root.add(dk);
        S.desks.push({ d, g: dk, p });
        if (p && p.kind !== 'mgr') {
          const pg = person(p, api, false);
          pg.position.set(dk.position.x, 0, dk.position.z + 0.8);
          pg.rotation.y = Math.PI; // facing the screen
          root.add(pg);
          S.people[p.id] = { g: pg, desk: dk, seated: true, phase: Math.random() * 6 };
          const last = p.last;
          if (last) drawMonitor(dk.userData.mon, last.side === 'buy' ? 'buy' : last.pnl >= 0 ? 'win' : 'loss', last.sym);
          else drawMonitor(dk.userData.mon, 'idle', '');
        }
      }
      // managers walk the floor instead of sitting
      const aisleX = [];
      for (let c = 0; c <= cols; c++) aisleX.push(x0 - SX / 2 + c * SX);
      for (const p of staff.filter(s => s.kind === 'mgr')) {
        const pg = person(p, api, true);
        const sx = aisleX[(Math.random() * aisleX.length) | 0];
        pg.position.set(sx, 0, z0 + Math.random() * rows * SZ);
        root.add(pg);
        const w = { g: pg, p, target: null, wait: 1 + Math.random() * 2, speed: 1.1 + Math.random() * 0.4 };
        S.walkers.push(w);
        S.people[p.id] = { g: pg, seated: false, phase: Math.random() * 6 };
      }
      S.aisleX = aisleX;
      S.z0 = z0;
      S.rows = rows;
      return root;
    }

    function labels(api) {
      const ov = S.ov,
        { staff } = api.seated();
      ov.innerHTML = staff
        .filter(p => S.people[p.id])
        .map(p => `<div class="o3-tag ${p.kind === 'mgr' ? 'mgr' : ''}" data-tag="${p.id}"><b>${E(p.name.split(' ')[0])}</b><small>${E(api.roleOf(p).name)}</small><i class="o3-bub" data-b3="${p.id}"></i></div>`)
        .join('') + S.desks.filter(x => !x.p).map((x, i) => `<button class="o3-hire" data-hire="1" data-dk="${i}">+ Hire</button>`).join('');
    }

    function rebuild(api) {
      if (!S) return;
      if (S.root) {
        S.scene.remove(S.root);
        S.root.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => (m.map && m.map.dispose(), m.dispose()));
        });
      }
      S.root = build(api);
      S.scene.add(S.root);
      labels(api);
      drawBoard(api);
      const { W, D } = S.dim;
      S.cam.target = new T.Vector3(0, 1.2, -D * 0.1);
      S.cam.dist = Math.max(9, Math.max(W * 0.95, D * 1.25));
      S.cam.min = S.cam.dist * 0.45;
      S.cam.max = S.cam.dist * 1.5;
    }

    async function enter(stage, api) {
      if (!webgl()) throw new Error('no webgl');
      const my = ++enterSeq;
      stage.innerHTML = '<div class="o3-load">Building your office…</div>';
      await load();
      if (my !== enterSeq || !stage.isConnected) return;
      leave();
      const phone = innerWidth < 700;
      const renderer = new T.WebGLRenderer({ antialias: !phone, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.5 : 2));
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.shadowMap.enabled = !phone;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      stage.innerHTML = '';
      stage.appendChild(renderer.domElement);
      renderer.domElement.className = 'o3-canvas';
      renderer.domElement.setAttribute('aria-label', 'Your office in 3D. Drag to look around, scroll or pinch to zoom.');
      renderer.domElement.setAttribute('role', 'img');
      const ov = document.createElement('div');
      ov.className = 'o3-ov';
      stage.appendChild(ov);
      const hint = document.createElement('div');
      hint.className = 'o3-hint';
      hint.textContent = 'Drag to look around · scroll or pinch to zoom · tap someone to see their card';
      stage.appendChild(hint);
      setTimeout(() => hint.classList.add('gone'), 4000);
      const scene = new T.Scene();
      scene.background = new T.Color('#0e1320');
      scene.fog = new T.Fog('#0e1320', 30, 70);
      const camera = new T.PerspectiveCamera(45, 1, 0.1, 200);
      const hemi = new T.HemisphereLight('#dbeafe', '#3b3024', 1.1);
      scene.add(hemi);
      const sun = new T.DirectionalLight('#fff4e0', 1.6);
      sun.position.set(6, 14, 8);
      sun.castShadow = !phone;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = sun.shadow.camera.bottom = -20;
      sun.shadow.camera.right = sun.shadow.camera.top = 20;
      scene.add(sun);
      const fill = new T.PointLight('#93c5fd', 0.6, 30);
      fill.position.set(0, 4, 0);
      scene.add(fill);
      S = { renderer, scene, camera, stage, ov, api, cam: { yaw: 0.35, pitch: 0.62, dist: 14, target: null }, raf: 0, t0: performance.now(), last: performance.now() };
      rebuild(api);
      // look-around controls
      const el = renderer.domElement;
      let drag = null,
        pinch = null;
      const ptrs = new Map();
      el.addEventListener('pointerdown', e => {
        ptrs.set(e.pointerId, e);
        el.setPointerCapture(e.pointerId);
        if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY, yaw: S.cam.yaw, pitch: S.cam.pitch, moved: 0 };
        if (ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          pinch = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), dist: S.cam.dist };
          drag = null;
        }
      });
      el.addEventListener('pointermove', e => {
        if (!S) return;
        ptrs.set(e.pointerId, e);
        if (pinch && ptrs.size === 2) {
          const [a, b] = [...ptrs.values()];
          const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
          S.cam.dist = Math.max(S.cam.min, Math.min(S.cam.max, (pinch.dist * pinch.d) / Math.max(20, d)));
          return;
        }
        if (!drag) return;
        const dx = e.clientX - drag.x,
          dy = e.clientY - drag.y;
        drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
        S.cam.yaw = Math.max(-1.0, Math.min(1.0, drag.yaw - dx * 0.006));
        S.cam.pitch = Math.max(0.25, Math.min(1.2, drag.pitch + dy * 0.004));
      });
      const up = e => {
        ptrs.delete(e.pointerId);
        if (drag && drag.moved < 6 && S) pickAt(e);
        if (ptrs.size < 2) pinch = null;
        if (!ptrs.size) drag = null;
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener(
        'wheel',
        e => {
          if (!S) return;
          e.preventDefault();
          S.cam.dist = Math.max(S.cam.min, Math.min(S.cam.max, S.cam.dist * (1 + Math.sign(e.deltaY) * 0.08)));
        },
        { passive: false }
      );
      ov.addEventListener('click', e => {
        const t = e.target.closest('[data-tag]');
        if (t) return api.focus && api.focus(t.dataset.tag);
        if (e.target.closest('[data-hire]')) api.hireScroll && api.hireScroll();
      });
      const ro = new ResizeObserver(() => size());
      ro.observe(stage);
      S.ro = ro;
      size();
      loop();
    }
    function pickAt(e) {
      const r = S.renderer.domElement.getBoundingClientRect(),
        m = new T.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1),
        rc = new T.Raycaster();
      rc.setFromCamera(m, S.camera);
      const hits = rc.intersectObjects(Object.values(S.people).map(x => x.g), true);
      if (hits.length) {
        let o = hits[0].object;
        while (o && !(o.userData && o.userData.id)) o = o.parent;
        if (o && S.api.focus) S.api.focus(o.userData.id);
      }
    }
    function size() {
      if (!S) return;
      const w = S.stage.clientWidth || 600,
        h = S.stage.clientHeight || 340;
      S.renderer.setSize(w, h, false);
      S.renderer.domElement.style.width = w + 'px';
      S.renderer.domElement.style.height = h + 'px';
      S.camera.aspect = w / h;
      S.camera.updateProjectionMatrix();
    }
    const tmp = { v: null };
    function loop() {
      if (!S) return;
      S.raf = requestAnimationFrame(loop);
      if (document.hidden || !S.stage.isConnected) return;
      const now = performance.now(),
        dt = Math.min(0.05, (now - S.last) / 1000),
        t = (now - S.t0) / 1000;
      S.last = now;
      const c = S.cam,
        rm = reduced();
      const sway = rm ? 0 : Math.sin(t * 0.15) * 0.04;
      const yaw = c.yaw + sway;
      S.camera.position.set(c.target.x + Math.sin(yaw) * Math.cos(c.pitch) * c.dist, c.target.y + Math.sin(c.pitch) * c.dist, c.target.z + Math.cos(yaw) * Math.cos(c.pitch) * c.dist);
      S.camera.lookAt(c.target);
      // typing, breathing
      for (const id in S.people) {
        const P = S.people[id],
          u = P.g.userData;
        if (P.seated && !rm) {
          u.arms[0].rotation.x = -1.1 + Math.sin(t * 14 + P.phase) * 0.12;
          u.arms[1].rotation.x = -1.1 + Math.sin(t * 14 + P.phase + 1.7) * 0.12;
          u.head.rotation.y = Math.sin(t * 0.6 + P.phase) * 0.18;
        }
        if (P.jump) {
          P.jump = Math.max(0, P.jump - dt * 2.2);
          P.g.position.y = Math.sin(P.jump * Math.PI) * 0.35;
        }
      }
      // managers walk the aisles and stop by desks
      for (const w of S.walkers) {
        if (w.wait > 0) {
          w.wait -= dt;
          continue;
        }
        if (!w.target) {
          const x = S.aisleX[(Math.random() * S.aisleX.length) | 0],
            z = S.z0 + 0.8 + Math.random() * (S.rows * SZ - 1.6);
          w.target = new T.Vector3(x, 0, z);
        }
        const d = w.target.clone().sub(w.g.position);
        d.y = 0;
        const dist = d.length();
        if (dist < 0.08) {
          w.target = null;
          w.wait = 1.5 + Math.random() * 3;
          continue;
        }
        d.normalize();
        w.g.position.addScaledVector(d, Math.min(dist, w.speed * dt));
        const want = Math.atan2(d.x, d.z);
        w.g.rotation.y += ((((want - w.g.rotation.y + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * Math.min(1, dt * 6);
        if (!rm) w.g.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
      }
      S.renderer.render(S.scene, S.camera);
      // pin name tags over heads
      const W = S.stage.clientWidth,
        H = S.stage.clientHeight;
      tmp.v ||= new T.Vector3();
      for (const el of S.ov.children) {
        let pos = null;
        if (el.dataset.tag) {
          const P = S.people[el.dataset.tag];
          if (P) {
            P.g.userData.head.getWorldPosition(tmp.v);
            tmp.v.y += 0.55;
            pos = tmp.v;
          }
        } else if (el.dataset.dk != null) {
          const x = S.desks.filter(d => !d.p)[+el.dataset.dk];
          if (x) {
            tmp.v.set(x.g.position.x, 1.6, x.g.position.z + 0.4);
            pos = tmp.v;
          }
        }
        if (!pos) continue;
        pos.project(S.camera);
        const vis = pos.z < 1 && pos.x > -1.1 && pos.x < 1.1 && pos.y > -1.1 && pos.y < 1.1;
        el.style.display = vis ? '' : 'none';
        if (vis) el.style.transform = `translate(${((pos.x + 1) / 2) * W}px, ${((1 - pos.y) / 2) * H}px) translate(-50%, -100%)`;
      }
    }
    function leave() {
      enterSeq++;
      if (!S) return;
      cancelAnimationFrame(S.raf);
      try {
        S.ro && S.ro.disconnect();
        S.root &&
          S.root.traverse(o => {
            if (o.geometry) o.geometry.dispose();
            if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => (m.map && m.map.dispose(), m.dispose()));
          });
        S.renderer.dispose();
        S.renderer.forceContextLoss && S.renderer.forceContextLoss();
        S.renderer.domElement.remove();
      } catch (e) {}
      S = null;
    }
    function event(type, d) {
      if (!S) return;
      if (type === 'staff' || type === 'level') return rebuild(S.api);
      if (type === 'trade') {
        const P = S.people[d.who];
        const dk = P && P.desk;
        if (dk) drawMonitor(dk.userData.mon, d.side === 'buy' ? 'buy' : d.pnl >= 0 ? 'win' : 'loss', d.sym);
        if (P && d.side === 'sell' && d.pnl > 0) P.jump = 1;
        const b = S.ov.querySelector(`[data-b3="${d.who}"]`);
        if (b) {
          b.textContent = d.side === 'buy' ? `Buying ${d.sym}` : `${d.pnl >= 0 ? '+' : '−'}${S.api.money(Math.abs(d.pnl))}`;
          b.className = `o3-bub on ${d.side === 'buy' ? '' : d.pnl >= 0 ? 'up' : 'dn'}`;
          clearTimeout(b._t);
          b._t = setTimeout(() => (b.className = 'o3-bub'), 2600);
        }
        drawBoard(S.api);
      }
    }
    window.PBOffice3D = { ok: webgl, enter, leave, event, state: () => S };
  } catch (e) {
    console.error('office3d', e);
  }
})();
