const terminationLetter = require('../models/terminationLetter');
const Sequelize = require('sequelize');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const sequelize = require('../config/database');
const { usermessage } = require('../response_message/message');

exports.addTerminationLetter = async (req, res, next) => {
  try {
    const {
      terminationLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createByIp,
    } = req.body;

    const find_SameData = await terminationLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('terminationLetterName'))
          ),
          terminationLetterName.trim().toLowerCase()
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
        message: `Letter with name ${terminationLetterName} already exist`,
      });
    }

    await terminationLetter.create(
      {
        terminationLetterName,
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
        message: usermessage.addMessage('TerminationLetter'),
      });
  } catch (err) {
    next(err);
  }
};

exports.getTerminationLetter = async (req, res, next) => {
  try {
    const { terminationLetterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (terminationLetterID) {
      const getPreboardingMasters = await terminationLetter.findOne({
        raw: true,
        where: {
          terminationLetterID: terminationLetterID,
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
          terminationLetterName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    console.log(searchQuery, 'searchQuery');

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const { rows, count } = await terminationLetter.findAndCountAll({
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

exports.updateTerminationLetter = async (req, res, next) => {
  try {
    const {
      terminationLetterID,
      terminationLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      updateByIp,
    } = await req.body;

    const find_SameData = await terminationLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('terminationLetterName'))
          ),
          terminationLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('terminationLetterID'), {
          [Sequelize.Op.ne]: terminationLetterID,
        })
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${terminationLetterName} already exist`,
      });
    }

    await terminationLetter.update(
      {
        terminationLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy: req.userDetails.userMasterId,
        updateByIp,
      },
      { where: { terminationLetterID } }
    );

    return res
      .status(200)
      .json({
        status: 200,
        message: usermessage.updateMessage('TerminationLetter'),
      });
  } catch (err) {
    next(err);
  }
};

exports.deleteTerminationLetter = async (req, res, next) => {
  try {
    const { terminationLetterID } = await req.body;

    const findData = await terminationLetter.findByPk(terminationLetterID);

    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res
      .status(200)
      .json({
        status: 200,
        message: usermessage.deleteMessage('TerminationLetter'),
      });
  } catch (err) {
    next(err);
  }
};
