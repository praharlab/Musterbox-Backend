const Sequelize = require('sequelize');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const AppointmentLetter = require('../models/appointment');
const sequelize = require('../config/database');

exports.addAppointmentLetter = async (req, res, next) => {
  try {
    const {
      appointmentLetterName,
      letterHead,
      letterTemplate,
      companyMasterID,
    } = await req.body;

    const find_SameData = await AppointmentLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('appointmentLetterName'))
          ),
          appointmentLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${appointmentLetterName} already exist`,
      });
    }

    await AppointmentLetter.create(
      {
        appointmentLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: 'Appointment Letter Template Added successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentLetter = async (req, res, next) => {
  try {
    const { appointmentLetterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (appointmentLetterID) {
      const getappointmentLetter = await AppointmentLetter.findOne({
        raw: true,
        where: {
          appointmentLetterID: appointmentLetterID,
        },
        include: [
          {
            model: companyMaster,
          },
        ],
      });

      return res.status(200).json({
        status: 200,
        data: getappointmentLetter,
      });
    }

    const condition = {};

    condition.status = 1;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          appointmentLetterName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const { rows, count } = await AppointmentLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
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

exports.updateAppointmentLetter = async (req, res, next) => {
  try {
    const {
      appointmentLetterID,
      appointmentLetterName,
      letterHead,
      letterTemplate,
      companyMasterID,
    } = await req.body;

    const find_SameData = await AppointmentLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('appointmentLetterName'))
          ),
          appointmentLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('appointmentLetterID'), {
          [Sequelize.Op.ne]: appointmentLetterID,
        })
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${appointmentLetterName} already exist`,
      });
    }

    await AppointmentLetter.update(
      {
        appointmentLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      { where: { appointmentLetterID: appointmentLetterID } }
    );

    return res.status(200).json({
      status: 200,
      message: 'Appointment Letter Updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAppointmentLetter = async (req, res, next) => {
  try {
    const { appointmentLetterID } = await req.body;

    await AppointmentLetter.update(
      { status: 2 },
      { where: { appointmentLetterID: appointmentLetterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Letter deleted successfully' });
  } catch (err) {
    next(err);
  }
};
