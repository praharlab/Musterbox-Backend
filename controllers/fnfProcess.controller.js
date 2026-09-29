const sequelize = require('../config/database');
const Sequelize = require('sequelize');
const UserMaster = require('../models/userMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const SalaryPolicy = require('../models/salaryPolicy');
const {
  getDateRangeBySalaryPolicy,
  daysInMonth,
} = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeResignation = require('../models/resignation');
const ResigantionReason = require('../models/resigantionReason');
const AssignAssetToEmployee = require('../models/assignAssetToEmployee');
const assetMaster = require('../models/assetMaster');
const AssetCategory = require('../models/assetCategory');
const advancePayment = require('../models/advancePayment');
const LoanMaster = require('../models/loanMaster');
const LoanTransaction = require('../models/loanTransaction');
const LoanAdvance = require('../models/loanAdvance');
const EmployeePenalty = require('../models/employeePenalty');
const Penalty = require('../models/penalty');
const { employeeRepaymentType } = require('../utils/dbUtils');
const EmployeeRepayment = require('../models/employeeRepayment');
const { usermessage } = require('../response_message/message');

exports.getFNFCount = async (req, res, next) => {
  try {
    const { userMasterID = [], month } = req.body;

    if (!userMasterID.length || !month)
      return res.status(200).json({
        status: 401,
        message: 'Invalid parameters!',
      });

    const year = String(month).slice(0, 4);
    const Month = String(month).slice(4, 6);
    let monday = daysInMonth(Month, year);

    const enddate = year + '-' + Month + '-' + monday;

    const userData = await UserMaster.findAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
      },
      include: [
        {
          required: true,
          model: EmployeeJoiningDetails,
          where: {
            leavingDate: {
              [Sequelize.Op.and]: {
                [Sequelize.Op.ne]: '',
                [Sequelize.Op.not]: null,
              },
            },
          },
        },
        {
          required: false,
          separate: true,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: month,
          },
          limit: 1,
        },
        {
          required: false,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(enddate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(enddate),
                },
              },
              {
                endDate: { [Sequelize.Op.is]: null },
              },
            ],
          },
          attributes: ['salaryPolicyID'],
          include: [{ model: SalaryPolicy, as: 'salaryPolicy' }],
        },
      ],
    });

    let counter = 0;

    for (const data of userData) {
      const empjoining = data.employeeJoiningDetails[0] || null;
      const att_cal = data.hrLeaveMonthlyTrans?.[0] || null;
      const salaryPolicy =
        data.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

      const leavingDate = empjoining?.leavingDate || null;

      if (leavingDate) {
        // if attendance calculation data
        if (att_cal && att_cal.monthstartdate && att_cal.monthenddate) {
          if (
            new Date(leavingDate).getTime() >=
              new Date(att_cal.monthstartdate).getTime() &&
            new Date(leavingDate).getTime() <=
              new Date(att_cal.monthenddate).getTime()
          ) {
            counter++;
            continue;
          }
        }

        const { start_date, end_date } = getDateRangeBySalaryPolicy(
          year,
          Month,
          salaryPolicy
        );

        if (
          new Date(leavingDate).getTime() >= new Date(start_date).getTime() &&
          new Date(leavingDate).getTime() <= new Date(end_date).getTime()
        ) {
          counter++;
          continue;
        }
      }
    }

    return res.status(200).json({
      status: 200,
      count: counter,
    });
  } catch (error) {
    next(error);
  }
};

