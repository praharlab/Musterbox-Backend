const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const table_name = 'shift';
const Shift = sequelize.define(
  table_name,
  {
    shiftID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    shiftName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    shiftCode: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    shiftDesc: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    lateComing: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    goEarly: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    allowDays: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    paneltyDeduction: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    paneltyDays: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    paneltyMin: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    paneltyAmount: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    graceIntime: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    deductionOn: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    recuring: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    table: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    referenceId: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    branchID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    recuring: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    shiftGrace: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    goEarlyallowdays: {
      type: Sequelize.FLOAT,
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
    value: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    slot: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    goEarlyPaneltyDeduction: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    goEarlyslot: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
    goEarlyvalue: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['shiftName'],
      },
      {
        unique: false,
        fields: ['shiftCode'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Shift.belongsTo(companyMaster, { foreignKey: { name: 'companyMasterID' } });

// Shift.belongsTo(UserMaster,{
//   as: 'createdByUserDetails',
//   foreignKey: {name: 'createBy'}
// });

// Shift.belongsTo(UserMaster,{
//   as: 'updatedByUserDetails',
//   foreignKey: {name: 'updateBy'}
// });


module.exports = Shift;
