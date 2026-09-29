const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const EmployeeEmployeement = require('../models/employeeEmployeement');
const Employeement = require('../models/employeement');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Designation = require('../models/designation');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');

function addMonths(numOfMonths, date = new Date()) {
  date.setMonth(date.getMonth() + numOfMonths);

  return date;
}

exports.postAddEmployeeEmployeement = async (req, res, next) => {
  try {
    let {
      userMasterID,
      employeementId,
      applicableDate,
      endDate,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;

    let emp = await Employeement.findOne({
      where: { employeementId: employeementId },
      status: 1,
    });
    if (emp.dataValues.typePeriod == 0) {
      insert_db_status = await EmployeeEmployeement.create({
        userMasterID,
        employeementId,
        applicableDate,
        endDate,
        status: 1,
        createBy,
        createByIp,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementadd,
        data: {},
      });
      return insert_db_status;
    } else {
      insert_db_status = await EmployeeEmployeement.create({
        userMasterID,
        employeementId,
        applicableDate,
        endDate: addMonths(
          emp.dataValues.typePeriod,
          (date = new Date(req.body.applicableDate))
        ),
        status: 1,
        createBy,
        createByIp,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementadd,
        data: {},
      });
      return insert_db_status;
    }
  } catch (err) {
    next(err.message);
  }
};

exports.getAllEmployeeEmployeement = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows: employee_employeement, count } =
      await EmployeeEmployeement.findAll({
        where: {},
        ...paginationQuery,
        order: [['applicableDate', 'ASC']],
        include: [
          {
            model: UserMaster,
            required: true,
            as: 'employee',
            ...accessibleUsers(req.userDetails),
          },
        ],
      });

    res.status(200).json({
      status: 200,
      data: employee_employeement,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeeEmployeementById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeeEmployeement.findOne({
      where: {
        employeeEmployeementId: req.params.id,
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

exports.getEmployeeEmployeementByUserId = async (req, res, next) => {
  try {
    const { rows: get_one_data, count } =
      await EmployeeEmployeement.findAndCountAll({
        where: {
          userMasterID: req.params.id,
          status: 1,
        },
        order: [['applicableDate', 'ASC']],
        include: [{ model: UserMaster, as: 'employee' }],
      });

    return res
      .status(200)
      .json({ status: 200, data: get_one_data, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateEmployeeEmployeement = async (req, res, next) => {
  try {
    let {
      userMasterID,
      employeementId,
      employeeEmployeementId,
      applicableDate,
      createBy,
      createByIp,
    } = await req.body;
    let insert_db_status;
    let emp;

    emp = await Employeement.findOne({
      where: { employeementId: employeementId },
      status: 1,
    });
    if (emp.dataValues.typePeriod == 0) {
      insert_db_status = await EmployeeEmployeement.update(
        {
          userMasterID,
          employeementId,
          applicableDate,
          endDate: null,
          status: 1,
          createBy,
          createByIp,
        },
        {
          where: { employeeEmployeementId: employeeEmployeementId },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementupdate,
        data: {},
      });
      return insert_db_status;
    } else {
      insert_db_status = await EmployeeEmployeement.update(
        {
          userMasterID,
          employeementId,
          applicableDate,
          endDate: addMonths(
            emp.dataValues.typePeriod,
            (date = new Date(req.body.applicableDate))
          ),
          status: 1,
          createBy,
          createByIp,
        },
        {
          where: { employeeEmployeementId: employeeEmployeementId },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementupdate,
        data: {},
      });
      return insert_db_status;
    }
  } catch (err) {
    next(err);
  }
};

exports.postDeleteEmployeeEmployeementById = async (req, res, next) => {
  try {
    let = { employeeEmployeementId, userMasterID } = await req.body;

    let employee_data = await EmployeeJoiningDetails.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
      },
    });

    let employment_data = await EmployeeEmployeement.findOne({
      where: {
        employeeEmployeementId: employeeEmployeementId,
      },
    });

    if (employee_data && employment_data) {
      if (employee_data.employment == employment_data.employeement) {
        return res.status(200).json({
          status: 401,
          message:
            'This employeement is set in Employee Joining Details So You cannot delete this employment details.',
          data: {},
        });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let delete_db_status = await EmployeeEmployeement.destroy(
            {
              where: {
                employeeEmployeementId: employeeEmployeementId,
              },
            },
            { transaction: t }
          );
          res.status(200).json({
            status: 200,
            message: message.usermessage.employeeEmployeementDelete,
            data: {},
          });
          return delete_db_status;
        });
      }
    } else {
      return res
        .status(200)
        .json({ status: 401, message: 'Data not found', data: {} });
    }
  } catch (err) {
    next(err);
  }
};

exports.toBeConfirmedEmployee = async (req, res, next) => {
  try {
    const { users, companyMasterID, exportData, page, limit } = await req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const rawCurrentDate = new Date();
    const halfMonthLaterDate = new Date(rawCurrentDate);
    halfMonthLaterDate.setDate(halfMonthLaterDate.getDate() + 15);
    const formattedCurrentDate = asiaKolkataDateTime(new Date(rawCurrentDate));
    const formattedHalfMonthLaterDate = asiaKolkataDateTime(
      new Date(halfMonthLaterDate)
    );

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }

    let condition = {
      endDate: {
        [Sequelize.Op.not]: null,
        [Sequelize.Op.lte]: new Date(formattedHalfMonthLaterDate),
      },
    };

    if (users && users.length > 0) condition.userMasterID = users;

    condition.employeement = 'Probation';

    condition.status = 1; // EmployeeEmployeement Status

    if (companyMasterID)
      condition['$employee.companyMasterId$'] = companyMasterID;

    condition['$employee.status$'] = 1; //USer Status

    const order = [['endDate', 'ASC']];
    const { rows: employeeEmployeementData, count } =
      await EmployeeEmployeement.findAndCountAll({
        // raw: true,
        where: condition,
        ...paginationQuery,
        order,
        attributes: [
          'employeeEmployeementId',
          'employeement',
          'userMasterID',
          'applicableDate',
          'endDate',
        ],
        include: [
          {
            required: true,
            model: UserMaster,
            as: 'employee',
            ...accessibleUsers(req.userDetails),
            attributes: ['displayName', 'userNumber', 'companyMasterId'],
            include: [
              {
                required: false,
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
                required: false,
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
                required: false,
                model: EmployeeBranch,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                    { endDate: { [Sequelize.Op.eq]: null } },
                  ],
                },
                required: false,
                attributes: ['branchID'],
                include: [
                  {
                    model: BranchMaster,
                    as: 'branchMaster',
                    attributes: ['branchName'],
                  },
                ],
              },
              {
                required: true,
                model: EmployeeJoiningDetails,
                where: {
                  employment: 'Probation',
                },
                // attributes: ['employeeCode'],
              },
              {
                required: false,
                model: companyMaster,
                attributes: ['companyMasterID', 'companyName'],
              },
            ],
          },
        ],
      });

    const finaldata = employeeEmployeementData.map((e) => {
      const formattedExpiryDate = asiaKolkataDateTime(
        new Date(e.endDate)
      ).slice(0, 10);
      const date = new Date(formattedExpiryDate);
      const formattedDate =
        ('0' + date.getDate()).slice(-2) +
        '-' +
        ('0' + (date.getMonth() + 1)).slice(-2) +
        '-' +
        date.getFullYear();

      const currentDate = new Date(formattedCurrentDate.slice(0, 10));
      const timeDifference = Math.abs(currentDate.getTime() - date.getTime());
      const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

      return {
        displayName: e.employee.displayName,
        userMasterID: e.userMasterID,
        employeeCode:
          e.employee.employeeJoiningDetails.length > 0
            ? e.employee.employeeJoiningDetails[0].employeeCode
            : '',
        companyName: e.employee.companyMaster.companyName,
        branchName:
          e.employee.employeeBranches.length > 0
            ? e.employee.employeeBranches[0].branchMaster.branchName
            : '',
        departmentName:
          e.employee.employeeDepartments.length > 0
            ? e.employee.employeeDepartments[0].department.departmentName
            : '',
        designationName:
          e.employee.employeeDesignations.length > 0
            ? e.employee.employeeDesignations[0].designation.designationName
            : '',
        userNumber: e.employee.userNumber,
        employeement: e.employeement,
        probationEndingDate: formattedDate,
        probationEndingstatus:
          date.getTime() < currentDate.getTime()
            ? '2'
            : date.getTime() === currentDate.getTime()
              ? '0'
              : '1',
        status:
          date.getTime() < currentDate.getTime()
            ? `Ended Before ${dayDifference} Days`
            : date.getTime() === currentDate.getTime()
              ? 'Ending Today'
              : `Ending In ${dayDifference} Days`,
      };
    });

    if (exportData) {
      const finalExportData = finaldata.map((e) => {
        return {
          'Probation Status': e.status,
          'Employee Code': e.employeeCode,
          'Employee Name': e.displayName,
          'Employee Number': e.userNumber,
          'Employee Name': e.companyName,
          'Branch Name': e.branchName,
          'Department Name': e.departmentName,
          'Designation Name': e.designationName,
          'Employeement Type': e.employeement,
          'Probation Ending Date': e.probationEndingDate,
        };
      });

      return await generateExcel(
        finalExportData,
        'To-Be-ConFirm-Employee',
        'xlsx',
        res
      );
    }
    return res.status(200).json({
      status: 200,
      data: finaldata,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
