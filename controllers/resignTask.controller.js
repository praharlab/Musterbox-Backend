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
const ResignationTask = require('../models/resignTask');
const { executeQuery } = require('./common.controller');
const ResignProcess = require('../models/resignProcess');
const ResignTask = require('../models/resignTask');

exports.getResignationTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await ResignationTask.findOne({
      where: { resignTaskID: id },
      include: [{ model: ResignProcess }],
    });

    if (!task) {
      return res
        .status(200)
        .json({ status: 404, message: 'ResignationTask not found' });
    }

    res.status(200).json({ status: 200, data: task });
  } catch (error) {
    next(error);
  }
};
