const Sequelize = require("sequelize");
const UserMaster = require("../models/userMaster");
const EmployeeShift = require("../models/employeeShift");
const sequelize = require("../config/database");
const message = require("../response_message/message");
const Shift = require("../models/shift");
const {
  accessibleUsers,
  asiaKolkataDateTime,
  nearestPastDate,
  nearestFutureDate,
  getDatesFromDateRange,
} = require("../utils/commonUtilFunctions");
const moment = require("moment");
const { generateExcel } = require('../utils/exportData');
const { userAttributes } = require("../utils/commonVars");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const ShiftRoster = require("../models/shiftRoster");
const companyMaster = require("../models/companyMaster");

exports.getEmployeeShiftByUserId = async (req, res, next) => {
  try {
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const get_one_data = await EmployeeShift.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [["startDate", "ASC"]],
      include: [
        { model: Shift, as: "shift" },
        {
          required: false,
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: "updatedByUserDetails",
          attributes: userAttributes,
        },
      ],
    });

    if (get_one_data.length == 1) {
      get_one_data[0].dataValues.showDelete = true;
      if (new Date(get_one_data[0].startDate) > new Date(currentDate)) {
        get_one_data[0].dataValues.shiftstatus = "deactive";
      } else {
        get_one_data[0].dataValues.shiftstatus = "active";
      }
    } else if (get_one_data.length > 1) {
      let startdates = [];
      for (var j = 0; j < get_one_data.length; j++) {
        startdates.push(new Date(get_one_data[j].startDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };
      const past = new Date(nearestPastDate(dateArr, new Date(currentDate)));

      for (var i = 0; i < get_one_data.length; i++) {
        let D1 = new Date(get_one_data[i].startDate);
        let D2;
        if (get_one_data[i].endDate == null) {
          D2 = null;
        } else {
          D2 = new Date(get_one_data[i].endDate);
        }
        const D3 = new Date(currentDate);
        if (D3 >= D1 && D3 <= D2) {
          get_one_data[i].dataValues.shiftstatus = "active";
          get_one_data[i].dataValues.showDelete = true;
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].dataValues.shiftstatus = "active";
          get_one_data[i].dataValues.showDelete = true;
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].dataValues.shiftstatus = "active";
            get_one_data[i].dataValues.showDelete = true;
          } else {
            get_one_data[i].dataValues.shiftstatus = "deactive";
            get_one_data[i].dataValues.showDelete = false;
          }
        } else if (D3 == D1) {
          get_one_data[i].dataValues.shiftstatus = "active";
          get_one_data[i].dataValues.showDelete = true;
        } else {
          get_one_data[i].dataValues.shiftstatus = "deactive";
          get_one_data[i].dataValues.showDelete = true;
        }
      }
    }

    const getAllShiftData = await Shift.findAll({
      where: {
        status: [0, 1],
      },
    });
    for (let item of get_one_data) {
      if (item.shiftsID) {
        let ii = 0;
        for (let shiftID of item.shiftsID) {
          let shiftData =
            getAllShiftData && getAllShiftData.length > 0
              ? getAllShiftData.find((e) => e.shiftID == shiftID)
              : null;
          if (item.dataValues.shift) {
            if (ii < item.shiftsID.length - 1) {
              shiftData.shiftName = shiftData.shiftName + ",";
            }
            item.dataValues.shift.shiftName.push(shiftData.shiftName);
          } else {
            item.dataValues.shift = {
              shiftName: [],
            };
            if (ii < item.shiftsID.length - 1) {
              shiftData.shiftName = shiftData.shiftName + ",";
            }
            item.dataValues.shift.shiftName.push(shiftData.shiftName);
          }
          ii++;
        }
      }
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateEmployeeShift = async (req, res, next) => {
  try {
    let { employeeShiftID, userMasterID, shiftID, startDate } = await req.body;

    let data = await EmployeeShift.findOne({
      where: {
        userMasterID: userMasterID,
        employeeShiftID: { [Sequelize.Op.notIn]: [employeeShiftID] },
        startDate: new Date(startDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeShift.findAll({
        where: {
          userMasterID: userMasterID,
          employeeShiftID: { [Sequelize.Op.notIn]: [employeeShiftID] },
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        let startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].startDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);
        const pastDate = nearestPastDate(dateArr, new Date(startDate));

        const futureDate = nearestFutureDate(dateArr, new Date(startDate));
        if (nearestPastDate(dateArr, new Date(startDate)) != null) {
          let date_change = await EmployeeShift.update(
            {
              endDate: new Date(new Date(startDate).getTime() - 86400000),
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                startDate: nearestPastDate(dateArr, new Date(startDate)),
                userMasterID: userMasterID,
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(startDate)) != null) {
          let insert_db_status = await EmployeeShift.update(
            {
              userMasterID,
              shiftID,
              startDate,
              endDate:
                nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                86400000,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                employeeShiftID: employeeShiftID,
              },
            }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeeshiftupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeShift.update(
              {
                userMasterID,
                shiftID,
                startDate,
                updateBy: req.userDetails.userMasterId,
                updateByIp: req.userDetails.userIpAddress,
              },
              {
                where: {
                  employeeShiftID: employeeShiftID,
                },
              },
              { transaction: t }
            );
            res.status(200).json({
              status: 200,
              message: message.usermessage.employeeshiftupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeShift.update(
            {
              userMasterID,
              shiftID,
              startDate,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                employeeShiftID: employeeShiftID,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeeshiftupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: message.usermessage.employeeshiftdate,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeeShiftByID = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { employeeShiftID, userMasterID } = await req.body;
    const getAllEmployeeShift = await EmployeeShift.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
      transaction,
    });
    const getAllEmployeeShiftWithoutemployeeShiftID =
      getAllEmployeeShift && getAllEmployeeShift.length > 0
        ? getAllEmployeeShift.filter(
            (e) => e.employeeShiftID != employeeShiftID
          )
        : [];

    if (getAllEmployeeShiftWithoutemployeeShiftID.length > 0) {
      let startdates = [];
      for (
        var i = 0;
        i < getAllEmployeeShiftWithoutemployeeShiftID.length;
        i++
      ) {
        startdates.push(
          new Date(getAllEmployeeShiftWithoutemployeeShiftID[i].startDate)
        );
      }
      const dateArr = startdates.sort((a, b) => a - b);
      const get_previous_data =
        getAllEmployeeShift && getAllEmployeeShift.length > 0
          ? getAllEmployeeShift.find(
              (e) => e.employeeShiftID == employeeShiftID
            )
          : null;
      const pastDate = nearestPastDate(
        dateArr,
        new Date(get_previous_data.startDate)
      );

      const futureDate = nearestFutureDate(
        dateArr,
        new Date(get_previous_data.startDate)
      );
      if (pastDate != null) {
        if (futureDate != null) {
          const subtractedStartDate = moment(futureDate, "YYYY-MM-DD")
            .subtract(1, "days")
            .format("YYYY-MM-DD");
          await EmployeeShift.update(
            {
              endDate: subtractedStartDate,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                startDate: pastDate,
                userMasterID: userMasterID,
              },
            },
            { transaction }
          );
        } else {
          await EmployeeShift.update(
            {
              endDate: null,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                startDate: pastDate,
                userMasterID: userMasterID,
              },
            },
            { transaction }
          );
        }
      }
    }
    await EmployeeShift.update(
      {
        status: 2,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: {
          employeeShiftID: employeeShiftID,
        },
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Employee Shift"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getEmployeeShift = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let shift, totalcount;

    if (searchQuery && page && limit) {
      shift = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        where: {
          companyMasterId: req.body.companyMasterID,
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
            { userNumber: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
            sequelize.where(
              sequelize.cast(
                sequelize.col("userMaster.userMasterID"),
                "varchar"
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
        ...accessibleUsers(req.userDetails, false),
      });
      for (var i = 0; i < shift.length; i++) {
        let get_one_data = await EmployeeShift.findAll({
          where: {
            userMasterID: shift[i].userMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          limit: limit,
          offset: offset,
          include: [{ model: Shift, as: "shift" }],
        });

        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
            new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.shiftstatus = "deactive";
          } else {
            get_one_data[0].dataValues.shiftstatus = "active";
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].startDate));
          }
          const dateArr = startdates.sort((a, b) => a - b);
          const past = nearestPastDate(dateArr, new Date());

          for (var k = 0; k < get_one_data.length; k++) {
            let D1 = new Date(get_one_data[k].startDate);
            let D2;
            if (get_one_data[k].endDate == null) {
              D2 = null;
            } else {
              D2 = new Date(get_one_data[k].endDate);
            }

            let D3 = new Date();
            if (D3 >= D1 && D3 <= D2) {
              get_one_data[k].dataValues.shiftstatus = "active";
            } else if (D2 == null && D1 <= D3) {
              get_one_data[k].dataValues.shiftstatus = "active";
            } else if (D3 > D1) {
              if (D1 == past) {
                get_one_data[k].dataValues.shiftstatus = "active";
              } else {
                get_one_data[k].dataValues.shiftstatus = "deactive";
              }
            } else if (D3 == D1) {
              get_one_data[k].dataValues.shiftstatus = "active";
            } else {
              get_one_data[k].dataValues.shiftstatus = "deactive";
            }
          }
        }
        shift[i].shift = get_one_data;
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          companyMasterId: req.body.companyMasterID,
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
            { userNumber: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
            sequelize.where(
              sequelize.cast(
                sequelize.col("userMaster.userMasterID"),
                "varchar"
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
        ...accessibleUsers(req.userDetails, false),
      });
    } else {
      shift = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        where: {
          status: 1,
          companyMasterId: req.body.companyMasterID,
        },
        ...accessibleUsers(req.userDetails, false),
      });
      for (var i = 0; i < shift.length; i++) {
        let get_one_data = await EmployeeShift.findAll({
          where: {
            userMasterID: shift[i].userMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          order: [["startDate", "ASC"]],
          include: [{ required: false, model: Shift, as: "shift" }],
        });

        if (get_one_data)
          if (get_one_data.length == 1) {
            if (
              new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
              new Date().toISOString().slice(0, 10)
            ) {
              get_one_data[0].dataValues.shiftstatus = "deactive";
            } else {
              get_one_data[0].dataValues.shiftstatus = "active";
            }
          } else {
            let startdates = [];
            for (var j = 0; j < get_one_data.length; j++) {
              startdates.push(new Date(get_one_data[j].startDate));
            }
            const dateArr = startdates.sort((a, b) => a - b);
            const past = nearestPastDate(dateArr, new Date());
            for (var k = 0; k < get_one_data.length; k++) {
              // let D1 = new Date(get_one_data[k].startDate);
              // let D2;
              // if (get_one_data[k].endDate == null) {
              //   D2 = null;
              // } else {
              //   D2 = new Date(get_one_data[k].endDate);
              // }
              let D1 = asiaKolkataDateTime(
                new Date(get_one_data[k].startDate)
              ).slice(0, 10);
              let D2;
              if (get_one_data[k].endDate == null) {
                D2 = null;
              } else {
                D2 = asiaKolkataDateTime(
                  new Date(get_one_data[k].endDate)
                ).slice(0, 10);
              }
              // let D3 = new Date();
              let D3 = asiaKolkataDateTime(new Date()).slice(0, 10);

              if (D3 >= D1 && D3 <= D2) {
                get_one_data[k].dataValues.shiftstatus = "active";
              } else if (D2 == null && D1 <= D3) {
                get_one_data[k].dataValues.shiftstatus = "active";
              } else if (D3 > D1) {
                if (D1 == past) {
                  get_one_data[k].dataValues.shiftstatus = "active";
                } else {
                  get_one_data[k].dataValues.shiftstatus = "deactive";
                }
              } else if (D3 == D1) {
                get_one_data[k].dataValues.shiftstatus = "active";
              } else {
                get_one_data[k].dataValues.shiftstatus = "deactive";
              }
            }
          }
        shift[i].shift = get_one_data;
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          status: 1,
          companyMasterId: req.body.companyMasterID,
        },
        ...accessibleUsers(req.userDetails, false),
      });
    }

    for (let get_one_data of shift) {
      for (let item of get_one_data.shift) {
        if (item.shiftsID) {
          let ii = 0;
          for (let shiftID of item.shiftsID) {
            let shiftData = await Shift.findOne({
              raw: true,
              where: {
                shiftID: shiftID,
                status: {
                  [Sequelize.Op.in]: [0, 1],
                },
              },
            });

            if (item.dataValues.shift) {
              if (ii < item.shiftsID.length - 1) {
                shiftData.shiftName = shiftData.shiftName + ",";
              }
              item.dataValues.shift.shiftName.push(shiftData.shiftName);
            } else {
              item.dataValues.shift = {
                shiftName: [],
              };
              if (ii < item.shiftsID.length - 1) {
                shiftData.shiftName = shiftData.shiftName + ",";
              }
              item.dataValues.shift.shiftName.push(shiftData.shiftName);
            }
            ii++;
          }
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: shift, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};

exports.postAddEmployeeShiftV2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      shiftType,
      userMasterID,
      shiftID,
      shiftsID,
      startDate,
      createBy,
      createByIp,
    } = await req.body;

    // Find Employees All Shifts
    const getEmployeeAllShifts = await EmployeeShift.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
      transaction,
    });

    const findEmployeeStartDayShift =
      getEmployeeAllShifts && getEmployeeAllShifts.length > 0
        ? getEmployeeAllShifts.find((e) => e.startDate == startDate)
        : null;

    if (findEmployeeStartDayShift) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.employeeshiftdate,
      });
    }

    const PromiseArray = [];
    if (getEmployeeAllShifts && getEmployeeAllShifts.length > 0) {
      let startdates = [];
      for (var i = 0; i < getEmployeeAllShifts.length; i++) {
        startdates.push(new Date(getEmployeeAllShifts[i].startDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);

      const pastDate = nearestPastDate(dateArr, new Date(startDate));

      const futureDate = nearestFutureDate(dateArr, new Date(startDate));

      if (pastDate != null) {
        const subtractedStartDate = moment(startDate, "YYYY-MM-DD")
          .subtract(1, "days")
          .format("YYYY-MM-DD");

        PromiseArray.push(
          EmployeeShift.update(
            {
              endDate: subtractedStartDate,
              updateBy: req.userDetails.userMasterId,
              updateByIp: req.userDetails.userIpAddress,
            },
            {
              where: {
                startDate: pastDate,
                userMasterID: userMasterID,
              },
              transaction,
            }
          )
        );
      }

      if (futureDate != null) {
        const subtractedFutureDate = moment(futureDate, "YYYY-MM-DD")
          .subtract(1, "days")
          .format("YYYY-MM-DD");

        PromiseArray.push(
          EmployeeShift.create(
            {
              userMasterID,
              shiftID,
              shiftsID,
              startDate,
              endDate: subtractedFutureDate,
              createBy,
              createByIp,
              shiftType,
            },
            { transaction }
          )
        );
      } else {
        PromiseArray.push(
          EmployeeShift.create(
            {
              userMasterID,
              shiftID,
              shiftsID,
              startDate,
              createBy,
              createByIp,
              shiftType,
            },
            { transaction }
          )
        );
      }
    } else {
      PromiseArray.push(
        await EmployeeShift.create(
          {
            userMasterID,
            shiftID,
            shiftsID,
            startDate,
            createBy,
            createByIp,
            shiftType,
          },
          { transaction }
        )
      );
    }
    await Promise.all(PromiseArray);
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Employee Shift"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.postAddEmployeeShiftBULKV2 = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { shiftType, userMasterID, shiftID, shiftsID, startDate } =
      await req.body;

    const usersShiftData = await EmployeeShift.findAll({
      where: {
        userMasterID: userMasterID,
      },
    });

    const createData = [];
    const promiseArray = [];

    for (let n = 0; n < userMasterID.length; n++) {
      const findUserShifts = usersShiftData
        ? usersShiftData.filter((e) => e.userMasterID == userMasterID[n])
        : null;
      const findEmployeeStartDayShift = findUserShifts
        ? findUserShifts.find((e) => e.startDate == startDate)
        : null;

      if (!findEmployeeStartDayShift) {
        if (findUserShifts.length > 0) {
          let startdates = [];

          for (var i = 0; i < findUserShifts.length; i++) {
            startdates.push(new Date(findUserShifts[i].startDate));
          }

          const dateArr = startdates.sort((a, b) => a - b);
          const pastDate = nearestPastDate(dateArr, new Date(startDate));
          const futureDate = nearestFutureDate(dateArr, new Date(startDate));

          if (pastDate != null) {
            const subtractedStartDate = moment(startDate, "YYYY-MM-DD")
              .subtract(1, "days")
              .format("YYYY-MM-DD");
            promiseArray.push(
              EmployeeShift.update(
                {
                  endDate: subtractedStartDate,
                  updateBy: req.userDetails.userMasterId,
                  updateByIp: req.userDetails.userIpAddress,
                },
                {
                  where: {
                    startDate: pastDate,
                    userMasterID: userMasterID[n],
                  },
                },
                { transaction }
              )
            );
          }
          if (futureDate != null) {
            const subtractedFutureDate = moment(futureDate, "YYYY-MM-DD")
              .subtract(1, "days")
              .format("YYYY-MM-DD");
            const EmployeeShiftData = {
              userMasterID: userMasterID[n],
              shiftID,
              shiftsID,
              startDate,
              endDate: subtractedFutureDate,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
              shiftType,
            };
            createData.push(EmployeeShiftData);
          } else {
            const EmployeeShiftData = {
              userMasterID: userMasterID[n],
              shiftID,
              shiftsID,
              startDate,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
              shiftType,
            };
            createData.push(EmployeeShiftData);
          }
        } else {
          const EmployeeShiftData = {
            userMasterID: userMasterID[n],
            shiftID,
            shiftsID,
            startDate,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
            shiftType,
          };
          createData.push(EmployeeShiftData);
        }
      }
    }

    if (createData.length > 0) {
      promiseArray.push(EmployeeShift.bulkCreate(createData, transaction));
    }

    if (promiseArray.length > 0) {
      await Promise.all(promiseArray);
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Employee Shift"),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Employee Shift Report
 */
exports.getEmployeeShiftReport = async (req, res, next) => {
  try {
    const { company, user, fromDate, toDate, exportData, page, limit } =
      req.body;

    /** Validation */
    if (!company) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.requiredMessage("companyMasterID"),
      });
    }

    if (!fromDate || !toDate) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.requiredMessage("From date and to date"),
      });
    }

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    /** Pagination query */
    const paginationQuery = {};

    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    /** Dynamic where condition */
    const condition = { companyMasterId: company };
    if (user?.length) {
      condition.userMasterID = user;
    }

    let [allShiftsList, userData] = await Promise.all([
      /** Find all shift name */
      Shift.findAll({
        raw: true,
        where: {
          companyMasterID: company,
          status: 1,
        },
        attributes: ["shiftID", "shiftName"],
      }),

      /** Fetch all user data */
      UserMaster.findAndCountAll({
        where: condition,
        attributes: [
          "userMasterID",
          "displayName",
          "userNumber",
          "companyMasterId",
        ],
        ...paginationQuery,
        order: [["displayName", "ASC"]],
        include: [
          {
            required: false,
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
            model: EmployeeShift,
            attributes: ["shiftID", "shiftsID", "startDate", "endDate"],
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
          {
            required: false,
            model: ShiftRoster,
            attributes: ["shiftRosterDate", "shiftID"],
            where: {
              status: 1,
              shiftRosterDate: {
                [Sequelize.Op.between]: [fromDate, toDate],
              },
            },
          },
          {
            required: false,
            model: companyMaster,
            attributes: ["companyMasterID", "companyName"],
          },
        ],
      }),
    ]);

    const datesArray = (
      await getDatesFromDateRange(new Date(fromDate), new Date(toDate))
    ).map((date) => moment(date).format("DD-MM-YYYY"));

    const response = [];

    for (let user of userData.rows) {
      const obj = {
        userMasterID: user.userMasterID,
        displayName: user.displayName,
        userNumber: user.userNumber,
        companyName: user.companyMaster.companyName,
        employeeCode: user.employeeJoiningDetails?.[0]?.employeeCode,
        designationName:
          user.employeeDesignations?.[0]?.designation?.designationName,
        departmentName:
          user.employeeDepartments?.[0]?.department?.departmentName,
        branchName: user.employeeBranches?.[0]?.branchMaster?.branchName,
      };
      for (const tempDate of datesArray) {
        const date = moment(tempDate, 'DD-MM-YYYY').format('YYYY-MM-DD')
        const findDateWiseRoster =
          user.shiftRosters && user.shiftRosters.length > 0
            ? user.shiftRosters.find((e) => e.shiftRosterDate == date)
            : null;
        const findDateWiseEmployeeShift = user.employeeShifts?.length
          ? user.employeeShifts.find(
              (e) =>
                e.startDate <= date && (e.endDate >= date || e.endDate == null)
            )
          : null;
        let employeeShiftIds = [];
        if (findDateWiseEmployeeShift) {
          if (findDateWiseEmployeeShift.shiftID) {
            employeeShiftIds = [findDateWiseEmployeeShift.shiftID];
          } else if (findDateWiseEmployeeShift.shiftsID.length) {
            employeeShiftIds = findDateWiseEmployeeShift.shiftsID;
          }
        }
        obj[tempDate] = {
          roaster: findDateWiseRoster
            ? allShiftsList.find((e) => e.shiftID == findDateWiseRoster.shiftID)
                ?.shiftName
            : null,
          employeeShift: employeeShiftIds.length
            ? allShiftsList
                .filter((e) => employeeShiftIds.find((es) => es == e.shiftID))
                ?.map((e) => e.shiftName)
                .join(",")
            : null,
        };
      }
      response.push(obj);
    }

    if (exportData) {
      const finalData = [];
      response.forEach((e) => {
        const obj = {
          "Employee Code": e.employeeCode,
          "Employee Name": e.displayName,
          "Number": e.userNumber,
          "Company Name": e.companyName,
          "Branch": e.branchName,
          "Department": e.departmentName,
          "Designation": e.designationName,
        };
        datesArray.forEach((date) => {
          if (e[date] && (e[date].roaster || e[date].employeeShift)) {
            let shiftName = "";
            if (e[date].employeeShift) {
              shiftName += "Employee Shift: " + e[date].employeeShift + "\n";
            }
            if (e[date].roaster) {
              shiftName += "Roaster: " + e[date].roaster;
            }
            obj[date] = shiftName;
          } else {
            obj[date] = "NA";
          }
        });
        finalData.push(obj);
      });
      const config = {
        isWrapText: (cell, colNum) => {
          return cell.value.includes('\n');
        },
        font: (cell, colNum) => {
          if(cell.value === 'NA') {
            return { color: { argb: "FF0000" }, bold: true } //red color
          }
        }
      }
      await generateExcel(finalData, "Employee Shift Report", "xlsx", res, config);
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage("Employee Shift Report"),
      data: {
        rows: response,
        count: userData.count,
        datesArray,
      },
    });
  } catch (error) {
    next(error);
  }
};
