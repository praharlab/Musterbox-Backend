const Sequelize = require('sequelize');
const LeaveAuthorizationRequest = require('../models/leaveAuthorization');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Department = require('../models/department');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const { executeQuery } = require('./common.controller');
const UserLeave = require('../models/userleave');
const EmployeeAttendance = require('../models/employeeAttendancePolicy');
const WeekoffHolidayTran = require('../models/weekoffHolidayTran');
const userleavetransaction = require('../models/userLeaveTransaction');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const Notification = require('../config/firebase');

const companyMaster = require('../models/companyMaster');
const HrLeaveMonthTrans = require('../models/hrLeavesMonthlyTrans');
const EmployeeBranch = require('../models/employeeBranch');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const MailTemplateEditor = require('../models/mailTemplateEditor');

const LoanMaster = require('../models/loanMaster');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const advancePayment = require('../models/advancePayment');
const overTimeCalculation = require('../models/overTimeCalculation');

const UserExpenseTransaction = require('../models/userExpenseTransaction');
const UserExpense = require('../models/userExpense');

const UserInbox = require('../models/UserInbox');
const moment = require('moment');
const { appURL } = require('../utils/labelUtils');

const {
  encodeSecureBreak,
  findCompanyNotificationPolicy,
  accessibleUsers,
  asiaKolkataDateTime,
  daysInMonth,
  updateviewstatusAll,
  sendNotification,
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
  employeeeLeaveBalance,
  sendAcceptRejectMail,
} = require('../utils/commonUtilFunctions');

const { generateExcel } = require('../utils/exportData');

const { userAttributes } = require('../utils/commonVars');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const BranchMaster = require('../models/branchMaster');
const ApprovedLeaveAuthorization = require('../models/approvedLeaveAuthorization');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const AttendancePolicy = require('../models/attendancePolicy');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const { authorizationMasterTypes } = require('../utils/dbUtils');
const { sendEmailForLeave } = require('../middleware/sendemail');

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

