/** @format */

const Sequelize = require('sequelize');
const HRSalaryMaster = require('../models/hrSalaryMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const { readableHighWaterMark } = require('../config/logger');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const IncrementAuthorizationRequest = require('../models/incrementAuthorization');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const { executeQuery } = require('./common.controller');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');

const {
  month_dict,
  getUserSalaryMasterByMonth,
} = require('../utils/commonUtilFunctions');
const GradeStructure = require('../models/gradeStructure');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
const {
  generateExcel,
  generateExcelforSalaryStructure,
} = require('../utils/exportData');
const { rest } = require('lodash');

/**
 * save hr salary Master data.
 *
 * @body {createBy} createBy user id of user who added the hr salary Masterfield.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddHRSalaryMaster = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) throw new Error('Pass valid parameter');

    const find_salary = await HRSalaryTrasaction.findOne({
      where: {
        userMasterID: +req.body[0].userMasterID,
      },
      order: [['salaryYYYYMM', 'DESC']],
    });

    const find_structure = await HRSalaryMaster.count({
      where: {
        userMasterID: +req.body[0].userMasterID,
        salaryFromYYYYMM: +req.body[0].salaryFromYYYYMM,
      },
    });

    if (find_structure) {
      return res.status(200).json({
        status: 401,
        message: 'Salary Structure already assigned for this month.',
      });
    }

    if (find_salary) {
      if (+find_salary.salaryYYYYMM >= +req.body[0].salaryFromYYYYMM) {
        return res.status(200).json({
          status: 401,
          message: 'Salary already Calculated for this month',
        });
      }
    }

    await HRSalaryMaster.bulkCreate(req.body);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.salaryMasterAdd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return getAllSalaryMaster Data
 */

