const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CityMaster = require('./citymaster');
const companyMaster = require('./companyMaster');
const branchMaster = require('./branchMaster');
const UserMaster = require('./userMaster');
const table_name = 'workingLocation';
const WorkingLocation = sequelize.define(
  table_name,
  {
    workingLocationID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    workingLocationName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    // branchMasterID: {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    // },
    workingLocationAddress: {
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
  },
  {
    indexes: [
      // {
      //   unique: false,
      //   fields: ['branchMasterID'],
      // },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

WorkingLocation.belongsTo(CityMaster, { foreignKey: { name: 'cityMasterID' } });
WorkingLocation.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
// WorkingLocation.belongsTo(branchMaster, {
//   foreignKey: { name: 'branchMasterID' },
// });

WorkingLocation.belongsTo(UserMaster,{
  as: 'createdByUserDetails',
  foreignKey: {name: 'createBy'}
});

WorkingLocation.belongsTo(UserMaster,{
  as: 'updatedByUserDetails',
  foreignKey: {name: 'updateBy'}
});

module.exports = WorkingLocation;
