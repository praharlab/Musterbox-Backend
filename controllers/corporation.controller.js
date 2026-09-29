/** @format */

const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const Corporation = require('../models/corporation');
const StateMaster = require('../models/statemaster');

exports.getByStateId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await Corporation.findAll({
      where: {
        stateMasterID: id,
      },
      include: [{ model: StateMaster, attributes: ['stateName'] }],
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
};
