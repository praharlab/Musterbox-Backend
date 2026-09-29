const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'designation';
const CompanyMaster = require('./companyMaster');
const AuditLogs = require('./auditLogs');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const UserMaster = require('./userMaster');

const Designation = sequelize.define(
  table_name,
  {
    designationId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    designationName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    jobdescription: {
      type: Sequelize.TEXT,
      allowNull: true,
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
  {
    indexes: [
      {
        unique: false,
        fields: ['designationName'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Designation.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

Designation.addHook('afterSave', async (designation, options) => {
  if (options.dbOperation === DatabaseOperationEnum.CREATE) {
    const newValue = designation.toJSON();
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
        tableName: Designation.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else if (options.dbOperation === DatabaseOperationEnum.UPDATE) {
    const oldValue = designation._previousDataValues;
    const newValue = designation.toJSON();
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
        tableName: Designation.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else if (options.dbOperation === DatabaseOperationEnum.DELETE) {
    const oldValue = designation._previousDataValues;
    const newValue = designation.toJSON();
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

    let addLog = await AuditLogs.create(
      {
        companyMasterID: oldValue.companyMasterID,
        operation: options.dbOperation,
        oldValue,
        newValue: {},
        tableName: Designation.getTableName(),
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

Designation.addHook('afterBulkCreate', async (designation, options) => {
  const row = designation.map((item) => {
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
      tableName: Designation.getTableName(),
      createBy,
      createByIp,
    };
  });
  await AuditLogs.bulkCreate(row, {
    transaction: options.transaction,
  });
  await options.transaction.commit();
});

Designation.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});

Designation.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
module.exports = Designation;
