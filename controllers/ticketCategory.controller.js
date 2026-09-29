const { Op } = require('sequelize');
const TicketCategory = require('../models/ticketCategory');
const { usermessage } = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const TicketSubCategory = require('../models/ticketSubCategory');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const Ticket = require('../models/ticket');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.createTicketCategory = async (req, res, next) => {
  try {
    const { name, description, defaultAssignee, companyMasterID } = req.body;
    const userExists = await UserMaster.findByPk(defaultAssignee);
    if (!userExists)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Default assignee'),
      });
    const ticketCategory = await TicketCategory.create(
      {
        name,
        description,
        defaultAssignee,
        companyMasterId: companyMasterID,
      },
      {
        user: req.userDetails,
      }
    );
    res.status(statusCodes.OK).json({
      data: ticketCategory,
      message: usermessage.addMessage('Ticket category'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTicketCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, defaultAssignee, companyMasterId } = req.body;
    const ticketCategory = await TicketCategory.findByPk(id, {
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
    if (!ticketCategory)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket category'),
      });

    if (name) ticketCategory.name = name;
    if (description) ticketCategory.description = description;
    if (defaultAssignee) {
      const userExists = await UserMaster.findByPk(defaultAssignee);
      if (!userExists)
        return res.status(statusCodes.NOT_FOUND).json({
          message: usermessage.notFoundMessage('Default assignee'),
        });
      ticketCategory.defaultAssignee = defaultAssignee;
    }
    if (companyMasterId) ticketCategory.companyMasterId = companyMasterId;
    await ticketCategory.save({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      data: ticketCategory,
      message: usermessage.updateMessage('Ticket category'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getTicketCategoryDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketCategory = await TicketCategory.findByPk(id, {
      include: [
        {
          model: TicketSubCategory,
          include: [
            {
              model: UserMaster,
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          attributes: userAttributes,
        },
        {
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
      ],
    });
    if (!ticketCategory)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket category'),
      });

    res.status(statusCodes.OK).json({
      data: ticketCategory,
      message: usermessage.fetchMessage('Ticket category'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listTicketCategory = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      defaultAssignee,
      companyMasterID,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;

    const condition = {};
    if (defaultAssignee) condition.defaultAssignee = +defaultAssignee;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterID = companyMasterID;
    }

    if (search)
      condition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
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

    const ticketCategory = await TicketCategory.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: TicketSubCategory,
          include: [
            {
              model: UserMaster,
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: companyMaster,
          where: companyFilter,
        },
      ],
      nest: true,
      distinct: true,
    });

    if (exportData) {
      await generateExcel(
        ticketCategory.rows.map((e) => e.toJSON()),
        'Ticket-Category',
        exportFileType,
        res
      );
      return;
    }
    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Ticket category'),
      data: ticketCategory.rows,
      totalcount: ticketCategory.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTicketCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticketCategory = await TicketCategory.findByPk(id, {
      include: [
        {
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
        { model: TicketSubCategory },
        { model: Ticket },
      ],
      nest: true,
    });
    if (!ticketCategory)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket category'),
      });
    if (
      ticketCategory.toJSON().ticketSubCategories.length > 0 ||
      ticketCategory.toJSON().tickets.length > 0
    )
      return res.status(statusCodes.BAD_REQUEST).json({
        message: usermessage.canNotDelete('tickets & ticket sub categories'),
      });
    await ticketCategory.destroy({
      user: req.userDetails,
    });

    res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Ticket category'),
    });
  } catch (err) {
    next(err);
  }
};
