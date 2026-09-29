const { Op } = require('sequelize');
const UserMaster = require('../models/userMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const EmployeeBranch = require('../models/employeeBranch');
const {
  accessibleUsers,
  sendNotification,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
``;
const UserInbox = require('../models/UserInbox');
const CompensatoryOffAuthorization = require('../models/compensatoryOffAuthorization');
const coffMaster = require('../models/coffMaster');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const moment = require('moment');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const attendanceTransaction = require('../models/attendanceTransaction');
const message = require('../response_message/message');
const { authorizationMasterTypes } = require('../utils/dbUtils');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');

exports.compensatoryOffAuthorizationacceptreject = async (req, res, next) => {
  try {
    const {
      CompensatoryOffAuthorizationID,
      remarks,
      authstatus,
      // coffMasterID,
      userMasterID,
    } = req.body;
    const authRequest = await CompensatoryOffAuthorization.findOne({
      where: { CompensatoryOffAuthorizationID: CompensatoryOffAuthorizationID },
      include: [{ model: coffMaster }],
    });

    if (!authRequest) {
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization request not found' });
    }

    const coffMasterID = authRequest.coffMasterID;

    const allAuthData = await CompensatoryOffAuthorization.findAll({
      where: { coffMasterID },
      include: [{ model: coffMaster }],
    });

    const authorizationMaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterID: 8 },
    });

    if (!authorizationMaster) {
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization Master not found' });
    }

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMaster.authorizationMasterID,
        userMasterID: authRequest.coffMaster.userMasterID,
        status: 1,
      },
    });

    if (!authorizationDetails) {
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization details not found' });
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
        .json({ status: 500, message: 'Authorization criteria not found' });
    }

    const allAuthIds = allAuthData.map((e) => e.CompensatoryOffAuthorizationID);

    await sequelize.transaction(async (t) => {
      if (authstatus == 0) {
        await UserInbox.destroy(
          {
            where: {
              activityTable: CompensatoryOffAuthorization.getTableName(),
              activityTablePK: allAuthIds,
            },
          },
          { transaction: t }
        );

        await coffMaster.update(
          { authorizationStatus: 4, updateBy: req.userDetails.userMasterId },
          { where: { coffMasterID }, transaction: t }
        );
      } else {
        const userinfo = await UserMaster.findOne({
          where: {
            userMasterID: authRequest.coffMaster.userMasterID,
          },
        });

        const notification = {
          title: 'Compensatory Off',
          body: userinfo.displayName + ' requested for Compensatory Off.',
        };
        const data = {
          screen: 'coffauth',
        };

        if (authorizationCriteria.AuthorizationCriteria === 'Sequeance No') {
          await UserInbox.destroy(
            {
              where: {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK: allAuthIds,
              },
            },
            { transaction: t }
          );

          const authRequests = allAuthData.filter((e) => e.authstatus != 0);

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
            const coffAuth = await CompensatoryOffAuthorization.create(
              {
                coffMasterID,
                userMasterID: remainingUserIds[0],
                TableName: 'coffMaster',
                status: 1,
                authstatus: 2,
                // createBy: userMasterID,
              },
              { user: req.userDetails, transaction: t }
            );

            await UserInbox.create(
              {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK:
                  coffAuth.toJSON().CompensatoryOffAuthorizationID,
                message: `${
                  userinfo.displayName
                } has requested for Compensatory Off for ${moment(
                  authRequest.coffMaster.LeaveCreatedDate
                ).format('DD/MM/YYYY')}`,
                assignedTo: remainingUserIds[0],
                assignedBy: userinfo.userMasterID,
              },
              { transaction: t }
            );

            await sendNotification(remainingUserIds[0], notification, data);
          } else {
            const addLeaveBalance = await HrLeaveBalance.create(
              {
                LeaveTranId: authRequest.coffMaster.LeaveTranId,
                userMasterID: authRequest.coffMaster.userMasterID,
                YearMM: authRequest.coffMaster.YearMM,
                LeaveAddNew: authRequest.coffMaster.LeaveAddNew,
                createBy: req.userDetails.userMasterId,
              },
              { transaction: t }
            );

            await coffMaster.update(
              {
                authorizationStatus: 3,
                LeaveBalTranId: addLeaveBalance.LeaveBalTranId,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { coffMasterID: coffMasterID }, transaction: t }
            );
          }
        } else if (authorizationCriteria.AuthorizationCriteria === 'Any One') {
          await UserInbox.destroy(
            {
              where: {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK: CompensatoryOffAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

          if (approvedRequests.length + 1 >= 1) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            const addLeaveBalance = await HrLeaveBalance.create(
              {
                LeaveTranId: authRequest.coffMaster.LeaveTranId,
                userMasterID: authRequest.coffMaster.userMasterID,
                YearMM: authRequest.coffMaster.YearMM,
                LeaveAddNew: authRequest.coffMaster.LeaveAddNew,
                createBy: req.userDetails.userMasterId,
              },
              { transaction: t }
            );

            await coffMaster.update(
              {
                authorizationStatus: 3,
                LeaveBalTranId: addLeaveBalance.LeaveBalTranId,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { coffMasterID: coffMasterID }, transaction: t }
            );
          }
        } else if (authorizationCriteria.AuthorizationCriteria === 'Any Two') {
          await UserInbox.destroy(
            {
              where: {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK: CompensatoryOffAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);
          if (approvedRequests.length + 1 >= 2) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            const addLeaveBalance = await HrLeaveBalance.create(
              {
                LeaveTranId: authRequest.coffMaster.LeaveTranId,
                userMasterID: authRequest.coffMaster.userMasterID,
                YearMM: authRequest.coffMaster.YearMM,
                LeaveAddNew: authRequest.coffMaster.LeaveAddNew,
                createBy: req.userDetails.userMasterId,
              },
              { transaction: t }
            );

            await coffMaster.update(
              {
                authorizationStatus: 3,
                LeaveBalTranId: addLeaveBalance.LeaveBalTranId,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { coffMasterID: coffMasterID }, transaction: t }
            );
          }
        } else {
          await UserInbox.destroy(
            {
              where: {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK: CompensatoryOffAuthorizationID,
              },
            },
            { transaction: t }
          );

          const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

          if (approvedRequests.length + 1 >= 3) {
            await UserInbox.destroy(
              {
                where: {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK: allAuthIds,
                },
              },
              { transaction: t }
            );

            const addLeaveBalance = await HrLeaveBalance.create(
              {
                LeaveTranId: authRequest.coffMaster.LeaveTranId,
                userMasterID: authRequest.coffMaster.userMasterID,
                YearMM: authRequest.coffMaster.YearMM,
                LeaveAddNew: authRequest.coffMaster.LeaveAddNew,
                createBy: req.userDetails.userMasterId,
              },
              { transaction: t }
            );

            await coffMaster.update(
              {
                authorizationStatus: 3,
                LeaveBalTranId: addLeaveBalance.LeaveBalTranId,
                updateBy: req.userDetails.userMasterId,
              },
              { where: { coffMasterID }, transaction: t }
            );
          }
        }
      }

      await CompensatoryOffAuthorization.update(
        { authstatus, remarks, updateBy: userMasterID },
        { where: { CompensatoryOffAuthorizationID } }
      );
    });

    return res.status(200).json({
      status: 200,
      message:
        authstatus === 1
          ? 'Compensatory Off Authorization Request Accept Successfully'
          : 'Compensatory Off Authorization Request Reject Successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.viewcompensatoryOffAuthorizationByUserId = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$coffMaster.status$': 1,
    };

    if ((!user || user.length === 0) && status) {
      condition.authstatus = status;
      if (status == 2) {
        condition['$coffMaster.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
      }
    }

    if (!status) {
      condition['$coffMaster.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$coffMaster.LeaveCreatedDate$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const CompensatoryOffAuthorizationRequest =
      await CompensatoryOffAuthorization.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: coffMaster,
            include: [
              {
                model: UserMaster,
                attributes: [
                  'userMasterID',
                  'displayName',
                  'userNumber',
                  'photo',
                ],
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
                    separate: true,

                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
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

                    attributes: ['divisionId', 'startDate'],
                    include: [
                      {
                        model: Division,
                        attributes: ['divisionName'],
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
              {
                model: UserMaster,
                as: 'createdByUser',
                attributes: ['displayName'],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: CompensatoryOffAuthorizationRequest.rows,
      totalcount: CompensatoryOffAuthorizationRequest.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getcompensatoryOffAuthorizationRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const authorizationRequest = await coffMaster.findOne({
      where: { coffMasterID: id },
      include: [
        {
          model: UserMaster,
          // as: 'authorizedPerson',
          attributes: ['userMasterID', 'displayName', 'userNumber'],
          include: [
            {
              required: false,
              model: AuthorizationDetails,
              as: 'authorizationDetails',
              where: {
                status: 1,
                AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
              },
              attributes: ['AuthorizationCriteriaID'],
              include: [
                {
                  model: AuthorizationCriteria,
                  as: 'AuthorizationCriteriaMaster',
                  attributes: ['AuthorizationCriteria'],
                },
              ],
            },
            {
              required: false,
              model: attendanceTransaction,
              where: Sequelize.where(
                Sequelize.col(
                  'userMaster->attendanceTransactions.AttendanceDate'
                ),
                '=',
                Sequelize.col('coffMaster.LeaveCreatedDate')
              ),
              attributes: ['InDatetime', 'OutDateTime'],
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
              separate: true,

              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
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

              attributes: ['divisionId', 'startDate'],
              include: [
                {
                  model: Division,
                  attributes: ['divisionName'],
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
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: ['displayName'],
        },
      ],
    });

    if (!authorizationRequest) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Coff Auth Request'),
      });
    }

    const {
      authorizationStatus,
      userMasterID,
      userMaster,
      LeaveAddNew,
      createdByUser,
    } = authorizationRequest;

    const { displayName, authorizationDetails } = userMaster;

    const authCriteriaID =
      authorizationDetails && authorizationDetails.length > 0
        ? authorizationDetails[0].AuthorizationCriteriaID
        : null;

    const authCriteria = await AuthorizationCriteria.findOne({
      where: { AuthorizationCriteriaID: authCriteriaID },
      attributes: ['AuthorizationCriteria'],
    });

    const authUserStatuses = await CompensatoryOffAuthorization.findAll({
      where: { coffMasterID: id },
    });

    const userMasterIDs = authUserStatuses.map((item) => item.userMasterID);

    const users = await UserMaster.findAll({
      where: { userMasterID: userMasterIDs },
      attributes: ['userMasterID', 'displayName'],
    });

    const userMap = new Map(
      users.map((user) => [user.userMasterID.toString(), user.displayName])
    );

    const authUserStatusData = authUserStatuses.map((status) => ({
      userMasterID: status.userMasterID,
      displayName: userMap.get(status.userMasterID.toString()) || null,
      authstatus: status.authstatus,
      remarks: status.remarks,
      updatedAt: status.updatedAt,
    }));

    const dateStr = authorizationRequest.LeaveCreatedDate;
    const [year, month, day] = dateStr.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const responseData = {
      LeaveCreatedDate: formattedDate,
      authorizationStatus,
      userMasterID,
      displayName,
      AuthorizationCriteria: authCriteria
        ? authCriteria.AuthorizationCriteria
        : '',
      authUserStatus:
        authUserStatusData && authUserStatusData.length > 0
          ? authUserStatusData
          : [],
      LeaveAddNew,
      createdByUser: createdByUser ? createdByUser.displayName : '',
      InDateTime:
        authorizationRequest.userMaster.attendanceTransactions &&
        authorizationRequest.userMaster.attendanceTransactions.length > 0
          ? authorizationRequest.userMaster.attendanceTransactions[0].InDatetime
          : null,
      OutDateTime:
        authorizationRequest.userMaster.attendanceTransactions &&
        authorizationRequest.userMaster.attendanceTransactions.length > 0
          ? authorizationRequest.userMaster.attendanceTransactions[0]
              .OutDateTime
          : null,
      employeeCode:
        authorizationRequest.userMaster?.employeeJoiningDetails[0]
          ?.employeeCode || '',
      branch:
        authorizationRequest.userMaster?.employeeBranches?.[0]?.branchMaster
          ?.branchName || '',
      department:
        authorizationRequest.userMaster?.employeeDepartments?.[0]?.department
          ?.departmentName || '',
      designation:
        authorizationRequest.userMaster?.employeeDesignations?.[0]?.designation
          ?.designationName || '',
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
    console.error(error);
    next(error);
  }
};

exports.compensatoryOffAuthorizationuser = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, authPersonid } = req.body;
    const userDetails = req.userDetails || {};
    let userdata;

    if (!userDetails.accessibleBranches) {
      userDetails.accessibleBranches = [];
    }

    if (!userDetails.accessibleCompanies) {
      userDetails.accessibleCompanies = [];
    }

    if (branchMasterID === '') {
      const Auth_person = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
          status: 1,
          companyMasterID: companyMasterID,
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(userDetails),
        },
      });

      const userid = Auth_person.map((person) => person.userMasterID);

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: { [Sequelize.Op.in]: userid },
          status: 1,
        },
        attributes: [
          ['userMasterID', 'userMasterID'],
          ['displayName', 'userName'],
          ['userNumber', 'Number'],
        ],
      });
    } else {
      const branch_contact = await EmployeeBranch.findAll({
        raw: true,
        where: {
          status: 1,
          branchID: branchMasterID,
          applicableDate: { [Sequelize.Op.lte]: new Date() },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.eq]: null } },
            { endDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
      });

      const branchuser = branch_contact.map((contact) => contact.userMasterID);

      const Auth_person = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
          status: 1,
          userMasterID: { [Sequelize.Op.in]: branchuser },
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(userDetails),
        },
      });

      const userid = Auth_person.map((person) => person.userMasterID);

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: { [Sequelize.Op.in]: userid },
          status: 1,
        },
        attributes: [
          ['userMasterID', 'userMasterID'],
          ['displayName', 'userName'],
          ['userNumber', 'Number'],
        ],
      });
    }

    return res.status(200).json({
      status: 200,
      message: {},
      data: userdata,
    });
  } catch (err) {
    next(err);
  }
};

