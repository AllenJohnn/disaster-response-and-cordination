const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

// Citizens push requests; Admins can fetch all requests
router.post('/', protect(['Citizen']), requestController.submitRequest);
router.get('/', protect(['Admin']), requestController.getAllRequests);

module.exports = router;