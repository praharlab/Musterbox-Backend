const Sequelize = require('sequelize');
const EmployeeDigitalSignature = require('../models/employeeDigitalSignature');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
var nearest = require('nearest-date');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
/**
 * save employeeDigitalSignature data.
 *
 * @body {createBy} createBy user id of user who added the employeeDigitalSignature.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddEmployeeDigitalSignature = async (req, res, next) => {
  try {
    let = { userMasterID, createBy, createByIp } = await req.body;
    let signature = '';
    if (req.file) {
      signature = req.file.filename;
    }
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await EmployeeDigitalSignature.create(
        {
          userMasterID,
          signature,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.empdigitalsignatureadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all employeeDigitalSignature data
 */

exports.getAllEmployeeDigitalSignatureData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_digital_signature, count } =
      await EmployeeDigitalSignature.findAndCountAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        ...paginationQuery,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: employee_digital_signature,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeDigitalSignature id
 *
 * @param {id} employeeDigitalSignatureID  to fetch employeeDigitalSignature
 */

exports.getEmployeeDigitalSignatureById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeDigitalSignature.findOne({
      where: {
        employeeDigitalSignatureID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
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
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch employeeDigitalSignature
 */

exports.getEmployeeDigitalSignatureByUserMasterId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeDigitalSignature.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          include: { model: companyMaster },
        },
      ],
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} employeeDigitalSignatureID  to update id
 */
exports.postUpdateEmployeeDigitalSignature = async (req, res, next) => {
  try {
    let { employeeDigitalSignatureID, userMasterID, updateBy, updateByIp } =
      await req.body;

    if (req.file) {
      let signature = req.file.filename;
      let change_data_status = await EmployeeDigitalSignature.update(
        {
          userMasterID,
          signature,
          updateBy,
          updateByIp,
        },
        {
          where: { employeeDigitalSignatureID: employeeDigitalSignatureID },
        }
      );
      return res.status(200).json({
        status: 200,
        message: message.usermessage.empdigitalsignatureupdate,
      });
    } else {
      let change_data_status = await EmployeeDigitalSignature.update(
        {
          userMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { employeeDigitalSignatureID: employeeDigitalSignatureID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.empdigitalsignatureupdate,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} employeeDigitalSignatureID  to update status of employeeDigitalSignature
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeeDigitalSignatureID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeeDigitalSignature.update(
          {
            status: '1',
          },
          {
            where: {
              employeeDigitalSignatureID: employeeDigitalSignatureID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await EmployeeDigitalSignature.update(
          {
            status: '0',
          },
          {
            where: {
              employeeDigitalSignatureID: employeeDigitalSignatureID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.empdigitalsignaturedelete,
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
 * @param {id} employeeDigitalSignatureID  to delete id
 */
exports.postDeleteEmployeeDigitalSignatureById = async (req, res, next) => {
  try {
    let = { employeeDigitalSignatureID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await EmployeeDigitalSignature.update(
        {
          status: 2,
        },
        {
          where: { employeeDigitalSignatureID: employeeDigitalSignatureID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.empdigitalsignaturedelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeDigitalSignatureByUserMasterIdSelected = async (
  req,
  res,
  next
) => {
  try {
    let get_one_data = await EmployeeDigitalSignature.findOne({
      where: {
        userMasterID: req.params.id,
        status: 1,
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};
