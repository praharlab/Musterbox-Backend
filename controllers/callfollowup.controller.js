const CallFollowup = require('../models/callfollowup');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Customer = require('../models/customer');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
/**
 * save callfollowup data.
 *
 * @body {createBy} createBy user id of user who added the callfollowup.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCallFollowup = async (req, res, next) => {
  try {
    let {
      visitID,
      customerCompanyID,
      callDateTime,
      estimatedTime,
      remarks,
      callFollowUpStatus,
      userMasterID,
      contactPersonName,
      contactPersonNumber,
      status,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await CallFollowup.create(
        {
          visitID,
          customerCompanyID,
          callDateTime,
          estimatedTime,
          remarks,
          callFollowUpStatus,
          userMasterID,
          contactPersonName,
          contactPersonNumber,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.callfollowupadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with CallFollowup id
 *
 * @param {id} CallFollowupID  to fetch callfollowup name
 */

exports.getCallFollowupId = async (req, res, next) => {
  try {
    let get_one_data = await CallFollowup.findOne({
      where: { callFollowUpID: req.params.id, status: ['0', '1'] },
      raw: true,
    });
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} CallFollowupID  to update id
 */
exports.postUpdateCallFollowup = async (req, res, next) => {
  try {
    let {
      callFollowUpID,
      visitID,
      customerCompanyID,
      callDateTime,
      estimatedTime,
      remarks,
      callFollowUpStatus,
      userMasterID,
      contactPersonName,
      contactPersonNumber,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await CallFollowup.update(
        {
          visitID,
          customerCompanyID,
          callDateTime,
          estimatedTime,
          remarks,
          callFollowUpStatus,
          userMasterID,
          contactPersonName,
          contactPersonNumber,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { callFollowUpID: callFollowUpID },
          transaction: t,
        }
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.callfollowupupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} CallFollowupID  to delete id
 */
exports.postDeleteCallFollowupById = async (req, res, next) => {
  try {
    let { callFollowUpID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await CallFollowup.update(
        {
          status: '2',
        },
        {
          where: { callFollowUpID: callFollowUpID },
          transaction: t,
        }
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.callfollowupdelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { callFollowUpID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await CallFollowup.update(
        {
          status: '1',
        },
        {
          where: { callFollowUpID: callFollowUpID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await CallFollowup.update(
        {
          status: '0',
        },
        {
          where: { callFollowUpID: callFollowUpID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.callfollowupdelete,
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
  } catch (err) {
    next(err);
  }
};

exports.getCallFollowupuserid = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['callDateTime', 'DESC']];
    condition.status = [0, 1];

    if (startdate && enddate)
      condition.callDateTime = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    if (userMasterID) condition.userMasterID = userMasterID;
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          contactPersonName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          contactPersonNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const AllCallFollowUp = await CallFollowup.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: Customer },
      ],
    });

    for (var j = 0; j < AllCallFollowUp.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllCallFollowUp.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllCallFollowUp.rows[j].updateBy },
      });

      if (user1)
        AllCallFollowUp.rows[j].createBy = user1.dataValues.displayName;
      if (user2)
        AllCallFollowUp.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res
      .status(200)
      .json({
        status: 200,
        data: AllCallFollowUp.rows,
        totalcount: AllCallFollowUp.count,
      });
  } catch (err) {
    next(err.message);
  }
};

exports.getCallFollowupvisitid = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, id } = await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['callDateTime', 'DESC']];
    if (id) condition.visitID = id;
    if (startdate && enddate) {
      const futureDate = new Date(new Date(enddate).getTime() + 86400000)
        .toISOString()
        .slice(0, 10);
      condition.callDateTime = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(futureDate)],
      };
    }
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          contactPersonName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          contactPersonNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const AllCallFollowUp = await CallFollowup.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        { model: Customer },
      ],
    });

    for (var j = 0; j < AllCallFollowUp.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllCallFollowUp.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllCallFollowUp.rows[j].updateBy },
      });

      if (user1)
        AllCallFollowUp.rows[j].createBy = user1.dataValues.displayName;
      if (user2)
        AllCallFollowUp.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res
      .status(200)
      .json({
        status: 200,
        data: AllCallFollowUp.rows,
        totalcount: AllCallFollowUp.count,
      });
  } catch (err) {
    next(err.message);
  }
};
