const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const EmployeeGatepass = require('./employeeGatepass');
const UserActivity = require('./userActivity');
const {
  EmployeeGatepassCheckStatusEnum,
  DatabaseOperationEnum,
} = require('../utils/dbUtils');

const EmployeeGatepassCheckInOut = sequelize.define(
  'employeeGatepassCheckInOut',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    attachment: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    time: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    address: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ' ',
    },
    type: {
      type: Sequelize.ENUM(...Object.values(EmployeeGatepassCheckStatusEnum)),
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
  },
  { paranoid: true }
);
EmployeeGatepassCheckInOut.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeGatepassCheckInOut.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeeGatepassCheckInOut.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
EmployeeGatepassCheckInOut.belongsTo(EmployeeGatepass, {
  foreignKey: { name: 'employeeGatepassId' },
});
EmployeeGatepass.hasMany(EmployeeGatepassCheckInOut);
EmployeeGatepassCheckInOut.addHook(
  'beforeCreate',
  (EmployeeGatepassCheckInOut, options) => {
    EmployeeGatepassCheckInOut.createBy = options.user.userMasterId;
    EmployeeGatepassCheckInOut.updateBy = options.user.userMasterId;
    EmployeeGatepassCheckInOut.createByIp = options.user.userIpAddress;
    EmployeeGatepassCheckInOut.updateByIp = options.user.userIpAddress;
  }
);

EmployeeGatepassCheckInOut.addHook(
  'beforeUpdate',
  (EmployeeGatepassCheckInOut, options) => {
    EmployeeGatepassCheckInOut.updateBy = options.user.userMasterId;
    EmployeeGatepassCheckInOut.updateByIp = options.user.userIpAddress;
  }
);

EmployeeGatepassCheckInOut.addHook(
  'beforeDestroy',
  (EmployeeGatepassCheckInOut, options) => {
    EmployeeGatepassCheckInOut.deleteBy = options.user.userMasterId;
    EmployeeGatepassCheckInOut.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = EmployeeGatepassCheckInOut;
