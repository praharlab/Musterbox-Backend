const Sequelize = require('sequelize');
const EmployeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const message = require('../response_message/message');
var nearest = require('nearest-date');
const UserMaster = require('../models/userMaster');
const SalaryPolicy = require('../models/employeeSalaryPolicy');
const Salary_policy = require('../models/salaryPolicy');
const sequelize = require('../config/database');
const { app } = require('firebase-admin');
const hrLeavesMonthlyTrans = require('../models/hrLeavesMonthlyTrans');

const {
  userDetails,
  accessibleUsers,
  getHolidayDates,
} = require('../utils/commonUtilFunctions');
const { NUMBER } = require('sequelize');
const companyMaster = require('../models/companyMaster');
const holidayPolicy = require('../models/holidayPolicy');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const { userAttributes } = require('../utils/commonVars');

/**
 * save employee HolidayPolicy data.
 *
 * @body {createBy} createBy user id of user who added the employee HolidayPolicy.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddEmployeeHolidayPolicy = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { userMasterID, holidayPolicyID, monthYear } = req.body;
    let finalEndDate = null;

    const year = monthYear.toString().substring(0, 4);
    const month = monthYear.toString().substring(5, 7);
    const applicableDate = `${year}-${month}-01`;
    const lastDateOfYear = new Date(year, 11, 31);
    const endDate = lastDateOfYear.toISOString().split('T')[0];

    const holidayPolicyExists = await holidayPolicy.findOne({
      raw: true,
      where: {
        holidayPolicyID,
        status: 1,
        holidayYear: {
          [Sequelize.Op.eq]: year,
        },
      },
      transaction,
    });

    if (!holidayPolicyExists) {
      return res.status(400).json({
        message:
          'Cannot assign this Holiday Policy for the selected month/year',
      });
    }

    let employeeHolidayPolicyExist = await EmployeeHolidayPolicy.findOne({
      raw: true,
      where: {
        userMasterID,
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn('date', sequelize.col('applicableDate')),
            '=',
            applicableDate
          ),
        ],
        status: 1,
      },
      transaction,
    });

    if (!employeeHolidayPolicyExist) {
      let employeeHolidayPolicy = await EmployeeHolidayPolicy.findAll({
        where: {
          userMasterID,
          status: 1,
        },
        transaction,
      });

      if (employeeHolidayPolicy.length > 0) {
        const startdates = employeeHolidayPolicy
          .map((policy) => new Date(policy.applicableDate))
          .sort((a, b) => a - b);

        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };

        const nearestFutureDate = (dateArr, date) => {
          const futArr = dateArr.filter((n) => n >= date);
          return futArr.length > 0 ? futArr[0] : null;
        };

        const pastDate = nearestPastDate(startdates, new Date(applicableDate));

        const futureDate = nearestFutureDate(
          startdates,
          new Date(applicableDate)
        );

        if (pastDate != null) {
          await EmployeeHolidayPolicy.update(
            {
              endDate: new Date(new Date(applicableDate).getTime() - 86400000),
            },
            {
              where: {
                applicableDate: pastDate,
                userMasterID,
              },
              transaction,
            }
          );
        }

        if (futureDate != null) {
          await EmployeeHolidayPolicy.create(
            {
              userMasterID,
              holidayPolicyID,
              applicableDate,
              endDate: futureDate.getTime() - 86400000,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          );

          finalEndDate = futureDate.getTime() - 86400000;
        } else {
          await EmployeeHolidayPolicy.create(
            {
              userMasterID,
              holidayPolicyID,
              applicableDate,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          );
        }
      } else {
        await EmployeeHolidayPolicy.create(
          {
            userMasterID,
            holidayPolicyID,
            applicableDate,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          },
          { transaction }
        );
      }
    } else {
      finalEndDate = employeeHolidayPolicyExist.endDate;

      const updateEmpHolidayPolicy = await EmployeeHolidayPolicy.update(
        {
          holidayPolicyID,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.userIpAddress,
        },
        {
          where: {
            employeeholidayPolicyID:
              employeeHolidayPolicyExist.employeeholidayPolicyID,
          },
          transaction,
        }
      );
    }

    const userDetail = await userDetails(userMasterID);

    if (userDetail) {
      const start_Date = new Date(applicableDate).toISOString().slice(0, 10);

      let holidayDates = [];

      holidayDates = await getHolidayDates(
        holidayPolicyID,
        start_Date,
        endDate,
        userMasterID,
        transaction
      );

      await weekoffHolidayTran.destroy(
        {
          where: {
            userMasterID,
            date: {
              [Sequelize.Op.and]: [
                { [Sequelize.Op.gte]: start_Date },
                { [Sequelize.Op.lte]: endDate },
              ],
            },
            tableName: holidayPolicyID ? ['holiday'] : 'holiday',
          },
        },
        { transaction }
      );

      await weekoffHolidayTran.bulkCreate(holidayDates, { transaction });
    }

    await transaction.commit();
    return res
      .status(200)
      .json({ status: 200, message: 'Policy assigned Successfully' });
  } catch (err) {
    console.error(err);
    await transaction.rollback();
    next(err);
  }
};

/**
 return all employee HolidayPolicy data
 */

