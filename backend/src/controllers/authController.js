const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role, isDemo: !!user.isDemo }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, password required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({
      name, email, password,
      role: role === 'agent' ? 'agent' : 'customer'
    });

    return res.status(201).json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isDemo: user.isDemo }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    return res.json({
      token: generateToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isDemo: user.isDemo }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

// Public one-click login for portfolio/demo visitors — no signup needed.
// Only works for the two fixed demo accounts created by seedDemoUsers.js.
//
// SECURITY: gated behind DEMO_LOGIN_ENABLED so it can never be reached in a
// real production deployment. Without this, anyone who finds the endpoint
// (no password required) could log in as an agent and read/reply to every
// customer's private ticket conversation.
//
// Set DEMO_LOGIN_ENABLED=true only in your demo/portfolio deployment's .env —
// leave it unset (or 'false') everywhere else, including real production.
exports.demoLogin = async (req, res) => {
  if (process.env.DEMO_LOGIN_ENABLED !== 'true') {
    return res.status(404).json({ message: 'Not found' });
  }

  const { role } = req.params;
  const email = role === 'agent' ? 'demo.agent@supportflow.dev' : 'demo.customer@supportflow.dev';

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Demo account not seeded yet. Run: node src/utils/seedDemoUsers.js' });
  }

  return res.json({
    token: generateToken(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, isDemo: user.isDemo }
  });
};