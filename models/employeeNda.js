const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const CompanyMaster = require('./companyMaster');
const Ndacategory = require('./Ndacategory');
const table_name = 'employeeNda';
const EmployeeNda = sequelize.define(table_name, {
  employeeNdaid: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  Ndacategoryid: {
    type: Sequelize.INTEGER,
    allowNull: false,
    //foriegn key
  },
  Ndaname: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  userMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  companyMasterID: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  givendate: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  pdf: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  showtoemployee: {
    type: Sequelize.STRING,
    allowNull: false,
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
});

EmployeeNda.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
EmployeeNda.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
EmployeeNda.belongsTo(Ndacategory, { foreignKey: { name: 'Ndacategoryid' } });

module.exports = EmployeeNda;
