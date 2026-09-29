const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'hrLeaveBalance';
const HrLeaveTypes = require('./hrLeaveTypes');
const userMaster = require('./userMaster');
const HrLeaveBalance = sequelize.define(
  table_name,
  {
    LeaveBalTranId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    LeaveTranId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    YearMM: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    LeaveAddNew: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    OPBal: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    LeaveInCash: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['LeaveTranId'],
      },
    ],
  }
);
HrLeaveBalance.belongsTo(HrLeaveTypes, { foreignKey: { name: 'LeaveTranId' } });
HrLeaveBalance.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

userMaster.hasMany(HrLeaveBalance, { foreignKey: { name: 'userMasterID' } });
HrLeaveBalance.belongsTo(userMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});
HrLeaveBalance.belongsTo(userMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});
module.exports = HrLeaveBalance;
