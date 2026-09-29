const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const companyTraining = require('../models/companyTraining');
const message = require('../response_message/message');
const logger = require('../config/logger');
const {
  generateExcel,
  genrateDemoExcelForContractor,
} = require('../utils/exportData');
const companyMaster = require('../models/companyMaster');
const UserMaster = require('../models/userMaster');
const moment = require('moment');

function timecheck(startTrainingTiming, endTrainingTiming) {
  const start = new Date(`1970-01-01T${startTrainingTiming}`);
  const end = new Date(`1970-01-01T${endTrainingTiming}`);

  return end > start;
}

exports.postadd = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      title,
      description,
      trainingDate,
      startTrainingTiming,
      endTrainingTiming,
      trainingTakenBy,
    } = await req.body;

    if (!timecheck(startTrainingTiming, endTrainingTiming)) {
      return res.status(200).json({
        status: 401,
        message: 'End Training Time must be greater than Start Training Time!',
      });
    }

    await companyTraining.create(
      {
        companyMasterID,
        title,
        description,
        trainingDate,
        startTrainingTiming,
        endTrainingTiming,
        trainingTakenBy,
        createBy: req.userDetails.userMasterId,
        createByIp: req.userDetails.userIpAddress,
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Company Training'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listdata = async (req, res, next) => {
  try {
    let { page, limit, companyMasterID, searchQuery, Exports } = await req.body;

    const condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { title: { [Sequelize.Op.iLike]: `%${searchQuery}%` } },
      ];

    const paginationQuery =
      !Exports && page && limit ? { offset: (page - 1) * limit, limit } : {};

    const { rows, count } = await companyTraining.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName'],
        },
        {
          model: UserMaster,
          as: 'createdBy',
          // attributes: ['displayName ']
        },
        {
          model: UserMaster,
          as: 'updatedBy',
          // attributes: ['displayName ']
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    if (Exports) {
      const finaldata = rows.map((e) => {
        return {
          Title: e.title,
          Description: e.description.replace(/<[^>]*>/g, ''), // Remove HTML tags
          'Training Date': e.trainingDate
            ? moment(e.trainingDate).format('DD-MM-YYYY')
            : 'dd-MM-yyyy',
          'Start Time Of Training': e.startTrainingTiming,
          'End Time Of Training': e.endTrainingTiming,
          'Date of Incorporation': e.dateofIncorporation,
          'Training Taken By': e.trainingTakenBy,
          CreatedBy: e['createdBy.displayName'],
          CreatedAt: e.createdAt
            ? moment(e.createdAt).format('DD-MM-YYYY HH:mm')
            : 'dd-MM-yyyy hh:mm',
          UpdatedBy: e['updatedBy.displayName'],
          updatedAt: e.updatedAt
            ? moment(e.updatedAt).format('DD-MM-YYYY HH:mm')
            : 'dd-MM-yyyy hh:mm',
        };
      });

      await generateExcel(
        finaldata,
        `$[rows.companyMaster.companyName]`,
        'xlsx',
        res
      );
      return;
    }

    return res.status(200).json({ status: 200, data: rows, totalcount: count });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const id = req.params.id;

    const data = await companyTraining.findOne({
      where: {
        companyTrainingID: id,
      },
    });

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatedata = async (req, res, next) => {
  try {
    const {
      title,
      description,
      trainingDate,
      startTrainingTiming,
      endTrainingTiming,
      trainingTakenBy,
    } = req.body;

    const currentdata = await companyTraining.findOne({
      where: {
        companyTrainingID: req.params.id,
      },
    });

    if (!timecheck(startTrainingTiming, endTrainingTiming)) {
      return res.status(200).json({
        status: 401,
        message: 'End Training Time must be greater than Start Training Time!',
      });
    }

    currentdata.title = title;
    currentdata.description = description;
    currentdata.trainingDate = trainingDate;
    currentdata.startTrainingTiming = startTrainingTiming;
    currentdata.endTrainingTiming = endTrainingTiming;
    currentdata.trainingTakenBy = trainingTakenBy;

    await currentdata.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Company Training'),
    });
  } catch (err) {
    next(err);
  }
};

exports.deletedatabyId = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await companyTraining.findByPk(id);

    if (!findData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Company Training'),
      });
    }

    // Perform deletion
    await findData.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Company Training'),
    });
  } catch (err) {
    next(err);
  }
};
