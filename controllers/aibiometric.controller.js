const Sequelize = require('sequelize');
const aiBiometric = require('../models/aibiometric');
const message = require('../response_message/message');
const { generateExcel } = require('../utils/exportData');

exports.postadd = async (req, res, next) => {
  try {
    const { serialNo, createByIp } = await req.body;

    const biometric = await aiBiometric.findOne({
      where: {
        serialNo,
      },
    });

    if (biometric) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists('Serial No'),
      });
    }

    await aiBiometric.create(
      {
        serialNo,
        createBy: req.userDetails.userMasterId,
        createByIp,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Ai Biometric'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, searchQuery, Export } = req.body;

    const condition = {};

    if (searchQuery) {
      const searchString = searchQuery.toString();

      condition[Sequelize.Op.or] = [
        Sequelize.where(Sequelize.literal(`cast("serialNo" AS TEXT)`), {
          [Sequelize.Op.iLike]: `%${searchString}%`,
        }),
      ];
    }

    const paginationQuery = !Export
      ? page && limit
        ? { offset: (page - 1) * limit, limit }
        : {}
      : {};

    const { rows, count } = await aiBiometric.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: [['aiBiometricID', 'ASC']],
    });

    if (Export) {
      const data = rows.map((row) => ({ serialNo: row.serialNo }));
      await generateExcel(data, 'Ai Biometric', 'xlsx', res);
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.editdata = async (req, res, next) => {
  try {
    const { serialNo, aiBiometricID } = req.body;

    const currentdata = await aiBiometric.findOne({
      where: {
        aiBiometricID: aiBiometricID,
      },
    });

    if (!currentdata) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.deletedrecord,
      });
    }

    const biometric = await aiBiometric.findOne({
      where: {
        serialNo,
        aiBiometricID: {
          [Sequelize.Op.ne]: aiBiometricID,
        },
      },
    });

    if (biometric) {
      return res.status(400).json({
        status: 400,
        message: message.usermessage.alreadyExists('Serial No'),
      });
    }

    currentdata.serialNo = serialNo;
    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Ai Biometric'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const aiBiometricID = req.params.id;

    // Fetch the data by ID
    const data = await aiBiometric.findOne({
      where: {
        aiBiometricID: aiBiometricID,
      },
      raw: true,
    });

    // Handle case where no data is found
    if (!data) {
      return res.status(404).json({
        status: 404,
        message: 'Data not found',
      });
    }

    // Respond with the data
    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    next(error);
  }
};
