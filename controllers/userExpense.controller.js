const Sequelize = require('sequelize');
const UserExpense = require('../models/userExpense');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const UserExpenseHeadModel = require('../models/expenseHead');
const ExpenseAuthorizationRequest = require('../models/expenseAuthorization');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const UserMaster = require('../models/userMaster');
const erpAcountMaster = require('../models/erpAccountMaster');
const { executeQuery } = require('./common.controller');
const config = require('../config/erpdatabase');
const sql = require('mssql');
const Visit = require('../models/visit');
const companyMaster = require('../models/companyMaster');
const {
  asiaKolkataDateTime,
  paginateArray,
  findAuthorizationDetails,
  sendMailforExpense_With_Transaction,
  sendNotification_NEW,
  findCompanyNotificationPolicy,
  generateHTMLToPDF_base64Path,
} = require('../utils/commonUtilFunctions');

const {
  generateExcel,
  generateExcelForMyExpense,
} = require('../utils/exportData');

const UserInbox = require('../models/UserInbox');
const Customer = require('../models/customer');
const toursMaster = require('../models/toursMaster');
const ExpenseCategory = require('../models/expenseCategory');
const ExpenseHead = require('../models/expenseHead');
const {
  statusCodes,
  userAttributes,
  companyAttributes,
} = require('../utils/commonVars');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const {
  authorizationMasterTypes,
  authorizationCriteriaType,
  expenseTypes,
  expenseApprovalTypes,
  mailTemplateTypes,
} = require('../utils/dbUtils');
const Project = require('../models/project');
const {
  fileToBase64,
  attendancePhotobase64Topng,
} = require('../utils/base64Topng');
const moment = require('moment');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const mailTemplateEditor = require('../models/mailTemplateEditor');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const path = require('path');
const fs = require('fs');
const { mainApiUrl } = require('../utils/labelUtils');

