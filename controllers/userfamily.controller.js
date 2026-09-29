const Sequelize = require('sequelize');
const userFamily = require('../models/userfamily');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');

/**
 * save user education data.
 *
 * @body {createBy} createBy user id of user who added the user education.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAdduserFamily = async (req, res, next) => {
  try {
    let {
      userMasterID,
      memberName,
      dob,
      gender,
      relation,
      contact,
      createBy,
      createByIp,
      verifyStatus,
      nominee,
      percentForNominee,
      verifyBy,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      let insert_db_status = await userFamily.create(
        {
          userMasterID,
          memberName,
          dob: dob ? dob : null,
          gender,
          relation,
          contact: contact ? contact : null,
          createBy,
          createByIp,
          verifyStatus,
          nominee: nominee ? nominee : null,
          percentForNominee: nominee ? percentForNominee : null,
          verifyBy,
        },
        { transaction: t }
      );

      if (verifyStatus == 0) {
        const name = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID,
          },
        });

        await UserInbox.create(
          {
            activityTable: userFamily.getTableName(),
            activityTablePK: insert_db_status.toJSON().userFamilyID,
            message: `${name.displayName} has added Family Information.`,
            assignedBy: userMasterID,
          },
          { transaction: t }
        );
      }
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.userFamilyadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userFamily id
 *
 * @param {id} userFamilyID  to fetch user education
 */

exports.getuserFamilyById = async (req, res, next) => {
  try {
    let get_one_data = await userFamily.findOne({
      where: {
        userFamilyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ model: UserMaster, include: [{ model: companyMaster }] }],
    });
    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch user education
 */

exports.getuserFamilyByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await userFamily.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    for (var i = 0; i < get_one_data.length; i++) {
      let getCreatedby = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].createBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].createBy = getCreatedby ? getCreatedby.displayName : '';

      let verifyBy = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].verifyBy,
        },
        attributes: ['displayName'],
      });
      get_one_data[i].verifyBy = verifyBy ? verifyBy.displayName : '';
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} userFamilyID  to update id
 */
exports.postUpdateuserFamily = async (req, res, next) => {
  try {
    let {
      userFamilyID,
      userMasterID,
      memberName,
      dob,
      gender,
      relation,
      contact,
      nominee,
      percentForNominee,
      updateBy,
      updateByIp,
      verifyStatus,
    } = await req.body;
    if (nominee == '0') {
      percentForNominee = null;
    }
    await sequelize.transaction(async (t) => {
      let change_data_status = await userFamily.update(
        {
          userMasterID,
          memberName,
          dob: dob ? dob : null,
          gender,
          relation,
          contact: contact ? contact : null,
          nominee: nominee ? nominee : null,
          percentForNominee: nominee ? percentForNominee : null,
          updateBy,
          updateByIp,
          verifyStatus,
        },
        {
          where: { userFamilyID: userFamilyID },
          transaction: t,
        }
      );

      if (verifyStatus != 0) {
        await UserInbox.destroy({
          where: {
            activityTable: userFamily.getTableName(),
            activityTablePK: userFamilyID,
          },
          transaction: t,
        });
      }
    });

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.userFamilyupdate });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} userFamilyID  to update status of user education
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { userFamilyID, status } = await req.body;
    await sequelize.transaction(async (t) => {
      await userFamily.update(
        {
          status,
        },
        {
          where: { userFamilyID: userFamilyID, status: ['1', '0'] },
          transaction: t,
        }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userFamilydelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} userFamilyID  to delete id
 */
exports.postDeleteuserFamilyById = async (req, res, next) => {
  try {
    let { userFamilyID } = await req.body;
    await sequelize.transaction(async (t) => {
      await userFamily.update(
        {
          status: 2,
        },
        {
          where: { userFamilyID: userFamilyID },
          transaction: t,
        }
      );

      await UserInbox.destroy({
        where: {
          activityTable: userFamily.getTableName(),
          activityTablePK: userFamilyID,
        },
        transaction: t,
      });
    });

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.userFamilydelete });
  } catch (err) {
    next(err);
  }
};

/**
 * Update verification status of user family details.
 *
 * @param {id} userFamilyID - User Family ID to update verification status.
 * @param {number} verifyStatus - New verification status (2 for Rejected, 1 for Verified).
 * @param {number} verifyBy - User ID of the verifier.
 */

exports.postVerifyRequest = async (req, res, next) => {
  try {
    const { userFamilyID, verifyStatus, verifyBy, rejectionRemarks } = req.body;

    await sequelize.transaction(async (t) => {
      await userFamily.update(
        { verifyStatus, verifyBy, rejectionRemarks },
        {
          where: { userFamilyID },
          transaction: t,
        }
      );
      await UserInbox.destroy({
        where: {
          activityTable: userFamily.getTableName(),
          activityTablePK: userFamilyID,
        },
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: 'Verification status updated successfully.',
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