exports.listFNF = async (req, res, next) => {
  try {
    const { companyId, branchId, month, userMasterID = [] } = req.body;

    if (!companyId || !month)
      return res.status(200).json({
        status: 401,
        message: 'Invalid Parameters!',
      });

    const condition = {
      companyMasterId: companyId,
      status: 1,
    };

    if (userMasterID && userMasterID.length)
      condition['userMasterID'] = {
        [Sequelize.Op.in]: userMasterID,
      };

    const year = String(month).slice(0, 4);
    const Month = String(month).slice(4, 6);
    let monday = daysInMonth(Month, year);

    const enddate = year + '-' + Month + '-' + monday;

    const userData = await UserMaster.findAll({
      where: condition,
      include: [
        {
          required: true,
          model: EmployeeJoiningDetails,
          where: {
            leavingDate: {
              [Sequelize.Op.and]: {
                [Sequelize.Op.ne]: '',
                [Sequelize.Op.not]: null,
              },
            },
          },
        },
        {
          required: false,
          separate: true,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: month,
          },
          limit: 1,
        },
        {
          required: false,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(enddate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(enddate),
                },
              },
              {
                endDate: { [Sequelize.Op.is]: null },
              },
            ],
          },
          attributes: ['salaryPolicyID'],
          include: [{ model: SalaryPolicy, as: 'salaryPolicy' }],
        },
        {
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: enddate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: enddate } },
              { endDate: { [Sequelize.Op.is]: null } },
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
            applicableDate: { [Sequelize.Op.lte]: enddate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: enddate } },
              { endDate: { [Sequelize.Op.is]: null } },
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
            ...(branchId && { branchID: branchId }),
            applicableDate: { [Sequelize.Op.lte]: enddate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: enddate } },
              { endDate: { [Sequelize.Op.is]: null } },
            ],
          },
          required: branchId ? true : false,
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
          model: EmployeeResignation,
          as: 'employee',
          where: {
            authorizationstatus: {
              [Sequelize.Op.notIn]: [4, 5],
            },
          },
        },
      ],
    });

    const finalData = [];

    for (const data of userData) {
      const empjoining = data.employeeJoiningDetails[0] || null;
      const att_cal = data.hrLeaveMonthlyTrans?.[0] || null;
      const salaryPolicy =
        data.employeeSalaryPolicies?.[0]?.salaryPolicy || null;
      const branch =
        data.employeeBranches?.[0]?.branchMaster?.branchName || null;
      const department =
        data.employeeDepartments?.[0]?.department?.departmentName || null;
      const designation =
        data.employeeDesignations?.[0]?.designation?.designationName || null;
      const resignation = data.employee?.[0] || null;

      const obj = {
        userMasterID: data.userMasterID,
        empCode: empjoining?.employeeCode || '',
        displayName: data.displayName,
        userNumber: data.userNumber,
        branch,
        department,
        designation,
        appliedDate: resignation?.appliedDate || '',
        lastworkingdate: resignation?.lastworkingdate || '',
        preferredLWDate: resignation?.preferredLWDate || '',
        relievingDate: resignation?.relievingDate || '',
        leavingDate: empjoining?.leavingDate || '',
        status: data.isFNF ? 'Completed' : 'Pending',
        noticeperiod: resignation?.noticeperiod || '',
        photo: data.photo,
        firstName: data.firstName,
        lastName: data.lastName,
      };

      const leavingDate = empjoining?.leavingDate || null;

      if (leavingDate) {
        // if attendance calculation data
        if (att_cal && att_cal.monthstartdate && att_cal.monthenddate) {
          if (
            new Date(leavingDate).getTime() >=
              new Date(att_cal.monthstartdate).getTime() &&
            new Date(leavingDate).getTime() <=
              new Date(att_cal.monthenddate).getTime()
          ) {
            finalData.push(obj);
            continue;
          }
        }

        const { start_date, end_date } = getDateRangeBySalaryPolicy(
          year,
          Month,
          salaryPolicy
        );

        if (
          new Date(leavingDate).getTime() >= new Date(start_date).getTime() &&
          new Date(leavingDate).getTime() <= new Date(end_date).getTime()
        ) {
          finalData.push(obj);
          continue;
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: finalData,
      totalcount: finalData.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.resignationByUserId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resignationData = await EmployeeResignation.findOne({
      where: {
        userMasterID: id,
        status: 1,
        authorizationstatus: {
          [Sequelize.Op.in]: [0, 1, 2, 3],
        },
      },
      include: [{ model: ResigantionReason }],
    });

    return res.status(200).json({
      status: 200,
      data: resignationData,
    });
  } catch (error) {
    next(error);
  }
};

exports.assetByUserId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await AssignAssetToEmployee.findAll({
      where: {
        userMasterID: id,
        status: 1,
        returnDate: {
          [Sequelize.Op.is]: null,
        },
      },
      include: [
        { model: assetMaster, as: 'assetMaster' },
        { model: AssetCategory, as: 'assetCategory' },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.advanceByUserId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await advancePayment.findAll({
      where: {
        userMasterID: id,
        AdvanceStatus: 1,
        status: 1,
        tablereferenceID: {
          [Sequelize.Op.is]: null,
        },
        advancePaymentID: {
          [Sequelize.Op.notIn]: Sequelize.literal(`(
                        
SELECT DISTINCT "advancePaymentID" FROM "employeeRepayments" WHERE "advancePaymentID" in (SELECT "advancePaymentID" from "advancePayments" where "userMasterID" = ${id} and status=1 and "AdvanceStatus"=1 and "tablereferenceID" is NULL)
                    )`),
        },
      },
      order: [['advanceDate', 'ASC']],
    });

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.loanByUserId = async (req, res, next) => {
  try {
    const { userMasterID, FNFMonth } = req.query;

    const loanData = await LoanMaster.findAll({
      where: {
        userMasterID,
        loanstatus: 1,
        status: 1,
        LoanID: {
          [Sequelize.Op.in]: Sequelize.literal(`(
                        SELECT DISTINCT "LoanID" 
                        FROM "loanTransactions" 
                        WHERE "RefrenceId" IS NULL
                    )`),
        },
      },
      include: [
        {
          required: false,
          model: LoanTransaction,
        },
        {
          required: false,
          model: LoanAdvance,
        },
      ],
    });

    const finalData = [];

    for (const loan of loanData) {
      const transactions = loan.loanTransactions || [];
      const advance = loan.loanAdvances || [];

      const amount = transactions.reduce((acc, obj) => acc + +obj.EMIAmount, 0);

      if (+amount <= 0) continue;
      let first = true;
      const pendingAmount = [...transactions]
        .filter((e) => !e.RefrenceId)
        .reduce((acc, obj) => {
        const interest = first ? +obj.monthlyInterest : 0;
        first = false;
        return acc + (+obj.monthlyPrinciple + interest);
      },0);
      const advanceAmount = [...advance].reduce(
        (acc, obj) => acc + +obj.Amount,
        0
      );
      loan.dataValues.pendingAmount = Math.round(+pendingAmount);

      loan.dataValues.advanceAmount = Math.round(+advanceAmount);

      // check if loan transaction month same

      const check = transactions.filter(
        (e) => !e.RefrenceId && e.EMIMonth != FNFMonth
      );

      let deduct_from_salary_button = false;

      if (check.length) deduct_from_salary_button = true;

      loan.dataValues.deduct_from_salary_button = deduct_from_salary_button;

      finalData.push(loan);
    }

    return res.status(200).json({
      status: 200,
      data: finalData,
    });
  } catch (error) {
    next(error);
  }
};

exports.penaltyByUserId = async (req, res, next) => {
  try {
    const { userMasterID, FNFMonth } = req.query;

    const year = String(FNFMonth).slice(0, 4);
    const Month = String(FNFMonth).slice(4, 6);
    let monday = daysInMonth(Month, year);

    const enddate = year + '-' + Month + '-' + monday;

    const userData = await UserMaster.findOne({
      where: {
        userMasterID,
      },
      include: [
        {
          required: true,
          model: EmployeeJoiningDetails,
          where: {
            leavingDate: {
              [Sequelize.Op.and]: {
                [Sequelize.Op.ne]: '',
                [Sequelize.Op.not]: null,
              },
            },
          },
        },
        {
          required: false,
          separate: true,
          model: HrLeaveMonthlyTrans,
          where: {
            AttnYearMon: FNFMonth,
          },
          limit: 1,
        },
        {
          required: false,
          model: EmployeeSalaryPolicy,
          where: {
            status: 1,
            startDate: {
              [Sequelize.Op.lte]: new Date(enddate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(enddate),
                },
              },
              {
                endDate: { [Sequelize.Op.is]: null },
              },
            ],
          },
          attributes: ['salaryPolicyID'],
          include: [{ model: SalaryPolicy, as: 'salaryPolicy' }],
        },
      ],
    });

    if (!userData) {
      return res.status(200).json({
        status: 401,
        message: 'User not found!',
      });
    }

    let start_date = year + '-' + Month + '-' + '01';
    let end_date = enddate;

    const empjoining = userData.employeeJoiningDetails[0] || null;
    const att_cal = userData.hrLeaveMonthlyTrans?.[0] || null;
    const salaryPolicy =
      userData.employeeSalaryPolicies?.[0]?.salaryPolicy || null;

    const leavingDate = empjoining?.leavingDate || null;

    if (leavingDate) {
      // if attendance calculation data
      if (att_cal && att_cal.monthstartdate && att_cal.monthenddate) {
        (start_date = att_cal.monthstartdate),
          (end_date = att_cal.monthenddate);
      } else {
        const { start_date: start_date_temp, end_date: end_date_temp } =
          getDateRangeBySalaryPolicy(year, Month, salaryPolicy);

        start_date = start_date_temp;
        end_date = end_date_temp;
      }

      if (
        new Date(leavingDate).getTime() >= new Date(start_date).getTime() &&
        new Date(leavingDate).getTime() <= new Date(end_date).getTime()
      ) {
        end_date = leavingDate;
      }
    }

    const employeePenalty = await EmployeePenalty.findAll({
      where: {
        userMasterID,
        status: 1,
        RefrenceId: {
          [Sequelize.Op.is]: null,
        },
        penaltyDate: {
          [Sequelize.Op.between]: [start_date, end_date],
        },
        employeePenaltyID: {
          [Sequelize.Op.notIn]: Sequelize.literal(`(
                        SELECT DISTINCT "employeePenaltyID" FROM "employeeRepayments" WHERE "employeePenaltyID" in (SELECT "employeePenaltyID" from "employeePenalties" as emp LEFT join
                        "penalties" as pe on emp."penaltyID" = pe."penaltyID" where "userMasterID" = ${userMasterID} and emp.status=1 and "RefrenceId" is NULL and pe."deductionFromSalary" = TRUE and emp."penaltyDate" BETWEEN '${start_date}' AND '${end_date}')
                    )`),
        },
      },
      include: [
        { model: Penalty, as: 'penalty', where: { deductionFromSalary: true } },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: employeePenalty,
    });
  } catch (error) {
    next(error);
  }
};

// add advance and Penalty Repayment

exports.addEmp_repayment = async (req, res, next) => {
  try {
    const {
      type,
      date,
      salaryMonth,
      amount,
      paymentMode,
      referenceNO = null,
    } = req.body;
    let { advancePaymentID = null, employeePenaltyID = null } = req.body;

    if (!type || !date || !salaryMonth || !amount || !paymentMode) {
      return res.status(200).json({
        status: 401,
        message: 'Pass valid parameters!',
      });
    }

    if (type == employeeRepaymentType.ADVANCE) employeePenaltyID = null;
    if (type == employeeRepaymentType.PENALTY) advancePaymentID = null;

    if (!employeePenaltyID && !advancePaymentID) {
      return res.status(200).json({
        status: 401,
        message: 'Pass valid parameters!',
      });
    }

    const message = employeePenaltyID
      ? 'Penalty'
      : advancePaymentID
        ? 'Adavance'
        : '';

    const condition = employeePenaltyID
      ? { type: employeeRepaymentType.PENALTY, employeePenaltyID }
      : advancePaymentID
        ? { type: employeeRepaymentType.ADVANCE, advancePaymentID }
        : null;

    if (condition) {
      const check = await EmployeeRepayment.findOne({
        where: condition,
      });

      if (check) {
        return res.status(200).json({
          status: 200,
          message: `A repayment has already been recorded for this ${message}. Duplicate repayments are not allowed. `,
        });
      }
    }

    await EmployeeRepayment.create(
      {
        type,
        date,
        salaryMonth,
        amount,
        paymentMode,
        referenceNO,
        employeePenaltyID,
        advancePaymentID,
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: usermessage.addMessage(`Employee ${message}  Repayment`),
    });
  } catch (error) {
    next(error);
  }
};

// set  same month for all loantransactions
exports.loanTransInFNF = async (req, res, next) => {
  try {
    const { LoanID, month } = req.body;

    if (!LoanID || !month) {
      return res.status(200).json({
        status: 401,
        message: 'Pass valid parameters!',
      });
    }

    const loanMasterIntrestData = await LoanMaster.findByPk(LoanID,  {
      attributes: ['interest'],
    });

    if (loanMasterIntrestData.interest !== undefined && loanMasterIntrestData.interest > 0) {
      const pendingLoan = await LoanTransaction.findAll({
        attributes: ['LoanTrasactionId', 'LoanID', 'EMIAmount', 'EMIMonth', 'monthlyInterest', 'monthlyPrinciple'], 
        where: {
          LoanID,
          RefrenceId: {
            [Sequelize.Op.is]: null,
          },
        },
        order: [['LoanID', 'DESC']],
      });

      const updates = pendingLoan.slice(1).map((loan) =>
        LoanTransaction.update(
          {
            EMIAmount: loan.monthlyPrinciple,
            monthlyInterest: 0,
          },
          {
            where: {
              LoanTrasactionId: loan.LoanTrasactionId,
            },
          }
        )
      );

      await Promise.all(updates); 
    }

    // update all Loan Transaction
    await LoanTransaction.update(
      {
        EMIMonth: month,
      },
      {
        where: {
          LoanID,
          RefrenceId: {
            [Sequelize.Op.is]: null,
          },
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message: usermessage.updateMessage(`Loan Payment`),
    });
  } catch (error) {
    next(error);
  }
};
