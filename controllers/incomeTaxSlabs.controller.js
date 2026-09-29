const sequelize = require('../config/database');
const { Op, Sequelize } = require('sequelize');
const incomeTaxSlabMaster = require('../models/incomeTaxSlabMaster');
const incomeTaxSlabs = require('../models/incomeTaxSlabs');
const { generateExcel } = require('../utils/exportData');

exports.addIncomeTaxSlab = async (req, res, next) => {
  try {
    const {
      fromAmount,
      toAmount,
      percentage,
      incomeTaxSlabMasterID,
      createBy,
      createByIp,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      await incomeTaxSlabs.create(
        {
          fromAmount,
          toAmount,
          percentage,
          incomeTaxSlabMasterID,
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
      message: 'IncomeTax Slab added successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.updateIncomeTaxSlab = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      fromAmount,
      toAmount,
      percentage,
      incomeTaxSlabMasterID,
      updateBy,
      updateByIp,
    } = await req.body;

    await sequelize.transaction(async (t) => {
      await incomeTaxSlabs.update(
        {
          fromAmount,
          toAmount,
          percentage,
          incomeTaxSlabMasterID,
          updateBy,
          updateByIp,
        },
        {
          where: { incomeTaxSlabID: id },
          transaction: t,
        }
      );
    });
    res.status(200).json({
      status: 200,
      message: 'IncomeTax Slab updated successfully.',
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

    // if (status == 2) {
    //   toupdatedata.deleteBy = updateBy;
    //   toupdatedata.deleteByIp = updateByIp;
    // }

    await sequelize.transaction(async (t) => {
      if (toupdatedata) {
        await incomeTaxSlabs.update(toupdatedata, {
          where: {
            incomeTaxSlabID: id,
          },
          transaction: t,
        });

        if (status == 2) {
          const incomeTaxSlabsData = await incomeTaxSlabs.findOne({
            where: {
              incomeTaxSlabID: id,
            },
          });

          if (!incomeTaxSlabsData) {
            return res.status(200).json({
              status: 200,
              message: 'Data not Found',
            });
          }

          await incomeTaxSlabsData.destroy({
            user: req.userDetails,
            transaction: t,
          });
        }
      }
    });

    res.status(200).json({
      status: 200,
      message:
        status == 0
          ? 'Income tax Slab deactive successfully.'
          : status == 1
            ? 'Income tax Slab activate successfully.'
            : status == 2
              ? 'Income tax Slab deleted successfully.'
              : '',
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllData = async (req, res, next) => {
  try {
    const { page, limit, incomeTaxSlabMasterID } = await req.query;

    const paginate = !req.query.export
      ? page && limit
        ? { offset: (page - 1) * limit, limit: limit }
        : {}
      : {};

    const condition = {};

    condition.status = [0, 1];

    if (incomeTaxSlabMasterID)
      condition.incomeTaxSlabMasterID = +incomeTaxSlabMasterID;

    const { rows: data, count: totalcount } =
      await incomeTaxSlabs.findAndCountAll({
        raw: true,
        where: condition,
        ...paginate,
        include: [{ model: incomeTaxSlabMaster, attributes: [] }],
        order: [['createdAt', 'DESC']],
        attributes: [
          [
            sequelize.col('incomeTaxSlabMaster.incomeTaxSlabMasterID'),
            'incomeTaxSlabMasterID',
          ],
          [
            sequelize.col('incomeTaxSlabMaster.assessmentYear'),
            'assessmentYear',
          ],
          [sequelize.col('incomeTaxSlabMaster.gender'), 'gender'],
          [sequelize.col('incomeTaxSlabMaster.regime'), 'regime'],
          'fromAmount',
          'toAmount',
          'percentage',
          'incomeTaxSlabID',
        ],
      });

    if (req.query.export) {
      const final = await Promise.all(
        data.map((e) => {
          const { incomeTaxSlabMasterID, incomeTaxSlabID, ...rest } = e;
          return rest;
        })
      );

      if (+final.length === 0) {
        return res.status(200).json({
          message: 'No data found to export!',
        });
      }

      return generateExcel(final, 'IncomeTaxSlabs', 'xlsx', res);
    }

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

    const data = await incomeTaxSlabs.findOne({
      where: {
        incomeTaxSlabID: id,
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
