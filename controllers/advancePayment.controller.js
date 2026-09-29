const Sequelize = require('sequelize');
const advancePayment = require('../models/advancePayment');
const logger = require('../config/logger');
const UserMaster = require('../models/userMaster');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const UserInbox = require('../models/UserInbox');

const fs = require('fs');
const readXlsxFile = require('read-excel-file/node');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const path = require('path');

const { userAttributes, companyAttributes } = require('../utils/commonVars');
const {
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
  getAllUserByCompanyDateWise,
  getAllUserByBranchDateWise,
  accessibleUsers,
  isValidDate,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');

const {
  generateExcel,
  generateDemoExcelForAdvance,
} = require('../utils/exportData');
const { getAllUsers } = require('./companyContact.controller');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const moment = require('moment');
const { FileUploadType } = require('../utils/dbUtils');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
exports.postAddAdvancePaymentdata = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      description,
      amount,
      advanceDate,
      paymentYearMonth,
      paymentmode,
      referenceNO,
      referenceDate,
      AdvanceStatus,
    } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    if (AdvanceStatus != 0) {
      AdvanceStatus = 1;
    }
    const userData = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
      },
    });
    const createdAdvance = await advancePayment.create(
      {
        userMasterID,
        companyMasterID: userData.companyMasterId,
        description,
        amount,
        advanceDate,
        paymentYearMonth,
        paymentmode,
        referenceNO,
        referenceDate,
        createBy,
        createByIp,
        AdvanceStatus,
      },
      { transaction }
    );
    if (AdvanceStatus == 0) {
      await UserInbox.create(
        {
          activityTable: advancePayment.getTableName(),
          activityTablePK: createdAdvance.toJSON().advancePaymentID,
          message: `${userData.displayName} has appiled for Advance of ${amount}`,
          assignedBy: userMasterID,
        },
        {
          transaction,
        }
      );
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Advance Payment'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

//**
// Get Advance By CompanyID
// */

exports.getadvanceByCompanyid = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      companyMasterID,
      branchMasterID,
      userMasterID,
      exportData,
      AdvanceStatus,
    } = await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];
    condition.companyMasterID = companyMasterID;
    req.userDetails.accessibleCompanies = companyMasterID;

    condition.status = [0, 1];

    if (userMasterID && userMasterID.length > 0)
      condition.userMasterID = userMasterID;

    if (startdate && enddate)
      condition.advanceDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (AdvanceStatus) {
      condition.AdvanceStatus = AdvanceStatus;
    }

    const { rows: allAdvanceData, count } =
      await advancePayment.findAndCountAll({
        distinct: true,
        raw: true,
        where: condition,
        ...paginationQuery,
        order,
        required: true,

        include: [
          {
            required: true,
            model: UserMaster,
            attributes: [
              'userMasterID',
              'companyMasterId',
              'firstName',
              'middleName',
              'lastName',
              'displayName',
              'userNumber',
              'photo',
            ],
            include: [
              {
                required: branchMasterID ? true : false,
                model: EmployeeBranch,
                where: {
                  ...(branchMasterID && { branchID: branchMasterID }),
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
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
              {
                model: companyMaster,
                attributes: ['companyName'],
              },
              {
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
            ],
          },
          {
            required: false,
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
      });

    if (exportData) {
      const finaldata = allAdvanceData.map((e) => {
        return {
          'Employee Code':
            e['userMaster.employeeJoiningDetails.employeeCode'] || '',
          'Employee Name': e['userMaster.displayName'],
          'Empoyee Number': e['userMaster.userNumber'],
          Company: e['userMaster.companyMaster.companyName'] || '',
          Branch:
            e['userMaster.employeeBranches.branchMaster.branchName'] || '',
          Department:
            e['userMaster.employeeDepartments.department.departmentName'] || '',
          Designation:
            e['userMaster.employeeDesignations.designation.designationName'] ||
            '',
          Division:
            e['userMaster.employeeDivisions.division.divisionName'] || '',
          'Working Area':
            e['userMaster.employeeWorkingAreas.workingArea.workingAreaName'] ||
            '',

          Amount: e.amount,
          'Advance Given Date': e.advanceDate
            ? moment(e.advanceDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
            : '',
          'Deduction YearMonth': e.paymentYearMonth,
          'Advance Mode': e.paymentmode,
          Description: e.description,
          RejectionRemark: e.RejectionRemark,
          Status: e.status == 0 ? 'Deactive' : 'Active',
          AdvanceStatus:
            e.AdvanceStatus === 1
              ? 'Approved'
              : e.AdvanceStatus === 2
                ? 'Rejected'
                : 'Pending',
        };
      });

      return await generateExcel(finaldata, 'AdvancePayment', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: allAdvanceData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with AttendanceTransID
 *
 */
exports.getAdvancePaymentById = async (req, res, next) => {
  try {
    const getAdvancePaymentByID = await advancePayment.findOne({
      where: {
        advancePaymentID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!getAdvancePaymentByID) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage('Advance Payment'),
      });
    }

    return res.status(200).json({ status: 200, data: getAdvancePaymentByID });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Data
 */
exports.postUpdateAdvancepayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      advancePaymentID,
      userMasterID,
      description,
      amount,
      advanceDate,
      paymentYearMonth,
      paymentmode,
      referenceNO,
      referenceDate,
      AdvanceStatus,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    AdvanceStatus = 1;

    await advancePayment.update(
      {
        userMasterID,
        description,
        amount,
        advanceDate,
        paymentYearMonth,
        paymentmode,
        referenceNO,
        referenceDate,
        updateBy,
        updateByIp,
        AdvanceStatus,
      },
      {
        where: { advancePaymentID: advancePaymentID },
      },
      {
        transaction,
      }
    );

    await UserInbox.destroy(
      {
        where: {
          activityTable: advancePayment.getTableName(),
          activityTablePK: advancePaymentID,
        },
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Advance Payment'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * delete by advancePaymentID
 */
exports.postDeleteAdavancePaymentById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let advancePaymentID = req.params.id;
    const totalAdvance = await advancePayment.findOne({
      where: {
        advancePaymentID: advancePaymentID,
        status: ['0', '1'],
      },
      transaction,
    });
    if (totalAdvance.tablereferenceID != null) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message:
          "You can't delete this AdvancePayment because it's Payment are paid !!",
      });
    }

    await advancePayment.update(
      {
        status: 2,
      },
      {
        where: { advancePaymentID: advancePaymentID },
      },
      {
        transaction,
      }
    );

    await UserInbox.destroy(
      {
        where: {
          activityTable: advancePayment.getTableName(),
          activityTablePK: totalAdvance.toJSON().advancePaymentID,
        },
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Advance Payment'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * Update Status
 **/

exports.poststatuschange = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { advancePaymentID, status } = await req.body;
    await advancePayment.update(
      {
        status: status,
      },
      {
        where: { advancePaymentID: advancePaymentID, status: ['1', '0'] },
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Advance Payment')
          : message.usermessage.deactiveMessage('Advance Payment'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getadvanceByUserid = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      AdvanceStatus,
    } = await req.body;

    const paginationQuery = {};
    const condition = {};

    condition.status = [0, 1];

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    if (userMasterID && Array.isArray(userMasterID) && userMasterID.length) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    } else if (userMasterID) {
      const userid = [];
      userid.push(parseInt(userMasterID));
      condition.userMasterID = {
        [Sequelize.Op.in]: userid,
      };
    }

    if (startdate && enddate) {
      condition.advanceDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          description: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          amount: {
            [Sequelize.Op.eq]: searchQuery,
          },
        },
      ];
    if (AdvanceStatus) {
      condition.AdvanceStatus = AdvanceStatus;
    }
    const { rows: advancepayment, count } =
      await advancePayment.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'userMaster',
            ...accessibleUsers(req.userDetails),
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
          {
            required: false,
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
      });

    return res
      .status(200)
      .json({ status: 200, data: advancepayment, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postStatusrequest = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { advancePaymentID, AdvanceStatus, RejectionRemark } = await req.body;

    await advancePayment.update(
      {
        AdvanceStatus: AdvanceStatus,
        RejectionRemark: RejectionRemark,
      },
      {
        where: {
          advancePaymentID: advancePaymentID,
        },
      },
      {
        transaction,
      }
    );

    await UserInbox.destroy(
      {
        where: {
          activityTable: advancePayment.getTableName(),
          activityTablePK: advancePaymentID,
        },
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        AdvanceStatus == '1'
          ? message.usermessage.acceptMesaage('Advance Payment')
          : message.usermessage.rejectMessage('Advance Payment'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.postAddRequestAdvancePaymentdata = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { userMasterID, description, amount } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const userData = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
      },
    });
    const addAdvancePayment = await advancePayment.create(
      {
        userMasterID,
        companyMasterID: userData.companyMasterId,
        description,
        amount,
        createBy,
        createByIp,
      },
      { transaction }
    );

    await UserInbox.create(
      {
        activityTable: advancePayment.getTableName(),
        activityTablePK: addAdvancePayment.toJSON().advancePaymentID,
        message: `${userData.displayName} has appiled for Advance of ${amount}`,
        assignedBy: userMasterID,
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Advance Request'),
      data: addAdvancePayment,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.advancedatashow = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterID,
      advancestatus,
      exportData,
      exportFileType,
      startdate,
      searchQuery,
      enddate,
    } = await req.body;

    const condition = {};

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterID = companyMasterID;
    }

    if (advancestatus) condition.AdvanceStatus = advancestatus;

    condition.status = 1;

    if (startdate && enddate) {
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    const userSearchCondition = {};
    if (searchQuery)
      userSearchCondition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginationQuery = {};

    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const advancedata = await advancePayment.findAndCountAll({
      order: [['createdAt', 'DESC']],
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false),
      include: [
        {
          model: UserMaster,
          attributes: userAttributes,
          where: userSearchCondition,
          required: true,
          include: [
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
        { model: companyMaster, attributes: companyAttributes },
        {
          required: false,
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    async function processRow(row) {
      return {
        UserName: row.userMaster.displayName || '',
        UserNumber: row.userMaster.userNumber || '',
        CompanyName: row.companyMaster.companyName || '',
        BranchName:
          row.userMaster.employeeDesignations.length > 0
            ? row.userMaster.employeeDesignations[0].designation.designationName
            : '',
        Designation:
          row.userMaster.employeeBranches.length > 0
            ? row.userMaster.employeeBranches[0].branchMaster.branchName
            : '',
        Department:
          row.userMaster.employeeDepartments.length > 0
            ? row.userMaster.employeeDepartments[0].department.departmentName
            : '',
        Status: checkStatus(row.AdvanceStatus),
        AdvanceAmount: row.amount || '',
        Description: row.description || '',
        PaymentYearMonth: row.paymentYearMonth || '',
        AdvanceDate: row.advanceDate
          ? moment(row.advanceDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
          : '',
        Paymentmode: row.paymentmode || '',
      };
    }

    function checkStatus(AdvanceStatus) {
      if (AdvanceStatus == 1) {
        return 'Approved';
      } else if (AdvanceStatus == 2) {
        return 'Rejected';
      } else if (AdvanceStatus == 0) {
        return 'Pending';
      } else {
        return '';
      }
    }

    if (exportData) {
      const updatedDownloadRows = await Promise.all(
        advancedata.rows.map(processRow)
      );

      await generateExcel(
        updatedDownloadRows,
        'Company-Advance-Report',
        exportFileType,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Loan'),
      data: advancedata,
    });
  } catch (err) {
    next(err);
  }
};

exports.exportDemoexcel = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID } = req.query;
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const allUser = await EmployeeJoiningDetails.findAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: date,
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: date },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: date },
              },
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
              },
            ],
          },
        ],
        '$userMaster.companyMasterId$': companyMasterID,
        '$userMaster.status$': [0, 1],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          ...accessibleUsers(req.userDetails),
          include: [
            {
              required: branchMasterID ? true : false,
              model: EmployeeBranch,
              where: {
                status: 1,
                ...(branchMasterID && { branchID: branchMasterID }),
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
              required: true,
              model: companyMaster,
              attributes: companyAttributes,
            },
          ],
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    if (
      allUser.length &&
      allUser[0]['userMaster.companyMaster.fileUploadType'] ==
        FileUploadType.EMPLOYEE_CODE
    )
      fileUploadType = FileUploadType.EMPLOYEE_CODE;

    const finalData = [];
    for (let user of allUser) {
      if (
        fileUploadType === FileUploadType.EMPLOYEE_CODE &&
        user.employeeCode != '' &&
        user.employeeCode != null
      ) {
        const data = {
          'Employee Name': user['userMaster.displayName'],
          Branch: user['userMaster.employeeBranches.branchMaster.branchName'],
          Department:
            user['userMaster.employeeDepartments.department.departmentName'],
          Designation:
            user['userMaster.employeeDesignations.designation.designationName'],
          'Employee Code': user.employeeCode,
          'Advance Amount': '',
          'Advance Date (YYYY-MM-DD)': '',
          'Payment Mode': '',
          'Reference No.': '',
          'Reference Date': '',
          Description: '',
        };
        finalData.push(data);
      }

      if (fileUploadType === FileUploadType.MOBILE_NUMBER) {
        const data = {
          'Employee Name': user['userMaster.displayName'],
          Branch: user['userMaster.employeeBranches.branchMaster.branchName'],
          Department:
            user['userMaster.employeeDepartments.department.departmentName'],
          Designation:
            user['userMaster.employeeDesignations.designation.designationName'],
          'Employee Number': user['userMaster.userNumber'],
          'Advance Amount': '',
          'Advance Date (YYYY-MM-DD) ': '',
          'Payment Mode': '',
          'Reference No.': '',
          'Reference Date': '',
          Description: '',
        };
        finalData.push(data);
      }
    }

    return await generateDemoExcelForAdvance(
      finalData,
      'Advance Payment',
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

exports.uploadExcel = async (req, res, next) => {
  const filepath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, month, createBy, createByIP } = await req.body;

    const [findAllUsersData, findAllSalaryData] = await Promise.all([
      // findAllUsersData
      UserMaster.findAll({
        raw: true,
        where: {
          companyMasterId: companyMasterID,
          status: 1,
        },
      }),
      HRSalaryTrasaction.findAll({
        where: {
          // userMasterID: userMasterID,
          salaryYYYYMM: month,
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
            },
          },
        ],
      }),
    ]);

    readXlsxFile(filepath).then(async (rows) => {
      rows.shift();
      await sequelize
        .transaction(async (t) => {
          const finalData = [];
          for (const row of rows) {
            const number =
              typeof row[1] === 'number' ? row[1].toString() : row[1];

            if (!number)
              return res.status(200).send({
                status: 402,
                message: 'Mobile No. is require for' + ': ' + row[0],
              });

            const userData = findAllUsersData
              ? findAllUsersData.find((e) => e.userNumber == number.trim())
              : null;

            if (userData) {
              const userMasterID = userData.userMasterID;
              if (row[2] != null && row[2] > 0 && typeof row[2] === 'number') {
                let advanceDate = null;

                // check Advance Date

                if (!row[3])
                  return res.status(200).send({
                    status: 402,
                    message: 'Advance Date is require for' + ': ' + row[1],
                  });

                if (typeof row[3] == 'number') {
                  advanceDate = new Date(
                    Math.round(row[3] - 25569) * 86400 * 1000
                  )
                    .toISOString()
                    .slice(0, 10);
                } else {
                  if (isValidDate(row[3]) === true) {
                    advanceDate = new Date(`${row[3]}`)
                      .toISOString()
                      .slice(0, 10);
                  } else {
                    return res.status(200).send({
                      status: 402,
                      message:
                        "Advance date Should be in 'yyyy-mm-dd' Format" +
                        ': ' +
                        row[1],
                    });
                  }
                }

                // check payment Mode

                let paymentMode = '';

                if (!row[4])
                  return res.status(200).send({
                    status: 402,
                    message: 'Payment Mode is require for' + ': ' + row[1],
                  });

                const paymentModes = ['Cash', 'Cheque', 'UPI', 'NetBanking'];
                if (!paymentModes.includes(row[4]))
                  return res.status(200).send({
                    status: 402,
                    message:
                      'Select Payment Mode from Dropdown of' + ': ' + row[1],
                  });

                paymentMode = row[4];

                //check Reference Date

                let referenceDate = null;

                if (paymentMode != 'Cash') {
                  if (!row[6])
                    return res.status(200).send({
                      status: 402,
                      message: 'Reference Date is require for' + ': ' + row[1],
                    });

                  if (typeof row[6] == 'number') {
                    referenceDate = new Date(
                      Math.round(row[6] - 25569) * 86400 * 1000
                    )
                      .toISOString()
                      .slice(0, 10);
                  } else {
                    if (isValidDate(row[6]) === true) {
                      referenceDate = new Date(`${row[6]}`)
                        .toISOString()
                        .slice(0, 10);
                    } else {
                      return res.status(200).send({
                        status: 402,
                        message:
                          "Reference Date Should be in 'yyyy-mm-dd' Format" +
                          ': ' +
                          row[6],
                      });
                    }
                  }
                }

                if (!row[7])
                  return res.status(200).send({
                    status: 402,
                    message: 'description is require for' + ': ' + row[1],
                  });

                const salary = findAllSalaryData
                  ? findAllSalaryData.find(
                      (e) => e.userMasterID == userMasterID
                    )
                  : null;

                if (salary)
                  return res.status(200).send({
                    status: 402,
                    message:
                      'salary is calculated for' +
                      ': ' +
                      row[1] +
                      ' So, you can not add advance. ',
                  });

                finalData.push({
                  userMasterID: userMasterID,
                  companyMasterID: companyMasterID,
                  description: row[7],
                  amount: row[2],
                  advanceDate: advanceDate,
                  paymentYearMonth: month,
                  paymentmode: paymentMode,
                  referenceNO: row[5],
                  referenceDate: referenceDate,
                  createBy: createBy,
                  createByIp: createByIP,
                  AdvanceStatus: 1, // approved
                });
              }
            }
          }

          await advancePayment.bulkCreate(finalData, { transaction: t });
          fs.unlink(filepath, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('delete');
            }
          });

          return res.status(200).send({
            status: 200,
            message: ' The File Upload Successfully: ' + req.file.originalname,
          });
        })
        .catch((err) => {
          res.status(200).send({
            status: 401,
            message: 'Fail to import data into database!' + err.message,
            error: err.message,
          });
        });
    });
  } catch (error) {
    fs.unlink(filepath, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('delete');
      }
    });
    next(error);
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
    const { companyMasterID, branchMasterID, month, createBy, createByIP } =
      await req.body;
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const [findAllUsersData, findAllSalaryData] = await Promise.all([
      // findAllUsersData
      UserMaster.findAll({
        // raw: true,
        where: {
          companyMasterId: companyMasterID,
          status: 1,
        },
        include: [
          {
            required: branchMasterID ? true : false,
            model: EmployeeBranch,
            where: {
              status: 1,
              ...(branchMasterID && { branchID: branchMasterID }),
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
            required: true,
            model: companyMaster,
            attributes: companyAttributes,
          },
          {
            required: true,
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
        ],
      }),
      HRSalaryTrasaction.findAll({
        where: {
          // userMasterID: userMasterID,
          salaryYYYYMM: month,
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
            },
          },
        ],
      }),
    ]);
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    if (
      findAllUsersData.length &&
      findAllUsersData[0].companyMaster.fileUploadType ==
        FileUploadType.EMPLOYEE_CODE
    )
      fileUploadType = FileUploadType.EMPLOYEE_CODE;

    const rows = await readXlsxFile(filePath);
    // Skip header
    rows.shift();

    const finalData = [];
    for (const row of rows) {
      const advancedata = {
        userMasterID: null,
        companyMasterID: null,
        branchMasterID: null,
        departmentId: null,
        designationId: null,
        displayName: row[0],
        company: '',
        branch: '',
        department: '',
        designation: '',
        userNumber: '',
        employeeCode: '',
        amount: row[5],
        advanceDate: row[6],
        paymentmode: row[7],
        referenceNO: row[8],
        referenceDate: row[9],
        description: row[10],
        paymentYearMonth: month,
        createBy: createBy,
        createByIp: createByIP,
        AdvanceStatus: 1, // approved
        remarks: '',
      };
      const number = typeof row[4] === 'number' ? row[4].toString() : row[4];

      if (!number) {
        advancedata.remarks =
          fileUploadType == FileUploadType.MOBILE_NUMBER
            ? `Mobile No. is require for : ${advancedata.displayName}`
            : `Employee Code is require for : ${advancedata.displayName}`;
        continue;
      }

      let userData = null;

      if (fileUploadType == FileUploadType.MOBILE_NUMBER) {
        userData = findAllUsersData.find((e) => e.userNumber === row[4]);
      } else {
        userData = findAllUsersData.find(
          (e) => e.employeeJoiningDetails[0].employeeCode === row[4]
        );
      }

      if (userData) {
        advancedata.userMasterID = userData.userMasterID;
        advancedata.userNumber = userData.userNumber;
        advancedata.employeeCode =
          userData.employeeJoiningDetails &&
          userData.employeeJoiningDetails.length > 0
            ? userData.employeeJoiningDetails[0].employeeCode
            : '';
        advancedata.companyMasterID = userData.companyMasterId;
        advancedata.branchMasterID =
          userData.employeeBranches && userData.employeeBranches.length > 0
            ? userData.employeeBranches[0].branchID
            : null;
        advancedata.departmentId =
          userData.employeeDepartments &&
          userData.employeeDepartments.length > 0
            ? userData.employeeDepartments[0].departmentID
            : null;
        advancedata.designationId =
          userData.employeeDesignations &&
          userData.employeeDesignations.length > 0
            ? userData.employeeDesignations[0].designationID
            : null;
        advancedata.displayName = userData.displayName;
        advancedata.company = userData.companyMaster.companyName;
        advancedata.branch =
          userData.employeeBranches && userData.employeeBranches.length > 0
            ? userData.employeeBranches[0].branchMaster
              ? userData.employeeBranches[0].branchMaster.branchName
              : ''
            : '';
        advancedata.department =
          userData.employeeDepartments &&
          userData.employeeDepartments.length > 0
            ? userData.employeeDepartments[0].department
              ? userData.employeeDepartments[0].department.departmentName
              : ''
            : '';
        advancedata.designation =
          userData.employeeDesignations &&
          userData.employeeDesignations.length > 0
            ? userData.employeeDesignations[0].designation
              ? userData.employeeDesignations[0].designation.designationName
              : ''
            : '';
        if (
          advancedata.amount != null &&
          advancedata.amount > 0 &&
          typeof advancedata.amount === 'number'
        ) {
          // check Advance Date

          if (!advancedata.advanceDate) {
            advancedata.remarks = 'Advance Date is required';
          }

          if (
            advancedata.advanceDate &&
            typeof advancedata.advanceDate == 'number'
          ) {
            advancedata.advanceDate = new Date(
              Math.round(advancedata.advanceDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else if (advancedata.advanceDate) {
            if (isValidDate(advancedata.advanceDate) === true) {
              advancedata.advanceDate = new Date(`${advancedata.advanceDate}`)
                .toISOString()
                .slice(0, 10);
            } else {
              advancedata.advanceDate = '';
              advancedata.remarks =
                "Advance date Should be in 'yyyy-mm-dd' Format";
            }
          }

          // check payment Mode

          let paymentMode = '';

          if (!advancedata.paymentmode) {
            advancedata.remarks = `Payment Mode is required`;
          }
          const paymentModes = ['Cash', 'Cheque', 'UPI', 'NetBanking'];
          if (
            advancedata.paymentmode &&
            !paymentModes.includes(advancedata.paymentmode)
          ) {
            advancedata.remarks = `Select Payment Mode from Dropdown`;
          }
          // paymentMode = row[4];

          //check Reference Date

          let referenceDate = null;
          if (advancedata.paymentmode) {
            if (advancedata.paymentmode != 'Cash') {
              if (!advancedata.referenceDate) {
                advancedata.remarks = 'Reference Date is required';
              }

              if (
                advancedata.referenceDate &&
                typeof advancedata.referenceDate == 'number'
              ) {
                advancedata.referenceDate = new Date(
                  Math.round(advancedata.referenceDate - 25569) * 86400 * 1000
                )
                  .toISOString()
                  .slice(0, 10);
              } else {
                if (
                  advancedata.referenceDate &&
                  isValidDate(advancedata.referenceDate) === true
                ) {
                  advancedata.referenceDate = new Date(
                    `${advancedata.referenceDate}`
                  )
                    .toISOString()
                    .slice(0, 10);
                } else {
                  advancedata.referenceDate = '';
                  advancedata.remarks ==
                    "Reference Date Should be in 'yyyy-mm-dd' Format";
                }
              }
            }
          }
          if (!advancedata.description) {
            advancedata.remarks = 'Description is required';
          }

          const salary = findAllSalaryData
            ? findAllSalaryData.find(
                (e) => e.userMasterID == advancedata.userMasterID
              )
            : null;

          if (salary) {
            advancedata.remarks =
              'salary is calculated, So, you can not add advance.';
          }
        }
      } else {
        advancedata.remarks =
          'User Not Found ' + ': ' + advancedata.displayName;
        continue;
      }

      finalData.push(advancedata);
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.validateMessage('Advance Payment'),
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateAdvancePayment = async (req, res, next) => {
  try {
    const { advancepaymentData, companyMasterID, branchMasterID, month } =
      req.body;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const [findAllSalaryData] = await Promise.all([
      HRSalaryTrasaction.findAll({
        where: {
          salaryYYYYMM: month,
        },
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
            },
          },
        ],
      }),
    ]);
    const advanceData = [];

    for (const row of advancepaymentData) {
      if (!row.userMasterID) {
        advanceData.push(row);
        continue;
      }
      row.remarks = '';
      if (
        row.amount != null &&
        row.amount > 0 &&
        typeof row.amount === 'number'
      ) {
        if (!row.advanceDate) {
          row.remarks = 'Advance Date is required';
        }

        if (!row.paymentmode) {
          row.remarks = `Payment Mode is required`;
        }
        if (row.paymentmode != 'Cash') {
          if (!row.referenceDate) {
            row.remarks = 'Reference Date is required';
          }

          if (row.referenceDate && typeof row.referenceDate == 'number') {
            row.referenceDate = new Date(
              Math.round(row.referenceDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (row.referenceDate && isValidDate(row.referenceDate) === true) {
              row.referenceDate = new Date(`${row.referenceDate}`)
                .toISOString()
                .slice(0, 10);
            } else {
              row.referenceDate = '';
              row.remarks == "Reference Date Should be in 'yyyy-mm-dd' Format";
            }
          }
        }
        const salary = findAllSalaryData
          ? findAllSalaryData.find((e) => e.userMasterID == row.userMasterID)
          : null;

        if (salary) {
          row.remarks = 'salary is calculated, So, you can not add advance.';
        }
      }
      advanceData.push(row);
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.reValidateMessage('Advance Payment'),
      data: advanceData,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateAdvancePayment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { advancepaymentData } = req.body;
    const addAdvanceData = [];
    for (const row of advancepaymentData) {
      const advanceObject = {
        userMasterID: row.userMasterID,
        companyMasterID: row.companyMasterID,
        description: row.description,
        amount: row.amount,
        advanceDate: row.advanceDate,
        paymentYearMonth: row.paymentYearMonth,
        paymentmode: row.paymentmode,
        referenceNO: row.referenceNO,
        referenceDate: row.referenceDate,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
        AdvanceStatus: row.AdvanceStatus,
      };
      addAdvanceData.push(advanceObject);
    }

    await advancePayment.bulkCreate(addAdvanceData, { transaction });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Advance Payment'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.updateByReportee = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { advancePaymentID, description, amount, paymentYearMonth } =
      await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    await advancePayment.update(
      {
        description,
        amount,
        paymentYearMonth,
        updateBy,
        updateByIp,
      },
      {
        where: { advancePaymentID: advancePaymentID },
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Advance Payment'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getuserAdavancedataForReporteeUser = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      AdvanceStatus,
    } = await req.body;

    const paginationQuery = {};
    const condition = {};

    condition.status = [0, 1];

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    if (userMasterID && Array.isArray(userMasterID) && userMasterID.length) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    } else if (userMasterID) {
      const userid = [];
      userid.push(parseInt(userMasterID));
      condition.userMasterID = {
        [Sequelize.Op.in]: userid,
      };
    }

    if (startdate && enddate) {
      condition.advanceDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          description: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          amount: {
            [Sequelize.Op.eq]: searchQuery,
          },
        },
      ];
    if (AdvanceStatus) {
      condition.AdvanceStatus = AdvanceStatus;
    }
    condition.createBy = req.userDetails.userMasterId;
    const { rows: advancepayment, count } =
      await advancePayment.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'userMaster',
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
          {
            required: false,
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
      });

    return res
      .status(200)
      .json({ status: 200, data: advancepayment, totalcount: count });
  } catch (err) {
    next(err);
  }
};
