const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const {
  FileUploadType,
  bonusPaymentType,
  bonusPaymentMode,
} = require('../utils/dbUtils');
const fs = require('fs');
const moment = require('moment');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const EmployeeBonus = require('../models/employeeBonus');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const path = require('path');
const EmployeePayment = require('../models/employeePayment');

exports.addData = async (req, res, next) => {
  try {
    const { userMasterID, bonusYYYYMM, amount } = req.body;

    if (!userMasterID || !bonusYYYYMM || !amount)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    if (+amount <= 0)
      return res.status(200).json({
        status: 401,
        message: 'Bonus amount should be a positive value.',
      });

    await EmployeeBonus.create(
      {
        userMasterID,
        bonusYYYYMM,
        amount,
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Employee Bonus'),
    });
  } catch (error) {
    next(error);
  }
};

exports.listEmployeeBonus = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterId,
      userMasterID,
      fromMonth,
      toMonth,
      Export,
    } = req.body;

    if (!companyMasterId) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginatecondition =
      !Export && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {};

    if (userMasterID && userMasterID.length)
      condition.userMasterID = userMasterID;

    if (fromMonth && toMonth)
      condition.bonusYYYYMM = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };

    const { rows, count } = await EmployeeBonus.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginatecondition,
      include: [
        {
          model: UserMaster,
          where: { companyMasterId },
          attributes: userAttributes,
          include: [
            {
              model: EmployeeDesignation,
              as: 'emp_desig',
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
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
              as: 'emp_dept',
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
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
              as: 'emp_branch',
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentDate } },
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
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
        {
          model: EmployeePayment,
        },
      ],
      order: [['bonusYYYYMM', 'DESC']],
    });

    if (Export) {
      const data = rows.map((e) => {
        return {
          'Employee Code':
            e.userMaster.employeeJoiningDetails?.[0].employeeCode || '',
          'Employee Name': e.userMaster.displayName,
          'Employee Number': e.userMaster.userNumber,
          Branch: e.userMaster.emp_branch?.[0]?.branchMaster?.branchName || '',
          Department:
            e.userMaster.emp_dept?.[0]?.department?.departmentName || '',
          Designation:
            e.userMaster.emp_desig?.[0]?.designation?.designationName || '',
          BonusAmount: e.amount,
          BonusYYYYMM: e.bonusYYYYMM,
          PayYYYYMM: e.payYYYYMM,
          PaymentMode: e.payReferenceId
            ? 'Salary'
            : e.employeePayment?.paymentMode || '',
          Status: e.status == 10 ? 'Cancelled' : '',
        };
      });

      return await generateExcel(data, 'Employee Bonus', 'xlsx', res);
    }
    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelEmployeeBonus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await EmployeeBonus.findByPk(id);
    if (!data)
      return res.status(200).json({
        status: 401,
        message: 'data not found!',
      });

    if (data.paymentMode) {
      return res.status(200).json({
        status: 401,
        message: 'Employee Bonus is paid!',
      });
    }

    data.status = 10;

    await data.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.cancelMessage('Employee bonus'),
    });
  } catch (error) {
    next(error);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { companyMasterID, bonusYYYYMM, userMasterID } = await req.body;
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID: companyMasterID },
      attributes: ['fileUploadType'],
      raw: true,
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = companyData.fileUploadType;
    const condition = {};
    condition.companyMasterId = companyMasterID;
    condition.status = 1;
    if (userMasterID && userMasterID.length) {
      condition.userMasterID = userMasterID;
    }
    const order = [['displayName', 'ASC']];
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const userData = await UserMaster.findAll({
      where: condition,
      order,
      include: [
        {
          model: EmployeeJoiningDetails,
          required:
            fileUploadType == FileUploadType.MOBILE_NUMBER ? false : true,
          ...(fileUploadType == FileUploadType.EMPLOYEE_CODE && {
            where: {
              employeeCode: {
                [Sequelize.Op.ne]: null,
              },
            },
          }),
          attributes: ['employeeJoiningDetailId', 'employeeCode'],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
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
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
          model: companyMaster,
          required: true,
          attributes: companyAttributes,
        },
        {
          required: false,
          model: EmployeeBonus,
          where: {
            bonusYYYYMM,
            status: 1,
          },
        },
      ],
      attributes: userAttributes,
    });

    const formattedbonusYYYYMM = moment(bonusYYYYMM, 'YYYYMM').format(
      'MM-YYYY'
    );
    const finalDataToExport = userData.map((row) => {
      const TotalBonus = row.employeeBonus?.reduce?.(
        (acc, curr) => acc + curr.amount,
        0
      );
      return {
        Company: row.companyMaster.companyName,
        Branch:
          (row.employeeBranches && row.employeeBranches.length) > 0
            ? row.employeeBranches[0].branchMaster
              ? row.employeeBranches[0].branchMaster.branchName
              : ''
            : '',
        Department:
          (row.employeeDepartments && row.employeeDepartments.length) > 0
            ? row.employeeDepartments[0].department
              ? row.employeeDepartments[0].department.departmentName
              : ''
            : '',
        Designation:
          (row.employeeDesignations && row.employeeDesignations.length) > 0
            ? row.employeeDesignations[0].designation
              ? row.employeeDesignations[0].designation.designationName
              : ''
            : '',
        'User Numer': row.userNumber,
        'Employee Code':
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].employeeCode
            : '',
        'Employee Name': row.displayName,
        [`${formattedbonusYYYYMM} Total Bonus Added`]: TotalBonus,
        Amount: '',
      };
    });

    if (finalDataToExport.length) {
      return await generateExcel(
        finalDataToExport,
        'Demo Employee Bonus',
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: finalDataToExport,
    });
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
    const { companyMasterID, bonusYYYYMM } = await req.body;
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID: req.body.companyMasterID },
      attributes: ['fileUploadType'],
      raw: true,
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = companyData.fileUploadType;
    const condition = {};
    condition.companyMasterId = companyMasterID;
    condition.status = 1;

    const userData = await UserMaster.findAll({
      where: condition,
      include: [
        {
          model: EmployeeJoiningDetails,
          required:
            fileUploadType == FileUploadType.MOBILE_NUMBER ? false : true,
          ...(fileUploadType == FileUploadType.EMPLOYEE_CODE && {
            where: {
              employeeCode: {
                [Sequelize.Op.ne]: null,
              },
            },
          }),
          attributes: ['employeeJoiningDetailId', 'employeeCode'],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
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
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });

    const employeeBonusData = [];
    for (const row of rows) {
      let userMasterData = null;
      const index = fileUploadType === FileUploadType.MOBILE_NUMBER ? 4 : 5;

      if (row[index] && row[index].trim() !== '') {
        userMasterData =
          fileUploadType === FileUploadType.MOBILE_NUMBER
            ? userData.find((e) => e.userNumber === row[index])
            : userData.find(
                (e) =>
                  e.employeeJoiningDetails?.[0]?.employeeCode === row[index]
              );
      }
      if (
        !row[8] ||
        row[8].toString().trim() === '0' ||
        row[8].toString().trim() === ''
      ) {
        continue;
      }
      const employeBonus = {
        userMasterID: userMasterData?.userMasterID || '',
        companyMasterID: userMasterData?.companyMasterID || companyMasterID,
        company: userMasterData?.companyMaster?.companyName || '',
        branch:
          userMasterData?.employeeBranches?.[0]?.branchMaster?.branchName || '',
        department:
          userMasterData?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        designation:
          userMasterData?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        displayName: userMasterData?.displayName || '',
        userNumber: userMasterData?.userNumber || '',
        employeeCode:
          userMasterData?.employeeJoiningDetails?.[0]?.employeeCode || row[5],
        bonusYYYYMM,
        totalBonus: row[7],
        remarks: userMasterData
          ? ''
          : `User with ${fileUploadType} ${row[index]} not found.`,
        amount: row[8],
      };

      employeeBonusData.push(employeBonus);
    }

    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.validateMessage('Employee Bonus'),
      data: employeeBonusData,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateEmployeeBonus = async (req, res, next) => {
  try {
    const { employeeBonusData, companyMasterID } = req.body;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const userData = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
      include: [
        {
          model: EmployeeJoiningDetails,
          required: false,
          attributes: ['employeeJoiningDetailId', 'employeeCode'],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
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
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });
    const reValidatedEmployeeBonusData = [];

    for (const row of employeeBonusData) {
      if (
        !row.amount ||
        row.amount.toString().trim() === '0' ||
        row.amount.toString().trim() === ''
      ) {
        continue;
      }

      const userMasterData = userData.find(
        (e) => e.userMasterID == row.userMasterID
      );

      reValidatedEmployeeBonusData.push({
        userMasterID: row.userMasterID || '',
        companyMasterID: companyMasterID,
        company:
          userMasterData?.companyMaster?.companyName || row.company || '',
        branch:
          userMasterData?.employeeBranches?.[0]?.branchMaster?.branchName ||
          row.branch ||
          '',
        department:
          userMasterData?.employeeDepartments?.[0]?.department
            ?.departmentName ||
          row.department ||
          '',
        designation:
          userMasterData?.employeeDesignations?.[0]?.designation
            ?.designationName ||
          row.designation ||
          '',
        displayName: userMasterData?.displayName || row.userMasterID || '',
        userNumber: userMasterData?.userNumber || row.userNumber || '',
        employeeCode:
          userMasterData?.employeeJoiningDetails?.[0]?.employeeCode ||
          row.employeeCode ||
          '',
        bonusYYYYMM: row.bonusYYYYMM,
        totalBonus: row.totalBonus,
        remarks: userMasterData ? '' : 'User not found.',
        amount: row.amount,
      });
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.reValidateMessage('Employee Bonus'),
      data: reValidatedEmployeeBonusData,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateEmployeeBonus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { reValidatedEmployeeBonusData, bonusType } = req.body;
    const paymentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const createEmployeeBonusData = [];
    for (const row of reValidatedEmployeeBonusData) {
      if (
        !row.amount ||
        row.amount.toString().trim() === '0' ||
        row.amount.toString().trim() === ''
      ) {
        continue;
      }

      if (bonusType == bonusPaymentType.UNPAID) {
        const data = {
          userMasterID: row.userMasterID,
          amount: row.amount,
          bonusYYYYMM: row.bonusYYYYMM,
        };
        createEmployeeBonusData.push(data);
      } else {
        const paidBonus = await EmployeePayment.create(
          {
            amount: row.amount,
            userMasterID: row.userMasterID,
            paymentDate,
            paymentMode: bonusPaymentMode.UPI,
          },
          {
            transaction,
            user: req.userDetails, // Custom param for hooks
          }
        );
        
        const data = {
          userMasterID: row.userMasterID,
          amount: row.amount,
          bonusYYYYMM: row.bonusYYYYMM,
          payYYYYMM: row.bonusYYYYMM,
          employeePaymentId: paidBonus.employeePaymentId,
        };
        createEmployeeBonusData.push(data);
      }
    }
    //Create Bulk
    if (createEmployeeBonusData.length > 0) {
      await EmployeeBonus.bulkCreate(createEmployeeBonusData, {
        individualHooks: true,
        transaction,
        user: req.userDetails,  // If your sequelize hook uses this way
      });
    }
    await transaction.commit()
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Employee Bonus'),
    });
  } catch (err) {
    await transaction.rollback()
    next(err);
  }
};

exports.getEmployeeBonusByUserId = async (req, res, next) => {
  try {
    const { userMasterID, month } = req.body;

    if (!userMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const condition = { userMasterID };

    if (month) condition.bonusYYYYMM = month;

    const data = await EmployeeBonus.findAll({
      where: condition,
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};
