/** @format */

const companyMasters = require('../models/companyMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const CityMaster = require('../models/citymaster');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const sequelize = require('../config/database');
const subscriptionPlan = require('../models/subscriptionPlan');
const HRSalaryFieldChild = require('../models/hrSalaryFieldChild');
const HRSalaryFields = require('../models/hrSalaryFields');
const HRLeaveTypes = require('../models/hrLeaveTypes');
const jwt = require('jsonwebtoken');
const RoleMaster = require('../models/roleMaster');
const RolePermission = require('../models/rolePermission');
const ProductPermission = require('../models/productPermission');
const FormMaster = require('../models/formMaster');
const companyMaster = require('../models/companyMaster');

const { generateExcel } = require('../utils/exportData');
const CompanyType = require('../models/companytypeMaster');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const { roleType, companyAccessType } = require('../utils/dbUtils');
const CompanySubscriptionMaster = require('../models/subscriptionPlan');
const Incentivetype = require('../models/incentivetype');
const ProductMaster = require('../models/productMaster');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const Task_Stages = require('../models/tasks_stages');
const CompanyProgress = require('../models/companyProgress');
const AttendancePolicy = require('../models/attendancePolicy');
const Shift = require('../models/shift');
const ShiftTIme = require('../models/shiftTime');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const { userAttributes, companyAttributes } = require('../utils/commonVars');

/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the company.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddCompany = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] == 'null' ||
        !req.body[key] ||
        req.body[key] == 'undefined'
      ) {
        req.body[key] = null;
      }
    }

    let {
      companyName,
      companyAddress,
      companyWebsite,
      companyEmail,
      companyTypeid,
      cpName,
      cpMobileNo,
      cpEmail,
      parentCompanyMasterID,
      subCompanyRequired,
      employeeCodePattern,
      employeeCodeType,
      expenseDatePicker,
      otp,
      status,
      createBy,
      createByIp,
      cityMasterID,
      panNumber,
      tanNumber,
      companyDescription,
      ownerName,
      ownerFatherName,
      tdsdeduction,
      cinNumber,
      fileUploadType,
      setUpTime,
      CompanyServiceStatusID,
    } = await req.body;

    const find_company = await companyMaster.findOne({
      where: {
        parentCompanyMasterID: {
          [Sequelize.Op.ne]: 0,
        },
        companyMasterID: parentCompanyMasterID,
        status: 1,
      },
    });

    if (find_company) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'You can not add child company under child company.',
      });
    }
    const get_one_data = await companyMaster.findOne({
      where: {
        [Sequelize.Op.or]: [
          { companyMasterID: +parentCompanyMasterID },
          { parentCompanyMasterID: +parentCompanyMasterID },
        ],
        [Sequelize.Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.fn('TRIM', Sequelize.col('companyName'))
            ),
            Sequelize.Op.eq,
            companyName.trim().toLowerCase()
          ),
        ],
        status: [0, 1],
      },
    });

    if (get_one_data) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Company With Same name'),
      });
    }
    const employeecodepattern =
      employeeCodeType == 'pattern' ? employeeCodePattern : null;

    expenseDatePicker =
      expenseDatePicker == 'null' || expenseDatePicker == ''
        ? null
        : expenseDatePicker;

    const companyLogo = req.files?.companyLogo
      ? req.files.companyLogo[0].filename
      : '';
    const authorizedSignature = req.files?.authorizedSignature
      ? req.files.authorizedSignature[0].filename
      : '';
    const letterHead = req.files?.letterHead
      ? req.files.letterHead[0].filename
      : '';

    let insert_db_status = await companyMasters.create(
      {
        companyName,
        companyAddress,
        companyLogo,
        companyWebsite,
        companyEmail,
        companyTypeid,
        cpName,
        cpMobileNo,
        cpEmail,
        parentCompanyMasterID,
        subCompanyRequired,
        employeeCodePattern: employeecodepattern,
        employeeCodeType,
        expenseDatePicker,
        otp,
        status,
        createBy,
        createByIp,
        cityMasterID,
        panNumber,
        tanNumber,
        companyDescription,
        authorizedSignature,
        ownerName,
        ownerFatherName,
        tdsdeduction,
        cinNumber,
        fileUploadType,
        setUpTime,
        letterHead,
      },
      { transaction }
    );

    if (parentCompanyMasterID == 0 || !parentCompanyMasterID) {
      //CompanyProgress Data
      console.log('loggg');

      await CompanyProgress.create(
        {
          CompanyServiceStatusID,
          companyMasterID: insert_db_status.companyMasterID,
          // createBy
        },
        { user: req.userDetails, transaction }
      );
    }

    let hrSalaryFieldsArray = [];
    hrSalaryFieldsArray.push(
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 17,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 16,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 1,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 43,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 9,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 50,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },

      {
        salaryFieldActive: 'Y',
        payheadMasterId: 92, // Net Salary
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },

      {
        salaryFieldActive: 'Y',
        payheadMasterId: 24,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 34,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 78,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 83,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 96,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 97,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 4, // pf
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 13, // ESI
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 5, // EPF
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'C',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 12, // EPS
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'C',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 66, // EDLI
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'C',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 25, // Admin charges
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'C',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 14, // Employer side ESIC
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'C',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 67, // Leave Encashment
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 101, // Bonus Pay
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 15, // PT
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'B',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      }
    );

    const leaveTypeArray = [];
    leaveTypeArray.push(
      {
        LeaveID: 1,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy,
        createByIp,
      },
      {
        LeaveID: 5,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy,
        createByIp,
      },
      {
        LeaveID: 6,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        Leave_Allow: 'Y',
        createBy,
        createByIp,
      },
      {
        LeaveID: 9,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy,
        createByIp,
      },
      {
        LeaveID: 7,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy,
        createByIp,
      },
      {
        LeaveID: 18,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        Leave_Allow: 'Y',
        createBy,
        createByIp,
      },
      {
        LeaveID: 20,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy,
        createByIp,
      },
      {
        LeaveID: 21,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy,
        createByIp,
      },
      {
        LeaveID: 22,
        companyMasterID: insert_db_status.companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy,
        createByIp,
      },
      {
        LeaveID: 28,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        LeaveID: 29,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        LeaveID: 30,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        LeaveID: 31,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        LeaveID: 32,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },

      // Out Duty
      {
        LeaveID: 25,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      }
    );
    const taskTypeArray = [];
    taskTypeArray.push(
      {
        TaskStage: 'Assigned',
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        TaskStage: 'Finished',
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      }
    );
    // Attendance Bonus Data && Food Allowance

    const AddIncentiveTypes = [
      {
        incentivetypename: 'Attendance Bonus',
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        incentivetypename: 'Food Allowance',
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        incentivetypename: 'Tea/Coffee Allowance',
        inc_type_displayName: 'Tea/Coffee Allowance',
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
      {
        incentivetypename: 'Extra Days',
        inc_type_displayName: 'Extra Days',
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        companyMasterID: insert_db_status.companyMasterID,
        createBy,
        createByIp,
      },
    ];

    if (parentCompanyMasterID) {
      const getActivePlan = await subscriptionPlan.findOne({
        where: {
          companyMasterID: parentCompanyMasterID,
          status: 1,
        },
        raw: true,
      });
      if (getActivePlan) {
        //Add 2 by-default roles for company -Admin -Employee
        {
          const totalPermission = await ProductPermission.findAll({
            raw: true,
            where: {
              productMasterID: getActivePlan.productMasterID,
              status: 1,
            },
            group: ['formMasterID'],
            attributes: ['formMasterID'],
          });
          const totalPermissionID = [];

          for (var item of totalPermission) {
            totalPermissionID.push(item.formMasterID);
          }

          let forms = await FormMaster.findAll({
            where: {
              status: 1,
              formMasterID: totalPermissionID,
            },
          });

          //Admin
          {
            let allrights = [];
            const insertAdminRole = await RoleMaster.create(
              {
                roleName: 'Admin',
                roleType: 'companyWise',
                companyAccessType: 'ownPlusChildCompany',
                companyMasterID: insert_db_status.companyMasterID,
                createBy,
                createByIp,
              },
              { user: req.userDetails, transaction }
            );

            for (var i = 0; i < forms.length; i++) {
              const totaloperation = await ProductPermission.findAll({
                raw: true,
                where: {
                  productMasterID: getActivePlan.productMasterID,
                  formMasterID: forms[i].formMasterID,
                  status: 1,
                },
              });

              for (var j = 0; j < totaloperation.length; j++) {
                let givenright = {
                  roleMasterID: insertAdminRole.roleMasterID,
                  formMasterID: forms[i].formMasterID,
                  operationID: totaloperation[j].operationID,
                  createBy: createBy,
                  createByIp,
                };
                allrights.push(givenright);
              }
            }
            await RolePermission.bulkCreate(allrights, {
              user: req.userDetails,
              transaction,
            });
          }

          //Employee
          {
            let forms = await FormMaster.findAll({
              where: {
                status: 1,
                defaultRight: true,
                formMasterID: totalPermissionID,
              },
            });
            let allrights = [];
            const insertEmployeeRole = await RoleMaster.create(
              {
                roleName: 'Employee',
                roleType: 'companyWise',
                companyAccessType: 'ownPlusChildCompany',
                companyMasterID: insert_db_status.companyMasterID,
                createBy,
                createByIp,
              },
              { user: req.userDetails, transaction }
            );

            for (var i = 0; i < forms.length; i++) {
              const totaloperation = await ProductPermission.findAll({
                raw: true,
                where: {
                  productMasterID: getActivePlan.productMasterID,
                  formMasterID: forms[i].formMasterID,
                  status: 1,
                },
              });

              for (var j = 0; j < totaloperation.length; j++) {
                let givenright = {
                  roleMasterID: insertEmployeeRole.roleMasterID,
                  formMasterID: forms[i].formMasterID,
                  operationID: totaloperation[j].operationID,
                  createBy: createBy,
                  createByIp,
                };
                allrights.push(givenright);
              }
            }

            await RolePermission.bulkCreate(allrights, {
              user: req.userDetails,
              transaction,
            });
          }
        }
      }
    }

    // attendance policy
    await AttendancePolicy.create(
      {
        attendanceInMobile: 'InOut',
        attendancePolicyName: 'Default Policy',
        automaticAssignShift: '1',
        coff: 'Overtime',
        companyMasterID: insert_db_status.companyMasterID,
        considerOvertimeAfter: 'totalworkinghours',
        considerWorkingHours: 'includingouthours',
        employeeESICPer: null,
        employerESICPer: null,
        esicApplicable: null,
        missPunchMinutes: 900,
        monthDays: null,
        outsidePunchInPunchOut: '0',
        overtimeEntryAfterMin: 0,
        overtimeType: 'actual',
        payType: 'grossSalary',
        payheadMasterId: null,
        pfApplicable: null,
        preShiftHrsConsideration: 0,
        sandwichLeave: null,
        selfieAttendance: '0',
        selfieWithFaceDetection: 0,
        showinsalaryslip: 'false',
        singleMultiplePunchInPunchOut: 'Single',
        skipMinutesInOvertime: 10,
        createBy: createBy,
        createByIp: createByIp,
      },
      { transaction }
    );

    await HRSalaryFields.bulkCreate(hrSalaryFieldsArray, { transaction });

    await HRLeaveTypes.bulkCreate(leaveTypeArray, { transaction });

    // Attendance Bonus Data && Food Allowance

    await Incentivetype.bulkCreate(AddIncentiveTypes, { transaction });

    await Task_Stages.bulkCreate(taskTypeArray, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company'),
      data: insert_db_status.companyMasterID,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 return all company data
 */

exports.getAllCompanyData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, exportData } =
      await req.body;
    let offset = (page - 1) * limit;
    let company_master, totalcount;
    if (searchQuery && page && limit) {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$cityMaster.cityName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['companyMasterID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[j].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: req.body.companyMasterID },
            { companyMasterID: req.body.companyMasterID },
            { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$cityMaster.cityName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: ['parentCompanyMasterID', 'ASC'],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$cityMaster.cityName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['companyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[j].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = company_master.length;
    } else if (startdate && enddate && page && limit) {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
        order: [['companyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
          {
            model: CompanyType,
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[j].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['companyMasterID', 'ASC']],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['companyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
          {
            model: CompanyType,
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[j].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['companyMasterID', 'ASC']],
      });
    } else if (page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: { status: 1 },
        order: [['createdAt', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
          {
            model: CompanyType,
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[j].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      company_master = await companyMasters.findAll({
        raw: true,
        where: { status: ['0', '1'] },
        order: [['createdAt', 'ASC']],

        offset: offset,
        limit: limit,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: [
              {
                model: StateMaster,
                include: [
                  {
                    model: CountryMaster,
                  },
                ],
              },
            ],
          },
          {
            model: CompanyType,
          },
        ],
      });
      for (var i = 0; i < company_master.length; i++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].updateBy,
          },
        });

        if (user1) {
          company_master[i].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[i].updateBy = user2.dataValues.displayName;
        }
        if (company_master[i].parentCompanyMasterID == '0') {
          company_master[i].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[i].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          if (get_one_data) {
            company_master[i].parent = get_one_data.companyName;
          }
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    if (exportData) {
      const finalData = [];
      for (let i = 0; i < company_master.length; i++) {
        const data1 = {
          CompanyName: company_master[i].companyName,
          CompanyAddress: company_master[i].companyAddress,
          CompanyWebsite: company_master[i].companyWebsite,
          CompanyEmail: company_master[i].companyEmail,
          CityName: company_master[i]['cityMaster.cityName'],
          StateName: company_master[i]['cityMaster.stateMaster.stateName'],
          CountryName:
            company_master[i][
              'cityMaster.stateMaster.countryMaster.countryName'
            ],
          CompanyType: company_master[i]['companyType.companyTypename'],
          Status: company_master[i].status,
          PanNumber: company_master[i].panNumber,
          TanNumber: company_master[i].tanNumber,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companylist,
      data: company_master,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with companyMaster id
 *
 * @param {id} companyMasterID  to fetch city name
 */

exports.getCompanyById = async (req, res, next) => {
  try {
    const get_one_data = await companyMasters.findOne({
      where: { companyMasterID: req.params.id },
      raw: true,
      include: [
        { model: CompanyType },
        {
          model: CityMaster,
          attributes: ['cityName', 'cityMasterID', 'stateMasterID'],
          include: {
            model: StateMaster,
            attributes: ['stateName', 'stateMasterID', 'countryMasterID'],
            include: {
              model: CountryMaster,
              attributes: ['countryName', 'countryMasterID'],
            },
          },
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companyget,
      data: get_one_data,
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * update data
 *
 * @param {id} companyMasterID  to update id
 */
exports.postUpdatecompanyMaster = async (req, res, next) => {
  try {
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] == 'null' ||
        !req.body[key] ||
        req.body[key] == 'undefined'
      ) {
        req.body[key] = null;
      }
    }
    let {
      companyMasterID,
      companyName,
      companyAddress,
      companyWebsite,
      companyEmail,
      companyTypeid,
      cpName,
      cpMobileNo,
      cpEmail,
      parentCompanyMasterID,
      subCompanyRequired,
      employeeCodePattern,
      employeeCodeType,
      expenseDatePicker,
      otp,
      cityMasterID,
      status,
      updateBy,
      updateByIp,
      panNumber,
      tanNumber,
      companyDescription,
      ownerName,
      ownerFatherName,
      tdsdeduction,
      uniqueEmpCode,
      cinNumber,
      fileUploadType,
      setUpTime,
    } = await req.body;
    const existCompanyData = await companyMaster.findOne({
      where: {
        companyMasterID: companyMasterID,
      },
    });

    if (!existCompanyData) {
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Company'),
      });
    }
    const condition = {
      companyMasterID: { [Sequelize.Op.ne]: companyMasterID },
      [Sequelize.Op.and]: [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.fn('TRIM', Sequelize.col('companyName'))
          ),
          Sequelize.Op.eq,
          String(companyName).trim().toLowerCase()
        ),
      ],
      status: [0, 1],
    };
    if (existCompanyData.parentCompanyMasterID) {
      // For Child Company
      condition[Sequelize.Op.or] = [
        {
          parentCompanyMasterID: existCompanyData.parentCompanyMasterID,
        },
        {
          companyMasterID: existCompanyData.parentCompanyMasterID,
        },
      ];
    } else {
      // For Parent Company
      condition.parentCompanyMasterID = existCompanyData.companyMasterID;
    }
    const get_one_data = await companyMaster.findOne({
      where: condition,
    });

    if (get_one_data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Company With Same name'),
      });
    }
    if (
      !uniqueEmpCode ||
      uniqueEmpCode == 'undefined' ||
      uniqueEmpCode == 'null'
    )
      uniqueEmpCode = false;

    const employeecodepattern =
      employeeCodeType == 'pattern' ? employeeCodePattern : null;

    let companyLogo = '';
    let authorizedSignature = '';
    let letterHead = '';

    if (req.files.companyLogo) {
      companyLogo = req.files.companyLogo[0].filename;
    } else {
      companyLogo = existCompanyData.companyLogo;
    }

    if (req.files.authorizedSignature) {
      authorizedSignature = req.files.authorizedSignature[0].filename;
    } else {
      authorizedSignature = existCompanyData.authorizedSignature;
    }

    if (req.files.letterHead) {
      letterHead = req.files.letterHead[0].filename;
    } else {
      letterHead = existCompanyData.letterHead;
    }

    const oldFilePath = path.join(
      __dirname,
      '..',
      './uploads/company/logo/',
      existCompanyData.companyLogo
    );

    if (
      existCompanyData.companyLogo &&
      req.files.companyLogo &&
      fs.existsSync(oldFilePath)
    ) {
      fs.unlink(oldFilePath, (err) => {
        if (err) {
          return res.status(500).json({
            message: 'Error deleting the old company logo',
            error: err,
          });
        }
      });
    }

    const oldAuthorizedSignature = path.join(
      __dirname,
      '..',
      './uploads/company/signature/',
      existCompanyData.companyLogo
    );

    if (
      existCompanyData.authorizedSignature &&
      req.files.authorizedSignature &&
      fs.existsSync(oldAuthorizedSignature)
    ) {
      fs.unlink(oldAuthorizedSignature, (err) => {
        if (err) {
          return res.status(500).json({
            message: 'Error deleting the old signature',
            error: err,
          });
        }
      });
    }

    const oldLetterHeadPath = path.join(
      __dirname,
      '..',
      './uploads/company/letterhead/',
      existCompanyData.companyLogo
    );

    if (
      existCompanyData.letterHead &&
      req.files.letterHead &&
      fs.existsSync(oldLetterHeadPath)
    ) {
      fs.unlink(oldLetterHeadPath, (err) => {
        if (err) {
          return res.status(500).json({
            message: 'Error deleting the old letter head',
            error: err,
          });
        }
      });
    }

    await companyMasters.update(
      {
        companyName,
        companyAddress,
        companyLogo,
        companyWebsite,
        companyEmail,
        companyTypeid,
        cpName,
        cpMobileNo,
        cpEmail,
        subCompanyRequired,
        employeeCodePattern: employeecodepattern,
        employeeCodeType,
        expenseDatePicker,
        cityMasterID,
        otp,
        status,
        updateBy,
        updateByIp,
        panNumber,
        tanNumber,
        companyDescription,
        authorizedSignature,
        ownerName,
        ownerFatherName,
        tdsdeduction,
        uniqueEmpCode,
        cinNumber,
        fileUploadType,
        setUpTime,
        letterHead,
      },
      {
        where: { companyMasterID: companyMasterID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.companyupdate,
      data: { companyLogo },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} companyMasterID  to delete id
 */
exports.postDeleteCompanyById = async (req, res, next) => {
  try {
    let { companyMasterID } = await req.body;

    let data = await UserMaster.findOne({
      where: {
        companyMasterId: companyMasterID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Company. Already assigned to employees.',
      });
    } else {
      let delete_status = await companyMasters.update(
        {
          status: '2',
        },
        {
          where: { companyMasterID: companyMasterID, status: ['1', '0'] },
        }
      );
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.companydelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

/**
 * status change
 *
 * @param {id} companyMasterID  to status change
 */
exports.poststatuschange = async (req, res, next) => {
  try {
    let { companyMasterID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await companyMasters.update(
        {
          status: '1',
        },
        {
          where: { companyMasterID: companyMasterID, status: ['1', '0'] },
        }
      );
    } else {
      let data = await UserMaster.findOne({
        where: {
          companyMasterId: companyMasterID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Company. Already assigned to employees.',
        });
      } else {
        delete_status = await companyMasters.update(
          {
            status: '0',
          },
          {
            where: { companyMasterID: companyMasterID, status: ['1', '0'] },
          }
        );
      }
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.companydelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getCompanyByParentCompany = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      exportData,
      companyMasterID,
    } = await req.body;
    let offset = (page - 1) * limit;
    let company_master, totalcount;
    if (searchQuery && page && limit) {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { parentCompanyMasterID: companyMasterID },
                { companyMasterID: companyMasterID },
              ],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { parentCompanyMasterID: companyMasterID },
                { companyMasterID: companyMasterID },
              ],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                { parentCompanyMasterID: companyMasterID },
                { companyMasterID: companyMasterID },
              ],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = company_master.length;
    } else if (startdate && enddate && page && limit) {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: 1,
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
      });
    } else {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        offset: offset,
        limit: limit,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var i = 0; i < company_master.length; i++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].updateBy,
          },
        });

        if (user1) {
          company_master[i].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[i].updateBy = user2.dataValues.displayName;
        }
        if (company_master[i].parentCompanyMasterID == '0') {
          company_master[i].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[i].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[i].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { parentCompanyMasterID: companyMasterID },
            { companyMasterID: companyMasterID },
          ],
          status: ['0', '1'],
        },
      });
    }

    if (exportData) {
      const finalData = [];
      for (let i = 0; i < company_master.length; i++) {
        const data1 = {
          CompanyName: company_master[i].companyName,
          CompanyAddress: company_master[i].companyAddress,
          CompanyWebsite: company_master[i].companyWebsite,
          CompanyEmail: company_master[i].companyEmail,
          CityName: company_master[i]['cityMaster.cityName'],
          StateName: company_master[i]['cityMaster.stateMaster.stateName'],
          CountryName:
            company_master[i][
              'cityMaster.stateMaster.countryMaster.countryName'
            ],
          CompanyType: company_master[i]['companyType.companyTypename'],
          Status: company_master[i].status,
          PanNumber: company_master[i].panNumber,
          TanNumber: company_master[i].tanNumber,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    if (!company_master) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.companyget,
        data: company_master,
        totalcount,
      });
    }
  } catch (err) {
    next(err.message);
  }
};

