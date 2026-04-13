const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sheroutes_key_123';

// Temporary in-memory store for OTPs
const otpStore = new Map();

// ─── SEND OTP ────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  // Simulate generating a 4 digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60000 }); // 5 mins

  console.log(`\n📲 SMS OTP sent to ${phone}: ${otp}`);

  res.json({ message: 'OTP sent successfully', demoOtp: otp });
});

// ─── VERIFY OTP ──────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP required' });

  const stored = otpStore.get(phone);
  if (!stored) return res.status(400).json({ error: 'OTP expired or not requested' });
  
  if (stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Clear OTP
  otpStore.delete(phone);

  // Check if user already exists
  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    const token = jwt.sign({ id: existingUser._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ action: 'login', token, user: existingUser });
  }

  // Otherwise, user needs to complete registration
  res.json({ action: 'register', message: 'OTP verified, proceed to registration details' });
});

// ─── REGISTER USER ───────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, age, gender, emergencyName, emergencyPhone, allowLocation } = req.body;
    
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ error: 'User with this email or phone already exists' });

    const newUser = new User({
      name, email, phone, password, age, gender, allowLocation,
      emergencyContacts: emergencyName && emergencyPhone ? [{ name: emergencyName, phone: emergencyPhone }] : []
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: newUser, message: 'Account created successfully!' });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

// ─── PASSWORD LOGIN ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user, message: 'Login successful!' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── GET ME ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
