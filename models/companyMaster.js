const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const CompanyTypeMaster = require('./companytypeMaster');
const table_name = 'companyMaster';
const companyMaster = sequelize.define(
  table_name,
  {
    companyMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyWebsite: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyEmail: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyLogo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    cpName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    cpMobileNo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    cpEmail: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    parentCompanyMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    subCompanyRequired: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    status: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 1,
    },
    employeeCodePattern: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    expenseDatePicker: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    otp: {
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
    panNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tanNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyDescription: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    employeeCodeType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    authorizedSignature: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    customerListPreference: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ownerFatherName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    tdsdeduction: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    uniqueEmpCode: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cinNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    setUpTime: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    fileUploadType: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    letterHead: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['companyName'],
      },
      {
        unique: false,
        fields: ['companyTypeid'],
      },
      {
        unique: false,
        fields: ['parentCompanyMasterID'],
      },
    ],
  }
);
companyMaster.belongsTo(CityMaster, { foreignKey: { name: 'cityMasterID' } });
companyMaster.belongsTo(CompanyTypeMaster, {
  foreignKey: { name: 'companyTypeid' },
});

module.exports = companyMaster;
