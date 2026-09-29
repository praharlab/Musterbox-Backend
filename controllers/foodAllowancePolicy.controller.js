const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');
const { generateExcel } = require('../utils/exportData');
const message = require('../response_message/message');
const FoodAllowancePolicy = require('../models/foodAllowancePolicy');
const EmployeeFoodAllowancePolicy = require('../models/employeeFoodAllowancePolicy');
const FoodAllowancePolicyDetails = require('../models/foodAllowancePolicyDetails');
const UserMaster = require('../models/userMaster');
const attendanceTransaction = require('../models/attendanceTransaction');
const Employeeincentive = require('../models/employeeincentive');
const { userAttributes } = require('../utils/commonVars');

exports.listData = async (req, res, next) => {
  try {
    const { page, limit, companyMasterID, searchQuery, Export } = req.query;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          foodAllowancePolicyName: { [Sequelize.Op.iLike]: `%${searchQuery}%` },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];

    const paginationQuery = {};
    if (!Export) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const data = await FoodAllowancePolicy.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [{ model: companyMaster, attributes: ['companyName'] },
    {model: UserMaster,as: 'createdByUserDetails',attributes: userAttributes},
    {model: UserMaster,as: 'updatedByUserDetails',attributes: userAttributes},

    ],
      order: [['foodAllowancePolicyName', 'ASC']],
    });

    if (Export == 'true') {
      const finaldata = data.rows.map((e) => {
        return {
          'Company Name': e['companyMaster.companyName'],
          Status: e.status == 0 ? 'Deactive' : 'Active',
          'Food Allowance Policy Name': e.foodAllowancePolicyName,
          'Food Allowance Type': e.foodAllowanceType,
          'Food Allowance OnBasis Of InTime': e.foodAllowanceOnBasisOfInTime,
          'Day Shift InTime': e.dayShiftInTime,
          'Night Shift InTime': e.nightShiftInTime,
          'Shift InTime Amount': e.shiftInTimeAmount,
          'Food Allowance OnBasis Of OutTime': e.foodAllowanceOnBasisOfOutTime,
          'Day Shift OutTime': e.dayShiftOutTime,
          'Night Shift OutTime': e.nightShiftOutTime,
          'Shift OutTime Amount': e.shiftOutTimeAmount,
          'Minimun Working Minutes': e.minimumWorkingMinutes,
          'Working Time Amount': e.workingTimeAmount,
        };
      });

      return await generateExcel(finaldata, 'FoodAllowancePolicy', 'xlsx', res);
    }

    return res.status(200).json({
      status: 200,
      data: data.rows,
      totalcount: data.count,
    });
  } catch (error) {
    next(error);
  }
};

