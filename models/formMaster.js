const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'formMaster';
const FormMaster = sequelize.define(table_name, {
  formMasterID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  formName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  description: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  operation: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true,
  },
  defaultRight: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
  },
  icon: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  path: {
    type: Sequelize.STRING,
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
  menuName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

FormMaster.hasMany(FormMaster, {
  as: 'children',
  foreignKey: { name: 'parentFormMasterID', allowNull: true },
});
FormMaster.belongsTo(FormMaster, {
  as: 'parent',
  foreignKey: { name: 'parentFormMasterID', allowNull: true },
});

module.exports = FormMaster;
