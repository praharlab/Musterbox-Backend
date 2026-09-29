const Sequelize = require('sequelize');
const subscriptionPlan = require('../models/subscriptionPlan');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const FormMaster = require('../models/formMaster');
const RoleMaster = require('../models/roleMaster');
const RolePermission = require('../models/rolePermission');
const ProductPermission = require('../models/productPermission');
const companyMaster = require('../models/companyMaster');
const UserRole = require('../models/userRole');

const {
  checkSubscriptionPlanExpiration,
  add_WeekOffHoliday_With_Transaction,
} = require('../utils/commonUtilFunctions');
const { Where } = require('sequelize/lib/utils');
const ProductMaster = require('../models/productMaster');

/**
 * save product data.
 *
 * @body {createBy} createBy user id of user who added the product.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddSubscription = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      companyMasterID,
      productMasterID,
      startDate,
      endDate,
      totalUser,
      totalTracking,
      status,
    } = await req.body;

    let PlanChange = false;
    const getActivePlan = await subscriptionPlan.findOne({
      where: {
        companyMasterID: companyMasterID,
        status: 1,
      },
      attributes: ['productMasterID'],
    });

    if (!getActivePlan || getActivePlan.productMasterID != productMasterID) {
      PlanChange = true;
    }

    await subscriptionPlan.update(
      {
        status: 0,
      },
      {
        where: { companyMasterID: companyMasterID, status: 1 },
      },
      { transaction }
    );

    await subscriptionPlan.create(
      {
        companyMasterID,
        productMasterID,
        startDate,
        endDate,
        totalUser,
        totalTracking,
        status,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { transaction }
    );

    if (PlanChange) {
      const get_one_data = await companyMaster.findAll({
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +companyMasterID },
            { parentCompanyMasterID: +companyMasterID },
          ],
          status: [0, 1],
        },
      });

      const companyMasterIDs = get_one_data.map((e) => e.companyMasterID);

      const roleMasterData = await RoleMaster.findAll({
        raw: true,
        where: {
          companyMasterID: companyMasterIDs,
        },
      });

      const roleIds = roleMasterData.map((e) => e.roleMasterID);

      await RolePermission.destroy(
        {
          where: {
            roleMasterID: {
              [Sequelize.Op.in]: roleIds,
            },
          },
          hooks: true, // Ensure hooks are triggered
          individualHooks: true, // Ensure individual hooks are triggered
          user: req.userDetails,
        },
        {
          transaction,
        }
      );

      await UserRole.destroy(
        {
          where: {
            roleMasterID: {
              [Sequelize.Op.in]: roleIds,
            },
          },
          hooks: true, // Ensure hooks are triggered
          individualHooks: true, // Ensure individual hooks are triggered
          user: req.userDetails,
        },
        {
          transaction,
        }
      );

      await RoleMaster.destroy(
        {
          where: {
            roleMasterID: {
              [Sequelize.Op.in]: roleIds,
            },
          },
          hooks: true, // Ensure hooks are triggered
          individualHooks: true, // Ensure individual hooks are triggered
          user: req.userDetails,
        },
        {
          transaction,
        }
      );

      //Add 2 by-default roles for company -Admin -Employee

      const totalPermission = await ProductPermission.findAll({
        raw: true,
        where: {
          productMasterID: productMasterID,
          status: 1,
        },
        group: ['formMasterID'],
        attributes: ['formMasterID'],
      });
      const totalPermissionID = totalPermission.map((e) => e.formMasterID);

      const adminroleForms = await FormMaster.findAll({
        where: {
          status: 1,
          formMasterID: totalPermissionID,
        },
      });
      const employeeRoleForms = adminroleForms.filter(
        (e) => e.defaultRight == true
      );
      const ProductPermissionOperation = await ProductPermission.findAll({
        raw: true,
        where: {
          productMasterID: productMasterID,
          status: 1,
        },
      });
      for (let companyMasterID of companyMasterIDs) {
        //Admin
        let allRights = [];
        const insertAdminRole = await RoleMaster.create(
          {
            roleName: 'Admin',
            roleType: 'companyWise',
            companyAccessType: 'ownPlusChildCompany',
            companyMasterID: companyMasterID,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          },
          { user: req.userDetails, transaction }
        );

        for (let i = 0; i < adminroleForms.length; i++) {
          const totaloperation = ProductPermissionOperation.filter(
            (e) => e.formMasterID == adminroleForms[i].formMasterID
          );
          await ProductPermission.findAll({
            raw: true,
            where: {
              productMasterID: productMasterID,
              formMasterID: adminroleForms[i].formMasterID,
              status: 1,
            },
          });

          for (let j = 0; j < totaloperation.length; j++) {
            let givenright = {
              roleMasterID: insertAdminRole.roleMasterID,
              formMasterID: adminroleForms[i].formMasterID,
              operationID: totaloperation[j].operationID,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            };
            allRights.push(givenright);
          }
        }

        //Employee
        const insertEmployeeRole = await RoleMaster.create(
          {
            roleName: 'Employee',
            roleType: 'companyWise',
            companyAccessType: 'ownPlusChildCompany',
            companyMasterID: companyMasterID,
            createBy: req.userDetails.userMasterId,
            createByIp: req.userDetails.userIpAddress,
          },
          { user: req.userDetails, transaction }
        );

        for (let i = 0; i < employeeRoleForms.length; i++) {
          const totaloperation = ProductPermissionOperation.filter(
            (e) => e.formMasterID == employeeRoleForms[i].formMasterID
          );

          for (let j = 0; j < totaloperation.length; j++) {
            let givenright = {
              roleMasterID: insertEmployeeRole.roleMasterID,
              formMasterID: employeeRoleForms[i].formMasterID,
              operationID: totaloperation[j].operationID,
              createBy: req.userDetails.userMasterId,
              createByIp: req.userDetails.userIpAddress,
            };
            allRights.push(givenright);
          }
        }

        await RolePermission.bulkCreate(allRights, {
          user: req.userDetails,
          transaction,
        });
      }
    }

    await add_WeekOffHoliday_With_Transaction(
      companyMasterID,
      [],
      startDate,
      null,
      null,
      null,
      null,
      transaction
    );
    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Subscription Plan'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 return all product data
 */

