const request = require('supertest');
const app = require('../src/app');
const { initDbAndSeed } = require('../src/db/initDb');
const db = require('../src/config/db');

let adminToken;
let salesToken;
let customerId;
let productId;

beforeAll(async () => {
  process.env.USE_PG_MEM = 'true'; // Force fast in-memory PostgreSQL execution for automated test suite
  await initDbAndSeed();

  // 1. Login ADMIN
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@fundsroom.com', password: 'admin123' });
  adminToken = adminRes.body.token;

  // 2. Login SALES_USER
  const salesRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'sales@fundsroom.com', password: 'sales123' });
  salesToken = salesRes.body.token;

  // Get customer & product for tests
  const custs = await db.query('SELECT id FROM customers LIMIT 1');
  customerId = custs.rows[0].id;

  const prods = await db.query('SELECT id FROM products LIMIT 1');
  productId = prods.rows[0].id;
});

describe('PERN ERP Business Rules & Workflow Suite', () => {

  // Test 1: Authentication, Registration & Role Authorization
  test('1. Authentication, Registration & Role-based Authorization', async () => {
    // Unauthenticated request should fail with 401
    const noAuth = await request(app).get('/api/customers');
    expect(noAuth.status).toBe(401);

    // Register a new user
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New Sales Rep',
        email: 'newsales@fundsroom.com',
        password: 'password123',
        role: 'SALES_USER'
      });
    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.user.role).toBe('SALES_USER');

    // Sales user attempting ADMIN-only action (e.g., updating physical stock) should fail with 403
    const forbidden = await request(app)
      .put(`/api/inventory/${productId}`)
      .set('Authorization', `Bearer ${salesToken}`)
      .send({ physical_stock: 999 });
    expect(forbidden.status).toBe(403);

    // Admin performing ADMIN-only action should succeed
    const allowed = await request(app)
      .put(`/api/inventory/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ physical_stock: 100 });
    expect(allowed.status).toBe(200);
    expect(allowed.body.data.physical_stock).toBe(100);
  });

  // Test 2: Quotation Status Rule for Sales Order Conversion
  test('2. Only ACCEPTED quotations can create Sales Orders', async () => {
    // Create a PENDING quotation
    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 5, unit_price: 100 }],
      });
    const qtnId = qtnRes.body.data.id;

    // Attempting to convert PENDING quotation into Sales Order should fail (400)
    const failConvert = await request(app)
      .post(`/api/orders/from-quotation/${qtnId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(failConvert.status).toBe(400);
    expect(failConvert.body.message).toMatch(/ACCEPTED/);

    // Accept the quotation
    await request(app)
      .patch(`/api/quotations/${qtnId}/accept`)
      .set('Authorization', `Bearer ${salesToken}`);

    // Conversion should now succeed
    const successConvert = await request(app)
      .post(`/api/orders/from-quotation/${qtnId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(successConvert.status).toBe(201);
    expect(successConvert.body.data.quotation_id).toBe(qtnId);
  });

  // Test 3: One quotation cannot create duplicate orders
  test('3. Prevent duplicate Sales Orders from the same quotation', async () => {
    // Create & accept a new quotation
    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 2, unit_price: 150 }],
      });
    const qtnId = qtnRes.body.data.id;

    await request(app)
      .patch(`/api/quotations/${qtnId}/accept`)
      .set('Authorization', `Bearer ${salesToken}`);

    // Convert first time - Success
    await request(app)
      .post(`/api/orders/from-quotation/${qtnId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    // Attempt second conversion - Must fail with 400
    const dupRes = await request(app)
      .post(`/api/orders/from-quotation/${qtnId}`)
      .set('Authorization', `Bearer ${salesToken}`);
    expect(dupRes.status).toBe(400);
    expect(dupRes.body.message).toMatch(/already been created/i);
  });

  // Test 4: Inventory Reservation & Negative/Excess Stock Rules
  test('4. Inventory reservation respects Available Stock (Physical - Reserved)', async () => {
    // Set stock: Physical = 10, Reserved = 0 (Available = 10)
    await db.query('UPDATE inventory SET physical_stock = 10, reserved_stock = 0 WHERE product_id = $1', [productId]);

    // Create order requesting 15 units (exceeds available stock 10)
    const qtnRes = await request(app)
      .post('/api/quotations')
      .set('Authorization', `Bearer ${salesToken}`)
      .send({
        customer_id: customerId,
        items: [{ product_id: productId, quantity: 15, unit_price: 200 }],
      });
    const qtnId = qtnRes.body.data.id;

    await request(app).patch(`/api/quotations/${qtnId}/accept`).set('Authorization', `Bearer ${salesToken}`);
    const orderRes = await request(app).post(`/api/orders/from-quotation/${qtnId}`).set('Authorization', `Bearer ${salesToken}`);
    const orderId = orderRes.body.data.id;

    // Reserving 15 units when Available = 10 should fail (400)
    const excessRes = await request(app)
      .post(`/api/orders/${orderId}/reserve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(excessRes.status).toBe(400);
    expect(excessRes.body.message).toMatch(/Insufficient available stock/i);

    // Now update Physical stock to 50 (Available = 50) and attempt reservation -> Should succeed
    await db.query('UPDATE inventory SET physical_stock = 50, reserved_stock = 0 WHERE product_id = $1', [productId]);
    const validReserve = await request(app)
      .post(`/api/orders/${orderId}/reserve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(validReserve.status).toBe(200);

    // Verify reserved_stock increased by 15
    const checkInv = await db.query('SELECT physical_stock, reserved_stock FROM inventory WHERE product_id = $1', [productId]);
    expect(checkInv.rows[0].physical_stock).toBe(50);
    expect(checkInv.rows[0].reserved_stock).toBe(15);
  });

  // Test 5: Dispatch decreases Physical and Reserved stock & prevents duplicate dispatch
  test('5. Dispatch decreases both Physical and Reserved stock, prevents duplicates', async () => {
    // Stock before dispatch: Physical = 50, Reserved = 15
    const preInv = await db.query('SELECT physical_stock, reserved_stock FROM inventory WHERE product_id = $1', [productId]);
    const initPhysical = preInv.rows[0].physical_stock;
    const initReserved = preInv.rows[0].reserved_stock;

    // Get reserved order from Test 4
    const ordersRes = await db.query("SELECT id FROM sales_orders WHERE status = 'RESERVED' LIMIT 1");
    const orderId = ordersRes.rows[0].id;

    // Dispatch order (15 units)
    const dispatchRes = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sales_order_id: orderId, notes: 'Automated test dispatch' });

    expect(dispatchRes.status).toBe(201);

    // Verify inventory stock deduction
    const postInv = await db.query('SELECT physical_stock, reserved_stock FROM inventory WHERE product_id = $1', [productId]);
    expect(postInv.rows[0].physical_stock).toBe(initPhysical - 15);
    expect(postInv.rows[0].reserved_stock).toBe(initReserved - 15);

    // Attempting duplicate dispatch on same order must fail (400)
    const dupDispatch = await request(app)
      .post('/api/dispatches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sales_order_id: orderId });

    expect(dupDispatch.status).toBe(400);
    expect(dupDispatch.body.message).toMatch(/already been dispatched/i);
  });

  // Test 6: Order Cancellation & Reserved Stock Release
  test('6. Cancelling a reserved order updates status to CANCELLED and releases reserved stock', async () => {
    const prodRes = await db.query('SELECT product_id, physical_stock, reserved_stock FROM inventory LIMIT 1');
    const prodId = prodRes.rows[0].product_id;
    const initialReserved = prodRes.rows[0].reserved_stock;

    const custRes = await db.query('SELECT id FROM customers LIMIT 1');
    const quoteRes = await db.query(
      `INSERT INTO quotations (quotation_number, customer_id, total_amount, status) 
       VALUES ('QTN-TEST-CANCEL', $1, 500, 'ACCEPTED') RETURNING id`,
      [custRes.rows[0].id]
    );
    const qId = quoteRes.rows[0].id;

    await db.query(
      `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, line_total)
       VALUES ($1, $2, 5, 100, 500)`,
      [qId, prodId]
    );

    const orderRes = await request(app)
      .post(`/api/sales-orders/from-quotation/${qId}`)
      .set('Authorization', `Bearer ${salesToken}`);

    expect(orderRes.status).toBe(201);
    const newOrderId = orderRes.body.data.id;

    // Reserve stock for this order
    await request(app)
      .post(`/api/sales-orders/${newOrderId}/reserve-stock`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Verify stock was reserved
    const reservedInv = await db.query('SELECT reserved_stock FROM inventory WHERE product_id = $1', [prodId]);
    expect(reservedInv.rows[0].reserved_stock).toBe(initialReserved + 5);

    // Now Cancel the order
    const cancelRes = await request(app)
      .patch(`/api/sales-orders/${newOrderId}/cancel`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verify reserved stock was released back
    const releasedInv = await db.query('SELECT reserved_stock FROM inventory WHERE product_id = $1', [prodId]);
    expect(releasedInv.rows[0].reserved_stock).toBe(initialReserved);
  });

});
