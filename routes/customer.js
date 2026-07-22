const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createCustomer, getAllCustomers, updateCustomer, deleteCustomer, exportExcel, assignGroup, bulkDeleteCustomers } = require('../controller/customer');
 
router.get('/', authMiddleware, getAllCustomers);
router.get('/export-excel', authMiddleware, exportExcel);
router.post('/assign-group', authMiddleware, assignGroup);
router.post('/bulk-delete', authMiddleware, bulkDeleteCustomers);
router.post('/', authMiddleware, createCustomer);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;
