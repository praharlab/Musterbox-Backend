const Sequelize = require('sequelize');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const UserMaster = require('../models/userMaster');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const { executeQuery } = require('./common.controller');

const EmployeeEmployment = require('../models/employeeEmployeement');
const EmployeeJoining = require('../models/employeeJoiningDetails');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const companyMaster = require('../models/companyMaster');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const Department = require('../models/department');
const EmployeeDepartment = require('../models/employeeDepartment');
const Designation = require('../models/designation');
const EmployeeDesignation = require('../models/employeeDesignation');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const { FileUploadType } = require('../utils/dbUtils');
const path = require('path');
const moment = require('moment');
const { userAttributes } = require('../utils/commonVars');

/**
 * save HrLeaveBal data.
 *
 * @body {createBy} createBy user id of user who added the HrLeaveBal.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postBulkAddLeave = async (req, res, next) => {
  try {
    const leavebal = req.body;
    await sequelize.transaction(async (t) => {
      let add_data = await HrLeaveBalance.bulkCreate(leavebal, {
        returning: true,
        transaction: t,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.leavebaladd,
        data: add_data,
      });
      return add_data;
    });
  } catch (err) {
    next(err);
  }
};

/**
return all userLeave data
*/

exports.getUserLeaveBal = async (req, res, next) => {
  try {
    const userMasterID = req.params.id;
    let userleavebal1,
      leavebal = [];

    let company = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
        status: {
          [Sequelize.Op.in]: ['0', '1'],
        },
      },
    });

    let usercompany = company.companyMasterId;

    let leave_type = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: usercompany,
        Leave_Allow: 'Y',
        status: 1,
        LeaveID: {
          [Sequelize.Op.notIn]: [5, 18, 25],
        },
      },
      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
      order: [['LeaveTranId', 'ASC']],
    });

    for (var i = 0; i < leave_type.length; i++) {
      let userleavebal = await HrLeaveBalance.findOne({
        where: {
          userMasterID: userMasterID,
          LeaveTranId: leave_type[i].LeaveTranId,
          OPBal: {
            [Sequelize.Op.ne]: null,
          },
        },
      });

      if (userleavebal) {
        leavebal.push({
          LeaveBalTranId: userleavebal.LeaveBalTranId,
          LeaveTranId: userleavebal.LeaveTranId,
          userMasterID: userMasterID,
          leavename: leave_type[i].LeaveMaster.LeaveName,
          leavedesc: leave_type[i].LeaveMaster.LeaveDesc,
          leavebal: userleavebal.OPBal,
          YearMM:
            JSON.stringify(userleavebal.YearMM).slice(0, 4) +
            '-' +
            JSON.stringify(userleavebal.YearMM).slice(4),
        });
      } else {
        leavebal.push({
          LeaveTranId: leave_type[i].LeaveTranId,
          userMasterID: userMasterID,
          leavename: leave_type[i].LeaveMaster.LeaveName,
          leavedesc: leave_type[i].LeaveMaster.LeaveDesc,
          leavebal: 0,
          YearMM: '0000-00',
        });
      }
    }

    return res.status(200).json({ status: 200, data: leavebal });
  } catch (err) {
    next(err);
  }
};

/*
 *update UserLeaveBal by LeaveBalTranID Id
 */
