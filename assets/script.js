/* Ibrahim Odat · research site · interactions (no dependencies) */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // ---- Footer year
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  // ---- Theme toggle (follows the system until the visitor chooses)
  const themeBtn = $('#theme-toggle');
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  themeBtn?.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

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

  // ---- Fig. 1: scenario switch
  const fig = $('#fig1');
  if (fig) {
    const buttons = $$('.seg button', fig);
    const set = (state) => {
      fig.dataset.state = state;
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.set === state)));
    };
    buttons.forEach((b) => b.addEventListener('click', () => set(b.dataset.set)));

    // Draw the route the first time the figure scrolls into view.
    if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const initial = fig.dataset.state;
      fig.dataset.state = 'idle';
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          set(initial);
          io.disconnect();
        },
        { threshold: 0.35 }
      );
      io.observe(fig);
    }
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
