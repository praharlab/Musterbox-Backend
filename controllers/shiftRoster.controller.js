const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const ShiftRoster = require("../models/shiftRoster");
const message = require("../response_message/message");
const {
  asiaKolkataDateTime,
  getDatesFromDateRange,
  getIncludeModels,
  checkHolidayNew,
  getShiftData,
  manualAttendnace_Latest,
  findDayName,
} = require("../utils/commonUtilFunctions");
const EmployeeShift = require("../models/employeeShift");
const moment = require("moment");
const UserMaster = require("../models/userMaster");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const companyMaster = require("../models/companyMaster");
const Shift = require("../models/shift");
const {
  generateExcel,
  generateExcelForShiftRoster,
  generateDemoExcelForShiftRoster,
} = require("../utils/exportData");
const weekoffHolidayTran = require("../models/weekoffHolidayTran");
const attendanceTransaction = require("../models/attendanceTransaction");
const AttendanceLogs = require("../models/attendancelogs");
const HrLeaveMonthlyTrans = require("../models/hrLeavesMonthlyTrans");
const { FileUploadType } = require("../utils/dbUtils");
const readXlsxFile = require("read-excel-file/node");
const fs = require("fs");
const path = require("path");

// add api
exports.addShiftRoster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { companyMasterID, userMasterID, fromDate, toDate } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Get All Shift
    const getAllShifts = await Shift.findAll({
      raw: true,
      where: {
        companyMasterID,
        status: 1,
      },
      attributes: ["shiftID", "shiftName", "shiftCode"],
    });

    //Get User Data
    const condition = {
      //   userMasterID: userMasterID,
      companyMasterId: companyMasterID,
      status: 1,
    };
    if (userMasterID && userMasterID.length > 0)
      condition.userMasterID = userMasterID;

    const userData = await UserMaster.findAll({
      where: condition,
      attributes: [
        "userMasterID",
        "displayName",
        "userNumber",
        "companyMasterId",
      ],
      include: [
        // Employee Designation
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

          attributes: ["designationID"],
          include: [
            {
              model: Designation,
              as: "designation",
              attributes: ["designationName"],
            },
          ],
        },
        // Employee Department
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

          attributes: ["departmentID"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["departmentName"],
            },
          ],
        },
        // Employee Branch
        {
          required: false,
          model: EmployeeBranch,
          where: {
            // ...(branchMasterID && { branchID: branchMasterID }),
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["branchID"],
          include: [
            {
              model: BranchMaster,
              as: "branchMaster",
              attributes: ["branchName"],
            },
          ],
        },
        // Employee Details
        {
          required: false,
          model: EmployeeJoiningDetails,
          attributes: ["employeeCode"],
        },
        // Company Master
        {
          required: false,
          model: companyMaster,
          attributes: ["companyMasterID", "companyName"],
        },
        // Employee Shift
        {
          required: false,
          model: EmployeeShift,
          where: {
            status: 1,
            [Sequelize.Op.or]: [
              {
                startDate: {
                  [Sequelize.Op.between]: [fromDate, toDate],
                },
              },
              {
                endDate: {
                  [Sequelize.Op.between]: [fromDate, toDate],
                },
              },
              {
                [Sequelize.Op.and]: [
                  { startDate: { [Sequelize.Op.lte]: fromDate } },
                  {
                    [Sequelize.Op.or]: [
                      {
                        endDate: {
                          [Sequelize.Op.gte]: toDate,
                        },
                      },
                      { endDate: { [Sequelize.Op.eq]: null } },
                    ],
                  },
                ],
              },
            ],
          },
        },
        // Shift Roster
        {
          required: false,
          model: ShiftRoster,
          where: {
            status: 1,
            shiftRosterDate: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
        },
        // Week-Off Holiday Trans
        {
          required: false,
          model: weekoffHolidayTran,
          where: {
            userMasterID,
            tableName: "weekoff",
            date: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "weekoffHolidayTranID",
            "date",
            "dayName",
            "yearMonth",
            "userMasterID",
          ],
        },
        // Atendance Transaction
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "userMasterID",
            "AttendanceTransID",
            "Shift",
            "AttendanceDate",
            "InDatetime",
            "OutDateTime",
          ],
        },
      ],
    });
    const rosterUserIDs = userData.map((user) => user.userMasterID);
    // Find Dates
    let datesArray = await getDatesFromDateRange(
      new Date(fromDate),
      new Date(toDate)
    );
    datesArray = datesArray.map((date) =>
      asiaKolkataDateTime(new Date(date)).slice(0, 10)
    );

    const createData = [];
    //Roster Data
    for (let user of userData) {
      if (user.employeeShifts.length > 0) {
        for (let date of datesArray) {
          const findDateWiseRoster =
            user.shiftRosters && user.shiftRosters.length > 0
              ? user.shiftRosters.find((e) => e.shiftRosterDate == date)
              : null;

          const findWeekOff =
            user.weekoffHolidayTrans && user.weekoffHolidayTrans.length > 0
              ? user.weekoffHolidayTrans.find((e) => e.date == date)
              : null;

          const findDateWiseAttendace =
            user.attendanceTransactions &&
            user.attendanceTransactions.length > 0
              ? user.attendanceTransactions.find(
                  (e) => e.AttendanceDate == date
                )
              : null;

          let addShiftID = null;
          if (!findDateWiseRoster && (!findWeekOff || findDateWiseAttendace)) {
            if (!findDateWiseAttendace && !findWeekOff) {
              const findDateWiseEmployeeShift = user.employeeShifts
                ? user.employeeShifts.find(
                    (e) =>
                      e.startDate <= date &&
                      (e.endDate >= date || e.endDate == null)
                  )
                : null;
              if (findDateWiseEmployeeShift) {
                if (findDateWiseEmployeeShift.shiftID) {
                  addShiftID = findDateWiseEmployeeShift.shiftID;
                } else if (findDateWiseEmployeeShift.shiftsID.length == 1) {
                  addShiftID = +findDateWiseEmployeeShift.shiftsID[0];
                }
              }
            } else if (findDateWiseAttendace) {
              addShiftID = findDateWiseAttendace.Shift;
            }
            if (addShiftID) {
              const create = {
                shiftRosterDate: date,
                userMasterID: user.userMasterID,
                shiftID: addShiftID,
              };
              createData.push(create);
            }
          }
        }
      }
    }

    //Create Bulk
    if (createData.length > 0) {
      await ShiftRoster.bulkCreate(createData, {
        user: req.userDetails,
        transaction,
      });
    }

    //Find Roster
    const afterAddRosterShiftData = await ShiftRoster.findAll({
      where: {
        userMasterID,
        status: 1,
        shiftRosterDate: {
          [Sequelize.Op.between]: [fromDate, toDate],
        },
      },
      transaction,
    });

    const userShiftRoster = userData.map((user) => ({
      userMasterID: user.userMasterID,
      displayName: user.displayName,
      userNumber: user.userNumber,
      emplyeeCode:
        user.employeeJoiningDetails.length > 0
          ? user.employeeJoiningDetails[0].employeeCode
          : "",
      companyName: user.companyMaster.companyName,
      branchName:
        user.employeeBranches.length > 0
          ? user.employeeBranches[0].branchMaster.branchName
          : "",
      departmentName:
        user.employeeDepartments.length > 0
          ? user.employeeDepartments[0].department.departmentName
          : "",
      designationName:
        user.employeeDesignations.length > 0
          ? user.employeeDesignations[0].designation.designationName
          : "",
      rosterData: datesArray.map((date) => {
        const roster = afterAddRosterShiftData.find(
          (roster) =>
            roster.userMasterID == user.userMasterID &&
            roster.shiftRosterDate == date
        );
        const findWeekOff =
          user.weekoffHolidayTrans && user.weekoffHolidayTrans.length > 0
            ? user.weekoffHolidayTrans.find((e) => e.date == date)
            : null;
        if (roster) {
          return {
            shiftRosterID: roster.shiftRosterID,
            userMasterID: roster.userMasterID,
            shiftID: roster.shiftID,
            shiftRosterDate: roster.shiftRosterDate,
            isWeekOff: findWeekOff ? true : false,
          };
        } else {
          return {
            shiftRosterID: null,
            userMasterID: user.userMasterID,
            shiftID: null,
            shiftRosterDate: date,
            isWeekOff: findWeekOff ? true : false,
          };
        }
      }),
    }));

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Shift Roster"),
      data: userShiftRoster,
      datesArray: datesArray,
      allshift: getAllShifts,
      rosterUserIDs: rosterUserIDs,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Update api
