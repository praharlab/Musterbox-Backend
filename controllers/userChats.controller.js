const Sequelize = require('sequelize');
const UserChats = require('../models/userChats');
const logger = require('../config/logger');
const sequelize = require('../config/database');
// const message = require('../response_message/message')
const { executeQuery } = require('./common.controller');
const UserMaster = require('../models/userMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const jwt = require('jsonwebtoken');
const Notification = require('../config/firebase');
const { sendNotification } = require('../utils/commonUtilFunctions');

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

//send message
exports.postSendMessage = async (req, res, next) => {
  try {
    let {
      senderID,
      receiverID,
      message,
      msgstatus,
      status,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;

    let path = '';
    if (req.file) {
      path = req.file.filename;
    }

    let result = await sequelize.transaction(async (t) => {
      insert_db_status = await UserChats.create(
        {
          senderID,
          receiverID,
          message,
          msgstatus,
          path,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      let get_user = await UserMaster.findOne({
        where: {
          userMasterID: senderID,
          status: 1,
        },
      });

      const notification = {
        title: get_user.displayName,
        body: message,
      };
      const data = {
        screen: 'chat',
        senderID: senderID.toString(),
        isScheduled: 'true',
        scheduledTime: new Date().toISOString(),
      };
      await sendNotification(receiverID, notification, data);

      return res.status(200).json({
        status: 200,
        message: 'Message sent successfully',
        data: insert_db_status,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      return res
        .status(200)
        .json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

//get user with last msg list
exports.getuserList = async (req, res, next) => {
  try {
    let { limit, page, receiverID, senderID } = await req.body;
    let offset = (page - 1) * limit;
    let user_chats = [],
      totalcount = 0,
      finaldata = [];

    // user_chats = await UserChats.findOne({
    //   raw: true,
    //   where: {
    //     userChatsID: result[i].userchatsid,
    //     [Sequelize.Op.or]: [
    //       { senderID: receiverID },
    //       { receiverID: receiverID }
    //     ],
    //   },
    //   order: [['userChatsID', 'DESC']],
    // })

    if (limit == '' && page == '') {
      let result = await executeQuery(
        `SELECT DISTINCT "senderID", MAX("userChatsID") as userChatsID FROM "public"."userChats" where status=1 and "receiverID"=` +
          receiverID +
          ` GROUP BY "senderID" ORDER BY MAX("userChatsID") DESC, "senderID"`
      );

      let result2 = await executeQuery(
        `SELECT DISTINCT "receiverID", MAX("userChatsID") as userChatsID FROM "public"."userChats" where status=1 and "senderID"=` +
          receiverID +
          ` GROUP BY "receiverID" ORDER BY MAX("userChatsID") DESC, "receiverID"`
      );

      let userID = [],
        chatID = [];
      for (var i = 0; i < result.length; i++) {
        userID.push(result[i].senderID);
        chatID.push(result[i].userchatsid);
      }

      for (var i = 0; i < result2.length; i++) {
        if (userID.includes(result2[i].receiverID)) {
          let index = userID.indexOf(result2[i].receiverID);
          if (chatID[index] < result2[i].userchatsid) {
            chatID[index] = result2[i].userchatsid;
          }
        } else {
          userID.push(result2[i].receiverID);
          chatID.push(result2[i].userchatsid);
        }
      }

      for (var i = 0; i < chatID.length; i++) {
        let user = await UserChats.findOne({
          raw: true,
          where: {
            userChatsID: chatID[i],
          },
        });
        if (user) {
          let user_data = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: userID[i],
            },
          });

          if (user_data) {
            user.employee = user_data;
          }
          finaldata.push(user);
        }
      }
      totalcount = finaldata.length;
    } else {
      let result = await executeQuery(
        `SELECT DISTINCT "senderID", MAX("userChatsID") as userChatsID FROM "public"."userChats" where status=1 and "receiverID"=` +
          receiverID +
          ` GROUP BY "senderID" ORDER BY MAX("userChatsID") DESC, "senderID"`
      );

      let result2 = await executeQuery(
        `SELECT DISTINCT "receiverID", MAX("userChatsID") as userChatsID FROM "public"."userChats" where status=1 and "senderID"=` +
          receiverID +
          ` GROUP BY "receiverID" ORDER BY MAX("userChatsID") DESC, "receiverID"`
      );

      let userID = [],
        chatID = [];
      for (var i = 0; i < result.length; i++) {
        userID.push(result[i].senderID);
        chatID.push(result[i].userchatsid);
      }

      for (var i = 0; i < result2.length; i++) {
        if (userID.includes(result2[i].receiverID)) {
          let index = userID.indexOf(result2[i].receiverID);
          if (chatID[index] < result2[i].userchatsid) {
            chatID[index] = result2[i].userchatsid;
          }
        } else {
          userID.push(result2[i].receiverID);
          chatID.push(result2[i].userchatsid);
        }
      }

      for (var i = 0; i < chatID.length; i++) {
        let user = await UserChats.findOne({
          raw: true,
          where: {
            userChatsID: chatID[i],
          },
        });
        if (user) {
          let user_data = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: userID[i],
            },
          });

          if (user_data) {
            user.employee = user_data;
          }
          finaldata.push(user);
        }
      }
      totalcount = finaldata.length;

      const datta = finaldata;
      let page1 = Number(page);
      let limit1 = Number(limit);
      let offset1 = (page1 - 1) * limit1;
      const citrus = datta.slice(offset1, offset1 + limit1);

      finaldata = citrus;
    }

    for (var i = 0; i < finaldata.length; i++) {
      let designation;
      designation = await EmployeeDesignation.findOne({
        raw: true,
        where: {
          userMasterID: finaldata[i].employee.userMasterID,
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [{ model: Designation, as: 'designation' }],
      });

      let department;
      department = await EmployeeDepartment.findOne({
        raw: true,
        where: {
          userMasterID: finaldata[i].employee.userMasterID,
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [{ model: Department, as: 'department' }],
      });

      let branch;
      branch = await EmployeeBranch.findOne({
        raw: true,
        where: {
          userMasterID: finaldata[i].employee.userMasterID,
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date() },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [{ model: BranchMaster, as: 'branchMaster' }],
      });

      finaldata[i].employee.designation = designation
        ? designation['designation.designationName']
        : '';
      finaldata[i].employee.department = department
        ? department['department.departmentName']
        : '';
      finaldata[i].employee.branch = branch
        ? branch['branchMaster.branchName']
        : '';

      let id1, id2;
      if (finaldata[i].senderID == receiverID) {
        id1 = finaldata[i].senderID;
        id2 = finaldata[i].receiverID;
      } else {
        id2 = finaldata[i].senderID;
        id1 = finaldata[i].receiverID;
      }

      let msg_count = await UserChats.count({
        raw: true,
        where: {
          receiverID: id1,
          senderID: id2,
          msgstatus: 1,
        },
      });

      finaldata[i].messageCount = msg_count;
    }

    finaldata.sort((a, b) => b.createdAt - a.createdAt); // b - a for reverse sort

    return res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

//user wise chat history
exports.getuserWiseChat = async (req, res, next) => {
  try {
    let { limit, page, receiverID, senderID } = await req.body;
    let offset = (page - 1) * limit;
    let user_chats = [];
    if (limit == '' && page == '') {
      user_chats = await UserChats.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              status: 1,
              receiverID: {
                [Sequelize.Op.in]: [receiverID, senderID],
              },
              senderID: {
                [Sequelize.Op.in]: [receiverID, senderID],
              },
            },
            {
              [Sequelize.Op.and]: [
                {
                  status: 2,
                  receiverID: senderID,
                  senderID: {
                    [Sequelize.Op.in]: [receiverID, senderID],
                  },
                },
              ],
            },
            {
              [Sequelize.Op.and]: [
                {
                  status: 3,
                  senderID: receiverID,
                  receiverID: {
                    [Sequelize.Op.in]: [receiverID, senderID],
                  },
                },
              ],
            },
          ],
        },
        order: [['createdAt', 'DESC']],
      });
    } else {
      user_chats = await UserChats.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              status: 1,
              receiverID: {
                [Sequelize.Op.in]: [receiverID, senderID],
              },
              senderID: {
                [Sequelize.Op.in]: [receiverID, senderID],
              },
            },
            {
              [Sequelize.Op.and]: [
                {
                  status: 2,
                  receiverID: senderID,
                  senderID: {
                    [Sequelize.Op.in]: [receiverID, senderID],
                  },
                },
              ],
            },
            {
              [Sequelize.Op.and]: [
                {
                  status: 3,
                  senderID: senderID,
                  receiverID: {
                    [Sequelize.Op.in]: [receiverID, senderID],
                  },
                },
              ],
            },
          ],
        },
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await UserChats.count({
      raw: true,
      where: {
        [Sequelize.Op.or]: [
          {
            status: 1,
            receiverID: {
              [Sequelize.Op.in]: [receiverID, senderID],
            },
            senderID: {
              [Sequelize.Op.in]: [receiverID, senderID],
            },
          },
          {
            [Sequelize.Op.and]: [
              {
                status: 2,
                receiverID: senderID,
                senderID: {
                  [Sequelize.Op.in]: [receiverID, senderID],
                },
              },
            ],
          },
          {
            [Sequelize.Op.and]: [
              {
                status: 3,
                senderID: senderID,
                receiverID: {
                  [Sequelize.Op.in]: [receiverID, senderID],
                },
              },
            ],
          },
        ],
      },
    });

    let change_data_to_seen = await UserChats.update(
      {
        msgstatus: 2,
      },
      {
        where: {
          receiverID: senderID,
          senderID: receiverID,
          status: 1,
        },
      }
    );

    res
      .status(200)
      .json({ status: 200, data: user_chats, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

//change status to view
exports.postUpdatechatstoseen = async (req, res, next) => {
  try {
    let { receiverID, updateBy, updateByIp } = await req.body;

    let update_data = await sequelize.transaction(async (t) => {
      let change_data = await UserChats.update(
        {
          updateBy,
          updateByIp,
          msgstatus: 2,
        },
        {
          where: { receiverID: receiverID },
          transaction: t,
        }
      );

      return res.status(200).json({
        status: 200,
        message: 'Message seen successfully',
      });
      return change_data;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

//Delete particular msg [Array of IDs]
exports.postdeletechat = async (req, res, next) => {
  try {
    let { userChatsID, updateBy, status, updateByIp } = await req.body;

    let update_data = await sequelize.transaction(async (t) => {
      let change_data = await UserChats.update(
        {
          updateBy,
          updateByIp,
          status,
        },
        {
          where: {
            userChatsID: userChatsID,
          },
          transaction: t,
        }
      );

      return res.status(200).json({
        status: 200,
        message: 'Message deleted successfully',
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