exports.postUpdateLeaveBal = async (req, res, next) => {
  try {
    let { leaveBalanceArray, createBy, createByIp } = req.body;

    for (var i = 0; i < leaveBalanceArray.length; i++) {
      if (leaveBalanceArray[i].LeaveBalTranId == undefined) {
        await sequelize.transaction(async (t) => {
          add_data_status = await HrLeaveBalance.create(
            {
              LeaveTranId: leaveBalanceArray[i].LeaveTranId,
              userMasterID: leaveBalanceArray[i].userMasterID,
              YearMM: leaveBalanceArray[i].YearMM.replace('-', ''),
              OPBal:
                leaveBalanceArray[i].leavebal == null
                  ? 0
                  : leaveBalanceArray[i].leavebal,
              createBy: createBy,
              createByIp: createByIp,
            },
            {
              transaction: t,
            }
          );
        });
      } else {
        await sequelize.transaction(async (t) => {
          change_data_status = await HrLeaveBalance.update(
            {
              LeaveTranId: leaveBalanceArray[i].LeaveTranId,
              userMasterID: leaveBalanceArray[i].userMasterID,
              YearMM: leaveBalanceArray[i].YearMM.replace('-', ''),
              OPBal:
                leaveBalanceArray[i].leavebal == null
                  ? 0
                  : leaveBalanceArray[i].leavebal,
              updateBy: createBy,
              updateByIp: createByIp,
            },
            {
              where: { LeaveBalTranId: leaveBalanceArray[i].LeaveBalTranId },
              transaction: t,
            }
          );
        });
      }
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.leavebalupdate,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

exports.automaticAddLeaveBalance = async (req, res, next) => {
  try {
    const companyID = req.body.companyMasterID;
    const leaveID = req.body.leaveid;
    const YearMM = req.body.YearMM;
    const searchQuery = req.body.searchQuery;
    let leavebal = [],
      totalcount;

    if (
      searchQuery &&
      req.body.companyMasterID &&
      req.body.leaveid &&
      req.body.YearMM
    ) {
      let { limit, page } = await req.body;
      let offset = (page - 1) * limit;

      let leave_type = await HrLeaveTypes.findOne({
        raw: true,
        where: {
          companyMasterID: companyID,
          LeaveID: leaveID,
          status: 1,
        },
      });
      let userleavebal = [];

      if (leave_type) {
        userleavebal = await HrLeaveBalance.findAll({
          raw: true,
          where: {
            LeaveTranId: leave_type.LeaveTranId,
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$userMaster.userNumber$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            YearMM: YearMM,
            LeaveAddNew: {
              [Sequelize.Op.ne]: null,
            },
          },
          limit: limit,
          offset: offset,
          include: [{ model: UserMaster }, { model: HrLeaveTypes }],
        });

        totalcount = await HrLeaveBalance.count({
          raw: true,
          where: {
            LeaveTranId: leave_type.LeaveTranId,
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
              {
                '$userMaster.userNumber$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            YearMM: YearMM,
            LeaveAddNew: {
              [Sequelize.Op.ne]: null,
            },
          },
          include: [{ model: UserMaster }],
        });
      }

      for (var i = 0; i < userleavebal.length; i++) {
        userleavebal[i].displayName = userleavebal[i]['userMaster.displayName'];
        userleavebal[i].userNumber = userleavebal[i]['userMaster.userNumber'];
      }

      return res
        .status(200)
        .json({ status: 200, data: userleavebal, totalcount: totalcount });
    } else {
      let userDate;
      let dt = new Date(YearMM.substring(0, 4), YearMM.substring(4, 6) - 1, 1);

      let lastdate = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
      let month =
        lastdate.getMonth() + 1 > 9
          ? lastdate.getMonth() + 1
          : '0' + (lastdate.getMonth() + 1);

      userDate =
        lastdate.getFullYear() + '-' + month + '-' + lastdate.getDate();
      let firstdate = lastdate.getFullYear() + '-' + month + '-' + '01';

      let today = new Date().toISOString().slice(0, 10);
      today = today.toString();
      let YYYYMMDate = today.substring(0, 4) + today.substring(5, 7);
      if (Number(YearMM) > Number(YYYYMMDate)) {
        return res.status(200).json({
          status: 401,
          data: [],
          totalcount: 0,
          message: 'You Cannot Select Future Month',
        });
      }

      let userList = await UserMaster.findAll({
        raw: true,
        where: {
          companyMasterId: companyID,
          status: { [Sequelize.Op.ne]: 2 },
          [Sequelize.Op.or]: [
            {
              deactiveDate: { [Sequelize.Op.gt]: new Date(userDate) },
            },
            {
              deactiveDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
      });

      let leave_type = await HrLeaveTypes.findOne({
        raw: true,
        where: {
          companyMasterID: companyID,
          LeaveID: leaveID,
          status: 1,
        },
      });

      if (leave_type) {
        let currMonthBalance = leave_type.Leave_Max_Days / 12;
        currMonthBalance = currMonthBalance.toFixed(2);

        let cnt = 0;
        let userleavebal;
        for (var j = 0; j < userList.length; j++) {
          //Joining Leaving Logic
          let joiningLeaving;
          joiningLeaving = await EmployeeJoining.findOne({
            raw: true,
            where: {
              userMasterID: userList[j].userMasterID,
              status: 1,
              [Sequelize.Op.or]: [
                {
                  joiningDate: { [Sequelize.Op.lte]: new Date(userDate) },
                },
                {
                  joiningDate: { [Sequelize.Op.eq]: null },
                },
              ],
              [Sequelize.Op.or]: [
                {
                  leavingDate: { [Sequelize.Op.gte]: new Date(userDate) },
                },
                {
                  leavingDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
          });
          if (joiningLeaving) {
            let confirm;

            confirm = await executeQuery(
              `SELECT * FROM "employeeEmployeements" WHERE "userMasterID" = ` +
                userList[j].userMasterID +
                ` AND "employeement" = 'Confirm' AND "status" = 1 AND ("applicableDate"::date) <= '` +
                firstdate +
                `' AND (("endDate"::date) > '` +
                userDate +
                `' or "endDate" is NULL);`
            );

            if (confirm.length > 0) {
              cnt++;
              userleavebal = await HrLeaveBalance.findOne({
                where: {
                  userMasterID: userList[j].userMasterID,
                  LeaveTranId: leave_type.LeaveTranId,
                  YearMM: YearMM,
                  LeaveAddNew: {
                    [Sequelize.Op.ne]: null,
                  },
                },
              });

              if (userleavebal) {
                userleavebal.dataValues.displayName = userList[j].displayName;
                userleavebal.dataValues.userNumber = userList[j].userNumber;

                leavebal.push(userleavebal);
              } else {
                let add_data_status = await HrLeaveBalance.create({
                  LeaveTranId: leave_type.LeaveTranId,
                  userMasterID: userList[j].userMasterID,
                  YearMM: YearMM,
                  LeaveAddNew: currMonthBalance,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });

                add_data_status.dataValues.displayName =
                  userList[j].displayName;
                add_data_status.dataValues.userNumber = userList[j].userNumber;
                leavebal.push(add_data_status);
              }
            }
          }
        }
        totalcount = leavebal.length;
        if (req.body.page && req.body.limit) {
          const datta = leavebal;
          let page1 = Number(req.body.page);
          let limit1 = Number(req.body.limit);
          let offset1 = (page1 - 1) * limit1;
          const citrus = datta.slice(offset1, offset1 + limit1);

          leavebal = citrus;
        }
      }

      return res
        .status(200)
        .json({ status: 200, data: leavebal, totalcount: totalcount });
    }
  } catch (err) {
    next(err);
  }
};

exports.getLeavesAddedById = async (req, res, next) => {
  try {
    let get_one_data = await HrLeaveBalance.findAll({
      where: {
        userMasterID: req.params.id,
        LeaveAddNew: {
          [Sequelize.Op.ne]: null,
        },
      },
      order: [['YearMM', 'DESC']],
      include: [
        {
          model: HrLeaveTypes,
          attributes: [],
          include: [
            {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveName', 'LeaveDesc'],
            },
          ],
        },
      ],
      raw: true,
    });
    for (var i = 0; i < get_one_data.length; i++) {
      get_one_data[i].YearMM = get_one_data[i].YearMM
        ? get_one_data[i].YearMM.toString()
        : '';
      get_one_data[i].YearMM =
        get_one_data[i].YearMM.substring(0, 4) +
        '-' +
        get_one_data[i].YearMM.substring(4, 6);
    }

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.addHrLeaveBalance = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const leaveType = await HrLeaveTypes.findOne({
      where: {
        companyMasterID,
        LeaveID: 3,
        status: 1,
      },
    });

    if (!leaveType)
      return res.status(200).json({
        status: 401,
        message: 'Leave Type not found!',
      });

    const userData = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: 1,
      },
    });

    const toAddData = [];

    for (const user of userData) {
      toAddData.push({
        LeaveTranId: leaveType.LeaveTranId,
        userMasterID: user.userMasterID,
        YearMM: 202410,
        LeaveAddNew: 7,
        createBy: req.userDetails.userMasterId,
      });
    }

    // await HrLeaveBalance.bulkCreate(toAddData);

    return res.status(200).json({
      status: 200,
      data: toAddData,
      message: 'Data Added successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.exportLeaveOpeningBalance = async (req, res, next) => {
  try {
    // const {userMasterID} = req.params.id;
    let { companyMasterID, userMasterID } = await req.body;
    const condition = {};
    condition.companyMasterId = companyMasterID;
    if (userMasterID) {
      condition.userMasterID = userMasterID;
    }
    condition.status = 1;
    const order = [['displayName', 'ASC']];
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const userData = await UserMaster.findAll({
      where: condition,
      order,
      include: [
        {
          model: EmployeeJoiningDetails,
          required: true,
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
      attributes: [
        'userMasterID',
        'displayName',
        'companyMasterId',
        'userNumber',
      ],
    });

    const leave_type = await HrLeaveTypes.findAll({
      where: {
        companyMasterID: companyMasterID,
        Leave_Allow: 'Y',
        status: 1,
        LeaveID: {
          [Sequelize.Op.notIn]: [5, 18, 25],
        },
      },
      include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
      order: [['LeaveTranId', 'ASC']],
    });
    const alluserleavebalance = await HrLeaveBalance.findAll({
      where: {
        userMasterID: userMasterID,
        // LeaveTranId: leaveType.LeaveTranId,
        OPBal: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
    const leavebal = [];
    for (const user of userData) {
      const userDetails = {
        userMasterID: user.userMasterID,
        displayName: user.displayName,
        userNumber: user.userNumber,
        companyMasterId: user.companyMasterId,
        employeeCode:
          user.employeeJoiningDetails && user.employeeJoiningDetails.length > 0
            ? user.employeeJoiningDetails[0].employeeCode
            : '',
        branch:
          (user.employeeBranches && user.employeeBranches.length) > 0
            ? user.employeeBranches[0].branchMaster
              ? user.employeeBranches[0].branchMaster.branchName
              : ''
            : '',
        designation:
          (user.employeeDesignations && user.employeeDesignations.length) > 0
            ? user.employeeDesignations[0].designation
              ? user.employeeDesignations[0].designation.designationName
              : ''
            : '',
        department:
          (user.employeeDepartments && user.employeeDepartments.length) > 0
            ? user.employeeDepartments[0].department
              ? user.employeeDepartments[0].department.departmentName
              : ''
            : '',
        company: user.companyMaster.companyName,
      };

      const leaveRecords = leave_type.map((leaveType) => {
        const userLeaveBalance = alluserleavebalance.find(
          (item) =>
            item.LeaveTranId === leaveType.LeaveTranId &&
            item.userMasterID === user.userMasterID
        );
        return {
          LeaveTranId: leaveType.LeaveTranId,
          leavename: leaveType.LeaveMaster.LeaveName,
          leavebal:
            userLeaveBalance && userLeaveBalance.OPBal
              ? userLeaveBalance.OPBal
              : 0,
          YearMM:
            userLeaveBalance && userLeaveBalance.YearMM
              ? userLeaveBalance.YearMM
              : '',
        };
      });
      leavebal.push({
        userDetails,
        leaveRecords,
      });
    }

    const finalExportData = leavebal.map((e) => {
      const leaveBalances = e.leaveRecords.reduce((acc, record) => {
        acc[record.leavename] = {
          leavebal: record.leavebal || null,
          YearMM: record.YearMM || '',
        };
        return acc;
      }, {});
      return {
        // 'Company Name': e.userDetails.company,
        'Employee Code': e.userDetails.employeeCode,
        'Employee Name': e.userDetails.displayName,
        'Empoyee Number': e.userDetails.userNumber,
        Branch: e.userDetails.branch,
        Department: e.userDetails.department,
        Designation: e.userDetails.designation,
        ...leaveBalances,
      };
    });

    return await generateExcel(finalExportData, 'Leave Data', 'xlsx', res);
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
    let { companyMasterID } = await req.body;

    const rows = await readXlsxFile(filePath);
    const condition = {};
    condition.companyMasterId = companyMasterID;

    condition.status = 1;
    const order = [['displayName', 'ASC']];
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const [userData, leave_type, alluserleavebalance] = await Promise.all([
      // UserData
      UserMaster.findAll({
        where: condition,
        order,
        include: [
          {
            model: EmployeeJoiningDetails,
            required: true,
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
            attributes: ['companyMasterID', 'companyName', 'fileUploadType'],
          },
        ],
        attributes: [
          'userMasterID',
          'displayName',
          'companyMasterId',
          'userNumber',
        ],
      }),
      // leave_type
      HrLeaveTypes.findAll({
        where: {
          companyMasterID: companyMasterID,
          Leave_Allow: 'Y',
          status: 1,
          LeaveID: {
            [Sequelize.Op.ne]: 18,
          },
        },
        include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
        order: [['LeaveTranId', 'ASC']],
      }),
      // alluserleavebalance
      HrLeaveBalance.findAll({
        where: {
          OPBal: {
            [Sequelize.Op.ne]: null,
          },
        },
        include: [
          {
            model: UserMaster,
            where: condition,
          },
          {
            model: HrLeaveTypes,
            include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
            order: [['LeaveTranId', 'ASC']],
          },
        ],
      }),
    ]);
    // Skip header
    const headerRow = rows[0];
    rows.shift();
    const data = [];
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    if (
      userData.length &&
      userData[0].companyMaster.fileUploadType == FileUploadType.EMPLOYEE_CODE
    ) {
      fileUploadType = FileUploadType.EMPLOYEE_CODE;
    }

    for (const row of rows) {
      let filteredUserData;
      if (fileUploadType == FileUploadType.MOBILE_NUMBER) {
        filteredUserData = userData.find((user) => {
          return user.userNumber == row[2];
        });
      } else {
        filteredUserData = userData.find((user) => {
          return (
            row[0] &&
            user.employeeJoiningDetails.length &&
            user.employeeJoiningDetails[0].employeeCode == row[0]
          );
        });
      }
      let userDetails;
      let leaveRecords = [];
      let remarksyearMonth = '';

      headerRow.map((header, i) => {
        const splited = header.split('_');
        if (splited.length > 1) {
          const targetLeaveName = splited[0];
          const targetField = splited[1];
          const userLeaveBalance = filteredUserData
            ? alluserleavebalance.filter(
                (item) => item.userMasterID == filteredUserData.userMasterID
              )
            : [];

          const leaveType = leave_type.find(
            (e) => e.LeaveMaster.LeaveName === targetLeaveName
          );

          if (leaveType) {
            const userLeave = userLeaveBalance.find(
              (item) =>
                item.hrLeaveType.LeaveMaster.LeaveName === targetLeaveName
            );
            const leaveRecordIndex = leaveRecords.findIndex(
              (e) => e.LeaveName === targetLeaveName
            );
            if (leaveRecordIndex !== -1) {
              if (targetField == 'leavebal') {
                leaveRecords[leaveRecordIndex].leavebal = row[i] ? row[i] : '';
                row[i] ? row[i] : (remarksyearMonth = 'Enter Opening Balance');
              } else if (targetField == 'YearMM') {
                leaveRecords[leaveRecordIndex].YearMM = row[i]
                  ? JSON.stringify(row[i]).slice(0, 4) +
                    '-' +
                    JSON.stringify(row[i]).slice(4)
                  : '';
                row[i] ? row[i] : (remarksyearMonth = 'Enter Year Month');
              }
            } else {
              leaveRecords.push({
                LeaveBalTranId:
                  userLeave && userLeave.LeaveBalTranId
                    ? userLeave.LeaveBalTranId
                    : null,
                LeaveTranId: leaveType.LeaveTranId,
                LeaveName: leaveType.LeaveMaster.LeaveName,
                leavebal:
                  row[i] != null && targetField == 'leavebal' ? +row[i] : null,
                YearMM:
                  targetField == 'YearMM'
                    ? JSON.stringify(row[i]).slice(0, 4) +
                      '-' +
                      JSON.stringify(row[i]).slice(4)
                    : '',
                LeaveDesc: leaveType.LeaveMaster.LeaveDesc,
              });
            }
          }
        }
      });
      if (!filteredUserData) {
        let message;
        if (fileUploadType == FileUploadType.MOBILE_NUMBER)
          message = `User with Number ${row[2]} not found!`;
        else message = `User with Employee Code ${row[0] || ''} not found!`;

        userDetails = {
          userMasterID: '',
          displayName: '',
          userNumber: '',
          companyMasterID: '',
          employeeCode: '',
          branch: '',
          department: '',
          designation: '',
          leaveRecord: leaveRecords,
          remarks: message,
        };
      } else {
        userDetails = {
          userMasterID: filteredUserData.userMasterID,
          displayName: filteredUserData.displayName,
          userNumber: filteredUserData.userNumber,
          companyMasterID: companyMasterID,
          employeeCode:
            filteredUserData.employeeJoiningDetails &&
            filteredUserData.employeeJoiningDetails.length > 0
              ? filteredUserData.employeeJoiningDetails[0].employeeCode
              : '',
          branch:
            (filteredUserData.employeeBranches &&
              filteredUserData.employeeBranches.length) > 0
              ? filteredUserData.employeeBranches[0].branchMaster
                ? filteredUserData.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          designation:
            (filteredUserData.employeeDesignations &&
              filteredUserData.employeeDesignations.length) > 0
              ? filteredUserData.employeeDesignations[0].designation
                ? filteredUserData.employeeDesignations[0].designation
                    .designationName
                : ''
              : '',
          department:
            (filteredUserData.employeeDepartments &&
              filteredUserData.employeeDepartments.length) > 0
              ? filteredUserData.employeeDepartments[0].department
                ? filteredUserData.employeeDepartments[0].department
                    .departmentName
                : ''
              : '',
          leaveRecord: leaveRecords,
          remarks: remarksyearMonth != '' ? remarksyearMonth : '',
        };
      }

      data.push(userDetails);
    }

    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: 'Leave Opening Balance Validated SuccessFully',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addLeaveOpeningBalance = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { leaveOpeningBalanceData } = await req.body;
    const createData = [];
    const updateData = [];
    for (let i = 0; i < leaveOpeningBalanceData.length; i++) {
      for (leaveRecord of leaveOpeningBalanceData[i].leaveRecord) {
        if (leaveRecord.LeaveBalTranId == null) {
          const leaveData = {
            LeaveTranId: leaveRecord.LeaveTranId,
            userMasterID: leaveOpeningBalanceData[i].userMasterID,
            YearMM: leaveRecord.YearMM.replace('-', ''),
            OPBal: leaveRecord.leavebal == null ? 0 : leaveRecord.leavebal,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          };
          createData.push(leaveData);
        } else {
          const leaveData = {
            LeaveBalTranId: leaveRecord.LeaveBalTranId,
            LeaveTranId: leaveRecord.LeaveTranId,
            userMasterID: leaveOpeningBalanceData[i].userMasterID,
            YearMM: leaveRecord.YearMM.replace('-', ''),
            OPBal: leaveRecord.leavebal == null ? 0 : leaveRecord.leavebal,
            updateBy: req.userDetails.userMasterId,
            updateByIp: req.userDetails.userIpAddress,
          };
          updateData.push(leaveData);
        }
      }
    }
    if (createData.length > 0) {
      await HrLeaveBalance.bulkCreate(createData, transaction);
    }
    if (updateData.length > 0) {
      const updatePromises = updateData.map((data) => {
        return HrLeaveBalance.update(
          {
            LeaveTranId: data.LeaveTranId,
            userMasterID: data.userMasterID,
            YearMM: data.YearMM,
            OPBal: data.OPBal,
            updateBy: data.updateBy,
            updateByIp: data.updateByIp,
          },
          {
            where: { LeaveBalTranId: data.LeaveBalTranId },
            transaction,
          }
        );
      });

      await Promise.all(updatePromises);
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Leave Opening Balance'),
      // data: data,
    });
  } catch (error) {
    await transaction.rollback();

    next(error);
  }
};

exports.getAddedLeaveBalanceByUser = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      fromMonth,
      toMonth,
      LeaveTranId,
      exportData,
    } = await req.body;
    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['YearMM', 'DESC']];
    const condition = {};
    condition.userMasterID = userMasterID;
    if (fromMonth && toMonth) {
      condition.YearMM = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };
    }
    // HrLeaveBalance
    const { rows: HrLeaveBalanceData, count } =
      await HrLeaveBalance.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            attributes: userAttributes,
          },
          {
            model: HrLeaveTypes,
            attributes: [
              'LeaveTranId',
              'LeaveID',
              'companyMasterID',
              'Allow_On_H',
              'status',
            ],
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveID', 'LeaveName', 'LeaveDesc', 'status'],
            },
          },
          {
            required: false,
            model: UserMaster,
            as: 'createByUser',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updateByUser',
            attributes: userAttributes,
          },
        ],
      });
    const finalAddedLeaveData = HrLeaveBalanceData.map((item) => ({
      id: item.id,
      userMasterID: item.userMasterID,
      LeaveTranId: item.LeaveTranId,
      displayName: item.userMaster?.displayName,
      days: item.LeaveAddNew
        ? item.LeaveAddNew
        : item.OPBal
          ? `${item.OPBal} ( Initial Balance )`
          : '',
      YYYYMM: moment(item.YearMM, 'YYYYMM').format('MMMM-YYYY'),
      createBy: item.createByUser?.displayName,
      updateBy: item.updateByUser?.displayName || '',
      createdAt: item.createdAt
        ? moment(item.createdAt).format('DD-MM-YYYY HH:mm:ss')
        : '',
      updatedAt: item.updatedAt
        ? moment(item.updatedAt).format('DD-MM-YYYY HH:mm:ss')
        : '',
      LeaveName: item.hrLeaveType?.LeaveMaster?.LeaveName || null,
      LeaveDesc: item.hrLeaveType?.LeaveMaster?.LeaveDesc || null,
    }));
    if (exportData) {
      const finalExportData = finalAddedLeaveData.map((item) => ({
        'Employee Name': item.displayName,
        'Leave Name': item.LeaveName,
        'Month-Year': item.YYYYMM,
        Balance: item.days,
        'Create By': item.createBy,
        'Created On': item.createdAt,
        'Update By': item.updateBy || '',
        'Updated On': item.updateBy ? item.updatedAt : '',
      }));

      await generateExcel(finalExportData, 'Added Leave', 'xlsx', res);
      return;
    }
    return res
      .status(200)
      .json({ status: 200, totalCount: count, data: finalAddedLeaveData });
  } catch (err) {
    next(err);
  }
};
