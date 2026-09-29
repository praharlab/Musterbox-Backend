const { where } = require('sequelize');
const sequelize = require('../config/database');
const incomeTaxSlabMaster = require('../models/incomeTaxSlabMaster');
const { Op } = require('sequelize');
const incomeTaxSlabs = require('../models/incomeTaxSlabs');

exports.addIncomeTaxSlabMaster = async (req, res, next) => {
  try {
    const { assessmentYear, gender, regime, createBy, createByIp } =
      await req.body;

    await sequelize.transaction(async (t) => {
      await incomeTaxSlabMaster.create(
        {
          assessmentYear,
          gender,
          regime,
          createBy,
          createByIp,
        },
        {
          user: req.userDetails,
          transaction: t,
        }
      );
    });
    res.status(200).json({
      status: 200,
      message: 'IncomeTax Slab Master added successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateIncomeTaxSlabMaster = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { assessmentYear, gender, regime, updateBy, updateByIp } =
      await req.body;

    await sequelize.transaction(async (t) => {
      await incomeTaxSlabMaster.update(
        {
          assessmentYear,
          gender,
          regime,
          updateBy,
          updateByIp,
        },
        {
          where: { incomeTaxSlabMasterID: id },
          transaction: t,
        }
      );
    });
    res.status(200).json({
      status: 200,
      message: 'IncomeTax Slab Master updated successfully.',
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

    if (status == 0 || status == 1) {
      toupdatedata.status = status;
      toupdatedata.updateBy = updateBy;
      toupdatedata.updateByIp = updateByIp;
    }

    await sequelize.transaction(async (t) => {
      if (toupdatedata) {
        await incomeTaxSlabMaster.update(toupdatedata, {
          where: {
            incomeTaxSlabMasterID: id,
          },
          transaction: t,
        });
      }

      if (status == 2) {
        const taxdata = await incomeTaxSlabs.findOne({
          where: {
            incomeTaxSlabMasterID: id,
          },
        });

        if (taxdata) {
          return res.status(200).json({
            status: 200,
            message:
              'Already used in incomeTaxSlabs. So , you can not delete Income Tax slab Master.',
          });
        }

        const findmasterdata = await incomeTaxSlabMaster.findOne({
          where: {
            incomeTaxSlabMasterID: id,
          },
        });

        if (!findmasterdata) {
          return res.status(200).json({
            status: 200,
            message: 'Data not Found',
          });
        }

        await findmasterdata.destroy({ user: req.userDetails, transaction: t });
      }
    });

    res.status(200).json({
      status: 200,
      message:
        status == 0
          ? 'Income tax Slab Master deactive successfully.'
          : status == 1
            ? 'Income tax Slab Master activate successfully.'
            : status == 2
              ? 'Income tax Slab Master deleted successfully.'
              : '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const { page, limit, searchQuery } = await req.query;

    const paginate =
      page && limit ? { offset: (page - 1) * limit, limit: limit } : {};

    const condition = {};

    condition.status = [0, 1];

    if (searchQuery) {
      condition[Op.or] = [
        { assessmentYear: { [Op.iLike]: `%${searchQuery}%` } },
        { gender: { [Op.iLike]: `%${searchQuery}%` } },
        {
          regime: {
            [Op.iLike]: `%${searchQuery}%`,
          },
        },
      ];
    }
    const { rows: data, count: totalcount } =
      await incomeTaxSlabMaster.findAndCountAll({
        raw: true,
        where: condition,
        ...paginate,
        order: [['createdAt', 'DESC']],
      });

    res.status(200).json({
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

    const data = await incomeTaxSlabMaster.findOne({
      where: {
        incomeTaxSlabMasterID: id,
        status: [0, 1],
      },
    });

    if (!data) {
      res.status(200).json({
        status: 200,
        message: 'No data found',
        data: {},
      });
    }

    res.status(200).json({
      status: 200,
      data: data,
    });
  } catch (error) {
    next(error);
  }
};
