const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const attendanceTransaction = require('../models/attendanceTransaction');
const companyMaster = require('../models/companyMaster');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');

const SalaryPolicy = require('../models/employeeSalaryPolicy');
const Salary_policy = require('../models/salaryPolicy');
const hrLeavesMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const { executeQuery } = require('./common.controller');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

exports.postAddLateEarlyPolicy = async (req, res, next) => {
  try {
    const {
      userMasterID,
      lateEarlyPolicyMasterID,
      startDate,
      createBy,
      createByIp,
    } = await req.body;

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
          as: 'salaryPolicy',
        },
      ],
    });

    let tempDate = '';
    let finalDate = '';

    if (active_salary_policy) {
      if (active_salary_policy['salaryPolicy.salaryCycleDate']) {
        tempDate = active_salary_policy['salaryPolicy.salaryCycleDate']
          .toString()
          .padStart(2, '0');
      } else {
        tempDate = '01';
      }
    } else {
      tempDate = '01';
    }

    if (Number(startDate) == 0) {
      let YYYYMM = Number(
        new Date().getFullYear() +
        new Date().getMonth().toString().padStart(2, '0')
      );
      let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          AttnYearMon: YYYYMM,
          verified: 1,
        },
      });

      if (checkAttendanceVerification) {
        return res.status(200).json({
          status: 401,
          message:
            'You cannot assign Bulk Latein Earlygo policy for the selected month because attendance already verified.',
          data: {},
        });
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
    } else if (Number(startDate) == 1) {
      let YYYYMM = Number(
        new Date().getFullYear() +
        (new Date().getMonth() + 1).toString().padStart(2, '0')
      );
      let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          AttnYearMon: YYYYMM,
          verified: 1,
        },
      });

      if (checkAttendanceVerification) {
        return res.status(200).json({
          status: 401,
          message:
            'You cannot assign Bulk Latein Earlygo policy for the selected month because attendance already verified.',
          data: {},
        });
      }

      finalDate =
        new Date().getFullYear() +
        '-' +
        (new Date().getMonth() + 1).toString().padStart(2, '0') +
        '-' +
        tempDate;
    } else {
      finalDate =
        new Date().getFullYear() +
        '-' +
        (new Date().getMonth() + 2).toString().padStart(2, '0') +
        '-' +
        tempDate;
    }
    let applicableDate1 = new Date(finalDate);
    let data = await EmployeeLateEarlyPolicy.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
        startDate: new Date(applicableDate1),
        status: 1,
      },
    });

    if (!data) {
      let get_one_data = await EmployeeLateEarlyPolicy.findAll({
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        let startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].startDate));
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
          let date_change = await EmployeeLateEarlyPolicy.update(
            {
              endDate: new Date(new Date(applicableDate1).getTime() - 86400000),
            },
            {
              where: {
                startDate: nearestPastDate(dateArr, new Date(applicableDate1)),
                userMasterID: userMasterID,
              },
            }
          );
        }
        if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
          let insert_db_status = await EmployeeLateEarlyPolicy.create({
            userMasterID: userMasterID,
            lateEarlyPolicyMasterID,
            startDate: applicableDate1,
            endDate:
              nearestFutureDate(dateArr, new Date(applicableDate1)).getTime() -
              86400000,
            createBy,
            createByIp,
          });
        } else {
          let insert_db_status = await EmployeeLateEarlyPolicy.create({
            userMasterID: userMasterID,
            lateEarlyPolicyMasterID,
            startDate: applicableDate1,
            createBy,
            createByIp,
          });
        }
      } else {
        let insert_db_status = await EmployeeLateEarlyPolicy.create({
          userMasterID: userMasterID,
          lateEarlyPolicyMasterID,
          startDate: applicableDate1,
          createBy,
          createByIp,
        });
      }
    } else {
      await EmployeeLateEarlyPolicy.update(
        {
          lateEarlyPolicyMasterID: lateEarlyPolicyMasterID,
          updateBy: createBy,
          updateByIp: createByIp,
        },
        {
          where: { employeeLateEarlyPolicyID: data.employeeLateEarlyPolicyID },
        }
      );
    }

    return res
      .status(200)
      .json({ status: 200, message: 'Policy assigned Successfully', data: {} });
  } catch (err) {
    next(err);
  }
};

