const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const tdsSubSection = require('./tdsSubSection');
const table_name = 'employeeDeclaration';

const employeeDeclaration = sequelize.define(
  table_name,
  {
    employeeDeclarationID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    assessmentYear: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    declarationAmount: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    attachments: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
    },
    acceptRejectRemark: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authStatus: {
      //0-pending 1-accepted 2-rejected
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deleteBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  { paranoid: true }
);

employeeDeclaration.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});
employeeDeclaration.belongsTo(tdsSubSection, {
  foreignKey: { name: 'tdsSubSectionID' },
});

employeeDeclaration.addHook('beforeCreate', (declaration, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  declaration.createBy = options.user.userMasterId;
  declaration.updateBy = options.user.userMasterId;
  declaration.createByIp = options.user.userIpAddress;
  declaration.updateByIp = options.user.userIpAddress;
});

employeeDeclaration.addHook('beforeUpdate', (declaration, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  declaration.updateBy = options.user.userMasterId;
  declaration.updateByIp = options.user.userIpAddress;
});

employeeDeclaration.addHook('beforeDestroy', (declaration, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  declaration.deleteBy = options.user.userMasterId;
  declaration.deleteByIp = options.user.userIpAddress;
});

module.exports = employeeDeclaration;
