const Sequelize = require('sequelize');
const VisitReportMaster = require('../models/visitReportMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMasters = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const visitReportCustomizes = require('../models/visitreportcustomize');
const { generateExcel } = require('../utils/exportData');

/**
 * save visitreport data.
 *
 * @body {createBy} createBy user id of user who added the visitreport.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddVisitReport = async (req, res, next) => {
  try {
    let = { visitReportName, companyMasterID, createBy, createByIp } =
      await req.body;
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await VisitReportMaster.create(
        {
          visitReportName,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.visitreportadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 return all visitreport data
 */

exports.getAllVisitReportDataByCompanyID = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          visitReportName: {
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

    const visitReportMaster = await VisitReportMaster.findAndCountAll({
      raw: true,
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

    for (var j = 0; j < visitReportMaster.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: visitReportMaster.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: visitReportMaster.rows[j].updateBy,
        },
      });

      if (user1) {
        visitReportMaster.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        visitReportMaster.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < visitReportMaster.rows.length; i++) {
        const data1 = {
          VisitReportMasterName: visitReportMaster.rows[i].visitReportName,
          CompanyName: visitReportMaster.rows[i]['companyMaster.companyName'],
          Status: visitReportMaster.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'VisitReportMaster', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: visitReportMaster.rows,
      totalcount: visitReportMaster.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with visitreportMaster id
 *
 * @param {id} visitReportMasterID  to fetch visitreport name
 */

exports.getVisitReportById = async (req, res, next) => {
  try {
    let get_one_data = await VisitReportMaster.findOne({
      where: {
        visitReportMasterID: req.params.id,
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
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} visitReportMasterID  to update id
 */
exports.postUpdateVisitReport = async (req, res, next) => {
  try {
    let {
      visitReportMasterID,
      visitReportName,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await VisitReportMaster.update(
        {
          visitReportName,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { visitReportMasterID: visitReportMasterID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.visitreportupdate });
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
 * @param {id} visitReportMasterID  to update status of visitreport
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { visitReportMasterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await VisitReportMaster.update(
          {
            status: '1',
          },
          {
            where: {
              visitReportMasterID: visitReportMasterID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        let data = await visitReportCustomizes.findOne({
          where: {
            visitReportMasterID: visitReportMasterID,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Visit Report Master.Already used in visit Report Customizes.',
          });
        } else {
          delete_status = await VisitReportMaster.update(
            {
              status: '0',
            },
            {
              where: {
                visitReportMasterID: visitReportMasterID,
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
          message: message.usermessage.visitreportdelete,
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
 * @param {id} visitReportMasterID  to delete id
 */
exports.postDeleteVisitReportById = async (req, res, next) => {
  try {
    let { visitReportMasterID } = await req.body;
    // let delete_db_status = await VisitReportMaster.destroy({
    //     where: {
    //         visitReportMasterID: visitReportMasterID
    //     }
    // });

    let data = await visitReportCustomizes.findOne({
      where: {
        visitReportMasterID: visitReportMasterID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Visit Report Master.Already used in visit Report Customizes.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await VisitReportMaster.update(
          {
            status: 2,
          },
          {
            where: { visitReportMasterID: visitReportMasterID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.visitreportdelete,
        });
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getVisitReportBycompany = async (req, res, next) => {
  try {
    let get_one_data = await VisitReportMaster.findAll({
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
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
