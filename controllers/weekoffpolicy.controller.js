const Sequelize = require('sequelize');
const WeekOffPolicy = require('../models/weekOffPolicy');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const WeekOffOptionsModel = require('../models/weekOffOptions');
const CompanyMasterModel = require('../models/companyMaster');
const companyMasters = require('../models/companyMaster');
const employeeWeekoffPolicy = require('../models/employeeWeekOff');

const UserMaster = require('../models/userMaster');
const { weekoffTypeEnum } = require('../utils/dbUtils');
const { isValidValue } = require('../utils/commonUtilFunctions');
/**
 * save bank data.
 *
 * @body {createBy} createBy user id of user who added the bank.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddWeekOffPolicy = async (req, res, next) => {
  try {
    const {
      weekOffPolicyName,
      description,
      companyMasterID,
      isNoWeekoffPolicy = false,
    } = await req.body;

    let { weekoffType, monthlyFix, presentDays, weekOffOptions } = req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    if (isNoWeekoffPolicy) {
      weekoffType = null;
      monthlyFix = null;
      presentDays = null;
      weekOffOptions = [];
    }

    if (weekoffType == weekoffTypeEnum.FIX) {
      monthlyFix = null;
      presentDays = null;
    }

    if (weekoffType == weekoffTypeEnum.MONTHLYFIX) {
      weekOffOptions = [];
      presentDays = null;

      if (!isValidValue(+monthlyFix)) {
        return res.status(200).json({
          status: 401,
          message: 'Enter valid value of montly fix weekoff.',
        });
      }
    }

    if (weekoffType == weekoffTypeEnum.ONPRESENTDAY) {
      monthlyFix = null;
      weekOffOptions = [];

      if (!isValidValue(+presentDays)) {
        return res.status(200).json({
          status: 401,
          message: 'Enter valid value of present days.',
        });
      }
    }

    await sequelize.transaction(async (t) => {
      let insert_db_status = await WeekOffPolicy.create(
        {
          weekOffPolicyName,
          description,
          companyMasterID,
          createBy,
          createByIp,
          weekoffType,
          monthlyFix,
          presentDays,
          isNoWeekoffPolicy,
        },
        { transaction: t }
      );

      if (weekoffType == weekoffTypeEnum.FIX) {
        weekOffOptions.forEach(async (option) => {
          option['weekOffPolicyID'] = insert_db_status.weekOffPolicyID;
        });

        await WeekOffOptionsModel.bulkCreate(weekOffOptions, {
          transaction: t,
        });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.weekoffpolicyadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all bank data
 */

