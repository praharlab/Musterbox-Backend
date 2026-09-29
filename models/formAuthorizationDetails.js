const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const formmaster = require('./formMaster');
const usermaster = require('./userMaster');
const authorizationCriteriaMaster = require('./authorizationCriteriaMaster');
const table_name = 'formAuthorizationDetails';
const CompanyMaster = require('./companyMaster');
const FormAuthorizationDetails = sequelize.define(
  table_name,
  {
    AuthorizationDetailsId: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    FormMasterId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    AuthorizedByUserMasterId: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    },
    AuthorizationCriteriaID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    SerialNo: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    FromAmount: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    ToAmount: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    SequenceNo: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    },
    RequiredAuthorizationMessage: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
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
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['FormMasterId'],
      },
      {
        unique: false,
        fields: ['AuthorizedByUserMasterId'],
      },
      {
        unique: false,
        fields: ['AuthorizationCriteriaID'],
      },
    ],
  }
);

FormAuthorizationDetails.belongsTo(formmaster, {
  foreignKey: { name: 'FormMasterId' },
});
FormAuthorizationDetails.belongsTo(authorizationCriteriaMaster, {
  foreignKey: { name: 'AuthorizationCriteriaID' },
});
FormAuthorizationDetails.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

module.exports = FormAuthorizationDetails;
