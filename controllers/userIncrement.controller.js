const userIncrementLetter = require("../models/userIncrementLetter");
const Sequelize = require("sequelize");
const { executeQuery } = require("./common.controller");
const companyMaster = require("../models/companyMaster");
const sequelize = require("../config/database");
const { usermessage } = require("../response_message/message");
const UserIncrementLetter = require("../models/userIncrementLetter");
const UserMaster = require("../models/userMaster");
const EmployeeJoiningDetails = require("../models/employeeJoiningDetails");
const IncrementLetter = require("../models/incrementLetter");
const {
  employeeBranch,
  employeeDesignation,
  employeeDepartment,
  getEmployeeAddress,
  asiaKolkataDateTime,
  userReportTo,
  addPageBreak,
  addSalaryStructureKeyword,
  onTableHtmlAddSalaryStructureKeyword,
  findCompanyNotificationPolicy,
} = require("../utils/commonUtilFunctions");
const EmployeeShift = require("../models/employeeShift");
const Shift = require("../models/shift");
const GradeSalaryStructure = require("../models/gradeSalaryStructure");
const HRSalaryMaster = require("../models/hrSalaryMaster");
const GradeStructure = require("../models/gradeStructure");
const HRSalaryFields = require("../models/hrSalaryFields");
const Payheadmaster = require("../models/payhead");
const { month_dict } = require("../utils/commonUtilFunctions");
const { join } = require("path");
const { readFileSync } = require("fs");
const { launch } = require("puppeteer");
const { template, templateSettings } = require("lodash");
const fs = require("fs");
const base64Img = require("base64-img");
const path = require("path");
const Handlebars = require("handlebars");
const EmployeeBranch = require("../models/employeeBranch");
const BranchMaster = require("../models/branchMaster");
const EmployeeDepartment = require("../models/employeeDepartment");
const Department = require("../models/department");
const EmployeeDesignation = require("../models/employeeDesignation");
const Designation = require("../models/designation");
const mailTemplateEditor = require("../models/mailTemplateEditor");
const { sendOfferLetter } = require("../middleware/sendemail");
const { log } = require("winston");
const UserReportTO = require("../models/employeeReportTo");
const moment = require("moment");
const { generateOfferLetterPdf } = require("../utils/pdfGenerate");

exports.getAllIncrementLetter = async (req, res, next) => {
  try {
    const { userMasterID } = req.body;

    const UserIncrements = await UserIncrementLetter.findAll({
      where: {
        userMasterID: userMasterID,
      },
    });

    if (!UserIncrements || UserIncrements.length === 0) {
      return res.status(200).json({
        status: 200,
        data: [
          {
            label: "Increment Letter",
            path: "",
            htmlContent: "",
            incrementLetterID: null,
            userincrementLetterID: null,
          },
        ],
      });
    }

    UserIncrements.forEach((increment) => {
      increment.incrementletterHTML = addPageBreak(
        increment.incrementletterHTML
      );
      increment.incrementletterHTML = addSalaryStructureKeyword(
        increment.incrementletterHTML
      );
      increment.incrementletterHTML = onTableHtmlAddSalaryStructureKeyword(
        increment.incrementletterHTML
      );
    });

    return res.status(200).json({
      status: 200,
      data: UserIncrements.map((increment) => ({
        label: "Increment Letter",
        path: increment.incrementLetter,
        htmlContent: increment.incrementletterHTML,
        incrementLetterID: increment.incrementLetterID,
        userincrementLetterID: increment.userincrementLetterID,
        oldSalaryStructure: increment.oldSalaryStructure,
        newSalaryStructure: increment.newSalaryStructure,
      })),
    });
  } catch (err) {
    next(err);
  }
};

