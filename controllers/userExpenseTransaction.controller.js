const Sequelize = require("sequelize");
const UserExpense = require("../models/userExpense");
const sequelize = require("../config/database");
const message = require("../response_message/message");
const UserExpenseTransaction = require("../models/userExpenseTransaction");
const ExpenseAuthorizationRequest = require("../models/expenseAuthorization");
const UserMaster = require("../models/userMaster");
const ExpenseHead = require("../models/expenseHead");
const {
  statusCodes,
  userAttributes,
} = require("../utils/commonVars");
const AuthorizationCriteriaMaster = require("../models/authorizationCriteriaMaster");
exports.getExpenseDataByTransactionByID = async (req, res, next) => {
  try {
    const { userExpenseTransactionID } = await req.body;
    if (!userExpenseTransactionID)
      return res
        .status(statusCodes.BAD_REQUEST)
        .json({ message: message.errorMessage.INVALID_FILTER_FIELDS });

    const userExpenseData = await UserExpenseTransaction.findOne({
      where: { userExpenseTransactionID },
      include: [
        { model: ExpenseHead, attributes: ["expenseHeadId", "expenseHead"] },
        { model: AuthorizationCriteriaMaster, attributes: ["AuthorizationCriteriaID", "AuthorizationCriteria"] },
        {
          model: UserExpense,
          as: "userExpense",
          include: [
            {
              required: true,
              model: UserMaster,
              attributes: userAttributes,
            },
          ],
        },
        { model: ExpenseAuthorizationRequest,
          include: [
            {
              model: UserMaster,
              as: "authorizedPerson",
              attributes: userAttributes,
            },
          ],
         },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: userExpenseData,
    });
  } catch (err) {
    next(err);
  }
};
