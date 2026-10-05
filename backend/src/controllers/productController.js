const db = require('../config/db');

exports.getAllProducts = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, i.physical_stock, i.reserved_stock, 
              (i.physical_stock - i.reserved_stock) AS available_stock
       FROM products p
       LEFT JOIN inventory i ON p.id = i.product_id
       ORDER BY p.name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

exports.createProduct = async (req, res) => {
  const client = await db.getClient();
  try {
    const { sku, name, description, unit_price, initial_stock = 0 } = req.body;
    if (!sku || !name || unit_price === undefined) {
      return res.status(400).json({ success: false, message: 'SKU, name, and unit_price are required.' });
    }

    await client.query('BEGIN');
    const prodRes = await client.query(
      `INSERT INTO products (sku, name, description, unit_price)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sku.trim().toUpperCase(), name.trim(), description || '', parseFloat(unit_price)]
    );

    const product = prodRes.rows[0];

    await client.query(
      `INSERT INTO inventory (product_id, physical_stock, reserved_stock)
       VALUES ($1, $2, 0)`,
      [product.id, parseInt(initial_stock, 10)]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: { ...product, physical_stock: initial_stock, reserved_stock: 0, available_stock: initial_stock },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Product SKU already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  } finally {
    client.release();
  }
};
