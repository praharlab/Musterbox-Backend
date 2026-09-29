const Sequelize = require('sequelize');
const UserSkills = require('../models/userSkills');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { userAttributes } = require('../utils/commonVars');

/**
 * save user skills data.
 *
 * @body {createBy} createBy user id of user who added the user skills.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddUserSkills = async (req, res, next) => {
  try {
    let = { userMasterID, type, details, createBy, createByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await UserSkills.create(
        {
          userMasterID,
          type,
          details,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.userskillsadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all user skills data
 */

exports.getAllUserSkillsData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let user_skills = [];
    if (limit == '' && page == '') {
      user_skills = await UserSkills.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
      });
    } else {
      user_skills = await UserSkills.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await UserSkills.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    return res
      .status(200)
      .json({ status: 200, data: user_skills, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userSkills id
 *
 * @param {id} userSkillsID  to fetch user skills
 */

exports.getUserSkillsById = async (req, res, next) => {
  try {
    let get_one_data = await UserSkills.findOne({
      where: {
        userSkillsID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch user skills
 */

exports.getUserSkillsByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await UserSkills.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
      ],
    });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} userSkillsID  to update id
 */
exports.postUpdateUserSkills = async (req, res, next) => {
  try {
    let = { userSkillsID, userMasterID, type, details, updateBy, updateByIp } =
      await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await UserSkills.update(
        {
          userMasterID,
          type,
          details,
          updateBy,
          updateByIp,
        },
        {
          where: { userSkillsID: userSkillsID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.userskillsupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} userSkillsID  to update status of user skills
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { userSkillsID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await UserSkills.update(
          {
            status: '1',
          },
          {
            where: { userSkillsID: userSkillsID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await UserSkills.update(
          {
            status: '0',
          },
          {
            where: { userSkillsID: userSkillsID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.userskillsdelete,
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
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} userSkillsID  to delete id
 */
exports.postDeleteUserSkillsById = async (req, res, next) => {
  try {
    let = { userSkillsID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await UserSkills.update(
        {
          status: 2,
        },
        {
          where: { userSkillsID: userSkillsID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.userskillsdelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
