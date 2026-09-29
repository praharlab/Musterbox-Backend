const DiscrepancyLetter = require("../models/discrepancyLetter");
const Sequelize = require("sequelize");
const CompanyMaster = require("../models/companyMaster");
const sequelize = require("../config/database");
const { usermessage } = require("../response_message/message");
const UserMaster = require("../models/userMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const EmployeeDiscrepancyLetter = require("../models/employeeDiscrepancyLetter");
const base64Img = require("base64-img");
const {
  asiaKolkataDateTime,
  addPageBreak,
  findCompanyNotificationPolicy,
} = require("../utils/commonUtilFunctions");
const { launch } = require("puppeteer");
const Handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const { template, templateSettings } = require("lodash");
const mailTemplateEditor = require("../models/mailTemplateEditor");
const { sendOfferLetter } = require("../middleware/sendemail");

exports.addEmployeeDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { discrepancyLetterID, userMasterID } = req.body;

    const findDiscrepancyLetter = await DiscrepancyLetter.findOne({
      where: {
        discrepancyLetterID: discrepancyLetterID,
      },
    });

    if (!findDiscrepancyLetter) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: usermessage.notFoundMessage("Discrepancy Letter"),
      });
    }
    await addGenerateLetter(
      userMasterID,
      findDiscrepancyLetter,
      "DiscrepancyLetter",
      req,
      transaction
    );

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.addMessage("Discrepancy Letter"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getEmployeeDiscrepancyLetter = async (req, res, next) => {
  try {
    const { limit, page, userMasterID, searchQuery } = await req.body;

    const condition = {};

    condition.status = 1;

    condition.userMasterID = userMasterID;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [["createdAt", "DESC"]];

    const { rows, count } = await EmployeeDiscrepancyLetter.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order,
      include: [
        { model: UserMaster, attributes: ["displayName"] },
        {
          model: DiscrepancyLetter,
          attributes: [
            "discrepancyLetterID",
            "discrepancyLetterName",
            "letterTemplate",
            "letterTemplate",
            "letterHead",
            "status",
            "companyMasterID",
          ],
        },
      ],
    });

    for (item of rows) {
      item.htmlContent = addPageBreak(item.discrepancyLetterHTML);
    }
    return res.status(200).json({
      status: 200,
      data: rows,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateEmployeeDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      userMasterID,
      discrepancyLetterHTML,
      employeeDiscrepancyLetterID,
      discrepancyLetterID,
      createBy,
      createByIp,
    } = await req.body;

    const letterDetails = await DiscrepancyLetter.findOne({
      raw: true,
      where: { discrepancyLetterID },
    });

    const letterResponse = await editGenerateLetter(
      "DiscrepancyLetter",
      userMasterID,
      discrepancyLetterHTML,
      discrepancyLetterID,
      createBy,
      createByIp,
      letterDetails,
      employeeDiscrepancyLetterID,
      transaction
    );
    await transaction.commit();
    return res.status(200).json(letterResponse);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};
exports.deleteEmployeeDiscrepancyLetter = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { employeeDiscrepancyLetterID } = await req.body;

    const findData = await EmployeeDiscrepancyLetter.findByPk(
      employeeDiscrepancyLetterID
    );

    await findData.destroy({
      user: req.userDetails,
      transaction,
    });
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: usermessage.deleteMessage("Discrepancy Letter"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.sendEmailDiscrepancyLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID, employeeDiscrepancyLetterID } =
      req.body;

    const fromtomail = await findCompanyNotificationPolicy(companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: "Please Set Email in Notification Policy.",
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 19,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: "Email template not found.",
      });
    }

    const data1 = await getDiscrepancyLetterData(
      userMasterID,
      employeeDiscrepancyLetterID
    );

    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : "";
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : "";
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : "";
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : "";

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: "User Email Not found.",
      });
    }
    // Replace placeholders in subject and body directly using empData properties
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace("[EmployeeCode]", empJoining ? empJoining.employeeCode : "")
      .replace("[EmployeeName]", userData ? userData.displayName : "")
      .replace("[EmployeeNumber]", userData ? userData.userNumber : "")
      .replace(
        "[Branch]",
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ""
      )
      .replace(
        "[Department]",
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ""
      )
      .replace(
        "[Designation]",
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ""
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace("[EmployeeCode]", empJoining ? empJoining.employeeCode : "")
      .replace("[EmployeeName]", userData ? userData.displayName : "")
      .replace("[EmployeeNumber]", userData ? userData.userNumber : "")
      .replace(
        "[Branch]",
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ""
      )
      .replace(
        "[Department]",
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ""
      )
      .replace(
        "[Designation]",
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ""
      );

    const offerLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(__dirname, "../", data1.path),
      secure: fromtomail.secure,
    };

    sendOfferLetter(offerLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: `Discrepancy Letter sent to ${recipientEmail} successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
//postAddUserLetters
async function addGenerateLetter(
  userMasterID,
  letterDetails,
  lettertype,
  req,
  transaction
) {
  let cont;
  try {
    const date = new Date().toISOString().slice(0, 10);
    const EmployeeData = await getEmployeeDetails(userMasterID);

    const employeecode =
      EmployeeData.employeeJoiningDetails &&
      EmployeeData.employeeJoiningDetails.length > 0 &&
      EmployeeData.employeeJoiningDetails[0].employeeCode
        ? EmployeeData.employeeJoiningDetails[0].employeeCode
        : "";
    const Branch =
      EmployeeData.employeeBranches &&
      EmployeeData.employeeBranches.length > 0 &&
      EmployeeData.employeeBranches[0].branchMaster
        ? EmployeeData.employeeBranches[0].branchMaster.branchName
        : "";

    const Designation =
      EmployeeData.employeeDepartments &&
      EmployeeData.employeeDepartments.length > 0 &&
      EmployeeData.employeeDepartments[0].department
        ? EmployeeData.employeeDepartments[0].department.departmentName
        : "";

    const Department =
      EmployeeData.employeeDesignations &&
      EmployeeData.employeeDesignations.length > 0 &&
      EmployeeData.employeeDesignations[0].designation
        ? EmployeeData.employeeDesignations[0].designation.designationName
        : "";

    const CompanyName = EmployeeData.companyMaster.companyName;
    const UserName = EmployeeData.displayName;
    const UserNumber = EmployeeData.userNumber;
    const currentDateTime = new Date().toISOString();

    //userLetters
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeCode]")
      .join(employeecode);

    const Email = EmployeeData.email;

    const PageBreak = `<div class="pageBreak"> </div>`;
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[PageBreak]")
      .join(PageBreak);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('class="ql-align-right"')
      .join('style="text-align:right"');
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('class="ql-align-center"')
      .join('style="text-align:center"');
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('class="ql-align-justify"')
      .join('style="text-align:justify;text-justify: inter-word;"');

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[CompanyName]")
      .join(CompanyName);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[UserName]")
      .join(UserName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeName]")
      .join(UserName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[UserNumber]")
      .join(UserNumber);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeNumber]")
      .join(UserNumber);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeEmailid]")
      .join(Email);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Branch]")
      .join(Branch);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Department]")
      .join(Department);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Designation]")
      .join(Designation);

    const fileName = `uploads/letter/${Date.now()}_${userMasterID}_${lettertype}.pdf`;

    if (letterDetails.letterHead == "yes") {
      const companyDetails = await CompanyMaster.findOne({
        raw: true,
        where: { companyMasterID: EmployeeData.companyMasterId },
      });

      let base64 = "";

      if (companyDetails.companyLogo) {
        const imagePath = path.join(
          __dirname,
          `../uploads/company/logo/${companyDetails.companyLogo}`
        );
        base64 = await new Promise((resolve, reject) => {
          base64Img.base64(imagePath, (err, data) => {
            if (err) reject(err);
            resolve(data);
          });
        });
      }

      const getTemplate = (type) =>
        path.join(__dirname, `../html/${type}.html`);
      const readFile = (name) => fs.promises.readFile(name, "utf-8");

      const filePath = getTemplate("preboardingLetterHead");
      companyDetails.base64 = base64;
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const headerTemplate = template(companyDetails);

      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: "Discrepancy Letter" };
      const pdfBuffer = await generatePDF(
        "preboardingOfferLetter",
        data1,
        headerTemplate
      );

      const pdfFilePath = path.join(__dirname, `../${fileName}`);
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    } else {
      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: "Discrepancy Letter" };
      const pdfBuffer = await generatePDF(
        "preboardingOfferLetter",
        data1,
        null
      );

      const pdfFilePath = path.join(__dirname, `../${fileName}`);

      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }
    await EmployeeDiscrepancyLetter.create(
      {
        path: fileName,
        userMasterID: userMasterID,
        discrepancyLetterID: letterDetails.discrepancyLetterID,
        discrepancyLetterHTML: cont,
      },
      { user: req.userDetails, transaction },
      { transaction }
    );
    // await transaction.commit();
  } catch (err) {
    // await transaction.rollback();
    console.error("Error generating letter:", err);
  }
}

async function editGenerateLetter(
  letterType,
  userMasterID,
  letterHTML,
  letterID,
  createBy,
  createByIp,
  letterDetails,
  employeeDiscrepancyLetterID,
  transaction
) {
  try {
    const date = new Date().toISOString().slice(0, 10);
    const PageBreak = `<div class="pageBreak"> </div>`;
    letterHTML = letterHTML.split("[PageBreak]").join(PageBreak);
    letterHTML = letterHTML
      .split('class="ql-align-right"')
      .join('style="text-align:right"');
    letterHTML = letterHTML
      .split('class="ql-align-center"')
      .join('style="text-align:center"');
    letterHTML = letterHTML
      .split('class="ql-align-justify"')
      .join('style="text-align:justify;text-justify: inter-word;"');

    const user = await UserMaster.findOne({
      raw: true,
      where: { userMasterID },
      include: [{ model: CompanyMaster, attributes: ["companyName"] }],
    });

    if (!user) {
      return { status: 401, message: `User not found` };
    }
    const fileName = `uploads/letter/${Date.now()}_${userMasterID}_${letterType}.pdf`;

    if (letterDetails.letterHead == "yes") {
      const companyDetails = await CompanyMaster.findOne({
        raw: true,
        where: { companyMasterID: user.companyMasterId },
      });

      let base64 = "";

      if (companyDetails.companyLogo) {
        const imagePath = path.join(
          __dirname,
          `../uploads/company/logo/${companyDetails.companyLogo}`
        );
        base64 = await new Promise((resolve, reject) => {
          base64Img.base64(imagePath, (err, data) => {
            if (err) reject(err);
            resolve(data);
          });
        });
      }

      companyDetails.companyName = companyDetails.companyName || "";
      companyDetails.companyAddress = companyDetails.companyAddress || "";
      companyDetails.companyEmail = companyDetails.companyEmail || "";
      companyDetails.companyLogo = companyDetails.companyLogo || "";
      companyDetails.cpMobileNo = companyDetails.cpMobileNo || "";
      companyDetails.companyWebsite = companyDetails.companyWebsite || "";

      const imagePath = path.join(
        __dirname,
        `../uploads/company/logo/${companyDetails.companyLogo}`
      );

      base64Img.base64(imagePath, async (err, data) => {
        if (err) {
          console.error("Error:", err);
        } else {
          base64 = data;
        }

        const getTemplate = (type) =>
          path.join(__dirname, `../html/${type}.html`);
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

        const filePath = getTemplate("preboardingLetterHead");
        companyDetails.base64 = base64;
        const file = await readFile(filePath);
        const template = Handlebars.compile(file);
        const headerTemplate = template(companyDetails);

        const content =
          `<div class="main1" style="font-size: 12px !important">` +
          letterHTML +
          `</div>`;
        const data1 = { content };
        const pdfBuffer = await generatePDF(
          "preboardingOfferLetter",
          data1,
          headerTemplate
        );
        const pdfFilePath = path.join(__dirname, `../${fileName}`);
        fs.writeFileSync(pdfFilePath, pdfBuffer);
      });
    } else {
      const content =
        `<div class="main1" style="font-size: 12px !important">` +
        letterHTML +
        `</div>`;
      const data1 = { content };
      const pdfBuffer = await generatePDF(
        "preboardingOfferLetter",
        data1,
        null
      );

      const pdfFilePath = path.join(__dirname, `../${fileName}`);
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }

    await EmployeeDiscrepancyLetter.update(
      {
        path: fileName,
        discrepancyLetterHTML: letterHTML,
        updateBy: createBy,
        updateByIp: createByIp,
      },
      {
        where: { employeeDiscrepancyLetterID: employeeDiscrepancyLetterID },
      },
      { transaction }
    );

    return { status: 200, message: `${letterType} Updated Successfully` };
  } catch (err) {
    console.error("Error generating letter:", err);
  }
}

async function getEmployeeDetails(userMasterID) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const data = await UserMaster.findOne({
    where: {
      userMasterID,
    },

    include: [
      {
        model: CompanyMaster,
        required: true,
        attributes: ["companyName", "companyLogo", "companyMasterID"],
      },
      {
        required: false,
        model: EmployeeJoiningDetails,
        attributes: [
          "employeeCode",
          "joiningDate",
          "dob",
          "adharCard",
          "employment",
        ],
      },
      {
        required: false,
        model: EmployeeBranch,
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(currentDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        attributes: ["branchID"],
        include: [
          {
            model: BranchMaster,
            as: "branchMaster",
            attributes: ["branchName", "branchAddress"],
          },
        ],
      },
      {
        required: false,
        model: EmployeeDepartment,
        attributes: ["departmentID"],
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(currentDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [
          {
            model: Department,
            as: "department",
            attributes: ["departmentName"],
          },
        ],
      },
      {
        required: false,
        model: EmployeeDesignation,
        attributes: ["designationID"],
        where: {
          status: 1,
          applicableDate: {
            [Sequelize.Op.lte]: new Date(currentDate),
          },
          [Sequelize.Op.or]: [
            {
              endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
            },
            {
              endDate: { [Sequelize.Op.eq]: null },
            },
          ],
        },
        include: [
          {
            model: Designation,
            as: "designation",
            attributes: ["designationName"],
          },
        ],
      },
    ],

    attributes: [
      "email",
      "displayName",
      "userNumber",
      "userMasterID",
      "companyMasterId",
    ],
  });

  return data;
}

async function generatePDF(htmlFileName, obj, headerTemplate) {
  try {
    const templatePath = path.join(
      __dirname,
      "../html/",
      `${htmlFileName}.html`
    );

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = fs.readFileSync(templatePath, "utf-8");
    const compiled = template(content);
    content = compiled(obj);

    const browser = await launch({
      // headless: true,
      headless: "new",
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(content, {
      waitUntil: "domcontentloaded",
    });
    await page.emulateMediaType("screen");

    if (headerTemplate) {
      const pdfBuffer = await page.pdf({
        format: "A4",
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: " ",
        margin: {
          top: "240px",
          bottom: "150px",
          right: "60px",
          left: "60px",
        },
        preferCSSPageSize: true,
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    } else {
      const pdfBuffer = await page.pdf({
        format: "A4",
        displayHeaderFooter: false,
        margin: {
          top: "240px",
          bottom: "150px",
          right: "60px",
          left: "60px",
        },
        preferCSSPageSize: true,
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    }
  } catch (error) {
    console.log("Error in Generate PDF Function", error);
  }
}

async function getDiscrepancyLetterData(
  userMasterID,
  employeeDiscrepancyLetterID
) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const data = await EmployeeDiscrepancyLetter.findOne({
    where: {
      userMasterID,
      employeeDiscrepancyLetterID,
    },
    include: [
      {
        required: true,
        model: UserMaster,
        attributes: ["email", "displayName", "userNumber", "companyMasterId"],
        include: [
          {
            model: EmployeeJoiningDetails,
            attributes: ["employeeCode"],
          },
          {
            model: EmployeeBranch,
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(currentDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
                },
                {
                  endDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
            attributes: ["branchID"],
            include: [
              {
                model: BranchMaster,
                as: "branchMaster",
                attributes: ["branchName"],
              },
            ],
          },
          {
            model: EmployeeDepartment,
            attributes: ["departmentID"],
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(currentDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
                },
                {
                  endDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
            include: [
              {
                model: Department,
                as: "department",
                attributes: ["departmentName"],
              },
            ],
          },
          {
            model: EmployeeDesignation,
            attributes: ["designationID"],
            where: {
              status: 1,
              applicableDate: {
                [Sequelize.Op.lte]: new Date(currentDate),
              },
              [Sequelize.Op.or]: [
                {
                  endDate: { [Sequelize.Op.gte]: new Date(currentDate) },
                },
                {
                  endDate: { [Sequelize.Op.eq]: null },
                },
              ],
            },
            include: [
              {
                model: Designation,
                as: "designation",
                attributes: ["designationName"],
              },
            ],
          },
          {
            model: CompanyMaster,
            attributes: ["companyName", "companyLogo"],
          },
        ],
      },
    ],
  });

  return data;
}
