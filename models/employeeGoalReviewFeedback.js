const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const KPIMaster = require('./kpimaster');
const EmployeeGoalReview = require('./employeeGoalReview');

const EmployeeGoalReviewFeedback = sequelize.define(
  'employeeGoalReviewFeedback',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    remarks: { type: Sequelize.TEXT },
    targetAchieved: {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0,
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

EmployeeGoalReviewFeedback.belongsTo(EmployeeGoalReview, {
  foreignKey: { name: 'employeeGoalReviewId', allowNull: false },
});
EmployeeGoalReview.hasMany(EmployeeGoalReviewFeedback);

EmployeeGoalReviewFeedback.belongsTo(KPIMaster, {
  foreignKey: { name: 'kpiMasterId', allowNull: false },
});
EmployeeGoalReviewFeedback.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeGoalReviewFeedback.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeeGoalReviewFeedback.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

EmployeeGoalReviewFeedback.addHook(
  'beforeCreate',
  (employeeGoalReviewFeedback, options) => {
    employeeGoalReviewFeedback.createBy = options.user.userMasterId;
    employeeGoalReviewFeedback.updateBy = options.user.userMasterId;
    employeeGoalReviewFeedback.createByIp = options.user.userIpAddress;
    employeeGoalReviewFeedback.updateByIp = options.user.userIpAddress;
  }
);

EmployeeGoalReviewFeedback.addHook(
  'beforeUpdate',
  (employeeGoalReviewFeedback, options) => {
    employeeGoalReviewFeedback.updateBy = options.user.userMasterId;
    employeeGoalReviewFeedback.updateByIp = options.user.userIpAddress;
  }
);

EmployeeGoalReviewFeedback.addHook(
  'beforeDestroy',
  (employeeGoalReviewFeedback, options) => {
    employeeGoalReviewFeedback.deleteBy = options.user.userMasterId;
    employeeGoalReviewFeedback.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = EmployeeGoalReviewFeedback;
