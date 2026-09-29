const Sequelize = require("sequelize");
const UserMaster = require("../models/userMaster");
const EmployeeWeekOff = require("../models/employeeWeekOff");
const logger = require("../config/logger");
const message = require("../response_message/message");
const sequelize = require("../config/database");
const SalaryPolicy = require("../models/employeeSalaryPolicy");
const Salary_policy = require("../models/salaryPolicy");
const hrLeavesMonthlyTrans = require("../models/hrLeavesMonthlyTrans");
const { executeQuery } = require("./common.controller");

const {
  userDetails,
  add_WeekOffHoliday_With_Transaction,
} = require("../utils/commonUtilFunctions");
const weekOffPolicy = require("../models/weekOffPolicy");
const companyMaster = require("../models/companyMaster");
const { accessibleUsers } = require("../utils/commonUtilFunctions");
const { userAttributes } = require("../utils/commonVars");

/**
 * save employee week_off data.
 *
 * @body {createBy} createBy user id of user who added the employee week_off.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddEmployeeWeekOff = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      weekOffPolicyID,
      applicableDate,
      createBy,
      createByIp,
    } = await req.body;

    let finalEndDate = null;
    let active_salary_policy;
    active_salary_policy = await SalaryPolicy.findOne({
      raw: true,
      where: {
        userMasterID: Number(userMasterID),
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
          model: Salary_policy,
          as: "salaryPolicy",
        },
      ],
      transaction,
    });

    let tempDate = "";
    let finalDate = "";

    if (active_salary_policy) {
      if (active_salary_policy["salaryPolicy.salaryCycleDate"]) {
        tempDate = active_salary_policy["salaryPolicy.salaryCycleDate"]
          .toString()
          .padStart(2, "0");
      } else {
        tempDate = "01";
      }
    } else {
      tempDate = "01";
    }

    if (Number(applicableDate) == 0) {
      let YYYYMM = Number(
        new Date().getFullYear() +
          new Date().getMonth().toString().padStart(2, "0")
      );
      let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          AttnYearMon: YYYYMM,
          verified: 1,
        },
        transaction,
      });

      if (checkAttendanceVerification) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message:
            "You cannot assign weekpolicy for the selected month because attendance already verified.",
          data: {},
        });
      }
      finalDate = new Date();
      finalDate.setMonth(finalDate.getMonth() - 1, Number(tempDate));
      new Date(finalDate).toISOString().slice(0, 10);

      // new Date().getFullYear() +
      // '-' +
      // new Date().getMonth().toString().padStart(2, '0') +
      // '-' +
      // tempDate;
    } else if (Number(applicableDate) == 1) {
      let YYYYMM = Number(
        new Date().getFullYear() +
          (new Date().getMonth() + 1).toString().padStart(2, "0")
      );
      let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          AttnYearMon: YYYYMM,
          verified: 1,
        },
        transaction,
      });

      if (checkAttendanceVerification) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message:
            "You cannot assign weekpolicy for the selected month because attendance already verified.",
          data: {},
        });
      }

      finalDate =
        new Date().getFullYear() +
        "-" +
        (new Date().getMonth() + 1).toString().padStart(2, "0") +
        "-" +
        tempDate;
    } else {
      finalDate =
        new Date().getFullYear() +
        "-" +
        (new Date().getMonth() + 2).toString().padStart(2, "0") +
        "-" +
        tempDate;
    }

    let applicableDate1 = new Date(finalDate);
    let data = await EmployeeWeekOff.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
        applicableDate: applicableDate1,
        status: 1,
      },
      transaction,
    });

    if (!data) {
      let get_one_data = await EmployeeWeekOff.findAll({
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        transaction,
      });

      if (get_one_data.length > 0) {
        startdates = [];
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
          let date_change = await EmployeeWeekOff.update(
            {
              endDate: new Date(new Date(applicableDate1).getTime() - 86400000),
            },
            {
              where: {
                applicableDate: nearestPastDate(
                  dateArr,
                  new Date(applicableDate1)
                ),
                userMasterID: userMasterID,
              },
            },
            { transaction }
          );
        }
        if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
          let insert_db_status = await EmployeeWeekOff.create(
            {
              userMasterID: userMasterID,
              weekOffPolicyID,
              applicableDate: applicableDate1,
              endDate:
                nearestFutureDate(
                  dateArr,
                  new Date(applicableDate1)
                ).getTime() - 86400000,
              createBy,
              createByIp,
            },
            { transaction }
          );
          finalEndDate =
            nearestFutureDate(dateArr, new Date(applicableDate1)).getTime() -
            86400000;
        } else {
          let insert_db_status = await EmployeeWeekOff.create(
            {
              userMasterID: userMasterID,
              weekOffPolicyID,
              applicableDate: applicableDate1,
              createBy,
              createByIp,
            },
            { transaction }
          );
        }
      } else {
        let insert_db_status = await EmployeeWeekOff.create(
          {
            userMasterID: userMasterID,
            weekOffPolicyID,
            applicableDate: applicableDate1,
            createBy,
            createByIp,
          },
          { transaction }
        );
      }
    } else {
      finalEndDate = data.endDate;
      let update_Status = await EmployeeWeekOff.update(
        {
          weekOffPolicyID: weekOffPolicyID,
          updateBy: createBy,
          updateByIp: createByIp,
        },
        {
          where: { employeeWeekOffID: data.employeeWeekOffID },
        },
        { transaction }
      );
    }

    const userDetail = await userDetails(userMasterID);
    if (userDetail)
      await add_WeekOffHoliday_With_Transaction(
        userDetail.companyMasterId,
        [userMasterID],
        new Date(applicableDate1).toISOString().slice(0, 10),
        weekOffPolicyID,
        null,
        false,
        finalEndDate,
        transaction
      );

    await transaction.commit();
    return res
      .status(200)
      .json({ status: 200, message: "Policy assigned Successfully", data: {} });
  } catch (err) {
    await transaction.rollback();
    next(err.message);
  }
};

/**
 return all employee week_off data
 */

exports.getAllEmployeeWeekOffData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_week_off, count } = await EmployeeWeekOff.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      ...paginationQuery,
      order: [["applicableDate", "ASC"]],
      include: [
        {
          model: UserMaster,
          as: "employee",
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: weekOffPolicy, as: "weekoff" },
      ],
    });

    res
      .status(200)
      .json({ status: 200, data: employee_week_off, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeWeekOff id
 *
 * @param {id} employeeWeekOffID  to fetch employee week_off
 */

exports.getEmployeeWeekOffById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeWeekOff.findOne({
      where: {
        employeeWeekOffID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },

      include: [{ all: true, nested: true }],
    });
    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch employee week_off
 */

exports.getEmployeeWeekOffByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeWeekOff.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [["applicableDate", "ASC"]],
      include: [
        {
          model: UserMaster,
          as: "employee",
        },
        {
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          model: weekOffPolicy,
          as: "weekoff",
          // include: [
          //   {
          //     model: UserMaster,
          //     as: 'createdByUserDetails',
          //     attributes: userAttributes,
          //   },
          //   {
          //     model: UserMaster,
          //     as: 'updatedByUserDetails',
          //     attributes: userAttributes,
          //   },
          // ],
        },
      ],
    });
    if (get_one_data.length == 0) {
    } else if (get_one_data.length == 1) {
      if (
        new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.weekoffpolicystatus = "deactive";
      } else {
        get_one_data[0].dataValues.weekoffpolicystatus = "active";
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
        if (D3 == D1) {
          get_one_data[i].dataValues.weekoffpolicystatus = "active";
        } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
          get_one_data[i].dataValues.weekoffpolicystatus = "active";
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].dataValues.weekoffpolicystatus = "active";
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].dataValues.weekoffpolicystatus = "active";
          } else {
            get_one_data[i].dataValues.weekoffpolicystatus = "deactive";
          }
        } else {
          get_one_data[i].dataValues.weekoffpolicystatus = "deactive";
        }
      }
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

