const Sequelize = require('sequelize');
const HRSalaryFieldChild = require('../models/hrSalaryFieldChild');
const logger = require('../config/logger');
const message = require('../response_message/message');
/**
 * save hr salary field child data.
 *
 * @body {createBy} createBy user id of user who added the grade salary structure.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddHRSalaryFieldChild = async (req, res, next) => {
  try {
    let = { salaryFieldID, salaryFieldsEffect, createBy, createByIp } =
      await req.body;
    let insert_db_status = await HRSalaryFieldChild.create({
      salaryFieldID,
      salaryFieldsEffect,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.hrsalaryfieldchildadd,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all hr salary field child data
 */

exports.getAllHRSalaryFieldChildData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let grade_salary_structure_data = [];
    if (limit == '' && page == '') {
      grade_salary_structure_data = await HRSalaryFieldChild.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      grade_salary_structure_data = await HRSalaryFieldChild.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
    }

    const totalcount = await HRSalaryFieldChild.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res.status(200).json({
      status: 200,
      data: grade_salary_structure_data,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with hr salary field child id
 *
 * @param {id} salaryFieldChildID  to fetch hr salary field child
 */

exports.getHRSalaryFieldChildById = async (req, res, next) => {
  try {
    let get_one_data = await HRSalaryFieldChild.findOne({
      where: {
        salaryFieldChildID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
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

/**
 * find data with hr salary field id
 *
 * @param {id} salaryFieldID  to fetch hr salary field child
 */

exports.getHRSalaryFieldChildBySalaryFieldId = async (req, res, next) => {
  try {
    let get_one_data = await HRSalaryFieldChild.findOne({
      where: {
        salaryFieldID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
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

/**
 * update data
 *
 * @param {id} salaryFieldChildID  to update id
 */
exports.postUpdateHRSalaryFieldChild = async (req, res, next) => {
  try {
    let = {
      salaryFieldChildID,
      salaryFieldID,
      salaryFieldsEffect,
      updateBy,
      updateByIp,
    } = await req.body;
    let change_data_status = await HRSalaryFieldChild.update(
      {
        salaryFieldID,
        salaryFieldsEffect,
        updateBy,
        updateByIp,
      },
      {
        where: { salaryFieldChildID: salaryFieldChildID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.hrsalaryfieldchildupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} salaryFieldChildID  to update status of grade salary structure
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { salaryFieldChildID, status } = await req.body;
    let delete_status;
    if (status == '1') {
      delete_status = await HRSalaryFieldChild.update(
        {
          status: '1',
        },
        {
          where: { salaryFieldChildID: salaryFieldChildID, status: ['1', '0'] },
        }
      );
    } else {
      delete_status = await HRSalaryFieldChild.update(
        {
          status: '0',
        },
        {
          where: { salaryFieldChildID: salaryFieldChildID, status: ['1', '0'] },
        }
      );
    }

    if (delete_status != 0) {
      res.status(200).json({
        status: 200,
        message: message.usermessage.hrsalaryfieldchilddelete,
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
 * @param {id} salaryFieldChildID  to delete id
 */
exports.postDeleteHRSalaryFieldChildById = async (req, res, next) => {
  try {
    let = { salaryFieldChildID } = await req.body;
    let delete_status = await HRSalaryFieldChild.update(
      {
        status: 2,
      },
      {
        where: { salaryFieldChildID: salaryFieldChildID },
      }
    );

    res.status(200).json({
      status: 200,
      message: message.usermessage.hrsalaryfieldchilddelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.salaryfieldbyeffected = async (req, res, next) => {
  try {
    let get_one_data = await HRSalaryFieldChild.findAll({
      where: {
        salaryFieldsEffect: req.params.id,
        status: 1,
      },
      include: [{ all: true, nested: true }],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
