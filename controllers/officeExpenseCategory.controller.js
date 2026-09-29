const { Sequelize } = require('sequelize');
const companyMaster = require('../models/companyMaster');
const OfficeExpenseCategory = require('../models/officeExpenseCategory');
const message = require('../response_message/message');
const { generateExcelForOfficeExpenseCategory, generateDemoExcelForOfficeExpenseCategory } = require('../utils/exportData');
const path = require('path');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const sequelize = require('../config/database');
const OfficeExpenseHead = require('../models/officeExpenseHead');

exports.postAddOfficeExpenseCategory = async (req, res, next) => {
    try {
        const { officeExpenseCategory, companyMasterID } = req.body;

        const existData = await OfficeExpenseCategory.findOne({
            where: {
                officeExpenseCategory,
                companyMasterID
            }
        })
        
        if (existData) {
            return res.status(200).json({
                status: 401,
                message: message.usermessage.alreadyExists('Office expense category')
            });
        }

        await OfficeExpenseCategory.create({
            officeExpenseCategory,
            companyMasterID
        },{
            user: req.userDetails
        });

        res.status(200).json({
            status: 200,
            message: message.usermessage.addMessage('Office expense category'),
        });
    } catch (err) {
        next(err);
    }
}

exports.getAllOfficeExpenseCategory = async (req, res, next) => {
  try {
    const { companyMasterID, page, limit, exportData } = req.body;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows, count } = await OfficeExpenseCategory.findAndCountAll({
      where: {
        companyMasterID
      },
      order: [['createdAt', 'DESC']],
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        }
      ],
    });

    if (exportData) {
      const finalData = rows.map((x) => {
        return {
          officeExpenseCategory: x.officeExpenseCategory,
          companyName: x.companyMaster.companyName,
          status: x.status == '1' ? 'Active' : 'Deactive'
        }
      });

      return await generateExcelForOfficeExpenseCategory(
        finalData,
        `OfficeExpenseCategory`,
        'xlsx',
        res
      );
    }

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
}

exports.getOfficeExpenseCategoryByID = async (req, res, next) => {
  try {
    const officeExpenseCategoryID = req.params.id;

    if (!officeExpenseCategoryID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const data = await OfficeExpenseCategory.findOne({
      where: {
        officeExpenseCategoryID
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        }
      ],
    });

    return res.status(200).json({
      status: 200,
      data: data
    });
  } catch (error) {
    next(error);
  }
}

exports.updateOfficeExpenseCategory = async (req, res, next) => {
  try {
    const { officeExpenseCategory, officeExpenseCategoryID } = req.body;

    const existData = await OfficeExpenseCategory.findOne({
      where: {
        officeExpenseCategoryID
      },
    });

    if (!existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Office expense category'),
      });
    }

    existData.officeExpenseCategory = officeExpenseCategory;

    await existData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Office expense category'),
    });
  } catch (error) {
    next(error);
  }
}

exports.deleteOfficeExpenseCategory = async (req, res, next) => {
  try {
    const officeExpenseCategoryID = req.params.id;

    if (!officeExpenseCategoryID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Office expense category')
      });
    }

    let data = await OfficeExpenseHead.findOne({
      where: {
        officeExpenseCategoryID: officeExpenseCategoryID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Office Expense Category. Already used in Office Expense Head.',
      });
    }

    await OfficeExpenseCategory.destroy({
      where: {
        officeExpenseCategoryID
      },
      user: req.userDetails,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Office expense category'),
    });
  } catch (error) {
    next(error);
  }
};

exports.generateDemoExcelForOfficeExpenseCategory = async (req, res, next) => {
  try {
    return await generateDemoExcelForOfficeExpenseCategory(
      [],
      `OfficeExpenseCategory`,
      'xlsx',
      res
    )
  } catch (error) {
    next(error)
  }
}

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
        const officeExpenseCategory = row[0];
        let officeExpenseCategoryMaster = {
          officeExpenseCategory: officeExpenseCategory,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.officeExpenseCategory &&
            typeof s.officeExpenseCategory === 'string' &&
            s.officeExpenseCategory.toLowerCase() ===
            officeExpenseCategoryMaster.officeExpenseCategory.toLowerCase()
        );

        if (duplicateInExcel) {
          officeExpenseCategoryMaster.remarks =
            'Duplicate Office Expense Category Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            officeExpenseCategory: {
              [Sequelize.Op.iLike]: officeExpenseCategoryMaster.officeExpenseCategory,
            },
          };

          const uniquedata = await OfficeExpenseCategory.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            officeExpenseCategoryMaster.remarks = 'Office Expense Category Already Exists';
          }
        }

        data.push(officeExpenseCategoryMaster);
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

exports.reValidateOfficeExpenceCategory = async (req, res, next) => {
  try {
    const { officeExpenseCategory, companyMasterID } = req.body;

    let data = [];
    for (const row of officeExpenseCategory) {
      if (row != null && row != '') {
        let expenseCategoryMaster = {
          officeExpenseCategory: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.officeExpenseCategory.trim().toLowerCase() ===
            expenseCategoryMaster.officeExpenseCategory.trim().toLowerCase()
        );

        if (duplicateInData) {
          expenseCategoryMaster.remarks =
            'Duplicate Office Expense Category Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.officeExpenseCategory = {
            [Sequelize.Op.iLike]: expenseCategoryMaster.officeExpenseCategory,
          };
          let uniquedata = await OfficeExpenseCategory.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            expenseCategoryMaster.remarks = 'Office Expense Category Already Exists';
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

exports.addValidateOfficeExpenseCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { officeExpenseCategory, companyMasterID } = req.body;

    await OfficeExpenseCategory.bulkCreate(
      officeExpenseCategory.map((item) => ({
        officeExpenseCategory: item.trim(),
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

exports.postStatusChange = async (req, res, next) => {
  try {
    let { officeExpenseCategoryID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await OfficeExpenseCategory.update(
        {
          status: '1',
        },
        {
          where: { officeExpenseCategoryID: officeExpenseCategoryID, status: ['1', '0'] },
        }
      );
    } else {
      let data = await OfficeExpenseHead.findOne({
        where: {
          officeExpenseCategoryID: officeExpenseCategoryID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Office Expense Category. Already used in Office Expense Head.',
        });
      } else {
        delete_status = await OfficeExpenseCategory.update(
          {
            status: '0',
          },
          {
            where: { officeExpenseCategoryID: officeExpenseCategoryID, status: ['1', '0'] },
          }
        );
      }
    }

    if (status == '1') {
      res.status(200).json({
        status: 200,
        message: message.usermessage.activeMessage('Office expense category'),
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deactiveMessage('Office expense category'),
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
}