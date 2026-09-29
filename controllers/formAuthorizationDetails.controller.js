const Sequelize = require('sequelize');
const FormAuthorizationDetails = require('../models/formAuthorizationDetails');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const formMasters = require('../models/formMaster');
const UserMaster = require('../models/userMaster');

/**
 * save hr AuthorizationCriterialMaster data.
 *
 * @body {createBy} createBy user id of user who added the hr salary field.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddFormAuthorizationDetails = async (req, res, next) => {
  try {
    let = {
      FormMasterId,
      AuthorizedByUserMasterId,
      AuthorizationCriteriaID,
      SerialNo,
      FromAmount,
      ToAmount,
      SequenceNo,
      RequiredAuthorizationMessage,
      companyMasterID,
      createBy,
      createByIp,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      let insert_db_status = await FormAuthorizationDetails.create({
        FormMasterId,
        AuthorizedByUserMasterId,
        AuthorizationCriteriaID,
        SerialNo,
        FromAmount,
        ToAmount,
        SequenceNo,
        RequiredAuthorizationMessage,
        companyMasterID,
        createBy,
        createByIp,
      });

      res.status(200).json({
        status: 200,
        message: message.usermessage.authorizationCriteriaMasterAdd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
        return all AuthorizationCriteriaMaster data
 */

exports.getFormAuthorizationDetails = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, companyMasterID } =
      await req.body;
    let offset = (page - 1) * limit;
    let Auth_master, totalcount;
    if (searchQuery && page && limit) {
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$AuthorizationCriteriaMaster.AuthorizationCriteria$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$formMaster.formName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col(
                  'formAuthorizationDetails.AuthorizationDetailsId'
                ),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
          },
          {
            model: AuthorizationCriteriaMaster,
            as: 'AuthorizationCriteriaMaster',
            include: [{ all: true, nested: true }],
          },
          {
            model: formMasters,
            as: 'formMaster',
          },
        ],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$AuthorizationCriteriaMaster.AuthorizationCriteria$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$formMaster.formName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col(
                  'formAuthorizationDetails.AuthorizationDetailsId'
                ),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
          },
          {
            model: AuthorizationCriteriaMaster,
            as: 'AuthorizationCriteriaMaster',
            include: [{ all: true, nested: true }],
          },
          {
            model: formMasters,
            as: 'formMaster',
          },
        ],
      });
    } else if (searchQuery && page == '' && limit == '') {
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$AuthorizationCriteriaMaster.AuthorizationCriteria$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$formMaster.formName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col(
                  'formAuthorizationDetails.AuthorizationDetailsId'
                ),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
          },
          {
            model: AuthorizationCriteriaMaster,
            as: 'AuthorizationCriteriaMaster',
            include: [{ all: true, nested: true }],
          },
          {
            model: formMasters,
            as: 'formMaster',
          },
        ],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          [Sequelize.Op.or]: [
            {
              '$companyMaster.companyName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$AuthorizationCriteriaMaster.AuthorizationCriteria$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            {
              '$formMaster.formName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col(
                  'formAuthorizationDetails.AuthorizationDetailsId'
                ),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [
          {
            model: companyMasters,
            as: 'companyMaster',
          },
          {
            model: AuthorizationCriteriaMaster,
            as: 'AuthorizationCriteriaMaster',
            include: [{ all: true, nested: true }],
          },
          {
            model: formMasters,
            as: 'formMaster',
          },
        ],
      });
    } else if (startdate && enddate && page && limit) {
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (startdate && enddate && page == '' && limit == '') {
      console.log(new Date(startdate), new Date(enddate));
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          createdAt: {
            [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
          },
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
    } else if (page == '' && limit == '') {
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: 1,
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: 1,
        },
        include: [{ all: true, nested: true }],
      });
    } else {
      Auth_master = await FormAuthorizationDetails.findAll({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        order: [['AuthorizationDetailsId', 'ASC']],
        limit: limit,
        offset: offset,
        include: [{ all: true, nested: true }],
      });
      for (var j = 0; j < Auth_master.length; j++) {
        let user1 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].createBy,
          },
        });
        let user2 = await UserMaster.findOne({
          where: {
            userMasterID: Auth_master[j].updateBy,
          },
        });

        if (user1) {
          Auth_master[j].createBy = user1.dataValues.displayName;
        }
        if (user2) {
          Auth_master[j].updateBy = user2.dataValues.displayName;
        }
      }
      totalcount = await FormAuthorizationDetails.count({
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        include: [{ all: true, nested: true }],
      });
    }

    res
      .status(200)
      .json({ status: 200, data: Auth_master, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with bankMaster id
 *
 * @param {id} AuthorizationCriteriaID  to fetch bank name
 */

exports.getFormAuthorizationDetailsById = async (req, res, next) => {
  try {
    let get_one_data = await FormAuthorizationDetails.findOne({
      where: {
        AuthorizationDetailsId: req.params.id,
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
 * @param {id} AuthorizationCriteriaID  to update id
 */
exports.postUpdateFormAuthorizationDetails = async (req, res, next) => {
  try {
    let {
      AuthorizationDetailsId,
      FormMasterId,
      AuthorizedByUserMasterId,
      AuthorizationCriteriaID,
      SerialNo,
      FromAmount,
      ToAmount,
      SequenceNo,
      RequiredAuthorizationMessage,
      companyMasterID,
      updateBy,
      updateByIp,
    } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await FormAuthorizationDetails.update(
        {
          FormMasterId,
          AuthorizedByUserMasterId,
          AuthorizationCriteriaID,
          SerialNo,
          FromAmount,
          ToAmount,
          SequenceNo,
          RequiredAuthorizationMessage,
          companyMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.authorizationCriteriaMasterUpdate,
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
 * @param {id} FormAuthorizationID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { AuthorizationDetailsId, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await FormAuthorizationDetails.update(
          {
            status: '1',
          },
          {
            where: {
              AuthorizationDetailsId: AuthorizationDetailsId,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await FormAuthorizationDetails.update(
          {
            status: '0',
          },
          {
            where: {
              AuthorizationDetailsId: AuthorizationDetailsId,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.authorizationCriteriaMasterDelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.authorizationCriteriaMasterDelete,
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
 * @param {id} AuthorizationCriteriaID  to delete id
 */
exports.postDeleteFormAuthorizationDetailsById = async (req, res, next) => {
  try {
    let { AuthorizationDetailsId } = await req.body;
    // let delete_db_status = await BankMaster.destroy({
    //     where: {
    //         bankMasterID: bankMasterID
    //     }
    // });
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await FormAuthorizationDetails.update(
        {
          status: 2,
        },
        {
          where: { AuthorizationDetailsId: AuthorizationDetailsId },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.authorizationCriteriaMasterDelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getFormAuthorizationDetailsByUserId = async (req, res, next) => {
  try {
    let get_one_data = await FormAuthorizationDetails.findAll({
      where: {
        AuthorizedByUserMasterId: { [Sequelize.Op.contains]: [req.params.id] },
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
