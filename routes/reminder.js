var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
const {
  createReminder,
  getReminders,
  getReminderById,
  updateReminder,
  deleteReminder,
} = require("../controller/reminder");

router.use(authMiddleware);

router.post("/", createReminder);
router.get("/", getReminders);
router.get("/:id", getReminderById);
router.put("/:id", updateReminder);
router.delete("/:id", deleteReminder);

module.exports = router;
