const Sequelize = require('sequelize');
const UserEducation = require('../models/userEducation');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
/**
 * save user education data.
 *
 * @body {createBy} createBy user id of user who added the user education.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');

exports.postAddUserEducation = async (req, res, next) => {
  try {
    let {
      userMasterID,
      qualification,
      yearOfPassing,
      grade,
      percentageObtained,
      institute,
      university,
      createBy,
      createByIp,
      verifyStatus,
      verifyBy,
    } = await req.body;

    let degree = '';
    if (req.file) {
      degree = req.file.filename;
    }

    await sequelize.transaction(async (t) => {
      const insert_db_status = await UserEducation.create(
        {
          userMasterID,
          qualification,
          yearOfPassing,
          grade: grade && grade != 'null' ? grade : null,
          degree,
          percentageObtained:
            percentageObtained && percentageObtained != 'null'
              ? percentageObtained
              : null,
          institute,
          university: university && university != 'null' ? university : null,
          createBy,
          createByIp,
          verifyStatus,
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
            activityTable: UserEducation.getTableName(),
            activityTablePK: insert_db_status.toJSON().userEducationID,
            message: `${name.displayName} has added Education Information.`,
            assignedBy: userMasterID,
          },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.usereducationadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all user education data
 */

exports.getAllUserEducationData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let user_education = [];
    if (limit == '' && page == '') {
      user_education = await UserEducation.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      user_education = await UserEducation.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await UserEducation.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    return res
      .status(200)
      .json({ status: 200, data: user_education, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userEducation id
 *
 * @param {id} userEducationID  to fetch user education
 */

exports.getUserEducationById = async (req, res, next) => {
  try {
    let get_one_data = await UserEducation.findOne({
      where: {
        userEducationID: req.params.id,
      },
      include: [
        {
          model: UserMaster,
          include: [
            {
              model: companyMaster,
            },
          ],
        },
      ],
    });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch user education
 */

exports.getUserEducationByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await UserEducation.findAll({
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
 * @param {id} userEducationID  to update id
 */

exports.postUpdateUserEducation = async (req, res, next) => {
  try {
    for (const key of Object.keys(req.body)) {
      if (
        req.body[key] == 'null' ||
        !req.body[key] ||
        req.body[key] == 'undefined'
      ) {
        req.body[key] = null;
      }
    }
    let {
      userEducationID,
      userMasterID,
      qualification,
      yearOfPassing,
      grade,
      degree,
      percentageObtained,
      institute,
      university,
      updateBy,
      updateByIp,
      verifyStatus,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      if (req.file) {
        let change_data_status = await UserEducation.update(
          {
            userMasterID,
            qualification,
            yearOfPassing,
            grade,
            degree: req.file.filename,
            percentageObtained,
            institute,
            university,
            updateBy,
            updateByIp,
            verifyStatus,
          },
          {
            where: { userEducationID: userEducationID },
            transaction: t,
          }
        );
      } else {
        let change_data_status = await UserEducation.update(
          {
            userMasterID,
            qualification,
            yearOfPassing,
            grade,
            percentageObtained,
            institute,
            university,
            updateBy,
            updateByIp,
            verifyStatus,
          },
          {
            where: { userEducationID: userEducationID },
          }
        );
      }

      if (verifyStatus != 0) {
        await UserInbox.destroy({
          where: {
            activityTable: UserEducation.getTableName(),
            activityTablePK: userEducationID,
          },
          transaction: t,
        });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.usereducationupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} userEducationID  to update status of user education
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { userEducationID, status } = await req.body;
    let delete_status;

    if (status == '1') {
      delete_status = await UserEducation.update(
        {
          status: '1',
        },
        {
          where: { userEducationID: userEducationID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await UserEducation.update(
        {
          status: '0',
        },
        {
          where: { userEducationID: userEducationID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.usereducationdelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} userEducationID  to delete id
 */
exports.postDeleteUserEducationById = async (req, res, next) => {
  try {
    let { userEducationID } = await req.body;

    await sequelize.transaction(async (t) => {
      await UserEducation.update(
        {
          status: 2,
        },
        {
          where: { userEducationID: userEducationID },
          transaction: t,
        }
      );

      await UserInbox.destroy({
        where: {
          activityTable: UserEducation.getTableName(),
          activityTablePK: userEducationID,
        },
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.usereducationdelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update verification status of user Education details.
 *
 * @param {id} userEducationID - User Education ID to update verification status.
 * @param {number} verifyStatus - New verification status (2 for Rejected, 1 for Verified).
 * @param {number} verifyBy - User ID of the verifier.
 */

exports.postEduVerifyRequest = async (req, res, next) => {
  try {
    const { userEducationID, verifyStatus, verifyBy, rejectionRemarks } =
      req.body;

    await sequelize.transaction(async (t) => {
      const updateStatus = await UserEducation.update(
        { verifyStatus, verifyBy, rejectionRemarks },
        {
          where: { userEducationID },
          transaction: t,
        }
      );

      await UserInbox.destroy({
        where: {
          activityTable: UserEducation.getTableName(),
          activityTablePK: userEducationID,
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
