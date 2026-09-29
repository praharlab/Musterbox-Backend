const Sequelize = require('sequelize');
const MailConfiguration = require('../models/mailConfiguration');
const logger = require('../config/logger');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const companyMasters = require('../models/companyMaster');
const nodemailer = require('nodemailer');
/**
 * save mailConfiguration data.
 *
 * @body {createBy} createBy user id of user who added the mailConfiguration.
 * @body {number} createBy if any user change data then updateBy id change.
 
 */
exports.postAddMailConfiguration = async (req, res, next) => {
  try {
    let = {
      host,
      port,
      email,
      password,
      companyMasterID,
      createBy,
      createByIp,
      secure,
    } = await req.body;

    let gmailTransporterForGsuit = nodemailer.createTransport({
      host: host, // Gmail Host
      port: port, // Port
      secure: secure, // this is true as port is 465
      auth: {
        user: email, // generated ethereal user
        pass: password, // generated ethereal password
      },
    });

    try {
      const mailOptions = {
        from: email, // sender email address
        // to: "", // list of receivers
        to: email,
        subject: 'Conform Email', // Subject of Email
        text: 'Check for mail configure.', // plain text body
        replyTo: '', // If reply is required then add that emial address
        // attachments: attachments
      };

      gmailTransporterForGsuit.sendMail(mailOptions, function (err, body) {
        //If there is an error, render the error page
        if (err) {
          console.log(err);
          return res.status(200).json({
            status: 401,
            message: message.usermessage.mailconfigurationwrong,
            data: {},
          });
        }
        //Else we can greet\ and leave
        else {
          let insert_db_status = MailConfiguration.create({
            host,
            port,
            email,
            password,
            companyMasterID,
            createBy,
            createByIp,
          });

          return res.status(200).json({
            status: 200,
            message: message.usermessage.mailconfigurationadd,
            data: insert_db_status,
          });
        }
      });
    } catch (e) {
      return resolve({ status: 0, message: e });
    }
  } catch (err) {
    next(err);
  }
};

/**
 return all mailConfiguration data
 */

exports.getAllMailConfigurationData = async (req, res, next) => {
  try {
    let { limit, page, companyMasterID } = await req.body;
    let offset = (page - 1) * limit;
    let mailConfiguration_master = [],
      totalcount;

    if (limit == '' && page == '') {
      mailConfiguration_master = await MailConfiguration.findAll({
        raw: true,
        order: [['email', 'ASC']],
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
      });
      totalcount = await MailConfiguration.count({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        include: [{ model: companyMasters }],
      });
    } else {
      mailConfiguration_master = await MailConfiguration.findAll({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
        limit: limit,
        offset: offset,
        include: [{ model: companyMasters }],
        order: [['email', 'ASC']],
      });
      totalcount = await MailConfiguration.count({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: companyMasterID,
          },
          status: ['0', '1'],
        },
      });
    }

    res.status(200).json({
      status: 200,
      data: mailConfiguration_master,
      totalcount: totalcount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * find data with mailConfigurationMaster id
 *
 * @param {id} mailConfigurationID  to fetch mailConfiguration name
 */

exports.getMailConfigurationById = async (req, res, next) => {
  try {
    let get_one_data = await MailConfiguration.findOne({
      where: {
        mailConfigurationID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (!get_one_data) {
      res
        .status(200)
        .json({ status: 200, message: message.usermessage.deletedrecord });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update data
 *
 * @param {id} mailConfigurationID  to update id
 */
exports.postUpdateMailConfiguration = async (req, res, next) => {
  try {
    let {
      mailConfigurationID,
      host,
      port,
      email,
      password,
      companyMasterID,
      updateBy,
      updateByIp,
      secure,
    } = await req.body;

    let gmailTransporterForGsuit = nodemailer.createTransport({
      host: host, // Gmail Host
      port: port, // Port
      secure: secure, // this is true as port is 465
      auth: {
        user: email, // generated ethereal user
        pass: password, // generated ethereal password
      },
    });

    try {
      const mailOptions = {
        from: email, // sender email address
        // to: "", // list of receivers
        to: email,
        subject: 'Confirm Email', // Subject of Email
        text: 'Check for mail configure.', // plain text body
        replyTo: '', // If reply is required then add that emial address
        // attachments: attachments
      };

      return new Promise(async (resolve, reject) => {
        gmailTransporterForGsuit.sendMail(mailOptions, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            console.log(err);
            return res.status(200).json({
              status: 401,
              message: message.usermessage.mailconfigurationwrong,
              data: {},
            });
          }
          //Else we can greet\ and leave
          else {
            console.log('hello');
            let change_data_status = MailConfiguration.update(
              {
                mailConfigurationID,
                host,
                port,
                email,
                password,
                companyMasterID,
                updateBy,
                updateByIp,
              },
              {
                where: { mailConfigurationID: mailConfigurationID },
              }
            );

            res.status(200).json({
              status: 200,
              message: message.usermessage.mailconfigurationupdate,
            });
          }
        });
      });
    } catch (e) {
      return res.status(200).json({
        status: 401,
        message: message.usermessage.mailconfigurationwrong,
        data: {},
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * update status
 *
 * @param {id} mailConfigurationMasterID  to update status of mailConfiguration
 */

exports.poststatuschange = async (req, res, next) => {
  try {
    let { mailConfigurationID, status } = await req.body;
    let delete_status;
    let result = await sequelize.transaction(async (t) => {
      if (status == '1') {
        delete_status = await MailConfiguration.update(
          {
            status: '1',
          },
          {
            where: {
              mailConfigurationID: mailConfigurationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      } else {
        delete_status = await MailConfiguration.update(
          {
            status: '0',
          },
          {
            where: {
              mailConfigurationID: mailConfigurationID,
              status: ['1', '0'],
            },
            transaction: t,
          }
        );
      }

      if (delete_status != 0) {
        res.status(200).json({
          status: 200,
          message: message.usermessage.mailconfigurationdelete,
          data: {},
        });
      } else {
        res.status(200).json({
          status: 200,
          message: message.usermessage.deletedrecord,
          data: {},
        });
      }
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};

/**
 * delete by i
 *
 * @param {id} mailConfigurationMasterID  to delete id
 */
exports.postDeleteMailConfigurationById = async (req, res, next) => {
  try {
    let { mailConfigurationID } = await req.body;
    // let delete_db_status = await MailConfiguration.destroy({
    //     where: {
    //         mailConfigurationMasterID: mailConfigurationMasterID
    //     }
    // });
    let result = await sequelize.transaction(async (t) => {
      let delete_status = await MailConfiguration.update(
        {
          status: 2,
        },
        {
          where: { mailConfigurationID: mailConfigurationID },
          transaction: t,
        }
      );

      res.status(200).json({
        status: 200,
        message: message.usermessage.mailconfigurationdelete,
      });
      return delete_status;
    });
  } catch (err) {
    next(err);
  }
};
