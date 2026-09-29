const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const sequelize = require('../config/database');
const subscriptionPlan = require('../models/subscriptionPlan');
const HRSalaryFields = require('../models/hrSalaryFields');
const HRLeaveTypes = require('../models/hrLeaveTypes');
const jwt = require('jsonwebtoken');
const RoleMaster = require('../models/roleMaster');
const RolePermission = require('../models/rolePermission');
const ProductPermission = require('../models/productPermission');
const FormMaster = require('../models/formMaster');
const companyMaster = require('../models/companyMaster');
const { roleType, companyAccessType } = require('../utils/dbUtils');
const Incentivetype = require('../models/incentivetype');
const moment = require('moment');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const Designation = require('../models/designation');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const bcrypt = require('bcrypt');
const Biometric_Integration = require('../models/biometricIntegration');
const UserRole = require('../models/userRole');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const shiftTime = require('../models/shiftTime');
const Shift = require('../models/shift');
const EmployeeShift = require('../models/employeeShift');
const LeadMaster = require('../models/leadMaster');
const Task_Stages = require('../models/tasks_stages');

async function addHRSalaryFields(
  companyMasterID,
  createBy,
  createByIp,
  transaction
) {
  let mainarray = [];
  mainarray.push(
    {
      salaryFieldActive: 'Y',
      payheadMasterId: 17,
      salaryFieldSide: 'D',
      salaryFieldAttanChk: 1,
      salaryFieldRound: 'Y',
      salaryFieldSrNo: 'B',
      salaryFieldShow: 'Y',
      salaryFieldWhenMonth: [0],
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      salaryFieldShow: 'N',
      salaryFieldWhenMonth: [0],
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
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
      companyMasterID: companyMasterID,
      createBy,
      createByIp,
    }
  );

  await HRSalaryFields.bulkCreate(mainarray, { transaction })
    .then(() => {})
    .catch((error) => {
      console.log(error);
    });
}

async function addHRLeaveTypes(
  companyMasterID,
  createBy,
  createByIp,
  transaction
) {
  let mainarray2 = [];
  mainarray2.push(
    {
      LeaveID: 1,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'Y',
      createBy,
      createByIp,
    },
    {
      LeaveID: 5,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      createBy,
      createByIp,
    },
    {
      LeaveID: 6,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      createBy,
      createByIp,
    },
    {
      LeaveID: 9,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'Y',
      createBy,
      createByIp,
    },
    {
      LeaveID: 7,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'Y',
      createBy,
      createByIp,
    },
    {
      LeaveID: 18,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      Leave_Allow: 'Y',
      createBy,
      createByIp,
    },
    {
      LeaveID: 20,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      createBy,
      createByIp,
    },
    {
      LeaveID: 21,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      createBy,
      createByIp,
    },
    {
      LeaveID: 22,
      companyMasterID: companyMasterID,
      // Allow_Field_Entry: 'N',
      createBy,
      createByIp,
    }
  );

  await HRLeaveTypes.bulkCreate(mainarray2, { transaction })
    .then(() => {})
    .catch((error) => {
      console.log(error);
    });
}
async function addTaskStages(
  companyMasterID,
  createBy,
  createByIp,
  transaction
) {
  let mainarray3 = [];
  mainarray3.push(
    {
      TaskStage: 'Assigned',
      companyMasterID: companyMasterID,
      createBy,
      createByIp,
    },
    {
      TaskStage: 'Finished',
      companyMasterID: companyMasterID,
      createBy,
      createByIp,
    },
  );
  await Task_Stages.bulkCreate(mainarray3, { transaction })
    .then(() => {})
    .catch((error) => {
      console.log(error);
    });
}
async function addIncentivetype(
  companyMasterID,
  createBy,
  createByIp,
  transaction
) {
  const AddIncentiveTypes = [
    {
      incentivetypename: 'Attendance Bonus',
      showinsalaryslip: true,
      consider: 'gross',
      status: 1,
      companyMasterID: companyMasterID,
      createBy,
      createByIp,
    },
    {
      incentivetypename: 'Food Allowance',
      showinsalaryslip: true,
      consider: 'gross',
      status: 1,
      companyMasterID: companyMasterID,
      createBy,
      createByIp,
    },
  ];

  // Attendance Bonus Data && Food Allowance
  await Incentivetype.bulkCreate(AddIncentiveTypes, { transaction })
    .then(() => {})
    .catch((error) => {
      console.log(error);
    });
}

