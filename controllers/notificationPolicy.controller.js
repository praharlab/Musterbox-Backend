const NotificationPolicy = require('../models/notificationPolicy');
const message = require('../response_message/message');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const CompanyMasters = require('../models/companyMaster');
const nodemailer = require('nodemailer');

const { sendEmailForLeave } = require('../middleware/sendemail');
const UserMaster = require('../models/userMaster');
const { ProjectName } = require('../utils/labelUtils');
const { findCompanyNotificationPolicy } = require('../utils/commonUtilFunctions');

exports.postAddNotificationPolicy = async (req, res, next) => {
  try {
    let {
      email,
      password,
      hostmail,
      port,
      companyMasterID,
      secure,
      status,
      createBy,
      createByIp,
    } = req.body; // Read email and password from the request body

    // Function to send the email using Nodemailer
    const sendEmail = async (email, password, company) => {
      try {
        let transporter = nodemailer.createTransport({
          hostmail: 'smtp.gmail.com',
          port: 5432,
          secure: false,

          auth: {
            user: 'vishal4310.veritas@gmail.com',
            pass: 'neealrhhlsrdtxxu',
          },
        });

        // Compose the email details
        let mailOptions = {
          from: email,
          to: email,
          subject: 'Notification Policy Details',
          text: `Company: ${company}\nEmail: ${email}\nPassword: ${password}`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        console.log('Email sent successfully.');
      } catch (err) {
        console.error('Error sending email:', err);
      }
    };

    let get_one_data = await NotificationPolicy.findOne({
      where: {
        companyMasterID: companyMasterID,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });

    if (get_one_data) {
      let change_data_status = await NotificationPolicy.update(
        {
          email,
          password,
          hostmail,
          port,
          status,
          secure,
          updateBy: createBy,
          updateByIp: createByIp,
        },
        {
          where: { notificationPolicyID: get_one_data.notificationPolicyID },
        }
      );

      // Send the email after successful database insertion
      sendEmail(email, password, 'Your Company Name');

      res.status(200).json({ status: 200, message: 'Update Data' });
      return change_data_status;
    } else {
      let result = await sequelize.transaction(async (t) => {
        let insert_db_status = await NotificationPolicy.create(
          {
            email,
            password,
            hostmail,
            port,
            companyMasterID,
            status,
            createBy,
            createByIp,
            secure,
          },
          { transaction: t }
        );

        // Send the email after successful database insertion
        sendEmail(email, password, 'Your Company Name');

        res
          .status(200)
          .json({ status: 200, message: 'Notification Policy Data Added' });
        return insert_db_status;
      });
    }
  } catch (err) {
    next(err);
  }
};

exports.getNotificationPolicyDataByCompanyId = async (req, res, next) => {
  try {
    let get_one_data = await NotificationPolicy.findOne({
      where: {
        companyMasterID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      raw: true,
    });
    if (get_one_data == null) {
      res.status(200).json({ status: 200, data: [] });
    } else {
      res.status(200).json({ status: 200, data: get_one_data });
    }
  } catch (err) {
    next(err);
  }
};

exports.TestEmail = async (req, res, next) => {
  try {
    let { companyMasterID, userMasterID } = req.body; // Read email and password from the request body

    const get_NotificationPolicy = await findCompanyNotificationPolicy(+companyMasterID)

    if (get_NotificationPolicy) {
      let userDetails = await UserMaster.findOne({
        raw: true,
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
      });

      if (userDetails) {
        if (userDetails.email) {
          let data = {
            email_id: userDetails.email,
            body: `Hi, this is Test mail from ${ProjectName}`,
            subject: `Test mail from ${ProjectName}`,
            email: get_NotificationPolicy.email,
            password: get_NotificationPolicy.password,
            port: get_NotificationPolicy.port,
            host: get_NotificationPolicy.hostmail,
            secure: get_NotificationPolicy.secure,
          };

          sendEmailForLeave(data);

          return res.status(200).json({
            status: 200,
            message: 'Test mail sent to your Email ID ' + userDetails.email,
          });
        } else {
          return res
            .status(200)
            .json({ status: 401, message: 'E-Mail address not found' });
        }
      } else {
        return res
          .status(200)
          .json({ status: 401, message: 'User Details not found' });
      }
    } else {
      return res
        .status(200)
        .json({ status: 401, message: 'Notification Policies not found' });
    }
  } catch (err) {
    next(err);
  }
};
