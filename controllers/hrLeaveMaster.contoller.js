const Sequelize = require('sequelize');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const fs = require('fs');
const HrleaveTypes = require('../models/hrLeaveTypes');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const path = require('path');
/**
 * save HrLeaveMaster data.
 *
 * @body {createBy} createBy user id of user who added the HrLeaveMaster.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddLeaveMaster = async (req, res, next) => {
  try {
    let { LeaveName, LeaveDesc, createCF, createByIp } = await req.body;

    const existingLeaveType = await HrLeaveMaster.findOne({
      where: {
        LeaveName,
        status: ['0', '1'],
      },
    });

    if (existingLeaveType) {
      return res.status(200).json({
        status: 401,
        message: ' Leave type already exists.',
      });
    }

    await sequelize.transaction(async (t) => {
      const insert_db_status = await HrLeaveMaster.create(
        {
          LeaveName,
          LeaveDesc,
          createBy: req.userDetails.userMasterId,
          createByIp,
        },
        { transaction: t }
      );

      if (createCF) {
        await HrLeaveMaster.create(
          {
            LeaveName: LeaveName + '-CF',
            LeaveDesc,
            CF_LeaveID: insert_db_status.LeaveID,
            createBy: req.userDetails.userMasterId,
            createByIp,
          },
          { transaction: t }
        );
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Leave type'),
      // data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all LeaveMaster data
 */

exports.getAllLeaveMaster = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const getUserType = await UserMaster.findOne({
      where: {
        userMasterID: req.userDetails.userMasterId,
      },
    });

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: [0, 1],
    };

    if (!getUserType || (getUserType && getUserType.admin != 2))
      condition.CF_LeaveID = {
        [Sequelize.Op.is]: null,
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { LeaveName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await HrLeaveMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with HrLeaveMaster id
 *
 * @param {id} LeaveID  to fetch Payhead type
 *
 */

exports.getLeaveMasterById = async (req, res, next) => {
  try {
    let get_one_data = await HrLeaveMaster.findOne({
      where: {
        LeaveID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id}  LeaveID  to update id
 */
exports.postUpdateLeaveMaster = async (req, res, next) => {
  try {
    let = { LeaveID, LeaveName, LeaveDesc, updateByIp } = await req.body;

    const existingLeaveType = await HrLeaveMaster.findOne({
      where: {
        LeaveName,
        LeaveID: {
          [Sequelize.Op.ne]: LeaveID,
        },
        status: ['0', '1'],
      },
    });

    if (existingLeaveType) {
      return res.status(200).json({
        status: 401,
        message: ' Leave type already exists.',
      });
    }

    await HrLeaveMaster.update(
      {
        LeaveName,
        LeaveDesc,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      {
        where: { LeaveID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Leave type'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} LeaveID  to update status of HrLeaveMasterID
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { LeaveID, status } = await req.body;

    if (status != '1') {
      let data = await HrleaveTypes.findOne({
        where: {
          LeaveID: LeaveID,
          status: ['0', '1'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Leave Type.Already used in companies.',
        });
      }
    }

    await HrLeaveMaster.update(
      {
        status,
      },
      {
        where: { LeaveID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Leave type')
          : message.usermessage.deactiveMessage('Leave type'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
/**
 * delete by i
 *
 * @param {id} LeaveID  to delete id
 */
exports.postDeleteLeaveMasterID = async (req, res, next) => {
  try {
    let = { LeaveID } = await req.body;

    let data = await HrleaveTypes.findOne({
      where: {
        LeaveID,
        status: ['0', '1'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Leave Type.Already used in companies.',
      });
    } else {
      await HrLeaveMaster.update(
        {
          status: 2,
        },
        {
          where: { LeaveID },
        }
      );
      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Leave type '),
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * import HrLeaveMaster data
 * @param {file}
 */
exports.postImportData = async (req, res, next) => {
  try {
    const file = req.file;
    let { createBy, createByIp } = req.body;

    if (!file) {
      const error = new Error('No File');
      error.httpStatusCode = 400;
      console.log('Getting error :-', error);
      return next(error);
    } else {
      const filePath = path.join(__dirname, `../uploads/${file.filetype}`);

      fs.readFile(filePath, async (err, data) => {
        if (err) throw err;

        const LeaveMaster = JSON.parse(data);

        await HrLeaveMaster.bulkCreate(LeaveMaster, {
          returning: true,
        });

        return res.json({ success: 200, message: 'data inserted' });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getActiveLeaveMaster = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { LeaveName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const { rows, count } = await HrLeaveMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      raw: true,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

// Add CF Data

exports.addCFData = async (req, res, next) => {
  try {
    const find_AllData = await HrLeaveMaster.findAll({
      where: {
        LeaveID: {
          [Sequelize.Op.notIn]: [1, 5, 7, 9, 18, 20, 21, 22, 23, 24, 25, 26],
        },
        status: 1,
      },
    });

    const finalData = [];

    for (const data of find_AllData) {
      finalData.push({
        LeaveName: data.LeaveName + '-CF',
        LeaveDesc: data.LeaveDesc,
        createBy: data.createBy,
        CF_LeaveID: data.LeaveID,
      });
    }

    // await sequelize.transaction(async (t) => {
    //   await HrLeaveMaster.bulkCreate(finalData, { transaction: t });
    // });

    return res.status(200).json({
      status: 200,
      data: finalData,
      message: 'Data added successfully.',
    });
  } catch (error) {
    next(error);
  }
};
// To Add Data in All Company
exports.addCFDataInAllCompany = async (req, res, next) => {
  try {
    const findAllCompanyData = await HrleaveTypes.findAll({
      where: {
        status: 1,
      },
      // include: [{ model: HrLeaveMaster, as: 'LeaveMaster', where: { CF_LeaveID: { [Sequelize.Op.ne]: null } } }]
    });

    const masterData = await HrLeaveMaster.findAll({
      where: {
        status: 1,
        CF_LeaveID: { [Sequelize.Op.ne]: null },
      },
    });

    const finalData = [];

    for (const data of findAllCompanyData) {
      const find = masterData.find((e) => e.CF_LeaveID == data.LeaveID);
      if (!find) continue;
      finalData.push({
        LeaveID: find.LeaveID,
        companyMasterID: data.companyMasterID,
        Leave_Allow: 'N',
        Leave_CF: 'N',
        Leave_Max_Days: 0,
        createBy: data.createBy,
      });
    }

    return res.status(200).json({
      status: 200,
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};
