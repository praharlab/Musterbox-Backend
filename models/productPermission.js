const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const FormMaster = require('./formMaster');
const ProductMaster = require('./productMaster');
const Operation = require('./operation');
const table_name = 'productPermission';
const RolePermission = sequelize.define(table_name, {
  productPermissionID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
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

RolePermission.belongsTo(FormMaster, {
  foreignKey: { name: 'formMasterID' },
});
RolePermission.belongsTo(ProductMaster, {
  foreignKey: { name: 'productMasterID' },
});
RolePermission.belongsTo(Operation, { foreignKey: { name: 'operationID' } });

module.exports = RolePermission;
