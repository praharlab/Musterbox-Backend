const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const UserRole = require('../models/userRole');
const { sendNotification } = require('../utils/commonUtilFunctions');
const RolePermission = require('../models/rolePermission');
const FormMaster = require('../models/formMaster');
const RoleMaster = require('../models/roleMaster');

async function sendApplicationNotification(
  companyMasterID,
  userName,
  formName,
  title,
  screen,
  notificationType
) {
  const role = await RolePermission.findAll({
    raw: true,
    where: {
      operationID: 4,
    },
    include: [
      {
        model: FormMaster,
        where: { formName },
        attributes: [],
      },
      {
        model: RoleMaster,
        where: {
          companyMasterID: companyMasterID,
        },
        attributes: [],
      },
    ],
    attributes: [
      [Sequelize.col('rolePermission.roleMasterID'), 'roleMasterID'],
    ],
  });

  const allRoleIds = role.map((e) => e.roleMasterID);

  const allUser = await UserRole.findAll({
    raw: true,
    where: {
      roleMasterID: {
        [Sequelize.Op.in]: allRoleIds,
      },
    },
    include: [
      {
        model: UserMaster,
        where: { companyMasterId: companyMasterID, status: 1 },
        attributes: [],
      },
    ],

    attributes: [
      [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
      [Sequelize.col('userMaster.displayName'), 'displayName'],
    ],
  });

  for (let i = 0; i < allUser.length; i++) {
    const message = `Hey ${allUser[i].displayName}!! ${userName} Just Applied For ${notificationType}`;

    const notification = {
      //   title: 'Job Application',
      title,
      body: message,
    };
    const data = {
      screen,
      isScheduled: 'true',
      scheduledTime: new Date().toISOString(),
    };
    await sendNotification(allUser[i].userMasterID, notification, data);
  }
}

module.exports = {
  sendApplicationNotification,
};
