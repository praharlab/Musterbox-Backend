const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserTasks = require('../models/User_Tasks');
const Task_Stages = require('../models/tasks_stages');
const TaskRemark = require('../models/taskremark');
const cron = require('node-cron');
const axios = require('axios');
const UserMaster = require('../models/userMaster');

exports.postAddTaskRemark = async (req, res, next) => {
  try {
    let { remark, tasks_stagesID, user_TasksID, createBy, createByIp } =
      await req.body;

    let insert_db_status = TaskRemark.create({
      remark,
      tasks_stagesID,
      user_TasksID,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: 'Remark added Successfully',
      data: insert_db_status,
    });
    return insert_db_status;
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getTaskById = async (req, res, next) => {
  try {
    let get_one_data = await TaskRemark.findAll({
      where: {
        user_TasksID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    for (var i = 0; i < get_one_data.length; i++) {
      let get_TaskStage = await Task_Stages.findOne({
        where: {
          tasks_stagesID: get_one_data[i].tasks_stagesID,
        },
        raw: true,
      });
      if (get_TaskStage) {
        get_one_data[i].stage = get_TaskStage;
      }
    }

    console.log(get_one_data);
    if (!get_one_data)
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
