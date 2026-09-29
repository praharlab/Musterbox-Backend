const message = require('../response_message/message');
const BankStatementFormat = require('../models/bankStatementFormat');
const companyMaster = require('../models/companyMaster');
const BankMaster = require('../models/bankMaster');

exports.addBankStatementFormat = async (req, res, next) => {
  try {
    const { companyMasterID, bankMasterID, fields } = req.body;

    if (!companyMasterID || !bankMasterID || fields.length == 0) {
      return res.status(200).json({
        status: 401,
        message: 'Company, Bank and Fields are required!',
      });
    }

    const existData = await BankStatementFormat.findOne({
      where: {
        companyMasterID: companyMasterID,
        bankMasterID: bankMasterID,
      },
    });

    if (existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Bank format with this Company'
        ),
      });
    }

    await BankStatementFormat.create(
      {
        companyMasterID,
        bankMasterID,
        fields,
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Bank format '),
    });
  } catch (error) {
    next(error);
  }
};

exports.getBankStatementFormat = async (req, res, next) => {
  try {
    const { companyMasterID, bankMasterID, page, limit } = req.body;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const condition = { companyMasterID };

    if (bankMasterID) condition.bankMasterID = bankMasterID;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows, count } = await BankStatementFormat.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
        {
          model: BankMaster,
          attributes: ['bankName', 'bankMasterID'],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateBankStatementFormat = async (req, res, next) => {
  try {
    const { bankMasterID, companyMasterID, fields } = req.body;

    const existData = await BankStatementFormat.findOne({
      where: {
        companyMasterID: companyMasterID,
        bankMasterID: bankMasterID,
      },
    });

    if (!existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage(
          'Bank format with this Company'
        ),
      });
    }

    existData.fields = fields;

    await existData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: 'Bank format updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteBankStatementFormat = async (req, res, next) => {
  try {
    const { companyMasterID, bankMasterID } = req.query;

    if (!companyMasterID || !bankMasterID) {
      return res.status(200).json({
        status: 401,
        message: 'Company and Bank are required!',
      });
    }

    await BankStatementFormat.destroy({
      where: {
        companyMasterID: companyMasterID,
        bankMasterID: bankMasterID,
      },
      user: req.userDetails,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Bank Format'),
    });
  } catch (error) {
    next(error);
  }
};
