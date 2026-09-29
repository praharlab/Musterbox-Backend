const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'coffMaster';
const HrLeaveTypes = require('./hrLeaveTypes');
const userMaster = require('./userMaster');
const HrLeaveBalance = require('./hrLeaveBalance');
const coffMaster = sequelize.define(
  table_name,
  {
    coffMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    LeaveBalTranId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    LeaveTranId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    LeaveCreatedDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    YearMM: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    LeaveAddNew: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authorizationStatus: {
      type: Sequelize.INTEGER,
      allowNull: true, // 1=> Accept 2=> Pending 0=> Reject
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
    From: {
      type: Sequelize.STRING,
      allowNull: true,
    }
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
      {
        unique: false,
        fields: ['LeaveBalTranId'],
      },
    ],
  }
);
coffMaster.belongsTo(HrLeaveTypes, { foreignKey: { name: 'LeaveTranId' } });
coffMaster.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });

coffMaster.belongsTo(userMaster, {
  as: 'createdByUser',
  foreignKey: { name: 'createBy' },
});
coffMaster.belongsTo(HrLeaveBalance, {
  foreignKey: { name: 'LeaveBalTranId' },
});
userMaster.hasMany(coffMaster, {
  foreignKey: { name: 'userMasterID' },
});


module.exports = coffMaster;
