const app = require('./app');
const { initDbAndSeed } = require('./db/initDb');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Ensure DB tables & seed data are initialized
    await initDbAndSeed();

    app.listen(PORT, () => {
      console.log(`🚀 PERN ERP Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
