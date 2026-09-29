const Sequelize = require('sequelize');
const Penalty = require('../models/penalty');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const employeePenalty = require('../models/employeePenalty');
const { generateExcel } = require('../utils/exportData');

/**
 * save penalty data.
 *
 * @body {createBy} createBy user id of user who added the penalty.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddPenalty = async (req, res, next) => {
  try {
    let {
      penalty,
      penaltyName,
      penaltyAmount,
      deductionFromSalary,
      companyMasterID,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await Penalty.create(
        {
          penalty,
          penaltyName,
          penaltyAmount,
          deductionFromSalary,
          companyMasterID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.penaltyadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all penalty data
 */

exports.getAllPenaltyData = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let penalty_data = [],
      totalcount;
    if (searchQuery) {
      penalty_data = await Penalty.findAll({
        where: {
          [Sequelize.Op.or]: [
            { penaltyName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(sequelize.col('penalty.penaltyAmount'), 'varchar'),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      totalcount = penalty_data.length;
    } else if (limit == '' && page == '') {
      penalty_data = await Penalty.findAll({
        order: [['penaltyName', 'ASC']],
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
      totalcount = await Penalty.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      penalty_data = await Penalty.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['penaltyName', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      totalcount = await Penalty.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: penalty_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with penalty id
 *
 * @param {id} penaltyID  to fetch penalty name
 */

exports.getPenaltyById = async (req, res, next) => {
  try {
    let get_one_data = await Penalty.findOne({
      where: {
        penaltyID: req.params.id,
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
 * find data with penalty id
 *
 * @param {id} penaltyID  to fetch penalty name
 */

exports.getPenaltyByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          penaltyName: {
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

    const penalty = await Penalty.findAndCountAll({
      raw: true,
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

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < penalty.rows.length; i++) {
        const data1 = {
          PenaltyName: penalty.rows[i].penaltyName,
          PenaltyAmount: penalty.rows[i].penaltyAmount,
          DeductionFromSalary: penalty.rows[i].deductionFromSalary,
          CompanyName: penalty.rows[i]['companyMaster.companyName'],
          Status: penalty.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        data1.DeductionFromSalary == true
          ? (data1.DeductionFromSalary = 'Yes')
          : (data1.DeductionFromSalary = 'No');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'Penalty', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: penalty.rows,
      totalcount: penalty.count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} penaltyID  to update id
 */
exports.postUpdatePenalty = async (req, res, next) => {
  try {
    let {
      penaltyID,
      penalty,
      penaltyName,
      penaltyAmount,
      deductionFromSalary,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await Penalty.update(
        {
          penalty,
          penaltyName,
          penaltyAmount,
          deductionFromSalary,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { penaltyID: penaltyID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.penaltyupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} penaltyID  to update status of penalty
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { penaltyID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Penalty.update(
          {
            status: '1',
          },
          {
            where: { penaltyID: penaltyID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await employeePenalty.findOne({
          where: {
            penaltyID: penaltyID,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Penalty.Already assigned to employees.',
          });
        } else {
          delete_status = await Penalty.update(
            {
              status: '0',
            },
            {
              where: { penaltyID: penaltyID, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.penaltydelete,
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
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} penaltyID  to delete id
 */
exports.postDeletePenaltyById = async (req, res, next) => {
  try {
    let { penaltyID } = await req.body;

    let data = await employeePenalty.findOne({
      where: {
        penaltyID: penaltyID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Penalty.Already assigned to employees.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await Penalty.update(
          {
            status: 2,
          },
          {
            where: { penaltyID: penaltyID },
            transaction: t,
          }
        );

        res
          .status(200)
          .json({ status: 200, message: message.usermessage.penaltydelete });
        return delete_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getactivepenaltybycompanyid = async (req, res, next) => {
  try {
    const findPenalty = await Penalty.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: findPenalty });
  } catch (err) {
    next(err);
  }
};
