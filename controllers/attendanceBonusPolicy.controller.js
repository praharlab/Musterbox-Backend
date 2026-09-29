const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const attendanceBonusPolicy = require('../models/attendanceBonusPolicy');
const message = require('../response_message/message');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const EmployeeAttendanceBonusPolicy = require('../models/empattandancebonuspolicy');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');

// add api
exports.postAddAttendancePolicyBonus = async (req, res, next) => {
  try {
    let {
      attendanceBonusPolicyName,
      companyMasterID,
      type,
      setPresentDay,
      noofPrentDay,
      attendanceBonustype,
      attendanceBonusAmount,
      status,
      setNoattendanceBonusPolicy,
      slots,
      noofPrentDaySlot2,
      attendanceBonustypeSlot2,
      attendanceBonusAmountSlot2,
      min_bonus_hrs,
      bonus_criteria,
      hours,
    } = await req.body;

    if (setNoattendanceBonusPolicy) {
      type = null;
      setPresentDay = null;
      noofPrentDay = null;
      attendanceBonustype = null;
      attendanceBonusAmount = null;
      slots = null;
      noofPrentDaySlot2 = null;
      attendanceBonustypeSlot2 = null;
      attendanceBonusAmountSlot2 = null;
      min_bonus_hrs = null;
      bonus_criteria = null;
      hours = null;
    }
    // if daily salary calculation
    if (type && type == 'daily') {
      min_bonus_hrs = null;
      bonus_criteria = null;
      hours = null;
    }
    // if hourly salary calculation
    if (type && type == 'hourly') {
      setPresentDay = null;
      noofPrentDay = null;
      attendanceBonustype = null;
      attendanceBonusAmount = null;
      slots = null;
      noofPrentDaySlot2 = null;
      attendanceBonustypeSlot2 = null;
      attendanceBonusAmountSlot2 = null;

      if (+min_bonus_hrs <= 0 || +hours <= 0) {
        return res.status(200).json({
          status: 401,
          message: `Value should be greater than zero.`,
        });
      }
    }

    if (setPresentDay == 'Fix') {
      slots = slots;
      if (slots != 'twoSlot') {
        (noofPrentDaySlot2 = null),
          (attendanceBonustypeSlot2 = null),
          (attendanceBonusAmountSlot2 = null);
      }
    } else {
      slots = null;
      (noofPrentDaySlot2 = null),
        (attendanceBonustypeSlot2 = null),
        (attendanceBonusAmountSlot2 = null);
    }

    const find_SameData = await attendanceBonusPolicy.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('attendanceBonusPolicyName'))
          ),
          attendanceBonusPolicyName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });

    if (find_SameData)
      return res.status(200).json({
        status: 401,
        message: `Policy name '${attendanceBonusPolicyName}' already exists. Please choose another.`,
      });

    if ((min_bonus_hrs && +min_bonus_hrs <= 0) || (hours && +hours <= 0)) {
      return res.status(200).json({
        status: 401,
        message: `Please enter positive value.`,
      });
    }

    await attendanceBonusPolicy.create(
      {
        attendanceBonusPolicyName,
        companyMasterID,
        type,
        setPresentDay,
        noofPrentDay,
        attendanceBonustype,
        attendanceBonusAmount,
        setNoattendanceBonusPolicy,
        slots,
        noofPrentDaySlot2: slots == 'twoSlot' ? noofPrentDaySlot2 : null,
        attendanceBonustypeSlot2:
          slots == 'twoSlot' ? attendanceBonustypeSlot2 : null,
        attendanceBonusAmountSlot2:
          slots == 'twoSlot' ? attendanceBonusAmountSlot2 : null,
        min_bonus_hrs,
        bonus_criteria,
        hours,
        status,
        createBy: req.userDetails.userMasterId,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Attendance Bonus Policy'),
    });
  } catch (err) {
    next(err);
  }
};

