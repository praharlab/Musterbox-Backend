const Employeement = require('../models/employeement');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');

exports.postAddEmployeement = async (req, res, next) => {
  try {
    let { type, typePeriod, companyMasterID, createBy, createByIp } =
      await req.body;

    if (req.body.typePeriod == '') {
      let insert_db_status = await Employeement.create({
        type,
        typePeriod: 0,
        companyMasterID,
        status: 1,
        createBy,
        createByIp,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementadd,
        data: {},
      });
      return insert_db_status;
    } else {
      let insert_db_status = await Employeement.create({
        type,
        typePeriod,
        companyMasterID,
        status: 1,
        createBy,
        createByIp,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.employeementadd,
        data: {},
      });
      return insert_db_status;
    }
  } catch (err) {
    next(err.message);
  }
};

exports.getAllEmployeement = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate } = await req.body;
    let offset = (page - 1) * limit;
    let employeement, totalcount;
    if (searchQuery && page && limit) {
      employeement = await Employeement.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employyeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employyeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      employeement = await Employeement.findAll({
        where: {
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employyeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          [Sequelize.Op.or]: [
            { type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employyeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      employeement = await Employeement.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      employeement = await Employeement.findAll({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (page == '' && limit == '') {
      employeement = await Employeement.findAll({
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        include: [{ all: true, nested: true }],
      });
    } else {
      employeement = await Employeement.findAll({
        limit: limit,
        offset: offset,
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        include: [{ all: true, nested: true }],
      });
    }

    res
      .status(200)
      .json({ status: 200, data: employeement, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeementId = async (req, res, next) => {
  try {
    let get_one_data = await Employeement.findOne({
      where: { employeementId: req.params.id },
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

exports.getEmployeementcompanyid = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;
    let offset = (page - 1) * limit;
    let employeement, totalcount;
    if (searchQuery && page && limit) {
      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          [Sequelize.Op.or]: [
            {
              type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },
            },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
      for (let j = 0; j < department.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          [Sequelize.Op.or]: [
            { type: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col('employeement.employeementId'),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
        },
        order: [['employeementId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
            include: [{ all: true, nested: true }],
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      console.log(new Date(startdate), new Date(enddate));

      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
        },
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (page == '' && limit == '') {
      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
        },
        status: 1,
        order: [['employeementId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      employeement = await Employeement.findAll({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        order: [['employeementId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (let j = 0; j < employeement.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: employeement[j].updateBy,
          },
        });

        if (user1) {
          employeement[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          employeement[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await Employeement.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });
    }

    return res
      .status(200)
      .json({ status: 200, data: employeement, totalcount: totalcount });
  } catch (err) {
    next(err.message);
  }
};

exports.postUpdateEmployeement = async (req, res, next) => {
  try {
    let {
      employeementId,
      type,
      typePeriod,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await Employeement.update(
        {
          employeementId,
          type,
          typePeriod,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { employeementId: employeementId },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.employeementupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getEmployeementByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await Employeement.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
    });

    if (!get_one_data) res.status(200).json({ status: 200 });
    res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteEmployeementById = async (req, res, next) => {
  try {
    let { employeementId } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await Employeement.update(
        {
          status: '2',
        },
        {
          where: { employeementId: employeementId },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.employeementdelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