async function generatePDF(htmlFileName, obj, headerTemplate) {
  try {
    const templatePath = join(__dirname, "../html/", `${htmlFileName}.html`);

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = readFileSync(templatePath, "utf-8");
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
          bottom: "140px",
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
          bottom: "140px",
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

async function getAddress(userMasterID) {
  let Address = "";
  const EmpAddress = await getEmployeeAddress(userMasterID);
  if (EmpAddress) {
    if (EmpAddress.houseNumber) Address += `${EmpAddress.houseNumber}, `;
    if (EmpAddress.houseName) Address += `${EmpAddress.houseName}, `;
    if (EmpAddress.landmark) Address += `${EmpAddress.landmark}, `;
    if (EmpAddress.area) Address += `${EmpAddress.area}, `;
    if (EmpAddress["cityMaster.cityName"])
      Address += `${EmpAddress["cityMaster.cityName"]}, `;
    if (EmpAddress["cityMaster.stateMaster.stateName"])
      Address += `${EmpAddress["cityMaster.stateMaster.stateName"]}, `;
    if (EmpAddress["cityMaster.stateMaster.countryMaster.countryName"])
      Address += `${EmpAddress["cityMaster.stateMaster.countryMaster.countryName"]} `;
    if (EmpAddress.zipcode) Address += `${EmpAddress.zipcode}`;
  }
  return Address;
}

async function getSalaryStructureHTML(userMasterID, salaryFromYYYYMM) {
  let finalOBJ = {
    CTC: "",
    Net: "",
    Gross: "",
    MonthlyCTC: "",
    MonthlyNet: "",
    MonthlyGross: "",
    SalaryStructure: "",
  };
  const salaryMasterdata = await HRSalaryMaster.findAll({
    raw: true,
    where: {
      userMasterID: userMasterID,
      salaryFromYYYYMM: salaryFromYYYYMM,
      "$gradeSalaryStructure.hrSalaryField.payheadMasterId$": {
        [Sequelize.Op.notIn]: [
          16, 17, 9, 24, 34, 43, 78, 83, 96, 97, 99, 67, 101,
        ],
      },
    },
    include: [
      {
        model: GradeSalaryStructure,
        include: [
          { model: GradeStructure, attributes: [] },
          {
            model: HRSalaryFields,
            include: [
              {
                model: Payheadmaster,
                attributes: [],
              },
            ],
            attributes: [],
          },
        ],
        attributes: [],
        order: [
          ["salaryfieldindex", "ASC"],
          [
            { model: HRSalaryFields, model: Payheadmaster },
            "payheadName",
            "ASC",
          ],
        ],
      },
    ],
    attributes: [
      [
        Sequelize.col(
          "gradeSalaryStructure.hrSalaryField.Payheadmaster.payheadName"
        ),
        "payheadName",
      ],
      "EmployeeSalaryAmount",
      "salaryFromYYYYMM",
      [
        Sequelize.col("gradeSalaryStructure.gradeStructure.baseOnCalculation"),
        "baseOnCalculation",
      ],
      [Sequelize.col("gradeSalaryStructure.formula"), "formula"],
      [
        Sequelize.col("gradeSalaryStructure.hrSalaryField.salaryFieldSrNo"),
        "salaryFieldSrNo",
      ],
      [
        Sequelize.col("gradeSalaryStructure.hrSalaryField.payheadMasterId"),
        "payheadMasterId",
      ],
      [
        Sequelize.col("gradeSalaryStructure.hrSalaryField.considerIn"),
        "considerIn",
      ],
    ],
  });

  const groupedData = {};

  salaryMasterdata.forEach((item) => {
    const year = item.salaryFromYYYYMM.toString().slice(0, 4); // Extract the year part
    const month1 = item.salaryFromYYYYMM.toString().slice(4);
    const month = item.salaryFromYYYYMM.toString();

    item.yearmonth = `${month_dict[month1]}-${year}`;

    if (!groupedData[month]) {
      groupedData[month] = {
        A: [],
        gross: [], // Gross
        B: [], // Employee Deduction
        AB: [],
        netPay: [], // add In Net Pay
        C: [],
        ctc: [], // Employer Deduction
        // items: [],
      };
    }

    // groupedData[month].items.push(item);

    if (![1, 50, 92].includes(item.payheadMasterId)) {
      if (item.salaryFieldSrNo === "A" && item.considerIn != "net") {
        groupedData[month].A.push(item);
      } else if (item.salaryFieldSrNo === "B") {
        groupedData[month].B.push(item);
      } else if (item.salaryFieldSrNo === "A" && item.considerIn == "net") {
        groupedData[month].AB.push(item);
      } else if (item.salaryFieldSrNo === "C") {
        groupedData[month].C.push(item);
      }
    }

    if (item.payheadMasterId == 1) {
      groupedData[month].ctc.push({
        ...item,
        salaryFieldSrNo: "",
        considerIn: "",
      });

      finalOBJ.MonthlyCTC = +item.EmployeeSalaryAmount;
      finalOBJ.CTC = +item.EmployeeSalaryAmount * 12;
    }

    if (item.payheadMasterId == 50) {
      groupedData[month].gross.push({
        ...item,
        salaryFieldSrNo: "",
        considerIn: "",
      });

      finalOBJ.MonthlyGross = +item.EmployeeSalaryAmount;
      finalOBJ.Gross = +item.EmployeeSalaryAmount * 12;
    }

    if (item.payheadMasterId == 92) {
      groupedData[month].netPay.push({
        ...item,
        salaryFieldSrNo: "",
        considerIn: "",
      });

      finalOBJ.MonthlyNet = +item.EmployeeSalaryAmount;
      finalOBJ.Net = +item.EmployeeSalaryAmount * 12;
    }
  });

  // Sort the grouped data by year and month
  const sortedKeys = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const result = sortedKeys.map((key) => {
    const group = groupedData[key];
    const { A, gross, B, AB, netPay, C, ctc } = group;

    return [...A, ...gross, ...B, ...AB, ...netPay, ...C, ...ctc];

    // return items.concat(
    //   {
    //     payheadName: "Gross",
    //     EmployeeSalaryAmount: A,
    //     salaryFromYYYYMM: "",
    //     salaryFieldSrNo: "",
    //     formula: "",
    //     baseOnCalculation: "",
    //   },
    //   {
    //     payheadName: "Net Pay",
    //     EmployeeSalaryAmount: +A - +B,
    //     salaryFromYYYYMM: "",
    //     salaryFieldSrNo: "",
    //     formula: "",
    //     baseOnCalculation: "",
    //   },
    //   {
    //     payheadName: "CTC",
    //     EmployeeSalaryAmount: +A + +C,
    //     salaryFromYYYYMM: "",
    //     salaryFieldSrNo: "",
    //     formula: "",
    //     baseOnCalculation: "",
    //   }
    // );
  });

  if (result.length == 0) return finalOBJ;

  const finalData = result[result.length - 1];

  let salaryType = finalData?.[0].baseOnCalculation || "";
  let baseOnCalculation = finalData?.[0].baseOnCalculation || "";

  // const finalData = [];
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == "A") {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //     baseOnCalculation = item.baseOnCalculation; // Capture baseOnCalculation from the first salary field
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == "Gross") {
  //     finalData.push(item);
  //     finalOBJ.MonthlyGross = +item.EmployeeSalaryAmount;
  //     finalOBJ.Gross = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == "B") {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == "Net Pay") {
  //     finalData.push(item);
  //     finalOBJ.MonthlyNet = +item.EmployeeSalaryAmount;
  //     finalOBJ.Net = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == "C") {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == "CTC") {
  //     finalData.push(item);
  //     finalOBJ.MonthlyCTC = +item.EmployeeSalaryAmount;
  //     finalOBJ.CTC = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }

  // Format the salaryFromYYYYMM as "Month-Year"
  let monthYearHeading =
    month_dict[String(salaryFromYYYYMM).slice(4, 6)] +
    "-" +
    String(salaryFromYYYYMM).slice(0, 4);

  // Adjust headers based on baseOnCalculation
  let tableHeaders = "";
  if (baseOnCalculation === "H") {
    tableHeaders = `
      <th style="text-align: center;padding : 2px">Amount(Hourly)</th>
    `;
  } else if (baseOnCalculation === "D") {
    tableHeaders = `
      <th style="text-align: center;padding : 2px">Amount(Daily)</th>
    `;
  } else if (baseOnCalculation === "M") {
    tableHeaders = `
      <th style="text-align: center;padding : 2px">Amount(Monthly)</th>
      <th style="text-align: center;padding : 2px">Amount(Yearly)</th>
    `;
  }

  let html = `<table border='1' id='SalaryStructureOfUser'
  style='border:1px solid black;border-collapse: collapse;'>
  <tr><th colspan="5" style="text-align: center; background-color: lightgray">
    Salary Structure for ${monthYearHeading}</th></tr>
  <tr>
    <th style="text-align: center;padding : 2px">Payhead Name</th>
    <th style="text-align: center;padding : 2px">Group</th>
    ${tableHeaders} 
  </tr>`;

  // Add rows with data based on baseOnCalculation
  for (var item of finalData) {
    let tempData = "<tr>";
    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      item.payheadName +
      "</td>";
    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      item.salaryFieldSrNo +
      "</td>";

    if (baseOnCalculation === "H") {
      tempData =
        tempData +
        '<td style="text-align: center;padding : 2px">' +
        item.EmployeeSalaryAmount +
        "</td>";
    } else if (baseOnCalculation === "D") {
      tempData =
        tempData +
        '<td style="text-align: center;padding : 2px">' +
        item.EmployeeSalaryAmount +
        "</td>";
    } else if (baseOnCalculation === "M") {
      tempData =
        tempData +
        '<td style="text-align: center;padding : 2px">' +
        item.EmployeeSalaryAmount +
        "</td>";
      let amt = salaryType == "M" ? +item.EmployeeSalaryAmount * 12 : "";
      tempData =
        tempData +
        '<td style="text-align: center;padding : 2px">' +
        amt +
        "</td>";
    }

    tempData = tempData + "</tr>";
    html = html + tempData;
  }

  html = html + `</table>`;

  finalOBJ.SalaryStructure = html;

  if (salaryType != "M") {
    finalOBJ.CTC = "";
    finalOBJ.Gross = "";
    finalOBJ.Net = "";
  }
  return finalOBJ;
}

async function getEmployeeShift(userid, date) {
  let shiftName = "";
  const getShift = await EmployeeShift.findOne({
    raw: true,
    where: {
      userMasterID: userid,
      status: 1,
      startDate: {
        [Sequelize.Op.lte]: new Date(date),
      },
      [Sequelize.Op.or]: [
        {
          endDate: {
            [Sequelize.Op.gte]: new Date(date),
          },
        },
        {
          endDate: { [Sequelize.Op.eq]: null },
        },
      ],
    },
  });

  if (getShift) {
    if (getShift.shiftID) {
      const getShiftName = await Shift.findOne({
        raw: true,
        where: {
          shiftID: getShift.shiftID,
        },
        attributes: ["shiftName"],
      });
      shiftName = getShiftName ? getShiftName.shiftName : "";
    } else if (getShift.shiftsID && getShift.shiftsID.length) {
      const getShiftName = await Shift.findOne({
        raw: true,
        where: {
          shiftID: getShift.shiftsID[0],
        },
        attributes: ["shiftName"],
      });
      shiftName = getShiftName ? getShiftName.shiftName : "";
    }
  }
  return shiftName;
}

async function getEmployeeDetails(userMasterID) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const data = await UserMaster.findOne({
    where: {
      userMasterID,
    },

    include: [
      {
        model: companyMaster,
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
      {
        required: false,
        model: UserReportTO,
        include: [
          {
            model: UserMaster,
            as: "reportTo",
            attributes: ["displayName"],
          },
        ],
        attributes: ["reportToID"],
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

async function generateLetter(
  userMasterID,
  letterDetails,
  user,
  // empjoining,
  lettertype,
  oldSalaryStructure,
  newSalaryStructure,
  req,
  letterHead
) {
  let cont;
  try {
    const timestamp = Date.now();
    const date = asiaKolkataDateTime(new Date()).slice(0, 10);

    const EmployeeData = await getEmployeeDetails(userMasterID);

    const Employeejoining =
      EmployeeData.employeeJoiningDetails &&
      EmployeeData.employeeJoiningDetails.length > 0
        ? EmployeeData.employeeJoiningDetails[0]
        : null;

    const Branch =
      EmployeeData.employeeBranches &&
      EmployeeData.employeeBranches.length > 0 &&
      EmployeeData.employeeBranches[0].branchMaster
        ? EmployeeData.employeeBranches[0].branchMaster.branchName
        : "";

    const Department =
      EmployeeData.employeeDepartments &&
      EmployeeData.employeeDepartments.length > 0 &&
      EmployeeData.employeeDepartments[0].department
        ? EmployeeData.employeeDepartments[0].department.departmentName
        : "";

    const Designation =
      EmployeeData.employeeDesignations &&
      EmployeeData.employeeDesignations.length > 0 &&
      EmployeeData.employeeDesignations[0].designation
        ? EmployeeData.employeeDesignations[0].designation.designationName
        : "";

    const ReportTOPerson =
      EmployeeData.employeeReportTos &&
      EmployeeData.employeeReportTos.length > 0 &&
      EmployeeData.employeeReportTos[0].reportTo
        ? EmployeeData.employeeReportTos[0].reportTo.displayName
        : "";

    const BranchAddress =
      EmployeeData.employeeBranches &&
      EmployeeData.employeeBranches.length > 0 &&
      EmployeeData.employeeBranches[0].branchMaster
        ? EmployeeData.employeeBranches[0].branchMaster.branchAddress
        : "";

    const CompanyName = EmployeeData.companyMaster.companyName;
    const UserName = EmployeeData.displayName;
    const UserNumber = EmployeeData.userNumber;

    const DateOfBirth =
      Employeejoining && Employeejoining.dob
        ? Employeejoining.dob.split("-").reverse().join("-")
        : "";

    const employeement =
      EmployeeData.employeeJoiningDetails &&
      EmployeeData.employeeJoiningDetails.length > 0 &&
      EmployeeData.employeeJoiningDetails.employment
        ? EmployeeData.employeeJoiningDetails.employment
        : "";

    const employeecode =
      EmployeeData.employeeJoiningDetails &&
      EmployeeData.employeeJoiningDetails.length > 0 &&
      EmployeeData.employeeJoiningDetails[0].employeeCode
        ? EmployeeData.employeeJoiningDetails[0].employeeCode
        : "";

    //userLetters
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeCode]")
      .join(employeecode);

    const Email = EmployeeData.email;

    const JoiningDate =
      EmployeeData && Employeejoining.joiningDate
        ? Employeejoining.joiningDate.split("-").reverse().join("-")
        : "";

    const AdharcardNo = EmployeeData.employeeJoiningDetails[0]
      ? EmployeeData.employeeJoiningDetails[0].adharCard
      : "";

    const shiftName = await getEmployeeShift(userMasterID, date);
    const systemDate = new Date()
      .toISOString()
      .slice(0, 10)
      .split("-")
      .reverse()
      .join("-");
    let currentDateTime = new Date().toISOString();
    currentDateTime = moment(currentDateTime).format("DD-MM-YYYY HH:mm:ss");
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

    let OldNet = "";
    let NewNet = "";
    let OldMonthlyNet = "";
    let NewNetMonethlyNet = "";

    if (oldSalaryStructure) {
      const DATA = await getSalaryStructureHTML(
        userMasterID,
        oldSalaryStructure
      );

      OldNet = DATA.Net;
      OldMonthlyNet = DATA.MonthlyNet;

      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldCTC]")
        .join(DATA.CTC);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldNet]")
        .join(DATA.Net);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldGross]")
        .join(DATA.Gross);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldMonthlyCTC]")
        .join(DATA.MonthlyCTC);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldMonthlyNet]")
        .join(DATA.MonthlyNet);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldMonthlyGross]")
        .join(DATA.MonthlyGross);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[OldSalaryStructure]")
        .join(DATA.SalaryStructure);
    }

    if (newSalaryStructure) {
      const DATA = await getSalaryStructureHTML(
        userMasterID,
        newSalaryStructure
      );

      NewNet = DATA.Net;
      NewNetMonethlyNet = DATA.MonthlyNet;

      const monthName = String(newSalaryStructure);
      // Extract the year and month
      const year = parseInt(monthName.substring(0, 4), 10); // Extract year
      const month = parseInt(monthName.substring(4, 6), 10) - 1; // Extract month (0-indexed)

      // Get the month's name
      const EffectiveMonth = new Date(year, month).toLocaleString("en-US", {
        month: "long",
      });

      const monthNameFull = new Date(year, month).toLocaleString("en-US", {
        month: "long",
      });

      // Construct EffectiveDate
      const EffectiveDate = `01 ${monthNameFull} ${year}`;

      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewCTC]")
        .join(DATA.CTC);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewNet]")
        .join(DATA.Net);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewGross]")
        .join(DATA.Gross);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewMonthlyCTC]")
        .join(DATA.MonthlyCTC);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewMonthlyNet]")
        .join(DATA.MonthlyNet);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewMonthlyGross]")
        .join(DATA.MonthlyGross);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[NewSalaryStructure]")
        .join(DATA.SalaryStructure);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[EffectiveMonth]")
        .join(EffectiveMonth);
      letterDetails.letterTemplate = letterDetails.letterTemplate
        .split("[EffectiveDate]")
        .join(EffectiveDate);
    }
    const NetDifferenceYearly = NewNet - OldNet;
    const NetDifferenceMonthly = NewNetMonethlyNet - OldMonthlyNet;

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Address]")
      .join(await getAddress(userMasterID));
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[CompanyName]")
      .join(CompanyName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[UserName]")
      .join(UserName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[UserNumber]")
      .join(UserNumber);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[DateOfBirth]")
      .join(DateOfBirth);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeementType]")
      .join(employeement);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Email]")
      .join(Email);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[ShiftName]")
      .join(shiftName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Branch]")
      .join(Branch);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Designation]")
      .join(Designation);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[Department]")
      .join(Department);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[JoiningDate]")
      .join(JoiningDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[BranchAddress]")
      .join(BranchAddress);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[SystemDate]")
      .join(systemDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[CurrentDate]")
      .join(systemDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[CurrentDateTime]")
      .join(currentDateTime);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeName]")
      .join(UserName);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeNumber]")
      .join(UserNumber);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeCode]")
      .join(employeecode);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[EmployeeEmailid]")
      .join(Email);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[NetDifferenceMonthly]")
      .join(NetDifferenceMonthly);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split("[NetDifferenceYearly]")
      .join(NetDifferenceYearly);

    let letterName;

    if (lettertype == "incrementletter") {
      letterName = "Increment Letter";
    }

    if (letterDetails.letterHead == "yes") {
      const companyDetails = await companyMaster.findOne({
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

      const getTemplate = (type) =>
        path.join(__dirname, `../html/${type}.html`);
      const readFile = (name) => fs.promises.readFile(name, "utf-8");

      const filePath = await getTemplate("preboardingLetterHead");
      companyDetails.base64 = base64;
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const headerTemplate = template(companyDetails);

      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: letterName };
      const pdfBuffer = await generatePDF(
        "preboardingOfferLetter",
        data1,
        headerTemplate
      );

      // const pdfFilePath = `./uploads/letter/${lettertype}_${userMasterID}.pdf`;

      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}_${timestamp}.pdf`
      ); // Append timestamp to filename
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    } else if (letterDetails.letterHead == "no") {
      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: letterName };
      const pdfBuffer = await generatePDF(
        "preboardingOfferLetter",
        data1,
        null
      );

      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}_${timestamp}.pdf`
      ); // Append timestamp to filename
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    } else {
      if (letterHead) {
        imagePath =
          process.env.APIURL + `uploads/company/letterHead/${letterHead}`;
      }

      const cont = `<div class="main1">
        ${letterDetails.letterTemplate}
      </div>`;

      const data1 = {
        content: cont,
        letterName: letterName,
        letterHead: letterHead,
      };
      const pdfBuffer = await generateOfferLetterPdf(
        "preboardingOfferLetter",
        data1
      );
      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}_${timestamp}.pdf`
      );
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }

    await UserIncrementLetter.create(
      {
        userMasterID,
        incrementLetter: `${lettertype}_${userMasterID}_${timestamp}.pdf`,
        incrementletterHTML: cont,
        incrementLetterID: letterDetails.incrementLetterID,
        oldSalaryStructure,
        newSalaryStructure,
      },
      {
        user: req.userDetails,
      }
    );
  } catch (err) {
    console.error("Error generating letter:", err);
  }
}

exports.postAddIncrementLetters = async (req, res, next) => {
  try {
    const {
      userMasterID,
      lettertype,
      incrementLetterID,
      oldSalaryStructure,
      newSalaryStructure,
    } = req.body;

    if (
      oldSalaryStructure > newSalaryStructure ||
      oldSalaryStructure == newSalaryStructure
    ) {
      return res.status(200).json({
        status: 401,
        message: "New  salary structure cannot be less than & Equal to Old ",
      });
    }

    let letterDetails;
    if (lettertype === "incrementletter") {
      letterDetails = await IncrementLetter.findOne({
        raw: true,
        where: { incrementLetterID },
        include: [{ model: companyMaster, attributes: ["letterHead"] }],
      });
    }

    const user = await UserMaster.findOne({
      where: { userMasterID: userMasterID },
      include: [{ model: companyMaster, attributes: ["companyName"] }],
    });

    if (!letterDetails || !user) {
      return res
        .status(401)
        .json({ status: 401, message: "User or letter not found" });
    }

    const letterHead = letterDetails["companyMaster.letterHead"];
    if (!letterHead || letterHead == '') {
      return res.status(200).json({
        message: 'Company letter head not found! Please upload company letter head.',
        status: 401
      })
    }

    await generateLetter(
      userMasterID,
      letterDetails,
      user,
      lettertype,
      oldSalaryStructure,
      newSalaryStructure,
      req,
      letterHead
    );

    return res
      .status(200)
      .json({ status: 200, message: "Letter generated successfully" });
  } catch (err) {
    next(err);
  }
};

exports.postUpdateUserIncrementLetters = async (req, res, next) => {
  try {
    let {
      userMasterID,
      lettertype,
      incrementLetterID,
      incrementletterHTML,
      userincrementLetterID,
      oldSalaryStructure,
      newSalaryStructure,
    } = await req.body;

    if (lettertype === "incrementletter") {
      const incrementLetter = await IncrementLetter.findOne({
        raw: true,
        where: { incrementLetterID: incrementLetterID },
        include: [{ model: companyMaster, attributes: ["letterHead"] }],
      });
      const user = await UserMaster.findOne({
        raw: true,
        where: { userMasterID: userMasterID },
        include: [{ model: companyMaster, attributes: ["companyName"] }],
      });
      if (!incrementLetter || !user)
        return res
          .status(200)
          .json({ status: 401, message: "User or Offer Letter not found" });

      const date = new Date().toISOString().slice(0, 10);
      const PageBreak = `<div class="pageBreak"> </div>`;
      incrementletterHTML = incrementletterHTML
        .split("[PageBreak]")
        .join(PageBreak);

      incrementletterHTML = incrementletterHTML
        .split('class="ql-align-right"')
        .join('style="text-align:right"');
      incrementletterHTML = incrementletterHTML
        .split('class="ql-align-center"')
        .join('style="text-align:center"');
      incrementletterHTML = incrementletterHTML
        .split('class="ql-align-justify"')
        .join('style="text-align:justify;text-justify: inter-word;"');

      // const DATA = await getSalaryStructureHTML(userMasterID);

      // incrementletterHTML = incrementletterHTML
      //   .split('[SalaryStructure]')
      //   .join(DATA.SalaryStructure);

      if (oldSalaryStructure) {
        const DATA = await getSalaryStructureHTML(
          userMasterID,
          oldSalaryStructure
        );

        incrementletterHTML = incrementletterHTML
          .split("[OldCTC]")
          .join(DATA.CTC);
        incrementletterHTML = incrementletterHTML
          .split("[OldNet]")
          .join(DATA.Net);
        incrementletterHTML = incrementletterHTML
          .split("[OldGross]")
          .join(DATA.Gross);
        incrementletterHTML = incrementletterHTML
          .split("[OldMonthlyCTC]")
          .join(DATA.MonthlyCTC);
        incrementletterHTML = incrementletterHTML
          .split("[OldMonthlyNet]")
          .join(DATA.MonthlyNet);
        incrementletterHTML = incrementletterHTML
          .split("[OldMonthlyGross]")
          .join(DATA.MonthlyGross);
        incrementletterHTML = incrementletterHTML
          .split("[OldSalaryStructure]")
          .join(DATA.SalaryStructure);
      }

      if (newSalaryStructure) {
        const DATA = await getSalaryStructureHTML(
          userMasterID,
          newSalaryStructure
        );

        incrementletterHTML = incrementletterHTML
          .split("[NewCTC]")
          .join(DATA.CTC);
        incrementletterHTML = incrementletterHTML
          .split("[NewNet]")
          .join(DATA.Net);
        incrementletterHTML = incrementletterHTML
          .split("[NewGross]")
          .join(DATA.Gross);
        incrementletterHTML = incrementletterHTML
          .split("[NewMonthlyCTC]")
          .join(DATA.MonthlyCTC);
        incrementletterHTML = incrementletterHTML
          .split("[NewMonthlyNet]")
          .join(DATA.MonthlyNet);
        incrementletterHTML = incrementletterHTML
          .split("[NewMonthlyGross]")
          .join(DATA.MonthlyGross);
        incrementletterHTML = incrementletterHTML
          .split("[NewSalaryStructure]")
          .join(DATA.SalaryStructure);
      }

      const pdfRecord = await UserIncrementLetter.findOne({
        where: { userincrementLetterID },
      });

      let letterName;

      if (lettertype == "incrementletter") {
        letterName = "Increment Letter";
      }

      if (incrementLetter.letterHead == "yes") {
        const companyDetails = await companyMaster.findOne({
          raw: true,
          where: { companyMasterID: user.companyMasterId },
        });

        companyDetails.companyName = companyDetails.companyName
          ? companyDetails.companyName
          : "";
        companyDetails.companyAddress = companyDetails.companyAddress
          ? companyDetails.companyAddress
          : "";
        companyDetails.companyEmail = companyDetails.companyEmail
          ? companyDetails.companyEmail
          : "";
        companyDetails.companyLogo = companyDetails.companyLogo
          ? companyDetails.companyLogo
          : "";
        companyDetails.cpMobileNo = companyDetails.cpMobileNo
          ? companyDetails.cpMobileNo
          : "";
        companyDetails.companyWebsite = companyDetails.companyWebsite
          ? companyDetails.companyWebsite
          : "";

        const imagePath = path.join(
          __dirname,
          `../uploads/company/logo/${companyDetails.companyLogo}`
        );
        let base64 = "";
        base64Img.base64(imagePath, async (err, data) => {
          if (err) {
            console.error("Error:", err);
          } else {
            base64 = data;
          }

          const getTemplate = (type) => {
            const file = path.join(__dirname, `../html/${type}.html`);
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

          const filePath = await getTemplate("preboardingLetterHead");
          companyDetails.base64 = base64;
          const file = await readFile(filePath);
          const template = Handlebars.compile(file);
          const headerTemplate = template(companyDetails);

          let cont =
            `<div class="main1" style="font-size: 12px !important">` +
            incrementletterHTML +
            `</div>`;
          const data1 = { content: cont };
          const pdfBuffer = await generatePDF(
            "preboardingOfferLetter",
            data1,
            headerTemplate
          );

          // Saving the PDF buffer to the uploaded file path
          const timestamp = Date.now(); // Get current timestamp

          const pdfFilePath = path.join(
            __dirname,
            `../uploads/letter/${pdfRecord.incrementLetter}`
          );

          fs.writeFileSync(pdfFilePath, pdfBuffer);
        });
      } else if (incrementLetter.letterHead == "no") {
        const pdfRecord = await UserIncrementLetter.findOne({
          where: { userincrementLetterID },
          attributes: ["incrementLetter"],
        });

        let cont =
          `<div class="main1" style="font-size: 12px !important">` +
          incrementletterHTML +
          `</div>`;
        const data1 = { content: cont, letterName };
        const pdfBuffer = await generatePDF(
          "preboardingOfferLetter",
          data1,
          null
        );

        // Saving the PDF buffer to the uploaded file path

        const pdfFilePath = path.join(
          __dirname,
          `../uploads/letter/${pdfRecord.incrementLetter}`
        );
        fs.writeFileSync(pdfFilePath, pdfBuffer);
      } else {
        const letterHead = incrementLetter["companyMaster.letterHead"];
        if (!letterHead || letterHead == '') {
          return res.status(200).json({
            message: 'Company letter head not found! Please upload company letter head.',
            status: 401
          })
        }
        if (letterHead) {
          imagePath =
            process.env.APIURL + `uploads/company/letterHead/${letterHead}`;
        }

        let cont =
          `<div class="main1" style="font-size: 12px !important">` +
          incrementletterHTML +
          `</div>`;
        const data1 = {
          content: cont,
          letterName: letterName,
          letterHead: letterHead,
        };
        const pdfBuffer = await generateOfferLetterPdf(
          "preboardingOfferLetter",
          data1
        );
        const pdfFilePath = path.join(
          __dirname,
          `../uploads/letter/${lettertype}_${userMasterID}_${timestamp}.pdf`
        );
        fs.writeFileSync(pdfFilePath, pdfBuffer);
      }

      const userOfferLetter = await UserIncrementLetter.findOne({
        where: {
          userincrementLetterID,
        },
      });

      if (userOfferLetter) {
        await UserIncrementLetter.update(
          {
            UserIncrementLetter: path.join(
              __dirname,
              `../uploads/letter/${pdfRecord.incrementLetter}`
            ),
            incrementletterHTML: incrementletterHTML,
            incrementLetterID: incrementLetterID,
            updateBy: req.userDetails.userMasterId,
            updateByIp: req.userDetails.userIpAddress,
          },
          { where: { incrementLetterID: userOfferLetter.incrementLetterID } }
        );
      } else {
        let filename = path.join(
          __dirname,
          `../uploads/letter/${pdfRecord.incrementLetter}`
        );

        await UserIncrementLetter.create(
          {
            userMasterID,
            UserIncrementLetter: filename,
            incrementletterHTML: incrementletterHTML,
            incrementLetterID,
          },
          {
            user: req.userDetails,
          }
        );
      }
      return res.status(200).json({
        status: 200,
        message: "Increment Letter Updated Successfully",
      });
    } else {
      return res
        .status(200)
        .json({ status: 401, message: "letter type not found" });
    }
  } catch (err) {
    next(err);
  }
};

exports.postDeleteIncrementLetters = async (req, res, next) => {
  try {
    const { userMasterID, userincrementLetterID } = req.body;

    const userLetter = await UserIncrementLetter.findOne({
      where: { userMasterID, userincrementLetterID },
    });

    if (!userLetter) {
      return res.status(200).json({ status: 401, message: "Data not found" });
    }

    await userLetter.destroy({
      user: req.userDetails, // Assuming you have proper handling for this
    });

    return res
      .status(200)
      .json({ status: 200, message: "Letter Deleted Successfully" });
  } catch (err) {
    next(err);
  }
};

async function getUserLetter(userMasterID, latterType, userincrementLetterID) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const data = await UserIncrementLetter.findOne({
    where: {
      userMasterID,
      userincrementLetterID,
    },
    include: [
      {
        required: true,
        model: UserMaster,
        attributes: ["email", "displayName"],
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
        ],
      },
    ],
    attributes: [latterType],
  });

  return data;
}

exports.sendEmailIncrementLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID, userincrementLetterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

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
        mailTypeID: 14,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: "Email template not found.",
      });
    }

    const data1 = await getUserLetter(
      userMasterID,
      "incrementLetter",
      userincrementLetterID
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

    const incrementLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        "..",
        "uploads",
        "letter",
        data1.incrementLetter
      ),
      secure: fromtomail.secure,
    };

    await sendOfferLetter(incrementLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: "Increment Letter Email sent successfully",
    });
  } catch (err) {
    next(err);
  }
};
