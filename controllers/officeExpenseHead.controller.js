const companyMaster = require('../models/companyMaster');
const OfficeExpenseCategory = require('../models/officeExpenseCategory');
const OfficeExpenseHead = require('../models/officeExpenseHead');
const message = require('../response_message/message');
const { generateExcelForOfficeExpenseHead, generateDemoExcelForOfficeExpenseHead } = require('../utils/exportData');
const path = require('path');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

exports.postAddOfficeExpenseHead = async (req, res, next) => {
  try {
    const { officeExpenseHead, officeExpenseCategoryID } = req.body;

    const existData = await OfficeExpenseHead.findOne({
      where: {
        officeExpenseHead,
        officeExpenseCategoryID
      }
    })

    if (existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Office expense head')
      });
    }

    await OfficeExpenseHead.create({
      officeExpenseHead,
      officeExpenseCategoryID
    }, {
      user: req.userDetails
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Office expense head'),
    });
  } catch (err) {
    next(err);
  }
}

exports.getAllOfficeExpenseHead = async (req, res, next) => {
  try {
    const { officeExpenseCategoryID, page, limit, companyMasterID, exportData } = req.body;
    const condition = {}

    if (officeExpenseCategoryID) {
      condition.officeExpenseCategoryID = officeExpenseCategoryID;
    }

    const companyCondition = {}
    if (companyMasterID) {
      companyCondition.companyMasterID = companyMasterID;
    }

    const paginationQuery = {};
    if (page && limit && !exportData) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows, count } = await OfficeExpenseHead.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: OfficeExpenseCategory,
          attributes: ['officeExpenseCategory'],
          where: companyCondition,
          include: [
            {
              model: companyMaster,
              attributes: ['companyName'],
            }
          ],
        }
      ],
    });

    if(exportData){
      const finalData = rows.map((x) => {
        return {
          officeExpenseHead: x.officeExpenseHead,
          officeExpenseCategory: x.officeExpenseCategory.officeExpenseCategory,
          companyName: x.officeExpenseCategory.companyMaster.companyName,
          status: x.status == '1' ? 'Active' : 'Deactive'
        }
      })

      return await generateExcelForOfficeExpenseHead(
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

exports.getOfficeExpenseHeadByID = async (req, res, next) => {
  try {
    const officeExpenseHeadID = req.params.id;

    if (!officeExpenseHeadID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const data = await OfficeExpenseHead.findOne({
      where: {
        officeExpenseHeadID
      },
      include: [
        {
          model: OfficeExpenseCategory,
          attributes: ['officeExpenseCategory', 'companyMasterID'],
          include: [
            {
              model: companyMaster,
              attributes: ['companyName'],
            }
          ],
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

exports.updateOfficeExpenseHead = async (req, res, next) => {
  try {
    const { officeExpenseHead, officeExpenseHeadID } = req.body;

    const existData = await OfficeExpenseHead.findOne({
      where: {
        officeExpenseHeadID
      },
    });

    if (!existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Office expense head'),
      });
    }

    existData.officeExpenseHead = officeExpenseHead;

    await existData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Office expense head'),
    });
  } catch (error) {
    next(error);
  }
}

exports.deleteOfficeExpenseHead = async (req, res, next) => {
  try {
    const officeExpenseHeadID = req.params.id;

    if (!officeExpenseHeadID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Office expense head')
      });
    }

    await OfficeExpenseHead.destroy({
      where: {
        officeExpenseHeadID
      },
      user: req.userDetails,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Office expense head'),
    });
  } catch (error) {
    next(error);
  }
};

exports.generateDemoExcelForOfficeExpenseHead = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID } = req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows, count } = await OfficeExpenseCategory.findAndCountAll({
      ...paginationQuery,
      where: {
        companyMasterID
      },
    });

    const finalData = rows.map((x) => x.officeExpenseCategory);

    return await generateDemoExcelForOfficeExpenseHead(
      finalData,
      `OfficeExpenseCategory`,
      'xlsx',
      res
    );
  } catch (error) {
    next(error);
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
      if (row[0] != null && row[0].trim() != '') {
        let getOfficeExpenseCategoryID = await OfficeExpenseCategory.findOne({
          where: {
            officeExpenseCategory: { [Sequelize.Op.iLike]: row[1] },
            companyMasterID: req.body.companyMasterID,
          },
        });
        let officeExpenseHeadMaster = {
          officeExpenseCategoryID: row[1],
          officeExpenseHead: row[0].trim(),
          remarks: '',
        };

        if (getOfficeExpenseCategoryID) {
          officeExpenseHeadMaster.officeExpenseCategoryID =
            getOfficeExpenseCategoryID.officeExpenseCategoryID;
        } else {
          officeExpenseHeadMaster.officeExpenseCategoryID = '';
          officeExpenseHeadMaster.remarks =
            'Office Expense Category Not Exist! Please Add Office Expense Category!!';
        }
        const duplicateInExcel = data.find(
          (s) =>
            s.officeExpenseHead &&
            typeof s.officeExpenseHead === 'string' &&
            s.officeExpenseHead.toLowerCase() ===
              officeExpenseHeadMaster.officeExpenseHead.toLowerCase() &&
            s.officeExpenseCategoryID == officeExpenseHeadMaster.officeExpenseCategoryID
        );

        if (duplicateInExcel) {
          officeExpenseHeadMaster.remarks = 'Duplicate Office Expense Head in Excel';
        } else {
          const condition = {
            // companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            officeExpenseHead: {
              [Sequelize.Op.iLike]: officeExpenseHeadMaster.officeExpenseHead,
            },
          };
          if (getOfficeExpenseCategoryID) {
            condition.officeExpenseCategoryID =
              getOfficeExpenseCategoryID.officeExpenseCategoryID;
          }

          const uniquedata = await OfficeExpenseHead.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            officeExpenseHeadMaster.remarks = 'Office Expense Head Already Exists';
          }
        }
        data.push(officeExpenseHeadMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.officeExpenseheadValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateOfficeExpensehead = async (req, res, next) => {
  try {
    const { officeExpenseHeadData, companyMasterID } = req.body;

    let data = [];
    for (const row of officeExpenseHeadData) {
      // Ensure the row is an object and has the required fields
      if (row.officeExpenseHead && row.officeExpenseHead.trim() !== '') {
        let officeExpenseHeadMaster = {
          officeExpenseHead: row.officeExpenseHead.trim(),
          officeExpenseCategoryID: row.officeExpenseCategoryID,
          remarks: '',
        };

        // Check for duplicates in `data` array
        const duplicateInData = data.some(
          (s) =>
            s.officeExpenseHead.trim().toLowerCase() ===
              officeExpenseHeadMaster.officeExpenseHead.trim().toLowerCase() &&
            s.officeExpenseCategoryID == officeExpenseHeadMaster.officeExpenseCategoryID
        );

        if (duplicateInData) {
          officeExpenseHeadMaster.remarks = 'Duplicate Office Expense Head in Data';
        } else {
          // Check for duplicates in the database
          const condition = {
            // companyMasterID: companyMasterID,
            status: [0, 1],
            officeExpenseHead: {
              [Sequelize.Op.iLike]: officeExpenseHeadMaster.officeExpenseHead,
            },
            officeExpenseCategoryID: officeExpenseHeadMaster.officeExpenseCategoryID,
          };

          const uniquedata = await OfficeExpenseHead.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            officeExpenseHeadMaster.remarks = 'Office Expense Head Already Exists';
          }
        }

        data.push(officeExpenseHeadMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.officeExpenseheadReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
exports.addValidateOfficeExpensehead = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { officeExpenseHeadData } = req.body;

    await OfficeExpenseHead.bulkCreate(
      officeExpenseHeadData.map((item) => ({
        officeExpenseHead: item.officeExpenseHead.trim(),
        officeExpenseCategoryID: item.officeExpenseCategoryID
      })),
      { transaction, user: req.userDetails }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.officeExpenseheadAdd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.postStatusChange = async (req, res, next) => {
  try {
    let { officeExpenseHeadID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await OfficeExpenseHead.update(
        {
          status: '1',
        },
        {
          where: { officeExpenseHeadID: officeExpenseHeadID, status: ['1', '0'] },
        }
      );
    } else {
      let data = false;
      // let data = await userExpenseTransaction.findOne({
      //   where: {
      //     officeExpenseHeadID: officeExpenseHeadID,
      //     status: ['1', '0'],
      //   },
      // });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Office Expense Head. Already used in Expense.',
        });
      } else {
        delete_status = await OfficeExpenseHead.update(
          {
            status: '0',
          },
          {
            where: { officeExpenseHeadID: officeExpenseHeadID, status: ['1', '0'] },
          }
        );
      }
    }

    if (status == '1') {
      res.status(200).json({
        status: 200,
        message: message.usermessage.activeMessage('Office expense head'),
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deactiveMessage('Office expense head'),
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
}