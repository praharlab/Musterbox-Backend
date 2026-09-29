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
const UserLeaveTransaction = require("../models/userLeaveTransaction");
const UserLeave = require("../models/userleave");

exports.getApprovedLeaveTransactionByUser = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      userMasterID,
      fromMonth,
      toMonth,
      LeaveTranId,
      exportData,
    } = await req.body;

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const condition = {};
    const fromMonthStart = moment(fromMonth, "YYYYMM")
      .startOf("month")
      .format("YYYY-MM-DD");
    const toMonthEnd = moment(toMonth, "YYYYMM")
      .endOf("month")
      .format("YYYY-MM-DD");
    if (fromMonth && toMonth) {
      condition.date = {
        [Sequelize.Op.between]: [fromMonthStart, toMonthEnd],
      };
    }
    condition.status = 1;
    if (LeaveTranId) {
        condition.LeaveTranId = LeaveTranId;
      }
    const order = [["date", "DESC"]];
    const { rows: finLeaveTransactions, count } =
      await UserLeaveTransaction.findAndCountAll({
        where: condition,
        order,
        ...paginationQuery,
        include: [
          {
            model: UserLeave,
            where: { userMasterID: userMasterID },
            attributes: [],
            include: [
              {
                model: UserMaster,
                attributes: userAttributes,
              },
            ],
          },
          {
            model: HrLeaveTypes,
            attributes: ["LeaveID"],
            include: {
              model: HrLeaveMaster,
              as: "LeaveMaster",
              attributes: ["LeaveName"],
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

    const finalLeaveTransactions = finLeaveTransactions.map((item) => ({
      userLeaveTransactionID: item.userLeaveTransactionID,
      userMasterID: item.userMasterID,
      LeaveTranId: item.LeaveTranId,
      displayName: item.userLeave?.userMaster?.displayName,
      days: item.days,
      date: moment(item.date, "YYYY-MM-DD").format("DD-MM-YYYY"),
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
      const finalExportData = finalLeaveTransactions.map((item) => ({
        "Employee Name": item.displayName,
        "Leave Name": item.LeaveName,
        "Month-Year": item.YYYYMM,
        days: item.days,
        "Create By": item.createBy,
        "Created On": item.createdAt,
        "Update By": item.updateBy || "",
        "Updated On": item.updateBy ? item.updatedAt : "",
      }));

      await generateExcel(finalExportData, "Approved Leave", "xlsx", res);
      return;
    }
    return res.status(200).json({
      status: 200,
      totalCount: count,
      data: finalLeaveTransactions,
    });
  } catch (err) {
    next(err);
  }
};
