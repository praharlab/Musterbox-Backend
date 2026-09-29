const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const empLetterHead = require('../models/empLetterHead');
const letterHead = require('../models/letterHead');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.AddempLetterHead = async (req, res, next) => {
  try {
    let {
      userMasterID,
      pdf,
      letterID,
      issueDate,
      show,
      status,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await empLetterHead.create(
        {
          userMasterID,
          pdf,
          letterID,
          issueDate,
          // issueDate:new Date(),
          show,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.empletterHeadAdd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

exports.postUpdateEmpLetter = async (req, res, next) => {
  try {
    let {
      empLetterId,
      userMassterID,
      pdf,
      letterID,
      issueDate,
      updateBy,
      updateByIp,
    } = req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await empLetterHead.update(
        {
          empLetterId,
          userMassterID,
          pdf,
          letterID,
          issueDate,
          updateBy,
          updateByIp,
        },
        {
          where: { empLetterId: empLetterId },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.empletterHeadUpdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err.message);
  }
};

exports.postDeleteLetterById = async (req, res, next) => {
  try {
    let { empLetterId } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await empLetterHead.update(
        {
          status: '2',
        },
        {
          where: { empLetterId: empLetterId },
          transaction: t,
        }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.empletterHeadDelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getbyLetterId = async (req, res, next) => {
  try {
    let get_one_data = await empLetterHead.findOne({
      where: { empLetterId: req.params.id },
    });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err.message);
  }
};

exports.getLetterDataByUserId = async (req, res, next) => {
  try {
    let { userMasterID } = req.body;
    let get_one_data = await empLetterHead.findAll({
      where: { userMasterID: userMasterID, status: 1 },
      include: [
        {
          model: letterHead,
          as: 'letterHead',
        },
        {
          model: UserMaster,
          as: 'employee',
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err.message);
  }
};
