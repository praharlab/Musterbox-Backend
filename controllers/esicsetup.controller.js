const Sequelize = require('sequelize');
const ESICSetup = require('../models/esicSetup');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
/**
 * save esic setup data.
 *
 * @body {createBy} createBy user id of user who added the esic setup.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddESICSetup = async (req, res, next) => {
  try {
    let = {
      ESICStatus,
      grossSalaryForESIC,
      ESICEmployee,
      ESICEmployer,
      hideESICEmployeePaySlip,
      companyMasterID,
      createBy,
      createByIp,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let get_one_data = await ESICSetup.findOne({
        where: {
          companyMasterID: companyMasterID,
        },
        transaction: t,
        raw: true,
      });

      if (get_one_data) {
        let insert_db_status = await ESICSetup.update(
          {
            ESICStatus,
            grossSalaryForESIC,
            ESICEmployee,
            ESICEmployer,
            hideESICEmployeePaySlip,
            companyMasterID,
            createBy,
            createByIp,
            updateBy,
            updateByIp,
          },
          {
            where: { companyMasterID: companyMasterID },
            transaction: t,
          }
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.esicsetupupdate,
          data: {},
        });
      } else {
        let insert_db_status = await ESICSetup.create(
          {
            ESICStatus,
            grossSalaryForESIC,
            ESICEmployee,
            ESICEmployer,
            hideESICEmployeePaySlip,
            companyMasterID,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.esicsetupadd,
          data: {},
        });
      }

      res.status(200).json({
        status: 200,
        message: message.usermessage.esicsetupadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all esic setup data
 */

exports.getAllESICSetupData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let esic_setup = [];
    if (limit == '' && page == '') {
      esic_setup = await ESICSetup.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: 'companyMaster',
      });
    } else {
      esic_setup = await ESICSetup.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: 'companyMaster',
      });
    }
    const totalcount = await ESICSetup.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: esic_setup, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with esic setup id
 *
 * @param {id} ESICSetupID  to fetch esic setup data
 */

