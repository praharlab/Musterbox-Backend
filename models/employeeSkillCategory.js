const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const table_name = 'employeeSkillCategory';
const { SkillCategoryType } = require('../utils/dbUtils');
const EmployeeSkillCategory = sequelize.define(
  table_name,
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    skillCategory: {
      type: Sequelize.ENUM(...Object.values(SkillCategoryType)),
    },
    applicableYYYYMM: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    endYYYYMM: {
      type: Sequelize.INTEGER,
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
  { paranoid: true }
);

EmployeeSkillCategory.addHook(
  'beforeCreate',
  (EmployeeSkillCategory, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    EmployeeSkillCategory.createBy = options.user.userMasterId;
    EmployeeSkillCategory.updateBy = options.user.userMasterId;
    EmployeeSkillCategory.createByIp = options.user.userIpAddress;
    EmployeeSkillCategory.updateByIp = options.user.userIpAddress;
  }
);

EmployeeSkillCategory.addHook(
  'beforeUpdate',
  (EmployeeSkillCategory, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    EmployeeSkillCategory.updateBy = options.user.userMasterId;
    EmployeeSkillCategory.updateByIp = options.user.userIpAddress;
  }
);

EmployeeSkillCategory.addHook(
  'beforeDestroy',
  (EmployeeSkillCategory, options) => {
    EmployeeSkillCategory.deleteBy = options.user.userMasterId;
    EmployeeSkillCategory.deleteByIp = options.user.userIpAddress;
  }
);

EmployeeSkillCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
  as: 'employee',
});

EmployeeSkillCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeSkillCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});

EmployeeSkillCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

UserMaster.hasMany(EmployeeSkillCategory, {
  foreignKey: { name: 'userMasterID' },
});

module.exports = EmployeeSkillCategory;
