const expenseCategory = require('../models/expenseCategory');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const xlsx = require('xlsx');
const expenseHead = require('../models/expenseHead');
const { generateExcel } = require('../utils/exportData');
const ExpenseCategory = require('../models/expenseCategory');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.uploadexcel = async (req, res) => {
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

    let expense = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const expenseCategoryData = data[i][0];

        // Check if the expense category already exists (case-insensitive)
        const existingExpense = await expenseCategory.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('expenseCategory')),
              expenseCategoryData.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('expenseCategory')),
              expenseCategoryData.toString().toUpperCase()
            )
          ),
        });

        if (existingExpense) {
          expense.push(data[i][0]);
        } else {
          await expenseCategory.create({
            expenseCategory: data[i][0],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (expense.length > 0) {
      res.status(200).json({
        status: 200,
        message: `Expense categories '${expense.join(
          ', '
        )}' already exist in the database.`,
      });
    } else {
      res.status(200).json({
        status: 200,
        message: 'Data inserted successfully',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

exports.postAddexpenseCategory = async (req, res, next) => {
  try {
    let = { expenseCategory1, companyMasterID, createBy, createByIp } =
      await req.body;
    let insert_db_status = await expenseCategory.create({
      expenseCategory: expenseCategory1,
      companyMasterID,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.expensecategoryadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllexpenseCategory = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let expensecategory, totalcount;
    if (searchQuery) {
      expensecategory = await expenseCategory.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              expenseCategory: {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('expenseCategory.expenseCategoryId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      totalcount = expensecategory.length;
    } else if (page == '' && limit == '') {
      expensecategory = await expenseCategory.findAll({
        raw: true,
        where: { status: '1' },
        include: [{ all: true, nested: true }],
      });
      totalcount = await expenseCategory.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      expensecategory = await expenseCategory.findAll({
        raw: true,
        where: { status: ['0', '1'] },
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      totalcount = await expenseCategory.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.expensecategoryget,
      data: expensecategory,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with expenseCategory id
 *
 * @param {id} expenseCategoryID  to fetch city name
 */

exports.getexpenseCategoryId = async (req, res, next) => {
  try {
    let get_one_data = await expenseCategory.findOne({
      where: { expenseCategoryId: req.params.id, status: ['0', '1'] },
      raw: true,
    });
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} expenseCategoryID  to update id
 */
exports.postUpdateexpenseCategory = async (req, res, next) => {
  try {
    let = {
      expenseCategoryId,
      expenseCategory1,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await expenseCategory.update(
      {
        expenseCategory: expenseCategory1,
        companyMasterID,
        updateBy,
        updateByIp,
      },
      {
        where: { expenseCategoryId: expenseCategoryId },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.expensecategoryupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} expenseCategoryID  to delete id
 */
exports.postDeleteexpenseCategoryById = async (req, res, next) => {
  try {
    let { expenseCategoryId } = await req.body;

    let data = await expenseHead.findOne({
      where: {
        expenseCategoryId: expenseCategoryId,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Expense Category. Already used in Expense Head.',
      });
    } else {
      let delete_status = await expenseCategory.update(
        {
          status: '2',
        },
        {
          where: { expenseCategoryId: expenseCategoryId },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.expensecategorydelete,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { expenseCategoryId, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await expenseCategory.update(
        {
          status: '1',
        },
        {
          where: { expenseCategoryId: expenseCategoryId, status: ['1', '0'] },
        }
      );
    } else {
      let data = await expenseHead.findOne({
        where: {
          expenseCategoryId: expenseCategoryId,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Expense Category. Already used in Expense Head.',
        });
      } else {
        delete_status = await expenseCategory.update(
          {
            status: '0',
          },
          {
            where: { expenseCategoryId: expenseCategoryId, status: ['1', '0'] },
          }
        );
      }
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.expensecategorydelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getexpenseCategorycompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          expenseCategory: {
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

    const ecpense_Category = await expenseCategory.findAndCountAll({
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

      for (let i = 0; i < ecpense_Category.rows.length; i++) {
        const data1 = {
          ExpenseCategory: ecpense_Category.rows[i].expenseCategory,
          CompanyName: ecpense_Category.rows[i]['companyMaster.companyName'],
          Status: ecpense_Category.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'ExpenseCategory', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: ecpense_Category.rows,
      totalcount: ecpense_Category.count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getexpenseCategoryByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await expenseCategory.findAll({
      where: {
        companyMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
exports.getactiveexpensecategorybycompanyid = async (req, res, next) => {
  try {
    let expensecategory;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
      raw: true,
      include: [{ all: true, nested: true }],
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    expensecategory = await expenseCategory.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: ['0', '1'],
      },
      raw: true,
      include: [{ all: true, nested: true }],
    });

    res.status(200).json({ status: 200, data: expensecategory });
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
        const expenseCategory = row[0]; // Assuming the Expense Category name is in the first column
        let expenseCategoryMaster = {
          expenseCategory: expenseCategory,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.expenseCategory &&
            typeof s.expenseCategory === 'string' &&
            s.expenseCategory.toLowerCase() ===
              expenseCategoryMaster.expenseCategory.toLowerCase()
        );

        if (duplicateInExcel) {
          expenseCategoryMaster.remarks =
            'Duplicate Expense Category Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            expenseCategory: {
              [Sequelize.Op.iLike]: expenseCategoryMaster.expenseCategory,
            },
          };

          const uniquedata = await ExpenseCategory.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            expenseCategoryMaster.remarks = 'Expense Category Already Exists';
          }
        }

        data.push(expenseCategoryMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.expenseCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateExpenceCategory = async (req, res, next) => {
  try {
    const { expenseCategory, companyMasterID } = req.body;

    let data = [];
    for (const row of expenseCategory) {
      if (row != null && row != '') {
        let expenseCategoryMaster = {
          expenseCategory: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.expenseCategory.trim().toLowerCase() ===
            expenseCategoryMaster.expenseCategory.trim().toLowerCase()
        );

        if (duplicateInData) {
          expenseCategoryMaster.remarks =
            'Duplicate Expense Category Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.expenseCategory = {
            [Sequelize.Op.iLike]: expenseCategoryMaster.expenseCategory,
          };
          let uniquedata = await ExpenseCategory.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            expenseCategoryMaster.remarks = 'Expense Category Already Exists';
          }
        }

        data.push(expenseCategoryMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.expenseCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateExpenseCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { expenseCategory, companyMasterID } = req.body;

    await ExpenseCategory.bulkCreate(
      expenseCategory.map((item) => ({
        expenseCategory: item.trim(),
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.expenseCategoryadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
