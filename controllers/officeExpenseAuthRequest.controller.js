const { Op, Sequelize } = require("sequelize");
const OfficeExpenseAuthorizationRequest = require("../models/officeExpenseAuthorization");
const OfficeExpenseTransaction = require("../models/officeExpenseTransaction");
const OfficeExpense = require("../models/officeExpense");
const BranchMaster = require("../models/branchMaster");
const Site = require("../models/site");
const OfficeExpenseCategory = require("../models/officeExpenseCategory");
const OfficeExpenseHead = require("../models/officeExpenseHead");
const { statusCodes } = require("../utils/commonVars");
const { findOfficeExpenseAuthorizationDetails, findCompanyNotificationPolicy, sendNotification_NEW } = require("../utils/commonUtilFunctions");
const { organizationAuthorizationMasterTypes, authorizationCriteriaType } = require("../utils/dbUtils");
const UserMaster = require("../models/userMaster");
const UserInbox = require("../models/UserInbox");
const sequelize = require("../config/database");
const message = require('../response_message/message');

exports.getAllOfficeExpenseRequest = async (req, res, next) => {
    try {
        const { page, limit, branchMasterID, siteID, fromdate, todate, authorizationStatus } = req.body;
        const authorizerUserMasterID = +req?.userDetails?.userMasterId;

        const paginationQuery = page && limit ? {
            limit,
            offset: (page - 1) * limit
        } : {}

        const expenseAuthCondition = {
            status: 1,
            userMasterID: authorizerUserMasterID,
            authstatus: 2,
        };
        const expenseTransactionCondition = {};
        if (authorizationStatus) {
            if (+authorizationStatus === expenseApprovalTypes.APPROVED) {
                expenseTransactionCondition.authorizationStatus = '3';
                expenseTransactionCondition.erpJvid = { [Sequelize.Op.eq]: null };
                expenseTransactionCondition.payment_Id = { [Sequelize.Op.eq]: null };
            }
            if (+authorizationStatus === expenseApprovalTypes.PENDING) {
                expenseTransactionCondition.authorizationStatus = {
                    [Sequelize.Op.in]: ['0', '1', '2'],
                };
            }
            if (+authorizationStatus === expenseApprovalTypes.REJECTED) {
                expenseTransactionCondition.authorizationStatus = '4';
            }
        } else {
            expenseTransactionCondition.authorizationStatus = {
                [Sequelize.Op.in]: ['0', '1', '2'],
            };
        }

        const expenseCondition = {};
        if (fromdate && todate) {
            expenseCondition.expense_date = {
                [Op.between]: [new Date(fromdate), new Date(todate)],
            };
        }

        if (branchMasterID) expenseCondition.branchMasterID = branchMasterID;
        if (siteID) expenseCondition.siteID = siteID;

        const { rows, count } = await OfficeExpense.findAndCountAll({
            where: expenseCondition,
            ...paginationQuery,
            order: [['expense_date', 'DESC']],
            distinct: true,
            logging: true,
            attributes: {
                include: [
                    [
                        Sequelize.literal(`(
                        SELECT json_build_object(
                        'pending', COUNT(*) FILTER (
                        WHERE oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 2
                        ),
                        'approved', COUNT(*) FILTER (
                        WHERE oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 1
                        ),
                        'rejected', COUNT(*) FILTER (
                        WHERE oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 0
                        ),
                        'total', COUNT(*) FILTER (
                        WHERE oet."status" = 1
                        ),
                        'pendingAmount', COALESCE(SUM(
                        CASE 
                        WHEN oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 2
                        THEN oet."expenseAmount" 
                        ELSE 0 
                        END
                        ), 0),
                        'approvedAmount', COALESCE(SUM(
                        CASE 
                        WHEN oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 1
                        THEN oet."expenseAmount" 
                        ELSE 0 
                        END
                        ), 0),
                        'rejectedAmount', COALESCE(SUM(
                        CASE 
                        WHEN oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        AND oa."authstatus" = 0
                        THEN oet."expenseAmount" 
                        ELSE 0 
                        END
                        ), 0),
                        'totalExpenseAmount', COALESCE(SUM(
                        CASE 
                        WHEN oet."deletedAt" IS NULL 
                        AND oet."status" = 1
                        THEN oet."expenseAmount" 
                        ELSE 0 
                        END
                        ), 0)
                        )
                        FROM "officeExpenseTransactions" AS oet 
                        JOIN "officeExpenseAuths" AS oa
                        ON oa."ReferenceID" = oet."officeExpenseTransactionID"
                        WHERE oet."officeExpenseID" = "officeExpenses"."officeExpenseID" 
                        AND oet."status" = 1 
                        AND oa."userMasterID" = ${authorizerUserMasterID} 
                        AND oa."deletedAt" IS NULL 
                        )`),
                        'expenseSummary',
                    ],
                ],
            },
            include: [
                {
                    model: OfficeExpenseTransaction,
                    where: expenseTransactionCondition,
                    include: [
                        {
                            required: true,
                            model: OfficeExpenseAuthorizationRequest,
                            where: expenseAuthCondition,
                        },
                        {
                            model: OfficeExpenseHead,
                            attributes: ['officeExpenseHeadID', 'officeExpenseHead', 'officeExpenseCategoryID'],
                            include: [
                                {
                                    model: OfficeExpenseCategory,
                                    attributes: ['officeExpenseCategory']
                                }
                            ]
                        }
                    ],
                },
                {
                    model: BranchMaster,
                    attributes: ['branchName']
                },
                {
                    model: Site,
                    attributes: ['siteName']
                }
            ],
        });

        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            data: rows,
            totalcount: count
        })

    } catch (error) {
        next(error)
    }
}

