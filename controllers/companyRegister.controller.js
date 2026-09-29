const companyRegister = require('../models/companyRegister');
const logger = require('../config/logger');
const message = require('../response_message/message');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddCompanyRegister = async (req, res, next) => {
  try {
    let = {
      companyMasterId,
      PFNo,
      ESINo,
      GSTNo,
      LWFNo,
      TANNo,
      PANNo,
      status,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status = await companyRegister.create({
      companyMasterId,
      PFNo,
      ESINo,
      GSTNo,
      LWFNo,
      TANNo,
      PANNo,
      status,
      createBy,
      createByIp,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyregisteradd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all city data
 */

exports.getAllcompanyRegister = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let companyRegister_master;
    if (page == '' && limit == '') {
      companyRegister_master = await companyRegister.findAll({
        raw: true,
        where: { status: '1', companyMasterId: req.body.companyMasterID },
      });
    } else {
      companyRegister_master = await companyRegister.findAll({
        raw: true,
        where: {
          status: ['0', '1'],
          companyMasterId: req.body.companyMasterID,
        },
        limit: limit,
        offset: offset,
      });
    }
    const totalcount = await companyRegister.count({
      raw: true,
      where: { status: ['0', '1'] },
      companyMasterId: req.body.companyMasterID,
    });
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyregisterget,
      data: companyRegister_master,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with companyRegister id
 *
 * @param {id} companyRegisterID  to fetch city name
 */

exports.getcompanyRegisterId = async (req, res, next) => {
  try {
    let get_one_data = await companyRegister.findOne({
      where: { companyRegisterID: req.params.id, status: ['0', '1'] },
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
 * @param {id} companyRegisterID  to update id
 */
exports.postUpdatecompanyRegister = async (req, res, next) => {
  try {
    let = {
      companyRegisterID,
      companyMasterId,
      PFNo,
      ESINo,
      GSTNo,
      LWFNo,
      TANNo,
      PANNo,
      status,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await companyRegister.update(
      {
        companyMasterId,
        PFNo,
        ESINo,
        GSTNo,
        LWFNo,
        TANNo,
        PANNo,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { companyRegisterID: companyRegisterID },
      }
    );
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyregisterupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} companyRegisterID  to delete id
 */
exports.postDeletecompanyRegisterById = async (req, res, next) => {
  try {
    let = { companyRegisterID } = await req.body;
    let delete_status = await companyRegister.update(
      {
        status: '2',
      },
      {
        where: { companyRegisterID: companyRegisterID },
      }
    );
    res.status(200).json({
      status: 200,
      message: message.usermessage.companyregisterdelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { companyRegisterID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await companyRegister.update(
        {
          status: '1',
        },
        {
          where: { companyRegisterID: companyRegisterID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await companyRegister.update(
        {
          status: '0',
        },
        {
          where: { companyRegisterID: companyRegisterID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.companydelete,
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
