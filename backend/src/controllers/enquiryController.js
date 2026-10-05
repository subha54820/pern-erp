const db = require('../config/db');

exports.createEnquiry = async (req, res) => {
  const client = await db.getClient();
  try {
    const { customer_id, items, notes } = req.body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and at least one item are required.' });
    }

    const enqNum = `ENQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    await client.query('BEGIN');

    const enqRes = await client.query(
      `INSERT INTO enquiries (enquiry_number, customer_id, notes, status, created_by)
       VALUES ($1, $2, $3, 'SUBMITTED', $4) RETURNING *`,
      [enqNum, customer_id, notes || '', req.user.id]
    );

    const enquiry = enqRes.rows[0];

    for (const item of items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        throw new Error('Each item must have a valid product_id and quantity > 0.');
      }
      await client.query(
        `INSERT INTO enquiry_items (enquiry_id, product_id, quantity, target_price)
         VALUES ($1, $2, $3, $4)`,
        [enquiry.id, item.product_id, parseInt(item.quantity, 10), parseFloat(item.target_price || 0)]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Enquiry created successfully.',
      data: enquiry,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message || 'Failed to create enquiry.' });
  } finally {
    client.release();
  }
};

exports.getAllEnquiries = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.enquiry_number, e.customer_id, e.notes, e.status, e.created_by, e.created_at,
              c.name AS customer_contact, c.company_name AS customer_name, c.email AS customer_email,
              u.name AS creator_name
       FROM enquiries e
       JOIN customers c ON e.customer_id = c.id
       LEFT JOIN users u ON e.created_by = u.id
       ORDER BY e.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllEnquiries error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries.' });
  }
};

exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enqRes = await db.query(
      `SELECT e.*, c.name AS customer_name, c.company_name, c.email AS customer_email, c.phone AS customer_phone
       FROM enquiries e
       JOIN customers c ON e.customer_id = c.id
       WHERE e.id = $1`,
      [id]
    );

    if (enqRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found.' });
    }

    const itemsRes = await db.query(
      `SELECT ei.*, p.name AS product_name, p.sku, p.unit_price AS catalog_price,
              i.physical_stock, i.reserved_stock, (i.physical_stock - i.reserved_stock) AS available_stock
       FROM enquiry_items ei
       JOIN products p ON ei.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE ei.enquiry_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...enqRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiry details.' });
  }
};
