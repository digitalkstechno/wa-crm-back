const TEAM = require("../model/team");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, teamCode, firmId, managerId, teamLeadId, description, status, target } = req.body;

    const teamDetails = await TEAM.create({
      teamName,
      teamCode,
      firmId: firmId || null,
      managerId: managerId || null,
      teamLeadId: teamLeadId || null,
      description,
      status,
      target
    });

    return res.status(201).json({
      status: "Success",
      message: "Team created successfully",
      data: teamDetails,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchAllTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const query = {};

    const totalTeams = await TEAM.countDocuments(query);
    const teamsData = await TEAM.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: "Success",
      message: "Teams fetched successfully",
      pagination: {
        totalRecords: totalTeams,
        currentPage: page,
        totalPages: Math.ceil(totalTeams / limit),
        limit,
      },
      data: teamsData,
    });
  } catch (error) {
    return res.status(500).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.fetchTeamById = async (req, res) => {
  try {
    const teamData = await TEAM.findById(req.params.id);
    if (!teamData) throw new Error("Team not found");
    return res.status(200).json({
      status: "Success",
      message: "Team fetched successfully",
      data: teamData,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.teamUpdate = async (req, res) => {
  try {
    const teamId = req.params.id;
    const oldTeam = await TEAM.findById(teamId);
    if (!oldTeam) throw new Error("Team not found");

    const { teamName, teamCode, firmId, managerId, teamLeadId, description, status, target } = req.body;
    
    const updateData = {};
    if (teamName !== undefined) updateData.teamName = teamName;
    if (teamCode !== undefined) updateData.teamCode = teamCode;
    if (firmId !== undefined) updateData.firmId = firmId || null;
    if (managerId !== undefined) updateData.managerId = managerId || null;
    if (teamLeadId !== undefined) updateData.teamLeadId = teamLeadId || null;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (target !== undefined) updateData.target = target;

    const updatedTeam = await TEAM.findByIdAndUpdate(teamId, updateData, { new: true });
    return res.status(200).json({
      status: "Success",
      message: "Team updated successfully",
      data: updatedTeam,
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};

exports.teamDelete = async (req, res) => {
  try {
    const oldTeam = await TEAM.findById(req.params.id);
    if (!oldTeam) throw new Error("Team not found");
    await TEAM.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      status: "Success",
      message: "Team deleted successfully",
    });
  } catch (error) {
    return res.status(404).json({
      status: "Fail",
      message: error.message,
    });
  }
};
