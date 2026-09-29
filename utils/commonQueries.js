const companyMaster = require('../models/companyMaster');
const UserActivity = require('../models/userActivity');

const fetchChildCompanies = async (companyMasterId) => {
  const childCompanyLists = await companyMaster.findAll({
    where: { parentCompanyMasterID: companyMasterId, status: 1 },
    attributes: ['companyMasterID'],
    raw: true,
  });
  return childCompanyLists.map((child) => child.companyMasterID);
};

const logUserActivity = async (
  activityType,
  activityTable,
  activityDetails
) => {
  await UserActivity.create({
    activityType,
    activityTable,
    activityDetails,
  });
};

module.exports = { fetchChildCompanies, logUserActivity };
