const Sequelize = require('sequelize');
const EmployeePenalty = require('../models/employeePenalty');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const Penalty = require('../models/penalty');
const { generateExcel } = require('../utils/exportData');
const {
  employeeSalaryPolicy,
  daysInMonth,
} = require('../utils/commonUtilFunctions');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const fs = require('fs');
const companyMaster = require('../models/companyMaster');
const { cond } = require('lodash');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const path = require('path');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');

/**
 * save employee penalty data.
 *
 * @body {createBy} createBy user id of user who added the employee penalty.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddEmployeePenalty = async (req, res, next) => {
  try {
    const {
      userMasterID,
      penaltyID,
      penaltyAmount,
      penaltyDate,
      description,
      // createBy,
      createByIp,
    } = await req.body;

    const createBy = req.userDetails.userMasterId;

    if (!userMasterID || penaltyAmount < 0 || !penaltyID || !penaltyDate) {
      return res.status(200).json({
        status: 401,
        message: 'Please send valid body request!',
      });
    }

    // const year = penaltyDate.slice(0, 4);
    // const Month = penaltyDate.slice(5, 7);
    // let month = year + Month;
    // let monday = daysInMonth(Month, year);

    const calulatedAttn = await HrLeaveMonthlyTrans.findOne({
      where: {
        userMasterID,
        monthstartdate: {
          [Sequelize.Op.lte]: penaltyDate,
        },
        monthenddate: {
          [Sequelize.Op.gte]: penaltyDate,
        },
      },
    });

    if (calulatedAttn) {
      const salary = await HRSalaryTrasaction.findOne({
        where: {
          userMasterID: userMasterID,
          salaryYYYYMM: calulatedAttn.AttnYearMon,
        },
      });

      if (salary) {
        return res.status(200).json({
          status: 401,
          message: 'Salary already calculated for this month.',
        });
      }
    }

    await sequelize.transaction(async (t) => {
      const penaltyData = await EmployeePenalty.findOne({
        raw: true,
        where: {
          userMasterID,
          penaltyID,
          penaltyDate,
          status: 1,
        },
      });

      if (penaltyData) {
        await EmployeePenalty.update(
          {
            penaltyAmount,
            updateBy: +createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeePenaltyID: penaltyData.employeePenaltyID,
            },
            transaction: t,
          }
        );
      } else {
        let attachment;
        if (req.file) attachment = req.file.filename;

        await EmployeePenalty.create(
          {
            userMasterID,
            penaltyID,
            penaltyAmount,
            penaltyDate,
            description,
            attachment,
            createBy,
            createByIp,
          },
          { transaction: t }
        );
      }
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.emppenaltyadd,
    });
  } catch (err) {
    next(err);
  }
};

/**
 return all employee penalty data
 */

