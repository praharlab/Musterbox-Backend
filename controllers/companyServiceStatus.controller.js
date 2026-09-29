const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyServiceStatus = require('../models/companyServiceStatus');
const message = require('../response_message/message');
const logger = require('../config/logger');
const {
  generateExcel,
  genrateDemoExcelForContractor,
} = require('../utils/exportData');

exports.postadd = async (req, res, next) => {
  try {
    const { CompanyServiceStatusName, colorCode } = await req.body;

    const Companyservicestatus = await companyServiceStatus.findOne({
      where: {
        CompanyServiceStatusName,
        status: [0, 1],
      },
    });

    if (Companyservicestatus) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Company Service Status'),
      });
    }

    await companyServiceStatus.create(
      {
        CompanyServiceStatusName,
        colorCode,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company Service Status'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery } = await req.body;

    const condition = {};

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          CompanyServiceStatusName: {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery =
      page && limit ? { offset: (page - 1) * limit, limit } : {};
    {
    }

    const { rows, count } = await companyServiceStatus.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.editdata = async (req, res, next) => {
  try {
    const { CompanyServiceStatusName, colorCode } = req.body;

    const Companyservicestatus = await companyServiceStatus.findOne({
      where: {
        CompanyServiceStatusName,
        status: [0, 1],
        CompanyServiceStatusID: {
          [Sequelize.Op.ne]: req.params.id,
        },
      },
    });

    if (Companyservicestatus) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Company Service Status'),
      });
    }

    const currentdata = await companyServiceStatus.findOne({
      where: {
        CompanyServiceStatusID: req.params.id,
      },
    });

    if (!currentdata)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.deletedrecord,
      });

    currentdata.CompanyServiceStatusName = CompanyServiceStatusName;
    currentdata.colorCode = colorCode;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Company Service Status'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const data = await companyServiceStatus.findOne({
      where: {
        CompanyServiceStatusID: id,
      },
    });

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: 'Data not found',
      });
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deletebyid = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await companyServiceStatus.findOne({
      where: {
        CompanyServiceStatusID: id,
      },
    });

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: 'ERP Integration not found!',
      });
    }

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Company Service Status'),
    });
  } catch (err) {
    next(err);
  }
};

// active,deactive user
exports.poststatuschange = async (req, res, next) => {
  try {
    let { CompanyServiceStatusID, status } = await req.body;

    await companyServiceStatus.update(
      {
        status,
      },
      {
        where: { CompanyServiceStatusID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('company Service Status')
          : message.usermessage.deactiveMessage('company Service Status'),
    });
  } catch (err) {
    next(err);
  }
};