exports.acceptRejectOfficeExpenses = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {

        let { acceptRejectData, authstatus } = await req.body;
        const userMasterID = req.userDetails.userMasterId;

        const transactionIDs = acceptRejectData.map((x) => x.officeExpenseTransactionID);

        const transactionData = await OfficeExpenseTransaction.findAll({
            where: {
                officeExpenseTransactionID: transactionIDs
            },
            include: [
                {
                    model: OfficeExpense,
                    as: 'officeExpense',
                    include: [
                        {
                            model: BranchMaster,
                            attributes: ['companyMasterID', 'branchMasterID']
                        },
                        {
                            model: Site,
                            attributes: ['companyMasterID', 'siteID']
                        }
                    ]
                },
                {
                    model: OfficeExpenseAuthorizationRequest,
                    as: 'Auth'
                }
            ]
        })

        const companyMasterID = transactionData[0]?.officeExpense?.siteID ? transactionData[0]?.officeExpense?.site?.companyMasterID : transactionData[0]?.officeExpense?.branchMaster?.companyMasterID;
        const branchMasterID = transactionData[0]?.officeExpense?.branchMasterID;
        const siteID = transactionData[0]?.officeExpense?.siteID;
        const createByUserMasterID = transactionData[0]?.officeExpense?.createBy;

        const [
            findCompanyNotificationPolicyData,
            authorizationDetails,
            officeExpenseHeadIDs
        ] = await Promise.all([
            findCompanyNotificationPolicy(companyMasterID),
            findOfficeExpenseAuthorizationDetails(
                organizationAuthorizationMasterTypes.officeExpense,
                branchMasterID,
                siteID
            ),
            new Set(transactionData.map((item) => +item.officeExpenseHeadID)),
        ]);

        if (authorizationDetails) {

            const [getAllUsers, officeExpenseHeadData] = await Promise.all([
                UserMaster.findAll({
                    where: {
                        userMasterID: [
                            createByUserMasterID,
                            userMasterID,
                            ...authorizationDetails.AuthorizedByUserMasterId,
                        ]
                    }
                }),
                OfficeExpenseHead.findAll({
                    where: {
                        officeExpenseHeadID: {
                            [Op.in]: officeExpenseHeadIDs
                        }
                    },
                    include: [
                        {
                            model: OfficeExpenseCategory,
                            attributes: ['officeExpenseCategory']
                        }
                    ]
                })
            ]);

            const promiseArray = [];
            const createInboxPromise = [];
            for (const currData of acceptRejectData) {
                const currentTransaction = transactionData.find(trans => +trans.officeExpenseTransactionID == +currData.officeExpenseTransactionID);
                const authData = currentTransaction.Auth || [];

                const expense_date = currentTransaction?.officeExpense?.expense_date;
                const currentAuthRequest = authData.find(auth => +auth.officeExpenseAuthRequestId == +currData.officeExpenseAuthRequestId);
                const authIDs = authData.map(auth => +auth.officeExpenseAuthRequestId);
                const approvedRequests = authData.filter(auth => auth.authstatus == 1);
                const authRequests = authData.filter(auth => auth.authstatus != 0);
                const authUserMasterIDs = authorizationDetails.AuthorizedByUserMasterId.map(userMasterID => userMasterID);
                const createByUserData = getAllUsers.find((user) => +user.userMasterID == +createByUserMasterID);
                const currentHeadData = officeExpenseHeadData.find(head => +head.officeExpenseHeadID == +currentTransaction?.officeExpenseHeadID);
                const currentAuthUser = getAllUsers.find(user => +user?.userMasterID == +userMasterID);

                if (currentAuthRequest && authorizationDetails) {
                    promiseArray.push(
                        OfficeExpenseAuthorizationRequest.update(
                            {
                                viewstatus: 0,
                                authstatus: authstatus,
                                remarks: currData?.remarks ? currData?.remarks : '',
                            },
                            {
                                where: {
                                    officeExpenseAuthRequestId: currData?.officeExpenseAuthRequestId
                                },
                                user: req.userDetails,
                                transaction
                            }
                        )
                    );

                    if (authstatus == 0) {
                        promiseArray.push(
                            UserInbox.destroy({
                                where: {
                                    activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                    activityTablePK: authIDs,
                                },
                                individualHooks: true,
                                user: req.userDetails,
                                transaction,
                            })
                        );

                        promiseArray.push(
                            OfficeExpenseTransaction.update(
                                {
                                    authorizationStatus: 4,
                                },
                                {
                                    where: {
                                        officeExpenseTransactionID: currData?.officeExpenseTransactionID
                                    },
                                    transaction,
                                    user: req.userDetails
                                }
                            )
                        );

                        const notification = {
                            title: 'Office Expense',
                            body: 'Office Expense Rejected',
                        };

                        const data = {
                            screen: 'officeexpenserequest',
                        };

                        sendNotification_NEW(
                            createByUserData.firebaseToken,
                            createByUserData.deviceType,
                            notification,
                            data
                        )
                    } else {

                        if (+authorizationDetails.AuthorizationCriteriaID == authorizationCriteriaType.SEQUENCENO) {
                            promiseArray.push(
                                UserInbox.destroy({
                                    where: {
                                        activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                        activityTablePK: authIDs,
                                    },
                                    individualHooks: true,
                                    user: req.userDetails,
                                    transaction,
                                })
                            );

                            const pendingAndApprovedByUserIDs = authRequests.map((auth) => auth?.userMasterID);
                            const remainingByUserIDs = authUserMasterIDs.filter((id) => !pendingAndApprovedByUserIDs.includes(id));

                            if (remainingByUserIDs.length > 0) {
                                const createOfficeExpAuth = await OfficeExpenseAuthorizationRequest.create(
                                    {
                                        ReferenceID: currData?.officeExpenseTransactionID,
                                        userMasterID: remainingByUserIDs[0],
                                        status: 1,
                                        authstatus: 2,
                                    },
                                    {
                                        transaction,
                                        user: req?.userDetails
                                    }
                                );

                                if (currentTransaction) {
                                    const authorizerData = getAllUsers.find(
                                        (user) => user?.userMasterID == +remainingByUserIDs[0]
                                    );

                                    if (authorizerData && createByUserData) {
                                        const createInboxObj = {
                                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                            activityTablePK: createOfficeExpAuth.toJSON().officeExpenseAuthRequestId,
                                            message: `${createByUserData.displayName} has applied for Expense of ${currentTransaction.expenseAmount}`,
                                            assignedTo: remainingByUserIDs[0],
                                            assignedBy: createByUserData.userMasterID,
                                        }

                                        createInboxPromise.push(createInboxObj);

                                        let notification = {
                                            title: 'Hey ' + authorizerData.firstName + '! Someone requested for expense',
                                            body: createByUserData.firstName + ' has requested for expense approval',
                                        };

                                        let data = {
                                            screen: 'officeexpenserequest',
                                            isScheduled: 'true',
                                            scheduledTime: new Date().toISOString(),
                                        };

                                        sendNotification_NEW(
                                            authorizerData.firebaseToken,
                                            authorizerData.deviceType,
                                            notification,
                                            data
                                        );
                                    }
                                }
                            } else {
                                promiseArray.push(
                                    OfficeExpenseTransaction.update(
                                        {
                                            authorizationStatus: 3,
                                        },
                                        {
                                            where: {
                                                officeExpenseTransactionID: currData?.officeExpenseTransactionID
                                            },
                                            transaction,
                                            user: req.userDetails
                                        }
                                    )
                                );

                                const notification = {
                                    title: 'Office Expense',
                                    body: 'Office Expense approved successfully',
                                };
                                const data = {
                                    screen: 'officeexpenserequest',
                                };

                                sendNotification_NEW(
                                    createByUserData.firebaseToken,
                                    createByUserData.deviceType,
                                    notification,
                                    data
                                );
                            }
                        } else if (+authorizationDetails.AuthorizationCriteriaID == authorizationCriteriaType.ANYONE) {
                            promiseArray.push(
                                UserInbox.destroy({
                                    where: {
                                        activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                        activityTablePK: authIDs,
                                    },
                                    individualHooks: true,
                                    user: req.userDetails,
                                    transaction,
                                })
                            );

                            promiseArray.push(
                                OfficeExpenseTransaction.update(
                                    {
                                        authorizationStatus: 3,
                                    },
                                    {
                                        where: {
                                            officeExpenseTransactionID: currData?.officeExpenseTransactionID
                                        },
                                        transaction,
                                        user: req.userDetails
                                    }
                                )
                            );

                            const notification = {
                                title: 'Office Expense',
                                body: 'Office Expense approved successfully',
                            };
                            const data = {
                                screen: 'officeexpenserequest',
                            };

                            sendNotification_NEW(
                                createByUserData.firebaseToken,
                                createByUserData.deviceType,
                                notification,
                                data
                            );

                        } else if (+authorizationDetails.AuthorizationCriteriaID == authorizationCriteriaType.ANYTWO) {
                            if (approvedRequests.length + 1 >= 2) {
                                promiseArray.push(
                                    UserInbox.destroy({
                                        where: {
                                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                            activityTablePK: authIDs,
                                        },
                                        individualHooks: true,
                                        user: req.userDetails,
                                        transaction,
                                    })
                                );

                                promiseArray.push(
                                    OfficeExpenseTransaction.update(
                                        {
                                            authorizationStatus: 3,
                                        },
                                        {
                                            where: {
                                                officeExpenseTransactionID: currData?.officeExpenseTransactionID
                                            },
                                            transaction,
                                            user: req.userDetails
                                        }
                                    )
                                );

                                const notification = {
                                    title: 'Office Expense',
                                    body: 'Office Expense approved successfully',
                                };
                                const data = {
                                    screen: 'officeexpenserequest',
                                };

                                sendNotification_NEW(
                                    createByUserData.firebaseToken,
                                    createByUserData.deviceType,
                                    notification,
                                    data
                                );
                            } else {

                                promiseArray.push(
                                    UserInbox.destroy({
                                        where: {
                                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                            activityTablePK: currData?.officeExpenseAuthRequestId,
                                        },
                                        individualHooks: true,
                                        user: req.userDetails,
                                        transaction,
                                    })
                                );

                            }
                        } else {
                            if (approvedRequests.length + 1 >= 3) {
                                promiseArray.push(
                                    OfficeExpenseTransaction.update(
                                        {
                                            authorizationStatus: 3,
                                        },
                                        {
                                            where: {
                                                officeExpenseTransactionID: currData?.officeExpenseTransactionID
                                            },
                                            transaction,
                                            user: req.userDetails
                                        }
                                    )
                                );

                                const notification = {
                                    title: 'Office Expense',
                                    body: 'Office Expense approved successfully',
                                };
                                const data = {
                                    screen: 'officeexpenserequest',
                                };

                                sendNotification_NEW(
                                    createByUserData.firebaseToken,
                                    createByUserData.deviceType,
                                    notification,
                                    data
                                );
                            } else {
                                promiseArray.push(
                                    UserInbox.destroy({
                                        where: {
                                            activityTable: OfficeExpenseAuthorizationRequest.getTableName(),
                                            activityTablePK: currData?.officeExpenseAuthRequestId,
                                        },
                                        individualHooks: true,
                                        user: req.userDetails,
                                        transaction,
                                    })
                                );
                            }
                        }
                    }
                }
            }

            if (createInboxPromise.length > 0) {
                promiseArray.push(
                    UserInbox.bulkCreate(createInboxPromise, {
                        individualHooks: true,
                        user: req.userDetails,
                        transaction
                    })
                );
            }

            await Promise.all(promiseArray);
        }

        await transaction.commit();
        return res.status(statusCodes.OK).json({
            status: statusCodes.OK,
            message: +authstatus == 1 ? message.usermessage.approveMessage('Office Expense') : message.usermessage.rejectMessage('Office Expense')
        });

    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}