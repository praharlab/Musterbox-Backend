const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const Branch = require('./branchMaster');
const table_name = 'employeeBranch';
const EmployeeBranch = sequelize.define(table_name, {
  employeeBranchID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  branchID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  applicableDate: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  endDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  status: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
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
},
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
    ],
  });

EmployeeBranch.belongsTo(UserMaster, {
  as: 'employee',
  foreignKey: { name: 'userMasterID' },
});
EmployeeBranch.belongsTo(Branch, {
  as: 'branchMaster',
  foreignKey: { name: 'branchID' },
});
EmployeeBranch.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
EmployeeBranch.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
UserMaster.hasMany(EmployeeBranch, {
  foreignKey: { name: 'userMasterID' },
});

UserMaster.hasMany(EmployeeBranch, {
  as: 'emp_branch',
  foreignKey: { name: 'userMasterID' },
});

// EmployeeBranch.sync({alter:true});

module.exports = EmployeeBranch;
