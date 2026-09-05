(function () {
  'use strict';

  // ============================================================
  // DEV TOOLS / INSPECTION PROTECTION (deterrent layer only)
  // NOTE: client-side protection cannot be 100% effective — view-source,
  // disabling JS, curl, or extensions can bypass it. This raises the bar.
  // ============================================================

  const isDevtoolsOpen = () => {
    const threshold = 160;
    const wDiff = window.outerWidth - window.innerWidth;
    const hDiff = window.outerHeight - window.innerHeight;
    if (wDiff > threshold || hDiff > threshold) return true;
    // console.log/getter timing heuristic
    const start = performance.now();
    // eslint-disable-next-line no-console
    console.log('%c', 'color: transparent');
    const end = performance.now();
    return (end - start) > 100;
  };

  const showOverlay = () => {
    let overlay = document.getElementById('devtoolsOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'devtoolsOverlay';
      overlay.className = 'devtools-overlay';
      overlay.innerHTML = '<h1>Inspection blocked</h1><p>This site is protected. Please close developer tools to continue.</p>';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
  };
  const hideOverlay = () => {
    const overlay = document.getElementById('devtoolsOverlay');
    if (overlay) overlay.classList.remove('active');
  };

  const devtoolsCheck = () => {
    if (isDevtoolsOpen()) { showOverlay(); } else { hideOverlay(); }
  };

  // Disable right-click
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // Block common dev-tool / view-source / save shortcuts
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    // F12
    if (e.key === 'F12') { e.preventDefault(); return; }
    // Ctrl+Shift+I / J / C / K (inspect, console, element picker)
    if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) { e.preventDefault(); return; }
    // Ctrl+U (view source), Ctrl+S (save), Ctrl+P (print)
    if (e.ctrlKey && (k === 'u' || k === 's' || k === 'p')) { e.preventDefault(); return; }
    // Ctrl+Shift+S (capture), Ctrl+Shift+P (command palette)
    if (e.ctrlKey && e.shiftKey && (k === 's' || k === 'p')) { e.preventDefault(); return; }
  }, { capture: true });

  // Disable text selection, copy, cut
  ['copy', 'cut', 'paste'].forEach(evt =>
    document.addEventListener(evt, (e) => {
      const t = e.target;
      const tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
      e.preventDefault();
    })
  );

  // Drag-disable on images/links
  document.addEventListener('dragstart', (e) => e.preventDefault());

  // Periodic devtools detection
  setInterval(devtoolsCheck, 800);
  window.addEventListener('resize', devtoolsCheck);
  // debugger trap — slows down casual inspection
  setInterval(() => {
    const opened = isDevtoolsOpen();
    if (opened) {
      // eslint-disable-next-line no-debugger
      (function () { return false; }).constructor('debugger').call('bind');
    }
  }, 1500);

  // ============================================================
  // APP LOGIC
  // ============================================================

  const header = document.getElementById('topHeader');
  const progressBar = document.getElementById('globalProgressBar');
  const scrollHint = document.getElementById('scrollHint');
  const navDots = Array.from(document.querySelectorAll('.nav-dot'));
  const menuToggle = document.getElementById('menuToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', (e) => { e.stopPropagation(); mobileMenu.classList.toggle('open'); });
    mobileMenu.querySelectorAll('[data-close]').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));
  }

  navDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const t = document.getElementById(dot.dataset.target);
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const plain = el.dataset.plain === '1';
      const dur = 1400;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        el.textContent = (plain ? Math.round(val) : Math.round(val).toLocaleString()) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el));

  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.width = en.target.dataset.w + '%';
        barObserver.unobserve(en.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.skill-bar i').forEach(el => barObserver.observe(el));

  const sections = navDots.map(d => document.getElementById(d.dataset.target)).filter(Boolean);
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navDots.forEach(d => d.classList.toggle('active', d.dataset.target === id));
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(s => sectionObserver.observe(s));

  let ticking = false;
  function onScroll() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const total = document.documentElement.scrollHeight - vh;
    progressBar.style.width = (total > 0 ? Math.min(1, scrollY / total) : 0) * 100 + '%';
    header.classList.toggle('scrolled', scrollY > 40);
    if (scrollHint) scrollHint.style.opacity = scrollY > 40 ? '0' : '0.75';
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
})();