exports.getLateEarlyPolicyByUserId = async (req, res, next) => {
  try {
    let currdate = new Date(
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2)
    );

    let get_one_data = await EmployeeLateEarlyPolicy.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['startDate', 'ASC']],
      include: [
        {
          model: UserMaster,
          as: 'employee',
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: LateEarlyPolicy,
          as: 'lateEarlyPolicy',
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
        },
      ],
    });
    if (get_one_data.length == 0) {
    } else if (get_one_data.length == 1) {
      if (
        new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
        new Date(currdate).toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.policystatus = 'deactive';
      } else {
        get_one_data[0].dataValues.policystatus = 'active';
      }

      let attendancedata;
      if (get_one_data[0].endDate) {
        attendancedata = await attendanceTransaction.findOne({
          where: {
            userMasterID: req.params.id,
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(get_one_data[0].startDate),
                new Date(get_one_data[0].endDate),
              ],
            },
            Status: 1,
          },
        });
      } else {
        attendancedata = await attendanceTransaction.findOne({
          where: {
            userMasterID: req.params.id,
            AttendanceDate: {
              [Sequelize.Op.gte]: new Date(get_one_data[0].startDate),
            },
            Status: 1,
          },
        });
      }

      if (attendancedata) {
        get_one_data[0].dataValues.deleteshow = 0;
      } else {
        get_one_data[0].dataValues.deleteshow = 1;
      }
    } else {
      let startdates = [];
      for (var j = 0; j < get_one_data.length; j++) {
        startdates.push(new Date(get_one_data[j].startDate));
      }
      if (startdates.length > 0) {
        const dateArr = startdates.sort((a, b) => a - b);
        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };
        const past = nearestPastDate(dateArr, new Date(currdate))
          .toISOString()
          .slice(0, 10);
        for (var i = 0; i < get_one_data.length; i++) {
          let D1 = new Date(get_one_data[i].startDate)
            .toISOString()
            .slice(0, 10);
          let D2;
          if (get_one_data[i].endDate == null) {
            D2 = null;
          } else {
            D2 = new Date(get_one_data[i].endDate).toISOString().slice(0, 10);
          }

          let D3 = new Date(currdate).toISOString().slice(0, 10);
          if (D3 == D1) {
            get_one_data[i].dataValues.policystatus = 'active';
          } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
            get_one_data[i].dataValues.policystatus = 'active';
          } else if (D2 == null && D1 <= D3) {
            get_one_data[i].dataValues.policystatus = 'active';
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[i].dataValues.policystatus = 'active';
            } else {
              get_one_data[i].dataValues.policystatus = 'deactive';
            }
          } else {
            get_one_data[i].dataValues.policystatus = 'deactive';
          }

          let attendancedata;
          if (get_one_data[i].endDate) {
            attendancedata = await attendanceTransaction.findOne({
              where: {
                userMasterID: req.params.id,
                AttendanceDate: {
                  [Sequelize.Op.between]: [
                    new Date(get_one_data[i].startDate),
                    new Date(get_one_data[i].endDate),
                  ],
                },
                Status: 1,
              },
            });
          } else {
            attendancedata = await attendanceTransaction.findOne({
              where: {
                userMasterID: req.params.id,
                AttendanceDate: {
                  [Sequelize.Op.gte]: new Date(get_one_data[i].startDate),
                },
                Status: 1,
              },
            });
          }

          if (attendancedata) {
            get_one_data[i].dataValues.deleteshow = 0;
          } else {
            get_one_data[i].dataValues.deleteshow = 1;
          }
        }
      }
    }
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

