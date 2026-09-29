const { Op } = require('sequelize');
const SN_Code = require('../models/sn_code');
const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');

const { generateExcel } = require('../utils/exportData');
const UserMaster = require('../models/userMaster');
const { executeQuery } = require('./common.controller');
const {
  employeeBranch,
  employeeDepartment,
  employeeDesignation,
} = require('../utils/commonUtilFunctions');
const companyMaster = require('../models/companyMaster');
const { accessibleUsers } = require('../utils/commonUtilFunctions');
const path = require('path');
const { ProjectName } = require('../utils/labelUtils');

exports.addsn_code = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      sn_code,
      partner_code,
      userMasterID,
      createBy,
      createByIp,
    } = await req.body;

    // const UniqueData = await executeQuery(
    //   `SELECT * from "sn_codes" as sn INNER join "userMasters" as um on um."userMasterID"=sn."userMasterID" where sn."status"=1 and LOWER(TRIM(sn."sn_code"))='` +
    //     sn_code.trim().toLowerCase() +
    //     `'OR LOWER(TRIM(sn."partner_code"))='` +
    //     partner_code.trim().toLowerCase() +
    //     `' and um."companyMasterId"=` +
    //     companyMasterID
    // );

    const UniqueData = await SN_Code.findAll({
      include: [
        {
          model: UserMaster,
          where: {
            companyMasterId: companyMasterID,
          },
        },
      ],
      where: {
        status: 1,
        [Op.or]: [
          { sn_code: { [Op.eq]: sn_code.trim().toLowerCase() } },
          {
            partner_code: {
              [Op.eq]: partner_code.trim().toLowerCase(),
            },
          },
        ],
      },
    });

    if (UniqueData.length > 0) {
      return res.status(200).send({
        status: 401,
        message: 'User with same Code already exist',
        data: UniqueData,
      });
    }

    const uniqueUser = await SN_Code.findOne({
      where: { userMasterID: userMasterID, status: 1 },
      raw: true,
    });

    if (uniqueUser) {
      return res.status(200).send({
        status: 401,
        message: 'User already exist',
      });
    }

    await SN_Code.create({
      sn_code: sn_code.trim(),
      partner_code: partner_code.trim(),
      userMasterID,
      createBy,
      createByIp,
    });
    return res.status(200).json({
      status: 200,
      message: `SN_Code and ${ProjectName}_Code added successfully`,
    });
  } catch (error) {
    next(error);
  }
};