exports.deleteUserExpenseTransaction = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { userExpenseTransactionID } = await req.body;
    const findTobeDeleteTransaction = await UserExpenseTransaction.findOne({
      where: { userExpenseTransactionID: userExpenseTransactionID },
      status: 1,
      raw: true,
      transaction,
    });

    const findExpenseTransactionWithSameuserExpenseID =
      await UserExpenseTransaction.findAll({
        where: { userExpenseID: findTobeDeleteTransaction.userExpenseID },
        status: 1,
        raw: true,
        transaction,
      });

    await UserExpenseTransaction.destroy({
      where: {
        userExpenseTransactionID:
          findTobeDeleteTransaction.userExpenseTransactionID,
      },
      transaction,
    });
    const expenseAuthorizationRequest =
      await ExpenseAuthorizationRequest.findAll({
        where: {
          ReferenceID: findTobeDeleteTransaction.userExpenseTransactionID,
        },
        transaction,
      });

    const AuthorizationRequestIds = expenseAuthorizationRequest.map(
      (form) => form.AuthorizationRequestId
    );

    await UserInbox.destroy({
      where: {
        activityTable: UserExpense.getTableName(),
        activityTablePK: AuthorizationRequestIds,
      },
      transaction,
    });
    await ExpenseAuthorizationRequest.destroy({
      where: {
        ReferenceID: findTobeDeleteTransaction.userExpenseTransactionID,
      },
      transaction,
    });
    if (findExpenseTransactionWithSameuserExpenseID.length == 1) {
      await UserExpense.destroy({
        where: { userExpenseID: findTobeDeleteTransaction.userExpenseID },
        transaction,
      });
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('User Expense'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getUserExpenseById = async (req, res, next) => {
  try {
    const get_one_data = await UserExpenseTransaction.findOne({
      where: {
        userExpenseTransactionID: req.params.id,
        status: 1,
      },
      include: [
        {
          model: UserExpense,
          as: 'userExpense',
        },
        {
          model: UserExpenseHeadModel,
          as: 'expenseHead',
        },
      ],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getUserExpenseByVersion = async (req, res, next) => {
  try {
    const versionData = await executeQuery(`WITH RECURSIVE old_chain AS (
    SELECT *
    FROM "userExpenseTransactions"
    WHERE "userExpenseTransactionID" = ${req.body.id}
      AND "oldExpenseTransID" IS NOT NULL

    UNION ALL

    SELECT t.*
    FROM "userExpenseTransactions" AS t
    INNER JOIN old_chain oc ON t."userExpenseTransactionID" = oc."oldExpenseTransID"
)
SELECT *
FROM old_chain WHERE "userExpenseTransactionID" != ${req.body.id};`);
    const userExpenseTransactionIDs = versionData.map(
      (e) => +e.userExpenseTransactionID
    );
    const findAllExpenseVersion = await UserExpenseTransaction.findAll({
      where: {
        userExpenseTransactionID: userExpenseTransactionIDs,
      },
      include: [
        {
          model: ExpenseHead,
          attributes: [
            'expenseHeadId',
            'expenseHead',
            'accountHeadID',
            'expenseCategoryId',
          ],
          include: [
            {
              model: ExpenseCategory,
              attributes: ['expenseCategoryId', 'expenseCategory'],
            },
          ],
        },
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteriaID', 'AuthorizationCriteria'],
        },
        {
          separate: true,
          model: ExpenseAuthorizationRequest,
          include: [
            {
              model: UserMaster,
              as: 'authorizedPerson',
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserExpense,
          as: 'userExpense',
          attributes: ['userExpenseID', 'expense_date'],
        },
      ],
      order: [['userExpenseTransactionID', 'DESC']],
    });

    return res.status(200).json({
      status: 200,
      data: findAllExpenseVersion,
      totalcount: findAllExpenseVersion.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateUserExpense = async (req, res, next) => {
  try {
    let {
      userExpenseTransactionID,
      expenseAmount,
      expenseHeadId,
      expensePriceRuleID,
      attachFile,
      description,
      version,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    let result = await sequelize.transaction(async (t) => {
      await UserExpenseTransaction.update(
        {
          expenseAmount,
          attachFile,
          description,
          expenseHeadId,
          expensePriceRuleID,
          version,
          updateBy,
          updateByIp,
        },
        {
          where: { userExpenseTransactionID: userExpenseTransactionID },
          transaction: t,
        }
      );

      const expenseAuthorizationRequest =
        await ExpenseAuthorizationRequest.findAll({
          raw: true,
          where: {
            ReferenceID: userExpenseTransactionID,
          },
          attributes: [
            'AuthorizationRequestId',
            [
              Sequelize.col(
                'userExpenseTransaction.userExpense.userMaster.displayName'
              ),
              'displayName',
            ],
          ],
          include: [
            {
              model: UserExpenseTransaction,
              attributes: [],
              include: [
                {
                  model: UserExpense,
                  as: 'userExpense',
                  attributes: [],
                  include: [
                    {
                      model: UserMaster,
                      attributes: [],
                    },
                  ],
                },
              ],
            },
          ],
          transaction: t,
        });

      let AuthorizationRequestIds = expenseAuthorizationRequest.map(
        (form) => form.AuthorizationRequestId
      );

      if (expenseAuthorizationRequest.length != 0) {
        await UserInbox.update(
          {
            message: `${expenseAuthorizationRequest[0].displayName} has applied for Expense of ${expenseAmount}`,
          },
          {
            where: {
              activityTable: UserExpense.getTableName(),
              activityTablePK: AuthorizationRequestIds,
            },
            transaction: t,
          }
        );
      }

      return res.status(200).json({
        status: 200,
        message: message.usermessage.updateMessage('User Expense'),
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.syncexpense = async (req, res, next) => {
  try {
    const { tobeSyncedExpenseData } = req.body;
    const findUnSyncedExpenseData = await UserExpenseTransaction.findAll({
      where: {
        userExpenseTransactionID: {
          [Sequelize.Op.in]:
            tobeSyncedExpenseData?.[0].userExpenseTransactionIDs,
        },
      },
    });

    const findSyncedData = findUnSyncedExpenseData.find(
      (e) => e.erpJvid != null && e.erpJvid != ''
    );
    if (findSyncedData) {
      return res.status(200).json({
        status: 401,
        message: 'Already Synced. Please refresh the page!',
      });
    }
    sql.connect(config, async function (err) {
      if (err) {
        sql.close();
        return res
          .status(200)
          .json({ status: 200, message: 'Could not create DB Connection!.' });
      }
      const results = await erpDatabaseSyncProcess(
        tobeSyncedExpenseData,
        sql,
        'ManulSync'
      );
      sql.close();

      if (results && results.length) {
        return res.status(200).json({
          status: results[0].status,
          message:
            results[0].status == 200
              ? 'Erp-Sync Successfully'
              : results[0].message,
        });
      } else {
        return res.status(200).json({
          status: 401,
          message: 'Data Not Fetched',
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.userExpenseNew = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      userMasterID,
      fromDate,
      toDate,
      expenseType,
      status,
      page = 1,
      limit = 10,
      exportData,
      exportFileType,
    } = req.body;
    if (!userMasterID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }
    req.userDetails.accessibleCompanies = companyMasterID;

    const expenseTypeCondition = {};
    if (expenseType === expenseTypes.VISIT) {
      expenseTypeCondition.visitID = {
        [Sequelize.Op.ne]: null,
      };
    } else if (expenseType === expenseTypes.TOUR) {
      expenseTypeCondition.ToursMasterID = {
        [Sequelize.Op.ne]: null,
      };
    } else if (expenseType === expenseTypes.PERSONAL) {
      expenseTypeCondition.visitID = null;
      expenseTypeCondition.ToursMasterID = null;
      expenseTypeCondition.projectID = null;
    } else if (expenseType === expenseTypes.PROJECT) {
      expenseTypeCondition.projectID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (fromDate && toDate) {
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }

    const condition = { status: { [Sequelize.Op.ne]: 10 } };

    if (status === expenseApprovalTypes.PAID) {
      condition.authorizationStatus = '3';
      condition[Sequelize.Op.or] = [
        { erpJvid: { [Sequelize.Op.ne]: null } },
        { payment_Id: { [Sequelize.Op.ne]: null } },
      ];
    }

    if (status === expenseApprovalTypes.APPROVED) {
      condition.authorizationStatus = '3';
      condition.erpJvid = { [Sequelize.Op.eq]: null };
      condition.payment_Id = { [Sequelize.Op.eq]: null };
    }
    if (status === expenseApprovalTypes.PENDING) {
      condition.authorizationStatus = { [Sequelize.Op.in]: ['0', '1', '2'] };
    }
    if (status === expenseApprovalTypes.REJECTED) {
      condition.authorizationStatus = '4';
    }
    const userExpenseData = await UserExpenseTransaction.findAndCountAll({
      where: { ...condition },
      ...paginationQuery,
      include: [
        {
          model: ExpenseHead,
          attributes: [
            'expenseHeadId',
            'expenseHead',
            'accountHeadID',
            'expenseCategoryId',
          ],
          include: [
            {
              model: ExpenseCategory,
              attributes: ['expenseCategoryId', 'expenseCategory'],
            },
          ],
        },
        {
          model: UserExpense,
          as: 'userExpense',
          where: {
            userMasterID: [...userMasterID],
            ...expenseTypeCondition,
          },
          include: [
            {
              model: UserMaster,
              required: true,
              ...accessibleUsers(req.userDetails),
            },
            {
              model: Visit,
              include: [
                {
                  model: Customer,
                  attributes: ['customerID', 'companyName', 'customerName'],
                },
              ],
            },
            { model: toursMaster },

            { model: Project },
          ],
        },
      ],
      order: [
        [Sequelize.literal(`"userExpense.expense_date"`), 'DESC'],
        ['userExpenseTransactionID', 'ASC'],
      ],
    });

    const userExpenseCalculations = await UserExpenseTransaction.findAll({
      where: { status: { [Sequelize.Op.ne]: 10 } },
      attributes: [
        [
          sequelize.literal('"userExpenseTransaction"."authorizationStatus"'),
          'authorizationStatus',
        ],
        [sequelize.fn('SUM', sequelize.col('expenseAmount')), 'totalExpense'],
        'erpJvid',
        'payment_Id',
      ],
      group: [
        '"userExpenseTransaction"."authorizationStatus"',
        'erpJvid',
        'payment_Id',
        'userExpenseTransaction.userExpenseTransactionID',
      ],
      include: [
        {
          model: UserExpense,
          attributes: [],
          as: 'userExpense',
          where: {
            userMasterID: [...userMasterID],
            ...expenseTypeCondition,
          },
          include: [
            {
              model: UserMaster,
              required: true,
              ...accessibleUsers(req.userDetails),
              attributes: [],
            },
          ],
        },
      ],
    });
    const userExpenseTransactionIds = userExpenseData.rows.map(
      (e) => e.toJSON().userExpenseTransactionID
    );
    const expenseAuthData = await ExpenseAuthorizationRequest.findAll({
      where: { ReferenceID: { [Sequelize.Op.in]: userExpenseTransactionIds } },
    });

    for (let item of expenseAuthData) {
      const user_Detail = await UserMaster.findOne({
        where: { userMasterID: item.userMasterID },
        attributes: userAttributes,
      });
      item.dataValues.userMaster = user_Detail;
    }

    const data = userExpenseData.rows.map((e) => {
      let jsonData = e.toJSON();
      if (jsonData.attachFile && jsonData.attachFile.startsWith('uploads')) {
        jsonData.attachFile = fileToBase64(jsonData.attachFile);
      }

      if (jsonData.attachFile2 && jsonData.attachFile2.startsWith('uploads')) {
        jsonData.attachFile2 = fileToBase64(jsonData.attachFile2);
      }

      let status;
      const expenseUserDetails = expenseAuthData.map((element) => {
        const jsonElement = element.toJSON();
        if (jsonElement.ReferenceID == jsonData.userExpenseTransactionID) {
          if (jsonElement.authstatus == 1)
            status = expenseApprovalTypes.APPROVED;
          if (jsonElement.authstatus == 2)
            status = expenseApprovalTypes.PENDING;
          if (jsonElement.authstatus == 0)
            status = expenseApprovalTypes.REJECTED;
          return {
            displayName: jsonElement.userMaster.displayName,
            userMasterID: jsonElement.userMaster.userMasterID,
            status,
          };
        }
      });
      if (expenseUserDetails)
        jsonData['result'] = expenseUserDetails.filter(
          (element) => element !== undefined
        );
      return jsonData;
    });

    for (let item of data) {
      let currentstatusforAccept = await executeQuery(`
        SELECT um."displayName", ea."ReferenceID" 
        FROM "expenseAuthorizations" AS ea 
        LEFT JOIN "userMasters" AS um ON um."userMasterID" = ea."userMasterID"  
        WHERE ea."ReferenceID" = ${item.userExpenseTransactionID} 
        AND ea."authstatus" = 1
      `);

      let acceptlist = [];
      currentstatusforAccept.forEach((element) => {
        acceptlist.push(element.displayName);
      });
      item.Accept = acceptlist.join();

      let currentstatusforPending = await executeQuery(`
        SELECT um."displayName", ea."ReferenceID" 
        FROM "expenseAuthorizations" AS ea 
        LEFT JOIN "userMasters" AS um ON um."userMasterID" = ea."userMasterID"  
        WHERE ea."ReferenceID" = ${item.userExpenseTransactionID} 
        AND ea."authstatus" = 2
      `);

      let currentstatusforReject = await executeQuery(`
        SELECT um."displayName", ea."ReferenceID" 
        FROM "expenseAuthorizations" AS ea 
        LEFT JOIN "userMasters" AS um ON um."userMasterID" = ea."userMasterID"  
        WHERE ea."ReferenceID" = ${item.userExpenseTransactionID} 
        AND ea."authstatus" = 0
      `);

      let pendinglist = [];
      currentstatusforPending.forEach((element) => {
        pendinglist.push(element.displayName);
      });
      let rejectlist = [];
      currentstatusforReject.forEach((element) => {
        rejectlist.push(element.displayName);
      });
      item.Pending = pendinglist.join();
      item.reject = rejectlist.join();
    }

    if (exportData) {
      const objectForExcel = data.map((element) => {
        let AuthsStatus = expenseApprovalTypes.PENDING;
        if (+element.authorizationStatus == 4)
          AuthsStatus = expenseApprovalTypes.REJECTED;
        if (
          +element.authorizationStatus == 3 &&
          (element.erpJvid || element.payment_Id)
        )
          AuthsStatus = expenseApprovalTypes.PAID;
        if (
          +element.authorizationStatus == 3 &&
          !element.erpJvid &&
          !element.payment_Id
        )
          AuthsStatus = expenseApprovalTypes.APPROVED;

        return {
          User: element.userExpense.userMaster.displayName,
          Contanct: element.userExpense.userMaster.userNumber,
          'Expense Date': element.userExpense.expense_date,
          'Expense Amount': element.expenseAmount,
          'Expense Category':
            element.userExpense.expenseCategory.expenseCategory,
          'Expense Head': element.expenseHead.expenseHead,
          Status: AuthsStatus,
          'Visit To': element.userExpense.visit
            ? `${element.userExpense.visit.customer.companyName}-${element.userExpense.visit.customer.customerName}`
            : null,
          Tour: element.userExpense.ToursMaster
            ? element.userExpense.ToursMaster.ToursName
            : null,
          Project: element.userExpense.project
            ? element.userExpense.project.projectName
            : null,
          Description: element.description,
          Version: element.version,
          'Accepted by': element.Accept,
          'Pending by': element.Pending,
          'Rejected by': element.reject,
          ErpJvid: element.erpJvid,
        };
      });

      await generateExcel(
        objectForExcel,
        `Expense-Report-${fromDate}-${toDate}`,
        exportFileType,
        res
      );

      return;
    }

    const Calculation = { Accepted: 0, Pending: 0, Rejected: 0, Paid: 0 };
    for (let element of userExpenseCalculations) {
      const jsonElement = element.toJSON();
      if (
        +jsonElement.authorizationStatus === 0 ||
        +jsonElement.authorizationStatus === 1 ||
        +jsonElement.authorizationStatus === 2
      )
        Calculation.Pending = Calculation.Pending + +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        !jsonElement.erpJvid &&
        !jsonElement.payment_Id
      )
        Calculation.Accepted = Calculation.Accepted + +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        (jsonElement.erpJvid || jsonElement.payment_Id)
      )
        Calculation.Paid = Calculation.Paid + +jsonElement.totalExpense;
      if (+jsonElement.authorizationStatus === 4)
        Calculation.Rejected = Calculation.Rejected + +jsonElement.totalExpense;
    }

    return res.status(200).json({
      data,
      status: 200,
      totalcount: +userExpenseData.count,
      userExpenseCalculations: Calculation,
    });
  } catch (err) {
    next(err);
  }
};

exports.postAuthorizationUpdateUserExpense = async (req, res, next) => {
  try {
    let {
      userExpenseTransactionID,
      expenseAmount,
      expenseHeadId,
      expensePriceRuleID,
      attachFile,
      description,
    } = await req.body;
    await UserExpenseTransaction.update(
      {
        expenseAmount,
        attachFile,
        description,
        expenseHeadId,
        expensePriceRuleID,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: { userExpenseTransactionID: +userExpenseTransactionID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('User Expense'),
    });
  } catch (err) {
    next(err);
  }
};
exports.ExpenseAuthorizationDetails = async (req, res, next) => {
  try {
    let useridArr = [];
    let usermaster;

    let Auth_person = await AuthorizationDetails.findAll({
      where: {
        AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [req.params.id] },
        AuthorizationMasterID: authorizationMasterTypes.expense,
        status: 1,
        '$userMaster.status$': 1,
      },
      attributes: [['userMasterID', 'user']],
      include: [
        {
          model: UserMaster,
          as: 'userMaster',
        },
      ],
    });

    for (let i = 0; i < Auth_person.length; i++) {
      useridArr.push(Auth_person[i].dataValues.user);
    }

    usermaster = await UserMaster.findAll({
      where: {
        userMasterID: { [Sequelize.Op.in]: useridArr },
      },
      status: 1,
      attributes: [
        ['userMasterID', 'userMasterID'],
        ['displayName', 'userName'],
        ['userNumber', 'Number'],
      ],
      include: [
        {
          model: companyMaster,
          as: 'companyMaster',
          attributes: ['companyName', 'companyName'],
        },
      ],
    });

    res.status(200).json({
      status: 200,
      message: {},
      data: usermaster,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err.message);
  }
};
exports.erpExpenseAutoSync = async (req, res) => {
  try {
    const companyMasterID = 28; //For Mehta Hightech only
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const startDate = '2025-03-01';
    const order = [['createdAt', 'ASC']];
    const findExpenseData = await UserExpenseTransaction.findAll({
      where: {
        status: { [Sequelize.Op.ne]: 10 },
        authorizationStatus: { [Sequelize.Op.ne]: 4 },
        erpJvid: {
          [Sequelize.Op.or]: [
            { [Sequelize.Op.is]: null },
            { [Sequelize.Op.eq]: '' },
          ],
        },
        expenseAmount: { [Sequelize.Op.ne]: null },
      },
      order,
      include: [
        {
          required: true,
          model: UserExpense,
          as: 'userExpense',
          where: {
            expense_date: {
              [Sequelize.Op.and]: [
                { [Sequelize.Op.gte]: startDate },
                { [Sequelize.Op.lt]: currentdate },
              ],
            },
            status: 1,
          },
          include: [
            {
              required: true,
              model: UserMaster,
              where: { companyMasterId: companyMasterID, status: 1 },
              attributes: userAttributes,
              include: [
                {
                  required: true,
                  model: erpAcountMaster,
                  where: {
                    status: 1,
                  },
                },
              ],
            },
          ],
        },
        {
          model: ExpenseHead,
          where: {
            accountHeadID: { [Sequelize.Op.ne]: null },
          },
        },
      ],
    });

    const processedExpenseData = expenseAutoSyncProcess(findExpenseData);

    sql.connect(config, async function (err) {
      if (err) {
        sql.close();
        res
          ?.status(200)
          .json({ status: 200, message: 'Could not create DB Connection!.' });
        return console.log(
          'Could not create ERP DB Connection!........................'
        );
      }
      const results = await erpDatabaseSyncProcess(
        processedExpenseData,
        sql,
        'AutoSync'
      );

      sql.close();
      res?.status(200).json({
        status: 200,
        message: 'Processing completed..........',
        results,
      });
      return console.log(
        'ERP Sync Processing completed................................',
        results
      );
    });
  } catch (err) {
    console.log(err);
  }
};

exports.expenseSyncData_V2 = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, expense_date, companyMasterID } =
      await req.body;
    const order = [['createdAt', 'ASC']];

    const findExpenseData = await UserExpenseTransaction.findAll({
      where: {
        status: { [Sequelize.Op.ne]: 10 },
        authorizationStatus: { [Sequelize.Op.ne]: 4 },
        erpJvid: {
          [Sequelize.Op.or]: [
            { [Sequelize.Op.is]: null },
            { [Sequelize.Op.eq]: '' },
          ],
        },
        expenseAmount: { [Sequelize.Op.ne]: null },
      },
      order,
      include: [
        {
          required: true,
          model: UserExpense,
          as: 'userExpense',
          where: {
            ...(expense_date && { expense_date }),
            status: 1,
          },
          include: [
            {
              required: true,
              model: UserMaster,
              where: {
                ...(userMasterID && { userMasterID: userMasterID }),
                companyMasterId: companyMasterID,
                status: 1,
              },
              attributes: userAttributes,
              include: [
                {
                  required: true,
                  model: erpAcountMaster,
                  where: {
                    status: 1,
                  },
                },
              ],
            },
          ],
        },
        {
          model: ExpenseHead,
          where: {
            accountHeadID: { [Sequelize.Op.ne]: null },
          },
        },
      ],
    });

    const processedExpenseData = expenseAutoSyncProcess(findExpenseData);

    const paginatedData = paginateArray(processedExpenseData, page, limit);
    return res.status(200).json({
      status: 200,
      totalcount: processedExpenseData.length,
      data: paginatedData,
    });
  } catch (err) {
    next(err);
  }
};

function expenseAutoSyncProcess(findExpenseData) {
  const unapprovedExpenseSet = new Set(
    findExpenseData
      .filter((e) => +e.authorizationStatus != 3)
      .map((e) => `${e.userExpense.userMasterID}_${e.userExpense.expense_date}`)
  );
  const expenseObject = {};
  for (const trans of findExpenseData) {
    if (
      unapprovedExpenseSet.has(
        `${trans.userExpense.userMasterID}_${trans.userExpense.expense_date}`
      )
    ) {
      continue;
    }

    const key = `${trans.userExpense.userMasterID}_${trans.userExpense.expense_date}_${trans.expenseHeadId}`;

    if (expenseObject[key]) {
      expenseObject[key].netAmount =
        expenseObject[key].netAmount + trans.expenseAmount;

      expenseObject[key].description = trans.description
        ? `${expenseObject[key].description}| ${trans.description.replace(/['"]+/g, '')}`
        : `${expenseObject[key].description}|  N/A`;

      expenseObject[key].userExpenseTransactionIDs.push(
        trans.userExpenseTransactionID
      );
    } else {
      expenseObject[key] = {
        userMasterID: trans.userExpense.userMasterID,
        erpAcountID:
          trans.userExpense?.userMaster?.erpAcountMasters[0]?.erpAcountID,
        netAmount: trans.expenseAmount,

        expenseAmountheadwise: '0',

        expense_date: trans.userExpense?.expense_date,

        accountHeadID: trans.expenseHead?.accountHeadID,

        description: trans.description
          ? trans.description.replace(/['"]+/g, '')
          : 'N/A',

        userExpenseTransactionIDs: [],
        displayName: trans.userExpense?.userMaster?.displayName,
      };
      expenseObject[key].userExpenseTransactionIDs.push(
        trans.userExpenseTransactionID
      );
    }
  }
  const expenseArray = Object.values(expenseObject);

  const finalExpenseObject = {};

  for (const expenseArrayObj of expenseArray) {
    const key = `${expenseArrayObj.userMasterID}_${expenseArrayObj.expense_date}`;

    if (finalExpenseObject[key]) {
      finalExpenseObject[key].netAmount =
        finalExpenseObject[key].netAmount + expenseArrayObj.netAmount;

      finalExpenseObject[key].expenseAmountheadwise =
        `${finalExpenseObject[key].expenseAmountheadwise}#${String(expenseArrayObj.netAmount)}`;

      finalExpenseObject[key].accountHeadID =
        `${finalExpenseObject[key].accountHeadID}#${expenseArrayObj.accountHeadID}`;

      finalExpenseObject[key].description =
        `${finalExpenseObject[key].description}#${expenseArrayObj.description}`;

      finalExpenseObject[key].userExpenseTransactionIDs.push(
        ...expenseArrayObj.userExpenseTransactionIDs
      );
    } else {
      finalExpenseObject[key] = {
        userMasterID: expenseArrayObj.userMasterID,
        erpAcountID: expenseArrayObj.erpAcountID,
        netAmount: expenseArrayObj.netAmount,

        expenseAmountheadwise: String(expenseArrayObj.netAmount),

        expense_date: expenseArrayObj.expense_date,

        accountHeadID: expenseArrayObj.accountHeadID,

        description: expenseArrayObj.description,
        userExpenseTransactionIDs: expenseArrayObj.userExpenseTransactionIDs,
        displayName: expenseArrayObj.displayName,
      };
    }
  }

  const finalExpenseArray = Object.values(finalExpenseObject);
  return finalExpenseArray && finalExpenseArray.length ? finalExpenseArray : [];
}

async function erpDatabaseSyncProcess(expenseData, sql, syncType) {
  let request = new sql.Request();
  const results = [];
  for (let expense of expenseData) {
    await UserExpenseTransaction.update(
      {
        erpJvid: -1,
        syncType,
      },
      {
        where: {
          status: {
            [Sequelize.Op.ne]: 10,
          },
          authorizationStatus: 3,
          userExpenseTransactionID: {
            [Sequelize.Op.in]: expense.userExpenseTransactionIDs,
          },
        },
      }
    );
    const query =
      'exec MCCS_Veritrack_InsertQueryJV @TADPartyAccountMasterId=' +
      expense.erpAcountID +
      ', @NetAmount= ' +
      expense.netAmount +
      ",@DocumentDate= '" +
      expense.expense_date +
      "',@expenceHeadID= '" +
      expense.accountHeadID +
      "',@expenceAmt= '" +
      expense.expenseAmountheadwise +
      "',@dec= '" +
      expense.description +
      "'";

    try {
      const recordset = await request.query(query);
      const erpJvid = recordset?.recordset?.[0]?.[''] || 0;

      if (erpJvid !== 0) {
        await UserExpenseTransaction.update(
          {
            erpJvid: erpJvid,
            syncType,
          },
          {
            where: {
              status: {
                [Sequelize.Op.ne]: 10,
              },
              authorizationStatus: 3,
              userExpenseTransactionID: {
                [Sequelize.Op.in]: expense.userExpenseTransactionIDs,
              },
            },
          }
        );
        results.push({
          status: 200,
          userMasterID: expense.userMasterID,
          message: `Synced = ( erpJvid = ${erpJvid} )`,
        });
      } else {
        results.push({
          status: 200,
          userMasterID: expense.userMasterID,
          message: 'Synced - Could Not Get erpJvid',
        });
      }
    } catch (error) {
      results.push({
        status: 401,
        userMasterID: expense.userMasterID,
        message: error.message,
      });
    }
  }

  return results;
}

exports.findExpesneWithNegativeJvID = async (req, res) => {
  try {
    const { companyMasterID } = await req.body;
    const order = [['createdAt', 'ASC']];
    const findExpenseData = await UserExpenseTransaction.findAll({
      where: {
        status: { [Sequelize.Op.ne]: 10 },
        erpJvid: {
          [Sequelize.Op.eq]: '-1',
        },
        expenseAmount: { [Sequelize.Op.ne]: null },
      },
      order,
      include: [
        {
          required: true,
          model: UserExpense,
          as: 'userExpense',
          where: {
            status: 1,
          },
          include: [
            {
              required: true,
              model: UserMaster,
              where: { companyMasterId: companyMasterID, status: 1 },
              attributes: userAttributes,
              include: [
                {
                  required: true,
                  model: erpAcountMaster,
                  where: {
                    status: 1,
                  },
                },
              ],
            },
          ],
        },
        {
          model: ExpenseHead,
          where: {
            accountHeadID: { [Sequelize.Op.ne]: null },
          },
        },
      ],
    });

    const finaldata = findExpenseData.map((e) => {
      return {
        syncType: e.syncType ? e.syncType : '',
        userExpenseTransactionID: e.userExpenseTransactionID,
        userExpenseID: e.userExpenseID,
        expenseHeadId: e.expenseHeadId,
        expenseAmount: e.expenseAmount,
        description: e.description,
        expenseHead: e.expenseHead?.expenseHead,
        accountHeadID: e.expenseHead?.accountHeadID,
        expense_date: e.userExpense.expense_date,
        authorizationStatus:
          +e.authorizationStatus == 3
            ? 'Approved'
            : +e.authorizationStatus == 4
              ? 'Rejected'
              : 'Pending',
      };
    });
    if (finaldata.length) {
      return await generateExcel(
        finaldata,
        'Negative Expense Data',
        'xlsx',
        res
      );
    } else {
      return res.status(200).json({
        status: 200,
        message: 'No Data Found to Exportsds',
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.findExpesneWithUnassignedERPID = async (req, res) => {
  try {
    const { companyMasterID } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const order = [['displayName', 'ASC']];

    const findUnassignedUserExpenseData = await UserMaster.findAll({
      where: {
        status: 1,
        companyMasterId: companyMasterID,
        [Sequelize.Op.and]: Sequelize.literal(
          `"erpAcountMasters"."userMasterID" IS NULL`
        ),
      },
      order,
      include: [
        {
          required: false,
          model: erpAcountMaster,
          where: {
            status: 1,
          },
        },
        {
          required: true,
          model: UserExpense,
          include: [
            {
              required: true,
              model: UserExpenseTransaction,
              where: {
                authorizationStatus: 3,
              },
            },
          ],
        },
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
              attributes: ['branchName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
        {
          required: false,
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
      attributes: userAttributes,
    });
    const finaldata = [];

    for (const data of findUnassignedUserExpenseData) {
      let totalExpense = 0;
      for (let expense of data.userExpenses) {
        for (let trans of expense.userExpenseTransactions) {
          totalExpense += trans.expenseAmount;
        }
      }
      const pushData = {
        'Employee Code':
          data.employeeJoiningDetails && data.employeeJoiningDetails.length > 0
            ? data.employeeJoiningDetails[0].employeeCode
            : '',
        'Employee Name': data.displayName,
        'User Number': data.userNumber,
        'Company Name': data.companyMaster.companyName,
        'Branch Name':
          data.employeeBranches && data.employeeBranches.length > 0
            ? data.employeeBranches[0].branchMaster.branchName
            : '',
        'Department Name':
          data.employeeDepartments && data.employeeDepartments.length > 0
            ? data.employeeDepartments[0].department.departmentName
            : '',
        'Designation Name':
          data.employeeDesignations && data.employeeDesignations.length > 0
            ? data.employeeDesignations[0].designation.designationName
            : '',
        'Total Expense': totalExpense,
      };
      finaldata.push(pushData);
    }
    if (finaldata.length) {
      return await generateExcel(
        finaldata,
        'Negative Expense Data',
        'xlsx',
        res
      );
    } else {
      return res.status(200).json({
        status: 200,
        message: 'No Data Found to Exportsds',
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.postAddUserExpense_V2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    const userCompanyID = +req.userDetails.companyMasterId;
    const companyMasterID = req.userDetails.companyMasterId;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const formData = req.body;
    const files = req.files;
    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('expenseHeadId')
    ).length;

    const expenseTransaction = [];
    let index_attch = 0;
    for (let i = 0; i < entryCount; i++) {
      const checkAttach =
        formData[`isattachment_${i}`] == 'true' ? true : false;
      const checkAttach2 =
        formData[`isattachment2_${i}`] == 'true' ? true : false;
      const checkAttach3 =
        formData[`isattachment3_${i}`] == 'true' ? true : false;
      const checkAttach4 =
        formData[`isattachment4_${i}`] == 'true' ? true : false;
      let addObj = {
        expenseHeadId: +formData[`expenseHeadId${i}`],
        expensePriceRuleID:
          formData[`expensePriceRuleID${i}`] &&
          formData[`expensePriceRuleID${i}`] != 'null' &&
          formData[`expensePriceRuleID${i}`] != ''
            ? formData[`expensePriceRuleID${i}`]
            : null,
        expenseAmount: +formData[`expenseAmount${i}`],
        description: formData[`description${i}`],
        attachFile: null,
        attachFile2: null,
        attachFile3: null,
        attachFile4: null,
        createBy: createBy,
        createByIp: createByIp,
      };
      addObj.attachFile =
        files[index_attch] && checkAttach
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : null;
      if (checkAttach) index_attch++;
      addObj.attachFile2 =
        files[index_attch] && checkAttach2
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : null;
      if (checkAttach2) index_attch++;
      addObj.attachFile3 =
        files[index_attch] && checkAttach3
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : null;
      if (checkAttach3) index_attch++;
      addObj.attachFile4 =
        files[index_attch] && checkAttach4
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : null;
      if (checkAttach4) index_attch++;
      expenseTransaction.push(addObj);
    }
    const visitID =
      formData[`visitID`] == 'null' ||
      formData[`visitID`] == 'undefined' ||
      !formData[`visitID`] ||
      formData[`visitID`] == null
        ? null
        : +formData[`visitID`];
    const ToursMasterID =
      formData[`ToursMasterID`] == 'null' ||
      formData[`ToursMasterID`] == 'undefined' ||
      !formData[`ToursMasterID`] ||
      formData[`ToursMasterID`] == null
        ? null
        : +formData[`ToursMasterID`];

    const projectID =
      formData[`projectID`] == 'null' ||
      formData[`projectID`] == 'undefined' ||
      !formData[`projectID`] ||
      formData[`projectID`] == null
        ? null
        : +formData[`projectID`];
    const expense_date = formData[`expense_date`];
    const userMasterID = +req.userDetails.userMasterId;
    const mailUserIDs = [];

    const findUserCompany = await companyMaster.findOne({
      where: {
        companyMasterID: userCompanyID,
      },
      attributes: ['expenseDatePicker'],
    });
    const findCompanyExpenseMailTemplate = await mailTemplateEditor.findOne({
      where: {
        status: 1,
        mailTypeID: mailTemplateTypes.expenseMailTemplate,
        companyMasterID: userCompanyID,
      },
    });
    const findCompanyNotificationPolicyData =
      await findCompanyNotificationPolicy(userCompanyID);
    if (findUserCompany && findUserCompany.expenseDatePicker) {
      const diffInDays = Math.abs(
        moment(currentdate).diff(moment(expense_date), 'days')
      );

      if (+diffInDays > +findUserCompany.expenseDatePicker) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.expenseDatePicker(days),
        });
      }
    }

    const authorizationdetails = await findAuthorizationDetails(
      authorizationMasterTypes.expense,
      userMasterID
    );

    let authStatus = 0;
    if (authorizationdetails) {
      if (
        +authorizationdetails.AuthorizationCriteriaID ==
        authorizationCriteriaType.SEQUENCENO
      ) {
        authStatus = 2;
      } else {
        authStatus = 1;
      }
    }
    const insetExpenseData = await UserExpense.create(
      {
        visitID,
        userMasterID,
        ToursMasterID,
        projectID,
        expense_date,
        // expenseCategoryId,
        expenseTransaction,
        authorizationStatus: authStatus,
        createBy,
        createByIp,
      },
      { transaction }
    );
    const expenseHeadIds = new Set();
    expenseTransaction.forEach(async (option) => {
      option['userExpenseID'] = insetExpenseData.userExpenseID;
      option['authorizationStatus'] = authStatus;
      option['createBy'] = createBy;
      option['createByIp'] = createByIp;
      option['AuthorizationCriteriaID'] =
        authorizationdetails && +authorizationdetails.AuthorizationCriteriaID
          ? +authorizationdetails.AuthorizationCriteriaID
          : null;
      expenseHeadIds.add(option['expenseHeadId']);
    });
    await UserExpenseTransaction.bulkCreate(expenseTransaction, {
      returning: true,
      transaction,
    }).then(async (response) => {
      if (authorizationdetails) {
        const inboxArray = [];
        const getAllUserDetails = await UserMaster.findAll({
          distinct: true,
          where: {
            userMasterID: [
              ...authorizationdetails.AuthorizedByUserMasterId,
              userMasterID,
            ],
          },
          attributes: userAttributes,
          include: [
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
          ],
        });
        const findExpenseHeadData = await UserExpenseHeadModel.findAll({
          where: {
            expenseHeadId: {
              [Sequelize.Op.in]: [...expenseHeadIds],
            },
          },
          include: [
            {
              model: ExpenseCategory,
            },
          ],
        });

        let ExpenseType = '';
        if (visitID) ExpenseType = expenseTypes.VISIT;
        else if (ToursMasterID) ExpenseType = expenseTypes.TOUR;
        else if (projectID) ExpenseType = expenseTypes.PROJECT;
        else ExpenseType = expenseTypes.PERSONAL;

        if (
          +authorizationdetails.AuthorizationCriteriaID ==
          authorizationCriteriaType.SEQUENCENO
        ) {
          for (let i = 0; i < response.length; i++) {
            const findHeadData = findExpenseHeadData.find(
              (e) => e.expenseHeadId == response[i].expenseHeadId
            );
            const insetExpenseAuthRequest =
              await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: response[i].userExpenseTransactionID,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy,
                  createByIp,
                },
                { transaction }
              );

            const authorizerData = getAllUserDetails.find(
              (e) =>
                e.userMasterID ==
                +authorizationdetails.AuthorizedByUserMasterId[0]
            );

            const userData = getAllUserDetails.find(
              (e) => e.userMasterID == +userMasterID
            );

            if (authorizerData && userData) {
              inboxArray.push({
                activityTable: UserExpense.getTableName(),
                activityTablePK:
                  insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
                message: `${userData.displayName} has applied for Expense of ${expenseTransaction[i].expenseAmount}`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
                assignedBy: userMasterID,
              });

              let notification = {
                title:
                  'Hey ' +
                  authorizerData.firstName +
                  '! Someone requested for expense',
                body:
                  userData.firstName + ' has requested for expense approval',
              };
              let data = {
                screen: 'expenserequest',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              sendNotification_NEW(
                authorizerData.firebaseToken,
                authorizerData.deviceType,
                notification,
                data
              );

              if (
                findCompanyExpenseMailTemplate &&
                findCompanyNotificationPolicyData &&
                authorizerData.email &&
                userData.email
              ) {
                // send mail
                sendMailforExpense_With_Transaction(
                  authorizerData.email,
                  userData,
                  findHeadData?.expenseHead || '', //Expense Head
                  findHeadData?.expenseCategory?.expenseCategory || '', //Expense Category
                  response[i].expenseAmount,
                  response[i].description,
                  findCompanyExpenseMailTemplate,
                  findCompanyNotificationPolicyData,
                  ExpenseType,
                  expense_date
                );
              }
            }
          }
        } else {
          for (let j = 0; j < response.length; j++) {
            const findHeadData = findExpenseHeadData.find(
              (e) => e.expenseHeadId == response[j].expenseHeadId
            );
            for (
              let i = 0;
              i < authorizationdetails.AuthorizedByUserMasterId.length;
              i++
            ) {
              const insetExpenseAuthRequest =
                await ExpenseAuthorizationRequest.create(
                  {
                    ReferenceID: response[j].userExpenseTransactionID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[i],
                    status: 1,
                    authstatus: 2,
                    createBy,
                    createByIp,
                  },
                  { transaction }
                );

              const authorizerData = getAllUserDetails.find(
                (e) =>
                  e.userMasterID ==
                  +authorizationdetails.AuthorizedByUserMasterId[i]
              );
              const userData = getAllUserDetails.find(
                (e) => e.userMasterID == +userMasterID
              );

              if (authorizerData && userData) {
                inboxArray.push({
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
                  message: `${userData.displayName} has applied for Expense from ${expenseTransaction[j].expenseAmount}`,
                  assignedTo: authorizationdetails.AuthorizedByUserMasterId[i],
                  assignedBy: userMasterID,
                });

                let notification = {
                  title:
                    'Hey ' +
                    authorizerData.firstName +
                    '! Someone requested for expense',
                  body:
                    userData.firstName + ' has requested for expense approval',
                };
                let data = {
                  screen: 'expenserequest',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };

                sendNotification_NEW(
                  authorizerData.firebaseToken,
                  authorizerData.deviceType,
                  notification,
                  data
                );

                if (
                  findCompanyExpenseMailTemplate &&
                  findCompanyNotificationPolicyData &&
                  authorizerData.email &&
                  userData.email
                ) {
                  // send mail
                  sendMailforExpense_With_Transaction(
                    authorizerData.email,
                    userData,
                    findHeadData?.expenseHead || '', //Expense Head
                    findHeadData?.expenseCategory?.expenseCategory || '', //Expense Category
                    response[j].expenseAmount,
                    response[j].description,
                    findCompanyExpenseMailTemplate,
                    findCompanyNotificationPolicyData,
                    ExpenseType,
                    expense_date
                  );
                }
              }

              mailUserIDs.push(
                authorizationdetails.AuthorizedByUserMasterId[i]
              );
            }
          }
        }

        await UserInbox.bulkCreate(inboxArray, {
          transaction,
        });
      }
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Expense'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
exports.userExpenseNew_V2 = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      fromDate,
      toDate,
      expenseType,
      status,
      page = 1,
      limit = 10,
      exportData,
    } = await req.body;
    const paginationQuery = {};
    const userMasterID = +req.userDetails.userMasterId;

    if (!exportData) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }
    req.userDetails.accessibleCompanies = companyMasterID;

    const expenseTypeCondition = {};
    if (expenseType === expenseTypes.VISIT) {
      expenseTypeCondition.visitID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.TOUR) {
      expenseTypeCondition.ToursMasterID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.PERSONAL) {
      expenseTypeCondition.visitID = null;
      expenseTypeCondition.ToursMasterID = null;
      expenseTypeCondition.projectID = null;
    }
    if (expenseType === expenseTypes.PROJECT) {
      expenseTypeCondition.projectID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (fromDate && toDate) {
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }

    const condition = { status: { [Sequelize.Op.ne]: 10 } };

    if (status === expenseApprovalTypes.PAID) {
      condition.authorizationStatus = '3';
      condition[Sequelize.Op.or] = [
        { erpJvid: { [Sequelize.Op.ne]: null } },
        { payment_Id: { [Sequelize.Op.ne]: null } },
      ];
    }

    if (status === expenseApprovalTypes.APPROVED) {
      condition.authorizationStatus = '3';
      condition.erpJvid = { [Sequelize.Op.eq]: null };
      condition.payment_Id = { [Sequelize.Op.eq]: null };
    }
    if (status === expenseApprovalTypes.PENDING) {
      condition.authorizationStatus = { [Sequelize.Op.in]: ['0', '1', '2'] };
    }
    if (status === expenseApprovalTypes.REJECTED) {
      condition.authorizationStatus = '4';
    }
    const { rows: userExpenseData, count } =
      await UserExpenseTransaction.findAndCountAll({
        where: { ...condition },
        ...paginationQuery,
        attributes: [
          'userExpenseTransactionID',
          'userExpenseID',
          'expenseHeadId',
          'expenseAmount',
          'attachFile',
          'attachFile2',
          'attachFile3',
          'attachFile4',
          'description',
          'authorizationStatus',
          'status',
          'AuthorizationCriteriaID',
          'erpJvid',
          'payment_Id',
        ],
        include: [
          {
            model: ExpenseHead,
            as: 'eh',
            attributes: ['expenseHeadId', 'expenseHead'],
            include: [
              {
                model: ExpenseCategory,
                as: 'ec',
                attributes: ['expenseCategoryId', 'expenseCategory'],
              },
            ],
          },
          {
            separate: true,
            model: ExpenseAuthorizationRequest,
            as: 'Auth',
            attributes: [
              'AuthorizationRequestId',
              'ReferenceID',
              'userMasterID',
              'authstatus',
              'remarks',
            ],
            include: [
              {
                required: true,
                model: UserMaster,
                as: 'authorizedPerson',
                attributes: userAttributes,
              },
            ],
          },
          {
            model: AuthorizationCriteriaMaster,
            attributes: ['AuthorizationCriteriaID', 'AuthorizationCriteria'],
          },
          {
            model: UserExpense,
            as: 'userExpense',
            where: {
              userMasterID: userMasterID,
              ...expenseTypeCondition,
            },
            attributes: [
              'userExpenseID',
              'userMasterID',
              'expense_date',
              'createdAt',
              'visitID',
              'ToursMasterID',
              'projectID',
            ],
            include: [
              {
                model: UserMaster,
                attributes: userAttributes,
                required: true,
              },
            ],
          },
        ],
        order: [
          [Sequelize.literal(`"userExpense.expense_date"`), 'DESC'],
          ['createdAt', 'DESC'],
        ],
      });

    const userExpenseCalculations = await UserExpenseTransaction.findAll({
      where: { status: { [Sequelize.Op.ne]: 10 } },
      attributes: [
        [
          sequelize.literal('"userExpenseTransaction"."authorizationStatus"'),
          'authorizationStatus',
        ],
        [sequelize.fn('SUM', sequelize.col('expenseAmount')), 'totalExpense'],
        'erpJvid',
        'payment_Id',
      ],
      group: [
        '"userExpenseTransaction"."authorizationStatus"',
        'erpJvid',
        'payment_Id',
        'userExpenseTransaction.userExpenseTransactionID',
      ],
      include: [
        {
          model: UserExpense,
          attributes: [],
          as: 'userExpense',
          where: {
            userMasterID: userMasterID,
            ...expenseTypeCondition,
          },
          include: [
            {
              model: UserMaster,
              required: true,
              attributes: [],
            },
          ],
        },
      ],
    });

    if (exportData) {
      const objectForExcel = userExpenseData.map((element, i) => {
        let ExpenseType = '';
        if (element.userExpense?.visitID) ExpenseType = expenseTypes.VISIT;
        else if (element.userExpense?.ToursMasterID)
          ExpenseType = expenseTypes.TOUR;
        else if (element.userExpense?.projectID)
          ExpenseType = expenseTypes.PROJECT;
        else ExpenseType = expenseTypes.PERSONAL;
        let expenseAuthStatus =
          +element.authorizationStatus == 4
            ? 'Rejected'
            : +element.authorizationStatus == 3 &&
                !element.erpJvid &&
                !element.payment_Id
              ? 'Approved'
              : +element.authorizationStatus == 3 &&
                  (element.erpJvid || element.payment_Id)
                ? 'Paid'
                : 'Pending';

        const authData = [];
        for (let auth of element.Auth) {
          const authSatus =
            +auth.authstatus == 0
              ? 'Rejected'
              : +auth.authstatus == 1
                ? 'Approved'
                : 'Pending';

          authData.push(`${authSatus} - ${auth.authorizedPerson.displayName}`);
        }
        return {
          'Sr. No.': i + 1,
          'Expense Type': ExpenseType,
          'Voucher No.': element.userExpense?.userExpenseID,
          'Expense Date': element.userExpense?.expense_date,
          'Expense Amount': element.expenseAmount,
          'Expense Category': element.eh.ec.expenseCategory,
          'Expense Head': element.eh.expenseHead,
          'Auth Data': authData.join(' , '),
          Description: element.description,
          'Expense Auth Status': expenseAuthStatus,
        };
      });

      await generateExcel(
        objectForExcel,
        `Expense-Report-${fromDate}-${toDate}`,
        'xlsx',
        res
      );

      return;
    }

    const Calculation = { Accepted: 0, Pending: 0, Rejected: 0, Paid: 0 };
    for (let element of userExpenseCalculations) {
      const jsonElement = element.toJSON();
      if (
        +jsonElement.authorizationStatus === 0 ||
        +jsonElement.authorizationStatus === 1 ||
        +jsonElement.authorizationStatus === 2
      )
        Calculation.Pending += +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        !jsonElement.erpJvid &&
        !jsonElement.payment_Id
      )
        Calculation.Accepted += +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        (jsonElement.erpJvid || jsonElement.payment_Id)
      )
        Calculation.Paid += +jsonElement.totalExpense;
      if (+jsonElement.authorizationStatus === 4)
        Calculation.Rejected += +jsonElement.totalExpense;
    }

    return res.status(200).json({
      data: userExpenseData,
      status: 200,
      totalcount: +count,
      userExpenseCalculations: Calculation,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateUserExpense_V2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userExpenseTransactionID,
      expenseAmount,
      expenseHeadId,
      expensePriceRuleID,
      attachFile,
      attachFile2,
      description,
      isNewAttachment,
      isNewAttachment2,
      version,
    } = await req.body;
    let i = 0;
    if (isNewAttachment == 'true') {
      attachFile =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile && attachFile != 'null'
            ? attachFile
            : null;
      i++;
    }
    if (isNewAttachment2 == 'true') {
      attachFile2 =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile2 && attachFile2 != 'null'
            ? attachFile2
            : null;
    }

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await UserExpenseTransaction.update(
      {
        expenseAmount,
        attachFile,
        attachFile2,
        description,
        expenseHeadId,
        expensePriceRuleID:
          expensePriceRuleID &&
          expensePriceRuleID != 'null' &&
          expensePriceRuleID != ''
            ? expensePriceRuleID
            : null,
        version,
        updateBy,
        updateByIp,
      },
      {
        where: { userExpenseTransactionID: +userExpenseTransactionID },
        transaction,
      }
    );

    const expenseAuthorizationRequest =
      await ExpenseAuthorizationRequest.findAll({
        raw: true,
        where: {
          ReferenceID: +userExpenseTransactionID,
        },
        attributes: [
          'AuthorizationRequestId',
          [
            Sequelize.col(
              'userExpenseTransaction.userExpense.userMaster.displayName'
            ),
            'displayName',
          ],
        ],
        include: [
          {
            model: UserExpenseTransaction,
            attributes: [],
            include: [
              {
                model: UserExpense,
                as: 'userExpense',
                attributes: [],
                include: [
                  {
                    model: UserMaster,
                    attributes: [],
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

    let AuthorizationRequestIds = expenseAuthorizationRequest.map(
      (form) => form.AuthorizationRequestId
    );

    if (expenseAuthorizationRequest.length != 0) {
      await UserInbox.update(
        {
          message: `${expenseAuthorizationRequest[0].displayName} has applied for Expense of ${expenseAmount}`,
        },
        {
          where: {
            activityTable: UserExpense.getTableName(),
            activityTablePK: AuthorizationRequestIds,
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('User Expense'),
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.reapply_V2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    let {
      oldExpenseTransID,
      userExpenseID,
      expenseAmount,
      expenseHeadId,
      expensePriceRuleID,
      attachFile,
      attachFile2,
      attachFile3,
      attachFile4,
      description,
      version,
      isNewAttachment,
      isNewAttachment2,
      isNewAttachment3,
      isNewAttachment4,
      userMasterID,
      filesTobeRemoved,
    } = await req.body;
    let i = 0;
    if (isNewAttachment == 'true') {
      attachFile =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile && attachFile != 'null'
            ? attachFile
            : null;
      i++;
    }
    if (isNewAttachment2 == 'true') {
      attachFile2 =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile2 && attachFile2 != 'null'
            ? attachFile2
            : null;
      i++;
    }
    if (isNewAttachment3 == 'true') {
      attachFile3 =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile3 && attachFile3 != 'null'
            ? attachFile3
            : null;
      i++;
    }
    if (isNewAttachment4 == 'true') {
      attachFile4 =
        req.files && req.files[i]
          ? `uploads/user-Expense/${req.files[i].filename}`
          : attachFile4 && attachFile4 != 'null'
            ? attachFile4
            : null;
    }
    const filesString = filesTobeRemoved ? filesTobeRemoved : '';
    const filesTobeRemove = filesString.split(',').map((file) => file.trim());

    for (let file of filesTobeRemove) {
      const filePath = path.join(__dirname, `../${file}`);
      fs.unlink(filePath, function (err) {
        if (err) console.log(err);
      });
    }
    const authorizationdetails = await findAuthorizationDetails(
      authorizationMasterTypes.expense,
      userMasterID
    );

    let authStatus = 0;
    if (authorizationdetails) {
      if (
        +authorizationdetails.AuthorizationCriteriaID ==
        authorizationCriteriaType.SEQUENCENO
      ) {
        authStatus = 2;
      } else {
        authStatus = 1;
      }
    }
    await UserExpenseTransaction.update(
      {
        status: 10,
      },
      {
        where: { userExpenseTransactionID: +oldExpenseTransID },
        transaction,
      }
    );
    let insert_db_status = await UserExpenseTransaction.create(
      {
        oldExpenseTransID,
        userExpenseID,
        expenseAmount,
        expenseHeadId,
        expensePriceRuleID,
        attachFile,
        attachFile2,
        attachFile3,
        attachFile4,
        description,
        authorizationStatus: authStatus,
        version,
        createBy,
        createByIp,
        AuthorizationCriteriaID:
          authorizationdetails && +authorizationdetails.AuthorizationCriteriaID
            ? +authorizationdetails.AuthorizationCriteriaID
            : null,
      },
      { transaction }
    );
    if (authorizationdetails) {
      const inboxArray = [];
      const getAllUserDetails = await UserMaster.findAll({
        raw: true,
        distinct: true,
        where: {
          userMasterID: [
            ...authorizationdetails.AuthorizedByUserMasterId,
            userMasterID,
          ],
        },
        include: [
          {
            model: companyMaster,
            attributes: companyAttributes,
          },
        ],
        attributes: userAttributes,
        transaction,
      });
      if (
        +authorizationdetails.AuthorizationCriteriaID ==
        authorizationCriteriaType.SEQUENCENO
      ) {
        const insetExpenseAuthRequest =
          await ExpenseAuthorizationRequest.create(
            {
              ReferenceID: +insert_db_status.userExpenseTransactionID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              status: 1,
              authstatus: 2,
              createBy,
              createByIp,
            },
            { transaction }
          );

        const authorizerData = getAllUserDetails.find(
          (e) =>
            e.userMasterID == +authorizationdetails.AuthorizedByUserMasterId[0]
        );

        const userData = getAllUserDetails.find(
          (e) => e.userMasterID == +userMasterID
        );

        if (authorizerData && userData) {
          inboxArray.push({
            activityTable: UserExpense.getTableName(),
            activityTablePK:
              insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
            message: `${userData.displayName} has applied for Expense of ${expenseAmount}`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          });

          let notification = {
            title:
              'Hey ' +
              authorizerData.firstName +
              '! Someone reapplied for expense',
            body: userData.firstName + ' has reapplied for expense approval',
          };
          let data = {
            screen: 'expenserequest',
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
      } else {
        for (
          let i = 0;
          i < authorizationdetails.AuthorizedByUserMasterId.length;
          i++
        ) {
          const insetExpenseAuthRequest =
            await ExpenseAuthorizationRequest.create(
              {
                ReferenceID: insert_db_status.userExpenseTransactionID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[i],
                status: 1,
                authstatus: 2,
                createBy,
                createByIp,
              },
              { transaction }
            );

          const authorizerData = getAllUserDetails.find(
            (e) =>
              e.userMasterID ==
              +authorizationdetails.AuthorizedByUserMasterId[i]
          );
          const userData = getAllUserDetails.find(
            (e) => e.userMasterID == +userMasterID
          );

          if (authorizerData && userData) {
            inboxArray.push({
              activityTable: UserExpense.getTableName(),
              activityTablePK:
                insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
              message: `${userData.displayName} has applied for Expense from ${expenseAmount}`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[i],
              assignedBy: userMasterID,
            });

            let notification = {
              title:
                'Hey ' +
                authorizerData.firstName +
                '! Someone reapplied for expense',
              body: userData.firstName + ' has reapplied for expense approval',
            };
            let data = {
              screen: 'expenserequest',
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
      }
      await UserInbox.bulkCreate(inboxArray, {
        transaction,
      });
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.reapplyMessage('Expense'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.updateDatabaseImage = async (req, res, next) => {
  try {
    const { fromuserExpenseTransactionID, touserExpenseTransactionID } =
      req.body;
    if (!touserExpenseTransactionID || !fromuserExpenseTransactionID) {
      return res.status(200).json({
        status: 401,
        message: 'Invalid parameters!',
        data: [],
      });
    }
    const { rows: findExpenseData, count } =
      await UserExpenseTransaction.findAndCountAll({
        where: {
          attachFile: {
            [Sequelize.Op.and]: [
              { [Sequelize.Op.ne]: null },
              { [Sequelize.Op.ne]: '' },
            ],
          },
          userExpenseTransactionID: {
            [Sequelize.Op.between]: [
              fromuserExpenseTransactionID,
              touserExpenseTransactionID,
            ],
          },
        },
        attributes: ['userExpenseTransactionID', 'attachFile'],
        order: [['userExpenseTransactionID', 'ASC']],
      });

    for (let expense of findExpenseData) {
      console.log(
        'userExpenseTransactionID',
        expense.userExpenseTransactionID,
        '-----------------'
      );

      if (
        expense.attachFile &&
        expense.attachFile != null &&
        expense.attachFile != '' &&
        expense.attachFile.startsWith('/')
      ) {
        let dataUrl = 'data:image/png;base64,' + expense.attachFile;
        let fileName = `${expense.userExpenseTransactionID}_${Date.now()}.png`;
        let filePath = `uploads/user-Expense/`;
        let newAttachment = filePath + fileName;
        attendancePhotobase64Topng(dataUrl, fileName, filePath);
        await UserExpenseTransaction.update(
          {
            attachFile: newAttachment,
          },
          {
            where: {
              userExpenseTransactionID: expense.userExpenseTransactionID,
            },
          }
        );
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Expense'),
      updatedCount: findExpenseData.length,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.userExpenseNew_V3 = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      fromDate,
      toDate,
      expenseType,
      page = 1,
      limit = 10,
      userExpenseID,
    } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const userMasterID = +req.userDetails.userMasterId;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }
    req.userDetails.accessibleCompanies = companyMasterID;

    const expenseTypeCondition = {
      userMasterID: userMasterID,
    };

    if (expenseType === expenseTypes.VISIT) {
      expenseTypeCondition.visitID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.TOUR) {
      expenseTypeCondition.ToursMasterID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.PERSONAL) {
      expenseTypeCondition.visitID = null;
      expenseTypeCondition.ToursMasterID = null;
      expenseTypeCondition.projectID = null;
    }
    if (expenseType === expenseTypes.PROJECT) {
      expenseTypeCondition.projectID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: message.usermessage.validDateRange() });
      }
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }

    if (userExpenseID) {
      expenseTypeCondition.userExpenseID = userExpenseID;
    }
    const { rows: findallExpenses, count } = await UserExpense.findAndCountAll({
      where: expenseTypeCondition,
      ...paginationQuery,
      order: [['expense_date', 'DESC']],
      distinct: true,
      attributes: {
        include: [
          [
            Sequelize.literal(`(
    SELECT json_build_object(
      'pending', COUNT(*) FILTER (
        WHERE uet."deletedAt" IS NULL 
        AND uet."authorizationStatus" IN (0, 1, 2)
        AND uet."status" = 1
      ),
      'approved', COUNT(*) FILTER (
        WHERE uet."deletedAt" IS NULL 
        AND uet."authorizationStatus" = 3
        AND uet."status" = 1
        AND (uet."erpJvid" IS NULL OR uet."erpJvid" = '')
        AND uet."payment_Id" IS NULL
        ),
      'paid', COUNT(*) FILTER (
        WHERE uet."deletedAt" IS NULL 
        AND uet."authorizationStatus" = 3
        AND uet."status" = 1
        AND ((uet."erpJvid" IS NOT NULL OR uet."erpJvid" != '')
        OR uet."payment_Id" IS NOT NULL)
      ),
      'rejected', COUNT(*) FILTER (
        WHERE uet."deletedAt" IS NULL 
        AND uet."authorizationStatus" = 4
        AND uet."status" = 1
      ),
      'reapplied', COUNT(*) FILTER (
        WHERE uet."deletedAt" IS NULL
        AND uet.version NOTNULL
      ),
      'total', COUNT(*) FILTER (
        WHERE uet."status" = 1
      ),
      'pendingAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL 
            AND uet."authorizationStatus" IN (0, 1, 2)
            AND uet."status" = 1
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0),
      'approvedAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL 
            AND uet."authorizationStatus" = 3
            AND uet."status" = 1 
           AND (uet."erpJvid" IS NULL OR uet."erpJvid" = '')
            AND uet."payment_Id" IS NULL
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0),
      'paidAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL 
            AND uet."authorizationStatus" = 3
            AND uet."status" = 1
            AND ((uet."erpJvid" IS NOT NULL OR uet."erpJvid" != '')
            OR uet."payment_Id" IS NOT NULL)
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0),
      'rejectedAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL 
            AND uet."authorizationStatus" = 4
            AND uet."status" = 1
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0),
      'totalExpenseAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL 
            AND uet."status" = 1
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0),
       'reappliedAmount', COALESCE(SUM(
        CASE 
          WHEN uet."deletedAt" IS NULL
            AND uet.version NOTNULL
          THEN uet."expenseAmount" 
          ELSE 0 
        END
      ), 0)
    )
    FROM "userExpenseTransactions" AS uet 
    WHERE uet."userExpenseID" = "userExpense"."userExpenseID" AND uet."deletedAt" IS NULL
  )`),
            'expenseSummary',
          ],
        ],
      },
    });
    const userExpenseCalculations = await UserExpenseTransaction.findAll({
      where: { status: { [Sequelize.Op.ne]: 10 } },
      attributes: [
        [
          sequelize.literal('"userExpenseTransaction"."authorizationStatus"'),
          'authorizationStatus',
        ],
        [sequelize.fn('SUM', sequelize.col('expenseAmount')), 'totalExpense'],
        'erpJvid',
        'payment_Id',
      ],
      group: [
        '"userExpenseTransaction"."authorizationStatus"',
        'erpJvid',
        'payment_Id',
        'userExpenseTransaction.userExpenseTransactionID',
      ],
      include: [
        {
          model: UserExpense,
          attributes: [],
          as: 'userExpense',
          where: {
            userMasterID: userMasterID,
            ...expenseTypeCondition,
          },
        },
      ],
    });

    const Calculation = { Accepted: 0, Pending: 0, Rejected: 0, Paid: 0 };
    for (let element of userExpenseCalculations) {
      const jsonElement = element.toJSON();
      if (
        +jsonElement.authorizationStatus === 0 ||
        +jsonElement.authorizationStatus === 1 ||
        +jsonElement.authorizationStatus === 2
      )
        Calculation.Pending += +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        !jsonElement.erpJvid &&
        !jsonElement.payment_Id
      )
        Calculation.Accepted += +jsonElement.totalExpense;
      if (
        +jsonElement.authorizationStatus === 3 &&
        (jsonElement.erpJvid || jsonElement.payment_Id)
      )
        Calculation.Paid += +jsonElement.totalExpense;
      if (+jsonElement.authorizationStatus === 4)
        Calculation.Rejected += +jsonElement.totalExpense;
    }

    return res.status(200).json({
      data: findallExpenses,
      status: 200,
      totalcount: +count,
      userExpenseCalculations: Calculation,
    });
  } catch (err) {
    next(err);
  }
};

exports.userExpenseByID = async (req, res, next) => {
  try {
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const { authorizerUserMasterID, userExpenseID, isPrintVoucher } =
      await req.body;
    if (!userExpenseID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });
    const expenseAuthCondition = {};
    expenseAuthCondition.status = 1;
    expenseAuthCondition.userMasterID = req.userDetails.userMasterId;
    const findExpenseData = await UserExpense.findOne({
      where: { userExpenseID },
      include: [
        {
          required: true,
          model: UserMaster,
          attributes: userAttributes,
          include: [
            {
              model: companyMaster,
              attributes: [...companyAttributes, 'companyAddress'],
            },
            {
              required: false,
              separate: true,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              separate: true,

              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeBranch,
              separate: true,

              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              separate: true,
              model: EmployeeDivision,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['divisionId', 'startDate'],
              include: [
                {
                  model: Division,
                  attributes: ['divisionName'],
                },
              ],
            },

            {
              required: false,
              separate: true,

              model: EmployeeWorkingArea,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['workingAreaId', 'startDate'],
              include: [
                {
                  model: WorkingArea,
                  attributes: ['workingAreaName'],
                },
              ],
            },
          ],
        },
        {
          required: true,
          separate: true,
          model: UserExpenseTransaction,
          where: {
            status: { [Sequelize.Op.ne]: 10 },
          },
          order: [['userExpenseTransactionID', 'ASC']],
          include: [
            {
              model: ExpenseHead,
              attributes: ['expenseHeadId', 'expenseHead', 'expenseCategoryId'],
              include: [
                {
                  model: ExpenseCategory,
                  attributes: ['expenseCategoryId', 'expenseCategory'],
                },
              ],
            },
            {
              required: false,
              model: AuthorizationCriteriaMaster,
              attributes: ['AuthorizationCriteriaID', 'AuthorizationCriteria'],
            },
            {
              separate: true,
              model: ExpenseAuthorizationRequest,
              include: [
                {
                  required: true,
                  model: UserMaster,
                  as: 'authorizedPerson',
                  attributes: userAttributes,
                },
              ],
            },
            {
              separate: true,
              model: ExpenseAuthorizationRequest,
              as: 'Auth',
              where: expenseAuthCondition,
            },
          ],
        },
        {
          required: false,
          model: Project,
          attributes: [
            'projectID',
            'projectName',
            'display_id',
            'short_name',
            'projectDescription',
          ],
        },
      ],
    });
    if (isPrintVoucher) {
      let totalExpenseAmount = 0;

      const expenseData = (findExpenseData.userExpenseTransactions || []).map(
        (e, i) => {
          totalExpenseAmount += e.expenseAmount;

          return {
            index: i + 1,
            expenseDate: moment(
              findExpenseData.expense_date,
              'YYYY-MM-DD'
            ).format('DD-MM-YYYY'),
            expenseCategory: e.expenseHead?.expenseCategory?.expenseCategory,
            expenseHead: e.expenseHead?.expenseHead,
            expenseAmount: e.expenseAmount,
          };
        }
      );

      const voucherData = {
        companyName:
          findExpenseData?.userMaster?.companyMaster?.companyName || '',
        month: moment(filterDate, 'YYYY-MM-DD').format('MMMM YYYY'),
        companyAddress: findExpenseData?.companyMaster?.companyAddress || '',
        userExpenseID: findExpenseData.userExpenseID,
        employeeName: findExpenseData?.userMaster?.employeeJoiningDetails?.[0]
          ?.employeeCode
          ? `${findExpenseData?.userMaster?.displayName} (${findExpenseData?.userMaster?.employeeJoiningDetails?.[0]?.employeeCode})`
          : findExpenseData?.userMaster?.displayName || '',
        totalExpenseAmount,
        expenseData,
        projectName: findExpenseData?.project?.display_id
          ? `${findExpenseData?.project?.projectName} (${findExpenseData?.project?.display_id})`
          : findExpenseData?.project?.projectName
            ? findExpenseData?.project?.projectName
            : '',
      };

      let base64path = '';
      const PageBreak = `<div class="pageBreak" style="page-break-before: always; break-before: page; height: 0; margin: 0; display: block;"></div>`;

      base64path = await generateHTMLToPDF_base64Path(
        voucherData,
        'expenseVoucher',
        'portrait',
        'html' //File Extension
      );
      return res.status(200).json({
        data: base64path,
        status: 200,
      });
    } else {
      return res.status(200).json({
        data: findExpenseData,
        status: 200,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.updatebyUserExpenseID = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    const companyMasterID = req.userDetails.companyMasterId;
    const userCompanyID = +req.userDetails.companyMasterId;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const formData = req.body;
    const userExpenseID = +formData['userExpenseID'];
    const files = req.files;
    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('expenseHeadId')
    ).length;
    const expenseTransactionTobeDestroyed = [];
    const expenseTransactionTobeAdd = [];
    const expenseTransactionTobeUpdate = [];
    const userExpenseTransactionIDs = [];
    let index_attch = 0;
    for (let i = 0; i < entryCount; i++) {
      const checkAttach =
        formData[`isNewAttachment_${i}`] == 'true' ? true : false;
      const checkAttach2 =
        formData[`isNewAttachment2_${i}`] == 'true' ? true : false;
      const checkAttach3 =
        formData[`isNewAttachment3_${i}`] == 'true' ? true : false;
      const checkAttach4 =
        formData[`isNewAttachment4_${i}`] == 'true' ? true : false;
      let addObj = {
        expenseHeadId: +formData[`expenseHeadId${i}`],
        expensePriceRuleID: formData[`expensePriceRuleID${i}`]
          ? +formData[`expensePriceRuleID${i}`]
          : null,
        expenseAmount: +formData[`expenseAmount${i}`],
        description: formData[`description${i}`],
        attachFile: null,
        attachFile2: null,
        attachFile3: null,
        attachFile4: null,
        updateBy: createBy,
        updateByIp: createByIp,
        userExpenseTransactionID: formData[`userExpenseTransactionID_${i}`]
          ? +formData[`userExpenseTransactionID_${i}`]
          : null,
      };
      if (addObj.userExpenseTransactionID) {
        userExpenseTransactionIDs.push(+addObj.userExpenseTransactionID);
      }
      addObj.attachFile =
        files[index_attch] && checkAttach
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : formData[`attachFile1_${i}`]
            ? formData[`attachFile1_${i}`]
            : null;
      if (checkAttach) index_attch++;

      addObj.attachFile2 =
        files[index_attch] && checkAttach2
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : formData[`attachFile2_${i}`]
            ? formData[`attachFile2_${i}`]
            : null;
      if (checkAttach2) index_attch++;

      addObj.attachFile3 =
        files[index_attch] && checkAttach3
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : formData[`attachFile3_${i}`]
            ? formData[`attachFile3_${i}`]
            : null;
      if (checkAttach3) index_attch++;

      addObj.attachFile4 =
        files[index_attch] && checkAttach4
          ? `uploads/user-Expense/${files[index_attch].filename}`
          : formData[`attachFile4_${i}`]
            ? formData[`attachFile4_${i}`]
            : null;
      if (checkAttach4) index_attch++;
      if (formData[`isRemoved_${i}`] == 'true') {
        expenseTransactionTobeDestroyed.push(addObj);
      } else if (formData[`isNewAdded_${i}`] == 'true') {
        expenseTransactionTobeAdd.push(addObj);
      } else if (
        formData[`authorizationStatus${i}`] &&
        (formData[`authorizationStatus${i}`] != '3' ||
          formData[`authorizationStatus${i}`] != '4')
      ) {
        expenseTransactionTobeUpdate.push(addObj);
      }
    }

    const filesString = formData[`filesTobeRemoved`]
      ? formData[`filesTobeRemoved`]
      : '';
    const filesTobeRemove = filesString.split(',').map((file) => file.trim());

    for (let file of filesTobeRemove) {
      if (file) {
        const filePath = path.join(__dirname, `../${file}`);
        fs.unlink(filePath, function (err) {
          if (err) console.log(err);
        });
      }
    }

    const [
      findCompanyExpenseMailTemplate,
      findCompanyNotificationPolicyData,
      findUserExpense,
      findExpenseRequestData,
    ] = await Promise.all([
      mailTemplateEditor.findOne({
        where: {
          status: 1,
          mailTypeID: mailTemplateTypes.expenseMailTemplate,
          companyMasterID: companyMasterID,
        },
      }),
      findCompanyNotificationPolicy(companyMasterID),
      UserExpense.findOne({
        where: {
          userExpenseID: userExpenseID,
        },
        include: [
          {
            model: UserMaster,
            attributes: userAttributes,
          },
        ],
      }),
      ExpenseAuthorizationRequest.findAll({
        where: {
          ReferenceID: {
            [Sequelize.Op.in]: userExpenseTransactionIDs,
          },
        },
      }),
    ]);
    if (expenseTransactionTobeAdd.length) {
      const findUserCompany = await companyMaster.findOne({
        where: {
          companyMasterID: userCompanyID,
        },
        attributes: ['expenseDatePicker'],
      });
      if (findUserCompany && findUserCompany.expenseDatePicker) {
        const diffInDays = Math.abs(
          moment(currentdate).diff(moment(findUserExpense.expense_date), 'days')
        );

        if (+diffInDays > +findUserCompany.expenseDatePicker) {
          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: message.usermessage.expenseDatePicker(days),
          });
        }
      }
    }
    const promiseArray = [];
    for (let trans of expenseTransactionTobeDestroyed) {
      const AuthorizationRequestIds = findExpenseRequestData
        .filter((e) => +e.ReferenceID == +trans.userExpenseTransactionID)
        .map((e) => +e.AuthorizationRequestId);

      const destroyInbox = UserInbox.destroy(
        {
          where: {
            activityTable: UserExpense.getTableName(),
            activityTablePK: {
              [Sequelize.Op.in]: AuthorizationRequestIds,
            },
          },
        },
        { transaction }
      );
      promiseArray.push(destroyInbox);

      const destroyAuth = ExpenseAuthorizationRequest.destroy(
        {
          where: {
            AuthorizationRequestId: {
              [Sequelize.Op.in]: AuthorizationRequestIds,
            },
          },
        },
        { transaction }
      );
      promiseArray.push(destroyAuth);
      const destroyTrans = UserExpenseTransaction.destroy(
        {
          where: {
            userExpenseTransactionID: +trans.userExpenseTransactionID,
          },
        },
        { transaction }
      );
      promiseArray.push(destroyTrans);
    }
    for (let trans of expenseTransactionTobeUpdate) {
      const AuthorizationRequestIds = findExpenseRequestData
        .filter((e) => +e.ReferenceID == +trans.userExpenseTransactionID)
        .map((e) => +e.AuthorizationRequestId);

      const updateInbox = UserInbox.update(
        {
          message: `${findUserExpense?.userMaster?.displayName} has applied for Expense of ${trans.expenseAmount}`,
        },
        {
          where: {
            activityTable: UserExpense.getTableName(),
            activityTablePK: { [Sequelize.Op.in]: AuthorizationRequestIds },
          },
          transaction,
        }
      );
      promiseArray.push(updateInbox);
      const updateTrans = UserExpenseTransaction.update(
        {
          expenseAmount: trans.expenseAmount,
          attachFile: trans.attachFile,
          attachFile2: trans.attachFile2,
          attachFile3: trans.attachFile3,
          attachFile4: trans.attachFile4,
          description: trans.description,
          expenseHeadId: trans.expenseHeadId,
          expensePriceRuleID: trans.expensePriceRuleID,
          updateBy: trans.updateBy,
          updateByIp: trans.updateByIp,
        },
        {
          where: { userExpenseTransactionID: trans.userExpenseTransactionID },
          transaction,
        }
      );
      promiseArray.push(updateTrans);
    }
    const authorizationdetails = await findAuthorizationDetails(
      authorizationMasterTypes.expense,
      findUserExpense.userMasterID
    );

    let authStatus = 0;
    if (authorizationdetails) {
      if (
        +authorizationdetails.AuthorizationCriteriaID ==
        authorizationCriteriaType.SEQUENCENO
      ) {
        authStatus = 2;
      } else {
        authStatus = 1;
      }
    }
    const createExpenseTrnas = [];
    const expenseHeadIds = new Set();

    for (let trans of expenseTransactionTobeAdd) {
      const createTransObj = {
        userExpenseID,
        expenseHeadId: trans.expenseHeadId,
        expensePriceRuleID: trans.expenseHeadId,
        expenseAmount: trans.expenseAmount,
        attachFile: trans.attachFile ? trans.attachFile : null,
        attachFile2: trans.attachFile2 ? trans.attachFile2 : null,
        attachFile3: trans.attachFile3 ? trans.attachFile3 : null,
        attachFile4: trans.attachFile4 ? trans.attachFile4 : null,
        description: trans.description,
        authorizationStatus: authStatus,
        AuthorizationCriteriaID:
          authorizationdetails && +authorizationdetails.AuthorizationCriteriaID
            ? +authorizationdetails.AuthorizationCriteriaID
            : null,
      };
      createExpenseTrnas.push(createTransObj);
      expenseHeadIds.add(trans.expenseHeadId);
    }
    const inboxArray = [];
    await UserExpenseTransaction.bulkCreate(createExpenseTrnas, {
      returning: true,
      transaction,
    }).then(async (response) => {
      if (authorizationdetails) {
        const getAllUserDetails = await UserMaster.findAll({
          distinct: true,
          where: {
            userMasterID: [
              ...authorizationdetails.AuthorizedByUserMasterId,
              findUserExpense.userMasterID,
            ],
          },
          attributes: userAttributes,
          include: [
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
          ],
        });
        const findExpenseHeadData = await UserExpenseHeadModel.findAll({
          where: {
            expenseHeadId: {
              [Sequelize.Op.in]: [...expenseHeadIds],
            },
          },
          include: [
            {
              model: ExpenseCategory,
            },
          ],
        });

        let ExpenseType = '';
        if (findUserExpense.visitID) ExpenseType = expenseTypes.VISIT;
        else if (findUserExpense.ToursMasterID) ExpenseType = expenseTypes.TOUR;
        else if (findUserExpense.projectID) ExpenseType = expenseTypes.PROJECT;
        else ExpenseType = expenseTypes.PERSONAL;

        if (
          +authorizationdetails.AuthorizationCriteriaID ==
          authorizationCriteriaType.SEQUENCENO
        ) {
          for (let i = 0; i < response.length; i++) {
            const findHeadData = findExpenseHeadData.find(
              (e) => e.expenseHeadId == response[i].expenseHeadId
            );
            const insetExpenseAuthRequest =
              await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: response[i].userExpenseTransactionID,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy,
                  createByIp,
                },
                { transaction }
              );

            const authorizerData = getAllUserDetails.find(
              (e) =>
                e.userMasterID ==
                +authorizationdetails.AuthorizedByUserMasterId[0]
            );

            const userData = getAllUserDetails.find(
              (e) => e.userMasterID == +findUserExpense.userMasterID
            );

            if (authorizerData && userData) {
              inboxArray.push({
                activityTable: UserExpense.getTableName(),
                activityTablePK:
                  insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
                message: `${userData.displayName} has applied for Expense of ${response[i].expenseAmount}`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
                assignedBy: findUserExpense.userMasterID,
              });

              let notification = {
                title:
                  'Hey ' +
                  authorizerData.firstName +
                  '! Someone requested for expense',
                body:
                  userData.firstName + ' has requested for expense approval',
              };
              let data = {
                screen: 'expenserequest',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              sendNotification_NEW(
                authorizerData.firebaseToken,
                authorizerData.deviceType,
                notification,
                data
              );

              if (
                findCompanyExpenseMailTemplate &&
                findCompanyNotificationPolicyData &&
                authorizerData.email &&
                userData.email
              ) {
                // send mail
                sendMailforExpense_With_Transaction(
                  authorizerData.email,
                  userData,
                  findHeadData?.expenseHead || '', //Expense Head
                  findHeadData?.expenseCategory?.expenseCategory || '', //Expense Category
                  response[i].expenseAmount,
                  response[i].description,
                  findCompanyExpenseMailTemplate,
                  findCompanyNotificationPolicyData,
                  ExpenseType,
                  findUserExpense.expense_date
                );
              }
            }
          }
        } else {
          for (let j = 0; j < response.length; j++) {
            const findHeadData = findExpenseHeadData.find(
              (e) => e.expenseHeadId == response[j].expenseHeadId
            );
            for (
              let i = 0;
              i < authorizationdetails.AuthorizedByUserMasterId.length;
              i++
            ) {
              const insetExpenseAuthRequest =
                await ExpenseAuthorizationRequest.create(
                  {
                    ReferenceID: response[j].userExpenseTransactionID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[i],
                    status: 1,
                    authstatus: 2,
                    createBy,
                    createByIp,
                  },
                  { transaction }
                );

              const authorizerData = getAllUserDetails.find(
                (e) =>
                  e.userMasterID ==
                  +authorizationdetails.AuthorizedByUserMasterId[i]
              );
              const userData = getAllUserDetails.find(
                (e) => e.userMasterID == +findUserExpense.userMasterID
              );

              if (authorizerData && userData) {
                inboxArray.push({
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insetExpenseAuthRequest.toJSON().AuthorizationRequestId,
                  message: `${userData.displayName} has applied for Expense from ${response[j].expenseAmount}`,
                  assignedTo: authorizationdetails.AuthorizedByUserMasterId[i],
                  assignedBy: findUserExpense.userMasterID,
                });

                let notification = {
                  title:
                    'Hey ' +
                    authorizerData.firstName +
                    '! Someone requested for expense',
                  body:
                    userData.firstName + ' has requested for expense approval',
                };
                let data = {
                  screen: 'expenserequest',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };

                sendNotification_NEW(
                  authorizerData.firebaseToken,
                  authorizerData.deviceType,
                  notification,
                  data
                );

                if (
                  findCompanyExpenseMailTemplate &&
                  findCompanyNotificationPolicyData &&
                  authorizerData.email &&
                  userData.email
                ) {
                  // send mail
                  sendMailforExpense_With_Transaction(
                    authorizerData.email,
                    userData,
                    findHeadData?.expenseHead || '', //Expense Head
                    findHeadData?.expenseCategory?.expenseCategory || '', //Expense Category
                    response[j].expenseAmount,
                    response[j].description,
                    findCompanyExpenseMailTemplate,
                    findCompanyNotificationPolicyData,
                    ExpenseType,
                    findUserExpense.expense_date
                  );
                }
              }
            }
          }
        }
      }
    });

    await Promise.all([
      await UserInbox.bulkCreate(inboxArray, {
        transaction,
      }),
      ...promiseArray,
    ]);
    await transaction.commit();
    return res.status(200).json({
      message: message.usermessage.updateMessage('User Expense'),
      status: 200,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteUserExpenseByExpenseID = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { userExpenseID } = await req.body;
    if (!userExpenseID) {
      await transaction.rollback();
      return res.status(200).json({
        message: 'Please Pass Valid Parameters',
        status: 401,
      });
    }
    const findExpenseData = await UserExpense.findOne({
      where: { userExpenseID },
      include: [
        {
          model: UserExpenseTransaction,
          attributes: [
            'userExpenseTransactionID',
            'userExpenseID',
            'version',
            'authorizationStatus',
          ],
          include: [
            {
              separate: true,
              model: ExpenseAuthorizationRequest,
              attributes: [
                'AuthorizationRequestId',
                'ReferenceID',
                'userMasterID',
                'status',
                'authstatus',
              ],
            },
          ],
        },
      ],
    });

    if (!findExpenseData) {
      await transaction.rollback();
      return res.status(200).json({
        message: message.usermessage.notFoundMessage('User Expense'),
        status: 401,
      });
    }
    const findApprovedRejectedTras =
      findExpenseData?.userExpenseTransactions?.filter(
        (e) =>
          +e.authorizationStatus != 0 &&
          +e.authorizationStatus != 1 &&
          +e.authorizationStatus != 2
      );

    if (findApprovedRejectedTras.length) {
      await transaction.rollback();
      return res.status(200).json({
        message:
          'You Can not Delete Expense Some Of Transaction is Approved Or Rejected',
        status: 401,
      });
    }

    const findTobeDeleteTransactionIDs =
      findExpenseData?.userExpenseTransactions?.map(
        (e) => +e.userExpenseTransactionID
      );

    const authorizationRequestIds =
      findExpenseData.userExpenseTransactions.reduce((acc, tx) => {
        if (Array.isArray(tx.expenseAuthorizations)) {
          for (const auth of tx.expenseAuthorizations) {
            acc.push(+auth.AuthorizationRequestId);
          }
        }
        return acc;
      }, []);

    await Promise.all([
      UserExpenseTransaction.destroy({
        where: {
          userExpenseID,
        },
        transaction,
      }),
      UserInbox.destroy({
        where: {
          activityTable: UserExpense.getTableName(),
          activityTablePK: authorizationRequestIds,
        },
        transaction,
      }),
      ExpenseAuthorizationRequest.destroy({
        where: {
          ReferenceID: findTobeDeleteTransactionIDs,
        },
        transaction,
      }),
      UserExpense.destroy({
        where: { userExpenseID },
        transaction,
      }),
    ]);
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('User Expense'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.exportMyExpense = async (req, res, next) => {
  try {
    const { fromDate, toDate, expenseType } = await req.body;
    const userMasterID = +req.userDetails.userMasterId;
    const expenseTypeCondition = {
      userMasterID: userMasterID,
    };

    if (expenseType === expenseTypes.VISIT) {
      expenseTypeCondition.visitID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.TOUR) {
      expenseTypeCondition.ToursMasterID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (expenseType === expenseTypes.PERSONAL) {
      expenseTypeCondition.visitID = null;
      expenseTypeCondition.ToursMasterID = null;
      expenseTypeCondition.projectID = null;
    }
    if (expenseType === expenseTypes.PROJECT) {
      expenseTypeCondition.projectID = {
        [Sequelize.Op.ne]: null,
      };
    }
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: message.usermessage.validDateRange() });
      }
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }

    const findallExpenses = await UserExpense.findAll({
      where: expenseTypeCondition,
      order: [['expense_date', 'DESC']],
      distinct: true,
      attributes: [
        'userExpenseID',
        'userMasterID',
        'expense_date',
        'createdAt',
        'visitID',
        'ToursMasterID',
        'projectID',
      ],
      include: [
        {
          required: true,
          separate: true,
          model: UserExpenseTransaction,
          as: 'ut',
          where: {
            status: { [Sequelize.Op.ne]: 10 },
          },
          order: [['userExpenseTransactionID', 'ASC']],
          attributes: [
            'userExpenseTransactionID',
            'userExpenseID',
            'expenseHeadId',
            'expenseAmount',
            'attachFile',
            'attachFile2',
            'attachFile3',
            'attachFile4',
            'description',
            'authorizationStatus',
            'status',
            'AuthorizationCriteriaID',
            'erpJvid',
            'payment_Id',
          ],
          include: [
            {
              model: ExpenseHead,
              as: 'eh',
              attributes: ['expenseHeadId', 'expenseHead', 'expenseCategoryId'],
              include: [
                {
                  model: ExpenseCategory,
                  as: 'ec',
                  attributes: ['expenseCategoryId', 'expenseCategory'],
                },
              ],
            },
            {
              separate: true,
              model: ExpenseAuthorizationRequest,
              as: 'Auth',
              attributes: [
                'AuthorizationRequestId',
                'ReferenceID',
                'userMasterID',
                'authstatus',
                'remarks',
              ],
              include: [
                {
                  required: true,
                  model: UserMaster,
                  as: 'authorizedPerson',
                  attributes: userAttributes,
                },
              ],
            },
          ],
        },
      ],
    });
    const finalDataToExport = [];
    let index = 0;

    for (let item of findallExpenses) {
      const transData = item.ut || [];
      let ExpenseType = '';
      if (item.visitID) ExpenseType = expenseTypes.VISIT;
      else if (item.ToursMasterID) ExpenseType = expenseTypes.TOUR;
      else if (item.projectID) ExpenseType = expenseTypes.PROJECT;
      else ExpenseType = expenseTypes.PERSONAL;
      for (let tran of transData) {
        let expenseAuthStatus =
          +tran.authorizationStatus == 4
            ? 'Rejected'
            : +tran.authorizationStatus == 3 &&
                !tran.erpJvid &&
                !tran.payment_Id
              ? 'Approved'
              : +tran.authorizationStatus == 3 &&
                  (tran.erpJvid || tran.payment_Id)
                ? 'Paid'
                : 'Pending';

        const authData = [];
        for (let auth of tran.Auth) {
          const authSatus =
            +auth.authstatus == 0
              ? 'Rejected'
              : +auth.authstatus == 1
                ? 'Approved'
                : 'Pending';

          authData.push(`${authSatus} - ${auth.authorizedPerson.displayName}`);
        }
        const Info = [
          index + 1,
          ExpenseType,
          moment(item.expense_date, 'YYYY-MM-DD').format('DD-MM-YYYY') || '',
          item.userExpenseID,
          new Date(item.createdAt),
          tran.eh?.ec?.expenseCategory || '', //Main Category
          tran.eh?.expenseHead || '', //Sub Category
          tran.expenseAmount, // Expense Amount
          tran.description, //Description
          expenseAuthStatus,
          authData,
          tran.attachFile && tran.attachFile.startsWith('uploads')
            ? `${mainApiUrl}${tran.attachFile}`
            : ' ',
          tran.attachFile2 && tran.attachFile2.startsWith('uploads')
            ? `${mainApiUrl}${tran.attachFile2}`
            : ' ',
          tran.attachFile3 && tran.attachFile3.startsWith('uploads')
            ? `${mainApiUrl}${tran.attachFile3}`
            : ' ',
          tran.attachFile4 && tran.attachFile4.startsWith('uploads')
            ? `${mainApiUrl}${tran.attachFile4}`
            : ' ',
        ];
        finalDataToExport.push(Info);
      }
      index++;
    }

    await generateExcelForMyExpense(
      finalDataToExport,
      'Expense Report',
      'xlsx',
      res
    );
    return;
  } catch (err) {
    next(err);
  }
};
