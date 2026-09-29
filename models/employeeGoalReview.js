const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const EmployeeGoal = require('./employeeGoal');

const EmployeeGoalReview = sequelize.define(
  'employeeGoalReview',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    status: { type: Sequelize.STRING },
    isCompleted: { type: Sequelize.BOOLEAN, defaultValue: false },
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

EmployeeGoalReview.belongsTo(EmployeeGoal, {
  foreignKey: { name: 'employeeGoalId', allowNull: false },
});
EmployeeGoal.hasMany(EmployeeGoalReview);
EmployeeGoalReview.belongsTo(UserMaster, {
  foreignKey: { name: 'reviewerId', allowNull: false },
  as: 'reviewer',
});
EmployeeGoalReview.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeGoalReview.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeeGoalReview.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});

EmployeeGoalReview.addHook('beforeCreate', (employeeGoalReview, options) => {
  employeeGoalReview.createBy = options.user.userMasterId;
  employeeGoalReview.updateBy = options.user.userMasterId;
  employeeGoalReview.createByIp = options.user.userIpAddress;
  employeeGoalReview.updateByIp = options.user.userIpAddress;
});

EmployeeGoalReview.addHook('beforeUpdate', (employeeGoalReview, options) => {
  employeeGoalReview.updateBy = options.user.userMasterId;
  employeeGoalReview.updateByIp = options.user.userIpAddress;
});

EmployeeGoalReview.addHook('beforeDestroy', (employeeGoalReview, options) => {
  employeeGoalReview.deleteBy = options.user.userMasterId;
  employeeGoalReview.deleteByIp = options.user.userIpAddress;
});

module.exports = EmployeeGoalReview;