exports.updatesn_code = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      sn_codeID,
      sn_code,
      partner_code,
      userMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    // const UniqueData = await executeQuery(
    //   `SELECT * from "sn_codes" as sn INNER join "userMasters" as um on um."userMasterID"=sn."userMasterID" where sn."status"=1 and LOWER(TRIM(sn."sn_code"))='` +
    //     sn_code.trim().toLowerCase() +
    //     `'and LOWER(TRIM(sn."partner_code"))='` +
    //     partner_code.trim().toLowerCase() +
    //     `' and um."companyMasterId"=` +
    //     companyMasterID +
    //     ` and sn."sn_codeID"!=` +
    //     sn_codeID
    // );

    const UniqueData = await SN_Code.findAll({
      include: [
        {
          model: UserMaster,
          where: {
            companyMasterId: companyMasterID,
          },
        },
      ],
      where: {
        status: 1,
        [Op.or]: [
          { sn_code: { [Op.eq]: sn_code.trim().toLowerCase() } },
          {
            partner_code: {
              [Op.eq]: partner_code.trim().toLowerCase(),
            },
          },
        ],
        sn_codeID: {
          [Op.ne]: sn_codeID,
        },
      },
    });

    if (UniqueData.length > 0) {
      return res.status(200).send({
        status: 401,
        message: 'User with same Code already exist',
      });
    }

    const uniqueUser = await SN_Code.findOne({
      where: {
        userMasterID: userMasterID,
        status: 1,
        sn_codeID: { [Sequelize.Op.ne]: sn_codeID },
      },
      raw: true,
    });

    if (uniqueUser) {
      return res.status(200).send({
        status: 401,
        message: 'User already exist',
      });
    }

    await SN_Code.update(
      {
        sn_code,
        partner_code,
        updateBy,
        updateByIp,
      },
      { where: { sn_codeID: sn_codeID } }
    );
    return res.status(200).json({
      status: 200,
      message: 'SN_Code updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id, status, updateBy, updateByIp } = await req.body;

    const toupdatedata = {};

    toupdatedata.status = status;
    if (status == 1 || status == 0)
      (toupdatedata.updateBy = updateBy),
        (toupdatedata.updateByIp = updateByIp);

    await SN_Code.update(toupdatedata, {
      where: {
        sn_codeID: id,
      },
    });

    res.status(200).json({
      status: 200,
      message:
        status == 0
          ? 'SN Code deactived successfully.'
          : status == 1
            ? 'SN Code activated successfully.'
            : status == 2
              ? 'SN Code deleted successfully.'
              : '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      page,
      limit,
      searchQuery,
      exportData,
      exportFileType,
    } = await req.body;

    const paginate =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    condition.status = [0, 1];
    if (companyMasterID) {
      req.userDetails.accessibleCompanies = companyMasterID;
      condition['$userMaster.companyMasterId$'] = companyMasterID;
    }

    if (searchQuery) {
      condition[Op.or] = [
        { sn_code: { [Op.iLike]: `%${searchQuery}%` } },
        { partner_code: { [Op.iLike]: `%${searchQuery}%` } },
        { '$userMaster.displayName$': { [Op.iLike]: `%${searchQuery}%` } },
      ];
    }
    const { rows: data, count: totalcount } = await SN_Code.findAndCountAll({
      raw: true,
      where: condition,
      ...paginate,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: UserMaster,
          attributes: ['displayName', 'userNumber'],
          required: true,
          ...accessibleUsers(req.userDetails, true, false),
          include: [
            {
              model: companyMaster,
              attributes: ['companyName'],
            },
          ],
        },
      ],
    });

    for (var item of data) {
      const Branch = await employeeBranch(item.userMasterID, new Date());
      const Department = await employeeDepartment(
        item.userMasterID,
        new Date()
      );
      const Designation = await employeeDesignation(
        item.userMasterID,
        new Date()
      );

      item.branch = Branch ? Branch['branchMaster.branchName'] : '';
      item.department = Department
        ? Department['department.departmentName']
        : '';
      item.designation = Designation
        ? Designation['designation.designationName']
        : '';
    }

    if (exportData) {
      const finalData = [];
      for (var item of data) {
        let temp = {
          'Company Name': item['userMaster.companyMaster.companyName'],
          'Employee Name': item['userMaster.displayName'],
          'Employee Number': item['userMaster.userNumber'],
          Branch: item.branch,
          Department: item.department,
          Designation: item.designation,
          'SN Code': item.sn_code,
          'Partner Code': item.partner_code,
        };
        finalData.push(temp);
      }
      await generateExcel(finalData, 'SN_Code', exportFileType, res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: data,
      totalcount: totalcount,
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await SN_Code.findOne({
      where: {
        sn_codeID: id,
        status: [0, 1],
      },
      include: [
        {
          model: UserMaster,
        },
      ],
    });

    if (!data) {
      return res.status(200).json({
        status: 200,
        message: 'No data found',
        data: {},
      });
    }

    return res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.uploadSNCodes = async (req, res, next) => {
  if (!req.file) return res.status(400).send('Please upload an excel file!');

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    const { companyMasterID, createBy, createByIp } = req.body;

    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      const SNCODES = [];

      for (var row of rows) {
        console.log(row, '---');
        const UniqueData = await executeQuery(
          `SELECT * from "sn_codes" as sn INNER join "userMasters" as um on um."userMasterID"=sn."userMasterID" where sn."status"=1 and LOWER(TRIM(sn."sn_code"))='` +
            row[1].toString().trim().toLowerCase() +
            `'or LOWER(TRIM(sn."partner_code"))='` +
            row[1].toString().trim().toLowerCase() +
            `' and um."companyMasterId"=` +
            companyMasterID
        );
        if (UniqueData.length > 0) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err.message}`);
            } else {
              console.log('File deleted successfully', filePath);
            }
          });
          return res.status(200).send({
            status: 401,
            message: 'Code ' + row[1] + ' has already been assigned',
          });
        }

        const user = await UserMaster.findOne({
          where: {
            userNumber: row[0].toString().trim(),
            status: 1,
            companyMasterId: companyMasterID,
          },
          raw: true,
        });
        console.log(user, '---');

        if (!user) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err.message}`);
            } else {
              console.log('File deleted successfully', filePath);
            }
          });
          return res.status(200).send({
            status: 401,
            message: 'User with Number ' + row[0] + ' does not exist',
          });
        }

        const uniqueUser = await SN_Code.findOne({
          where: { userMasterID: user.userMasterID, status: 1 },
          raw: true,
        });

        if (uniqueUser) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file: ${err.message}`);
            } else {
              console.log('File deleted successfully', filePath);
            }
          });
          return res.status(200).send({
            status: 401,
            message:
              'User with Number ' +
              row[0] +
              ' has already been assigned with SN Code',
          });
        }

        const sncode = {
          sn_code: row[1],
          partner_code: row[2],
          userMasterID: user.userMasterID,
          createBy,
          createByIp,
        };
        SNCODES.push(sncode);
      }

      await sequelize.transaction(async (t) => {
        await SN_Code.bulkCreate(SNCODES, { transaction: t })
          .then(() => {
            fs.unlink(filePath, (err) => {
              if (err) {
                console.error(`Error deleting file: ${err.message}`);
              } else {
                console.log('File deleted successfully', filePath);
              }
            });

            return res.status(200).send({
              status: 200,
              message: 'File uploaded successfully' + req.file.originalname,
            });
          })
          .catch((error) => {
            return res.status(200).send({
              status: 401,
              message: 'Fail to import data into database!' + error.message,
              error: error.message,
            });
          });
      });
    });
  } catch (error) {
    next(error);
  }
};
