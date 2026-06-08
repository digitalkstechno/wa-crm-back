const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createUser, getAllUsers, updateUser, deleteUser, exportExcel } = require('../controller/user');
 
router.get('/', authMiddleware, getAllUsers);
router.get('/export-excel', authMiddleware, exportExcel);
router.post('/', authMiddleware, createUser);
router.put('/:id', authMiddleware, updateUser);
router.delete('/:id', authMiddleware, deleteUser);

module.exports = router;
