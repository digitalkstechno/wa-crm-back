var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
let {
  createFirm,
  fetchAllFirms,
  fetchFirmById,
  firmUpdate,
  firmDelete,
} = require("../controller/firm");

router.post("/create", authMiddleware, createFirm);
router.get("/", authMiddleware, fetchAllFirms);
router.get("/:id", authMiddleware, fetchFirmById);
router.put("/:id", authMiddleware, firmUpdate);
router.delete("/:id", authMiddleware, firmDelete);

module.exports = router;
