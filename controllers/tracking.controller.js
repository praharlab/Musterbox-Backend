const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Tracking = require('../models/tracking');
const message = require('../response_message/message');
const logger = require('../config/logger');
const UserMaster = require('../models/userMaster');
const CompanyMaster = require('../models/companyMaster');
const Visit = require('../models/visit');
const UserExpense = require('../models/userExpense');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const { json } = require('express');
const TrackingKM = require('../models/trackingKM');
const {
  asiaKolkataDateTime,
  employeeDepartment,
  employeeDesignation,
  sendNotification_NEW,
} = require('../utils/commonUtilFunctions');
const UserTracking = require('../models/userTracking');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const BranchMaster = require('../models/branchMaster');
const EmployeeBranch = require('../models/employeeBranch');
const { userAttributes } = require('../utils/commonVars');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const { geoFenseType } = require('../utils/dbUtils');
const EmployeeReportTo = require('../models/employeeReportTo');
const OutsideNotification = require('../models/outsideNotification');

exports.postTracking = async (req, res, next) => {
  try {
    let = {
      userMasterID,
      Lattitude,
      Longitude,
      Address,
      Battery,
      Gps,
      Wifi,
      Mobile_name,
      createBy,
      createByIp,
    } = await req.body;

    const insert_db_status = await Tracking.create({
      userMasterID,
      Lattitude,
      Longitude,
      Address,
      Track_datetime: new Date(),
      Battery,
      Gps,
      Wifi,
      Mobile_name,
      createBy,
      createByIp,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.Trackingadd,
      data: insert_db_status,
    });
  } catch (error) {
    next(error.message);
  }
};

