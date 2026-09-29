const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const Product = require('../models/product');
const Visit = require('../models/visit');
const companyMaster = require('../models/companyMaster');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const { statusCodes } = require('../utils/commonVars');
const { CustomError } = require('../utils/customError');
const { ChildParentCompanyIds } = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
const path = require('path');

/**
 * save product data.
 *
 * @body {createBy} createBy user id of user who added the product.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddProduct = async (req, res, next) => {
  try {
    const { productName, companyMasterID } = await req.body;

    const existingProductName = await Product.findOne({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('productName'))
            ),
            productName.trim().toLowerCase()
          ),
          { companyMasterID },
          { status: [0, 1] },
        ],
      },
    });

    if (existingProductName) {
      throw new CustomError(
        message.usermessage.alreadyExists('Product'),
        statusCodes.BAD_REQUEST
      );
    }

    let productPhoto;
    if (req.file) productPhoto = req.file.filename;

    await Product.create({
      productName,
      productPhoto,
      companyMasterID,
      createBy: req.userDetails.userMasterId,
      createByIp: req.userDetails.userIpAddress,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Product'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all product data
 */

exports.getAllProductData = async (req, res, next) => {
  try {
    const { limit, page, id, exportData } = await req.body;

    const condition = {};
    condition.status = 1;

    if (id) condition.companyMasterID = id;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const productData = await Product.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMaster }],
      order: [['productName', 'ASC']],
    });

    if (exportData) {
      const finalData = productData.rows.map((e) => {
        return {
          ProductName: e.productName,
          CompanyName: e.companyMaster.companyName,
          Status: e.Status == 0 ? 'Deactive' : 'Active',
        };
      });

      await generateExcel(finalData, 'Product', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: productData.rows,
      totalcount: productData.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with product id
 *
 * @param {id} productID  to fetch product name
 */

exports.getProductById = async (req, res, next) => {
  try {
    let get_one_data = await Product.findOne({
      where: {
        productID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ model: companyMaster }],
    });

    if (get_one_data.productPhoto) {
      get_one_data.productPhoto =
        process.env.APIURL +
        'uploads/product/photo/' +
        get_one_data.productPhoto;
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch product name
 */

exports.getProductByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          productName: {
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
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const product = await Product.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
      ],
    });

    if (exportData) {
      const finalData = [];
      for (let i = 0; i < product.rows.length; i++) {
        const data1 = {
          ProductName: product.rows[i].productName,
          CompanyName: product.rows[i]['companyMaster.companyName'],
          Status: product.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Product', 'xlsx', res);
      return;
    }

    for (let i = 0; i < product.rows.length; i++) {
      if (product.rows[i].productPhoto) {
        product.rows[i].productPhoto =
          process.env.APIURL +
          'uploads/product/photo/' +
          product.rows[i].productPhoto;
      }
    }

    return res.status(200).json({
      status: 200,
      data: product.rows,
      totalcount: product.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} productID  to update id
 */
exports.postUpdateProduct = async (req, res, next) => {
  try {
    const { productID, productName, companyMasterID } = await req.body;

    const existingProductName = await Product.findOne({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('productName'))
            ),
            productName.trim().toLowerCase()
          ),
          { companyMasterID },
          { status: [0, 1] },
          { productID: { [Sequelize.Op.ne]: productID } },
        ],
      },
    });

    if (existingProductName) {
      throw new CustomError(
        message.usermessage.alreadyExists('Product'),
        statusCodes.BAD_REQUEST
      );
    }

    let productPhoto;
    if (req.file) productPhoto = req.file.filename;

    await Product.update(
      {
        productName,
        productPhoto,
        companyMasterID,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: { productID: productID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Product'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} productID  to update status of product
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { productID, status } = await req.body;

    if (status != '1') {
      let existingVisit = await Visit.findOne({
        where: {
          productID,
          status: ['0', '1'],
        },
      });
      if (existingVisit) {
        // throw new CustomError(
        //   'You can not deactivate this Product.Already used in visits.',
        //   statusCodes.BAD_REQUEST
        // );
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Product.Already used in visits.',
          data: {},
        });
      }
    }

    await Product.update(
      {
        status,
      },
      {
        where: { productID, status: ['1', '0'] },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Product')
          : message.usermessage.deactiveMessage('Product'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} productID  to delete id
 */
exports.postDeleteProductById = async (req, res, next) => {
  try {
    let { productID } = await req.body;

    let existingVisit = await Visit.findOne({
      where: {
        productID: productID,
        status: ['0', '1'],
      },
    });

    if (existingVisit) {
      throw new CustomError(
        'You can not delete this Product.Already used in visits.',
        statusCodes.BAD_REQUEST
      );
    } else {
      await Product.update(
        {
          status: 2,
        },
        {
          where: { productID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.deleteMessage('Product'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getAllProductByChild_Parent = async (req, res, next) => {
  try {
    const condition = { status: 1 };

    const companyData = await companyMaster.findOne({
      where: {
        companyMasterID: req.params.id,
      },
    });

    const companyid = await ChildParentCompanyIds(req.params.id);
    companyData.parentCompanyMasterID == 0
      ? (condition.companyMasterID = companyid)
      : (condition.companyMasterID = companyData.companyMasterID);

    const productData = await Product.findAndCountAll({
      where: condition,
      include: [{ model: companyMaster }],
    });

    return res.status(200).json({
      status: 200,
      data: productData.rows,
      totalcount: productData.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadProduct = async (req, res, next) => {
  if (!req.file) return res.status(400).send('Please upload an excel file!');

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const rows = await readXlsxFile(filePath);

    // skip header
    rows.shift();
    const Products = [];

    for (let row of rows) {
      const UniqueData = await Product.findOne({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn(
                'TRIM',
                sequelize.fn('LOWER', sequelize.col('productName'))
              ),
              row[0].trim().toLowerCase()
            ),
            { companyMasterID },
            { status: [0, 1] },
          ],
        },
      });

      if (UniqueData.length > 0) {
        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('delete');
          }
        });

        throw new CustomError(
          message.usermessage.alreadyExists('Product with the same name'),
          statusCodes.BAD_REQUEST
        );
      }

      const product = {
        productName: row[0],
        companyMasterID: req.body.companyMasterID,
        status: 1,
        createBy: req.body.createBy,
        createByIp: req.body.createByIp,
      };
      Products.push(product);
    }

    await sequelize.transaction(async (t) => {
      await Division.bulkCreate(Products, { transaction: t });
    });

    fs.unlink(filePath, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log('delete');
      }
    });

    return res.status(200).send({
      status: 200,
      message: 'File Upload Successfully: ' + req.file.originalname,
    });
  } catch (error) {
    next(error);
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
        const productName = row[0]; // Assuming the Product name is in the first column
        let productMaster = {
          productName: productName,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.productName &&
            typeof s.productName === 'string' &&
            s.productName.toLowerCase() ===
              productMaster.productName.toLowerCase()
        );

        if (duplicateInExcel) {
          productMaster.remarks = 'Duplicate Product Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            productName: {
              [Sequelize.Op.iLike]: productMaster.productName,
            },
          };

          const uniquedata = await Product.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            productMaster.remarks = 'Product Already Exists';
          }
        }

        data.push(productMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: 'Product Validate SuccessFully',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateProduct = async (req, res, next) => {
  try {
    const { productName, companyMasterID } = req.body;

    let data = [];
    for (const row of productName) {
      if (row != null && row != '') {
        let productMaster = {
          productName: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.productName.trim().toLowerCase() ===
            productMaster.productName.trim().toLowerCase()
        );

        if (duplicateInData) {
          productMaster.remarks = 'Duplicate Product Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.productName = {
            [Sequelize.Op.iLike]: productMaster.productName,
          };
          let uniquedata = await Product.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            productMaster.remarks = 'Product Already Exists';
          }
        }

        data.push(productMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: 'Product Re-Validate SuccessFully',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { productName, companyMasterID } = req.body;

    await Product.bulkCreate(
      productName.map((item) => ({
        productName: item.trim(),
        companyMasterID,
        status: 1,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Product'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
