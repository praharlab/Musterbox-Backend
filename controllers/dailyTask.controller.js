const DailyTask = require('../models/dailyTask');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const sequelize = require('../config/database');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const { generateExcel } = require('../utils/exportData');

exports.postAdddailyTask = async (req, res, next) => {
  try {
    let { userMasterID, taskDesc, createBy, createByIp } = await req.body;
    let attachment = '';

    if (req.files && req.files.length > 0) {
      attachment = req.files[0].filename;
    }

    let taskDate = new Date().toISOString().slice(0, 10);

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await DailyTask.create(
        {
          userMasterID,
          taskDate,
          taskDesc,
          attachment,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: 'Task added Successfully',
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAllTask = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, fromdate, todate } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    condition.status = 1;

    if (userMasterID) condition.userMasterID = userMasterID;

    if (fromdate && todate) {
      condition.taskDate = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      };
    }

    const { rows: task_data, count } = await DailyTask.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
        },
      ],
    });

    return res
      .status(200)
      .json({ status: 200, data: task_data, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postDelete = async (req, res, next) => {
  try {
    let id = req.body.id;
    DailyTask.destroy({
      where: {
        dailyTaskID: id,
      },
    });
    res.status(200).json({ status: 200, message: 'Task Deleted Successfully' });
  } catch (error) {
    next(error);
  }
};

exports.TaskupdateData = async (req, res, next) => {
  try {
    let = { dailyTaskID, userMasterID, taskDesc, updateBy, updateByIp } =
      await req.body;
    let attachment = '';

    let taskDate = new Date().toISOString().slice(0, 10);

    if (req.file) {
      attachment = req.file.filename;
      let result = await sequelize.transaction(async (t) => {
        let data = await DailyTask.update(
          {
            userMasterID,
            taskDate,
            taskDesc,
            attachment,
            updateBy,
            updateByIp,
          },
          {
            where: { dailyTaskID: dailyTaskID },
          }
        );
        res.status(200).json({
          status: 200,
          msg: data,
          message: 'Task Updated Succesfully',
        });
        return data;
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let data = await DailyTask.update(
          {
            userMasterID,
            taskDate,
            taskDesc,
            updateBy,
            updateByIp,
          },
          {
            where: { dailyTaskID: dailyTaskID },
          }
        );
        res.status(200).json({
          status: 200,
          msg: data,
          message: 'Task Updated Succesfully',
        });
        return data;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const get_one_data = await DailyTask.findOne({
      where: {
        dailyTaskID: req.params.id,
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getAllTaskbyCompany = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID, fromdate, todate } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    condition.status = 1;

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition['$userMaster.companyMasterId$'] = companyMasterID;
    }

    if (fromdate && todate) {
      condition.taskDate = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      };
    }

    const { rows: task_data, count } = await DailyTask.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    return res
      .status(200)
      .json({ status: 200, data: task_data, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postAdddailyTaskNew = async (req, res, next) => {
  try {
    const { userMasterID, taskDesc } = await req.body;

    let { oldAttachments } = await req.body;

    const taskDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (oldAttachments && oldAttachments.length > 0) {
      oldAttachments = oldAttachments.split(',');
    } else {
      oldAttachments = [];
    }

    if (req.files) {
      for (const file of req.files) oldAttachments.push(file.filename);
    }

    const taskData = await DailyTask.findOne({
      where: {
        userMasterID,
        taskDate,
      },
    });

    if (taskData)
      return res.status(200).json({
        status: 401,
        message: 'You have already submitted a daily report for this date.',
      });

    await DailyTask.create({
      userMasterID,
      taskDesc,
      taskDate,
      attachments: oldAttachments,
      createBy: req.userDetails.userMasterId,
      createByIp: req.userDetails.userIpAddress,
    });
    return res.status(200).json({
      status: 200,
      message: 'Your daily report has been successfully added.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTaskNew = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, fromdate, todate, exportData } =
      await req.body;

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    condition.status = 1;

    if (userMasterID) condition.userMasterID = userMasterID;

    if (fromdate && todate) {
      condition.taskDate = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      };
    }

    const { rows: task_data, count } = await DailyTask.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          attributes: ['displayName', 'userNumber', 'userMasterID'],
          include: [
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['designationID', 'applicableDate'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['departmentID', 'applicableDate'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(date) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(date) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: true,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
    });

    if (exportData) {
      const finalData = task_data.map((e) => {
        return {
          'Employee Code': e.userMaster.employeeJoiningDetails[0].employeeCode,
          'Employee Name': e.userMaster.displayName,
          Number: e.userMaster.userNumber,
          Branch:
            e.userMaster.employeeBranches &&
            e.userMaster.employeeBranches.length > 0
              ? e.userMaster.employeeBranches[0].branchMaster
                ? e.userMaster.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          Department:
            e.userMaster.employeeDepartments &&
            e.userMaster.employeeDepartments.length > 0
              ? e.userMaster.employeeDepartments[0].department
                ? e.userMaster.employeeDepartments[0].department.departmentName
                : ''
              : '',
          Designation:
            e.userMaster.employeeDesignations &&
            e.userMaster.employeeDesignations.length > 0
              ? e.userMaster.employeeDesignations[0].designation
                ? e.userMaster.employeeDesignations[0].designation
                    .designationName
                : ''
              : '',
          'Task Date': String(e.taskDate).split('-').reverse().join('-'),
          'Task Description': e.taskDesc,
        };
      });

      return await generateExcel(finalData, 'DailyTask', 'xlsx', res);
    }

    return res
      .status(200)
      .json({ status: 200, data: task_data, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.updateNew = async (req, res, next) => {
  try {
    const { dailyTaskID, userMasterID, taskDesc } = await req.body;

    let { oldAttachments } = await req.body;

    const taskDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    if (oldAttachments && oldAttachments.length > 0) {
      oldAttachments = oldAttachments.split(',');
    } else {
      oldAttachments = [];
    }

    if (req.files) {
      for (const file of req.files) oldAttachments.push(file.filename);
    }

    const taskData = await DailyTask.findOne({
      where: {
        dailyTaskID,
        userMasterID,
        taskDate,
      },
    });

    if (!taskData)
      return res.status(200).json({
        status: 401,
        message: 'The daily report you are looking for does not exist.',
      });

    taskData.taskDesc = taskDesc;
    taskData.attachments = oldAttachments;
    taskData.updateBy = req.userDetails.userMasterId;
    taskData.updateByIp = req.userDetails.userIpAddress;
    await taskData.save();

    return res.status(200).json({
      status: 200,
      message: 'Your daily report has been successfully updated.',
    });
  } catch (error) {
    next(error);
  }
};
