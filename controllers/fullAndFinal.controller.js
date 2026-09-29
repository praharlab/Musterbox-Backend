const Sequelize = require('sequelize');
const Resignation = require('../models/resignation');
const UserMaster = require('../models/userMaster');
const LoanMaster = require('../models/loanMaster');
const LoanTransaction = require('../models/loanTransaction');
const AdvancePayment = require('../models/advancePayment');
const AssetAssign = require('../models/assignAssetToEmployee');
const Deposit = require('../models/deposit');
const EmployeePenalty = require('../models/employeePenalty');
const AssetCategory = require('../models/assetCategory');
const assetMaster = require('../models/assetMaster');
const DepositCategory = require('../models/depositCategory');
const Penalty = require('../models/penalty');
const { employeeeLeaveBalance } = require('../utils/commonUtilFunctions');

exports.getAllFnf = async (req, res, next) => {
  try {
    const { limit, page, searchQuery, companyMasterID } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = +limit;
    }

    const condition = {
      status: 1,
      authorizationstatus: 3,
      '$employee.companyMasterId$': companyMasterID,
    };

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          '$employee.displayName$': {
            [Sequelize.Op.iLike]: `%${searchQuery}%`,
          },
        },
        {
          '$employee.userNumber$': { [Sequelize.Op.iLike]: `%${searchQuery}%` },
        },
      ];

    const { rows, count } = await Resignation.findAndCountAll({
      where: condition,
      ...paginationQuery,
      include: { model: UserMaster, as: 'employee' },
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

async function getPendingLoan(userMasterID) {
  const pendingLoanData = await LoanMaster.findAll({
    where: { userMasterID, status: 1, loanstatus: 1 },
    include: {
      model: LoanTransaction,
      where: { RefrenceId: { [Sequelize.Op.eq]: null } },
    },
  });
  return pendingLoanData;
}

async function getpendingAdvance(userMasterID) {
  const pendingAdvanceData = await AdvancePayment.findAll({
    where: {
      userMasterID,
      status: 1,
      AdvanceStatus: 1,
      tablereferenceID: { [Sequelize.Op.eq]: null },
    },
  });
  return pendingAdvanceData;
}

async function getpendingAsset(userMasterID) {
  const pendingAssetData = await AssetAssign.findAll({
    where: { userMasterID, status: 1, returnDate: { [Sequelize.Op.eq]: null } },
    include: [
      { model: AssetCategory, as: 'assetCategory' },
      { model: assetMaster, as: 'assetMaster' },
    ],
  });
  return pendingAssetData;
}

async function getpendingDeposit(userMasterID) {
  const pendingDepositData = await Deposit.findAll({
    where: { userMasterID, status: 1, refundDate: { [Sequelize.Op.eq]: null } },
    include: { model: DepositCategory },
  });
  return pendingDepositData;
}

async function getpendingPenalty(userMasterID) {
  const pendingPenaltyData = await EmployeePenalty.findAll({
    where: { userMasterID, status: 1, RefrenceId: { [Sequelize.Op.eq]: null } },
    include: { model: Penalty, as: 'penalty' },
  });
  return pendingPenaltyData;
}

exports.getFnfData = async (req, res, next) => {
  try {
    const { userMasterID } = await req.body;

    const userResignation = await Resignation.findOne({
      where: { userMasterID, authorizationstatus: 3 },
      include: { model: UserMaster, as: 'employee' },
    });
    if (!userResignation)
      return res
        .status(200)
        .json({ status: 401, message: 'Resignation not found!' });

    const pendingLoan = await getPendingLoan(userMasterID);
    const pendingExpense = []; /*await getpendingExpense(userMasterID);*/
    const pendingAdvance = await getpendingAdvance(userMasterID);
    const pendingAsset = await getpendingAsset(userMasterID);
    const leaveBalance = await employeeeLeaveBalance(
      userResignation.employee.companyMasterId,
      userMasterID
    );
    const pendingDeposit = await getpendingDeposit(userMasterID);
    const pendingPenalty = await getpendingPenalty(userMasterID);

    const data = {
      userResignation,
      pendingLoan,
      pendingExpense,
      pendingAdvance,
      pendingAsset,
      leaveBalance,
      pendingDeposit,
      pendingPenalty,
    };

    return res.status(200).json({ status: 200, data });
  } catch (err) {
    next(err);
  }
};
