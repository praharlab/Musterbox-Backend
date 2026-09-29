/** @format */

const UserMaster = require('../models/userMaster');
const message = require('../response_message/message');
const bcrypt = require('bcrypt');
const readXlsxFile = require('read-excel-file/node');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const companyMasters = require('../models/companyMaster');
const EmployeeShift = require('../models/employeeShift');
const Shift = require('../models/shift');
const EmployeeSalarypolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const UserAddress = require('../models/userAddress');
const UserSkills = require('../models/userSkills');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeWeekOff = require('../models/employeeWeekOff');
const EmployeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const sequelize = require('../config/database');
const CompanySubscriptionMaster = require('../models/subscriptionPlan');
const Designation = require('../models/designation');
const EmployeeReportTo = require('../models/employeeReportTo');
const Department = require('../models/department');
const CityMaster = require('../models/citymaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const BankMaster = require('../models/bankMaster');
const BranchMaster = require('../models/branchMaster');
const weekOffPolicy = require('../models/weekOffPolicy');
const holidayPolicy = require('../models/holidayPolicy');
const { executeQuery } = require('./common.controller');

const jwt = require('jsonwebtoken');

const GradeStructure = require('../models/gradeStructure');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const HrSalaryMaster = require('../models/hrSalaryMaster');
const StateMaster = require('../models/statemaster');
const Employeeemployeement = require('../models/employeeEmployeement');

const HrSalaryTransaction = require('../models/hrSalaryTransaction');

const RoleMaster = require('../models/roleMaster');
const companyMaster = require('../models/companyMaster');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const fs = require('fs');
const UserRole = require('../models/userRole');
const GatePassAuthorizationRequest = require('../models/gatePassAuthorization');
const EmployeeGatepass = require('../models/employeeGatepass');

const {
  Nationality,
  PayrollFrequencyType,
  allowedAttendanceSources,
  authorizationMasterTypes,
  roleType,
  FileUploadType,
  SkillCategoryType,
} = require('../utils/dbUtils');
const UserFamily = require('../models/userfamily');
const UserReportTO = require('../models/employeeReportTo');
const CompanyDocument = require('../models/companyDocument');
const EmployeeAttendance = require('../models/employeeAttendancePolicy');
const EmployeeHolidayPolicyModel = require('../models/employeeHolidayPolicy');
const EmployeeDigitalSignature = require('../models/employeeDigitalSignature');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const HRSalaryMaster = require('../models/hrSalaryMaster');
const path = require('path');

const {
  isValidDate,
  getUserSalaryMasterByMonth,
  assignSalaryStructure,
  employeeWeekoffPolicy,
  employeeHolidayPolicy,
  employeeDesignation,
  employeeBranch,
  employeeDepartment,
  asiaKolkataDateTime,
  sendNotification,
  accessibleUsers,
  getHolidayDates,
  ToformatAddress,
  destroyLeaveAuthAndApprovedLeaveAuth,
  add_WeekOffHoliday_With_Transaction,
} = require('../utils/commonUtilFunctions');

const {
  generateExcel,
  generateAuthorozationExcel,
  generateAuthorozationExcelWithUserData,
  createZipFileForProfilePics,
} = require('../utils/exportData');
const CountryMaster = require('../models/countrymaster');
const UserDocument = require('../models/userDocument');
const { userAttributes, companyAttributes } = require('../utils/commonVars');

const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const UserLeave = require('../models/userleave');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const UserInbox = require('../models/UserInbox');
const ExpenseAuthorizationRequest = require('../models/expenseAuthorization');
const UserExpense = require('../models/userExpense');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const OvertimeCalculation = require('../models/overTimeCalculation');
const OvertimeAuthorization = require('../models/overtimeAuthorization');
const UserResignation = require('../models/resignation');
const ResignationAuth = require('../models/resignationAuthorization');
const LeaveAuthorizationRequest = require('../models/leaveAuthorization');
const overTimeCalculation = require('../models/overTimeCalculation');
const overtimeAuthorizationRequest = require('../models/overtimeAuthorization');
const moment = require('moment');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');
const attendanceTransaction = require('../models/attendanceTransaction');

const EmployeeFoodAllowancePolicy = require('../models/employeeFoodAllowancePolicy');
const FoodAllowancePolicy = require('../models/foodAllowancePolicy');
const EmployeeAttendanceBonusPolicy = require('../models/empattandancebonuspolicy');
const AttendanceBonusPolicy = require('../models/attendanceBonusPolicy');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const EmployeeWorkingLocation = require('../models/employeeWorkingLocation');
const WorkingLocation = require('../models/workingLocation');
const employeeLeavePolicy = require('../models/employeeLeavePolicy');
const HRSalaryFields = require('../models/hrSalaryFields');
const userFamily = require('../models/userfamily');
const UserEducation = require('../models/userEducation');
const UserExperience = require('../models/userExperience');
const empLeavePolicy = require('../models/empLeavePolicy');
const coffMaster = require('../models/coffMaster');
const CompensatoryOffAuthorization = require('../models/compensatoryOffAuthorization');
const AttendanceCorrectionRequest = require('../models/attendanceCorrectionRequest');
const AttendanceCorrectionAuthorization = require('../models/attendanceCorrectionAuthorization');
const BankBranch = require('../models/bankBranch');
const JoiningDocument = require('../models/joiningDocument');
const UserShortLeave = require('../models/userShortLeave');
const ShortLeaveAuthorization = require('../models/shortLeaveAuthorization');
const DistrictMaster = require('../models/districtMaster');
const EmployeeSkillCategory = require('../models/employeeSkillCategory');
const EmployeeProject = require('../models/employeeProject');
const Project = require('../models/project');
const Contractor = require('../models/contractor');
const {
  convertNameToLocalName,
  pihMobileNo,
  othernumberLabel,
  showPayrollFrequency,
} = require('../utils/labelUtils');
const { required } = require('@hapi/joi');
const EmployeeShortLeavePolicy = require('../models/employeeShortLeavePolicy');
const ShortLeave = require('../models/shortLeave');
const Payheadmaster = require('../models/payhead');
const Corporation = require('../models/corporation');
const { Translate } = require('@google-cloud/translate').v2;

exports.postAddCompanyContact = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const salt = await bcrypt.genSalt(10);
    const formData = req.body;
    let {
      firstName,
      middleName,
      lastName,
      displayName,
      userNumber,
      gender,
      dob,
      maratialStatus,
      physicalDisability,
      isonboarding,
      companyMasterID,
      email,
      branchMasterID,
      applicableDatebranch,
      departmentID,
      applicableDatedepartment,
      designationID,
      applicableDatedesignation,
      roleMasterID,
      dob1,
      joiningDate,
      biometricCode,
      biometricSerialNo,
      overtime,
      preboardingID,
      otherContactNumber,
      admin,
      attendanceFrom,
      employeeType,
      joiningDocumentData,
      userNumberCountryMasterID,
      officalEmail,
      cugNumber,
    } = await req.body;
    const files = req.files;

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
      // companyMasterID: { companyMasterID },
      status: 1,
    };
    if (+existCompanyData.parentCompanyMasterID != 0) {
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
      // For Child Company
      condition[Sequelize.Op.or] = [
        {
          parentCompanyMasterID: +companyMasterID,
        },
        {
          companyMasterID: +companyMasterID,
        },
      ];
      // condition.parentCompanyMasterID = existCompanyData.companyMasterID;
    }
    const companyData = await companyMasters.findAll({
      where: condition,
      include: [
        {
          required: false,
          model: CompanySubscriptionMaster,
          where: { status: 1 },
        },
      ],
    });
    const findParentCompany = companyData.find(
      (e) => +e.parentCompanyMasterID == 0
    );
    const companyMasterIDs = companyData.map((e) => +e.companyMasterID);

    const companySubscription =
      findParentCompany?.companySubscriptions?.[0] || null;

    if (companySubscription) {
      const totalCompanyUser = await UserMaster.count({
        raw: true,
        where: {
          companyMasterId: {
            [Sequelize.Op.in]: companyMasterIDs,
          },
          status: 1,
        },
      });

      if (totalCompanyUser >= companySubscription.totalUser) {
        return res.json({
          status: 401,
          message:
            'Your user limit has been reached. Please upgrade your plan.',
        });
      }
    } else {
      return res.json({
        status: 401,
        message: message.usermessage.usersubscribeplan,
      });
    }

    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('joiningDocumentMasterID')
    ).length;
    const joiningDocumnetData = [];
    let attachmentIndex = 0;
    for (let i = 0; i < entryCount; i++) {
      joiningDocumnetData.push({
        fromDate: formData[`fromDate${i}`],
        issueDate: formData[`issueDate${i}`],
        expiryDate: formData[`expiryDate${i}`],
        identificationNumber: formData[`identificationNumber${i}`],
        joiningDocumentMasterID: +formData[`joiningDocumentMasterID${i}`],
        designationWiseDocumentID: +formData[`designationWiseDocumentID${i}`],
        attachment:
          formData[`isChanged${i}`] === '0'
            ? [formData[`attachment${i}`]]
            : [
                'uploads/user/document/' +
                  files.attachment[attachmentIndex].filename,
              ],
        status: 1,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      });
      if (formData[`isChanged${i}`] != '0') {
        attachmentIndex++;
      }
    }
    let companyMasterId = companyMasterID;
    let branchID = branchMasterID;
    const mobile_number = await UserMaster.findOne({
      where: { userNumber: userNumber, status: 1 },
    });
    if (mobile_number) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.mobilealreadyexist,
        data: {},
      });
    } else {
      const password = bcrypt.hashSync(req.body.password, salt);
      let photo = '';
      if (files && files.photo) {
        photo = files.photo.filename;
      }

      let resetpassword = 1;
      if (companyMasterId == 165 || companyMasterId == 166) {
        resetpassword = 0;
      }
      let localFName = null;
      let localMName = null;
      let localLName = null;
      let localDisplayName = null;
      if (convertNameToLocalName) {
        if (
          companyMasterID == 744 ||
          companyMasterID == 965 ||
          companyMasterID == 968 ||
          companyMasterID == 969 ||
          companyMasterID == 970 ||
          companyMasterID == 971 ||
          companyMasterID == 998 ||
          companyMasterID == 999 ||
          companyMasterID == 1000
        ) {
          try {
            const translate = new Translate({
              key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
            });

            const response = await translate.translate(
              [firstName, middleName ? middleName : '', lastName],
              {
                from: 'en', // Explicitly specify English as the source
                to: 'mr',
                format: 'text',
                model: 'base',
              }
            );

            // Extract transliterated values
            localFName = response[0]?.[0] || null;
            localMName = response[0]?.[1] || null;
            localLName = response[0]?.[2] || null;

            localDisplayName = localMName
              ? `${localFName} ${localMName} ${localLName}`
              : `${localFName} ${localLName}`;
          } catch (error) {
            console.error('Error in translation:', error);
          }
        }
      }
      const createdUserData = await UserMaster.create(
        {
          firstName,
          middleName: middleName ? middleName : null,
          lastName,
          displayName,
          userNumber,
          photo,
          gender,
          dob,
          maratialStatus,
          physicalDisability,
          isonboarding,
          companyMasterId,
          password: password,
          email: email,
          admin: admin ? admin : 0,
          status: '1',
          resetpassword: resetpassword,
          preboardingID,
          otherContactNumber,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
          userNumberCountryMasterID: +userNumberCountryMasterID
            ? +userNumberCountryMasterID
            : null,
          localFName,
          localMName,
          localLName,
          localDisplayName,
          officalEmail,
          cugNumber,
        },
        { transaction }
      );
      const createQueryArray = [];
      // let update_data = await sequelize.transaction(async (t) => {
      if (branchID && applicableDatebranch) {
        createQueryArray.push(
          EmployeeBranch.create(
            {
              userMasterID: createdUserData.userMasterID,
              branchID: +branchID,
              applicableDate: new Date(applicableDatebranch),
              status: '1',
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          )
        );
      }
      if (departmentID && applicableDatedepartment) {
        createQueryArray.push(
          EmployeeDepartment.create(
            {
              userMasterID: createdUserData.userMasterID,
              departmentID: +departmentID,
              applicableDate: new Date(applicableDatedepartment),
              status: '1',
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          )
        );
      }
      if (designationID && applicableDatedesignation) {
        createQueryArray.push(
          EmployeeDesignation.create(
            {
              userMasterID: createdUserData.userMasterID,
              designationID: +designationID,
              applicableDate: new Date(applicableDatedesignation),
              status: '1',
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          )
        );
      }
      if (roleMasterID) {
        createQueryArray.push(
          UserRole.create(
            {
              userMasterID: createdUserData.userMasterID,
              roleMasterID,
            },
            { user: req.userDetails, transaction }
          )
        );
      }

      if (
        dob1 ||
        joiningDate ||
        biometricCode ||
        biometricSerialNo ||
        overtime
      ) {
        // biometricSerialNo = biometricSerialNo.join(',');
        biometricSerialNo =
          biometricSerialNo &&
          biometricSerialNo != 'undefined' &&
          Array.isArray(biometricSerialNo)
            ? biometricSerialNo.join(',')
            : biometricSerialNo && biometricSerialNo != 'undefined'
              ? [biometricSerialNo].join(',')
              : null;

        createQueryArray.push(
          EmployeeJoiningDetails.create(
            {
              userMasterID: createdUserData.userMasterID,
              dob: dob1,
              joiningDate: joiningDate,
              attendanceFrom,
              biometricCode: biometricCode,
              nameAsBank: displayName,
              biometricSerialNo: biometricSerialNo,
              overtime: overtime,
              employeeType,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          )
        );
      }
      if (joiningDocumnetData.length > 0) {
        const createData = [];
        for (doc of joiningDocumnetData) {
          const create = {
            attachment: [doc.attachment],
            fromDate: doc.fromDate && doc.fromDate != '' ? doc.fromDate : null,
            issueDate:
              doc.issueDate && doc.issueDate != '' ? doc.issueDate : null,
            expiryDate:
              doc.expiryDate && doc.expiryDate != '' ? doc.expiryDate : null,
            identificationNumber: doc.identificationNumber,
            userMasterID: createdUserData.userMasterID,
            joiningDocumentMasterID: doc.joiningDocumentMasterID,
            designationWiseDocumentID: doc.designationWiseDocumentID,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          };
          createData.push(create);
        }
        if (createData.length > 0) {
          createQueryArray.push(
            JoiningDocument.bulkCreate(createData, {
              hooks: false,
              transaction,
            })
          );
        }
      }
      // });
      await Promise.all(createQueryArray);
      const data = {
        email: createdUserData.email,
        mobile: createdUserData.userNumber,
        password: req.body.password,
      };

      await transaction.commit();
      return res.status(200).json({
        status: 200,
        message: message.usermessage.companycontact,
        data: [],
        user: createdUserData,
      });
    }
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAllcompanycontact = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, companyMasterID } = await req.body;

    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    condition.status = ['0', '1'];

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterId = companyMasterID;
    }

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
      ];
    }

    const { rows: company_contact, count } = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false, false),
      include: [
        { model: companyMasters },
        { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
      ],
    });

    for (let user of company_contact) {
      const userRights = await UserRole.findOne({
        raw: true,
        where: {
          userMasterID: user.userMasterID,
          roleMasterID: { [Sequelize.Op.ne]: null },
        },
        include: [{ model: RoleMaster }],
      });

      if (userRights) {
        user.role = userRights['roleMaster.roleName'];
        user.roleMasterID = userRights.roleMasterID;
      } else {
        user.role = '';
        user.roleMasterID = null;
      }

      if (user['employeeJoiningDetails.employeeCode'])
        user.displayName =
          user['employeeJoiningDetails.employeeCode'] +
          ' - ' +
          user.displayName;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: company_contact,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanyContactId = async (req, res, next) => {
  try {
    let get_one_data = await UserMaster.findOne({
      where: { userMasterID: req.params.id, status: ['0', '1'] },
      include: [{ model: companyMaster }],
      raw: true,
    });

    const userRights = await UserRole.findOne({
      raw: true,
      where: {
        userMasterID: req.params.id,
        roleMasterID: { [Sequelize.Op.ne]: null },
      },
      include: [{ model: RoleMaster }],
    });

    get_one_data.role = userRights ? userRights['roleMaster.roleName'] : '';
    get_one_data.roleMasterID = userRights ? userRights.roleMasterID : null;

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateCompanyContact = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      firstName,
      middleName,
      displayName,
      lastName,
      userNumber,
      gender,
      dob,
      maratialStatus,
      physicalDisability,
      isonboarding,
      email,
      roleMasterID,
      status,
      removeFace,
      otherContactNumber,
      isPhotoLock,
      userNumberCountryMasterID,
      cugNumber,
      officalEmail,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    let get_one_data = await UserMaster.findOne({
      where: { userMasterID: userMasterID },
      include: [{ required: false, model: UserRole }],
    });

    if (!get_one_data) {
      await transaction.rollback();
      return res.status(200).json({
        status: 200,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }

    if (removeFace) {
      if (get_one_data.userFaces && get_one_data.userFaces.length != 0) {
        for (let item of get_one_data.userFaces) {
          const filePath = path.join(
            __dirname,
            `../uploads/user-faces/${item}`
          );

          fs.unlink(filePath, function (err) {
            if (err) {
              console.log(err);
            } else {
              console.log('file updated on server successfully');
            }
          });
        }
      }
    }

    const mobile_number = await UserMaster.findOne({
      where: {
        userNumber: userNumber,
        userMasterID: {
          [Sequelize.Op.ne]: userMasterID,
        },
        status: 1,
      },
    });

    if (mobile_number) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Mobile Number'),
        data: {},
      });
    }

    const roleId =
      get_one_data.userRoles && get_one_data.userRoles.length > 0
        ? get_one_data.userRoles[0].roleMasterID
        : null;

    if (roleMasterID && roleMasterID != roleId) {
      await UserRole.destroy({
        where: {
          userMasterID: userMasterID,
        },
        hooks: true,
        individualHooks: true,
        user: req.userDetails,
        transaction,
      });

      await UserRole.create(
        {
          userMasterID,
          roleMasterID,
        },
        { user: req.userDetails, transaction }
      );
    }
    const updateData = {
      firstName,
      middleName: middleName ? middleName : null,
      lastName,
      userNumber,
      displayName,
      gender,
      dob,
      maratialStatus,
      physicalDisability: req.body.physicalDisability,
      isonboarding,
      email,
      status,
      updateBy,
      updateByIp,
      userFaces: removeFace ? null : get_one_data.userFaces,
      facePhotoArray: removeFace ? null : get_one_data.facePhotoArray,
      otherContactNumber,
      userNumberCountryMasterID: +userNumberCountryMasterID
        ? +userNumberCountryMasterID
        : null,
      localFName: null,
      localMName: null,
      localLName: null,
      localDisplayName: null,
      cugNumber,
      officalEmail,
      isPhotoLock,
    };
    if (convertNameToLocalName) {
      if (
        get_one_data.companyMasterId == 744 ||
        get_one_data.companyMasterId == 965 ||
        get_one_data.companyMasterId == 968 ||
        get_one_data.companyMasterId == 969 ||
        get_one_data.companyMasterId == 970 ||
        get_one_data.companyMasterId == 971 ||
        get_one_data.companyMasterId == 998 ||
        get_one_data.companyMasterId == 999 ||
        get_one_data.companyMasterId == 1000
      ) {
        try {
          const translate = new Translate({
            key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
          });

          const response = await translate.translate(
            [firstName, middleName ? middleName : '', lastName],
            {
              from: 'en', // Explicitly specify English as the source
              to: 'mr',
              format: 'text',
              model: 'base',
            }
          );

          // Extract transliterated values
          updateData.localFName = response[0]?.[0] || null;
          updateData.localMName = response[0]?.[1] || null;
          updateData.localLName = response[0]?.[2] || null;

          updateData.localDisplayName = localMName
            ? `${localFName} ${localMName} ${localLName}`
            : `${localFName} ${localLName}`;
        } catch (error) {
          console.error('Error in translation:', error);
        }
      }
    }
    if (req.file) {
      updateData.photo = req.file.filename;
    }
    await UserMaster.update(updateData, {
      where: { userMasterID: userMasterID },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('User'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.postDeleteCompanyContactById = async (req, res, next) => {
  try {
    let = { userMasterID } = await req.body;

    let delete_status = await UserMaster.update(
      {
        status: '2',
      },
      {
        where: { userMasterID: userMasterID, status: ['1', '0'] },
      }
    );

    let delete_reportto = await EmployeeReportTo.destroy({
      where: {
        userMasterID: userMasterID,
      },
    });

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.companycontactdelete,
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
    next(err.message);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { userMasterID, status } = await req.body;
    let change_status1;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let update_data = await sequelize.transaction(async (t) => {
      if (status == '1') {
        let get_user = await UserMaster.findOne({
          where: {
            userMasterID: userMasterID,
          },
          transaction: t,
          raw: true,
        });

        if (get_user) {
          let get_one_data = await UserMaster.findOne({
            where: {
              userNumber: get_user.userNumber,
              status: 1,
            },
            transaction: t,
            raw: true,
          });

          if (get_one_data) {
            return res.status(200).json({
              status: 401,
              message:
                'User cannot be activated, user number is already assigned to an active user',
              data: {},
            });
          } else {
            if (get_user.deactiveDate) {
              const weekoffID = await employeeWeekoffPolicy(
                userMasterID,
                currentDate
              );
              const holidayID = await employeeHolidayPolicy(
                userMasterID,
                new Date()
              );
              if (weekoffID) {
                await add_WeekOffHoliday_With_Transaction(
                  get_user.companyMasterId,
                  [userMasterID],
                  get_user.deactiveDate,
                  weekoffID.weekOffPolicyID,
                  null,
                  false,
                  weekoffID.endDate,
                  t
                );
              }

              if (holidayID) {
                await add_WeekOffHoliday_With_Transaction(
                  get_user.companyMasterId,
                  [userMasterID],
                  get_user.deactiveDate,
                  null,
                  holidayID.holidayPolicyID,
                  false,
                  holidayID.endDate,
                  t
                );
              }
            }
          }
        }

        change_status1 = await UserMaster.update(
          {
            status: '1',
            deactiveDate: null,
          },
          {
            where: { userMasterID: userMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        change_status1 = await UserMaster.update(
          {
            status: '0',
            deactiveDate: new Date().toISOString().slice(0, 10),
          },
          {
            where: { userMasterID: userMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );

        deactive_reportTO_parent = await EmployeeReportTo.update(
          {
            status: '0',
          },
          {
            where: { userMasterID: userMasterID },
            transaction: t,
          }
        );

        // deactive_reportTO_child = await EmployeeReportTo.update(
        //   {
        //     status: '0',
        //   },
        //   {
        //     where: { reportToID: userMasterID },
        //     transaction: t,
        //   }
        // );
      }

      if (change_status1 != 0) {
        return res.status(200).json({
          status: 200,
          message: message.usermessage.companydelete,
          data: {},
        });
      } else {
        return res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanyContactByCompanyId = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;
    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterId = companyMasterID;
    }

    condition.status = 1;
    if (startdate && enddate)
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          displayName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          userNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const AllUser = await UserMaster.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false, false),
      order,
      include: [
        { model: companyMaster },
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date() },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date() } },
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
      ],
    });

    for (var user of AllUser.rows) {
      if (
        user.employeeDesignations &&
        user.employeeDesignations.length &&
        user.employeeDesignations[0].designation &&
        user.employeeDesignations[0].designation.designationName
      ) {
        user.dataValues.designation =
          user.employeeDesignations[0].designation.designationName;
      } else {
        user.dataValues.designation = '';
      }
    }
    return res
      .status(200)
      .json({ status: 200, data: AllUser.rows, totalcount: AllUser.count });
  } catch (err) {
    next(err);
  }
};

exports.postGetUserList = async (req, res, next) => {
  try {
    let company_contact = await UserMaster.findAll({
      raw: true,
      where: {
        status: 1,
        companyMasterId: req.body.companyMasterID,
      },
      ...accessibleUsers(req.userDetails, false, false),
      include: [
        { model: companyMaster },
        { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
      ],
    });

    for (let item of company_contact) {
      if (item['employeeJoiningDetails.employeeCode'])
        item.displayName =
          item['employeeJoiningDetails.employeeCode'] +
          ' - ' +
          item.displayName;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: company_contact,
    });
  } catch (err) {
    next(err);
  }
};

exports.filteruser = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      companyMasterID,
      branchMasterID,
      department,
      designation,
      searchQuery,
      status,
    } = req.body;

    // const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const date = new Date().toISOString().slice(0, 10);

    let query = `
    SELECT DISTINCT um."userMasterID",um."displayName",empjoing."employeeCode", um."userNumber",um."photo",um."status",cm."companyName" from "userMasters" as um  inner join "companyMasters" as cm on um."companyMasterId"=cm."companyMasterID" LEFT join "employeeJoiningDetails" as empjoing on um."userMasterID" = empjoing."userMasterID"`;

    if (department)
      query += `inner join "employeeDepartments" as edep on edep."userMasterID"=um."userMasterID" `;

    if (designation)
      query += `inner join "employeeDesignations" as edes on edes."userMasterID"=um."userMasterID" `;

    if (branchMasterID)
      query += `inner join "employeeBranches" as ebr on ebr."userMasterID"=um."userMasterID" `;

    if (companyMasterID)
      query += `where um."companyMasterId"=` + +companyMasterID;

    if (+status == 1) query += ` and um."status"=1`;
    else if (status == '0') query += ` and um."status"=0`;
    else query += ` and um."status"=1`;

    if (department)
      query +=
        ` and edep."applicableDate"<='` +
        date +
        `' and (edep."endDate">='` +
        date +
        `' or edep."endDate" is NULL) and edep."status"=1 and edep."departmentID"=` +
        +department;

    if (designation)
      query +=
        ` and edes."applicableDate"<='` +
        date +
        `' and (edes."endDate">='` +
        date +
        `' or edes."endDate" is NULL) and edes."status"=1 and edes."designationID"=` +
        +designation;

    if (branchMasterID)
      query +=
        ` and ebr."applicableDate"<='` +
        date +
        `' and (ebr."endDate">='` +
        date +
        `' or ebr."endDate" is NULL) and ebr."status"=1 and ebr."branchID"=` +
        +branchMasterID;

    if (searchQuery)
      query +=
        `and (LOWER(um."displayName") LIKE '%` +
        searchQuery.toLowerCase() +
        `%' or um."userNumber" like '%` +
        searchQuery.toLowerCase() +
        `%' or LOWER(empjoing."employeeCode") like '%` +
        searchQuery.toLowerCase() +
        `%')`;

    let userData,
      totalcount = 0;
    if (page && limit) {
      totalcount = await executeQuery(query);
      totalcount = totalcount.length;

      let offset = (page - 1) * limit;
      query += ` limit ` + limit + ` OFFSET ` + offset;

      userData = await executeQuery(query);
    } else {
      userData = await executeQuery(query);
      totalcount = userData.length;
    }

    for (const item of userData) {
      const depart = await employeeDepartment(item.userMasterID, date);
      const desig = await employeeDesignation(item.userMasterID, date);
      const branch1 = await employeeBranch(item.userMasterID, date);

      item.department = depart ? depart['department.departmentName'] : '';
      item.designation = desig ? desig['designation.designationName'] : '';
      item.branch = branch1 ? branch1['branchMaster.branchName'] : '';
    }

    return res.status(200).json({
      status: 200,
      message: 'Users got successfully',
      data: userData,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAllSUPERADMIN = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const AllSuperAdmin = await UserMaster.findAndCountAll({
      raw: true,
      where: { status: [0, 1], admin: 2 },
      ...paginationQuery,
      include: [{ model: companyMaster }],
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: AllSuperAdmin.rows,
      totalcount: AllSuperAdmin.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postCheckUser = async (req, res, next) => {
  try {
    const companyid = [];
    companyid.push(parseInt(req.body.companyMasterID));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.body.companyMasterID, status: 1 },
    });

    if (get_one_data == []) {
      let companyid = [];
      let get_one_data1 = await companyMasters.findOne({
        where: { userMasterID: req.body.companyMasterID, status: 1 },
      });
      companyid.push(get_one_data1.parentCompanyMasterID);
      let get_one_data2 = await companyMasters.findAll({
        where: {
          parentCompanyMasterID: get_one_data1.parentCompanyMasterID,
          status: 1,
        },
      });
      for (let i = 0; i < get_one_data2.length; i++) {
        companyid.push(get_one_data2[i].companyMasterID);
      }
    } else {
      for (let i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
    }

    let dataforchild = await companyMasters.findOne({
      where: { companyMasterID: req.body.companyMasterID, status: 1 },
    });
    let check_tracking;
    if (dataforchild.parentCompanyMasterID == 0) {
      check_tracking = await CompanySubscriptionMaster.findOne({
        attributes: ['totalUser'],
        where: {
          companyMasterID: req.body.companyMasterID,

          // [Sequelize.Op.in]: companyid,
          status: 1,
        },
      });
    } else {
      check_tracking = await CompanySubscriptionMaster.findOne({
        attributes: ['totalUser'],
        where: {
          companyMasterID: dataforchild.parentCompanyMasterID,

          // [Sequelize.Op.in]: companyid,
          status: 1,
        },
      });
    }
    const totalcount = await UserMaster.count({
      raw: true,
      where: {
        companyMasterId: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },
    });
    check_tracking.setDataValue('totalCount', totalcount);

    if (totalcount >= check_tracking.totalUser) {
      check_tracking.setDataValue('exceed', true);
      res.status(200).json({
        status: 200,
        message: message.usermessage.userexceed,
        data: check_tracking,
      });
    } else {
      check_tracking.setDataValue('exceed', false);
      res.status(200).json({
        status: 200,
        message: message.usermessage.userallow,
        data: check_tracking,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.removeuniqueid = async (req, res, next) => {
  try {
    upate_uniqueid = await UserMaster.update(
      {
        uniqueID: null,
      },
      {
        where: { userMasterID: req.body.userMasterIDw },
      }
    );
    res.status(200).json({
      status: 200,
      message: message.usermessage.uniqueidremove,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.changeallpassword = async (req, res, next) => {
  try {
    let users = await UserMaster.findAll({});
    for (var i = 0; i < users.length; i++) {
      const salt = await bcrypt.genSalt(10);
      let userpassword = await UserMaster.update(
        {
          password: bcrypt.hashSync(
            users[i].firstName.substring(0, 4).toLowerCase() +
              '' +
              String(users[i].userNumber).slice(-4),
            salt
          ),
        },
        {
          where: { userMasterID: users[i].userMasterID },
        }
      );
    }
    res
      .status(200)
      .json({ status: 200, message: 'SuccessFully Updated.', data: {} });
  } catch (err) {
    next(err.message);
  }
};

exports.getAllcontact = async (req, res, next) => {
  try {
    let results = [];
    if (req.body.companyMasterID) {
      req.userDetails.accessibleCompanies = req.body.companyMasterID;
      results = await UserMaster.findAll({
        raw: true,
        where: {
          status: 1,
          companyMasterId: req.body.companyMasterID,
        },
        ...accessibleUsers(req.userDetails, false, false),
        include: [
          { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
        ],
      });
    }
    for (let user of results) {
      if (user['employeeJoiningDetails.employeeCode'])
        user.displayName =
          user['employeeJoiningDetails.employeeCode'] +
          ' - ' +
          user.displayName;
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllBranchcontact = async (req, res, next) => {
  try {
    let branch_contact;
    let userid = [];
    let user;
    let date = new Date().toISOString().slice(0, 10);

    if (req.body.branchMasterID) {
      branch_contact = await EmployeeBranch.findAll({
        raw: true,
        where: {
          status: 1,
          branchID: req.body.branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          endDate: {
            [Sequelize.Op.eq]: null,
          },
        },
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
          },
          {
            model: UserMaster,
            as: 'employee',
            include: companyMasters,
          },
        ],
      });
      for (let i = 0; i < branch_contact.length; i++) {
        userid.push(branch_contact[i].userMasterID);
      }

      branch_contact = await EmployeeBranch.findAll({
        raw: true,
        where: {
          status: 1,
          branchID: req.body.branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          endDate: {
            [Sequelize.Op.gte]: new Date(date),
          },
        },
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
          },
          {
            model: UserMaster,
            as: 'employee',
            include: companyMasters,
          },
        ],
      });
      for (var i = 0; i < branch_contact.length; i++) {
        userid.push(branch_contact[i].userMasterID);
      }

      user = await UserMaster.findAll({
        raw: true,
        where: {
          status: 1,
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
          companyMasterId: req.body.companyMasterID,
        },

        include: [
          { model: companyMasters },
          { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
        ],
      });
    }

    for (var user1 of user) {
      if (user1['employeeJoiningDetails.employeeCode'])
        user1.displayName =
          user1['employeeJoiningDetails.employeeCode'] +
          ' - ' +
          user1.displayName;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.employeepolicy = async (req, res, next) => {
  try {
    const { userMasterID, page, limit, Export } = await req.body;
    const condition = {
      userMasterID: userMasterID,
      status: 1,
    };
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows: user, count } = await UserMaster.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false, false),

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
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID', 'applicableDate'],
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
          model: EmployeeShift,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['shiftsID', 'startDate', 'shiftID'],
        },

        {
          model: EmployeeWorkingLocation,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['workingLocationIDs', 'startDate'],
        },

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
          separate: true,
          attributes: ['divisionId', 'startDate'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },

        {
          model: EmployeeWorkingArea,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          separate: true,
          attributes: ['workingAreaId', 'startDate'],
          include: [
            {
              model: WorkingArea,
              attributes: ['workingAreaName'],
            },
          ],
        },

        {
          model: EmployeeAttendancePolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['attendancePolicyID', 'startDate'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
              attributes: ['attendancePolicyName'],
            },
          ],
        },
        {
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
          separate: true,
          attributes: ['salaryPolicyID', 'startDate'],
          include: [
            {
              model: SalaryPolicy,
              as: 'salaryPolicy',
              attributes: ['salaryPolicyName'],
            },
          ],
        },
        {
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['weekOffPolicyID', 'applicableDate'],
          include: [
            {
              model: weekOffPolicy,
              as: 'weekoff',
              attributes: ['weekOffPolicyName'],
            },
          ],
        },
        {
          model: EmployeeHolidayPolicy,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['holidayPolicyID', 'applicableDate'],
          include: [
            {
              model: holidayPolicy,
              as: 'HolidayPolicy',
              attributes: ['holidayPolicyName'],
            },
          ],
        },
        {
          model: EmployeeLateEarlyPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['lateEarlyPolicyMasterID', 'startDate'],
          include: [
            {
              model: LateEarlyPolicy,
              as: 'lateEarlyPolicy',
              attributes: ['lateEarlyPolicyName'],
            },
          ],
        },
        {
          model: EmployeeAttendanceBonusPolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['attendanceBonusPolicyId', 'startDate'],
          include: [
            {
              model: AttendanceBonusPolicy,
              attributes: ['attendanceBonusPolicyName'],
            },
          ],
        },
        {
          model: EmployeeFoodAllowancePolicy,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          separate: true,
          attributes: ['foodAllowancePolicyId', 'startDate'],
          include: [
            {
              model: FoodAllowancePolicy,
              attributes: ['foodAllowancePolicyName'],
            },
          ],
        },

        // Projects
        // Employee project
        {
          required: false,
          model: EmployeeProject,
          where: {
            startDate: {
              [Sequelize.Op.lte]: currentDate,
            },
            [Sequelize.Op.or]: [
              {
                releaseDate: {
                  [Sequelize.Op.gte]: currentDate,
                },
              },
              {
                releaseDate: {
                  [Sequelize.Op.eq]: null,
                },
              },
            ],
          },
          include: [{ model: Project }],
        },

        // Employee Leave Policy
        {
          model: empLeavePolicy,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['employeeLeavePolicyID', 'applicableDate'],
        },

        // Employee Short Leave Policy
        {
          model: EmployeeShortLeavePolicy,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          separate: true,
          attributes: ['shortLeavePolicyID', 'applicableDate'],
          include: [
            {
              model: ShortLeave,
              attributes: ['shortLeaveName'],
            },
          ],
        },
      ],
      attributes: [
        'userMasterID',
        'displayName',
        'userNumber',
        'companyMasterId',
      ],
    });

    const companyId = user?.[0]?.companyMasterId || null;

    let allShiftData = [],
      allWorkingLocationData = [],
      allLeavePolicyData = [];

    if (companyId) {
      [allShiftData, allWorkingLocationData, allLeavePolicyData] =
        await Promise.all([
          // allShiftData
          Shift.findAll({
            raw: true,
            where: {
              companyMasterID: companyId,
            },
          }),
          // allWorkingLocationData
          WorkingLocation.findAll({
            raw: true,
            where: {
              companyMasterID: companyId,
            },
          }),
          // allLeavePolicyData
          employeeLeavePolicy.findAll({
            raw: true,
            where: {
              companyMasterId: companyId,
            },
          }),
        ]);
    }

    const finalData = await Promise.all(
      user.map(async (e) => {
        let shiftNames = '',
          workingLocation = '',
          leavePolicyName = '';
        if (e.employeeShifts.length > 0) {
          if (e.employeeShifts[0].shiftID) {
            shiftNames = allShiftData
              .filter((d) => d.shiftID == e.employeeShifts[0].shiftID)
              .map((s) => s.shiftName)
              .join(',');
          }

          if (e.employeeShifts[0].shiftsID) {
            shiftNames = allShiftData
              .filter((d) =>
                [...e.employeeShifts[0].shiftsID].includes(d.shiftID.toString())
              )
              .map((s) => s.shiftName)
              .join(',');
          }
        }

        if (e.employeeWorkingLocations.length > 0) {
          workingLocation = allWorkingLocationData
            .filter((w) =>
              [...e.employeeWorkingLocations[0].workingLocationIDs].includes(
                w.workingLocationID
              )
            )
            .map((s) => s.workingLocationName)
            .join(',');
        }

        if (e.empLeavePolicies.length > 0) {
          leavePolicyName = allLeavePolicyData
            .filter((l) =>
              [...e.empLeavePolicies[0].employeeLeavePolicyID].includes(l.id)
            )
            .map((s) => s.leavePolicyName)
            .join(',');
        }

        const projectNames =
          (e.employeeProjects || [])
            .map((p) => p.project?.projectName)
            .join(',') || '';

        return {
          ...(!Export && { userMasterID: e.userMasterID }),
          'Employee Name': e.displayName,
          Number: e.userNumber,
          'Branch Assign Date':
            e.employeeBranches.length > 0
              ? e.employeeBranches[0].applicableDate
              : '',
          'Branch Name':
            e.employeeBranches.length > 0
              ? e.employeeBranches[0].branchMaster.branchName
              : '',
          'Department Assign Date':
            e.employeeDepartments.length > 0
              ? e.employeeDepartments[0].applicableDate
              : '',
          'Department Name':
            e.employeeDepartments.length > 0
              ? e.employeeDepartments[0].department.departmentName
              : '',
          'Designation Assign Date':
            e.employeeDesignations.length > 0
              ? e.employeeDesignations[0].applicableDate
              : '',
          'Designation Name':
            e.employeeDesignations.length > 0
              ? e.employeeDesignations[0].designation.designationName
              : '',
          'Division Assign Date':
            e.employeeDivisions.length > 0
              ? e.employeeDivisions[0].startDate
              : '',
          'Division Name':
            e.employeeDivisions.length > 0
              ? e.employeeDivisions[0].division.divisionName
              : '',
          'WorkingArea Assign Date':
            e.employeeWorkingAreas.length > 0
              ? e.employeeWorkingAreas[0].startDate
              : '',
          'WorkingArea Name':
            e.employeeWorkingAreas.length > 0
              ? e.employeeWorkingAreas[0].workingArea.workingAreaName
              : '',
          'WorkingLocation Assign Date':
            e.employeeWorkingLocations.length > 0
              ? e.employeeWorkingLocations[0].startDate
              : '',
          'WorkingLocation Name': workingLocation,
          'Shift Assign Date':
            e.employeeShifts.length > 0 ? e.employeeShifts[0].startDate : '',
          'Shift Name': shiftNames,
          Project: projectNames,
          'Leave Policy Assign Date':
            e.empLeavePolicies.length > 0
              ? e.empLeavePolicies[0].applicableDate
              : '',
          'Leave Policy Name': leavePolicyName,
          'ShortLeave Policy Assign Date':
            e.employeeShortLeavePolicies.length > 0
              ? e.employeeShortLeavePolicies[0].applicableDate
              : '',
          'ShortLeave Policy Name':
            e.employeeShortLeavePolicies?.[0]?.shortLeave?.shortLeaveName,
          'Attendance Policy Assign Date':
            e.employeeAttendancePolicies.length > 0
              ? asiaKolkataDateTime(
                  e.employeeAttendancePolicies[0].startDate
                ).slice(0, 10)
              : '',
          'Attendance Policy Name':
            e.employeeAttendancePolicies.length > 0
              ? e.employeeAttendancePolicies[0].attendancePolicy
                  .attendancePolicyName
              : '',
          'Salary Policy Assign Date':
            e.employeeSalaryPolicies.length > 0
              ? e.employeeSalaryPolicies[0].startDate
              : '',
          'Salary Policy Name':
            e.employeeSalaryPolicies.length > 0
              ? e.employeeSalaryPolicies[0].salaryPolicy.salaryPolicyName
              : '',
          'WeekOff Policy Assign Date':
            e.employeeWeekOffs.length > 0
              ? e.employeeWeekOffs[0].applicableDate
              : '',
          'WeekOff Policy Name':
            e.employeeWeekOffs.length > 0
              ? e.employeeWeekOffs[0].weekoff.weekOffPolicyName
              : '',
          'Holiday Policy Assign Date':
            e.employeeHolidayPolicies.length > 0
              ? asiaKolkataDateTime(
                  e.employeeHolidayPolicies[0].applicableDate
                ).slice(0, 10)
              : '',
          'Holiday Policy Name':
            e.employeeHolidayPolicies.length > 0
              ? e.employeeHolidayPolicies[0].HolidayPolicy.holidayPolicyName
              : '',
          'LC-EG Policy Assign Date':
            e.employeeLateEarlyPolicies.length > 0
              ? e.employeeLateEarlyPolicies[0].startDate
              : '',
          'LC-EG Policy Name':
            e.employeeLateEarlyPolicies.length > 0
              ? e.employeeLateEarlyPolicies[0].lateEarlyPolicy
                  .lateEarlyPolicyName
              : '',
          'Attendance Bonus Policy Assign Date':
            e.employeeAttendanceBonusPolicies.length > 0
              ? asiaKolkataDateTime(
                  e.employeeAttendanceBonusPolicies[0].startDate
                ).slice(0, 10)
              : '',
          'Attendance Bonus Policy Name':
            e.employeeAttendanceBonusPolicies.length > 0
              ? e.employeeAttendanceBonusPolicies[0].attendanceBonusPolicy
                  .attendanceBonusPolicyName
              : '',
          'Food Allowance Policy Assign Date':
            e.employeeFoodAllowancePolicies.length > 0
              ? e.employeeFoodAllowancePolicies[0].startDate
              : '',
          'Food Allowance Policy Name':
            e.employeeFoodAllowancePolicies.length > 0
              ? e.employeeFoodAllowancePolicies[0].foodAllowancePolicy
                  .foodAllowancePolicyName
              : '',
        };
      })
    );

    if (Export)
      return await generateExcel(finalData, 'Employee Policy', 'xlsx', res);

    res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getbranchcontactBydate = async (req, res, next) => {
  try {
    let { branchMasterID, date } = await req.body;

    let branch_contact;

    branch_contact = await EmployeeBranch.findAll({
      raw: true,
      where: {
        status: 1,
        branchID: branchMasterID,
        applicableDate: {
          [Sequelize.Op.lte]: new Date(date),
        },

        [Sequelize.Op.or]: [
          { endDate: { [Sequelize.Op.eq]: null } },
          { endDate: { [Sequelize.Op.gte]: new Date(date) } },
        ],
      },
    });

    let userid = [];
    for (var i = 0; i < branch_contact.length; i++) {
      userid.push(branch_contact[i].userMasterID);
    }

    let user = await UserMaster.findAll({
      raw: true,
      where: {
        status: 1,
        userMasterID: {
          [Sequelize.Op.in]: userid,
        },
      },
      order: [['displayName', 'ASC']],
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.branchContactget,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.dashboardeEmpstatus = async (req, res, next) => {
  try {
    let finaldata = [];
    let total_employee;
    let total_active_user;
    let total_active;
    let total_deactive;
    let userid = [];
    let empjoining;

    if (req.params.id) req.userDetails.accessibleCompanies = req.params.id;

    total_employee = await UserMaster.count({
      where: {
        companyMasterId: req.params.id,
        status: ['0', '1'],
        // ...accessibleUsers(req.userDetails),
      },
    });
    total_active_user = await UserMaster.findAll({
      where: {
        companyMasterId: req.params.id,
        status: 1,
      },
      // ...accessibleUsers(req.userDetails),
    });

    for (let i = 0; i < total_active_user.length; i++) {
      userid.push(total_active_user[i].userMasterID);
    }

    empjoining = await EmployeeJoiningDetails.count({
      where: {
        userMasterID: userid,
        [Sequelize.Op.and]: [
          {
            leavingDate: {
              [Sequelize.Op.ne]: null,
            },
          },
          {
            leavingDate: {
              [Sequelize.Op.ne]: '',
            },
          },
        ],
      },
    });

    total_active = await UserMaster.count({
      where: {
        companyMasterId: req.params.id,
        status: 1,
      },
      // ...accessibleUsers(req.userDetails),
    });

    total_deactive = await UserMaster.count({
      where: {
        companyMasterId: req.params.id,
        status: 0,
      },
      // ...accessibleUsers(req.userDetails),
    });

    finaldata.push({
      total_employee: total_employee,
      total_active: total_active,
      total_deactive: total_deactive,
      total_left_employee: empjoining,
    });

    res.status(200).json({ status: 200, data: finaldata });
  } catch (err) {
    next(err);
  }
};

exports.postAddUserFaceData = async (req, res, next) => {
  try {
    let { userMasterID, facePhotoArray, updateBy, updateByIp } = await req.body;
    let facePhoto = '';
    if (req.file) {
      facePhoto = req.file.filename;
    }

    if (facePhotoArray) facePhotoArray = facePhotoArray.split(',');

    let change_data = await UserMaster.update(
      {
        facePhoto,
        facePhotoArray,
        updateBy,
        updateByIp,
      },
      {
        where: { userMasterID: userMasterID },
      }
    );
    return res
      .status(200)
      .json({ status: 200, message: 'User Photo data added Successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getAllSUBADMIN = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let company_contact;
    let totalcount;
    if (searchQuery) {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: {
          status: ['0', '1'],
          admin: 3,
          [Sequelize.Op.or]: [
            {
              displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
          ],
        },
        limit: limit,
        offset: offset,
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: {
          status: ['0', '1'],
          admin: 3,
          [Sequelize.Op.or]: [
            {
              displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
          ],
        },
      });
    } else if (page == '' && limit == '') {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: { status: 1, admin: 3 },
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: { status: ['0', '1'], admin: 3 },
      });
    } else {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: { status: ['0', '1'], admin: 3 },
        limit: limit,
        offset: offset,
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: { status: ['0', '1'], admin: 3 },
      });
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: company_contact,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

async function getctcvalue(body, companyMasterID) {
  let grade_salary_structure_data = await executeQuery(
    `

Select A.*
from(
Select 1 as sort,  Phm."payheadName" as payheadName,
                    0 as fieldDefaultPer,
                    0 as fieldFixAmount,
                    '' as gradeName,
                    0 as gradeFrom,
                    0 as gradeTo,
                    0 as gradeSalaryStructureID,
                   0 as salaryFieldID,
                   0 as gradeStructureID,
                     Phm."payheadMasterId" as payheadMasterId,
                    hsf."salaryFieldRound" as salaryFieldRound,
                    hsf."considerIn" as considerIn,
                    hsf."salaryFieldRoundNo" salaryFieldRoundNo,
                     hsf."roundOffType" as roundOffType,
					null as salaryfieldmaxrange,
                    0 as salaryFieldIndex,
                  '' as salaryFieldSide,
                    'A' as salaryFieldSrNo,
                    '' as salaryFieldFixVariable,
					'' as baseOnCalculation,
					'' as formula ,'' as formulaID,
          '{0}' as salaryFieldWhenMonth

           from  "hrSalaryFields" as hsf left outer join  "Payheadmasters" As Phm 
             on hsf."payheadMasterId"=Phm."payheadMasterId"  where  Phm."payheadMasterId" in(1,50) and hsf."companyMasterID"=` +
      companyMasterID +
      `             

union ALL
Select  2 as sort, Phm."payheadName" as payheadName,
                    Gss."fieldDefaultPer" as fieldDefaultPer,
                    Gss."fieldFixAmount" as fieldFixAmount,
                    Gs."gradeName" as gradeName,
                    Gs."gradeFrom" as gradeFrom,
                    Gs."gradeTo" as gradeTo,
                    Gss."gradeSalaryStructureID" as gradeSalaryStructureID,
                    Sf."salaryFieldID" as salaryFieldID,
                    Gs."gradeStructureID" as gradeStructureID,
                    Sf."payheadMasterId" as payheadMasterId,
                   Sf."salaryFieldRound" as salaryFieldRound,
                         Sf."considerIn" as considerIn,
                    Sf."salaryFieldRoundNo" as salaryFieldRoundNo,
                     Sf."roundOffType" as roundOffType,
					Gss."salaryfieldmaxrange" as salaryfieldmaxrange,
          Gss."salaryfieldindex" as salaryfieldindex,
                    Sf."salaryFieldSide" as salaryFieldSide,
                    Sf."salaryFieldSrNo" as salaryFieldSrNo,
                    Sf."salaryFieldFixVariable" as salaryFieldFixVariable,
					Gs."baseOnCalculation" as baseOnCalculation,
					Gss."formula",Gss."formulaID",Sf."salaryFieldWhenMonth"
					
                From "gradeStructures" As Gs
                Inner join "gradeSalaryStructures" As Gss On Gs."gradeStructureID" = Gss."gradeStructureID"
                Inner join "hrSalaryFields" As Sf On Gss."salaryFieldID" = Sf."salaryFieldID"
                Inner join "Payheadmasters" As Phm On Sf."payheadMasterId" = Phm."payheadMasterId"
                Where Gs."status" = 1
                   
                    And Gs."gradeStructureID" = ` +
      body.gradeid +
      `
                    ) as A 
                    
                    Order by A."sort", A."salaryfieldindex",A."payheadname"
                       `
  );

  let data = await assignSalaryStructure(
    grade_salary_structure_data,
    body.ctc,
    body.gradeid,
    body.stateid,
    body.AmountIn,
    body.userMasterID,
    body.yearmonth,
    body.gender
  );

  data = data.filter((s) => {
    return s.sort != 1;
  });

  return data;
}

exports.uploaduserExcel = async (req, res, next) => {
  try {
    let { companyMasterID, showBankBranch } = req.body;
    let mobile_number1 = [];
    let BranchCheck = [];
    let AllBranches = [];
    let DepartmentCheck = [];
    let DesignationCheck = [];
    let userContacts = [];
    let mobileArr = [];
    let employeejoining = [];
    let Empdocument = [];
    let localAddress = [];
    let PermanentAddress = [];
    let branchIDArr = [];
    let departmentIDArr = [];
    let designationIDArr = [];
    let ShiftIDArr = [];
    let AttendanceIDArr = [];
    let SalaryIDArr = [];
    let WeekoffIDArr = [];
    let HolidayIDArr = [];
    const SkillCategoryArray = [];
    const finalSkillCategoryArray = [];
    let SalaryGradeIDArr = [];
    let employeementIDArr = [];
    // let SalaryIDArr = [];
    let userid;
    let AllDepartment = [];
    let AllDesignation = [];

    let UserList = [];

    let AllHolidayPolicy = [];
    let AllWeekoffPolicy = [];
    let AllSalaryPolicy = [];
    let AllAttendancePolicy = [];
    let AllShift = [];
    let AllSalaryGrade = [];
    let AllState = [];
    let AllBank = [];
    let AllBankBranch = [];
    let finaldata = [];
    let AllContractor = [];

    let f_localAddress = [];
    let f_permanentAddress = [];
    let f_employeement = [];
    let f_shift = [];
    let f_attendance = [];
    let f_salary = [];
    let f_wekoff = [];
    let f_holiday = [];
    let f_salarymaster = [];

    const AllRoles = [];
    const f_permission = [];
    const employeeCodeArray = [];

    let check = req.body.check;

    let startdate = new Date().toISOString().slice(0, 8) + '01';

    // let createBy = req.body.createBy;
    // let createByIp = req.body.createByIp;

    mobile_number1 = await UserMaster.findAll({
      where: {
        status: 1,
      },
    });

    if (check == 0) {
      BranchCheck = await BranchMaster.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      if (BranchCheck.length == 0) {
        return res.status(200).send({
          status: 402,
          message: "You don't have any branch! Add a branch",
        });
      }

      for (var b = 0; b < BranchCheck.length; b++) {
        AllBranches.push(BranchCheck[b].branchName);
      }

      DepartmentCheck = await Department.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      if (DepartmentCheck.length == 0) {
        return res.status(200).send({
          status: 402,
          message: "You don't have any Department! Add a department",
        });
      }

      for (var d = 0; d < DepartmentCheck.length; d++) {
        AllDepartment.push(DepartmentCheck[d].departmentName);
      }

      DesignationCheck = await Designation.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      if (DesignationCheck.length == 0) {
        return res.status(200).send({
          status: 402,
          message: "You don't have any Designation! Add a desigantion",
        });
      }

      for (var e = 0; e < DesignationCheck.length; e++) {
        AllDesignation.push(DesignationCheck[e].designationName);
      }

      // check company's shift

      let ShiftCheck = await Shift.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });

      for (var s = 0; s < ShiftCheck.length; s++) {
        AllShift.push(ShiftCheck[s].shiftName);
      }
    }

    const roles = await RoleMaster.findAll({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (const item of roles) {
      AllRoles.push(item.roleName);
    }

    // check company's attendance policy

    let AttendancePolicyCheck = await AttendancePolicy.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (let a = 0; a < AttendancePolicyCheck.length; a++) {
      AllAttendancePolicy.push(AttendancePolicyCheck[a].attendancePolicyName);
    }

    // check company's salary policy

    let SalaryPolicyCheck = await SalaryPolicy.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (var sa = 0; sa < SalaryPolicyCheck.length; sa++) {
      AllSalaryPolicy.push(SalaryPolicyCheck[sa].salaryPolicyName);
    }

    // check company's weekoff policy

    let WeekoffPolicyCheck = await weekOffPolicy.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (var w = 0; w < WeekoffPolicyCheck.length; w++) {
      AllWeekoffPolicy.push(WeekoffPolicyCheck[w].weekOffPolicyName);
    }

    // check company's holiday policy

    let HolidayPolicyCheck = await holidayPolicy.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (let h = 0; h < HolidayPolicyCheck.length; h++) {
      AllHolidayPolicy.push(HolidayPolicyCheck[h].holidayPolicyName);
    }

    // check company's salary grade

    let SalaryGradeCheck = await GradeStructure.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    for (let sg = 0; sg < SalaryGradeCheck.length; sg++) {
      AllSalaryGrade.push(SalaryGradeCheck[sg].gradeName);
    }

    // check state

    let StateCheck = await StateMaster.findAll({
      where: {
        countryMasterID: 103,
        status: 1,
      },
    });

    for (var st = 0; st < StateCheck.length; st++) {
      AllState.push(StateCheck[st].stateName);
    }

    // check bank

    let BankCheck = await BankMaster.findAll({
      where: {
        status: 1,
      },
    });

    for (let b = 0; b < BankCheck.length; b++) {
      AllBank.push(BankCheck[b].bankName);
    }
    // check bank branch
    let bankBranchCheck = [];
    if (showBankBranch == 'true') {
      bankBranchCheck = await BankBranch.findAll({
        where: {
          status: 1,
        },
      });
      for (let b = 0; b < bankBranchCheck.length; b++) {
        AllBankBranch.push(bankBranchCheck[b]);
      }
    }

    let contractorCheck = await Contractor.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
    });
    for (let ct = 0; ct < contractorCheck.length; ct++) {
      AllContractor.push(contractorCheck[ct].contractorName);
    }

    if (req.file == undefined) {
      return res
        .status(200)
        .send({ status: 400, message: 'Please upload an excel file!' });
    }

    const filepath = path.join(__dirname, `../uploads/${req.file.filename}`);

    // let path = './uploads/' + req.file.filename;
    const salt = await bcrypt.genSalt(10);

    readXlsxFile(filepath).then(async (rows) => {
      rows.shift();
      if (check == 0) {
        // Check == 0 (Add)
        rows.forEach((row) => {
          if (row[2]) row[2] = ' ' + row[2] + ' ';
          else row[2] = ' ';
          let CompanyContact2 = {
            Employee_Code: row[0],
            First_Name: row[1],
            Middle_Name: row[2],
            Last_Name: row[3],
            Full_Name: row[1] + row[2] + row[3],

            Department: row[4],
            Depart_Applicable_Date: row[5],
            Designation: row[6],
            Desig_Applicable_Date: row[7],
            Branch: row[8],
            Branch_Applicable_Date: row[9],
            Local_Address: row[10],
            Permanent_Address: row[11],
            Mobileno: row[12] ? String(row[12]).replace(/\s/g, '') : null,
            Email_Id: row[13],
            Marital_Status: row[14],
            SalaryBase: row[15],
            Gender: row[16],
            Bank: row[17],
            AccountNo: row[18],
            IFSCCode: row[19],
            bankBranchID: showBankBranch == 'true' ? row[19] : null,
            BirthDate: row[20],
            JoinDate: row[21],
            LeftDate: row[22],
            PANNo: row[23],
            AadharNo: row[24],
            AadharName: row[25],
            PFNo: row[26],
            UANNo: row[27],
            PF_JoinDate: row[28],
            ESINo: row[29],
            ESI_JoinDate: row[30],
            PF_Bank: row[31],
            PF_bankIFSC: row[32],
            PF_bankACNO: row[33],
            Employeement_Type: row[34],
            Employment_Applicable_Date: row[35],
            Employment_End_Date: row[36],
            contractor_Name: row[37],
            Salary_Type: row[38],
            Overtime: row[39],
            Notice_Period: row[40],
            BloodGroup: row[41],
            Nationality: row[42],
            Physical_Handicap: row[43],
            SHIFT: row[44],
            Attendance_Policy: row[45],
            Salary_Policy: row[46],
            WeekOff_Policy: row[47],
            Holiday_Policy: row[48],
            Gross_Salary: row[49],
            Salary_Grade: row[50],
            StateForPT: row[51],
            Corporation: row[52],
            SkillCategory: row[53],
            BiometricSerialNo: row[54],
            BiometricCode: row[55],
            role: row[56],
            otherContactNumber: row[57]
              ? String(row[57]).replace(/\s/g, '')
              : null,
            localFName: null,
            localMName: null,
            localLName: null,
            localDisplayName: null,
            attendanceFrom: row[58],
            cugNumber: row[59] ? String(row[59]).replace(/\s/g, '') : null,
            officalEmail: row[60],
            payrollFrequency: showPayrollFrequency
              ? row[61]
              : PayrollFrequencyType.MONTHLY,
          };

          userContacts.push(CompanyContact2);
          mobileArr.push(CompanyContact2.Mobileno);
          employeeCodeArray.push(CompanyContact2.Employee_Code);
        });
      } else {
        // Check == 1 (Update)
        rows.forEach((row) => {
          if (row[2]) row[2] = ' ' + row[2] + ' ';
          else row[2] = ' ';
          let CompanyContact2 = {
            Employee_Code: row[0],
            First_Name: row[1],
            Middle_Name: row[2],
            Last_Name: row[3],
            Full_Name: row[1] + row[2] + row[3],

            Local_Address: row[4],
            Permanent_Address: row[5],
            Mobileno: row[6] ? String(row[6]).replace(/\s/g, '') : null,
            Email_Id: row[7],
            Marital_Status: row[8],
            SalaryBase: row[9],
            Gender: row[10],
            Bank: row[11],
            AccountNo: row[12],
            IFSCCode: row[13],
            bankBranchID: showBankBranch == 'true' ? row[13] : null,
            BirthDate: row[14],
            JoinDate: row[15],
            LeftDate: row[16],
            PANNo: row[17],
            AadharNo: row[18],
            AadharName: row[19],
            PFNo: row[20],
            UANNo: row[21],
            PF_JoinDate: row[22],
            ESINo: row[23],
            ESI_JoinDate: row[24],
            PF_Bank: row[25],
            PF_bankIFSC: row[26],
            PF_bankACNO: row[27],
            Employeement_Type: row[28],
            Employment_Applicable_Date: row[29],
            Employment_End_Date: row[30],
            Salary_Type: row[31],
            Overtime: row[32],
            Notice_Period: row[33],
            BloodGroup: row[34],
            Nationality: row[35],
            Physical_Handicap: row[36],

            Attendance_Policy: row[37],
            Salary_Policy: row[38],
            WeekOff_Policy: row[39],
            Holiday_Policy: row[40],
            Gross_Salary: row[41],
            Salary_Grade: row[42],
            StateForPT: row[43],
            Corporation: row[44],
            SalaryFromYYYYMM: row[45],
            BiometricSerialNo: row[46],
            BiometricCode: row[47],
            role: row[48],
            otherContactNumber: row[49]
              ? String(row[49]).replace(/\s/g, '')
              : null,
            localFName: null,
            localMName: null,
            localLName: null,
            localDisplayName: null,
            attendanceFrom: row[50],
            cugNumber: row[51] ? String(row[51]).replace(/\s/g, '') : null,
            officalEmail: row[52],
            payrollFrequency: showPayrollFrequency
              ? row[53]
              : PayrollFrequencyType.MONTHLY,
          };
          userContacts.push(CompanyContact2);
          mobileArr.push(CompanyContact2.Mobileno);
          employeeCodeArray.push(CompanyContact2.Employee_Code);
        });
      }

      let sameNumber = mobileArr.filter((number, index) => {
        return mobileArr.indexOf(number) !== index;
      });

      if (sameNumber.length != 0) {
        return res.status(200).send({
          status: 402,
          message:
            'You have entered Mobileno' +
            ' ' +
            `${sameNumber}` +
            ' ' +
            'more than once!' +
            ' ' +
            ' Check your Excel',
        });
      }

      // For check same employee Code in Excel

      const sameEmployeeCode = employeeCodeArray.filter(
        (employeeCode, index) => {
          if (employeeCode && String(employeeCode).trim()) {
            const lowerCaseEmployeeCode = String(employeeCode)
              .trim()
              .toLowerCase();
            return (
              employeeCodeArray.findIndex((code, idx) => {
                return (
                  String(code).trim().toLowerCase() == lowerCaseEmployeeCode &&
                  idx !== index
                );
              }) !== -1
            );
          }
          return false;
        }
      );

      if (sameEmployeeCode.length != 0) {
        return res.status(200).send({
          status: 402,
          message:
            'You have entered employee code' +
            ' ' +
            `${sameEmployeeCode}` +
            ' ' +
            'more than once!' +
            ' ' +
            ' Check your Excel',
        });
      }

      const findCompany = await companyMaster.findOne({
        raw: true,
        where: {
          companyMasterID,
        },
        attributes: [
          'companyMasterID',
          'parentCompanyMasterID',
          'uniqueEmpCode',
        ],
      });

      // To check unique code in all company

      let uniqueEmpCodeInAllCompany = false;
      if (findCompany.parentCompanyMasterID == 0)
        uniqueEmpCodeInAllCompany = findCompany.uniqueEmpCode;
      else {
        const parentCompanyData = await companyMaster.findOne({
          raw: true,
          where: {
            companyMasterID: findCompany.parentCompanyMasterID,
          },
        });

        uniqueEmpCodeInAllCompany = parentCompanyData.uniqueEmpCode;
      }

      // unique Employee Code is true for all company

      let AllcompanyIds = [+companyMasterID];

      if (uniqueEmpCodeInAllCompany) {
        const companyCodition =
          findCompany.parentCompanyMasterID == 0
            ? {
                parentCompanyMasterID: +companyMasterID,
                status: {
                  [Sequelize.Op.in]: [0, 1],
                },
              }
            : {
                parentCompanyMasterID: +findCompany.parentCompanyMasterID,
                status: {
                  [Sequelize.Op.in]: [0, 1],
                },
              };

        const findCompanies = await companyMaster.findAll({
          raw: true,
          where: companyCodition,
          attributes: ['companyMasterID'],
        });

        AllcompanyIds = [
          ...findCompanies.map((e) => e.companyMasterID),
          findCompany.parentCompanyMasterID != 0
            ? +findCompany.parentCompanyMasterID
            : +companyMasterID,
        ];
      }

      let UpdateArray = [];
      let AddArray = [];

      for (let i = 0; i < userContacts.length; i++) {
        let user;
        if (check == 1) {
          // Check == 1 (Update)
          user = await UserMaster.findOne({
            raw: true,
            where: {
              userNumber: userContacts[i].Mobileno,
              companyMasterId: companyMasterID,
              status: 1,
            },
          });
        }

        // For Same EmployeeCode

        if (
          userContacts[i].Employee_Code &&
          String(userContacts[i].Employee_Code).trim()
        ) {
          const find_SameData = await EmployeeJoiningDetails.findOne({
            where: Sequelize.and(
              Sequelize.where(
                sequelize.fn(
                  'TRIM',
                  sequelize.fn('LOWER', sequelize.col('employeeCode'))
                ),
                String(userContacts[i].Employee_Code).trim().toLowerCase()
              )
            ),
            include: [
              {
                required: true,
                model: UserMaster,
                where: {
                  companyMasterId: { [Sequelize.Op.in]: AllcompanyIds },
                  ...(user && {
                    userMasterID: { [Sequelize.Op.ne]: user.userMasterID },
                  }),
                  status: [0, 1],
                },
                attributes: [],
              },
            ],
          });

          if (find_SameData) {
            fs.unlink(filepath, function (err) {
              if (err) {
                console.log(err);
              } else {
              }
            });

            return res.status(200).json({
              status: 401,
              message: `An employee with the same Employee Code : '${find_SameData.employeeCode}' already exists in the company.`,
            });
          }
        }

        // All require fields

        if (
          userContacts[i].First_Name == null ||
          userContacts[i].First_Name == ''
        ) {
          return res.status(200).send({
            status: 402,
            message: 'First_Name is Required',
          });
        }

        if (
          userContacts[i].Last_Name == null ||
          userContacts[i].Last_Name == ''
        ) {
          return res.status(200).send({
            status: 402,
            message: 'Last_Name is Required',
          });
        }

        // if (convertNameToLocalName) {
        //   if (
        //     companyMasterID == 744 ||
        //     companyMasterID == 965 ||
        //     companyMasterID == 968 ||
        //     companyMasterID == 969 ||
        //     companyMasterID == 970 ||
        //     companyMasterID == 971 ||
        //     companyMasterID == 998 ||
        //     companyMasterID == 999 ||
        //     companyMasterID == 1000
        //   ) {
        //     try {
        //       const translate = new Translate({
        //         key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
        //       });

        //       const response = await translate.translate(
        //         [
        //           userContacts[i].First_Name,
        //           userContacts[i].Middle_Name
        //             ? userContacts[i].Middle_Name
        //             : '',
        //           userContacts[i].Last_Name,
        //         ],
        //         {
        //           from: 'en', // Explicitly specify English as the source
        //           to: 'mr',
        //           format: 'text',
        //           model: 'base',
        //         }
        //       );

        //       // Extract transliterated values
        //       userContacts[i].localFName = response[0]?.[0] || null;
        //       userContacts[i].localMName = response[0]?.[1] || null;
        //       userContacts[i].localLName = response[0]?.[2] || null;

        //       userContacts[i].localDisplayName = userContacts[i].localMName
        //         ? `${userContacts[i].localFName} ${userContacts[i].localMName} ${userContacts[i].localLName}`
        //         : `${userContacts[i].localFName} ${userContacts[i].localLName}`;
        //     } catch (error) {
        //       console.error(`Error in translation for user ${i}:`, error);
        //     }
        //   }
        // }
        if (
          userContacts[i].Mobileno == null ||
          userContacts[i].Mobileno == ''
        ) {
          return res.status(200).send({
            status: 402,
            message: 'Mobileno is Required',
          });
        }

        if (userContacts[i].role == null || userContacts[i].role == '') {
          return res.status(200).send({
            status: 402,
            message: 'Role is Required',
          });
        } else {
          const roleValidate = AllRoles.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].role.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (roleValidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Role' +
                ' ' +
                `${userContacts[i].role}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        if (check == 0) {
          // Check == 0 (Add)
          if (
            userContacts[i].Department == null ||
            userContacts[i].Department == ''
          ) {
            return res.status(200).send({
              status: 402,
              message: 'Department is Required',
            });
          }

          if (
            userContacts[i].Designation == null ||
            userContacts[i].Designation == ''
          ) {
            return res.status(200).send({
              status: 402,
              message: 'Designation is Required',
            });
          }

          if (userContacts[i].Branch == null || userContacts[i].Branch == '') {
            return res.status(200).send({
              status: 402,
              message: 'Branch is Required',
            });
          }

          if (
            userContacts[i].Depart_Applicable_Date != null &&
            userContacts[i].Depart_Applicable_Date != ''
          ) {
            if (typeof userContacts[i].Depart_Applicable_Date == 'number') {
              userContacts[i].Depart_Applicable_Date = new Date(
                Math.round(userContacts[i].Depart_Applicable_Date - 25569) *
                  86400 *
                  1000
              )
                .toISOString()
                .slice(0, 10);
            } else {
              if (
                isValidDate(userContacts[i].Depart_Applicable_Date) === true
              ) {
                userContacts[i].Depart_Applicable_Date = new Date(
                  `${userContacts[i].Depart_Applicable_Date}`
                )
                  .toISOString()
                  .slice(0, 10);
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    "Department Applicable_Date Should be in 'yyyy-mm-dd' Format" +
                    ': ' +
                    userContacts[i].Mobileno,
                });
              }
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Department Applicable_Date is require for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }

          if (
            userContacts[i].Desig_Applicable_Date != null &&
            userContacts[i].Desig_Applicable_Date != ''
          ) {
            if (typeof userContacts[i].Desig_Applicable_Date == 'number') {
              userContacts[i].Desig_Applicable_Date = new Date(
                Math.round(userContacts[i].Desig_Applicable_Date - 25569) *
                  86400 *
                  1000
              )
                .toISOString()
                .slice(0, 10);
            } else {
              if (isValidDate(userContacts[i].Desig_Applicable_Date) === true) {
                userContacts[i].Desig_Applicable_Date = new Date(
                  `${userContacts[i].Desig_Applicable_Date}`
                )
                  .toISOString()
                  .slice(0, 10);
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    "Designation Applicable_Date Should be in 'yyyy-mm-dd' Format" +
                    ': ' +
                    userContacts[i].Mobileno,
                });
              }
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Designation Applicable_Date is require for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }

          if (
            userContacts[i].Branch_Applicable_Date != null &&
            userContacts[i].Branch_Applicable_Date != ''
          ) {
            if (typeof userContacts[i].Branch_Applicable_Date == 'number') {
              userContacts[i].Branch_Applicable_Date = new Date(
                Math.round(userContacts[i].Branch_Applicable_Date - 25569) *
                  86400 *
                  1000
              )
                .toISOString()
                .slice(0, 10);
            } else {
              if (
                isValidDate(userContacts[i].Branch_Applicable_Date) === true
              ) {
                userContacts[i].Branch_Applicable_Date = new Date(
                  `${userContacts[i].Branch_Applicable_Date}`
                )
                  .toISOString()
                  .slice(0, 10);
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    "Branch Applicable_Date Should be in 'yyyy-mm-dd' Format" +
                    ': ' +
                    userContacts[i].Mobileno,
                });
              }
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Location Applicable_Date is require for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        if (
          userContacts[i].JoinDate != null &&
          userContacts[i].JoinDate != ''
        ) {
          if (typeof userContacts[i].JoinDate == 'number') {
            userContacts[i].JoinDate = new Date(
              Math.round(userContacts[i].JoinDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].JoinDate) === true) {
              userContacts[i].JoinDate = new Date(`${userContacts[i].JoinDate}`)
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "JoinDate Should be in 'yyyy-mm-dd' Format" +
                  ': ' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          return res.status(200).send({
            status: 402,
            message:
              'Join Date is require for' + ': ' + userContacts[i].Mobileno,
          });
        }

        if (
          userContacts[i].BirthDate != null &&
          userContacts[i].BirthDate != ''
        ) {
          if (typeof userContacts[i].BirthDate == 'number') {
            userContacts[i].BirthDate = new Date(
              Math.round(userContacts[i].BirthDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].BirthDate) === true) {
              userContacts[i].BirthDate = new Date(
                `${userContacts[i].BirthDate}`
              )
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "BirthDate Should be in 'yyyy-mm-dd' Format" +
                  ': ' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          userContacts[i].BirthDate = null;
        }

        // Payroll Frequency
        if (showPayrollFrequency) {
          if (userContacts[i].payrollFrequency) {
            if (
              String(userContacts[i].payrollFrequency).toLowerCase().trim() ==
              String(PayrollFrequencyType.MONTHLY).toLowerCase().trim()
            ) {
              userContacts[i].payrollFrequency = PayrollFrequencyType.MONTHLY;
            } else if (
              String(userContacts[i].payrollFrequency).toLowerCase().trim() ==
              String(PayrollFrequencyType.FORTNIGHTLY).toLowerCase().trim()
            ) {
              userContacts[i].payrollFrequency =
                PayrollFrequencyType.FORTNIGHTLY;
            } else if (
              String(userContacts[i].payrollFrequency).toLowerCase().trim() ==
              String(PayrollFrequencyType.WEEKLY).toLowerCase().trim()
            ) {
              userContacts[i].payrollFrequency = PayrollFrequencyType.WEEKLY;
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  'Invalid Payroll Frequency for' +
                  ': ' +
                  userContacts[i].Mobileno,
              });
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Payroll Frequency is required for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        if (
          userContacts[i].Employment_Applicable_Date != null &&
          userContacts[i].Employment_Applicable_Date != ''
        ) {
          if (typeof userContacts[i].Employment_Applicable_Date == 'number') {
            userContacts[i].Employment_Applicable_Date = new Date(
              Math.round(userContacts[i].Employment_Applicable_Date - 25569) *
                86400 *
                1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (
              isValidDate(userContacts[i].Employment_Applicable_Date) === true
            ) {
              userContacts[i].Employment_Applicable_Date = new Date(
                `${userContacts[i].Employment_Applicable_Date}`
              )
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "Employment_Applicable_Date Should be in 'yyyy-mm-dd' Format" +
                  ':' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          return res.status(200).send({
            status: 402,
            message:
              'Employment_Applicable_Date is required for' +
              ':' +
              userContacts[i].Mobileno,
          });
          // userContacts[i].Employment_Applicable_Date = null;
        }

        if (
          userContacts[i].Employment_End_Date != null &&
          userContacts[i].Employment_End_Date != ''
        ) {
          if (typeof userContacts[i].Employment_End_Date == 'number') {
            userContacts[i].Employment_End_Date = new Date(
              Math.round(userContacts[i].Employment_End_Date - 25569) *
                86400 *
                1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].Employment_End_Date) === true) {
              userContacts[i].Employment_End_Date = new Date(
                `${userContacts[i].Employment_End_Date}`
              )
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "Employment_End_Date Should be in 'yyyy-mm-dd' Format" +
                  ':' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          userContacts[i].Employment_End_Date = null;
        }

        if (
          userContacts[i].LeftDate != null &&
          userContacts[i].LeftDate != ''
        ) {
          if (typeof userContacts[i].LeftDate == 'number') {
            userContacts[i].LeftDate = new Date(
              Math.round(userContacts[i].LeftDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].LeftDate) === true) {
              userContacts[i].LeftDate = new Date(`${userContacts[i].LeftDate}`)
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "LeftDate Should be in 'yyyy-mm-dd' Format" +
                  ':' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          userContacts[i].LeftDate = null;
        }

        if (
          userContacts[i].PF_JoinDate != null &&
          userContacts[i].PF_JoinDate != ''
        ) {
          if (typeof userContacts[i].PF_JoinDate == 'number') {
            userContacts[i].PF_JoinDate = new Date(
              Math.round(userContacts[i].PF_JoinDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].PF_JoinDate) === true) {
              userContacts[i].PF_JoinDate = new Date(
                `${userContacts[i].PF_JoinDate}`
              )
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "PF_JoinDate Should be in 'yyyy-mm-dd' Format" +
                  ':' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          userContacts[i].PF_JoinDate = null;
        }

        if (
          userContacts[i].ESI_JoinDate != null &&
          userContacts[i].ESI_JoinDate != ''
        ) {
          if (typeof userContacts[i].ESI_JoinDate == 'number') {
            userContacts[i].ESI_JoinDate = new Date(
              Math.round(userContacts[i].ESI_JoinDate - 25569) * 86400 * 1000
            )
              .toISOString()
              .slice(0, 10);
          } else {
            if (isValidDate(userContacts[i].ESI_JoinDate) === true) {
              userContacts[i].ESI_JoinDate = new Date(
                `${userContacts[i].ESI_JoinDate}`
              )
                .toISOString()
                .slice(0, 10);
            } else {
              return res.status(200).send({
                status: 402,
                message:
                  "ESI_JoinDate Should be in 'yyyy-mm-dd' Format" +
                  ':' +
                  userContacts[i].Mobileno,
              });
            }
          }
        } else {
          userContacts[i].ESI_JoinDate = null;
        }

        //validate mobile

        if (
          userContacts[i].Mobileno != null &&
          userContacts[i].Mobileno != ''
        ) {
          // let regex = new RegExp('^[0-9]{10}$');

          let regex;
          if (!pihMobileNo) {
            regex = new RegExp('^[0-9]{10}$');
          } else {
            regex = new RegExp('^[0-9]{8,14}$');
          }
          let data = regex.test(userContacts[i].Mobileno);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'Mobile No. is not valid ' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        // validate other contact number
        if (userContacts[i].otherContactNumber) {
          // let regex = new RegExp("^[0-9]{10}$");
          let regex;
          if (!pihMobileNo) {
            regex = new RegExp('^[0-9]{10}$');
          } else {
            regex = new RegExp('^[0-9]{8,14}$');
          }
          let data = regex.test(userContacts[i].otherContactNumber);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message: `${othernumberLabel} is not valid : ${userContacts[i].Mobileno}`,
            });
          }
        }
        // validate other contact number
        if (userContacts[i].cugNumber) {
          // let regex = new RegExp("^[0-9]{10}$");
          let regex;
          if (!pihMobileNo) {
            regex = new RegExp('^[0-9]{10}$');
          } else {
            regex = new RegExp('^[0-9]{8,14}$');
          }
          let data = regex.test(userContacts[i].cugNumber);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message: `Cug Number is not valid : ${userContacts[i].Mobileno}`,
            });
          }
        }
        //validate email

        if (
          userContacts[i].Email_Id != null &&
          userContacts[i].Email_Id != ''
        ) {
          let regex = new RegExp(
            '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$'
          );

          let email = regex.test(userContacts[i].Email_Id);

          if (email == false) {
            return res.status(200).send({
              status: 402,
              message:
                'Enter Valid Email for' + ': ' + userContacts[i].Mobileno,
            });
          }
        }
        // Validate Official Email
        if (
          userContacts[i].officalEmail != null &&
          userContacts[i].officalEmail != ''
        ) {
          let regex = new RegExp(
            '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,6}$'
          );

          let email = regex.test(userContacts[i].officalEmail);

          if (email == false) {
            return res.status(200).send({
              status: 402,
              message:
                'Enter Valid Official Email for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }
        // validate account number

        if (
          userContacts[i].AccountNo != null &&
          userContacts[i].AccountNo != ''
        ) {
          let regex = new RegExp('[0-9]$');

          let data = regex.test(userContacts[i].AccountNo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'Account No. Should be Only Numbers for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        // validate IFSC code

        if (
          userContacts[i].IFSCCode != null &&
          userContacts[i].IFSCCode != '' &&
          showBankBranch == 'false'
        ) {
          let regExp = new RegExp('^[A-Z]{4}0[A-Z0-9]{6}$');

          let data = regExp.test(userContacts[i].IFSCCode);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'IFSC code Invalid for' + ': ' + userContacts[i].Mobileno,
            });
          }
        }
        // Check For Bank Branch
        if (userContacts[i].bankBranchID != null) {
          const bankBranchValidate = AllBankBranch.find(
            (s) =>
              s.bankBranchCode.trim().toLowerCase() ===
              userContacts[i].bankBranchID.trim().toLowerCase()
          );
          if (!bankBranchValidate) {
            return res.status(200).send({
              status: 402,
              message:
                'Bank Branch Code With ' +
                `${userContacts[i].bankBranchID}` +
                ' Does Not Exist',
            });
          } else {
            userContacts[i].bankBranchID = bankBranchValidate.bankBranchID;
          }
        }
        // validate bithdate

        if (
          userContacts[i].BirthDate != null &&
          userContacts[i].BirthDate != ''
        ) {
          if (new Date(userContacts[i].BirthDate) > new Date()) {
            return res.status(200).send({
              status: 402,
              message:
                "Birth Date can't be future date for" +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        // validate pancard

        if (userContacts[i].PANNo != null && userContacts[i].PANNo != '') {
          let regex = new RegExp('^[A-Z]{5}[0-9]{4}[A-Z]{1}$');

          let data = regex.test(userContacts[i].PANNo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'PANNo is not valid of' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        // validate adhar

        if (
          userContacts[i].AadharNo != null &&
          userContacts[i].AadharNo != ''
        ) {
          let regex = new RegExp('^([0-9]){12}$');

          let data = regex.test(userContacts[i].AadharNo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'AadharNo is not valid of' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        //validate pf number

        if (userContacts[i].PFNo != null && userContacts[i].PFNo != '') {
          let regex = new RegExp(
            '^[A-Z]{2}[\\s\\/]?[A-Z]{3}[\\s\\/]?[0-9]{7}[\\s\\/]?[0-9]{3}[\\s\\/]?[0-9]{7}$'
          );
          let data = regex.test(userContacts[i].PFNo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message: 'PFNo is not valid of' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        //validate UANNo

        if (userContacts[i].UANNo != null && userContacts[i].UANNo != '') {
          let regex = new RegExp('^[0-9]{12}$');
          let data = regex.test(userContacts[i].UANNo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'UANNo is not valid of' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        //validate ESINo

        if (userContacts[i].ESINo != null && userContacts[i].ESINo != '') {
          let regex = new RegExp('[0-9]$');
          let data = regex.test(userContacts[i].ESINo);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'ESINo is not valid of' + ': ' + userContacts[i].Mobileno,
            });
          }
        }

        // PF_bankACNO

        if (
          userContacts[i].PF_bankACNO != null &&
          userContacts[i].PF_bankACNO != ''
        ) {
          let regex = new RegExp('[0-9]$');

          let data = regex.test(userContacts[i].PF_bankACNO);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'PF_bankACNO Should be Only Numbers for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        // PF_bankIFSC

        if (
          userContacts[i].PF_bankIFSC != null &&
          userContacts[i].PF_bankIFSC != ''
        ) {
          let regExp = new RegExp('^[A-Z]{4}0[A-Z0-9]{6}$');

          let data = regExp.test(userContacts[i].PF_bankIFSC);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'PF_bankIFSC code Invalid for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        // notice period

        if (
          userContacts[i].Notice_Period != null &&
          userContacts[i].Notice_Period != ''
        ) {
          let regExp = new RegExp('[0-9]$');

          let data = regExp.test(userContacts[i].Notice_Period);

          if (data == false) {
            return res.status(200).send({
              status: 402,
              message:
                'Notice_Period is allow only numbers ' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        // Overtime

        if (
          userContacts[i].Overtime != null &&
          userContacts[i].Overtime != ''
        ) {
          if (userContacts[i].Overtime.toLowerCase().trim() == 'yes') {
            userContacts[i].Overtime = 1;
          } else if (userContacts[i].Overtime.toLowerCase().trim() == 'no') {
            userContacts[i].Overtime = 0;
          } else {
            return res.status(200).send({
              status: 402,
              message: 'Invalid Overtime of' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].Overtime = null;
        }

        // Salary_Type

        if (
          userContacts[i].Salary_Type != null &&
          userContacts[i].Salary_Type != ''
        ) {
          if (userContacts[i].Salary_Type.toLowerCase().trim() == 's') {
            userContacts[i].Salary_Type = 'S';
          } else if (userContacts[i].Salary_Type.toLowerCase().trim() == 'w') {
            userContacts[i].Salary_Type = 'W';
          } else if (userContacts[i].Salary_Type.toLowerCase().trim() == 'm') {
            userContacts[i].Salary_Type = 'M';
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Invalid Salary_Type for' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].Salary_Type = null;
        }

        // for nationality
        if (
          userContacts[i].Nationality != null &&
          userContacts[i].Nationality != ''
        ) {
          const findNationality = Nationality.find(
            (e) => e == userContacts[i].Nationality
          );
          if (!findNationality) {
            return res.status(200).send({
              status: 402,
              message:
                'Invalid Nationality for ' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].Nationality = null;
        }

        // for blood group

        if (
          userContacts[i].BloodGroup != null &&
          userContacts[i].BloodGroup != ''
        ) {
          if (userContacts[i].BloodGroup.toLowerCase().trim() == 'a+') {
            userContacts[i].BloodGroup = 'A+';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'a-') {
            userContacts[i].BloodGroup = 'A-';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'b+') {
            userContacts[i].BloodGroup = 'B+';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'b-') {
            userContacts[i].BloodGroup = 'B-';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'o+') {
            userContacts[i].BloodGroup = 'O+';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'o-') {
            userContacts[i].BloodGroup = 'O-';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'ab+') {
            userContacts[i].BloodGroup = 'AB+';
          } else if (userContacts[i].BloodGroup.toLowerCase().trim() == 'ab-') {
            userContacts[i].BloodGroup = 'AB-';
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Invalid BloodGroup for ' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].BloodGroup = null;
        }

        // for marital status check

        if (
          userContacts[i].Marital_Status != null &&
          userContacts[i].Marital_Status != ''
        ) {
          if (userContacts[i].Marital_Status.toLowerCase().trim() == 'single') {
            userContacts[i].Marital_Status = 'Single';
          } else if (
            userContacts[i].Marital_Status.toLowerCase().trim() == 'married'
          ) {
            userContacts[i].Marital_Status = 'Married';
          } else if (
            userContacts[i].Marital_Status.toLowerCase().trim() == 'widowed'
          ) {
            userContacts[i].Marital_Status = 'Widowed';
          } else if (
            userContacts[i].Marital_Status.toLowerCase().trim() == 'separated'
          ) {
            userContacts[i].Marital_Status = 'Separated';
          } else if (
            userContacts[i].Marital_Status.toLowerCase().trim() == 'divorced'
          ) {
            userContacts[i].Marital_Status = 'Divorced';
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Invalid Marital_Status' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].Marital_Status = null;
        }

        // for salary base check

        if (
          userContacts[i].SalaryBase != null &&
          userContacts[i].SalaryBase != ''
        ) {
          if (userContacts[i].SalaryBase.toLowerCase().trim() == 's') {
            userContacts[i].SalaryBase = 'S';
          } else if (userContacts[i].SalaryBase.toLowerCase().trim() == 'f') {
            userContacts[i].SalaryBase = 'F';
          } else {
            return res.status(200).send({
              status: 402,
              message: 'Invalid Salary_Base' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].SalaryBase = null;
        }

        // for gender check

        if (userContacts[i].Gender != null && userContacts[i].Gender != '') {
          if (userContacts[i].Gender.toLowerCase().trim() == 'male') {
            userContacts[i].Gender = 'male';
          } else if (userContacts[i].Gender.toLowerCase().trim() == 'female') {
            userContacts[i].Gender = 'female';
          } else if (userContacts[i].Gender.toLowerCase().trim() == 'other') {
            userContacts[i].Gender = 'other';
          } else {
            return res.status(200).send({
              status: 402,
              message: 'Invalid Gender' + ': ' + userContacts[i].Mobileno,
            });
          }
        } else {
          userContacts[i].Gender = null;
        }

        // for employee role check

        if (
          userContacts[i].Employeement_Type != null &&
          userContacts[i].Employeement_Type != ''
        ) {
          if (
            userContacts[i].Employeement_Type.toLowerCase().trim() == 'confirm'
          ) {
            userContacts[i].Employeement_Type = 'Confirm';
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() ==
            'permanent'
          ) {
            userContacts[i].Employeement_Type = 'Permanent';
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() ==
            'probation'
          ) {
            userContacts[i].Employeement_Type = 'Probation';
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() == 'trainee'
          ) {
            userContacts[i].Employeement_Type = 'Trainee';
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() ==
            'apprenticeship'
          ) {
            userContacts[i].Employeement_Type = 'Apprenticeship';
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() == 'contract'
          ) {
            userContacts[i].Employeement_Type = 'Contract';
            if (check == 0) {
              if (
                userContacts[i].contractor_Name != null &&
                userContacts[i].contractor_Name != ''
              ) {
                const contractorValidate = AllContractor.find((s) => {
                  if (
                    s.trim().toLowerCase() ===
                    userContacts[i].contractor_Name.trim().toLowerCase()
                  ) {
                    return s;
                  }
                });

                if (!contractorValidate) {
                  return res.status(200).send({
                    status: 402,
                    message: `Contractor With Name ${userContacts[i].contractor_Name} Does Not Exist`,
                  });
                } else {
                  const findContractor = contractorCheck.find((s) => {
                    if (
                      s.contractorName.trim().toLowerCase() ===
                      userContacts[i].contractor_Name.trim().toLowerCase()
                    ) {
                      return s;
                    }
                  });
                  userContacts[i].contractor_Name = findContractor.contractorId;
                }
              } else {
                return res.status(200).send({
                  status: 402,
                  message: `For contractual employee, Contractor Name is mandatory. Please check entry with Mobile No: ${userContacts[i].Mobileno}`,
                });
              }
            }
          } else if (
            userContacts[i].Employeement_Type.toLowerCase().trim() == 'locum'
          ) {
            userContacts[i].Employeement_Type = 'Locum';
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Invalid Employeement_Type for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        } else {
          return res.status(200).send({
            status: 402,
            message:
              ' Employeement_Type is required for' +
              ': ' +
              userContacts[i].Mobileno,
          });
        }

        // physical disability check

        if (
          userContacts[i].Physical_Handicap != null &&
          userContacts[i].Physical_Handicap != ''
        ) {
          if (userContacts[i].Physical_Handicap.toLowerCase().trim() == 'yes') {
            userContacts[i].Physical_Handicap = 'Yes';
          } else if (
            userContacts[i].Physical_Handicap.toLowerCase().trim() == 'no'
          ) {
            userContacts[i].Physical_Handicap = 'No';
          } else {
            return res.status(200).send({
              status: 402,
              message: "Only 'Yes/No' allowed in Physical_Handicap",
            });
          }
        } else {
          userContacts[i].Physical_Handicap = null;
        }

        // Allowed attendance From

        if (userContacts[i].attendanceFrom) {
          let attendanceFrom = String(userContacts[i].attendanceFrom)
            .toLowerCase()
            .trim();

          if (allowedAttendanceSources.includes(attendanceFrom)) {
            userContacts[i].attendanceFrom = attendanceFrom;
          } else {
            return res.status(200).send({
              status: 402,
              message:
                ' Attendance From for' +
                ': ' +
                userContacts[i].Mobileno +
                ' is Not Valid',
            });
          }
        } else {
          userContacts[i].attendanceFrom = null;
        }

        if (check == 0) {
          const branchvalidate = AllBranches.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Branch.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (branchvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Branch' +
                ' ' +
                `${userContacts[i].Branch}` +
                ' ' +
                'Does Not Exist',
            });
          }

          const departmentvalidate = AllDepartment.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Department.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (departmentvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Department' +
                ' ' +
                `${userContacts[i].Department}` +
                ' ' +
                'Does Not Exist',
            });
          }

          const desigantionvalidate = AllDesignation.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Designation.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (desigantionvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Designation' +
                ' ' +
                `${userContacts[i].Designation}` +
                ' ' +
                'Does Not Exist',
            });
          }

          // shift check

          if (userContacts[i].SHIFT != null && userContacts[i].SHIFT != '') {
            const Shiftvalidate = AllShift.filter((s) => {
              if (
                s.trim().toLowerCase() ===
                userContacts[i].SHIFT.trim().toLowerCase()
              ) {
                return s;
              }
            });

            if (Shiftvalidate.length == 0) {
              return res.status(200).send({
                status: 402,
                message:
                  'Shift' +
                  ' ' +
                  `${userContacts[i].SHIFT}` +
                  ' ' +
                  'Does Not Exist',
              });
            }
          }

          // Check skillCategory

          if (userContacts[i].SkillCategory) {
            if (
              String(userContacts[i].SkillCategory).toLowerCase().trim() ==
              SkillCategoryType.SKILLED
            ) {
              userContacts[i].SkillCategory = SkillCategoryType.SKILLED;
            } else if (
              String(userContacts[i].SkillCategory).toLowerCase().trim() ==
              SkillCategoryType.SEMISKILLED
            ) {
              userContacts[i].SkillCategory = SkillCategoryType.SEMISKILLED;
            } else if (
              String(userContacts[i].SkillCategory).toLowerCase().trim() ==
              SkillCategoryType.UNSKILLED
            ) {
              userContacts[i].SkillCategory = SkillCategoryType.UNSKILLED;
            } else {
              return res.status(200).send({
                status: 402,
                message: 'Please pass Valid SkillCategory!',
              });
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                ' SkillCategory is required for' +
                ': ' +
                userContacts[i].Mobileno,
            });
          }
        }

        //  check attendance policy

        if (
          userContacts[i].Attendance_Policy != null &&
          userContacts[i].Attendance_Policy != ''
        ) {
          const AttendancePolicyvalidate = AllAttendancePolicy.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Attendance_Policy.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (AttendancePolicyvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Attendance Policy' +
                ' ' +
                `${userContacts[i].Attendance_Policy}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        //  check salary policy

        if (
          userContacts[i].Salary_Policy != null &&
          userContacts[i].Salary_Policy != ''
        ) {
          const SalaryPolicyvalidate = AllSalaryPolicy.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Salary_Policy.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (SalaryPolicyvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Salary Policy' +
                ' ' +
                `${userContacts[i].Salary_Policy}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        //  check weekoff policy

        if (
          userContacts[i].WeekOff_Policy != null &&
          userContacts[i].WeekOff_Policy != ''
        ) {
          const WeekPolicyvalidate = AllWeekoffPolicy.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].WeekOff_Policy.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (WeekPolicyvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'WeekOff Policy' +
                ' ' +
                `${userContacts[i].WeekOff_Policy}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        //  check Holiday policy

        if (
          userContacts[i].Holiday_Policy != null &&
          userContacts[i].Holiday_Policy != ''
        ) {
          const HolidayPolicyvalidate = AllHolidayPolicy.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Holiday_Policy.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (HolidayPolicyvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Holiday Policy' +
                ' ' +
                `${userContacts[i].Holiday_Policy}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        //  check  salary structure

        if (
          userContacts[i].Salary_Grade != null &&
          userContacts[i].Salary_Grade != ''
        ) {
          const SalaryGradevalidate = AllSalaryGrade.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Salary_Grade.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (SalaryGradevalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Salary Grade' +
                ' ' +
                `${userContacts[i].Salary_Grade}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        //  check State

        if (
          userContacts[i].StateForPT != null &&
          userContacts[i].StateForPT != ''
        ) {
          const Statevalidate = AllState.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].StateForPT.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (Statevalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'State' +
                ' ' +
                `${userContacts[i].StateForPT}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        // bank

        if (userContacts[i].Bank != null && userContacts[i].Bank != '') {
          const bankvalidate = AllBank.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].Bank.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (bankvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                'Bank' +
                ' ' +
                `${userContacts[i].Bank}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        // pf bank

        if (userContacts[i].PF_Bank != null && userContacts[i].PF_Bank != '') {
          const pfbankvalidate = AllBank.filter((s) => {
            if (
              s.trim().toLowerCase() ===
              userContacts[i].PF_Bank.trim().toLowerCase()
            ) {
              return s;
            }
          });

          if (pfbankvalidate.length == 0) {
            return res.status(200).send({
              status: 402,
              message:
                ' PF Bank' +
                ' ' +
                `${userContacts[i].PF_Bank}` +
                ' ' +
                'Does Not Exist',
            });
          }
        }

        if (
          userContacts[i].Gross_Salary != null &&
          userContacts[i].Gross_Salary != ''
        ) {
          if (
            userContacts[i].Salary_Grade != null &&
            userContacts[i].Salary_Grade != ''
          ) {
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Salary_Grade is required for employee ' +
                ' : ' +
                `'${userContacts[i].First_Name}'` +
                ' ',
            });
          }
          //only for update
          if (check == 1) {
            if (!userContacts[i].SalaryFromYYYYMM) {
              return res.status(200).send({
                status: 402,
                message:
                  'SalaryFromYYYYMM is required for employee ' +
                  ' : ' +
                  `'${userContacts[i].First_Name}'` +
                  ' ',
              });
            }

            let regex = new RegExp('^[0-9]{6}$');

            let data = regex.test(userContacts[i].SalaryFromYYYYMM);

            if (data == false) {
              return res.status(200).send({
                status: 402,
                message:
                  'SalaryFromYYYYMM is not valid for ' +
                  ': ' +
                  userContacts[i].First_Name,
              });
            }

            const joiningMonth =
              String(userContacts[i].JoinDate).slice(0, 4) +
              String(userContacts[i].JoinDate).slice(5, 7);

            if (+joiningMonth > +userContacts[i].SalaryFromYYYYMM) {
              return res.status(200).send({
                status: 402,
                message:
                  'SalaryFromYYYYMM can not be less than joining Month for' +
                  ': ' +
                  userContacts[i].First_Name,
              });
            }
          }
        }

        // check state for grade

        if (
          userContacts[i].Salary_Grade != null &&
          userContacts[i].Salary_Grade != ''
        ) {
          if (
            userContacts[i].Gross_Salary != null &&
            userContacts[i].Gross_Salary != ''
          ) {
            let uniquedata7 = await executeQuery(
              ` 

  select * from "gradeStructures" WHERE LOWER(TRIM("gradeName")) = '` +
                userContacts[i].Salary_Grade.trim().toLowerCase() +
                `' and "companyMasterID" = ` +
                companyMasterID +
                ` and status =1 `
            );

            let gradeid = uniquedata7[0].gradeStructureID;

            const grade_salary_structure_data =
              await GradeSalaryStructure.findAll({
                raw: true,
                where: {
                  gradeStructureID: gradeid,
                },
                include: [
                  {
                    model: HRSalaryFields,
                    attributes: [],
                    include: [{ model: Payheadmaster, attributes: [] }],
                  },
                  {
                    model: GradeStructure,
                    attributes: [],
                  },
                ],
                order: [
                  [
                    { model: HRSalaryFields, as: 'hrSalaryField' },
                    'salaryFieldSrNo',
                    'ASC',
                  ],
                  ['salaryfieldindex', 'ASC'],

                  // Order by payheadName in Payheadmaster
                  [
                    { model: HRSalaryFields, as: 'hrSalaryField' },
                    { model: Payheadmaster, as: 'Payheadmaster' },
                    'payheadName',
                    'ASC',
                  ],
                ],
                attributes: [
                  'gradeSalaryStructureID',
                  'gradeStructureID',
                  'salaryFieldID',
                  'fieldFixAmount',
                  'formula',
                  'salaryfieldindex',
                  'salaryfieldmaxrange',
                  'fieldFixAmount1',
                  'formula1',
                  'formulaPreference',
                  [
                    sequelize.col('hrSalaryField.payheadMasterId'),
                    'payheadMasterId',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldSide'),
                    'salaryFieldSide',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldAttanChk'),
                    'salaryFieldAttanChk',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldWhenMonth'),
                    'salaryFieldWhenMonth',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldRound'),
                    'salaryFieldRound',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldRoundNo'),
                    'salaryFieldRoundNo',
                  ],
                  [
                    sequelize.col('hrSalaryField.salaryFieldSrNo'),
                    'salaryFieldSrNo',
                  ],
                  [
                    sequelize.col('hrSalaryField.companyMasterID'),
                    'companyMasterID',
                  ],
                  [
                    sequelize.col('hrSalaryField.payheadDisplayName'),
                    'payheadDisplayName',
                  ],
                  [sequelize.col('hrSalaryField.roundOffType'), 'roundOffType'],
                  [sequelize.col('hrSalaryField.considerIn'), 'considerIn'],
                  [
                    sequelize.col('hrSalaryField.Payheadmaster.payheadName'),
                    'payheadName',
                  ],
                  [
                    sequelize.col('gradeStructure.baseOnCalculation'),
                    'baseOnCalculation',
                  ],
                ],
              });

            const PTData = grade_salary_structure_data.find(
              (e) => e.payheadMasterId == 15
            );

            // Find if min wages is used in formula or formula1
            const hasMinimumWages = grade_salary_structure_data.some(
              (item) =>
                (item.formula && item.formula.includes('Minimum Wages')) ||
                (item.formula1 && item.formula1.includes('Minimum Wages'))
            );

            let user = null;

            if (check == 1) {
              user = await UserMaster.findOne({
                where: {
                  userNumber: userContacts[i].Mobileno,
                  companyMasterId: companyMasterID,
                  status: 1,
                },
              });
            }

            let SkillCategory_MinWages = null;
            // for add
            if (check == 0) {
              SkillCategory_MinWages = userContacts[i].SkillCategory;
            } else {
              if (hasMinimumWages && user) {
                const findSkillCategory = await EmployeeSkillCategory.findOne({
                  where: {
                    applicableYYYYMM: {
                      [Sequelize.Op.lte]: +userContacts[i].SalaryFromYYYYMM,
                    },
                    userMasterID: user.userMasterID,
                    [Sequelize.Op.or]: [
                      {
                        endYYYYMM: {
                          [Sequelize.Op.gte]: +userContacts[i].SalaryFromYYYYMM,
                        },
                      },
                      {
                        endYYYYMM: {
                          [Sequelize.Op.is]: null,
                        },
                      },
                    ],
                  },
                });

                SkillCategory_MinWages =
                  findSkillCategory?.skillCategory || null;
              }
            }

            // set minWagesCategory

            userContacts[i].SkillCategory_MinWages = SkillCategory_MinWages;

            // set hasMinimumWages flag

            userContacts[i].hasMinimumWages = hasMinimumWages;

            if (hasMinimumWages && !SkillCategory_MinWages) {
              return res.status(200).send({
                status: 402,
                message:
                  'SkillCategory is  required For ' +
                  ' ' +
                  `'${userContacts[i].Salary_Grade}'` +
                  ' ' +
                  ' Grade ',
              });
            }

            let stateid = null,
              corporationId = null;

            if (PTData || hasMinimumWages) {
              if (
                userContacts[i].StateForPT != null &&
                userContacts[i].StateForPT != ''
              ) {
                let uniquedata = await executeQuery(
                  `                 
    select * from "stateMasters" where LOWER(TRIM("stateName")) = '` +
                    userContacts[i].StateForPT.trim().toLowerCase() +
                    `' and "countryMasterID"=103 and status=1 
                      `
                );

                stateid = uniquedata[0].stateMasterID;

                // check for corpoaration

                if (userContacts[i].Corporation) {
                  const corpo = await executeQuery(
                    `                 
SELECT * from "corporations" where "stateMasterID"=${stateid} and LOWER(TRIM("corporationName")) = '` +
                      String(userContacts[i].Corporation).trim().toLowerCase() +
                      `'
                      `
                  );

                  if (corpo.length == 0)
                    return res.status(200).send({
                      status: 402,
                      message:
                        'Corporation ' +
                        ' ' +
                        `'${userContacts[i].Corporation}'` +
                        ' ' +
                        ' does not exist!',
                    });

                  corporationId = corpo[0].id;
                } else {
                  userContacts[i].Corporation = null;
                }
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    'State Required For ' +
                    ' ' +
                    `'${userContacts[i].Salary_Grade}'` +
                    ' ' +
                    ' Grade ',
                });
              }
            }

            //only for update
            if (check == 1) {
              if (user) {
                const yearmonth = +userContacts[i].SalaryFromYYYYMM;

                const salarydata = await getUserSalaryMasterByMonth(
                  user.userMasterID,
                  yearmonth
                );

                const gradestructure = await executeQuery(
                  `
                      
                      select gss."gradeStructureID", MAX(hsm."salaryFromYYYYMM") from "hrSalaryMasters" as hsm left OUTER join "gradeSalaryStructures" as gss on hsm."gradeSalaryStructureID" = gss."gradeSalaryStructureID" where hsm."userMasterID"=` +
                    user.userMasterID +
                    ` and hsm."salaryFromYYYYMM" <=` +
                    yearmonth +
                    ` GROUP BY gss."gradeStructureID",hsm."salaryFromYYYYMM" ORDER by hsm."salaryFromYYYYMM" DESC limit 1 
                       `
                );

                if (salarydata.length > 0) {
                  const gross =
                    salarydata.find((e) => e.payheadMasterId == 50)
                      ?.EmployeeSalaryAmount || 0;

                  if (
                    gross != +userContacts[i].Gross_Salary ||
                    gradestructure[0].gradeStructureID != gradeid ||
                    +yearmonth != +gradestructure[0].max
                  ) {
                    const findsalary = await HrSalaryTransaction.findOne({
                      where: {
                        userMasterID: +user.userMasterID,
                      },
                      order: [['salaryYYYYMM', 'DESC']],
                    });

                    userContacts[i].salaryFromYYYYMM = yearmonth;

                    if (findsalary) {
                      // check if salary calculated of entered month or future month
                      if (+findsalary.salaryYYYYMM >= +yearmonth) {
                        return res.status(200).send({
                          status: 402,
                          message:
                            'Salary Already Calculated for: ' +
                            `'${findsalary.salaryYYYYMM}' month ` +
                            ' of ' +
                            ' ' +
                            `'${userContacts[i].Mobileno}'` +
                            ' ' +
                            'So, you can not update Salary_Grade ',
                        });
                      }
                    }
                    // check if entered month and current salary structure month is same
                    if (yearmonth == gradestructure[0].max) {
                      userContacts[i].deleteStructure = true;
                    }

                    userContacts[i].body = {
                      grade_salary_structure_data,
                      ctc: +userContacts[i].Gross_Salary,
                      stateid: +stateid || null,
                      AmountIn: '1',
                      yearmonth: yearmonth,
                      gender: user.gender,
                      skillCategory: userContacts[i].SkillCategory_MinWages,
                      hasMinimumWages: userContacts[i].hasMinimumWages,
                      gradeid: gradeid,
                      userMasterID: user.userMasterID,
                      corporationId,
                    };
                  }
                } else {
                  userContacts[i].body = {
                    grade_salary_structure_data,
                    ctc: +userContacts[i].Gross_Salary,
                    stateid: +stateid || null,
                    AmountIn: '1',
                    yearmonth:
                      String(userContacts[i].JoinDate).slice(0, 4) +
                      String(userContacts[i].JoinDate).slice(5, 7),
                    gender: user.gender,
                    skillCategory: userContacts[i].SkillCategory_MinWages,
                    hasMinimumWages: userContacts[i].hasMinimumWages,
                    gradeid: gradeid,
                    userMasterID: user.userMasterID,
                    corporationId,
                  };

                  userContacts[i].salaryFromYYYYMM =
                    String(userContacts[i].JoinDate).slice(0, 4) +
                    String(userContacts[i].JoinDate).slice(5, 7);
                }
              } else {
                return res.status(200).send({
                  status: 402,
                  message:
                    ' Mobile No. ' +
                    ' ' +
                    `'${userContacts[i].Mobileno}'` +
                    ' ' +
                    ' does not Exist . ',
                });
              }
            }
          } else {
            return res.status(200).send({
              status: 402,
              message:
                'Gross_Salary is  Required For ' +
                ' ' +
                `'${userContacts[i].Salary_Grade}'` +
                ' ' +
                ' Grade ',
            });
          }
        }

        function checkMO(e) {
          return e.userNumber.trim() == userContacts[i].Mobileno.trim();
        }

        const mobile_number2 = mobile_number1.filter(checkMO);

        if (check == 0) {
          // Check == 0 (Add)

          if (mobile_number2.length > 0) {
            return res.status(200).send({
              status: 402,
              message:
                ' Mobile No. ' +
                ' ' +
                `'${userContacts[i].Mobileno}'` +
                ' ' +
                ' Already Exist. ',
            });
          } else {
            AddArray.push(userContacts[i]);
          }
        } else {
          // Check == 1 (Update)
          if (user) {
            userContacts[i].userMasterID = user.userMasterID;
            UpdateArray.push(userContacts[i]);
          } else {
            return res.status(200).send({
              status: 402,
              message:
                ' Mobile No. ' +
                ' ' +
                `'${userContacts[i].Mobileno}'` +
                ' ' +
                ' does not Exist . ',
            });
          }
        }
      }

      const companyid = [];

      let data = await companyMasters.findOne({
        where: { companyMasterID: companyMasterID, status: 1 },
      });

      let compid;
      if (
        data.parentCompanyMasterID != null &&
        data.parentCompanyMasterID != '0'
      ) {
        compid = data.parentCompanyMasterID;

        companyid.push(parseInt(data.parentCompanyMasterID));
        let get_one_data = await companyMasters.findAll({
          where: {
            parentCompanyMasterID: data.parentCompanyMasterID,
            status: [0, 1],
          },
        });
        for (let i = 0; i < get_one_data.length; i++) {
          companyid.push(get_one_data[i].companyMasterID);
        }
      } else {
        compid = companyMasterID;

        companyid.push(parseInt(companyMasterID));
        let get_one_data = await companyMasters.findAll({
          where: {
            parentCompanyMasterID: companyMasterID,
            status: [0, 1],
          },
        });
        for (let i = 0; i < get_one_data.length; i++) {
          companyid.push(get_one_data[i].companyMasterID);
        }
      }

      let check_tracking = await CompanySubscriptionMaster.findOne({
        attributes: ['totalUser'],
        where: {
          companyMasterID: compid,
          status: 1,
        },
      });

      const totalcount = await UserMaster.count({
        where: {
          companyMasterId: {
            [Sequelize.Op.in]: companyid,
          },
          status: {
            [Sequelize.Op.in]: ['1'],
          },
        },
      });

      if (check_tracking) {
        if (UpdateArray.length > 0) {
          await sequelize.transaction(async (t) => {
            for (let e of UpdateArray) {
              // add same company

              const userMasterID = e.userMasterID;

              let currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

              let updateusermaster = await UserMaster.update(
                {
                  firstName: e.First_Name.trim(),
                  middleName: e.Middle_Name ? e.Middle_Name.trim() : null,
                  lastName: e.Last_Name.trim(),

                  userNumber: e.Mobileno,
                  email: e.Email_Id,
                  officalEmail: e.officalEmail,
                  dob: e.BirthDate,
                  gender: e.Gender,
                  companyMasterId: companyMasterID,
                  maratialStatus: e.Marital_Status,
                  physicalDisability: e.Physical_Handicap,
                  status: 1,
                  admin: 0,
                  displayName: e.Full_Name,
                  otherContactNumber: e.otherContactNumber,
                  cugNumber: e.cugNumber,
                  updateBy: req.body.createBy,
                  updateByIp: req.body.createByIp,
                  localFName: e.localFName,
                  localMName: e.localMName,
                  localLName: e.localLName,
                  localDisplayName: e.localDisplayName,
                },
                {
                  where: {
                    userMasterID: userMasterID,
                  },
                  transaction: t,
                }
              );

              //For Updating RolePermissions of the user

              const RoleID = await RoleMaster.findOne({
                raw: true,
                where: Sequelize.and(
                  Sequelize.where(
                    sequelize.fn(
                      'TRIM',
                      sequelize.fn('LOWER', sequelize.col('roleName'))
                    ),
                    String(e.role).trim().toLowerCase()
                  ),
                  Sequelize.where(
                    sequelize.col('companyMasterID'),
                    companyMasterID
                  )
                ),
              });

              if (RoleID) {
                const roleid = +RoleID.roleMasterID;

                const previousRole = await UserRole.findOne({
                  raw: true,
                  where: {
                    userMasterID,
                  },
                });

                const pre_RoleId = previousRole
                  ? previousRole.roleMasterID
                  : null;

                if (roleid != pre_RoleId) {
                  await UserRole.destroy({
                    where: {
                      userMasterID: userMasterID,
                    },
                    hooks: true,
                    individualHooks: true,
                    user: req.userDetails,
                    transaction: t,
                  });

                  await UserRole.create(
                    {
                      userMasterID: userMasterID,
                      roleMasterID: roleid,
                    },
                    { user: req.userDetails, transaction: t }
                  );
                }
              }

              let bankMasterID;

              if (e.Bank != null && e.Bank != '') {
                let bankmaster = await executeQuery(
                  `
                   
                    select * from "bankMasters" where LOWER(TRIM("bankName")) = '` +
                    e.Bank.trim().toLowerCase() +
                    `' and status =1 
                                       `
                );

                bankMasterID = bankmaster[0].bankMasterID;
              } else {
                bankMasterID = null;
              }

              // pf bank

              let pfbankMasterID;

              if (e.PF_Bank != null && e.PF_Bank != '') {
                let bankmaster1 = await executeQuery(
                  `
                   
  select * from "bankMasters" where LOWER(TRIM("bankName")) = '` +
                    e.PF_Bank.trim().toLowerCase() +
                    `' and status =1 
                   `
                );

                pfbankMasterID = bankmaster1[0].bankMasterID;
              } else {
                pfbankMasterID = null;
              }

              let find_joining = await EmployeeJoiningDetails.findOne({
                where: {
                  userMasterID: userMasterID,
                },
                include: [{ model: UserMaster, attributes: ['isFNF'] }],
              });

              if (find_joining) {
                const isFNF = find_joining.userMaster?.isFNF || false;
                await EmployeeJoiningDetails.update(
                  {
                    employeeCode: e.Employee_Code,
                    dob: e.BirthDate,
                    joiningDate: e.JoinDate,
                    leavingDate: isFNF ? find_joining.leavingDate : e.LeftDate,
                    adharCard: e.AadharNo,
                    esicNumber: e.ESINo,
                    pfNumber: e.PFNo,
                    uanNumber: e.UANNo,
                    pancard: e.PANNo,
                    bankMasterID: bankMasterID,
                    bankIFSC: e.IFSCCode,
                    bankBranchID: e.bankBranchID,
                    bankAccountNo: e.AccountNo,
                    salaryCalculationAct: e.SalaryBase,
                    employment: e.Employeement_Type,
                    applicableDate: e.Employment_Applicable_Date,
                    salarytype: e.Salary_Type,
                    overtime: e.Overtime ? e.Overtime : 0,
                    noticePeriod: e.Notice_Period,
                    status: 1,
                    adharName: e.AadharName,
                    pfbankMasterID: pfbankMasterID,
                    pfjoiningDate: e.PF_JoinDate,
                    pfbankIFSC: e.PF_bankIFSC,
                    pfbankAccountNo: e.PF_bankACNO,
                    esicjoiningDate: e.ESI_JoinDate,
                    bloodgroup: e.BloodGroup,
                    nationality: e.Nationality,
                    endDate: e.Employment_End_Date,
                    biometricSerialNo: e.BiometricSerialNo,
                    biometricCode: e.BiometricCode,
                    attendanceFrom: e.attendanceFrom,
                    payrollFrequency: e.payrollFrequency,
                    updateBy: req.body.createBy,
                    updateByIp: req.body.createByIp,
                  },
                  {
                    where: {
                      userMasterID: userMasterID,
                    },
                    transaction: t,
                  }
                );
              } else {
                let Add_joingdata = await EmployeeJoiningDetails.create(
                  {
                    userMasterID: userMasterID,
                    employeeCode: e.Employee_Code,
                    dob: e.BirthDate,
                    joiningDate: e.JoinDate,
                    leavingDate: e.LeftDate,
                    adharCard: e.AadharNo,
                    esicNumber: e.ESINo,
                    pfNumber: e.PFNo,
                    uanNumber: e.UANNo,
                    pancard: e.PANNo,
                    bankMasterID: bankMasterID,
                    bankIFSC: e.IFSCCode,
                    bankBranchID: e.bankBranchID,
                    bankAccountNo: e.AccountNo,
                    salaryCalculationAct: e.SalaryBase,
                    employment: e.Employeement_Type,
                    applicableDate: e.Employment_Applicable_Date,
                    salarytype: e.Salary_Type,
                    overtime: e.Overtime ? e.Overtime : 0,
                    noticePeriod: e.Notice_Period,
                    status: 1,
                    adharName: e.AadharName,
                    pfbankMasterID: pfbankMasterID,
                    pfjoiningDate: e.PF_JoinDate,
                    pfbankIFSC: e.PF_bankIFSC,
                    pfbankAccountNo: e.PF_bankACNO,
                    esicjoiningDate: e.ESI_JoinDate,
                    bloodgroup: e.BloodGroup,
                    nationality: e.Nationality,
                    endDate: e.Employment_End_Date,
                    biometricSerialNo: e.BiometricSerialNo,
                    biometricCode: e.BiometricCode,
                    nameAsBank: e.Full_Name,
                    attendanceFrom: e.attendanceFrom,
                    payrollFrequency: e.payrollFrequency,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  },
                  {
                    transaction: t,
                  }
                );
              }
              const findAdhar = await UserDocument.findOne({
                where: {
                  userMasterID: userMasterID,
                  status: 1,
                  documentListID: 1,
                },
                raw: true,
              });
              if (findAdhar) {
                await UserDocument.update(
                  {
                    documentNumber: e.AadharNo,
                    nameOnDocument: e.AadharName,
                  },
                  { where: { userDocumentID: findAdhar.userDocumentID } }
                );
              } else if (e.AadharNo || e.AadharName) {
                await UserDocument.create({
                  userMasterID: userMasterID,
                  documentListID: 1,
                  createBy: userMasterID,
                  verifyStatus: 1,
                  verifyBy: userMasterID,
                  documentNumber: e.AadharNo,
                  nameOnDocument: e.AadharName,
                });
              }

              //PAN Creation in EMP Document
              const findPAN = await UserDocument.findOne({
                where: {
                  userMasterID: userMasterID,
                  status: 1,
                  documentListID: 2,
                },
                raw: true,
              });

              if (findPAN) {
                await UserDocument.update(
                  {
                    documentNumber: e.PANNo,
                  },
                  { where: { userDocumentID: findPAN.userDocumentID } }
                );
              } else if (e.PANNo) {
                await UserDocument.create({
                  userMasterID: userMasterID,
                  documentListID: 2,
                  createBy: userMasterID,
                  verifyStatus: 1,
                  verifyBy: userMasterID,
                  documentNumber: e.PANNo,
                });
              }

              // for employeement

              if (e.Employeement_Type != null && e.Employeement_Type != '') {
                let employeement = await Employeeemployeement.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                  },
                  order: [['createdAt', 'DESC']],
                });

                let employeementenddate;

                if (
                  e.Employment_End_Date != null &&
                  e.Employment_End_Date != ''
                ) {
                  employeementenddate = e.Employment_End_Date;
                } else {
                  employeementenddate = null;
                }

                if (employeement) {
                  let user_employeement = employeement.employeement;

                  if (e.Employeement_Type != user_employeement) {
                    let create = await Employeeemployeement.create(
                      {
                        userMasterID: userMasterID,
                        employeement: e.Employeement_Type,
                        applicableDate: new Date(e.Employment_Applicable_Date),
                        endDate:
                          employeementenddate == null
                            ? null
                            : new Date(employeementenddate),
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  } else {
                    let update = await Employeeemployeement.update(
                      {
                        applicableDate: new Date(e.Employment_Applicable_Date),
                        endDate:
                          employeementenddate == null
                            ? null
                            : new Date(employeementenddate),
                        updateBy: req.body.createBy,
                        updateByIp: req.body.createByIp,
                      },
                      {
                        where: {
                          employeeEmployeementId:
                            employeement.employeeEmployeementId,
                        },
                        transaction: t,
                      }
                    );
                  }
                } else {
                  let create = await Employeeemployeement.create(
                    {
                      userMasterID: userMasterID,
                      employeement: e.Employeement_Type,
                      applicableDate: new Date(e.Employment_Applicable_Date),
                      endDate:
                        employeementenddate == null
                          ? null
                          : new Date(employeementenddate),
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                    },
                    {
                      transaction: t,
                    }
                  );
                }
              }

              // for local Address

              if (e.Local_Address != null && e.Local_Address != '') {
                let userlocalAddress = await UserAddress.findOne({
                  where: {
                    userMasterID: userMasterID,
                    addressType: 'temporary',
                    status: 1,
                  },
                });
                let localLangAddress = null;
                // if (convertNameToLocalName) {
                //   if (
                //     companyMasterID == 744 ||
                //     companyMasterID == 965 ||
                //     companyMasterID == 968 ||
                //     companyMasterID == 969 ||
                //     companyMasterID == 970 ||
                //     companyMasterID == 971 ||
                //     companyMasterID == 998 ||
                //     companyMasterID == 999 ||
                //     companyMasterID == 1000
                //   ) {
                //     try {
                //       const translate = new Translate({
                //         key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
                //       });

                //       const response = await translate.translate(
                //         [e.Local_Address],
                //         {
                //           from: 'en', // Explicitly specify English as the source
                //           to: 'mr',
                //           format: 'text',
                //           model: 'base',
                //         }
                //       );

                //       // Extract transliterated values
                //       localLangAddress = response[0]?.[0] || null;
                //     } catch (error) {
                //       console.error('Error in translation:', error);
                //     }
                //   }
                // }
                if (userlocalAddress) {
                  await UserAddress.update(
                    {
                      addressType: 'temporary',
                      landmark: e.Local_Address,
                      updateBy: req.body.createBy,
                      updateByIp: req.body.createByIp,
                      verifyStatus: 1,
                      verifyBy: req.body.createBy,
                      localLangAddress,
                    },
                    {
                      where: {
                        userMasterID: userMasterID,
                        addressType: 'temporary',
                        status: 1,
                      },
                      transaction: t,
                    }
                  );
                } else {
                  await UserAddress.create(
                    {
                      userMasterID: userMasterID,
                      addressType: 'temporary',
                      landmark: e.Local_Address,
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                      verifyStatus: 1,
                      verifyBy: req.body.createBy,
                      localLangAddress,
                    },
                    {
                      transaction: t,
                    }
                  );
                }
              } else {
                await UserAddress.update(
                  {
                    status: 2,
                  },
                  {
                    where: {
                      userMasterID: userMasterID,
                      addressType: 'temporary',
                    },
                  },
                  {
                    transaction: t,
                  }
                );
              }

              // for permanent Address

              if (e.Permanent_Address != null && e.Permanent_Address != '') {
                let Permanent_Address = await UserAddress.findOne({
                  where: {
                    userMasterID: userMasterID,
                    addressType: 'permanent',
                    status: 1,
                  },
                });
                let localLangAddress = null;
                // if (convertNameToLocalName) {
                //   if (
                //     companyMasterID == 744 ||
                //     companyMasterID == 965 ||
                //     companyMasterID == 968 ||
                //     companyMasterID == 969 ||
                //     companyMasterID == 970 ||
                //     companyMasterID == 971 ||
                //     companyMasterID == 998 ||
                //     companyMasterID == 999 ||
                //     companyMasterID == 1000
                //   ) {
                //     try {
                //       const translate = new Translate({
                //         key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
                //       });

                //       const response = await translate.translate(
                //         [e.Local_Address],
                //         {
                //           from: 'en', // Explicitly specify English as the source
                //           to: 'mr',
                //           format: 'text',
                //           model: 'base',
                //         }
                //       );

                //       // Extract transliterated values
                //       localLangAddress = response[0]?.[0] || null;
                //     } catch (error) {
                //       console.error('Error in translation:', error);
                //     }
                //   }
                // }
                if (Permanent_Address) {
                  await UserAddress.update(
                    {
                      addressType: 'permanent',
                      landmark: e.Permanent_Address,
                      updateBy: req.body.createBy,
                      updateByIp: req.body.createByIp,
                      verifyStatus: 1,
                      verifyBy: req.body.createBy,
                      localLangAddress,
                    },
                    {
                      where: {
                        userMasterID: userMasterID,
                        addressType: 'permanent',
                        status: 1,
                      },
                      transaction: t,
                    }
                  );
                } else {
                  await UserAddress.create(
                    {
                      userMasterID: userMasterID,
                      addressType: 'permanent',
                      landmark: e.Permanent_Address,
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                      verifyStatus: 1,
                      verifyBy: req.body.createBy,
                      localLangAddress,
                    },
                    {
                      transaction: t,
                    }
                  );
                }
              } else {
                await UserAddress.update(
                  {
                    status: 2,
                  },
                  {
                    where: {
                      userMasterID: userMasterID,
                      addressType: 'permanent',
                    },
                  },
                  {
                    transaction: t,
                  }
                );
              }

              // Attendance Policy

              if (e.Attendance_Policy != null && e.Attendance_Policy != '') {
                let uniquedata4 = await executeQuery(
                  `
                 
  select * from "attendancePolicies" where LOWER(TRIM("attendancePolicyName")) = '` +
                    e.Attendance_Policy.trim().toLowerCase() +
                    `' and "companyMasterID" = ` +
                    companyMasterID +
                    ` and status =1 `
                );

                let attendancePolicyID = uniquedata4[0].attendancePolicyID;

                let userAttendance = await EmployeeAttendancePolicy.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    startDate: {
                      [Sequelize.Op.lte]: currentDate,
                    },
                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.gte]: currentDate } },
                      { endDate: { [Sequelize.Op.is]: null } },
                    ],
                  },
                });

                let userAttendanceafter =
                  await EmployeeAttendancePolicy.findOne({
                    where: {
                      userMasterID: userMasterID,
                      status: 1,
                      startDate: {
                        [Sequelize.Op.gt]: currentDate,
                      },
                    },
                  });

                if (userAttendance) {
                  if (attendancePolicyID != userAttendance.attendancePolicyID) {
                    let date1 = new Date(currentDate);
                    date1.setDate(date1.getDate() - 1);

                    let end_date =
                      date1.getFullYear() +
                      '-' +
                      String(date1.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date1.getDate()).padStart(2, '0');

                    let end_date1;
                    if (userAttendanceafter) {
                      let date2 = new Date(userAttendanceafter.startDate);

                      date2.setDate(date2.getDate() - 1);

                      end_date1 =
                        date2.getFullYear() +
                        '-' +
                        String(date2.getMonth() + 1).padStart(2, '0') +
                        '-' +
                        String(date2.getDate()).padStart(2, '0');
                    } else {
                      end_date1 = null;
                    }

                    let update = await EmployeeAttendancePolicy.update(
                      {
                        endDate: new Date(end_date),
                        updateBy: req.body.createBy,
                        updateByIp: req.body.createByIp,
                      },
                      {
                        where: {
                          employeeAttendancePolicyID:
                            userAttendance.employeeAttendancePolicyID,
                        },
                        transaction: t,
                      }
                    );

                    let create = await EmployeeAttendancePolicy.create(
                      {
                        attendancePolicyID: attendancePolicyID,
                        userMasterID: userMasterID,
                        startDate: currentDate,
                        endDate: end_date1 == null ? null : new Date(end_date1),
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }
                } else {
                  let end_date1;
                  if (userAttendanceafter) {
                    let date2 = new Date(userAttendanceafter.startDate);

                    date2.setDate(date2.getDate() - 1);

                    end_date1 =
                      date2.getFullYear() +
                      '-' +
                      String(date2.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date2.getDate()).padStart(2, '0');
                  } else {
                    end_date1 = null;
                  }

                  let create = await EmployeeAttendancePolicy.create(
                    {
                      attendancePolicyID: attendancePolicyID,
                      userMasterID: userMasterID,
                      startDate: currentDate,
                      endDate: end_date1 == null ? null : new Date(end_date1),
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                    },
                    {
                      transaction: t,
                    }
                  );
                }
              }

              // salary policy

              let salarycycledate = null;

              if (e.Salary_Policy != null && e.Salary_Policy != '') {
                let uniquedata5 = await executeQuery(
                  ` 
                  select * from "salaryPolicies" where LOWER(TRIM("salaryPolicyName")) = '` +
                    e.Salary_Policy.trim().toLowerCase() +
                    `' and "companyMasterID" = ` +
                    companyMasterID +
                    ` and status =1 `
                );

                let salaryPolicyID = uniquedata5[0].salaryPolicyID;

                let cycledate = uniquedata5[0].salaryCycleDate;

                salarycycledate =
                  currentDate.slice(0, 8) +
                  (cycledate < 10 ? '0' + cycledate : cycledate);

                let usersalary = await EmployeeSalarypolicy.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    startDate: {
                      [Sequelize.Op.lte]: currentDate,
                    },
                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.gte]: currentDate } },
                      { endDate: { [Sequelize.Op.is]: null } },
                    ],
                  },
                });

                let usersalaryafter = await EmployeeSalarypolicy.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    startDate: {
                      [Sequelize.Op.gt]: new Date(cycledate),
                    },
                  },
                });

                let date1 = new Date(cycledate);
                date1.setDate(date1.getDate() - 1);

                let end_date =
                  date1.getFullYear() +
                  '-' +
                  String(date1.getMonth() + 1).padStart(2, '0') +
                  '-' +
                  String(date1.getDate()).padStart(2, '0');

                if (usersalary) {
                  if (salaryPolicyID != usersalary.salaryPolicyID) {
                    let usersalaryyearmonth =
                      new Date(usersalary.startDate).toISOString().slice(0, 4) +
                      new Date(usersalary.startDate).toISOString().slice(5, 7);
                    let currentyearmonth =
                      currentDate.slice(0, 4) + currentDate.slice(5, 7);

                    if (usersalaryyearmonth == currentyearmonth) {
                      let update = await EmployeeSalarypolicy.update(
                        {
                          salaryPolicyID: salaryPolicyID,

                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeSalaryPolicyID:
                              usersalary.employeeSalaryPolicyID,
                          },
                          transaction: t,
                        }
                      );
                    } else {
                      let end_date1;
                      if (usersalaryafter) {
                        let date2 = new Date(usersalaryafter.startDate);

                        date2.setDate(date2.getDate() - 1);

                        end_date1 =
                          date2.getFullYear() +
                          '-' +
                          String(date2.getMonth() + 1).padStart(2, '0') +
                          '-' +
                          String(date2.getDate()).padStart(2, '0');
                      } else {
                        end_date1 = null;
                      }

                      let update = await EmployeeSalarypolicy.update(
                        {
                          endDate: new Date(end_date),
                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeSalaryPolicyID:
                              usersalary.employeeSalaryPolicyID,
                          },
                          transaction: t,
                        }
                      );

                      let create = await EmployeeSalarypolicy.create(
                        {
                          salaryPolicyID: salaryPolicyID,
                          userMasterID: userMasterID,
                          startDate: new Date(cycledate),
                          endDate:
                            end_date1 == null ? null : new Date(end_date1),
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    }
                  }
                } else {
                  let end_date1;
                  if (usersalaryafter) {
                    let date2 = new Date(usersalaryafter.startDate);

                    date2.setDate(date2.getDate() - 1);

                    end_date1 =
                      date2.getFullYear() +
                      '-' +
                      String(date2.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date2.getDate()).padStart(2, '0');
                  } else {
                    end_date1 = null;
                  }

                  if (end_date1 != null) {
                    if (salaryPolicyID != usersalaryafter.salaryPolicyID) {
                      let create = await EmployeeSalarypolicy.create(
                        {
                          salaryPolicyID: salaryPolicyID,
                          userMasterID: userMasterID,
                          startDate: new Date(cycledate),
                          endDate:
                            end_date1 == null ? null : new Date(end_date1),
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    } else {
                      let update = await EmployeeSalarypolicy.update(
                        {
                          startDate: new Date(cycledate),

                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeSalaryPolicyID:
                              usersalaryafter.employeeSalaryPolicyID,
                          },
                          transaction: t,
                        }
                      );
                    }
                  } else {
                    let create = await EmployeeSalarypolicy.create(
                      {
                        salaryPolicyID: salaryPolicyID,
                        userMasterID: userMasterID,
                        startDate: new Date(cycledate),
                        endDate: end_date1 == null ? null : new Date(end_date1),
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }
                }
              }

              // weekoff policy

              if (e.WeekOff_Policy != null && e.WeekOff_Policy != '') {
                let uniquedata6 = await executeQuery(
                  `
      select * from "weekOffPolicies" WHERE LOWER(TRIM("weekOffPolicyName")) = '` +
                    e.WeekOff_Policy.trim().toLowerCase() +
                    `'  and "companyMasterID" = ` +
                    companyMasterID +
                    ` and status =1 `
                );

                let weekOffPolicyID = uniquedata6[0].weekOffPolicyID;

                let date_1;

                if (salarycycledate != null) {
                  date_1 = salarycycledate;
                } else {
                  let usersalary = await EmployeeSalarypolicy.findOne({
                    where: {
                      userMasterID: userMasterID,
                      status: 1,
                      startDate: {
                        [Sequelize.Op.lte]: currentDate,
                      },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: currentDate } },
                        { endDate: { [Sequelize.Op.is]: null } },
                      ],
                    },
                  });

                  if (usersalary) {
                    let cycledate = usersalary.salaryCycleDate;
                    date_1 =
                      currentDate.slice(0, 8) +
                      (cycledate < 10 ? '0' + cycledate : cycledate);
                  }

                  date_1 = currentDate.slice(0, 8) + '01';
                }

                let userweekoff = await EmployeeWeekOff.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.lte]: currentDate,
                    },
                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.gte]: currentDate } },
                      { endDate: { [Sequelize.Op.is]: null } },
                    ],
                  },
                });

                let userweekoffafter = await EmployeeWeekOff.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.gt]: currentDate,
                    },
                  },
                });

                let date1 = new Date(date_1);
                date1.setDate(date1.getDate() - 1);

                let end_date =
                  date1.getFullYear() +
                  '-' +
                  String(date1.getMonth() + 1).padStart(2, '0') +
                  '-' +
                  String(date1.getDate()).padStart(2, '0');

                if (userweekoff) {
                  if (weekOffPolicyID != userweekoff.weekOffPolicyID) {
                    let userweekoffyearmonth =
                      new Date(userweekoff.applicableDate)
                        .toISOString()
                        .slice(0, 4) +
                      new Date(userweekoff.applicableDate)
                        .toISOString()
                        .slice(5, 7);
                    let currentyearmonth =
                      currentDate.slice(0, 4) + currentDate.slice(5, 7);

                    if (currentyearmonth == userweekoffyearmonth) {
                      let update = await EmployeeWeekOff.update(
                        {
                          weekOffPolicyID: weekOffPolicyID,
                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeWeekOffID: userweekoff.employeeWeekOffID,
                          },
                          transaction: t,
                        }
                      );
                    } else {
                      let end_date1;
                      if (userweekoffafter) {
                        let date2 = new Date(userweekoffafter.applicableDate);

                        date2.setDate(date2.getDate() - 1);

                        end_date1 =
                          date2.getFullYear() +
                          '-' +
                          String(date2.getMonth() + 1).padStart(2, '0') +
                          '-' +
                          String(date2.getDate()).padStart(2, '0');
                      } else {
                        end_date1 = null;
                      }

                      let update = await EmployeeWeekOff.update(
                        {
                          endDate: end_date,
                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeWeekOffID: userweekoff.employeeWeekOffID,
                          },
                          transaction: t,
                        }
                      );

                      let create = await EmployeeWeekOff.create(
                        {
                          weekOffPolicyID: weekOffPolicyID,
                          userMasterID: userMasterID,
                          applicableDate: date_1,
                          endDate: end_date1 == null ? null : end_date1,
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    }
                    //Add WeeoffFunction
                    const tempWeekoff =
                      await add_WeekOffHoliday_With_Transaction(
                        companyMasterID,
                        [userMasterID],
                        new Date(date_1).toISOString().slice(0, 10),
                        weekOffPolicyID,
                        null,
                        true,
                        null,
                        t
                      );

                    await weekoffHolidayTran.destroy(
                      {
                        where: {
                          userMasterID: userMasterID,
                          date: {
                            [Sequelize.Op.gte]: new Date(date_1)
                              .toISOString()
                              .slice(0, 10),
                          },
                          tableName: 'weekoff',
                        },
                      },
                      { transaction: t }
                    );

                    await weekoffHolidayTran.bulkCreate(tempWeekoff, {
                      transaction: t,
                    });
                  }
                } else {
                  let end_date1;
                  if (userweekoffafter) {
                    let date2 = new Date(userweekoffafter.applicableDate);

                    date2.setDate(date2.getDate() - 1);

                    end_date1 =
                      date2.getFullYear() +
                      '-' +
                      String(date2.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date2.getDate()).padStart(2, '0');
                  } else {
                    end_date1 = null;
                  }

                  if (end_date1 != null) {
                    if (weekOffPolicyID != userweekoffafter.weekOffPolicyID) {
                      let create = await EmployeeWeekOff.create(
                        {
                          weekOffPolicyID: weekOffPolicyID,
                          userMasterID: userMasterID,
                          applicableDate: date_1,
                          endDate: end_date1 == null ? null : end_date1,
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    } else {
                      let update = await EmployeeWeekOff.update(
                        {
                          applicableDate: date_1,
                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeWeekOffID:
                              userweekoffafter.employeeWeekOffID,
                          },
                          transaction: t,
                        }
                      );
                    }
                  } else {
                    let create = await EmployeeWeekOff.create(
                      {
                        weekOffPolicyID: weekOffPolicyID,
                        userMasterID: userMasterID,
                        applicableDate: date_1,
                        endDate: end_date1 == null ? null : end_date1,
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }
                  // Add WeeoffFunction

                  const tempWeekoff = await add_WeekOffHoliday_With_Transaction(
                    companyMasterID,
                    [userMasterID],
                    new Date(date_1).toISOString().slice(0, 10),
                    weekOffPolicyID,
                    null,
                    true,
                    null,
                    t
                  );
                  await weekoffHolidayTran.destroy(
                    {
                      where: {
                        userMasterID: userMasterID,
                        date: {
                          [Sequelize.Op.gte]: new Date(date_1)
                            .toISOString()
                            .slice(0, 10),
                        },
                        tableName: 'weekoff',
                      },
                    },
                    { transaction: t }
                  );
                  await weekoffHolidayTran.bulkCreate(tempWeekoff, {
                    transaction: t,
                  });
                }
              }

              // holiday policy

              if (e.Holiday_Policy != null && e.Holiday_Policy != '') {
                let uniquedata7 = await executeQuery(
                  `
                    
  select * from "holidayPolicies" WHERE LOWER(TRIM("holidayPolicyName")) = '` +
                    e.Holiday_Policy.trim().toLowerCase() +
                    `'  and "companyMasterID" = ` +
                    companyMasterID +
                    ` and status =1 
                    `
                );

                let holidayPolicyID = uniquedata7[0].holidayPolicyID;

                let date_1;

                if (salarycycledate != null) {
                  date_1 = salarycycledate;
                } else {
                  let usersalary = await EmployeeSalarypolicy.findOne({
                    where: {
                      userMasterID: userMasterID,
                      status: 1,
                      startDate: {
                        [Sequelize.Op.lte]: currentDate,
                      },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: currentDate } },
                        { endDate: { [Sequelize.Op.is]: null } },
                      ],
                    },
                  });

                  if (usersalary) {
                    let cycledate = usersalary.salaryCycleDate;
                    date_1 =
                      currentDate.slice(0, 8) +
                      (cycledate < 10 ? '0' + cycledate : cycledate);
                  }

                  date_1 = currentDate.slice(0, 8) + '01';
                }

                let userholiday = await EmployeeHolidayPolicy.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.lte]: currentDate,
                    },
                    [Sequelize.Op.or]: [
                      { endDate: { [Sequelize.Op.gte]: currentDate } },
                      { endDate: { [Sequelize.Op.is]: null } },
                    ],
                  },
                });

                let userholidayafter = await EmployeeHolidayPolicy.findOne({
                  where: {
                    userMasterID: userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.gt]: currentDate,
                    },
                  },
                });

                let date1 = new Date(date_1);
                date1.setDate(date1.getDate() - 1);

                let end_date =
                  date1.getFullYear() +
                  '-' +
                  String(date1.getMonth() + 1).padStart(2, '0') +
                  '-' +
                  String(date1.getDate()).padStart(2, '0');

                if (userholiday) {
                  if (holidayPolicyID != userholiday.holidayPolicyID) {
                    let userholidayyearmonth =
                      new Date(userholiday.applicableDate)
                        .toISOString()
                        .slice(0, 4) +
                      new Date(userholiday.applicableDate)
                        .toISOString()
                        .slice(5, 7);
                    let currentyearmonth =
                      currentDate.slice(0, 4) + currentDate.slice(5, 7);

                    if (currentyearmonth == userholidayyearmonth) {
                      let update = await EmployeeHolidayPolicy.update(
                        {
                          holidayPolicyID: holidayPolicyID,

                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeholidayPolicyID:
                              userholiday.employeeholidayPolicyID,
                          },
                          transaction: t,
                        }
                      );
                    } else {
                      let end_date1;
                      if (userholidayafter) {
                        let date2 = new Date(userholidayafter.applicableDate);

                        date2.setDate(date2.getDate() - 1);

                        end_date1 =
                          date2.getFullYear() +
                          '-' +
                          String(date2.getMonth() + 1).padStart(2, '0') +
                          '-' +
                          String(date2.getDate()).padStart(2, '0');
                      } else {
                        end_date1 = null;
                      }

                      let update = await EmployeeHolidayPolicy.update(
                        {
                          endDate: new Date(end_date),

                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeholidayPolicyID:
                              userholiday.employeeholidayPolicyID,
                          },
                          transaction: t,
                        }
                      );

                      let create = await EmployeeHolidayPolicy.create(
                        {
                          holidayPolicyID: holidayPolicyID,
                          userMasterID: userMasterID,
                          applicableDate: new Date(date_1),
                          endDate:
                            end_date1 == null ? null : new Date(end_date1),
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    }

                    let holidayDates = [];
                    holidayDates = await getHolidayDates(
                      holidayPolicyID,
                      new Date(date_1).toISOString().slice(0, 10),
                      null,
                      userMasterID,
                      t
                    );
                    await weekoffHolidayTran.destroy(
                      {
                        where: {
                          userMasterID: userMasterID,
                          date: {
                            [Sequelize.Op.gte]: new Date(date_1)
                              .toISOString()
                              .slice(0, 10),
                          },
                          tableName: 'holiday',
                        },
                      },
                      { transaction: t }
                    );
                    await weekoffHolidayTran.bulkCreate(holidayDates, {
                      transaction: t,
                    });
                  }
                } else {
                  let end_date1;
                  if (userholidayafter) {
                    let date2 = new Date(userholidayafter.applicableDate);

                    date2.setDate(date2.getDate() - 1);

                    end_date1 =
                      date2.getFullYear() +
                      '-' +
                      String(date2.getMonth() + 1).padStart(2, '0') +
                      '-' +
                      String(date2.getDate()).padStart(2, '0');
                  } else {
                    end_date1 = null;
                  }

                  if (end_date1 != null) {
                    if (holidayPolicyID != userholidayafter.holidayPolicyID) {
                      let create = await EmployeeHolidayPolicy.create(
                        {
                          holidayPolicyID: holidayPolicyID,
                          userMasterID: userMasterID,
                          applicableDate: new Date(date_1),
                          endDate:
                            end_date1 == null ? null : new Date(end_date1),
                          createBy: req.body.createBy,
                          createByIp: req.body.createByIp,
                        },
                        {
                          transaction: t,
                        }
                      );
                    } else {
                      let update = await EmployeeHolidayPolicy.update(
                        {
                          applicableDate: new Date(date_1),
                          updateBy: req.body.createBy,
                          updateByIp: req.body.createByIp,
                        },
                        {
                          where: {
                            employeeholidayPolicyID:
                              userholidayafter.employeeholidayPolicyID,
                          },
                          transaction: t,
                        }
                      );
                    }
                  } else {
                    let create = await EmployeeHolidayPolicy.create(
                      {
                        holidayPolicyID: holidayPolicyID,
                        userMasterID: userMasterID,
                        applicableDate: new Date(date_1),
                        endDate: end_date1 == null ? null : new Date(end_date1),
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }

                  let holidayDates = [];
                  holidayDates = await getHolidayDates(
                    holidayPolicyID,
                    new Date(date_1).toISOString().slice(0, 10),
                    null,
                    userMasterID,
                    t
                  );
                  await weekoffHolidayTran.destroy(
                    {
                      where: {
                        userMasterID: userMasterID,
                        date: {
                          [Sequelize.Op.gte]: new Date(date_1)
                            .toISOString()
                            .slice(0, 10),
                        },
                        tableName: 'holiday',
                      },
                    },
                    { transaction: t }
                  );
                  await weekoffHolidayTran.bulkCreate(holidayDates, {
                    transaction: t,
                  });
                }
              }

              // salary structure

              if (e.Salary_Grade != null && e.Salary_Grade != '') {
                if (e.deleteStructure) {
                  await HrSalaryMaster.destroy(
                    {
                      where: {
                        userMasterID: userMasterID,
                        salaryFromYYYYMM: e.salaryFromYYYYMM,
                      },
                    },
                    { transaction: t }
                  );
                }

                const body = e.body;

                if (body) {
                  const { salaryStructureData, minWagesMasterId } =
                    await assignSalaryStructure(
                      body.grade_salary_structure_data,
                      body.ctc,
                      body.stateid,
                      body.AmountIn,
                      body.yearmonth,
                      body.gender,
                      body.corporationId,
                      companyMasterID,
                      body.skillCategory,
                      null,
                      0,
                      body.hasMinimumWages,
                      [],
                      null
                    );

                  const finaldata1 = [];

                  for (let sd = 0; sd < salaryStructureData.length; sd++) {
                    const gradedata = {
                      userMasterID: userMasterID,
                      gradeSalaryStructureID:
                        salaryStructureData[sd].gradeSalaryStructureID,
                      EmployeeSalaryPer: null,
                      EmployeeSalaryAmount: salaryStructureData[sd].finalvalue,
                      salaryFromYYYYMM: e.salaryFromYYYYMM,
                      stateid: body.stateid || null,
                      AmountIn: '1',
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                      ActualEmployeeSalaryAmount:
                        salaryStructureData[sd].actualvalue,
                      skillCategory: body.skillCategory,
                      corporationId: body.corporationId,
                      minWagesMasterId: minWagesMasterId || null,
                    };

                    finaldata1.push(gradedata);
                  }

                  await HrSalaryMaster.bulkCreate(finaldata1, {
                    transaction: t,
                  });
                }
              }
            }
          });

          return res.status(200).send({
            status: 200,
            message: ' The File Updated Successfully: ' + req.file.originalname,
          });
        } else {
          if (
            Number(totalcount) + Number(AddArray.length) <=
            Number(check_tracking.totalUser)
          ) {
            AddArray.map((e) => {
              const joiningMonth = e.JoinDate
                ? String(e.JoinDate).slice(0, 4) +
                  '' +
                  String(e.JoinDate).slice(5, 7)
                : new Date().toISOString().slice(0, 4) +
                  '' +
                  new Date().toISOString().slice(5, 7);

              let UserListMap = {
                firstName: e.First_Name.trim(),
                middleName: e.Middle_Name ? e.Middle_Name.trim() : null,
                lastName: e.Last_Name.trim(),
                userNumber: e.Mobileno,
                email: e.Email_Id,
                officalEmail: e.officalEmail,
                dob: e.BirthDate,
                gender: e.Gender,
                companyMasterId: companyMasterID,
                maratialStatus: e.Marital_Status,
                physicalDisability: e.Physical_Handicap,
                isPhotoLock: 0,
                password: bcrypt.hashSync(
                  e.First_Name.substring(0, 4).toLowerCase() +
                    '' +
                    String(e.Mobileno).slice(-4),
                  salt
                ),
                status: 1,
                admin: 0,
                displayName: e.Full_Name,
                otherContactNumber: e.otherContactNumber,
                cugNumber: e.cugNumber,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
                localFName: e.localFName,
                localMName: e.localMName,
                localLName: e.localLName,
                localDisplayName: e.localDisplayName,
              };
              UserList.push(UserListMap);

              let JoiningMap = {
                employeeCode: e.Employee_Code,
                dob: e.BirthDate,
                joiningDate: e.JoinDate,
                leavingDate: e.LeftDate,
                adharCard: e.AadharNo,
                esicNumber: e.ESINo,
                pfNumber: e.PFNo,
                uanNumber: e.UANNo,
                pancard: e.PANNo,
                bankMasterID: e.Bank,
                bankIFSC: e.IFSCCode,
                bankBranchID: e.bankBranchID,
                bankAccountNo: e.AccountNo,
                salaryCalculationAct: e.SalaryBase,
                employment: e.Employeement_Type,
                applicableDate: e.Employment_Applicable_Date,
                endDate: e.Employment_End_Date,
                contractorId:
                  e.Employeement_Type == 'Contract' ? e.contractor_Name : null,
                salarytype: e.Salary_Type,
                overtime: e.Overtime ? e.Overtime : 0,
                noticePeriod: e.Notice_Period,
                status: 1,
                adharName: e.AadharName,
                pfbankMasterID: e.PF_Bank,
                pfjoiningDate: e.PF_JoinDate,
                pfbankIFSC: e.PF_bankIFSC,
                pfbankAccountNo: e.PF_bankACNO,
                esicjoiningDate: e.ESI_JoinDate,
                bloodgroup: e.BloodGroup,
                nationality: e.Nationality,
                biometricSerialNo: e.BiometricSerialNo,
                biometricCode: e.BiometricCode,
                attendanceFrom: 'mobileandbiometric',
                nameAsBank: e.Full_Name,
                attendanceFrom: e.attendanceFrom,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
                bankBranchID: e.bankBranchID,
                payrollFrequency:
                  e.payrollFrequency || PayrollFrequencyType.MONTHLY,
              };

              employeejoining.push(JoiningMap);

              let localAddressMap = {
                addressType: 'temporary',
                landmark: e.Local_Address,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
                verifyStatus: 1,
                verifyBy: req.body.createBy,
              };

              localAddress.push(localAddressMap);

              let PermanentAddressMap = {
                addressType: 'permanent',
                landmark: e.Permanent_Address,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
                verifyStatus: 1,
                verifyBy: req.body.createBy,
              };

              PermanentAddress.push(PermanentAddressMap);

              // only for add

              let BranchMap = {
                branchID: e.Branch,
                applicableDate: e.Branch_Applicable_Date,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              branchIDArr.push(BranchMap);

              let DepartmentMap = {
                departmentID: e.Department,
                applicableDate: e.Depart_Applicable_Date,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              departmentIDArr.push(DepartmentMap);

              let DesignationMap = {
                designationID: e.Designation,
                applicableDate: e.Desig_Applicable_Date,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              designationIDArr.push(DesignationMap);

              // shift

              let ShiftMap = {
                shiftID: e.SHIFT,
                startDate: new Date(startdate),
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              ShiftIDArr.push(ShiftMap);

              // Attendance

              let AttendanceMap = {
                attendancePolicyID: e.Attendance_Policy,
                startDate: new Date(startdate),
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              AttendanceIDArr.push(AttendanceMap);

              // Salary policy

              let SalaryPolicyMap = {
                salaryPolicyID: e.Salary_Policy,
                startDate: new Date(startdate),
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              SalaryIDArr.push(SalaryPolicyMap);

              // Weekoff policy

              let WeekoffMap = {
                weekOffPolicyID: e.WeekOff_Policy,
                applicableDate: new Date(startdate),
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              WeekoffIDArr.push(WeekoffMap);

              // Holiday policy

              let HolidayMap = {
                holidayPolicyID: e.Holiday_Policy,
                applicableDate: new Date(startdate),
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };

              HolidayIDArr.push(HolidayMap);

              // Skill Category Data

              SkillCategoryArray.push({
                skillCategory: e.SkillCategory,
                applicableYYYYMM: +joiningMonth,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              });

              // salary structure

              let SalaryStructureMap = {
                gradeStructureID: e.Salary_Grade,
                grossAmount: e.Gross_Salary,
                stateid: e.StateForPT,
                joiningdate: e.JoinDate,
                skillCategory: e.SkillCategory_MinWages,
                corporationId: e.Corporation,
              };

              SalaryGradeIDArr.push(SalaryStructureMap);

              // employyeement

              let employeementMap = {
                employeement: e.Employeement_Type,
                applicableDate: e.Employment_Applicable_Date,
                endDate: e.Employment_End_Date,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              };
              employeementIDArr.push(employeementMap);

              let employeeRole = {
                roleName: e.role,
              };

              f_permission.push(employeeRole);
            });

            await sequelize.transaction(async (t) => {
              let usermaster = await UserMaster.bulkCreate(UserList, {
                transaction: t,
              });

              let weekoffholidayArray = [];
              const permissionArray = [];

              for (let k = 0; k < UserList.length; k++) {
                employeejoining[k].userMasterID = usermaster[k].userMasterID;

                //Aadhar Creation in EMP Document
                if (
                  employeejoining[k].adharCard ||
                  employeejoining[k].adharName
                ) {
                  let tempOBJ = {
                    userMasterID: usermaster[k].userMasterID,
                    documentListID: 1,
                    createBy: usermaster[k].userMasterID,
                    verifyStatus: 1,
                    verifyBy: usermaster[k].userMasterID,
                    documentNumber: employeejoining[k].adharCard,
                    nameOnDocument: employeejoining[k].adharName,
                  };
                  Empdocument.push(tempOBJ);
                }

                //PAN Creation in EMP Document
                if (employeejoining[k].pancard) {
                  let tempOBJ = {
                    userMasterID: usermaster[k].userMasterID,
                    documentListID: 2,
                    createBy: usermaster[k].userMasterID,
                    verifyStatus: 1,
                    verifyBy: usermaster[k].userMasterID,
                    documentNumber: employeejoining[k].pancard,
                  };
                  Empdocument.push(tempOBJ);
                }

                // only for add

                if (check == 0) {
                  branchIDArr[k].userMasterID = usermaster[k].userMasterID;

                  departmentIDArr[k].userMasterID = usermaster[k].userMasterID;

                  designationIDArr[k].userMasterID = usermaster[k].userMasterID;

                  ShiftIDArr[k].userMasterID = usermaster[k].userMasterID;

                  SkillCategoryArray[k].userMasterID =
                    usermaster[k].userMasterID;
                }

                AttendanceIDArr[k].userMasterID = usermaster[k].userMasterID;

                SalaryIDArr[k].userMasterID = usermaster[k].userMasterID;

                WeekoffIDArr[k].userMasterID = usermaster[k].userMasterID;

                HolidayIDArr[k].userMasterID = usermaster[k].userMasterID;

                PermanentAddress[k].userMasterID = usermaster[k].userMasterID;

                localAddress[k].userMasterID = usermaster[k].userMasterID;

                SalaryGradeIDArr[k].userMasterID = usermaster[k].userMasterID;

                employeementIDArr[k].userMasterID = usermaster[k].userMasterID;

                //For Updating RolePermissions of the user

                const RoleID = await RoleMaster.findOne({
                  raw: true,
                  where: Sequelize.and(
                    Sequelize.where(
                      sequelize.fn(
                        'TRIM',
                        sequelize.fn('LOWER', sequelize.col('roleName'))
                      ),
                      String(f_permission[k].roleName).trim().toLowerCase()
                    ),
                    Sequelize.where(
                      sequelize.col('companyMasterID'),
                      companyMasterID
                    )
                  ),
                });

                if (RoleID) {
                  const Roleid = RoleID.roleMasterID;

                  await UserRole.create(
                    {
                      userMasterID: usermaster[k].userMasterID,
                      roleMasterID: Roleid,
                    },
                    { user: req.userDetails, transaction: t }
                  );
                }

                // localAddress

                if (
                  localAddress[k].landmark != null &&
                  localAddress[k].landmark != ''
                ) {
                  f_localAddress.push(localAddress[k]);
                }

                // permanent address

                if (
                  PermanentAddress[k].landmark != null &&
                  PermanentAddress[k].landmark != ''
                ) {
                  f_permanentAddress.push(PermanentAddress[k]);
                }

                // employeement

                if (
                  employeementIDArr[k].employeement != null &&
                  employeementIDArr[k].employeement != ''
                ) {
                  f_employeement.push(employeementIDArr[k]);
                }

                // bank

                if (
                  employeejoining[k].bankMasterID != null &&
                  employeejoining[k].bankMasterID != ''
                ) {
                  let bankmaster = await executeQuery(
                    `
                     
                      select * from "bankMasters" where LOWER(TRIM("bankName")) = '` +
                      employeejoining[k].bankMasterID.trim().toLowerCase() +
                      `' and status =1 
                                         `
                  );

                  employeejoining[k].bankMasterID = bankmaster[0].bankMasterID;
                } else {
                  employeejoining[k].bankMasterID = null;
                }

                // pf bank

                if (
                  employeejoining[k].pfbankMasterID != null &&
                  employeejoining[k].pfbankMasterID != ''
                ) {
                  let bankmaster1 = await executeQuery(
                    `
                     
  select * from "bankMasters" where LOWER(TRIM("bankName")) = '` +
                      employeejoining[k].pfbankMasterID.trim().toLowerCase() +
                      `' and status =1 
                     `
                  );

                  employeejoining[k].pfbankMasterID =
                    bankmaster1[0].bankMasterID;
                } else {
                  employeejoining[k].pfbankMasterID = null;
                }

                // only for add

                if (check == 0) {
                  // branch

                  if (
                    branchIDArr[k].branchID != null &&
                    branchIDArr[k].branchID != ''
                  ) {
                    let uniquedata = await executeQuery(
                      `
                     
  select * from "branchMasters" where LOWER(TRIM("branchName")) ='` +
                        branchIDArr[k].branchID.trim().toLowerCase() +
                        `' and "companyMasterID" = ` +
                        companyMasterID +
                        ` and status =1 `
                    );

                    branchIDArr[k].branchID = uniquedata[0].branchMasterID;
                  }

                  // depart

                  if (
                    departmentIDArr[k].departmentID != null &&
                    departmentIDArr[k].departmentID != ''
                  ) {
                    let uniquedata1 = await executeQuery(
                      `
                     
  select * from departments WHERE LOWER(TRIM("departmentName")) = '` +
                        departmentIDArr[k].departmentID.trim().toLowerCase() +
                        `' and "companyMasterID" = ` +
                        companyMasterID +
                        ` and status =1 `
                    );

                    departmentIDArr[k].departmentID =
                      uniquedata1[0].departmentId;
                  }

                  // desig

                  if (
                    designationIDArr[k].designationID != null &&
                    designationIDArr[k].designationID != ''
                  ) {
                    let uniquedata2 = await executeQuery(
                      `
                     
  select * from designations WHERE LOWER(TRIM("designationName")) = '` +
                        designationIDArr[k].designationID.trim().toLowerCase() +
                        `' and "companyMasterID" = ` +
                        companyMasterID +
                        ` and status =1 `
                    );

                    designationIDArr[k].designationID =
                      uniquedata2[0].designationId;
                  }
                }

                // salary policy

                if (
                  SalaryIDArr[k].salaryPolicyID != null &&
                  SalaryIDArr[k].salaryPolicyID != ''
                ) {
                  let uniquedata5 = await executeQuery(
                    ` 
                      select * from "salaryPolicies" where LOWER(TRIM("salaryPolicyName")) = '` +
                      SalaryIDArr[k].salaryPolicyID.trim().toLowerCase() +
                      `' and "companyMasterID" = ` +
                      companyMasterID +
                      ` and status =1 `
                  );

                  SalaryIDArr[k].salaryPolicyID = uniquedata5[0].salaryPolicyID;

                  if (
                    uniquedata5[0].salaryCycleDate != null &&
                    uniquedata5[0].salaryCycleDate != ''
                  ) {
                    let cycledate = uniquedata5[0].salaryCycleDate;

                    let applicabledate =
                      startdate.slice(0, 8) +
                      (cycledate < 10 ? '0' + cycledate : cycledate);

                    WeekoffIDArr[k].applicableDate = new Date(applicabledate);
                    HolidayIDArr[k].applicableDate = new Date(applicabledate);
                    ShiftIDArr[k].startDate = new Date(applicabledate);
                    SalaryIDArr[k].startDate = new Date(applicabledate);
                  }

                  // push salary policy
                  f_salary.push(SalaryIDArr[k]);
                }

                // only for add
                if (check == 0) {
                  // shift

                  if (
                    ShiftIDArr[k].shiftID != null &&
                    ShiftIDArr[k].shiftID != ''
                  ) {
                    let uniquedata3 = await executeQuery(
                      `
                    
  select * from shifts where LOWER(TRIM("shiftName")) = '` +
                        ShiftIDArr[k].shiftID.trim().toLowerCase() +
                        `' and "companyMasterID" = ` +
                        companyMasterID +
                        ` and status =1 `
                    );

                    ShiftIDArr[k].shiftID = uniquedata3[0].shiftID;
                    // push shift
                    f_shift.push(ShiftIDArr[k]);
                  }

                  // skill category

                  if (SkillCategoryArray[k].skillCategory) {
                    finalSkillCategoryArray.push(SkillCategoryArray[k]);
                  }
                }

                // Attendance Policy

                if (
                  AttendanceIDArr[k].attendancePolicyID != null &&
                  AttendanceIDArr[k].attendancePolicyID != ''
                ) {
                  let uniquedata4 = await executeQuery(
                    `
                     
  select * from "attendancePolicies" where LOWER(TRIM("attendancePolicyName")) = '` +
                      AttendanceIDArr[k].attendancePolicyID
                        .trim()
                        .toLowerCase() +
                      `' and "companyMasterID" = ` +
                      companyMasterID +
                      ` and status =1 `
                  );

                  AttendanceIDArr[k].attendancePolicyID =
                    uniquedata4[0].attendancePolicyID;

                  // push Attendance

                  f_attendance.push(AttendanceIDArr[k]);
                }

                // weekoff policy

                if (
                  WeekoffIDArr[k].weekOffPolicyID != null &&
                  WeekoffIDArr[k].weekOffPolicyID != ''
                ) {
                  let uniquedata6 = await executeQuery(
                    `
                      select * from "weekOffPolicies" WHERE LOWER(TRIM("weekOffPolicyName")) = '` +
                      WeekoffIDArr[k].weekOffPolicyID.trim().toLowerCase() +
                      `'  and "companyMasterID" = ` +
                      companyMasterID +
                      ` and status =1 `
                  );

                  WeekoffIDArr[k].weekOffPolicyID =
                    uniquedata6[0].weekOffPolicyID;

                  // push weekoff policy

                  f_wekoff.push(WeekoffIDArr[k]);

                  const tempWeekoff = await add_WeekOffHoliday_With_Transaction(
                    companyMasterID,
                    [usermaster[k].userMasterID],
                    startdate,
                    uniquedata6[0].weekOffPolicyID,
                    null,
                    true,
                    null,
                    t
                  );

                  weekoffholidayArray = [
                    ...weekoffholidayArray,
                    ...tempWeekoff,
                  ];
                }

                // holiday policy

                if (
                  HolidayIDArr[k].holidayPolicyID != null &&
                  HolidayIDArr[k].holidayPolicyID != ''
                ) {
                  let uniquedata7 = await executeQuery(
                    `
                      
  select * from "holidayPolicies" WHERE LOWER(TRIM("holidayPolicyName")) = '` +
                      HolidayIDArr[k].holidayPolicyID.trim().toLowerCase() +
                      `'  and "companyMasterID" = ` +
                      companyMasterID +
                      ` and status =1 
                      `
                  );

                  HolidayIDArr[k].holidayPolicyID =
                    uniquedata7[0].holidayPolicyID;

                  // push holiday policy
                  f_holiday.push(HolidayIDArr[k]);

                  let holidayDates = [];
                  holidayDates = await getHolidayDates(
                    uniquedata7[0].holidayPolicyID,
                    startdate,
                    null,
                    usermaster[k].userMasterID,
                    t
                  );

                  weekoffholidayArray = [
                    ...weekoffholidayArray,
                    ...holidayDates,
                  ];
                }

                // salary structure

                if (
                  SalaryGradeIDArr[k].gradeStructureID != null &&
                  SalaryGradeIDArr[k].gradeStructureID != ''
                ) {
                  let uniquedata7 = await executeQuery(
                    ` 
        
          select * from "gradeStructures" WHERE LOWER(TRIM("gradeName")) = '` +
                      SalaryGradeIDArr[k].gradeStructureID
                        .trim()
                        .toLowerCase() +
                      `' and "companyMasterID" = ` +
                      companyMasterID +
                      ` and status =1 `
                  );

                  SalaryGradeIDArr[k].gradeStructureID =
                    uniquedata7[0].gradeStructureID;

                  const grade_salary_structure_data =
                    await GradeSalaryStructure.findAll({
                      raw: true,
                      where: {
                        gradeStructureID: SalaryGradeIDArr[k].gradeStructureID,
                      },
                      include: [
                        {
                          model: HRSalaryFields,
                          attributes: [],
                          include: [{ model: Payheadmaster, attributes: [] }],
                        },
                        {
                          model: GradeStructure,
                          attributes: [],
                        },
                      ],
                      order: [
                        [
                          { model: HRSalaryFields, as: 'hrSalaryField' },
                          'salaryFieldSrNo',
                          'ASC',
                        ],
                        ['salaryfieldindex', 'ASC'],

                        // Order by payheadName in Payheadmaster
                        [
                          { model: HRSalaryFields, as: 'hrSalaryField' },
                          { model: Payheadmaster, as: 'Payheadmaster' },
                          'payheadName',
                          'ASC',
                        ],
                      ],
                      attributes: [
                        'gradeSalaryStructureID',
                        'gradeStructureID',
                        'salaryFieldID',
                        'fieldFixAmount',
                        'formula',
                        'salaryfieldindex',
                        'salaryfieldmaxrange',
                        'fieldFixAmount1',
                        'formula1',
                        'formulaPreference',
                        [
                          sequelize.col('hrSalaryField.payheadMasterId'),
                          'payheadMasterId',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldSide'),
                          'salaryFieldSide',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldAttanChk'),
                          'salaryFieldAttanChk',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldWhenMonth'),
                          'salaryFieldWhenMonth',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldRound'),
                          'salaryFieldRound',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldRoundNo'),
                          'salaryFieldRoundNo',
                        ],
                        [
                          sequelize.col('hrSalaryField.salaryFieldSrNo'),
                          'salaryFieldSrNo',
                        ],
                        [
                          sequelize.col('hrSalaryField.companyMasterID'),
                          'companyMasterID',
                        ],
                        [
                          sequelize.col('hrSalaryField.payheadDisplayName'),
                          'payheadDisplayName',
                        ],
                        [
                          sequelize.col('hrSalaryField.roundOffType'),
                          'roundOffType',
                        ],
                        [
                          sequelize.col('hrSalaryField.considerIn'),
                          'considerIn',
                        ],
                        [
                          sequelize.col(
                            'hrSalaryField.Payheadmaster.payheadName'
                          ),
                          'payheadName',
                        ],
                        [
                          sequelize.col('gradeStructure.baseOnCalculation'),
                          'baseOnCalculation',
                        ],
                      ],
                    });

                  const PTData = grade_salary_structure_data.find(
                    (e) => e.payheadMasterId == 15
                  );

                  // Find if min wages is used in formula or formula1
                  const hasMinimumWages = grade_salary_structure_data.some(
                    (item) =>
                      (item.formula &&
                        item.formula.includes('Minimum Wages')) ||
                      (item.formula1 && item.formula1.includes('Minimum Wages'))
                  );

                  let stateid = null,
                    corporationId = null;

                  if (hasMinimumWages || PTData) {
                    let uniquedata = await executeQuery(
                      `                 
  select * from "stateMasters" where LOWER(TRIM("stateName")) = '` +
                        SalaryGradeIDArr[k].stateid.trim().toLowerCase() +
                        `' and "countryMasterID"=103 and status=1 
                      `
                    );

                    stateid = uniquedata[0].stateMasterID;

                    // check for corpoaration

                    if (SalaryGradeIDArr[k].corporationId) {
                      const corpo = await executeQuery(
                        `                 
SELECT * from "corporations" where "stateMasterID"=${stateid} and LOWER(TRIM("corporationName")) = '` +
                          String(SalaryGradeIDArr[k].corporationId)
                            .trim()
                            .toLowerCase() +
                          `'
                      `
                      );

                      corporationId = corpo[0]?.id || null;
                    }
                  }

                  let yearmonth =
                    SalaryGradeIDArr[k].joiningdate.toString().slice(0, 4) +
                    SalaryGradeIDArr[k].joiningdate.toString().slice(5, 7);

                  const body = {
                    gradeid: SalaryGradeIDArr[k].gradeStructureID,
                    ctc: SalaryGradeIDArr[k].grossAmount,
                    userMasterID: SalaryGradeIDArr[k].userMasterID,
                    stateid: stateid || null,
                    AmountIn: '1',
                    yearmonth: yearmonth,
                    gender: usermaster[k].gender,
                    skillCategory: SalaryGradeIDArr[k].skillCategory,
                    corporationId: corporationId,
                  };

                  const { salaryStructureData, minWagesMasterId } =
                    await assignSalaryStructure(
                      grade_salary_structure_data,
                      body.ctc,
                      body.stateid,
                      body.AmountIn,
                      body.yearmonth,
                      body.gender,
                      body.corporationId,
                      companyMasterID,
                      body.skillCategory,
                      null,
                      0,
                      hasMinimumWages,
                      [],
                      null
                    );

                  for (let sd = 0; sd < salaryStructureData.length; sd++) {
                    let gradedata = {
                      userMasterID: SalaryGradeIDArr[k].userMasterID,
                      gradeSalaryStructureID:
                        salaryStructureData[sd].gradeSalaryStructureID,
                      EmployeeSalaryPer: null,
                      EmployeeSalaryAmount: salaryStructureData[sd].finalvalue,
                      salaryFromYYYYMM: yearmonth,
                      stateid: stateid || null,
                      AmountIn: '1',
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                      ActualEmployeeSalaryAmount:
                        salaryStructureData[sd].actualvalue,
                      skillCategory: body.skillCategory,
                      corporationId: body.corporationId,
                      minWagesMasterId: minWagesMasterId || null,
                    };

                    finaldata.push(gradedata);
                  }
                }
              }

              await EmployeeJoiningDetails.bulkCreate(employeejoining, {
                transaction: t,
              });

              await UserDocument.bulkCreate(Empdocument, {
                transaction: t,
              });

              await UserAddress.bulkCreate(f_localAddress, {
                transaction: t,
              });

              await UserAddress.bulkCreate(f_permanentAddress, {
                transaction: t,
              });

              await Employeeemployeement.bulkCreate(f_employeement, {
                transaction: t,
              });

              await EmployeeBranch.bulkCreate(branchIDArr, {
                transaction: t,
              });

              await EmployeeDepartment.bulkCreate(departmentIDArr, {
                transaction: t,
              });

              await EmployeeDesignation.bulkCreate(designationIDArr, {
                transaction: t,
              });

              await EmployeeShift.bulkCreate(f_shift, { transaction: t });

              await EmployeeAttendancePolicy.bulkCreate(f_attendance, {
                transaction: t,
              });

              await EmployeeSalarypolicy.bulkCreate(f_salary, {
                transaction: t,
              });

              await EmployeeWeekOff.bulkCreate(f_wekoff, {
                transaction: t,
              });

              await EmployeeHolidayPolicy.bulkCreate(f_holiday, {
                transaction: t,
              });
              await weekoffHolidayTran.bulkCreate(weekoffholidayArray, {
                transaction: t,
              });
              await HrSalaryMaster.bulkCreate(finaldata, {
                transaction: t,
              });

              await EmployeeSkillCategory.bulkCreate(finalSkillCategoryArray, {
                transaction: t,
              });

              // .catch((error) => {
              //   res.status(200).send({
              //     status: 401,
              //     message: "Fail to import data into database!",
              //     error: error.message,
              //   });
              // });
            });

            return res.status(200).send({
              status: 200,
              message:
                ' The File Uploaded  Successfully: ' + req.file.originalname,
            });
          } else {
            return res.status(200).json({
              message: 'you have exceed your limit please upgrade your plan! ',
            });
          }
        }
      } else {
        return res.status(200).json({
          message:
            'you do not have subscription plan. please subscribe to a plan',
        });
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.exportuserExcel = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      status,
      filter,
      exportData,
      branchMasterID,
      department,
      designation,
      searchQuery,
      divisionId,
      workingAreaId,
    } = req.body;
    let companyid = companyMasterID;
    let date = asiaKolkataDateTime(new Date()).slice(0, 10);
    let yearmonth = date.slice(0, 4) + date.slice(5, 7);
    const finaldata = [];

    const condition = {};
    if (+status == 1) condition.status = 1;
    else if (status == '0') condition.status = 0;
    else condition.status = 1;

    if (companyid) condition.companyMasterId = companyid;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          displayName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          userNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const order = [['firstName', 'ASC']];

    const includedModels = [
      { model: companyMaster },
      {
        required: false,
        model: EmployeeJoiningDetails,
        include: [
          {
            model: BankMaster,

            attributes: ['bankName'],
          },
          {
            model: BankMaster,
            as: 'employeePFBank',
            attributes: ['bankName'],
          },
        ],
      },
    ];

    if (req.userDetails && req.userDetails.role) {
      if (
        req.userDetails.role.roleType == roleType.BRANCH_WISE &&
        (!branchMasterID ||
          (Array.isArray(branchMasterID) && !branchMasterID.length))
      )
        branchMasterID = req.userDetails.accessibleBranches;
    }

    includedModels.push(
      // Employee Branch
      {
        model: EmployeeBranch,
        where: {
          status: 1,
          ...(branchMasterID && { branchID: branchMasterID }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: branchMasterID ? true : false,
        attributes: ['branchID', 'applicableDate'],
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
            attributes: ['branchName'],
          },
        ],
      },

      // Employee Designation
      {
        model: EmployeeDesignation,
        where: {
          status: 1,
          ...(designation && { designationID: designation }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: designation ? true : false,
        attributes: ['designationID', 'applicableDate'],
        include: [
          {
            model: Designation,
            as: 'designation',
            attributes: ['designationName'],
          },
        ],
      },
      // Employee Department
      {
        model: EmployeeDepartment,
        where: {
          status: 1,
          ...(department && { departmentID: department }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: department ? true : false,
        attributes: ['departmentID', 'applicableDate'],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['departmentName'],
          },
        ],
      },
      // Division
      {
        model: EmployeeDivision,
        where: {
          status: 1,
          ...(divisionId && { divisionId: divisionId }),
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: divisionId ? true : false,
        attributes: ['divisionId'],
        include: [
          {
            model: Division,
            attributes: ['divisionName'],
          },
        ],
      },

      // Working Area

      {
        model: EmployeeWorkingArea,
        where: {
          status: 1,
          ...(workingAreaId && { workingAreaId: workingAreaId }),
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: workingAreaId ? true : false,
        attributes: ['workingAreaId'],
        include: [
          {
            model: WorkingArea,
            attributes: ['workingAreaName'],
          },
        ],
      },

      // user Address

      {
        model: UserAddress,
        required: false,
        where: {
          status: 1,
          verifyStatus: 1,
        },
        include: [
          {
            model: CityMaster,
            attributes: ['cityName'],
            include: [
              {
                model: StateMaster,
                attributes: ['stateName'],
                include: [
                  { model: CountryMaster, attributes: ['countryName'] },
                ],
              },
            ],
          },
        ],
      },

      // Employee Shift
      {
        model: EmployeeShift,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['shiftsID', 'startDate'],
      },
      // Employee Working Location
      {
        model: EmployeeWorkingLocation,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['workingLocationIDs', 'startDate'],
      },

      // Employee Leave Policy

      {
        model: empLeavePolicy,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['employeeLeavePolicyID'],
      },

      // Attendance Policy

      {
        model: EmployeeAttendancePolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['attendancePolicyID'],
        include: [
          {
            model: AttendancePolicy,
            as: 'attendancePolicy',
            attributes: ['attendancePolicyName'],
          },
        ],
      },
      // Salary Policy
      {
        model: EmployeeSalaryPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['salaryPolicyID'],
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy',
            attributes: ['salaryPolicyName'],
          },
        ],
      },
      // Weekoff Policy
      {
        model: EmployeeWeekOff,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: date },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: date } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['weekOffPolicyID'],
        include: [
          {
            model: weekOffPolicy,
            as: 'weekoff',
            attributes: ['weekOffPolicyName'],
          },
        ],
      },
      // Holiday Policy
      {
        model: EmployeeHolidayPolicy,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['holidayPolicyID'],
        include: [
          {
            model: holidayPolicy,
            as: 'HolidayPolicy',
            attributes: ['holidayPolicyName'],
          },
        ],
      },
      // LC-EG Policy
      {
        model: EmployeeLateEarlyPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['lateEarlyPolicyMasterID', 'startDate'],
        include: [
          {
            model: LateEarlyPolicy,
            as: 'lateEarlyPolicy',
            attributes: ['lateEarlyPolicyName'],
          },
        ],
      },
      // Employee Attendance Bonus Policy
      {
        model: EmployeeAttendanceBonusPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['attendanceBonusPolicyId'],
        include: [
          {
            model: AttendanceBonusPolicy,
            attributes: ['attendanceBonusPolicyName'],
          },
        ],
      },

      // Employee Food Allowance Policy
      {
        model: EmployeeFoodAllowancePolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },

        required: false,
        separate: true,
        attributes: ['foodAllowancePolicyId'],
        include: [
          {
            model: FoodAllowancePolicy,
            attributes: ['foodAllowancePolicyName'],
          },
        ],
      },

      // Experience
      {
        model: UserExperience,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // Education
      {
        model: UserEducation,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // Family
      {
        model: userFamily,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // user Rights
      {
        model: UserRole,
        attributes: ['roleMasterID'],
        include: [{ model: RoleMaster, attributes: ['roleName'] }],
        limit: 1,
      }
    );

    // const userData = await executeQuery(query);
    const userData = await UserMaster.findAll({
      where: condition,
      order,
      include: includedModels,
    });

    const allUserIds = userData.map((e) => e.userMasterID);

    const AllUserSalaryData = await HrSalaryMaster.findAll({
      raw: true,
      where: {
        userMasterID: {
          [Sequelize.Op.in]: allUserIds,
        },
        [Sequelize.Op.and]: Sequelize.literal(`
        ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
          SELECT "userMasterID", MAX("salaryFromYYYYMM") AS "maxMonth"
          FROM "hrSalaryMasters"
          WHERE "salaryFromYYYYMM" <= ${yearmonth}
          AND "userMasterID" IN (${allUserIds.join(',')})
          GROUP BY "userMasterID"
        )
      `),
      },
      include: [
        {
          model: GradeSalaryStructure,
          include: [
            { model: GradeStructure, attributes: [] },
            {
              model: HRSalaryFields,
              where: {
                payheadMasterId: 50,
              },
              attributes: [],
            },
          ],
          attributes: [],
        },
        { model: StateMaster, required: false, attributes: [] },
        {
          model: Corporation,
          attributes: [],
        },
      ],
      attributes: [
        [
          Sequelize.col('gradeSalaryStructure.hrSalaryField.payheadMasterId'),
          'payheadMasterId',
        ],
        'stateid',
        'EmployeeSalaryAmount',
        'salaryFromYYYYMM',
        'userMasterID',
        'skillCategory',
        'corporationId',
        [Sequelize.col('stateMaster.stateName'), 'stateName'],

        [
          Sequelize.col(
            'gradeSalaryStructure.gradeStructure.baseOnCalculation'
          ),
          'baseOnCalculation',
        ],
        [
          Sequelize.col('gradeSalaryStructure.gradeStructure.gradeName'),
          'gradeName',
        ],

        [Sequelize.col('corporation.corporationName'), 'corporationName'],

        [
          Sequelize.col('gradeSalaryStructure.hrSalaryField.salaryFieldSrNo'),
          'salaryFieldSrNo',
        ],
      ],
    });

    for (const user of userData) {
      let shiftNames = '',
        workingLocation = '',
        leavePolicyName = '';
      if (user.employeeShifts.length > 0) {
        const shiftData = await Shift.findAll({
          raw: true,
          where: {
            shiftID: user.employeeShifts[0].shiftsID,
          },
        });

        shiftNames = shiftData.map((s) => s.shiftName).join(',');
      }

      if (user.employeeWorkingLocations.length > 0) {
        const locationData = await WorkingLocation.findAll({
          raw: true,
          where: {
            workingLocationID:
              user.employeeWorkingLocations[0].workingLocationIDs,
          },
        });

        workingLocation = locationData
          .map((s) => s.workingLocationName)
          .join(',');
      }

      if (user.empLeavePolicies.length > 0) {
        const leavePolicyData = await employeeLeavePolicy.findAll({
          raw: true,
          where: {
            id: user.empLeavePolicies[0].employeeLeavePolicyID,
          },
        });

        leavePolicyName = leavePolicyData
          .map((s) => s.leavePolicyName)
          .join(',');
      }

      const userPermanentAddress =
        user.userAddresses && user.userAddresses.length > 0
          ? user.userAddresses.find((e) => e.addressType == 'permanent')
          : null;
      const UserTempAddress =
        user.userAddresses && user.userAddresses.length > 0
          ? user.userAddresses.find((e) => e.addressType == 'temporary')
          : null;
      let user_permanentAddress = '';
      if (userPermanentAddress) {
        if (filter == 0) {
          user_permanentAddress += `${userPermanentAddress.landmark}`;
        } else {
          user_permanentAddress = ToformatAddress(userPermanentAddress);
        }
      }

      let user_tempAddress = '';
      if (UserTempAddress) {
        if (filter == 0) {
          user_tempAddress += `${UserTempAddress.landmark}`;
        } else {
          user_tempAddress = ToformatAddress(UserTempAddress);
        }
      }

      const employeejoining =
        user.employeeJoiningDetails && user.employeeJoiningDetails.length > 0
          ? user.employeeJoiningDetails[0]
          : null;

      const grossSalaryData = AllUserSalaryData.find(
        (e) => e.userMasterID == user.userMasterID && e.payheadMasterId == 50
      );

      const gross_Salary = grossSalaryData?.EmployeeSalaryAmount || 0;

      const corporation = grossSalaryData?.corporationName || null;

      const data = {};
      data['Employee_Code'] = employeejoining
        ? employeejoining.employeeCode
        : '';
      data['First_Name'] = user.firstName;
      data['Middle_Name'] = user.middleName;
      data['Last_Name'] = user.lastName;
      if (filter == 1) {
        data['Department'] =
          user.employeeDepartments.length > 0
            ? user.employeeDepartments[0].department.departmentName
            : '';
        data['Department Applicable Date'] =
          user.employeeDepartments.length > 0
            ? user.employeeDepartments[0].applicableDate
            : '';
        data['Designation'] =
          user.employeeDesignations.length > 0
            ? user.employeeDesignations[0].designation.designationName
            : '';
        data['Designation Applicable Date'] =
          user.employeeDesignations.length > 0
            ? user.employeeDesignations[0].applicableDate
            : '';
        data['Branch'] =
          user.employeeBranches.length > 0
            ? user.employeeBranches[0].branchMaster.branchName
            : '';
        data['Branch Applicable Date'] =
          user.employeeBranches.length > 0
            ? user.employeeBranches[0].applicableDate
            : '';
        data['Division'] =
          user.employeeDivisions.length > 0
            ? user.employeeDivisions[0].division.divisionName
            : '';
        data['Working Area'] =
          user.employeeWorkingAreas.length > 0
            ? user.employeeWorkingAreas[0].workingArea.workingAreaName
            : '';
      }

      data['Local_Address'] = user_tempAddress;
      data['Permanent_Address'] = user_permanentAddress;
      data['Mobileno'] = user.userNumber;
      data['Email_Id'] = user.email;
      data['Marital_Status'] = user.maratialStatus;
      data['SalaryBase'] = employeejoining
        ? employeejoining.salaryCalculationAct
        : '';
      data['Gender'] = user.gender;
      data['Bank'] =
        employeejoining && employeejoining.bankMaster
          ? employeejoining.bankMaster.bankName
          : '';
      data['AccountNo'] = employeejoining ? employeejoining.bankAccountNo : '';
      data['IFSCCode'] = employeejoining ? employeejoining.bankIFSC : '';
      data['BirthDate'] = employeejoining ? employeejoining.dob : '';
      data['JoinDate'] = employeejoining ? employeejoining.joiningDate : '';
      data['LeftDate'] = employeejoining ? employeejoining.leavingDate : '';
      data['PANNo'] = employeejoining ? employeejoining.pancard : '';
      data['AadharNo'] = employeejoining ? employeejoining.adharCard : '';
      data['AadharName'] = employeejoining ? employeejoining.adharName : '';
      data['PFNo'] = employeejoining ? employeejoining.pfNumber : '';
      data['UANNo'] = employeejoining ? employeejoining.uanNumber : '';
      data['PF_JoinDate'] = employeejoining
        ? employeejoining.pfjoiningDate
        : '';
      data['ESINo'] = employeejoining ? employeejoining.esicNumber : '';
      data['ESI_JoinDate'] = employeejoining
        ? employeejoining.esicjoiningDate
        : '';
      data['PF_Bank'] =
        employeejoining && employeejoining.employeePFBank
          ? employeejoining.employeePFBank.bankName
          : '';
      data['PF_bankIFSC'] = employeejoining ? employeejoining.pfbankIFSC : '';
      data['PF_bankACNO'] = employeejoining
        ? employeejoining.pfbankAccountNo
        : '';
      data['Employeement_Type'] = employeejoining
        ? employeejoining.employment
        : '';
      data['Employment Applicable Date'] = employeejoining
        ? employeejoining.applicableDate
        : '';
      data['Employment End Date'] = employeejoining
        ? employeejoining.endDate
        : '';
      data['Salary Type'] = employeejoining ? employeejoining.salarytype : '';

      data['Overtime'] = employeejoining
        ? employeejoining.overtime == 1
          ? 'YES'
          : employeejoining.overtime == 0
            ? 'NO'
            : ''
        : '';
      data['Notice Period(in days)'] = employeejoining
        ? employeejoining.noticePeriod
        : '';
      data['BloodGroup'] = employeejoining ? employeejoining.bloodgroup : '';
      data['Nationality'] = employeejoining ? employeejoining.nationality : '';
      data['Physical_Handicap'] = user.physicalDisability;
      if (filter == 1) {
        data['SHIFT'] = shiftNames;
        data['Working Location'] = workingLocation;
        data['Leave Policy'] = leavePolicyName;
        data['LC-EG Policy'] =
          user.employeeLateEarlyPolicies.length > 0
            ? user.employeeLateEarlyPolicies[0].lateEarlyPolicy
                .lateEarlyPolicyName
            : '';
        data['Attendance Bonus Policy'] =
          user.employeeAttendanceBonusPolicies.length > 0
            ? user.employeeAttendanceBonusPolicies[0].attendanceBonusPolicy
                .attendanceBonusPolicyName
            : '';
        data['Food Allowance Policy'] =
          user.employeeFoodAllowancePolicies.length > 0
            ? user.employeeFoodAllowancePolicies[0].foodAllowancePolicy
                .foodAllowancePolicyName
            : '';
      }
      data['Attendance_Policy'] =
        user.employeeAttendancePolicies.length > 0
          ? user.employeeAttendancePolicies[0].attendancePolicy
              .attendancePolicyName
          : '';
      data['Salary_Policy'] =
        user.employeeSalaryPolicies.length > 0
          ? user.employeeSalaryPolicies[0].salaryPolicy.salaryPolicyName
          : '';
      data['WeekOff_Policy'] =
        user.employeeWeekOffs.length > 0
          ? user.employeeWeekOffs[0].weekoff.weekOffPolicyName
          : '';
      data['Holiday_Policy'] =
        user.employeeHolidayPolicies.length > 0
          ? user.employeeHolidayPolicies[0].HolidayPolicy.holidayPolicyName
          : '';
      data['Gross_Salary'] = grossSalaryData ? gross_Salary : '';
      data['Salary_Grade'] = grossSalaryData ? grossSalaryData.gradeName : '';
      data['StateForPT'] = grossSalaryData ? grossSalaryData.stateName : '';
      data['Corporation'] = corporation;
      data['SalaryFromYYYYMM'] = grossSalaryData
        ? grossSalaryData.salaryFromYYYYMM
        : '';
      data['BiometricSerialNo'] = employeejoining
        ? employeejoining.biometricSerialNo
        : '';
      data['BiometricCode'] = employeejoining
        ? employeejoining.biometricCode
        : '';

      data['Role'] =
        user.userRoles.length > 0 && user.userRoles[0].roleMaster
          ? user.userRoles[0].roleMaster.roleName
          : '';
      data[`${othernumberLabel}`] = user.otherContactNumber;

      data['Attendance From'] = employeejoining?.attendanceFrom || '';
      if (showPayrollFrequency) {
        data['Payroll Frequency'] = employeejoining?.payrollFrequency || '';
      }
      data[`Cug Number`] = user.cugNumber;
      data['Offical_MailId'] = user.officalEmail;
      if (filter == 1) {
        if (user.userExperiences.length > 0) {
          for (let i = 0; i < user.userExperiences.length; i++) {
            const experience = user.userExperiences[i];
            data[`Experience-${i + 1}`] =
              `designation:${experience.designation} , fromDate:${experience.fromDate} , toDate:${experience.toDate} , organization:${experience.organization} , Role&Respo:${experience.roleRespo}`;
          }
        }

        if (user.userEducations.length > 0) {
          for (let i = 0; i < user.userEducations.length; i++) {
            const education = user.userEducations[i];
            data[`Education-${i + 1}`] =
              `qualification:${education.qualification} , yearOfPassing:${education.yearOfPassing} , grade:${education.grade} , percentageObtained:${education.percentageObtained} , institute:${education.institute} , university:${education.university}`;
          }
        }

        if (user.userFamilies.length > 0) {
          for (let i = 0; i < user.userFamilies.length; i++) {
            const family = user.userFamilies[i];
            data[`Family Member-${i + 1}`] =
              `memberName:${family.memberName} , dob:${family.dob} , gender:${family.gender} , relation:${family.relation} , contact:${family.contact}`;
          }
        }
      }

      finaldata.push(data);
    }

    if (exportData) {
      if (filter == 1) {
        // get All unique keys from array of objects
        const uniqueKeys = new Set();
        finaldata.forEach((obj) => {
          Object.keys(obj).forEach((key) => {
            uniqueKeys.add(key);
          });
        });

        // Convert Set to Array for sorting
        let allKeys = Array.from(uniqueKeys);

        // Define the order of key prefixes
        const keyOrder = ['Education', 'Experience', 'Family Member'];

        //  Sort keys based on the defined order
        allKeys.sort((a, b) => {
          const aPrefix = keyOrder.findIndex((prefix) => a.startsWith(prefix));
          const bPrefix = keyOrder.findIndex((prefix) => b.startsWith(prefix));

          // If both keys have defined prefixes, sort by order in keyOrder
          if (aPrefix !== -1 && bPrefix !== -1) {
            return aPrefix - bPrefix;
          }

          // If only one key has a defined prefix, that key comes first
          if (aPrefix !== -1) return -1;
          if (bPrefix !== -1) return 1;

          // If neither key has a defined prefix, sort alphabetically
          return a.localeCompare(b);
        });

        // Ensure all objects have all unique keys in the sorted order
        finaldata.forEach((obj) => {
          allKeys.forEach((key) => {
            if (!obj.hasOwnProperty(key)) {
              obj[key] = null; // Setting missing keys to null
            }
          });

          // Create a new object to preserve key order
          const orderedObj = {};
          allKeys.forEach((key) => {
            orderedObj[key] = obj[key];
          });

          // Replace original object with ordered object
          Object.assign(obj, orderedObj);
        });
      }
      await generateExcel(finaldata, 'EmployeeData', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: finaldata,
    });
  } catch (error) {
    next(error);
  }
};

const DDMMYYYYFormatDate = (date) => {
  if (!date) return '';
  return String(date).split('-').reverse().join('-');
};

exports.exportUsersAllData = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      status,
      exportData,
      branchMasterID,
      department,
      designation,
      searchQuery,
      divisionId,
      workingAreaId,
      // For Field Name change
      pfNumber,
      pfJoiningDate,
      pfBank,
      pfBankIFSCCode,
      pfBankAccountNumber,
      esicNumber,
      esicJoiningDate,
      esicEndMonth,
      salaryCalculationAct,
      aadharCardNumber,
      nameOnAadhar,
      viewAadhar,
      showBankBranch,
      bankIfscCodeLabel,
      showUanNumber,
      showpfbankAccountNo,
      showPanCard,
      showpfbankMasterID,
      showpfbankIFSC,
      showesicEndMonth,
    } = req.body;
    let companyid = companyMasterID;
    let date = asiaKolkataDateTime(new Date()).slice(0, 10);
    let yearmonth = date.slice(0, 4) + date.slice(5, 7);
    const finaldata = [];

    const condition = {};
    if (+status == 1) condition.status = 1;
    else if (status == '0') condition.status = 0;
    else condition.status = 1;

    if (companyid) condition.companyMasterId = companyid;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          displayName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          userNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const order = [['firstName', 'ASC']];

    const includedModels = [
      { model: companyMaster },
      {
        required: false,
        model: EmployeeJoiningDetails,
        include: [
          {
            model: BankMaster,

            attributes: ['bankName'],
          },
          {
            model: BankMaster,
            as: 'employeePFBank',
            attributes: ['bankName'],
          },
          {
            model: Contractor,
            attributes: ['contractorName'],
          },
        ],
      },
    ];

    if (req.userDetails && req.userDetails.role) {
      if (
        req.userDetails.role.roleType == roleType.BRANCH_WISE &&
        (!branchMasterID ||
          (Array.isArray(branchMasterID) && !branchMasterID.length))
      )
        branchMasterID = req.userDetails.accessibleBranches;
    }

    includedModels.push(
      // Employee Branch
      {
        model: EmployeeBranch,
        where: {
          status: 1,
          ...(branchMasterID && { branchID: branchMasterID }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: branchMasterID ? true : false,
        attributes: ['branchID', 'applicableDate'],
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
            attributes: ['branchName'],
          },
        ],
      },

      // Employee Designation
      {
        model: EmployeeDesignation,
        where: {
          status: 1,
          ...(designation && { designationID: designation }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: designation ? true : false,
        attributes: ['designationID', 'applicableDate'],
        include: [
          {
            model: Designation,
            as: 'designation',
            attributes: ['designationName'],
          },
        ],
      },
      // Employee Department
      {
        model: EmployeeDepartment,
        where: {
          status: 1,
          ...(department && { departmentID: department }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(date),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(date),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: department ? true : false,
        attributes: ['departmentID', 'applicableDate'],
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['departmentName'],
          },
        ],
      },
      // Division
      {
        model: EmployeeDivision,
        where: {
          status: 1,
          ...(divisionId && { divisionId: divisionId }),
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: divisionId ? true : false,
        attributes: ['divisionId', 'startDate'],
        include: [
          {
            model: Division,
            attributes: ['divisionName'],
          },
        ],
      },

      // Working Area

      {
        model: EmployeeWorkingArea,
        where: {
          status: 1,
          ...(workingAreaId && { workingAreaId: workingAreaId }),
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: workingAreaId ? true : false,
        attributes: ['workingAreaId', 'startDate'],
        include: [
          {
            model: WorkingArea,
            attributes: ['workingAreaName'],
          },
        ],
      },

      // Employee skill category
      {
        required: false,
        model: EmployeeSkillCategory,
        where: {
          applicableYYYYMM: {
            [Sequelize.Op.lte]: +yearmonth,
          },
          [Sequelize.Op.or]: [
            {
              endYYYYMM: {
                [Sequelize.Op.gte]: +yearmonth,
              },
            },
            {
              endYYYYMM: {
                [Sequelize.Op.eq]: null,
              },
            },
          ],
        },
      },

      // Employee project
      {
        required: false,
        model: EmployeeProject,
        where: {
          startDate: {
            [Sequelize.Op.lte]: date,
          },
          [Sequelize.Op.or]: [
            {
              releaseDate: {
                [Sequelize.Op.gte]: date,
              },
            },
            {
              releaseDate: {
                [Sequelize.Op.eq]: null,
              },
            },
          ],
        },
        include: [{ model: Project }],
      },

      // user Address

      {
        model: UserAddress,
        required: false,
        where: {
          status: 1,
          verifyStatus: 1,
        },
        include: [
          {
            model: CityMaster,
            attributes: ['cityName'],
            include: [
              {
                model: StateMaster,
                attributes: ['stateName'],
                include: [
                  { model: CountryMaster, attributes: ['countryName'] },
                ],
              },
            ],
          },
          {
            required: false,
            model: DistrictMaster,
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
      },

      // Employee Shift
      {
        model: EmployeeShift,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['shiftsID', 'shiftID', 'startDate'],
      },
      // Employee Working Location
      {
        model: EmployeeWorkingLocation,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['workingLocationIDs', 'startDate'],
      },

      // Employee Leave Policy
      {
        model: empLeavePolicy,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        attributes: ['employeeLeavePolicyID'],
      },

      // Employee Short Leave Policy
      {
        model: EmployeeShortLeavePolicy,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['shortLeavePolicyID'],
        include: [
          {
            model: ShortLeave,
            attributes: ['shortLeaveName'],
          },
        ],
      },

      // Attendance Policy
      {
        model: EmployeeAttendancePolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['attendancePolicyID'],
        include: [
          {
            model: AttendancePolicy,
            as: 'attendancePolicy',
            attributes: ['attendancePolicyName'],
          },
        ],
      },
      // Salary Policy
      {
        model: EmployeeSalaryPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['salaryPolicyID'],
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy',
            attributes: ['salaryPolicyName'],
          },
        ],
      },
      // Weekoff Policy
      {
        model: EmployeeWeekOff,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: date },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: date } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['weekOffPolicyID'],
        include: [
          {
            model: weekOffPolicy,
            as: 'weekoff',
            attributes: ['weekOffPolicyName'],
          },
        ],
      },
      // Holiday Policy
      {
        model: EmployeeHolidayPolicy,
        where: {
          status: 1,
          applicableDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['holidayPolicyID'],
        include: [
          {
            model: holidayPolicy,
            as: 'HolidayPolicy',
            attributes: ['holidayPolicyName'],
          },
        ],
      },
      // LC-EG Policy
      {
        model: EmployeeLateEarlyPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['lateEarlyPolicyMasterID', 'startDate'],
        include: [
          {
            model: LateEarlyPolicy,
            as: 'lateEarlyPolicy',
            attributes: ['lateEarlyPolicyName'],
          },
        ],
      },
      // Employee Attendance Bonus Policy
      {
        model: EmployeeAttendanceBonusPolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: false,
        separate: true,
        attributes: ['attendanceBonusPolicyId'],
        include: [
          {
            model: AttendanceBonusPolicy,
            attributes: ['attendanceBonusPolicyName'],
          },
        ],
      },

      // Employee Food Allowance Policy
      {
        model: EmployeeFoodAllowancePolicy,
        where: {
          status: 1,
          startDate: { [Sequelize.Op.lte]: new Date(date) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(date) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },

        required: false,
        separate: true,
        attributes: ['foodAllowancePolicyId'],
        include: [
          {
            model: FoodAllowancePolicy,
            attributes: ['foodAllowancePolicyName'],
          },
        ],
      },

      // Experience
      {
        model: UserExperience,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // Education
      {
        model: UserEducation,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // Family
      {
        model: userFamily,
        required: false,
        where: {
          verifyStatus: 1,
          status: 1,
        },
      },

      // user Rights
      {
        required: false,
        model: UserRole,
        attributes: ['roleMasterID'],
        include: [{ model: RoleMaster, attributes: ['roleName'] }],
        limit: 1,
      },
      // reports TO

      {
        required: false,
        model: EmployeeReportTo,
        include: [
          {
            model: UserMaster,
            as: 'reportTo',
            attributes: ['displayName', 'userNumber'],
          },
        ],
      }
    );

    // const userData = await executeQuery(query);
    const userData = await UserMaster.findAll({
      where: condition,
      order,
      include: includedModels,
    });

    const allUserIds = userData.map((e) => e.userMasterID);

    const [
      AllUserSalaryData,
      allShiftData,
      allWorkingLocationData,
      allLeavePolicyData,
    ] = await Promise.all([
      // AllUserSalaryData
      HrSalaryMaster.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: allUserIds,
          },
          [Sequelize.Op.and]: Sequelize.literal(`
          ("hrSalaryMaster"."userMasterID", "hrSalaryMaster"."salaryFromYYYYMM") IN (
            SELECT "userMasterID", MAX("salaryFromYYYYMM") AS "maxMonth"
            FROM "hrSalaryMasters"
            WHERE "salaryFromYYYYMM" <= ${yearmonth}
            AND "userMasterID" IN (${allUserIds.join(',')})
            GROUP BY "userMasterID"
          )
        `),
        },
        include: [
          {
            model: GradeSalaryStructure,
            include: [
              { model: GradeStructure, attributes: [] },
              {
                model: HRSalaryFields,
                where: {
                  payheadMasterId: 50,
                },
                attributes: [],
              },
            ],
            attributes: [],
          },
          { model: StateMaster, required: false, attributes: [] },
          {
            model: Corporation,
            attributes: [],
          },
        ],
        attributes: [
          [
            Sequelize.col('gradeSalaryStructure.hrSalaryField.payheadMasterId'),
            'payheadMasterId',
          ],
          'stateid',
          'EmployeeSalaryAmount',
          'salaryFromYYYYMM',
          'userMasterID',
          'skillCategory',
          'corporationId',
          [Sequelize.col('stateMaster.stateName'), 'stateName'],
          [Sequelize.col('corporation.corporationName'), 'corporationName'],

          [
            Sequelize.col(
              'gradeSalaryStructure.gradeStructure.baseOnCalculation'
            ),
            'baseOnCalculation',
          ],
          [
            Sequelize.col('gradeSalaryStructure.gradeStructure.gradeName'),
            'gradeName',
          ],

          [
            Sequelize.col('gradeSalaryStructure.hrSalaryField.salaryFieldSrNo'),
            'salaryFieldSrNo',
          ],
        ],
      }),
      // allShiftData
      Shift.findAll({
        raw: true,
        where: {
          companyMasterID: companyid,
        },
      }),
      // allWorkingLocationData
      WorkingLocation.findAll({
        raw: true,
        where: {
          companyMasterID: companyid,
        },
      }),
      // allLeavePolicyData
      employeeLeavePolicy.findAll({
        raw: true,
        where: {
          companyMasterId: companyid,
        },
      }),
    ]);
    for (const user of userData) {
      let shiftNames = '',
        workingLocation = '',
        leavePolicyName = '';
      if (user.employeeShifts.length > 0) {
        if (user.employeeShifts[0].shiftID) {
          shiftNames = allShiftData
            .filter((e) => e.shiftID == user.employeeShifts[0].shiftID)
            .map((s) => s.shiftName)
            .join(',');
        }

        if (user.employeeShifts[0].shiftsID) {
          shiftNames = allShiftData
            .filter((e) =>
              [...user.employeeShifts[0].shiftsID].includes(
                e.shiftID.toString()
              )
            )
            .map((s) => s.shiftName)
            .join(',');
        }
      }

      if (user.employeeWorkingLocations.length > 0) {
        workingLocation = allWorkingLocationData
          .filter((e) =>
            [...user.employeeWorkingLocations[0].workingLocationIDs].includes(
              e.workingLocationID
            )
          )
          .map((s) => s.workingLocationName)
          .join(',');
      }

      if (user.empLeavePolicies.length > 0) {
        leavePolicyName = allLeavePolicyData
          .filter((e) =>
            [...user.empLeavePolicies[0].employeeLeavePolicyID].includes(e.id)
          )
          .map((s) => s.leavePolicyName)
          .join(',');
      }

      const userPermanentAddress =
        user.userAddresses && user.userAddresses.length > 0
          ? user.userAddresses.find((e) => e.addressType == 'permanent')
          : null;
      const UserTempAddress =
        user.userAddresses && user.userAddresses.length > 0
          ? user.userAddresses.find((e) => e.addressType == 'temporary')
          : null;

      let user_permanentAddress = '';
      if (userPermanentAddress) {
        user_permanentAddress = ToformatAddress(userPermanentAddress);
      }

      let user_tempAddress = '';
      if (UserTempAddress) {
        user_tempAddress = ToformatAddress(UserTempAddress);
      }

      const employeejoining =
        user.employeeJoiningDetails && user.employeeJoiningDetails.length > 0
          ? user.employeeJoiningDetails[0]
          : null;

      const grossSalaryData = AllUserSalaryData.find(
        (e) => e.userMasterID == user.userMasterID && e.payheadMasterId == 50
      );

      const skillCategory_MinWages = grossSalaryData?.skillCategory || null;
      const corporation = grossSalaryData?.corporationName || null;

      const gross_Salary = grossSalaryData?.EmployeeSalaryAmount || 0;

      const employeeReportsTo =
        user.employeeReportTos && user.employeeReportTos.length > 0
          ? user.employeeReportTos
              .map((e) =>
                e.reportTo
                  ? `${e.reportTo.displayName} - ${e.reportTo.userNumber}`
                  : null
              )
              .join(',')
          : null;

      const projectNames =
        (user.employeeProjects || [])
          .map((e) => e.project?.projectName)
          .join(',') || '';

      const data = {};
      data['Employee_Code'] = employeejoining
        ? employeejoining.employeeCode
        : '';
      data['First_Name'] = user.firstName;
      data['Middle_Name'] = user.middleName;
      data['Last_Name'] = user.lastName;
      data['Mobileno'] = user.userNumber;
      data[`${othernumberLabel}`] = user.otherContactNumber;
      data[`Cug Number`] = user.cugNumber;
      data['Email_Id'] = user.email;
      data['Offical_MailId'] = user.officalEmail;
      data['Gender'] = user.gender;
      data['Marital_Status'] = user.maratialStatus;
      data['BirthDate'] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.dob)
        : '';
      data['BloodGroup'] = employeejoining ? employeejoining.bloodgroup : '';
      data['Nationality'] = employeejoining ? employeejoining.nationality : '';
      data['BiometricSerialNo'] = employeejoining
        ? employeejoining.biometricSerialNo
        : '';
      data['BiometricCode'] = employeejoining
        ? employeejoining.biometricCode
        : '';
      data['Employee Skill Category'] =
        user.employeeSkillCategories?.[0]?.skillCategory
          ?.toString()
          .toUpperCase() || '';

      data['Department'] =
        user.employeeDepartments.length > 0
          ? user.employeeDepartments[0].department.departmentName
          : '';
      data['Department Applicable Date'] =
        user.employeeDepartments.length > 0
          ? DDMMYYYYFormatDate(user.employeeDepartments[0].applicableDate)
          : '';
      data['Designation'] =
        user.employeeDesignations.length > 0
          ? user.employeeDesignations[0].designation.designationName
          : '';
      data['Designation Applicable Date'] =
        user.employeeDesignations.length > 0
          ? DDMMYYYYFormatDate(user.employeeDesignations[0].applicableDate)
          : '';
      data['Branch'] =
        user.employeeBranches.length > 0
          ? user.employeeBranches[0].branchMaster.branchName
          : '';
      data['Branch Applicable Date'] =
        user.employeeBranches.length > 0
          ? DDMMYYYYFormatDate(user.employeeBranches[0].applicableDate)
          : '';
      data['Division'] =
        user.employeeDivisions.length > 0
          ? user.employeeDivisions[0].division.divisionName
          : '';
      data['Division Applicable Date'] =
        user.employeeDivisions.length > 0
          ? DDMMYYYYFormatDate(user.employeeDivisions[0].startDate)
          : '';
      data['Working Area'] =
        user.employeeWorkingAreas.length > 0
          ? user.employeeWorkingAreas[0].workingArea.workingAreaName
          : '';
      data['Working Area Applicable Date'] =
        user.employeeWorkingAreas.length > 0
          ? DDMMYYYYFormatDate(user.employeeWorkingAreas[0].startDate)
          : '';
      data['Local_Address'] = user_tempAddress;
      data['Permanent_Address'] = user_permanentAddress;
      data['JoinDate'] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.joiningDate)
        : '';
      data['LeftDate'] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.leavingDate)
        : '';
      data['Physical_Handicap'] = user.physicalDisability;
      data[`${salaryCalculationAct}`] = employeejoining
        ? employeejoining.salaryCalculationAct
        : '';
      data['Bank'] =
        employeejoining && employeejoining.bankMaster
          ? employeejoining.bankMaster.bankName
          : '';
      data['NameAsBank'] = employeejoining ? employeejoining.nameAsBank : '';
      data['AccountNo'] = employeejoining ? employeejoining.bankAccountNo : '';
      data[`${bankIfscCodeLabel}`] = employeejoining
        ? employeejoining.bankIFSC
        : '';
      if (showPanCard) {
        data['PANNo'] = employeejoining ? employeejoining.pancard : '';
      }

      data[`${aadharCardNumber}`] = employeejoining
        ? employeejoining.adharCard
        : '';
      data[`${nameOnAadhar}`] = employeejoining
        ? employeejoining.adharName
        : '';

      data[`${pfNumber}`] = employeejoining ? employeejoining.pfNumber : '';
      if (showUanNumber) {
        data['UANNo'] = employeejoining ? employeejoining.uanNumber : '';
      }
      data[`${pfJoiningDate}`] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.pfjoiningDate)
        : '';
      data[`${esicNumber}`] = employeejoining ? employeejoining.esicNumber : '';
      data[`${esicJoiningDate}`] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.esicjoiningDate)
        : '';
      if (showpfbankMasterID) {
        data[`${pfBank}`] =
          employeejoining && employeejoining.employeePFBank
            ? employeejoining.employeePFBank.bankName
            : '';
      }
      if (showpfbankIFSC) {
        data[`${pfBankIFSCCode}`] = employeejoining
          ? employeejoining.pfbankIFSC
          : '';
      }
      if (showpfbankAccountNo) {
        data[`${pfBankAccountNumber}`] = employeejoining
          ? employeejoining.pfbankAccountNo
          : '';
      }
      data['Employee_Employment'] = employeejoining
        ? employeejoining.employment
        : '';
      data['Employment Applicable Date'] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.applicableDate)
        : '';
      data['Employment End Date'] = employeejoining
        ? DDMMYYYYFormatDate(employeejoining.endDate)
        : '';
      data['Salary Type'] = employeejoining ? employeejoining.salarytype : '';
      data['Overtime'] = employeejoining
        ? employeejoining.overtime == 1
          ? 'YES'
          : employeejoining.overtime == 0
            ? 'NO'
            : ''
        : '';
      data['Notice Period(in days)'] = employeejoining
        ? employeejoining.noticePeriod
        : '';

      data['SHIFT'] = shiftNames;
      data['Working Location'] = workingLocation;
      data['Contractor'] = employeejoining?.contractor?.contractorName || '';
      data['Project'] = projectNames || '';
      data['Leave Policy'] = leavePolicyName;
      data['Short Leave Policy'] =
        user.employeeShortLeavePolicies?.[0]?.shortLeave?.shortLeaveName || '';
      data['LC-EG Policy'] =
        user.employeeLateEarlyPolicies.length > 0
          ? user.employeeLateEarlyPolicies[0].lateEarlyPolicy
              .lateEarlyPolicyName
          : '';
      data['Attendance Bonus Policy'] =
        user.employeeAttendanceBonusPolicies.length > 0
          ? user.employeeAttendanceBonusPolicies[0].attendanceBonusPolicy
              .attendanceBonusPolicyName
          : '';
      data['Food Allowance Policy'] =
        user.employeeFoodAllowancePolicies.length > 0
          ? user.employeeFoodAllowancePolicies[0].foodAllowancePolicy
              .foodAllowancePolicyName
          : '';
      data['Attendance_Policy'] =
        user.employeeAttendancePolicies.length > 0
          ? user.employeeAttendancePolicies[0].attendancePolicy
              .attendancePolicyName
          : '';
      data['Salary_Policy'] =
        user.employeeSalaryPolicies.length > 0
          ? user.employeeSalaryPolicies[0].salaryPolicy.salaryPolicyName
          : '';
      data['WeekOff_Policy'] =
        user.employeeWeekOffs.length > 0
          ? user.employeeWeekOffs[0].weekoff.weekOffPolicyName
          : '';
      data['Holiday_Policy'] =
        user.employeeHolidayPolicies.length > 0
          ? user.employeeHolidayPolicies[0].HolidayPolicy.holidayPolicyName
          : '';
      data['Employee Reports To'] = employeeReportsTo;
      data['Gross_Salary'] = grossSalaryData ? gross_Salary : '';
      data['Salary_Grade'] = grossSalaryData ? grossSalaryData.gradeName : '';
      data['StateForPT'] = grossSalaryData ? grossSalaryData.stateName : '';
      data['Corporation'] = corporation;
      data['SkillCategory(Minimum Wages)'] = skillCategory_MinWages;
      data['SalaryFromYYYYMM'] = grossSalaryData
        ? grossSalaryData.salaryFromYYYYMM
        : '';
      data['Role'] =
        user.userRoles.length > 0 && user.userRoles[0].roleMaster
          ? user.userRoles[0].roleMaster.roleName
          : '';

      if (user.userExperiences.length > 0) {
        for (let i = 0; i < user.userExperiences.length; i++) {
          const experience = user.userExperiences[i];
          data[`Experience-${i + 1}`] =
            `designation:${experience.designation} , fromDate:${experience.fromDate} , toDate:${experience.toDate} , organization:${experience.organization} , Role&Respo:${experience.roleRespo}`;
        }
      }

      if (user.userEducations.length > 0) {
        for (let i = 0; i < user.userEducations.length; i++) {
          const education = user.userEducations[i];
          data[`Education-${i + 1}`] =
            `qualification:${education.qualification} , yearOfPassing:${education.yearOfPassing} , grade:${education.grade} , percentageObtained:${education.percentageObtained} , institute:${education.institute} , university:${education.university}`;
        }
      }

      if (user.userFamilies.length > 0) {
        for (let i = 0; i < user.userFamilies.length; i++) {
          const family = user.userFamilies[i];
          data[`Family Member-${i + 1}`] =
            `memberName:${family.memberName} , dob:${family.dob} , gender:${family.gender} , relation:${family.relation} , contact:${family.contact}`;
        }
      }

      finaldata.push(data);
    }

    if (exportData) {
      // get All unique keys from array of objects
      const uniqueKeys = new Set();
      finaldata.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          uniqueKeys.add(key);
        });
      });

      // Convert Set to Array for sorting
      let allKeys = Array.from(uniqueKeys);

      // Define the order of key prefixes
      const keyOrder = ['Education', 'Experience', 'Family Member'];

      //  Sort keys based on the defined order
      allKeys.sort((a, b) => {
        const aPrefix = keyOrder.findIndex((prefix) => a.startsWith(prefix));
        const bPrefix = keyOrder.findIndex((prefix) => b.startsWith(prefix));

        // If both keys have defined prefixes, sort by order in keyOrder
        if (aPrefix !== -1 && bPrefix !== -1) {
          return aPrefix - bPrefix;
        }

        // If only one key has a defined prefix, that key comes first
        if (aPrefix !== -1) return -1;
        if (bPrefix !== -1) return 1;

        // If neither key has a defined prefix, sort alphabetically
        return a.localeCompare(b);
      });

      // Ensure all objects have all unique keys in the sorted order
      finaldata.forEach((obj) => {
        allKeys.forEach((key) => {
          if (!obj.hasOwnProperty(key)) {
            obj[key] = null; // Setting missing keys to null
          }
        });

        // Create a new object to preserve key order
        const orderedObj = {};
        allKeys.forEach((key) => {
          orderedObj[key] = obj[key];
        });

        // Replace original object with ordered object
        Object.assign(obj, orderedObj);
      });

      await generateExcel(finaldata, 'EmployeeData', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserbyBranchDepartmentDesgination = async (req, res, next) => {
  try {
    let { companyMasterID, branchMasterID, departmentID, designationID } =
      req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (!companyMasterID) {
      return res
        .status(200)
        .json({ status: 401, message: 'Company is required' });
    }
    const userData = await UserMaster.findAll({
      where: {
        status: 1,
        companyMasterId: companyMasterID,
      },
      attributes: [...userAttributes, 'facePhotoArray', 'userFaces'],
      order: [['displayName', 'ASC']],
      include: [
        {
          // required: true,
          model: EmployeeJoiningDetails,
          attributes: ['employeeCode'],
        },
        {
          required: departmentID && departmentID.length ? true : false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: filterDate },
            ...(departmentID &&
              departmentID.length && { departmentID: departmentID }),
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: filterDate } },
              { endDate: { [Sequelize.Op.is]: null } },
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
          required: branchMasterID && branchMasterID.length ? true : false,
          model: EmployeeBranch,
          where: {
            status: 1,
            ...(branchMasterID &&
              branchMasterID.length && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: filterDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: filterDate } },
              { endDate: { [Sequelize.Op.is]: null } },
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
          required: designationID && designationID.length ? true : false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: filterDate },
            ...(designationID &&
              designationID.length && { designationID: designationID }),
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: filterDate } },
              { endDate: { [Sequelize.Op.is]: null } },
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
      ],
    });

    return res.status(200).json({
      status: 200,
      data: userData,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserDatabyCompanyandDateRange = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, startdate, enddate } = req.query;

    const paginateCondition = {};
    if (page && limit) {
      paginateCondition.offset = (page - 1) * limit;
      paginateCondition.limit = limit;
    }

    const data = await EmployeeJoiningDetails.findAndCountAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: new Date(enddate),
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': {
                  [Sequelize.Op.gte]: new Date(startdate),
                },
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
      ...paginateCondition,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    res.status(200).json({
      status: 200,
      data: data.rows,
      totalcount: data.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserDatabyBranchandDateRange = async (req, res, next) => {
  try {
    const { page, limit, branchMasterID, startdate, enddate } = req.query;

    const get_branch_users = await EmployeeBranch.findAndCountAll({
      raw: true,
      where: {
        branchID: branchMasterID,
        applicableDate: {
          [Sequelize.Op.lte]: new Date(enddate),
        },
        [Sequelize.Op.or]: [
          {
            endDate: {
              [Sequelize.Op.gte]: new Date(startdate),
            },
          },
          {
            endDate: null,
          },
        ],
        status: 1,
      },
    });
    let allActiveUsersID = [];
    for (let userID of get_branch_users.rows) {
      allActiveUsersID.push(userID.userMasterID);
    }
    const paginateCondition = {};
    if (page && limit) {
      paginateCondition.offset = (page - 1) * limit;
      paginateCondition.limit = limit;
    }

    const data = await EmployeeJoiningDetails.findAndCountAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: new Date(enddate),
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: new Date(startdate) },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': {
                  [Sequelize.Op.gte]: new Date(startdate),
                },
              },
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
              },
            ],
          },
        ],
        userMasterID: allActiveUsersID,
        '$userMaster.status$': [0, 1],
      },
      ...paginateCondition,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    data.rows.forEach((row) => {
      const branchData = get_branch_users.rows.find(
        (user) => user.userMasterID === row.userMasterID
      );
      if (branchData) {
        row.branchStartDate = branchData.applicableDate;
        row.branchEndDate = branchData.endDate;
      }
    });

    res.status(200).json({
      status: 200,
      data: data.rows,
      totalcount: data.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCompanyContactName = async (req, res, next) => {
  try {
    const { name, companyMasterID } = req.query;
    const addPercentageAroundSpaces = (name) => {
      return name.split(' ').join('% %');
    };

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
    }

    let users = await UserMaster.findAll({
      where: {
        displayName: {
          [Op.iLike]: '%' + addPercentageAroundSpaces(name) + '%',
        },
        status: 1,
        companyMasterId: companyMasterID,
      },
      attributes: ['userMasterID', 'firstName', 'lastName'],
      raw: true,
      ...accessibleUsers(req.userDetails, false),
    });
    if (users.length === 0) {
      return res.status(200).json({
        status: 200,
        message: 'No users found with the provided name.',
      });
    }

    if (users.length > 1) {
      let options = users
        .map((user) => `${user.firstName} ${user.lastName}`)
        .join(', ');
      return res.status(200).json({
        status: 200,
        message: 'Multiple users found with the provided name.',
        options: options,
      });
    }

    let user = users[0];

    let get_one_data = await UserMaster.findOne({
      where: { userMasterID: user.userMasterID },
      attributes: userAttributes,
      include: [
        { model: companyMaster, attributes: companyAttributes },
        { model: EmployeeJoiningDetails },
      ],

      raw: true,
    });

    const userRights = await UserRole.findOne({
      raw: true,
      where: {
        userMasterID: user.userMasterID,
        roleMasterID: { [Sequelize.Op.ne]: null },
      },
      include: [{ model: RoleMaster }],
    });

    if (userRights) {
      get_one_data.role = userRights['roleMaster.roleName'];
      get_one_data.roleMasterID = userRights.roleMasterID;
    } else {
      get_one_data.role = '';
      get_one_data.roleMasterID = null;
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.ExportAuthorizationDetails = async (req, res, next) => {
  try {
    const { companyMasterID } = req.query;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: 'companyMasterID is required field!',
      });

    const { rows: allUser } = await EmployeeJoiningDetails.findAndCountAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: new Date(),
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: new Date() },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: new Date() },
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
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });

    const allIds = allUser.map((e) => e.userMasterID);

    // const companyData = await companyMaster.findOne({ where: { companyMasterID: companyMasterID }, raw: true, attributes: ['parentCompanyMasterID'] });
    // const allCompanyIDs = [+companyMasterID];
    // if (companyData && companyData.parentCompanyMasterID) allCompanyIDs.push(+companyData.parentCompanyMasterID)

    const allCompanyIDs = [+companyMasterID];
    const get_All_Company = await companyMaster.findAll({
      where: { parentCompanyMasterID: companyMasterID, status: 1 },
    });
    for (var i = 0; i < get_All_Company.length; i++)
      allCompanyIDs.push(+get_All_Company[i].companyMasterID);

    const allUsers = await UserMaster.findAll({
      where: { companyMasterId: allCompanyIDs, status: 1 },
      raw: true,
      attributes: ['userMasterID', 'userNumber'],
    });

    const finalData = [];

    const allAuthDetails = await AuthorizationDetails.findAll({
      where: { userMasterID: allIds, status: 1 },
      raw: true,
      include: [
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteria'],
        },
      ],
    });

    for (const user of allUser) {
      const data = {};

      data['Employee Name'] = user['userMaster.displayName'];
      data['Number'] = user['userMaster.userNumber'];
      data['Employee Code'] = user.employeeCode;

      const [branch, depart, desig] = await Promise.all([
        employeeBranch(user.userMasterID, new Date()),
        employeeDepartment(user.userMasterID, new Date()),
        employeeDesignation(user.userMasterID, new Date()),
      ]);

      data['Branch Name'] = branch ? branch['branchMaster.branchName'] : '';
      data['Department Name'] = depart
        ? depart['department.departmentName']
        : '';
      data['Designation Name'] = desig
        ? desig['designation.designationName']
        : '';

      const findExpense = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.expense &&
          +exp.userMasterID == +user.userMasterID
      );

      data['Authorization Master(Expense)'] = 'Expense';
      data['Authorization Criteria(Expense)'] = findExpense
        ? findExpense['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
      data['Authorized User(Expense)'] = findExpense
        ? findExpense.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      const findLeave = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.leave &&
          +exp.userMasterID == +user.userMasterID
      );
      data['Authorization Master(Leave)'] = 'Leave';
      data['Authorization Criteria(Leave)'] = findLeave
        ? findLeave['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
      data['Authorized User(Leave)'] = findLeave
        ? findLeave.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      const findOvertime = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.overtime &&
          +exp.userMasterID == +user.userMasterID
      );
      data['Authorization Master(Overtime)'] = 'Overtime';
      data['Authorization Criteria(Overtime)'] = findOvertime
        ? findOvertime['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
      data['Authorized User(Overtime)'] = findOvertime
        ? findOvertime.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      const findResignation = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.resignation &&
          +exp.userMasterID == +user.userMasterID
      );
      data['Authorization Master(Resignation)'] = 'Resignation';
      data['Authorization Criteria(Resignation)'] = findResignation
        ? findResignation['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
      data['Authorized User(Resignation)'] = findResignation
        ? findResignation.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      const findGatePass = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.gatepass &&
          +exp.userMasterID == +user.userMasterID
      );
      data['Authorization Master(GatePass)'] = 'Employee Gate Pass';
      data['Authorization Criteria(GatePass)'] = findGatePass
        ? findGatePass['AuthorizationCriteriaMaster.AuthorizationCriteria']
        : '';
      data['Authorized User(GatePass)'] = findGatePass
        ? findGatePass.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      const findcompensatoryOff = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID ==
            authorizationMasterTypes.compensatoryOff &&
          +exp.userMasterID == +user.userMasterID
      );
      data['Authorization Master(Compensatory Off)'] = 'Compensatory Off';
      data['Authorization Criteria(Compensatory Off)'] = findcompensatoryOff
        ? findcompensatoryOff[
            'AuthorizationCriteriaMaster.AuthorizationCriteria'
          ]
        : '';
      data['Authorized User(Compensatory Off)'] = findcompensatoryOff
        ? findcompensatoryOff.AuthorizedByUserMasterId.map((id) =>
            allUsers.find((user) => +user.userMasterID == +id)
          )
            .filter((user) => user !== undefined)
            .map((user) => user.userNumber)
            .join(',')
        : '';

      finalData.push(data);
    }

    if (finalData.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'No data found to export!',
      });

    const AuthCriteria = await AuthorizationCriteriaMaster.findAll({
      raw: true,
      where: { status: 1 },
      attributes: ['AuthorizationCriteria'],
    });

    return await generateAuthorozationExcel(
      finalData,
      AuthCriteria,
      'Authorization Details',
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

function arraysAreIdentical(arr1, arr2) {
  return (
    arr1.length === arr2.length &&
    arr1.every((value, index) => value === arr2[index])
  );
}

async function addAuth(
  AuthorizationMasterID,
  AuthorizedByUserMasterId,
  AuthorizationCriteriaID,
  companyMasterID,
  userMasterID,
  createBy,
  createByIp,
  req
) {
  let FromAmount = Array(AuthorizedByUserMasterId.length).fill(0);
  let ToAmount = Array(AuthorizedByUserMasterId.length).fill(0);
  let RequiredAuthorizationMessage = Array(
    AuthorizedByUserMasterId.length
  ).fill(1);
  let SequenceNo = [];
  if (+AuthorizationCriteriaID === 5)
    SequenceNo = AuthorizedByUserMasterId.map((_, index) => index + 1);
  else SequenceNo = Array(AuthorizedByUserMasterId.length).fill(0);

  try {
    let insert_db_status;

    let allShortLeave = [];
    if (AuthorizationMasterID == authorizationMasterTypes.leave) {
      // Short Leave

      allShortLeave = await UserShortLeave.findAll({
        where: {
          userMasterID: {
            [Op.in]: userMasterID,
          },
          authorizationStatus: 0,
        },
        include: [
          { model: UserMaster, attributes: ['userMasterID', 'displayName'] },
        ],
      });
    }

    for (var i = 0; i < userMasterID.length; i++) {
      await sequelize.transaction(async (t) => {
        let get_all_data = await AuthorizationDetails.findOne({
          where: {
            userMasterID: userMasterID[i],
            AuthorizationMasterID: AuthorizationMasterID,
            status: ['0', '1'],
          },
        });

        if (get_all_data) {
        } else {
          insert_db_status = await AuthorizationDetails.create(
            {
              AuthorizationMasterID,
              AuthorizedByUserMasterId,
              AuthorizationCriteriaID,
              userMasterID: userMasterID[i],
              FromAmount,
              ToAmount,
              SequenceNo,
              RequiredAuthorizationMessage,
              companyMasterID,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          //for leave

          if (AuthorizationMasterID == authorizationMasterTypes.leave) {
            let findLeave = await UserLeave.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationStatus: 0,
                status: 1,
              },
            });

            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            for (var j = 0; j < findLeave.length; j++) {
              let updatedata = await UserLeave.update(
                {
                  authorizationStatus: authorizationStatus,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: findLeave[j].UserLeaveApplicationID,
                  },
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization = await LeaveAuthorizationRequest.findAll(
                  {
                    where: {
                      ReferenceID: findLeave[j].UserLeaveApplicationID,
                      status: 1,
                    },
                  }
                );

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  await destroyLeaveAuthAndApprovedLeaveAuth(
                    +findLeave[j].UserLeaveApplicationID,
                    t
                  );

                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,
                        createByIp: findLeave[j].createByIp,
                      },

                      {
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for leave request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );
                } else {
                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,

                        createByIp: findLeave[j].createByIp,
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for leave request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );
                }

                const notification = {
                  title: 'Leave',
                  body: userinfo.displayName + ' requested for leave.',
                };
                const data = {
                  screen: 'leaveauth',
                };
                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                let findAuthorization = await LeaveAuthorizationRequest.findAll(
                  {
                    where: {
                      ReferenceID: findLeave[j].UserLeaveApplicationID,
                      status: 1,
                    },
                  }
                );

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  await destroyLeaveAuthAndApprovedLeaveAuth(
                    +findLeave[j].UserLeaveApplicationID,
                    t
                  );
                }

                for (
                  var k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,
                        createByIp: findLeave[j].createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );

                  let userinfo = await UserMaster.findOne({
                    where: {
                      // userMasterID:response[i].createBy
                      userMasterID: findLeave[j].userMasterID,
                    },
                  });

                  await UserInbox.create(
                    {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for leave request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );

                  const notification = {
                    title: 'Leave',
                    body: userinfo.displayName + ' requested for leave.',
                  };
                  const data = {
                    screen: 'leaveauth',
                  };
                  await sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }

            // ----------------------------- Short Leave -------------------------

            const userShortLeave = allShortLeave.filter(
              (e) => e.userMasterID == userMasterID[i]
            );
            // If Short Leave is available
            if (userShortLeave.length) {
              const userDetails = userShortLeave[0].userMaster;

              if (!userDetails) throw new Error('User not found!');

              const notification = {
                title: 'Short Leave',
                body: userDetails.displayName + ' requested for a Short Leave.',
              };
              const data = {
                screen: 'shortLeaveAuth',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              const userShortLeaveIds = userShortLeave.map(
                (e) => e.userShortLeaveId
              );

              const authorizationRequest =
                await ShortLeaveAuthorization.findAll({
                  where: {
                    referenceId: userShortLeaveIds,
                  },
                  transaction: t,
                });

              let AuthorizationRequestIds = authorizationRequest.map(
                (form) => form.id
              );

              // Delete All User Inbox

              await UserInbox.destroy({
                where: {
                  activityTable: ShortLeaveAuthorization.getTableName(),
                  activityTablePK: AuthorizationRequestIds,
                },
                transaction: t,
              });

              // Delete All User Short Leave Authorization

              await ShortLeaveAuthorization.destroy({
                where: {
                  id: {
                    [Op.in]: AuthorizationRequestIds,
                  },
                },
                hooks: false,
                transaction: t,
              });

              // update User Short Leave

              await UserShortLeave.update(
                {
                  authorizationStatus,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    userShortLeaveId: {
                      [Op.in]: userShortLeave.map((e) => e.userShortLeaveId),
                    },
                  },
                  hooks: false,
                  transaction: t,
                }
              );

              const inboxData = [];

              for (const shortLeave of userShortLeave) {
                const userShortLeaveId = shortLeave.userShortLeaveId;
                const userMasterID = shortLeave.userMasterID;

                // For Sequence No
                if (authorizationStatus == 2) {
                  const authorizationData =
                    await ShortLeaveAuthorization.create(
                      {
                        referenceId: userShortLeaveId,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        authstatus: 2,
                        createBy,
                        createByIp,
                      },
                      { hooks: false, transaction: t }
                    );

                  // Push Userinbox Data

                  inboxData.push({
                    activityTable: ShortLeaveAuthorization.getTableName(),
                    activityTablePK: authorizationData.toJSON().id,
                    message: `${
                      userDetails.displayName
                    } has requested a Short Leave for ${moment(
                      shortLeave.date
                    ).format('DD/MM/YYYY')}.`,
                    assignedTo: insert_db_status.AuthorizedByUserMasterId[0],
                    assignedBy: userMasterID,
                  });

                  // send Notification
                  sendNotification(
                    authorizationData.userMasterID,
                    notification,
                    data
                  );
                } else {
                  // For Any
                  for (
                    let j = 0;
                    j < insert_db_status.AuthorizedByUserMasterId.length;
                    j++
                  ) {
                    const authorizationData =
                      await ShortLeaveAuthorization.create(
                        {
                          referenceId: userShortLeaveId,
                          userMasterID:
                            insert_db_status.AuthorizedByUserMasterId[j],
                          authstatus: 2,
                          createBy,
                          createByIp,
                        },
                        { hooks: false, transaction: t }
                      );

                    // Push Userinbox Data
                    inboxData.push({
                      activityTable: ShortLeaveAuthorization.getTableName(),
                      activityTablePK: authorizationData.toJSON().id,
                      message: `${
                        userDetails.displayName
                      } has requested a Short Leave for ${moment(
                        shortLeave.date
                      ).format('DD/MM/YYYY')}.`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[j],
                      assignedBy: userMasterID,
                    });

                    // send Notification
                    sendNotification(
                      authorizationData.userMasterID,
                      notification,
                      data
                    );
                  }
                }
              }

              // create userInbox data in bulk

              await UserInbox.bulkCreate(inboxData, { transaction: t });
            }
          }

          //for expense
          else if (AuthorizationMasterID == authorizationMasterTypes.expense) {
            let expensedata = await executeQuery(
              `select ut."userExpenseTransactionID",ut."userExpenseID",ut."authorizationStatus",ue."userMasterID" from "userExpenseTransactions" as ut join "userExpenses" as ue on ut."userExpenseID"=ue."userExpenseID" where ue."userMasterID" =` +
                userMasterID[i] +
                ` and ut."authorizationStatus" IN (0)`
            );

            if (expensedata.length > 0) {
              for (var n = 0; n < expensedata.length; n++) {
                let authdata = await executeQuery(
                  `select * from "expenseAuthorizations" where "ReferenceID"=` +
                    expensedata[n].userExpenseTransactionID +
                    ``
                );

                ExpenseAuthorizationDelete.bulkCreate(authdata, {
                  transaction: t,
                });

                let findAuthorization =
                  await ExpenseAuthorizationRequest.findAll({
                    where: {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                      status: 1,
                    },
                  });

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                let deleteauthdata = await ExpenseAuthorizationRequest.destroy(
                  {
                    where: {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                    },
                  },
                  {
                    transaction: t,
                  }
                );

                const userdata = await UserMaster.findOne({
                  raw: true,
                  where: {
                    userMasterID: expensedata[n].userMasterID,
                  },
                });

                let AuthorizationCriterias =
                  await AuthorizationCriteria.findOne({
                    where: {
                      AuthorizationCriteriaID:
                        insert_db_status.AuthorizationCriteriaID,
                      status: 1,
                    },
                    raw: true,
                  });

                let authorizationStatus;
                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  authorizationStatus = 2;
                } else {
                  authorizationStatus = 1;
                }

                let update_expenseStatus = await UserExpenseTransaction.update(
                  {
                    authorizationStatus: authorizationStatus,
                    updateBy: createBy,
                    AuthorizationCriteriaID,
                  },
                  {
                    where: {
                      userExpenseTransactionID:
                        expensedata[n].userExpenseTransactionID,
                    },
                    transaction: t,
                  }
                );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let insert_db_status1 =
                    await ExpenseAuthorizationRequest.create(
                      {
                        ReferenceID: expensedata[n].userExpenseTransactionID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: userMasterID[i],
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[0],
                      assignedBy: userdata.userMasterID,
                    },

                    { transaction: t }
                  );
                } else {
                  for (
                    var k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 =
                      await ExpenseAuthorizationRequest.create(
                        {
                          ReferenceID: expensedata[n].userExpenseTransactionID,
                          userMasterID:
                            insert_db_status.AuthorizedByUserMasterId[k],
                          status: 1,
                          authstatus: 2,
                          createBy: userMasterID[i],
                        },
                        { transaction: t }
                      );

                    await UserInbox.create(
                      {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK:
                          insert_db_status1.toJSON().AuthorizationRequestId,
                        message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                        assignedTo:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        assignedBy: userdata.userMasterID,
                      },

                      { transaction: t }
                    );
                  }
                }
              }
              // }
            }
          }

          //for overtime
          else if (AuthorizationMasterID == authorizationMasterTypes.overtime) {
            let find_Overtime = await OvertimeCalculation.findAll({
              where: {
                UserMasterID: userMasterID[i],
                AuthorizationRequired: 0,
              },
            });

            if (find_Overtime.length > 0) {
              for (var j = 0; j < find_Overtime.length; j++) {
                let AuthorizationCriterias =
                  await AuthorizationCriteria.findOne({
                    where: {
                      AuthorizationCriteriaID: AuthorizationCriteriaID,
                      status: 1,
                    },
                    // raw: true,
                  });

                let authorizationStatus;

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  authorizationStatus = 2;
                } else {
                  authorizationStatus = 1;
                }

                let update_overtimeAuthorizationStatus =
                  await OvertimeCalculation.update(
                    {
                      AuthorizationRequired: authorizationStatus,
                      updateBy: createBy,
                    },
                    {
                      where: { OverTimeID: find_Overtime[j].OverTimeID },
                      transaction: t,
                    }
                  );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let findAuthorization = await OvertimeAuthorization.findAll({
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await OvertimeAuthorization.destroy(
                      {
                        where: {
                          ReferenceID: find_Overtime[j].OverTimeID,
                          status: 1,
                        },
                      },
                      { transaction: t }
                    );

                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: createBy,
                        createByIp: createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  } else {
                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: createBy,
                        createByIp: createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }
                } else {
                  let findAuthorization = await OvertimeAuthorization.findAll({
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await OvertimeAuthorization.destroy(
                      {
                        where: {
                          ReferenceID: find_Overtime[j].OverTimeID,
                          status: 1,
                        },
                      },
                      { transaction: t }
                    );
                  }

                  for (
                    var k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: createBy,
                        createByIp: createByIp,
                      },
                      { transaction: t }
                    );
                  }
                }
                // }
              }
            }
          }
          // for resignation
          else if (
            AuthorizationMasterID == authorizationMasterTypes.resignation
          ) {
            let find_Resignation = await UserResignation.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationstatus: 0,
              },
            });

            if (find_Resignation.length > 0) {
              let AuthorizationCriterias = await AuthorizationCriteria.findOne({
                where: {
                  AuthorizationCriteriaID:
                    insert_db_status.AuthorizationCriteriaID,
                  status: 1,
                },
                // raw: true,
              });

              let authorizationStatus;

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                authorizationStatus = 2;
              } else {
                authorizationStatus = 1;
              }

              for (var j = 0; j < find_Resignation.length; j++) {
                let update_resignationAuthorizationStatus =
                  await UserResignation.update(
                    {
                      authorizationstatus: authorizationStatus,
                      updateBy: createBy,
                    },
                    {
                      where: {
                        resignationID: find_Resignation[j].resignationID,
                      },
                    }
                  );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let findAuthorization = await ResignationAuth.findAll({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await ResignationAuth.destroy({
                      where: {
                        ReferenceID: find_Resignation[j].resignationID,
                        status: 1,
                      },
                    });

                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authstatus: 2,
                      createBy: createBy,
                      createByIp: createByIp,
                    });
                  } else {
                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authstatus: 2,
                      createBy: createBy,
                      createByIp: createByIp,
                    });
                  }
                } else {
                  let findAuthorization = await ResignationAuth.findAll({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await ResignationAuth.destroy({
                      where: {
                        ReferenceID: find_Resignation[j].resignationID,
                        status: 1,
                      },
                    });
                  }

                  for (
                    var k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[k],
                      status: 1,
                      authstatus: 2,
                      createBy: createBy,
                      createByIp: createByIp,
                    });
                  }
                }
              }

              // }
            }
          }
          // Gate Pass
          else if (
            AuthorizationMasterID == authorizationMasterTypes.employeeGatePass
          ) {
            let findgatepass = await EmployeeGatepass.findAll({
              where: {
                userMasterId: userMasterID[i],
                authorizationStatus: 0,
                status: 'Pending',
              },
            });

            for (var j = 0; j < findgatepass.length; j++) {
              let AuthorizationCriterias = await AuthorizationCriteria.findOne({
                where: {
                  AuthorizationCriteriaID:
                    insert_db_status.AuthorizationCriteriaID,
                  status: 1,
                },
              });

              let authorizationStatus;

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                authorizationStatus = 2;
              } else {
                authorizationStatus = 1;
              }

              let updatedata = await EmployeeGatepass.update(
                {
                  authorizationStatus: authorizationStatus,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    id: findgatepass[j].id,
                  },
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization =
                  await GatePassAuthorizationRequest.findAll({
                    where: {
                      ReferenceID: findgatepass[j].id,
                      status: 1,
                    },
                  });

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  let delete_record =
                    await GatePassAuthorizationRequest.destroy(
                      {
                        where: {
                          ReferenceID: findgatepass[j].id,
                          status: 1,
                        },
                      },
                      {
                        transaction: t,
                      }
                    );

                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,
                        createByIp: findgatepass[j].createByIp,
                      },

                      {
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );
                } else {
                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,
                        createByIp: findgatepass[j].createByIp,
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );
                }

                const notification = {
                  title: 'GatePass',
                  body: userinfo.displayName + ' requested for GatePass.',
                };
                const data = {
                  screen: 'gatepassauth',
                };
                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                let findAuthorization =
                  await GatePassAuthorizationRequest.findAll({
                    where: {
                      ReferenceID: findgatepass[j].id,
                      status: 1,
                    },
                  });

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  let delete_record =
                    await GatePassAuthorizationRequest.destroy(
                      {
                        where: {
                          ReferenceID: findgatepass[j].id,
                          status: 1,
                        },
                      },
                      {
                        transaction: t,
                      }
                    );
                }

                for (
                  var k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,
                        createByIp: findgatepass[j].createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );

                  let userinfo = await UserMaster.findOne({
                    where: {
                      userMasterID: findgatepass[j].userMasterId,
                    },
                  });

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );

                  const notification = {
                    title: 'GatePass',
                    body: userinfo.displayName + ' requested for GatePass.',
                  };
                  const data = {
                    screen: 'gatepassauth',
                  };
                  await sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }
          }

          // Compensatory Off
          else if (
            AuthorizationMasterID == authorizationMasterTypes.compensatoryOff
          ) {
            const findcoff = await coffMaster.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationStatus: 0,
                status: 1,
              },
            });

            const AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
            });

            const authorizationStatus =
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ? 2
                : 1;

            const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

            await coffMaster.update(
              {
                authorizationStatus: authorizationStatus,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  coffMasterID: {
                    [Sequelize.Op.in]: AllCoffMasterIDs,
                  },
                },
                transaction: t,
              }
            );

            const userinfo = await UserMaster.findOne({
              where: {
                userMasterID: insert_db_status.userMasterID,
              },
              transaction: t,
            });

            const findAllAuthorization =
              await CompensatoryOffAuthorization.findAll({
                where: {
                  coffMasterID: {
                    [Sequelize.Op.in]: AllCoffMasterIDs,
                  },
                  status: 1,
                },
              });

            const notification = {
              title: 'Compensatory Off',
              body: userinfo.displayName + ' requested for Compensatory Off.',
            };
            const data = {
              screen: 'coffauth',
            };

            for (let j = 0; j < findcoff.length; j++) {
              const authorizationIds = findAllAuthorization
                .filter((e) => e.coffMasterID == findcoff[j].coffMasterID)
                .map((a) => a.CompensatoryOffAuthorizationID);

              // Delete All UserInbox
              await UserInbox.destroy(
                {
                  where: {
                    activityTable: CompensatoryOffAuthorization.getTableName(),
                    activityTablePK: {
                      [Sequelize.Op.in]: authorizationIds,
                    },
                  },
                },
                { transaction: t }
              );

              // Delete All Auth Data
              if (authorizationIds.length > 0) {
                await CompensatoryOffAuthorization.destroy(
                  {
                    where: {
                      coffMasterID: findcoff[j].coffMasterID,
                      status: 1,
                    },
                  },
                  {
                    Hooks: false,
                    transaction: t,
                  }
                );
              }

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                const insert_db_status1 =
                  await CompensatoryOffAuthorization.create(
                    {
                      TableName: 'coffMaster',
                      coffMasterID: findcoff[j].coffMasterID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authstatus: 2,
                      createBy,
                      createByIp,
                    },
                    { hooks: false, transaction: t }
                  );

                await UserInbox.create(
                  {
                    activityTable: CompensatoryOffAuthorization.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                    message: `${
                      userinfo.displayName
                    } has requested for Compensatory Off for ${moment(
                      findcoff[j].LeaveCreatedDate
                    ).format('DD/MM/YYYY')}`,
                    assignedTo: AuthorizedByUserMasterId[0],
                    assignedBy: findcoff[j].userMasterID,
                  },
                  { transaction: t }
                );

                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                for (
                  let k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await CompensatoryOffAuthorization.create(
                      {
                        TableName: 'coffMaster',
                        coffMasterID: findcoff[j].coffMasterID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy,
                        createByIp,
                      },
                      {
                        hooks: false,
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        CompensatoryOffAuthorization.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON()
                          .CompensatoryOffAuthorizationID,
                      message: `${
                        userinfo.displayName
                      } has requested for Compensatory Off for ${moment(
                        findcoff[j].LeaveCreatedDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findcoff[j].userMasterID,
                    },
                    { transaction: t }
                  );

                  await sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }
          }

          // Attendance Correction
          else if (
            AuthorizationMasterID ==
            authorizationMasterTypes.attendanceCorrection
          ) {
            const findAttendanceCorrection =
              await AttendanceCorrectionRequest.findAll({
                where: {
                  userMasterID: userMasterID[i],
                  authorizationStatus: 0,
                  status: 1,
                },
              });

            const AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
            });

            const authorizationStatus =
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ? 2
                : 1;

            const allAttendanceIDs = findAttendanceCorrection.map(
              (e) => e.attendanceCorrectionRequestId
            );

            await AttendanceCorrectionRequest.update(
              {
                authorizationStatus: authorizationStatus,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  attendanceCorrectionRequestId: {
                    [Sequelize.Op.in]: allAttendanceIDs,
                  },
                },
                transaction: t,
              }
            );

            const userinfo = await UserMaster.findOne({
              where: {
                userMasterID: insert_db_status.userMasterID,
              },
              transaction: t,
            });

            const findAllAuthorization =
              await AttendanceCorrectionAuthorization.findAll({
                where: {
                  attendanceCorrectionRequestId: {
                    [Sequelize.Op.in]: allAttendanceIDs,
                  },
                  status: 1,
                },
              });

            const notification = {
              title: 'Attendance Correction',
              body:
                userinfo.displayName +
                ' requested for an Attendance Correction.',
            };
            const data = {
              screen: 'attendanceCorrectionauth',
            };

            for (let j = 0; j < findAttendanceCorrection.length; j++) {
              const authorizationIds = findAllAuthorization
                .filter(
                  (e) =>
                    e.attendanceCorrectionRequestId ==
                    findAttendanceCorrection[j].attendanceCorrectionRequestId
                )
                .map((a) => a.attendanceCorrectionRequestId);

              // Delete All UserInbox
              await UserInbox.destroy(
                {
                  where: {
                    activityTable:
                      AttendanceCorrectionAuthorization.getTableName(),
                    activityTablePK: {
                      [Sequelize.Op.in]: authorizationIds,
                    },
                  },
                },
                { transaction: t }
              );

              // Delete All Auth Data
              if (authorizationIds.length > 0) {
                await AttendanceCorrectionAuthorization.destroy(
                  {
                    where: {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      status: 1,
                    },
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );
              }

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                const insert_db_status1 =
                  await AttendanceCorrectionAuthorization.create(
                    {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authStatus: 2,
                      createBy,
                      createByIp,
                    },
                    { hooks: false, transaction: t }
                  );

                await UserInbox.create(
                  {
                    activityTable:
                      AttendanceCorrectionAuthorization.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().attendanceCorrectionRequestId,
                    message: `${
                      userinfo.displayName
                    } has requested for Attendace Correction for ${moment(
                      findAttendanceCorrection[j].AttendanceDate
                    ).format('DD/MM/YYYY')}`,
                    assignedTo: AuthorizedByUserMasterId[0],
                    assignedBy: findAttendanceCorrection[j].userMasterID,
                  },
                  { transaction: t }
                );

                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                for (
                  let k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await AttendanceCorrectionAuthorization.create(
                      {
                        attendanceCorrectionRequestId:
                          findAttendanceCorrection[j]
                            .attendanceCorrectionRequestId,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authStatus: 2,
                        createBy,
                        createByIp,
                      },
                      {
                        hooks: false,
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        AttendanceCorrectionAuthorization.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON()
                          .attendanceCorrectionRequestId,
                      message: `${
                        userinfo.displayName
                      } has requested for Attendace Correction for ${moment(
                        findAttendanceCorrection[j].AttendanceDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findAttendanceCorrection[j].userMasterID,
                    },
                    { transaction: t }
                  );

                  await sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }
          }
        }
      });
    }

    return;
  } catch (err) {
    console.error(err);
  }
}

async function updateAuth(
  AuthorizationDetailsId,
  AuthorizationMasterID,
  AuthorizedByUserMasterId,
  AuthorizationCriteriaID,
  companyMasterID,
  updateBy,
  updateByIp,
  userMasterID,
  req
) {
  let FromAmount = Array(AuthorizedByUserMasterId.length).fill(0);
  let ToAmount = Array(AuthorizedByUserMasterId.length).fill(0);
  let RequiredAuthorizationMessage = Array(
    AuthorizedByUserMasterId.length
  ).fill(1);
  let SequenceNo = [];
  if (+AuthorizationCriteriaID === 5)
    SequenceNo = AuthorizedByUserMasterId.map((_, index) => index + 1);
  else SequenceNo = Array(AuthorizedByUserMasterId.length).fill(0);

  try {
    let change_data_status;

    await sequelize.transaction(async (t) => {
      change_data_status = await AuthorizationDetails.update(
        {
          AuthorizationMasterID,
          AuthorizedByUserMasterId,
          AuthorizationCriteriaID,
          FromAmount,
          ToAmount,
          SequenceNo,
          RequiredAuthorizationMessage,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );

      //for leave
      if (AuthorizationMasterID == authorizationMasterTypes.leave) {
        let authorizationdetails1 = await AuthorizationDetails.findOne({
          where: {
            // userMasterID: userMasterID[i],
            AuthorizationDetailsId: AuthorizationDetailsId,
            AuthorizationMasterID: authorizationMasterTypes.leave,
            status: 1,
          },
        });

        // --------------------------- Leave ----------------------------------

        let findLeave = await UserLeave.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        let AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID: AuthorizationCriteriaID,
            status: 1,
          },
          // raw: true,
        });

        let authorizationStatus;

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          authorizationStatus = 2;
        } else {
          authorizationStatus = 1;
        }

        for (var j = 0; j < findLeave.length; j++) {
          let updatedata = await UserLeave.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: updateBy,
              updateByIp: updateByIp,
            },
            {
              where: {
                UserLeaveApplicationID: findLeave[j].UserLeaveApplicationID,
              },
              transaction: t,
            }
          );

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              await destroyLeaveAuthAndApprovedLeaveAuth(
                +findLeave[j].UserLeaveApplicationID,
                t
              );

              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,

                  createByIp: findLeave[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for leave request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,

                  createByIp: findLeave[j].createByIp,
                },
                { transaction: t }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for leave request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );
            }

            let userinfo = await UserMaster.findOne({
              where: {
                // userMasterID:response[i].createBy
                userMasterID: findLeave[j].userMasterID,
              },
            });
            const notification = {
              title: 'Leave',
              body: userinfo.displayName + ' requested for leave.',
            };
            const data = {
              screen: 'leaveauth',
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              await destroyLeaveAuthAndApprovedLeaveAuth(
                +findLeave[j].UserLeaveApplicationID,
                t
              );
            }

            for (var k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,
                  createByIp: findLeave[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for leave request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );

              const notification = {
                title: 'Leave',
                body: userinfo.displayName + ' requested for leave.',
              };
              const data = {
                screen: 'leaveauth',
              };
              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
          // }
        }

        // -----------------------------------------Short Leave ---------------------------------

        const userShortLeave = await UserShortLeave.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: [1, 2],
          },
          include: [
            { model: UserMaster, attributes: ['userMasterID', 'displayName'] },
          ],
        });
        // If Short Leave is available
        if (userShortLeave.length) {
          const userDetails = userShortLeave[0].userMaster;

          if (!userDetails) throw new Error('User not found!');

          const notification = {
            title: 'Short Leave',
            body: userDetails.displayName + ' requested for a Short Leave.',
          };
          const data = {
            screen: 'shortLeaveAuth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };

          const userShortLeaveIds = userShortLeave.map(
            (e) => e.userShortLeaveId
          );

          const authorizationRequest = await ShortLeaveAuthorization.findAll({
            where: {
              referenceId: userShortLeaveIds,
            },
            transaction: t,
          });

          const AuthorizationRequestIds = authorizationRequest.map(
            (form) => form.id
          );

          // Delete All User Inbox

          await UserInbox.destroy({
            where: {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: AuthorizationRequestIds,
            },
            transaction: t,
          });

          // Delete All User Short Leave Authorization

          await ShortLeaveAuthorization.destroy({
            where: {
              id: {
                [Op.in]: AuthorizationRequestIds,
              },
            },
            hooks: false,
            transaction: t,
          });

          // update User Short Leave

          await UserShortLeave.update(
            {
              authorizationStatus,
              updateBy,
              updateByIp,
            },
            {
              where: {
                userShortLeaveId: {
                  [Op.in]: userShortLeave.map((e) => e.userShortLeaveId),
                },
              },
              hooks: false,
              transaction: t,
            }
          );

          const inboxData = [];

          for (const shortLeave of userShortLeave) {
            const userShortLeaveId = shortLeave.userShortLeaveId;
            const userMasterID = shortLeave.userMasterID;

            // For Sequence No
            if (authorizationStatus == 2) {
              const authorizationData = await ShortLeaveAuthorization.create(
                {
                  referenceId: userShortLeaveId,
                  userMasterID: AuthorizedByUserMasterId[0],
                  authstatus: 2,
                  createBy: updateBy,
                  createByIp: updateByIp,
                },
                { hooks: false, transaction: t }
              );

              // Push Userinbox Data

              inboxData.push({
                activityTable: ShortLeaveAuthorization.getTableName(),
                activityTablePK: authorizationData.toJSON().id,
                message: `${
                  userDetails.displayName
                } has requested a Short Leave for ${moment(
                  shortLeave.date
                ).format('DD/MM/YYYY')}.`,
                assignedTo: AuthorizedByUserMasterId[0],
                assignedBy: userMasterID,
              });

              // send Notification
              sendNotification(
                authorizationData.userMasterID,
                notification,
                data
              );
            } else {
              // For Any
              for (let j = 0; j < AuthorizedByUserMasterId.length; j++) {
                const authorizationData = await ShortLeaveAuthorization.create(
                  {
                    referenceId: userShortLeaveId,
                    userMasterID: AuthorizedByUserMasterId[j],
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  },
                  { hooks: false, transaction: t }
                );

                // Push Userinbox Data
                inboxData.push({
                  activityTable: ShortLeaveAuthorization.getTableName(),
                  activityTablePK: authorizationData.toJSON().id,
                  message: `${
                    userDetails.displayName
                  } has requested a Short Leave for ${moment(
                    shortLeave.date
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[j],
                  assignedBy: userMasterID,
                });

                // send Notification
                sendNotification(
                  authorizationData.userMasterID,
                  notification,
                  data
                );
              }
            }
          }

          // create userInbox data in bulk
          await UserInbox.bulkCreate(inboxData, { transaction: t });
        }
      }

      //for expense
      else if (AuthorizationMasterID == authorizationMasterTypes.expense) {
        let expensedata = await executeQuery(
          `select ut."userExpenseTransactionID",ut."expenseAmount",ut."userExpenseID",ut."authorizationStatus",ue."userMasterID" from "userExpenseTransactions" as ut join "userExpenses" as ue on ut."userExpenseID"=ue."userExpenseID" where ue."userMasterID"=` +
            userMasterID +
            ` and ut."authorizationStatus" IN (1,2)`
        );

        if (expensedata.length > 0) {
          for (var n = 0; n < expensedata.length; n++) {
            let authdata = await executeQuery(
              `select * from "expenseAuthorizations" where "ReferenceID"=` +
                expensedata[n].userExpenseTransactionID +
                ``
            );

            let findAuthorization = await ExpenseAuthorizationRequest.findAll({
              where: {
                ReferenceID: expensedata[n].userExpenseTransactionID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            let deleteauthdata = await ExpenseAuthorizationRequest.destroy(
              {
                where: { ReferenceID: expensedata[n].userExpenseTransactionID },
              },
              {
                transaction: t,
              }
            );

            const userdata = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: expensedata[n].userMasterID,
              },
            });

            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID: AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;
            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            let update_expenseStatus = await UserExpenseTransaction.update(
              {
                authorizationStatus: authorizationStatus,
                updateBy,
                AuthorizationCriteriaID,
              },
              {
                where: {
                  userExpenseTransactionID:
                    expensedata[n].userExpenseTransactionID,
                },
                transaction: t,
              }
            );

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              let insert_db_status1 = await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: expensedata[n].userExpenseTransactionID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: userMasterID,
                },
                { transaction: t }
              );

              await UserInbox.create(
                {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: userdata.userMasterID,
                },

                { transaction: t }
              );
            } else {
              for (var i = 0; i < AuthorizedByUserMasterId.length; i++) {
                let insert_db_status1 =
                  await ExpenseAuthorizationRequest.create(
                    {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                      userMasterID: AuthorizedByUserMasterId[i],
                      status: 1,
                      authstatus: 2,
                      createBy: userMasterID,
                    },
                    { transaction: t }
                  );

                await UserInbox.create(
                  {
                    activityTable: UserExpense.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().AuthorizationRequestId,
                    message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                    assignedTo: AuthorizedByUserMasterId[i],
                    assignedBy: userdata.userMasterID,
                  },

                  { transaction: t }
                );
              }
            }
            // }
          }
        }
      }

      //for overtime
      else if (AuthorizationMasterID == authorizationMasterTypes.overtime) {
        let find_Overtime = await OvertimeCalculation.findAll({
          where: {
            UserMasterID: userMasterID,
            AuthorizationRequired: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        if (find_Overtime.length > 0) {
          for (var j = 0; j < find_Overtime.length; j++) {
            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID: AuthorizationCriteriaID,
                status: 1,
              },
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            let update_overtimeAuthorizationStatus =
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: authorizationStatus,
                  updateBy: updateBy,
                },
                {
                  where: { OverTimeID: find_Overtime[j].OverTimeID },
                  transaction: t,
                }
              );

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              let findAuthorization = await OvertimeAuthorization.findAll({
                where: {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await OvertimeAuthorization.destroy(
                  {
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  },
                  { transaction: t }
                );

                let insert_db_status1 = await OvertimeAuthorization.create(
                  {
                    ReferenceID: find_Overtime[j].OverTimeID,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  },
                  { transaction: t }
                );
              } else {
                let insert_db_status1 = await OvertimeAuthorization.create(
                  {
                    ReferenceID: find_Overtime[j].OverTimeID,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  },
                  {
                    transaction: t,
                  }
                );
              }
            } else {
              let findAuthorization = await OvertimeAuthorization.findAll({
                where: {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await OvertimeAuthorization.destroy(
                  {
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  },
                  {
                    transaction: t,
                  }
                );
              }

              for (var k = 0; k < AuthorizedByUserMasterId.length; k++) {
                let insert_db_status1 = await OvertimeAuthorization.create({
                  ReferenceID: find_Overtime[j].OverTimeID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: updateBy,
                  createByIp: updateByIp,
                });
              }
            }
            // }
          }
        }
      }

      // for Resignation
      else if (AuthorizationMasterID == authorizationMasterTypes.resignation) {
        let find_Resignation = await UserResignation.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationstatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        if (find_Resignation.length > 0) {
          let authorizationdetails = await AuthorizationDetails.findOne({
            where: {
              userMasterID: userMasterID,
              AuthorizationMasterID: authorizationMasterTypes.resignation,
              status: 1,
            },
          });

          if (authorizationdetails) {
            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  authorizationdetails.AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            for (var j = 0; j < find_Resignation.length; j++) {
              let update_resignationAuthorizationStatus =
                await UserResignation.update(
                  {
                    authorizationstatus: authorizationStatus,
                    updateBy: updateBy,
                  },
                  {
                    where: { resignationID: find_Resignation[j].resignationID },
                  }
                );

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization = await ResignationAuth.findAll({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });

                if (findAuthorization.length > 0) {
                  let delete_record = await ResignationAuth.destroy({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  });
                } else {
                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  });
                }
              } else {
                let findAuthorization = await ResignationAuth.findAll({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });

                if (findAuthorization.length > 0) {
                  let delete_record = await ResignationAuth.destroy({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });
                }

                for (
                  var k = 0;
                  k < authorizationdetails.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[k],
                    status: 1,
                    authstatus: 2,
                    createBy: updateBy,
                    createByIp: updateByIp,
                  });
                }
              }
            }
          }
        }
      }

      // for gatepass
      else if (
        AuthorizationMasterID == authorizationMasterTypes.employeeGatePass
      ) {
        let authorizationdetails1 = await AuthorizationDetails.findOne({
          where: {
            userMasterID: userMasterID,
            AuthorizationDetailsId: AuthorizationDetailsId,
            AuthorizationMasterID: authorizationMasterTypes.employeeGatePass,
            status: 1,
          },
        });

        let findgatepass = await EmployeeGatepass.findAll({
          where: {
            userMasterId: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 'Pending',
          },
        });

        for (var j = 0; j < findgatepass.length; j++) {
          let AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
              status: 1,
            },
          });

          let authorizationStatus;

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let updatedata = await EmployeeGatepass.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: updateBy,
              updateByIp: updateByIp,
            },
            {
              where: {
                id: findgatepass[j].id,
              },
              transaction: t,
            }
          );

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await GatePassAuthorizationRequest.destroy(
                {
                  where: {
                    ReferenceID: findgatepass[j].id,
                    status: 1,
                  },
                },
                {
                  transaction: t,
                }
              );

              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,

                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findgatepass[j].userMasterId,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,

                  createByIp: findgatepass[j].createByIp,
                },
                { transaction: t }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findgatepass[j].userMasterId,
                },
                { transaction: t }
              );
            }

            let userinfo = await UserMaster.findOne({
              where: {
                userMasterID: findgatepass[j].userMasterId,
              },
            });
            const notification = {
              title: 'GatePass',
              body: userinfo.displayName + ' requested for GatePass.',
            };
            const data = {
              screen: 'gatepassauth',
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await GatePassAuthorizationRequest.destroy(
                {
                  where: {
                    ReferenceID: findgatepass[j].id,
                    status: 1,
                  },
                },
                { transaction: t }
              );
            }

            for (var k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,
                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userinfo.displayName} has applied for Gate Pass request from ${findgatepass[j].date}`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findgatepass[j].userMasterId,
                },
                { transaction: t }
              );

              const notification = {
                title: 'GatePass',
                body: userinfo.displayName + ' requested for GatePass.',
              };
              const data = {
                screen: 'gatepassauth',
              };
              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }

      // for Compensatory Off
      else if (
        AuthorizationMasterID == authorizationMasterTypes.compensatoryOff
      ) {
        let authorizationdetails1 = await AuthorizationDetails.findOne({
          where: {
            userMasterID: userMasterID,
            AuthorizationDetailsId: AuthorizationDetailsId,
            AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
            status: 1,
          },
        });

        let findCoff = await coffMaster.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        for (let j = 0; j < findCoff.length; j++) {
          let AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
              status: 1,
            },
          });

          let authorizationStatus;

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let updatedata = await coffMaster.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: updateBy,
              updateByIp: updateByIp,
            },
            {
              where: {
                coffMasterID: findCoff[j].coffMasterID,
              },
              transaction: t,
            }
          );

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization = await CompensatoryOffAuthorization.findAll({
              where: {
                coffMasterID: findCoff[j].coffMasterID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.CompensatoryOffAuthorizationID
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await CompensatoryOffAuthorization.destroy(
                {
                  where: {
                    coffMasterID: findCoff[j].coffMasterID,
                    status: 1,
                  },
                },
                {
                  transaction: t,
                }
              );

              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findCoff[j].coffMasterID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findCoff[j].createBy,
                  createByIp: findCoff[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findCoff[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                  message: `${userinfo.displayName} has applied for Compensatory Off request from ${findCoff[j].LeaveCreatedDate}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findCoff[j].userMasterID,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findCoff[j].coffMasterID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findCoff[j].createBy,
                  createByIp: findCoff[j].createByIp,
                },
                { transaction: t }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findCoff[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                  message: `${userinfo.displayName} has applied for Compensatory Off request from ${findCoff[j].LeaveCreatedDate}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findCoff[j].userMasterID,
                },
                { transaction: t }
              );
            }

            let userinfo = await UserMaster.findOne({
              where: {
                userMasterID: findCoff[j].userMasterID,
              },
            });
            const notification = {
              title: 'Compensatory Off',
              body: userinfo.displayName + ' requested for Compensatory Off.',
            };
            const data = {
              screen: 'CompensatoryOffAuth',
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            let findAuthorization = await CompensatoryOffAuthorization.findAll({
              where: {
                coffMasterID: findCoff[j].coffMasterID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.CompensatoryOffAuthorizationID
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await CompensatoryOffAuthorization.destroy(
                {
                  where: {
                    coffMasterID: findCoff[j].coffMasterID,
                    status: 1,
                  },
                },
                { transaction: t }
              );
            }

            for (var k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findCoff[j].coffMasterID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findCoff[j].createBy,
                  createByIp: findCoff[j].createByIp,
                },
                {
                  hooks: false,
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findCoff[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                  message: `${userinfo.displayName} has applied for Compensatory Off request from ${findCoff[j].LeaveCreatedDate}`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findCoff[j].userMasterID,
                },
                { transaction: t }
              );

              const notification = {
                title: 'Compensatory Off',
                body: userinfo.displayName + ' requested for Compensatory Off.',
              };
              const data = {
                screen: 'CompensatoryOffAuth',
              };
              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }

      // for Attendance Correction
      else if (
        AuthorizationMasterID == authorizationMasterTypes.attendanceCorrection
      ) {
        let authorizationdetails1 = await AuthorizationDetails.findOne({
          where: {
            AuthorizationDetailsId: AuthorizationDetailsId,
            AuthorizationMasterID:
              authorizationMasterTypes.attendanceCorrection,
            status: 1,
          },
        });

        let findAttendanceCorrection =
          await AttendanceCorrectionRequest.findAll({
            where: {
              userMasterID: authorizationdetails1.userMasterID,
              authorizationStatus: {
                [Sequelize.Op.in]: [1, 2],
              },
              status: 1,
            },
          });

        const allAttendanceIDs = findAttendanceCorrection.map(
          (e) => e.attendanceCorrectionRequestId
        );

        for (var j = 0; j < findAttendanceCorrection.length; j++) {
          let AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
              status: 1,
            },
          });

          let authorizationStatus;

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let updateData = await AttendanceCorrectionRequest.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: updateBy,
              updateByIp: updateByIp,
            },
            {
              where: {
                attendanceCorrectionRequestId:
                  findAttendanceCorrection[j].attendanceCorrectionRequestId,
              },
              hooks: false,
              transaction: t,
            }
          );

          const findAllAuthorization =
            await AttendanceCorrectionAuthorization.findAll({
              where: {
                attendanceCorrectionRequestId: {
                  [Sequelize.Op.in]: allAttendanceIDs,
                },
                status: 1,
              },
            });

          for (let j = 0; j < findAttendanceCorrection.length; j++) {
            const authorizationIds = findAllAuthorization
              .filter(
                (e) =>
                  e.attendanceCorrectionRequestId ==
                  findAttendanceCorrection[j].attendanceCorrectionRequestId
              )
              .map((a) => a.id);

            // Delete All UserInbox
            const deleteNotification = await UserInbox.destroy(
              {
                where: {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: allAttendanceIDs,
                  },
                },
              },
              { transaction: t }
            );
          }

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization =
              await AttendanceCorrectionAuthorization.findAll({
                where: {
                  attendanceCorrectionRequestId:
                    findAttendanceCorrection[j].attendanceCorrectionRequestId,
                  status: 1,
                },
              });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let deleteRecord =
                await AttendanceCorrectionAuthorization.destroy(
                  {
                    where: {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      status: 1,
                    },
                  },
                  {
                    hooks: false,
                    transaction: t,
                  }
                );

              let insert_db_status1 =
                await AttendanceCorrectionAuthorization.create(
                  {
                    attendanceCorrectionRequestId:
                      findAttendanceCorrection[j].attendanceCorrectionRequestId,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authStatus: 2,
                    createBy: findAttendanceCorrection[j].createBy,
                    createByIp: findAttendanceCorrection[j].createByIp,
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findAttendanceCorrection[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().attendanceCorrectionRequestId,
                  message: `${
                    userinfo.displayName
                  } has requested an attendance correction for ${moment(
                    findAttendanceCorrection[j].AttendanceDate
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findAttendanceCorrection[j].userMasterID,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 =
                await AttendanceCorrectionAuthorization.create(
                  {
                    attendanceCorrectionRequestId:
                      findAttendanceCorrection[j].attendanceCorrectionRequestId,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authStatus: 2,
                    createBy: findAttendanceCorrection[j].createBy,
                    createByIp: findAttendanceCorrection[j].createByIp,
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findAttendanceCorrection[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().attendanceCorrectionRequestId,
                  message: `${
                    userinfo.displayName
                  } has requested an attendance correction for ${moment(
                    findAttendanceCorrection[j].AttendanceDate
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findAttendanceCorrection[j].userMasterID,
                },
                { transaction: t }
              );
            }

            let userinfo = await UserMaster.findOne({
              where: {
                userMasterID: findAttendanceCorrection[j].userMasterID,
              },
            });

            const notification = {
              title: 'Attendance Correction',
              body:
                userinfo.displayName +
                ' requested for an attendance correction.',
            };
            const data = {
              screen: 'attendanceCorrectionauth',
              isScheduled: 'true',
              scheduledTime: new Date().toISOString(),
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            let findAuthorization =
              await AttendanceCorrectionAuthorization.findAll({
                where: {
                  attendanceCorrectionRequestId:
                    findAttendanceCorrection[j].attendanceCorrectionRequestId,
                  status: 1,
                },
              });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record =
                await AttendanceCorrectionAuthorization.destroy(
                  {
                    where: {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      status: 1,
                    },
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );
            }

            for (var k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 =
                await AttendanceCorrectionAuthorization.create(
                  {
                    attendanceCorrectionRequestId:
                      findAttendanceCorrection[j].attendanceCorrectionRequestId,
                    userMasterID: AuthorizedByUserMasterId[k],
                    status: 1,
                    authStatus: 2,
                    createBy: findAttendanceCorrection[j].createBy,
                    createByIp: findAttendanceCorrection[j].createByIp,
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findAttendanceCorrection[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().attendanceCorrectionRequestId,
                  message: `${
                    userinfo.displayName
                  } has requested an attendance correction for ${moment(
                    findAttendanceCorrection[j].AttendanceDate
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findAttendanceCorrection[j].userMasterID,
                },
                { transaction: t }
              );

              const notification = {
                title: 'Attendance Correction',
                body:
                  userinfo.displayName +
                  ' requested for an attendance correction.',
              };
              const data = {
                screen: 'attendanceCorrectionauth',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }
    });

    // }
  } catch (err) {
    console.error(err);
  }
}

async function deleteAuth(
  AuthorizationDetailsId,
  AuthMasterID,
  updateBy,
  updateByIp
) {
  try {
    let result = await sequelize.transaction(async (t) => {
      let auth_details = await AuthorizationDetails.findOne({
        where: {
          AuthorizationDetailsId: AuthorizationDetailsId,
          status: [0, 1],
        },
      });

      let userMasterID = auth_details.userMasterID;

      // for Leave---------

      if (AuthMasterID == 1) {
        let userLeaves = await UserLeave.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        let ReferenceID = [];

        for (var i = 0; i < userLeaves.length; i++) {
          ReferenceID.push(userLeaves[i].UserLeaveApplicationID);
        }

        await destroyLeaveAuthAndApprovedLeaveAuth(+ReferenceID, t);
        let update_leave = await UserLeave.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              UserLeaveApplicationID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );

        //  --------------------------Short leave -----------------------

        const shortLeaveData = await UserShortLeave.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationStatus: {
              [Op.in]: [1, 2],
            },
          },
          include: [
            {
              required: false,
              model: ShortLeaveAuthorization,
              attributes: ['id'],
            },
          ],
          transaction: t,
        });

        const userShortLeaveIds = shortLeaveData.map((e) => e.userShortLeaveId);

        const authorizationIds_shortLeave = shortLeaveData
          .flatMap((item) => item.shortLeaveAuthorizations)
          .map((e) => e.id);

        // Delete All UserInbox
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: {
              [Op.in]: authorizationIds_shortLeave,
            },
          },
          transaction: t,
        });

        // Delete Short leave authorization

        await ShortLeaveAuthorization.destroy({
          where: {
            referenceId: {
              [Op.in]: userShortLeaveIds,
            },
          },
          hooks: false,
          transaction: t,
        });

        // update short leave

        await UserShortLeave.update(
          {
            authorizationStatus: 0,
            updateBy,
            updateByIp,
          },
          {
            where: {
              userShortLeaveId: {
                [Op.in]: userShortLeaveIds,
              },
            },
            transaction: t,
          }
        );
      }

      //  for Expense------------
      else if (AuthMasterID == 2) {
        let userExpense = await executeQuery(
          ` 

                  select ut.* from "userExpenses" as ue inner join "userExpenseTransactions" as ut on ue."userExpenseID"= ut."userExpenseID"
                   where ue."userMasterID"=` +
            userMasterID +
            ` and ut."authorizationStatus" in(1,2) and ut.status=1
                   
                   `
        );

        let ReferenceID = [];

        for (var i = 0; i < userExpense.length; i++) {
          ReferenceID.push(userExpense[i].userExpenseTransactionID);
        }

        let delete_auth_data = await ExpenseAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_expenseTrans = await UserExpenseTransaction.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
            AuthorizationCriteriaID: null,
          },
          {
            where: {
              userExpenseTransactionID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for OverTime-----------
      else if (AuthMasterID == 3) {
        let userOvertime = await overTimeCalculation.findAll({
          where: {
            UserMasterID: userMasterID,
            AuthorizationRequired: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        let ReferenceID = [];

        for (var i = 0; i < userOvertime.length; i++) {
          ReferenceID.push(userOvertime[i].OverTimeID);
        }

        let delete_auth_data = await overtimeAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_overtime = await overTimeCalculation.update(
          {
            AuthorizationRequired: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              OverTimeID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      //  for Resignation---------
      else if (AuthMasterID == 5) {
        let userResignation = await UserResignation.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationstatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        let ReferenceID = [];

        for (var i = 0; i < userResignation.length; i++) {
          ReferenceID.push(userResignation[i].resignationID);
        }

        let delete_auth_data = await ResignationAuth.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_resignation = await UserResignation.update(
          {
            authorizationstatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              resignationID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for Employee Gate pass---------
      else if (AuthMasterID == 6) {
        let userGatepass = await EmployeeGatepass.findAll({
          where: {
            userMasterId: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 'Pending',
          },
        });

        let ReferenceID = [];

        for (var i = 0; i < userGatepass.length; i++) {
          ReferenceID.push(userGatepass[i].id);
        }

        let delete_auth_data = await GatePassAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_gatepass = await EmployeeGatepass.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              id: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for Compensatory Off---------
      else if (AuthMasterID == 8) {
        const userCoff = await coffMaster.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        let CompensatoryOffAuthorizationID = [];

        for (let i = 0; i < userCoff.length; i++) {
          CompensatoryOffAuthorizationID.push(userCoff[i].coffMasterID);
        }

        await CompensatoryOffAuthorization.destroy({
          where: {
            CompensatoryOffAuthorizationID: {
              [Sequelize.Op.in]: CompensatoryOffAuthorizationID,
            },
          },
          transaction: t,
        });

        await coffMaster.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              coffMasterID: {
                [Sequelize.Op.in]: CompensatoryOffAuthorizationID,
              },
            },
            transaction: t,
          }
        );
      }

      // for Attendance Correction ---------
      else if (AuthMasterID == 7) {
        const userAttendanceCorrection =
          await AttendanceCorrectionRequest.findAll({
            where: {
              userMasterID: userMasterID,
              authorizationStatus: {
                [Sequelize.Op.in]: [1, 2],
              },
              status: 1,
            },
          });

        let attendanceCorrectionRequestId = [];

        for (let i = 0; i < userAttendanceCorrection.length; i++) {
          attendanceCorrectionRequestId.push(
            userAttendanceCorrection[i].coffMasterID
          );
        }

        await AttendanceCorrectionAuthorization.destroy({
          where: {
            attendanceCorrectionRequestId: {
              [Sequelize.Op.in]: attendanceCorrectionRequestId,
            },
          },
          transaction: t,
        });

        await AttendanceCorrectionRequest.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              attendanceCorrectionRequestId: {
                [Sequelize.Op.in]: attendanceCorrectionRequestId,
              },
            },
            transaction: t,
          }
        );
      }

      let delete_status = await AuthorizationDetails.update(
        {
          status: 2,
          updateBy: updateBy,
          updateByIp: updateByIp,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );
      return;
    });
  } catch (err) {
    console.error(err);
  }
}

exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      status,
      userMasterID,
      companyMasterID,
      departmentID,
      designationID,
      divisionId,
      workingAreaId,
      lateEarlyPolicyMasterID,
      attendancePolicyID,
      weekOffPolicyID,
      holidayPolicyID,
      salaryPolicyID,
      branchStartDate,
      branchEndDate,
      departmentStartDate,
      departmentEndDate,
      designationStartDate,
      designationEndDate,
      employeeStartDate,
      employeeEndDate,
      attendanceStatus,
      isPhotoLock,
      exportData,
      gender,
      repoteeUserMasterID,
      contractorId,
      projectID,
      salarytype,
      skillCategory,
      employmentType,
      employeeType,
    } = await req.body;
    let { branchMasterID } = req.body;
    if (req.userDetails && req.userDetails.role) {
      if (
        req.userDetails.role.roleType == roleType.BRANCH_WISE &&
        (!branchMasterID ||
          (Array.isArray(branchMasterID) && !branchMasterID.length))
      )
        branchMasterID = req.userDetails.accessibleBranches;
    }

    // const filterDate = moment().format('YYYY-MM-DD');
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    //Pagination
    const paginationQuery =
      !exportData && page && limit ? { offset: (page - 1) * limit, limit } : {};
    // if (page && limit) {
    //   paginationQuery.offset = (page - 1) * limit;
    //   paginationQuery.limit = limit;
    // }

    //Order
    const order = [['displayName', 'ASC']];

    //Models Included
    const empJoiningCondition = {
      ...(contractorId &&
        (!Array.isArray(contractorId) || contractorId.length) && {
          contractorId,
        }),
    };

    if (salarytype) empJoiningCondition.salarytype = salarytype;
    if (employmentType) empJoiningCondition.employment = employmentType;
    if (employeeType) empJoiningCondition.employeeType = employeeType;

    const includedModels = [
      {
        required: false,
        model: UserRole,
        attributes: ['roleMasterID'],
        include: [{ model: RoleMaster, attributes: ['roleName'] }],
      },
      { model: companyMaster },
      {
        model: EmployeeJoiningDetails,
        where: empJoiningCondition,
        required:
          Boolean(contractorId) ||
          Boolean(salarytype) ||
          Boolean(employmentType) ||
          Boolean(employeeType),
      },
      {
        model: UserMaster,
        as: 'createdBy',
        attributes: ['displayName'],
        required: false,
      },
      {
        model: UserMaster,
        as: 'updatedBy',
        attributes: ['displayName'],
        required: false,
      },
      {
        model: EmployeeDesignation,
        where: {
          status: 1,
          ...(designationID &&
            (!Array.isArray(designationID) || designationID.length) && {
              designationID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(
              designationStartDate ? designationStartDate : filterDate
            ),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(
                  designationEndDate ? designationEndDate : filterDate
                ),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: designationID ? true : false,
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
          ...(departmentID &&
            (!Array.isArray(departmentID) || departmentID.length) && {
              departmentID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(
              departmentStartDate ? departmentStartDate : filterDate
            ),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(
                  departmentEndDate ? departmentEndDate : filterDate
                ),
              },
            },
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
          ...(branchMasterID &&
            (!Array.isArray(branchMasterID) || branchMasterID.length) && {
              branchID: branchMasterID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(
              branchStartDate ? branchStartDate : filterDate
            ),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(
                  branchEndDate ? branchEndDate : filterDate
                ),
              },
            },
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
    ];

    if (attendanceStatus) {
      includedModels.push({
        model: attendanceTransaction,
        where: {
          AttendanceDate: filterDate,
        },
        required: false,
        attributes: [
          'AttendanceDate',
          'InDatetime',
          'OutDateTime',
          'fulldayhalfday',
        ],
      });
    }
    if (divisionId) {
      includedModels.push({
        model: EmployeeDivision,
        where: {
          status: 1,
          ...(divisionId && { divisionId }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['divisionId'],
        include: [
          {
            model: Division,
            attributes: ['divisionName'],
          },
        ],
      });
    }
    if (workingAreaId) {
      includedModels.push({
        model: EmployeeWorkingArea,
        where: {
          status: 1,
          ...(workingAreaId && { workingAreaId }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['workingAreaId'],
        include: [
          {
            model: WorkingArea,
            attributes: ['workingAreaName'],
          },
        ],
      });
    }
    if (lateEarlyPolicyMasterID) {
      includedModels.push({
        model: EmployeeLateEarlyPolicy,
        where: {
          status: 1,
          ...(lateEarlyPolicyMasterID && { lateEarlyPolicyMasterID }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['lateEarlyPolicyMasterID'],
        include: [
          {
            model: LateEarlyPolicy,
            as: 'lateEarlyPolicy',
            attributes: ['lateEarlyPolicyName'],
          },
        ],
      });
    }
    if (attendancePolicyID) {
      includedModels.push({
        model: EmployeeAttendancePolicy,
        where: {
          status: 1,
          ...(attendancePolicyID && { attendancePolicyID }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['attendancePolicyID'],
        include: [
          {
            model: AttendancePolicy,
            as: 'attendancePolicy',
            attributes: ['attendancePolicyName'],
          },
        ],
      });
    }
    if (weekOffPolicyID) {
      includedModels.push({
        model: EmployeeWeekOff,
        where: {
          status: 1,
          ...(weekOffPolicyID && { weekOffPolicyID }),
          applicableDate: { [Sequelize.Op.lte]: filterDate },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: filterDate } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['weekOffPolicyID'],
        include: [
          {
            model: weekOffPolicy,
            as: 'weekoff',
            attributes: ['weekOffPolicyName'],
          },
        ],
      });
    }
    if (holidayPolicyID) {
      includedModels.push({
        model: EmployeeHolidayPolicy,
        where: {
          status: 1,
          ...(holidayPolicyID && { holidayPolicyID }),
          applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['holidayPolicyID'],
        include: [
          {
            model: holidayPolicy,
            as: 'HolidayPolicy',
            attributes: ['holidayPolicyName'],
          },
        ],
      });
    }
    if (salaryPolicyID) {
      includedModels.push({
        model: EmployeeSalarypolicy,
        where: {
          status: 1,
          ...(salaryPolicyID && { salaryPolicyID }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['salaryPolicyID'],
        include: [
          {
            model: SalaryPolicy,
            as: 'salaryPolicy',
            attributes: ['salaryPolicyName'],
          },
        ],
      });
    }
    if (repoteeUserMasterID) {
      includedModels.push({
        required: true,
        model: EmployeeReportTo,
        where: {
          status: 1,
          reportToID: repoteeUserMasterID,
        },
        attributes: ['employeeReportToID', 'userMasterID', 'reportToID'],
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'employee',
            attributes: [
              'userMasterID',
              'firstName',
              'lastName',
              'displayName',
              'userNumber',
              'photo',
            ],
          },
        ],
      });
    }

    if (projectID) {
      includedModels.push({
        required: projectID ? true : false,
        model: EmployeeProject,
        where: {
          status: 1,
          projectID,
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { releaseDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { releaseDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        include: [
          {
            model: Project,
          },
        ],
      });
    }

    const YYYYMM = filterDate.slice(0, 7).replace('-', '');

    const skillCategoryCondition = {};
    if (skillCategory) {
      skillCategoryCondition.skillCategory = skillCategory;
      (skillCategoryCondition.applicableYYYYMM = {
        [Sequelize.Op.lte]: +YYYYMM,
      }),
        (skillCategoryCondition[Sequelize.Op.or] = [
          { endYYYYMM: { [Sequelize.Op.gte]: +YYYYMM } },
          { endYYYYMM: { [Sequelize.Op.eq]: null } },
        ]);

      includedModels.push({
        model: EmployeeSkillCategory,
        where: skillCategoryCondition,
        required: skillCategory ? true : false,
      });
    }

    //Conditions
    const condition = {};
    if (
      companyMasterID &&
      (!Array.isArray(companyMasterID) || companyMasterID.length)
    )
      condition.companyMasterId = companyMasterID;

    condition.status = status ? status : 1;

    if (userMasterID && (!Array.isArray(userMasterID) || userMasterID.length))
      condition.userMasterID = userMasterID;

    if (employeeStartDate && employeeEndDate) {
      condition['$employeeJoiningDetails.joiningDate$'] = {
        [Sequelize.Op.lte]: new Date(employeeEndDate),
      };
      condition[Sequelize.Op.or] = [
        {
          '$employeeJoiningDetails.leavingDate$': {
            [Sequelize.Op.gte]: new Date(employeeStartDate),
          },
        },
        {
          '$employeeJoiningDetails.leavingDate$': { [Sequelize.Op.eq]: null },
          [Sequelize.Op.or]: [
            {
              deactiveDate: {
                [Sequelize.Op.gte]: new Date(employeeStartDate),
              },
            },
            {
              deactiveDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
      ];
    }

    if (startdate && enddate)
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          displayName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          userNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    if (isPhotoLock) condition.isPhotoLock = isPhotoLock;
    if (gender) {
      condition.gender = gender;
    }
    //Query
    const AllUser = await UserMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: includedModels,
      subQuery: false,
      attributes: [
        [
          Sequelize.literal(`
          "userMaster"."displayName" || 
          CASE 
            WHEN "employeeJoiningDetails"."employeeCode" IS NOT NULL AND "employeeJoiningDetails"."employeeCode" != '' THEN ' ( ' || "employeeJoiningDetails"."employeeCode" || ' )'
            ELSE ''
          END
        `),
          'displayName',
        ],
        [
          Sequelize.literal(`
          "userMaster"."displayName" || 
          CASE 
            WHEN "employeeJoiningDetails"."employeeCode" IS NOT NULL AND "employeeJoiningDetails"."employeeCode" != '' THEN ' ( ' || "employeeJoiningDetails"."employeeCode" || ' )'
            ELSE ''
          END || ' - ' || "userMaster"."userNumber"
        `),
          'displayNameWithNumber',
        ],
        'userMasterID',
        'firstName',
        'middleName',
        'lastName',
        'userNumber',
        'photo',
        'companyMasterId',
        'gender',
        'dob',
        'maratialStatus',
        'physicalDisability',
        'isonBoarding',
        'admin',
        'email',
        'firebaseToken',
        'uniqueID',
        'passwordToken',
        'isPhotoLock',
        'createBy',
        'updateBy',
        'createByIp',
        'updateByIp',
        'facePhoto',
        'facePhotoArray',
        'deactiveDate',
        'resetpassword',
        'deviceType',
        'userFaces',
        'otherContactNumber',
        'status',
        'cugNumber',
        'officalEmail',
      ],
    });

    if (exportData) {
      const finaldata = AllUser.rows.map((e) => {
        return {
          EmployeeCode:
            e.employeeJoiningDetails && e.employeeJoiningDetails.length > 0
              ? e.employeeJoiningDetails[0].employeeCode
              : '',
          Name: e.displayName,
          userNumber: e.userNumber,
          Branch:
            e.employeeBranches && e.employeeBranches.length > 0
              ? e.employeeBranches[0].branchMaster
                ? e.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          Department:
            e.employeeDepartments && e.employeeDepartments.length > 0
              ? e.employeeDepartments[0].department
                ? e.employeeDepartments[0].department.departmentName
                : ''
              : '',
          Designation:
            e.employeeDesignations && e.employeeDesignations.length > 0
              ? e.employeeDesignations[0].designation
                ? e.employeeDesignations[0].designation.designationName
                : ''
              : '',
          Employment:
            e.employeeJoiningDetails && e.employeeJoiningDetails.length > 0
              ? e.employeeJoiningDetails[0].employment
              : ' ',
          InDatetime:
            e.attendanceTransactions &&
            e.attendanceTransactions.length > 0 &&
            e.attendanceTransactions[0].InDatetime
              ? new Date(
                  e.attendanceTransactions[0].InDatetime
                ).toLocaleString()
              : '',
          OutDateTime:
            e.attendanceTransactions &&
            e.attendanceTransactions.length > 0 &&
            e.attendanceTransactions[0].OutDateTime
              ? new Date(
                  e.attendanceTransactions[0].OutDateTime
                ).toLocaleString()
              : '',
          Status:
            e.attendanceTransactions &&
            e.attendanceTransactions.length > 0 &&
            e.attendanceTransactions[0].fulldayhalfday
              ? e.attendanceTransactions[0].fulldayhalfday == 1
                ? 'Present'
                : e.attendanceTransactions[0].fulldayhalfday == 0.5
                  ? 'Half Day'
                  : ''
              : '',
        };
      });

      return await generateExcel(finaldata, 'EmployeeList', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: AllUser.rows,
      totalcount: AllUser.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatePhotoLockStatus = async (req, res, next) => {
  try {
    const { userMasterID, isPhotoLock } = req.body;

    await UserMaster.update(
      { isPhotoLock: isPhotoLock },
      {
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        isPhotoLock == '1'
          ? 'Photo locked Successfully!'
          : 'Photo Unlocked Successfully!',
    });
  } catch (err) {
    next(err);
  }
};

exports.getalldiler = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let company_contact;
    let totalcount;
    if (searchQuery) {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: {
          status: ['0', '1'],
          admin: 4,
          [Sequelize.Op.or]: [
            {
              displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
          ],
        },
        limit: limit,
        offset: offset,
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: {
          status: ['0', '1'],
          admin: 4,
          [Sequelize.Op.or]: [
            {
              displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
          ],
        },
      });
    } else if (page == '' && limit == '') {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: { status: 1, admin: 4 },
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: { status: ['0', '1'], admin: 4 },
      });
    } else {
      company_contact = await UserMaster.findAll({
        raw: true,
        where: { status: ['0', '1'], admin: 4 },
        limit: limit,
        offset: offset,
      });

      totalcount = await UserMaster.count({
        raw: true,
        where: { status: ['0', '1'], admin: 4 },
      });
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.companycontactget,
      data: company_contact,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.getProfilePercentage = async (req, res, next) => {
  try {
    const { limit, page, users, companyMasterID, exportData, userMasterID } =
      req.body;

    const condition = { status: [0, 1] };

    if (users && users.length > 0) {
      condition.userMasterID = users;
    }
    const companyCondition = {};
    if (companyMasterID) {
      companyCondition.companyMasterID = companyMasterID;
    }
    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    let date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let month = date.slice(0, 4).concat(date.slice(5, 7));

    const { rows: user, count } = await UserMaster.findAndCountAll({
      distinct: true,
      where: condition,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
          where: companyCondition,
        },
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
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID', 'applicableDate'],
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
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          required: false,
          model: EmployeeJoiningDetails,
          as: 'employeeJoiningDetails',
          attributes: ['employeeCode'],
        },
        {
          required: false,
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
        },
        {
          required: false,
          model: EmployeeWorkingArea,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
        },

        {
          required: false,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['employeeSalaryPolicyID'],
          limit: 1,
        },
        {
          required: false,
          model: HRSalaryMaster,
          where: {
            salaryFromYYYYMM: {
              [Sequelize.Op.lte]: month,
            },
          },
          limit: 1,
        },
        {
          required: false,
          model: UserAddress,
          where: {
            status: 1,
          },

          attributes: ['addressType'],
          limit: 1,
        },
        {
          required: false,
          model: UserExperience,
          where: {
            status: 1,
            verifyStatus: 1,
          },
          attributes: ['designation'],
          limit: 1,
        },
        {
          required: false,
          model: UserEducation,
          where: {
            status: 1,
            verifyStatus: 1,
          },
          attributes: ['qualification'],
          limit: 1,
        },
        {
          required: false,
          model: UserDocument,
          where: {
            status: 1,
            verifyStatus: 1,
          },
          limit: 1,
        },
        {
          required: false,
          model: UserFamily,
          where: {
            status: 1,
            verifyStatus: 1,
          },
          attributes: ['memberName'],
          limit: 1,
        },
        {
          required: false,
          model: UserSkills,
          where: {
            status: 1,
          },
          attributes: ['type'],
          limit: 1,
        },
        {
          required: false,
          model: UserReportTO,
          where: {
            status: 1,
          },
          attributes: ['employeeReportToID'],
        },
        {
          required: false,
          model: CompanyDocument,
          where: {
            status: 1,
          },
          limit: 1,
        },
        {
          required: false,
          model: EmployeeShift,
          where: {
            status: 1,
          },
          attributes: ['employeeShiftID'],
        },
        {
          required: false,
          model: EmployeeAttendance,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['employeeAttendancePolicyID'],
        },
        {
          required: false,
          model: EmployeeHolidayPolicyModel,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['employeeholidayPolicyID'],
        },
        {
          required: false,
          model: EmployeeWeekOff,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: date,
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: date,
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['employeeWeekOffID'],
        },
        {
          required: false,
          model: CompanyDocument,
          where: {
            status: 1,
          },
          attributes: ['companyDocumentID'],
        },
        {
          required: false,
          model: EmployeeDigitalSignature,
          where: {
            status: 1,
          },
          attributes: ['employeeDigitalSignatureID'],
        },
        {
          required: false,
          model: HrLeaveBalance,
          limit: 1,
        },
        {
          required: false,
          model: AuthorizationDetails,
          where: {
            status: ['0', '1'],
          },
          attributes: ['AuthorizationDetailsId'],
          limit: 1,
        },
        {
          model: empLeavePolicy,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['employeeLeavePolicyID'],
        },
        {
          required: false,
          model: EmployeeLateEarlyPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(date),
                },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          attributes: ['employeeLateEarlyPolicyID'],
        },
      ],
      ...paginationQuery,
    });

    const subscribeCompanyMasterId =
      +req.userDetails.parentCompanyMasterId == 0
        ? +req.userDetails.companyMasterId
        : +req.userDetails.parentCompanyMasterId;

    const getSubscriptionPlanData = await CompanySubscriptionMaster.findOne({
      where: {
        companyMasterID: subscribeCompanyMasterId,
        status: 1,
      },
      raw: true,
      attributes: [
        'companyPlanMasterID',
        'companyMasterID',
        'productMasterID',
        'totalUser',
        'totalTracking',
        'startDate',
        'endDate',
      ],
    });

    const fieldsToCheck = [
      { field: 'employeeJoiningDetails', tabName: 'EMPLOYEE JOINING DETAILS' },
      { field: 'employeeDesignations', tabName: 'DESIGNATION' },
      { field: 'employeeDepartments', tabName: 'DEPARTMENT' },
      { field: 'employeeBranches', tabName: 'BRANCH' },
      { field: 'employeeDivisions', tabName: 'DIVISION' },
      { field: 'employeeWorkingAreas', tabName: 'WORKING AREA' },
      { field: 'userAddresses', tabName: 'ADDRESS' },
      { field: 'userExperiences', tabName: 'EXPERIENCE' },
      { field: 'userEducations', tabName: 'EDUCATION' },
      { field: 'userDocuments', tabName: 'DOCUMENT' },
      { field: 'userFamilies', tabName: 'FAMILY' },
      { field: 'userSkills', tabName: 'SKILLS' },
      { field: 'employeeReportTos', tabName: 'REPORT TO' },
      { field: 'companyDocuments', tabName: 'COMPANY DOCUMENT' },
      { field: 'employeeShifts', tabName: 'SHIFT' },
      { field: 'employeeAttendancePolicies', tabName: 'ATTENDANCE POLICY' },
      { field: 'employeeHolidayPolicies', tabName: 'HOLIDAY POLICY' },
      { field: 'employeeWeekOffs', tabName: 'WEEKOFF POLICY' },
      { field: 'employeeDigitalSignatures', tabName: 'DIGITAL SIGNATURE' },
      { field: 'hrLeaveBalances', tabName: 'LEAVE OPENING BALANCE' },
      { field: 'employeeLateEarlyPolicies', tabName: 'LATEINEARLYGOPOLICY' },
      { field: 'empLeavePolicies', tabName: 'LEAVE POLICY' },
      { field: 'authorizationDetails', tabName: 'AUTHORIZATION' },
    ];

    if (getSubscriptionPlanData.productMasterID != 9) {
      fieldsToCheck.push({
        field: 'employeeSalaryPolicies',
        tabName: 'SALARY POLICY',
      });
      fieldsToCheck.push({
        field: 'hrSalaryMasters',
        tabName: 'SALARY STRUCTURE',
      });
    }

    const finaldata = [];

    for (let i = 0; i < user.length; i++) {
      let trueCount = 0;
      let falseCount = 0;
      const tabData = [];

      fieldsToCheck.forEach(({ field, tabName }) => {
        if (user[i][field] && user[i][field].length > 0) {
          trueCount += 1;
          tabData.push({
            display: true,
            tabName: tabName,
          });
        } else {
          falseCount += 1;
          tabData.push({
            display: false,
            tabName: tabName,
          });
        }
      });

      let totalCount = trueCount + falseCount;
      let totalPercentage = (trueCount / totalCount) * 100;

      let profilePercentage = Math.floor(totalPercentage);

      finaldata.push({
        'Employee Name': user[i].displayName,
        'Employee Number': user[i].userNumber,
        userMasterID: user[i].userMasterID,
        trueCount: trueCount,
        falseCount: falseCount,
        pendingTabs: tabData,
        profilePercentage,
        'Employee Code':
          user[i].employeeJoiningDetails.length > 0
            ? user[i].employeeJoiningDetails[0].employeeCode
            : '',
        'Company Name': user[i].companyMaster.companyName,
        'Branch Name':
          user[i].employeeBranches.length > 0
            ? user[i].employeeBranches[0].branchMaster.branchName
            : '',
        'Department Name':
          user[i].employeeDepartments.length > 0
            ? user[i].employeeDepartments[0].department.departmentName
            : '',
        'Designation Name':
          user[i].employeeDesignations.length > 0
            ? user[i].employeeDesignations[0].designation.designationName
            : '',
      });
    }

    if (exportData) {
      const data = finaldata.map((row) => ({
        'Employee Code': row['Employee Code'],
        'Employee Name': row['Employee Name'],
        'Employee Number': row['Employee Number'],
        Company: row['Company Name'],
        Branch: row['Branch Name'],
        Department: row['Department Name'],
        Designation: row['Designation Name'],
        'Profile Percentage': row.profilePercentage,
      }));
      await generateExcel(data, 'Profile Percentage', 'xlsx', res);
      return;
    }
    return res.status(200).json({
      status: 200,
      message: 'Profile Percentage fetched Successfully',
      data: finaldata,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.removeProfilePhoto = async (req, res, next) => {
  try {
    const { userMasterID } = await req.body;

    const GetUserData = await UserMaster.findOne({
      where: { userMasterID: userMasterID },
      attributes: ['photo'],
    });

    const logoPath = path.join('uploads/user/photo/', GetUserData.photo);
    if (fs.existsSync(logoPath)) {
      fs.unlinkSync(logoPath);
    }
    await UserMaster.update(
      {
        photo: '',
      },
      {
        where: { userMasterID: userMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Profile Photo'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeSatus = async (req, res, next) => {
  try {
    const { companyMasterId, status, page, limit, searchQuery, exportData } =
      await req.body;
    const condition = {};

    condition.status = status ? status : [0, 1];
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let employeeConditions = null;
    if (status == 2) {
      // If status is 'left'
      employeeConditions = {
        [Sequelize.Op.and]: [
          {
            leavingDate: {
              [Sequelize.Op.ne]: null,
            },
          },
          {
            leavingDate: {
              [Sequelize.Op.ne]: '',
            },
          },
        ],
      };
      condition.status = [1];
    } else if (status === 0 || status === 1) {
      // If status is 'active' or 'deactivated'
      condition.status = status;
    }
    if (companyMasterId) condition.companyMasterId = companyMasterId;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          displayName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery =
      !exportData && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows, count } = await UserMaster.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginationQuery,
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
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ['departmentID', 'applicableDate'],
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
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          required: employeeConditions ? true : false,
          model: EmployeeJoiningDetails,
          where: employeeConditions,
          as: 'employeeJoiningDetails',
          attributes: ['employeeCode', 'leavingDate'],
        },
        {
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date() },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date() } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          separate: true,
          attributes: ['divisionId', 'startDate'],
          include: [
            {
              model: Division,
              attributes: ['divisionName'],
            },
          ],
        },
        {
          model: EmployeeWorkingArea,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date() },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date() } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          required: false,
          separate: true,
          attributes: ['workingAreaId', 'startDate'],
          include: [
            {
              model: WorkingArea,
              attributes: ['workingAreaName'],
            },
          ],
        },
      ],
      order: [['displayName', 'ASC']],
    });

    if (exportData) {
      const finaldata = rows.map((e) => {
        return {
          EmployeeCode:
            e.employeeJoiningDetails && e.employeeJoiningDetails.length > 0
              ? e.employeeJoiningDetails[0].employeeCode
              : '',
          Name: e.displayName,
          Number: e.userNumber,
          Branch:
            e.employeeBranches && e.employeeBranches.length > 0
              ? e.employeeBranches[0].branchMaster
                ? e.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          Department:
            e.employeeDepartments && e.employeeDepartments.length > 0
              ? e.employeeDepartments[0].department
                ? e.employeeDepartments[0].department.departmentName
                : ''
              : '',
          Designation:
            e.employeeDesignations && e.employeeDesignations.length > 0
              ? e.employeeDesignations[0].designation
                ? e.employeeDesignations[0].designation.designationName
                : ''
              : '',
          Division:
            e.employeeDivisions && e.employeeDivisions.length > 0
              ? e.employeeDivisions[0].division
                ? e.employeeDivisions[0].division.divisionName
                : ''
              : '',
          WorkingAreas:
            e.employeeWorkingAreas && e.employeeWorkingAreas.length > 0
              ? e.employeeWorkingAreas[0].workingArea
                ? e.employeeWorkingAreas[0].workingArea.workingAreaName
                : ''
              : '',
          // LeavingDate:
          // e.employeeJoiningDetails && e.employeeJoiningDetails.length > 0
          // ? e.employeeJoiningDetails[0].leavingDate
          // : '',

          LeavingDate:
            e.employeeJoiningDetails && e.employeeJoiningDetails.length > 0
              ? new Date(
                  e.employeeJoiningDetails[0].leavingDate
                ).toLocaleDateString('en-GB')
              : 'DD-MM-YYYY',
        };
      });

      return await generateExcel(finaldata, 'EmployeeList', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      message: 'Data fetched Successfully',
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.ExportAuthorizationDetailsNEW = async (req, res, next) => {
  try {
    const { companyMasterID, authorizationMasterID, branchMasterID } =
      req.query;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: 'companyMasterID is required field!',
      });

    const [allUserJoiningDetails, currCompany] = await Promise.all([
      // allUserJoiningDetails
      EmployeeJoiningDetails.findAll({
        raw: true,
        where: {
          joiningDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              leavingDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              leavingDate: { [Sequelize.Op.eq]: null },
              [Sequelize.Op.or]: [
                {
                  '$userMaster.deactiveDate$': {
                    [Sequelize.Op.gte]: new Date(),
                  },
                },
                {
                  '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                },
              ],
            },
          ],
          '$userMaster.companyMasterId$': companyMasterID,
          '$userMaster.status$': 1,
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
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
            ],
          },
        ],
        order: [[{ model: UserMaster }, 'displayName', 'ASC']],
      }),

      companyMasters.findOne({
        where: { companyMasterID: companyMasterID, status: 1 },
        attributes: [
          'companyMasterID',
          'parentCompanyMasterID',
          'fileUploadType',
        ],
        raw: true,
      }),
    ]);
    const allCompanyIDs = [];
    let getAllParentChidCompany = [];
    if (+currCompany.parentCompanyMasterID) {
      getAllParentChidCompany = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +currCompany.parentCompanyMasterID },
            { parentCompanyMasterID: +currCompany.parentCompanyMasterID },
          ],
          status: 1,
        },
        order: [['companyMasterID', 'ASC']],
      });
    } else {
      getAllParentChidCompany = await companyMasters.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +companyMasterID },
            { parentCompanyMasterID: +companyMasterID },
          ],
          status: 1,
        },
        order: [['companyMasterID', 'ASC']],
      });
    }
    const allUserJoiningDetailsUSERIDS = allUserJoiningDetails.map(
      (e) => e.userMasterID
    );
    let fileUploadType = 'mobileNumber';
    if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = 'employeeCode';

    const allParentChidCompanyIDs = getAllParentChidCompany.map(
      (e) => e.companyMasterID
    );

    const [allUsers, allAuthDetails, AuthorizationCriteriaMasterData] =
      await Promise.all([
        // allUsers
        UserMaster.findAll({
          where: { companyMasterId: allParentChidCompanyIDs, status: 1 },
          attributes: [
            'userMasterID',
            'userNumber',
            'displayName',
            'companyMasterId',
          ],
          include: [
            {
              required: fileUploadType == 'mobileNumber' ? false : true,
              model: EmployeeJoiningDetails,
              attributes: ['employeeJoiningDetailId', 'employeeCode'],
            },
            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: {
                      [Sequelize.Op.gte]: new Date(filterDate),
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
              model: companyMaster,
              required: true,
              attributes: ['companyMasterID', 'companyName'],
            },
            // {
            //   required: false,
            //   model: UserLeave,
            // },
          ],
          order: [['displayName', 'ASC']],
        }),

        // allAuthDetails
        AuthorizationDetails.findAll({
          where: { userMasterID: allUserJoiningDetailsUSERIDS, status: 1 },
          raw: true,
          include: [
            {
              model: AuthorizationCriteriaMaster,
              attributes: ['AuthorizationCriteria'],
            },
          ],
        }),

        // AuthorizationCriteriaMaster
        AuthorizationCriteriaMaster.findAll({
          raw: true,
          where: { status: 1 },
          attributes: ['AuthorizationCriteria'],
        }),
      ]);

    const finalData = [];
    for (const user of allUserJoiningDetails) {
      const data = {};

      data['Employee Name'] = user['userMaster.displayName'];
      data['Number'] = user['userMaster.userNumber'];
      data['Employee Code'] = user.employeeCode;

      data['Branch Name'] = user[
        'userMaster.employeeBranches.branchMaster.branchName'
      ]
        ? user['userMaster.employeeBranches.branchMaster.branchName']
        : '';
      data['Department Name'] = user[
        'userMaster.employeeDepartments.department.departmentName'
      ]
        ? user['userMaster.employeeDepartments.department.departmentName']
        : '';
      data['Designation Name'] = user[
        'userMaster.employeeDesignations.designation.designationName'
      ]
        ? user['userMaster.employeeDesignations.designation.designationName']
        : '';

      //Expense
      const findExpense = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.expense &&
          +exp.userMasterID == +user.userMasterID
      );

      //Leave
      const findLeave = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.leave &&
          +exp.userMasterID == +user.userMasterID
      );

      //OverTime
      const findOvertime = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.overtime &&
          +exp.userMasterID == +user.userMasterID
      );

      //Resignation
      const findResignation = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID == authorizationMasterTypes.resignation &&
          +exp.userMasterID == +user.userMasterID
      );

      //Gate Pass
      const findGatePass = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID ==
            authorizationMasterTypes.employeeGatePass &&
          +exp.userMasterID == +user.userMasterID
      );

      // Compensatory Off
      const findcompensatoryOff = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID ==
            authorizationMasterTypes.compensatoryOff &&
          +exp.userMasterID == +user.userMasterID
      );

      // Attendance Correction
      const findAttendanceCorrection = allAuthDetails.find(
        (exp) =>
          +exp.AuthorizationMasterID ==
            authorizationMasterTypes.attendanceCorrection &&
          +exp.userMasterID == +user.userMasterID
      );

      if (authorizationMasterID == 0) {
        //Expense
        data['Authorization Master(Expense)'] = 'Expense';
        data['Authorization Criteria(Expense)'] = findExpense
          ? findExpense['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Expense)'] = '';

        if (findExpense) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findExpense.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Expense)'] = name;
        }

        //Leave
        data['Authorization Master(Leave)'] = 'Leave';
        data['Authorization Criteria(Leave)'] = findLeave
          ? findLeave['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Leave)'] = '';

        if (findLeave) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findLeave.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Leave)'] = name;
        }

        //OverTime
        data['Authorization Master(Overtime)'] = 'Overtime';
        data['Authorization Criteria(Overtime)'] = findOvertime
          ? findOvertime['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Overtime)'] = '';

        if (findOvertime) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findOvertime.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Overtime)'] = name;
        }

        //Resignation
        data['Authorization Master(Resignation)'] = 'Resignation';
        data['Authorization Criteria(Resignation)'] = findResignation
          ? findResignation['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Resignation)'] = '';

        if (findResignation) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findResignation.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Resignation)'] = name;
        }

        //Gate Pass
        data['Authorization Master(GatePass)'] = 'Employee Gate Pass';
        data['Authorization Criteria(GatePass)'] = findGatePass
          ? findGatePass['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(GatePass)'] = '';

        if (findGatePass) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findGatePass.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(GatePass)'] = name;
        }

        //Compensatory Off
        data['Authorization Master(Compensatory Off)'] = 'Compensatory Off';
        data['Authorization Criteria(Compensatory Off)'] = findcompensatoryOff
          ? findcompensatoryOff[
              'AuthorizationCriteriaMaster.AuthorizationCriteria'
            ]
          : '';
        data['Authorized User(Compensatory Off)'] = '';

        if (findcompensatoryOff) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findcompensatoryOff.AuthorizedByUserMasterId.map(
            (item) => {
              const findUser = userMap.get(item);
              if (!findUser) return 'Not Found';

              return fileUploadType === 'employeeCode'
                ? findUser.employeeJoiningDetails.length &&
                  findUser.employeeJoiningDetails[0].employeeCode
                  ? findUser.employeeJoiningDetails[0].employeeCode
                  : findUser.displayName
                : findUser.userNumber;
            }
          ).join(',');

          // Assign the result to the data object
          data['Authorized User(Compensatory Off)'] = name;
        }

        // Attendance Correction
        data['Authorization Master(Attendance Correction)'] =
          'Attendance Correction';
        data['Authorization Criteria(Attendance Correction)'] =
          findAttendanceCorrection
            ? findAttendanceCorrection[
                'AuthorizationCriteriaMaster.AuthorizationCriteria'
              ]
            : '';
        data['Authorized User(Attendance Correction)'] = '';

        if (findAttendanceCorrection) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findAttendanceCorrection.AuthorizedByUserMasterId.map(
            (item) => {
              const findUser = userMap.get(item);
              if (!findUser) return 'Not Found';

              return fileUploadType === 'employeeCode'
                ? findUser.employeeJoiningDetails.length &&
                  findUser.employeeJoiningDetails[0].employeeCode
                  ? findUser.employeeJoiningDetails[0].employeeCode
                  : findUser.displayName
                : findUser.userNumber;
            }
          ).join(',');

          // Assign the result to the data object
          data['Authorized User(Attendance Correction)'] = name;
        }
      } else if (authorizationMasterID == 2) {
        //Expense
        data['Authorization Master(Expense)'] = 'Expense';
        data['Authorization Criteria(Expense)'] = findExpense
          ? findExpense['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Expense)'] = findExpense
          ? findExpense.AuthorizedByUserMasterId.map((id) =>
              allUsers.find((user) => +user.userMasterID == +id)
            )
              .filter((user) => user !== undefined)
              .map((user) => user.userNumber)
              .join(',')
          : '';

        data['Authorized User(Expense)'] = '';

        if (findExpense) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findExpense.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Expense)'] = name;
        }
      } else if (authorizationMasterID == 1) {
        // Leave
        data['Authorization Master(Leave)'] = 'Leave';
        data['Authorization Criteria(Leave)'] = findLeave
          ? findLeave['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Leave)'] = findLeave
          ? findLeave.AuthorizedByUserMasterId.map((id) =>
              allUsers.find((user) => +user.userMasterID == +id)
            )
              .filter((user) => user !== undefined)
              .map((user) => user.userNumber)
              .join(',')
          : '';

        data['Authorized User(Leave)'] = '';

        if (findLeave) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findLeave.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Leave)'] = name;
        }
      } else if (authorizationMasterID == 3) {
        //overTime
        data['Authorization Master(Overtime)'] = 'Overtime';
        data['Authorization Criteria(Overtime)'] = findOvertime
          ? findOvertime['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Overtime)'] = '';

        if (findOvertime) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findOvertime.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Overtime)'] = name;
        }
      } else if (authorizationMasterID == 5) {
        //Resignation
        data['Authorization Master(Resignation)'] = 'Resignation';
        data['Authorization Criteria(Resignation)'] = findResignation
          ? findResignation['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(Resignation)'] = '';

        if (findResignation) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findResignation.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(Resignation)'] = name;
        }
      } else if (authorizationMasterID == 6) {
        //GatePass
        data['Authorization Master(GatePass)'] = 'Employee Gate Pass';
        data['Authorization Criteria(GatePass)'] = findGatePass
          ? findGatePass['AuthorizationCriteriaMaster.AuthorizationCriteria']
          : '';
        data['Authorized User(GatePass)'] = '';

        if (findGatePass) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findGatePass.AuthorizedByUserMasterId.map((item) => {
            const findUser = userMap.get(item);
            if (!findUser) return 'Not Found';

            return fileUploadType === 'employeeCode'
              ? findUser.employeeJoiningDetails.length &&
                findUser.employeeJoiningDetails[0].employeeCode
                ? findUser.employeeJoiningDetails[0].employeeCode
                : findUser.displayName
              : findUser.userNumber;
          }).join(',');

          // Assign the result to the data object
          data['Authorized User(GatePass)'] = name;
        }
      } else if (authorizationMasterID == 8) {
        //Compensatory Off
        data['Authorization Master(Compensatory Off)'] = 'Compensatory Off';
        data['Authorization Criteria(Compensatory Off)'] = findcompensatoryOff
          ? findcompensatoryOff[
              'AuthorizationCriteriaMaster.AuthorizationCriteria'
            ]
          : '';
        data['Authorized User(Compensatory Off)'] = '';
        if (findcompensatoryOff) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findcompensatoryOff.AuthorizedByUserMasterId.map(
            (item) => {
              const findUser = userMap.get(item);
              if (!findUser) return 'Not Found';

              return fileUploadType === 'employeeCode'
                ? findUser.employeeJoiningDetails.length &&
                  findUser.employeeJoiningDetails[0].employeeCode
                  ? findUser.employeeJoiningDetails[0].employeeCode
                  : findUser.displayName
                : findUser.userNumber;
            }
          ).join(',');

          // Assign the result to the data object
          data['Authorized User(Compensatory Off)'] = name;
        }
      } else if (authorizationMasterID == 7) {
        //Attendance Correction
        data['Authorization Master(Attendance Correction)'] =
          'Attendance Correction';
        data['Authorization Criteria(Attendance Correction)'] =
          findAttendanceCorrection
            ? findAttendanceCorrection[
                'AuthorizationCriteriaMaster.AuthorizationCriteria'
              ]
            : '';
        data['Authorized User(Attendance Correction)'] = '';

        if (findAttendanceCorrection) {
          // Convert allUsers to a map for fast lookups
          const userMap = new Map(
            allUsers.map((user) => [+user.userMasterID, user])
          );

          // Generate the names using map and join in one step
          const name = findAttendanceCorrection.AuthorizedByUserMasterId.map(
            (item) => {
              const findUser = userMap.get(item);
              if (!findUser) return 'Not Found';

              return fileUploadType === 'employeeCode'
                ? findUser.employeeJoiningDetails.length &&
                  findUser.employeeJoiningDetails[0].employeeCode
                  ? findUser.employeeJoiningDetails[0].employeeCode
                  : findUser.displayName
                : findUser.userNumber;
            }
          ).join(',');

          // Assign the result to the data object
          data['Authorized User(Attendance Correction)'] = name;
        }
      }
      finalData.push(data);
    }

    const companyWiseUserData = [];
    for (let id of allParentChidCompanyIDs) {
      const companyUsers = [];
      const companyData = getAllParentChidCompany.find(
        (e) => e.companyMasterID == id
      );
      allUsers.forEach((row) => {
        if (row.companyMasterId == id) {
          companyUsers.push({
            userMasterID: row.userMasterID,
            displayName: row.displayName,
            userNumber: row.userNumber,
            companyMasterId: row.companyMasterId,
            employeeCode:
              row.employeeJoiningDetails &&
              row.employeeJoiningDetails.length > 0
                ? row.employeeJoiningDetails[0].employeeCode
                : '',
            branch:
              (row.employeeBranches && row.employeeBranches.length) > 0
                ? row.employeeBranches[0].branchMaster
                  ? row.employeeBranches[0].branchMaster.branchName
                  : ''
                : '',
            designation:
              (row.employeeDesignations && row.employeeDesignations.length) > 0
                ? row.employeeDesignations[0].designation
                  ? row.employeeDesignations[0].designation.designationName
                  : ''
                : '',
            department:
              (row.employeeDepartments && row.employeeDepartments.length) > 0
                ? row.employeeDepartments[0].department
                  ? row.employeeDepartments[0].department.departmentName
                  : ''
                : '',
            company: row.companyMaster.companyName,
          });
        }
      });
      companyWiseUserData.push({
        companyName: companyData.companyName,
        employeeData: companyUsers,
      });
    }

    if (finalData.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'No data found to export!',
      });

    return await generateAuthorozationExcelWithUserData(
      finalData,
      AuthorizationCriteriaMasterData,
      authorizationMasterID,
      companyWiseUserData,
      'Authorization Details',
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
  }
};

exports.validatUploadAuthorizationDetails = async (req, res, next) => {
  if (!req.file)
    return res
      .status(200)
      .json({ status: 401, message: `Please enter a valid File!` });

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, authorizationMasterID, branchMasterID } = req.body;

    if (!companyMasterID)
      return res
        .status(200)
        .json({ status: 401, message: `Please select company.` });

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    // const path = './uploads/' + req.file.filename;

    readXlsxFile(filePath).then(async (rows) => {
      const firstRow = rows[0];
      if (
        firstRow[0] != 'Employee Name' ||
        firstRow[1] != 'Number' ||
        firstRow[2] != 'Employee Code' ||
        firstRow[3] != 'Branch Name' ||
        firstRow[4] != 'Department Name' ||
        firstRow[5] != 'Designation Name'
      ) {
        return res.status(200).json({
          status: 401,
          message: 'Please Enter Valid Excel',
        });
      }
      if (authorizationMasterID == 0) {
        if (
          firstRow[6] != 'Authorization Master(Expense)' ||
          firstRow[7] != 'Authorization Criteria(Expense)' ||
          firstRow[8] != 'Authorized User(Expense)' ||
          firstRow[9] != 'Authorization Master(Leave)' ||
          firstRow[10] != 'Authorization Criteria(Leave)' ||
          firstRow[11] != 'Authorized User(Leave)' ||
          firstRow[12] != 'Authorization Master(Overtime)' ||
          firstRow[13] != 'Authorization Criteria(Overtime)' ||
          firstRow[14] != 'Authorized User(Overtime)' ||
          firstRow[15] != 'Authorization Master(Resignation)' ||
          firstRow[16] != 'Authorization Criteria(Resignation)' ||
          firstRow[17] != 'Authorized User(Resignation)' ||
          firstRow[18] != 'Authorization Master(GatePass)' ||
          firstRow[19] != 'Authorization Criteria(GatePass)' ||
          firstRow[20] != 'Authorized User(GatePass)' ||
          firstRow[21] != 'Authorization Master(Compensatory Off)' ||
          firstRow[22] != 'Authorization Criteria(Compensatory Off)' ||
          firstRow[23] != 'Authorized User(Compensatory Off)' ||
          firstRow[24] != 'Authorization Master(Attendance Correction)' ||
          firstRow[25] != 'Authorization Criteria(Attendance Correction)' ||
          firstRow[26] != 'Authorized User(Attendance Correction)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 2) {
        //Expense
        if (
          firstRow[6] != 'Authorization Master(Expense)' ||
          firstRow[7] != 'Authorization Criteria(Expense)' ||
          firstRow[8] != 'Authorized User(Expense)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 1) {
        //Leave
        if (
          firstRow[6] != 'Authorization Master(Leave)' ||
          firstRow[7] != 'Authorization Criteria(Leave)' ||
          firstRow[8] != 'Authorized User(Leave)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 3) {
        //Overtime
        if (
          firstRow[6] != 'Authorization Master(Overtime)' ||
          firstRow[7] != 'Authorization Criteria(Overtime)' ||
          firstRow[8] != 'Authorized User(Overtime)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 5) {
        //Resignation
        if (
          firstRow[6] != 'Authorization Master(Resignation)' ||
          firstRow[7] != 'Authorization Criteria(Resignation)' ||
          firstRow[8] != 'Authorized User(Resignation)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 6) {
        //GatePass
        if (
          firstRow[6] != 'Authorization Master(GatePass)' ||
          firstRow[7] != 'Authorization Criteria(GatePass)' ||
          firstRow[8] != 'Authorized User(GatePass)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 8) {
        //Compensatory Off
        if (
          firstRow[6] != 'Authorization Master(Compensatory Off)' ||
          firstRow[7] != 'Authorization Criteria(Compensatory Off)' ||
          firstRow[8] != 'Authorized User(Compensatory Off)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      } else if (authorizationMasterID == 7) {
        //Attendace Correction
        if (
          firstRow[6] != 'Authorization Master(Attendance Correction)' ||
          firstRow[7] != 'Authorization Criteria(Attendance Correction)' ||
          firstRow[8] != 'Authorized User(Attendance Correction)'
        ) {
          return res.status(200).json({
            status: 401,
            message: 'Please Enter Valid Excel',
          });
        }
      }
      rows.shift();
      const [allUserJoiningDetails, AuthCriteria, currCompany] =
        await Promise.all([
          // allUserJoiningDetails
          EmployeeJoiningDetails.findAll({
            raw: true,
            where: {
              joiningDate: {
                [Sequelize.Op.lte]: new Date(),
              },
              [Sequelize.Op.or]: [
                {
                  leavingDate: { [Sequelize.Op.gte]: new Date() },
                },
                {
                  leavingDate: { [Sequelize.Op.eq]: null },
                  [Sequelize.Op.or]: [
                    {
                      '$userMaster.deactiveDate$': {
                        [Sequelize.Op.gte]: new Date(),
                      },
                    },
                    {
                      '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
                    },
                  ],
                },
              ],
              '$userMaster.companyMasterId$': companyMasterID,
              '$userMaster.status$': 1,
            },
            include: [
              {
                model: UserMaster,
                required: true,
                ...accessibleUsers(req.userDetails),
                include: [
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
                    required: branchMasterID ? true : false,
                    model: EmployeeBranch,
                    where: {
                      ...(branchMasterID && { branchID: branchMasterID }),
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
                    attributes: ['branchID'],
                    include: [
                      {
                        model: BranchMaster,
                        as: 'branchMaster',
                        attributes: ['branchName'],
                      },
                    ],
                  },
                ],
              },
            ],
            order: [[{ model: UserMaster }, 'displayName', 'ASC']],
          }),
          // AuthCriteria
          AuthorizationCriteriaMaster.findAll({
            raw: true,
            where: { status: 1 },
            attributes: ['AuthorizationCriteriaID', 'AuthorizationCriteria'],
          }),
          companyMasters.findOne({
            where: { companyMasterID: companyMasterID, status: 1 },
            attributes: [
              'companyMasterID',
              'parentCompanyMasterID',
              'fileUploadType',
            ],
            raw: true,
          }),
        ]);

      let getAllParentChidCompany = [];
      if (+currCompany.parentCompanyMasterID) {
        getAllParentChidCompany = await companyMasters.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              { companyMasterID: +currCompany.parentCompanyMasterID },
              { parentCompanyMasterID: +currCompany.parentCompanyMasterID },
            ],
            status: 1,
          },
          order: [['companyMasterID', 'ASC']],
        });
      } else {
        getAllParentChidCompany = await companyMasters.findAll({
          raw: true,
          where: {
            [Sequelize.Op.or]: [
              { companyMasterID: +companyMasterID },
              { parentCompanyMasterID: +companyMasterID },
            ],
            status: 1,
          },
          order: [['companyMasterID', 'ASC']],
        });
      }
      let fileUploadType = 'mobileNumber';
      if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
        fileUploadType = 'employeeCode';

      const allParentChidCompanyIDs = getAllParentChidCompany.map(
        (e) => e.companyMasterID
      );

      const allEmployees = await UserMaster.findAll({
        where: { companyMasterId: allParentChidCompanyIDs, status: 1 },
        raw: true,
        attributes: [
          'displayName',
          'userMasterID',
          'userNumber',
          'companyMasterId',
        ],
        include: [
          {
            model: EmployeeJoiningDetails,
            required: fileUploadType == 'mobileNumber' ? false : true,
            attributes: ['employeeJoiningDetailId', 'employeeCode'],
          },
        ],
      });

      const data = [];
      const hasDuplicates = (array) => new Set(array).size !== array.length;
      const duplicateUser = new Set();
      for (const row of rows) {
        if (!row) continue;
        let authorizationData = {
          userName: row[0],
          userNumber: null,
          employeeCode: row[2] ? row[2].toString().trim() : row[2],
          branch: row[3] ? row[3].toString().trim() : row[3],
          department: row[4] ? row[4].toString().trim() : row[4],
          designation: row[5] ? row[5].toString().trim() : row[5],
          companyMasterID: req.body.companyMasterID,
          remarks: null,
          userMasterID: null,
        };
        if (fileUploadType == FileUploadType.MOBILE_NUMBER && !row[1]) {
          authorizationData.remarks = `Please enter a valid Mobile Number!`;
          data.push(authorizationData);
          continue;
        }
        if (fileUploadType == FileUploadType.EMPLOYEE_CODE && !row[2]) {
          authorizationData.remarks = `Please enter a valid Employee Code!`;
          data.push(authorizationData);
          continue;
        }

        const mobileNumber = row[1].toString().trim();
        authorizationData.userNumber = mobileNumber;

        const empCode = row[2] ? row[2].toString().trim() : row[2];
        if (duplicateUser.has(mobileNumber)) {
          authorizationData.remarks = `You have entered ${row[1]} Mobile Number multiple times!`;
          data.push(authorizationData);
          continue;
        }
        if (empCode && duplicateUser.has(empCode)) {
          authorizationData.remarks = `You have entered ${row[2]} Employee Code multiple times!`;
          data.push(authorizationData);
          continue;
        }

        duplicateUser.add(mobileNumber);
        if (empCode) duplicateUser.add(empCode);

        let findUser;
        if (fileUploadType == FileUploadType.EMPLOYEE_CODE) {
          findUser = allUserJoiningDetails.find(
            (user) => user.employeeCode == empCode
          );
        } else {
          findUser = allUserJoiningDetails.find(
            (user) => user['userMaster.userNumber'] == mobileNumber
          );
        }

        if (!findUser) {
          if (fileUploadType == FileUploadType.EMPLOYEE_CODE)
            authorizationData.remarks = `User with Employee Code ${empCode} does not exist!`;
          else
            authorizationData.remarks = `User with Mobile Number ${mobileNumber} does not exist!`;
          data.push(authorizationData);
          continue;
        } else {
          if (
            (findUser.employeeCode && !empCode) ||
            (!findUser.employeeCode && empCode) ||
            (findUser.employeeCode &&
              empCode &&
              findUser.employeeCode != empCode)
          ) {
            authorizationData.remarks = `Employee Code ${empCode} does not match!`;
            data.push(authorizationData);
            continue;
          }
          row[1] = findUser.userMasterID;
          authorizationData.userMasterID = findUser.userMasterID;
          authorizationData.userName = findUser.displayName;
          authorizationData.userNumber = findUser.userNumber;
          authorizationData.employeeCode = findUser.employeeCode;
        }

        if (authorizationMasterID == 0) {
          //Expense
          let expenseauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Expense',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Expense) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              expenseauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              expenseauthorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Expense Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            expenseauthorizedData.authorizedUsers = allUsers;
            authorizationData.expense = expenseauthorizedData;
          }

          //Leave
          let leaveauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Leave',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[10] && !row[11]) || (row[10] && !row[11])) {
            row[10] = null;
            row[11] = null;
          } else if (!row[10] && row[11]) {
            row[10] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[10].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Leave) with name ${row[10]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              leaveauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              leaveauthorizedData.authorizationCriteriaName = row[10].trim();
              row[10] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[11].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Leave Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[11] = allUsers;
            leaveauthorizedData.authorizedUsers = allUsers;
            authorizationData.leave = leaveauthorizedData;
          }

          //Overtime
          let overtimeauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Overtime',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[13] && !row[14]) || (row[13] && !row[14])) {
            row[13] = null;
            row[14] = null;
          } else if (!row[13] && row[14]) {
            row[13] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[13].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Overtime) with name ${row[13]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              overtimeauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              overtimeauthorizedData.authorizationCriteriaName = row[13].trim();
              row[13] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[14].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Overtime Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[14] = allUsers;
            overtimeauthorizedData.authorizedUsers = allUsers;
            authorizationData.overtime = overtimeauthorizedData;
          }

          //Resignation
          let resignationauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Resignation',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[16] && !row[17]) || (row[16] && !row[17])) {
            row[16] = null;
            row[17] = null;
          } else if (!row[16] && row[17]) {
            row[16] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[16].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Resignation) with name ${row[16]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              resignationauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              resignationauthorizedData.authorizationCriteriaName =
                row[16].trim();
              row[16] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[17].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Resignation Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[17] = allUsers;
            resignationauthorizedData.authorizedUsers = allUsers;
            authorizationData.resignation = resignationauthorizedData;
          }

          //GatePass
          let gatepassauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'GatePass',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[19] && !row[20]) || (row[19] && !row[20])) {
            row[19] = null;
            row[20] = null;
          } else if (!row[19] && row[20]) {
            row[19] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[19].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(GatePass) with name ${row[19]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              gatepassauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              gatepassauthorizedData.authorizationCriteriaName = row[19].trim();
              row[19] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[20].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in GatePass Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[20] = allUsers;
            gatepassauthorizedData.authorizedUsers = allUsers;
            authorizationData.gatepass = gatepassauthorizedData;
          }

          // Compensatory Off
          let compensatoryOffauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Compensatory Off',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[22] && !row[23]) || (row[22] && !row[23])) {
            row[22] = null;
            row[23] = null;
          } else if (!row[22] && row[23]) {
            row[22] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[22].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Compensatory Off) with name ${row[22]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              compensatoryOffauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              compensatoryOffauthorizedData.authorizationCriteriaName =
                row[22].trim();
              row[22] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[23].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Compensatory Off Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[23] = allUsers;
            compensatoryOffauthorizedData.authorizedUsers = allUsers;
            authorizationData.compensatoryOff = compensatoryOffauthorizedData;
          }

          //Attendace Correction
          let attendanceCorrectionauthorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Attendace Correction',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[25] && !row[26]) || (row[25] && !row[26])) {
            row[25] = null;
            row[26] = null;
          } else if (!row[25] && row[26]) {
            row[25] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[25].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Attendace Correction) with name ${row[25]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              attendanceCorrectionauthorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              attendanceCorrectionauthorizedData.authorizationCriteriaName =
                row[25].trim();
              row[25] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[26].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Attendace Correction Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[26] = allUsers;
            attendanceCorrectionauthorizedData.authorizedUsers = allUsers;
            authorizationData.attendanceCorrection =
              attendanceCorrectionauthorizedData;
          }

          data.push(authorizationData);
        } else if (authorizationMasterID == 2) {
          //Expense
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Expense',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Expense) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Expense Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.expense = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 1) {
          //Leave
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Leave',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Leave) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Leave Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.leave = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 3) {
          //Overtime
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Overtime',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Overtime) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Overtime Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.overtime = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 5) {
          //Resignation
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Resignation',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Resignation) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Resignation Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.resignation = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 6) {
          //GatePass
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'GatePass',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(GatePass) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in GatePass Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.gatepass = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 8) {
          //Compensatory Off
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Compensatory Off',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Compensatory Off) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Compensatory Off Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.compensatoryOff = authorizedData;
          }
          data.push(authorizationData);
        } else if (authorizationMasterID == 7) {
          //Attendace Correction
          let authorizedData = {
            authorizedUsers: [],
            authorizationMasterName: 'Attendace Correction',
            authorizationCriteriaID: null,
            authorizationCriteriaName: null,
          };
          if ((!row[7] && !row[8]) || (row[7] && !row[8])) {
            row[7] = null;
            row[8] = null;
          } else if (!row[7] && row[8]) {
            row[7] = null;
            authorizationData.remarks = `Please Select Authorization Criteria!`;
          } else {
            const filteredCriteria = AuthCriteria.filter(
              (item) => item.AuthorizationCriteria === row[7].trim()
            );
            if (filteredCriteria.length == 0) {
              authorizationData.remarks = `Authorization Criteria(Attendace Correction) with name ${row[7]} not found!`;
              data.push(authorizationData);
              continue;
            } else {
              authorizedData.authorizationCriteriaID =
                filteredCriteria[0].AuthorizationCriteriaID;
              authorizedData.authorizationCriteriaName = row[7].trim();
              row[7] = filteredCriteria[0].AuthorizationCriteriaID;
            }

            const allAuthorized = row[8].toString().split(',');
            if (hasDuplicates(allAuthorized)) {
              authorizationData.remarks = `Duplicate Users in Attendace Correction Authorization found!`;
              data.push(authorizationData);
              continue;
            }

            const allUsers = [];

            for (var item of allAuthorized) {
              let findEmp;
              if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
                findEmp = allEmployees.find(
                  (exp) =>
                    exp['employeeJoiningDetails.employeeCode'] ==
                    item.toString().trim()
                );
              } else {
                findEmp = allEmployees.find(
                  (exp) => +exp.userNumber == item.toString().trim()
                );
              }

              if (!findEmp) {
                if (currCompany.fileUploadType == FileUploadType.EMPLOYEE_CODE)
                  authorizationData.remarks = `User with Employee Code ${item} does not exist!`;
                else
                  authorizationData.remarks = `User with Number ${item} does not exist!`;
                break;
              } else {
                allUsers.push({
                  userMasterID: findEmp.userMasterID,
                  displayName: findEmp.displayName,
                  employeeCode: findEmp['employeeJoiningDetails.employeeCode'],
                });
              }
            }
            row[8] = allUsers;
            authorizedData.authorizedUsers = allUsers;
            authorizationData.attendanceCorrection = authorizedData;
          }
          data.push(authorizationData);
        }
      }

      fs.unlink(filePath, function (err) {
        if (err) console.log(err);
      });

      return res.status(200).send({
        status: 200,
        data: data,
        message: 'Authorization Validate SuccessFully',
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.addUpdateAuthorization = async (req, res, next) => {
  try {
    const {
      authorizationData,
      createBy,
      createByIp,
      authorizationMasterID,
      companyMasterID,
    } = req.body;

    for (let row of authorizationData) {
      // if (!row[1]) continue;
      const userID = row.userMasterID;

      const allAuthDetails = await AuthorizationDetails.findAll({
        raw: true,
        where: {
          userMasterID: userID,
          status: 1,
        },
      });

      //Expense
      if (authorizationMasterID == 0 || authorizationMasterID == 2) {
        const findExpenseAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID == authorizationMasterTypes.expense
            )
          : null;

        if (row.expense) {
          const userMasterIDs = row.expense.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findExpenseAuth) {
            const checkAuth = arraysAreIdentical(
              findExpenseAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findExpenseAuth.AuthorizationCriteriaID !=
                row.expense.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findExpenseAuth.AuthorizationDetailsId,
                2,
                userMasterIDs,
                row.expense.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              2,
              userMasterIDs,
              row.expense.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findExpenseAuth) {
          //Remove
          await deleteAuth(
            findExpenseAuth.AuthorizationDetailsId,
            2,
            createBy,
            createByIp
          );
        }
      }

      //Leave
      if (authorizationMasterID == 0 || authorizationMasterID == 1) {
        const findLeaveAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID == authorizationMasterTypes.leave
            )
          : null;

        if (row.leave) {
          const userMasterIDs = row.leave.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findLeaveAuth) {
            const checkAuth = arraysAreIdentical(
              findLeaveAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findLeaveAuth.AuthorizationCriteriaID !=
                row.leave.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findLeaveAuth.AuthorizationDetailsId,
                1,
                userMasterIDs,
                row.leave.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              1,
              userMasterIDs,
              row.leave.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findLeaveAuth) {
          //Remove
          await deleteAuth(
            findLeaveAuth.AuthorizationDetailsId,
            1,
            createBy,
            createByIp
          );
        }
      }

      //Overtime
      if (authorizationMasterID == 0 || authorizationMasterID == 3) {
        const findOvertimeAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID == authorizationMasterTypes.overtime
            )
          : null;

        if (row.overtime) {
          const userMasterIDs = row.overtime.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findOvertimeAuth) {
            const checkAuth = arraysAreIdentical(
              findOvertimeAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findOvertimeAuth.AuthorizationCriteriaID !=
                row.overtime.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findOvertimeAuth.AuthorizationDetailsId,
                3,
                userMasterIDs,
                row.overtime.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              3,
              userMasterIDs,
              row.overtime.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findOvertimeAuth) {
          //Remove
          await deleteAuth(
            findOvertimeAuth.AuthorizationDetailsId,
            3,
            createBy,
            createByIp
          );
        }
      }

      //Resignation
      if (authorizationMasterID == 0 || authorizationMasterID == 5) {
        const findResignationAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID ==
                authorizationMasterTypes.resignation
            )
          : null;

        if (row.resignation) {
          const userMasterIDs = row.resignation.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findResignationAuth) {
            const checkAuth = arraysAreIdentical(
              findResignationAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findResignationAuth.AuthorizationCriteriaID !=
                row.resignation.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findResignationAuth.AuthorizationDetailsId,
                5,
                userMasterIDs,
                row.resignation.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              5,
              userMasterIDs,
              row.resignation.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findResignationAuth) {
          //Remove
          await deleteAuth(
            findResignationAuth.AuthorizationDetailsId,
            5,
            createBy,
            createByIp
          );
        }
      }

      //Gatepass
      if (authorizationMasterID == 0 || authorizationMasterID == 6) {
        const findGatepassAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID ==
                authorizationMasterTypes.employeeGatePass
            )
          : null;

        if (row.gatepass) {
          const userMasterIDs = row.gatepass.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findGatepassAuth) {
            const checkAuth = arraysAreIdentical(
              findGatepassAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findGatepassAuth.AuthorizationCriteriaID !=
                row.gatepass.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findGatepassAuth.AuthorizationDetailsId,
                6,
                userMasterIDs,
                row.gatepass.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              6,
              userMasterIDs,
              row.gatepass.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findGatepassAuth) {
          //Remove
          await deleteAuth(
            findGatepassAuth.AuthorizationDetailsId,
            6,
            createBy,
            createByIp
          );
        }
      }

      //Compensatory OFF
      if (authorizationMasterID == 0 || authorizationMasterID == 8) {
        const findCompensatoryoffAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID ==
                authorizationMasterTypes.compensatoryOff
            )
          : null;

        if (row.compensatoryOff) {
          const userMasterIDs = row.compensatoryOff.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findCompensatoryoffAuth) {
            const checkAuth = arraysAreIdentical(
              findCompensatoryoffAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findCompensatoryoffAuth.AuthorizationCriteriaID !=
                row.compensatoryOff.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findCompensatoryoffAuth.AuthorizationDetailsId,
                8,
                userMasterIDs,
                row.compensatoryOff.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              8,
              userMasterIDs,
              row.compensatoryOff.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findCompensatoryoffAuth) {
          //Remove
          await deleteAuth(
            findCompensatoryoffAuth.AuthorizationDetailsId,
            8,
            createBy,
            createByIp
          );
        }
      }

      //Attendance Correction
      if (authorizationMasterID == 0 || authorizationMasterID == 7) {
        const findAttendanceCorrectionAuth = allAuthDetails
          ? allAuthDetails.find(
              (exp) =>
                +exp.AuthorizationMasterID ==
                authorizationMasterTypes.attendanceCorrection
            )
          : null;

        if (row.attendanceCorrection) {
          const userMasterIDs = row.attendanceCorrection.authorizedUsers.map(
            (user) => user.userMasterID
          );
          if (findAttendanceCorrectionAuth) {
            const checkAuth = arraysAreIdentical(
              findAttendanceCorrectionAuth.AuthorizedByUserMasterId,
              userMasterIDs
            );
            if (
              findAttendanceCorrectionAuth.AuthorizationCriteriaID !=
                row.attendanceCorrection.authorizationCriteriaID ||
              !checkAuth
            ) {
              //Update
              await updateAuth(
                findAttendanceCorrectionAuth.AuthorizationDetailsId,
                7,
                userMasterIDs,
                row.attendanceCorrection.authorizationCriteriaID,
                companyMasterID,
                createBy,
                createByIp,
                userID,
                req
              );
            }
          } else {
            //Add Auth
            await addAuth(
              7,
              userMasterIDs,
              row.attendanceCorrection.authorizationCriteriaID,
              companyMasterID,
              [userID],
              createBy,
              createByIp,
              req
            );
          }
        } else if (findAttendanceCorrectionAuth) {
          //Remove
          await deleteAuth(
            findAttendanceCorrectionAuth.AuthorizationDetailsId,
            7,
            createBy,
            createByIp
          );
        }
      }
    }
    return res.status(200).send({
      status: 200,
      message: message.usermessage.addMessage('Authorization'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const userMasterID = req.params.id;

    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const userDetails = await UserMaster.findOne({
      where: { userMasterID: userMasterID, status: 1 },
      attributes: [
        'userMasterID',
        'displayName',
        'firstName',
        'middleName',
        'lastName',
        'photo',
        'gender',
        'dob',
        'userNumber',
      ],
      include: [
        { model: companyMaster, attributes: companyAttributes },
        {
          required: false,
          separate: true,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
          separate: true,
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
          separate: true,
          model: EmployeeDivision,
          where: {
            status: 1,
            startDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
            startDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
    });
    return res.status(200).json({
      status: 200,
      data: userDetails,
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkDownloadProfilePics = async (req, res, next) => {
  try {
    const {
      status,
      companyMasterID,
      branchMasterID,
      departmentID,
      designationID,
      divisionId,
      workingAreaId,
    } = req.body;

    const order = [['displayName', 'ASC']];

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const includedModels = [
      {
        model: EmployeeJoiningDetails,
        attributes: ['employeeCode'],
      },
      {
        model: EmployeeDesignation,
        where: {
          status: 1,
          ...(designationID &&
            (!Array.isArray(designationID) || designationID.length) && {
              designationID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(filterDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(filterDate),
              },
            },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: designationID ? true : false,
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
          ...(departmentID &&
            (!Array.isArray(departmentID) || departmentID.length) && {
              departmentID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(filterDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(filterDate),
              },
            },
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
          ...(branchMasterID &&
            (!Array.isArray(branchMasterID) || branchMasterID.length) && {
              branchID: branchMasterID,
            }),
          applicableDate: {
            [Sequelize.Op.lte]: new Date(filterDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: {
                [Sequelize.Op.gte]: new Date(filterDate),
              },
            },
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
    ];

    if (divisionId) {
      includedModels.push({
        model: EmployeeDivision,
        where: {
          status: 1,
          ...(divisionId && { divisionId }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['divisionId'],
        include: [
          {
            model: Division,
            attributes: ['divisionName'],
          },
        ],
      });
    }
    if (workingAreaId) {
      includedModels.push({
        model: EmployeeWorkingArea,
        where: {
          status: 1,
          ...(workingAreaId && { workingAreaId }),
          startDate: { [Sequelize.Op.lte]: new Date(filterDate) },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
            { endDate: { [Sequelize.Op.eq]: null } },
          ],
        },
        required: true,
        attributes: ['workingAreaId'],
        include: [
          {
            model: WorkingArea,
            attributes: ['workingAreaName'],
          },
        ],
      });
    }

    const condition = {};
    if (
      companyMasterID &&
      (!Array.isArray(companyMasterID) || companyMasterID.length)
    )
      condition.companyMasterId = companyMasterID;
    condition.status = status ? status : 1;
    condition.photo = {
      [Sequelize.Op.and]: [
        { [Sequelize.Op.ne]: null },
        { [Sequelize.Op.ne]: '' },
      ],
    };

    const attributes = ['userMasterID', 'photo', 'displayName', 'userNumber'];

    const AllUser = await UserMaster.findAndCountAll({
      where: condition,
      order,
      include: includedModels,
      attributes: attributes,
    });

    if (AllUser.rows.length > 0) {
      return await createZipFileForProfilePics(AllUser.rows, res);
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.usernotfound,
      });
    }
  } catch (error) {
    next(error);
  }
};
