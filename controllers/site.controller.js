const Site = require('../models/site');
const UserMaster = require('../models/userMaster');
const { generateExcel } = require('../utils/exportData');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { userAttributes, companyAttributes, statusCodes } = require('../utils/commonVars');
const moment = require('moment');
const companyMaster = require('../models/companyMaster');
const BranchMaster = require('../models/branchMaster');
const Project = require('../models/project');

exports.addSite = async (req, res, next) => {
  try {
    const { siteName, siteCode, companyMasterID, branchMasterID } = req.body;
    if (!siteName || !companyMasterID || !branchMasterID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });
    const whereConditions = [{ companyMasterID }];

    const orConditions = [];

    if (siteName) {
      orConditions.push(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('siteName'))
          ),
          siteName.trim().toLowerCase()
        )
      );
    }

    if (siteCode) {
      orConditions.push(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('siteCode'))
          ),
          siteCode.trim().toLowerCase()
        )
      );
    }

    if (orConditions.length > 0) {
      whereConditions.push({ [Sequelize.Op.or]: orConditions });
    }

    const existingSameRecord = await Site.findOne({
      where: {
        [Sequelize.Op.and]: whereConditions,
      },
    });

    if (existingSameRecord) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Site With Same Name or Code'
        ),
      });
    }

    await Site.create(
      {
        siteCode,
        siteName,
        companyMasterID,
        branchMasterID,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Site'),
    });
  } catch (error) {
    next(error);
  }
};

exports.listSite = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      searchQuery,
      branchMasterID,
      exportData,
    } = req.body;
    if (!companyMasterID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });
    const condition = {};
    const paginationQuery = {};

    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          siteName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          siteCode: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }
    condition.companyMasterID = companyMasterID;
    if (branchMasterID) {
      condition.branchMasterID = branchMasterID;
    }
    const { rows: siteData, count } = await Site.findAndCountAll({
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
        {
          model: companyMaster,
          attributes: companyAttributes,
        },
        {
          model: BranchMaster,
          attributes: ['branchMasterID', 'branchName', 'branchCode'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (exportData) {
      const dataToExport = siteData.map((e) => ({
        'Company Name': e.companyMaster?.companyName,
        'Branch Name': e.branchMaster?.branchName || '',
        'Site Name': e.siteName,
        'Site Code': e.siteCode,
        'Created By': e.createdByUserDetails?.displayName || '',
        'Created Date': e.createdAt
          ? moment(e.createdAt).format('DD-MM-YYYY HH:mm')
          : '',
      }));

      await generateExcel(dataToExport, 'Site', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: siteData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSiteByID = async (req, res, next) => {
  try {
    let siteID = req.params.id;

    const siteData = await Site.findOne({
      where: {
        siteID,
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
        {
          model: companyMaster,
          attributes: companyAttributes,
        },
        {
          model: BranchMaster,
          attributes: ['branchMasterID', 'branchName', 'branchCode'],
        },
      ],
    });

    if (!siteData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Site'),
      });
    }

    return res.status(200).json({
      status: 200,
      data: siteData,
    });
  } catch (error) {
    next(error);
  }
};

exports.editSite = async (req, res, next) => {
  try {
    const { siteID, siteCode, siteName } = req.body;

    const existingRecord = await Site.findOne({
      where: { siteID },
    });

    if (!existingRecord) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Site'),
      });
    }
    const whereConditions = [
      {
        companyMasterID: existingRecord.companyMasterID,
      },
      {
        siteID: {
          [Sequelize.Op.ne]: siteID,
        },
      },
    ];

    const orConditions = [];
    

    if (siteName) {
      orConditions.push(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('siteName'))
          ),
          siteName.trim().toLowerCase()
        )
      );
    }

    if (siteCode) {
      orConditions.push(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('siteCode'))
          ),
          siteCode.trim().toLowerCase()
        )
      );
    }

    if (orConditions.length > 0) {
      whereConditions.push({
        [Sequelize.Op.or]: orConditions,
      });
    }
    const existingSameRecord = await Site.findOne({
      where: {
        [Sequelize.Op.and]: whereConditions,
      },
    });
    if (existingSameRecord) {
      return res.status(409).json({
        status: 409,
        message: message.usermessage.alreadyExists(
          'Site'
        ),
      });
    }

    // Update the record
    await Site.update(
      { siteCode, siteName },
      {
        where: { siteID },
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Site'),
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSite = async (req, res, next) => {
  try {
    const { siteID } = req.body;

    const findData = await Site.findByPk(siteID);

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Site'),
      });
    }

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Site'),
    });
  } catch (error) {
    next(error);
  }
};

