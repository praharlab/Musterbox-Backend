const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const AuditLogs = require('./auditLogs');
const { DatabaseOperationEnum } = require('../utils/dbUtils');

const CompanyMaster = require('./companyMaster');
const UserMaster = require('./userMaster');
const WorkingArea = sequelize.define(
  'workingArea',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    workingAreaName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
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
  { paranoid: true }
);

WorkingArea.addHook('beforeCreate', (workingarea, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  workingarea.createBy = options.user.userMasterId;
  workingarea.updateBy = options.user.userMasterId;
  workingarea.createByIp = options.user.userIpAddress;
  workingarea.updateByIp = options.user.userIpAddress;
});

WorkingArea.addHook('beforeUpdate', (workingarea, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  workingarea.updateBy = options.user.userMasterId;
  workingarea.ipAddress = options.user.userIpAddress;
  workingarea.updateByIp = options.user.userIpAddress;
});

WorkingArea.addHook('beforeDestroy', (workingarea, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  workingarea.deleteBy = options.user.userMasterId;
  workingarea.deleteByIp = options.user.userIpAddress;
});

WorkingArea.addHook('afterSave', async (workingarea, options) => {
  if (options.dbOperation === DatabaseOperationEnum.CREATE) {
    const newValue = workingarea.toJSON();
    const createBy = newValue.createBy;
    const createByIp = newValue.createByIp;
    delete newValue.createBy;
    delete newValue.createByIp;
    delete newValue.createdAt;
    delete newValue.updateBy;
    delete newValue.updateByIp;
    delete newValue.updatedAt;
    delete newValue.deleteBy;
    delete newValue.deleteByIp;
    delete newValue.deletedAt;

    let addLog = await AuditLogs.create(
      {
        companyMasterID: newValue.companyMasterID,
        operation: options.dbOperation,
        oldValue: {},
        newValue,
        tableName: WorkingArea.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else {
    const oldValue = workingarea._previousDataValues;
    const newValue = workingarea.toJSON();
    const createBy = newValue.updateBy;
    const createByIp = newValue.updateByIp;
    delete oldValue.createBy;
    delete oldValue.createByIp;
    delete oldValue.createdAt;
    delete oldValue.updateBy;
    delete oldValue.updateByIp;
    delete oldValue.updatedAt;
    delete oldValue.deleteBy;
    delete oldValue.deleteByIp;
    delete oldValue.deletedAt;
    delete newValue.createBy;
    delete newValue.createByIp;
    delete newValue.createdAt;
    delete newValue.updateBy;
    delete newValue.updateByIp;
    delete newValue.updatedAt;
    delete newValue.deleteBy;
    delete newValue.deleteByIp;
    delete newValue.deletedAt;

    let addLog = await AuditLogs.create(
      {
        companyMasterID: newValue.companyMasterID,
        operation: options.dbOperation,
        oldValue,
        newValue,
        tableName: WorkingArea.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  }
});

WorkingArea.addHook('afterDestroy', async (workingarea, options) => {
  const oldValue = workingarea._previousDataValues;
  const createBy = oldValue.deleteBy;
  const createByIp = oldValue.deleteByIp;
  delete oldValue.status;
  delete oldValue.createBy;
  delete oldValue.createdAt;
  delete oldValue.createByIp;
  delete oldValue.updateBy;
  delete oldValue.updateByIp;
  delete oldValue.updatedAt;
  delete oldValue.deleteBy;
  delete oldValue.deletedAt;
  delete oldValue.deleteByIp;
  let addLog = await AuditLogs.create(
    {
      companyMasterID: oldValue.companyMasterID,
      operation: options.dbOperation,
      oldValue: oldValue,
      newValue: {},
      tableName: WorkingArea.getTableName(),
      createBy,
      createByIp,
    },
    {
      transaction: options.transaction,
    }
  );

  await options.transaction.commit();
});

WorkingArea.addHook('afterBulkCreate', async (workingarea, options) => {
  const row = workingarea.map((item) => {
    const newValue = item.toJSON();
    const createBy = newValue.createBy;
    const createByIp = newValue.createByIp;
    delete newValue.createBy;
    delete newValue.createByIp;
    delete newValue.createdAt;
    delete newValue.updateBy;
    delete newValue.updateByIp;
    delete newValue.updatedAt;
    delete newValue.deleteBy;
    delete newValue.deleteByIp;
    delete newValue.deletedAt;
    return {
      companyMasterID: newValue.companyMasterID,
      operation: options.dbOperation,
      oldValue: {},
      newValue,
      tableName: WorkingArea.getTableName(),
      createBy,
      createByIp,
    };
  });
  await AuditLogs.bulkCreate(row, {
    transaction: options.transaction,
  });
  await options.transaction.commit();
});

WorkingArea.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

WorkingArea.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

WorkingArea.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
WorkingArea.belongsTo(UserMaster, {
  as: 'deleteByUserDetails',
  foreignKey: { name: 'deleteBy' },
});
module.exports = WorkingArea;