exports.getCompanyById1 = async (req, res, next) => {
  try {
    const currCompany = await companyMasters.findOne({
      where: { companyMasterID: req.body.companyMasterID, status: 1 },
      raw: true,
      include: [
        {
          model: CityMaster,
          attributes: ['cityName', 'stateMasterID'],
          include: [
            {
              model: StateMaster,
              attributes: ['stateName', 'countryMasterID'],
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryName'],
                },
              ],
            },
          ],
        },
        { model: CompanyType },
      ],
    });
    if (req.userDetails && req.userDetails.role) {
      if (
        req.userDetails.role.companyAccessType == companyAccessType.OWN_COMPANY
      ) {
        return res.status(200).json({
          status: 200,
          message: message.usermessage.companyget,
          data: [currCompany],
        });
      }
    }

    const allChildCompany = await companyMasters.findAll({
      where: {
        parentCompanyMasterID: req.body.companyMasterID,
        status: 1,
      },
      raw: true,
      include: [
        {
          model: CityMaster,
          attributes: ['cityName', 'stateMasterID'],
          include: [
            {
              model: StateMaster,
              attributes: ['stateName', 'countryMasterID'],
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryName'],
                },
              ],
            },
          ],
        },
        { model: CompanyType },
      ],
    });
    allChildCompany.push(currCompany);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companyget,
      data: allChildCompany,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * search data
 *
 * @param {id} searchQuery  to search data
 */
