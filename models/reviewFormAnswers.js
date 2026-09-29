const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const ReviewFormQuestions = require('./reviewFormQuestions');
const EmployeePerformanceReview = require('./employeePerformanceReview');

const ReviewFormAnswers = sequelize.define(
  'reviewFormAnswers',
  {
    id: {
      type: Sequelize.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: Sequelize.TEXT,
    },
    rating: {
      type: Sequelize.INTEGER,
    },
    grade: {
      type: Sequelize.STRING,
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
ReviewFormAnswers.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
ReviewFormAnswers.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
ReviewFormAnswers.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
ReviewFormAnswers.belongsTo(ReviewFormQuestions, {
  foreignKey: { name: 'reviewFormQuestionId', allowNull: false },
});
ReviewFormQuestions.hasMany(ReviewFormAnswers);
ReviewFormAnswers.belongsTo(EmployeePerformanceReview, {
  foreignKey: { name: 'employeePerformanceReviewId', allowNull: false },
});

ReviewFormAnswers.addHook('beforeBulkCreate', (reviewFormAnswer, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  reviewFormAnswer.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.updateBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
    answer.updateByIp = options.user.userIpAddress;
  });
});

ReviewFormAnswers.addHook('beforeBulkUpdate', (reviewFormAnswer, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  reviewFormAnswer.forEach((answer) => {
    answer.updateBy = options.user.userMasterId;
    answer.updateByIp = options.user.userIpAddress;
  });
});

ReviewFormAnswers.addHook('beforeCreate', (reviewFormAnswer, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  reviewFormAnswer.dataValues.createBy = options.user.userMasterId;
  reviewFormAnswer.dataValues.updateBy = options.user.userMasterId;
  reviewFormAnswer.dataValues.createByIp = options.user.userIpAddress;
  reviewFormAnswer.dataValues.updateByIp = options.user.userIpAddress;
});

ReviewFormAnswers.addHook('beforeUpdate', async (reviewFormAnswer, options) => {
  // Set updatedBy and ipAddress based on the authenticated user
  reviewFormAnswer.updateBy = options.user.userMasterId;
  reviewFormAnswer.updateByIp = options.user.userIpAddress;
});

ReviewFormAnswers.addHook('beforeDestroy', (reviewFormAnswer, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  reviewFormAnswer.deleteBy = options.user.userMasterId;
  reviewFormAnswer.deleteByIp = options.user.userIpAddress;
});

module.exports = ReviewFormAnswers;
