const Sequelize = require('sequelize');
const UserLeave = require('../models/userleave');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const LeaveAuthorizationRequest = require('../models/leaveAuthorization');
const userLeaveTransactions = require('../models/userLeaveTransaction');

const Notification = require('../config/firebase');
const { executeQuery } = require('./common.controller');
const MailTemplateEditor = require('../models/mailTemplateEditor');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const { sendEmailForLeave } = require('../middleware/sendemail');
const {
  sendNotification,
  employeeeLeaveBalance,
  employeePendingLeaveBalance,
  asiaKolkataDateTime,
  checkUserLeaveBalance,
  checkEmployeeLeavePolicyWhenLeaveApply,
  isValidDate,
  checkUserLeaveBalanceNew,
  destroyLeaveAuthAndApprovedLeaveAuth,
  findCompanyNotificationPolicy,
} = require('../utils/commonUtilFunctions');
const {
  FileUploadType,
  leaveOperationENUM,
  authorizationMasterTypes,
  authorizationCriteriaType,
} = require('../utils/dbUtils');
const UserLeaveLapse = require('../models/userLeaveLapse');
const fs = require('fs');
const UserInbox = require('../models/UserInbox');

const moment = require('moment');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const { CustomError } = require('../utils/customError');
const { appURL } = require('../utils/labelUtils');
const {
  genrateDemoExcelForManualLeave,
  generateExcel,
} = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const path = require('path');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const ApprovedLeaveAuthorization = require('../models/approvedLeaveAuthorization');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const LeaveEncashment = require('../models/leaveEncashment');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { encodeSecureBreak } = require('../utils/commonUtilFunctions');
exports.getUserLeaveBalance = async (req, res, next) => {
  try {
    const { companyMasterID, userMasterID } = req.query;

    const userBalance = await employeeeLeaveBalance(
      companyMasterID,
      userMasterID
    );

    return res.status(200).json({
      status: 200,
      data: userBalance,
    });
  } catch (error) {
    next(error);
  }
};

exports.lapseLeaveBalance = async (req, res, next) => {
  try {
    const { companyId, branchId } = req.query;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const currentmonth = currentdate.slice(0, 4) + currentdate.slice(5, 7);

    const createBy = req.userDetails.userMasterId;
    const createbyIp = req.userDetails.userIpAddress;

    const companyuser = await UserMaster.findAll({
      where: {
        companyMasterId: companyId,
      },
      include: [
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            ...(branchId && { branchID: branchId }),
            applicableDate: { [Sequelize.Op.lte]: currentdate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentdate } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          required: branchId ? true : false,
          attributes: ['branchID'],
        },
      ],
    });

    const finalData = [];

    await Promise.all(
      companyuser.map(async (e) => {
        const leaveBalance = await employeeeLeaveBalance(
          companyId,
          e.userMasterID
        );
        if (leaveBalance.length > 0) {
          leaveBalance.map((l) => {
            // if (l.Leave_CF == 'N') {
            finalData.push({
              userMasterID: e.userMasterID,
              LeaveTranId: l.LeaveTranId,
              LapseDays: +l.Balance,
              LapseYearMonth: currentmonth,
              status: 1,
              createBy: createBy,
              createByIp: createbyIp,
            });
            // }
          });
        }
      })
    );

    await UserLeaveLapse.bulkCreate(finalData);

    return res.status(200).json({
      status: 200,
      message: 'Leaves Lapse successfully.',
    });
  } catch (error) {
    next(error);
  }
};

//save the data
exports.postAddLeave = async (req, res, next) => {
  try {
    let {
      LeaveTranId,
      userMasterID,
      companyMasterID,
      FromDate,
      ToDate,
      LeaveDays,
      Remark,
      DayType,
      CreateBy,
      CreatedIp,
    } = await req.body;

    {
      const findLeave = await executeQuery(
        `SELECT * from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID"=` +
          userMasterID +
          ` and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
          FromDate +
          `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
          ToDate +
          `')`
      );

      if (findLeave.length > 0) {
        if (DayType == 'Full Day') {
          return res.status(200).json({
            status: 401,
            message: 'You have already applied for leave within these range',
          });
        }

        for (var j = 0; j < findLeave.length; j++) {
          if (
            findLeave[j].DayType == DayType ||
            findLeave[j].DayType == 'Full Day'
          ) {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }
        }
      }
    }

    {
      const findLeave = await UserLeave.findAll({
        raw: true,
        where: {
          status: 1,
          userMasterID: userMasterID,
          [Sequelize.Op.or]: [
            {
              FromDate: {
                [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
              },
            },
            {
              ToDate: {
                [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
              },
            },
            {
              FromDate: {
                [Sequelize.Op.lte]: new Date(FromDate),
              },
              ToDate: { [Sequelize.Op.gte]: new Date(ToDate) },
            },
          ],
          authorizationStatus: [0, 1, 2],
        },
      });
      if (findLeave.length > 0) {
        if (DayType == 'Full Day') {
          return res.status(200).json({
            status: 401,
            message: 'You have already applied for leave within these range',
          });
        }

        for (var j = 0; j < findLeave.length; j++) {
          if (
            findLeave[j].DayType == DayType ||
            findLeave[j].DayType == 'Full Day'
          ) {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }
        }
      }
    }

    let insert_db_status = await UserLeave.create({
      LeaveTranId,
      userMasterID,
      companyMasterID,
      FromDate,
      ToDate,
      LeaveDays,
      Remark,
      DayType,
      CreateBy,
      CreatedIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.userleaveadd,
      data: insert_db_status,
    });
    return insert_db_status;
  } catch (error) {}
};

/**
 Create BulkUser Leave

 */

exports.postBulkAddLeave_Web = async (req, res, next) => {
  try {
    const formData = req.body;
    const files = req.files;

    const entryCount = Object.keys(formData).filter((key) =>
      key.startsWith('FromDate')
    ).length;

    const leavedata = [];
    let index_attch = 0;
    for (let i = 0; i < entryCount; i++) {
      const checkAttach = formData[`isattachment${i}`] == 'yes' ? true : false;
      leavedata.push({
        LeaveTranId: +formData[`LeaveTranId${i}`],
        userMasterID: +formData[`userMasterID${i}`],
        FromDate: formData[`FromDate${i}`],
        ToDate: formData[`ToDate${i}`],
        companyMasterID: +formData[`companyMasterID${i}`],
        LeaveDays: +formData[`LeaveDays${i}`],
        Remark: formData[`Remark${i}`],
        DayType: formData[`DayType${i}`],
        Authorization: formData[`Authorization${i}`],
        status: 1,
        attachment:
          files[index_attch] && checkAttach
            ? files[index_attch].filename
            : null,
        createBy: req.userDetails.userMasterId,
        createByIp: formData[`createByIp${i}`]
          ? formData[`createByIp${i}`]
          : null,
        leaveFrom: formData[`leaveFrom${i}`],
      });

      if (checkAttach) index_attch++;
    }

    const leaveMessage = await checkUserLeaveBalance(leavedata, 'add');

    if (leaveMessage) {
      return res.status(200).json({
        status: 401,
        message: leaveMessage,
      });
    }

    // If the leave is not applied manually, check the leave policy
    if (leavedata.length > 0 && leavedata[0].leaveFrom != 'manual') {
      const leaveApplyMessage = await checkEmployeeLeavePolicyWhenLeaveApply(
        leavedata,
        'add'
      );

      if (leaveApplyMessage)
        return res.status(200).json({
          status: 401,
          message: leaveApplyMessage,
        });
    }

    const allUserIds = [...new Set(leavedata.map((e) => +e.userMasterID))];

    const AllUsersAuthorizationdetails = await AuthorizationDetails.findAll({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave,
        userMasterID: allUserIds,
        status: 1,
      },
    });

    for (let i = 0; i < leavedata.length; i++) {
      if (new Date(leavedata[i].FromDate) > new Date(leavedata[i].ToDate)) {
        return res.status(200).json({
          status: 401,
          message: 'Invalid From date and To date!',
        });
      }

      //For Cancelled & Approved
      {
        const findLeave = await executeQuery(
          `SELECT * from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID"=` +
            leavedata[i].userMasterID +
            ` and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
            leavedata[i].FromDate +
            `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
            leavedata[i].ToDate +
            `')`
        );

        if (findLeave.length > 0) {
          if (leavedata[i].DayType == 'Full Day') {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }

          for (var j = 0; j < findLeave.length; j++) {
            if (
              findLeave[j].DayType == leavedata[i].DayType ||
              findLeave[j].DayType == 'Full Day'
            ) {
              return res.status(200).json({
                status: 401,
                message:
                  'You have already applied for leave within these range',
              });
            }
          }
        }
      }

      //For Pending
      {
        const findLeave = await UserLeave.findAll({
          raw: true,
          where: {
            status: 1,
            userMasterID: leavedata[i].userMasterID,
            [Sequelize.Op.or]: [
              {
                FromDate: {
                  [Sequelize.Op.between]: [
                    new Date(leavedata[i].FromDate),
                    new Date(leavedata[i].ToDate),
                  ],
                },
              },
              {
                ToDate: {
                  [Sequelize.Op.between]: [
                    new Date(leavedata[i].FromDate),
                    new Date(leavedata[i].ToDate),
                  ],
                },
              },
              {
                FromDate: {
                  [Sequelize.Op.lte]: new Date(leavedata[i].FromDate),
                },
                ToDate: { [Sequelize.Op.gte]: new Date(leavedata[i].ToDate) },
              },
            ],
            authorizationStatus: [0, 1, 2],
          },
        });
        if (findLeave.length > 0) {
          if (leavedata[i].DayType == 'Full Day') {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }

          for (let j = 0; j < findLeave.length; j++) {
            if (
              findLeave[j].DayType == leavedata[i].DayType ||
              findLeave[j].DayType == 'Full Day'
            ) {
              return res.status(200).json({
                status: 401,
                message:
                  'You have already applied for leave within these range',
              });
            }
          }
        }
      }

      const authorizationdetails = AllUsersAuthorizationdetails.find(
        (e) => e.userMasterID == leavedata[i].userMasterID
      );

      if (authorizationdetails) {
        if (
          authorizationdetails.AuthorizationCriteriaID ==
          authorizationCriteriaType.SEQUENCENO
        ) {
          leavedata[i].authorizationStatus = 2;
        } else {
          leavedata[i].authorizationStatus = 1;
        }
      } else {
        leavedata[i].authorizationStatus = 0;
      }
    }

    await sequelize.transaction(async (t) => {
      await UserLeave.bulkCreate(leavedata, {
        individualHooks: true,
        transaction: t,
      }).then(async (response) => {
        if (AllUsersAuthorizationdetails.length) {
          const AllUsersDetails = await UserMaster.findAll({
            where: {
              userMasterID: {
                [Sequelize.Op.in]: allUserIds,
              },
            },
            include: [
              {
                model: EmployeeDesignation,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date() },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date() } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
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
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date() },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date() } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
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
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date() },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date() } },
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
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
            ],
          });

          const get_NotificationPolicy = await findCompanyNotificationPolicy(
            +leavedata?.[0]?.companyMasterID || null
          );

          let get_MailTemplate;

          if (get_NotificationPolicy && +leavedata?.[0]?.companyMasterID) {
            get_MailTemplate = await MailTemplateEditor.findOne({
              where: {
                companyMasterID: leavedata[0].companyMasterID,
                status: 1,
                mailTypeID: 1,
              },
            });
          }

          const allLeaveTypes = await HrLeaveTypes.findAll({
            where: {
              LeaveTranId: [...new Set(response.map((e) => +e.LeaveTranId))],
              status: 1,
            },
            attributes: ['LeaveID', 'LeaveTranId'],
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: ['LeaveName'],
              },
            ],
          });

          for (let i = 0; i < response.length; i++) {
            const authorizationdetails = AllUsersAuthorizationdetails.find(
              (e) => e.userMasterID == response[i].userMasterID
            );

            if (authorizationdetails) {
              const employeeData = AllUsersDetails.find(
                (e) => +e.userMasterID == +response[i].userMasterID
              );

              const employeename = employeeData?.displayName || '';

              if (get_NotificationPolicy) {
                if (get_MailTemplate) {
                  const empcode =
                      employeeData.employeeJoiningDetails?.[0]?.employeeCode ||
                      '',
                    empname = employeename,
                    department =
                      employeeData.employeeDepartments?.[0]?.department
                        ?.departmentName || '',
                    designation =
                      employeeData.employeeDesignations?.[0]?.designation
                        ?.designationName || '',
                    branch =
                      employeeData.employeeBranches?.[0]?.branchMaster
                        ?.branchName || '';

                  const leavetype =
                    allLeaveTypes.find(
                      (e) => +e.LeaveTranId == +response[i].LeaveTranId
                    )?.LeaveMaster?.LeaveName || '';

                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[EmployeeCode]',
                    empcode
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[EmployeeName]',
                    empname
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[ToDate]',
                    leavedata[i].ToDate
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[FromDate]',
                    leavedata[i].FromDate
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[Reason]',
                    leavedata[i].Remark
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[NoOfDays]',
                    leavedata[i].LeaveDays
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[Department]',
                    department
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[Designation]',
                    designation
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[Branch]',
                    branch
                  );
                  get_MailTemplate.subject = get_MailTemplate.subject.replace(
                    '[LeaveType]',
                    leavetype
                  );

                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[EmployeeCode]',
                    empcode
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[EmployeeName]',
                    empname
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[ToDate]',
                    leavedata[i].ToDate
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[FromDate]',
                    leavedata[i].FromDate
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[Reason]',
                    leavedata[i].Remark
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[NoOfDays]',
                    leavedata[i].LeaveDays
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[Department]',
                    department
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[Designation]',
                    designation
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[Branch]',
                    branch
                  );
                  get_MailTemplate.body = get_MailTemplate.body.replace(
                    '[LeaveType]',
                    leavetype
                  );
                }
              }

              if (
                authorizationdetails.AuthorizationCriteriaID ==
                authorizationCriteriaType.SEQUENCENO
              ) {
                let insert_db_status1 = await LeaveAuthorizationRequest.create(
                  {
                    TableName: 'userLeaves',
                    ReferenceID: response[i].UserLeaveApplicationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy: response[i].createBy,

                    createByIp: response[i].createByIp,
                  },
                  { transaction: t }
                );

                await UserInbox.create(
                  {
                    activityTable: LeaveAuthorizationRequest.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().AuthorizationRequestId,
                    message: `${employeename} has applied for leave request from ${moment(
                      response[i].FromDate
                    ).format('DD/MM/YYYY')} to ${moment(
                      response[i].ToDate
                    ).format('DD/MM/YYYY')}`,
                    assignedTo:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    assignedBy: response[i].userMasterID,
                  },
                  { transaction: t }
                );

                const user = await UserMaster.findOne({
                  where: {
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                  },
                });

                if (user && employeeData) {
                  const notification = {
                    title: 'Leave',
                    body: employeeData.displayName + ' requested for leave.',
                  };
                  const data = {
                    screen: 'leaveauth',
                    isScheduled: 'true',
                    scheduledTime: new Date().toISOString(),
                  };
                  await sendNotification(user.userMasterID, notification, data);
                }

                if (
                  user.email &&
                  get_MailTemplate?.body &&
                  insert_db_status1.toJSON().AuthorizationRequestId
                ) {
                  const myTemplate = JSON.parse(
                    JSON.stringify(get_MailTemplate)
                  );
                  let AuthorizationRequestId =
                    insert_db_status1.toJSON().AuthorizationRequestId;
                  const acceptData = {
                    AuthorizationRequestId,
                    type: 'approve',
                  };
                  const rejectData = {
                    AuthorizationRequestId,
                    type: 'reject',
                  };
                  const acceptedSigned = encodeSecureBreak(acceptData);
                  const acceptUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${acceptedSigned}`;
                  const rejectedSigned = encodeSecureBreak(rejectData);
                  const rejectUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${rejectedSigned}`;

                  myTemplate.body = myTemplate.body.replace(
                    `[ApproveButton]`,
                    `<a href="${acceptUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Approve</a>`
                  );

                  myTemplate.body = myTemplate.body.replace(
                    `[RejectButton]`,
                    `<a href="${rejectUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reject</a>`
                  );

                  let data = {
                    email_id: user.email,
                    body: myTemplate.body,
                    subject: myTemplate.subject,
                    email: get_NotificationPolicy.email,
                    password: get_NotificationPolicy.password,
                    port: get_NotificationPolicy.port,
                    host: get_NotificationPolicy.hostmail,
                    secure: get_NotificationPolicy.secure,
                  };

                  sendEmailForLeave(data);
                }
              } else {
                for (
                  var j = 0;
                  j < authorizationdetails.AuthorizedByUserMasterId.length;
                  j++
                ) {
                  let insert_db_status1 =
                    await LeaveAuthorizationRequest.create(
                      {
                        TableName: 'userLeaves',
                        ReferenceID: response[i].UserLeaveApplicationID,
                        userMasterID:
                          authorizationdetails.AuthorizedByUserMasterId[j],
                        status: 1,
                        authstatus: 2,
                        createBy: response[i].createBy,
                        createByIp: response[i].createByIp,
                      },
                      { transaction: t }
                    );

                  await UserInbox.create(
                    {
                      activityTable: LeaveAuthorizationRequest.getTableName(),
                      activityTablePK:
                        insert_db_status1.toJSON().AuthorizationRequestId,
                      message: `${employeename} has applied for leave request from ${moment(
                        response[i].FromDate
                      ).format('DD/MM/YYYY')} to ${moment(
                        response[i].ToDate
                      ).format('DD/MM/YYYY')}`,
                      assignedTo:
                        authorizationdetails.AuthorizedByUserMasterId[j],
                      assignedBy: response[i].userMasterID,
                    },
                    { transaction: t }
                  );

                  const user = await UserMaster.findOne({
                    where: {
                      userMasterID:
                        authorizationdetails.AuthorizedByUserMasterId[j],
                    },
                  });

                  const notification = {
                    title: 'Leave',
                    body: employeeData?.displayName + ' requested for leave.',
                  };
                  const data = {
                    screen: 'leaveauth',
                  };
                  await sendNotification(
                    authorizationdetails.AuthorizedByUserMasterId[j],
                    notification,
                    data
                  );

                  if (
                    user.email &&
                    get_MailTemplate?.body &&
                    insert_db_status1.toJSON().AuthorizationRequestId
                  ) {
                    const myTemplate = JSON.parse(
                      JSON.stringify(get_MailTemplate)
                    );
                    let AuthorizationRequestId =
                      insert_db_status1.toJSON().AuthorizationRequestId;
                    const acceptData = {
                      AuthorizationRequestId,
                      type: 'approve',
                    };
                    const rejectData = {
                      AuthorizationRequestId,
                      type: 'reject',
                    };
                    const acceptedSigned = encodeSecureBreak(acceptData);
                    const acceptUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${acceptedSigned}`;
                    const rejectedSigned = encodeSecureBreak(rejectData);
                    const rejectUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${rejectedSigned}`;

                    myTemplate.body = myTemplate.body.replace(
                      `[ApproveButton]`,
                      `<a href="${acceptUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Approve</a>`
                    );

                    myTemplate.body = myTemplate.body.replace(
                      `[RejectButton]`,
                      `<a href="${rejectUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reject</a>`
                    );

                    let data = {
                      email_id: user.email,
                      body: myTemplate.body,
                      subject: myTemplate.subject,
                      email: get_NotificationPolicy.email,
                      password: get_NotificationPolicy.password,
                      port: get_NotificationPolicy.port,
                      host: get_NotificationPolicy.hostmail,
                      secure: get_NotificationPolicy.secure,
                    };

                    sendEmailForLeave(data);
                  }
                }
              }
            }
          }
        }
      });
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.userleaveadd,
    });
  } catch (err) {
    console.log(err, '-------------------error---------------------');

    next(err);
  }
};

