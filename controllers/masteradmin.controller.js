const masterAdmin = require('../models/master_admin');
const logger = require('../config/logger');
const message = require('../response_message/message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmailForOtp } = require('../middleware/sendemail');
/**
     * save master admin data.
     *
     * @body {createBy} createBy  to add insert user id.
     * @body {number} createBy if any user change data then updateBy id change .
     
     */
exports.postAddmasterAdmin = async (req, res, next) => {
  try {
    let = {
      first_name,
      last_name,
      phone,
      email_id,
      status,
      createBy,
      createByIp,
    } = await req.body;
    const salt = await bcrypt.genSalt(10);
    let password = bcrypt.hashSync(req.body.password, salt);

    let insert_db_status = await masterAdmin.create({
      first_name,
      last_name,
      phone,
      email_id,
      password,
      status,
      createBy,
      createByIp,
    });

    res.json({
      status: 200,
      message: message.usermessage.masteradminadd,
      data: {},
    });
  } catch (err) {
    next(err);
  }
};

// Master Admin login

exports.login = async (req, res) => {
  const { email_id, password } = req.body;

  if (email_id && password) {
    try {
      const user = await masterAdmin.findOne({
        where: {
          email_id,
        },
      });

      if (!user) {
        return res.json({
          status: 400,
          message: message.usermessage.usernotfound,
          data: {},
        });
      }
      if (bcrypt.compareSync(password, user.password)) {
        const token = {
          adminid: user.adminid,
        };
        const tokendata = await jwt.sign({ token }, process.env.SECRETKEY, {
          expiresIn: '1d',
        });
        const data = {
          token: tokendata,
          adminid: user.adminid,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          email_id: user.email_id,
        };
        return res.json({
          status: 200,
          message: message.usermessage.userlogin,
          data: data,
        });
      } else {
        return res.json({
          status: 400,
          message: message.usermessage.userwronginfo,
          data: {},
        });
      }
    } catch (err) {
      console.log(err);
      return res.json({ status: 500, message: err.message, data: {} });
    }
  }
  return res.json({
    status: 501,
    message: message.usermessage.userwronginfo,
    data: {},
  });
};

// Master Admin ChangePassword

exports.changepassword = async (req, res) => {
  const { body } = req;
  try {
    const profile = await masterAdmin.findOne({
      where: { adminid: body.id },
    });
    if (!profile) {
      return res.json({
        status: 400,
        message: message.usermessage.usernotfound,
        data: {},
      });
    } else {
      if (bcrypt.compareSync(body.password, profile.password)) {
        if (body.password != body.newpassword) {
          const salt = await bcrypt.genSalt(10);
          profile.password = bcrypt.hashSync(req.body.newpassword, salt);
          profile.save();
          return res.json({
            status: 200,
            message: message.usermessage.passwordchange,
            data: {},
          });
        } else {
          return res.json({
            status: 400,
            message: message.usermessage.oldnewsame,
            data: {},
          });
        }
      } else {
        return res.json({
          status: 400,
          message: message.usermessage.oldwrong,
          data: {},
        });
      }
    }
  } catch (err) {
    return res.json({ status: 500, message: err.message, data: {} });
  }
};

// Master Admin ForgotPassword

exports.forgot = async (req, res) => {
  const { email_id } = req.body;

  if (email_id) {
    try {
      const user = await masterAdmin.findOne({
        where: {
          email_id,
        },
      });

      if (!user) {
        return res.json({
          status: 400,
          message: message.usermessage.usernotfound,
          data: {},
        });
      } else {
        user.reset_password_token = Math.floor(1000 + Math.random() * 9000);
        await user.save();
        data = {
          reset_password_token: user.reset_password_token,
          email_id: user.email_id,
        };

        res.json({
          status: 200,
          message: message.usermessage.passwordsentmail,
          data: {},
        });
        sendEmailForOtp(data);
      }
    } catch (err) {
      console.log(err);
      return res.json({
        status: 500,
        message: message.usermessage.internalservererror,
        data: {},
      });
    }
  }

  return res.json({
    status: 500,
    message: message.usermessage.emailvalid,
    data: {},
  });
};

// Master Admin ResetPassword

exports.otpverifyandchangepassword = async (req, res) => {
  try {
    const { email_id } = req.body;
    const userExist = await masterAdmin.findOne({
      where: {
        email_id,
      },
    });
    if (userExist) {
      if (req.body.reset_password_token === userExist.reset_password_token) {
        if (bcrypt.compareSync(req.body.new_password, userExist.password)) {
          return res.json({
            status: 501,
            message: message.usermessage.oldnewsame,
            data: {},
          });
        } else {
          const salt = await bcrypt.genSalt(10);
          userExist.password = await bcrypt.hashSync(
            req.body.new_password,
            salt
          );
          await userExist.save();
          return res.json({
            status: 200,
            message: message.usermessage.passwordchange,
            data: {},
          });
        }
      } else {
        return res.json({
          status: 500,
          message: message.usermessage.otpinvalid,
          data: {},
        });
      }
    } else {
      return res.json({
        status: 500,
        message: message.usermessage.usernotfound,
        data: {},
      });
    }
  } catch (e) {
    res.json({ status: 500, message: e.message });
  }
};
