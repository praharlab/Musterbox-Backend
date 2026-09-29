const { Op } = require('sequelize');
const { usermessage } = require('../response_message/message');
const { statusCodes } = require('../utils/commonVars');
const { generateExcel } = require('../utils/exportData');
const { ModelsMapping } = require('../utils/modelsMapping');
const _ = require('lodash');
const UserActivity = require('../models/userActivity');
const { DatabaseOperationEnum } = require('../utils/dbUtils');

exports.listUserActivity = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      modelName,
      activityType,
      userId,
      startDate,
      endDate,
      exportData,
      exportFileType,
    } = req.query;

    const toDate = new Date(startDate).setHours(0, 0, 0, 0);
    const fromDate = new Date(endDate).setHours(23, 59, 59, 59);
    if (!modelName)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: usermessage.invalidField('Model') });
    const condition = {
      [Op.or]: [
        {
          createdAt: { [Op.between]: [toDate, fromDate] },
          createBy: userId,
        },
        {
          updatedAt: { [Op.between]: [toDate, fromDate] },
          updateBy: userId,
        },
        {
          deletedAt: { [Op.between]: [toDate, fromDate] },
          deleteBy: userId,
        },
      ],
    };
    if (activityType === DatabaseOperationEnum.CREATE) {
      condition[Op.or].splice(1, 2);
    }
    if (activityType === DatabaseOperationEnum.UPDATE) {
      condition[Op.or].splice(0, 1);
      condition[Op.or].splice(2, 1);
    }
    if (activityType === DatabaseOperationEnum.DELETE) {
      condition[Op.or].splice(0, 2);
    }
    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }

    const data = await ModelsMapping[modelName].findAndCountAll({
      where: condition,
      ...paginationQuery,
      paranoid: false,
      distinct: true,
      nest: true,
    });
    const allActivities = data.rows.map((e) => e.toJSON());
    const ids = _.map(
      allActivities,
      ModelsMapping[modelName].primaryKeyAttribute
    );

    const userActivity = await UserActivity.findAll({
      where: {
        activityTablePK: [...ids],
        activityTable: ModelsMapping[modelName].tableName,
      },
    });

    const updateActivities = userActivity.map((e) => e.toJSON());

    allActivities.forEach((element) => {
      element.updates = [];
      const isPKMatched = updateActivities.filter(
        (obj) => obj.activityTablePK === element.id
      );
      if (isPKMatched) element.updates = isPKMatched;
    });
    if (exportData) {
      await generateExcel(allActivities, 'User-Activity', exportFileType, res);
      return;
    }

    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('User Activity'),
      data: allActivities,
      totalcount: data.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};
