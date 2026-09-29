const { Op } = require("sequelize");
const AuthorizationCriteriaMaster = require("../models/authorizationCriteriaMaster");
const BranchMaster = require("../models/branchMaster");
const OrganizationAuthorization = require("../models/organizationAuthorization");
const OrgAuthorizationType = require("../models/orgAuthorizationType");
const UserMaster = require("../models/userMaster");
const message = require('../response_message/message');
const { userAttributes, statusCodes } = require("../utils/commonVars");
const { generateExcel } = require("../utils/exportData");
const moment = require('moment');
const Site = require("../models/site");
const OfficeExpense = require("../models/officeExpense");
const OfficeExpenseTransaction = require("../models/officeExpenseTransaction");
const OfficeExpenseAuthorizationRequest = require("../models/officeExpenseAuthorization");
const { authorizationCriteriaType } = require("../utils/dbUtils");
const UserInbox = require("../models/UserInbox");
const sequelize = require('../config/database');
const companyMaster = require("../models/companyMaster");

exports.addOrganizationAuthorization = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { siteID, AuthorizedByUserMasterId, orgAuthorizationTypeID, AuthorizationCriteriaID, SequenceNo } = req.body;
        let { branchMasterID } = req.body;

        if(AuthorizationCriteriaID == authorizationCriteriaType.ANYTWO &&  AuthorizedByUserMasterId.length < 2){
            return res.status(200).json({
                status: 401,
                message: 'Please select atleast 2 Authorizers!'
            })
        }

        if(AuthorizationCriteriaID == authorizationCriteriaType.ANYTHREE &&  AuthorizedByUserMasterId.length < 3){
            return res.status(200).json({
                status: 401,
                message: 'Please select atleast 3 Authorizers!'
            })
        }

        const condition = {}

        if (orgAuthorizationTypeID) condition.orgAuthorizationTypeID = orgAuthorizationTypeID
        if (siteID) condition.siteID = siteID
        if (branchMasterID) {
            condition.branchMasterID = {
                [Op.in]: branchMasterID
            }
        }

        const existData = await OrganizationAuthorization.findAll({
            where: condition,
            include: [
                {
                    model: BranchMaster,
                    attributes: ['branchName']
                },
                {
                    model: Site,
                    attributes: ['siteName']
                },
            ]
        })

        if (existData.length > 0) {
            const orgType = siteID ? ' Site Name ' : ' Branch Name ';
            await transaction.rollback();
            return res.status(statusCodes.OK).json({
                status: 401,
                message: message.usermessage.alreadyExists(
                    'Organization Authorization with' + orgType
                ),
            });
        }

        let siteData;
        if(siteID){
            siteData = await Site.findOne({
                where: {
                    siteID
                }
            })

            branchMasterID = siteData.branchMasterID;
        }

        let authorizationData;

        if (siteID) {
            authorizationData = await OrganizationAuthorization.create({
                branchMasterID,
                AuthorizedByUserMasterId,
                orgAuthorizationTypeID,
                AuthorizationCriteriaID,
                SequenceNo,
                siteID
            }, {
                user: req.userDetails,
                transaction
            })

            authorizationData = [authorizationData]
        } else {
            const dataToAdd = branchMasterID.map((branchID) => ({
                branchMasterID: branchID,
                AuthorizedByUserMasterId,
                orgAuthorizationTypeID,
                AuthorizationCriteriaID,
                SequenceNo
            }))

            authorizationData = await OrganizationAuthorization.bulkCreate(dataToAdd, {
                individualHooks: true,
                user: req.userDetails,
                transaction
            })
        }

        for(let authData of authorizationData){
            const officeExpenseCondition = {};
            if (siteID){
                officeExpenseCondition.siteID = siteID;
            }else{
                if (branchMasterID) officeExpenseCondition.branchMasterID = branchMasterID;
            }

            const existOfficeExpenseData = await OfficeExpense.findAll({
                where: officeExpenseCondition,
                status: 1,
                include: [
                    {
                        model: OfficeExpenseTransaction,
                        attributes: ['officeExpenseTransactionID', 'expenseAmount'],
                        where: {
                            authorizationStatus: {
                                [Op.in]: [0, 1, 2]
                            }
                        }
                    }
                ]
            });

            for(let expense of existOfficeExpenseData) {
                const transactionIDs = expense.officeExpenseTransactions.map((data) => data.officeExpenseTransactionID)
                const findAuthorization = await OfficeExpenseAuthorizationRequest.findAll({
                    where: {
                        ReferenceID: transactionIDs,
                        status: 1
                    }
                })

                const authorizationIds = findAuthorization.map(
                    (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                    {
                        where: {
                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                            activityTablePK: {
                                [Op.in]: authorizationIds,
                            },
                        },
                    },
                    { transaction }
                );

                await OfficeExpenseAuthorizationRequest.destroy({
                    where: {
                        ReferenceID: transactionIDs
                    }
                }, {
                    transaction
                })

                const userData = await UserMaster.findOne({
                    where: {
                        userMasterID: expense.createBy
                    }
                })

                let authorizationStatus = 0;
                if (authorizationCriteriaType.SEQUENCENO == AuthorizationCriteriaID) {
                    authorizationStatus = 2;
                } else {
                    authorizationStatus = 1;
                }

                await OfficeExpenseTransaction.update({
                    AuthorizationCriteriaID,
                    authorizationStatus
                }, {
                    where: {
                        officeExpenseTransactionID: transactionIDs
                    },
                }, {
                    user: req.userDetails,
                    transaction
                })

                for(let data of expense.officeExpenseTransactions){
                    if (authorizationCriteriaType.SEQUENCENO == AuthorizationCriteriaID) {
                        const createAuthorization = await OfficeExpenseAuthorizationRequest.create({
                            ReferenceID: data.officeExpenseTransactionID,
                            userMasterID: authData.AuthorizedByUserMasterId[0],
                            status: 1,
                            authstatus: 2,
                        }, {
                            user: req.userDetails,
                            transaction
                        })

                        await UserInbox.create(
                            {
                                activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                activityTablePK:
                                    createAuthorization.toJSON().officeExpenseAuthRequestId,
                                message: `${userData.displayName} has applied for Office Expense of ${data.expenseAmount}`,
                                assignedTo: createAuthorization.AuthorizedByUserMasterId[0],
                                assignedBy: userData.userMasterID,
                            },
                            {
                                user: req.userDetails,
                                transaction
                            }
                        );

                    } else {
                        for(let x of authData.AuthorizedByUserMasterId){
                            const createAuthorization = await OfficeExpenseAuthorizationRequest.create({
                                ReferenceID: data.officeExpenseTransactionID,
                                userMasterID: x,
                                status: 1,
                                authstatus: 2,
                            }, {
                                user: req.userDetails
                            })

                            await UserInbox.create(
                                {
                                    activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                    activityTablePK:
                                        createAuthorization.toJSON().officeExpenseAuthRequestId,
                                    message: `${userData.displayName} has applied for Office Expense of ${data.expenseAmount}`,
                                    assignedTo: x,
                                    assignedBy: userData.userMasterID,
                                },
                                {
                                    user: req.userDetails,
                                    transaction
                                }
                            );
                        }
                    }

                }

            }
        }

        await transaction.commit();
        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: message.usermessage.addMessage('Organization Authorization'),
        });

    } catch (error) {
        await transaction.rollback();
        next(error)
    }
}

