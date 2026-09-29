const Sequelize = require('sequelize');
const logger = require('../config/logger');
const BranchMaster = require('../models/branchMaster');
const WorkingLocation = require('../models/workingLocation');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const CompanyMaster = require('../models/companyMaster');
const CityMaster = require('../models/citymaster');
const UserMaster = require('../models/userMaster');
const readXlsxFile = require('read-excel-file/node');
const jwt = require('jsonwebtoken');
const { executeQuery } = require('./common.controller');
const {
  generateExcel,
  genrateDemoExcelForWorkingLocation,
} = require('../utils/exportData');
const companyMaster = require('../models/companyMaster');
const StateMaster = require('../models/statemaster');
const EmployeeWorkingLocation = require('../models/employeeWorkingLocation');
const CountryMaster = require('../models/countrymaster');
const fs = require('fs');
const path = require('path');
exports.postAddWorkingLocation = async (req, res, next) => {
  try {
    let {
      companyMasterID,
      // branchMasterID,
      workingLocationName,
      workingLocationAddress,
      cityMasterID,
      latitude,
      longitude,
      radius,
      createBy,
      createByIp,
    } = await req.body;

    workingLocationName = workingLocationName.trim();
    radius = radius === '' || radius === undefined ? null : radius;

    // Check if workingLocationName contains only text
    if (!/^[a-zA-Z\s]+$/.test(workingLocationName)) {
      return res.status(200).json({
        status: 400,
        message: 'Working Location Name should only contain letters.',
        data: {},
      });
    }

    let uniquedata = await WorkingLocation.findOne({
      where: {
        workingLocationName: {
          [Sequelize.Op.iLike]: workingLocationName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
    });

    if (uniquedata) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Working Location'),
        data: {},
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await WorkingLocation.create(
          {
            companyMasterID,
            workingLocationName,
            // branchMasterID,
            workingLocationAddress,
            cityMasterID,
            latitude,
            longitude,
            radius,
            createBy,
            createByIp,
          },
          { transaction: t }
        );

        return res.status(200).json({
          status: 200,
          message: 'Working Location added successfully',
          data: insert_db_status,
        });
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getWorkingLocationById = async (req, res, next) => {
  try {
    let get_one_data = await WorkingLocation.findOne({
      where: {
        workingLocationID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
      include: [
        {
          model: companyMaster,
        },
        // {
        //   model: BranchMaster,
        // },
        {
          model: CityMaster,
          include: [
            {
              model: StateMaster,
            },
          ],
        },
      ],
    });

    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.postUpdateWokingLocation = async (req, res, next) => {
  try {
    let {
      workingLocationID,
      // branchMasterID,
      companyMasterID,
      workingLocationName,
      workingLocationAddress,
      cityMasterID,
      latitude,
      longitude,
      radius,
      updateBy,
      updateByIp,
    } = await req.body;
    workingLocationName = workingLocationName.trim();

    radius = radius == '' || radius == undefined ? null : radius;

    // Check if workingLocationName contains only text
    if (!/^[a-zA-Z\s]+$/.test(workingLocationName)) {
      return res.status(200).json({
        status: 400,
        message: 'Working Location Name should only contain letters.',
        data: {},
      });
    }

    let uniquedata = await WorkingLocation.findOne({
      where: {
        workingLocationName: {
          [Sequelize.Op.iLike]: workingLocationName,
        },
        companyMasterID: companyMasterID,
        // branchMasterID: branchMasterID,
        workingLocationID: { [Sequelize.Op.notIn]: [workingLocationID] },
        status: 1,
      },
    });

    if (uniquedata) {
      res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Working Location'),
        data: {},
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let change_data_status = await WorkingLocation.update(
          {
            // branchMasterID,
            companyMasterID,
            workingLocationName,
            workingLocationAddress,
            cityMasterID,
            latitude,
            longitude,
            radius,
            updateBy,
            updateByIp,
          },
          {
            where: { workingLocationID: workingLocationID },
            transaction: t,
          }
        );

        res.status(200).json({
          status: 200,
          message: 'Working Location updated successfully',
        });
        return change_data_status;
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { workingLocationID, status } = await req.body;
    let delete_status;

    let data = await EmployeeWorkingLocation.findOne({
      where: {
        workingLocationIDs: {
          [Sequelize.Op.contains]: [workingLocationID],
        },
        status: 1,
      },
    });

    if (data && Number(status) == 0) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not Deactive this Working Location. Already assigned to employees.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        delete_status = await WorkingLocation.update(
          {
            status: status,
          },
          {
            where: { workingLocationID: workingLocationID, status: ['1', '0'] },
            transaction: t,
          }
        );
      });
    }

    if (delete_status) {
      return res.status(200).json({
        status: 200,
        message: 'Working Location deleted successfully',
        data: {},
      });
    } else {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 200;
    }
    next(err);
  }
};

exports.postDeleteWorkingLocationById = async (req, res, next) => {
  try {
    let { workingLocationID } = await req.body;

    let data = await EmployeeWorkingLocation.findOne({
      where: {
        workingLocationIDs: {
          [Sequelize.Op.contains]: [workingLocationID],
        },
        status: 1,
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Working Location. Already assigned to employees.',
      });
    } else {
      await WorkingLocation.update(
        {
          status: 2,
        },
        {
          where: { workingLocationID: workingLocationID },
        }
      );
      return res.status(200).json({
        status: 200,
        message: 'Working Location deleted successfully',
      });
    }
  } catch (err) {
    if (!err.statusCode) {
      res.status(200).json({ status: 401, message: err.message, data: {} });
    }
    next(err);
  }
};

exports.getWorkingLocationReports = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      workingLocationID,
      startDate,
      endDate,
      exportData,
      exportFileType,
      companyMasterID,
      childCompany,
      status,
      searchQuery,
    } = await req.body;

    const condition = {};
    condition.status = status;

    condition.companyMasterID = companyMasterID;

    if (workingLocationID) condition.workingLocationID = workingLocationID;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [['createdAt', 'DESC']];

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          workingLocationName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$companyMaster.companyName$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];

    if (startDate && endDate)
      condition.createdAt = {
        [Sequelize.Op.between]: [
          new Date(startDate),
          new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)),
        ],
      };

    console.log(condition);
    const Working_Location = await WorkingLocation.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        { model: companyMaster },
        { model: CityMaster },
        // { model: BranchMaster },
      ],
    });

    // if (exportData) {
    //   await generateExcel(WL, 'WL Report', exportFileType, res);
    // }

    return res.status(200).json({
      status: 200,
      data: Working_Location.rows,
      totalcount: Working_Location.count,
    });
  } catch (e) {
    next(e);
  }
};

