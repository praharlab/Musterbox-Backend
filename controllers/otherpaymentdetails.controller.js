const Sequelize = require('sequelize');
const otherPaymentDetails = require('../models/otherpaymentdetails');
const logger = require('../config/logger');
const UserMaster = require('../models/userMaster');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMaster = require('../models/companyMaster');

exports.postAddOtherPaymentdata = async (req, res, next) => {
  try {
    let {
      userMasterID,
      companyMasterID,
      salaryFieldID,
      YearMM,
      Amount,
      Details,
      createBy,
      createByIp,
    } = await req.body;
    let insert_data = await otherPaymentDetails.create({
      userMasterID,
      companyMasterID,
      salaryFieldID,
      YearMM,
      Amount,
      Details,
      createBy,
      createByIp,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.otherpaymentadd,
      data: insert_data,
    });
  } catch (err) {
    next(err);
  }
};
//**
// Get all data
// */
exports.getallotherPaymentdata = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let otherPayment, totalcount;
    if (searchQuery && page && limit) {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
                include: [{ all: true, nested: false }],
              },
            ],
          },
        ],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
                include: [{ all: true, nested: false }],
              },
            ],
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
      });
    } else if (page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          status: ['0', '1'],
        },
      });
    } else {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          status: 1,
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: false }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          status: ['0', '1'],
        },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: otherPayment, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

//**
// Get otherPayment By CompanyID
// */

exports.getOtherPaymentByCompanyid = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;
    let offset = (page - 1) * limit;
    let otherPayment, totalcount;
    if (searchQuery && page && limit) {
      rPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
        ],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
          },
          {
            model: companyMaster,
            as: 'companyMaster',
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$userMaster.displayName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('otherPayment.otherPaymentDetailsID'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [
          {
            model: UserMaster,
            as: 'userMaster',
            include: [
              {
                model: companyMaster,
                as: 'companyMaster',
              },
            ],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
    } else if (page == '' && limit == '') {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        include: [{ all: true, nested: false }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
      });
    } else {
      otherPayment = await otherPaymentDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        order: [['otherPaymentDetailsID', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < otherPayment.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: otherPayment[j].updateBy,
          },
        });

        if (user1) {
          otherPayment[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          otherPayment[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await otherPaymentDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: otherPayment, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with OtherPayment
 *
 */
exports.getotherPaymentById = async (req, res, next) => {
  try {
    let get_data_byid = await otherPaymentDetails.findOne({
      where: {
        otherPaymentDetailsID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!get_data_byid)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_data_byid });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Data
 */
exports.postUpdateOtherpayment = async (req, res, next) => {
  try {
    let {
      otherPaymentDetailsID,
      userMasterID,
      companyMasterID,
      salaryFieldID,
      YearMM,
      Amount,
      Details,
      updateBy,
      updateByIp,
    } = await req.body;

    let update_data = await sequelize.transaction(async (t) => {
      let change_data = await otherPaymentDetails.update(
        {
          userMasterID,
          companyMasterID,
          salaryFieldID,
          YearMM,
          Amount,
          Details,
          updateBy,
          updateByIp,
        },
        {
          where: { otherPaymentDetailsID: otherPaymentDetailsID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.otherpaymentupdate });
      return change_data;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by otherPaymentID
 */
exports.postDeleteOtherPaymentById = async (req, res, next) => {
  try {
    let otherPaymentDetailsID = req.params.id;
    let totalOtherPayment = await otherPaymentDetails.findOne({
      where: {
        otherPaymentDetailsID: otherPaymentDetailsID,
        status: ['0', '1'],
      },
    });
    if (totalOtherPayment.tablereferenceID != null) {
      res.status(200).json({
        status: 401,
        message:
          "You can't delete this OtherPaymentDetails because it's Payment are paid !!",
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await otherPaymentDetails.update(
          {
            status: 2,
          },
          {
            where: { otherPaymentDetailsID: otherPaymentDetailsID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.otherpaymentdelete,
        });
        return delete_status;
      });
    }
  } catch (err) {
    next(err);
  }
};
