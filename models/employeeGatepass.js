const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const {
  EmployeeGatepassStatusEnum,
  EmployeeGatepassPurposeEnum,
  DatabaseOperationEnum,
} = require('../utils/dbUtils');
const UserActivity = require('./userActivity');
const { object } = require('@hapi/joi');
const companyMaster = require('./companyMaster');
const EmployeeGatepass = sequelize.define(
  'employeeGatepass',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: Sequelize.TEXT,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    fromTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    toTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM(...Object.values(EmployeeGatepassStatusEnum)),
    },
    purposeFor: {
      type: Sequelize.ENUM(...Object.values(EmployeeGatepassPurposeEnum)),
    },

    authorizationStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultVaule: 0,
    },
    createByIp: {
      type: Sequelize.STRING,
    },

    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
    rejectionRemarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);
EmployeeGatepass.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeGatepass.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeeGatepass.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
EmployeeGatepass.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterId' },
  allowNull: false,
  as: 'employee',
});
EmployeeGatepass.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId', allowNull: false },
});

EmployeeGatepass.addHook('beforeCreate', (employeeGatepass, options) => {
  // Set createdBy, updatedBy, and ipAddress based on the authenticated user
  employeeGatepass.createBy = options.user.userMasterId;
  employeeGatepass.updateBy = options.user.userMasterId;
  employeeGatepass.createByIp = options.user.userIpAddress;
  employeeGatepass.updateByIp = options.user.userIpAddress;
});

EmployeeGatepass.addHook('beforeUpdate', async (employeeGatepass, options) => {
  const oldValue = employeeGatepass.previous();
  const newValue = employeeGatepass.toJSON();
  if (Object.keys(oldValue).length > 0) {
    const trackedData = {
      activityType: DatabaseOperationEnum.UPDATE,
      activityTable: EmployeeGatepass.getTableName(),
      activityTablePK: newValue.id,
      activityDetails: [],
    };
    Object.keys(oldValue).forEach((key) => {
      if (newValue.hasOwnProperty(key)) {
        const newObject = {};
        newObject[`new_${key}`] = newValue[key];
        newObject[`old_${key}`] = oldValue[key];
        trackedData.activityDetails.push(newObject);
      }
    });
    await UserActivity.create(trackedData, {
      userMasterId: options.user.userMasterId,
      transaction: options.transaction,
    });
  }
  // Set updatedBy and ipAddress based on the authenticated user
  employeeGatepass.updateBy = options.user.userMasterId;
  employeeGatepass.updateByIp = options.user.userIpAddress;
});

EmployeeGatepass.addHook('beforeDestroy', (employeeGatepass, options) => {
  // Set deletedBy and ipAddress based on the authenticated user
  employeeGatepass.deleteBy = options.user.userMasterId;
  employeeGatepass.deleteByIp = options.user.userIpAddress;
});

module.exports = EmployeeGatepass;
