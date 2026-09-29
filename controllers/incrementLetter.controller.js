const incrementLetter = require('../models/incrementLetter');
const Sequelize = require('sequelize');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const sequelize = require('../config/database');
const { usermessage } = require('../response_message/message');

exports.addIncrementLetter = async (req, res, next) => {
  try {
    const {
      incrementLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createByIp,
    } = req.body;

    const find_SameData = await incrementLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('incrementLetterName'))
          ),
          incrementLetterName.trim().toLowerCase()
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
        message: `Letter with name ${incrementLetterName} already exist`,
      });
    }

    await incrementLetter.create(
      {
        incrementLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp,
      },
      { user: req.userDetails }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: usermessage.addMessage('IncrementLetter'),
      });
  } catch (err) {
    next(err);
  }
};

exports.getIncrementLetter = async (req, res, next) => {
  try {
    const { incrementLetterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (incrementLetterID) {
      const getPreboardingMasters = await incrementLetter.findOne({
        raw: true,
        where: {
          incrementLetterID: incrementLetterID,
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
          incrementLetterName: {
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

    const { rows, count } = await incrementLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
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

exports.updateIncrementLetter = async (req, res, next) => {
  try {
    const {
      incrementLetterID,
      incrementLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      updateByIp,
    } = await req.body;

    const find_SameData = await incrementLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('incrementLetterName'))
          ),
          incrementLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('incrementLetterID'), {
          [Sequelize.Op.ne]: incrementLetterID,
        })
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${incrementLetterName} already exist`,
      });
    }

    await incrementLetter.update(
      {
        incrementLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      { where: { incrementLetterID } }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: usermessage.updateMessage('IncrementLetter'),
      });
  } catch (err) {
    next(err);
  }
};

exports.deleteIncrementLetter = async (req, res, next) => {
  try {
    const { incrementLetterID } = await req.body;

    const findData = await incrementLetter.findByPk(incrementLetterID);

    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res
      .status(200)
      .json({
        status: 200,
        message: usermessage.deleteMessage('IncrementLetter'),
      });
  } catch (err) {
    next(err);
  }
};
