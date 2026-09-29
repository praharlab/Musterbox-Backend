const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const BonusPolicy = require('../models/bonusPolicy');
const { bonusCreditTypeEnum } = require('../utils/dbUtils');
const { usermessage } = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const EmployeeBonusPolicy = require('../models/employeeBonusPolicy');
const { generateExcel } = require('../utils/exportData');

exports.addData = async (req, res, next) => {
    try {

        const { bonusPolicyName, bonusCycle, bonusCreditType, payInSalary, companyMasterID } = req.body;
        let { bonusCreditCycle } = req.body;

        const find_SameData = await BonusPolicy.findOne({
            where: Sequelize.and(
                Sequelize.where(
                    sequelize.fn(
                        'TRIM',
                        sequelize.fn('LOWER', sequelize.col('bonusPolicyName'))
                    ),
                    String(bonusPolicyName).trim().toLowerCase()
                ),
                Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
                Sequelize.or(
                    Sequelize.where(sequelize.col('status'), 0),
                    Sequelize.where(sequelize.col('status'), 1)
                )
            ),
        });

        if (find_SameData)
            return res.status(200).json({
                status: 401,
                message: `Bonus Policy name '${bonusPolicyName}' already exists. Please choose another.`,
            });

        if (bonusCreditType == bonusCreditTypeEnum.PREVIOUS) bonusCreditCycle = null;


        await BonusPolicy.create({
            bonusPolicyName, bonusCycle, bonusCreditType, bonusCreditCycle, payInSalary, companyMasterID
        }, { user: req.userDetails });

        return res.status(200).json({
            status: 200,
            message: usermessage.addMessage('Bonus Policy')
        });

    } catch (error) {
        next(error);
    }
}

exports.updateData = async (req, res, next) => {
    try {

        const { bonusPolicyName, bonusCycle, bonusCreditType, payInSalary, companyMasterID } = req.body;
        let { bonusCreditCycle } = req.body;
        const { id } = req.params;

        const find_SameData = await BonusPolicy.findOne({
            where: Sequelize.and(
                Sequelize.where(
                    sequelize.fn(
                        'TRIM',
                        sequelize.fn('LOWER', sequelize.col('bonusPolicyName'))
                    ),
                    String(bonusPolicyName).trim().toLowerCase()
                ),
                Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
                Sequelize.or(
                    Sequelize.where(sequelize.col('status'), 0),
                    Sequelize.where(sequelize.col('status'), 1)
                ),
                Sequelize.where(sequelize.col('bonusPolicyId'), {
                    [Sequelize.Op.ne]: id,
                })
            ),
        });

        if (find_SameData)
            return res.status(200).json({
                status: 401,
                message: `Bonus Policy name '${bonusPolicyName}' already exists. Please choose another.`,
            });

        const bonusPolicy = await BonusPolicy.findByPk(id);

        if (!bonusPolicy)
            return res.status(200).json({
                status: 401,
                message: usermessage.deletedrecord,
            });

        if (bonusCreditType == bonusCreditTypeEnum.PREVIOUS) bonusCreditCycle = null;

        bonusPolicy.bonusPolicyName = bonusPolicyName;
        bonusPolicy.bonusCycle = bonusCycle;
        bonusPolicy.bonusCreditType = bonusCreditType;
        bonusPolicy.bonusCreditCycle = bonusCreditCycle;
        bonusPolicy.payInSalary = payInSalary;
        bonusPolicy.companyMasterID = companyMasterID;

        await bonusPolicy.save({
            user: req.userDetails,
        });

        return res.status(200).json({
            status: 200,
            message: usermessage.updateMessage('Bonus Policy'),
        });

    } catch (error) {
        next(error);
    }
}