exports.postSearchCompanyMaster = async (req, res, next) => {
  try {
    let = { searchQuery } = await req.body;
    let search_results_1 = await companyMasters.findAll({
      where: {
        [Sequelize.Op.or]: [
          { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        ],
      },
      include: [
        {
          model: CityMaster,
          as: 'cityMaster',
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
        {
          model: CompanyType,
        },
      ],
    });
    let search_results_2 = await companyMasters.findAll({
      include: [
        {
          model: CityMaster,
          as: 'cityMaster',
          where: {
            cityName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
          },
        },
      ],
    });
    let search_results = [...search_results_1, ...search_results_2];
    res.status(200).json({ status: 200, data: search_results });
  } catch (err) {
    next(err);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let get_all_data, totalcount;
    if (searchQuery && page && limit) {
      get_all_data = await companyMasters.findAll({
        where: {
          [Sequelize.Op.or]: [
            { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          parentCompanyMasterID: 0,
          status: 1,
        },
        limit: limit,
        offset: offset,
        order: [['companyMasterID', 'ASC']],
      });

      for (var i = 0; i < get_all_data.length; i++) {
        let subscription_master = await subscriptionPlan.findOne({
          where: {
            status: 1,
            companyMasterID: get_all_data[i].companyMasterID,
          },
        });
        get_all_data[i].dataValues.subscription = subscription_master;
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          parentCompanyMasterID: 0,
          status: 1,
        },
        order: [['parentCompanyMasterID', 'ASC']],
      });
    } else if (page == '' && limit == '') {
      get_all_data = await companyMasters.findAll({
        where: {
          parentCompanyMasterID: 0,
          status: 1,
        },
        order: [['companyMasterID', 'ASC']],
      });

      for (var i = 0; i < get_all_data.length; i++) {
        let subscription_master = await subscriptionPlan.findOne({
          where: {
            status: 1,
            companyMasterID: get_all_data[i].companyMasterID,
          },
        });
        get_all_data[i].dataValues.subscription = subscription_master;
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          parentCompanyMasterID: 0,
          status: 1,
        },
        order: [['parentCompanyMasterID', 'ASC']],
      });
    } else {
      get_all_data = await companyMasters.findAll({
        where: {
          parentCompanyMasterID: 0,
          status: 1,
        },
        limit: limit,
        offset: offset,
        order: [['companyMasterID', 'ASC']],
      });

      for (var i = 0; i < get_all_data.length; i++) {
        let subscription_master = await subscriptionPlan.findOne({
          where: {
            status: 1,
            companyMasterID: get_all_data[i].companyMasterID,
          },
        });
        get_all_data[i].dataValues.subscription = subscription_master;
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          parentCompanyMasterID: 0,
          status: 1,
        },
        order: [['parentCompanyMasterID', 'ASC']],
      });
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.companyget,
      data: get_all_data,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getCompanyByParentCompany2 = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, exportData } =
      await req.body;
    let offset = (page - 1) * limit;
    let company_master, totalcount;
    if (searchQuery && page && limit) {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
            },
            {
              [Sequelize.Op.or]: [
                {
                  companyName: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  companyEmail: {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
                {
                  '$cityMaster.cityName$': {
                    [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                  },
                },
              ],
            },
          ],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = company_master.length;
    } else if (startdate && enddate && page && limit) {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
    } else if (page == '' && limit == '') {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: [0, 1],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });

      for (var j = 0; j < company_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[j].updateBy,
          },
        });

        if (user1) {
          company_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[j].updateBy = user2.dataValues.displayName;
        }
        if (company_master[j].parentCompanyMasterID == '0') {
          company_master[j].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[j].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[j].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
      });
    } else {
      company_master = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.and]: [{ parentCompanyMasterID: 0 }],
          status: ['0', '1'],
        },
        order: [['parentCompanyMasterID', 'ASC']],
        offset: offset,
        limit: limit,
        include: [
          {
            model: CityMaster,
            as: 'cityMaster',
            include: {
              model: StateMaster,
              include: {
                model: CountryMaster,
              },
            },
          },
        ],
      });
      for (var i = 0; i < company_master.length; i++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: company_master[i].updateBy,
          },
        });

        if (user1) {
          company_master[i].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          company_master[i].updateBy = user2.dataValues.displayName;
        }
        if (company_master[i].parentCompanyMasterID == '0') {
          company_master[i].parent = 'Parent Company';
        } else {
          let get_one_data = await companyMasters.findOne({
            where: {
              companyMasterID: company_master[i].parentCompanyMasterID,
              status: [0, 1],
            },
            raw: true,
          });
          company_master[i].parent = get_one_data.companyName;
        }
      }
      totalcount = await companyMasters.count({
        raw: true,
        where: {
          parentCompanyMasterID: 0,
          status: ['0', '1'],
        },
      });
    }

    if (exportData) {
      const finalData = [];
      for (let i = 0; i < company_master.length; i++) {
        const data1 = {
          CompanyName: company_master[i].companyName,
          CompanyAddress: company_master[i].companyAddress,
          CompanyWebsite: company_master[i].companyWebsite,
          CompanyEmail: company_master[i].companyEmail,
          CityName: company_master[i]['cityMaster.cityName'],
          StateName: company_master[i]['cityMaster.stateMaster.stateName'],
          CountryName:
            company_master[i][
              'cityMaster.stateMaster.countryMaster.countryName'
            ],
          CompanyType: company_master[i]['companyType.companyTypename'],
          Status: company_master[i].status,
          PanNumber: company_master[i].panNumber,
          TanNumber: company_master[i].tanNumber,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companyget,
      data: company_master,
      totalcount,
    });
  } catch (err) {
    next(err);
  }
};

