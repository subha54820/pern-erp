const db = require('../config/db');

exports.processDispatch = async (req, res) => {
  const client = await db.getClient();
  try {
    const { sales_order_id, notes } = req.body;

    if (!sales_order_id) {
      return res.status(400).json({ success: false, message: 'Sales Order ID is required.' });
    }

    await client.query('BEGIN');

    // 1. Fetch sales order with lock
    const orderRes = await client.query('SELECT * FROM sales_orders WHERE id = $1 FOR UPDATE', [sales_order_id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Sales Order not found.' });
    }

    const order = orderRes.rows[0];

    // Business Rule: Prevent duplicate dispatch
    const dupCheck = await client.query('SELECT id, dispatch_number FROM dispatches WHERE sales_order_id = $1', [sales_order_id]);
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Sales Order has already been dispatched (${dupCheck.rows[0].dispatch_number}). Duplicate dispatches are prevented.`,
      });
    }

    if (order.status !== 'RESERVED' && order.status !== 'CONFIRMED' && order.status !== 'CREATED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Order must be in CREATED, CONFIRMED, or RESERVED state to dispatch. Current status: '${order.status}'.`,
      });
    }

    // 2. Fetch order items
    const itemsRes = await client.query('SELECT * FROM sales_order_items WHERE sales_order_id = $1', [sales_order_id]);
    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Order has no items to dispatch.' });
    }

    const dispatchNum = `DSP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;

    // 3. Create Dispatch Record
    const dispatchRes = await client.query(
      `INSERT INTO dispatches (dispatch_number, sales_order_id, status, notes, dispatched_by)
       VALUES ($1, $2, 'PROCESSED', $3, $4) RETURNING *`,
      [dispatchNum, sales_order_id, notes || '', req.user.id]
    );

    const dispatch = dispatchRes.rows[0];

    // 4. Update Inventory: Decrease BOTH Physical Stock and Reserved Stock
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
        return res.status(400).json({ success: false, message: `Inventory record missing for product ID ${item.product_id}.` });
      }

      const inv = invRes.rows[0];

      if (inv.physical_stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Cannot dispatch product '${inv.product_name}'. Physical stock (${inv.physical_stock}) is less than required dispatch quantity (${item.quantity}).`,
        });
      }

      // If order was in CONFIRMED state without prior reservation, reserved_stock might be lower than item.quantity, so adjust safely
      const reservedToDeduct = Math.min(inv.reserved_stock, item.quantity);
      const newReserved = inv.reserved_stock - reservedToDeduct;
      const newPhysical = inv.physical_stock - item.quantity;

      // Use pre-computed absolute values to avoid pg-mem constraint evaluation issues
      await client.query(
        `UPDATE inventory
         SET reserved_stock = $1,
             physical_stock = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $3`,
        [newReserved, newPhysical, item.product_id]
      );

      // Insert Dispatch Item
      await client.query(
        `INSERT INTO dispatch_items (dispatch_id, product_id, quantity)
         VALUES ($1, $2, $3)`,
        [dispatch.id, item.product_id, item.quantity]
      );
    }

    // 5. Update Sales Order status to DISPATCHED
    await client.query(`UPDATE sales_orders SET status = 'DISPATCHED' WHERE id = $1`, [sales_order_id]);

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Dispatch processed successfully. Physical and Reserved stock updated.',
      data: dispatch,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Dispatch error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process dispatch.' });
  } finally {
    client.release();
  }
};

exports.getAllDispatches = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT d.id, d.dispatch_number, d.sales_order_id, d.status, d.notes, d.dispatched_by, d.dispatched_at,
              so.order_number,
              c.name AS customer_contact, c.company_name AS customer_name,
              u.name AS dispatcher_name
       FROM dispatches d
       JOIN sales_orders so ON d.sales_order_id = so.id
       JOIN customers c ON so.customer_id = c.id
       LEFT JOIN users u ON d.dispatched_by = u.id
       ORDER BY d.dispatched_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getAllDispatches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dispatches.' });
  }
};
