const { executeQuery } = require('./common.controller');
const logger = require('../config/logger');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { where } = require('sequelize');
var path = require('path');

const message = require('../response_message/message');
const Visit = require('../models/visit');
const customer = require('../models/customer');
const UserMaster = require('../models/userMaster');
const VisitCustomizeFieldValueModel = require('../models/visitformcustomizevalue');
const VisitFormCustomize = require('../models/visitformcustomize');
const VisitReportCustomize = require('../models/visitreportcustomize');
const VisitReportCustomizeValue = require('../models/visitreportcustomizevalue');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeBranch = require('../models/employeeBranch');
const e = require('express');
const { generateExcel } = require('../utils/exportData');
const EmployeePenalty = require('../models/employeePenalty');
const Penalty = require('../models/penalty');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const companyMaster = require('../models/companyMaster');

exports.getPenaltyData = async (req, res, next) => {
  try {
    let { page, limit, startdate, enddate, userMasterID, exportData } =
      await req.body;

    const condition = {};

    if (userMasterID) condition.userMasterID = userMasterID;

    if (startdate && enddate) {
      condition.penaltyDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    condition.status = 1;

    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await EmployeePenalty.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: Penalty,
          as: 'penalty',
          attributes: ['penaltyName', 'deductionFromSalary'],
        },
        {
          model: UserMaster,
          as: 'employee',
          attributes: ['displayName', 'userNumber'],
          include: [
            {
              model: companyMaster,
              attributes: ['companyName'],
            },
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: ['displayName'],
        },
      ],

      attributes: ['penaltyAmount', 'penaltyDate', 'createBy', 'description'],
    });

    const finaldata = rows.map((e) => {
      return {
        'Employee Code':
          e.employee.employeeJoiningDetails &&
          e.employee.employeeJoiningDetails.length
            ? e.employee.employeeJoiningDetails[0].employeeCode
            : '',
        UserName:
          e.employee && e.employee.displayName ? e.employee.displayName : '',
        Number:
          e.employee && e.employee.userNumber ? e.employee.userNumber : '',
        companyName:
          e.employee.companyMaster && e.employee.companyMaster
            ? e.employee.companyMaster.companyName
            : '',
        penaltyName: e.penalty.penaltyName,
        deductionFromSalary: e.penalty.deductionFromSalary,
        penaltyDate: e.penaltyDate,
        penaltyAmount: e.penaltyAmount,
        description: e.description,
        'Created By': e.createdByUser ? e.createdByUser.displayName : '',
      };
    });

    if (exportData) {
      await generateExcel(finaldata, 'Penalty Report', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// exports.getPenaltyData = async (req, res, next) => {
//   try {
//     let {
//       page,
//       limit,
//       companyMasterID,
//       userMasterID,
//       startdate,
//       enddate,
//       exportData,
//     } = await req.body;
//     let companyid = companyMasterID, usermasterid = userMasterID;
//     let offset = (page - 1) * limit;
//     let results;
//     let results_count;
//     let totalcount;

//     if (page == '' && limit == '') {
//       if (!usermasterid) {
//         results = await executeQuery(
//           `select emp."employeeCode" AS "Employee Code",UM."displayName" as "UserName",UM."userNumber" as "Number",CO."companyName",PP."penaltyName",pp."deductionFromSalary",EP."penaltyDate",EP."penaltyAmount",EP."description",CM."displayName" as "Created By" from public."employeePenalties" as EP inner join public."penalties" as PP
//           on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//           LEFT JOIN public."employeeJoiningDetails" AS emp ON emp."userMasterID"=UM."userMasterID"
//           where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `' order by UM."displayName" ASC `
//         );
//         totalcount = '';
//       } else {
//         results = await executeQuery(
//           `select emp."employeeCode" AS "Employee Code", UM."displayName" as "UserName",UM."userNumber" as "Number",CO."companyName",PP."penaltyName",pp."deductionFromSalary",EP."penaltyDate",EP."penaltyAmount",EP."description",CM."displayName" as "Created By" from public."employeePenalties" as EP inner join public."penalties" as PP
//           on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//           LEFT JOIN public."employeeJoiningDetails" AS emp ON emp."userMasterID"=UM."userMasterID"
//           where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."userMasterID" IN (` +
//           usermasterid +
//           `) and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `' order by UM."displayName" ASC `
//         );
//         totalcount = '';
//       }
//     } else {
//       if (!usermasterid) {
//         results = await executeQuery(
//           `select emp."employeeCode" AS "Employee Code", UM."displayName" as "UserName",UM."userNumber" as "Number",CO."companyName",PP."penaltyName",pp."deductionFromSalary",EP."penaltyDate",EP."penaltyAmount",EP."description",CM."displayName" as "Created By" from public."employeePenalties" as EP inner join public."penalties" as PP
//             on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//             LEFT JOIN public."employeeJoiningDetails" AS emp ON emp."userMasterID"=UM."userMasterID"
//             where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `' order by UM."displayName" ASC limit ` +
//           limit +
//           ` offset ` +
//           offset +
//           ``
//         );
//         results_count = await executeQuery(
//           `select count(*) from public."employeePenalties" as EP inner join public."penalties" as PP
//             on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//             where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `' `
//         );

//         totalcount = results_count[0].count;
//       } else {
//         results = await executeQuery(
//           `select emp."employeeCode" AS "Employee Code", UM."displayName" as "UserName",UM."userNumber" as "Number",CO."companyName",UM."displayName" as "User Name",PP."penaltyName",pp."deductionFromSalary",EP."penaltyDate",EP."penaltyAmount",EP."description",CM."displayName" as "Created By" from public."employeePenalties" as EP inner join public."penalties" as PP
//             on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//             LEFT JOIN public."employeeJoiningDetails" AS emp ON emp."userMasterID"=UM."userMasterID"
//             where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."userMasterID" IN (` +
//           usermasterid +
//           `) and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `' order by UM."displayName" ASC limit ` +
//           limit +
//           ` offset ` +
//           offset +
//           ``
//         );
//         results_count = await executeQuery(
//           `select count(*) from public."employeePenalties" as EP inner join public."penalties" as PP
//             on EP."penaltyID" = PP."penaltyID" inner join public."userMasters" as UM on EP."userMasterID" = UM."userMasterID" inner join public."userMasters" as CM on CM."userMasterID" = EP."createBy" inner join public."companyMasters" as CO on CO."companyMasterID" = UM."companyMasterId"
//             where EP."status"=1 and UM."companyMasterId" = ` +
//           companyid +
//           ` and EP."userMasterID" IN (` +
//           usermasterid +
//           `) and EP."penaltyDate" between '` +
//           startdate +
//           `' and '` +
//           enddate +
//           `'`
//         );
//       }

//       totalcount = results_count[0].count;
//     }

//     if (exportData) {
//       await generateExcel(results, 'Penalty Report', 'xlsx', res);
//       return;
//     }

//     res
//       .status(200)
//       .json({ status: 200, data: results, totalcount: totalcount });
//   } catch (err) {
//     next(err);
//   }
// };
