const AttendanceCorrectionReason = require('../models/attendanceCorrectionReason');
const UserMaster = require('../models/userMaster');
const { generateExcel } = require('../utils/exportData');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { userAttributes } = require('../utils/commonVars');
const moment = require('moment');
const companyMaster = require('../models/companyMaster');
// const companyMaster = require('../models/companyMaster');

exports.addAttendanceCorrectionReason = async (req, res, next) => {
  try {
    const { reason, companyMasterID } = req.body;

    const existReason = await AttendanceCorrectionReason.findOne({
      where: {
        reason: {
          [Sequelize.Op.iLike]: reason,
        },
        companyMasterID: companyMasterID,
      },
    });

    if (existReason) {
      return res.status(200).json({
        status: 409,
        message: message.usermessage.alreadyExists(
          'Attendance Correction Reason With Same Name'
        ),
      });
    }

    await AttendanceCorrectionReason.create(
      {
        reason,
        companyMasterID,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Attendance Correction Reason'),
    });
  } catch (error) {
    next(error);
  }
};

exports.listAttendanceCorrectionReason = async (req, res, next) => {
  try {
    let { page, limit, companyMasterID, searchQuery, exportData } = req.body;

    const condition = {};
    const paginationQuery = {};

    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (searchQuery) {
      condition.reason = { [Op.iLike]: `%${searchQuery}%` };
    }
    condition[Sequelize.Op.or] = [
      {
        companyMasterID: companyMasterID,
      },
      {
        companyMasterID: null,
      },
    ];

    const { rows: attendanceData, count } =
      await AttendanceCorrectionReason.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            required: false,
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

    if (exportData) {
      const dataToExport = attendanceData.map((e) => ({
        Reason: e.reason,
        'Created By': e.createdByUserDetails?.displayName || '',
        'Created Date': e.createdAt
          ? moment(e.createdAt).format('DD-MM-YYYY HH:mm')
          : '',
      }));

      await generateExcel(
        dataToExport,
        'Attendance Correction Reasons',
        'xlsx',
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      data: attendanceData,
      totalcount: count,
    });
  } catch (error) {
    console.error('Error listing attendance correction reasons:', error);
    next(error);
  }
};

exports.getAttendanceCorrectionReasonByID = async (req, res, next) => {
  try {
    let attendanceCorrectionReasonID = req.params.id;

    const attendanceData = await AttendanceCorrectionReason.findOne({
      where: {
        attendanceCorrectionReasonID,
      },
      include: [
        {
          required: false,
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    if (!attendanceData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage(
          'Attendance Correction Reason'
        ),
      });
    }

    return res.status(200).json({
      status: 200,
      data: attendanceData,
    });
  } catch (error) {
    next(error);
  }
};

exports.editAttendanceCorrectionReasonByID = async (req, res, next) => {
  try {
    const { attendanceCorrectionReasonID, reason } = req.body;

    const existingRecord = await AttendanceCorrectionReason.findOne({
      where: { attendanceCorrectionReasonID },
    });

    if (!existingRecord) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage(
          'Attendance Correction Reason'
        ),
      });
    }

    const sameExistingReason = await AttendanceCorrectionReason.findOne({
      where: {
        attendanceCorrectionReasonID: {
          [Sequelize.Op.ne]: attendanceCorrectionReasonID,
        },
        reason: sequelize.where(
          sequelize.fn('LOWER', sequelize.fn('TRIM', sequelize.col('reason'))),
          reason.trim().toLowerCase()
        ),
        companyMasterID: existingRecord.companyMasterID,
      },
    });

    if (sameExistingReason) {
      return res.status(409).json({
        status: 409,
        message: message.usermessage.alreadyExists(
          'Attendance Correction Reason'
        ),
      });
    }

    // Update the record
    await AttendanceCorrectionReason.update(
      { reason },
      {
        where: { attendanceCorrectionReasonID },
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage(
        'Attendance Correction Reason'
      ),
    });
  } catch (error) {
    console.error('Error editing attendance correction reason:', error);
    next(error);
  }
};

exports.deleteAttendanceCorrectionReasonByID = async (req, res, next) => {
  try {
    const { attendanceCorrectionReasonID } = req.query;

    const findData = await AttendanceCorrectionReason.findByPk(
      attendanceCorrectionReasonID
    );

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage(
          'Attendance Correction Reason'
        ),
      });
    }

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage(
        'Attendance Correction Reason'
      ),
    });
  } catch (error) {
    console.error('Error deleting attendance correction reason:', error);
    next(error);
  }
};

exports.addCorrectionReasonToAllCompany = async (req, res, next) => {
  try {
    const findCompany = await companyMaster.findAll({
      attributes: ['companyMasterID', 'companyName'],
      order: [['companyMasterID', 'ASC']],
    });
    const createData = [];
    for (let company of findCompany) {
      const data = {
        reason: 'Other',
        isDefault: true,
        companyMasterID: company.companyMasterID,
      };
      createData.push(data);
    }

    //Create Bulk
    if (createData.length > 0) {
      await AttendanceCorrectionReason.bulkCreate(createData, {
        user: req.userDetails,
      });
    }
    return res.status(200).json({
      status: 200,
      message: `${findCompany.length} -  company Changed`,
    });
  } catch (error) {
    console.error('Error deleting attendance correction reason:', error);
    next(error);
  }
};
