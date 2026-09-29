const Sequelize = require('sequelize');
const AuthorizationRequest = require('../models/authorizationRequest');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Department = require('../models/department');
const VisitPurpose = require('../models/visitPurpose');
const FormAuthorization = require('../models/formAuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const { executeQuery } = require('./common.controller');
const ExpenseAuthorizationRequest = require('../models/expenseAuthorization');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const OvertimeAuthorizationRequest = require('../models/overtimeAuthorization');
const OvertimeCalculation = require('../models/overTimeCalculation');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepartment = require('../models/employeeDepartment');
const e = require('express');
const Notification = require('../config/firebase');
const companyMaster = require('../models/companyMaster');

const attendanceTransaction = require('../models/attendanceTransaction');

const UserInbox = require('../models/UserInbox');

const {
  sendNotification,
  userDetails,
  employeeSalaryPolicy,
  daysInMonth,
  sendMailforExpense,
  employeeDepartment,
  employeeDesignation,
  asiaKolkataDateTime,
  employeeBranch,
  sendAcceptRejectMail,
  accessibleUsers,
  findAuthorizationDetails,
  sendNotification_NEW,
  findCompanyNotificationPolicy,
  sendMailforExpense_With_Transaction,
} = require('../utils/commonUtilFunctions');

const { generateExcel } = require('../utils/exportData');

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

const UserExpense = require('../models/userExpense');
const overTimeCalculationMain = require('../models/overTimeCalculationMain');

const Product = require('../models/product');
const { userAttributes, statusCodes } = require('../utils/commonVars');
const ExpenseHead = require('../models/expenseHead');
const ExpenseCategory = require('../models/expenseCategory');
const Customer = require('../models/customer');
const ToursMaster = require('../models/toursMaster');
const Visit = require('../models/visit');
const FormMaster = require('../models/formMaster');
const ExpensePriceRule = require('../models/expencePriceRule');
const ExpensePayment = require('../models/expensePayment');
const {
  expenseTypes,
  expenseApprovalTypes,
  authorizationMasterTypes,
  authorizationCriteriaType,
  mailTemplateTypes,
} = require('../utils/dbUtils');
const Project = require('../models/project');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDivision = require('../models/employeeDivision');
const mailTemplateEditor = require('../models/mailTemplateEditor');

exports.viewauthorizationrequestbyuserid = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let auth_request = [],
      totalcount;

    if (limit == '' && page == '') {
      const auth_requestData = await AuthorizationRequest.findAndCountAll({
        include: [
          { model: FormMaster },
          {
            model: UserMaster,
            // required: true,
            // ...accessibleUsers(req.userDetails, true, false),
            include: [{ model: companyMaster }],
          },
        ],
        where: {
          status: 1,
          userMasterID: req.body.userMasterID,
        },
      });

      auth_request = auth_requestData.rows;
      totalcount = auth_requestData.count;

      for (let j = 0; j < auth_request.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: auth_request[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: auth_request[j].updateBy,
          },
        });

        if (user1) {
          auth_request[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          auth_request[j].updateBy = user2.dataValues.displayName;
        }
      }
    } else {
      const auth_requestData = await AuthorizationRequest.findAll({
        where: {
          status: 1,
          userMasterID: req.body.userMasterID,
        },
        limit: limit,
        offset: offset,
        include: [
          { model: FormMaster },
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            include: [{ model: companyMaster }],
          },
        ],
      });

      auth_request = auth_requestData.rows;
      totalcount = auth_requestData.count;

      for (let j = 0; j < auth_request.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: auth_request[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: auth_request[j].updateBy,
          },
        });

        if (user1) {
          auth_request[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          auth_request[j].updateBy = user2.dataValues.displayName;
        }
        let TableName = auth_request[j].TableName;
        let referncedata;
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
        if (referncedata) {
          auth_request[j].dataValues.Referencedata = referncedata[0];
        }
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: auth_request, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.authorizationacceptreject = async (req, res, next) => {
  try {
    let { AuthorizationRequestId, authstatus, ReferenceID, companyMasterID } =
      await req.body;

    // Change Auth Status of request

    let change_data_status = await AuthorizationRequest.update(
      {
        authstatus: authstatus,
      },
      {
        where: { AuthorizationRequestId: AuthorizationRequestId },
      }
    );

    // Find authorization request by reference id

    let auth_request = await AuthorizationRequest.findAll({
      where: {
        ReferenceID: ReferenceID,
      },
    });

    // Find Form Authorization for criteria

    let FormAuthorizations = await FormAuthorization.findOne({
      where: {
        FormMasterId: auth_request[0].formMasterID,
        companyMasterID: companyMasterID,
      },
      raw: true,
    });

    // Check data form authorization

    if (FormAuthorizations) {
      // Find Auth AuthorizationCriteria

      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: FormAuthorizations.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      // Auth Criteria is sequence

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        let auth_requestsequence = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: {
              [Sequelize.Op.not]: 0,
            },
          },
        });
        if (auth_requestsequence.length == 0) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );
          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 4 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        } else {
          let arr = [];
          for (var k = 0; k < auth_requestsequence.length; k++) {
            if (auth_requestsequence[k].authstatus == 1) {
              arr.push(parseInt(auth_requestsequence[k].userMasterID));
            }
          }
          let FormAuthorizationsUser =
            FormAuthorizations.AuthorizedByUserMasterId;
          let remainingid = FormAuthorizationsUser.filter(
            (d) => !arr.includes(d)
          );
          if (remainingid.length > 0) {
            let insert_db_status1 = await AuthorizationRequest.create({
              formMasterID: auth_request[0].formMasterID,
              TableName: auth_request[0].TableName,
              ReferenceID: ReferenceID,
              userMasterID: remainingid[0],
              status: 1,
              authstatus: 2,
              createBy: auth_request[0].createBy,
            });
          } else {
            let result = await executeQuery(
              "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
                JSON.stringify(auth_request[0].TableName) +
                "'::regclass AND i.indisprimary;"
            );
            let result1 = await executeQuery(
              'UPDATE public.' +
                JSON.stringify(auth_request[0].TableName) +
                ' SET ' +
                JSON.stringify('authorizationStatus') +
                ' = 3 WHERE ' +
                JSON.stringify(result[0].attname) +
                ' = ' +
                ReferenceID +
                '; '
            );
          }
        }
      } else if (AuthorizationCriterias.AuthorizationCriteria == 'Any One') {
        let auth_requestanyoneaccept = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 1,
          },
        });
        let auth_requestanyonereject = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 0,
          },
        });

        let total = auth_request.length;
        let accept = auth_requestanyoneaccept.length;
        let reject = auth_requestanyonereject.length;

        if (accept >= 1) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 3 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        } else if ((total = reject)) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 4 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        }
      } else if (AuthorizationCriterias.AuthorizationCriteria == 'Any Two') {
        let auth_requestanyoneaccept = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 1,
          },
        });
        let auth_requestanyonereject = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 0,
          },
        });

        const total = auth_request.length;
        const accept = auth_requestanyoneaccept.length;
        const reject = auth_requestanyonereject.length;

        if (accept >= 2) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 3 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        } else if ((total = reject)) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 4 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        }
      } else {
        let auth_requestanyoneaccept = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 1,
          },
        });
        let auth_requestanyonereject = await AuthorizationRequest.findAll({
          where: {
            ReferenceID: ReferenceID,
            authstatus: 0,
          },
        });

        const total = auth_request.length;
        const accept = auth_requestanyoneaccept.length;
        const reject = auth_requestanyonereject.length;

        if (accept >= 3) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 3 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        } else if ((total = reject)) {
          let result = await executeQuery(
            "SELECT a.attname FROM   pg_index i JOIN   pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE  i.indrelid = 'public." +
              JSON.stringify(auth_request[0].TableName) +
              "'::regclass AND i.indisprimary;"
          );

          let result1 = await executeQuery(
            'UPDATE public.' +
              JSON.stringify(auth_request[0].TableName) +
              ' SET ' +
              JSON.stringify('authorizationStatus') +
              ' = 4 WHERE ' +
              JSON.stringify(result[0].attname) +
              ' = ' +
              ReferenceID +
              '; '
          );
        }
      }
    }

    if (authstatus == 1) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.authaccept,
        data: {},
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.authreject,
        data: {},
      });
    }
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

