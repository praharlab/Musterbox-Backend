const JobRoleClassification = require('../models/jobRoleClassification');
const CompanyMaster = require('../models/companyMaster');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { generateExcel } = require('../utils/exportData');

const moment = require('moment');

// add api
exports.addJobRoleClassification = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      companyMasterID,
      jobRoleClassificationName,
      jobRoleClassificationDescription,
    } = req.body;

    const jobRoleData = await JobRoleClassification.findOne({
      where: {
        companyMasterID,
        status: [1],
        jobRoleClassificationName: jobRoleClassificationName,
      },
      transaction,
    });

    if (jobRoleData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Job Role Classification With Name'
        ),
      });
    }

    await JobRoleClassification.create(
      {
        companyMasterID,
        jobRoleClassificationName,
        jobRoleClassificationDescription,
      },
      { user: req.userDetails },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Job Role Classification'),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.listJobRoleClassification = async (req, res, next) => {
  try {
    let { page, limit, companyMasterID, searchQuery, exportData } = req.body;

    const condition = {};
    const paginationQuery = {};

    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    condition.companyMasterID = companyMasterID;
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          jobRoleClassificationName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          jobRoleClassificationDescription: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }

    // Fetch job role classifications with count
    const { rows: jobRoleClassificationData, count } =
      await JobRoleClassification.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            model: CompanyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

    // Export to Excel if requested
    if (exportData) {
      const dataToExport = jobRoleClassificationData.map((e) => ({
        Company: e.companyMaster?.companyName,
        'Job Role Classification Name': e.jobRoleClassificationName,
        Description: e.jobRoleClassificationDescription,
        'Created Date': e.createdAt
          ? moment(e.createdAt, 'YYYY-MM-DD').format('DD-MM-YYYY HH:mm')
          : '',
      }));
      await generateExcel(
        dataToExport,
        'Job Role Classifications',
        'xlsx',
        res
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      data: jobRoleClassificationData,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.getJobRoleClassificationByID = async (req, res, next) => {
  try {
    let { jobRoleClassificationID } = req.query;
    const jobRoleClassificationData = await JobRoleClassification.findOne({
      where: {
        jobRoleClassificationID,
        status: 1,
      },
      include: [
        {
          model: CompanyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
      ],
    });

    // Check if record exists
    if (!jobRoleClassificationData) {
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Job Role Classification'),
      });
    }

    return res
      .status(200)
      .json({ status: 200, data: jobRoleClassificationData });
  } catch (error) {
    next(error);
  }
};

exports.editJobRoleClassificationByID = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      jobRoleClassificationID,
      companyMasterID,
      jobRoleClassificationName,
      jobRoleClassificationDescription,
    } = req.body;

    const existingRecord = await JobRoleClassification.findOne({
      where: { jobRoleClassificationID },
      transaction,
    });

    if (!existingRecord) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Job Role Classification'),
      });
    }
    const sameExitstingName = await JobRoleClassification.findOne({
      where: {
        jobRoleClassificationID: {
          [Sequelize.Op.ne]: jobRoleClassificationID,
        },
        jobRoleClassificationName: jobRoleClassificationName,
        companyMasterID,
      },
      transaction,
    });
    if (sameExitstingName) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.alreadyExists(
          'Job Role Classification With Same Name'
        ),
      });
    }

    await JobRoleClassification.update(
      {
        jobRoleClassificationName,
        jobRoleClassificationDescription,
      },
      {
        where: { jobRoleClassificationID: jobRoleClassificationID },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage('Job Role Classification'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.deleteJobRoleClassificationByID = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { jobRoleClassificationID } = req.body;

    const findData = await JobRoleClassification.findByPk(
      jobRoleClassificationID
    );

    if (!findData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage('Job Role Classification'),
      });
    }

    await findData.destroy(
      {
        user: req.userDetails,
      },
      { transaction }
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Job Role Classification'),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
