require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─── Safety Score Generator (dummy algorithm) ────────────────────────────────
function generateSafetyScore(distance, duration, route) {
  // Simulated safety scoring based on route characteristics
  const baseScore = 75;
  const distanceFactor = Math.min(distance / 5000, 1) * (-10); // longer = slightly lower
  const timeBonus = duration < 900 ? 5 : 0; // bonus for short trips
  const randomVariance = Math.floor(Math.random() * 15) - 5;
  const score = Math.min(100, Math.max(40, baseScore + distanceFactor + timeBonus + randomVariance));
  return Math.round(score);
}

function getSafetyLabel(score) {
  if (score >= 80) return { label: 'Very Safe', color: '#22c55e', emoji: '🟢' };
  if (score >= 60) return { label: 'Moderately Safe', color: '#f59e0b', emoji: '🟡' };
  return { label: 'Use Caution', color: '#ef4444', emoji: '🔴' };
}

// ─── GET /api/routes ──────────────────────────────────────────────────────────
// Query params: origin, destination, mode (optional)
router.get('/', async (req, res) => {
  const { origin, destination, mode = 'walking' } = req.query;

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' });
  }

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    // Return demo data when no API key is configured
    const demoData = generateDemoRouteData(origin, destination);
    return res.json({ demo: true, ...demoData });
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        params: {
          origin,
          destination,
          mode,
          alternatives: true,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    const data = response.data;

    if (data.status !== 'OK') {
      return res.status(400).json({
        error: `Google Maps error: ${data.status}`,
        message: data.error_message || 'Could not find route'
      });
    }

    const routes = data.routes.map((route, index) => {
      const leg = route.legs[0];
      const safetyScore = generateSafetyScore(leg.distance.value, leg.duration.value, route);
      const safetyInfo = getSafetyLabel(safetyScore);

      return {
        index,
        summary: route.summary,
        distance: {
          text: leg.distance.text,
          value: leg.distance.value
        },
        duration: {
          text: leg.duration.text,
          value: leg.duration.value
        },
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions,
          distance: step.distance.text,
          duration: step.duration.text,
          travelMode: step.travel_mode
        })),
        safetyScore,
        safetyLabel: safetyInfo.label,
        safetyColor: safetyInfo.color,
        safetyEmoji: safetyInfo.emoji,
        polyline: route.overview_polyline.points,
        isRecommended: index === 0
      };
    });

    res.json({
      status: 'OK',
      origin: data.geocoded_waypoints?.[0] || origin,
      destination: data.geocoded_waypoints?.[1] || destination,
      routes,
      recommendedRoute: routes[0]
    });

  } catch (err) {
    console.error('Routes API error:', err.message);
    res.status(500).json({ error: 'Failed to fetch routes', detail: err.message });
  }
});

// ─── Demo data for when no API key ───────────────────────────────────────────
function generateDemoRouteData(origin, destination) {
  return {
    status: 'OK',
    origin,
    destination,
    routes: [
      {
        index: 0,
        summary: 'Main Road via Market Street',
        distance: { text: '3.2 km', value: 3200 },
        duration: { text: '12 mins', value: 720 },
        startAddress: origin,
        endAddress: destination,
        steps: [
          { instruction: 'Head north on Main St', distance: '0.5 km', duration: '2 mins' },
          { instruction: 'Turn right onto Market Street', distance: '1.8 km', duration: '6 mins' },
          { instruction: 'Turn left onto Park Avenue', distance: '0.9 km', duration: '4 mins' },
          { instruction: 'Arrive at destination', distance: '', duration: '' }
        ],
        safetyScore: 88,
        safetyLabel: 'Very Safe',
        safetyColor: '#22c55e',
        safetyEmoji: '🟢',
        isRecommended: true
      },
      {
        index: 1,
        summary: 'Via Central Boulevard',
        distance: { text: '4.1 km', value: 4100 },
        duration: { text: '15 mins', value: 900 },
        startAddress: origin,
        endAddress: destination,
        steps: [
          { instruction: 'Head east on 1st Street', distance: '1.2 km', duration: '5 mins' },
          { instruction: 'Turn left onto Central Blvd', distance: '2.1 km', duration: '7 mins' },
          { instruction: 'Arrive at destination', distance: '0.8 km', duration: '3 mins' }
        ],
        safetyScore: 72,
        safetyLabel: 'Moderately Safe',
        safetyColor: '#f59e0b',
        safetyEmoji: '🟡',
        isRecommended: false
      }
    ],
    recommendedRoute: null
  };
}

module.exports = router;
