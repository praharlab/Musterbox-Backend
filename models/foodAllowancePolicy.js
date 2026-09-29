const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const {
  FoodAllowanceTypeEnum,
  TeaAllowanceTypeEnum,
} = require('../utils/dbUtils');

const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const FoodAllowancePolicy = sequelize.define(
  'foodAllowancePolicy',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    foodAllowancePolicyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    foodAllowanceType: {
      type: Sequelize.ENUM(...Object.values(FoodAllowanceTypeEnum)),
    },
    foodAllowanceOnBasisOfInTime: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    foodAllowanceOnBasisOfOutTime: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    foodAllowanceCompleteHours: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    minimumWorkingMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    workingTimeAmount: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    teaAllowanceType: {
      type: Sequelize.ENUM(...Object.values(TeaAllowanceTypeEnum)),
    },

    teaHalfDayAmount: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },

    teaFullDayAmount: {
      type: Sequelize.INTEGER,
      allowNull: true,
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

FoodAllowancePolicy.addHook('beforeCreate', (foodAllowancePolicy, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  foodAllowancePolicy.createBy = options.user.userMasterId;
  foodAllowancePolicy.updateBy = options.user.userMasterId;
  foodAllowancePolicy.createByIp = options.user.userIpAddress;
  foodAllowancePolicy.updateByIp = options.user.userIpAddress;
});

FoodAllowancePolicy.addHook('beforeUpdate', (foodAllowancePolicy, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  foodAllowancePolicy.updateBy = options.user.userMasterId;
  foodAllowancePolicy.ipAddress = options.user.userIpAddress;
  foodAllowancePolicy.updateByIp = options.user.userIpAddress;
});

FoodAllowancePolicy.addHook('beforeDestroy', (foodAllowancePolicy, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  foodAllowancePolicy.deleteBy = options.user.userMasterId;
  foodAllowancePolicy.deleteByIp = options.user.userIpAddress;
});

FoodAllowancePolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

FoodAllowancePolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' }
});


FoodAllowancePolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' }
});

FoodAllowancePolicy.belongsTo(UserMaster,
  {
    as: 'deletedByUserDetails',
    foreignKey: { name: 'deleteBy' }
  }
);

module.exports = FoodAllowancePolicy;
