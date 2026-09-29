const Sequelize = require("sequelize");
const Preboarding = require("../models/preboarding");
const message = require("../response_message/message");
const sequelize = require("../config/database");
const UserMaster = require("../models/userMaster");
const PreboardingCustomizeFieldValue = require("../models/preboardingformcustomizevalue");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const path = require("path");
const fs = require("fs");
const DesignationModel = require("../models/designation");
const PreboardingFormCustomize = require("../models/preboardingformcustomize");
const PreboardingMaster = require("../models/preboardingMaster");
const companyMaster = require("../models/companyMaster");
const BranchMaster = require("../models/branchMaster");
const OfferLetter = require("../models/offerLetter");
const Designation = require("../models/designation");
const { generateExcelForPreboarding } = require("../utils/exportData");
const PreboardingRequest = require("../models/preboardingrequest");
const { base64Topng } = require("../utils/base64Topng");
const { userAttributes, companyAttributes } = require("../utils/commonVars");
const { getLetterHeadHTML } = require("../utils/letterTemplate");
const {
  generateLetterPDF,
  generateOfferLetterPdf,
} = require("../utils/pdfGenerate");
const {
  generateSecretKey,
  findCompanyNotificationPolicy,
  signData,
  verifyData,
  encodeSecureBreak,
  readHTMLFile,
} = require("../utils/commonUtilFunctions");
const CountryMaster = require("../models/countrymaster");
const { sendApplicationNotification } = require("../utils/sendNotification");
const { getPreboardingMailTemplate } = require("../utils/mailTemplate");
const {
  mailTemplateTypes,
  preboardingStatusTypes,
} = require("../utils/dbUtils");
const { sendEmailForJobApplication } = require("../middleware/sendemail");
const JobApplication = require("../models/jobApplication");
const UserInbox = require("../models/UserInbox");
const moment = require("moment");
const {
  sendOfferLetter,
  sendEmailForPrebordDocs,
} = require("../middleware/sendemail");
const { mainApiUrl, appURL } = require("../utils/labelUtils");
const PrebordingDocument = require("../models/prebordingDocument");
const DesignationWiseDocument = require("../models/designationWiseDocument");

exports.postAddPreboarding = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      firstName,
      middleName,
      lastName,
      userNumber,
      dob,
      designationID,
      branchMasterID,
      ctc,
      joiningDate,
      address,
      email,
      preboardingstatus,
      companyMasterID,
      secretKey,
      nestedBody,
      userNumberCountryMasterID,
      employeeType,
      nationality,
      jobApplicationID,
    } = await req.body;

    if (!nestedBody || nestedBody.length == 0) {
      nestedBody = [];
    }
    const findPreboarding = await PreboardingMaster.findOne({
      where: {
        secretKey,
        status: 1,
      },
    });

    const insertPreboardingData = await Preboarding.create(
      {
        firstName,
        middleName,
        lastName,
        userNumber,
        dob,
        designationID,
        branchMasterID,
        ctc,
        joiningDate,
        address,
        email,
        preboardingstatus,
        companyMasterID,
        preboardingMasterID: findPreboarding.preboardingMasterID,
        userNumberCountryMasterID,
        employeeType,
        nationality,
        jobApplicationID,
      },
      { transaction, hooks: false }
    );

    for (let i = 0; i < nestedBody.length; i++) {
      let dataUrl = nestedBody[i].value;
      let answerValue = dataUrl;
      if (nestedBody[i].inputType == "signature") {
        answerValue = `signature_${Date.now()}.png`;
        const filePath = path.join(__dirname, "../uploads/preboarding");
        base64Topng(dataUrl, answerValue, filePath);
      }

      await PreboardingCustomizeFieldValue.create(
        {
          preboardingFormCustomizeID: nestedBody[i].preboardingFormCustomizeID,
          preboardingID: insertPreboardingData.preboardingID,
          value: answerValue,
        },
        { transaction }
      );
    }
    const userName = `${firstName} ${lastName}`;
    // Create UserInbox
    await UserInbox.create(
      {
        activityTable: Preboarding.getTableName(),
        activityTablePK: insertPreboardingData.toJSON().preboardingID,
        message: `${userName} has filled pre-boarding form at ${moment().format("DD/MM/YYYY HH:mm")}.`,
        assignedTo: null,
        assignedBy: null,
        companyMasterID: +companyMasterID,
      },
      { transaction }
    );
    await sendApplicationNotification(
      companyMasterID,
      userName,
      "HRPre-BoardingRequest",
      "Preboarding Request",
      "hrpreboarding",
      "Preboarding"
    );

    // Acknowledgement mail
    await sendPreboardingApplicationMail(
      insertPreboardingData.preboardingID,
      companyMasterID,
      mailTemplateTypes.preBoardingApplicationAcknowledgementMailTemplate,
      email,
      transaction
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Pre-Boarding"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getPreboardingById = async (req, res, next) => {
  try {
    const get_one_data = await Preboarding.findOne({
      where: {
        preboardingID: req.params.id,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          required: false,
          model: companyMaster,
          attributes: companyAttributes,
        },
        {
          required: false,
          model: DesignationModel,
          attributes: ["designationId", "designationName"],
        },
        {
          required: false,
          model: BranchMaster,
          attributes: ["branchMasterID", "branchName"],
        },
        {
          required: false,
          model: PreboardingMaster,
          attributes: ["preboardingMasterID", "preboardingMasterName"],
        },
        {
          required: false,
          model: CountryMaster,
          attributes: ["countryMasterID", "countryName", "countryCode"],
        },
        {
          required: false,
          model: OfferLetter,
          as: "offerLetterAssociation",
        },
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
        {
          required: false,
          model: JobApplication,
        },
        {
          required: false,
          model: PrebordingDocument,
        },
      ],
    });

    return res.status(200).json({ status: 200, data: get_one_data });
  } catch (err) {
    next(err);
  }
};

