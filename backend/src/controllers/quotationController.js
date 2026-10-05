const db = require('../config/db');

exports.createQuotation = async (req, res) => {
  const client = await db.getClient();
  try {
    const { customer_id, enquiry_id, items, valid_until } = req.body;

    if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer ID and at least one item are required.' });
    }

    const quotNum = `QTN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    let totalAmount = 0;

    await client.query('BEGIN');

    // Calculate total amount
    const processedItems = items.map((item) => {
      const qty = parseInt(item.quantity, 10);
      const price = parseFloat(item.unit_price);
      if (!item.product_id || qty <= 0 || price < 0) {
        throw new Error('Invalid product, quantity, or price in quotation item.');
      }
      const lineTotal = qty * price;
      totalAmount += lineTotal;
      return { product_id: item.product_id, quantity: qty, unit_price: price, line_total: lineTotal };
    });

    const quotRes = await client.query(
      `INSERT INTO quotations (quotation_number, enquiry_id, customer_id, total_amount, status, valid_until, created_by)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6) RETURNING *`,
      [quotNum, enquiry_id || null, customer_id, totalAmount, valid_until || null, req.user.id]
    );

    const quotation = quotRes.rows[0];

    for (const item of processedItems) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotation.id, item.product_id, item.quantity, item.unit_price, item.line_total]
      );
    }

    // Update enquiry status to QUOTED if linked
    if (enquiry_id) {
      await client.query(`UPDATE enquiries SET status = 'QUOTED' WHERE id = $1`, [enquiry_id]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully.',
      data: quotation,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, message: error.message || 'Failed to create quotation.' });
  } finally {
    client.release();
  }
};

exports.getAllQuotations = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT q.id, q.quotation_number, q.enquiry_id, q.customer_id, q.total_amount, q.status, q.valid_until, q.created_by, q.created_at,
              c.name AS customer_contact, c.company_name AS customer_name,
              u.name AS creator_name
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.created_by = u.id
       ORDER BY q.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllQuotations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotations.' });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const qRes = await db.query(
      `SELECT q.*, c.name AS customer_name, c.company_name, c.email AS customer_email, c.phone AS customer_phone
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       WHERE q.id = $1`,
      [id]
    );

    if (qRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const itemsRes = await db.query(
      `SELECT qi.*, p.name AS product_name, p.sku,
              i.physical_stock, i.reserved_stock, (i.physical_stock - i.reserved_stock) AS available_stock
       FROM quotation_items qi
       JOIN products p ON qi.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE qi.quotation_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...qRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quotation details.' });
  }
};

exports.acceptQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const qRes = await db.query('SELECT * FROM quotations WHERE id = $1', [id]);
    if (qRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quotation = qRes.rows[0];
    if (quotation.status === 'CONVERTED') {
      return res.status(400).json({ success: false, message: 'Quotation has already been converted to a sales order.' });
    }

    const updateRes = await db.query(
      `UPDATE quotations SET status = 'ACCEPTED' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Quotation accepted successfully.',
      data: updateRes.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to accept quotation.' });
  }
};

exports.rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;

    const qRes = await db.query('SELECT * FROM quotations WHERE id = $1', [id]);
    if (qRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quotation = qRes.rows[0];
    if (quotation.status === 'CONVERTED') {
      return res.status(400).json({ success: false, message: 'Quotation has already been converted to a sales order and cannot be rejected.' });
    }

    const updateRes = await db.query(
      `UPDATE quotations SET status = 'REJECTED' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Quotation marked as rejected.',
      data: updateRes.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject quotation.' });
  }
};
