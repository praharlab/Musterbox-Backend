const Sequelize = require('sequelize');
const ProductMaster = require('../models/productMaster');
const ProductPermission = require('../models/productPermission');

const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const FormMaster = require('../models/formMaster');
/**
 * save product data.
 *
 * @body {createBy} createBy user id of user who added the product.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddProduct = async (req, res, next) => {
  try {
    const {
      formarray,
      productName,
      productCode,
      productPrice,
      description,
      totalUser,
      totalTracking,
      createBy,
      createByIp,
    } = await req.body;
    console.log(req.body);

    const transaction = await sequelize.transaction();

    try {
      const insert_db_status = await ProductMaster.create(
        {
          productName,
          productCode,
          productPrice,
          description,
          productPrice,
          totalUser,
          totalTracking,
          createBy,
          createByIp,
        },
        { transaction }
      );

      for (let item of formarray) {
        item.productMasterID = insert_db_status.productMasterID;
        item.productPermissionID = null;
      }

      await ProductPermission.bulkCreate(formarray, { transaction });

      await transaction.commit();

      res.status(200).json({
        status: 200,
        message: message.usermessage.productadd,
        data: {},
      });
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      res.status(200).send({
        status: 401,
        message: 'Fail to import data!',
        error: error.message,
        data: formarray,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all product data
 */

exports.getAllProductData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let product_master = [],
      totalcount;
    if (searchQuery) {
      product_master = await ProductMaster.findAll({
        where: {
          [Sequelize.Op.or]: [
            { productName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { productCode: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              [Sequelize.Op.or]: [
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.totalUser'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.totalTracking'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.productPrice'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
              ],
            },
          ],
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
      });
      totalcount = await ProductMaster.count({
        where: {
          [Sequelize.Op.or]: [
            { productName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            { productCode: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              [Sequelize.Op.or]: [
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.totalUser'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.totalTracking'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
                sequelize.where(
                  sequelize.cast(
                    sequelize.col('productMaster.productPrice'),
                    'varchar'
                  ),
                  { [Sequelize.Op.iLike]: `%${searchQuery}%` }
                ),
              ],
            },
          ],
          status: ['0', '1'],
        },
      });
    } else if (limit == '' && page == '') {
      product_master = await ProductMaster.findAll({
        raw: true,
        where: {
          status: 1,
        },
        order: [['productName', 'ASC']],
      });
      totalcount = await ProductMaster.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      product_master = await ProductMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        order: [['productName', 'ASC']],
        limit: limit,
        offset: offset,
      });
      totalcount = await ProductMaster.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: product_master, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with productMaster id
 *
 * @param {id} productMasterID  to fetch product name
 */

exports.getProductById = async (req, res, next) => {
  try {
    let get_one_data = await ProductMaster.findOne({
      where: {
        productMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    let getPermission = [];
    getPermission = await ProductPermission.findAll({
      where: {
        productMasterID: req.params.id,
      },
    });

    for (var i = 0; i < getPermission.length; i++) {
      let getdata = await FormMaster.findOne({
        where: {
          formMasterID: getPermission[i].formMasterID,
          status: 1,
        },
      });
      getPermission[i].dataValues.parent = getdata.parentFormMasterID;
    }

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else
      res.status(200).json({
        stauts: 200,
        data: get_one_data,
        productPermission: getPermission,
      });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} productMasterID  to update id
 */
exports.postUpdateProduct = async (req, res, next) => {
  try {
    let = {
      productMasterID,
      productName,
      productCode,
      productPrice,
      description,
      productPrice,
      totalUser,
      totalTracking,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ProductMaster.update(
        {
          productName,
          productCode,
          productPrice,
          description,
          productPrice,
          totalUser,
          totalTracking,
          updateBy,
          updateByIp,
        },
        {
          where: { productMasterID: productMasterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.productupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateProduct = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      formarray,
      productMasterID,
      productName,
      productCode,
      productPrice,
      description,
      totalUser,
      totalTracking,
      updateBy,
      updateByIp,
    } = await req.body;
    console.log(req.body);

    await ProductMaster.update(
      {
        productName,
        productCode,
        productPrice,
        description,
        productPrice,
        totalUser,
        totalTracking,
        updateBy,
        updateByIp,
      },
      {
        where: { productMasterID: productMasterID },
        transaction,
      }
    );

    await ProductPermission.destroy({
      where: {
        productMasterID: productMasterID,
      },
      force: true,
      transaction,
    });

    for (let item of formarray) {
      item.productMasterID = productMasterID;
    }

    await ProductPermission.bulkCreate(formarray, { transaction });
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Product updated Successfully',
      data: formarray,
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

/**
 * update status
 *
 * @param {id} productMasterID  to update status of product
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { productMasterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ProductMaster.update(
          {
            status: '1',
          },
          {
            where: { productMasterID: productMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await ProductMaster.update(
          {
            status: '0',
          },
          {
            where: { productMasterID: productMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.productdelete,
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
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} productMasterID  to delete id
 */
exports.postDeleteProductById = async (req, res, next) => {
  try {
    let = { productMasterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ProductMaster.update(
        {
          status: 2,
        },
        {
          where: { productMasterID: productMasterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.productdelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