exports.postUpdatePreboarding = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      preboardingID,
      firstName,
      middleName,
      lastName,
      userNumber,
      dob,
      designationID,
      ctc,
      joiningDate,
      preboardingstatus,
      companyMasterID,
    } = await req.body;

    await Preboarding.update(
      {
        firstName,
        middleName,
        lastName,
        userNumber,
        dob,
        designationID,
        ctc,
        joiningDate,
        preboardingstatus,
        companyMasterID,
      },
      {
        where: { preboardingID: preboardingID },
        transaction,
        user: req.userDetails,
      }
    );
    await UserInbox.destroy(
      {
        where: {
          activityTable: Preboarding.getTableName(),
          activityTablePK: preboardingID,
        },
      },
      { transaction }
    );
    const findPreboarding = await Preboarding.findOne({
      where: {
        preboardingID,
      },
    });
    if (preboardingstatus == preboardingStatusTypes.ACCEPT) {
      await sendPreboardingApplicationMail(
        preboardingID,
        findPreboarding.companyMasterID,
        mailTemplateTypes.preBoardingAcceptMailTemplate,
        findPreboarding.email,
        transaction
      );
    }

    if (preboardingstatus == preboardingStatusTypes.REJECT) {
      await sendPreboardingApplicationMail(
        preboardingID,
        findPreboarding.companyMasterID,
        mailTemplateTypes.preBoardingRejectMailTemplate,
        findPreboarding.email,
        transaction
      );
    }

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Pre-Boarding"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.onboardStatusChange = async (req, res, next) => {
  try {
    const { preboardingID } = await req.body;
    const updateBy = req.userDetails.userMasterId;
    const updateByIp = req.userDetails.userIpAddress;
    await Preboarding.update(
      { preboardingstatus: "OnBoarded", updateBy, updateByIp },
      { where: { preboardingID: preboardingID } }
    );
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Pre-Bording"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreboardingByCompanyId = async (req, res, next) => {
  try {
    const {
      companyMasterID,
      limit,
      page,
      searchQuery,
      startdate,
      enddate,
      designationID,
      preboardingstatus,
      preboardingMasterID,
      branchMasterID,
      exportData,
    } = await req.body;

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [["createdAt", "DESC"]];

    const condition = {};
    condition.status = 1;
    condition.companyMasterID = companyMasterID;

    if (branchMasterID) condition.branchMasterID = branchMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        { firstName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { middleName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        { lastName: { [Sequelize.Op.iLike]: "%" + searchQuery + "%" } },
        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];

    if (designationID) condition.designationID = designationID;
    if (preboardingstatus && preboardingstatus.length != 0)
      condition.preboardingstatus = preboardingstatus;
    if (preboardingMasterID)
      condition.preboardingMasterID = preboardingMasterID;
    if (startdate && enddate) {
      const futureDate = new Date(new Date(enddate).getTime() + 86400000)
        .toISOString()
        .slice(0, 10);
      condition.createdAt = {
        [Sequelize.Op.between]: [new Date(startdate), new Date(futureDate)],
      };
    }

    const { rows: preboardingForm, count } = await Preboarding.findAndCountAll({
      raw: true,
      where: condition,
      ...paginationQuery,
      order: order,
      include: [
        { model: companyMaster },
        { model: BranchMaster, attributes: ["branchName"] },
        { model: DesignationModel, attributes: ["designationName"] },
        { model: CountryMaster, attributes: ["countryName", "countryCode"] },
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
        {
          required: false,
          model: JobApplication,
        },
      ],
    });
    const preboardingIDs = new Set();
    preboardingForm.map((e) => {
      preboardingIDs.add(e.preboardingID);
    });

    if (exportData) {
      if (preboardingForm.length == 0)
        return res
          .status(200)
          .json({ status: 401, message: "No data found to export!" });

      const finalDataToExport = [];
      let index = 0;

      const preBoardingRequestData = await PreboardingRequest.findAll({
        raw: true,
        where: { preboardingID: [...preboardingIDs] },
        order: [["preboardingRequestID", "ASC"]],
        include: [{ model: UserMaster, attributes: ["displayName"] }],
      });

      for (let item of preboardingForm) {
        const Prequest =
          preBoardingRequestData && preBoardingRequestData.length
            ? preBoardingRequestData.filter(
                (e) => e.preboardingID == item.preboardingID
              )
            : [];
        let lastIndex = 1;
        const createdAtDate = new Date(item.createdAt);
        createdAtDate.setHours(createdAtDate.getHours() + 5); // Add 5 hours
        createdAtDate.setMinutes(createdAtDate.getMinutes() + 30); // Add 30 minutes

        if (Prequest.length) {
          for (let item1 of Prequest) {
            let assignedto = "HR";
            if (lastIndex == Prequest.length) assignedto = "";
            lastIndex++;
            const Info = [
              index + 1,
              item.firstName + item.middleName + item.lastName,
              item.userNumberCountryMasterID
                ? `${item["countryMaster.countryCode"]}-${item.userNumber}`
                : item.userNumber,
              item.dob ? item.dob : "",
              item.email ? item.email : "",
              item.address ? item.address : "",
              item["branchMaster.branchName"]
                ? item["branchMaster.branchName"]
                : "",
              item["designation.designationName"]
                ? item["designation.designationName"]
                : "",
              createdAtDate,
              item1.createBy
                ? item1.createdByUserDetails?.displayName || ""
                : "",
              item1.remarks ? item1.remarks : "",
              item1.requeststatus ? item1.requeststatus : "",
              item1["userMaster.displayName"]
                ? item1["userMaster.displayName"]
                : assignedto,
            ];

            finalDataToExport.push(Info);
          }
        } else {
          const Info = [
            index + 1,
            item.firstName + item.middleName + item.lastName,
            item.userNumberCountryMasterID
              ? `${item["countryMaster.countryCode"]}-${item.userNumber}`
              : item.userNumber,
            item.dob ? item.dob : "",
            item.email ? item.email : "",
            item.address ? item.address : "",
            item["branchMaster.branchName"]
              ? item["branchMaster.branchName"]
              : "",
            item["designation.designationName"]
              ? item["designation.designationName"]
              : "",
            createdAtDate,
            "",
            "",
            "",
            "",
          ];
          finalDataToExport.push(Info);
        }

        index++;
      }
      await generateExcelForPreboarding(
        finalDataToExport,
        "Preboarding",
        "xlsx",
        res,
        [3, 2]
      );
      return;
    }

    return res.status(200).json({
      status: 200,
      data: preboardingForm,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.preBoardingFormDownload = async (req, res, next) => {
  try {
    let { preboardingID, preboardingMasterID } = await req.query;

    if (!preboardingID && !preboardingMasterID) {
      return res.status(200).json({
        status: 401,
        message: "preboardingID or preboardingMasterID not found!",
      });
    }
    const [
      preboardingCustomizeFieldAnswers,
      preboardingformcustomizeQuestions,
    ] = await Promise.all([
      PreboardingCustomizeFieldValue.findAll({
        where: {
          preboardingID: preboardingID,
        },
      }),

      await PreboardingFormCustomize.findAll({
        where: {
          preboardingMasterID: preboardingMasterID,
          status: 1,
        },
      }),
    ]);

    const getPreBoardindDatabyId = await Preboarding.findOne({
      where: {
        preboardingID: preboardingID,
        status: {
          [Sequelize.Op.in]: [0, 1],
        },
      },
      include: [
        {
          model: companyMaster,
          attributes: ["companyMasterID", "companyName"],
        },
        {
          model: DesignationModel,
          attributes: ["designationId", "designationName"],
        },
        { model: CountryMaster, attributes: ["countryName", "countryCode"] },
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
        {
          required: false,
          model: JobApplication,
        },
        {
          model: BranchMaster,
          attributes: ["branchMasterID", "branchName"],
        },
      ],
    });

    let basicInformation = [
      {
        FirstName: getPreBoardindDatabyId.firstName || "",
        MiddleName: getPreBoardindDatabyId.middleName || "",
        LastName: getPreBoardindDatabyId.lastName || "",
        UserNumber: getPreBoardindDatabyId.userNumberCountryMasterID
          ? `${getPreBoardindDatabyId.countryMaster.countryCode}-${getPreBoardindDatabyId.userNumber}` ||
            ""
          : getPreBoardindDatabyId.userNumber || "",
        Dob:
          moment(getPreBoardindDatabyId.dob, "YYYY-MM-DD").format(
            "DD-MM-YYYY"
          ) || "",
        Email: getPreBoardindDatabyId.email || "",
        Address: getPreBoardindDatabyId.address || "",
        Branch: getPreBoardindDatabyId?.branchMaster?.branchName || "",
        Designation: getPreBoardindDatabyId.designation.designationName || "",
        EmployeeType: getPreBoardindDatabyId.employeeType || "",
        Nationality: getPreBoardindDatabyId.nationality || "",
      },
    ];

    let fullName = `${basicInformation[0].FirstName}_${basicInformation[0].MiddleName}_${basicInformation[0].LastName}`;
    const preBoardingBasicFormData = [];
    for (let key in basicInformation[0]) {
      if (basicInformation[0].hasOwnProperty(key)) {
        preBoardingBasicFormData.push({
          question: key ? key : "",
          answer: basicInformation[0][key] ? basicInformation[0][key] : "",
        });
      }
    }
    let downloadPdfs = [];
    let downloadImages = [];
    let formTitle = [];
    const preBoardingFormData = [];
    preboardingformcustomizeQuestions.forEach((question) => {
      let correspondingAnswer = preboardingCustomizeFieldAnswers.find(
        (answer) =>
          question.preboardingFormCustomizeID ===
          answer.preboardingFormCustomizeID
      );

      let answerValue = correspondingAnswer ? correspondingAnswer.value : "";

      switch (question.inputType) {
        case "title":
          formTitle.push({
            question: question.fieldLabel ? question.fieldLabel : "",
            answer: correspondingAnswer ? correspondingAnswer.value : "",
          });
          break;
        case "pdf":
          answerValue = correspondingAnswer
            ? `${fullName}_${question.fieldLabel}.pdf`
            : "";
          if (correspondingAnswer) {
            downloadPdfs.push({
              question:
                question.fieldLabel && correspondingAnswer
                  ? `${fullName}_${question.fieldLabel}`
                  : "",
              answer: correspondingAnswer ? correspondingAnswer.value : "",
            });
          }
          break;
        case "image":
          answerValue = correspondingAnswer
            ? `${fullName}_${question.fieldLabel}`
            : "";
          if (correspondingAnswer) {
            downloadImages.push({
              question:
                question.fieldLabel && correspondingAnswer
                  ? `${fullName}_${question.fieldLabel}`
                  : "",
              answer: correspondingAnswer ? correspondingAnswer.value : "",
            });
          }
          break;
        default:
          break;
      }

      preBoardingFormData.push({
        question: question.fieldLabel ? question.fieldLabel : "",
        answer: answerValue,
      });
    });

    const getTemplate = (type) => {
      const file = path.join(__dirname, `../html/${type}.hbs`);
      return file;
    };

    Handlebars.registerHelper({
      eq: (v1, v2) => v1 === v2,
      ne: (v1, v2) => v1 !== v2,
      lt: (v1, v2) => v1 < v2,
      gt: (v1, v2) => v1 > v2,
      lte: (v1, v2) => v1 <= v2,
      gte: (v1, v2) => v1 >= v2,
      and() {
        return Array.prototype.every.call(arguments, Boolean);
      },
      or() {
        return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
      },
    });

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
    const data = {
      companyName: getPreBoardindDatabyId.companyMaster.companyName || "",
      preBoardingBasicFormData: preBoardingBasicFormData,
      formTitle: formTitle,
      preBoardingFormData: preBoardingFormData,
    };
    const filePath = await getTemplate("preBoarding");

    const file = await readFile(filePath);
    const template = Handlebars.compile(file);
    const htmlContent = template(data);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox"],
    });
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(htmlContent);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4", // Page format (A4 in this case)
      printBackground: true, // print background
      margin: { top: "20px", bottom: "20px" },
    });
    await browser.close();

    let randomNumber = Math.floor(Math.random() * 100000000);
    // Saving the PDF buffer to the uploaded file path
    const pdfFilePath = path.join(
      __dirname,
      `../uploads/preboarding/PreBoardingForm_${fullName}_${randomNumber}.pdf`
    );
    fs.writeFileSync(pdfFilePath, Buffer.from(pdfBuffer));

    const filename = `PreBoardingForm_${fullName}_${randomNumber}.pdf`;
    res.status(200).json({
      status: 200,
      filename: filename,
      downloadImages: downloadImages,
      downloadPdfs: downloadPdfs,
      message: "PreBoarding PDF Download Successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.addPreboardingMaster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      preboardingMasterName,
      preboardingMasterDescription,
      companyMasterID,
      preBoardingCustomize,
    } = req.body;

    const UniqueData = await PreboardingMaster.findOne({
      where: [
        sequelize.where(
          sequelize.fn(
            "TRIM",
            sequelize.fn("LOWER", sequelize.col("preboardingMasterName"))
          ),
          preboardingMasterName.trim().toLowerCase()
        ),
        { companyMasterID: companyMasterID },
      ],
      transaction,
    });

    if (UniqueData) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: message.usermessage.alreadyExists(
          "Pre-boarding Form With Same Name"
        ),
      });
    }
    const secretKey = await generateSecretKey(16);
    const createdData = await PreboardingMaster.create(
      {
        preboardingMasterName,
        preboardingMasterDescription,
        companyMasterID,
        secretKey,
      },
      { transaction, user: req.userDetails, individualHooks: true }
    );

    for (let item of preBoardingCustomize) {
      item.preboardingMasterID = createdData.preboardingMasterID;
      item.value = item.value?.length ? item.value : [];
    }

    await PreboardingFormCustomize.bulkCreate(preBoardingCustomize, {
      transaction,
      user: req.userDetails,
      individualHooks: true,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Pre-Boarding Form"),
    });
  } catch (err) {
    await transaction.rollback();

    next(err);
  }
};

