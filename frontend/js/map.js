/* ═══════════════════════════════════════════════════════════════
   map.js – Google Maps Integration & Demo Canvas Fallback
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.Map = (function () {
  let googleMap = null;
  let directionsService = null;
  let directionsRenderer = null;
  let trafficLayer = null;
  let originMarker = null;
  let destMarker = null;
  let isFullscreen = false;
  let trafficVisible = false;
  let isSatellite = false;
  let demoCanvas = null;
  let demoCtx = null;
  const DEMO_MODE = window.MAPS_DEMO_MODE || false;

  // ── Initialise ────────────────────────────────────────────────
  function init() {
    const mapEl = document.getElementById('google-map');
    if (!mapEl) return;

    if (DEMO_MODE) {
      initDemoMap();
      return;
    }

    try {
      googleMap = new google.maps.Map(mapEl, {
        center: SheRoutes.CONFIG.DEFAULT_CENTER,
        zoom: SheRoutes.CONFIG.DEFAULT_ZOOM,
        styles: SheRoutes.CONFIG.MAP_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: false,
        gestureHandling: 'cooperative'
      });

      directionsService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#FF85BB',
          strokeWeight: 5,
          strokeOpacity: 0.85
        }
      });
      directionsRenderer.setMap(googleMap);

      trafficLayer = new google.maps.TrafficLayer();

      // Hide placeholder
      hidePlaceholder();
      updateStatus('Map ready', 'idle');

    } catch (e) {
      console.error('Maps init error:', e);
      initDemoMap();
    }
  }

  // ── Render Route on Map ───────────────────────────────────────
  function renderRoute(origin, destination, mode) {
    if (DEMO_MODE || !googleMap) {
      renderDemoRoute(origin, destination);
      return;
    }

    updateStatus('Finding route…', 'loading');

    directionsService.route({
      origin,
      destination,
      travelMode: google.maps.TravelMode[mode.toUpperCase()] || google.maps.TravelMode.WALKING,
      provideRouteAlternatives: true
    }, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        hidePlaceholder();
        fitMapToRoute(result.routes[0]);
        placeMarkers(
          result.routes[0].legs[0].start_location,
          result.routes[0].legs[0].end_location
        );
        updateStatus('Route found', 'success');
      } else {
        updateStatus('Route not found', 'error');
        SheRoutes.UI.showToast('Could not find route: ' + status, 'error');
      }
    });
  }

  // ── Fit Map Bounds ────────────────────────────────────────────
  function fitMapToRoute(route) {
    if (!googleMap) return;
    const bounds = new google.maps.LatLngBounds();
    route.legs.forEach(leg => {
      bounds.extend(leg.start_location);
      bounds.extend(leg.end_location);
      leg.steps.forEach(step => bounds.extend(step.start_location));
    });
    googleMap.fitBounds(bounds, { top: 60, bottom: 20, left: 30, right: 30 });
  }

  // ── Custom Markers ────────────────────────────────────────────
  function placeMarkers(originLatLng, destLatLng) {
    if (!googleMap) return;
    if (originMarker) originMarker.setMap(null);
    if (destMarker) destMarker.setMap(null);

    originMarker = new google.maps.Marker({
      position: originLatLng,
      map: googleMap,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#FF85BB',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2.5
      },
      title: 'Start'
    });

    destMarker = new google.maps.Marker({
      position: destLatLng,
      map: googleMap,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 7,
        fillColor: '#021A54',
        fillOpacity: 1,
        strokeColor: '#FF85BB',
        strokeWeight: 2.5
      },
      title: 'Destination'
    });
  }

  // ── Go to User Location ───────────────────────────────────────
  function goToUserLocation(callback) {
    if (!navigator.geolocation) {
      SheRoutes.UI.showToast('Geolocation not supported', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (googleMap) {
          googleMap.setCenter({ lat, lng });
          googleMap.setZoom(15);
        }
        if (callback) callback(lat, lng);
        updateStatus('Location found', 'success');
      },
      err => {
        SheRoutes.UI.showToast('Could not get location: ' + err.message, 'warning');
        updateStatus('Location failed', 'error');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // ── Traffic Layer ─────────────────────────────────────────────
  function toggleTraffic() {
    if (DEMO_MODE) { SheRoutes.UI.showToast('Traffic layer requires Google Maps API key', 'warning'); return; }
    trafficVisible = !trafficVisible;
    trafficLayer.setMap(trafficVisible ? googleMap : null);
    return trafficVisible;
  }

  // ── Satellite View ────────────────────────────────────────────
  function toggleSatellite() {
    if (DEMO_MODE) { SheRoutes.UI.showToast('Satellite view requires Google Maps API key', 'warning'); return; }
    isSatellite = !isSatellite;
    googleMap.setMapTypeId(isSatellite ? 'satellite' : 'roadmap');
    if (!isSatellite) googleMap.setOptions({ styles: SheRoutes.CONFIG.MAP_STYLE });
    return isSatellite;
  }

  // ── Fullscreen ────────────────────────────────────────────────
  function toggleFullscreen() {
    const container = document.getElementById('map-container');
    isFullscreen = !isFullscreen;
    container.classList.toggle('fullscreen', isFullscreen);
    if (googleMap) {
      setTimeout(() => google.maps.event.trigger(googleMap, 'resize'), 100);
    }
    return isFullscreen;
  }

  // ── DOM Helpers ───────────────────────────────────────────────
  function hidePlaceholder() {
    const ph = document.getElementById('map-placeholder');
    if (ph) ph.classList.add('hidden');
  }

  function updateStatus(text, state) {
    const dot = document.querySelector('.status-dot');
    const label = document.getElementById('map-status-text');
    if (dot) dot.className = `status-dot ${state}`;
    if (label) label.textContent = text;
  }

  // ════════════════════════════════════════════════════════
  // DEMO MAP (Canvas Fallback – no API key)
  // ════════════════════════════════════════════════════════
  function initDemoMap() {
    const mapEl = document.getElementById('google-map');
    demoCanvas = document.createElement('canvas');
    demoCanvas.id = 'demo-map-canvas';
    demoCanvas.width = mapEl.offsetWidth || 1200;
    demoCanvas.height = mapEl.offsetHeight || 520;
    mapEl.appendChild(demoCanvas);
    demoCtx = demoCanvas.getContext('2d');

    drawDemoBackground();
    hidePlaceholder();
    updateStatus('Demo mode (add API key for live map)', 'idle');

    // Resize
    window.addEventListener('resize', debounce(() => {
      demoCanvas.width = mapEl.offsetWidth;
      demoCanvas.height = mapEl.offsetHeight;
      if (lastRouteData) renderDemoRoute(lastRouteData.from, lastRouteData.to);
      else drawDemoBackground();
    }, 200));
  }

  let lastRouteData = null;

  function drawDemoBackground() {
    if (!demoCtx) return;
    const w = demoCanvas.width, h = demoCanvas.height;
    const ctx = demoCtx;

    // Base gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(0.5, '#0d1f5f');
    grad.addColorStop(1, '#1a0a3d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid roads
    ctx.strokeStyle = 'rgba(13,42,110,0.6)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Major roads
    ctx.strokeStyle = 'rgba(26,61,122,0.8)';
    ctx.lineWidth = 4;
    const majors = [
      [[0, h * 0.35], [w, h * 0.35]],
      [[0, h * 0.65], [w, h * 0.65]],
      [[w * 0.3, 0], [w * 0.3, h]],
      [[w * 0.7, 0], [w * 0.7, h]]
    ];
    majors.forEach(([[x1,y1],[x2,y2]]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    });

    // Water body
    ctx.fillStyle = 'rgba(2,26,84,0.5)';
    ctx.beginPath();
    ctx.ellipse(w*0.15, h*0.8, 80, 40, 0, 0, Math.PI*2);
    ctx.fill();

    // Parks (green squares)
    ctx.fillStyle = 'rgba(12,42,30,0.8)';
    [[w*0.45, h*0.15, 80, 50], [w*0.75, h*0.6, 60, 40]].forEach(([x,y,rw,rh]) => {
      roundRect(ctx, x, y, rw, rh, 4);
      ctx.fill();
    });

    // Map label
    ctx.font = '500 12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'right';
    ctx.fillText('SheRoutes Demo Map', w - 12, h - 10);
  }

  function renderDemoRoute(from, to) {
    if (!demoCtx) return;
    lastRouteData = { from, to };

    drawDemoBackground();
    const ctx = demoCtx;
    const w = demoCanvas.width, h = demoCanvas.height;

    // Randomised but consistent route path
    const points = [
      { x: w * 0.15, y: h * 0.75 },
      { x: w * 0.25, y: h * 0.35 },
      { x: w * 0.50, y: h * 0.30 },
      { x: w * 0.70, y: h * 0.60 },
      { x: w * 0.85, y: h * 0.25 }
    ];

    // Route glow
    ctx.shadowBlur = 16;
    ctx.shadowColor = 'rgba(255,133,187,0.5)';
    ctx.strokeStyle = '#FF85BB';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Dotted alternate route
    ctx.strokeStyle = 'rgba(255,206,227,0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    const alt = [
      { x: w * 0.15, y: h * 0.75 },
      { x: w * 0.30, y: h * 0.65 },
      { x: w * 0.55, y: h * 0.55 },
      { x: w * 0.70, y: h * 0.60 },
      { x: w * 0.85, y: h * 0.25 }
    ];
    ctx.beginPath();
    ctx.moveTo(alt[0].x, alt[0].y);
    alt.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.setLineDash([]);

    // Origin marker
    drawMarker(ctx, points[0].x, points[0].y, '#FF85BB', '📍');
    // Destination marker
    drawMarker(ctx, points[points.length-1].x, points[points.length-1].y, '#021A54', '🎯');

    // Labels
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillStyle = '#FF85BB';
    ctx.textAlign = 'center';
    ctx.fillText(truncate(from, 20), points[0].x, points[0].y - 26);
    ctx.fillStyle = '#FFCEE3';
    ctx.fillText(truncate(to, 20), points[points.length-1].x, points[points.length-1].y - 26);

    updateStatus('Demo route displayed', 'success');
  }

  function drawMarker(ctx, x, y, fill, emoji) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = fill;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function truncate(str, len) {
    return str && str.length > len ? str.slice(0, len) + '…' : (str || '');
  }

  function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    init,
    renderRoute,
    renderDemoRoute,
    goToUserLocation,
    toggleTraffic,
    toggleSatellite,
    toggleFullscreen,
    updateStatus,
    hidePlaceholder
  };
})();

// Called by Google Maps script callback
window.onMapsReady = function () {
  SheRoutes.Map.init();
};