exports.addData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      companyMasterID,
      foodAllowancePolicyName,
      foodAllowanceType,
      foodAllowanceOnBasisOfInTime,
      foodAllowanceOnBasisOfOutTime,
      foodAllowanceCompleteHours,
      foodAllowanceOnBasisOfInOutDetails,
      minimumWorkingMinutes,
      workingTimeAmount,
      teaAllowanceType,
      teaHalfDayAmount,
      teaFullDayAmount,
    } = req.body;

    const findFoodAllowancePolicy = await FoodAllowancePolicy.findOne({
      where: [
        sequelize.where(
          sequelize.fn(
            'TRIM',
            sequelize.fn('LOWER', sequelize.col('foodAllowancePolicyName'))
          ),
          foodAllowancePolicyName.trim().toLowerCase()
        ),
        { companyMasterID: companyMasterID },
        { status: [0, 1] },
      ],
    });

    if (findFoodAllowancePolicy) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Food Allowance Policy'),
      });
    }

    const foodAllowancePolicyData = await FoodAllowancePolicy.create(
      {
        companyMasterID,
        foodAllowancePolicyName,
        foodAllowanceType,
        foodAllowanceOnBasisOfInTime,
        foodAllowanceOnBasisOfOutTime,
        foodAllowanceCompleteHours,
        minimumWorkingMinutes,
        workingTimeAmount,
        teaAllowanceType,
        teaHalfDayAmount,
        teaFullDayAmount,
      },
      { user: req.userDetails, transaction }
    );

    foodAllowanceOnBasisOfInOutDetails.forEach(async (e) => {
      e['foodAllowancePolicyId'] = foodAllowancePolicyData.id;
    });

    await FoodAllowancePolicyDetails.bulkCreate(
      foodAllowanceOnBasisOfInOutDetails,
      {
        user: req.userDetails,
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Food Allowance Policy'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      foodAllowancePolicyName,
      foodAllowanceType,
      foodAllowanceOnBasisOfInTime,
      foodAllowanceOnBasisOfOutTime,
      foodAllowanceCompleteHours,
      foodAllowanceOnBasisOfInOutDetails,
      minimumWorkingMinutes,
      workingTimeAmount,
      teaAllowanceType,
      teaHalfDayAmount,
      teaFullDayAmount,
    } = req.body;

    const foodAllowancePolicyId = req.params.id;
    const findData = await FoodAllowancePolicy.findByPk(foodAllowancePolicyId);

    const findFoodAllowancePolicyWithSameName =
      await FoodAllowancePolicy.findOne({
        where: {
          [Sequelize.Op.and]: [
            sequelize.where(
              sequelize.fn(
                'TRIM',
                sequelize.fn('LOWER', sequelize.col('foodAllowancePolicyName'))
              ),
              foodAllowancePolicyName.trim().toLowerCase()
            ),
            { companyMasterID: findData.companyMasterID },
            { status: [0, 1] },
            { id: { [Sequelize.Op.ne]: findData.id } },
          ],
        },
      });

    if (findFoodAllowancePolicyWithSameName) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Food Allowance Policy'),
      });
    }
    findData.foodAllowancePolicyName = foodAllowancePolicyName;
    findData.foodAllowanceType = foodAllowanceType;
    findData.foodAllowanceOnBasisOfInTime = foodAllowanceOnBasisOfInTime;
    findData.foodAllowanceOnBasisOfOutTime = foodAllowanceOnBasisOfOutTime;
    findData.foodAllowanceCompleteHours = foodAllowanceCompleteHours;
    findData.minimumWorkingMinutes = minimumWorkingMinutes;
    findData.workingTimeAmount = workingTimeAmount;
    findData.teaAllowanceType = teaAllowanceType;
    findData.teaHalfDayAmount = teaHalfDayAmount;
    findData.teaFullDayAmount = teaFullDayAmount;

    await findData.save({
      user: req.userDetails,
      transaction,
    });

    for (const foodAllowanceOnBasisOfinOutItem of foodAllowanceOnBasisOfInOutDetails) {
      //delete foodAllowanceOnBasisOfinOutItem
      if (
        foodAllowanceOnBasisOfinOutItem.id &&
        foodAllowanceOnBasisOfinOutItem.delete
      ) {
        const foodAllowanceOnBasisOfinOutItemExists =
          await FoodAllowancePolicyDetails.findByPk(
            foodAllowanceOnBasisOfinOutItem.id
          );
        await foodAllowanceOnBasisOfinOutItemExists.destroy({
          transaction,
          user: req.userDetails,
        });
      }
      //update foodAllowanceOnBasisOfinOutItem
      else if (foodAllowanceOnBasisOfinOutItem.id) {
        const foodAllowanceOnBasisOfinOutItemExists =
          await FoodAllowancePolicyDetails.findByPk(
            foodAllowanceOnBasisOfinOutItem.id
          );

        foodAllowanceOnBasisOfinOutItemExists.shiftID =
          foodAllowanceOnBasisOfinOutItem.shiftID;
        foodAllowanceOnBasisOfinOutItemExists.foodAllowanceType =
          foodAllowanceOnBasisOfinOutItem.foodAllowanceType;
        foodAllowanceOnBasisOfinOutItemExists.foodAllowanceTime =
          foodAllowanceOnBasisOfinOutItem.foodAllowanceTime;
        foodAllowanceOnBasisOfinOutItemExists.foodAllowanceAmount =
          foodAllowanceOnBasisOfinOutItem.foodAllowanceAmount;

        await foodAllowanceOnBasisOfinOutItemExists.save({
          transaction,
          user: req.userDetails,
        });
      }
      //add foodAllowanceOnBasisOfinOutItem
      else {
        await FoodAllowancePolicyDetails.create(
          { ...foodAllowanceOnBasisOfinOutItem, foodAllowancePolicyId },
          { user: req.userDetails, transaction }
        );
      }
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Food Allowance Policy'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.deleteData = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findEmployeeFoodAllowancePolicy =
      await EmployeeFoodAllowancePolicy.findOne({
        where: {
          foodAllowancePolicyId: id,
        },
      });

    if (findEmployeeFoodAllowancePolicy)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.FoodAllowancePolicyInUse,
      });

    const findData = await FoodAllowancePolicy.findByPk(id);

    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Food Allowance Policy'),
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await FoodAllowancePolicy.findByPk(id, {
      include: [
        { model: companyMaster, attributes: ['companyName'] },
        {
          model: FoodAllowancePolicyDetails,
          attributes: [
            'id',
            'foodAllowanceType',
            'foodAllowanceTime',
            'foodAllowanceAmount',
            'shiftID',
            'allowanceType',
          ],
        },
      ],
    });

    return res.status(200).json({
      status: 200,

      data: findData,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id, status } = req.body;

    if (status != 0 && status != 1)
      return res.status(200).json({
        status: 401,
        message: 'status is not valid!',
      });

    const findEmployeeFoodAllowancePolicy =
      await EmployeeFoodAllowancePolicy.findOne({
        where: {
          foodAllowancePolicyId: id,
        },
      });

    if (findEmployeeFoodAllowancePolicy && status == 0) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.FoodAllowancePolicyInUseStatus,
      });
    }

    const findData = await FoodAllowancePolicy.findByPk(id);

    findData.status = status;

    await findData.save({
      user: req.userDetails,
    });

    const message1 =
      status == 1
        ? message.usermessage.activeMessage('Food Allowance Policy')
        : message.usermessage.deactiveMessage('Food Allowance Policy');

    return res.status(200).json({
      status: 200,
      message: message1,
    });
  } catch (error) {
    next(error);
  }
};

