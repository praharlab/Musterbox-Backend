const EmployeeGoal = require('../models/employeeGoal');
const EmployeeGoalUpdates = require('../models/employeeGoalUpdates');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const { generateExcel } = require('../utils/exportData');
const { usermessage } = require('../response_message/message');
const {
  userAttributes,
  statusCodes,
  companyAttributes,
} = require('../utils/commonVars');
const GoalMaster = require('../models/goalMaster');
const companyMaster = require('../models/companyMaster');
const { CustomError } = require('../utils/customError');
const KRAMaster = require('../models/kramaster');
const KPIMaster = require('../models/kpimaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.bulkCreateEmployeeGoal = async (req, res, next) => {
  try {
    const { goalMasterId, bulkData } = req.body;

    // Ensure goalMasterId exists before proceeding
    const validGoal = await GoalMaster.findByPk(goalMasterId);
    if (!validGoal) {
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: usermessage.invalidField('Goal') });
    }

    const transformedData = [];
    const uniqueUserMasterIds = new Set();

    bulkData.forEach((item) => {
      item.userMasterID.forEach((id) => {
        const existingObjectIndex = transformedData.findIndex(
          (obj) => obj.userMasterId === id
        );
        if (existingObjectIndex === -1) {
          const { userMasterID, ...data } = item;
          transformedData.push({
            goalMasterId,
            userMasterId: id,
            ...data,
          });
        }

        // Add unique userMasterIds to the Set
        uniqueUserMasterIds.add(id);
      });
    });
    const uniqueUserMasterIdsArray = Array.from(uniqueUserMasterIds);

    // Fetch valid userMasterIds from the database
    const validUsers = await UserMaster.findAll({
      where: { userMasterID: uniqueUserMasterIdsArray, status: 1 },
      include: {
        model: companyMaster,
        where: {
          companyMasterID:
            req.userDetails.childCompanies.length > 0
              ? [
                  ...req.userDetails.childCompanies,
                  req.userDetails.companyMasterId,
                ]
              : req.userDetails.companyMasterId,
        },
      },
    });
    const validUserIds = validUsers.map((user) => user.userMasterID);
    const invalidUserIds = uniqueUserMasterIdsArray.filter(
      (userId) => !validUserIds.includes(userId)
    );
    if (invalidUserIds.length > 0) {
      return res.status(statusCodes.BAD_REQUEST).json({
        message: usermessage.invalidField('user'),
        invalidUserIds: invalidUserIds.join(', '),
      });
    }

    const validEmployeeGoals = transformedData.filter((data) =>
      validUserIds.includes(data.userMasterId)
    );
    const insertedEmployeeGoals = await EmployeeGoal.bulkCreate(
      validEmployeeGoals,
      { user: req.userDetails, individualHooks: true }
    );

    return res.status(statusCodes.OK).json({
      data: insertedEmployeeGoals,
      message: usermessage.addMessage('Employee Goals'),
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployeeGoal = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      targetGiven,
      targetAchieved,
      goalMasterId,
      userMasterId,
      remarks,
      status,
    } = req.body;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoalUpdates = {};
    const employeeGoal = await EmployeeGoal.findByPk(id, {
      include: {
        model: GoalMaster,
        include: [
          {
            model: companyMaster,
            where: companyFilter,
          },
        ],
      },
      transaction,
    });
    if (!employeeGoal)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Goal'),
        statusCodes.NOT_FOUND
      );

    if (status) {
      employeeGoalUpdates.employeeGoalId = employeeGoal.toJSON().id;
      employeeGoalUpdates.status = status;
      employeeGoal.status = status;
    }
    if (remarks) employeeGoal.remarks = remarks;
    if (targetGiven) employeeGoal.targetGiven = targetGiven;
    if (targetAchieved) {
      employeeGoalUpdates.employeeGoalId = employeeGoal.toJSON().id;
      employeeGoalUpdates.targetAchieved = targetAchieved;
      employeeGoal.targetAchieved = targetAchieved;
    }

    if (userMasterId) {
      const userExist = await UserMaster.findByPk(userMasterId, {
        transaction,
      });
      if (!userExist)
        throw new CustomError(
          usermessage.notFoundMessage('User'),
          statusCodes.NOT_FOUND
        );

      employeeGoal.userMasterId = userMasterId;
    }
    if (goalMasterId) {
      const goalExists = await GoalMaster.findByPk(goalMasterId, {
        transaction,
      });
      if (!goalExists)
        throw new CustomError(
          usermessage.notFoundMessage('Goal'),
          statusCodes.NOT_FOUND
        );
      employeeGoal.goalMasterId = goalMasterId;
    }

    if (Object.keys(employeeGoalUpdates).length)
      await EmployeeGoalUpdates.create(employeeGoalUpdates, {
        transaction,
        user: req.userDetails,
      });

    await employeeGoal.save({
      user: req.userDetails,
      transaction,
    });
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      data: employeeGoal,
      message: usermessage.updateMessage('Employee Goal'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getEmployeeGoalDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoal = await EmployeeGoal.findByPk(id, {
      include: [
        {
          model: GoalMaster,
          include: [{ model: companyMaster, where: companyFilter }],
        },
        {
          model: UserMaster,
          as: 'goalAssignedTo',
          attributes: userAttributes,
          include: [
            {
              model: companyMaster,
              attributes: companyAttributes,
            },
          ],
        },
        {
          model: EmployeeGoalUpdates,
        },
      ],
    });
    if (!employeeGoal)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Goal'),
        statusCodes.NOT_FOUND
      );

    return res.status(statusCodes.OK).json({
      data: employeeGoal,
      message: usermessage.fetchMessage('Employee Goal'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listEmployeeGoals = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      status,
      userMasterID,
      goalMasterId,
      companyMasterID,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;

    const condition = {};
    if (userMasterID) condition.userMasterId = +userMasterID;
    if (goalMasterId) condition.goalMasterId = +goalMasterId;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterID = +companyMasterID;
    }
    if (status) condition.status = status;

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }

    const employeeGoals = await EmployeeGoal.findAndCountAll({
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
              model: companyMaster,
              where: companyFilter,
            },
            { model: KRAMaster, include: [{ model: KPIMaster }] },
          ],
        },
        {
          model: UserMaster,
          as: 'goalAssignedTo',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            {
              model: companyMaster,
              attributes: companyAttributes,
            },
          ],
        },
        { model: EmployeeGoalUpdates },
      ],
      nest: true,
      distinct: true,
    });
    if (exportData) {
      const finalData = employeeGoals.rows.map((empGoalItem) => {
        return {
          'User Name': empGoalItem.goalAssignedTo.displayName,
          'Goal Name': empGoalItem.goalMaster.title,
          Remarks: empGoalItem.remarks,
          'Company Name': empGoalItem.goalAssignedTo.companyMaster.companyName,
          'Evaluation Period': empGoalItem.evaluationPeriod,
          'Target Given': empGoalItem.targetGiven,
          'Target Achieved': empGoalItem.targetAchieved,
          Status: empGoalItem.status,
        };
      });

      await generateExcel(finalData, 'Employee-Goals', exportFileType, res);
      return;
    }
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Employee Goals'),
      data: employeeGoals.rows,
      totalcount: employeeGoals.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteEmployeeGoal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    const employeeGoal = await EmployeeGoal.findByPk(id, {
      include: [
        {
          model: GoalMaster,
          include: [
            {
              model: companyMaster,
              where: companyFilter,
            },
          ],
        },
      ],
      nest: true,
    });
    if (!employeeGoal)
      throw new CustomError(
        usermessage.notFoundMessage('Employee Goal'),
        statusCodes.NOT_FOUND
      );

    await employeeGoal.destroy({
      user: req.userDetails,
    });
    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Employee Goal'),
    });
  } catch (err) {
    next(err);
  }
};
