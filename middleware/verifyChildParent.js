const companyMaster = require('../models/companyMaster');
const { errorMessage, usermessage } = require('../response_message/message');
const { fetchChildCompanies } = require('../utils/commonQueries');
const { statusCodes } = require('../utils/commonVars');

const verifyChildParent = async (req, res, next) => {
  try {
    const childCompanyLists = await fetchChildCompanies(
      req.userDetails.companyMasterId
    );
    req.userDetails.childCompanies = childCompanyLists;

    const companyMasterId =
      req.params.companyMasterId || req.body.companyMasterId;
    if (!companyMasterId) return next();
    const companyExists = await companyMaster.findOne({
      where: { companyMasterID: companyMasterId, status: 1 },
    });
    if (!companyExists)
      return res
        .status(statusCodes.NOT_FOUND)
        .json({ message: usermessage.notFoundMessage('Company') });
    if (
      +req.userDetails.parentCompanyMasterId !== 0 &&
      +companyMasterId !== +req.userDetails.companyMasterId
    )
      return res.status(statusCodes.BAD_REQUEST).json({
        message: errorMessage.UNAUTHORIZED_ACCESS,
      });

    if (
      +req.userDetails.parentCompanyMasterId === 0 &&
      !childCompanyLists.includes(companyMasterId) &&
      req.userDetails.companyMasterId !== companyMasterId
    )
      return res.status(statusCodes.BAD_REQUEST).json({
        message: errorMessage.UNAUTHORIZED_ACCESS,
      });

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyChildParent };
