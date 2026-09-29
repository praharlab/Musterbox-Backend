const Sequelize = require('sequelize');
const EmployeeNda = require('../models/employeeNda');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMasters = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const Ndacategory = require('../models/Ndacategory');
const ndacategory = require('../models/Ndacategory');
const companyMaster = require('../models/companyMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

exports.postAddemployee = async (req, res, next) => {
  try {
    let = {
      Ndacategoryid,
      userMasterID,
      companyMasterID,
      description,
      Ndaname,
      givendate,
      showtoemployee,
      status,
      createBy,
      createByIp,
    } = await req.body;
    let pdf = '';
    if (req.file) {
      pdf = req.file.filename;
    }
    let insert_db_status = await EmployeeNda.create({
      Ndacategoryid,
      userMasterID,
      companyMasterID,
      description,
      Ndaname,
      givendate,
      pdf,
      showtoemployee,
      status,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.employeeNda,
      data: {},
    });
  } catch (err) {
    next(err.message);
  }
};

// **
//  return all employee data
//  */

exports.getAllemployeeData = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee, count } = await EmployeeNda.findAll({
      raw: true,
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

    return res
      .status(200)
      .json({ status: 200, data: employee, totalcount: count });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeNdaid id
 *
 * @param {id} employeeNdaid  to fetch userdata
 */

exports.getemployeeById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeNda.findOne({
      where: {
        employeeNdaid: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
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

//get by company id
exports.getbyCompanyId = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    req.userDetails.accessibleCompanies = companyMasterID;
    condition.companyMasterID = companyMasterID;
    condition.status = [0, 1];

    if (startdate && enddate)
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          Ndaname: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
        },
      ];

    const AllNDA = await EmployeeNda.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: CompanyMasters,
          as: 'companyMaster',
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: ndacategory,
        },
      ],
    });

    for (let j = 0; j < AllNDA.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllNDA.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllNDA.rows[j].updateBy },
      });

      if (user1) AllNDA.rows[j].createBy = user1.dataValues.displayName;
      if (user2) AllNDA.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res
      .status(200)
      .json({ status: 200, data: AllNDA.rows, totalcount: AllNDA.count });
  } catch (err) {
    next(err.message);
  }
};

/**
 * update data
 *
 * @param {id} employeeNdaid  to update id
 */
exports.updateemployeeData = async (req, res, next) => {
  try {
    let = {
      employeeNdaid,
      Ndacategoryid,
      userMasterID,
      companyMasterID,
      description,
      Ndaname,
      givendate,
      showtoemployee,
      status,
      createBy,
      updateBy,
      createByIp,
      updateByIp,
    } = await req.body;
    if (req.file) {
      let pdf = req.file.filename;
      let change_data_status = await EmployeeNda.update(
        {
          Ndacategoryid,
          userMasterID,
          companyMasterID,
          description,
          Ndaname,
          givendate,
          pdf,
          showtoemployee,
          status,
          createBy,
          updateBy,
          createByIp,
          updateByIp,
        },
        {
          where: { employeeNdaid: employeeNdaid },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeeupdate,
        data: {},
      });
    } else {
      let change_data_status = await EmployeeNda.update(
        {
          employeeNdaid,
          Ndacategoryid,
          userMasterID,
          companyMasterID,
          description,
          Ndaname,
          givendate,
          showtoemployee,
          status,
          createBy,
          updateBy,
          createByIp,
          updateByIp,
        },
        {
          where: { employeeNdaid: employeeNdaid },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeeupdate,
        data: {},
      });
    }
  } catch (err) {
    next(err.message);
  }
};

// /*
// *
// delete by id
// * Delete User employee by employeeNdaid
// *
// */

exports.deleteemployee = async (req, res, next) => {
  try {
    let ID = await req.params.id;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await EmployeeNda.update(
        {
          status: 2,
        },
        {
          where: { employeeNdaid: ID },
          transaction: t,
        }
      );
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.employeedelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