function getFirstAndLastDateOfCurrentMonth() {
  // Get current date
  const currentDate = new Date();

  // Get the first day of the current month in UTC
  const firstDate = new Date(
    Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)
  );

  // Get the last day of the current month in UTC
  const lastDate = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1, // next month
      0, // last day of the current month
      23,
      59,
      59,
      999 // set to the very last moment of the day
    )
  );

  // Return the first and last date in YYYY-MM-DD format
  return {
    firstDate: firstDate.toISOString().split('T')[0],
    lastDate: lastDate.toISOString().split('T')[0],
  };
}

exports.getCompanyAnalyticsData = async (req, res, next) => {
  try {
    const allCompany = await companyMaster.findAll({
      where: { status: [0, 1] },
      include: {
        model: subscriptionPlan,
        where: { status: 1 },
        required: true,
      },
    });

    const allActive = allCompany.filter((company) => +company.status == 1);
    const allDeactive = allCompany.filter((company) => +company.status == 0);

    const currMonthDate = getFirstAndLastDateOfCurrentMonth();

    const expiredPlan = allCompany.filter(
      (company) =>
        company.companySubscriptions[0].endDate < currMonthDate.firstDate
    );

    const CurrMonthExpiringPlan = allCompany.filter(
      (company) =>
        company.companySubscriptions[0].endDate >= currMonthDate.firstDate &&
        company.companySubscriptions[0].endDate <= currMonthDate.lastDate
    );

    const responseObject = {
      totalcount: allCompany.length,
      totalactivecount: allActive.length,
      totaldeactivecount: allDeactive.length,
      totalcurrentmonthrenewalcount: CurrMonthExpiringPlan.length,
      totalexpiredCount: expiredPlan.length,
    };

    return res.status(200).json({
      status: 200,
      message: 'Company Analytics get successfully',
      data: responseObject,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanyDataSubAdmin = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, name, exportData } =
      await req.query;

    const paginationQuery = {},
      companyCondition = { status: [0, 1] },
      subscriptionCondition = { status: 1 };

    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    if (searchQuery)
      companyCondition[Sequelize.Op.or] = [
        { companyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    if (startdate && enddate) {
      companyCondition.createdAt = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const currMonthDate = getFirstAndLastDateOfCurrentMonth();
    if (name == 'expiredplan') {
      subscriptionCondition.endDate = {
        [Sequelize.Op.lt]: currMonthDate.firstDate,
      };
    } else if (name == 'renewal') {
      subscriptionCondition[Sequelize.Op.and] = [
        { endDate: { [Sequelize.Op.gte]: currMonthDate.firstDate } },
        { endDate: { [Sequelize.Op.lte]: currMonthDate.lastDate } },
      ];
    } else if (name == 'deactive' || name == 'active' || name == 'total') {
      if (name == 'deactive') companyCondition.status = 0;
      if (name == 'active') companyCondition.status = 1;
      if (name == 'total') companyCondition.status = [0, 1];
    }

    const companyData = await companyMaster.findAndCountAll({
      ...paginationQuery,
      where: companyCondition,
      include: [
        {
          model: subscriptionPlan,
          where: subscriptionCondition,
          attributes: [
            'companyPlanMasterID',
            'productMasterID',
            [
              sequelize.fn('TO_CHAR', sequelize.col('startDate'), 'DD-MM-YYYY'),
              'startDate',
            ],
            [
              sequelize.fn('TO_CHAR', sequelize.col('endDate'), 'DD-MM-YYYY'),
              'endDate',
            ],
          ],
          include: { model: ProductMaster, attributes: ['productName'] },
        },
        {
          model: CompanyType,
          attributes: ['companyTypename'],
        },
        {
          model: CityMaster,
          attributes: ['cityName'],
        },
      ],
    });

    if (exportData) {
      const finalData = companyData.rows.map((e) => {
        return {
          'Company Name': e.companyName,
          'Plan Name': e.companySubscriptions[0].productMaster.productName,
          'Start Date': e.companySubscriptions[0].startDate,
          'End Date': e.companySubscriptions[0].endDate,
          'Company Address': e.companyAddress,
          City: e.cityMaster.cityName,
          'Company Website': e.companyWebsite,
          'Contact Person Name': e.cpName,
          'Company Email': e.email,
          'Contact Number': e.cpMobileNo,
          Status: e.status == 0 ? 'Deactive' : 'Active',
          CompanyType: e.companyType?.companyTypename || '',
          PanNumber: e.panNumber,
          TanNumber: e.tanNumber,
        };
      });
      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.companyget,
      totalcount: companyData.count,
      data: companyData.rows,
    });
  } catch (err) {
    next(err);
  }
};

exports.addpayheadleave = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { companyMasterID } = await req.body;

    const comp = await companyMasters.findOne({
      where: {
        companyMasterID: companyMasterID,
      },
    });

    let hrSalaryFieldsArray = [];
    hrSalaryFieldsArray.push(
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 17,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'D',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 16,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'D',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 1,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 43,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 9,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'D',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 50,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'N',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },

      {
        salaryFieldActive: 'Y',
        payheadMasterId: 24,
        salaryFieldSide: 'E',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'A',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        salaryFieldActive: 'Y',
        payheadMasterId: 34,
        salaryFieldSide: 'D',
        salaryFieldAttanChk: 1,
        salaryFieldRound: 'Y',
        salaryFieldSrNo: 'D',
        salaryFieldShow: 'Y',
        salaryFieldWhenMonth: [0],
        companyMasterID: companyMasterID,
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      }
    );

    for (var i = 0; i < hrSalaryFieldsArray.length; i++) {
      const payhead = await HRSalaryFields.findOne({
        where: {
          companyMasterID: companyMasterID,
          payheadMasterId: hrSalaryFieldsArray[i].payheadMasterId,
        },
      });

      if (!payhead) {
        await HRSalaryFields.create(hrSalaryFieldsArray[i], { transaction });
      }
    }

    let leaveTypeArray = [];
    leaveTypeArray.push(
      {
        LeaveID: 1,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 5,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 6,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 9,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 7,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'Y',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 18,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        Leave_Allow: 'Y',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 20,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 21,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      },
      {
        LeaveID: 22,
        companyMasterID: companyMasterID,
        // Allow_Field_Entry: 'N',
        createBy: comp.createBy,
        createByIp: comp.createByIp,
      }
    );
    for (var i = 0; i < leaveTypeArray.length; i++) {
      const leavetype = await HRLeaveTypes.findOne({
        where: {
          companyMasterID: companyMasterID,
          LeaveID: leaveTypeArray[i].LeaveID,
        },
      });

      if (!leavetype) {
        await HRLeaveTypes.create(leaveTypeArray[i], { transaction });
      }
    }

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: 'success',
    });
  } catch (err) {
    await transaction.rollback();

    next(err.message);
  }
};

