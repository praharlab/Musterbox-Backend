const GatePass = require('../models/gatePass');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const Visitor = require('../models/visitors');
const meetingPlace = require('../models/meetingPlace');
const { executeQuery } = require('./common.controller');
const Notification = require('../config/firebase');
const { sendNotification } = require('../utils/commonUtilFunctions');

const { generateExcel, generateExcelGatePass } = require('../utils/exportData');
const { Op } = require('sequelize');

const UserInbox = require('../models/UserInbox');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const RolePermission = require('../models/rolePermission');
const RoleMaster = require('../models/roleMaster');
const UserRole = require('../models/userRole');

const notification_options = {
  priority: 'high',
  timeToLive: 60 * 60 * 24,
};

function formatDate(inputDate) {
  const date = new Date(inputDate);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });

  let daySuffix;
  if (day === 1 || day === 21 || day === 31) {
    daySuffix = 'st';
  } else if (day === 2 || day === 22) {
    daySuffix = 'nd';
  } else if (day === 3 || day === 23) {
    daySuffix = 'rd';
  } else {
    daySuffix = 'th';
  }

  return `${day}${daySuffix} ${month}`;
}

/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddgatePass = async (req, res, next) => {
  try {
    let {
      visitorsid,
      userMasterID,
      date,
      inTime,
      outTime,
      fromTime,
      toTime,
      meetingPlaceID,
      remarks,
      companyMasterID,
      attachment,
      noofperson,
      vehicleNo,
      visitortype,
      status,
      createBy,
      createByIp,
      personName,
      personNumber,
    } = await req.body;

    noofperson = noofperson == '' || noofperson == null ? 1 : noofperson;

    if (fromTime && toTime) {
      if (fromTime >= toTime) {
        let msg = 'From time is greater than To time';
        res.status(200).json({ status: 200, added: 0, message: msg });
      }
    }

    let meetingplace_details = [];
    meetingplace_details = await GatePass.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
        date: date,
        meetingPlaceID: meetingPlaceID,
        fromTime: { [Sequelize.Op.lt]: req.body.fromTime },
        toTime: { [Sequelize.Op.gt]: req.body.fromTime },
      },
      raw: true,
    });

    if (meetingplace_details.length != 0) {
      let msg = 'Place Already Occupied';
      res.status(200).json({ status: 200, added: 0, message: msg });
    } else {
      meetingplace_details = [];

      meetingplace_details = await GatePass.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
          date: date,
          meetingPlaceID: meetingPlaceID,
          fromTime: { [Sequelize.Op.lt]: req.body.toTime },
          toTime: { [Sequelize.Op.gt]: req.body.toTime },
        },
        raw: true,
      });

      if (meetingplace_details.length != 0) {
        let msg = 'Place Already Occupied';
        res.status(200).json({ status: 200, added: 0, message: msg });
      } else {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await GatePass.create(
            {
              visitorsid,
              userMasterID,
              date,
              inTime,
              outTime,
              fromTime,
              toTime,
              meetingPlaceID,
              remarks,
              companyMasterID,
              attachment,
              noofperson,
              vehicleNo,
              visitortype,
              status,
              createBy,
              createByIp,
              personName,
              personNumber,
            },
            { transaction: t }
          );

          let get_user = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: userMasterID,
              status: 1,
            },
          });
          let get_visitor;

          if (visitortype == 'employee') {
            get_visitor = await UserMaster.findOne({
              raw: true,
              where: {
                userMasterID: visitorsid,
                status: 1,
              },
            });
            get_visitor =
              get_visitor && get_visitor.displayName
                ? get_visitor.displayName
                : 'Someone';
          } else {
            get_visitor = await Visitor.findOne({
              raw: true,
              where: {
                visitorsid: visitorsid,
                status: 1,
              },
            });
            get_visitor =
              get_visitor &&
              get_visitor.visitorsFirstName &&
              get_visitor.visitorsLastName
                ? get_visitor.visitorsFirstName +
                  ' ' +
                  get_visitor.visitorsLastName
                : 'Someone';
          }

          if (get_user) {
            const formattedDate = formatDate(date);
            fromTime = fromTime ? ' at ' + fromTime + ' ' : ' ';
            let message =
              get_visitor +
              ' will be visiting you ' +
              fromTime +
              'on ' +
              formattedDate;

            await UserInbox.create(
              {
                activityTable: GatePass.getTableName(),
                activityTablePK: insert_db_status.toJSON().gatePassid,
                message: `${message}`,
                assignedTo: userMasterID,
                assignedBy: createBy,
              },
              { transaction: t }
            );

            const notification = {
              title: 'Hey ' + get_user.firstName + ' you have a visitor',
              body: message,
            };
            const data = {
              screen: 'gatepass',
              isScheduled: 'true',
              scheduledTime: new Date().toISOString(),
            };

            await sendNotification(get_user.userMasterID, notification, data);
          }

          res.status(200).json({
            status: 200,
            message: message.usermessage.gatePassadd,
            data: insert_db_status,
            added: 1,
          });
          return insert_db_status;
        });
      }
    }
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with GatePass id
 *
 * @param {id} gatePassID  to fetch city name
 */

