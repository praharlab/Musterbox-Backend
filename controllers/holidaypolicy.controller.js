const Sequelize = require('sequelize');
const holidayPolicy = require('../models/holidayPolicy');
const message = require('../response_message/message');
const holidayListModel = require('../models/holidayList');
const CompanyMasterModel = require('../models/companyMaster');
const employeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const UserMaster = require('../models/userMaster');
const companyMaster = require('../models/companyMaster');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const { database } = require('../config/erpdatabase');
const { date } = require('@hapi/joi/lib/template');
const sequelize = require('../config/database');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');

/**
 * save bank data.
 *
 * @body {createBy} createBy user id of user who added the bank.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddholidayPolicy = async (req, res, next) => {
  try {
    const {
      holidayPolicyName,
      holidayYear,
      companyMasterID,
      holidayListName,
      holidayDate,
      optionalHoliday,
      createBy,
      createByIp,
    } = await req.body;
    const insert_db_status = await holidayPolicy.create({
      holidayPolicyName,
      holidayYear,
      companyMasterID,
      createBy,
      createByIp,
    });
    const holidayPolicyID = insert_db_status.holidayPolicyID;
    await holidayListModel.create({
      holidayPolicyID,
      holidayListName,
      holidayDate,
      optionalHoliday,
      createBy,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.holidaypolicyadd,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all bank data
 */

