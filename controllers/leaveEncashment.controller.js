const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const { userAttributes } = require('../utils/commonVars');
const LeaveEncashment = require('../models/leaveEncashment');
const {
  leaveOperationENUM,
  leaveEncashmentStatusEnum,
} = require('../utils/dbUtils');
const UserLeaveLapse = require('../models/userLeaveLapse');
const UserMaster = require('../models/userMaster');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const moment = require('moment');
const { generateExcel } = require('../utils/exportData');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');

exports.cancelLapseLeaveEncashment = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { id, operationType } = await req.body;

    if (!id) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Leave Encashment ID'),
      });
    }

    if (!operationType) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Operation Type'),
      });
    }
    const findLeaveEncashment = await LeaveEncashment.findOne({
      where: {
        id: id,
        status: 1,
      },
    });

    if (!findLeaveEncashment) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('Leave Encashment'),
      });
    }

    if (findLeaveEncashment.referenceId) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: 'Leave is Already Encashed',
      });
    }

    let status;
    if (operationType === leaveOperationENUM.cancelLeaveEncashmentAndLapse) {
      status = 11; // canceled and Lapsed
    } else {
      status = 10; // canceled
    }

    await LeaveEncashment.update(
      {
        status,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: {
          id: id,
        },
      },
      {
        transaction,
      }
    );

    if (operationType === leaveOperationENUM.cancelLeaveEncashmentAndLapse) {
      await UserLeaveLapse.create(
        {
          userMasterID: findLeaveEncashment.userMasterID,
          LeaveTranId: findLeaveEncashment.LeaveTranId,
          LapseDays: findLeaveEncashment.days,
          LapseYearMonth: findLeaveEncashment.YYYYMM,
          status: 1,
          createBy: req.userDetails.userMasterId,
          createByIp: req.userDetails.userIpAddress,
        },
        { transaction }
      );
    }

    const responseMessage =
      operationType === leaveOperationENUM.cancelLeaveEncashmentAndLapse
        ? message.usermessage.addMessage('Leave Lapse')
        : message.usermessage.cancelMessage('Leave Encashment');
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: responseMessage,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAllLeaveEncashment = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      fromMonth,
      toMonth,
      LeaveTranId,
      exportData,
      encashmentStatus,
      companyMasterID,
    } = await req.body;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    if (userMasterID && userMasterID.length) {
      condition.userMasterID = userMasterID;
    }

    if (fromMonth && toMonth) {
      fromMonth = fromMonth.replace('-', '');
      fromMonth = fromMonth.replace('-', '');
      toMonth = toMonth.replace('-', '');
      condition.YYYYMM = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };
    }

    if (LeaveTranId) {
      condition.LeaveTranId = LeaveTranId;
    }

    if (encashmentStatus == leaveEncashmentStatusEnum.PAID) {
      condition.status = 1;
      condition.referenceId = { [Sequelize.Op.ne]: null };
    } else if (encashmentStatus == leaveEncashmentStatusEnum.UNPAID) {
      condition.status = 1;
      condition.referenceId = null;
    } else if (encashmentStatus == leaveEncashmentStatusEnum.CANCELLED) {
      condition.status = 10;
    } else if (encashmentStatus == leaveEncashmentStatusEnum.LAPSED) {
      condition.status = 11;
    }
    const hrleavetypeCondition = {
      companyMasterID: +companyMasterID,
      status: 1,
      Leave_Allow: 'Y',
      LeaveID: { [Sequelize.Op.notIn]: [5, 18, 25] },
    };

    const order = [['YYYYMM', 'DESC']];
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const { rows: findUnpaidLeaveEncashments, count } =
      await LeaveEncashment.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            where: {
              companyMasterId: companyMasterID,
            },
            attributes: userAttributes,
            include: [
              {
                required: false,
                model: EmployeeDesignation,
                where: {
                  status: 1,
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
                  applicableDate: { [Sequelize.Op.lte]: new Date(currentDate) },
                  [Sequelize.Op.or]: [
                    { endDate: { [Sequelize.Op.gte]: new Date(currentDate) } },
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
                required: false,
                model: EmployeeJoiningDetails,
                attributes: ['employeeCode'],
              },
            ],
          },
          {
            model: HrLeaveTypes,
            attributes: [
              'LeaveTranId',
              'LeaveID',
              'companyMasterID',
              'Allow_On_H',
              'status',
            ],
            where: hrleavetypeCondition,
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveID', 'LeaveName', 'LeaveDesc', 'status'],
            },
          },
          {
            required: false,
            model: UserMaster,
            as: 'createByUser',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updateByUser',
            attributes: userAttributes,
          },
        ],
      });

    const finalLeaveEncahsmentData = findUnpaidLeaveEncashments.map((item) => {
      let encashmentStatus = '';

      if (item.status == 1) {
        if (item.referenceId == null) {
          encashmentStatus = leaveEncashmentStatusEnum.UNPAID;
        } else {
          encashmentStatus = leaveEncashmentStatusEnum.PAID;
        }
      } else if (item.status == 10) {
        encashmentStatus = leaveEncashmentStatusEnum.CANCELLED;
      } else if (item.status == 11) {
        encashmentStatus = leaveEncashmentStatusEnum.LAPSED;
      }

      return {
        employeeCode:
          item.userMaster?.employeeJoiningDetails?.[0]?.employeeCode || '',
        Designation:
          item.userMaster?.employeeDesignations?.[0]?.designation
            ?.designationName || '',
        userNumber: item.userMaster?.userNumber || '',
        Branch:
          item.userMaster?.employeeBranches?.[0]?.branchMaster?.branchName ||
          '',
        Department:
          item.userMaster?.employeeDepartments?.[0]?.department
            ?.departmentName || '',
        id: item.id,
        userMasterID: item.userMasterID,
        LeaveTranId: item.LeaveTranId,
        displayName: item.userMaster?.displayName,
        days: item.days,
        YYYYMM: moment(item.YYYYMM, 'YYYYMM').format('MMMM-YYYY'),
        referenceId: item.referenceId,
        status: item.status,
        createBy: item.createByUser?.displayName,
        updateBy: item.updateByUser?.displayName || '',
        createdAt: item.createdAt
          ? moment(item.createdAt).format('DD-MM-YYYY HH:mm:ss')
          : '',
        updatedAt: item.updatedAt
          ? moment(item.updatedAt).format('DD-MM-YYYY HH:mm:ss')
          : '',
        LeaveName: item.hrLeaveType?.LeaveMaster?.LeaveName || null,
        LeaveDesc: item.hrLeaveType?.LeaveMaster?.LeaveDesc || null,
        encashmentStatus,
      };
    });

    if (exportData) {
      const finalExportData = finalLeaveEncahsmentData.map((item) => ({
        'Employee Code': item.employeeCode,
        'Employee Name': item.displayName,
        Branch: item.Branch,
        Department: item.Department,
        Designation: item.Designation,
        'Leave Name': item.LeaveName,
        'Month-Year': item.YYYYMM,
        Days: item.days,
        'Encashment Status': item.encashmentStatus,
        'Create By': item.createBy,
        'Created On': item.createdAt,
        'Update By': item.updateBy || '',
        'Updated On': item.updateBy ? item.updatedAt : '',
      }));

      await generateExcel(
        finalExportData,
        'Un-Paid Leave Encashment',
        'xlsx',
        res
      );
      return;
    }
    return res.status(200).json({
      status: 200,
      totalCount: count,
      data: finalLeaveEncahsmentData,
    });
  } catch (err) {
    next(err);
  }
};

