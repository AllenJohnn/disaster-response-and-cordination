const EmergencyRequest = require('../models/EmergencyRequest');
const EmergencyAnalysis = require('../models/EmergencyAnalysis');
const Assignment = require('../models/Assignment');

// 1. UPDATE PRIORITY AND STATUS (HUMAN INTERVENTION GATE)
exports.verifyAndVerifyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { manualPriority, status } = req.body;

    const request = await EmergencyRequest.findByPk(id, { include: [EmergencyAnalysis] });
    if (!request) return res.status(404).json({ message: 'Emergency request not found.' });

    // Update status or override original values
    if (status) request.status = status;
    await request.save();

    if (manualPriority && request.EmergencyAnalysis) {
      request.EmergencyAnalysis.priority = manualPriority;
      // Mark as reviewed since a human just interacted with it
      request.EmergencyAnalysis.requires_human_review = false;
      await request.EmergencyAnalysis.save();
    }

    res.json({ message: 'Request status updated via manual control override.', request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to complete human validation override.', error: error.message });
  }
};

// 2. DISPATCH RESPONDER TARGET MATRIX
exports.assignResponder = async (req, res) => {
  try {
    const { request_id, responder_id, department } = req.body;

    const newAssignment = await Assignment.create({
      request_id,
      responder_id,
      department,
      status: 'Assigned'
    });

    // Automatically transition the main request profile tracking state
    await EmergencyRequest.update({ status: 'Assigned' }, { where: { id: request_id } });

    res.status(201).json({ message: 'Responder dispatch vector locked and sent successfully.', newAssignment });
  } catch (error) {
    res.status(500).json({ message: 'Dispatch configuration failed.', error: error.message });
  }
};