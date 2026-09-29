const Sequelize = require("sequelize");
const sequelize = require("../config/database");
const message = require("../response_message/message");
const companyMaster = require("../models/companyMaster");
const BranchMaster = require("../models/branchMaster");
const Department = require("../models/department");
const Designation = require("../models/designation");
const { generateExcel } = require("../utils/exportData");
const moment = require("moment");
const JoiningDocument = require("../models/joiningDocument");
const UserMaster = require("../models/userMaster");
const EmployeeDesignation = require("../models/employeeDesignation");
const DesignationWiseDocument = require("../models/designationWiseDocument");
const JoiningDocumentType = require("../models/joiningDocumentType");
const { asiaKolkataDateTime } = require("../utils/commonUtilFunctions");
const EmployeeDepartment = require("../models/employeeDepartment");
const EmployeeBranch = require("../models/employeeBranch");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const notificationPolicy = require("../models/notificationPolicy");
const nodemailer = require("nodemailer");
// add api
exports.addJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      attachment,
      fromDate,
      issueDate,
      expiryDate,
      identificationNumber,
      userMasterID,
      joiningDocumentMasterID,
      designationWiseDocumentID,
      remainderBeforeDays,
    } = await req.body;
    if (req.files) {
      attachment = "uploads/user/document/" + req.files[0].filename;
    }

    await JoiningDocument.create(
      {
        attachment: [attachment],
        fromDate,
        issueDate,
        expiryDate,
        identificationNumber,
        userMasterID,
        joiningDocumentMasterID,
        designationWiseDocumentID,
      },
      { user: req.userDetails },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.addMessage("Joining Document"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

exports.getJoiningDocumentByUserMasterID = async (req, res, next) => {
  try {
    let { userMasterID } = await req.query;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const condition = {
      status: 1,
      applicableDate: { [Sequelize.Op.lte]: new Date(currentdate) },
      [Sequelize.Op.or]: [
        { endDate: { [Sequelize.Op.gte]: new Date(currentdate) } },
        { endDate: { [Sequelize.Op.eq]: null } },
      ],
    };
    if (userMasterID) {
      condition.userMasterID = userMasterID;
    }
    condition.status = 1;

    const employeeDesignationData = await EmployeeDesignation.findOne({
      where: condition,
      include: [
        {
          model: Designation,
          as: "designation",
          attributes: ["designationName"],
        },
      ],
      attributes: [
        "employeeDesignationID",
        "designationID",
        "userMasterID",
        "applicableDate",
        "endDate",
      ],
    });

    if (!employeeDesignationData) {
      return res.status(200).json({
        status: 200,
        message: message.usermessage.notFoundMessage("Designation"),
        data: [],
      });
    }

    const [get_designationWise_Document, joining_Document] = await Promise.all([
      DesignationWiseDocument.findAll({
        raw: true,
        where: {
          designationId: employeeDesignationData.designationID,
          status: 1,
        },
        order: [["designationWiseDocumentID", "ASC"]],
        include: [
          {
            model: JoiningDocumentType,
            attributes: ["joiningDocumentMasterID", "documentName"],
          },
        ],
      }),
      JoiningDocument.findAll({
        raw: true,
        where: {
          userMasterID: userMasterID,
          status: 1,
        },
        order: [["joiningDocumentID", "ASC"]],
      }),
    ]);

    const finalExportData = get_designationWise_Document.map((e) => {
      const data = joining_Document.find(
        (document) =>
          e.designationWiseDocumentID == document.designationWiseDocumentID
      );

      if (data) {
        return {
          joiningDocumentMasterID: e.joiningDocumentMasterID,
          designationWiseDocumentID: data.designationWiseDocumentID,
          joiningDocumentID: data.joiningDocumentID,
          documentName: e["joiningDocumentType.documentName"],
          attachment: data.attachment ? data.attachment : "",
          issueDate: data.issueDate
            ? moment(data.issueDate).format("DD-MM-YYYY")
            : "",
          fromDate: data.fromDate
            ? moment(data.fromDate).format("DD-MM-YYYY")
            : "",
          expiryDate: data.expiryDate
            ? moment(data.expiryDate).format("DD-MM-YYYY")
            : "",
          identificationNumber: data.identificationNumber
            ? data.identificationNumber
            : null,
          isDocument: true,
          hasExpired:
            data.expiryDate && data.expiryDate < currentdate ? true : false,
        };
      } else {
        return {
          joiningDocumentMasterID: e.joiningDocumentMasterID,
          designationWiseDocumentID: e.designationWiseDocumentID,
          joiningDocumentID: null,
          documentName: e["joiningDocumentType.documentName"],
          attachment: null,
          fromDate: null,
          issueDate: null,
          expiryDate: null,
          identificationNumber: null,
          isDocument: false,
          hasExpired: false,
        };
      }
    });

    return res.status(200).json({
      status: 200,
      data: finalExportData,
    });
  } catch (err) {
    next(err);
  }
};

//Delete
exports.deleteJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { joiningDocumentID } = req.body;

    const findData = await JoiningDocument.findByPk(joiningDocumentID);
    if (!findData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 404,
        message: message.usermessage.notFoundMessage("Joining Document"),
      });
    }
    await findData.destroy(
      {
        user: req.userDetails,
      },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.deleteMessage("Joining Document"),
    });
  } catch (err) {
    await transaction.commit();
    next(err);
  }
};

