const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const tableName = 'userMaster';
const CompanyMaster = require('./companyMaster');
const CountryMaster = require('./countrymaster');

const UserMaster = sequelize.define(
  tableName,
  {
    userMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
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
    displayName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    userNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    photo: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    companyMasterId: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    gender: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    dob: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    maratialStatus: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    physicalDisability: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isonBoarding: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    admin: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    password: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    firebaseToken: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    uniqueID: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    passwordToken: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    passwordTokenExpiry: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    status: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
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
    facePhoto: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    facePhotoArray: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    deactiveDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },
    resetpassword: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    deviceType: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    userFaces: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    otherContactNumber: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    isPhotoLock: {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    userNumberCountryMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    localFName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    localMName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    localLName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    localDisplayName: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    isFNF: {
      type: Sequelize.BOOLEAN,
    },
    fnfMonth: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isOnline: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    cugNumber: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    officalEmail: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['firstName'],
      },
      {
        unique: false,
        fields: ['lastName'],
      },
      {
        unique: false,
        fields: ['displayName'],
      },
      {
        unique: false,
        fields: ['userNumber'],
      },
    ],
  }
);
UserMaster.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterId' },
});
UserMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'createBy' },
  as: 'createdBy',
});

UserMaster.belongsTo(UserMaster, {
  foreignKey: { name: 'updateBy' },
  as: 'updatedBy',
});

UserMaster.belongsTo(CountryMaster, {
  foreignKey: { name: 'userNumberCountryMasterID' },
});
module.exports = UserMaster;
