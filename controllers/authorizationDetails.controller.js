const Sequelize = require('sequelize');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const authMasters = require('../models/authorizationMaster');
const UserMaster = require('../models/userMaster');
const UserExpense = require('../models/userExpense');
const ExpenseAuthorizationRequest = require('../models/expenseAuthorization');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const { executeQuery } = require('./common.controller');
const EmployeeBranch = require('../models/employeeBranch');
const UserLeave = require('../models/userleave');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const OvertimeCalculation = require('../models/overTimeCalculation');
const OvertimeAuthorization = require('../models/overtimeAuthorization');
const LeaveAuthorizationRequest = require('../models/leaveAuthorization');
const overTimeCalculation = require('../models/overTimeCalculation');
const overtimeAuthorizationRequest = require('../models/overtimeAuthorization');
const UserResignation = require('../models/resignation');
const ResignationAuth = require('../models/resignationAuthorization');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const AttendanceCorrectionRequest = require('../models/attendanceCorrectionRequest');
const AttendanceCorrectionAuthorization = require('../models/attendanceCorrectionAuthorization');
const {
  sendNotification,
  asiaKolkataDateTime,
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
  accessibleUsers,
  destroyLeaveAuthAndApprovedLeaveAuth,
} = require('../utils/commonUtilFunctions');
const UserInbox = require('../models/UserInbox');

const moment = require('moment');
const { generateExcel } = require('../utils/exportData');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const companyMaster = require('../models/companyMaster');

const GatePassAuthorizationRequest = require('../models/gatePassAuthorization');
const EmployeeGatepass = require('../models/employeeGatepass');
const coffMaster = require('../models/coffMaster');
const CompensatoryOffAuthorization = require('../models/compensatoryOffAuthorization');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const UserShortLeave = require('../models/userShortLeave');
const ShortLeaveAuthorization = require('../models/shortLeaveAuthorization');
const ExtraDays = require('../models/extraDays');
const ExtraDaysAuthorization = require('../models/extraDaysAuthorization');
const { authorizationMasterTypes } = require('../utils/dbUtils');

