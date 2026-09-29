const Sequelize = require('sequelize');
// const anonymousFeedback = require('../models/anonymousFeedback');
// const userIp = require('../models/userIP');
const userIp = require('../models/userIP');
const { executeQuery } = require('./common.controller');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const { generateExcel } = require('../utils/exportData');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const moment = require('moment');
const BranchMaster = require('../models/branchMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const Designation = require('../models/designation');
const EmployeeBranch = require('../models/employeeBranch');

exports.postadd = async (req, res, next) => {
  try {
    const { ips, userMasterID } = req.body;
    const dataToCreate = [];

    ips.forEach((ip) => {
      userMasterID.forEach((userMasterID) => {
        dataToCreate.push({
          ip,
          userMasterID,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
        });
      });
    });

    // Perform a bulk create operation
    await userIp.bulkCreate(dataToCreate, { user: req.userDetails });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('User IP Address'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, Export, companyMasterID, userMasterID } =
      req.body;

    const condition = {};
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    if (userMasterID && userMasterID.length > 0) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    }

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await userIp.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          required: true,
          attributes: ['userMasterID', 'userNumber', 'displayName'],
          where: {
            companyMasterId: companyMasterID,
            ...(searchQuery && {
              displayName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            }),
          },
          include: [
            {
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['designationID'],
              include: [
                {
                  model: Designation,
                  as: 'designation',
                  attributes: ['designationName'],
                },
              ],
            },
            {
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['departmentID'],
              include: [
                {
                  model: Department,
                  as: 'department',
                  attributes: ['departmentName'],
                },
              ],
            },
            {
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },

            {
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (Export) {
      const finaldata = rows.map((e) => {
        return {
          'Employee Code': e['userMaster.employeeJoiningDetails.employeeCode'],
          'Employee Name': e['userMaster.displayName'],
          Number: e['userMaster.userNumber'],
          'Branch Name':
            e['userMaster.employeeBranches.branchMaster.branchName'],
          'Designation Name':
            e['userMaster.employeeDesignations.designation.designationName'],
          'Department Name':
            e['userMaster.employeeDepartments.department.departmentName'],
          IP: e.ip,
        };
      });
      await generateExcel(finaldata, 'Anonymous Feedback ', 'xlsx', res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.editdata = async (req, res, next) => {
  try {
    const { ip, userMasterID } = req.body;

    const currentdata = await userIp.findOne({
      where: {
        useripID: req.params.id,
      },
    });

    if (!currentdata) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.deletedrecord,
      });
    }

    currentdata.ip = ip;
    currentdata.userMasterID = userMasterID;
    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('User IP Address'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const useripID = req.params.id;

    const data = await userIp.findOne({
      where: {
        useripID: useripID,
      },
      include: [
        {
          model: UserMaster,
          required: true,
          attributes: ['displayName'], // Include the displayName or other relevant fields
        },
      ],
      raw: true,
    });

    if (!data) {
      return res.status(404).json({
        status: 404,
        message: 'Data not found',
      });
    }

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteip = async (req, res, next) => {
  try {
    const { useripID } = await req.body;

    const findData = await userIp.findByPk(useripID);

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: usermessage.deleteMessage('User IP Address'),
    });
  } catch (err) {
    next(err);
  }
};