// get all data api
exports.listdata = async (req, res, next) => {
    try {
        const { page, limit, searchQuery, companyMasterID, Export } = req.body;

        const condition = {};

        if (companyMasterID) condition.companyMasterID = companyMasterID;

        if (searchQuery)
            condition[Sequelize.Op.or] = [
                {
                    bonusPolicyName: {
                        [Sequelize.Op.iLike]: `%${searchQuery}%`,
                    },
                },
            ];

        const paginationQuery = !Export
            ? page && limit
                ? { offset: (page - 1) * limit, limit }
                : {}
            : {};

        const { rows, count } = await BonusPolicy.findAndCountAll({
            where: condition,
            ...paginationQuery,
            include: [
                {
                    model: companyMaster,
                    attributes: ['companyName'],
                },
                {
                    model: UserMaster,
                    as: 'createdBy',
                    attributes: userAttributes,
                },
                {
                    model: UserMaster,
                    as: 'updatedBy',
                    attributes: userAttributes,
                },
            ],
            order: [['bonusPolicyId', 'DESC']],

        });

        if (Export) {
            const finaldata = rows.map((e) => {
                return {
                    'Bonus Policy Name': e.bonusPolicyName,
                    'Company Name': e.companyMaster?.companyName || '',
                    'Bonus Cycle': e.bonusCycle,
                    'Bonus CreditType': e.bonusCreditType,
                    'Bonus CreditCycle': e.bonusCreditCycle || '',
                    'Pay In Salary': e.payInSalary ? 'Yes' : 'No',
                    'Status': e.status == 0 ? 'Deactive' : 'Active',
                    'createdBy': e.createdBy?.displayName || '',
                    'createdAt': asiaKolkataDateTime(e.createdAt),
                    'updatedBy': e.updatedBy?.displayName || '',
                    'updatedAt': e.updateBy ? asiaKolkataDateTime(e.updatedAt) : '',
                };
            });

            return await generateExcel(finaldata, 'Bonus Policy', 'xlsx', res);
        }

        return res.status(200).json({ status: 200, data: rows, totalcount: count });
    } catch (error) {
        next(error);
    }
};

// get by id
exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const Data = await BonusPolicy.findOne({
            where: {
                bonusPolicyId: id,
            },
            include: [
                {
                    model: companyMaster,
                    attributes: ['companyMasterID', 'companyName'],
                },
            ],
        });

        return res.status(200).json({ status: 200, data: Data });
    } catch (err) {
        next(err);
    }
};


// delete api
exports.deletedata = async (req, res, next) => {
    try {
        const { id } = req.params;

        const findBonusPolicy =
            await EmployeeBonusPolicy.findOne({
                where: {
                    bonusPolicyId: id,
                },
            });

        if (findBonusPolicy)
            return res.status(200).json({
                status: 401,
                message:
                    'Bonus Policy already assigned to employees.So,you can not delete it',
            });

        const findData = await BonusPolicy.findByPk(id);

        if (!findData) {
            return res.status(200).json({
                status: 401,
                message: 'Attendance Bonus Policy not found!',
            });
        }

        // Perform deletion
        await findData.destroy({
            user: req.userDetails,
        });

        return res.status(200).json({
            status: 200,
            message: usermessage.deleteMessage('Bonus Policy'),
        });
    } catch (error) {
        next(error);
    }
};

// active,deactive
exports.poststatuschange = async (req, res, next) => {
    try {
        let { bonusPolicyId, status } = await req.body;

        if (![0, 1].includes(+status))
            return res.status(200).json({
                status: 401,
                message: 'status is not valid!',
            });

        const findBonusPolicy =
            await EmployeeBonusPolicy.findOne({
                where: {
                    bonusPolicyId,
                },
            });

        if (findBonusPolicy && status == 0) {
            return res.status(200).json({
                status: 401,
                message:
                    'Bonus Policy already assigned to employees.So,you can not deactivate it',
            });
        }

        const findData = await BonusPolicy.findByPk(
            bonusPolicyId
        );

        findData.status = status;

        await findData.save({
            user: req.userDetails,
        });

        return res.status(200).json({
            status: 200,
            message:
                status == '1'
                    ? usermessage.activeMessage('Bonus Policy')
                    : usermessage.deactiveMessage('Bonus Policy'),
        });
    } catch (err) {
        next(err);
    }
};

exports.getActiveBonusPolicyByCompanyId = async (req, res, next) => {
    try {
        const bonusPolicy = await BonusPolicy.findAll({
            where: {
                companyMasterID: req.params.id,
                status: 1,
            },
        });

        return res.status(200).json({ status: 200, data: bonusPolicy });
    } catch (err) {
        next(err);
    }
};

