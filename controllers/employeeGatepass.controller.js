const { Op } = require('sequelize');
const EmployeeGatepass = require('../models/employeeGatepass');
const UserMaster = require('../models/userMaster');
const { generateExcelForEmployeeGatePass } = require('../utils/exportData');
const { usermessage } = require('../response_message/message');
const {
  userAttributes,
  statusCodes,
  companyAttributes,
} = require('../utils/commonVars');
const EmployeeGatepassCheckInOut = require('../models/employeeGatepassCheckInOut');
const { CustomError } = require('../utils/customError');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const GatePassAuthorization = require('../models/gatePassAuthorization');
const AuthorizationMaster = require('../models/authorizationMaster');
const AuthorizationDetails = require('../models/AuthorizationDetails');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');

const {
  employeeDepartment,
  employeeDesignation,
  employeeBranch,
} = require('../utils/commonUtilFunctions');
const EmployeeDesignation = require('../models/employeeDesignation');
const { Sequelize } = require('sequelize');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const EmployeeWorkingArea = require('../models/employeeWorkingArea');
const WorkingArea = require('../models/workingArea');

exports.createMyGatepass = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      description,
      date,
      fromTime,
      toTime,
      status,
      purposeFor,
      userMasterID,
      companyMasterID,
    } = req.body;

    const gatePassData = req.body;

    let authorizationmaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterID: 6 },
    });

    if (!authorizationmaster) {
      return res.status(statusCodes.OK).json({
        status: 401,
        message: 'Authorization Master Not Found',
      });
    }

    let authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationmaster.authorizationMasterID,
        userMasterID: gatePassData.userMasterID,
        status: 1,
      },
      raw: true,
    });

    let authorizationStatus;
    let AuthorizationCriterias = null;
    if (authorizationdetails) {
      AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      authorizationStatus =
        AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No' ? 2 : 1;
    } else {
      authorizationStatus = 0;
    }

    const empgatepass = await EmployeeGatepass.create(
      {
        description,
        date,
        fromTime,
        toTime,
        purposeFor,
        status,
        authorizationStatus,
        userMasterId: userMasterID,
        companyMasterId: companyMasterID,
      },
      { user: req.userDetails, transaction }
    );

    if (authorizationStatus > 0) {
      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        await GatePassAuthorization.create(
          {
            TableName: 'EmployeeGatePass',
            ReferenceID: empgatepass.id,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            status: 1,
            authstatus: 2,
            createBy: req.userDetails.userMasterId,
            createByIp: req.ip,
          },
          { transaction }
        );
      } else {
        for (let userId of authorizationdetails.AuthorizedByUserMasterId) {
          await GatePassAuthorization.create(
            {
              TableName: 'EmployeeGatePass',
              ReferenceID: empgatepass.id,
              userMasterID: userId,
              status: 1,
              authstatus: 2,
              createBy: req.userDetails.userMasterId,
              createByIp: req.ip,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    return res.status(200).json({
      data: empgatepass,
      message: 'Gate pass created successfully',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.updateMyGatepass = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      description,
      date,
      fromTime,
      toTime,
      purposeFor,
      userMasterId,
      status,
      rejectionRemarks,
    } = req.body;

    const empgatepass = await EmployeeGatepass.findByPk(id);

    if (!empgatepass) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('employeeGatepass'),
      });
    }

    if (description) empgatepass.description = description;
    if (date) empgatepass.date = date;
    if (fromTime) empgatepass.fromTime = fromTime;
    if (toTime) empgatepass.toTime = toTime;
    if (purposeFor) empgatepass.purposeFor = purposeFor;
    if (status) empgatepass.status = status;
    if (userMasterId) empgatepass.userMasterId = userMasterId;
    if (rejectionRemarks) empgatepass.rejectionRemarks = rejectionRemarks;

    await empgatepass.save({ user: req.userDetails, transaction });

    let authorizationmaster = await AuthorizationMaster.findOne({
      where: { authorizationMasterID: 6 },
    });

    if (!authorizationmaster) {
      return res.status(statusCodes.OK).json({
        status: 401,
        message: 'Authorization Master Not Found',
      });
    }

    let authorizationdetails = await AuthorizationDetails.findOne({
      where: {
        AuthorizationMasterID: authorizationmaster.authorizationMasterID,
        userMasterID: empgatepass.userMasterId,
        status: 1,
      },
      raw: true,
    });

    let authorizationStatus;
    let AuthorizationCriterias = null;
    if (authorizationdetails) {
      AuthorizationCriterias = await AuthorizationCriteria.findOne({
        where: {
          AuthorizationCriteriaID: authorizationdetails.AuthorizationCriteriaID,
          status: 1,
        },
        raw: true,
      });

      authorizationStatus =
        AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No' ? 2 : 1;
    } else {
      authorizationStatus = 0;
    }

    if (authorizationStatus > 0) {
      await GatePassAuthorization.destroy({
        where: {
          TableName: 'EmployeeGatePass',
          ReferenceID: empgatepass.id,
        },
        transaction,
      });

      if (AuthorizationCriterias.AuthorizationCriteria == 'Sequeance No') {
        await GatePassAuthorization.create(
          {
            TableName: 'EmployeeGatePass',
            ReferenceID: empgatepass.id,
            userMasterID: authorizationdetails.AuthorizedByUserMasterId[0],
            status: 1,
            authstatus: 2,
            createBy: req.userDetails.userMasterId,
            createByIp: req.ip,
          },
          { transaction }
        );
      } else {
        for (let userId of authorizationdetails.AuthorizedByUserMasterId) {
          await GatePassAuthorization.create(
            {
              TableName: 'EmployeeGatePass',
              ReferenceID: empgatepass.id,
              userMasterID: userId,
              status: 1,
              authstatus: 2,
              createBy: req.userDetails.userMasterId,
              createByIp: req.ip,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    return res.status(statusCodes.OK).json({
      data: empgatepass,
      message: 'Gate pass updated successfully',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.createEmployeeGatepass = async (req, res, next) => {
  try {
    const {
      description,
      date,
      fromTime,
      toTime,
      status,
      purposeFor,
      userMasterID,
      companyMasterID,
    } = req.body;

    const empgatepass = await EmployeeGatepass.create(
      {
        description,
        date,
        fromTime,
        toTime,
        purposeFor,
        status,
        authorizationStatus: 3,
        userMasterId: userMasterID,
        companyMasterId: companyMasterID,
      },
      { user: req.userDetails }
    );

    return res.status(statusCodes.OK).json({
      data: empgatepass,
      message: usermessage.addMessage('Employee Gate pass'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployeeGatepass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      description,
      date,
      fromTime,
      toTime,
      purposeFor,
      userMasterId,
      status,
      rejectionRemarks,
    } = req.body;
    const empgatepass = await EmployeeGatepass.findByPk(id);

    if (!empgatepass) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('employeeGatepass'),
      });
    }

    if (description) empgatepass.description = description;
    if (date) empgatepass.date = date;
    if (fromTime) empgatepass.fromTime = fromTime;
    if (toTime) empgatepass.toTime = toTime;
    if (purposeFor) empgatepass.purposeFor = purposeFor;
    if (status) empgatepass.status = status;
    if (userMasterId) empgatepass.userMasterId = userMasterId;
    if (rejectionRemarks) empgatepass.rejectionRemarks = rejectionRemarks;

    await empgatepass.save({ user: req.userDetails });
    return res.status(statusCodes.OK).json({
      data: empgatepass,
      message: usermessage.updateMessage('employeeGatepass'),
    });
  } catch (err) {
    next(err);
  }
};

exports.employeeGatePassCheckInCheckOut = async (req, res, next) => {
  try {
    const { time, employeeGatepassId, type, address } = req.body;

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    const currentTimeInMinutes =
      currentDate.getHours() * 60 + currentDate.getMinutes();

    const [hours1, minutes1] = time.split(':').map(Number);
    const bodyTimeInMinutes = Number(hours1 * 60) + Number(minutes1);

    if (currentTimeInMinutes > bodyTimeInMinutes) {
      throw new CustomError(
        `${type} time cannot be less than current time.`,
        statusCodes.BAD_REQUEST
      );
    }

    const lastCheck = await EmployeeGatepassCheckInOut.findOne({
      where: { employeeGatepassId },
      order: [['createdAt', 'DESC']],
    });

    if (lastCheck) {
      let lastCheckTime = await checkFromAndToTime(lastCheck.time, time, type);
      if (lastCheckTime) {
        throw new CustomError(lastCheckTime, statusCodes.BAD_REQUEST);
      }
      if (lastCheck.type === 'Checkin' && type === 'Checkin') {
        throw new CustomError(
          'You cannot create a new check-in without checking out first!',
          statusCodes.BAD_REQUEST
        );
      } else if (lastCheck.type === 'Checkout' && type === 'Checkout') {
        throw new CustomError(
          'You cannot create a new checkout without checking in first!',
          statusCodes.BAD_REQUEST
        );
      } else if (lastCheck.type === 'FinalCheckin') {
        throw new CustomError(
          'Final check-in has already been completed. No further check-ins or check-outs allowed!',
          statusCodes.BAD_REQUEST
        );
      }
    }

    let attachment;
    if (req.files.length > 0) attachment = req.files[0].path;

    if (type === 'FinalCheckin') {
      await EmployeeGatepassCheckInOut.create(
        {
          time,
          attachment,
          date: formattedDate,
          type: 'FinalCheckin',
          employeeGatepassId,
          address,
        },
        {
          user: req.userDetails,
        }
      );

      return res
        .status(200)
        .json({ message: 'Final check-in completed successfully!' });
    } else {
      const newCheckInOut = await EmployeeGatepassCheckInOut.create(
        {
          time,
          attachment,
          date: formattedDate,
          type,
          employeeGatepassId,
          address,
        },
        {
          user: req.userDetails,
        }
      );

      if (type === 'Checkin') {
        return res.status(200).json({ message: 'Checked in successfully!' });
      } else if (type === 'Checkout') {
        return res.status(200).json({ message: 'Checked out successfully!' });
      } else {
      }
    }

    return res.status(200).json({ message: 'Checked out successfully!' });
  } catch (error) {
    next(error);
  }
};

function checkFromAndToTime(time1, time2, Type) {
  const [hours1, minutes1] = time1.split(':').map(Number);
  const [hours2, minutes2] = time2.split(':').map(Number);

  const fromTime = Number(hours1 * 60) + Number(minutes1);
  const toTime = Number(hours2 * 60) + Number(minutes2);

  if (fromTime > toTime) {
    return `${Type} is less than Pervious Check-In/Out. ${Type} need to greater than Pervious Check-In/Out.`;
  } else if (fromTime === toTime) {
    return `${Type} is equal to Check-In/Out. ${Type} need to greater than Pervious Check-In/Out.`;
  }
}

exports.getEmployeeGatepassDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const empgatepass = await EmployeeGatepass.findByPk(id, {
      include: [
        {
          model: companyMaster,
          attributes: companyAttributes,
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'employee',
          attributes: userAttributes,
        },
      ],
    });

    if (!empgatepass)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('EmployeeGatepass'),
      });

    return res.status(statusCodes.OK).json({
      data: empgatepass,
      message: usermessage.fetchMessage('EmployeeGatepass'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listEmployeeGatepass = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      userMasterID,
      companyMasterID,
      status,
      search,
      sortByField,
      sortByValue,
      exportData,
      exportFileType,
      startDate,
      endDate,
    } = req.query;
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const condition = {};
    if (status) {
      const statusArray = status.split(',').map(Number);
      condition.authorizationStatus = { [Op.in]: statusArray };
    }
    if (userMasterID) condition.userMasterId = userMasterID;

    if (search)
      condition[Op.or] = [
        { '$employee.displayName$': { [Op.iLike]: `%${search}%` } },
        { '$companyMaster.companyName$': { [Op.iLike]: `%${search}%` } },
      ];

    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      companyFilter.companyMasterID = +companyMasterID;
    }

    if (startDate && endDate)
      condition.date = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];
    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (page - 1) * pageSize;
      paginationQuery.limit = +pageSize;
    }

    let orderFilter = {};
    if (exportData) orderFilter = [['createdAt', 'ASC']];
    if (!exportData) orderFilter = [['createdAt', 'DESC']];

    const empgatepass = await EmployeeGatepass.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: companyMaster,
          attributes: companyAttributes,
          where: companyFilter,
        },
        {
          model: UserMaster,
          as: 'createdByUser',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'employee',
          attributes: userAttributes,
          required: true,
          ...accessibleUsers(req.userDetails),
          include: [
            {
              separate: true,
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
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
              separate: true,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
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
              separate: true,
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: {
                  [Sequelize.Op.lte]: new Date(filterDate),
                },
                [Sequelize.Op.or]: [
                  {
                    endDate: { [Sequelize.Op.gte]: new Date(filterDate) },
                  },
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
              separate: true,
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ['employeeCode'],
            },
            {
              required: false,
              separate: true,
              model: EmployeeDivision,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['divisionId', 'startDate'],
              include: [
                {
                  model: Division,
                  attributes: ['divisionName'],
                },
              ],
            },

            {
              required: false,
              separate: true,
              model: EmployeeWorkingArea,
              where: {
                status: 1,
                startDate: { [Sequelize.Op.lte]: filterDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: filterDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ['workingAreaId', 'startDate'],
              include: [
                {
                  model: WorkingArea,
                  attributes: ['workingAreaName'],
                },
              ],
            },
          ],
        },
      ],
      nest: true,
      distinct: true,
    });

    for (let item of empgatepass.rows) {
      const getLastCheck = await EmployeeGatepassCheckInOut.findAll({
        where: { employeeGatepassId: item.id },
        order: orderFilter,
      });

      item.dataValues.lastCheck = getLastCheck;
    }

    if (exportData && empgatepass.rows.length == 0) {
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('EmployeeGatepass'),
      });
    }

    //for excel
    if (exportData) {
      const final1 = [];
      empgatepass.rows.map((item, index) => {
        const companyInfo = [
          index + 1,
          item.employee.displayName,
          item.companyMaster.companyName,
          item.employee.employeeBranches?.[0]?.branchMaster?.branchName || '',
          item.employee.employeeDepartments?.[0]?.department?.departmentName ||
            '',
          item.employee.employeeDesignations?.[0]?.designation
            ?.designationName || '',
          item.status == 'Reject' ? 'Rejected' : item.status,
          item.description,
          item.date
            ? item.date.slice(8, 10) +
              '-' +
              item.date.slice(5, 7) +
              '-' +
              item.date.slice(0, 4)
            : '',
          convertTo12HourFormat(item.fromTime),
          convertTo12HourFormat(item.toTime),
          item.purposeFor,
          item.rejectionRemarks ? item.rejectionRemarks : '',
        ];

        if (item.dataValues.lastCheck.length === 0) {
          final1.push([...companyInfo, '', '', '', '']);
        } else {
          item.dataValues.lastCheck.forEach((lastCheckItem) => {
            const { date, time, type, address } = lastCheckItem;
            final1.push([
              ...companyInfo,
              date
                ? date.slice(8, 10) +
                  '-' +
                  date.slice(5, 7) +
                  '-' +
                  date.slice(0, 4)
                : '',
              ,
              convertTo12HourFormat(time),
              type,
              address,
            ]);
          });
        }
      });

      await generateExcelForEmployeeGatePass(
        final1,
        'empgatepass',
        exportFileType,
        res
      );
      return;
    }

    return res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('EmployeeGatepass'),
      data: empgatepass.rows,
      totalcount: empgatepass.count,
      page: +page,
      pageSize: paginationQuery.limit,
    });
  } catch (err) {
    next(err);
  }
};

