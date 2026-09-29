const PreboardingFormCustomize = require('../models/preboardingformcustomize');
const Designation = require('../models/designation');
const companyMaster = require('../models/companyMaster');
const PreboardingMaster = require('../models/preboardingMaster');
const BranchMaster = require('../models/branchMaster');

exports.getPreboardingFormCustomizeByCompanyId = async (req, res, next) => {
  try {
    const { page, limit, preboardingMasterID } = req.body;

    const companyID = await PreboardingMaster.findOne({
      where: {
        preboardingMasterID: preboardingMasterID,
        status: 1,
      },
      attributes: ['companyMasterID'],
    });

    if (!companyID)
      return res
        .status(200)
        .json({ status: 401, message: 'Preboarding Form not found!' });

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const preboardingMaster =
      await PreboardingFormCustomize.findAndCountAll({
        raw: true,
        where: {
          preboardingMasterID: preboardingMasterID,
          status: 1,
        },
        ...paginationQuery,
        order: [['sortingindex', 'ASC']],
      });

    const designation = await Designation.findAll({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: 1,
      },
      order: [['designationName', 'ASC']],
    });

    const branch = await BranchMaster.findAll({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: 1,
      },
      order: [['branchName', 'ASC']],
    });

    const companyData = await companyMaster.findOne({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: [0, 1],
      },
      attributes: ['companyLogo', 'companyName', 'companyMasterID'],
    });

    res.status(200).json({
      status: 200,
      data: preboardingMaster.rows,
      totalcount: preboardingMaster.count,
      designation: designation,
      companyData: companyData,
      branch: branch,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreboardingFormCustomizeByCompanyBySecretKey = async (
  req,
  res,
  next
) => {
  try {
    const { page, limit, secretKey } = req.body;

    const companyID = await PreboardingMaster.findOne({
      where: {
        secretKey,
        status: 1,
      },
    });

    if (!companyID)
      return res
        .status(200)
        .json({ status: 401, message: 'Preboarding Form not found!' });

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const preboardingMaster =
      await PreboardingFormCustomize.findAndCountAll({
        raw: true,
        where: {
          preboardingMasterID: companyID.preboardingMasterID,
          status: 1,
        },
        ...paginationQuery,
        order: [['sortingindex', 'ASC']],
      });

    const designation = await Designation.findAll({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: 1,
      },
      order: [['designationName', 'ASC']],
    });

    const branch = await BranchMaster.findAll({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: 1,
      },
      order: [['branchName', 'ASC']],
    });

    const companyData = await companyMaster.findOne({
      where: {
        companyMasterID: companyID.companyMasterID,
        status: [0, 1],
      },
      attributes: ['companyLogo', 'companyName', 'companyMasterID'],
    });

    return res.status(200).json({
      status: 200,
      data: preboardingMaster.rows,
      totalcount: preboardingMaster.count,
      designation: designation,
      companyData: companyData,
      branch: branch,
    });
  } catch (err) {
    next(err);
  }
};
