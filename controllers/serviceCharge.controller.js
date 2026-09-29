const sequelize = require("../config/database");
const Sequelize = require("sequelize");
const ServiceCharge = require("../models/serviceCharge");
const ServiceChargeSlab = require("../models/serviceChargeSlab");
const message = require("../response_message/message");
const Contractor = require("../models/contractor");
const companyMaster = require("../models/companyMaster");
const { log } = require("handlebars");

function hasOverlappingRanges(slabs) {
  for (let i = 0; i < slabs.length - 1; i++) {
    if (slabs[i].toDays >= slabs[i + 1].fromDays) {
      return true; // Overlapping found
    }
  }
  return false;
}

function negativeValueCheck(slabData) {
  // Check for negative values
  return slabData.some(
    ({ fromDays, toDays, skilledRate, semiskilledRate, unskilledRate }) =>
      [fromDays, toDays, skilledRate, semiskilledRate, unskilledRate].some(
        (value) => value < 0
      )
  );
}

exports.addData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { contractorId, applicableYYYYMM, slabData } = req.body;

    if (
      !contractorId ||
      !applicableYYYYMM ||
      !slabData ||
      (slabData && !slabData.length)
    )
      throw new Error("Please provide all required fields!");

    if (negativeValueCheck(slabData))
      throw new Error(
        "'From Days', 'To Days', and rate values must be non-negative."
      );

    [...slabData].sort((a, b) => a.fromDays - b.fromDays);

    if (hasOverlappingRanges(slabData)) throw new Error("Date ranges overlap!");

    const insertedData = await ServiceCharge.create(
      {
        contractorId,
        applicableYYYYMM,
      },
      {
        user: req.userDetails,
        transaction,
      }
    );

    const finalData = slabData.map((e) => {
      return {
        ...e,
        serviceChargeId: insertedData.id,
      };
    });

    await ServiceChargeSlab.bulkCreate(finalData, {
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Service Charge"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { slabData, applicableYYYYMM } = req.body;

    const { id } = req.params;

    if (!slabData || (slabData && !slabData.length))
      throw new Error("Please provide all required fields!");

    if (negativeValueCheck(slabData))
      throw new Error(
        "'From Days', 'To Days', and rate values must be non-negative."
      );

    [...slabData].sort((a, b) => a.fromDays - b.fromDays);

    if (hasOverlappingRanges(slabData)) throw new Error("Date ranges overlap!");

    const findData = await ServiceCharge.findByPk(id, { transaction });

    if (!findData) throw new Error("Service Charge not found!");

    findData.applicableYYYYMM = applicableYYYYMM;

    await findData.save({
      user: req.userDetails,
      transaction,
    });

    const finalData = slabData.map((e) => {
      return {
        ...e,
        serviceChargeId: id,
      };
    });

    await ServiceChargeSlab.destroy({
      where: {
        serviceChargeId: id,
      },
      hooks: false,
      transaction,
    });

    await ServiceChargeSlab.bulkCreate(finalData, {
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Service Charge"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    console.log(id, "getSalaryData");

    const findData = await ServiceCharge.findByPk(id, { transaction });

    if (!findData) throw new Error("Service Charge not found!");

    await ServiceChargeSlab.destroy({
      where: {
        serviceChargeId: id,
      },
      hooks: false,
      transaction,
    });

    await findData.destroy({
      user: req.userDetails,
      transaction,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Service Charge"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getByIdData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await ServiceCharge.findByPk(id, {
      include: [
        {
          model: ServiceChargeSlab,
        },
        {
          model: Contractor,
          attributes: ["contractorName", "companyMasterID"],
          include: [{ model: companyMaster, attributes: ["companyName"] }],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.listData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, companyMasterID, contractorId } =
      req.body;

    if (!companyMasterID) throw new Error("Company is required field!");

    const condition = {
      "$contractor.companyMasterID$": companyMasterID,
    };

    if (contractorId && contractorId.length)
      condition.contractorId = {
        [Sequelize.Op.in]: contractorId,
      };

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          "$contractor.contractorName$": {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          "$contractor.companyMaster.companyName$": {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];
    }

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows: data, count } = await ServiceCharge.findAndCountAll({
      where: condition,
      ...paginateCondition,
      include: [
        {
          model: Contractor,
          attributes: ["contractorName", "contractorId"],
          include: [{ model: companyMaster, attributes: ["companyName"] }],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};
