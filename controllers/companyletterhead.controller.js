const Sequelize = require('sequelize');
const CompanyLetterhead = require('../models/companyLetterhead');
const message = require('../response_message/message');

exports.postAddCompanyLetterhead = async (req, res, next) => {
  try {
    let { companyMasterID, letterhead } = await req.body;
    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;
    if (req.file) {
      letterhead = req.file.filename;
    }
    let check_if_exists = await CompanyLetterhead.findOne({
      raw: true,
      where: { status: ['0', '1'], companyMasterID: companyMasterID },
    });
    if (!check_if_exists) {
      await CompanyLetterhead.create({
        companyMasterID,
        letterhead,
        createBy,
        createByIp,
      });
      return res.status(200).json({
        status: 200,
        message: message.usermessage.addMessage('Company letterhead'),
      });
    } else {
      await CompanyLetterhead.update(
        {
          companyMasterID,
          letterhead,
          updateBy: createBy,
          updateByIp: createByIp,
        },
        {
          where: { companyLetterheadID: check_if_exists.companyLetterheadID },
        }
      );
      return res.status(200).json({
        status: 200,
        message: message.usermessage.updateMessage('Company letterhead'),
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getCompanyLetterheadByCompanyMasterId = async (req, res, next) => {
  try {
    let get_one_data = await CompanyLetterhead.findAll({
      where: {
        companyMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};
