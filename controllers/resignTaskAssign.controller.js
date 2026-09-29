const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../config/logger');
const message = require('../response_message/message');
const reportTo = require('../models/employeeReportTo');
const designation = require('../models/designation');
const UserMaster = require('../models/userMaster');
const moment = require('moment');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const attendanceTransaction = require('../models/attendanceTransaction');
const Visit = require('../models/visit');
const ResignationTaskAssign = require('../models/resignTaskAssign');
const UserResignation = require('../models/resignation');
const ResignationTask = require('../models/resignTask');
const { executeQuery } = require('./common.controller');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const UserInbox = require('../models/UserInbox');

exports.getAllresignTaskAssign = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, user, searchQuery } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    let condition = {
      userMasterID: userMasterID,
      status: {
        [Sequelize.Op.in]: [0],
      },
    };

    const empCondition = {};
    if (user && user.length > 0) {
      empCondition.userMasterID = user;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$resignation.employee.displayName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const resignData = await ResignationTaskAssign.findAndCountAll({
      order: [['resignTaskAssignID', 'ASC']],
      where: condition,
      ...paginationQuery,
      include: [
        {
          required: true,
          model: UserResignation,
          include: [
            {
              model: UserMaster,
              as: 'employee',
              required: true,
              where: empCondition,
              ...accessibleUsers(req.userDetails, false, false),
              attributes: ['userMasterID', 'displayName', 'userNumber'],
              include: [
                {
                  model: EmployeeJoiningDetails,
                  attributes: ['employeeCode'],
                },
              ],
            },
          ],
        },
        {
          model: ResignationTask,
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: resignData.rows,
      totalcount: resignData.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateresignTaskAssign = async (req, res, next) => {
  try {
    let { resignTaskAssignID, isApplicable, isRecovered, amount, remarks } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      await ResignationTaskAssign.update(
        {
          remarks,
          isApplicable,
          isRecovered,
          amount,
          status: 1,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.userIpAddress,
        },
        {
          where: { resignTaskAssignID: resignTaskAssignID },
          transaction: t,
        }
      );
      await UserInbox.destroy(
        {
          where: {
            activityTable: ResignationTaskAssign.getTableName(),
            activityTablePK: resignTaskAssignID,
          },
        },
        { transaction: t }
      );
      return res.status(200).json({
        status: 200,
        message: message.usermessage.updateMessage('Clearance & Exit Process'),
      });
    });
  } catch (err) {
    next(err);
  }
};