// get By ID
exports.getJoiningDocumnetByID = async (req, res, next) => {
  try {
    let { joiningDocumentID } = req.query;
    const joiningDocumnetData = await JoiningDocument.findOne({
      where: {
        joiningDocumentID,
        status: 1,
      },
      include: [
        {
          model: UserMaster,
          attributes: ["userMasterID", "displayName", "userNumber"],
        },
        {
          model: JoiningDocumentType,
          attributes: ["joiningDocumentMasterID", "documentName"],
        },
        {
          model: DesignationWiseDocument,
          attributes: ["designationWiseDocumentID", "isRequired"],
        },
      ],
    });
    return res.status(200).json({ status: 200, data: joiningDocumnetData });
  } catch (err) {
    next(err);
  }
};

// Edit By ID
exports.editJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      joiningDocumentID,
      attachment,
      fromDate,
      issueDate,
      expiryDate,
      identificationNumber,
    } = await req.body;
    if (req.files) {
      attachment = "uploads/user/document/" + req.files[0].filename;
    }

    await JoiningDocument.update(
      {
        attachment: [attachment],
        fromDate,
        issueDate,
        expiryDate,
        identificationNumber,
      },
      {
        where: { joiningDocumentID: joiningDocumentID },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.updateMessage("Joining Document"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// Edit By ID
exports.renewJoiningDocument = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      joiningDocumentID,
      attachment,
      fromDate,
      issueDate,
      expiryDate,
      identificationNumber,
      userMasterID,
      joiningDocumentMasterID,
      designationWiseDocumentID,
    } = await req.body;
    if (req.files) {
      attachment = req.files[0].filename;
      attachment = "uploads/user/document/" + req.files[0].filename;
    }

    await JoiningDocument.update(
      {
        status: 0,
      },
      {
        where: { joiningDocumentID: joiningDocumentID, status: 1 },
      },
      {
        user: req.userDetails,
      },
      {
        transaction,
      }
    );

    await JoiningDocument.create(
      {
        attachment: [attachment],
        fromDate,
        issueDate,
        expiryDate,
        identificationNumber,
        userMasterID,
        joiningDocumentMasterID,
        designationWiseDocumentID,
      },
      { user: req.userDetails },
      { transaction }
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: message.usermessage.renewMessage("Joining Document"),
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// get By ID
exports.getJoiningDocumnetHistoryByID = async (req, res, next) => {
  try {
    let { joiningDocumentMasterID, userMasterID } = req.query;
    const joiningDocumnetData = await JoiningDocument.findAll({
      where: {
        userMasterID,
        joiningDocumentMasterID,
        status: [0, 1],
      },
      include: [
        {
          model: UserMaster,
          attributes: ["userMasterID", "displayName", "userNumber"],
        },
        {
          model: JoiningDocumentType,
          attributes: ["joiningDocumentMasterID", "documentName"],
        },
        {
          model: DesignationWiseDocument,
          attributes: ["designationWiseDocumentID", "isRequired"],
        },
      ],
    });
    return res.status(200).json({
      status: 200,
      data: joiningDocumnetData,
      totalcount: joiningDocumnetData.length,
    });
  } catch (err) {
    next(err);
  }
};

exports.expiryJoiningDocument = async (req, res, next) => {
  try {
    const { users, companyMasterID, exportData, page, limit } = await req.body;

    const filterDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const rawCurrentDate = new Date();
    const oneMonthLaterDate = new Date(rawCurrentDate);
    oneMonthLaterDate.setMonth(oneMonthLaterDate.getMonth() + 1);
    const formattedCurrentDate = asiaKolkataDateTime(new Date(rawCurrentDate));
    const formattedOneMonthLater = asiaKolkataDateTime(
      new Date(oneMonthLaterDate)
    );

    const paginationQuery = {};
    if (!exportData) {
      paginationQuery.offset = (+page - 1) * +limit;
      paginationQuery.limit = +limit;
    }

    let condition = {
      expiryDate: {
        [Sequelize.Op.not]: null,
        [Sequelize.Op.lte]: new Date(formattedOneMonthLater),
      },
    };

    if (users && users.length > 0) condition.userMasterID = users;

    if (companyMasterID)
      condition["$userMaster.companyMasterId$"] = companyMasterID;

    condition["$userMaster.status$"] = 1;
    condition.status = 1;

    const order = [["expiryDate", "ASC"]];
    const { rows: user, count } = await JoiningDocument.findAndCountAll({
      where: condition,
      ...paginationQuery,
      order,
      attributes: [
        "joiningDocumentID",
        "attachment",
        "fromDate",
        "issueDate",
        "expiryDate",
        "identificationNumber",
        "status",
        "userMasterID",
      ],
      include: [
        {
          required: true,
          model: UserMaster,
          attributes: ["displayName", "userNumber", "companyMasterId"],
          include: [
            // Employee Designation
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["designationID"],
              include: [
                {
                  model: Designation,
                  as: "designation",
                  attributes: ["designationName"],
                },
              ],
            },
            // Employee Department
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["departmentID"],
              include: [
                {
                  model: Department,
                  as: "department",
                  attributes: ["departmentName"],
                },
              ],
            },
            // Employee Branch
            {
              required: false,
              model: EmployeeBranch,
              where: {
                // ...(branchMasterID && { branchID: branchMasterID }),
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: new Date(filterDate) },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: new Date(filterDate) } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
              attributes: ["branchID"],
              include: [
                {
                  model: BranchMaster,
                  as: "branchMaster",
                  attributes: ["branchName"],
                },
              ],
            },
            // Employee Joining Details
            {
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ["employeeCode"],
            },
            // Company Master
            {
              required: false,
              model: companyMaster,
              attributes: ["companyMasterID", "companyName"],
            },
          ],
        },
        {
          model: JoiningDocumentType,
          attributes: ["joiningDocumentMasterID", "documentName"],
        },
        {
          model: DesignationWiseDocument,
          attributes: ["designationWiseDocumentID", "isRequired"],
        },
      ],
    });

    const finaldata = user.map((e) => {
      const expiryDates = e.expiryDate
        ? moment(e.expiryDate, "YYYY-MM-DD")
        : "";

      const currentDate = new Date(formattedCurrentDate.slice(0, 10));
      const dayDifference = Math.ceil(
        (expiryDates - new Date(formattedCurrentDate)) / (1000 * 3600 * 24)
      );

      return {
        displayName: e.userMaster.displayName,
        userMasterID: e.userMasterID,
        employeeCode:
          e.userMaster.employeeJoiningDetails.length > 0
            ? e.userMaster.employeeJoiningDetails[0].employeeCode
            : "",
        companyName: e.userMaster.companyMaster.companyName,
        branchName:
          e.userMaster.employeeBranches.length > 0
            ? e.userMaster.employeeBranches[0].branchMaster.branchName
            : "",
        departmentName:
          e.userMaster.employeeDepartments.length > 0
            ? e.userMaster.employeeDepartments[0].department.departmentName
            : "",
        designationName:
          e.userMaster.employeeDesignations.length > 0
            ? e.userMaster.employeeDesignations[0].designation.designationName
            : "",
        userNumber: e.userMaster.userNumber,
        documentName: e.joiningDocumentType.documentName,
        expiryDate: expiryDates.format("DD-MM-YYYY"),
        fromDate: e.fromDate
          ? moment(e.fromDate, "YYYY-MM-DD").format("DD-MM-YYYY")
          : "",
        issueDate: e.issueDate
          ? moment(e.issueDate, "YYYY-MM-DD").format("DD-MM-YYYY")
          : "",
        identificationNumber: e.identificationNumber,
        expiringstatus: expiryDates.isBefore(currentDate, "day")
          ? "2"
          : expiryDates.isSame(currentDate, "day")
            ? "0"
            : "1",
        status: expiryDates.isBefore(currentDate, "day")
          ? "Expired"
          : expiryDates.isSame(currentDate, "day")
            ? "Expiring Today"
            : `Expiring In ${dayDifference} Days`,
      };
    });

    if (exportData) {
      const finalExportData = finaldata.map((e) => {
        return {
          "Expiry Status": e.status,
          "Employee Code": e.employeeCode,
          "Employee Name": e.displayName,
          "User Number": e.userNumber,
          "Company Name": e.companyName,
          "Branch Name": e.branchName,
          "Department Name": e.departmentName,
          "Designation Name": e.designationName,
          "Document Name": e.documentName,
          "From Date": e.fromDate,
          "Expiry Date": e.expiryDate,
          "Issue Date": e.issueDate,
          "Identification Number": e.identificationNumber,
        };
      });

      return await generateExcel(
        finalExportData,
        "Expiry-Document",
        "xlsx",
        res
      );
    }
    return res.status(200).json({
      status: 200,
      data: finaldata,
      totalcount: count,
    });
  } catch (err) {
    next(err);
  }
};

