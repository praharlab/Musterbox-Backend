const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const FoodAllowancePolicy = require('./foodAllowancePolicy');
const Shift = require('./shift');

const { AllowanceTypeEnum } = require('../utils/dbUtils');

const FoodAllowancePolicyDetails = sequelize.define(
  'foodAllowancePolicyDetails',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    allowanceType: {
      type: Sequelize.ENUM(...Object.values(AllowanceTypeEnum)),
    },
    foodAllowanceType: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    foodAllowanceTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    foodAllowanceAmount: {
      type: Sequelize.INTEGER,
      allowNull: false,
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

FoodAllowancePolicyDetails.addHook(
  'beforeCreate',
  (foodAllowancePolicyDetails, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    foodAllowancePolicyDetails.createBy = options.user.userMasterId;
    foodAllowancePolicyDetails.updateBy = options.user.userMasterId;
    foodAllowancePolicyDetails.createByIp = options.user.userIpAddress;
    foodAllowancePolicyDetails.updateByIp = options.user.userIpAddress;
  }
);

FoodAllowancePolicyDetails.addHook(
  'beforeUpdate',
  (foodAllowancePolicyDetails, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    foodAllowancePolicyDetails.updateBy = options.user.userMasterId;
    foodAllowancePolicyDetails.ipAddress = options.user.userIpAddress;
    foodAllowancePolicyDetails.updateByIp = options.user.userIpAddress;
  }
);

FoodAllowancePolicyDetails.addHook(
  'beforeDestroy',
  (foodAllowancePolicyDetails, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    foodAllowancePolicyDetails.deleteBy = options.user.userMasterId;
    foodAllowancePolicyDetails.deleteByIp = options.user.userIpAddress;
  }
);

FoodAllowancePolicyDetails.belongsTo(FoodAllowancePolicy, {
  foreignKey: { name: 'foodAllowancePolicyId' },
});

FoodAllowancePolicy.hasMany(FoodAllowancePolicyDetails, {
  foreignKey: { name: 'foodAllowancePolicyId' },
});

FoodAllowancePolicyDetails.belongsTo(Shift, {
  foreignKey: { name: 'shiftID' },
});

module.exports = FoodAllowancePolicyDetails;