// get all data api
exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, companyMasterID, Export } = req.query;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          attendanceBonusPolicyName: {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await attendanceBonusPolicy.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
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
      order: [['attendanceBonusPolicyId', 'DESC']],

    });

    if (Export == 'true') {
      const finaldata = rows.map((e) => {
        return {
          'Company Name': e['companyMaster.companyName'],
          'Attendance  Bonus Policy Name': e.attendanceBonusPolicyName,
          'Set PresentDay': e.setPresentDay,
          'No Of PresentDay': e.noofPrentDay,
          'Bonus Type': e.attendanceBonustype,
          'Bonus Amount': e.attendanceBonustype,
          Status: e.status == 0 ? 'Deactive' : 'Active',
        };
      });

      await generateExcel(finaldata, 'AttendancePolicyBonus', 'xlsx', res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get api
exports.getdata = async (req, res, next) => {
  try {
    const attendanceBonusPolicyId = req.params.id;
    const Data = await attendanceBonusPolicy.findOne({
      where: {
        attendanceBonusPolicyId,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
      raw: true,
    });
    if (!Data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    }

    return res.status(200).json({ status: 200, data: Data });
  } catch (err) {
    next(err);
  }
};
// edit api

exports.editdata = async (req, res, next) => {
  try {
    let {
      attendanceBonusPolicyName,
      setNoattendanceBonusPolicy,
      companyMasterID,
      type,
      setPresentDay,
      noofPrentDay,
      attendanceBonustype,
      attendanceBonusAmount,
      slots,
      noofPrentDaySlot2,
      attendanceBonustypeSlot2,
      attendanceBonusAmountSlot2,
      min_bonus_hrs,
      bonus_criteria,
      hours,
    } = await req.body;

    if (setNoattendanceBonusPolicy) {
      type = null;
      setPresentDay = null;
      noofPrentDay = null;
      attendanceBonustype = null;
      attendanceBonusAmount = null;
      slots = null;
      noofPrentDaySlot2 = null;
      attendanceBonustypeSlot2 = null;
      attendanceBonusAmountSlot2 = null;
      min_bonus_hrs = null;
      bonus_criteria = null;
      hours = null;
    }

    // if daily salary calculation
    if (type && type == 'daily') {
      min_bonus_hrs = null;
      bonus_criteria = null;
      hours = null;
    }
    // if hourly salary calculation
    if (type && type == 'hourly') {
      setPresentDay = null;
      noofPrentDay = null;
      attendanceBonustype = null;
      attendanceBonusAmount = null;
      slots = null;
      noofPrentDaySlot2 = null;
      attendanceBonustypeSlot2 = null;
      attendanceBonusAmountSlot2 = null;

      if (+min_bonus_hrs <= 0 || +hours <= 0) {
        return res.status(200).json({
          status: 401,
          message: `Value should be greater than zero.`,
        });
      }
    }

    if (setPresentDay == 'Fix') {
      slots = slots;
      if (slots != 'twoSlot') {
        (noofPrentDaySlot2 = null),
          (attendanceBonustypeSlot2 = null),
          (attendanceBonusAmountSlot2 = null);
      }
    } else {
      slots = null;
      (noofPrentDaySlot2 = null),
        (attendanceBonustypeSlot2 = null),
        (attendanceBonusAmountSlot2 = null);
    }

    const find_SameData = await attendanceBonusPolicy.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('attendanceBonusPolicyName'))
          ),
          attendanceBonusPolicyName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('attendanceBonusPolicyId'), {
          [Sequelize.Op.ne]: req.params.id,
        })
      ),
    });

    if (find_SameData)
      return res.status(200).json({
        status: 401,
        message: `Policy name '${attendanceBonusPolicyName}' already exists. Please choose another.`,
      });

    const currentdata = await attendanceBonusPolicy.findOne({
      where: {
        attendanceBonusPolicyId: req.params.id,
      },
    });

    if (!currentdata)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.deletedrecord,
      });

    currentdata.attendanceBonusPolicyName = attendanceBonusPolicyName;
    currentdata.companyMasterID = companyMasterID;
    currentdata.setPresentDay = setPresentDay;
    currentdata.noofPrentDay = noofPrentDay;
    currentdata.attendanceBonustype = attendanceBonustype;
    currentdata.attendanceBonusAmount = attendanceBonusAmount;
    currentdata.setNoattendanceBonusPolicy = setNoattendanceBonusPolicy;

    currentdata.slots = slots;

    (currentdata.noofPrentDaySlot2 =
      slots == 'twoSlot' ? noofPrentDaySlot2 : null),
      (currentdata.attendanceBonustypeSlot2 =
        slots == 'twoSlot' ? attendanceBonustypeSlot2 : null),
      (currentdata.attendanceBonusAmountSlot2 =
        slots == 'twoSlot' ? attendanceBonusAmountSlot2 : null),
      (currentdata.type = type);
    currentdata.min_bonus_hrs = min_bonus_hrs;
    currentdata.bonus_criteria = bonus_criteria;
    currentdata.hours = hours;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Attendance Bonus Policy'),
    });
  } catch (error) {
    next(error);
  }
};

// delete api
exports.deletedata = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findEmployeeAttnBonusPolicy =
      await EmployeeAttendanceBonusPolicy.findOne({
        where: {
          attendanceBonusPolicyId: id,
        },
      });

    if (findEmployeeAttnBonusPolicy)
      return res.status(200).json({
        status: 401,
        message:
          'Attendance Bonus Policy already assigned to employees.So,you can not delete it',
      });

    const findData = await attendanceBonusPolicy.findByPk(id);

    if (!findData) {
      return res.status(200).json({
        status: 401,
        message: 'Attendance Bonus Policy not found!',
      });
    }

    // Perform deletion
    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Attendance Bonus Policy'),
    });
  } catch (error) {
    next(error);
  }
};

// active,deactive
exports.poststatuschange = async (req, res, next) => {
  try {
    let { attendanceBonusPolicyId, status } = await req.body;

    if (status != 0 && status != 1)
      return res.status(200).json({
        status: 401,
        message: 'status is not valid!',
      });

    const findEmployeeAttnBonusPolicy =
      await EmployeeAttendanceBonusPolicy.findOne({
        where: {
          attendanceBonusPolicyId,
        },
      });

    if (findEmployeeAttnBonusPolicy && status == 0) {
      return res.status(200).json({
        status: 401,
        message:
          'Attendance Bonus Policy already assigned to employees.So,you can not deactivate it',
      });
    }

    const findData = await attendanceBonusPolicy.findByPk(
      attendanceBonusPolicyId
    );

    findData.status = status;

    await findData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Attendance Bonus Policy')
          : message.usermessage.deactiveMessage('Attendance Bonus Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getactivewattendancebonusbycompanyid = async (req, res, next) => {
  try {
    const attendanceData = await attendanceBonusPolicy.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: attendanceData });
  } catch (err) {
    next(err);
  }
};
