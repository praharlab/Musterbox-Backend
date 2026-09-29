const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const tdsSubSection = require('../models/tdsSubSection');
const TdsSubSectionCategory = require('../models/tdsSubSectionCategory');
const { Op } = require('sequelize');

exports.addData = async (req, res, next) => {
  try {
    const { categoryName, description, createBy, createByIp } = await req.body;


    await TdsSubSectionCategory.create(
      {
        categoryName,
        description,
        createBy,
        createByIp,
      },
      {
        user: req.userDetails,
      }
    );
    return res.status(200).json({
      status: 200,
      message: 'TDS Sub Section Category Added Successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryName, description } = await req.body;


    const tdsSubSectionCategory = await TdsSubSectionCategory.findOne({
      where: {
        tdsSubSectionCategoryID: id,
      },
    });

    if (!tdsSubSectionCategory)
      return res.status(200).json({
        status: 200,
        message: 'TDS Sub Section Category Not Found!',
      });

    tdsSubSectionCategory.categoryName = categoryName;
    tdsSubSectionCategory.description = description;

    await tdsSubSectionCategory.save({
      user: req.userDetails
    });


    return res.status(200).json({
      status: 200,
      message: 'TDS Sub Section Category Updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tdsSubSectionCategorydata = await TdsSubSectionCategory.findOne({
      raw: true,
      where: {
        tdsSubSectionCategoryID: id,
      },
    });

    if (!tdsSubSectionCategorydata)
      return res.status(200).json({
        status: 200,
        message: 'TDS Sub Section Category Not Found!',
      });

    return res.status(200).json({
      status: 200,
      data: tdsSubSectionCategorydata,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subSectionData = await tdsSubSection.findOne({
      where: {
        tdsSubSectionCategoryID: id
      }
    });

    if (subSectionData) {
      return res.status(200).json({
        status: 401,
        message: 'TDS Sub Section Category is already used in a TDS Sub Section.',
      });
    }

    const data = await TdsSubSectionCategory.findOne({
      where: {
        tdsSubSectionCategoryID: id,
      },
    });

    if (!data)
      return res.status(200).json({
        status: 200,
        message: 'TDS Sub Section Category Not Found!',
      });

    await data.destroy({
      user: req.userDetails,
    });


    return res.status(200).json({
      status: 200,
      message: 'TDS Sub Section Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.getlist = async (req, res, next) => {
  try {
    const { searchQuery, page, limit } = req.query;

    const paginateCondition =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    if (searchQuery)
      condition[Op.or] = [
        { categoryName: { [Op.iLike]: `%${searchQuery}%` } },
        { description: { [Op.iLike]: `%${searchQuery}%` } },
      ];

    const data = await TdsSubSectionCategory.findAndCountAll({
      raw: true,
      where: condition,
      ...paginateCondition,
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({
      status: 200,
      data: data.rows,
      totalcount: data.count,
    });
  } catch (error) {
    next(error);
  }
};
