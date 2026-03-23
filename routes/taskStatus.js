const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStatuses, createStatus, updateStatus, deleteStatus, reorderStatuses } = require('../controller/taskStatus');

router.use(auth);

router.get('/', getStatuses);
router.post('/', createStatus);
router.put('/reorder', reorderStatuses);
router.put('/:id', updateStatus);
router.delete('/:id', deleteStatus);

module.exports = router;