exports.postUpdateCustomerPreference = async (req, res, next) => {
  try {
    const { companyMasterID, customerListPreference } = req.body;

    await companyMasters.update(
      { customerListPreference },
      { where: { companyMasterID: companyMasterID } }
    );

    return res.status(200).json({ status: 200, message: 'success' });
  } catch (err) {
    next(err);
  }
};

exports.getCompanySubscriptionPlanAnalyticsData = async (req, res, next) => {
  try {
    const companySubscriptionData = await CompanySubscriptionMaster.findAll({
      attributes: [
        'companySubscription.productMasterID',
        [
          sequelize.fn(
            'COUNT',
            sequelize.col('companySubscription.productMasterID')
          ),
          'count',
        ],
        [
          sequelize.col('productMaster.productMasterID'),
          'productMaster.productMasterID',
        ],
        [
          sequelize.col('productMaster.productName'),
          'productMaster.productName',
        ],
      ],
      where: { status: 1 },
      include: [
        {
          model: ProductMaster,
          where: { status: 1 },
          attributes: ['productMasterID', 'productName'],
        },
        {
          model: companyMaster,
          where: { parentCompanyMasterID: 0, status: [0, 1] },
          attributes: [],
        },
      ],
      group: [
        'companySubscription.productMasterID',
        'productMaster.productMasterID',
        'productMaster.productName',
      ],
      order: [['count', 'DESC']],
    });

    return res.status(200).json({ status: 200, data: companySubscriptionData });
  } catch (err) {
    next(err);
  }
};

