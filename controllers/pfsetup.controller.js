const Sequelize = require('sequelize');
const PFSetup = require('../models/pfSetup');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');

exports.postAddPFSetup = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      PFStatus,
      basicForPF,
      maximumMonthlyPF,
      hidePFEmployerPayslip,
      createBy,
      createByIp,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let get_one_data = await PFSetup.findOne({
        where: {
          companyMasterID: companyMasterID,
        },
        transaction: t,
        raw: true,
      });

      let insert_db_status;
      if (get_one_data) {
        insert_db_status = await PFSetup.update(
          {
            companyMasterID,
            PFStatus,
            basicForPF,
            maximumMonthlyPF,
            hidePFEmployerPayslip,
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
          message: message.usermessage.pfSetupupdate,
          data: {},
        });
      } else {
        insert_db_status = await PFSetup.create(
          {
            companyMasterID,
            PFStatus,
            basicForPF,
            maximumMonthlyPF,
            hidePFEmployerPayslip,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
        res.status(200).json({
          status: 200,
          message: message.usermessage.pfSetupadd,
          data: {},
        });
      }

      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getPFetupById = async (req, res, next) => {
  try {
    let get_one_data = await PFSetup.findOne({
      where: {
        companyMasterID: req.params.id,
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
        let get_one_data2 = await PFSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
          },
          raw: true,
        });
        if (get_one_data2) {
          if (get_one_data2.PFStatus == true) {
            get_all_data[i]['pF'] = 'YES';
            get_all_data[i]['basicForPF'] = get_one_data2.basicForPF;
            get_all_data[i]['maximumMonthlyPF'] =
              get_one_data2.maximumMonthlyPF;

            if (get_one_data2.hidePFEmployerPayslip == true) {
              get_all_data[i]['hidePFEmployerPayslip'] = 'YES';
            } else {
              get_all_data[i]['hidePFEmployerPayslip'] = 'NO';
            }
          } else {
            get_all_data[i]['pF'] = 'NO';
            get_all_data[i]['basicForPF'] = '';
            get_all_data[i]['maximumMonthlyPF'] = '';
            get_all_data[i]['hidePFEmployerPayslip'] = '';
          }
        } else {
          get_all_data[i]['pF'] = 'Not Selected';
          get_all_data[i]['basicForPF'] = '';
          get_all_data[i]['maximumMonthlyPF'] = '';
          get_all_data[i]['hidePFEmployerPayslip'] = '';
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
        include: [{ all: true, nested: true }],
      });
      for (var i = 0; i < get_all_data.length; i++) {
        let get_one_data2 = await PFSetup.findOne({
          where: {
            companyMasterID: get_all_data[i].companyMasterID,
          },
          raw: true,
        });

        if (get_one_data2) {
          if (get_one_data2.PFStatus == true) {
            get_all_data[i]['pF'] = 'YES';
            get_all_data[i]['basicForPF'] = get_one_data2.basicForPF;
            get_all_data[i]['maximumMonthlyPF'] =
              get_one_data2.maximumMonthlyPF;

            if (get_one_data2.hidePFEmployerPayslip == true) {
              get_all_data[i]['hidePFEmployerPayslip'] = 'YES';
            } else {
              get_all_data[i]['hidePFEmployerPayslip'] = 'NO';
            }
          } else {
            get_all_data[i]['pF'] = 'NO';
            get_all_data[i]['basicForPF'] = '';
            get_all_data[i]['maximumMonthlyPF'] = '';
            get_all_data[i]['hidePFEmployerPayslip'] = '';
          }
        } else {
          get_all_data[i]['pF'] = 'Not Selected';
          get_all_data[i]['basicForPF'] = '';
          get_all_data[i]['maximumMonthlyPF'] = '';
          get_all_data[i]['hidePFEmployerPayslip'] = '';
        }
      }
      return res.status(200).json({
        status: 200,
        message: message.usermessage.pfSetupget,
        data: get_all_data,
      });
    }
  } catch (err) {
    next(err);
  }
};
