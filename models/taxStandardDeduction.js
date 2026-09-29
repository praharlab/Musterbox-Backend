const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { RegimeType } = require('../utils/dbUtils');
const table_name = 'taxStandardDeduction';

const TaxStandardDeduction = sequelize.define(table_name, {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
    },
    financialYear: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    regime: {
        type: Sequelize.ENUM(...Object.values(RegimeType)),
        allowNull: false,
    },
    amount: {
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
    createByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    updateBy: {
        type: Sequelize.BIGINT,
        allowNull: true,
    },
    updateByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
    deleteBy: {
        type: Sequelize.INTEGER,
    },
    deleteByIp: {
        type: Sequelize.STRING,
        allowNull: true,
    },
}, {
    paranoid: true,
    // Composite key which makes sure that combination of financialYear and regime is always unique
    indexes: [
        {
            unique: true,
            fields: ['financialYear', 'regime'],
            where: { deletedAt: null },
        },
    ],
});


TaxStandardDeduction.addHook("beforeValidate", async (taxStandardDeduction, options) => {
    if (!taxStandardDeduction.financialYear || !taxStandardDeduction.regime) return;

    const whereCondition = {
        financialYear: taxStandardDeduction.financialYear,
        regime: taxStandardDeduction.regime,
        deletedAt: { [Sequelize.Op.is]: null },
    };

    // Exclude the current record if it's an update
    if (taxStandardDeduction.id) {
        whereCondition.id = { [Sequelize.Op.ne]: taxStandardDeduction.id };
    }

    const existingRecord = await TaxStandardDeduction.findOne({
        where: whereCondition,
    });

    if (existingRecord) {
        throw new Error(
            `A Tax Rebate already exists for Financial Year :'${taxStandardDeduction.financialYear || ''}' and ${taxStandardDeduction.regime}.`
        );
    }
});

TaxStandardDeduction.addHook('beforeCreate', (TaxStandardDeduction, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    TaxStandardDeduction.createBy = options.user.userMasterId;
    TaxStandardDeduction.createByIp = options.user.userIpAddress;
});

TaxStandardDeduction.addHook('beforeUpdate', (TaxStandardDeduction, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    TaxStandardDeduction.updateBy = options.user.userMasterId;
    TaxStandardDeduction.updateByIp = options.user.userIpAddress;
});

TaxStandardDeduction.addHook('beforeDestroy', (TaxStandardDeduction, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    TaxStandardDeduction.deleteBy = options.user.userMasterId;
    TaxStandardDeduction.deleteByIp = options.user.userIpAddress;
});


module.exports = TaxStandardDeduction;
