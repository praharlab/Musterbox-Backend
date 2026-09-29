const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'preboarding';
const CompanyMaster = require('./companyMaster');

const Designation = require('./designation');
const PreboardingMaster = require('./preboardingMaster');
const BranchMaster = require('./branchMaster');
const OfferLetterModel = require('./offerLetter');
const CountryMaster = require('./countrymaster');
const UserMaster = require('./userMaster');
const JobApplication = require('./jobApplication');

const Preboarding = sequelize.define(table_name, {
  preboardingID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  firstName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  middleName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  userNumber: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  dob: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  designationID: {
    type: Sequelize.INTEGER,
    allowNull: true,
  },
  preboardingstatus: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  status: {
    type: Sequelize.BIGINT,
    allowNull: false,
    defaultValue: 1,
  },
  createBy: {
    type: Sequelize.BIGINT,
  },
  updateBy: {
    type: Sequelize.BIGINT,
  },
  createByIp: {
    type: Sequelize.STRING,
  },
  updateByIp: {
    type: Sequelize.STRING,
  },
  joiningDate: {
    type: Sequelize.DATEONLY,
    allowNull: true,
  },
  ctc: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  offerLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  offerLetterHTML: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  userNumberCountryMasterID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  employeeType: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: 'national',
  },
  nationality: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  jobApplicationID: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  acceptanceStatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0, // This is for Offer Letter {0: null, 1: mail send, 2: accepted, 3: rejected}
  },
  docUploadStatus: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0, // This is for Document Upload Status{0: null, 1: mail send, 2: uploaded, 3: rejected}
  }
});

Preboarding.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

Preboarding.belongsTo(Designation, {
  foreignKey: { name: 'designationID' },
});

Preboarding.belongsTo(BranchMaster, {
  foreignKey: { name: 'branchMasterID' },
});

Preboarding.belongsTo(PreboardingMaster, {
  foreignKey: { name: 'preboardingMasterID' },
});

Preboarding.belongsTo(OfferLetterModel, {
  foreignKey: { name: 'offerLetterID' },
  as: 'offerLetterAssociation',
});

Preboarding.belongsTo(CountryMaster, {
  foreignKey: { name: 'userNumberCountryMasterID' },
});

Preboarding.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

Preboarding.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
Preboarding.belongsTo(JobApplication, {
  foreignKey: { name: 'jobApplicationID' },
});
Preboarding.addHook('beforeCreate', (data, options) => {
  data.createBy = options.user.userMasterId;
  data.createByIp = options.user.userIpAddress;
});

Preboarding.addHook('beforeUpdate', (data, options) => {
  data.updateBy = options.user.userMasterId;
  data.updateByIp = options.user.userIpAddress;
});

Preboarding.addHook('beforeDestroy', (data, options) => {
  data.deleteBy = options.user.userMasterId;
  data.deleteByIp = options.user.userIpAddress;
});

Preboarding.addHook('beforeBulkCreate', (data, options) => {
  data.forEach((answer) => {
    answer.createBy = options.user.userMasterId;
    answer.createByIp = options.user.userIpAddress;
  });
});
module.exports = Preboarding;
