/* ═══════════════════════════════════════════════════════════════
   app.js – Main Application Logic & Event Binding
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  let selectedMode = 'walking';

  // ── Boot ──────────────────────────────────────────────────────
  function init() {
    SheRoutes.UI.initNavbar();
    SheRoutes.UI.initProfile();
    SheRoutes.UI.initTipsTicker();
    SheRoutes.UI.initScrollAnimations();
    SheRoutes.SOS.init();
    SheRoutes.Autocomplete.init();

    bindSearchEvents();
    bindMapControls();
    bindSwapButton();
    bindTravelModes();
    bindLocateButton();

    // Check backend health
    checkBackendHealth();
  }

  // ── Find Route ────────────────────────────────────────────────
  async function findRoute() {
    const source = document.getElementById('source-input')?.value.trim();
    const dest = document.getElementById('dest-input')?.value.trim();

    if (!source) {
      SheRoutes.UI.showToast('Please enter a starting location', 'warning');
      document.getElementById('source-input')?.focus();
      shakeField('source-group');
      return;
    }

    if (!dest) {
      SheRoutes.UI.showToast('Please enter a destination', 'warning');
      document.getElementById('dest-input')?.focus();
      shakeField('dest-group');
      return;
    }

    if (source.toLowerCase() === dest.toLowerCase()) {
      SheRoutes.UI.showToast('Source and destination cannot be the same', 'warning');
      return;
    }

    SheRoutes.UI.setLoading(true);
    SheRoutes.Map.updateStatus('Searching for safe routes…', 'loading');

    try {
      const data = await SheRoutes.API.getRoutes(source, dest, selectedMode);

      // Render on map
      if (window.MAPS_DEMO_MODE || !window.google) {
        SheRoutes.Map.renderDemoRoute(source, dest);
      } else {
        SheRoutes.Map.renderRoute(source, dest, selectedMode);
      }

      // Render route info
      SheRoutes.UI.renderRouteInfo(data);

      if (data.demo) {
        SheRoutes.UI.showToast('⚠️ Running in demo mode — add your Google Maps API key for real routes', 'warning', 8000);
      } else {
        const routeCount = data.routes?.length || 1;
        SheRoutes.UI.showToast(
          `✅ Found ${routeCount} safe route${routeCount > 1 ? 's' : ''} — safety scored!`,
          'success'
        );
      }

    } catch (err) {
      console.error('Route error:', err);
      SheRoutes.UI.showToast('Could not find route: ' + err.message, 'error');
      SheRoutes.Map.updateStatus('Route search failed', 'error');
    } finally {
      SheRoutes.UI.setLoading(false);
    }
  }

  // ── Bind Search Events ────────────────────────────────────────
  function bindSearchEvents() {
    const btnFind = document.getElementById('btn-find-route');
    if (btnFind) btnFind.addEventListener('click', findRoute);

    // Enter key on inputs
    ['source-input', 'dest-input'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            findRoute();
          }
        });
      }
    });
  }

  // ── Travel Mode Buttons ───────────────────────────────────────
  function bindTravelModes() {
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        selectedMode = btn.dataset.mode;
        SheRoutes.UI.showToast(`Travel mode: ${btn.textContent.trim()}`, 'info', 2000);
      });
    });
  }

  // ── Swap Source / Destination ─────────────────────────────────
  function bindSwapButton() {
    const btn = document.getElementById('btn-swap');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const sourceEl = document.getElementById('source-input');
      const destEl = document.getElementById('dest-input');
      if (!sourceEl || !destEl) return;

      const temp = sourceEl.value;
      sourceEl.value = destEl.value;
      destEl.value = temp;

      // Brief animation
      btn.style.transform = 'rotate(360deg)';
      setTimeout(() => { btn.style.transform = ''; }, 300);

      SheRoutes.UI.showToast('Locations swapped', 'info', 2000);
    });
  }

  // ── Locate Me Button ──────────────────────────────────────────
  function bindLocateButton() {
    const btn = document.getElementById('btn-locate');
    if (!btn) return;

    btn.addEventListener('click', () => {
      SheRoutes.UI.showToast('Getting your location…', 'info', 2000);

      SheRoutes.Map.goToUserLocation(async (lat, lng) => {
        const sourceEl = document.getElementById('source-input');
        if (!sourceEl) return;

        try {
          const data = await SheRoutes.API.reverseGeocode(lat, lng);
          const address = data.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          sourceEl.value = address;
          SheRoutes.UI.showToast('📍 Location set as source', 'success');
        } catch {
          sourceEl.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          SheRoutes.UI.showToast('📍 Coordinates set as source', 'success');
        }
      });
    });
  }

  // ── Map Controls ──────────────────────────────────────────────
  function bindMapControls() {
    const btnFull = document.getElementById('btn-fullscreen');
    const btnTraffic = document.getElementById('btn-traffic');
    const btnSatellite = document.getElementById('btn-satellite');

    if (btnFull) {
      btnFull.addEventListener('click', () => {
        const isFs = SheRoutes.Map.toggleFullscreen();
        btnFull.classList.toggle('active', isFs);
        SheRoutes.UI.showToast(isFs ? 'Fullscreen map' : 'Map restored', 'info', 2000);
      });
    }

    if (btnTraffic) {
      btnTraffic.addEventListener('click', () => {
        const on = SheRoutes.Map.toggleTraffic();
        if (on !== undefined) {
          btnTraffic.classList.toggle('active', on);
          SheRoutes.UI.showToast(on ? '🚦 Traffic layer on' : '🚦 Traffic layer off', 'info', 2000);
        }
      });
    }

    if (btnSatellite) {
      btnSatellite.addEventListener('click', () => {
        const on = SheRoutes.Map.toggleSatellite();
        if (on !== undefined) {
          btnSatellite.classList.toggle('active', on);
          SheRoutes.UI.showToast(on ? '🛰️ Satellite view' : '🗺️ Map view', 'info', 2000);
        }
      });
    }
  }

  // ── Field Shake Animation ─────────────────────────────────────
  function shakeField(groupId) {
    const el = document.getElementById(groupId);
    if (!el) return;
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'sos-shake 0.4s ease';
    setTimeout(() => { el.style.animation = ''; }, 500);
  }

  // ── Health Check ──────────────────────────────────────────────
  async function checkBackendHealth() {
    try {
      await SheRoutes.API.healthCheck();
      console.log('✅ Backend connected');
    } catch {
      console.warn('⚠️ Backend offline – running in full demo mode');
    }
  }

  // ── Start on DOM ready ────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
