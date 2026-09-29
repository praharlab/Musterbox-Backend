const { Op } = require('sequelize');
const { usermessage } = require('../response_message/message');
const KPIMaster = require('../models/kpimaster');
const KRAMaster = require('../models/kramaster');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const { generateExcel } = require('../utils/exportData');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const GoalMaster = require('../models/goalMaster');
const { CustomError } = require('../utils/customError');

exports.findKPIById = async (id, userDetails) => {
  const kpi = await KPIMaster.findByPk(id, {
    include: [
      {
        model: KRAMaster,
        include: [
          {
            model: UserMaster,
            as: 'createdByUser',
            attributes: userAttributes,
          },
          {
            model: GoalMaster,
            include: {
              model: companyMaster,
              where: {
                companyMasterID:
                  userDetails.childCompanies.length > 0
                    ? [
                      ...userDetails.childCompanies,
                      userDetails.companyMasterId,
                    ]
                    : userDetails.companyMasterId,
              },
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
  if (!kpi)
    throw new CustomError(
      usermessage.notFoundMessage('KPI'),
      statusCodes.NOT_FOUND
    );
  return kpi;
};

exports.createKPI = async (req, res, next) => {
  try {
    const { title, description, weightage, kraMasterId, targetGiven } =
      req.body;
    const kra = await KRAMaster.findByPk(kraMasterId);
    if (!kra) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('KRA'),
      });
    }
    const existingKPIs = await KPIMaster.findAll({
      where: {
        kraMasterId,
      },
    });
    const totalWeightage = existingKPIs.reduce(
      (total, kpi) => total + kpi.weightage,
      0
    );
    const remainingWeightage = 100 - totalWeightage;
    if (weightage > remainingWeightage)
      throw new CustomError(
        `Cannot add a new KPI with weightage ${weightage} for the same KRA. Remaining weightage is ${remainingWeightage}.`,
        statusCodes.BAD_REQUEST
      );
    const kpi = await KPIMaster.create(
      {
        title,
        description,
        weightage,
        kraMasterId,
        targetGiven,
      },
      {
        user: req.userDetails,
      }
    );
    return res.status(statusCodes.OK).json({
      data: kpi,
      message: usermessage.addMessage('KPI'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateKPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, title, weightage, kraMasterId, targetGiven } =
      req.body;
    const kpi = this.findKPIById(id);
    if (weightage) {
      const existingKpis = await KPIMaster.findAll({
        where: {
          companyMasterId: kpi.companyMasterId,
          kraMasterId: kpi.kraMasterId,
          id: { [Op.ne]: id },
        },
      });
      let totalWeightage = 0;
      if (existingKpis && existingKpis.length > 0) {
        totalWeightage = existingKpis.reduce(
          (total, cur) => total + cur.weightage,
          0
        );
      }
      const remainingWeightage = 100 - totalWeightage + kpi.weightage;
      if (weightage > remainingWeightage)
        throw new CustomError(
          `Cannot update KPI with ${weightage}% for the same company and KRA. Remaining weightage is ${remainingWeightage}%.`,
          statusCodes.BAD_REQUEST
        );
      kpi.weightage = weightage;
    }
    if (title) kpi.title = title;
    if (description) kpi.description = description;
    if (targetGiven) kpi.targetGiven = targetGiven;
    if (kraMasterId) {
      const kra = await KRAMaster.findByPk(kraMasterId);
      if (!kra)
        throw new CustomError(
          usermessage.notFoundMessage('KRA'),
          statusCodes.NOT_FOUND
        );
      kpi.kraMasterId = kraMasterId;
    }

    await kpi.save({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      data: kpi,
      message: usermessage.updateMessage('KPI'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getKPIDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kpi = await this.findKPIById(id);
    return res.status(statusCodes.OK).json({
      data: kpi,
      message: usermessage.fetchMessage('KPI'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listKPI = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      kraMasterId,
      companyMasterID,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;
    const condition = {};
    if (kraMasterId) condition.kraMasterId = +kraMasterId;
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
    const kpis = await KPIMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          required: true,
          model: KRAMaster,
          include: [
            {
              model: UserMaster,
              as: 'createdByUser',
              attributes: userAttributes,
            },
            {
              required: true,
              model: GoalMaster,
              include: {
                model: companyMaster,
                where: companyFilter,
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
      distinct: true,
    });

    if (exportData) {
      const finalData = kpis.rows.map((kpiItem) => {
        return {
          'KPI Name': kpiItem.title,
          'KPI Description': kpiItem.description,
          'KPI Weightage': kpiItem.weightage,
          'KRA Name': kpiItem.kraMaster.title,
          'Goal Name': kpiItem.kraMaster.goalMaster.title,
          'Company Name':
            kpiItem.kraMaster.goalMaster.companyMaster.companyName,
        };
      });

      await generateExcel(finalData, 'goal', exportFileType, res);
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('KPIs'),
      data: kpis.rows,
      totalcount: kpis.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteKPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const kpi = await this.findKPIById(id);
    await kpi.destroy({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('KPI'),
    });
  } catch (err) {
    next(err);
  }
};
