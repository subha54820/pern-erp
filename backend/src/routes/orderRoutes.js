const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, orderController.getAllOrders);
router.get('/:id', verifyToken, orderController.getOrderById);

// SALES USER: Convert Accepted Quotation into Sales Order
router.post('/from-quotation/:quotationId', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), orderController.createOrderFromQuotation);

// ADMIN: Confirm Sales Order
// ADMIN & SALES USER: Cancel Sales Order
router.patch('/:id/cancel', verifyToken, authorizeRoles('ADMIN', 'SALES_USER'), orderController.cancelOrder);
router.patch('/:id/status', verifyToken, authorizeRoles('ADMIN', 'SALES_USER'), (req, res) => {
  if (req.body.status === 'CONFIRMED') {
    return orderController.confirmOrder(req, res);
  }
  if (req.body.status === 'CANCELLED') {
    return orderController.cancelOrder(req, res);
  }
  res.status(400).json({ success: false, message: 'Invalid order status transition.' });
});

// ADMIN: Reserve Inventory for Sales Order
router.post('/:id/reserve', verifyToken, authorizeRoles('ADMIN'), orderController.reserveInventory);
router.post('/:id/reserve-stock', verifyToken, authorizeRoles('ADMIN'), orderController.reserveInventory);

module.exports = router;
