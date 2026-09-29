const { Op, where } = require("sequelize");
const AllocateOfficeExpenseRights = require("../models/allocateOfficeExpense");
const BranchMaster = require("../models/branchMaster");
const UserMaster = require("../models/userMaster");
const message = require('../response_message/message');
const { statusCodes, userAttributes } = require("../utils/commonVars");
const Site = require("../models/site");
const { generateExcel } = require("../utils/exportData");

exports.addOfficeExpenseAllocationRights = async (req, res, next) => {
    try {
        const { branchMasterID, siteID, userMasterID } = req.body;

        if (!branchMasterID || !userMasterID) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: message.errorMessage.INVALID_FILTER_FIELDS });
        }

        const condition = {};
        if(branchMasterID) condition.branchMasterID = branchMasterID;
        if(siteID) condition.siteID = siteID;

        const existData = await AllocateOfficeExpenseRights.findOne({
            where: condition
        })

        if (existData) {
            return res.status(statusCodes.BAD_REQUEST).json({
                status: statusCodes.BAD_REQUEST,
                message: message.usermessage.alreadyExists('Office Expense Allocation Rights')
            })
        }

        await AllocateOfficeExpenseRights.create({
            branchMasterID,
            siteID,
            userMasterID
        }, {
            user: req.userDetails
        })

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: message.usermessage.addMessage('Office Expense Allocation Rights')
        })
    } catch (error) {
        next(error);
    }
}

exports.getAllOfficeExpenseAllocationRights = async (req, res, next) => {
    try {
        const { branchMasterID, siteID, page, limit, exportData, companyMasterID } = req.body;
        let { userMasterID } = req.body;

        userMasterID = Array.isArray(userMasterID) ? userMasterID : [userMasterID];
        userMasterID = userMasterID.filter(x => x != null);

        const paginationQuery = page && limit ? {
            offset: (page - 1) * limit,
            limit: limit
        } : {}

        const condition = {};
        if (branchMasterID && !siteID)
            condition.branchMasterID = branchMasterID;
        if (siteID)
            condition.siteID = siteID;
        if (userMasterID.length > 0)
            condition.userMasterID = {
                [Op.overlap]: userMasterID
            };

        const companyCondition = companyMasterID ? { companyMasterID } : {}

        const { rows, count } = await AllocateOfficeExpenseRights.findAndCountAll({
            where: condition,
            ...paginationQuery,
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: BranchMaster,
                    required: true,
                    where: companyCondition
                },
                {
                    model: Site,
                    required: false,
                    where: companyCondition
                },
                {
                    model: UserMaster,
                    attributes: ['displayName']
                },
                {
                    model: UserMaster,
                    as: 'createdBy',
                    attributes: ['displayName']
                },
                {
                    model: UserMaster,
                    as: 'updatedBy',
                    attributes: ['displayName']
                },
            ],
        })

        if(exportData){
            const excelData = data.map((x) => ({
                'Branch Name': x?.branchMaster?.branchName ? x?.branchMaster?.branchName : '',
                'Site Name': x?.site?.siteName ? x?.site?.siteName : '',
                'Assigned User': x?.userMaster.displayName,
            }))

            return await generateExcel(excelData, 'Allocate Office Expense Right', 'xlsx', res);
        }

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            data: rows,
            totalcount: count
        });

    } catch (error) {
        next(error);
    }
}

exports.getOfficeExpenseAllocationRightsByID = async (req, res, next) => {
    try {
        const allocateOfficeExpenseRightsID = req.params.id;

        if (!allocateOfficeExpenseRightsID) return res.status(statusCodes.BAD_REQUEST).json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

        const data = await AllocateOfficeExpenseRights.findOne({
            where: {
                allocateOfficeExpenseRightsID
            },
            include: [
                {
                    model: BranchMaster
                },
                {
                    model: Site
                }
            ]
        });

        data.dataValues.branchMasterID = data?.site ? +data?.site.branchMasterID : data?.branchMasterID;
        data.dataValues.companyMasterID = data?.site ? +data?.site.companyMasterID : data?.branchMaster.companyMasterID;

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            data: data
        })

    } catch (error) {
        next(error);
    }
}

