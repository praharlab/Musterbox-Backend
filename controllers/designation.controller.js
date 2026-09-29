const Designation = require('../models/designation');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const readXlsxFile = require('read-excel-file/node');
const UserMaster = require('../models/userMaster');
const { executeQuery } = require('./common.controller');

const EmployeeDesignation = require('../models/employeeDesignation');
const { generateExcel } = require('../utils/exportData');
const { DatabaseOperationEnum } = require('../utils/dbUtils');
const fs = require('fs');
const path = require('path');
const { userAttributes } = require('../utils/commonVars');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddDesignation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      designationName,
      jobdescription,
      companyMasterID,
      status,
    } = await req.body;
    designationName = designationName.trim();
    const dbOperation = DatabaseOperationEnum.CREATE;

    const findDesignation = await Designation.findOne({
      where: {
        designationName: {
          [Sequelize.Op.iLike]: designationName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });

    if (findDesignation) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Designation With Same Name'
        ),
      });
    }

    await Designation.create(
      {
        designationName,
        companyMasterID,
        jobdescription,
        status,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      {
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Designation'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * find data with Designation id
 *
 * @param {id} DesignationID  to fetch city name
 */

exports.getDesignationId = async (req, res, next) => {
  try {
    const getDesignationByID = await Designation.findOne({
      where: { designationId: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    if (!getDesignationByID) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage('Designation'),
      });
    }

    return res.status(200).json({ status: 200, data: getDesignationByID });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} DesignationID  to update id
 */
exports.postUpdateDesignation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      designationId,
      designationName,
      jobdescription,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;
    designationName = designationName.trim();
    const dbOperation = DatabaseOperationEnum.UPDATE;

    const findDesignation = await Designation.findOne({
      where: {
        designationName: {
          [Sequelize.Op.iLike]: designationName,
        },
        companyMasterID: companyMasterID,
        designationId: { [Sequelize.Op.notIn]: [designationId] },
        status: 1,
      },
      transaction,
    });

    if (findDesignation) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Designation'),
        data: {},
      });
    }

    await Designation.update(
      {
        designationName,
        companyMasterID,
        jobdescription,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { designationId: designationId },
        individualHooks: true,
        dbOperation,
        transaction,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Designation'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} DesignationID  to delete id
 */
exports.postDeleteDesignationById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { designationId } = await req.body;
    const dbOperation = DatabaseOperationEnum.DELETE;
    const findDesignationData = await Designation.findOne({
      where: {
        designationId: designationId,
        status: [0, 1],
      },
      transaction,
    });
    if (!findDesignationData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Designation'),
      });
    }
    const findEmployeeDesignation = await EmployeeDesignation.findOne({
      where: {
        designationID: designationId,
        status: ['0', '1'],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          as: 'employee',
          where: {
            status: [0, 1],
          },
        },
      ],
      transaction,
    });

    if (findEmployeeDesignation) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign('Designation', 'Deleted'),
      });
    }

    await Designation.update(
      {
        status: '2',
      },
      {
        where: { designationId: designationId },
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Designation'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { designationId, status } = await req.body;
    const findDesignationData = await Designation.findOne({
      where: {
        designationId: designationId,
        status: [0, 1],
      },
      transaction,
    });

    if (!findDesignationData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Designation'),
      });
    }

    const dbOperation = DatabaseOperationEnum.UPDATE;

    if (status == '0') {
      const findEmployeeDesignation = await EmployeeDesignation.findOne({
        where: {
          designationID: designationId,
          status: ['0', '1'],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            as: 'employee',
            where: {
              status: [0, 1],
            },
          },
        ],
        transaction,
      });

      if (findEmployeeDesignation) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign(
            'Designation',
            'deactivate'
          ),
        });
      }
    }

    await Designation.update(
      {
        status: status,
      },
      {
        where: { designationId: designationId, status: ['1', '0'] },
        individualHooks: true,
        transaction,
        dbOperation,
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Designation')
          : message.usermessage.deactiveMessage('Designation'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getDesignationcompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          designationName: {
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

    const { rows: designationData, count } = await Designation.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [{ model: companyMasters }],
    });

    const uniqueUserIds = new Set();
    designationData.map((row) => {
      if (row.createBy) {
        uniqueUserIds.add(+row.createBy);
      }
      if (row.updateBy) {
        uniqueUserIds.add(+row.updateBy);
      }
    });
    const userData = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: [...uniqueUserIds],
        status: [0, 1],
      },
      attributes: userAttributes,
    });

    for (const designation of designationData) {
      const createUser = userData.find(
        (e) => e.userMasterID == designation.createBy
      );
      designation.createBy = createUser
        ? createUser.displayName
        : designation.createBy;
      if (designation.updateBy) {
        const updateUser = userData.find(
          (e) => e.userMasterID == designation.updateBy
        );
        designation.updateBy = updateUser
          ? updateUser.displayName
          : designation.updateBy;
      }
    }

    if (exportData) {
      const finalData = [];

      for (const designation of designationData) {
        const data1 = {
          DepartmentName: designation.designationName,
          CompanyName: designation['companyMaster.companyName'],
          Status: designation.status == 1 ? 'Active' : 'Deactive',
        };
        finalData.push(data1);
      }
      await generateExcel(finalData, 'Designation', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: designationData,
      totalcount: count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getDesignationByCompanyId = async (req, res, next) => {
  try {
    const get_one_data = await Designation.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.getactivedesignationbycompanyid = async (req, res, next) => {
  try {
    let designation;
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
    designation = await Designation.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: ['0', '1'],
      },
      raw: true,
      include: [{ all: true, nested: true }],
    });

    res.status(200).json({ status: 200, data: designation });
  } catch (err) {
    next(err);
  }
};

exports.uploadexcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    // let path = './uploads/' + req.file.filename;
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let designation = [];
      rows.forEach((row) => {
        if (row[0] != null && row[0].trim() != '') {
          let designationmaster = {
            designationName: row[0].trim(),
            companyMasterID: req.body.companyMasterID,
            status: 1,
            authorizationStatus: 0,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          };
          designation.push(designationmaster);
        }
      });
      let data = [];
      for (var i = 0; i < designation.length; i++) {
        if (data.length > 0) {
          const result = data.filter(
            (s) =>
              s.designationName.toLowerCase() ==
              designation[i].designationName.toLowerCase()
          );

          if (result.length > 0) {
            return res.status(200).send({
              status: 401,
              message:
                'Duplicate Designation Name Exist In Excel.' +
                result[0].designationName,
            });
          }
        } else {
          let uniquedata = await executeQuery(
            `
           
select * from designations WHERE LOWER(TRIM("designationName")) = '` +
              designation[i].designationName.trim().toLowerCase() +
              `' and "companyMasterID" = ` +
              req.body.companyMasterID +
              ` and status in (0,1) `
          );

          if (uniquedata.length > 0) {
            return res.status(200).json({
              status: 401,
              message:
                'Designation Already Exist' + uniquedata[0].designationName,
              data: {},
            });
          }
        }
        data.push(designation[i]);
      }

      Designation.bulkCreate(designation).catch((error) => {
        res.status(200).send({
          status: 401,
          message: 'Fail to import excel! ' + error.message,
          error: error.message,
        });
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.designationadd,
        data: {},
      });
    });
  } catch (error) {
    res.status(500).send({
      message: 'Could not upload the file: ' + req.file.originalname,
    });
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
        let designationMaster = {
          designationName: row[0].trim(),
          jobdescription: row[1],
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.designationName &&
            typeof s.designationName === 'string' &&
            s.designationName.toLowerCase() ===
              designationMaster.designationName.toLowerCase()
        );

        if (duplicateInExcel) {
          designationMaster.remarks = 'Duplicate Designation Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            designationName: {
              [Sequelize.Op.iLike]: designationMaster.designationName,
            },
          };

          const uniquedata = await Designation.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            designationMaster.remarks = 'Designation Already Exists';
          }
        }
        data.push(designationMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.designationValidate,
      data: data,
    });
  } catch (error) {
    next(error);
    // res.status(500).send({
    //   message: 'Could not upload the file: ' + req.file.originalname,
    // });
  }
};

