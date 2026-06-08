const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskStatus,
} = require('../controller/task');

router.post('/', authMiddleware, createTask);
router.get('/', authMiddleware, getTasks);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.put('/:id/status', authMiddleware, updateTaskStatus);

module.exports = router;