exports.getAuthorizationRequestByReferanceIdExpense = async (
  req,
  res,
  next
) => {
  try {
    let get_one_data = await ExpenseAuthorizationRequest.findAll({
      where: {
        ReferenceID: req.params.id,
      },
      order: [['AuthorizationRequestId', 'ASC']],
      include: [
        {
          model: UserMaster,
        },
      ],
    });
    for (let i = 0; i < get_one_data.length; i++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].userMasterID,
        },
      });

      let auth = await AuthorizationDetails.findOne({
        where: {
          userMasterID: get_one_data[i].userMaster.userMasterID,
          AuthorizationMasterID: authorizationMasterTypes.expense,
        },
      });

      get_one_data[i].dataValues.username = user1.displayName;
      get_one_data[i].dataValues.auth = auth;
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.viewauthorizationrequestbyuseridforexpense = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, userid } = await req.body;

    const paginationQuery = {};
    const condition = {};

    condition.status = [0, 1];

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (userid) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userid,
      };
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const { rows: auth_request, count } =
      await ExpenseAuthorizationRequest.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          {
            model: UserExpenseTransaction,
          },
        ],
      });
    for (let j = 0; j < auth_request.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: auth_request[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: auth_request[j].updateBy,
        },
      });

      if (user1) {
        auth_request[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        auth_request[j].updateBy = user2.dataValues.displayName;
      }
      let expensedata = await UserExpenseTransaction.findOne({
        where: {
          userExpenseTransactionID: auth_request[j].ReferenceID,
        },
        include: [
          { model: UserExpense, as: 'userExpense' },
          { model: ExpenseHead },
          { model: ExpensePriceRule },
          { model: ExpensePayment },
          { model: AuthorizationCriteriaMaster },
        ],
      });
      if (expensedata) {
        auth_request[j].dataValues.Referencedata = expensedata;
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: auth_request, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.viewauthorizationrequestbyuseridforovertime = async (
  req,
  res,
  next
) => {
  try {
    let {
      limit,
      page,
      companyid,
      branchid,
      authuser,
      userMasterID,
      startdate,
      enddate,
      status,
    } = await req.body;
    let user = userMasterID;
    let offset = (page - 1) * limit;
    let auth_request = [],
      totalcount;

    if (user == '' && startdate == '' && enddate == '') {
      let condition;

      if (status == '1' || status == '0') {
        condition = {
          [Sequelize.Op.and]: [
            { userMasterID: authuser },
            { authstatus: +status },
          ],

          status: 1,
        };
      } else {
        condition = {
          [Sequelize.Op.and]: [{ userMasterID: authuser }, { authstatus: 2 }],

          '$overTimeCalculation.AuthorizationRequired$': {
            [Sequelize.Op.notIn]: [3, 4],
          },

          status: 1,
        };
      }
      auth_request = await OvertimeAuthorizationRequest.findAll({
        where: condition,
        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: attendanceTransaction },
              {
                model: UserMaster,
                // required: true,
                // ...accessibleUsers(req.userDetails, false),
                where: { status: 1 },
                attributes: [],
              },
            ],
          },
        ],
      });

      for (let j = 0; j < auth_request.length; j++) {
        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Overtime' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
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
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
          },
        });

        if (user1) {
          auth_request[j].dataValues.user = user1.dataValues.displayName;
          auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
          auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
        }
      }

      totalcount = await OvertimeAuthorizationRequest.count({
        where: condition,
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: UserMaster, where: { status: 1 }, attributes: [] },
            ],
          },
        ],
      });
    } else if (user != '' && startdate == '' && enddate == '') {
      auth_request = await OvertimeAuthorizationRequest.findAll({
        where: {
          [Sequelize.Op.and]: [{ userMasterID: authuser }],
          '$overTimeCalculation.UserMasterID$': {
            [Sequelize.Op.in]: user,
          },
          status: 1,
        },

        order: [['createdAt', 'DESC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: attendanceTransaction },
              {
                model: UserMaster,
                // required: true,
                // ...accessibleUsers(req.userDetails, false),
                where: { status: 1 },
                attributes: [],
              },
            ],
          },
        ],
      });
      for (var j = 0; j < auth_request.length; j++) {
        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Overtime' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
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
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
          },
        });
        // let user2 = await UserMaster.findOne({
        //   where: {
        //     userMasterID: auth_request[j].updateBy,
        //   },
        // })

        if (user1) {
          auth_request[j].dataValues.user = user1.dataValues.displayName;
          auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
          auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
        }
      }
      totalcount = await OvertimeAuthorizationRequest.count({
        where: {
          status: 1,
          [Sequelize.Op.and]: [
            { userMasterID: authuser },
            // { createBy: user }
          ],
          '$overTimeCalculation.UserMasterID$': {
            [Sequelize.Op.in]: user,
          },
        },
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: UserMaster, where: { status: 1 }, attributes: [] },
            ],
          },
        ],
      });
    } else if (user == '' && startdate != '' && enddate != '') {
      auth_request = await OvertimeAuthorizationRequest.findAll({
        where: {
          '$overTimeCalculation.OverTimeDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ userMasterID: authuser }],
          status: 1,
        },
        order: [['createdAt', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: attendanceTransaction },
              {
                model: UserMaster,
                // required: true,
                // ...accessibleUsers(req.userDetails, false),
                where: { status: 1 },
                attributes: [],
              },
            ],
          },
        ],
      });
      for (var j = 0; j < auth_request.length; j++) {
        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Overtime' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
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
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
          },
        });

        if (user1) {
          auth_request[j].dataValues.user = user1.dataValues.displayName;
          auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;
          auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
        }
      }
      totalcount = await OvertimeAuthorizationRequest.count({
        where: {
          status: 1,

          '$overTimeCalculation.OverTimeDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ userMasterID: authuser }],
        },
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: UserMaster, where: { status: 1 }, attributes: [] },
            ],
          },
        ],
      });
    } else {
      auth_request = await OvertimeAuthorizationRequest.findAll({
        where: {
          userMasterID: authuser,
          '$overTimeCalculation.OverTimeDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ userMasterID: authuser }],
          '$overTimeCalculation.UserMasterID$': {
            [Sequelize.Op.in]: user,
          },
          status: 1,
        },
        // include: [{ model: UserLeave }],
        order: [['createdAt', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: attendanceTransaction },
              {
                model: UserMaster,
                // required: true,
                // ...accessibleUsers(req.userDetails, false),
                where: { status: 1 },
                attributes: [],
              },
            ],
          },
        ],
      });

      for (var j = 0; j < auth_request.length; j++) {
        let authorizationmaster = await AuthorizationMaster.findOne({
          where: { authorizationMasterName: 'Overtime' },
        });

        let authorizationdetails = await AuthorizationDetails.findOne({
          where: {
            AuthorizationMasterID: authorizationmaster.authorizationMasterID,
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
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
            userMasterID: auth_request[j].overTimeCalculation.UserMasterID,
          },
        });

        if (user1) {
          auth_request[j].dataValues.user = user1.dataValues.displayName;
          auth_request[j].dataValues.userNumber = user1.dataValues.userNumber;

          auth_request[j].dataValues.userID = user1.dataValues.userMasterID;
        }
      }
      totalcount = await OvertimeAuthorizationRequest.count({
        where: {
          status: 1,

          '$overTimeCalculation.OverTimeDate$': {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          [Sequelize.Op.and]: [{ userMasterID: authuser }],
          '$overTimeCalculation.UserMasterID$': {
            [Sequelize.Op.in]: user,
          },
          status: 1,
        },

        include: [
          {
            model: OvertimeCalculation,
            as: 'overTimeCalculation',
            include: [
              { model: UserMaster, where: { status: 1 }, attributes: [] },
            ],
          },
        ],
      });
    }

    return res
      .status(200)
      .json({ status: 200, data: auth_request, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};
exports.getAuthorizationRequestByReferanceIdOvertime = async (
  req,
  res,
  next
) => {
  try {
    let get_one_data = await OvertimeAuthorizationRequest.findAll({
      where: {
        ReferenceID: req.params.id,
      },
      order: [['AuthorizationRequestId', 'ASC']],
    });
    for (let i = 0; i < get_one_data.length; i++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: get_one_data[i].userMasterID,
        },
      });
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

exports.authorizationacceptrejectovertime = async (req, res, next) => {
  try {
    const {
      authorizationData,
      AuthorizationRequestId,
      ReferenceID,
      authstatus,
      remarks,
      UpdateTimeIn,
      UpdateTimeOut,
      UpdateTimeOutDateTime,
      UpdateTimeInDateTime,
      UpdateOverTimeHourAndMin,
      companyMasterID,
      createBy,
    } = req.body;
    let ApproveOvetimeUser = [],
      authorizationDataForOT = [];
    const RejectOvetimeUser = [],
      SkipOvetimeUser = [];

    if (!authorizationData) {
      authorizationDataForOT.push({
        AuthorizationRequestId: AuthorizationRequestId,
        ReferenceID: ReferenceID,
      });
    } else {
      authorizationDataForOT = authorizationData;
    }

    const AllReferenceIds = authorizationDataForOT.map((e) => e.ReferenceID);

    const otAuthRequest = await OvertimeAuthorizationRequest.findAll({
      where: { ReferenceID: AllReferenceIds },
      include: [{ model: OvertimeCalculation, as: 'overTimeCalculation' }],
    });

    // find OT Authorization
    const authorizationmaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterName: 'Overtime' },
    });

    // get All UserIds
    const AllUserIds = otAuthRequest.map(
      (e) => e.overTimeCalculation.UserMasterID
    );

    const AllFormAuthorizations = await AuthorizationDetails.findAll({
      where: {
        AuthorizationMasterID: authorizationmaster.authorizationMasterID,
        userMasterID: {
          [Sequelize.Op.in]: AllUserIds,
        },
        status: 1,
      },
    });

    await sequelize.transaction(async (t) => {
      for (let i = 0; i < authorizationDataForOT.length; i++) {
        const { AuthorizationRequestId, ReferenceID } =
          authorizationDataForOT[i];

        const userid = otAuthRequest.find(
          (e) => e.AuthorizationRequestId == AuthorizationRequestId
        );

        const userOverTime = {
          UpdateTimeIn: userid.overTimeCalculation.OverTimeIn,
          UpdateTimeOut: userid.overTimeCalculation.OverTimeOut,
          UpdateTimeInDateTime: userid.overTimeCalculation.OverTimeInDateTime,
          UpdateTimeOutDateTime: userid.overTimeCalculation.OverTimeOutDateTime,
          UpdateOverTimeHourAndMin:
            userid.overTimeCalculation.OverTimeHourAndMin,
        };

        const finalUpdateTimeIn = UpdateTimeIn || userOverTime.UpdateTimeIn;
        const finalUpdateTimeOut = UpdateTimeOut || userOverTime.UpdateTimeOut;
        const finalUpdateTimeInDateTime =
          UpdateTimeInDateTime || userOverTime.UpdateTimeInDateTime;
        const finalUpdateTimeOutDateTime =
          UpdateTimeOutDateTime || userOverTime.UpdateTimeOutDateTime;
        const finalUpdateOverTimeHourAndMin =
          UpdateOverTimeHourAndMin || userOverTime.UpdateOverTimeHourAndMin;
        const finalRemarks = remarks || '';

        if (authstatus == 1) {
          ApproveOvetimeUser.push({
            UserMasterID: userid.overTimeCalculation.UserMasterID,
            OverTimeID: userid.overTimeCalculation.OverTimeID,
          });

          const date = userid.overTimeCalculation.OverTimeDate;
          const user_salaryPolicy = await employeeSalaryPolicy(
            userid.overTimeCalculation.UserMasterID,
            date
          );

          let start_Date;
          let end_Date;

          const month = Number(date.slice(5, 7));
          const year = Number(date.slice(0, 4));
          const monday = daysInMonth(month, year);

          if (user_salaryPolicy) {
            const date2 = user_salaryPolicy['salaryPolicy.salaryCycleDate'];
            const salary_startdate = date2 < 10 ? '0' + date2 : date2;

            start_Date = date.slice(0, 8) + salary_startdate;

            let date1 = new Date(start_Date);
            date1.setDate(date1.getDate() + (monday - 1));

            end_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          } else {
            start_Date = date.slice(0, 8) + '01';
            end_Date = date.slice(0, 8) + monday;
          }

          if (start_Date > date) {
            let date1 = new Date(start_Date);
            date1.setMonth(date1.getMonth() - 1);

            start_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          } else if (end_Date < date) {
            let date1 = new Date(start_Date);
            date1.setMonth(date1.getMonth() + 1);

            start_Date =
              date1.getFullYear() +
              '-' +
              String(date1.getMonth() + 1).padStart(2, '0') +
              '-' +
              String(date1.getDate()).padStart(2, '0');
          }

          const yearmonth = start_Date.slice(0, 4) + start_Date.slice(5, 7);

          const overtimecal = await overTimeCalculationMain.findOne({
            where: {
              userMasterID: userid.overTimeCalculation.UserMasterID,
              yyyymm: yearmonth,
            },
          });

          if (overtimecal) {
            SkipOvetimeUser.push({
              UserMasterID: userid.overTimeCalculation.UserMasterID,
              OverTimeID: userid.overTimeCalculation.OverTimeID,
            });
            continue;
          }
        } else {
          RejectOvetimeUser.push({
            UserMasterID: userid.overTimeCalculation.UserMasterID,
            OverTimeID: userid.overTimeCalculation.OverTimeID,
          });
        }

        // await sequelize.transaction(async (t) => {
        await OvertimeAuthorizationRequest.update(
          {
            viewstatus: 0,
            authstatus: authstatus,
            remarks: finalRemarks,
            updateBy: createBy,
          },
          {
            where: { AuthorizationRequestId: AuthorizationRequestId },
            transaction: t,
          }
        );

        if (authstatus !== 0) {
          await OvertimeCalculation.update(
            {
              UpdateTimeIn: finalUpdateTimeIn,
              UpdateTimeOut: finalUpdateTimeOut,
              UpdateTimeInDateTime: finalUpdateTimeInDateTime,
              UpdateTimeOutDateTime: finalUpdateTimeOutDateTime,
              UpdateOverTimeHourAndMin: finalUpdateOverTimeHourAndMin,
              updateBy: createBy,
            },
            {
              where: { OverTimeID: ReferenceID },
              transaction: t,
            }
          );
        }

        const auth_request = otAuthRequest.filter(
          (e) => e.ReferenceID == ReferenceID
        );
        const FormAuthorizations = AllFormAuthorizations.find(
          (e) => e.userMasterID == userid.overTimeCalculation.UserMasterID
        );

        if (FormAuthorizations) {
          const AuthorizationCriterias = await AuthorizationCriteria.findOne({
            where: {
              AuthorizationCriteriaID:
                FormAuthorizations.AuthorizationCriteriaID,
              status: 1,
            },
          });

          if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
            if (authstatus == 0) {
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: 4,
                },
                {
                  where: { OverTimeID: ReferenceID },
                  transaction: t,
                }
              );
            } else {
              const auth_requestsequence = otAuthRequest.filter(
                (e) => e.ReferenceID == ReferenceID && e.authstatus != 0
              );

              let arr = [];
              for (let k = 0; k < auth_requestsequence.length; k++) {
                arr.push(parseInt(auth_requestsequence[k].userMasterID));
              }

              let FormAuthorizationsUser =
                FormAuthorizations.AuthorizedByUserMasterId;
              let remainingid = FormAuthorizationsUser.filter(
                (d) => !arr.includes(d)
              );

              if (remainingid.length > 0) {
                await OvertimeAuthorizationRequest.create(
                  {
                    ReferenceID: ReferenceID,
                    userMasterID: remainingid[0],
                    status: 1,
                    authstatus: 2,
                    createBy: auth_request[0].createBy,
                  },
                  {
                    transaction: t,
                  }
                );
              } else {
                await OvertimeCalculation.update(
                  {
                    AuthorizationRequired: 3,
                  },
                  {
                    where: { OverTimeID: ReferenceID },
                    transaction: t,
                  }
                );
              }
            }
          } else if (
            AuthorizationCriterias.AuthorizationCriteria == 'Any One'
          ) {
            if (authstatus == 0) {
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: 4,
                },
                {
                  where: { OverTimeID: ReferenceID },
                  transaction: t,
                }
              );
            } else {
              const auth_requestanyoneaccept = otAuthRequest.filter(
                (e) => e.ReferenceID == ReferenceID && e.authstatus == 1
              );

              const accept = auth_requestanyoneaccept.length;

              if (accept + 1 >= 1) {
                await OvertimeCalculation.update(
                  {
                    AuthorizationRequired: 3,
                  },
                  {
                    where: { OverTimeID: ReferenceID },
                    transaction: t,
                  }
                );
              }
            }
          } else if (
            AuthorizationCriterias.AuthorizationCriteria == 'Any Two'
          ) {
            if (authstatus == 0) {
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: 4,
                },
                {
                  where: { OverTimeID: ReferenceID },
                  transaction: t,
                }
              );
            } else {
              const auth_requestanyoneaccept = otAuthRequest.filter(
                (e) => e.ReferenceID == ReferenceID && e.authstatus == 1
              );

              const accept = auth_requestanyoneaccept.length;

              if (accept + 1 >= 2) {
                let result = await OvertimeCalculation.update(
                  {
                    AuthorizationRequired: 3,
                  },
                  {
                    where: { OverTimeID: ReferenceID },
                    transaction: t,
                  }
                );
              }
            }
          } else {
            if (authstatus == 0) {
              await OvertimeCalculation.update(
                {
                  AuthorizationRequired: 4,
                },
                {
                  where: { OverTimeID: ReferenceID },
                  transaction: t,
                }
              );
            } else {
              const auth_requestanyoneaccept = otAuthRequest.filter(
                (e) => e.ReferenceID == ReferenceID && e.authstatus == 1
              );

              const accept = auth_requestanyoneaccept.length;

              if (accept + 1 >= 3) {
                let result = await OvertimeCalculation.update(
                  {
                    AuthorizationRequired: 3,
                  },
                  {
                    where: { OverTimeID: ReferenceID },
                    transaction: t,
                  }
                );
              }
            }
          }
        }
      }
    });

    ApproveOvetimeUser = ApproveOvetimeUser.filter((approveUser) => {
      return !SkipOvetimeUser.some(
        (skipUser) =>
          skipUser.UserMasterID === approveUser.UserMasterID &&
          skipUser.OverTimeID === approveUser.OverTimeID
      );
    });

    if (authstatus == 1) {
      let message = '';

      message =
        'Overtime has been approved (' +
        ApproveOvetimeUser.length +
        ') users successfully. <br>';

      if (SkipOvetimeUser.length > 0) {
        let Notassigned = await UserMaster.findAll({
          raw: true,
          where: {
            userMasterID: SkipOvetimeUser[0].UserMasterID,
            status: 1,
          },
          attributes: ['displayName'],
        });

        let notacceptname = '';

        if (Notassigned.length > 0) {
          for (let i = 0; i < Notassigned.length; i++) {
            notacceptname = notacceptname + Notassigned[i].displayName + ',';
          }
          message =
            message +
            '<div style="text-align:justify;font-weight : 800;margin-top : 5px">Overtime request for ' +
            notacceptname +
            ' cannot be approved because overtime has already been calculated for this month.</div><div style="text-align:justify;font-weight : 800;margin-top : 5px"> Please delete the existing overtime calculation for the selected date before approving the request. </div>';
        }
      }

      return res.status(200).json({
        status: 200,
        message: message,
        data: {},
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.authreject,
        data: {},
      });
    }
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
function addQuotes(value) {
  var quotedVar = "'" + value + "'";
  return quotedVar;
}

