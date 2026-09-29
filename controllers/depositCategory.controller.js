const DepositCategory = require('../models/depositCategory');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Deposit = require('../models/deposit');

const xlsx = require('xlsx');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postUploadExcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload and excel file!' });
  }
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    //read the Excel file
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let deposit = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const depositcategoryname = data[i][0];
        const existingDeposit = await DepositCategory.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('depositcategoryname')),
              depositcategoryname.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('depositcategoryname')),
              depositcategoryname.toString().toUpperCase()
            )
          ),
        });

        if (existingDeposit) {
          deposit.push(data[i][0]);
        } else {
          await DepositCategory.create({
            depositcategoryname: data[i][0],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (deposit.length > 0) {
      res.status(200).json({
        status: 200,
        message:
          'Depositcategory ' +
          deposit +
          'already exist and other DepositCategory  inserted successfully',
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

exports.postAddDepositCategory = async (req, res, next) => {
  try {
    let { depositcategoryname, companyMasterID, status, createBy, createByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await DepositCategory.create(
        {
          depositcategoryname,
          companyMasterID,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.depositCategoryadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with DepositCategory id
 *
 * @param {id} DepositCategoryID  to fetch city name
 */

exports.getDepositCategoryId = async (req, res, next) => {
  try {
    let get_one_data = await DepositCategory.findOne({
      where: { depositcategoryid: req.params.id, status: ['0', '1'] },
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
 * @param {id} DepositCategoryID  to update id
 */
exports.postUpdateDepositCategory = async (req, res, next) => {
  try {
    let {
      depositcategoryid,
      depositcategoryname,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await DepositCategory.update(
        {
          depositcategoryname,
          companyMasterID,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { depositcategoryid: depositcategoryid },
          transaction: t,
        }
      );
      res.status(200).json({
        status: 200,
        message: message.usermessage.depositCategoryupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} DepositCategoryID  to delete id
 */
exports.postDeleteDepositCategoryById = async (req, res, next) => {
  try {
    let { depositcategoryid } = await req.body;

    let data = await Deposit.findOne({
      where: {
        depositCategoryID: depositcategoryid,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Deposit Category.Already used in deposit.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await DepositCategory.update(
          {
            status: '2',
          },
          {
            where: { depositcategoryid: depositcategoryid },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.depositCategorydelete,
        });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { depositcategoryid, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await DepositCategory.update(
          {
            status: '1',
          },
          {
            where: { depositcategoryid: depositcategoryid, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await Deposit.findOne({
          where: {
            depositCategoryID: depositcategoryid,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Deposit Category.Already used in deposit.',
          });
        } else {
          delete_status = await DepositCategory.update(
            {
              status: '0',
            },
            {
              where: {
                depositcategoryid: depositcategoryid,
                status: ['1', '0'],
              },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.depositCategorydelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepositCategorycompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          depositcategoryname: {
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

    const deposit_Category = await DepositCategory.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
      ],
    });

    for (var j = 0; j < deposit_Category.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: deposit_Category.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: deposit_Category.rows[j].updateBy,
        },
      });

      if (user1) {
        deposit_Category.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        deposit_Category.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < deposit_Category.rows.length; i++) {
        const data1 = {
          DepositCategoryName: deposit_Category.rows[i].depositcategoryname,
          CompanyName: deposit_Category.rows[i].companyMaster.companyName,
          Status: deposit_Category.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'DepositCategory', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: deposit_Category.rows,
      totalcount: deposit_Category.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getDepositCategoryByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await DepositCategory.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
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

exports.getactivedepositCategorybycompanyid = async (req, res, next) => {
  try {
    let depositCategory;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    depositCategory = await DepositCategory.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },
    });

    res.status(200).json({ status: 200, data: depositCategory });
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload and excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // const path = './uploads/' + req.file.filename;
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const data = [];

    for (const row of rows) {
      if (row && row.length > 0) {
        const depositcategoryname = row[0]; // Assuming the Deposit Category name is in the first column
        let depositCategoryMaster = {
          depositcategoryname: depositcategoryname,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.depositcategoryname &&
            typeof s.depositcategoryname === 'string' &&
            s.depositcategoryname.toLowerCase() ===
              depositCategoryMaster.depositcategoryname.toLowerCase()
        );

        if (duplicateInExcel) {
          depositCategoryMaster.remarks =
            'Duplicate Deposit Category Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            depositcategoryname: {
              [Sequelize.Op.iLike]: depositCategoryMaster.depositcategoryname,
            },
          };

          const uniquedata = await DepositCategory.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            depositCategoryMaster.remarks = 'Deposit Category Already Exists';
          }
        }

        data.push(depositCategoryMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.depositCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateDepositCategory = async (req, res, next) => {
  try {
    const { depositcategoryname, companyMasterID } = req.body;

    let data = [];
    for (const row of depositcategoryname) {
      if (row != null && row != '') {
        let departmentmaster = {
          depositcategoryname: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.depositcategoryname.trim().toLowerCase() ===
            departmentmaster.depositcategoryname.trim().toLowerCase()
        );

        if (duplicateInData) {
          departmentmaster.remarks = 'Duplicate Deposit Category Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          (condition.status = [0, 1]),
            (condition.depositcategoryname = {
              [Sequelize.Op.iLike]: departmentmaster.depositcategoryname,
            });
          let uniquedata = await DepositCategory.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            departmentmaster.remarks = 'Deposit Category Already Exists';
          }
        }

        data.push(departmentmaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.depositCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateDepositCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { depositcategoryname, companyMasterID } = req.body;

    await DepositCategory.bulkCreate(
      depositcategoryname.map((item) => ({
        depositcategoryname: item.trim(),
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.depositCategoryadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
