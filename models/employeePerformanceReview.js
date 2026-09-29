const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const PerformanceReview = require('./performanceReview');

const EmployeePerformanceReview = sequelize.define(
  'employeePerformanceReview',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    notes: {
      type: Sequelize.TEXT,
    },
    isCompleted: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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
EmployeePerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
EmployeePerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
EmployeePerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
EmployeePerformanceReview.belongsTo(PerformanceReview, {
  foreignKey: { name: 'performanceReviewId', allowNull: false },
});
PerformanceReview.hasMany(EmployeePerformanceReview);
EmployeePerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'reviewerId' },
  as: 'reviewer',
});
EmployeePerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'revieweeId', allowNull: false },
  as: 'reviewee',
});

EmployeePerformanceReview.addHook(
  'beforeCreate',
  (performanceReviewer, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    performanceReviewer.createBy = options.user.userMasterId;
    performanceReviewer.updateBy = options.user.userMasterId;
    performanceReviewer.createByIp = options.user.userIpAddress;
    performanceReviewer.updateByIp = options.user.userIpAddress;
  }
);

EmployeePerformanceReview.addHook(
  'beforeUpdate',
  async (performanceReviewer, options) => {
    // Set updatedBy and ipAddress based on the authenticated user
    performanceReviewer.updateBy = options.user.userMasterId;
    performanceReviewer.updateByIp = options.user.userIpAddress;
  }
);

EmployeePerformanceReview.addHook(
  'beforeDestroy',
  (performanceReviewer, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    performanceReviewer.deleteBy = options.user.userMasterId;
    performanceReviewer.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = EmployeePerformanceReview;
