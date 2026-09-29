const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const EmployeeDepartment = require('../models/employeeDepartment');
const companyMasters = require('../models/companyMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
var nearest = require('nearest-date');
const attendanceTransaction = require('../models/attendanceTransaction');
const { executeQuery } = require('./common.controller');
const { accessibleUsers, asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const Department = require('../models/department');
const {
  postAddEmployeeBranchBULK,
} = require('../controllers/employeeBranch.controller');
const { userAttributes } = require('../utils/commonVars');

/**
 * save employee department data.
 *
 * @body {createBy} createBy user id of user who added the employee department.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddEmployeeDepartment = async (req, res, next) => {
  try {
    let { userMasterID, departmentID, applicableDate, createBy, createByIp } =
      await req.body;

    // let currdate = new Date().toISOString().slice(0, 10);
    // let inputDate = new Date(applicableDate).toISOString().slice(0, 10);
    // if (currdate > inputDate) {
    //   return res.status(200).json({
    //     status: 401,
    //     message: 'Applicable Date cannot be of past',
    //     data: {},
    //   });
    // } else {

    const data = await EmployeeDepartment.findOne({
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
      });

    let get_one_data = await EmployeeDepartment.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

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
        await EmployeeDepartment.update(
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
        let insert_db_status = await EmployeeDepartment.create({
          userMasterID,
          departmentID,
          applicableDate,
          endDate:
            nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
            86400000,
          createBy,
          createByIp,
        });
        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeedepartmentadd,
          data: {},
        });
      } else {
        await sequelize.transaction(async (t) => {
          await EmployeeDepartment.create(
            {
              userMasterID,
              departmentID,
              applicableDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
        });

        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeedepartmentadd,
          data: {},
        });
      }
    } else {
      await sequelize.transaction(async (t) => {
        await EmployeeDepartment.create(
          {
            userMasterID,
            departmentID,
            applicableDate,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
      });
      return res.status(200).json({
        status: 200,
        message: message.usermessage.employeedepartmentadd,
        data: {},
      });
    }

    // }
  } catch (err) {
    next(err);
  }
};

/**
 return all employee department data
 */

exports.getAllEmployeeDepartmentData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_department, count } =
      await EmployeeDepartment.findAndCountAll({
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
            model: Department,
            as: 'department',
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
 * @param {id} employeeDepartmentID  to fetch employee department
 */

exports.getEmployeeDepartmentById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeDepartment.findOne({
      where: {
        employeeDepartmentID: req.params.id,
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

exports.getEmployeeDepartmentByUserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeDepartment.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['applicableDate', 'ASC']],
      include: [
        {
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          model: Department,
          as: "department",
          include: [
            {
              model: UserMaster,
              as: "createdByUserDetails",
              attributes: userAttributes,

            },
            {
              required: false,
              model: UserMaster,
              as: "updatedByUserDetails",
              attributes: userAttributes,
            }
          ]
        },
      ],
    });

    if (get_one_data.length == 1) {
      get_one_data[0].dataValues.showDelete = true;
      if (
        new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.departmentstatus = 'deactive';
      } else {
        get_one_data[0].dataValues.departmentstatus = 'active';
      }
    } else {
      let startdates = [];
      for (let j = 0; j < get_one_data.length; j++) {
        startdates.push(new Date(get_one_data[j].applicableDate));
      }
      if (startdates.length > 0) {
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
            get_one_data[i].dataValues.departmentstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
            get_one_data[i].dataValues.departmentstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D2 == null && D1 <= D3) {
            get_one_data[i].dataValues.departmentstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[i].dataValues.departmentstatus = 'active';
              get_one_data[i].dataValues.showDelete = true;
            } else {
              get_one_data[i].dataValues.departmentstatus = 'deactive';
              get_one_data[i].dataValues.showDelete = false;
            }
          } else {
            get_one_data[i].dataValues.departmentstatus = 'deactive';
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
 * @param {id} employeeDepartmentID  to update id
 */
exports.postUpdateEmployeeDepartment = async (req, res, next) => {
  try {
    let = {
      employeeDepartmentID,
      userMasterID,
      departmentID,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await EmployeeDepartment.findOne({
      where: {
        userMasterID: userMasterID,
        employeeDepartmentID: { [Sequelize.Op.notIn]: [employeeDepartmentID] },
        applicableDate: new Date(applicableDate),
        status: 1,
      },
    });
    if (!data) {
      let get_one_data = await EmployeeDepartment.findAll({
        where: {
          userMasterID: userMasterID,
          employeeDepartmentID: {
            [Sequelize.Op.notIn]: [employeeDepartmentID],
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
        const reverse = dateArr.reverse();

        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };

        const nearestFutureDate = (dateArr, date) => {
          const futArr = dateArr.filter((n) => n >= date);
          return futArr.length > 0 ? futArr[0] : null;
        };

        if (nearestPastDate(dateArr, new Date(applicableDate)) != null) {
          let date_change = await EmployeeDepartment.update(
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
          let insert_db_status = await EmployeeDepartment.update(
            {
              userMasterID,
              departmentID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeDepartmentID: employeeDepartmentID,
              },
            }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.employeedepartmentupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeDepartment.update(
              {
                userMasterID,
                departmentID,
                applicableDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeDepartmentID: employeeDepartmentID,
                },
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.employeedepartmentupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeDepartment.update(
            {
              userMasterID,
              departmentID,
              applicableDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeDepartmentID: employeeDepartmentID,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeedepartmentupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      res.status(200).json({
        status: 401,
        message: message.usermessage.employeedepartmentpolicydate,
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
 * @param {id} employeeDepartmentID  to update status of employee department
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeDepartmentID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeeDepartment.update(
          {
            status: '1',
          },
          {
            where: {
              employeeDepartmentID: employeeDepartmentID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await EmployeeDepartment.update(
          {
            status: '0',
          },
          {
            where: {
              employeeDepartmentID: employeeDepartmentID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.employeedepartmentdelete,
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
 * @param {id} employeeDepartmentID  to delete id
 */

exports.postDeleteEmployeeDepartmentById = async (req, res, next) => {
  try {
    const { employeeDepartmentID, userMasterID } = await req.body;

    const get_All_Data = await EmployeeDepartment.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const get_one_data = get_All_Data.filter(
      (e) => e.employeeDepartmentID != employeeDepartmentID
    );
    const current_Data = get_All_Data.find(
      (e) => e.employeeDepartmentID == employeeDepartmentID
    );

    await sequelize.transaction(async (t) => {
      if (get_one_data.length > 0) {
        let startdates = [];
        for (let i = 0; i < get_one_data.length; i++) {
          startdates.push(new Date(get_one_data[i].applicableDate));
        }
        const dateArr = startdates.sort((a, b) => a - b);
        const get_previous_data = current_Data;

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
            await EmployeeDepartment.update(
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
            await EmployeeDepartment.update(
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

      await EmployeeDepartment.update(
        {
          status: 2,
        },
        {
          where: {
            employeeDepartmentID: employeeDepartmentID,
          },
        },
        { transaction: t }
      );
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.employeedepartmentdelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} employeeDepartmentID  to change status of employee department
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date();

    let get_data = await EmployeeDepartment.findAll({
      attributes: ['userMasterID'],
      where: { applicableDate: today },
    });
    let users = [];
    get_data.forEach((user) => {
      users.push(user.userMasterID);
    });

    let result = await sequelize.transaction(async (t) => {
      let department_active = await EmployeeDepartment.update(
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

      let deactive_prev = await EmployeeDepartment.update(
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
      return deactive_prev;
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeDepartment = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let company_contact, totalcount;

    req.userDetails.accessibleCompanies = companyMasterID;

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
        let get_one_data = await EmployeeDepartment.findAll({
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
        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].applicableDate)
              .toISOString()
              .slice(0, 10) > new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.departmentstatus = 'deactive';
          } else {
            get_one_data[0].dataValues.departmentstatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].applicableDate));
          }
          if (startdates.length > 0) {
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
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D2 == null && D1 <= D3) {
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D3 > D1) {
                if (D1 == past) {
                  get_one_data[k].dataValues.departmentstatus = 'active';
                } else {
                  get_one_data[k].dataValues.departmentstatus = 'deactive';
                }
              } else {
                get_one_data[k].dataValues.departmentstatus = 'deactive';
              }
            }
          }
        }
        company_contact[i].department = get_one_data;
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
        let get_one_data = await EmployeeDepartment.findAll({
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
        if (get_one_data.length == 1) {
          if (
            new Date(get_one_data[0].applicableDate)
              .toISOString()
              .slice(0, 10) > new Date().toISOString().slice(0, 10)
          ) {
            get_one_data[0].dataValues.departmentstatus = 'deactive';
          } else {
            get_one_data[0].dataValues.departmentstatus = 'active';
          }
        } else {
          let startdates = [];
          for (var j = 0; j < get_one_data.length; j++) {
            startdates.push(new Date(get_one_data[j].applicableDate));
          }
          if (startdates.length > 0) {
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
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D2 == null && D1 <= D3) {
                get_one_data[k].dataValues.departmentstatus = 'active';
              } else if (D3 > D1) {
                if (D1 == past) {
                  get_one_data[k].dataValues.departmentstatus = 'active';
                } else {
                  get_one_data[k].dataValues.departmentstatus = 'deactive';
                }
              } else {
                get_one_data[k].dataValues.departmentstatus = 'deactive';
              }
            }
          }
        }
        company_contact[i].department = get_one_data;
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

// exports.postAddEmployeeDepartmentBULK = async (req, res, next) => {
//   try {
//     let = { userMasterID, departmentID, applicableDate, createBy, createByIp } =
//       await req.body;
//     let flag = 0;
//     let removeUser = [];
//     let addUser = [];

//     let currdate = new Date().toISOString().slice(0, 10);
//     let inputDate = new Date(applicableDate).toISOString().slice(0, 10);
//     if (currdate > inputDate) {
//       return res.status(200).json({
//         status: 401,
//         message: 'Applicable Date cannot be of past',
//         data: {},
//       });
//     } else {
//       for (var n = 0; n < userMasterID.length; n++) {
//         let get_one_Attendance = [];
//         get_one_Attendance = await attendanceTransaction.findAll({
//           where: {
//             userMasterID: userMasterID[n],
//             AttendanceDate: applicableDate,
//             Status: 1,
//           },
//         });

//         if (get_one_Attendance.length != 0) {
//           flag = 1;

//           let update_attendance_department = await attendanceTransaction.update(
//             {
//               departmentID: departmentID,
//             },
//             {
//               where: {
//                 userMasterID: userMasterID[n],
//                 AttendanceDate: applicableDate,
//                 Status: 1,
//               },
//             }
//           );
//           // res.status(200)
//           // .json({ status: 200, message: msg, data: [], added: 0 });
//         }

//         {
//           let get_one_Data = await EmployeeDepartment.findOne({
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
//             ' has/have not been assigned this department, because the attendance/department is already present in the applicable date';
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
//             let get_one_data = await EmployeeDepartment.findAll({
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
//                 let date_change = await EmployeeDepartment.update(
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
//                     },
//                   }
//                 );
//               }
//               if (
//                 nearestFutureDate(dateArr, new Date(applicableDate)) != null
//               ) {
//                 let insert_db_status = await EmployeeDepartment.create({
//                   userMasterID: userMasterID[n],
//                   departmentID,
//                   applicableDate,
//                   endDate:
//                     nearestFutureDate(
//                       dateArr,
//                       new Date(applicableDate)
//                     ).getTime() - 86400000,
//                   createBy,
//                   createByIp,
//                 });

//                 return insert_db_status;
//               } else {
//                 let result = await sequelize.transaction(async (t) => {
//                   let insert_db_status = await EmployeeDepartment.create(
//                     {
//                       userMasterID: userMasterID[n],
//                       departmentID,
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
//                 let insert_db_status = await EmployeeDepartment.create(
//                   {
//                     userMasterID: userMasterID[n],
//                     departmentID,
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
//             message: message.usermessage.employeedepartmentadd,
//             data: [],
//             added: 1,
//           });
//         } else {
//           for (var n = 0; n < addUser.length; n++) {
//             let get_one_data = await EmployeeDepartment.findAll({
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
//                 let date_change = await EmployeeDepartment.update(
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
//                 let insert_db_status = await EmployeeDepartment.create({
//                   userMasterID: addUser[n],
//                   departmentID,
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
//                   let insert_db_status = await EmployeeDepartment.create(
//                     {
//                       userMasterID: addUser[n],
//                       departmentID,
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
//                 let insert_db_status = await EmployeeDepartment.create(
//                   {
//                     userMasterID: addUser[n],
//                     departmentID,
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
//             ' has/have not been assigned this Department, because the attendance/department is already present in the applicable date';
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
//     }
//   } catch (err) {
//     next(err);
//   }
// };

exports.postAddEmployeeDepartmentBULK = async (req, res, next) => {
  try {
    const { userMasterID, departmentID, applicableDate, createBy, createByIp } =
      await req.body;

    const userMasterIDs = userMasterID;

    const AllEmployeeDepartment = await EmployeeDepartment.findAll({
      where: {
        userMasterID: userMasterIDs,
        status: 1,
      },
    });

    await sequelize.transaction(async (t) => {
      for (let n = 0; n < userMasterIDs.length; n++) {
        const userMasterID = userMasterIDs[n];

        const currentData = AllEmployeeDepartment.find(
          (e) =>
            e.userMasterID == userMasterID &&
            new Date(e.applicableDate).getTime() ==
            new Date(applicableDate).getTime()
        );

        if (currentData) {
          await EmployeeDepartment.update(
            {
              departmentID,
              updateBy: createBy,
              updateByIp: createByIp,
            },
            {
              where: {
                employeeDepartmentID: currentData.employeeDepartmentID,
              },
              transaction: t,
            }
          );
          continue;
        }

        const get_one_data = AllEmployeeDepartment.filter(
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
            await EmployeeDepartment.update(
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
            await EmployeeDepartment.create(
              {
                userMasterID,
                departmentID,
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
            await EmployeeDepartment.create(
              {
                userMasterID,
                departmentID,
                applicableDate,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          }
        } else {
          await EmployeeDepartment.create(
            {
              userMasterID,
              departmentID,
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
      message: 'Employee Department Upadted Successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.empcurrentdepartment = async (req, res, next) => {
  try {
    let { departmentid } = await req.body;
    let department_contact;
    let date = new Date().toISOString().slice(0, 10);
    department_contact = await executeQuery(
      `select DISTINCT ed."userMasterID",um."displayName" from "employeeDepartments" as ed left outer join "userMasters" as um on ed."userMasterID"=um."userMasterID" where ed."departmentID"=` +
      departmentid +
      ` and ed."applicableDate" <= '` +
      date +
      `' and (ed."endDate" is null or ed."endDate" > '` +
      date +
      `')
          and ed."status"=1 and um."status"=1`
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.designationget,
      data: department_contact,
    });
  } catch (err) {
    next(err);
  }
};