exports.postUpdateLateEarlyPolicy = async (req, res, next) => {
  try {
    const {
      employeeLateEarlyPolicyID,
      userMasterID,
      lateEarlyPolicyMasterID,
      startDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await EmployeeLateEarlyPolicy.findOne({
      where: {
        userMasterID: userMasterID,
        employeeLateEarlyPolicyID: {
          [Sequelize.Op.notIn]: [employeeLateEarlyPolicyID],
        },
        startDate: new Date(startDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeLateEarlyPolicy.findAll({
        where: {
          userMasterID: userMasterID,
          employeeLateEarlyPolicyID: {
            [Sequelize.Op.notIn]: [employeeLateEarlyPolicyID],
          },
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        let startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].startDate));
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
        if (nearestPastDate(dateArr, new Date(startDate)) != null) {
          await EmployeeLateEarlyPolicy.update(
            {
              endDate: new Date(new Date(startDate).getTime() - 86400000),
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
          let insert_db_status = await EmployeeLateEarlyPolicy.update(
            {
              userMasterID,
              lateEarlyPolicyMasterID,
              startDate,
              endDate:
                nearestFutureDate(dateArr, new Date(startDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeLateEarlyPolicyID: employeeLateEarlyPolicyID,
              },
            }
          );
          res.status(200).json({
            status: 200,
            message: 'Policy updated successfully',
            data: insert_db_status,
          });
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeLateEarlyPolicy.update(
              {
                userMasterID,
                lateEarlyPolicyMasterID,
                startDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeLateEarlyPolicyID: employeeLateEarlyPolicyID,
                },
              },
              { transaction: t }
            );
            res.status(200).json({
              status: 200,
              message: 'Policy updated successfully',
              data: insert_db_status,
            });
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeLateEarlyPolicy.update(
            {
              userMasterID,
              lateEarlyPolicyMasterID,
              startDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeLateEarlyPolicyID: employeeLateEarlyPolicyID,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: 'Policy updated successfully',
            data: insert_db_status,
          });
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

exports.postDeletLateEarlyPolicyById = async (req, res, next) => {
  try {
    const { employeeLateEarlyPolicyID, userMasterID } = await req.body;
    let get_one_data = await EmployeeLateEarlyPolicy.findAll({
      where: {
        userMasterID: userMasterID,
        employeeLateEarlyPolicyID: {
          [Sequelize.Op.notIn]: [employeeLateEarlyPolicyID],
        },
        status: 1,
      },
    });
    if (get_one_data.length > 0) {
      let startdates = [];
      for (var i = 0; i < get_one_data.length; i++) {
        startdates.push(new Date(get_one_data[i].startDate));
      }
      const dateArr = startdates.sort((a, b) => a - b);
      let get_previous_data = await EmployeeLateEarlyPolicy.findOne({
        where: {
          employeeLateEarlyPolicyID: employeeLateEarlyPolicyID,
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
        nearestPastDate(dateArr, new Date(get_previous_data.startDate)) != null
      ) {
        if (
          nearestFutureDate(dateArr, new Date(get_previous_data.startDate)) !=
          null
        ) {
          let date_change = await EmployeeLateEarlyPolicy.update(
            {
              endDate:
                nearestFutureDate(
                  dateArr,
                  new Date(get_previous_data.startDate)
                ).getTime() - 86400000,
            },
            {
              where: {
                startDate: nearestPastDate(
                  dateArr,
                  new Date(get_previous_data.startDate)
                ),
                userMasterID: userMasterID,
              },
            }
          );
        } else {
          let date_change = await EmployeeLateEarlyPolicy.update(
            {
              endDate: null,
            },
            {
              where: {
                startDate: nearestPastDate(
                  dateArr,
                  new Date(get_previous_data.startDate)
                ),
                userMasterID: userMasterID,
              },
            }
          );
        }
      }
    }
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await EmployeeLateEarlyPolicy.update(
        {
          status: 2,
        },
        {
          where: {
            employeeLateEarlyPolicyID: employeeLateEarlyPolicyID,
          },
        },
        { transaction: t }
      );
      return res.status(200).json({
        status: 200,
        message: 'Policy deleted successfully',
        data: insert_db_status,
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.getLateEarlyPolicy = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, companyMasterID } = await req.body;
    let currdate = new Date(
      new Date().getFullYear() +
      '-' +
      ('0' + (new Date().getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + new Date().getDate()).slice(-2)
    );

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (companyMasterID) {
      condition.companyMasterId = companyMasterID;
      req.userDetails.accessibleCompanies = companyMasterID;
    }

    condition.status = 1;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        sequelize.where(
          sequelize.cast(sequelize.col('userMaster.userMasterID'), 'varchar'),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ];

    const Policy = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false),
      // include: [{ model: companyMaster }],
    });

    for (let i = 0; i < Policy.rows.length; i++) {
      let get_one_data = await EmployeeLateEarlyPolicy.findAll({
        where: {
          userMasterID: Policy.rows[i].userMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['startDate', 'ASC']],
        include: [{ model: LateEarlyPolicy, as: 'lateEarlyPolicy' }],
      });

      if (get_one_data.length == 0) {
      } else if (get_one_data.length == 1) {
        if (
          new Date(get_one_data[0].startDate).toISOString().slice(0, 10) >
          new Date(currdate).toISOString().slice(0, 10)
        ) {
          get_one_data[0].dataValues.policyStatus = 'deactive';
        } else {
          get_one_data[0].dataValues.policyStatus = 'active';
        }
      } else {
        let startdates = [];
        for (var j = 0; j < get_one_data.length; j++) {
          startdates.push(new Date(get_one_data[j].startDate));
        }
        if (startdates.length > 0) {
          const dateArr = startdates.sort((a, b) => a - b);
          const nearestPastDate = (dateArr, date) => {
            const pastArr = dateArr.filter((n) => n <= date);
            return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
          };
          const past = nearestPastDate(dateArr, new Date(currdate))
            .toISOString()
            .slice(0, 10);
          for (var k = 0; k < get_one_data.length; k++) {
            let D1 = new Date(get_one_data[k].startDate)
              .toISOString()
              .slice(0, 10);
            let D2;
            if (get_one_data[k].endDate == null) {
              D2 = null;
            } else {
              D2 = new Date(get_one_data[k].endDate).toISOString().slice(0, 10);
            }

            let D3 = new Date(currdate).toISOString().slice(0, 10);
            if (D3 == D1) {
              get_one_data[k].dataValues.policyStatus = 'active';
            } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
              get_one_data[k].dataValues.policyStatus = 'active';
            } else if (D2 == null && D1 <= D3) {
              get_one_data[k].dataValues.policyStatus = 'active';
            } else if (D3 > D1) {
              if (D1 == past) {
                get_one_data[k].dataValues.policyStatus = 'active';
              } else {
                get_one_data[k].dataValues.policyStatus = 'deactive';
              }
            } else {
              get_one_data[k].dataValues.policyStatus = 'deactive';
            }
          }
        }
      }
      Policy.rows[i].Policy = get_one_data;
    }

    return res
      .status(200)
      .json({ status: 200, data: Policy.rows, totalcount: Policy.count });
  } catch (err) {
    console.error(err);
    next(err.message);
  }
};

exports.postAddAllPolicyBULK = async (req, res, next) => {
  try {
    const {
      userMasterID,
      lateEarlyPolicyMasterID,
      startDate,
      createBy,
      createByIp,
    } = await req.body;
    let assignedUser = [];
    let notassignedUser = [];

    for (var n = 0; n < userMasterID.length; n++) {
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
            as: 'salaryPolicy',
          },
        ],
      });

      let tempDate = '';
      let finalDate = '';

      if (active_salary_policy) {
        if (active_salary_policy['salaryPolicy.salaryCycleDate']) {
          tempDate = active_salary_policy['salaryPolicy.salaryCycleDate']
            .toString()
            .padStart(2, '0');
        } else {
          tempDate = '01';
        }
      } else {
        tempDate = '01';
      }

      if (Number(startDate) == 0) {
        let YYYYMM = Number(
          new Date().getFullYear() +
          new Date().getMonth().toString().padStart(2, '0')
        );
        let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
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
      } else if (Number(startDate) == 1) {
        let YYYYMM = Number(
          new Date().getFullYear() +
          (new Date().getMonth() + 1).toString().padStart(2, '0')
        );
        let checkAttendanceVerification = await hrLeavesMonthlyTrans.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID[n],
            AttnYearMon: YYYYMM,
            verified: 1,
          },
        });

        if (checkAttendanceVerification) {
          notassignedUser.push(userMasterID[n]);
          continue;
        } else {
          assignedUser.push(userMasterID[n]);
        }

        finalDate =
          new Date().getFullYear() +
          '-' +
          (new Date().getMonth() + 1).toString().padStart(2, '0') +
          '-' +
          tempDate;
      } else {
        assignedUser.push(userMasterID[n]);
        finalDate =
          new Date().getFullYear() +
          '-' +
          (new Date().getMonth() + 2).toString().padStart(2, '0') +
          '-' +
          tempDate;
      }

      let applicableDate1 = new Date(finalDate);
      let data = await EmployeeLateEarlyPolicy.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID[n],
          startDate: new Date(applicableDate1),
          status: 1,
        },
      });

      if (!data) {
        let get_one_data = await EmployeeLateEarlyPolicy.findAll({
          where: {
            userMasterID: userMasterID[n],
            status: 1,
          },
        });

        if (get_one_data.length > 0) {
          startdates = [];
          for (var i = 0; i < get_one_data.length; i++) {
            startdates.push(new Date(get_one_data[i].startDate));
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
            let date_change = await EmployeeLateEarlyPolicy.update(
              {
                endDate: new Date(
                  new Date(applicableDate1).getTime() - 86400000
                ),
              },
              {
                where: {
                  startDate: nearestPastDate(
                    dateArr,
                    new Date(applicableDate1)
                  ),
                  userMasterID: userMasterID[n],
                },
              }
            );
          }
          if (nearestFutureDate(dateArr, new Date(applicableDate1)) != null) {
            let insert_db_status = await EmployeeLateEarlyPolicy.create({
              userMasterID: userMasterID[n],
              lateEarlyPolicyMasterID,
              startDate: applicableDate1,
              endDate:
                nearestFutureDate(
                  dateArr,
                  new Date(applicableDate1)
                ).getTime() - 86400000,
              createBy,
              createByIp,
            });
          } else {
            let insert_db_status = await EmployeeLateEarlyPolicy.create({
              userMasterID: userMasterID[n],
              lateEarlyPolicyMasterID,
              startDate: applicableDate1,
              createBy,
              createByIp,
            });
          }
        } else {
          let insert_db_status = await EmployeeLateEarlyPolicy.create({
            userMasterID: userMasterID[n],
            lateEarlyPolicyMasterID,
            startDate: applicableDate1,
            createBy,
            createByIp,
          });
        }
      } else {
        let update_Status = await EmployeeLateEarlyPolicy.update(
          {
            lateEarlyPolicyMasterID: lateEarlyPolicyMasterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeLateEarlyPolicyID: data.employeeLateEarlyPolicyID,
            },
          }
        );
      }
    }

    let Notassigned = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: notassignedUser,
        status: 1,
      },
      attributes: ['displayName'],
    });

    let message = '';

    message =
      'Bulk Latein Earlygo policy has been assigned to (' +
      assignedUser.length +
      ') users. <br><br>';

    let notassignname = '';

    for (var i = 0; i < Notassigned.length; i++) {
      notassignname = notassignname + Notassigned[i].displayName + ',';
    }
    if (Notassigned.length > 0) {
      message =
        message +
        'Bulk Latein Earlygo policy has not been assigned to ' +
        notassignname +
        ' because attendance already verfied.';
    }

    res.status(200).json({ status: 200, message: message, data: {} });
  } catch (err) {
    next(err);
  }
};
