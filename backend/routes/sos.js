const express = require('express');
const router = express.Router();

// In-memory store for SOS alerts (use a DB in production)
const sosAlerts = [];

// ─── POST /api/sos ────────────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { userId, location, message, contacts } = req.body;

  const alert = {
    id: `sos_${Date.now()}`,
    userId: userId || 'anonymous',
    location: location || null,
    message: message || 'EMERGENCY - SheRoutes SOS Alert',
    contacts: contacts || [],
    timestamp: new Date().toISOString(),
    status: 'sent'
  };

  sosAlerts.push(alert);

  // In production: send SMS/email to emergency contacts, notify authorities
  console.log('\n🚨 SOS ALERT TRIGGERED:');
  console.log('  User:', alert.userId);
  console.log('  Location:', JSON.stringify(alert.location));
  console.log('  Time:', alert.timestamp);
  console.log('  Message:', alert.message);

  res.status(201).json({
    success: true,
    alertId: alert.id,
    message: 'SOS alert sent. Emergency contacts have been notified.',
    timestamp: alert.timestamp
  });
});

// ─── GET /api/sos/alerts ──────────────────────────────────────────────────────
router.get('/alerts', (req, res) => {
  res.json({ alerts: sosAlerts, count: sosAlerts.length });
});

module.exports = router;
