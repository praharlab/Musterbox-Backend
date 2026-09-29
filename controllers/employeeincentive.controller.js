const Sequelize = require('sequelize');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Incentivetype = require('../models/incentivetype');
const employeeincentive = require('../models/employeeincentive');
const companyMaster = require('../models/companyMaster');
const { executeQuery } = require('./common.controller');
const Employeeincentive = require('../models/employeeincentive');
const { generateExcel } = require('../utils/exportData');
const { Op } = require('sequelize');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const { month_dict, accessibleUsers } = require('../utils/commonUtilFunctions');
const FoodAllowancePolicy = require('../models/foodAllowancePolicy');
const EmployeeFoodAllowancePolicy = require('../models/employeeFoodAllowancePolicy');
const attendanceTransaction = require('../models/attendanceTransaction');
const FoodAllowancePolicyDetails = require('../models/foodAllowancePolicyDetails');
const {
  TeaAllowanceTypeEnum,
  nonEditableList_INC,
} = require('../utils/dbUtils');

/**
 * save asset employeeincentive data.
 *
 * @body {createBy} createBy user id of user who added the employeeincentivety.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddemployeeincentivetype = async (req, res, next) => {
  try {
    let {
      userMasterID,
      yearmonth,
      amount,
      IncentivetypeID,
      incentivetypename,
      incentiveDate,
      status,
      description,
      // createBy,
      createByIp,
    } = await req.body;

    const createBy = req.userDetails.userMasterId;

    if (
      !userMasterID ||
      !yearmonth ||
      amount < 0 ||
      !IncentivetypeID ||
      !incentiveDate
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please send valid body request!',
      });
    }

    const findIncentiveType = await Incentivetype.findOne({
      raw: true,
      where: {
        IncentivetypeID,
      },
    });

    if (
      findIncentiveType &&
      nonEditableList_INC.includes(
        String(findIncentiveType.incentivetypename).trim().toLowerCase()
      )
    ) {
      return res.status(200).send({
        status: 401,
        message: `Adding an incentive for '${findIncentiveType.incentivetypename}' is not allowed. Please choose a different incentive type.`,
      });
    }

    if (incentiveDate.slice(0, 4) + incentiveDate.slice(5, 7) != yearmonth)
      return res.status(200).send({
        status: 401,
        message: `Incentive Date is not range of this month`,
      });

    const finalData = [];
    let message = '';

    await sequelize.transaction(async (t) => {
      for (const userid of userMasterID) {
        const salary = await HRSalaryTrasaction.findOne({
          rw: true,
          where: {
            userMasterID: userid,
            salaryYYYYMM: +yearmonth,
          },
          include: [{ model: UserMaster, attributes: ['displayName'] }],
        });

        if (salary) {
          message = `Salary already calculated for this month of ${salary['userMaster.displayName']}.`;
          break;
        }

        const incentiveData = await Employeeincentive.findOne({
          raw: true,
          where: {
            userMasterID: userid,
            yearmonth: +yearmonth,
            IncentivetypeID: IncentivetypeID,
            incentiveDate: incentiveDate,
            status: 1,
          },
        });

        if (!incentiveData) {
          finalData.push({
            userMasterID: userid,
            yearmonth,
            amount,
            IncentivetypeID,
            incentivetypename,
            incentiveDate,
            status,
            description,
            createBy,
            createByIp,
          });

          continue;
        }

        await Employeeincentive.update(
          {
            amount,
            updateBy: +createBy,
            updateByIp: createByIp,
          },
          {
            where: {
              employeeincentiveID: incentiveData.employeeincentiveID,
            },
            transaction: t,
          }
        );
      }

      if (!message)
        await Employeeincentive.bulkCreate(finalData, { transaction: t });
    });

    if (message)
      return res.status(200).json({
        status: 401,
        message,
      });

    return res.status(200).json({
      status: 200,
      message: 'Employee Incentive Added successfully.',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Data
 */
