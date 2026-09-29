const { Op, Sequelize } = require('sequelize');
const { usermessage } = require('../response_message/message');
const Ticket = require('../models/ticket');
const TicketCategory = require('../models/ticketCategory');
const UserMaster = require('../models/userMaster');
const TicketSubCategory = require('../models/ticketSubCategory');
const TicketUpdates = require('../models/ticketUpdates');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const companyMaster = require('../models/companyMaster');
const { TicketStatusEnum } = require('../utils/dbUtils');
const { cloneDeep } = require('lodash');
const { generateExcel } = require('../utils/exportData');
const sequelize = require('../config/database');
const {
  sendNotification,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const Division = require('../models/division');
const EmployeeDivision = require('../models/employeeDivision');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const Department = require('../models/department');
const EmployeeDepartment = require('../models/employeeDepartment');
const Designation = require('../models/designation');
const EmployeeDesignation = require('../models/employeeDesignation');

exports.createTicket = async (req, res, next) => {
  try {
    const { title, description, ticketCategoryId, ticketSubCategoryId } =
      req.body;
    const ticketCategory = await TicketCategory.findByPk(ticketCategoryId, {
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
      raw: true,
    });
    if (!ticketCategory)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket category'),
      });
    let assignee = ticketCategory.defaultAssignee;

    if (ticketSubCategoryId) {
      const ticketSubCategory =
        await TicketSubCategory.findByPk(ticketSubCategoryId);
      if (!ticketSubCategory)
        return res.status(statusCodes.NOT_FOUND).json({
          message: usermessage.notFoundMessage('Ticket subcategory'),
        });
      assignee = ticketSubCategory.defaultAssignee;
    }

    const userExists = await UserMaster.findByPk(assignee);
    if (!userExists)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Default Assignee'),
      });

    let attachments;
    if (req.files) attachments = req.files.map((file) => file.path);

    const ticket = await Ticket.create(
      {
        title,
        description,
        ticketCategoryId,
        ticketSubCategoryId,
        assignee,
        attachments,
      },
      {
        user: req.userDetails,
      }
    );

    //Ticket Create message
    const createUser = await UserMaster.findByPk(ticket.createBy);

    let message = '';
    if (createUser) {
      message =
        createUser.firstName + ' just raised a ticket regarding ' + title;
    }

    const notification = {
      title: 'Hey ' + userExists.firstName + '! someone just raised a ticket',
      body: message,
    };
    const data = {
      screen: 'ticketraise',
      ID: ticket.id,
      // senderID: msg.senderId.toString(),
      // isScheduled:true,
      scheduledTime: new Date().toISOString(),
    };

    await sendNotification(userExists.userMasterID, notification, data);

    res.status(statusCodes.OK).json({
      data: ticket,
      message: usermessage.addMessage('Ticket'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTicket = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    const {
      title,
      description,
      status,
      priority,
      ticketCategoryId,
      ticketSubCategoryId,
      assignee,
    } = req.body;
    const updateLogs = [];

    const ticket = await Ticket.findOne({
      where: {
        id,
        assignee: req.userDetails.userMasterId,
      },
      include: [
        {
          model: UserMaster,
          as: 'ticketAssignedTo',
          attributes: userAttributes,
        },
        {
          model: TicketCategory,
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
        },
      ],
    });

    console.log(ticket, 'ticket');
    if (!ticket) {
      await transaction.rollback();
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket'),
      });
    }
    if (title) ticket.title = title;
    if (description) ticket.description = description;
    if (status && ticket.status !== status) {
      updateLogs.push({
        message: `Status changed from ${ticket.status} to ${status}`,
        ticketId: id,
      });
      ticket.status = status;

      const createdUser = await UserMaster.findByPk(ticket.createBy);

      if (createdUser) {
        const notification = {
          title:
            'Hey ' +
            createdUser.firstName +
            '! your ticket status just got changed to ' +
            status,
          body: '',
        };
        const data = {
          screen: 'ticketstatus',
          ID: id,
          // senderID: msg.senderId.toString(),
          // isScheduled:true,
          scheduledTime: new Date().toISOString(),
        };

        await sendNotification(ticket.createBy, notification, data);
      }
    }
    if (priority && ticket.priority !== priority) {
      updateLogs.push({
        message: `Priority changed from ${ticket.priority} to ${priority}`,
        ticketId: id,
      });
      ticket.priority = priority;
    }
    if (ticketCategoryId) {
      const ticketCategory = await TicketCategory.findByPk(ticketCategoryId, {
        raw: true,
      });
      if (!ticketCategory) {
        await transaction.rollback();
        return res.status(statusCodes.NOT_FOUND).json({
          message: usermessage.notFoundMessage('Ticket category'),
        });
      }
      ticket.ticketCategoryId = ticketCategoryId;
    }
    if (ticketSubCategoryId) {
      const ticketSubCategory =
        await TicketSubCategory.findByPk(ticketSubCategoryId);
      if (!ticketSubCategory) {
        await transaction.rollback();
        return res.status(statusCodes.NOT_FOUND).json({
          message: usermessage.notFoundMessage('Ticket subcategory'),
        });
      }
      ticket.ticketSubCategoryId = ticketSubCategoryId;
    }
    if (assignee && ticket.assignee !== assignee) {
      const userExists = await UserMaster.findByPk(assignee);
      if (!userExists) {
        await transaction.rollback();
        return res.status(statusCodes.NOT_FOUND).json({
          message: usermessage.notFoundMessage('Default Assignee'),
        });
      }
      updateLogs.push({
        message: `Assignee changed from ${ticket.ticketAssignedTo.displayName} to ${userExists.displayName}`,
        ticketId: id,
      });
      ticket.assignee = assignee;
    }
    await ticket.save({
      user: req.userDetails,
      transaction,
    });
    await TicketUpdates.bulkCreate(updateLogs, {
      user: req.userDetails,
      individualHooks: true,
      transaction,
    });
    await transaction.commit();
    return res.status(statusCodes.OK).json({
      data: ticket,
      message: usermessage.updateMessage('Ticket'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getTicketDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const permissionCondition = {
      [Op.or]: [
        { createBy: req.userDetails.userMasterId },
        { assignee: req.userDetails.userMasterId },
      ],
    };
    const ticket = await Ticket.findOne({
      where: {
        id,
        ...permissionCondition,
      },
      include: [
        { model: TicketUpdates },
        {
          model: TicketCategory,
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
        },
        { model: TicketSubCategory },
        {
          model: UserMaster,
          as: 'ticketCreatedBy',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'ticketAssignedTo',
          attributes: userAttributes,
        },
      ],
    });
    if (!ticket)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket'),
      });
    res.status(statusCodes.OK).json({
      data: ticket,
      message: usermessage.fetchMessage('Ticket'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listTicket = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      ticketCategoryId,
      ticketSubCategoryId,
      companyMasterID,
      status,
      priority,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;

    const condition = {
      [Op.or]: [
        { createBy: req.userDetails.userMasterId },
        { assignee: req.userDetails.userMasterId },
      ],
    };
    if (ticketCategoryId) condition.ticketCategoryId = +ticketCategoryId;
    if (ticketSubCategoryId)
      condition.ticketSubCategoryId = +ticketSubCategoryId;
    if (status) condition.status = status;
    if (priority) condition.priority = priority;
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      companyFilter.companyMasterID = companyMasterID;
      req.userDetails.accessibleCompanies = companyMasterID;
    }
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

    const tickets = await Ticket.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: TicketCategory,
          required: true,
          include: {
            model: companyMaster,
            where: companyFilter,
          },
        },
        { model: TicketSubCategory },
        { model: TicketUpdates },
        {
          model: UserMaster,
          as: 'ticketCreatedBy',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'ticketAssignedTo',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      distinct: true,
      nest: true,
    });

    if (exportData) {
      await generateExcel(
        tickets.rows.map((e) => e.toJSON()),
        'Ticket-Category',
        exportFileType,
        res
      );
      return;
    }

    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Ticket'),
      data: tickets.rows,
      totalcount: tickets.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await Ticket.findByPk(id, {
      include: [
        {
          model: TicketCategory,
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
        },
      ],
    });
    if (!task)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket'),
      });

    await task.destroy({
      user: req.userDetails,
    });

    res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Ticket'),
    });
  } catch (err) {
    next(err);
  }
};

