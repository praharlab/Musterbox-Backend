const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const FormMaster = require('./formMaster');
const table_name = 'menuClick';
const MenuClick = sequelize.define(table_name, {
    menuClickId: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: Sequelize.INTEGER
    },
    userMasterID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    formMasterID: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    counter: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 1
    },
    createBy: {
        type: Sequelize.INTEGER,
    },
    updateBy: {
        type: Sequelize.INTEGER,
    },
    deleteBy: {
        type: Sequelize.INTEGER,
    },
    createByIp: {
        type: Sequelize.STRING,
    },
    updateByIp: {
        type: Sequelize.STRING,
    },
    deleteByIp: {
        type: Sequelize.STRING,
    },
},
    {
        paranoid: true
    });

MenuClick.addHook('beforeCreate', (menuClick, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    menuClick.createBy = options.user.userMasterId;
    menuClick.updateBy = options.user.userMasterId;
    menuClick.createByIp = options.user.userIpAddress;
    menuClick.updateByIp = options.user.userIpAddress;
});

MenuClick.addHook('beforeUpdate', (menuClick, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    menuClick.updateBy = options.user.userMasterId;
    menuClick.ipAddress = options.user.userIpAddress;
    menuClick.updateByIp = options.user.userIpAddress;
});

MenuClick.addHook('beforeDestroy', (menuClick, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    menuClick.deleteBy = options.user.userMasterId;
    menuClick.deleteByIp = options.user.userIpAddress;
});


MenuClick.belongsTo(UserMaster, { foreignKey: { name: "userMasterID" } });
MenuClick.belongsTo(FormMaster, { foreignKey: { name: "formMasterID" } });

UserMaster.hasMany(MenuClick, { foreignKey: { name: "userMasterID" } });

MenuClick.belongsTo(UserMaster, {
    as: 'createdByUserDetails',
    foreignKey: { name: 'createBy' },
});

MenuClick.belongsTo(UserMaster, {
    as: 'updatedByUserDetails',
    foreignKey: { name: 'updateBy' },
});
MenuClick.belongsTo(UserMaster, {
    as: 'deleteByUserDetails',
    foreignKey: { name: 'deleteBy' },
});

module.exports = MenuClick;