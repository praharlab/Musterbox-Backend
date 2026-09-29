const Sequelize = require('sequelize');
const LoanMaster = require('../models/loanMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const LoanTransaction = require('../models/loanTransaction');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const LoanAdvance = require('../models/loanAdvance');
const {
  accessibleUsers,
  asiaKolkataDateTime,
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
} = require('../utils/commonUtilFunctions');

const UserInbox = require('../models/UserInbox');

const { generateExcel } = require('../utils/exportData');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');

exports.postAddLoanMaster = async (req, res, next) => {
  try {
    let LoanID;
    let {
      companyMasterID,
      userMasterID,
      LoanAmount,
      LoanRemark,
      EMIMonths,
      interest,
      startMonth,
      givenDate,
      paymentmode,
      loanstatus,
      rejectionremarks,
      referenceNO,
      referenceDate,
      createBy,
      createByIp,
      updateBy,
      updateByIp
    } = await req.body;

    const totalMonthlyPrinciple = req.body.loanTransaction.reduce((sum, tx) => {
      return sum + Number(tx.monthlyPrinciple || 0); 
    }, 0);


    if(totalMonthlyPrinciple != LoanAmount)
      return res.status(200).json({ status: 404, message: message.usermessage.loanAmountNotMatch });

    await sequelize.transaction(async (t) => {
      loanstatus = 1;
      const loanData = {
        companyMasterID,
        userMasterID,
        LoanAmount,
        LoanRemark,
        EMIMonths,
        interest,
        startMonth,
        givenDate,
        paymentmode,
        referenceNO,
        referenceDate,
        loanstatus,
        rejectionremarks,
      };
      if(req.body.LoanID == undefined)
      {
        let insert_db_status = await LoanMaster.create(
          {
            ...loanData,
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        LoanID = insert_db_status.LoanID;
      } else 
      {
        await LoanMaster.update(
          {
            ...loanData,
            updateBy,
            updateByIp
          },
          {
            where: { LoanID: req.body.LoanID },
            transaction: t,
          }
        );

        LoanID = req.body.LoanID
      }
      
      var efftarray = [];
      for (i = 0; i < req.body.loanTransaction.length; i++) {
        efftarray.push({
          LoanID: LoanID,
          EMIAmount: req.body.loanTransaction[i].instamount,
          EMIMonth: req.body.loanTransaction[i].yearmonth,
          monthlyPrinciple: req.body.loanTransaction[i].monthlyPrinciple,
          monthlyInterest: req.body.loanTransaction[i].monthlyInterest,
          createBy: createBy,
          createByIp: createByIp,
        });
      }

      await LoanTransaction.bulkCreate(efftarray, {
        returning: true,
        transaction: t,
      });

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.LoanMasteradd });
    });
  } catch (err) {
    next(err);
  }
};

exports.postGetLoanMasterbyLoanID = async (req, res, next) => {
  try {
    let get_one_data = await LoanMaster.findOne({
      where: {
        LoanID: req.params.id,
        status: [0, 1],
      },
      order: [['LoanID', 'ASC']],
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
    let get_child = await LoanTransaction.findAll({
      where: {
        LoanID: req.params.id,
        status: [0, 1],
      },
      order: [['LoanTrasactionId', 'ASC']],
    });

    let getAdvance = await LoanAdvance.findAll({
      where: {
        LoanID: req.params.id,
      },
      order: [['LoanAdvanceID', 'ASC']],
    });
    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 404, message: message.usermessage.LoanMasternotFound });
    } else {
      res.status(200).json({
        status: 200,
        data: get_one_data,
        childData: get_child,
        LoanAdvance: getAdvance,
      });
    }
  } catch (err) {
    next(err);
  }
};

/*
 *return loan master and loan transactions by user master id
 */
exports.postGetLoanMasterbyUserMasterID = async (req, res, next) => {
  try {
    let getLoanData = await LoanMaster.findAll({
      where: {
        userMasterID: req.params.id,
      },
      include: {
        model: UserMaster,
        required: true,
        ...accessibleUsers(req.userDetails),
      },
    });
    getLoanData.forEach((element) => {
      let loanTrans = LoanTransaction.findAll({
        where: {
          LoanID: element.LoanID,
        },
      });
      element.loanTransaction = loanTrans;
    });

    return res.status(200).json({ status: 200, data: getLoanData });
  } catch (err) {
    next(err);
  }
};

//**
// Get Loan By CompanyID
// */

