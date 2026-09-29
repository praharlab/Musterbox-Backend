const Sequelize = require('sequelize');
const VehicleUsage = require('../models/vehicleUsage');
const logger = require('../config/logger');
const message = require('../response_message/message');
const UserMaster = require('../models/userMaster');
const sequelize = require('../config/database');
const EmployeeBranch = require('../models/employeeBranch');
const attendanceTransaction = require('../models/attendanceTransaction');
const BranchMaster = require('../models/branchMaster');
const {
  accessibleUsers,
  asiaKolkataDateTime,
} = require('../utils/commonUtilFunctions');
const { generateExcel } = require('../utils/exportData');

exports.addStartingVehicleUsage = async (req, res, next) => {
  try {
    let {
      userMasterID,
      startingMeterImage,
      startkilometer,
      createBy,
      createByIp,
    } = await req.body;

    let currDate = new Date().toISOString().slice(0, 10);

    let attendance = await attendanceTransaction.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
        Status: 1,
      },
      order: [['AttendanceDate', 'DESC']],
    });

    if (attendance) {
      if (
        attendance.AttendanceDate == currDate &&
        attendance.OutDateTime == null
      ) {
        let result = await sequelize.transaction(async (t) => {
          let insert_db_status = await VehicleUsage.create(
            {
              userMasterID,
              startingMeterImage,
              startkilometer,
              startingDateTime: new Date().toISOString(),
              createBy,
              createByIp,
            },
            { transaction: t }
          );
        });
        return res
          .status(200)
          .json({ status: 200, message: 'Added SuccesFully' });
      } else if (attendance.OutDateTime == null) {
        let diff =
          new Date().getTime() - new Date(attendance.InDatetime).getTime();
        diff = diff / 1000 / 60 / 60;

        if (diff < 12) {
          let result = await sequelize.transaction(async (t) => {
            let insert_db_status = await VehicleUsage.create(
              {
                userMasterID,
                startingMeterImage,
                startkilometer,
                startingDateTime: new Date().toISOString(),
                createBy,
                createByIp,
              },
              { transaction: t }
            );
          });
          return res
            .status(200)
            .json({ status: 200, message: 'Added SuccesFully' });
        } else {
          return res.status(200).json({
            status: 401,
            message: 'You need to punchIN to add vehicle Usage',
          });
        }
      } else {
        return res.status(200).json({
          status: 401,
          message: 'You need to punchIN to add vehicle Usage',
        });
      }
    } else {
      return res.status(200).json({
        status: 401,
        message: 'You need to punchIN to add vehicle Usage',
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.addEndingVehicleUsage = async (req, res, next) => {
  try {
    let {
      vehicleUsageID,
      endingMeterImage,
      endkilometer,
      updateBy,
      updateByIp,
    } = await req.body;

    if (!endingMeterImage) {
      await VehicleUsage.update(
        {
          endingDateTime: new Date().toISOString(),
          endkilometer,
          updateBy,
          updateByIp,
        },
        {
          where: { vehicleUsageID: vehicleUsageID },
        }
      );
      res
        .status(200)
        .json({ status: 200, message: 'EndingMeterImage Added SuccesFully' });
    } else {
      await VehicleUsage.update(
        {
          endingMeterImage,
          endingDateTime: new Date().toISOString(),
          endkilometer,
          updateBy,
          updateByIp,
        },
        {
          where: { vehicleUsageID: vehicleUsageID },
        }
      );
      res
        .status(200)
        .json({ status: 200, message: 'EndingMeterImage Added SuccesFully' });
    }
  } catch (err) {
    next(err);
  }
};
exports.getUserDailyVehicleUsageReport = async (req, res, next) => {
  try {
    const { userMasterID, fromdate, todate, limit, page } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    let fromdate1 = new Date(
      new Date(new Date(fromdate).setHours(0, 0, 0, 0))
        .toString()
        .split('GMT')[0] + ' UTC'
    ).toISOString();
    let enddate1 = new Date(
      new Date(new Date(todate).setHours(23, 59, 59, 999))
        .toString()
        .split('GMT')[0] + ' UTC'
    ).toISOString();

    const vehicleUsageData = await VehicleUsage.findAndCountAll({
      where: {
        userMasterID: {
          [Sequelize.Op.in]: userMasterID,
        },
        startingDateTime: {
          [Sequelize.Op.between]: [new Date(fromdate1), new Date(enddate1)],
        },
        status: 1,
      },
      ...paginationQuery,
      order: [['startingDateTime', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
          attributes: [
            ['displayName', 'displayName'],
            ['userNumber', 'userNumber'],
          ],
        },
      ],
    });

    for (var i = 0; i < vehicleUsageData.rows.length; i++) {
      branch_contact = await EmployeeBranch.findOne({
        raw: true,
        where: {
          userMasterID: vehicleUsageData.rows[i].userMasterID,
          applicableDate: {
            [Sequelize.Op.lte]: vehicleUsageData.rows[i].startingDateTime,
          },
          [Sequelize.Op.or]: [
            { endDate: { [Sequelize.Op.eq]: null } },
            {
              endDate: {
                [Sequelize.Op.gte]: vehicleUsageData.rows[i].startingDateTime,
              },
            },
          ],
          status: 1,
        },
        include: [
          { model: BranchMaster, as: 'branchMaster' },
          { model: UserMaster, as: 'employee' },
        ],
      });

      vehicleUsageData.rows[i].dataValues.branchName = branch_contact
        ? branch_contact['branchMaster.branchName']
        : '';
    }

    return res.json({
      status: 200,
      message: 'Data got successfully',
      data: vehicleUsageData.rows,
      totalcount: vehicleUsageData.count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getVehicleUsageByCompanyId = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      companyMasterID,
      fromdate,
      todate,
      userMasterID,
      branchMasterID,
      Export,
    } = await req.body;


      if (!companyMasterID) {
          return res.status(200).json({
            status: 401,
            message: message.usermessage.ValidParameters,
          });
        }

    req.userDetails.accessibleCompanies = companyMasterID;
    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};
    const { Op } = Sequelize;

    const condition = {
      status: 1,
    };

      if(userMasterID)
      {
      condition.userMasterID = userMasterID;
      }

    if (fromdate && todate) {
      let todate1 = new Date(todate);
      todate1.setDate(todate1.getDate() + 1);

      condition.startingDateTime = {
        [Sequelize.Op.between]: [new Date(fromdate), new Date(todate1)],
      };
    }

    const vehicleUsageAttributes = [
      'vehicleUsageID',
      'userMasterID',
      'startingDateTime',
      'endingDateTime',
      'startkilometer',
      'endkilometer',
      'status',
    ];
    if (!Export) {
      vehicleUsageAttributes.push('startingMeterImage');
      vehicleUsageAttributes.push('endingMeterImage');
    }

    // Fetch vehicle usage along with user and branch data in one query
    const vehicle_Usage = await VehicleUsage.findAndCountAll({
      where: condition,
      attributes: vehicleUsageAttributes,
      ...paginationQuery,

      order: [['vehicleUsageID', 'DESC']],
      include: [
        {
          model: UserMaster,
          required: true,
          ...accessibleUsers(req.userDetails),
          attributes: [
            ['displayName', 'displayName'],
            ['userNumber', 'userNumber'],
          ],
          include: [
            {
              model: EmployeeBranch,
              where: {
                ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: {
                  [Op.lte]: Sequelize.col('vehicleUsage.startingDateTime'),
                },
                [Op.or]: [
                  { endDate: { [Op.eq]: null } },
                  {
                    endDate: {
                      [Op.gte]: Sequelize.col('vehicleUsage.startingDateTime'),
                    },
                  },
                ],
              },
              required: branchMasterID ? true : false,
              attributes: ['branchID'],
              include: [
                {
                  model: BranchMaster,
                  as: 'branchMaster',
                  attributes: ['branchName'],
                },
              ],
            },
          ],
        },
      ],
    });

    if (Export) {
      const finalData = await Promise.all(
        vehicle_Usage.rows.map((e) => {
          return {
            'User Name': e.userMaster.displayName,
            'User Number': e.userMaster.userNumber,
            Branch:
              e.userMaster.employeeBranches.length > 0
                ? e.userMaster.employeeBranches[0].branchMaster.branchName
                : '',
            'Starting Date Time': e.startingDateTime
              ? asiaKolkataDateTime(e.startingDateTime)
              : '',
            StartingMeter: e.startkilometer,
            'Ending Date Time': e.endingDateTime
              ? asiaKolkataDateTime(e.endingDateTime)
              : '',
            EndingMeter: e.endkilometer,
            Kilometer: e.endkilometer
              ? +e.endkilometer - +e.startkilometer
              : '',
          };
        })
      );

      return await generateExcel(
        finalData,
        'Daily Vehicle Usage Report',
        'xlsx',
        res
      );
    }

    // Process the fetched data
    vehicle_Usage.rows.forEach((vehicle) => {
      const branchContact = vehicle.userMaster.employeeBranches[0];
      vehicle.dataValues.branchName = branchContact
        ? branchContact.branchMaster.branchName
        : '';
    });

    return res.status(200).json({
      status: 200,
      data: vehicle_Usage.rows,
      totalcount: vehicle_Usage.count,
    });
  } catch (err) {
    next(err);
  }
};
