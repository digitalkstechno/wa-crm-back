const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createTemplate, getAllTemplates, updateTemplate, deleteTemplate } = require('../controller/template');

router.get('/', authMiddleware, getAllTemplates);
router.post('/', authMiddleware, createTemplate);
router.put('/:id', authMiddleware, updateTemplate);
router.delete('/:id', authMiddleware, deleteTemplate);

module.exports = router;
