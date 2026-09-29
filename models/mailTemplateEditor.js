const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'mailTemplateEditor';
const CompanyMaster = require('./companyMaster');
const MailTemplateType = require('./mailTemplateType');
const UserMaster = require('./userMaster');
const mailTemplateEditor = sequelize.define(
  table_name,
  {
    mailTemplateID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
      //forign key
    },
    mailTypeID: {
      type: Sequelize.INTEGER,
      allowNull: false,
      //forign key
    },

    subject: {
      type: Sequelize.TEXT, // Change from Sequelize.STRING to Sequelize.TEXT
      allowNull: false,
    },

    body: {
      type: Sequelize.TEXT, // Change from Sequelize.STRING to Sequelize.TEXT
      allowNull: false,
    },

    status: {
      type: Sequelize.BIGINT,
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
  },
  {}
);

mailTemplateEditor.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});
mailTemplateEditor.belongsTo(MailTemplateType, {
  foreignKey: { name: 'mailTypeID' },
});
mailTemplateEditor.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
mailTemplateEditor.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
// CompanyMaster.hasMany(mailTemplateEditor, {
//   foreignKey: { name: 'companyMasterID' },
// });
module.exports = mailTemplateEditor;
