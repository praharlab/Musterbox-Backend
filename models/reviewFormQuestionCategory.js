const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const UserActivity = require('./userActivity');
const ReviewForm = require('./reviewForm');

const ReviewFormQuestionCategory = sequelize.define(
  'reviewFormQuestionCategory',
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
    description: {
      type: Sequelize.TEXT,
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
ReviewFormQuestionCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
ReviewFormQuestionCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
ReviewFormQuestionCategory.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
ReviewFormQuestionCategory.belongsTo(ReviewForm, {
  foreignKey: { name: 'reviewFormId', allowNull: false },
});
ReviewForm.hasMany(ReviewFormQuestionCategory);

ReviewFormQuestionCategory.addHook(
  'beforeCreate',
  (reviewFormQuestionCategory, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    reviewFormQuestionCategory.createBy = options.user.userMasterId;
    reviewFormQuestionCategory.updateBy = options.user.userMasterId;
    reviewFormQuestionCategory.createByIp = options.user.userIpAddress;
    reviewFormQuestionCategory.updateByIp = options.user.userIpAddress;
  }
);

ReviewFormQuestionCategory.addHook(
  'beforeUpdate',
  async (reviewFormQuestionCategory, options) => {
    const oldValue = reviewFormQuestionCategory.previous();
    const newValue = reviewFormQuestionCategory.toJSON();
    if (Object.keys(oldValue).length > 0) {
      const trackedData = {
        activityType: DatabaseOperationEnum.UPDATE,
        activityTable: ReviewFormQuestionCategory.getTableName(),
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
    reviewFormQuestionCategory.updateBy = options.user.userMasterId;
    reviewFormQuestionCategory.updateByIp = options.user.userIpAddress;
  }
);

ReviewFormQuestionCategory.addHook(
  'beforeDestroy',
  (reviewFormQuestionCategory, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    reviewFormQuestionCategory.deleteBy = options.user.userMasterId;
    reviewFormQuestionCategory.deleteByIp = options.user.userIpAddress;
  }
);

module.exports = ReviewFormQuestionCategory;
