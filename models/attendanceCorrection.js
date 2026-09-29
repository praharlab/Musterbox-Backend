const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const employeeJoiningDetails = require('./employeeJoiningDetails');
const department = require('./department');
const designation = require('./designation');
const branch = require('./branchMaster');
const Shift = require('./shift');
const table_name = 'attedanceCorrection';

const attedanceCorrection = sequelize.define(
  table_name,
  {
    AttendanceCorrectionID: {
      type: Sequelize.BIGINT,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    AttendanceTransID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    departmentID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    designationID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    branchID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    InDatetime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    OutDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    AttendanceDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },

    Shifthrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ShiftIntime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ShiftoutTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    InHrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    OutHrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    LateBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EarlyBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Panalty: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    PanaltyDeduction: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Othrs: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    fulldayhalfday: {
      type: Sequelize.FLOAT,
      allowNull: true,
    },
    punchINbranch: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    punchOUTbranch: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    goEarlyUsed: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    createBy: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    createByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    Status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    updateBy: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    updateByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ChangeBy: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    roundOffMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    withoutOtMinutes: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    LCPenaltyFrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    EGPenaltyFrom: {
      type: Sequelize.STRING,
      allowNull: true,
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['AttendanceDate'],
      },
    ],
  }
);

attedanceCorrection.belongsTo(userMaster, {
  foreignKey: { name: 'userMasterID' },
});
attedanceCorrection.belongsTo(department, {
  foreignKey: { name: 'departmentID' },
});
attedanceCorrection.belongsTo(designation, {
  foreignKey: { name: 'designationID' },
});
attedanceCorrection.belongsTo(branch, { foreignKey: { name: 'branchID' } });
attedanceCorrection.belongsTo(Shift, { foreignKey: { name: 'Shift' } });

module.exports = attedanceCorrection;