async function addBranchData(
  companyMasterID,
  companyAddress,
  cityMasterID,
  userMasterID,
  createBy,
  createByIp,
  transaction
) {
  let today = new Date().toISOString().slice(0, 10);
  let branchName = 'General';
  let branchCode = 'General';
  let branchAddress = companyAddress;
  let latitude = null;
  let longitude = null;
  let radius = null;
  let gstNumber = null;
  let lwfNumber = null;
  let professionaltaxNumber = null;
  let pfNumber = null;
  let esicNumber = null;
  const addBranch = await BranchMaster.create(
    {
      companyMasterID,
      branchName,
      branchCode,
      branchAddress,
      cityMasterID,
      latitude,
      longitude,
      radius,
      createBy,
      createByIp,
      gstNumber,
      lwfNumber,
      professionaltaxNumber,
      pfNumber,
      esicNumber,
    },
    { transaction }
  );

  const addEmployeeBranch = await EmployeeBranch.create(
    {
      userMasterID,
      branchID: addBranch.branchMasterID,
      applicableDate: today,
      status: '1',
      createBy,
      createByIp,
    },
    { transaction }
  );
}

async function addDepartmentData(
  companyMasterID,

  userMasterID,
  createBy,
  createByIp,
  transaction
) {
  let departmentName = 'General';
  let today = new Date().toISOString().slice(0, 10);
  const addDepartment = await Department.create(
    {
      departmentName,
      companyMasterID,
      authorizationStatus: 2,
      status: '1',
      createBy,
      createByIp,
    },
    { transaction }
  );

  const addEmployeeDepartment = await EmployeeDepartment.create(
    {
      userMasterID,
      departmentID: addDepartment.departmentId,
      applicableDate: today,
      status: '1',
      createBy,
      createByIp,
    },
    { transaction }
  );
}

async function addDesignationData(
  companyMasterID,

  userMasterID,
  createBy,
  createByIp,
  transaction
) {
  let designationName = 'General';
  let jobdescription = '';
  let today = new Date().toISOString().slice(0, 10);

  const addDesignation = await Designation.create(
    {
      designationName,
      companyMasterID,
      status: '1',
      jobdescription,
      createBy,
      createByIp,
    },
    { transaction }
  );

  let addEmployeeDesignation = await EmployeeDesignation.create(
    {
      userMasterID,
      designationID: addDesignation.designationId,
      applicableDate: today,
      status: '1',
      createBy,
      createByIp,
    },
    { transaction }
  );
}

async function addEmployeeJoining(
  userMasterID,
  createBy,
  createByIp,
  transaction
) {
  let today = new Date().toISOString().slice(0, 10);
  const addEmployeeJoining = await EmployeeJoiningDetails.create(
    {
      userMasterID,
      joiningDate: today,
      createBy,
      createByIp,
    },
    { transaction }
  );
}

