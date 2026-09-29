const message = require('../response_message/message');
const OrgAuthorizationType = require("../models/orgAuthorizationType");
const { Sequelize } = require('sequelize');

exports.addOrgAuthorizationType = async (req, res, next) => {
  try {
    const { orgAuthorizationType } = req.body;

    const existData = await OrgAuthorizationType.findOne({
      where: {
        orgAuthorizationType,
      },
    });

    if (existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Org Authorization Master'
        ),
      });
    }

    await OrgAuthorizationType.create(
      {
        orgAuthorizationType
      },
      {
        user: req.userDetails,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage('Org Authorization Master '),
    });
  } catch (error) {
    next(error);
  }
};

exports.getOrgAuthorizationType = async (req, res, next) => {
  try {
    const { page, limit } = req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const { rows, count } = await OrgAuthorizationType.findAndCountAll({
      ...paginationQuery,
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateOrgAuthorizationType = async (req, res, next) => {
  try {
    const { orgAuthorizationTypeID, orgAuthorizationType } = req.body;

    const existingData = await OrgAuthorizationType.findOne({
      where: {
        orgAuthorizationType,
        orgAuthorizationTypeID: { [Sequelize.Op.ne]: orgAuthorizationTypeID },
      },
    });

    if (existingData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists(
          'Org Authorization Master'
        ),
      });
    }

    const existData = await OrgAuthorizationType.findOne({
      where: {
        orgAuthorizationTypeID
      },
    });

    if (!existData) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.notFoundMessage(
          'Org Authorization Master'
        ),
      });
    }

    existData.orgAuthorizationType = orgAuthorizationType;

    await existData.save({
      user: req.userDetails,
    });

    return res.status(200).json({
      status: 200,
      message: 'Org Authorization Master updated successfully.',
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrgAuthorizationType = async (req, res, next) => {
  try {
    const orgAuthorizationTypeID = req.params.id;

    await OrgAuthorizationType.destroy({
      where: {
        orgAuthorizationTypeID
      },
      user: req.userDetails,
    });

    res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage('Org Authorization Master'),
    });
  } catch (error) {
    next(error);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { orgAuthorizationTypeID, status } = await req.body;

    if (status != '1') {
    //   let data = await AuthorizationDetails.findOne({
    //     where: {
    //       AuthorizationMasterID: authorizationMasterID,
    //       status: ['0', '1'],
    //     },
    //   });

    //   if (data) {
    //     return res.status(200).json({
    //       status: 401,
    //       message:
    //         'You can not deactivate this Authorization Master.Already assigned to employees.',
    //     });
    //   }
    }
    await OrgAuthorizationType.update(
      {
        status,
      },
      {
        where: {
          orgAuthorizationTypeID,
        },
      }
    );

    return res.status(200).json({
      status: 200,
      message:
        status == '1'
          ? message.usermessage.activeMessage('Org Authorization Master')
          : message.usermessage.deactiveMessage('Org Authorization Master'),
      data: {},
    });
  } catch (err) {
    next(err);
  }
}

exports.getOrgAuthorizationTypeById = async(req, res, next) => {
    try {
        const orgAuthorizationTypeID = req.params.id;
    
        const data = await OrgAuthorizationType.findOne({
            where: {
                orgAuthorizationTypeID
            }
        })
    
        res.status(200).json({
            status: 200,
            data: data
        })
    } catch (error) {
        next(error);
    }
}