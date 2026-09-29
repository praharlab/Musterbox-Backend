const ModuleDetails = require('../models/moduleDetails');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const ModuleList = require('../models/moduleList');
const xlsx = require('xlsx');
const path = require('path');

exports.postAddModuleDetails = async (req, res, next) => {
  try {
    let = {
      moduleDetailsID,
      moduleId,
      FAQs,
      Description,
      createBy,
      createByIp,
    } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let insert_db_status = await ModuleDetails.create(
        {
          moduleDetailsID,
          moduleId,
          FAQs,
          Description,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.ModuleDetailsadd,
        data: insert_db_status,
      });
      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} moduleDetailsID  to update id
 */
exports.postUpdatemoduleDetails = async (req, res, next) => {
  try {
    let {
      moduleDetailsID,
      moduleId,
      FAQs,
      Description,
      status,
      updateBy,
      updateByIp,
    } = await req.body;

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ModuleDetails.update(
        {
          moduleDetailsID,
          moduleId,
          FAQs,
          Description,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { moduleDetailsID: moduleDetailsID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.ModuleDetailsupdate,
      });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getmoduledetailsId = async (req, res, next) => {
  try {
    let get_one_data = await ModuleDetails.findOne({
      where: { moduleDetailsID: req.params.id, status: ['0', '1'] },
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

exports.getAllModuleDetails = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let module_details, totalcount;

    if (searchQuery && page && limit) {
      module_details = await ModuleDetails.findAll({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              '$ModuleList.moduleName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            { FAQs: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          status: ['0', '1'],
        },
        include: [
          {
            model: ModuleList,
            attributes: ['moduleName'],
          },
        ],
        limit: limit,
        offset: offset,
      });

      totalcount = await ModuleDetails.count({
        raw: true,
        where: {
          [Sequelize.Op.or]: [
            {
              '$ModuleList.moduleName$': {
                [Sequelize.Op.iLike]: '%' + searchQuery + '%',
              },
            },
            { FAQs: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          ],
          status: ['0', '1'],
        },
        include: [
          {
            model: ModuleList,
            attributes: ['moduleName'],
          },
        ],
      });

      console.log(module_details, 'moduledetails');
      // totalcount = module_details.length;
    } else {
      module_details = await ModuleDetails.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: ['0', '1'],
          },
        },
        include: [
          {
            model: ModuleList,
            attributes: ['moduleName'],
          },
        ],
        limit: limit,
        offset: offset,
      });

      totalcount = await ModuleDetails.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    }

    res
      .status(200)
      .json({ status: 200, data: module_details, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} moduleDetailsID  to delete id
 */
exports.postDeletemoduleDetailsById = async (req, res, next) => {
  try {
    let { moduleDetailsID } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ModuleDetails.update(
        {
          status: '2',
        },
        {
          where: { moduleDetailsID: moduleDetailsID },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.Modulenamedelete });
      return delete_status;
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 401;
    }
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { moduleDetailsID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ModuleDetails.update(
          {
            status: '1',
          },
          {
            where: { moduleDetailsID: moduleDetailsID, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await ModuleDetails.update(
          {
            status: '0',
          },
          {
            where: { moduleDetailsID: moduleDetailsID, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.ModuleDetailsdelete,
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

    let modetails = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const FAQs = data[i][0];

        // Check if the FAQs category already exists (case-insensitive)
        const existingModule = await ModuleDetails.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('FAQs')),
              FAQs.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('FAQs')),
              FAQs.toString().toUpperCase()
            )
          ),
        });

        if (existingModule) {
          modetails.push(data[i][0]);
        } else {
          await ModuleDetails.create({
            moduleDetailsID: req.body.moduleDetailsID,
            moduleId: req.body.moduleId,
            moduleName: data[i][0],
            FAQs: data[i][0],
            Description: data[i][0],
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (modetails.length > 0) {
      res.status(200).json({
        status: 200,
        message: `ModuleDetails '${modetails.join(
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
