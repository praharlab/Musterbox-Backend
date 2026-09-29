const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const UserActivity = require('./userActivity');
const companyMaster = require('./companyMaster');

const ReviewForm = sequelize.define(
  'reviewForm',
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
ReviewForm.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdByUser',
});
ReviewForm.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedByUser',
});
ReviewForm.belongsTo(UserMaster, {
  foreignKey: { name: 'deleteBy' },
  as: 'deletedByUser',
});
ReviewForm.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterId', allowNull: false },
});

ReviewForm.addHook('beforeCreate', (reviewForm, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  reviewForm.createBy = options.user.userMasterId;
  reviewForm.updateBy = options.user.userMasterId;
  reviewForm.createByIp = options.user.userIpAddress;
  reviewForm.updateByIp = options.user.userIpAddress;
});

ReviewForm.addHook('beforeUpdate', async (reviewForm, options) => {
  const oldValue = reviewForm.previous();
  const newValue = reviewForm.toJSON();
  if (Object.keys(oldValue).length > 0) {
    const trackedData = {
      activityType: DatabaseOperationEnum.UPDATE,
      activityTable: ReviewForm.getTableName(),
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
  reviewForm.updateBy = options.user.userMasterId;
  reviewForm.updateByIp = options.user.userIpAddress;
});

ReviewForm.addHook('beforeDestroy', (reviewForm, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  reviewForm.deleteBy = options.user.userMasterId;
  reviewForm.deleteByIp = options.user.userIpAddress;
});

module.exports = ReviewForm;