exports.getAllWeekOffPolicyData = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let week_off_policy = [];
    if (companyMasterID != '') {
      if (limit == '' && page == '') {
        week_off_policy = await WeekOffPolicy.findAll({
          raw: true,
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
            companyMasterID: companyMasterID,
          },
        });
      } else {
        week_off_policy = await WeekOffPolicy.findAll({
          raw: true,
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
            companyMasterID: companyMasterID,
          },
          limit: limit,
          offset: offset,
        });
      }

      if (week_off_policy.length > 0) {
        for (const policy of week_off_policy) {
          policy['weekOffOptions'] = await WeekOffOptionsModel.findAll({
            raw: true,
            where: {
              weekOffPolicyID: policy.weekOffPolicyID,
            },
          });
        }
      }

      const totalcount = await WeekOffPolicy.count({
        raw: true,
        where: { status: ['0', '1'], companyMasterID: companyMasterID },
      });
      res
        .status(200)
        .json({ status: 200, data: week_off_policy, totalcount: totalcount });
    } else {
      if (limit == '' && page == '') {
        week_off_policy = await WeekOffPolicy.findAll({
          raw: true,
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
        });
      } else {
        week_off_policy = await WeekOffPolicy.findAll({
          raw: true,
          where: {
            status: {
              [Sequelize.Op.in]: [0, 1],
            },
          },
          limit: limit,
          offset: offset,
        });
      }

      if (week_off_policy.length > 0) {
        for (const policy of week_off_policy) {
          policy['weekOffOptions'] = await WeekOffOptionsModel.findAll({
            raw: true,
            where: {
              weekOffPolicyID: policy.weekOffPolicyID,
            },
          });
        }
      }

      const totalcount = await WeekOffPolicy.count({
        raw: true,
        where: { status: ['0', '1'] },
      });

      res
        .status(200)
        .json({ status: 200, data: week_off_policy, totalcount: totalcount });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with weekOffPolicy id
 *
 * @param {id} weekOffPolicyID  to fetch bank name
 */

exports.getWeekOffPolicyById = async (req, res, next) => {
  try {
    let get_one_data = await WeekOffPolicy.findOne({
      where: {
        weekOffPolicyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (get_one_data) {
      let get_options = await WeekOffOptionsModel.findAll({
        raw: true,
        where: {
          weekOffPolicyID: req.params.id,
        },
      });
      get_one_data['weekOffOptions'] = get_options;
      get_one_data['noWeekoffPolicy'] = get_options.length > 0 ? false : true;
    }

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch bank name
 */

exports.getWeekOffPolicyByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          weekOffPolicyName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          description: {
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

    const weekoffPolicy = await WeekOffPolicy.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          attributes: ['companyName'],
        },
      ],
    });

    if (weekoffPolicy.rows.length > 0) {
      for (const policy of weekoffPolicy.rows) {
        policy.dataValues['weekOffOptions'] = await WeekOffOptionsModel.findAll(
          {
            raw: true,
            where: {
              weekOffPolicyID: policy.weekOffPolicyID,
            },
          }
        );
      }
    }

    return res.status(200).json({
      status: 200,
      data: weekoffPolicy.rows,
      totalcount: weekoffPolicy.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} weekOffPolicyID  to update id
 */
exports.postUpdateWeekOffPolicy = async (req, res, next) => {
  try {
    let {
      weekOffPolicyID,
      weekOffPolicyName,
      description,
      companyMasterID,
      weekOffOptions,
      weekoffType,
      monthlyFix,
      presentDays,
      isNoWeekoffPolicy,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;

    if (isNoWeekoffPolicy) {
      weekoffType = null;
      monthlyFix = null;
      presentDays = null;
      weekOffOptions = [];
    }

    if (weekoffType == weekoffTypeEnum.FIX) {
      monthlyFix = null;
      presentDays = null;
    }

    if (weekoffType == weekoffTypeEnum.MONTHLYFIX) {
      weekOffOptions = [];
      presentDays = null;

      if (!isValidValue(+monthlyFix)) {
        return res.status(200).json({
          status: 401,
          message: 'Enter valid value of montly fix weekoff.',
        });
      }
    }

    if (weekoffType == weekoffTypeEnum.ONPRESENTDAY) {
      monthlyFix = null;
      weekOffOptions = [];

      if (!isValidValue(+presentDays)) {
        return res.status(200).json({
          status: 401,
          message: 'Enter valid value of present days.',
        });
      }
    }

    let result = await sequelize.transaction(async (t) => {
      await WeekOffPolicy.update(
        {
          weekOffPolicyName,
          description,
          companyMasterID,
          updateBy,
          updateByIp,
          weekoffType,
          monthlyFix,
          presentDays,
          isNoWeekoffPolicy,
        },
        {
          where: { weekOffPolicyID },
          transaction: t,
        }
      );

      await WeekOffOptionsModel.destroy({
        where: {
          weekOffPolicyID,
        },
        transaction: t,
      });

      if (weekoffType == weekoffTypeEnum.FIX) {
        weekOffOptions.forEach(async (option) => {
          option['weekOffPolicyID'] = weekOffPolicyID;
        });
        await WeekOffOptionsModel.bulkCreate(weekOffOptions, {
          transaction: t,
        });
      }
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.weekoffpolicyupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} weekOffPolicyID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    const { weekOffPolicyID, status } = await req.body;
    if (status != '1') {
      const data = await employeeWeekoffPolicy.findOne({
        where: {
          weekOffPolicyID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this WeekOff Policy. Already assigned to employees.',
        });
      }
    }

    await WeekOffPolicy.update(
      {
        status,
      },
      {
        where: { weekOffPolicyID },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Weekoff Policy')
          : message.usermessage.deactiveMessage('Weekoff Policy'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} weekOffPolicyID  to delete id
 */
exports.postDeleteWeekOffPolicyById = async (req, res, next) => {
  try {
    let { weekOffPolicyID } = await req.body;

    let data = await employeeWeekoffPolicy.findOne({
      where: {
        weekOffPolicyID: weekOffPolicyID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this WeekOff Policy. Already assigned to employees.',
      });
    } else {
      let delete_status = await WeekOffPolicy.update(
        {
          status: 2,
        },
        {
          where: { weekOffPolicyID: weekOffPolicyID },
        }
      );

      return res.status(200).json({
        status: 200,
        message: message.usermessage.weekoffpolicydelete,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getactiveweekoffbycompanyid = async (req, res, next) => {
  try {
    const weekOffPolicyData = await WeekOffPolicy.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: weekOffPolicyData });
  } catch (err) {
    next(err);
  }
};
