const { Op } = require('sequelize');
const { usermessage } = require('../response_message/message');
const PolicyDocuments = require('../models/policyDocuments');
const companyMaster = require('../models/companyMaster');
const { statusCodes } = require('../utils/commonVars');

exports.createPolicyDocument = async (req, res, next) => {
  try {
    const { name, description, companyMasterID } = req.body;
    const dbFilepath = req.file
      ? `uploads/policy-documents/${req.file.filename}`
      : null;
    const ticket = await PolicyDocuments.create(
      {
        name,
        description,
        document: dbFilepath,
        companyMasterId: companyMasterID,
      },
      {
        user: req.userDetails,
      }
    );
    return res.status(statusCodes.OK).json({
      data: ticket,
      message: usermessage.addMessage('Policy Document'),
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePolicyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, companyMasterId } = req.body;
    const policyDocument = await PolicyDocuments.findByPk(id, {
      include: [
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                    ...req.userDetails.childCompanies,
                    req.userDetails.companyMasterId,
                  ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
    });
    if (!policyDocument)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Policy Document'),
      });
    if (name) policyDocument.name = name;
    if (description) policyDocument.description = description;
    if (req.file) {
      const dbFilepath = `uploads/policy-documents/${req.file.filename}`;
      policyDocument.document = dbFilepath;
    }

    if (companyMasterId) policyDocument.companyMasterId = companyMasterId;
    await policyDocument.save({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      data: policyDocument,
      message: usermessage.updateMessage('Policy Document'),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPolicyDocumentDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const policyDocument = await PolicyDocuments.findByPk(id, {
      include: [
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                    ...req.userDetails.childCompanies,
                    req.userDetails.companyMasterId,
                  ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
    });
    if (!policyDocument)
      return res.status(statusCodes.OK).json({
        message: usermessage.notFoundMessage('Policy Document'),
      });
    res.status(statusCodes.OK).json({
      data: policyDocument,
      message: usermessage.fetchMessage('Policy Document'),
    });
  } catch (err) {
    next(err);
  }
};

exports.listPolicyDocument = async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      withDeleted,
      companyMasterID,
      search,
      sortByField,
      sortByValue,
    } = req.query;

    const condition = {};
    const companyFilter = {
      companyMasterID:
        req.userDetails.childCompanies.length > 0
          ? [...req.userDetails.childCompanies, req.userDetails.companyMasterId]
          : req.userDetails.companyMasterId,
    };

    if (search)
      condition[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];

    if (companyMasterID) companyFilter.companyMasterID = companyMasterID;

    const order =
      sortByField && sortByValue
        ? [[sortByField, sortByValue]]
        : [['createdAt', 'DESC']];

    const offset = (page - 1) * pageSize;
    const limit = +pageSize;

    const policyDocument = await PolicyDocuments.findAndCountAll({
      where: condition,
      offset,
      limit,
      order,
      paranoid: withDeleted !== 'true',
      include: [
        {
          model: companyMaster,
          where: companyFilter,
        },
      ],
    });

    res.status(statusCodes.OK).json({
      message: usermessage.fetchMessage('Policy Document'),
      data: policyDocument.rows,
      totalcount: policyDocument.count,
      page: +page,
      pageSize: limit,
    });
  } catch (err) {
    next(err);
  }
};

exports.deletePolicyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const policyDocument = await PolicyDocuments.findByPk(id, {
      include: [
        {
          model: companyMaster,
          where: {
            companyMasterID:
              req.userDetails.childCompanies.length > 0
                ? [
                    ...req.userDetails.childCompanies,
                    req.userDetails.companyMasterId,
                  ]
                : req.userDetails.companyMasterId,
          },
        },
      ],
    });
    if (!policyDocument)
      return res.status(statusCodes.NOT_FOUND).json({
        message: usermessage.notFoundMessage('Policy Document'),
      });

    await policyDocument.destroy({
      user: req.userDetails,
    });

    return res.status(statusCodes.OK).json({
      message: usermessage.deleteMessage('Policy Document'),
    });
  } catch (err) {
    next(err);
  }
};
