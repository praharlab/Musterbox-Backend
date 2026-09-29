const datewiseattendancePolicy = require("../models/datewiseAttendancepolicy");
const logger = require("../config/logger");
const message = require("../response_message/message");
const Sequelize = require("sequelize");
const UserMaster = require("../models/userMaster");
const AttendancePolicy = require("../models/attendancePolicy");
const companyMaster = require("../models/companyMaster");
const sequelize = require("../config/database");
const { accessibleUsers } = require("../utils/commonUtilFunctions");
const { userAttributes, companyAttributes } = require("../utils/commonVars");
const moment = require("moment");
const { generateExcel } = require("../utils/exportData");

exports.postadddatewisepolicy = async (req, res, next) => {
  try {
    let { userMasterID, fromDate, ToDate } = await req.body;

    const findUserData = await UserMaster.findOne({
      raw: true,
      where: {
        userMasterID: userMasterID,
      },
      attributes: ["companyMasterId"],
    });

    await datewiseattendancePolicy.create(
      {
        userMasterID,
        companyMasterID: findUserData.companyMasterId,
        fromDate,
        ToDate,
      },
      { user: req.userDetails }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Outside Attendace Permission"),
    });
  } catch (err) {
    next(err.message);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const getdatewisepolicy = await datewiseattendancePolicy.findOne({
      where: {
        datewiseAttendancepolicyID: req.params.id,
      },
    });

    return res.status(200).json({ status: 200, data: getdatewisepolicy });
  } catch (err) {
    next(err);
  }
};

// //update the user data

exports.datewiseupdateData = async (req, res, next) => {
  try {
    let { datewiseAttendancepolicyID, fromDate, ToDate } = await req.body;
    await datewiseattendancePolicy.update(
      {
        fromDate,
        ToDate,
      },
      {
        where: { datewiseAttendancepolicyID: datewiseAttendancepolicyID },
      },
      { user: req.userDetails }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage(
        "Outside Attendance Permission"
      ),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDelete = async (req, res, next) => {
  try {
    await datewiseattendancePolicy.destroy({
      where: {
        datewiseAttendancepolicyID: req.body.id,
      },
    });
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage(
        "Outside Attendace Permission"
      ),
    });
  } catch (error) {
    next(error);
  }
};

exports.getalldatabyid = async (req, res, next) => {
  try {
    const {
      limit,
      page,
      companyMasterID,
      userMasterID,
      startdate,
      enddate,
      searchQuery,
      exportData,
    } = await req.body;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {
      "$userMaster.status$": 1,
    };
    if (userMasterID && userMasterID.length > 0)
      condition.userMasterID = userMasterID

    if (companyMasterID) {
      // req.userDetails.accessibleCompanies = companyMasterID;
      condition.companyMasterID = companyMasterID;
    }

    if (startdate && enddate) {
      condition.fromDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
      condition.ToDate = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(enddate)],
      };
    }

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          "$userMaster.displayName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];
      
    const { rows: getDatewiseAttedancePolicy, count } =
      await datewiseattendancePolicy.findAndCountAll({
        where: condition,
        ...paginationQuery,
        include: [
          {
            required: true,
            model: UserMaster,
            where: {
              status: 1,
            },
            ...accessibleUsers(req.userDetails),
          },
          {
            model: UserMaster,
            as: "createdByUserDetails",
            attributes: userAttributes,
          },
          {
            model: UserMaster,
            as: "updatedByUserDetails",
            attributes: userAttributes,
          },
          {
            model: companyMaster,
            attributes: companyAttributes,
          },
        ],
        order: [["fromDate", "DESC"]],
      });
    if (exportData) {
      const finaldata = getDatewiseAttedancePolicy.map((e) => {
        return {
          "Company Name": e.companyMaster?.companyName,
          "Employee Name": e.userMaster?.displayName,
          "From Date": moment(e.fromDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
          "To Date": moment(e.ToDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
          "Create By": e.createBy
            ? `${e.createdByUserDetails?.displayName} On ${moment(e.createdAt).format("DD-MM-YYYY HH:mm")}`
            : "",
          "Update By": e.updateBy
            ? `${e.updatedByUserDetails?.displayName} On ${moment(e.updatedAt).format("DD-MM-YYYY HH:mm")}`
            : "",
        };
      });

      return await generateExcel(finaldata, "Outside Attendace", "xlsx", res);
    }
    return res.status(200).json({
      status: 200,
      data: getDatewiseAttedancePolicy,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};
