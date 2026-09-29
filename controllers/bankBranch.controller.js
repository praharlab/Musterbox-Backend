const Sequelize = require("sequelize");
const BankMaster = require("../models/bankMaster");
const message = require("../response_message/message");
const sequelize = require("../config/database");
const { generateExcel } = require('../utils/exportData');
const BankBranch = require("../models/bankBranch");
/**
 * save bank data.
 *
 * @body {createBy} createBy user id of user who added the bank.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.addbankBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { bankMasterID, bankBranchName, bankBranchCode } = await req.body;

    const existingBank = await BankBranch.findOne(
      {
        where: {
          bankMasterID,
          bankBranchName,
          bankBranchCode,
          status: ["0", "1"],
        },
      },
      { transaction }
    );

    if (existingBank) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Bank Branch"),
      });
    }

    await BankBranch.create(
      {
        bankMasterID,
        bankBranchName,
        bankBranchCode,
      },
      { user: req.userDetails, transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Bank Branch"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// get all data api
exports.listBankBranch = async (req, res, next) => {
  try {
    let { bankMasterID, status, page, limit, searchQuery, exportData } =
      req.body;

    const condition = {};
    if (bankMasterID) {
      condition.bankMasterID = bankMasterID;
    }
    if (status) {
      condition.status = status;
    }
    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { bankBranchCode: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        { bankBranchName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];
    const { rows: bankBranchData, count } = await BankBranch.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: BankMaster,
          attributes: ["bankMasterID", "bankName", "status"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (exportData) {
      const finaldata = bankBranchData.map((e) => {
        return {
          "Bank Name": e["bankMaster.bankName"],
          "Bank Branch Name": e.bankBranchName,
          "Branch Code": e.bankBranchCode,
        };
      });

      await generateExcel(finaldata, "Bank-Branch", "xlsx", res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: bankBranchData, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get By ID
exports.getBankBranchByID = async (req, res, next) => {
  try {
    let { bankBranchID } = req.query;
    const bankBranchData = await BankBranch.findOne({
      where: {
        bankBranchID,
        status: [0, 1],
      },
      include: [
        {
          model: BankMaster,
          attributes: ["bankMasterID", "bankName", "status"],
        },
      ],
    });
    return res.status(200).json({ status: 200, data: bankBranchData });
  } catch (err) {
    next(err);
  }
};

// Edit By ID
exports.editBankBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { bankMasterID, bankBranchName, bankBranchID, bankBranchCode } =
      await req.body;
    const existingBank = await BankBranch.findOne(
      {
        where: {
          bankMasterID,
          bankBranchName,
          bankBranchCode,
          status: ["0", "1"],
        },
      },
      { transaction }
    );

    if (existingBank) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          "Bank With Same Branch Code"
        ),
      });
    }

    await BankBranch.update(
      {
        bankBranchCode,
        bankBranchName
      },
      {
        where: { bankBranchID: bankBranchID },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      } 
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Bank Branch"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

//Delete
exports.deleteBankBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { bankBranchID } = req.body;

    const findData = await BankBranch.findByPk(bankBranchID);

    if (!findData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Bank Branch"),
      });
    }

    await findData.destroy(
      {
        user: req.userDetails,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Bank Branch"),
    });
  } catch (err) {
    await transaction.commit();
    next(err);
  }
};

//Status Change
exports.statusChangeBankBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { bankBranchID, status } = req.body;

    const findData = await BankBranch.findByPk(bankBranchID);

    if (!findData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Bank Branch"),
      });
    }

    await BankBranch.update(
      {
        status,
      },
      {
        where: { bankBranchID: bankBranchID },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        status == "1"
          ? message.usermessage.activeMessage("Bank Branch")
          : message.usermessage.deactiveMessage("Bank Branch"),
    });
  } catch (err) {
    await transaction.commit();
    next(err);
  }
};
