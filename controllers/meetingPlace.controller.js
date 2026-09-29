const MeetingPlace = require('../models/meetingPlace');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const xlsx = require('xlsx');
const GetPass = require('../models/gatePass');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');
/**
 * save city data.
 *
 * @body {createBy} createBy user id of user who added the city.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */

// upload excel Meeting
exports.uploadexcel = async (req, res) => {
  try {
    if (req.file == undefined) {
      return res
        .status(200)
        .send({ status: 400, message: 'Please upload an excel file!' });
    }

    const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    // Read the Excel file
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Iterate over the rows and insert data into the database

    let meetingplace = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const meetingPlaceName = data[i][0];

        // Check if the nda_category category already exists (case-insensitive)
        const existingMeeting = await MeetingPlace.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('meetingPlaceName')),
              meetingPlaceName.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('meetingPlaceName')),
              meetingPlaceName.toString().toUpperCase()
            )
          ),
        });

        if (existingMeeting) {
          meetingplace.push(data[i][0]);
        } else {
          await MeetingPlace.create({
            meetingPlaceName: data[i][0],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (meetingplace.length > 0) {
      res.status(200).json({
        status: 200,
        message: `meetingplace categories '${meetingplace.join(
          ', '
        )}' already exist in the database.`,
      });
    } else {
      res.status(200).json({
        status: 200,
        message: 'Data inserted successfully',
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
};

exports.postAddmeetingPlace = async (req, res, next) => {
  try {
    let { meetingPlaceName, companyMasterID, status, createBy, createByIp } =
      await req.body;

    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await MeetingPlace.create(
        {
          meetingPlaceName,
          companyMasterID,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.meetingPlaceadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err.message);
  }
};

/**
 * find data with MeetingPlace id
 *
 * @param {id} meetingPlaceID  to fetch city name
 */

exports.getmeetingPlaceId = async (req, res, next) => {
  try {
    let get_one_data = await MeetingPlace.findOne({
      where: { meetingPlaceid: req.params.id, status: ['0', '1'] },
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
 * @param {id} meetingPlaceID  to update id
 */
exports.postUpdatemeetingPlace = async (req, res, next) => {
  try {
    let {
      meetingPlaceid,
      meetingPlaceName,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await MeetingPlace.update(
        {
          meetingPlaceName,
          companyMasterID,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { meetingPlaceid: meetingPlaceid },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.meetingPlaceupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} meetingPlaceID  to delete id
 */
exports.postDeletemeetingPlaceById = async (req, res, next) => {
  try {
    let { meetingPlaceid } = await req.body;

    let data = await GetPass.findOne({
      where: {
        meetingPlaceID: meetingPlaceid,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Meeting Location.Already used in gate pass.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await MeetingPlace.update(
          {
            status: '2',
          },
          {
            where: { meetingPlaceid: meetingPlaceid },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: message.usermessage.meetingPlacedelete,
        });
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { meetingPlaceid, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await MeetingPlace.update(
          {
            status: '1',
          },
          {
            where: { meetingPlaceid: meetingPlaceid, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        let data = await GetPass.findOne({
          where: {
            meetingPlaceID: meetingPlaceid,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Meeting Location.Already used in gate pass.',
          });
        } else {
          delete_status = await MeetingPlace.update(
            {
              status: '0',
            },
            {
              where: { meetingPlaceid: meetingPlaceid, status: ['1', '0'] },
              transaction: t,
            }
          );
        }
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.meetingPlacedelete,
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

exports.getmeetingPlacecompanyid = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          meetingPlaceName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
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

    const meetingPlace = await MeetingPlace.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: companyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
      ],
    });

    for (var j = 0; j < meetingPlace.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: meetingPlace.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: meetingPlace.rows[j].updateBy,
        },
      });

      if (user1) {
        meetingPlace.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        meetingPlace.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < meetingPlace.rows.length; i++) {
        const data1 = {
          MeetingPlaceName: meetingPlace.rows[i].meetingPlaceName,
          CompanyName: meetingPlace.rows[i].companyMaster.companyName,
          Status: meetingPlace.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');
        finalData.push(data1);
      }

      await generateExcel(finalData, 'MeetingPlace', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: meetingPlace.rows,
      totalcount: meetingPlace.count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getmeetingPlaceByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await MeetingPlace.findAll({
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
exports.getactivemeetingPlacebycompanyid = async (req, res, next) => {
  try {
    let meetingPlace;
    const companyid = [];
    companyid.push(parseInt(req.params.id));
    let get_one_data = await companyMasters.findAll({
      where: { parentCompanyMasterID: req.params.id, status: [0, 1] },
    });
    for (var i = 0; i < get_one_data.length; i++) {
      companyid.push(get_one_data[i].companyMasterID);
    }
    meetingPlace = await MeetingPlace.findAll({
      where: {
        companyMasterID: {
          [Sequelize.Op.in]: companyid,
        },
        status: 1,
      },

      include: [{ model: companyMasters }],
    });
    res.status(200).json({ status: 200, data: meetingPlace });
  } catch (err) {
    next(err);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(200)
        .send({ status: 400, message: 'Please upload an excel file!' });
    }

    const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();
    const data = [];

    for (const row of rows) {
      if (row && row.length > 0) {
        const meetingPlaceName = row[0]; // Assuming the Meeting Place name is in the first column
        let meetingPlaceMaster = {
          meetingPlaceName: meetingPlaceName,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.meetingPlaceName &&
            typeof s.meetingPlaceName === 'string' &&
            s.meetingPlaceName.toLowerCase() ===
              meetingPlaceMaster.meetingPlaceName.toLowerCase()
        );

        if (duplicateInExcel) {
          meetingPlaceMaster.remarks = 'Duplicate Meeting Place Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            meetingPlaceName: {
              [Sequelize.Op.iLike]: meetingPlaceMaster.meetingPlaceName,
            },
          };

          const uniquedata = await MeetingPlace.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            meetingPlaceMaster.remarks = 'Meeting Place Already Exists';
          }
        }

        data.push(meetingPlaceMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.meetingPlaceValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateMeetingPlace = async (req, res, next) => {
  try {
    const { meetingPlaceName, companyMasterID } = req.body;

    let data = [];
    for (const row of meetingPlaceName) {
      if (row != null && row != '') {
        let meetingPlaceMaster = {
          meetingPlaceName: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.meetingPlaceName.trim().toLowerCase() ===
            meetingPlaceMaster.meetingPlaceName.trim().toLowerCase()
        );

        if (duplicateInData) {
          meetingPlaceMaster.remarks = 'Duplicate Meeting Place Name in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.meetingPlaceName = {
            [Sequelize.Op.iLike]: meetingPlaceMaster.meetingPlaceName,
          };
          let uniquedata = await MeetingPlace.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            meetingPlaceMaster.remarks = 'Meeting Place Already Exists';
          }
        }

        data.push(meetingPlaceMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.meetingPlaceValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateMeetingPlace = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { meetingPlaceName, companyMasterID } = req.body;

    await MeetingPlace.bulkCreate(
      meetingPlaceName.map((item) => ({
        meetingPlaceName: item.trim(),
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.meetingPlaceadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
