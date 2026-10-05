const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, enquiryController.getAllEnquiries);
router.get('/:id', verifyToken, enquiryController.getEnquiryById);
router.post('/', verifyToken, authorizeRoles('SALES_USER', 'ADMIN'), enquiryController.createEnquiry);

module.exports = router;
