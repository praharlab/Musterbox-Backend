const nodemailer = require("nodemailer");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const Handlebars = require("handlebars");
const { ProjectName } = require("../utils/labelUtils");

let gmailTransporterForGsuit = nodemailer.createTransport({
  host: process.env.HOSTMAIL,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTPUSEREMAIL,
    pass: process.env.PASS,
  },
});

const getTemplate = (type) => {
  const file = path.join(__dirname, `../html/${type}.hbs`);
  return file;
};

const readFile = (name) => {
  return new Promise((resolve, reject) => {
    fs.readFile(name, "utf-8", (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

const sendEmailForOtp = async (data) => {
  try {
    if (data.email_id) {
      const filePath = await getTemplate("otp");
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);

      const replacements = {
        reset_password_token: data.reset_password_token,
        ProjectName: ProjectName,
      };
      const html = template(replacements);

      const mailOptions = {
        from: process.env.USEREMAIL,
        to: data.email_id,
        subject: "Verify Otp",
        html: html,
      };

      const result = await gmailTransporterForGsuit.sendMail(mailOptions);
      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

const sendEmailFornewuser = async (data) => {
  try {
    if (data.email) {
      const filePath = await getTemplate("createuser");
      const fileContent = await readFile(filePath);
      const template = Handlebars.compile(fileContent);

      const replacements = {
        user_email: data.mobile,
        user_password: data.password,
        ProjectName: ProjectName,
      };
      const html = template(replacements);

      const mailOptions = {
        from: process.env.USEREMAIL,
        to: data.email,
        subject: `Welcome To ${ProjectName}`,
        html: html,
      };

      const result = await gmailTransporterForGsuit.sendMail(mailOptions);
      return result;
    }
  } catch (error) {
    console.error(error);
    return;
  }
};

const sendEmailForExpenseReport = async (data) => {
  try {
    if (data && data.email_id) {
      const mailOptions = {
        from: process.env.USEREMAIL,
        to: data.email_id,
        subject: "Expense Report",
        text: "Please find the expense report attached.",
        replyTo: "",
        attachments: [
          {
            filename: `excel-file_${data.filename}.xlsx`,
            path: data.filePath,
          },
        ],
      };

      const result = await gmailTransporterForGsuit.sendMail(mailOptions);
      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

const sendEmailForLeave = async (data) => {
  try {
    if (data.email_id) {
      let gmailTransporterForTP = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.email,
          pass: data.password,
        },
      });

      const mailOptions = {
        from: data.email,
        to: data.email_id,
        subject: data.subject,
        html: data.body,
      };

      const result = await gmailTransporterForTP.sendMail(mailOptions);

      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

const sendEmailForLateEarlyReport = async (data) => {
  try {
    if (data.email_id) {
      let gmailTransporterForTP = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.email,
          pass: data.password,
        },
      });

      const mailOptions = {
        from: data.email,
        to: data.email_id,
        subject: data.subject,
        attachments: [
          {
            filename: `LateInEarlyGo.xlsx`,
            path: data.filePath,
          },
        ],
      };

      const result = await gmailTransporterForTP.sendMail(mailOptions);
      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

const sendOfferLetter = async (data, mailTemplate) => {
  try {
    if (data.email_id) {
      let gmailTransporterForTP = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.email,
          pass: data.password,
        },
      });

      const mailOptions = {
        from: data.email,
        to: data.email_id,
        subject: mailTemplate.subject,
        html: mailTemplate.body,
        attachments: [
          {
            filename: path.basename(data.filePath),
            path: data.filePath,
          },
        ],
      };

      const result = await gmailTransporterForTP.sendMail(mailOptions);

      return result;
    }
  } catch (error) {
    console.error(error);
    throw error; // Throw the error so that it can be caught and handled by the caller
  }
};
const sendEmailForJobApplication = async (data) => {
  try {
    if (data.email_id) {
      let gmailTransporterForTP = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.email,
          pass: data.password,
        },
      });

      const mailOptions = {
        from: data.email,
        to: data.email_id,
        subject: data.subject,
        html: data.body,
      };

      const result = await gmailTransporterForTP.sendMail(mailOptions);
      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};

const sendEmailForPrebordDocs = async (data) => {
  try {
    if (data.email_id) {
      let gmailTransporterForTP = nodemailer.createTransport({
        host: data.host,
        port: data.port,
        secure: data.secure,
        auth: {
          user: data.email,
          pass: data.password,
        },
      });

      const mailOptions = {
        from: data.email,
        to: data.email_id,
        subject: data.subject,
        html: data.body,
      };

      const result = await gmailTransporterForTP.sendMail(mailOptions);

      return result;
    }
  } catch (e) {
    console.error(e);
    return;
  }
};
module.exports = {
  sendEmailForOtp,
  sendEmailFornewuser,
  sendEmailForExpenseReport,
  sendEmailForLeave,
  sendEmailForLateEarlyReport,
  sendOfferLetter,
  sendEmailForJobApplication,
  sendEmailForPrebordDocs,
};
