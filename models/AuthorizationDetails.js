const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const authmaster = require('./authorizationMaster');
const authorizationCriteriaMaster = require('./authorizationCriteriaMaster');
const table_name = 'authorizationDetails';
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const FormAuthorizationDetails = sequelize.define(
  table_name,
  {
    AuthorizationDetailsId: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    AuthorizationMasterID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    userMasterID: {
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
        fields: ['AuthorizationMasterID'],
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

FormAuthorizationDetails.belongsTo(authmaster, {
  foreignKey: { name: 'AuthorizationMasterID' },
});
FormAuthorizationDetails.belongsTo(authorizationCriteriaMaster, {
  foreignKey: { name: 'AuthorizationCriteriaID' },
});
FormAuthorizationDetails.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
FormAuthorizationDetails.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(FormAuthorizationDetails, {
  foreignKey: { name: 'userMasterID' },
});

FormAuthorizationDetails.belongsTo(UserMaster,{
  as: "createdByUserDetails",
  foreignKey: {name: 'createBy'}
});

FormAuthorizationDetails.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'},
});

module.exports = FormAuthorizationDetails;
