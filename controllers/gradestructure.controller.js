/** @format */

const Sequelize = require('sequelize');
const GradeStructure = require('../models/gradeStructure');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const StateMaster = require('../models/statemaster');
const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');
const HRSalaryFieldChild = require('../models/hrSalaryFieldChild');
const { executeQuery } = require('./common.controller');
const HRSalaryFields = require('../models/hrSalaryFields');
const { post } = require('../routes/hrleavesmonthlytrans.router');
const { log } = require('handlebars');
const {
  assignSalaryStructure,
  manualchangeSalaryStructure,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const HRSalaryMasterFields = require('../models/hrSalaryMaster');
const Payheadmaster = require('../models/payhead');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeSkillCategory = require('../models/employeeSkillCategory');
const Contractor = require('../models/contractor');
const { default_payheadMasterIds } = require('../utils/dbUtils');
/**
 * save grade structure data.
 *
 * @body {createBy} createBy user id of user who added the grade structure.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

const getMissingPayheads = (payheadsToCheck, existingPayheads, allPayheads) => {
  const missingPayheads = payheadsToCheck.filter(
    (payheadId) =>
      !existingPayheads.some(
        (existing) => +existing.payheadMasterId === +payheadId
      )
  );

  return (
    missingPayheads.map(
      (missingId) =>
        allPayheads.find((payhead) => +payhead.payheadMasterId === +missingId)
          ?.payheadName || `Unknown Payhead ID ${missingId}`
    ) || []
  );
};

const mergeUniqueSalaryFields = (array1, array2) => {
  const existingIds = new Set(array1.map((item) => item.salaryFieldID)); // Store IDs from first array
  return [
    ...array1,
    ...array2.filter((item) => !existingIds.has(item.salaryFieldID)), // Add only unique items
  ];
};

exports.postAddGradeStructure = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      gradeName,
      gradeFrom,
      gradeTo,
      baseOnCalculation,
      companyMasterID,
      gradeSalayFields,
      isContractorGrade = false,
      contractorId,
      skillCategory,
      applicableYYYYMM,
    } = await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    if (
      isContractorGrade &&
      [...gradeSalayFields].some(
        (num) => [2, 35, 3].includes(num.payheadMasterId) && num.formula
      )
    ) {
      throw new Error(
        'Formula is not allowed for Basic, HRA, and DA in contractor-wise grades.'
      );
    }

    const PFESIC_PayheadData = await Payheadmaster.findAll({
      where: {
        payheadMasterId: {
          [Sequelize.Op.in]: [4, 5, 12, 25, 66, 13, 14],
        },
        status: 1,
      },
      attributes: ['payheadMasterId', 'payheadName'],
      transaction,
    });

    const findhrsalryfield = await HRSalaryFields.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.in]: default_payheadMasterIds,
        },
      },
      transaction,
    });

    // check for pf

    const pfdata = [...gradeSalayFields].filter((e) =>
      [4, 5, 12, 25, 66].includes(e.payheadMasterId)
    );

    if (pfdata.length > 0) {
      const missing_PFBreakup = getMissingPayheads(
        [4, 5, 12, 25, 66],
        gradeSalayFields,
        PFESIC_PayheadData.filter((e) =>
          [4, 5, 12, 25, 66].includes(e.payheadMasterId)
        )
      );

      if (missing_PFBreakup.length) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `Add '${missing_PFBreakup.join(', ')}' to complete PF breakup`,
        });
      }
    }

    // check for esic

    const esicdata = [...gradeSalayFields].filter((e) =>
      [13, 14].includes(e.payheadMasterId)
    );

    if (esicdata.length > 0) {
      const missing_ESICBreakup = getMissingPayheads(
        [13, 14],
        gradeSalayFields,
        PFESIC_PayheadData.filter((e) => [13, 14].includes(e.payheadMasterId))
      );

      if (missing_ESICBreakup.length) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `Add '${missing_ESICBreakup.join(', ')}' to complete ESIC breakup`,
        });
      }
    }

    // add grade

    const insert_db_status = await GradeStructure.create(
      {
        gradeName,
        gradeFrom,
        gradeTo,
        baseOnCalculation,
        companyMasterID,
        isContractorGrade,
        contractorId: isContractorGrade ? contractorId : null,
        skillCategory: isContractorGrade ? skillCategory : null,
        applicableYYYYMM: isContractorGrade ? applicableYYYYMM : null,
        createBy,
        createByIp,
      },
      { transaction }
    );

    const gradeStructureID = insert_db_status.gradeStructureID;

    const arrayData = [...gradeSalayFields].map((e, i) => {
      return {
        gradeStructureID: gradeStructureID,
        salaryFieldID: e.salaryFieldId,
        fieldDefaultPer: null,
        fieldFixAmount: e.fieldFixAmount
          ? e.fieldFixAmount
          : e.fieldFixAmount == 0
            ? 0
            : null,
        formula: e.formula || null,
        formulaID: e.formulaID || null,
        createBy,
        createByIp,
        salaryfieldindex: i + 1,
        salaryfieldmaxrange: e.salaryfieldmaxrange || null,
        fieldFixAmount1: e.fieldFixAmount1
          ? e.fieldFixAmount1
          : e.fieldFixAmount1 == 0
            ? 0
            : null,
        formula1: e.formula1 || null,
        formulaPreference: e.formulaPreference || null,
      };
    });

    const extraFields = [...findhrsalryfield].map((e) => {
      return {
        gradeStructureID: gradeStructureID,
        salaryFieldID: e.salaryFieldID,
        fieldDefaultPer: null,
        fieldFixAmount: null,
        fieldFixAmount1: null,
        formula: null,
        formulaID: null,
        createBy,
        createByIp,
        salaryfieldindex: null,
        salaryfieldmaxrange: null,
        formula1: e.formula1 || null,
        formulaPreference: e.formulaPreference || null,
      };
    });

    const mergedArray = mergeUniqueSalaryFields(extraFields, arrayData);

    // add grade salary structure
    await GradeSalaryStructure.bulkCreate(mergedArray, { transaction });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Salary Grade'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 return all grade structure data
 */

exports.getAllGradeStructureData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let grade_structure = [];
    if (limit == '' && page == '') {
      grade_structure = await GradeStructure.findAll({
        order: [['createdAt', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      grade_structure = await GradeStructure.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['createdAt', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    }

    const totalcount = await GradeStructure.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: grade_structure, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with gradeStructure id
 *
 * @param {id} gradeStructureID  to fetch grade structure
 */

exports.getGradeStructureById = async (req, res, next) => {
  try {
    const get_one_data = await GradeStructure.findOne({
      where: {
        gradeStructureID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          required: false,
          model: GradeSalaryStructure,
          include: [
            {
              model: HRSalaryFields,
              where: {
                payheadMasterId: {
                  [Sequelize.Op.notIn]: default_payheadMasterIds,
                },
              },
              include: [{ model: Payheadmaster, attributes: ['payheadName'] }],
            },
          ],
        },
        {
          model: companyMasters,
          attributes: ['companyName'],
        },
      ],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
    // }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with companyMaster id
 *
 * @param {id} companyMasteID  to fetch grade structure
 */

exports.getGradeStructureByCompanyMasterId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          gradeName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const gradeStructure = await GradeStructure.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
        {
          model: Contractor,
          attributes: ['contractorName'],
        },
      ],
    });

    for (var j = 0; j < gradeStructure.rows.length; j++) {
      let contractor = null;
      if (gradeStructure.rows[j].contractor)
        contractor = gradeStructure.rows[j].contractor.contractorName;

      gradeStructure.rows[j].dataValues.contractorName = contractor;

      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: gradeStructure.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: gradeStructure.rows[j].updateBy,
        },
      });

      if (user1) {
        gradeStructure.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        gradeStructure.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    return res.status(200).json({
      status: 200,
      data: gradeStructure.rows,
      totalcount: gradeStructure.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} gradeStructureID  to update id
 */

exports.postUpdateGradeStructure = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      gradeStructureID,
      gradeName,
      gradeFrom,
      gradeTo,
      baseOnCalculation,
      companyMasterID,
      gradeSalayFields,
      isContractorGrade = false,
      contractorId,
      skillCategory,
      applicableYYYYMM,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    const grade = await GradeStructure.findByPk(gradeStructureID);

    if (!grade) throw new Error('Salary Grade not found!');

    isContractorGrade = grade.isContractorGrade;

    if (
      isContractorGrade &&
      [...gradeSalayFields].some(
        (num) => [2, 35, 3].includes(num.payheadMasterId) && num.formula
      )
    ) {
      throw new Error(
        'Formula is not allowed for Basic, HRA, and DA in contractor-wise grades.'
      );
    }

    const find_data = await executeQuery(
      `select sm.* from "gradeStructures" as gs inner join "gradeSalaryStructures" as gss on gs."gradeStructureID"=gss."gradeStructureID"
        inner join "hrSalaryMasters" as sm on gss."gradeSalaryStructureID"=sm."gradeSalaryStructureID"
        where gs."gradeStructureID"=` +
        gradeStructureID +
        ` limit 1`
    );

    if (find_data.length > 0) {
      return res.status(200).json({
        status: 401,
        message:
          "You have already assign this grade structure to employee . So, you can't update it.",
      });
    }

    const PFESIC_PayheadData = await Payheadmaster.findAll({
      where: {
        payheadMasterId: {
          [Sequelize.Op.in]: [4, 5, 12, 25, 66, 13, 14],
        },
        status: 1,
      },
      attributes: ['payheadMasterId', 'payheadName'],
      transaction,
    });

    const findhrsalryfield = await HRSalaryFields.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        payheadMasterId: {
          [Sequelize.Op.in]: default_payheadMasterIds,
        },
      },
      transaction,
    });

    // check for pf

    const pfdata = [...gradeSalayFields].filter((e) =>
      [4, 5, 12, 25, 66].includes(e.payheadMasterId)
    );

    if (pfdata.length > 0) {
      const missing_PFBreakup = getMissingPayheads(
        [4, 5, 12, 25, 66],
        gradeSalayFields,
        PFESIC_PayheadData.filter((e) =>
          [4, 5, 12, 25, 66].includes(e.payheadMasterId)
        )
      );

      if (missing_PFBreakup.length) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `Add '${missing_PFBreakup.join(', ')}' to complete PF breakup`,
        });
      }
    }

    // check for esic

    const esicdata = [...gradeSalayFields].filter((e) =>
      [13, 14].includes(e.payheadMasterId)
    );

    if (esicdata.length > 0) {
      const missing_ESICBreakup = getMissingPayheads(
        [13, 14],
        gradeSalayFields,
        PFESIC_PayheadData.filter((e) => [13, 14].includes(e.payheadMasterId))
      );

      if (missing_ESICBreakup.length) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: `Add '${missing_ESICBreakup.join(', ')}' to complete ESIC breakup`,
        });
      }
    }

    // delete grade salary structure

    await GradeSalaryStructure.destroy({
      where: { gradeStructureID: gradeStructureID },
      transaction,
    });

    // update grade structure
    grade.gradeName = gradeName;
    grade.gradeFrom = gradeFrom;
    grade.gradeTo = gradeTo;
    grade.baseOnCalculation = baseOnCalculation;
    grade.companyMasterID = companyMasterID;
    grade.updateBy = updateBy;
    grade.updateByIp = updateByIp;

    if (isContractorGrade) {
      grade.contractorId = contractorId;
      grade.skillCategory = skillCategory;
      grade.applicableYYYYMM = applicableYYYYMM;
    }

    await grade.save({ transaction });

    const arrayData = [...gradeSalayFields].map((e, i) => {
      return {
        gradeStructureID: gradeStructureID,
        salaryFieldID: e.salaryFieldId,
        fieldDefaultPer: null,
        fieldFixAmount: e.fieldFixAmount
          ? e.fieldFixAmount
          : e.fieldFixAmount == 0
            ? 0
            : null,
        formula: e.formula || null,
        formulaID: e.formulaID || null,
        createBy: updateBy,
        createByIp: updateByIp,
        salaryfieldindex: e.salaryfieldindex || null,
        salaryfieldmaxrange: e.salaryfieldmaxrange || null,
        fieldFixAmount1: e.fieldFixAmount1
          ? e.fieldFixAmount1
          : e.fieldFixAmount1 == 0
            ? 0
            : null,
        formula1: e.formula1 || null,
        formulaPreference: e.formulaPreference || null,
      };
    });

    const extraFields = [...findhrsalryfield].map((e) => {
      return {
        gradeStructureID: gradeStructureID,
        salaryFieldID: e.salaryFieldID,
        fieldDefaultPer: null,
        fieldFixAmount: null,
        fieldFixAmount1: null,
        formula: null,
        formulaID: null,
        createBy: updateBy,
        createByIp: updateByIp,
        salaryfieldindex: null,
        salaryfieldmaxrange: null,
        formula1: null,
        formulaPreference: null,
      };
    });

    const mergedArray = mergeUniqueSalaryFields(extraFields, arrayData);

    // add grade salary structure
    await GradeSalaryStructure.bulkCreate(mergedArray, { transaction });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Salary Grade'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} gradeStructureID  to update status of grade structure
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { gradeStructureID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await GradeStructure.update(
          {
            status: '1',
          },
          {
            where: { gradeStructureID: gradeStructureID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        // let find_data = await executeQuery(
        //   `
        // select sm.* from "gradeStructures" as gs inner join "gradeSalaryStructures" as gss on gs."gradeStructureID"=gss."gradeStructureID"
        // inner join "hrSalaryMasters" as sm on gss."gradeSalaryStructureID"=sm."gradeSalaryStructureID"
        // where gs."gradeStructureID"=` +
        //     gradeStructureID +
        //     ` limit 1`
        // );

        const find_data = await HRSalaryMasterFields.findOne({
          include: [
            {
              required: true,
              model: GradeSalaryStructure,
              where: {
                gradeStructureID,
              },
            },
            {
              required: true,
              model: UserMaster,
              where: { status: { [Sequelize.Op.in]: [0, 1] } },
            },
          ],
        });

        if (find_data) {
          return res.status(200).json({
            status: 401,
            message:
              "You have already assign this grade structure to employee . So, you can't deactive it.",
          });
        } else {
          delete_status = await GradeStructure.update(
            {
              status: '0',
            },
            {
              where: { gradeStructureID: gradeStructureID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.gradestructuredelete,
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
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} gradeStructureID  to delete id
 */
exports.postDeleteGradeStructureById = async (req, res, next) => {
  try {
    const { gradeStructureID } = await req.body;

    const find_data = await HRSalaryMasterFields.findOne({
      include: [
        {
          required: true,
          model: GradeSalaryStructure,
          where: {
            gradeStructureID,
          },
        },
        {
          required: true,
          model: UserMaster,
          where: { status: { [Sequelize.Op.in]: [0, 1] } },
        },
      ],
    });

    if (find_data) {
      return res.status(200).json({
        status: 401,
        message:
          "You have already assign this grade structure to employee . So, you can't delete it.",
      });
    }

    await GradeStructure.update(
      {
        status: 2,
      },
      {
        where: { gradeStructureID: gradeStructureID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.gradestructuredelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.getGradeStructureByCompanyId = async (req, res, next) => {
  try {
    const get_one_data = await GradeStructure.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
    });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getptvaluebycompanystate = async (req, res, next) => {
  try {
    let get_one_data = await companyMasters.findOne({
      where: {
        companyMasterID: req.body.companyMasterID,
        status: 1,
      },
      include: [{ all: true, nested: true }],
    });

    if (get_one_data) {
      console.log(get_one_data.cityMaster.stateMaster.stateMasterID);

      let get_one_data1 = await ProfessionalTaxSlabMaster.findOne({
        where: {
          stateMasterID: get_one_data.cityMaster.stateMaster.stateMasterID,
          fromAmount: { [Sequelize.Op.lte]: req.body.maxamount },
          toAmount: { [Sequelize.Op.gte]: req.body.maxamount },
          status: 1,
        },
      });

      res.status(200).json({ status: 200, data: get_one_data1 });
    }
  } catch (err) {
    next(err);
  }
};

async function precedence(opr) {
  switch (opr) {
    case '+':
    case '-':
      return 1;
    case '*':
    case '/':
      return 2;
    default:
      return -1;
  }
}

async function isOperator(ch) {
  if (ch == '+' || ch == '-' || ch == '*' || ch == '/') {
    return true;
  } else {
    return false;
  }
}

async function infixtopostfix(
  formula,
  amount,
  gradeid,
  grade_salary_structure_data
) {
  var i,
    str = '';
  var stack = [];
  var postfix = '';
  var top = -1;
  // formula="((basic+100)/(hra*100))/hra";

  for (i = 0; i < formula.length; i++) {
    ch = formula.charAt(i);
    str = '';
    if (
      ch == '(' ||
      ch == ')' ||
      ch == '+' ||
      ch == '-' ||
      ch == '*' ||
      ch == '/'
    ) {
      str = ch;
      if (str == '(') {
        top++;
        stack.push(str);
      } else if (str == ')') {
        console.log('stack11 ' + stack[top] + ' ' + top);
        while (top > -1 && stack[top] != '(') {
          postfix = postfix + stack[top] + ',';
          stack.pop();
          top--;
        }
        stack.pop();
        top--;
      } else {
        var x = await precedence(stack[top]);

        var y = await precedence(str);

        while (top > -1 && x >= y) {
          postfix = postfix + stack[top] + ',';
          top--;
          stack.pop();
          x = await precedence(stack[top]);

          y = await precedence(str);
        }
        top++;
        stack.push(str);
      }
      //console.log("stack "+stack);
    } else {
      for (j = i; j < formula.length; j++, i++) {
        ch = formula.charAt(j);
        if (
          ch == '(' ||
          ch == ')' ||
          ch == '+' ||
          ch == '-' ||
          ch == '*' ||
          ch == '/'
        ) {
          i--;
          break;
        } else {
          str = str + ch;
        }
      }
      postfix = postfix + str + ',';
    }
  }

  while (top > -1) {
    postfix = postfix + stack[top] + ',';
    stack.pop();
    top--;
  }

  console.log(postfix);
  var finalvalue = await formulaCalculation(
    postfix,
    amount,
    gradeid,
    grade_salary_structure_data
  );
  return finalvalue;
}

async function isNumeric(str) {
  if (typeof str != 'string') return false; // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}

async function formulaCalculation(
  postfix,
  amount,
  gradeid,
  grade_salary_structure_data
) {
  var i,
    op1 = '',
    op2 = '',
    op1value = 0,
    op2value = 0;
  var stack = [];
  var top = -1,
    flag;
  var equation = postfix.split(',');

  for (i = 0; i < equation.length - 1; i++) {
    if (
      equation[i] == '+' ||
      equation[i] == '-' ||
      equation[i] == '*' ||
      equation[i] == '/'
    ) {
      op2 = stack[top];
      top--;
      stack.pop();

      op1 = stack[top];
      top--;
      stack.pop();

      flag = 0;
      var t = 0;
      for (var j = 0; j < grade_salary_structure_data.length; j++) {
        if (grade_salary_structure_data[j].payheadname == op1) {
          op1value = grade_salary_structure_data[j].finalvalue;
          flag = 1;
        }
      }

      if (flag == 0) {
        if (await isNumeric(op1)) {
          op1value = op1;
        } else {
          op1value = 0;
        }
      }

      flag = 0;
      for (var j = 0; j < grade_salary_structure_data.length; j++) {
        if (grade_salary_structure_data[j].payheadname == op2) {
          op2value = grade_salary_structure_data[j].finalvalue;
          flag = 1;
        }
      }

      if (flag == 0) {
        if (await isNumeric(op2)) {
          op2value = op2;
        } else {
          op2value = 0;
        }
      }
      if (equation[i] == '+') {
        t = parseFloat(op1value) + parseFloat(op2value);
      } else if (equation[i] == '-') {
        t = parseFloat(op1value) - parseFloat(op2value);
      } else if (equation[i] == '*') {
        t = parseFloat(op1value) * parseFloat(op2value);
      } else if (equation[i] == '/') {
        t = parseFloat(op1value) / parseFloat(op2value);
      }
      top++;
      stack.push(t.toString());
    } else {
      top++;

      stack.push(equation[i]);
    }
  }
  console.log('Stack value ' + stack);
  return stack[top];
}

exports.getctcvalue = async (req, res, next) => {
  try {
    const {
      ctc,
      gradeid,
      stateid,
      AmountIn,
      userMasterID,
      yearMonth,
      corporationId = null,
    } = req.body;

    const grade_salary_structure_data = await GradeSalaryStructure.findAll({
      raw: true,
      where: {
        gradeStructureID: gradeid,
      },
      include: [
        {
          model: HRSalaryFields,
          attributes: [],
          include: [{ model: Payheadmaster, attributes: [] }],
        },
        {
          model: GradeStructure,
          attributes: [],
        },
      ],
      order: [
        [
          { model: HRSalaryFields, as: 'hrSalaryField' },
          'salaryFieldSrNo',
          'ASC',
        ],
        ['salaryfieldindex', 'ASC'],

        // Order by payheadName in Payheadmaster
        [
          { model: HRSalaryFields, as: 'hrSalaryField' },
          { model: Payheadmaster, as: 'Payheadmaster' },
          'payheadName',
          'ASC',
        ],
      ],
      attributes: [
        'gradeSalaryStructureID',
        'gradeStructureID',
        'salaryFieldID',
        'fieldFixAmount',
        'formula',
        'salaryfieldindex',
        'salaryfieldmaxrange',
        'fieldFixAmount1',
        'formula1',
        'formulaPreference',
        [sequelize.col('hrSalaryField.payheadMasterId'), 'payheadMasterId'],
        [sequelize.col('hrSalaryField.salaryFieldSide'), 'salaryFieldSide'],
        [
          sequelize.col('hrSalaryField.salaryFieldAttanChk'),
          'salaryFieldAttanChk',
        ],
        [
          sequelize.col('hrSalaryField.salaryFieldWhenMonth'),
          'salaryFieldWhenMonth',
        ],
        [sequelize.col('hrSalaryField.salaryFieldRound'), 'salaryFieldRound'],
        [
          sequelize.col('hrSalaryField.salaryFieldRoundNo'),
          'salaryFieldRoundNo',
        ],
        [sequelize.col('hrSalaryField.salaryFieldSrNo'), 'salaryFieldSrNo'],
        [sequelize.col('hrSalaryField.companyMasterID'), 'companyMasterID'],
        [
          sequelize.col('hrSalaryField.payheadDisplayName'),
          'payheadDisplayName',
        ],
        [sequelize.col('hrSalaryField.roundOffType'), 'roundOffType'],
        [sequelize.col('hrSalaryField.considerIn'), 'considerIn'],
        [
          sequelize.col('hrSalaryField.Payheadmaster.payheadName'),
          'payheadName',
        ],
        [
          sequelize.col('gradeStructure.baseOnCalculation'),
          'baseOnCalculation',
        ],
      ],
    });

    const userdata = await UserMaster.findOne({
      where: {
        userMasterID,
      },
      include: [
        {
          required: false,
          model: EmployeeSkillCategory,
          where: {
            applicableYYYYMM: {
              [Sequelize.Op.lte]: +yearMonth,
            },
            [Sequelize.Op.or]: [
              {
                endYYYYMM: {
                  [Sequelize.Op.gte]: +yearMonth,
                },
              },
              {
                endYYYYMM: {
                  [Sequelize.Op.is]: null,
                },
              },
            ],
          },
        },
      ],
      attributes: ['userMasterID', 'gender', 'companyMasterId'],
    });

    const gender = userdata ? userdata.gender : '';
    const companyId = userdata?.companyMasterId || null;

    // Find if min wages is used in formula or formula1
    const hasMinimumWages = grade_salary_structure_data.some(
      (item) =>
        (item.formula && item.formula.includes('Minimum Wages')) ||
        (item.formula1 && item.formula1.includes('Minimum Wages'))
    );

    const skillCategory =
      userdata?.employeeSkillCategories?.[0]?.skillCategory || null;

    if (hasMinimumWages && !skillCategory) {
      return res.status(200).json({
        status: 401,
        message: 'Skill category is required for employees with minimum wages.',
      });
    }

    const { salaryStructureData: data, minWagesMasterId } =
      await assignSalaryStructure(
        grade_salary_structure_data,
        ctc,
        stateid,
        AmountIn,
        yearMonth,
        gender,
        corporationId,
        companyId,
        skillCategory,
        0,
        null,
        hasMinimumWages,
        [],
        null
      );

    return res
      .status(200)
      .json({ status: 200, data, skillCategory, minWagesMasterId });
  } catch (err) {
    next(err);
  }
};

exports.getctcvalue1 = async (req, res, next) => {
  try {
    const {
      ctc,
      gradeid,
      stateid,
      AmountIn,
      yearMonth,
      userMasterID,
      corporationId = null,
      payheadMasterId,
      payheadAmount,
      grade_salary_structure,
    } = req.body;

    console.log(req.body, 'body');

    const userdata = await UserMaster.findOne({
      where: {
        userMasterID,
      },
      include: [
        {
          required: false,
          model: EmployeeSkillCategory,
          where: {
            applicableYYYYMM: {
              [Sequelize.Op.gte]: +yearMonth,
            },
            [Sequelize.Op.or]: [
              {
                endYYYYMM: {
                  [Sequelize.Op.lte]: +yearMonth,
                },
              },
              {
                endYYYYMM: {
                  [Sequelize.Op.is]: null,
                },
              },
            ],
          },
        },
      ],
      attributes: ['userMasterID', 'gender', 'companyMasterId'],
    });

    const gender = userdata ? userdata.gender : '';
    const companyId = userdata?.companyMasterId || null;

    // Find if min wages is used in formula or formula1
    const hasMinimumWages = grade_salary_structure.some(
      (item) =>
        (item.formula && item.formula.includes('Minimum Wages')) ||
        (item.formula1 && item.formula1.includes('Minimum Wages'))
    );

    const skillCategory =
      userdata?.employeeSkillCategories?.[0]?.skillCategory || null;

    if (hasMinimumWages && !skillCategory) {
      return res.status(200).json({
        status: 401,
        message: 'Skill category is required for employees with minimum wages.',
      });
    }

     const { salaryStructureData: data, minWagesMasterId } = await assignSalaryStructure(
      grade_salary_structure,
      ctc,
      stateid,
      AmountIn,
      yearMonth,
      gender,
      corporationId,
      companyId,
      skillCategory,
      payheadMasterId,
      payheadAmount,
      hasMinimumWages,
      [],
      null
    );

    res.status(200).json({ status: 200, data, skillCategory ,minWagesMasterId});
  } catch (err) {
    next(err);
  }
};

// exports.toAddGradeFields = async (req, res, next) => {
//   try {
//     const { gradeStructureID } = req.body;

//     const data = await HRSalaryMasterFields.findAll({
//       raw: true,
//       include: [{
//         model: GradeSalaryStructure,
//         where: { gradeStructureID },
//         include: [{ model: HRSalaryFields, where: { status: 1, payheadMasterId: 2 } }]
//       }]
//     });

//     const final = [];

//     const gradeData = await GradeSalaryStructure.findOne({
//       raw: true,
//       where: {
//         gradeStructureID
//       },
//       include: [{
//         model: HRSalaryFields, where: { status: 1, payheadMasterId: 12 }
//       }]
//     });

//     for (const toupdate of data) {

//       // find Basic Data
//       const basic = +toupdate.EmployeeSalaryAmount

//       final.push({
//         userMasterID: toupdate.userMasterID,
//         gradeSalaryStructureID: gradeData.gradeSalaryStructureID,
//         EmployeeSalaryPer: null,
//         salaryFromYYYYMM: toupdate.salaryFromYYYYMM,
//         ptaxinctc: toupdate.ptaxinctc,
//         stateid: toupdate.stateid,
//         AmountIn: toupdate.AmountIn,
//         createBy: toupdate.createBy,
//         createByIp: toupdate.createByIp,
//         EmployeeSalaryAmount: Math.round((basic * 3.67) / 100),
//         ActualEmployeeSalaryAmount: ((basic * 3.67) / 100).toFixed(2)
//       })

//       // await HRSalaryMasterFields.update({
//       //   EmployeeSalaryAmount: Math.round((basicAmount * 8.33) / 100),
//       //   ActualEmployeeSalaryAmount: (basicAmount * 8.33) / 100
//       // }, {
//       //   where: {
//       //     salaryMasterID: toupdate.salaryMasterID
//       //   },
//       //   transaction: t
//       // });

//     }

//     // await sequelize.transaction(async (t) => {

//     //   await HRSalaryMasterFields.bulkCreate(final, { transaction: t });
//     // });

//     return res
//       .status(200)
//       .json({ status: 200, data: final, count: final.length });

//   } catch (error) {
//     next(error);
//   }
// }

exports.getGradeForAssignStructure = async (req, res, next) => {
  try {
    const {
      isAssignStructure = false,
      amount,
      companyMasterID,
      userMasterID,
      YYYYMM,
      assignFrom,
    } = req.body;

    if (!companyMasterID || !userMasterID)
      throw new Error('Company and user are required fields');

    const includeConditions = [
      {
        model: EmployeeJoiningDetails,
        attributes: ['contractorId', 'joiningDate'],
      },
    ];

    const skillCategoryInclude = {
      required: false,
      model: EmployeeSkillCategory,
    };

    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    let month = YYYYMM || String(date).slice(0, 4) + String(date).slice(5, 7);

    if (month) {
      skillCategoryInclude.where = {
        applicableYYYYMM: {
          [Sequelize.Op.lte]: +month,
        },
        [Sequelize.Op.or]: [
          {
            endYYYYMM: {
              [Sequelize.Op.gte]: +month,
            },
          },
          {
            endYYYYMM: {
              [Sequelize.Op.eq]: null,
            },
          },
        ],
      };
    }

    includeConditions.push(skillCategoryInclude);

    const userData = await UserMaster.findOne({
      where: { userMasterID },
      include: includeConditions,
    });

    if (!userData) throw new Error('User not found!');

    const contractorId =
      userData.employeeJoiningDetails?.[0]?.contractorId || null;
    const skillCategory =
      userData.employeeSkillCategories?.[0]?.skillCategory || null;

    const joingdate = userData.employeeJoiningDetails?.[0]?.joiningDate || null;

    const joiningMonth = joingdate
      ? String(joingdate).slice(0, 4) + String(joingdate).slice(5, 7)
      : null;

    month = YYYYMM || joiningMonth;

    const condition = {
      companyMasterID,
      status: [0, 1],
    };

    // if structure is not assigned
    if (!isAssignStructure) {
      condition.isContractorGrade = false;
    }

    if (amount) {
      (condition.gradeFrom = {
        [Sequelize.Op.lte]: +amount,
      }),
        (condition.gradeTo = {
          [Sequelize.Op.gte]: +amount,
        });
    }

    // if only contractor users

    if (!isAssignStructure && contractorId) {
      condition.contractorId = contractorId;
      condition.isContractorGrade = true;

      if (month) {
        condition.applicableYYYYMM = {
          [Sequelize.Op.eq]: Sequelize.literal(`(
                      SELECT MAX("applicableYYYYMM") 
                      FROM "gradeStructures"
                      WHERE "gradeStructures"."contractorId" = ${contractorId} 
                      AND "gradeStructures"."applicableYYYYMM" <= ${month} 
                      and "gradeStructures"."skillCategory" = "gradeStructure"."skillCategory"
                    )`),
        };
      }
      if (skillCategory) {
        condition.skillCategory = skillCategory;
      }
    }

    const grade = await GradeStructure.findAll({
      raw: true,
      where: condition,
      attributes: [
        ['gradeStructureID', 'gsid'],
        ['baseOnCalculation', 'calcon'],
        ['status', 'gstatus'],
        ['gradeName', 'gsname'],
      ],
    });

    return res.status(200).json({
      status: 200,
      data: grade,
    });
  } catch (error) {
    next(error);
  }
};

// exports.addData = async (req, res, next) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { companyMasteID } = req.body;

//     const gradeData = await GradeStructure.findAll({
//       where: {
//         companyMasteID,
//         status: 1,
//         gradeStructureID: {
//           [Sequelize.Op.notIn]: [55, 56]
//         }
//       },
//       // include: [{ model: GradeSalaryStructure }]
//     });

//     for (const grade of gradeData) {
//       const userData = await executeQuery(
//         `
//                 select "userMasterID","salaryFromYYYYMM" from "hrSalaryMasters" as hsm INNER join "gradeSalaryStructures" as gss on hsm."gradeSalaryStructureID" = gss."gradeSalaryStructureID"  where gss."gradeStructureID"=` +
//         grade.gradeStructureID +
//         ` GROUP BY "userMasterID",hsm."salaryFromYYYYMM"`
//       );

//       for (const user of userData) {
//         const salaryData = await HRSalaryMasterFields.findAll({
//           where: {
//             userMasterID: user.userMasterID,
//             salaryFromYYYYMM: user.salaryFromYYYYMM,
//           },
//           include: [
//             {
//               required: true,
//               model: GradeSalaryStructure,
//               include: [
//                 {
//                   model: HRSalaryFields,
//                   where: {
//                     payheadMasterId: { [Sequelize.Op.in]: [4, 5, 12, 25, 66] },
//                   },
//                 },
//               ],
//             },
//           ],
//         });

//         if (!salaryData.length) continue;

//         const pfData = salaryData.find(
//           (e) => e.gradeSalaryStructure.hrSalaryField == 4
//         );
//         const epfData = salaryData.find(
//           (e) => e.gradeSalaryStructure.hrSalaryField == 5
//         );
//         const epsData = salaryData.find(
//           (e) => e.gradeSalaryStructure.hrSalaryField == 12
//         );
//         const admincharges = salaryData.find(
//           (e) => e.gradeSalaryStructure.hrSalaryField == 25
//         );
//         const edli = salaryData.find(
//           (e) => e.gradeSalaryStructure.hrSalaryField == 66
//         );

//         if (!pfData || !epfData || !epsData) continue;
//         // update hrsalary master
//         await HRSalaryMasterFields.update(
//           {
//             EmployeeSalaryAmount:
//               Math.round(+pfData.EmployeeSalaryAmount - +epsData.EmployeeSalaryAmount),
//             ActualEmployeeSalaryAmount:
//               +pfData.EmployeeSalaryAmount - +epsData.EmployeeSalaryAmount,
//           },
//           {
//             where: {
//               salaryMasterID: epfData.salaryMasterID,
//             },
//             transaction
//           }
//         );

//         // update admin charges

//         if (admincharges) {
//           await HRSalaryMasterFields.update(
//             {
//               EmployeeSalaryAmount: Math.round(
//                 +admincharges.ActualEmployeeSalaryAmount
//               ),
//             },
//             {
//               where: {
//                 salaryMasterID: admincharges.salaryMasterID,
//               }, transaction
//             }
//           );
//         }

//         // update edli
//         if (edli) {
//           await HRSalaryMasterFields.update(
//             {
//               EmployeeSalaryAmount: Math.round(
//                 +edli.ActualEmployeeSalaryAmount
//               ),
//             },
//             {
//               where: {
//                 salaryMasterID: edli.salaryMasterID,
//               }, transaction
//             }
//           );
//         }
//       }
//     }
//     await transaction.commit();
//     return res.status(200).json({
//       status: 200,
//       message: 'Data updated successfully!'
//     })
//   } catch (error) {
//     await transaction.rollback();
//     next(error);
//   }
// };
