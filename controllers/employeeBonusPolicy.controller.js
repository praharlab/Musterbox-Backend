const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const EmployeeBonusPolicy = require('../models/employeeBonusPolicy');
const { findNearestNumbers, getPreviousMonth, asiaKolkataDateTime, accessibleUsers, month_dict } = require('../utils/commonUtilFunctions');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');
const companyMaster = require('../models/companyMaster');
const BonusPolicy = require('../models/bonusPolicy');

exports.addData = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { userMasterID, bonusPolicyId, applicableYYYYMM } = req.body;

        const allBonusPolicyData = await EmployeeBonusPolicy.findAll({
            where: {
                userMasterID: {
                    [Sequelize.Op.in]: userMasterID,
                },
            },
        });


        const ToAddArray = [];

        for (const userId of userMasterID) {
            const userBonusPolicyData = allBonusPolicyData.filter(
                (e) => +e.userMasterID == +userId
            );

            if (!userBonusPolicyData.length) {
                ToAddArray.push({
                    userMasterID: userId,
                    applicableYYYYMM,
                    bonusPolicyId,
                });
                continue;
            }

            // find data of same applicable month
            const sameMonthData = userBonusPolicyData.find(
                (e) => +e.applicableYYYYMM == +applicableYYYYMM
            );

            if (sameMonthData) {
                await EmployeeBonusPolicy.update(
                    {
                        bonusPolicyId,
                    },
                    {
                        where: { id: sameMonthData.id },
                        user: req.userDetails,
                        individualHooks: true,
                        transaction,
                    }
                );

                continue;
            }

            const applicableYYYYMMArray = userBonusPolicyData.map(
                (e) => e.applicableYYYYMM
            );

            const { past, future } = findNearestNumbers(
                applicableYYYYMMArray,
                applicableYYYYMM
            );

            // update the past records if available--
            if (past) {
                await EmployeeBonusPolicy.update(
                    {
                        endYYYYMM: getPreviousMonth(+applicableYYYYMM),
                    },
                    {
                        where: {
                            applicableYYYYMM: +past,
                            userMasterID: userId,
                        },
                        transaction,
                        user: req.userDetails,
                        individualHooks: true,
                    }
                );
            }

            // if future record is not available
            if (!future) {
                ToAddArray.push({
                    userMasterID: userId,
                    applicableYYYYMM,
                    bonusPolicyId,
                });
                continue;
            }

            // if future record is available
            ToAddArray.push({
                userMasterID: userId,
                bonusPolicyId,
                applicableYYYYMM,
                endYYYYMM: getPreviousMonth(+future),
            });
        }

        await EmployeeBonusPolicy.bulkCreate(ToAddArray, {
            user: req.userDetails,
            individualHooks: true,
            transaction,
        });
        await transaction.commit();
        return res.status(200).json({
            status: 200,
            message: usermessage.addMessage("Employee Bonus Policy"),
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

exports.getByUserId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bonusPolicyData = await EmployeeBonusPolicy.findAll({
            where: {
                userMasterID: id,
            },
            order: [["applicableYYYYMM", "ASC"]],
            include: [
                {
                    model: UserMaster,
                    as: 'createdBy',
                    attributes: userAttributes,
                },
                {
                    model: BonusPolicy,
                    include: [{ model: UserMaster, as: 'createdBy', attributes: userAttributes }, { model: UserMaster, as: 'updatedBy', attributes: userAttributes }]
                }
            ],
        });

        const date = asiaKolkataDateTime(new Date()).slice(0, 10);
        const YYYYMM = String(date).slice(0, 4) + String(date).slice(5, 7);

        for (const bonusPolicy of bonusPolicyData) {
            let showDelete = false;

            if (
                +bonusPolicy.applicableYYYYMM <= +YYYYMM &&
                (+bonusPolicy.endYYYYMM >= +YYYYMM || !bonusPolicy.endYYYYMM)
            )
                showDelete = true;

            if (+bonusPolicy.applicableYYYYMM >= +YYYYMM) showDelete = true;
            bonusPolicy.dataValues.showDelete = showDelete;
            bonusPolicy.dataValues.applicableYYYYMM =
                month_dict[String(bonusPolicy.applicableYYYYMM).slice(4, 6)] +
                " " +
                String(bonusPolicy.applicableYYYYMM).slice(0, 4);
            if (bonusPolicy.endYYYYMM)
                bonusPolicy.dataValues.endYYYYMM =
                    month_dict[String(bonusPolicy.endYYYYMM).slice(4, 6)] +
                    " " +
                    String(bonusPolicy.endYYYYMM).slice(0, 4);
        }

        return res.status(200).json({ status: 200, data: bonusPolicyData });
    } catch (error) {
        next(error);
    }
};

exports.delete = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { id, userMasterID } = req.body;

        const allData = await EmployeeBonusPolicy.findAll({
            where: {
                userMasterID,
            },
        });

        const currentData = allData.find((e) => e.id == id);

        if (!currentData) throw new Error("Data not found!");

        // filter data with out current data
        const userBonusPolicyData = allData.filter((e) => e.id != id);

        const applicableYYYYMMArray = userBonusPolicyData.map(
            (e) => e.applicableYYYYMM
        );

        const { past, future } = findNearestNumbers(
            applicableYYYYMMArray,
            currentData.applicableYYYYMM
        );

        if (past) {
            let endYYYYMM = null;
            if (future) {
                endYYYYMM = getPreviousMonth(+future);
            }

            await EmployeeBonusPolicy.update(
                {
                    endYYYYMM,
                },
                {
                    where: {
                        applicableYYYYMM: +past,
                        userMasterID,
                    },
                    transaction,
                    user: req.userDetails,
                    individualHooks: true,
                }
            );
        }

        await currentData.destroy({
            user: req.userDetails,
            individualHooks: true,
            transaction,
        });

        await transaction.commit();
        return res.status(200).json({
            status: 200,
            message: usermessage.deleteMessage("Employee Bonus Policy"),
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
};

exports.getAllEmployeeBonusPolicy = async (req, res, next) => {
    try {
        const { page, limit, search, companyMasterID } = req.body;

        const condition = {};

        if (search)
            condition[Sequelize.Op.or] = [
                { displayName: { [Sequelize.Op.iLike]: "%" + search + "%" } },
                { userNumber: { [Sequelize.Op.iLike]: "%" + search + "%" } },
                {
                    "$companyMaster.companyName$": {
                        [Sequelize.Op.iLike]: "%" + search + "%",
                    },
                },
            ];

        if (companyMasterID)
            condition.companyMasterId =
                req.userDetails.accessibleCompanies.length > 0
                    ? req.userDetails.accessibleCompanies
                    : req.userDetails.companyMasterId;

        condition.status = 1;

        const paginatecondition =
            page && limit ? { offset: (page - 1) * limit, limit } : {};

        const { rows: userData, count } = await UserMaster.findAndCountAll({
            where: condition,
            ...paginatecondition,
            ...accessibleUsers(req.userDetails, false),
            include: [
                {
                    model: EmployeeBonusPolicy,
                    required: false,
                    include: [{ model: BonusPolicy, attributes: ['bonusPolicyName'] }]
                },
                {
                    model: companyMaster,
                    attributes: ["companyName"],
                    required: true
                },
            ],
            order: [["displayName", "ASC"]],
            attributes: [
                "displayName",
                "userNumber",
                "photo",
                "firstName",
                "lastName",
            ],
        });

        return res.status(200).json({
            status: 200,
            data: userData,
            totalcount: count,
        });
    } catch (error) {
        next(error);
    }
};