exports.getESICSetupById = async (req, res, next) => {
  try {
    let get_one_data = await ESICSetup.findOne({
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
        .json({ status: 401, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with companyMaster id
 *
 * @param {id} companyMasterID  to fetch esic setup data
 */

exports.getESCISetupByCompanyId = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let esic_setup = [];
    if (limit == '' && page == '') {
      esic_setup = await ESICSetup.findAll({
        raw: true,
        where: {
          companyMasterID: req.params.id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: 'companyMaster',
      });
    } else {
      esic_setup = await ESICSetup.findAll({
        raw: true,
        where: {
          companyMasterID: req.params.id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: 'companyMaster',
      });
    }
    const totalcount = await ESICSetup.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    if (!esic_setup)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else
      res
        .status(200)
        .json({ status: 200, data: esic_setup, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} ESICSetupID  to update id
 */
exports.postUpdateESICSetup = async (req, res, next) => {
  try {
    let = {
      ESICSetupID,
      ESICStatus,
      grossSalaryForESIC,
      ESICEmployee,
      ESICEmployer,
      hideESICEmployeePaySlip,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ESICSetup.update(
        {
          ESICStatus,
          grossSalaryForESIC,
          ESICEmployee,
          ESICEmployer,
          hideESICEmployeePaySlip,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { ESICSetupID: ESICSetupID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.esicsetupupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} ESICSetupID  to update status of esicsetup
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { ESICSetupID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ESICSetup.update(
          {
            status: '1',
          },
          {
            where: { ESICSetupID: ESICSetupID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await ESICSetup.update(
          {
            status: '0',
          },
          {
            where: { ESICSetupID: ESICSetupID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.esicsetupdelete,
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

/**
 * delete by i
 *
 * @param {id} ESICSetupID  to delete id
 */
exports.postDeleteStateById = async (req, res, next) => {
  try {
    let = { ESICSetupID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ESICSetup.update(
        {
          status: 2,
        },
        {
          where: { ESICSetupID: ESICSetupID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.esicsetupdelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getalldatapt = async (req, res, next) => {
  try {
    if (req.body.id != '') {
      let get_one_data = await companyMasters.findOne({
        where: { companyMasterID: req.body.companyMasterID, status: [0, 1] },
        raw: true,
      });
      let get_all_data = await companyMasters.findAll({
        where: {
          parentCompanyMasterID: req.body.companyMasterID,
          status: [0, 1],
        },
        raw: true,
      });
      get_all_data.push(get_one_data);
      for (var i = 0; i < get_all_data.length; i++) {
        let get_one_data2 = await ESICSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
          },
          raw: true,
        });
        if (get_one_data2) {
          if (get_one_data2.ESICStatus == true) {
            get_all_data[i]['esic'] = 'YES';
            get_all_data[i]['grossSalaryForESIC'] =
              get_one_data2.grossSalaryForESIC;
            get_all_data[i]['ESICEmployee'] = get_one_data2.ESICEmployee;
            get_all_data[i]['ESICEmployer'] = get_one_data2.ESICEmployer;

            if (get_one_data2.hideESICEmployeePaySlip == true) {
              get_all_data[i]['hideESICEmployeePaySlip'] = 'YES';
            } else {
              get_all_data[i]['hideESICEmployeePaySlip'] = 'NO';
            }
          } else {
            get_all_data[i]['esic'] = 'NO';
            get_all_data[i]['grossSalaryForESIC'] = '';
            get_all_data[i]['ESICEmployee'] = '';
            get_all_data[i]['ESICEmployer'] = '';
            get_all_data[i]['hideESICEmployeePaySlip'] = '';
          }
        } else {
          get_all_data[i]['esic'] = 'Not Selected';
          get_all_data[i]['grossSalaryForESIC'] = '';
          get_all_data[i]['ESICEmployee'] = '';
          get_all_data[i]['ESICEmployer'] = '';
          get_all_data[i]['hideESICEmployeePaySlip'] = '';
        }
      }
      return res.status(200).json({
        status: 200,
        message: message.usermessage.PFetupget,
        data: get_all_data,
      });
    } else {
      let get_all_data = await companyMasters.findAll({
        raw: true,
        where: { status: ['0', '1'] },
        order: [['companyName', 'ASC']],
      });
      for (var i = 0; i < get_all_data.length; i++) {
        let get_one_data2 = await ESICSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
          },
          raw: true,
        });
        if (get_one_data2) {
          if (get_one_data2.ESICStatus == true) {
            get_all_data[i]['esic'] = 'YES';
            get_all_data[i]['grossSalaryForESIC'] =
              get_one_data2.grossSalaryForESIC;
            get_all_data[i]['ESICEmployee'] = get_one_data2.ESICEmployee;
            get_all_data[i]['ESICEmployer'] = get_one_data2.ESICEmployer;

            if (get_one_data2.hideESICEmployeePaySlip == true) {
              get_all_data[i]['hideESICEmployeePaySlip'] = 'YES';
            } else {
              get_all_data[i]['hideESICEmployeePaySlip'] = 'NO';
            }
          } else {
            get_all_data[i]['esic'] = 'NO';
            get_all_data[i]['grossSalaryForESIC'] = '';
            get_all_data[i]['ESICEmployee'] = '';
            get_all_data[i]['ESICEmployer'] = '';
            get_all_data[i]['hideESICEmployeePaySlip'] = '';
          }
        } else {
          get_all_data[i]['esic'] = 'Not Selected';
          get_all_data[i]['grossSalaryForESIC'] = '';
          get_all_data[i]['ESICEmployee'] = '';
          get_all_data[i]['ESICEmployer'] = '';
          get_all_data[i]['hideESICEmployeePaySlip'] = '';
        }
      }
      return res.status(200).json({
        status: 200,
        message: message.usermessage.ESICSetupget,
        data: get_all_data,
      });
    }
  } catch (err) {
    next(err);
  }
};
