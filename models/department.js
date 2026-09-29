const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const table_name = 'department';
const CompanyMaster = require('./companyMaster');
const AuditLogs = require('./auditLogs');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const UserMaster = require('./userMaster');

const Department = sequelize.define(
  table_name,
  {
    departmentId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    departmentName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    companyMasterID: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    status: {
      type: Sequelize.BIGINT,
      allowNull: false,
    },
    authorizationStatus: {
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
        fields: ['departmentName'],
      },
      {
        unique: false,
        fields: ['companyMasterID'],
      },
    ],
  }
);

Department.belongsTo(CompanyMaster, {
  foreignKey: { name: 'companyMasterID' },
});

Department.belongsTo(UserMaster, {
  as: 'createdByUserDetails',
  foreignKey: { name: 'createBy' },
});
Department.belongsTo(UserMaster, {
  as: 'updatedByUserDetails',
  foreignKey: { name: 'updateBy' },
});
// Department.sync({alter: true});

Department.addHook('afterSave', async (department, options) => {
  if (options.dbOperation === DatabaseOperationEnum.CREATE) {
    const newValue = department.toJSON();
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
        tableName: Department.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else if (options.dbOperation === DatabaseOperationEnum.UPDATE) {
    const oldValue = department._previousDataValues;
    const newValue = department.toJSON();
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
        tableName: Department.getTableName(),
        createBy,
        createByIp,
      },
      {
        transaction: options.transaction,
      }
    );

    await options.transaction.commit();
  } else if (options.dbOperation === DatabaseOperationEnum.DELETE) {
    const oldValue = department._previousDataValues;
    const newValue = department.toJSON();
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
        tableName: Department.getTableName(),
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

Department.addHook('afterBulkCreate', async (department, options) => {
  const row = department.map((item) => {
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
      tableName: Department.getTableName(),
      createBy,
      createByIp,
    };
  });
  await AuditLogs.bulkCreate(row, {
    transaction: options.transaction,
  });
  await options.transaction.commit();
});
module.exports = Department;