async function addShift(
  companyMasterID,
  userMasterID,
  createBy,
  createByIp,
  transaction
) {
  let shiftName = 'General';
  let shiftCode = 'General';
  let shiftDesc = 'General';
  let shifttime = [
    {
      day: 'Monday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Tuesday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Wednesday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Thursday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Friday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Saturday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
    {
      day: 'Sunday',
      statTime: '9:30 AM',
      firsthalfendtime: '1:00 PM',
      secondhalfstarttime: '1:30 PM',
      endtime: '6:30 PM',
      totalhours: '8.00',
      totalhourshalfday: '4.00',
    },
  ];
  let shiftGrace = 0;
  const startDate = new Date().toISOString().slice(0, 10);
  const addShift = await Shift.create(
    {
      shiftName,
      shiftCode,
      shiftDesc,
      shiftGrace,
      companyMasterID,
      shifttime,
      createBy,
      createByIp,
    },
    { transaction }
  );
  shifttime.forEach(async (option) => {
    option['shiftID'] = addShift.shiftID;
  });

  const addShiftTime = await shiftTime.bulkCreate(shifttime, {
    returning: true,
    transaction,
  });

  let AssignShiftEmployee = await EmployeeShift.create(
    {
      userMasterID,
      shiftID: addShift.shiftID,
      startDate,
      createBy,
      createByIp,
    },
    { transaction }
  );
}

exports.postRegisterCompany = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      companyName,
      companyAddress,
      companyEmail,
      cpName,
      cpMobileNo,
      cpEmail,
      createByIp,
      cityMasterID,
      firstName,
      middleName,
      lastName,
      userNumber,
      gender,
      dob,
      email,
      password,
      biometricSerialNo,
      leadMasterID,
    } = req.body;

    let companyLogo = '';
    let employeeCodePattern;
    let employeeCodeType = null;
    let expenseDatePicker = null;
    let panNumber = '';
    let tanNumber = '';
    let authorizedSignature = '';
    let parentCompanyMasterID = 0;
    let companyTypeid = 5;
    let createBy = 4;

    const addCompany = await companyMaster.create(
      {
        companyName,
        companyAddress,
        companyLogo,
        companyEmail,
        companyTypeid,
        cpName,
        cpMobileNo,
        cpEmail,
        parentCompanyMasterID,
        subCompanyRequired: 0,
        employeeCodePattern,
        employeeCodeType,
        expenseDatePicker,
        createBy,
        createByIp,
        cityMasterID,
        panNumber,
        tanNumber,
        authorizedSignature,
      },
      { transaction }
    );

    const companyMasterId = addCompany.companyMasterID;
    let productMasterID = 9;
    let startDate = new Date();
    let endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
    let totalUser = 100;
    let totalTracking = 0;
    const addSubcscribePlan = await subscriptionPlan.create(
      {
        companyMasterID: companyMasterId,
        productMasterID,
        startDate,
        endDate,
        totalUser,
        totalTracking,
        createBy,
        createByIp,
      },
      { transaction }
    );
    if (biometricSerialNo) {
      const findBiometric = await Biometric_Integration.findOne({
        where: {
          biometricSerialNo: {
            [Sequelize.Op.contains]: [biometricSerialNo],
          },
        },
      });
      //check if Already Exist
      if (findBiometric) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: 'Biometric Is Already Registered.',
        });
      }

      let database = ['SoftechAttendance'];
      let algorithm = [4];
      let table = ['AIFaceAttendance'];

      let addBiometric = await Biometric_Integration.create(
        {
          companyMasterID: companyMasterId,
          biometricSerialNo,
          algorithm,
          table,
          database,
          createBy,
          createByIp,
        },
        { transaction }
      );
    }

    const totalPermission = await ProductPermission.findAll({
      raw: true,
      where: {
        productMasterID: productMasterID,
        status: 1,
      },
      group: ['formMasterID'],
      attributes: ['formMasterID'],
    });
    const totalPermissionID = totalPermission.map((item) => item.formMasterID);
    let forms = await FormMaster.findAll({
      where: {
        status: 1,
        formMasterID: totalPermissionID,
      },
    });
    let adminRoleMasterID;

    // Admin Role
    let allrights = [];
    const insertAdminRole = await RoleMaster.create(
      {
        roleName: 'Admin',
        roleType: roleType.COMPANY_WISE,
        companyAccessType: companyAccessType.OWN_PLUS_CHILD_COMPANY,
        companyMasterID: companyMasterId,
        createBy,
        createByIp,
      },
      { hooks: false, transaction }
    );
    adminRoleMasterID = insertAdminRole.roleMasterID;

    for (var i = 0; i < forms.length; i++) {
      const totaloperation = await ProductPermission.findAll({
        raw: true,
        where: {
          productMasterID: productMasterID,
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
          createByIp: createByIp,
        };
        allrights.push(givenright);
      }
    }

    await RolePermission.bulkCreate(allrights, { transaction });

    // Employee Role
    forms = await FormMaster.findAll({
      where: {
        status: 1,
        defaultRight: true,
        formMasterID: totalPermissionID,
      },
    });
    allrights = [];
    const insertEmployeeRole = await RoleMaster.create(
      {
        roleName: 'Employee',
        roleType: roleType.COMPANY_WISE,
        companyAccessType: companyAccessType.OWN_PLUS_CHILD_COMPANY,
        companyMasterID: companyMasterId,
        createBy,
        createByIp,
      },
      { hooks: false, transaction }
    );

    for (var i = 0; i < forms.length; i++) {
      const totaloperation = await ProductPermission.findAll({
        raw: true,
        where: {
          productMasterID: productMasterID,
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
          createByIp: createByIp,
        };
        allrights.push(givenright);
      }
    }
    await RolePermission.bulkCreate(allrights, { hooks: false, transaction });

    const salt = await bcrypt.genSalt(10);
    const mobile_number = await UserMaster.findAll({
      where: { userNumber: userNumber, status: 1 },
    });
    if (mobile_number.length > 0) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.mobilealreadyexist,
      });
    } else {
      const passwordHash = bcrypt.hashSync(password, salt);
      let displayName = firstName + middleName ? middleName : '' + lastName;
      let photo = '';
      let resetpassword = 0;
      let maratialStatus = null;
      let physicalDisability = null;
      let isonboarding = null;
      const addUserMaster = await UserMaster.create(
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
          companyMasterId: companyMasterId,
          password: passwordHash,
          email: email,
          admin: 0,
          resetpassword,
          createBy,
          createByIp,
        },
        { transaction }
      );
      const userMasterId = addUserMaster.userMasterID;
      if (adminRoleMasterID) {
        await UserRole.create(
          {
            userMasterID: userMasterId,
            roleMasterID: adminRoleMasterID,
            createBy,
            createByIp,
          },
          { hooks: false, transaction }
        );
      }

      await LeadMaster.update(
        {
          status: 0,
          registrationStatus: 'Registered',
        },
        {
          where: {
            leadMasterID: leadMasterID,
          },
        },
        { transaction }
      );
      await addBranchData(
        companyMasterId,
        companyAddress,
        cityMasterID,
        userMasterId,
        createBy,
        createByIp,
        transaction
      );
      await addDepartmentData(
        companyMasterId,
        userMasterId,
        createBy,
        createByIp,
        transaction
      );
      await addDesignationData(
        companyMasterId,
        userMasterId,
        createBy,
        createByIp,
        transaction
      );

      await addEmployeeJoining(userMasterId, createBy, createByIp, transaction);

      await addShift(
        companyMasterId,
        userMasterId,
        createBy,
        createByIp,
        transaction
      );

      await addHRSalaryFields(
        companyMasterId,
        createBy,
        createByIp,
        transaction
      );
      await addHRLeaveTypes(companyMasterId, createBy, createByIp, transaction);
      await addIncentivetype(
        companyMasterId,
        createBy,
        createByIp,
        transaction
      );
      await addTaskStages(
        companyMasterId,
        createBy,
        createByIp,
        transaction
      );
      await transaction.commit();

      return res.status(200).json({
        status: 200,
        message: message.usermessage.completeRegistration,
      });
    }
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
