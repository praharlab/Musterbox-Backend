const DiscrepancyLetter = require("../models/discrepancyLetter");
const Sequelize = require("sequelize");
const { executeQuery } = require("./common.controller");
const CompanyMaster = require("../models/companyMaster");
const sequelize = require("../config/database");
const { usermessage } = require("../response_message/message");

exports.addDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      discrepancyLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createByIp,
    } = req.body;

    const find_SameData = await DiscrepancyLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            "TRIM",
            sequelize.fn("LOWER", sequelize.col("discrepancyLetterName"))
          ),
          discrepancyLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col("companyMasterID"), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col("status"), 0),
          Sequelize.where(sequelize.col("status"), 1)
        )
      ),
    });

    if (find_SameData) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${discrepancyLetterName} already exist`,
      });
    }

    await DiscrepancyLetter.create(
      {
        discrepancyLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
      },
      { user: req.userDetails, transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.addMessage("Discrepancy Letter"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getDiscrepancyLetter = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID, searchQuery } = await req.body;

    const condition = {};

    condition.status = 1;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          incrementLetterName: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [["createdAt", "DESC"]];

    const { rows, count } = await DiscrepancyLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: CompanyMaster, attributes: ["companyName"] }],
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

exports.getDiscrepancyLetterByID = async (req, res, next) => {
  try {
    const { discrepancyLetterID } = await req.body;

    const getDiscrepancyLetter = await DiscrepancyLetter.findOne({
      raw: true,
      where: {
        discrepancyLetterID: discrepancyLetterID,
      },
      include: [
        {
          model: CompanyMaster,
        },
      ],
    });

    if (!getDiscrepancyLetter) {
      return res.status(200).json({
        status: 404,
        message: usermessage.notFoundMessage("Discrepancy Letter"),
      });
    }
    return res.status(200).json({
      status: 200,
      data: getDiscrepancyLetter,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      discrepancyLetterID,
      discrepancyLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      updateByIp,
    } = await req.body;

    const find_SameData = await DiscrepancyLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            "TRIM",
            sequelize.fn("LOWER", sequelize.col("discrepancyLetterName"))
          ),
          discrepancyLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col("companyMasterID"), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col("status"), 0),
          Sequelize.where(sequelize.col("status"), 1)
        ),
        Sequelize.where(sequelize.col("discrepancyLetterID"), {
          [Sequelize.Op.ne]: discrepancyLetterID,
        })
      ),
    });

    if (find_SameData) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${discrepancyLetterName} already exist`,
      });
    }

    await DiscrepancyLetter.update(
      {
        discrepancyLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      { where: { discrepancyLetterID } },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.updateMessage("Discrepancy Letter"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deleteDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { discrepancyLetterID } = await req.body;

    const findData = await DiscrepancyLetter.findByPk(discrepancyLetterID);

    await findData.destroy({
      user: req.userDetails,
      transaction,
    });
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.deleteMessage("Discrepancy Letter"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
