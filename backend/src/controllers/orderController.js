const db = require('../config/db');

// Convert Accepted Quotation into Sales Order
exports.createOrderFromQuotation = async (req, res) => {
  const client = await db.getClient();
  try {
    const { quotationId } = req.params;

    await client.query('BEGIN');

    // 1. Fetch quotation
    const qRes = await client.query('SELECT * FROM quotations WHERE id = $1 FOR UPDATE', [quotationId]);
    if (qRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    const quotation = qRes.rows[0];

    // Business Rule 2: One quotation cannot create duplicate orders.
    const dupCheck = await client.query('SELECT id, order_number FROM sales_orders WHERE quotation_id = $1', [quotationId]);
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Sales Order (${dupCheck.rows[0].order_number}) has already been created for this quotation. Duplicate orders are not allowed.`,
      });
    }

    // Business Rule 1: Only accepted quotations can create orders.
    if (quotation.status !== 'ACCEPTED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Only ACCEPTED quotations can be converted to sales orders. Current status: '${quotation.status}'.`,
      });
    }

    // Fetch quotation items
    const itemsRes = await client.query('SELECT * FROM quotation_items WHERE quotation_id = $1', [quotationId]);
    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Quotation has no line items.' });
    }

    const orderNum = `SO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // Create Sales Order
    const orderRes = await client.query(
      `INSERT INTO sales_orders (order_number, quotation_id, customer_id, total_amount, status, created_by)
       VALUES ($1, $2, $3, $4, 'CREATED', $5) RETURNING *`,
      [orderNum, quotation.id, quotation.customer_id, quotation.total_amount, req.user.id]
    );

    const salesOrder = orderRes.rows[0];

    // Create Sales Order Items
    for (const item of itemsRes.rows) {
      await client.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5)`,
        [salesOrder.id, item.product_id, item.quantity, item.unit_price, item.line_total]
      );
    }

    // Update Quotation status to CONVERTED
    await client.query(`UPDATE quotations SET status = 'CONVERTED' WHERE id = $1`, [quotationId]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Sales Order created successfully from quotation.',
      data: salesOrder,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order from quotation:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create sales order.' });
  } finally {
    client.release();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT so.id, so.order_number, so.quotation_id, so.customer_id, so.total_amount, so.status, so.created_by, so.created_at,
              c.name AS customer_contact, c.company_name AS customer_name,
              q.quotation_number,
              u.name AS creator_name
       FROM sales_orders so
       JOIN customers c ON so.customer_id = c.id
       JOIN quotations q ON so.quotation_id = q.id
       LEFT JOIN users u ON so.created_by = u.id
       ORDER BY so.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllOrders error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales orders.' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderRes = await db.query(
      `SELECT so.*, c.name AS customer_name, c.company_name, c.email AS customer_email, c.phone AS customer_phone,
              q.quotation_number
       FROM sales_orders so
       JOIN customers c ON so.customer_id = c.id
       JOIN quotations q ON so.quotation_id = q.id
       WHERE so.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const itemsRes = await db.query(
      `SELECT soi.*, p.name AS product_name, p.sku,
              i.physical_stock, i.reserved_stock, (i.physical_stock - i.reserved_stock) AS available_stock
       FROM sales_order_items soi
       JOIN products p ON soi.product_id = p.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE soi.sales_order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...orderRes.rows[0],
        items: itemsRes.rows,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales order details.' });
  }
};

// ADMIN: Confirm Sales Order
exports.confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const orderRes = await db.query('SELECT * FROM sales_orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.status !== 'CREATED') {
      return res.status(400).json({ success: false, message: `Only orders with status 'CREATED' can be confirmed. Current status: '${order.status}'.` });
    }

    const updateRes = await db.query(
      `UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Sales Order confirmed successfully.',
      data: updateRes.rows[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm order.' });
  }
};

// ADMIN: Reserve Inventory for Sales Order
// Uses PostgreSQL Transaction + FOR UPDATE locks for accurate stock validation
exports.reserveInventory = async (req, res) => {
  const client = await db.getClient();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Lock and fetch sales order
    const orderRes = await client.query('SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const order = orderRes.rows[0];
    if (order.status === 'RESERVED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Inventory for this order has already been reserved.' });
    }

    if (order.status === 'DISPATCHED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order has already been dispatched.' });
    }

    if (order.status !== 'CREATED' && order.status !== 'CONFIRMED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Cannot reserve inventory for order with status '${order.status}'.` });
    }

    // 2. Fetch order items
    const itemsRes = await client.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [id]);

    // 3. Check stock availability for all items before making any modifications
    for (const item of itemsRes.rows) {
      const invRes = await client.query(
        `SELECT i.*, p.name AS product_name, p.sku
         FROM inventory i
         JOIN products p ON i.product_id = p.id
         WHERE i.product_id = $1 FOR UPDATE`,
        [item.product_id]
      );

      if (invRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `No inventory record found for product ID ${item.product_id}.` });
      }

      const inv = invRes.rows[0];
      const availableStock = inv.physical_stock - inv.reserved_stock;

      // Business Rule: Available stock = Physical - Reserved. Never allow negative stock or reservation beyond available stock.
      if (item.quantity > availableStock) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient available stock for product '${inv.product_name}' (${inv.sku}). Requested: ${item.quantity}, Available: ${availableStock} (Physical: ${inv.physical_stock}, Already Reserved: ${inv.reserved_stock}).`,
        });
      }
    }

    // 4. Reserve stock: Increase Reserved stock ONLY (Physical stock remains unchanged)
    for (const item of itemsRes.rows) {
      await client.query(
        `UPDATE inventory
         SET reserved_stock = reserved_stock + $1, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // 5. Update sales order status to RESERVED
    const updatedOrderRes = await client.query(
      `UPDATE sales_orders SET status = 'RESERVED' WHERE id = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Inventory successfully reserved for Sales Order.',
      data: updatedOrderRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reserve inventory error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reserve inventory.' });
  } finally {
    client.release();
  }
};
