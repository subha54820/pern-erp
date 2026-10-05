const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const orderController = require('../controllers/orderController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, quotationController.getAllQuotations);
router.get('/:id', verifyToken, quotationController.getQuotationById);
router.post('/', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), quotationController.createQuotation);
router.patch('/:id/accept', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), quotationController.acceptQuotation);
router.patch('/:id/reject', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), quotationController.rejectQuotation);

// Helper route to handle PATCH /:id/status { status: 'ACCEPTED' | 'REJECTED' }
router.patch('/:id/status', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), async (req, res) => {
  if (req.body.status === 'ACCEPTED') {
    return quotationController.acceptQuotation(req, res);
  } else if (req.body.status === 'REJECTED') {
    return quotationController.rejectQuotation(req, res);
  }
  res.status(400).json({ success: false, message: 'Invalid quotation status.' });
});

// Helper alias for converting to order directly from quotation endpoint
router.post('/:quotationId/convert-to-order', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), orderController.createOrderFromQuotation);

module.exports = router;
