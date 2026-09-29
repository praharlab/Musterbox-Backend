const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const JobPosting = require("../models/jobPosting");
const message = require("../response_message/message");
const companyMaster = require("../models/companyMaster");
const BranchMaster = require("../models/branchMaster");
const Department = require("../models/department");
const Designation = require("../models/designation");
const { generateExcel } = require("../utils/exportData");
const moment = require("moment");
const { generateSecretKey } = require("../utils/commonUtilFunctions");
const JobRoleClassification = require("../models/jobRoleClassification");
const DistrictMaster = require("../models/districtMaster");
const StateMaster = require("../models/statemaster");

// add api
exports.addDistrict = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { districtName, stateMasterID } = await req.body;
    await DistrictMaster.create(
      { districtName, stateMasterID },
      { user: req.userDetails },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("District"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// get all data api
exports.listDistrictData = async (req, res, next) => {
  try {
    let { page, limit, stateMasterID, exportData, searchQuery } = req.body;

    const condition = {};

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          "$stateMaster.stateName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          districtName: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];
    }
    if (stateMasterID) {
      condition.stateMasterID = stateMasterID;
    }
    const { rows: districtData, count } = await DistrictMaster.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: StateMaster,
          attributes: ["stateName", "stateCode"],
        },
      ],
      order: [["districtName", "ASC"]],
    });

    const finaldata = districtData.map((e) => {
      return {
        districtID: e.districtID,
        stateName: e.stateMaster.stateName,
        stateCode: e.stateMaster.stateCode,
        districtName: e.districtName,
      };
    });
    if (exportData) {
      const dataToEXport = districtData.map((e) => {
        return {
          "State Name": e.stateMaster.stateName,
          "State Code": e.stateMaster.stateCode,
          "District Name": e.districtName,
        };
      });
      await generateExcel(dataToEXport, "Job Posting", "xlsx", res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: finaldata, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get By ID
exports.getDistrictByID = async (req, res, next) => {
  try {
    let { districtID } = req.query;
    const districtData = await DistrictMaster.findOne({
      where: {
        districtID,
        status: 1,
      },
      include: [
        {
          model: StateMaster,
        },
      ],
    });
    return res.status(200).json({ status: 200, data: districtData });
  } catch (err) {
    next(err);
  }
};
exports.updateDistrict = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { districtName, stateMasterID, districtID } = req.body;

    const existingRecord = await DistrictMaster.findOne({
      where: { districtID },
      transaction,
    });

    if (!existingRecord) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage("District"),
      });
    }
    const sameExitstingName = await DistrictMaster.findOne({
      where: {
        districtID: {
          [Sequelize.Op.ne]: districtID,
        },
        districtName,
        stateMasterID,
      },
      transaction,
    });
    if (sameExitstingName) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.alreadyExists("District With Same Name"),
      });
    }

    await DistrictMaster.update(
      {
        districtName,
      },
      {
        where: { districtID: districtID },
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
      message: message.usermessage.updateMessage("District"),
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

// get By Post ID
exports.getDistrictByStateID = async (req, res, next) => {
  try {
    let { stateMasterID } = req.query;
    const districtData = await DistrictMaster.findAll({
      where: {
        stateMasterID,
        status: 1,
      },
      include: [
        {
          model: StateMaster,
        },
      ],
    });
    return res.status(200).json({ status: 200, data: districtData });
  } catch (err) {
    next(err);
  }
};
