const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const PaySlipGenerator = require('../models/paySlipGenerator');
const { usermessage } = require('../response_message/message');
const {
  getDateRangesByType,
  accessibleUsers,
  asiaKolkataDateTime,
  daysInMonth,
  month_dict,
  generateHTMLToPDF_base64Path,
} = require('../utils/commonUtilFunctions');
const {
  PayrollFrequencyType,
  FileUploadType,
  TaxApplicabilityType,
} = require('../utils/dbUtils');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
const {
  generateDemoExcelForPaySlipGenerator,
  generatePaySlipExcel,
} = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const path = require('path');
const fs = require('fs');
const PaySlip = require('../models/paySlip');
const BankBranch = require('../models/bankBranch');
const BankMaster = require('../models/bankMaster');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const { mainApiUrl } = require('../utils/labelUtils');
const moment = require('moment');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const UserLeave = require('../models/userleave');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const HrLeaveTypes = require('../models/hrLeaveTypes');

exports.getDateRanges = async (req, res, next) => {
  try {
    const { year, payrollFrequency } = req.body;

    if (
      !year ||
      !payrollFrequency ||
      ![PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const dateRanges = getDateRangesByType(payrollFrequency, year);

    return res.status(200).json({
      status: 200,
      data: dateRanges,
    });
  } catch (error) {
    next(error);
  }
};

exports.downloadDemoExcel = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchMasterID,
      departmentID,
      userMasterID,
      payrollFrequency,
      month,
      startDate,
      endDate,
    } = req.body;

    if (!companyMasterID || !payrollFrequency) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const condition = {
      companyMasterId: companyMasterID,
      status: 1,
    };

    if (userMasterID && userMasterID.length)
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };

    const paySlipCondition = {};

    if (
      [PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      if (!startDate || !endDate) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.startDate = startDate;
      paySlipCondition.endDate = endDate;
    } else {
      if (!month) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.yearMonth = month;
    }

    const userData = await UserMaster.findAll({
      where: condition,
      ...accessibleUsers(req.userDetails, false, false),
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          attributes: ['divisionId'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },
        {
          model: EmployeeDesignation,
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
          where: {
            status: 1,
            ...(Array.isArray(departmentID) &&
              departmentID.length && { departmentID }),
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required:
            Array.isArray(departmentID) && departmentID.length ? true : false,
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
          where: {
            status: 1,
            ...(Array.isArray(branchMasterID) &&
              branchMasterID.length && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required:
            Array.isArray(branchMasterID) && branchMasterID.length
              ? true
              : false,
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
          where: {
            payrollFrequency,
          },
          attributes: ['employeeCode', 'employeeType'],
        },
        {
          required: false,
          model: PaySlipGenerator,
          where: paySlipCondition,
          include: [
            {
              model: HRSalaryFields,
              attributes: [
                'salaryFieldID',
                'payheadMasterId',
                'salaryFieldSrNo',
              ],
              include: [
                {
                  model: Payheadmaster,
                  as: 'PHM',
                  attributes: ['payheadName', 'taxApplicability'],
                },
              ],
            },
          ],
        },
      ],
      attributes: ['userMasterID', 'displayName', 'userNumber'],
    });

    const AllPayheadData = await HRSalaryFields.findAll({
      where: {
        companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.notIn]: [1, 50, 92],
        },
      },
      include: [
        {
          required: true,
          model: Payheadmaster,
          attributes: ['payheadName', 'taxApplicability'],
        },
      ],
      order: [['salaryFieldID', 'ASC']],
    });

    const employeeTaxableHeader = AllPayheadData.filter(
      (e) =>
        e.salaryFieldSrNo == 'A' &&
        e.Payheadmaster.taxApplicability == TaxApplicabilityType.TAXABLE
    ).map((n) => n.Payheadmaster.payheadName);

    const employeeNonTaxableHeader = AllPayheadData.filter(
      (e) =>
        e.salaryFieldSrNo == 'A' &&
        e.Payheadmaster.taxApplicability == TaxApplicabilityType.NON_TAXABLE
    ).map((n) => n.Payheadmaster.payheadName);

    const employeeContributionHeader = AllPayheadData.filter(
      (e) => e.salaryFieldSrNo == 'B'
    ).map((n) => n.Payheadmaster.payheadName);

    const employerContributionHeader = AllPayheadData.filter(
      (e) => e.salaryFieldSrNo == 'C' && e.payheadMasterId == 137
    ).map((n) => n.Payheadmaster.payheadName);

    // const finalHeader = [
    //     ...employeeTaxableHeader,
    //     ...employeeNonTaxableHeader,
    //     ...['GROSS'],
    //     ...employeeContributionHeader,
    //     ...['NET SALARY'],
    // ];

    const final = await Promise.all(
      userData.map((u) => {
        const salarySlipData = u.paySlipGenerators || [];

        const s_data = {};
        // set key as a payhead name and value as a amount
        salarySlipData.forEach((el) => {
          el.val = Number(el.amount);
          let key = el.hrSalaryField.PHM.payheadName;
          if (
            el.hrSalaryField.PHM.taxApplicability ==
            TaxApplicabilityType.TAXABLE
          ) {
            s_data[`${key}_hrs`] = el.actualWorkingHrs;
          }
          s_data[`${key}_amount`] = el.val;
          s_data[`${key}_YTD`] = el.YTD;
        });

        const object = {};

        // set allpayhead of company in object

        employeeTaxableHeader.forEach((e) => {
          object[`${e}_amount`] = s_data[`${e}_amount`] || '';
          object[`${e}_hrs`] = s_data[`${e}_hrs`] || '';
          object[`${e}_YTD`] = s_data[`${e}_YTD`] || '';
        });

        employeeNonTaxableHeader.forEach((e) => {
          object[`${e}_amount`] = s_data[`${e}_amount`] || '';
          object[`${e}_YTD`] = s_data[`${e}_YTD`] || '';
        });

        object['GROSS'] = s_data[`GROSS_amount`];

        employeeContributionHeader.forEach((e) => {
          object[`${e}_amount`] = s_data[`${e}_amount`] || '';
          object[`${e}_YTD`] = s_data[`${e}_YTD`] || '';
        });

        object['NET SALARY'] = s_data[`NET SALARY_amount`];

        employerContributionHeader.forEach((e) => {
          object[`${e}_amount`] = s_data[`${e}_amount`] || '';
          object[`${e}_YTD`] = s_data[`${e}_YTD`] || '';
        });

        return {
          ...{
            'Employee Code': u.employeeJoiningDetails[0].employeeCode,
            'Employee Name': u.displayName,
            'Mobile No.': u.userNumber,
            Branch: u.employeeBranches?.[0]?.branchMaster?.branchName || '',
            Department:
              u.employeeDepartments?.[0]?.department?.departmentName || '',
            Division: u.employeeDivisions?.[0]?.division?.divisionName || '',
            Designation:
              u.employeeDesignations?.[0]?.designation?.designationName || '',
            'Employee Type': u.employeeJoiningDetails[0].employeeType || '',
          },
          ...object,
        };
      })
    );

    if (+final.length === 0) {
      return res.status(200).json({
        message: 'No data found to export!',
      });
    }

    return await generateDemoExcelForPaySlipGenerator(
      employeeTaxableHeader,
      employeeNonTaxableHeader,
      employeeContributionHeader,
      employerContributionHeader,
      final,
      `Pay Slip Generator Demo`,
      'xlsx',
      res
    );
  } catch (error) {
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
    const {
      companyMasterID,
      branchMasterID,
      departmentID,
      userMasterID,
      payrollFrequency,
      month,
      startDate,
      endDate,
    } = await req.body;

    if (!companyMasterID || !payrollFrequency) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const rows = await readXlsxFile(filePath);

    const headerPart = rows[1].slice(8);

    const finalHeader = [];

    for (let i = 0; i < headerPart.length; i++) {
      const item = headerPart[i];
      if (item !== null) {
        const next1 = headerPart[i + 1];
        const next2 = headerPart[i + 2];
        if (next1 === null && next2 === null) {
          finalHeader.push(
            `${item}_amount`,
            `${item}_workingHrs`,
            `${item}_YTD`
          );
          i += 2;
        } else if (next1 === null) {
          finalHeader.push(`${item}_amount`, `${item}_YTD`);
          i += 1;
        } else {
          // No nulls, just the key alone (if needed)
          finalHeader.push(item);
        }
      }
    }

    // Skip header
    rows.splice(0, 3);
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID },
      attributes: ['fileUploadType'],
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = companyData.fileUploadType;

    const condition = {
      companyMasterId: companyMasterID,
      status: 1,
    };

    if (userMasterID && userMasterID.length)
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };

    const paySlipCondition = {};

    if (
      [PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      if (!startDate || !endDate) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.startDate = startDate;
      paySlipCondition.endDate = endDate;
    } else {
      if (!month) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.yearMonth = month;
    }

    const userData = await UserMaster.findAll({
      where: condition,
      ...accessibleUsers(req.userDetails, false, false),
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          attributes: ['divisionId'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },
        {
          model: EmployeeDesignation,
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
          where: {
            status: 1,
            ...(departmentID && { departmentID }),
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: departmentID ? true : false,
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
          where: {
            status: 1,
            ...(branchMasterID && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: branchMasterID ? true : false,
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
          where: {
            payrollFrequency,
            ...(fileUploadType === FileUploadType.EMPLOYEE_CODE
              ? { employeeCode: { [Sequelize.Op.ne]: null } }
              : {}),
          },
          attributes: ['employeeCode', 'employeeType'],
        },
      ],
      attributes: ['userMasterID', 'displayName', 'userNumber'],
    });

    const AllPayheadData = await HRSalaryFields.findAll({
      where: {
        companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.notIn]: [1],
        },
      },
      include: [
        {
          required: true,
          model: Payheadmaster,
          attributes: ['payheadName', 'taxApplicability'],
        },
      ],
      order: [['salaryFieldID', 'ASC']],
    });

    const normalPayhead = AllPayheadData.filter(
      (e) => ![50, 92].includes(e.payheadMasterId)
    );
    const netPayHead = AllPayheadData.find((e) => e.payheadMasterId == 92);
    const grossHead = AllPayheadData.find((e) => e.payheadMasterId == 50);

    const finalData = [];
    for (const row of rows) {
      let userMasterData = null;
      const index = fileUploadType === FileUploadType.MOBILE_NUMBER ? 2 : 0;

      let remarks = '',
        remarksFlag = false;

      if (row[index] && row[index].trim()) {
        userMasterData =
          fileUploadType === FileUploadType.MOBILE_NUMBER
            ? userData.find((e) => +e.userNumber == +row[index])
            : userData.find(
                (e) => e.employeeJoiningDetails?.[0]?.employeeCode == row[index]
              );
      }

      if (!userMasterData) continue;

      const payHeadData = {};

      let incomingGross = 0,
        incomingNetSalary = 0,
        calculatedGross = 0,
        calculatedDeduction = 0;

      for (let [index, value] of headerPart.entries()) {
        if (row[8 + index] && typeof row[8 + index] === 'number') {
          if (row[8 + index] < 0 && !remarksFlag) {
            remarks = `Negative value is not allowed.`;
            remarksFlag = true;
            break;
          }

          if (String(value).trim().toUpperCase() == 'GROSS' && grossHead) {
            payHeadData['GROSS_salaryFieldId'] = grossHead.salaryFieldID;
            payHeadData['GROSS'] = row[8 + index];

            incomingGross = +row[8 + index];
            continue;
          }

          if (
            String(value).trim().toUpperCase() == 'NET SALARY' &&
            netPayHead
          ) {
            payHeadData['NET SALARY_salaryFieldId'] = netPayHead.salaryFieldID;
            payHeadData['NET SALARY'] = row[8 + index];

            incomingNetSalary = +row[8 + index];
            continue;
          }

          const payhead = normalPayhead.find(
            (e) =>
              String(e.Payheadmaster.payheadName).trim().toLowerCase() ==
              String(value).trim().toLowerCase()
          );

          if (!payhead) continue;

          if (payhead.salaryFieldSrNo == 'A') {
            if (
              payhead.Payheadmaster.taxApplicability ==
              TaxApplicabilityType.TAXABLE
            ) {
              payHeadData[
                `${payhead.Payheadmaster.payheadName}_salaryFieldId`
              ] = payhead.salaryFieldID;
              payHeadData[`${payhead.Payheadmaster.payheadName}_workingHrs`] =
                row[8 + index + 1];
              payHeadData[`${payhead.Payheadmaster.payheadName}_amount`] =
                row[8 + index];
              payHeadData[`${payhead.Payheadmaster.payheadName}_YTD`] =
                row[8 + index + 2];

              calculatedGross += +row[8 + index];
              continue;
            }

            if (
              payhead.Payheadmaster.taxApplicability ==
              TaxApplicabilityType.NON_TAXABLE
            ) {
              payHeadData[
                `${payhead.Payheadmaster.payheadName}_salaryFieldId`
              ] = payhead.salaryFieldID;
              payHeadData[`${payhead.Payheadmaster.payheadName}_amount`] =
                row[8 + index];
              payHeadData[`${payhead.Payheadmaster.payheadName}_YTD`] =
                row[8 + index + 1];

              calculatedGross += +row[8 + index];
              continue;
            }
          }

          if (payhead.salaryFieldSrNo == 'B') {
            payHeadData[`${payhead.Payheadmaster.payheadName}_salaryFieldId`] =
              payhead.salaryFieldID;
            payHeadData[`${payhead.Payheadmaster.payheadName}_amount`] =
              row[8 + index];
            payHeadData[`${payhead.Payheadmaster.payheadName}_YTD`] =
              row[8 + index + 1];

            calculatedDeduction += +row[8 + index];
            continue;
          }

          if (payhead.salaryFieldSrNo == 'C') {
            payHeadData[`${payhead.Payheadmaster.payheadName}_salaryFieldId`] =
              payhead.salaryFieldID;
            payHeadData[`${payhead.Payheadmaster.payheadName}_amount`] =
              row[8 + index];
            payHeadData[`${payhead.Payheadmaster.payheadName}_YTD`] =
              row[8 + index + 1];
            continue;
          }
        }
      }

      if (
        +incomingGross == 0 &&
        +incomingNetSalary == 0 &&
        +calculatedGross == 0 &&
        +calculatedDeduction == 0
      )
        continue;

      if (+incomingGross != +calculatedGross && !remarksFlag)
        remarks =
          "There's a mismatch between the entered and calculated gross salary";

      if (
        +incomingNetSalary != +calculatedGross - +calculatedDeduction &&
        !remarksFlag
      )
        remarks =
          "There's a mismatch between the entered and calculated net salary";

      const employeData = {
        userMasterID: userMasterData?.userMasterID || '',
        companyMasterID: userMasterData?.companyMasterId || companyMasterID,
        employeeCode:
          userMasterData?.employeeJoiningDetails?.[0]?.employeeCode || row[5],
        displayName: userMasterData?.displayName || '',
        userNumber: userMasterData?.userNumber || '',
        branch:
          userMasterData?.employeeBranches?.[0]?.branchMaster?.branchName || '',
        department:
          userMasterData?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        Division:
          userMasterData.employeeDivisions?.[0]?.division?.divisionName || '',

        designation:
          userMasterData?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        'Employee Type':
          userMasterData.employeeJoiningDetails?.[0]?.employeeType || '',
        remarks,
        payrollFrequency,
        month,
        startDate,
        endDate,
        ...payHeadData,
      };

      finalData.push(employeData);
    }

    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });

    return res.status(200).json({
      status: 200,
      message: usermessage.validateMessage('Pay Slip Data'),
      data: finalData,
      finalHeader,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateExcel = async (req, res, next) => {
  try {
    const { paySlipData = [], finalHeader = [], companyMasterID } = req.body;

    if (
      !Array.isArray(paySlipData) ||
      paySlipData.length === 0 ||
      !Array.isArray(finalHeader) ||
      finalHeader.length === 0 ||
      !companyMasterID
    ) {
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const allUserIds = paySlipData.map((e) => e.userMasterID);

    const userData = await UserMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: allUserIds,
        },
      },
      ...accessibleUsers(req.userDetails, false, false),
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          attributes: ['divisionId'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },
        {
          model: EmployeeDesignation,
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
          attributes: ['employeeCode', 'employeeType'],
        },
      ],
      attributes: ['userMasterID', 'displayName', 'userNumber'],
    });

    const AllPayheadData = await HRSalaryFields.findAll({
      where: {
        companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.notIn]: [1, 50, 92],
        },
      },
      include: [
        {
          required: true,
          model: Payheadmaster,
          attributes: ['payheadName', 'taxApplicability'],
        },
      ],
      order: [['salaryFieldID', 'ASC']],
    });

    const finalData = [];

    for (const data of paySlipData) {
      let remarks = '',
        remarksFlag = false;

      const userMasterData = userData.find(
        (e) => e.userMasterID == data.userMasterID
      );

      if (!userMasterData) {
        remarks = `User with ${data.userNumber} Mobile not found.`;
        remarksFlag = true;
      }

      const payHeadData = {};

      let incomingGross = 0,
        incomingNetSalary = 0,
        calculatedGross = 0,
        calculatedDeduction = 0;

      for (const header of finalHeader) {
        if (data[`${header}`] && typeof data[`${header}`] === 'number') {
          if (data[`${header}`] < 0 && !remarksFlag) {
            remarks = `Negative value is not allowed.`;
            remarksFlag = true;
            break;
          }

          payHeadData[`${header}`] = data[`${header}`];

          if (String(header).trim().toUpperCase() == 'GROSS') {
            incomingGross = +data[`${header}`];
            continue;
          }

          if (String(header).trim().toUpperCase() == 'NET SALARY') {
            incomingNetSalary = +data[`${header}`];
            continue;
          }

          if (!header.endsWith('_amount')) continue;

          const payhead = AllPayheadData.find(
            (e) =>
              String(e.Payheadmaster.payheadName).trim().toLowerCase() ==
              String(header.replace('_amount', '')).trim().toLowerCase()
          );

          if (!payhead) continue;

          if (payhead.salaryFieldSrNo == 'A') {
            if (
              payhead.Payheadmaster.taxApplicability ==
              TaxApplicabilityType.TAXABLE
            ) {
              calculatedGross += +data[`${header}`];
              continue;
            }

            if (
              payhead.Payheadmaster.taxApplicability ==
              TaxApplicabilityType.NON_TAXABLE
            ) {
              calculatedGross += +data[`${header}`];
              continue;
            }
          }

          if (payhead.salaryFieldSrNo == 'B') {
            calculatedDeduction += +data[`${header}`];
            continue;
          }
        }
      }

      if (
        +incomingGross == 0 &&
        +incomingNetSalary == 0 &&
        +calculatedGross == 0 &&
        +calculatedDeduction == 0
      )
        continue;

      if (+incomingGross != +calculatedGross && !remarksFlag)
        remarks =
          "There's a mismatch between the entered and calculated gross salary";

      if (
        +incomingNetSalary != +calculatedGross - +calculatedDeduction &&
        !remarksFlag
      )
        remarks =
          "There's a mismatch between the entered and calculated net salary";

      const employeData = {
        userMasterID: userMasterData?.userMasterID || '',
        companyMasterID: userMasterData?.companyMasterId || companyMasterID,
        employeeCode:
          userMasterData?.employeeJoiningDetails?.[0]?.employeeCode || '',
        displayName: userMasterData?.displayName || '',
        userNumber: userMasterData?.userNumber || '',
        branch:
          userMasterData?.employeeBranches?.[0]?.branchMaster?.branchName || '',
        department:
          userMasterData?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        Division:
          userMasterData.employeeDivisions?.[0]?.division?.divisionName || '',

        designation:
          userMasterData?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        'Employee Type':
          userMasterData.employeeJoiningDetails?.[0]?.employeeType || '',
        remarks,
        payrollFrequency: data.payrollFrequency,
        month: data.month,
        startDate: data.startDate,
        endDate: data.endDate,
        ...payHeadData,
      };

      finalData.push(employeData);
    }

    return res.status(200).json({
      status: 200,
      message: usermessage.reValidateMessage('Pay Slip Data'),
      data: finalData,
      finalHeader,
    });
  } catch (error) {
    next(error);
  }
};

