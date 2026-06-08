const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createStatus,
  getStatuses,
  updateStatus,
  deleteStatus,
  reorderStatuses,
} = require('../controller/taskStatus');

router.post('/', authMiddleware, createStatus);
router.get('/', authMiddleware, getStatuses);
router.put('/reorder', authMiddleware, reorderStatuses);
router.put('/:id', authMiddleware, updateStatus);
router.delete('/:id', authMiddleware, deleteStatus);

module.exports = router;
