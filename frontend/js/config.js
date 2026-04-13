/* ═══════════════════════════════════════════════════════════════
   config.js – Global Config & Constants
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.CONFIG = {
  API_BASE: window.API_BASE_URL || 'http://localhost:5000',
  GOOGLE_MAPS_KEY: window.GOOGLE_MAPS_API_KEY || '',
  DEFAULT_CENTER: { lat: 28.6139, lng: 77.2090 }, // New Delhi
  DEFAULT_ZOOM: 13,
  MAP_STYLE: [
    { elementType: 'geometry', stylers: [{ color: '#0a1628' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#021A54' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#0d2a6e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#021A54' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1a3d7a' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0d2a6e' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#021A54' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0c1e3e' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0c2a1e' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#1a3a6a' }] },
    { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0a1a40' }] }
  ],
  SAFETY_TIPS: [
    'Always share your live location with a trusted contact before travelling at night.',
    'Prefer well-lit, populated routes especially after dark.',
    'Trust your instincts — if something feels wrong, cross the street or enter a public space.',
    'Keep your phone charged and emergency contacts on speed-dial.',
    'Walk confidently and be aware of your surroundings at all times.',
    'Avoid wearing headphones at full volume so you can hear your surroundings.',
    'Let someone know your expected arrival time whenever possible.',
    'Use the SOS button immediately if you feel unsafe — help will come.',
    'Stick to areas with CCTV coverage whenever possible.',
    'Travel with a friend on unfamiliar routes after sunset.'
  ]
};
