const Sequelize = require('sequelize');
const AttendancePolicyMaster = require('../models/attendancePolicy');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const employeeAttendancepolicy = require('../models/employeeAttendancePolicy');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');

exports.postAddAttendancePolicy = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      attendancePolicyName,
      selfieAttendance,
      selfieWithFaceDetection,
      outsidePunchInPunchOut,
      singleMultiplePunchInPunchOut,
      automaticAssignShift,
      companyMasterID,
      sandwichLeave,
      BeforeAfterLeave,
      considerWorkingHours,
      considerOvertimeAfter,
      overtimeEntryAfterMin,
      weekoffsandwichLeave,
      holidaysandwichLeave,
      attendanceInMobile,
      coff,
      coffhalfday,
      overtimeHrs,
      showinsalaryslip,
      consider,
      pfApplicable,
      esicApplicable,
      missPunchMinutes,
      cofffullday,
      coffOneAndHalfDay,
      coffTwoFullDay,
      autoApprove,
      payType,
      payAmount,
      skipMinutesInOvertime,
      overtimeType,
      typeValue,
      monthDays,
      toShowOT,
      payheadMasterId,
      employeeESICPer,
      employerESICPer,
      preShiftHrsConsideration,
      showShift,
      extraOt = false,
      min_extra_ot_mins,
      extra_ot_mins,
      HFDBeforeAfterLeave,
      giveOTAs,
      halfdayCoffEday,
      fulldayCoffEday,
      oneAndHalfDayCoffEday,
      twoDayCoffEday,
      WHPHPriority,
      setCorrLimit,
      attCorrLimit,
      attBrType,
      attBranch,
      preShiftMin,
    } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    if (showinsalaryslip) {
      showinsalaryslip = showinsalaryslip.toString();
    }
    if (!overtimeHrs) {
      overtimeHrs = null;
    }

    const existingPolicy = await AttendancePolicyMaster.findOne({
      where: [
        sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('attendancePolicyName'))
          ),
          attendancePolicyName.trim().toLowerCase()
        ),
        { companyMasterID: companyMasterID },
      ],
      transaction,
    });

    if (existingPolicy) {
      await transaction.rollback();
      return res.status(200).json({
        status: 400,
        message: message.usermessage.alreadyExists(
          'Attendace Policy With Same Name'
        ),
      });
    }

    await AttendancePolicyMaster.create(
      {
        attendancePolicyName,
        selfieAttendance,
        selfieWithFaceDetection,
        outsidePunchInPunchOut,
        singleMultiplePunchInPunchOut,
        automaticAssignShift,
        companyMasterID,
        sandwichLeave,
        BeforeAfterLeave,
        considerWorkingHours,
        considerOvertimeAfter,
        overtimeEntryAfterMin,
        weekoffsandwichLeave,
        holidaysandwichLeave,
        attendanceInMobile,
        coff,
        coffhalfday,
        showinsalaryslip: showinsalaryslip ? showinsalaryslip : 'false',
        pfApplicable,
        esicApplicable,
        missPunchMinutes,
        consider,
        overtimeHrs,
        cofffullday,
        coffOneAndHalfDay,
        coffTwoFullDay,
        autoApprove,

        payType,
        payAmount,
        skipMinutesInOvertime,
        overtimeType,
        typeValue: typeValue ? typeValue : null,
        monthDays: monthDays ? monthDays : null,
        toShowOT,
        payheadMasterId,
        employeeESICPer,
        employerESICPer,
        preShiftHrsConsideration:
          considerOvertimeAfter == 'totalworkinghours'
            ? preShiftHrsConsideration
            : null,
        createBy,
        createByIp,
        showShift,
        extraOt,
        min_extra_ot_mins: extraOt ? min_extra_ot_mins : null,
        extra_ot_mins: extraOt ? extra_ot_mins : null,
        HFDBeforeAfterLeave,
        giveOTAs,
        halfdayCoffEday,
        fulldayCoffEday,
        oneAndHalfDayCoffEday,
        twoDayCoffEday,
        WHPHPriority,
        setCorrLimit,
        attCorrLimit,
        attBrType,
        attBranch: attBranch && attBranch.length ? attBranch : null,
        preShiftMin: preShiftMin ? preShiftMin : null,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.attendancepolicyadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAllAttendancePolicyData = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          attendancePolicyName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const { rows: attendancePolicy, count } =
      await AttendancePolicyMaster.findAndCountAll({
        raw: true,
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: companyMaster,
            attributes: ['companyName'],
          },
          {
            model: UserMaster,
            as: 'createdByUserDetails',
            attributes: userAttributes,
          },
          {
            model: UserMaster,
            as: 'updatedByUserDetails',
            attributes: userAttributes,
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: attendancePolicy,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAttendancePolicyById = async (req, res, next) => {
  try {
    const getAttendacePolicyByID = await AttendancePolicyMaster.findOne({
      where: {
        attendancePolicyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!getAttendacePolicyByID) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage('Attendace Policy'),
      });
    }

    return res.status(200).json({ status: 200, data: getAttendacePolicyByID });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateAttendancePolicy = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      attendancePolicyID,
      attendancePolicyName,
      selfieAttendance,
      selfieWithFaceDetection,
      outsidePunchInPunchOut,
      automaticAssignShift,
      companyMasterID,
      singleMultiplePunchInPunchOut,
      sandwichLeave,
      BeforeAfterLeave,
      considerWorkingHours,
      considerOvertimeAfter,
      overtimeEntryAfterMin,
      weekoffsandwichLeave,
      holidaysandwichLeave,
      attendanceInMobile,
      coff,
      coffhalfday,
      showinsalaryslip,
      pfApplicable,
      esicApplicable,
      missPunchMinutes,
      consider,
      cofffullday,
      overtimeHrs,
      autoApprove,
      payType,
      payAmount,
      skipMinutesInOvertime,
      overtimeType,
      typeValue,
      monthDays,
      toShowOT,
      payheadMasterId,
      employeeESICPer,
      employerESICPer,
      preShiftHrsConsideration,
      showShift,
      extraOt = false,
      min_extra_ot_mins,
      extra_ot_mins,
      HFDBeforeAfterLeave,
      giveOTAs,
      halfdayCoffEday,
      fulldayCoffEday,
      oneAndHalfDayCoffEday,
      twoDayCoffEday,
      WHPHPriority,
      coffOneAndHalfDay,
      coffTwoFullDay,
      setCorrLimit,
      attCorrLimit,
      attBrType,
      attBranch,
      preShiftMin
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    if (showinsalaryslip) {
      showinsalaryslip = showinsalaryslip.toString();
    }
    if (!overtimeHrs) {
      overtimeHrs = null;
    }

    const existingPolicyName = await AttendancePolicyMaster.findOne({
      where: {
        [Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('attendancePolicyName'))
            ),
            attendancePolicyName.trim().toLowerCase()
          ),
          { companyMasterID: companyMasterID },

          { attendancePolicyID: { [Sequelize.Op.ne]: attendancePolicyID } },
        ],
      },
      transaction,
    });

    if (existingPolicyName) {
      await transaction.rollback();
      return res.status(200).json({
        status: 400,
        message: message.usermessage.alreadyExists(
          'Attendace Policy With Same Name'
        ),
      });
    }

    await AttendancePolicyMaster.update(
      {
        attendancePolicyName,
        selfieAttendance,
        selfieWithFaceDetection,
        outsidePunchInPunchOut,
        automaticAssignShift,
        companyMasterID,
        singleMultiplePunchInPunchOut,
        sandwichLeave,
        BeforeAfterLeave,
        considerWorkingHours,
        considerOvertimeAfter,
        overtimeEntryAfterMin,
        weekoffsandwichLeave,
        holidaysandwichLeave,
        attendanceInMobile,
        coff,
        coffhalfday,
        showinsalaryslip: showinsalaryslip ? showinsalaryslip : 'false',
        consider: toShowOT == 'asOT' ? consider : null,
        pfApplicable,
        esicApplicable,
        missPunchMinutes,
        cofffullday,
        overtimeHrs,
        autoApprove,
        payType,
        payAmount,
        skipMinutesInOvertime,
        overtimeType,
        typeValue: typeValue ? typeValue : null,
        monthDays: monthDays ? monthDays : null,
        toShowOT,
        payheadMasterId,
        employeeESICPer,
        employerESICPer,
        preShiftHrsConsideration:
          considerOvertimeAfter == 'totalworkinghours'
            ? preShiftHrsConsideration
            : null,
        updateBy,
        updateByIp,
        showShift,
        extraOt,
        min_extra_ot_mins: extraOt ? min_extra_ot_mins : null,
        extra_ot_mins: extraOt ? extra_ot_mins : null,
        HFDBeforeAfterLeave,
        giveOTAs,
        halfdayCoffEday,
        fulldayCoffEday,
        oneAndHalfDayCoffEday,
        twoDayCoffEday,
        WHPHPriority,
        coffOneAndHalfDay,
        coffTwoFullDay,
        setCorrLimit,
        attCorrLimit,
        attBrType,
        attBranch: attBranch && attBranch.length ? attBranch : null,
        preShiftMin: preShiftMin ? preShiftMin : null,
      },
      {
        where: { attendancePolicyID: attendancePolicyID },
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Attendance Policy'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { attendancePolicyID, status } = await req.body;

    if (status == '0') {
      const findEmployeeAttendacePolicy =
        await employeeAttendancepolicy.findOne({
          where: {
            attendancePolicyID: attendancePolicyID,
            status: ['1', '0'],
          },
          include: [
            {
              required: true,
              model: UserMaster,
              as: 'employee',
              where: {
                status: [0, 1],
              },
            },
          ],
          transaction,
        });

      if (findEmployeeAttendacePolicy) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign(
            'Attendance Policy',
            'deactivate'
          ),
        });
      }
    }
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await AttendancePolicyMaster.update(
      {
        status: status,
        updateBy,
        updateByIp,
      },
      {
        where: {
          attendancePolicyID: attendancePolicyID,
          status: ['1', '0'],
        },
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Attendance Policy')
          : message.usermessage.deactiveMessage('Attendance Policy'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.postDeleteAttendancePolicyById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { attendancePolicyID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    const findEmployeeAttendacePolicy = await employeeAttendancepolicy.findOne({
      where: {
        attendancePolicyID: attendancePolicyID,
        status: ['1', '0'],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          as: 'employee',
          where: {
            status: [0, 1],
          },
        },
      ],
      transaction,
    });

    if (findEmployeeAttendacePolicy) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign(
          'Attendance Policy',
          'Delete'
        ),
      });
    }

    await AttendancePolicyMaster.update(
      {
        status: 2,
        updateBy,
        updateByIp,
      },
      {
        where: { attendancePolicyID: attendancePolicyID },
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Attendance Policy'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getactiveattendancebycompanyid = async (req, res, next) => {
  try {
    const attendancePolicyData = await AttendancePolicyMaster.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: attendancePolicyData });
  } catch (err) {
    next(err);
  }
};
