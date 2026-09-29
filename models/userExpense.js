const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const expenseCategory = require('./expenseCategory');
const visit = require('./visit');
const tour = require('./toursMaster');
const erpAcountMaster = require('./erpAccountMaster');
const Project = require('./project');
const table_name = 'userExpense';
const UserExpense = sequelize.define(
  table_name,
  {
    userExpenseID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    visitID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    ToursMasterID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    expense_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    // expenseCategoryId: {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    // },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    projectID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    deleteBy: {
      type: Sequelize.INTEGER,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
  },
  {
    paranoid: true,
    indexes: [
      {
        fields: ['userMasterID'],
      },
      {
        fields: ['userMasterID', 'expense_date'],
      },
    ],
  }
);

UserExpense.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });

UserExpense.belongsTo(visit, { foreignKey: { name: 'visitID' } });
UserExpense.belongsTo(tour, { foreignKey: { name: 'ToursMasterID' } });
// UserExpense.belongsTo(expenseCategory, {
//   foreignKey: { name: 'expenseCategoryId' },
// });
UserMaster.hasMany(UserExpense, {
  foreignKey: { name: 'userMasterID' },
});
UserExpense.belongsTo(Project, {
  foreignKey: { name: 'projectID' },
});

module.exports = UserExpense;
