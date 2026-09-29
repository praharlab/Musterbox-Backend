const Sequelize = require('sequelize');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const GradeStructure = require('../models/gradeStructure');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
/**
 * save gradeSalaryStructure data.
 *
 * @body {createBy} createBy user id of user who added the grade salary structure.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddGradeSalaryStructure = async (req, res, next) => {
  try {
    let = {
      gradeStructureID,
      salaryFieldID,
      formula,
      formulaID,
      createBy,
      createByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await GradeSalaryStructure.create(
        {
          gradeStructureID,
          salaryFieldID,
          formula,
          formulaID,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.gradesalarystructureadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all gradeSalaryStructure data
 */

exports.getAllGradeSalaryStructureData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let grade_salary_structure_data = [];
    if (limit == '' && page == '') {
      grade_salary_structure_data = await GradeSalaryStructure.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      grade_salary_structure_data = await GradeSalaryStructure.findAll({
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

    const totalcount = await GradeSalaryStructure.count({
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
 * find data with gradeSalaryStructure id
 *
 * @param {id} gradeSalaryStructureID  to fetch gradeSalaryStructure name
 */

exports.getGradeSalaryStructureById = async (req, res, next) => {
  try {
    let get_one_data = await GradeSalaryStructure.findOne({
      where: {
        gradeSalaryStructureID: req.params.id,
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
 * @param {id} gradeSalaryStructureID  to update id
 */
exports.postUpdateGradeSalaryStructure = async (req, res, next) => {
  try {
    let = {
      gradeSalaryStructureID,
      gradeStructureID,
      salaryFieldID,
      formula,
      formulaID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await GradeSalaryStructure.update(
        {
          gradeStructureID,
          salaryFieldID,
          formula,
          formulaID,
          updateBy,
          updateByIp,
        },
        {
          where: { gradeSalaryStructureID: gradeSalaryStructureID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.gradesalarystructureupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} gradeSalaryStructureID  to update status of grade salary structure
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { gradeSalaryStructureID, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await GradeSalaryStructure.update(
          {
            status: '1',
          },
          {
            where: {
              gradeSalaryStructureID: gradeSalaryStructureID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await GradeSalaryStructure.update(
          {
            status: '0',
          },
          {
            where: {
              gradeSalaryStructureID: gradeSalaryStructureID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.gradesalarystructuredelete,
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
 * @param {id} gradeSalaryStructureID  to delete id
 */
exports.postDeleteGradeSalaryStructureById = async (req, res, next) => {
  try {
    let = { gradeSalaryStructureID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await GradeSalaryStructure.update(
        {
          status: 2,
        },
        {
          where: { gradeSalaryStructureID: gradeSalaryStructureID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.gradesalarystructuredelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getsalarystructuredataBygradeId = async (req, res, next) => {
  try {
    let { gradeStructureID } = await req.body;

    let finddata = await GradeSalaryStructure.findAll({
      where: {
        gradeStructureID: gradeStructureID,
        status: 1,
      },
      include: [
        { model: GradeStructure },
        { model: HRSalaryFields, include: [{ model: Payheadmaster }] },
      ],
    });

    res.status(200).json({
      status: 200,
      data: finddata,
      message: 'Data get successfully.',
    });
  } catch (err) {
    next(err);
  }
};
