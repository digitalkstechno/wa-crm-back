const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createCustomer, getAllCustomers, updateCustomer, deleteCustomer, exportExcel } = require('../controller/customer');
 
router.get('/', authMiddleware, getAllCustomers);
router.get('/export-excel', authMiddleware, exportExcel);
router.post('/', authMiddleware, createCustomer);
router.put('/:id', authMiddleware, updateCustomer);
router.delete('/:id', authMiddleware, deleteCustomer);

module.exports = router;
