/* ═══════════════════════════════════════════════════════════════
   ui.js – UI Utilities (Toast, Modals, Scroll, Tips, Navbar)
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.UI = (function () {
  // ── Toast Notifications ───────────────────────────────────────
  function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { info: 'ℹ️', success: '✅', error: '🚨', warning: '⚠️' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Auto-remove
    const remove = () => {
      toast.classList.add('exit');
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
    };

    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
  }

  // ── Navbar Scroll ─────────────────────────────────────────────
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Hamburger
    const hamburger = document.getElementById('btn-hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', isOpen);
      });
    }
  }

  // ── Profile Modal ─────────────────────────────────────────────
  function initProfile() {
    const btnProfile = document.getElementById('btn-profile');
    const overlay = document.getElementById('profile-modal-overlay');
    const btnClose = document.getElementById('profile-modal-close');

    const open = () => {
      if (!overlay) return;
      overlay.hidden = false;
      overlay.removeAttribute('hidden');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      if (!overlay) return;
      overlay.hidden = true;
      document.body.style.overflow = '';
    };

    if (btnProfile) btnProfile.addEventListener('click', open);
    if (btnClose) btnClose.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay && !overlay.hidden) close();
    });
  }

  // ── Safety Tips Ticker ────────────────────────────────────────
  function initTipsTicker() {
    const tipEl = document.getElementById('tip-text');
    if (!tipEl) return;
    const tips = SheRoutes.CONFIG.SAFETY_TIPS;
    let idx = 0;

    setInterval(() => {
      tipEl.classList.add('tip-fade-out');
      setTimeout(() => {
        idx = (idx + 1) % tips.length;
        tipEl.textContent = tips[idx];
        tipEl.classList.remove('tip-fade-out');
        tipEl.classList.add('tip-fade-in');
        setTimeout(() => tipEl.classList.remove('tip-fade-in'), 500);
      }, 400);
    }, 6000);
  }

  // ── Scroll Animations ─────────────────────────────────────────
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.feature-card, .stat-card, .alt-route-card, .route-info-title');
    elements.forEach(el => el.classList.add('animate-on-scroll'));

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => observer.observe(el));
  }

  // ── Route Info Rendering ──────────────────────────────────────
  function renderRouteInfo(data) {
    const section = document.getElementById('route-info-section');
    if (!section) return;

    const recommended = data.routes?.[0] || data.recommendedRoute;
    if (!recommended) return;

    // Show section
    section.hidden = false;
    section.removeAttribute('hidden');

    // Stats
    animateValue('stat-distance-val', recommended.distance?.text || '–');
    animateValue('stat-time-val', recommended.duration?.text || '–');
    const score = recommended.safetyScore || 0;
    animateValue('stat-safety-val', `${score}/100 ${recommended.safetyEmoji || ''}`);

    // Safety bar
    const bar = document.getElementById('safety-bar');
    if (bar) {
      bar.style.background = getSafetyGradient(score);
      setTimeout(() => { bar.style.width = `${score}%`; }, 100);
    }

    // Demo notice
    const notice = document.getElementById('demo-notice');
    if (notice) notice.hidden = !data.demo;

    // Steps
    renderSteps(recommended.steps || []);

    // Alternate routes
    renderAltRoutes(data.routes || []);

    // Scroll into view
    setTimeout(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }

  function animateValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight; // reflow
    el.style.animation = 'stat-count-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    el.textContent = value;
  }

  function getSafetyGradient(score) {
    if (score >= 80) return 'linear-gradient(90deg, #22c55e, #16a34a)';
    if (score >= 60) return 'linear-gradient(90deg, #f59e0b, #d97706)';
    return 'linear-gradient(90deg, #ef4444, #dc2626)';
  }

  function renderSteps(steps) {
    const section = document.getElementById('steps-section');
    const list = document.getElementById('steps-list');
    if (!section || !list || !steps.length) return;

    section.hidden = false;
    list.innerHTML = '';

    steps.forEach((step, i) => {
      const li = document.createElement('li');
      li.className = 'step-item animate-on-scroll';
      const dist = step.distance ? `<span>${step.distance}</span>` : '';
      const dur = step.duration ? `<span>${step.duration}</span>` : '';

      // Clean HTML instructions
      let instruction = step.instruction || '';
      instruction = instruction.replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>');
      instruction = instruction.replace(/<wbr\/>/gi, '');

      li.innerHTML = `
        <div class="step-num">${i + 1}</div>
        <div class="step-content">
          <div class="step-instruction">${instruction}</div>
          ${(step.distance || step.duration) ? `<div class="step-meta">${dist}${dist && dur ? ' · ' : ''}${dur}</div>` : ''}
        </div>`;
      list.appendChild(li);
    });

    // Animate new items
    setTimeout(() => {
      list.querySelectorAll('.step-item').forEach(el => el.classList.add('visible'));
    }, 100);
  }

  function renderAltRoutes(routes) {
    const section = document.getElementById('alternate-routes');
    const list = document.getElementById('alt-routes-list');
    if (!section || !list || routes.length <= 1) return;

    section.hidden = false;
    list.innerHTML = '';

    routes.forEach((route, i) => {
      const card = document.createElement('div');
      card.className = `alt-route-card${i === 0 ? ' selected' : ''}`;
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      card.setAttribute('aria-label', `Route ${i + 1}: ${route.summary}`);

      card.innerHTML = `
        <div>
          <div class="arc-summary">${i === 0 ? '⭐ ' : ''}${route.summary || `Route ${i + 1}`}</div>
          <div class="arc-meta">${route.distance?.text || ''} · ${route.duration?.text || ''}</div>
        </div>
        <div class="arc-safety-badge" style="color:${route.safetyColor};background:${route.safetyColor}18;">
          ${route.safetyEmoji} ${route.safetyScore}/100
        </div>`;

      card.addEventListener('click', () => {
        list.querySelectorAll('.alt-route-card').forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });
        card.classList.add('selected');
        card.setAttribute('aria-pressed', 'true');

        // Update stats for selected route
        renderRouteInfo({ routes: [route], demo: false });
        renderSteps(route.steps || []);
      });

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });

      // Mouse ripple effect
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--y', `${e.clientY - rect.top}px`);
      });

      list.appendChild(card);
    });
  }

  // ── Loading State ─────────────────────────────────────────────
  function setLoading(isLoading) {
    const btn = document.getElementById('btn-find-route');
    const mapLoading = document.getElementById('map-loading');

    if (btn) {
      btn.classList.toggle('loading', isLoading);
      const text = btn.querySelector('.btn-text');
      const icon = btn.querySelector('.btn-icon');
      if (text) text.textContent = isLoading ? 'Finding…' : 'Find Safe Route';
      if (icon) icon.textContent = isLoading ? '⏳' : '→';
      btn.disabled = isLoading;
    }

    if (mapLoading) {
      if (isLoading) {
        mapLoading.hidden = false;
        mapLoading.removeAttribute('hidden');
      } else {
        mapLoading.hidden = true;
      }
    }
  }

  return {
    showToast,
    initNavbar,
    initProfile,
    initTipsTicker,
    initScrollAnimations,
    renderRouteInfo,
    setLoading
  };
})();