exports.getAllSubscriptionData = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;

    const paginationQuery = {};
    const condition = {
      status: {
        [Sequelize.Op.in]: [0, 1],
      },
      companyMasterID: companyMasterID,
    };
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const { rows, count } = await subscriptionPlan.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['companyPlanMasterID', 'ASC']],
      include: [
        {
          model: ProductMaster,
        },
        {
          model: companyMaster,
        },
      ],
    });

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.getSubscriptionById = async (req, res, next) => {
  try {
    const get_one_data = await subscriptionPlan.findOne({
      where: {
        companyPlanMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateSubscription = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      companyPlanMasterID,
      companyMasterID,
      productMasterID,
      startDate,
      endDate,
      totalUser,
      totalTracking,
      status,
      updateBy,
      updateByIp,
    } = await req.body;
    await subscriptionPlan.update(
      {
        companyMasterID,
        productMasterID,
        startDate,
        endDate,
        totalUser,
        totalTracking,
        status,
        updateBy,
        updateByIp,
      },
      {
        where: { companyPlanMasterID: companyPlanMasterID },
      },
      {
        transaction,
      }
    );

    let get_one_data = await subscriptionPlan.findOne({
      raw: true,
      where: {
        companyPlanMasterID: companyPlanMasterID,
      },
      transaction,
    });
    await add_WeekOffHoliday_With_Transaction(
      get_one_data.companyMasterID,
      [],
      startDate,
      null,
      null,
      null,
      null,
      transaction
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Subscription Plan'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} companyPlanMasterID  to delete id
 */
exports.postDeleteSubscriptionById = async (req, res, next) => {
  try {
    let { companyPlanMasterID } = await req.body;
    await subscriptionPlan.update(
      {
        status: 2,
      },
      {
        where: { companyPlanMasterID: companyPlanMasterID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Subscription Plan'),
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { companyPlanMasterID, status } = await req.body;
    await subscriptionPlan.update(
      {
        status: status,
      },
      {
        where: {
          companyPlanMasterID: companyPlanMasterID,
          status: ['1', '0'],
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Subscription Plan')
          : message.usermessage.deactiveMessage('Subscription Plan'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getSubscriptionPlanExpiration = async (req, res, next) => {
  try {
    const companyMasterId =
      +req.userDetails.parentCompanyMasterId == 0
        ? +req.userDetails.companyMasterId
        : +req.userDetails.parentCompanyMasterId;

    if (!companyMasterId) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage('companyMasterId'),
      });
    }
    const get_one_data = await checkSubscriptionPlanExpiration(companyMasterId);

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.AssignWeekOffHoliday = async (req, res, next) => {
  try {
    const allParentCompany = await companyMaster.findAll({
      raw: true,
      where: { parentCompanyMasterID: 0, status: 1 },
    });
    return res.status(200).json({
      status: 200,
      message: 'Weekoff Holiday assigned to all Successfully',
      data: allParentCompany,
    });
  } catch (err) {
    next(err);
  }
};

exports.getActiveSubscription = async (req, res, next) => {
  try {
    const { companyMasterID } = await req.body;

    const getDataActive = await companyMaster.findOne({
      where: {
        [Sequelize.Op.or]: [{ companyMasterID }],
      },
      attributes: ['companyName', 'parentCompanyMasterID'],
    });

    const company =
      getDataActive.parentCompanyMasterID == 0
        ? companyMasterID
        : getDataActive.parentCompanyMasterID;

    const subscriptionPlans = await subscriptionPlan.findOne({
      where: {
        companyMasterID: company,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
      ],
    });

    return res.status(200).json({ status: 200, data: subscriptionPlans });
  } catch (err) {
    next(err);
  }
};
