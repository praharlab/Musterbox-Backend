const { executeQuery } = require('./common.controller');
const logger = require('../config/logger');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { where } = require('sequelize');
var path = require('path');
const { generateExcel } = require('../utils/exportData');

exports.getAssetData = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      assetcategory,
      exportData,
    } = req.body;
    let offset = (page - 1) * limit;

    let whereClauses = [];
    if (userMasterID.length > 0) {
      whereClauses.push(`AE."userMasterID" IN (${userMasterID.join(',')})`);
    }
    if (assetcategory.length > 0) {
      whereClauses.push(`AE."assetCategoryID" IN (${assetcategory.join(',')})`);
    }
    const whereCondition = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const baseSelectQuery = `SELECT 
        emp."employeeCode" AS "Employee Code",
        UM."displayName" AS "Employee Name",
        UM."userNumber" AS "Number",
        AC."assetCategory" AS "Asset Category",
        AM."assetName" AS "Asset Name",
        AM."assetSerialNo" AS "Asset Serial No",
        AE."description" AS "Asset Description",
        AE."assignDate" AS "Asset Asign Date",
        AE."returnDate" AS "Asset Return Date"
      FROM public."assignAssetToEmployees" AS AE
      INNER JOIN public."assetCategories" AS AC 
        ON AE."assetCategoryID" = AC."assetCategoryID"
      INNER JOIN public."userMasters" AS UM 
        ON AE."userMasterID" = UM."userMasterID"
      INNER JOIN public."assetMasters" AS AM
        ON AC."assetCategoryID" = AM."assetCategoryID"
      LEFT JOIN public."employeeJoiningDetails" AS emp 
        ON emp."userMasterID" = AE."userMasterID"
      `;

    const baseCountQuery = `SELECT COUNT(*)
      FROM public."assignAssetToEmployees" AS AE
      INNER JOIN public."assetCategories" AS AC 
        ON AE."assetCategoryID" = AC."assetCategoryID"
      INNER JOIN public."userMasters" AS UM 
        ON AE."userMasterID" = UM."userMasterID"
      INNER JOIN public."assetMasters" AS AM
        ON AC."assetCategoryID" = AM."assetCategoryID"
      `;

    if (page === '' && limit === '') {
      // No pagination, no limit or offset
      assetreport = await sequelize.query(
        `${baseSelectQuery} ${whereCondition} ORDER BY UM."displayName" ASC`,
        { type: Sequelize.SELECT }
      );
      totalcount = ''; // no count for no pagination case
    } else {
      // Pagination applied
      assetreport = await sequelize.query(
        `${baseSelectQuery} ${whereCondition} ORDER BY UM."displayName" ASC LIMIT ${limit} OFFSET ${offset}`,
        { type: Sequelize.SELECT }
      );

      const countResult = await sequelize.query(
        `${baseCountQuery} ${whereCondition}`,
        { type: Sequelize.SELECT }
      );
      totalcount = countResult[0][0].count;
    }


    if (exportData) {
      await generateExcel(assetreport[0], 'Assetreport', 'xlsx', res);
      return;
    }
    res.status(200).json({ status: 200, data: assetreport[0], totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};
