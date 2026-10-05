const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, inventoryController.getInventory);
router.put('/:productId', verifyToken, authorizeRoles('ADMIN'), inventoryController.updatePhysicalStock);

module.exports = router;
