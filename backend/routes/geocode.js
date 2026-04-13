require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// ─── GET /api/geocode ─────────────────────────────────────────────────────────
// Forward geocoding: address → lat/lng
router.get('/', async (req, res) => {
  const { address } = req.query;
  if (!address) return res.status(400).json({ error: 'address query param required' });

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return res.json({
      demo: true,
      results: [{ formatted_address: address, geometry: { location: { lat: 28.6139, lng: 77.2090 } } }]
    });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: GOOGLE_MAPS_API_KEY }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Geocode failed', detail: err.message });
  }
});

// ─── GET /api/geocode/reverse ─────────────────────────────────────────────────
// Reverse geocoding: lat/lng → address
router.get('/reverse', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return res.json({ demo: true, results: [{ formatted_address: `Location (${lat}, ${lng})` }] });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: GOOGLE_MAPS_API_KEY }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocode failed', detail: err.message });
  }
});

// ─── GET /api/geocode/autocomplete ───────────────────────────────────────────
router.get('/autocomplete', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: 'input required' });

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    const demos = [
      `${input} Street, New Delhi`,
      `${input} Market, Mumbai`,
      `${input} Colony, Bangalore`,
      `${input} Nagar, Chennai`
    ];
    return res.json({ demo: true, predictions: demos.map((d, i) => ({ description: d, place_id: `demo_${i}` })) });
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: { input, key: GOOGLE_MAPS_API_KEY, types: 'geocode' }
    });
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete failed', detail: err.message });
  }
});

module.exports = router;
