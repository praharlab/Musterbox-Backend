const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const HrLeaveTypes = require('./hrLeaveTypes');
const UserMaster = require('./userMaster');

const UserLeaveLapse = sequelize.define('userLeaveLapse', {
  UserLeaveLapseID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },

  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  LeaveTranId: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },

  LapseDays: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  LapseYearMonth: {
    type: Sequelize.TEXT,
    allowNull: false,
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
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultVaule: 1,
  },
});

UserLeaveLapse.belongsTo(HrLeaveTypes, { foreignKey: { name: 'LeaveTranId' } });
UserLeaveLapse.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
UserLeaveLapse.belongsTo(UserMaster, {
  as: "createByUser",
  foreignKey: { name: "createBy" },
});
UserLeaveLapse.belongsTo(UserMaster, {
  as: "updateByUser",
  foreignKey: { name: "updateBy" },
});
module.exports = UserLeaveLapse;
