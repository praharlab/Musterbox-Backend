const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const tdsSubSection = require('../models/tdsSubSection');
const tdsSection = require('../models/tdsSection');
const { Op } = require('sequelize');
const { generateExcel } = require('../utils/exportData');
const readXlsxFile = require('read-excel-file/node');
const fs = require('fs');
const TdsSubSectionCategory = require('../models/tdsSubSectionCategory');
const path = require('path');

exports.addtdsSubSection = async (req, res, next) => {
  try {
    const {
      tdsSectionID,
      tdsSubSectionName,
      tdsSubSectionDescription,
      tdsSubSectionCategoryID,
      createBy,
      createByIp,
    } = await req.body;

  
      await tdsSubSection.create(
        {
          tdsSubSectionName,
          tdsSubSectionDescription,
          tdsSectionID,
          tdsSubSectionCategoryID,
          createBy,
          createByIp,
        },
        {
          user: req.userDetails,
         
        }
      );
  
    res.status(200).json({
      status: 200,
      message: 'TDS Subsection added successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.updatetdsSubSection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      tdsSectionID,
      tdsSubSectionName,
      tdsSubSectionDescription,
      tdsSubSectionCategoryID,
      updateBy,
      updateByIp,
    } = await req.body;

      await tdsSubSection.update(
        {
          tdsSubSectionName,
          tdsSubSectionDescription,
          tdsSubSectionCategoryID,
          tdsSectionID,
          updateBy,
          updateByIp,
        },
        {
          where: { tdsSubSectionID: id },
        }
      );
    
    res.status(200).json({
      status: 200,
      message: 'TDS Subsection updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { status, updateBy, updateByIp } = await req.body;

    const toupdatedata = {};

    toupdatedata.status = status;

    if (status == 1 || status == 0)
      (toupdatedata.updateBy = updateBy),
        (toupdatedata.updateByIp = updateByIp);
    else if (status == 2)
      (toupdatedata.deleteBy = updateBy),
        (toupdatedata.deleteByIp = updateByIp);

   
      await tdsSubSection.update(toupdatedata, {
        where: {
          tdsSubSectionID: id,
        },
      
      });
    

    res.status(200).json({
      status: 200,
      message:
        status == 0
          ? 'TDS Subsection deactived successfully.'
          : status == 1
            ? 'TDS Subsection activated successfully.'
            : status == 2
              ? 'TDS Subsection deleted successfully.'
              : '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      searchQuery,
      tdsSectionID,
      tdsSubSectionCategoryID,
      exportData,
      exportFileType,
    } = await req.query;

    const paginate = !exportData
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const condition = {};

    condition.status = [0, 1];

    if (tdsSectionID) condition.tdsSectionID = tdsSectionID;

    if (tdsSubSectionCategoryID)
      condition.tdsSubSectionCategoryID = tdsSubSectionCategoryID;

    if (searchQuery) {
      condition[Op.or] = [
        { tdsSubSectionName: { [Op.iLike]: `%${searchQuery}%` } },
        { tdsSubSectionDescription: { [Op.iLike]: `%${searchQuery}%` } },
        { '$tdsSection.tdsSectionName$': { [Op.iLike]: `%${searchQuery}%` } },
        {
          '$tdsSection.tdsSectionDescription$': {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          '$tdsSubSectionCategory.categoryName$': {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];
    }
    const { rows: data, count: totalcount } =
      await tdsSubSection.findAndCountAll({
        raw: true,
        where: condition,
        ...paginate,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: tdsSection,
            attributes: ['tdsSectionName', 'tdsSectionDescription'],
          },
          {
            model: TdsSubSectionCategory,
            attributes: ['categoryName'],
          },
        ],
      });

    if (exportData) {
      const finalData = [];
      for (let item of data) {
        let tempObj = {
          'TDS Subsection Name': item.tdsSubSectionName,
          'TDS Subsection Description': item.tdsSubSectionDescription.replace(
            /<[^>]*>/g,
            ''
          ),
          'TDS Section Name': item['tdsSection.tdsSectionName'],
          'TDS Section Description': item[
            'tdsSection.tdsSectionDescription'
          ].replace(/<[^>]*>/g, ''),
          'TDS Sub Section Category':
            item['tdsSubSectionCategory.categoryName'],
        };
        finalData.push(tempObj);
      }
      await generateExcel(finalData, 'TDS Subsection', exportFileType, res);
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

    const data = await tdsSubSection.findOne({
      where: {
        tdsSubSectionID: id,
        status: [0, 1],
      },
      include: [
        {
          model: tdsSection,
          attributes: ['tdsSectionName', 'tdsSectionDescription'],
        },
      ],
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

exports.uploadSubSection = async (req, res) => {
  if (!req.file) return res.status(400).send('Please upload an excel file!');

  const filePath = path.join(__dirname, `../uploads/${req.file.filename}`);

  try {
    readXlsxFile(filePath).then(async (rows) => {
      // skip header
      rows.shift();
      const Sections = [];

      // await Promise.all(
      // rows.map(async (row) => {
      for (const row of rows) {
        const sectionData = await tdsSection.findOne({
          where: Sequelize.and(
            Sequelize.where(
              sequelize.fn(
                'TRIM',
                sequelize.fn('LOWER', sequelize.col('tdsSectionName'))
              ),
              String(row[3]).trim().toLowerCase()
            ),
            Sequelize.where(sequelize.col('status'), 1)
          ),
        });

        if (!sectionData) {
          return res.status(200).send({
            status: 401,
            message: 'Cannot find Section ' + row[3],
          });
        }

        let categoryID = null;

        if (row[4]) {
          const category = await TdsSubSectionCategory.findOne({
            raw: true,
            where: Sequelize.and(
              Sequelize.where(
                sequelize.fn(
                  'TRIM',
                  sequelize.fn('LOWER', sequelize.col('categoryName'))
                ),
                String(row[4]).trim().toLowerCase()
              ),
              Sequelize.where(sequelize.col('status'), 1)
            ),
          });

          if (!category) {
            return res.status(200).send({
              status: 401,
              message: 'Cannot find Category Name ' + row[4],
            });
          }

          categoryID = category.tdsSubSectionCategoryID;
        }

        const section = {
          tdsSubSectionName: row[0],
          tdsSubSectionDescription: row[1],
          maxLimit: row[2],
          tdsSectionID: sectionData.tdsSectionID,
          status: 1,
          tdsSubSectionCategoryID: categoryID,
          createBy: req.body.createBy,
          createByIp: req.body.createByIp,
        };

        Sections.push(section);
      }
      // );

      await sequelize.transaction(async (t) => {
        await tdsSubSection
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