exports.getLeaveEncashmentByUser = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      fromMonth,
      toMonth,
      LeaveTranId,
      status,
      exportData,
    } = await req.body;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = { status: status };
    condition.userMasterID = userMasterID;

    if (fromMonth && toMonth) {
      condition.YYYYMM = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };
    }

    if (LeaveTranId) {
      condition.LeaveTranId = LeaveTranId;
    }
    const order = [['YYYYMM', 'DESC']];
    const { rows: findUnpaidLeaveEncashments, count } =
      await LeaveEncashment.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            attributes: userAttributes,
          },
          {
            model: HrLeaveTypes,
            attributes: [
              'LeaveTranId',
              'LeaveID',
              'companyMasterID',
              'Allow_On_H',
              'status',
            ],
            include: {
              model: HrLeaveMaster,
              as: 'LeaveMaster',
              attributes: ['LeaveID', 'LeaveName', 'LeaveDesc', 'status'],
            },
          },
          {
            required: false,
            model: UserMaster,
            as: 'createByUser',
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: 'updateByUser',
            attributes: userAttributes,
          },
        ],
      });

    const finalLeaveEncahsmentData = findUnpaidLeaveEncashments.map((item) => ({
      id: item.id,
      userMasterID: item.userMasterID,
      LeaveTranId: item.LeaveTranId,
      displayName: item.userMaster?.displayName,
      days: item.days,
      YYYYMM: moment(item.YYYYMM, 'YYYYMM').format('MMMM-YYYY'),
      referenceId: item.referenceId,
      status: item.status,
      createBy: item.createByUser?.displayName,
      updateBy: item.updateByUser?.displayName || '',
      createdAt: item.createdAt
        ? moment(item.createdAt).format('DD-MM-YYYY HH:mm:ss')
        : '',
      updatedAt: item.updatedAt
        ? moment(item.updatedAt).format('DD-MM-YYYY HH:mm:ss')
        : '',
      LeaveName: item.hrLeaveType?.LeaveMaster?.LeaveName || null,
      LeaveDesc: item.hrLeaveType?.LeaveMaster?.LeaveDesc || null,
      encashmentStatus:
        item.status == 1
          ? item.referenceId == null
            ? leaveEncashmentStatusEnum.UNPAID
            : leaveEncashmentStatusEnum.PAID
          : item.status == 10
            ? leaveEncashmentStatusEnum.CANCELLED
            : item.status == 11
              ? leaveEncashmentStatusEnum.LAPSED
              : '',
    }));

    if (exportData) {
      const finalExportData = finalLeaveEncahsmentData.map((item) => ({
        'Employee Name': item.displayName,
        'Leave Name': item.LeaveName,
        'Month-Year': item.YYYYMM,
        days: item.days,
        'Encashment Status': item.encashmentStatus,
        'Create By': item.createBy,
        'Created On': item.createdAt,
        'Update By': item.updateBy || '',
        'Updated On': item.updateBy ? item.updatedAt : '',
      }));

      await generateExcel(
        finalExportData,
        'Un-Paid Leave Encashment',
        'xlsx',
        res
      );
      return;
    }
    return res.status(200).json({
      status: 200,
      totalCount: count,
      data: finalLeaveEncahsmentData,
    });
  } catch (err) {
    next(err);
  }
};
