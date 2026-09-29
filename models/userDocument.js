const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const DocumentList = require('./documentList');
const UserMaster = require('./userMaster');
const table_name = 'userDocument';
const UserDocument = sequelize.define(
  table_name,
  {
    userDocumentID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    document: {
      type: Sequelize.STRING,
      allowNull: true,
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
    verifyStatus: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    verifyBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    rejectionRemarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    documentNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    nameOnDocument: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    expiryDate: {
      type: Sequelize.DATEONLY,
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
        fields: ['documentListID'],
      },
    ],
  }
);

UserDocument.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
UserDocument.belongsTo(DocumentList, {
  foreignKey: { name: 'documentListID' },
});
UserMaster.hasMany(UserDocument, { foreignKey: { name: 'userMasterID' } });

module.exports = UserDocument;
