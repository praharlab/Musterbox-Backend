const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMasters = require('../models/companyMaster');
const assetMaster = require('../models/assetMaster');
const assetCategory = require('../models/assetCategory');
const AssignAssettoemployee = require('../models/assignAssetToEmployee');
const { generateExcel } = require('../utils/exportData');
const AssignAssetToEmployee = require('../models/assignAssetToEmployee');
const fs = require('fs');
const { genrateDemoExcelForAssetMaster } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const { isValidDate } = require('../utils/commonUtilFunctions');
const path = require('path');

exports.postAddassetMaster = async (req, res, next) => {
  try {
    const {
      assetSerialNo,
      assetName,
      assetCategoryID,
      purchaseDate,
      quantity,
      description,
      companyMasterID,
    } = await req.body;
    let assetDocument = '';
    if (req.file) {
      assetDocument = req.file.filename;
    }
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    await assetMaster.create({
      assetSerialNo,
      assetName,
      assetCategoryID,
      purchaseDate,
      quantity,
      description,
      assetDocument,
      companyMasterID,
      createBy,
      createByIp,
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Asset'),
      data: {},
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getassetMasterById = async (req, res, next) => {
  try {
    const get_one_data = await assetMaster.findOne({
      where: {
        assetMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data || null });
  } catch (err) {
    next(err);
  }
};

exports.updateassetMasterData = async (req, res, next) => {
  try {
    const {
      assetMasterID,
      assetSerialNo,
      assetName,
      assetCategoryID,
      purchaseDate,
      quantity,
      description,
      companyMasterID,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const findAssetMaster = await assetMaster.findOne({
      where: { assetMasterID: assetMasterID },
      raw: true,
    });
    if (findAssetMaster && +findAssetMaster.quantity > +quantity) {
      const assignedAsset = await AssignAssetToEmployee.findAll({
        where: {
          assetMasterID: assetMasterID,
          status: 1,
          returnDate: { [Sequelize.Op.eq]: null },
        },
      });

      if (assignedAsset.length != 0) {
        //unlink
        if (req.file) {
          fs.unlink(
            path.join(__dirname, `../uploads/user/assets/${req.file.filename}`),
            function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log('delete');
              }
            }
          );
        }

        return res.status(200).json({
          status: 401,
          message: 'Quantity cannot be changed as it is assigned to Employees',
          data: {},
        });
      }
    }
    let assetDocument = req.file ? req.file.filename : null;

    await assetMaster.update(
      {
        assetMasterID,
        assetSerialNo,
        assetName,
        assetCategoryID,
        purchaseDate,
        quantity,
        description,
        assetDocument,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { assetMasterID: assetMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Asset'),
      data: {},
    });
  } catch (err) {
    next(err.message);
  }
};

// * Delete  by assetMasterID

exports.deleteassetmaster = async (req, res, next) => {
  try {
    let { assetMasterID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    let data = await AssignAssettoemployee.findOne({
      where: {
        assetMasterID: assetMasterID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign('Asset', 'Delete'),
      });
    } else {
      await assetMaster.update(
        {
          status: 2,
          updateBy,
          updateByIp,
        },
        {
          where: { assetMasterID: assetMasterID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Asset'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    const { assetMasterID, status } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    if (status != '1') {
      const data = await AssignAssettoemployee.findOne({
        where: {
          assetMasterID: assetMasterID,
          status: ['0', '1'],
        },
      });
      if (data) {
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign('Asset', 'deactivate'),
        });
      }
    }

    await assetMaster.update(
      {
        status: status,
        updateBy,
        updateByIp,
      },
      {
        where: { assetMasterID: assetMasterID },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Asset')
          : message.usermessage.deactiveMessage('Asset'),
    });
  } catch (err) {
    next(err);
  }
};

//get by company id

exports.getAssetMasterbyCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          assetName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          assetSerialNo: {
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

    const { rows: asset_Master, count } = await assetMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: CompanyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
        {
          model: assetCategory,
          as: 'assetCategory',
        },
      ],
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < asset_Master.length; i++) {
        const data1 = {
          AssetSerialNo: asset_Master[i].assetSerialNo,
          AssetName: asset_Master[i].assetName,
          AssetCategory: asset_Master[i].assetCategory.assetCategory,
          CompanyName: asset_Master[i].companyMaster.companyName,
          PurchaseDate: asset_Master[i].purchaseDate,
          Status: asset_Master[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Asset', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: asset_Master,
      totalcount: count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getAssetCategoriesForSelectedCompany = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: asset_category, count } = await assetCategory.findAndCountAll(
      {
        where: {
          companyMasterID: companyMasterID,
          status: ['0', '1'],
        },
        ...paginationQuery,
      }
    );

    return res
      .status(200)
      .json({ status: 200, data: asset_category, totalcount: count });
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
    const convertExcelDateToISO = (excelDate) => {
      return new Date(Math.round(excelDate - 25569) * 86400 * 1000)
        .toISOString()
        .slice(0, 10);
    };

    const formatDateStringToISO = (dateString) => {
      return new Date(dateString).toISOString().slice(0, 10);
    };
    const data = [];
    for (const row of rows) {
      if (row[2] != null && row[2].trim() != '') {
        let assetCategoryid = await assetCategory.findOne({
          where: {
            assetCategory: { [Sequelize.Op.iLike]: row[0].toString() },
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
          },
        });

        let assetData = {
          assetCategoryID: row[0],
          assetSerialNo: row[1].toString(),
          assetName: row[2].toString(),
          quantity: row[3],
          purchaseDate: row[4],
          description: row[5].toString(),
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        if (typeof row[4] === 'number') {
          assetData.purchaseDate = convertExcelDateToISO(row[4]);
        } else if (isValidDate(row[4])) {
          assetData.purchaseDate = formatDateStringToISO(row[4]);
        } else {
          assetData.purchaseDate = null;
          assetData.remarks = "Purchase Date Should be in 'yyyy-mm-dd'";
        }

        if (assetCategoryid) {
          assetData.assetCategoryID = assetCategoryid.assetCategoryID;
        } else {
          assetData.remarks = 'Asset Category Name Not Exist';
        }
        const duplicateInExcel = data.find(
          (s) =>
            s.assetName &&
            s.assetCategoryID &&
            s.assetSerialNo &&
            typeof s.assetName === 'string' &&
            typeof s.assetSerialNo === 'string' &&
            s.assetName.toLowerCase() === assetData.assetName.toLowerCase() &&
            s.assetSerialNo.toLowerCase() ===
              assetData.assetSerialNo.toLowerCase() &&
            s.assetCategoryID === assetData.assetCategoryID
        );

        if (duplicateInExcel) {
          assetData.remarks = 'Duplicate Asset Name and Serial Number in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            assetName: {
              [Sequelize.Op.iLike]: assetData.assetName,
            },
            assetSerialNo: {
              [Sequelize.Op.iLike]: assetData.assetSerialNo,
            },
            assetCategoryID: assetData.assetCategoryID,
          };

          const uniquedata = await assetMaster.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            assetData.remarks = 'Asset Already Exists';
          }
        }
        data.push(assetData);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: 'Asset Master Validate successfully.',
      data: data,
    });
  } catch (error) {
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    next(error);
  }
};

exports.revalidateAssetMaster = async (req, res, next) => {
  try {
    const { assetMasterData, companyMasterID } = req.body;

    let data = [];

    for (const row of assetMasterData) {
      // Ensure the row is an object and has the required fields
      if (row.assetName && row.assetName.trim() !== '') {
        let assetData = {
          assetSerialNo: row.assetSerialNo,
          assetName: row.assetName.trim(),
          assetCategoryID: row.assetCategoryID,
          description: row.description,
          quantity: row.quantity,
          purchaseDate: row.purchaseDate,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.assetName &&
            s.assetCategoryID &&
            s.assetSerialNo &&
            typeof s.assetName === 'string' &&
            typeof s.assetSerialNo === 'string' &&
            s.assetName.toLowerCase() === assetData.assetName.toLowerCase() &&
            s.assetSerialNo.toLowerCase() ===
              assetData.assetSerialNo.toLowerCase() &&
            s.assetCategoryID === assetData.assetCategoryID
        );

        if (duplicateInExcel) {
          assetData.remarks = 'Duplicate Asset Name and Serial Number in Excel';
        } else {
          // Check for duplicates in the database
          const condition = {
            companyMasterID: companyMasterID,
            status: [0, 1],
            assetName: {
              [Sequelize.Op.iLike]: assetData.assetName,
            },
            assetSerialNo: {
              [Sequelize.Op.iLike]: assetData.assetSerialNo,
            },
            assetCategoryID: assetData.assetCategoryID,
          };

          const uniquedata = await assetMaster.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            assetData.remarks = 'Asset Already Exists';
          }
        }

        data.push(assetData);
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Asset Master Re-Validate successfully.',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateAssetMaster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { assetMasterData, companyMasterID } = req.body;

    await assetMaster.bulkCreate(
      assetMasterData.map((item) => ({
        assetSerialNo: item.assetSerialNo,
        assetName: item.assetName.trim(),
        assetCategoryID: item.assetCategoryID,
        description: item.description,
        quantity: item.quantity,
        purchaseDate: item.purchaseDate,
        assetDocument: '',
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Asset Master'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    condition.companyMasterID = companyMasterID;
    condition.status = [0, 1];
    const order = [['assetCategory', 'ASC']];
    const assetcategoryData = await assetCategory.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });
    const categoryNames = assetcategoryData.rows.map(
      (row) => row.assetCategory
    );

    await genrateDemoExcelForAssetMaster(
      categoryNames,
      'Demo Asset Master',
      'xlsx',
      res
    );
  } catch (err) {
    next(err);
  }
};
