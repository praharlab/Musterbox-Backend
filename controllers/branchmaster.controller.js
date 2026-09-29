const Sequelize = require('sequelize');
const BranchMaster = require('../models/branchMaster');
const logger = require('../config/logger');
const sequelize = require('../config/database');
const message = require('../response_message/message');
const CompanyMaster = require('../models/companyMaster');
const CityMaster = require('../models/citymaster');
const UserMaster = require('../models/userMaster');
const readXlsxFile = require('read-excel-file/node');
const jwt = require('jsonwebtoken');
const Employeebranch = require('../models/employeeBranch');

const { executeQuery } = require('./common.controller');

const {
  generateExcel,
  genrateDemoExcelForBranch,
} = require('../utils/exportData');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const { roleType } = require('../utils/dbUtils');
const fs = require('fs');
const path = require('path');
const { userAttributes } = require('../utils/commonVars');
/**
 * save branch data.
 *
 * @body {createBy} createBy user id of user who added the branch.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      companyMasterID,
      branchName,
      branchCode,
      branchAddress,
      cityMasterID,
      latitude,
      longitude,
      radius,
      gstNumber,
      lwfNumber,
      professionaltaxNumber,
      pfNumber,
      esicNumber,
    } = await req.body;
    branchName = branchName.trim();

    radius = radius == '' || radius == undefined ? null : radius;

    const uniquedata = await BranchMaster.findOne({
      where: {
        branchName: {
          [Sequelize.Op.iLike]: branchName,
        },
        companyMasterID: companyMasterID,
        status: 1,
      },
      transaction,
    });

    if (uniquedata) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Branch'),
        data: {},
      });
    }
    await BranchMaster.create(
      {
        companyMasterID,
        branchName,
        branchCode,
        branchAddress,
        cityMasterID,
        latitude,
        longitude,
        radius,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
        gstNumber,
        lwfNumber,
        professionaltaxNumber,
        pfNumber,
        esicNumber,
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Branch'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * find data with branchMaster id
 *
 * @param {id} branchMasterID  to fetch branch name
 */