exports.updateOfficeExpenseAllocationRights = async (req, res, next) => {
    try {
        const { allocateOfficeExpenseRightsID, branchMasterID, siteID, userMasterID } = req.body;

        if (!allocateOfficeExpenseRightsID || !branchMasterID || !userMasterID) return res.status(statusCodes.BAD_REQUEST).json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

        const findData = await AllocateOfficeExpenseRights.findOne({
            where: {
                allocateOfficeExpenseRightsID
            }
        })

        if (!findData) {
            return res.status(200).json({
                status: 401,
                message: message.usermessage.notFoundMessage(
                    'Office Expense Allocation Rights'
                ),
            });
        }

        const condition = {
            allocateOfficeExpenseRightsID: {
                [Op.ne]: allocateOfficeExpenseRightsID
            }
        }

        if (branchMasterID)
            condition.branchMasterID = branchMasterID;

        if (siteID)
            condition.siteID = siteID;

        const existData = await AllocateOfficeExpenseRights.findOne({
            where: condition
        })

        if (existData) {
            return res.status(statusCodes.BAD_REQUEST).json({
                status: statusCodes.BAD_REQUEST,
                message: message.usermessage.alreadyExists('Office Expense Allocation Rights')
            })
        }

            findData.branchMasterID = branchMasterID ? branchMasterID : null;
            findData.siteID = siteID ? siteID : null;
            findData.userMasterID = userMasterID;

        await findData.save({
            user: req.userDetails
        })

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: message.usermessage.updateMessage('Office Expense Allocation Rights')
        })

    } catch (error) {
        next(error);
    }
}

exports.deleteOfficeExpenseAllocationRights = async (req, res, next) => {
    try {
        const allocateOfficeExpenseRightsID = req.params.id;

        if (!allocateOfficeExpenseRightsID) return res.status(statusCodes.BAD_REQUEST).json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

        const existData = await AllocateOfficeExpenseRights.findOne({
            where: {
                allocateOfficeExpenseRightsID: allocateOfficeExpenseRightsID
            }
        })

        if (!existData) {
            return res.status(statusCodes.NOT_FOUND).json({
                status: statusCodes.NOT_FOUND,
                message: message.usermessage.notFoundMessage(
                    'Office Expense Allocation Rights'
                ),
            });
        }

        if (existData) {
            await existData.destroy({
                user: req.userDetails
            })
        }

        return res.status(statusCodes.OK).json({
            message: message.usermessage.deleteMessage('Office Expense Allocation Rights'),
            status: statusCodes.OK
        })
    } catch (error) {
        next(error)
    }
}

exports.getAllAssignedBranchByUser = async(req, res, next) => {
    try {
        const { userMasterID } = req.body;
        const data = await AllocateOfficeExpenseRights.findAll({
            where: {
                userMasterID,
                siteID: {
                    [Op.eq]: null
                }
            },
            include: [
                {
                    model: BranchMaster,
                    required: true,
                    attributes: ['branchMasterID', 'branchName']
                }
            ]
        })

        const allBranches = data?.map((x) => x?.branchMaster);

        return res.status(statusCodes.OK).json({
            data: allBranches,
            status: statusCodes.OK
        })
    } catch (error) {
        next(error);
    }
}

exports.getAllAssignedSiteByUser = async(req, res, next) => {
    try {
        const { branchMasterID, userMasterID } = req.body;

        const condition = {};
        if(branchMasterID){
            condition.branchMasterID = branchMasterID
        }else{
            condition.branchMasterID = {
                [Op.ne]: null
            }
        }

        const data = await AllocateOfficeExpenseRights.findAll({
            where: {
                userMasterID,
                siteID: {
                    [Op.ne] : null
                },
                ...condition
            },
            include: [
                {
                    model: Site,
                    attributes: ['siteID', 'siteName'],
                }
            ]
        })

        const allSites = data.map((x) => x?.site)

        return res.status(statusCodes.OK).json({
            data: allSites,
            status: statusCodes.OK
        })
    } catch (error) {
        next(error);
    }
}

exports.getAssignedUsersByBranchAndSite = async(req, res, next) => {
    try {
        const { branchMasterID, siteID } = req.body;
        const condition = {};

        if(branchMasterID) condition.branchMasterID = branchMasterID;
        if (siteID) {
            condition.siteID = siteID;
        } else {
            condition.siteID = {
                [Op.eq]: null
            }
        }

        const data = await AllocateOfficeExpenseRights.findAll({
            where: condition,
            attributes: ['userMasterID'],
            include: [
                {
                    model: UserMaster,
                    attributes: userAttributes
                }
            ]
        })

        const assignedUsers = data.map((x) => x?.userMaster);

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            data: assignedUsers
        })
    } catch (error) {
        next(error);
    }
}