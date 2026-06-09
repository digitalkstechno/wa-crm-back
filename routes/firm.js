var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require('fs');

const dir = './public/uploads';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

let {
  createFirm,
  fetchAllFirms,
  fetchFirmById,
  firmUpdate,
  firmDelete,
  uploadLogo,
} = require("../controller/firm");

router.post("/create", authMiddleware, createFirm);
router.get("/", authMiddleware, fetchAllFirms);
router.get("/:id", authMiddleware, fetchFirmById);
router.put("/:id", authMiddleware, firmUpdate);
router.delete("/:id", authMiddleware, firmDelete);
router.post("/:id/logo", authMiddleware, upload.single("logo"), uploadLogo);

module.exports = router;