exports.updateShiftRoster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { updateRosterData, fromDate, toDate } = await req.body;
    const fromDate_YYYYMM =
      String(fromDate).slice(0, 4) + String(fromDate).slice(5, 7);

    const toDate_YYYYMM =
      String(toDate).slice(0, 4) + String(toDate).slice(5, 7);
    //Get User Data
    const rosterUserIDs = updateRosterData.map((e) => e.userMasterID);
    const condition = {
      userMasterID: rosterUserIDs,
      status: 1,
    };
    const userData = await UserMaster.findAll(
      {
        where: condition,
        attributes: [
          "userMasterID",
          "displayName",
          "userNumber",
          "companyMasterId",
        ],
        include: [
          // Employee Joining
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ["employeeCode"],
          },
          // Employee Shft
          {
            required: false,
            model: EmployeeShift,
            where: {
              status: 1,
              [Sequelize.Op.or]: [
                {
                  startDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  endDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  [Sequelize.Op.and]: [
                    { startDate: { [Sequelize.Op.lte]: fromDate } },
                    {
                      [Sequelize.Op.or]: [
                        {
                          endDate: {
                            [Sequelize.Op.gte]: toDate,
                          },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // AttendaceTransaction
          {
            required: false,
            model: attendanceTransaction,
            where: {
              AttendanceDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            include: [
              {
                model: AttendanceLogs,
                order: [["createdAt", "DESC"]],
              },
            ],
          },
          {
            required: false,
            model: weekoffHolidayTran,
            where: {
              tableName: "weekoff",
              date: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            attributes: [
              "weekoffHolidayTranID",
              "date",
              "dayName",
              "yearMonth",
              "userMasterID",
            ],
          },
          {
            required: false,
            model: HrLeaveMonthlyTrans,
            where: {
              AttnYearMon: {
                [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
              },
              verified: 1,
            },
          },
          {
            required: false,
            model: ShiftRoster,
            where: {
              shiftRosterDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
              status: 1,
            },
          },
        ],
      },
      { transaction }
    );
    const verifiedUser = [];

    userData.forEach((e) => {
      const verifiedData = [...e.hrLeaveMonthlyTrans];
      if (verifiedData.length > 0) verifiedUser.push(e.displayName);
    });

    if (verifiedUser.length > 0) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: `Attendance Already verified of ${verifiedUser.join(",")}`,
      });
    }
    const createData = [];
    const updateData = [];
    //Roster Data
    for (let user of updateRosterData) {
      //Find Employee Shift
      for (let roster of user.rosterData) {
        if (roster.shiftRosterID == null && roster.shiftID != null) {
          const rosterData = {
            shiftRosterDate: roster.shiftRosterDate,
            userMasterID: roster.userMasterID,
            shiftID: roster.shiftID,
          };
          createData.push(rosterData);
        } else {
          if (roster.shiftID != null) {
            const rosterData = {
              shiftRosterID: roster.shiftRosterID,
              shiftRosterDate: roster.shiftRosterDate,
              userMasterID: roster.userMasterID,
              shiftID: roster.shiftID,
            };
            updateData.push(rosterData);
          }
        }
      }
    }

    //Create Bulk
    if (createData.length > 0) {
      await ShiftRoster.bulkCreate(createData, {
        user: req.userDetails,
        transaction,
      });
    }
    // Update Bulk
    if (updateData.length > 0) {
      const updatePromises = updateData.map((data) => {
        return ShiftRoster.update(
          {
            shiftRosterDate: data.shiftRosterDate,
            userMasterID: data.userMasterID,
            shiftID: data.shiftID,
          },
          {
            where: { shiftRosterID: data.shiftRosterID },
            transaction,
          }
        );
      });

      await Promise.all(updatePromises);
    }
    const afterUserData = await UserMaster.findAll(
      {
        where: condition,
        attributes: [
          "userMasterID",
          "displayName",
          "userNumber",
          "companyMasterId",
        ],
        include: [
          // Employee Joining
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ["employeeCode"],
          },
          // Employee Shft
          {
            required: false,
            model: EmployeeShift,
            where: {
              status: 1,
              [Sequelize.Op.or]: [
                {
                  startDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  endDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  [Sequelize.Op.and]: [
                    { startDate: { [Sequelize.Op.lte]: fromDate } },
                    {
                      [Sequelize.Op.or]: [
                        {
                          endDate: {
                            [Sequelize.Op.gte]: toDate,
                          },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // AttendaceTransaction
          {
            required: false,
            model: attendanceTransaction,
            where: {
              AttendanceDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            include: [
              {
                model: AttendanceLogs,
                order: [["createdAt", "DESC"]],
              },
            ],
          },
          {
            required: false,
            model: weekoffHolidayTran,
            where: {
              tableName: "weekoff",
              date: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            attributes: [
              "weekoffHolidayTranID",
              "date",
              "dayName",
              "yearMonth",
              "userMasterID",
            ],
          },
          {
            required: false,
            model: HrLeaveMonthlyTrans,
            where: {
              AttnYearMon: {
                [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
              },
              verified: 1,
            },
          },
          {
            required: false,
            model: ShiftRoster,
            where: {
              shiftRosterDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
              status: 1,
            },
          },
        ],
        transaction,
      }
      // { transaction }
    );
    let datesArray = await getDatesFromDateRange(
      new Date(fromDate),
      new Date(toDate)
    );
    datesArray = datesArray.map((date) =>
      asiaKolkataDateTime(new Date(date)).slice(0, 10)
    );
    for (const date of datesArray) {
      const attendanceDataByDate = await getAttendanceDataByDate(
        userData,
        date,
        afterUserData
      );

      if (attendanceDataByDate.length == 0) continue;

      await manualAttendnace_Latest(
        3,
        attendanceDataByDate,
        userData[0].companyMasterId,
        req.userDetails.userMasterId,
        req.userDetails.userIpAddress,
        transaction
      );
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Shift Roster"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.listShiftRosterData = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      userMasterID,
      fromDate,
      toDate,
      exportData,
    } = await req.body;

    // Find Shift Roster
    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const condition = {
      status: 1,
      // companyMasterID: companyMasterID,
    };
    if (userMasterID && userMasterID.length > 0)
      condition.userMasterID = userMasterID;

    if (fromDate && toDate) {
      condition.shiftRosterDate = {
        [Sequelize.Op.between]: [fromDate, toDate],
      };
    }
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Find Roster Data
    const { rows: shiftRosterData, count } = await ShiftRoster.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      order: [["userMasterID", "DESC"]],
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            status: 1,
            companyMasterId: companyMasterID,
          },
          attributes: [
            "userMasterID",
            "firstName",
            "middleName",
            "lastName",
            "displayName",
            "companyMasterId",
            "email",
            "userNumber",
            "photo",
          ],
          include: [
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ["employeeCode"],
            },
            // Employee Branch
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
              attributes: ["branchID"],
              include: [
                {
                  model: BranchMaster,
                  as: "branchMaster",
                  attributes: ["branchName"],
                },
              ],
            },
            // Employee Designation
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

              attributes: ["designationID"],
              include: [
                {
                  model: Designation,
                  as: "designation",
                  attributes: ["designationName"],
                },
              ],
            },
            //Employee Department
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

              attributes: ["departmentID"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["departmentName"],
                },
              ],
            },
            // Company
            {
              model: companyMaster,
              required: true,
              attributes: ["companyMasterID", "companyName"],
            },
            // Week-Off Holiday Trans
            {
              required: false,
              model: weekoffHolidayTran,
              where: {
                userMasterID,
                tableName: "weekoff",
                date: {
                  [Sequelize.Op.between]: [fromDate, toDate],
                },
              },
              attributes: [
                "weekoffHolidayTranID",
                "date",
                "dayName",
                "yearMonth",
                "userMasterID",
              ],
            },
          ],
        },
        {
          required: true,
          model: Shift,
          where: {
            status: 1,
          },
          attributes: ["shiftID", "shiftName"],
        },
      ],
    });

    if (exportData) {
      // Find Dates
      let datesArray = await getDatesFromDateRange(
        new Date(fromDate),
        new Date(toDate)
      );

      datesArray = datesArray.map((date) => moment(date).format("DD-MM-YYYY"));
      const ShiftData = shiftRosterData.reduce((acc, record) => {
        const date = moment(record.shiftRosterDate).format("DD-MM-YYYY");
        const weekoff =
          record.userMaster &&
          record.userMaster.weekoffHolidayTrans &&
          record.userMaster.weekoffHolidayTrans.length > 0
            ? record.userMaster.weekoffHolidayTrans.find(
                (e) => record.shiftRosterDate == e.date
              )
            : null;
        const userDataObject = {
          displayName: record.userMaster.displayName,
          userMasterID: record.userMasterID,
          employeeCode:
            record.userMaster.employeeJoiningDetails.length > 0
              ? record.userMaster.employeeJoiningDetails[0].employeeCode
              : "",
          companyName: record.userMaster.companyMaster.companyName,
          branchName:
            record.userMaster.employeeBranches.length > 0
              ? record.userMaster.employeeBranches[0].branchMaster.branchName
              : "",
          departmentName:
            record.userMaster.employeeDepartments.length > 0
              ? record.userMaster.employeeDepartments[0].department
                  .departmentName
              : "",
          designationName:
            record.userMaster.employeeDesignations.length > 0
              ? record.userMaster.employeeDesignations[0].designation
                  .designationName
              : "",
          userNumber: record.userMaster.userNumber,
        };
        const userId = record.userMaster.userMasterID;
        if (!acc[userId]) {
          acc[userId] = userDataObject;
        }
        // acc[userId][date] = record.shift.shiftName;
        acc[userId][date] = weekoff
          ? `${record.shift.shiftName} / Weekoff`
          : record.shift.shiftName;
        return acc;
      }, {});

      const result = Object.keys(ShiftData).map((userId) => {
        const row = {
          "Employee Code": ShiftData[userId].employeeCode,
          "Employee Name": ShiftData[userId].displayName,
          "Employee Number": ShiftData[userId].userNumber,
          Branch: ShiftData[userId].designationName,
          Department: ShiftData[userId].departmentName,
          Designation: ShiftData[userId].designationName,
        };
        datesArray.forEach((formattedDate) => {
          row[formattedDate] = ShiftData[userId][formattedDate] || "";
        });
        return row;
      });
      return await generateExcelForShiftRoster(
        result,
        datesArray,
        "Shift-Roster",
        "xlsx",
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: shiftRosterData,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

async function getAttendanceDataByDate(users, filterDate, afterUserData) {
  const data = [];

  users.forEach((user) => {
    const { displayName, userMasterID } = user;
    const currentUserRoster =
      user && user.shiftRosters && user.shiftRosters.length > 0
        ? user.shiftRosters.find((e) => e.shiftRosterDate == filterDate)
        : null;
    const afterUser = afterUserData.find((e) => e.userMasterID == userMasterID);
    const datewiseAfterUserRoster =
      afterUser && afterUser.shiftRosters && afterUser.shiftRosters.length > 0
        ? afterUser.shiftRosters.find((e) => e.shiftRosterDate == filterDate)
        : null;

    const addCondition =
      currentUserRoster &&
      datewiseAfterUserRoster &&
      currentUserRoster.shiftID != datewiseAfterUserRoster.shiftID
        ? true
        : false;
    if (addCondition) {
      if (
        user.attendanceTransactions &&
        user.attendanceTransactions.length > 0
      ) {
        user.attendanceTransactions.forEach((transaction) => {
          const {
            AttendanceDate,
            departmentID,
            designationID,
            branchID,
            InDatetime,
            OutDateTime,
            Shift,
            LateBy,
            EarlyBy,
            Status,
            AttendanceTransID,
            attendancelogs,
          } = transaction;

          // Check if the AttendanceDate matches the filterDate
          if (AttendanceDate == filterDate) {
            const formattedInDatetime = InDatetime
              ? formatDateWithoutTimezone(InDatetime)
              : null;
            const formattedOutDatetime = OutDateTime
              ? formatDateWithoutTimezone(OutDateTime)
              : null;

            const attendanceLogData = attendancelogs.map((log) => ({
              logId: log.attendanceLogID,
              logDateTime: formatDateWithoutTimezone(log.logDateTime),
              direction: log.direction,
              isEdited: false,
              isDeleted: false,
            }));

            const attendanceData = {
              attendanceTransid: AttendanceTransID,
              attendance_date: AttendanceDate,
              Userid: userMasterID,
              displayName,
              departmentId: departmentID,
              designationId: designationID,
              branchMasterID: branchID,
              punchin: formattedInDatetime,
              punchout: formattedOutDatetime,
              Shift,
              LateBy,
              EarlyBy,
              Status,
              IN_Change: false,
              OUT_Change: false,
              Attendance_Verify: false,
              attendanceLogs: attendancelogs,
              attendanceLogData: attendanceLogData,
            };
            data.push(attendanceData);
          }
        });
      }
    }
  });

  return data;
}
function formatDateWithoutTimezone(datetime) {
  if (!datetime) return null;

  const dateObj = new Date(datetime); // Use the local date and time
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const date = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${date}T${hours}:${minutes}`;
}
function getdate(date) {
  const originalDate = new Date(date); // Parse the date string
  originalDate.setMinutes(originalDate.getMinutes() + 330); // Add 330 minutes (5 hours and 30 minutes)
  return originalDate.toISOString().slice(0, 16);
}

// Export
exports.exportDemoShiftRoster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { companyMasterID, userMasterID, fromDate, toDate } = await req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    //Get All Shift
    const getAllShifts = await Shift.findAll({
      raw: true,
      where: {
        companyMasterID,
        status: 1,
      },
      attributes: ["shiftID", "shiftName"],
    });

    // Check File Upload Type
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID: companyMasterID },
      attributes: ["fileUploadType"],
      raw: true,
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = companyData.fileUploadType;

    //Get User Data
    const condition = {
      companyMasterId: companyMasterID,
      status: 1,
    };
    if (userMasterID && userMasterID.length > 0)
      condition.userMasterID = userMasterID;
    const order = [["displayName", "ASC"]];
    let userData = await UserMaster.findAll({
      where: condition,
      attributes: [
        "userMasterID",
        "displayName",
        "userNumber",
        "companyMasterId",
      ],
      order,
      include: [
        {
          required: fileUploadType == "mobileNumber" ? false : true,
          model: EmployeeJoiningDetails,
          attributes: ["employeeCode"],
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

          attributes: ["designationID"],
          include: [
            {
              model: Designation,
              as: "designation",
              attributes: ["designationName"],
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

          attributes: ["departmentID"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["departmentName"],
            },
          ],
        },
        {
          required: false,
          model: EmployeeBranch,
          where: {
            // ...(branchMasterID && { branchID: branchMasterID }),
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: false,
          attributes: ["branchID"],
          include: [
            {
              model: BranchMaster,
              as: "branchMaster",
              attributes: ["branchName"],
            },
          ],
        },
        {
          required: false,
          model: companyMaster,
          attributes: ["companyMasterID", "companyName", "fileUploadType"],
        },
        {
          required: false,
          model: EmployeeShift,
          where: {
            status: 1,
            // [Sequelize.Op.or]: [
            //   {
            //     startDate: {
            //       [Sequelize.Op.between]: [fromDate, toDate],
            //     },
            //   },
            //   {
            //     endDate: {
            //       [Sequelize.Op.between]: [fromDate, toDate],
            //     },
            //   },
            //   {
            //     [Sequelize.Op.and]: [
            //       { startDate: { [Sequelize.Op.lte]: fromDate } },
            //       { endDate: { [Sequelize.Op.gte]: toDate } },
            //     ],
            //   },
            // ],
            [Sequelize.Op.or]: [
              {
                startDate: {
                  [Sequelize.Op.between]: [fromDate, toDate],
                },
              },
              {
                endDate: {
                  [Sequelize.Op.between]: [fromDate, toDate],
                },
              },
              {
                [Sequelize.Op.and]: [
                  { startDate: { [Sequelize.Op.lte]: fromDate } },
                  {
                    [Sequelize.Op.or]: [
                      {
                        endDate: {
                          [Sequelize.Op.gte]: toDate,
                        },
                      },
                      { endDate: { [Sequelize.Op.eq]: null } },
                    ],
                  },
                ],
              },
            ],
          },
        },
        {
          required: false,
          model: ShiftRoster,
          where: {
            status: 1,
            shiftRosterDate: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
        },
        {
          required: false,
          model: weekoffHolidayTran,
          where: {
            userMasterID,
            tableName: "weekoff",
            date: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "weekoffHolidayTranID",
            "date",
            "dayName",
            "yearMonth",
            "userMasterID",
          ],
        },
        // Atendance Transaction
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "userMasterID",
            "AttendanceTransID",
            "Shift",
            "AttendanceDate",
            "InDatetime",
            "OutDateTime",
          ],
        },
      ],
    });

    // Find Dates
    let datesArray = await getDatesFromDateRange(
      new Date(fromDate),
      new Date(toDate)
    );
    datesArray = datesArray.map((date) =>
      asiaKolkataDateTime(new Date(date)).slice(0, 10)
    );
    if (fileUploadType != "mobileNumber") {
      userData = userData.filter(
        (user) =>
          user.employeeJoiningDetails &&
          user.employeeJoiningDetails.length > 0 &&
          user.employeeJoiningDetails[0].employeeCode != null &&
          user.employeeJoiningDetails[0].employeeCode != ""
      );
    }
    const createData = [];
    //Roster Data
    for (let user of userData) {
      if (user.employeeShifts.length > 0) {
        for (let date of datesArray) {
          const findDateWiseRoster =
            user.shiftRosters && user.shiftRosters.length > 0
              ? user.shiftRosters.find((e) => e.shiftRosterDate == date)
              : null;

          const findWeekOff =
            user.weekoffHolidayTrans && user.weekoffHolidayTrans.length > 0
              ? user.weekoffHolidayTrans.find((e) => e.date == date)
              : null;

          const findDateWiseAttendace =
            user.attendanceTransactions &&
            user.attendanceTransactions.length > 0
              ? user.attendanceTransactions.find(
                  (e) => e.AttendanceDate == date
                )
              : null;

          let addShiftID = null;
          if (!findDateWiseRoster && (!findWeekOff || findDateWiseAttendace)) {
            if (!findDateWiseAttendace && !findWeekOff) {
              const findDateWiseEmployeeShift = user.employeeShifts
                ? user.employeeShifts.find(
                    (e) =>
                      e.startDate <= date &&
                      (e.endDate >= date || e.endDate == null)
                  )
                : null;
              if (findDateWiseEmployeeShift) {
                if (findDateWiseEmployeeShift.shiftID) {
                  addShiftID = findDateWiseEmployeeShift.shiftID;
                } else if (findDateWiseEmployeeShift.shiftsID.length == 1) {
                  addShiftID = +findDateWiseEmployeeShift.shiftsID[0];
                }
              }
            } else if (findDateWiseAttendace) {
              addShiftID = findDateWiseAttendace.Shift;
            }
            if (addShiftID) {
              const create = {
                shiftRosterDate: date,
                userMasterID: user.userMasterID,
                shiftID: addShiftID,
              };
              createData.push(create);
            }
          }
        }
      }
    }

    //Create Bulk
    if (createData.length > 0) {
      await ShiftRoster.bulkCreate(createData, {
        user: req.userDetails,
        transaction,
      });
    }

    const rosterUserIDs = userData.map((user) => user.userMasterID);
    //Find Roster
    const afterAddRosterShiftData = await ShiftRoster.findAll({
      where: {
        userMasterID: rosterUserIDs,
        shiftRosterDate: {
          [Sequelize.Op.between]: [fromDate, toDate],
        },
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: {
            status: 1,
            companyMasterId: companyMasterID,
          },
          attributes: [
            "userMasterID",
            "firstName",
            "middleName",
            "lastName",
            "displayName",
            "companyMasterId",
            "email",
            "userNumber",
            "photo",
          ],
          include: [
            {
              required: fileUploadType == "mobileNumber" ? false : true,
              model: EmployeeJoiningDetails,
              attributes: ["employeeCode"],
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

              attributes: ["designationID"],
              include: [
                {
                  model: Designation,
                  as: "designation",
                  attributes: ["designationName"],
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

              attributes: ["departmentID"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["departmentName"],
                },
              ],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                // ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ["branchID"],
              include: [
                {
                  model: BranchMaster,
                  as: "branchMaster",
                  attributes: ["branchName"],
                },
              ],
            },
            {
              required: false,
              model: companyMaster,
              attributes: ["companyMasterID", "companyName", "fileUploadType"],
            },
          ],
        },
        {
          required: true,
          model: Shift,
          where: {
            status: 1,
          },
          attributes: ["shiftID", "shiftName"],
        },
      ],
      transaction,
    });

    datesArray = datesArray.map((date) =>
      moment(date, "YYYY-MM-DD").format("DD-MM-YYYY")
    );
    // const ShiftData = []

    const ShiftData = afterAddRosterShiftData.reduce((acc, record) => {
      const date = moment(record.shiftRosterDate, "YYYY-MM-DD").format(
        "DD-MM-YYYY"
      );
      const userName = record.userMasterID;
      if (!acc[userName]) {
        acc[userName] = {};
      }
      acc[userName][date] = record.shift.shiftName;
      return acc;
    }, {});

    const result = userData.map((user) => {
      const row =
        fileUploadType == FileUploadType.MOBILE_NUMBER
          ? {
              displayName: user.displayName,
              branch:
                (user.employeeBranches && user.employeeBranches.length) > 0
                  ? user.employeeBranches[0].branchMaster
                    ? user.employeeBranches[0].branchMaster.branchName
                    : ""
                  : "",
              designation:
                (user.employeeDesignations &&
                  user.employeeDesignations.length) > 0
                  ? user.employeeDesignations[0].designation
                    ? user.employeeDesignations[0].designation.designationName
                    : ""
                  : "",
              department:
                (user.employeeDepartments && user.employeeDepartments.length) >
                0
                  ? user.employeeDepartments[0].department
                    ? user.employeeDepartments[0].department.departmentName
                    : ""
                  : "",
              company: user.companyMaster.companyName,
              userNumber: user.userNumber,
            }
          : {
              displayName: user.displayName,
              branch:
                (user.employeeBranches && user.employeeBranches.length) > 0
                  ? user.employeeBranches[0].branchMaster
                    ? user.employeeBranches[0].branchMaster.branchName
                    : ""
                  : "",
              designation:
                (user.employeeDesignations &&
                  user.employeeDesignations.length) > 0
                  ? user.employeeDesignations[0].designation
                    ? user.employeeDesignations[0].designation.designationName
                    : ""
                  : "",
              department:
                (user.employeeDepartments && user.employeeDepartments.length) >
                0
                  ? user.employeeDepartments[0].department
                    ? user.employeeDepartments[0].department.departmentName
                    : ""
                  : "",
              company: user.companyMaster.companyName,
              employeeCode:
                user.employeeJoiningDetails &&
                user.employeeJoiningDetails.length > 0
                  ? user.employeeJoiningDetails[0].employeeCode
                  : null,
            };
      datesArray.forEach((formattedDate) => {
        const formatDate = moment(formattedDate, "DD-MM-YYYY").format(
          "YYYY-MM-DD"
        );

        const findWeekOff =
          user.weekoffHolidayTrans && user.weekoffHolidayTrans.length > 0
            ? user.weekoffHolidayTrans.find((e) => e.date == formatDate)
            : null;

        if (ShiftData[user.userMasterID]) {
          row[formattedDate] = findWeekOff
            ? "Weekoff"
            : ShiftData[user.userMasterID][formattedDate] || "";
        } else {
          row[formattedDate] = findWeekOff ? "Weekoff" : "";
        }
      });
      return row;
    });

    const shiftNames = getAllShifts.map((shift) => shift.shiftName);
    const employeeData = userData.map((row) => {
      return {
        userMasterID: row.userMasterID,
        displayName: row.displayName,
        userNumber: row.userNumber,
        companyMasterId: row.companyMasterId,
        employeeCode:
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].employeeCode
            : "",
        branch:
          (row.employeeBranches && row.employeeBranches.length) > 0
            ? row.employeeBranches[0].branchMaster
              ? row.employeeBranches[0].branchMaster.branchName
              : ""
            : "",
        designation:
          (row.employeeDesignations && row.employeeDesignations.length) > 0
            ? row.employeeDesignations[0].designation
              ? row.employeeDesignations[0].designation.designationName
              : ""
            : "",
        department:
          (row.employeeDepartments && row.employeeDepartments.length) > 0
            ? row.employeeDepartments[0].department
              ? row.employeeDepartments[0].department.departmentName
              : ""
            : "",
        company: row.companyMaster.companyName,
      };
    });

    // Sort Data By Display Name
    const sortedResult = result.sort((a, b) => {
      if (a.displayName < b.displayName) {
        return -1;
      } else if (a.displayName > b.displayName) {
        return 1;
      } else {
        return 0;
      }
    });

    // Rest of the code to generate the Excel file using sortedResult
    await transaction.commit();
    return await generateDemoExcelForShiftRoster(
      sortedResult,
      datesArray,
      shiftNames,
      fileUploadType,
      employeeData,
      "Demo-Shift-Roster",
      "xlsx",
      res
    );
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Validate Shift Roster Data
exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: "Please upload an excel file!" });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  try {
    let { companyMasterID, userMasterID, fromDate, toDate } = await req.body;

    const rows = await readXlsxFile(filePath);
    const headerRow = rows[0];
    // Skip header
    rows.shift();
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID: companyMasterID },
      attributes: ["fileUploadType"],
      raw: true,
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE) {
      fileUploadType = companyData.fileUploadType;
    }
    const fromDate_YYYYMM =
      String(fromDate).slice(0, 4) + String(fromDate).slice(5, 7);

    const toDate_YYYYMM =
      String(toDate).slice(0, 4) + String(toDate).slice(5, 7);
    //Get All Shift
    const getAllShifts = await Shift.findAll({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      attributes: ["shiftID", "shiftName"],
    });
    const condition = {
      companyMasterId: companyMasterID,
      status: 1,
    };
    userMasterID =
      userMasterID &&
      userMasterID != "null" &&
      userMasterID != "undefined" &&
      userMasterID != ""
        ? userMasterID.split(",")
        : [];
    if (userMasterID.length > 0) {
      condition.userMasterID = userMasterID;
    }
    const userData = await UserMaster.findAll({
      where: condition,
      include: [
        // Employee Joining
        {
          model: EmployeeJoiningDetails,
          required: fileUploadType == "mobileNumber" ? false : true,
          attributes: ["employeeJoiningDetailId", "employeeCode"],
        },
        // Employee Branch
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
          attributes: ["branchID"],
          include: [
            {
              model: BranchMaster,
              as: "branchMaster",
              attributes: ["branchName"],
            },
          ],
        },
        // Employee Designation
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

          attributes: ["designationID"],
          include: [
            {
              model: Designation,
              as: "designation",
              attributes: ["designationName"],
            },
          ],
        },
        //Employee Department
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

          attributes: ["departmentID"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["departmentName"],
            },
          ],
        },
        // Company
        {
          model: companyMaster,
          required: true,
          attributes: ["companyMasterID", "companyName"],
        },
        // Shift Roster
        {
          required: false,
          model: ShiftRoster,
          where: {
            status: 1,
            shiftRosterDate: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "shiftRosterDate",
            "shiftRosterID",
            "status",
            "userMasterID",
            "shiftID",
          ],
        },
        // Hr Leave Monthly Tran
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: {
              [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
            },
            verified: 1,
          },
        },
        // WeekOff HolidayTrans
        {
          required: false,
          model: weekoffHolidayTran,
          where: {
            tableName: "weekoff",
            date: {
              [Sequelize.Op.between]: [fromDate, toDate],
            },
          },
          attributes: [
            "weekoffHolidayTranID",
            "date",
            "dayName",
            "yearMonth",
            "userMasterID",
          ],
        },
      ],
    });
    const rosterUserIDs = userData.map((user) => user.userMasterID);
    const shiftDataArray = [];
    const datesArray = [];
    for (const row of rows) {
      if (row[0] != null && row[0].trim() != "") {
        row[0] = row[0].toString();
        if (!row[0]) continue;
        let userMaster = null;
        if (fileUploadType == FileUploadType.MOBILE_NUMBER) {
          userMaster = userData.find((e) => e.userNumber === row[4]);
        } else {
          userMaster = userData.find(
            (e) => e.employeeJoiningDetails[0].employeeCode === row[4]
          );
        }

        if (!userMaster) {
          let shiftData = {
            userMasterID: "",
            displayName: "",
            userNumber:
              fileUploadType == FileUploadType.MOBILE_NUMBER ? row[4] : "",
            emplyeeCode:
              fileUploadType == FileUploadType.EMPLOYEE_CODE ? row[4] : "",
            companyName: "",
            branchName: "",
            departmentName: "",
            designationName: "",
            remarks: `User With${row[4]} Not Found`,
            rosterData: [],
            isDeleted: false,
          };
          const roster = headerRow.map((head, i) => {
            if (i > 4) {
              const date = moment(head).format("YYYY-MM-DD");
              const shiftName = row[i];
              const findShift = getAllShifts.find(
                (shift) => shift.shiftName == shiftName
              );
              return {
                shiftRosterID: null,
                userMasterID: null,
                shiftID: findShift ? findShift.shiftID : null,
                shiftRosterDate: date,
              };
            }
          });
          shiftData.rosterData = roster;
          shiftDataArray.push(shiftData);
          continue;
        }
        let shiftData = {
          userMasterID: userMaster.userMasterID,
          displayName: userMaster.displayName,
          userNumber: userMaster.userNumber,
          emplyeeCode:
            userMaster.employeeJoiningDetails.length > 0
              ? userMaster.employeeJoiningDetails[0].employeeCode
              : "",
          companyName: userMaster.companyMaster.companyName,
          branchName:
            userMaster.employeeBranches.length > 0
              ? userMaster.employeeBranches[0].branchMaster.branchName
              : "",
          departmentName:
            userMaster.employeeDepartments.length > 0
              ? userMaster.employeeDepartments[0].department.departmentName
              : "",
          designationName:
            userMaster.employeeDesignations.length > 0
              ? userMaster.employeeDesignations[0].designation.designationName
              : "",
          rosterData: [],
          remarks: "",
          isDeleted: false,
        };

        const rosterData =
          userMaster.shiftRosters && userMaster.shiftRosters.length > 0
            ? userMaster.shiftRosters
            : [];
        const rosterArray = [];
        headerRow.map((head, i) => {
          if (i > 4) {
            const date = moment(head, "DD-MM-YYYY").format("YYYY-MM-DD");
            const shiftName = row[i];
            const findShift = getAllShifts.find(
              (shift) => shift.shiftName == shiftName
            );
            const findDateExist =
              datesArray.length > 0 ? datesArray.find((e) => e == date) : null;
            if (!findDateExist) {
              datesArray.push(date);
            }
            const findWeekOff =
              userMaster.weekoffHolidayTrans &&
              userMaster.weekoffHolidayTrans.length > 0
                ? userMaster.weekoffHolidayTrans.find((e) => e.date == date)
                : null;
            if (
              !findWeekOff &&
              !findShift &&
              shiftName != null &&
              shiftName != "" &&
              shiftName != "Weekoff"
            ) {
              shiftData.remarks = `Shift With Name - ${shiftName} Not Found`;
            }
            const roster =
              rosterData.length > 0
                ? rosterData.find((roster) => roster.shiftRosterDate == date)
                : null;

            if (roster) {
              rosterArray.push({
                shiftRosterID: roster.shiftRosterID,
                userMasterID: userMaster.userMasterID,
                shiftID: findShift ? findShift.shiftID : null,
                shiftRosterDate: date,
                isWeekOff: shiftName == "Weekoff" ? true : false,
                weekoffHolidayTranID: findWeekOff
                  ? +findWeekOff.weekoffHolidayTranID
                  : null,
              });
            } else {
              rosterArray.push({
                shiftRosterID: null,
                userMasterID: userMaster.userMasterID,
                shiftID: findShift ? findShift.shiftID : null,
                shiftRosterDate: date,
                isWeekOff: shiftName == "Weekoff" ? true : false,
                weekoffHolidayTranID: findWeekOff
                  ? +findWeekOff.weekoffHolidayTranID
                  : null,
              });
            }
          }
        });
        shiftData.rosterData = rosterArray;
        const verifiedAttendance =
          userMaster.hrLeaveMonthlyTrans &&
          userMaster.hrLeaveMonthlyTrans.length > 0
            ? userMaster.hrLeaveMonthlyTrans
            : [];

        if (verifiedAttendance.length > 0) {
          shiftData.remarks = "Attendance Is Already Verified";
        }
        shiftDataArray.push(shiftData);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: "Shift Roster Validate successfully.",
      data: shiftDataArray,
      datesArray: datesArray,
      allshift: getAllShifts,
      rosterUserIDs: rosterUserIDs,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateShiftRoster = async (req, res, next) => {
  try {
    const { updateRosterData, fromDate, toDate, getAllShifts } = req.body;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const fromDate_YYYYMM =
      String(fromDate).slice(0, 4) + String(fromDate).slice(5, 7);

    const toDate_YYYYMM =
      String(toDate).slice(0, 4) + String(toDate).slice(5, 7);
    const rosterUserIDs = updateRosterData.map((e) => e.userMasterID);
    //Get User Data
    const condition = {
      userMasterID: rosterUserIDs,
      status: 1,
    };
    const userData = await UserMaster.findAll({
      where: condition,
      attributes: [
        "userMasterID",
        "displayName",
        "userNumber",
        "companyMasterId",
      ],
      include: [
        // Employee Joining
        {
          model: EmployeeJoiningDetails,
          required: false,
          attributes: ["employeeJoiningDetailId", "employeeCode"],
        },
        // Employee Branch
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
          attributes: ["branchID"],
          include: [
            {
              model: BranchMaster,
              as: "branchMaster",
              attributes: ["branchName"],
            },
          ],
        },
        // Employee Designation
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

          attributes: ["designationID"],
          include: [
            {
              model: Designation,
              as: "designation",
              attributes: ["designationName"],
            },
          ],
        },
        //Employee Department
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

          attributes: ["departmentID"],
          include: [
            {
              model: Department,
              as: "department",
              attributes: ["departmentName"],
            },
          ],
        },
        // Company
        {
          model: companyMaster,
          required: true,
          attributes: ["companyMasterID", "companyName"],
        },
        // Shift Roster
        {
          required: false,
          model: ShiftRoster,
          status: 1,
          attributes: [
            "shiftRosterDate",
            "shiftRosterID",
            "status",
            "userMasterID",
            "shiftID",
          ],
        },
        // Hr Leave Monthly Tran
        {
          required: false,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: {
              [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
            },
            verified: 1,
          },
        },
      ],
    });

    let datesArray = await getDatesFromDateRange(
      new Date(fromDate),
      new Date(toDate)
    );
    datesArray = datesArray.map((date) =>
      asiaKolkataDateTime(new Date(date)).slice(0, 10)
    );

    const shiftDataArray = [];
    for (const user of updateRosterData) {
      // IF USer Not Found
      if (!user.userMasterID) {
        let shiftData = {
          userMasterID: "",
          displayName: "",
          userNumber: user.userNumber,
          emplyeeCode: user.emplyeeCode,
          companyName: "",
          branchName: "",
          departmentName: "",
          designationName: "",
          remarks:
            user.userNumber && user.userNumber != "" && user.userNumber != null
              ? `User With${user.userNumber} Not Found`
              : `User With${user.emplyeeCode} Not Found`,
          rosterData: user.rosterData,
          isDeleted: false,
        };
        shiftDataArray.push(shiftData);
        continue;
      }

      const userMaster = userData.find(
        (e) => e.userMasterID == user.userMasterID
      );
      let shiftData = {
        userMasterID: userMaster.userMasterID,
        displayName: userMaster.displayName,
        userNumber: userMaster.userNumber,
        emplyeeCode:
          userMaster.employeeJoiningDetails.length > 0
            ? userMaster.employeeJoiningDetails[0].employeeCode
            : "",
        companyName: userMaster.companyMaster.companyName,
        branchName:
          userMaster.employeeBranches.length > 0
            ? userMaster.employeeBranches[0].branchMaster.branchName
            : "",
        departmentName:
          userMaster.employeeDepartments.length > 0
            ? userMaster.employeeDepartments[0].department.departmentName
            : "",
        designationName:
          userMaster.employeeDesignations.length > 0
            ? userMaster.employeeDesignations[0].designation.designationName
            : "",
        rosterData: user.rosterData,
        remarks: "",
        isDeleted: false,
      };
      const verifiedAttendance =
        userMaster.hrLeaveMonthlyTrans &&
        userMaster.hrLeaveMonthlyTrans.length > 0
          ? userMaster.hrLeaveMonthlyTrans
          : [];
      if (verifiedAttendance.length > 0) {
        shiftData.remarks = "Attendance Is Already Verified";
      }
      shiftDataArray.push(shiftData);
    }
    return res.status(200).json({
      status: 200,
      message: "Shift Roster Re-Validate successfully.",
      data: shiftDataArray,
      datesArray: datesArray,
      allshift: getAllShifts,
      rosterUserIDs: rosterUserIDs,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateShiftRoster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { updateRosterData, fromDate, toDate } = await req.body;
    const fromDate_YYYYMM =
      String(fromDate).slice(0, 4) + String(fromDate).slice(5, 7);

    const toDate_YYYYMM =
      String(toDate).slice(0, 4) + String(toDate).slice(5, 7);
    //Get User Data
    const rosterUserIDs = updateRosterData.map((e) => e.userMasterID);
    const condition = {
      userMasterID: rosterUserIDs,
      status: 1,
    };
    const userData = await UserMaster.findAll(
      {
        where: condition,
        attributes: [
          'userMasterID',
          'displayName',
          'userNumber',
          'companyMasterId',
        ],
        include: [
          // Employee Joining
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
          // Employee Shft
          {
            required: false,
            model: EmployeeShift,
            where: {
              status: 1,
              [Sequelize.Op.or]: [
                {
                  startDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  endDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  [Sequelize.Op.and]: [
                    { startDate: { [Sequelize.Op.lte]: fromDate } },
                    {
                      [Sequelize.Op.or]: [
                        {
                          endDate: {
                            [Sequelize.Op.gte]: toDate,
                          },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // AttendaceTransaction
          {
            required: false,
            model: attendanceTransaction,
            where: {
              AttendanceDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            include: [
              {
                model: AttendanceLogs,
                order: [['createdAt', 'DESC']],
              },
            ],
          },
          {
            required: false,
            model: weekoffHolidayTran,
            where: {
              tableName: 'weekoff',
              date: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            attributes: [
              'weekoffHolidayTranID',
              'date',
              'dayName',
              'yearMonth',
              'userMasterID',
            ],
          },
          {
            required: false,
            model: HrLeaveMonthlyTrans,
            where: {
              AttnYearMon: {
                [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
              },
              verified: 1,
            },
          },
          {
            required: false,
            model: ShiftRoster,
            where: {
              shiftRosterDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
              status: 1,
            },
          },
        ],
      },
      { transaction }
    );
    // const verifiedUser = [];

    // userData.forEach((e) => {
    //   const verifiedData = [...e.hrLeaveMonthlyTrans];
    //   if (verifiedData.length > 0) verifiedUser.push(e.displayName);
    // });

    // if (verifiedUser.length > 0) {
    //   await transaction.rollback();
    //   return res.status(200).json({
    //     status: 401,
    //     message: `Attendance Already verified of ${verifiedUser.join(',')}`,
    //   });
    // }
    let createData = [];
    let createWeekOff = [];
    let updateData = [];
    let destroyWeekOff = [];
    //Roster Data
    for (let user of updateRosterData) {
      const finduser =
        userData && userData.length > 0
          ? userData.find((e) => e.userMasterID == user.userMasterID)
          : null;
      //Find Employee Shift
      for (let roster of user.rosterData) {
        if (roster.shiftRosterID == null && roster.shiftID != null) {
          const rosterData = {
            shiftRosterDate: roster.shiftRosterDate,
            userMasterID: roster.userMasterID,
            shiftID: roster.shiftID,
          };
          createData.push(rosterData);
        } else {
          if (roster.shiftID != null) {
            const rosterData = {
              shiftRosterID: roster.shiftRosterID,
              shiftRosterDate: roster.shiftRosterDate,
              userMasterID: roster.userMasterID,
              shiftID: roster.shiftID,
            };
            updateData.push(rosterData);
          }
        }

        if (roster.isWeekOff && !roster.weekoffHolidayTranID && finduser) {
          const weekOffData = {
            companyMasterID: +finduser.companyMasterId,
            userMasterID: user.userMasterID,
            yearMonth: moment(roster.shiftRosterDate, 'YYYY-MM-DD').format(
              'YYYYMM'
            ),
            date: roster.shiftRosterDate,
            dayName: findDayName(roster.shiftRosterDate),
            value: 1,
            tableName: 'weekoff',
            WHDayType: 'FD'
          };
          createWeekOff.push(weekOffData);
        }
        if (!roster.isWeekOff && roster.weekoffHolidayTranID) {
          const weekOffData = {
            weekoffHolidayTranID: +roster.weekoffHolidayTranID,
            companyMasterID: +user.companyMasterId,
            userMasterID: +user.userMasterID,
            yearMonth: moment(roster.shiftRosterDate, 'YYYY-MM-DD').format(
              'YYYYMM'
            ),
            date: roster.shiftRosterDate,
            dayName: findDayName(roster.shiftRosterDate),
            value: 1,
            tableName: 'weekoff',
          };
          destroyWeekOff.push(weekOffData);
        }
      }
    }
    const promiseArray = [];
    //Create Bulk
    if (createData.length > 0) {
      promiseArray.push(
        ShiftRoster.bulkCreate(createData, {
          user: req.userDetails,
          transaction,
        })
      );
    }

    // Create Weekoff
    if (createWeekOff.length > 0) {
      promiseArray.push(
        weekoffHolidayTran.bulkCreate(createWeekOff, {
          transaction,
        })
      );
    }

    await Promise.all(promiseArray);
    createData = [];
    createWeekOff = [];
    // Update Bulk
    if (updateData.length > 0) {
      const updateDataChunks = [];
      for (let i = 0; i < updateData.length; i += 50) {
        updateDataChunks.push(updateData.slice(i, i + 50));
      }

      for (let j = 0; j < updateDataChunks.length; j++) {
        const updatePromise = [];
        updateDataChunks[j].forEach((data) =>
          updatePromise.push(
            ShiftRoster.update(
              {
                shiftRosterDate: data.shiftRosterDate,
                userMasterID: data.userMasterID,
                shiftID: data.shiftID,
              },
              {
                where: { shiftRosterID: data.shiftRosterID },
                transaction,
              }
            )
          )
        );
        await Promise.all(updatePromise);
      }
      updateData = [];
    }


    // Destroy Weekoff
    if (destroyWeekOff.length > 0) {
      const destroyWeekOffChunks = [];
      for (let i = 0; i < destroyWeekOff.length; i += 50) {
        destroyWeekOffChunks.push(destroyWeekOff.slice(i, i + 50));
      }

      for (let j = 0; j < destroyWeekOffChunks.length; j++) {
        const destroyPromise = [];
        destroyWeekOffChunks[j].forEach((data) =>
          destroyPromise.push(
            weekoffHolidayTran.destroy({
              where: {
                userMasterID: data.userMasterID,
                date: data.date,
                weekoffHolidayTranID: data.weekoffHolidayTranID,
              },
              transaction,
            })
          )
        );
        await Promise.all(destroyPromise);
      }

      destroyWeekOff = [];
    }

    const afterUserData = await UserMaster.findAll(
      {
        where: condition,
        attributes: [
          'userMasterID',
          'displayName',
          'userNumber',
          'companyMasterId',
        ],
        include: [
          // Employee Joining
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
          // Employee Shft
          {
            separate: true,
            required: false,
            model: EmployeeShift,
            where: {
              status: 1,
              [Sequelize.Op.or]: [
                {
                  startDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  endDate: {
                    [Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                {
                  [Sequelize.Op.and]: [
                    { startDate: { [Sequelize.Op.lte]: fromDate } },
                    {
                      [Sequelize.Op.or]: [
                        {
                          endDate: {
                            [Sequelize.Op.gte]: toDate,
                          },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          // AttendaceTransaction
          {
            separate: true,
            required: false,
            model: attendanceTransaction,
            where: {
              AttendanceDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            include: [
              {
                separate: true,
                model: AttendanceLogs,
                order: [['createdAt', 'DESC']],
              },
            ],
          },
          {
            separate: true,
            required: false,
            model: weekoffHolidayTran,
            where: {
              tableName: 'weekoff',
              date: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
            attributes: [
              'weekoffHolidayTranID',
              'date',
              'dayName',
              'yearMonth',
              'userMasterID',
            ],
          },
          {
            separate: true,
            required: false,
            model: HrLeaveMonthlyTrans,
            where: {
              AttnYearMon: {
                [Sequelize.Op.between]: [fromDate_YYYYMM, toDate_YYYYMM],
              },
              verified: 1,
            },
          },
          {
            separate: true,
            required: false,
            model: ShiftRoster,
            where: {
              shiftRosterDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
              status: 1,
            },
          },
        ],
        transaction,
      }
      // { transaction }
    );


    let datesArray = await getDatesFromDateRange(
      new Date(fromDate),
      new Date(toDate)
    );

    datesArray = datesArray.map((date) =>
      asiaKolkataDateTime(new Date(date)).slice(0, 10)
    );
    for (const date of datesArray) {
      const attendanceDataByDate = await getAttendanceDataByDate(
        userData,
        date,
        afterUserData
      );

      if (attendanceDataByDate.length == 0) continue;

      await manualAttendnace_Latest(
        3,
        attendanceDataByDate,
        userData[0].companyMasterId,
        req.userDetails.userMasterId,
        req.userDetails.userIpAddress,
        transaction
      );
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Shift Roster'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
