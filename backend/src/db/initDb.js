const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function initDbAndSeed() {
  console.log('🔄 Initializing database schema & seed data...');

  // Ensure DB connection initialized
  const pool = await db.initDatabase();

  // Run schema SQL
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await db.query(schemaSql);
  console.log('✅ Schema tables verified/created.');

  // Seed Users
  const adminHash = await bcrypt.hash('admin123', 10);
  const salesHash = await bcrypt.hash('sales123', 10);

  const userCheck = await db.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCheck.rows[0].count, 10) === 0) {
    await db.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES 
       ($1, $2, $3, $4),
       ($5, $6, $7, $8)`,
      [
        'System Admin', 'admin@fundsroom.com', adminHash, 'ADMIN',
        'Sales Manager', 'sales@fundsroom.com', salesHash, 'SALES_USER'
      ]
    );
    console.log('✅ Users seeded (admin@fundsroom.com / sales@fundsroom.com).');
  }

  // Seed Customers
  const customerCheck = await db.query('SELECT COUNT(*) FROM customers');
  if (parseInt(customerCheck.rows[0].count, 10) === 0) {
    await db.query(
      `INSERT INTO customers (name, company_name, email, phone, address) VALUES
       ('John Doe', 'Acme Corp', 'john@acmecorp.com', '+1-555-0192', '123 Tech Park, Suite 100, San Jose, CA'),
       ('Sarah Smith', 'Nexus Logistics', 'sarah@nexuslogistics.com', '+1-555-0481', '456 Industrial Way, Chicago, IL'),
       ('Robert Chen', 'Apex Global Solutions', 'robert@apexglobal.com', '+1-555-0872', '789 Enterprise Blvd, Austin, TX')`
    );
    console.log('✅ Customers seeded.');
  }

  // Seed Products & Inventory (at least 6 products as required)
  const productCheck = await db.query('SELECT COUNT(*) FROM products');
  if (parseInt(productCheck.rows[0].count, 10) === 0) {
    const products = [
      { sku: 'PROD-101', name: 'Industrial Server Rack 42U', description: 'Heavy duty steel enclosure for datacenter servers', unit_price: 1250.00, physical_stock: 50 },
      { sku: 'PROD-102', name: 'Managed Enterprise Switch 48-Port', description: 'Layer 3 Gigabit PoE switch with SFP+ uplinks', unit_price: 850.00, physical_stock: 100 },
      { sku: 'PROD-103', name: 'Fiber Optic Transceiver 10G', description: 'Single-mode LC duplex 10km module', unit_price: 120.00, physical_stock: 300 },
      { sku: 'PROD-104', name: 'UPS Uninterruptible Power Supply 3kVA', description: 'Online double conversion rackmount UPS', unit_price: 980.00, physical_stock: 40 },
      { sku: 'PROD-105', name: 'CAT6A Shielded Ethernet Cable 305m', description: 'Bulk 23AWG solid copper cable spool', unit_price: 210.00, physical_stock: 80 },
      { sku: 'PROD-106', name: 'Enterprise Firewall Gateway', description: 'Next-gen security appliance with 10Gbps throughput', unit_price: 2400.00, physical_stock: 25 },
      { sku: 'PROD-107', name: 'High-Speed SAN Storage Array 24TB', description: 'iSCSI SAS rack storage expansion array', unit_price: 4500.00, physical_stock: 15 }
    ];

    for (const prod of products) {
      const pRes = await db.query(
        `INSERT INTO products (sku, name, description, unit_price) VALUES ($1, $2, $3, $4) RETURNING id`,
        [prod.sku, prod.name, prod.description, prod.unit_price]
      );
      const prodId = pRes.rows[0].id;
      await db.query(
        `INSERT INTO inventory (product_id, physical_stock, reserved_stock) VALUES ($1, $2, 0)`,
        [prodId, prod.physical_stock]
      );
    }
    console.log('✅ Products and Inventory seeded (7 products created).');
  }

  // Seed Initial Demo Enquiry & Quotation if none exist
  const enquiryCheck = await db.query('SELECT COUNT(*) FROM enquiries');
  if (parseInt(enquiryCheck.rows[0].count, 10) === 0) {
    const cust = await db.query('SELECT id FROM customers LIMIT 1');
    const userAdmin = await db.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['SALES_USER']);
    const prods = await db.query('SELECT id, unit_price FROM products LIMIT 2');

    if (cust.rows.length > 0 && prods.rows.length > 0) {
      const cId = cust.rows[0].id;
      const uId = userAdmin.rows[0]?.id || 1;

      // Sample Enquiry 1
      const enq1 = await db.query(
        `INSERT INTO enquiries (enquiry_number, customer_id, status, notes, created_by)
         VALUES ('ENQ-2026-001', $1, 'SUBMITTED', 'Urgent datacenter expansion for Q4 infrastructure setup', $2)
         RETURNING id`,
        [cId, uId]
      );
      await db.query(
        `INSERT INTO enquiry_items (enquiry_id, product_id, quantity, target_price) VALUES
         ($1, $2, 5, $3),
         ($1, $4, 10, $5)`,
        [enq1.rows[0].id, prods.rows[0].id, prods.rows[0].unit_price, prods.rows[1].id, prods.rows[1].unit_price]
      );

      // Sample Enquiry 2 (Quoted)
      const enq2 = await db.query(
        `INSERT INTO enquiries (enquiry_number, customer_id, status, notes, created_by)
         VALUES ('ENQ-2026-002', $1, 'QUOTED', 'Network upgrade package for regional branch office', $2)
         RETURNING id`,
        [cId, uId]
      );
      await db.query(
        `INSERT INTO enquiry_items (enquiry_id, product_id, quantity, target_price) VALUES
         ($1, $2, 2, $3)`,
        [enq2.rows[0].id, prods.rows[0].id, prods.rows[0].unit_price]
      );

      // Sample Quotation
      const quot = await db.query(
        `INSERT INTO quotations (quotation_number, enquiry_id, customer_id, total_amount, status, created_by)
         VALUES ('QTN-2026-001', $1, $2, 2500.00, 'ACCEPTED', $3)
         RETURNING id`,
        [enq2.rows[0].id, cId, uId]
      );
      await db.query(
        `INSERT INTO quotation_items (quotation_id, product_id, quantity, unit_price, line_total) VALUES
         ($1, $2, 2, 1250.00, 2500.00)`,
        [quot.rows[0].id, prods.rows[0].id]
      );

      console.log('✅ Initial demo enquiries and quotations seeded.');
    }
  }

  console.log('🎉 Database seeding complete.');
}

if (require.main === module) {
  initDbAndSeed().then(() => {
    console.log('Done script execution.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}

module.exports = { initDbAndSeed };
