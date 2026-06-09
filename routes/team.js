var express = require("express");
var router = express.Router();
const authMiddleware = require("../middleware/auth");
let {
  createTeam,
  fetchAllTeams,
  fetchTeamById,
  teamUpdate,
  teamDelete,
} = require("../controller/team");

router.post("/create", authMiddleware, createTeam);
router.get("/", authMiddleware, fetchAllTeams);
router.get("/:id", authMiddleware, fetchTeamById);
router.put("/:id", authMiddleware, teamUpdate);
router.delete("/:id", authMiddleware, teamDelete);

module.exports = router;