exports.getAllHRSalaryMaster = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let hr_salary_master = [];
    if (limit == '' && page == '') {
      hr_salary_master = await HRSalaryMaster.findAll({
        include: [{ all: true, nested: true }],
        order: [['createdAt', 'ASC']],
        where: {
          status: [0, 1],
        },
      });
    } else {
      hr_salary_master = await HRSalaryMaster.findAll({
        include: [{ all: true, nested: true }],
        where: {
          status: [0, 1],
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
      });
    }

    const totalcount = await HRSalaryMaster.count({
      raw: true,
      where: { status: ['0', '1'] },
    });
    res
      .status(200)
      .json({ status: 200, data: hr_salary_master, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with bankMaster id
 *
 * @param {id} salaryMaster By UserId  to fetch bank name
 */

exports.getSalayMasterByUser = async (req, res, next) => {
  try {
    const currentMonth =
      new Date().toISOString().slice(0, 4) +
      new Date().toISOString().slice(5, 7);

    const finalData = await getUserSalaryMasterByMonth(
      req.params.id,
      currentMonth
    );

    for (var i = 0; i < finalData.length; i++) {
      let yearly_finalvalue = 0;
      if (finalData[i].salaryFieldWhenMonth[0] != 0) {
        let length = finalData[i].salaryFieldWhenMonth.length;
        yearly_finalvalue =
          Number(finalData[i].EmployeeSalaryAmount) * Number(length);
        finalData[i].yearly_finalvalue = yearly_finalvalue;
      } else {
        yearly_finalvalue = Number(finalData[i].EmployeeSalaryAmount) * 12;
        finalData[i].yearly_finalvalue = yearly_finalvalue;
      }
      finalData[i].finalvalue = finalData[i].EmployeeSalaryAmount;
    }

    return res.status(200).json({ status: 200, data: finalData });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} salaryMaster  to update id
 */
exports.postUpdateHRSalaryMaster = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      gradeSalaryStructureID,
      EmployeeSalaryPer,
      EmployeeSalaryAmount,
      updateBy,
      updateByIp,
    } = await req.body;
    let year = new Date().getFullYear();
    year = year + '' + new Date().getMonth() + 1;
    await sequelize.transaction(async (t) => {
      let deletechild = await HRSalaryMaster.destroy({
        where: { userMasterID: userMasterID },
        transaction: t,
      });

      let insert_db_status = await HRSalaryMaster.create(
        {
          userMasterID,
          gradeSalaryStructureID,
          EmployeeSalaryPer,
          EmployeeSalaryAmount,
          year,
          updateBy,
          updateByIp,
        },
        { transaction: t }
      );
      let salaryMasterID = insert_db_status.salaryMasterID;

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.salaryMasterUpdate });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.postAddIncrement = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      incrementGrossAmount,
      incrementGrossPercentage,
      incrementStartYearMonth,
      childrenstructure,
      salarystructure,
      createBy,
      createByIp,
    } = await req.body;

    let authorizationmaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterName: 'Increment' },
    });
    let authorizationdetails;
    if (authorizationmaster) {
      authorizationdetails = await AuthorizationDetails.findOne({
        where: {
          AuthorizationMasterID: authorizationmaster.authorizationMasterID,
          userMasterID: userMasterID,
          status: 1,
        },
        raw: true,
      });
    }
    if (authorizationdetails) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await UserExpense.create(
            {
              visitID,
              userMasterID,
              ToursMasterID,
              expense_date,
              expenseCategoryId,
              expenseTransaction,
              authorizationStatus: 2,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          expenseTransaction.forEach(async (option) => {
            (option['userExpenseID'] = insert_db_status.userExpenseID),
              (option['authorizationStatus'] = 2);
          });
          let insert_options = await UserExpenseTransactionModel.bulkCreate(
            expenseTransaction,
            { returning: true, transaction: t }
          ).then(async (response) => {
            for (var i = 0; i < response.length; i++) {
              let insert_db_status1 =
                await IncrementAuthorizationRequest.create(
                  {
                    ReferenceID: response[i].userExpenseTransactionID,
                    userMasterID:
                      authorizationdetails.AuthorizedByUserMasterId[0],
                    status: 1,
                    authstatus: 2,
                    createBy,
                    createByIp,
                  },
                  { transaction: t }
                );
            }
          });

          res.status(200).json({
            status: 200,
            message: message.usermessage.expenseadd,
            data: {},
          });
          return insert_db_status;
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await UserExpense.create(
            {
              visitID,
              userMasterID,
              ToursMasterID,
              expense_date,
              expenseCategoryId,
              expenseTransaction,
              authorizationStatus: 1,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          expenseTransaction.forEach(async (option) => {
            (option['userExpenseID'] = insert_db_status.userExpenseID),
              (option['authorizationStatus'] = 1);
          });
          let insert_options = await UserExpenseTransactionModel.bulkCreate(
            expenseTransaction,
            { returning: true, transaction: t }
          ).then(async (response) => {
            for (var j = 0; j < response.length; j++) {
              for (
                var i = 0;
                i < authorizationdetails.AuthorizedByUserMasterId.length;
                i++
              ) {
                let insert_db_status1 =
                  await IncrementAuthorizationRequest.create(
                    {
                      ReferenceID: response[j].userExpenseTransactionID,
                      userMasterID:
                        authorizationdetails.AuthorizedByUserMasterId[i],
                      status: 1,
                      authstatus: 2,
                      createBy,
                      createByIp,
                    },
                    { transaction: t }
                  );
              }
            }
          });

          res.status(200).json({
            status: 200,
            message: message.usermessage.expenseadd,
            data: {},
          });
          return insert_db_status;
        });
      }
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await salaryIncrement.create(
          {
            visitID,
            userMasterID,
            ToursMasterID,
            expense_date,
            expenseCategoryId,
            expenseTransaction,
            authorizationStatus: 0,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
        expenseTransaction.forEach(async (option) => {
          (option['userExpenseID'] = insert_db_status.userExpenseID),
            (option['authorizationStatus'] = 0);
        });
        let insert_options = await UserExpenseTransactionModel.bulkCreate(
          expenseTransaction,
          { returning: true, transaction: t }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.expenseadd,
          data: {},
        });
        return insert_db_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.removeStructrureByid = async (req, res, next) => {
  try {
    let removeStructure;

    const finddata = await HRSalaryTrasaction.count({
      where: {
        salaryMasterID: {
          [Sequelize.Op.in]: req.body.salaryMasterIDs,
        },
        userMasterID: req.body.userMasterID,
      },
    });

    if (+finddata > 0) {
      removeStructure = 'N';
    } else {
      removeStructure = 'Y';
    }

    res.status(200).json({
      status: 200,
      data: removeStructure,
      message: 'Data get successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteSalaryMaster = async (req, res, next) => {
  try {
    if (req.body.salaryMasterIDs.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'Salary Master not found!',
      });

    const hrSalaryData = await HRSalaryMaster.findAll({
      raw: true,
      where: {
        salaryFromYYYYMM: {
          [Sequelize.Op.eq]: Sequelize.literal(`(
              SELECT "salaryFromYYYYMM" FROM "hrSalaryMasters" 
              WHERE "salaryMasterID" = ${req.body.salaryMasterIDs[0]} 
              LIMIT 1
            )`),
        },
        userMasterID: req.body.userMasterID,
      },
    });

    if (hrSalaryData.length === 0)
      return res.status(200).json({
        status: 401,
        message: 'Salary Master not found!',
      });

    const salary = await HRSalaryTrasaction.findAll({
      where: {
        salaryMasterID: hrSalaryData.map((e) => e.salaryMasterID),
      },
    });

    if (salary.length)
      return res.status(200).json({
        status: 401,
        message: 'Salary already calculated for this salary structure!',
      });

    await sequelize.transaction(async (t) => {
      await HRSalaryMaster.destroy(
        {
          where: {
            salaryFromYYYYMM: hrSalaryData[0].salaryFromYYYYMM,
            userMasterID: req.body.userMasterID,
            status: 1,
          },
        },
        { transaction: t }
      );
    });

    return res.status(200).json({
      status: 200,
      message: 'Salary structure deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllSalaryStructureByUserId = async (req, res, next) => {
  try {
    const { userMasterID, exportData } = req.query;

    const salaryMasterdata = await HRSalaryMaster.findAll({
      raw: true,
      where: {
        userMasterID: userMasterID,
        '$gradeSalaryStructure.hrSalaryField.payheadMasterId$': {
          [Sequelize.Op.notIn]: [
            16, 17, 9, 24, 34, 43, 78, 83, 96, 97, 99, 67, 101,
          ],
        },
      },
      include: [
        {
          model: GradeSalaryStructure,
          include: [
            { model: GradeStructure, attributes: [] },
            {
              model: HRSalaryFields,
              include: [
                {
                  model: Payheadmaster,
                  attributes: [],
                },
              ],
              attributes: [],
            },
          ],
          attributes: [],
          order: [
            ['salaryfieldindex', 'ASC'],
            [
              { model: HRSalaryFields, model: Payheadmaster },
              'payheadName',
              'ASC',
            ],
          ],
        },
      ],
      attributes: [
        'salaryMasterID',
        [
          Sequelize.col(
            'gradeSalaryStructure.hrSalaryField.Payheadmaster.payheadName'
          ),
          'payheadName',
        ],
        [
          Sequelize.col('gradeSalaryStructure.hrSalaryField.payheadMasterId'),
          'payheadMasterId',
        ],
        [
          Sequelize.col(
            'gradeSalaryStructure.hrSalaryField.payheadDisplayName'
          ),
          'payheadDisplayName',
        ],
        'EmployeeSalaryAmount',
        'salaryFromYYYYMM',
        [
          Sequelize.col(
            'gradeSalaryStructure.gradeStructure.baseOnCalculation'
          ),
          'baseOnCalculation',
        ],
          [
          Sequelize.col(
            'gradeSalaryStructure.gradeStructure.gradeName'
          ),
          'gradeName',
        ],
        [Sequelize.col('gradeSalaryStructure.formula'), 'formula'],
        [Sequelize.col('gradeSalaryStructure.formula1'), 'formula1'],
        [
          Sequelize.col('gradeSalaryStructure.formulaPreference'),
          'formulaPreference',
        ],
        [
          Sequelize.col('gradeSalaryStructure.hrSalaryField.salaryFieldSrNo'),
          'salaryFieldSrNo',
        ],
        [
          Sequelize.col('gradeSalaryStructure.hrSalaryField.considerIn'),
          'considerIn',
        ],
      ],
    });

    const groupedData = {};

    salaryMasterdata.forEach((item) => {
      const year = item.salaryFromYYYYMM.toString().slice(0, 4); // Extract the year part
      const month1 = item.salaryFromYYYYMM.toString().slice(4);
      const month = item.salaryFromYYYYMM.toString();

      item.yearmonth = `${month_dict[month1]}-${year}`;
      

      if (!groupedData[month]) {
        groupedData[month] = {
          A: [],
          gross: [], // Gross
          B: [], // Employee Deduction
          AB: [],
          netPay: [], // add In Net Pay
          C: [],
          ctc: [], // Employer Deduction
          // items: [],
        };
      }

      // groupedData[month].items.push(item);

      if (![1, 50, 92].includes(item.payheadMasterId)) {
        if (item.salaryFieldSrNo === 'A' && item.considerIn != 'net') {
          groupedData[month].A.push(item);
        } else if (item.salaryFieldSrNo === 'B') {
          groupedData[month].B.push(item);
        } else if (item.salaryFieldSrNo === 'A' && item.considerIn == 'net') {
          groupedData[month].AB.push(item);
        } else if (item.salaryFieldSrNo === 'C') {
          groupedData[month].C.push(item);
        }
      }

      if (item.payheadMasterId == 1) {
        groupedData[month].ctc.push({
          ...item,
          salaryFieldSrNo: '',
          considerIn: '',
        });
      }

      if (item.payheadMasterId == 50) {
        groupedData[month].gross.push({
          ...item,
          salaryFieldSrNo: '',
          considerIn: '',
        });
      }

      if (item.payheadMasterId == 92) {
        groupedData[month].netPay.push({
          ...item,
          salaryFieldSrNo: '',
          considerIn: '',
        });
      }
    });

    // Sort the grouped data by year and month
    const sortedKeys = Object.keys(groupedData).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // Create the result array with the sums and categories
    const result = sortedKeys.map((key) => {
      const group = groupedData[key];
      const { A, gross, B, AB, netPay, C, ctc } = group;

      return [...A, ...gross, ...B, ...AB, ...netPay, ...C, ...ctc];
    });

    if (exportData) {
      const sheetNames = result.map((monthData) => monthData[0].yearmonth + ' ' + `(${monthData[0].gradeName})`);

      const finalData = result.map((monthData) => {
        const filteredData = monthData
          .filter((item) => item.payheadName !== null)
          .map((e) => {
            const { payheadMasterId, ...rest } = e;

            return {
              ...rest,
              payheadName:
                e.payheadDisplayName && e.payheadDisplayName.trim()
                  ? e.payheadDisplayName
                  : e.payheadName,
            };
          });

        const additionalInfo = filteredData[0];

        const payheadObjects = filteredData.map(
          (e) => {
            return {
              payheadName: e.payheadName,
              EmployeeSalaryAmount: e.EmployeeSalaryAmount,
              formula:
                e.formula && e.formula1
                  ? `${e.formulaPreference} of ${e.formula} OR ${e.formula1}`
                  : e.formula || e.formula1,
              salaryFieldSrNo: e.salaryFieldSrNo,
              considerIn: e.considerIn,
            };
          }
        );
        return [
          [
            {
              salaryFromYYYYMM: additionalInfo.salaryFromYYYYMM,
              baseOnCalculation: additionalInfo.baseOnCalculation,
            },
          ],
          payheadObjects,
        ];
      });

      await generateExcelforSalaryStructure(
        finalData,
        'Salary-Structures',
        'xlsx',
        res,
        sheetNames
      );
    } else {
      const currentMonth =
        new Date().toISOString().slice(0, 4) +
        new Date().toISOString().slice(5, 7);

      const gradestructure = await executeQuery(
        `
            select gss."gradeStructureID", MAX(hsm."salaryFromYYYYMM") from "hrSalaryMasters" as hsm left OUTER join "gradeSalaryStructures" as gss on hsm."gradeSalaryStructureID" = gss."gradeSalaryStructureID" where hsm."userMasterID"=` +
          userMasterID +
          ` and hsm."salaryFromYYYYMM" <=` +
          currentMonth +
          ` GROUP BY gss."gradeStructureID",hsm."salaryFromYYYYMM" ORDER by hsm."salaryFromYYYYMM" DESC limit 1 
             `
      );

      const salaryData = await HRSalaryTrasaction.findAll({
        where: {
          salaryMasterID: salaryMasterdata.map((e) => e.salaryMasterID),
        },
      });

      const finaldata = result.map((e) => {
        if (e[0].baseOnCalculation == 'M') {
          e.map((s) => {
            if (
              gradestructure.length > 0 &&
              gradestructure[0].max == e[0].salaryFromYYYYMM
            )
              s.current = true;
            else s.current = false;

            const findCalculatedsalary = salaryData.find(
              (sa) => sa.salaryMasterID == s.salaryMasterID
            );
            if (findCalculatedsalary) s.salaryCalculated = true;
            else s.salaryCalculated = false;

            s.yearlyAmount = +s.EmployeeSalaryAmount * 12;
            s.payheadName =
              s.payheadDisplayName && s.payheadDisplayName.trim()
                ? s.payheadDisplayName
                : s.payheadName;
          });
        } else
          e.map((s) => {
            if (
              gradestructure.length > 0 &&
              gradestructure[0].max == e[0].salaryFromYYYYMM
            )
              s.current = true;
            else s.current = false;

            const findCalculatedsalary = salaryData.find(
              (sa) => sa.salaryMasterID == s.salaryMasterID
            );
            if (findCalculatedsalary) s.salaryCalculated = true;
            else s.salaryCalculated = false;

            s.yearlyAmount = '';
            s.payheadName =
              s.payheadDisplayName && s.payheadDisplayName.trim()
                ? s.payheadDisplayName
                : s.payheadName;
          });
        return e;
      });

      res.status(200).json({
        status: 200,
        message: 'data get successfully!',
        data: finaldata,
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.getOldNewSalaryStructure = async (req, res, next) => {
  try {
    const { userMasterID } = req.body;

    const SalaryStructureshow = await HRSalaryMaster.findAll({
      where: { userMasterID },
      group: ['userMasterID', 'salaryFromYYYYMM'],
      attributes: ['userMasterID', 'salaryFromYYYYMM'],
    });

    const finalData = SalaryStructureshow.map((e) => {
      return {
        userMasterID: e.userMasterID,
        month:
          month_dict[String(e.salaryFromYYYYMM).slice(4, 6)] +
          '-' +
          String(e.salaryFromYYYYMM).slice(0, 4),
        salaryFromYYYYMM: e.salaryFromYYYYMM,
      };
    });

    return res.status(200).json({
      status: 200,
      message: 'Data Get Successfully!',
      data: finalData,
    });
  } catch (err) {
    next(err);
  }
};
