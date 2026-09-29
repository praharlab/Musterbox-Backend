const Sequelize = require('sequelize');
const Ndacategory = require('../models/Ndacategory');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const CompanyMasters = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const xlsx = require('xlsx');
const employeeNda = require('../models/employeeNda');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');

const path = require('path');

// upload excel NDA
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

    let nda = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const nda_category = data[i][0];

        // Check if the nda_category category already exists (case-insensitive)
        const existingNDA = await Ndacategory.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('nda_category')),
              nda_category.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('nda_category')),
              nda_category.toString().toUpperCase()
            )
          ),
        });

        if (existingNDA) {
          nda.push(data[i][0]);
        } else {
          await Ndacategory.create({
            nda_category: data[i][0],
            companyMasterID: req.body.companyMasterID,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (nda.length > 0) {
      res.status(200).json({
        status: 200,
        message: `NDA categories '${nda.join(
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

exports.postAddcategory = async (req, res, next) => {
  try {
    let = { nda_category, companyMasterID, status, createBy, createByIp } =
      await req.body;
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await Ndacategory.create(
        {
          nda_category,
          companyMasterID,
          status,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.ndacategory,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};
// / **//
//  return all employee data
//  */

exports.getAllcategoryData = async (req, res, next) => {
  try {
    let { limit, page } = await req.body;
    let offset = (page - 1) * limit;
    let category = [];
    if (limit == '' && page == '') {
      category = await Ndacategory.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });
    } else {
      category = await Ndacategory.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        limit: limit,
        offset: offset,
      });
    }

    const totalcount = await Ndacategory.count({
      raw: true,
      where: { status: ['0', '1'] },
    });

    res
      .status(200)
      .json({ status: 200, data: category, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with  Ndacategoryid id
 *
 * @param {id}  Ndacategoryid  to fetch data
 */

exports.getcategoryById = async (req, res, next) => {
  try {
    let get_one_data = await Ndacategory.findOne({
      where: {
        Ndacategoryid: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

// find data by company master id

exports.getuserCompanyId = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let ndacategory;

    if (page == '' && limit == '') {
      ndacategory = await Ndacategory.findAll({
        where: {
          companyMasterID: companyMasterID,
          //  status: 1
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
        include: [{ model: CompanyMasters }],
      });
    } else {
      ndacategory = await Ndacategory.findAll({
        where: {
          companyMasterID: companyMasterID,
          // status: 1
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },

        limit: limit,
        offset: offset,
        include: [{ model: CompanyMasters }],
      });
    }
    const totalcount = await Ndacategory.count({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: ['0', '1'],
      },
    });

    res
      .status(200)
      .json({ status: 200, data: ndacategory, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

//searchquery by companyid

exports.getbyCompanyId = async (req, res, next) => {
  try {
    const { companyMasterID, limit, page, searchQuery, exportData } =
      await req.body;

    const condition = {};

    condition.status = [0, 1];

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          nda_category: {
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

    const ndaCategory = await Ndacategory.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      include: [
        {
          model: CompanyMasters,
          as: 'companyMaster',
          attributes: ['companyName'],
        },
      ],
    });

    for (var j = 0; j < ndaCategory.rows.length; j++) {
      let user1 = await UserMaster.findOne({
        where: {
          userMasterID: ndaCategory.rows[j].createBy,
        },
      });
      let user2 = await UserMaster.findOne({
        where: {
          userMasterID: ndaCategory.rows[j].updateBy,
        },
      });

      if (user1) {
        ndaCategory.rows[j].createBy = user1.dataValues.displayName;
      }
      if (user2) {
        ndaCategory.rows[j].updateBy = user2.dataValues.displayName;
      }
    }

    if (exportData) {
      const finalData = [];

      for (let i = 0; i < ndaCategory.rows.length; i++) {
        const data1 = {
          NdaCategory: ndaCategory.rows[i].nda_category,
          CompanyName: ndaCategory.rows[i].companyMaster.companyName,
          Status: ndaCategory.rows[i].status,
        };
        data1.Status == 1
          ? (data1.Status = 'Active')
          : (data1.Status = 'Deactive');

        finalData.push(data1);
      }

      await generateExcel(finalData, 'NDACategory', 'xlsx', res);
      return;
    }

    return res.status(200).json({
      status: 200,
      data: ndaCategory.rows,
      totalcount: ndaCategory.count,
    });
  } catch (err) {
    next(err.message);
  }
};

// //update the user data

exports.postupdateeNdacategoryData = async (req, res, next) => {
  try {
    let = {
      Ndacategoryid,
      nda_category,
      companyMasterID,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let data = await Ndacategory.update(
        {
          nda_category,
          companyMasterID,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { Ndacategoryid: Ndacategoryid },
        }
      );

      res.status(200).json({
        status: 200,
        msg: data,
        message: message.usermessage.ndaupdate,
      });
      return data;
    });
  } catch (err) {
    next(err);
  }
};

// /*
// *
// delete by id
// * Delete User category by   Ndacategoryid
// *
// */

exports.postdeletecategory = async (req, res, next) => {
  try {
    let ID = await req.params.id;

    let data = await employeeNda.findOne({
      where: {
        Ndacategoryid: ID,
        status: ['0', '1'],
      },
    });
    if (data) {
      return res.status(200).json({
        status: 401,
        message:
          'You can not delete this Nda Category.Already assigned to employees.',
      });
    } else {
      let result = await sequelize.transaction(async (t) => {
        let delete_status = await Ndacategory.update(
          {
            status: 2,
          },
          {
            where: { Ndacategoryid: ID },
            transaction: t,
          }
        );

        res
          .status(200)
          .json({ status: 200, message: message.usermessage.ndadelete });
        return delete_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { Ndacategoryid, status } = await req.body;
    let delete_status;

    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await Ndacategory.update(
          {
            status: '1',
          },
          {
            where: { Ndacategoryid: Ndacategoryid },
            transaction: t,
          }
        );
      } else {
        let data = await employeeNda.findOne({
          where: {
            Ndacategoryid: Ndacategoryid,
            status: ['0', '1'],
          },
        });
        if (data) {
          return res.status(200).json({
            status: 401,
            message:
              'You can not deactivate this Nda Category.Already assigned to employees.',
          });
        } else {
          delete_status = await Ndacategory.update(
            {
              status: '0',
            },
            {
              where: { Ndacategoryid: Ndacategoryid },
              transaction: t,
            }
          );
        }
      }

      res.status(200).json({
        status: 200,
        message: message.usermessage.deletedrecord,
        data: {},
      });
    });
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
        const ndaCategory = row[0]; // Assuming the department name is in the first column
        let ndaCategoryMaster = {
          nda_category: ndaCategory,
          companyMasterID: req.body.companyMasterID,
          remarks: '',
        };

        const duplicateInExcel = data.find(
          (s) =>
            s.nda_category &&
            typeof s.nda_category === 'string' &&
            s.nda_category.toLowerCase() ===
              ndaCategoryMaster.nda_category.toLowerCase()
        );

        if (duplicateInExcel) {
          ndaCategoryMaster.remarks = 'Duplicate NDA Category Name in Excel';
        } else {
          const condition = {
            companyMasterID: req.body.companyMasterID,
            status: [0, 1],
            nda_category: {
              [Sequelize.Op.iLike]: ndaCategoryMaster.nda_category,
            },
          };

          const uniquedata = await Ndacategory.findAll({
            where: condition,
          });

          if (uniquedata.length > 0) {
            ndaCategoryMaster.remarks = 'NDA Category Already Exists';
          }
        }

        data.push(ndaCategoryMaster);
      }
    }

    res.status(200).json({
      status: 200,
      message: message.usermessage.ndaCategoryValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.reValidateNdaCategory = async (req, res, next) => {
  try {
    const { ndaCategory, companyMasterID } = req.body;

    let data = [];
    for (const row of ndaCategory) {
      if (row != null && row != '') {
        let ndaCategoryMaster = {
          nda_category: row.trim(),
          remarks: '',
        };
        const duplicateInData = data.some(
          (s) =>
            s.nda_category.trim().toLowerCase() ===
            ndaCategoryMaster.nda_category.trim().toLowerCase()
        );

        if (duplicateInData) {
          ndaCategoryMaster.remarks = 'Duplicate NDA Category in Data';
        } else {
          const condition = {};
          condition.companyMasterID = companyMasterID;
          condition.status = [0, 1];
          condition.nda_category = {
            [Sequelize.Op.iLike]: ndaCategoryMaster.nda_category,
          };
          let uniquedata = await Ndacategory.findAll({
            where: condition,
          });
          if (uniquedata && uniquedata.length > 0) {
            ndaCategoryMaster.remarks = 'NDA Category Already Exists';
          }
        }

        data.push(ndaCategoryMaster);
      }
    }
    return res.status(200).json({
      status: 200,
      message: message.usermessage.ndaCategoryReValidate,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};

exports.addValidateNdaCategory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { ndaCategory, companyMasterID } = req.body;

    await Ndacategory.bulkCreate(
      ndaCategory.map((item) => ({
        nda_category: item.trim(),
        companyMasterID,
        status: 1,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      })),
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.ndacategory,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
