const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { RegimeType } = require('../utils/dbUtils');
const table_name = 'taxRebate';

const TaxRebate = sequelize.define(table_name, {
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
        type:Sequelize.ENUM(...Object.values(RegimeType)),
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


TaxRebate.addHook("beforeValidate", async (taxRebate, options) => {
    if (!taxRebate.financialYear || !taxRebate.regime) return;

    const whereCondition = {
        financialYear: taxRebate.financialYear,
        regime: taxRebate.regime,
        deletedAt: { [Sequelize.Op.is]: null },
    };

    // Exclude the current record if it's an update
    if (taxRebate.id) {
        whereCondition.id = { [Sequelize.Op.ne]: taxRebate.id };
    }

    const existingRecord = await TaxRebate.findOne({
        where: whereCondition,
    });

    if (existingRecord) {
        throw new Error(
            `A Tax Rebate already exists for Financial Year :'${taxRebate.financialYear || ''}' and ${taxRebate.regime}.`
        );
    }
});

TaxRebate.addHook('beforeCreate', (TaxRebate, options) => {
    // Set createBy, updateBy, and ipAddress based on the authenticated user
    TaxRebate.createBy = options.user.userMasterId;
    TaxRebate.createByIp = options.user.userIpAddress;
});

TaxRebate.addHook('beforeUpdate', (TaxRebate, options) => {
    // Set updateBy and ipAddress based on the authenticated user
    TaxRebate.updateBy = options.user.userMasterId;
    TaxRebate.updateByIp = options.user.userIpAddress;
});

TaxRebate.addHook('beforeDestroy', (TaxRebate, options) => {
    // Set deleteBy and ipAddress based on the authenticated user
    TaxRebate.deleteBy = options.user.userMasterId;
    TaxRebate.deleteByIp = options.user.userIpAddress;
});

module.exports = TaxRebate;