exports.updateViewStatus = async (req, res, next) => {
  try {
    let { tableName, authstatus, userMasterID } = await req.body;

    await updateviewstatusAll(tableName, authstatus, userMasterID);

    res.status(200).json({
      status: 200,
      message: 'Update Successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.countPendingRequests = async (req, res, next) => {
  let { userMasterID } = await req.body;

  // leave
  const totalPendingleaveCount = await LeaveAuthorizationRequest.count({
    where: {
      userMasterID: userMasterID,
      authstatus: 2,
      status: 1,
    },
    include: [
      {
        model: UserLeave,
        where: {
          authorizationStatus: {
            [Sequelize.Op.notIn]: [3, 4],
          },
        },
        include: [{ model: UserMaster, where: { status: 1 } }],
      },
    ],
  });

  const totalleaveCount = await LeaveAuthorizationRequest.count({
    where: {
      userMasterID: userMasterID,
      viewstatus: 0,
      status: 1,
    },
    group: ['authstatus'],
    include: [
      {
        model: UserLeave,
        include: [{ model: UserMaster, where: { status: 1 } }],
      },
    ],
  });

  let totalapproveleaveCount = 0,
    totalRejectedleaveCount = 0;

  totalleaveCount.forEach((e) => {
    if (e.authstatus == 1) {
      totalapproveleaveCount = e.count;
    } else if (e.authstatus == 0) {
      totalRejectedleaveCount = e.count;
    }
  });

  //count OverTime

  const totalpendingOtcount = await OvertimeAuthorizationRequest.count({
    where: {
      [Sequelize.Op.and]: [{ userMasterID: userMasterID }, { authstatus: 2 }],
      status: 1,
    },
    include: [
      {
        model: overTimeCalculation,
        as: 'overTimeCalculation',
        where: {
          AuthorizationRequired: {
            [Sequelize.Op.notIn]: [3, 4],
          },
        },
        include: [{ model: UserMaster, where: { status: 1 } }],
      },
    ],
  });

  const Otcount = await OvertimeAuthorizationRequest.count({
    where: {
      [Sequelize.Op.and]: [{ userMasterID: userMasterID }, { viewstatus: 0 }],
      status: 1,
    },
    group: ['authstatus'],
    include: [
      {
        model: overTimeCalculation,
        as: 'overTimeCalculation',
        include: [{ model: UserMaster, where: { status: 1 } }],
      },
    ],
  });

  let totalapproveOtcount = 0,
    totalRejectedOtcount = 0;

  Otcount.forEach((e) => {
    if (e.authstatus == 1) {
      totalapproveOtcount = e.count;
    } else if (e.authstatus == 0) {
      totalRejectedOtcount = e.count;
    }
  });

  // advance

  // expense

  const totalpendingExpense = await executeQuery(
    `
  
  
  
select count(*) from "expenseAuthorizations" as ea left outer join "userExpenseTransactions" as uet on ea."ReferenceID" = uet."userExpenseTransactionID" 
left outer join "userExpenses" as ue on uet."userExpenseID"=ue."userExpenseID" left OUTER join 
"userMasters" as um on ue."userMasterID" = um."userMasterID" where ue.status=1 and  
ea."userMasterID" = ` +
    userMasterID +
    ` and ea.authstatus=2 and ea.status = 1 and uet."authorizationStatus" not in (3,4) and um.status=1 
  `
  );

  const approveExpense = await executeQuery(
    `
    
select count(*) from "expenseAuthorizations" as ea left outer join "userExpenseTransactions"
 as uet on ea."ReferenceID" = uet."userExpenseTransactionID" left outer join 
 "userExpenses" as ue on uet."userExpenseID"=ue."userExpenseID" left OUTER join 
 "userMasters" as um on ue."userMasterID" = um."userMasterID" where ue.status=1 and  
 ea."userMasterID" = ` +
    userMasterID +
    ` and ea.status = 1 and um.status=1 and ea.viewstatus=0 and ea.authstatus =1
    
    `
  );

  const rejectExpense = await executeQuery(
    `
    
    select count(*) from "expenseAuthorizations" as ea left outer join "userExpenseTransactions"
     as uet on ea."ReferenceID" = uet."userExpenseTransactionID" left outer join 
     "userExpenses" as ue on uet."userExpenseID"=ue."userExpenseID" left OUTER join 
     "userMasters" as um on ue."userMasterID" = um."userMasterID" where ue.status=1 and  
     ea."userMasterID" = ` +
    userMasterID +
    ` and ea.status = 1 and um.status=1 and ea.viewstatus=0 and ea.authstatus =0
        
        `
  );

  res.status(200).json({
    status: 200,
    leaveCount: totalPendingleaveCount,
    // loanCount: totalPendingLoanCount,
    OTcount: totalpendingOtcount,
    // AdvanceCount: totalpendingAdvace,
    expenseAuthorizationsCount: totalpendingExpense[0].count,

    //approve
    // loanapprove: totalapproveLoanCount,
    leaveapprove: totalapproveleaveCount,
    Otapprove: totalapproveOtcount,
    // advanceapprove: totalapproveAdvance,
    expenseAuthorizationsapprove: approveExpense[0].count,
    //Rejected
    leaveRejected: totalRejectedleaveCount,
    // loanRejected: totalRejectedLoanCount,
    OTrejected: totalRejectedOtcount,
    // advanceRejected: totalrejectAdvance,
    expenseAuthorizationsRejected: rejectExpense[0].count,
  });
};

exports.viewauthorizationrequestbyuserid = async (req, res, next) => {
  try {
    let { limit, page, startdate, enddate, userMasterID, user, status } =
      await req.body;
    // let user = userMasterID;
    let offset = (page - 1) * limit;
    let auth_request = [];
    let auth_request1 = [];

    if (user == '' && startdate == '' && enddate == '') {
      let condition;

      if (status == '1' || status == '0') {
        condition = {
          [Sequelize.Op.and]: [
            { userMasterID: userMasterID },
            { authstatus: +status },
          ],

          status: 1,
        };
      } else {
        condition = {
          [Sequelize.Op.and]: [
            { userMasterID: userMasterID },
            { authstatus: 2 },
          ],
          '$userLeave.authorizationStatus$': {
            [Sequelize.Op.notIn]: [3, 4],
          },
          status: 1,
        };
      }

      auth_request1 = await LeaveAuthorizationRequest.findAndCountAll({
        where: condition,
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserLeave,
            order: [['FromDate', 'DESC']],
            include: [{ model: UserMaster, attributes: [] }],
          },
        ],
      });

      auth_request = auth_request1.rows;
      for (let j = 0; j < auth_request.length; j++) {
        let user_leave = await UserLeave.findOne({
          where: {
            UserLeaveApplicationID: auth_request[j].ReferenceID,
            status: 1,
          },
        });

        if (user_leave) {
          let authorizationmaster = await AuthorizationMaster.findOne({
            where: { authorizationMasterName: 'Leave' },
          });

          let authorizationdetails = await AuthorizationDetails.findOne({
            where: {
              AuthorizationMasterID: authorizationmaster.authorizationMasterID,
              userMasterID: user_leave.userMasterID,
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

            auth_request[j].dataValues.Auth_Criteria =
              AuthorizationCriterias.AuthorizationCriteria;
          }

          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: user_leave.userMasterID,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: auth_request[j].updateBy,
            },
          });

          if (user1) {
            auth_request[j].dataValues.user = user1.dataValues.displayName;
            auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
            auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
          }
          if (user2) {
            auth_request[j].updateBy = user2.dataValues.displayName;
          }

          let TableName = auth_request[j].TableName;
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
            JSON.stringify(auth_request[j].TableName) +
            "'::regclass AND i.indisprimary;"
          );
          referncedata = await executeQuery(
            'select * from public.' +
            JSON.stringify(auth_request[j].TableName) +
            '  WHERE ' +
            JSON.stringify(result[0].attname) +
            ' = ' +
            auth_request[j].ReferenceID +
            '; '
          );

          for (var k = 0; k < referncedata.length; k++) {
            let user1 = await UserMaster.findOne({
              where: {
                userMasterID: referncedata[k].userMasterID,
              },
            });
            referncedata[k].User = user1.dataValues.displayName;
          }
          if (referncedata) {
            auth_request[j].dataValues.Referencedata = referncedata[0];
          }
        }
      }
    } else if (user != '' && startdate == '' && enddate == '') {
      auth_request1 = await LeaveAuthorizationRequest.findAndCountAll({
        where: {
          [Sequelize.Op.and]: [{ userMasterID: userMasterID }],
          '$userLeave.userMasterID$': {
            [Sequelize.Op.in]: user,
          },
          status: 1,
        },

        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserLeave,
            order: [['FromDate', 'DESC']],
            include: [
              {
                model: UserMaster,
                attributes: [],
              },
            ],
          },
        ],
      });

      auth_request = auth_request1.rows;

      for (let j = 0; j < auth_request.length; j++) {
        let user_leave = await UserLeave.findOne({
          where: {
            UserLeaveApplicationID: auth_request[j].ReferenceID,
            status: 1,
          },
        });

        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Leave' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: user_leave.userMasterID,
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

          auth_request[j].dataValues.Auth_Criteria =
            AuthorizationCriterias.AuthorizationCriteria;
        }

        if (user_leave) {
          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: user_leave.userMasterID,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: auth_request[j].updateBy,
            },
          });

          if (user1) {
            auth_request[j].dataValues.user = user1.dataValues.displayName;
            auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
            auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
          }
          if (user2) {
            auth_request[j].updateBy = user2.dataValues.displayName;
          }

          let TableName = auth_request[j].TableName;
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
            JSON.stringify(auth_request[j].TableName) +
            "'::regclass AND i.indisprimary;"
          );
          referncedata = await executeQuery(
            'select * from public.' +
            JSON.stringify(auth_request[j].TableName) +
            '  WHERE ' +
            JSON.stringify(result[0].attname) +
            ' = ' +
            auth_request[j].ReferenceID +
            '; '
          );
          for (var k = 0; k < referncedata.length; k++) {
            let user1 = await UserMaster.findOne({
              where: {
                userMasterID: referncedata[k].userMasterID,
              },
            });
            referncedata[k].createByUser = user1.dataValues.displayName;
          }
          if (referncedata) {
            auth_request[j].dataValues.Referencedata = referncedata[0];
          }
        }
      }

      // totalcount = await LeaveAuthorizationRequest.count({
      //   where: {
      //     status: 1,
      //     [Sequelize.Op.and]: [
      //       { userMasterID: userMasterID },
      //       // { createBy: user }
      //     ],
      //     '$userLeave.userMasterID$': {
      //       [Sequelize.Op.in]: user,
      //     },
      //   },
      //   include: [{ model: UserLeave, order: [['FromDate', 'DESC']] }],
      // });
    } else if (user == '' && startdate != '' && enddate != '') {
      auth_request1 = await LeaveAuthorizationRequest.findAndCountAll({
        where: {
          '$userLeave.FromDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ userMasterID: userMasterID }],
          status: 1,
        },
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserLeave,
            order: [['FromDate', 'DESC']],
            include: [
              {
                model: UserMaster,
                attributes: [],
              },
            ],
          },
        ],
      });

      auth_request = auth_request1.rows;

      for (let j = 0; j < auth_request.length; j++) {
        let user_leave = await UserLeave.findOne({
          where: {
            UserLeaveApplicationID: auth_request[j].ReferenceID,
            status: 1,
          },
        });

        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Leave' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: user_leave.userMasterID,
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

          auth_request[j].dataValues.Auth_Criteria =
            AuthorizationCriterias.AuthorizationCriteria;
        }

        if (user_leave) {
          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: user_leave.userMasterID,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: auth_request[j].updateBy,
            },
          });

          if (user1) {
            auth_request[j].dataValues.user = user1.dataValues.displayName;
            auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
            auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
          }
          if (user2) {
            auth_request[j].updateBy = user2.dataValues.displayName;
          }

          let TableName = auth_request[j].TableName;
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
            JSON.stringify(auth_request[j].TableName) +
            "'::regclass AND i.indisprimary;"
          );
          referncedata = await executeQuery(
            'select * from public.' +
            JSON.stringify(auth_request[j].TableName) +
            '  WHERE ' +
            JSON.stringify(result[0].attname) +
            ' = ' +
            auth_request[j].ReferenceID +
            '; '
          );
          for (var k = 0; k < referncedata.length; k++) {
            let user1 = await UserMaster.findOne({
              where: {
                userMasterID: referncedata[k].userMasterID,
              },
            });
            referncedata[k].createByUser = user1.dataValues.displayName;
          }
          if (referncedata) {
            auth_request[j].dataValues.Referencedata = referncedata[0];
          }
        }
      }
    } else {
      auth_request1 = await LeaveAuthorizationRequest.findAndCountAll({
        where: {
          // createdAt: {
          //   [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          // },
          '$userLeave.FromDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [
            { userMasterID: userMasterID },
            // { createBy: user }
          ],
          '$userLeave.userMasterID$': {
            [Sequelize.Op.in]: user,
          },
          status: 1,
        },
        // include: [{ model: UserLeave }],
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserLeave,
            order: [['FromDate', 'DESC']],
            include: [
              {
                model: UserMaster,
                attributes: [],
              },
            ],
          },
        ],
      });

      auth_request = auth_request1.rows;

      for (var j = 0; j < auth_request.length; j++) {
        let user_leave = await UserLeave.findOne({
          where: {
            UserLeaveApplicationID: auth_request[j].ReferenceID,
            status: 1,
          },
        });

        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Leave' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: user_leave.userMasterID,
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

          auth_request[j].dataValues.Auth_Criteria =
            AuthorizationCriterias.AuthorizationCriteria;
        }

        if (user_leave) {
          let user1 = await UserMaster.findOne({
            where: {
              userMasterID: user_leave.userMasterID,
            },
          });
          let user2 = await UserMaster.findOne({
            where: {
              userMasterID: auth_request[j].updateBy,
            },
          });

          if (user1) {
            auth_request[j].dataValues.user = user1.dataValues.displayName;
            auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;

            auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
          }
          if (user2) {
            auth_request[j].updateBy = user2.dataValues.displayName;
          }

          let TableName = auth_request[j].TableName;
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
            JSON.stringify(auth_request[j].TableName) +
            "'::regclass AND i.indisprimary;"
          );
          referncedata = await executeQuery(
            'select * from public.' +
            JSON.stringify(auth_request[j].TableName) +
            '  WHERE ' +
            JSON.stringify(result[0].attname) +
            ' = ' +
            auth_request[j].ReferenceID +
            '; '
          );
          for (let k = 0; k < referncedata.length; k++) {
            let user1 = await UserMaster.findOne({
              where: {
                userMasterID: referncedata[k].userMasterID,
              },
            });
            referncedata[k].createByUser = user1.dataValues.displayName;
          }
          if (referncedata) {
            auth_request[j].dataValues.Referencedata = referncedata[0];
          }
        }
      }
    }

    for (let i = 0; i < auth_request.length; i++) {
      let get_data = await userleavetransaction.findAll({
        where: {
          ReferenceID: auth_request[i].ReferenceID,
        },
        order: [['date', 'ASC']],
        include: [
          {
            model: HrLeaveTypes,
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
              },
            ],
          },
        ],
      });

      let leaveType = [];
      for (let index = 0; index < get_data.length; index++) {
        let temp = {
          date: get_data[index].date,
          leave: get_data[index].hrLeaveType.LeaveMaster.LeaveName,
          days: get_data[index].days,
        };
        leaveType.push(temp);
      }

      auth_request[i].dataValues.leave = leaveType;
    }

    return res.status(200).json({
      status: 200,
      data: auth_request,
      totalcount: auth_request1.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.listLeaveAuthRequest = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$userLeave.status$': 1,
    };

    if ((!user || user.length === 0) && status) {
      condition.authstatus = status;
      if (status == 2)
        condition['$userLeave.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
    }

    if (user && user.length > 0) {
      condition['$userLeave.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$userLeave.FromDate$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const { rows: authRequest, count } =
      await LeaveAuthorizationRequest.findAndCountAll({
        raw: true,
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: UserLeave,
            include: [
              {
                model: UserMaster,
                attributes: ['displayName', 'userNumber'],
                include: [
                  {
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },
                  {
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
                attributes: [],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: authRequest,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.listLeaveAuthRequestNew = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$userLeave.status$': 1,
    };

    if (status) {
      condition.authstatus = status;
      if (status == 2)
        condition['$userLeave.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
    }

    if (user && user.length > 0) {
      condition['$userLeave.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$userLeave.FromDate$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const { rows: authRequest, count } =
      await LeaveAuthorizationRequest.findAndCountAll({
        // raw: true,
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: UserLeave,
            include: [
              {
                model: UserMaster,
                attributes: [
                  'displayName',
                  'userNumber',
                  'userMasterID',
                  'photo',
                ],
                include: [
                  {
                    separate: true,
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
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
                attributes: ['LeaveID'],
                include: [
                  {
                    model: HrLeaveMaster,
                    as: 'LeaveMaster',
                    attributes: ['LeaveName'],
                  },
                ],
              },
              {
                separate: true,
                required: false,
                model: userleavetransaction,
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
                  [
                    Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'),
                    'LeaveName',
                  ],
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
                  [
                    Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'),
                    'LeaveName',
                  ],
                ],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: authRequest,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.listOutdoorDutyAuthRequest = async (req, res, next) => {
  try {
    const { limit, page, startdate, enddate, userMasterID, user, status } =
      req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const condition = {
      status: 1,
      userMasterID,
      '$userLeave.status$': 1,
    };

    if ((!user || user.length === 0) && status) {
      condition.authstatus = status;
      if (status == 2)
        condition['$userLeave.authorizationStatus$'] = {
          [Sequelize.Op.notIn]: [3, 4],
        };
    }

    if (user && user.length > 0) {
      condition['$userLeave.userMasterID$'] = {
        [Sequelize.Op.in]: user,
      };
    }

    if (startdate && enddate) {
      condition['$userLeave.FromDate$'] = {
        [Sequelize.Op.between]: [startdate, enddate],
      };
    }

    const { rows: authRequest, count } =
      await LeaveAuthorizationRequest.findAndCountAll({
        distinct: true,
        where: condition,
        ...paginateCondition,
        order: [['createdAt', 'DESC']],
        include: [
          {
            required: true,
            model: UserLeave,
            include: [
              {
                model: UserMaster,
                attributes: [
                  'displayName',
                  'userNumber',
                  'userMasterID',
                  'photo',
                ],
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
                where: { LeaveID: 25, status: 1 },
                // attributes: [],
              },
              {
                separate: true,
                required: false,
                model: userleavetransaction,
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
                  [
                    Sequelize.col('hrLeaveType.LeaveMaster.LeaveName'),
                    'LeaveName',
                  ],
                ],
              },
            ],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: authRequest,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

function getSalaryMonths(fromDate, toDate, cycleStartDate = 1, type = 'S') {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (!type) type = 'S';
  if (!cycleStartDate) cycleStartDate = 1;

  let salaryMonths = [];

  // Calculate the first salary cycle start date based on the fromDate
  let currentCycleStart = new Date(from);
  currentCycleStart.setDate(cycleStartDate);

  if (from.getDate() < cycleStartDate) {
    // If fromDate is before the cycle start date, adjust to the previous month
    currentCycleStart.setMonth(currentCycleStart.getMonth() - 1);
  }

  while (currentCycleStart <= to) {
    // Calculate the start month of the current cycle
    const startYear = currentCycleStart.getFullYear();
    const startMonth = currentCycleStart.getMonth() + 1;
    const startMonthValue = startYear * 100 + startMonth;

    if (type === 'S' && !salaryMonths.includes(startMonthValue)) {
      salaryMonths.push(startMonthValue);
    }

    if (type === 'E') {
      // Calculate the end month of the current cycle
      const cycleEnd = new Date(currentCycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1); // Move to next month
      cycleEnd.setDate(cycleEnd.getDate() - 1); // Set to the last day of the cycle

      const endYear = cycleEnd.getFullYear();
      const endMonth = cycleEnd.getMonth() + 1;
      const endMonthValue = endYear * 100 + endMonth;

      if (!salaryMonths.includes(endMonthValue)) {
        salaryMonths.push(endMonthValue);
      }
    }

    // Move to the next salary cycle
    currentCycleStart.setMonth(currentCycleStart.getMonth() + 1);
  }

  return salaryMonths.sort((a, b) => a - b);
}

exports.authorizationacceptreject = async (req, res, next) => {
  try {
    let {
      AuthorizationRequestId,
      authstatus,
      ReferenceID,
      leavetransaction = [],
      rejectionRemarks,
    } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    const Rejected = 0;
    const Accepted = 1;
    let leavesequence = true,
      pendingUser = [],
      acceptedUser = [];

    if (authstatus != Rejected) {
      const allDates = [...leavetransaction]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((e) => e.date);

      const firstDate = allDates[0];
      const lastDate = allDates[allDates.length - 1];

      const company = await UserMaster.findOne({
        where: {
          userMasterID: leavetransaction[0].userMasterID,
        },
        include: [
          {
            required: false,
            model: EmployeeSalaryPolicy,
            where: {
              status: 1,
              startDate: { [Sequelize.Op.lte]: new Date(lastDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(lastDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            attributes: ['salaryPolicyID'],
            include: [
              {
                model: SalaryPolicy,
                as: 'salaryPolicy',
              },
            ],
          },
        ],
      });

      const salaryPolicy =
        company.employeeSalaryPolicies &&
          company.employeeSalaryPolicies.length > 0 &&
          company.employeeSalaryPolicies[0].salaryPolicy
          ? company.employeeSalaryPolicies[0].salaryPolicy
          : null;

      let cycleStartDate = '',
        consider = '';
      if (salaryPolicy) {
        cycleStartDate = +salaryPolicy.salaryCycleDate;
        consider = salaryPolicy.salaryCycleConsider;
      }

      const allMonths = getSalaryMonths(
        firstDate,
        lastDate,
        cycleStartDate,
        consider
      );

      const attendanceCal = await HrLeaveMonthTrans.findAll({
        where: {
          userMasterID: leavetransaction[0].userMasterID,
          AttnYearMon: {
            [Sequelize.Op.in]: allMonths,
          },
          verified: 1,
        },
      });

      if (attendanceCal.length > 0) {
        return res.status(200).json({
          status: 401,
          message: 'Attendance already verified. So can not approve leave',
          data: {},
        });
      }

      let userCompany = company.companyMasterId;

      const userleaveBalance = await employeeeLeaveBalance(
        userCompany,
        leavetransaction[0].userMasterID
      );

      const currentRangeData = [];

      // to get current range data and lapse range data

      await Promise.all(
        leavetransaction.map(async (e) => {
          const filterbalance = userleaveBalance.find(
            (f) => f.LeaveTranId == e.LeaveTranId && +e.days > 0
          );

          const filterbalance1 = userleaveBalance.find(
            (f) => f.LeaveTranId == e.LeaveTranId1 && +e.days1 > 0
          );

          if (filterbalance) {
            currentRangeData.push({
              leaveTranId: +filterbalance.LeaveTranId,
              days: +e.days,
            });
          }

          if (filterbalance1) {
            currentRangeData.push({
              leaveTranId: +filterbalance1.LeaveTranId,
              days: +e.days1,
            });
          }
        })
      );

      const notSufficientbalance = [];

      // to check balance

      await Promise.all(
        userleaveBalance.map(async (e) => {
          const current_Data = currentRangeData.filter(
            (f) => f.leaveTranId == e.LeaveTranId
          );

          if (+current_Data.length > 0) {
            const totalcurrentLeave = current_Data.reduce(
              (acc, obj) => acc + +obj.days,
              0
            );
            if (+e.Balance < +totalcurrentLeave) {
              notSufficientbalance.push(e.leaveName);
              return;
            }
          }
        })
      );

      if (+notSufficientbalance.length > 0) {
        return res.status(200).json({
          status: 401,
          message: `You don't have sufficient leave balance of ${notSufficientbalance[0]} .`,
        });
      }
    }

    // Change Auth Status of request
    await sequelize.transaction(async (t) => {
      // Update Authorization Request
      await LeaveAuthorizationRequest.update(
        {
          viewstatus: 0,
          authstatus: authstatus,
          updateBy: createBy,
          rejectionRemarks: rejectionRemarks ? rejectionRemarks : null,
        },
        {
          where: { AuthorizationRequestId: AuthorizationRequestId },
          transaction: t,
        }
      );

      // Find User Leave
      let user_leave = await UserLeave.findOne({
        where: {
          UserLeaveApplicationID: ReferenceID,
          status: 1,
        },
      });

      // Find Authorization Master
      let authorizationmaster = await AuthorizationMaster.findOne({
        where: { authorizationMasterName: 'Leave' },
      });

      // Find User Authorization Details
      let authorizationdetails = await AuthorizationDetails.findOne({
        where: {
          AuthorizationMasterID: authorizationmaster.authorizationMasterID,
          userMasterID: user_leave.userMasterID,
          status: 1,
        },
        raw: true,
      });

      // Check data form authorization
      if (authorizationdetails) {
        // Find User Auth AuthorizationCriteria
        let AuthorizationCriterias = await AuthorizationCriteria.findOne({
          where: {
            AuthorizationCriteriaID:
              authorizationdetails.AuthorizationCriteriaID,
            status: 1,
          },
          raw: true,
        });

        // Find Leave Authorization Request
        const leaveAuthorizationRequest =
          await LeaveAuthorizationRequest.findAll({
            raw: true,
            where: {
              ReferenceID: ReferenceID,
            },
            transaction: t,
          });

        // All Leave Authorization Request IDs
        const AuthorizationRequestIds = leaveAuthorizationRequest.map(
          (item) => item.AuthorizationRequestId
        );

        // Auth Criteria is sequence
        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          // Destroy All User Inbox Data Of Authorization Request IDs
          await UserInbox.destroy(
            {
              where: {
                activityTable: LeaveAuthorizationRequest.getTableName(),
                activityTablePK: AuthorizationRequestIds,
              },
            },
            { transaction: t }
          );

          if (authstatus == Rejected) {
            acceptedUser.push(+createBy);

            // Update User Leave Auth Status 4 As Rejected
            await UserLeave.update(
              {
                authorizationStatus: 4,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  UserLeaveApplicationID: ReferenceID,
                  status: 1,
                },
                transaction: t,
              }
            );
          } else {
            // Accepted

            // Find Auth Request Sequence
            let auth_requestsequence = await LeaveAuthorizationRequest.findAll({
              where: {
                ReferenceID: ReferenceID,
                authstatus: {
                  [Sequelize.Op.not]: 0,
                },
              },
            });

            let arr = [];
            for (let k = 0; k < auth_requestsequence.length; k++) {
              arr.push(parseInt(auth_requestsequence[k].userMasterID));
            }

            // Form Authorization User
            let FormAuthorizationsUser =
              authorizationdetails.AuthorizedByUserMasterId;

            // Get Remaining User IDs
            let remainingid = FormAuthorizationsUser.filter(
              (d) => !arr.includes(d)
            );

            if (remainingid.length > 0) {
              leavesequence = false;
              pendingUser = remainingid;
              // Create Authorization Request For Next Sequence Number
              let insert_db_status1 = await LeaveAuthorizationRequest.create(
                {
                  TableName: 'userLeaves',
                  ReferenceID: ReferenceID,
                  userMasterID: remainingid[0],
                  status: 1,
                  authstatus: 2,
                  createBy: createBy,
                },
                { transaction: t }
              );
              for (let j = 0; j < leavetransaction.length; j++) {
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }

              // User Info For Leave Applied User
              let userinfo = await UserMaster.findOne({
                where: {
                  userMasterID: user_leave.userMasterID,
                },
              });

              // Create User Inbox For New Leave Authorization Request
              await UserInbox.create(
                {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK:
                    insert_db_status1.toJSON().AuthorizationRequestId,
                  message: `${userinfo.displayName
                    } has applied for leave request from ${moment(
                      user_leave.FromDate
                    ).format('DD/MM/YYYY')} to ${moment(user_leave.ToDate).format(
                      'DD/MM/YYYY'
                    )}`,
                  assignedTo: remainingid[0],
                  assignedBy: user_leave.userMasterID,
                },
                { transaction: t }
              );

              if (userinfo) {
                // Send Notification To Authorized User
                const notification = {
                  title: 'Leave',
                  body: userinfo.displayName + ' requested for leave.',
                };
                const data = {
                  screen: 'leaveauth',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };
                await sendNotification(remainingid[0], notification, data);
              }
              await sendMailForLeave(user_leave, insert_db_status1.toJSON().AuthorizationRequestId, remainingid[0]);
            } else {
              // Update User Leave As Accepted
              await UserLeave.update(
                {
                  authorizationStatus: 3,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: ReferenceID,
                    status: 1,
                  },
                  transaction: t,
                }
              );

              acceptedUser = authorizationdetails.AuthorizedByUserMasterId;

              // Find User Leave Transaction
              let leave_transaction_record = await userleavetransaction.findOne(
                {
                  where: {
                    ReferenceID: ReferenceID,
                  },
                }
              );

              if (leave_transaction_record) {
                // Destroy All User Leave Transaction With ReferenceID
                await userleavetransaction.destroy({
                  where: {
                    ReferenceID: ReferenceID,
                  },
                  transaction: t,
                });
              }

              for (let j = 0; j < leavetransaction.length; j++) {
                // Create User Leave Transaction
                await userleavetransaction.create(
                  {
                    ReferenceID: leavetransaction[j].ReferenceID,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                    createBy: createBy,
                    createByIp: createByIp,
                  },
                  { transaction: t }
                );
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  // Create User Leave Transaction If Multiple Entry For Same Date
                  await userleavetransaction.create(
                    {
                      ReferenceID: leavetransaction[j].ReferenceID,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                      createBy: createBy,
                      createByIp: createByIp,
                    },
                    { transaction: t }
                  );
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
            }
          }
        } else if (AuthorizationCriterias.AuthorizationCriteria == 'Any One') {
          // Destroy User Inbox
          await UserInbox.destroy(
            {
              where: {
                activityTable: LeaveAuthorizationRequest.getTableName(),
                activityTablePK: AuthorizationRequestIds,
              },
            },
            { transaction: t }
          );

          if (authstatus == Rejected) {
            acceptedUser.push(+createBy);

            // Update User Leave Auth Status 4 As Rejected
            await UserLeave.update(
              {
                authorizationStatus: 4,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  UserLeaveApplicationID: ReferenceID,
                  status: 1,
                },
                transaction: t,
              }
            );
          } else {
            // Find Auth Request
            let auth_requestanyoneaccept =
              await LeaveAuthorizationRequest.findAll({
                where: {
                  ReferenceID: ReferenceID,
                  authstatus: 1,
                },
              });

            let accept = auth_requestanyoneaccept.length;

            if (accept + 1 >= 1) {
              // If any Of the User Approved Then
              await UserLeave.update(
                {
                  authorizationStatus: 3,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: ReferenceID,
                    status: 1,
                  },
                  transaction: t,
                }
              );
              acceptedUser.push(+createBy);
              let leave_transaction_record = await userleavetransaction.findOne(
                {
                  where: {
                    ReferenceID: ReferenceID,
                  },
                }
              );

              if (leave_transaction_record) {
                let delete_db_status = await userleavetransaction.destroy({
                  where: {
                    ReferenceID: ReferenceID,
                  },
                  transaction: t,
                });
              }
              for (let j = 0; j < leavetransaction.length; j++) {
                await userleavetransaction.create(
                  {
                    ReferenceID: leavetransaction[j].ReferenceID,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                    createBy: createBy,
                    createByIp: createByIp,
                  },
                  { transaction: t }
                );
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await userleavetransaction.create(
                    {
                      ReferenceID: leavetransaction[j].ReferenceID,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                      createBy: createBy,
                      createByIp: createByIp,
                    },
                    { transaction: t }
                  );
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
            }
          }
        } else if (AuthorizationCriterias.AuthorizationCriteria == 'Any Two') {
          if (authstatus == Rejected) {
            acceptedUser.push(+createBy);
            // Update User Leave Auth Status 4 As Rejected
            await UserLeave.update(
              {
                authorizationStatus: 4,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  UserLeaveApplicationID: ReferenceID,
                  status: 1,
                },
                transaction: t,
              }
            );
            // Destroy User Inbox
            await UserInbox.destroy(
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: AuthorizationRequestIds,
                },
              },
              { transaction: t }
            );
          } else {
            // Find Auth Request
            let auth_requestanyoneaccept =
              await LeaveAuthorizationRequest.findAll({
                where: {
                  ReferenceID: ReferenceID,
                  authstatus: 1,
                },
              });
            // Destroy User Inbox
            await UserInbox.destroy(
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: AuthorizationRequestId,
                },
              },
              { transaction: t }
            );

            let accept = auth_requestanyoneaccept.length;

            if (accept + 1 >= 2) {
              for (let item of auth_requestanyoneaccept)
                acceptedUser.push(item.userMasterID);

              acceptedUser.push(+createBy);

              await UserInbox.destroy(
                {
                  where: {
                    activityTable: LeaveAuthorizationRequest.getTableName(),
                    activityTablePK: AuthorizationRequestIds,
                  },
                },
                { transaction: t }
              );

              let update_data = await UserLeave.update(
                {
                  authorizationStatus: 3,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: ReferenceID,
                    status: 1,
                  },
                  transaction: t,
                }
              );

              let leave_transaction_record = await userleavetransaction.findOne(
                {
                  where: {
                    ReferenceID: ReferenceID,
                  },
                }
              );

              if (leave_transaction_record) {
                let delete_db_status = await userleavetransaction.destroy({
                  where: {
                    ReferenceID: ReferenceID,
                  },
                  transaction: t,
                });
              }
              for (let j = 0; j < leavetransaction.length; j++) {
                let insert_child_status = await userleavetransaction.create(
                  {
                    ReferenceID: leavetransaction[j].ReferenceID,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                    createBy: createBy,
                    createByIp: createByIp,
                  },
                  { transaction: t }
                );
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await userleavetransaction.create(
                    {
                      ReferenceID: leavetransaction[j].ReferenceID,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                      createBy: createBy,
                      createByIp: createByIp,
                    },
                    { transaction: t }
                  );
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
            } else {
              leavesequence = false;
              for (let j = 0; j < leavetransaction.length; j++) {
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
              let auth_requestanyonereject =
                await LeaveAuthorizationRequest.findAll({
                  where: {
                    ReferenceID: ReferenceID,
                    authstatus: 2,
                  },
                });
              pendingUser = [];
              for (let item of auth_requestanyonereject)
                pendingUser.push(item.userMasterID);
            }
          }
        } else {
          if (authstatus == Rejected) {
            acceptedUser.push(+createBy);
            let update_data = await UserLeave.update(
              {
                authorizationStatus: 4,
                updateBy: createBy,
                updateByIp: createByIp,
              },
              {
                where: {
                  UserLeaveApplicationID: ReferenceID,
                  status: 1,
                },
                transaction: t,
              }
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
          } else {
            let auth_requestanyoneaccept =
              await LeaveAuthorizationRequest.findAll({
                where: {
                  ReferenceID: ReferenceID,
                  authstatus: 1,
                },
              });

            let accept = auth_requestanyoneaccept.length;

            await UserInbox.destroy(
              {
                where: {
                  activityTable: LeaveAuthorizationRequest.getTableName(),
                  activityTablePK: AuthorizationRequestId,
                },
              },
              { transaction: t }
            );

            if (accept + 1 >= 3) {
              for (let item of auth_requestanyoneaccept)
                acceptedUser.push(item.userMasterID);

              acceptedUser.push(+createBy);

              await UserInbox.destroy(
                {
                  where: {
                    activityTable: LeaveAuthorizationRequest.getTableName(),
                    activityTablePK: AuthorizationRequestIds,
                  },
                },
                { transaction: t }
              );

              let update_data = await UserLeave.update(
                {
                  authorizationStatus: 3,
                  updateBy: createBy,
                  updateByIp: createByIp,
                },
                {
                  where: {
                    UserLeaveApplicationID: ReferenceID,
                    status: 1,
                  },
                  transaction: t,
                }
              );

              let leave_transaction_record = await userleavetransaction.findOne(
                {
                  where: {
                    ReferenceID: ReferenceID,
                  },
                  transaction: t,
                }
              );

              if (leave_transaction_record) {
                let delete_db_status = await userleavetransaction.destroy({
                  where: {
                    ReferenceID: ReferenceID,
                  },
                  transaction: t,
                });
              }
              for (let j = 0; j < leavetransaction.length; j++) {
                await userleavetransaction.create(
                  {
                    ReferenceID: leavetransaction[j].ReferenceID,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                    createBy: createBy,
                    createByIp: createByIp,
                  },
                  { transaction: t }
                );
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await userleavetransaction.create(
                    {
                      ReferenceID: leavetransaction[j].ReferenceID,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                      createBy: createBy,
                      createByIp: createByIp,
                    },
                    { transaction: t }
                  );
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
            } else {
              leavesequence = false;
              for (let j = 0; j < leavetransaction.length; j++) {
                await ApprovedLeaveAuthorization.create(
                  {
                    UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                    AuthorizationRequestId: AuthorizationRequestId,
                    LeaveTranId: leavetransaction[j].LeaveTranId,
                    days: leavetransaction[j].days,
                    date: leavetransaction[j].date,
                    issandwichleave: leavetransaction[j].issandwichleave,
                  },
                  { user: req.userDetails },
                  { transaction: t }
                );
                if (Number(leavetransaction[j].days1) > 0) {
                  await ApprovedLeaveAuthorization.create(
                    {
                      UserLeaveApplicationID: leavetransaction[j].ReferenceID,
                      AuthorizationRequestId: AuthorizationRequestId,
                      LeaveTranId: leavetransaction[j].LeaveTranId1,
                      days: leavetransaction[j].days1,
                      date: leavetransaction[j].date,
                      issandwichleave: leavetransaction[j].issandwichleave,
                    },
                    { user: req.userDetails },
                    { transaction: t }
                  );
                }
              }
              let auth_requestanyonereject =
                await LeaveAuthorizationRequest.findAll({
                  where: {
                    ReferenceID: ReferenceID,
                    authstatus: 2,
                  },
                });
              pendingUser = [];
              for (let item of auth_requestanyonereject)
                pendingUser.push(item.userMasterID);
            }
          }
        }
      }

      if (authstatus == Accepted) {
        if (leavesequence) {
          const notification = {
            title: 'Leave',
            body: 'Leave accepted successfully',
          };
          const data = {
            screen: 'leave',
          };
          await sendNotification(user_leave.userMasterID, notification, data);

          if (user_leave) {
            const data = {
              NoOfDays: user_leave.LeaveDays,
              FromDate: user_leave.FromDate,
              ToDate: user_leave.ToDate,
              LeaveType: [],
              acceptedUserList: acceptedUser,
            };

            for (let item of leavetransaction)
              data.LeaveType.push(item.LeaveTranId);

            sendAcceptRejectMail(
              'Leave Accept Email Template',
              data,
              user_leave.userMasterID
            );
          }
        } else {
          pendingUser = pendingUser.filter((item) => +item !== +createBy);

          if (user_leave) {
            acceptedUser.push(+createBy);
            const data = {
              NoOfDays: user_leave.LeaveDays,
              FromDate: user_leave.FromDate,
              ToDate: user_leave.ToDate,
              LeaveType: [],
              acceptedUserList: acceptedUser,
              pendingUserList: pendingUser,
            };

            for (let item of leavetransaction)
              data.LeaveType.push(item.LeaveTranId);

            sendAcceptRejectMail(
              'Leave Update Email Template',
              data,
              user_leave.userMasterID
            );
          }
        }

        return res.status(200).json({
          status: 200,
          message: message.usermessage.authaccept,
          data: {},
        });
      } else {
        const notification = {
          title: 'Leave',
          body: 'Leave rejected',
        };
        const data = {
          screen: 'leave',
        };
        await sendNotification(user_leave.userMasterID, notification, data);

        if (user_leave) {
          const data = {
            NoOfDays: user_leave.LeaveDays,
            FromDate: user_leave.FromDate,
            ToDate: user_leave.ToDate,
            LeaveType: [],
            rejectedUserList: acceptedUser,
            RejectedReason: '',
          };

          data.LeaveType.push(user_leave.LeaveTranId);

          sendAcceptRejectMail(
            'Leave Reject Email Template',
            data,
            user_leave.userMasterID
          );
        }

        return res.status(200).json({
          status: 200,
          message: message.usermessage.authreject,
          data: {},
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

async function sendMailForLeave(leavedata, AuthorizationRequestId, id) {
  try {

    let user = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: id,
        status: 1,
      },
    });
    let get_MailTemplate;
    let get_NotificationPolicy = await findCompanyNotificationPolicy(
      +leavedata.companyMasterID
    );

    if (get_NotificationPolicy) {
      get_MailTemplate = await MailTemplateEditor.findOne({
        raw: true,
        where: {
          companyMasterID: leavedata.companyMasterID,
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
            userMasterID: leavedata.userMasterID,
            status: 1,
          },
          attributes: ['displayName'],
        });
        empname = emp_name ? emp_name.displayName : '';

        let emp_code = await EmployeeJoiningDetails.findOne({
          raw: true,
          where: {
            userMasterID: leavedata.userMasterID,
            status: 1,
          },
          attributes: ['employeeCode'],
        });
        empcode = emp_code ? emp_code.employeeCode : '';

        let leave_type = await HrLeaveTypes.findOne({
          raw: true,
          where: {
            LeaveTranId: leavedata.LeaveTranId,
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
            userMasterID: leavedata.userMasterID,
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
            userMasterID: leavedata.userMasterID,
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
            userMasterID: leavedata.userMasterID,
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
          leavedata.ToDate
        );
        get_MailTemplate.subject = get_MailTemplate.subject.replace(
          '[FromDate]',
          leavedata.FromDate
        );
        get_MailTemplate.subject = get_MailTemplate.subject.replace(
          '[Reason]',
          leavedata.Remark
        );
        get_MailTemplate.subject = get_MailTemplate.subject.replace(
          '[NoOfDays]',
          leavedata.LeaveDays
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
          leavedata.ToDate
        );
        get_MailTemplate.body = get_MailTemplate.body.replace(
          '[FromDate]',
          leavedata.FromDate
        );
        get_MailTemplate.body = get_MailTemplate.body.replace(
          '[Reason]',
          leavedata.Remark
        );
        get_MailTemplate.body = get_MailTemplate.body.replace(
          '[NoOfDays]',
          leavedata.LeaveDays
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

        const myTemplate = JSON.parse(JSON.stringify(get_MailTemplate));
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

        let mailData = {
          email_id: user.email,
          body: myTemplate.body,
          subject: myTemplate.subject,
          email: get_NotificationPolicy.email,
          password: get_NotificationPolicy.password,
          port: get_NotificationPolicy.port,
          host: get_NotificationPolicy.hostmail,
          secure: get_NotificationPolicy.secure,
        };

        sendEmailForLeave(mailData);
      }
    }
  } catch (error) {
    console.error(error);
    return;
  }
}
exports.acceptRejectOutdoorDuty = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { AuthorizationRequestId, authstatus, rejectionRemarks } =
      await req.body;

    let notification = false;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    const authRequest = await LeaveAuthorizationRequest.findOne({
      where: { AuthorizationRequestId },
      transaction,
      include: [{ required: true, model: UserLeave }],
    });

    if (!authRequest) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 401, message: 'Authorization request not found' });
    }

    const ReferenceID = authRequest.ReferenceID;
    const outdoorDuty = authRequest.userLeave;
    const userMasterID = authRequest.userLeave.userMasterID;

    const start = new Date(authRequest.userLeave.FromDate);
    const end = new Date(authRequest.userLeave.ToDate);
    const leavetransaction = [];

    while (start <= end) {
      leavetransaction.push({
        ReferenceID: ReferenceID,
        LeaveTranId: outdoorDuty.LeaveTranId,
        days: +outdoorDuty.LeaveDays >= 1 ? 1 : 0.5,
        date: start.toISOString().split('T')[0],
        issandwichleave: 0,
        status: 1,
        createBy,
        createByIp,
      });
      start.setDate(start.getDate() + 1); // Increment by 1 day
    }

    if (authstatus != 0) {
      const allDates = [...leavetransaction]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((e) => e.date);

      const firstDate = allDates[0];
      const lastDate = allDates[allDates.length - 1];

      const company = await UserMaster.findOne({
        where: {
          userMasterID: userMasterID,
        },
        include: [
          {
            required: false,
            model: EmployeeSalaryPolicy,
            where: {
              status: 1,
              startDate: { [Sequelize.Op.lte]: new Date(lastDate) },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date(lastDate) } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            attributes: ['salaryPolicyID'],
            include: [
              {
                model: SalaryPolicy,
                as: 'salaryPolicy',
              },
            ],
          },
        ],
      });

      const salaryPolicy =
        company.employeeSalaryPolicies &&
          company.employeeSalaryPolicies.length > 0 &&
          company.employeeSalaryPolicies[0].salaryPolicy
          ? company.employeeSalaryPolicies[0].salaryPolicy
          : null;

      let cycleStartDate = '',
        consider = '';
      if (salaryPolicy) {
        cycleStartDate = +salaryPolicy.salaryCycleDate;
        consider = salaryPolicy.salaryCycleConsider;
      }

      const allMonths = getSalaryMonths(
        firstDate,
        lastDate,
        cycleStartDate,
        consider
      );

      const attendanceCal = await HrLeaveMonthTrans.findAll({
        where: {
          userMasterID: userMasterID,
          AttnYearMon: {
            [Sequelize.Op.in]: allMonths,
          },
          verified: 1,
        },
      });

      if (attendanceCal.length > 0) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message:
            'Attendance already verified. So can not approve Outdoor Duty',
        });
      }
    }

    const allAuthData = await LeaveAuthorizationRequest.findAll({
      where: { ReferenceID },
      transaction,
      include: [{ model: UserLeave }],
    });

    const authorizationDetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationMasterTypes.leave, // Leave Id
        userMasterID: userMasterID,
        status: 1,
      },
      transaction,
    });

    if (!authorizationDetails) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 401, message: 'Authorization details not found' });
    }

    const authorizationCriteria = await AuthorizationCriteria.findOne({
      where: {
        AuthorizationCriteriaID: authorizationDetails.AuthorizationCriteriaID,
        status: 1,
      },
    });

    if (!authorizationCriteria) {
      await transaction.rollback();
      return res
        .status(200)
        .json({ status: 500, message: 'Authorization criteria not found' });
    }

    const allAuthIds = allAuthData.map((e) => e.AuthorizationRequestId);

    if (authstatus == 0) {
      notification = true;
      await UserInbox.destroy(
        {
          where: {
            activityTable: 'outdoorDutyAuthorizations',
            activityTablePK: allAuthIds,
          },
        },
        { transaction }
      );

      await UserLeave.update(
        { authorizationStatus: 4, updateBy: createBy },
        { where: { UserLeaveApplicationID: ReferenceID }, transaction }
      );
    } else {
      const userinfo = await UserMaster.findOne({
        where: {
          userMasterID,
        },
        transaction,
      });

      const notification1 = {
        title: 'Outdoor Duty',
        body: userinfo.displayName + ' requested for Outdoor Duty.',
      };
      const data = {
        screen: 'outDoorDutyAuth',
      };

      if (authorizationCriteria.AuthorizationCriteria === 'Sequeance No') {
        await UserInbox.destroy(
          {
            where: {
              activityTable: 'outdoorDutyAuthorizations',
              activityTablePK: allAuthIds,
            },
          },
          { transaction }
        );

        const authRequests = allAuthData.filter((e) => e.authstatus != 0);

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
          const outDutyAuth = await LeaveAuthorizationRequest.create(
            {
              ReferenceID,
              userMasterID: remainingUserIds[0],
              TableName: 'userLeaves',
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
              activityTablePK: outDutyAuth.toJSON().AuthorizationRequestId,
              message: `${userinfo.displayName
                } has requested for Outdoor Duty from ${moment(
                  authRequest.userLeave.FromDate
                ).format('DD/MM/YYYY')} to ${moment(
                  authRequest.userLeave.ToDate
                ).format('DD/MM/YYYY')}`,
              assignedTo: remainingUserIds[0],
              assignedBy: userinfo.userMasterID,
            },
            { transaction }
          );

          await sendNotification(remainingUserIds[0], notification1, data);
        } else {
          notification = true;

          await UserLeaveTransaction.bulkCreate(leavetransaction, {
            transaction,
          });

          await UserLeave.update(
            {
              authorizationStatus: 3,
              updateBy: createBy,
            },
            { where: { UserLeaveApplicationID: ReferenceID }, transaction }
          );
        }
      } else if (authorizationCriteria.AuthorizationCriteria === 'Any One') {
        await UserInbox.destroy(
          {
            where: {
              activityTable: 'outdoorDutyAuthorization',
              activityTablePK: AuthorizationRequestId,
            },
          },
          { transaction }
        );

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

        if (approvedRequests.length + 1 >= 1) {
          await UserInbox.destroy(
            {
              where: {
                activityTable: 'outdoorDutyAuthorizations',
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );
          notification = true;
          await UserLeaveTransaction.bulkCreate(leavetransaction, {
            transaction,
          });

          await UserLeave.update(
            {
              authorizationStatus: 3,
              updateBy: createBy,
            },
            { where: { UserLeaveApplicationID: ReferenceID }, transaction }
          );
        }
      } else if (authorizationCriteria.AuthorizationCriteria === 'Any Two') {
        await UserInbox.destroy(
          {
            where: {
              activityTable: 'outdoorDutyAuthorizations',
              activityTablePK: AuthorizationRequestId,
            },
          },
          { transaction }
        );

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);
        if (approvedRequests.length + 1 >= 2) {
          await UserInbox.destroy(
            {
              where: {
                activityTable: 'outdoorDutyAuthorizations',
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );

          notification = true;

          await UserLeaveTransaction.bulkCreate(leavetransaction, {
            transaction,
          });

          await UserLeave.update(
            {
              authorizationStatus: 3,
              updateBy: createBy,
            },
            { where: { UserLeaveApplicationID: ReferenceID }, transaction }
          );
        }
      } else {
        await UserInbox.destroy(
          {
            where: {
              activityTable: 'outdoorDutyAuthorizations',
              activityTablePK: AuthorizationRequestId,
            },
          },
          { transaction }
        );

        const approvedRequests = allAuthData.filter((e) => e.authstatus == 1);

        if (approvedRequests.length + 1 >= 3) {
          await UserInbox.destroy(
            {
              where: {
                activityTable: 'outdoorDutyAuthorizations',
                activityTablePK: allAuthIds,
              },
            },
            { transaction }
          );

          notification = true;

          await UserLeaveTransaction.bulkCreate(leavetransaction, {
            transaction,
          });

          await UserLeave.update(
            {
              authorizationStatus: 3,
              updateBy: createBy,
            },
            { where: { UserLeaveApplicationID: ReferenceID }, transaction }
          );
        }
      }
    }

    await LeaveAuthorizationRequest.update(
      {
        viewstatus: 0,
        authstatus: authstatus,
        updateBy: createBy,
        updateByIp: createByIp,
        rejectionRemarks: rejectionRemarks ? rejectionRemarks : null,
      },
      {
        where: { AuthorizationRequestId: AuthorizationRequestId },
        transaction,
      }
    );

    const data = {
      screen: 'outDoorDutyAuth',
    };

    if (authstatus == 1) {
      if (notification) {
        const notification1 = {
          title: 'Outdoor Duty',
          body: 'Outdoor Duty accepted successfully',
        };

        sendNotification(userMasterID, notification1, data);
      }
    } else {
      const notification1 = {
        title: 'Outdoor Duty',
        body: 'Outdoor Duty rejected successfully',
      };

      sendNotification(userMasterID, notification1, data);
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        authstatus === 1
          ? 'Outdoor Duty Request Accept Successfully'
          : 'Outdoor Duty Request Reject Successfully',
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.outdoorDutyCancellation = async (req, res, next) => {
  try {
    let { userMasterID } = await req.body;

    if (!userMasterID || (userMasterID && userMasterID.length == 0))
      return res.status(200).json({
        status: 401,
        message: 'Invalid Parameters',
      });

    const condition = {};

    condition.userMasterID = {
      [Sequelize.Op.in]: userMasterID,
    };

    condition.authorizationStatus = 3;

    const [rows, hrleaveData] = await Promise.all([
      UserLeaveTransaction.findAll({
        where: {
          status: 1,
        },
        include: [
          {
            required: true,
            model: UserLeave,
            where: condition,
            include: [
              {
                required: true,
                model: UserMaster,
                attributes: ['displayName', 'userNumber', 'userMasterID'],
                order: [['displayName', 'ASC']],
                include: [
                  {
                    model: EmployeeDesignation,
                    where: {
                      status: 1,
                      applicableDate: { [Sequelize.Op.lte]: new Date() },
                      [Sequelize.Op.or]: [
                        { endDate: { [Sequelize.Op.gte]: new Date() } },
                        { endDate: null },
                      ],
                    },
                    separate: true,
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
                        { endDate: null },
                      ],
                    },
                    separate: true,
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
                        { endDate: null },
                      ],
                    },
                    separate: true,
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
                  {
                    required: false,
                    model: EmployeeJoiningDetails,
                    attributes: ['employeeCode'],
                  },
                ],
              },
            ],
            attributes: ['userMasterID'],
          },
          {
            required: true,
            model: HrLeaveTypes,
            where: {
              LeaveID: 25,
            },
            attributes: [],
          },
        ],
        order: [
          [
            { model: UserLeave, as: 'userLeave' },
            { model: UserMaster, as: 'userMaster' },
            'displayName',
            'ASC',
          ],
          ['date', 'DESC'],
        ],
      }),
      HrLeaveMonthTrans.findAll({
        where: {
          userMasterID: userMasterID,
          verified: 1,
        },
        attributes: ['monthstartdate', 'monthenddate', 'userMasterID'],
        group: ['monthstartdate', 'monthenddate', 'userMasterID'],
      }),
    ]);

    const finalData = [];

    rows.forEach((e) => {
      const userMasterID = e.userLeave.userMasterID;
      const verifiedData = hrleaveData.filter(
        (v) => v.userMasterID == userMasterID
      );

      const isDateInRange = verifiedData.some((range) => {
        const startDate = new Date(range.monthstartdate);
        const endDate = new Date(range.monthenddate);
        const checkDate = new Date(e.date);

        return checkDate >= startDate && checkDate <= endDate;
      });

      if (!isDateInRange) finalData.push(e);
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: finalData.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuthorizationRequestByReferanceId = async (req, res, next) => {
  try {
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let get_one_data = await LeaveAuthorizationRequest.findAll({
      where: {
        ReferenceID: req.params.id,
      },
      order: [['AuthorizationRequestId', 'ASC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, false, false),
          attributes: userAttributes,
          include: [
            {
              separate: true,
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
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

            {
              separate: true,
              model: AuthorizationDetails,
              where: {
                status: 1,
                AuthorizationMasterID: 1, // fot Leave
              },
              attributes: ['AuthorizationCriteriaID'],
              include: [
                {
                  model: AuthorizationCriteriaMaster,
                  attributes: ['AuthorizationCriteria'],
                },
              ],
            },
          ],
        },
        {
          model: UserLeave,
          include: [
            {
              model: HrLeaveTypes,
              include: [
                {
                  model: HrLeaveMaster,
                  as: 'LeaveMaster',
                },
              ],
            },
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
            'LeaveTranId',
          ],
        },
      ],
    });
    for (var i = 0; i < get_one_data.length; i++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].userMasterID,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].userLeave.userMasterID,
        },
      });
      get_one_data[i].dataValues.user = user2.displayName;
      get_one_data[i].dataValues.username = user1.displayName;
    }

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.checkapi = async (req, res, next) => {
  try {
    let result = await executeQuery(
      "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
      'departments' +
      "'::regclass AND i.indisprimary;"
    );

    let result1 = await executeQuery(
      'UPDATE public.departments SET ' +
      JSON.stringify('authorizationStatus') +
      ' = 1 WHERE ' +
      JSON.stringify(result[0].attname) +
      ' = ' +
      '2' +
      '; '
    );
  } catch (err) {
    next(err);
  }
};

exports.leavedetails = async (req, res, next) => {
  try {
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let get_one_data = await UserLeave.findOne({
      where: {
        UserLeaveApplicationID: req.params.id,
      },
      include: [
        {
          model: UserMaster,
          include: [
            {
              separate: true,
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
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

            {
              model: EmployeeAttendancePolicy,
              as: 'empAttPolicy',
              where: {
                status: 1,
                startDate: {
                  [Sequelize.Op.lte]: Sequelize.col('userLeave.ToDate'),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: {
                      [Sequelize.Op.gte]: Sequelize.col('userLeave.ToDate'),
                    },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['attendancePolicyID'],
              include: [
                {
                  model: AttendancePolicy,
                  as: 'attendancePolicy',
                },
              ],
            },
            {
              model: EmployeeSalaryPolicy,
              as: 'empSalPolicy',
              where: {
                status: 1,
                startDate: {
                  [Sequelize.Op.lte]: Sequelize.col('userLeave.ToDate'),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: {
                      [Sequelize.Op.gte]: Sequelize.col('userLeave.ToDate'),
                    },
                  },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ['salaryPolicyID'],
              include: [
                {
                  model: SalaryPolicy,
                  as: 'salaryPolicy',
                },
              ],
            },
          ],
        },
        {
          model: HrLeaveTypes,
          include: [
            {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveName'],
            },
          ],
        },
      ],
    });
    if (!get_one_data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Leave'),
        data: {},
      });
    }
    function getDates(startDate, endDate) {
      const dates = [];
      let currentDate = startDate;
      const addDays = function (days) {
        const date = new Date(this.valueOf());
        date.setDate(date.getDate() + days);
        return date;
      };
      while (currentDate <= endDate) {
        dates.push(currentDate);
        currentDate = addDays.call(currentDate, 1);
      }
      return dates;
    }
    let alldates = [];
    const dates = getDates(
      new Date(get_one_data.FromDate),
      new Date(get_one_data.ToDate)
    );
    dates.forEach(function (date) {
      alldates.push(new Date(date).toISOString().slice(0, 10));
    });

    const attendance =
      get_one_data.userMaster?.empAttPolicy?.[0]?.attendancePolicy || null;

    const salaryPolicy =
      get_one_data.userMaster?.empSalPolicy?.[0]?.salaryPolicy || null;

    const currentdate = new Date().toISOString().slice(0, 10);

    const year = currentdate.slice(0, 4);
    const Month = currentdate.slice(5, 7);
    const monday = daysInMonth(Month, year);

    let start_date, end_date;

    if (salaryPolicy) {
      let date = salaryPolicy.salaryCycleDate;

      date = (date < 10 ? '0' : '') + date;

      start_date = year + '-' + Month + '-' + date;

      let date1 = new Date(start_date);
      date1.setDate(date1.getDate() + (monday - 1));

      end_date =
        date1.getFullYear() +
        '-' +
        String(date1.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date1.getDate()).padStart(2, '0');
    } else {
      const date = '01';
      start_date = year + '-' + Month + '-' + date;
      end_date = year + '-' + Month + '-' + monday;
    }

    if (start_date > currentdate) {
      let date1 = new Date(start_date);
      date1.setMonth(date1.getMonth() - 1);

      start_date =
        date1.getFullYear() +
        '-' +
        String(date1.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date1.getDate()).padStart(2, '0');

      let date2 = new Date(end_date);
      date2.setMonth(date2.getMonth() - 1);

      end_date =
        date2.getFullYear() +
        '-' +
        String(date2.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(date2.getDate()).padStart(2, '0');
    }

    const getweekoffholidaytranData = await WeekoffHolidayTran.findAll({
      raw: true,
      where: {
        userMasterID: get_one_data.userMasterID,
        date: {
          [Sequelize.Op.between]: [get_one_data.FromDate, get_one_data.ToDate],
        },
      },
    });

    if (attendance) {
      if (
        attendance.sandwichLeave == true &&
        attendance.weekoffsandwichLeave == true &&
        (attendance.holidaysandwichLeave == null ||
          attendance.holidaysandwichLeave == false) &&
        (attendance.BeforeAfterLeave == null ||
          attendance.BeforeAfterLeave == false)
      ) {
        const getweekoffdata = getweekoffholidaytranData.filter(
          (e) => e.tableName == 'weekoff'
        );
        const optionalHolidayDates = getweekoffholidaytranData
          .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
          .map((m) => m.date);

        alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

        let finalalldates = alldates;
        let sandwichLeave = [];
        let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
        function addQuotes(value) {
          var quotedVar = "'" + value + "'";
          return quotedVar;
        }
        let datemonth = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('MM') +
          ')'
        );
        datemonth = datemonth[0].to_char;
        let dateyear = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('YYYY') +
          ')'
        );
        dateyear = dateyear[0].to_char;

        let weekoffdates = [];
        for (var i = 0; i < getweekoffdata.length; i++) {
          weekoffdates.push(getweekoffdata[i].date);
        }

        const intersection = alldates.filter((element) =>
          weekoffdates.includes(element)
        );

        // send data on weekoff or holiday

        const weekoffDates = new Set(
          getweekoffholidaytranData
            .filter((e) => !e.optionalHoliday)
            .map((item) => item.date)
        ); // Convert to Set for faster lookup

        const allDatesAreWeekoff = alldates.every((date) =>
          weekoffDates.has(date)
        );

        if (allDatesAreWeekoff) {
          sandwichLeave = alldates;
          finalalldates = [];
        } else {
          if (intersection.length > 0) {
            for (var j = 0; j < intersection.length; j++) {
              let intersectionDate = intersection[j];
              let yesterday = new Date(
                new Date(intersectionDate).getTime() - 24 * 60 * 60 * 1000
              )
                .toISOString()
                .slice(0, 10);
              let tomorrow = new Date(
                new Date(intersectionDate).getTime() + 24 * 60 * 60 * 1000
              )
                .toISOString()
                .slice(0, 10);
              let sandwichdate = [];
              sandwichdate.push(yesterday, tomorrow);
              const sandwichleave = alldates.filter((element) =>
                sandwichdate.includes(element)
              );
              if (sandwichleave.length == 2) {
                sandwichLeave.push(intersection[j]);
                finalalldates = finalalldates.filter(function (item) {
                  return item != intersection[j];
                });
              } else {
                finalalldates = finalalldates.filter(function (item) {
                  return item != intersection[j];
                });
              }
            }
          } else {
            finalalldates = alldates;
          }
        }

        // merge both array

        finalalldates = [...finalalldates, ...optionalHolidayDates];

        // for sorting

        finalalldates = finalalldates
          .map((dateString) => new Date(dateString))
          .sort((a, b) => a - b)
          .map((dateObject) => dateObject.toISOString().split('T')[0]);

        let allleavetypes = await executeQuery(
          'SELECT * from "public".ms_fun_leaves_name(' +
          get_one_data.companyMasterID +
          ')'
        );

        const leavebalance = await employeeeLeaveBalance(
          get_one_data.companyMasterID,
          get_one_data.userMasterID
        );

        res.status(200).json({
          status: 200,
          message: 'Data Get Successfully.',
          finaldate: finalalldates,
          sandwichdate: sandwichLeave,
          leavebalance: leavebalance,
          leavedata: get_one_data,
        });
      } else if (
        attendance.sandwichLeave == true &&
        attendance.weekoffsandwichLeave == true &&
        attendance.holidaysandwichLeave == true &&
        (attendance.BeforeAfterLeave == null ||
          attendance.BeforeAfterLeave == false)
      ) {
        const getweekoffdata = getweekoffholidaytranData.filter(
          (e) => e.tableName == 'weekoff'
        );
        const optionalHolidayDates = getweekoffholidaytranData
          .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
          .map((m) => m.date);

        alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

        let finalalldates = alldates;
        let sandwichLeave = [];
        let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
        function addQuotes(value) {
          var quotedVar = "'" + value + "'";
          return quotedVar;
        }
        let datemonth = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('MM') +
          ')'
        );
        datemonth = datemonth[0].to_char;
        let dateyear = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('YYYY') +
          ')'
        );
        dateyear = dateyear[0].to_char;

        let weekoffdates = [];
        for (let i = 0; i < getweekoffdata.length; i++) {
          weekoffdates.push(getweekoffdata[i].date);
        }

        weekoffdates = weekoffdates.filter(function (value, index, array) {
          return array.indexOf(value) === index;
        });
        const intersection = alldates.filter((element) =>
          weekoffdates.includes(element)
        );

        // send data on weekoff or holiday

        const weekoffDates = new Set(
          getweekoffholidaytranData
            .filter((e) => !e.optionalHoliday)
            .map((item) => item.date)
        ); // Convert to Set for faster lookup

        const allDatesAreWeekoff = alldates.every((date) =>
          weekoffDates.has(date)
        );

        if (allDatesAreWeekoff) {
          sandwichLeave = alldates;
          finalalldates = [];
        } else {
          if (intersection.length > 0) {
            for (let j = 0; j < intersection.length; j++) {
              let intersectionDate = intersection[j];
              let yesterday = new Date(
                new Date(intersectionDate).getTime() - 24 * 60 * 60 * 1000
              )
                .toISOString()
                .slice(0, 10);
              let tomorrow = new Date(
                new Date(intersectionDate).getTime() + 24 * 60 * 60 * 1000
              )
                .toISOString()
                .slice(0, 10);
              let sandwichdate = [];
              sandwichdate.push(yesterday, tomorrow);
              const sandwichleave = alldates.filter((element) =>
                sandwichdate.includes(element)
              );
              if (sandwichleave.length == 2) {
                sandwichLeave.push(intersection[j]);
                finalalldates = finalalldates.filter(function (item) {
                  return item != intersection[j];
                });
              } else {
                finalalldates = finalalldates.filter(function (item) {
                  return item != intersection[j];
                });
              }
            }
          } else {
            finalalldates = alldates;
          }
        }

        // merge both array

        finalalldates = [...finalalldates, ...optionalHolidayDates];

        // for sorting

        finalalldates = finalalldates
          .map((dateString) => new Date(dateString))
          .sort((a, b) => a - b)
          .map((dateObject) => dateObject.toISOString().split('T')[0]);

        // let allleavetypes = await executeQuery(
        //   'SELECT * from "public".ms_fun_leaves_name(' +
        //   get_one_data.companyMasterID +
        //   ')'
        // );

        const leavebalance = await employeeeLeaveBalance(
          get_one_data.companyMasterID,
          get_one_data.userMasterID
        );

        return res.status(200).json({
          status: 200,
          message: 'Data Get Successfully.',
          finaldate: finalalldates,
          leavebalance: leavebalance,
          sandwichdate: sandwichLeave,
          leavedata: get_one_data,
        });
      } else if (
        attendance.sandwichLeave == true &&
        attendance.weekoffsandwichLeave == true &&
        attendance.BeforeAfterLeave == true &&
        (attendance.holidaysandwichLeave == null ||
          attendance.holidaysandwichLeave == false)
      ) {
        const getweekoffdata = getweekoffholidaytranData.filter(
          (e) => e.tableName == 'weekoff'
        );
        const optionalHolidayDates = getweekoffholidaytranData
          .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
          .map((m) => m.date);

        alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

        let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
        function addQuotes(value) {
          var quotedVar = "'" + value + "'";
          return quotedVar;
        }
        let datemonth = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('MM') +
          ')'
        );
        datemonth = datemonth[0].to_char;
        let dateyear = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('YYYY') +
          ')'
        );
        dateyear = dateyear[0].to_char;

        let weekoffdates = [];
        for (var i = 0; i < getweekoffdata.length; i++) {
          weekoffdates.push(getweekoffdata[i].date);
        }

        weekoffdates = weekoffdates.filter(function (value, index, array) {
          return array.indexOf(value) === index;
        });
        let alldatewithweekoff = [];

        // send data on weekoff or holiday

        const weekoffDates = new Set(
          getweekoffholidaytranData
            .filter((e) => !e.optionalHoliday)
            .map((item) => item.date)
        ); // Convert to Set for faster lookup

        const allDatesAreWeekoff = alldates.every((date) =>
          weekoffDates.has(date)
        );

        if (allDatesAreWeekoff) {
          alldatewithweekoff = alldates;
        } else {
          for (let k = 0; k < alldates.length; k++) {
            let today = alldates[k];
            let yesterday = new Date(
              new Date(alldates[k]).getTime() - 24 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10);
            let tomorrow = new Date(
              new Date(alldates[k]).getTime() + 24 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10);

            const todayinter = weekoffdates.filter(
              (element) => element == today
            );
            const tomorrowinter = weekoffdates.filter(
              (element) => element == tomorrow
            );
            const yesterdayinter = weekoffdates.filter(
              (element) => element == yesterday
            );

            if (todayinter[0] != undefined) {
              alldatewithweekoff.push(todayinter[0]);
            }
            if (tomorrowinter[0] != undefined) {
              alldatewithweekoff.push(tomorrowinter[0]);
            }
            if (yesterdayinter[0] != undefined) {
              alldatewithweekoff.push(yesterdayinter[0]);
            }
          }
        }

        alldatewithweekoff = alldatewithweekoff.filter(
          function (value, index, array) {
            return array.indexOf(value) === index;
          }
        );

        const sandwichleave = alldatewithweekoff.filter((element) =>
          alldates.includes(element)
        );

        // merge both array

        alldates = [...alldates, ...optionalHolidayDates].filter(
          (e) => !sandwichleave.includes(e)
        );

        // for sorting

        alldates = alldates
          .map((dateString) => new Date(dateString))
          .sort((a, b) => a - b)
          .map((dateObject) => dateObject.toISOString().split('T')[0]);
        const leavebalance = await employeeeLeaveBalance(
          get_one_data.companyMasterID,
          get_one_data.userMasterID
        );

        res.status(200).json({
          status: 200,
          message: 'Data Get Successfully.',
          finaldate: alldates,
          leavebalance: leavebalance,
          sandwichdate: sandwichleave,
          leavedata: get_one_data,
        });
      } else if (
        attendance.sandwichLeave == true &&
        attendance.weekoffsandwichLeave == true &&
        attendance.holidaysandwichLeave == true &&
        attendance.BeforeAfterLeave == true
      ) {
        const getweekoffdata = getweekoffholidaytranData.filter(
          (e) => e.optionalHoliday == false
        );
        const optionalHolidayDates = getweekoffholidaytranData
          .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
          .map((m) => m.date);

        alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

        let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
        function addQuotes(value) {
          var quotedVar = "'" + value + "'";
          return quotedVar;
        }
        let datemonth = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('MM') +
          ')'
        );
        datemonth = datemonth[0].to_char;
        let dateyear = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('YYYY') +
          ')'
        );
        dateyear = dateyear[0].to_char;

        let weekoffdates = [];

        for (var i = 0; i < getweekoffdata.length; i++) {
          weekoffdates.push(getweekoffdata[i].date);
        }

        weekoffdates = weekoffdates.filter(function (value, index, array) {
          return array.indexOf(value) === index;
        });
        let alldatewithweekoff = [];

        // send data on weekoff or holiday

        const weekoffDates = new Set(
          getweekoffholidaytranData
            .filter((e) => !e.optionalHoliday)
            .map((item) => item.date)
        ); // Convert to Set for faster lookup

        const allDatesAreWeekoff = alldates.every((date) =>
          weekoffDates.has(date)
        );

        if (allDatesAreWeekoff) {
          alldatewithweekoff = alldates;
        } else {
          for (var k = 0; k < alldates.length; k++) {
            let today = alldates[k];
            let yesterday = new Date(
              new Date(alldates[k]).getTime() - 24 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10);
            let tomorrow = new Date(
              new Date(alldates[k]).getTime() + 24 * 60 * 60 * 1000
            )
              .toISOString()
              .slice(0, 10);

            const todayinter = weekoffdates.filter(
              (element) => element == today
            );
            const tomorrowinter = weekoffdates.filter(
              (element) => element == tomorrow
            );
            const yesterdayinter = weekoffdates.filter(
              (element) => element == yesterday
            );

            if (todayinter[0] != undefined) {
              alldatewithweekoff.push(todayinter[0]);
            }
            if (tomorrowinter[0] != undefined) {
              alldatewithweekoff.push(tomorrowinter[0]);
            }
            if (yesterdayinter[0] != undefined) {
              alldatewithweekoff.push(yesterdayinter[0]);
            }
          }
        }

        alldatewithweekoff = alldatewithweekoff.filter(
          function (value, index, array) {
            return array.indexOf(value) === index;
          }
        );
        const sandwichleave = alldatewithweekoff.filter((element) =>
          alldates.includes(element)
        );

        // merge both array

        alldates = [...alldates, ...optionalHolidayDates].filter(
          (e) => !sandwichleave.includes(e)
        );

        // for sorting

        alldates = alldates
          .map((dateString) => new Date(dateString))
          .sort((a, b) => a - b)
          .map((dateObject) => dateObject.toISOString().split('T')[0]);

        const leavebalance = await employeeeLeaveBalance(
          get_one_data.companyMasterID,
          get_one_data.userMasterID
        );

        res.status(200).json({
          status: 200,
          message: 'Data Get Successfully.',
          finaldate: alldates,
          leavebalance: leavebalance,
          sandwichdate: sandwichleave,
          leavedata: get_one_data,
        });
      } else {
        const getweekoffdata = getweekoffholidaytranData.filter(
          (e) => e.optionalHoliday == false
        );
        const optionalHolidayDates = getweekoffholidaytranData
          .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
          .map((m) => m.date);

        alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

        let finalalldates = alldates;
        let sandwichLeave = [];
        let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
        function addQuotes(value) {
          var quotedVar = "'" + value + "'";
          return quotedVar;
        }
        let datemonth = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('MM') +
          ')'
        );
        datemonth = datemonth[0].to_char;
        let dateyear = await executeQuery(
          'SELECT to_char(DATE ' +
          addQuotes(date) +
          ',  ' +
          addQuotes('YYYY') +
          ')'
        );
        dateyear = dateyear[0].to_char;

        let weekoffdates = [];
        for (var i = 0; i < getweekoffdata.length; i++) {
          weekoffdates.push(getweekoffdata[i].date);
        }
        weekoffdates = weekoffdates.filter(function (value, index, array) {
          return array.indexOf(value) === index;
        });

        // send data on weekoff or holiday

        const weekoffDates = new Set(
          getweekoffholidaytranData
            .filter((e) => !e.optionalHoliday)
            .map((item) => item.date)
        ); // Convert to Set for faster lookup

        const allDatesAreWeekoff = alldates.every((date) =>
          weekoffDates.has(date)
        );

        if (!allDatesAreWeekoff) {
          const intersection = alldates.filter((element) =>
            weekoffdates.includes(element)
          );

          if (intersection.length > 0) {
            for (var n = 0; n < intersection.length; n++) {
              alldates = alldates.filter(function (item) {
                return item != intersection[n];
              });
            }
          }
        }

        // merge both array

        alldates = [...alldates, ...optionalHolidayDates];

        // for sorting

        alldates = alldates
          .map((dateString) => new Date(dateString))
          .sort((a, b) => a - b)
          .map((dateObject) => dateObject.toISOString().split('T')[0]);

        const leavebalance = await employeeeLeaveBalance(
          get_one_data.companyMasterID,
          get_one_data.userMasterID
        );

        res.status(200).json({
          status: 200,
          message: 'Data Get Successfully.',
          finaldate: alldates,
          leavebalance: leavebalance,
          sandwichdate: [],
          leavedata: get_one_data,
        });
      }
    } else {
      const getweekoffdata = getweekoffholidaytranData.filter(
        (e) => e.optionalHoliday == false
      );
      const optionalHolidayDates = getweekoffholidaytranData
        .filter((e) => e.tableName == 'holiday' && e.optionalHoliday == true)
        .map((m) => m.date);

      alldates = alldates.filter((e) => !optionalHolidayDates.includes(e));

      let finalalldates = alldates;
      let sandwichLeave = [];
      let date = new Date(get_one_data.FromDate).toISOString().slice(0, 10);
      function addQuotes(value) {
        var quotedVar = "'" + value + "'";
        return quotedVar;
      }
      let datemonth = await executeQuery(
        'SELECT to_char(DATE ' + addQuotes(date) + ',  ' + addQuotes('MM') + ')'
      );
      datemonth = datemonth[0].to_char;
      let dateyear = await executeQuery(
        'SELECT to_char(DATE ' +
        addQuotes(date) +
        ',  ' +
        addQuotes('YYYY') +
        ')'
      );
      dateyear = dateyear[0].to_char;

      let weekoffdates = [];
      for (var i = 0; i < getweekoffdata.length; i++) {
        weekoffdates.push(getweekoffdata[i].date);
      }
      weekoffdates = weekoffdates.filter(function (value, index, array) {
        return array.indexOf(value) === index;
      });

      // send data on weekoff or holiday

      const weekoffDates = new Set(
        getweekoffholidaytranData
          .filter((e) => !e.optionalHoliday)
          .map((item) => item.date)
      ); // Convert to Set for faster lookup

      const allDatesAreWeekoff = alldates.every((date) =>
        weekoffDates.has(date)
      );

      if (!allDatesAreWeekoff) {
        const intersection = alldates.filter((element) =>
          weekoffdates.includes(element)
        );

        if (intersection.length > 0) {
          for (var n = 0; n < intersection.length; n++) {
            alldates = alldates.filter(function (item) {
              return item != intersection[n];
            });
          }
        }
      }

      // merge both array

      alldates = [...alldates, ...optionalHolidayDates];

      // for sorting

      alldates = alldates
        .map((dateString) => new Date(dateString))
        .sort((a, b) => a - b)
        .map((dateObject) => dateObject.toISOString().split('T')[0]);

      const leavebalance = await employeeeLeaveBalance(
        get_one_data.companyMasterID,
        get_one_data.userMasterID
      );

      res.status(200).json({
        status: 200,
        message: 'Data Get Successfully.',
        finaldate: alldates,
        leavebalance: leavebalance,
        sandwichdate: [],
        leavedata: get_one_data,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.leaveAuthCriteria = async (req, res, next) => {
  try {
    let Auth_Details;
    let Auth_Criteria;
    let usermaster;
    let Auth_person;
    let Auth_person_Arr = [];
    let Auth_person_list = [];
    let finaldata = [];

    Auth_Details = await AuthorizationDetails.findOne({
      where: {
        userMasterID: req.params.id,
        AuthorizationMasterID: authorizationMasterTypes.leave,
        status: 1,
        '$userMaster.status$': 1,
      },
      attributes: [['AuthorizationCriteriaID', 'id']],
      include: [
        {
          model: UserMaster,
          as: 'userMaster',
        },
      ],
    });

    if (Auth_Details) {
      Auth_Criteria = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: Auth_Details.dataValues.id,
        },
        attributes: [['AuthorizationCriteria', 'Criteria']],
      });

      usermaster = await AuthorizationDetails.findOne({
        where: {
          userMasterID: req.params.id,
          AuthorizationMasterID: authorizationMasterTypes.leave,
          status: 1,
          '$userMaster.status$': 1,
        },
        attributes: [['AuthorizedByUserMasterId', 'user']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
          },
        ],
      });

      for (var i = 0; i < usermaster.dataValues.user.length; i++) {
        Auth_person_Arr.push(usermaster.dataValues.user[i]);
      }

      for (var j = 0; j < Auth_person_Arr.length; j++) {
        Auth_person = await UserMaster.findOne({
          where: {
            userMasterID: Auth_person_Arr[j],
          },
          status: 1,
          attributes: [
            ['userMasterID', 'userMasterID'],
            ['displayName', 'userName'],
            ['userNumber', 'Number'],
            ['photo', 'picture'],
          ],
          include: [
            {
              model: companyMaster,
              as: 'companyMaster',
              attributes: ['companyName', 'companyName'],
            },
          ],
        });
        Auth_person_list.push(Auth_person);
      }
    } else {
      (Auth_Criteria = ''), (Auth_person = '');
    }

    finaldata = {
      Auth_Criteria: Auth_Criteria,
      Auth_person: Auth_person_list,
    };

    res.status(200).json({
      status: 200,
      message: {},
      data: finaldata,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.leaveAuthorizeduser = async (req, res, next) => {
  try {
    let { companyMasterID, branchMasterID, authPersonid } = await req.body;
    let userdata;

    if (branchMasterID == '') {
      let Auth_person = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.leave,
          status: 1,
          companyMasterID: companyMasterID,
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      });

      let userid = [];

      for (var i = 0; i < Auth_person.length; i++) {
        userid.push(Auth_person[i].userMasterID);
      }

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
          status: 1,
        },
        attributes: [
          ['userMasterID', 'userMasterID'],
          ['displayName', 'userName'],
          ['userNumber', 'Number'],
        ],
      });
    } else {
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
      });

      let branchuser = [];
      for (var i = 0; i < branch_contact.length; i++) {
        branchuser.push(branch_contact[i].userMasterID);
      }

      let Auth_person = await AuthorizationDetails.findAll({
        where: {
          AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
          AuthorizationMasterID: authorizationMasterTypes.leave,
          status: 1,
          userMasterID: {
            [Sequelize.Op.in]: branchuser,
          },
        },
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      });

      let userid = [];

      for (var j = 0; j < Auth_person.length; j++) {
        userid.push(Auth_person[j].userMasterID);
      }

      userdata = await UserMaster.findAll({
        where: {
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
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
    next(err.message);
  }
};

exports.mobileauthuserforleave = async (req, res, next) => {
  try {
    let { leaveid } = await req.body;

    let finaldata = [];

    let find_leaveauthuser = await executeQuery(
      `
    select LA."userMasterID",UM."displayName",LA.authstatus   from "leaveAuthorizations" as LA 
    LEFT OUTER join  "userMasters" as UM on LA."userMasterID" = UM."userMasterID"  where LA."ReferenceID"=` +
      leaveid +
      ``
    );

    let acceptLeavedata = await executeQuery(
      `
    
    select LT."LeaveTranId",LT."date",LT.issandwichleave,LM."LeaveName" ,LT.days  from "userLeaveTransactions" as LT 
    left outer join "userLeaves" as UL on LT."ReferenceID"=UL."UserLeaveApplicationID" 
    left outer join "hrLeaveTypes" HT on LT."LeaveTranId"=HT."LeaveTranId" 
    left outer join "hrLeaveMasters" LM on HT."LeaveID"=LM."LeaveID" where UL."authorizationStatus"=3 and LT.status=1 and LT."ReferenceID" = ` +
      leaveid +
      ``
    );

    let user_leave = await UserLeave.findOne({
      where: {
        UserLeaveApplicationID: leaveid,
      },
    });
    let authorizationmaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterName: 'Leave' },
    });

    let authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationmaster.authorizationMasterID,
        userMasterID: user_leave.userMasterID,
        status: 1,
      },
      raw: true,
    });

    // Check data form authorization

    if (authorizationdetails) {
      // Find Auth AuthorizationCriteria

      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });
      finaldata.push({
        Auth_Criteria: AuthorizationCriterias.AuthorizationCriteria,
      });
    }
    finaldata.push({
      AuthUser: find_leaveauthuser,
      leavedata: acceptLeavedata,
    });

    res.status(200).json({
      status: 200,
      data: finaldata,
      message: 'data get successfully',
    });
  } catch (err) {
    next(err.message);
  }
};

exports.leavecancellist = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let totalcount;
    let attendanceCheck;
    let userleavedetail;
    let finaldata = [];
    let userdetail = [];

    function paginate(array, page_size, page_number) {
      return array.slice(
        (page_number - 1) * page_size,
        page_number * page_size
      );
    }

    userdetail = await executeQuery(
      ` select us."displayName",us."userNumber",ul."userMasterID",ul."UserLeaveApplicationID",ul."LeaveDays",ul."DayType",ul."authorizationStatus",ul."Remark",ul."status",ul."FromDate",ul."ToDate",ut."userLeaveTransactionID",ut."date",ut."days" ,ut."issandwichleave",ut."LeaveTranId",hm."LeaveName" from "public"."userLeaves" as ul inner join "public"."userLeaveTransactions" as ut on ul."UserLeaveApplicationID"=ut."ReferenceID" left outer join "public"."userMasters" as us on  us."userMasterID"=ul."userMasterID" left outer join "public"."hrLeaveTypes" as ht on ut."LeaveTranId"=ht."LeaveTranId" left outer join "public"."hrLeaveMasters" as hm on ht."LeaveID"=hm."LeaveID" where ul."userMasterID" in (` +
      userMasterID +
      `) and ut."status"=1 and ul."authorizationStatus"=3 and ht."LeaveID" !=25 order by ut."userLeaveTransactionID" DESC`
    );

    const AllattendanceCheck = await HrLeaveMonthTrans.findAll({
      where: {
        userMasterID: userdetail.map((e) => e.userMasterID),
        verified: 1,
      },
      attributes: ['monthstartdate', 'monthenddate', 'userMasterID'],
      group: ['monthstartdate', 'monthenddate', 'userMasterID'],
    });

    if (userdetail.length > 0) {
      for (let i = 0; i < userdetail.length; i++) {
        const verifiedData = AllattendanceCheck.filter(
          (v) => v.userMasterID == userdetail[i].userMasterID
        );

        const isDateInRange = verifiedData.some((range) => {
          const startDate = new Date(range.monthstartdate);
          const endDate = new Date(range.monthenddate);
          const checkDate = new Date(userdetail[i].date);

          return checkDate >= startDate && checkDate <= endDate;
        });

        if (!isDateInRange) userdetail[i].LeaveCancel = 'Yes';

        if (userdetail[i].issandwichleave == 0) {
          userdetail[i].issandwichleave = 'No';
        } else {
          userdetail[i].issandwichleave = 'Yes';
        }
      }

      userdetail = userdetail.filter((e) => e.LeaveCancel === 'Yes');

      if (page == '' && limit == '') {
        finaldata = userdetail;
        totalcount = userdetail.length;
      } else {
        finaldata = paginate(userdetail, limit, page);
        totalcount = userdetail.length;
      }
    } else {
      finaldata = [];
      totalcount = 0;
    }

    res.status(200).json({
      status: 200,
      message: {},
      data: finaldata,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.leavecancel = async (req, res, next) => {
  try {
    let { userLeaveTransactionID, LeaveCancelRemark, updateBy, userMasterID } =
      await req.body;

    let change_data = await sequelize.transaction(async (t) => {
      let update_leave = await userleavetransaction.update(
        {
          LeaveCancelRemark: LeaveCancelRemark,
          status: 10,
          updateBy,
        },
        {
          where: { userLeaveTransactionID: userLeaveTransactionID },
          transaction: t,
        }
      );
    });

    user = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
      },
    });

    if (user) {
      const notification = {
        title: 'Leave',
        body: 'Leave cancelled',
      };
      const data = {
        screen: 'leave',
      };
      await sendNotification(userMasterID, notification, data);
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.leavecancel,
      data: {},
    });
  } catch (err) {
    next(err.message);
  }
};

exports.requestCountforHRdashboard = async (req, res, next) => {
  try {
    const { companyMasterID, startdate, enddate } = await req.query;

    const user = [];
    const finaldata = {};

    const userdata = await EmployeeJoiningDetails.findAndCountAll({
      raw: true,
      where: {
        joiningDate: {
          [Sequelize.Op.lte]: enddate,
        },
        [Sequelize.Op.or]: [
          {
            leavingDate: { [Sequelize.Op.gte]: enddate },
          },
          {
            leavingDate: { [Sequelize.Op.eq]: null },
            [Sequelize.Op.or]: [
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.gte]: enddate },
              },
              {
                '$userMaster.deactiveDate$': { [Sequelize.Op.eq]: null },
              },
            ],
          },
        ],
        '$userMaster.companyMasterId$': companyMasterID,
        '$userMaster.status$': [0, 1],
      },
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
      order: [[{ model: UserMaster }, 'displayName', 'ASC']],
    });
    // const userdata = await getAllUserByCompanyDateWise(
    //   companyMasterID,
    //   '',
    //   '',
    //   enddate
    // );

    userdata.rows.map((e) => {
      user.push(e.userMasterID);
    });

    // Leave

    const leaveCount = await UserLeave.count({
      where: {
        userMasterID: user,
        status: 1,
        FromDate: { [Sequelize.Op.lte]: enddate },
        ToDate: { [Sequelize.Op.gte]: startdate },
      },
      group: ['authorizationStatus'],
    });

    let pendingLeave = 0,
      approvedLeave = 0,
      rejectedLeave = 0;

    leaveCount.map((e) => {
      if (
        e.authorizationStatus == 0 ||
        e.authorizationStatus == 1 ||
        e.authorizationStatus == 2
      ) {
        pendingLeave = +pendingLeave + +e.count;
      } else if (e.authorizationStatus == 3) {
        approvedLeave = +approvedLeave + +e.count;
      } else if (e.authorizationStatus == 4) {
        rejectedLeave = +rejectedLeave + +e.count;
      }
    });

    finaldata.pendingLeave = pendingLeave;
    finaldata.approvedLeave = approvedLeave;
    finaldata.rejectedLeave = rejectedLeave;

    // Expense

    const expenseCount = await UserExpenseTransaction.count({
      where: {
        status: 1,
      },
      include: [
        {
          model: UserExpense,
          as: 'userExpense',
          where: {
            userMasterID: user,
            expense_date: { [Sequelize.Op.between]: [startdate, enddate] },
            status: 1,
          },
        },
      ],
      group: ['userExpenseTransaction.authorizationStatus'],
    });

    let pendingExpense = 0,
      approvedExpense = 0,
      rejectedExpense = 0;

    expenseCount.map((e) => {
      if (
        e.authorizationStatus == 0 ||
        e.authorizationStatus == 1 ||
        e.authorizationStatus == 2
      ) {
        pendingExpense = +pendingExpense + +e.count;
      } else if (e.authorizationStatus == 3) {
        approvedExpense = +approvedExpense + +e.count;
      } else if (e.authorizationStatus == 4) {
        rejectedExpense = +rejectedExpense + +e.count;
      }
    });

    finaldata.pendingExpense = pendingExpense;
    finaldata.approvedExpense = approvedExpense;
    finaldata.rejectedExpense = rejectedExpense;

    // Overtime

    const overtimeCount = await overTimeCalculation.count({
      where: {
        OverTimeDate: {
          [Sequelize.Op.between]: [startdate, enddate],
        },
        UserMasterID: user,
      },
      group: ['AuthorizationRequired'],
    });

    let pendingOvertime = 0,
      approvedOvertime = 0,
      rejectedOvertime = 0;

    overtimeCount.map((e) => {
      if (
        e.AuthorizationRequired == 0 ||
        e.AuthorizationRequired == 1 ||
        e.AuthorizationRequired == 2
      ) {
        pendingOvertime = +pendingOvertime + +e.count;
      } else if (e.AuthorizationRequired == 3) {
        approvedOvertime = +approvedOvertime + +e.count;
      } else if (e.AuthorizationRequired == 4) {
        rejectedOvertime = +rejectedOvertime + +e.count;
      }
    });

    finaldata.pendingOvertime = pendingOvertime;
    finaldata.approvedOvertime = approvedOvertime;
    finaldata.rejectedOvertime = rejectedOvertime;

    // Loan

    // formatdate

    let a = new Date(enddate);

    a.setDate(a.getDate() + 1);

    const enddate1 = a.toISOString().slice(0, 10);

    const approvedLoan = await LoanMaster.count({
      where: {
        userMasterID: user,
        givenDate: {
          [Sequelize.Op.between]: [new Date(startdate), new Date(enddate1)],
        },
        status: 1,
        loanstatus: 1,
      },
    });

    const loanCount = await LoanMaster.count({
      where: {
        userMasterID: user,
        createdAt: {
          [Sequelize.Op.between]: [new Date(startdate), new Date(enddate1)],
        },
        status: 1,
        loanstatus: [0, 2],
      },
      group: ['loanstatus'],
    });

    let pendingLoan = 0,
      rejectedLoan = 0;

    loanCount.map((e) => {
      if (e.loanstatus == 0) {
        pendingLoan = +pendingLoan + +e.count;
      } else if (e.loanstatus == 2) {
        rejectedLoan = +rejectedLoan + +e.count;
      }
    });

    finaldata.pendingLoan = pendingLoan;
    finaldata.approvedLoan = approvedLoan;
    finaldata.rejectedLoan = rejectedLoan;

    // Advance

    const approvedAdvance = await advancePayment.count({
      where: {
        userMasterID: user,
        status: 1,
        advanceDate: {
          [Sequelize.Op.between]: [new Date(startdate), new Date(enddate1)],
        },
        AdvanceStatus: 1,
      },
    });

    const advanceCount = await advancePayment.count({
      where: {
        userMasterID: user,
        status: 1,
        createdAt: {
          [Sequelize.Op.between]: [new Date(startdate), new Date(enddate1)],
        },
        AdvanceStatus: [0, 2],
      },
      group: ['AdvanceStatus'],
    });

    let pendingAdvance = 0,
      rejectedAdvance = 0;

    advanceCount.map((e) => {
      if (e.AdvanceStatus == 0) {
        pendingAdvance = +pendingAdvance + +e.count;
      } else if (e.AdvanceStatus == 2) {
        rejectedAdvance = +rejectedAdvance + +e.count;
      }
    });

    finaldata.pendingAdvance = pendingAdvance;
    finaldata.approvedAdvance = approvedAdvance;
    finaldata.rejectedAdvance = rejectedAdvance;

    res.status(200).json({
      status: 200,
      data: finaldata,
    });
  } catch (err) {
    next(err);
  }
};

