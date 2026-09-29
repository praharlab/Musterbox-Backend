const Sequelize = require('sequelize');
const EmployeeDesignation = require('../models/employeeDesignation');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMasters = require('../models/companyMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
var nearest = require('nearest-date');
const attendanceTransaction = require('../models/attendanceTransaction');
const Designation = require('../models/designation');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

/**
 * save employee designation data.
 *
 * @body {createBy} createBy user id of user who added the employee designation.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddEmployeeDesignation = async (req, res, next) => {
  try {
    let { userMasterID, designationID, applicableDate, createBy, createByIp } =
      await req.body;

    const data = await EmployeeDesignation.findOne({
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

    let get_one_data = await EmployeeDesignation.findAll({
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
        await EmployeeDesignation.update(
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
        await sequelize.transaction(async (t) => {
          await EmployeeDesignation.create(
            {
              userMasterID,
              designationID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
        });

        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeedesignationadd,
          data: {},
        });
      } else {
        await sequelize.transaction(async (t) => {
          await EmployeeDesignation.create(
            {
              userMasterID,
              designationID,
              applicableDate,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
        });

        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeedesignationadd,
          data: {},
        });
      }
    } else {
      await sequelize.transaction(async (t) => {
        await EmployeeDesignation.create(
          {
            userMasterID,
            designationID,
            applicableDate,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
      });

      return res.status(200).json({
        status: 200,
        message: message.usermessage.employeedesignationadd,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 return all employee designation data
 */

exports.getAllEmployeeDesignationData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_designation, count } =
      await EmployeeDesignation.findAll({
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
            model: Designation,
            as: 'designation',
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: employee_designation,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with epmployeeDesignation id
 *
 * @param {id} employeeDesignationID  to fetch employee designation
 */

exports.getEmployeeDesignationById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeDesignation.findOne({
      where: {
        employeeDesignationID: req.params.id,
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
 * @param {id} userMasterID  to fetch employee designation
 */

exports.getEmployeeDesignationByUserId = async (req, res, next) => {
  try {
    const get_one_data = await EmployeeDesignation.findAll({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      order: [['applicableDate', 'ASC']],
      include: [
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: Designation,
          as: 'designation',
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
            }
          ],
        },
      ],
    });
    if (get_one_data.length == 1) {
      get_one_data[0].dataValues.showDelete = true;
      if (
        new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
        new Date().toISOString().slice(0, 10)
      ) {
        get_one_data[0].dataValues.designationstatus = 'deactive';
      } else {
        get_one_data[0].dataValues.designationstatus = 'active';
      }
    } else {
      let startdates = [];
      for (let j = 0; j < get_one_data.length; j++) {
        startdates.push(new Date(get_one_data[j].dataValues.applicableDate));
      }
      if (startdates.length > 0) {
        const dateArr = startdates.sort((a, b) => a - b);
        const nearestPastDate = (dateArr, date) => {
          const pastArr = dateArr.filter((n) => n <= date);
          return pastArr.length > 0 ? pastArr[pastArr.length - 1] : null;
        };
        let past = nearestPastDate(dateArr, new Date());

        if (past != null) {
          past = past.toISOString().slice(0, 10);
        }
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
            get_one_data[i].dataValues.designationstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
            get_one_data[i].dataValues.designationstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D2 == null && D1 <= D3) {
            get_one_data[i].dataValues.designationstatus = 'active';
            get_one_data[i].dataValues.showDelete = true;
          } else if (D3 > D1) {
            if (D1 == past) {
              get_one_data[i].dataValues.designationstatus = 'active';
              get_one_data[i].dataValues.showDelete = true;
            } else {
              get_one_data[i].dataValues.designationstatus = 'deactive';
              get_one_data[i].dataValues.showDelete = false;
            }
          } else {
            get_one_data[i].dataValues.designationstatus = 'deactive';
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
 * @param {id} employeeDesignationID  to update id
 */
exports.postUpdateEmployeeDesignation = async (req, res, next) => {
  try {
    let = {
      employeeDesignationID,
      userMasterID,
      designationID,
      applicableDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let data = await EmployeeDesignation.findOne({
      where: {
        userMasterID: userMasterID,
        employeeDesignationID: {
          [Sequelize.Op.notIn]: [employeeDesignationID],
        },
        applicableDate: new Date(applicableDate),
      },
    });
    if (!data) {
      let get_one_data = await EmployeeDesignation.findAll({
        where: {
          userMasterID: userMasterID,
          employeeDesignationID: {
            [Sequelize.Op.notIn]: [employeeDesignationID],
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
          let date_change = await EmployeeDesignation.update(
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
          let insert_db_status = await EmployeeDesignation.update(
            {
              userMasterID,
              designationID,
              applicableDate,
              endDate:
                nearestFutureDate(dateArr, new Date(applicableDate)).getTime() -
                86400000,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeDesignationID: employeeDesignationID,
              },
            }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.employeedesignationupdate,
            data: insert_db_status,
          });
          return insert_db_status;
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await EmployeeDesignation.update(
              {
                userMasterID,
                designationID,
                applicableDate,
                updateBy,
                updateByIp,
              },
              {
                where: {
                  employeeDesignationID: employeeDesignationID,
                },
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.employeedesignationupdate,
              data: insert_db_status,
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await EmployeeDesignation.update(
            {
              userMasterID,
              designationID,
              applicableDate,
              updateBy,
              updateByIp,
            },
            {
              where: {
                employeeDesignationID: employeeDesignationID,
              },
            },
            { transaction: t }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.employeedesignationupdate,
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
 * @param {id} employeeDesignationID  to update status of employee designation
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeDesignationID, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeeDesignation.update(
          {
            status: '1',
          },
          {
            where: {
              employeeDesignationID: employeeDesignationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await EmployeeDesignation.update(
          {
            status: '0',
          },
          {
            where: {
              employeeDesignationID: employeeDesignationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.employeedesignationdelete,
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
 * @param {id} employeeDesignationID  to delete id
 */

exports.postDeleteEmployeeDesignationById = async (req, res, next) => {
  try {
    const { employeeDesignationID, userMasterID } = await req.body;

    const get_All_Data = await EmployeeDesignation.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    const get_one_data = get_All_Data.filter(
      (e) => e.employeeDesignationID != employeeDesignationID
    );

    const current_Data = get_All_Data.find(
      (e) => e.employeeDesignationID == employeeDesignationID
    );

    await sequelize.transaction(async (t) => {
      if (get_one_data.length > 0) {
        let startdates = [];
        for (var i = 0; i < get_one_data.length; i++) {
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
            await EmployeeDesignation.update(
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
            await EmployeeDesignation.update(
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

      await EmployeeDesignation.update(
        {
          status: 2,
        },
        {
          where: {
            employeeDesignationID: employeeDesignationID,
          },
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.employeedesignationdelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * change status by applicable date
 *
 * @param {id} employeeDesignationID  to change status of employee designation
 */
exports.changeStatusByDate = async () => {
  try {
    // const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const today = new Date();
    let get_data = await EmployeeDesignation.findAll({
      attributes: ['userMasterID'],
      where: { applicableDate: today },
    });
    let users = [];
    get_data.forEach((user) => {
      users.push(user.userMasterID);
    });
    let result = await sequelize.transaction(async (t) => {
      let designation_active = await EmployeeDesignation.update(
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

      let deactive_prev = await EmployeeDesignation.update(
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

exports.getEmployeeDesignationSelectedByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeDesignation.findOne({
      where: {
        userMasterID: req.params.id,
        status: 1,
        applicableDate: {
          [Sequelize.Op.lte]: new Date(),
        },
        [Sequelize.Op.or]: [
          {
            endDate: {
              [Sequelize.Op.gte]: new Date(),
            },
          },
          {
            endDate: { [Sequelize.Op.eq]: null },
          },
        ],
      },
      include: [
        {
          model: UserMaster,
        },
      ],
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

exports.getEmployeeDesignation = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, companyMasterID } = await req.body;

    const condition = {
      companyMasterId: {
        [Sequelize.Op.in]: companyMasterID,
      },
      status: 1,
    };

    if (companyMasterID) req.userDetails.accessibleCompanies = companyMasterID;

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { userNumber: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        sequelize.where(
          sequelize.cast(sequelize.col('userMaster.userMasterID'), 'varchar'),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ];
    }

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: company_contact, count } = await UserMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      ...accessibleUsers(req.userDetails, false, false),
      include: [{ model: companyMasters }],
    });
    for (let i = 0; i < company_contact.length; i++) {
      let get_one_data = await EmployeeDesignation.findAll({
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
          new Date(get_one_data[0].applicableDate).toISOString().slice(0, 10) >
          new Date().toISOString().slice(0, 10)
        ) {
          get_one_data[0].dataValues.designationstatus = 'deactive';
        } else {
          get_one_data[0].dataValues.designationstatus = 'active';
        }
      } else {
        let startdates = [];
        for (var j = 0; j < get_one_data.length; j++) {
          startdates.push(new Date(get_one_data[j].dataValues.applicableDate));
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
              D2 = new Date(get_one_data[k].endDate).toISOString().slice(0, 10);
            }

            let D3 = new Date().toISOString().slice(0, 10);
            if (D3 == D1) {
              get_one_data[k].dataValues.designationstatus = 'active';
            } else if (D3 >= D1 && D3 <= D2 && D3 == D1) {
              get_one_data[k].dataValues.designationstatus = 'active';
            } else if (D2 == null && D1 <= D3) {
              get_one_data[k].dataValues.designationstatus = 'active';
            } else if (D3 > D1) {
              if (D1 == past) {
                get_one_data[k].dataValues.designationstatus = 'active';
              } else {
                get_one_data[k].dataValues.designationstatus = 'deactive';
              }
            } else {
              get_one_data[k].dataValues.designationstatus = 'deactive';
            }
          }
        }
      }
      company_contact[i].designation = get_one_data;
    }

    if (company_contact) {
      res
        .status(200)
        .json({ status: 200, data: company_contact, totalcount: count });
    }
  } catch (err) {
    next(err);
  }
};

// exports.postAddEmployeeDesignationBULK = async (req, res, next) => {
//   try {
//     let = {
//       userMasterID,
//       designationID,
//       applicableDate,
//       createBy,
//       createByIp,
//     } = await req.body;
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
//             userMasterID: Number(userMasterID[n]),
//             AttendanceDate: applicableDate,
//             Status: 1,
//           },
//         });

//         if (get_one_Attendance) {
//           flag = 1;

//           let update_attendance_department = await attendanceTransaction.update(
//             {
//               designationID: designationID,
//             },
//             {
//               where: {
//                 userMasterID: Number(userMasterID[n]),
//                 AttendanceDate: applicableDate,
//                 Status: 1,
//               },
//             }
//           );
//           // res.status(200)
//           // .json({ status: 200, message: msg, data: [], added: 0 });
//         }

//         {
//           let get_one_Data = await EmployeeDesignation.findOne({
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
//             ' has/have not been assigned this Designation, because the attendance/designation is already present in the applicable date';
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
//             let get_one_data = await EmployeeDesignation.findAll({
//               where: {
//                 userMasterID: userMasterID[n],
//                 status: 1,
//               },
//             });
//             if (get_one_data.length > 0) {
//               let startdates = [];
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
//                 let date_change = await EmployeeDesignation.update(
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
//                 let insert_db_status = await EmployeeDesignation.create({
//                   userMasterID: userMasterID[n],
//                   designationID,
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
//                   let insert_db_status = await EmployeeDesignation.create(
//                     {
//                       userMasterID: userMasterID[n],
//                       designationID,
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
//                 let insert_db_status = await EmployeeDesignation.create(
//                   {
//                     userMasterID: userMasterID[n],
//                     designationID,
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
//             message: message.usermessage.employeedesignationadd,
//             data: {},
//           });
//         } else {
//           for (var n = 0; n < addUser.length; n++) {
//             let get_one_data = await EmployeeDesignation.findAll({
//               where: {
//                 userMasterID: addUser[n],
//                 status: 1,
//               },
//             });
//             if (get_one_data.length > 0) {
//               let startdates = [];
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
//                 let date_change = await EmployeeDesignation.update(
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
//                 let insert_db_status = await EmployeeDesignation.create({
//                   userMasterID: addUser[n],
//                   designationID,
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
//                   let insert_db_status = await EmployeeDesignation.create(
//                     {
//                       userMasterID: addUser[n],
//                       designationID,
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
//                 let insert_db_status = await EmployeeDesignation.create(
//                   {
//                     userMasterID: addUser[n],
//                     designationID,
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
//             ' has/have not been assigned this Designation, because the attendance/designation is already present in the applicable date';
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

exports.postAddEmployeeDesignationBULK = async (req, res, next) => {
  try {
    const {
      userMasterID,
      designationID,
      applicableDate,
      createBy,
      createByIp,
    } = await req.body;

    const userMasterIDs = userMasterID;

    const AllEmployeeDesignation = await EmployeeDesignation.findAll({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    await sequelize.transaction(async (t) => {
      for (let n = 0; n < userMasterIDs.length; n++) {
        const userMasterID = userMasterIDs[n];

        const currentData = AllEmployeeDesignation.find(
          e.userMasterID == userMasterID &&
          new Date(e.applicableDate).getTime() ==
          new Date(applicableDate).getTime()
        );
        if (currentData) {
          await EmployeeDesignation.update(
            {
              designationID,
              updateBy: createBy,
              updateByIp: createByIp,
            },
            {
              where: {
                employeeDesignationID: currentData.employeeDesignationID,
              },
            }
          );
          continue;
        }

        const get_one_data = AllEmployeeDesignation.filter(
          e.userMasterID == userMasterID
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
            await EmployeeDesignation.update(
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
            await EmployeeDesignation.create(
              {
                userMasterID,
                designationID,
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
            await EmployeeDesignation.create(
              {
                userMasterID,
                designationID,
                applicableDate,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          }
        } else {
          await EmployeeDesignation.create(
            {
              userMasterID,
              designationID,
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
      message: 'Employee Designation Updated Successfully.',
    });
  } catch (err) {
    next(err);
  }
};
