const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const usermaster = require('./userMaster');
const ResignProcess = require('./resignProcess');

const table_name = 'resignTask';
const ResignationTask = sequelize.define(table_name, {
  resignTaskID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  resignProcessID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  // isMandatory: {
  //   type: Sequelize.STRING,
  //   allowNull: true,
  // },
  // attachment: {
  //   type: Sequelize.STRING,
  //   allowNull: true,
  // },
  status: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
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
});

ResignationTask.belongsTo(usermaster, { foreignKey: { name: 'userMasterID' } });
ResignationTask.belongsTo(ResignProcess, {
  foreignKey: { name: 'resignProcessID' },
});
ResignProcess.hasMany(ResignationTask, {
  foreignKey: { name: 'resignProcessID' },
});

module.exports = ResignationTask;