exports.reValidateDesignation = async (req, res, next) => {
  try {
    const { designationData, companyMasterID } = req.body;
    let data = [];

    for (const row of designationData) {
      // Ensure the row is an object and has the required fields
      if (row.designationName && row.designationName.trim() !== '') {
        let designationMaster = {
          designationName: row.designationName.trim(),
          jobdescription: row.jobdescription || '',
          remarks: '',
        };

        // Check for duplicates in `data` array
        const duplicateInData = data.some(
          (s) =>
            s.designationName.trim().toLowerCase() ===
            designationMaster.designationName.trim().toLowerCase()
        );

        if (duplicateInData) {
          designationMaster.remarks = 'Duplicate Designation Name in Data';
        } else {
          // Check for duplicates in the database
          const condition = {
            companyMasterID: companyMasterID,
            status: [0, 1],
            designationName: {
              [Sequelize.Op.iLike]: designationMaster.designationName,
            },
          };

          const uniquedata = await Designation.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            designationMaster.remarks = 'Designation Already Exists';
          }
        }

        // Add the processed designation to the `data` array
        data.push(designationMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: 'Designation validation complete',
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateDesignation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { designationData, companyMasterID } = req.body;
    const dbOperation = DatabaseOperationEnum.CREATE;

    await Designation.bulkCreate(
      designationData.map((item) => ({
        designationName: item.designationName.trim(),
        jobdescription: item.jobdescription,
        companyMasterID,
        status: 1,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction, dbOperation, individualHooks: false }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.designationadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
