const db = require('../config/db');

exports.getAllCustomers = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM customers ORDER BY name ASC');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch customers.' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, company_name, email, phone, address } = req.body;
    if (!name || !company_name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, company name, email, and phone are required.' });
    }

    const check = await db.query('SELECT id FROM customers WHERE email = $1', [email.trim().toLowerCase()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Customer with this email already exists.' });
    }

    const result = await db.query(
      `INSERT INTO customers (name, company_name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), company_name.trim(), email.trim().toLowerCase(), phone.trim(), address || '']
    );

    res.status(201).json({ success: true, message: 'Customer created successfully.', data: result.rows[0] });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, message: 'Failed to create customer.' });
  }
};
