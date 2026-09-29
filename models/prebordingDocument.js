const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const JoiningDocumentType = require('./joiningDocumentType');
const DesignationWiseDocument = require('./designationWiseDocument');
const Preboarding = require('./preboarding');
const table_name = 'prebordingDocument';

const PrebordingDocument = sequelize.define(
  table_name,
  {
    prebordingDocID: {
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
    isVerify: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, //{0 : Pending, 1: Verify, 2: Rejected}
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

PrebordingDocument.belongsTo(Preboarding, {
  foreignKey: { name: 'preboardingID' },
});
PrebordingDocument.belongsTo(JoiningDocumentType, {
  foreignKey: { name: 'joiningDocumentMasterID' },
});
PrebordingDocument.belongsTo(DesignationWiseDocument, {
  foreignKey: { name: 'designationWiseDocumentID' },
});
Preboarding.hasMany(PrebordingDocument, {
  foreignKey: { name: 'preboardingID' },
});

module.exports = PrebordingDocument;
