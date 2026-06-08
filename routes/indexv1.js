var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/staff", require("./staff"));
router.use("/users", require("./user"));
router.use("/user-groups", require("./userGroup"));
router.use("/templates", require("./template"));
router.use("/reminders", require("./reminder"));
router.use("/dashboard", require("./dashboard"));
router.use("/task-status", require("./taskStatus"));
router.use("/task-type", require("./taskType"));
router.use("/tasks", require("./task"));

module.exports = router;
