const ExtraDays = require('../models/extraDays');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const { Sequelize } = require('sequelize');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const {
  asiaKolkataDateTime,
  sendNotification,
} = require("../utils/commonUtilFunctions");
const ExtraDaysAuthorization = require("../models/extraDaysAuthorization");
const FormAuthorizationDetails = require("../models/AuthorizationDetails");
const AuthorizationCriteriaMaster = require("../models/authorizationCriteriaMaster");
const UserInbox = require("../models/UserInbox");
const moment = require("moment");
const { generateExcelForExtraDays } = require("../utils/exportData");
const AuthorizationDetails = require("../models/AuthorizationDetails");
const { authorizationMasterTypes } = require("../utils/dbUtils");

exports.addExtraDays = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userMasterID, date, days, remarks } = req.body;

    const authorizationdetails = await FormAuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.compensatoryOff, // Compensatory Off
        userMasterID,
        status: 1,
      },
      include: [
        {
          model: AuthorizationCriteriaMaster,
          attributes: ['AuthorizationCriteria'],
        },
      ],
    });

    const authorizationStatus =
      authorizationdetails && authorizationdetails.AuthorizationCriteriaMaster
        ? authorizationdetails.AuthorizationCriteriaMaster
            .AuthorizationCriteria == 'Sequeance No'
          ? 2
          : 1
        : 0;

    const existData = await ExtraDays.findOne({
      where: { userMasterID, date },
    });

    if (existData) {
      await transaction.rollback();
      return res.status(400).json({
        status: 400,
        message: message.usermessage.alreadyExists(
          'Extra Days request with this date'
        ),
      });
    }

    const requestData = await ExtraDays.create(
      {
        userMasterID,
        date,
        days,
        remarks,
      },
      {
        transaction,
        user: req.userDetails,
      }
    );

    if (authorizationStatus != 0) {
      const userDetails = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID,
        },
      });

      if (!userDetails) throw new Error('User not found!');

      if (requestData && authorizationStatus == 2) {
        const authorizationData = await ExtraDaysAuthorization.create(
          {
            extraDaysID: requestData.extraDaysID,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
          },
          {
            user: req.userDetails,
            transaction,
          }
        );

        await UserInbox.create(
          {
            activityTable: ExtraDaysAuthorization.getTableName(),
            activityTablePK:
              authorizationData.toJSON().extraDaysAuthorizationID,
            message: `${
              userDetails.displayName
            } has requested a Extra days for ${moment(date).format(
              'DD/MM/YYYY'
            )}.`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          },
          { user: req.userDetails, transaction }
        );

        const notification = {
          title: 'Extra Days',
          body: userDetails.displayName + ' requested for a Extra Days.',
        };

        const data = {
          screen: 'extradaysauth',
          isScheduled: 'true',
          scheduledTime: new Date().toISOString(),
        };

        await sendNotification(
          authorizationData.userMasterID,
          notification,
          data
        );
      } else {
        for (
          let j = 0;
          j < authorizationdetails.AuthorizedByUserMasterId.length;
          j++
        ) {
          const authorizationData = await ExtraDaysAuthorization.create(
            {
              extraDaysID: requestData.extraDaysID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
            },
            { user: req.userDetails, transaction }
          );

          // Create UserInbox
          await UserInbox.create(
            {
              activityTable: ExtraDaysAuthorization.getTableName(),
              activityTablePK:
                authorizationData.toJSON().extraDaysAuthorizationID,
              message: `${
                userDetails.displayName
              } has requested a Extra Days for ${moment(date).format(
                'DD/MM/YYYY'
              )}.`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
              assignedBy: userMasterID,
            },
            { user: req.userDetails, transaction }
          );

          const notification = {
            title: 'Extra Day',
            body: userDetails.displayName + ' requested for a Extra Days.',
          };
          const data = {
            screen: 'extradaysauth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          // send Notification
          await sendNotification(
            authorizationData.userMasterID,
            notification,
            data
          );
        }
      }
    }

    await transaction.commit();
    return res.status(200).json({
      message: message.usermessage.addMessage('Extra Days'),
      status: 200,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.getAllExtraDays = async (req, res, next) => {
  try {
    const {
      userMasterID,
      fromDate,
      toDate,
      page,
      limit,
      authorizationStatus,
      exportData,
      companyMasterID,
    } = req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = {};
    const condition = {};

    if (!exportData && page && limit) {
      paginationQuery.limit = limit;
      paginationQuery.offset = (page - 1) * limit;
    }

    if (userMasterID?.length > 0) {
      condition.userMasterID = userMasterID;
    }

    if (fromDate && toDate)
      condition.date = {
        [Sequelize.Op.between]: [new Date(fromDate), new Date(toDate)],
      };

    if (authorizationStatus) {
      condition.authorizationStatus = authorizationStatus;
    }

    const includeModals = [
      {
        model: companyMaster,
        attributes: ['companyMasterID', 'companyName'],
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
    ];

    if (exportData) {
      includeModals.push({
        separate: true,
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
            model: AuthorizationCriteriaMaster,
            as: 'AuthorizationCriteriaMaster',
            attributes: ['AuthorizationCriteria'],
          },
          {
            model: UserMaster,
            attributes: ['displayName'],
          },
        ],
      });
    }
    const userCondition = {};
    if (companyMasterID) {
      userCondition.companyMasterId = companyMasterID;
    }
    const { rows, count } = await ExtraDays.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          where: userCondition,
          attributes: [
            'userMasterID',
            'userNumber',
            'displayName',
            'companyMasterId',
          ],
          include: includeModals,
        },
        {
          model: UserMaster,
          as: 'createByUser',
          attributes: ['displayName'],
        },
        {
          model: UserMaster,
          as: 'updateByUser',
          attributes: ['displayName'],
        },
        {
          model: ExtraDaysAuthorization,
          attributes: ['userMasterID', 'authStatus', 'extraDaysID'],
          include: [
            {
              model: UserMaster,
              attributes: ['displayName'],
            },
          ],
        },
      ],
    });

    const data = [];

    rows.map((x) => {
      const {
        authorizationStatus,
        userMaster,
        createByUser,
        date,
        days,
        remarks,
        cancelRemarks,
      } = x;

      const row = {
        employeeCode: userMaster?.employeeJoiningDetails[0].employeeCode,
        displayName: userMaster.displayName,
        userNumber: userMaster.userNumber,
        branchName: userMaster?.employeeBranches[0]?.branchMaster?.branchName,
        departmentName:
          userMaster?.employeeDepartments[0]?.department?.departmentName,
        designationName:
          userMaster?.employeeDesignations[0]?.designation?.designationName,
        days: days,
        remarks: remarks,
        cancelRemarks: cancelRemarks,
        date: moment(date, 'YYYY-MM-DD').format('DD-MM-YYYY'),
        status:
          authorizationStatus === 3
            ? 'Accepted'
            : authorizationStatus === 4
              ? 'Rejected'
              : authorizationStatus === 5
                ? 'Cancelled'
                : 'Pending',
        createBy: createByUser.displayName,
      };
      userMaster?.authorizationDetails?.map((a) => {
        row.AuthorizationCriteria =
          a.AuthorizationCriteriaMaster.AuthorizationCriteria;
      });

      let groupedData = x.extraDaysAuthorizations.reduce((acc, item) => {
        if (!acc[item.extraDaysID]) {
          acc[item.extraDaysID] = [];
        }
        acc[item.extraDaysID].push(item);
        return acc;
      }, {});

      groupedData = Object.values(groupedData);

      groupedData.map((data) => {
        let authorization = '';
        data.map((i) => {
          const authStatus =
            i.authStatus == 1
              ? 'Accepted'
              : i.authStatus == 0
                ? 'Rejected'
                : 'Pending';
          authorization += i.userMaster.displayName + '-' + authStatus + ',';
        });
        row.Authorization = authorization;
      });
      data.push(row);
    });

    if (exportData) {
      return await generateExcelForExtraDays(data, 'Extra Days', 'xlsx', res);
    }

    res.status(200).json({
      data: rows,
      status: 200,
      totalCount: count,
    });
  } catch (error) {
    next(error);
  }
};
