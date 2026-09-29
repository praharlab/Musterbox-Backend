const Sequelize = require('sequelize');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const OfferLetter = require('../models/offerLetter');
const sequelize = require('../config/database');

exports.addOfferLetter = async (req, res, next) => {
  try {
    const {
      offerLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createBy,
      createByIp,
    } = req.body;

    const find_SameData = await OfferLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('offerLetterName'))
          ),
          offerLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${offerLetterName} already exist`,
      });
    }
    await OfferLetter.create({
      offerLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createBy,
      createByIp,
    });

    return res
      .status(200)
      .json({ status: 200, message: 'Letter created Successfully' });
  } catch (err) {
    next(err);
  }
};

exports.updateOfferLetter = async (req, res, next) => {
  try {
    const {
      offerLetterID,
      offerLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    const find_SameData = await OfferLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('offerLetterName'))
          ),
          offerLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('offerLetterID'), {
          [Sequelize.Op.ne]: offerLetterID,
        })
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${offerLetterName} already exist`,
      });
    }

    await OfferLetter.update(
      {
        offerLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      { where: { offerLetterID: offerLetterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Letter updated Successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteOfferLetter = async (req, res, next) => {
  try {
    const { offerLetterID } = await req.body;

    await OfferLetter.update(
      { status: 2 },
      { where: { offerLetterID: offerLetterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Letter deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getOfferLetter = async (req, res, next) => {
  try {
    const { offerLetterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (offerLetterID) {
      const getPreboardingMasters = await OfferLetter.findOne({
        raw: true,
        where: {
          offerLetterID: offerLetterID,
        },
        include: [
          {
            model: companyMaster,
          },
        ],
      });

      return res.status(200).json({
        status: 200,
        data: getPreboardingMasters,
      });
    }

    const condition = {};

    condition.status = 1;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          offerLetterName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const preBoardingMasters = await OfferLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
    });

    return res.status(200).json({
      status: 200,
      data: preBoardingMasters.rows,
      totalcount: preBoardingMasters.count,
    });
  } catch (err) {
    next(err);
  }
};
