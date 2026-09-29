const hr_ToolKit = require('../models/hrToolKit');
const logger = require('../config/logger');
const message = require('../response_message/message');
const CityMaster = require('../models/citymaster');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const sequelize = require('../config/database');
const subscriptionPlan = require('../models/subscriptionPlan');

exports.postAddDocument = async (req, res, next) => {
  try {
    let = { DocumentName, No_of_file, createBy, createByIp } = await req.body;
    let DocumentZip = '';
    if (req.file) {
      DocumentZip = req.file.filename;
    }
    let insert_db_status = await hr_ToolKit.create({
      DocumentName,
      No_of_file,
      DocumentZip,
      status: 1,
      createBy,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: 'Hr ToolKit added successfully',
      data: insert_db_status,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAllHRADocument = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let company_master, totalcount;
    if (searchQuery && page && limit) {
      company_master = await hr_ToolKit.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { DocumentName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          status: ['1', '0'],
        },
        order: [['hrTollKitID', 'ASC']],
        limit: limit,
        offset: offset,
      });

      totalcount = await hr_ToolKit.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { DocumentName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          status: ['1', '0'],
        },
        order: ['hrTollKitID', 'ASC'],
      });
    } else if (searchQuery && page == '' && limit == '') {
      company_master = await hr_ToolKit.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            { DocumentName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          status: ['1', '0'],
        },
        order: [['hrTollKitID', 'ASC']],
      });

      totalcount = company_master.length;
    } else if (page == '' && limit == '') {
      company_master = await hr_ToolKit.findAll({
        raw: true,
        where: { status: ['1', '0'] },
        order: [['createdAt', 'ASC']],
      });

      totalcount = await hr_ToolKit.count({
        raw: true,
        where: { status: ['1', '0'] },
      });
    } else {
      company_master = await hr_ToolKit.findAll({
        raw: true,
        where: { status: ['1', '0'] },
        order: [['createdAt', 'ASC']],

        offset: offset,
        limit: limit,
      });

      totalcount = await hr_ToolKit.count({
        raw: true,
        where: { status: ['1', '0'] },
      });
    }

    res.status(200).json({
      status: 200,
      message: 'HR Toolkit Data got successfully',
      data: company_master,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteHRToolKitById = async (req, res, next) => {
  try {
    let = { hrTollKitID } = await req.body;

    let delete_status = await hr_ToolKit.update(
      {
        status: '2',
      },
      {
        where: { hrTollKitID: hrTollKitID, status: ['1', '0'] },
      }
    );
    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: 'HR ToolKit deleted Successfully',
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

exports.postCHANGESTATUSById = async (req, res, next) => {
  try {
    let = { hrTollKitID, status } = await req.body;

    let update_status = await hr_ToolKit.update(
      {
        status: status,
      },
      {
        where: { hrTollKitID: hrTollKitID },
      }
    );
    if (update_status != 0) {
      res.status(200).json({
        status: 200,
        message: 'HR ToolKit Status Change Successfully',
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