exports.updatePreboardingMaster = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      preboardingMasterID,
      preboardingMasterName,
      preboardingMasterDescription,
      companyMasterID,
      preBoardingCustomize,
      removeID,
    } = await req.body;

    const UniqueData = await PreboardingMaster.findOne({
      where: {
        [Sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              "TRIM",
              sequelize.fn("LOWER", sequelize.col("preboardingMasterName"))
            ),
            preboardingMasterName.trim().toLowerCase()
          ),
          { companyMasterID: companyMasterID },

          { preboardingMasterID: { [Sequelize.Op.ne]: preboardingMasterID } },
        ],
      },
      transaction,
    });

    if (UniqueData) {
      await transaction.rollback();
      return res.status(200).send({
        status: 401,
        message: message.usermessage.alreadyExists(
          "Pre-boarding Form With Same Name"
        ),
      });
    }
    await PreboardingMaster.update(
      {
        preboardingMasterName,
        preboardingMasterDescription,
        companyMasterID,
      },
      {
        where: { preboardingMasterID: preboardingMasterID },
        transaction,
        user: req.userDetails,
        individualHooks: true,
      }
    );

    if (removeID.length > 0) {
      await PreboardingFormCustomize.update(
        { status: 2 },
        {
          where: { preboardingFormCustomizeID: removeID },
          transaction,
          user: req.userDetails,
          individualHooks: true,
        }
      );
    }

    const newData = [];

    for (let item of preBoardingCustomize) {
      if (!item.preboardingFormCustomizeID) {
        item.preboardingMasterID = preboardingMasterID;
        newData.push(item);
      }
    }
    await PreboardingFormCustomize.bulkCreate(newData, {
      transaction,
      user: req.userDetails,
      individualHooks: true,
    });

    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Pre-Boarding Form"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.deletePreboardingMaster = async (req, res, next) => {
  try {
    const { preboardingMasterID } = await req.body;

    await PreboardingMaster.update(
      { status: 2 },
      {
        where: { preboardingMasterID: preboardingMasterID },
        user: req.userDetails,
        individualHooks: true,
      }
    );

    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Pre-Boarding Form"),
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreboardingMaster = async (req, res, next) => {
  try {
    const { preboardingMasterID, limit, page, companyMasterID, searchQuery } =
      await req.body;

    if (preboardingMasterID) {
      const getPreboardingMasters = await PreboardingMaster.findOne({
        raw: true,
        where: {
          preboardingMasterID: preboardingMasterID,
        },
      });

      const getPreboardingCustomize = await PreboardingFormCustomize.findAll({
        raw: true,
        where: {
          preboardingMasterID: preboardingMasterID,
          status: 1,
        },
        order: [["sortingindex", "ASC"]],
      });

      for (var item of getPreboardingCustomize) {
        const preboardingCustomize_value =
          await PreboardingCustomizeFieldValue.findOne({
            raw: true,
            where: {
              preboardingFormCustomizeID: item.preboardingFormCustomizeID,
            },
          });
        if (preboardingCustomize_value) item.deleteShow = false;
        else item.deleteShow = true;
      }

      return res.status(200).json({
        status: 200,
        data: getPreboardingMasters,
        customizeData: getPreboardingCustomize,
      });
    }

    const condition = {};

    condition.status = 1;

    if (companyMasterID) condition.companyMasterID = companyMasterID;

    if (searchQuery)
      condition[Sequelize.Op.or] = [
        {
          preboardingMasterName: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
        {
          preboardingMasterDescription: {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },

        {
          "$companyMaster.companyName$": {
            [Sequelize.Op.iLike]: "%" + searchQuery + "%",
          },
        },
      ];

    const paginationQuery = {};
    if (page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }

    const order = [["createdAt", "DESC"]];

    const { rows: preBoardingMasters, count } =
      await PreboardingMaster.findAndCountAll({
        raw: true,
        where: condition,
        ...paginationQuery,
        order,
        include: [{ model: companyMaster, attributes: ["companyName"] }],
      });

    for (let item of preBoardingMasters) {
      const preboardingMain = await Preboarding.findOne({
        raw: true,
        where: {
          preboardingMasterID: item.preboardingMasterID,
        },
      });
      if (preboardingMain) item.deleteShow = false;
      else item.deleteShow = true;
    }

    return res.status(200).json({
      status: 200,
      data: preBoardingMasters,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.getPreboardingOfferLetter = async (req, res, next) => {
  try {
    const { preboardingID, offerLetterID } = await req.body;

    const getPreboarding = await Preboarding.findOne({
      raw: true,
      where: {
        preboardingID: preboardingID,
      },
      include: [
        { model: companyMaster, attributes: ["companyName", "letterHead"] },
        { model: BranchMaster, attributes: ["branchName"] },
        { model: DesignationModel, attributes: ["designationName"] },
        {
          required: false,
          model: JobApplication,
        },
      ],
    });

    const getOfferLetter = await OfferLetter.findOne({
      raw: true,
      where: {
        offerLetterID: offerLetterID,
      },
    });

    if (!getPreboarding || !getOfferLetter)
      return res
        .status(200)
        .json({ status: 401, message: "Details not found!" });

    let CompanyName = getPreboarding["companyMaster.companyName"];
    let UserName =
      getPreboarding.firstName +
      " " +
      getPreboarding.middleName +
      " " +
      getPreboarding.lastName;
    let UserNumber = getPreboarding.userNumber;
    let DateOfBirth = getPreboarding.dob;
    let Email = getPreboarding.email;
    let Address = getPreboarding.address;
    let Branch = getPreboarding["branchMaster.branchName"];
    let Designation = getPreboarding["designation.designationName"];
    let JoiningDate = getPreboarding.joiningDate
      ? new Date(getPreboarding.joiningDate)
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .split("/")
          .join("/")
      : "";
    let CTC = getPreboarding.ctc;

    const systemDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .split("/")
      .join("/");
    ``;
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split('class="ql-align-right"')
      .join('style="text-align:right"');
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split('class="ql-align-center"')
      .join('style="text-align:center"');
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split('class="ql-align-justify"')
      .join('style="text-align:justify;text-justify: inter-word;"');

    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[CompanyName]")
      .join(CompanyName);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[UserName]")
      .join(UserName);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[UserNumber]")
      .join(UserNumber);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[DateOfBirth]")
      .join(DateOfBirth);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[Email]")
      .join(Email);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[Address]")
      .join(Address);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[Branch]")
      .join(Branch);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[Designation]")
      .join(Designation);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[JoiningDate]")
      .join(JoiningDate);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[CTC]")
      .join(CTC);
    getOfferLetter.letterTemplate = getOfferLetter.letterTemplate
      .split("[SystemDate]")
      .join(systemDate);

    const offerletterHTML = getOfferLetter.letterTemplate;
    let headerTemplate = null;
    const fileName = `offerletter_${preboardingID}.pdf`;
    if (
      getOfferLetter.letterHead == "yes" ||
      getOfferLetter.letterHead == "no"
    ) {
      if (getOfferLetter.letterHead == "yes") {
        headerTemplate = await getLetterHeadHTML(
          getPreboarding.companyMasterID
        );
      }
      await preBoardingOfferLetterProcess(
        offerletterHTML,
        headerTemplate,
        fileName
      );
    } else {
      let letterHead = getPreboarding["companyMaster.letterHead"];
      if(!letterHead || letterHead == ''){
        return res.status(200).json({
        message: 'Company letter head not found! Please upload company letter head.',
        status: 401
      })
      }
      const cont = `<div class="main1">
        ${offerletterHTML}
      </div>`;
      const data1 = {
        content: cont,
        letterName: "Offer Letter",
        letterHead: letterHead,
      };
      const pdfBuffer = await generateOfferLetterPdf(
        "preboardingOfferLetter",
        data1
      );

      const pdfFilePath = path.join(__dirname, `../uploads/letter/${fileName}`);
      const uploadsDir = path.join(__dirname, "../uploads/letter");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }

    await Preboarding.update(
      {
        offerLetter: fileName,
        offerLetterHTML: offerletterHTML,
        offerLetterID: offerLetterID,
      },
      { where: { preboardingID: preboardingID } }
    );
    return res
      .status(200)
      .json({ status: 200, message: "Offer Letter generated successfully" });
  } catch (err) {
    next(err);
  }
};

exports.updatePreboardingOfferLetter = async (req, res, next) => {
  try {
    const { preboardingID, offerLetterID } = await req.body;
    let { offerLetterHTML } = await req.body;
    const getPreboarding = await Preboarding.findOne({
      raw: true,
      where: {
        preboardingID: preboardingID,
      },
      include: [
        { model: companyMaster, attributes: ["companyMasterID", "letterHead"] },
      ],
    });

    const getOfferLetter = await OfferLetter.findOne({
      raw: true,
      where: {
        offerLetterID: offerLetterID,
      },
    });

    if (!getPreboarding || !getOfferLetter)
      return res
        .status(200)
        .json({ status: 401, message: "Details not found!" });

    offerLetterHTML = offerLetterHTML?.split('class="ql-align-right"')
      .join('style="text-align:right"');
    offerLetterHTML = offerLetterHTML?.split('class="ql-align-center"')
      .join('style="text-align:center"');
    offerLetterHTML = offerLetterHTML?.split('class="ql-align-justify"')
      .join('style="text-align:justify;text-justify: inter-word;"');

    const offerletterHTML = offerLetterHTML;
    let headerTemplate = null;

    const fileName = `offerletter_${preboardingID}.pdf`;
    if (
      getOfferLetter.letterHead == "yes" ||
      getOfferLetter.letterHead == "no"
    ) {
      if (getOfferLetter.letterHead == "yes") {
        headerTemplate = await getLetterHeadHTML(
          getPreboarding.companyMasterID
        );
      }
      await preBoardingOfferLetterProcess(
        offerletterHTML,
        headerTemplate,
        fileName
      );
    } else {
      let letterHead = getPreboarding["companyMaster.letterHead"];
      if(!letterHead || letterHead == ''){
        return res.status(200).json({
        message: 'Company letter head not found! Please upload company letter head.',
        status: 401
      })
      }
      const cont = `<div class="main1">
        ${offerletterHTML}
      </div>`;
      const data1 = {
        content: cont,
        letterName: "Offer Letter",
        letterHead: letterHead,
      };
      const pdfBuffer = await generateOfferLetterPdf(
        "preboardingOfferLetter",
        data1
      );

      const pdfFilePath = path.join(__dirname, `../uploads/letter/${fileName}`);
      const uploadsDir = path.join(__dirname, "../uploads/letter");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }

    await Preboarding.update(
      {
        offerLetter: fileName,
        offerLetterHTML: offerletterHTML,
      },
      {
        where: { preboardingID: preboardingID },
        user: req.userDetails,
      }
    );
    return res
      .status(200)
      .json({ status: 200, message: "Offer Letter updated successfully" });
  } catch (err) {
    next(err);
  }
};

async function preBoardingOfferLetterProcess(
  offerletterHTML,
  headerTemplate,
  fileName
) {
  try {
    const cont =
      `<div class="main1" style="font-size: 12px !important">` +
      offerletterHTML +
      `</div>`;
    const data1 = {
      content: cont,
      letterName: "Offer Letter",
    };
    const pdfBuffer = await generateLetterPDF(
      "preboardingOfferLetter",
      data1,
      headerTemplate ? headerTemplate : null
    );

    const pdfFilePath = path.join(__dirname, `../uploads/letter/${fileName}`);
    const uploadsDir = path.join(__dirname, "../uploads/letter");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(pdfFilePath, pdfBuffer);
  } catch (error) {
    throw new Error("Error in offer Letter Process " + error.message);
  }
}

async function sendPreboardingApplicationMail(
  preboardingID,
  companyMasterID,
  mailTypeID,
  receiverEmail,
  transaction
) {
  try {
    if (!receiverEmail) return;
    const get_NotificationPolicy =
      await findCompanyNotificationPolicy(companyMasterID);
    if (!get_NotificationPolicy) return;
    const mailHeader = await getPreboardingMailTemplate(
      preboardingID,
      companyMasterID,
      mailTypeID,
      transaction
    );

    if (mailHeader) {
      let data = {
        email_id: receiverEmail,
        body: mailHeader.body,
        subject: mailHeader.subject,
        email: get_NotificationPolicy.email,
        password: get_NotificationPolicy.password,
        port: get_NotificationPolicy.port,
        host: get_NotificationPolicy.hostmail,
        secure: get_NotificationPolicy.secure,
      };
      sendEmailForJobApplication(data);
    }
  } catch (error) {
    throw new Error("Error in Sending Pre-Boarding Mail: " + error.message);
  }
}

exports.sendMailForAcceptance = async (req, res, next) => {
  try {
    const findNotificationPolicy = await findCompanyNotificationPolicy(
      req.body.comapnyID
    );
    if (!findNotificationPolicy) {
      return res.status(200).json({
        status: 401,
        message: "Notification Policy does not exist!",
      });
    }

    const data = await Preboarding.findOne({
      raw: true,
      where: {
        preboardingID: req.body.preboardingID,
      },
      include: [
        { model: companyMaster, attributes: ["companyName", "companyEmail"] },
        { model: BranchMaster, attributes: ["branchName", "branchAddress"] },
        { model: Designation, attributes: ["designationName"] },
      ],
    });
    if (!data.email) {
      return res.status(200).json({
        status: 401,
        message: "Candidate Email Not Found....",
      });
    }
    const filePath = path.join(__dirname, `../html/acceptanceMail.html`);
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

    const acceptedOfferData = {
      preboardingID: data.preboardingID,
      email: data.email,
      response: "accepted",
    };

    const rejectedOfferData = {
      preboardingID: data.preboardingID,
      email: data.email,
      response: "rejected",
    };

    const acceptedSigned = signData(acceptedOfferData);
    const rejectedSigned = signData(rejectedOfferData);

    const acceptUrl = `${mainApiUrl}preboarding/offer-response/${acceptedSigned}`;
    const rejectUrl = `${mainApiUrl}preboarding/offer-response/${rejectedSigned}`;

    let file = await readFile(filePath);
    file = file
      .replaceAll("[[NAME]]", data.firstName)
      .replaceAll("[[ACCEPTED]]", acceptUrl)
      .replaceAll("[[START_DATE]]", data.joiningDate)
      .replaceAll("[[POSITION]]", data["designation.designationName"])
      .replaceAll("[[COMPANY_NAME]]", data["companyMaster.companyName"])
      .replaceAll("[[CONTACT_EMAIL]]", data["companyMaster.companyEmail"])
      .replaceAll("[[REJECTED]]", rejectUrl);

    let get_MailTemplate = {
      subject: "Offer Acceptance Mail",
      body: file,
    };

    const payload = {
      host: findNotificationPolicy.hostmail,
      port: findNotificationPolicy.port,
      email: findNotificationPolicy.email,
      password: findNotificationPolicy.password,
      email_id: [data.email],
      filePath: path.join(
        __dirname,
        "..",
        "uploads",
        "letter",
        data.offerLetter
      ),
      secure: findNotificationPolicy.secure,
    };

    sendOfferLetter(payload, get_MailTemplate);

    await Preboarding.update(
      { acceptanceStatus: 1 },
      { where: { preboardingID: req.body.preboardingID } }
    );

    return res
      .status(200)
      .json({ status: 200, message: "Email Send Successfully" });
  } catch (err) {
    next(err);
  }
};

exports.getOfferResponse = async (req, res) => {
  try {
    const parsed = verifyData(req.params.signedData);
    const data = await Preboarding.findOne({
      raw: true,
      where: {
        preboardingID: parsed.preboardingID,
      },
    });
    if (data.acceptanceStatus == 0) {
      let html = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Offer Response Received</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f6f8;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .box {
              background: #fff;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              text-align: center;
            }
            h2 {
              color: #28a745;
            }
            p {
              color: #333;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>🎉 Response Recorded!</h2>
            <p>Thank you! Your offer response has been successfully submitted.</p>
          </div>
        </body>
        </html>`;
      return res.setHeader("Content-Type", "text/html").send(html);
    } else if (data.acceptanceStatus == 1) {
      if (parsed.response == "accepted") {
        await Preboarding.update(
          { acceptanceStatus: 2 },
          { where: { preboardingID: parsed.preboardingID } }
        );
      } else {
        await Preboarding.update(
          { acceptanceStatus: 3 },
          { where: { preboardingID: parsed.preboardingID } }
        );
      }

      let html = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Offer Response Received</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f6f8;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .box {
              background: #fff;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              text-align: center;
            }
            h2 {
              color: #28a745;
            }
            p {
              color: #333;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>🎉 Response Recorded!</h2>
            <p>Thank you! Your offer response has been successfully submitted.</p>
          </div>
        </body>
        </html>`;
      return res.setHeader("Content-Type", "text/html").send(html);
    } else {
      let html = `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Offer Response Already Received</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f6f8;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .box {
              background: #fff;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              text-align: center;
            }
            h2 {
              color: #ffc107;
            }
            p {
              color: #333;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>⚠️ Already Submitted</h2>
            <p>Looks like you've already submitted your response. Thank you!</p>
          </div>
        </body>
        </html>`;
      return res.setHeader("Content-Type", "text/html").send(html);
    }
  } catch (err) {
    let html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Error</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #fff4f4;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .box {
            background: #fff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
          }
          h2 {
            color: #dc3545;
          }
          p {
            color: #555;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>⚠️ Something Went Wrong</h2>
          <p>There was a problem processing your response. Please try again or contact HR.</p>
        </div>
      </body>
      </html>`;
    return res.setHeader("Content-Type", "text/html").send(html);
  }
};

exports.sendMailForPrebordingDocs = async (req, res, next) => {
  try {
    const json = JSON.stringify(req.body);

    const findNotificationPolicy = await findCompanyNotificationPolicy(
      req.body.comapnyID
    );
    if (!findNotificationPolicy) {
      return res.status(200).json({
        status: 401,
        message: "Notification Policy does not exist!",
      });
    }

    const data = await Preboarding.findOne({
      raw: true,
      where: {
        preboardingID: req.body.preboardingID,
      },
      include: [{ model: companyMaster, attributes: ["companyName"] }],
    });
    if (!data.email) {
      return res.status(200).json({
        status: 401,
        message: "Candidate Email Not Found....",
      });
    }
    const getDesignationWiseDocumentData =
      await DesignationWiseDocument.findOne({
        where: {
          designationId: data.designationID,
          status: 1,
        },
        order: [["designationWiseDocumentID", "ASC"]],
      });
    if (!getDesignationWiseDocumentData) {
      return res.status(200).json({
        status: 401,
        message:
          "Designationwise Document Not Found. Please Add Designationwise Document",
      });
    }
    const brockenString = encodeSecureBreak(json);

    const formURL = `${appURL}#/upload-preboard-docs/${brockenString}`;

    const filePath = path.join(__dirname, `../html/preBordingDocument.html`);

    let file = await readHTMLFile(filePath);
    file = file
      .replaceAll("[[NAME]]", data.firstName)
      .replaceAll("[[COMPANY_NAME]]", data["companyMaster.companyName"])
      .replaceAll("[[UPLOADLINK]]", formURL);

    const payload = {
      host: findNotificationPolicy.hostmail,
      port: findNotificationPolicy.port,
      email: findNotificationPolicy.email,
      password: findNotificationPolicy.password,
      email_id: [data.email],
      secure: findNotificationPolicy.secure,
      subject: "Prebording Documentation Required",
      body: file,
    };
    await Preboarding.update(
      { docUploadStatus: 1 },
      { where: { preboardingID: req.body.preboardingID } }
    );
    sendEmailForPrebordDocs(payload);
    return res
      .status(200)
      .json({ status: 200, message: "Email Send Successfully" });
  } catch (err) {
    next(err);
  }
};