exports.viewauthorizationrequestbyuseridforexpense1 = async (
  req,
  res,
  next
) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let result, count;

    let resultcheck = await executeQuery(
      `select * from ms_fun_expense_auth_data(` + req.body.userMasterID + `)`
    );
    if (resultcheck.length > 0) {
      if (
        req.body.fromdate == '' &&
        req.body.todate == '' &&
        req.body.fromamount == '' &&
        req.body.toamount == '' &&
        req.body.product == ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS NOT NULL and toursmasterid IS NULL'
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS  NULL and toursmasterid IS NOT NULL'
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and visitid IS NULL and toursmasterid IS NULL'
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') '
          );
        }
      } else if (
        req.body.fromdate != '' &&
        req.body.todate != '' &&
        req.body.fromamount == '' &&
        req.body.toamount == '' &&
        req.body.product == ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              '  and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              '  and visitid IS NOT NULL and toursmasterid IS NULL '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              '  and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              '  and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and visitid IS NULL and toursmasterid IS NULL'
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' '
          );
        }
      } else if (
        req.body.fromdate == '' &&
        req.body.todate == '' &&
        req.body.fromamount != '' &&
        req.body.toamount != '' &&
        req.body.product == ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and  visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and  visitid IS NOT NULL and toursmasterid IS NULL'
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NULL '
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' '
          );
        }
      } else if (
        req.body.fromdate == '' &&
        req.body.todate == '' &&
        req.body.fromamount == '' &&
        req.body.toamount == '' &&
        req.body.product != ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL  '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS  NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS  NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS  NULL and toursmasterid IS  NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') and visitid IS  NULL and toursmasterid IS  NULL '
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ')  LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ')  and productid IN (' +
              req.body.product +
              ') '
          );
        }
      } else if (
        req.body.fromdate != '' &&
        req.body.todate != '' &&
        req.body.fromamount != '' &&
        req.body.toamount != '' &&
        req.body.product == ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NOT NULL and toursmasterid IS NULL '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and visitid IS NULL and toursmasterid IS NULL  '
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*)    from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ''
          );
        }
      } else if (
        req.body.fromdate != '' &&
        req.body.todate != '' &&
        req.body.fromamount == '' &&
        req.body.toamount == '' &&
        req.body.product != ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL'
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ') LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              'and productid IN (' +
              req.body.product +
              ')'
          );
        }
      } else if (
        req.body.fromdate == '' &&
        req.body.todate == '' &&
        req.body.fromamount != '' &&
        req.body.toamount != '' &&
        req.body.product != ''
      ) {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL'
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ')'
          );
        }
      } else {
        if (req.body.expensetype == 'Visit') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NOT NULL and toursmasterid IS NULL '
          );
        } else if (req.body.expensetype == 'Tour') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NOT NULL '
          );
        } else if (req.body.expensetype == 'Personal') {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') and visitid IS NULL and toursmasterid IS NULL'
          );
        } else {
          result = await executeQuery(
            'select * from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ') LIMIT ' +
              limit +
              ' OFFSET ' +
              offset +
              ''
          );
          count = await executeQuery(
            'select count(*) from ms_fun_expense_auth_data(' +
              req.body.userMasterID +
              ') where createby IN (' +
              req.body.userid +
              ') and expense_date between ' +
              addQuotes(req.body.fromdate) +
              ' and ' +
              addQuotes(req.body.todate) +
              ' and expenseamount BETWEEN ' +
              req.body.fromamount +
              ' AND ' +
              req.body.toamount +
              ' and productid IN (' +
              req.body.product +
              ')'
          );
        }
      }
    } else {
      result = [];
      count = 0;
    }

    res.status(200).json({
      status: 200,
      data: result,
      totalcount: Number(count[0] ? count[0].count : 0),
    });
  } catch (err) {
    next(err);
  }
};