exports.getAllEmployeePenaltyData = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID, companyMasterID } =
      await req.body;

    if (!companyMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const paginationQuery = {};
    const condition = {};

    condition.status = ['0', '1'];

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (userMasterID) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    }

    if (startdate && enddate) {
      condition.penaltyDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        { description: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
        {
          '$penalty.penaltyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.firstName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.lastName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$employee.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        sequelize.where(
          sequelize.cast(
            sequelize.col('employeePenalty.penaltyAmount'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
        sequelize.where(
          sequelize.cast(
            sequelize.col('employeePenalty.penaltyDate'),
            'varchar'
          ),
          { [Sequelize.Op.iLike]: `%${searchQuery}%` }
        ),
      ];
    }

    const employee_penalty = await EmployeePenalty.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: UserMaster,
          as: 'employee',
          where: { companyMasterId: companyMasterID,status: [0,1] },
          attributes: ['userMasterID', 'displayName'],
        },
        {
          model: Penalty,
          as: 'penalty',
          attributes: [
            'penaltyID',
            'penaltyName',
            'penaltyAmount',
            'deductionFromSalary',
          ],
        },
      ],
      order: [['penaltyDate', 'DESC']],
    });

    if (req.body.export) {
      const finalData = await Promise.all(
        employee_penalty.rows.map((e) => {
          return {
            'Employee Name': e.employee.displayName,
            Penalty: e.penalty.penaltyName,
            'Penalty Date': e.penaltyDate,
            'Penalty Amount': e.penaltyAmount,
          };
        })
      );

      if (+finalData.length === 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      return await generateExcel(finalData, 'employee Penalty', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: employee_penalty.rows,
      totalcount: +employee_penalty.count,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * find data with employeePenalty id
 *
 * @param {id} employeePenaltyID  to fetch employee penalty
 */

exports.getEmployeePenaltyById = async (req, res, next) => {
  try {
    let get_one_data = await EmployeePenalty.findOne({
      where: {
        employeePenaltyID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          as: 'employee',
          include: [
            {
              model: companyMaster,
            },
          ],
        },
        { model: Penalty, as: 'penalty' },
      ],
    });

    if (!get_one_data) {
      return res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      return res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userMaster id
 *
 * @param {id} userMasterID  to fetch employee penalty
 */

exports.getEmployeePenaltyByUserId = async (req, res, next) => {
  try {
    let get_one_data = await EmployeePenalty.findAll({
      where: {
        userMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          as: 'employee',
          include: [
            {
              model: companyMaster,
            },
          ],
        },
        { model: Penalty, as: 'penalty' },
      ],
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

/**
 * update data
 *
 * @param {id} employeePenaltyID  to update id
 */
exports.postUpdateEmployeePenalty = async (req, res, next) => {
  try {
    let {
      employeePenaltyID,
      userMasterID,
      penaltyID,
      penaltyAmount,
      penaltyDate,
      description,
      removeFile,
      // updateBy,
      updateByIp,
    } = await req.body;
    const updateBy = req.userDetails.userMasterId;

    if (
      !employeePenaltyID ||
      !userMasterID ||
      penaltyAmount < 0 ||
      !penaltyID ||
      !penaltyDate
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please send valid body request!',
      });
    }

    let get_one_data = await EmployeePenalty.findOne({
      raw: true,
      where: {
        employeePenaltyID: employeePenaltyID,
      },
    });

    if (!get_one_data)
      return res.status(200).json({
        status: 401,
        message: `data not found!`,
      });

    if (get_one_data.RefrenceId)
      return res.status(200).json({
        status: 401,
        message:
          'Already deducted from salary.So, you can not update this penalty.',
      });

    const penaltyData = await EmployeePenalty.findOne({
      raw: true,
      where: {
        userMasterID,
        penaltyDate,
        penaltyID,
        status: 1,
        employeePenaltyID: {
          [Sequelize.Op.ne]: get_one_data.employeePenaltyID,
        },
      },
    });

    console.log(penaltyData, userMasterID, penaltyDate, penaltyID);

    if (penaltyData) {
      return res.status(200).json({
        status: 401,
        message: `Penalty already assigned to employee on this date of this month.`,
      });
    }

    let attachment = null;
    if (removeFile) {
      console.log(removeFile, '----');
      if (get_one_data.attachment) {
        const filePath = path.join(
          __dirname,
          `../uploads/employee-penalty-attachments/${get_one_data.attachment}`
        );

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }
    }

    if (req.file) {
      attachment = req.file.filename;

      if (get_one_data.attachment) {
        const filePath = path.join(
          __dirname,
          `../uploads/employee-penalty-attachments/${get_one_data.attachment}`
        );

        fs.unlink(filePath, function (err) {
          if (err) {
            console.log(err);
          } else {
            console.log('file updated on server successfully');
          }
        });
      }
    } else {
      if (!removeFile) attachment = get_one_data.attachment;
    }

    await EmployeePenalty.update(
      {
        userMasterID,
        penaltyID,
        penaltyAmount,
        penaltyDate,
        attachment,
        description,
        updateBy,
        updateByIp,
      },
      {
        where: { employeePenaltyID: employeePenaltyID },
      }
    );

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.emppenaltyupdate });
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} employeePenaltyID  to update status of employee penalty
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let = { employeePenaltyID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await EmployeePenalty.update(
          {
            status: '1',
          },
          {
            where: { employeePenaltyID: employeePenaltyID, status: ['1', '0'] },
          }
        );
      } else {
        delete_status = await EmployeePenalty.update(
          {
            status: '0',
          },
          {
            where: { employeePenaltyID: employeePenaltyID, status: ['1', '0'] },
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.emppenaltydelete,
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
 * @param {id} employeePenaltyID  to delete id
 */
exports.postDeleteEmployeePenaltyById = async (req, res, next) => {
  try {
    let = { employeePenaltyID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await EmployeePenalty.update(
        {
          status: 2,
        },
        {
          where: { employeePenaltyID: employeePenaltyID },
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.emppenaltydelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getPenaltyByUserID = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['penaltyDate', 'DESC']];

    if (userMasterID) condition.userMasterID = userMasterID;
    condition.status = 1;
    if (startdate && enddate)
      condition.penaltyDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          penaltyAmount: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$penalty.penaltyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const AllPenalty = await EmployeePenalty.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order: [['penaltyDate', 'DESC']],
      include: [
        {
          model: UserMaster,
          as: 'employee',
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: Penalty,
          as: 'penalty',
        },
      ],
    });

    for (let j = 0; j < AllPenalty.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllPenalty.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllPenalty.rows[j].updateBy },
      });

      if (user1) AllPenalty.rows[j].createBy = user1.dataValues.displayName;
      if (user2) AllPenalty.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res.status(200).json({
      status: 200,
      data: AllPenalty.rows,
      totalcount: AllPenalty.count,
    });
  } catch (err) {
    next(err);
  }
};
