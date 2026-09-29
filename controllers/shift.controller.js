const Sequelize = require('sequelize');
const Shift = require('../models/shift');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const shiftTime = require('../models/shiftTime');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const AttendanceTransaction = require('../models/attendanceTransaction');
const { generateExcelForShift } = require('../utils/exportData');
const EmployeeShift = require('../models/employeeShift');

/**
 * save shift data.
 *
 * @body {createBy} createBy user id of user who added the shift.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddShift = async (req, res, next) => {
  try {
    let {
      shiftName,
      shiftCode,
      shiftDesc,
      table,
      referenceId,
      branchMasterID,
      deductionOn,
      shiftGrace,
      companyMasterID,
      shifttime,
      createBy,
      createByIp,
    } = await req.body;

    let branchID = branchMasterID;

    const existingPolicy = await Shift.findOne({
      where: [
        sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('shiftName'))
          ),
          shiftName.trim().toLowerCase()
        ),
        { companyMasterID: companyMasterID },
      ],
    });

    if (existingPolicy) {
      return res.status(200).json({
        status: 400,
        message: message.usermessage.existingShiftPolicyName,
      });
    }

    let insert_db_status;
    await sequelize.transaction(async (t) => {
      insert_db_status = await Shift.create(
        {
          shiftName,
          shiftCode,
          shiftDesc,
          table,
          referenceId,
          branchID,
          deductionOn,
          shiftGrace,
          companyMasterID,
          shifttime,
          createBy,
          createByIp,
        },
        { transaction: t }
      );
      shifttime.forEach(async (option) => {
        option['shiftID'] = insert_db_status.shiftID;
      });
      await shiftTime.bulkCreate(shifttime, {
        returning: true,
        transaction: t,
      });
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.shiftadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all shift data
 */

