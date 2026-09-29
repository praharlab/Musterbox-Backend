const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const company_master = require('../models/companyMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const EmployeeEmployement = require('../models/employeeEmployeement');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const jwt = require('jsonwebtoken');
const EmployeeJoiningDetailsChanges = require('../models/employeeJoiningChanges');
const { executeQuery } = require('./common.controller');
const fs = require('fs');
const axios = require('axios');

const AttendanceTransaction = require('../models/attendanceTransaction');
const CompanyMaster = require('../models/companyMaster');
const { usermessage } = require('../response_message/message');
const {
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
  userDetails,
  getemployeeJoiningDetails,
  getEmployeeDigitalSignature,
  getEmployeeAddress,
  getAllUserByBranch,
  getAllUserByCompany,
  userExperience,
  userEducation,
  userDocument,
  userFamily,
  userSkills,
  userReportTo,
  employeeShift,
  employeeAttendancePolicy,
  employeeSalaryPolicy,
  employeeHolidayPolicy,
  employeeWeekoffPolicy,
  companyDocument,
  getSalary,
  leave,
  checkSubscriptionPlanExpiration,
  authorization,
  employeeLateEarlyPolicy,
  employeeDivision,
  employeeWorkingArea,
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const companyMaster = require('../models/companyMaster');

const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const path = require('path');
const moment = require('moment');
const BankMaster = require('../models/bankMaster');
const EmployeePenalty = require('../models/employeePenalty');
const Designation = require('../models/designation');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const UserAddress = require('../models/userAddress');
const EmployeeDigitalSignature = require('../models/employeeDigitalSignature');
const CityMaster = require('../models/citymaster');
const {
  createZipFileForPortraitidIdCards,
  generateExcelForAssignBiometricCodeToUser,
  generateExcel,
} = require('../utils/exportData');
const { faceApiUrl, mainApiUrl, appURL } = require('../utils/labelUtils');
const { roleType, PayrollFrequencyType } = require('../utils/dbUtils');
const EmployeeSkillCategory = require('../models/employeeSkillCategory');
const { isArray } = require('lodash');
const { companyAttributes } = require('../utils/commonVars');
const UserDocument = require('../models/userDocument');

/**
 * save employee Joining details.
 *
 * @body {createBy} createBy user id of user who added the employee joining Details.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.AddEmpJoiningnpmDetails = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      AccountMasterId,
      dob,
      joiningDate,
      leavingDate,
      adharCard,
      esicNumber,
      esicEndMonth,
      pfNumber,
      uanNumber,
      pancard,
      bankMasterID,
      bankIFSC,
      bankAccountNo,
      retirementAge,
      noticePeriod,
      applicableDate,
      endDate,
      salarytype,
      retirementDate,
      biometricCode,
      biometricSerialNo,
      salaryCalculationAct,
      overtime,
      employment,
      adharName,
      pfjoiningDate,
      pfbankMasterID,
      pfbankIFSC,
      pfbankAccountNo,
      esicjoiningDate,
      bloodgroup,
      nationality,
      attendanceFrom,
      fullMonthPresence,
      nameAsBank,
      employeeType,
      bankBranchID,
      contractorId,
      payrollFrequency,
    } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    let employeeCode = '';
    let adharPhoto = null;
    let panPhoto = null;
    // Check For Aadhar Card Photo
    if (req.files.adharPhoto) {
      adharPhoto = req.files.adharPhoto[0].filename;
    }
    // Check For PAN Card Photo
    if (req.files.panPhoto) {
      panPhoto = req.files.panPhoto[0].filename;
    }

    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] == 'null' ||
        !req.body[key] ||
        req.body[key] == 'undefined'
      ) {
        req.body[key] = null;
      }
    }
    // Get User Data
    const employee = await UserMaster.findOne(
      {
        where: {
          userMasterID: req.body.userMasterID,
          status: [0, 1],
        },
        include: [{ model: EmployeeJoiningDetails }, { model: companyMaster }],
      },
      { transaction }
    );

    if (!employee)
      return res.status(200).json({
        status: 401,
        message: 'User not found!',
      });

    // Check For Employee Joining
    const emp_Joining =
      employee.employeeJoiningDetails &&
      employee.employeeJoiningDetails.length > 0
        ? employee.employeeJoiningDetails[0]
        : null;

    // check if employee FNF is completed or not

    const isFNF = employee.isFNF;

    if (isFNF && emp_Joining && req.body.leavingDate) {
      if (emp_Joining.leavingDate != req.body.leavingDate) {
        return res.status(200).json({
          status: 401,
          message:
            'Full & Final Settlement (FNF) has already been completed for this employee. The relieving date cannot be changed.',
        });
      }
    }

    // Check For Employee Code Type
    const employeeCodeType = employee.companyMaster.employeeCodeType;
    const company = +employee.companyMasterId;

    let executeCode = false;

    if (emp_Joining) {
      if (!emp_Joining.employeeCode) {
        executeCode = true;
      } else {
        employeeCode =
          employeeCodeType == 'manual'
            ? req.body.employeeCode
            : emp_Joining.employeeCode;
      }
    } else {
      executeCode = true;
    }

    // Find Unique Employee Code
    let uniqueEmpCodeInAllCompany = false;

    if (employee.companyMaster.parentCompanyMasterID == 0)
      uniqueEmpCodeInAllCompany = employee.companyMaster.uniqueEmpCode;
    else {
      const parentCompanyData = await companyMaster.findOne(
        {
          raw: true,
          where: {
            companyMasterID: employee.companyMaster.parentCompanyMasterID,
          },
        },
        { transaction }
      );

      uniqueEmpCodeInAllCompany = parentCompanyData.uniqueEmpCode;
    }

    // unique Employee Code is true for all company

    let AllcompanyIds = [company];

    if (uniqueEmpCodeInAllCompany) {
      const companyCodition =
        employee.companyMaster.parentCompanyMasterID == 0
          ? {
              parentCompanyMasterID: company,
              status: {
                [Sequelize.Op.in]: [0, 1],
              },
            }
          : {
              parentCompanyMasterID:
                +employee.companyMaster.parentCompanyMasterID,
              status: {
                [Sequelize.Op.in]: [0, 1],
              },
            };

      const findCompanys = await CompanyMaster.findAll({
        raw: true,
        where: companyCodition,
        attributes: ['companyMasterID'],
      });

      AllcompanyIds = [
        ...findCompanys.map((e) => e.companyMasterID),
        employee.companyMaster.parentCompanyMasterID != 0
          ? +employee.companyMaster.parentCompanyMasterID
          : company,
      ];
    }

    // execute code

    if (employeeCodeType && executeCode == true) {
      if (employeeCodeType == 'auto') {
        let employees = await executeQuery(
          `  
       select * from "employeeJoiningDetails" as empj left OUTER join "userMasters" as um on empj."userMasterID" = um."userMasterID" where um."companyMasterId" in (` +
            AllcompanyIds +
            `) and um.status in (0,1) and empj."employeeCode"~ '^[0-9]+$' ORDER BY (empj."employeeCode" :: BIGINT)  DESC LIMIT 1  `
        );

        let code = employees[0] ? Number(employees[0].employeeCode) + 1 : 1;

        employeeCode = code.toString();
      } else if (employeeCodeType == 'pattern') {
        let pattern = employee.companyMaster.employeeCodePattern;
        let joiningdate = joiningDate.slice(0, 4) + joiningDate.slice(5, 7);

        let code1 = pattern.concat(joiningdate);
        const patternLength = pattern.length + 7;
        let employees = await executeQuery(
          `SELECT MAX(CAST(SUBSTRING("employeeCode" FROM ${patternLength}) AS INTEGER)) AS maxindex
      FROM "employeeJoiningDetails" as empj left OUTER join "userMasters" as um on empj."userMasterID" = um."userMasterID"
      WHERE um."companyMasterId" in (` +
            AllcompanyIds +
            `) and um.status in (0,1) and "employeeCode" LIKE '${code1}%'`
        );

        // let employees = await executeQuery(
        //   ` select * from "employeeJoiningDetails" as empj left OUTER join "userMasters" as um on empj."userMasterID" = um."userMasterID" where um."companyMasterId" in (` +
        //   AllcompanyIds +
        //   `) and um.status in (0,1) and empj."employeeCode" ILIKE '` +
        //   code1 +
        //   `%' ORDER BY empj."createdAt" DESC LIMIT 1 `
        // );

        let uniquePart;
        if (employees.length && employees[0].maxindex) {
          // let code2 = employees[0].maxindex;
          uniquePart = +employees[0].maxindex;
        } else {
          uniquePart = 0;
        }

        let f_uniquePart = Number(uniquePart) + 1;
        let f_uniquePart1 =
          Number(f_uniquePart) < 10 ? '0' + f_uniquePart : Number(f_uniquePart);

        employeeCode = code1.toString() + f_uniquePart1.toString();
      } else {
        employeeCode = req.body.employeeCode;
      }
    }

    // To check same employee Code is present in company or not

    if (employeeCode) {
      const find_SameData = await EmployeeJoiningDetails.findOne({
        where: Sequelize.and(
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('employeeCode'))
            ),
            String(employeeCode).trim().toLowerCase()
          ),
          Sequelize.where(
            sequelize.col('employeeJoiningDetails.userMasterID'),
            {
              [Sequelize.Op.ne]: req.body.userMasterID,
            }
          )
        ),
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: { [Sequelize.Op.in]: AllcompanyIds },
              status: [0, 1],
            },
            attributes: [],
          },
        ],
      });

      if (find_SameData) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message:
            'An employee with the same Employee Code already exists in the company.',
        });
      }
    }
    const duplicateDocument = await UserDocument.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
        documentListID: [1, 2],
      },
      raw: true,
    });
    const findPanCard =
      duplicateDocument.find((e) => e.documentListID == 2) || null;
    const findAadharCard =
      duplicateDocument.find((e) => e.documentListID == 1) || null;
    if (emp_Joining) {
      if (adharPhoto == '') {
        adharPhoto = emp_Joining.adharPhoto;
      }
      if (!req.body.adharCard && findAadharCard) {
        adharPhoto = null;
      }

      if (panPhoto == '') {
        panPhoto = emp_Joining.panPhoto;
      }
      if (!req.body.pancard && findPanCard) {
        panPhoto = null;
      }
      await EmployeeJoiningDetails.update(
        {
          employeeCode: employeeCode,
          AccountMasterId: req.body.AccountMasterId,
          dob: req.body.dob,
          joiningDate: req.body.joiningDate,
          leavingDate: req.body.leavingDate,
          esicNumber: req.body.esicNumber,
          pfNumber: req.body.pfNumber,
          uanNumber: req.body.uanNumber,
          bankMasterID: req.body.bankMasterID,
          bankIFSC: req.body.bankIFSC,
          bankAccountNo: req.body.bankAccountNo,
          retirementAge: req.body.retirementAge,
          retirementDate: req.body.retirementDate,
          noticePeriod: req.body.noticePeriod,
          applicableDate: req.body.applicableDate,
          endDate: req.body.endDate,
          salarytype: req.body.salarytype,
          biometricCode: req.body.biometricCode,
          salaryCalculationAct: req.body.salaryCalculationAct,
          biometricSerialNo: req.body.biometricSerialNo,
          overtime: req.body.overtime,
          employment: req.body.employment,
          esicEndMonth: req.body.esicEndMonth,
          pfjoiningDate: req.body.pfjoiningDate,
          pfbankMasterID: req.body.pfbankMasterID,
          pfbankIFSC: req.body.pfbankIFSC,
          pfbankAccountNo: req.body.pfbankAccountNo,
          esicjoiningDate: req.body.esicjoiningDate,
          bloodgroup: req.body.bloodgroup,
          nationality: req.body.nationality,
          updateBy: createBy,
          updateByIp: createByIp,
          attendanceFrom,
          fullMonthPresence,
          nameAsBank: req.body.nameAsBank,
          employeeType,
          bankBranchID:
            bankBranchID &&
            bankBranchID != 'null' &&
            bankBranchID != 'undefined'
              ? bankBranchID
              : null,
          contractorId: employment == 'Contract' ? contractorId : null,
          payrollFrequency:
            req.body.payrollFrequency || PayrollFrequencyType.MONTHLY,
          adharCard: req.body.adharCard,
          adharName: req.body.adharName,
          pancard: req.body.pancard,
          panPhoto: panPhoto,
          adharPhoto: adharPhoto,
        },
        {
          where: { userMasterID: userMasterID },
        },
        { transaction }
      );

      if (findAadharCard) {
        await UserDocument.update(
          {
            updateBy: createBy,
            updateByIp: createByIp,
            verifyStatus: 1,
            documentNumber: req.body.adharCard ? req.body.adharCard : null,
            nameOnDocument: req.body.adharName ? req.body.adharName : null,
          },
          {
            where: { userDocumentID: findAadharCard.userDocumentID },
            transaction,
          }
        );
      } else if (
        (req.body.adharCard || req.body.adharName) &&
        !findAadharCard
      ) {
        await UserDocument.create(
          {
            userMasterID,
            documentListID: 1,
            createBy,
            createByIp,
            verifyStatus: 1,
            verifyBy: createBy,
            documentNumber: req.body.adharCard ? req.body.adharCard : null,
            nameOnDocument: req.body.adharName ? req.body.adharName : null,
          },
          { transaction }
        );
      }

      if (findPanCard) {
        await UserDocument.update(
          {
            updateBy: createBy,
            updateByIp: createByIp,
            verifyStatus: 1,
            documentNumber: req.body.pancard,
          },
          {
            where: { userDocumentID: findPanCard.userDocumentID },
            transaction,
          }
        );
      } else if (req.body.pancard && !findPanCard) {
        await UserDocument.create(
          {
            userMasterID,
            documentListID: 2,
            createBy,
            createByIp,
            verifyStatus: 1,
            verifyBy: createBy,
            documentNumber: req.body.pancard,
          },
          { transaction }
        );
      }
    } else {
      await EmployeeJoiningDetails.create(
        {
          userMasterID: req.body.userMasterID,
          employeeCode: employeeCode,
          AccountMasterId: req.body.AccountMasterId,
          dob: req.body.dob,
          joiningDate: req.body.joiningDate,
          leavingDate: req.body.leavingDate,
          esicNumber: req.body.esicNumber,
          pfNumber: req.body.pfNumber,
          uanNumber: req.body.uanNumber,
          bankMasterID: req.body.bankMasterID,
          bankIFSC: req.body.bankIFSC,
          bankAccountNo: req.body.bankAccountNo,
          retirementAge: req.body.retirementAge,
          retirementDate: req.body.retirementDate,
          noticePeriod: req.body.noticePeriod,
          applicableDate: req.body.applicableDate,
          endDate: req.body.endDate,
          salarytype: req.body.salarytype,
          biometricCode: req.body.biometricCode,
          salaryCalculationAct: req.body.salaryCalculationAct,
          biometricSerialNo: req.body.biometricSerialNo,
          overtime: req.body.overtime,
          employment: req.body.employment,
          esicEndMonth: req.body.esicEndMonth,
          pfjoiningDate: req.body.pfjoiningDate,
          pfbankMasterID: req.body.pfbankMasterID,
          pfbankIFSC: req.body.pfbankIFSC,
          pfbankAccountNo: req.body.pfbankAccountNo,
          esicjoiningDate: req.body.esicjoiningDate,
          bloodgroup: req.body.bloodgroup,
          nationality: req.body.nationality,
          createBy,
          createByIp,
          attendanceFrom,
          fullMonthPresence,
          nameAsBank: req.body.nameAsBank,
          employeeType,
          bankBranchID:
            bankBranchID &&
            bankBranchID != 'null' &&
            bankBranchID != 'undefined'
              ? bankBranchID
              : null,
          contractorId: employment == 'Contract' ? contractorId : null,
          payrollFrequency:
            req.body.payrollFrequency || PayrollFrequencyType.MONTHLY,
          adharCard: req.body.adharCard,
          adharName: req.body.adharName,
          pancard: req.body.pancard,
          panPhoto: panPhoto,
          adharPhoto: adharPhoto,
        },
        { transaction }
      );
      const duplicateDocument = await UserDocument.findAll({
        where: {
          userMasterID: userMasterID,
          status: 1,
          documentListID: [1, 2],
        },
        raw: true,
      });
      if (findAadharCard) {
        await UserDocument.update(
          {
            updateBy: createBy,
            updateByIp: createByIp,
            verifyStatus: 1,
            documentNumber: req.body.adharCard ? req.body.adharCard : null,
            nameOnDocument: req.body.adharName ? req.body.adharName : null,
          },
          {
            where: { userDocumentID: findAadharCard.userDocumentID },
            transaction,
          }
        );
      } else if (
        (req.body.adharCard || req.body.adharName) &&
        !findAadharCard
      ) {
        await UserDocument.create(
          {
            userMasterID,
            documentListID: 1,
            createBy,
            createByIp,
            verifyStatus: 1,
            verifyBy: createBy,
            documentNumber: req.body.adharCard ? req.body.adharCard : null,
            nameOnDocument: req.body.adharName ? req.body.adharName : null,
          },
          { transaction }
        );
      }

      if (findPanCard) {
        await UserDocument.update(
          {
            updateBy: createBy,
            updateByIp: createByIp,
            verifyStatus: 1,
            documentNumber: req.body.pancard ? req.body.pancard : null,
          },
          {
            where: { userDocumentID: findPanCard.userDocumentID },
            transaction,
          }
        );
      } else if (req.body.pancard && !findPanCard) {
        await UserDocument.create(
          {
            userMasterID,
            documentListID: 2,
            createBy,
            createByIp,
            verifyStatus: 1,
            verifyBy: createBy,
            documentNumber: req.body.pancard ? req.body.pancard : null,
          },
          { transaction }
        );
      }
    }

    if (employment && applicableDate) {
      if (!endDate) {
        endDate = null;
      }

      const find_employee = await EmployeeEmployement.findOne(
        {
          where: {
            userMasterID: req.body.userMasterID,
            employeement: employment,
            status: 1,
          },
        },
        { transaction }
      );

      if (find_employee) {
        await EmployeeEmployement.update(
          {
            applicableDate: new Date(req.body.applicableDate),
            endDate: req.body.endDate ? new Date(req.body.endDate) : null,
            employeement: employment,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userMasterID: userMasterID, employeement: employment },
          },
          { transaction }
        );
      } else {
        await EmployeeEmployement.create(
          {
            userMasterID,
            applicableDate: new Date(req.body.applicableDate),
            endDate: req.body.endDate ? new Date(req.body.endDate) : null,
            employeement: employment,
            createBy,
            createByIp,
          },
          { transaction }
        );
      }
    }

    const findSkillCategory = await EmployeeSkillCategory.findOne({
      where: {
        userMasterID,
      },
    });

    if (req.body.skillCategory && !findSkillCategory) {
      const joiningMonth =
        String(req.body.joiningDate).slice(0, 4) +
        String(req.body.joiningDate).slice(5, 7);

      await EmployeeSkillCategory.create(
        {
          userMasterID,
          skillCategory: req.body.skillCategory,
          applicableYYYYMM: +joiningMonth,
        },
        {
          transaction,
          user: req.userDetails,
        }
      );
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.empJoiningAdd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.addpanphoto = async (req, res, next) => {
  try {
    let { userMasterID } = await req.body;

    let panPhoto;

    if (req.file) {
      panPhoto = req.file.filename;
    }

    let insert = await EmployeeJoiningDetails.update(
      {
        panPhoto,
      },
      {
        where: {
          userMasterID: userMasterID,
        },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.empJoiningAdd,
      data: insert,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeMasterid
 *
 * @param {id} userMasterID  to fetch employee penalty
 */

exports.getEmployeeJoiningDetByuserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeJoiningDetails.findOne({
      where: {
        userMasterID: req.params.id,
      },
      include: [
        {
          required: true,
          model: UserMaster,
          include: [
            { model: companyMaster, attributes: ['employeeCodeType'] },
            { required: false, model: EmployeeSkillCategory },
          ],
        },
        { model: BankMaster },
      ],
    });

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const YYYYMM = String(date).slice(0, 4) + String(date).slice(5, 7);

    const skillCategory = [
      ...get_one_data.userMaster.employeeSkillCategories,
    ].sort((a, b) => +a.applicableYYYYMM - +b.applicableYYYYMM);

    const currentSkillCategory = skillCategory.find(
      (e) =>
        +e.applicableYYYYMM <= +YYYYMM &&
        (+e.endYYYYMM >= +YYYYMM || !e.endYYYYMM)
    );

    return res.status(200).json({
      status: 200,
      data: get_one_data,
      skillCategory: skillCategory[0]?.skillCategory || null,
      currentSkillCategory: (
        currentSkillCategory?.skillCategory || ''
      ).toUpperCase(),
      disable: skillCategory.length ? true : false,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeejoiningdetail id
 *
 * @param {id}  EmployeeJoininDetailId  to fetch employee Joining Detail
 */

exports.getEmployeeJoiningDetBydetailId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeePenalty.findOne({
      where: {
        EmployeeJoiningDetailId: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 404, message: message.usermessage.dataNotFound });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id}  UpdateEmployeeJoiningDetails  to update id
 */
exports.postUpdateEmployeeJoiningDetail = async (req, res, next) => {
  try {
    let {
      userMasterID,

      AccountMasterId,
      dob,
      joiningDate,
      leavingDate,
      adharCard,
      esicNumber,
      esicEndMonth,
      pfNumber,
      uanNumber,
      pancard,
      bankMasterID,
      bankIFSC,
      bankAccountNo,
      retirementAge,
      retirementDate,
      noticePeriod,
      applicableDate,
      endDate,
      biometricCode,
      salaryCalculationAct,
      biometricSerialNo,
      overtime,
      salarytype,
      employment,
      updateBy,
      updateByIp,
    } = await req.body;

    let employeeCode;

    let change_data_status;

    let employee = await UserMaster.findOne({
      where: {
        userMasterID: req.body.userMasterID,
        status: {
          [Sequelize.Op.in]: ['0', '1'],
        },
      },
      include: [{ all: true, nested: true }],
    });

    let empCodePattern = employee.companyMaster.employeeCodePattern;

    if (empCodePattern != null && empCodePattern != '') {
      let employees = await EmployeeJoiningDetails.findAll({
        where: {
          '$userMaster.companyMasterId$': employee.companyMasterId,
          employeeCode: {
            [Sequelize.Op.ne]: null,
          },
        },
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });

      let empjoining1 = [];
      for (var i = 0; i < employees.length; i++) {
        let year = employees[i].joiningDate.slice(0, 4);
        let month = employees[i].joiningDate.slice(5, 7);

        let empjoining = year.concat(month);
        empjoining1.push(empjoining);
      }

      let year = joiningDate.slice(0, 4);
      let month = joiningDate.slice(5, 7);

      let empjoining = year.concat(month);

      let count = empjoining1.filter((obj) => {
        if (obj == empjoining) {
          return true;
        }

        return false;
      }).length;

      if (count < 9) {
        let empcode1 = empjoining.concat('0' + (count + 1));

        employeeCode = empCodePattern + empcode1;
      } else {
        let empcode1 = empjoining.concat(count + 1);

        employeeCode = empCodePattern + empcode1;
      }
    } else {
      employeeCode = '';
    }

    change_data_status = await EmployeeJoiningDetails.update(
      {
        employeeCode: employeeCode,
        AccountMasterId,
        dob,
        joiningDate,
        leavingDate,
        adharCard,
        esicNumber,
        esicEndMonth,
        pfNumber,
        uanNumber,
        pancard,
        bankMasterID,
        bankIFSC,
        bankAccountNo,
        retirementAge,
        retirementDate,
        noticePeriod,
        applicableDate,
        endDate,
        biometricCode: biometricCode,
        salaryCalculationAct,
        biometricSerialNo,
        overtime,
        salarytype,
        employment,
        updateBy,
        updateByIp,
      },
      {
        where: { userMasterID: userMasterID },
      }
    );

    if (employment && applicableDate) {
      let find_employee = await EmployeeEmployement.findOne({
        where: {
          userMasterID: req.body.userMasterID,
          employeement: employment,
          status: 1,
        },
      });

      if (!endDate) {
        endDate = null;
      }

      if (find_employee) {
        change_data_status = await EmployeeEmployement.update(
          {
            applicableDate,
            endDate,
            employeement: employment,
            updateBy,
            updateByIp,
          },
          {
            where: { userMasterID: userMasterID, employeement: employment },
          }
        );
      } else {
        insert_db_employement = await EmployeeEmployement.create({
          userMasterID,
          applicableDate,
          endDate,
          employeement: employment,
          createBy: updateBy,
          createByIp: updateByIp,
        });
      }
    }

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.empJoiningUpdate });
    return change_data_status;
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} employeeJoiningDetails  to update status of employee penalty
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { EmployeeJoiningDetailId, status } = await req.body;
    let delete_status;
    await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeeJoiningDetails.update(
          {
            status: '1',
          },
          {
            where: {
              EmployeeJoiningDetailId: EmployeeJoiningDetailId,
              status: ['1', '0'],
            },
          }
        );
      } else {
        delete_status = await EmployeeJoiningDetails.update(
          {
            status: '0',
          },
          {
            where: {
              EmployeeJoiningDetailId: EmployeeJoiningDetailId,
              status: ['1', '0'],
            },
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.empJoiningDelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.joiningExcel = async (req, res, next) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    function ExcelDateToJSDate(date) {
      return new Date(Math.round((date - 25569) * 86400 * 1000));
    }
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let userContacts = [];
      rows.forEach((row) => {
        let CompanyContact2 = {
          pancard: row[1],
          esicNumber: row[2],
          uanNumber: row[3],
          joiningDate: ExcelDateToJSDate(row[4]),
          dob: ExcelDateToJSDate(row[5]),
          adharCard: row[6],
          pfNumber: row[7],
          userNumber: row[8],
        };
        userContacts.push(CompanyContact2);
      });

      let data = [];
      let alreadyjoin = [];
      for (i = 0; i < userContacts.length; i++) {
        let mobile_number = await UserMaster.findOne({
          where: {
            userNumber: String(userContacts[i].userNumber),
          },
        });

        if (mobile_number) {
          let joining = await EmployeeJoiningDetails.findOne({
            where: {
              userMasterID: mobile_number.userMasterID,
            },
          });

          if (joining) {
            alreadyjoin.push(userContacts[i].userNumber);
          } else {
            var d = new Date(userContacts[i].joiningDate);
            var year = d.getFullYear();
            var month = d.getMonth();
            var day = d.getDate();
            var c = new Date(year + 58, month, day);

            userContacts[i].userMasterID = mobile_number.userMasterID;
            userContacts[i].bankMasterID = 2;
            userContacts[i].retirementAge = 58;
            userContacts[i].retirementDate = c;
            userContacts[i].status = 1;
            userContacts[i].createBy = 1;
            data.push(userContacts[i]);
          }
        }
      }

      if (data.length > 0) {
        EmployeeJoiningDetails.bulkCreate(data).then(async () => {});
      }

      return res.status(200).json({
        status: 200,
        message: 'Data Added Successfully.',
        remaingemployee: alreadyjoin,
      });
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAllEMPList = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, companyMasterID } = await req.body;

    const paginationQuery = {};
    const condition = {};

    condition.status = 1;

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (companyMasterID) {
      condition.companyMasterId = companyMasterID;
      req.userDetails.accessibleCompanies = companyMasterID;
    }

    if (userMasterID) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    }

    const { rows: company_contact, count } = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false),
      attributes: [
        'userMasterID',
        'displayName',
        'userNumber',
        'photo',
        'companyMasterId',
        'gender',
        'facePhoto',
        'email',
      ],
      order: [['displayName', 'ASC']],
    });

    const currentdate = new Date().toISOString().slice(0, 10);

    for (let i = 0; i < company_contact.length; i++) {
      let attendancetransaction = await AttendanceTransaction.findOne({
        raw: true,
        where: {
          userMasterID: company_contact[i].userMasterID,
          AttendanceDate: {
            [Sequelize.Op.between]: [currentdate, currentdate],
          },
        },
        attributes: [
          'InDatetime',
          'OutDateTime',
          'AttendanceDate',
          'fulldayhalfday',
        ],
      });

      if (attendancetransaction) {
        let attendance =
          attendancetransaction.fulldayhalfday == 1
            ? 'Present'
            : attendancetransaction.fulldayhalfday == 0.5
              ? 'Half Day'
              : attendancetransaction.fulldayhalfday == 0
                ? 'Absent'
                : currentdate == attendancetransaction.AttendanceDate
                  ? 'Present'
                  : 'Absent';

        company_contact[i]['InDatetime'] = attendancetransaction.InDatetime;
        company_contact[i]['OutDateTime'] = attendancetransaction.OutDateTime;
        company_contact[i]['AttendanceDate'] =
          attendancetransaction.AttendanceDate;
        company_contact[i]['fulldayhalfday'] =
          attendancetransaction.fulldayhalfday
            ? Number(attendancetransaction.fulldayhalfday)
            : null;

        company_contact[i]['attendanceStatus'] = attendance;
      } else {
        company_contact[i]['InDatetime'] = '';
        company_contact[i]['OutDateTime'] = '';
        company_contact[i]['AttendanceDate'] = '';
        company_contact[i]['fulldayhalfday'] = '';
        company_contact[i]['attendanceStatus'] = '';
      }

      let empJoining;
      empJoining = await EmployeeJoiningDetails.findOne({
        raw: true,
        where: {
          userMasterID: company_contact[i].userMasterID,
          status: 1,
        },
        attributes: [
          'employeeCode',
          'employment',
          'joiningDate',
          'dob',
          'biometricCode',
          'biometricSerialNo',
        ],
      });

      if (empJoining) {
        company_contact[i].empJoining = {
          employeeCode: empJoining.employeeCode ? empJoining.employeeCode : '',
          employment: empJoining.employment ? empJoining.employment : '',
          joiningDate: empJoining.joiningDate ? empJoining.joiningDate : '',
          dob: empJoining.dob ? empJoining.dob : '',
          biometricCode: empJoining.biometricCode
            ? empJoining.biometricCode
            : '',
          biometricSerialNo: empJoining.biometricSerialNo
            ? empJoining.biometricSerialNo
            : '',
        };
      }

      const branch = await employeeBranch(
        company_contact[i].userMasterID,
        new Date()
      );

      if (branch) {
        company_contact[i].branchName = branch['branchMaster.branchName'];
      }

      let companyName;
      companyName = await CompanyMaster.findOne({
        raw: true,
        where: {
          companyMasterID: company_contact[i].companyMasterId,
          status: 1,
        },
        attributes: ['companyMasterID', 'companyName'],
      });
      if (companyName) {
        company_contact[i].companyMasterId = companyName;
      }

      const department = await employeeDepartment(
        company_contact[i].userMasterID,
        new Date()
      );
      if (department) {
        company_contact[i].departmentName =
          department['department.departmentName'];
      }

      const designation = await employeeDesignation(
        company_contact[i].userMasterID,
        new Date()
      );

      if (designation) {
        company_contact[i].designationName =
          designation['designation.designationName'];
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'User got Successfully',
      data: company_contact,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.employeeIdCard = async (req, res, next) => {
  try {
    const {
      userMasterID,
      companyMasterID,
      page,
      limit,
      branchMasterID,
      idCardType,
      orderBy,
    } = req.body;

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let order = [];
    if (orderBy) {
      if (orderBy == 'displayName') order = [['displayName', 'ASC']];
      // if (orderBy == 'employeeCode') order = [[sequelize.literal('"employeeJoiningDetails"."employeeCode"'), 'ASC']]
      if (orderBy == 'joiningDate')
        order = [
          [sequelize.literal(`"employeeJoiningDetails.joiningDate"`), 'ASC'],
        ];
    }

    const paginateCondition = {};
    if (page && limit) {
      paginateCondition.offset = (page - 1) * limit;
      paginateCondition.limit = limit;
    }

    let branchIds = [];
    if (branchMasterID) {
      branchIds.push(branchMasterID);
    } else {
      // branch wise role
      if (req.userDetails && req.userDetails.role) {
        if (req.userDetails.role.roleType == roleType.BRANCH_WISE) {
          branchIds = [...req.userDetails.accessibleBranches];
        }
      }
    }

    const { rows: AllUsersData, count: totalcount } =
      await UserMaster.findAndCountAll({
        distinct: true,
        where: {
          [Sequelize.Op.or]: [
            {
              deactiveDate: { [Sequelize.Op.gte]: date },
            },
            {
              deactiveDate: { [Sequelize.Op.eq]: null },
            },
          ],
          status: 1,
          ...(companyMasterID && { companyMasterId: companyMasterID }),
          ...(userMasterID && { userMasterID: userMasterID }),
        },
        ...accessibleUsers(req.userDetails, false, false),
        ...paginateCondition,
        subQuery: false,
        include: [
          {
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
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
              ...(branchIds && branchIds.length > 0 && { branchID: branchIds }),
              applicableDate: { [Sequelize.Op.lte]: new Date(date) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: branchIds && branchIds.length ? true : false,
            attributes: ['branchID'],
            include: [
              {
                model: BranchMaster,
                as: 'branchMaster',
                attributes: ['branchName', 'branchAddress'],
              },
            ],
          },
          {
            model: EmployeeJoiningDetails,
            where: {
              [Sequelize.Op.or]: [
                {
                  leavingDate: { [Sequelize.Op.gte]: date },
                },
                {
                  leavingDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
            attributes: ['dob', 'joiningDate', 'employeeCode', 'bloodgroup'],
            required: true,
          },
          // hasmany
          {
            model: UserAddress,
            attributes: ['houseNumber', 'houseName', 'landmark', 'zipcode'],
            where: {
              status: 1,
              verifyStatus: 1,
              addressType: 'permanent',
            },
            include: [{ model: CityMaster, attributes: ['cityName'] }],
            required: false,
          },
          //hasMany
          {
            model: EmployeeDigitalSignature,
            attributes: ['signature'],
            order: [['employeeDigitalSignatureID', 'DESC']],
            where: {
              status: 1,
            },
            required: false,
          },
          {
            model: companyMaster,
          },
        ],
        attributes: [
          'userMasterID',
          'displayName',
          'photo',
          'firstName',
          'lastName',
          'userNumber',
          'otherContactNumber',
        ],
        order,
      });

    let finalArray = [];

    for (const userData of AllUsersData) {
      const joiningDetails =
        userData.employeeJoiningDetails &&
        userData.employeeJoiningDetails.length > 0
          ? userData.employeeJoiningDetails[0]
          : null;
      const branchDetails =
        userData.employeeBranches && userData.employeeBranches.length > 0
          ? userData.employeeBranches[0]
          : null;
      const departmentDetails =
        userData.employeeDepartments && userData.employeeDepartments.length > 0
          ? userData.employeeDepartments[0]
          : null;
      const designationDetails =
        userData.employeeDesignations &&
        userData.employeeDesignations.length > 0
          ? userData.employeeDesignations[0]
          : null;
      const userAddress =
        userData.userAddresses && userData.userAddresses.length > 0
          ? userData.userAddresses[0]
          : null;
      const userSignature =
        userData.employeeDigitalSignatures &&
        userData.employeeDigitalSignatures.length > 0
          ? userData.employeeDigitalSignatures[0]
          : null;
      const userCompany = userData.companyMaster
        ? userData.companyMaster
        : null;

      let idCardData = {
        employeeCode: joiningDetails ? joiningDetails.employeeCode : '',
        companyLogo: userCompany ? userCompany.companyLogo : '',
        companyName: userCompany ? userCompany.companyName : '',
        companyNameLength: userCompany
          ? userCompany.companyName.length >= 24
          : false,

        companyAddress:
          branchDetails &&
          branchDetails.branchMaster &&
          branchDetails.branchMaster.branchAddress
            ? branchDetails.branchMaster.branchAddress
            : userCompany
              ? userCompany.companyAddress
              : '',
        authorizedSignature: userCompany ? userCompany.authorizedSignature : '',
        userPhoto: userData.photo,
        profilePicName:
          userData.firstName && userData.lastName
            ? `${userData.firstName.charAt(0)}${userData.lastName.charAt(
                0
              )}`.toUpperCase()
            : '',
        userFirstName: userData.firstName || ' ',
        userDisplayName: userData.displayName || '',
        userLastName: userData.lastName || ' ',
        userNumber: userData.userNumber || ' ',
        otherContactNumber: userData.otherContactNumber || ' ',
        designationName:
          designationDetails && designationDetails.designation
            ? designationDetails.designation.designationName
            : ' ',

        departmentName:
          departmentDetails && departmentDetails.department
            ? departmentDetails.department.departmentName
            : ' ',
        branchName:
          branchDetails && branchDetails.branchMaster
            ? branchDetails.branchMaster.branchName
            : '',

        joiningDate:
          joiningDetails && joiningDetails.joiningDate
            ? moment(joiningDetails.joiningDate).format('DD-MM-YYYY')
            : '',
        dob:
          joiningDetails && joiningDetails.dob
            ? moment(joiningDetails.dob).format('DD-MM-YYYY')
            : '',
        bloodgroup: joiningDetails ? joiningDetails.bloodgroup : ' ',
        houseNumber: userAddress ? userAddress.houseNumber : '',
        houseName: userAddress ? userAddress.houseName : '',
        landmark: userAddress ? userAddress.landmark : '',
        cityName:
          userAddress && userAddress.cityMaster
            ? userAddress.cityMaster.cityName
            : '',
        zipcode: userAddress ? userAddress.zipcode : '',
        userSignature: userSignature ? userSignature.signature : '',
        companyContactNo: userCompany ? userCompany.cpMobileNo : '',
      };

      finalArray.push({
        userId: userData.userMasterID,
        displayName: userData.displayName,
        idCardData,
        ApiURL: mainApiUrl,
      });
    }

    // for (const userId of userIdArray) {
    //   let employeeDesignationDetails =
    //     (await employeeDesignation(userId, new Date())) || {};
    //   let employeeDepartmentDetails =
    //     (await employeeDepartment(userId, new Date())) || {};
    //   let employeeDetailsDetails = (await userDetails(userId)) || {};
    //   let employeejoinningDetails =
    //     (await getemployeeJoiningDetails(userId)) || {};
    //   let employeeUserAddreessDetails =
    //     (await getEmployeeAddress(userId)) || {};
    //   let employeeUserDigitalSignatureDetails =
    //     (await getEmployeeDigitalSignature(userId)) || {};
    //   let employee_Branch = (await employeeBranch(userId, new Date())) || {};

    //   let idCardData = {
    //     employeeCode: employeejoinningDetails['employeeCode'] || null,
    //     companyLogo: employeeDetailsDetails['companyMaster.companyLogo'],
    //     companyName:
    //       employeeDetailsDetails['companyMaster.companyName'] || ' ',
    //     companyNameLength:
    //       employeeDetailsDetails['companyMaster.companyName'].length >= 24,
    //     // companyAddress:
    //     //   employeeDetailsDetails['companyMaster.companyAddress'] || ' ',
    //     companyAddress: employee_Branch['branchMaster.branchAddress']
    //       ? employee_Branch['branchMaster.branchAddress']
    //       : employeeDetailsDetails['companyMaster.companyAddress']
    //         ? employeeDetailsDetails['companyMaster.companyAddress']
    //         : '',
    //     authorizedSignature:
    //       employeeDetailsDetails['companyMaster.authorizedSignature'],
    //     userPhoto: employeeDetailsDetails['photo'],
    //     profilePicName:
    //       employeeDetailsDetails['firstName'] &&
    //         employeeDetailsDetails['lastName']
    //         ? `${employeeDetailsDetails['firstName'].charAt(
    //           0
    //         )}${employeeDetailsDetails['lastName'].charAt(0)}`.toUpperCase()
    //         : '',
    //     userFirstName: employeeDetailsDetails['firstName'] || ' ',
    //     userLastName: employeeDetailsDetails['lastName'] || ' ',
    //     userNumber: employeeDetailsDetails['userNumber'] || ' ',
    //     otherContactNumber:
    //       employeeDetailsDetails['otherContactNumber'] || ' ',
    //     designationName:
    //       employeeDesignationDetails['designation.designationName'] || ' ',
    //     departmentName:
    //       employeeDepartmentDetails['department.departmentName'] || ' ',
    //     joiningDate: employeejoinningDetails['joiningDate']
    //       ? moment(employeejoinningDetails['joiningDate']).format(
    //         'DD-MM-YYYY'
    //       )
    //       : '',
    //     dob: employeejoinningDetails['dob']
    //       ? moment(employeejoinningDetails['dob']).format('DD-MM-YYYY')
    //       : '',
    //     bloodgroup: employeejoinningDetails['bloodgroup'] || ' ',
    //     houseNumber: employeeUserAddreessDetails['houseNumber'],
    //     houseName: employeeUserAddreessDetails['houseName'],
    //     landmark: employeeUserAddreessDetails['landmark'],
    //     cityName: employeeUserAddreessDetails['cityMaster.cityName'],
    //     zipcode: employeeUserAddreessDetails['zipcode'],
    //     userSignature: employeeUserDigitalSignatureDetails['signature'],
    //     companyContactNo: employeeDetailsDetails['companyMaster.cpMobileNo'],
    //   };

    //   finalArray.push({
    //     userId,
    //     displayName: employeeDetailsDetails.displayName,
    //     idCardData,
    //   });
    // }

    const getTemplate = (type) => {
      const file = path.join(__dirname, `../html/${type}.html`);
      return file;
    };

    Handlebars.registerHelper({
      eq: (v1, v2) => v1 === v2,
      ne: (v1, v2) => v1 !== v2,
      lt: (v1, v2) => v1 < v2,
      gt: (v1, v2) => v1 > v2,
      lte: (v1, v2) => v1 <= v2,
      gte: (v1, v2) => v1 >= v2,
      and() {
        return Array.prototype.every.call(arguments, Boolean);
      },
      or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
    });

    const readFile = (name) => {
      return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf-8', (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };
    const data = {
      tempData: finalArray,
      appURL: appURL,
    };
    const filePath = await getTemplate(idCardType);

    const file = await readFile(filePath);
    const template = Handlebars.compile(file);
    const htmlContent = template(data);

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
      timeout: 120000,
    });

    const pdfPage = await browser.newPage();

    await pdfPage.setContent(htmlContent);

    let pdfBuffer;
    if (idCardType == 'portraitSingleIdCardForAsoplav') {
      pdfBuffer = await pdfPage.pdf({
        printBackground: true,
        timeout: 120000,
        height: 600,
        width: 399,
      });
    } else if (idCardType == 'portraitSingleIdCard') {
      pdfBuffer = await pdfPage.pdf({
        printBackground: true,
        timeout: 120000,
        height: 470,
        width: 303,
      });
    } else if (
      idCardType == 'landscapeSingleIdCard' ||
      idCardType == 'landscapeSingleIdCardForAsoplav'
    ) {
      pdfBuffer = await pdfPage.pdf({
        printBackground: true,
        timeout: 120000,
        height: 272,
        width: 529,
      });
    } else if (idCardType == 'portraitIdCardForBulkDownload') {
      const idCardDataforBulkDownload = [];
      for (const item of finalArray) {
        const htmlContent = template({ tempData: [item], appURL: appURL });

        const pdfPage = await browser.newPage();
        await pdfPage.setContent(htmlContent);

        const pdfBuffer = await pdfPage.pdf({
          printBackground: true,
          timeout: 120000,
          height: 480,
          width: 303,
        });
        idCardDataforBulkDownload.push({
          displayName: item.displayName || '',
          path: Buffer.from(pdfBuffer).toString('base64'),
        });
      }
      await browser.close();

      return await createZipFileForPortraitidIdCards(
        idCardDataforBulkDownload,
        res
      );
    } else if (idCardType == 'portraitIdCardForAsoplavBulkDownload') {
      const idCardDataforBulkDownload = [];
      for (const item of finalArray) {
        const htmlContent = template({ tempData: [item] });

        const pdfPage = await browser.newPage();
        await pdfPage.setContent(htmlContent);

        const pdfBuffer = await pdfPage.pdf({
          printBackground: true,
          timeout: 120000,
          height: 630,
          width: 399,
        });
        idCardDataforBulkDownload.push({
          displayName: item.displayName || '',
          path: Buffer.from(pdfBuffer).toString('base64'),
        });
      }
      await browser.close();

      return await createZipFileForPortraitidIdCards(
        idCardDataforBulkDownload,
        res
      );
    } else {
      pdfBuffer = await pdfPage.pdf({
        format: 'A4',
        printBackground: true,
        timeout: 120000,
        margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' },
      });
    }

    let jpegBuffer = '';
    let fullIdCardBuffer = '';
    if (AllUsersData.length) {
      if (
        idCardType == 'portraitSingleIdCardForAsoplav' ||
        idCardType == 'portraitSingleIdCard'
      ) {
        fullIdCardBuffer = await pdfPage.screenshot({
          type: 'jpeg',
          quality: 100,
          fullPage: false, // Capture full page
          clip: { x: 0, y: 0, width: 302, height: 480 },
        });
      } else if (idCardType == 'landscapeSingleIdCard') {
        fullIdCardBuffer = await pdfPage.screenshot({
          type: 'jpeg',
          quality: 100,
          fullPage: false,
          clip: { x: 0, y: 0, width: 539, height: 272 },
        });
      } else if (idCardType == 'landscapeSingleIdCardForAsoplav') {
        fullIdCardBuffer = await pdfPage.screenshot({
          type: 'jpeg',
          quality: 100,
          fullPage: false,
          clip: { x: 0, y: 0, width: 540, height: 280 },
        });
      } else if (
        idCardType == 'portraitIdCard' ||
        idCardType == 'portraitIdCardForAsoplav'
      ) {
        jpegBuffer = await pdfPage.screenshot({
          type: 'jpeg',
          quality: 100,
          fullPage: false,
          timeout: 120000,
          clip: { x: 0, y: 28, width: 345, height: 485 },
        });
      } else {
        jpegBuffer = await pdfPage.screenshot({
          type: 'jpeg',
          quality: 100,
          fullPage: false,
          clip: { x: 10, y: 23, width: 540, height: 290 },
        });
      }
    }

    await browser.close();

    let pdfBase64Path = Buffer.from(pdfBuffer).toString('base64');
    let jpegBase64Path = fullIdCardBuffer
      ? fullIdCardBuffer.toString('base64')
      : jpegBuffer.toString('base64');

    return res.status(200).json({
      message: usermessage.fetchMessage('Id Card Data'),
      jpegBase64Path: jpegBase64Path,
      data: pdfBase64Path,
      name:
        AllUsersData.length == 1
          ? `${finalArray[0].displayName}(${
              finalArray[0].idCardData.employeeCode
                ? finalArray[0].idCardData.employeeCode
                : ''
            })`
          : '',
      status: 200,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.profileStatus = async (req, res, next) => {
  try {
    const { userMasterID } = req.query;
    const finaldata = [];

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const month = date.slice(0, 4).concat(date.slice(5, 7));

    const companyMasterId =
      +req.userDetails.parentCompanyMasterId == 0
        ? +req.userDetails.companyMasterId
        : +req.userDetails.parentCompanyMasterId;

    if (!companyMasterId) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('companyMasterId'),
      });
    }

    const checkCompnaySubscription =
      await checkSubscriptionPlanExpiration(companyMasterId);

    if (checkCompnaySubscription.productMasterID != 9) {
      // Salary policy

      const salarypolicy = await employeeSalaryPolicy(userMasterID, date);

      finaldata.push({
        display: salarypolicy ? true : false,
        tabName: 'SALARY POLICY',
      });

      // salary

      const salary = await getSalary(userMasterID, month);

      finaldata.push({
        display: salary ? true : false,
        tabName: 'SALARY STRUCTURE',
      });
    }

    // Address

    const address = await getEmployeeAddress(userMasterID);

    finaldata.push({
      display: address ? true : false,
      tabName: 'ADDRESS',
    });

    // Experience

    const experience = await userExperience(userMasterID);

    finaldata.push({
      display: experience ? true : false,
      tabName: 'EXPERIENCE',
    });

    // Education

    const education = await userEducation(userMasterID);

    finaldata.push({
      display: education ? true : false,
      tabName: 'EDUCATION',
    });

    // Document

    const document = await userDocument(userMasterID);

    finaldata.push({
      display: document ? true : false,
      tabName: 'DOCUMENT',
    });

    // Family

    const family = await userFamily(userMasterID);

    finaldata.push({
      display: family ? true : false,
      tabName: 'FAMILY',
    });

    // Skills

    const skills = await userSkills(userMasterID);

    finaldata.push({
      display: skills ? true : false,
      tabName: 'SKILLS',
    });

    //  Report To

    const reportTo = await userReportTo(userMasterID);

    finaldata.push({
      display: reportTo ? true : false,
      tabName: 'REPORTS TO',
    });

    // Department

    const department = await employeeDepartment(userMasterID, date);

    finaldata.push({
      display: department ? true : false,
      tabName: 'DEPARTMENT',
    });

    // Department

    const branch = await employeeBranch(userMasterID, date);

    finaldata.push({
      display: branch ? true : false,
      tabName: 'BRANCH',
    });

    // Department

    const designation = await employeeDesignation(userMasterID, date);

    finaldata.push({
      display: designation ? true : false,
      tabName: 'DESIGNATION',
    });

    // division

    const division = await employeeDivision(userMasterID, date);

    finaldata.push({
      display: division ? true : false,
      tabName: 'DIVISION',
    });

    // workingArea

    const workingArea = await employeeWorkingArea(userMasterID, date);

    finaldata.push({
      display: workingArea ? true : false,
      tabName: 'WORKING AREA',
    });

    // Shift

    const shift = await employeeShift(userMasterID, date);

    finaldata.push({
      display: shift ? true : false,
      tabName: 'SHIFT',
    });

    // Attendance policy

    const attendance = await employeeAttendancePolicy(userMasterID, date);

    finaldata.push({
      display: attendance ? true : false,
      tabName: 'ATTENDANCE POLICY',
    });

    // Salary policy

    // const salarypolicy = await employeeSalaryPolicy(userMasterID, date);

    // finaldata.push({
    //   display: salarypolicy ? true : false,
    //   tabName: 'SALARY POLICY',
    // });

    // Holiday

    const holiday = await employeeHolidayPolicy(userMasterID, date);

    finaldata.push({
      display: holiday ? true : false,
      tabName: 'HOLIDAY POLICY',
    });

    // Weekoff

    const weekoff = await employeeWeekoffPolicy(userMasterID, date);

    finaldata.push({
      display: weekoff ? true : false,
      tabName: 'WEEKOFF POLICY',
    });

    // company Document

    const companydocument = await companyDocument(userMasterID);

    finaldata.push({
      display: companydocument ? true : false,
      tabName: 'COMPANY DOCUMENT',
    });

    // SIGNATURE

    const sign = await getEmployeeDigitalSignature(userMasterID);

    finaldata.push({
      display: sign ? true : false,
      tabName: 'DIGITAL SIGNATURE',
    });

    // JOINING

    const joining = await getemployeeJoiningDetails(userMasterID);

    finaldata.push({
      display: joining ? true : false,
      tabName: 'EMPLOYEE JOINING DETAILS',
    });

    // salary

    // const salary = await getSalary(userMasterID, month);

    // finaldata.push({
    //   display: salary ? true : false,
    //   tabName: 'SALARY STRUCTURE',
    // });

    // LEAVE

    const leavedata = await leave(userMasterID);

    finaldata.push({
      display: leavedata ? true : false,
      tabName: 'LEAVE OPENING BALANCE',
    });

    //authorization

    const authorizationdata = await authorization(userMasterID);

    finaldata.push({
      display: authorizationdata ? true : false,
      tabName: 'AUTHORIZATION',
    });

    //LATEINEARLY GO POLICY

    const lateInEarlyGoPolicy = await employeeLateEarlyPolicy(
      userMasterID,
      date
    );

    finaldata.push({
      display: lateInEarlyGoPolicy ? true : false,
      tabName: 'LATEINEARLYGOPOLICY',
    });

    let trueCount = 0,
      falseCount = 0;

    finaldata.map((e) => {
      if (e.display == true) {
        trueCount++;
      } else {
        falseCount++;
      }
    });

    res.status(200).json({
      status: 200,
      data: finaldata,
      trueCount: trueCount,
      falseCount: falseCount,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateUserFaces = async (req, res, next) => {
  try {
    let { userMasterID, facePhotoArray } = await req.body;

    const userExists = await UserMaster.findByPk(userMasterID);
    if (!userExists)
      return res
        .status(200)
        .json({ message: usermessage.notFoundMessage('User'), status: 401 });

    let userFaces;
    if (req.files) userFaces = req.files.map((file) => file.filename);
    else
      return res.status(200).json({ message: 'Files not found', status: 401 });

    if (
      userExists.dataValues.userFaces &&
      userExists.dataValues.userFaces.length > 0
    ) {
      for (var item of userExists.dataValues.userFaces) {
        const filePath = path.join(__dirname, `../uploads/user-faces/${item}`);

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
          }
        });
      }
    }
    if (facePhotoArray) facePhotoArray = facePhotoArray.split(',');

    await UserMaster.update(
      {
        userFaces,
        facePhotoArray:
          facePhotoArray && facePhotoArray.length > 0
            ? facePhotoArray
            : userExists.dataValues.facePhotoArray,
      },
      { where: { userMasterID: userMasterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: usermessage.addMessage('User Faces') });
  } catch (err) {
    next(err);
  }
};

exports.removeUserFaces = async (req, res, next) => {
  try {
    let { userMasterID } = await req.body;

    const userExists = await UserMaster.findByPk(userMasterID);
    if (!userExists)
      return res
        .status(200)
        .json({ message: usermessage.notFoundMessage('User'), status: 401 });

    if (
      userExists.dataValues.userFaces &&
      userExists.dataValues.userFaces.length > 0
    ) {
      for (let item of userExists.dataValues.userFaces) {
        const filePath = path.join(__dirname, `../uploads/user-faces/${item}`);

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
          }
        });
      }
    }

    userExists.userFaces = null;
    userExists.facePhotoArray = null;
    userExists.updatedBy = req.userDetails.userMasterId;
    userExists.updatedByIp = req.userDetails.userIpAddress;
    await userExists.save();

    return res
      .status(200)
      .json({ status: 200, message: usermessage.removeMessage('User Faces') });
  } catch (err) {
    next(err);
  }
};
exports.checkUserFaces = async (req, res, next) => {
  try {
    const { userFace, userMasterID } = await req.body;

    const user = await UserMaster.findOne({
      raw: true,
      where: { userMasterID: userMasterID },
      attributes: ['userFaces'],
    });

    let userLogFace = '';
    if (user && user.userFaces && user.userFaces.length != 0) {
      userLogFace = fs.readFileSync(
        path.join(__dirname, `../uploads/user-faces/${user.userFaces[0]}`),
        { encoding: 'base64' }
      );
    } else {
      return res
        .status(200)
        .send({ status: 401, message: 'User face not found!' });
    }

    const Response = await axios.post(
      faceApiUrl,
      {
        old_images_base64: [userFace],
        new_images_base64: [userLogFace],
      },
      {
        timeout: 60000, // Set timeout to 1 minute (60,000 milliseconds)
      }
    );
    return res.status(200).send({ status: 200, data: Response.data });
    // return res.status(200).send({
    //   status: 200,
    //   data: {
    //     match_result: true,
    //   },
    // });
  } catch (err) {
    next(err);
  }
};

exports.getAssignedBiometricUserList = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      branchID,
      departmentID,
      designationID,
      page,
      limit,
      assigned,
      exportData,
    } = req.body;
    let branchIds = branchID ? [branchID] : [];
    if (
      !branchID &&
      req.userDetails &&
      req.userDetails.role &&
      req.userDetails.role.roleType == roleType.BRANCH_WISE
    ) {
      branchIds = req.userDetails.accessibleBranches;
    }
    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.limit = limit;
      paginationQuery.offset = (page - 1) * limit;
    }

    const { rows, count } = await EmployeeJoiningDetails.findAndCountAll({
      distinct: true,
      ...paginationQuery,
      where: {
        biometricCode: {
          [assigned ? Sequelize.Op.ne : Sequelize.Op.eq]: null,
          [assigned ? Sequelize.Op.ne : Sequelize.Op.eq]: '',
        },
      },
      attributes: [
        'joiningDate',
        'employeeJoiningDetailId',
        'userMasterID',
        'biometricCode',
        'biometricSerialNo',
        'employeeCode',
      ],
      include: [
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber', 'userMasterID'],
          where: {
            companyMasterId: companyMasterID,
            status: 1,
          },
          required: true,
          include: [
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                ...(designationID && {
                  designationID: designationID,
                }),
                applicableDate: { [Sequelize.Op.lte]: new Date() },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date() } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: designationID ? true : false,
              attributes: ['designationID', 'applicableDate'],
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
                ...(departmentID && { departmentID: departmentID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date() },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date() } },
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
                ...(isArray(branchIds) &&
                  branchIds.length && { branchID: branchIds }),
                applicableDate: { [Sequelize.Op.lte]: new Date() },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date() } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: branchID ? true : false,
              attributes: ['branchID', 'applicableDate'],
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
              model: CompanyMaster,
              attributes: companyAttributes,
            },
          ],
        },
      ],
    });

    if (exportData) {
      const finalExportData = rows.map((e) => {
        return {
          'Company Name': e.userMaster.companyMaster.companyName,
          'Branch Name':
            e.userMaster?.employeeBranches[0]?.branchMaster?.branchName,
          'Department Name':
            e.userMaster?.employeeDepartments[0]?.department?.departmentName,
          'Designation Name':
            e.userMaster?.employeeDesignations[0]?.designation?.designationName,
          'Employee Name': e.userMaster.displayName,
          'Employee Number': e.userMaster.userNumber,
          'Employee Code': e.employeeCode ? e.employeeCode : '',
          'Biometric Code': e.biometricCode ? e.biometricCode : '',
          'Biometric Serial Number': e.biometricSerialNo
            ? e.biometricSerialNo
            : '',
          'Joining Date': moment(e.joiningDate, 'YYYY-MM-DD').format(
            'DD-MM-YYYY'
          ),
        };
      });
      return await generateExcel(
        finalExportData,
        'Assign Biometric Code to User',
        'xlsx',
        res
      );
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
