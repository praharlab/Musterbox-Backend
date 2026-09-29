const salaryIncrement = require('../models/salaryIncrement');
const salaryIncrementChild = require('../models/salaryIncrementChild');
const UserMaster = require('../models/userMaster');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const IncrementAuthorizationRequest = require('../models/incrementAuthorization');
const HRSalaryMaster = require('../models/hrSalaryMaster');
const message = require('../response_message/message');
const logger = require('../config/logger');
const Sequelize = require('sequelize');

const sequelize = require('../config/database');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');

const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');
const { executeQuery } = require('./common.controller');
const GradeStructure = require('../models/gradeStructure');
const {
  assignSalaryStructure,
  manualchangeSalaryStructure,
} = require('../utils/commonUtilFunctions');

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

    let salaryIncrements = await salaryIncrement.findOne({
      where: {
        userMasterID: userMasterID,
        incrementStartYearMonth: incrementStartYearMonth,
      },
    });

    if (salaryIncrements) {
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
            AuthorizationCriteriaID:
              authorizationdetails.AuthorizationCriteriaID,
            status: 1,
          },
          raw: true,
        });

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await salaryIncrement.create(
              {
                userMasterID,
                incrementGrossPercentage,
                incrementGrossAmount,
                incrementStartYearMonth,
                authorizationStatus: 2,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
            childrenstructure.forEach(async (option) => {
              option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
            });

            let insert_options = await salaryIncrementChild
              .bulkCreate(childrenstructure, {
                returning: true,
                transaction: t,
              })
              .then(async (response) => {});
            let insert_db_status1 = await IncrementAuthorizationRequest.create(
              {
                ReferenceID: insert_db_status.salaryIncrementID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
                status: 1,
                authstatus: 2,
                createBy,
                createByIp,
              },
              { transaction: t }
            );

            let deletestatus2 = await IncrementAuthorizationRequest.destroy({
              where: { ReferenceID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            let deletestatus1 = await salaryIncrementChild.destroy({
              where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            let deletestatus = await salaryIncrement.destroy({
              where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            res.status(200).json({
              status: 200,
              message: message.usermessage.incrementadd,
              data: {},
            });
            return insert_db_status;
          });
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await salaryIncrement.create(
              {
                userMasterID,
                incrementGrossPercentage,
                incrementGrossAmount,
                incrementStartYearMonth,
                authorizationStatus: 1,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
            childrenstructure.forEach(async (option) => {
              option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
            });
            let insert_options = await salaryIncrementChild
              .bulkCreate(childrenstructure, {
                returning: true,
                transaction: t,
              })
              .then(async (response) => {});

            for (
              var i = 0;
              i < authorizationdetails.AuthorizedByUserMasterId.length;
              i++
            ) {
              let insert_db_status1 =
                await IncrementAuthorizationRequest.create(
                  {
                    ReferenceID: insert_db_status.salaryIncrementID,
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

            let deletestatus2 = await IncrementAuthorizationRequest.destroy({
              where: { ReferenceID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            let deletestatus1 = await salaryIncrementChild.destroy({
              where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            let deletestatus = await salaryIncrement.destroy({
              where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
              transaction: t,
            });

            res.status(200).json({
              status: 200,
              message: message.usermessage.incrementadd,
              data: {},
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await salaryIncrement.create(
            {
              userMasterID,
              incrementGrossPercentage,
              incrementGrossAmount,
              incrementStartYearMonth,
              authorizationStatus: 0,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          childrenstructure.forEach(async (option) => {
            option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
          });
          let insert_options = await salaryIncrementChild.bulkCreate(
            childrenstructure,
            { returning: true, transaction: t }
          );

          let insert_option = await HRSalaryMaster.bulkCreate(salarystructure, {
            returning: true,
            transaction: t,
          });

          let deletestatus2 = await IncrementAuthorizationRequest.destroy({
            where: { ReferenceID: salaryIncrements.salaryIncrementID },
            transaction: t,
          });

          let deletestatus1 = await salaryIncrementChild.destroy({
            where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
            transaction: t,
          });

          let deletestatus = await salaryIncrement.destroy({
            where: { salaryIncrementID: salaryIncrements.salaryIncrementID },
            transaction: t,
          });

          let deletestatus3 = await HRSalaryMaster.destroy({
            where: {
              salaryFromYYYYMM: incrementStartYearMonth,
              userMasterID: userMasterID,
            },
            transaction: t,
          });

          res.status(200).json({
            status: 200,
            message: message.usermessage.incrementadd,
            data: {},
          });
          return insert_db_status;
        });
      }
    } else {
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
            AuthorizationCriteriaID:
              authorizationdetails.AuthorizationCriteriaID,
            status: 1,
          },
          raw: true,
        });

        if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await salaryIncrement.create(
              {
                userMasterID,
                incrementGrossPercentage,
                incrementGrossAmount,
                incrementStartYearMonth,
                authorizationStatus: 2,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
            childrenstructure.forEach(async (option) => {
              option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
            });
            let insert_options = await salaryIncrementChild
              .bulkCreate(childrenstructure, {
                returning: true,
                transaction: t,
              })
              .then(async (response) => {});
            let insert_db_status1 = await IncrementAuthorizationRequest.create(
              {
                ReferenceID: insert_db_status.salaryIncrementID,
                userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
                status: 1,
                authstatus: 2,
                createBy,
                createByIp,
              },
              { transaction: t }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.incrementadd,
              data: {},
            });
            return insert_db_status;
          });
        } else {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await salaryIncrement.create(
              {
                userMasterID,
                incrementGrossPercentage,
                incrementGrossAmount,
                incrementStartYearMonth,
                authorizationStatus: 1,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
            childrenstructure.forEach(async (option) => {
              option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
            });
            let insert_options = await salaryIncrementChild
              .bulkCreate(childrenstructure, {
                returning: true,
                transaction: t,
              })
              .then(async (response) => {});

            for (
              var i = 0;
              i < authorizationdetails.AuthorizedByUserMasterId.length;
              i++
            ) {
              let insert_db_status1 =
                await IncrementAuthorizationRequest.create(
                  {
                    ReferenceID: insert_db_status.salaryIncrementID,
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

            res.status(200).json({
              status: 200,
              message: message.usermessage.incrementadd,
              data: {},
            });
            return insert_db_status;
          });
        }
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await salaryIncrement.create(
            {
              userMasterID,
              incrementGrossPercentage,
              incrementGrossAmount,
              incrementStartYearMonth,
              authorizationStatus: 0,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          childrenstructure.forEach(async (option) => {
            option['salaryIncrementID'] = insert_db_status.salaryIncrementID;
          });
          let insert_options = await salaryIncrementChild.bulkCreate(
            childrenstructure,
            { returning: true, transaction: t }
          );

          let insert_option = await HRSalaryMaster.bulkCreate(salarystructure, {
            returning: true,
            transaction: t,
          });

          res.status(200).json({
            status: 200,
            message: message.usermessage.incrementadd,
            data: {},
          });
          return insert_db_status;
        });
      }
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.checkdata = async (req, res, next) => {
  try {
    let company_contact = await UserMaster.findAll({
      where: {
        companyMasterId: req.body.company,
        status: 1,
      },
    });
    let maindata = [];
    for (var i = 0; i < company_contact.length; i++) {
      let salaryIncrements = await salaryIncrement.findOne({
        where: {
          userMasterID: company_contact[i].userMasterID,
          incrementStartYearMonth: req.body.YearMM,
        },
      });
      if (salaryIncrements) {
        maindata.push({
          userMasterID: company_contact[i].userMasterID,
          name: company_contact[i].displayName,
          incrementGrossPercentage: salaryIncrements.incrementGrossPercentage,
          incrementGrossAmount: salaryIncrements.incrementGrossAmount,
          increment: 'Yes',
        });
      } else {
        maindata.push({
          userMasterID: company_contact[i].userMasterID,
          name: company_contact[i].displayName,
          incrementGrossPercentage: '',
          incrementGrossAmount: '',
          increment: 'No',
        });
      }
    }

    res.status(200).json({
      status: 200,
      data: maindata,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getdata = async (req, res, next) => {
  try {
    let salaryIncrements = await salaryIncrement.findOne({
      where: {
        userMasterID: req.body.userMasterID,
        incrementStartYearMonth: req.body.YearMM,
      },
    });

    let salaryIncrementchild = await salaryIncrementChild.findOne({
      where: {
        salaryIncrementID: salaryIncrements.salaryIncrementID,
      },
    });
    let grade = await GradeSalaryStructure.findOne({
      where: {
        gradeSalaryStructureID: salaryIncrementchild.gradeSalaryStructureID,
      },
    });

    let maindata = {
      gradeID: grade.gradeStructureID,
      amount: salaryIncrements.incrementGrossAmount,
      percentage: salaryIncrements.incrementGrossPercentage,
    };

    res.status(200).json({
      status: 200,
      data: maindata,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
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

  return stack[top];
}

exports.calculateincrement = async (req, res, next) => {
  try {
    //  let {incrementType,}

    const grade = await GradeStructure.findOne({
      raw: true,

      where: {
        gradeStructureID: +req.body.gradeid,
      },
      attributes: ['companyMasterID'],
    });

    let grade_salary_structure_data = await executeQuery(
      `

 
Select A.*
from(
Select 1 as sort,  Phm."payheadName" as payheadName,
hsf."payheadDisplayName",
                    0 as fieldDefaultPer,
                    0 as fieldFixAmount,
                    '' as gradeName,
                    0 as gradeFrom,
                    0 as gradeTo,
                    0 as gradeSalaryStructureID,
                   0 as salaryFieldID,
                   0 as gradeStructureID,
                    Phm."payheadMasterId" as payheadMasterId,
                    hsf."salaryFieldRound" as salaryFieldRound,
                    hsf."considerIn" as considerIn,
                    hsf."salaryFieldRoundNo" salaryFieldRoundNo,
                     hsf."roundOffType" as roundOffType,
					null as salaryfieldmaxrange,
                    0 as salaryFieldIndex,
                  '' as salaryFieldSide,
                    'A' as salaryFieldSrNo,
                    '' as salaryFieldFixVariable,
					'' as baseOnCalculation,
					'' as formula ,'' as formulaID,
          '{0}' as salaryFieldWhenMonth
					
            from  "hrSalaryFields" as hsf left outer join  "Payheadmasters" As Phm 
             on hsf."payheadMasterId"=Phm."payheadMasterId"  where  Phm."payheadMasterId" in(1,50) and hsf."companyMasterID"=` +
        grade.companyMasterID +
        `                
                   

union ALL
Select  2 as sort, Phm."payheadName" as payheadName,
sf."payheadDisplayName",
                    Gss."fieldDefaultPer" as fieldDefaultPer,
                    Gss."fieldFixAmount" as fieldFixAmount,
                    Gs."gradeName" as gradeName,
                    Gs."gradeFrom" as gradeFrom,
                    Gs."gradeTo" as gradeTo,
                    Gss."gradeSalaryStructureID" as gradeSalaryStructureID,
                    Sf."salaryFieldID" as salaryFieldID,
                    Gs."gradeStructureID" as gradeStructureID,
                    Sf."payheadMasterId" as payheadMasterId,
                    Sf."salaryFieldRound" as salaryFieldRound,
                       Sf."considerIn" as considerIn,
                    Sf."salaryFieldRoundNo" as salaryFieldRoundNo,
                     Sf."roundOffType" as roundOffType,
					Gss."salaryfieldmaxrange" as salaryfieldmaxrange,
          Gss."salaryfieldindex" as salaryfieldindex,
                    Sf."salaryFieldSide" as salaryFieldSide,
                    Sf."salaryFieldSrNo" as salaryFieldSrNo,
                    Sf."salaryFieldFixVariable" as salaryFieldFixVariable,
					Gs."baseOnCalculation" as baseOnCalculation,
					Gss."formula",Gss."formulaID",Sf."salaryFieldWhenMonth"
					
                From "gradeStructures" As Gs
                Inner join "gradeSalaryStructures" As Gss On Gs."gradeStructureID" = Gss."gradeStructureID"
                Inner join "hrSalaryFields" As Sf On Gss."salaryFieldID" = Sf."salaryFieldID"
                Inner join "Payheadmasters" As Phm On Sf."payheadMasterId" = Phm."payheadMasterId"
                Where Gs."status" = 1
                   
                    And Gs."gradeStructureID" = ` +
        req.body.gradeid +
        `
                    ) as A 
                    
                    Order by A."sort", A."salaryfieldindex",A."payheadname"
                           `
    );

    console.log(grade_salary_structure_data);

    const userdata = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: req.body.userMasterID,
      },
    });

    const gender = userdata ? userdata.gender : '';

    grade_salary_structure_data = await assignSalaryStructure(
      grade_salary_structure_data,
      req.body.ctc,
      req.body.gradeid,
      req.body.stateid,
      req.body.AmountIn,
      req.body.userMasterID,
      req.body.yearMonth,
      gender
    );

    res.status(200).json({ status: 200, data: grade_salary_structure_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.changeincrement = async (req, res, next) => {
  try {
    console.log(req.body.ctc, req.body.AmountIn, 'body');

    const userdata = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: req.body.userMasterID,
      },
    });

    const gender = userdata ? userdata.gender : '';

    let grade_salary_structure_data = await manualchangeSalaryStructure(
      req.body.grade_salary_structure,
      req.body.ctc,
      req.body.gradeid,
      req.body.stateid,
      req.body.AmountIn,
      req.body.userMasterID,
      req.body.payheadmasterid,
      req.body.payheadAmount,
      req.body.yearMonth,
      gender
    );

    res.status(200).json({ status: 200, data: grade_salary_structure_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
