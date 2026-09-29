const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyDocumentType = require('./companyDocumentType');
const userMaster = require('./userMaster');
const table_name = 'companyDocument';
const CompanyDocument = sequelize.define(
  table_name,
  {
    companyDocumentID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    document: {
      type: Sequelize.STRING,
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
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['companyDocumentTypeID'],
      },
    ],
  }
);

CompanyDocument.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
CompanyDocument.belongsTo(CompanyDocumentType, {
  as: 'documentType',
  foreignKey: { name: 'companyDocumentTypeID' },
});

userMaster.hasMany(CompanyDocument, { foreignKey: { name: 'userMasterID' } });

module.exports = CompanyDocument;
