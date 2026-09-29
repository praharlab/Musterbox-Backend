const mailTemplateEditor = require("../models/mailTemplateEditor");
const message = require("../response_message/message");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const CompanyMasters = require("../models/companyMaster");
const MailTemplateType = require("../models/mailTemplateType");
const companyMaster = require("../models/companyMaster");
const UserMaster = require("../models/userMaster");
const { userAttributes } = require("../utils/commonVars");

exports.postAddMailEditor = async (req, res, next) => {
  try {
    const {
      mailTypeID,
      companyMasterID,
      subject,
      body,
      status,
      createBy,
      createByIp,
    } = req.body;
    const get_one_data = await mailTemplateEditor.findOne({
      where: {
        mailTypeID: mailTypeID,
        status: ["0", "1"],
        companyMasterID: companyMasterID,
      },
    });
    if (get_one_data) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.alreadyExists("Mail template"),
      });
    }
    // Insert data into the database
    await mailTemplateEditor.create({
      mailTypeID,
      companyMasterID,
      subject,
      body,
      status,
      createBy,
      createByIp,
    });

    // Respond with a success message and the inserted data
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Mail Template"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllMailEditor = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    const order = [['createdAt', 'DESC']];

    const { rows: getAllMailTemplate, count } =
      await mailTemplateEditor.findAndCountAll({
        raw: true,
        where: { status: 1, companyMasterID: companyMasterID },
        ...paginationQuery,
        order,
        include: [
          { required: false, model: CompanyMasters },
          { required: false, model: MailTemplateType },
          {
            required: false,
            model: UserMaster,
            as: "createdByUserDetails",
            attributes: userAttributes,
          },
          {
            required: false,
            model: UserMaster,
            as: "updatedByUserDetails",
            attributes: userAttributes,
          },
        ],
      });

    return res.status(200).json({
      status: 200,
      data: getAllMailTemplate,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMailTemplateEditorId = async (req, res, next) => {
  try {
    const get_one_data = await mailTemplateEditor.findOne({
      where: { mailTemplateID: req.params.id, status: ["0", "1"] },
      raw: true,
      include: [
        { required: false, model: CompanyMasters },
        { required: false, model: MailTemplateType },
        {
          required: false,
          model: UserMaster,
          as: "createdByUserDetails",
          attributes: userAttributes,
        },
        {
          required: false,
          model: UserMaster,
          as: "updatedByUserDetails",
          attributes: userAttributes,
        },
      ],
    });
    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatMailEditor = async (req, res, next) => {
  try {
    let = { mailTemplateID, subject, body } = await req.body;
    await mailTemplateEditor.update(
      {
        subject,
        body,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
      },
      {
        where: { mailTemplateID: mailTemplateID },
      }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Mail Template"),
    });
  } catch (err) {
    next(err);
  }
};

exports.postDeleteMailEditorById = async (req, res, next) => {
  try {
    let { mailTemplateID } = await req.body;
    await mailTemplateEditor.update(
      {
        status: "2",
      },
      {
        where: { mailTemplateID: mailTemplateID },
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Mail Template"),
    });
  } catch (err) {
    next(err);
  }
};

exports.poststatuschange = async (req, res, next) => {
  try {
    let { mailTemplateID, status } = await req.body;

    await mailTemplateEditor.update(
      {
        status: status,
      },
      {
        where: { mailTemplateID: mailTemplateID, status: ["1", "0"] },
      }
    );
    return res.status(200).json({
      status: 200,
      message:
        status == "1"
          ? message.usermessage.activeMessage("Mail Template")
          : message.usermessage.deactiveMessage("Mail Template"),
      data: {},
    });
  } catch (err) {
    next(err);
  }
};
