const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const EmployeeGoal = require('./employeeGoal');
const { EmployeeGoalStatusEnum } = require('../utils/dbUtils');

const EmployeeGoalUpdates = sequelize.define(
  'employeeGoalUpdates',
  {
    id: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    targetAchieved: {
      type: Sequelize.DECIMAL(10, 2),
    },
    status: {
      type: Sequelize.ENUM(...Object.values(EmployeeGoalStatusEnum)),
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
EmployeeGoalUpdates.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeeGoalUpdates.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeeGoalUpdates.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
EmployeeGoalUpdates.belongsTo(EmployeeGoal, {
  foreignKey: { name: 'employeeGoalId', allowNull: false },
});
EmployeeGoal.hasMany(EmployeeGoalUpdates);

EmployeeGoalUpdates.addHook('beforeCreate', (employeeGoal, options) => {
  employeeGoal.createBy = options.user.userMasterId;
  employeeGoal.updateBy = options.user.userMasterId;
  employeeGoal.createByIp = options.user.userIpAddress;
  employeeGoal.updateByIp = options.user.userIpAddress;
});

EmployeeGoalUpdates.addHook('beforeUpdate', (employeeGoal, options) => {
  employeeGoal.updateBy = options.user.userMasterId;
  employeeGoal.updateByIp = options.user.userIpAddress;
});

EmployeeGoalUpdates.addHook('beforeDestroy', (employeeGoal, options) => {
  employeeGoal.deleteBy = options.user.userMasterId;
  employeeGoal.deleteByIp = options.user.userIpAddress;
});

module.exports = EmployeeGoalUpdates;
