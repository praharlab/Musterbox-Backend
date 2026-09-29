const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'holidayPolicy';
const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const holidayPolicy = sequelize.define(table_name, {
  holidayPolicyID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  holidayPolicyName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  holidayYear: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  status: {
    type: Sequelize.BIGINT,
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
});

// holidayPolicy.belongsTo(UserMaster,{
//   as: 'createdByUserDetails',
//   foreignKey: {name: 'createBy'}
// });

// holidayPolicy.belongsTo(UserMaster,{
//   as: 'updatedByUserDetails',
//   foreignKey: {name: 'updateBy'}
// });


holidayPolicy.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

// holidayPolicy.sync({alter: true});

module.exports = holidayPolicy;
