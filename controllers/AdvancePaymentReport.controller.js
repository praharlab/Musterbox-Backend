const { executeQuery } = require('./common.controller');
const {
  employeeBranch,
  employeeDepartment,
  employeeDesignation,
} = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');

//getadvancedata
exports.getAdvanceData = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      userMasterID,
      startdate,
      enddate,
      exportData,
    } = req.body;
    const isPaginated = page !== '' && limit !== '';
    const hasUserFilter = Array.isArray(userMasterID) && userMasterID.length > 0;
    const offset = (page - 1) * limit;
    const baseQuery = `
      from public."advancePayments" as AP
      inner join public."userMasters" as UM on AP."userMasterID" = UM."userMasterID"
      inner join public."employeeJoiningDetails" as emp on AP."userMasterID" = emp."userMasterID"
      inner join public."userMasters" as CRB on AP."createBy" = CRB."userMasterID"
      inner join public."companyMasters" as CM on CM."companyMasterID" = AP."companyMasterID"
      where AP."status" = 1 and AP."AdvanceStatus" = 1
      and UM."companyMasterId" = ${companyMasterID}
      and AP."advanceDate" between '${startdate}' and '${enddate}'
    `;

    const userCondition = hasUserFilter ? `and AP."userMasterID" IN (${userMasterID})` : '';

    const selectFields = `
      AP."userMasterID",
      emp."employeeCode" as "EmployeeCode",
      UM."displayName" as "UserName",
      UM."userNumber" as "Number",
      CM."companyName",
      AP."description",
      AP."amount",
      AP."advanceDate" as "Date",
      AP."paymentmode",
      CRB."displayName" as "Created By"
    `;

    const orderClause = `order by UM."displayName" ASC, AP."advanceDate" DESC`;

    let results, totalcount;

    let finalQuery = `select ${selectFields} ${baseQuery} ${userCondition} ${orderClause}`;
    if (isPaginated) {
      finalQuery += ` limit ${limit} offset ${offset}`;
    }

    results = await executeQuery(finalQuery);

    if (isPaginated) {
      const countQuery = `select count(*) ${baseQuery} ${userCondition}`;
      const countResult = await executeQuery(countQuery);
      totalcount = countResult[0]?.count || 0;
    } else {
      totalcount = '';
    }

    const finalData = [];

    for (const result of results) {
      const obj = {};
      const date = result.Date
        ? result.Date.toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const userMasterID = result.userMasterID;
      obj.companyName = result.companyName;
      const branch = await employeeBranch(userMasterID, date);
      obj.Branch = branch ? branch['branchMaster.branchName'] : '';

      const department = await employeeDepartment(userMasterID, date);
      obj.Department = department
        ? department['department.departmentName']
        : '';
      const designation = await employeeDesignation(userMasterID, date);
      obj.Designation = designation
        ? designation['designation.designationName']
        : '';
      obj['EmployeeCode'] = result.EmployeeCode;
      obj['UserName'] = result.UserName;
      obj['Number'] = result.Number;
      obj.Date = result.Date
        ? result.Date.toISOString().slice(8, 10) +
        '-' +
        result.Date.toISOString().slice(5, 7) +
        '-' +
        result.Date.toISOString().slice(0, 4)
        : '';
      obj.description = result.description;
      obj.amount = result.amount;
      obj.paymentmode = result.paymentmode;
      obj['Created By'] = result['Created By'];

      finalData.push(obj);
    }

    if (exportData) {
      await generateExcel(finalData, 'Advance Report', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finalData, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};