exports.addCoffAuth = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const leaveAuthDetails = await AuthorizationDetails.findAll({
      where: {
        status: 1,
        AuthorizationMasterID: authorizationMasterTypes.leave,
        companyMasterID,
      },
      include: [
        { model: UserMaster, attributes: ['userMasterID', 'displayName'] },
      ],
    });

    const coffAuthDetails = await AuthorizationDetails.findAll({
      where: {
        status: 1,
        AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
        companyMasterID,
      },
    });

    const allUserIds = leaveAuthDetails.map((e) => e.userMasterID);

    // Find All Coff Of User
    const findAllUsercoff = await coffMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: allUserIds,
        },
        authorizationStatus: 0,
        status: 1,
      },
    });

    // Find All AuthCriteria

    const AllAuthorizationCriterias = await AuthorizationCriteria.findAll({
      where: {
        status: 1,
      },
    });

    let counter = 0;

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < leaveAuthDetails.length; i++) {
        const userMasterID = leaveAuthDetails[i].userMasterID;

        const findExistData = coffAuthDetails.find(
          (e) => e.userMasterID == userMasterID
        );
        if (findExistData) continue;

        console.log(userMasterID, counter, '---------------------');

        counter++;

        // Create AuthorizationDetails
        const insert_db_status = await AuthorizationDetails.create(
          {
            AuthorizationMasterID: authorizationMasterTypes.compensatoryOff,
            AuthorizedByUserMasterId:
              leaveAuthDetails[i].AuthorizedByUserMasterId,
            AuthorizationCriteriaID:
              leaveAuthDetails[i].AuthorizationCriteriaID,
            userMasterID,
            SerialNo: leaveAuthDetails[i].SerialNo,
            FromAmount: leaveAuthDetails[i].FromAmount,
            ToAmount: leaveAuthDetails[i].ToAmount,
            SequenceNo: leaveAuthDetails[i].SequenceNo,
            RequiredAuthorizationMessage:
              leaveAuthDetails[i].RequiredAuthorizationMessage,
            companyMasterID,
            createBy: leaveAuthDetails[i].createBy,
            createByIp: leaveAuthDetails[i].createByIp,
          },
          { transaction: t }
        );

        // Find All Coff Of User
        const findcoff = findAllUsercoff.filter(
          (e) => e.userMasterID == userMasterID
        );

        // Find AuthCriteria
        const AuthorizationCriterias = AllAuthorizationCriterias.find(
          (e) =>
            e.AuthorizationCriteriaID ==
            insert_db_status.AuthorizationCriteriaID
        );

        const authorizationStatus =
          AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ? 2
            : 1;

        const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

        // Update All Coff
        await coffMaster.update(
          {
            authorizationStatus: authorizationStatus,
            updateBy: req.body.createBy,
            updateByIp: req.body.createByIp,
          },
          {
            where: {
              coffMasterID: {
                [Sequelize.Op.in]: AllCoffMasterIDs,
              },
            },
            transaction: t,
          }
        );

        const userinfo = leaveAuthDetails[i].userMaster;

        const findAllAuthorization = await CompensatoryOffAuthorization.findAll(
          {
            where: {
              coffMasterID: {
                [Sequelize.Op.in]: AllCoffMasterIDs,
              },
              status: 1,
            },
          }
        );

        const notification = {
          title: 'Compensatory Off',
          body: userinfo.displayName + ' requested for Compensatory Off.',
        };
        const data = {
          screen: 'coffauth',
        };

        for (let j = 0; j < findcoff.length; j++) {
          const authorizationIds = findAllAuthorization
            .filter((e) => e.coffMasterID == findcoff[j].coffMasterID)
            .map((a) => a.CompensatoryOffAuthorizationID);

          // Delete All UserInbox
          await UserInbox.destroy(
            {
              where: {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: authorizationIds,
                },
              },
            },
            { transaction: t }
          );

          // Delete All Auth Data
          if (authorizationIds.length > 0) {
            await CompensatoryOffAuthorization.destroy(
              {
                where: {
                  coffMasterID: findcoff[j].coffMasterID,
                  status: 1,
                },
              },
              {
                Hooks: false,
                transaction: t,
              }
            );
          }

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            const insert_db_status1 = await CompensatoryOffAuthorization.create(
              {
                TableName: 'coffMaster',
                coffMasterID: findcoff[j].coffMasterID,
                userMasterID: insert_db_status.AuthorizedByUserMasterId[0],
                status: 1,
                authstatus: 2,
              },
              { user: req.userDetails, transaction: t }
            );

            await UserInbox.create(
              {
                activityTable: CompensatoryOffAuthorization.getTableName(),
                activityTablePK:
                  insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                message: `${
                  userinfo.displayName
                } has requested for Compensatory Off for ${moment(
                  findcoff[j].LeaveCreatedDate
                ).format('DD/MM/YYYY')}`,
                assignedTo: insert_db_status.AuthorizedByUserMasterId[0],
                assignedBy: findcoff[j].userMasterID,
              },
              { transaction: t }
            );

            await sendNotification(
              insert_db_status.AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            for (
              let k = 0;
              k < insert_db_status.AuthorizedByUserMasterId.length;
              k++
            ) {
              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findcoff[j].coffMasterID,
                  userMasterID: insert_db_status.AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                },
                {
                  user: req.userDetails,
                  transaction: t,
                }
              );

              await UserInbox.create(
                {
                  activityTable: CompensatoryOffAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().CompensatoryOffAuthorizationID,
                  message: `${
                    userinfo.displayName
                  } has requested for Compensatory Off for ${moment(
                    findcoff[j].LeaveCreatedDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                  assignedBy: findcoff[j].userMasterID,
                },
                { transaction: t }
              );

              await sendNotification(
                insert_db_status.AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }
    });

    return res.status(200).json({
      status: 200,
      message: 'Data Added Successfully.',
      data: counter,
    });
  } catch (error) {
    next(error);
  }
};
