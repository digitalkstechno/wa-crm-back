var express = require("express");
var router = express.Router();

router.use("/health", require("./health"));
router.use("/staff", require("./staff"));
router.use("/customers", require("./customer"));
router.use("/customer-groups", require("./customerGroup"));
router.use("/templates", require("./template"));
router.use("/reminders", require("./reminder"));

module.exports = router;
