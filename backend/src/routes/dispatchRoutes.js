const express = require('express');
const router = express.Router();
const dispatchController = require('../controllers/dispatchController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

router.get('/', verifyToken, dispatchController.getAllDispatches);

// ADMIN: Process Dispatch (Deducts Physical and Reserved Stock)
router.post('/', verifyToken, authorizeRoles('ADMIN'), dispatchController.processDispatch);

module.exports = router;
