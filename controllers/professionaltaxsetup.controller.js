const Sequelize = require('sequelize');
const ProfessionalTaxSetup = require('../models/professionalTaxSetup');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
/**
 * save professionalTaxSetup data.
 *
 * @body {createBy} createBy user id of user who added the professionalTaxSetup.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddProfessionalTaxSetup = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      ptStatus,
      createBy,
      createByIp,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status;
      let get_one_data = await ProfessionalTaxSetup.findOne({
        where: {
          companyMasterID: companyMasterID,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        transaction: t,
        raw: true,
      });

      if (get_one_data) {
        change_data_status = await ProfessionalTaxSetup.update(
          {
            companyMasterID,
            ptStatus,
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
          message: message.usermessage.professionalTaxSetupadd,
          data: {},
        });
      } else {
        insert_db_status = await ProfessionalTaxSetup.create(
          {
            companyMasterID,
            ptStatus,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.professionalTaxSetupadd,
          data: {},
        });
      }

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
 return all professionalTaxSetup data
 */

exports.getAllProfessionalTaxSetupData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let professionalTax_setup = [];
    if (limit == '' && page == '') {
      professionalTax_setup = await ProfessionalTaxSetup.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      professionalTax_setup = await ProfessionalTaxSetup.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await ProfessionalTaxSetup.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: professionalTax_setup,
      totalcount: totalcount,
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with professionalTaxSetup id
 *
 * @param {id} professionalTaxSetupID  to fetch professionalTaxSetup name
 */

exports.getProfessionalTaxSetupById = async (req, res, next) => {
  try {
    let get_one_data = await ProfessionalTaxSetup.findOne({
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
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch professionalTaxSetup name
 */

exports.getProfessionalTaxSetupByCompanyId = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let professionalTax_setup = [];
    if (limit == '' && page == '') {
      professionalTax_setup = await ProfessionalTaxSetup.findAll({
        where: {
          companyMasterID: req.params.id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        raw: true,
      });
    } else {
      professionalTax_setup = await ProfessionalTaxSetup.findAll({
        where: {
          companyMasterID: req.params.id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        raw: true,
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await ProfessionalTaxSetup.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    if (!professionalTax_setup)
      res
        .status(200)
        .json({ status: 401, message: message.usermessage.deletedrecord });
    else
      res.status(200).json({
        status: 200,
        data: professionalTax_setup,
        totalcount: totalcount,
      });
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
 * @param {id} professionalTaxSetupID  to update id
 */
exports.postUpdateProfessionalTaxSetup = async (req, res, next) => {
  try {
    let = {
      professionalTaxSetupID,
      companyMasterID,
      ptStatus,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ProfessionalTaxSetup.update(
        {
          companyMasterID,
          ptStatus,
          updateBy,
          updateByIp,
        },
        {
          where: { professionalTaxSetupID: professionalTaxSetupID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.professionalTaxSetupupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} professionalTaxSetupID  to update status of professionalTaxSetup
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { professionalTaxSetupID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ProfessionalTaxSetup.update(
          {
            status: '1',
          },
          {
            where: {
              professionalTaxSetupID: professionalTaxSetupID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await ProfessionalTaxSetup.update(
          {
            status: '0',
          },
          {
            where: {
              professionalTaxSetupID: professionalTaxSetupID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.professionalTaxSetupdelete,
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
 * @param {id} professionalTaxSetupID  to delete id
 */
exports.postDeleteProfessionalTaxSetupById = async (req, res, next) => {
  try {
    let = { professionalTaxSetupID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ProfessionalTaxSetup.update(
        {
          status: 2,
        },
        {
          where: { professionalTaxSetupID: professionalTaxSetupID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.professionalTaxSetupdelete,
      });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getalldatapt = async (req, res, next) => {
  try {
    if (req.body.companyMasterID != '') {
      let get_one_data = await companyMasters.findOne({
        where: { companyMasterID: req.body.companyMasterID, status: [0, 1] },
        raw: true,
        include: [{ all: true, nested: true }],
      });
      let get_all_data = await companyMasters.findAll({
        where: {
          parentCompanyMasterID: req.body.companyMasterID,
          status: [0, 1],
        },
        raw: true,
        include: [{ all: true, nested: true }],
      });
      get_all_data.push(get_one_data);
      for (var i = 0; i < get_all_data.length; i++) {
        let get_one_data2 = await ProfessionalTaxSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          raw: true,
        });
        if (get_one_data2) {
          if (get_one_data2.ptStatus == true) {
            get_all_data[i]['pttax'] = 'YES';
          } else {
            get_all_data[i]['pttax'] = 'NO';
          }
        } else {
          get_all_data[i]['pttax'] = 'Not Selected';
        }
      }
      return res.status(200).json({
        status: 200,
        message: message.usermessage.professionalTaxSetupget,
        data: get_all_data,
      });
    } else {
      let get_all_data = await companyMasters.findAll({
        raw: true,
        where: { status: ['0', '1'] },
        order: [['companyName', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_all_data.length; i++) {
        let get_one_data2 = await ProfessionalTaxSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          raw: true,
        });
        if (get_one_data2) {
          if (get_one_data2.ptStatus == true) {
            get_all_data[i]['pttax'] = 'YES';
          } else {
            get_all_data[i]['pttax'] = 'NO';
          }
        } else {
          get_all_data[i]['pttax'] = 'Not Selected';
        }
      }
      return res.status(200).json({
        status: 200,
        message: message.usermessage.professionalTaxSetupget,
        data: get_all_data,
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