exports.getAllShiftData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let shift_data = [];
    if (limit == '' && page == '') {
      shift_data = await Shift.findAll({
        order: [['shiftName', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      shift_data = await Shift.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['shiftName', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    }

    const totalcount = await Shift.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: shift_data, totalcount: totalcount });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with shift id
 *
 * @param {id} shiftID  to fetch shift name
 */

exports.getShiftById = async (req, res, next) => {
  try {
    let get_one_data = await Shift.findOne({
      where: {
        shiftID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [{ all: true, nested: true }],
    });
    if (get_one_data) {
      let get_options = await shiftTime.findAll({
        where: {
          shiftID: req.params.id,
        },
      });
      get_one_data.dataValues.shiftTime = get_options;
    }

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * find data with shift id
 *
 * @param {id} shiftID  to fetch shift name
 */
exports.getShiftByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { shiftName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { shiftCode: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        { shiftDesc: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
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

    const shift = await Shift.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
      ],
    });

    async function processRow(row) {
      const ShiftTimeData = await shiftTime.findAll({
        raw: true,
        where: {
          shiftID: row.shiftID,
        },
      });
      row.dataValues.shiftTime = ShiftTimeData;
      return row;
    }

    if (exportData) {
      const final = await Promise.all(shift.rows.map(processRow));

      if (+final.length === 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      const final1 = [];

      final.map((shift, index) => {
        const companyInfo = [
          index + 1,
          shift.shiftName,
          shift.companyMaster.companyName,
          shift.shiftCode,
          shift.shiftDesc,
          shift.status == 1
            ? (shift.status = 'Active')
            : (shift.status = 'Deactive'),
          shift.shiftGrace,
        ];

        console.log(shift, 'shift');
        for (const shiftTime of shift.dataValues.shiftTime) {
          const shiftTimeInfo = [
            ...companyInfo,
            shiftTime.day,
            shiftTime.statTime,
            shiftTime.firsthalfendtime,
            shiftTime.secondhalfstarttime,
            shiftTime.endtime,
            shiftTime.totalhourshalfday,
            shiftTime.totalhours,
          ];

          final1.push(shiftTimeInfo);
        }
      });

      await generateExcelForShift(final1, 'Shift', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: shift.rows,
      totalcount: shift.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} shiftID  to update id
 */
exports.postUpdateShift = async (req, res, next) => {
  try {
    let {
      shiftID,
      shiftName,
      shiftCode,
      shiftDesc,
      table,
      referenceId,
      branchMasterID,
      deductionOn,
      shiftGrace,
      companyMasterID,
      shifttime,
      updateBy,
      updateByIp,
    } = await req.body;
    let branchID = branchMasterID;

    const existingPolicyName = await Shift.findOne({
      where: {
        [Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              'TRIM',
              sequelize.fn('LOWER', sequelize.col('shiftName'))
            ),
            shiftName.trim().toLowerCase()
          ),
          { companyMasterID: companyMasterID },
          { shiftID: { [Sequelize.Op.ne]: shiftID } },
        ],
      },
    });

    if (existingPolicyName) {
      return res.status(200).json({
        status: 400,
        message: message.usermessage.existingShiftPolicyName,
      });
    }

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await Shift.update(
        {
          shiftName,
          shiftCode,
          shiftDesc,
          table,
          referenceId,
          branchID,
          deductionOn,
          shiftGrace,
          companyMasterID,
          shifttime,
          updateBy,
          updateByIp,
        },
        {
          where: { shiftID: shiftID },
          transaction: t,
        }
      );
      let delete_options = await shiftTime.destroy({
        where: {
          shiftID: shiftID,
        },
        transaction: t,
      });
      shifttime.forEach(async (option) => {
        option['shiftID'] = shiftID;
      });
      let insert_options = await shiftTime.bulkCreate(shifttime, {
        returning: true,
        transaction: t,
      });

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.shiftupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} shiftID  to update status of shift
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { shiftID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Shift.update(
          {
            status: '1',
          },
          {
            where: { shiftID: shiftID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await Shift.update(
          {
            status: '0',
          },
          {
            where: { shiftID: shiftID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.shiftdelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} shiftID  to delete id
 */
exports.postDeleteShiftById = async (req, res, next) => {
  try {
    const { shiftID } = await req.body;

    const empShift = await EmployeeShift.findOne({
      where: {
        [Sequelize.Op.or]: [
          {
            shiftsID: {
              [Sequelize.Op.contains]: [shiftID],
            },
          },
          {
            shiftID: shiftID,
          },
        ],
      },
    });

    if (empShift)
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this shift because already assigned to employees.',
      });

    await Shift.update(
      {
        status: 2,
      },
      {
        where: { shiftID: shiftID },
      }
    );

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.shiftdelete });
  } catch (err) {
    next(err);
  }
};

exports.getactiveshiftbycompanyid = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(200)
        .json({ status: 401, message: 'Please pass valid params!' });

    const allShift = await Shift.findAll({
      where: {
        companyMasterID: id,
        status: 1,
      },
      include: { model: companyMasters },
    });
    return res.status(200).json({ status: 200, data: allShift });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Penalty
 */
exports.getPaneltyManagement = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, userMasterID } = req.body;
    let offset = (page - 1) * limit;
    let get_all_data;
    let totalcount;

    if (searchQuery && searchQuery != '') {
      if (req.body.showonlypanelty == 'true') {
        get_all_data = await AttendanceTransaction.findAll({
          offset: offset,
          limit: limit,
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
            Panalty: {
              [Sequelize.Op.not]: null,
            },
            Panalty: {
              [Sequelize.Op.not]: '',
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      } else {
        get_all_data = await AttendanceTransaction.findAll({
          offset: offset,
          limit: limit,
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      }

      let count_Data;
      if (req.body.showonlypanelty == 'true') {
        count_Data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
            Panalty: {
              [Sequelize.Op.not]: null,
            },
            Panalty: {
              [Sequelize.Op.not]: '',
            },
          },

          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      } else {
        count_Data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            [Sequelize.Op.or]: [
              {
                '$userMaster.displayName$': {
                  [Sequelize.Op.iLike]: '%' + searchQuery + '%',
                },
              },
            ],
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
          },

          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      }
      totalcount = count_Data.length;
    } else if (page == '' && limit == '') {
      if (req.body.showonlypanelty == 'true') {
        get_all_data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
            Panalty: {
              [Sequelize.Op.not]: null,
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      } else {
        get_all_data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      }
      totalcount = get_all_data.length;
    } else {
      if (req.body.showonlypanelty == 'true') {
        get_all_data = await AttendanceTransaction.findAll({
          offset: offset,
          limit: limit,
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
            Panalty: {
              [Sequelize.Op.not]: null,
            },
            Panalty: {
              [Sequelize.Op.not]: '',
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      } else {
        get_all_data = await AttendanceTransaction.findAll({
          offset: offset,
          limit: limit,
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
          },
          order: [['AttendanceDate', 'ASC']],
          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      }

      let count_Data;
      if (req.body.showonlypanelty == 'true') {
        count_Data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
            Panalty: {
              [Sequelize.Op.not]: null,
            },
            Panalty: {
              [Sequelize.Op.not]: '',
            },
          },

          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      } else {
        count_Data = await AttendanceTransaction.findAll({
          where: {
            userMasterID: {
              [Sequelize.Op.in]: userMasterID,
            },
            Status: [0, 1],
            AttendanceDate: {
              [Sequelize.Op.between]: [
                new Date(req.body.fromdate),
                new Date(req.body.todate),
              ],
            },
          },

          include: [
            { model: UserMaster, include: [{ model: companyMasters }] },
          ],
        });
      }
      totalcount = count_Data.length;
    }

    return res.status(200).json({
      status: 200,
      message: 'Data get Successfully',
      totalcount: totalcount,
      data: get_all_data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete Penalty
 */
exports.deletePenalty = async (req, res, next) => {
  try {
    let = { AttendanceTransID, upateBy, updateByIp } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let remove_penalty = await AttendanceTransaction.update(
        {
          Panalty: null,
          PanaltyDeduction: null,
          updateBy: upateBy,
          updateByIp: updateByIp,
        },
        {
          where: { AttendanceTransID: AttendanceTransID },
          transaction: t,
        }
      );
      let msg = 'Penalty Removed Successfully';

      res.status(200).json({ status: 200, message: msg });
      return remove_penalty;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
