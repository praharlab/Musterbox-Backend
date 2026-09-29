const Sequelize = require('sequelize');
const EmployeeBranch = require('../models/employeeBranch');
const companyMasters = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
var nearest = require('nearest-date');
const sequelize = require('../config/database');
const attendanceTransaction = require('../models/attendanceTransaction');
const { executeQuery } = require('./common.controller');
const BranchMaster = require('../models/branchMaster');
const {
  accessibleUsers,
  asiaKolkataDateTime,
  employeeWorkingLocation,
} = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const { attendanceBranchTypeRule } = require('../utils/dbUtils');

/**
 * save employee department data.
 *
 * @body {createBy} createBy user id of user who added the employee department.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddEmployeeBranch = async (req, res, next) => {
  try {
    let { userMasterID, branchMasterID, applicableDate, createBy, createByIp } =
      await req.body;
    let branchID = branchMasterID;

    const data = await EmployeeBranch.findOne({
      where: {
        userMasterID: userMasterID,
        applicableDate: new Date(applicableDate),
        status: 1,
      },
    });
    if (data)
      return res.status(200).json({
        status: 401,
        message: 'Applicable Date already present',
        data: {},
      });

    let get_one_data = await EmployeeBranch.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    if (get_one_data.length > 0) {
      const startdates = [];
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
        let date_change = await EmployeeBranch.update(
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
        let insert_db_status = await EmployeeBranch.create({
          userMasterID,
          branchID,
          applicableDate,
          endDate:
            nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
            86400000,
          createBy,
          createByIp,
        });

        return res.status(200).json({
          status: 200,
          message: message.usermessage.EmployeeBranchadd,
          data: {},
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeBranch.create(
            {
              userMasterID,
              branchID,
              applicableDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          return res.status(200).json({
            status: 200,
            message: message.usermessage.EmployeeBranchadd,
            data: {},
          });
        });
      }
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await EmployeeBranch.create(
          {
            userMasterID,
            branchID,
            applicableDate,
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        return res.status(200).json({
          status: 200,
          message: message.usermessage.EmployeeBranchadd,
          data: {},
        });
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 return all employee department data
 */

