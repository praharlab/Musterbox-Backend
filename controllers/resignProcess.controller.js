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
const ResignProcess = require('../models/resignProcess');
const ResignTask = require('../models/resignTask');
const Designation = require('../models/designation');
const ResignTaskAssign = require('../models/resignTaskAssign');
const UserResignation = require('../models/resignation');

const { executeQuery } = require('./common.controller');
const ResignationTask = require('../models/resignTask');
const Department = require('../models/department');
const companyMaster = require('../models/companyMaster');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');

exports.postAddResignProcess = async (req, res, next) => {
  try {
    const { companyMasterID, departmentID, taskData } = req.body;

    const already_applied = await ResignProcess.findOne({
      where: {
        departmentID: departmentID,
        status: { [Sequelize.Op.in]: [0, 1] },
      },
    });

    if (already_applied)
      return res.status(200).json({
        status: 401,
        message: 'Clearance & Exit Process already added for these Department!',
      });

    await sequelize.transaction(async (t) => {
      const createProcess = await ResignProcess.create(
        {
          companyMasterID: companyMasterID,
          departmentID: departmentID,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
          status: 1,
        },
        { transaction: t }
      );

      const reignTaskData = taskData.map((task) => ({
        ...task,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
        resignProcessID: createProcess.resignProcessID,
      }));
      await ResignTask.bulkCreate(reignTaskData, { transaction: t });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Clearance & Exit'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateResignProcess = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { companyMasterID, departmentID, taskData } = req.body;

    const existingProcess = await ResignProcess.findOne({
      where: {
        resignProcessID: id,
        status: { [Sequelize.Op.in]: [0, 1] },
      },
    });

    if (!existingProcess) {
      return res.status(200).json({
        status: 404,
        message: 'Clearance & Exit Process already added for these Department!',
      });
    }

    await sequelize.transaction(async (t) => {
      await ResignProcess.update(
        {
          companyMasterID: companyMasterID,
          departmentID: departmentID,
          updateBy: req.userDetails.userMasterId,
          updateByIp: req.userDetails.userIpAddress,
        },
        { where: { resignProcessID: id }, transaction: t }
      );

      await ResignTask.update(
        {
          status: 2,
        },
        {
          where: { resignProcessID: id },
        },
        { transaction: t }
      );

      const reignTaskData = taskData.map((task) => ({
        ...task,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
        resignProcessID: id,
      }));

      await ResignTask.bulkCreate(reignTaskData, { transaction: t });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Clearance & Exit'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddResignProcess1 = async (req, res, next) => {
  try {
    let { companyMasterID, departmentID, createBy, createByIp } =
      await req.body;

    let already_applied = await ResignProcess.findOne({
      where: {
        departmentID: departmentID,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    if (already_applied) {
      return res.status(200).json({
        status: 401,
        message: 'Designation already added',
        data: {},
      });
    } else {
      await ResignProcess.create({
        companyMasterID,
        departmentID: departmentID,
        createBy,
        createByIp,
      });

      return res.status(200).json({
        status: 200,
        message: message.usermessage.addMessage('Resignation'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.postAddResignProcess2 = async (req, res, next) => {
  try {
    let {
      resignProcessID,
      userMasterID,
      description,
      isMandatory,
      createBy,
      createByIp,
    } = await req.body;

    let attachment = '';
    if (req.file) {
      attachment = req.file.filename;
    }

    await ResignTask.create({
      resignProcessID,
      userMasterID,
      description,
      isMandatory,
      attachment,
      status: 1,
      createBy,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: 'Task added Successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllresignProcess = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      companyMasterID: companyMasterID,
      status: {
        [Sequelize.Op.in]: [0, 1],
      },
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$department.departmentName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const resignProcessData = await ResignProcess.findAndCountAll({
      order: [['resignProcessID', 'ASC']],
      where: condition,
      include: [
        {
          model: companyMaster,
          as: 'company',
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: Department,
          as: 'department',
          attributes: ['departmentId', 'departmentName', 'status'],
        },
      ],
      paginationQuery,
    });

    return res.status(200).json({
      status: 200,
      data: resignProcessData.rows,
      totalcount: resignProcessData.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllresignProcesswithtask = async (req, res, next) => {
  try {
    let { limit, page, id } = await req.body;
    let offset = (page - 1) * limit;
    let resign_data = [];
    if (limit == '' && page == '') {
      resign_data = await ResignProcess.findAll({
        raw: true,
        order: [['resignProcessID', 'ASC']],
        where: {
          departmentID: id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [
          {
            model: companyMaster,
            as: 'company',
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: Department,
            as: 'department',
            attributes: ['departmentId', 'departmentName', 'status'],
          },
        ],
      });
    } else {
      resign_data = await ResignProcess.findAll({
        raw: true,
        order: [['resignProcessID', 'ASC']],
        where: {
          departmentID: id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: [
          {
            model: Designation,
            as: 'designation',
          },
        ],
      });
    }

    for (var i = 0; i < resign_data.length; i++) {
      let task_data = await ResignTask.findAll({
        raw: true,
        order: [['resignTaskID', 'ASC']],
        where: {
          resignProcessID: resign_data[i].resignProcessID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
      resign_data[i].task = task_data;
    }

    const totalcount = await ResignProcess.count({
      raw: true,
      where: {
        departmentID: id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    return res
      .status(200)
      .json({ status: 200, data: resign_data[0], totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.poststatus = async (req, res, next) => {
  try {
    let { resignProcessID, status } = await req.body;
    let delete_status;

    delete_status = await ResignProcess.update(
      {
        status: status,
      },
      {
        where: { resignProcessID: resignProcessID },
      }
    );

    await ResignTask.update(
      {
        status: status,
      },
      {
        where: { resignProcessID: resignProcessID },
      }
    );
    let message1 = 'Status changed successfully';
    if (+status == 2) message1 = message.usermessage.deleteMessage('Process');

    return res.status(200).json({ status: 200, message: message1 });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateResignProcess = async (req, res, next) => {
  try {
    let { resignProcessID, task, createBy, createByIp } = await req.body;

    let already_ID = [];

    await ResignTask.destroy({
      where: {
        resignProcessID: resignProcessID,
      },
    });

    for (var j = 0; j < task.length; j++) {
      await ResignTask.create({
        resignProcessID: resignProcessID,
        userMasterID: task[j].userMasterID,
        description: task[j].description,
        isMandatory: task[j].isMandatory,
        attachment: task[j].attachment,
        status: 1,
        createBy,
        createByIp,
      });
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Resignation'),
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getResignationProcessById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const resignProcess = await ResignProcess.findOne({
      where: { resignProcessID: id },
      include: [
        {
          model: ResignTask,
          where: { status: 1 },
          include: [
            {
              model: UserMaster,
              attributes: ['userMasterID', 'displayName'],
              include: [
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
              ],
            },
          ],
        },
      ],
    });

    res.status(200).json({ status: 200, data: resignProcess });
  } catch (error) {
    next(error);
  }
};

exports.getResignationTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await ResignTaskAssign.findAll({
      where: { resignationID: id },
      include: [
        { model: UserMaster },
        { model: ResignationTask },
        {
          model: UserResignation,
          include: { model: UserMaster, as: 'employee' },
        },
      ],
    });

    if (!task.length) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('ResignationTask'),
      });
    }

    return res.status(200).json({ status: 200, data: task });
  } catch (error) {
    next(error);
  }
};
