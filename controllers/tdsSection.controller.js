const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const tdsSection = require('../models/tdsSection');
const tdsSubSection = require('../models/tdsSubSection');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const path = require('path');

exports.addtdsSection = async (req, res, next) => {
  try {
    const { tdsSectionName, tdsSectionDescription, createBy, createByIp } =
      await req.body;

 
      await tdsSection.create(
        {
          tdsSectionName,
          tdsSectionDescription,
          createBy,
          createByIp,
        },
        {
          user: req.userDetails
        }
      );

    res.status(200).json({
      status: 200,
      message: 'TDS Section added successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTdsSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { tdsSectionName, tdsSectionDescription, updateBy, updateByIp } =
      await req.body;

  
      await tdsSection.update(
        {
          tdsSectionName,
          tdsSectionDescription,
          updateBy,
          updateByIp,
        },
        {
          where: { tdsSectionID: id },
         
        }
      );
   
    res.status(200).json({
      status: 200,
      message: 'TDS Section updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { status, updateBy, updateByIp } = await req.body;

    if (status == 2 || status == 0) {
      const data = await tdsSubSection.findOne({
        where: {
          tdsSectionID: id,
          status: 1,
        },
      });

      if (data)
        return res.status(200).json({
          status: 401,
          message:
            'You cannot delete or deactivate these TDS section due to a subsection is assigned with these section',
        });
    }

    const toupdatedata = {};

    toupdatedata.status = status;
    if (status == 1 || status == 0)
      (toupdatedata.updateBy = updateBy),
        (toupdatedata.updateByIp = updateByIp);
    else if (status == 2)
      (toupdatedata.deleteBy = updateBy),
        (toupdatedata.deleteByIp = updateByIp);

  
      await tdsSection.update(toupdatedata, {
        where: {
          tdsSectionID: id,
        }
      });
    

    res.status(200).json({
      status: 200,
      message:
        status == 0
          ? 'TDS Section deactived successfully.'
          : status == 1
            ? 'TDS Section activated successfully.'
            : status == 2
              ? 'TDS Section deleted successfully.'
              : '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery, exportData, exportFileType } =
      await req.query;

    const paginate =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    condition.status = [0, 1];

    if (searchQuery) {
      condition[Op.or] = [
        { tdsSectionName: { [Op.iLike]: `%${searchQuery}%` } },
        { tdsSectionDescription: { [Op.iLike]: `%${searchQuery}%` } },
      ];
    }
    const { rows: data, count: totalcount } = await tdsSection.findAndCountAll({
      raw: true,
      where: condition,
      ...paginate,
      order: [['createdAt', 'DESC']],
      attributes: [
        'tdsSectionID',
        'tdsSectionName',
        'tdsSectionDescription',
        'status',
        'createdAt',
      ],
    });

    if (exportData) {
      for (let item of data)
        delete item.status,
          delete item.createdAt,
          (item.tdsSectionDescription = item.tdsSectionDescription.replace(
            /<[^>]*>/g,
            ''
          ));
      await generateExcel(data, 'TDS Section', exportFileType, res);
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

    const data = await tdsSection.findOne({
      where: {
        tdsSectionID: id,
        status: [0, 1],
      },
    });

    if (!data) {
      return res.status(200).json({
        status: 401,
        message: 'No data found',
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

exports.uploadSection = async (req, res) => {
  if (!req.file) return res.status(400).send('Please upload an excel file!');

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      const Sections = [];

      rows.forEach((row) => {
        const section = {
          tdsSectionName: row[0],
          tdsSectionDescription: row[1],
          status: 1,
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        };
        Sections.push(section);
      });

      await sequelize.transaction(async (t) => {
        await tdsSection
          .bulkCreate(Sections, { transaction: t })
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