exports.postBulkAddLeave = async (req, res, next) => {
  try {
    const leavedata = req.body;
    const leaveMessage = await checkUserLeaveBalance(leavedata, 'add');

    if (leaveMessage) {
      return res.status(200).json({
        status: 401,
        message: leaveMessage,
      });
    }

    const leaveApplyMessage = await checkEmployeeLeavePolicyWhenLeaveApply(
      leavedata,
      'add'
    );

    if (leaveApplyMessage)
      return res.status(200).json({
        status: 401,
        message: leaveApplyMessage,
      });

    for (let i = 0; i < leavedata.length; i++) {
      if (new Date(leavedata[i].FromDate) > new Date(leavedata[i].ToDate)) {
        return res.status(200).json({
          status: 401,
          message: 'Invalid From date and To date!',
        });
      }

      //For Cancelled & Approved
      {
        const findLeave = await executeQuery(
          `SELECT * from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID"=` +
            leavedata[i].userMasterID +
            ` and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
            leavedata[i].FromDate +
            `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
            leavedata[i].ToDate +
            `')`
        );

        if (findLeave.length > 0) {
          if (leavedata[i].DayType == 'Full Day') {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }

          for (var j = 0; j < findLeave.length; j++) {
            if (
              findLeave[j].DayType == leavedata[i].DayType ||
              findLeave[j].DayType == 'Full Day'
            ) {
              return res.status(200).json({
                status: 401,
                message:
                  'You have already applied for leave within these range',
              });
            }
          }
        }
      }

      //For Pending
      {
        const findLeave = await UserLeave.findAll({
          raw: true,
          where: {
            status: 1,
            userMasterID: leavedata[i].userMasterID,
            [Sequelize.Op.or]: [
              {
                FromDate: {
                  [Sequelize.Op.between]: [
                    new Date(leavedata[i].FromDate),
                    new Date(leavedata[i].ToDate),
                  ],
                },
              },
              {
                ToDate: {
                  [Sequelize.Op.between]: [
                    new Date(leavedata[i].FromDate),
                    new Date(leavedata[i].ToDate),
                  ],
                },
              },
              {
                FromDate: {
                  [Sequelize.Op.lte]: new Date(leavedata[i].FromDate),
                },
                ToDate: { [Sequelize.Op.gte]: new Date(leavedata[i].ToDate) },
              },
            ],
            authorizationStatus: [0, 1, 2],
          },
        });
        if (findLeave.length > 0) {
          if (leavedata[i].DayType == 'Full Day') {
            return res.status(200).json({
              status: 401,
              message: 'You have already applied for leave within these range',
            });
          }

          for (let j = 0; j < findLeave.length; j++) {
            if (
              findLeave[j].DayType == leavedata[i].DayType ||
              findLeave[j].DayType == 'Full Day'
            ) {
              return res.status(200).json({
                status: 401,
                message:
                  'You have already applied for leave within these range',
              });
            }
          }
        }
      }

      let authorizationdetails = await AuthorizationDetails.findOne({
        where: {
          AuthorizationMasterID: authorizationMasterTypes.leave,
          userMasterID: leavedata[i].userMasterID,
          status: 1,
        },
        raw: true,
      });

      if (authorizationdetails) {
        let AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID:
              authorizationdetails.AuthorizationCriteriaID,
            status: 1,
          },
          raw: true,
        });

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          leavedata[i].authorizationStatus = 2;
        } else {
          leavedata[i].authorizationStatus = 1;
        }
      } else {
        leavedata[i].authorizationStatus = 0;
      }
    }

    await sequelize.transaction(async (t) => {
      let add_data = await UserLeave.bulkCreate(leavedata, {
        individualHooks: true,
        transaction: t,
      }).then(async (response) => {
        for (let i = 0; i < response.length; i++) {
          let authorizationdetails = await AuthorizationDetails.findOne({
            where: {
              AuthorizationMasterID: authorizationMasterTypes.leave,
              userMasterID: response[i].userMasterID,
              status: 1,
            },
            raw: true,
          });

          if (authorizationdetails) {
            let employee_name = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: response[i].userMasterID,
                status: 1,
              },
              attributes: ['displayName'],
            });
            const employeename = employee_name ? employee_name.displayName : '';

            let AuthorizationCriterias = await AuthorizationCriteria.findOne({
              where: {
                AuthorizationCriteriaID:
                  authorizationdetails.AuthorizationCriteriaID,
                status: 1,
              },
              raw: true,
            });

            //Mail for Leave..........

            let get_MailTemplate;
            let get_NotificationPolicy = findCompanyNotificationPolicy(
              +leavedata[i].companyMasterID
            );

            if (get_NotificationPolicy) {
              get_MailTemplate = await MailTemplateEditor.findOne({
                raw: true,
                where: {
                  companyMasterID: leavedata[i].companyMasterID,
                  status: 1,
                  mailTypeID: 1,
                },
              });

              if (get_MailTemplate) {
                let leavetype = '',
                  empcode = '',
                  empname = '',
                  department = '',
                  designation = '',
                  branch = '';

                let emp_name = await UserMaster.findOne({
                  raw: true,
                  where: {
                    userMasterID: leavedata[i].userMasterID,
                    status: 1,
                  },
                  attributes: ['displayName'],
                });
                empname = emp_name ? emp_name.displayName : '';

                let emp_code = await EmployeeJoiningDetails.findOne({
                  raw: true,
                  where: {
                    userMasterID: leavedata[i].userMasterID,
                    status: 1,
                  },
                  attributes: ['employeeCode'],
                });
                empcode = emp_code ? emp_code.employeeCode : '';

                let leave_type = await HrLeaveTypes.findOne({
                  raw: true,
                  where: {
                    LeaveTranId: leavedata[i].LeaveTranId,
                    status: 1,
                  },
                  attributes: ['LeaveID'],
                  include: [
                    {
                      model: HrLeaveMaster,
                      as: 'LeaveMaster',
                      attributes: ['LeaveName'],
                    },
                  ],
                });
                leavetype = leave_type
                  ? leave_type['LeaveMaster.LeaveName']
                  : '';

                let emp_branch = await EmployeeBranch.findOne({
                  raw: true,
                  where: {
                    userMasterID: leavedata[i].userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.lte]: new Date(),
                    },
                    [Sequelize.Op.or]: [
                      {
                        endDate: { [Sequelize.Op.gte]: new Date() },
                      },
                      {
                        endDate: { [Sequelize.Op.eq]: null },
                      },
                    ],
                  },
                  attributes: ['branchID'],
                  include: [
                    {
                      model: BranchMaster,
                      as: 'branchMaster',
                      attributes: ['branchName'],
                    },
                  ],
                });
                branch = emp_branch
                  ? emp_branch['branchMaster.branchName']
                  : '';

                let emp_department = await EmployeeDepartment.findOne({
                  raw: true,
                  where: {
                    userMasterID: leavedata[i].userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.lte]: new Date(),
                    },
                    [Sequelize.Op.or]: [
                      {
                        endDate: { [Sequelize.Op.gte]: new Date() },
                      },
                      {
                        endDate: { [Sequelize.Op.eq]: null },
                      },
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
                });
                department = emp_department
                  ? emp_department['department.departmentName']
                  : '';

                let emp_designation = await EmployeeDesignation.findOne({
                  raw: true,
                  where: {
                    userMasterID: leavedata[i].userMasterID,
                    status: 1,
                    applicableDate: {
                      [Sequelize.Op.lte]: new Date(),
                    },
                    [Sequelize.Op.or]: [
                      {
                        endDate: { [Sequelize.Op.gte]: new Date() },
                      },
                      {
                        endDate: { [Sequelize.Op.eq]: null },
                      },
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
                });
                designation = emp_designation
                  ? emp_designation['designation.designationName']
                  : '';

                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[EmployeeCode]',
                  empcode
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[EmployeeName]',
                  empname
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[ToDate]',
                  leavedata[i].ToDate
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[FromDate]',
                  leavedata[i].FromDate
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[Reason]',
                  leavedata[i].Remark
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[NoOfDays]',
                  leavedata[i].LeaveDays
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[Department]',
                  department
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[Designation]',
                  designation
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[Branch]',
                  branch
                );
                get_MailTemplate.subject = get_MailTemplate.subject.replace(
                  '[LeaveType]',
                  leavetype
                );

                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[EmployeeCode]',
                  empcode
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[EmployeeName]',
                  empname
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[ToDate]',
                  leavedata[i].ToDate
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[FromDate]',
                  leavedata[i].FromDate
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[Reason]',
                  leavedata[i].Remark
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[NoOfDays]',
                  leavedata[i].LeaveDays
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[Department]',
                  department
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[Designation]',
                  designation
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[Branch]',
                  branch
                );
                get_MailTemplate.body = get_MailTemplate.body.replace(
                  '[LeaveType]',
                  leavetype
                );
              }
            }

            if (
              AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No'
            ) {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: response[i].UserLeaveApplicationID,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[0],
                  status: 1,
                  authstatus: 2,
                  createBy: response[i].createBy,

                  createByIp: response[i].createByIp,
                },
                { transaction: t }
              );

              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${employeename} has applied for leave request from ${moment(
                    response[i].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    response[i].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
                  assignedBy: response[i].userMasterID,
                },
                { transaction: t }
              );

              let user = await UserMaster.findOne({
                where: {
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[0],
                },
              });
              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: response[i].userMasterID,
                },
              });

              if (user && userinfo) {
                const notification = {
                  title: 'Leave',
                  body: userinfo.displayName + ' requested for leave.',
                };
                const data = {
                  screen: 'leaveauth',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };
                await sendNotification(user.userMasterID, notification, data);
              }

              if (user.email && get_MailTemplate) {
                let data = {
                  email_id: user.email,
                  body: get_MailTemplate.body,
                  subject: get_MailTemplate.subject,
                  email: get_NotificationPolicy.email,
                  password: get_NotificationPolicy.password,
                  port: get_NotificationPolicy.port,
                  host: get_NotificationPolicy.hostmail,
                  secure: get_NotificationPolicy.secure,
                };

                sendEmailForLeave(data);
              }
            } else {
              for (
                var j = 0;
                j < authorizationdetails.AuthorizedByUserMasterId.length;
                j++
              ) {
                let insert_db_status1 = await LeaveAuthorizationRequest.create(
                  {
                    TableName: 'userLeaves',
                    ReferenceID: response[i].UserLeaveApplicationID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[j],
                    status: 1,
                    authstatus: 2,
                    createBy: response[i].createBy,
                    createByIp: response[i].createByIp,
                  },
                  { transaction: t }
                );

                await UserInbox.create(
                  {
                    activityTable: LeaveAuthorizationRequest.getTableName(),
                    activityTablePK:
                      insert_db_status1.toJSON().AuthorizationRequestId,
                    message: `${employeename} has applied for leave request from ${moment(
                      response[i].FromDate
                    ).format('DD/MM/YYYY')} to ${moment(
                      response[i].ToDate
                    ).format('DD/MM/YYYY')}`,
                    assignedTo:
                      authorizationdetails.AuthorizedByUserMasterId[j],
                    assignedBy: response[i].userMasterID,
                  },
                  { transaction: t }
                );

                let user = await UserMaster.findOne({
                  where: {
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[j],
                  },
                });
                let userinfo = await UserMaster.findOne({
                  where: {
                    // userMasterID:response[i].createBy
                    userMasterID: response[i].userMasterID,
                  },
                });
                const notification = {
                  title: 'Leave',
                  body: userinfo.displayName + ' requested for leave.',
                };
                const data = {
                  screen: 'leaveauth',
                };
                await sendNotification(
                  authorizationdetails.AuthorizedByUserMasterId[j],
                  notification,
                  data
                );

                if (user.email && get_MailTemplate) {
                  let data = {
                    email_id: user.email,
                    body: get_MailTemplate.body,
                    subject: get_MailTemplate.subject,
                    email: get_NotificationPolicy.email,
                    password: get_NotificationPolicy.password,
                    port: get_NotificationPolicy.port,
                    host: get_NotificationPolicy.hostmail,
                    secure: get_NotificationPolicy.secure,
                  };

                  sendEmailForLeave(data);
                }
              }
            }
          }
        }
      });
      return res.status(200).json({
        status: 200,
        message: message.usermessage.userleaveadd,
        data: add_data,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      return res
        .status(200)
        .json({ status: 401, message: err.message, data: {} });
    }
  }
};