exports.getauthrequestdata = async (req, res, next) => {
  try {
    let userName = await executeQuery(
      'SELECT DISTINCT expensename,usermobilenumber FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );
    let department = await executeQuery(
      'SELECT DISTINCT departmentname FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );
    let branch = await executeQuery(
      'SELECT DISTINCT branchname FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );

    let expensehead = await executeQuery(
      'SELECT DISTINCT expensehead FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );

    let authstatus = await executeQuery(
      'SELECT DISTINCT authstatus FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );

    let product = await executeQuery(
      'SELECT DISTINCT productName FROM ms_fun_expense_auth_data(' +
        req.params.id +
        ')'
    );

    res.status(200).json({
      status: 200,
      userName: userName,
      department: department,
      branch: branch,
      expensehead: expensehead,
      authstatus: authstatus,
      product: product,
    });
  } catch (err) {
    next(err);
  }
};

exports.checkfcm = async (req, res, next) => {
  try {
    let = { userExpenseTransactionID, authname, authstatus } = req.body;
    const registrationToken =
      'feQlfzRuTqWSkgap3u_MV8:APA91bFDCudPzoVkTbtAOvsFsUqcoHGa5nSeyChqB1TPXigehBswMcBXYA69ClI1LMwCi-4Kya9UFvU85Nxy8DVZJOlCayQ5RVaYZ40ZgTDwgMS78ow0GRldgy8l7sv49Bhq2tY1kebb';
    const message_notification = {
      notification: {
        title: 'Expense',
        body: 'Expense accepted successfully',
      },
      data: {
        title: 'Expense',
        body: 'Expense accepted successfully',
        Id: req.body.userExpenseTransactionID,
        AuthName: req.body.authname,
        status: req.body.authstatus,
        screen: 'expense',
      },
    };

    const options = notification_options;
    if (
      firebase_token != null &&
      firebase_token != '' &&
      firebase_token != undefined
    ) {
      Notification.admin
        .messaging()
        .sendToDevice(registrationToken, message_notification, options)
        .then((response) => {
          res.status(200).send('Notification sent successfully');
          console.log(message_notification, 'Notification sent successfully');
        })
        .catch((error) => {
          console.log(error);
        });
    }
  } catch (err) {
    console.log(err);
    return res.json({ status: 500, message: err.message, data: {} });
  }
};

exports.overtimeAuthCriteria = async (req, res, next) => {
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
        AuthorizationMasterID: authorizationMasterTypes.overtime,
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
          AuthorizationMasterID: authorizationMasterTypes.overtime,
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

      for (let i = 0; i < usermaster.dataValues.user.length; i++) {
        Auth_person_Arr.push(usermaster.dataValues.user[i]);
      }

      for (let j = 0; j < Auth_person_Arr.length; j++) {
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

exports.overtimeAuthoriedUser = async (req, res, next) => {
  try {
    let { companyMasterID, branchMasterID, authPersonid } = await req.body;
    let userdata, Auth_person;
    const condition = {
      AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [authPersonid] },
      AuthorizationMasterID: authorizationMasterTypes.overtime,
      status: 1,
    };
    if (!branchMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterID = companyMasterID;
    }
    if (branchMasterID) {
      req.userDetails.accessibleBranches = branchMasterID;

      Auth_person = await AuthorizationDetails.findAll({
        where: condition,
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: {
            model: EmployeeBranch,
            where: {
              status: 1,
              branchID: branchMasterID,
              applicableDate: { [Sequelize.Op.lte]: new Date() },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: new Date() } },
                { endDate: { [Sequelize.Op.eq]: null } },
              ],
            },
            required: true,
            attributes: ['branchID'],
          },
        },
      });
    } else {
      Auth_person = await AuthorizationDetails.findAll({
        where: condition,
        include: {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      });
    }

    let userid = [];

    for (let i = 0; i < Auth_person.length; i++) {
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

    return res.status(200).json({
      status: 200,
      message: 'Data get successfully.',
      data: userdata,
    });
  } catch (error) {
    next(err.message);
  }
};

exports.authorizationacceptrejectexpenseall = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { newArray, authstatus } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const currentUserID = req.userDetails.userMasterId;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const mapAllExpenseTransIDs = newArray.map(
      (e) => +e.userexpensetransactionid
    );
    const [findAllExpenseTransations] = await Promise.all([
      UserExpenseTransaction.findAll({
        where: {
          userExpenseTransactionID: mapAllExpenseTransIDs,
        },
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
          },
          {
            model: ExpenseAuthorizationRequest,
            as: 'Auth',
          },
        ],
      }),
    ]);
    const userMasterID =
      findAllExpenseTransations?.[0]?.userExpense?.userMasterID;
    const findUserCompany = await UserMaster.findOne({
      where: {
        userMasterID,
      },
      attributes: ['companyMasterId'],
    });

    const [
      findCompanyExpenseMailTemplate,
      findCompanyNotificationPolicyData,
      authorizationdetails,
      expenseHeadIds,
    ] = await Promise.all([
      mailTemplateEditor.findAll({
        where: {
          status: 1,
          mailTypeID: [
            mailTemplateTypes.expenseMailTemplate,
            mailTemplateTypes.expenseAcceptMailTemplate,
            mailTemplateTypes.expenseRejectMailTemplate,
          ],
          companyMasterID: findUserCompany.companyMasterId,
        },
      }),
      findCompanyNotificationPolicy(findUserCompany.companyMasterId),
      findAuthorizationDetails(authorizationMasterTypes.expense, userMasterID),
      new Set(findAllExpenseTransations.map((item) => +item.expenseHeadId)),
    ]);
    if (authorizationdetails) {
      const [getAllUserDetails, findExpenseHeadData] = await Promise.all([
        UserMaster.findAll({
          distinct: true,
          where: {
            userMasterID: [
              ...authorizationdetails.AuthorizedByUserMasterId,
              userMasterID,
              currentUserID,
            ],
          },
          attributes: userAttributes,
          include: [
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
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
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
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
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(currentdate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(currentdate) },
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
          ],
        }),
        ExpenseHead.findAll({
          where: {
            expenseHeadId: {
              [Sequelize.Op.in]: [...expenseHeadIds],
            },
          },
          include: [
            {
              model: ExpenseCategory,
            },
          ],
        }),
      ]);
      const promiseArray = [];
      const createInboxPromise = [];
      for (let i = 0; i < newArray.length; i++) {
        const finUserExpenseTranction = findAllExpenseTransations.find(
          (e) =>
            +e.userExpenseTransactionID == +newArray[i].userexpensetransactionid
        );
        const allAuthData = finUserExpenseTranction.Auth || [];
        const {
          findCurrentAuthReq,
          allAuthIds,
          approvedRequests,
          authRequests,
          formAuthUsers,
          userData,
          expenseAcceptMailTemplate,
          expenseRejectMailTemplate,
          expenseMailTemplate,
          findHeadData,
          ExpenseType,
          expense_date,
          currentAuthUserData,
        } = (() => {
          return {
            findCurrentAuthReq: allAuthData.find(
              (e) =>
                e.AuthorizationRequestId == +newArray[i].authorizationrequestid
            ),
            allAuthIds: allAuthData.map((e) => +e.AuthorizationRequestId),
            approvedRequests: allAuthData.filter((e) => +e.authstatus == 1),
            authRequests: allAuthData.filter((e) => e.authstatus != 0),
            formAuthUsers: authorizationdetails.AuthorizedByUserMasterId.map(
              (id) => id.toString()
            ),
            userData: getAllUserDetails.find(
              (e) => e.userMasterID == +userMasterID
            ),
            expenseAcceptMailTemplate: findCompanyExpenseMailTemplate.find(
              (e) =>
                +e.mailTypeID == mailTemplateTypes.expenseAcceptMailTemplate
            ),
            expenseRejectMailTemplate: findCompanyExpenseMailTemplate.find(
              (e) =>
                +e.mailTypeID == +mailTemplateTypes.expenseRejectMailTemplate
            ),
            expenseMailTemplate: findCompanyExpenseMailTemplate.find(
              (e) => +e.mailTypeID == +mailTemplateTypes.expenseMailTemplate
            ),
            findHeadData: findExpenseHeadData.find(
              (e) => +e.expenseHeadId == +finUserExpenseTranction.expenseHeadId
            ),
            ExpenseType: getExpenseType(finUserExpenseTranction),
            expense_date: finUserExpenseTranction.userExpense.expense_date,
            currentAuthUserData: getAllUserDetails.find(
              (e) => e.userMasterID == +currentUserID
            ),
          };
        })();

        function getExpenseType(rowData) {
          return rowData.userExpense.ToursMaster
            ? expenseTypes.TOUR
            : rowData.userExpense.visit
              ? expenseTypes.VISIT
              : rowData.userExpense.project
                ? expenseTypes.PROJECT
                : expenseTypes.PERSONAL;
        }
        if (findCurrentAuthReq && authorizationdetails) {
          promiseArray.push(
            ExpenseAuthorizationRequest.update(
              {
                viewstatus: 0,
                authstatus: authstatus,
                remarks: newArray[i].remarks ? newArray[i].remarks : '',
                updateBy,
              },
              {
                where: {
                  AuthorizationRequestId: newArray[i].authorizationrequestid,
                },
                transaction,
              }
            )
          );

          if (authstatus == 0) {
            promiseArray.push(
              UserInbox.destroy(
                {
                  where: {
                    activityTable: UserExpense.getTableName(),
                    activityTablePK: allAuthIds,
                  },
                },
                { transaction }
              )
            );

            promiseArray.push(
              UserExpenseTransaction.update(
                {
                  authorizationStatus: 4,
                  updateBy,
                },
                {
                  where: {
                    userExpenseTransactionID:
                      newArray[i].userexpensetransactionid,
                  },
                  transaction,
                }
              )
            );
            const notification = {
              title: 'Expense',
              body: 'Expense Rejected',
            };
            const data = {
              screen: 'expense',
            };
            sendNotification_NEW(
              userData.firebaseToken,
              userData.deviceType,
              notification,
              data
            );
            if (
              expenseRejectMailTemplate &&
              findCompanyNotificationPolicyData &&
              userData.email
            ) {
              // send mail
              sendMailforExpense_With_Transaction(
                userData.email,
                userData,
                findHeadData?.expenseHead || '', //Expense Head
                findHeadData?.expenseCategories?.[0]?.expenseCategory || '', //Expense Category
                finUserExpenseTranction.expenseAmount,
                finUserExpenseTranction.description,
                expenseRejectMailTemplate,
                findCompanyNotificationPolicyData,
                ExpenseType,
                expense_date,
                currentAuthUserData,
                newArray[i].remarks ? newArray[i].remarks : ''
              );
            }
          } else {
            if (
              +authorizationdetails.AuthorizationCriteriaID ==
              authorizationCriteriaType.SEQUENCENO
            ) {
              promiseArray.push(
                UserInbox.destroy({
                  where: {
                    activityTable: UserExpense.getTableName(),
                    activityTablePK: allAuthIds,
                  },
                  transaction,
                })
              );
              const approvedUserIds = authRequests.map((e) =>
                e.userMasterID.toString()
              );
              const remainingUserIds = formAuthUsers.filter(
                (id) => !approvedUserIds.includes(id)
              );

              if (remainingUserIds.length > 0) {
                const createExpenseAuth =
                  await ExpenseAuthorizationRequest.create(
                    {
                      ReferenceID: newArray[i].userexpensetransactionid,
                      userMasterID: remainingUserIds[0],
                      status: 1,
                      authstatus: 2,
                      createBy: updateBy,
                    },
                    { transaction }
                  );

                if (finUserExpenseTranction) {
                  const authorizerData = getAllUserDetails.find(
                    (e) => e.userMasterID == +remainingUserIds[0]
                  );
                  if (authorizerData && userData) {
                    const createInboxObj = {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK:
                        createExpenseAuth.toJSON().AuthorizationRequestId,
                      message: `${userData.displayName} has applied for Expense of ${finUserExpenseTranction.expenseAmount}`,
                      assignedTo: remainingUserIds[0],
                      assignedBy: userData.userMasterID,
                    };
                    createInboxPromise.push(createInboxObj);
                    let notification = {
                      title:
                        'Hey ' +
                        authorizerData.firstName +
                        '! Someone requested for expense',
                      body:
                        userData.firstName +
                        ' has requested for expense approval',
                    };
                    let data = {
                      screen: 'expenserequest',
                      isScheduled: 'true',
                      scheduledTime: new Date().toISOString(),
                    };

                    sendNotification_NEW(
                      authorizerData.firebaseToken,
                      authorizerData.deviceType,
                      notification,
                      data
                    );
                    if (
                      expenseMailTemplate &&
                      findCompanyNotificationPolicyData &&
                      authorizerData.email &&
                      userData.email
                    ) {
                      // send mail
                      sendMailforExpense_With_Transaction(
                        authorizerData.email,
                        userData,
                        findHeadData?.expenseHead || '', //Expense Head
                        findHeadData?.expenseCategories?.[0]?.expenseCategory ||
                          '', //Expense Category
                        finUserExpenseTranction.expenseAmount,
                        finUserExpenseTranction.description,
                        expenseMailTemplate,
                        findCompanyNotificationPolicyData,
                        ExpenseType,
                        expense_date,
                        currentAuthUserData
                      );
                    }
                  }
                }
              } else {
                promiseArray.push(
                  UserExpenseTransaction.update(
                    {
                      authorizationStatus: 3,
                      updateBy,
                    },
                    {
                      where: {
                        userExpenseTransactionID:
                          newArray[i].userexpensetransactionid,
                      },
                      transaction,
                    }
                  )
                );
                const notification = {
                  title: 'Expense',
                  body: 'Expense accepted successfully',
                };
                const data = {
                  screen: 'expense',
                };
                sendNotification_NEW(
                  userData.firebaseToken,
                  userData.deviceType,
                  notification,
                  data
                );
                if (
                  expenseAcceptMailTemplate &&
                  findCompanyNotificationPolicyData &&
                  userData.email
                ) {
                  // send mail
                  sendMailforExpense_With_Transaction(
                    userData.email,
                    userData,
                    findHeadData?.expenseHead || '', //Expense Head
                    findHeadData?.expenseCategories?.[0]?.expenseCategory || '', //Expense Category
                    finUserExpenseTranction.expenseAmount,
                    finUserExpenseTranction.description,
                    expenseAcceptMailTemplate,
                    findCompanyNotificationPolicyData,
                    ExpenseType,
                    expense_date,
                    currentAuthUserData
                  );
                }
              }
            } else if (
              +authorizationdetails.AuthorizationCriteriaID ==
              authorizationCriteriaType.ANYONE
            ) {
              promiseArray.push(
                UserInbox.destroy(
                  {
                    where: {
                      activityTable: UserExpense.getTableName(),
                      activityTablePK: allAuthIds,
                    },
                  },
                  {
                    transaction,
                  }
                )
              );
              promiseArray.push(
                UserExpenseTransaction.update(
                  {
                    authorizationStatus: 3,
                    updateBy,
                  },
                  {
                    where: {
                      userExpenseTransactionID:
                        newArray[i].userexpensetransactionid,
                    },
                    transaction,
                  }
                )
              );

              const notification = {
                title: 'Expense',
                body: 'Expense accepted successfully',
              };
              const data = {
                screen: 'expense',
              };
              sendNotification_NEW(
                userData.firebaseToken,
                userData.deviceType,
                notification,
                data
              );
              if (
                expenseAcceptMailTemplate &&
                findCompanyNotificationPolicyData &&
                userData.email
              ) {
                // send mail
                sendMailforExpense_With_Transaction(
                  userData.email,
                  userData,
                  findHeadData?.expenseHead || '', //Expense Head
                  findHeadData?.expenseCategories?.[0]?.expenseCategory || '', //Expense Category
                  finUserExpenseTranction.expenseAmount,
                  finUserExpenseTranction.description,
                  expenseAcceptMailTemplate,
                  findCompanyNotificationPolicyData,
                  ExpenseType,
                  expense_date,
                  currentAuthUserData
                );
              }
            } else if (
              +authorizationdetails.AuthorizationCriteriaID ==
              authorizationCriteriaType.ANYTWO
            ) {
              if (approvedRequests.length + 1 >= 2) {
                promiseArray.push(
                  UserInbox.destroy(
                    {
                      where: {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK: allAuthIds,
                      },
                    },
                    {
                      transaction,
                    }
                  )
                );
                promiseArray.push(
                  await UserExpenseTransaction.update(
                    {
                      authorizationStatus: 3,
                      updateBy,
                    },
                    {
                      where: {
                        userExpenseTransactionID:
                          newArray[i].userexpensetransactionid,
                      },
                      transaction,
                    }
                  )
                );
                const notification = {
                  title: 'Expense',
                  body: 'Expense accepted successfully',
                };
                const data = {
                  screen: 'expense',
                };
                sendNotification_NEW(
                  userData.firebaseToken,
                  userData.deviceType,
                  notification,
                  data
                );
                if (
                  expenseAcceptMailTemplate &&
                  findCompanyNotificationPolicyData &&
                  userData.email
                ) {
                  // send mail
                  sendMailforExpense_With_Transaction(
                    userData.email,
                    userData,
                    findHeadData?.expenseHead || '', //Expense Head
                    findHeadData?.expenseCategories?.[0]?.expenseCategory || '', //Expense Category
                    finUserExpenseTranction.expenseAmount,
                    finUserExpenseTranction.description,
                    expenseAcceptMailTemplate,
                    findCompanyNotificationPolicyData,
                    ExpenseType,
                    expense_date,
                    currentAuthUserData
                  );
                }
              } else {
                promiseArray.push(
                  UserInbox.destroy(
                    {
                      where: {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK: newArray[i].authorizationrequestid,
                      },
                    },
                    { transaction }
                  )
                );
              }
            } else {
              if (approvedRequests.length + 1 >= 3) {
                promiseArray.push(
                  UserExpenseTransaction.update(
                    {
                      authorizationStatus: 3,
                      updateBy,
                    },
                    {
                      where: {
                        userExpenseTransactionID:
                          newArray[i].userexpensetransactionid,
                      },
                      transaction,
                    }
                  )
                );
                promiseArray.push(
                  UserInbox.destroy(
                    {
                      where: {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK: allAuthIds,
                      },
                    },
                    {
                      transaction,
                    }
                  )
                );
                const notification = {
                  title: 'Expense',
                  body: 'Expense accepted successfully',
                };
                const data = {
                  screen: 'expense',
                };
                sendNotification_NEW(
                  userData.firebaseToken,
                  userData.deviceType,
                  notification,
                  data
                );
                if (
                  expenseAcceptMailTemplate &&
                  findCompanyNotificationPolicyData &&
                  userData.email
                ) {
                  // send mail
                  sendMailforExpense_With_Transaction(
                    userData.email,
                    userData,
                    findHeadData?.expenseHead || '', //Expense Head
                    findHeadData?.expenseCategories?.[0]?.expenseCategory || '', //Expense Category
                    finUserExpenseTranction.expenseAmount,
                    finUserExpenseTranction.description,
                    expenseAcceptMailTemplate,
                    findCompanyNotificationPolicyData,
                    ExpenseType,
                    expense_date,
                    currentAuthUserData
                  );
                }
              } else {
                promiseArray.push(
                  UserInbox.destroy(
                    {
                      where: {
                        activityTable: UserExpense.getTableName(),
                        activityTablePK: newArray[i].authorizationrequestid,
                      },
                    },
                    { transaction }
                  )
                );
              }
            }
          }
        }
      }
      if (createInboxPromise.length > 0) {
        promiseArray.push(
          UserInbox.bulkCreate(createInboxPromise, {
            transaction,
          })
        );
      }
      await Promise.all(promiseArray);
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        +authstatus == 1
          ? message.usermessage.approveMessage('User Expense')
          : message.usermessage.rejectMessage('User Expense'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.overtimedatashow = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      userMasterID,
      startdate,
      enddate,
      AuthorizationRequired,
      searchQuery,
      exportData,
      exportFileType,
    } = await req.body;

    let offset = (page - 1) * limit;

    const condition = {};

    if (AuthorizationRequired == 0) {
      condition.AuthorizationRequired = [0, 1, 2];
    } else if (AuthorizationRequired == 1) {
      condition.AuthorizationRequired = 3;
    } else if (AuthorizationRequired == 2) {
      condition.AuthorizationRequired = 4;
    }

    if (startdate && enddate) {
      condition.OverTimeDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    const userSearchCondition = {};
    if (searchQuery)
      userSearchCondition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.CompanyMasterID = companyMasterID;
    }

    if (userMasterID) {
      condition.UserMasterID = userMasterID;
    }

    const overtimedata = await OvertimeCalculation.findAndCountAll({
      limit: limit,
      offset: offset,
      where: condition,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          where: userSearchCondition,
          attributes: [],
          required: true,
          ...accessibleUsers(req.userDetails, false),
        },
        { model: attendanceTransaction, attributes: [] },
        { model: companyMaster, attributes: [] },
      ],
      attributes: [
        [Sequelize.col('userMaster.displayName'), 'displayName'],
        [Sequelize.col('userMaster.userNumber'), 'userNumber'],
        [Sequelize.col('attendanceTransaction.InDatetime'), 'InDatetime'],
        [Sequelize.col('attendanceTransaction.OutDateTime'), 'OutDateTime'],
        [Sequelize.col('companyMaster.companyName'), 'CompanyName'],
        'OverTimeDate',
        'OverTimeIn',
        'OverTimeOut',
        'OverTimeHourAndMin',
        'OverTimeID',
        'AuthorizationRequired',
        'UpdateTimeInDateTime',
        'UpdateTimeOutDateTime',
        'UpdateOverTimeHourAndMin',
        'UserMasterID',
      ],
    });

    for (let j = 0; j < overtimedata.rows.length; j++) {
      let authorizationdetails = await AuthorizationDetails.findOne({
        where: {
          userMasterID: overtimedata.rows[j].UserMasterID,
          status: 1,
        },
        raw: true,
        attributes: [],
        include: [
          {
            model: AuthorizationMaster,
            where: { authorizationMasterName: 'Overtime' },
            attributes: [],
          },
          {
            model: AuthorizationCriteria,
            attributes: ['AuthorizationCriteria'],
          },
        ],
      });
      if (authorizationdetails) {
        overtimedata.rows[j].dataValues.Auth_Criteria =
          authorizationdetails[
            'AuthorizationCriteriaMaster.AuthorizationCriteria'
          ];
      }
    }

    async function processRow(row) {
      const [designation, department, branch, assignPersonName] =
        await Promise.all([
          employeeDesignation(row.dataValues.UserMasterID, new Date()),
          employeeDepartment(row.dataValues.UserMasterID, new Date()),
          employeeBranch(row.dataValues.UserMasterID, new Date()),
          getAssignPersonName(row.dataValues),
        ]);

      return {
        UserName: row.dataValues.displayName,
        UserNumber: row.dataValues.userNumber,
        CompanyName: row.dataValues.CompanyName,
        BranchName: branch ? branch['branchMaster.branchName'] : '',
        Designation: designation
          ? designation['designation.designationName']
          : '',
        Department: department ? department['department.departmentName'] : '',
        Status: getStatus(row.dataValues.AuthorizationRequired),
        AuthCriteria: row.dataValues.Auth_Criteria || '',
        AssignPersonName: assignPersonName.length !== 0 ? assignPersonName : '',
        OverTimeDate: row.dataValues.OverTimeDate || '',
        InDatetime: row.dataValues.InDatetime
          ? await asiaKolkataDateTime(row.dataValues.InDatetime)
          : '',
        OutDateTime: row.dataValues.OutDateTime
          ? await asiaKolkataDateTime(row.dataValues.OutDateTime)
          : '',
        OverTimeIn: row.dataValues.OverTimeIn || '',
        OverTimeOut: row.dataValues.OverTimeOut || '',
        OverTimeHourAndMin: row.dataValues.OverTimeHourAndMin || '',
      };
    }

    async function getAssignPersonName(dataValues) {
      if ([0, 1, 2].includes(dataValues.AuthorizationRequired)) {
        const assignPersonData = await OvertimeAuthorizationRequest.findAll({
          where: {
            ReferenceID: dataValues.OverTimeID,
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

    function getStatus(authorizationRequired) {
      switch (authorizationRequired) {
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
        overtimedata.rows.map(processRow)
      );

      await generateExcel(
        updatedDownloadRows,
        'Company-Overtime-Report',
        exportFileType,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Overtime'),
      data: overtimedata,
    });
  } catch (err) {
    next(err);
  }
};

exports.expensedatashow = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      page,
      limit,
      authorizationStatus,
      startdate,
      enddate,
      searchQuery,
      fromAmount,
      toAmount,
      expenseType,
      product,
      exportData,
      exportFileType,
    } = await req.body;

    let offset = (page - 1) * limit;

    if (!companyMasterID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

    if (authorizationStatus == 0) {
      authorizationStatus = [0, 1, 2];
    } else if (authorizationStatus == 1) {
      authorizationStatus = 3;
    } else if (authorizationStatus == 2) {
      authorizationStatus = 4;
    }

    const expenseTypeCondition = {};
    if (startdate && enddate) {
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (expenseType === expenseTypes.VISIT) {
      expenseTypeCondition.visitID = {
        [Sequelize.Op.ne]: null,
      };
    } else if (expenseType === expenseTypes.TOUR) {
      expenseTypeCondition.ToursMasterID = {
        [Sequelize.Op.ne]: null,
      };
    } else if (expenseType === expenseTypes.PERSONAL) {
      expenseTypeCondition.visitID = null;
      expenseTypeCondition.ToursMasterID = null;
      expenseTypeCondition.projectID = null;
    } else if (expenseType === expenseTypes.PROJECT) {
      expenseTypeCondition.projectID = {
        [Sequelize.Op.ne]: null,
      };
    }

    const authorizationFromToAmountCondition = {};
    authorizationFromToAmountCondition.status = 1;
    if (fromAmount && toAmount) {
      authorizationFromToAmountCondition.expenseAmount = {
        [Sequelize.Op.between]: [fromAmount, toAmount],
      };
    }
    if (authorizationStatus) {
      authorizationFromToAmountCondition.authorizationStatus =
        authorizationStatus;
    }

    if (companyMasterID) req.userDetails.accessibleCompanies = companyMasterID;

    const productCondition = {};
    if (product) productCondition.productID = product;

    const userSearchCondition = {};
    if (searchQuery)
      userSearchCondition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const expensedata = await UserExpenseTransaction.findAndCountAll({
      limit,
      offset,
      where: authorizationFromToAmountCondition,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: ExpenseHead,
          attributes: [
            'expenseHeadId',
            'expenseHead',
            'accountHeadID',
            'expenseCategoryId',
          ],
          include: [
            {
              model: ExpenseCategory,
              attributes: ['expenseCategoryId', 'expenseCategory'],
            },
          ],
        },
        {
          model: UserExpense,
          as: 'userExpense',
          required: true,
          attributes: [
            'userExpenseID',
            'visitID',
            'userMasterID',
            'ToursMasterID',
            'expense_date',
            'projectID',
          ],
          where: expenseTypeCondition,
          include: [
            {
              required: true,
              model: UserMaster,
              attributes: userAttributes,
              where: {
                companyMasterId: companyMasterID,
                ...userSearchCondition,
              },
              ...accessibleUsers(req.userDetails, false, false),
              include: [{ model: companyMaster, attributes: ['companyName'] }],
            },
            { model: ToursMaster },
            {
              model: Project,
              attributes: [
                'projectID',
                'projectName',
                'display_id',
                'short_name',
                'projectDescription',
              ],
            },
            {
              model: Visit,
              required: Object.values(productCondition).length > 0,
              attributes: ['visitID', 'visitDate'],
              include: [
                {
                  model: Customer,
                  attributes: ['customerID', 'companyName', 'customerName'],
                },
                {
                  model: Product,
                  attributes: ['productID', 'productName', 'productPhoto'],
                  where: productCondition,
                },
              ],
            },
          ],
        },
      ],
    });

    async function processRow(row) {
      const [
        designation,
        department,
        branch,
        assignPersonName,
        expenseTypeName,
      ] = await Promise.all([
        employeeDesignation(
          row.userExpense.userMaster.userMasterID,
          new Date()
        ),
        employeeDepartment(row.userExpense.userMaster.userMasterID, new Date()),
        employeeBranch(row.userExpense.userMaster.userMasterID, new Date()),
        getAssignPersonName(row),
        getExpenseType(row),
      ]);

      return {
        UserName: row.userExpense.userMaster.displayName,
        UserNumber: row.userExpense.userMaster.userNumber,
        CompanyName: row.userExpense.userMaster.companyMaster.companyName,
        BranchName: branch ? branch['branchMaster.branchName'] : '',
        Designation: designation
          ? designation['designation.designationName']
          : '',
        Department: department ? department['department.departmentName'] : '',
        Status: getStatus(Number(row.authorizationStatus)),
        AssignPersonName: assignPersonName.length !== 0 ? assignPersonName : '',
        UserExpense: row.userExpense.expense_date || '',
        VisitDate:
          expenseTypeName == expenseTypes.VI
            ? moment(row.userExpense.visit.visitDate, 'YYYY-MM-DD').format(
                'DD-MM-YYYY'
              )
            : '',
        ExpenseType: expenseTypeName || '',
        ExpenseHead: row.expenseHead.expenseHead || '',
        ExpenseAmount: row.expenseAmount || '',
        ProductName: row.userExpense.visit
          ? row.userExpense.visit.product.productName
          : '',
        Description: row.description || '',
      };
    }

    async function getExpenseType(rowData) {
      return rowData.userExpense.ToursMaster
        ? expenseTypes.TOUR
        : rowData.userExpense.visit
          ? expenseTypes.VISIT
          : rowData.userExpense.project
            ? expenseTypes.PROJECT
            : expenseTypes.PERSONAL;
    }

    async function getAssignPersonName(dataValues) {
      if ([0, 1, 2].includes(Number(dataValues.authorizationStatus))) {
        const assignPersonData = await ExpenseAuthorizationRequest.findAll({
          where: {
            ReferenceID: dataValues.userExpenseTransactionID,
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
        expensedata.rows.map(processRow)
      );

      await generateExcel(
        updatedDownloadRows,
        'Company-Expense-Report',
        exportFileType,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Expense'),
      data: expensedata,
    });
  } catch (err) {
    next(err);
  }
};

exports.getExpenseAuthorizationRequestByAuthorizationRequestId = async (
  req,
  res,
  next
) => {
  try {
    const get_one_data = await ExpenseAuthorizationRequest.findAll({
      where: {
        AuthorizationRequestId: req.params.id,
      },
    });

    return res.status(200).json({
      status: 200,
      data: get_one_data,
      message: message.usermessage.fetchMessage('data'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getExpenseAuthByUserExpenseTrans = async (req, res, next) => {
  try {
    let {
      expenseType,
      fromamount,
      toamount,
      page,
      limit,
      authorizerUserMasterID,
      fromdate,
      todate,
      product,
      userid,
      authorizationStatus,
    } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const expenseTypeCondition = {};
    const expenseAuthCondition = {
      status: 1,
      userMasterID: authorizerUserMasterID,
      authstatus: 2,
    };
    const expenseTransactionCondition = {};
    const productCondition = {};

    if (authorizationStatus) {
      if (+authorizationStatus === expenseApprovalTypes.APPROVED) {
        expenseTransactionCondition.authorizationStatus = '3';
        expenseTransactionCondition.erpJvid = { [Sequelize.Op.eq]: null };
        expenseTransactionCondition.payment_Id = { [Sequelize.Op.eq]: null };
      }
      if (+authorizationStatus === expenseApprovalTypes.PENDING) {
        expenseTransactionCondition.authorizationStatus = {
          [Sequelize.Op.in]: ['0', '1', '2'],
        };
      }
      if (+authorizationStatus === expenseApprovalTypes.REJECTED) {
        expenseTransactionCondition.authorizationStatus = '4';
      }
    } else {
      expenseTransactionCondition.authorizationStatus = {
        [Sequelize.Op.in]: ['0', '1', '2'],
      };
    }

    if (fromamount && toamount) {
      expenseTransactionCondition.expenseAmount = {
        [Sequelize.Op.gte]: +fromamount,
        [Sequelize.Op.lte]: +toamount,
      };
    } else if (fromamount) {
      expenseTransactionCondition.expenseAmount = {
        [Sequelize.Op.gte]: +fromamount,
      };
    } else if (toamount) {
      expenseTransactionCondition.expenseAmount = {
        [Sequelize.Op.lte]: +toamount,
      };
    }
    expenseTransactionCondition.status = 1;

    if (expenseType) {
      if (expenseType === expenseTypes.VISIT) {
        expenseTypeCondition.visitID = {
          [Sequelize.Op.ne]: null,
        };
      } else if (expenseType === expenseTypes.TOUR) {
        expenseTypeCondition.ToursMasterID = {
          [Sequelize.Op.ne]: null,
        };
      } else if (expenseType === expenseTypes.PERSONAL) {
        expenseTypeCondition.visitID = null;
        expenseTypeCondition.ToursMasterID = null;
        expenseTypeCondition.projectID = null;
      } else if (expenseType === expenseTypes.PROJECT) {
        expenseTypeCondition.projectID = {
          [Sequelize.Op.ne]: null,
        };
      }
    }

    if (fromdate && todate) {
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      };
    }

    if (product && product.length) {
      productCondition.productID = product;
    }

    if (userid && userid.length) {
      expenseTypeCondition.userMasterID = { [Sequelize.Op.in]: userid };
    }
    const { rows: findExpenseAuthRequest, count } =
      await ExpenseAuthorizationRequest.findAndCountAll({
        where: expenseAuthCondition,
        ...paginationQuery,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: UserExpenseTransaction,
            where: expenseTransactionCondition,
            include: [
              {
                model: ExpenseHead,
                as: 'expenseHead',
                attributes: [
                  'expenseHeadId',
                  'expenseHead',
                  'accountHeadID',
                  'expenseCategoryId',
                ],
                include: [
                  {
                    model: ExpenseCategory,
                    attributes: ['expenseCategoryId', 'expenseCategory'],
                  },
                ],
              },
              {
                model: UserExpense,
                as: 'userExpense',
                where: expenseTypeCondition,
                attributes: [
                  'userExpenseID',
                  'visitID',
                  'userMasterID',
                  'ToursMasterID',
                  'expense_date',
                  'projectID',
                ],
                include: [
                  {
                    required: true,
                    model: UserMaster,
                    attributes: userAttributes,
                    include: [
                      { model: companyMaster, attributes: ['companyName'] },
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
                              endDate: {
                                [Sequelize.Op.gte]: new Date(filterDate),
                              },
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
                              endDate: {
                                [Sequelize.Op.gte]: new Date(filterDate),
                              },
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
                              endDate: {
                                [Sequelize.Op.gte]: new Date(filterDate),
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
                        separate: true,

                        model: EmployeeJoiningDetails,
                        attributes: ['employeeCode'],
                      },
                      {
                        separate: true,

                        required: false,
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
                    required: Object.values(productCondition).length > 0,
                    model: Visit,
                    attributes: ['visitID', 'visitDate'],
                    include: [
                      {
                        model: Customer,
                        attributes: [
                          'customerID',
                          'companyName',
                          'customerName',
                        ],
                      },
                      {
                        model: Product,
                        where: productCondition,

                        attributes: [
                          'productID',
                          'productName',
                          'productPhoto',
                        ],
                      },
                    ],
                  },
                  { required: false, model: ToursMaster },
                  {
                    required: false,
                    model: Project,
                    attributes: [
                      'projectID',
                      'projectName',
                      'display_id',
                      'short_name',
                      'projectDescription',
                    ],
                  },
                ],
              },
            ],
          },
          {
            required: true,
            model: UserMaster,
            as: 'authorizedPerson',
            attributes: userAttributes,
            include: [{ model: companyMaster, attributes: ['companyName'] }],
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: findExpenseAuthRequest,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getExpenseAuthByUserExpense = async (req, res, next) => {
  try {
    let {
      expenseType,
      page,
      limit,
      authorizerUserMasterID,
      fromdate,
      todate,
      userid,
      authorizationStatus,
    } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const expenseTypeCondition = {};
    const expenseAuthCondition = {
      status: 1,
      userMasterID: authorizerUserMasterID,
      authstatus: 2,
    };
    const expenseTransactionCondition = {};
    if (authorizationStatus) {
      if (+authorizationStatus === expenseApprovalTypes.APPROVED) {
        expenseTransactionCondition.authorizationStatus = '3';
        expenseTransactionCondition.erpJvid = { [Sequelize.Op.eq]: null };
        expenseTransactionCondition.payment_Id = { [Sequelize.Op.eq]: null };
      }
      if (+authorizationStatus === expenseApprovalTypes.PENDING) {
        expenseTransactionCondition.authorizationStatus = {
          [Sequelize.Op.in]: ['0', '1', '2'],
        };
      }
      if (+authorizationStatus === expenseApprovalTypes.REJECTED) {
        expenseTransactionCondition.authorizationStatus = '4';
      }
    } else {
      expenseTransactionCondition.authorizationStatus = {
        [Sequelize.Op.in]: ['0', '1', '2'],
      };
    }

    expenseTransactionCondition.status = 1;

    if (expenseType) {
      if (expenseType === expenseTypes.VISIT) {
        expenseTypeCondition.visitID = {
          [Sequelize.Op.ne]: null,
        };
      } else if (expenseType === expenseTypes.TOUR) {
        expenseTypeCondition.ToursMasterID = {
          [Sequelize.Op.ne]: null,
        };
      } else if (expenseType === expenseTypes.PERSONAL) {
        expenseTypeCondition.visitID = null;
        expenseTypeCondition.ToursMasterID = null;
        expenseTypeCondition.projectID = null;
      } else if (expenseType === expenseTypes.PROJECT) {
        expenseTypeCondition.projectID = {
          [Sequelize.Op.ne]: null,
        };
      }
    }

    if (fromdate && todate) {
      expenseTypeCondition.expense_date = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate)],
      };
    }

    if (userid && userid.length) {
      expenseTypeCondition.userMasterID = { [Sequelize.Op.in]: userid };
    }

    const { rows: findUserExpenseAuth, count } =
      await UserExpense.findAndCountAll({
        where: expenseTypeCondition,
        ...paginationQuery,
        order: [['expense_date', 'DESC']],
        distinct: true,
        attributes: {
          include: [
            [
              Sequelize.literal(`(
                SELECT json_build_object(
                'pending', COUNT(*) FILTER (
                WHERE uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 2
                ),
                'approved', COUNT(*) FILTER (
                WHERE uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 1
                ),
                'rejected', COUNT(*) FILTER (
                WHERE uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 0
                ),
                'total', COUNT(*) FILTER (
                WHERE uet."status" = 1
                ),
                'pendingAmount', COALESCE(SUM(
                CASE 
                WHEN uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 2
                THEN uet."expenseAmount" 
                ELSE 0 
                END
                ), 0),
                'approvedAmount', COALESCE(SUM(
                CASE 
                WHEN uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 1
                THEN uet."expenseAmount" 
                ELSE 0 
                END
                ), 0),
                'rejectedAmount', COALESCE(SUM(
                CASE 
                WHEN uet."deletedAt" IS NULL 
                AND uet."status" = 1
                AND ua."authstatus" = 0
                THEN uet."expenseAmount" 
                ELSE 0 
                END
                ), 0),
                'totalExpenseAmount', COALESCE(SUM(
                CASE 
                WHEN uet."deletedAt" IS NULL 
                AND uet."status" = 1
                THEN uet."expenseAmount" 
                ELSE 0 
                END
                ), 0)
                )
                FROM "userExpenseTransactions" AS uet 
                JOIN "expenseAuthorizations" AS ua
                ON ua."ReferenceID" = uet."userExpenseTransactionID"
                WHERE uet."userExpenseID" = "userExpense"."userExpenseID" 
                AND uet."status" = 1 
                AND ua."userMasterID" = ${authorizerUserMasterID} 
                )`),
              'expenseSummary',
            ],
          ],
        },
        include: [
          {
            // separate: true,
            model: UserExpenseTransaction,
            where: expenseTransactionCondition,
            include: [
              {
                required: true,
                model: ExpenseAuthorizationRequest,
                where: expenseAuthCondition,
              },
            ],
          },
          {
            model: UserMaster,
            required: true,
            attributes: userAttributes,
            include: [
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
                separate: true,

                required: false,
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
    return res.status(200).json({
      status: 200,
      data: findUserExpenseAuth,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
