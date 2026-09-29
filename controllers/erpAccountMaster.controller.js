const erpAccountMaster = require('../models/erpAccountMaster');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const companyMasters = require('../models/companyMaster');
const config = require('../config/erpdatabase');
const sql = require('mssql');
const erpIntegration = require('../models/erpIntegration');
const axios = require('axios');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAdderpAccountMaster = async (req, res, next) => {
  try {
    let {
      erpAccountMasterID,
      userMasterID,
      companyMasterID,
      erpAcountID,
      status,
      createBy,
      createByIp,
    } = await req.body;

    let erp_Account = await erpAccountMaster.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    if (erp_Account) {
      return res.status(200).send({
        status: 401,
        message: 'Erp Account ID Already Assigned',
      });
    }

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await erpAccountMaster.create(
        {
          erpAccountMasterID,
          userMasterID,
          companyMasterID,
          erpAcountID,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.erpAccountMasteradd,
        data: insert_db_status,
      });
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with erpAccountMasters id
 *
 * @param {id} erpAccountMasterID  to fetch city name
 */

exports.geterpAccountMasterId = async (req, res, next) => {
  try {
    let get_one_data = await erpAccountMaster.findOne({
      where: { erpAcountMasterID: req.params.id, status: 1 },
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
 * @param {id} erpAccountMasterID  to update id
 */
exports.postUpdateerpAccountMaster = async (req, res, next) => {
  try {
    let {
      erpAcountMasterID,
      userMasterID,
      companyMasterID,
      erpAcountID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await erpAccountMaster.update(
        {
          erpAcountMasterID,
          userMasterID,
          companyMasterID,
          erpAcountID,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { erpAcountMasterID: erpAcountMasterID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.erpAccountMasterupdate,
      });
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} erpAccountMasterID  to delete id
 */

exports.postDeleteerpAccountMasterById = async (req, res, next) => {
  try {
    let { erpAcountMasterID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await erpAccountMaster.destroy({
        where: { erpAcountMasterID: erpAcountMasterID, status: ['1', '0'] },
        transaction: t,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.erpAccountMasterdelete,
      });
    });
  } catch (err) {
    next(err);
  }
};
exports.poststatuschange = async (req, res, next) => {
  try {
    let { erpAcountMasterID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await erpAccountMaster.update(
          {
            status: '1',
          },
          {
            where: { erpAcountMasterID: erpAcountMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await erpAccountMaster.update(
          {
            status: '0',
          },
          {
            where: { erpAcountMasterID: erpAcountMasterID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.erpAccountMasterdelete,
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
    next(err);
  }
};
exports.geterpAccountMastercompanyid = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID, userMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let erpAccountMasters, totalcount;
    let userid = [];
    if (userMasterID == '') {
      erpAccountMasters = await erpAccountMaster.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        order: [['erpAcountMasterID', 'ASC']],
        limit: limit,
        offset: offset,
      });
      for (var j = 0; j < erpAccountMasters.length; j++) {
        let user3 = await UserMaster.findOne({
          where: {
            userMasterID: erpAccountMasters[j].userMasterID,
          },
        });

        if (user3) {
          erpAccountMasters[j].dataValues.displayName =
            user3.dataValues.displayName;
        }
      }
      totalcount = await erpAccountMaster.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
      });
    } else {
      for (var i = 0; i < userMasterID.length; i++) {
        userid.push(parseInt(userMasterID[i]));
      }

      erpAccountMasters = await erpAccountMaster.findAll({
        where: {
          companyMasterID: companyMasterID,
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
          status: 1,
        },
        order: [['erpAcountMasterID', 'ASC']],
        limit: limit,
        offset: offset,
      });
      for (var j = 0; j < erpAccountMasters.length; j++) {
        let user3 = await UserMaster.findOne({
          where: {
            userMasterID: erpAccountMasters[j].userMasterID,
          },
        });

        if (user3) {
          erpAccountMasters[j].dataValues.displayName =
            user3.dataValues.displayName;
        }
      }
      totalcount = await erpAccountMaster.count({
        where: {
          companyMasterID: companyMasterID,
          userMasterID: {
            [Sequelize.Op.in]: userid,
          },
          status: 1,
        },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: erpAccountMasters, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};

exports.geterpaccount = async (req, res, next) => {
  try {
    if (req.body.companyMasterID == 28) {
      sql.connect(config, (err) => {
        if (err) {
          console.log('Could not create DB Connection!', err);
          res.status(200).json({
            status: 200,
            message: err,
          });
          return;
        }
        console.log('Successfully Connected to Database!');

        var request = new sql.Request();

        request
          .execute('Mccs_veritrack_TAD_Account')
          .then(function (recordsets, err, returnValue, affected) {
            if (err) {
              res.status(200).json({
                status: 200,
                message: err,
              });
              console.log(err);
            }
            res.status(200).json({
              status: 200,
              message: 'Data Get SuccessFully.',
              data: recordsets.recordsets[0],
            });
          })
          .catch(function (err) {
            res.status(200).json({
              status: 401,
              message: err.message,
            });
            console.log(err);
          });
      });
    } else {
      const record = await erpIntegration.findOne({
        where: {
          companyMasterID: req.body.companyMasterID,
        },
        attributes: ['erpName', 'baseUrl', 'apiSecret', 'apiKey', 'empCodeUrl'],
      });

      if (record) {
        if (record.erpName === 'ERPNext') {
          try {
            const apiKey = `${record.apiKey}`;
            const apiSecret = `${record.apiSecret}`;

            // Create the base64 encoded string
            const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString(
              'base64'
            );

            // Set up the Authorization header
            const headers = {
              Authorization: `Basic ${auth}`,
            };

            const apiUrl = `${record.empCodeUrl}`;

            const response = await axios.get(apiUrl, { headers });

            const data = response.data.message;

            const employees = Array.isArray(data)
              ? data.map((emp) => ({
                  AccountMasterId: emp.Name,
                  AccountName: `${emp.Employee_Name} (${emp.Name})`,
                }))
              : [];

            return res.status(200).json({
              status: 200,
              message: 'Data found successfully',
              data: employees,
            });
          } catch (err) {
            return res.status(200).json({
              status: 500,
              message: 'Error fetching data from ERP API',
            });
          }
        } else if (record.erpName === 'Munimji') {
          console.log('Munimji ERP');
        }
      } else {
        res.status(401).json({
          status: 401,
          message: 'ERP Integration not found.',
        });
      }
    }
  } catch (err) {
    next(err);
  }
};
