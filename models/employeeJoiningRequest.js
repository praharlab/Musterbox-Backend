const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const BranchMaster = require('./branchMaster');
const UserMaster = require('./userMaster');
const Department = require('./department');
const Designation = require('./designation');
const BankMaster = require('./bankMaster');
const table_name = 'employeeJoiningRequest';
const { JoiningRequestStatus } = require('../utils/dbUtils');
const CityMaster = require('./citymaster');

const EmployeeJoiningRequest = sequelize.define(
  table_name,
  {
    employeeJoiningRequestID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    mobileNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    aadharNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    panCardNo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    dateOfJoining: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    photo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    middleName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    nameAsAAdhar: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    presentAddress: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    permenetAddress: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    dob: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    maratialStatus: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    shirtSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    pantSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    shoesSize: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    salary: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bankAccountNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    IFSCNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ESICNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    uanNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    JoiningRequestStatus: {
      type: Sequelize.ENUM(...Object.values(JoiningRequestStatus)),
    },
    rejectionRemarks: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    aadharCardPhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    panCardPhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    drivingLicensePhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    bankPassbookPhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    declarationFormPhoto: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    candidateSignature: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    presentAddressCityID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    permenetAddressCityID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    remarks: {
      type: Sequelize.STRING,
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
      allowNull: true,
    },
    deleteByIp: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
  },
  {
    paranoid: true,
  }
);

EmployeeJoiningRequest.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

EmployeeJoiningRequest.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});

EmployeeJoiningRequest.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});

EmployeeJoiningRequest.belongsTo(Department, {
  foreignKey: { name: 'departmentId' },
});

EmployeeJoiningRequest.belongsTo(Designation, {
  foreignKey: { name: 'designationId' },
});

EmployeeJoiningRequest.belongsTo(BankMaster, {
  foreignKey: { name: 'bankMasterID' },
});
EmployeeJoiningRequest.belongsTo(CityMaster, {
  foreignKey: { name: 'presentAddressCityID' },
  as: 'presentAddressCity',
});

EmployeeJoiningRequest.belongsTo(CityMaster, {
  foreignKey: { name: 'permenetAddressCityID' },
  as: 'permenentAddressCity',
});

module.exports = EmployeeJoiningRequest;
