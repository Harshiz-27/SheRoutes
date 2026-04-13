/* ═══════════════════════════════════════════════════════════════
   sos.js – SOS Emergency Alert System
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.SOS = (function () {
  let userLocation = null;
  let modalOpen = false;

  function init() {
    // Open modal buttons
    const btnNav = document.getElementById('btn-sos-nav');
    if (btnNav) btnNav.addEventListener('click', openModal);

    // Modal close / cancel
    const btnClose = document.getElementById('modal-close');
    const btnCancel = document.getElementById('btn-sos-cancel');
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Confirm SOS
    const btnConfirm = document.getElementById('btn-sos-confirm');
    if (btnConfirm) btnConfirm.addEventListener('click', sendSOS);

    // Close on backdrop
    const overlay = document.getElementById('sos-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
      });
    }

    // Keyboard: Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modalOpen) closeModal();
    });

    // Push any SOSes via keyboard shortcut Ctrl+Shift+S
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        openModal();
      }
    });

    // Try getting user location silently early
    tryGetLocation();
  }

  function tryGetLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
      },
      () => { userLocation = null; },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }

  function openModal() {
    const overlay = document.getElementById('sos-modal-overlay');
    const sent = document.getElementById('sos-sent');
    const actions = document.querySelector('.sos-modal-actions');

    if (!overlay) return;

    // Reset UI
    if (sent) sent.hidden = true;
    if (actions) actions.style.display = '';

    overlay.hidden = false;
    overlay.removeAttribute('hidden');
    modalOpen = true;
    document.body.style.overflow = 'hidden';

    // Vibrate if supported
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

    // Try refresh location
    tryGetLocation();

    // Trap focus
    const firstFocus = document.getElementById('btn-sos-confirm');
    if (firstFocus) setTimeout(() => firstFocus.focus(), 50);
  }

  function closeModal() {
    const overlay = document.getElementById('sos-modal-overlay');
    if (overlay) overlay.hidden = true;
    modalOpen = false;
    document.body.style.overflow = '';
  }

  async function sendSOS() {
    const btn = document.getElementById('btn-sos-confirm');
    const sent = document.getElementById('sos-sent');
    const actions = document.querySelector('.sos-modal-actions');

    if (btn) {
      btn.textContent = 'Sending…';
      btn.disabled = true;
    }

    const location = userLocation || await getLocationFallback();

    try {
      const result = await SheRoutes.API.sendSOS(location, 'SOS – I need help! Sent from SheRoutes app.');
      console.log('✅ SOS sent:', result);

      // Show success
      if (actions) actions.style.display = 'none';
      if (sent) sent.hidden = false;

      // Vibrate success
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 300]);

      SheRoutes.UI.showToast('🚨 SOS Alert sent! Stay safe.', 'error');

      // Auto-close after 4 seconds
      setTimeout(() => closeModal(), 4000);

    } catch (err) {
      console.error('SOS error:', err);
      SheRoutes.UI.showToast('SOS send failed – call emergency services directly!', 'error');
      if (btn) {
        btn.textContent = 'Send SOS Now';
        btn.disabled = false;
      }
    }
  }

  function getLocationFallback() {
    return new Promise(resolve => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  return { init, openModal, closeModal };
})();