exports.saveData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { paySlipData = [], finalHeader = [], companyMasterID } = req.body;

    const userIds = paySlipData.map((e) => e.userMasterID);
    const payrollFrequency = paySlipData?.[0]?.payrollFrequency || '';
    let month = paySlipData?.[0]?.month || '';
    let startDate = paySlipData?.[0]?.startDate || '';
    let endDate = paySlipData?.[0]?.endDate || '';

    if (!userIds.length || !payrollFrequency) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: usermessage.ValidParameters,
      });
    }

    const paySlipCondition = {
      userMasterID: {
        [Sequelize.Op.in]: userIds,
      },
      payrollFrequency,
    };

    if (
      [PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      month = null;
      if (!startDate || !endDate) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.startDate = startDate;
      paySlipCondition.endDate = endDate;
    } else {
      startDate = null;
      endDate = null;

      if (!month) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.yearMonth = month;
    }

    const AllPayheadData = await HRSalaryFields.findAll({
      where: {
        companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.notIn]: [1],
        },
      },
      include: [
        {
          required: true,
          model: Payheadmaster,
          attributes: ['payheadName', 'taxApplicability'],
        },
      ],
      order: [['salaryFieldID', 'ASC']],
    });

    const normalPayhead = AllPayheadData.filter(
      (e) => ![50, 92].includes(e.payheadMasterId)
    );
    const netPayHead = AllPayheadData.find((e) => e.payheadMasterId == 92);
    const grossHead = AllPayheadData.find((e) => e.payheadMasterId == 50);

    const validSuffixes = ['YTD', 'amount', 'workingHrs'];

    const uniquePayheadArray = [
      ...new Set(
        finalHeader.map((key) => {
          const parts = key.split('_');
          return parts.length === 2 && validSuffixes.includes(parts[1])
            ? parts[0]
            : key;
        })
      ),
    ];

    const finalData = [];

    for (const data of paySlipData) {
      const userMasterID = data.userMasterID;

      for (const header of uniquePayheadArray) {
        const object = {
          userMasterID,
          payrollFrequency,
          startDate,
          endDate,
          yearMonth: month,
          amount: null,
          salaryFieldID: null,
          YTD: null,
          actualWorkingHrs: null,
        };

        if (String(header).trim().toUpperCase() == 'GROSS' && grossHead) {
          object.amount = data[`${header}`];
          object.salaryFieldID = grossHead.salaryFieldID;

          finalData.push(object);

          continue;
        }

        if (String(header).trim().toUpperCase() == 'NET SALARY' && netPayHead) {
          object.amount = data[`${header}`];
          object.salaryFieldID = netPayHead.salaryFieldID;
          finalData.push(object);

          continue;
        }

        if (
          data[`${header}_amount`] &&
          typeof data[`${header}_amount`] === 'number' &&
          +data[`${header}_amount`] > 0
        ) {
          const payhead = normalPayhead.find(
            (e) =>
              String(e.Payheadmaster.payheadName).trim().toLowerCase() ==
              String(header).trim().toLowerCase()
          );

          if (!payhead) continue;

          object.amount = +data[`${header}_amount`];
          object.salaryFieldID = payhead.salaryFieldID;

          if (data[`${header}_YTD`]) object.YTD = +data[`${header}_YTD`];
          if (data[`${header}_workingHrs`])
            object.actualWorkingHrs = +data[`${header}_workingHrs`];

          finalData.push(object);
        }
      }
    }

    const paySlip = await PaySlip.findAll({
      where: paySlipCondition,
    });

    await PaySlip.destroy({
      where: paySlipCondition,
      transaction,
    });

    await PaySlipGenerator.destroy({
      where: paySlipCondition,
      individualHooks: true,
      user: req.userDetails,
      transaction,
    });

    await PaySlipGenerator.bulkCreate(finalData, {
      individualHooks: true,
      user: req.userDetails,
      transaction,
    });

    paySlip.forEach((e) => {
      const filePath = path.join(mainApiUrl, e.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.addMessage('Pay Slip Data'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getPaySlipGeneratorData = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, payrollFrequency, Export } = req.body;

    let { month, startDate, endDate } = req.body;

    if (
      !Array.isArray(userMasterID) ||
      userMasterID.length === 0 ||
      !payrollFrequency
    )
      return res.status(400).json({
        status: 401,
        message: usermessage.ValidParameters,
      });

    const paginationQuery = {};

    if (page && limit && !Export) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const paySlipCondition = {};

    let currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (
      [PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      month = null;

      if (!startDate || !endDate) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.startDate = startDate;
      paySlipCondition.endDate = endDate;

      currentDate = endDate;
    } else {
      startDate = null;
      endDate = null;

      if (!month) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.yearMonth = month;

      currentDate =
        String(month).slice(0, 4) +
        '-' +
        String(month).slice(4, 6) +
        '-' +
        daysInMonth(String(month).slice(4, 6), String(month).slice(0, 4));
    }

    const { rows: userData, count } = await UserMaster.findAndCountAll({
      distinct: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
      ...paginationQuery,
      order: [['displayName', 'ASC']],
      include: [
        {
          model: EmployeeDesignation,
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
          where: {
            payrollFrequency,
          },
          attributes: ['employeeCode'],
        },
        {
          required: true,
          model: PaySlipGenerator,
          where: paySlipCondition,
          include: [
            {
              model: HRSalaryFields,
              attributes: [
                'salaryFieldID',
                'payheadMasterId',
                'salaryFieldSrNo',
              ],
              include: [
                {
                  model: Payheadmaster,
                  as: 'PHM',
                  attributes: ['payheadName', 'taxApplicability'],
                },
              ],
            },
          ],
        },
        {
          required: false,
          model: PaySlip,
          where: paySlipCondition,
        },
      ],
      attributes: ['userMasterID', 'displayName', 'userNumber'],
    });

    const finalData = userData.map((e) => {
      const paySlipData = (e.paySlipGenerators || []).sort(
        (a, b) => a.salaryFieldID - b.salaryFieldID
      );

      return {
        userMasterID: e.userMasterID,
        employeeCode: e.employeeJoiningDetails?.[0]?.employeeCode,
        displayName: e.displayName,
        userNumber: e.userNumber,
        branch: e.employeeBranches?.[0]?.branchMaster?.branchName || '',
        department:
          e.employeeDepartments?.[0]?.department?.departmentName || '',
        designation:
          e.employeeDesignations?.[0]?.designation?.designationName || '',
        month: month
          ? month_dict[String(month).slice(4, 6)] +
            '-' +
            String(month).slice(0, 4)
          : null,
        startDate: startDate,
        endDate,
        payrollFrequency,
        earning_paySlipData: (paySlipData || []).filter(
          (pay) =>
            pay.hrSalaryField?.salaryFieldSrNo == 'A' &&
            ![1, 50, 92].includes(pay.hrSalaryField?.payheadMasterId)
        ),
        deduction_paySlipData: (paySlipData || []).filter(
          (pay) =>
            pay.hrSalaryField?.salaryFieldSrNo == 'B' &&
            ![1, 50, 92].includes(pay.hrSalaryField?.payheadMasterId)
        ),
        gross:
          (paySlipData || []).find(
            (pay) => pay.hrSalaryField?.payheadMasterId == 50
          )?.amount || 0,
        netPay:
          (paySlipData || []).find(
            (pay) => pay.hrSalaryField?.payheadMasterId == 92
          )?.amount || 0,
        paySlip: e.paySlips || [],
      };
    });

    if (Export)
      return await generatePaySlipExcel(
        finalData,
        'Pay Slip Data',
        'xlsx',
        res
      );

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.generateSalarySlip = async (req, res, next) => {
  let filnamesArray = [];

  try {
    const { userMasterID, payRefTitle, payrollFrequency } = req.body;

    let { month, startDate, endDate } = req.body;
    if (
      !Array.isArray(userMasterID) ||
      userMasterID.length === 0 ||
      !payrollFrequency
    )
      return res.status(400).json({
        status: 401,
        message: usermessage.ValidParameters,
      });

    let currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let leaveStartDate = '',
      leaveEndDate = '';

    const paySlipCondition = {};

    if (
      [PayrollFrequencyType.FORTNIGHTLY, PayrollFrequencyType.WEEKLY].includes(
        payrollFrequency
      )
    ) {
      month = null;

      if (!startDate || !endDate) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.startDate = startDate;
      paySlipCondition.endDate = endDate;

      leaveStartDate = startDate;
      leaveEndDate = endDate;

      currentDate = endDate;
    } else {
      startDate = null;
      endDate = null;

      if (!month) {
        return res.status(200).json({
          status: 401,
          message: usermessage.ValidParameters,
        });
      }

      paySlipCondition.yearMonth = month;

      currentDate =
        String(month).slice(0, 4) +
        '-' +
        String(month).slice(4, 6) +
        '-' +
        daysInMonth(String(month).slice(4, 6), String(month).slice(0, 4));

      leaveStartDate =
        String(month).slice(0, 4) +
        '-' +
        String(month).slice(4, 6) +
        '-' +
        '01';
      leaveEndDate = currentDate;

      include.push({
        model: EmployeeSalaryPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: currentDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: currentDate } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['salaryPolicyID'],
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy',
            attributes: ['salaryPolicyName', 'monthlyFixhours'],
          },
        ],
      });
    }

    const include = [
      {
        model: EmployeeBranch,
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
        required: true,
        model: EmployeeJoiningDetails,
        where: {
          payrollFrequency,
        },
        include: [
          { model: BankBranch, attributes: ['bankBranchName'] },
          { model: BankMaster, attributes: ['bankName'] },
        ],
        attributes: ['employeeCode', 'joiningDate', 'bankIFSC'],
      },
      {
        required: true,
        model: PaySlipGenerator,
        where: paySlipCondition,
        include: [
          {
            model: HRSalaryFields,
            attributes: [
              'salaryFieldID',
              'payheadMasterId',
              'salaryFieldSrNo',
              'payheadDisplayName',
            ],
            include: [
              {
                model: Payheadmaster,
                as: 'PHM',
                attributes: ['payheadName', 'taxApplicability'],
              },
            ],
          },
        ],
      },
      {
        required: false,
        model: PaySlip,
        where: paySlipCondition,
      },
      {
        required: false,
        model: UserLeave,
        attributes: ['userMasterID'],
        include: [
          {
            required: true,
            model: UserLeaveTransaction,
            where: {
              date: {
                [Sequelize.Op.between]: [leaveStartDate, leaveEndDate],
              },
              status: 1,
            },
            include: [
              {
                model: HrLeaveTypes,
                where: { LeaveID: { [Sequelize.Op.in]: [10, 27, 18] } },
                attributes: ['LeaveID'],
              },
            ],
          },
        ],
      },
    ];

    const userData = await UserMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
      include: include,
      attributes: [
        'userMasterID',
        'displayName',
        'userNumber',
        'companyMasterId',
      ],
    });

    const finalData = [];
    for (const data of userData) {
      const joinig = data.employeeJoiningDetails?.[0] || null;
      const salaryPolicy =
        data.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

      const leaveData = data.userLeaves || [];

      const leaveTransaction =
        leaveData.flatMap((e) => e.userLeaveTransactions) || [];

      const paySlipData = data.paySlipGenerators || [];

      const payslip = data.paySlips || [];

      if (payslip.length) continue;

      const actualWorkingHRS = [...paySlipData]
        .filter((e) =>
          [145, 102, 103, 104].includes(e.hrSalaryField?.payheadMasterId)
        )
        .reduce((acc, obj) => acc + +obj.actualWorkingHrs, 0);

      const object = {};

      const employeeDetails = {
        employeeCode: joinig?.employeeCode || '',
        employeeName: data.displayName,
        joining: joinig.joiningDate
          ? String(joinig.joiningDate).split('-').reverse().join('-')
          : '',
        workingLocation:
          data.employeeBranches?.[0]?.branchMaster?.branchName || '',
        payRef:
          payrollFrequency == PayrollFrequencyType.MONTHLY
            ? payrollFrequency
            : `${payRefTitle} - ${payrollFrequency}`,
        TotalWorkingHrs:
          payrollFrequency == PayrollFrequencyType.FORTNIGHTLY
            ? 88
            : payrollFrequency == PayrollFrequencyType.MONTHLY && salaryPolicy
              ? salaryPolicy.monthlyFixhours
              : 0,
        actualWorkingHrs:
          +actualWorkingHRS % 1 == 0
            ? +actualWorkingHRS
            : +actualWorkingHRS.toFixed(2),
        LWOP: leaveTransaction
          .filter((e) => e.hrLeaveType.LeaveID == 18)
          .reduce((acc, obj) => acc + +obj.days, 0),
        SickLeave: leaveTransaction
          .filter((e) => e.hrLeaveType.LeaveID == 10)
          .reduce((acc, obj) => acc + +obj.days, 0),
        AL: leaveTransaction
          .filter((e) => e.hrLeaveType.LeaveID == 27)
          .reduce((acc, obj) => acc + +obj.days, 0),
        BankName: joinig?.bankMaster?.bankName || '',
        bankBranch: joinig?.bankBranch?.bankBranchName || '',
        BSBCode: joinig?.bankIFSC || '',
        payStartDate:
          payrollFrequency == PayrollFrequencyType.MONTHLY
            ? (
                String(month).slice(0, 4) +
                '-' +
                String(month).slice(4, 6) +
                '-' +
                '01'
              )
                .split('-')
                .reverse()
                .join('-')
            : String(startDate).split('-').reverse().join('-'),
        payEndDate:
          payrollFrequency == PayrollFrequencyType.MONTHLY
            ? String(currentDate).split('-').reverse().join('-')
            : String(endDate).split('-').reverse().join('-'),
      };

      object['employeeDetails'] = employeeDetails;

      const earnings = paySlipData
        .filter(
          (e) =>
            e.hrSalaryField.salaryFieldSrNo == 'A' &&
            ![50, 92, 135, 136].includes(e.hrSalaryField?.payheadMasterId) &&
            e.hrSalaryField?.PHM?.taxApplicability ==
              TaxApplicabilityType.TAXABLE
        )
        .map((m) => {
          return {
            payheadName: m.hrSalaryField?.payheadDisplayName
              ? m.hrSalaryField.payheadDisplayName
              : m.hrSalaryField?.PHM?.payheadName,
            actualWorkingHrs: m.actualWorkingHrs,
            amount: m.amount,
            YTD: m.YTD,
          };
        });
      const earning_Total_amount = earnings.reduce(
        (acc, obj) => acc + +obj.amount,
        0
      );
      const earning_Total_YTD = earnings.reduce(
        (acc, obj) => acc + +obj.YTD,
        0
      );

      const nonTaxable = paySlipData
        .filter(
          (e) =>
            e.hrSalaryField.salaryFieldSrNo == 'A' &&
            ![50, 92, 135, 136].includes(e.hrSalaryField?.payheadMasterId) &&
            e.hrSalaryField?.PHM?.taxApplicability ==
              TaxApplicabilityType.NON_TAXABLE
        )
        .map((m) => {
          return {
            payheadName: m.hrSalaryField?.payheadDisplayName
              ? m.hrSalaryField.payheadDisplayName
              : m.hrSalaryField?.PHM?.payheadName,
            amount: m.amount,
            YTD: m.YTD,
          };
        });
      const nonTaxable_Total_amount = nonTaxable.reduce(
        (acc, obj) => acc + +obj.amount,
        0
      );
      const nonTaxable_Total_YTD = nonTaxable.reduce(
        (acc, obj) => acc + +obj.YTD,
        0
      );

      const deductions = paySlipData
        .filter(
          (e) =>
            e.hrSalaryField.salaryFieldSrNo == 'B' &&
            ![50, 92, 135, 136].includes(e.hrSalaryField?.payheadMasterId)
        )
        .map((m) => {
          return {
            payheadName: m.hrSalaryField?.payheadDisplayName
              ? m.hrSalaryField.payheadDisplayName
              : m.hrSalaryField?.PHM?.payheadName,
            amount: m.amount,
            YTD: m.YTD,
          };
        });
      const deductions_Total_amount = deductions.reduce(
        (acc, obj) => acc + +obj.amount,
        0
      );
      const deductions_Total_YTD = deductions.reduce(
        (acc, obj) => acc + +obj.YTD,
        0
      );

      const taxLiability = paySlipData
        .filter(
          (e) =>
            e.hrSalaryField.salaryFieldSrNo == 'B' &&
            [135, 136].includes(e.hrSalaryField?.payheadMasterId)
        )
        .map((m) => {
          return {
            payheadName: m.hrSalaryField?.payheadDisplayName
              ? m.hrSalaryField.payheadDisplayName
              : m.hrSalaryField?.PHM?.payheadName,
            amount: m.amount,
            YTD: m.YTD,
          };
        });
      const taxLiability_Total_amount = taxLiability.reduce(
        (acc, obj) => acc + +obj.amount,
        0
      );
      const taxLiability_Total_YTD = taxLiability.reduce(
        (acc, obj) => acc + +obj.YTD,
        0
      );

      const employer_contribution = paySlipData
        .filter((e) => e.hrSalaryField?.payheadMasterId == 137)
        .map((m) => {
          return {
            payheadName: m.hrSalaryField?.payheadDisplayName
              ? m.hrSalaryField.payheadDisplayName
              : m.hrSalaryField?.PHM?.payheadName,
            amount: m.amount,
            YTD: m.YTD,
          };
        });

      const gross =
        paySlipData.find((e) => e.hrSalaryField?.payheadMasterId == 50)
          ?.amount || 0;
      const netPay =
        paySlipData.find((e) => e.hrSalaryField?.payheadMasterId == 92)
          ?.amount || 0;

      if (earnings.length) {
        object['earnings'] = earnings;
        object['earning_Total_amount'] = (+earning_Total_amount).toFixed(2);
        object['earning_Total_YTD'] = (+earning_Total_YTD).toFixed(2);
      }

      if (nonTaxable.length) {
        object['nonTaxable'] = nonTaxable;
        object['nonTaxable_Total_amount'] = (+nonTaxable_Total_amount).toFixed(
          2
        );
        object['nonTaxable_Total_YTD'] = (+nonTaxable_Total_YTD).toFixed(2);
      }

      if (deductions.length) {
        object['deductions'] = deductions;
        object['deductions_Total_amount'] = (+deductions_Total_amount).toFixed(
          2
        );
        object['deductions_Total_YTD'] = (+deductions_Total_YTD).toFixed(2);
      }

      if (taxLiability.length) {
        object['taxLiability'] = taxLiability;
        object['taxLiability_Total_amount'] =
          (+taxLiability_Total_amount).toFixed(2);
        object['taxLiability_Total_YTD'] = (+taxLiability_Total_YTD).toFixed(2);
      }

      if (employer_contribution.length) {
        object['employer_contribution'] = employer_contribution;
      }

      object['gross'] = gross;
      object['netPay'] = netPay;

      const base64Data = await generateHTMLToPDF_base64Path(
        object,
        'paySlip',
        'portrait',
        'html' //File Extension
      );

      const uniqueFilename = `${Date.now()}-${data.userMasterID}.pdf`;
      const uploadsDir = path.join(
        __dirname,
        '../uploads',
        `PaySlips/${data.companyMasterId}`
      );
      const filePath = `uploads/PaySlips/${data.companyMasterId}/${uniqueFilename}`;

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(uploadsDir, `${uniqueFilename}`),
        base64Data,
        'base64'
      );

      // push file Name

      filnamesArray.push(path.join(uploadsDir, uniqueFilename));

      finalData.push({
        userMasterID: data.userMasterID,
        payrollFrequency,
        yearMonth:
          payrollFrequency == PayrollFrequencyType.MONTHLY ? month : null,
        startDate: [
          PayrollFrequencyType.FORTNIGHTLY,
          PayrollFrequencyType.WEEKLY,
        ].includes(payrollFrequency)
          ? startDate
          : null,
        endDate: [
          PayrollFrequencyType.FORTNIGHTLY,
          PayrollFrequencyType.WEEKLY,
        ].includes(payrollFrequency)
          ? endDate
          : null,
        path: filePath,
      });
    }

    await PaySlip.bulkCreate(finalData, {
      individualHooks: true,
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
    });
  } catch (error) {
    filnamesArray.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    next(error);
  }
};

exports.getMyPaySlipData = async (req, res, next) => {
  const userPaySlipData = await PaySlip.findAll({
    where: { userMasterID: req.userDetails.userMasterId },
  });

  return res.status(200).json({
    status: 200,
    data: userPaySlipData,
    totalcount: userPaySlipData?.length,
  });
};
