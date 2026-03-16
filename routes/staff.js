var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
let {
  createStaff,
  loginStaff,
  fetchAllStaffs,
  fetchStaffById,
  staffUpdate,
  staffDelete,
  getCurrentStaff,
} = require("../controller/staff");

router.post("/login", loginStaff);
router.post("/create", authMiddleware, createStaff);
router.get("/me", authMiddleware, getCurrentStaff);
router.get("/", authMiddleware, fetchAllStaffs);
router.get("/:id", authMiddleware, fetchStaffById);
router.put("/:id", authMiddleware, staffUpdate);
router.delete("/:id", authMiddleware, staffDelete);
module.exports = router;
