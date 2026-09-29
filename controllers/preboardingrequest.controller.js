const Sequelize = require("sequelize");
const PreboardingRequest = require("../models/preboardingrequest");
const logger = require("../config/logger");
const message = require("../response_message/message");
const CompanyMasterModel = require("../models/companyMaster");
const sequelize = require("../config/database");
const Preboarding = require("../models/preboarding");
const UserMaster = require("../models/userMaster");
const companyMaster = require("../models/companyMaster");
const Designation = require("../models/designation");
const BranchMaster = require("../models/branchMaster");
const { user } = require("../config/erpdatabase");
const FormMaster = require("../models/formMaster");
const { sendNotification } = require("../utils/commonUtilFunctions");
const { accessibleUsers } = require("../utils/commonUtilFunctions");
const RolePermission = require("../models/rolePermission");
const RoleMaster = require("../models/roleMaster");
const UserRole = require("../models/userRole");
const CountryMaster = require("../models/countrymaster");
const { userAttributes } = require("../utils/commonVars");
const UserInbox = require("../models/UserInbox");
const {
  mailTemplateTypes,
  preboardingStatusTypes,
} = require("../utils/dbUtils");
/**
 * save preboarding request data.
 *
 * @body {createBy} createBy user id of user who added the preboarding request.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

async function sendPreboardingNotification(
  userMasterID,
  preboardingID,
  createBy,
  requeststatus
) {
  if (!preboardingID) return;

  const preboarding = await Preboarding.findOne({
    where: { preboardingID: preboardingID },
    attributes: ["firstName", "companyMasterID", "lastName"],
  });
  const preBoardingUserName = `${preboarding.firstName} ${preboarding.lastName}`;
  if (userMasterID) {
    if (!createBy) return;
    const createdUser = await UserMaster.findOne({
      where: { userMasterID: createBy },
      attributes: ["displayName"],
    });
    const requestUser = await UserMaster.findOne({
      where: { userMasterID: userMasterID },
      attributes: ["displayName"],
    });

    const message =
      "Hey " +
      requestUser.displayName +
      "! " +
      createdUser.displayName +
      " just assigned an Interview of " +
      preBoardingUserName +
      " with you";
    const notification = {
      title: "Preboarding Request",
      body: message,
    };
    const data = {
      screen: "preboarding",
      isScheduled: "true",
      scheduledTime: new Date().toISOString(),
    };

    await sendNotification(userMasterID, notification, data);
  } else if (requeststatus == preboardingStatusTypes.HRROUND) {
    const role = await RolePermission.findAll({
      raw: true,
      where: {
        operationID: 4,
      },
      include: [
        {
          model: FormMaster,
          where: { formName: "HRPre-BoardingRequest" },
          attributes: [],
        },
        {
          model: RoleMaster,
          where: {
            companyMasterID: preboarding.companyMasterID,
          },
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col("rolePermission.roleMasterID"), "roleMasterID"],
      ],
    });

    const allRoleIds = role.map((e) => e.roleMasterID);

    const allUser = await UserRole.findAll({
      raw: true,
      where: {
        roleMasterID: {
          [Sequelize.Op.in]: allRoleIds,
        },
      },
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: preboarding.companyMasterID, status: 1 },
          attributes: [],
        },
      ],

      attributes: [
        [Sequelize.col("userMaster.userMasterID"), "userMasterID"],
        [Sequelize.col("userMaster.displayName"), "displayName"],
      ],
    });

    for (let i = 0; i < allUser.length; i++) {
      const message =
        "Hey " +
        allUser[i].displayName +
        "! " +
        preBoardingUserName +
        "'s Preboarding application just got back to HR round.";
      const notification = {
        title: "Preboarding Request",
        body: message,
      };
      const data = {
        screen: "hrpreboarding",
        isScheduled: "true",
        scheduledTime: new Date().toISOString(),
      };

      await sendNotification(allUser[i].userMasterID, notification, data);
    }
  }
}

exports.postAddPreboardingRequest = async (req, res, next) => {
  try {
    const { userMasterID, preboardingID, remarks, requeststatus } =
      await req.body;
    const createBy = req.userDetails.userMasterId;
    const insertPreboardingRequest = await PreboardingRequest.create(
      {
        userMasterID,
        preboardingID,
        remarks,
        requeststatus,
      },
      { user: req.userDetails }
    );
    if (userMasterID) {
      const findPreboarding = await Preboarding.findOne({
        where: { preboardingID: preboardingID },
        attributes: ["firstName"],
      });
      const requestUser = await UserMaster.findOne({
        where: { userMasterID: createBy },
        attributes: ["firstName"],
      });

      const message =
        requestUser.firstName +
        " just assigned an Interview of " +
        findPreboarding.firstName +
        " with you";
      await UserInbox.create({
        activityTable: PreboardingRequest.getTableName(),
        activityTablePK: insertPreboardingRequest.toJSON().preboardingRequestID,
        message: message,
        assignedTo: userMasterID,
        assignedBy: createBy,
      });
    }
    await sendPreboardingNotification(
      userMasterID,
      preboardingID,
      createBy,
      requeststatus
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Pre-Boarding Request"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllPreboardingRequestData = async (req, res, next) => {
  try {
    let { limit, page, userMasterID, searchQuery } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const condition = {};

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          "$preboarding.firstName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          "$preboarding.middleName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          "$preboarding.lastName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];
    }
    condition.userMasterID = userMasterID;
    condition.requeststatus = "Interview";
    const { rows: preboarding_data, count } =
      await PreboardingRequest.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Preboarding,
            include: [
              {
                model: companyMaster,
              },
              { model: BranchMaster, attributes: ["branchName"] },
              { model: Designation, attributes: ["designationName"] },
              {
                model: CountryMaster,
                attributes: ["countryName", "countryCode"],
              },
            ],
          },
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            required: false,
            model: UserMaster,
            as: "createdByUserDetails",
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: "updatedByUserDetails",
            attributes: userAttributes,
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: preboarding_data,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatePreboardingRequest = async (req, res, next) => {
  try {
    let {
      preboardingRequestID,
      userMasterID,
      preboardingID,
      remarks,
      requeststatus,
    } = await req.body;

    await PreboardingRequest.update(
      {
        userMasterID,
        preboardingID,
        remarks,
        requeststatus,
      },
      {
        where: { preboardingRequestID: preboardingRequestID },
        user: req.userDetails,
      }
    );
    await UserInbox.destroy({
      where: {
        activityTable: PreboardingRequest.getTableName(),
        activityTablePK: preboardingRequestID,
      },
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Pre-Boarding Request"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreboardingRequestByPreboardingId = async (req, res, next) => {
  try {
    const getAllPreboardingRequest = await PreboardingRequest.findAll({
      where: {
        preboardingID: req.params.id,
      },
      order: [["preboardingRequestID", "ASC"]],
      include: [
        {
          model: Preboarding,
          include: [
            {
              model: companyMaster,
            },
            {
              model: Designation,
            },
            {
              required: false,
              model: UserMaster,
              as: "createdByUserDetails",
              attributes: userAttributes,
            },
            {
              required: false,
              model: UserMaster,
              as: "updatedByUserDetails",
              attributes: userAttributes,
            },
          ],
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            {
              model: companyMaster,
            },
          ],
        },
        {
          required: false,
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: "updatedByUserDetails",
          attributes: userAttributes,
        },
      ],
    });
    return res
      .status(200)
      .json({ status: 200, data: getAllPreboardingRequest });
  } catch (err) {
    next(err);
  }
};
