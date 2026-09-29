const Sequelize = require('sequelize');
const LateEarlyPolicy = require('../models/lateEarlyPolicy');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMasters = require('../models/companyMaster');
const companyMaster = require('../models/companyMaster');
const EmployeeLateEarlyPolicy = require('../models/employeeLateEarlyPolicy');
const UserMaster = require('../models/userMaster');
const { userAttributes } = require('../utils/commonVars');
const { PenaltyDeductFromEnum } = require('../utils/dbUtils');

exports.postAddLateEarlyPolicy = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      lateEarlyPolicyName,
      lateEarlyPolicyType,
      latedeductionfrom,
      latedeductioncycle,
      latedeductioncategory,
      latenoof,
      latemaxminute,
      latedeductiontype,
      latevalue,
      graceInTime,
      earlydeductionfrom,
      earlydeductioncycle,
      earlydeductioncategory,
      earlynoof,
      earlymaxminute,
      earlydeductiontype,
      earlyvalue,
      combineddeductionfrom,
      combineddeductioncycle,
      combineddeductioncategory,
      combinednoof,
      combinedmaxminute,
      combineddeductiontype,
      combinedvalue,
      lateRecurring,
      earlyRecurring,
      combinedRecurring,
      onWorkingHours,
      combinedSlab1,
      combinedSlab2,
      combineddeductionfrom1,
      combineddeductionfrom2,
      combineddeductiontype1,
      combineddeductiontype2,
      combinedvalue1,
      combinedvalue2,
      combinedmaxminute1,
      combinedmaxminute2,
      lateComeSlab1,
      lateComeSlab2,
      latedeductionfrom1,
      latedeductionfrom2,
      latedeductiontype1,
      latedeductiontype2,
      latevalue1,
      latevalue2,
      latemaxminute1,
      latemaxminute2,
      earlyGoSlab1,
      earlyGoSlab2,
      earlydeductionfrom1,
      earlydeductionfrom2,
      earlydeductiontype1,
      earlydeductiontype2,
      earlyvalue1,
      earlyvalue2,
      earlymaxminute1,
      earlymaxminute2,
      deductFrom,
      earlyGraceTime
    } = await req.body;

    // return null;
    const find_SameData = await LateEarlyPolicy.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('lateEarlyPolicyName'))
          ),
          lateEarlyPolicyName.trim().toLowerCase()
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
        message: `Policy name '${lateEarlyPolicyName}' already exists. Please choose another.`,
      });

    await LateEarlyPolicy.create(
      {
        companyMasterID,
        lateEarlyPolicyName,
        lateEarlyPolicyType,
        latedeductionfrom,
        latedeductioncycle,
        latedeductioncategory,
        latenoof,
        latemaxminute,
        latedeductiontype,
        latevalue,
        graceInTime,
        earlydeductionfrom,
        earlydeductioncycle,
        earlydeductioncategory,
        earlynoof,
        earlymaxminute,
        earlydeductiontype,
        earlyvalue,
        combineddeductionfrom,
        combineddeductioncycle,
        combineddeductioncategory,
        combinednoof,
        combinedmaxminute,
        combineddeductiontype,
        combinedvalue,
        lateRecurring,
        earlyRecurring,
        combinedRecurring,
        onWorkingHours,
        combinedSlab1,
        combinedSlab2,
        combineddeductionfrom1,
        combineddeductionfrom2,
        combineddeductiontype1,
        combineddeductiontype2,
        combinedvalue1,
        combinedvalue2,
        combinedmaxminute1,
        combinedmaxminute2,
        lateComeSlab1,
        lateComeSlab2,
        latedeductionfrom1,
        latedeductionfrom2,
        latedeductiontype1,
        latedeductiontype2,
        latevalue1,
        latevalue2,
        latemaxminute1,
        latemaxminute2,
        earlyGoSlab1,
        earlyGoSlab2,
        earlydeductionfrom1,
        earlydeductionfrom2,
        earlydeductiontype1,
        earlydeductiontype2,
        earlyvalue1,
        earlyvalue2,
        earlymaxminute1,
        earlymaxminute2,
        deductFrom,
        earlyGraceTime
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('LateCome EarlyGo Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getLateEarlyPolicyById = async (req, res, next) => {
  try {
    const getLateEarlyPolicy = await LateEarlyPolicy.findOne({
      where: {
        lateEarlyPolicyMasterID: req.params.id,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: getLateEarlyPolicy });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateLateEarlyPolicy = async (req, res, next) => {
  try {
    const {
      lateEarlyPolicyMasterID,
      companyMasterID,
      lateEarlyPolicyName,
      lateEarlyPolicyType,
      latedeductionfrom,
      latedeductioncycle,
      latedeductioncategory,
      latenoof,
      latemaxminute,
      latedeductiontype,
      latevalue,
      graceInTime,
      earlydeductionfrom,
      earlydeductioncycle,
      earlydeductioncategory,
      earlynoof,
      earlymaxminute,
      earlydeductiontype,
      earlyvalue,
      combineddeductionfrom,
      combineddeductioncycle,
      combineddeductioncategory,
      combinednoof,
      combinedmaxminute,
      combineddeductiontype,
      combinedvalue,
      lateRecurring,
      earlyRecurring,
      combinedRecurring,
      onWorkingHours,

      combinedSlab1,
      combinedSlab2,
      combineddeductionfrom1,
      combineddeductionfrom2,
      combineddeductiontype1,
      combineddeductiontype2,
      combinedvalue1,
      combinedvalue2,
      combinedmaxminute1,
      combinedmaxminute2,
      lateComeSlab1,
      lateComeSlab2,
      latedeductionfrom1,
      latedeductionfrom2,
      latedeductiontype1,
      latedeductiontype2,
      latevalue1,
      latevalue2,
      latemaxminute1,
      latemaxminute2,
      earlyGoSlab1,
      earlyGoSlab2,
      earlydeductionfrom1,
      earlydeductionfrom2,
      earlydeductiontype1,
      earlydeductiontype2,
      earlyvalue1,
      earlyvalue2,
      earlymaxminute1,
      earlymaxminute2,
      deductFrom,
      earlyGraceTime
    } = await req.body;

    const find_SameData = await LateEarlyPolicy.findOne({
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('lateEarlyPolicyName'))
          ),
          lateEarlyPolicyName.trim().toLowerCase()
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        ),
        Sequelize.where(sequelize.col('lateEarlyPolicyMasterID'), {
          [Sequelize.Op.ne]: lateEarlyPolicyMasterID,
        })
      ),
    });

    if (find_SameData)
      return res.status(200).json({
        status: 401,
        message: `Policy name '${lateEarlyPolicyName}' already exists. Please choose another.`,
      });

    await LateEarlyPolicy.update(
      {
        companyMasterID,
        lateEarlyPolicyName,
        lateEarlyPolicyType,
        latedeductionfrom,
        latedeductioncycle,
        latedeductioncategory,
        latenoof,
        latemaxminute,
        latedeductiontype,
        latevalue,
        graceInTime,
        earlydeductionfrom,
        earlydeductioncycle,
        earlydeductioncategory,
        earlynoof,
        earlymaxminute,
        earlydeductiontype,
        earlyvalue,
        combineddeductionfrom,
        combineddeductioncycle,
        combineddeductioncategory,
        combinednoof,
        combinedmaxminute,
        combineddeductiontype,
        combinedvalue,
        lateRecurring,
        earlyRecurring,
        combinedRecurring,
        onWorkingHours,

        combinedSlab1,
        combinedSlab2,
        combineddeductionfrom1,
        combineddeductionfrom2,
        combineddeductiontype1,
        combineddeductiontype2,
        combinedvalue1,
        combinedvalue2,
        combinedmaxminute1,
        combinedmaxminute2,
        lateComeSlab1,
        lateComeSlab2,
        latedeductionfrom1,
        latedeductionfrom2,
        latedeductiontype1,
        latedeductiontype2,
        latevalue1,
        latevalue2,
        latemaxminute1,
        latemaxminute2,
        earlyGoSlab1,
        earlyGoSlab2,
        earlydeductionfrom1,
        earlydeductionfrom2,
        earlydeductiontype1,
        earlydeductiontype2,
        earlyvalue1,
        earlyvalue2,
        earlymaxminute1,
        earlymaxminute2,
        deductFrom,
        earlyGraceTime
      },
      {
        where: { lateEarlyPolicyMasterID: lateEarlyPolicyMasterID },
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('LateCome EarlyGo Policy'),
    });
  } catch (err) {
    next(err);
  }
};

exports.postStatusChangeLateEarlyPolicyById = async (req, res, next) => {
  try {
    const { lateEarlyPolicyMasterID, status } = await req.body;

    if (status != 1) {
      const assignData = await EmployeeLateEarlyPolicy.findOne({
        where: {
          lateEarlyPolicyMasterID,
          status: 1,
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
      });

      if (assignData)
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign(
            'LateCome EarlyGo Policy',
            'deactivate'
          ),
        });
    }

    await LateEarlyPolicy.update(
      {
        status: status,
      },
      {
        where: { lateEarlyPolicyMasterID: lateEarlyPolicyMasterID },
      },
      { user: req.userDetails }
    );

    const message1 =
      status == 1
        ? message.usermessage.activeMessage('LateCome EarlyGo Policy')
        : message.usermessage.deleteMessage('LateCome EarlyGo Policy');

    return res.status(200).json({
      status: 200,
      message: message1,
    });
  } catch (err) {
    next(err);
  }
};

exports.listLateEarlyPolicy = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, status, searchQuery } = req.body;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;
    if (status) condition.status = status;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { lateEarlyPolicyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    const Policy = await LateEarlyPolicy.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMaster,
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
      message: 'Policies fetched successfully',
      status: 200,
      data: Policy.rows,
      totalcount: Policy.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findEmployeeLcEgPolicy = await EmployeeLateEarlyPolicy.findOne({
      where: {
        lateEarlyPolicyMasterID: id,
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
    });

    if (findEmployeeLcEgPolicy)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign(
          'LateCome EarlyGo Policy',
          'Delete'
        ),
      });

    const findData = await LateEarlyPolicy.findByPk(id);

    if (!findData)
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage('LCEG Policy'),
      });

    findData.deleteBy = req.userDetails.userMasterId;
    findData.deleteByIp = req.userDetails.userIpAddress;
    await findData.save();
    await findData.destroy();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('LateCome EarlyGo Policy'),
    });
  } catch (error) {
    next(error);
  }
};
