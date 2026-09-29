const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'visitFormCustomize';
const CompanyMaster = require('./companyMaster');

const VisitFormCustomize = sequelize.define(table_name, {
  visitFormCustomizeID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  fieldLabel: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  inputType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  value: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  isRequired: {
    type: Sequelize.BOOLEAN,
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
});

VisitFormCustomize.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
module.exports = VisitFormCustomize;