exports.validateUploadExcel = async (req, res, next) => {
  if (!req.file) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const rows = await readXlsxFile(filePath);

    // Skip header
    rows.shift();

    const data = [];
    for (const row of rows) {
      if (row[0] != null && row[0].trim() != '') {
        let cityid = await CityMaster.findOne({
          where: { cityName: { [Sequelize.Op.iLike]: row[5] } },
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                  required: true,
                },
              ],
              required: true,
            },
          ],
        });
        // let branchId = await BranchMaster.findOne({
        //   where: {
        //     branchName: { [Sequelize.Op.iLike]: row[0] },
        //     status: [0, 1],
        //   },
        // });

        let workingLocationMaster = {
          // branchMasterID: row[0].trim(),
          workingLocationName: row[0].trim(),
          latitude: row[1],
          longitude: row[2],
          radius: row[3],
          workingLocationAddress: row[4],
          cityMasterID: row[5],
          companyMasterID: req.body.companyMasterID,
          remarks: '',
          countryMasterID: '',
          stateMasterID: '',
        };

        // if (branchId) {
        //   workingLocationMaster.branchMasterID = branchId.branchMasterID;
        // } else {
        //   workingLocationMaster.remarks = 'Branch Name Is Not Exist';
        // }

        if (cityid) {
          workingLocationMaster.cityMasterID = cityid.cityMasterID;
          workingLocationMaster.countryMasterID =
            cityid.stateMaster.countryMaster.countryMasterID;
          workingLocationMaster.stateMasterID =
            cityid.stateMaster.stateMasterID;
        } else {
          workingLocationMaster.remarks =
            'Working Location City Name Not Exist';
        }
        const duplicateInExcel = data.find(
          (s) =>
            s.workingLocationName &&
            typeof s.workingLocationName === 'string' &&
            s.workingLocationName.toLowerCase() ===
              workingLocationMaster.workingLocationName.toLowerCase()
        );

        if (duplicateInExcel) {
          workingLocationMaster.remarks =
            'Duplicate Working Location Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            workingLocationName: {
              [Sequelize.Op.iLike]: workingLocationMaster.workingLocationName,
            },
          };

          const uniquedata = await WorkingLocation.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            workingLocationMaster.remarks = 'Working Location Already Exists';
          }
        }
        data.push(workingLocationMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingLocationValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateWorkingLocation = async (req, res, next) => {
  try {
    const { workingLocationData, companyMasterID } = req.body;

    let data = [];

    for (const row of workingLocationData) {
      // Ensure the row is an object and has the required fields
      if (row.workingLocationName && row.workingLocationName.trim() !== '') {
        let workingLocationMaster = {
          // branchMasterID: row.branchMasterID,
          workingLocationName: row.workingLocationName.trim(),
          latitude: row.latitude || '',
          longitude: row.longitude || '',
          radius: row.radius || null,
          workingLocationAddress: row.workingLocationAddress,
          cityMasterID: row.cityMasterID,
          countryMasterID: row.countryMasterID,
          stateMasterID: row.stateMasterID,

          remarks: '',
        };

        // Check for duplicates in `data` array
        const duplicateInData = data.some(
          (s) =>
            s.workingLocationName.trim().toLowerCase() ===
            workingLocationMaster.workingLocationName.trim().toLowerCase()
        );

        if (duplicateInData) {
          workingLocationMaster.remarks =
            'Duplicate Working Location Name in Data';
        } else {
          // Check for duplicates in the database
          const condition = {
            companyMasterID: companyMasterID,
            status: [0, 1],
            workingLocationName: {
              [Sequelize.Op.iLike]: workingLocationMaster.workingLocationName,
            },
            // branchMasterID: workingLocationMaster.branchMasterID,
          };

          const uniquedata = await WorkingLocation.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            workingLocationMaster.remarks = 'Working Location Already Exists';
          }
        }

        data.push(workingLocationMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingLocationReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
exports.addValidateWorkingLocation = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { workingLocationData, companyMasterID } = req.body;

    await WorkingLocation.bulkCreate(
      workingLocationData.map((item) => ({
        // branchMasterID: item.branchMasterID,
        workingLocationName: item.workingLocationName.trim(),
        latitude: item.latitude || '',
        longitude: item.longitude || '',
        radius: item.radius ? item.radius : null,
        workingLocationAddress: item.workingLocationAddress,
        cityMasterID: item.cityMasterID,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.workingLocationadd,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page, companyMasterID } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['cityName', 'ASC']];
    const cityData = await CityMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });

    const cityNames = cityData.rows.map((row) => row.cityName);

    await genrateDemoExcelForWorkingLocation(
      cityNames,
      'Demo Working Location',
      'xlsx',
      res
    );
  } catch (err) {
    next(err);
  }
};
