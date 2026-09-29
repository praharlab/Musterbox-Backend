const message = require('../response_message/message');
const BankStatementFormat = require('../models/bankStatementFormat');
const companyMaster = require('../models/companyMaster');
const BankMaster = require('../models/bankMaster');
const CustomizeProfile = require('../models/customizeProfile');

exports.getcustomizeProfile = async (req, res, next) => {
  try {
    const { companyMasterID, page, limit } = req.body;

    if (!companyMasterID)
      return res.status(200).json({
        status: 401,
        message: message.usermessage.ValidParameters,
      });

    const condition = { companyMasterID };

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const data = await CustomizeProfile.findOne({
      where: condition,
      ...paginationQuery,
      include: [
        {
          model: companyMaster,
          attributes: ['companyName']
        },
      ],
    });

    return res.status(200).json({
      status: 200,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCustomizeProfile = async (req, res, next) => {
    try {
        const { companyMasterID, fields } = req.body;

        const existData = await CustomizeProfile.findOne({
            where: {
                companyMasterID: companyMasterID
            },
        });

        if (!existData) {
            await CustomizeProfile.create(
                {
                    companyMasterID,
                    fields,
                },
                {
                    user: req.userDetails,
                }
            );

            return res.status(200).json({
                status: 200,
                message: message.usermessage.addMessage('Format '),
            });
        } else {
            existData.fields = fields;

            await existData.save({
                user: req.userDetails,
            });

            return res.status(200).json({
                status: 200,
                message: 'Format updated successfully.',
            });
        }
    } catch (error) {
        next(error);
    }
};