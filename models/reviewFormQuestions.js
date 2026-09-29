const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const {
  DatabaseOperationEnum,
  ReviewQuestionsResponseType,
} = require('../utils/dbUtils');
const UserActivity = require('./userActivity');
const ReviewFormQuestionCategory = require('./reviewFormQuestionCategory');

const ReviewFormQuestions = sequelize.define(
  'reviewFormQuestions',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    question: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    responseType: {
      type: Sequelize.ENUM([...Object.values(ReviewQuestionsResponseType)]),
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
ReviewFormQuestions.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
ReviewFormQuestions.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
ReviewFormQuestions.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
ReviewFormQuestions.belongsTo(ReviewFormQuestionCategory, {
  foreignKey: { name: 'reviewFormQuestionCategoryId', allowNull: false },
});
ReviewFormQuestionCategory.hasMany(ReviewFormQuestions);

ReviewFormQuestions.addHook('beforeCreate', (reviewFormQuestion, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  reviewFormQuestion.createBy = options.user.userMasterId;
  reviewFormQuestion.updateBy = options.user.userMasterId;
  reviewFormQuestion.createByIp = options.user.userIpAddress;
  reviewFormQuestion.updateByIp = options.user.userIpAddress;
});

ReviewFormQuestions.addHook(
  'beforeUpdate',
  async (reviewFormQuestion, options) => {
    const oldValue = reviewFormQuestion.previous();
    const newValue = reviewFormQuestion.toJSON();
    if (Object.keys(oldValue).length > 0) {
      const trackedData = {
        activityType: DatabaseOperationEnum.UPDATE,
        activityTable: ReviewFormQuestions.getTableName(),
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
    reviewFormQuestion.updateBy = options.user.userMasterId;
    reviewFormQuestion.updateByIp = options.user.userIpAddress;
  }
);

ReviewFormQuestions.addHook('beforeDestroy', (reviewFormQuestion, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  reviewFormQuestion.deleteBy = options.user.userMasterId;
  reviewFormQuestion.deleteByIp = options.user.userIpAddress;
});

module.exports = ReviewFormQuestions;
