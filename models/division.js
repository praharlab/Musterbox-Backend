const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMaster = require('./companyMaster');
const AuditLogs = require('./auditLogs');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const UserMaster = require('./userMaster');

const Division = sequelize.define(
  'division',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    divisionName: {
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

Division.addHook('beforeCreate', (division, options) => {
  // Set createBy, updateBy, and ipAddress based on the authenticated user
  division.createBy = options.user.userMasterId;
  division.updateBy = options.user.userMasterId;
  division.createByIp = options.user.userIpAddress;
  division.updateByIp = options.user.userIpAddress;
});

Division.addHook('beforeUpdate', (division, options) => {
  // Set updateBy and ipAddress based on the authenticated user
  division.updateBy = options.user.userMasterId;
  division.ipAddress = options.user.userIpAddress;
  division.updateByIp = options.user.userIpAddress;
});

Division.addHook('beforeDestroy', (division, options) => {
  // Set deleteBy and ipAddress based on the authenticated user
  division.deleteBy = options.user.userMasterId;
  division.deleteByIp = options.user.userIpAddress;
});

Division.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

Division.addHook('afterSave', async (division, options) => {
  if (options.dbOperation === DatabaseOperationEnum.CREATE) {
    const newValue = division.toJSON();
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
        tableName: Division.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else {
    const oldValue = division._previousDataValues;
    const newValue = division.toJSON();
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
        tableName: Division.getTableName(),
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

Division.addHook('afterDestroy', async (division, options) => {
  const oldValue = division._previousDataValues;
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
      tableName: Division.getTableName(),
      createBy,
      createByIp,
    },
    {
      transaction: options.transaction,
    }
  );

  await options.transaction.commit();
});

Division.addHook('afterBulkCreate', async (division, options) => {
  const row = division.map((item) => {
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
      tableName: Division.getTableName(),
      createBy,
      createByIp,
    };
  });
  await AuditLogs.bulkCreate(row, {
    transaction: options.transaction,
  });
  await options.transaction.commit();
});

Division.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

Division.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
Division.belongsTo(UserMaster, {
  as: 'deleteByUserDetails',
  foreignKey: { name: 'deleteBy' },
});
module.exports = Division;