exports.getLoanByCompanyid = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      userMasterID,
      companyMasterID,
    } = await req.body;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    if (
      userMasterID === null ||
      userMasterID === undefined ||
      userMasterID === '' ||
      (Array.isArray(userMasterID) && userMasterID.length === 0)
    ) {
    } else condition.userMasterID = userMasterID;

    condition.companyMasterID = companyMasterID;
    condition.status = [0, 1];
    if (startdate && enddate)
      condition.givenDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
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
      ];

    const AllLoan = await LoanMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          as: 'userMaster',
          required: true,
          ...accessibleUsers(req.userDetails),
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
          ],
        },
        {
          model: companyMaster,
          as: 'companyMaster',
        },
      ],
    });

    for (var j = 0; j < AllLoan.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllLoan.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllLoan.rows[j].updateBy },
      });

      if (user1) AllLoan.rows[j].createBy = user1.dataValues.displayName;
      if (user2) AllLoan.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res
      .status(200)
      .json({ status: 200, data: AllLoan.rows, totalcount: AllLoan.count });
  } catch (err) {
    next(err);
  }
};

/*
 * delete loan master by loanID
 */

exports.postDeleteByLoanID = async (req, res, next) => {
  try {
    let { LoanID } = await req.body;

    const totalloaninst = await LoanTransaction.count({
      raw: true,
      where: {
        LoanID: LoanID,
        RefrenceId: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    const totalloanAdvance = await LoanAdvance.count({
      raw: true,
      where: {
        LoanID: LoanID,
      },
    });

    if (totalloaninst != 0) {
      return res.status(200).json({
        status: 401,
        message:
          "You can't delete this loan because it's some of installments are paid !!",
      });
    } else if (totalloanAdvance != 0) {
      return res.status(200).json({
        status: 401,
        message:
          "You can't delete this loan because it's some of installments are paid !!",
      });
    } else {
      sequelize.transaction(async (t) => {
        await LoanMaster.update(
          {
            status: 2,
          },
          {
            where: { LoanID: LoanID },
            transaction: t,
          }
        );

        await LoanTransaction.update(
          {
            status: 2,
          },
          {
            where: { LoanID: LoanID },
            transaction: t,
          }
        );
        await LoanAdvance.update(
          {
            status: 2,
          },
          {
            where: { LoanID: LoanID },
            transaction: t,
          }
        );

        await UserInbox.destroy(
          {
            where: {
              activityTable: LoanMaster.getTableName(),
              activityTablePK: LoanID,
            },
          },
          { transaction: t }
        );
      });
      return res.status(200).json({
        status: 200,
        message: message.usermessage.LoanMasterdatadeleted,
      });
    }
  } catch (err) {
    next(err);
  }
};

/*
 * to update status
 */
exports.postStatusChange = async (req, res, next) => {
  try {
    let = { LoanID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == 1) {
        delete_status = await LoanMaster.update(
          {
            status: 1,
          },
          {
            where: {
              LoanID: LoanID,
              status: {
                [Sequelize.Op.in]: [0, 1],
              },
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await LoanMaster.update(
          {
            status: 0,
          },
          {
            where: {
              LoanID: LoanID,
            },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.LoanMasterdatadeleted,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 400,
          message: message.usermessage.LoanMasternotFound,
          data: {},
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to update data by id
 */

exports.postUpdateLoanMaster = async (req, res, next) => {
  try {
    let = {
      LoanID,
      LoanAmount,
      LoanRemark,
      EMIMonths,
      startMonth,
      loanstatus,
      givenDate,
      paymentmode,
      referenceNO,
      referenceDate,
      updateBy,
      updateByIp,
    } = await req.body;

    let advanceAmount = await LoanAdvance.sum('Amount', {
      where: {
        LoanID: LoanID,
      },
    });

    const totalMonthlyPrinciple = req.body.loanTransaction.reduce((sum, item) => {
      return sum + (item.monthlyPrinciple || 0);
    }, 0);

    advanceAmount = (advanceAmount == null) ? 0 : advanceAmount;
   
    if(LoanAmount != (totalMonthlyPrinciple + advanceAmount))
    {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.loanAmountNotMatch
      });
    }

    await sequelize.transaction(async (t) => {
      let deletechild = await LoanTransaction.destroy({
        where: { LoanID: LoanID },
        transaction: t,
      });

      let change_data_status = await LoanMaster.update(
        {
          LoanAmount,
          LoanRemark,
          EMIMonths,
          startMonth,
          givenDate,
          loanstatus,
          paymentmode,
          referenceNO,
          referenceDate,
          updateBy,
          updateByIp,
        },
        {
          where: { LoanID: LoanID },
          transaction: t,
        }
      );

      var efftarray = [];
      for (var i = 0; i < req.body.loanTransaction.length; i++) {
        efftarray.push({
          LoanID: LoanID,
          RefrenceId: req.body.loanTransaction[i].RefrenceId,
          TableName: req.body.loanTransaction[i].TableName,
          BalAmount: req.body.loanTransaction[i].BalAmount,
          EMIAmount: req.body.loanTransaction[i].instamount,
          EMIMonth: req.body.loanTransaction[i].yearmonth,
          monthlyPrinciple: req.body.loanTransaction[i].monthlyPrinciple,
          monthlyInterest: req.body.loanTransaction[i].monthlyInterest,
          createBy: req.body.updateBy,
          createByIp: req.body.updateByIp,
        });
      }

      await LoanTransaction.bulkCreate(efftarray, {
        returning: true,
        transaction: t,
      });

      await UserInbox.destroy(
        {
          where: {
            activityTable: LoanMaster.getTableName(),
            activityTablePK: LoanID,
          },
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.LoanMasterupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/*
 *to get LoanTransaction by loan id
 */
exports.postReturnLoanTransactionbyLoanID = async (req, res, next) => {
  try {
    let get_one_data = await LoanTransaction.findAll({
      where: {
        LoanID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data)
      res.status(200).json({
        status: 200,
        message: message.usermessage.loantransactionnotfound,
      });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postAddAdvanceLoan = async (req, res, next) => {
  try {
    let = {
      LoanID,
      Amount,
      givenDate,
      paymentmode,
      refrenceNo,
      referenceDate,
      remarks,
      createBy,
      createByIp,
    } = await req.body;
    await sequelize.transaction(async (t) => {
      let insert_db_status = await LoanAdvance.create(
        {
          LoanID,
          Amount,
          givenDate,
          paymentmode,
          refrenceNo,
          referenceDate,
          remarks,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      var change_data_status;
      var element = req.body.loanTransaction;
      for (var i = 0; i < element.length; i++) {
        let = { LoanTrasactionId, EMIAmount, EMIMonth, monthlyPrinciple, monthlyInterest, updateBy, updateByIp } =
          element[i];
        await sequelize.transaction(async (t) => {
          change_data_status = await LoanTransaction.update(
            {
              EMIAmount,
              EMIMonth,
              monthlyPrinciple,
              monthlyInterest,
              updateBy,
              updateByIp,
            },
            {
              where: { LoanTrasactionId: LoanTrasactionId },
              transaction: t,
            }
          );
          console.log('All Data Transction Update', change_data_status);
        });
      }

      res.status(200).json({
        status: 200,
        message: message.usermessage.LoanMasterupdate,
      });
      return change_data_status;
      // let insert_child_status = await LoanTransaction.bulkCreate(efftarray, { returning: true, transaction: t });
      // logger.info(`Loan master data inserted ${JSON.stringify(insert_db_status)}`);
      // res.status(200).json({status: 200, message: message.usermessage.LoanMasteradd})
    });
  } catch (err) {
    next(err);
  }
};

/*
 * Get AdvanceLoan By LoanId
 */
exports.getLoanAdvanceByLoanID = async (req, res, next) => {
  try {
    let getAdvanceData = await LoanAdvance.findAll({
      where: {
        LoanID: req.params.id,
      },
      order: [['LoanAdvanceID', 'ASC']],
    });

    if (!getAdvanceData) {
      res
        .status(200)
        .json({ status: 404, message: message.usermessage.LoanMasternotFound });
    } else {
      res.status(200).json({ status: 200, data: getAdvanceData });
    }
  } catch (err) {
    next(err);
  }
};

exports.getLoanByUserId = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const condition = {};
    condition.userMasterID = userMasterID;
    condition.status = [0, 1];

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          LoanRemark: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          LoanAmount: {
            [Sequelize.Op.eq]: searchQuery,
          },
        },
      ];

    if (startdate && enddate)
      condition.givenDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    const LoanData = await LoanMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['givenDate', 'DESC']],
      include: [
        {
          model: UserMaster,
          as: 'userMaster',
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [{ model: companyMaster }],
        },
      ],
    });

    for (var j = 0; j < LoanData.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: LoanData.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: LoanData.rows[j].updateBy,
        },
      });

      if (user1) {
        LoanData.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        LoanData.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: LoanData.rows, totalcount: LoanData.count });
  } catch (err) {
    next(err);
  }
};

exports.getbyID = async (req, res, next) => {
  try {
    let results;
    results = await sequelize.query(
      `select LT."EMIAmount",LT."status",LT."EMIMonth",LT."LoanID",LT."RefrenceId" from  public."loanTransactions" as LT where LT."LoanID"= ` +
        req.params.id +
        ` order by LT."EMIMonth" asc`,

      { type: Sequelize.SELECT }
    );

    res.status(200).json({ status: 200, data: results[0] });
  } catch (err) {
    next(err);
  }
};

exports.getbyloanID = async (req, res, next) => {
  try {
    let results;
    results = await sequelize.query(
      `select "LoanID", "Amount","givenDate","paymentmode","refrenceNo","refrenceDate","remarks" from public."loanAdvances" where "LoanID"=` +
        req.params.id +
        ``,

      { type: Sequelize.SELECT }
    );

    res.status(200).json({ status: 200, data: results[0] });
  } catch (err) {
    next(err);
  }
};

exports.postloanmasteradd = async (req, res, next) => {
  try {
    let = {
      companyMasterID,
      userMasterID,
      LoanAmount,
      LoanRemark,
      createBy,
      createByIp,
    } = await req.body;
    await sequelize.transaction(async (t) => {
      let insert_db_status = await LoanMaster.create(
        {
          companyMasterID,
          userMasterID,
          LoanAmount,
          LoanRemark,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      const name = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
        },
      });
      await UserInbox.create(
        {
          activityTable: LoanMaster.getTableName(),
          activityTablePK: insert_db_status.toJSON().LoanID,
          message: `${name.displayName} has applied for loan of ${LoanAmount}.`,
          assignedBy: userMasterID,
        },
        { transaction: t }
      );

      res.status(200).json({ status: 200, message: 'data inserted' });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};
//postStatusRequest

exports.postStatusrequest = async (req, res, next) => {
  try {
    let { LoanID, loanstatus, LoanRemark } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      delete_status = await LoanMaster.update(
        {
          loanstatus: loanstatus,
          rejectionremarks: LoanRemark,
        },
        {
          where: {
            LoanID: LoanID,
          },
          transaction: t,
        }
      );

      await UserInbox.destroy(
        {
          where: {
            activityTable: LoanMaster.getTableName(),
            activityTablePK: LoanID,
          },
        },
        { transaction: t }
      );

      return res.status(200).json({ status: 200, message: '', data: {} });
    });
  } catch (err) {
    next(err);
  }
};

exports.loandatashow = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      companyMasterID,
      loanstatus,
      exportData,
      exportFileType,
      startdate,
      searchQuery,
      enddate,
    } = await req.body;
    let offset = (page - 1) * limit;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (loanstatus) condition.loanstatus = loanstatus;

    condition.status = 1;

    if (startdate && enddate) {
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    const userSearchCondition = {};
    if (searchQuery)
      userSearchCondition[Sequelize.Op.or] = [
        { displayName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const loanData = await LoanMaster.findAndCountAll({
      raw: true,
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']],
      where: condition,
      include: [
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
          required: true,
          ...accessibleUsers(req.userDetails, false),
          where: userSearchCondition,
        },
        { model: companyMaster, attributes: ['companyName'] },
      ],
    });

    async function processRow(row) {
      const designation = await employeeDesignation(
        row.userMasterID,
        new Date()
      );
      const department = await employeeDepartment(row.userMasterID, new Date());
      const branch = await employeeBranch(row.userMasterID, new Date());
      return {
        UserName: row['userMaster.displayName'] || '',
        UserNumber: row['userMaster.userNumber'] || '',
        CompanyName: row['companyMaster.companyName'] || '',
        BranchName: branch ? branch['branchMaster.branchName'] : '',
        Designation: designation
          ? designation['designation.designationName']
          : '',
        Department: department ? department['department.departmentName'] : '',
        Status: checkStatus(row.loanstatus),
        LoanAmount: row.LoanAmount || '',
        LoanRemark: row.LoanRemark || '',
        EMIMonths: row.EMIMonths || '',
        StartMonth: row.startMonth || '',
        GivenDate: row.givenDate
          ? new Date(row.givenDate).toISOString().slice(0, 10)
          : '',
      };
    }

    function checkStatus(loanstatus) {
      if (loanstatus == 1) {
        return 'Approved';
      } else if (loanstatus == 2) {
        return 'Rejected';
      } else if (loanstatus == 0) {
        return 'Pending';
      } else {
        return '';
      }
    }

    if (exportData) {
      const updatedDownloadRows = await Promise.all(
        loanData.rows.map(processRow)
      );

      await generateExcel(
        updatedDownloadRows,
        'Company-Loan-Report',
        exportFileType,
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.fetchMessage('Loan'),
      data: loanData.rows,
      totalCount: loanData.count,
    });
  } catch (err) {
    next(err);
  }
};
