const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Enforce strict Admin-only validation barriers
router.put('/requests/:id/verify', protect(['Admin']), adminController.verifyAndVerifyRequest);
router.post('/assignments', protect(['Admin']), adminController.assignResponder);

module.exports = router;