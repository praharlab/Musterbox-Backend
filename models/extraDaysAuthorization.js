const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const ExtraDays = require('./extraDays');
const table_name = 'extraDaysAuthorization';

const ExtraDaysAuthorization = sequelize.define(table_name, {
    extraDaysAuthorizationID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    userMasterID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    authStatus: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
    },
    remarks: {
        type: Sequelize.STRING,
        allowNull: true
    },
    extraDaysID: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    createBy: {
        type: Sequelize.BIGINT,
    },
    updateBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    deleteBy: {
        type: Sequelize.BIGINT,
    },
    createByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    updateByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    deleteByIp: {
        type: Sequelize.STRING,
    },
},
    {
        paranoid: true
    });

ExtraDaysAuthorization.addHook("beforeCreate", (extraDaysAuthorization, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    extraDaysAuthorization.createBy = options.user.userMasterId;
    extraDaysAuthorization.updateBy = options.user.userMasterId;
    extraDaysAuthorization.createByIp = options.user.userIpAddress;
    extraDaysAuthorization.updateByIp = options.user.userIpAddress;
});

ExtraDaysAuthorization.addHook("beforeUpdate", (extraDaysAuthorization, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    extraDaysAuthorization.updateBy = options.user.userMasterId;
    extraDaysAuthorization.updateByIp = options.user.userIpAddress;
});

ExtraDaysAuthorization.addHook("beforeDestroy", (extraDaysAuthorization, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    extraDaysAuthorization.deleteBy = options.user.userMasterId;
    extraDaysAuthorization.deleteByIp = options.user.userIpAddress;
});

ExtraDaysAuthorization.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });

ExtraDaysAuthorization.belongsTo(UserMaster, {
    as: "createByUser",
    foreignKey: { name: "createBy" },
  });
  ExtraDaysAuthorization.belongsTo(UserMaster, {
    as: "updateByUser",
    foreignKey: { name: "updateBy" },
  });
  ExtraDaysAuthorization.belongsTo(UserMaster, {
    as: "deleteByUser",
    foreignKey: { name: "deleteBy" },
  });

  ExtraDaysAuthorization.belongsTo(ExtraDays, {
    foreignKey: { name: 'extraDaysID' }
})

ExtraDays.hasMany(ExtraDaysAuthorization, {
    foreignKey: { name: 'extraDaysID' }
})

module.exports = ExtraDaysAuthorization;