exports.postUpdateemployeeincentive = async (req, res, next) => {
  try {
    let {
      employeeincentiveID,
      // userMasterID,
      yearmonth,
      amount,
      IncentivetypeID,
      incentivetypename,
      incentiveDate,
      description,
      // status,
      // updateBy,
      updateByIp,
    } = await req.body;

    const updateBy = req.userDetails.userMasterId;

    if (
      !employeeincentiveID ||
      !yearmonth ||
      amount < 0 ||
      !IncentivetypeID ||
      !incentiveDate
    ) {
      return res.status(200).json({
        status: 401,
        message: 'Please send valid body request!',
      });
    }

    const data = await Employeeincentive.findByPk(employeeincentiveID);

    if (!data) {
      return res.status(200).json({
        status: 401,
        message: `data not found!`,
      });
    }

    const findIncentiveType = await Incentivetype.findOne({
      raw: true,
      where: {
        IncentivetypeID,
      },
    });

    if (
      findIncentiveType &&
      nonEditableList_INC.includes(
        String(findIncentiveType.incentivetypename).trim().toLowerCase()
      )
    ) {
      return res.status(200).send({
        status: 401,
        message: `Adding an incentive for '${findIncentiveType.incentivetypename}' is not allowed. Please choose a different incentive type.`,
      });
    }

    const userMasterID = data.userMasterID;

    if (incentiveDate.slice(0, 4) + incentiveDate.slice(5, 7) != yearmonth)
      return res.status(200).send({
        status: 401,
        message: `Incentive Date is not range of this month`,
      });

    const salary = await HRSalaryTrasaction.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
        salaryYYYYMM: +yearmonth,
      },
      include: [{ model: UserMaster, attributes: ['displayName'] }],
    });

    if (salary) {
      return res.status(200).json({
        status: 401,
        message: `Salary already calculated for this month of ${salary['userMaster.displayName']}.`,
      });
    }

    await sequelize.transaction(async (t) => {
      const incentiveData = await Employeeincentive.findOne({
        raw: true,
        where: {
          userMasterID,
          yearmonth,
          IncentivetypeID,
          incentiveDate,
          status: 1,
          employeeincentiveID: {
            [Sequelize.Op.ne]: employeeincentiveID,
          },
        },
      });

      if (incentiveData) {
        return res.status(200).json({
          status: 401,
          message: `Incentive already assigned to employee on this date of this month.`,
        });
      }

      await employeeincentive.update(
        {
          userMasterID,
          yearmonth,
          amount,
          IncentivetypeID,
          incentivetypename,
          incentiveDate,
          description,
          updateBy,
          updateByIp,
        },
        {
          where: { employeeincentiveID },
          transaction: t,
        }
      );
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.employeeincentiveupdate,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with employeeincentiveID id
 *
 * @param {id} employeeincentiveID  to fetch branch name
 */

exports.getbyemployeeincentiveID = async (req, res, next) => {
  try {
    let get_one_data = await employeeincentive.findOne({
      where: {
        employeeincentiveID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: UserMaster,
          include: [
            {
              model: companyMaster,
            },
          ],
        },
        {
          model: Incentivetype,
        },
      ],
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

exports.getbyname = async (req, res, next) => {
  let = { companyMasterID } = await req.body;
  let results = await executeQuery(
    `select "incentivetypename","IncentivetypeID"  from incentivetypes where "companyMasterID"=` +
      companyMasterID +
      ``
  );
  try {
    totalcount = results.length;
    if (!results)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res
      .status(200)
      .json({ status: 200, data: results, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getIncentiveTypeWithOutAttnBonus = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;

    const data = await Incentivetype.findAll({
      raw: true,
      where: Sequelize.and(
        Sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('incentivetypename'))
          ),
          {
            [Sequelize.Op.notIn]: nonEditableList_INC,
          }
        ),
        Sequelize.where(sequelize.col('companyMasterID'), companyMasterID),
        Sequelize.or(
          Sequelize.where(sequelize.col('status'), 0),
          Sequelize.where(sequelize.col('status'), 1)
        )
      ),
    });
    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteemployeeincentiveData = async (req, res, next) => {
  try {
    let { employeeincentiveID } = await req.body;

    const incentiveData = await Employeeincentive.findOne({
      where: {
        employeeincentiveID,
      },
      include: [
        {
          required: true,
          model: Incentivetype,
          where: Sequelize.where(
            Sequelize.fn(
              'TRIM',
              Sequelize.fn(
                'LOWER',
                Sequelize.col('incentivetype.incentivetypename')
              )
            ),
            { [Sequelize.Op.in]: nonEditableList_INC }
          ),
        },
      ],
    });
    if (incentiveData) {
      return res.status(200).json({
        status: 401,
        message: `You can not delete an incentive of ${incentiveData.incentivetype.incentivetypename} incentive type.`,
      });
    }

    await employeeincentive.update(
      {
        status: '2',
      },
      {
        where: { employeeincentiveID: employeeincentiveID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.employeeincentivedelete,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllincentivedatabycompanyid = async (req, res, next) => {
  try {
    let { searchQuery, limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let employee_data;
    let totalcount;
    if (searchQuery && limit == '' && page == '') {
      employee_data = await employeeincentive.findAll({
        where: {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },

        include: [{ all: true, nested: true }],
        order: [['employeeincentiveID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (var j = 0; j < employee_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].updateBy,
          },
        });

        if (user1) {
          employee_data[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employee_data[j].updateBy = user2.dataValues.displayName;
        }
      }

      totalcount = await employeeincentive.count({
        where: {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },

        include: [{ all: true, nested: true }],
        order: [['employeeincentiveID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (searchQuery && limit && page) {
      employee_data = await employeeincentive.findAll({
        where: {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },

          status: [0, 1],
        },
        include: [{ all: true, nested: true }],
        limit: limit,
        offset: offset,
        order: [['IncentivetypeID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (var j = 0; j < employee_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].updateBy,
          },
        });

        if (user1) {
          employee_data[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employee_data[j].updateBy = user2.dataValues.displayName;
        }
      }

      totalcount = await employeeincentive.count({
        where: {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },

          status: [0, 1],
        },

        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else {
      employee_data = await employeeincentive.findAll({
        where: {
          status: [0, 1],
        },

        include: [{ all: true, nested: true }],
        limit: limit,
        offset: offset,
        order: [['employeeincentiveID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (var j = 0; j < employee_data.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employee_data[j].updateBy,
          },
        });

        if (user1) {
          employee_data[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employee_data[j].updateBy = user2.dataValues.displayName;
        }
      }

      totalcount = await employeeincentive.count({
        where: {
          status: [0, 1],
        },
        include: [{ all: true, nested: true }],
        limit: limit,
        offset: offset,
        order: [['employeeincentiveID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    }

    res
      .status(200)
      .json({ status: 200, data: employee_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getAllincentiveData = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      userMasterID,
      month,
      companyMasterID,
      incentivetype,
      searchQuery,
    } = await req.body;

    const paginate =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    condition.status = 1;

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition['$userMaster.companyMasterId$'] = companyMasterID;
    }

    if (!userMasterID || +userMasterID.length === 0) {
    } else {
      condition.userMasterID = userMasterID;
    }

    if (month) condition.yearmonth = month;

    if (incentivetype) condition.IncentivetypeID = incentivetype;

    if (searchQuery) {
      condition[Op.or] = [
        { '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$userMaster.userNumber$': { [Op.iLike]: `%${searchQuery}%` } },
        {
          '$incentivetype.incentivetypename$': {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          '$incentivetype.inc_type_displayName$': {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];
    }

    const { rows: incentiveData, count: totalcount } =
      await employeeincentive.findAndCountAll({
        raw: true,
        where: condition,
        ...paginate,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
            attributes: ['userMasterID'],
          },
          { model: Incentivetype, required: true, attributes: [] },
        ],
        order: [['employeeincentiveID', 'DESC']],
        attributes: [
          'employeeincentiveID',
          'ReferenceId',
          'IncentivetypeID',
          [Sequelize.col('userMaster.displayName'), 'Employee Name'],
          [Sequelize.col('userMaster.userNumber'), 'Employee Number'],
          [Sequelize.col('incentivetype.incentivetypename'), 'Incentive'],
          [
            Sequelize.col('incentivetype.inc_type_displayName'),
            'inc_type_displayName',
          ],
          [Sequelize.col('yearmonth'), 'YearMonth'],
          [Sequelize.col('incentiveDate'), 'Incentive Date'],
          [Sequelize.col('amount'), 'Amount'],
        ],
      });

    if (req.body.export) {
      const finalData = incentiveData.map((obj) => {
        return {
          'Employee Name': obj['Employee Name'],
          'Employee Number': obj['Employee Number'],
          Incentive: obj['inc_type_displayName']
            ? obj['inc_type_displayName']
            : obj['Incentive'],
          YearMonth: obj['YearMonth'],
          'Incentive Date': obj['Incentive Date'],
          Amount: obj['Amount'],
        };

        // Create a new object without the "age" field
        // const { IncentivetypeID, employeeincentiveID, ReferenceId, ...newObj } =
        //   obj;
        // return newObj;
      });

      if (+finalData.length === 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      return generateExcel(finalData, 'Employee Incentive', 'xlsx', res);
    }

    res
      .status(200)
      .json({ status: 200, data: incentiveData, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getemployeecompanyid = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, incentivetypename, yearmonth } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['employeeincentiveID', 'ASC']];

    condition.status = ['0', '1'];

    if (userMasterID) {
      condition.userMasterID = {
        [Sequelize.Op.in]: userMasterID,
      };
    }

    if (yearmonth) condition.yearmonth = yearmonth;

    if (incentivetypename) condition.IncentivetypeID = incentivetypename;

    const { rows: employeeincentive_data, count } =
      await employeeincentive.findAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: Incentivetype },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: employeeincentive_data,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMyIncentive = async (req, res, next) => {
  try {
    const { userMasterID, fromMonth, toMonth, page, limit, search } = req.query;
    if (!userMasterID)
      return res.status(200).json({
        status: 401,
        message: 'userMasterID is required field!',
      });

    if (+fromMonth > +toMonth)
      return res.status(200).json({
        status: 401,
        message: 'To Month must be greater than or equal to from Month!',
      });

    const condition = {};
    condition.userMasterID = userMasterID;
    condition.status = 1;

    if (fromMonth && toMonth)
      condition.yearmonth = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };

    if (search)
      condition[Sequelize.Op.or] = [
        {
          '$incentivetype.incentivetypename$': {
            [Sequelize.Op.iLike]: '%' + search + '%',
          },
        },
        {
          '$incentivetype.inc_type_displayName$': {
            [Op.iLike]: `%${search}%`,
          },
        },
      ];

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows: incentiveData, count: totalcount } =
      await Employeeincentive.findAndCountAll({
        raw: true,
        where: condition,
        ...paginateCondition,
        include: [
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: Incentivetype, attributes: [], required: true },
        ],
        order: [
          ['yearmonth', 'DESC'],
          ['incentiveDate', 'DESC'],
          ['employeeincentiveID', 'ASC'],
        ],
        attributes: [
          'yearmonth',
          'amount',
          [
            sequelize.col('incentivetype.incentivetypename'),
            'incentivetypename',
          ],
          [
            sequelize.col('incentivetype.inc_type_displayName'),
            'inc_type_displayName',
          ],
          'incentiveDate',
          'description',
        ],
      });

    incentiveData.map((e) => {
      e.yearmonth =
        month_dict[String(e.yearmonth).slice(4, 6)] +
        ' - ' +
        String(e.yearmonth).slice(0, 4);
    });

    return res.status(200).json({
      status: 200,
      data: incentiveData,
      totalcount: totalcount,
    });
  } catch (error) {
    next(error);
  }
};

exports.addDataofASOPalave = async (req, res, next) => {
  try {
    const startDate = '2024-08-01',
      endDate = '2024-11-23';

    const userData = await UserMaster.findAll({
      where: {
        companyMasterId: 277,
        status: 1,
      },
      include: [
        {
          separate: true,
          required: true,
          model: EmployeeFoodAllowancePolicy,
          attributes: ['foodAllowancePolicyId'],
          include: [
            {
              model: FoodAllowancePolicy,
              include: [
                {
                  required: false,
                  separate: true,
                  model: FoodAllowancePolicyDetails,
                },
              ],
            },
          ],
        },
        {
          required: false,
          model: attendanceTransaction,
          where: {
            AttendanceDate: {
              [Sequelize.Op.between]: [startDate, endDate],
            },
          },
        },
      ],
    });

    const incentiveData = [];

    for (const data of userData) {
      const EmpFoodAllowancePolicy = data.employeeFoodAllowancePolicies[0];

      const attnData = data.attendanceTransactions;

      if (!EmpFoodAllowancePolicy) continue;

      for (const att of attnData) {
        const shiftID = att.Shift,
          Attn_Status = att.fulldayhalfday;

        let teaAllowance_Amount = 0;

        // if Tea Allowance Type is ON_IN_TIME

        if (
          EmpFoodAllowancePolicy.foodAllowancePolicy.teaAllowanceType ==
            TeaAllowanceTypeEnum.ON_IN_TIME &&
          EmpFoodAllowancePolicy.foodAllowancePolicy
            .foodAllowancePolicyDetails &&
          EmpFoodAllowancePolicy.foodAllowancePolicy.foodAllowancePolicyDetails
            .length > 0
        ) {
          const teaAllowanceInDetailsData =
            EmpFoodAllowancePolicy.foodAllowancePolicy.foodAllowancePolicyDetails.find(
              (e) =>
                e.type == 'in' &&
                e.shiftID == shiftID &&
                e.allowanceType == 'tea'
            );

          if (teaAllowanceInDetailsData)
            teaAllowance_Amount = teaAllowanceInDetailsData.foodAllowanceAmount;
        }

        // if Tea Allowance Type is On Attn Status

        if (
          EmpFoodAllowancePolicy.foodAllowancePolicy.teaAllowanceType ==
          TeaAllowanceTypeEnum.ON_ATTN_STATUS
        ) {
          if (Attn_Status == 0.5)
            teaAllowance_Amount =
              +EmpFoodAllowancePolicy.foodAllowancePolicy.teaHalfDayAmount;
          if (Attn_Status == 1)
            teaAllowance_Amount =
              +EmpFoodAllowancePolicy.foodAllowancePolicy.teaFullDayAmount;
        }

        if (+teaAllowance_Amount > 0) {
          incentiveData.push({
            userMasterID: att.userMasterID,
            yearmonth:
              String(att.AttendanceDate).slice(0, 4) +
              String(att.AttendanceDate).slice(5, 7),
            amount: +teaAllowance_Amount,
            IncentivetypeID: 1920, // id for tea allowance
            incentiveDate: att.AttendanceDate,
            createBy: att.createBy,
          });
        }
      }
    }

    return res.status(200).json({
      status: 200,
      data: incentiveData,
      totalcount: incentiveData.length,
    });
  } catch (error) {
    next(error);
  }
};
