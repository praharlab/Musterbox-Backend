const Sequelize = require('sequelize');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');

/**
 * save hr AuthorizationCriterialMaster data.
 *
 * @body {createBy} createBy user id of user who added the hr salary field.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

exports.postAddAuthorizationCriteriaMaster = async (req, res, next) => {
  try {
    let = { AuthorizationCriteria, createBy, createByIp } = await req.body;

    await sequelize.transaction(async (t) => {
      let insert_db_status = await AuthorizationCriteriaMaster.create({
        AuthorizationCriteria,
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

exports.getAuthorizationCriteriaMaster = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let Auth_master = [],
      totalcount;
    if (searchQuery) {
      Auth_master = await AuthorizationCriteriaMaster.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              AuthorizationCriteriaMaster: {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            sequelize.where(
              sequelize.cast(
                sequelize.col(
                  'AuthorizationCriteriaMaster.AuthorizationCriteriaID'
                ),
                'varchar'
              ),
              { [Sequelize.Op.iLike]: `%${searchQuery}%` }
            ),
          ],
          status: ['0', '1'],
        },
      });
      totalcount = Auth_master.length;
    } else if (limit == '' && page == '') {
      Auth_master = await AuthorizationCriteriaMaster.findAll({
        raw: true,
        order: [['AuthorizationCriteria', 'ASC']],
        where: {
          status: 1,
        },
      });
      totalcount = await AuthorizationCriteriaMaster.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      Auth_master = await AuthorizationCriteriaMaster.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
        order: [['AuthorizationCriteria', 'ASC']],
      });
      totalcount = await AuthorizationCriteriaMaster.count({
        raw: true,
        where: { status: ['0', '1'] },
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

exports.getAuthorizationCriteriaMasterById = async (req, res, next) => {
  try {
    let get_one_data = await AuthorizationCriteriaMaster.findOne({
      where: {
        AuthorizationCriteriaID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
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

/**
 * update data
 *
 * @param {id} AuthorizationCriteriaID  to update id
 */
exports.postUpdateAuthorizationCriteriaMaster = async (req, res, next) => {
  try {
    let {
      AuthorizationCriteriaID,
      AuthorizationCriteria,
      updateBy,
      updateByIp,
    } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await AuthorizationCriteriaMaster.update(
        {
          AuthorizationCriteria,
          updateBy,
          updateByIp,
        },
        {
          where: { AuthorizationCriteriaID: AuthorizationCriteriaID },
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
 * @param {id} AuthorizationCriteriaID  to update status of bank
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { AuthorizationCriteriaID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await AuthorizationCriteriaMaster.update(
          {
            status: '1',
          },
          {
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await AuthorizationCriteriaMaster.update(
          {
            status: '0',
          },
          {
            where: {
              AuthorizationCriteriaID: AuthorizationCriteriaID,
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
exports.postDeleteBankById = async (req, res, next) => {
  try {
    let { AuthorizationCriteriaID } = await req.body;
    // let delete_db_status = await BankMaster.destroy({
    //     where: {
    //         bankMasterID: bankMasterID
    //     }
    // });
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await AuthorizationCriteriaMaster.update(
        {
          status: 2,
        },
        {
          where: { AuthorizationCriteriaID: AuthorizationCriteriaID },
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