exports.postAddAuthorizationDetails = async (req, res, next) => {
  try {
    let {
      AuthorizationMasterID,
      AuthorizedByUserMasterId,
      AuthorizationCriteriaID,
      SerialNo,
      FromAmount,
      ToAmount,
      SequenceNo,
      RequiredAuthorizationMessage,
      companyMasterID,
      userMasterID,
      createBy,
      createByIp,
    } = await req.body;

    let allShortLeave = [];
    if (AuthorizationMasterID == authorizationMasterTypes.leave) {
      // Short Leave

      allShortLeave = await UserShortLeave.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userMasterID,
          },
          authorizationStatus: 0,
        },
        include: [
          { model: UserMaster, attributes: ['userMasterID', 'displayName'] },
        ],
      });
    }

    for (let i = 0; i < userMasterID.length; i++) {
      await sequelize.transaction(async (t) => {
        let get_all_data = await AuthorizationDetails.findOne({
          where: {
            userMasterID: userMasterID[i],
            AuthorizationMasterID: +AuthorizationMasterID,
            status: ['0', '1'],
          },
        });

        if (get_all_data) {
        } else {
          const insert_db_status = await AuthorizationDetails.create(
            {
              AuthorizationMasterID,
              AuthorizedByUserMasterId,
              AuthorizationCriteriaID,
              userMasterID: userMasterID[i],
              SerialNo,
              FromAmount,
              ToAmount,
              SequenceNo,
              RequiredAuthorizationMessage,
              companyMasterID,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          //for leave

          if (+AuthorizationMasterID == +authorizationMasterTypes.leave) {
            let findLeave = await UserLeave.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationStatus: 0,
                status: 1,
              },
              include: [
                {
                  required: true,
                  model: HrLeaveTypes,
                  attributes: ['LeaveID'],
                },
              ],
            });

            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            for (let j = 0; j < findLeave.length; j++) {
              const type =
                findLeave[j].hrLeaveType.LeaveID == 25
                  ? 'Outdoor Duty'
                  : 'Leave';
              const tableName =
                findLeave[j].hrLeaveType.LeaveID == 25
                  ? 'outdoorDutyAuthorizations'
                  : 'leaveAuthorizations';

              let updatedata = await UserLeave.update(
                {
                  authorizationStatus: authorizationStatus,
                  updateBy: req.body.createBy,
                  updateByIp: req.body.createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: findLeave[j].UserLeaveApplicationID,
                  },
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              const notification = {
                title: type,
                body: userinfo.displayName + ` requested for ${type} .`,
              };
              const data = {
                screen:
                  type == 'Outdoor Duty' ? 'outDoorDutyAuth' : 'leaveauth',
              };

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization = await LeaveAuthorizationRequest.findAll(
                  {
                    where: {
                      ReferenceID: findLeave[j].UserLeaveApplicationID,
                      status: 1,
                    },
                  }
                );

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: tableName,
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  await destroyLeaveAuthAndApprovedLeaveAuth(
                    +findLeave[j].UserLeaveApplicationID,
                    t
                  );

                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,

                        createByIp: findLeave[j].createByIp,
                      },

                      {
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable: tableName,
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for ${type} request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );
                } else {
                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,

                        createByIp: findLeave[j].createByIp,
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable: tableName,
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for ${type} request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );
                }

                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                let findAuthorization = await LeaveAuthorizationRequest.findAll(
                  {
                    where: {
                      ReferenceID: findLeave[j].UserLeaveApplicationID,
                      status: 1,
                    },
                  }
                );

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: tableName,
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  await destroyLeaveAuthAndApprovedLeaveAuth(
                    +findLeave[j].UserLeaveApplicationID,
                    t
                  );
                }

                for (
                  let k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: findLeave[j].UserLeaveApplicationID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: findLeave[j].createBy,
                        createByIp: findLeave[j].createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable: tableName,
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for ${type} request from ${moment(
                        findLeave[j].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        findLeave[j].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findLeave[j].userMasterID,
                    },
                    { transaction: t }
                  );

                  sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }

            // ----------------------------- Short Leave -------------------------

            const userShortLeave = allShortLeave.filter(
              (e) => e.userMasterID == userMasterID[i]
            );
            // If Short Leave is available
            if (userShortLeave.length) {
              const userDetails = userShortLeave[0].userMaster;

              if (!userDetails) throw new Error('User not found!');

              const notification = {
                title: 'Short Leave',
                body: userDetails.displayName + ' requested for a Short Leave.',
              };
              const data = {
                screen: 'shortLeaveAuth',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              const userShortLeaveIds = userShortLeave.map(
                (e) => e.userShortLeaveId
              );

              const authorizationRequest =
                await ShortLeaveAuthorization.findAll({
                  where: {
                    referenceId: userShortLeaveIds,
                  },
                  transaction: t,
                });

              let AuthorizationRequestIds = authorizationRequest.map(
                (form) => form.id
              );

              // Delete All User Inbox

              await UserInbox.destroy({
                where: {
                  activityTable: ShortLeaveAuthorization.getTableName(),
                  activityTablePK: AuthorizationRequestIds,
                },
                transaction: t,
              });

              // Delete All User Short Leave Authorization

              await ShortLeaveAuthorization.destroy({
                where: {
                  id: {
                    [Sequelize.Op.in]: AuthorizationRequestIds,
                  },
                },
                hooks: false,
                transaction: t,
              });

              // update User Short Leave

              await UserShortLeave.update(
                {
                  authorizationStatus,
                },
                {
                  where: {
                    userShortLeaveId: {
                      [Sequelize.Op.in]: userShortLeave.map(
                        (e) => e.userShortLeaveId
                      ),
                    },
                  },
                  individualHooks: true,
                  user: req.userDetails,
                  transaction: t,
                }
              );

              const inboxData = [];

              for (const shortLeave of userShortLeave) {
                const userShortLeaveId = shortLeave.userShortLeaveId;
                const userMasterID = shortLeave.userMasterID;

                // For Sequence No
                if (authorizationStatus == 2) {
                  const authorizationData =
                    await ShortLeaveAuthorization.create(
                      {
                        referenceId: userShortLeaveId,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        authstatus: 2,
                      },
                      { user: req.userDetails, transaction: t }
                    );

                  // Push Userinbox Data

                  inboxData.push({
                    activityTable: ShortLeaveAuthorization.getTableName(),
                    activityTablePK: authorizationData.toJSON().id,
                    message: `${
                      userDetails.displayName
                    } has requested a Short Leave for ${moment(
                      shortLeave.date
                    ).format('DD/MM/YYYY')}.`,
                    assignedTo: insert_db_status.AuthorizedByUserMasterId[0],
                    assignedBy: userMasterID,
                  });

                  // send Notification
                  sendNotification(
                    authorizationData.userMasterID,
                    notification,
                    data
                  );
                } else {
                  // For Any
                  for (
                    let j = 0;
                    j < insert_db_status.AuthorizedByUserMasterId.length;
                    j++
                  ) {
                    const authorizationData =
                      await ShortLeaveAuthorization.create(
                        {
                          referenceId: userShortLeaveId,
                          userMasterID:
                            insert_db_status.AuthorizedByUserMasterId[j],
                          authstatus: 2,
                        },
                        { user: req.userDetails, transaction: t }
                      );

                    // Push Userinbox Data
                    inboxData.push({
                      activityTable: ShortLeaveAuthorization.getTableName(),
                      activityTablePK: authorizationData.toJSON().id,
                      message: `${
                        userDetails.displayName
                      } has requested a Short Leave for ${moment(
                        shortLeave.date
                      ).format('DD/MM/YYYY')}.`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[j],
                      assignedBy: userMasterID,
                    });

                    // send Notification
                    sendNotification(
                      authorizationData.userMasterID,
                      notification,
                      data
                    );
                  }
                }
              }

              // create userInbox data in bulk

              await UserInbox.bulkCreate(inboxData, { transaction: t });
            }
          }

          //for expense
          else if (
            +AuthorizationMasterID == +authorizationMasterTypes.expense
          ) {
            let expensedata = await executeQuery(
              `select ut."userExpenseTransactionID",ut."userExpenseID",ut."authorizationStatus",ue."userMasterID" from "userExpenseTransactions" as ut join "userExpenses" as ue on ut."userExpenseID"=ue."userExpenseID" where ue."userMasterID" =` +
                userMasterID[i] +
                ` and ut."authorizationStatus" IN (0)`
            );

            if (expensedata.length > 0) {
              for (let n = 0; n < expensedata.length; n++) {
                let findAuthorization =
                  await ExpenseAuthorizationRequest.findAll({
                    where: {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                      status: 1,
                    },
                  });

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                await ExpenseAuthorizationRequest.destroy(
                  {
                    where: {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                    },
                  },
                  {
                    transaction: t,
                  }
                );

                const userdata = await UserMaster.findOne({
                  raw: true,
                  where: {
                    userMasterID: expensedata[n].userMasterID,
                  },
                });

                let AuthorizationCriterias =
                  await AuthorizationCriteria.findOne({
                    where: {
                      AuthorizationCriteriaID:
                        insert_db_status.AuthorizationCriteriaID,
                      status: 1,
                    },
                    raw: true,
                  });

                let authorizationStatus;
                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  authorizationStatus = 2;
                } else {
                  authorizationStatus = 1;
                }

                await UserExpenseTransaction.update(
                  {
                    authorizationStatus: authorizationStatus,
                    updateBy: req.body.createBy,
                    AuthorizationCriteriaID,
                  },
                  {
                    where: {
                      userExpenseTransactionID:
                        expensedata[n].userExpenseTransactionID,
                    },
                    transaction: t,
                  }
                );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let insert_db_status1 =
                    await ExpenseAuthorizationRequest.create(
                      {
                        ReferenceID: expensedata[n].userExpenseTransactionID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: userMasterID[i],
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[0],
                      assignedBy: userdata.userMasterID,
                    },

                    { transaction: t }
                  );
                } else {
                  for (
                    let k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 =
                      await ExpenseAuthorizationRequest.create(
                        {
                          ReferenceID: expensedata[n].userExpenseTransactionID,
                          userMasterID:
                            insert_db_status.AuthorizedByUserMasterId[k],
                          status: 1,
                          authstatus: 2,
                          createBy: userMasterID[i],
                        },
                        { transaction: t }
                      );

                    await UserInbox.create(
                      {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK:
                          insert_db_status1.toJSON().AuthorizationRequestId,
                        message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                        assignedTo:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        assignedBy: userdata.userMasterID,
                      },

                      { transaction: t }
                    );
                  }
                }
              }
              // }
            }
          }

          //for overtime
          else if (AuthorizationMasterID == authorizationMasterTypes.overtime) {
            let find_Overtime = await OvertimeCalculation.findAll({
              where: {
                UserMasterID: userMasterID[i],
                AuthorizationRequired: 0,
              },
            });

            if (find_Overtime.length > 0) {
              for (let j = 0; j < find_Overtime.length; j++) {
                let AuthorizationCriterias =
                  await AuthorizationCriteria.findOne({
                    where: {
                      AuthorizationCriteriaID: AuthorizationCriteriaID,
                      status: 1,
                    },
                    // raw: true,
                  });

                let authorizationStatus;

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  authorizationStatus = 2;
                } else {
                  authorizationStatus = 1;
                }

                let update_overtimeAuthorizationStatus =
                  await OvertimeCalculation.update(
                    {
                      AuthorizationRequired: authorizationStatus,
                      updateBy: req.body.createBy,
                    },
                    {
                      where: { OverTimeID: find_Overtime[j].OverTimeID },
                      transaction: t,
                    }
                  );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let findAuthorization = await OvertimeAuthorization.findAll({
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await OvertimeAuthorization.destroy(
                      {
                        where: {
                          ReferenceID: find_Overtime[j].OverTimeID,
                          status: 1,
                        },
                      },
                      { transaction: t }
                    );

                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  } else {
                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );
                  }
                } else {
                  let findAuthorization = await OvertimeAuthorization.findAll({
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await OvertimeAuthorization.destroy(
                      {
                        where: {
                          ReferenceID: find_Overtime[j].OverTimeID,
                          status: 1,
                        },
                      },
                      { transaction: t }
                    );
                  }

                  for (
                    let k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 = await OvertimeAuthorization.create(
                      {
                        ReferenceID: find_Overtime[j].OverTimeID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: req.body.createBy,
                        createByIp: req.body.createByIp,
                      },
                      { transaction: t }
                    );
                  }
                }
                // }
              }
            }
          }
          // for resignation
          else if (
            AuthorizationMasterID == authorizationMasterTypes.resignation
          ) {
            let find_Resignation = await UserResignation.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationstatus: 0,
              },
            });

            if (find_Resignation.length > 0) {
              let AuthorizationCriterias = await AuthorizationCriteria.findOne({
                where: {
                  AuthorizationCriteriaID:
                    insert_db_status.AuthorizationCriteriaID,
                  status: 1,
                },
                // raw: true,
              });

              let authorizationStatus;

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                authorizationStatus = 2;
              } else {
                authorizationStatus = 1;
              }

              for (let j = 0; j < find_Resignation.length; j++) {
                let update_resignationAuthorizationStatus =
                  await UserResignation.update(
                    {
                      authorizationstatus: authorizationStatus,
                      updateBy: req.body.createBy,
                    },
                    {
                      where: {
                        resignationID: find_Resignation[j].resignationID,
                      },
                    }
                  );

                if (
                  AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ) {
                  let findAuthorization = await ResignationAuth.findAll({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await ResignationAuth.destroy({
                      where: {
                        ReferenceID: find_Resignation[j].resignationID,
                        status: 1,
                      },
                    });

                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authstatus: 2,
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                    });
                  } else {
                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authstatus: 2,
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                    });
                  }
                } else {
                  let findAuthorization = await ResignationAuth.findAll({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  if (findAuthorization.length > 0) {
                    let delete_record = await ResignationAuth.destroy({
                      where: {
                        ReferenceID: find_Resignation[j].resignationID,
                        status: 1,
                      },
                    });
                  }

                  for (
                    let k = 0;
                    k < insert_db_status.AuthorizedByUserMasterId.length;
                    k++
                  ) {
                    let insert_db_status1 = await ResignationAuth.create({
                      ReferenceID: find_Resignation[j].resignationID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[k],
                      status: 1,
                      authstatus: 2,
                      createBy: req.body.createBy,
                      createByIp: req.body.createByIp,
                    });
                  }
                }
              }

              // }
            }
          } else if (
            AuthorizationMasterID == authorizationMasterTypes.employeeGatePass
          ) {
            let findgatepass = await EmployeeGatepass.findAll({
              where: {
                userMasterId: userMasterID[i],
                authorizationStatus: 0,
                status: 'Pending',
              },
            });

            for (let j = 0; j < findgatepass.length; j++) {
              let AuthorizationCriterias = await AuthorizationCriteria.findOne({
                where: {
                  AuthorizationCriteriaID:
                    insert_db_status.AuthorizationCriteriaID,
                  status: 1,
                },
              });

              let authorizationStatus;

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                authorizationStatus = 2;
              } else {
                authorizationStatus = 1;
              }

              let updatedata = await EmployeeGatepass.update(
                {
                  authorizationStatus: authorizationStatus,
                  updateBy: req.body.createBy,
                  updateByIp: req.body.createByIp,
                },
                {
                  where: {
                    id: findgatepass[j].id,
                  },
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization = await LeaveAuthorizationRequest.findAll(
                  {
                    where: {
                      ReferenceID: findgatepass[j].id,
                      status: 1,
                    },
                  }
                );

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  let delete_record =
                    await GatePassAuthorizationRequest.destroy(
                      {
                        where: {
                          ReferenceID: findgatepass[j].id,
                          status: 1,
                        },
                      },
                      {
                        transaction: t,
                      }
                    );

                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,

                        createByIp: findgatepass[j].createByIp,
                      },

                      {
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for GatePass request ${moment(
                        findgatepass[j].date
                      ).format('DD/MM/YYYY')} `,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );
                } else {
                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[0],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,

                        createByIp: findgatepass[j].createByIp,
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for GatePass request ${moment(
                        findgatepass[j].date
                      ).format('DD/MM/YYYY')} `,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );
                }

                const notification = {
                  title: 'GatePass',
                  body: userinfo.displayName + ' requested for GatePass.',
                };
                const data = {
                  screen: 'gatepassauth',
                };
                await sendNotification(
                  insert_db_status.AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                let findAuthorization =
                  await GatePassAuthorizationRequest.findAll({
                    where: {
                      ReferenceID: findgatepass[j].id,
                      status: 1,
                    },
                  });

                const authorizationIds = findAuthorization.map(
                  (e) => e.AuthorizationRequestId
                );

                await UserInbox.destroy(
                  {
                    where: {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK: {
                        [Sequelize.Op.in]: authorizationIds,
                      },
                    },
                  },
                  { transaction: t }
                );

                if (findAuthorization.length > 0) {
                  let delete_record =
                    await GatePassAuthorizationRequest.destroy(
                      {
                        where: {
                          ReferenceID: findgatepass[j].id,
                          status: 1,
                        },
                      },
                      {
                        transaction: t,
                      }
                    );
                }

                for (
                  let k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 =
                    await GatePassAuthorizationRequest.create(
                      {
                        TableName: 'EmployeeGatePass',
                        ReferenceID: findgatepass[j].id,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authstatus: 2,
                        createBy: findgatepass[j].createBy,
                        createByIp: findgatepass[j].createByIp,
                      },
                      {
                        transaction: t,
                      }
                    );

                  let userinfo = await UserMaster.findOne({
                    where: {
                      userMasterID: findgatepass[j].userMasterId,
                    },
                  });

                  await UserInbox.create(
                    {
                      activityTable:
                        GatePassAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${
                        userinfo.displayName
                      } has applied for GatePass request ${moment(
                        findgatepass[j].date
                      ).format('DD/MM/YYYY')} `,
                      assignedTo: AuthorizedByUserMasterId[0],
                      assignedBy: findgatepass[j].userMasterId,
                    },
                    { transaction: t }
                  );

                  const notification = {
                    title: 'GatePass',
                    body: userinfo.displayName + ' requested for GatePass.',
                  };
                  const data = {
                    screen: 'gatepassauth',
                  };
                  await sendNotification(
                    insert_db_status.AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }
          }

          // For COff
          else if (
            AuthorizationMasterID == authorizationMasterTypes.compensatoryOff
          ) {
            const findcoff = await coffMaster.findAll({
              where: {
                userMasterID: userMasterID[i],
                authorizationStatus: 0,
                status: 1,
              },
            });

            const AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
            });

            const authorizationStatus =
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ? 2
                : 1;

            const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

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

            const userinfo = await UserMaster.findOne({
              where: {
                userMasterID: insert_db_status.userMasterID,
              },
              transaction: t,
            });

            const findAllAuthorization =
              await CompensatoryOffAuthorization.findAll({
                where: {
                  coffMasterID: {
                    [Sequelize.Op.in]: AllCoffMasterIDs,
                  },
                  status: 1,
                },
              });

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

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                const insert_db_status1 =
                  await CompensatoryOffAuthorization.create(
                    {
                      TableName: 'coffMaster',
                      coffMasterID: findcoff[j].coffMasterID,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
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
                    assignedTo: AuthorizedByUserMasterId[0],
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
                  let insert_db_status1 =
                    await CompensatoryOffAuthorization.create(
                      {
                        TableName: 'coffMaster',
                        coffMasterID: findcoff[j].coffMasterID,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
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
                      activityTable:
                        CompensatoryOffAuthorization.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON()
                          .CompensatoryOffAuthorizationID,
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

          // for Attendance Correction
          else if (
            AuthorizationMasterID ==
            authorizationMasterTypes.attendanceCorrection
          ) {
            const findAttendanceCorrection =
              await AttendanceCorrectionRequest.findAll({
                where: {
                  userMasterID: userMasterID[i],
                  authorizationStatus: 0,
                  status: 1,
                },
              });

            const allAttendanceIDs = findAttendanceCorrection.map(
              (e) => e.attendanceCorrectionRequestId
            );

            const AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  insert_db_status.AuthorizationCriteriaID,
                status: 1,
              },
            });

            const authorizationStatus =
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
                ? 2
                : 1;

            await AttendanceCorrectionRequest.update(
              {
                authorizationStatus: authorizationStatus,
                updateBy: req.body.updateBy,
                updateByIp: req.body.updateByIp,
              },
              {
                where: {
                  attendanceCorrectionRequestId: {
                    [Sequelize.Op.in]: allAttendanceIDs,
                  },
                },
                user: req.userDetails,
                individualHooks: true,
                transaction: t,
              }
            );

            const userinfo = await UserMaster.findOne({
              where: {
                userMasterID: insert_db_status.userMasterID,
              },
              transaction: t,
            });

            const findAllAuthorization =
              await AttendanceCorrectionAuthorization.findAll({
                where: {
                  attendanceCorrectionRequestId: {
                    [Sequelize.Op.in]: allAttendanceIDs,
                  },
                  status: 1,
                },
              });

            for (let j = 0; j < findAttendanceCorrection.length; j++) {
              const authorizationIds = findAllAuthorization
                .filter(
                  (e) =>
                    e.attendanceCorrectionRequestId ==
                    findAttendanceCorrection[j].attendanceCorrectionRequestId
                )
                .map((a) => a.id);

              // Delete All UserInbox
              await UserInbox.destroy(
                {
                  where: {
                    activityTable:
                      AttendanceCorrectionAuthorization.getTableName(),
                    activityTablePK: {
                      [Sequelize.Op.in]: authorizationIds,
                    },
                  },
                },
                { transaction: t }
              );

              // Delete All Auth Data
              if (authorizationIds.length > 0) {
                await AttendanceCorrectionAuthorization.destroy(
                  {
                    where: {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      status: 1,
                    },
                  },
                  {
                    Hooks: false,
                    transaction: t,
                  }
                );
              }

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                const insert_db_status1 =
                  await AttendanceCorrectionAuthorization.create(
                    {
                      attendanceCorrectionRequestId:
                        findAttendanceCorrection[j]
                          .attendanceCorrectionRequestId,
                      userMasterID:
                        insert_db_status.AuthorizedByUserMasterId[0],
                      status: 1,
                      authStatus: 2,
                    },
                    {
                      user: req.userDetails,
                      // individualHooks: true,
                      transaction: t,
                    }
                  );

                await UserInbox.create(
                  {
                    activityTable:
                      AttendanceCorrectionAuthorization.getTableName(),
                    activityTablePK: insert_db_status1.toJSON().id,
                    message: `${
                      userinfo.displayName
                    } has requested an attendance correction for ${moment(
                      findAttendanceCorrection[j].AttendanceDate
                    ).format('DD/MM/YYYY')}.`,
                    assignedTo: AuthorizedByUserMasterId[0],
                    assignedBy: findAttendanceCorrection[j].userMasterID,
                  },
                  { transaction: t }
                );

                const notification = {
                  title: 'Attendance Correction',
                  body:
                    userinfo.displayName +
                    ' requested for an attendance correction.',
                };
                const data = {
                  screen: 'attendanceCorrectionauth',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };
                await sendNotification(
                  AuthorizedByUserMasterId[0],
                  notification,
                  data
                );
              } else {
                for (
                  let k = 0;
                  k < insert_db_status.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  const insert_db_status1 =
                    await AttendanceCorrectionAuthorization.create(
                      {
                        attendanceCorrectionRequestId:
                          findAttendanceCorrection[j]
                            .attendanceCorrectionRequestId,
                        userMasterID:
                          insert_db_status.AuthorizedByUserMasterId[k],
                        status: 1,
                        authStatus: 2,
                      },
                      {
                        user: req.userDetails,
                        // individualHooks: true,
                        transaction: t,
                      }
                    );

                  await UserInbox.create(
                    {
                      activityTable:
                        AttendanceCorrectionAuthorization.getTableName(),
                      activityTablePK: insert_db_status1.toJSON().id,
                      message: `${
                        userinfo.displayName
                      } has requested an attendance correction for ${moment(
                        findAttendanceCorrection[j].AttendanceDate
                      ).format('DD/MM/YYYY')}.`,
                      assignedTo: insert_db_status.AuthorizedByUserMasterId[k],
                      assignedBy: findAttendanceCorrection[j].userMasterID,
                    },
                    { transaction: t }
                  );

                  const notification = {
                    title: 'Attendance Correction',
                    body:
                      userinfo.displayName +
                      ' requested for an attendance correction.',
                  };
                  const data = {
                    screen: 'attendanceCorrectionauth',
                    isScheduled: 'true',
                    scheduledTime: new Date().toISOString(),
                  };

                  await sendNotification(
                    AuthorizedByUserMasterId[k],
                    notification,
                    data
                  );
                }
              }
            }
          }
        }
      });
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Authorization'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuthorizationDetails = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      limit,
      page,
      userMasterID,
      AuthorizationMasterID,
      exportData,
    } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    condition.status = 1;
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterID = companyMasterID;
    }
    if (userMasterID) condition.userMasterID = userMasterID;
    if (AuthorizationMasterID)
      condition.AuthorizationMasterID = AuthorizationMasterID;

    const Auth_master = await AuthorizationDetails.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['AuthorizationDetailsId', 'ASC']],
      include: [
        {
          model: UserMaster,
          where: { status: 1 },
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails, false, false),
          include: [
            { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
          ],
        },
        { model: AuthorizationCriteria },
        { model: companyMasters, attributes: companyAttributes },
        { model: authMasters },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    for (let j = 0; j < Auth_master.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: Auth_master.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: Auth_master.rows[j].updateBy,
        },
      });

      if (user1) {
        Auth_master.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        Auth_master.rows[j].updateBy = user2.dataValues.displayName;
      }
      let authPerson = [];

      for (
        let k = 0;
        k < Auth_master.rows[j].AuthorizedByUserMasterId.length;
        k++
      ) {
        let user3 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master.rows[j].AuthorizedByUserMasterId[k],
          },
        });
        authPerson.push(user3.displayName);
      }

      Auth_master.rows[j].dataValues.AuthorizedPersonName =
        authPerson.join(',');
    }

    if (exportData) {
      async function fetchEmployeeDetails(Auth_master) {
        const finalData = await Promise.all(
          Auth_master.map(async (auth) => {
            const userMasterID = auth.userMaster.userMasterID;
            const [branch, department, designation] = await Promise.all([
              employeeBranch(userMasterID, new Date()),
              employeeDepartment(userMasterID, new Date()),
              employeeDesignation(userMasterID, new Date()),
            ]);

            return {
              ['EmployeeCode']: auth.userMaster.employeeJoiningDetails[0]
                ? auth.userMaster.employeeJoiningDetails[0].dataValues
                    .employeeCode
                : '',
              UserName: auth.userMaster.displayName,
              AuthorizationCriteria: auth.AuthorizationCriteriaMaster
                ? auth.AuthorizationCriteriaMaster.AuthorizationCriteria
                : '',
              AuthorizationName:
                auth.authorizationMaster.authorizationMasterName || '',
              AuthorizedPersonName: auth.dataValues.AuthorizedPersonName
                ? auth.dataValues.AuthorizedPersonName
                : '',
              CompanyName: auth.companyMaster.companyName,
              BranchName: branch ? branch['branchMaster.branchName'] : '',
              Department: department
                ? department['department.departmentName']
                : '',
              Designation: designation
                ? designation['designation.designationName']
                : '',
              CreatedAt: auth.createdAt
                ? asiaKolkataDateTime(auth.createdAt)
                : '',
            };
          })
        );

        return finalData;
      }

      const finalData = await fetchEmployeeDetails(Auth_master.rows);
      await generateExcel(finalData, 'Authorization', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: Auth_master.rows,
      totalcount: Auth_master.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with bankMaster id
 *
 * @param {id} AuthorizationCriteriaID  to fetch bank name
 */

exports.getAuthorizationDetailsById = async (req, res, next) => {
  try {
    let get_one_data = await AuthorizationDetails.findOne({
      where: {
        AuthorizationDetailsId: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        { model: authMasters },
        { model: AuthorizationCriteriaMaster },
        { model: companyMaster },
        { model: UserMaster },
      ],
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      get_one_data = get_one_data.toJSON();
      get_one_data.authorizedCompany = [];

      for (let item of get_one_data.AuthorizedByUserMasterId) {
        const getCompany = await UserMaster.findOne({
          where: { userMasterID: item },
          attributes: ['companyMasterId'],
        });
        get_one_data.authorizedCompany.push(+getCompany.companyMasterId);
      }

      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

exports.postUpdateAuthorizationDetails = async (req, res, next) => {
  try {
    let {
      AuthorizationDetailsId,
      AuthorizationMasterID,
      AuthorizedByUserMasterId,
      AuthorizationCriteriaID,
      SerialNo,
      FromAmount,
      ToAmount,
      SequenceNo,
      RequiredAuthorizationMessage,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let change_data_status;

    await sequelize.transaction(async (t) => {
      change_data_status = await AuthorizationDetails.update(
        {
          AuthorizationMasterID,
          AuthorizedByUserMasterId,
          AuthorizationCriteriaID,
          SerialNo,
          FromAmount,
          ToAmount,
          SequenceNo,
          RequiredAuthorizationMessage,
          companyMasterID,
          updateBy: req.body.createBy,
          updateByIp: req.body.createByIp,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );

      const authorizationdetails1 = await AuthorizationDetails.findOne({
        where: {
          // userMasterID: userMasterID[i],
          AuthorizationDetailsId: AuthorizationDetailsId,
          // AuthorizationMasterID,
          status: 1,
        },
      });

      //for leave

      if (AuthorizationMasterID == authorizationMasterTypes.leave) {
        let findLeave = await UserLeave.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
          include: [
            { required: true, model: HrLeaveTypes, attributes: ['LeaveID'] },
          ],
        });

        let AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID: AuthorizationCriteriaID,
            status: 1,
          },
        });

        let authorizationStatus;

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          authorizationStatus = 2;
        } else {
          authorizationStatus = 1;
        }

        for (let j = 0; j < findLeave.length; j++) {
          const type =
            findLeave[j].hrLeaveType.LeaveID == 25 ? 'Outdoor Duty' : 'Leave';
          const tableName =
            findLeave[j].hrLeaveType.LeaveID == 25
              ? 'outdoorDutyAuthorizations'
              : 'leaveAuthorizations';

          let updatedata = await UserLeave.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: req.body.updateBy,
              updateByIp: req.body.updateByIp,
            },
            {
              where: {
                UserLeaveApplicationID: findLeave[j].UserLeaveApplicationID,
              },
              transaction: t,
            }
          );

          let userinfo = await UserMaster.findOne({
            where: {
              // userMasterID:response[i].createBy
              userMasterID: findLeave[j].userMasterID,
            },
          });

          const notification = {
            title: type,
            body: userinfo.displayName + ` requested for ${type} .`,
          };
          const data = {
            screen: type == 'Outdoor Duty' ? 'outDoorDutyAuth' : 'leaveauth',
          };

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: tableName,
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              await destroyLeaveAuthAndApprovedLeaveAuth(
                +findLeave[j].UserLeaveApplicationID,
                t
              );

              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,

                  createByIp: findLeave[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              await UserInbox.create(
                {
                  activityTable: tableName,
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for ${type} request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,

                  createByIp: findLeave[j].createByIp,
                },
                { transaction: t }
              );

              await UserInbox.create(
                {
                  activityTable: tableName,
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for ${type} request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );
            }

            sendNotification(AuthorizedByUserMasterId[0], notification, data);
          } else {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: tableName,
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              await destroyLeaveAuthAndApprovedLeaveAuth(
                +findLeave[j].UserLeaveApplicationID,
                t
              );
            }

            for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,
                  createByIp: findLeave[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              await UserInbox.create(
                {
                  activityTable: tableName,
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for ${type} request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction: t }
              );

              sendNotification(AuthorizedByUserMasterId[k], notification, data);
            }
          }
          // }
        }

        // ----------------------- Short Leave ------------------------------------------

        const userShortLeave = await UserShortLeave.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: [1, 2],
          },
          include: [
            { model: UserMaster, attributes: ['userMasterID', 'displayName'] },
          ],
        });
        // If Short Leave is available
        if (userShortLeave.length) {
          const userDetails = userShortLeave[0].userMaster;

          if (!userDetails) throw new Error('User not found!');

          const notification = {
            title: 'Short Leave',
            body: userDetails.displayName + ' requested for a Short Leave.',
          };
          const data = {
            screen: 'shortLeaveAuth',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };

          const userShortLeaveIds = userShortLeave.map(
            (e) => e.userShortLeaveId
          );

          const authorizationRequest = await ShortLeaveAuthorization.findAll({
            where: {
              referenceId: userShortLeaveIds,
            },
            transaction: t,
          });

          let AuthorizationRequestIds = authorizationRequest.map(
            (form) => form.id
          );

          // Delete All User Inbox

          await UserInbox.destroy({
            where: {
              activityTable: ShortLeaveAuthorization.getTableName(),
              activityTablePK: AuthorizationRequestIds,
            },
            transaction: t,
          });

          // Delete All User Short Leave Authorization

          await ShortLeaveAuthorization.destroy({
            where: {
              id: {
                [Sequelize.Op.in]: AuthorizationRequestIds,
              },
            },
            hooks: false,
            transaction: t,
          });

          // update User Short Leave

          await UserShortLeave.update(
            {
              authorizationStatus,
            },
            {
              where: {
                userShortLeaveId: {
                  [Sequelize.Op.in]: userShortLeave.map(
                    (e) => e.userShortLeaveId
                  ),
                },
              },
              individualHooks: true,
              user: req.userDetails,
              transaction: t,
            }
          );

          const inboxData = [];

          for (const shortLeave of userShortLeave) {
            const userShortLeaveId = shortLeave.userShortLeaveId;
            const userMasterID = shortLeave.userMasterID;

            // For Sequence No
            if (authorizationStatus == 2) {
              const authorizationData = await ShortLeaveAuthorization.create(
                {
                  referenceId: userShortLeaveId,
                  userMasterID: AuthorizedByUserMasterId[0],
                  authstatus: 2,
                },
                { user: req.userDetails, transaction: t }
              );

              // Push Userinbox Data

              inboxData.push({
                activityTable: ShortLeaveAuthorization.getTableName(),
                activityTablePK: authorizationData.toJSON().id,
                message: `${
                  userDetails.displayName
                } has requested a Short Leave for ${moment(
                  shortLeave.date
                ).format('DD/MM/YYYY')}.`,
                assignedTo: AuthorizedByUserMasterId[0],
                assignedBy: userMasterID,
              });

              // send Notification
              sendNotification(
                authorizationData.userMasterID,
                notification,
                data
              );
            } else {
              // For Any
              for (let j = 0; j < AuthorizedByUserMasterId.length; j++) {
                const authorizationData = await ShortLeaveAuthorization.create(
                  {
                    referenceId: userShortLeaveId,
                    userMasterID: AuthorizedByUserMasterId[j],
                    authstatus: 2,
                  },
                  { user: req.userDetails, transaction: t }
                );

                // Push Userinbox Data
                inboxData.push({
                  activityTable: ShortLeaveAuthorization.getTableName(),
                  activityTablePK: authorizationData.toJSON().id,
                  message: `${
                    userDetails.displayName
                  } has requested a Short Leave for ${moment(
                    shortLeave.date
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[j],
                  assignedBy: userMasterID,
                });

                // send Notification
                sendNotification(
                  authorizationData.userMasterID,
                  notification,
                  data
                );
              }
            }
          }

          // create userInbox data in bulk

          await UserInbox.bulkCreate(inboxData, { transaction: t });
        }
      }

      //for expense
      else if (AuthorizationMasterID == authorizationMasterTypes.expense) {
        let expensedata = await executeQuery(
          `select ut."userExpenseTransactionID",ut."expenseAmount",ut."userExpenseID",ut."authorizationStatus",ue."userMasterID" from "userExpenseTransactions" as ut join "userExpenses" as ue on ut."userExpenseID"=ue."userExpenseID" where ue."userMasterID"=` +
            req.body.userMasterID +
            ` and ut."authorizationStatus" IN (1,2)`
        );

        if (expensedata.length > 0) {
          for (let n = 0; n < expensedata.length; n++) {
            let findAuthorization = await ExpenseAuthorizationRequest.findAll({
              where: {
                ReferenceID: expensedata[n].userExpenseTransactionID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            let deleteauthdata = await ExpenseAuthorizationRequest.destroy(
              {
                where: { ReferenceID: expensedata[n].userExpenseTransactionID },
              },
              {
                transaction: t,
              }
            );

            const userdata = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: expensedata[n].userMasterID,
              },
            });

            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID: AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;
            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            let update_expenseStatus = await UserExpenseTransaction.update(
              {
                authorizationStatus: authorizationStatus,
                updateBy: req.body.createBy,
                AuthorizationCriteriaID,
              },
              {
                where: {
                  userExpenseTransactionID:
                    expensedata[n].userExpenseTransactionID,
                },
                transaction: t,
              }
            );

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              let insert_db_status1 = await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: expensedata[n].userExpenseTransactionID,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.userMasterID,
                },
                { transaction: t }
              );

              await UserInbox.create(
                {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: userdata.userMasterID,
                },

                { transaction: t }
              );
            } else {
              for (let i = 0; i < AuthorizedByUserMasterId.length; i++) {
                let insert_db_status1 =
                  await ExpenseAuthorizationRequest.create(
                    {
                      ReferenceID: expensedata[n].userExpenseTransactionID,
                      userMasterID: AuthorizedByUserMasterId[i],
                      status: 1,
                      authstatus: 2,
                      createBy: req.body.userMasterID,
                    },
                    { transaction: t }
                  );

                await UserInbox.create(
                  {
                    activityTable: UserExpense.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().AuthorizationRequestId,
                    message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                    assignedTo: AuthorizedByUserMasterId[i],
                    assignedBy: userdata.userMasterID,
                  },

                  { transaction: t }
                );
              }
            }
            // }
          }
        }
      }

      //for overtime
      else if (AuthorizationMasterID == authorizationMasterTypes.overtime) {
        let find_Overtime = await OvertimeCalculation.findAll({
          where: {
            UserMasterID: req.body.userMasterID,
            AuthorizationRequired: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        if (find_Overtime.length > 0) {
          for (let j = 0; j < find_Overtime.length; j++) {
            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID: AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            let update_overtimeAuthorizationStatus =
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: authorizationStatus,
                  updateBy: req.body.createBy,
                },
                {
                  where: { OverTimeID: find_Overtime[j].OverTimeID },
                  transaction: t,
                }
              );

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              let findAuthorization = await OvertimeAuthorization.findAll({
                where: {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await OvertimeAuthorization.destroy(
                  {
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  },
                  { transaction: t }
                );

                let insert_db_status1 = await OvertimeAuthorization.create(
                  {
                    ReferenceID: find_Overtime[j].OverTimeID,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  },
                  { transaction: t }
                );
              } else {
                let insert_db_status1 = await OvertimeAuthorization.create(
                  {
                    ReferenceID: find_Overtime[j].OverTimeID,
                    userMasterID: AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  },
                  {
                    transaction: t,
                  }
                );
              }
            } else {
              let findAuthorization = await OvertimeAuthorization.findAll({
                where: {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await OvertimeAuthorization.destroy(
                  {
                    where: {
                      ReferenceID: find_Overtime[j].OverTimeID,
                      status: 1,
                    },
                  },
                  {
                    transaction: t,
                  }
                );
              }

              for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
                let insert_db_status1 = await OvertimeAuthorization.create({
                  ReferenceID: find_Overtime[j].OverTimeID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              }
            }
            // }
          }
        }
      } else if (
        AuthorizationMasterID == authorizationMasterTypes.resignation
      ) {
        let find_Resignation = await UserResignation.findAll({
          where: {
            userMasterID: req.body.userMasterID,
            authorizationstatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        if (find_Resignation.length > 0) {
          let authorizationdetails = await AuthorizationDetails.findOne({
            where: {
              userMasterID: req.body.userMasterID,
              AuthorizationMasterID: authorizationMasterTypes.resignation,
              status: 1,
            },
          });

          if (authorizationdetails) {
            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  authorizationdetails.AuthorizationCriteriaID,
                status: 1,
              },
              // raw: true,
            });

            let authorizationStatus;

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              authorizationStatus = 2;
            } else {
              authorizationStatus = 1;
            }

            for (let j = 0; j < find_Resignation.length; j++) {
              let update_resignationAuthorizationStatus =
                await UserResignation.update(
                  {
                    authorizationstatus: authorizationStatus,
                    updateBy: req.body.createBy,
                  },
                  {
                    where: { resignationID: find_Resignation[j].resignationID },
                  }
                );

              if (
                AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
              ) {
                let findAuthorization = await ResignationAuth.findAll({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });

                if (findAuthorization.length > 0) {
                  let delete_record = await ResignationAuth.destroy({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });

                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });
                } else {
                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });
                }
              } else {
                let findAuthorization = await ResignationAuth.findAll({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });

                if (findAuthorization.length > 0) {
                  let delete_record = await ResignationAuth.destroy({
                    where: {
                      ReferenceID: find_Resignation[j].resignationID,
                      status: 1,
                    },
                  });
                }

                for (
                  let k = 0;
                  k < authorizationdetails.AuthorizedByUserMasterId.length;
                  k++
                ) {
                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[k],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });
                }
              }
            }
          }
        }
      }

      // for GatePass
      else if (
        AuthorizationMasterID == authorizationMasterTypes.employeeGatePass
      ) {
        let authorizationdetails1 = await AuthorizationDetails.findOne({
          where: {
            AuthorizationDetailsId: AuthorizationDetailsId,
            AuthorizationMasterID: authorizationMasterTypes.employeeGatePass,
            status: 1,
          },
        });

        let findgatepass = await EmployeeGatepass.findAll({
          where: {
            userMasterId: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 'Pending',
          },
        });

        for (let j = 0; j < findgatepass.length; j++) {
          let AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
              status: 1,
            },
          });

          let authorizationStatus;

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let updatedata = await EmployeeGatepass.update(
            {
              authorizationStatus: authorizationStatus,
              updateBy: req.body.updateBy,
              updateByIp: req.body.updateByIp,
            },
            {
              where: {
                id: findgatepass[j].id,
              },
              transaction: t,
            }
          );

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await GatePassAuthorizationRequest.destroy(
                {
                  where: {
                    ReferenceID: findgatepass[j].id,
                    status: 1,
                  },
                },
                {
                  transaction: t,
                }
              );

              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,

                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for GatePass request ${moment(
                    findgatepass[j].date
                  ).format('DD/MM/YYYY')} `,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findgatepass[j].userMasterId,
                },
                { transaction: t }
              );
            } else {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,
                  createByIp: findgatepass[j].createByIp,
                },
                { transaction: t }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for GatePass request ${moment(
                    findgatepass[j].date
                  ).format('DD/MM/YYYY')} `,
                  assignedTo: AuthorizedByUserMasterId[0],
                  assignedBy: findgatepass[j].userMasterID,
                },
                { transaction: t }
              );
            }

            let userinfo = await UserMaster.findOne({
              where: {
                // userMasterID:response[i].createBy
                userMasterID: findgatepass[j].userMasterId,
              },
            });
            const notification = {
              title: 'GatePass',
              body: userinfo.displayName + ' requested for GatePass.',
            };
            const data = {
              screen: 'gatepassauth',
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction: t }
            );

            if (findAuthorization.length > 0) {
              let delete_record = await GatePassAuthorizationRequest.destroy(
                {
                  where: {
                    ReferenceID: findgatepass[j].id,
                    status: 1,
                  },
                },
                { transaction: t }
              );
            }

            for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: AuthorizedByUserMasterId[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,
                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction: t,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for GatePass request ${moment(
                    findgatepass[j].date
                  ).format('DD/MM/YYYY')} `,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findgatepass[j].userMasterID,
                },
                { transaction: t }
              );

              const notification = {
                title: 'GatePass',
                body: userinfo.displayName + ' requested for GatePass.',
              };
              const data = {
                screen: 'gatepassauth',
              };
              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }

      // For COff and Extra Days
      else if (
        AuthorizationMasterID == authorizationMasterTypes.compensatoryOff
      ) {
        const findcoff = await coffMaster.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        const findExtraDays = await ExtraDays.findAll({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [0, 1, 2],
            },
          },
        });

        const AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID,
            status: 1,
          },
        });

        const authorizationStatus =
          AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ? 2
            : 1;

        const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

        const AllExtraDaysMasterIDs = findExtraDays.map((e) => e.extraDaysID);

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

        await ExtraDays.update(
          {
            authorizationStatus: authorizationStatus,
            updateBy: req.body.createBy,
            updateByIp: req.body.createByIp,
          },
          {
            where: {
              extraDaysID: {
                [Sequelize.Op.in]: AllExtraDaysMasterIDs,
              },
            },
            transaction: t,
          }
        );

        const userinfo = await UserMaster.findOne({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
          },
          transaction: t,
        });

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

        const findAllExtraDayAuthorization =
          await ExtraDaysAuthorization.findAll({
            where: {
              extraDaysID: {
                [Sequelize.Op.in]: AllExtraDaysMasterIDs,
              },
            },
          });

        const notification = {
          title: 'Compensatory Off',
          body: userinfo.displayName + ' requested for Compensatory Off.',
        };
        const data = {
          screen: 'coffauth',
        };

        const extraDayNotification = {
          title: 'Extra Days',
          body: userinfo.displayName + ' requested for Extra Days.',
        };
        const extraDayData = {
          screen: 'extradaysauth',
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
                userMasterID: AuthorizedByUserMasterId[0],
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
                assignedTo: AuthorizedByUserMasterId[0],
                assignedBy: findcoff[j].userMasterID,
              },
              { transaction: t }
            );

            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findcoff[j].coffMasterID,
                  userMasterID: AuthorizedByUserMasterId[k],
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
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findcoff[j].userMasterID,
                },
                { transaction: t }
              );

              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }

        for (let j = 0; j < findExtraDays.length; j++) {
          const authorizationIds = findAllExtraDayAuthorization
            .filter((e) => e.extraDaysID == findExtraDays[j].extraDaysID)
            .map((a) => a.extraDaysAuthorizationID);

          // Delete All UserInbox
          await UserInbox.destroy(
            {
              where: {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: authorizationIds,
                },
              },
            },
            { transaction: t }
          );

          // Delete All Auth Data
          if (authorizationIds.length > 0) {
            await ExtraDaysAuthorization.destroy(
              {
                where: {
                  extraDaysID: findExtraDays[j].extraDaysID,
                },
              },
              {
                Hooks: false,
                transaction: t,
              }
            );
          }

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            const insert_db_status1 = await ExtraDaysAuthorization.create(
              {
                TableName: 'extraDays',
                extraDaysID: findExtraDays[j].extraDaysID,
                userMasterID: AuthorizedByUserMasterId[0],
                authstatus: 2,
              },
              { user: req.userDetails, transaction: t }
            );

            await UserInbox.create(
              {
                activityTable: ExtraDaysAuthorization.getTableName(),
                activityTablePK:
                  insert_db_status1.toJSON().extraDaysAuthorizationID,
                message: `${
                  userinfo.displayName
                } has requested for Extra Days for ${moment(
                  findExtraDays[j].date
                ).format('DD/MM/YYYY')}`,
                assignedTo: AuthorizedByUserMasterId[0],
                assignedBy: findExtraDays[j].userMasterID,
              },
              { transaction: t }
            );

            await sendNotification(
              AuthorizedByUserMasterId[0],
              extraDayNotification,
              extraDayData
            );
          } else {
            for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
              let insert_db_status1 = await ExtraDaysAuthorization.create(
                {
                  TableName: 'extraDays',
                  extraDaysID: findExtraDays[j].extraDaysID,
                  userMasterID: AuthorizedByUserMasterId[k],
                  authstatus: 2,
                },
                {
                  user: req.userDetails,
                  transaction: t,
                }
              );

              await UserInbox.create(
                {
                  activityTable: ExtraDaysAuthorization.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().extraDaysAuthorizationID,
                  message: `${
                    userinfo.displayName
                  } has requested for Extra Days for ${moment(
                    findExtraDays[j].date
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findExtraDays[j].userMasterID,
                },
                { transaction: t }
              );

              await sendNotification(
                AuthorizedByUserMasterId[k],
                extraDayNotification,
                extraDayData
              );
            }
          }
        }
      }

      // for Attendance Correction
      else if (
        AuthorizationMasterID == authorizationMasterTypes.attendanceCorrection
      ) {
        const findAttendanceCorrection =
          await AttendanceCorrectionRequest.findAll({
            where: {
              userMasterID: authorizationdetails1.userMasterID,
              authorizationStatus: {
                [Sequelize.Op.in]: [1, 2],
              },
              status: 1,
            },
          });

        const allAttendanceIDs = findAttendanceCorrection.map(
          (e) => e.attendanceCorrectionRequestId
        );

        const AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID,
            status: 1,
          },
        });

        const authorizationStatus =
          AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ? 2
            : 1;

        await AttendanceCorrectionRequest.update(
          {
            authorizationStatus: authorizationStatus,
            updateBy: req.body.updateBy,
            updateByIp: req.body.updateByIp,
          },
          {
            where: {
              attendanceCorrectionRequestId: allAttendanceIDs,
            },
            user: req.userDetails,
            individualHooks: true,
            transaction: t,
          }
        );

        const userinfo = await UserMaster.findOne({
          where: {
            userMasterID: authorizationdetails1.userMasterID,
          },
          transaction: t,
        });

        const findAllAuthorization =
          await AttendanceCorrectionAuthorization.findAll({
            where: {
              attendanceCorrectionRequestId: {
                [Sequelize.Op.in]: allAttendanceIDs,
              },
              status: 1,
            },
          });

        for (let j = 0; j < findAttendanceCorrection.length; j++) {
          const authorizationIds = findAllAuthorization
            .filter(
              (e) =>
                e.attendanceCorrectionRequestId ==
                findAttendanceCorrection[j].attendanceCorrectionRequestId
            )
            .map((a) => a.id);

          // Delete All UserInbox
          await UserInbox.destroy(
            {
              where: {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: authorizationIds,
                },
              },
            },
            { transaction: t }
          );

          // Delete All Auth Data
          if (authorizationIds.length > 0) {
            await AttendanceCorrectionAuthorization.destroy(
              {
                where: {
                  attendanceCorrectionRequestId:
                    findAttendanceCorrection[j].attendanceCorrectionRequestId,
                  status: 1,
                },
              },
              {
                user: req.userDetails,
                individualHooks: true,
                transaction: t,
              }
            );
          }

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            const insert_db_status1 =
              await AttendanceCorrectionAuthorization.create(
                {
                  attendanceCorrectionRequestId:
                    findAttendanceCorrection[j].attendanceCorrectionRequestId,
                  userMasterID: AuthorizedByUserMasterId[0],
                  status: 1,
                  authStatus: 2,
                  createBy: findAttendanceCorrection[j].createBy,
                  createByIp: findAttendanceCorrection[j].createByIp,
                },
                {
                  user: req.userDetails,
                  individualHooks: true,
                  transaction: t,
                }
              );

            await UserInbox.create(
              {
                activityTable: AttendanceCorrectionAuthorization.getTableName(),
                activityTablePK: insert_db_status1.toJSON().id,
                message: `${
                  userinfo.displayName
                } has requested an attendance correction for ${moment(
                  findAttendanceCorrection[j].AttendanceDate
                ).format('DD/MM/YYYY')}.`,
                assignedTo: AuthorizedByUserMasterId[0],
                assignedBy: findAttendanceCorrection[j].userMasterID,
              },
              { transaction: t }
            );
            // }

            const notification = {
              title: 'Attendance Correction',
              body:
                userinfo.displayName +
                ' requested for an attendance correction.',
            };
            const data = {
              screen: 'attendanceCorrectionauth',
              isScheduled: 'true',
              scheduledTime: new Date().toISOString(),
            };
            await sendNotification(
              AuthorizedByUserMasterId[0],
              notification,
              data
            );
          } else {
            for (let k = 0; k < AuthorizedByUserMasterId.length; k++) {
              const insert_db_status1 =
                await AttendanceCorrectionAuthorization.create(
                  {
                    attendanceCorrectionRequestId:
                      findAttendanceCorrection[j].attendanceCorrectionRequestId,
                    userMasterID: AuthorizedByUserMasterId[k],
                    status: 1,
                    authStatus: 2,
                  },
                  {
                    user: req.userDetails,
                    individualHooks: true,
                    transaction: t,
                  }
                );

              await UserInbox.create(
                {
                  activityTable:
                    AttendanceCorrectionAuthorization.getTableName(),
                  activityTablePK: insert_db_status1.toJSON().id,
                  message: `${
                    userinfo.displayName
                  } has requested an attendance correction for ${moment(
                    findAttendanceCorrection[j].AttendanceDate
                  ).format('DD/MM/YYYY')}.`,
                  assignedTo: AuthorizedByUserMasterId[k],
                  assignedBy: findAttendanceCorrection[j].userMasterID,
                },
                { transaction: t }
              );

              const notification = {
                title: 'Attendance Correction',
                body:
                  userinfo.displayName +
                  ' requested for an attendance correction.',
              };
              const data = {
                screen: 'attendanceCorrectionauth',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };

              await sendNotification(
                AuthorizedByUserMasterId[k],
                notification,
                data
              );
            }
          }
        }
      }

      res.status(200).json({
        status: 200,
        message: message.usermessage.authorizationCriteriaMasterUpdate,
      });
    });

    // }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { AuthorizationDetailsId, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await AuthorizationDetails.update(
          {
            status: '1',
          },
          {
            where: {
              AuthorizationDetailsId: AuthorizationDetailsId,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await AuthorizationDetails.update(
          {
            status: '0',
          },
          {
            where: {
              AuthorizationDetailsId: AuthorizationDetailsId,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.authorizationCriteriaMasterDelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.authorizationCriteriaMasterDelete,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteAuthorizationDetailsById = async (req, res, next) => {
  try {
    let { AuthorizationDetailsId, AuthMasterID, updateBy, updateByIp } =
      await req.body;
    // let delete_db_status = await BankMaster.destroy({
    //     where: {
    //         bankMasterID: bankMasterID
    //     }
    // });
    let result = await sequelize.transaction(async (t) => {
      let auth_details = await AuthorizationDetails.findOne({
        where: {
          AuthorizationDetailsId: AuthorizationDetailsId,
          status: [0, 1],
        },
      });

      let userMasterID = auth_details.userMasterID;

      //-------------------------------- for Leave---------

      if (AuthMasterID == 1) {
        const userLeaves = await UserLeave.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
          include: [
            {
              required: false,
              model: LeaveAuthorizationRequest,
              attributes: ['AuthorizationRequestId'],
            },
          ],
        });

        const ReferenceID = userLeaves.map((e) => +e.UserLeaveApplicationID);

        const authorizationIds = userLeaves
          .flatMap((item) => item.leaveAuthorizations)
          .map((e) => e.AuthorizationRequestId);

        // Delete All UserInbox
        await UserInbox.destroy({
          where: {
            activityTable: LeaveAuthorizationRequest.getTableName(),
            activityTablePK: {
              [Sequelize.Op.in]: authorizationIds,
            },
          },
          transaction: t,
        });

        await destroyLeaveAuthAndApprovedLeaveAuth(ReferenceID, t);
        await UserLeave.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              UserLeaveApplicationID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );

        //  --------------------------Short leave -----------------------

        const shortLeaveData = await UserShortLeave.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
          include: [
            {
              required: false,
              model: ShortLeaveAuthorization,
              attributes: ['id'],
            },
          ],
        });

        const userShortLeaveIds = shortLeaveData.map((e) => e.userShortLeaveId);

        const authorizationIds_shortLeave = shortLeaveData
          .flatMap((item) => item.shortLeaveAuthorizations)
          .map((e) => e.id);

        // Delete All UserInbox
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: {
              [Sequelize.Op.in]: authorizationIds_shortLeave,
            },
          },
          transaction: t,
        });

        // Delete Short leave authorization

        await ShortLeaveAuthorization.destroy({
          where: {
            referenceId: {
              [Sequelize.Op.in]: userShortLeaveIds,
            },
          },
          hooks: false,
          transaction: t,
        });

        // update short leave

        await UserShortLeave.update(
          {
            authorizationStatus: 0,
          },
          {
            where: {
              userShortLeaveId: {
                [Sequelize.Op.in]: userShortLeaveIds,
              },
            },
            individualHooks: true,
            user: req.userDetails,
            transaction: t,
          }
        );
      }

      //  for Expense------------
      else if (AuthMasterID == 2) {
        let userExpense = await executeQuery(
          ` 

                    select ut.* from "userExpenses" as ue inner join "userExpenseTransactions" as ut on ue."userExpenseID"= ut."userExpenseID"
                     where ue."userMasterID"=` +
            userMasterID +
            ` and ut."authorizationStatus" in(1,2) and ut.status=1
                     
                     `
        );

        let ReferenceID = [];

        for (let i = 0; i < userExpense.length; i++) {
          ReferenceID.push(userExpense[i].userExpenseTransactionID);
        }

        let delete_auth_data = await ExpenseAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_expenseTrans = await UserExpenseTransaction.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
            AuthorizationCriteriaID: null,
          },
          {
            where: {
              userExpenseTransactionID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for OverTime-----------
      else if (AuthMasterID == 3) {
        let userOvertime = await overTimeCalculation.findAll({
          where: {
            UserMasterID: userMasterID,
            AuthorizationRequired: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        let ReferenceID = [];

        for (let i = 0; i < userOvertime.length; i++) {
          ReferenceID.push(userOvertime[i].OverTimeID);
        }

        let delete_auth_data = await overtimeAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_overtime = await overTimeCalculation.update(
          {
            AuthorizationRequired: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              OverTimeID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      //  for Resignation---------
      else if (AuthMasterID == 5) {
        let userResignation = await UserResignation.findAll({
          where: {
            userMasterID: userMasterID,
            authorizationstatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        let ReferenceID = [];

        for (let i = 0; i < userResignation.length; i++) {
          ReferenceID.push(userResignation[i].resignationID);
        }

        let delete_auth_data = await ResignationAuth.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_resignation = await UserResignation.update(
          {
            authorizationstatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              resignationID: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for Gate Pass---------
      else if (AuthMasterID == 6) {
        let employee_gatepass = await EmployeeGatepass.findAll({
          where: {
            userMasterId: userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        let ReferenceID = [];

        for (let i = 0; i < employee_gatepass.length; i++) {
          ReferenceID.push(employee_gatepass[i].id);
        }

        let delete_auth_data = await GatePassAuthorizationRequest.destroy({
          where: {
            ReferenceID: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          transaction: t,
        });

        let update_leave = await EmployeeGatepass.update(
          {
            authorizationStatus: 0,
            updateBy: updateBy,
            updateByIp: updateByIp,
          },
          {
            where: {
              id: {
                [Sequelize.Op.in]: ReferenceID,
              },
            },
            transaction: t,
          }
        );
      }

      // for Delete COff Auth

      if (AuthMasterID == 8) {
        const findcoff = await coffMaster.findAll({
          where: {
            userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
          include: [
            {
              required: false,
              model: CompensatoryOffAuthorization,
              attributes: ['CompensatoryOffAuthorizationID'],
            },
          ],
        });

        const authorizationIds = findcoff
          .flatMap((item) => item.compensatoryOffAuthorizations)
          .map((e) => e.CompensatoryOffAuthorizationID);
        const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

        await coffMaster.update(
          {
            authorizationStatus: 0,
            updateBy,
            updateByIp,
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

        await CompensatoryOffAuthorization.destroy(
          {
            where: {
              coffMasterID: {
                [Sequelize.Op.in]: AllCoffMasterIDs,
              },
              status: 1,
            },
          },
          {
            Hooks: false,
            transaction: t,
          }
        );
      }
      // for Attendance Correction---------
      else if (AuthMasterID == 7) {
        let attendanceCorrection = await AttendanceCorrectionRequest.findAll({
          where: {
            userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
          include: [
            {
              required: false,
              model: AttendanceCorrectionAuthorization,
              attributes: ['id'],
            },
          ],
        });

        let ReferenceID = [];

        const authorizationIds = attendanceCorrection
          .flatMap((item) => item.attendanceCorrectionAuthorizations)
          .map((e) => e.id);

        for (let i = 0; i < attendanceCorrection.length; i++) {
          ReferenceID.push(
            attendanceCorrection[i].attendanceCorrectionRequestId
          );
        }

        let deletAuthData = await AttendanceCorrectionAuthorization.destroy({
          where: {
            attendanceCorrectionRequestId: {
              [Sequelize.Op.in]: ReferenceID,
            },
          },
          user: req.userDetails,
          individualHooks: true,
          transaction: t,
        });

        const deleteNotification = await UserInbox.destroy(
          {
            where: {
              activityTable: AttendanceCorrectionAuthorization.getTableName(),
              activityTablePK: {
                [Sequelize.Op.in]: authorizationIds,
              },
            },
          },
          { transaction: t }
        );

        let updateAttendanceCorrection =
          await AttendanceCorrectionRequest.update(
            {
              authorizationStatus: 0,
              updateBy: updateBy,
              updateByIp: updateByIp,
            },
            {
              where: {
                attendanceCorrectionRequestId: {
                  [Sequelize.Op.in]: ReferenceID,
                },
              },
              user: req.userDetails,
              individualHooks: true,
              transaction: t,
            }
          );
      }

      // ------
      let delete_status = await AuthorizationDetails.update(
        {
          status: 2,
          updateBy: updateBy,
          updateByIp: updateByIp,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.authorizationCriteriaMasterDelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.nonauthorizeduser = async (req, res, next) => {
  try {
    let { companyMasterID, branchMasterID, authorizationMasterID } =
      await req.body;

    let nonAuthorized_User;

    if (!branchMasterID) {
      if (companyMasterID)
        req.userDetails.accessibleCompanies = companyMasterID;

      let auth_details = await AuthorizationDetails.findAll({
        where: {
          AuthorizationMasterID: authorizationMasterID,
          companyMasterID: companyMasterID,
          status: 1,
        },
        include: [
          {
            model: UserMaster,
            // required: true,
            // ...accessibleUsers(req.userDetails),
          },
        ],
      });

      let authorized_user = [];

      for (let i = 0; i < auth_details.length; i++) {
        authorized_user.push(auth_details[i].userMasterID);
      }

      nonAuthorized_User = await UserMaster.findAll({
        raw: true,
        where: {
          userMasterID: {
            [Sequelize.Op.notIn]: authorized_user,
          },
          companyMasterId: companyMasterID,
          status: 1,
        },
        ...accessibleUsers(req.userDetails, false),
        // include: [
        //   { model: EmployeeJoiningDetails, attributes: ['employeeCode'] },
        // ],
        order: [['displayName', 'ASC']],
      });
    } else {
      if (branchMasterID) req.userDetails.accessibleBranches = branchMasterID;

      let branch_contact = await EmployeeBranch.findAll({
        raw: true,
        where: {
          status: 1,
          branchID: branchMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(),
          },

          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.eq]: null } },
            { endDate: { [Sequelize.Op.gte]: new Date() } },
          ],
        },
        include: [
          {
            model: UserMaster,
            // required: true,
            as: 'employee',
            // ...accessibleUsers(req.userDetails),
          },
        ],
      });

      let userid = [];
      for (let i = 0; i < branch_contact.length; i++) {
        userid.push(branch_contact[i].userMasterID);
      }

      let auth_details = await AuthorizationDetails.findAll({
        where: {
          AuthorizationMasterID: authorizationMasterID,
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
          status: 1,
        },
      });

      let authorized_user = [];

      for (let j = 0; j < auth_details.length; j++) {
        authorized_user.push(auth_details[j].userMasterID);
      }

      let final1 = userid.map(String);

      let result = final1.filter((e) => !authorized_user.includes(e));

      nonAuthorized_User = await UserMaster.findAll({
        raw: true,
        where: {
          status: 1,
          userMasterID: {
            [Sequelize.Op.in]: result,
          },
        },
        order: [['displayName', 'ASC']],
        ...accessibleUsers(req.userDetails, false),
      });
    }

    // for (let item of nonAuthorized_User) {
    //   if (item['employeeJoiningDetails.employeeCode'])
    //     item.displayName =
    //       item['employeeJoiningDetails.employeeCode'] +
    //       ' - ' +
    //       item.displayName;
    // }

    return res.status(200).json({ status: 200, data: nonAuthorized_User });
  } catch (err) {
    next(err);
  }
};

exports.getAuthList = async (req, res, next) => {
  try {
    let { userMasterID } = await req.body;

    let authCount = [];

    if (userMasterID) {
      let authMaster = await authMasters.findAll({
        raw: true,
        where: {
          status: 1,
        },
      });

      for (let i = 0; i < authMaster.length; i++) {
        let temp = {
          name: authMaster[i].authorizationMasterName,
          count: 0,
          authorizationMasterID: authMaster[i].authorizationMasterID,
        };

        let authDetails = await AuthorizationDetails.findAll({
          where: {
            AuthorizationMasterID: authMaster[i].authorizationMasterID,
            AuthorizedByUserMasterId: {
              [Sequelize.Op.contains]: [userMasterID],
            },
            status: 1,
          },
          include: [
            {
              model: UserMaster,
              where: { status: [0, 1] },
              required: true,
              ...accessibleUsers(req.userDetails),
            },
          ],
        });

        temp.count = authDetails.length;
        authCount.push(temp);
      }
    }

    return res.status(200).json({ status: 200, data: authCount });
  } catch (err) {
    next(err);
  }
};

exports.replaceAuth = async (req, res, next) => {
  try {
    let { findID, replaceID, criteria } = await req.body;
    let authCount = [];

    if (findID && replaceID && criteria.length > 0) {
      let result = await sequelize.transaction(async (t) => {
        let authMaster = await authMasters.findAll({
          raw: true,
          where: {
            authorizationMasterID: criteria,
            status: 1,
          },
          transaction: t,
        });

        for (let i = 0; i < authMaster.length; i++) {
          let temp = {
            name: authMaster[i].authorizationMasterName,
            count: 0,
          };
          let authDetailsCount = await AuthorizationDetails.count({
            where: {
              AuthorizationMasterID: authMaster[i].authorizationMasterID,
              AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [findID] },
              status: 1,
            },
            transaction: t,
          });
          temp.count = authDetailsCount;
          authCount.push(temp);

          let authDetailsUpdate = await AuthorizationDetails.update(
            {
              AuthorizedByUserMasterId: sequelize.literal(
                `ARRAY_REPLACE("AuthorizedByUserMasterId", ${findID}, ${replaceID})`
              ),
            },
            {
              where: {
                AuthorizationMasterID: authMaster[i].authorizationMasterID,
                AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [findID] },
                status: 1,
              },
              transaction: t,
            }
          );

          if (authMaster[i].authorizationMasterID == 1) {
            // ---------------------Leave ----------------------

            const leaveAuthData = await LeaveAuthorizationRequest.findAll({
              where: {
                userMasterID: findID,
                authstatus: 2,
              },
              include: [
                {
                  model: UserLeave,
                  attributes: ['UserLeaveApplicationID', 'authorizationStatus'],
                },
              ],
            });

            const notPendingLeaveAuthIds = leaveAuthData
              .filter(
                (e) =>
                  e.userLeave.authorizationStatus == 3 &&
                  e.userLeave.authorizationStatus == 4
              )
              .map((a) => a.AuthorizationRequestId);
            const allLeaveAuthIds = leaveAuthData.map(
              (e) => e.AuthorizationRequestId
            );

            const set1 = new Set(notPendingLeaveAuthIds);

            const allPendingLeaveAuthIds = allLeaveAuthIds.filter(
              (id) => !set1.has(id)
            );

            // destroy all user inbox
            await UserInbox.destroy({
              where: {
                activityTable: LeaveAuthorizationRequest.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: notPendingLeaveAuthIds,
                },
              },
              transaction: t,
            });

            // update remaining ids to repalce ids

            await UserInbox.update(
              {
                assignedTo: replaceID,
              },
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: allPendingLeaveAuthIds,
                  },
                },
              }
            );

            // update leave authorization data
            await LeaveAuthorizationRequest.update(
              {
                userMasterID: replaceID,
              },
              {
                where: {
                  AuthorizationRequestId: {
                    [Sequelize.Op.in]: allLeaveAuthIds,
                  },
                },
                transaction: t,
              }
            );

            // ------------ Short Leave ----------------

            const shortLeaveAuthData = await ShortLeaveAuthorization.findAll({
              where: {
                userMasterID: findID,
                authstatus: 2,
              },
              include: [
                {
                  model: UserShortLeave,
                  attributes: ['userShortLeaveId', 'authorizationStatus'],
                },
              ],
            });

            const notPendingShortLeaveAuthIds = shortLeaveAuthData
              .filter(
                (e) =>
                  e.userShortLeave.authorizationStatus == 3 &&
                  e.userShortLeave.authorizationStatus == 4
              )
              .map((a) => a.id);
            const allShortLeaveAuthIds = shortLeaveAuthData.map((e) => e.id);

            const set2 = new Set(notPendingShortLeaveAuthIds);

            const allPendingShortLeaveAuthIds = allShortLeaveAuthIds.filter(
              (id) => !set2.has(id)
            );

            // destroy all user inbox
            await UserInbox.destroy({
              where: {
                activityTable: ShortLeaveAuthorization.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: notPendingShortLeaveAuthIds,
                },
              },
              transaction: t,
            });

            // update remaining ids to repalce ids

            await UserInbox.update(
              {
                assignedTo: replaceID,
              },
              {
                where: {
                  activityTable: ShortLeaveAuthorization.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: allPendingShortLeaveAuthIds,
                  },
                },
              }
            );

            // update short leave authorization data
            await ShortLeaveAuthorization.update(
              {
                userMasterID: replaceID,
              },
              {
                where: {
                  id: {
                    [Sequelize.Op.in]: allShortLeaveAuthIds,
                  },
                },
                individualHooks: true,
                user: req.userDetails,
                transaction: t,
              }
            );
          } else if (authMaster[i].authorizationMasterID == 2) {
            //Expense

            let expenseAuthDetailsUpdate =
              await ExpenseAuthorizationRequest.update(
                {
                  userMasterID: replaceID,
                },
                {
                  where: {
                    userMasterID: findID,
                    authstatus: 2,
                    status: 1,
                  },
                  transaction: t,
                }
              );
          } else if (authMaster[i].authorizationMasterID == 3) {
            //Overtime
            let overtimeAuthDetailsUpdate =
              await overtimeAuthorizationRequest.update(
                {
                  userMasterID: replaceID,
                },
                {
                  where: {
                    userMasterID: findID,
                    authstatus: 2,
                    status: 1,
                  },
                  transaction: t,
                }
              );
          } else if (authMaster[i].authorizationMasterID == 5) {
            //Resignation

            let resignationAuthDetailsUpdate = await ResignationAuth.update(
              {
                userMasterID: replaceID,
              },
              {
                where: {
                  userMasterID: findID,
                  authstatus: 2,
                  status: 1,
                },
                transaction: t,
              }
            );
          } else if (authMaster[i].authorizationMasterID == 6) {
            //Employee Gate Pass

            let employeeGatePassAuthDetailsUpdate =
              await GatePassAuthorizationRequest.update(
                {
                  userMasterID: replaceID,
                },
                {
                  where: {
                    userMasterID: findID,
                    authstatus: 2,
                    status: 1,
                  },
                  transaction: t,
                }
              );
          } else if (authMaster[i].authorizationMasterID == 7) {
            //Compensatory Off

            let compensatoryOffAuthDetailsUpdate =
              await CompensatoryOffAuthorization.update(
                {
                  userMasterID: replaceID,
                },
                {
                  where: {
                    userMasterID: findID,
                    authstatus: 2,
                    status: 1,
                  },
                  transaction: t,
                }
              );
          }
        }
      });
    }

    let message =
      authCount.length > 0
        ? 'Authorization replaced successfully'
        : 'No Authorization found';

    return res
      .status(200)
      .json({ status: 200, data: authCount, message: message });
  } catch (err) {
    next(err);
  }
};

exports.getAuthorizationDetailsByAuthorizedByUserMasterId = async (
  req,
  res,
  next
) => {
  try {
    const {
      companyMasterID,
      limit,
      page,
      userMasterID,
      AuthorizationMasterID,
      searchQuery,
    } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const datetime = asiaKolkataDateTime(new Date()).slice(0, 10);
    const condition = {};
    condition.status = 1;
    // if (companyMasterID) {
    //   req.userDetails.accessibleCompanies = companyMasterID;
    //   condition.companyMasterID = companyMasterID;
    // }
    if (userMasterID)
      condition.AuthorizedByUserMasterId = {
        [Sequelize.Op.contains]: [userMasterID],
      };
    if (AuthorizationMasterID)
      condition.AuthorizationMasterID = AuthorizationMasterID;
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          '$UserMaster.firstName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$UserMaster.middleName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$UserMaster.lastName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$EmployeeJoiningDetails.employeeCode$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }

    const order = [['AuthorizationDetailsId', 'ASC']];
    const { count, rows } = await AuthorizationDetails.findAndCountAll({
      distinct: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          where: { status: 1 },
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
          include: [
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
              required: false,
            },
            {
              model: companyMaster,
              required: true,
              attributes: ['companyMasterID', 'companyName'],
            },
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['designationID', 'applicableDate'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                  required: false,
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['departmentID', 'applicableDate'],
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
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(datetime) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(datetime) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['branchID', 'applicableDate'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
        { model: AuthorizationCriteria },
        { model: authMasters },
      ],
      subQuery: false,
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteAuth = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { AuthorizedByUserMasterId, AuthorizationMasterID } = await req.body;
    const authDetails = await AuthorizationDetails.findAll({
      where: {
        AuthorizedByUserMasterId: {
          [Sequelize.Op.contains]: [AuthorizedByUserMasterId],
        },
        AuthorizationMasterID: AuthorizationMasterID,
        status: 1,
      },
    });

    for (const item of authDetails) {
      const userDetailsids = item.AuthorizedByUserMasterId.filter(
        (e) => e != AuthorizedByUserMasterId
      );

      await AuthorizationDetails.update(
        {
          AuthorizedByUserMasterId: userDetailsids,
          status: userDetailsids.length === 0 ? 2 : 1,
        },
        {
          where: { AuthorizationDetailsId: item.AuthorizationDetailsId },
          transaction,
        }
      );

      //for leave
      if (item.AuthorizationMasterID == authorizationMasterTypes.leave) {
        const findLeave = await UserLeave.findAll({
          where: {
            userMasterID: item.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
          include: [
            { required: true, model: HrLeaveTypes, attributes: ['LeaveID'] },
          ],
        });

        for (let j = 0; j < findLeave.length; j++) {
          const type =
            findLeave[j].hrLeaveType.LeaveID == 25 ? 'Outdoor Duty' : 'Leave';
          const tableName =
            findLeave[j].hrLeaveType.LeaveID == 25
              ? 'outdoorDutyAuthorizations'
              : 'leaveAuthorizations';

          let AuthorizationCriterias = item.AuthorizationCriteriaID;
          let authorizationStatus;

          if (AuthorizationCriterias == 5) {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let updatedata = await UserLeave.update(
            {
              authorizationStatus:
                userDetailsids.length > 0 ? authorizationStatus : 0,
            },
            {
              where: {
                UserLeaveApplicationID: findLeave[j].UserLeaveApplicationID,
              },
              transaction,
            }
          );

          if (AuthorizationCriterias == 5) {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: tableName,
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction }
            );

            await destroyLeaveAuthAndApprovedLeaveAuth(
              +findLeave[j].UserLeaveApplicationID,
              transaction
            );
            if (userDetailsids.length > 0) {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: findLeave[j].UserLeaveApplicationID,
                  userMasterID: userDetailsids[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findLeave[j].createBy,

                  createByIp: findLeave[j].createByIp,
                },
                {
                  transaction,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findLeave[j].userMasterID,
                },
              });

              await UserInbox.create(
                {
                  activityTable: tableName,
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for ${type} request from ${moment(
                    findLeave[j].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    findLeave[j].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: userDetailsids[0],
                  assignedBy: findLeave[j].userMasterID,
                },
                { transaction }
              );

              const notification = {
                title: type,
                body: userinfo.displayName + ` requested for ${type} .`,
              };
              const data = {
                screen:
                  type == 'Outdoor Duty' ? 'outDoorDutyAuth' : 'leaveauth',
              };
              await sendNotification(userDetailsids[0], notification, data);
            }
          } else {
            let findAuthorization = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: tableName,
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction }
            );

            await destroyLeaveAuthAndApprovedLeaveAuth(
              +findLeave[j].UserLeaveApplicationID,
              transaction
            );
          }

          for (let k = 0; k < userDetailsids.length; k++) {
            let insert_db_status1 = await LeaveAuthorizationRequest.create(
              {
                TableName: 'userLeaves',
                ReferenceID: findLeave[j].UserLeaveApplicationID,
                userMasterID: userDetailsids[k],
                status: 1,
                authstatus: 2,
                createBy: findLeave[j].createBy,
                createByIp: findLeave[j].createByIp,
              },
              {
                transaction,
              }
            );

            let userinfo = await UserMaster.findOne({
              where: {
                // userMasterID:response[i].createBy
                userMasterID: findLeave[j].userMasterID,
              },
            });

            await UserInbox.create(
              {
                activityTable: tableName,
                activityTablePK:
                  insert_db_status1.toJSON().AuthorizationRequestId,
                message: `${
                  userinfo.displayName
                } has applied for ${type} request from ${moment(
                  findLeave[j].FromDate
                ).format('DD/MM/YYYY')} to ${moment(findLeave[j].ToDate).format(
                  'DD/MM/YYYY'
                )}`,
                assignedTo: userDetailsids[k],
                assignedBy: findLeave[j].userMasterID,
              },
              { transaction }
            );

            const notification = {
              title: type,
              body: userinfo.displayName + ` requested for ${type}.`,
            };
            const data = {
              screen: type == 'Outdoor Duty' ? 'outDoorDutyAuth' : 'leaveauth',
            };
            await sendNotification(userDetailsids[k], notification, data);
          }
        }

        //  --------------------------Short leave -----------------------

        const shortLeaveData = await UserShortLeave.findAll({
          where: {
            userMasterID: item.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
          include: [
            {
              required: false,
              model: ShortLeaveAuthorization,
              attributes: ['id'],
            },
          ],
          transaction,
        });

        const userShortLeaveIds = shortLeaveData.map((e) => e.userShortLeaveId);

        const authorizationIds_shortLeave = shortLeaveData
          .flatMap((item) => item.shortLeaveAuthorizations)
          .map((e) => e.id);

        // Delete All UserInbox
        await UserInbox.destroy({
          where: {
            activityTable: ShortLeaveAuthorization.getTableName(),
            activityTablePK: {
              [Sequelize.Op.in]: authorizationIds_shortLeave,
            },
          },
          transaction,
        });

        // Delete Short leave authorization

        await ShortLeaveAuthorization.destroy({
          where: {
            referenceId: {
              [Sequelize.Op.in]: userShortLeaveIds,
            },
          },
          hooks: false,
          transaction,
        });

        // update short leave

        await UserShortLeave.update(
          {
            authorizationStatus: 0,
          },
          {
            where: {
              userShortLeaveId: {
                [Sequelize.Op.in]: userShortLeaveIds,
              },
            },
            individualHooks: true,
            user: req.userDetails,
            transaction,
          }
        );
      }

      //for expense
      else if (item.AuthorizationMasterID == authorizationMasterTypes.expense) {
        let expensedata = await executeQuery(
          `select ut."userExpenseTransactionID",ut."expenseAmount",ut."userExpenseID",ut."authorizationStatus",ue."userMasterID" from "userExpenseTransactions" as ut join "userExpenses" as ue on ut."userExpenseID"=ue."userExpenseID" where ue."userMasterID"=` +
            item.userMasterID +
            ` and ut."authorizationStatus" IN (1,2)`
        );
        for (let n = 0; n < expensedata.length; n++) {
          let findAuthorization = await ExpenseAuthorizationRequest.findAll({
            where: {
              ReferenceID: expensedata[n].userExpenseTransactionID,
              status: 1,
            },
          });

          const authorizationIds = findAuthorization.map(
            (e) => e.AuthorizationRequestId
          );

          await UserInbox.destroy(
            {
              where: {
                activityTable: UserExpense.getTableName(),
                activityTablePK: {
                  [Sequelize.Op.in]: authorizationIds,
                },
              },
            },
            { transaction }
          );
          let deleteauthdata = await ExpenseAuthorizationRequest.destroy(
            {
              where: { ReferenceID: expensedata[n].userExpenseTransactionID },
            },
            {
              transaction,
            }
          );

          const userdata = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: expensedata[n].userMasterID,
            },
          });

          let AuthorizationCriterias = item.AuthorizationCriteriaID;

          let authorizationStatus;
          if (AuthorizationCriterias == 5) {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }
          const findExpenseTransation = await UserExpenseTransaction.findOne({
            where: {
              userExpenseTransactionID: expensedata[n].userExpenseTransactionID,
            },
            transaction,
          });
          let update_expenseStatus = await UserExpenseTransaction.update(
            {
              authorizationStatus:
                userDetailsids.length > 0 ? authorizationStatus : 0,
              updateBy: req.body.createBy,
              AuthorizationCriteriaID:
                userDetailsids.length > 0
                  ? findExpenseTransation.AuthorizationCriteriaID
                  : null,
            },
            {
              where: {
                userExpenseTransactionID:
                  expensedata[n].userExpenseTransactionID,
              },
              transaction,
            }
          );

          if (AuthorizationCriterias == 5) {
            if (userDetailsids.length > 0) {
              let insert_db_status1 = await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: expensedata[n].userExpenseTransactionID,
                  userMasterID: userDetailsids[0],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.userMasterID,
                },
                { transaction }
              );

              await UserInbox.create(
                {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                  assignedTo: userDetailsids[0],
                  assignedBy: userdata.userMasterID,
                },

                { transaction }
              );
            }
          } else {
            for (let i = 0; i < userDetailsids.length; i++) {
              let insert_db_status1 = await ExpenseAuthorizationRequest.create(
                {
                  ReferenceID: expensedata[n].userExpenseTransactionID,
                  userMasterID: userDetailsids[i],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.userMasterID,
                },
                { transaction }
              );

              await UserInbox.create(
                {
                  activityTable: UserExpense.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userdata.displayName} has applied for Expense of ${expensedata[n].expenseAmount}`,
                  assignedTo: userDetailsids[i],
                  assignedBy: userdata.userMasterID,
                },
                { transaction }
              );
            }
          }
          // }
        }
      }

      // //for overtime
      else if (
        item.AuthorizationMasterID == authorizationMasterTypes.overtime
      ) {
        let find_Overtime = await OvertimeCalculation.findAll({
          where: {
            UserMasterID: item.userMasterID,
            AuthorizationRequired: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        for (let j = 0; j < find_Overtime.length; j++) {
          let AuthorizationCriterias = item.AuthorizationCriteriaID;

          let authorizationStatus;

          if (AuthorizationCriterias == 5) {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          let update_overtimeAuthorizationStatus =
            await OvertimeCalculation.update(
              {
                AuthorizationRequired: authorizationStatus,
                updateBy: req.body.createBy,
              },
              {
                where: { OverTimeID: find_Overtime[j].OverTimeID },
                transaction,
              }
            );

          if (AuthorizationCriterias == 5) {
            let findAuthorization = await OvertimeAuthorization.findAll({
              where: {
                ReferenceID: find_Overtime[j].OverTimeID,
                status: 1,
              },
            });

            let delete_record = await OvertimeAuthorization.destroy(
              {
                where: {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  status: 1,
                },
              },
              { transaction }
            );
            if (userDetailsids.length > 0) {
              let insert_db_status1 = await OvertimeAuthorization.create(
                {
                  ReferenceID: find_Overtime[j].OverTimeID,
                  userMasterID: userDetailsids[0],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                },
                { transaction }
              );
            }
          } else {
            let findAuthorization = await OvertimeAuthorization.findAll({
              where: {
                ReferenceID: find_Overtime[j].OverTimeID,
                status: 1,
              },
            });

            if (findAuthorization.length > 0) {
              let delete_record = await OvertimeAuthorization.destroy(
                {
                  where: {
                    ReferenceID: find_Overtime[j].OverTimeID,
                    status: 1,
                  },
                },
                {
                  transaction,
                }
              );
            }

            for (let k = 0; k < userDetailsids.length; k++) {
              let insert_db_status1 = await OvertimeAuthorization.create({
                ReferenceID: find_Overtime[j].OverTimeID,
                userMasterID: userDetailsids[k],
                status: 1,
                authstatus: 2,
                createBy: req.body.createBy,
                createByIp: req.body.createByIp,
              });
            }
          }
          // }
        }
      }

      //Resignation
      else if (
        item.AuthorizationMasterID == authorizationMasterTypes.resignation
      ) {
        let find_Resignation = await UserResignation.findAll({
          where: {
            userMasterID: item.userMasterID,
            authorizationstatus: {
              [Sequelize.Op.in]: [1, 2],
            },
          },
        });

        if (find_Resignation.length > 0) {
          let AuthorizationCriterias = item.AuthorizationCriteriaID;

          let authorizationStatus;

          if (AuthorizationCriterias == 5) {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          for (let j = 0; j < find_Resignation.length; j++) {
            let update_resignationAuthorizationStatus =
              await UserResignation.update(
                {
                  authorizationstatus:
                    userDetailsids.length > 0 ? authorizationStatus : 0,
                  updateBy: req.body.createBy,
                },
                {
                  where: { resignationID: find_Resignation[j].resignationID },
                }
              );

            if (AuthorizationCriterias == 5) {
              let findAuthorization = await ResignationAuth.findAll({
                where: {
                  ReferenceID: find_Resignation[j].resignationID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await ResignationAuth.destroy({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });
                if (userDetailsids.length > 0) {
                  let insert_db_status1 = await ResignationAuth.create({
                    ReferenceID: find_Resignation[j].resignationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: req.body.createBy,
                    createByIp: req.body.createByIp,
                  });
                }
              }
            } else {
              let findAuthorization = await ResignationAuth.findAll({
                where: {
                  ReferenceID: find_Resignation[j].resignationID,
                  status: 1,
                },
              });

              if (findAuthorization.length > 0) {
                let delete_record = await ResignationAuth.destroy({
                  where: {
                    ReferenceID: find_Resignation[j].resignationID,
                    status: 1,
                  },
                });
              }

              for (let k = 0; k < userDetailsids.length; k++) {
                let insert_db_status1 = await ResignationAuth.create({
                  ReferenceID: find_Resignation[j].resignationID,
                  userMasterID: userDetailsids[k],
                  status: 1,
                  authstatus: 2,
                  createBy: req.body.createBy,
                  createByIp: req.body.createByIp,
                });
              }
            }
          }
        }
      }
      //Employee Gate Pass
      else if (
        item.AuthorizationMasterID == authorizationMasterTypes.employeeGatePass
      ) {
        let findgatepass = await EmployeeGatepass.findAll({
          where: {
            userMasterId: item.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 'Pending',
          },
        });

        for (let j = 0; j < findgatepass.length; j++) {
          let authorizationStatus;

          if (item.AuthorizationCriteriaID == 5) {
            authorizationStatus = 2;
          } else {
            authorizationStatus = 1;
          }

          await EmployeeGatepass.update(
            {
              authorizationStatus:
                userDetailsids.length > 0 ? authorizationStatus : 0,
              updateBy: req.body.createBy,
              updateByIp: req.body.createByIp,
            },
            {
              where: {
                id: findgatepass[j].id,
              },
              transaction,
            }
          );

          if (authorizationStatus == 2) {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction }
            );

            await GatePassAuthorizationRequest.destroy(
              {
                where: {
                  ReferenceID: findgatepass[j].id,
                  status: 1,
                },
              },
              {
                transaction,
              }
            );

            if (userDetailsids.length > 0) {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: userDetailsids[0],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,

                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for GatePass request ${moment(
                    findgatepass[j].date
                  ).format('DD/MM/YYYY')} `,
                  assignedTo: userDetailsids[0],
                  assignedBy: findgatepass[j].userMasterId,
                },
                { transaction }
              );

              const notification = {
                title: 'GatePass',
                body: userinfo.displayName + ' requested for GatePass.',
              };
              const data = {
                screen: 'gatepassauth',
              };
              await sendNotification(userDetailsids[0], notification, data);
            }
          } else {
            let findAuthorization = await GatePassAuthorizationRequest.findAll({
              where: {
                ReferenceID: findgatepass[j].id,
                status: 1,
              },
            });

            const authorizationIds = findAuthorization.map(
              (e) => e.AuthorizationRequestId
            );

            await UserInbox.destroy(
              {
                where: {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK: {
                    [Sequelize.Op.in]: authorizationIds,
                  },
                },
              },
              { transaction }
            );

            await GatePassAuthorizationRequest.destroy(
              {
                where: {
                  ReferenceID: findgatepass[j].id,
                  status: 1,
                },
              },
              { transaction }
            );

            for (let k = 0; k < userDetailsids.length; k++) {
              let insert_db_status1 = await GatePassAuthorizationRequest.create(
                {
                  TableName: 'EmployeeGatePass',
                  ReferenceID: findgatepass[j].id,
                  userMasterID: userDetailsids[k],
                  status: 1,
                  authstatus: 2,
                  createBy: findgatepass[j].createBy,
                  createByIp: findgatepass[j].createByIp,
                },
                {
                  transaction,
                }
              );

              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: findgatepass[j].userMasterId,
                },
              });

              await UserInbox.create(
                {
                  activityTable: GatePassAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${
                    userinfo.displayName
                  } has applied for GatePass request ${moment(
                    findgatepass[j].date
                  ).format('DD/MM/YYYY')} `,
                  assignedTo: userDetailsids[k],
                  assignedBy: findgatepass[j].userMasterID,
                },
                { transaction }
              );

              const notification = {
                title: 'GatePass',
                body: userinfo.displayName + ' requested for GatePass.',
              };
              const data = {
                screen: 'gatepassauth',
              };
              await sendNotification(userDetailsids[k], notification, data);
            }
          }
        }
      }
      //Coff
      else if (
        item.AuthorizationMasterID == authorizationMasterTypes.compensatoryOff
      ) {
        const findcoff = await coffMaster.findAll({
          where: {
            userMasterID: item.userMasterID,
            authorizationStatus: {
              [Sequelize.Op.in]: [1, 2],
            },
            status: 1,
          },
        });

        const authorizationStatus = item.AuthorizationCriteriaID == 5 ? 2 : 1;

        const AllCoffMasterIDs = findcoff.map((e) => e.coffMasterID);

        await coffMaster.update(
          {
            authorizationStatus:
              userDetailsids.length > 0 ? authorizationStatus : 0,
            updateBy: req.body.createBy,
            updateByIp: req.body.createByIp,
          },
          {
            where: {
              coffMasterID: {
                [Sequelize.Op.in]: AllCoffMasterIDs,
              },
            },
            transaction,
          }
        );

        const userinfo = await UserMaster.findOne({
          where: {
            userMasterID: item.userMasterID,
          },
          transaction,
        });

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
            { transaction }
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
                transaction,
              }
            );
          }

          if (authorizationStatus == 2) {
            if (userDetailsids.length > 0) {
              const insert_db_status1 =
                await CompensatoryOffAuthorization.create(
                  {
                    TableName: 'coffMaster',
                    coffMasterID: findcoff[j].coffMasterID,
                    userMasterID: userDetailsids[0],
                    status: 1,
                    authstatus: 2,
                  },
                  { user: req.userDetails, transaction }
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
                  assignedTo: userDetailsids[0],
                  assignedBy: findcoff[j].userMasterID,
                },
                { transaction }
              );

              await sendNotification(userDetailsids[0], notification, data);
            }
          } else {
            for (let k = 0; k < userDetailsids.length; k++) {
              let insert_db_status1 = await CompensatoryOffAuthorization.create(
                {
                  TableName: 'coffMaster',
                  coffMasterID: findcoff[j].coffMasterID,
                  userMasterID: userDetailsids[k],
                  status: 1,
                  authstatus: 2,
                },
                {
                  user: req.userDetails,
                  transaction,
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
                  assignedTo: userDetailsids[k],
                  assignedBy: findcoff[j].userMasterID,
                },
                { transaction }
              );

              await sendNotification(userDetailsids[k], notification, data);
            }
          }
        }
      }
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.authorizationCriteriaMasterUpdate,
      // data: authDetails,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