/**
 return all userLeave data
 */

exports.getAllUserLeaveData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let userleave = [];
    if (limit == '' && page == '') {
      userleave = await UserLeave.findAll({
        raw: true,
        where: {
          Status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      userleave = await UserLeave.findAll({
        raw: true,
        where: {
          Status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await UserLeave.count({
      raw: true,
      where: { Status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: userleave, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with  UserLeaveApplicationID id
 *
 * @param {id} UserLeaveApplicationID  to fetch userleave
 */

exports.getLeaveById = async (req, res, next) => {
  try {
    let get_one_data = await UserLeave.findOne({
      where: {
        UserLeaveApplicationID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with  UserMasterID id
 *
 * @param {id} UserLeaveApplicationID  to fetch userleave
 */

exports.getLeaveByUserId = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      isSocketRequest,
    } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: [0, 1] };
    condition.userMasterID = userMasterID;

    if (startdate && enddate)
      condition.FromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          Remark: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const userLeaves = await UserLeave.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['FromDate', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          required: true,
          model: HrLeaveTypes,
          where: {
            LeaveID: {
              [Sequelize.Op.ne]: 25,
            },
          },
          include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
        },
        { model: companyMaster },
      ],
    });

    for (var j = 0; j < userLeaves.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: userLeaves.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: userLeaves.rows[j].updateBy,
        },
      });

      if (user1) {
        userLeaves.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        userLeaves.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    // let userleavetype, totalcount;
    // if (searchQuery && page && limit) {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       [Sequelize.Op.or]: [
    //         {
    //           Remark: {
    //             [Sequelize.Op.iLike]: '%' + searchQuery + '%',
    //           },
    //         },
    //       ],
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     limit: limit,
    //     offset: offset,
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       [Sequelize.Op.or]: [
    //         {
    //           Remark: {
    //             [Sequelize.Op.iLike]: '%' + searchQuery + '%',
    //           },
    //         },
    //       ],
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //   });
    // } else if (searchQuery && page == '' && limit == '') {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       [Sequelize.Op.or]: [
    //         {
    //           Remark: {
    //             [Sequelize.Op.iLike]: '%' + searchQuery + '%',
    //           },
    //         },
    //       ],
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     limit: limit,
    //     offset: offset,
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       [Sequelize.Op.or]: [
    //         {
    //           Remark: {
    //             [Sequelize.Op.iLike]: '%' + searchQuery + '%',
    //           },
    //         },
    //       ],
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //   });
    // } else if (startdate && enddate && page && limit) {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       FromDate: {
    //         [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
    //       },
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     limit: limit,
    //     offset: offset,
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       FromDate: {
    //         [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
    //       },
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //   });
    // } else if (startdate && enddate && page == '' && limit == '') {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       FromDate: {
    //         [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
    //       },
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       FromDate: {
    //         [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
    //       },
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //   });
    // } else if (page == '' && limit == '') {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       status: ['0', '1'],
    //     },
    //   });
    // } else {
    //   const userid = req.body.userMasterID;
    //   userleavetype = await UserLeave.findAll({
    //     where: {
    //       userMasterID: userid,
    //       status: ['0', '1'],
    //     },
    //     order: [['UserLeaveApplicationID', 'DESC']],
    //     limit: limit,
    //     offset: offset,
    //     include: [{ model: UserMaster }, { model: HrLeaveTypes, include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }] }, { model: companyMaster }],
    //   });
    //   for (var j = 0; j < userleavetype.length; j++) {
    //     let user1 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].createBy,
    //       },
    //     });
    //     let user2 = await UserMaster.findOne({
    //       where: {
    //         userMasterID: userleavetype[j].updateBy,
    //       },
    //     });

    //     if (user1) {
    //       userleavetype[j].createBy = user1.dataValues.displayName;
    //     }
    //     if (user2) {
    //       userleavetype[j].updateBy = user2.dataValues.displayName;
    //     }
    //   }
    //   totalcount = await UserLeave.count({
    //     where: {
    //       userMasterID: userid,
    //       status: ['0', '1'],
    //     },
    //   });
    // }

    if (isSocketRequest) return userLeaves.rows;

    return res.status(200).json({
      status: 200,
      data: userLeaves.rows,
      totalcount: userLeaves.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch userleave
 */

exports.getuserleaveCompanyId = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let userleavetype, totalcount;
    if (searchQuery && page && limit) {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
        ],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userleavetype.UserLeaveApplicationID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('userleavetype.UserLeaveApplicationID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          FromDate: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          FromDate: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          FromDate: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          FromDate: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
      });
    } else if (page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
      });
    } else {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await companyMaster.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      userleavetype = await UserLeave.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
        order: [['UserLeaveApplicationID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < userleavetype.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: userleavetype[j].updateBy,
          },
        });

        if (user1) {
          userleavetype[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          userleavetype[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await UserLeave.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: userleavetype, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

// //update the user data

exports.updateUserData = async (req, res, next) => {
  try {
    let {
      UserLeaveApplicationID,
      LeaveTranId,
      userMasterID,
      companyMasterID,
      FromDate,
      ToDate,
      LeaveDays,
      Remark,
      authorizationStatus,
      DayType,
      removeFile,
      updateBy = req.userDetails.userMasterId,
      updateByIp,
    } = await req.body;

    // const updateBy = req.userDetails.userMasterId;

    const findLeave = await UserLeave.findByPk(UserLeaveApplicationID);

    let attachment = null;
    if (removeFile == 1) {
      if (findLeave && findLeave.attachment) {
        const filePath = path.join(
          __dirname,
          `../uploads/employee-leave-attachment/${findLeave.attachment}`
        );

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }
    }

    if (req.file) {
      attachment = req.file.filename;

      if (findLeave && findLeave.attachment) {
        const filePath = path.join(
          __dirname,
          `../uploads/employee-leave-attachment/${findLeave.attachment}`
        );

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }
    } else {
      if (removeFile != 1) attachment = findLeave ? findLeave.attachment : null;
    }

    if (new Date(FromDate) > new Date(ToDate)) {
      return res.status(200).json({
        status: 401,
        message: 'Invalid From date and To date!',
      });
    }

    const leaveData = [req.body];

    leaveData[0].attachment = attachment;

    const leaveMessage = await checkUserLeaveBalance(leaveData, 'update');

    if (leaveMessage) {
      return res.status(200).json({
        status: 401,
        message: leaveMessage,
      });
    }

    const leaveApplyMessage = await checkEmployeeLeavePolicyWhenLeaveApply(
      leaveData,
      'update'
    );
    if (leaveApplyMessage)
      return res.status(200).json({
        status: 401,
        message: leaveApplyMessage,
      });

    let authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave,
        userMasterID: userMasterID,
        status: 1,
      },
      raw: true,
    });

    if (authorizationdetails) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        authorizationStatus = 2;
      } else {
        authorizationStatus = 1;
      }
    } else {
      authorizationStatus = 0;
    }

    let result = await sequelize.transaction(async (t) => {
      let data = await UserLeave.update(
        {
          LeaveTranId,
          userMasterID,
          companyMasterID,
          FromDate,
          ToDate,
          LeaveDays,
          authorizationStatus: authorizationStatus,
          Remark,
          DayType,
          attachment,
          updateBy,
          updateByIp,
        },
        {
          where: { UserLeaveApplicationID: UserLeaveApplicationID },
          transaction: t,
        }
      );

      let leavedata = await UserLeave.findOne({
        where: {
          UserLeaveApplicationID: UserLeaveApplicationID,
        },
        transaction: t,
      });

      let authorizationdetails = await AuthorizationDetails.findOne({
        where: {
          AuthorizationMasterID: authorizationMasterTypes.leave,
          userMasterID: leavedata.userMasterID,
          status: 1,
        },
        transaction: t,
        raw: true,
      });

      if (authorizationdetails) {
        let AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID:
              authorizationdetails.AuthorizationCriteriaID,
            status: 1,
          },
          transaction: t,
          raw: true,
        });

        const leaveAuthorizationRequest =
          await LeaveAuthorizationRequest.findAll({
            where: {
              ReferenceID: UserLeaveApplicationID,
            },
            transaction: t,
          });

        let AuthorizationRequestIds = leaveAuthorizationRequest.map(
          (form) => form.AuthorizationRequestId
        );

        await UserInbox.destroy(
          {
            where: {
              activityTable: LeaveAuthorizationRequest.getTableName(),
              activityTablePK: AuthorizationRequestIds,
            },
          },
          { transaction: t }
        );

        await destroyLeaveAuthAndApprovedLeaveAuth(+UserLeaveApplicationID, t);

        //Mail for Leave..........

        let get_MailTemplate;
        let get_NotificationPolicy =
          await findCompanyNotificationPolicy(+companyMasterID);

        if (get_NotificationPolicy) {
          get_MailTemplate = await MailTemplateEditor.findOne({
            raw: true,
            where: {
              companyMasterID: companyMasterID,
              status: 1,
              mailTypeID: 1,
            },
            transaction: t,
          });

          if (get_MailTemplate) {
            let leavetype = '',
              empcode = '',
              empname = '',
              department = '',
              designation = '',
              branch = '';

            let emp_name = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: userMasterID,
                status: 1,
              },
              attributes: ['displayName'],
              transaction: t,
            });
            empname = emp_name ? emp_name.displayName : '';

            let emp_code = await EmployeeJoiningDetails.findOne({
              raw: true,
              where: {
                userMasterID: userMasterID,
                status: 1,
              },
              transaction: t,
              attributes: ['employeeCode'],
            });
            empcode = emp_code ? emp_code.employeeCode : '';

            let leave_type = await HrLeaveTypes.findOne({
              raw: true,
              where: {
                LeaveTranId: LeaveTranId,
                status: 1,
              },
              transaction: t,
              attributes: ['LeaveID'],
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                  attributes: ['LeaveName'],
                },
              ],
            });
            leavetype = leave_type ? leave_type['LeaveMaster.LeaveName'] : '';

            let emp_branch = await EmployeeBranch.findOne({
              raw: true,
              where: {
                userMasterID: userMasterID,
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date() },
                  },
                  {
                    endDate: { [Sequelize.Op.eq]: null },
                  },
                ],
              },
              transaction: t,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            });
            branch = emp_branch ? emp_branch['branchMaster.branchName'] : '';

            let emp_department = await EmployeeDepartment.findOne({
              raw: true,
              where: {
                userMasterID: userMasterID,
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date() },
                  },
                  {
                    endDate: { [Sequelize.Op.eq]: null },
                  },
                ],
              },
              transaction: t,
              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            });
            department = emp_department
              ? emp_department['department.departmentName']
              : '';

            let emp_designation = await EmployeeDesignation.findOne({
              raw: true,
              where: {
                userMasterID: userMasterID,
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date() },
                  },
                  {
                    endDate: { [Sequelize.Op.eq]: null },
                  },
                ],
              },
              transaction: t,
              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            });
            designation = emp_designation
              ? emp_designation['designation.designationName']
              : '';

            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[EmployeeCode]')
              .join(empcode);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[EmployeeName]')
              .join(empname);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[ToDate]')
              .join(ToDate);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[FromDate]')
              .join(FromDate);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[Reason]')
              .join(Remark);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[NoOfDays]')
              .join(LeaveDays);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[Department]')
              .join(department);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[Designation]')
              .join(designation);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[Branch]')
              .join(branch);
            get_MailTemplate.subject = get_MailTemplate.subject
              .split('[LeaveType]')
              .join(leavetype);

            get_MailTemplate.body = get_MailTemplate.body
              .split('[EmployeeCode]')
              .join(empcode);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[EmployeeName]')
              .join(empname);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[ToDate]')
              .join(ToDate);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[FromDate]')
              .join(FromDate);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[Reason]')
              .join(Remark);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[NoOfDays]')
              .join(LeaveDays);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[Department]')
              .join(department);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[Designation]')
              .join(designation);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[Branch]')
              .join(branch);
            get_MailTemplate.body = get_MailTemplate.body
              .split('[LeaveType]')
              .join(leavetype);
          }
        }

        let employee_name = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: req.body.userMasterID,
            status: 1,
          },
          transaction: t,
          attributes: ['displayName'],
        });
        const employeename = employee_name ? employee_name.displayName : '';

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          let insert_db_status1 = await LeaveAuthorizationRequest.create(
            {
              TableName: 'userLeaves',
              ReferenceID: leavedata.UserLeaveApplicationID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              status: 1,
              authstatus: 2,
              createBy: leavedata.updateBy,
              createByIp: leavedata.updateByIp,
            },
            { transaction: t }
          );

          await UserInbox.create(
            {
              activityTable: LeaveAuthorizationRequest.getTableName(),
              activityTablePK:
                insert_db_status1.toJSON().AuthorizationRequestId,
              message: `${employeename} has applied for leave request from ${moment(
                req.body.FromDate
              ).format('DD/MM/YYYY')} to ${moment(req.body.ToDate).format(
                'DD/MM/YYYY'
              )}`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
              assignedBy: req.body.userMasterID,
            },
            { transaction: t }
          );

          let user = await UserMaster.findOne({
            where: {
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            },
            transaction: t,
          });
          let userinfo = await UserMaster.findOne({
            where: {
              // userMasterID:response[i].createBy
              userMasterID: leavedata.userMasterID,
            },
            transaction: t,
          });
          const notification = {
            title: 'Leave',
            body: userinfo.displayName + ' requested for leave.',
          };
          const data = {
            screen: 'leaveauth',
          };
          await sendNotification(
            authorizationdetails.AuthorizedByUserMasterId[0],
            notification,
            data
          );

          if (user.email && get_MailTemplate) {
            const myTemplate = JSON.parse(JSON.stringify(get_MailTemplate));
            let AuthorizationRequestId =
              insert_db_status1.toJSON().AuthorizationRequestId;
            const acceptData = {
              AuthorizationRequestId,
              type: 'approve',
            };
            const rejectData = {
              AuthorizationRequestId,
              type: 'reject',
            };
            const acceptedSigned = encodeSecureBreak(acceptData);
            const acceptUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${acceptedSigned}`;
            const rejectedSigned = encodeSecureBreak(rejectData);
            const rejectUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${rejectedSigned}`;

            myTemplate.body = myTemplate.body.replace(
              `[ApproveButton]`,
              `<a href="${acceptUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Approve</a>`
            );

            myTemplate.body = myTemplate.body.replace(
              `[RejectButton]`,
              `<a href="${rejectUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reject</a>`
            );

            let data = {
              email_id: user.email,
              body: myTemplate.body,
              subject: myTemplate.subject,
              email: get_NotificationPolicy.email,
              password: get_NotificationPolicy.password,
              port: get_NotificationPolicy.port,
              host: get_NotificationPolicy.hostmail,
              secure: get_NotificationPolicy.secure,
            };

            sendEmailForLeave(data);
          }
        } else {
          for (
            var j = 0;
            j < authorizationdetails.AuthorizedByUserMasterId.length;
            j++
          ) {
            let insert_db_status1 = await LeaveAuthorizationRequest.create(
              {
                TableName: 'userLeaves',
                ReferenceID: leavedata.UserLeaveApplicationID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
                status: 1,
                authstatus: 2,
                createBy: leavedata.updateBy,
                createByIp: leavedata.updateByIp,
              },
              { transaction: t }
            );

            await UserInbox.create(
              {
                activityTable: LeaveAuthorizationRequest.getTableName(),
                activityTablePK:
                  insert_db_status1.toJSON().AuthorizationRequestId,
                message: `${employeename} has applied for leave request from ${moment(
                  req.body.FromDate
                ).format('DD/MM/YYYY')} to ${moment(req.body.ToDate).format(
                  'DD/MM/YYYY'
                )}`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
                assignedBy: req.body.userMasterID,
              },
              { transaction: t }
            );

            let user = await UserMaster.findOne({
              where: {
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
              },
              transaction: t,
            });
            let userinfo = await UserMaster.findOne({
              where: {
                // userMasterID:response[i].createBy
                userMasterID: leavedata.userMasterID,
              },
              transaction: t,
            });

            const notification = {
              title: 'Leave',
              body: userinfo.displayName + ' requested for leave.',
            };
            const data = {
              screen: 'leaveauth',
            };
            await sendNotification(
              authorizationdetails.AuthorizedByUserMasterId[j],
              notification,
              data
            );

            if (user.email && get_MailTemplate) {
              const myTemplate = JSON.parse(JSON.stringify(get_MailTemplate));
              let AuthorizationRequestId =
                insert_db_status1.toJSON().AuthorizationRequestId;
              const acceptData = {
                AuthorizationRequestId,
                type: 'approve',
              };
              const rejectData = {
                AuthorizationRequestId,
                type: 'reject',
              };
              const acceptedSigned = encodeSecureBreak(acceptData);
              const acceptUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${acceptedSigned}`;
              const rejectedSigned = encodeSecureBreak(rejectData);
              const rejectUrl = `${appURL}#/app/attendances/leave_auth_request/2?data=${rejectedSigned}`;

              myTemplate.body = myTemplate.body.replace(
                `[ApproveButton]`,
                `<a href="${acceptUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Approve</a>`
              );

              myTemplate.body = myTemplate.body.replace(
                `[RejectButton]`,
                `<a href="${rejectUrl}" rel="noopener noreferrer" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #f44336; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Reject</a>`
              );

              let data = {
                email_id: user.email,
                body: myTemplate.body,
                subject: myTemplate.subject,
                email: get_NotificationPolicy.email,
                password: get_NotificationPolicy.password,
                port: get_NotificationPolicy.port,
                host: get_NotificationPolicy.hostmail,
                secure: get_NotificationPolicy.secure,
              };
              sendEmailForLeave(data);
            }
          }
        }
      }
    });
    return res.status(200).json({
      status: 200,
      // msg: data,
      message: message.usermessage.userleaveupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id}  UserLeaveApplicationID to update status of user experience
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { UserLeaveApplicationID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await UserLeave.update(
          {
            status: '1',
          },
          {
            where: {
              UserLeaveApplicationID: UserLeaveApplicationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await UserLeave.update(
          {
            status: '0',
          },
          {
            where: {
              UserLeaveApplicationID: UserLeaveApplicationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.userleaveupdate,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

// /*
// *
// delete by id
// * Delete User Data by UserLeaveApplicationID
// *
// */

exports.deleteUserData = async (req, res, next) => {
  try {
    let LeaveID = await req.params.id;
    let result = await sequelize.transaction(async (t) => {
      const leaveAuthorizationRequest = await LeaveAuthorizationRequest.findAll(
        {
          raw: true,
          where: { ReferenceID: LeaveID },
          attributes: ['AuthorizationRequestId'],
          transaction: t,
        }
      );

      let AuthorizationRequestIds = leaveAuthorizationRequest.map(
        (form) => form.AuthorizationRequestId
      );

      await UserInbox.destroy(
        {
          where: {
            activityTable: LeaveAuthorizationRequest.getTableName(),
            activityTablePK: AuthorizationRequestIds,
          },
        },
        { transaction: t }
      );

      let delete_status1 = await LeaveAuthorizationRequest.update(
        {
          status: 2,
        },
        {
          where: { ReferenceID: LeaveID },
          transaction: t,
        }
      );
      let delete_status = await UserLeave.update(
        {
          status: 2,
        },
        {
          where: { UserLeaveApplicationID: LeaveID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.userleavedelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getLeaveByLeaveId = async (req, res, next) => {
  try {
    let leavstatus;
    let LeaveTranData;

    leavstatus = await executeQuery(
      `select * from "public"."userLeaves" where "UserLeaveApplicationID"=` +
        req.params.id +
        ``
    );

    if (leavstatus.length > 0) {
      if (
        leavstatus[0].authorizationStatus == 3 ||
        leavstatus[0].authorizationStatus == 4
      ) {
        LeaveTranData = await executeQuery(
          `select * from "public"."userLeaveTransactions" where "ReferenceID"=` +
            req.params.id +
            ` order by "date" ASC`
        );

        if (LeaveTranData.length > 0) {
          for (var j = 0; j < LeaveTranData.length; j++) {
            LeaveTranType = await executeQuery(
              `select LM."LeaveName" from "hrLeaveTypes" as LT inner join "public"."hrLeaveMasters" as LM on LT."LeaveID"=LM."LeaveID"  where LT."LeaveTranId"=` +
                LeaveTranData[j].LeaveTranId +
                ``
            );
            LeaveTranData[j].LeaveTypeAfterAuth = LeaveTranType[0].LeaveName;
            if (LeaveTranData[j].status == 1) {
              LeaveTranData[j].LeaveTypeAfterAuthStatus = 'Accepted';
            } else {
              LeaveTranData[j].LeaveTypeAfterAuthStatus = 'Cancelled';
            }
          }
        }
      } else {
        LeaveTranData = [];
      }
    }

    res.status(200).json({ status: 200, data: LeaveTranData });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.getapprovedLeaveByUserId = async (req, res, next) => {
  try {
    let { startdate, enddate } = await req.body;
    let userleavetype, totalcount;
    let finaldata = [];
    const userid = req.params.id;
    userleavetype = await UserLeave.findAll({
      where: {
        userMasterID: userid,
        authorizationStatus: 3,
        status: 1,
      },
      order: [['FromDate', 'DESC']],
    });

    for (var i = 0; i < userleavetype.length; i++) {
      let userleave = await userLeaveTransactions.findAll({
        raw: true,
        where: {
          ReferenceID: userleavetype[i].UserLeaveApplicationID,
          status: 1,
        },
        order: [['date', 'DESC']],
        include: [
          {
            model: UserLeave,
            attributes: ['DayType', 'Remark'],
          },
        ],
      });
      for (var j = 0; j < userleave.length; j++) {
        if (userleave[j]) {
          finaldata.push(userleave[j]);
        }
      }
    }

    return res.status(200).json({ status: 200, data: finaldata });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.getOptionalLeaveByUserId = async (req, res, next) => {
  try {
    const { userMasterID, startDate, endDate } = req.query;

    if (!userMasterID)
      throw new CustomError('userMasterID is required fields!', 401);

    const condition = {};

    condition.userMasterID = userMasterID;
    condition.optionalHoliday = true;

    if (startDate && endDate) {
      condition.date = {
        [Sequelize.Op.between]: [startDate, endDate],
      };
    }

    const optionalHoliday = await weekoffHolidayTran.findAll({
      raw: true,
      where: condition,
      include: {
        model: UserMaster,
        required: true,
        ...accessibleUsers(req.userDetails),
      },
    });

    return res.status(200).json({
      status: 200,
      data: optionalHoliday,
    });
  } catch (error) {
    next(error);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const convertExcelDateToISO = (excelDate) => {
      return new Date(Math.round(excelDate - 25569) * 86400 * 1000)
        .toISOString()
        .slice(0, 10);
    };

    const formatDateStringToISO = (dateString) => {
      return new Date(dateString).toISOString().slice(0, 10);
    };
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let fileUploadType = FileUploadType.MOBILE_NUMBER;
    const companyData = await companyMaster.findOne({
      where: { companyMasterID: req.body.companyMasterID },
      attributes: ['fileUploadType'],
      raw: true,
    });
    if (companyData.fileUploadType == FileUploadType.EMPLOYEE_CODE)
      fileUploadType = companyData.fileUploadType;

    const [userData, companyWiseLeaveTypeData] = await Promise.all([
      // User Data
      UserMaster.findAll({
        where: {
          companyMasterId: req.body.companyMasterID,
          status: 1,
        },
        include: [
          {
            model: EmployeeJoiningDetails,
            required: fileUploadType == 'mobileNumber' ? false : true,
            attributes: ['employeeJoiningDetailId', 'employeeCode'],
          },
          {
            model: EmployeeBranch,
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(currentdate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: {
                    [Sequelize.Op.gte]: new Date(currentdate),
                  },
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
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            model: companyMaster,
            required: true,
            attributes: ['companyMasterID', 'companyName'],
          },
          // {
          //   required: false,
          //   model: UserLeave,
          // },
        ],
      }),
      // Company Leave Types
      HrLeaveTypes.findAll({
        where: {
          companyMasterID: req.body.companyMasterID,
        },
        include: [
          {
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            where: {
              status: 1,
            },
          },
        ],
      }),
    ]);
    const leavedata = [];
    const userIds = [];
    for (const row of rows) {
      if (row[2] != null && row[2].trim() != '') {
        row[0] = row[0].toString();
        let userMaster = null;
        if (row[0]) {
          if (fileUploadType == FileUploadType.MOBILE_NUMBER) {
            userMaster = userData.find((e) => e.userNumber === row[0]);
          } else {
            userMaster = userData.find(
              (e) => e.employeeJoiningDetails[0].employeeCode === row[0]
            );
          }
          if (!userMaster) {
            let assetData = {
              LeaveTranId: row[1],
              userMasterID: '',
              fromDate: row[3],
              toDate: row[4],
              companyMasterID: req.body.companyMasterID,
              LeaveDays: null,
              Remark: row[5],
              DayType: row[2],
              status: 1,
              leaveFrom: 'manual',
              displayName: '',
              LeaveName: row[1],
              // toDate: row[4],
              remarks: `User with ${fileUploadType} ${row[0]} not found.`,
              employeeCode: row[0],
              branch: '',
              designation: '',
              department: '',
              company: '',
              userNumber: '',
              companyMasterID: req.body.companyMasterID,
              FromDate: row[3],
              ToDate: row[4],
            };

            leavedata.push(assetData);
            continue;
          }
          const leaveTypeData = companyWiseLeaveTypeData.find(
            (e) => e.LeaveMaster.LeaveName === row[1]
          );

          let assetData = {
            LeaveTranId: row[1],
            userMasterID: row[0],
            fromDate: row[3],
            toDate: row[4],
            companyMasterID: req.body.companyMasterID,
            LeaveDays: null,
            Remark: row[5],
            DayType: row[2],
            status: 1,
            leaveFrom: 'manual',
            displayName: row[0],
            LeaveName: row[1],
            // toDate: row[4],
            remarks: '',
            employeeCode:
              userMaster.employeeJoiningDetails &&
              userMaster.employeeJoiningDetails.length > 0
                ? userMaster.employeeJoiningDetails[0].employeeCode
                : '',
            branch:
              (userMaster.employeeBranches &&
                userMaster.employeeBranches.length) > 0
                ? userMaster.employeeBranches[0].branchMaster
                  ? userMaster.employeeBranches[0].branchMaster.branchName
                  : ''
                : '',
            designation:
              (userMaster.employeeDesignations &&
                userMaster.employeeDesignations.length) > 0
                ? userMaster.employeeDesignations[0].designation
                  ? userMaster.employeeDesignations[0].designation
                      .designationName
                  : ''
                : '',
            department:
              (userMaster.employeeDepartments &&
                userMaster.employeeDepartments.length) > 0
                ? userMaster.employeeDepartments[0].department
                  ? userMaster.employeeDepartments[0].department.departmentName
                  : ''
                : '',
            company: userMaster.companyMaster.companyName,
            userNumber: userMaster.userNumber,
            companyMasterID: req.body.companyMasterID,
            FromDate: row[3],
            ToDate: row[4],
          };
          if (!row[3]) {
            row[3] = '';
            assetData.remarks = "Please Enter Valid From Date'";
          } else {
            row[3] = asiaKolkataDateTime(new Date(row[3])).slice(0, 10);
            if (typeof row[3] === 'number') {
              assetData.fromDate = convertExcelDateToISO(row[3]);
              assetData.FromDate = convertExcelDateToISO(row[3]);
            } else if (isValidDate(row[3])) {
              assetData.fromDate = formatDateStringToISO(row[3]);
              assetData.FromDate = formatDateStringToISO(row[3]);
            } else {
              assetData.fromDate = null;
              assetData.FromDate = null;
              assetData.remarks = "From Date Should be in 'yyyy-mm-dd'";
            }
          }

          if (row[5] == null) {
            assetData.remarks = "Pleae enter valid Reason'";
          }
          if (!row[4] && row[2] == 'Full Day') {
            row[4] = '';
            assetData.remarks = "Please Enter Valid To Date'";
          } else {
            row[4] = asiaKolkataDateTime(new Date(row[4])).slice(0, 10);
            if (typeof row[4] === 'number') {
              assetData.toDate = convertExcelDateToISO(row[4]);
              assetData.ToDate = convertExcelDateToISO(row[4]);
            } else if (isValidDate(row[4])) {
              assetData.toDate = formatDateStringToISO(row[4]);
              assetData.ToDate = formatDateStringToISO(row[4]);
            } else {
              assetData.toDate = null;
              assetData.ToDate = null;
              assetData.remarks = "To Date Should be in 'yyyy-mm-dd'";
            }
          }

          if (leaveTypeData) {
            assetData.LeaveTranId = leaveTypeData.LeaveTranId;
            assetData.LeaveName = leaveTypeData.LeaveMaster.LeaveName;
          } else {
            assetData.remarks = 'Leave Type Does not Exists';
          }
          if (userMaster) {
            assetData.userMasterID = userMaster.userMasterID;
            assetData.displayName = userMaster.displayName;
          } else {
            assetData.remarks = 'User Number Not Exist';
          }
          if (
            assetData.DayType === 'First Half' ||
            assetData.DayType === 'Second Half'
          ) {
            assetData.toDate = assetData.fromDate;
            assetData.LeaveDays = '0.5';
          } else if (assetData.DayType === 'Full Day') {
            const fromDate = new Date(assetData.fromDate);
            const toDate = new Date(assetData.toDate);
            const diffInTime = toDate.getTime() - fromDate.getTime();
            const LeaveDays = diffInTime / (1000 * 60 * 60 * 24);
            const totalLeaveDays = LeaveDays + 1;
            assetData.LeaveDays = totalLeaveDays;
          }
          userIds.push(assetData.userMasterID);
          leavedata.push(assetData);
        }
      }
    }
    const hrleavetypeCondition = {
      companyMasterID: +req.body.companyMasterID,
      status: 1,
      Leave_Allow: 'Y',
      LeaveID: { [Sequelize.Op.notIn]: [5, 18, 25] },
    };

    const groupBy = [
      'userMasterID',
      'hrLeaveType.LeaveTranId',
      'hrLeaveType.LeaveMaster.LeaveName',
      'hrLeaveType.LeaveMaster.LeaveDesc',
      'hrLeaveType.Leave_CF',
      'hrLeaveType.LeaveID',
    ];

    const attributes = [
      [Sequelize.col('userMasterID'), 'userMasterID'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'leaveName'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveDesc'), 'LeaveDesc'],
      [Sequelize.col('hrLeaveType.LeaveTranId'), 'LeaveTranId'],
      [Sequelize.col('hrLeaveType.Leave_CF'), 'Leave_CF'],
      [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
    ];

    const [
      findAllUserLeave,
      userLapseleave,
      addbalance,
      usedBalance,
      lapseLeaveOrderBy,
      leaveTypeData,
    ] = await Promise.all([
      // userLeave
      UserLeave.findAll({
        // raw: true,
        where: {
          status: 1,
          userMasterID: userIds,
        },
        include: [
          {
            required: false,
            model: userLeaveTransactions,
            where: {
              status: 1,
            },
          },
        ],
      }),
      // userLapseleave
      UserLeaveLapse.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,
          [
            Sequelize.literal('coalesce(sum(cast("LapseDays" as numeric)),0)'),
            'totalDays',
          ],
        ],
      }),
      // addbalance
      HrLeaveBalance.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            // where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,

          [
            Sequelize.literal(
              'coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0)'
            ),
            'totalDays',
          ],
        ],
      }),
      // usedBalance
      userLeaveTransactions.findAll({
        raw: true,
        where: {
          status: 1,
          // userMasterID: userIds,
        },
        include: [
          {
            model: UserLeave,
            where: { userMasterID: userIds },
            attributes: [],
          },
          {
            model: HrLeaveTypes,
            // where: hrleavetypeCondition,
            include: [
              { model: HrLeaveMaster, as: 'LeaveMaster', attributes: [] },
            ],
            attributes: [],
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,
          [
            Sequelize.fn('SUM', Sequelize.literal('COALESCE("days", 0)')),
            'totalDays',
          ],
        ],
      }),
      // Leave Lapse OrderBy
      UserLeaveLapse.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: ['LeaveName'],
              },
            ],
          },
        ],
        order: [['LapseYearMonth', 'DESC']],
      }),
      // leaveTypeData
      HrLeaveTypes.findAll({
        raw: true,
        where: hrleavetypeCondition,
        include: [
          {
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            where: {
              // LeaveName: { [Sequelize.Op.iLike]: row[1] },
              status: 1,
            },
          },
        ],
      }),
    ]);

    for (const leave of leavedata) {
      if (!leave.displayName || !leave.fromDate) continue;
      if (!leave.toDate && leave.DayType == 'Full Day') continue;

      const userWiseLeave = findAllUserLeave.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseLeaveLapse = userLapseleave.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseaddbalance = addbalance.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseUsedBalance = usedBalance.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseLeaveLapseOderBy = lapseLeaveOrderBy.filter(
        (e) => e.userMasterID == leave.userMasterID
      );

      await checkManualLeaveData(
        leave,
        userWiseLeave,
        userWiseLeaveLapse,
        userWiseaddbalance,
        userWiseUsedBalance,
        leaveTypeData,
        userWiseLeaveLapseOderBy
      );
    }

    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: 'Manual Leave Validate successfully.',
      data: leavedata,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateManualLeave = async (req, res, next) => {
  try {
    const { manualLeaveData, companyMasterID } = req.body;

    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const [userData, companyWiseLeaveTypeData] = await Promise.all([
      // USer Data
      UserMaster.findAll({
        where: {
          companyMasterId: companyMasterID,
          status: 1,
        },
        include: [
          {
            model: EmployeeJoiningDetails,
            required: false,
            attributes: ['employeeJoiningDetailId', 'employeeCode'],
          },
          {
            model: EmployeeBranch,
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(currentdate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: {
                    [Sequelize.Op.gte]: new Date(currentdate),
                  },
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
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            model: companyMaster,
            required: true,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
      }),
      // Company Leave Types
      HrLeaveTypes.findAll({
        // raw: true,
        where: {
          companyMasterID: req.body.companyMasterID,
        },
        include: [
          {
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            where: {
              // LeaveName: { [Sequelize.Op.iLike]: row[1] },
              status: 1,
            },
          },
        ],
      }),
    ]);
    let leavedata = [];
    const userIds = [];

    for (const row of manualLeaveData) {
      // Ensure the row is an object and has the required fields
      if (!row.userMasterID) {
        let assetData = {
          userMasterID: '',
          LeaveName: row.LeaveName.trim(),
          DayType: row.DayType.trim(),
          fromDate: row.fromDate,
          toDate: row.toDate,
          Remark: row.Remark,
          LeaveTranId: row.LeaveTranId,
          companyMasterID: companyMasterID,
          remarks: row.remarks,
          leaveFrom: 'manual',
          LeaveDays: row.LeaveDays,
          displayName: row.userMasterID,
          employeeCode: '',
          branch: '',
          designation: '',
          department: '',
          company: '',
          companyMasterID: companyMasterID,
          FromDate: row.fromDate,
          ToDate: row.toDate,
          userNumber: row.userNumber,
        };
        leavedata.push(assetData);
        continue;
      }
      if (row.LeaveName && row.LeaveName.trim() !== '') {
        const userMaster = userData.find(
          (e) => e.userMasterID == row.userMasterID
        );
        const leaveTypeData = companyWiseLeaveTypeData.find(
          (e) => e.LeaveMaster.LeaveName === row.LeaveName
        );

        let assetData = {
          userMasterID: row.userMasterID,
          LeaveName: row.LeaveName.trim(),
          DayType: row.DayType.trim(),
          fromDate: row.fromDate,
          toDate: row.toDate,
          Remark: row.Remark,
          LeaveTranId: row.LeaveTranId,
          companyMasterID: companyMasterID,
          remarks: '',
          leaveFrom: 'manual',
          LeaveDays: row.LeaveDays,
          displayName: row.userMasterID,
          employeeCode:
            userMaster.employeeJoiningDetails &&
            userMaster.employeeJoiningDetails.length > 0
              ? userMaster.employeeJoiningDetails[0].employeeCode
              : '',
          branch:
            (userMaster.employeeBranches &&
              userMaster.employeeBranches.length) > 0
              ? userMaster.employeeBranches[0].branchMaster
                ? userMaster.employeeBranches[0].branchMaster.branchName
                : ''
              : '',
          designation:
            (userMaster.employeeDesignations &&
              userMaster.employeeDesignations.length) > 0
              ? userMaster.employeeDesignations[0].designation
                ? userMaster.employeeDesignations[0].designation.designationName
                : ''
              : '',
          department:
            (userMaster.employeeDepartments &&
              userMaster.employeeDepartments.length) > 0
              ? userMaster.employeeDepartments[0].department
                ? userMaster.employeeDepartments[0].department.departmentName
                : ''
              : '',
          company: userMaster.companyMaster.companyName,
          companyMasterID: companyMasterID,
          FromDate: row.fromDate,
          ToDate: row.toDate,
          userNumber: row.userNumber,
        };
        if (leaveTypeData) {
          assetData.LeaveTranId = leaveTypeData.LeaveTranId;
          assetData.LeaveName = leaveTypeData.LeaveMaster.LeaveName;
        } else {
          assetData.remarks = 'Leave Type Does not Exists';
        }
        if (userMaster) {
          assetData.displayName = userMaster.displayName;
        } else {
          assetData.remarks = 'User Number Not Exist';
        }
        if (
          assetData.DayType === 'First Half' ||
          assetData.DayType === 'Second Half'
        ) {
          assetData.toDate = assetData.fromDate;
          assetData.ToDate = assetData.fromDate;
          assetData.LeaveDays = '0.5';
        } else if (assetData.DayType === 'Full Day') {
          const fromDate = new Date(assetData.fromDate);
          const toDate = new Date(assetData.toDate);
          const diffInTime = toDate.getTime() - fromDate.getTime();
          const LeaveDays = diffInTime / (1000 * 60 * 60 * 24);
          const totalLeaveDays = LeaveDays + 1;
          assetData.LeaveDays = totalLeaveDays;
        }
        userIds.push(assetData.userMasterID);
        leavedata.push(assetData);
      }
    }
    const hrleavetypeCondition = {
      companyMasterID: +req.body.companyMasterID,
      status: 1,
      Leave_Allow: 'Y',
      LeaveID: { [Sequelize.Op.notIn]: [5, 18, 25] },
    };

    const groupBy = [
      'userMasterID',
      'hrLeaveType.LeaveTranId',
      'hrLeaveType.LeaveMaster.LeaveName',
      'hrLeaveType.LeaveMaster.LeaveDesc',
      'hrLeaveType.Leave_CF',
      'hrLeaveType.LeaveID',
    ];

    const attributes = [
      [Sequelize.col('userMasterID'), 'userMasterID'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'leaveName'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveDesc'), 'LeaveDesc'],
      [Sequelize.col('hrLeaveType.LeaveTranId'), 'LeaveTranId'],
      [Sequelize.col('hrLeaveType.Leave_CF'), 'Leave_CF'],
      [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
    ];

    const [
      findAllUserLeave,
      userLapseleave,
      addbalance,
      usedBalance,
      lapseLeaveOrderBy,
      leaveTypeData,
    ] = await Promise.all([
      // User LEave
      UserLeave.findAll({
        // raw: true,
        where: {
          status: 1,
          userMasterID: userIds,
        },
        include: [
          {
            required: false,
            model: userLeaveTransactions,
            where: {
              status: 1,
            },
          },
        ],
      }),
      // userLapseleave
      UserLeaveLapse.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,

          [
            Sequelize.literal('coalesce(sum(cast("LapseDays" as numeric)),0)'),
            'totalDays',
          ],
          // [
          //   Sequelize.fn('MAX', Sequelize.col('userLeaveLapse.LapseYearMonth')),
          //   'LapseYearMonth',
          // ],
        ],
      }),
      // addbalance
      HrLeaveBalance.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            // where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,

          [
            Sequelize.literal(
              'coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0)'
            ),
            'totalDays',
          ],
        ],
      }),
      // usedBalance
      userLeaveTransactions.findAll({
        raw: true,
        where: {
          status: 1,
          // userMasterID: userIds,
        },
        include: [
          {
            model: UserLeave,
            where: { userMasterID: userIds },
            attributes: [],
          },
          {
            model: HrLeaveTypes,
            // where: hrleavetypeCondition,
            include: [
              { model: HrLeaveMaster, as: 'LeaveMaster', attributes: [] },
            ],
            attributes: [],
          },
        ],
        group: groupBy,
        attributes: [
          ...attributes,
          [
            Sequelize.fn('SUM', Sequelize.literal('COALESCE("days", 0)')),
            'totalDays',
          ],
        ],
      }),
      // Leave Lapse OrderBy
      UserLeaveLapse.findAll({
        raw: true,
        where: {
          userMasterID: userIds,
        },
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: ['LeaveName'],
              },
            ],
          },
        ],
        order: [['LapseYearMonth', 'DESC']],
      }),
      // leaveTypeData
      HrLeaveTypes.findAll({
        raw: true,
        where: hrleavetypeCondition,
        include: [
          {
            model: HrLeaveMaster,
            as: 'LeaveMaster',
            where: {
              // LeaveName: { [Sequelize.Op.iLike]: row[1] },
              status: 1,
            },
          },
        ],
      }),
    ]);

    for (const leave of leavedata) {
      if (!leave.userMasterID) continue;
      const userWiseLeave = findAllUserLeave.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseLeaveLapse = userLapseleave.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseaddbalance = addbalance.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseUsedBalance = usedBalance.filter(
        (e) => e.userMasterID == leave.userMasterID
      );
      const userWiseLeaveLapseOderBy = lapseLeaveOrderBy.filter(
        (e) => e.userMasterID == leave.userMasterID
      );

      await checkManualLeaveData(
        leave,
        userWiseLeave,
        userWiseLeaveLapse,
        userWiseaddbalance,
        userWiseUsedBalance,
        leaveTypeData,
        userWiseLeaveLapseOderBy
      );
    }
    return res.status(200).json({
      status: 200,
      message: 'Manual Leave Re-Validate successfully.',
      data: leavedata,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateManualLeave = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { manualLeaveData } = req.body;

    await UserLeave.bulkCreate(manualLeaveData, {
      individualHooks: true,
      transaction,
    }).then(async (response) => {
      for (let i = 0; i < response.length; i++) {
        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationMasterTypes.leave,
            userMasterID: response[i].userMasterID,
            status: 1,
          },
          raw: true,
        });

        if (authorizationdetails) {
          let employee_name = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: response[i].userMasterID,
              status: 1,
            },
            attributes: ['displayName'],
          });
          const employeename = employee_name ? employee_name.displayName : '';

          let AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID:
                authorizationdetails.AuthorizationCriteriaID,
              status: 1,
            },
            raw: true,
          });
          let get_MailTemplate;
          let get_NotificationPolicy = await findCompanyNotificationPolicy(
            +response[i].companyMasterID
          );

          if (get_NotificationPolicy) {
            get_MailTemplate = await MailTemplateEditor.findOne({
              raw: true,
              where: {
                companyMasterID: response[i].companyMasterID,
                status: 1,
                mailTypeID: 1,
              },
            });

            if (get_MailTemplate) {
              let leavetype = '',
                empcode = '',
                empname = '',
                department = '',
                designation = '',
                branch = '';

              let emp_name = await UserMaster.findOne({
                raw: true,
                where: {
                  userMasterID: response[i].userMasterID,
                  status: 1,
                },
                attributes: ['displayName'],
              });
              empname = emp_name ? emp_name.displayName : '';

              let emp_code = await EmployeeJoiningDetails.findOne({
                raw: true,
                where: {
                  userMasterID: response[i].userMasterID,
                  status: 1,
                },
                attributes: ['employeeCode'],
              });
              empcode = emp_code ? emp_code.employeeCode : '';

              let leave_type = await HrLeaveTypes.findOne({
                raw: true,
                where: {
                  LeaveTranId: response[i].LeaveTranId,
                  status: 1,
                },
                attributes: ['LeaveID'],
                include: [
                  {
                    model: HrLeaveMaster,
                    as: 'LeaveMaster',
                    attributes: ['LeaveName'],
                  },
                ],
              });
              leavetype = leave_type ? leave_type['LeaveMaster.LeaveName'] : '';

              let emp_branch = await EmployeeBranch.findOne({
                raw: true,
                where: {
                  userMasterID: response[i].userMasterID,
                  status: 1,
                  applicableDate: {
                    [Sequelize.Op.lte]: new Date(),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: { [Sequelize.Op.gte]: new Date() },
                    },
                    {
                      endDate: { [Sequelize.Op.eq]: null },
                    },
                  ],
                },
                attributes: ['branchID'],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: ['branchName'],
                  },
                ],
              });
              branch = emp_branch ? emp_branch['branchMaster.branchName'] : '';

              let emp_department = await EmployeeDepartment.findOne({
                raw: true,
                where: {
                  userMasterID: response[i].userMasterID,
                  status: 1,
                  applicableDate: {
                    [Sequelize.Op.lte]: new Date(),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: { [Sequelize.Op.gte]: new Date() },
                    },
                    {
                      endDate: { [Sequelize.Op.eq]: null },
                    },
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
              });
              department = emp_department
                ? emp_department['department.departmentName']
                : '';

              let emp_designation = await EmployeeDesignation.findOne({
                raw: true,
                where: {
                  userMasterID: response[i].userMasterID,
                  status: 1,
                  applicableDate: {
                    [Sequelize.Op.lte]: new Date(),
                  },
                  [Sequelize.Op.or]: [
                    {
                      endDate: { [Sequelize.Op.gte]: new Date() },
                    },
                    {
                      endDate: { [Sequelize.Op.eq]: null },
                    },
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
              });
              designation = emp_designation
                ? emp_designation['designation.designationName']
                : '';

              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[EmployeeCode]',
                empcode
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[EmployeeName]',
                empname
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[ToDate]',
                response[i].ToDate
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[FromDate]',
                response[i].FromDate
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[Reason]',
                response[i].Remark
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[NoOfDays]',
                response[i].LeaveDays
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[Department]',
                department
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[Designation]',
                designation
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[Branch]',
                branch
              );
              get_MailTemplate.subject = get_MailTemplate.subject.replace(
                '[LeaveType]',
                leavetype
              );

              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[EmployeeCode]',
                empcode
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[EmployeeName]',
                empname
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[ToDate]',
                response[i].ToDate
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[FromDate]',
                response[i].FromDate
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[Reason]',
                response[i].Remark
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[NoOfDays]',
                response[i].LeaveDays
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[Department]',
                department
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[Designation]',
                designation
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[Branch]',
                branch
              );
              get_MailTemplate.body = get_MailTemplate.body.replace(
                '[LeaveType]',
                leavetype
              );
            }
          }

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            let insert_db_status1 = await LeaveAuthorizationRequest.create(
              {
                TableName: 'userLeaves',
                ReferenceID: response[i].UserLeaveApplicationID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
                status: 1,
                authstatus: 2,
                createBy: response[i].createBy,

                createByIp: response[i].createByIp,
              },
              { transaction }
            );

            await UserInbox.create(
              {
                activityTable: LeaveAuthorizationRequest.getTableName(),
                activityTablePK:
                  insert_db_status1.toJSON().AuthorizationRequestId,
                message: `${employeename} has applied for leave request from ${moment(
                  response[i].FromDate
                ).format('DD/MM/YYYY')} to ${moment(response[i].ToDate).format(
                  'DD/MM/YYYY'
                )}`,
                assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
                assignedBy: response[i].userMasterID,
              },
              { transaction }
            );

            let user = await UserMaster.findOne({
              where: {
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
              },
            });
            let userinfo = await UserMaster.findOne({
              where: {
                // userMasterID:response[i].createBy
                userMasterID: response[i].userMasterID,
              },
            });

            if (user && userinfo) {
              const notification = {
                title: 'Leave',
                body: userinfo.displayName + ' requested for leave.',
              };
              const data = {
                screen: 'leaveauth',
                isScheduled: 'true',
                scheduledTime: new Date().toISOString(),
              };
              await sendNotification(user.userMasterID, notification, data);
            }

            if (user.email && get_MailTemplate) {
              let data = {
                email_id: user.email,
                body: get_MailTemplate.body,
                subject: get_MailTemplate.subject,
                email: get_NotificationPolicy.email,
                password: get_NotificationPolicy.password,
                port: get_NotificationPolicy.port,
                host: get_NotificationPolicy.hostmail,
                secure: get_NotificationPolicy.secure,
              };

              sendEmailForLeave(data);
            }
          } else {
            for (
              var j = 0;
              j < authorizationdetails.AuthorizedByUserMasterId.length;
              j++
            ) {
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: response[i].UserLeaveApplicationID,
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[j],
                  status: 1,
                  authstatus: 2,
                  createBy: response[i].createBy,
                  createByIp: response[i].createByIp,
                },
                { transaction }
              );

              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${employeename} has applied for leave request from ${moment(
                    response[i].FromDate
                  ).format('DD/MM/YYYY')} to ${moment(
                    response[i].ToDate
                  ).format('DD/MM/YYYY')}`,
                  assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
                  assignedBy: response[i].userMasterID,
                },
                { transaction }
              );

              let user = await UserMaster.findOne({
                where: {
                  userMasterID:
                    authorizationdetails.AuthorizedByUserMasterId[j],
                },
              });
              let userinfo = await UserMaster.findOne({
                where: {
                  // userMasterID:response[i].createBy
                  userMasterID: response[i].userMasterID,
                },
              });
              const notification = {
                title: 'Leave',
                body: userinfo.displayName + ' requested for leave.',
              };
              const data = {
                screen: 'leaveauth',
              };
              await sendNotification(
                authorizationdetails.AuthorizedByUserMasterId[j],
                notification,
                data
              );

              if (user.email && get_MailTemplate) {
                let data = {
                  email_id: user.email,
                  body: get_MailTemplate.body,
                  subject: get_MailTemplate.subject,
                  email: get_NotificationPolicy.email,
                  password: get_NotificationPolicy.password,
                  port: get_NotificationPolicy.port,
                  host: get_NotificationPolicy.hostmail,
                  secure: get_NotificationPolicy.secure,
                };

                sendEmailForLeave(data);
              }
            }
          }
        }
      }
    });
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.userleaveadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    condition.companyMasterId = companyMasterID;
    condition.status = 1;
    const order = [['displayName', 'ASC']];
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const userData = await UserMaster.findAndCountAll({
      // raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: EmployeeJoiningDetails,
          required: true,
          attributes: ['employeeJoiningDetailId', 'employeeCode'],
        },
        {
          model: EmployeeBranch,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
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
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
          model: companyMaster,
          required: true,
          attributes: ['companyMasterID', 'companyName', 'fileUploadType'],
        },
      ],
      attributes: [
        'userMasterID',
        'displayName',
        'companyMasterId',
        'userNumber',
      ],
    });
    const userDataNames = userData.rows.map((row) => {
      const mergeCellData =
        row.displayName +
        ' (' +
        row.userNumber +
        ')' +
        (row.employeeJoiningDetails &&
        row.employeeJoiningDetails.length > 0 &&
        row.employeeJoiningDetails[0].employeeCode != null
          ? ' (' + row.employeeJoiningDetails[0].employeeCode + ')'
          : '');

      return {
        userMasterID: row.userMasterID,
        displayName: row.displayName,
        userNumber: row.userNumber,
        companyMasterId: row.companyMasterId,
        employeeCode:
          row.employeeJoiningDetails && row.employeeJoiningDetails.length > 0
            ? row.employeeJoiningDetails[0].employeeCode
            : '',
        branch:
          (row.employeeBranches && row.employeeBranches.length) > 0
            ? row.employeeBranches[0].branchMaster
              ? row.employeeBranches[0].branchMaster.branchName
              : ''
            : '',
        designation:
          (row.employeeDesignations && row.employeeDesignations.length) > 0
            ? row.employeeDesignations[0].designation
              ? row.employeeDesignations[0].designation.designationName
              : ''
            : '',
        department:
          (row.employeeDepartments && row.employeeDepartments.length) > 0
            ? row.employeeDepartments[0].department
              ? row.employeeDepartments[0].department.departmentName
              : ''
            : '',
        company: row.companyMaster.companyName,
        mergedData: mergeCellData,
      };
    });

    const leaveTypeData = await executeQuery(
      `SELECT * from "ms_fun_leaves_name" (` + companyMasterID + `)`
    );
    const leaveNames = leaveTypeData.map((row) => row.leavename);

    let fileUploadType = 'Employee Number';
    if (userData.rows.length)
      if (userData.rows[0].companyMaster.fileUploadType == 'employeeCode')
        fileUploadType = 'Employee Code';

    await genrateDemoExcelForManualLeave(
      userDataNames,
      leaveNames,
      'Demo Manual Leave',
      'xlsx',
      fileUploadType,
      res
    );
  } catch (err) {
    next(err);
  }
};
async function checkManualLeaveData(
  leavedata,
  userWiseLeave,
  userWiseLeaveLapse,
  userWiseaddbalance,
  userWiseUsedBalance,
  leaveType,
  userWiseLeaveLapseOderBy
) {
  const leaveMessage = await checkUserLeaveBalanceNew(
    [leavedata],
    'add',
    userWiseLeave,
    userWiseLeaveLapse,
    userWiseaddbalance,
    userWiseUsedBalance,
    leaveType,
    userWiseLeaveLapseOderBy
  );

  if (leaveMessage) {
    leavedata.remarks = leaveMessage;
  } else {
    if (new Date(leavedata.fromDate) > new Date(leavedata.toDate)) {
      leavedata.remarks = 'Invalid From date and To date!';
    }

    //For Cancelled & Approved
    const cancelledApprovedLeave = userWiseLeave.filter(
      (leave) =>
        leave.userLeaveTransactions &&
        leave.userLeaveTransactions.length > 0 &&
        leave.userLeaveTransactions.findIndex(
          (ult) =>
            leave.UserLeaveApplicationID == ult.ReferenceID &&
            ult.date >= leavedata.fromDate &&
            ult.date <= leavedata.toDate
        ) > -1 &&
        leave.authorizationStatus != 4
    );

    if (cancelledApprovedLeave.length > 0) {
      if (leavedata.DayType == 'Full Day') {
        leavedata.remarks =
          'You have already applied for leave within these range';
      }

      for (var j = 0; j < cancelledApprovedLeave.length; j++) {
        if (
          cancelledApprovedLeave[j].DayType == leavedata.DayType ||
          cancelledApprovedLeave[j].DayType == 'Full Day'
        ) {
          leavedata.remarks =
            'You have already applied for leave within these range';
        }
      }
    }

    //For Pending Leave
    const filteredLeave = userWiseLeave.filter(
      (leave) =>
        [0, 1, 2].includes(leave.authorizationStatus) &&
        ((leave.FromDate >= leavedata.fromDate &&
          leave.FromDate <= leavedata.toDate) ||
          (leave.ToDate >= leavedata.fromDate &&
            leave.ToDate <= leavedata.toDate) ||
          (leave.FromDate <= leavedata.fromDate &&
            leave.ToDate >= leavedata.toDate))
    );

    if (filteredLeave.length > 0) {
      if (leavedata.DayType == 'Full Day') {
        leavedata.remarks =
          'You have already applied for leave within these range';
      }

      for (let j = 0; j < filteredLeave.length; j++) {
        if (
          filteredLeave[j].DayType == leavedata.DayType ||
          filteredLeave[j].DayType == 'Full Day'
        ) {
          leavedata.remarks =
            'You have already applied for leave within these range';
        }
      }
    }
  }
  return leavedata;
}
// ----------------------------------------Outdoor Duty ------------------------------------

exports.addOutdoorDuty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      userMasterID,
      companyMasterID,
      FromDate,
      ToDate,
      LeaveDays,
      Remark,
      DayType,
    } = await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    if (new Date(FromDate) > new Date(ToDate)) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Invalid From date and To date!',
      });
    }

    const userLeaveType = await HrLeaveTypes.findOne({
      where: {
        LeaveID: 25,
        status: 1,
        companyMasterID,
      },
      include: [
        {
          required: true,
          model: HrLeaveMaster,
          as: 'LeaveMaster',
          attributes: ['LeaveName'],
        },
      ],
      transaction,
    });

    if (!userLeaveType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: ' "Outdoor Duty" not found .',
      });
    }

    const LeaveTranId = userLeaveType.LeaveTranId;

    // For cancel && Approve
    const findLeave = await executeQuery(
      `SELECT * from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID"=` +
        userMasterID +
        ` and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
        FromDate +
        `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
        ToDate +
        `')`
    );

    if (findLeave.length > 0) {
      if (DayType == 'Full Day') {
        const message =
          findLeave[0].LeaveTranId == userLeaveType.LeaveTranId
            ? 'Outdoor Duty'
            : 'Leave';
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `You have already applied for "${message}"  within these range`,
        });
      }

      for (let j = 0; j < findLeave.length; j++) {
        if (
          findLeave[j].DayType == DayType ||
          findLeave[j].DayType == 'Full Day'
        ) {
          const message =
            findLeave[j].LeaveTranId == userLeaveType.LeaveTranId
              ? 'Outdoor Duty'
              : 'Leave';
          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: `You have already applied for "${message} " within these range`,
          });
        }
      }
    }

    // Pending Leave

    const findPendingLeave = await UserLeave.findAll({
      where: {
        status: 1,
        userMasterID: userMasterID,
        [Sequelize.Op.or]: [
          {
            FromDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          {
            ToDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          {
            FromDate: {
              [Sequelize.Op.lte]: new Date(FromDate),
            },
            ToDate: { [Sequelize.Op.gte]: new Date(ToDate) },
          },
        ],
        authorizationStatus: [0, 1, 2],
      },
      transaction,
    });

    if (findPendingLeave.length > 0) {
      if (DayType == 'Full Day') {
        const message =
          findPendingLeave[0].LeaveTranId == userLeaveType.LeaveTranId
            ? 'Outdoor Duty'
            : 'Leave';
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `You have already applied for "${message}" within these range`,
        });
      }

      for (let j = 0; j < findPendingLeave.length; j++) {
        if (
          findPendingLeave[j].DayType == DayType ||
          findPendingLeave[j].DayType == 'Full Day'
        ) {
          const message =
            findPendingLeave[j].LeaveTranId == userLeaveType.LeaveTranId
              ? 'Outdoor Duty'
              : 'Leave';

          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: `You have already applied for "${message}" within these range`,
          });
        }
      }
    }

    const authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave, // For Leave
        userMasterID,
        status: 1,
      },
      transaction,
    });

    let authorizationStatus = 0;
    if (authorizationdetails) {
      const AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        transaction,
      });

      if (AuthorizationCriterias) {
        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          authorizationStatus = 2;
        } else {
          authorizationStatus = 1;
        }
      }
    }

    const response = await UserLeave.create(
      {
        LeaveTranId,
        userMasterID,
        companyMasterID,
        FromDate,
        ToDate,
        LeaveDays,
        Remark,
        DayType,
        status: 1,
        authorizationStatus,
        createBy,
        createByIp,
      },
      { transaction }
    );

    if (authorizationdetails) {
      const employeeDetails = await UserMaster.findOne({
        where: {
          userMasterID,
        },
        include: [
          {
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date() },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date() } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: false,
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
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date() },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date() } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: false,
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
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date() },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date() } },
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
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
        ],
      });

      const employeename = employeeDetails.displayName;
      //Mail for Outdoor Duty..........

      let get_MailTemplate;
      const get_NotificationPolicy =
        await findCompanyNotificationPolicy(+companyMasterID);

      if (get_NotificationPolicy) {
        get_MailTemplate = await MailTemplateEditor.findOne({
          where: {
            companyMasterID: companyMasterID,
            status: 1,
            mailTypeID: 15, //For Outdoor Duty Email Template
          },
        });

        if (get_MailTemplate) {
          const leavetype = userLeaveType.LeaveMaster.LeaveName,
            empcode =
              employeeDetails.employeeJoiningDetails &&
              employeeDetails.employeeJoiningDetails.length > 0
                ? employeeDetails.employeeJoiningDetails[0].employeeCode
                : '',
            empname = employeename,
            department =
              employeeDetails.employeeDepartments &&
              employeeDetails.employeeDepartments.length > 0 &&
              employeeDetails.employeeDepartments[0].department
                ? employeeDetails.employeeDepartments[0].department
                    .departmentName
                : '',
            designation =
              employeeDetails.employeeDesignations &&
              employeeDetails.employeeDesignations.length > 0 &&
              employeeDetails.employeeDesignations[0].designation
                ? employeeDetails.employeeDesignations[0].designation
                    .designationName
                : '',
            branch =
              employeeDetails.employeeBranches &&
              employeeDetails.employeeBranches.length > 0 &&
              employeeDetails.employeeBranches[0].branchMaster
                ? employeeDetails.employeeBranches[0].branchMaster.branchName
                : '';

          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[EmployeeCode]',
            empcode
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[EmployeeName]',
            empname
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[ToDate]',
            ToDate
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[FromDate]',
            FromDate
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[Reason]',
            Remark
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[NoOfDays]',
            LeaveDays
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[Department]',
            department
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[Designation]',
            designation
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[Branch]',
            branch
          );
          get_MailTemplate.subject = get_MailTemplate.subject.replace(
            '[LeaveType]',
            leavetype
          );

          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[EmployeeCode]',
            empcode
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[EmployeeName]',
            empname
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[ToDate]',
            ToDate
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[FromDate]',
            FromDate
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[Reason]',
            Remark
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[NoOfDays]',
            LeaveDays
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[Department]',
            department
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[Designation]',
            designation
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[Branch]',
            branch
          );
          get_MailTemplate.body = get_MailTemplate.body.replace(
            '[LeaveType]',
            leavetype
          );
        }
      }

      const notification = {
        title: 'Outdoor Duty',
        body: employeeDetails.displayName + ' requested for Outdoor Duty.',
      };

      const data = {
        screen: 'outDoorDutyAuth',
        isScheduled: 'true',
        scheduledTime: new Date().toISOString(),
      };

      if (authorizationStatus == 2) {
        const insert_db_status1 = await LeaveAuthorizationRequest.create(
          {
            TableName: 'userLeaves',
            ReferenceID: response.UserLeaveApplicationID,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            status: 1,
            authstatus: 2,
            createBy: createBy,
            createByIp: createByIp,
          },
          { transaction }
        );

        await UserInbox.create(
          {
            activityTable: 'outdoorDutyAuthorizations',
            activityTablePK: insert_db_status1.toJSON().AuthorizationRequestId,
            message: `${employeename} has applied for Outdoor Duty request from ${moment(
              FromDate
            ).format('DD/MM/YYYY')} to ${moment(ToDate).format('DD/MM/YYYY')}`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          },
          { transaction }
        );

        const user = await UserMaster.findOne({
          where: {
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
          },
        });
        if (user) {
          sendNotification(user.userMasterID, notification, data);

          if (user.email && get_MailTemplate) {
            const data = {
              email_id: user.email,
              body: get_MailTemplate.body,
              subject: get_MailTemplate.subject,
              email: get_NotificationPolicy.email,
              password: get_NotificationPolicy.password,
              port: get_NotificationPolicy.port,
              host: get_NotificationPolicy.hostmail,
              secure: get_NotificationPolicy.secure,
            };
            sendEmailForLeave(data);
          }
        }
      } else {
        for (
          let j = 0;
          j < authorizationdetails.AuthorizedByUserMasterId.length;
          j++
        ) {
          const insert_db_status1 = await LeaveAuthorizationRequest.create(
            {
              TableName: 'userLeaves',
              ReferenceID: response.UserLeaveApplicationID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
              status: 1,
              authstatus: 2,
              createBy: createBy,
              createByIp: createByIp,
            },
            { transaction }
          );

          await UserInbox.create(
            {
              activityTable: 'outdoorDutyAuthorizations',
              activityTablePK:
                insert_db_status1.toJSON().AuthorizationRequestId,
              message: `${employeename} has applied for Outdoor Duty request from ${moment(
                FromDate
              ).format('DD/MM/YYYY')} to ${moment(ToDate).format(
                'DD/MM/YYYY'
              )}`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
              assignedBy: userMasterID,
            },
            { transaction }
          );

          const user = await UserMaster.findOne({
            where: {
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
            },
          });

          if (user) {
            sendNotification(
              authorizationdetails.AuthorizedByUserMasterId[j],
              notification,
              data
            );

            if (user.email && get_MailTemplate) {
              const data = {
                email_id: user.email,
                body: get_MailTemplate.body,
                subject: get_MailTemplate.subject,
                email: get_NotificationPolicy.email,
                password: get_NotificationPolicy.password,
                port: get_NotificationPolicy.port,
                host: get_NotificationPolicy.hostmail,
                secure: get_NotificationPolicy.secure,
              };

              sendEmailForLeave(data);
            }
          }
        }
      }
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Outdoor Duty added successfully.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.updateOutdoorDuty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const UserLeaveApplicationID = req.params.id;

    const {
      userMasterID,
      FromDate,
      ToDate,
      LeaveDays,
      Remark,
      DayType,
      companyMasterID,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    if (new Date(FromDate) > new Date(ToDate)) {
      return res.status(200).json({
        status: 401,
        message: 'Invalid From date and To date!',
      });
    }

    const userLeaveType = await HrLeaveTypes.findOne({
      where: {
        LeaveID: 25,
        status: 1,
        companyMasterID,
      },
      include: [
        {
          required: true,
          model: HrLeaveMaster,
          as: 'LeaveMaster',
          attributes: ['LeaveName'],
        },
      ],
      transaction,
    });

    if (!userLeaveType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: ' "Outdoor Duty" not found.',
      });
    }

    // For cancel && Approve
    const findLeave = await executeQuery(
      `SELECT * from "userLeaves" as ul INNER join "userLeaveTransactions" as ult on ul."UserLeaveApplicationID"=ult."ReferenceID" WHERE ul."authorizationStatus" not in (4) and ul."status"=1 and ul."userMasterID"=` +
        userMasterID +
        ` and ult."status"=1 and (TO_DATE(ult."date", 'YYYY-MM-DD')>='` +
        FromDate +
        `' and TO_DATE(ult."date", 'YYYY-MM-DD')<='` +
        ToDate +
        `')`
    );

    if (findLeave.length > 0) {
      if (DayType == 'Full Day') {
        const message =
          findLeave[0].LeaveTranId == userLeaveType.LeaveTranId
            ? 'Outdoor Duty'
            : 'Leave';
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `You have already applied for "${message}"  within these range`,
        });
      }

      for (let j = 0; j < findLeave.length; j++) {
        if (
          findLeave[j].DayType == DayType ||
          findLeave[j].DayType == 'Full Day'
        ) {
          const message =
            findLeave[j].LeaveTranId == userLeaveType.LeaveTranId
              ? 'Outdoor Duty'
              : 'Leave';
          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: `You have already applied for "${message} " within these range`,
          });
        }
      }
    }

    // Pending Leave

    const findPendingLeave = await UserLeave.findAll({
      where: {
        status: 1,
        userMasterID: userMasterID,
        [Sequelize.Op.or]: [
          {
            FromDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          {
            ToDate: {
              [Sequelize.Op.between]: [new Date(FromDate), new Date(ToDate)],
            },
          },
          {
            FromDate: {
              [Sequelize.Op.lte]: new Date(FromDate),
            },
            ToDate: { [Sequelize.Op.gte]: new Date(ToDate) },
          },
        ],
        authorizationStatus: [0, 1, 2],
        UserLeaveApplicationID: {
          [Sequelize.Op.ne]: UserLeaveApplicationID,
        },
      },
      transaction,
    });

    if (findPendingLeave.length > 0) {
      if (DayType == 'Full Day') {
        const message =
          findPendingLeave[0].LeaveTranId == userLeaveType.LeaveTranId
            ? 'Outdoor Duty'
            : 'Leave';
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `You have already applied for "${message}" within these range`,
        });
      }

      for (let j = 0; j < findPendingLeave.length; j++) {
        if (
          findPendingLeave[j].DayType == DayType ||
          findPendingLeave[j].DayType == 'Full Day'
        ) {
          const message =
            findPendingLeave[j].LeaveTranId == userLeaveType.LeaveTranId
              ? 'Outdoor Duty'
              : 'Leave';

          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: `You have already applied for "${message}" within these range`,
          });
        }
      }
    }

    const authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave, // For Leave
        userMasterID,
        status: 1,
      },
      transaction,
    });

    let authorizationStatus = 0;
    if (authorizationdetails) {
      const AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        transaction,
      });

      if (AuthorizationCriterias) {
        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          authorizationStatus = 2;
        } else {
          authorizationStatus = 1;
        }
      }
    }

    await UserLeave.update(
      {
        // LeaveTranId,
        // userMasterID,
        // companyMasterID,
        FromDate,
        ToDate,
        LeaveDays,
        Remark,
        DayType,
        authorizationStatus,
        updateBy,
        updateByIp,
      },
      {
        where: { UserLeaveApplicationID: UserLeaveApplicationID },
        transaction,
      }
    );

    if (authorizationdetails) {
      const employeeDetails = await UserMaster.findOne({
        where: {
          userMasterID,
        },
      });

      const employeename = employeeDetails.displayName;

      const notification = {
        title: 'Outdoor Duty',
        body: employeeDetails.displayName + ' requested for Outdoor Duty.',
      };

      const data = {
        screen: 'outDoorDutyAuth',
        isScheduled: 'true',
        scheduledTime: new Date().toISOString(),
      };

      // Delete All

      const leaveAuthorizationRequest = await LeaveAuthorizationRequest.findAll(
        {
          where: {
            ReferenceID: UserLeaveApplicationID,
          },
          transaction,
        }
      );

      let AuthorizationRequestIds = leaveAuthorizationRequest.map(
        (form) => form.AuthorizationRequestId
      );

      // Delete All User Inbox

      await UserInbox.destroy(
        {
          where: {
            activityTable: 'outdoorDutyAuthorizations',
            activityTablePK: AuthorizationRequestIds,
          },
        },
        { transaction }
      );

      // Delete All User Request

      await LeaveAuthorizationRequest.destroy({
        where: {
          ReferenceID: UserLeaveApplicationID,
        },
        transaction,
      });

      if (authorizationStatus == 2) {
        const insert_db_status1 = await LeaveAuthorizationRequest.create(
          {
            TableName: 'userLeaves',
            ReferenceID: UserLeaveApplicationID,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            status: 1,
            authstatus: 2,
            createBy: updateBy,
            createByIp: updateByIp,
          },
          { transaction }
        );

        await UserInbox.create(
          {
            activityTable: 'outdoorDutyAuthorizations',
            activityTablePK: insert_db_status1.toJSON().AuthorizationRequestId,
            message: `${employeename} has applied for Outdoor Duty request from ${moment(
              FromDate
            ).format('DD/MM/YYYY')} to ${moment(ToDate).format('DD/MM/YYYY')}`,
            assignedTo: authorizationdetails.AuthorizedByUserMasterId[0],
            assignedBy: userMasterID,
          },
          { transaction }
        );

        const user = await UserMaster.findOne({
          where: {
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
          },
        });
        if (user) {
          sendNotification(user.userMasterID, notification, data);
        }
      } else {
        for (
          let j = 0;
          j < authorizationdetails.AuthorizedByUserMasterId.length;
          j++
        ) {
          const insert_db_status1 = await LeaveAuthorizationRequest.create(
            {
              TableName: 'userLeaves',
              ReferenceID: UserLeaveApplicationID,
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
              status: 1,
              authstatus: 2,
              createBy: updateBy,
              createByIp: updateByIp,
            },
            { transaction }
          );

          await UserInbox.create(
            {
              activityTable: 'outdoorDutyAuthorizations',
              activityTablePK:
                insert_db_status1.toJSON().AuthorizationRequestId,
              message: `${employeename} has applied for Outdoor Duty request from ${moment(
                FromDate
              ).format('DD/MM/YYYY')} to ${moment(ToDate).format(
                'DD/MM/YYYY'
              )}`,
              assignedTo: authorizationdetails.AuthorizedByUserMasterId[j],
              assignedBy: userMasterID,
            },
            { transaction }
          );

          const user = await UserMaster.findOne({
            where: {
              userMasterID: authorizationdetails.AuthorizedByUserMasterId[j],
            },
          });

          if (user) {
            sendNotification(
              authorizationdetails.AuthorizedByUserMasterId[j],
              notification,
              data
            );
          }
        }
      }
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Outdoor duty details have been successfully updated.',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.listOutdoorDutyUserWise = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: 1 };
    condition.userMasterID = userMasterID;

    if (startdate && enddate)
      condition.FromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    const { rows, count } = await UserLeave.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          required: true,
          model: HrLeaveTypes,
          where: { LeaveID: 25 },
          attributes: [],
        },
        {
          required: true,
          model: UserMaster,
          attributes: ['userMasterID'],
          include: [
            {
              required: false,
              separate: true,
              model: AuthorizationDetails,
              where: {
                status: 1,
                AuthorizationMasterID: authorizationMasterTypes.leave,
              },
              attributes: ['AuthorizationCriteriaID'],
              include: [
                {
                  model: AuthorizationCriteria,
                  attributes: ['AuthorizationCriteria'],
                },
              ],
            },
          ],
        },
      ],
      order: [['FromDate', 'DESC']],
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

