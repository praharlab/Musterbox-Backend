const { Op, Sequelize } = require("sequelize");
const { usermessage } = require("../response_message/message");
const { statusCodes } = require("../utils/commonVars");
const { generateExcel } = require("../utils/exportData");
const UserInbox = require("../models/UserInbox");
const UserMaster = require("../models/userMaster");
const OperationMaster = require("../models/operation");
const FormMaster = require("../models/formMaster");
const UserRole = require("../models/userRole");
const RolePermission = require("../models/rolePermission");
const message = require("../response_message/message");

exports.listTicketCategory = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
    } = req.query;

    const condition = { assignedTo: req.userDetails.userMasterId };

    if (search)
      condition[Op.or] = [
        { activityTableName: { [Op.iLike]: `%${search}%` } },
        // { description: { [Op.iLike]: `%${search}%` } },
      ];

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [["createdAt", "DESC"]];

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }

    const userInbox = await UserInbox.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      nest: true,
      distinct: true,
    });

    if (exportData) {
      await generateExcel(
        userInbox.rows.map((e) => e.toJSON()),
        "User-Inbox",
        exportFileType,
        res
      );
      return;
    }
    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage("User Inbox"),
      data: userInbox.rows,
      totalcount: userInbox.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

async function checkLoanAdvancePermission(userMasterId) {
  const condition = {};
  const activityTableName = [];

  const userRoleData = await UserRole.findOne({
    raw: true,
    where: {
      userMasterID: userMasterId,
    },
    include: [
      {
        required: true,
        model: UserMaster,
        where: {
          admin: {
            [Sequelize.Op.notIn]: [2, 3],
          },
        },
        attributes: [],
      },
    ],
  });

  if (!userRoleData) return activityTableName;

  condition.roleMasterID = userRoleData.roleMasterID;
  const array = [
    "LoanMaster",
    "AdvancePayment",
    "EmployeeMaster",
    "JobApplication",
    "HRPre-BoardingRequest",
  ];
  const formNameCondition = {
    formName: {
      [Sequelize.Op.in]: array,
    },
  };

  const userRights = await RolePermission.findAll({
    raw: true,
    where: condition,
    attributes: [],
    include: [
      { model: FormMaster, where: formNameCondition },
      {
        model: OperationMaster,
        attributes: [],
        where: {
          operationID: 4,
        },
      },
    ],
  });

  array.map((e) => {
    const data = userRights.find((f) => f["formMaster.formName"] == e);
    if (!data) {
      if (e == "LoanMaster") {
        activityTableName.push("loanMasters");
      } else if (e == "AdvancePayment") {
        activityTableName.push("advancePayments");
      } else if (e === "EmployeeMaster") {
        activityTableName.push("userExperiences");
        activityTableName.push("userEducations");
        activityTableName.push("userFamilies");
        activityTableName.push("userDocuments");
      } else if (e === "JobApplication") {
        activityTableName.push("jobApplications");
      } else if (e === "HRPre-BoardingRequest") {
        activityTableName.push("preboardings");
      }
    }
  });

  return activityTableName;
}

exports.getUserInboxData = async (req, res, next) => {
  try {
    const { page, limit, type, startdate, enddate } = req.query;

    const pagtinatequery =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    if (startdate && enddate) {
      const futureDate = new Date(new Date(enddate).getTime() + 86400000)
        .toISOString()
        .slice(0, 10);
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(futureDate)],
      };
    }

    const checkPermission = await checkLoanAdvancePermission(
      req.userDetails.userMasterId
    );

    if (type && checkPermission.includes(type)) {
      condition.assignedTo = {
        [Op.eq]: null,
      };
      condition.activityTable = type;
    } else if (type) {
      condition[Sequelize.Op.or] = [
        { assignedTo: req.userDetails.userMasterId },
        { assignedTo: null },
      ];
      condition.activityTable = type;
    } else {
      condition[Sequelize.Op.or] = [
        { assignedTo: req.userDetails.userMasterId },
        { assignedTo: null },
      ];

      if (checkPermission.length) {
        condition.activityTable = {
          [Sequelize.Op.notIn]: checkPermission,
        };
      }
    }
    condition.companyMasterID = {
      [Sequelize.Op.or]: [req.userDetails.companyMasterId, null],
    };

    const { rows: userInbox, count: totalcount } =
      await UserInbox.findAndCountAll({
        where: {
          ...condition,
          [Sequelize.Op.and]: [
            {
              [Sequelize.Op.or]: [
                Sequelize.where(
                  Sequelize.col("userInbox.assignedBy"),
                  Sequelize.Op.is,
                  null
                ),
                Sequelize.where(
                  Sequelize.col("requestAssignedBy.userMasterID"),
                  Sequelize.Op.not,
                  null
                ),
              ],
            },
          ],
        },
        ...pagtinatequery,
        raw: true,
        order: [["createdAt", "DESC"]],
        include: [
          {
            required: false,
            model: UserMaster,
            as: "requestAssignedBy",
            where: {
              companyMasterId:
                req.userDetails.childCompanies.length > 0
                  ? [
                      ...req.userDetails.childCompanies,
                      req.userDetails.companyMasterId,
                    ]
                  : req.userDetails.companyMasterId,
            },
            attributes: [],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: userInbox,
      totalcount: totalcount,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { id } = req.body;

    await UserInbox.destroy({
      where: {
        id,
      },
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Notification"),
    });
  } catch (error) {
    next(error);
  }
};
