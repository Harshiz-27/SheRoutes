/* ═══════════════════════════════════════════════════════════════
   api.js – Backend API Communication Layer
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.API = (function () {
  const BASE = SheRoutes.CONFIG.API_BASE;

  /**
   * Generic fetch with error handling
   */
  async function request(path, options = {}) {
    const url = `${BASE}${path}`;
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      // If backend unreachable, return demo data
      if (err.message.includes('fetch') || err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        console.warn('⚠️ Backend unreachable – using demo data');
        return getDemoFallback(path, options);
      }
      throw err;
    }
  }

  /**
   * Get route directions from backend
   */
  async function getRoutes(origin, destination, mode = 'walking') {
    const params = new URLSearchParams({ origin, destination, mode });
    return request(`/api/routes?${params}`);
  }

  /**
   * Geocode an address
   */
  async function geocode(address) {
    const params = new URLSearchParams({ address });
    return request(`/api/geocode?${params}`);
  }

  /**
   * Reverse geocode coordinates
   */
  async function reverseGeocode(lat, lng) {
    const params = new URLSearchParams({ lat, lng });
    return request(`/api/geocode/reverse?${params}`);
  }

  /**
   * Get autocomplete predictions
   */
  async function autocomplete(input) {
    const params = new URLSearchParams({ input });
    return request(`/api/geocode/autocomplete?${params}`);
  }

  /**
   * Send SOS alert
   */
  async function sendSOS(location, message) {
    return request('/api/sos', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'guest',
        location,
        message: message || 'SOS - I need help!',
        contacts: []
      })
    });
  }

  /**
   * Health check
   */
  async function healthCheck() {
    return request('/api/health');
  }

  // ─── AUTHENTICATION ─────────────────────────────────────────────

  async function register(payload) {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function login(payload) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function sendOtp(phone) {
    return request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    });
  }

  async function verifyOtp(phone, otp) {
    return request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp })
    });
  }

  async function getMe(token) {
    return request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  /**
   * Demo fallback data when backend is offline
   */
  function getDemoFallback(path, options) {
    if (path.includes('/api/routes')) {
      return {
        demo: true,
        status: 'OK',
        routes: [
          {
            index: 0,
            summary: 'Main Road (Demo)',
            distance: { text: '3.2 km', value: 3200 },
            duration: { text: '12 mins', value: 720 },
            startAddress: 'Starting Point',
            endAddress: 'Destination',
            steps: [
              { instruction: 'Head north on Main Street', distance: '0.5 km', duration: '2 mins' },
              { instruction: 'Turn right onto Market Avenue', distance: '1.8 km', duration: '6 mins' },
              { instruction: 'Turn left onto Park Road', distance: '0.9 km', duration: '4 mins' },
              { instruction: 'You have arrived at your destination', distance: '', duration: '' }
            ],
            safetyScore: 88,
            safetyLabel: 'Very Safe',
            safetyColor: '#22c55e',
            safetyEmoji: '🟢',
            isRecommended: true
          },
          {
            index: 1,
            summary: 'Via Central Blvd (Demo)',
            distance: { text: '4.5 km', value: 4500 },
            duration: { text: '17 mins', value: 1020 },
            startAddress: 'Starting Point',
            endAddress: 'Destination',
            steps: [
              { instruction: 'Head east on 1st Street', distance: '1.2 km', duration: '5 mins' },
              { instruction: 'Turn left onto Central Boulevard', distance: '2.5 km', duration: '9 mins' },
              { instruction: 'Arrive at destination', distance: '0.8 km', duration: '3 mins' }
            ],
            safetyScore: 68,
            safetyLabel: 'Moderately Safe',
            safetyColor: '#f59e0b',
            safetyEmoji: '🟡',
            isRecommended: false
          }
        ]
      };
    }

    if (path.includes('/api/geocode/autocomplete')) {
      const url = new URL(`http://x${path}`);
      const input = url.searchParams.get('input') || '';
      return {
        demo: true,
        predictions: [
          { description: `${input}, New Delhi`, place_id: 'demo1' },
          { description: `${input} Road, Mumbai`, place_id: 'demo2' },
          { description: `${input} Colony, Bangalore`, place_id: 'demo3' }
        ]
      };
    }

    if (path.includes('/api/sos')) {
      return { success: true, alertId: `demo_${Date.now()}`, message: 'SOS alert logged (demo mode).' };
    }

    return { demo: true };
  }

  return { getRoutes, geocode, reverseGeocode, autocomplete, sendSOS, healthCheck, register, login, sendOtp, verifyOtp, getMe };
})();