function convertTo12HourFormat(time24) {
  if (!time24) return '';

  let [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;
}

exports.deleteEmployeeGatepass = async (req, res, next) => {
  try {
    const { id } = req.params;

    const empgatepass = await EmployeeGatepass.findByPk(id);

    if (!empgatepass)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('EmployeeGatepass'),
      });

    await empgatepass.destroy({ user: req.userDetails });

    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('EmployeeGatepass'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postUpdategatePass1 = async (req, res, next) => {
  try {
    const { id, inTime, outTime, checkINattachment, checkOUTattachment } =
      req.body;
    const existingRecord = await EmployeeGatepassCheckInOut.findOne({
      where: { id },
    });

    if (!existingRecord) {
      throw new CustomError(
        usermessage.notFoundMessage('Employee Gatepass'),
        statusCodes.NOT_FOUND
      );
    }

    if (outTime) existingRecord.outTime = outTime;
    if (inTime) existingRecord.inTime = inTime;
    if (checkINattachment) existingRecord.checkINattachment = checkINattachment;
    if (checkOUTattachment)
      existingRecord.checkOUTattachment = checkOUTattachment;
    await existingRecord.save({ user: req.userDetails });
    return res.status(200).json({
      // data: updatedRecord,
      message: 'Employee gatepass record updated successfully.',
    });
  } catch (err) {
    next(err);
  }
};
