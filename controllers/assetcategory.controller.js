const Sequelize = require('sequelize');
const AssetCategory = require('../models/assetCategory');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const xlsx = require('xlsx');
const AssetMaster = require('../models/assetMaster');

const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
/**
 * save asset category data.
 *
 * @body {createBy} createBy user id of user who added the asset category.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.uploadAssetExcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Iterate over the rows and insert data into the database

    let asset = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const assetCategory = data[i][0];

        const existingAsset = await AssetCategory.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('assetCategory')),
              assetCategory.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('assetCategory')),
              assetCategorys.toString().toUpperCase()
            )
          ),
        });

        if (existingAsset) {
          asset.push(data[i][0]);
        } else {
          await AssetCategory.create({
            assetCategory: data[i][0],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }
    if (asset.length > 0) {
      res.status(200).json({
        status: 200,
        message:
          'Assetcategory' +
          asset +
          'already exist and other AssetCategory inserted successfully',
      });
    } else {
      res.status(200).json({
        status: 200,
        message: 'Data inserted successfully',
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

exports.postAddAssetCategory = async (req, res, next) => {
  try {
    let { assetCategory, companyMasterID, createBy, createByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await AssetCategory.create(
        {
          assetCategory,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.assetcategoryadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all asset category data
 */

exports.getAllAssetCategoryData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let asset_category = [],
      totalcount;
    if (searchQuery) {
      asset_category = await AssetCategory.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              assetCategory: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
          },
        ],
      });
      totalcount = asset_category.length;
    } else if (limit == '' && page == '') {
      asset_category = await AssetCategory.findAll({
        order: [['assetCategory', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
      totalcount = await AssetCategory.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      asset_category = await AssetCategory.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['assetCategory', 'ASC']],
      });
      totalcount = await AssetCategory.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: asset_category, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with asset category id
 *
 * @param {id} assetCategoryID  to fetch asset category name
 */

exports.getAssetCategoryById = async (req, res, next) => {
  try {
    let get_one_data = await AssetCategory.findOne({
      where: {
        assetCategoryID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });
    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with asset category id
 *
 * @param {id} assetCategoryID  to fetch asset category name
 */

exports.getAssetCategoryByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          assetCategory: {
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

    const assetCategory = await AssetCategory.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          attributes: ['companyName'],
        },
      ],
    });
    if (exportData) {
      const finalData = [];

      for (let i = 0; i < assetCategory.rows.length; i++) {
        const data1 = {
          AssetCategory: assetCategory.rows[i].assetCategory,
          Company: assetCategory.rows[i]['companyMaster.companyName'],
          Status: assetCategory.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      return await generateExcel(finalData, 'AssetCategory', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: assetCategory.rows,
      totalcount: assetCategory.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} assetCategoryID  to update id
 */
exports.postUpdateAssetCategory = async (req, res, next) => {
  try {
    let {
      assetCategoryID,
      assetCategory,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await AssetCategory.update(
        {
          assetCategory,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { assetCategoryID: assetCategoryID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.assetcategoryupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} assetCategoryID  to update status of asset category
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { assetCategoryID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await AssetCategory.update(
          {
            status: '1',
          },
          {
            where: { assetCategoryID: assetCategoryID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await AssetMaster.findOne({
          where: {
            assetCategoryID: assetCategoryID,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Asset Category.Already used in Asset Master.',
          });
        } else {
          delete_status = await AssetCategory.update(
            {
              status: '0',
            },
            {
              where: { assetCategoryID: assetCategoryID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.assetcategorydelete,
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
 * @param {id} assetCategoryID  to delete id
 */
exports.postDeleteAssetCategoryById = async (req, res, next) => {
  try {
    let { assetCategoryID } = await req.body;

    let data = await AssetMaster.findOne({
      where: {
        assetCategoryID: assetCategoryID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Asset Category.Already used in Asset Master.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await AssetCategory.update(
          {
            status: 2,
          },
          {
            where: { assetCategoryID: assetCategoryID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.assetcategorydelete,
        });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getactiveassetcategorybycompanyid = async (req, res, next) => {
  try {
    let branch;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
      raw: true,
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    branch = await AssetCategory.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },
      raw: true,
    });

    res.status(200).json({ status: 200, data: branch });
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  try {
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const data = [];

    for (const row of rows) {
      if (row && row.length > 0) {
        const assetCategory = row[0]; // Assuming the Asset Category name is in the first column
        let assetCategoryMaster = {
          assetCategory: assetCategory,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.assetCategory &&
            typeof s.assetCategory === 'string' &&
            s.assetCategory.toLowerCase() ===
              assetCategoryMaster.assetCategory.toLowerCase()
        );

        if (duplicateInExcel) {
          assetCategoryMaster.remarks =
            'Duplicate Asset Category Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            assetCategory: {
              [Sequelize.Op.iLike]: assetCategoryMaster.assetCategory,
            },
          };

          const uniquedata = await AssetCategory.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            assetCategoryMaster.remarks = 'Asset Category Already Exists';
          }
        }

        data.push(assetCategoryMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.assetCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateAssetCategory = async (req, res, next) => {
  try {
    const { assetCategory, companyMasterID } = req.body;

    let data = [];
    for (const row of assetCategory) {
      if (row != null && row != '') {
        let assetCategoryMaster = {
          assetCategory: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.assetCategory.trim().toLowerCase() ===
            assetCategoryMaster.assetCategory.trim().toLowerCase()
        );

        if (duplicateInData) {
          assetCategoryMaster.remarks = 'Duplicate Asset Category Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.assetCategory = {
            [Sequelize.Op.iLike]: assetCategoryMaster.assetCategory,
          };
          let uniquedata = await AssetCategory.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            assetCategoryMaster.remarks = 'Asset Category Already Exists';
          }
        }

        data.push(assetCategoryMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.assetCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateAssetCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { assetCategory, companyMasterID } = req.body;

    await AssetCategory.bulkCreate(
      assetCategory.map((item) => ({
        assetCategory: item.trim(),
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.assetCategoryadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
