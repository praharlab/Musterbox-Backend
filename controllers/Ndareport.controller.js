const { executeQuery } = require('./common.controller');
const logger = require('../config/logger');
const message = require('../response_message/message');
const EmployeeNda = require('../models/employeeNda');
const CompanyMasters = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const ndacategory = require('../models/Ndacategory');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { where } = require('sequelize');
var path = require('path');
const {
  employeeDesignation,
  employeeDepartment,
  employeeBranch,
} = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');

exports.getNdaData = async (req, res, next) => {
  try {
    let { page, limit, userMasterID, exportData } = await req.body;

    const condition = {};

    //if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (userMasterID) condition.userMasterID = userMasterID;

    const paginationQuery = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await EmployeeNda.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: ndacategory,
          attributes: ['nda_category'],
        },
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
          include: [
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
          ],
        },
      ],
      attributes: ['Ndaname', 'givendate', 'description'],
    });

    const finaldata = rows.map((e) => {
      const formatDate = (dateString) => {
        if (!dateString) return 'DD-MM-YYYY';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB').replace(/\//g, '-');
      };

      return {
        EmployeeCode:
          e.userMaster &&
          e.userMaster.employeeJoiningDetails &&
          e.userMaster.employeeJoiningDetails.length
            ? e.userMaster.employeeJoiningDetails[0].employeeCode
            : '',
        EmplyoeeName:
          e.userMaster && e.userMaster.displayName
            ? e.userMaster.displayName
            : '',
        Number:
          e.userMaster && e.userMaster.userNumber
            ? e.userMaster.userNumber
            : '',
        NDAName: e.Ndaname || '',
        GivenDate: formatDate(e.givendate),
        Description: e.description || '',
        Category:
          e.Ndacategory && e.Ndacategory.nda_category
            ? e.Ndacategory.nda_category
            : '',
      };
    });

    if (exportData) {
      await generateExcel(finaldata, 'NdaReport', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// exports.getNdaData = async (req, res, next) => {
//   try {
//     let { page, limit, companyMasterID, userMasterID, exportData } = await req.body;
//     let companyId = companyMasterID, usermasterid = userMasterID;
//     let offset = (page - 1) * limit;
//     let totalcount;
//     let NdareportData;
//     let NdareportDataCount;

//     if (page == '' && limit == '') {
//       if (usermasterid.length == 0) {
//         NdareportData = await sequelize.query(
//           `
//     select emp."employeeCode" as "EmployeeCode",  UM."displayName" as "EmplyoeeName",UM."userNumber" as "Number",CM."Ndaname" as "NDAName",CM."givendate"  as "GivenDate",ND."nda_category" as "Category",CM."description"  as "Description" from public."employeeNdas" as CM
//     inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID"INNER JOIN public."employeeJoiningDetails" as emp ON UM."userMasterID"=emp."userMasterID"
//     where CM."companyMasterID"=$companyId order by UM."displayName" ASC;
//      `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );
//         totalcount = '';
//       } else {
//         NdareportData = await sequelize.query(
//           `
//           select emp."employeeCode" as "EmployeeCode",  UM."displayName" as "EmplyoeeName",UM."userNumber" as "Number",CM."Ndaname" as "NDAName",CM."givendate"  as "GivenDate",ND."nda_category" as "Category",CM."description"  as "Description" from public."employeeNdas" as CM
//           inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID" INNER JOIN public."employeeJoiningDetails" as emp ON UM."userMasterID"=emp."userMasterID"
//     where CM."companyMasterID"=$companyId and CM."userMasterID" IN (` +
//           usermasterid.join(',') +
//           `) order by UM."displayName" ASC;
//      `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );
//         totalcount = '';
//       }
//     } else {
//       if (usermasterid.length == 0) {
//         NdareportData = await sequelize.query(
//           `
//   select  emp."employeeCode" as "EmployeeCode", UM."displayName" as "EmplyoeeName",UM."userNumber" as "Number",CM."Ndaname" as "NDAName",CM."givendate"  as "GivenDate",ND."nda_category" as "Category",CM."description"  as "Description" from public."employeeNdas" as CM
//   inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID" INNER JOIN public."employeeJoiningDetails" as emp ON UM."userMasterID"=emp."userMasterID"
//   where CM."companyMasterID"=$companyId order by UM."displayName" ASC limit ` +
//           limit +
//           ` offset ` +
//           offset +
//           `
//   `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );

//         NdareportDataCount = await sequelize.query(
//           `
//   select count(*) from public."employeeNdas" as CM
//   inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID"
//   where CM."companyMasterID"=$companyId
//   `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );
//         totalcount = NdareportDataCount[0][0].count;
//       } else {
//         NdareportData = await sequelize.query(
//           `
//         select emp."employeeCode" as "EmployeeCode",  UM."displayName" as "EmplyoeeName",UM."userNumber" as "Number",CM."Ndaname" as "NDAName",CM."givendate"  as "GivenDate",ND."nda_category" as "Category",CM."description"  as "Description" from public."employeeNdas" as CM
//         inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID"  INNER JOIN public."employeeJoiningDetails" as emp ON UM."userMasterID"=emp."userMasterID"
//   where CM."companyMasterID"=$companyId and CM."userMasterID" IN (` +
//           usermasterid.join(',') +
//           `) order by UM."displayName" ASC limit ` +
//           limit +
//           ` offset ` +
//           offset +
//           `
//    `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );
//         NdareportDataCount = await sequelize.query(
//           `
//         select count(*) from public."employeeNdas" as CM
//         inner join public."Ndacategories" as ND on ND."Ndacategoryid"=CM."Ndacategoryid"  inner join public."userMasters" as UM on UM."userMasterID"=CM."userMasterID"
//   where CM."companyMasterID"=$companyId and CM."userMasterID" IN (` +
//           usermasterid.join(',') +
//           `)
//    `,
//           {
//             bind: {
//               companyId: companyId,
//               usermasterid: usermasterid,
//             },
//             type: Sequelize.SELECT,
//           }
//         );
//         totalcount = NdareportDataCount[0][0].count;
//       }
//     }

//     if (exportData) {
//       await generateExcel(NdareportData[0], 'NdaReport', 'xlsx', res);
//       return;
//     }

//     res
//       .status(200)
//       .json({ status: 200, data: NdareportData[0], totalcount: totalcount });
//   } catch (err) {
//     next(err);
//   }
// };

exports.getdepositData = async (req, res, next) => {
  try {
    let { page, limit, companyMasterID, userMasterID, exportData } =
      await req.body;
    let offset = (page - 1) * limit;
    let DepositData;
    let totalcount;
    let DepositDataCount;

    if (page == '' && limit == '') {
      if (userMasterID.length == 0) {
        DepositData = await sequelize.query(
          `
          SELECT um."userMasterID", empjoining."employeeCode", um."displayName" as "EmployeeName",um."userNumber" as "Number",dc.depositcategoryname as "Deposit Category Name",dp.amount as "Deposit Amount",dp.description as "Deposit Description",dp."dateOfDeposit" as "Deposit Date",dp."depositReceiveAs" as "Deposit Received As",dp."salaryMonth" as "Deposit Salary Month",dp."refundDate" as "Refund Date",dp."refundRemarks" as "Refund Remarks",dp."refundMode" as "Refund Mode" from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` order by um."displayName" ASC `,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );
        totalcount = '';
      } else {
        DepositData = await sequelize.query(
          `
          SELECT um."userMasterID", empjoining."employeeCode", um."displayName" as "EmployeeName",um."userNumber" as "Number",dc.depositcategoryname as "Deposit Category Name",dp.amount as "Deposit Amount",dp.description as "Deposit Description",dp."dateOfDeposit" as "Deposit Date",dp."depositReceiveAs" as "Deposit Received As",dp."salaryMonth" as "Deposit Salary Month",dp."refundDate" as "Refund Date",dp."refundRemarks" as "Refund Remarks",dp."refundMode" as "Refund Mode" from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and um."userMasterID" in (` +
            userMasterID.join(',') +
            `)  order by um."displayName" ASC
     `,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );
        totalcount = '';
      }
    } else {
      if (userMasterID.length == 0) {
        DepositData = await sequelize.query(
          `
          SELECT um."userMasterID", empjoining."employeeCode", um."displayName" as "EmployeeName",um."userNumber" as "Number",dc.depositcategoryname as "Deposit Category Name",dp.amount as "Deposit Amount",dp.description as "Deposit Description",dp."dateOfDeposit" as "Deposit Date",dp."depositReceiveAs" as "Deposit Received As",dp."salaryMonth" as "Deposit Salary Month",dp."refundDate" as "Refund Date",dp."refundRemarks" as "Refund Remarks",dp."refundMode" as "Refund Mode" from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` order by um."displayName" ASC limit ` +
            limit +
            ` offset ` +
            offset +
            ``,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );

        DepositDataCount = await sequelize.query(
          `
          SELECT count(*) from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ``,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );
        totalcount = DepositDataCount[0][0].count;
      } else {
        DepositData = await sequelize.query(
          `
          SELECT um."userMasterID", empjoining."employeeCode", um."displayName" as "EmployeeName",um."userNumber" as "Number",dc.depositcategoryname as "Deposit Category Name",dp.amount as "Deposit Amount",dp.description as "Deposit Description",dp."dateOfDeposit" as "Deposit Date",dp."depositReceiveAs" as "Deposit Received As",dp."salaryMonth" as "Deposit Salary Month",dp."refundDate" as "Refund Date",dp."refundRemarks" as "Refund Remarks",dp."refundMode" as "Refund Mode" from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and um."userMasterID" in (` +
            userMasterID.join(',') +
            `) order by um."displayName" ASC limit ` +
            limit +
            ` offset ` +
            offset +
            `
     `,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );

        DepositDataCount = await sequelize.query(
          `
          SELECT count(*) from deposits as dp join depositcategories as dc on dp."depositCategoryID"=dc.depositcategoryid join "userMasters" as um on um."userMasterID"=dp."userMasterID" join 
          "employeeJoiningDetails" as empjoining on um."userMasterID" = empjoining."userMasterID" where um."companyMasterId"=` +
            companyMasterID +
            ` and um."userMasterID" in (` +
            userMasterID.join(',') +
            `)`,
          {
            bind: {
              companyId: companyMasterID,
              usermasterid: userMasterID,
            },
            type: Sequelize.SELECT,
          }
        );
        totalcount = DepositDataCount[0][0].count;
      }
    }

    const finalData = [];

    for (const deposit of DepositData[0]) {
      const obj = {};

      const date = deposit['Deposit Date']
        ? deposit['Deposit Date']
        : new Date().toISOString().slice(0, 10);
      const userMasterID = deposit.userMasterID;

      obj['EmployeeCode'] = deposit.employeeCode;
      obj['EmployeeName'] = deposit.EmployeeName;
      obj['Number'] = deposit.Number;

      const designation = await employeeDesignation(userMasterID, date);
      obj['Designation'] = designation
        ? designation['designation.designationName']
        : '';

      const department = await employeeDepartment(userMasterID, date);
      obj['Department'] = department
        ? department['department.departmentName']
        : '';

      const branch = await employeeBranch(userMasterID, date);
      obj['Branch'] = branch ? branch['branchMaster.branchName'] : '';

      obj['Deposit Category Name'] = deposit['Deposit Category Name'];
      obj['Deposit Amount'] = deposit['Deposit Amount'];
      obj['Deposit Date'] = deposit['Deposit Date']
        ? String(deposit['Deposit Date']).split('').reverse().join('')
        : '';
      obj['Deposit Received As'] = deposit['Deposit Received As'];
      obj['Deposit Salary Month'] = deposit['Deposit Salary Month'];
      obj['Refund Date'] = deposit['Refund Date']
        ? String(deposit['Refund Date']).split('').reverse().join('')
        : '';
      obj['Refund Remarks'] = deposit['Refund Remarks'];
      obj['Refund Mode'] = deposit['Refund Mode'];

      finalData.push(obj);
    }

    if (exportData) {
      await generateExcel(finalData, 'Deposit', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finalData, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

//get by company id
exports.getreportbyCompanyId = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let employeeNda, totalcount;
    if (searchQuery && page && limit) {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              Ndaname: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },

        order: [['employeeNdaid', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: CompanyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (var j = 0; j < employeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await EmployeeNda.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              Ndaname: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [[' employeeNdaid', 'ASC']],
        include: [
          {
            model: CompanyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            {
              Ndaname: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [
          {
            model: CompanyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (var j = 0; j < employeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Ndacategory.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          [Sequelize.Op.or]: [
            { Ndaname: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [
          {
            model: CompanyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }

      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < EmployeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await EmployeeNda.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }

      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < employeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await EmployeeNda.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < employeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await EmployeeNda.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasters.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },

        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      console.log(companyid);
      employeeNda = await EmployeeNda.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        order: [['employeeNdaid', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < employeeNda.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeeNda[j].updateBy,
          },
        });

        if (user1) {
          employeeNda[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeeNda[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await EmployeeNda.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
          // authorizationStatus:['0','3']
        },
        include: [{ all: true, nested: true }],
      });
    }

    res
      .status(200)
      .json({ status: 200, data: employeeNda, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};
