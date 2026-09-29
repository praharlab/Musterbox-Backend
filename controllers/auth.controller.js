const masterAdmin = require('../models/master_admin');
const UserMaster = require('../models/userMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const subscriptionPlan = require('../models/subscriptionPlan');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeAttendance = require('../models/employeeAttendancePolicy');
const AppVersion = require('../models/appVersion');
const EmployeeAdress = require('../models/userAddress');
const { executeQuery } = require('./common.controller');
const UserTracking = require('../models/userTracking');
const { sendEmailForOtp } = require('../middleware/sendemail');
const Sequelize = require('sequelize');
const FormMaster = require('../models/formMaster');
const Visit = require('../models/visit');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const UserExpense = require('../models/userExpense');
const Customer = require('../models/customer');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const Notification = require('../config/firebase');
const companyMaster = require('../models/companyMaster');
const formMaster = require('../models/formMaster');
const operation = require('../models/operation');
const {
  checkDate,
  getFormattedMonthDay,
  formatDateMonthInWords,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { statusCodes } = require('../utils/commonVars');
const Designation = require('../models/designation');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const CityMaster = require('../models/citymaster');
const BankMaster = require('../models/bankMaster');
const Tracking = require('../models/tracking');
const RolePermission = require('../models/rolePermission');
const UserRole = require('../models/userRole');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const CustomizeProfile = require('../models/customizeProfile');
const { customizeProfileFields } = require('../utils/dbUtils');
const axios = require('axios');
// import { admin } from "../config/firebase";

/**
 * save visit data.
 *
 * @body {createBy} createBy user id of user who added the shift.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  const currDate = asiaKolkataDateTime(new Date()).slice(0, 10);
  if (phone && password) {
    try {
      const user1 = await UserMaster.findOne({
        where: {
          userNumber: phone,
          status: 1,
        },
        include: [{ model: companyMaster }],
      });
      if (!user1) {
        return res.json({
          status: 501,
          message: message.usermessage.usernotfound,
          data: {},
        });
      } else {
        if (user1.admin == 2 || user1.admin == 3 || user1.admin == 4) {
          if (user1.status == '1') {
            if (bcrypt.compareSync(password, user1.password)) {
              const token = {
                usermasterid: user1.userMasterID,
                userType: user1.admin,
              };

              const tokendata = await jwt.sign(
                { token },
                process.env.SECRETKEY,
                { expiresIn: '1d' }
              );
              const data = {
                token: tokendata,
                usermasterid: user1.userMasterID,
                userName: user1.userName,
                userNumber: user1.userNumber,
                email: user1.email,
                admin: user1.admin,
                childcompany: false,
                companyMasterID: user1.companyMaster.companyMasterID,
                resetpassword: user1.resetpassword,
              };
              return res.json({
                status: 200,
                message: message.usermessage.userlogin,
                data: data,
              });
            } else {
              return res.json({
                status: 400,
                message: message.usermessage.userwronginfo,
                data: {},
              });
            }
          } else if (user1.status == '0') {
            return res.json({
              status: 401,
              message: message.usermessage.userdeactive,
              data: {},
            });
          } else {
            return res.json({
              status: 401,
              message: message.usermessage.userdeleted,
              data: {},
            });
          }
        } else {
          if (user1.companyMaster.status == '1') {
            const subscription_master = await subscriptionPlan.findOne({
              raw: true,
              where: {
                status: 1,
                companyMasterID: user1.companyMaster.companyMasterID,
              },
            });
            if (user1.companyMaster.parentCompanyMasterID == 0) {
              if (!subscription_master) {
                return res.json({
                  status: 401,
                  message: message.usermessage.usersubscribeplan,
                  data: {},
                });
              } else {
                if (
                  subscription_master.startDate <= currDate &&
                  subscription_master.endDate > currDate
                ) {
                  if (user1.status == '1') {
                    if (bcrypt.compareSync(password, user1.password)) {
                      const token = {
                        usermasterid: user1.userMasterID,
                        userType: user1.admin,
                      };

                      const tokendata = await jwt.sign(
                        { token },
                        process.env.SECRETKEY,
                        { expiresIn: '1d' }
                      );
                      const data = {
                        token: tokendata,
                        usermasterid: user1.userMasterID,
                        userName: user1.userName,
                        userNumber: user1.userNumber,
                        email: user1.email,
                        admin: user1.admin,
                        childcompany: false,
                        companyMasterID: user1.companyMaster.companyMasterID,
                        resetpassword: user1.resetpassword,
                      };
                      return res.json({
                        status: 200,
                        message: message.usermessage.userlogin,
                        data: data,
                      });
                    } else {
                      return res.json({
                        status: 400,
                        message: message.usermessage.userwronginfo,
                        data: {},
                      });
                    }
                  } else if (user1.status == '0') {
                    return res.json({
                      status: 401,
                      message: message.usermessage.userdeactive,
                      data: {},
                    });
                  } else {
                    return res.json({
                      status: 401,
                      message: message.usermessage.userdeleted,
                      data: {},
                    });
                  }
                } else {
                  return res.json({
                    status: 401,
                    message: message.usermessage.usersubscribeplan,
                    data: {},
                  });
                }
              }
            } else {
              const subscription_master1 = await subscriptionPlan.findOne({
                raw: true,
                where: {
                  status: 1,
                  companyMasterID: user1.companyMaster.parentCompanyMasterID,
                },
              });
              if (!subscription_master1) {
                return res.json({
                  status: 401,
                  message: message.usermessage.usersubscribeplan,
                  data: {},
                });
              } else {
                if (
                  subscription_master1.startDate <= currDate &&
                  subscription_master1.endDate > currDate
                ) {
                  if (user1.status == '1') {
                    if (bcrypt.compareSync(password, user1.password)) {
                      const token = {
                        usermasterid: user1.userMasterID,
                        userType: user1.admin,
                      };

                      const tokendata = await jwt.sign(
                        { token },
                        process.env.SECRETKEY,
                        { expiresIn: '1d' }
                      );
                      const data = {
                        token: tokendata,
                        usermasterid: user1.userMasterID,
                        userName: user1.userName,
                        userNumber: user1.userNumber,
                        email: user1.email,
                        admin: user1.admin,
                        childcompany: true,
                        companyMasterID: user1.companyMaster.companyMasterID,
                        resetpassword: user1.resetpassword,
                      };
                      return res.json({
                        status: 200,
                        message: message.usermessage.userlogin,
                        data: data,
                      });
                    } else {
                      return res.json({
                        status: 400,
                        message: message.usermessage.userwronginfo,
                        data: {},
                      });
                    }
                  } else if (user1.status == '0') {
                    return res.json({
                      status: 401,
                      message: message.usermessage.userdeactive,
                      data: {},
                    });
                  } else {
                    return res.json({
                      status: 401,
                      message: message.usermessage.userdeleted,
                      data: {},
                    });
                  }
                } else {
                  return res.json({
                    status: 401,
                    message: message.usermessage.usersubscribeplan,
                    data: {},
                  });
                }
              }
            }
          } else if (user1.companyMaster.status == '0') {
            return res.json({
              status: 401,
              message: message.usermessage.companydeactive,
              data: {},
            });
          } else {
            return res.json({
              status: 401,
              message: message.usermessage.companydeleted,
              data: {},
            });
          }
        }
      }
    } catch (err) {
      return res.json({ status: 500, message: err.message, data: {} });
    }
  }
  return res.json({
    status: 501,
    message: message.usermessage.userwronginfo,
    data: {},
  });
};

exports.mobilelogin = async (req, res, next) => {
  try {
    const { phone, password, firebaseToken, uniqueID, tracking } = req.body;
    const currDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (!phone || !password)
      return res.json({
        status: 501,
        message: message.usermessage.userwronginfo,
        data: {},
      });

    const user1 = await UserMaster.findOne({
      where: {
        userNumber: phone,
        status: 1,
      },
      include: [{ model: companyMaster }, { required: false, model: UserRole }],
    });

    if (!user1)
      return res.json({
        status: 501,
        message: message.usermessage.usernotfound,
        data: {},
      });

    if (+user1.companyMaster.status == 0 || +user1.companyMaster.status == 2)
      return res.json({
        status: 401,
        message: 'Company deactivated or deleted!',
        data: {},
      });

    if (user1.admin == 2)
      return res.json({
        status: 401,
        message: 'You dont have rights for mobile Login!!',
        data: {},
      });

    const companyMasterID =
      user1.companyMaster.parentCompanyMasterID == 0
        ? user1.companyMaster.companyMasterID
        : user1.companyMaster.parentCompanyMasterID;
    const subscription_master = await subscriptionPlan.findOne({
      raw: true,
      where: {
        status: 1,
        companyMasterID: companyMasterID,
      },
    });

    if (!subscription_master)
      return res.json({
        status: 401,
        message: message.usermessage.usersubscribeplan,
        data: {},
      });

    if (
      subscription_master.startDate <= currDate &&
      subscription_master.endDate > currDate
    ) {
      if (bcrypt.compareSync(password, user1.password)) {
        const token = {
          usermasterid: user1.userMasterID,
        };

        const tokendata = await jwt.sign({ token }, process.env.SECRETKEY, {
          expiresIn: '365d',
        });
        const data = {
          token: tokendata,
          companyid: user1.companyMaster.companyMasterID,
          userid: user1.userMasterID,
          firstname: user1.firstName,
          middlename: user1.middleName ? user1.middleName : '',
          lastname: user1.lastName,
          userNumber: user1.userNumber,
          email: user1.email,
          resetpassword: user1.resetpassword,
        };
        await UserMaster.update(
          {
            firebaseToken: firebaseToken,
            uniqueID: uniqueID,
          },
          {
            where: { userMasterID: user1.userMasterID },
          }
        );

        const roleMasterID =
          user1.userRoles && user1.userRoles.length > 0
            ? user1.userRoles[0].roleMasterID
            : null;

        const userRights = await RolePermission.findAll({
          where: {
            roleMasterID: roleMasterID,
            // userMasterID: user1.userMasterID,
          },
          include: [
            {
              model: FormMaster,
              attributes: ['formName'],
              where: {
                formName: [
                  'BirthdayList',
                  'WorkAnniversaryList',
                  'Chat',
                  'HrDashboard',
                ],
              },
            },
            {
              model: operation,
              attributes: ['operationName'],
            },
          ],
        });

        if (tracking) {
          tracking.userMasterID = user1.userMasterID;
          tracking.createBy = user1.userMasterID;

          await Tracking.create(tracking);
        }
        return res.json({
          status: 200,
          message: message.usermessage.userlogin,
          data: data,
          Permission: userRights,
        });
      } else {
        return res.json({
          status: 400,
          message: message.usermessage.userwronginfo,
          data: {},
        });
      }
    }

    return res.json({
      status: 401,
      message: message.usermessage.usersubscribeplan,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.Facelogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const currDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (!phone || !password) {
      return res.json({
        status: 501,
        message: message.usermessage.userwronginfo,
        data: {},
      });
    }

    const findUserData = await UserMaster.findOne({
      where: {
        userNumber: phone,
        status: 1,
      },
      include: [{ model: companyMaster }, { required: false, model: UserRole }],
    });

    if (!findUserData) {
      return res.json({
        status: 501,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }
    if (
      +findUserData.companyMaster.status == 0 ||
      +findUserData.companyMaster.status == 2
    ) {
      return res.json({
        status: 401,
        message: 'Company deactivated or deleted!',
        data: {},
      });
    }

    const companyMasterID =
      findUserData.companyMaster.parentCompanyMasterID == 0
        ? findUserData.companyMaster.companyMasterID
        : findUserData.companyMaster.parentCompanyMasterID;

    const subscription_master = await subscriptionPlan.findOne({
      raw: true,
      where: {
        status: 1,
        companyMasterID: companyMasterID,
      },
    });

    if (!subscription_master) {
      return res.json({
        status: 401,
        message: message.usermessage.usersubscribeplan,
        data: {},
      });
    }

    if (
      subscription_master.startDate <= currDate &&
      subscription_master.endDate > currDate
    ) {
      if (bcrypt.compareSync(password, findUserData.password)) {
        const token = {
          usermasterid: findUserData.userMasterID,
        };

        const tokendata = await jwt.sign({ token }, process.env.SECRETKEY, {
          expiresIn: '365d',
        });
        const data = {
          token: tokendata,
          companyid: findUserData.companyMaster.companyMasterID,
          userid: findUserData.userMasterID,
          firstname: findUserData.firstName,
          middlename: findUserData.middleName ? findUserData.middleName : '',
          lastname: findUserData.lastName,
          userNumber: findUserData.userNumber,
          email: findUserData.email,
          resetpassword: findUserData.resetpassword,
        };

        const roleMasterID =
          findUserData.userRoles && findUserData.userRoles.length > 0
            ? findUserData.userRoles[0].roleMasterID
            : null;

        const user_right = await RolePermission.findOne({
          raw: true,
          where: {
            operationID: 4,
            roleMasterID,
            status: 1,
          },
          include: [
            {
              model: FormMaster,
              where: { formName: 'FaceAppLogin' },
              attributes: [],
            },
          ],
        });

        if (!user_right) {
          return res.json({
            status: 400,
            message: "You don't have rights to login in this application.",
            data: {},
          });
        }
        return res.json({
          status: 200,
          message: message.usermessage.userlogin,
          data: data,
        });
      } else {
        return res.json({
          status: 400,
          message: message.usermessage.userwronginfo,
          data: {},
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.changepassword = async (req, res) => {
  const { body } = req;
  try {
    const profile = await UserMaster.findOne({
      where: { userMasterID: body.userMasterID },
    });
    if (!profile) {
      return res.json({
        status: 400,
        message: message.usermessage.usernotfound,
        data: {},
      });
    } else {
      if (bcrypt.compareSync(body.password, profile.password)) {
        if (body.password != body.newpassword) {
          const salt = await bcrypt.genSalt(10);
          profile.password = bcrypt.hashSync(req.body.newpassword, salt);
          profile.save();
          return res.json({
            status: 200,
            message: message.usermessage.passwordchange,
            data: {},
          });
        } else {
          return res.json({
            status: 400,
            message: message.usermessage.oldnewsame,
            data: {},
          });
        }
      } else {
        return res.json({
          status: 400,
          message: message.usermessage.oldwrong,
          data: {},
        });
      }
    }
  } catch (err) {
    return res.json({ status: 500, message: err, data: {} });
  }
};

exports.getprofile = async (req, res, next) => {
  try {
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const user_master = await UserMaster.findOne({
      where: {
        userMasterID: req.params.id,
        status: [0, 1],
      },
      order: [['userMasterID', 'DESC']],
      include: [
        { model: companyMaster },
        {
          model: EmployeeDesignation,
          as: 'employeeDesignations',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          as: 'employeeDepartments',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          include: [{ model: Department, as: 'department' }],
        },
        {
          model: EmployeeBranch,
          as: 'employeeBranches',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date() } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          include: [{ model: BranchMaster, as: 'branchMaster' }],
        },
        {
          model: EmployeeAdress,
          as: 'userAddresses',
          where: {
            addressType: 'permanent',
            status: 1,
          },
          required: false,
          include: [{ model: CityMaster }],
        },
        {
          model: EmployeeJoiningDetails,
          as: 'employeeJoiningDetails',
          where: {
            status: 1,
          },
          required: false,
          // include: [{ model: BankMaster }],
          attributes: ['dob', 'employeeCode'],
        },
      ],
    });

    if (!user_master) {
      return res.json({
        status: 400,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }

    const photo = user_master.photo
      ? `${process.env.APIURL}uploads/user/photo/${user_master.photo}`
      : '';
    const dobDetails = user_master.employeeJoiningDetails?.[0]?.dob || '';

    const data = {
      name: user_master.displayName,
      firstName: user_master.firstName,
      lastName: user_master.lastName,
      userNumber: user_master.userNumber,
      email: user_master.email,
      dob: dobDetails,
      employeeCode: user_master.employeeJoiningDetails?.[0]?.employeeCode || '',
      profile: photo,
      isPhotoLock: user_master.isPhotoLock,
      companyName: user_master.companyMaster
        ? user_master.companyMaster.companyName
        : '',
      designation:
        user_master.employeeDesignations &&
        user_master.employeeDesignations.length > 0
          ? user_master.employeeDesignations[0].designation.designationName
          : '',
      department:
        user_master.employeeDepartments &&
        user_master.employeeDepartments.length > 0
          ? user_master.employeeDepartments[0].department.departmentName
          : '',
      branch:
        user_master.employeeBranches && user_master.employeeBranches.length > 0
          ? user_master.employeeBranches[0].branchMaster.branchName
          : '',
      address:
        user_master.userAddresses && user_master.userAddresses.length > 0
          ? {
              houseNumber: user_master.userAddresses[0].houseNumber,
              houseName: user_master.userAddresses[0].houseName,
              landmark: user_master.userAddresses[0].landmark,
              area: user_master.userAddresses[0].area,
              zipcode: user_master.userAddresses[0].zipcode,
              city: user_master.userAddresses[0].cityMaster
                ? user_master.userAddresses[0].cityMaster.cityName
                : '',
            }
          : {},
    };

    return res.json({
      status: 200,
      message: message.usermessage.getprofile,
      data: data,
    });
  } catch (err) {
    next(err);
  }
};
exports.getprofileWithCutomizeFields = async (req, res, next) => {
  try {
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const user_master = await UserMaster.findOne({
      where: {
        userMasterID: req.params.id,
        status: [0, 1],
      },
      order: [['userMasterID', 'DESC']],
      include: [
        {
          model: companyMaster,
          include: [{ required: false, model: CustomizeProfile }],
        },
        {
          model: EmployeeDesignation,
          as: 'employeeDesignations',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
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
          as: 'employeeDepartments',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(date) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          include: [{ model: Department, as: 'department' }],
        },
        {
          model: EmployeeBranch,
          as: 'employeeBranches',
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(date) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date() } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          include: [{ model: BranchMaster, as: 'branchMaster' }],
        },
        {
          model: EmployeeAdress,
          as: 'userAddresses',
          where: {
            addressType: 'permanent',
            status: 1,
          },
          required: false,
          include: [{ model: CityMaster }],
        },
        {
          model: EmployeeJoiningDetails,
          as: 'employeeJoiningDetails',
          where: {
            status: 1,
          },
          required: false,
          attributes: ['dob', 'employeeCode'],
        },
      ],
    });

    if (!user_master) {
      return res.json({
        status: 400,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }

    const findCustomizeFieldData =
      user_master.companyMaster?.customizeProfiles &&
      user_master.companyMaster?.customizeProfiles.length > 0 &&
      user_master.companyMaster?.customizeProfiles?.[0]?.fields?.length > 0
        ? user_master.companyMaster?.customizeProfiles?.[0]?.fields
        : null;

    const photo = user_master.photo
      ? `${process.env.APIURL}uploads/user/photo/${user_master.photo}`
      : '';

    const dobDetails =
      user_master.employeeJoiningDetails &&
      user_master.employeeJoiningDetails.length > 0
        ? user_master.employeeJoiningDetails[0].dob
        : '';

    let data = {};

    if (findCustomizeFieldData) {
      data = {
        name: user_master.displayName,
        firstName: user_master.firstName,
        lastName: user_master.lastName,
        userNumber: findCustomizeFieldData.includes(
          customizeProfileFields.userNumber
        )
          ? user_master.userNumber
          : '-',
        email: findCustomizeFieldData.includes(customizeProfileFields.email)
          ? user_master.email
          : '-',
        dob: findCustomizeFieldData.includes(customizeProfileFields.dateOfBirth)
          ? dobDetails
          : '-',
        profile: photo,
        isPhotoLock: user_master.isPhotoLock,
        companyName:
          findCustomizeFieldData.includes(customizeProfileFields.companyName) &&
          user_master.companyMaster
            ? user_master.companyMaster.companyName
            : '-',
        designation:
          user_master.employeeDesignations &&
          user_master.employeeDesignations.length > 0 &&
          findCustomizeFieldData.includes(customizeProfileFields.designation)
            ? user_master.employeeDesignations[0].designation.designationName
            : '-',
        department:
          user_master.employeeDepartments &&
          user_master.employeeDepartments.length > 0 &&
          findCustomizeFieldData.includes(customizeProfileFields.department)
            ? user_master.employeeDepartments[0].department.departmentName
            : '-',
        branch:
          user_master.employeeBranches &&
          user_master.employeeBranches.length > 0 &&
          findCustomizeFieldData.includes(customizeProfileFields.branchName)
            ? user_master.employeeBranches[0].branchMaster.branchName
            : '-',
        address:
          user_master.userAddresses && user_master.userAddresses.length > 0
            ? {
                houseNumber: user_master.userAddresses[0].houseNumber,
                houseName: user_master.userAddresses[0].houseName,
                landmark: user_master.userAddresses[0].landmark,
                area: user_master.userAddresses[0].area,
                zipcode: user_master.userAddresses[0].zipcode,
                city: user_master.userAddresses[0].cityMaster
                  ? user_master.userAddresses[0].cityMaster.cityName
                  : '',
              }
            : {},
        employeeCode:
          user_master.employeeJoiningDetails &&
          user_master.employeeJoiningDetails.length > 0
            ? user_master.employeeJoiningDetails?.[0]?.employeeCode
            : '',
      };
    } else {
      data = {
        name: user_master.displayName,
        firstName: user_master.firstName,
        lastName: user_master.lastName,
        userNumber: user_master.userNumber,
        email: user_master.email,
        dob: dobDetails,
        profile: photo,
        isPhotoLock: user_master.isPhotoLock,
        companyName: user_master.companyMaster
          ? user_master.companyMaster.companyName
          : '',
        designation:
          user_master.employeeDesignations &&
          user_master.employeeDesignations.length > 0
            ? user_master.employeeDesignations[0].designation.designationName
            : '',
        department:
          user_master.employeeDepartments &&
          user_master.employeeDepartments.length > 0
            ? user_master.employeeDepartments[0].department.departmentName
            : '',
        branch:
          user_master.employeeBranches &&
          user_master.employeeBranches.length > 0
            ? user_master.employeeBranches[0].branchMaster.branchName
            : '',
        address:
          user_master.userAddresses && user_master.userAddresses.length > 0
            ? {
                houseNumber: user_master.userAddresses[0].houseNumber,
                houseName: user_master.userAddresses[0].houseName,
                landmark: user_master.userAddresses[0].landmark,
                area: user_master.userAddresses[0].area,
                zipcode: user_master.userAddresses[0].zipcode,
                city: user_master.userAddresses[0].cityMaster
                  ? user_master.userAddresses[0].cityMaster.cityName
                  : '',
              }
            : {},
        employeeCode:
          user_master.employeeJoiningDetails &&
          user_master.employeeJoiningDetails.length > 0
            ? user_master.employeeJoiningDetails?.[0]?.employeeCode
            : '',
      };
    }

    return res.json({
      status: 200,
      message: message.usermessage.getprofile,
      data: data,
    });
  } catch (err) {
    next(err);
  }
};
exports.editprofile = async (req, res) => {
  try {
    let photo;
    if (req.file) {
      photo = req.file.filename;
    } else {
      photo = '';
    }
    await UserMaster.update(
      {
        photo,
        // updateBy:req.body.updateBy,
        // updateByIp:req.body.updateByIp
      },
      { where: { userMasterID: req.body.userMasterID } }
    );
    res.status(200).json({
      status: 200,
      message: message.usermessage.profileupdate,
      data: {},
    });
  } catch (err) {
    return res.json({ status: 500, message: err.message, data: {} });
  }
};

exports.forgot = async (req, res) => {
  const { mobile } = req.body;

  if (mobile) {
    try {
      const user = await UserMaster.findOne({
        where: {
          userNumber: mobile,
          status: 1,
        },
      });

      if (!user) {
        return res.json({
          status: 400,
          message: message.usermessage.usernotfound,
          data: {},
        });
      } else {
        user.passwordToken = Math.floor(1000 + Math.random() * 9000);
        await user.save();
        data = {
          reset_password_token: user.passwordToken,
          email_id: user.email,
        };
        let data1 = { otp: user.passwordToken, mobile: mobile };
        res.json({
          status: 200,
          message: message.usermessage.passwordsentmail,
          data: data1,
        });
        await sendEmailForOtp(data);
      }
    } catch (err) {
      return res.json({
        status: 500,
        message: message.usermessage.internalservererror,
        data: {},
      });
    }
  } else {
    return res.json({
      status: 500,
      message: message.usermessage.emailvalid,
      data: {},
    });
  }
};

exports.changepasswordMultipleEmp = async (req, res) => {
  try {
    let { mobile } = req.body;

    if (!mobile)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

    mobile = Array.isArray(mobile) ? mobile : [mobile];

    const salt = await bcrypt.genSalt(10);
    const newPassword = await bcrypt.hashSync(req.body.new_password, salt);

    await UserMaster.update(
      {
        password: newPassword,
        updateBy: req?.userDetails?.userMasterId,
        updateByIp: req?.userDetails?.userIpAddress,
      },
      {
        where: {
          userNumber: mobile,
          status: 1,
        },
      }
    );

    return res.json({
      status: 200,
      message: message.usermessage.passwordchange,
      data: {},
    });
  } catch (e) {
    res.json({ status: 500, message: e.message });
  }
};

exports.otpverifyandchangepassword = async (req, res) => {
  try {
    const { mobile } = req.body;
    const userExist = await UserMaster.findOne({
      where: {
        userNumber: mobile,
        status: 1,
      },
    });
    if (userExist) {
      if (bcrypt.compareSync(req.body.new_password, userExist.password)) {
        return res.json({
          status: 501,
          message: message.usermessage.oldnewsame,
          data: {},
        });
      } else {
        const salt = await bcrypt.genSalt(10);
        userExist.password = await bcrypt.hashSync(req.body.new_password, salt);
        await userExist.save();
        return res.json({
          status: 200,
          message: message.usermessage.passwordchange,
          data: {},
        });
      }
    } else {
      return res.json({
        status: 500,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }
  } catch (e) {
    res.json({ status: 500, message: e.message });
  }
};

function padTo2Digits(num) {
  return num.toString().padStart(2, '0');
}
function formatDate(date) {
  return [
    date.getFullYear(),
    padTo2Digits(date.getMonth() + 1),
    padTo2Digits(date.getDate()),
  ].join('-');
}

async function birthdate(companyid) {
  const Todaydate = await UserMaster.findAll({
    where: {
      companyMasterId: companyid,
      dob: formatDate(new Date()),
      status: 1,
    },
    attributes: [
      'userMasterID',
      'displayName',
      'userNumber',
      'photo',
      'gender',
      'dob',
      'email',
    ],
  });
  const Tommorowdate = await UserMaster.findAll({
    where: {
      companyMasterId: companyid,
      dob: formatDate(new Date(new Date().getTime() + 1000 * 60 * 60 * 24)),
      status: 1,
    },
    attributes: [
      'userMasterID',
      'displayName',
      'userNumber',
      'photo',
      'gender',
      'dob',
      'email',
    ],
  });
  const Yesterdaydate = await UserMaster.findAll({
    where: {
      companyMasterId: companyid,
      dob: formatDate(new Date(new Date().getTime() - 1000 * 60 * 60 * 24)),
      status: 1,
    },
    attributes: [
      'userMasterID',
      'displayName',
      'userNumber',
      'photo',
      'gender',
      'dob',
      'email',
    ],
  });
  return { Todaydate, Tommorowdate, Yesterdaydate };
}

exports.dashboardcheck = async (req, res, next) => {
  let { userMasterID, deviceType, appVersion, FirebaseToken, userid } =
    req.body;
  const date = asiaKolkataDateTime(new Date()).slice(0, 10);

  userMasterID = userMasterID ? userMasterID : userid;

  try {
    const user1 = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          include: [{ required: false, model: CustomizeProfile }],
        },
        {
          separate: true,
          required: false,
          model: EmployeeAttendancePolicy,
          where: {
            userMasterID: userMasterID,
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(date),
            },
            [Sequelize.Op.or]: [
              {
                endDate: { [Sequelize.Op.gte]: new Date(date) },
              },
              {
                endDate: { [Sequelize.Op.eq]: null },
              },
            ],
          },
          include: [{ model: AttendancePolicy, as: 'attendancePolicy' }],
        },
        {
          required: false,
          model: EmployeeJoiningDetails,
          attributes: ['biometricSerialNo', 'biometricCode', 'attendanceFrom'],
        },
      ],
    });

    if (!user1) {
      return res.json({
        status: 401,
        message: message.usermessage.usernotfound,
        data: {},
      });
    } else {
      if (user1.companyMaster.status == '1') {
        const empJoining =
          user1.employeeJoiningDetails &&
          user1.employeeJoiningDetails.length > 0
            ? user1.employeeJoiningDetails[0]
            : null;

        if (user1.companyMaster.parentCompanyMasterID == 0) {
          const subscription_master = await subscriptionPlan.findOne({
            raw: true,
            where: {
              status: 1,
              companyMasterID: user1.companyMaster.companyMasterID,
            },
          });
          if (!subscription_master) {
            return res.json({
              status: 401,
              message: message.usermessage.usersubscribeplan,
              data: {},
            });
          } else {
            if (
              subscription_master.startDate <= date &&
              subscription_master.endDate > date
            ) {
              if (user1.status == '1') {
                const appversion = await AppVersion.findOne({
                  where: {
                    deviceType: deviceType,
                  },
                });

                if (
                  appversion.appVersion == appVersion ||
                  appversion.appVersion == ''
                ) {
                  const trackingpermission = await UserTracking.findOne({
                    where: {
                      trackStatus: 1,
                      userMasterID: user1.userMasterID,
                    },
                  });

                  if (trackingpermission) {
                    let data = {
                      tracking: true,
                      trackingInterval: trackingpermission.trackingTime,
                      statusMonitoring: trackingpermission.statusMonitoring,
                      expensesubmittedindays:
                        user1.companyMaster.expenseDatePicker,
                      attendancepolicy:
                        user1.employeeAttendancePolicies &&
                        user1.employeeAttendancePolicies.length > 0
                          ? user1.employeeAttendancePolicies[0].attendancePolicy
                          : null,
                      biometricSerialNo: empJoining
                        ? empJoining.biometricSerialNo
                        : null,
                      biometricCode: empJoining
                        ? empJoining.biometricCode
                        : null,
                      attendanceFrom: empJoining
                        ? empJoining.attendanceFrom
                        : null,
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    };

                    if (FirebaseToken || deviceType) {
                      await UserMaster.update(
                        {
                          firebaseToken: FirebaseToken,
                          deviceType: deviceType,
                        },
                        { where: { userMasterID: userMasterID } }
                      );
                    }

                    return res.json({
                      status: 200,
                      message: message.usermessage.DashboardGet,
                      data: data,
                    });
                  } else {
                    let data = {
                      tracking: false,
                      expensesubmittedindays:
                        user1.companyMaster.expenseDatePicker,
                      attendancepolicy:
                        user1.employeeAttendancePolicies &&
                        user1.employeeAttendancePolicies.length > 0
                          ? user1.employeeAttendancePolicies[0].attendancePolicy
                          : null,
                      biometricSerialNo: empJoining
                        ? empJoining.biometricSerialNo
                        : null,
                      biometricCode: empJoining
                        ? empJoining.biometricCode
                        : null,
                      attendanceFrom: empJoining
                        ? empJoining.attendanceFrom
                        : null,
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    };

                    if (FirebaseToken || deviceType) {
                      await UserMaster.update(
                        {
                          firebaseToken: FirebaseToken,
                          deviceType: deviceType,
                        },
                        { where: { userMasterID: userMasterID } }
                      );
                    }

                    return res.json({
                      status: 200,
                      message: message.usermessage.DashboardGet,
                      data: data,
                    });
                  }
                } else {
                  return res.json({
                    status: 401,
                    message: message.usermessage.versionnotmatch,
                    data: {
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    },
                  });
                }
              } else if (user1.status == '0') {
                return res.json({
                  status: 401,
                  message: message.usermessage.userdeactive,
                  data: {},
                });
              } else {
                return res.json({
                  status: 401,
                  message: message.usermessage.userdeleted,
                  data: {},
                });
              }
            } else {
              return res.json({
                status: 401,
                message: message.usermessage.usersubscribeplan,
                data: {},
              });
            }
          }
        } else {
          const subscription_master = await subscriptionPlan.findOne({
            raw: true,
            where: {
              status: 1,
              companyMasterID: user1.companyMaster.parentCompanyMasterID,
            },
          });
          if (!subscription_master) {
            return res.json({
              status: 401,
              message: message.usermessage.usersubscribeplan,
              data: {},
            });
          } else {
            if (
              subscription_master.startDate <= date &&
              subscription_master.endDate > date
            ) {
              if (user1.status == '1') {
                const appversion = await AppVersion.findOne({
                  where: {
                    deviceType: deviceType,
                  },
                });

                if (
                  appversion.appVersion == appVersion ||
                  appversion.appVersion == ''
                ) {
                  const trackingpermission = await UserTracking.findOne({
                    where: {
                      trackStatus: 1,
                      userMasterID: user1.userMasterID,
                    },
                  });

                  if (trackingpermission) {
                    let data = {
                      tracking: true,
                      trackingInterval: trackingpermission.trackingTime,
                      statusMonitoring: trackingpermission.statusMonitoring,
                      expensesubmittedindays:
                        user1.companyMaster.expenseDatePicker,
                      attendancepolicy:
                        user1.employeeAttendancePolicies &&
                        user1.employeeAttendancePolicies.length > 0
                          ? user1.employeeAttendancePolicies[0].attendancePolicy
                          : null,
                      biometricSerialNo: empJoining
                        ? empJoining.biometricSerialNo
                        : null,
                      biometricCode: empJoining
                        ? empJoining.biometricCode
                        : null,
                      attendanceFrom: empJoining
                        ? empJoining.attendanceFrom
                        : null,
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    };

                    if (FirebaseToken || deviceType) {
                      await UserMaster.update(
                        {
                          firebaseToken: FirebaseToken,
                          deviceType: deviceType,
                        },
                        { where: { userMasterID: userMasterID } }
                      );
                    }

                    return res.json({
                      status: 200,
                      message: message.usermessage.DashboardGet,
                      data: data,
                    });
                  } else {
                    let data = {
                      tracking: false,
                      expensesubmittedindays:
                        user1.companyMaster.expenseDatePicker,
                      attendancepolicy:
                        user1.employeeAttendancePolicies &&
                        user1.employeeAttendancePolicies.length > 0
                          ? user1.employeeAttendancePolicies[0].attendancePolicy
                          : null,
                      biometricSerialNo: empJoining
                        ? empJoining.biometricSerialNo
                        : null,
                      biometricCode: empJoining
                        ? empJoining.biometricCode
                        : null,
                      attendanceFrom: empJoining
                        ? empJoining.attendanceFrom
                        : null,
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    };

                    if (FirebaseToken || deviceType) {
                      await UserMaster.update(
                        {
                          firebaseToken: FirebaseToken,
                          deviceType: deviceType,
                        },
                        { where: { userMasterID: userMasterID } }
                      );
                    }

                    return res.json({
                      status: 200,
                      message: message.usermessage.DashboardGet,
                      data: data,
                    });
                  }
                } else {
                  return res.json({
                    status: 401,
                    message: message.usermessage.versionnotmatch,
                    data: {
                      customizeProfileFields:
                        user1?.companyMaster?.customizeProfiles?.[0]?.fields ||
                        [],
                    },
                  });
                }
              } else if (user1.status == '0') {
                return res.json({
                  status: 401,
                  message: message.usermessage.userdeactive,
                  data: {},
                });
              } else {
                return res.json({
                  status: 401,
                  message: message.usermessage.userdeleted,
                  data: {},
                });
              }
            } else {
              return res.json({
                status: 401,
                message: message.usermessage.usersubscribeplan,
                data: {},
              });
            }
          }
        }
      } else if (user1.companyMaster.status == '0') {
        return res.json({
          status: 401,
          message: message.usermessage.companydeactive,
          data: {},
        });
      } else {
        return res.json({
          status: 401,
          message: message.usermessage.companydeleted,
          data: {},
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

exports.dashborad1 = async (req, res, next) => {
  try {
    var today = new Date();
    var year = today.getFullYear();
    var mes = today.getMonth() + 1;
    var dia = today.getDate();
    var fecha = year + '-' + mes + '-' + dia;
    function addQuotes(value) {
      var quotedVar = "'" + value + "'";
      return quotedVar;
    }

    const totalvisit = await Visit.count({
      where: {
        [Sequelize.Op.and]: [
          {
            assignID: req.body.userMasterID,
          },
          Sequelize.where(
            sequelize.fn('date', sequelize.col('visitDate')),
            '=',
            fecha
          ),
        ],
      },
    });

    const totalAmount = await executeQuery(
      'select SUM(UET."expenseAmount") from "userExpenseTransactions" as UET JOIN "userExpenses" as UE ON UE."userExpenseID" = UET."userExpenseID" JOIN "userMasters" as UM ON UM."userMasterID" = UE."userMasterID" where UE."userMasterID"=' +
        req.body.userMasterID +
        ' and UE."expense_date"=' +
        addQuotes(fecha) +
        ''
    );

    const newcustomer = await Customer.count({
      where: {
        [Sequelize.Op.and]: [
          {
            createBy: req.body.userMasterID,
          },
          Sequelize.where(
            sequelize.fn('date', sequelize.col('createdAt')),
            '=',
            fecha
          ),
        ],
      },
    });

    let data = [];
    data.push(
      { title: 'Total Visit', icon: 'iconsminds-embassy', value: totalvisit },
      {
        title: 'New Customer',
        icon: 'iconsminds-business-man',
        value: newcustomer,
      },
      {
        title: 'Total Expense',
        icon: 'iconsminds-money-bag',
        value: totalAmount[0].sum == null ? 0 : totalAmount[0].sum,
      }
    );
    res.json({
      status: 200,
      data: data,
    });
    // }
  } catch (err) {
    return res.json({ status: 500, message: err.message, data: {} });
  }
};

exports.checkfcm = async (req, res, next) => {
  try {
    const registrationToken =
      'e_TDumVFQISN3S6Xw3DpXx:APA91bFreMWy44YO1hSrkEwp-FAd-Z-LpNNxTx15vQpFM3pbiAqsYXDCwmIJV2qssXWcvv62uScMgMiT7H3W4tCYYnrdLlmQHZbYL7ggvu8UiRVh5mQ-43YUFiND6wmR1ysBsJvvlV90';
    const message_notification = {
      notification: {
        title: 'visit',
        body: 'your visit added successfully',
      },
      data: {
        screen: 'visit',
      },
    };

    const options = notification_options;
    if (registrationToken != null) {
      Notification.admin
        .messaging()
        .sendToDevice(registrationToken, message_notification, options)
        .then((response) => {
          res.status(200).send('Notification sent successfully');
        })
        .catch((error) => {
          console.log(error);
        });
    }
  } catch (err) {
    return res.json({ status: 500, message: err.message, data: {} });
  }
};

async function birthdate1(companyid) {
  const company_id = [];
  company_id.push(parseInt(companyid));
  let get_comp = await companyMaster.findAll({
    where: { parentCompanyMasterID: companyid, status: 1 },
  });
  for (var i = 0; i < get_comp.length; i++) {
    company_id.push(get_comp[i].companyMasterID);
  }

  let get_one_data = await UserMaster.findAll({
    where: {
      companyMasterId: {
        [Sequelize.Op.in]: company_id,
      },
      status: 1,
    },
  });

  let userIDs = [];
  let USERID = [];
  for (var i = 0; i < get_one_data.length; i++) {
    let obj = {
      userMasterID: get_one_data[i].dataValues.userMasterID,
      displayName: get_one_data[i].dataValues.displayName,
      userNumber: get_one_data[i].dataValues.userNumber,
      photo: get_one_data[i].dataValues.photo,
      gender: get_one_data[i].dataValues.gender,
      email: get_one_data[i].dataValues.email,
      dob: get_one_data[i].dataValues.dob,
    };
    userIDs.push(obj);
    USERID.push(get_one_data[i].userMasterID);
  }

  let date = new Date().toISOString().slice(4, 10);
  const Todaydate = await EmployeeJoiningDetails.findAll({
    where: {
      userMasterID: {
        [Sequelize.Op.in]: USERID,
      },

      dob: { [Sequelize.Op.iLike]: `%` + date },
      status: 1,
    },

    include: [
      {
        model: UserMaster,
        attributes: [
          'userMasterID',
          'firstName',
          'middleName',
          'lastName',
          'displayName',
          'userNumber',
          'photo',
        ],
        as: 'userMaster',
      },
    ],
  });

  return { Todaydate };
}

exports.birthday1 = async (req, res, next) => {
  try {
    let birthdaydate = await birthdate1(req.params.id);

    return res.json({
      status: 200,
      message: 'Birthday got successfully',
      data: birthdaydate.Todaydate,
    });
  } catch (err) {
    next(err);
  }
};

exports.finalcheckpermission = async (req, res) => {
  try {
    const { userMasterID } = req.body;

    const userRole = await UserRole.findOne({
      where: {
        userMasterID,
      },
    });

    if (!userRole)
      return res.status(200).json({
        status: 401,
        message: 'User Role not found!',
      });

    const forms = await FormMaster.findAll();

    const userRights = await RolePermission.findAll({
      where: {
        // userMasterID: userMasterID,
        roleMasterID: userRole.roleMasterID,
        formMasterID: forms.map((form) => form.formMasterID),
      },
      include: [
        {
          model: FormMaster,
          attributes: ['formName'],
        },
        {
          model: operation,
          attributes: ['operationName'],
        },
      ],
    });

    let formNamesToFind = forms
      .filter((form) => {
        const userRight = userRights.find(
          (userRight) => userRight.formMasterID === form.formMasterID
        );
        return userRight !== undefined;
      })
      .map((form) => ({
        formName: form.formName,
        formMasterID: form.formMasterID,
      }));

    const result = formNamesToFind.map((formData) => {
      const operationName = userRights
        .filter(
          (userRight) => userRight.formMaster.formName === formData.formName
        )
        .map((userRight) => userRight.operation.operationName);

      return {
        ...formData,
        operationName,
      };
    });

    formNamesToFind = formNamesToFind.map((form) => form.formName);

    return res.json({
      status: 200,
      message: message.usermessage.userrightget,
      master: formNamesToFind,
      data3: formNamesToFind.length,
      data: result,
      resultlength: result.length,
    });
  } catch (e) {
    res.json({ status: 500, message: e.message });
  }
};

exports.resetpassword = async (req, res) => {
  const { body } = req;
  try {
    const profile = await UserMaster.findOne({
      where: { userMasterID: body.userMasterID },
    });
    if (!profile) {
      return res.json({
        status: 400,
        message: message.usermessage.usernotfound,
        data: {},
      });
    } else {
      if (bcrypt.compareSync(body.password, profile.password)) {
        if (body.password != body.newpassword) {
          const salt = await bcrypt.genSalt(10);
          profile.password = bcrypt.hashSync(req.body.newpassword, salt);
          profile.save();

          let change_resetStatus = await UserMaster.update(
            {
              resetpassword: 0,
            },
            { where: { userMasterID: body.userMasterID } }
          );

          return res.json({
            status: 200,
            message: message.usermessage.passwordchange,
            data: {},
          });
        } else {
          return res.json({
            status: 400,
            message: 'You can not set same previous password.',
            data: {},
          });
        }
      } else {
        return res.json({
          status: 400,
          message: 'Invalid old password.',
          data: {},
        });
      }
    }
  } catch (err) {
    return res.json({ status: 500, message: err, data: {} });
  }
};

exports.birthdayAnniversaryList = async (
  isBirthday,
  parentCompanyMasterID,
  companyMasterID,
  month
) => {
  let companyId = [companyMasterID];
  if (+parentCompanyMasterID === 0) {
    const associatedCompanies = await companyMaster.findAll({
      where: { parentCompanyMasterID: companyMasterID, status: 1 },
      attributes: ['companyMasterID'],
      raw: true,
    });
    companyId = [
      ...associatedCompanies.map((company) => company.companyMasterID),
      ...[companyMasterID],
    ];
  }
  const key = isBirthday ? 'dob' : 'joiningDate';
  let query;
  if (month) {
    query = {
      [Sequelize.Op.and]: [
        {
          where: sequelize.where(
            sequelize.fn(
              'EXTRACT',
              sequelize.literal(
                `MONTH FROM "employeeJoiningDetails"."${key}"::date`
              )
            ), // Extract month from birthdate
            +month // Match against the target month
          ),
        },
        {
          [Sequelize.Op.or]: [
            { leavingDate: null },
            { leavingDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
      ],
    };
  } else {
    const currentDate = new Date();
    const currentMonthDay = getFormattedMonthDay(currentDate);

    const previousDate = new Date(currentDate);
    previousDate.setDate(currentDate.getDate() - 1);
    const previousMonthDay = getFormattedMonthDay(previousDate);

    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    const nextMonthDay = getFormattedMonthDay(nextDate);

    query = {
      [Sequelize.Op.and]: [
        {
          [Sequelize.Op.or]: [
            sequelize.where(
              sequelize.fn(
                'SUBSTRING',
                sequelize.col(`employeeJoiningDetails.${key}`),
                6,
                5
              ),
              '=',
              currentMonthDay
            ),
            sequelize.where(
              sequelize.fn(
                'SUBSTRING',
                sequelize.col(`employeeJoiningDetails.${key}`),
                6,
                5
              ),
              '=',
              previousMonthDay
            ),
            sequelize.where(
              sequelize.fn(
                'SUBSTRING',
                sequelize.col(`employeeJoiningDetails.${key}`),
                6,
                5
              ),
              '=',
              nextMonthDay
            ),
          ],
        },
        {
          [Sequelize.Op.or]: [
            { leavingDate: null },
            { leavingDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
      ],
    };
  }

  const data = await UserMaster.findAll({
    where: {
      companyMasterId: {
        [Sequelize.Op.in]: companyId,
      },
      status: 1,
    },
    raw: true,
    attributes: [
      'userMasterID',
      'firstName',
      'middleName',
      'lastName',
      'displayName',
      'userNumber',
      'photo',
      'email',
    ],
    as: 'userMaster',
    include: {
      model: EmployeeJoiningDetails,
      where: {
        status: 1,
        ...query,
      },
      raw: true,
      attributes: [key, 'employeeCode'],
    },
  });

  data.forEach((element) => {
    element.day = checkDate(
      element[`employeeJoiningDetails.${key}`],
      !isBirthday
    );
    if (isBirthday)
      element.birthdayInWord = formatDateMonthInWords(
        element[`employeeJoiningDetails.${key}`]
      );
  });
  return data;
};

/**
 * Fetches the list of all user's
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns list of users whose birthday is today, or tomorrow or was yesetrday
 */
exports.birthday = async (req, res, next) => {
  try {
    const birthdayList = await this.birthdayAnniversaryList(
      true,
      req.userDetails.parentCompanyMasterId,
      req.userDetails.companyMasterId
    );
    return res.status(statusCodes.OK).json({
      message: message.usermessage.fetchMessage('Birthdays'),
      data: birthdayList,
      status: statusCodes.OK,
    });
  } catch (err) {
    next(err);
  }
};

exports.anniversary = async (req, res, next) => {
  try {
    const anniversaryList = await this.birthdayAnniversaryList(
      false,
      req.userDetails.parentCompanyMasterId,
      req.userDetails.companyMasterId
    );
    return res.status(statusCodes.OK).json({
      message: message.usermessage.fetchMessage('Anniversaries'),
      data: anniversaryList,
      status: statusCodes.OK,
    });
  } catch (err) {
    next(err);
  }
};

exports.pageSearch = async (req, res, next) => {
  try {
    const { search } = req.query;
    const searchCondition = {};
    if (search)
      searchCondition.formName = { [Sequelize.Op.iLike]: `${search}%` };

    searchCondition.menuName = { [Sequelize.Op.ne]: null };

    const role = await UserRole.findOne({
      raw: true,
      where: {
        userMasterID: req.userDetails.userMasterId,
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            admin: {
              [Sequelize.Op.notIn]: [2, 3],
            },
          },
          attributes: [],
        },
      ],
    });

    if (!role)
      return res.status(200).json({
        status: 401,
        message: 'User Role not found!',
        data: [],
      });

    const userRights = await RolePermission.findAndCountAll({
      where: {
        // userMasterID: req.userDetails.userMasterId,
        roleMasterID: role.roleMasterID,
      },
      attributes: [],
      include: [
        {
          model: FormMaster,
          attributes: ['formName', 'path', 'menuName'],
          where: searchCondition,
          include: [
            {
              model: FormMaster,
              as: 'parent',
              attributes: ['formName'],
            },
          ],
        },
        {
          model: operation,
          where: {
            [Sequelize.Op.or]: [
              { operationName: 'Show Menu' },
              { operationName: 'View' },
            ],
          },
          attributes: [],
        },
      ],
    });

    const serachResult = userRights.rows.map((item) => {
      if (!item.formMaster.parent) {
        item.formMaster.parent = {
          formName: item.formMaster.formName,
        };
      }

      return {
        formName: item.formMaster.formName,
        path: item.formMaster.path,
        menuName: item.formMaster.menuName,
        parent: item.formMaster.parent.formName,
      };
    });

    return res.status(statusCodes.OK).json({
      message: message.usermessage.fetchMessage('Pages'),
      data: serachResult,
      count: userRights.count,
    });
  } catch (e) {
    next(e);
  }
};