/**
 * update data
 *
 * @param {id} employeeWeekOffID  to update id
 */
exports.postUpdateEmployeeWeekOff = async (req, res, next) => {
  try {
    let {
      employeeWeekOffID,
      userMasterID,
      weekOffPolicyID,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await EmployeeWeekOff.findOne({
      where: {
        userMasterID: userMasterID,
        employeeWeekOffID: { [Sequelize.Op.notIn]: [employeeWeekOffID] },
        applicableDate: applicableDate,
      },
    });
    if (!data) {
      let get_one_data = await EmployeeWeekOff.findAll({
        where: {
          userMasterID: userMasterID,
          employeeWeekOffID: { [Sequelize.Op.notIn]: [employeeWeekOffID] },
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        startdates = [];
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
        if (nearestPastDate(dateArr, new Date(applicableDate)) != null) {
          let date_change = await EmployeeWeekOff.update(
            {
              endDate: new Date(new Date(applicableDate).getTime() - 86400000),
            },
            {
              where: {
                applicableDate: nearestPastDate(
                  dateArr,
                  new Date(applicableDate)
                ),
                userMasterID: userMasterID,
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(applicableDate)) != null) {
          let insert_db_status = await EmployeeWeekOff.update(
            {
              userMasterID,
              weekOffPolicyID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeWeekOffID: employeeWeekOffID,
              },
            }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeeweekoffupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeWeekOff.update(
              {
                userMasterID,
                weekOffPolicyID,
                applicableDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeWeekOffID: employeeWeekOffID,
                },
              },
              { transaction: t }
            );
            res.status(200).json({
              status: 200,
              message: message.usermessage.employeeweekoffupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeWeekOff.update(
            {
              userMasterID,
              weekOffPolicyID,
              applicableDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeWeekOffID: employeeWeekOffID,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeeweekoffupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: message.usermessage.employeeattendancepolicydate,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} employeeWeekOffID  to update status of employee week_off
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeWeekOffID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == "1") {
        delete_status = await EmployeeWeekOff.update(
          {
            status: "1",
          },
          {
            where: { employeeWeekOffID: employeeWeekOffID, status: ["1", "0"] },
            transaction: t,
          }
        );
      } else {
        delete_status = await EmployeeWeekOff.update(
          {
            status: "0",
          },
          {
            where: { employeeWeekOffID: employeeWeekOffID, status: ["1", "0"] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.employeeweekoffdelete,
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

/**
 * delete by i
 *
 * @param {id} employeeWeekOffID  to delete id
 */

exports.postDeleteEmployeeWeekOffById = async (req, res, next) => {
  try {
    let { employeeWeekOffID, userMasterID } = await req.body;

    let get_current_weekoff_data = await EmployeeWeekOff.findOne({
      where: {
        employeeWeekOffID: employeeWeekOffID,
      },
    });

    let end;
    if (get_current_weekoff_data.endDate) {
      end = new Date(get_current_weekoff_data.endDate);
    } else {
      end = new Date();
    }

    let start = new Date(get_current_weekoff_data.applicableDate);

    let Finalresult = [];
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const yearMonth = currentDate.toISOString().slice(0, 7).replace(/-/g, "");
      Finalresult.push(yearMonth);

      currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
      currentDate.setUTCDate(1);
    }

    if (Finalresult.length > 0) {
      Finalresult = Finalresult.join(",");
      let checkAttendanceVerification = await executeQuery(
        `SELECT DISTINCT "AttnYearMon" from "hrLeaveMonthlyTrans" where "userMasterID"=` +
          get_current_weekoff_data.userMasterID +
          ` and verified = 1 and "AttnYearMon" in (` +
          Finalresult +
          `)`
      );


      if (checkAttendanceVerification.length > 0) {
        let months = "";
        for (let i = 0; i < checkAttendanceVerification.length; i++) {
          months =
            months +
            checkAttendanceVerification[i].AttnYearMon.toString().substring(
              0,
              4
            ) +
            "-" +
            checkAttendanceVerification[i].AttnYearMon.toString().substring(
              4,
              6
            ) +
            ",";
        }
        months = months.slice(0, months.length - 1);
        return res.status(200).json({
          status: 401,
          message:
            "You cannot delete weekoff policy because attendance already verified for months " +
            months,
          data: {},
        });
      }
    }

    let get_one_data = await EmployeeWeekOff.findAll({
      where: {
        userMasterID: userMasterID,
        employeeWeekOffID: { [Sequelize.Op.notIn]: [employeeWeekOffID] },
        status: 1,
      },
    });
    if (get_one_data.length > 0) {
      let startdates = [];
      for (let i = 0; i < get_one_data.length; i++) {
        startdates.push(new Date(get_one_data[i].applicableDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      let get_previous_data = await EmployeeWeekOff.findOne({
        where: {
          employeeWeekOffID: employeeWeekOffID,
        },
      });

      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };

      const nearestFutureDate = (dateArr, date) => {
        const futArr = dateArr.filter((n) => n >= date);
        return futArr.length > 0 ? futArr[0] : null;
      };

      if (
        nearestPastDate(dateArr, new Date(get_previous_data.applicableDate)) !=
        null
      ) {
        if (
          nearestFutureDate(
            dateArr,
            new Date(get_previous_data.applicableDate)
          ) != null
        ) {
          let date_change = await EmployeeWeekOff.update(
            {
              endDate:
                nearestFutureDate(
                  dateArr,
                  new Date(get_previous_data.applicableDate)
                ).getTime() - 86400000,
            },
            {
              where: {
                applicableDate: nearestPastDate(
                  dateArr,
                  new Date(get_previous_data.applicableDate)
                ),
                userMasterID: userMasterID,
              },
            }
          );
        } else {
          let date_change = await EmployeeWeekOff.update(
            {
              endDate: null,
            },
            {
              where: {
                applicableDate: nearestPastDate(
                  dateArr,
                  new Date(get_previous_data.applicableDate)
                ),
                userMasterID: userMasterID,
              },
            }
          );
        }
      }
    }
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await EmployeeWeekOff.update(
        {
          status: 2,
        },
        {
          where: {
            employeeWeekOffID: employeeWeekOffID,
          },
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.employeeweekoffdelete,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} employeeWeekOffID  to change status of employee designation
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date();
    let get_data = await EmployeeWeekOff.findAll({
      attributes: ["userMasterID"],
      where: { applicableDate: today },
    });
    let users = [];
    get_data.forEach((user) => {
      users.push(user.userMasterID);
    });

    let result = await sequelize.transaction(async (t) => {
      let week_off_active = await EmployeeWeekOff.update(
        {
          status: 1,
        },
        {
          where: {
            applicableDate: today,
            userMasterID: {
              [Sequelize.Op.in]: users,
            },
          },
          transaction: t,
        }
      );

      let deactive_prev = await EmployeeWeekOff.update(
        {
          status: 0,
          endDate: today,
        },
        {
          where: {
            userMasterID: {
              [Sequelize.Op.in]: users,
            },
            applicableDate: {
              [Sequelize.Op.ne]: today,
            },
          },
          transaction: t,
        }
      );


      return week_off_active;
    });
  } catch (err) {
    console.log(err);
  }
};

exports.getEmployeeWeekoff = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;

    req.userDetails.accessibleCompanies = req.body.companyMasterID;

    let company_contact = await UserMaster.findAll({
      raw: true,
      ...accessibleUsers(req.userDetails, false),
      where: { status: 1, companyMasterId: req.body.companyMasterID },
      [Sequelize.Op.or]: [
        { displayName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { userNumber: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        sequelize.where(
          sequelize.cast(sequelize.col("userMaster.userMasterID"), "varchar"),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ],
    });
    for (let i = 0; i < company_contact.length; i++) {
      let get_one_data = await EmployeeWeekOff.findAll({
        where: {
          userMasterID: company_contact[i].userMasterID,
          status: {
            [Sequelize.Op.in]: [1],
          },
        },
        order: [["applicableDate", "ASC"]],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: "employee",
            include: [{ model: companyMaster }],
          },
          { model: weekOffPolicy, as: "weekoff" },
        ],
      });
      company_contact[i]["department"] = get_one_data;

      if (get_one_data.length == 0) {
      } else if (get_one_data.length == 1) {
        if (
          new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].status = 0;
        } else {
          get_one_data[0].status = 1;
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
        for (let j = 0; j < get_one_data.length; j++) {
          let D1 = new Date(get_one_data[j].applicableDate)
            .toISOString()
            .slice(0, 10);
          let D2;
          if (get_one_data[j].endDate == null) {
            D2 = null;
          } else {
            D2 = new Date(get_one_data[j].endDate).toISOString().slice(0, 10);
          }

          let D3 = new Date().toISOString().slice(0, 10);
          if (D3 == D1) {
            get_one_data[j].status = 1;
          } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
            get_one_data[j].status = 1;
          } else if (D2 == null && D1 <= D3) {
            get_one_data[j].status = 1;
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[j].status = 1;
            } else {
              get_one_data[j].status = 0;
            }
          } else {
            get_one_data[j].status = 0;
          }
        }
      }
    }
    if (company_contact) {
      totalcount = await UserMaster.count({
        raw: true,
        where: { status: 1, companyMasterId: req.body.companyMasterID },
        ...accessibleUsers(req.userDetails, false),
      });
      res
        .status(200)
        .json({ status: 200, data: company_contact, totalcount: totalcount });
    }
  } catch (err) {
    next(err);
  }
};

exports.postAddEmployeeWeekoffBULK = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      userMasterID,
      weekOffPolicyID,
      applicableDate,
      createBy,
      createByIp,
    } = await req.body;
    let assignedUser = [];
    let notassignedUser = [];
    let applicableDate1;
    for (let n = 0; n < userMasterID.length; n++) {
      let finalEndDate = null;
      let active_salary_policy;
      active_salary_policy = await SalaryPolicy.findOne({
        raw: true,
        where: {
          userMasterID: Number(userMasterID[n]),
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
            model: Salary_policy,
            as: "salaryPolicy",
          },
        ],
        transaction,
      });

      let tempDate = "";
      let finalDate = "";

      if (active_salary_policy) {
        if (active_salary_policy["salaryPolicy.salaryCycleDate"]) {
          tempDate = active_salary_policy["salaryPolicy.salaryCycleDate"]
            .toString()
            .padStart(2, "0");
        } else {
          tempDate = "01";
        }
      } else {
        tempDate = "01";
      }

      if (Number(applicableDate) == 0) {
        let YYYYMM = Number(
          new Date().getFullYear() +
            new Date().getMonth().toString().padStart(2, "0")
        );
        let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
          transaction,
        });

        if (checkAttendanceVerification) {
          notassignedUser.push(userMasterID[n]);
          continue;
        } else {
          assignedUser.push(userMasterID[n]);
        }
        finalDate = new Date();
        finalDate.setMonth(finalDate.getMonth() - 1, Number(tempDate));
        new Date(finalDate).toISOString().slice(0, 10);

        // finalDate =
        //   new Date().getFullYear() +
        //   '-' +
        //   new Date().getMonth().toString().padStart(2, '0') +
        //   '-' +
        //   tempDate;
      } else if (Number(applicableDate) == 1) {
        let YYYYMM = Number(
          new Date().getFullYear() +
            (new Date().getMonth() + 1).toString().padStart(2, "0")
        );
        let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
          transaction,
        });

        if (checkAttendanceVerification) {
          notassignedUser.push(userMasterID[n]);
          continue;
        } else {
          assignedUser.push(userMasterID[n]);
        }

        finalDate =
          new Date().getFullYear() +
          "-" +
          (new Date().getMonth() + 1).toString().padStart(2, "0") +
          "-" +
          tempDate;
      } else {
        assignedUser.push(userMasterID[n]);
        finalDate =
          new Date().getFullYear() +
          "-" +
          (new Date().getMonth() + 2).toString().padStart(2, "0") +
          "-" +
          tempDate;
      }

      applicableDate1 = new Date(finalDate);
      let data = await EmployeeWeekOff.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID[n],
          applicableDate: applicableDate1,
          status: 1,
        },
        transaction,
      });

      if (!data) {
        let get_one_data = await EmployeeWeekOff.findAll({
          where: {
            userMasterID: userMasterID[n],
            status: 1,
          },
          transaction,
        });

        if (get_one_data.length > 0) {
          startdates = [];
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
            let date_change = await EmployeeWeekOff.update(
              {
                endDate: new Date(
                  new Date(applicableDate1).getTime() - 86400000
                ),
              },
              {
                where: {
                  applicableDate: nearestPastDate(
                    dateArr,
                    new Date(applicableDate1)
                  ),
                  userMasterID: userMasterID[n],
                },
              },
              { transaction }
            );
          }
          if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
            let insert_db_status = await EmployeeWeekOff.create(
              {
                userMasterID: userMasterID[n],
                weekOffPolicyID,
                applicableDate: applicableDate1,
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(applicableDate1)
                  ).getTime() - 86400000,
                createBy,
                createByIp,
              },
              { transaction }
            );
            finalEndDate =
              nearestFutureDate(dateArr, new Date(applicableDate1)).getTime() -
              86400000;
          } else {
            let insert_db_status = await EmployeeWeekOff.create(
              {
                userMasterID: userMasterID[n],
                weekOffPolicyID,
                applicableDate: applicableDate1,
                createBy,
                createByIp,
              },
              { transaction }
            );
          }
        } else {
          let insert_db_status = await EmployeeWeekOff.create(
            {
              userMasterID: userMasterID[n],
              weekOffPolicyID,
              applicableDate: applicableDate1,
              createBy,
              createByIp,
            },
            { transaction }
          );
        }
      } else {
        finalEndDate = data.endDate;
        let update_Status = await EmployeeWeekOff.update(
          {
            weekOffPolicyID: weekOffPolicyID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { employeeWeekOffID: data.employeeWeekOffID },
          },
          { transaction }
        );
      }

      const userDetail = await userDetails(userMasterID[n]);
      if (userDetail)
        await add_WeekOffHoliday_With_Transaction(
          userDetail.companyMasterId,
          [userMasterID[n]],
          new Date(applicableDate1).toISOString().slice(0, 10),
          weekOffPolicyID,
          null,
          false,
          finalEndDate,
          transaction
        );
    }

    let Notassigned = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: notassignedUser,
        status: 1,
      },
      attributes: ["displayName"],
    });

    let message = "";

    message =
      "Weeekoff policy has been assigned to (" +
      assignedUser.length +
      ") users. <br><br>";

    let notassignname = "";

    for (let i = 0; i < Notassigned.length; i++) {
      notassignname = notassignname + Notassigned[i].displayName + ",";
    }
    if (Notassigned.length > 0) {
      message =
        message +
        "Weekoff policy has not been assigned to " +
        notassignname +
        " because attendance already verfied.";
    }
    await transaction.commit()
    return res.status(200).json({ status: 200, message: message, data: {} });
  } catch (err) {
    await transaction.rollback()

    next(err);
  }
};
