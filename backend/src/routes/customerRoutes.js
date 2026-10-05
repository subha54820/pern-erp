const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, customerController.getAllCustomers);
router.post('/', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), customerController.createCustomer);

module.exports = router;
