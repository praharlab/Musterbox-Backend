const Sequelize = require('sequelize');
const VisitPurposeModel = require('../models/visitPurpose');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasterModel = require('../models/companyMaster');
const sequelize = require('../config/database');
const FormAuthorization = require('../models/formAuthorizationDetails');
const FormMaster = require('../models/formMaster');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const AuthorizationRequest = require('../models/authorizationRequest');
const xlsx = require('xlsx');
const Visit = require('../models/visit');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
/**
 * save visitPurpose data.
 *
 * @body {createBy} createBy user id of user who added the visit purpose.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

//Upload Visit Purpose
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

    let visitpurpose = [];

    let authStatus = 0;

    let FormMasters = await FormMaster.findOne({
      where: { formName: 'VisitPurpose', status: 1 },
    });

    let FormAuthorizations = await FormAuthorization.findOne({
      where: {
        FormMasterId: FormMasters.formMasterID,
        companyMasterID: req.body.companyMasterID,
        status: 1,
      },
      raw: true,
    });

    if (FormAuthorizations) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: FormAuthorizations.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });
      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        authStatus = 2;
      } else {
        authStatus = 1;
      }
    } else {
      authStatus = 0;
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const visitPurpose = data[i][0];

        // Check if the visit purpose already exists (case-insensitive)
        const existingVisit = await VisitPurposeModel.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('visitPurpose')),
              visitPurpose.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('visitPurpose')),
              visitPurpose.toString().toUpperCase()
            )
          ),
        });

        if (existingVisit) {
          visitpurpose.push(data[i][0]);
        } else {
          await VisitPurposeModel.create({
            visitPurpose: data[i][0],
            companyMasterID: req.body.companyMasterID,
            authorizationStatus: authStatus,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (visitpurpose.length > 0) {
      res.status(200).json({
        status: 200,
        message: `visitpurpose categories '${visitpurpose.join(
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

exports.postAddVisitPurpose = async (req, res, next) => {
  try {
    let = { visitPurpose, companyMasterID, createBy, createByIp } =
      await req.body;
    let FormMasters = await FormMaster.findOne({
      where: { formName: 'VisitPurpose', status: 1 },
    });

    let FormAuthorizations = await FormAuthorization.findOne({
      where: {
        FormMasterId: FormMasters.formMasterID,
        companyMasterID: companyMasterID,
        status: 1,
      },
      raw: true,
    });

    if (FormAuthorizations) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: FormAuthorizations.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });
      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await VisitPurposeModel.create(
            {
              visitPurpose,
              companyMasterID,
              authorizationStatus: 2,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          let insert_db_status1 = await AuthorizationRequest.create(
            {
              formMasterID: FormMasters.formMasterID,
              TableName: 'VisitPurpose',
              ReferenceID: insert_db_status.visitPurposeID,
              userMasterID: FormAuthorizations.AuthorizedByUserMasterId[0],
              status: 1,
              authstatus: 2,
              createBy,
              createByIp,
            },
            { transaction: t }
          );

          res.status(200).json({
            status: 200,
            message: message.usermessage.visitpurposeadd,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await VisitPurposeModel.create(
            {
              visitPurpose,
              companyMasterID,
              authorizationStatus: 1,
              createBy,
              createByIp,
            },
            { transaction: t }
          );
          for (
            var i = 0;
            i < FormAuthorizations.AuthorizedByUserMasterId.length;
            i++
          ) {
            let insert_db_status1 = await AuthorizationRequest.create(
              {
                formMasterID: FormMasters.formMasterID,
                TableName: 'VisitPurpose',
                ReferenceID: insert_db_status.visitPurposeID,
                userMasterID: FormAuthorizations.AuthorizedByUserMasterId[i],
                status: 1,
                authstatus: 2,
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          }

          res.status(200).json({
            status: 200,
            message: message.usermessage.visitpurposeadd,
            data: insert_db_status,
          });
          return insert_db_status;
        });
      }
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await VisitPurposeModel.create(
          {
            visitPurpose,
            companyMasterID,
            authorizationStatus: 0,
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.visitpurposeadd,
          data: insert_db_status,
        });
        return insert_db_status;
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
 return all visitPurpose data
 */

