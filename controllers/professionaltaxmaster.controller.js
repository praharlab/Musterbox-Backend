/** @format */

const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const StateMaster = require('../models/statemaster');
const { PTCalculationEnum } = require('../utils/dbUtils');
const CountryMaster = require('../models/countrymaster');
const Corporation = require('../models/corporation');
/**
 * save state data.
 *
 * @body {createBy} createBy user id of user who added the professional tax.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddProfessionalTax = async (req, res, next) => {
  try {
    // const months = req.body.map((e) => e.month);
    // const stateMasterID = req.body[0]?.stateMasterID || null;
    // const corporationId = req.body[0]?.corporationId || null;
    // const applicableFromYYYYMM = req.body[0]?.applicableFromYYYYMM || null;

    // const condition = {
    //   month: { [Sequelize.Op.in]: months },
    //   applicableFromYYYYMM,
    //   stateMasterID,
    //   corporationId,
    // };

    // const data = await ProfessionalTaxSlabMaster.findOne({
    //   where: condition,
    // });

    // if (data)
    //   return res.status(200).json({
    //     status: 401,
    //     message: message.usermessage.alreadyExists('Professional Tax'),
    //   });

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const finalData = req.body.map((e) => {
      return {
        ...e,
        createBy,
        createByIp,
      };
    });

    ProfessionalTaxSlabMaster.bulkCreate(finalData);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Professional Tax'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all professional tax data
 */

exports.getAllProfessionalTaxData = async (req, res, next) => {
  try {
    const { limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          '$stateMaster.stateName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          '$corporation.corporationName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];
    }

    const paginateCondition = {};

    if (page && limit)
      (paginateCondition.offset = (page - 1) * limit),
        (paginateCondition.limit = limit);

    const { rows, count } = await ProfessionalTaxSlabMaster.findAndCountAll({
      where: condition,
      ...paginateCondition,
      order: [['professionalTaxID', 'ASC']],
      include: [{ model: StateMaster }, { model: Corporation }],
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

/**
 * find data with professionalTax id
 *
 * @param {id} professionalTaxID  to fetch state name
 */

exports.getProfessionalTaxById = async (req, res, next) => {
  try {
    let get_one_data = await ProfessionalTaxSlabMaster.findOne({
      where: {
        professionalTaxID: req.params.id,
      },
      include: [
        { model: StateMaster, include: [{ model: CountryMaster }] },
        { model: Corporation },
      ],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} professionalTaxID  to update id
 */
exports.postUpdateProfessionalTax = async (req, res, next) => {
  try {
    const { professionalTaxID, fromAmount, toAmount, maleTax, femaleTax } =
      await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    ProfessionalTaxSlabMaster.update(
      {
        fromAmount,
        toAmount,
        maleTax,
        femaleTax,
        updateBy: createBy,
        updateByIp: createByIp,
      },
      {
        where: { professionalTaxID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Professional Tax'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} professionalTaxID  to update status of professional tax
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { professionalTaxID, status } = await req.body;
    if (status == '1') {
      ProfessionalTaxSlabMaster.update(
        {
          status,
        },
        {
          where: { professionalTaxID: professionalTaxID },
        }
      );
    }

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Professional Tax')
          : message.usermessage.deactiveMessage('Professional Tax'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} professionalTaxID  to delete id
 */
exports.postDeleteProfessionalTaxById = async (req, res, next) => {
  try {
    const { professionalTaxID } = await req.body;
    await ProfessionalTaxSlabMaster.destroy({
      where: {
        professionalTaxID,
      },
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Professional Tax'),
    });
  } catch (err) {
    next(err);
  }
};
