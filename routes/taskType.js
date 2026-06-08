const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createType,
  getTypes,
  updateType,
  deleteType,
} = require('../controller/taskType');

router.post('/', authMiddleware, createType);
router.get('/', authMiddleware, getTypes);
router.put('/:id', authMiddleware, updateType);
router.delete('/:id', authMiddleware, deleteType);

module.exports = router;
