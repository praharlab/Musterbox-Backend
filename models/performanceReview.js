const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const {
  DatabaseOperationEnum,
  PerformanceReviewStatus,
} = require('../utils/dbUtils');
const UserActivity = require('./userActivity');
const companyMaster = require('./companyMaster');
const ReviewForm = require('./reviewForm');

const PerformanceReview = sequelize.define(
  'performanceReview',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM([...Object.values(PerformanceReviewStatus)]),
      defaultValue: PerformanceReviewStatus.INITIATED,
    },
    description: {
      type: Sequelize.TEXT,
    },
    startDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: Sequelize.DATEONLY,
      allowNull: false,
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
PerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
PerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
PerformanceReview.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
PerformanceReview.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId', allowNull: false },
});
PerformanceReview.belongsTo(ReviewForm, {
  foreignKey: { name: 'reviewFormId', allowNull: false },
});

PerformanceReview.addHook('beforeCreate', (performanceReview, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  performanceReview.createBy = options.user.userMasterId;
  performanceReview.updateBy = options.user.userMasterId;
  performanceReview.createByIp = options.user.userIpAddress;
  performanceReview.updateByIp = options.user.userIpAddress;
});

PerformanceReview.addHook(
  'beforeUpdate',
  async (performanceReview, options) => {
    const oldValue = performanceReview.previous();
    const newValue = performanceReview.toJSON();
    if (Object.keys(oldValue).length > 0) {
      const trackedData = {
        activityType: DatabaseOperationEnum.UPDATE,
        activityTable: PerformanceReview.getTableName(),
        activityTablePK: newValue.id,
        activityDetails: [],
      };
      Object.keys(oldValue).forEach((key) => {
        if (newValue.hasOwnProperty(key)) {
          const newObject = {};
          newObject[`new_${key}`] = newValue[key];
          newObject[`old_${key}`] = oldValue[key];
          trackedData.activityDetails.push(newObject);
        }
      });
      await UserActivity.create(trackedData, {
        userMasterId: options.user.userMasterId,
        transaction: options.transaction,
      });
    }
    // Set updatedBy and ipAddress based on the authenticated user
    performanceReview.updateBy = options.user.userMasterId;
    performanceReview.updateByIp = options.user.userIpAddress;
  }
);

PerformanceReview.addHook('beforeDestroy', (performanceReview, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  performanceReview.deleteBy = options.user.userMasterId;
  performanceReview.deleteByIp = options.user.userIpAddress;
});

module.exports = PerformanceReview;
