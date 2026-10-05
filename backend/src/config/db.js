const { Pool } = require('pg');
const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let pool;
let isPgMem = false;
let isInitialized = false;

// Create standard PostgreSQL pool configuration
// Create standard PostgreSQL pool configuration
const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'pern_erp',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

async function initDatabase() {
  if (isInitialized && pool) {
    return pool;
  }

  if (process.env.USE_PG_MEM === 'true') {
    console.log('⚡ Using pg-mem in-memory PostgreSQL database (forced by env)');
    isPgMem = true;
    const dbMem = newDb();
    const memAdapter = dbMem.adapters.createPg();
    pool = new memAdapter.Pool();
    isInitialized = true;
    return pool;
  }

  try {
    const testPool = new Pool(config);
    const client = await testPool.connect();
    client.release();
    console.log('✅ Connected to real PostgreSQL database successfully.');
    pool = testPool;
    isInitialized = true;
    return pool;
  } catch (err) {
    console.warn('⚠️ Real PostgreSQL connection failed (' + err.message + ').');
    console.log('⚡ Falling back to pg-mem in-memory PostgreSQL engine for seamless operation...');
    isPgMem = true;
    const dbMem = newDb();
    const memAdapter = dbMem.adapters.createPg();
    pool = new memAdapter.Pool();
    isInitialized = true;
    return pool;
  }
}

const query = async (text, params) => {
  if (!pool) {
    await initDatabase();
  }
  return pool.query(text, params);
};

const getClient = async () => {
  if (!pool) {
    await initDatabase();
  }
  return pool.connect();
};

module.exports = {
  query,
  getClient,
  initDatabase,
  getPool: () => pool,
  isPgMem: () => isPgMem,
};