function toRad(Value) {
  return (Value * Math.PI) / 180;
}
function calcCrow(lat1, lon1, lat2, lon2) {
  const p = 0.017453292519943295;
  const c = Math.cos;
  const a =
    0.5 -
    c((lat2 - lat1) * p) / 2 +
    (c(lat1 * p) * c(lat2 * p) * (1 - c((lon2 - lon1) * p))) / 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

exports.postTrackingBulk = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  let data = [];
  try {
    const { tracking } = req.body;

    const findUserTracking = await UserTracking.findOne({
      where: {
        userMasterID: req.userDetails.userMasterId,
        trackStatus: 1,
      },
    });
    let isNotifyReportto = false;
    const employeeReportToData = [];
    let findUserData = null;
    if (findUserTracking && findUserTracking.notifyReportTo) {
      isNotifyReportto = true;

      findUserData = await UserMaster.findOne({
        where: { userMasterID: req.userDetails.userMasterId, status: 1 },
        attributes: userAttributes,
        include: [
          {
            required: false,
            model: EmployeeReportTo,
            where: {
              status: 1,
            },
            include: [
              {
                model: UserMaster,
                as: 'reportTo',
                attributes: userAttributes,
              },
            ],
          },
        ],
      });

      const findEmployeeReportTo = findUserData?.employeeReportTos || [];
      if (findEmployeeReportTo && findEmployeeReportTo.length > 0) {
        employeeReportToData.push(...findEmployeeReportTo);
      }
    }

    if (findUserTracking && employeeReportToData.length) {
      let exeFirstTime = true;

      let findOutsideNotification = null;

      for (let i = 0; i < tracking.length; i++) {
        const e = tracking[i];
        if (
          e.geofence == geoFenseType.OUTSIDE ||
          e.geofence == geoFenseType.INSIDE
        ) {
          if (exeFirstTime) {
            findOutsideNotification = await OutsideNotification.findOne({
              where: {
                userMasterID: req.userDetails.userMasterId,
                date: asiaKolkataDateTime(e.Track_datetime).slice(0, 10),
              },
              order: [['id', 'DESC']],
              transaction,
            });
            exeFirstTime = false;
          }

          if (e.geofence == geoFenseType.OUTSIDE) {
            if (
              !findOutsideNotification ||
              (findOutsideNotification && findOutsideNotification.inDatetime)
            ) {
              await OutsideNotification.create(
                {
                  userMasterID: req.userDetails.userMasterId,
                  date: asiaKolkataDateTime(e.Track_datetime).slice(0, 10),
                  outDatetime: e.Track_datetime,
                },
                { user: req.userDetails, transaction }
              );

              for (let reports of employeeReportToData) {
                const userData = reports.reportTo;

                let notification = {
                  title: 'Team Member Outside Notification',
                  body: `Your team member ${findUserData.displayName} is currently outside the premises`,
                };

                let data = {
                  screen: 'trackingOutside',
                  isScheduled: 'true',
                  scheduledTime: new Date().toISOString(),
                };
                sendNotification_NEW(
                  userData.firebaseToken,
                  userData.deviceType,
                  notification,
                  data
                );
              }

              findOutsideNotification = await OutsideNotification.findOne({
                where: {
                  userMasterID: req.userDetails.userMasterId,
                  date: asiaKolkataDateTime(e.Track_datetime).slice(0, 10),
                },
                order: [['id', 'DESC']],
                transaction,
              });
            }
          } else if (e.geofence == geoFenseType.INSIDE) {
            if (
              findOutsideNotification &&
              findOutsideNotification.inDatetime == null
            ) {
              const inTime = new Date(e.Track_datetime);
              const outTime = new Date(findOutsideNotification.outDatetime);
              const diffMinutes = Math.floor((inTime - outTime) / 60000);

              findOutsideNotification.inDatetime = e.Track_datetime;
              findOutsideNotification.minutes = diffMinutes;
              await findOutsideNotification.save({
                user: req.userDetails,
                transaction,
              });

              findOutsideNotification = await OutsideNotification.findOne({
                where: {
                  userMasterID: req.userDetails.userMasterId,
                  date: asiaKolkataDateTime(e.Track_datetime).slice(0, 10),
                },
                order: [['id', 'DESC']],
                transaction,
              });
            }
          }
        }
        data.push({
          ...e,
          userMasterID: req.userDetails.userMasterId,
        });
      }
    } else {
      data = tracking.map((e) => ({
        ...e,
        userMasterID: req.userDetails.userMasterId,
      }));
    }

    // Split data into chunks of 1000
    const trackingChunks = [];
    for (let i = 0; i < data.length; i += 1000) {
      trackingChunks.push(data.slice(i, i + 1000));
    }

    // Bulk insert each chunk
    await Promise.all(
      trackingChunks.map((chunk) => {
        return Tracking.bulkCreate(chunk, { transaction });
      })
    );

    if (data.length > 0) {
      let date = asiaKolkataDateTime(data[0].Track_datetime).slice(0, 10);
      let findKM = await TrackingKM.findOne({
        where: {
          userMasterID: data[0].userMasterID,
          date: date,
        },
        transaction,
      });

      for (const item of data) {
        if (
          !item.Lattitude ||
          !item.Longitude ||
          item.Lattitude === 'not found' ||
          item.Longitude === 'not found'
        )
          continue;

        const currTrackingDate = asiaKolkataDateTime(item.Track_datetime).slice(
          0,
          10
        );

        if (currTrackingDate !== date) {
          if (findKM) await findKM.save({ transaction });
          date = currTrackingDate;
          findKM = await TrackingKM.findOne({
            where: {
              userMasterID: data[0].userMasterID,
              date: date,
            },
            transaction,
          });
        }

        if (!findKM) {
          findKM = await TrackingKM.create(
            {
              userMasterID: item.userMasterID,
              Lattitude: item.Lattitude,
              Longitude: item.Longitude,
              date: date,
              kilometer: 0,
              UserTrackingID: item.UserTrackingID,
              Address: item.Address,
              Track_datetime: item.Track_datetime,
              Battery: item.Battery,
              Gps: item.Gps,
              Wifi: item.Wifi,
              Mobile_name: item.Mobile_name,
              type: item.type,
              developerMode: item.developerMode,
              geofence: item.geofence,
            },
            { transaction }
          );
        } else {
          const lat1 = parseFloat(findKM.Lattitude);
          const lat2 = parseFloat(item.Lattitude);
          const lon1 = parseFloat(findKM.Longitude);
          const lon2 = parseFloat(item.Longitude);

          const kms = calcCrow(lat1, lon1, lat2, lon2);

          if (+kms > 0.085) {
            findKM.Lattitude = item.Lattitude;
            findKM.Longitude = item.Longitude;
            findKM.kilometer = (+findKM.kilometer + kms).toFixed(2);
            findKM.UserTrackingID = item.UserTrackingID;
            findKM.Address = item.Address;
            findKM.Track_datetime = item.Track_datetime;
            findKM.Battery = item.Battery;
            findKM.Gps = item.Gps;
            findKM.Wifi = item.Wifi;
            findKM.Mobile_name = item.Mobile_name;
            findKM.type = item.type;
            findKM.developerMode = item.developerMode;
            findKM.geofence = item.geofence;
          }
        }
      }
      if (findKM) await findKM.save({ transaction });
    }

    await transaction.commit();

    return res.status(200).json({
      status: 200,
      message: message.usermessage.Trackingadd,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.postUpdate = async (req, res, next) => {
  try {
    let = {
      UserTrackingID,
      Lattitude,
      Longitude,
      Address,
      Track_datetime,
      Battery,
      Gps,
      Wifi,
      Mobile_name,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let data = await Tracking.update(
        {
          Lattitude,
          Longitude,
          Address,
          Track_datetime,
          Battery,
          Gps,
          Wifi,
          Mobile_name,
          updateBy,
          updateByIp,
        },
        {
          where: { UserTrackingID: UserTrackingID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        msg: data,
        message: message.usermessage.Trackingupdate,
      });
      return data;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postDelete = async (req, res, next) => {
  try {
    let TrackingID = await req.body.id;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await Tracking.update(
        {
          Status: 2,
        },
        {
          where: { UserTrackingID: TrackingID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.Trackingdelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};
exports.poststatus = async (req, res, next) => {
  try {
    let = { UserTrackingID, Status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (Status == '1') {
        delete_status = await Tracking.update(
          {
            Status: '1',
          },
          {
            where: { UserTrackingID: UserTrackingID, Status: ['1', '0'] },
            transaction: result,
          }
        );
      } else {
        delete_status = await Tracking.update(
          {
            Status: '0',
          },
          {
            where: { UserTrackingID: UserTrackingID, Status: ['1', '0'] },
            transaction: t,
          }
        );
      }
      if (delete_status != 0) {
        res
          .status(200)
          .json({ status: 200, message: message.usermessage.Trackingupdate });
      } else {
        res
          .status(200)
          .json({ status: 200, message: message.usermessage.deletedrecord });
      }
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = (200).json({
        status: 401,
        message: message.usermessage.errmessage,
        data: {},
      });
    }
    next(err);
  }
};

exports.getByUserId = async (req, res, next) => {
  try {
    let get_one_data = await Tracking.findAll({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn('date', sequelize.col('Track_datetime')),
            '=',
            req.body.date
          ),
        ],
        userMasterID: req.body.id,
      },
      order: [['Track_datetime', 'ASC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
        },
      ],
    });

    const findKM = await TrackingKM.findOne({
      where: { userMasterID: req.body.id, date: req.body.date },
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.trackingget,
      data: get_one_data,
      km: findKM ? findKM.kilometer : null,
    });
  } catch (err) {
    next(err);
  }
};

exports.getUserTrackingInfoById = async (req, res, next) => {
  try {
    const { userMasterID, date } = req.body;

    if (!userMasterID || !date)
      return res
        .status(200)
        .json({ status: 401, message: 'Invalid parameters!', data: [] });
    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    let get_one_data1 = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
        status: [0, 1],
      },
      include: [
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['designationID'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        {
          required: false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },

          attributes: ['departmentID'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },
      ],
    });
    if (!get_one_data1) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage('user'),
        data: [],
      });
    }

    let [get_one_data, findKM, get_one_data4, totalAmount] = await Promise.all([
      Tracking.findAll({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('Track_datetime')),
              '=',
              date
            ),
          ],
          userMasterID: userMasterID,
        },
        // include: [
        //   {
        //     model: UserMaster,
        //     required: true,
        //     ...accessibleUsers(req.userDetails),
        //     attributes: [
        //       'userMasterID',
        //       'firstName',
        //       'middleName',
        //       'lastName',
        //       'displayName',
        //       'userNumber',
        //       'photo',
        //     ],
        //   },
        // ],
        order: [['Track_datetime', 'ASC']],
      }),
      TrackingKM.findOne({
        raw: true,
        where: { userMasterID: userMasterID, date: date },
      }),
      Visit.count({
        where: {
          [Sequelize.Op.and]: [
            Sequelize.where(
              sequelize.fn('date', sequelize.col('visitDate')),
              '=',
              date
            ),
          ],
          assignID: userMasterID,
          status: 1,
        },
      }),
      UserExpenseTransaction.findOne({
        where: {
          [Sequelize.Op.and]: [
            { '$userExpense.userMasterID$': userMasterID },
            Sequelize.where(
              sequelize.fn('date', sequelize.col('expense_date')),
              '=',
              date
            ),
          ],
        },
        attributes: [
          [sequelize.fn('sum', sequelize.col('expenseAmount')), 'total_amount'],
        ],
        include: [
          {
            model: UserExpense,
            as: 'userExpense',
            attributes: ['userMasterID'],
          },
        ],
        group: ['userExpense.userMasterID'],
        raw: true,
      }),
    ]);
    // let get_one_data = await Tracking.findAll({
    //   where: {
    //     [Sequelize.Op.and]: [
    //       Sequelize.where(
    //         sequelize.fn('date', sequelize.col('Track_datetime')),
    //         '=',
    //         date
    //       ),
    //     ],
    //     userMasterID: userMasterID,
    //   },
    //   include: [
    //     {
    //       model: UserMaster,
    //       required: true,
    //       ...accessibleUsers(req.userDetails),
    //       attributes: [
    //         'userMasterID',
    //         'firstName',
    //         'middleName',
    //         'lastName',
    //         'displayName',
    //         'userNumber',
    //         'photo',
    //       ],
    //     },
    //   ],
    //   order: [['Track_datetime', 'ASC']],
    // });

    const kmData = [];
    const finalTracking = [];
    let lat = null;
    let long = null;
    let km = 0;
    for (let item of get_one_data) {
      finalTracking.push({
        address: item.Address != 'not found' ? item.Address : 'not found',
        time: item.Track_datetime,
        type: item.type,
        battery: item.Battery,
        gps: item.Gps,
        wifi: item.Wifi,
        developerMode: item.developerMode,
        mobile_name: item.Mobile_name,
        geofence: item.geofence,
      });

      if (
        !item.Lattitude ||
        !item.Longitude ||
        item.Lattitude == 'not found' ||
        item.Longitude == 'not found'
      )
        continue;
      if (!lat || !long) {
        lat = item.Lattitude;
        long = item.Longitude;
      }

      var lat1 = parseFloat(lat);
      var lat2 = parseFloat(item.Lattitude);
      var lon1 = parseFloat(long);
      var lon2 = parseFloat(item.Longitude);

      let kms = Number(calcCrow(lat1, lon1, lat2, lon2))
        ? Number(calcCrow(lat1, lon1, lat2, lon2))
        : 0;
      if (
        item.type == 'punchin' ||
        item.type == 'checkin' ||
        item.type == 'checkout' ||
        item.type == 'punchout'
      ) {
        kmData.push(item);
        if (+kms > 0.085) {
          km += kms;
          lat = item.Lattitude;
          long = item.Longitude;
        }
      } else {
        if (+kms > 0.085) {
          km += kms;
          kmData.push(item);
          lat = item.Lattitude;
          long = item.Longitude;
        }
      }
    }
    // const findKM = await TrackingKM.findOne({
    //   raw: true,
    //   where: { userMasterID: userMasterID, date: date },
    // });
    if (findKM) km = findKM.kilometer;
    km = km.toFixed(2);

    // let get_one_data4 = await Visit.count({
    //   where: {
    //     [Sequelize.Op.and]: [
    //       Sequelize.where(
    //         sequelize.fn('date', sequelize.col('visitDate')),
    //         '=',
    //         date
    //       ),
    //     ],
    //     assignID: userMasterID,
    //     status: 1,
    //   },
    // });

    // let totalAmount = await UserExpenseTransaction.findOne({
    //   where: {
    //     [Sequelize.Op.and]: [
    //       { '$userExpense.userMasterID$': userMasterID },
    //       Sequelize.where(
    //         sequelize.fn('date', sequelize.col('expense_date')),
    //         '=',
    //         date
    //       ),
    //     ],
    //   },
    //   attributes: [
    //     [sequelize.fn('sum', sequelize.col('expenseAmount')), 'total_amount'],
    //   ],
    //   include: [
    //     {
    //       model: UserExpense,
    //       as: 'userExpense',
    //       attributes: ['userMasterID'],
    //     },
    //   ],
    //   group: ['userExpense.userMasterID'],
    //   raw: true,
    // });
    let department =
      get_one_data1?.employeeDepartments?.[0]?.department?.departmentName || '';
    let designation =
      get_one_data1?.employeeDesignations?.[0]?.designation?.designationName ||
      '';

    let finalresp = {
      tracking: kmData,
      trackingPoints: finalTracking,
      trackingKM: km,
      user: get_one_data1.displayName,
      firstName: get_one_data1.firstName,
      lastName: get_one_data1.lastName,
      photo: get_one_data1.photo,
      department: department,
      designation: designation,
      totalVisit: get_one_data4,
      totalExpense: totalAmount == null ? 0 : totalAmount.total_amount,
    };

    return res.status(200).json({
      status: 200,
      message: message.usermessage.trackingget,
      data: finalresp,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.postTrackingBulkDayWise = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate)
      return res
        .status(200)
        .json({ status: 401, message: 'Please Pass Valid Parameters' });

    const allUser = await UserTracking.findAll({
      where: { trackStatus: 1 },
      raw: true,
      attributes: ['userMasterID'],
    });
    let count = 0;
    for (const user of allUser) {
      count++;
      const tracking = await Tracking.findAll({
        where: {
          userMasterID: user.userMasterID,
          Track_datetime: {
            [Sequelize.Op.gte]: fromDate,
            [Sequelize.Op.lt]: toDate,
          },
        },
        order: [['Track_datetime', 'ASC']],
      });
      for (const trackData of tracking) {
        if (
          !trackData.Lattitude ||
          !trackData.Longitude ||
          trackData.Lattitude === 'not found' ||
          trackData.Longitude === 'not found'
        )
          continue;

        let date = null;
        let findKM = null;

        if (!date) {
          date = asiaKolkataDateTime(trackData.Track_datetime).slice(0, 10);
          findKM = await TrackingKM.findOne({
            where: {
              userMasterID: user.userMasterID,
              date: date,
            },
          });
        }

        const currTrackingDate = asiaKolkataDateTime(
          trackData.Track_datetime
        ).slice(0, 10);
        if (currTrackingDate !== date) {
          date = currTrackingDate;
          findKM = await TrackingKM.findOne({
            where: {
              userMasterID: user.userMasterID,
              date: date,
            },
          });
        }

        if (!findKM) {
          findKM = await TrackingKM.create({
            userMasterID: trackData.userMasterID,
            Lattitude: trackData.Lattitude,
            Longitude: trackData.Longitude,
            date: date,
            kilometer: 0,
            UserTrackingID: trackData.UserTrackingID,
            Address: item.Address,
            Track_datetime: item.Track_datetime,
            Battery: item.Battery,
            Gps: item.Gps,
            Wifi: item.Wifi,
            Mobile_name: item.Mobile_name,
            type: item.type,
            developerMode: item.developerMode,
            geofence: item.geofence,
          });
        } else {
          const lat1 = parseFloat(findKM.Lattitude);
          const lat2 = parseFloat(trackData.Lattitude);
          const lon1 = parseFloat(findKM.Longitude);
          const lon2 = parseFloat(trackData.Longitude);

          const kms = calcCrow(lat1, lon1, lat2, lon2);

          if (+kms > 0.085) {
            await TrackingKM.update(
              {
                Lattitude: trackData.Lattitude,
                Longitude: trackData.Longitude,
                kilometer: (+findKM.kilometer + kms).toFixed(2),
                UserTrackingID: trackData.UserTrackingID,
                Address: trackData.Address,
                Track_datetime: trackData.Track_datetime,
                Battery: trackData.Battery,
                Gps: trackData.Gps,
                Wifi: trackData.Wifi,
                Mobile_name: trackData.Mobile_name,
                type: trackData.type,
                developerMode: trackData.developerMode,
                geofence: trackData.geofence,
              },
              { where: { TrackingKMID: findKM.TrackingKMID } }
            );
            findKM = await TrackingKM.findOne({
              raw: true,
              where: {
                userMasterID: trackData.userMasterID,
                date: date,
              },
            });
          }
        }
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.Trackingadd,
      dataLength: allUser.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserTrackingInfo = async (req, res, next) => {
  try {
    const { userMasterID, date } = req.body;

    let get_one_data = await Tracking.findAll({
      where: {
        [Sequelize.Op.and]: [
          Sequelize.where(
            sequelize.fn('date', sequelize.col('Track_datetime')),
            '=',
            date
          ),
        ],
        userMasterID: userMasterID,
      },
      attributes: [
        'Address',
        'Track_datetime',
        'Battery',
        'Gps',
        'Wifi',
        'Mobile_name',
        'type',
        'developerMode',
      ],
      order: [['Track_datetime', 'ASC']],
    });

    // Preparing tracking points based on the required fields
    const trackingPoints = get_one_data
      .map((item) => ({
        address:
          item.Address !== 'not found' ? item.Address : 'Address Not Found',
        time: item.Track_datetime,
        type: item.type,
        battery: item.Battery,
        gps: item.Gps,
        wifi: item.Wifi,
        mobile_name: item.Mobile_name,
        developerMode: item.developerMode,
      }))
      // Filter out items where type is null or empty
      .filter((item) => item.type);

    return res.status(200).json({
      status: 200,
      message: message.usermessage.trackingget,
      data: trackingPoints,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getActiveUserandTrackingUserCount = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID } = req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

    const findActiveUserCount = await UserMaster.findAll({
      where: {
        status: 1,
        companyMasterId: companyMasterID,
      },
      attributes: userAttributes,
      include: [
        {
          required: branchMasterID && branchMasterID.length ? true : false,
          model: EmployeeBranch,
          where: {
            status: 1,
            ...(branchMasterID &&
              branchMasterID.length && { branchID: branchMasterID }),
            applicableDate: { [Sequelize.Op.lte]: currentDate },
            [Sequelize.Op.or]: [
              { endDate: { [Sequelize.Op.gte]: currentDate } },
              { endDate: { [Sequelize.Op.is]: null } },
            ],
          },
          attributes: ['branchID'],
        },
        {
          required: false,
          model: UserTracking,
          as: 'userTracking',
          where: {
            trackStatus: 1,
          },
        },
      ],
    });

    const findTrackingUserCount = findActiveUserCount.filter(
      (e) => e.userTracking.length
    ).length;

    return res.status(200).json({
      status: 200,
      data: {
        activeUser: findActiveUserCount.length,
        trackingUser: findTrackingUserCount,
      },
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

exports.getTrackingGeoFenceWiseData = async (req, res, next) => {
  try {
    const { companyMasterID, branchMasterID, page, limit, type } = req.body;
    const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const paginationQuery = {};

    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const trackingSubquery = `( 
  SELECT t."geofence"
  FROM "Trackings" t
  WHERE t."userMasterID" = "userMaster"."userMasterID"
    AND DATE(t."Track_datetime") = '${currentDate}'
  ORDER BY t."Track_datetime" DESC
  LIMIT 1
)`;
    let geofenceWhere = {};

    if (type === geoFenseType.INSIDE || type === geoFenseType.OUTSIDE) {
      geofenceWhere = Sequelize.where(
        Sequelize.literal(trackingSubquery),
        type
      );
    } else if (type === geoFenseType.OFFLINE) {
      geofenceWhere = Sequelize.where(
        Sequelize.literal(`NOT EXISTS (
      SELECT 1 FROM "Trackings" t
      WHERE t."userMasterID" = "userMaster"."userMasterID"
        AND DATE(t."Track_datetime") = '${currentDate}'
    )`),
        true
      );
    } else if (type === geoFenseType.GPS_OFF) {
      geofenceWhere = {
        [Sequelize.Op.and]: [
          Sequelize.where(
            Sequelize.literal(`EXISTS (
          SELECT 1 FROM "Trackings" t
          WHERE t."userMasterID" = "userMaster"."userMasterID"
          AND DATE(t."Track_datetime") = '${currentDate}'
        )`),
            true
          ),
          Sequelize.where(
            Sequelize.literal(`(
          SELECT t."Gps"
          FROM "Trackings" t
          WHERE t."userMasterID" = "userMaster"."userMasterID"
          AND DATE(t."Track_datetime") = '${currentDate}'
          ORDER BY t."Track_datetime" DESC
          LIMIT 1
        )`),
            'off'
          ),
        ],
      };
    }
    const { rows: findActiveUserCount, count } =
      await UserMaster.findAndCountAll({
        distinct: true,
        where: {
          status: 1,
          companyMasterId: companyMasterID,
          ...(type &&
            [
              geoFenseType.INSIDE,
              geoFenseType.OUTSIDE,
              geoFenseType.OFFLINE,
              geoFenseType.GPS_OFF,
            ].includes(type) && {
              [Sequelize.Op.and]: [geofenceWhere],
            }),
        },

        ...paginationQuery,
        attributes: userAttributes,
        order: [['displayName', 'ASC']],

        include: [
          {
            required: false,
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
          },
          {
            required: false,
            model: EmployeeDepartment,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: currentDate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: currentDate } },
                { endDate: { [Sequelize.Op.is]: null } },
              ],
            },
            attributes: ['departmentID'],
            include: [
              {
                model: Department,
                as: 'department',
                attributes: ['departmentName'],
              },
            ],
          },
          {
            required: branchMasterID && branchMasterID.length ? true : false,
            model: EmployeeBranch,
            where: {
              status: 1,
              ...(branchMasterID &&
                branchMasterID.length && { branchID: branchMasterID }),
              applicableDate: { [Sequelize.Op.lte]: currentDate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: currentDate } },
                { endDate: { [Sequelize.Op.is]: null } },
              ],
            },
            attributes: ['branchID'],
            include: [
              {
                model: BranchMaster,
                as: 'branchMaster',
                attributes: ['branchName'],
              },
            ],
          },
          {
            required: false,
            model: EmployeeDesignation,
            where: {
              status: 1,
              applicableDate: { [Sequelize.Op.lte]: currentDate },
              [Sequelize.Op.or]: [
                { endDate: { [Sequelize.Op.gte]: currentDate } },
                { endDate: { [Sequelize.Op.is]: null } },
              ],
            },
            attributes: ['designationID'],
            include: [
              {
                model: Designation,
                as: 'designation',
                attributes: ['designationName'],
              },
            ],
          },
          {
            required: true,
            model: UserTracking,
            as: 'userTracking',
            where: {
              trackStatus: 1,
            },
          },
          {
            required: false,
            separate: false,
            model: Tracking,
            where: Sequelize.where(
              Sequelize.fn('DATE', Sequelize.col('Track_datetime')),
              currentDate
            ),
            order: [['Track_datetime', 'DESC']],
            limit: 1,
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: findActiveUserCount,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
