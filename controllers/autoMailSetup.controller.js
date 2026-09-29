const Sequelize = require('sequelize');
const AutoMailSetup = require('../models/autoMailSetup');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');

exports.addData = async (req, res, next) => {
  try {
    const { companyMasterID, userMasterID, mailType, mailMode, time, day } =
      req.body;

    const findMailSetUp = await AutoMailSetup.findOne({
      where: {
        companyMasterID: companyMasterID,
        mailType: mailType,
        status: 1,
      },
    });

    if (findMailSetUp)
      return res.status(200).json({
        status: 401,
        message:
          'Auto Mail Setup already exist for ' +
          mailType +
          ', Please Modify the created record to make changes!',
      });

    await AutoMailSetup.create(
      {
        companyMasterID,
        userMasterID,
        mailType,
        mailMode,
        time,
        day: mailMode == 'daily' ? null : day,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: 'AutoMailSetup added successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const { id, companyMasterID, userMasterID, mailType, mailMode, time, day } =
      req.body;

    const findData = await AutoMailSetup.findByPk(id);

    const findMailSetUp = await AutoMailSetup.findOne({
      where: {
        companyMasterID: companyMasterID,
        mailType: mailType,
        status: 1,
        id: { [Sequelize.Op.ne]: id },
      },
    });

    if (findMailSetUp)
      return res.status(200).json({
        status: 401,
        message:
          'Auto Mail Setup already exist for ' +
          mailType +
          ', Please Modify the created record to make changes!',
      });

    findData.companyMasterID = companyMasterID;
    findData.userMasterID = userMasterID;
    findData.mailType = mailType;
    findData.mailMode = mailMode;
    findData.time = time;
    findData.day = mailMode == 'daily' ? null : day;

    await findData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: 'AutoMailSetup updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.listData = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, mailType, search } = req.body;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;
    if (mailType) condition.mailType = mailType;

    if (search)
      condition[Sequelize.Op.or] = [
        { mailType: { [Sequelize.Op.iLike]: `%${search}%` } },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: `%${search}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const data = await AutoMailSetup.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      status: 200,
      data: data.rows,
      totalcount: data.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await AutoMailSetup.findByPk(id);

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: 'AutoMailSetup deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const findData = await AutoMailSetup.findByPk(id, {
      include: [{ model: companyMaster, attributes: ['companyName'] }],
    });

    return res.status(200).json({
      status: 200,
      data: findData,
    });
  } catch (error) {
    next(error);
  }
};
