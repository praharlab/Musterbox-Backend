const ModuleList = require('../models/moduleList');
const logger = require('../config/logger');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const companyMasters = require('../models/companyMaster');
const sequelize = require('../config/database');
const UserMaster = require('../models/userMaster');
const xlsx = require('xlsx');
const path = require('path');

exports.postAddModule = async (req, res, next) => {
  try {
    const { moduleName, moduleId, createBy, createByIp } = await req.body;

    // Check if a module with the same name already exists
    const existingModule = await ModuleList.findOne({
      where: {
        moduleName: moduleName,
      },
    });

    if (existingModule) {
      // If a module with the same name exists, return an error response
      return res.status(200).json({
        status: 401,
        message: 'Module with the same name already exists',
        data: [],
      });
    }

    // If no module with the same name exists, insert the new module
    const result = await sequelize.transaction(async (t) => {
      const insert_db_status = await ModuleList.create(
        {
          moduleName,
          moduleId,
          createBy,
          createByIp,
        },
        { transaction: t }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.Modulenameadd,
        data: insert_db_status,
      });

      return insert_db_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllModuleList = async (req, res, next) => {
  try {
    let { limit, page, searchQuery } = await req.body;
    let offset = (page - 1) * limit;
    let module_list, totalcount;

    if (searchQuery && page && limit) {
      module_list = await ModuleList.findAll({
        raw: true,
        where: {
          moduleName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },

          // [Sequelize.Op.or]: [
          //   { moduleId: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          //   sequelize.where(
          //     sequelize.cast(sequelize.col('moduleId'), 'varchar'),
          //     { [Sequelize.Op.iLike]: `%${searchQuery}%` }
          //   )
          // ],
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
      });

      totalcount = await ModuleList.count({
        raw: true,
        where: {
          moduleName: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' },

          // [Sequelize.Op.or]: [
          //   { moduleId: { [Sequelize.Op.iLike]: '%' + searchQuery + '%' } },
          //   sequelize.where(
          //     sequelize.cast(sequelize.col('moduleId'), 'varchar'),
          //     { [Sequelize.Op.iLike]: `%${searchQuery}%` }
          //   )
          // ],
          status: ['0', '1'],
        },
      });
    } else if (page && limit) {
      module_list = await ModuleList.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: ['0', '1'],
          },
        },
        limit: limit,
        offset: offset,
        order: [['moduleId', 'ASC']],
      });

      totalcount = await ModuleList.count({
        raw: true,
        where: { status: ['0', '1'] },
      });
    } else {
      module_list = await ModuleList.findAll({
        raw: true,
        where: {
          status: {
            [Sequelize.Op.in]: ['0', '1'],
          },
        },
        order: [['moduleId', 'ASC']],
      });

      totalcount = module_list.length;
    }

    res
      .status(200)
      .json({ status: 200, data: module_list, totalcount: totalcount });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatemoduleList = async (req, res, next) => {
  try {
    let { moduleName, moduleId, status, updateBy, updateByIp } = await req.body;

    const existingModule = await ModuleList.findOne({
      where: {
        moduleName: moduleName,
        moduleId: {
          [Sequelize.Op.ne]: moduleId,
        },
        status: [0, 1],
      },
    });

    if (existingModule) {
      // If a module with the same name exists, return an error response
      return res.status(200).json({
        status: 401,
        message: 'Module with the same name already exists',
        data: [],
      });
    }

    let result = await sequelize.transaction(async (t) => {
      let change_data_status = await ModuleList.update(
        {
          moduleName,
          moduleId,
          status,
          updateBy,
          updateByIp,
        },
        {
          where: { moduleId: moduleId },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.Modulenameupdate });
      return change_data_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.getmodulelistId = async (req, res, next) => {
  try {
    let get_one_data = await ModuleList.findOne({
      where: { moduleId: req.params.id, status: ['0', '1'] },
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
 * delete by i
 *
 * @param {id} moduleId  to delete id
 */
exports.postDeletemoduleById = async (req, res, next) => {
  try {
    let { moduleId } = await req.body;
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await ModuleList.update(
        {
          status: '2',
        },
        {
          where: { moduleId: moduleId },
          transaction: t,
        }
      );

      res
        .status(200)
        .json({ status: 200, message: message.usermessage.Modulenamedelete });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { moduleId, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await ModuleList.update(
          {
            status: '1',
          },
          {
            where: { moduleId: moduleId, status: ['1', '0'] },
            transaction: t,
          }
        );
      } else {
        delete_status = await ModuleList.update(
          {
            status: '0',
          },
          {
            where: { moduleId: moduleId, status: ['1', '0'] },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.Modulenamedelete,
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

    let molist = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        const moduleName = data[i][0];

        // Check if the moduleName category already exists (case-insensitive)
        const existingModule = await ModuleList.findOne({
          where: sequelize.or(
            sequelize.where(
              sequelize.fn('LOWER', sequelize.col('moduleName')),
              moduleName.toString().toLowerCase()
            ),
            sequelize.where(
              sequelize.fn('UPPER', sequelize.col('moduleName')),
              moduleName.toString().toUpperCase()
            )
          ),
        });

        if (existingModule) {
          molist.push(data[i][0]);
        } else {
          await ModuleList.create({
            moduleName: data[i][0],
            moduleId: req.body.moduleId,
            createBy: req.body.createBy,
            createByIp: req.body.createByIp,
          });
        }
      }
    }

    if (molist.length > 0) {
      res.status(200).json({
        status: 200,
        message: `ModuleList '${molist.join(
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