exports.leavedatashow = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      leavestatus,
      startdate,
      enddate,
      searchQuery,
      exportData,
      exportFileType,
    } = await req.body;

    let offset = (page - 1) * limit;
    const condition = {};

    if (leavestatus == 0) {
      leavestatus = [0, 1, 2];
    } else if (leavestatus == 1) {
      leavestatus = 3;
    } else if (leavestatus == 2) {
      leavestatus = 4;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          '$userMaster.userNumber$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (leavestatus) condition.authorizationStatus = leavestatus;

    if (startdate && enddate) {
      condition.FromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    condition.status = 1;

    const leavedata = await UserLeave.findAndCountAll({
      raw: true,
      limit: limit,
      offset: offset,
      where: condition,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
        {
          model: HrLeaveTypes,
          attributes: [],
          include: [
            {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveDesc'],
            },
          ],
        },
      ],
    });

    const promises = leavedata.rows.map(async (row) => {
      const get_data = await userleavetransaction.findAll({
        where: {
          ReferenceID: row.UserLeaveApplicationID,
        },
        order: [['date', 'ASC']],
        include: [
          {
            model: HrLeaveTypes,
            include: [
              {
                model: HrLeaveMaster,
                as: 'LeaveMaster',
              },
            ],
          },
        ],
      });

      const leaveType = get_data.map((data) => ({
        date: data.date,
        leave: data.hrLeaveType.LeaveMaster.LeaveName,
        days: data.days,
      }));

      row['leave'] = leaveType;
    });

    await Promise.all(promises);

    async function processRow(row) {
      const [designation, department, branch, assignPersonName] =
        await Promise.all([
          employeeDesignation(row.userMasterID, new Date()),
          employeeDepartment(row.userMasterID, new Date()),
          employeeBranch(row.userMasterID, new Date()),
          getAssignPersonName(row),
        ]);

      return {
        UserName: row['userMaster.displayName'],
        UserNumber: row['userMaster.userNumber'],
        CompanyName: row['companyMaster.companyName'],
        BranchName: branch ? branch['branchMaster.branchName'] : '',
        Designation: designation
          ? designation['designation.designationName']
          : '',
        Department: department ? department['department.departmentName'] : '',
        Status: getStatus(row.authorizationStatus),
        AssignPersonName: assignPersonName.length !== 0 ? assignPersonName : '',
        FromDate: row.FromDate || '',
        ToDate: row.ToDate || '',
        LeaveType: row['hrLeaveType.LeaveMaster.LeaveDesc'] || '',
        LeaveDays: row.LeaveDays || '',
        DayType: row.DayType || '',
        Remark: row.Remark || '',
      };
    }

    async function getAssignPersonName(dataValues) {
      if ([0, 1, 2].includes(dataValues.authorizationStatus)) {
        const assignPersonData = await LeaveAuthorizationRequest.findAll({
          where: {
            ReferenceID: dataValues.UserLeaveApplicationID,
          },
          raw: true,
        });

        const userPromises = assignPersonData.map(async (assignPerson) => {
          const user1 = await UserMaster.findOne({
            where: {
              userMasterID: assignPerson.userMasterID,
            },
            raw: true,
          });
          return user1.displayName;
        });

        return Promise.all(userPromises);
      }
      return [];
    }

    function getStatus(authorizationStatus) {
      switch (authorizationStatus) {
        case 0:
        case 1:
        case 2:
          return 'Pending';
        case 4:
          return 'Rejected';
        case 3:
          return 'Approved';
        default:
          return '';
      }
    }

    if (exportData) {
      const updatedDownloadRows = await Promise.all(
        leavedata.rows.map(processRow)
      );

      await generateExcel(
        updatedDownloadRows,
        'Company-Leave-Report',
        exportFileType,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Leave'),
      data: leavedata,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAuthorizationRequestByAuthorizationRequestId = async (
  req,
  res,
  next
) => {
  try {
    let get_one_data = await LeaveAuthorizationRequest.findAll({
      where: {
        AuthorizationRequestId: req.params.id,
      },
      include: [
        {
          model: UserLeave,
          // attributes: ['UserLeaveApplicationID', 'LeaveTranId', 'userMasterID'],
        },
      ],
    });

    if (get_one_data && get_one_data.length > 0) {
      let auth_Criteria = await AuthorizationDetails.findOne({
        where: {
          userMasterID: get_one_data[0].userLeave.userMasterID,
          AuthorizationMasterID: authorizationMasterTypes.leave,
          status: 1,
        },
        raw: true,
        include: [
          {
            model: AuthorizationCriteria,
            attributes: [],
          },
        ],
        attributes: [
          [
            Sequelize.col('AuthorizationCriteriaMaster.AuthorizationCriteria'),
            'auth_Criteria',
          ],
        ],
      });

      return res.status(200).json({
        status: 200,
        data: get_one_data,
        auth_Criteria: auth_Criteria,
        message: message.usermessage.fetchMessage('data'),
      });
    } else {
      return res.status(200).json({
        status: 200,
        data: [],
        auth_Criteria: {},
        message: message.usermessage.fetchMessage('data'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getApprovedAuthorizationRequestByUserLeaveApplicationID = async (
  req,
  res,
  next
) => {
  try {
    const get_one_data = await ApprovedLeaveAuthorization.findAll({
      where: {
        UserLeaveApplicationID: req.params.id,
      },
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
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
