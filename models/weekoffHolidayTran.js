const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const table_name = "weekoffHolidayTran";
const weekoffHolidayTran = sequelize.define(table_name, {
  weekoffHolidayTranID: {
    type: Sequelize.BIGINT,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true,
  },
  companyMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  userMasterID: {
    type: Sequelize.BIGINT,
    allowNull: false,
  },
  yearMonth: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  dayName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  value: {
    type: Sequelize.FLOAT,
    allowNull: false,
  },
  tableName: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  optionalHoliday: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  WHDayType: {
    type: Sequelize.STRING,
    allowNull: true,
  },
});
weekoffHolidayTran.belongsTo(UserMaster, {
  foreignKey: { name: "userMasterID" },
});
UserMaster.hasMany(weekoffHolidayTran, {
  foreignKey: { name: "userMasterID" },
});

module.exports = weekoffHolidayTran;
