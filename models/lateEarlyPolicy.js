const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const { PenaltyDeductFromEnum } = require('../utils/dbUtils');
const table_name = 'lateEarlyPolicy';
const LateEarlyPolicy = sequelize.define(
  table_name,
  {
    lateEarlyPolicyMasterID: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    lateEarlyPolicyName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    lateEarlyPolicyType: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    latedeductionfrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latedeductioncycle: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latedeductioncategory: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latenoof: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latemaxminute: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latedeductiontype: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latevalue: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    lateRecurring: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    graceInTime: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
    earlydeductionfrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlydeductioncycle: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlydeductioncategory: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlynoof: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlymaxminute: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlydeductiontype: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlyvalue: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlyRecurring: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    combineddeductionfrom: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combineddeductioncycle: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combineddeductioncategory: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinednoof: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedmaxminute: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combineddeductiontype: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedvalue: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedRecurring: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    status: {
      type: Sequelize.INTEGER,
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
    deleteBy: {
      type: Sequelize.BIGINT,
    },
    deleteByIp: {
      type: Sequelize.STRING,
    },
    deletedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    companyMasterID: {
      type: Sequelize.BIGINT,
      allowNull: true,
    },
    onWorkingHours: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    combinedSlab1: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    combineddeductionfrom1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combineddeductiontype1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedvalue1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedmaxminute1: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    combinedSlab2: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    combineddeductionfrom2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combineddeductiontype2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedvalue2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    combinedmaxminute2: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    lateComeSlab1: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    latedeductionfrom1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latedeductiontype1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latevalue1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latemaxminute1: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    lateComeSlab2: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    latedeductionfrom2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latedeductiontype2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latevalue2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    latemaxminute2: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    earlyGoSlab1: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    earlydeductionfrom1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlydeductiontype1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlyvalue1: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlymaxminute1: {
      type: Sequelize.STRING,
      allowNull: true,
    },

    earlyGoSlab2: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    earlydeductionfrom2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlydeductiontype2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlyvalue2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    earlymaxminute2: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    deductFrom: {
      type: Sequelize.ENUM(...Object.values(PenaltyDeductFromEnum)),
      allowNull: true,
    },
    earlyGraceTime: {
      type: Sequelize.INTEGER,
      allowNull: true,
    }
  },
  {
    paranoid: true,
  }
);




LateEarlyPolicy.addHook('beforeCreate', (lateEarlyPolicy, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  lateEarlyPolicy.createBy = options.user.userMasterId;
  lateEarlyPolicy.createByIp = options.user.userIpAddress;
});

LateEarlyPolicy.addHook('beforeUpdate', (lateEarlyPolicy, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  lateEarlyPolicy.updateBy = options.user.userMasterId;
  lateEarlyPolicy.updateByIp = options.user.userIpAddress;
});

LateEarlyPolicy.addHook('beforeDestroy', (lateEarlyPolicy, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  lateEarlyPolicy.deleteBy = options.user.userMasterId;
  lateEarlyPolicy.deleteByIp = options.user.userIpAddress;
});
LateEarlyPolicy.belongsTo(companyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

LateEarlyPolicy.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

LateEarlyPolicy.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});

LateEarlyPolicy.belongsTo(UserMaster, {
  as: 'deletedByUserDetails',
  foreignKey: { name: 'deleteBy' },
});


module.exports = LateEarlyPolicy;
