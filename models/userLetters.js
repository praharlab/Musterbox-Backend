const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const userMaster = require('./userMaster');
const OfferLetter = require('./offerLetter');
const JoiningLetter = require('./joiningLetter');
const table_name = 'userLetters';
const ExperienceLetter = require('./experienceletter');
const TerminationLetter = require('./terminationLetter');
const AppointmentLetter = require('./appointment');

const UserLetters = sequelize.define(table_name, {
  userLettersID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  offerLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  offerletterHTML: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  joiningLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  joiningletterHTML: {
    type: Sequelize.STRING,
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
  updateBy: {
    type: Sequelize.BIGINT,
    allowNull: true,
  },
  updateByIp: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  experienceLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  experienceletterHTML: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  terminationLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  terminationletterHTML: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  appointmentLetter: {
    type: Sequelize.STRING,
    allowNull: true,
  },
  appointmentletterHTML: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});

UserLetters.belongsTo(userMaster, { foreignKey: { name: 'userMasterID' } });
UserLetters.belongsTo(OfferLetter, {
  foreignKey: { name: 'offerLetterID' },
  as: 'OfferLetter',
});
UserLetters.belongsTo(JoiningLetter, {
  foreignKey: { name: 'joiningLetterID' },
  as: 'JoiningLetter',
});

UserLetters.belongsTo(ExperienceLetter, {
  foreignKey: { name: 'experienceLetterID' },
  as: 'ExperienceLetter',
});
UserLetters.belongsTo(TerminationLetter, {
  foreignKey: { name: 'terminationLetterID' },
  as: 'TerminationLetter',
});
UserLetters.belongsTo(AppointmentLetter, {
  foreignKey: { name: 'appointmentLetterID' },
  as: 'AppointmentLetter',
});

module.exports = UserLetters;