exports.userLogout = async (req, res, next) => {
  try {
    const { userMasterID } = req.body;

    const firebaseToken = null;
    if (userMasterID) {
      await UserMaster.update(
        {
          firebaseToken: firebaseToken,
        },
        { where: { userMasterID: userMasterID } }
      );
    }

    return res.status(200).json({
      status: 200,
      message: 'User logout Successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.forgotpasswordOtpMARS = async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.json({
      status: 500,
      message: message.usermessage.mobileNumberValid,
    });
  }
  try {
    const user = await UserMaster.findOne({
      where: {
        userNumber: mobile,
        status: 1,
      },
    });

    if (!user) {
      return res.json({
        status: 400,
        message: message.usermessage.notFoundMessage('User'),
      });
    }
    const otpTobeSent = Math.floor(1000 + Math.random() * 9000);
    const now = new Date();
    const otpExpiry = new Date(now.getTime() + 10 * 60 * 1000);
    const params = new URLSearchParams();
    params.append('module', 'TRANS_SMS');
    params.append('apikey', process.env.MARS_FORGOT_OTP_API_KEY);
    params.append('to', mobile);
    params.append('from', 'MRSINT');
    params.append('peid', process.env.MARS_FORGOT_OTP_PEID);
    params.append('ctid', process.env.MARS_FORGOT_OTP_CTID);
    params.append('templatename', 'Forgot Password MiEye');
    params.append('var1', otpTobeSent);

    axios
      .post(process.env.MARS_FORGOT_OTP_API, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      .then((response) => {
        console.log('SMS sent successfully:', response.data);
      })
      .catch((error) => {
        console.error(
          'Error sending SMS:',
          error.response ? error.response.data : error.message
        );
      });

    user.passwordToken = otpTobeSent;
    user.passwordTokenExpiry = otpExpiry;
    await user.save();
    return res.json({
      status: 200,
      message: message.usermessage.passwordsentMobile,
      data: { mobile: mobile },
    });
  } catch (err) {
    return res.json({
      status: 500,
      message: message.usermessage.internalservererror,
      data: {},
    });
  }
};

exports.checkPasswordTokenMARS = async (req, res) => {
  const { mobile, passwordToken } = req.body;
  if (!mobile) {
    return res.json({
      status: 500,
      message: message.usermessage.mobileNumberValid,
    });
  }
  try {
    const user = await UserMaster.findOne({
      where: {
        userNumber: mobile,
        status: 1,
      },
    });

    if (!user) {
      return res.json({
        status: 400,
        message: message.usermessage.notFoundMessage('User'),
      });
    }
    let verified = false;
    let responseMessage = message.usermessage.otpinvalid;
    if (user.passwordToken == passwordToken) {
      if (
        new Date() > new Date(user.passwordTokenExpiry) ||
        !user.passwordTokenExpiry
      ) {
        responseMessage = 'Otp Expired';
      } else {
        verified = true;
        responseMessage = message.usermessage.otpVerified
        user.passwordTokenExpiry = null;
        user.passwordToken = null;
        await user.save();
      }
    } else if (!user.passwordToken) {
      responseMessage = 'Otp Expired';
    }

    return res.json({
      status: 200,
      message: responseMessage,
      data: { verified },
    });
  } catch (err) {
    return res.json({
      status: 500,
      message: message.usermessage.internalservererror,
      data: {},
    });
  }
};
