const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const HrLeaveTypes = require('./hrLeaveTypes');
const UserMaster = require('./userMaster');
const table_name = 'hrLeaveMonthlyTrans';

const HrLeaveMonthlyTrans = sequelize.define(
  table_name,
  {
    AttnTranId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    //foreign key
    userMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    //foreign key
    LeaveTranId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    AttnYearMon: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    MonDays: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    MonWorkDays: {
      type: Sequelize.FLOAT,
      allowNull: false,
    },
    AttnVal: {
      type: Sequelize.FLOAT,
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
    verified: {
      type: Sequelize.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    monthstartdate: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    monthenddate: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['userMasterID'],
      },
      {
        unique: false,
        fields: ['LeaveTranId'],
      },
      {
        unique: false,
        fields: ['AttnYearMon'],
      },
        {
        unique: false,
        fields: ['verified'],
      },
       {
        unique: false,
        fields: ['AttnYearMon','verified'],
      },
            // {
      //   unique: true, // Composite Unique Index
      //   fields: ['userMasterID', 'AttnYearMon', 'LeaveTranId'],
      // },
    ],
  }
);

HrLeaveMonthlyTrans.belongsTo(UserMaster, {
  foreignKey: { name: 'userMasterID' },
});
HrLeaveMonthlyTrans.belongsTo(HrLeaveTypes, {
  foreignKey: { name: 'LeaveTranId' },
});

UserMaster.hasMany(HrLeaveMonthlyTrans, {
  foreignKey: { name: 'userMasterID' },
});

// HrLeaveMonthlyTrans.sync({alter:true});

module.exports = HrLeaveMonthlyTrans;
