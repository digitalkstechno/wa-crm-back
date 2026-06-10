const STAFF = require('../model/staff');
const TEAM = require('../model/team');

async function getSubordinateStaffIds(staffId) {
  const staffIds = [staffId];
  
  // Find teams managed by this manager/lead
  const teams = await TEAM.find({
    $or: [
      { managerId: staffId },
      { teamLeadId: staffId }
    ]
  }).select('_id');
  const teamIds = teams.map(t => t._id);

  // Find staff members reporting directly or in those teams
  const directReports = await STAFF.find({
    $or: [
      { managerId: staffId },
      { parentId: staffId },
      { teamId: { $in: teamIds } }
    ]
  }).select('_id');

  for (const report of directReports) {
    if (!staffIds.some(id => id.toString() === report._id.toString())) {
      staffIds.push(report._id);
    }
  }

  // Look one level deeper
  const level2Reports = await STAFF.find({
    $or: [
      { managerId: { $in: staffIds } },
      { parentId: { $in: staffIds } }
    ]
  }).select('_id');

  for (const report of level2Reports) {
    if (!staffIds.some(id => id.toString() === report._id.toString())) {
      staffIds.push(report._id);
    }
  }

  return staffIds;
}

async function getScopeQuery(req, modelName) {
  const staff = req.staff;
  if (!staff) return {};

  const query = {};

  // Determine Firm ID
  let activeFirmId = null;
  if (staff.roleType === 'Super Admin') {
    activeFirmId = req.headers['x-firm-id'] || req.query.firmId || null;
  } else {
    activeFirmId = staff.firmId;
  }

  if (activeFirmId) {
    query.firmId = activeFirmId;
  } else if (staff.roleType !== 'Super Admin') {
    // If not super admin and no firm ID associated, restrict completely
    query.firmId = null;
  }

  // Shared configurations: only firm isolation, no hierarchy filters
  const configModels = ['CustomerGroup', 'TaskStatus', 'TaskType'];
  if (configModels.includes(modelName)) {
    return query;
  }

  // Team model scoping
  if (modelName === 'Team') {
    if (staff.roleType === 'Super Admin') {
      return query;
    } else if (staff.roleType === 'Admin') {
      return query;
    } else if (staff.roleType === 'Manager') {
      query.$or = [
        { managerId: staff._id },
        { teamLeadId: staff._id }
      ];
      return query;
    } else if (staff.roleType === 'Member') {
      query._id = staff.teamId || null;
      return query;
    }
  }

  // Hierarchy rules for Customer, Task, Reminder, Template
  if (staff.roleType === 'Super Admin') {
    return query;
  } else if (staff.roleType === 'Admin') {
    return query;
  } else if (staff.roleType === 'Manager') {
    const allowedStaffIds = await getSubordinateStaffIds(staff._id);
    query.$or = [
      { assignedTo: { $in: allowedStaffIds } },
      { createdBy: { $in: allowedStaffIds } }
    ];
    return query;
  } else if (staff.roleType === 'Member') {
    query.$or = [
      { assignedTo: staff._id },
      { createdBy: staff._id }
    ];
    return query;
  }

  return query;
}

async function getStaffScopeQuery(req) {
  const staff = req.staff;
  if (!staff) return {};

  const query = {};

  // Firm filter
  let activeFirmId = null;
  if (staff.roleType === 'Super Admin') {
    activeFirmId = req.headers['x-firm-id'] || req.query.firmId || null;
  } else {
    activeFirmId = staff.firmId;
  }

  if (activeFirmId) {
    query.firmId = activeFirmId;
  } else if (staff.roleType !== 'Super Admin') {
    query.firmId = null;
  }

  // Hierarchy filter
  if (staff.roleType === 'Super Admin') {
    return query;
  } else if (staff.roleType === 'Admin') {
    return query;
  } else if (staff.roleType === 'Manager') {
    const subordinateIds = await getSubordinateStaffIds(staff._id);
    query._id = { $in: subordinateIds };
    return query;
  } else if (staff.roleType === 'Member') {
    query._id = staff._id;
    return query;
  }

  return query;
}

function assignScopeFields(req, bodyObj) {
  const staff = req.staff;
  if (!staff) return bodyObj;

  // Set createdBy
  if (!bodyObj.createdBy) {
    bodyObj.createdBy = staff._id;
  }

  // Set firmId
  if (staff.roleType === 'Super Admin') {
    const headerFirmId = req.headers['x-firm-id'] || req.query.firmId;
    if (headerFirmId) {
      bodyObj.firmId = headerFirmId;
    }
  } else {
    bodyObj.firmId = staff.firmId;
  }

  return bodyObj;
}

module.exports = {
  getScopeQuery,
  getStaffScopeQuery,
  getSubordinateStaffIds,
  assignScopeFields
};