exports.getgatePassId = async (req, res, next) => {
  try {
    let get_one_data = await GatePass.findOne({
      where: { gatePassid: req.params.id, status: ['0', '1'] },
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
 * @param {id} gatePassID  to update id
 */
exports.postUpdategatePass = async (req, res, next) => {
  try {
    let {
      gatePassid,
      visitorsid,
      userMasterID,
      date,
      inTime,
      outTime,
      fromTime,
      toTime,
      meetingPlaceID,
      remarks,
      companyMasterID,
      noofperson,
      vehicleNo,
      visitortype,
      attachment,
      status,
      updateBy,
      updateByIp,
      personName,
      personNumber,
    } = await req.body;

    noofperson = noofperson == '' || noofperson == null ? 1 : noofperson;

    if (fromTime && toTime) {
      if (fromTime >= toTime) {
        let msg = 'From time is greater than To time';
        res.status(200).json({ status: 200, added: 0, message: msg });
      }
    }

    let delete_status = await GatePass.update(
      {
        Status: 2,
      },
      {
        where: { gatePassid: req.body.gatePassid },
      }
    );

    let meetingplace_details = [];
    meetingplace_details = await GatePass.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
        date: date,
        meetingPlaceID: meetingPlaceID,
        fromTime: { [Sequelize.Op.lt]: req.body.fromTime },
        toTime: { [Sequelize.Op.gt]: req.body.fromTime },
      },
      raw: true,
    });

    if (meetingplace_details.length != 0) {
      let delete_status = await GatePass.update(
        {
          Status: 1,
        },
        {
          where: { gatePassid: req.body.gatePassid },
        }
      );
      let msg = 'Place Already Occupied';
      res.status(200).json({ status: 200, added: 0, message: msg });
    } else {
      meetingplace_details = [];

      meetingplace_details = await GatePass.findAll({
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
          date: date,
          meetingPlaceID: meetingPlaceID,
          fromTime: { [Sequelize.Op.lt]: req.body.toTime },
          toTime: { [Sequelize.Op.gt]: req.body.toTime },
        },
        raw: true,
      });

      if (meetingplace_details.length != 0) {
        let delete_status = await GatePass.update(
          {
            Status: 1,
          },
          {
            where: { gatePassid: req.body.gatePassid },
          }
        );
        let msg = 'Place Already Occupied';
        res.status(200).json({ status: 200, added: 0, message: msg });
      } else {
        let get_user = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: userMasterID,
            status: 1,
          },
        });
        let get_visitor;

        if (visitortype == 'employee') {
          get_visitor = await UserMaster.findOne({
            raw: true,
            where: {
              userMasterID: visitorsid,
              status: 1,
            },
          });
          get_visitor =
            get_visitor && get_visitor.displayName
              ? get_visitor.displayName
              : 'Someone';
        } else {
          get_visitor = await Visitor.findOne({
            raw: true,
            where: {
              visitorsid: visitorsid,
              status: 1,
            },
          });
          get_visitor =
            get_visitor &&
            get_visitor.visitorsFirstName &&
            get_visitor.visitorsLastName
              ? get_visitor.visitorsFirstName +
                ' ' +
                get_visitor.visitorsLastName
              : 'Someone';
        }

        let result = await sequelize.transaction(async (t) => {
          let change_data_status = await GatePass.update(
            {
              visitorsid,
              userMasterID,
              date,
              inTime,
              outTime,
              fromTime,
              toTime,
              meetingPlaceID,
              remarks,
              companyMasterID,
              noofperson,
              vehicleNo,
              visitortype,
              attachment,
              status,
              updateBy,
              updateByIp,
              personName,
              personNumber,
            },
            {
              where: { gatePassid: gatePassid },
              transaction: t,
            }
          );

          await UserInbox.destroy(
            {
              where: {
                activityTable: GatePass.getTableName(),
                activityTablePK: gatePassid,
              },
            },
            { transaction: t }
          );

          const formattedDate = formatDate(date);
          fromTime = fromTime ? ' at ' + fromTime + ' ' : ' ';
          let message =
            get_visitor +
            ' will be visiting you ' +
            fromTime +
            'on ' +
            formattedDate;

          await UserInbox.create(
            {
              activityTable: GatePass.getTableName(),
              activityTablePK: gatePassid,
              message: `${message}`,
              assignedTo: userMasterID,
              assignedBy: updateBy,
            },
            { transaction: t }
          );
        });

        if (get_user) {
          const formattedDate = formatDate(date);
          fromTime = fromTime ? ' at ' + fromTime + ' ' : '';

          let get_one_data = await GatePass.findOne({
            where: { gatePassid: gatePassid, status: ['0', '1'] },
            raw: true,
          });

          let message, title;
          if (get_one_data.userMasterID == userMasterID) {
            message =
              get_visitor +
              ' will be visiting you' +
              fromTime +
              ' on ' +
              formattedDate;
            title =
              'Hey ' +
              get_user.firstName +
              '! You have an update from your visitor.';
          } else {
            message =
              get_visitor +
              ' will be visiting you' +
              fromTime +
              ' on ' +
              formattedDate;
            title = 'Hey ' + get_user.firstName + '! You have a visitor.';
          }

          const notification = {
            title: title,
            body: message,
          };
          const data = {
            screen: 'gatepass',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          await sendNotification(get_user.userMasterID, notification, data);
        }

        return res.status(200).json({
          status: 200,
          added: 1,
          message: message.usermessage.gatePassupdate,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};
/**
 * delete by i
 *
 * @param {id} gatePassID  to delete id
 */
exports.postDeletegatePassById = async (req, res, next) => {
  try {
    let { gatePassid } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await GatePass.update(
        {
          status: '2',
        },
        {
          where: { gatePassid: gatePassid },
          transaction: t,
        }
      );

      await UserInbox.destroy(
        {
          where: {
            activityTable: GatePass.getTableName(),
            activityTablePK: gatePassid,
          },
        },
        { transaction: t }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.gatePassdelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { gatePassid, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await GatePass.update(
          {
            status: '1',
          },
          {
            where: { gatePassid: gatePassid, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await GatePass.update(
          {
            status: '0',
          },
          {
            where: { gatePassid: gatePassid, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.gatePassdelete,
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

exports.getgatePasscompanyid = async (req, res, next) => {
  try {
    let { limit, page, searchQuery, startdate, enddate, userMasterID, status } =
      await req.body;

    const condition = {};
    const paginate = page && limit ? { offset: (page - 1) * limit, limit } : {};
    condition.status = 1;
    if (searchQuery)
      condition[Op.or] = [
        { '$companyMaster.companyName$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$visitor.visitorsFirstName$': { [Op.iLike]: `%${searchQuery}%` } },
        {
          '$meetingPlace.meetingPlaceName$': { [Op.iLike]: `%${searchQuery}%` },
        },
      ];

    if (userMasterID) condition.userMasterID = userMasterID;
    if (startdate && enddate)
      condition.date = {
        [Op.between]: [new Date(startdate), new Date(enddate)],
      };

    if (status) {
      if (status == 1) {
        condition.inTime = { [Op.not]: null };
        condition.outTime = { [Op.is]: null };
      } else if (status == 2) {
        condition.inTime = { [Op.not]: null };
        condition.outTime = { [Op.not]: null };
      } else if (status == 3) {
        condition.inTime = { [Op.is]: null };
        condition.outTime = { [Op.is]: null };
      }

      // Use req.body.companyMasterID only if it's available
      if (req.body.companyMasterID) {
        condition.companyMasterID = req.body.companyMasterID;
      } else {
        // Otherwise, fall back to the user details logic
        condition.companyMasterID =
          req.userDetails.childCompanies.length > 0
            ? [
                ...req.userDetails.childCompanies,
                req.userDetails.companyMasterId,
              ]
            : req.userDetails.companyMasterId;
      }
    } else {
      condition.companyMasterID =
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId;
    }

    const { rows: gatePass, count: totalcount } =
      await GatePass.findAndCountAll({
        where: condition,
        ...paginate,
        order: [['date', 'DESC']],
        include: [
          { model: companyMasters },
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: Visitor },
          { model: meetingPlace },
        ],
      });

    for (let j = 0; j < gatePass.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: gatePass[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: gatePass[j].updateBy,
        },
      });

      if (user1) {
        gatePass[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        gatePass[j].updateBy = user2.dataValues.displayName;
      }

      if (gatePass[j].visitortype == 'employee') {
        let get_one_data = await UserMaster.findOne({
          where: { userMasterID: gatePass[j].visitorsid },
          raw: true,
        });

        if (get_one_data) {
          gatePass[j].dataValues.visitor = {
            visitorsFirstName: get_one_data.displayName,
          };
        }
      }
    }

    if (req.body.export) {
      const finalresult = gatePass.map((e) => {
        const personName = e.personName ? String(e.personName.join('\n')) : '';
        const personNumber = e.personNumber
          ? String(e.personNumber.join('\n'))
          : '';
        const data = {};
        data['Whom To Meet'] = e.userMaster.displayName;
        data['Company Name'] = e.companyMaster.companyName;
        data['Visitor Name'] = e.dataValues.visitor.visitorsFirstName;
        data['Visitor Company'] = e.dataValues.visitor.visitorsComapny;
        data['Visitor Phone'] = e.dataValues?.visitor?.visitorsPhone;
        data['Date'] = e.date;
        data['CheckIn Time'] = e.inTime;
        data['CheckOut Time'] = e.outTime;
        data['From Time'] = e.fromTime;
        data['To Time'] = e.toTime;
        data['Meeting Location'] = e.meetingPlace
          ? e.meetingPlace.meetingPlaceName
          : '';
        data['Visitor Type'] = e.visitortype;
        data['Remarks'] = e.remarks;
        data['No Of Person'] = e.noofperson;
        data['Person Name'] =
          Array.isArray(e.personName) && e.personName.length === 0
            ? ''
            : personName;
        data['Person Number'] =
          Array.isArray(e.personNumber) && e.personNumber.length === 0
            ? ''
            : personNumber;
        data['Vehicle No'] = e.vehicleNo;

        return data;
      });

      await generateExcelGatePass(finalresult, 'Gate Passes', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: gatePass, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getgatePassuser = async (req, res, next) => {
  try {
    let {
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      visitor,
      status,
      userMasterID,
      companyMasterID,
    } = await req.body;

    const condition = {};
    const paginate = page && limit ? { offset: (page - 1) * limit, limit } : {};
    condition.status = 1;

    if (searchQuery)
      condition[Op.or] = [
        { '$companyMaster.companyName$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` } },
        { '$visitor.visitorsFirstName$': { [Op.iLike]: `%${searchQuery}%` } },
        {
          '$meetingPlace.meetingPlaceName$': { [Op.iLike]: `%${searchQuery}%` },
        },
        {
          '$visitor.visitorsFirstName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },

        {
          '$visitor.visitorsComapny$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    condition.userMasterID = userMasterID;

    if (startdate && enddate)
      condition.date = {
        [Op.between]: [new Date(startdate), new Date(enddate)],
      };
    if (status) {
      if (status == 1) {
        condition.inTime = { [Op.not]: null };
        condition.outTime = { [Op.is]: null };
      } else if (status == 2) {
        condition.inTime = { [Op.not]: null };
        condition.outTime = { [Op.not]: null };
      } else if (status == 3) {
        condition.inTime = { [Op.is]: null };
        condition.outTime = { [Op.is]: null };
      }

      if (req.body.companyMasterID) {
        condition.companyMasterID = req.body.companyMasterID;
      } else {
        // Otherwise, fall back to the user details logic
        condition.companyMasterID =
          req.userDetails.childCompanies.length > 0
            ? [
                ...req.userDetails.childCompanies,
                req.userDetails.companyMasterId,
              ]
            : req.userDetails.companyMasterId;
      }
    } else {
      condition.companyMasterID =
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId;
    }

    const { rows: gatePass, count: totalcount } =
      await GatePass.findAndCountAll({
        where: condition,
        ...paginate,
        order: [['date', 'DESC']],
        include: [
          { model: companyMasters },
          {
            model: UserMaster,
            required: true,
            ...accessibleUsers(req.userDetails),
          },
          { model: Visitor },
          { model: meetingPlace },
        ],
      });

    for (let j = 0; j < gatePass.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: gatePass[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: gatePass[j].updateBy,
        },
      });

      if (user1) {
        gatePass[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        gatePass[j].updateBy = user2.dataValues.displayName;
      }

      if (gatePass[j].visitortype == 'employee') {
        let get_one_data = await UserMaster.findOne({
          where: { userMasterID: gatePass[j].visitorsid },
          raw: true,
        });
        if (get_one_data) {
          gatePass[j].dataValues.visitor = {
            visitorsFirstName: get_one_data.displayName,
          };
        }
      }
    }

    if (req.body.export) {
      const finalresult = gatePass.map((e) => {
        const personName = e.personName ? String(e.personName.join('\n')) : '';
        const personNumber = e.personNumber
          ? String(e.personNumber.join('\n'))
          : '';
        const data = {};
        data['Whom To Meet'] = e.userMaster.displayName;
        data['Company Name'] = e.companyMaster.companyName;
        data['Visitor Name'] = e.dataValues?.visitor?.visitorsFirstName;
        data['Visitor Company'] = e.dataValues?.visitor?.visitorsComapny;
        data['Visitor Phone'] = e.dataValues?.visitor?.visitorsPhone;
        data['Date'] = e.date;
        data['CheckIn Time'] = e.inTime;
        data['CheckOut Time'] = e.outTime;
        data['From Time'] = e.fromTime;
        data['To Time'] = e.toTime;
        data['Meeting Location'] = e.meetingPlace
          ? e.meetingPlace.meetingPlaceName
          : '';
        data['Visitor Type'] = e.visitortype;
        data['Remarks'] = e.remarks;
        data['No Of Person'] = e.noofperson;
        data['Person Name'] =
          Array.isArray(e.personName) && e.personName.length === 0
            ? ''
            : personName;
        data['Person Number'] =
          Array.isArray(e.personNumber) && e.personNumber.length === 0
            ? ''
            : personNumber;
        data['Vehicle No'] = e.vehicleNo;

        return data;
      });

      await generateExcelGatePass(finalresult, 'Gate Passes', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: gatePass, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.getgatePassByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await GatePass.findAll({
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

exports.getactivegatePassbycompanyid = async (req, res, next) => {
  try {
    let gatePass;
    const companyid = [];
    companyid.push(parseInt(req.params.id));

    req.userDetails.accessibleCompanies = companyid;

    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    gatePass = await GatePass.findAll({
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
        },
        {
          model: Visitor,
        },
        {
          model: meetingPlace,
        },
      ],
    });

    return res.status(200).json({ status: 200, data: gatePass });
  } catch (err) {
    next(err);
  }
};

exports.getpassByuserId = async (req, res, next) => {
  try {
    let get_one_data = await GatePass.findAll({
      where: {
        userMasterID: req.body.id,
        status: 1,
      },
    });
    totalcount = await GatePass.count({
      where: {
        userMasterID: req.body.id,
        status: 1,
      },
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    res
      .status(200)
      .json({ status: 200, data: get_one_data, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};
/**
 * update data for Check in and Check Out
 *
 * @param {id} gatePassID  to update id
 */
exports.postUpdategatePass1 = async (req, res, next) => {
  try {
    let {
      gatePassid,
      inTime,
      outTime,
      checkINattachment,
      checkOUTattachment,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await GatePass.update(
        {
          inTime,
          outTime,
          checkINattachment,
          checkOUTattachment,
          updateBy,
          updateByIp,
        },
        {
          where: { gatePassid: gatePassid },
          transaction: t,
        }
      );

      let get_one_data = await GatePass.findOne({
        where: { gatePassid: gatePassid },
        raw: true,
      });

      let get_user = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: get_one_data.userMasterID,
          status: 1,
        },
      });
      let get_visitor;

      if (get_one_data.visitortype == 'employee') {
        get_visitor = await UserMaster.findOne({
          raw: true,
          where: {
            userMasterID: get_one_data.visitorsid,
            status: 1,
          },
        });
        get_visitor =
          get_visitor && get_visitor.displayName
            ? get_visitor.displayName
            : 'Someone';
      } else {
        get_visitor = await Visitor.findOne({
          raw: true,
          where: {
            visitorsid: get_one_data.visitorsid,
            status: 1,
          },
        });
        get_visitor =
          get_visitor &&
          get_visitor.visitorsFirstName &&
          get_visitor.visitorsLastName
            ? get_visitor.visitorsFirstName + ' ' + get_visitor.visitorsLastName
            : 'Someone';
      }

      if (get_user) {
        if (outTime) {
          await UserInbox.destroy(
            {
              where: {
                activityTable: GatePass.getTableName(),
                activityTablePK: gatePassid,
              },
            },
            { transaction: t }
          );
        }

        if (get_user.firebaseToken != null && get_user.firebaseToken != '') {
          let title = inTime
            ? 'Hey ' + get_user.firstName + '! Someone just checked-IN'
            : 'Hey ' + get_user.firstName + '! Someone just checked-OUT';
          let message = inTime
            ? get_visitor + ' just checked-IN for their visit'
            : get_visitor + ' just checked-OUT from their visit';

          const notification = {
            title: title,
            body: message,
          };
          const data = {
            screen: 'gatepass',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          await sendNotification(get_user.userMasterID, notification, data);
        }
      }

      const role = await RolePermission.findAll({
        raw: true,
        where: {
          formMasterID: 98,
          operationID: 2,
        },
        include: [
          {
            model: RoleMaster,
            where: {
              companyMasterID: get_user.companyMasterId,
            },
            attributes: [],
          },
        ],
        attributes: [
          [Sequelize.col('rolePermission.roleMasterID'), 'roleMasterID'],
        ],
      });

      const allRoleIds = role.map((e) => e.roleMasterID);

      const getGatePassAdmin = await UserRole.findAll({
        raw: true,
        where: {
          roleMasterID: {
            [Op.in]: allRoleIds,
          },
        },
        include: [
          {
            model: UserMaster,
            where: { companyMasterId: get_user.companyMasterId, status: 1 },
            attributes: [],
          },
        ],

        attributes: [
          [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
          [Sequelize.col('userMaster.firebaseToken'), 'firebaseToken'],
        ],
      });

      for (var i = 0; i < getGatePassAdmin.length; i++) {
        if (
          getGatePassAdmin[i].firebaseToken != null &&
          getGatePassAdmin[i].firebaseToken != ''
        ) {
          let title = inTime
            ? 'Hey! Someone just checked-IN'
            : 'Hey! Someone just checked-OUT';
          let message = inTime
            ? get_visitor + ' has allowed to check-IN for their visit'
            : get_visitor + ' has allowed to check-OUT for their visit';

          const notification = {
            title: title,
            body: message,
          };
          const data = {
            screen: 'gatepassadmin',
            isScheduled: 'true',
            scheduledTime: new Date().toISOString(),
          };
          await sendNotification(
            getGatePassAdmin[i].userMasterID,
            notification,
            data
          );
        }
      }

      res.status(200).json({
        status: 200,
        added: 1,
        message: message.usermessage.gatePassupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.gatePassDashboard = async (req, res, next) => {
  try {
    let { companyMasterID, date, branchMasterID } = await req.body;
    let finaldata = [];
    let total_gatePass;
    let total_active_user;
    let userid = [];
    let total_checkin;
    let total_checkout;
    let total_notCheckin;
    let branch_user = [];
    let branch_contact;

    if (!branchMasterID) {
      total_gatePass = await GatePass.count({
        where: {
          companyMasterID: companyMasterID,
          status: 1,
          date: date,
        },
      });

      total_notCheckin = await GatePass.count({
        where: {
          companyMasterID: companyMasterID,
          date: date,
          status: 1,
          inTime: {
            [Sequelize.Op.eq]: null,
          },
        },
      });

      total_checkin = await GatePass.count({
        where: {
          companyMasterID: companyMasterID,
          date: date,
          status: 1,
          inTime: {
            [Sequelize.Op.ne]: null,
          },
          outTime: {
            [Sequelize.Op.eq]: null,
          },
        },
      });

      total_checkout = await GatePass.count({
        where: {
          companyMasterID: companyMasterID,
          date: date,
          status: 1,
          [Sequelize.Op.and]: [
            {
              inTime: {
                [Sequelize.Op.ne]: null,
              },
            },
            {
              outTime: {
                [Sequelize.Op.ne]: null,
              },
            },
          ],
        },
      });
    } else {
      let todayDate = new Date().toISOString().slice(0, 10);
      total_active_user = await UserMaster.findAll({
        where: {
          companyMasterId: companyMasterID,
          status: 1,
        },
      });

      for (var i = 0; i < total_active_user.length; i++) {
        userid.push(total_active_user[i].userMasterID);
      }

      branch_contact = await executeQuery(
        `select DISTINCT eb."userMasterID" from "employeeBranches" as eb left outer join "userMasters" as um on eb."userMasterID"=um."userMasterID" where eb."branchID"=` +
          branchMasterID +
          ` and eb."applicableDate" <= '` +
          todayDate +
          `' and (eb."endDate" is null or eb."endDate" > '` +
          todayDate +
          `')
             and eb."status"=1 and um."status"=1`
      );

      if (branch_contact) {
        for (var j = 0; j < branch_contact.length; j++) {
          branch_user.push(branch_contact[j].userMasterID);
        }

        total_gatePass = await GatePass.count({
          where: {
            userMasterID: branch_user,
            status: 1,
            date: date,
          },
        });

        total_notCheckin = await GatePass.count({
          where: {
            userMasterID: branch_user,
            date: date,
            status: 1,
            inTime: {
              [Sequelize.Op.eq]: null,
            },
          },
        });

        total_checkin = await GatePass.count({
          where: {
            userMasterID: branch_user,
            date: date,
            status: 1,
            inTime: {
              [Sequelize.Op.ne]: null,
            },
            outTime: {
              [Sequelize.Op.eq]: null,
            },
          },
        });

        total_checkout = await GatePass.count({
          where: {
            userMasterID: branch_user,
            date: date,
            status: 1,
            [Sequelize.Op.and]: [
              {
                inTime: {
                  [Sequelize.Op.ne]: null,
                },
              },
              {
                outTime: {
                  [Sequelize.Op.ne]: null,
                },
              },
            ],
          },
        });
      } else {
        total_gatePass = 0;
        total_checkin = 0;
        total_checkout = 0;
        total_notCheckin = 0;
      }
    }
    finaldata.push({
      total_gatePass: total_gatePass,
      total_checkin: total_checkin,
      total_notCheckin: total_notCheckin,
      total_checkout: total_checkout,
    });
    res.status(200).json({ status: 200, data: finaldata });
  } catch (err) {
    next(err);
  }
};
