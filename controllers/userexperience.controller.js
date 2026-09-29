const Sequelize = require('sequelize');
const UserExperience = require('../models/userExperience');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');

/**
 * save user experience data.
 *
 * @body {createBy} createBy user id of user who added the user experience.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddUserExperience = async (req, res, next) => {
  try {
    let {
      userMasterID,
      designation,
      fromDate,
      toDate,
      organization,
      roleRespo,
      createBy,
      createByIp,
      verifyStatus,
      verifyBy,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      const insert_db_status = await UserExperience.create(
        {
          userMasterID,
          designation,
          fromDate: fromDate ? fromDate : null,
          toDate: toDate ? toDate : null,
          organization,
          roleRespo,
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
            activityTable: UserExperience.getTableName(),
            activityTablePK: insert_db_status.toJSON().userExperienceID,
            message: `${name.displayName} has added Experience.`,
            assignedBy: userMasterID,
          },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userexperienceadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all user experience data
 */

exports.getAllUserExperienceData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let user_experience = [];
    if (limit == '' && page == '') {
      user_experience = await UserExperience.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      user_experience = await UserExperience.findAll({
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

    const totalcount = await UserExperience.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: user_experience, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userExperience id
 *
 * @param {id} userExperienceID  to fetch user experience
 */

exports.getUserExperienceById = async (req, res, next) => {
  try {
    let get_one_data = await UserExperience.findOne({
      where: {
        userExperienceID: req.params.id,
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
 * @param {id} userMasterID  to fetch user experience
 */

exports.getUserExperienceByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await UserExperience.findAll({
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
 * @param {id} userExperienceID  to update id
 */
exports.postUpdateUserExperience = async (req, res, next) => {
  try {
    let {
      userExperienceID,
      userMasterID,
      designation,
      fromDate,
      toDate,
      organization,
      roleRespo,
      updateBy,
      updateByIp,
      verifyStatus,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      await UserExperience.update(
        {
          userMasterID,
          designation,
          fromDate: fromDate ? fromDate : null,
          toDate: toDate ? toDate : null,
          organization,
          roleRespo,
          updateBy,
          updateByIp,
          verifyStatus,
        },
        {
          where: { userExperienceID: userExperienceID },
          transaction: t,
        }
      );

      if (verifyStatus != 0) {
        await UserInbox.destroy({
          where: {
            activityTable: UserExperience.getTableName(),
            activityTablePK: userExperienceID,
          },
          transaction: t,
        });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userexperienceupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} userExperienceID  to update status of user experience
 */

// exports.poststatuschange = async (req, res, next) => {
//   try {
//     let = { userExperienceID, status } = await req.body;
//     let delete_status;
//     let result = await sequelize.transaction(async (t) => {
//       if (status == '1') {
//         delete_status = await UserExperience.update(
//           {
//             status: '1',
//           },
//           {
//             where: { userExperienceID: userExperienceID, status: ['1', '0'] },
//             transaction: t,
//           }
//         );
//       } else {
//         delete_status = await UserExperience.update(
//           {
//             status: '0',
//           },
//           {
//             where: { userExperienceID: userExperienceID, status: ['1', '0'] },
//             transaction: t,
//           }
//         );
//       }

//       if (delete_status != 0) {
//         logger.info(
//           `userExperience Delete by id ${delete_status} Delete By user Id 1`
//         );
//         res.status(200).json({
//           status: 200,
//           message: message.usermessage.userexperiencedelete,
//           data: {},
//         });
//       } else {
//         res.status(200).json({
//           status: 200,
//           message: message.usermessage.deletedrecord,
//           data: {},
//         });
//       }
//       return delete_status;
//     });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 200;
//     }
//     next(err);
//   }
// };

// active,deactive user
exports.poststatuschange = async (req, res, next) => {
  try {
    let { userExperienceID, status } = await req.body;

    await UserExperience.update(
      {
        status,
      },
      {
        where: { userExperienceID },
      }
    );
    await UserInbox.destroy(
      {
        where: {
          activityTable: UserExperience.getTableName(),
          activityTablePK: userExperienceID,
        },
      }
      // { transaction: t }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('User Experience')
          : message.usermessage.deactiveMessage('User Experience'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by id
 *
 * @param {id} userExperienceID  to delete id
 */
exports.postDeleteUserExperienceById = async (req, res, next) => {
  try {
    let { userExperienceID } = await req.body;
    await sequelize.transaction(async (t) => {
      await UserExperience.update(
        {
          status: 2,
        },
        {
          where: { userExperienceID: userExperienceID },
          transaction: t,
        }
      );

      await UserInbox.destroy({
        where: {
          activityTable: UserExperience.getTableName(),
          activityTablePK: userExperienceID,
        },
        transaction: t,
      });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userexperiencedelete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update verification status of user Experience details.
 *
 * @param {id} userExperienceID - user Experience ID to update verification status.
 * @param {number} verifyStatus - New verification status (2 for Rejected, 1 for Verified).
 * @param {number} verifyBy - User ID of the verifier.
 */

exports.postexpVerifyRequest = async (req, res, next) => {
  try {
    const { userExperienceID, verifyStatus, verifyBy, rejectionRemarks } =
      req.body;

    await sequelize.transaction(async (t) => {
      await UserExperience.update(
        { verifyStatus, verifyBy, rejectionRemarks },
        {
          where: { userExperienceID },
          transaction: t,
        }
      );

      await UserInbox.destroy({
        where: {
          activityTable: UserExperience.getTableName(),
          activityTablePK: userExperienceID,
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