exports.getAllVisitPurposeData = async (req, res, next) => {
  try {
    let { limit, page, exportData, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let visit_purpose_data = [];
    if (limit == '' && page == '') {
      visit_purpose_data = await VisitPurposeModel.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
          authorizationStatus: ['0', '3'],
        },
        include: [{ all: true }],
      });
    } else {
      visit_purpose_data = await VisitPurposeModel.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
          authorizationStatus: ['0', '3'],
        },
        limit: limit,
        offset: offset,
        include: [{ all: true }],
      });
    }

    const totalcount = await VisitPurposeModel.count({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: ['0', '1'],
        authorizationStatus: ['0', '3'],
      },
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < visit_purpose_data.length; i++) {
        const data1 = {
          VisitPurpose: visit_purpose_data[i].visitPurpose,
          CompanyName: visit_purpose_data[i].companyMaster.companyName,
          Status: visit_purpose_data[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Visit_Purpose', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: visit_purpose_data, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with visitPurpose id
 *
 * @param {id} visitPurposeID  to fetch visitPurpose name
 */

exports.getVisitPurposeById = async (req, res, next) => {
  try {
    let get_one_data = await VisitPurposeModel.findOne({
      where: {
        visitPurposeID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
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

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch visitPurpose name
 */

exports.getVisitPurposeByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          visitPurpose: {
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

    const visitpurpose = await VisitPurposeModel.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasterModel,
          attributes: ['companyName'],
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: visitpurpose.rows,
      totalcount: visitpurpose.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} visitPurposeID  to update id
 */
exports.postUpdateVisitPurpose = async (req, res, next) => {
  try {
    let = {
      visitPurposeID,
      visitPurpose,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await VisitPurposeModel.update(
        {
          visitPurpose,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { visitPurposeID: visitPurposeID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.visitpurposeupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} visitPurposeID  to update status of visit purpose
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { visitPurposeID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await VisitPurposeModel.update(
          {
            status: '1',
          },
          {
            where: { visitPurposeID: visitPurposeID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await Visit.findOne({
          where: {
            visitPurposeID: visitPurposeID,
            status: ['1', '0'],
          },
        });

        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Visit Purpose. Already used in Visit.',
          });
        } else {
          delete_status = await VisitPurposeModel.update(
            {
              status: '0',
            },
            {
              where: { visitPurposeID: visitPurposeID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.visitpurposedelete,
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
 * @param {id} visitPurposeID  to delete id
 */
exports.postDeleteVisitPurposeById = async (req, res, next) => {
  try {
    let { visitPurposeID } = await req.body;

    let data = await Visit.findOne({
      where: {
        visitPurposeID: visitPurposeID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Visit Purpose. Already used in Visit.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await VisitPurposeModel.update(
          {
            status: 2,
          },
          {
            where: { visitPurposeID: visitPurposeID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.visitpurposedelete,
        });
        return delete_status;
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (req.file == undefined) {
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
        const visitPurpose = row[0]; // Assuming the Visit Purpose name is in the first column
        let visitPurposeMaster = {
          visitPurpose: visitPurpose,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.visitPurpose &&
            typeof s.visitPurpose === 'string' &&
            s.visitPurpose.toLowerCase() ===
              visitPurposeMaster.visitPurpose.toLowerCase()
        );

        if (duplicateInExcel) {
          visitPurposeMaster.remarks = 'Duplicate Visit Purpose Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            visitPurpose: {
              [Sequelize.Op.iLike]: visitPurposeMaster.visitPurpose,
            },
          };

          const uniquedata = await VisitPurposeModel.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            visitPurposeMaster.remarks = 'Visit Purpose Already Exists';
          }
        }

        data.push(visitPurposeMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitPurposeValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateVisitPurpose = async (req, res, next) => {
  try {
    const { visitPurpose, companyMasterID } = req.body;

    let data = [];
    for (const row of visitPurpose) {
      if (row != null && row != '') {
        let departmentmaster = {
          visitPurpose: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.visitPurpose.trim().toLowerCase() ===
            departmentmaster.visitPurpose.trim().toLowerCase()
        );

        if (duplicateInData) {
          departmentmaster.remarks = 'Duplicate Visit Purpose Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          (condition.status = [0, 1]),
            (condition.visitPurpose = {
              [Sequelize.Op.iLike]: departmentmaster.visitPurpose,
            });
          let uniquedata = await VisitPurposeModel.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            departmentmaster.remarks = 'Visit Purpose Already Exists';
          }
        }

        data.push(departmentmaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitPurposeValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateVisitPurpose = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { visitPurpose, companyMasterID } = req.body;
    let authStatus = 0;
    let FormMasters = await FormMaster.findOne({
      where: { formName: 'VisitPurpose', status: 1 },
    });
    let FormAuthorizations = await FormAuthorization.findOne({
      where: {
        FormMasterId: FormMasters.formMasterID,
        companyMasterID: req.body.companyMasterID,
        status: 1,
      },
      raw: true,
    });
    if (FormAuthorizations) {
      let AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: FormAuthorizations.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });
      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        authStatus = 2;
      } else {
        authStatus = 1;
      }
    } else {
      authStatus = 0;
    }
    await VisitPurposeModel.bulkCreate(
      visitPurpose.map((item) => ({
        visitPurpose: item.trim(),
        authorizationStatus: authStatus,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.visitpurposeadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
