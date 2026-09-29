const AuthorizationCriteriaMaster = require("../models/authorizationCriteriaMaster");
const ExtraDays = require("../models/extraDays");
const AuthorizationDetails = require("../models/AuthorizationDetails");
const AuthorizationCriteria = require("../models/authorizationCriteriaMaster");
const UserMaster = require("../models/userMaster");
const ExtraDaysAuthorization = require("../models/extraDaysAuthorization");
const moment = require("moment");
const {
  asiaKolkataDateTime,
  sendNotification,
} = require("../utils/commonUtilFunctions");
const { Sequelize } = require("sequelize");
const EmployeeDesignation = require("../models/employeeDesignation");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const Designation = require("../models/designation");
const sequelize = require("../config/database");
const UserInbox = require("../models/UserInbox");
const { authorizationMasterTypes } = require("../utils/dbUtils");
const EmployeeDivision = require("../models/employeeDivision");
const Division = require("../models/division");
const EmployeeWorkingArea = require("../models/employeeWorkingArea");
const WorkingArea = require("../models/workingArea");
const { userAttributes, companyAttributes } = require("../utils/commonVars");

exports.getExtradaysAuthorizationRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const authorizationRequest = await ExtraDays.findOne({
      where: { extraDaysID: id },
      include: [
        {
          model: UserMaster,
          attributes: userAttributes,
          include: [
            {
              required: false,
              model: AuthorizationDetails,
              as: "authorizationDetails",
              where: {
                status: 1,
                AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
              },
              attributes: ["AuthorizationCriteriaID"],
              include: [
                {
                  model: AuthorizationCriteriaMaster,
                  as: "AuthorizationCriteriaMaster",
                  attributes: ["AuthorizationCriteria"],
                },
              ],
            },
            {
              separate: true,
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["designationID"],
              include: [
                {
                  model: Designation,
                  as: "designation",
                  attributes: ["designationName"],
                },
              ],
            },
            {
              required: false,
              separate: true,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["departmentID"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["departmentName"],
                },
              ],
            },
            {
              required: false,
              separate: true,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ["branchID"],
              include: [
                {
                  model: BranchMaster,
                  as: "branchMaster",
                  attributes: ["branchName"],
                },
              ],
            },
            {
              separate: true,
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ["employeeCode"],
            },
            {
              required: false,
              separate: true,
              model: EmployeeDivision,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["divisionId", "startDate"],
              include: [
                {
                  model: Division,
                  attributes: ["divisionName"],
                },
              ],
            },

            {
              required: false,
              separate: true,
              model: EmployeeWorkingArea,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["workingAreaId", "startDate"],
              include: [
                {
                  model: WorkingArea,
                  attributes: ["workingAreaName"],
                },
              ],
            },
          ],
        },
        {
          model: UserMaster,
          as: "createByUser",
          attributes: ["displayName"],
        },
      ],
    });

    const {
      authorizationStatus,
      userMasterID,
      userMaster,
      createByUser,
      date,
      days,
      remarks,
      cancelRemarks,
    } = authorizationRequest;

    const { displayName, authorizationDetails } = userMaster;

    const authCriteriaID =
      authorizationDetails && authorizationDetails.length > 0
        ? authorizationDetails[0].AuthorizationCriteriaID
        : null;

    const authCriteria = await AuthorizationCriteria.findOne({
      where: { AuthorizationCriteriaID: authCriteriaID },
      attributes: ["AuthorizationCriteria"],
    });

    const authUserStatuses = await ExtraDaysAuthorization.findAll({
      where: { extraDaysID: id },
    });

    const userMasterIDs = authUserStatuses.map((item) => item.userMasterID);

    const users = await UserMaster.findAll({
      where: { userMasterID: userMasterIDs },
      attributes: ["userMasterID", "displayName"],
    });

    const userMap = new Map(
      users.map((user) => [user.userMasterID.toString(), user.displayName])
    );

    const authUserStatusData = authUserStatuses.map((status) => ({
      userMasterID: status.userMasterID,
      displayName: userMap.get(status.userMasterID.toString()) || null,
      authStatus: status.authStatus,
      remarks: status.remarks,
      updatedAt: status.updatedAt,
    }));

    const formattedDate = moment(date).format("DD/MM/YYYY");

    const responseData = {
      date: formattedDate,
      authorizationStatus,
      userMasterID,
      displayName,
      AuthorizationCriteria: authCriteria
        ? authCriteria.AuthorizationCriteria
        : "",
      authUserStatus:
        authUserStatusData && authUserStatusData.length > 0
          ? authUserStatusData
          : [],
      createdByUser: createByUser ? createByUser.displayName : "",
      days: days,
      remarks,
      cancelRemarks,
            employeeCode:
        authorizationRequest.userMaster?.employeeJoiningDetails[0]
          ?.employeeCode || "",
      branch:
        authorizationRequest.userMaster?.employeeBranches?.[0]?.branchMaster
          ?.branchName || "",
      department:
        authorizationRequest.userMaster?.employeeDepartments?.[0]?.department
          ?.departmentName || "",
      designation:
        authorizationRequest.userMaster?.employeeDesignations?.[0]?.designation
          ?.designationName || "",
      division:
        authorizationRequest.userMaster?.employeeDivisions?.[0]?.division
          ?.divisionName || null,
      workingArea:
        authorizationRequest.userMaster?.employeeWorkingAreas?.[0]?.workingArea
          ?.workingAreaName || null,
      createdAt: authorizationRequest.createdAt,
      userNumber: authorizationRequest.userMaster?.userNumber,
    };

    return res.status(200).json({ status: 200, data: responseData });
  } catch (error) {
    next(error);
  }
};