exports.getAllEmployeeBranchData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { employee_department, count } = await EmployeeBranch.findAll({
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
          model: BranchMaster,
          as: 'branchMaster',
        },
      ],
    });

    return res
      .status(200)
      .json({ status: 200, data: employee_department, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with epmployeeDepartment id
 *
 * @param {id} employeeBranchID  to fetch employee department
 */

exports.getEmployeeBranchById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeBranch.findOne({
      where: {
        employeeBranchID: req.params.id,
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
 * @param {id} userMasterID  to fetch employee department
 */

exports.getEmployeeBranchByUserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeBranch.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['applicableDate', 'ASC']],
      include: [
        {
          model: BranchMaster,
          as: 'branchMaster',
          include: [
            {
              model: UserMaster,
              as: 'createdByUserDetails',
              attributes: userAttributes,
            },
            {
              required: false,
              model: UserMaster,
              as: 'updatedByUserDetails',
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    if (get_one_data.length > 0) {
      if (get_one_data.length == 1) {
        get_one_data[0].dataValues.showDelete = true;
        if (
          new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].dataValues.branchpolicystatus = 'deactive';
        } else {
          get_one_data[0].dataValues.branchpolicystatus = 'active';
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
            get_one_data[i].dataValues.branchpolicystatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
            get_one_data[i].dataValues.branchpolicystatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D2 == null && D1 <= D3) {
            get_one_data[i].dataValues.branchpolicystatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[i].dataValues.branchpolicystatus = 'active';
              get_one_data[i].dataValues.showDelete = true;
            } else {
              get_one_data[i].dataValues.branchpolicystatus = 'deactive';
              get_one_data[i].dataValues.showDelete = false;
            }
          } else {
            get_one_data[i].dataValues.branchpolicystatus = 'deactive';
            get_one_data[i].dataValues.showDelete = true;
          }
        }
      }
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} employeeBranchID  to update id
 */
exports.postUpdateEmployeeBranch = async (req, res, next) => {
  try {
    let = {
      employeeBranchID,
      userMasterID,
      branchMasterID,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;
    let branchID = branchMasterID;
    let data = await EmployeeBranch.findOne({
      where: {
        userMasterID: userMasterID,
        employeeBranchID: { [Sequelize.Op.notIn]: [employeeBranchID] },
        applicableDate: new Date(applicableDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeBranch.findAll({
        where: {
          userMasterID: userMasterID,
          employeeBranchID: { [Sequelize.Op.notIn]: [employeeBranchID] },
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
          let date_change = await EmployeeBranch.update(
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
          let insert_db_status = await EmployeeBranch.update(
            {
              userMasterID,
              branchID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeBranchID: employeeBranchID,
              },
            }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.EmployeeBranchupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeBranch.update(
              {
                userMasterID,
                branchID,
                applicableDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeBranchID: employeeBranchID,
                },
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.EmployeeBranchupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeBranch.update(
            {
              userMasterID,
              branchID,
              applicableDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeBranchID: employeeBranchID,
              },
            },
            { transaction: t }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.EmployeeBranchupdate,
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
 * @param {id} employeeBranchID  to update status of employee department
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeBranchID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await EmployeeBranch.update(
        {
          status: '1',
        },
        {
          where: { employeeBranchID: employeeBranchID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await EmployeeBranch.update(
        {
          status: '0',
        },
        {
          where: { employeeBranchID: employeeBranchID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.EmployeeBranchdelete,
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
 * @param {id} employeeBranchID  to delete id
 */
exports.postDeleteEmployeeBranchById = async (req, res, next) => {
  try {
    const { employeeBranchID, userMasterID } = await req.body;

    const get_All_Data = await EmployeeBranch.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const currentData = get_All_Data.find(
      (e) => e.employeeBranchID == employeeBranchID
    );

    const get_one_data = get_All_Data.filter(
      (e) => e.employeeBranchID != employeeBranchID
    );

    await sequelize.transaction(async (t) => {
      if (get_one_data.length > 0) {
        let startdates = [];
        for (let i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].applicableDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);

        const get_previous_data = currentData;

        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };

        const nearestFutureDate = (dateArr, date) => {
          const futArr = dateArr.filter((n) => n >= date);
          return futArr.length > 0 ? futArr[0] : null;
        };

        if (
          nearestPastDate(
            dateArr,
            new Date(get_previous_data.applicableDate)
          ) != null
        ) {
          if (
            nearestFutureDate(
              dateArr,
              new Date(get_previous_data.applicableDate)
            ) != null
          ) {
            await EmployeeBranch.update(
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
                transaction: t,
              }
            );
          } else {
            await EmployeeBranch.update(
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
                transaction: t,
              }
            );
          }
        }
      }

      await EmployeeBranch.update(
        {
          status: 2,
        },
        {
          where: {
            employeeBranchID: employeeBranchID,
          },
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.EmployeeBranchdelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} employeeBranchID  to change status of employee department
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date();

    let get_data = await EmployeeBranch.findAll({
      attributes: ['userMasterID'],
      where: { applicableDate: today },
    });
    let users = [];
    get_data.forEach((user) => {
      users.push(user.userMasterID);
    });
    let department_active = await EmployeeBranch.update(
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
      }
    );

    let deactive_prev = await EmployeeBranch.update(
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
    next(err);
  }
};

exports.getEmployeeBranch = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let company_contact, totalcount;

    if (companyMasterID) req.userDetails.accessibleCompanies = companyMasterID;

    if (searchQuery && page && limit) {
      company_contact = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        where: {
          companyMasterId: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userMaster.userMasterID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
        ...accessibleUsers(req.userDetails, false),
      });
      for (let i = 0; i < company_contact.length; i++) {
        let get_one_data = await EmployeeBranch.findAll({
          where: {
            userMasterID: company_contact[i].userMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          order: [['applicableDate', 'ASC']],
          limit: limit,
          offset: offset,
        });

        //active - deactive
        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].applicableDate)
              .toISOString()
              .slice(0, 10) > new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.branchpolicystatus = 'deactive';
          } else {
            get_one_data[0].dataValues.branchpolicystatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].applicableDate));
          }
          if (startdates.length > 1) {
            const dateArr = startdates.sort((a, b) => a - b);
            const nearestPastDate = (dateArr, date) => {
              const pastArr = dateArr.filter((n) => n <= date);
              return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
            };
            let past = nearestPastDate(dateArr, new Date());
            if (past) {
              past = past.toISOString().slice(0, 10);
            }
            for (var k = 0; k < get_one_data.length; k++) {
              let D1 = new Date(get_one_data[k].applicableDate)
                .toISOString()
                .slice(0, 10);
              let D2;
              if (get_one_data[k].endDate == null) {
                D2 = null;
              } else {
                D2 = new Date(get_one_data[k].endDate)
                  .toISOString()
                  .slice(0, 10);
              }

              let D3 = new Date().toISOString().slice(0, 10);
              if (D3 == D1) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D2 == null && D1 <= D3) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D3 > D1) {
                if (D1 == past) {
                  get_one_data[k].dataValues.branchpolicystatus = 'active';
                } else {
                  get_one_data[k].dataValues.branchpolicystatus = 'deactive';
                }
              } else {
                get_one_data[k].dataValues.branchpolicystatus = 'deactive';
              }
            }
          }
        }

        company_contact[i].branch = get_one_data;
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          companyMasterId: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userMaster.userMasterID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: 1,
        },
      });
    } else {
      company_contact = await UserMaster.findAll({
        raw: true,
        limit: limit,
        offset: offset,
        where: {
          status: 1,
          companyMasterId: {
            [Sequelize.Op.in]: companyMasterID,
          },
        },
        ...accessibleUsers(req.userDetails, false),
      });
      for (let i = 0; i < company_contact.length; i++) {
        let get_one_data = await EmployeeBranch.findAll({
          where: {
            userMasterID: Number(company_contact[i].userMasterID),
            status: 1,
          },
          order: [['applicableDate', 'ASC']],
          limit: limit,
          offset: offset,
        });

        //active - deactive
        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].applicableDate)
              .toISOString()
              .slice(0, 10) > new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.branchpolicystatus = 'deactive';
          } else {
            get_one_data[0].dataValues.branchpolicystatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].applicableDate));
          }
          if (startdates.length > 1) {
            const dateArr = startdates.sort((a, b) => a - b);
            const nearestPastDate = (dateArr, date) => {
              const pastArr = dateArr.filter((n) => n <= date);
              return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
            };
            let past = nearestPastDate(dateArr, new Date());
            if (past) {
              past = past.toISOString().slice(0, 10);
            }
            for (var k = 0; k < get_one_data.length; k++) {
              let D1 = new Date(get_one_data[k].applicableDate)
                .toISOString()
                .slice(0, 10);
              let D2;
              if (get_one_data[k].endDate == null) {
                D2 = null;
              } else {
                D2 = new Date(get_one_data[k].endDate)
                  .toISOString()
                  .slice(0, 10);
              }

              let D3 = new Date().toISOString().slice(0, 10);
              if (D3 == D1) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D2 == null && D1 <= D3) {
                get_one_data[k].dataValues.branchpolicystatus = 'active';
              } else if (D3 > D1) {
                if (D1 == past) {
                  get_one_data[k].dataValues.branchpolicystatus = 'active';
                } else {
                  get_one_data[k].dataValues.branchpolicystatus = 'deactive';
                }
              } else {
                get_one_data[k].dataValues.branchpolicystatus = 'deactive';
              }
            }
          }
        }

        if (get_one_data) {
          company_contact[i]['branch'] = get_one_data;
        } else {
          company_contact[i]['branch'] = [];
        }
      }
      totalcount = await UserMaster.count({
        raw: true,
        where: {
          status: 1,
          companyMasterId: {
            [Sequelize.Op.in]: companyMasterID,
          },
        },
      });
    }
    if (company_contact) {
      res
        .status(200)
        .json({ status: 200, data: company_contact, totalcount: totalcount });
    }
  } catch (err) {
    next(err);
  }
};

// exports.postAddEmployeeBranchBULK = async (req, res, next) => {
//   try {
//     let { userMasterID, branchID, applicableDate, createBy, createByIp } =
//       await req.body;
//     let flag = 0;
//     let removeUser = [];
//     let addUser = [];
//     let currdate = new Date().toISOString().slice(0, 10);
//     let inputDate = new Date(applicableDate).toISOString().slice(0, 10);

//     const AllEmployeeBranch = await EmployeeBranch.findAll({
//       where: {
//         userMasterID: userMasterID,
//         status: 1,
//       },
//     });

//     // if (currdate > inputDate) {
//     //   return res.status(200).json({
//     //     status: 401,
//     //     message: 'Applicable Date cannot be of past',
//     //     data: {},
//     //   });
//     // } else {
//       for (let n = 0; n < userMasterID.length; n++) {
//         // let get_one_Attendance = [];
//         // get_one_Attendance = await attendanceTransaction.findAll({
//         //   where: {
//         //     userMasterID: Number(userMasterID[n]),
//         //     AttendanceDate: applicableDate,
//         //     Status: 1,
//         //   },
//         // });

//         // if (get_one_Attendance.length != 0) {
//         //   flag = 1;

//         //   let update_attendance_department = await attendanceTransaction.update(
//         //     {
//         //       branchID: branchID,
//         //     },
//         //     {
//         //       where: {
//         //         userMasterID: Number(userMasterID[n]),
//         //         AttendanceDate: applicableDate,
//         //         Status: 1,
//         //       },
//         //     }
//         //   );
//         //   // res.status(200)
//         //   // .json({ status: 200, message: msg, data: [], added: 0 });
//         // }

//         {
//           let get_one_Data = await EmployeeBranch.findOne({
//             where: {
//               userMasterID: Number(userMasterID[n]),
//               applicableDate: new Date(applicableDate),
//               status: 1,
//             },
//           });
//           if (get_one_Data) {
//             removeUser.push(Number(userMasterID[n]));
//           } else {
//             addUser.push(Number(userMasterID[n]));
//           }
//         }
//       }
//       if (userMasterID.length > 0) {
//         if (
//           removeUser.length == userMasterID.length &&
//           userMasterID.length > 0
//         ) {
//           let msg =
//             ' has/have not been assigned this Branch, because the attendance/branch is already present in the applicable date';
//           for (var i = 0; i < removeUser.length; i++) {
//             let user_Data = await UserMaster.findOne({
//               where: {
//                 userMasterID: Number(removeUser[i]),
//                 status: 1,
//               },
//             });
//             if (i == 0) {
//               msg = user_Data.displayName + msg;
//             } else {
//               msg = user_Data.displayName + ', ' + msg;
//             }
//           }

//           res.status(200).json({
//             status: 200,
//             message: msg,
//             addUser: addUser,
//             removeUser: removeUser,
//             added: 0,
//           });
//         } else if (
//           addUser.length == userMasterID.length &&
//           userMasterID.length > 0
//         ) {
//           for (var n = 0; n < userMasterID.length; n++) {
//             let get_one_data = await EmployeeBranch.findAll({
//               where: {
//                 userMasterID: userMasterID[n],
//                 status: 1,
//               },
//             });

//             if (get_one_data.length > 0) {
//               startdates = [];
//               for (var i = 0; i < get_one_data.length; i++) {
//                 startdates.push(new Date(get_one_data[i].applicableDate));
//               }

//               const dateArr = startdates.sort((a, b) => a - b);
//               const nearestPastDate = (dateArr, date) => {
//                 const pastArr = dateArr.filter((n) => n <= date);
//                 return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
//               };

//               const nearestFutureDate = (dateArr, date) => {
//                 const futArr = dateArr.filter((n) => n >= date);
//                 return futArr.length > 0 ? futArr[0] : null;
//               };

//               if (nearestPastDate(dateArr, new Date(applicableDate)) != null) {
//                 let date_change = await EmployeeBranch.update(
//                   {
//                     endDate: new Date(
//                       new Date(applicableDate).getTime() - 86400000
//                     ),
//                   },
//                   {
//                     where: {
//                       applicableDate: nearestPastDate(
//                         dateArr,
//                         new Date(applicableDate)
//                       ),
//                       userMasterID: userMasterID[n],
//                     },
//                   }
//                 );
//               }
//               if (
//                 nearestFutureDate(dateArr, new Date(applicableDate)) != null
//               ) {
//                 let insert_db_status = await EmployeeBranch.create({
//                   userMasterID: userMasterID[n],
//                   branchID,
//                   applicableDate,
//                   endDate:
//                     nearestFutureDate(
//                       dateArr,
//                       new Date(applicableDate)
//                     ).getTime() - 86400000,
//                   createBy,
//                   createByIp,
//                 });
//               } else {
//                 let result = await sequelize.transaction(async (t) => {
//                   let insert_db_status = await EmployeeBranch.create(
//                     {
//                       userMasterID: userMasterID[n],
//                       branchID,
//                       applicableDate,
//                       createBy,
//                       createByIp,
//                     },
//                     { transaction: t }
//                   );
//                 });
//               }
//             } else {
//               let result = await sequelize.transaction(async (t) => {
//                 let insert_db_status = await EmployeeBranch.create(
//                   {
//                     userMasterID: userMasterID[n],
//                     branchID,
//                     applicableDate,
//                     createBy,
//                     createByIp,
//                   },
//                   { transaction: t }
//                 );
//               });
//             }
//           }

//           res.status(200).json({
//             status: 200,
//             added: 1,
//             message: message.usermessage.EmployeeBranchadd,
//             data: {},
//           });
//         } else {
//           for (var n = 0; n < addUser.length; n++) {
//             let get_one_data = await EmployeeBranch.findAll({
//               where: {
//                 userMasterID: addUser[n],
//                 status: 1,
//               },
//             });

//             if (get_one_data.length > 0) {
//               startdates = [];
//               for (var i = 0; i < get_one_data.length; i++) {
//                 startdates.push(new Date(get_one_data[i].applicableDate));
//               }

//               const dateArr = startdates.sort((a, b) => a - b);
//               const nearestPastDate = (dateArr, date) => {
//                 const pastArr = dateArr.filter((n) => n <= date);
//                 return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
//               };

//               const nearestFutureDate = (dateArr, date) => {
//                 const futArr = dateArr.filter((n) => n >= date);
//                 return futArr.length > 0 ? futArr[0] : null;
//               };

//               if (nearestPastDate(dateArr, new Date(applicableDate)) != null) {
//                 let date_change = await EmployeeBranch.update(
//                   {
//                     endDate: new Date(
//                       new Date(applicableDate).getTime() - 86400000
//                     ),
//                   },
//                   {
//                     where: {
//                       applicableDate: nearestPastDate(
//                         dateArr,
//                         new Date(applicableDate)
//                       ),
//                       userMasterID: addUser[n],
//                     },
//                   }
//                 );
//               }
//               if (
//                 nearestFutureDate(dateArr, new Date(applicableDate)) != null
//               ) {
//                 let insert_db_status = await EmployeeBranch.create({
//                   userMasterID: addUser[n],
//                   branchID,
//                   applicableDate,
//                   endDate:
//                     nearestFutureDate(
//                       dateArr,
//                       new Date(applicableDate)
//                     ).getTime() - 86400000,
//                   createBy,
//                   createByIp,
//                 });
//               } else {
//                 let result = await sequelize.transaction(async (t) => {
//                   let insert_db_status = await EmployeeBranch.create(
//                     {
//                       userMasterID: addUser[n],
//                       branchID,
//                       applicableDate,
//                       createBy,
//                       createByIp,
//                     },
//                     { transaction: t }
//                   );
//                 });
//               }
//             } else {
//               let result = await sequelize.transaction(async (t) => {
//                 let insert_db_status = await EmployeeBranch.create(
//                   {
//                     userMasterID: addUser[n],
//                     branchID,
//                     applicableDate,
//                     createBy,
//                     createByIp,
//                   },
//                   { transaction: t }
//                 );
//               });
//             }
//           }

//           let msg =
//             ' has/have not been assigned this branch, because the attendance/branch is already present in the applicable date';
//           for (var i = 0; i < removeUser.length; i++) {
//             let user_Data = await UserMaster.findOne({
//               where: {
//                 userMasterID: Number(removeUser[i]),
//                 status: 1,
//               },
//             });
//             if (i == 0) {
//               msg = user_Data.displayName + msg;
//             } else {
//               msg = user_Data.displayName + ', ' + msg;
//             }
//           }

//           res.status(200).json({
//             status: 200,
//             message: msg,
//             data: addUser,
//             added: 0,
//           });
//         }
//       } else {
//         res.status(200).json({
//           status: 200,
//           message: 'User Empty',
//           data: [],
//           added: 1,
//         });
//       }
//     // }
//   } catch (err) {
//     next(err);
//   }
// };

exports.postAddEmployeeBranchBULK = async (req, res, next) => {
  try {
    const { userMasterID, branchID, applicableDate, createBy, createByIp } =
      await req.body;
    const userMasterIDs = userMasterID;

    const AllEmployeeBranch = await EmployeeBranch.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    await sequelize.transaction(async (t) => {
      for (let n = 0; n < userMasterIDs.length; n++) {
        const userMasterID = userMasterIDs[n];

        const currentData = AllEmployeeBranch.find(
          (e) =>
            e.userMasterID == userMasterID &&
            new Date(e.applicableDate).getTime() ==
              new Date(applicableDate).getTime()
        );

        if (currentData) {
          await EmployeeBranch.update(
            {
              branchID,
              updateBy: createBy,
              updateByIp: createByIp,
            },
            {
              where: {
                employeeBranchID: currentData.employeeBranchID,
              },
              transaction: t,
            }
          );
          continue;
        }

        const get_one_data = AllEmployeeBranch.filter(
          (e) => e.userMasterID == userMasterID
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

          if (nearestPastDate(dateArr, new Date(applicableDate)) != null) {
            await EmployeeBranch.update(
              {
                endDate: new Date(
                  new Date(applicableDate).getTime() - 86400000
                ),
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  applicableDate: nearestPastDate(
                    dateArr,
                    new Date(applicableDate)
                  ),
                  userMasterID: userMasterID,
                },
                transaction: t,
              }
            );
          }
          if (nearestFutureDate(dateArr, new Date(applicableDate)) != null) {
            await EmployeeBranch.create(
              {
                userMasterID,
                branchID,
                applicableDate,
                endDate:
                  nearestFutureDate(
                    dateArr,
                    new Date(applicableDate)
                  ).getTime() - 86400000,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          } else {
            await EmployeeBranch.create(
              {
                userMasterID,
                branchID,
                applicableDate,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          }
        } else {
          await EmployeeBranch.create(
            {
              userMasterID,
              branchID,
              applicableDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
        }
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Employee Branch Updated Successfully.',
    });

    // }
  } catch (err) {
    next(err);
  }
};

exports.empcurrentbranch = async (req, res, next) => {
  try {
    let { branchMasterID } = await req.body;
    let branch_contact;
    let date = new Date().toISOString().slice(0, 10);
    branch_contact = await executeQuery(
      `select DISTINCT eb."userMasterID",um."displayName" from "employeeBranches" as eb left outer join "userMasters" as um on eb."userMasterID"=um."userMasterID" where eb."branchID"=` +
        branchMasterID +
        ` and eb."applicableDate" <= '` +
        date +
        `' and (eb."endDate" is null or eb."endDate" > '` +
        date +
        `')
             and eb."status"=1 and um."status"=1`
    );

    return res
      .status(200)
      .json({ status: 200, message: {}, data: branch_contact });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeBranchByAttendacePolicy = async (req, res, next) => {
  try {
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);
    const userMasterID = req.params.id;
    const user_details = await UserMaster.findOne({
      where: {
        userMasterID,
        status: 1,
      },
      include: [
        {
          required: false,
          separate: true,
          model: EmployeeAttendancePolicy,
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
          attributes: ['attendancePolicyID'],
          include: [
            {
              model: AttendancePolicy,
              as: 'attendancePolicy',
            },
          ],
        },
        {
          separate: true,
          required: false,
          model: EmployeeBranch,
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
          attributes: ['branchID'],
          include: [
            {
              model: BranchMaster,
              as: 'branchMaster',
            },
          ],
        },
      ],
    });

    if (!user_details) {
      return res.status(200).json({
        status: 401,
        message: 'User details not found',
        data: {},
      });
    }
    const employeeAttendancePolicy =
      user_details?.employeeAttendancePolicies?.[0]?.attendancePolicy || null;
    const employeeBranch =
      user_details?.employeeBranches?.[0]?.branchMaster || null;

    const branchMasterCondition = {
      companyMasterID: req.userDetails.companyMasterId,
      status: 1,
    };
    if (employeeAttendancePolicy) {
      if (
        employeeAttendancePolicy.attBrType == attendanceBranchTypeRule.SELECTED
      ) {
        branchMasterCondition.branchMasterID = {
          [Sequelize.Op.in]: employeeAttendancePolicy.attBranch?.map((e) => +e),
        };
      } else if (
        employeeAttendancePolicy.attBrType == attendanceBranchTypeRule.ASSIGNED
      ) {
        if (employeeBranch) {
          branchMasterCondition.branchMasterID = +employeeBranch.branchMasterID;
        } else {
          return res.status(200).json({ status: 200, data: [] });
        }
      }
    }
    const responseArray = [];
    const all_company_branch = await BranchMaster.findAll({
      where: branchMasterCondition,
    });
    responseArray.push(...all_company_branch);
    const allWorkingLocation = await employeeWorkingLocation(
      userMasterID,
      new Date(date)
    );
    for (let location of allWorkingLocation) {
      const obj = {
        branchMasterID: location.workingLocationID,
        branchName: location.workingLocationName,
        branchCode: '',
        branchAddress: location.workingLocationAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius,
        status: location.status,
        companyMasterID: location.companyMasterID,
      };
      responseArray.push(obj);
    }
    return res.status(200).json({ status: 200, data: responseArray });
  } catch (err) {
    next(err);
  }
};