exports.addFoodAllow = async (req, res, next) => {
  try {
    const attData = await attendanceTransaction.findAll({
      where: {
        AttendanceDate: {
          [Sequelize.Op.between]: ['2024-06-01', '2024-06-30'],
        },
      },
      include: [
        {
          required: true,
          model: UserMaster,
          where: { companyMasterId: 277 },
          attributes: [],
          include: [
            {
              required: true,
              model: EmployeeFoodAllowancePolicy,
              attributes: [],
            },
          ],
        },
      ],
    });

    const finalData = [];

    for (const att of attData) {
      if (
        new Date(att.InDatetime) >=
        new Date(att.AttendanceDate + ' ' + '09:36:00')
      )
        continue;

      const incentive = await Employeeincentive.findOne({
        where: {
          userMasterID: att.userMasterID,
          IncentivetypeID: 155,
          incentiveDate: att.AttendanceDate,
        },
      });

      if (incentive) continue;

      finalData.push({
        userMasterID: att.userMasterID,
        IncentivetypeID: 155,
        incentiveDate: att.AttendanceDate,
        yearmonth: 202406,
        amount: 80,
        createBy: 11932,
      });
    }

    await sequelize.transaction(async (t) => {
      await Employeeincentive.bulkCreate(finalData, { transaction: t });
    });

    return res.status(200).json({
      status: 200,
      data: finalData,
      message: 'Data Added successfully.',
    });
  } catch (error) {
    next(error);
  }
};