exports.viewExtraDayAuthorizationByUserId = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, user, status, userMasterID } =
      req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = { userMasterID };

    if ((!user || user.length === 0) && status) {
      condition.authStatus = status;
      if (status == 2) {
        condition["$extraDay.authorizationStatus$"] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
      }
    }

    if (user && user.length > 0) {
      condition["$extraDay.userMasterID$"] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition["$extraDay.date$"] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const ExtraDayAuthorizationRequest =
      await ExtraDaysAuthorization.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [["createdAt", "DESC"]],
        include: [
          {
            required: true,
            model: ExtraDays,
            include: [
              {
                model: UserMaster,
                attributes: ["userMasterID", "displayName", "userNumber"],
                include: [
                  {
                    separate: true,
                    required: false,
                    model: EmployeeDesignation,
                    where: {
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ["designationID"],
                    include: [
                      {
                        model: Designation,
                        as: "designation",
                        attributes: ["designationName"],
                      },
                    ],
                  },
                  {
                    required: false,
                    separate: true,
                    model: EmployeeDepartment,
                    where: {
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ["departmentID"],
                    include: [
                      {
                        model: Department,
                        as: "department",
                        attributes: ["departmentName"],
                      },
                    ],
                  },
                  {
                    required: false,
                    separate: true,
                    model: EmployeeBranch,
                    where: {
                      status: 1,
                      applicableDate: {
                        [Sequelize.Op.lte]: new Date(filterDate),
                      },
                      [Sequelize.Op.or]: [
                        {
                          endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                        },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },
                    required: false,
                    attributes: ["branchID"],
                    include: [
                      {
                        model: BranchMaster,
                        as: "branchMaster",
                        attributes: ["branchName"],
                      },
                    ],
                  },
                  {
                    separate: true,
                    required: false,
                    model: EmployeeJoiningDetails,
                    attributes: ["employeeCode"],
                  },
                  {
                    required: false,
                    separate: true,
                    model: EmployeeDivision,
                    where: {
                      status: 1,
                      startDate: { [Sequelize.Op.lte]: filterDate },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: filterDate } },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ["divisionId", "startDate"],
                    include: [
                      {
                        model: Division,
                        attributes: ["divisionName"],
                      },
                    ],
                  },

                  {
                    required: false,
                    separate: true,
                    model: EmployeeWorkingArea,
                    where: {
                      status: 1,
                      startDate: { [Sequelize.Op.lte]: filterDate },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: filterDate } },
                        { endDate: { [Sequelize.Op.eq]: null } },
                      ],
                    },

                    attributes: ["workingAreaId", "startDate"],
                    include: [
                      {
                        model: WorkingArea,
                        attributes: ["workingAreaName"],
                      },
                    ],
                  },
                ],
              },
              {
                model: UserMaster,
                as: "createByUser",
                attributes: ["displayName"],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: ExtraDayAuthorizationRequest.rows,
      totalcount: ExtraDayAuthorizationRequest.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.extraDaysAuthorizationacceptreject = async (req, res, next) => {
  try {
    const { extraDaysAuthorizationID, remarks, authStatus } = req.body;
    const authRequest = await ExtraDaysAuthorization.findOne({
      where: { extraDaysAuthorizationID: extraDaysAuthorizationID },
      include: [{ model: ExtraDays }],
    });

    if (!authRequest) {
      return res
        .status(200)
        .json({ status: 500, message: "Authorization request not found" });
    }

    const extraDaysID = authRequest.extraDaysID;

    const allAuthData = await ExtraDaysAuthorization.findAll({
      where: { extraDaysID },
      include: [{ model: ExtraDays }],
    });

        const authorizationMaster = await AuthorizationDetails.findOne({
            where: { AuthorizationMasterID: authorizationMasterTypes.compensatoryOff },
        });

    if (!authorizationMaster) {
      return res
        .status(200)
        .json({ status: 500, message: "Authorization Master not found" });
    }

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMaster.AuthorizationMasterID,
        userMasterID: authRequest.extraDay.userMasterID,
        status: 1,
      },
    });

    if (!authorizationDetails) {
      return res
        .status(200)
        .json({ status: 500, message: "Authorization details not found" });
    }

    const authorizationCriteria = await AuthorizationCriteria.findOne({
      where: {
        AuthorizationCriteriaID: authorizationDetails.AuthorizationCriteriaID,
        status: 1,
      },
    });

    if (!authorizationCriteria) {
      return res
        .status(200)
        .json({ status: 500, message: "Authorization criteria not found" });
    }

    const allAuthIds = allAuthData.map((e) => e.extraDaysAuthorizationID);

    await sequelize.transaction(async (t) => {
      if (authStatus == 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: ExtraDaysAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction: t }
        );

        await ExtraDays.update(
          { authorizationStatus: 4, updateBy: req.userDetails.userMasterId },
          { where: { extraDaysID }, transaction: t }
        );
      } else {
        const userinfo = await UserMaster.findOne({
          where: {
            userMasterID: authRequest.extraDay.userMasterID,
          },
        });

        const notification = {
          title: "Extra Days",
          body: userinfo.displayName + " requested for Extra Days.",
        };
        const data = {
          screen: "extradaysauth",
        };

        if (authorizationCriteria.AuthorizationCriteria === "Sequeance No") {
          await UserInbox.destroy({
            where: {
              activityTable: ExtraDaysAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
            transaction: t,
          });

          const authRequests = allAuthData.filter((e) => e.authStatus != 0);

          const approvedUserIds = authRequests.map((req) =>
            req.userMasterID.toString()
          );
          const formAuthUsers =
            authorizationDetails.AuthorizedByUserMasterId.map((id) =>
              id.toString()
            );

          const remainingUserIds = formAuthUsers.filter(
            (id) => !approvedUserIds.includes(id)
          );

          if (remainingUserIds.length > 0) {
            const extraDaysAuth = await ExtraDaysAuthorization.create(
              {
                extraDaysID,
                userMasterID: remainingUserIds[0],
                TableName: "extraDays",
                status: 1,
                authStatus: 2,
              },
              { user: req.userDetails, transaction: t }
            );

            await UserInbox.create(
              {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK:
                  extraDaysAuth.toJSON().extraDaysAuthorizationID,
                message: `${
                  userinfo.displayName
                } has requested for Extra Days for ${moment(
                  authRequest.extraDay.date
                ).format("DD/MM/YYYY")}`,
                assignedTo: remainingUserIds[0],
                assignedBy: userinfo.userMasterID,
              },
              { transaction: t }
            );

            await sendNotification(remainingUserIds[0], notification, data);
          } else {
            await ExtraDays.update(
              {
                authorizationStatus: 3,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { extraDaysID: extraDaysID }, transaction: t }
            );
          }
        } else if (authorizationCriteria.AuthorizationCriteria === "Any One") {
          await UserInbox.destroy(
            {
              where: {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK: extraDaysAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authStatus == 1);

          if (approvedRequests.length + 1 >= 1) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: ExtraDaysAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            await ExtraDays.update(
              {
                authorizationStatus: 3,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { extraDaysID: extraDaysID }, transaction: t }
            );
          }
        } else if (authorizationCriteria.AuthorizationCriteria === "Any Two") {
          await UserInbox.destroy(
            {
              where: {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK: extraDaysAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authStatus == 1);
          if (approvedRequests.length + 1 >= 2) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: ExtraDaysAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            await ExtraDays.update(
              {
                authorizationStatus: 3,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { extraDaysID: extraDaysID }, transaction: t }
            );
          }
        } else {
          await UserInbox.destroy(
            {
              where: {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK: extraDaysAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authStatus == 1);

          if (approvedRequests.length + 1 >= 3) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: ExtraDaysAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            await ExtraDays.update(
              {
                authorizationStatus: 3,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { extraDaysID }, transaction: t }
            );
          }
        }
      }

      await ExtraDaysAuthorization.update(
        { authStatus, remarks, updateBy: req.userDetails.userMasterId },
        { where: { extraDaysAuthorizationID } }
      );
    });

    return res.status(200).json({
      status: 200,
      message:
        authStatus === 1
          ? "Extra Days Authorization Request Accept Successfully"
          : "Extra Days Authorization Request Reject Successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelExtraDayAuthorizationRequest = async (req, res, next) => {
  try {
    const { extraDaysID, cancelRemarks } = req.body;

    const existExtraDays = await ExtraDays.findOne({
      where: {
        extraDaysID,
      },
    });

    if (existExtraDays && !existExtraDays.employeeincentiveID) {
      existExtraDays.authorizationStatus = 5;
      if (cancelRemarks) existExtraDays.cancelRemarks = cancelRemarks;
      await existExtraDays.save({ user: req.userDetails });
    }

    return res.status(200).json({
      status: 200,
      message: "Extra Days Request Cancelled Successfully",
    });
  } catch (error) {
    next(error);
  }
};