exports.expiryJoiningCron = async (req, res, next) => {
  try {
    const currentFormattedDate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const currentDate = moment(currentFormattedDate, "YYYY-MM-DD");
    const oneMonthLaterDate = currentDate
      .clone()
      .add(30, "day")
      .format("YYYY-MM-DD");

    let condition = {
      status: 1,
      expiryDate: {
        [Sequelize.Op.eq]: oneMonthLaterDate,
      },
    };

    const order = [["expiryDate", "ASC"]];
    const joiningDocuments = await JoiningDocument.findAll({
      where: condition,
      order,
      attributes: [
        "joiningDocumentID",
        "attachment",
        "fromDate",
        "issueDate",
        "expiryDate",
        "identificationNumber",
        "status",
        "userMasterID",
      ],
      include: [
        {
          required: true,
          model: UserMaster,
          attributes: ["displayName", "userNumber", "email", "companyMasterId"],
          include: [
            {
              required: false,
              model: EmployeeDesignation,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentFormattedDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentFormattedDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["designationID"],
              include: [
                {
                  model: Designation,
                  as: "designation",
                  attributes: ["designationName"],
                },
              ],
            },
            {
              required: false,
              model: EmployeeDepartment,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentFormattedDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentFormattedDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },

              attributes: ["departmentID"],
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
              model: EmployeeBranch,
              where: {
                status: 1,
                applicableDate: { [Sequelize.Op.lte]: currentFormattedDate },
                [Sequelize.Op.or]: [
                  { endDate: { [Sequelize.Op.gte]: currentFormattedDate } },
                  { endDate: { [Sequelize.Op.eq]: null } },
                ],
              },
              required: false,
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
              required: false,
              model: EmployeeJoiningDetails,
              attributes: ["employeeCode"],
            },
            {
              required: false,
              model: companyMaster,
              attributes: ["companyMasterID", "companyName"],
            },
          ],
        },
        {
          model: JoiningDocumentType,
          attributes: ["joiningDocumentMasterID", "documentName"],
        },
        {
          model: DesignationWiseDocument,
          attributes: ["designationWiseDocumentID", "isRequired"],
        },
      ],
    });

    const userIds = new Set();
    const companyIds = new Set();
    const finalData = joiningDocuments.map((e) => {
      const expiryDate = moment(e.expiryDate, "YYYY-MM-DD");
      const dayDifference = expiryDate.diff(currentDate, "days");
      userIds.add(e.userMasterID);
      companyIds.add(e.userMaster.companyMasterId);
      return {
        displayName: e.userMaster.displayName,
        email: e.userMaster.email,
        companyId: e.userMaster.companyMasterId,
        userMasterId: e.userMasterID,
        employeeCode:
          e.userMaster.employeeJoiningDetails?.[0]?.employeeCode || "",
        companyName: e.userMaster.companyMaster.companyName,
        branchName:
          e.userMaster.employeeBranches?.[0]?.branchMaster?.branchName || "",
        departmentName:
          e.userMaster.employeeDepartments?.[0]?.department?.departmentName ||
          "",
        designationName:
          e.userMaster.employeeDesignations?.[0]?.designation
            ?.designationName || "",
        userNumber: e.userMaster.userNumber,
        documentName: e.joiningDocumentType.documentName,
        expiryDate: expiryDate.format("DD-MM-YYYY"),
        fromDate: e.fromDate
          ? moment(e.fromDate, "YYYY-MM-DD").format("DD-MM-YYYY")
          : "",
        issueDate: e.issueDate
          ? moment(e.issueDate, "YYYY-MM-DD").format("DD-MM-YYYY")
          : "",
        identificationNumber: e.identificationNumber,
        expiringStatus: expiryDate.isBefore(currentDate, "day")
          ? "2"
          : expiryDate.isSame(currentDate, "day")
            ? "0"
            : "1",
        status: expiryDate.isBefore(currentDate, "day")
          ? "Expired"
          : expiryDate.isSame(currentDate, "day")
            ? "Expiring Today"
            : `Expiring In ${dayDifference} Days`,
      };
    });

    if (companyIds.size) {
      const findNotificationPolicy = await notificationPolicy.findAll({
        raw: true,
        where: {
          companyMasterID: {
            [Sequelize.Op.in]: [...companyIds],
          },
          status: 1,
        },
      });

      for (const user of finalData) {
        if (user.email) {
          // Find the relevant notification policy for the company
          const policy = findNotificationPolicy.find(
            (policy) => policy.companyMasterID == user.companyId
          );

          if (policy) {
            const gmailTransporterForGsuit = nodemailer.createTransport({
              host: policy.hostmail, // Use hostmail from the policy
              port: policy.port, // Use port from the policy
              secure: policy.secure, // Use secure flag from the policy
              auth: {
                user: policy.email, // Use the email from the policy
                pass: policy.password, // Use the password from the policy
              },
            });

            const mailOptions = {
              from: policy.email, // Sender address
              to: user.email, // Recipient address (user's email)
              subject: "Document Expiry Notification",
              text: `
              Hello ${user.displayName},

              We hope this email finds you well. This is a reminder that your document '${user.documentName}' is set to expire on  ${user.expiryDate}.
              Please take the necessary steps to renew it before the expiration date to avoid any inconvenience.

              If you need any assistance, feel free to contact the HR department.

              Best regards,
              ${user.companyName}`,
            };

            // Send the email
            gmailTransporterForGsuit.sendMail(mailOptions, (err, info) => {
              if (err) {
                console.log("Error sending email:", err);
              } else {
                console.log("Email sent:", info.response);
              }
            });
          } else {
            console.log(
              `No notification policy found for company ID: ${user.companyId}`
            );
          }
        } else {
          console.log(`No email found for user id: ${user.userMasterId}`);
        }
      }
    }

    return res?.status(200).json({
      data: finalData,
      status: 200,
    });
  } catch (err) {
    next?.(err);
  }
};