exports.getBranchById = async (req, res, next) => {
  try {
    let get_one_data = await BranchMaster.findOne({
      where: {
        branchMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyName'],
        },
        {
          model: CityMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
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
    next(err);
  }
};

/**
 * find data with companyMaster id
 *
 * @param {id} companyMasterID  to fetch branch name
 */

exports.getBranchByCompanyId = async (req, res, next) => {
  try {
    if (req.userDetails && req.userDetails.role) {
      if (req.userDetails.role.roleType == roleType.BRANCH_WISE) {
        let get_one_data = await BranchMaster.findAll({
          where: {
            branchMasterID: req.userDetails.accessibleBranches,
            status: 1,
          },
          raw: true,
          include: 'companyMaster',
        });

        return res.status(200).json(get_one_data);
      }
    }

    let get_one_data = await BranchMaster.findAll({
      where: {
        companyMasterID: req.params.id,
        status: 1,
      },
      raw: true,
      include: 'companyMaster',
    });
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json(get_one_data);
  } catch (err) {
    next(err);
  }
};

/**
 * find data with cityMaster id
 *
 * @param {id} cityMasterID  to fetch branch name
 */

exports.getBranchByCityId = async (req, res, next) => {
  try {
    let get_one_data = await BranchMaster.findOne({
      where: {
        cityMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
      include: 'companyMaster',
    });
    if (!get_one_data)
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    else res.status(200).json(get_one_data);
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} branchMasterID  to update id
 */
exports.postUpdateBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      branchMasterID,
      companyMasterID,
      branchName,
      branchCode,
      branchAddress,
      cityMasterID,
      latitude,
      longitude,
      radius,
      updateBy,
      updateByIp,
      gstNumber,
      lwfNumber,
      professionaltaxNumber,
      pfNumber,
      esicNumber,
    } = await req.body;
    branchName = branchName.trim();

    radius = radius == '' || radius == undefined ? null : radius;

    const uniquedata = await BranchMaster.findOne({
      where: {
        branchName: {
          [Sequelize.Op.iLike]: branchName,
        },
        companyMasterID: companyMasterID,
        branchMasterID: { [Sequelize.Op.notIn]: [branchMasterID] },
        status: 1,
      },
      transaction,
    });

    if (uniquedata) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Branch With Same Name'),
        data: {},
      });
    }

    await BranchMaster.update(
      {
        branchMasterID,
        companyMasterID,
        branchName,
        branchCode,
        branchAddress,
        cityMasterID,
        latitude,
        longitude,
        radius,
        updateBy,
        updateByIp,
        gstNumber,
        lwfNumber,
        professionaltaxNumber,
        pfNumber,
        esicNumber,
      },
      {
        where: { branchMasterID: branchMasterID },
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Branch'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} branchMasterID  to delete id
 */
exports.postDeleteBranchById = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { branchMasterID } = await req.body;

    const findBranchData = await Employeebranch.findOne({
      where: {
        branchID: branchMasterID,
        status: [0, 1],
      },
      include: [
        {
          required: true,
          model: UserMaster,
          as: 'employee',
          where: {
            status: [0, 1],
          },
        },
      ],
    });

    if (findBranchData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyAssign('Branch', 'Deleted'),
      });
    }

    await BranchMaster.update(
      {
        status: 2,
      },
      {
        where: { branchMasterID: branchMasterID },
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Branch'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { branchMasterID, status } = await req.body;

    const findBranchData = await BranchMaster.findOne({
      where: {
        branchMasterID: branchMasterID,
        status: [0, 1],
      },
      transaction,
    });

    if (!findBranchData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Branch'),
      });
    }

    if (status === '0') {
      const findEmployeeBranch = await Employeebranch.findOne({
        where: {
          branchID: branchMasterID,
          status: [0, 1],
        },
        include: [
          {
            required: true,
            model: UserMaster,
            as: 'employee',
            where: {
              status: [0, 1],
            },
          },
        ],
        transaction,
      });
      if (findEmployeeBranch) {
        await transaction.rollback();
        return res.status(200).json({
          status: 401,
          message: message.usermessage.alreadyAssign('Branch', 'deactivate'),
        });
      }
    }

    await BranchMaster.update(
      {
        status: status,
      },
      {
        where: { branchMasterID: branchMasterID },
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Branch')
          : message.usermessage.deactiveMessage('Branch'),
      data: {},
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getAllBranchDataByCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    if (req.userDetails && req.userDetails.role) {
      if (req.userDetails.role.roleType == roleType.BRANCH_WISE) {
        condition.branchMasterID = req.userDetails.accessibleBranches;
      }
    }

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          branchName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          branchCode: {
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

    const { rows: branchData, count } = await BranchMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyName'],
        },
        {
          model: CityMaster,
          attributes: ['cityName', 'stateMasterID'],
          include: [
            {
              model: StateMaster,
              attributes: ['stateName', 'countryMasterID'],
              include: [
                {
                  model: CountryMaster,
                  attributes: ['countryName'],
                },
              ],
            },
          ],
        },
      ],
    });
    const uniqueUserIds = new Set();
    branchData.map((row) => {
      if (row.createBy) {
        uniqueUserIds.add(+row.createBy);
      }
      if (row.updateBy) {
        uniqueUserIds.add(+row.updateBy);
      }
    });
    const userData = await UserMaster.findAll({
      raw: true,
      where: {
        userMasterID: [...uniqueUserIds],
        status: [0, 1],
      },
      attributes: userAttributes,
    });

    for (const branch of branchData) {
      const createUser = userData.find(
        (e) => e.userMasterID == branch.createBy
      );
      branch.createBy = createUser ? createUser.displayName : branch.createBy;
      if (branch.updateBy) {
        const updateUser = userData.find(
          (e) => e.userMasterID == branch.updateBy
        );
        branch.updateBy = updateUser ? updateUser.displayName : branch.updateBy;
      }
    }

    if (exportData) {
      const finalData = [];
      for (const branch of branchData) {
        const data1 = {
          BranchName: branch.branchName,
          BranchCode: branch.branchCode,
          BranchAddress: branch.branchAddress,
          CompanyName: branch['companyMaster.companyName'],
          CityName: branch['cityMaster.cityName'],
          StateName: branch['cityMaster.stateMaster.stateName'],
          CountryName:
            branch['cityMaster.stateMaster.countryMaster.countryName'],
          GstNumber: branch.gstNumber,
          LwfNumber: branch.lwfNumber,
          ProfessionaltaxNumber: branch.professionaltaxNumber,
          PfNumber: branch.pfNumber,
          EsicNumber: branch.esicNumber,
          Status: branch.status == 1 ? 'Active' : 'Deactive',
        };
        finalData.push(data1);
      }

      await generateExcel(finalData, 'branch', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: branchData,
      totalcount: count,
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getactivebranchbycompanyid = async (req, res, next) => {
  try {
    let branch;
    const condition = {};
    condition.companyMasterID = req.params.id;

    if (req.userDetails && req.userDetails.role) {
      if (req.userDetails.role.roleType == roleType.BRANCH_WISE) {
        condition.branchMasterID = req.userDetails.accessibleBranches;
      }
    }

    branch = await BranchMaster.findAll({
      where: condition,
      raw: true,
    });

    return res.status(200).json({ status: 200, data: branch });
  } catch (err) {
    next(err);
  }
};

exports.uploadexcel = async (req, res) => {
  if (req.file == undefined) {
    return res
      .status(200)
      .send({ status: 400, message: 'Please upload an excel file!' });
  }

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);
  try {
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      let branch = [];
      rows.forEach((row) => {
        if (
          row[0] != null &&
          row[1] != null &&
          row[2] != null &&
          row[3] != null &&
          row[0].trim() != '' &&
          row[1].trim() != '' &&
          row[2].trim() != '' &&
          row[3].trim() != ''
        ) {
          let branchmaster = {
            branchName: row[0].trim(),
            branchCode: row[1],
            branchAddress: row[2],
            cityMasterID: row[3],
            companyMasterID: req.body.companyMasterID,
            status: 1,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          };
          branch.push(branchmaster);
        }
      });
      let data = [];
      for (var i = 0; i < branch.length; i++) {
        if (data.length > 0) {
          const result = data.filter(
            (s) =>
              s.branchName.toLowerCase() == branch[i].branchName.toLowerCase()
          );

          if (result.length > 0) {
            return res.status(200).send({
              status: 401,
              message:
                'Duplicate Branch Name Exist In Excel.' + result[0].branchName,
            });
          }
        }

        let uniquedata = await executeQuery(
          `
           
select * from "branchMasters" where LOWER(TRIM("branchName")) ='` +
            branch[i].branchName.trim().toLowerCase() +
            `' and "companyMasterID" = ` +
            req.body.companyMasterID +
            ` and status in(0,1) `
        );
        if (uniquedata.length > 0) {
          return res.status(200).json({
            status: 401,
            message: 'Branch Already Exist ' + uniquedata[0].branchName,
            data: {},
          });
        } else {
          let cityid = await CityMaster.findOne({
            where: { cityName: branch[i].cityMasterID },
          });
          branch[i].cityMasterID = cityid.cityMasterID;
        }

        data.push(branch[i]);
      }
      BranchMaster.bulkCreate(branch).catch((error) => {
        res.status(200).send({
          status: 401,
          message: 'Fail to import excel! ' + error.message,
          error: error.message,
        });
      });
      res.status(200).json({
        status: 200,
        message: message.usermessage.branchadd,
        data: data,
      });
    });
  } catch (error) {
    res.status(500).send({
      message: 'Could not upload the file: ' + req.file.originalname,
    });
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
          where: { cityName: { [Sequelize.Op.iLike]: row[3] } },
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

        let branchMaster = {
          branchName: row[0].trim(),
          branchCode: row[1],
          branchAddress: row[2],
          cityMasterID: row[3],
          latitude: row[4],
          longitude: row[5],
          radius: row[6],
          gstNumber: row[7],
          lwfNumber: row[8],
          professionaltaxNumber: row[9],
          pfNumber: row[10],
          esicNumber: row[11],
          companyMasterID: req.body.companyMasterID,
          remarks: '',
          countryMasterID: '',
          stateMasterID: '',
        };

        if (cityid) {
          branchMaster.cityMasterID = cityid.cityMasterID;
          branchMaster.countryMasterID =
            cityid.stateMaster.countryMaster.countryMasterID;
          branchMaster.stateMasterID = cityid.stateMaster.stateMasterID;
        } else {
          branchMaster.remarks = 'Branch City Name Not Exist';
        }
        const duplicateInExcel = data.find(
          (s) =>
            s.branchName &&
            typeof s.branchName === 'string' &&
            s.branchName.toLowerCase() === branchMaster.branchName.toLowerCase()
        );

        if (duplicateInExcel) {
          branchMaster.remarks = 'Duplicate Branch Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            branchName: {
              [Sequelize.Op.iLike]: branchMaster.branchName,
            },
          };

          const uniquedata = await BranchMaster.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            branchMaster.remarks = 'Branch Already Exists';
          }
        }
        data.push(branchMaster);
      }
    }
    fs.unlink(filePath, function (err) {
      if (err) console.log(err);
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.branchValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.revalidateBranch = async (req, res, next) => {
  try {
    const { branchData, companyMasterID } = req.body;

    let data = [];

    for (const row of branchData) {
      // Ensure the row is an object and has the required fields
      if (row.branchName && row.branchName.trim() !== '') {
        let branchMaster = {
          branchName: row.branchName.trim(),
          branchCode: row.branchCode,
          branchAddress: row.branchAddress,
          cityMasterID: row.cityMasterID,
          latitude: row.latitude || '',
          longitude: row.longitude || '',
          radius: row.radius || '',
          gstNumber: row.gstNumber || '',
          lwfNumber: row.lwfNumber || '',
          professionaltaxNumber: row.professionaltaxNumber || '',
          pfNumber: row.pfNumber || '',
          esicNumber: row.esicNumber || '',
          remarks: '',
          countryMasterID: row.countryMasterID,
          stateMasterID: row.stateMasterID,
        };

        // Check for duplicates in `data` array
        const duplicateInData = data.some(
          (s) =>
            s.branchName.trim().toLowerCase() ===
            branchMaster.branchName.trim().toLowerCase()
        );

        if (duplicateInData) {
          branchMaster.remarks = 'Duplicate Branch Name in Data';
        } else {
          // Check for duplicates in the database
          const condition = {
            companyMasterID: companyMasterID,
            status: [0, 1],
            branchName: {
              [Sequelize.Op.iLike]: branchMaster.branchName,
            },
          };

          const uniquedata = await BranchMaster.findAll({
            where: condition,
          });

          if (uniquedata && uniquedata.length > 0) {
            branchMaster.remarks = 'Branch Already Exists';
          }
        }

        data.push(branchMaster);
      }
    }

    return res.status(200).json({
      status: 200,
      message: message.usermessage.branchReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateBranch = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { branchData, companyMasterID } = req.body;

    await BranchMaster.bulkCreate(
      branchData.map((item) => ({
        branchName: item.branchName.trim(),
        branchCode: item.branchCode,
        branchAddress: item.branchAddress,
        cityMasterID: item.cityMasterID,
        latitude: item.latitude,
        longitude: item.longitude,
        radius: item.radius ? item.radius : null,
        gstNumber: item.gstNumber,
        lwfNumber: item.lwfNumber,
        professionaltaxNumber: item.professionaltaxNumber,
        pfNumber: item.pfNumber,
        esicNumber: item.esicNumber,
        companyMasterID,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.branchadd,
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.generateDemoExcel = async (req, res, next) => {
  try {
    const { limit, page } = await req.body;
    const condition = {};
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['cityName', 'ASC']];
    const { rows, count } = await CityMaster.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
    });
    const cityNames = rows.map((row) => row.cityName);
    await genrateDemoExcelForBranch(cityNames, 'Demo Branch', 'xlsx', res);
  } catch (err) {
    next(err);
  }
};
