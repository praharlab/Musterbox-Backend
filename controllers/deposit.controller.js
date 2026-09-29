const Deposit = require('../models/deposit');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const depositcategory = require('../models/depositCategory');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const { forEach } = require('lodash');

/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddDeposit = async (req, res, next) => {
  try {
    let {
      depositCategoryID,
      userMasterID,
      amount,
      description,
      dateOfDeposit,
      depositReceiveAs,
      salaryMonth,
      companyMasterID,
      status,
      // salaryMonthToPay,
      // depositPayAs
    } = await req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress

    // if(salaryMonth && salaryMonthToPay && (salaryMonth >= salaryMonthToPay)){
    //   return res.status(200).json({
    //     status:401,
    //     message:'Salary month to pay is always greater than to salary month received.'
    //   })

    // }

    const userIds = Array.isArray(userMasterID) ? userMasterID : [userMasterID];

    const finalData = [];

    userIds.forEach(e=>{
      finalData.push({
        depositCategoryID,
        userMasterID:e,
        amount,
        description,
        dateOfDeposit: depositReceiveAs == 'cash' ? dateOfDeposit : null,
        depositReceiveAs,
        salaryMonth: depositReceiveAs == 'salary' ? salaryMonth : null,
        companyMasterID,
        status,
        createBy,
        createByIp,
        // salaryMonthToPay: depositPayAs == 'salary' ? salaryMonthToPay : null,
        // depositPayAs
      });
    });


    await Deposit.bulkCreate(finalData);

    res.status(200).json({
      status: 200,
      message: message.usermessage.depositadd,
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with Deposit id
 *
 * @param {id} DepositID  to fetch city name
 */

exports.getDepositId = async (req, res, next) => {
  try {
    let get_one_data = await Deposit.findOne({
      where: { depositId: req.params.id, status: ['0', '1'] },
      raw: true,
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} DepositID  to update id
 */
exports.postUpdateDeposit = async (req, res, next) => {
  try {
    let {
      depositId,
      depositCategoryID,
      amount,
      description,
      dateOfDeposit,
      depositReceiveAs,
      salaryMonth,
      refundDate,
      refundRemarks,
      refundMode,
      // salaryMonthToPay,
      // depositPayAs

    } = await req.body;

    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress

    // if(salaryMonth && salaryMonthToPay && (+salaryMonth >= +salaryMonthToPay)){
    //   return res.status(200).json({
    //     status:401,
    //     message:'Salary month to pay is always greater than to salary month received.'
    //   })

    // }

  
      await Deposit.update(
        {
          depositCategoryID,
          amount,
          description,
          refundDate,
          refundRemarks,
          refundMode,
          dateOfDeposit: depositReceiveAs == 'cash' ? dateOfDeposit : null,
          depositReceiveAs,
          salaryMonth: depositReceiveAs == 'salary' ? salaryMonth : null,
          // salaryMonthToPay: depositPayAs == 'salary' ? salaryMonthToPay : null,
          // depositPayAs,
          updateBy,
          updateByIp,
        },
        {
          where: { depositId: depositId },
        }
      );

    return res
      .status(200)
      .json({ status: 200, message: message.usermessage.depositupdate });

  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} DepositID  to delete id
 */
exports.postDeleteDepositById = async (req, res, next) => {
  try {
    let { depositId } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await Deposit.update(
        {
          status: '2',
        },
        {
          where: { depositId: depositId },
          transaction: t,
        }
      );
    });

    res
      .status(200)
      .json({ status: 200, message: message.usermessage.depositdelete });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { depositId, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Deposit.update(
          {
            status: '1',
          },
          {
            where: { depositId: depositId, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await Deposit.update(
          {
            status: '0',
          },
          {
            where: { depositId: depositId, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.depositdelete,
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

exports.getDepositcompanyid = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      companyMasterID,
      userMasterID,
    } = await req.body;

    if (!companyMasterID) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });
    }

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    req.userDetails.accessibleCompanies = companyMasterID;
    condition.companyMasterID = companyMasterID;
    condition.status = [0, 1];

    if (startdate && enddate)
      condition.dateOfDeposit = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    if (userMasterID) 
    condition.userMasterID = userMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$userMaster.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$depositcategory.depositcategoryname$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const AllDeposit = await Deposit.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: depositcategory,
        },
      ],
    });

    for (let j = 0; j < AllDeposit.rows.length; j++) {
      const user1 = await UserMaster.findOne({
        where: { userMasterID: AllDeposit.rows[j].createBy },
      });
      const user2 = await UserMaster.findOne({
        where: { userMasterID: AllDeposit.rows[j].updateBy },
      });

      if (user1) AllDeposit.rows[j].createBy = user1.dataValues.displayName;
      if (user2) AllDeposit.rows[j].updateBy = user2.dataValues.displayName;
    }

    return res
      .status(200)
      .json({ status: 200, data: AllDeposit, totalcount: AllDeposit.count });
  } catch (err) {
    next(err.message);
  }
};

exports.getDepositByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await Deposit.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
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

exports.getactivedepositbycompanyid = async (req, res, next) => {
  try {
    let deposit;
    const companyid = [];

    req.userDetails.accessibleCompanies = req.params.id;

    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
    });
    for (let i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    deposit = await Deposit.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },

      include: [
        {
          model: companyMasters,
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: depositcategory,
        },
      ],
    });

    res.status(200).json({ status: 200, data: deposit });
  } catch (err) {
    next(err);
  }
};

exports.getDepositByuserid = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, startdate, enddate, userMasterID } =
      await req.body;

    const paginationQuery = {};
    const condition = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    if (userMasterID) {
      condition.userMasterID = userMasterID;
    }
    condition.status = ['0', '1'];

    if (startdate && enddate)
      condition.dateOfDeposit = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$depositcategory.depositcategoryname$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const { rows: deposit, count } = await Deposit.findAndCountAll({
      where: {
        userMasterID: userMasterID,
        [Sequelize.Op.or]: [
          {
            '$depositcategory.depositcategoryname$': {
              [Sequelize.Op.iLike]: '%' + searchQuery + '%',
            },
          },
        ],
        status: ['0', '1'],
      },
      ...paginationQuery,
      order: [['depositId', 'DESC']],
      include: [
        {
          model: companyMasters,
        },
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: depositcategory,
        },
      ],
    });
    for (let j = 0; j < deposit.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: deposit[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: deposit[j].updateBy,
        },
      });

      if (user1) {
        deposit[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        deposit[j].updateBy = user2.dataValues.displayName;
      }
    }

    return res
      .status(200)
      .json({ status: 200, data: deposit, totalcount: count });
  } catch (err) {
    next(err);
  }
};
