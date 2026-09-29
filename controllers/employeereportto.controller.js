const Sequelize = require('sequelize');
const EmployeeReportTo = require('../models/employeeReportTo');
const UserMaster = require('../models/userMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMasterModel = require('../models/userMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const companyMaster = require('../models/companyMaster');

/**
 * save employee report to data.
 *
 * @body {createBy} createBy user id of user who added the employee report to.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddEmployeeReportTo = async (req, res, next) => {
  try {
    let = { userMasterID, reportsto } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let get_one_data = await EmployeeReportTo.findOne({
        where: {
          userMasterID: userMasterID,
        },
        raw: true,
      });
      if (get_one_data) {
        let change_data_status = await EmployeeReportTo.destroy({
          where: { userMasterID: userMasterID },
        });
        let insert_db_status = await EmployeeReportTo.bulkCreate(reportsto, {
          returning: true,
        });

        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeereporttoupdate,
        });
      } else {
        let insert_db_status = await EmployeeReportTo.bulkCreate(reportsto, {
          returning: true,
        });
        return res.status(200).json({
          status: 200,
          message: message.usermessage.employeereporttoadd,
          data: insert_db_status,
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all employee report to data
 */

exports.getAllEmployeeReportToData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_report_to, count } =
      await EmployeeReportTo.findAndCountAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'employee',
            ...accessibleUsers(req.userDetails),
          },
          {
            model: UserMaster,
            as: 'reportTo',
          },
        ],
      });

    return res
      .status(200)
      .json({ status: 200, data: employee_report_to, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeReportTo id
 *
 * @param {id} employeeReportToID  to fetch employee report to
 */

exports.getEmployeeReportToById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeReportTo.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [1],
        },
      },
    });
    let mainarray = [];
    for (let i = 0; i < get_one_data.length; i++) {
      if (get_one_data[i].reportToID) {
        let get_employee = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: get_one_data[i].reportToID,
          },
          include: { model: companyMaster, attributes: ['companyName'] },
        });
        if (get_employee) {
          mainarray.push({
            userMasterID: get_one_data[i].reportToID,
            companyMasterID: get_employee.companyMasterId,
            companyName: get_employee['companyMaster.companyName'],
            name: get_employee.displayName,
            mobile: get_employee.userNumber,
            photo: get_employee.photo,
          });
        }
      }
    }
    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: mainarray });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch employee report to
 */

exports.getEmployeeReportToByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeReportTo.findOne({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
    });

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
 * @param {id} employeeReportToID  to update id
 */
exports.postUpdateEmployeeReportTo = async (req, res, next) => {
  try {
    let = {
      employeeReportToID,
      userMasterID,
      reportToID,
      updateBy,
      updateByIp,
    } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await EmployeeReportTo.update(
        {
          userMasterID,
          reportToID,
          updateBy,
          updateByIp,
        },
        {
          where: { employeeReportToID: employeeReportToID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeereporttoupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} employeeReportToID  to update status of employee report to
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeReportToID, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeeReportTo.update(
          {
            status: '1',
          },
          {
            where: {
              employeeReportToID: employeeReportToID,
              status: ['1', '0'],
            },
          }
        );
      } else {
        delete_status = await EmployeeReportTo.update(
          {
            status: '0',
          },
          {
            where: {
              employeeReportToID: employeeReportToID,
              status: ['1', '0'],
            },
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.employeereporttodelete,
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
 * delete by id
 *
 * @param {id} employeeReportToID  to delete id
 */
exports.postDeleteEmployeeReportToById = async (req, res, next) => {
  try {
    let = { employeeReportToID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_db_status = await EmployeeReportTo.destroy({
        where: {
          employeeReportToID: employeeReportToID,
        },
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.employeereporttodelete,
      });
      return delete_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * return employee reporting employees
 *
 * @param {id} userMasterID  to get reporting employees
 *  */
exports.getReportingEmployees = async (req, res, next) => {
  try {
    let parent = req.params.id;
    let get_employees = await EmployeeReportTo.findAll({
      where: {
        reportToID: {
          [Sequelize.Op.contains]: [parent],
        },
      },
      include: [
        {
          model: UserMaster,
          required: true,
          as: 'employee',
          ...accessibleUsers(req.userDetails),
        },
        {
          model: UserMaster,
          as: 'reportTo',
        },
      ],
    });

    get_employees = get_employees.map((emp) => emp.dataValues);

    if (get_employees.length > 0) {
      for (var user of get_employees) {
        await getChildren(user);
      }
    }

    res.status(200).json({ status: 200, data: get_employees });
  } catch (err) {
    next(err);
  }
};

/**
 * return employee report to structure
 *
 * @param {id} companyMasterId  to get report to structure
 *  */
exports.postEmployeeReportToStructure = async (req, res, next) => {
  try {
    let { companyMasterId } = await req.body;
    let get_master = await UserMasterModel.findAll({
      attributes: ['userMasterID', 'firstName', 'middleName', 'lastName'],
      where: {
        companyMasterId: companyMasterId,
        userMasterID: {
          [Sequelize.Op.notIn]: [
            Sequelize.literal(
              `SELECT \"userMasterID\" from \"employeeReportTos\"`
            ),
          ],
        },
      },
      ...accessibleUsers(req.userDetails, false),
    });

    for (var user of get_master) {
      await getChildren(user);
    }

    res.status(200).json({ status: 200, data: get_master });
  } catch (err) {
    next(err);
  }
};

const getChildren = async (parent) => {
  let get_children = await EmployeeReportTo.findAll({
    where: {
      reportToID: {
        [Sequelize.Op.contains]: [parent.userMasterID],
      },
      status: [0, 1],
    },
    include: [
      { model: UserMaster, as: 'employee' },
      { model: UserMaster, as: 'reportTo' },
    ],
  });
  parent['children'] = get_children.dataValues;
  if (get_children.length > 0) {
    for (var user of get_children) {
      await getChildren(user);
    }
  }
};
exports.updateAllReportToID = async (req, res, next) => {
  try {
    const { oldReportToID, newReportToID, status } = req.body;
    const updateReportData = {};

    if (newReportToID) {
      updateReportData.reportToID = newReportToID;
    }

    if (status) {
      updateReportData.status = status;
    }

    await EmployeeReportTo.update(updateReportData, {
      where: { reportToID: oldReportToID, status: 1 },
    });

    const message =
      status != undefined
        ? 'Report To delete successfully.'
        : 'Report To replace successfully.';

    return res.status(200).json({
      status: 200,
      message: message,
    });
  } catch (err) {
    next(err);
  }
};
