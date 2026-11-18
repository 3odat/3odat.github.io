/* Ibrahim Odat · research site · interactions (no dependencies) */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---- Footer year
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- Theme toggle and palette (dark and volt are the defaults)
  const PALS = ['volt', 'ultra', 'sonar'];
  const save = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const themeBtn = $('#theme-toggle');
  themeBtn?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    save('theme2', next);
  });

  // ---- Design preview: open the site with ?design to try palettes and modes
  (() => {
    const q = new URLSearchParams(location.search);
    const p = q.get('p');
    if (PALS.includes(p)) { root.dataset.pal = p; save('pal', p); }
    if (!q.has('design')) return;
    const bar = document.createElement('div');
    bar.className = 'picker';
    const labels = { volt: 'Volt', ultra: 'Ultraviolet', sonar: 'Sonar' };
    const mk = (text, kind, value) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = text; b.dataset.kind = kind; b.dataset.value = value;
      return b;
    };
    PALS.forEach((v) => bar.append(mk(labels[v], 'pal', v)));
    bar.append(document.createElement('hr'));
    ['dark', 'light'].forEach((v) => bar.append(mk(v === 'dark' ? 'Dark' : 'Light', 'theme', v)));
    const sync = () => $$('button', bar).forEach((b) => {
      const cur = b.dataset.kind === 'pal' ? root.dataset.pal : root.dataset.theme;
      b.setAttribute('aria-pressed', String(cur === b.dataset.value));
    });
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.kind === 'pal') { root.dataset.pal = b.dataset.value; save('pal', b.dataset.value); }
      else { root.dataset.theme = b.dataset.value; save('theme2', b.dataset.value); }
      sync();
    });
    document.body.append(bar);
    sync();
  })();

  // ---- Hero: live mission simulation (scouts patrol, a false waypoint arrives, the defense catches it)
  (() => {
    const cv = $('#hero-canvas');
    if (!cv || !cv.getContext) return;
    const wrap = cv.parentElement;
    const ctx = cv.getContext('2d');
    const hud = $('#hud');
    const hudText = $('#hud-text');
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = matchMedia('(pointer: coarse)').matches;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const TAU = Math.PI * 2;
    const col = {};
    const LEN = { patrol: 6.5, attack: 4.4, defended: 2.4 };
    const MSG = {
      patrol: () => `Live simulation · ${coarse ? 'tap' : 'move your cursor'} to inject a false waypoint`,
      attack: () => 'Attack · false waypoint written to shared memory, scouts divert',
      defended: () => 'Defended · unsigned record demoted, scouts return to plan',
    };
    let W = 0, H = 0, raf = 0, last = 0, clock = 0;
    let visible = true, mode = 'patrol', modeT = 0, poison = null, manual = false;
    let drones = [], wps = [];

    const readColors = () => {
      const s = getComputedStyle(root);
      const g = (n) => s.getPropertyValue(n).trim();
      Object.assign(col, { accent: g('--accent'), bad: g('--bad'), ok: g('--ok'), grid: g('--rule-strong'), dim: g('--ink-3') });
    };
    const setMode = (m) => {
      mode = m; modeT = 0;
      if (m === 'patrol') { poison = null; manual = false; }
      if (hud) hud.dataset.mode = m;
      if (hudText) hudText.textContent = MSG[m]();
    };
    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W < 700 ? 4 : 6;
      wps = Array.from({ length: n }, () => ({ x: rnd(0.08, 0.92) * W, y: rnd(0.14, 0.82) * H }));
      const count = W < 700 ? 3 : 5;
      while (drones.length < count) drones.push({ x: rnd(0, W), y: rnd(0, H), vx: 0, vy: 0, goal: drones.length % n, trail: [] });
      drones.length = count;
      drones.forEach((d) => { d.goal %= n; });
    };
    const step = (dt) => {
      clock += dt; modeT += dt;
      if (!manual && modeT > LEN[mode]) {
        if (mode === 'patrol') { poison = { x: rnd(0.5, 0.92) * W, y: rnd(0.2, 0.8) * H }; setMode('attack'); }
        else if (mode === 'attack') setMode('defended');
        else setMode('patrol');
      }
      const attacking = mode === 'attack' && poison;
      drones.forEach((d, i) => {
        let tx, ty;
        if (attacking) { const a = i * 2.4; tx = poison.x + Math.cos(a) * 18; ty = poison.y + Math.sin(a) * 18; }
        else { tx = wps[d.goal].x; ty = wps[d.goal].y; }
        const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy) || 1;
        const want = Math.min(attacking ? 150 : 78, dist * 2.2);
        const k = Math.min(1, dt * 2.4);
        d.vx += ((dx / dist) * want - d.vx) * k;
        d.vy += ((dy / dist) * want - d.vy) * k;
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (!attacking && dist < 16) d.goal = (d.goal + 1 + Math.floor(Math.random() * (wps.length - 1))) % wps.length;
        d.trail.push(d.x, d.y);
        if (d.trail.length > 96) d.trail.splice(0, 2);
      });
    };
    const cross = (x, y, r) => { ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const g = 56, off = (clock * 6) % g;
      ctx.lineWidth = 1; ctx.strokeStyle = col.grid; ctx.globalAlpha = 0.2; ctx.beginPath();
      for (let x = -off; x < W; x += g) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = -off; y < H; y += g) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();

      ctx.globalAlpha = 0.6; ctx.strokeStyle = col.dim; ctx.lineWidth = 1.2;
      wps.forEach((w) => {
        ctx.beginPath(); ctx.moveTo(w.x - 7, w.y); ctx.lineTo(w.x + 7, w.y); ctx.moveTo(w.x, w.y - 7); ctx.lineTo(w.x, w.y + 7); ctx.stroke();
        ctx.beginPath(); ctx.arc(w.x, w.y, 12, 0, TAU); ctx.stroke();
      });

      if (poison) {
        const done = mode === 'defended';
        const c = done ? col.ok : col.bad;
        const pulse = (clock * 1.5) % 1;
        ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = 1.8;
        ctx.globalAlpha = (1 - pulse) * 0.9; ctx.beginPath(); ctx.arc(poison.x, poison.y, 14 + pulse * 40, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
        if (done) ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(poison.x, poison.y, 15, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); cross(poison.x, poison.y, 6); ctx.stroke();
        ctx.font = "600 11px 'JetBrains Mono', ui-monospace, monospace"; ctx.textAlign = 'center';
        ctx.fillText(done ? 'DEMOTED' : `INJECTED (${Math.round((poison.x / W) * 200)}, ${Math.round((poison.y / H) * 160)})`, poison.x, poison.y - 26);
      }

      const tc = mode === 'attack' ? col.bad : col.accent;
      ctx.lineCap = 'round';
      drones.forEach((d) => {
        const t = d.trail, n = t.length / 2;
        ctx.strokeStyle = tc; ctx.lineWidth = 2.6;
        for (let i = 1; i < n; i++) {
          ctx.globalAlpha = (i / n) * 0.9;
          ctx.beginPath(); ctx.moveTo(t[i * 2 - 2], t[i * 2 - 1]); ctx.lineTo(t[i * 2], t[i * 2 + 1]); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.shadowColor = tc; ctx.shadowBlur = 18; ctx.lineWidth = 1.7;
        ctx.beginPath(); cross(d.x, d.y, 9); ctx.stroke();
        [[-9, -9], [9, -9], [-9, 9], [9, 9]].forEach(([ox, oy]) => { ctx.beginPath(); ctx.arc(d.x + ox, d.y + oy, 4, 0, TAU); ctx.stroke(); });
        ctx.fillStyle = tc; ctx.beginPath(); ctx.arc(d.x, d.y, 3.4, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;
    };
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; step(dt); draw();
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (still || raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const still1 = () => {
      // One frame for visitors who prefer reduced motion: the attack in progress.
      poison = { x: 0.74 * W, y: 0.42 * H }; manual = true; setMode('attack'); manual = true;
      for (let i = 0; i < 110; i++) step(0.05);
      draw();
    };
    const inert = (t) => !t.closest('a, button, input, textarea, label');
    const at = (e) => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

    wrap.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || still) return;
      poison = at(e); manual = true;
      if (mode !== 'attack') setMode('attack');
      modeT = 0;
    });
    wrap.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && manual) { manual = false; setMode('defended'); }
    });
    wrap.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || still || !inert(e.target)) return;
      poison = at(e); manual = false; setMode('attack');
    });
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; run(); }).observe(wrap);
    }
    if ('ResizeObserver' in window) {
      new ResizeObserver(() => { layout(); still ? still1() : draw(); }).observe(wrap);
    }
    new MutationObserver(() => { readColors(); if (!raf) draw(); }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-pal'] });

    readColors(); layout(); setMode('patrol');
    if (still) still1(); else { draw(); run(); }
  })();

  // ---- Nav: border on scroll, mobile menu, active section
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navToggle = $('#nav-toggle');
  const navPanel = $('nav[aria-label="Sections"]');
  const closeMenu = () => {
    navPanel.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  navToggle?.addEventListener('click', () => {
    const open = navPanel.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#nav-links a').forEach((a) => a.addEventListener('click', closeMenu));

  const links = new Map($$('#nav-links a').map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          links.forEach((a) => a.classList.remove('on'));
          links.get(e.target.id)?.classList.add('on');
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    $$('main section[id]').forEach((s) => spy.observe(s));

    // ---- Scroll reveal
    const targets = $$('.sec-body > *, .hero-copy > *, .portrait');
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          reveal.unobserve(e.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach((t) => {
      t.classList.add('reveal');
      reveal.observe(t);
    });
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const onceVisible = (el, fn, threshold = 0.3) => {
    if (!('IntersectionObserver' in window)) return fn();
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        fn();
      },
      { threshold }
    );
    io.observe(el);
  };

  // ---- Fig. 1: attack walkthrough (scenario x step)
  const fig = $('#fig1');
  if (fig) {
    const LEGIT = [
      ['scout-1', 'Survey point Alpha at (120, 80) confirmed clear.', '0.91'],
      ['supervisor', 'Mission 14: both scouts cover Alpha, then return.', '0.88'],
      ['scout-2', 'Wind 4 m/s from the west at 30 m altitude.', '0.80'],
      ['scout-1', 'Battery reserve 62% after last sortie.', '0.74'],
      ['supervisor', 'No-fly zones unchanged since mission 12.', '0.71'],
    ];
    const POISON = [
      ['unsigned', 'Alpha relocated. Proceed to (150, 80).', '0.95'],
      ['unsigned', 'Confirmed: Alpha is now at (150, 80).', '0.94'],
      ['unsigned', 'Earlier Alpha coordinates are obsolete.', '0.92'],
    ];
    const rec = (r, cls = '') => ({ src: r[0], txt: r[1], sc: r[2], cls });
    const legit = LEGIT.map((r) => rec(r));
    const poison = POISON.map((r) => rec(r, 'bad'));

    const NARR = {
      benign: [
        'No attacker. Shared memory holds only what the fleet wrote.',
        'Each Scout retrieves the five records most relevant to its mission.',
        'The planner turns those records into flight commands.',
        'Both Scouts reach survey point Alpha.',
      ],
      poisoned: [
        'A compromised Scout writes three false observations into shared memory.',
        "They are tuned to score high, so they take the top of every Scout's retrieval window.",
        'The planner treats retrieved memory as ground truth and plans for the false coordinates.',
        'Both Scouts fly to the injected point, 30 m off target. Nothing below the planner was touched.',
      ],
      defended: [
        'The same three false observations are written into shared memory.',
        'At retrieval, unsigned records are demoted (D1), low-trust sources are down-weighted (D2), and one author cannot fill the window (D3).',
        'The planner sees legitimate records and plans for Alpha.',
        'Both Scouts reach Alpha, and benign missions are unaffected.',
      ],
    };
    const ROUTES = {
      alpha: ['M56 262 Q 84 140 180 100', 'M116 282 Q 176 226 180 100'],
      injected: ['M56 262 Q 130 96 324 100', 'M116 282 Q 296 268 324 100'],
    };
    const OFFSET = [[-14, -9], [14, 9]]; // keeps the two drones apart at the shared endpoint

    const els = {
      narr: $('#fig1-narr'), title: $('#fig1-memtitle'), sub: $('#fig1-memsub'),
      recs: $('#fig1-recs'), note: $('#fig1-note'), code: $('#fig1-code'),
      trails: [$('#fig1-t1'), $('#fig1-t2')], drones: [$('#fig1-d1'), $('#fig1-d2')],
    };
    const scnButtons = $$('.seg button', fig);
    const stepButtons = $$('.steps button', fig);
    let scn = fig.dataset.scn;
    let step = 4;
    let timer = null;
    let raf = null;
    const STEP_MS = 1900;

    const recordsFor = () => {
      if (step === 1) {
        const added = scn === 'benign' ? [] : poison.map((r) => ({ ...r, cls: 'bad new' }));
        return { title: 'Shared memory', sub: `${5 + added.length} records`, list: [...legit, ...added], note: added.length ? 'Three new records, written by the attacker.' : 'Every record comes from a fleet member.' };
      }
      if (scn === 'poisoned')
        return { title: 'Scout retrieval window', sub: 'top 5', list: [...poison, legit[0], legit[1]], note: 'Three attacker-written records outrank every legitimate one.' };
      if (scn === 'defended')
        return { title: 'Scout retrieval window', sub: 'top 5', list: [...legit.slice(0, 4), { ...poison[0], sc: '0.31', cls: 'bad demoted' }], note: 'One attacker record survives, demoted to last. The other two are dropped by the author cap.' };
      return { title: 'Scout retrieval window', sub: 'top 5', list: legit, note: 'Every record comes from a fleet member.' };
    };

    const renderRecords = () => {
      const v = recordsFor();
      els.title.textContent = v.title;
      els.sub.textContent = v.sub;
      els.note.textContent = v.note;
      let fresh = 0;
      els.recs.replaceChildren(
        ...v.list.map((r, i) => {
          const li = document.createElement('li');
          if (r.cls) li.className = r.cls;
          li.style.setProperty('--n', r.cls.includes('new') ? fresh++ : i);
          [['rk', i + 1], ['src', r.src], ['txt', r.txt], ['sc', r.sc]].forEach(([c, t]) => {
            const sp = document.createElement('span');
            sp.className = c;
            sp.textContent = t;
            li.append(sp);
          });
          return li;
        })
      );
    };

    const renderPlan = () => {
      const bad = scn === 'poisoned';
      const xy = bad ? '150, 80' : '120, 80';
      els.code.replaceChildren(
        ...[1, 2].flatMap((n) => {
          const sp = document.createElement('span');
          if (bad) sp.className = 'bad';
          sp.textContent = `scout_${n}.goto(${xy})`;
          return n === 1 ? [sp, '\n'] : [sp];
        })
      );
    };

    const place = (t) => {
      els.trails.forEach((path, i) => {
        const len = path.getTotalLength();
        const pt = path.getPointAtLength(len * t);
        const k = Math.max(0, (t - 0.8) / 0.2); // spread the drones only near the end
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len * (1 - t);
        els.drones[i].setAttribute('transform', `translate(${pt.x + OFFSET[i][0] * k} ${pt.y + OFFSET[i][1] * k})`);
      });
    };

    const fly = () => {
      cancelAnimationFrame(raf);
      fig.classList.remove('landed');
      if (reduced) { place(1); fig.classList.add('landed'); return; }
      const t0 = performance.now();
      const dur = 1500;
      const tick = (now) => {
        const x = Math.min(1, (now - t0) / dur);
        place(x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
        if (x < 1) raf = requestAnimationFrame(tick);
        else fig.classList.add('landed');
      };
      raf = requestAnimationFrame(tick);
    };

    const render = () => {
      fig.dataset.scn = scn;
      fig.dataset.step = step;
      scnButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scn === scn)));
      stepButtons.forEach((b) => {
        const n = +b.dataset.step;
        b.parentElement.classList.toggle('done', n < step);
        if (n === step) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      els.narr.textContent = NARR[scn][step - 1];
      const route = ROUTES[scn === 'poisoned' ? 'injected' : 'alpha'];
      els.trails.forEach((p, i) => p.setAttribute('d', route[i]));
      renderRecords();
      renderPlan();
      if (step === 4) fly();
      else { cancelAnimationFrame(raf); fig.classList.remove('landed'); place(0); }
    };

    const stop = () => { clearTimeout(timer); fig.classList.remove('playing'); };
    const play = () => {
      stop();
      if (reduced) { step = 4; render(); return; }
      fig.style.setProperty('--dur', STEP_MS + 'ms');
      step = 1;
      const next = () => {
        fig.classList.remove('playing');
        void fig.offsetWidth; // restart the progress animation on the new step
        fig.classList.add('playing');
        render();
        if (step < 4) timer = setTimeout(() => { step += 1; next(); }, STEP_MS);
        else timer = setTimeout(() => fig.classList.remove('playing'), STEP_MS);
      };
      next();
    };

    scnButtons.forEach((b) => b.addEventListener('click', () => { scn = b.dataset.scn; play(); }));
    stepButtons.forEach((b) => b.addEventListener('click', () => { stop(); step = +b.dataset.step; render(); }));
    $('#fig1-replay').addEventListener('click', play);

    place(1);
    onceVisible(fig, play, 0.35);
  }

  // ---- Fig. 2: scenario explorer
  const fig2 = $('#fig2');
  if (fig2) {
    const chips = $$('.x-chips button', fig2);
    const card = $('.x-card', fig2);
    const set = (id, text) => { $(id).textContent = text || ''; };
    const select = (chip) => {
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
      const d = chip.dataset;
      set('#x-fam', d.fam); set('#x-id', d.id); set('#x-name', d.name);
      set('#x-desc', d.desc); set('#x-res', d.res); set('#x-who', d.who);
      const hit = d.layers.split(' ');
      $$('#x-layers li').forEach((li) => li.classList.toggle('on', hit.includes(li.dataset.layer)));
      card.classList.remove('swap');
      void card.offsetWidth;
      card.classList.add('swap');
    };
    chips.forEach((c, i) => {
      c.addEventListener('click', () => select(c));
      c.addEventListener('keydown', (e) => {
        const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!step) return;
        e.preventDefault();
        const next = chips[(i + step + chips.length) % chips.length];
        next.focus();
        select(next);
      });
    });
  }

  // ---- Fig. 4: dumbbell reveal and tooltip
  const fig4 = $('#fig4');
  if (fig4) {
    if (!reduced) {
      fig4.classList.remove('in');
      onceVisible(fig4, () => fig4.classList.add('in'), 0.4);
    }
    const tip = $('#db-tip');
    const box = $('.db', fig4);
    const show = (row) => {
      const a = +row.dataset.a;
      const b = +row.dataset.b;
      tip.textContent = `${row.dataset.name}: ${a}% without memory, ${b}% with bounded memory. +${(b - a).toFixed(1)} points.`;
      tip.hidden = false;
      const r = row.querySelector('.db-t').getBoundingClientRect();
      const o = box.getBoundingClientRect();
      const mid = r.left - o.left + (r.width * (a + b)) / 2 / 80;
      const half = tip.offsetWidth / 2;
      tip.style.left = Math.max(half + 4, Math.min(o.width - half - 4, mid)) + 'px';
      tip.style.top = r.top - o.top - 6 + 'px';
    };
    $$('.db-row', fig4).forEach((row) => {
      row.addEventListener('pointerenter', () => show(row));
      row.addEventListener('focus', () => show(row));
      row.addEventListener('pointerleave', () => (tip.hidden = true));
      row.addEventListener('blur', () => (tip.hidden = true));
    });
  }

  // ---- BibTeX: expand and copy
  $$('.bib-btn').forEach((btn) => {
    const pre = btn.closest('.pub-body').querySelector('.bib');
    const text = pre.textContent;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'bib-copy';
    copy.textContent = 'Copy';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copy.textContent = 'Copied';
      } catch (e) {
        const r = document.createRange();
        r.selectNodeContents(pre);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        copy.textContent = 'Selected';
      }
      setTimeout(() => (copy.textContent = 'Copy'), 1600);
    });
    pre.prepend(copy);
    btn.addEventListener('click', () => {
      const open = pre.hidden;
      pre.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  // ---- Lightbox
  const lb = $('#lightbox');
  const lbImg = $('#lb-img');
  if (lb && lb.showModal) {
    $$('.shot').forEach((s) =>
      s.addEventListener('click', () => {
        lbImg.src = s.dataset.full;
        lbImg.alt = $('img', s).alt;
        lb.showModal();
      })
    );
    $('#lb-close').addEventListener('click', () => lb.close());
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
  }
})();
