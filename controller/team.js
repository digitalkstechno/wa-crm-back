const TEAM = require("../model/team");
const { getScopeQuery, assignScopeFields } = require("../utils/scope");

exports.createTeam = async (req, res) => {
  try {
    const { teamName, managerId, teamLeadId, description, status, target } = req.body;
    let teamCode = req.body.teamCode;

    if (!teamCode) {
      const baseCode = teamName ? teamName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'TEM';
      const safeBase = baseCode || 'TEM';
      let uniqueCode = safeBase + Math.floor(1000 + Math.random() * 9000);
      let isUnique = false;
      while (!isUnique) {
        const existing = await TEAM.findOne({ teamCode: uniqueCode });
        if (!existing) {
          isUnique = true;
        } else {
          uniqueCode = safeBase + Math.floor(1000 + Math.random() * 9000);
        }
      }
      teamCode = uniqueCode;
    }

    const teamData = assignScopeFields(req, {
      teamName,
      teamCode,
      managerId: managerId || null,
      teamLeadId: teamLeadId || null,
      description,
      status,
      target
    });

    const teamDetails = await TEAM.create(teamData);

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

    const scope = await getScopeQuery(req, 'Team');
    const query = { ...scope };

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
    const scope = await getScopeQuery(req, 'Team');
    const teamData = await TEAM.findOne({ _id: req.params.id, ...scope });
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
    const scope = await getScopeQuery(req, 'Team');
    const oldTeam = await TEAM.findOne({ _id: teamId, ...scope });
    if (!oldTeam) throw new Error("Team not found");

    const { teamName, teamCode, managerId, teamLeadId, description, status, target } = req.body;
    
    const updateData = {};
    if (teamName !== undefined) updateData.teamName = teamName;
    if (teamCode !== undefined) updateData.teamCode = teamCode;
    if (managerId !== undefined) updateData.managerId = managerId || null;
    if (teamLeadId !== undefined) updateData.teamLeadId = teamLeadId || null;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (target !== undefined) updateData.target = target;

    const updatedTeam = await TEAM.findOneAndUpdate({ _id: teamId, ...scope }, updateData, { new: true });
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
    const scope = await getScopeQuery(req, 'Team');
    const oldTeam = await TEAM.findOne({ _id: req.params.id, ...scope });
    if (!oldTeam) throw new Error("Team not found");
    await TEAM.findOneAndDelete({ _id: req.params.id, ...scope });
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