exports.getAllEmployeeHolidayPolicyData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_HolidayPolicy, count } =
      await EmployeeHolidayPolicy.findAndCountAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        ...paginationQuery,
        order: [['applicableDate', 'ASC']],
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'employee',
            ...accessibleUsers(req.userDetails),
          },
          {
            model: holidayPolicy,
            as: 'HolidayPolicy',
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: employee_HolidayPolicy,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with epmployeeHolidayPolicy id
 *
 * @param {id} holidayPolicyID  to fetch employee HolidayPolicy
 */

exports.getEmployeeHolidayPolicyById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeHolidayPolicy.findOne({
      where: {
        holidayPolicyID: req.params.id,
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
 * @param {id} userMasterID  to fetch employee HolidayPolicy
 */

exports.getEmployeeHolidayPolicyByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeHolidayPolicy.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['applicableDate', 'ASC']],
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
          model: holidayPolicy,
          as: 'HolidayPolicy',
          // include: [
          //   {
          //     model: UserMaster,
          //     as: 'createdByUserDetails',
          //     attributes: userAttributes,
          //   },
          //   {
          //     model: UserMaster,
          //     as: 'updatedByUserDetails',
          //     attributes: userAttributes
          //   },
          // ],
        }
      ],
    });
    if (get_one_data.length == 0) {
    } else if (get_one_data.length == 1) {
      if (
        new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.holidaypolicystatus = 'deactive';
      } else {
        get_one_data[0].dataValues.holidaypolicystatus = 'active';
      }
    } else {
      let startdates = [];
      for (var j = 0; j < get_one_data.length; j++) {
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
      for (var i = 0; i < get_one_data.length; i++) {
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
          get_one_data[i].dataValues.holidaypolicystatus = 'active';
        } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
          get_one_data[i].dataValues.holidaypolicystatus = 'active';
        } else if (D2 == null && D1 <= D3) {
          get_one_data[i].dataValues.holidaypolicystatus = 'active';
        } else if (D3 > D1) {
          if (D1 == past) {
            get_one_data[i].dataValues.holidaypolicystatus = 'active';
          } else {
            get_one_data[i].dataValues.holidaypolicystatus = 'deactive';
          }
        } else {
          get_one_data[i].dataValues.holidaypolicystatus = 'deactive';
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
 * @param {id} holidayPolicyID  to update id
 */
exports.postUpdateEmployeeHolidayPolicy = async (req, res, next) => {
  try {
    let = {
      employeeholidayPolicyID,
      userMasterID,
      holidayPolicyID,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await EmployeeHolidayPolicy.findOne({
      where: {
        userMasterID: userMasterID,
        employeeholidayPolicyID: {
          [Sequelize.Op.notIn]: [employeeholidayPolicyID],
        },
        applicableDate: new Date(applicableDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeHolidayPolicy.findAll({
        where: {
          userMasterID: userMasterID,
          employeeholidayPolicyID: {
            [Sequelize.Op.notIn]: [employeeholidayPolicyID],
          },
          status: 1,
        },
      });

      if (get_one_data.length > 0) {
        startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
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
          let date_change = await EmployeeHolidayPolicy.update(
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
          let insert_db_status = await EmployeeHolidayPolicy.update(
            {
              userMasterID,
              holidayPolicyID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeholidayPolicyID: employeeholidayPolicyID,
              },
            }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.EmployeeHolidayPolicyupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeHolidayPolicy.update(
              {
                userMasterID,
                holidayPolicyID,
                applicableDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeholidayPolicyID: employeeholidayPolicyID,
                },
              },
              { transaction: t }
            );
            res.status(200).json({
              status: 200,
              message: message.usermessage.EmployeeHolidayPolicyupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeHolidayPolicy.update(
            {
              userMasterID,
              holidayPolicyID,
              applicableDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeholidayPolicyID: employeeholidayPolicyID,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.EmployeeHolidayPolicyupdate,
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
 * @param {id} holidayPolicyID  to update status of employee HolidayPolicy
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { holidayPolicyID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await EmployeeHolidayPolicy.update(
        {
          status: '1',
        },
        {
          where: { holidayPolicyID: holidayPolicyID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await EmployeeHolidayPolicy.update(
        {
          status: '0',
        },
        {
          where: { holidayPolicyID: holidayPolicyID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.EmployeeHolidayPolicydelete,
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

/**
 * delete by i
 *
 * @param {id} holidayPolicyID  to delete id
 */
exports.postDeleteEmployeeHolidayPolicyById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { employeeholidayPolicyID, userMasterID } = await req.body;
    let get_one_data = await EmployeeHolidayPolicy.findAll({
      where: {
        userMasterID: userMasterID,
        employeeholidayPolicyID: {
          [Sequelize.Op.notIn]: [employeeholidayPolicyID],
        },
        status: 1,
      },
    });
    if (get_one_data.length > 0) {
      let get_previous_data = await EmployeeHolidayPolicy.findOne({
        where: {
          employeeholidayPolicyID: employeeholidayPolicyID,
        },
      });
      let startdates = [];
      for (let i = 0; i < get_one_data.length; i++) {
        startdates.push({
          applicableDate: new Date(get_one_data[i].applicableDate),
          holidayPolicyID: get_one_data[i].holidayPolicyID,
        });
      }

      const dateArr = startdates.sort(
        (a, b) => a.applicableDate.getTime() - b.applicableDate.getTime()
      );
      const year = get_previous_data.applicableDate
        .toISOString()
        .substring(0, 4);
      const lastDateOfYear = new Date(year, 11, 31);
      const endDate = lastDateOfYear.toISOString().split('T')[0];

      const nearestPastDate = (dateArr, date) => {
        const pastArr = dateArr.filter((n) => n.applicableDate <= date);
        return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
      };
      const nearestFutureDate = (dateArr, date) => {
        const futArr = dateArr.filter((n) => n.applicableDate >= date);
        return futArr.length > 0 ? futArr[0] : null;
      };
      const pastDate = nearestPastDate(
        dateArr,
        new Date(get_previous_data.applicableDate)
      );
      const futureDate = nearestFutureDate(
        dateArr,
        new Date(get_previous_data.applicableDate)
      );

      if (pastDate != null) {
        if (futureDate != null) {
          await EmployeeHolidayPolicy.update(
            {
              endDate: futureDate.applicableDate,
            },
            {
              where: {
                applicableDate: pastDate.applicableDate,
                userMasterID: userMasterID,
              },
            },
            { transaction }
          );
          let holidayDates = [];

          holidayDates = await getHolidayDates(
            futureDate.holidayPolicyID,
            futureDate.applicableDate,
            endDate,
            userMasterID,
            transaction
          );
          await weekoffHolidayTran.destroy(
            {
              where: {
                userMasterID,
                date: {
                  [Sequelize.Op.and]: [
                    { [Sequelize.Op.gte]: futureDate.applicableDate },
                    { [Sequelize.Op.lte]: endDate },
                  ],
                },
                tableName: get_previous_data.holidayPolicyID
                  ? ['holiday']
                  : 'holiday',
              },
            },
            { transaction }
          );
          await weekoffHolidayTran.bulkCreate(holidayDates, transaction);
        } else {
          await EmployeeHolidayPolicy.update(
            {
              endDate: null,
            },
            {
              where: {
                applicableDate: pastDate.applicableDate,
                userMasterID: userMasterID,
              },
            },
            { transaction }
          );
          let holidayDates1 = [];

          holidayDates1 = await getHolidayDates(
            pastDate.holidayPolicyID,
            pastDate.applicableDate,
            endDate,
            userMasterID,
            transaction
          );
          await weekoffHolidayTran.destroy(
            {
              where: {
                userMasterID,
                date: {
                  [Sequelize.Op.and]: [
                    { [Sequelize.Op.gte]: pastDate.applicableDate },
                    { [Sequelize.Op.lte]: endDate },
                  ],
                },
                tableName: get_previous_data.holidayPolicyID
                  ? ['holiday']
                  : 'holiday',
              },
            },
            { transaction }
          );
          await weekoffHolidayTran.bulkCreate(holidayDates1, transaction);
        }
      }
    } else {
      await weekoffHolidayTran.destroy(
        {
          where: {
            userMasterID,
            tableName: 'holiday',
          },
        },
        { transaction }
      );
    }
    await EmployeeHolidayPolicy.update(
      {
        status: 2,
      },
      {
        where: {
          employeeholidayPolicyID: employeeholidayPolicyID,
        },
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.EmployeeHolidayPolicydelete,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} holidayPolicyID  to change status of employee HolidayPolicy
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date();

    let get_data = await EmployeeHolidayPolicy.findAll({
      attributes: ['userMasterID'],
      where: { applicableDate: today },
    });
    let users = [];
    get_data.forEach((user) => {
      users.push(user.userMasterID);
    });
    let HolidayPolicy_active = await EmployeeHolidayPolicy.update(
      {
        status: 1,
      },
      {
        where: { applicableDate: today },
      }
    );

    let deactive_prev = await EmployeeHolidayPolicy.update(
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
      }
    );

  } catch (err) {
    console.log(err);
  }
};

exports.getEmployeeHoliday = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let company_contact = await UserMaster.findAll({
      raw: true,
      where: { status: 1, companyMasterId: req.body.companyMasterID },
      ...accessibleUsers(req.userDetails, false),
      // limit: limit,
      // offset: offset,
    });
    for (let i = 0; i < company_contact.length; i++) {
      let get_one_data = await EmployeeHolidayPolicy.findAll({
        where: {
          userMasterID: company_contact[i].userMasterID,
          status: {
            [Sequelize.Op.in]: [1],
          },
        },
        include: [
          {
            model: UserMaster,
            as: 'employee',
            include: [{ model: companyMaster }],
          },
          { model: holidayPolicy, as: 'HolidayPolicy' },
        ],
        order: [['applicableDate', 'ASC']],
      });
      company_contact[i]['department'] = get_one_data;

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
        for (var j = 0; j < get_one_data.length; j++) {
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

        for (var j = 0; j < get_one_data.length; j++) {
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

      return res
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
    const { userMasterID, holidayPolicyID, monthYear } = req.body;

    const year = monthYear.toString().substring(0, 4);
    const month = monthYear.toString().substring(5, 7);
    const applicableDate = `${year}-${month}-01`;
    const lastDateOfYear = new Date(year, 11, 31);
    const endDate = lastDateOfYear.toISOString().split('T')[0];

    const holidayPolicyExists = await holidayPolicy.findOne({
      raw: true,
      where: {
        holidayPolicyID,
        status: 1,
        holidayYear: {
          [Sequelize.Op.eq]: year,
        },
      },
      transaction,
    });
    if (!holidayPolicyExists) {
      return res.status(200).json({
        status: 400,
        message:
          'Cannot assign this Holiday Policy for the selected month/year',
      });
    }

    for (var n = 0; n < userMasterID.length; n++) {
      let finalEndDate = null;

      let employeeHolidayPolicyExist = await EmployeeHolidayPolicy.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID[n],
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('applicableDate')),
              '=',
              applicableDate
            ),
          ],
          status: 1,
        },
        transaction,
      });
      if (!employeeHolidayPolicyExist) {
        let employeeHolidayPolicy = await EmployeeHolidayPolicy.findAll({
          where: {
            userMasterID: userMasterID[n],
            status: 1,
          },
          transaction,
        });

        if (employeeHolidayPolicy.length > 0) {
          startdates = [];
          for (var i = 0; i < employeeHolidayPolicy.length; i++) {
            startdates.push(new Date(employeeHolidayPolicy[i].applicableDate));
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
            await EmployeeHolidayPolicy.update(
              {
                endDate: new Date(
                  new Date(applicableDate).getTime() - 86400000
                ),
              },
              {
                where: {
                  applicableDate: nearestPastDate(
                    dateArr,
                    new Date(applicableDate)
                  ),
                  userMasterID: userMasterID[n],
                },
                transaction,
              }
            );
          }

          if (nearestFutureDate(dateArr, new Date(applicableDate)) != null) {
            let addEmpHolidayPolicy = await EmployeeHolidayPolicy.create(
              {
                userMasterID: userMasterID[n],
                holidayPolicyID,
                applicableDate,
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(applicableDate)
                  ).getTime() - 86400000,
                createBy: req.userDetails.userMasterId,
                createByIp: req.userDetails.userIpAddress,
              },
              { transaction }
            );
            finalEndDate =
              nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
              86400000;
          } else {
            await EmployeeHolidayPolicy.create(
              {
                userMasterID: userMasterID[n],
                holidayPolicyID,
                applicableDate,
                createBy: req.userDetails.userMasterId,
                createByIp: req.userDetails.userIpAddress,
              },
              { transaction }
            );
          }
        } else {
          await EmployeeHolidayPolicy.create(
            {
              userMasterID: userMasterID[n],
              holidayPolicyID,
              applicableDate,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          );
        }
      } else {
        finalEndDate = employeeHolidayPolicyExist.endDate;

        await EmployeeHolidayPolicy.update(
          {
            holidayPolicyID,
            updateBy: req.userDetails.userMasterId,
            updateByIp: req.userDetails.userIpAddress,
          },
          {
            where: {
              employeeholidayPolicyID:
                employeeHolidayPolicyExist.employeeholidayPolicyID,
            },
            transaction,
          }
        );
      }

      const userDetail = await userDetails(userMasterID[n]);
      if (userDetail) {
        const start_Date = new Date(applicableDate).toISOString().slice(0, 10);
        let holidayDates = await getHolidayDates(
          holidayPolicyID,
          start_Date,
          endDate,
          userMasterID[n],
          transaction
        );

        await weekoffHolidayTran.destroy(
          {
            where: {
              userMasterID: userMasterID[n],
              date: {
                [Sequelize.Op.and]: [
                  { [Sequelize.Op.gte]: start_Date },
                  { [Sequelize.Op.lte]: endDate },
                ],
              },
              tableName: holidayPolicyID ? ['holiday'] : 'holiday',
            },
          },
          { transaction }
        );

        await weekoffHolidayTran.bulkCreate(holidayDates, { transaction });
      }
    }

    await transaction.commit();
    res
      .status(200)
      .json({ status: 200, message: 'Policy assigned Successfully' });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
