const UserMaster = require('./userMaster');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const companyMaster = require('./companyMaster');
const table_name = 'branchMaster';
const BranchMaster = sequelize.define(
  table_name,
  {
    branchMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    branchName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    branchCode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    branchAddress: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    latitude: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    longitude: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    radius: {
      type: Sequelize.DECIMAL(12, 4),
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
    gstNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    lwfNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    professionaltaxNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    pfNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    esicNumber: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['branchName'],
      },
      {
        unique: false,
        fields: ['branchCode'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

BranchMaster.belongsTo(CityMaster, { foreignKey: { name: 'cityMasterID' } });
BranchMaster.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

BranchMaster.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

BranchMaster.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
module.exports = BranchMaster;
