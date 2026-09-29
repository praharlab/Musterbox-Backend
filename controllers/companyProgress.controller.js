const companyProgress = require('../models/companyProgress');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const CompanyServiceStatus = require('../models/companyServiceStatus');
const UserMaster = require('../models/userMaster');
const moment = require('moment');

const { generateExcel } = require('../utils/exportData');

exports.postadd = async (req, res, next) => {
  try {
    const { companyMasterID, CompanyServiceStatusID, remarks } = await req.body;

    const sameCompanyServiceStatusID = await companyProgress.findOne({
      where: {
        companyMasterID,
      },
      attributes: ['CompanyServiceStatusID'],
      order: [['createdAt', 'DESC']],
    });

    if (
      sameCompanyServiceStatusID &&
      CompanyServiceStatusID ==
        sameCompanyServiceStatusID.CompanyServiceStatusID
    ) {
      return res.status(200).json({
        status: 200,
      });
    }

    await companyProgress.create(
      {
        companyMasterID,
        CompanyServiceStatusID,
        // userMasterID,
        remarks,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company Progress'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getdatabyCompanyId = async (req, res, next) => {
  try {
    let { companyMasterID } = await req.body;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    const rows = await companyProgress.findOne({
      where: {
        companyMasterID,
      },
      include: [
        {
          required: true,
          model: companyMaster,
        },
        {
          model: CompanyServiceStatus,
          attributes: ['CompanyServiceStatusName', 'CompanyServiceStatusID'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.getdatabyCompanyStatusId = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, CompanyServiceStatusID } = await req.body;
    const condition = {};

    if (CompanyServiceStatusID)
      condition.CompanyServiceStatusID = CompanyServiceStatusID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$companyServiceStatus.CompanyServiceStatusName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};
    {
    }

    const { rows, count } = await companyProgress.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          required: true,
          model: CompanyServiceStatus,
          attributes: [
            'CompanyServiceStatusID',
            'CompanyServiceStatusName',
            'status',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const data = await companyProgress.findOne({
      where: {
        companyProgressID: id,
      },
      include: [
        { required: true, model: companyMaster },
        {
          required: true,
          model: CompanyServiceStatus,
          attributes: [
            'CompanyServiceStatusID',
            'CompanyServiceStatusName',
            'status',
          ],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatedata = async (req, res, next) => {
  try {
    const { CompanyServiceStatusID, remarks } = req.body;

    const currentdata = await companyProgress.findOne({
      where: {
        companyProgressID: req.params.id,
      },
    });

    // currentdata.companyMasterID = companyMasterID;
    currentdata.CompanyServiceStatusID = CompanyServiceStatusID;
    currentdata.remarks = remarks;
    // currentdata.userMasterID = userMasterID;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Company Progress'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deletedatabyId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await companyProgress.findByPk(id);

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Company Progress'),
      });
    }

    // Perform deletion
    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Company Progress'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getdatabyUserMasterId = async (req, res, next) => {
  try {
    const { page, limit, userMasterID } = await req.body;
    const condition = {};

    if (userMasterID) condition.userMasterID = userMasterID;

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};
    {
    }

    const getdata = await companyProgress.findOne({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
        },
        {
          model: CompanyServiceStatus,
          attributes: ['CompanyServiceStatusName', 'CompanyServiceStatusID'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    // const getdata = await companyMaster.findOne({
    //     where: condition,
    //     ...paginationQuery,
    //     include: [
    //         {
    //             model: CompanyServiceStatus,
    //             order: [['createdAt', 'DESC']],
    //             limit: 1
    //         },
    //         {
    //             model: UserMaster,
    //             where: { userMasterID }
    //         }
    //     ]
    // });

    return res.status(200).json({ status: 200, data: getdata });
  } catch (err) {
    next(err);
  }
};

exports.getdatabyIds = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, CompanyServiceStatusID } =
      await req.body;

    const condition = {};

    if (userMasterID) condition.userMasterID = userMasterID;

    if (CompanyServiceStatusID)
      condition.CompanyServiceStatusID = CompanyServiceStatusID;

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};
    {
    }

    const { rows } = await companyProgress.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: CompanyServiceStatus,
          attributes: ['CompanyServiceStatusName', 'CompanyServiceStatusID'],
        },
      ],
    });

    return res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    next(err);
  }
};

exports.gethistroydata = async (req, res, next) => {
  try {
    const { companyMasterID, Exports } = req.query;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    const rows = await companyProgress.findAll({
      where: {
        companyMasterID,
      },
      include: [
        {
          required: true,
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: CompanyServiceStatus,
          attributes: ['CompanyServiceStatusName'],
        },
        {
          model: UserMaster,
          as: 'createdBy',
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (Exports) {
      const finaldata = rows.map((e) => {
        return {
          // 'Date & Time': e.createdAt || 'DD-MM-YYYY HH:MM',
          'Company Stage Date & Time': e.createdAt
            ? moment(e.createdAt).format('DD-MM-YYYY HH:mm')
            : 'dd-MM-yyyy hh:mm',
          'Company Statges': e.companyServiceStatus.CompanyServiceStatusName,
          'Updated By ': e.createdBy.displayName,
        };
      });

      await generateExcel(finaldata, 'Company Stages History', 'xlsx', res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    next(err);
  }
};
