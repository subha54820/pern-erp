const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const assignedRole = role === 'ADMIN' ? 'ADMIN' : 'SALES_USER';
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name.trim(), cleanEmail, passwordHash, assignedRole]
    );

    const user = result.rows[0];
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching user details.' });
  }
};

exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['ADMIN', 'SALES_USER'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const result = await db.query('SELECT * FROM users WHERE role = $1 LIMIT 1', [role]);
    let payload;
    if (result.rows.length > 0) {
      const u = result.rows[0];
      payload = { id: u.id, name: u.name, email: u.email, role: u.role };
    } else {
      payload = {
        id: role === 'ADMIN' ? 1 : 2,
        name: role === 'ADMIN' ? 'System Admin' : 'Sales Representative',
        email: role === 'ADMIN' ? 'admin@fundsroom.com' : 'sales@fundsroom.com',
        role: role,
      };
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: `Role switched to ${role}`,
      token,
      user: payload,
    });
  } catch (error) {
    console.error('Switch role error:', error);
    res.status(500).json({ success: false, message: 'Failed to switch role.' });
  }
};
