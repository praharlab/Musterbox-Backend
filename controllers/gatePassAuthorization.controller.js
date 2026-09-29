const GatePassAuthorizationRequest = require('../models/gatePassAuthorization');
const EmployeeGatepass = require('../models/employeeGatepass');
const UserMaster = require('../models/userMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const Sequelize = require('sequelize');
const EmployeeBranch = require('../models/employeeBranch');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const { authorizationMasterTypes } = require('../utils/dbUtils');

exports.authorizationacceptrejectGatePass = async (req, res, next) => {
  try {
    const {
      AuthorizationRequestId,
      remarks,
      authstatus,
      ReferenceID,
      userMasterID,
    } = req.body;

    const authRequest = await GatePassAuthorizationRequest.findOne({
      where: { AuthorizationRequestId: AuthorizationRequestId },
      include: [{ model: EmployeeGatepass, as: 'employeeGatepass' }],
    });

    if (!authRequest) {
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization request not found' });
    }

    const authorizationMaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterID: 6 },
    });

    if (!authorizationMaster) {
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization Master not found' });
    }

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMaster.authorizationMasterID,
        userMasterID: authRequest.employeeGatepass.userMasterId,
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

    if (authorizationCriteria.AuthorizationCriteria === 'Sequeance No') {
      if (authstatus === 0) {
        await EmployeeGatepass.update(
          { authorizationStatus: 4 },
          { where: { id: ReferenceID } }
        );
      } else {
        const authRequests = await GatePassAuthorizationRequest.findAll({
          where: { ReferenceID, authstatus: { [Sequelize.Op.not]: 0 } },
        });

        const approvedUserIds = authRequests.map((req) =>
          req.userMasterID.toString()
        );
        const formAuthUsers = authorizationDetails.AuthorizedByUserMasterId.map(
          (id) => id.toString()
        );

        const remainingUserIds = formAuthUsers.filter(
          (id) => !approvedUserIds.includes(id)
        );

        if (remainingUserIds.length > 0) {
          await GatePassAuthorizationRequest.create({
            ReferenceID,
            userMasterID: remainingUserIds[0],
            TableName: 'EmployeeGatePass',
            status: 1,
            authstatus: 2,
            createBy: userMasterID,
          });
        } else {
          await EmployeeGatepass.update(
            { authorizationStatus: 3 },
            { where: { id: ReferenceID } }
          );
        }
      }
    } else if (authorizationCriteria.AuthorizationCriteria === 'Any One') {
      if (authstatus === 0) {
        await EmployeeGatepass.update(
          { authorizationStatus: 4 },
          { where: { id: ReferenceID } }
        );
      } else {
        const approvedRequests = await GatePassAuthorizationRequest.findAll({
          where: { ReferenceID, authstatus: 1 },
        });

        if (approvedRequests.length + 1 >= 1) {
          await EmployeeGatepass.update(
            { authorizationStatus: 3 },
            { where: { id: ReferenceID } }
          );
        }
      }
    } else if (authorizationCriteria.AuthorizationCriteria === 'Any Two') {
      if (authstatus === 0) {
        await EmployeeGatepass.update(
          { authorizationStatus: 4 },
          { where: { id: ReferenceID } }
        );
      } else {
        const approvedRequests = await GatePassAuthorizationRequest.findAll({
          where: { ReferenceID, authstatus: 1 },
        });

        if (approvedRequests.length + 1 >= 2) {
          await EmployeeGatepass.update(
            { authorizationStatus: 3 },
            { where: { id: ReferenceID } }
          );
        }
      }
    } else {
      if (authstatus === 0) {
        await EmployeeGatepass.update(
          { authorizationStatus: 4 },
          { where: { id: ReferenceID } }
        );
      } else {
        const approvedRequests = await GatePassAuthorizationRequest.findAll({
          where: { ReferenceID, authstatus: 1 },
        });

        if (approvedRequests.length + 1 >= 3) {
          await EmployeeGatepass.update(
            { authorizationStatus: 3 },
            { where: { id: ReferenceID } }
          );
        }
      }
    }

    await GatePassAuthorizationRequest.update(
      { authstatus, remarks, updateBy: userMasterID },
      { where: { AuthorizationRequestId } }
    );

    return res.status(200).json({
      status: 200,
      message:
        authstatus === 1
          ? 'GatePass Authorization Request Accept Successfully'
          : 'GatePass Authorization Request Reject Successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.viewAuthorizationRequestByUserIdForGatePass = async (
  req,
  res,
  next
) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$employeeGatepass.status$': 'Pending',
    };

    if (status) {
      condition.authstatus = status;
      if (status == 2) {
        condition['$employeeGatepass.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
      }
    }

    if (user && user.length > 0) {
      condition['$employeeGatepass.userMasterId$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$employeeGatepass.date$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const GatePassAuthorizationRequests =
      await GatePassAuthorizationRequest.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: EmployeeGatepass,
            as: 'employeeGatepass',
            include: [
              {
                model: UserMaster,
                as: 'employee',
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
                    separate: true,
                    required: false,
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
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: GatePassAuthorizationRequests.rows,
      totalcount: GatePassAuthorizationRequests.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAuthorizationRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const authorizationRequest = await EmployeeGatepass.findOne({
      where: { id },
      include: [
        {
          model: UserMaster,
          as: 'employee',
          attributes: userAttributes,
          include: [
            {
              required: false,
              model: AuthorizationDetails,
              as: 'authorizationDetails',
              where: {
                status: 1,
                AuthorizationMasterID:
                  authorizationMasterTypes.employeeGatePass,
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
              separate: true,
              required: false,
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
      ],
    });

    const {
      description,
      date,
      fromTime,
      toTime,
      authorizationStatus,
      userMasterId,
      employee,
    } = authorizationRequest;

    const { displayName, authorizationDetails } = employee;
    const authCriteriaID =
      authorizationDetails && authorizationDetails.length > 0
        ? authorizationDetails[0].AuthorizationCriteriaID
        : null;

    const authCriteria = await AuthorizationCriteria.findOne({
      where: { AuthorizationCriteriaID: authCriteriaID },
      attributes: ['AuthorizationCriteria'],
    });

    const authUserStatuses = await GatePassAuthorizationRequest.findAll({
      where: { ReferenceID: id },
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
      displayName: userMap.get(status.userMasterID) || null,
      authstatus: status.authstatus,
      remarks: status.remarks,
      updatedAt: status.updatedAt,
    }));

    const dateStr = authorizationRequest.date;
    const [year, month, day] = dateStr.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const responseData = {
      description,
      date: formattedDate,
      fromTime,
      toTime,
      authorizationStatus,
      userMasterId,
      displayName,
      AuthorizationCriteria: authCriteria
        ? authCriteria.AuthorizationCriteria
        : '',
      authUserStatus:
        authUserStatusData && authUserStatusData.length > 0
          ? authUserStatusData
          : [],
      employeeCode:
        authorizationRequest.employee?.employeeJoiningDetails[0]
          ?.employeeCode || '',
      branch:
        authorizationRequest.employee?.employeeBranches?.[0]?.branchMaster
          ?.branchName || '',
      department:
        authorizationRequest.employee?.employeeDepartments?.[0]?.department
          ?.departmentName || '',
      designation:
        authorizationRequest.employee?.employeeDesignations?.[0]?.designation
          ?.designationName || '',
      division:
        authorizationRequest.employee?.employeeDivisions?.[0]?.division
          ?.divisionName || null,
      workingArea:
        authorizationRequest.employee?.employeeWorkingAreas?.[0]?.workingArea
          ?.workingAreaName || null,
      createdAt: authorizationRequest.createdAt,
      userNumber: authorizationRequest.employee?.userNumber,
    };

    return res.status(200).json({ status: 200, data: responseData });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.GatePassAuthorizeduser = async (req, res, next) => {
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
          AuthorizationMasterID: authorizationMasterTypes.employeeGatePass,
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
          AuthorizationMasterID: authorizationMasterTypes.leave,
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