// -------------------- Lapse Balance of december----------------------

exports.lapseLeaveBalanceLeaveId = async (req, res, next) => {
  try {
    const { companyId, leaveId } = req.body;

    const currentmonth = 202503;

    const createBy = req.userDetails.userMasterId;
    const createbyIp = req.userDetails.userIpAddress;

    const companyuser = await UserMaster.findAll({
      where: {
        companyMasterId: companyId,
      },
    });

    const findLeaveType = await HrLeaveTypes.findOne({
      where: {
        LeaveID: leaveId,
        status: 1,
        companyMasterID: companyId,
      },
      attributes: ['LeaveTranId'],
    });

    if (!findLeaveType) throw new Error('Leave type not found.');

    const findAllLeave = await HrLeaveBalance.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: companyuser.map((e) => e.userMasterID),
        },
        LeaveTranId: findLeaveType.LeaveTranId,
        YearMM: {
          [Sequelize.Op.gt]: 202503,
        },
      },
    });

    const finalData = [];

    await Promise.all(
      companyuser.map(async (e) => {
        const leaveBalance = await employeeeLeaveBalance(
          companyId,
          e.userMasterID
        );

        const findsameLeave = leaveBalance.find(
          (f) => f.LeaveTranId == findLeaveType.LeaveTranId && +f.Balance > 0
        );

        if (findsameLeave) {
          const adddata = findAllLeave
            .filter((a) => a.userMasterID == e.userMasterID)
            .reduce(
              (acc, obj) => acc + (+obj.LeaveAddNew || 0) + (+obj.OPBal || 0),
              0
            );

          const lapseDays = +findsameLeave.Balance - +adddata;

          if (+lapseDays > 0) {
            finalData.push({
              userMasterID: e.userMasterID,
              LeaveTranId: findLeaveType.LeaveTranId,
              LapseDays: +lapseDays,
              LapseYearMonth: currentmonth,
              status: 1,
              createBy: createBy,
              createByIp: createbyIp,
            });
          }
        }
      })
    );

    await UserLeaveLapse.bulkCreate(finalData);

    return res.status(200).json({
      status: 200,
      message: 'Leaves Lapse successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getLeaveByUserId_V2 = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      isSocketRequest,
    } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: [0, 1] };
    condition.userMasterID = userMasterID;

    if (startdate && enddate)
      condition.FromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          Remark: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const userLeaves = await UserLeave.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['FromDate', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
          attributes: userAttributes,
          include: [
            {
              separate: true,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              separate: true,
              model: AuthorizationDetails,
              where: {
                status: 1,
                AuthorizationMasterID: authorizationMasterTypes.leave, // fot Leave
              },
              attributes: ['AuthorizationCriteriaID'],
              include: [
                {
                  model: AuthorizationCriteriaMaster,
                  attributes: ['AuthorizationCriteria'],
                },
              ],
            },
            {
              required: false,
              separate: true,
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
              separate: true,
              required: false,
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
          required: true,
          model: HrLeaveTypes,
          where: {
            LeaveID: {
              [Sequelize.Op.ne]: 25,
            },
          },
          include: [{ model: HrLeaveMaster, as: 'LeaveMaster' }],
        },
        { model: companyMaster, attributes: companyAttributes },
        {
          required: false,
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
        {
          separate: true,
          required: false,
          model: userLeaveTransactions,
          include: [
            {
              model: HrLeaveTypes,
              attributes: [],
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                  attributes: [],
                },
              ],
            },
          ],
          order: [['date', 'ASC']],
          attributes: [
            'days',
            'date',
            'status',
            [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'LeaveName'],
          ],
        },
        {
          separate: true,
          required: false,
          model: ApprovedLeaveAuthorization,
          include: [
            {
              model: HrLeaveTypes,
              attributes: [],
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                  attributes: [],
                },
              ],
            },
            {
              required: false,
              model: UserMaster,
              as: 'createdByUserDetails',
              attributes: userAttributes,
            },
            {
              required: false,
              model: UserMaster,
              as: 'updatedByUserDetails',
              attributes: userAttributes,
            },
          ],
          order: [['date', 'ASC']],
          attributes: [
            'days',
            'date',
            'status',
            [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'LeaveName'],
          ],
        },
      ],
    });

    if (isSocketRequest) return userLeaves.rows;

    return res.status(200).json({
      status: 200,
      data: userLeaves.rows,
      totalcount: userLeaves.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllUserLeavesBalanceData = async (req, res, next) => {
  try {
    const { page, limit, userMasterID, companyMasterID, exportData } =
      await req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: 1, companyMasterId: companyMasterID };
    if (userMasterID && userMasterID.length) {
      condition.userMasterID = userMasterID;
    }
    const order = [['displayName', 'ASC']];

    const { rows: allUserData, count: totalCount } =
      await UserMaster.findAndCountAll({
        where: condition,
        ...paginationQuery,
        attributes: userAttributes,
        order,
        include: [
          {
            required: false,
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
              applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
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
          {
            required: false,
            model: companyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
      });

    const allUserIDs =
      userMasterID && userMasterID.length
        ? userMasterID
        : allUserData.map((e) => e.userMasterID);

    const hrleavetypeCondition = {
      companyMasterID: +companyMasterID,
      status: 1,
      Leave_Allow: 'Y',
      LeaveID: { [Sequelize.Op.notIn]: [5, 18, 25] },
    };

    const groupBy = [
      'userMasterID',
      'hrLeaveType.LeaveTranId',
      'hrLeaveType.LeaveMaster.LeaveName',
      'hrLeaveType.LeaveMaster.LeaveDesc',
      'hrLeaveType.Leave_CF',
      'hrLeaveType.LeaveID',
    ];

    const attributes = [
      [Sequelize.col('userMasterID'), 'userMasterID'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'leaveName'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveDesc'), 'LeaveDesc'],
      [Sequelize.col('hrLeaveType.LeaveTranId'), 'LeaveTranId'],
      [Sequelize.col('hrLeaveType.Leave_CF'), 'Leave_CF'],
      [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
    ];

    const [leaveTypeData, userLapseleave, userLeaveEncashment] =
      await Promise.all([
        // leaveTypeData
        HrLeaveTypes.findAll({
          raw: true,
          where: hrleavetypeCondition,
          include: [
            {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveName', 'LeaveDesc'],
            },
          ],
        }),

        // UserLeaveLapse
        UserLeaveLapse.findAll({
          raw: true,
          where: {
            userMasterID: allUserIDs,
          },
          include: [
            {
              model: HrLeaveTypes,
              attributes: [],
              where: hrleavetypeCondition,
              include: {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: [],
              },
            },
          ],
          group: groupBy,
          attributes: [
            ...attributes,

            [
              Sequelize.literal(
                'coalesce(sum(cast("LapseDays" as numeric)),0)'
              ),
              'totalDays',
            ],
          ],
        }),

        // userLeaveEncashment
        LeaveEncashment.findAll({
          raw: true,
          where: {
            userMasterID: allUserIDs,
            status: 1,
          },
          include: [
            {
              model: HrLeaveTypes,
              attributes: [],
              where: hrleavetypeCondition,
              include: {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
                attributes: [],
              },
            },
          ],
          group: groupBy,
          attributes: [
            ...attributes,

            [
              Sequelize.literal('coalesce(sum(cast("days" as numeric)),0)'),
              'totalDays',
            ],
          ],
        }),
      ]);

    const userWiseAllData = [];
    for (const user of allUserData) {
      const userWiseLeaveLapse = userLapseleave.filter(
        (e) => e.userMasterID == user.userMasterID
      );
      const userWiseLeaveEncashment = userLeaveEncashment.filter(
        (e) => e.userMasterID == user.userMasterID
      );

      const userBalance = await employeeeLeaveBalance(
        user.companyMasterId,
        user.userMasterID,
        leaveTypeData,
        userWiseLeaveLapse,
        userWiseLeaveEncashment
      );

      const leaveBalanceMap = userBalance.reduce((acc, item) => {
        acc[item.leaveName] = item.Balance;
        return acc;
      }, {});

      const userLeaveData = {
        userMasterID: user.userMasterID,
        'Company Name': user.companyMaster.companyName,
        'Branch Name':
          user.employeeBranches?.[0]?.branchMaster?.branchName || '-',
        'Department Name':
          user.employeeDepartments?.[0]?.department?.departmentName || '-',
        'Designation Name':
          user.employeeDesignations?.[0]?.designation?.designationName || '-',
        'Employee Code': user.employeeJoiningDetails?.[0]?.employeeCode || '-',
        'Employee Name': user.displayName,
        'Employee Number': user.userNumber,
        ...leaveBalanceMap,
      };
      if (exportData) {
        delete userLeaveData.userMasterID;
      }
      userWiseAllData.push(userLeaveData);
    }

    if (exportData) {
      return await generateExcel(
        userWiseAllData,
        'Leave Count Data',
        'xlsx',
        res
      );
    }
    return res.status(200).json({
      status: 200,
      totalCount,
      data: userWiseAllData,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserLeavesData = async (req, res, next) => {
  try {
    const { userMasterID, fromDate, ToDate } = await req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const condition = { status: 1, userMasterID: userMasterID };

    const userData = await UserMaster.findOne({
      where: condition,
      attributes: userAttributes,
      include: [
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
            applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
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
        {
          required: false,
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });
    const hrleavetypeCondition = {
      companyMasterID: +userData.companyMasterId,
      status: 1,
      Leave_Allow: 'Y',
      LeaveID: { [Sequelize.Op.notIn]: [5, 18, 25] },
    };

    const groupBy = [
      'userMasterID',
      'hrLeaveType.LeaveTranId',
      'hrLeaveType.LeaveMaster.LeaveName',
      'hrLeaveType.LeaveMaster.LeaveDesc',
      'hrLeaveType.Leave_CF',
      'hrLeaveType.LeaveID',
    ];

    const attributes = [
      [Sequelize.col('userMasterID'), 'userMasterID'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'), 'leaveName'],
      [Sequelize.col('hrLeaveType.LeaveMaster.LeaveDesc'), 'LeaveDesc'],
      [Sequelize.col('hrLeaveType.LeaveTranId'), 'LeaveTranId'],
      [Sequelize.col('hrLeaveType.Leave_CF'), 'Leave_CF'],
      [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
      [Sequelize.col('hrLeaveType.LeaveID'), 'LeaveID'],
    ];
    const fromYYYYMM = moment(fromDate).format('YYYYMM');
    const toYYYYMM = moment(ToDate).format('YYYYMM');
    const [
      approvedleave,
      userLapseleave,
      addBalance,
      leaveEncashment,
      employeeLeaveBalance,
    ] = await Promise.all([
      // approvedleave
      userLeaveTransactions.findAll({
        where: {
          status: 1,
          date: {
            [Sequelize.Op.between]: [fromDate, ToDate],
          },
        },
        order: [['date', 'DESC']],
        attributes: [
          'userLeaveTransactionID',
          'ReferenceID',
          'leaveAuthID',
          'LeaveTranId',
          'days',
          'date',
          'issandwichleave',
          'status',
        ],
        include: [
          {
            model: UserLeave,
            where: { userMasterID: userMasterID },
            attributes: [],
          },
          {
            model: HrLeaveTypes,
            attributes: ['LeaveID'],
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveName'],
            },
          },
        ],
      }),

      // userLapseleave
      UserLeaveLapse.findAll({
        // raw: true,
        where: {
          userMasterID: userMasterID,
          LapseYearMonth: {
            [Sequelize.Op.between]: [fromYYYYMM, toYYYYMM],
          },
        },
        order: [['LapseYearMonth', 'DESC']],
        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: [...groupBy, 'LapseYearMonth'],
        attributes: [
          ...attributes,
          'LapseYearMonth',
          [
            Sequelize.literal('coalesce(sum(cast("LapseDays" as numeric)),0)'),
            'LapseDays',
          ],
        ],
      }),

      // HrLeaveBalance
      HrLeaveBalance.findAll({
        raw: true,
        where: {
          userMasterID,
          YearMM: {
            [Sequelize.Op.between]: [fromYYYYMM, toYYYYMM],
          },
        },
        order: [['YearMM', 'DESC']],

        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            // where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: [...groupBy, 'YearMM'],
        attributes: [
          ...attributes,
          'YearMM',
          [
            Sequelize.literal(
              'coalesce(sum(cast("LeaveAddNew" as numeric)),0)+coalesce(sum("OPBal"),0)'
            ),
            'LeaveAddNew',
          ],
        ],
      }),

      // HrLeaveBalance
      LeaveEncashment.findAll({
        raw: true,
        where: {
          userMasterID,
          YYYYMM: {
            [Sequelize.Op.between]: [fromYYYYMM, toYYYYMM],
          },
          referenceId: {
            [Sequelize.Op.eq]: null,
          },
        },
        order: [['YYYYMM', 'DESC']],

        include: [
          {
            model: HrLeaveTypes,
            attributes: [],
            // where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: [],
            },
          },
        ],
        group: [...groupBy, 'YYYYMM'],
        attributes: [
          ...attributes,
          'YYYYMM',
          // 'days'
          [
            Sequelize.literal('coalesce(sum(cast("days" as numeric)),0)'),
            'days',
          ],
        ],
      }),

      // Leave Balance
      await employeeeLeaveBalance(userData.companyMasterId, userMasterID),
    ]);

    return res.status(200).json({
      status: 200,
      userData,
      userLapseleave,
      approvedleave,
      addBalance,
      leaveEncashment,
      employeeLeaveBalance,
    });
  } catch (err) {
    next(err);
  }
};

exports.manageLeaveBalance = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      userMasterID,
      yearMonth,
      operationType,
      LeaveTranId,
      balance,
      operationFrom,
    } = await req.body;
    const currentYearMonth = moment().format('YYYYMM');
    const previousYearMonth = moment().subtract(1, 'month').format('YYYYMM');

    if (operationFrom != 'FNF') {
      const errorMessages = {
        [leaveOperationENUM.Encashment]:
          'Month must be previous month or current month.',
        [leaveOperationENUM.Lapse]: 'Month must be current month.',
        [leaveOperationENUM.AddLeaveBalance]:
          'Month must be previous months or current month.',
      };

      const validationConditions = {
        [leaveOperationENUM.Encashment]:
          yearMonth < previousYearMonth || yearMonth > currentYearMonth,
        [leaveOperationENUM.Lapse]: yearMonth !== currentYearMonth,
        [leaveOperationENUM.AddLeaveBalance]: yearMonth > currentYearMonth,
      };

      if (validationConditions[operationType]) {
        await transaction.rollback();
        return res
          .status(200)
          .json({ status: 401, message: errorMessages[operationType] });
      }
    }

    const condition = {};
    condition.status = 1;
    if (userMasterID) {
      condition.userMasterID = userMasterID;
    } else {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 401, message: 'Please Select Any User' });
    }

    const findUser = await UserMaster.findOne({
      where: condition,
      attributes: userAttributes,
    });
    if (operationType !== leaveOperationENUM.AddLeaveBalance) {
      const userBalance = await employeeeLeaveBalance(
        findUser.companyMasterId,
        userMasterID
      );
      const findLeave =
        userBalance && userBalance.length
          ? userBalance.find((e) => e.LeaveTranId == LeaveTranId)
          : null;
      if (findLeave) {
        if (findLeave.Balance < balance) {
          await transaction.rollback();
          return res.status(200).json({
            status: 401,
            message: "User Don't have Sufficient Balance",
          });
        }
        if (operationType === leaveOperationENUM.Lapse) {
          await UserLeaveLapse.create(
            {
              userMasterID: userMasterID,
              LeaveTranId: LeaveTranId,
              LapseDays: balance,
              LapseYearMonth: yearMonth,
              status: 1,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          );
        } else if (operationType === leaveOperationENUM.Encashment) {
          await LeaveEncashment.create(
            {
              userMasterID: userMasterID,
              LeaveTranId: LeaveTranId,
              YYYYMM: yearMonth,
              days: balance,
              status: 1,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            },
            { transaction }
          );
        }
      }
    } else {
      await HrLeaveBalance.create(
        {
          LeaveTranId: LeaveTranId,
          userMasterID: userMasterID,
          YearMM: yearMonth,
          LeaveAddNew: balance,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
        },
        { transaction }
      );
    }

    const userMessage =
      operationType === leaveOperationENUM.Encashment
        ? 'Leave Encashment'
        : operationType === leaveOperationENUM.Lapse
          ? 'Leave Lapse'
          : operationType === leaveOperationENUM.AddLeaveBalance
            ? 'Leave'
            : '';

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage(userMessage),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
