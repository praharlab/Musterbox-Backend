const EmployeeShortLeavePolicy = require("../models/employeeShortLeavePolicy");
const {
  getemployeeLeavePolicy,
  accessibleUsers,
  asiaKolkataDateTime,
} = require("../utils/commonUtilFunctions");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const UserMaster = require("../models/userMaster");
const SalaryPolicy = require("../models/salaryPolicy");
const EmployeeSalaryPolicy = require("../models/employeeSalaryPolicy");
const ShortLeave = require("../models/shortLeave");
const UserShortLeave = require("../models/userShortLeave");
const { userAttributes } = require("../utils/commonVars");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const HrLeaveMonthlyTrans = require("../models/hrLeavesMonthlyTrans");
const attendanceTransaction = require("../models/attendanceTransaction");
const Shift = require("../models/shift");
const message = require("../response_message/message");
const { executeQuery } = require("./common.controller");

exports.addData = async (req, res, next) => {
  try {
    const { userMasterID, shortLeavePolicyID, month } = req.body;

    const arrayToAddData = [];

    const [allSalaryPolicy, allEmployeeLeavePolicyPolicy] = await Promise.all([
      EmployeeSalaryPolicy.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
          status: 1,
          startDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [
          {
            model: SalaryPolicy,
            as: "salaryPolicy", // Alias
          },
        ],
      }),
      EmployeeShortLeavePolicy.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
          status: 1,
        },
      }),
    ]);

    await sequelize.transaction(async (t) => {
      for (const userId of userMasterID) {
        const active_salary_policy = allSalaryPolicy.find(
          (e) => e.userMasterID == userId
        );
        let tempDate = "01";
        let finalDate = "";

        if (
          active_salary_policy &&
          active_salary_policy["salaryPolicy.salaryCycleDate"]
        ) {
          tempDate = active_salary_policy["salaryPolicy.salaryCycleDate"]
            .toString()
            .padStart(2, "0");
        }
        // if month is past month
        if (Number(month) == 0) {
          finalDate = new Date();
          finalDate.setMonth(finalDate.getMonth() - 1, Number(tempDate));
          finalDate = new Date(finalDate).toISOString().slice(0, 10);
        }
        // current month
        else if (Number(month) == 1) {
          finalDate =
            new Date().getFullYear() +
            "-" +
            (new Date().getMonth() + 1).toString().padStart(2, "0") +
            "-" +
            tempDate;
        } else {
          let year, month;
          if ((new Date().getMonth() + 2).toString().padStart(2, "0") > 12) {
            year = new Date().getFullYear() + 1;
            month = (new Date().getMonth() - 10).toString().padStart(2, "0");
          } else {
            year = new Date().getFullYear();
            month = (new Date().getMonth() + 2).toString().padStart(2, "0");
          }

          finalDate = year + "-" + month + "-" + tempDate;
        }

        let applicableDate1 = new Date(finalDate);

        // find leave policy if already add on the same date
        const data = allEmployeeLeavePolicyPolicy.find((e) => {
          return (
            e.userMasterID == userId &&
            new Date(e.applicableDate).getTime() == applicableDate1.getTime()
          );
        });

        if (!data) {
          const get_one_data = allEmployeeLeavePolicyPolicy.filter(
            (e) => e.userMasterID == userId
          );

          if (get_one_data.length > 0) {
            const startdates = [];
            for (let i = 0; i < get_one_data.length; i++) {
              startdates.push(new Date(get_one_data[i].applicableDate));
            }

            const dateArr = startdates.sort((a, b) => a - b);
            const nearestPastDate = (dateArr, date) => {
              const pastArr = dateArr.filter((n) => n <= date);
              return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
            };

            const nearestFutureDate = (dateArr, date) => {
              const futArr = dateArr.filter((n) => n >= date);
              return futArr.length > 0 ? futArr[0] : null;
            };

            if (nearestPastDate(dateArr, new Date(applicableDate1)) != null) {
              await EmployeeShortLeavePolicy.update(
                {
                  endDate: new Date(
                    new Date(applicableDate1).getTime() - 86400000
                  ),
                  updateBy: req.userDetails.userMasterId,
                  updateByIp: req.userDetails.userIpAddress,
                },
                {
                  where: {
                    applicableDate: nearestPastDate(
                      dateArr,
                      new Date(applicableDate1)
                    ),
                    userMasterID: userId,
                  },
                  transaction: t,
                }
              );
            }

            if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
              arrayToAddData.push({
                userMasterID: userId,
                shortLeavePolicyID,
                applicableDate: applicableDate1,
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(applicableDate1)
                  ).getTime() - 86400000,
              });
            } else {
              arrayToAddData.push({
                userMasterID: userId,
                shortLeavePolicyID,
                applicableDate: applicableDate1,
              });
            }
          } else {
            arrayToAddData.push({
              userMasterID: userId,
              shortLeavePolicyID,
              applicableDate: applicableDate1,
            });
          }
        } else {
          await EmployeeShortLeavePolicy.update(
            {
              shortLeavePolicyID,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: { id: data.id },
              transaction: t,
            }
          );
        }
      }
      await EmployeeShortLeavePolicy.bulkCreate(arrayToAddData, {
        user: req.userDetails,
        transaction: t,
        individualHooks: true,
      });
    });

    return res.status(200).json({
      status: 200,
      message: "Employee Short Leave Policy Added Successfully.",
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmpLeavePolicyByUserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeShortLeavePolicy.findAll({
      raw: true,
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [["applicableDate", "ASC"]],
      include: [
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
      ],
    });

    if (get_one_data.length == 0) {
      //no logic require to execute
    } else if (get_one_data.length == 1) {
      if (
        new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].leavePolicyStatus = "deactive";
      } else {
        get_one_data[0].leavePolicyStatus = "active";
      }
    } else {
      let startdates = [];
      for (let j = 0; j < get_one_data.length; j++) {
        startdates.push(new Date(get_one_data[j].applicableDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };
      const past = nearestPastDate(dateArr, new Date())
        .toISOString()
        .slice(0, 10);

      for (let i = 0; i < get_one_data.length; i++) {
        let D1 = new Date(get_one_data[i].applicableDate)
          .toISOString()
          .slice(0, 10);
        let D2;
        if (get_one_data[i].endDate == null) {
          D2 = null;
        } else {
          D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
        }

        let D3 = new Date().toISOString().slice(0, 10);

        if (D3 >= D1 && D3 <= D2) {
          get_one_data[i].leavePolicyStatus = "active";
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].leavePolicyStatus = "active";
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].leavePolicyStatus = "active";
          } else {
            get_one_data[i].leavePolicyStatus = "deactive";
          }
        } else if (D3 == D1) {
          get_one_data[i].leavePolicyStatus = "active";
        } else {
          get_one_data[i].leavePolicyStatus = "deactive";
        }
      }
    }

    for (let item of get_one_data) {
      const leavePolicyData = await ShortLeave.findAll({
        raw: true,
        where: {
          id: item.shortLeavePolicyID,
        },
        include: [
          {
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
      });

      const leavePolicyName = leavePolicyData.map((e) => {
        return {
          shortLeaveName: e.shortLeaveName,
          shortLeavePolicyID: e.id,
          createdByUserName: e['createdByUserDetails.displayName'],
          createdByUserId: e['createdByUserDetails.userMasterID'],
          updatedByUserName: e['updatedByUserDetails.displayName'],
          updatedByUserId: e['updatedByUserDetails.userMasterID'],
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,

        };
      });

      item.leavePolicy = leavePolicyName;
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getEmpShortLeavePolicyByCompany = async (req, res, next) => {
  try {
    const { page, limit, search, companyMasterID } = req.body;

    const condition = {};

    if (search)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: "%" + search + "%" } },
        { userNumber: { [Sequelize.Op.iLike]: "%" + search + "%" } },
      ];

    if (companyMasterID)
      condition.companyMasterId =
        req.userDetails.accessibleCompanies.length > 0
          ? req.userDetails.accessibleCompanies
          : req.userDetails.companyMasterId;

    condition.status = 1;

    const paginatecondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const userData = await UserMaster.findAndCountAll({
      where: condition,
      ...paginatecondition,
      ...accessibleUsers(req.userDetails, false),
      include: [
        {
          model: EmployeeShortLeavePolicy,
          required: false,
          include: [{ model: ShortLeave, attributes: ["shortLeaveName"] }],
        },
      ],
      order: [["displayName", "ASC"]],
      attributes: [
        "displayName",
        "userNumber",
        "photo",
        "firstName",
        "lastName",
      ],
    });

    const user = userData.rows;

    for (let i = 0; i < user.length; i++) {
      const get_one_data = user[i].employeeShortLeavePolicies;

      if (get_one_data.length == 0) {
        //no logic require to execute
      } else if (get_one_data.length == 1) {
        if (
          new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].dataValues.leavePolicyStatus = "deactive";
          get_one_data[0].dataValues.leavePolicyName =
            get_one_data[0].shortLeave?.shortLeaveName;
        } else {
          get_one_data[0].dataValues.leavePolicyStatus = "active";
          get_one_data[0].dataValues.leavePolicyName =
            get_one_data[0].shortLeave?.shortLeaveName;
        }
      } else {
        let startdates = [];
        for (let j = 0; j < get_one_data.length; j++) {
          startdates.push(new Date(get_one_data[j].applicableDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);
        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };
        const past = nearestPastDate(dateArr, new Date())
          .toISOString()
          .slice(0, 10);

        for (let k = 0; k < get_one_data.length; k++) {
          let D1 = new Date(get_one_data[k].applicableDate)
            .toISOString()
            .slice(0, 10);
          let D2;
          if (get_one_data[k].endDate == null) {
            D2 = null;
          } else {
            D2 = new Date(get_one_data[k].endDate).toISOString().slice(0, 10);
          }

          let D3 = new Date().toISOString().slice(0, 10);

          if (D3 >= D1 && D3 <= D2) {
            get_one_data[k].dataValues.leavePolicyStatus = "active";
          } else if (D2 == null && D1 <= D3) {
            get_one_data[k].dataValues.leavePolicyStatus = "active";
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[k].dataValues.leavePolicyStatus = "active";
            } else {
              get_one_data[k].dataValues.leavePolicyStatus = "deactive";
            }
          } else if (D3 == D1) {
            get_one_data[k].dataValues.leavePolicyStatus = "active";
          } else {
            get_one_data[k].dataValues.leavePolicyStatus = "deactive";
          }

          get_one_data[k].dataValues.leavePolicyName =
            get_one_data[k].shortLeave?.shortLeaveName;
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: user,
      totalcount: userData.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.listUserShortLeaveForCancelShortLeave = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const condition = {};
    if (userMasterID && userMasterID.length > 0) {
      condition.userMasterID = userMasterID;
    }
    condition.authorizationStatus = 3;
    const [rows, hrleaveData] = await Promise.all([
      UserShortLeave.findAll({
        where: condition,
        order: [["date", "DESC"]],
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
              status: 1,
            },
            attributes: userAttributes,
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
                model: EmployeeJoiningDetails,
                attributes: ["employeeCode"],
              },
            ],
          },
        ],
      }),

      HrLeaveMonthlyTrans.findAll({
        where: {
          userMasterID: userMasterID,
          verified: 1,
        },
        attributes: ["monthstartdate", "monthenddate", "userMasterID"],
        group: ["monthstartdate", "monthenddate", "userMasterID"],
      }),
    ]);

    const finalData = [];

    rows.forEach((e) => {
      const userMasterID = e.userMasterID;
      const verifiedData = hrleaveData.filter(
        (v) => v.userMasterID == userMasterID
      );

      const isDateInRange = verifiedData.some((range) => {
        const startDate = new Date(range.monthstartdate);
        const endDate = new Date(range.monthenddate);
        const checkDate = new Date(e.date);

        return checkDate >= startDate && checkDate <= endDate;
      });

      if (!isDateInRange) finalData.push(e);
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: finalData.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelShortLeave = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userShortLeaveId, cancelRemarks } = req.body;
    const findShortLeave = await UserShortLeave.findOne({
      where: {
        userShortLeaveId: userShortLeaveId,
      },
      include: [
        {
          model: attendanceTransaction,
          include: [
            {
              model: Shift,
            },
          ],
        },
      ],
    });

    if (!findShortLeave) {
      await transaction.rollback();
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Short Leave"),
      });
    }
    const workingMinutes = findShortLeave.attendanceTransaction?.roundOffMinutes
      ? findShortLeave.attendanceTransaction.roundOffMinutes
      : findShortLeave.attendanceTransaction?.InHrs || 0;

    const total_Shift_Grace =
      +workingMinutes +
      +findShortLeave.attendanceTransaction?.shift?.shiftGrace;

      const shiftId = findShortLeave.attendanceTransaction?.Shift;

    const dayname = new Date(findShortLeave.date).toLocaleString("en-us", {
      weekday: "long",
    });

    if(shiftId){
      let fulldayhalfday = await executeQuery(
        "select * from public.MS_Fun_FullDayHalfDayCalculation(" +
        shiftId +
          "," +
          "'" +
          dayname +
          "'" +
          "," +
          total_Shift_Grace +
          ")"
      );
  
      await attendanceTransaction.update(
        {
          fulldayhalfday: Number(fulldayhalfday[0].fulldayhalfday),
        },
        {
          where: { AttendanceTransID: +findShortLeave.AttendanceTransID },
          transaction,
        }
      );
    }

   
    findShortLeave.authorizationStatus = 5;
    findShortLeave.cancelRemarks = cancelRemarks;

    await findShortLeave.save({
      user: req.userDetails,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.cancelMessage("Short Leave"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
