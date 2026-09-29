const shortLeave = require("../models/shortLeave");
const message = require("../response_message/message");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const logger = require("../config/logger");
const { generateExcel } = require("../utils/exportData");
const companyMaster = require("../models/companyMaster");
const EmployeeShortLeavePolicy = require("../models/employeeShortLeavePolicy");
const UserMaster = require("../models/userMaster");
const { userAttributes } = require("../utils/commonVars");

exports.postAddShortLeave = async (req, res, next) => {
  try {
    let {
      shortLeaveName,
      maxMinutesForShortLeave,
      noOfShortLeave,
      companyMasterID,
    } = req.body;

    const existingPolicy = await shortLeave.findOne({
      where: {
        [Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              "TRIM",
              sequelize.fn("LOWER", sequelize.col("shortLeaveName"))
            ),
            shortLeaveName.trim().toLowerCase()
          ),
          Sequelize.where(sequelize.col("companyMasterID"), companyMasterID),
        ],
      },
    });

    if (existingPolicy) {
      return res.status(200).json({
        status: 400,
        message: message.usermessage.shortLeaveExist,
      });
    }

    let insert_db_status;

    insert_db_status = await shortLeave.create(
      {
        shortLeaveName,
        minutesForShortLeave: maxMinutesForShortLeave,
        noOfShortLeave,
        companyMasterID,
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.shortLeaveAddSuccess,
      data: insert_db_status,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateShortLeave = async (req, res, next) => {
  try {
    let {
      shortLeaveName,
      maxMinutesForShortLeave,
      noOfShortLeave,
      companyMasterID,
      id,
    } = req.body;

    const existingPolicy = await shortLeave.findOne({
      where: {
        [Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              "TRIM",
              sequelize.fn("LOWER", sequelize.col("shortLeaveName"))
            ),
            shortLeaveName.trim().toLowerCase()
          ),
          Sequelize.where(sequelize.col("companyMasterID"), companyMasterID),
          Sequelize.or(
            Sequelize.where(sequelize.col("status"), 0),
            Sequelize.where(sequelize.col("status"), 1)
          ),
          Sequelize.where(sequelize.col("id"), {
            [Sequelize.Op.ne]: id,
          }),
        ],
      },
    });

    if (existingPolicy) {
      return res.status(200).json({
        status: 400,
        message: message.usermessage.shortLeaveExist,
      });
    }

    const change_data_status = await shortLeave.findOne({
      where: { id },
    });

    change_data_status.shortLeaveName = shortLeaveName;
    change_data_status.minutesForShortLeave = maxMinutesForShortLeave;
    change_data_status.noOfShortLeave = noOfShortLeave;

    await change_data_status.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.shortLeaveEditSuccess,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllShortLeaveData = async (req, res, next) => {
  try {
    let { limit, page, Export, search, id, companyMasterID } = req.query;
    let condition = {};

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (id) {
      let get_one_data = await shortLeave.findOne({
        where: {
          id,
          status: {
            [Sequelize.Op.in]: [0, 1],
          },
        },
      });

      return res.status(200).json({ status: 200, data: get_one_data });
    }

    condition.status = { [Sequelize.Op.in]: [0, 1] };

    if (search) {
      condition[Sequelize.Op.or] = [
        { shortLeaveName: { [Sequelize.Op.iLike]: `%${search}%` } },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: `%${search}%`,
          },
        },
      ];
    }

    const paginationQuery = {};
    if (!Export && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const { rows: shortLeaveData, count } = await shortLeave.findAndCountAll({
      where: condition,
      raw: true,
      ...paginationQuery,
      order: [["shortLeaveName", "ASC"]],
      include: [
        {
          model: companyMaster,
          attributes: ["companyName"], 
        },
        {
          model: UserMaster,
          as: 'createdByUserDetails',
          attributes: userAttributes,
        },
        {
          model: UserMaster,
          as: 'updatedByUserDetails',
          attributes: userAttributes,
        },
      ],
    });

    if (Export) {
      const finaldata = shortLeaveData.map((e) => {
        return {
          "Short Leave Name": e.shortLeaveName,
          "Short Leave Minutes": e.minutesForShortLeave,
          "No of Short Leave": e.noOfShortLeave,
          "Company Name": e["companyMaster.companyName"],
          Status: e.status == 0 ? "Deactive" : "Active",
        };
      });

      return await generateExcel(finaldata, "Short Leave", "xlsx", res);
    }

    return res
      .status(200)
      .json({ status: 200, data: shortLeaveData, totalcount: count });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { id, status } = req.body;

    let change_data_status = await shortLeave.findOne({
      where: { id },
    });

    if (status == 0) {
      const findAssigned = await EmployeeShortLeavePolicy.findOne({
        where: {
          shortLeavePolicyID: id,
        },
      });

      if (findAssigned) {
        return res.status(200).json({
          status: 401,
          message:
            "Cannot deactive the short leave policy as it is already assigned to an employees.",
        });
      }
    }

    change_data_status.status = status;

    await change_data_status.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.shortLeaveStatusChange,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteShortLeave = async (req, res, next) => {
  try {
    const { id } = req.params;

    const findData = await shortLeave.findByPk(id);

    if (!findData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.shortLeavePolicyNotFound,
      });
    }

    const findAssigned = await EmployeeShortLeavePolicy.findOne({
      where: {
        shortLeavePolicyID: id,
      },
    });

    if (findAssigned) {
      return res.status(200).json({
        status: 401,
        message:
          "Cannot delete the short leave policy as it is already assigned to an employees.",
      });
    }
    await findData.destroy({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: message.usermessage.shortLeaveDeleteSuccess,
    });
  } catch (err) {
    next(err);
  }
};
