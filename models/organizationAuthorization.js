const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const authorizationCriteriaMaster = require('./authorizationCriteriaMaster');
const table_name = 'organizationAuthorization';
const OrgAuthorizationType = require('./orgAuthorizationType');
const BranchMaster = require('./branchMaster');
const UserMaster = require('./userMaster');
const Site = require('./site');
const OrganizationAuthorization = sequelize.define(
  table_name,
  {
    organizationAuthorizationID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    orgAuthorizationTypeID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    branchMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    siteID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    AuthorizedByUserMasterId: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
    },
    AuthorizationCriteriaID: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    SequenceNo: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
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
    deleteBy: {
      type: Sequelize.BIGINT,
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
  {
    paranoid: true,
    indexes: [
      {
        unique: false,
        fields: ['orgAuthorizationTypeID'],
      },

      {
        unique: false,
        fields: ['AuthorizationCriteriaID'],
      },
    ],
  }
);
OrganizationAuthorization.addHook(
  'beforeCreate',
  (organizationAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    organizationAuthorization.createBy = options.user.userMasterId;
    organizationAuthorization.createByIp = options.user.userIpAddress;
  }
);

OrganizationAuthorization.addHook(
  'beforeUpdate',
  (organizationAuthorization, options) => {
    organizationAuthorization.updateBy = options.user.userMasterId;
    organizationAuthorization.updateByIp = options.user.userIpAddress;
  }
);

OrganizationAuthorization.addHook(
  'beforeDestroy',
  (organizationAuthorization, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    organizationAuthorization.deleteBy = options.user.userMasterId;
    organizationAuthorization.deleteByIp = options.user.userIpAddress;
  }
);

OrganizationAuthorization.belongsTo(OrgAuthorizationType, {
  foreignKey: { name: 'orgAuthorizationTypeID' },
});
OrganizationAuthorization.belongsTo(authorizationCriteriaMaster, {
  foreignKey: { name: 'AuthorizationCriteriaID' },
});
OrganizationAuthorization.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});
OrganizationAuthorization.belongsTo(Site, {
  foreignKey: { name: 'siteID' },
});
OrganizationAuthorization.belongsTo(UserMaster, {
  as: 'createdBy',
  foreignKey: { name: 'createBy' },
});
OrganizationAuthorization.belongsTo(UserMaster, {
  as: 'updatedBy',
  foreignKey: { name: 'updateBy' },
});
OrganizationAuthorization.belongsTo(UserMaster, {
  as: 'deletedBy',
  foreignKey: { name: 'updateBy' },
});

module.exports = OrganizationAuthorization;
