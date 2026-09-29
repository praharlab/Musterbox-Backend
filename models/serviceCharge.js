const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("./userMaster");
const Contractor = require("./contractor");

const table_name = "serviceCharge";

const ServiceCharge = sequelize.define(
  table_name,
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    contractorId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    applicableYYYYMM: {
      type: Sequelize.INTEGER,
      allowNull: false,
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
    deleteBy: {
      type: Sequelize.BIGINT,
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
    deletedAt: {
      type: Sequelize.DATE,
    },
  },
  {
    paranoid: true, // Enables soft delete
    indexes: [
      {
        unique: true,
        fields: ["contractorId", "applicableYYYYMM"],
        where: {
          deletedAt: null, // Sequelize doesn't support this directly
        },
      },
    ],
  }
);

// Ensure uniqueness for contractorId & applicableYYYYMM where deletedAt is NULL


ServiceCharge.addHook("beforeValidate", async (serviceCharge, options) => {
    if (!serviceCharge.contractorId || !serviceCharge.applicableYYYYMM) return;
  
    const whereCondition = {
      contractorId: serviceCharge.contractorId,
      applicableYYYYMM: serviceCharge.applicableYYYYMM,
      deletedAt: { [Sequelize.Op.is]: null },
    };
  
    // Exclude the current record if it's an update
    if (serviceCharge.id) {
      whereCondition.id = { [Sequelize.Op.ne]: serviceCharge.id };
    }
  
    const existingRecord = await ServiceCharge.findOne({
      where: whereCondition,
      include: [{ model: Contractor, attributes: ["contractorName"] }],
    });
  
    if (existingRecord) {
      throw new Error(
        `A service charge already exists for contractor '${existingRecord.contractor?.contractorName || ''}' in month ${serviceCharge.applicableYYYYMM}.`
      );
    }
  });
  

// Auto-set createdBy and updatedBy before insert
ServiceCharge.addHook("beforeCreate", (serviceCharge, options) => {
  serviceCharge.createBy = options.user.userMasterId;
  serviceCharge.updateBy = options.user.userMasterId;
  serviceCharge.createByIp = options.user.userIpAddress;
  serviceCharge.updateByIp = options.user.userIpAddress;
});

// Auto-set updatedBy before update
ServiceCharge.addHook("beforeUpdate", (serviceCharge, options) => {
  serviceCharge.updateBy = options.user.userMasterId;
  serviceCharge.updateByIp = options.user.userIpAddress;
});

// Auto-set deleteBy before soft delete
ServiceCharge.addHook("beforeDestroy", (serviceCharge, options) => {
  serviceCharge.deleteBy = options.user.userMasterId;
  serviceCharge.deleteByIp = options.user.userIpAddress;
});

// Associations
ServiceCharge.belongsTo(Contractor, { foreignKey: { name: "contractorId" } });

ServiceCharge.belongsTo(UserMaster, {
  foreignKey: { name: "createBy" },
  as: "createdByUser",
});
ServiceCharge.belongsTo(UserMaster, {
  foreignKey: { name: "updateBy" },
  as: "updatedByUser",
});
ServiceCharge.belongsTo(UserMaster, {
  foreignKey: { name: "deleteBy" },
  as: "deletedByUser",
});

Contractor.hasMany(ServiceCharge, { foreignKey: { name: "contractorId" } });


module.exports = ServiceCharge;
