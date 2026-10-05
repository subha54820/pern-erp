const db = require('../config/db');

exports.getInventory = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.id AS inventory_id, i.product_id, i.physical_stock, i.reserved_stock,
              (i.physical_stock - i.reserved_stock) AS available_stock,
              i.updated_at, p.sku, p.name AS product_name, p.unit_price
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       ORDER BY p.name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch inventory.' });
  }
};

exports.updatePhysicalStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { physical_stock } = req.body;

    if (physical_stock === undefined || physical_stock < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative physical stock is required.' });
    }

    // Check reserved stock first to prevent reserved > physical
    const check = await db.query('SELECT reserved_stock FROM inventory WHERE product_id = $1', [productId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Inventory record not found.' });
    }

    if (physical_stock < check.rows[0].reserved_stock) {
      return res.status(400).json({
        success: false,
        message: `Physical stock (${physical_stock}) cannot be less than currently reserved stock (${check.rows[0].reserved_stock}).`,
      });
    }

    const result = await db.query(
      `UPDATE inventory
       SET physical_stock = $1, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $2
       RETURNING *, (physical_stock - reserved_stock) AS available_stock`,
      [parseInt(physical_stock, 10), productId]
    );

    res.json({
      success: true,
      message: 'Physical stock updated successfully.',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update stock.' });
  }
};
