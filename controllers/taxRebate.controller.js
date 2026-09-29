const sequelize = require("../config/database");
const Sequelize = require("sequelize");
const { usermessage } = require("../response_message/message");
const TaxRebate = require("../models/taxRebate");

exports.addData = async (req, res, next) => {
    try {
        const { financialYear, regime, amount } = req.body;

        if (!financialYear || !regime || !amount) {
            return res.status(200).json({
                status: 401,
                message: usermessage.ValidParameters,
            });
        }

        await TaxRebate.create(
            {
                financialYear,
                regime,
                amount,
            },
            {
                user: req.userDetails,
            }
        );

        return res.status(200).json({
            status: 200,
            message: usermessage.addMessage("Tax Rebate"),
        });
    } catch (error) {
        next(error);
    }
};

exports.updateData = async (req, res, next) => {
    try {
        const { financialYear, regime, amount } = req.body;
        const { id } = req.params;

        if (!financialYear || !regime || !amount || !id) {
            return res.status(200).json({
                status: 401,
                message: usermessage.ValidParameters,
            });
        }

        const data = await TaxRebate.findByPk(id);

        if (!data) throw new Error("data not found!");

        data.financialYear = financialYear;
        data.regime = regime;
        data.amount = amount;

        await data.save({
            user: req.userDetails,
        });

        return res.status(200).json({
            status: 200,
            message: usermessage.updateMessage("Tax Rebate"),
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteData = async (req, res, next) => {
    try {
        const { id } = req.params;

        const data = await TaxRebate.findByPk(id);

        if (!data) throw new Error("data not found!");

        await data.destroy({
            user: req.userDetails,
        });

        return res.status(200).json({
            status: 200,
            message: usermessage.deleteMessage("Tax Rebate"),
        });
    } catch (error) {
        next(error);
    }
};

exports.listData = async (req, res, next) => {
    try {
        const { page, limit, search } = req.body;

        const paginateCondition =
            page && limit ? { offset: (page - 1) * limit, limit } : {};

        const condition = {};

        if (search) {
            condition[Sequelize.Op.or] = [
                {
                    financialYear: {
                        [Sequelize.Op.iLike]: `%${search}%`,
                    },
                },
            ];
        }

        const { rows: data, count } = await TaxRebate.findAndCountAll({
            where: condition,
            ...paginateCondition,
        });

        return res.status(200).json({
            status: 200,
            data,
            totalcount: count
        });

    } catch (error) {
        next(error);
    }
};

exports.getById = async (req, res, next) => {
    try {

        const { id } = req.params;

        const data = await TaxRebate.findByPk(id);

        return res.status(200).json({
            status: 200,
            data,
        });

    } catch (error) {
        next(error);
    }
}
