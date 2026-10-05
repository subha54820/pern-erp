const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, productController.getAllProducts);
router.post('/', verifyToken, authorizeRoles('ADMIN'), productController.createProduct);

module.exports = router;
