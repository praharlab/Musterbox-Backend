const { Op, Sequelize, fn } = require('sequelize');
const { usermessage, errorMessage } = require('../response_message/message');
const SentimentPunchIn = require('../models/sentimentPunchIn');
const UserMaster = require('../models/userMaster');
const {
  userAttributes,
  statusCodes,
  companyAttributes,
} = require('../utils/commonVars');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const Department = require('../models/department');
const EmployeeDepartment = require('../models/employeeDepartment');
const Designation = require('../models/designation');
const EmployeeDesignation = require('../models/employeeDesignation');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const moment = require('moment');
exports.createSentimentPunchIn = async (req, res, next) => {
  try {
    const { mood } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySentiments = await SentimentPunchIn.findOne({
      where: {
        createdAt: {
          [Op.gte]: today, // Find records created on or after today
        },
        userMasterId: req.userDetails.userMasterId,
      },
    });
    if (todaySentiments)
      return res
        .status(400)
        .json({ message: errorMessage.SENTIMENT_ALREADY_PUNCHED });
    const ticket = await SentimentPunchIn.create(
      {
        mood,
      },
      {
        user: req.userDetails,
      }
    );
    return res.status(statusCodes.OK).json({
      data: ticket,
      message: usermessage.addMessage('Sentiment Punch In'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listSentimentPunchIn = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      mood,
      startDate,
      endDate,
      searchQuery,
      showAll,
      userMasterID,
      companyMasterID,
      sortByField,
      sortByValue,
      exportData,
    } = req.query;

    const condition = {};
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    // TODO: Change this logic with role based access middleware
    if (!showAll && !userMasterID)
      condition.userMasterId = req.userDetails.userMasterId;
    if (userMasterID) condition.userMasterId = userMasterID;

    if (mood) condition.mood = mood;
    if (startDate && endDate)
      condition.createdAt = {
        [Op.between]: [
          new Date(startDate).setHours(0, 0, 0, 0),
          new Date(endDate).setHours(23, 59, 59, 59),
        ],
      };

    const companyFilter = {
      companyMasterID:
        companyMasterID ||
        (req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId),
    };
    if (searchQuery)
      condition[Op.or] = [
        Sequelize.where(Sequelize.cast(Sequelize.col('mood'), 'text'), {
          [Op.like]: `%${searchQuery}%`,
        }),
        {
          '$userMaster.displayName$': { [Op.like]: `%${searchQuery}%` },
        },
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

    const { rows, count } = await SentimentPunchIn.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            {
              model: companyMaster,
              where: companyFilter,
              attributes: companyAttributes,
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
      distinct: true,
      nest: true,
    });

    if (exportData) {
      const finaldata = rows.map((e) => {
        return {
          'Employee Code ':
            e.userMaster.employeeJoiningDetails.length > 0
              ? e.userMaster.employeeJoiningDetails[0].employeeCode
              : '',

          'Employee Name': e.userMaster.displayName,
          Mood: e.mood,
          Date: e.createdAt,
          'Company Name': e.userMaster.companyMaster.companyName,
          Department:
            e.userMaster.employeeDepartments.length > 0
              ? e.userMaster.employeeDepartments[0].department.departmentName
              : '',

          Branch:
            e.userMaster.employeeBranches.length > 0
              ? e.userMaster.employeeBranches[0].branchMaster.branchName
              : '',

          Designation:
            e.userMaster.employeeDesignations.length > 0
              ? e.userMaster.employeeDesignations[0].designation.designationName
              : '',
        };
      });

      await generateExcel(finaldata, 'Sentiment-Punch-In', 'xlsx', res);
      return;
    }

    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Sentiment Punch In'),
      data: rows,
      totalcount: count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.sentimentPunchInsAnalysis = async (req, res, next) => {
  try {
    const {
      startDate,
      endDate,
      month,
      year = new Date().getFullYear(),
      userMasterID,
      companyMasterID,
      mood,
    } = req.query;
    const condition = {};
    let start = null;
    let end = null;

    // TODO: Change this logic with role based access middleware
    if (userMasterID) condition.userMasterId = userMasterID;

    if (mood) condition.mood = mood;
    if (month) {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
    }
    if (year) {
      start = new Date(year, 0, 1);
      end = new Date(year, 11, 31);
    }
    if (startDate && endDate) {
      start = new Date(startDate).setHours(0, 0, 0, 0);
      end = new Date(endDate).setHours(23, 59, 59, 59);
    }
    if (start && end) {
      condition.createdAt = {
        [Op.between]: [start, end],
      };
    }
    const companyFilter = {
      companyMasterID:
        companyMasterID ||
        (req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId),
    };
    const sentimentPunchIns = await SentimentPunchIn.findAll({
      where: condition,
      group: ['mood'],
      include: [
        {
          model: UserMaster,
          attributes: [],
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: {
            model: companyMaster,
            where: companyFilter,
            attributes: [],
          },
        },
      ],
      attributes: ['mood', [fn('COUNT', 'mood'), 'total']],
      distinct: true,
      nest: true,
    });
    return res.status(200).json({ sentimentPunchIns });
  } catch (error) {
    next(error);
  }
};

exports.getSentimentPunchIn = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      mood,
      startdate,
      enddate,
      searchQuery,
      showAll,
      userMasterID,
      companyMasterID,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.body;

    const condition = {};
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    // TODO: Change this logic with role based access middleware
    if (!showAll && !userMasterID)
      condition.userMasterId = req.userDetails.userMasterId;
    if (userMasterID) condition.userMasterId = userMasterID;

    if (mood) condition.mood = mood;
    if (startdate && enddate)
      condition.createdAt = {
        [Op.between]: [
          new Date(startdate).setHours(0, 0, 0, 0),
          new Date(enddate).setHours(23, 59, 59, 59),
        ],
      };

    const companyFilter = {
      companyMasterID:
        companyMasterID ||
        (req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId),
    };
    if (searchQuery)
      condition[Op.or] = [
        Sequelize.where(Sequelize.cast(Sequelize.col('mood'), 'text'), {
          [Op.like]: `%${searchQuery}%`,
        }),
        {
          '$userMaster.displayName$': { [Op.like]: `%${searchQuery}%` },
        },
      ];

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows, count } = await SentimentPunchIn.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            {
              model: companyMaster,
              where: companyFilter,
              attributes: companyAttributes,
            },
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
      distinct: true,
      nest: true,
    });

    if (exportData) {
      const finaldata = rows.map((e) => {
        return {
          'Employee Code ':
            e.userMaster.employeeJoiningDetails.length > 0
              ? e.userMaster.employeeJoiningDetails[0].employeeCode
              : '',
          'Employee Name': e.userMaster.displayName,
          Mood: e.mood,
          Date: e.createdAt
            ? moment(e.createdAt).format('DD-MM-YYYY')
            : 'dd-MM-yyyy',
          'Company Name': e.userMaster.companyMaster.companyName,
          Department:
            e.userMaster.employeeDepartments.length > 0
              ? e.userMaster.employeeDepartments[0].department.departmentName
              : '',

          Branch:
            e.userMaster.employeeBranches.length > 0
              ? e.userMaster.employeeBranches[0].branchMaster.branchName
              : '',

          Designation:
            e.userMaster.employeeDesignations.length > 0
              ? e.userMaster.employeeDesignations[0].designation.designationName
              : '',
        };
      });

      await generateExcel(finaldata, 'Sentiment-Punch-In', exportFileType, res);
      return;
    }

    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Sentiment Punch In'),
      data: rows,
      totalcount: count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};
