const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('./userMaster');
const UserTasks = require('./User_Tasks');

const table_name = 'task_reminder';

const TaskReminder = sequelize.define(table_name, {
    //primary key
    taskReminderID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    receiverId: {
        type: Sequelize.BIGINT,
    },
    message: {
        type: Sequelize.STRING,
    },
    createBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
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
    status: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    user_TasksID: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    userMasterID: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
});
TaskReminder.belongsTo(UserMaster, { foreignKey: { name: 'receiverId' } });
TaskReminder.belongsTo(UserMaster, { foreignKey: { name: 'userMasterID' } });
TaskReminder.belongsTo(UserTasks, { foreignKey: { name: 'user_TasksID' } });
UserTasks.hasMany(TaskReminder, { foreignKey: { name: 'user_TasksID' } });

module.exports = TaskReminder;