exports.createTicketUpdate = async (req, res, next) => {
  try {
    const { message } = req.body;
    const { id } = req.params;
    const ticket = await Ticket.findByPk(id, {
      include: [
        {
          model: TicketCategory,
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
        },
      ],
    });
    if (!ticket)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Ticket'),
      });
    let attachments;
    if (req.files) attachments = req.files.map((file) => file.path);
    const ticketUpdates = await TicketUpdates.create(
      { message, ticketId: id, attachments },
      { user: req.userDetails }
    );
    res.status(statusCodes.OK).json({
      data: ticketUpdates,
      message: usermessage.addMessage('Ticket update'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getTicketReport = async (req, res, next) => {
  try {
    const companyCondition = {
      include: [
        {
          required: true,
          model: TicketCategory,
          attributes: [],
          include: {
            model: companyMaster,
            attributes: [],
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
        },
      ],
    };
    const userCondition = cloneDeep(companyCondition.include);
    userCondition.push({
      model: UserMaster,
      as: 'ticketAssignedTo',
      attributes: [
        'displayName',
        'photo',
        'userNumber',
        'firstName',
        'lastName',
      ],
      required: true,
      ...accessibleUsers(req.userDetails),
    });

    const subCategoryCondition = cloneDeep(companyCondition.include);
    subCategoryCondition.push({
      required: true,
      model: TicketSubCategory,
      attributes: ['name'],
    });

    const categoryCondition = cloneDeep(companyCondition.include);
    categoryCondition[0].attributes.push('name');
    categoryCondition[0].include.required = true;

    const [
      totalTickets,
      ticketsByCategory,
      ticketsBySubCategory,
      ticketsByUser,
      avgResolutionTime,
      ticketStatusDistribution,
      ticketPriorityDistribution,
    ] = await Promise.all([
      Ticket.count(companyCondition),
      Ticket.findAll({
        include: categoryCondition,
        attributes: [
          'ticketCategory.name',
          [Sequelize.fn('count', Sequelize.col('*')), 'count'],
        ],
        group: ['ticketCategory.id'],
      }),
      Ticket.findAll({
        include: subCategoryCondition,
        attributes: [[Sequelize.fn('count', Sequelize.col('*')), 'count']],
        group: ['ticketSubCategory.id'],
      }),

      Ticket.findAll({
        include: userCondition,
        attributes: [
          '"ticket.assignee"',
          [Sequelize.fn('count', Sequelize.col('*')), 'count'],
        ],
        group: ['ticket.assignee', 'ticketAssignedTo.userMasterID'],
      }),
      Ticket.findAll({
        where: { status: TicketStatusEnum.CLOSED },
        ...companyCondition,
        attributes: [
          [
            Sequelize.fn(
              'AVG',
              Sequelize.fn(
                'EXTRACT',
                Sequelize.literal(
                  `EPOCH FROM "ticket"."updatedAt" - "ticket"."createdAt"`
                )
              )
            ),
            'avgResolutionTime',
          ],
        ],
        group: ['ticket.status'],
      }),
      Ticket.findAll({
        ...companyCondition,
        attributes: [
          'status',
          [Sequelize.fn('count', Sequelize.col('*')), 'count'],
        ],
        group: ['ticket.status'],
      }),
      Ticket.findAll({
        ...companyCondition,
        attributes: [
          'priority',
          [Sequelize.fn('count', Sequelize.col('*')), 'count'],
        ],
        group: ['priority'],
      }),
    ]);
    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Ticket report'),
      data: {
        totalTickets,
        ticketsByCategory,
        ticketsBySubCategory,
        ticketsByUser,
        avgResolutionTime,
        ticketStatusDistribution,
        ticketPriorityDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

//ticket.controller

exports.Allticketdata = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      withDeleted,
      ticketCategoryId,
      ticketSubCategoryId,
      companyMasterID,
      status,
      priority,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
      userMasterID,
      branchMasterID,
      designationID,
      departmentID,
      divisionId,
      workingAreaId,
    } = req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const condition = {};

    if (ticketCategoryId) condition.ticketCategoryId = +ticketCategoryId;

    if (userMasterID && userMasterID.length > 0) {
      condition.assignee = { [Op.in]: userMasterID };
    }

    if (ticketSubCategoryId)
      condition.ticketSubCategoryId = +ticketSubCategoryId;
    if (status) condition.status = status;
    if (priority) condition.priority = priority;

    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };

    if (companyMasterID) {
      companyFilter.companyMasterID = companyMasterID;
      req.userDetails.accessibleCompanies = companyMasterID;
    }

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
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    console.log(condition, 'condtion');

    const tickets = await Ticket.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: TicketCategory,
          required: true,
          include: {
            model: companyMaster,
            where: companyFilter,
          },
        },
        { model: TicketSubCategory },
        { model: TicketUpdates },
        {
          model: UserMaster,
          as: 'ticketCreatedBy',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'ticketAssignedTo',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
          include: [
            {
              model: EmployeeDesignation,
              ...(designationID && { designationID: designationID }),
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: designationID ? true : false,
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
              model: EmployeeDepartment,
              where: {
                ...(departmentID && { departmentID: departmentID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: departmentID ? true : false,
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
              model: EmployeeBranch,
              where: {
                ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: branchMasterID ? true : false,
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
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              model: EmployeeDivision,
              where: {
                ...(divisionId && { divisionId: divisionId }),
                status: 1,
                startDate: { [Sequelize.Op.lte]: new Date() },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date() } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              // separate: true,
              required: divisionId ? true : false,

              attributes: ['divisionId', 'startDate'],
              include: [
                {
                  model: Division,
                  attributes: ['divisionName'],
                },
              ],
            },

            {
              model: EmployeeWorkingArea,
              where: {
                ...(workingAreaId && { workingAreaId: workingAreaId }),
                status: 1,
                startDate: { [Sequelize.Op.lte]: new Date() },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date() } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              // separate: true,
              required: workingAreaId ? true : false,
              attributes: ['workingAreaId', 'startDate'],
              include: [
                {
                  model: WorkingArea,
                  attributes: ['workingAreaName'],
                },
              ],
            },
          ],
        },
      ],
      distinct: true,
      nest: true,
    });

    if (exportData) {
      const finaldata = tickets.rows.map((e) => {
        return {
          'Ticket Title': e.title,
          'Ticket Desc': e.description,
          'Ticket Category': e.ticketCategory ? e.ticketCategory.name : '',
          'Ticket Sub Category': e.ticketSubCategory
            ? e.ticketSubCategory.name
            : '',
          Status: e.status,
          Priority: e.priority,
          'Created By Name': e.ticketCreatedBy.displayName,
          'Assigned To Name': e.ticketAssignedTo.displayName,
          Created: asiaKolkataDateTime(e.createdAt),
        };
      });

      await generateExcel(finaldata, 'Ticket-Category', exportFileType, res);
      return;
    }

    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Ticket'),
      data: tickets.rows,
      totalcount: tickets.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};