exports.listCompanySubscriptionPlanAnalyticsData = async (req, res, next) => {
  try {
    const { page, limit, productMasterID, searchQuery, exportData } = req.body;

    if (!productMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.errorMessage.INVALID_FILTER_FIELDS,
      });
    }

    const condition = {};
    condition.status = 1;

    if (productMasterID) condition.productMasterID = productMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: companySubscriptionData, count } =
      await CompanySubscriptionMaster.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            model: ProductMaster,
            where: { status: 1 },
            attributes: [
              'productMasterID',
              'productName',
              'productCode',
              'description',
            ],
          },
          {
            model: companyMaster,
            where: { parentCompanyMasterID: 0 },
            attributes: [
              'companyName',
              'cpName',
              'cpMobileNo',
              'companyName',
              'companyName',
              'companyName',
              'companyAddress',
            ],
            include: [
              {
                model: CityMaster,
                attributes: ['cityName'],
                include: [
                  {
                    model: StateMaster,
                    attributes: ['stateName'],
                    include: [
                      {
                        model: CountryMaster,
                        attributes: ['countryName'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        order: [[{ model: companyMaster }, 'companyName', 'ASC']],
        attributes: [
          'totalUser',
          'totalTracking',
          'startDate',
          'endDate',
          'totalUser',
          'totalTracking',
        ],
      });

    if (exportData) {
      const finaldata = companySubscriptionData.map((e) => {
        return {
          'Product Name': e.productMaster.productName || '',
          'Company Name': e.companyMaster.companyName || '',
          'Contact Person Name': e.companyMaster.cpName || '',
          'Contact Person Number': e.companyMaster.cpMobileNo || '',
          'Company Address': e.companyMaster.companyAddress || '',
          'Company City': e.companyMaster.cityMaster.cityName || '',
          'Company State':
            e.companyMaster.cityMaster.stateMaster.stateName || '',
          'Company Country':
            e.companyMaster.cityMaster.stateMaster.countryMaster.countryName ||
            '',
          'Product Code': e.productMaster.productCode || '',
          'Product Description': e.productMaster.description || '',
          TotalUser: e.totalUser || '',
          'Total Tracking': e.totalTracking || '',
          StartDate: moment(e.startDate).format('DD/MM/YYYY') || '',
          EndDate: moment(e.endDate).format('DD/MM/YYYY') || '',
        };
      });

      return await generateExcel(
        finaldata,
        'Company Subscription Plan Data',
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: companySubscriptionData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCompanySubscriptionPlanAnalyticsDataProductWise = async (
  req,
  res,
  next
) => {
  try {
    const { productMasterID } = req.query;

    if (!productMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.errorMessage.INVALID_FILTER_FIELDS,
      });
    }

    async function getCount(statusCondition) {
      return await CompanySubscriptionMaster.count({
        where: {
          productMasterID: productMasterID,
          status: 1,
        },
        include: [
          {
            model: companyMaster,
            where: {
              parentCompanyMasterID: 0,
              status: statusCondition,
            },
          },
        ],
      });
    }

    const totalcount = await getCount([0, 1]);
    const totalactivecount = await getCount(1);
    const totaldeactivecount = await getCount(0);

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    async function getCountWithEndDateCondition(endDateCondition) {
      return await CompanySubscriptionMaster.count({
        where: {
          productMasterID: productMasterID,
          status: 1,
          endDate: endDateCondition,
        },
        include: [
          {
            model: companyMaster,
            where: {
              parentCompanyMasterID: 0,
              status: [0, 1],
            },
          },
        ],
      });
    }

    const totalcurrentmonthrenewalcount = await getCountWithEndDateCondition({
      [Sequelize.Op.and]: [
        sequelize.literal(`EXTRACT(YEAR FROM "endDate") = ${currentYear}`),
        sequelize.literal(`EXTRACT(MONTH FROM "endDate") = ${currentMonth}`),
      ],
    });

    const totalexpiredCount = await getCountWithEndDateCondition({
      [Sequelize.Op.lt]: today,
    });

    let mainobj = {
      totalcount: totalcount || 0,
      totalactivecount: totalactivecount || 0,
      totaldeactivecount: totaldeactivecount || 0,
      totalcurrentmonthrenewalcount: totalcurrentmonthrenewalcount || 0,
      totalexpiredCount: totalexpiredCount || 0,
    };

    return res.status(200).json({
      status: 200,
      data: mainobj,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCompanyTree = async (req, res, next) => {
  try {
    const { companyMasterID } = await req.body;

    const currCompany = await companyMasters.findOne({
      where: { companyMasterID: companyMasterID, status: 1 },
      attributes: ['companyMasterID', 'parentCompanyMasterID'],
      raw: true,
    });

    if (+currCompany.parentCompanyMasterID) {
      const allCompany = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +currCompany.parentCompanyMasterID },
            { parentCompanyMasterID: +currCompany.parentCompanyMasterID },
          ],
          status: 1,
        },
      });
      return res.status(200).json({ status: 200, data: allCompany });
    } else {
      const allCompany = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +companyMasterID },
            { parentCompanyMasterID: +companyMasterID },
          ],
          status: 1,
        },
      });
      return res.status(200).json({ status: 200, data: allCompany });
    }
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const userData = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
      include: [
        {
          required: false,
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

// Add Extra Incentive Types

exports.addIncentiveTypes = async (req, res, next) => {
  try {
    const companydata = await companyMaster.findAll({
      raw: true,
      where: {
        status: [0, 1],
      },
    });

    const allCompanyIds = companydata.map((e) => e.companyMasterID);

    const IncentiveTypes = await Incentivetype.findAll({
      raw: true,
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: allCompanyIds,
        },
        incentivetypename: 'Food Allowance',
      },
    });

    const toAddIncentiveTypes = [];

    for (const company of companydata) {
      const inc = IncentiveTypes.find(
        (e) => e.companyMasterID == company.companyMasterID
      );

      if (inc) continue;

      toAddIncentiveTypes.push({
        incentivetypename: 'Food Allowance', // Food Allowance
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        companyMasterID: company.companyMasterID,
        createBy: 4,
      });
    }

    // await sequelize.transaction(async (t) => {
    //   await Incentivetype.bulkCreate(toAddIncentiveTypes, { transaction: t });
    // })

    return res.status(200).json({
      status: 200,
      data: toAddIncentiveTypes,
    });
  } catch (error) {
    next(error);
  }
};

//companymaster
exports.getCompanyByParentCompany3 = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, exportData } =
      req.body;
    const paginationQuery = {};

    let condition = {
      parentCompanyMasterID: 0,
      status: ['0', '1'],
    };

    condition.createBy = req.userDetails.userMasterId;

    if (searchQuery) {
      condition[Sequelize.Op.and] = [
        {
          [Sequelize.Op.or]: [
            { companyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
            { companyEmail: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
          ],
        },
      ];
    }
    const order = [['companyMasterID', 'ASC']];
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    if (startdate && enddate) {
      condition.createdAt = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const { rows: companyMasterData, count } =
      await companyMasters.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            required: false,
            model: CompanySubscriptionMaster,
            where: {
              status: 1,
            },
            include: [
              {
                required: false,
                model: ProductMaster,
                attributes: ['productName', 'productCode'],
              },
            ],
          },
          {
            model: CityMaster,
            attributes: ['cityName', 'stateMasterID'],
            include: [
              {
                model: StateMaster,
                attributes: ['stateName', 'countryMasterID'],
                include: [
                  {
                    model: CountryMaster,
                    attributes: ['countryName'],
                  },
                ],
              },
            ],
          },
          {
            required: false,
            model: CompanyType,
            attributes: ['companyTypename', 'companyTypeID'],
          },
        ],
      });
    const createUpdateUserIDs = new Set();
    for (let company of companyMasterData) {
      if (company.createBy) {
        createUpdateUserIDs.add(+company.createBy);
      }
      if (company.updateBy) {
        createUpdateUserIDs.add(company.updateBy);
      }
    }
    const findAllUserData = await UserMaster.findAll({
      where: {
        userMasterID: [...createUpdateUserIDs],
      },
      attributes: userAttributes,
    });

    if (exportData) {
      const finalData = [];
      for (let company of companyMasterData) {
        let parentCompanyName = '';
        if (company.parentCompanyMasterID != 0) {
          const parentcompany = companyMasterData.find(
            (e) => e.companyMasterID == +company.parentCompanyMasterID
          );
          parentCompanyName = parentcompany ? parentcompany.companyName : '';
        }

        const createByUser =
          company.createBy && findAllUserData && findAllUserData.length > 0
            ? findAllUserData.find((e) => e.userMasterID == company.createBy)
            : null;
        const updateByUser =
          company.updateBy && findAllUserData && findAllUserData.length > 0
            ? findAllUserData.find((e) => e.userMasterID == company.updateBy)
            : null;
        const companyDataObject = {
          'Parent Company Name': parentCompanyName,
          'Company Name': company.companyName,
          'Company E-Mail': company.companyEmail,
          'Company WebSite': company.companyWebsite,
          'Company Type': company.companyType?.companyTypename,
          'Company Owner Name': company.ownerName,
          'Company Father Name': company.ownerFatherName,
          'Company Contact Person Name': company.cpName,
          'Company Contact Person Mobile No.': company.cpMobileNo,
          'Company Contact Person E-mail': company.cpEmail,
          'Company Address': company.companyAddress,
          'Company Country':
            company.cityMaster?.stateMaster?.countryMaster?.countryName,
          'Company State': company.cityMaster?.stateMaster?.stateName,
          'Company City': company.cityMaster?.cityName,
          'Pan Number': company.panNumber,
          'Tan Number': company.tanNumber,
          'CIN Number': company.cinNumber,
          'TDS Deduction': company.tdsdeduction == true ? 'YES' : 'NO',
          'SubScription Plan Name':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].productMaster.productName
              : '',
          'SubScription Plan Code':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].productMaster.productCode
              : '',
          'SubScription Start Date':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? moment(
                  company.companySubscriptions[0].startDate,
                  'YYYY-MM-DD'
                ).format('DD-MM-YYYY')
              : '',
          'SubScription End Date':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? moment(
                  company.companySubscriptions[0].endDate,
                  'YYYY-MM-DD'
                ).format('DD-MM-YYYY')
              : '',
          'SubScription Users':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].totalUser
              : '',
          'SubScription Total Traking Users':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].totalTracking
              : '',
          'Company Created By': createByUser ? createByUser.displayName : '',
          'Company Updated By': updateByUser ? updateByUser.displayName : '',
          Status: company.status == 1 ? 'Active' : 'De-Active',
        };
        finalData.push(companyDataObject);
      }

      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: companyMasterData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.removeCompanyLogoAndAuthSign = async (req, res, next) => {
  try {
    const { companyMasterID, imageType } = await req.body;

    const company = await companyMasters.findOne({
      where: { companyMasterID },
      attributes: ['companyLogo', 'authorizedSignature', 'letterHead'],
    });
    if (imageType === 'companyLogo') {
      const logoPath = path.join(
        __dirname,
        '../uploads/company/logo/',
        company.companyLogo
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
      await companyMasters.update(
        {
          companyLogo: '',
        },
        {
          where: { companyMasterID: companyMasterID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Company Logo'),
      });
    } else if (imageType === 'authorizedSignature') {
      const logoPath = path.join(
        __dirname,
        '../uploads/company/signature/',
        company.authorizedSignature
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      await companyMasters.update(
        {
          authorizedSignature: '',
        },
        {
          where: { companyMasterID: companyMasterID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Authorized Signature'),
      });
    } else {
      const logoPath = path.join(
        __dirname,
        '../uploads/company/letterHead/',
        company.letterHead
      );
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }

      await companyMasters.update(
        {
          letterHead: '',
        },
        {
          where: { companyMasterID: companyMasterID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Letter Head'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.addData = async (req, res, next) => {
  try {
    // const { companyMasterID } = req.body;

    const companyData = await companyMaster.findAll({
      where: {
        status: [0, 1],
      },
    });

    const toAddData = [];

    for (const company of companyData) {
      toAddData.push(
        {
          LeaveID: 28,
          companyMasterID: company.companyMasterID,
          createBy: company.createBy,
          createByIp: company.createByIp,
        },
        {
          LeaveID: 29,
          companyMasterID: company.companyMasterID,
          createBy: company.createBy,
          createByIp: company.createByIp,
        },
        {
          LeaveID: 30,
          companyMasterID: company.companyMasterID,
          createBy: company.createBy,
          createByIp: company.createByIp,
        },
        {
          LeaveID: 31,
          companyMasterID: company.companyMasterID,
          createBy: company.createBy,
          createByIp: company.createByIp,
        }
      );
    }

    await HrLeaveTypes.bulkCreate(toAddData);

    return res.status(200).json({
      status: 200,
      data: toAddData,
      totalcount: toAddData.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.addExtraDaysIncentive = async (req, res, next) => {
  try {
    const companyData = await companyMaster.findAll({
      where: {
        status: [0, 1],
      },
    });

    const companyIds = companyData.map((e) => e.companyMasterID);

    const findAllExtraDays = await Incentivetype.findAll({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('incentivetypename'))
            ),
            'extra days'
          ),
          { companyMasterID: { [Sequelize.Op.in]: companyIds } }, // Check company IDs as an array
          {
            [Sequelize.Op.or]: [{ status: 0 }, { status: 1 }],
          },
        ],
      },
    });

    const allData = [];

    for (const company of companyData) {
      const companyid = company.companyMasterID;

      const findData = findAllExtraDays.find(
        (e) => e.companyMasterID == companyid
      );

      if (findData) continue;

      allData.push({
        companyMasterID: companyid,
        incentivetypename: 'Extra Days',
        inc_type_displayName: 'Extra Days',
        showinsalaryslip: true,
        consider: 'gross',
        status: 1,
        createBy: company.createBy,
        createByIp: company.createByIp,
      });
    }

    await Incentivetype.bulkCreate(allData);

    return res.status(200).json({
      status: 200,
      data: allData.length,
    });
  } catch (error) {
    next(error);
  }
};

// exports.addData = async (req, res, next) => {
//   try {
//     // const { companyMasterID } = req.body;

//     const companyData = await companyMaster.findAll({
//       where: {
//         status: [0, 1],
//       },
//     });

//     const toAddData = [];

//     for (const company of companyData) {
//       toAddData.push(
//         {
//           LeaveID: 32,
//           companyMasterID: company.companyMasterID,
//           createBy: company.createBy,
//           createByIp: company.createByIp,
//         },
//       );
//     }

//     // await HrLeaveTypes.bulkCreate(toAddData);

//     return res.status(200).json({
//       status: 200,
//       data: toAddData,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// exports.companyDetails = async (req, res, next) => {
//   try {
//     const { companyMasterID } = await req.query.params;

//     const companyDetails = companyMaster.findOne({
//       where: { companyMasterID },
//       include: [
//         {
//           model: CompanySubscriptionMaster,
//           where: {
//             status: 1
//           }
//         }
//       ]
//     });

//     return res.status(200).json({
//       status: 200,
//       data: companyDetails,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

exports.getAllCompanyDataV2 = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, exportData } =
      await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginationQuery = {};
    const condition = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['companyMasterID', 'ASC']];
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { companyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { companyEmail: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$cityMaster.cityName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }
    if (startdate && enddate) {
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    condition.status = ['0', '1'];
    const { rows: companyMasterData, count } =
      await companyMasters.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            required: false,
            model: CompanySubscriptionMaster,
            where: {
              status: 1,
            },
            include: [
              {
                required: false,
                model: ProductMaster,
                attributes: ['productName', 'productCode'],
              },
            ],
          },
          {
            model: CityMaster,
            attributes: ['cityName', 'stateMasterID'],
            include: [
              {
                model: StateMaster,
                attributes: ['stateName', 'countryMasterID'],
                include: [
                  {
                    model: CountryMaster,
                    attributes: ['countryName'],
                  },
                ],
              },
            ],
          },
          {
            required: false,
            model: CompanyType,
            attributes: ['companyTypename', 'companyTypeID'],
          },
        ],
      });

    const createUpdateUserIDs = new Set();
    for (let company of companyMasterData) {
      if (company.createBy) {
        createUpdateUserIDs.add(+company.createBy);
      }
      if (company.updateBy) {
        createUpdateUserIDs.add(company.updateBy);
      }
    }

    const findAllUserData = await UserMaster.findAll({
      where: {
        userMasterID: [...createUpdateUserIDs],
      },
      attributes: userAttributes,
    });
    if (exportData) {
      const finalData = [];
      for (let company of companyMasterData) {
        let parentCompanyName = '';
        if (company.parentCompanyMasterID != 0) {
          const parentcompany = companyMasterData.find(
            (e) => e.companyMasterID == +company.parentCompanyMasterID
          );
          parentCompanyName = parentcompany ? parentcompany.companyName : '';
        }

        const createByUser =
          company.createBy && findAllUserData && findAllUserData.length > 0
            ? findAllUserData.find((e) => e.userMasterID == company.createBy)
            : null;
        const updateByUser =
          company.updateBy && findAllUserData && findAllUserData.length > 0
            ? findAllUserData.find((e) => e.userMasterID == company.updateBy)
            : null;
        const companyDataObject = {
          'Parent Company Name': parentCompanyName,
          'Company Name': company.companyName,
          'Company E-Mail': company.companyEmail,
          'Company WebSite': company.companyWebsite,
          'Company Type': company.companyType?.companyTypename,
          'Company Owner Name': company.ownerName,
          'Company Father Name': company.ownerFatherName,
          'Company Contact Person Name': company.cpName,
          'Company Contact Person Mobile No.': company.cpMobileNo,
          'Company Contact Person E-mail': company.cpEmail,
          'Company Address': company.companyAddress,
          'Company Country':
            company.cityMaster?.stateMaster?.countryMaster?.countryName,
          'Company State': company.cityMaster?.stateMaster?.stateName,
          'Company City': company.cityMaster?.cityName,
          'Pan Number': company.panNumber,
          'Tan Number': company.tanNumber,
          'CIN Number': company.cinNumber,
          'TDS Deduction': company.tdsdeduction == true ? 'YES' : 'NO',
          'SubScription Plan Name':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].productMaster.productName
              : '',
          'SubScription Plan Code':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].productMaster.productCode
              : '',
          'SubScription Start Date':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? moment(
                  company.companySubscriptions[0].startDate,
                  'YYYY-MM-DD'
                ).format('DD-MM-YYYY')
              : '',
          'SubScription End Date':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? moment(
                  company.companySubscriptions[0].endDate,
                  'YYYY-MM-DD'
                ).format('DD-MM-YYYY')
              : '',
          'SubScription Users':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].totalUser
              : '',
          'SubScription Total Traking Users':
            company.companySubscriptions &&
            company.companySubscriptions.length > 0
              ? company.companySubscriptions[0].totalTracking
              : '',
          'Company Created By': createByUser ? createByUser.displayName : '',
          'Company Updated By': updateByUser ? updateByUser.displayName : '',
          Status: company.status == 1 ? 'Active' : 'De-Active',
        };
        finalData.push(companyDataObject);
      }

      await generateExcel(finalData, 'Company', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: companyMasterData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
