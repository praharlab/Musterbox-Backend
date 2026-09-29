const Sequelize = require("sequelize");
const message = require("../response_message/message");
const sequelize = require("../config/database");
const { userAttributes } = require("../utils/commonVars");
const LeaveEncashment = require("../models/leaveEncashment");
const { leaveOperationENUM } = require("../utils/dbUtils");
const UserLeaveLapse = require("../models/userLeaveLapse");
const UserMaster = require("../models/userMaster");
const HrLeaveTypes = require("../models/hrLeaveTypes");
const HrLeaveMaster = require("../models/hrLeaveMaster");
const moment = require("moment");
const { generateExcel } = require("../utils/exportData");

exports.getLeaveLapseByUser = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      fromMonth,
      toMonth,
      LeaveTranId,
      status,
      exportData,
    } = await req.body;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    condition.userMasterID = userMasterID;

    if (fromMonth && toMonth) {
      condition.LapseYearMonth = {
        [Sequelize.Op.between]: [fromMonth, toMonth],
      };
    }

    if (LeaveTranId) {
      condition.LeaveTranId = LeaveTranId;
    }


    const order = [["LapseYearMonth", "DESC"]];
    const { rows: findLapsedLeave, count } =
      await UserLeaveLapse.findAndCountAll({
        where: condition,
        ...paginationQuery,
        order,
        include: [
          {
            model: UserMaster,
            attributes: userAttributes,
          },
          {
            model: HrLeaveTypes,
            attributes: [
              "LeaveTranId",
              "LeaveID",
              "companyMasterID",
              "Allow_On_H",
              "status",
            ],
            include: {
              model: HrLeaveMaster,
              as: "LeaveMaster",
              attributes: ["LeaveID", "LeaveName", "LeaveDesc", "status"],
            },
          },
          {
            required: false,
            model: UserMaster,
            as: "createByUser",
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: "updateByUser",
            attributes: userAttributes,
          },
        ],
      });

    const finalLapsedLeave = findLapsedLeave.map((item) => ({
      UserLeaveLapseID: item.UserLeaveLapseID,
      userMasterID: item.userMasterID,
      LeaveTranId: item.LeaveTranId,
      displayName: item.userMaster?.displayName,
      days: item.LapseDays,
      YYYYMM: moment(item.LapseYearMonth, "YYYYMM").format("MMMM-YYYY"),
      referenceId: item.referenceId,
      createBy: item.createByUser?.displayName,
      updateBy: item.updateByUser?.displayName || "",
      createdAt: item.createdAt
        ? moment(item.createdAt).format("DD-MM-YYYY HH:mm:ss")
        : "",
      updatedAt: item.updatedAt
        ? moment(item.updatedAt).format("DD-MM-YYYY HH:mm:ss")
        : "",
      LeaveName: item.hrLeaveType?.LeaveMaster?.LeaveName || null,
      LeaveDesc: item.hrLeaveType?.LeaveMaster?.LeaveDesc || null,
    }));

    if (exportData) {
      const finalExportData = finalLapsedLeave.map((item) => ({
        "Employee Name": item.displayName,
        "Leave Name": item.LeaveName,
        "Month-Year": item.YYYYMM,
        days: item.days,
        "Create By": item.createBy,
        "Created On": item.createdAt,
        "Update By": item.updateBy || "",
        "Updated On": item.updateBy ? item.updatedAt : "",
      }));

      await generateExcel(
        finalExportData,
        "Lapsed Leave",
        "xlsx",
        res
      );
      return;
    }
    return res.status(200).json({
      status: 200,
      totalCount: count,
      data: finalLapsedLeave,
    });
  } catch (err) {
    next(err);
  }
};
