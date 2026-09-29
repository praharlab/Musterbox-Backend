const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const JoiningDocumentType = require('./joiningDocumentType');
const DesignationWiseDocument = require('./designationWiseDocument');
const table_name = 'joiningDocument';

const JoiningDocument = sequelize.define(
  table_name,
  {
    joiningDocumentID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    attachment: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
    },
    fromDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    issueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    expiryDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    identificationNumber: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.BIGINT,
    },
    updateBy: {
      type: Sequelize.BIGINT,
    },
    createByIp: {
      type: Sequelize.STRING,
    },
    updateByIp: {
      type: Sequelize.STRING,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
    deletedAt: {
      type: Sequelize.DATE,
    },
  },
  {
    paranoid: true,
  }
);

JoiningDocument.addHook('beforeCreate', (joiningDocument, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  joiningDocument.createBy = options.user.userMasterId;
  joiningDocument.updateBy = options.user.userMasterId;
  joiningDocument.createByIp = options.user.userIpAddress;
  joiningDocument.updateByIp = options.user.userIpAddress;
});

JoiningDocument.addHook('beforeUpdate', (joiningDocument, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  joiningDocument.updateBy = options.user.userMasterId;
  joiningDocument.ipAddress = options.user.userIpAddress;
  joiningDocument.updateByIp = options.user.userIpAddress;
});

JoiningDocument.addHook('beforeDestroy', (joiningDocument, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  joiningDocument.deleteBy = options.user.userMasterId;
  joiningDocument.deleteByIp = options.user.userIpAddress;
});

JoiningDocument.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
JoiningDocument.belongsTo(JoiningDocumentType, {
  foreignKey: { name: 'joiningDocumentMasterID' },
});
JoiningDocument.belongsTo(DesignationWiseDocument, {
  foreignKey: { name: 'designationWiseDocumentID' },
});

module.exports = JoiningDocument;
