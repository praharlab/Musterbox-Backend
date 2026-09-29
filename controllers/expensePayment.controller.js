const expensePayment = require('../models/expensePayment');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { log } = require('handlebars');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const { executeQuery } = require('./common.controller');
const UserMaster = require('../models/userMaster');
const erpAcountMasters = require('../models/erpAccountMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const Department = require('../models/department');
const EmployeeDepartment = require('../models/employeeDepartment');
const Designation = require('../models/designation');
const EmployeeDesignation = require('../models/employeeDesignation');
const {
  asiaKolkataDateTime,
  authorization,
  isValidDate,
} = require('../utils/commonUtilFunctions');
const moment = require('moment');
const {
  generateExcel,
  generateDemoExcelForExpensePayment,
} = require('../utils/exportData');
const erpIntegration = require('../models/erpIntegration');
const axios = require('axios');
const companyMaster = require('../models/companyMaster');
const UserExpense = require('../models/userExpense');
const ExpenseHead = require('../models/expenseHead');
const { usermessage } = require('../response_message/message');
const fs = require('fs');
const path = require('path');
const readXlsxFile = require('read-excel-file/node');
const { paymentMode } = require('../utils/dbUtils');

exports.expensePaymentData = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, expensefilter } = await req.body;

    const condition = {};

    if (userMasterID) condition.userMasterID = userMasterID;

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (expensefilter == 0) {
      const { rows, count } = await UserExpenseTransaction.findAndCountAll({
        raw: true,
        where: {
          authorizationStatus: 3,
          payment_Id: null,
        },
        ...paginationQuery,
        include: [
          {
            model: ExpenseHead,
            attributes: ['expenseHeadId', 'expenseHead'],
          },
          {
            model: UserExpense,
            as: 'userExpense',
            where: condition,
            attributes: ['expense_date', 'userMasterID'],
            include: [
              {
                model: UserMaster,
                attributes: ['userNumber', 'displayName', 'userMasterID'],
                include: [
                  { model: erpAcountMasters, attributes: ['erpAcountID'] },
                  {
                    required: false,
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
                ],
              },
            ],
          },
        ],
        order: [['userExpenseTransactionID', 'DESC']],
      });

      const finaldata = rows.map((e) => {
        return {
          userMasterID: e['userExpense.userMaster.userMasterID'],
          userExpenseTransactionID: e.userExpenseTransactionID,
          expenseAmount: e.expenseAmount,
          designationName:
            e[
              'userExpense.userMaster.employeeDesignations.designation.designa'
            ],
          departmentName:
            e[
              'userExpense.userMaster.employeeDepartments.department.departmen'
            ],
          employeeCode:
            e['userExpense.userMaster.employeeJoiningDetails.employeeCode'],
          'userMaster.displayName': e['userMaster.displayName'],
          branchName:
            e[
              'userExpense.userMaster.employeeBranches.branchMaster.branchName'
            ],
          'userMaster.userNumber': e['userMaster.userNumber'],
          authorizationStatus: e.authorizationStatus,
          erpAcountID: e['userExpense.userMaster.erpAcountMasters.erpAcountID'],
          expense_date: e['userExpense.expense_date'],
          erpJvid: e.erpJvid,
          expenseHead: e['expenseHead.expenseHead'],
          'userMaster.displayName': e['userExpense.userMaster.displayName'],
          'userMaster.userNumber': e['userExpense.userMaster.userNumber'],
        };
      });

      return res.status(200).json({
        status: 200,
        data: finaldata,
        totalcount: count,
      });
    } else if (expensefilter == 1) {
      const { rows } = await UserExpense.findAndCountAll({
        raw: true,
        where: { userMasterID },
        include: [
          {
            required: true,
            model: UserExpenseTransaction,
            attributes: [],
            where: {
              authorizationStatus: 3,
              payment_Id: null,
            },
          },
          {
            model: UserMaster,
            attributes: ['displayName', 'userNumber'],
            include: [
              { model: erpAcountMasters, attributes: [] },
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

                attributes: [],
                include: [
                  {
                    model: Designation,
                    as: 'designation',
                    attributes: [],
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

                attributes: [],
                include: [
                  {
                    model: Department,
                    as: 'department',
                    attributes: [],
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
                attributes: [],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: [],
                  },
                ],
              },
              {
                required: false,
                model: EmployeeJoiningDetails,
                attributes: [],
              },
            ],
          },
        ],

        attributes: [
          'userExpense.userMasterID',
          [
            sequelize.fn(
              'SUM',
              sequelize.col('userExpenseTransactions.expenseAmount')
            ),
            'expenseAmount',
          ],
          'userMaster.employeeDesignations.designationID',
          'userMaster.employeeDesignations.designation.designationName',
          'userMaster.employeeJoiningDetails.employeeCode',
          'userMaster.employeeDepartments.departmentID',
          'userMaster.employeeDepartments.department.departmentName',
          'userMaster.employeeBranches.branchID',
          'userMaster.employeeBranches.branchMaster.branchName',
          'userMaster.erpAcountMasters.erpAcountID',
          'userExpenseTransactions.authorizationStatus',
        ],

        group: [
          'userExpense.userMasterID',
          'userMaster.displayName',
          'userMaster.userNumber',
          'userMaster.employeeDesignations.designationID',
          'userMaster.employeeDesignations.designation.designationName',
          'userMaster.employeeJoiningDetails.employeeCode',
          'userMaster.employeeDepartments.departmentID',
          'userMaster.employeeDepartments.department.departmentName',
          'userMaster.employeeBranches.branchID',
          'userMaster.employeeBranches.branchMaster.branchName',
          'userMaster.erpAcountMasters.erpAcountID',
          'userExpenseTransactions.authorizationStatus',
        ],
      });

      const data = await UserExpenseTransaction.findAll({
        raw: true,
        where: {
          authorizationStatus: 3,
          payment_Id: null,
        },
        attributes: ['userExpenseTransactionID'],
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
            where: condition,
          },
        ],
      });

      const finalRows = rows.map((e) => {
        // Filter the data based on userMasterID
        const findData = data.filter(
          (expense) => expense['userExpense.userMasterID'] === e.userMasterID
        );

        // Extract userExpenseTransactionIDs from the filtered data
        const userExpenseTransactionID = findData.reduce((acc, expense) => {
          // Push the current transaction ID to the accumulator
          acc.push(expense.userExpenseTransactionID);
          return acc;
        }, []);

        return {
          ...e,
          userExpenseTransactionID, // Correctly assign the array of transaction IDs
        };
      });

      return res.status(200).json({
        status: 200,
        data: finalRows,
        totalcount: rows.length,
      });
    } else if (expensefilter == 2) {
      const rows = await UserExpense.findAll({
        raw: true,
        where: { userMasterID },
        include: [
          {
            required: true,
            model: UserExpenseTransaction,
            where: {
              authorizationStatus: 3,
              payment_Id: null,
            },
            attributes: ['expenseHeadId'],
            include: [
              {
                model: ExpenseHead,
                attributes: ['accountHeadID'],
              },
            ],
          },
          {
            model: UserMaster,
            attributes: ['displayName', 'userNumber'],
            include: [
              { model: erpAcountMasters, attributes: [] },
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

                attributes: [],
                include: [
                  {
                    model: Designation,
                    as: 'designation',
                    attributes: [],
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

                attributes: [],
                include: [
                  {
                    model: Department,
                    as: 'department',
                    attributes: [],
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
                attributes: [],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: [],
                  },
                ],
              },
              {
                required: false,
                model: EmployeeJoiningDetails,
                attributes: [],
              },
            ],
          },
        ],

        attributes: [
          'userExpense.userMasterID',
          [
            sequelize.fn(
              'SUM',
              sequelize.col('userExpenseTransactions.expenseAmount')
            ),
            'expenseAmount',
          ],
          'userMaster.employeeDesignations.designationID',
          'userMaster.employeeDesignations.designation.designationName',
          'userMaster.employeeJoiningDetails.employeeCode',
          'userMaster.employeeDepartments.departmentID',
          'userMaster.employeeDepartments.department.departmentName',
          'userMaster.employeeBranches.branchID',
          'userMaster.employeeBranches.branchMaster.branchName',
          'userMaster.erpAcountMasters.erpAcountID',
          'userExpenseTransactions.authorizationStatus',
          'userExpense.expense_date',
          'userExpenseTransactions.expenseHeadId',
          'userExpenseTransactions.expenseHead.expenseHead',
          'userExpenseTransactions.expenseHead.accountHeadID',
          'userExpenseTransactions.erpJvid',
          // 'userExpenseTransactions.userExpenseTransactionID'
        ],

        group: [
          'userExpense.userMasterID',
          'userMaster.displayName',
          'userMaster.userNumber',
          'userMaster.employeeDesignations.designationID',
          'userMaster.employeeDesignations.designation.designationName',
          'userMaster.employeeJoiningDetails.employeeCode',
          'userMaster.employeeDepartments.departmentID',
          'userMaster.employeeDepartments.department.departmentName',
          'userMaster.employeeBranches.branchID',
          'userMaster.employeeBranches.branchMaster.branchName',
          'userMaster.erpAcountMasters.erpAcountID',
          'userExpenseTransactions.authorizationStatus',
          'userExpense.expense_date',
          'userExpenseTransactions.expenseHeadId',
          'userExpenseTransactions.expenseHead.accountHeadID',
          'userExpenseTransactions.expenseHead.expenseHeadId',
          'userExpenseTransactions.erpJvid',
          'userExpenseTransactions.expenseHead.expenseHead',
          // 'userExpenseTransactions.userExpenseTransactionID'
        ],
      });

      const data = await UserExpenseTransaction.findAll({
        raw: true,
        where: {
          authorizationStatus: 3,
          payment_Id: null,
        },
        attributes: ['userExpenseTransactionID', 'expenseHeadId'],
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
            where: condition,
          },
          {
            model: ExpenseHead,
            attributes: ['expenseHeadId'],
          },
        ],
      });

      const transactionMap = new Map();

      // Populate the map with data
      for (const item1 of data) {
        const key = `${item1['userExpense.userMasterID']}_${item1['userExpense.expense_date']}_${item1['expenseHead.expenseHeadId']}`; // Combine userMasterID and expense_date
        if (!transactionMap.has(key)) {
          transactionMap.set(key, []);
        }
        transactionMap.get(key).push(item1.userExpenseTransactionID);
      }

      // Iterate over rows and assign transaction IDs based on userMasterID and expense_date
      for (const item of rows) {
        const key = `${item.userMasterID}_${item.expense_date}_${item.expenseHeadId}`; // Combine keys for lookup
        item.userExpenseTransactionID = transactionMap.get(key) || [];
      }

      return res.status(200).json({
        status: 200,
        data: rows,
        totalcount: rows.length,
      });
    } else if (expensefilter == 3) {
      const order = [['userExpenseID', 'DESC']];

      const rows = await UserExpense.findAll({
        where: {
          userMasterID,
        },
        order,
        include: [
          {
            model: UserExpenseTransaction,
            as: 'ut',
            required: true,
            where: {
              payment_Id: null,
              status: 1,
            },
          },
          {
            model: UserMaster,
            attributes: ['displayName', 'userNumber'],
            include: [
              {
                model: erpAcountMasters,
                attributes: ['erpAcountID'],
              },
              {
                model: EmployeeDesignation,
                required: false,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                    { endDate: null },
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
                model: EmployeeDepartment,
                required: false,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                    { endDate: null },
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
                model: EmployeeBranch,
                required: false,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                    { endDate: null },
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
                model: EmployeeJoiningDetails,
                required: false,
                attributes: ['employeeCode'],
              },
            ],
          },
        ],
      });

      const finalRows = [];

      for (let expense of rows) {
        const expenseTransactions = expense.ut || [];
        if (expenseTransactions.length == 0) continue;

        const findPendingTrans = expenseTransactions.find(
          (e) => +e.authorizationStatus != 3
        );
        if (findPendingTrans) continue;
        const userExpenseTransactionIDs = expenseTransactions.reduce(
          (acc, expense) => {
            acc.push(expense.userExpenseTransactionID);
            return acc;
          },
          []
        );
        const obj = {
          authorizationStatus: '3',
          branchName:
            expense.userMaster?.employeeBranches?.[0]?.branchMaster
              ?.branchName || '',
          departmentName:
            expense.userMaster?.employeeDepartments?.[0]?.department
              ?.departmentName || '',
          designationName:
            expense.userMaster?.employeeDesignations?.[0]?.designation
              ?.designationName || '',
          employeeCode:
            expense.userMaster?.employeeJoiningDetails?.[0]?.employeeCode || '',
          erpAcountID:
            expense.userMaster?.erpAcountMasters?.[0]?.erpAcountID || '',
          erpJvid: null,
          expenseAmount: expenseTransactions.reduce(
            (sum, txn) => sum + Number(txn.expenseAmount || 0),
            0
          ),
          expenseHead: '',
          expense_date: expense.expense_date,
          'userMaster.displayName': expense.userMaster?.displayName,
          'userMaster.userNumber': expense.userMaster?.userNumber,
          userMasterID: expense.userMasterID,
          userExpenseTransactionID: userExpenseTransactionIDs,
          userExpenseID: expense.userExpenseID,
        };
        finalRows.push(obj);
      }

      const paginatedRows =
        limit && page
          ? finalRows.slice((page - 1) * limit, page * limit)
          : finalRows;
      return res.status(200).json({
        status: 200,
        data: paginatedRows,
        totalcount: finalRows.length,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.AddExpensePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      userMasterID,
      amount,
      paymentDate,
      paymentmode,
      referenceNO,
      referenceDate,
      createBy,
      userExpenseTransactionID,
      expensefilter,
    } = await req.body;

    const paymentData = {
      userMasterID,
      amount,
      paymentDate,
      paymentmode,
      createBy,
    };

    if (paymentmode !== 'Cash') {
      paymentData.referenceNO = referenceNO;
      paymentData.referenceDate = referenceDate;
    }

    const insert_db_status = await expensePayment.create(paymentData, {
      transaction,
    });

    const updateCondition =
      expensefilter == 0
        ? { userExpenseTransactionID: userExpenseTransactionID }
        : {
            userExpenseTransactionID: {
              [Sequelize.Op.in]: userExpenseTransactionID,
            },
          };

    await UserExpenseTransaction.update(
      {
        payment_Id: insert_db_status.ExpensePaymentID,
      },
      {
        where: updateCondition,
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Expense Payment added successfully',
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.expensePaymentDetailsByTranId = async (req, res, next) => {
  try {
    let payment_data;
    let expense_Tran_data;

    expense_Tran_data = await executeQuery(
      `select * from "public"."userExpenseTransactions" where "public"."userExpenseTransactions"."userExpenseTransactionID"=` +
        req.params.id +
        ``
    );

    if (expense_Tran_data.length > 0) {
      payment_data = await executeQuery(
        `select um."displayName",ep."paymentDate",ep."paymentmode",ep."referenceNO","referenceDate" from "public"."expensePayments" as ep inner join "public"."userMasters" as um on ep."createBy"=um."userMasterID" where ep."ExpensePaymentID"=` +
          expense_Tran_data[0].payment_Id +
          ``
      );
    }

    res.status(200).json({ status: 200, data: payment_data });
  } catch (err) {
    next(err);
  }
};

exports.listPaidExpense = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let totalcount;
    let payment_data;
    let payment_data_count;

    if (page == '' && limit == '') {
      payment_data = await executeQuery(
        `select um."displayName",um."userNumber",ep.* from "public"."expensePayments" as ep inner join "public"."userMasters" as um on ep."userMasterID"=um."userMasterID" where ep."userMasterID" in (` +
          userMasterID +
          `) and "paymentDate" between '` +
          startdate +
          `' and '` +
          enddate +
          `'`
      );
    } else {
      payment_data = await executeQuery(
        `select um."displayName",um."userNumber",ep.* from "public"."expensePayments" as ep inner join "public"."userMasters" as um on ep."userMasterID"=um."userMasterID" where ep."userMasterID" in (` +
          userMasterID +
          `) and "paymentDate" between '` +
          startdate +
          `' and '` +
          enddate +
          `' limit ` +
          limit +
          ` offset ` +
          offset +
          ``
      );

      payment_data_count = await executeQuery(
        `select um."displayName",um."userNumber",ep.* from "public"."expensePayments" as ep inner join "public"."userMasters" as um on ep."userMasterID"=um."userMasterID" where ep."userMasterID" in (` +
          userMasterID +
          `) and "paymentDate" between '` +
          startdate +
          `' and '` +
          enddate +
          `'`
      );

      totalcount = payment_data_count.length;
    }

    res
      .status(200)
      .json({ status: 200, data: payment_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.listPaidExpense_v2 = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, startdate, enddate } = req.body;

    const whereCondition = {
      userMasterID: userMasterID,
      paymentDate: {
        [Sequelize.Op.between]: [startdate, enddate],
      },
    };

    const includeUser = [
      {
        model: UserMaster,
        attributes: ['displayName', 'userNumber'],
      },
    ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const { rows, count } = await expensePayment.findAndCountAll({
      where: whereCondition,
      include: includeUser,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePaidExpesne = async (req, res, next) => {
  try {
    const { ExpensePaymentID } = await req.body;

    await sequelize.transaction(async (t) => {
      await expensePayment.destroy({
        where: { ExpensePaymentID: ExpensePaymentID },
        transaction: t,
      });

      await UserExpenseTransaction.update(
        {
          payment_Id: null,
        },
        {
          where: {
            payment_Id: ExpensePaymentID,
          },
          transaction: t,
        }
      );
    });

    return res
      .status(200)
      .json({ status: 200, message: 'Paid Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getByexpensePaymentId = async (req, res, next) => {
  try {
    let paidexpense_data = await expensePayment.findOne({
      where: {
        ExpensePaymentID: req.params.id,
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          attributes: [
            ['displayName', 'displayName'],
            ['userNumber', 'userNumber'],
          ],
        },
      ],
    });

    return res.status(200).json({ status: 200, data: paidexpense_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatePaidExpense = async (req, res, next) => {
  try {
    const {
      ExpensePaymentID,
      paymentDate,
      paymentmode,
      referenceNO,
      referenceDate,
      updateBy,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      await expensePayment.update(
        {
          paymentDate,
          paymentmode,
          referenceNO,
          referenceDate,
          updateBy,
        },
        {
          where: { ExpensePaymentID: ExpensePaymentID },
          transaction: t,
        }
      );

      return res
        .status(200)
        .json({ status: 200, message: 'Expense payment updated successfully' });
    });
  } catch (err) {
    next(err);
  }
};

exports.getadvanceexpense = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      userMasterID,
      startdate,
      enddate,
      searchQuery,
      exportData,
      companyMasterId,
    } = await req.body;

    if (!companyMasterId) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }
    const condition = { paymentType: 1 };

    if (userMasterID) condition.userMasterID = userMasterID;

    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.like]: `%${searchQuery}%`,
          },
        },
      ];

    if (startdate && enddate)
      condition.paymentDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const { rows, count } = await expensePayment.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          attributes: ['userNumber', 'displayName', 'companyMasterId'],
          where: {
            companyMasterId,
          },
          include: [
            {
              model: companyMaster,
              attributes: ['companyMasterID'],
              include: [
                { model: erpIntegration, attributes: ['advanceExpenceUrl'] },
              ],
            },
            { model: erpAcountMasters },
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
          ],
        },
      ],
    });
    if (exportData) {
      const finaldata = rows.map((e) => {
        return {
          'Employee Code ':
            e.userMaster.employeeJoiningDetails.length > 0
              ? e.userMaster.employeeJoiningDetails[0].employeeCode
              : '',
          'Erp Employee Code ':
            e.userMaster.erpAcountMasters.length > 0
              ? e.userMaster.erpAcountMasters[0].erpAcountID
              : '',
          'Employee Name': e.userMaster.displayName,
          Branch:
            e.userMaster.employeeBranches.length > 0
              ? e.userMaster.employeeBranches[0].branchMaster.branchName
              : '',
          Department:
            e.userMaster.employeeDepartments.length > 0
              ? e.userMaster.employeeDepartments[0].department.departmentName
              : '',
          Designation:
            e.userMaster.employeeDesignations.length > 0
              ? e.userMaster.employeeDesignations[0].designation.designationName
              : '',
          Amount: e.amount,
          PaymentDate: e.paymentDate
            ? moment(e.createdAt).format('DD-MM-YYYY')
            : 'dd-MM-yyyy',
          Sync: e.erpNo,
        };
      });

      await generateExcel(finaldata, 'Advance Expense Payment', 'xlsx', res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.addadvanceexpense = async (req, res, next) => {
  try {
    let {
      userMasterID,
      amount,
      paymentDate,
      paymentmode,
      referenceNO,
      referenceDate,
      expensefilter,
      paymentType,
      remarks,
      createBy,
    } = await req.body;

    if (expensefilter == 0) {
      if (paymentmode === 'Cash') {
        insert_db_status = await expensePayment.create({
          userMasterID,
          amount,
          paymentDate,
          paymentmode,
          paymentType,
          remarks,
          createBy,
        });
      } else {
        insert_db_status = await expensePayment.create({
          userMasterID,
          amount,
          paymentDate,
          paymentmode,
          paymentType,
          referenceNO,
          referenceDate,
          remarks,
          createBy,
        });
      }
    } else {
      if (paymentmode === 'Cash') {
        insert_db_status = await expensePayment.create({
          userMasterID,
          amount,
          paymentDate,
          paymentmode,
          paymentType,
          remarks,
          createBy,
        });
      } else {
        insert_db_status = await expensePayment.create({
          userMasterID,
          amount,
          paymentDate,
          paymentmode,
          paymentType,
          remarks,
          referenceNO,
          referenceDate,
          createBy,
        });
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Advance Expense Payment'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ExpensePaymentID = req.params.id;
    const data = await expensePayment.findOne({
      where: {
        ExpensePaymentID: ExpensePaymentID,
      },
      include: [
        {
          model: UserMaster,
          attributes: ['displayName'],
          include: [{ model: erpAcountMasters }],
        },
      ],
    });

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: 'Data not found',
      });
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.postUpdateadvanceexpense = async (req, res, next) => {
  try {
    const { id } = await req.params;

    const {
      paymentDate,
      amount,
      paymentmode,
      referenceNO,
      referenceDate,
      remarks,
      updateBy,
    } = await req.body;

    await expensePayment.update(
      {
        paymentDate,
        amount,
        paymentmode,
        referenceNO,
        referenceDate,
        remarks,
        updateBy,
      },
      {
        where: { ExpensePaymentID: id },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage(' Advance Expense Payment'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteip = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await expensePayment.findOne({
      where: {
        ExpensePaymentID: id,
      },
    });

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: 'Advance Expense Payment not found!',
      });
    }

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Advance Expense Payment'),
    });
  } catch (err) {
    next(err);
  }
};

exports.storeDocNo = async (req, res, next) => {
  try {
    const { ExpensePaymentID, erpNo } = await req.body;

    await expensePayment.update(
      {
        erpNo,
      },
      {
        where: { ExpensePaymentID: ExpensePaymentID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Erp No Added'),
    });
  } catch (err) {
    next(err);
  }
};

exports.synerpIntegration = async (req, res, next) => {
  try {
    const ExpensePaymentID = req.params.id;

    const datasync = await expensePayment.findOne({
      where: {
        ExpensePaymentID: ExpensePaymentID,
      },
      include: [
        {
          required: true,
          model: UserMaster,
          attributes: ['displayName', 'userMasterID'],
          include: [
            {
              required: false,
              model: erpAcountMasters,
            },
            {
              required: true,
              model: companyMaster,
              attributes: ['companyMasterID', 'companyName'],
              include: [
                {
                  required: true,
                  model: erpIntegration,
                  attributes: ['apiKey', 'apiSecret', 'advanceExpenceUrl'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!datasync) {
      return res.status(404).json({ message: 'Expense payment not found' });
    }

    const apiKey = `${datasync.userMaster.companyMaster.erpIntegrations[0].apiKey}`;
    const apiSecret = `${datasync.userMaster.companyMaster.erpIntegrations[0].apiSecret}`;

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const headers = {
      Authorization: `Basic ${auth}`,
    };

    if (!headers) {
      return res.status(200).json({
        status: 200,
        message: 'Permission Not Found',
      });
    }

    const postData = {
      employee: datasync.userMaster.erpAcountMasters[0].erpAcountID,
      posting_date: new Date(datasync.createdAt).toISOString().slice(0, 10),
      purpose: datasync.remarks,
      advance_amount: datasync.amount,
    };

    const apiUrl =
      datasync.userMaster.companyMaster.erpIntegrations[0].advanceExpenceUrl;

    const response = await axios.post(apiUrl, postData, { headers });

    if (
      !response.data.message ||
      !response.data.message ||
      !response.data.message.doc
    ) {
      return res
        .status(500)
        .json({ message: 'Invalid response from external API' });
    }

    datasync.erpNo = response.data.message.doc;

    datasync.save();

    return res.status(200).json({
      status: 200,
      // data:datasync,
      message: 'Sync Successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.syncerpExpensePayment = async (req, res, next) => {
  try {
    const { userExpenseTransactionID, userMasterID, expensefilter } =
      await req.body;

    const erpCode = await UserMaster.findOne({
      where: { userMasterID },
      attributes: ['userMasterID', 'companyMasterId'],
      include: [
        {
          required: false,
          model: erpAcountMasters,
          attributes: ['erpAcountID'],
        },
      ],
    });

    if (
      !erpCode ||
      !erpCode.erpAcountMasters ||
      erpCode.erpAcountMasters.length === 0
    ) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('Erp Employee Code'),
      });
    }

    const erpItegration = await erpIntegration.findOne({
      where: { companyMasterID: erpCode.companyMasterId },
      attributes: ['expenseUrl', 'apiSecret', 'apiKey'],
    });

    if (!erpItegration) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('ErpIntegration'),
      });
    } else if (
      erpItegration.expenseUrl === '' ||
      erpItegration.expenseUrl === null
    ) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('Erp Expense URL'),
      });
    }

    const ErpEmployeeCode = erpCode.erpAcountMasters[0].dataValues.erpAcountID;

    const apiKey = `${erpItegration.apiKey}`;
    const apiSecret = `${erpItegration.apiSecret}`;

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const headers = {
      Authorization: `Basic ${auth}`,
    };

    if (!headers) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage('Permission'),
      });
    }

    if (expensefilter == 0) {
      const SyncData = await UserExpenseTransaction.findOne({
        where: {
          userExpenseTransactionID,
        },
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
            attributes: ['expense_date'],
          },
          {
            model: ExpenseHead,
            attributes: ['accountHeadID'],
          },
        ],
        attributes: [
          'userExpenseTransactionID',
          'expenseAmount',
          'erpJvid',
          'description',
          'expenseHeadId',
          'userExpenseID',
        ],
      });

      const expenseType = SyncData.dataValues.expenseHead.accountHeadID;
      if (expenseType === null) {
        return res.status(200).json({
          status: 404,
          message: usermessage.notFoundMessage('Expense Type'),
        });
      }

      const postData = {
        employee: ErpEmployeeCode,
        expenses: [
          {
            expense_type: expenseType,
            description: SyncData.description,
            expenses_date:
              SyncData.dataValues.userExpense.dataValues.expense_date,
            amount: SyncData.expenseAmount,
          },
        ],
      };

      const apiUrl = erpItegration.expenseUrl;

      const response = await axios.post(apiUrl, postData, { headers });

      if (!response || response.data.message.status === false) {
        return res.status(200).json({
          status: 404,
          message: 'Error In Erp API',
        });
      }

      const expense_cliam = response.data.message.expense_claim;

      (SyncData.erpJvid = expense_cliam), await SyncData.save();

      return res.status(200).json({
        status: 200,
        message: 'Expense Sync SuccessFully',
      });
    } else if (expensefilter == 2) {
      const SyncData = await UserExpenseTransaction.findAndCountAll({
        raw: true,
        where: {
          userExpenseTransactionID,
        },
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
            attributes: ['expense_date'],
          },
          {
            model: ExpenseHead,
            attributes: ['accountHeadID', 'expenseHeadId'],
          },
        ],

        attributes: [
          [
            sequelize.fn('SUM', sequelize.col('expenseAmount')),
            'expenseAmount',
          ],
          'userExpense.expense_date',
          'expenseHead.expenseHeadId',

          [
            sequelize.fn('STRING_AGG', sequelize.col('description'), ', '), // Use STRING_AGG instead of GROUP_CONCAT
            'allDescriptions',
          ],
        ],

        group: [
          'userExpense.expense_date',
          'expenseHead.expenseHeadId',
          'userExpense.userExpenseID',
        ],
      });

      const expenseDate = SyncData.rows[0].expense_date;

      const expenseAmount = SyncData.rows[0].expenseAmount;

      const expenseType = SyncData.rows[0]['expenseHead.accountHeadID'];

      const concatenatedDescriptions = SyncData.rows[0].allDescriptions;

      if (expenseType === null) {
        return res.status(200).json({
          status: 404,
          message: usermessage.notFoundMessage('Expense Type'),
        });
      }

      const postData = {
        employee: ErpEmployeeCode,
        expenses: [
          {
            expense_date: expenseDate,
            expense_type: expenseType,
            description: concatenatedDescriptions,
            amount: expenseAmount,
          },
        ],
      };

      const apiUrl = erpItegration.expenseUrl;

      const response = await axios.post(apiUrl, postData, { headers });

      if (!response || response.data.message.status === false) {
        return res.status(200).json({
          status: 200,
          message: 'Error In Erp API',
        });
      }
      const expense_claim = response.data.message.expense_claim;
      await UserExpenseTransaction.update(
        {
          erpJvid: expense_claim,
        },
        { where: { userExpenseTransactionID: userExpenseTransactionID } }
      );

      return res.status(200).json({
        status: 200,
        message: 'Expense Sync SuccessFully',
      });
    }
  } catch (err) {
    next(err);
  }
};

// Export
exports.exportDemoImportGroupExpense = async (req, res, next) => {
  try {
    let { companyMasterID, userMasterID, fromDate, toDate } = await req.body;
    if (!companyMasterID || !fromDate || !toDate) {
      return res.status(200).json({
        status: 401,
        message: 'Please pass valid params!',
      });
    }
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Get User Data
    const userCondition = {
      companyMasterId: companyMasterID,
      status: 1,
    };

    const userExpenseCondition = {};
    if (userMasterID && userMasterID.length > 0) {
      userCondition.userMasterID = userMasterID;
      userExpenseCondition.userMasterID = userMasterID;
    }
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: message.usermessage.validDateRange() });
      }
      userExpenseCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }
    const order = [['userExpenseID', 'DESC']];

    const userExpenseData = await UserExpense.findAll({
      where: userExpenseCondition,
      order,
      include: [
        {
          model: UserExpenseTransaction,
          as: 'ut',
          required: true,
          where: {
            payment_Id: null,
            status: 1,
          },
        },
        {
          model: UserMaster,
          where: userCondition,
          attributes: ['displayName', 'userNumber'],
          include: [
            {
              model: EmployeeDesignation,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeDepartment,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeBranch,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeJoiningDetails,
              required: false,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
    });

    const finalRows = [];

    for (let expense of userExpenseData) {
      const expenseTransactions = expense.ut || [];
      if (expenseTransactions.length == 0) continue;

      const findPendingTrans = expenseTransactions.find(
        (e) => +e.authorizationStatus != 3
      );
      if (findPendingTrans) continue;
      const obj = {
        'Employee Code':
          expense.userMaster?.employeeJoiningDetails?.[0]?.employeeCode || '',
        'Employee Number': expense.userMaster?.userNumber,
        'Employee Name': expense.userMaster?.displayName,
        Branch:
          expense.userMaster?.employeeBranches?.[0]?.branchMaster?.branchName ||
          '',
        Department:
          expense.userMaster?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        Designation:
          expense.userMaster?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        'Expense Date': expense.expense_date,
        'Expense Voucher Number': expense.userExpenseID,
        'Total Amount': expenseTransactions.reduce(
          (sum, txn) => sum + Number(txn.expenseAmount || 0),
          0
        ),
        'Payment Mode': '',
        'Payment Date': '',
        'Payment Reference NO': '',
        'Payment Reference Date': '',
      };
      finalRows.push(obj);
    }

    return await generateDemoExcelForExpensePayment(
      finalRows,
      'Expense Payment',
      'xlsx',
      res
    );
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    let { companyMasterID, userMasterID, fromDate, toDate } = await req.body;
    if (!companyMasterID || !fromDate || !toDate) {
      return res.status(200).json({
        status: 401,
        message: 'Please pass valid params!',
      });
    }
    const excelRows = await readXlsxFile(filePath);
    deleteUploadedExcelFile(filePath);
    const headerRow = excelRows[0];
    const indexObj = {
      employeeCodeIndex: headerRow.indexOf('Employee Code'),
      employeeNumberIndex: headerRow.indexOf('Employee Number'),
      employeeNameIndex: headerRow.indexOf('Employee Name'),
      branchIndex: headerRow.indexOf('Branch'),
      departmentIndex: headerRow.indexOf('Department'),
      designationIndex: headerRow.indexOf('Designation'),
      expenseDateIndex: headerRow.indexOf('Expense Date'),
      expenseVoucherNumberIndex: headerRow.indexOf('Expense Voucher Number'),
      totalAmountIndex: headerRow.indexOf('Total Amount'),
      paymentModeIndex: headerRow.indexOf('Payment Mode'),
      paymentDateIndex: headerRow.indexOf('Payment Date'),
      paymentRefrenceNumberIndex: headerRow.indexOf('Payment Reference NO'),
      paymentRefrenceDateIndex: headerRow.indexOf('Payment Reference Date'),
    };
    const validExcel = validateExpensePaymentExcelIndex(indexObj);
    if (!validExcel.isValid) {
      return res.status(200).json({
        status: 401,
        message: `Column ${validExcel.missingFields.join(',')} is Missing`,
      });
    }
    excelRows.shift();
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Get User Data
    const userCondition = {
      companyMasterId: companyMasterID,
      status: 1,
    };

    const userExpenseCondition = {};
    if (userMasterID && userMasterID.length > 0) {
      userCondition.userMasterID = userMasterID;
      userExpenseCondition.userMasterID = userMasterID;
    }
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: message.usermessage.validDateRange() });
      }
      userExpenseCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }
    const order = [['userExpenseID', 'DESC']];

    const userExpenseData = await UserExpense.findAll({
      where: userExpenseCondition,
      order,
      include: [
        {
          model: UserExpenseTransaction,
          as: 'ut',
          required: true,
          where: {
            payment_Id: null,
            status: 1,
          },
        },
        {
          model: UserMaster,
          where: userCondition,
          attributes: ['displayName', 'userNumber'],
          include: [
            {
              model: EmployeeDesignation,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeDepartment,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeBranch,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeJoiningDetails,
              required: false,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
    });
    const validatedData = [];
    for (let data of excelRows) {
      const validatedObj = {
        userExpenseID: data[indexObj.expenseVoucherNumberIndex],
        amount: data[indexObj.totalAmountIndex],
        paymentDate: data[indexObj.paymentDateIndex],
        paymentmode: data[indexObj.paymentModeIndex],
        referenceNO: data[indexObj.paymentRefrenceNumberIndex],
        referenceDate: data[indexObj.paymentRefrenceDateIndex],
        userMasterID: null,
        userExpenseTransactionID: [],
        remarks: [],
        employeeCode: '',
        userNumber: '',
        displayName: '',
        branch: '',
        department: '',
        designation: '',
        expenseDate: '',
        isDeleted: false,
      };

      const { userExpenseID, amount, paymentDate, paymentmode, referenceDate } =
        validatedObj;

      if (!userExpenseID) {
        validatedObj.remarks.push('Please Enter Expense Voucher Number');
      }

      if (!amount) {
        validatedObj.remarks.push('Please Enter Expense amount');
      }

      if (!paymentDate) {
        validatedObj.remarks.push('Please Enter Payment Date');
      } else {
        if (!isValidDate(paymentDate)) {
          validatedObj.remarks.push('Please Enter Valid Payment Date Format');
        }
      }

      if (!paymentmode) {
        validatedObj.remarks.push('Please Enter Payment Mode');
      } else {
        if (!Object.values(paymentMode).includes(paymentmode)) {
          validatedObj.remarks.push('Please Enter Valid Payment Mode');
        }
      }

      if (referenceDate) {
        if (!isValidDate(referenceDate)) {
          validatedObj.remarks.push(
            'Please Enter Valid Payment Refrence Date Format'
          );
        }
      }

      const findExpense = userExpenseData.find(
        (e) => +e.userExpenseID === +userExpenseID
      );

      if (!findExpense) {
        validatedObj.remarks.push('Please Enter Valid Expense Voucher Number');
        validatedData.push(validatedObj);
        continue;
      }

      const userMaster = findExpense.userMaster || {};
      validatedObj.userMasterID = findExpense.userMasterID;
      validatedObj.employeeCode =
        userMaster.employeeJoiningDetails?.[0]?.employeeCode || '';
      validatedObj.userNumber = userMaster.userNumber || '';
      validatedObj.displayName = userMaster.displayName || '';
      validatedObj.branch =
        userMaster.employeeBranches?.[0]?.branchMaster?.branchName || '';
      validatedObj.department =
        userMaster.employeeDepartments?.[0]?.department?.departmentName || '';
      validatedObj.designation =
        userMaster.employeeDesignations?.[0]?.designation?.designationName ||
        '';
      validatedObj.expenseDate = findExpense.expense_date;

      const expenseTransactions = findExpense.ut || [];

      if (expenseTransactions.length === 0) {
        validatedObj.remarks.push('No Expense Transaction Found');
        validatedData.push(validatedObj);
        continue;
      }

      const pendingTxn = expenseTransactions.find(
        (e) => +e.authorizationStatus !== 3
      );
      if (pendingTxn) {
        validatedObj.remarks.push(
          'Some Of the Expense Transaction is Pending To Authorization'
        );
        validatedData.push(validatedObj);
        continue;
      }

      // No pending transactions — validate amount and extract transaction IDs
      const totalExpenseAmount = expenseTransactions.reduce((sum, txn) => {
        return sum + Number(txn.expenseAmount || 0);
      }, 0);

      validatedObj.userExpenseTransactionID = expenseTransactions.map((txn) => {
        return +txn.userExpenseTransactionID;
      });

      if (+totalExpenseAmount !== +amount) {
        validatedObj.remarks.push('Please Enter Valid Expense Amount');
      }

      validatedData.push(validatedObj);
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.validateMessage('Expense Payment'),
      data: validatedData,
    });
  } catch (error) {
    next(error);
  }
};
function deleteUploadedExcelFile(filePath) {
  fs.unlink(filePath, function (err) {
    if (err) console.log(err);
  });
}
function validateExpensePaymentExcelIndex(indexObj) {
  try {
    let isValid = true;
    const missingFields = [];

    for (const [key, value] of Object.entries(indexObj)) {
      if (value === -1) {
        isValid = false;
        missingFields.push(key);
      }
    }

    return { isValid, missingFields };
  } catch (error) {
    throw new Error('Error in Get Excel Validity: ' + error.message);
  }
}

exports.reValidateUploadExcel = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      userMasterID,
      fromDate,
      toDate,
      expensePaymentData,
    } = await req.body;
    if (
      !companyMasterID ||
      !fromDate ||
      !toDate ||
      expensePaymentData.length == 0
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please pass valid params!',
      });
    }

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Get User Data
    const userCondition = {
      companyMasterId: companyMasterID,
      status: 1,
    };

    const userExpenseCondition = {};
    if (userMasterID && userMasterID.length > 0) {
      userCondition.userMasterID = userMasterID;
      userExpenseCondition.userMasterID = userMasterID;
    }
    if (fromDate && toDate) {
      if (fromDate > toDate) {
        return res
          .status(statusCodes.BAD_REQUEST)
          .json({ message: message.usermessage.validDateRange() });
      }
      userExpenseCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };
    }
    const order = [['userExpenseID', 'DESC']];

    const userExpenseData = await UserExpense.findAll({
      where: userExpenseCondition,
      order,
      include: [
        {
          model: UserExpenseTransaction,
          as: 'ut',
          required: true,
          where: {
            payment_Id: null,
            status: 1,
          },
        },
        {
          model: UserMaster,
          where: userCondition,
          attributes: ['displayName', 'userNumber'],
          include: [
            {
              model: EmployeeDesignation,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeDepartment,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeBranch,
              required: false,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: null },
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
              model: EmployeeJoiningDetails,
              required: false,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
    });
    const validatedData = [];
    for (let validatedObj of expensePaymentData) {
      validatedObj.remarks = [];
      validatedObj.isDeleted = false;

      const { userExpenseID, amount, paymentDate, paymentmode, referenceDate } =
        validatedObj;

      if (!userExpenseID) {
        validatedObj.remarks.push('Please Enter Expense Voucher Number');
      }

      if (!amount) {
        validatedObj.remarks.push('Please Enter Expense amount');
      }

      if (!paymentDate) {
        validatedObj.remarks.push('Please Enter Payment Date');
      } else {
        if (!isValidDate(paymentDate)) {
          validatedObj.remarks.push('Please Enter Valid Payment Date Format');
        }
      }

      if (!paymentmode) {
        validatedObj.remarks.push('Please Enter Payment Mode');
      } else {
        if (!Object.values(paymentMode).includes(paymentmode)) {
          validatedObj.remarks.push('Please Enter Valid Payment Mode');
        }
      }

      if (referenceDate) {
        if (!isValidDate(referenceDate)) {
          validatedObj.remarks.push(
            'Please Enter Valid Payment Refrence Date Format'
          );
        }
      }

      const findExpense = userExpenseData.find(
        (e) => +e.userExpenseID === +userExpenseID
      );

      if (!findExpense) {
        validatedObj.remarks.push('Please Enter Valid Expense Voucher Number');
        validatedData.push(validatedObj);
        continue;
      }

      const userMaster = findExpense.userMaster || {};
      validatedObj.userMasterID = findExpense.userMasterID;
      validatedObj.employeeCode =
        userMaster.employeeJoiningDetails?.[0]?.employeeCode || '';
      validatedObj.userNumber = userMaster.userNumber || '';
      validatedObj.displayName = userMaster.displayName || '';
      validatedObj.branch =
        userMaster.employeeBranches?.[0]?.branchMaster?.branchName || '';
      validatedObj.department =
        userMaster.employeeDepartments?.[0]?.department?.departmentName || '';
      validatedObj.designation =
        userMaster.employeeDesignations?.[0]?.designation?.designationName ||
        '';
      validatedObj.expenseDate = findExpense.expense_date;

      const expenseTransactions = findExpense.ut || [];

      if (expenseTransactions.length === 0) {
        validatedObj.remarks.push('No Expense Transaction Found');
        validatedData.push(validatedObj);
        continue;
      }

      const pendingTxn = expenseTransactions.find(
        (e) => +e.authorizationStatus !== 3
      );
      if (pendingTxn) {
        validatedObj.remarks.push(
          'Some Of the Expense Transaction is Pending To Authorization'
        );
        validatedData.push(validatedObj);
        continue;
      }

      // No pending transactions — validate amount and extract transaction IDs
      const totalExpenseAmount = expenseTransactions.reduce((sum, txn) => {
        return sum + Number(txn.expenseAmount || 0);
      }, 0);

      validatedObj.userExpenseTransactionID = expenseTransactions.map((txn) => {
        return +txn.userExpenseTransactionID;
      });

      if (+totalExpenseAmount !== +amount) {
        validatedObj.remarks.push('Please Enter Valid Expense Amount');
      }

      validatedData.push(validatedObj);
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.reValidateMessage('Expense Payment'),
      data: validatedData,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateExpensePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    let { expensePaymentData } = await req.body;
    if (expensePaymentData.length == 0) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Please pass valid params!',
      });
    }
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    const updateExpenseTransArray = [];
    for (let expense of expensePaymentData) {
      const paymentData = {
        userMasterID: expense.userMasterID,
        amount: expense.amount,
        paymentDate: expense.paymentDate,
        paymentmode: expense.paymentmode,
        referenceNO: expense.referenceNO,
        referenceDate: expense.referenceDate,
        createBy,
        createByIp,
      };
      const insert_db_status = await expensePayment.create(paymentData, {
        transaction,
      });

      updateExpenseTransArray.push(
        UserExpenseTransaction.update(
          {
            payment_Id: insert_db_status.ExpensePaymentID,
          },
          {
            where: {
              userExpenseTransactionID: {
                [Sequelize.Op.in]: expense.userExpenseTransactionID,
              },
            },
            transaction,
          }
        )
      );
    }

    await Promise.all(updateExpenseTransArray);
    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Expense Payment'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
