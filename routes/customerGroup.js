const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createGroup, getAllGroups, updateGroup, deleteGroup, fetchAllGroups } = require('../controller/customerGroup');

router.get('/', authMiddleware, getAllGroups);
router.get('/all', authMiddleware, fetchAllGroups);
router.post('/', authMiddleware, createGroup);
router.put('/:id', authMiddleware, updateGroup);
router.delete('/:id', authMiddleware, deleteGroup);

module.exports = router;