exports.getAllOrganizationAuthorization = async (req, res, next) => {
    try {
        const { companyMasterID, branchMasterID, siteID, orgAuthorizationTypeID, page, limit, AuthorizationCriteriaID, status, exportData } = req.body;

        const condition = {}
        if (branchMasterID) condition.branchMasterID = branchMasterID;
        if (siteID) condition.siteID = siteID;
        if (orgAuthorizationTypeID) condition.orgAuthorizationTypeID = orgAuthorizationTypeID;
        if (AuthorizationCriteriaID) condition.AuthorizationCriteriaID = AuthorizationCriteriaID;
        condition.status = status ? status : 1;

        const paginationQuery = page && limit ? {
            offset: (page - 1) * limit,
            limit: limit
        } : {};

        const includeModels = [
            {
                model: BranchMaster,
                where: {
                    companyMasterID
                },
                attributes: ['branchName', 'branchMasterID', 'companyMasterID'],
                include: [
                    {
                        model: companyMaster,
                        attributes: ['companyName']
                    }
                ]
            },
            {
                model: Site,
                attributes: ['siteName', 'siteID']
            },
            {
                model: AuthorizationCriteriaMaster,
                attributes: ['AuthorizationCriteria', 'AuthorizationCriteriaID']
            },
            {
                model: OrgAuthorizationType,
                attributes: ['orgAuthorizationType', 'orgAuthorizationTypeID']
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
        ]

        const { rows, count } = await OrganizationAuthorization.findAndCountAll({
            distinct: true,
            where: condition,
            ...paginationQuery,
            include: includeModels
        })

        if (exportData) {

            const allUserMasterID = [];
            for (let i = 0; i < rows?.length; i++) {
                for (let j = 0; j < rows[i].AuthorizedByUserMasterId?.length; j++) {
                    allUserMasterID.push(rows[i].AuthorizedByUserMasterId[j]);
                }
            }

            const users = await UserMaster.findAll({
                where: {
                    userMasterID: allUserMasterID
                }
            })
            const data = rows?.map((row) => {
                const authorizedPerson = row.AuthorizedByUserMasterId.map((x) => {
                    const index = users.findIndex((user) => user.userMasterID == x);
                    if (index != -1)
                        return users[index].displayName
                });
                return {
                    "Branch Name": row?.branchMaster?.branchName,
                    "Site Name": row?.site?.siteName,
                    "Org Auth Type": row?.orgAuthorizationType?.orgAuthorizationType,
                    "Auth Criteria": row?.AuthorizationCriteriaMaster?.AuthorizationCriteria,
                    "Authorized Person Name": authorizedPerson.join(', '),
                    "Created At": moment(row?.createdAt).format('DD-MM-YYYY HH:mm')
                }
            })
            return await generateExcel(data, 'Organization Authorization', 'xlsx', res);
        }

        return res.status(statusCodes.OK).json({
            data: rows,
            totalcount: count,
            status: statusCodes.OK
        })

    } catch (error) {
        next(error)
    }
}

exports.getOrganizationAuthorizationById = async (req, res, next) => {
    try {
        const organizationAuthorizationID = req.params.id;

        if (!organizationAuthorizationID) {
            return res.status(statusCodes.BAD_REQUEST).json({ message: message.errorMessage.INVALID_REQUEST });
        }

        const includeModels = [
            {
                model: BranchMaster,
                attributes: ['branchName', 'branchMasterID', 'companyMasterID']
            },
            {
                model: Site,
                attributes: ['siteName', 'companyMasterID']
            },
            {
                model: AuthorizationCriteriaMaster,
                attributes: ['AuthorizationCriteria', 'AuthorizationCriteriaID']
            },
            {
                model: OrgAuthorizationType,
                attributes: ['orgAuthorizationType', 'orgAuthorizationTypeID']
            }
        ]

        const data = await OrganizationAuthorization.findOne({
            where: {
                organizationAuthorizationID
            },
            include: includeModels
        })

        data.dataValues.authorizedCompany = [];
        data.dataValues.companyMasterID = data.siteID ? data?.site?.companyMasterID : data?.branchMaster?.companyMasterID;

        for (let item of data.AuthorizedByUserMasterId) {
            const getCompany = await UserMaster.findOne({
                where: { userMasterID: item },
                attributes: ["companyMasterId"],
            });
            data.dataValues.authorizedCompany.push(+getCompany.companyMasterId);
        }

        res.status(statusCodes.OK).json({
            data: data,
            status: statusCodes.OK
        })

    } catch (error) {
        next(error)
    }
}

exports.updateOrganizationAuthorizationById = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { organizationAuthorizationID, AuthorizedByUserMasterId, orgAuthorizationTypeID, AuthorizationCriteriaID, SequenceNo } = req.body;

        if(AuthorizationCriteriaID == authorizationCriteriaType.ANYTWO &&  AuthorizedByUserMasterId.length < 2){
            return res.status(200).json({
                status: 401,
                message: 'Please select atleast 2 Authorizers!'
            })
        }

        if(AuthorizationCriteriaID == authorizationCriteriaType.ANYTHREE &&  AuthorizedByUserMasterId.length < 3){
            return res.status(200).json({
                status: 401,
                message: 'Please select atleast 3 Authorizers!'
            })
        }

        const existData = await OrganizationAuthorization.findOne({
            where: {
                organizationAuthorizationID
            }
        });

        if (!existData) {
            await transaction.rollback();
            return res.status(statusCodes.OK).json({
                status: 401,
                message: message.usermessage.notFoundMessage(
                    'Organization Authorization'
                ),
            });
        }

        if (AuthorizedByUserMasterId)
            existData.AuthorizedByUserMasterId = AuthorizedByUserMasterId;
        if (AuthorizationCriteriaID)
            existData.AuthorizationCriteriaID = AuthorizationCriteriaID;
        if (SequenceNo)
            existData.SequenceNo = SequenceNo;

        await existData.save({
            user: req.userDetails,
            transaction
        })

        const officeExpenseCondition = {};
        if (existData.siteID) {
            officeExpenseCondition.siteID = existData.siteID;
        } else {
            if (existData.branchMasterID) officeExpenseCondition.branchMasterID = existData.branchMasterID;
        }

        const existOfficeExpenseData = await OfficeExpense.findAll({
            where: officeExpenseCondition,
            status: 1,
            include: [
                {
                    model: OfficeExpenseTransaction,
                    attributes: ['officeExpenseTransactionID', 'expenseAmount'],
                    where: {
                        authorizationStatus: {
                            [Op.in]: [1, 2]
                        }
                    }
                }
            ]
        });

        for (let expense of existOfficeExpenseData) {
            const transactionIDs = expense.officeExpenseTransactions.map((data) => data.officeExpenseTransactionID)
            const findAuthorization = await OfficeExpenseAuthorizationRequest.findAll({
                where: {
                    ReferenceID: transactionIDs,
                    status: 1
                }
            })

            const authorizationIds = findAuthorization.map(
                (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
                {
                    where: {
                        activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                        activityTablePK: {
                            [Op.in]: authorizationIds,
                        },
                    },
                },
                { transaction }
            );

            await OfficeExpenseAuthorizationRequest.destroy({
                where: {
                    ReferenceID: transactionIDs
                }
            }, {
                transaction
            })

            const userData = await UserMaster.findOne({
                where: {
                    userMasterID: expense.createBy
                }
            })

            let authorizationStatus = 0;
            if (authorizationCriteriaType.SEQUENCENO == AuthorizationCriteriaID) {
                authorizationStatus = 2;
            } else {
                authorizationStatus = 1;
            }

            await OfficeExpenseTransaction.update({
                AuthorizationCriteriaID,
                authorizationStatus
            }, {
                where: {
                    officeExpenseTransactionID: transactionIDs
                },
            }, {
                user: req.userDetails,
                transaction
            })

            for (let data of expense.officeExpenseTransactions) {
                if (authorizationCriteriaType.SEQUENCENO == AuthorizationCriteriaID) {
                    const createAuthorization = await OfficeExpenseAuthorizationRequest.create({
                        ReferenceID: data.officeExpenseTransactionID,
                        userMasterID: existData.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                    }, {
                        user: req.userDetails,
                        transaction
                    })

                    await UserInbox.create(
                        {
                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                            activityTablePK:
                                createAuthorization.toJSON().officeExpenseAuthRequestId,
                            message: `${userData.displayName} has applied for Office Expense of ${data.expenseAmount}`,
                            assignedTo: existData.AuthorizedByUserMasterId[0],
                            assignedBy: userData.userMasterID,
                        },
                        {
                            user: req.userDetails,
                            transaction
                        }
                    );

                } else {
                    for (let x of existData.AuthorizedByUserMasterId) {
                        const createAuthorization = await OfficeExpenseAuthorizationRequest.create({
                            ReferenceID: data.officeExpenseTransactionID,
                            userMasterID: x,
                            status: 1,
                            authstatus: 2,
                        }, {
                            user: req.userDetails
                        })

                        await UserInbox.create(
                            {
                                activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                activityTablePK:
                                    createAuthorization.toJSON().officeExpenseAuthRequestId,
                                message: `${userData.displayName} has applied for Office Expense of ${data.expenseAmount}`,
                                assignedTo: x,
                                assignedBy: userData.userMasterID,
                            },
                            {
                                user: req.userDetails,
                                transaction
                            }
                        );
                    }
                }

            }
        }

        await transaction.commit();
        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: message.usermessage.updateMessage('Organization Authorization'),
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

exports.deleteOrganizationAuthorization = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { organizationAuthorizationID, siteID, branchMasterID } = req.body;
        if(!organizationAuthorizationID){
            return res.status(statusCodes.OK).json({
                status: 401,
                message: message.usermessage.ValidParameters,
            });
        }

        const condition = {};

        if(siteID){
            condition.siteID = siteID
        }else{
            condition.branchMasterID = branchMasterID
        }

        const officeExpenseData = await OfficeExpense.findAll({
            where: condition,
            status: 1,
            include: [
                {
                    model: OfficeExpenseTransaction,
                    where: {
                        authorizationStatus: {
                            [Op.in]: [1, 2]
                        },
                        status: 1
                    }
                }
            ]
        })

        const officeExpenseTransactionIDs = officeExpenseData.flatMap((expense) => expense?.officeExpenseTransactions?.flatMap((trans) => trans?.officeExpenseTransactionID));

        const officeExpenseAuthRecords = await OfficeExpenseAuthorizationRequest.findAll({
            where: {
                ReferenceID: officeExpenseTransactionIDs
            }
        });

        const officeExpenseAuthIDs = officeExpenseAuthRecords.map(
            (auth) => auth.officeExpenseAuthRequestId
        );

        await UserInbox.destroy(
            {
                where: {
                    activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                    activityTablePK: {
                        [Op.in]: officeExpenseAuthIDs,
                    },
                },
                transaction,
                individualHooks: true,
                user: req.userDetails
            }
        );

        await OfficeExpenseAuthorizationRequest.destroy({
            where: {
                ReferenceID: {
                    [Op.in]: officeExpenseTransactionIDs
                }
            },
            transaction,
            individualHooks: true,
            user: req.userDetails
        })

        await OfficeExpenseTransaction.update({
            authorizationStatus: 0,
            AuthorizationCriteriaID: null,
        },{
            where: {
                officeExpenseTransactionID: {
                    [Op.in]: officeExpenseTransactionIDs
                }
            },
            transaction,
            individualHooks: true,
            user: req.userDetails
        })

        await OrganizationAuthorization.destroy({
            where: {
                organizationAuthorizationID
            },
            user: req.userDetails,
            transaction
        })

        await transaction.commit();
        
        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: message.usermessage.deleteMessage('Organization Authorization'),
        });
    } catch (error) {
        await transaction.rollback();
        next(error)
    }
}