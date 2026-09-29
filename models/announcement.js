const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const userMaster = require('./userMaster');
const BranchMaster = require('./branchMaster');
const Designation = require('./designation');
const Department = require('./department');
const table_name = 'announcement';
const Announcement = sequelize.define(
  table_name,
  {
    announcementID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    announcement: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    attachment: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    branchMasterID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    designationId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    departmentId: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    announcementDate: {
      type: Sequelize.DATE,
      allowNull: false,
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['announcement'],
      },
      {
        unique: false,
        fields: ['announcementDate'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Announcement.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
Announcement.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});
Announcement.belongsTo(Designation, { foreignKey: { name: 'designationId' } });
Announcement.belongsTo(Department, { foreignKey: { name: 'departmentId' } });

module.exports = Announcement;
