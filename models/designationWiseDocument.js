const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const JoiningDocumentType = require('./joiningDocumentType');
const Designation = require('./designation');
const table_name = 'designationWiseDocument';
const { requiredUserTypeEnum } = require('../utils/dbUtils');
const DesignationWiseDocument = sequelize.define(
  table_name,
  {
    designationWiseDocumentID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    isRequired: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requiredUserType: {
      type: Sequelize.ENUM(...Object.values(requiredUserTypeEnum)),
      defaultValue: requiredUserTypeEnum.National,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createBy: {
      type: Sequelize.INTEGER,
    },
    updateBy: {
      type: Sequelize.INTEGER,
    },
    deleteBy: {
      type: Sequelize.INTEGER,
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

DesignationWiseDocument.addHook(
  'beforeCreate',
  (designationWiseDocument, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    designationWiseDocument.createBy = options.user.userMasterId;
    designationWiseDocument.createByIp = options.user.userIpAddress;
  }
);

DesignationWiseDocument.addHook(
  'beforeUpdate',
  (designationWiseDocument, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    designationWiseDocument.updateBy = options.user.userMasterId;
    designationWiseDocument.updateByIp = options.user.userIpAddress;
  }
);

DesignationWiseDocument.addHook(
  'beforeDestroy',
  (designationWiseDocument, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    designationWiseDocument.deleteBy = options.user.userMasterId;
    designationWiseDocument.deleteByIp = options.user.userIpAddress;
  }
);

DesignationWiseDocument.addHook(
  'beforeBulkCreate',
  (designationWiseDocument, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    designationWiseDocument.forEach((answer) => {
      answer.createBy = options.user.userMasterId;
      answer.createByIp = options.user.userIpAddress;
    });
  }
);

DesignationWiseDocument.belongsTo(JoiningDocumentType, {
  foreignKey: { name: 'joiningDocumentMasterID' },
});
DesignationWiseDocument.belongsTo(Designation, {
  foreignKey: { name: 'designationId' },
});

module.exports = DesignationWiseDocument;
