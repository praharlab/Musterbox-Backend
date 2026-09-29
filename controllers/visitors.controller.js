const Visitors = require('../models/visitors');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const xlsx = require('xlsx');
const GetPass = require('../models/gatePass');
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

//Import Excel Visitor
exports.uploadexcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(400)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }
  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let visitor = [];
    for (let i = 0; i < data.length; i++) {
      if (
        data[i]['visitorsFirstName'] &&
        data[i]['visitorsPhone'] &&
        data[i]['visitorsComapny']
      ) {
        const visitorsPhone = data[i]['visitorsPhone'].toString();

        const existingVisitor = await Visitors.findOne({
          where: { visitorsPhone: visitorsPhone },
        });

        if (existingVisitor) {
          visitor.push(data[i]['visitorsFirstName']);
        } else {
          await Visitors.create({
            visitorsFirstName: data[i]['visitorsFirstName'],
            visitorsPhone: visitorsPhone,
            visitorsComapny: data[i]['visitorsComapny'],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      } else {
        console.log('Missing data for visitor:', data[i]);
      }
    }

    if (visitor.length > 0) {
      res.status(200).json({
        status: 200,
        message: `Visitor '${visitor.join(
          ', '
        )}' already exists in the database.`,
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

exports.postAddvisitors = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      visitorsFirstName,
      visitorsLastName,
      visitorsPhone,
      visitorsComapny,
      companyMasterID,
      visitorPhoto,
      status,
      createBy,
      createByIp,
    } = await req.body;

    if (req.file) {
      visitorPhoto = path.join(`uploads/visitors/${req.file.filename}`);
    }

    // let result = await sequelize.transaction(async (t) => {
    const insert_db_status = await Visitors.create(
      {
        visitorsFirstName,
        visitorsLastName,
        visitorsPhone,
        visitorsComapny,
        companyMasterID,
        visitorPhoto,
        status,
        createBy,
        createByIp,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitorsadd,
      data: insert_db_status,
    });
    // });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * find data with Visitors id
 *
 * @param {id} visitorsID  to fetch city name
 */

exports.getvisitorsId = async (req, res, next) => {
  try {
    let get_one_data = await Visitors.findOne({
      where: { visitorsid: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} visitorsID  to update id
 */
exports.postUpdatevisitors = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      visitorsid,
      visitorsFirstName,
      visitorsLastName,
      visitorsPhone,
      visitorsComapny,
      visitorPhoto,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    if (req.file) {
      visitorPhoto = path.join(`../uploads/visitors/${req.file.filename}`);
    }

    // const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    await Visitors.update(
      {
        visitorsFirstName,
        visitorsLastName,
        visitorsPhone,
        visitorsComapny,
        visitorPhoto,
        companyMasterID,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { visitorsid: visitorsid },
        transaction,
      }
    );

    transaction.commit();
    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.visitorsupdate });
  } catch (err) {
    transaction.rollback();
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} visitorsID  to delete id
 */
exports.postDeletevisitorsById = async (req, res, next) => {
  try {
    let { visitorsid } = await req.body;
    let data = await GetPass.findOne({
      where: {
        visitorsid: visitorsid,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message: 'You can not delete this Visitor.Already used in gate pass.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await Visitors.update(
          {
            status: '2',
          },
          {
            where: { visitorsid: visitorsid },
            transaction: t,
          }
        );

        res
          .status(200)
          .json({ status: 200, message: message.usermessage.visitorsdelete });
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { visitorsid, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Visitors.update(
          {
            status: '1',
          },
          {
            where: { visitorsid: visitorsid, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await GetPass.findOne({
          where: {
            visitorsid: visitorsid,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Visitor.Already used in gate pass.',
          });
        } else {
          delete_status = await Visitors.update(
            {
              status: '0',
            },
            {
              where: { visitorsid: visitorsid, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.visitorsdelete,
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

exports.getvisitorscompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          visitorsFirstName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
        },
        { visitorsLastName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { visitorsPhone: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { visitorsComapny: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
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

    const visitors = await Visitors.findAndCountAll({
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

    for (var j = 0; j < visitors.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: visitors.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: visitors.rows[j].updateBy,
        },
      });

      if (user1) {
        visitors.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        visitors.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < visitors.rows.length; i++) {
        const data1 = {
          VisitorsFirstName: visitors.rows[i].visitorsFirstName,
          VisitorsPhone: visitors.rows[i].visitorsPhone,
          VisitorsComapny: visitors.rows[i].visitorsComapny,
          CompanyName: visitors.rows[i].companyMaster.companyName,
          Status: visitors.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Visitors', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: visitors.rows,
      totalcount: visitors.count,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.getvisitorsByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await Visitors.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
exports.getactivevisitorsbycompanyid = async (req, res, next) => {
  try {
    let visitors;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    visitors = await Visitors.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },

      include: [{ model: companyMasters }],
    });

    res.status(200).json({ status: 200, data: visitors });
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
      if (row[0] != null && row[0].trim() != '') {
        let visitorsMaster = {
          visitorsFirstName: row[0].trim(),
          visitorsLastName: row[1].trim(),
          visitorsPhone: row[2],
          visitorsComapny: row[3],
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateFirstNameInExcel = data.find(
          (s) =>
            s.visitorsFirstName &&
            typeof s.visitorsFirstName === 'string' &&
            s.visitorsFirstName.toLowerCase() ===
              visitorsMaster.visitorsFirstName.toLowerCase()
        );
        const duplicateLastNameInExcel = data.find(
          (s) =>
            s.visitorsLastName &&
            typeof s.visitorsLastName === 'string' &&
            s.visitorsLastName.toLowerCase() ===
              visitorsMaster.visitorsLastName.toLowerCase()
        );

        if (duplicateFirstNameInExcel && duplicateLastNameInExcel) {
          visitorsMaster.remarks = 'Duplicate Visitors Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            [Sequelize.Op.and]: [
              {
                visitorsFirstName: {
                  [Sequelize.Op.iLike]: visitorsMaster.visitorsFirstName,
                },
              },
              {
                visitorsLastName: {
                  [Sequelize.Op.iLike]: visitorsMaster.visitorsLastName,
                },
              },
            ],
          };

          const uniquedata = await Visitors.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            visitorsMaster.remarks = 'Visitors Already Exists';
          }
        }
        data.push(visitorsMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitorValidate,
      data: data,
    });
  } catch (error) {
    next(error);
    // res.status(500).send({
    //   message: 'Could not upload the file: ' + req.file.originalname,
    // });
  }
};

exports.revalidateVisitors = async (req, res, next) => {
  try {
    const { visitorsData, companyMasterID } = req.body;
    let data = [];

    for (const row of visitorsData) {
      // Ensure the row is an object and has the required fields
      if (
        row.visitorsFirstName &&
        row.visitorsFirstName.trim() !== '' &&
        row.visitorsLastName &&
        row.visitorsLastName.trim() !== ''
      ) {
        let visitorsMaster = {
          visitorsFirstName: row.visitorsFirstName.trim(),
          visitorsLastName: row.visitorsLastName.trim(),
          visitorsPhone: row.visitorsPhone,
          visitorsComapny: row.visitorsComapny,
          remarks: '',
        };

        // Check for duplicates in `data` array
        const duplicateFirstNameInExcel = data.find(
          (s) =>
            s.visitorsFirstName &&
            typeof s.visitorsFirstName === 'string' &&
            s.visitorsFirstName.toLowerCase() ===
              visitorsMaster.visitorsFirstName.toLowerCase()
        );
        const duplicateLastNameInExcel = data.find(
          (s) =>
            s.visitorsLastName &&
            typeof s.visitorsLastName === 'string' &&
            s.visitorsLastName.toLowerCase() ===
              visitorsMaster.visitorsLastName.toLowerCase()
        );

        if (duplicateFirstNameInExcel && duplicateLastNameInExcel) {
          visitorsMaster.remarks = 'Duplicate Visitors Name in Data';
        } else {
          // Check for duplicates in the database
          const condition = {
            companyMasterID: companyMasterID,
            status: [0, 1],
            [Sequelize.Op.and]: [
              {
                visitorsFirstName: {
                  [Sequelize.Op.iLike]: visitorsMaster.visitorsFirstName,
                },
              },
              {
                visitorsLastName: {
                  [Sequelize.Op.iLike]: visitorsMaster.visitorsLastName,
                },
              },
            ],
          };

          const uniquedata = await Visitors.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            visitorsMaster.remarks = 'Visitors Already Exists';
          }
        }

        // Add the processed designation to the `data` array
        data.push(visitorsMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitorReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateVisitors = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { visitorsData, companyMasterID } = req.body;

    await Visitors.bulkCreate(
      visitorsData.map((item) => ({
        visitorsFirstName: item.visitorsFirstName.trim(),
        visitorsLastName: item.visitorsLastName.trim(),
        visitorsPhone: item.visitorsPhone,
        visitorsComapny: item.visitorsComapny,
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
      message: message.usermessage.visitorsadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
