const Sequelize = require('sequelize');
const { executeQuery } = require('./common.controller');
const companyMaster = require('../models/companyMaster');
const JoiningLetter = require('../models/joiningLetter');
const sequelize = require('../config/database');

exports.addJoiningLetter = async (req, res, next) => {
  try {
    const {
      joiningLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      createBy,
      createByIp,
    } = req.body;

    const find_SameData = await JoiningLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('joiningLetterName'))
          ),
          joiningLetterName.trim().toLowerCase()
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
        message: `Letter with name ${joiningLetterName} already exist`,
      });
    }
    await JoiningLetter.create({
      joiningLetterName,
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

exports.updateJoiningLetter = async (req, res, next) => {
  try {
    const {
      joiningLetterID,
      joiningLetterName,
      letterTemplate,
      letterHead,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    const find_SameData = await JoiningLetter.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('joiningLetterName'))
          ),
          joiningLetterName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('joiningLetterID'), {
          [Sequelize.Op.ne]: joiningLetterID,
        })
      ),
    });

    if (find_SameData) {
      return res.status(200).send({
        status: 401,
        message: `Letter with name ${joiningLetterName} already exist`,
      });
    }

    await JoiningLetter.update(
      {
        joiningLetterName,
        letterTemplate,
        letterHead,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      { where: { joiningLetterID: joiningLetterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Letter updated Successfully' });
  } catch (err) {
    next(err);
  }
};

exports.deleteJoiningLetter = async (req, res, next) => {
  try {
    const { joiningLetterID } = await req.body;

    await JoiningLetter.update(
      { status: 2 },
      { where: { joiningLetterID: joiningLetterID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: 'Letter deleted successfully' });
  } catch (err) {
    next(err);
  }
};

exports.getJoiningLetter = async (req, res, next) => {
  try {
    const { joiningLetterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (joiningLetterID) {
      const getJoining = await JoiningLetter.findOne({
        raw: true,
        where: {
          joiningLetterID: joiningLetterID,
        },
        include: [
          {
            model: companyMaster,
          },
        ],
      });

      return res.status(200).json({
        status: 200,
        data: getJoining,
      });
    }

    const condition = {};

    condition.status = 1;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          joiningLetterName: {
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

    const preJoiningData = await JoiningLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMaster, attributes: ['companyName'] }],
    });

    return res.status(200).json({
      status: 200,
      data: preJoiningData.rows,
      totalcount: preJoiningData.count,
    });
  } catch (err) {
    next(err);
  }
};
