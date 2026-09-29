const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'visit';
const CompanyMaster = require('./companyMaster');
const Customer = require('./customer');
const Product = require('./product');
const UserMaster = require('./userMaster');
const VisitPurpose = require('./visitPurpose');
const VisitFormCustomizeValue = require('./visitformcustomizevalue');
const VisitReportCustomizeValue = require('./visitreportcustomizevalue');
const Visit = sequelize.define(
  table_name,
  {
    visitID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customerID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    assignID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    coPersonID: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: true,
    },
    visitPurposeID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    productID: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    visitDate: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    visitTime: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    checkInDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    checkInLatitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    checkInLongitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    checkInLocation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    checkOutDateTime: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    checkOutLatitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    checkOutLongitude: {
      type: Sequelize.DECIMAL,
      allowNull: true,
    },
    checkOutLocation: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    visitStatus: {
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
      {
        unique: false,
        fields: ['customerID'],
      },
      {
        unique: false,
        fields: ['assignID'],
      },
      {
        unique: false,
        fields: ['visitPurposeID'],
      },
      {
        unique: false,
        fields: ['productID'],
      },
      {
        unique: false,
        fields: ['visitStatus'],
      },
    ],
  }
);

Visit.belongsTo(Customer, { foreignKey: { name: 'customerID' } });
Visit.belongsTo(UserMaster, { as: 'assign', foreignKey: { name: 'assignID' } });
Visit.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
Visit.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
Visit.belongsTo(Product, { foreignKey: { name: 'productID' } });
Visit.belongsTo(VisitPurpose, { foreignKey: { name: 'visitPurposeID' } });
Visit.belongsTo(CompanyMaster, { foreignKey: { name: 'companyMasterID' } });

VisitFormCustomizeValue.belongsTo(Visit, {
  foreignKey: { name: 'visitID' },
});
VisitReportCustomizeValue.belongsTo(Visit, {
  foreignKey: { name: 'visitID' },
});

Visit.hasMany(VisitFormCustomizeValue, {
  foreignKey: { name: 'visitID' },
});

Visit.hasMany(VisitReportCustomizeValue, {
  foreignKey: { name: 'visitID' },
});

module.exports = Visit;
