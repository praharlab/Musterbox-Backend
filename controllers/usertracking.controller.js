const Sequelize = require('sequelize');
const UserTracking = require('../models/userTracking');
const logger = require('../config/logger');
const message = require('../response_message/message');
const companyMasters = require('../models/companyMaster');
const CompanySubscriptionMaster = require('../models/subscriptionPlan');
const UserMaster = require('../models/userMaster');
const e = require('express');
const sequelize = require('../config/database');
const { accessibleUsers } = require('../utils/commonUtilFunctions');

const { asiaKolkataDateTime } = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');
/**
 * save userTracking data.
 *
 * @body {createBy} createBy user id of user who added the userTracking.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddUserTracking = async (req, res, next) => {
  try {
    let {
      userMasterID,
      companyMasterID,
      trackStatus,
      trackingTime,
      createBy,
      createByIp,
      statusMonitoring,
      notifyReportTo,
    } = await req.body;
    let userTracking = await UserTracking.findAll({
      where: {
        userMasterID: userMasterID,
        trackStatus: 1,
      },
    });

    if (userTracking.length > 0) {
      res
        .status(200)
        .json({ status: 401, message: 'User for Tracking already exists.' });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await UserTracking.create(
          {
            userMasterID,
            companyMasterID,
            trackStatus,
            trackingTime,
            createBy,
            createByIp,
            statusMonitoring,
            notifyReportTo,
          },
          { transaction: t }
        );
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.usertrackingadd,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 *
 * @body {companyMasterID, productMasterID} req to check user tracking for company
 */
exports.postCheckTracking = async (req, res, next) => {
  try {
    let { companyMasterID } = await req.body;
    let companyTree, check_tracking;

    const currCompany = await companyMasters.findOne({
      where: { companyMasterID: companyMasterID, status: 1 },
      attributes: ['companyMasterID', 'parentCompanyMasterID'],
      raw: true,
    });

    if (+currCompany.parentCompanyMasterID) {
      const allCompany = await companyMasters.findAll({
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +currCompany.parentCompanyMasterID },
            { parentCompanyMasterID: +currCompany.parentCompanyMasterID },
          ],
          status: 1,
        },
        include: {
          model: CompanySubscriptionMaster,
          required: false,
          where: { status: 1 },
        },
      });

      companyTree = allCompany.map((item) => item.companyMasterID);
      check_tracking = allCompany.find(
        (item) =>
          item.toJSON().companySubscriptions.length &&
          item.toJSON().companySubscriptions[0].companyPlanMasterID
      );
    } else {
      const allCompany = await companyMasters.findAll({
        where: {
          [Sequelize.Op.or]: [
            { companyMasterID: +companyMasterID },
            { parentCompanyMasterID: +companyMasterID },
          ],
          status: 1,
        },
        include: {
          model: CompanySubscriptionMaster,
          required: false,
          where: { status: 1 },
        },
      });

      companyTree = allCompany.map((item) => item.companyMasterID);
      check_tracking = allCompany.find(
        (item) =>
          item.toJSON().companySubscriptions.length &&
          item.toJSON().companySubscriptions[0].companyPlanMasterID
      );
    }
    check_tracking = check_tracking.toJSON().companySubscriptions[0];

    const totalcount = await UserTracking.count({
      raw: true,
      where: {
        companyMasterID: companyTree,
        trackStatus: 1,
      },
    });

    check_tracking.totalCount = totalcount;

    if (totalcount >= check_tracking.totalTracking) {
      check_tracking.exceed = true;
      res.status(200).json({
        status: 200,
        message: message.usermessage.usertrackingexceed,
        data: check_tracking,
      });
    } else {
      check_tracking.exceed = false;
      res.status(200).json({
        status: 200,
        message: message.usermessage.usertrackingallow,
        data: check_tracking,
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * find data with userTracking id
 *
 * @param {id} userTrackingID  to fetch userTracking name
 */

exports.getUserTrackingById = async (req, res, next) => {
  try {
    let get_one_data = await UserTracking.findOne({
      where: {
        userTrackingID: req.params.id,
        trackStatus: 1,
      },
      include: [
        { model: UserMaster, as: 'user' },
        { model: companyMasters, as: 'company' },
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
 * find data with userTracking id
 *
 * @param {id} userTrackingID  to fetch userTracking name
 */

exports.getUserTrackingByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.trackStatus = 1;

    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterID = companyMasterID;
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$user.displayName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$user.userNumber$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$company.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    const userTracking = await UserTracking.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: UserMaster,
          as: 'user',
          required: true,
          ...accessibleUsers(req.userDetails),
        },
        {
          model: companyMasters,
          as: 'company',
        },
      ],
    });

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < userTracking.rows.length; i++) {
        const data1 = {
          CompanyName: userTracking.rows[i].company.companyName,
          UserName: userTracking.rows[i].user.displayName,
          UserNumber: userTracking.rows[i].user.userNumber,
          TrackingTime: userTracking.rows[i].trackingTime,
          TrackStatus: userTracking.rows[i].trackStatus,
          StatusMonitoring:
            userTracking.rows[i].statusMonitoring == 0 ? 'No' : 'Yes',
          notifyReportTo:
            userTracking.rows[i].notifyReportTo == 0 ? 'No' : 'Yes',
          CreatedAt: asiaKolkataDateTime(userTracking.rows[i].createdAt) || '',
          UpdatedAt: asiaKolkataDateTime(userTracking.rows[i].updatedAt) || '',
        };
        data1.TrackStatus == 1
          ? (data1.TrackStatus = 'Active')
          : (data1.TrackStatus = 'Deactive');

        finalData.push(data1);
      }

      await generateExcel(finalData, 'TrackingEmployee', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: userTracking.rows,
      totalcount: userTracking.count,
    });
  } catch (err) {
    next(err);
  }
};
/**
 * update data
 *
 * @param {id} userTrackingID  to update id
 */
exports.postUpdateUserTracking = async (req, res, next) => {
  try {
    let {
      userTrackingID,
      userMasterID,
      companyMasterID,
      trackingTime,
      trackStatus,
      updateBy,
      updateByIp,
      statusMonitoring,
      notifyReportTo,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await UserTracking.update(
        {
          userMasterID,
          companyMasterID,
          trackingTime,
          trackStatus,
          updateBy,
          updateByIp,
          statusMonitoring,
          notifyReportTo,
        },
        {
          where: { userTrackingID: userTrackingID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.usertrackingupdate });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} userTrackingID  to update id
 */
exports.postDisableUserTracking = async (req, res, next) => {
  try {
    let { userTrackingID, trackStatus } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await UserTracking.update(
        {
          trackStatus,
        },
        {
          where: { userTrackingID: userTrackingID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.usertrackingdisabled,
      });
      return change_data_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