exports.getAllholidayPolicyData = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery } = await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          holidayPolicyName: {
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

    const holiday_Policy = await holidayPolicy.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
      ],
    });

    if (holiday_Policy.rows.length > 0) {
      for (const policy of holiday_Policy.rows) {
        policy['holidayList'] = await holidayListModel.findAll({
          raw: true,
          where: {
            holidayPolicyID: policy.holidayPolicyID,
          },
        });
      }
    }

    return res.status(200).json({
      status: 200,
      data: holiday_Policy.rows,
      totalcount: holiday_Policy.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with holidayPolicy id
 *
 * @param {id} holidayPolicyID  to fetch bank name
 */

exports.getholidayPolicyById = async (req, res, next) => {
  try {
    let get_one_data = await holidayPolicy.findOne({
      where: {
        holidayPolicyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (get_one_data) {
      let get_List = await holidayListModel.findAll({
        raw: true,
        where: {
          holidayPolicyID: req.params.id,
        },
      });
      get_one_data['holidayList'] = get_List;
    }

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

/**
 * find data with company master id
 *
 * @param {id} companyMasterID  to fetch bank name
 */

exports.getholidayPolicyByCompanyId = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let week_off_data;
    if (page == '' && limit == '') {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasterModel.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        raw: true,
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      week_off_data = await holidayPolicy.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
      });
    } else {
      const companyid = [];
      companyid.push(parseInt(req.body.id));
      let get_one_data = await CompanyMasterModel.findAll({
        where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
        raw: true,
      });
      for (var i = 0; i < get_one_data.length; i++) {
        companyid.push(get_one_data[i].companyMasterID);
      }
      week_off_data = await holidayPolicy.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyid,
          },
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
      });
    }
    if (week_off_data.length > 0) {
      for (const policy of week_off_data) {
        policy.dataValues['holidayList'] = await holidayListModel.findAll({
          raw: true,
          where: {
            holidayPolicyID: policy.holidayPolicyID,
          },
        });
      }
    }
    const companyid = [];
    companyid.push(parseInt(req.body.id));
    let get_one_data = await CompanyMasterModel.findAll({
      where: { parentCompanyMasterID: req.body.id, status: [0, 1] },
      raw: true,
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    const totalcount = await holidayPolicy.count({
      raw: true,
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: ['0', '1'],
      },
    });

    res
      .status(200)
      .json({ status: 200, data: week_off_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} holidayPolicyID  to update id
 */
exports.postUpdateholidayPolicy = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      holidayPolicyID,
      holidayPolicyName,
      holidayYear,
      companyMasterID,
      holidayListName,
      holidayDate,
      optionalHoliday,
      updateBy,
      updateByIp,
    } = await req.body;

    const oldHolidayPolicy = await holidayListModel.findOne(
      {
        where: { holidayPolicyID: holidayPolicyID },

        raw: true,
      },
      { transaction }
    );

    await holidayPolicy.update(
      { holidayPolicyName, holidayYear, companyMasterID, updateBy, updateByIp },
      { where: { holidayPolicyID: holidayPolicyID } },
      { transaction }
    );

    await holidayListModel.update(
      { holidayListName, holidayDate, optionalHoliday, updateBy, updateByIp },
      { where: { holidayPolicyID: holidayPolicyID } },
      { transaction }
    );

    const getHolidayPolicy = await employeeHolidayPolicy.findAll(
      {
        raw: true,
        where: { holidayPolicyID: holidayPolicyID, status: 1 },
        include: [
          {
            model: UserMaster,
            as: 'employee',
            attributes: ['userMasterID', 'companyMasterId'],
          },
        ],
      },
      { transaction }
    );

    for (const user of getHolidayPolicy) {
      let count = 0;
      for (let date of oldHolidayPolicy.holidayDate) {
        date = new Date(date);
        date.setDate(date.getDate() + 1);
        date = date.toISOString().slice(0, 10);

        if (new Date(user.applicableDate) <= new Date(date)) {
          if (!user.endDate || new Date(user.endDate) >= new Date(date)) {
            //Add

            await weekoffHolidayTran.destroy(
              {
                where: {
                  userMasterID: user.userMasterID,
                  date: date,
                  tableName: 'holiday',
                },
              },
              { transaction }
            );
          }
        }
      }
      let holidayDates = [];
      for (let date of holidayDate) {
        if (new Date(user.applicableDate) <= new Date(date)) {
          if (!user.endDate || new Date(user.endDate) >= new Date(date)) {
            await weekoffHolidayTran.destroy(
              {
                where: {
                  userMasterID: user.userMasterID,
                  date: date,
                  tableName: 'holiday',
                },
              },
              { transaction }
            );
            holidayDates.push({
              userMasterID: user.userMasterID,
              companyMasterID: companyMasterID,
              yearMonth: date.slice(0, 4) + date.slice(5, 7),
              date: date,
              dayName: get_day(date),
              value: 1,
              tableName: 'holiday',
              optionalHoliday: +optionalHoliday[count] ? true : false,
            });
          }
        }
        count++;
      }
      await weekoffHolidayTran.bulkCreate(holidayDates, transaction);
    }
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.holidaypolicyupdate,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

function get_day(date) {
  temp = new Date(date).getDay();
  days = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  return days[temp];
}
/**
 * update status
 *
 * @param {id} holidayPolicyID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { holidayPolicyID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await holidayPolicy.update(
        {
          status: '1',
        },
        {
          where: { holidayPolicyID: holidayPolicyID, status: ['1', '0'] },
        }
      );
    } else {
      let data = await employeeHolidayPolicy.findOne({
        where: {
          holidayPolicyID: holidayPolicyID,
          status: ['1', '0'],
        },
      });

      if (data) {
        return res.status(200).json({
          status: 401,
          message:
            'You can not deactivate this Holiday Policy. Already assigned to employees.',
        });
      } else {
        delete_status = await holidayPolicy.update(
          {
            status: '0',
          },
          {
            where: { holidayPolicyID: holidayPolicyID, status: ['1', '0'] },
          }
        );
      }
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.holidaypolicydelete,
        data: {},
      });
    } else {
      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} holidayPolicyID  to delete id
 */
exports.postDeleteholidayPolicyById = async (req, res, next) => {
  try {
    let { holidayPolicyID } = await req.body;

    let data = await employeeHolidayPolicy.findOne({
      where: {
        holidayPolicyID: holidayPolicyID,
        status: ['1', '0'],
      },
    });

    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Holiday Policy. Already assigned to employees.',
      });
    } else {
      let delete_status = await holidayPolicy.update(
        {
          status: 2,
        },
        {
          where: { holidayPolicyID: holidayPolicyID },
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.holidaypolicydelete,
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getactiveholidaypolicybycompanyid = async (req, res, next) => {
  try {
    department = await holidayPolicy.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    res.status(200).json({ status: 200, data: department });
  } catch (err) {
    next(err);
  }
};
