const { Op } = require('sequelize');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const KRAMaster = require('../models/kramaster');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const { generateExcel } = require('../utils/exportData');
const { usermessage } = require('../response_message/message');
const GoalMaster = require('../models/goalMaster');
const { CustomError } = require('../utils/customError');

exports.findKraById = async (id, userDetails) => {
  const kra = await KRAMaster.findByPk(id, {
    include: [
      {
        model: GoalMaster,
        include: [
          {
            model: UserMaster,
            as: 'createdByUser',
            attributes: userAttributes,
          },
          {
            model: companyMaster,
            where: {
              companyMasterID:
                userDetails.childCompanies.length > 0
                  ? [...userDetails.childCompanies, userDetails.companyMasterId]
                  : userDetails.companyMasterId,
            },
          },
        ],
      },
      {
        model: UserMaster,
        as: 'createdByUser',
        attributes: userAttributes,
      },
    ],
    nest: true,
  });
  if (!kra)
    throw new CustomError(
      usermessage.notFoundMessage('KRA Master'),
      statusCodes.NOT_FOUND
    );
  return kra;
};

exports.createKRA = async (req, res, next) => {
  try {
    const { description, title, goalMasterId, weightage } = req.body;
    const goals = await GoalMaster.findByPk(goalMasterId);
    if (!goals) {
      throw new CustomError(
        usermessage.notFoundMessage('Goal'),
        statusCodes.NOT_FOUND
      );
    }
    const existingKras = await KRAMaster.findAll({
      where: {
        goalMasterId,
      },
    });
    const totalWeightage =
      existingKras.length > 0
        ? existingKras.reduce((total, kra) => total + kra.weightage, 0)
        : 0;
    const remainingWeightage = 100 - totalWeightage;
    if (weightage > remainingWeightage) {
      throw new CustomError(
        `Cannot add a new Kra with ${weightage}% for the same company. Remaining weightage is ${remainingWeightage}%`,
        statusCodes.BAD_REQUEST
      );
    }
    const KraMaster = await KRAMaster.create(
      {
        description,
        title,
        goalMasterId,
        weightage,
      },
      {
        user: req.userDetails,
      }
    );
    res.status(statusCodes.OK).json({
      data: KraMaster,
      message: usermessage.addMessage('KRA'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateKRA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, title, goalMasterId, weightage } = req.body;
    const kraMaster = this.findKraById(id, req.userDetails);
    if (weightage) {
      const existingKras = await KRAMaster.findAll({
        where: {
          goalMasterId: kraMaster.goalMasterId,
          id: { [Op.ne]: id },
        },
      });
      let totalWeightage = 0;
      if (existingKras && existingKras.length > 0) {
        totalWeightage = existingKras.reduce(
          (total, kra) => total + kra.weightage,
          0
        );
      }
      const remainingWeightage = 100 - totalWeightage + kraMaster.weightage;
      if (weightage > remainingWeightage) {
        throw new CustomError(
          `Cannot update KRA with ${weightage}% for the same company and employee goal. Remaining weightage is ${remainingWeightage}%.`,
          statusCodes.BAD_REQUEST
        );
      }
      kraMaster.weightage = weightage;
    }
    if (title) kraMaster.title = title;
    if (description) kraMaster.description = description;
    if (goalMasterId) {
      const goal = await GoalMaster.findByPk(goalMasterId);
      if (!goal) {
        throw new CustomError(
          usermessage.notFoundMessage('Goal Name'),
          statusCodes.NOT_FOUND
        );
      }
      kraMaster.goalMasterId = goalMasterId;
    }
    await kraMaster.save({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      data: kraMaster,
      message: usermessage.updateMessage('KRA'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getKRADetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kra = this.findKraById(id, req.userDetails);
    return res.status(statusCodes.OK).json({
      data: kra,
      message: usermessage.fetchMessage('Goal Name'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listKRA = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      goalMasterId,
      companyMasterID,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;
    const condition = {};
    if (goalMasterId) condition.goalMasterId = +goalMasterId;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) companyFilter.companyMasterID = companyMasterID;

    if (search)
      condition[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];
    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }
    const kra = await KRAMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          required: true,
          model: GoalMaster,
          include: [
            {
              model: UserMaster,
              as: 'createdByUser',
              attributes: userAttributes,
            },
            {
              model: companyMaster,
              where: companyFilter,
            },
          ],
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
      ],
      nest: true,
      distinct: true,
    });
    if (exportData) {
      const finalData = kra.rows.map((kraItem) => {
        return {
          'KRA Name': kraItem.title,
          'KRA Description': kraItem.description,
          'KRA Weightage': kraItem.weightage,
          'Goal Name': kraItem.goalMaster.title,
          'Company Name': kraItem.goalMaster.companyMaster.companyName,
        };
      });

      await generateExcel(finalData, 'goal', exportFileType, res);
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('KRAs'),
      data: kra.rows,
      totalcount: kra.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteKRA = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kra = this.findKraById(id, req.userDetails);
    await kra.destroy({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('KRA'),
    });
  } catch (err) {
    next(err);
  }
};
