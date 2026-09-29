const Excel = require('exceljs');
const nodemailer = require('nodemailer');
const { Sequelize, col, Op, ARRAY } = require('sequelize');
const UserMaster = require('../models/userMaster');
const FormMaster = require('../models/formMaster');
const JSZip = require('jszip');
const path = require('path');
const {
  asiaKolkataDateTime,
  findCompanyNotificationPolicy,
} = require('../utils/commonUtilFunctions');
const RolePermission = require('../models/rolePermission');
const RoleMaster = require('../models/roleMaster');
const UserRole = require('../models/userRole');
const fs = require('fs');
const {
  DateTimeType,
  expenseApprovalTypes,
  paymentMode,
} = require('./dbUtils');
const AuthorizationCriteria = require('../models/authorizationCriteriaMaster');
const moment = require('moment');
const Handlebars = require('handlebars');
const { default: puppeteer } = require('puppeteer');
const { mainApiUrl } = require('./labelUtils');

const gmailTransporterForGsuit = nodemailer.createTransport({
  host: process.env.HOSTMAIL, // Gmail Host
  port: 465, // Port
  secure: true, // this is true as port is 465
  auth: {
    user: process.env.USEREMAIL, // generated ethereal user
    pass: process.env.PASS, // generated ethereal password
  },
});

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, '../', 'mailcron.log'),
  {
    flags: 'a',
  }
);

const flattenObj = (obj, parent = null, res = {}) => {
  Object.entries(obj).forEach(([key, value]) => {
    let propName;

    // In related models' data, data is stored at key which includes Id at the end. To remove that Id following code works

    if (parent) {
      propName = parent.includes('Id')
        ? `${parent.replace('Id', '')}_${key}`
        : `${parent}_${key}`;
    } else {
      propName = key;
    }

    // const propName = parent ? parent + '_' + key : key; & obj[key]!==null because typeof null = object

    if (value !== null && typeof value === 'object') {
      // if value is array. also allows empty array to be added as a key
      if (value.length !== undefined && value.length >= 0) {
        res[propName] = value;
      } else flattenObj(value, propName, res);
    } else res[propName] = value;
  });
  return res;
};

const formatFirstRow = (workSheet, row) => {
  const firstRow = workSheet.getRow(row);
  firstRow.height = 20;
  firstRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',

      pattern: 'solid',

      fgColor: { argb: '729fcf' },
    };
    cell.font = { bold: true, name: 'calibri' };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
};

function countKeys(obj) {
  return Object.keys(obj).reduce((count, key) => {
    if (Array.isArray(obj[key]))
      return count + obj[key].reduce((c, o) => c + countKeys(o), 0);
    if (typeof obj[key] === 'object' && obj[key] !== null)
      return count + countKeys(obj[key]);
    return count + 1;
  }, 0);
}

function findIndexParentWithMostKeys(arr) {
  return arr.reduce(
    (maxIndex, obj, index) =>
      countKeys(obj) > countKeys(arr[maxIndex]) ? index : maxIndex,
    0
  );
}

const generateExcelGatePass = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = Object.keys(data[0]);
    const transformedObject = [];
    for (let i = 0; i < data.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(data[i][key]) === true) {
          data[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(data[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(data[i])));
    }
    if (transformedObject.length === 0) transformedObject.push(...data);

    const keyData = flattenObj(
      transformedObject[findIndexParentWithMostKeys(transformedObject)]
    );

    const columns = Object.keys(keyData).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    workSheet.columns = columns;

    transformedObject.forEach((element, index) => {
      const flatObj = flattenObj(element);
      const rowNum = index + 2; // Use the index to get the current row number
      const row = workSheet.getRow(rowNum);

      // Code to find if there are columns that contains image keyword in its name then we'll assume it carries image buffer
      Object.keys(flatObj).forEach((key) => {
        const base64regex =
          /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (key.includes('image') && base64regex.test(element[key])) {
          row.height = 100;
          const column = workSheet.getColumn(key);
          delete flatObj[key];
          if (element[key]) {
            const imageId = workBook.addImage({
              extension: 'jpeg',
              base64: element[key],
            });

            workSheet.addImage(
              imageId,
              `${column.letter}${rowNum}:${column.letter}${rowNum}`
            );
          }
        }
      });
      row.values = flatObj;
      row.eachCell((cell, colNum) => {
        if (colNum === 15 || colNum === 16) {
          cell.alignment = { wrapText: true };
        }
      });
    });
    formatFirstRow(workSheet, 1);
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcel = async (data, fileName, fileType, res, config = {}) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = Object.keys(data[0]);
    const transformedObject = [];
    for (let i = 0; i < data.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(data[i][key]) === true) {
          data[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(data[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(data[i])));
    }
    if (transformedObject.length === 0) transformedObject.push(...data);

    const keyData = flattenObj(
      transformedObject[findIndexParentWithMostKeys(transformedObject)]
    );

    const columns = Object.keys(keyData).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    workSheet.columns = columns;

    transformedObject.forEach((element, index) => {
      const flatObj = flattenObj(element);
      const rowNum = index + 2; // Use the index to get the current row number
      const row = workSheet.getRow(rowNum);

      // Code to find if there are columns that contains image keyword in its name then we'll assume it carries image buffer
      Object.keys(flatObj).forEach((key) => {
        const base64regex =
          /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (
          (key.includes('image') ||
            key.includes('Attachment-1') ||
            key.includes('Attachment-2')) &&
          base64regex.test(element[key])
        ) {
          row.height = 100;
          const column = workSheet.getColumn(key);
          delete flatObj[key];
          if (element[key]) {
            const imageId = workBook.addImage({
              extension: 'jpeg',
              base64: element[key],
            });

            workSheet.addImage(
              imageId,
              `${column.letter}${rowNum}:${column.letter}${rowNum}`
            );
          }
        }
      });
      row.values = flatObj;
      if (config?.isWrapText || config?.fillColor || config?.font) {
        row.eachCell((cell, colNum) => {
          if (config.isWrapText?.(cell, colNum)) {
            cell.alignment = { wrapText: true };
          }
          const color = config.fillColor?.(cell, colNum);
          if (color) {
            cell.fill = color;
          }
          const font = config?.font?.(cell, colNum);
          if (font) {
            cell.font = font;
          }
        });
      }
    });
    formatFirstRow(workSheet, 1);
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExceltoMail = async (data, fileName, fileType, res, MailID) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const headerNames = Object.keys(data[0]);
  const transformedObject = [];
  for (let i = 0; i < data.length; i++) {
    let isNotArray = true;
    headerNames.forEach((key) => {
      if (Array.isArray(data[i][key]) === true) {
        data[i][key].forEach((obj) => {
          isNotArray = false;
          // Deep copy so that values in data[i] does not get changed
          const transformedElement = JSON.parse(JSON.stringify(data[i]));
          transformedElement[key] = obj;
          transformedObject.push({ ...transformedElement });
        });
      }
    });
    if (isNotArray) transformedObject.push(JSON.parse(JSON.stringify(data[i])));
  }
  if (transformedObject.length === 0) transformedObject.push(...data);

  const keyData = flattenObj(
    transformedObject[findIndexParentWithMostKeys(transformedObject)]
  );

  const columns = Object.keys(keyData).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  workSheet.columns = columns;

  transformedObject.forEach((element) => {
    workSheet.addRow(flattenObj(element));
  });
  formatFirstRow(workSheet, 1);
  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  try {
    if (!MailID) return;
    const mailOptions = {
      from: process.env.USEREMAIL, // sender email address
      to: MailID,
      subject: 'Expense Report', // Subject of Email
      text: 'Please find the expense report attached.', // plain text body
      replyTo: '', // If reply is required then add that emial address
      attachments: [
        {
          filename: `ExpenseReport.xlsx`,
          content: await workBook.xlsx.writeBuffer(),
        },
      ], // attachments: attachments
    };

    gmailTransporterForGsuit.sendMail(mailOptions, function (err, body) {
      //If there is an error, render the error page
      if (err) {
        return res.status(200).json({
          status: 200,
          message: 'An error occured while sending mail!',
        });
      }
    });
  } catch (e) {
    return res.status(200).json({
      status: 200,
      message: 'An error occured while sending mail!',
    });
  }

  return res.status(200).json({
    status: 200,
    message: 'Mail sent Successfully',
  });
};

const generateChecklistExcel = async (
  data,
  fileName,
  fileType,
  res,
  CheckListNames
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let checkList of data) {
    const workSheet = workBook.addWorksheet(CheckListNames[i]);
    i++;

    const headerNames = Object.keys(checkList[0]);

    const transformedObject = [];
    for (let i = 0; i < checkList.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(checkList[i][key]) === true) {
          checkList[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(checkList[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(checkList[i])));
    }
    if (transformedObject.length === 0) transformedObject.push(...checkList);

    const keyData = flattenObj(
      transformedObject[findIndexParentWithMostKeys(transformedObject)]
    );

    const columns = Object.keys(keyData).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    workSheet.columns = columns;

    transformedObject.forEach((element) => {
      workSheet.addRow(flattenObj(element));
    });
    formatFirstRow(workSheet, 1);
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelforSalaryStructure = async (
  data,
  fileName,
  fileType,
  res,
  sheetNames
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let checkList of data) {
    const workSheet = workBook.addWorksheet(sheetNames[i]);
    i++;

    let salarycalculation =
      checkList[0][0].baseOnCalculation === 'M'
        ? 'Monthly'
        : checkList[0][0].baseOnCalculation === 'D'
          ? 'Daily'
          : 'Hourly';

    workSheet.addRow([
      'Salary From YYYYMM',
      `${checkList[0][0].salaryFromYYYYMM}`,
    ]);
    workSheet.addRow(['Salary Structure', salarycalculation]);

    checkList = checkList[1];

    // const headerNames = Object.keys(checkList[0]);

    workSheet.addRow([
      'Payhead Name',
      'Employee SalaryAmount',
      'Formula',
      'SalaryField SrNo',
      'ConsiderIn',
    ]);

    const employeedata = checkList.map((employee) => Object.values(employee));

    employeedata.map((e) => workSheet.addRow(e));

    formatFirstRow(workSheet, 3);

    workSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const payheadNameCell = row.getCell(1).text;
      if (['GROSS', 'NET SALARY', 'CTC'].includes(payheadNameCell)) {
        // Apply your desired styles here, for example:
        row.eachCell((cell) => {
          // cell.fill = {
          //   type: 'pattern',
          //   pattern: 'solid',
          //   fgColor: { argb: 'FFFF00' }, // Yellow background color
          // };
          cell.font = { color: { argb: '000000' }, bold: true }; // Red bold text
        });
      }
    });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

async function styleRow(worksheet, row) {
  worksheet.getRow(row).font = {
    bold: true,
    color: { argb: '000000' },
  };

  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

function alignment(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'left',
  };
}

function alignment2(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

const generateExcelForLeave = async (
  Leaveata,
  firstHeader,
  leaveHeader,
  companyid,
  sendmail,
  date,
  fileName,
  fileType,
  res,
  SheetsNames
) => {
  if (!Leaveata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let data of Leaveata) {
    const worksheet = workBook.addWorksheet(SheetsNames[i]);
    i++;

    // const worksheet = workBook.addWorksheet('sheet');

    worksheet.addRow([]);
    worksheet.addRow([firstHeader]);

    const leave_header = Array.from(
      { length: leaveHeader.length - 1 },
      () => ''
    );

    const header2 = [
      ...[
        'Sr. No.',
        'Name Of Employee',
        'Department',
        'Leave',
        '',
        'Leave Approved/Pending/Absent',
        'No. Of',
        'Before This Application Leave Taken',
      ],
      ...leave_header,
      ...[
        'No. Of Absent Leaves in this Financial Year',
        'No. Of Late In/Early Out in Financial Year',
      ],
    ];
    const header3 = [
      ...['', '', '', 'From', 'To', '', 'Days'],
      ...leaveHeader,
      ...['No.', 'No.'],
    ];

    worksheet.addRow(header2);
    worksheet.addRow(header3);

    await styleRow(worksheet, 2);
    await styleRow(worksheet, 3);
    await styleRow(worksheet, 4);

    worksheet.mergeCells(2, 1, 2, +header2.length);
    worksheet.mergeCells(3, 1, 4, 1);
    worksheet.mergeCells(3, 2, 4, 2);
    worksheet.mergeCells(3, 3, 4, 3);
    worksheet.mergeCells(3, 4, 3, 5);
    worksheet.mergeCells(3, 8, 3, 8 + +leave_header.length);

    const row2 = worksheet.getRow(2);
    row2.height = 20;

    row2.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'daeef3' }, // Red color
      };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    const mergeRanges = {};
    const data2 = data.map((row, index) => {
      row['SrNo'] = index;
      return Object.values(row);
    });

    let num = 1;
    await Promise.all(
      data2.map(async (d, i) => {
        const currentDisplayName = data[i].displayName;

        // Check if the display name is the same as the previous row
        if (i > 0 && currentDisplayName === data[i - 1].displayName) {
          d[0] = '';
          // Increment the end column of the merged range
          mergeRanges[currentDisplayName].map((a) => {
            a.endRow++;
          });
        } else {
          d[0] = num++;
          const leavemergecell = leaveHeader.map((m, index) => {
            return {
              startRow: i + 5,
              startColumn: 8 + index, // Assuming display name is in the second column
              endRow: i + 5,
              endColumn: 8 + index,
            };
          });

          // Create a new entry for the display name
          mergeRanges[currentDisplayName] = [
            ...[
              {
                startRow: i + 5,
                startColumn: 1, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 1,
              },
              {
                startRow: i + 5,
                startColumn: 2, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 2,
              },
              {
                startRow: i + 5,
                startColumn: 3, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 3,
              },
              {
                startRow: i + 5,
                startColumn: 8 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 8 + +leaveHeader.length,
              },
              {
                startRow: i + 5,
                startColumn: 9 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 9 + +leaveHeader.length,
              },
            ],
            ...leavemergecell,
          ];
        }
        worksheet.addRow(d);
      })
    );

    for (const displayName in mergeRanges) {
      const range = mergeRanges[displayName];

      range.map((e) => {
        worksheet.mergeCells(e.startRow, e.startColumn, e.endRow, e.endColumn);
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        alignment(worksheet, rowNumber + 3);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        // }
      });
    });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  if (sendmail == true) {
    const role = await RolePermission.findAll({
      raw: true,
      include: [
        {
          model: FormMaster,
          where: { formName: 'FYWiseLeaveReport' },
          attributes: [],
        },
        {
          model: RoleMaster,
          where: {
            companyMasterID: companyid,
          },
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('rolePermission.roleMasterID'), 'roleMasterID'],
      ],
    });

    const allRoleIds = role.map((e) => e.roleMasterID);

    const user = await UserRole.findAll({
      raw: true,
      where: {
        roleMasterID: {
          [Op.in]: allRoleIds,
        },
      },
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: companyid, status: 1 },
          attributes: [],
        },
      ],

      attributes: [
        [Sequelize.col('userMaster.email'), 'email'],
        [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
      ],
    });

    const fromtomail = await findCompanyNotificationPolicy(+companyid);

    if (fromtomail) {
      if (fromtomail.email) {
        let gmailTransporterForTP = nodemailer.createTransport({
          host: fromtomail.hostmail, // Gmail Host
          port: fromtomail.port, // Port
          secure: fromtomail.secure, // this is true as port is 465
          auth: {
            user: fromtomail.email, // generated ethereal user
            pass: fromtomail.password, // generated ethereal password
          },
        });

        const data = [];
        user.map((e) => {
          if (e.email) data.push(e.email);
        });

        if (data.length > 0) {
          try {
            const mailOptions = {
              from: fromtomail.email, // sender email address
              to: data,
              subject: 'FY Leave Report Date' + `${date}`, // Subject of Email
              text: 'Please find the Leave report attached.', // plain text body
              replyTo: '', // If reply is required then add that emial address
              attachments: [
                {
                  filename: `${fileName}.xlsx`,
                  content: await workBook.xlsx.writeBuffer(),
                },
              ], // attachments: attachments
            };

            gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
              //If there is an error, render the error page
              if (err) {
                return { sattus: 0, message: err };
              }
              //Else we can greet\ and leave
              else {
                return body;
              }
            });
          } catch (e) {
            return { status: 0, message: e };
          }
        }
      }
    }
  } else {
    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  }
};

const generateExcelForLeaveBalance = async (
  leaveHeader,
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const worksheet = workBook.addWorksheet('sheet');

  const leave_header = Array.from({ length: leaveHeader.length - 1 }, () => '');

  const header1 = [
    ...[
      'Employee Code',
      'Employee Name',
      'Employee Number',
      'Branch',
      'Department',
      'Opening Balance',
    ],
    ...leave_header,
    ...['Added Balance'],
    ...leave_header,
    ...['Used Balance'],
    ...leave_header,
    ...['Lapse Balance'],
    ...leave_header,
    ...['Closing Balance'],
  ];
  const header2 = [
    ...['', '', '', '', ''],
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
    ...leaveHeader,
  ];

  worksheet.addRow(header1);
  worksheet.addRow(header2);

  worksheet.mergeCells(1, 1, 2, 1);
  worksheet.mergeCells(1, 2, 2, 2);
  worksheet.mergeCells(1, 3, 2, 3);
  worksheet.mergeCells(1, 4, 2, 4);
  worksheet.mergeCells(1, 5, 2, 5);

  worksheet.mergeCells(1, 6, 1, 5 + +leaveHeader.length);
  worksheet.mergeCells(
    1,
    6 + +leaveHeader.length,
    1,
    5 + +leaveHeader.length * 2
  );
  worksheet.mergeCells(
    1,
    6 + +leaveHeader.length * 2,
    1,
    5 + +leaveHeader.length * 3
  );
  worksheet.mergeCells(
    1,
    6 + +leaveHeader.length * 3,
    1,
    5 + +leaveHeader.length * 4
  );
  worksheet.mergeCells(
    1,
    6 + +leaveHeader.length * 4,
    1,
    5 + +leaveHeader.length * 5
  );

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' },
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      alignment(worksheet, rowNumber + 2);
      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function setCellColor(headerRow, startIndex, endIndex, color) {
  for (let i = startIndex; i <= endIndex; i++) {
    headerRow.getCell(i).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    };
  }
}

const generateDemoExcelForVariable = async (
  header,
  final,
  fileName,
  fileType,
  res
) => {
  if (!final.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  const headerNames = Object.keys(final[0]);

  const finalHeader = [...headerNames, ...['Date'], ...header];

  const headerRow = workSheet.addRow(finalHeader);

  workSheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
    };
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.protection = { locked: true };
  });

  // Set light blue color for cells 1 to 5
  setCellColor(headerRow, 1, 6, 'ADD8E6'); // Light Blue

  if (fileName == 'incentive') {
    // Set light green color for cells 6 to incentiveHeader.length
    setCellColor(headerRow, 7, finalHeader.length, '90EE90'); // Light Green
  } else {
    // Set red color for penaltyHeader
    setCellColor(headerRow, 7, finalHeader.length, 'FF0000');
  }

  const data2 = final.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function alignmentmiddle(worksheet, row) {
  worksheet.getRow(row).alignment = {
    vertical: 'middle',
    horizontal: 'center',
  };
}

function bold(worksheet, row) {
  worksheet.getRow(row).font = {
    bold: true,
    color: { argb: '000000' },
  };
}

const generateExcelForDailyCost = async (
  headerMonth,
  datesArray,
  finaldata,
  wagessumArray,
  staffsumArray,
  othersumArray,
  sheetNames,
  sendmail,
  companyid,
  oneDayBeforedate,
  fileName,
  fileType,
  res
) => {
  if (!finaldata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  datesArray.unshift('Date');

  finaldata.map((data, index) => {
    const worksheet = workBook.addWorksheet(sheetNames[index]);

    worksheet.addRow([]);
    worksheet.addRow([`Month:- ${headerMonth}`]);

    worksheet.getRow(2).height = 30;

    //  worksheet.getRow(2).font = { size: 40, bold: true };

    worksheet.addRow(datesArray);

    const costheader = Array.from(
      { length: datesArray.length - 1 },
      () => 'Cost'
    );

    costheader.unshift('Department Name');

    worksheet.addRow(costheader);

    worksheet.getRow(4).height = 22;

    worksheet.mergeCells(2, 1, 2, +costheader.length);

    data.map((e) => {
      const amountArray = e.amount;

      amountArray.unshift(e.department);

      worksheet.addRow(amountArray);
    });

    worksheet.addRow([]);

    if (sheetNames[index] == 'Wages')
      wagessumArray.unshift('Total Cost'), worksheet.addRow(wagessumArray);
    else if (sheetNames[index] == 'Staff')
      staffsumArray.unshift('Total Cost'), worksheet.addRow(staffsumArray);
    else othersumArray.unshift('Total Cost'), worksheet.addRow(othersumArray);

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber == 1 && rowNumber > 4) {
          cell.font = {
            size: 12,
            bold: true,
            color: { argb: '000000' },
          };
        }

        if (rowNumber < 5 && rowNumber != 2) {
          bold(worksheet, rowNumber);
        }

        alignmentmiddle(worksheet, rowNumber);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };

        if (rowNumber === 2) {
          cell.border = {
            top: { style: 'thick', color: { argb: '000000' } },
            left: { style: 'thick', color: { argb: '000000' } },
            bottom: { style: 'thick', color: { argb: '000000' } },
            right: { style: 'thick', color: { argb: '000000' } },
          };
          cell.font = { size: 20, bold: true }; // Make the text bold as well
        }
        // }
      });
    });

    worksheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'eeece1' },
      };
      // cell.font = {size:15, bold: true };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'e6b8b7' },
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f2dcdb' },
      };
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  if (sendmail == true) {
    const role = await RolePermission.findAll({
      raw: true,
      include: [
        {
          model: FormMaster,
          where: { formName: 'DailyCostReport' },
          attributes: [],
        },
        {
          model: RoleMaster,
          where: {
            companyMasterID: companyid,
          },
          attributes: [],
        },
      ],
      attributes: [
        [Sequelize.col('rolePermission.roleMasterID'), 'roleMasterID'],
      ],
    });

    const allRoleIds = role.map((e) => e.roleMasterID);

    const user = await UserRole.findAll({
      raw: true,
      where: {
        roleMasterID: {
          [Op.in]: allRoleIds,
        },
      },
      include: [
        {
          model: UserMaster,
          where: { companyMasterId: companyid, status: 1 },
          attributes: [],
        },
      ],

      attributes: [
        [Sequelize.col('userMaster.email'), 'email'],
        [Sequelize.col('userMaster.userMasterID'), 'userMasterID'],
      ],
    });

    const fromtomail = await findCompanyNotificationPolicy(+companyid);

    if (fromtomail) {
      if (fromtomail.email) {
        let gmailTransporterForTP = nodemailer.createTransport({
          host: fromtomail.hostmail, // Gmail Host
          port: fromtomail.port, // Port
          secure: fromtomail.secure, // this is true as port is 465
          auth: {
            user: fromtomail.email, // generated ethereal user
            pass: fromtomail.password, // generated ethereal password
          },
        });

        const data = [];
        user.map((e) => {
          if (e.email) data.push(e.email);
        });

        if (data.length > 0) {
          try {
            const mailOptions = {
              from: fromtomail.email, // sender email address
              to: data,
              subject: 'Daily Cost Report -' + `${oneDayBeforedate}`, // Subject of Email
              text: '', // plain text body
              replyTo: '', // If reply is required then add that emial address
              attachments: [
                {
                  filename: `${fileName}.xlsx`,
                  content: await workBook.xlsx.writeBuffer(),
                },
              ], // attachments: attachments
            };

            gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
              //If there is an error, render the error page
              if (err) {
                return { sattus: 0, message: err };
              }
              //Else we can greet\ and leave
              else {
                return body;
              }
            });
          } catch (e) {
            return { status: 0, message: e };
          }
        }
      }
    }
  } else {
    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  }
};

const generateExcelForBankReport = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');

  let newData = data.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let finalData = newData.map((item) => ({
    'USER NAME': item['userMaster.displayName'],
    'USER NUMBER': item['userMaster.userNumber'],
    'EMPLOYEE CODE': item.employeeCode,
    DESIGNATION: item.Designation,
    DEPARTMENT: item.Department,
    BANKNAME: item['bankMaster.bankName'],
    'BANK ACCOUNT NUMBER': item.bankAccountNo,
    'BANK IFSC CODE': item.bankIFSC,
    'GROSS SALARY': item.GrossSalary,
    'NET SALARY': item.NetSalary,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  workSheet.addRow([data[0]['bankMaster.bankName']]);
  workSheet.mergeCells(1, 1, 1, 10);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(finalData[0]);

  workSheet.addRow(headerNames);

  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = finalData.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const EmailSalarySlip = async (AllsalarySlips, fromMail, month) => {
  const gmailTransporterForTP = nodemailer.createTransport({
    host: fromMail.hostmail, // Gmail Host
    port: fromMail.port, // Port
    secure: fromMail.secure, // this is true as port is 465
    auth: {
      user: fromMail.email, // generated ethereal user
      pass: fromMail.password, // generated ethereal password
    },
  });

  AllsalarySlips.forEach((data) => {
    const pdfBuffer = Buffer.from(data.path, 'base64');

    if (data.email) {
      try {
        const mailOptions = {
          from: fromMail.email, // sender email address
          to: data.email,
          subject: 'Salary Slip for the Month -' + `${month}`, // Subject of Email
          text: '', // plain text body
          replyTo: '', // If reply is required then add that emial address
          attachments: [
            {
              filename: `SalarySlip_${month}.pdf`,
              content: pdfBuffer,
            },
          ], // attachments: attachments
        };

        gmailTransporterForTP.sendMail(mailOptions, function (err, body) {
          //If there is an error, render the error page
          if (err) {
            return;
          }
          //Else we can greet\ and leave
          else {
            return;
          }
        });
      } catch (e) {
        return;
      }
    }
  });
};

const generateAttendanceExcel = async (
  data,
  fileName,
  fileType,
  reportType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const headerNames = Object.keys(data[0]);
  const transformedObject = [];

  if (+reportType == 1) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (let j = 0; j < data[i].attendancedata.length; j++) {
        data[i][
          new Date(data[i].attendancedata[j].attendancedate)
            .toISOString()
            .slice(0, 10)
        ] = data[i].attendancedata[j].attendancetype;
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 2) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (let j = 0; j < data[i].attendancedata.length; j++) {
        if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].attendancetype.includes('holiday')
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].intime == '-' &&
          data[i].attendancedata[j].outtime == '-'
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else {
          {
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - IN'
            ] =
              data[i].attendancedata[j].intime != '-'
                ? new Date(data[i].attendancedata[j].intime).toLocaleString()
                : '-';
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - OUT'
            ] =
              data[i].attendancedata[j].outtime != '-'
                ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
                : '-';
            data[i][
              new Date(data[i].attendancedata[j].attendancedate)
                .toISOString()
                .slice(0, 10) + ' - In Hrs'
            ] = data[i].attendancedata[j].minutes;
          }
        }
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 3) {
    let data4 = [];
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < data[i].attendancedata.length; j++) {
        data[i][
          new Date(data[i].attendancedata[j].attendancedate)
            .toISOString()
            .slice(0, 10)
        ] = data[i].attendancedata[j].attendancetype;

        data4.push({
          Employeecode: data[i].attendancedata[j].employeecode,
          Name: data[i].attendancedata[j].userName,
          Number: data[i].attendancedata[j].userNumber,
          Branch: data[i].attendancedata[j].branch,
          Department: data[i].attendancedata[j].department,
          Designation: data[i].attendancedata[j].designation,
          Date: data[i].attendancedata[j].attendancedate,
          Attendance: data[i].attendancedata[j].attendancetype,
          Minutes: Math.round(data[i].attendancedata[j].finalminutes),
          Shift: data[i].attendancedata[j].shift,
          ShiftHours: data[i].attendancedata[j].shiftHours,
          ShiftInTime: data[i].attendancedata[j].shiftInTime,
          ShiftOutTime: data[i].attendancedata[j].shiftOutTime,
          LateBy: data[i].attendancedata[j].Lateby,
          EarlyBy: data[i].attendancedata[j].EarlyBy,
          Penalty: data[i].attendancedata[j].Penalty,
          PenaltyDeduction: data[i].attendancedata[j].PenaltyDeduction,
          ['LateComing Penalty']: data[i].attendancedata[j].Penalty
            ? data[i].attendancedata[j].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[i].attendancedata[j]
            .PenaltyDeduction
            ? data[i].attendancedata[j].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[i].attendancedata[j].goEarlyPanalty
            ? data[i].attendancedata[j].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[i].attendancedata[j]
            .goEarlyPanaltyDeduction
            ? data[i].attendancedata[j].goEarlyPanaltyDeduction
            : '-',
        });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[i].totalpresentday,
        Name: 'Total Absent: ' + data[i].totalabsentday,
        Number: 'Total Half Day: ' + data[i].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[i].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[i].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[i].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[i].totalpendingleave,
        Attendance: '',
        Minutes: '',
        Shift: '',
        ShiftHours: '',
        ShiftInTime: '',
        ShiftOutTime: '',
        LateBy: '',
        EarlyBy: '',
        Penalty: '',
        PenaltyDeduction: '',
        ['LateComing Penalty']: '',
        ['LateComing Penalty Deduction']: '',
        ['EarlyGoing Penalty']: '',
        ['EarlyGoing Penalty Deduction']: '',
      });
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
    data = data4;
  } else if (+reportType == 4) {
    let data4 = [];
    for (var k = 0; k < data.length; k++) {
      for (var l = 0; l < data[k].attendancedata.length; l++) {
        data[k].attendancedata[l].intime =
          data[k].attendancedata[l].intime != '-'
            ? new Date(data[k].attendancedata[l].intime).toLocaleString()
            : '-';
        data[k].attendancedata[l].outtime =
          data[k].attendancedata[l].outtime != '-'
            ? new Date(data[k].attendancedata[l].outtime).toLocaleString()
            : '-';

        if (
          data[k].attendancedata[l].outtime == '-' &&
          data[k].attendancedata[l].intime == '-'
        ) {
          data[k].attendancedata[l].outtime =
            data[k].attendancedata[l].attendancetype;
          data[k].attendancedata[l].intime =
            data[k].attendancedata[l].attendancetype;
        }

        data4.push({
          Employeecode: data[k].attendancedata[l].employeecode,
          Name: data[k].attendancedata[l].userName,
          Number: data[k].attendancedata[l].userNumber,
          Branch: data[k].attendancedata[l].branch,
          Department: data[k].attendancedata[l].department,
          Designation: data[k].attendancedata[l].designation,
          Date: data[k].attendancedata[l].attendancedate,
          InTime: data[k].attendancedata[l].intime,
          OutTime: data[k].attendancedata[l].outtime,
          Hours_Minutes: data[k].attendancedata[l].minutes,
          Minutes: Math.round(data[k].attendancedata[l].finalminutes),
          Shift: data[k].attendancedata[l].shift,
          ShiftHours: data[k].attendancedata[l].shiftHours,
          ShiftInTime: data[k].attendancedata[l].shiftInTime,
          ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
          LateBy: data[k].attendancedata[l].Lateby,
          EarlyBy: data[k].attendancedata[l].EarlyBy,
          Penalty: data[k].attendancedata[l].Penalty,
          PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
          GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
          ['LateComing Penalty']: data[k].attendancedata[l].Penalty
            ? data[k].attendancedata[l].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[k].attendancedata[l]
            .PenaltyDeduction
            ? data[k].attendancedata[l].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
            ? data[k].attendancedata[l].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
            .goEarlyPanaltyDeduction
            ? data[k].attendancedata[l].goEarlyPanaltyDeduction
            : '-',
        });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[k].totalpresentday,
        Name: 'Total Absent: ' + data[k].totalabsentday,
        Number: 'Total Half Day: ' + data[k].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[k].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[k].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[k].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[k].totalpendingleave,
      });
    }
    data = data4;
  } else if (+reportType == 5) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] =
            data[i].attendancedata[j].intime != '-'
              ? new Date(data[i].attendancedata[j].intime).toLocaleString()
              : 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] =
            data[i].attendancedata[j].outtime != '-'
              ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
              : 'WeekOff';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].attendancetype.includes('holiday')
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;

          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] =
            data[i].attendancedata[j].intime != '-'
              ? new Date(data[i].attendancedata[j].intime).toLocaleString()
              : 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] =
            data[i].attendancedata[j].outtime != '-'
              ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
              : 'Holiday';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] =
            data[i].attendancedata[j].intime != '-'
              ? new Date(data[i].attendancedata[j].intime).toLocaleString()
              : 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] =
            data[i].attendancedata[j].outtime != '-'
              ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
              : 'Leave';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else if (
          data[i].attendancedata[j].intime == '-' &&
          data[i].attendancedata[j].outtime == '-'
        ) {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        } else {
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - TYPE'
          ] = data[i].attendancedata[j].attendancetype;
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - IN'
          ] =
            data[i].attendancedata[j].intime != '-'
              ? new Date(data[i].attendancedata[j].intime).toLocaleString()
              : '-';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - OUT'
          ] =
            data[i].attendancedata[j].outtime != '-'
              ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
              : '-';
          data[i][
            new Date(data[i].attendancedata[j].attendancedate)
              .toISOString()
              .slice(0, 10) + ' - In Hrs'
          ] = data[i].attendancedata[j].minutes;
        }
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
    }
  } else if (+reportType == 6 || +reportType == 7) {
    let data4 = [];
    for (var k = 0; k < data.length; k++) {
      for (var l = 0; l < data[k].attendancedata.length; l++) {
        const attdata = {
          Employeecode: data[k].attendancedata[l].employeecode,
          Name: data[k].attendancedata[l].userName,
          Number: data[k].attendancedata[l].userNumber,
          Branch: data[k].attendancedata[l].branch,
          Department: data[k].attendancedata[l].department,
          Designation: data[k].attendancedata[l].designation,
          Date: data[k].attendancedata[l].attendancedate,
        };

        if (+reportType == 6) {
          data[k][
            new Date(data[k].attendancedata[l].attendancedate)
              .toISOString()
              .slice(0, 10)
          ] = data[k].attendancedata[l].attendancetype;

          attdata['Attendance'] = data[k].attendancedata[l].attendancetype;
        } else {
          data[k].attendancedata[l].intime =
            data[k].attendancedata[l].intime != '-'
              ? new Date(data[k].attendancedata[l].intime).toLocaleString()
              : '-';
          data[k].attendancedata[l].outtime =
            data[k].attendancedata[l].outtime != '-'
              ? new Date(data[k].attendancedata[l].outtime).toLocaleString()
              : '-';

          if (
            data[k].attendancedata[l].outtime == '-' &&
            data[k].attendancedata[l].intime == '-'
          ) {
            data[k].attendancedata[l].outtime =
              data[k].attendancedata[l].attendancetype;
            data[k].attendancedata[l].intime =
              data[k].attendancedata[l].attendancetype;
          }

          attdata['InTime'] = data[k].attendancedata[l].intime;
          attdata['OutTime'] = data[k].attendancedata[l].outtime;
        }

        const attdata1 = {
          'Attendance Status': data[k].attendancedata[l].attendancetype,
          Hours_Minutes: data[k].attendancedata[l].minutes,
          Minutes: Math.round(data[k].attendancedata[l].finalminutes),
          'Out Minutes': Math.round(data[k].attendancedata[l].outMinutes),
          'OT Minutes': Math.round(data[k].attendancedata[l].otMinutes),
          Shift: data[k].attendancedata[l].shift,
          ShiftHours: data[k].attendancedata[l].shiftHours,
          ShiftInTime: data[k].attendancedata[l].shiftInTime,
          ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
          LateBy: data[k].attendancedata[l].Lateby,
          EarlyBy: data[k].attendancedata[l].EarlyBy,
          Penalty: data[k].attendancedata[l].Penalty,
          PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
          GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
          ['LateComing Penalty']: data[k].attendancedata[l].Penalty
            ? data[k].attendancedata[l].Penalty
            : '-',
          ['LateComing Penalty Deduction']: data[k].attendancedata[l]
            .PenaltyDeduction
            ? data[k].attendancedata[l].PenaltyDeduction
            : '-',
          ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
            ? data[k].attendancedata[l].goEarlyPanalty
            : '-',
          ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
            .goEarlyPanaltyDeduction
            ? data[k].attendancedata[l].goEarlyPanaltyDeduction
            : '-',
          ['Attendance Log']:
            +data[k].attendancedata[l].logData.length > 0
              ? data[k].attendancedata[l].logData.join(', ')
              : '-',
        };

        data4.push({ ...attdata, ...attdata1 });

        // data4.push({
        //   Employeecode: data[k].attendancedata[l].employeecode,
        //   Name: data[k].attendancedata[l].userName,
        //   Number: data[k].attendancedata[l].userNumber,
        //   Branch: data[k].attendancedata[l].branch,
        //   Department: data[k].attendancedata[l].department,
        //   Designation: data[k].attendancedata[l].designation,
        //   Date: data[k].attendancedata[l].attendancedate,
        //   InTime: data[k].attendancedata[l].intime,
        //   OutTime: data[k].attendancedata[l].outtime,
        //   Hours_Minutes: data[k].attendancedata[l].minutes,
        //   Minutes: Math.trunc(data[k].attendancedata[l].finalminutes),
        //   Shift: data[k].attendancedata[l].shift,
        //   ShiftHours: data[k].attendancedata[l].shiftHours,
        //   ShiftInTime: data[k].attendancedata[l].shiftInTime,
        //   ShiftOutTime: data[k].attendancedata[l].shiftOutTime,
        //   LateBy: data[k].attendancedata[l].Lateby,
        //   EarlyBy: data[k].attendancedata[l].EarlyBy,
        //   Penalty: data[k].attendancedata[l].Penalty,
        //   PenaltyDeduction: data[k].attendancedata[l].PenaltyDeduction,
        //   GoEarlyUsed: data[k].attendancedata[l].GoEarlyUsed,
        //   ['LateComing Penalty']: data[k].attendancedata[l].Penalty
        //     ? data[k].attendancedata[l].Penalty
        //     : '-',
        //   ['LateComing Penalty Deduction']: data[k].attendancedata[l]
        //     .PenaltyDeduction
        //     ? data[k].attendancedata[l].PenaltyDeduction
        //     : '-',
        //   ['EarlyGoing Penalty']: data[k].attendancedata[l].goEarlyPanalty
        //     ? data[k].attendancedata[l].goEarlyPanalty
        //     : '-',
        //   ['EarlyGoing Penalty Deduction']: data[k].attendancedata[l]
        //     .goEarlyPanaltyDeduction
        //     ? data[k].attendancedata[l].goEarlyPanaltyDeduction
        //     : '-',
        //   ['Attendance Log']: +data[k].attendancedata[l]
        //     .logData.length > 0
        //     ? data[k].attendancedata[l].logData.join(', ')
        //     : '-',
        // });
      }
      data4.push({
        Employeecode: 'Total Present: ' + data[k].totalpresentday,
        Name: 'Total Absent: ' + data[k].totalabsentday,
        Number: 'Total Half Day: ' + data[k].totalhalfday,
        Branch: 'Total Weekoff/Holiday: ' + data[k].totalweekoffholiday,
        Department: 'Total MissPunch: ' + data[k].totalmisspunch,
        Designation: 'Total Approved Leaves: ' + data[k].totalapprovedleave,
        Date: 'Total Pending Leaves: ' + data[k].totalpendingleave,
      });
    }
    data = data4;
  }
  if (+reportType == 8) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0)
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        data[i][
          new Date(data[i].attendancedata[j].attendancedate)
            .toISOString()
            .slice(0, 10)
        ] = data[i].attendancedata[j].attendancetype;
      }
      delete data[i].attendancedata;
      delete data[i].userMasterID;
      delete data[i].totalabsentday;
      delete data[i].totalhalfday;
      delete data[i].totalpresentday;
      delete data[i].totalweekoffholiday;
      delete data[i].totalmisspunch;
      delete data[i].totalapprovedleave;
      delete data[i].totalpendingleave;
    }
  } else if (+reportType == 9) {
    for (var i = 0; i < data.length; i++) {
      if (data[i].attendancedata.length != 0) {
        (data[i].branch = data[i].attendancedata[0].branch),
          (data[i].department = data[i].attendancedata[0].department),
          (data[i].designation = data[i].attendancedata[0].designation);
      }

      // for (var j = 0; j < data[i].attendancedata.length; j++) {
      //   const dateKey = new Date(data[i].attendancedata[j].attendancedate)
      //     .toISOString()
      //     .slice(0, 10);

      //   if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
      //     data[i][`${dateKey} - IN`] = 'WeekOff';
      //     data[i][`${dateKey} - OUT`] = 'WeekOff';

      //   } else if (
      //     data[i].attendancedata[j].attendancetype.includes('holiday')
      //   ) {
      //     data[i][`${dateKey} - IN`] = 'Holiday';
      //     data[i][`${dateKey} - OUT`] = 'Holiday';
      //   } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
      //     data[i][`${dateKey} - IN`] = 'Leave';
      //     data[i][`${dateKey} - OUT`] = 'Leave';
      //   } else if (
      //     data[i].attendancedata[j].intime === '-' &&
      //     data[i].attendancedata[j].outtime === '-'
      //   ) {
      //     data[i][`${dateKey} - IN`] = null; // Change to null
      //     data[i][`${dateKey} - OUT`] = null; // Change to null
      //   } else {
      //     data[i][`${dateKey} - IN`] =
      //       data[i].attendancedata[j].intime !== '-'
      //         ? new Date(data[i].attendancedata[j].intime).toLocaleString()
      //         : null; // Change to null
      //     data[i][`${dateKey} - OUT`] =
      //       data[i].attendancedata[j].outtime !== '-'
      //         ? new Date(data[i].attendancedata[j].outtime).toLocaleString()
      //         : null; // Change to null
      //   }
      // }
      for (var j = 0; j < data[i].attendancedata.length; j++) {
        const dateKey = new Date(data[i].attendancedata[j].attendancedate)
          .toISOString()
          .slice(0, 10);
        // Shift In and Shift Out times
        const shiftInTime = data[i].attendancedata[j].shiftInTime;
        const shiftOutTime = data[i].attendancedata[j].shiftOutTime;

        // Create complete date-time strings
        if (shiftInTime && shiftInTime !== '-') {
          const shiftInDateTime = `${data[i].attendancedata[j].attendancedate} ${shiftInTime}`;
          data[i][`Shift IN Time`] = new Date(shiftInDateTime).toLocaleString(
            'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }
          );
        } else {
          data[i][`Shift IN Time`] = null;
        }

        if (shiftOutTime && shiftOutTime !== '-') {
          const shiftOutDateTime = `${data[i].attendancedata[j].attendancedate} ${shiftOutTime}`;
          data[i][`Shift OUT Time`] = new Date(shiftOutDateTime).toLocaleString(
            'en-US',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }
          );
        } else {
          data[i][`Shift OUT Time`] = null;
        }
        // IN and OUT times
        if (data[i].attendancedata[j].attendancetype.includes('weekoff')) {
          data[i][`${dateKey} - IN`] = 'WeekOff';
          data[i][`${dateKey} - OUT`] = 'WeekOff';
        } else if (
          data[i].attendancedata[j].attendancetype.includes('holiday')
        ) {
          data[i][`${dateKey} - IN`] = 'Holiday';
          data[i][`${dateKey} - OUT`] = 'Holiday';
        } else if (data[i].attendancedata[j].attendancetype.includes('Leave')) {
          data[i][`${dateKey} - IN`] = 'Leave';
          data[i][`${dateKey} - OUT`] = 'Leave';
        } else if (
          data[i].attendancedata[j].intime === '-' &&
          data[i].attendancedata[j].outtime === '-'
        ) {
          data[i][`${dateKey} - IN`] = null;
          data[i][`${dateKey} - OUT`] = null;
        } else {
          data[i][`${dateKey} - IN`] =
            data[i].attendancedata[j].intime !== '-'
              ? (() => {
                  const intimeDate = new Date(data[i].attendancedata[j].intime);

                  const day = String(intimeDate.getDate()).padStart(2, '0');
                  const month = String(intimeDate.getMonth() + 1).padStart(
                    2,
                    '0'
                  );
                  const year = intimeDate.getFullYear();

                  const hours = String(intimeDate.getHours()).padStart(2, '0');
                  const minutes = String(intimeDate.getMinutes()).padStart(
                    2,
                    '0'
                  );

                  return `${day}-${month}-${year} ${hours}:${minutes}`;
                })()
              : null;

          data[i][`${dateKey} - OUT`] =
            data[i].attendancedata[j].outtime !== '-'
              ? (() => {
                  const outtimeDate = new Date(
                    data[i].attendancedata[j].outtime
                  );

                  const day = String(outtimeDate.getDate()).padStart(2, '0');
                  const month = String(outtimeDate.getMonth() + 1).padStart(
                    2,
                    '0'
                  );
                  const year = outtimeDate.getFullYear();

                  const hours = String(outtimeDate.getHours()).padStart(2, '0');
                  const minutes = String(outtimeDate.getMinutes()).padStart(
                    2,
                    '0'
                  );

                  return `${day}-${month}-${year} ${hours}:${minutes}`;
                })()
              : null;
        }
      }

      delete data[i].attendancedata;
      delete data[i].userMasterID;
      delete data[i].totalabsentday;
      delete data[i].totalhalfday;
      delete data[i].totalpresentday;
      delete data[i].totalweekoffholiday;
      delete data[i].totalmisspunch;
      delete data[i].totalapprovedleave;
      delete data[i].totalpendingleave;
    }
  }
  for (let i = 0; i < data.length; i++) {
    let isNotArray = true;
    headerNames.forEach((key) => {
      if (Array.isArray(data[i][key]) === true) {
        data[i][key].forEach((obj) => {
          isNotArray = false;
          // Deep copy so that values in data[i] does not get changed
          const transformedElement = JSON.parse(JSON.stringify(data[i]));
          transformedElement[key] = obj;
          transformedObject.push({ ...transformedElement });
        });
      }
    });
    if (isNotArray) transformedObject.push(JSON.parse(JSON.stringify(data[i])));
  }
  if (transformedObject.length === 0) transformedObject.push(...data);

  const keyData = flattenObj(
    transformedObject[findIndexParentWithMostKeys(transformedObject)]
  );

  const columns = Object.keys(keyData).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  workSheet.columns = columns;

  transformedObject.forEach((element) => {
    workSheet.addRow(flattenObj(element));
  });
  formatFirstRow(workSheet, 1);
  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForTackingReport = async (
  total_kms,
  final,
  fileName,
  fileType,
  res
) => {
  if (!final.length) throw new Error('No data found to generate the file!');

  let newData = final.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let final1 = newData.map((item) => ({
    'EMPLOYEE CODE': item.employeeCode,
    'USER NAME': item.displayName,
    'USER NUMBER': item.userNumber,
    ADRESS: item.Address,
    'TRACK DATETIME': asiaKolkataDateTime(item.Track_datetime),
    BATTERY: item.Battery,
    GPS: item.Gps,
    WIFI: item.Wifi,
    'MOBILE NAME': item.Mobile_name,
    'ITEM TYPE': item.type,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);

  workSheet.addRow([` Total Kms : ${total_kms}`]);
  workSheet.mergeCells(1, 1, 1, 10);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(final1[0]);

  workSheet.addRow(headerNames);

  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const data2 = final1.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForMusterRoll = async (
  data,
  companyName,
  Branch,
  month,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  const mergeCells = (startRow, endRow) =>
    workSheet.mergeCells(
      startRow,
      1,
      endRow,
      9 + +data[0].attendance.length + +data[0].leaveArray.length
    );

  const setRowHeight = (rowNumber, height) =>
    (workSheet.getRow(rowNumber).height = height);

  workSheet.addRow(['FORM XVI']);
  workSheet.addRow(['[See Rule 78 (2) (a)]']);
  workSheet.addRow(['Muster Roll']);
  workSheet.addRow(['For the month of : ' + month]);
  workSheet.addRow(['Name and Address of Company : ' + companyName]);
  workSheet.addRow(['Name and Address of Branch : ' + Branch]);
  workSheet.addRow([]);

  mergeCells(1, 1);
  mergeCells(2, 2);
  mergeCells(3, 3);
  mergeCells(4, 4);
  mergeCells(5, 5);
  mergeCells(6, 6);
  mergeCells(7, 7);
  setRowHeight(1, 25);
  setRowHeight(2, 25);
  setRowHeight(3, 25);

  await styleRow(workSheet, 1);
  await styleRow(workSheet, 2);
  await styleRow(workSheet, 3);

  const sefontSize = (row, size) => {
    workSheet.getRow(row).font = {
      bold: true,
      size: size,
      color: { argb: '000000' },
    };
  };

  sefontSize(1, 17);
  sefontSize(2, 15);
  sefontSize(3, 16);

  workSheet.getRow(4).alignment = {
    vertical: 'middle',
    horizontal: 'right',
  };
  workSheet.getRow(4).font = {
    bold: true,
    color: { argb: '000000' },
  };

  const header = ['Sr No.', 'Employee Code', 'Employee Name', 'Designation'];

  data[0].attendance.map((e) => {
    header.push(e.date);
  });

  const leaveheader = data[0].leaveArray.map((e) => e.leaveName);

  const headerNames = [
    ...header,
    ...['Working Days', 'WH', 'PH'],
    ...leaveheader,
    ...['AB', 'Total'],
  ];

  workSheet.addRow(headerNames);

  workSheet.getRow(8).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  data.map((e) => {
    const rowdata = [e.SrNo, e.employeeCode, e.employeeName, e.designation];

    e.attendance.map((a) => rowdata.push(a.value));

    const leavedata = e.leaveArray.map((l) => l.value);

    const final = [
      ...rowdata,
      ...[e.workingday, e.week_Off, e.holiday],
      ...leavedata,
      ...[e.absent, e.total],
    ];
    workSheet.addRow(final);
  });

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 8) {
      row.eachCell((cell, colNumber) => {
        // alignment(workSheet, rowNumber + 7);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        // }
      });
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForFORM_D_AttendanceRegister = async (
  data,
  otherdata,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  const mergeCells = (startRow, endRow) =>
    workSheet.mergeCells(startRow, 1, endRow, 12 + +data[0].attendance.length);

  const setRowHeight = (rowNumber, height) =>
    (workSheet.getRow(rowNumber).height = height);

  workSheet.addRow(['FORM D']);
  workSheet.addRow(['FORMAT OF ATTENDANCE REGISTER']);
  workSheet.addRow([`Name and Address of Company : ${otherdata.companydata}`]);
  workSheet.addRow([`Name and Address of Branch : ${otherdata.branchdata}`]);
  workSheet.addRow([
    `For the period From : ${otherdata.start_date} To ${otherdata.end_date}`,
  ]);
  workSheet.addRow([]);

  mergeCells(1, 1);
  mergeCells(2, 2);
  mergeCells(3, 3);
  mergeCells(4, 4);
  mergeCells(5, 5);
  mergeCells(6, 6);

  setRowHeight(1, 25);
  setRowHeight(2, 25);

  await styleRow(workSheet, 1);
  await styleRow(workSheet, 2);

  const sefontSize = (row, size) => {
    workSheet.getRow(row).font = {
      bold: true,
      size: size,
      color: { argb: '000000' },
    };
  };

  sefontSize(1, 17);
  sefontSize(2, 15);

  const date_header = data[0].attendance.map((e) => e.date);

  const mainHeader = [
    ...[
      'Sr No.',
      'Employee Code',
      'Designation',
      'Employee Name',
      'Branch',
      'Time',
    ],
    ...date_header,
    ...[
      'summary No. of days',
      'WeekOff',
      'Holiday',
      'Absent',
      'Remarks No. of Hours',
      'Signature of Register Keeper',
    ],
  ];

  workSheet.addRow(mainHeader);

  workSheet.getRow(7).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  let countrow = 7;
  data.map((e, index) => {
    const rowdata = [
      index + 1,
      e.employeeCode,
      e.designation,
      e.employeeName,
      e.branch,
    ];

    const indata = e.attendance.map((a) => a.intime);

    const outdata = e.attendance.map((a) => a.outtime);

    workSheet.addRow([
      ...rowdata,
      ...['IN'],
      ...indata,
      ...[e.present, e.week_Off, e.holiday, e.absent, '', ''],
    ]);
    countrow++;
    const firstrow = countrow;
    workSheet.addRow([
      ...rowdata,
      ...['OUT'],
      ...outdata,
      ...[e.present, e.week_Off, e.holiday, e.absent, '', ''],
    ]);
    countrow++;
    const lasttrow = countrow;

    workSheet.mergeCells(firstrow, 1, lasttrow, 1);
    workSheet.mergeCells(firstrow, 2, lasttrow, 2);
    workSheet.mergeCells(firstrow, 3, lasttrow, 3);
    workSheet.mergeCells(firstrow, 4, lasttrow, 4);
    workSheet.mergeCells(firstrow, 5, lasttrow, 5);

    workSheet.mergeCells(
      firstrow,
      7 + +indata.length,
      lasttrow,
      7 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      8 + +indata.length,
      lasttrow,
      8 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      9 + +indata.length,
      lasttrow,
      9 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      10 + +indata.length,
      lasttrow,
      10 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      11 + +indata.length,
      lasttrow,
      11 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      12 + +indata.length,
      lasttrow,
      12 + +indata.length
    );
  });

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 7) {
      row.eachCell((cell, colNumber) => {
        alignmentmiddle(workSheet, rowNumber);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });
    }
  });

  workSheet.addRow([]);

  const tempheader = Array.from(
    { length: +data[0].attendance.length + 5 },
    () => ''
  );

  workSheet.addRow([
    ...[
      '#Relay and *Place of Work in case of Mines only (Underground/Opencast/Surface)',
    ],
    ...tempheader,
  ]);
  const tempadd1 = [
    ...[
      '**In case an employee is not present the following to be entered : PL for PaidLeave / A for Absent / WH for WeekOff / PH for Holiday',
    ],
    ...tempheader,
    ...['M/s. .....................................'],
  ];
  const tempadd2 = [
    ...['**Not neccessary in case of E Form maintenance.'],
    ...tempheader,
    ...['Authorised Signatory'],
  ];
  workSheet.addRow(tempadd1);
  workSheet.addRow(tempadd2);

  workSheet.mergeCells(
    countrow + 2,
    1,
    countrow + 2,
    6 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 3,
    1,
    countrow + 3,
    6 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 4,
    1,
    countrow + 4,
    6 + +data[0].attendance.length
  );

  workSheet.mergeCells(
    countrow + 3,
    7 + +data[0].attendance.length,
    countrow + 3,
    12 + +data[0].attendance.length
  );
  workSheet.mergeCells(
    countrow + 4,
    7 + +data[0].attendance.length,
    countrow + 4,
    12 + +data[0].attendance.length
  );

  // mergeCells(countrow + 3, countrow + 3);

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForAttendanceData = async (
  data,
  resultArray,
  companyName,
  Branch,
  month,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  workSheet.addRow([companyName]);

  workSheet.mergeCells(1, 1, 1, 9 + +data[0].attendance.length);
  workSheet.getRow(1).height = 20;

  await styleRow(workSheet, 1);

  workSheet.getRow(1).font = {
    bold: true,
    size: 12,
    color: { argb: '000000' },
  };

  workSheet.addRow([
    'ATTENDANCE SHEET FOR THE MONTH OF ' +
      `${month}                        ` +
      `SITE : ${Branch}`,
  ]);

  workSheet.mergeCells(2, 1, 2, 9 + +data[0].attendance.length);

  const header = ['Sr No.', 'Employee Code', 'Employee Name', 'Designation'];

  data[0].attendance.map((e) => {
    header.push(e.date);
  });

  const headerNames = [
    ...header,
    ...[
      'Working Days',
      'WeeklyOff Days',
      'Absent Days',
      'FHD/NHD',
      'Total Days',
    ],
  ];

  workSheet.addRow(headerNames);

  workSheet.getRow(3).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  data.map((e) => {
    const rowdata = [e.SrNo, e.employeeCode, e.employeeName, e.designation];

    e.attendance.map((a) => rowdata.push(a.value));

    const final = [
      ...rowdata,
      ...[e.workingday, e.week_Off, e.absent, e.holiday, e.total],
    ];
    workSheet.addRow(final);
  });

  const sumdata = resultArray.map((e) => e.totalValue);

  workSheet.addRow([
    ...['Daily Total', '', '', ''],
    ...sumdata,
    ...['', '', '', '', ''],
  ]);

  workSheet.mergeCells(4 + +data.length, 1, 4 + +data.length, 4);

  workSheet.getRow(4 + +data.length).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  const tempheader = Array.from({ length: +sumdata.length + 8 }, () => '');

  workSheet.addRow([...['Initial Of Client'], ...tempheader]);

  workSheet.mergeCells(5 + +data.length, 1, 5 + +data.length, 4);
  workSheet.mergeCells(
    5 + +data.length,
    5,
    5 + +data.length,
    4 + +data[0].attendance.length
  );

  workSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      alignment(workSheet, rowNumber + 2);
      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForShift = async (ShiftData, fileName, fileType, res) => {
  if (!ShiftData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Shift Name',
    'Company Name',
    'Shift Code',
    'Shift Desc',
    'Status',
    'Shift Grace',
    'Shift Time',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Day',
    'Start Time',
    'First Half End Time',
    'Second Half Start Time',
    'End Time',
    'Minimum Hours For Halfday',
    'Minimum Hours For Fullday ',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 8, 1, 14);

  for (let i = 1; i <= 7; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = ShiftData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  for (let j = 3; j <= data2.length; j = j + 7) {
    for (let i = 1; i <= 7; i++) {
      worksheet.mergeCells(j, i, j + 6, i);
    }
  }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForFiveMinuteTackingReport = async (
  final,
  fileName,
  fileType,
  res,
  displayName,
  Track_datetime,
  employeecode
) => {
  if (!final.length) throw new Error('No data found to generate the file!');

  let newData = final.map((item) => {
    let newItem = { ...item };
    delete newItem['userMaster.userMasterID'];
    return newItem;
  });

  let final1 = newData.map((item) => ({
    ADDRESS: item.Address,
    'TRACK TIME': new Date(item.Track_datetime).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
    }),
    BATTERY: item.Battery,
    GPS: item.Gps,
    WIFI: item.Wifi,
    'Duration (minutes)': item.duration,
  }));

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet(fileName);
  const currentDate = new Date(Track_datetime).toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
  });
  const [month, day, year] = currentDate.split('/');
  const formattedDate = `${day}-${month}-${year}`;
  const userData = employeecode
    ? [`User Name :  ${displayName} (${employeecode}), Date:${formattedDate}`]
    : [`User Name :  ${displayName}, Date:${formattedDate}`];
  workSheet.addRow(userData);

  // workSheet.addRow([`User Name :  ${displayName} , ${(Track_datetime)}`]);
  workSheet.mergeCells(1, 1, 1, 6);
  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 16, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const headerNames = Object.keys(final1[0]);
  workSheet.addRow(headerNames);
  workSheet.getRow(2).eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
  });

  const data2 = final1.map((row) => Object.values(row));
  data2.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

//exportdata.js

const generateExcelForSalaryRegister = async (
  data,
  headerData,
  report,
  fileName,
  fileType,
  res,
  lengthDetails,
  calculationData
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const keysArray = Object.keys(data[0]);

  const basicDataLength = lengthDetails.basicDataLength;
  const earningDataLength = lengthDetails.EarningLength;
  const extra_EarningLength = lengthDetails.extra_EarningLength;
  const EmpContriLength = lengthDetails.EmpContriLength;
  const OtherDeductionLength = lengthDetails.OtherDeductionLength;
  const employerSideLength = lengthDetails.employerSideLength;

  if (report == 'salaryRegisterWithDateOfPay') {
    const tempheader = Array.from({ length: +keysArray.length - 5 }, () => '');

    workSheet.addRow([headerData.companyName]);
    workSheet.addRow([
      ...[headerData.companyAddress],
      ...tempheader,
      ...[headerData.month],
    ]);
    if (headerData.branchName) {
      workSheet.addRow([
        `${headerData.branchName} , ${headerData.branchAddress}`,
      ]);
    }

    workSheet.mergeCells(1, 1, 1, keysArray.length);
    workSheet.mergeCells(2, 1, 2, keysArray.length - 4);
    workSheet.mergeCells(2, keysArray.length - 3, 2, keysArray.length);
    workSheet.mergeCells(3, 1, 3, keysArray.length);

    workSheet.getRow(1).height = 25;

    await styleRow(workSheet, 1);
    await styleRow(workSheet, 2);
    await styleRow(workSheet, 3);

    workSheet.getRow(1).font = {
      bold: true,
      size: 15,
      color: { argb: '000000' },
    };

    workSheet.addRow(keysArray);
  } else if (report == 'monthlySalarySummary') {
    workSheet.addRow([
      ...keysArray.slice(0, 10),
      ...['Employee Contribution', ''],
      ...keysArray.slice(12, 16),
      ...['Employer Contribution', '', '', '', ''],
    ]);

    workSheet.addRow([
      ...Array.from({ length: +keysArray.slice(0, 10).length }, () => ''),
      ...keysArray.slice(10, 12),
      ...Array.from({ length: +keysArray.slice(12, 16).length }, () => ''),
      ...keysArray.slice(16, 21),
    ]);

    // for (let i = 0; i <= keysArray.slice(0, 10).length; i++) {
    //   const cell = i + 1;
    //   workSheet.mergeCells(cell, 2, 2, cell);
    // }

    workSheet.mergeCells(1, 11, 1, 12);

    // for (let i = 0; i <= keysArray.slice(12, 16).length; i++) {
    //   const cell = i + 1;
    //   workSheet.mergeCells(cell, 2, 2, cell);
    // }

    workSheet.mergeCells(1, 17, 1, 21);
  } else {
    // Initialize row array
    let row = [];

    row.push(...Array.from({ length: +basicDataLength }, () => ''));

    row.push(
      'Employee Earning',
      ...Array.from({ length: +earningDataLength }, () => '')
    );

    // Conditionally add "Employee Contribution" and empty cells if `EmpContriLength` > 0
    if (EmpContriLength > 0) {
      row.push(
        'Employee Contribution',
        ...Array.from({ length: +EmpContriLength - 1 }, () => '')
      );
    }

    row.push('', '');

    if (OtherDeductionLength > 0) {
      row.push(
        'Other Deduction',
        ...Array.from({ length: +OtherDeductionLength - 1 }, () => '')
      );
    }

    if (extra_EarningLength > 0) {
      row.push(
        '',
        ...Array.from({ length: +extra_EarningLength - 1 }, () => '')
      );
    }

    row.push('');

    if (employerSideLength > 0) {
      row.push('Employer Contribution');
    }

    // Add row to worksheet
    workSheet.addRow(row);

    workSheet.mergeCells(1, 1, 1, +basicDataLength);
    workSheet.mergeCells(
      1,
      +basicDataLength + 1,
      1,
      +basicDataLength + +earningDataLength
    );
    if (EmpContriLength > 0) {
      workSheet.mergeCells(
        1,
        +basicDataLength + +earningDataLength + 2,
        1,
        +basicDataLength + +earningDataLength + +EmpContriLength + 1
      );
    }

    if (OtherDeductionLength > 0) {
      workSheet.mergeCells(
        1,
        +basicDataLength + +earningDataLength + +EmpContriLength + 4,
        1,
        +basicDataLength +
          +earningDataLength +
          +EmpContriLength +
          +OtherDeductionLength +
          3
      );
    }

    if (employerSideLength > 0) {
      workSheet.mergeCells(
        1,
        +basicDataLength +
          +earningDataLength +
          +EmpContriLength +
          +OtherDeductionLength +
          +extra_EarningLength +
          5,
        1,
        keysArray.length
      );
    }

    workSheet.addRow(keysArray);
  }

  if (report == 'salaryRegisterWithDateOfPay') {
    workSheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue Color
      };
      cell.font = { bold: true };
    });
  } else if (report == 'monthlySalarySummary') {
    workSheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue color
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    workSheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue color
      };
      cell.font = { bold: true };
    });
  } else {
    workSheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '729fcf' }, // Blue color
      };
      cell.font = { bold: true };
    });

    workSheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        // fgColor: { argb: '729fcf' }, // Blue color
      };
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  }

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  if (report == 'monthlySalarySummary') {
    workSheet.addRow(['']);
    workSheet.addRow(['']);
    workSheet.addRow(['']);
    workSheet.addRow(['']);

    const newRow = workSheet.addRow([
      ...['CALCULATION OF AMOUNT PAYABLE FOR E.P.F. ACCOUNT'],
      ...Array.from({ length: 11 }, () => ''),
      ...['CALCULATION OF AMOUNT PAYABLE FOR E.S.I.C. AMOUNT (TOTAL)'],
    ]);

    workSheet.mergeCells(newRow.number, 1, newRow.number, 5);

    workSheet.mergeCells(newRow.number, 13, newRow.number, 17);

    workSheet.getRow(newRow.number).eachCell((cell) => {
      cell.font = { bold: true };
    });

    workSheet.addRow(['']);

    const data3 = calculationData.map((row) => Object.values(row));

    data3.map((e) => {
      const row = workSheet.addRow(e);

      workSheet.mergeCells(row.number, 1, row.number, 5);

      workSheet.mergeCells(row.number, 13, row.number, 17);
    });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

function base64ToUint8Array(base64String) {
  // const binaryString = atob(base64String);
  const binaryString = Buffer.from(base64String, 'base64').toString('binary');
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Function to create a zip file containing PDF files for salary slip

async function createZipFileForsalarySlip(
  salarySlipData,
  yearMonth,
  fileName,
  res
) {
  const zip = new JSZip();
  for (let i = 0; i < salarySlipData.length; i++) {
    const pdfBytes = base64ToUint8Array(salarySlipData[i].path);
    zip.file(
      `${i + 1} ${salarySlipData[i].displayName} - ${yearMonth}.pdf`,
      pdfBytes
    );
  }
  const zipbuffer = await zip.generateAsync({ type: 'nodebuffer' });
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=${fileName}.zip`,
  });
  return res.end(zipbuffer);
}

const setColorInBackground = (workSheet, row, color) => {
  workSheet.getRow(row).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: `${color}` },
    };
    cell.font = { bold: true };
  });
};

const generateDemoExcelForAdvance = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Advance Data');
  const workSheet1 = workBook.addWorksheet('Basic Instructions');
  workSheet1.addRow(['Date Format must be in yyyy-mm-dd format.']);
  workSheet1.addRow([
    'Reference Date is required ,if you are selecting payment mode Cheque,UPI or NetBanking.',
  ]);

  setColorInBackground(workSheet1, 1, 'FF0000'); // light red
  setColorInBackground(workSheet1, 2, 'FF0000');

  const keysArray = Object.keys(data[0]);
  workSheet.addRow(keysArray);
  setColorInBackground(workSheet, 1, '729fcf'); // blue
  await styleRow(workSheet, 1);

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  // set payment mode in dropdown
  const paymentModeColumn = workSheet.getColumn(8);
  const paymentModeValues = ['Cash', 'UPI', 'Cheque', 'NetBanking'];
  paymentModeColumn.eachCell((cell, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip the header row
      const dataValidation = {
        type: 'list',
        formulae: [`"${paymentModeValues.join(',')}"`],
        allowNulls: true,
      };
      cell.dataValidation = dataValidation;
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForPreboarding = async (
  PreboardingData,
  fileName,
  fileType,
  res,
  index1
) => {
  if (!PreboardingData.length)
    throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'User Name',
    'User Number',
    'Date of Birth',
    'Email',
    'Address',
    'Branch',
    'Designation',
    'Date Time',
    'Preboarding Request',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Assigned By',
    'Remarks',
    'Request Status',
    'Assigned to',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 10, 1, 12);

  for (let i = 1; i <= 9; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = PreboardingData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 9; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }
  worksheet.getColumn(9).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference

  // var indexofIndex1 = 0
  // for (let j = 3; j <= data2.length; j = j + index1[indexofIndex1]) {
  //   for (let i = 1; i <= 8; i++) {
  //     worksheet.mergeCells(j, i, j + 2, i);
  //   }
  // }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForEmployeeGatePass = async (
  ShiftData,
  fileName,
  fileType,
  res
) => {
  if (!ShiftData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Employee Name',
    'Company Name',
    'Branch',
    'Department',
    'Designation',
    'Stauts',
    'Description',
    'Date',
    'From Time',
    'To Time',
    'Purpose',
    'Rejection Reason',
    'Check In/Out Details',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',

    'Date',
    'Time',
    'Type',
    'Address',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 14, 1, 17);

  for (let i = 1; i <= 13; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = ShiftData.map((row) => Object.values(row));
  data2.map((e) => worksheet.addRow(e));

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 13; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForMonthlyAttendanceReport = async (
  data,
  companyName,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');

  workSheet.addRow([companyName]);
  workSheet.mergeCells(1, 1, 1, 5);
  workSheet.getRow(1).height = 22;

  await styleRow(workSheet, 1);

  workSheet.getRow(1).font = {
    bold: true,
    size: 15,
    color: { argb: '000000' },
  };

  function styleRowData(worksheet, row) {
    worksheet.getRow(row).font = {
      bold: true,
      color: { argb: '000000' },
    };
  }

  let merge = 1;

  for (let i = 0; i < data.length; i++) {
    merge++;
    workSheet.addRow([
      `Employee Code : ${data[i].EmployeeCode ? data[i].EmployeeCode : ''}`,
    ]);
    workSheet.mergeCells(merge, 1, merge, 5);
    styleRowData(workSheet, merge);
    merge++;
    workSheet.addRow([`Employee Name : ${data[i].EmployeeName} `]);
    workSheet.mergeCells(merge, 1, merge, 5);
    styleRowData(workSheet, merge);
    merge++;
    workSheet.addRow([`Designation : ${data[i].Designation} `]);
    workSheet.mergeCells(merge, 1, merge, 5);
    styleRowData(workSheet, merge);
    merge++;
    workSheet.addRow([`Month : ${data[i].month} `]);
    workSheet.mergeCells(merge, 1, merge, 5);
    styleRowData(workSheet, merge);
    merge++;
    workSheet.addRow(['DATE', 'SHIFT', 'IN TIME', 'OUT TIME', 'STATUS']);
    styleRowData(workSheet, merge);

    const data2 = data[i].attendanceData.map((row) => Object.values(row));

    data2.map((e) => workSheet.addRow(e));

    workSheet.addRow([
      `Total Days : ${data[i].monthDays} `,
      `Present : ${data[i].present}`,
      `Absent : ${data[i].absent}`,
      `Total Leave : ${data[i].totalleave}`,
      `WH/PH : ${data[i].weekoffHoliday}`,
    ]);
    merge += data[i].attendanceData.length + 1;
    styleRowData(workSheet, merge);
    workSheet.addRow([]);

    merge++;
  }

  workSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForEmployeeWiseSalaryReport = async (
  data,
  tempData,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  workSheet.addRow([]);
  workSheet.mergeCells(
    1,
    1,
    1,
    6 +
      data[data.length - 1].earningPayHead.length +
      data[data.length - 1].deductionPayHead.length
  );

  workSheet.getRow(1).font = {
    bold: true,
    size: 12,
    color: { argb: 'FFFFFF' },
  };

  workSheet.addRow([tempData.companyName]);
  workSheet.mergeCells(
    2,
    1,
    2,
    6 +
      data[data.length - 1].earningPayHead.length +
      data[data.length - 1].deductionPayHead.length
  );
  workSheet.getRow(2).height = 20;

  workSheet.addRow([tempData.companyAddress]);
  workSheet.mergeCells(
    3,
    1,
    3,
    6 +
      data[data.length - 1].earningPayHead.length +
      data[data.length - 1].deductionPayHead.length
  );

  workSheet.addRow([
    `Period From Date : ${tempData.startDate} To ${tempData.endDate}`,
  ]);

  workSheet.mergeCells(
    4,
    1,
    4,
    6 +
      data[data.length - 1].earningPayHead.length +
      data[data.length - 1].deductionPayHead.length
  );

  await styleRow(workSheet, 2);
  await styleRow(workSheet, 3);
  await styleRow(workSheet, 4);

  workSheet.addRow([`${tempData.employeeCode}`, `${tempData.displayName}`]);
  workSheet.mergeCells(
    5,
    2,
    5,
    6 +
      data[data.length - 1].earningPayHead.length +
      data[data.length - 1].deductionPayHead.length
  );

  workSheet.getRow(2).font = {
    bold: true,
    size: 12,
    color: { argb: '000000' },
  };

  function styleRowData(worksheet, row) {
    worksheet.getRow(row).font = {
      bold: true,
      color: { argb: '000000' },
    };
  }

  styleRowData(workSheet, 5);

  const finaldata = data.map((e) => {
    const object = {};
    object['Month'] = e['Month'];
    object['Salary Scale'] = e['Salary Scale'];
    object['Total Days'] = e['Total Days'];

    e.earningPayHead.forEach((ep) => {
      object[ep.payheadName] = ep.EmployeeSalaryAmount;
    });

    // object['Earning'] = earningPayHead
    object['Gross Salary'] = e['Gross Salary'];

    e.deductionPayHead.forEach((ep) => {
      object[ep.payheadName] = ep.EmployeeSalaryAmount;
    });
    // object['Deduction'] = deductionPayHead

    object['Total Deduction'] = e['Total Deduction'];

    e.extra_earningPayHead.forEach((ep) => {
      object[ep.payheadName] = ep.EmployeeSalaryAmount;
    });

    object['Total Salary'] = e['Total Salary'];

    return object;
  });

  const headerNames = Object.keys(finaldata[finaldata.length - 1]);
  const transformedObject = [];
  for (let i = 0; i < finaldata.length; i++) {
    let isNotArray = true;
    headerNames.forEach((key) => {
      if (Array.isArray(finaldata[i][key]) === true) {
        finaldata[i][key].forEach((obj) => {
          isNotArray = false;
          // Deep copy so that values in finaldata[i] does not get changed
          const transformedElement = JSON.parse(JSON.stringify(finaldata[i]));
          transformedElement[key] = obj;
          transformedObject.push({ ...transformedElement });
        });
      }
    });
    if (isNotArray)
      transformedObject.push(JSON.parse(JSON.stringify(finaldata[i])));
  }
  if (transformedObject.length === 0) transformedObject.push(...finaldata);

  const keyData = flattenObj(
    transformedObject[findIndexParentWithMostKeys(transformedObject)]
  );

  const columns1 = Object.keys(keyData).map((key) => key);

  const columns = Object.keys(keyData).map((key) => ({
    header: key,
    key,
    width: 15,
  }));

  workSheet.columns = columns;

  workSheet.addRow(columns1);
  styleRowData(workSheet, 6);

  transformedObject.forEach((element) => {
    workSheet.addRow(flattenObj(element));
  });

  styleRowData(workSheet, finaldata.length + 6);

  // const data2 = transformedObject.map((row) => Object.values(row));

  // data2.map((e) => workSheet.addRow(e));

  workSheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateDemoExcelForDivision = async (
  data,
  division,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Division');
  const workSheet1 = workBook.addWorksheet('Basic Instructions');
  workSheet1.addRow(['Date Format must be in yyyy-mm-dd format.']);
  workSheet1.addRow(['Division and Applicable Date are required fields.']);
  setColorInBackground(workSheet1, 1, 'FF0000'); // light red
  setColorInBackground(workSheet1, 2, 'FF0000'); // light red
  const keysArray = Object.keys(data[0]);
  workSheet.addRow(keysArray);
  setColorInBackground(workSheet, 1, '729fcf'); // blue
  await styleRow(workSheet, 1);

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  // set division in dropdown
  const divisionColumn = workSheet.getColumn(6);
  const paymentModeValues = division;
  divisionColumn.eachCell((cell, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip the header row
      const dataValidation = {
        type: 'list',
        formulae: [`"${paymentModeValues.join(',')}"`],
        allowNulls: true,
      };
      cell.dataValidation = dataValidation;
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateDemoExcelForWorkingArea = async (
  data,
  workingArea,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Working Area');
  const workSheet1 = workBook.addWorksheet('Basic Instructions');
  workSheet1.addRow(['Date Format must be in yyyy-mm-dd format.']);
  workSheet1.addRow(['Working Area and Applicable Date are required fields.']);
  setColorInBackground(workSheet1, 1, 'FF0000'); // light red
  setColorInBackground(workSheet1, 2, 'FF0000'); // light red
  const keysArray = Object.keys(data[0]);
  workSheet.addRow(keysArray);
  setColorInBackground(workSheet, 1, '729fcf'); // blue
  await styleRow(workSheet, 1);

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  // set working Area  in dropdown
  const workingAreaColumn = workSheet.getColumn(6);
  const workingAreaValues = workingArea;
  workingAreaColumn.eachCell((cell, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip the header row
      const dataValidation = {
        type: 'list',
        formulae: [`"${workingAreaValues.join(',')}"`],
        allowNulls: true,
      };
      cell.dataValidation = dataValidation;
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateDemoExcel = async (
  data,
  branch,
  department,
  designation,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Employee Data');
  const workSheet1 = workBook.addWorksheet('Branch');
  const workSheet2 = workBook.addWorksheet('Department');
  const workSheet3 = workBook.addWorksheet('Designation');

  // worksheeet
  const header = Object.keys(data[0]);

  workSheet.addRow(header);

  formatFirstRow(workSheet, 1);

  const data1 = data.map((row) => Object.values(row));

  data1.map((e) => workSheet.addRow(e));

  //worksheet1--branch

  workSheet1.addRow(['Branch']);
  formatFirstRow(workSheet1, 1);

  const data2 = branch.map((row) => [row.branchName]);

  data2.map((e) => workSheet1.addRow(e));

  //worksheet2--department

  workSheet2.addRow(['Department']);
  formatFirstRow(workSheet2, 1);

  const data3 = department.map((row) => [row.departmentName]);

  data3.map((e) => workSheet2.addRow(e));

  //worksheet1--desig

  workSheet3.addRow(['Designation']);
  formatFirstRow(workSheet3, 1);

  const data4 = designation.map((row) => [row.designationName]);

  data4.map((e) => workSheet3.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateDemoExcelForPreviousSalary = async (
  employeeEarningHeader,
  employeeContributionHeader,
  employerContributionHeader,
  otherDeductionHeader,
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Previous Salary Data');

  const temp1 = Array.from(
    { length: +employeeEarningHeader.length - 1 },
    () => ''
  );

  const temp2 = Array.from(
    { length: +employeeContributionHeader.length - 1 },
    () => ''
  );

  const temp3 = Array.from(
    { length: +employerContributionHeader.length - 1 },
    () => ''
  );

  workSheet.addRow([
    ...['', '', '', '', '', 'Employee Earning Payhead'],
    ...temp1,
    ...['', 'Employee Contribution Payhead'],
    ...temp2,
    ...['', 'Employer Contribution Payhead'],
    ...temp3,
    ...['Other Payhead'],
  ]);

  workSheet.mergeCells(1, 6, 1, 5 + employeeEarningHeader.length);

  if (+employeeEarningHeader.length > 0 && employeeContributionHeader.length) {
    workSheet.mergeCells(
      1,
      6 + employeeEarningHeader.length + 1,
      1,
      5 + +employeeEarningHeader.length + 1 + employeeContributionHeader.length
    );
  }

  if (
    employeeEarningHeader.length > 0 &&
    employeeContributionHeader.length > 0 &&
    employerContributionHeader.length
  ) {
    workSheet.mergeCells(
      1,
      6 +
        +employeeEarningHeader.length +
        1 +
        employeeContributionHeader.length +
        1,
      1,
      5 +
        employeeEarningHeader.length +
        1 +
        employeeContributionHeader.length +
        1 +
        employerContributionHeader.length
    );
  }

  if (
    employeeEarningHeader.length > 0 &&
    employeeContributionHeader.length > 0 &&
    employerContributionHeader.length > 0 &&
    otherDeductionHeader.length
  ) {
    workSheet.mergeCells(
      1,
      6 +
        employeeEarningHeader.length +
        1 +
        employeeContributionHeader.length +
        1 +
        employerContributionHeader.length,
      1,
      5 +
        employeeEarningHeader.length +
        1 +
        employeeContributionHeader.length +
        1 +
        employerContributionHeader.length +
        otherDeductionHeader.length
    );
  }

  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 12, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  workSheet.getRow(1).height = 20;

  const headerRow = workSheet.addRow(Object.keys(data[0]));

  // Set light blue color for cells 1 to 5
  setCellColor(headerRow, 1, 5, 'ADD8E6'); // Light Blue

  // Set light green color for cells 6 to incentiveHeader.length
  setCellColor(headerRow, 6, 5 + employeeEarningHeader.length, '90EE90'); // Light Green

  // Set red color for penaltyHeader
  setCellColor(
    headerRow,
    6 + employeeEarningHeader.length + 1,
    5 + employeeEarningHeader.length + 1 + employeeContributionHeader.length,
    'e6b8b7'
  );
  // light yellow FFFFE0

  setCellColor(
    headerRow,
    6 +
      employeeEarningHeader.length +
      1 +
      employeeContributionHeader.length +
      1,
    5 +
      employeeEarningHeader.length +
      1 +
      employeeContributionHeader.length +
      1 +
      employerContributionHeader.length,
    'FFFF00'
  );

  // Set red color for penaltyHeader

  setCellColor(
    headerRow,
    6 +
      employeeEarningHeader.length +
      1 +
      employeeContributionHeader.length +
      1 +
      employerContributionHeader.length,
    5 +
      employeeEarningHeader.length +
      1 +
      employeeContributionHeader.length +
      1 +
      employerContributionHeader.length +
      otherDeductionHeader.length,
    'e6b8b7'
  );

  const data1 = data.map((row) => Object.values(row));

  data1.map((e) => workSheet.addRow(e));

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateAuthorozationExcel = async (
  data,
  AuthCriteria,
  authorizationMasterID,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Employee Data');
  const workSheet1 = workBook.addWorksheet('AuthorizationCriteria');

  // worksheeet
  const header = Object.keys(data[0]);

  workSheet.addRow(header);

  formatFirstRow(workSheet, 1);

  const data1 = data.map((row) => Object.values(row));

  data1.map((e) => workSheet.addRow(e));

  //worksheet1--branch

  workSheet1.addRow(['Auth Criteria']);

  formatFirstRow(workSheet1, 1);

  const data2 = AuthCriteria.map((row) => [row.AuthorizationCriteria]);

  data2.map((e) => workSheet1.addRow(e));
  // Hide the ExpenseHead worksheet to keep it clean
  workSheet1.state = 'hidden';

  if (authorizationMasterID == 0) {
    //Expense
    workSheet
      .getColumn(8)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Leave
    workSheet
      .getColumn(11)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Overtime
    workSheet
      .getColumn(14)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Resignation
    workSheet
      .getColumn(17)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Gatepass
    workSheet
      .getColumn(20)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
    //Compensatory Off
    workSheet
      .getColumn(23)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Attendance Correction
    workSheet
      .getColumn(26)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
  } else {
    //One only
    workSheet
      .getColumn(8)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForVisitReportMail = async (
  visitData,
  userMasterID,
  fileName,
  fileType
) => {
  if (!visitData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const headerNames = Object.keys(visitData[0]);

  worksheet.addRow(headerNames);
  await styleRow(worksheet, 1);
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '729fcf' }, // Red color
    };
  });

  const data2 = visitData.map((row) => Object.values(row));
  data2.map((e) => worksheet.addRow(e));

  let count = 0;
  for (let i = 0; i < visitData.length; i++) {
    if (i == 0) {
      count += 2;
    } else {
      count = i + 2;
    }

    console.table([
      count,
      12,
      count + +visitData[i].TotalVisit - 1,
      12,
      visitData[i].TotalVisit,
      i,
    ]);

    worksheet.mergeCells(count, 12, count + +visitData[i].TotalVisit - 1, 12);

    worksheet.mergeCells(count, 13, count + +visitData[i].TotalVisit - 1, 13);

    worksheet.mergeCells(count, 14, count + +visitData[i].TotalVisit - 1, 14);
    worksheet.mergeCells(count, 15, count + +visitData[i].TotalVisit - 1, 15);

    worksheet.mergeCells(count, 16, count + +visitData[i].TotalVisit - 1, 16);

    i += +visitData[i].TotalVisit - 1;
  }

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  const filePath = path.join(
    __dirname,
    '../uploads',
    `${fileName}${userMasterID}_${Date.now()}.xlsx`
  );
  workBook.xlsx
    .writeFile(filePath)
    .then(function () {})
    .catch(function (error) {
      accessLogStream.write(
        `${new Date().toLocaleString()} ===> Error Saving Workbook \n ${error}`
      );
    });

  return filePath;
};

const generateExcelDailyAttendanceCountDepartmentwise = async (
  data,
  dates,
  filename,
  fileExtension,
  res
) => {
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Daily Attendance Count');
  const formatDate = (dateString) => {
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Define formattedDates using the formatDate function
  const formattedDates = dates.map((date) => formatDate(date));

  // Add header row with styles
  const headerRow = ['Shift Name', ...formattedDates];
  const header = workSheet.addRow(headerRow);
  header.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    cell.alignment = { horizontal: 'center' };
  });

  data.forEach((item) => {
    const row = [
      item['Shift Name'],
      ...formattedDates.map((date) => item[date] || 0),
    ];
    const rowCells = workSheet.addRow(row);
    rowCells.eachCell((cell, colNumber) => {
      if (colNumber === 1) {
        // Bold for shiftName
        cell.font = { bold: true };
      } else if (typeof cell.value === 'number') {
        // Center align numbers
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  // Adjust column widths
  workSheet.columns.forEach((column) => {
    column.width = column.values.reduce((maxWidth, value) => {
      const length = value ? value.toString().length : 10;
      return Math.max(maxWidth, length);
    }, 10);
  });

  // Set the response headers for file download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}.${fileExtension}`
  );

  // Write the workbook to the response
  await workBook.xlsx.write(res);
  res.end();
};

const generateExcelDepartmentWisepunchinoutcountreport = async (
  data1,
  dates,
  filename,
  fileExtension,
  res
) => {
  const Excel = require('exceljs');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Department ShiftWise');
  const formatDate = (dateString) => {
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formattedDates = dates.map(formatDate);

  data1.forEach((shiftData) => {
    const shiftName = shiftData['Shift Name'];
    const headerRow = [shiftName, ...formattedDates];
    const header = workSheet.addRow(headerRow);

    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F81BD' },
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Initialize totals array
    const totals = new Array(formattedDates.length).fill(0);

    // Add data rows
    Object.keys(shiftData).forEach((departmentName) => {
      if (departmentName !== 'Shift Name') {
        const departmentData = shiftData[departmentName];
        const row = [
          departmentData['Department Name'],
          ...formattedDates.map((date, index) => {
            const value = departmentData[date] || 0;
            totals[index] += value; // Accumulate totals
            return value;
          }),
        ];

        const rowCells = workSheet.addRow(row);
        rowCells.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.font = { bold: true };
          } else if (typeof cell.value === 'number') {
            cell.alignment = { horizontal: 'center' };
          }
        });
      }
    });

    // Add footer row with totals
    const totalRow = ['Total', ...totals];
    const total = workSheet.addRow(totalRow);

    total.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: '000000' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'e3bce8' },
      };
      cell.alignment = { horizontal: 'center' };
    });
    // Add footer row with styles

    const fotterrow = [];
    const footer = workSheet.addRow(fotterrow);
    footer.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' },
      };
      cell.alignment = { horizontal: 'center' };
    });
    // Adjust column widths
    workSheet.columns.forEach((column) => {
      let maxWidth = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10;
        if (columnWidth > maxWidth) {
          maxWidth = columnWidth;
        }
      });
      column.width = maxWidth + 2;
    });
  });

  // Set the response headers for file download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}.${fileExtension}`
  );

  // Write the workbook to the response
  await workBook.xlsx.write(res);
  res.end();
};

async function createZipFileForPortraitidIdCards(finalArray, res) {
  const fileName = 'id_cards';
  const zip = new JSZip();

  for (let i = 0; i < finalArray.length; i++) {
    const path = finalArray[i].path;

    const pdfBytes = base64ToUint8Array(path);
    zip.file(`${i + 1} ${finalArray[i].displayName}.pdf`, pdfBytes);
  }

  const zipbuffer = await zip.generateAsync({ type: 'nodebuffer' });
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=${fileName}.zip`,
  });
  res.end(zipbuffer);
}

const generateExcelDepartmentWisepunchinoutcountreportMail = async (
  data1,
  dates,
  fileName,
  companyMasterID,
  userMasterID
) => {
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Department ShiftWise');
  const formatDate = (dateString) => {
    const parts = dateString.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const formattedDates = dates.map(formatDate);

  data1.forEach((shiftData) => {
    const shiftName = shiftData['Shift Name'];
    const headerRow = [shiftName, ...formattedDates];
    const header = workSheet.addRow(headerRow);

    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F81BD' },
      };
      cell.alignment = { horizontal: 'center' };
    });

    // Initialize totals array
    const totals = new Array(formattedDates.length).fill(0);

    // Add data rows
    Object.keys(shiftData).forEach((departmentName) => {
      if (departmentName !== 'Shift Name') {
        const departmentData = shiftData[departmentName];
        const row = [
          departmentData['Department Name'],
          ...formattedDates.map((date, index) => {
            const value = departmentData[date] || 0;
            totals[index] += value; // Accumulate totals
            return value;
          }),
        ];

        const rowCells = workSheet.addRow(row);
        rowCells.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.font = { bold: true };
          } else if (typeof cell.value === 'number') {
            cell.alignment = { horizontal: 'center' };
          }
        });
      }
    });

    // Add footer row with totals
    const totalRow = ['Total', ...totals];
    const total = workSheet.addRow(totalRow);

    total.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: '000000' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'e3bce8' },
      };
      cell.alignment = { horizontal: 'center' };
    });
    // Add footer row with styles

    const fotterrow = [];
    const footer = workSheet.addRow(fotterrow);
    footer.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' },
      };
      cell.alignment = { horizontal: 'center' };
    });
    // Adjust column widths
    workSheet.columns.forEach((column) => {
      let maxWidth = 10;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10;
        if (columnWidth > maxWidth) {
          maxWidth = columnWidth;
        }
      });
      column.width = maxWidth + 2;
    });
  });

  const filePath = path.join(
    __dirname,
    '../uploads',
    `${fileName}${userMasterID}_${Date.now()}.xlsx`
  );
  workBook.xlsx
    .writeFile(filePath)
    .then(function () {})
    .catch(function (error) {
      accessLogStream.write(
        `${new Date().toLocaleString()} ===> Error Saving Workbook \n ${error}`
      );
    });

  return filePath;
};

function getGradeForTarget(gradeObject, targetAchieved) {
  const target = parseFloat(targetAchieved);
  for (const [grade, range] of Object.entries(gradeObject)) {
    const [min, max] = range.split('-').map(Number);
    if (target >= min && target <= max) {
      return grade;
    }
  }
  return 'NA';
}
const genrateDemoExcelForExpenseHead = async (
  data,
  fileName,
  fileType,
  res
) => {
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Expense Head');
    const expenseHeadSheet = workBook.addWorksheet('ExpenseHead');
    expenseHeadSheet.addRow(['Expense Category']);

    workSheet.addRow(['Expense Category', 'Expense Head Name']);
    setColorInBackground(expenseHeadSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const ExpenseCategoryData = data;
    ExpenseCategoryData.forEach((Category, index) => {
      expenseHeadSheet.getCell(`A${index + 2}`).value = Category;
    });

    // Hide the ExpenseHead worksheet to keep it clean
    expenseHeadSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([null, null]);
    }

    workSheet
      .getColumn(1)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`ExpenseHead!$A$2:$A$${data.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForWorkingLocation = async (
  cityData,
  fileName,
  fileType,
  res
) => {
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Working Location');
    const citiesSheet = workBook.addWorksheet('Cities');
    citiesSheet.addRow(['City Name']);

    workSheet.addRow([
      'Working Location Name',
      'Latitude',
      'Longitude',
      'Radius',
      'Working Location Address',
      'Working Location City',
    ]);
    setColorInBackground(citiesSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const cityNames = cityData;
    cityNames.forEach((city, index) => {
      citiesSheet.getCell(`A${index + 2}`).value = city;
    });

    // const branchNames = branchData;
    // branchNames.forEach((city, index) => {
    //   branchSheet.getCell(`A${index + 2}`).value = city;
    // });

    // Hide the Cities worksheet to keep it clean
    citiesSheet.state = 'hidden';
    // branchSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([null, null, null, null, null, null]);
    }
    // workSheet
    // .getColumn(1)
    // .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    //   if (rowNumber !== 1) {
    //     // Skip the header row
    //     cell.dataValidation = {
    //       type: 'list',
    //       allowBlank: true,
    //       formulae: [`Branch!$A$2:$A$${branchData.length + 1}`],
    //     };
    //   }
    // });

    workSheet
      .getColumn(6)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Cities!$A$2:$A$${cityData.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForBranch = async (data, fileName, fileType, res) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Branch');
    const citiesSheet = workBook.addWorksheet('Cities');
    citiesSheet.addRow(['City Name']);

    workSheet.addRow([
      'Branch Name',
      'Branch Code',
      'Branch Address',
      'Branch City',
      'Latitude',
      'Longitude',
      'Radius',
      'GST Number',
      'LWF Number',
      'Professional Tax Number',
      'PF Number',
      'ESIC Number',
    ]);
    setColorInBackground(citiesSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const NonRequiredColumnStle = [
      { index: 5, color: '729fcf' },
      { index: 6, color: '729fcf' },
      { index: 7, color: '729fcf' },
      { index: 8, color: '729fcf' },
      { index: 9, color: '729fcf' },
      { index: 10, color: '729fcf' },
      { index: 11, color: '729fcf' },
      { index: 12, color: '729fcf' },
    ];

    // Apply the styles to each specified column
    NonRequiredColumnStle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });
    // setColorInBackground(workSheet, 1, '729fcf'); // blue
    // await styleRow(workSheet, 1);

    const cityNames = data;
    cityNames.forEach((city, index) => {
      citiesSheet.getCell(`A${index + 2}`).value = city;
    });

    // Hide the Cities worksheet to keep it clean
    citiesSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    }

    workSheet
      .getColumn(4)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Cities!$A$2:$A$${data.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForCustomer = async (data, fileName, fileType, res) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Customer');
    const citiesSheet = workBook.addWorksheet('Cities');
    citiesSheet.addRow(['City Name']);

    workSheet.addRow([
      'Customer Name',
      'Customer Company Name',
      'Current Location',
      'Latitude',
      'Longitude',
      'Mobile Number - 1',
      'Mobile Number - 2',
      'EMail - ID',
      'WebSite',
      'Customer Address',
      'ZipCode',
      'Customer City',
    ]);
    setColorInBackground(citiesSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
      { index: 10, color: 'FFFF6666' },
      { index: 11, color: 'FFFF6666' },
      { index: 12, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const NonRequiredColumnStle = [
      { index: 3, color: '729fcf' },
      { index: 4, color: '729fcf' },
      { index: 5, color: '729fcf' },
      { index: 7, color: '729fcf' },
      { index: 8, color: '729fcf' },
      { index: 9, color: '729fcf' },
    ];

    // Apply the styles to each specified column
    NonRequiredColumnStle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });
    // setColorInBackground(workSheet, 1, '729fcf'); // blue
    // await styleRow(workSheet, 1);

    const cityNames = data;
    cityNames.forEach((city, index) => {
      citiesSheet.getCell(`A${index + 2}`).value = city;
    });

    // Hide the Cities worksheet to keep it clean
    citiesSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    }

    workSheet
      .getColumn(12)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Cities!$A$2:$A$${data.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForContractor = async (
  citydata,
  bankData,
  fileName,
  fileType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Customer');
    const citiesSheet = workBook.addWorksheet('Cities');
    const bankSheet = workBook.addWorksheet('Bank');
    citiesSheet.addRow(['City Name']);
    bankSheet.addRow(['Bank Name']);

    workSheet.addRow([
      'Contractor Name',
      'WebSite',
      'Short Name',
      'Contact Person Name',
      'Contractor Code',
      'Contact Number',
      'Email',
      'Contractor City',
      'Date of Incorporation',
      'Contractor Bank',
      'Bank IFSC Code',
      'Bank Account No',
      'Pan Card No',
      'GST No',
      'Registration Number',
      'About Contractor',
      'Contractor Address',
    ]);
    setColorInBackground(citiesSheet, 1, '729fcf');
    setColorInBackground(bankSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
      { index: 7, color: 'FFFF6666' },
      { index: 8, color: 'FFFF6666' },
      { index: 9, color: 'FFFF6666' },
      { index: 17, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const NonRequiredColumnStle = [
      { index: 2, color: '729fcf' },
      { index: 10, color: '729fcf' },
      { index: 11, color: '729fcf' },
      { index: 12, color: '729fcf' },
      { index: 13, color: '729fcf' },
      { index: 14, color: '729fcf' },
      { index: 15, color: '729fcf' },
      { index: 16, color: '729fcf' },
    ];

    // Apply the styles to each specified column
    NonRequiredColumnStle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });
    // setColorInBackground(workSheet, 1, '729fcf'); // blue
    // await styleRow(workSheet, 1);

    const cityNames = citydata;
    cityNames.forEach((city, index) => {
      citiesSheet.getCell(`A${index + 2}`).value = city;
    });

    const bankNames = bankData;
    bankNames.forEach((bank, index) => {
      bankSheet.getCell(`A${index + 2}`).value = bank;
    });

    // Hide the Cities worksheet to keep it clean
    citiesSheet.state = 'hidden';
    bankSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    }

    workSheet
      .getColumn(8)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Cities!$A$2:$A$${citydata.length + 1}`],
          };
        }
      });
    // workSheet
    // .getColumn(9)
    // .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    //   if (rowNumber !== 1) {
    //     // Skip the header row
    //     cell.dataValidation = {
    //       type: 'date',
    //       allowBlank: true,
    //     };
    //   }
    // });
    workSheet
      .getColumn(10)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`Bank!$A$2:$A$${citydata.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForAssetMaster = async (
  CategoyData,
  fileName,
  fileType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Asset');
    const assetcategorysheet = workBook.addWorksheet('AssetCategory');
    assetcategorysheet.addRow(['Asset Category Name']);

    workSheet.addRow([
      'Asset Category Name',
      'Asset Serial Number',
      'Asset Name',
      'Quantity',
      'Purchase Date',
      'Description',
    ]);
    setColorInBackground(assetcategorysheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    // setColorInBackground(workSheet, 1, '729fcf'); // blue
    // await styleRow(workSheet, 1);

    const categoryNames = CategoyData;
    categoryNames.forEach((city, index) => {
      assetcategorysheet.getCell(`A${index + 2}`).value = city;
    });

    // Hide the Cities worksheet to keep it clean
    assetcategorysheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([null, null, null, null, null, null]);
    }

    workSheet
      .getColumn(1)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`AssetCategory!$A$2:$A$${CategoyData.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const generateExcelForPunchInPunchOutReport = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');

  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = Object.keys(data[0]);
    const transformedObject = [];

    for (let i = 0; i < data.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(data[i][key]) === true) {
          data[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(data[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(data[i])));
    }

    if (transformedObject.length === 0) transformedObject.push(...data);

    const keyData = flattenObj(
      transformedObject[findIndexParentWithMostKeys(transformedObject)]
    );

    const columns = Object.keys(keyData).map((key) => ({
      header: key,
      key,
      width: 20, // Adjust width if needed
    }));

    workSheet.columns = columns;

    transformedObject.forEach((element, index) => {
      const flatObj = flattenObj(element);
      const rowNum = index + 2; // Use the index to get the current row number
      const row = workSheet.getRow(rowNum);

      // Code to find if there are columns that contains image keyword in its name then we'll assume it carries image buffer
      Object.keys(flatObj).forEach((key) => {
        const base64regex =
          /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
        if (
          key.includes('image') &&
          (fs.existsSync(path.join(__dirname, '../', element[key])) ||
            base64regex.test(element[key]))
        ) {
          row.height = 100;
          const column = workSheet.getColumn(key);
          delete flatObj[key];

          // Read the PNG file and convert it to base64
          if (element[key].endsWith('.png')) {
            const imagePath = path.join(__dirname, '../', element[key]);

            // const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });
            element[key] = fs.readFileSync(imagePath, { encoding: 'base64' });
          }

          if (element[key]) {
            const imageId = workBook.addImage({
              extension: 'png',
              base64: element[key],
            });
            workSheet.addImage(
              imageId,
              `${column.letter}${rowNum}:${column.letter}${rowNum}`
            );
          }
        }
      });

      row.values = flatObj;
    });

    formatFirstRow(workSheet, 1);
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForAttendaceReport4 = async (
  hrLeaveHeader = [],
  allUser_HrleaveData = [],
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('sheet');
  const workSheet1 = workBook.addWorksheet('With Attendance Summary');
  const date_header = data[0].attendance.map((e) => e.date);
  const mainHeader = [
    ...[
      'Sr No.',
      'Employee Code',
      'Employee Name',
      'Company',
      'Branch',
      'Department',
      'Designation',
      'Time',
    ],
    ...date_header,
    ...[
      'Present',
      'Miss Punch',
      'Absent',
      'Leave',
      'Half Day',
      'LC+EG',
      'Week Off',
      'Holiday',
      'Total',
    ],
  ];

  workSheet.addRow(mainHeader);

  const mainHeader1 = [
    ...[
      'Sr No.',
      'Employee Code',
      'Employee Name',
      'Company',
      'Branch',
      'Department',
      'Designation',
    ],
    ...date_header,
    ...[
      'Present',
      'Miss Punch',
      'Absent',
      'Leave',
      'Half Day',
      'LC+EG',
      'Week Off',
      'Holiday',
      'Total',
      '',
    ],
    ...hrLeaveHeader,
  ];

  workSheet1.addRow(mainHeader1);

  workSheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  workSheet1.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'add8e6' }, // Red color
    };
    cell.font = { bold: true };
  });

  let countrow = 1;
  data.map((e, index) => {
    const rowdata = [
      index + 1,
      e.employeeCode,
      e.employeeName,
      e.Company,
      e.Branch,
      e.Department,
      e.Designation,
    ];

    const obj = allUser_HrleaveData[index];

    const hrLeaveData = hrLeaveHeader.map((key) => (obj[key] ? obj[key] : 0));

    const indata = e.attendance.map((a) => a.inTime || '');
    const outdata = e.attendance.map((a) => a.outTime || '');
    const attandanceStatus = e.attendance.map((a) => a.title || '');

    const Total =
      e.presentCount +
      e.missPunChCount +
      e.absentCount +
      e.leaveCount +
      e.halfDayCount +
      e.weekOffCount +
      e.holidayCount;
    workSheet.addRow([
      ...rowdata,
      ...[''],
      ...(attandanceStatus ? attandanceStatus : []),
      ...[
        e.presentCount,
        e.missPunChCount,
        e.absentCount,
        e.leaveCount,
        e.halfDayCount,
        e.lcegCount,
        e.weekOffCount,
        e.holidayCount,
        Total,
      ],
    ]);

    workSheet1.addRow([
      ...rowdata,
      ...(attandanceStatus ? attandanceStatus : []),
      ...[
        e.presentCount,
        e.missPunChCount,
        e.absentCount,
        e.leaveCount,
        e.halfDayCount,
        e.lcegCount,
        e.weekOffCount,
        e.holidayCount,
        Total,
        '',
      ],
      ...hrLeaveData,
    ]);

    countrow++;
    const firstrow = countrow;
    workSheet.addRow([
      ...rowdata,
      ...['IN'],
      ...(indata ? indata : []),
      ...[
        e.presentCount,
        e.missPunChCount,
        e.absentCount,
        e.leaveCount,

        e.halfDayCount,
        e.lcegCount,
        e.weekOffCount,
        e.holidayCount,
        Total,
      ],
    ]);

    countrow++;
    workSheet.addRow([
      ...rowdata,
      ...['OUT'],
      ...(outdata ? outdata : []),
      ...[
        e.presentCount,
        e.missPunChCount,
        e.absentCount,
        e.leaveCount,

        e.halfDayCount,
        e.lcegCount,
        e.weekOffCount,
        e.holidayCount,
        Total,
      ],
    ]);

    countrow++;
    const lasttrow = countrow;

    // Highlight cells based on status
    attandanceStatus.forEach((status, colIndex) => {
      const cell = workSheet.getCell(firstrow, 9 + colIndex);
      const cell1 = workSheet1.getCell(index + 2, 8 + colIndex);
      if (status === 'MP') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'a80dd9' },
        };
      } else if (status === 'A') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'f50202' },
        };
        cell1.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'f50202' },
        };
      } else if (
        status === 'HD' ||
        status === 'HD' ||
        status === 'P+OH' ||
        status === 'P+HD' ||
        status === 'HFD+HD' ||
        status === 'A+HD' ||
        status === 'HFD+OH' ||
        status === 'A+OH' ||
        status === 'MP+HD'
      ) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '729fcf' },
        };
        cell1.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '729fcf' },
        };
      } else if (status === 'HFD') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'fc7303' },
        };
      } else if (status === 'P+LC' || status === 'P+EG') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0cf2fa' },
        };
      } else if (
        status === 'WO' ||
        status === 'P+WO' ||
        status === 'HFD+WO' ||
        status === 'A+WO' ||
        status === 'MP+WO'
      ) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '729fcf' },
        };
        cell1.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '729fcf' },
        };
      } else if (status === 'P') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '00FF00' },
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6666' },
        };
      }
    });

    workSheet.mergeCells(firstrow, 1, lasttrow, 1);
    workSheet.mergeCells(firstrow, 2, lasttrow, 2);
    workSheet.mergeCells(firstrow, 3, lasttrow, 3);
    workSheet.mergeCells(firstrow, 4, lasttrow, 4);
    workSheet.mergeCells(firstrow, 5, lasttrow, 5);
    workSheet.mergeCells(firstrow, 6, lasttrow, 6);
    workSheet.mergeCells(firstrow, 7, lasttrow, 7);
    workSheet.mergeCells(
      firstrow,
      9 + +indata.length,
      lasttrow,
      9 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      10 + +indata.length,
      lasttrow,
      10 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      11 + +indata.length,
      lasttrow,
      11 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      12 + +indata.length,
      lasttrow,
      12 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      13 + +indata.length,
      lasttrow,
      13 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      14 + +indata.length,
      lasttrow,
      14 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      15 + +indata.length,
      lasttrow,
      15 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      16 + +indata.length,
      lasttrow,
      16 + +indata.length
    );
    workSheet.mergeCells(
      firstrow,
      17 + +indata.length,
      lasttrow,
      17 + +indata.length
    );
  });

  // Set dynamic column widths based on the length of the data
  workSheet.columns.forEach((column, index) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnTextLength = cell.value ? cell.value.toString().length : 5;
      if (columnTextLength > maxLength) {
        maxLength = columnTextLength;
      }
    });
    column.width = maxLength; // Set a minimum width of 10 and add padding
  });

  workSheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 0) {
      row.eachCell((cell, colNumber) => {
        alignmentmiddle(workSheet, rowNumber);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });
    }
  });

  // ------------Set For Seat1--------------------------

  // Set dynamic column widths based on the length of the data
  workSheet1.columns.forEach((column, index) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnTextLength = cell.value ? cell.value.toString().length : 5;
      if (columnTextLength > maxLength) {
        maxLength = columnTextLength;
      }
    });
    column.width = maxLength; // Set a minimum width of 10 and add padding
  });

  workSheet1.eachRow((row, rowNumber) => {
    if (rowNumber >= 0) {
      row.eachCell((cell, colNumber) => {
        alignmentmiddle(workSheet, rowNumber);
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const genrateDemoExcelForManualLeave = async (
  CategoyData,
  leaveNameData,
  fileName,
  fileType,
  fileUploadType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Manual Leave');
    const employeeDatasheet = workBook.addWorksheet('EmployeeData');
    employeeDatasheet.addRow([
      // '',
      'Employee Code',
      'Employee Name',
      'Employee Number',
      'Branch',
      'Department',
      'Designation',
    ]);
    const leaveNamessheet = workBook.addWorksheet('LeaveName');
    leaveNamessheet.addRow(['Leave Name', 'Leave Description']);
    const dayTypesheet = workBook.addWorksheet('DayType');
    dayTypesheet.addRow(['Day Type']);
    workSheet.addRow([
      fileUploadType,
      'Leave Type',
      'Day Type',
      'From Date(yyyy-mm-dd)',
      'To Date(yyyy-mm-dd)',
      'Reason',
    ]);
    setColorInBackground(employeeDatasheet, 1, '729fcf');
    setColorInBackground(leaveNamessheet, 1, '729fcf');
    setColorInBackground(dayTypesheet, 1, '729fcf');
    // const nonRequiredColumnStyle = [
    //   { index: 6, color: '729fcf' },
    // ];
    // // Apply the styles to each specified column
    // nonRequiredColumnStyle.forEach((column) => {
    //   workSheet
    //     .getColumn(column.index)
    //     .eachCell({ includeEmpty: true }, (cell) => {
    //       cell.fill = {
    //         type: 'pattern',
    //         pattern: 'solid',
    //         fgColor: { argb: column.color }, // Set the background color
    //       };
    //     });
    // });
    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    // setColorInBackground(workSheet, 1, '729fcf'); // blue
    // await styleRow(workSheet, 1);

    const leaveNames = leaveNameData;
    leaveNames.forEach((leave, index) => {
      leaveNamessheet.getCell(`A${index + 2}`).value = leave;
    });
    const employeeData = CategoyData;
    employeeData.forEach((data, index) => {
      // employeeDatasheet.getCell(`A${index + 2}`).value = data.mergedData;
      employeeDatasheet.getCell(`A${index + 2}`).value = data.employeeCode;
      employeeDatasheet.getCell(`B${index + 2}`).value = data.displayName;
      employeeDatasheet.getCell(`C${index + 2}`).value = data.userNumber;
      employeeDatasheet.getCell(`D${index + 2}`).value = data.branch;
      employeeDatasheet.getCell(`E${index + 2}`).value = data.department;
      employeeDatasheet.getCell(`F${index + 2}`).value = data.designation;
    });
    const dayType = ['First Half', 'Second Half', 'Full Day'];
    dayType.forEach((day, index) => {
      dayTypesheet.getCell(`A${index + 2}`).value = day;
    });
    // Hide the Cities worksheet to keep it clean
    // employeeDatasheet.state = 'hidden';
    leaveNamessheet.state = 'hidden';
    dayTypesheet.state = 'hidden';
    for (let i = 0; i < 1000; i++) {
      workSheet.addRow([null, null, null, null, null, null]);
    }
    // workSheet
    //   .getColumn(1)
    //   .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    //     if (rowNumber !== 1) {
    //       // Skip the header row
    //       cell.dataValidation = {
    //         type: 'list',
    //         allowBlank: true,
    //         formulae: [`EmployeeData!$A$2:$A$${CategoyData.length + 1}`],
    //       };
    //     }
    //   });
    workSheet
      .getColumn(3)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`DayType!$A$2:$A$${dayType.length + 1}`],
          };
        }
      });
    workSheet
      .getColumn(2)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`LeaveName!$A$2:$A$${leaveNameData.length + 1}`],
          };
        }
      });
    // workSheet
    //   .getColumn(4)
    //   .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    //     if (rowNumber !== 1) {
    //       // Skip the header row
    //       cell.dataValidation = {
    //         type: 'date',
    //         allowBlank: true,
    //         type: 'date',
    //         operator: 'between',
    //         formula1: '2020-01-01', // Start date
    //         formula2: '2030-12-31', // End date
    //         numFmt: 'yyyy-mm-dd',
    //       };
    //     }
    //   });
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const genrateDemoExcelForAssignAsset = async (
  categoryNames,
  fileUploadType,
  fileName,
  fileType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Assign Asset');

    const assetMastersheet = workBook.addWorksheet('AssetMaster');
    assetMastersheet.addRow(['Asset Master']);
    workSheet.addRow([
      fileUploadType,
      'Asset Name',
      'Description',
      'Quantity',
      'Assign Date (YYYY-MM-DD)',
      'Return Date (YYYY-MM-DD)',
    ]);
    setColorInBackground(assetMastersheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
      { index: 6, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    categoryNames.forEach((day, index) => {
      assetMastersheet.getCell(`A${index + 2}`).value = day;
    });
    // Hide the Cities worksheet to keep it clean
    // employeeDatasheet.state = 'hidden';
    assetMastersheet.state = 'hidden';
    for (let i = 0; i < 1000; i++) {
      workSheet.addRow([null, null, null, null, null, null]);
    }
    // workSheet
    //   .getColumn(1)
    //   .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
    //     if (rowNumber !== 1) {
    //       // Skip the header row
    //       cell.dataValidation = {
    //         type: 'list',
    //         allowBlank: true,
    //         formulae: [`EmployeeData!$A$2:$A$${CategoyData.length + 1}`],
    //       };
    //     }
    //   });
    workSheet
      .getColumn(2)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`AssetMaster!$A$2:$A$${categoryNames.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const generateExcelLateComeEarlyGoMail = async (
  data,
  fileName,
  userId,
  CheckListNames
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let checkList of data) {
    const workSheet = workBook.addWorksheet(CheckListNames[i]);
    i++;

    const headerNames = Object.keys(checkList[0]);

    const transformedObject = [];
    for (let i = 0; i < checkList.length; i++) {
      let isNotArray = true;
      headerNames.forEach((key) => {
        if (Array.isArray(checkList[i][key]) === true) {
          checkList[i][key].forEach((obj) => {
            isNotArray = false;
            // Deep copy so that values in data[i] does not get changed
            const transformedElement = JSON.parse(JSON.stringify(checkList[i]));
            transformedElement[key] = obj;
            transformedObject.push({ ...transformedElement });
          });
        }
      });
      if (isNotArray)
        transformedObject.push(JSON.parse(JSON.stringify(checkList[i])));
    }
    if (transformedObject.length === 0) transformedObject.push(...checkList);

    const keyData = flattenObj(
      transformedObject[findIndexParentWithMostKeys(transformedObject)]
    );

    const columns = Object.keys(keyData).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    workSheet.columns = columns;

    transformedObject.forEach((element) => {
      workSheet.addRow(flattenObj(element));
    });
    formatFirstRow(workSheet, 1);
  }

  const filePath = path.join(
    __dirname,
    '../uploads',
    `${fileName}${userId}_${Date.now()}.xlsx`
  );
  workBook.xlsx
    .writeFile(filePath)
    .then(function () {})
    .catch(function (error) {
      accessLogStream.write(
        `${new Date().toLocaleString()} ===> Error Saving Workbook \n ${error}`
      );
    });

  return filePath;

  // res.attachment(`${fileName}.${fileType}`);
  // res.set({ 'Access-Control-Expose-Headers': '*' });

  // return fileType === 'csv'
  //   ? workBook.csv.write(res)
  //   : workBook.xlsx.write(res);
};

const generateExcelForFYLeaveReportMail = async (
  Leaveata,
  firstHeader,
  leaveHeader,
  userId,
  fileName,
  SheetsNames
) => {
  if (!Leaveata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  let i = 0;
  for (let data of Leaveata) {
    const worksheet = workBook.addWorksheet(SheetsNames[i]);
    i++;

    // const worksheet = workBook.addWorksheet('sheet');

    worksheet.addRow([]);
    worksheet.addRow([firstHeader]);

    const leave_header = Array.from(
      { length: leaveHeader.length - 1 },
      () => ''
    );

    const header2 = [
      ...[
        'Sr. No.',
        'Name Of Employee',
        'Department',
        'Leave',
        '',
        'Leave Approved/Pending/Absent',
        'No. Of',
        'Before This Application Leave Taken',
      ],
      ...leave_header,
      ...[
        'No. Of Absent Leaves in this Financial Year',
        'No. Of Late In/Early Out in Financial Year',
      ],
    ];
    const header3 = [
      ...['', '', '', 'From', 'To', '', 'Days'],
      ...leaveHeader,
      ...['No.', 'No.'],
    ];

    worksheet.addRow(header2);
    worksheet.addRow(header3);

    await styleRow(worksheet, 2);
    await styleRow(worksheet, 3);
    await styleRow(worksheet, 4);

    worksheet.mergeCells(2, 1, 2, +header2.length);
    worksheet.mergeCells(3, 1, 4, 1);
    worksheet.mergeCells(3, 2, 4, 2);
    worksheet.mergeCells(3, 3, 4, 3);
    worksheet.mergeCells(3, 4, 3, 5);
    worksheet.mergeCells(3, 8, 3, 8 + +leave_header.length);

    const row2 = worksheet.getRow(2);
    row2.height = 20;

    row2.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'daeef3' }, // Red color
      };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'ebf1de' }, // Red color
      };
    });

    const mergeRanges = {};
    const data2 = data.map((row, index) => {
      row['SrNo'] = index;
      return Object.values(row);
    });

    let num = 1;
    await Promise.all(
      data2.map(async (d, i) => {
        const currentDisplayName = data[i].displayName;

        // Check if the display name is the same as the previous row
        if (i > 0 && currentDisplayName === data[i - 1].displayName) {
          d[0] = '';
          // Increment the end column of the merged range
          mergeRanges[currentDisplayName].map((a) => {
            a.endRow++;
          });
        } else {
          d[0] = num++;
          const leavemergecell = leaveHeader.map((m, index) => {
            return {
              startRow: i + 5,
              startColumn: 8 + index, // Assuming display name is in the second column
              endRow: i + 5,
              endColumn: 8 + index,
            };
          });

          // Create a new entry for the display name
          mergeRanges[currentDisplayName] = [
            ...[
              {
                startRow: i + 5,
                startColumn: 1, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 1,
              },
              {
                startRow: i + 5,
                startColumn: 2, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 2,
              },
              {
                startRow: i + 5,
                startColumn: 3, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 3,
              },
              {
                startRow: i + 5,
                startColumn: 8 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 8 + +leaveHeader.length,
              },
              {
                startRow: i + 5,
                startColumn: 9 + +leaveHeader.length, // Assuming display name is in the second column
                endRow: i + 5,
                endColumn: 9 + +leaveHeader.length,
              },
            ],
            ...leavemergecell,
          ];
        }
        worksheet.addRow(d);
      })
    );

    for (const displayName in mergeRanges) {
      const range = mergeRanges[displayName];

      range.map((e) => {
        worksheet.mergeCells(e.startRow, e.startColumn, e.endRow, e.endColumn);
      });
    }

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        alignment(worksheet, rowNumber + 3);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        // }
      });
    });
  }

  const filePath = path.join(
    __dirname,
    '../uploads',
    `${fileName}${userId}_${Date.now()}.xlsx`
  );
  workBook.xlsx
    .writeFile(filePath)
    .then(function () {})
    .catch(function (error) {
      accessLogStream.write(
        `${new Date().toLocaleString()} ===> Error Saving Workbook \n ${error}`
      );
    });

  return filePath;

  // res.attachment(`${fileName}.${fileType}`);
  // res.set({ 'Access-Control-Expose-Headers': '*' });
};

const generateExcelForDailyCostReportMail = async (
  headerMonth,
  datesArray,
  finaldata,
  wagessumArray,
  staffsumArray,
  othersumArray,
  sheetNames,
  userId,
  fileName
) => {
  if (!finaldata.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  datesArray.unshift('Date');

  finaldata.map((data, index) => {
    const worksheet = workBook.addWorksheet(sheetNames[index]);

    worksheet.addRow([]);
    worksheet.addRow([`Month:- ${headerMonth}`]);

    worksheet.getRow(2).height = 30;

    //  worksheet.getRow(2).font = { size: 40, bold: true };

    worksheet.addRow(datesArray);

    const costheader = Array.from(
      { length: datesArray.length - 1 },
      () => 'Cost'
    );

    costheader.unshift('Department Name');

    worksheet.addRow(costheader);

    worksheet.getRow(4).height = 22;

    worksheet.mergeCells(2, 1, 2, +costheader.length);

    data.map((e) => {
      const amountArray = e.amount;

      amountArray.unshift(e.department);

      worksheet.addRow(amountArray);
    });

    worksheet.addRow([]);

    if (sheetNames[index] == 'Wages')
      wagessumArray.unshift('Total Cost'), worksheet.addRow(wagessumArray);
    else if (sheetNames[index] == 'Staff')
      staffsumArray.unshift('Total Cost'), worksheet.addRow(staffsumArray);
    else othersumArray.unshift('Total Cost'), worksheet.addRow(othersumArray);

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        if (colNumber == 1 && rowNumber > 4) {
          cell.font = {
            size: 12,
            bold: true,
            color: { argb: '000000' },
          };
        }

        if (rowNumber < 5 && rowNumber != 2) {
          bold(worksheet, rowNumber);
        }

        alignmentmiddle(worksheet, rowNumber);
        // if (cell.value !== null && cell.value !== '') {
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };

        if (rowNumber === 2) {
          cell.border = {
            top: { style: 'thick', color: { argb: '000000' } },
            left: { style: 'thick', color: { argb: '000000' } },
            bottom: { style: 'thick', color: { argb: '000000' } },
            right: { style: 'thick', color: { argb: '000000' } },
          };
          cell.font = { size: 20, bold: true }; // Make the text bold as well
        }
        // }
      });
    });

    worksheet.getRow(2).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'eeece1' },
      };
      // cell.font = {size:15, bold: true };
    });

    worksheet.getRow(3).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'e6b8b7' },
      };
    });

    worksheet.getRow(4).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f2dcdb' },
      };
    });
  });

  const filePath = path.join(
    __dirname,
    '../uploads',
    `${fileName}${userId}_${Date.now()}.xlsx`
  );
  workBook.xlsx
    .writeFile(filePath)
    .then(function () {})
    .catch(function (error) {
      accessLogStream.write(
        `${new Date().toLocaleString()} ===> Error Saving Workbook \n ${error}`
      );
    });

  return filePath;
};

async function generateweekoffWorkDayExcel(
  finaldata,
  weekoffDate,
  fileName,
  fileType,
  res
) {
  if (!finaldata.length) throw new Error('No data found to generate the file!');

  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Sheet1');

  // Prepare headers
  const firstRow = [
    'Employee Code',
    'Employee Name',
    'Number',
    'Branch',
    'Designation',
    'Department',
  ];
  const secondRow = ['', '', '', '', '', ''];

  // Format weekoff dates
  const formattedWeekoffDatesWithDashes = weekoffDate.map((date) => {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB').replace(/\//g, '-');
  });

  formattedWeekoffDatesWithDashes.forEach((date) => {
    firstRow.push('', date, '');
    secondRow.push('InTime', 'OutTime', 'Hrs');
  });

  // Add header rows
  const headerRow1 = workSheet.addRow(firstRow);
  const headerRow2 = workSheet.addRow(secondRow);

  // Define reusable styles
  const headerStyle = {
    font: { size: 12, bold: true },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  const subHeaderStyle = {
    font: { size: 11, bold: true },
    alignment: { vertical: 'middle', horizontal: 'center' },
  };
  const dataStyle = {
    font: { size: 11 },
    alignment: { vertical: 'middle', horizontal: 'left' },
  };

  headerRow1.eachCell((cell) => {
    Object.assign(cell, headerStyle);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '729fcf' },
    };
  });

  headerRow2.eachCell((cell) => {
    Object.assign(cell, subHeaderStyle);
  });

  // Add data rows
  finaldata.forEach((employee) => {
    const rowData = [
      employee['Employee Code'] || '',
      employee['Employee Name'],
      employee['Number'],
      employee['Branch'],
      employee['Designation'],
      employee['Department'],
    ];

    weekoffDate.forEach((date) => {
      const dayData = employee[date] || {
        intime: 'NA',
        outtime: 'NA',
        hrs: 'NA',
      };
      rowData.push(dayData.intime, dayData.outtime, dayData.hrs);
    });

    const dataRow = workSheet.addRow(rowData);
    dataRow.eachCell((cell) => {
      Object.assign(cell, dataStyle);
    });
  });

  // Apply borders and adjust column widths
  workSheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  workSheet.columns.forEach((column) => {
    column.width = 20;
  });

  // Send the file as response
  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
}
const generateExcelForShiftRoster = async (
  data,
  dates,
  filename,
  fileExtension,
  res
) => {
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Shift Roster');

  // Add header row with styles
  const headerRow = [
    'Employee Code',
    'Employee Name',
    'Employee Number',
    'Branch',
    'Department',
    'Designation',
    ...dates,
  ];
  const header = workSheet.addRow(headerRow);
  header.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    };
  });

  data.forEach((item) => {
    const row = [
      item['Employee Code'],
      item['Employee Name'],
      item['Employee Number'],
      item['Branch'],
      item['Department'],
      item['Designation'],
      ...dates.map((date) => item[date] || ''),
    ];
    const rowCells = workSheet.addRow(row);
    rowCells.eachCell((cell, colNumber) => {
      if (colNumber <= 6) {
        // Bold for shiftName
        cell.font = { bold: true };
      } else {
        // Center align numbers
        cell.alignment = { horizontal: 'center' };
      }
      if (cell.value.includes(' / Weekoff')) {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '3462f6' },
        };
      }
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
    });
  });

  // Adjust column widths
  workSheet.columns.forEach((column) => {
    column.width = column.values.reduce((maxWidth, value) => {
      const length = value ? value.toString().length : 10;
      return Math.max(maxWidth, length);
    }, 10);
  });

  // Set the response headers for file download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}.${fileExtension}`
  );

  // Write the workbook to the response
  await workBook.xlsx.write(res);
  res.end();
};

const generateDemoExcelForShiftRoster = async (
  data,
  dates,
  shiftNames,
  fileUploadType,
  employeeData,
  filename,
  fileExtension,
  res
) => {
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Shift Roster');
  const shiftDataSheet = workBook.addWorksheet('Shift');
  shiftDataSheet.addRow(['Shift Name']);
  setColorInBackground(shiftDataSheet, 1, '729fcf');
  shiftNames.forEach((shift, index) => {
    shiftDataSheet.getCell(`A${index + 2}`).value = shift;
  });
  const InstructionsSheet = workBook.addWorksheet('Basic Instructions');
  InstructionsSheet.addRow(['1) Select Shift From DropDown']);
  InstructionsSheet.addRow([
    '2) To Add Weekoff Select Weekoff From Below Cell',
  ]);
  InstructionsSheet.addRow(['Weekoff']);
  shiftDataSheet.state = 'hidden';
  const employeeDatasheet = workBook.addWorksheet('EmployeeData');
  employeeDatasheet.addRow([
    // '',
    'Employee Code',
    'Employee Name',
    'Employee Number',
    'Branch',
    'Department',
    'Designation',
  ]);
  setColorInBackground(employeeDatasheet, 1, '729fcf');
  employeeData.forEach((data, index) => {
    // employeeDatasheet.getCell(`A${index + 2}`).value = data.mergedData;
    employeeDatasheet.getCell(`A${index + 2}`).value = data.employeeCode;
    employeeDatasheet.getCell(`B${index + 2}`).value = data.displayName;
    employeeDatasheet.getCell(`C${index + 2}`).value = data.userNumber;
    employeeDatasheet.getCell(`D${index + 2}`).value = data.branch;
    employeeDatasheet.getCell(`E${index + 2}`).value = data.department;
    employeeDatasheet.getCell(`F${index + 2}`).value = data.designation;
  });
  // Add header row with styles
  const headerRow =
    fileUploadType == 'mobileNumber'
      ? [
          'Employee Name',
          'Employee Branch',
          'Employee Department',
          'Employee Designation',
          'Employee Number',
          ...dates,
        ]
      : [
          'Employee Name',
          'Employee Branch',
          'Employee Department',
          'Employee Designation',
          'Employee Code',
          ...dates,
        ];
  const header = workSheet.addRow(headerRow);
  header.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    cell.alignment = { horizontal: 'center' };
  });

  data.forEach((item) => {
    const row = [
      item.displayName,
      item.branch,
      item.department,
      item.designation,
      fileUploadType == 'mobileNumber' ? item.userNumber : item.employeeCode,
      ...dates.map((date) => item[date] || ''),
    ];
    const rowCells = workSheet.addRow(row);
    rowCells.eachCell((cell, colNumber) => {
      if (colNumber <= 5) {
        // Bold for shiftName
        cell.font = { bold: true };
      } else if (typeof cell.value === 'number') {
        // Center align numbers
        cell.alignment = { horizontal: 'center' };
      }
      if (colNumber > 5) {
        workSheet
          .getColumn(colNumber)
          .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
            if (rowNumber !== 1) {
              // Skip the header row
              cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [`Shift!$A$2:$A$${shiftNames.length + 1}`],
              };
            }
          });
      }
    });
  });

  // Adjust column widths
  workSheet.columns.forEach((column) => {
    column.width = column.values.reduce((maxWidth, value) => {
      const length = value ? value.toString().length : 10;
      return Math.max(maxWidth, length);
    }, 10);
  });

  // Set the response headers for file download
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${filename}.${fileExtension}`
  );

  // Write the workbook to the response
  await workBook.xlsx.write(res);
  res.end();
};

const genrateDemoExcelForBiometricAttendance = async (
  CategoyData,
  fileName,
  fileType,
  dateTimeType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Manual Leave');
    const employeeDatasheet = workBook.addWorksheet('EmployeeData');
    employeeDatasheet.addRow([
      // '',
      'Employee Code',
      'Employee Name',
      'Employee Number',
      'Biometric Code',
      'Biometric SerialNumber',
      'Branch',
      'Department',
      'Designation',
    ]);
    const nationalityNamessheet = workBook.addWorksheet('NationalityName');
    nationalityNamessheet.addRow(['Name']);
    const dayTypesheet = workBook.addWorksheet('DayType');
    dayTypesheet.addRow(['Day Type']);

    if (dateTimeType == DateTimeType.SEPERATED) {
      workSheet.addRow([
        'Biometric Code',
        'Nationality',
        'Name',
        'Punch Type',
        'Log Date',
        'Log Time',
      ]);
    } else {
      workSheet.addRow([
        'Biometric Code',
        'Nationality',
        'Name',
        'Punch Type',
        'Log Date Time',
      ]);
    }

    setColorInBackground(employeeDatasheet, 1, '729fcf');
    setColorInBackground(nationalityNamessheet, 1, '729fcf');
    setColorInBackground(dayTypesheet, 1, '729fcf');

    const nationalityNames = ['Expat', 'National'];
    nationalityNames.forEach((leave, index) => {
      nationalityNamessheet.getCell(`A${index + 2}`).value = leave;
    });
    const employeeData = CategoyData;

    employeeData.forEach((data, index) => {
      // employeeDatasheet.getCell(`A${index + 2}`).value = data.mergedData;
      employeeDatasheet.getCell(`A${index + 2}`).value = data.employeeCode;
      employeeDatasheet.getCell(`B${index + 2}`).value = data.displayName;
      employeeDatasheet.getCell(`C${index + 2}`).value = data.userNumber;
      employeeDatasheet.getCell(`D${index + 2}`).value = data.biometricCode;
      employeeDatasheet.getCell(`E${index + 2}`).value = data.biometricSerialNo;
      employeeDatasheet.getCell(`F${index + 2}`).value = data.branch;
      employeeDatasheet.getCell(`G${index + 2}`).value = data.department;
      employeeDatasheet.getCell(`H${index + 2}`).value = data.designation;
    });
    const punchType = ['PUNCH-IN', 'PUNCH-OUT'];
    punchType.forEach((day, index) => {
      dayTypesheet.getCell(`A${index + 2}`).value = day;
    });
    // Hide the Cities worksheet to keep it clean
    // employeeDatasheet.state = 'hidden';
    nationalityNamessheet.state = 'hidden';
    dayTypesheet.state = 'hidden';
    for (let i = 0; i < 10000; i++) {
      workSheet.addRow([null, null, null, null, null, null]);
    }

    workSheet
      .getColumn(4)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`DayType!$A$2:$A$${punchType.length + 1}`],
          };
        }
      });
    workSheet
      .getColumn(2)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `NationalityName!$A$2:$A$${nationalityNames.length + 1}`,
            ],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const generateExcel_SlotWise_Attendance_Report = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = Object.keys(data[0]);

    workSheet.addRow(headerNames);

    const attnData = [
      'slot1_In',
      'slot1_Out',
      'slot1_LateBy(Minutes)',
      'slot1_EarlyBy(Minutes)',
      'slot2_In',
      'slot2_Out',
      'slot2_LateBy(Minutes)',
      'slot2_EarlyBy(Minutes)',
    ];

    let cell = 1;
    data.forEach((e) => {
      const baicData = [
        e['Employee Code'],
        e['Employee Name'],
        e['Employee Number'],
        e['Branch'],
        e['Department'],
        e['Designation'],
      ];

      attnData.map((a) => {
        const toAddattnData = [];

        for (const date in e) {
          if (
            date != 'Employee Code' &&
            date != 'Employee Name' &&
            date != 'Employee Number' &&
            date != 'Branch' &&
            date != 'Department' &&
            date != 'Designation' &&
            date != 'Date'
          ) {
            toAddattnData.push(e[date][a]);
          }
        }

        const row = workSheet.addRow([...baicData, ...[a], ...toAddattnData]);

        // Set light green color for column 7
        row.getCell(7).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'C6EFCE' }, // Light green color
        };

        // Set light red color for lateBy and earlyBy cells
        toAddattnData.forEach((value, index) => {
          const columnIndex = 8 + index; // Columns start after the basic data and 'a'
          if (
            +value > 0 &&
            [
              'slot1_LateBy(Minutes)',
              'slot1_EarlyBy(Minutes)',
              'slot2_LateBy(Minutes)',
              'slot2_EarlyBy(Minutes)',
            ].includes(a)
          ) {
            row.getCell(columnIndex).fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF0000' }, // Light red color
            };
          }
        });

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          };
        });
      });

      workSheet.mergeCells(cell + 1, 1, cell + 8, 1);
      workSheet.mergeCells(cell + 1, 2, cell + 8, 2);
      workSheet.mergeCells(cell + 1, 3, cell + 8, 3);
      workSheet.mergeCells(cell + 1, 4, cell + 8, 4);
      workSheet.mergeCells(cell + 1, 5, cell + 8, 5);
      workSheet.mergeCells(cell + 1, 6, cell + 8, 6);

      cell += 8;
    });

    formatFirstRow(workSheet, 1);

    workSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 0) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber != 7) {
            alignmentmiddle(workSheet, rowNumber);
          }
          // Apply border to each cell
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          };
        });
      }
    });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateAuthorozationExcelWithUserData = async (
  data,
  AuthCriteria,
  authorizationMasterID,
  companyWiseUserData,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Authorization Data');
  const workSheet1 = workBook.addWorksheet('AuthorizationCriteria');
  let count = 0;
  const companyNameArray = [];
  for (let comp of companyWiseUserData) {
    count++;
    const companyNameLength = comp.companyName.length;

    let sheetName = comp.companyName;

    if (companyNameLength > 30) {
      sheetName = `${comp.companyName.slice(0, 25)}-${count}`;
    } else {
      const duplicateCompanyName = companyNameArray.find(
        (s) =>
          typeof s === 'string' &&
          s.toLowerCase() === comp.companyName.toLowerCase()
      );

      if (duplicateCompanyName) {
        sheetName = `${comp.companyName.slice(0, 25)}-${count}`;
      }
    }

    companyNameArray.push(comp.companyName);
    const employeeDatasheet = workBook.addWorksheet(sheetName);
    // Row 1 - Merge A1 to G1 for Company Name
    employeeDatasheet.mergeCells('A1:G1');
    employeeDatasheet.getCell('A1').value =
      `Company Name - ${comp.companyName}`; // dynamic company name
    employeeDatasheet.getCell('A1').alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    employeeDatasheet.getCell('A1').font = { bold: true, size: 14 }; // Optional styling
    employeeDatasheet.addRow([
      'Company Name',
      'Branch',
      'Department',
      'Designation',
      'Employee Code',
      'Employee Name',
      'Employee Number',
    ]);
    setColorInBackground(employeeDatasheet, 1, '729fcf');
    setColorInBackground(employeeDatasheet, 2, '729fcf');
    comp.employeeData.forEach((data, index) => {
      const rowIndex = index + 3; // Start from Row 3

      employeeDatasheet.getCell(`A${rowIndex}`).value = data.company;
      employeeDatasheet.getCell(`B${rowIndex}`).value = data.branch;
      employeeDatasheet.getCell(`C${rowIndex}`).value = data.department;
      employeeDatasheet.getCell(`D${rowIndex}`).value = data.designation;
      employeeDatasheet.getCell(`E${rowIndex}`).value = data.employeeCode
        ? data.employeeCode
        : '';
      employeeDatasheet.getCell(`F${rowIndex}`).value = data.displayName;
      employeeDatasheet.getCell(`G${rowIndex}`).value = data.userNumber;

      // Apply border to all cells of current row
      employeeDatasheet.getRow(rowIndex).eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
  }
  // worksheeet
  const header = Object.keys(data[0]);

  workSheet.addRow(header);

  formatFirstRow(workSheet, 1);

  const data1 = data.map((row) => Object.values(row));

  data1.map((e) => workSheet.addRow(e));

  //worksheet1--branch

  workSheet1.addRow(['Auth Criteria']);

  formatFirstRow(workSheet1, 1);

  const data2 = AuthCriteria.map((row) => [row.AuthorizationCriteria]);

  data2.map((e) => workSheet1.addRow(e));
  // Hide the ExpenseHead worksheet to keep it clean
  workSheet1.state = 'hidden';

  if (authorizationMasterID == 0) {
    //Expense
    workSheet
      .getColumn(8)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Leave
    workSheet
      .getColumn(11)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Overtime
    workSheet
      .getColumn(14)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Resignation
    workSheet
      .getColumn(17)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Gatepass
    workSheet
      .getColumn(20)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
    //Compensatory Off
    workSheet
      .getColumn(23)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });

    //Attendance Correction
    workSheet
      .getColumn(26)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
  } else {
    //One only
    workSheet
      .getColumn(8)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [
              `AuthorizationCriteria!$A$2:$A$${AuthCriteria.length + 1}`,
            ],
          };
        }
      });
  }

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForVisitReport = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Visit');
    const columns = Object.keys(flattenObj(data[0])).map((key) => ({
      header: key,
      key,
      width: 15,
    }));

    workSheet.columns = columns;
    data.map((item, index) => {
      const flatItem = flattenObj(item);
      Object.keys(flatItem).forEach((key) => {
        const value = flatItem[key];
        if (typeof value === 'string') {
          // Process custom markers
          flatItem[key] = value
            .replace(/ visitreportSeperate,/g, '\n')
            .replace(/ visitreportSeperate/g, ' ');
        }
      });

      // Write row data
      const row = workSheet.getRow(index + 2);
      row.values = flatItem;
      row.alignment = { wrapText: true };
    });

    // Format the first row (header)
    formatFirstRow(workSheet, 1);

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForIncrementReport = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Employee Code',
      'Employee Name',
      'Number',
      'Branch',
      'Department',
      'Designation',
      'Joining Date',
    ];
    data.map((x) => {
      const headerRows = workSheet.addRow(headerNames);
      headerRows.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: '87CEEB',
          }, // blue background
        };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        cell.font = {
          bold: true, // Make text bold for better readability
        };

        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });
      workSheet.addRow([
        x.employeeCode,
        x.displayName,
        x.userNumber,
        x.branch,
        x.department,
        x.designation,
        moment(x.joiningDate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
      ]);

      workSheet.getColumn(1).width = 20;
      workSheet.getColumn(2).width = 20;
      workSheet.getColumn(3).width = 20;
      workSheet.getColumn(4).width = 20;
      workSheet.getColumn(5).width = 20;
      workSheet.getColumn(6).width = 15;
      workSheet.getColumn(7).width = 15;

      x.salaryData.map((data) => {
        workSheet.addRow(['']);
        const monthRow = workSheet.addRow([
          'Applicable Month : ',
          data.salaryFromYYYYMM,
          '',
          'Based on calculation',
          data.baseOnCalculation == 'M'
            ? 'Monthly'
            : data.baseOnCalculation == 'D'
              ? 'Daily'
              : 'Hourly',
        ]);

        monthRow?.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'ADD8E6' },
          };

          cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
        });

        const rowData = [];
        const rowDataValues = [];
        data.achildData.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        rowData.push(
          data?.grossData?.payheadDisplayName
            ? data?.grossData?.payheadDisplayName
            : data?.grossData?.payheadName
        );

        data.bchildData.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        data.extra_achild.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        rowData.push(
          data?.netPayData?.payheadDisplayName
            ? data?.netPayData?.payheadDisplayName
            : data?.netPayData?.payheadName
        );
        data.cchildData.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });

        rowData.push(
          data?.ctcData?.payheadDisplayName
            ? data?.ctcData?.payheadDisplayName
            : data?.ctcData?.payheadName
        );

        data.achildData.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        rowDataValues.push(data?.grossData?.EmployeeSalaryAmount);

        data.bchildData.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        data.extra_achild.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        rowDataValues.push(data?.netPayData?.EmployeeSalaryAmount);

        data.cchildData.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });

        rowDataValues.push(data?.ctcData?.EmployeeSalaryAmount);

        const dataRow = workSheet.addRow(rowData);
        dataRow?.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D3D3D3' }, // Light Grey background
          };

          cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
        });
        const dataRowValue = workSheet.addRow(rowDataValues);
        dataRowValue?.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
      workSheet.addRow(['']);
      workSheet.addRow(['']);
      workSheet.addRow(['']);
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForAssignBiometricCodeToUser = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');

  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Employee Code',
      'Biometric Code',
      'Biometric Serial Number',
      'Employee Name',
      'Number',
      'Branch',
      'Department',
      'Designation',
      'Joining Date',
    ];

    const headerRow = workSheet.addRow(headerNames);
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true,
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    data.map((x) => {
      workSheet.addRow([
        x.employeeCode,
        x.biometricCode,
        x.biometricSerialNo,
        x.userMaster.displayName,
        x.userMaster.userNumber,
        x.userMaster?.employeeBranches[0]?.branchMaster?.branchName,
        x.userMaster?.employeeDepartments[0]?.department?.departmentName,
        x.userMaster?.employeeDesignations[0]?.designation?.designationName,
        moment(x.joiningDate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
      ]);
    });
    workSheet.getColumn(1).width = 20;
    workSheet.getColumn(2).width = 20;
    workSheet.getColumn(3).width = 20;
    workSheet.getColumn(4).width = 15;
    workSheet.getColumn(5).width = 20;
    workSheet.getColumn(6).width = 15;
    workSheet.getColumn(7).width = 20;
    workSheet.getColumn(8).width = 20;

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForExtraDays = async (data, fileName, fileType, res) => {
  if (!data.length) throw new Error('No data found to generate the file!');

  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Employee Code',
      'User Name',
      'Number',
      'Branch',
      'Department',
      'Designation',
      'Days',
      'Date',
      'Remarks',
      'Cancel Remarks',
      'Status',
      'Auth Criteria',
      'Authorization',
      'Created By',
    ];

    const headerRow = workSheet.addRow(headerNames);
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true,
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    data.map((x) => {
      const row = workSheet.addRow([
        x.employeeCode,
        x.displayName,
        x.userNumber,
        x.branchName,
        x.departmentName,
        x.designationName,
        x.days,
        x.date,
        x.remarks ? x.remarks : '',
        x.cancelRemarks ? x.cancelRemarks : '',
        x.status,
        x.AuthorizationCriteria,
        x.Authorization,
        x.createBy,
      ]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    workSheet.getColumn(1).width = 20;
    workSheet.getColumn(2).width = 20;
    workSheet.getColumn(3).width = 20;
    workSheet.getColumn(4).width = 15;
    workSheet.getColumn(5).width = 20;
    workSheet.getColumn(6).width = 15;
    workSheet.getColumn(7).width = 20;
    workSheet.getColumn(8).width = 20;
    workSheet.getColumn(9).width = 20;
    workSheet.getColumn(10).width = 20;
    workSheet.getColumn(11).width = 20;
    workSheet.getColumn(12).width = 20;
    workSheet.getColumn(13).width = 30;
    workSheet.getColumn(14).width = 30;

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

function setBorder(row) {
  row.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
}

const generateExcelOTReportWithESIC = async (data, fileName, fileType, res) => {
  const {
    companyName,
    month,
    finalData,
    sum1,
    total1,
    total2,
    totalSalaryDue,
    totalEmpESI,
    totalNetsalary,
    totalEmployerESI,
  } = data;

  if (!finalData.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');

    workSheet.addRow([companyName]);

    workSheet.getRow(1).font = {
      bold: true,
      size: 12,
      // color: { argb: "FFFFFF" },
    };

    workSheet.mergeCells(1, 1, 1, 9);

    workSheet.getRow(1).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    workSheet.addRow([`OT SHEET FOR THE MONTH OF ${month}`]);

    workSheet.getRow(2).font = {
      bold: true,
      size: 12,
      // color: { argb: "FFFFFF" },
    };

    workSheet.getRow(2).alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    workSheet.mergeCells(2, 1, 2, 9);

    workSheet.addRow(['']);

    const header = Object.keys(finalData[0]);

    workSheet.addRow(header);

    workSheet.getRow(4).font = {
      bold: true,
    };

    const values = finalData.map((row) => Object.values(row));

    values.map((e, i) => {
      const dataRow = workSheet.addRow(e);

      setBorder(dataRow);

      if (i == values.length - 1) {
        dataRow.eachCell((cell) => {
          cell.font = {
            bold: true,
            // color: { argb: "FFFFFF" },
          };
        });
      }
    });

    workSheet.mergeCells(finalData.length + 4, 1, finalData.length + 4, 5);

    workSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      if (rowNumber > 0) {
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          alignmentmiddle(workSheet, rowNumber);

          // Apply border to each cell
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          };
        });
      }
    });

    workSheet.addRow(['']);
    workSheet.addRow(['']);
    workSheet.addRow(['']);

    const row1 = workSheet.addRow([
      'CALCULATION OF AMOUNT PAYABLE FOR E.S.I.C AMOUNT (TOTAL)',
    ]);

    row1.eachCell((cell) => {
      cell.font = {
        bold: true,
      };
    });

    workSheet.mergeCells(row1.number, 1, row1.number, 3);

    workSheet.addRow(['CONTRIBUTION OF EMPLOYEES (0.75%)', `${totalEmpESI}`]);
    workSheet.addRow([
      'CONTRIBUTION OF EMPLOYERS (3.25%)',
      `${totalEmployerESI}`,
    ]);
    const totalrow = workSheet.addRow([
      'TOTAL',
      `${totalEmpESI + totalEmployerESI}`,
    ]);

    totalrow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };
    });

    workSheet.addRow(['']);
    workSheet.addRow(['']);

    const row = workSheet.addRow([`Journal Entry of OT Exp. For ${month}`]);
    workSheet.mergeCells(row.number, 1, row.number, 3);

    row.eachCell((cell) => {
      cell.font = {
        bold: true,
      };
    });

    alignmentmiddle(workSheet, row.number);

    const row2 = workSheet.addRow(['Salary Exp. A/c DR', `${totalSalaryDue}`]);
    setBorder(row2);
    const row3 = workSheet.addRow(['ESI Exp. A/c DR', `${totalEmployerESI}`]);
    setBorder(row3);
    const row4 = workSheet.addRow([
      'To Salary Payable',
      '',
      `${totalNetsalary}`,
    ]);
    setBorder(row4);
    const row5 = workSheet.addRow([
      'To ESI Payable',
      '',
      `${totalEmpESI + totalEmployerESI}`,
    ]);
    setBorder(row5);
    const finalrow = workSheet.addRow([
      'TOTAL',
      `${totalSalaryDue + totalEmployerESI}`,
      `${totalNetsalary + totalEmpESI + totalEmployerESI}`,
    ]);
    setBorder(finalrow);
    finalrow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };
    });

    workSheet.addRow(['']);
    workSheet.addRow(['']);
    workSheet.addRow(['']);
    workSheet.addRow(['']);

    const lastrow = workSheet.addRow([
      'PREPARED BY',
      '',
      '',
      '',
      'CHECKED BY',
      '',
      '',
      '',
      'PASSED BY',
    ]);
    lastrow.eachCell((cell) => {
      cell.font = {
        bold: true,
      };
    });

    workSheet.mergeCells(lastrow.number, 1, lastrow.number, 4);
    workSheet.mergeCells(lastrow.number, 5, lastrow.number, 8);
    workSheet.mergeCells(lastrow.number, 9, lastrow.number, 9);

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForEmploeeMonthWiseSalary = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Employee Code',
      'Employee Name',
      'Number',
      'Branch',
      'Department',
      'Designation',
      'Joining Date',
    ];
    data?.map((x) => {
      const headerRows = workSheet.addRow(headerNames);
      headerRows.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'aaaaaa',
          },
        };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        cell.font = {
          bold: true, // Make text bold for better readability
        };

        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });
      workSheet.addRow([
        x.employeeCode,
        x.displayName,
        x.userNumber,
        x.branch,
        x.department,
        x.designation,
        moment(x.joiningDate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
      ]);

      workSheet.getColumn(1).width = 20;
      workSheet.getColumn(2).width = 20;
      workSheet.getColumn(3).width = 20;
      workSheet.getColumn(4).width = 20;
      workSheet.getColumn(5).width = 20;
      workSheet.getColumn(6).width = 15;
      workSheet.getColumn(7).width = 15;
      workSheet.getColumn(8).width = 15;
      workSheet.getColumn(9).width = 15;
      workSheet.getColumn(10).width = 15;
      workSheet.getColumn(11).width = 15;
      workSheet.getColumn(12).width = 15;

      x.salaryData?.map((data) => {
        workSheet.addRow(['']);
        const monthRow = workSheet.addRow([
          'Applicable Month : ',
          data.salaryFromYYYYMM,
          '',
          'Salary Scale',
          data.salaryScale.EmployeeSalaryAmount,
          '',
          'Days',
          data.days,
        ]);

        monthRow?.eachCell((cell) => {
          cell.font = {
            bold: true,
          };

          cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
        });

        const rowData = [];
        const rowDataValues = [];
        data.achildData?.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        rowData.push(
          data?.grossData?.payheadDisplayName
            ? data?.grossData?.payheadDisplayName
            : data?.grossData?.payheadName
        );

        data.bchildData?.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        data.extra_achild?.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });
        rowData.push(
          data?.netPayData?.payheadDisplayName
            ? data?.netPayData?.payheadDisplayName
            : data?.netPayData?.payheadName
        );
        data.cchildData?.map((child) => {
          rowData.push(
            child.payheadDisplayName
              ? child.payheadDisplayName
              : child.payheadName
          );
        });

        rowData.push(
          data?.ctcData?.payheadDisplayName
            ? data?.ctcData?.payheadDisplayName
            : data?.ctcData?.payheadName
        );

        data.achildData?.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        rowDataValues.push(data?.grossData?.EmployeeSalaryAmount);

        data.bchildData?.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        data.extra_achild?.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });
        rowDataValues.push(data?.netPayData?.EmployeeSalaryAmount);

        data.cchildData?.map((child) => {
          rowDataValues.push(child.EmployeeSalaryAmount);
        });

        rowDataValues.push(data?.ctcData?.EmployeeSalaryAmount);

        const dataRow = workSheet.addRow(rowData);
        dataRow?.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          if (cell.value == 'GROSS' || cell.value == 'NET SALARY')
            cell.font = {
              bold: true,
            };

          cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
        });
        const dataRowValue = workSheet.addRow(rowDataValues);
        dataRowValue?.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
      workSheet.addRow(['']);
      workSheet.addRow(['']);

      const totalDataKeys = [];
      const totalDataValues = [];

      x.total?.achildSum.map((a) => {
        totalDataKeys.push(
          a?.payheadDisplayName ? a?.payheadDisplayName : a?.payheadName
        );
      });

      totalDataKeys.push(
        x.total?.grossSum?.payheadDisplayName
          ? x.total?.grossSum?.payheadDisplayName
          : x.total?.grossSum?.payheadName
      );

      x.total?.bchildSum.map((a) => {
        totalDataKeys.push(
          a?.payheadDisplayName ? a?.payheadDisplayName : a?.payheadName
        );
      });

      x.total?.extraAChildSum.map((a) => {
        totalDataKeys.push(
          a?.payheadDisplayName ? a?.payheadDisplayName : a?.payheadName
        );
      });

      totalDataKeys.push(
        x.total?.netPaySum?.payheadDisplayName
          ? x.total?.netPaySum?.payheadDisplayName
          : x.total?.netPaySum?.payheadName
      );

      x.total?.achildSum.map((a) => {
        totalDataValues.push(a?.EmployeeSalaryAmount);
      });
      totalDataValues.push(x.total?.grossSum?.EmployeeSalaryAmount);
      x.total?.bchildSum.map((a) => {
        totalDataValues.push(a?.EmployeeSalaryAmount);
      });
      x.total?.extraAChildSum.map((a) => {
        totalDataValues.push(a?.EmployeeSalaryAmount);
      });
      totalDataValues.push(x.total?.netPaySum?.EmployeeSalaryAmount);

      if (x.salaryData.length > 0) {
        const boldRow = workSheet.addRow(['Total Salary : ']);

        boldRow.eachCell((cell) => {
          cell.font = {
            bold: true,
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });
      }

      const totalRow = workSheet.addRow(totalDataKeys);
      totalRow?.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (cell.value == 'GROSS' || cell.value == 'NET SALARY')
          cell.font = {
            bold: true,
          };
        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });

      const totalRowValues = workSheet.addRow(totalDataValues);
      totalRowValues.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      workSheet.addRow(['']);
      workSheet.addRow(['']);
      workSheet.addRow(['']);
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generatePdfForEmploeeMonthWiseSalary = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const getTemplate1 = (type) => {
      const file = path.join(__dirname, `../html/${type}.html`);
      return file;
    };

    const filePath = await getTemplate1('employeeWiseSalaryReport');

    const readFile = (name) => {
      return new Promise((resolve, reject) => {
        fs.readFile(name, 'utf-8', (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    };

    const file = await readFile(filePath);
    const template = Handlebars.compile(file);
    const html = template({ data: data });

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage();

    // Set the HTML content of the page
    await page.setContent(html);

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4', // Page format (A4 in this case)
      printBackground: true, // print background
      margin: { top: '10px', bottom: '10px', left: '10px', right: '10px' },
      landscape: true, // Set PDF to landscape mode
    });
    await browser.close();

    let base64path = Buffer.from(pdfBuffer).toString('base64');

    return res.status(200).json({
      status: 200,
      data: base64path,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const genrateDemoExcelForDesinationWiseDocument = async (
  designationDocData,
  fileName,
  fileType,
  res
) => {
  try {
    // if (!data.length) throw new Error('No data found to generate the file!');

    const workBook = new Excel.Workbook();

    const companyDesignationDataSheet = workBook.addWorksheet('Document');
    const usertypeSheet = workBook.addWorksheet('UserType');
    const userTypes = ['National', 'Expat', 'Both'];
    userTypes.forEach((leave, index) => {
      usertypeSheet.getCell(`A${index + 2}`).value = leave;
    });
    usertypeSheet.state = 'hidden';
    const dayTypesheet = workBook.addWorksheet('DayType');
    const dayType = ['Y', 'N'];
    dayType.forEach((day, index) => {
      dayTypesheet.getCell(`A${index + 2}`).value = day;
    });
    dayTypesheet.state = 'hidden';
    companyDesignationDataSheet.addRow([
      'Designation',
      'Document',
      'Is Needed',
      'Is Required',
      'Required User Type',
    ]);
    const RequiredColumnStyle = [
      { index: 3, color: 'FFFF6666' },
      { index: 4, color: 'FFFF6666' },
      { index: 5, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      companyDesignationDataSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });
    const notRequiredColumnStyle = [
      { index: 1, color: '729fcf' },
      { index: 2, color: '729fcf' },
    ];
    // Apply the styles to each specified column
    notRequiredColumnStyle.forEach((column) => {
      companyDesignationDataSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });
    for (let i = 0; i <= designationDocData.length; i++) {
      companyDesignationDataSheet.addRow([null, null, null, null, null, null]);
    }
    companyDesignationDataSheet
      .getColumn(3)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`DayType!$A$1:$A$${dayType.length + 1}`],
          };
        }
      });
    companyDesignationDataSheet
      .getColumn(4)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`DayType!$A$1:$A$${dayType.length + 1}`],
          };
        }
      });
    companyDesignationDataSheet
      .getColumn(5)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`UserType!$A$1:$A$${userTypes.length + 1}`],
          };
        }
      });

    designationDocData.forEach((data, index) => {
      companyDesignationDataSheet.getCell(`A${index + 2}`).value =
        data.designationName;
      companyDesignationDataSheet.getCell(`B${index + 2}`).value =
        data.documentName;
      companyDesignationDataSheet.getCell(`C${index + 2}`).value =
        data.isNeeded;
      companyDesignationDataSheet.getCell(`D${index + 2}`).value =
        data.isRequired;
      companyDesignationDataSheet.getCell(`E ${index + 2}`).value =
        data.requiredUserType;
    });
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};

const generateDemoExcelForPaySlipGenerator = async (
  employeeTaxableHeader,
  employeeNonTaxableHeader,
  employeeContributionHeader,
  employerContributionHeader,
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Pay Slip Data');

  const temp1 = Array.from(
    { length: (employeeTaxableHeader.length - 1) * 3 },
    () => ''
  );

  const temp2 = Array.from(
    { length: (employeeNonTaxableHeader.length - 1) * 2 },
    () => ''
  );

  const temp3 = Array.from(
    { length: (employeeContributionHeader.length - 1) * 2 },
    () => ''
  );

  const temp4 = Array.from(
    { length: (employerContributionHeader.length - 1) * 2 },
    () => ''
  );

  workSheet.addRow([
    ...['', '', '', '', '', '', '', '', 'Taxable Earnings', '', ''],
    ...temp1,
    ...['Non-Taxable Earnings', ''],
    ...temp2,
    ...['', 'Deductions', ''],
    ...temp3,
    ...['', 'Employer Contributions', ''],
    ...temp4,
  ]);

  workSheet.mergeCells(1, 9, 1, 8 + employeeTaxableHeader.length * 3);

  if (+employeeTaxableHeader.length > 0 && employeeNonTaxableHeader.length) {
    workSheet.mergeCells(
      1,
      9 + employeeTaxableHeader.length * 3,
      1,
      8 + employeeTaxableHeader.length * 3 + employeeNonTaxableHeader.length * 2
    );
  }

  if (
    employeeTaxableHeader.length > 0 &&
    employeeNonTaxableHeader.length > 0 &&
    employeeContributionHeader.length
  ) {
    workSheet.mergeCells(
      1,
      9 +
        employeeTaxableHeader.length * 3 +
        employeeNonTaxableHeader.length * 2 +
        1,
      1,
      8 +
        employeeTaxableHeader.length * 3 +
        employeeNonTaxableHeader.length * 2 +
        1 +
        employeeContributionHeader.length * 2
    );
  }

  if (
    employeeTaxableHeader.length > 0 &&
    employeeNonTaxableHeader.length > 0 &&
    employeeContributionHeader.length > 0 &&
    employerContributionHeader.length > 0
  ) {
    workSheet.mergeCells(
      1,
      9 +
        employeeTaxableHeader.length * 3 +
        employeeNonTaxableHeader.length * 2 +
        1 +
        employeeContributionHeader.length * 2 +
        1,
      1,
      8 +
        employeeTaxableHeader.length * 3 +
        employeeNonTaxableHeader.length * 2 +
        1 +
        employeeContributionHeader.length * 2 +
        1 +
        employerContributionHeader.length * 2
    );
  }

  workSheet.getRow(1).eachCell((cell) => {
    cell.font = { size: 12, bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  workSheet.getRow(1).height = 20;

  const taxableData = (employeeTaxableHeader || []).flatMap((item) => [
    item,
    '',
    '',
  ]);
  const nontaxableData = (employeeNonTaxableHeader || []).flatMap((item) => [
    item,
    '',
  ]);
  const emp_deductionData = (employeeContributionHeader || []).flatMap(
    (item) => [item, '']
  );
  const employer_deductionData = (employerContributionHeader || []).flatMap(
    (item) => [item, '']
  );

  const header = Object.keys(data[0]);

  const header1 = header.slice(0, 8);

  const headerRow = workSheet.addRow([
    ...header1,
    ...taxableData,
    ...nontaxableData,
    ...['GROSS'],
    ...emp_deductionData,
    ...['NET SALARY'],
    ...employer_deductionData,
  ]);

  if (taxableData.length) {
    let left = 9;
    for (let i = 0; i < taxableData.length; i += 3) {
      workSheet.mergeCells(2, left, 2, left + 2);
      left += 3;
    }
  }

  if (nontaxableData.length) {
    let left = 9 + taxableData.length;
    for (let i = 0; i < nontaxableData.length; i += 2) {
      workSheet.mergeCells(2, left, 2, left + 1);
      left += 2;
    }
  }

  if (emp_deductionData.length) {
    let left = 9 + taxableData.length + nontaxableData.length + 1;
    for (let i = 0; i < emp_deductionData.length; i += 2) {
      workSheet.mergeCells(2, left, 2, left + 1);
      left += 2;
    }
  }

  if (employer_deductionData.length) {
    let left =
      9 +
      taxableData.length +
      nontaxableData.length +
      1 +
      emp_deductionData.length +
      1;
    for (let i = 0; i < employer_deductionData.length; i += 2) {
      workSheet.mergeCells(2, left, 2, left + 1);
      left += 2;
    }
  }

  const taxableHeaderData = employeeTaxableHeader.flatMap((key) =>
    ['Amount', 'WorkingHrs', 'YTD'].map((suffix) => `${suffix}`)
  );

  const NontaxableHeaderData = employeeNonTaxableHeader.flatMap((key) =>
    ['Amount', 'YTD'].map((suffix) => `${suffix}`)
  );

  const emp_contri_HeaderData = employeeContributionHeader.flatMap((key) =>
    ['Amount', 'YTD'].map((suffix) => `${suffix}`)
  );

  const employer_contri_HeaderData = employerContributionHeader.flatMap((key) =>
    ['Amount', 'YTD'].map((suffix) => `${suffix}`)
  );

  const headerRow1 = workSheet.addRow([
    ...['', '', '', '', '', '', '', ''],
    ...taxableHeaderData,
    ...NontaxableHeaderData,
    ...[''],
    ...emp_contri_HeaderData,
    ...[''],
    ...employer_contri_HeaderData,
  ]);

  workSheet.mergeCells(2, 1, 3, 1);
  workSheet.mergeCells(2, 2, 3, 2);
  workSheet.mergeCells(2, 3, 3, 3);
  workSheet.mergeCells(2, 4, 3, 4);
  workSheet.mergeCells(2, 5, 3, 5);
  workSheet.mergeCells(2, 6, 3, 6);
  workSheet.mergeCells(2, 7, 3, 7);
  workSheet.mergeCells(2, 8, 3, 8);

  // Set light blue color for cells 1 to 5
  setCellColor(headerRow, 1, 8, 'ADD8E6'); // Light Blue

  // Set light green color for cells 6 to incentiveHeader.length
  setCellColor(headerRow, 9, 8 + taxableData.length, '90EE90'); // Light Green

  // Set red color for penaltyHeader
  setCellColor(
    headerRow,
    9 + taxableData.length,
    8 + taxableData.length + nontaxableData.length,
    '90EE90'
  );
  // light yellow FFFFE0

  setCellColor(
    headerRow,
    9 + taxableData.length + nontaxableData.length + 1,
    8 +
      taxableData.length +
      nontaxableData.length +
      1 +
      emp_deductionData.length,
    'e6b8b7'
  );

  setCellColor(
    headerRow,
    9 +
      taxableData.length +
      nontaxableData.length +
      1 +
      emp_deductionData.length +
      1,
    8 +
      taxableData.length +
      nontaxableData.length +
      1 +
      emp_deductionData.length +
      1 +
      employer_deductionData.length,
    'e6b8b7'
  );

  // // Set red color for penaltyHeader

  // setCellColor(
  //   headerRow,
  //   6 +
  //   employeeEarningHeader.length +
  //   1 +
  //   employeeContributionHeader.length +
  //   1 +
  //   employerContributionHeader.length,
  //   5 +
  //   employeeEarningHeader.length +
  //   1 +
  //   employeeContributionHeader.length +
  //   1 +
  //   employerContributionHeader.length +
  //   otherDeductionHeader.length,
  //   'e6b8b7'
  // );

  // Set light green color for cells 6 to incentiveHeader.length
  setCellColor(headerRow1, 9, 8 + taxableData.length, '90EE90'); // Light Green

  // Set red color for penaltyHeader
  setCellColor(
    headerRow1,
    9 + taxableData.length,
    8 + taxableData.length + nontaxableData.length,
    '90EE90'
  );
  // light yellow FFFFE0

  setCellColor(
    headerRow1,
    9 + taxableData.length + nontaxableData.length + 1,
    8 +
      taxableData.length +
      nontaxableData.length +
      1 +
      emp_deductionData.length,
    'e6b8b7'
  );

  const data1 = data.map((row) => Object.values(row));

  data1.map((e) => workSheet.addRow(e));

  workSheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (rowNumber > 0) {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber > 6) {
          alignmentmiddle(workSheet, rowNumber);
        }
        // Apply border to each cell
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
      });
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generatePaySlipExcel = async (data, fileName, fileType, res) => {
  try {
    const setBorder = (row) => {
      row?.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (cell.value == 'GROSS' || cell.value == 'NET SALARY')
          cell.font = {
            bold: true,
          };

        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });
    };

    if (!data.length) throw new Error('No data found to generate the file!');
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Pay Slip Data');

    const headerNames = [
      'Employee Code',
      'Employee Name',
      'Number',
      'Branch',
      'Department',
      'Designation',
    ];
    data?.map((x) => {
      const headerRows = workSheet.addRow(headerNames);
      headerRows.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb: 'aaaaaa',
          },
        };

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        cell.font = {
          bold: true, // Make text bold for better readability
        };

        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });
      workSheet.addRow([
        x.employeeCode,
        x.displayName,
        x.userNumber,
        x.branch,
        x.department,
        x.designation,
      ]);

      workSheet.addRow(['']);

      let rowData = ['From Date :', x.startDate, '', 'To Date:', x.endDate];

      if (x.month) {
        rowData = ['Month :', x.month];
      }

      const monthRow = workSheet.addRow([
        ...['Payroll Frequency : ', x.payrollFrequency, ''],
        ...rowData,
      ]);

      monthRow?.eachCell((cell) => {
        cell.font = {
          bold: true,
        };

        cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
      });

      const payheadData = [
        ...[''],
        ...x.earning_paySlipData.map((e) => e.hrSalaryField?.PHM?.payheadName),
        ...['GROSS'],
        ...x.deduction_paySlipData.map(
          (e) => e.hrSalaryField?.PHM?.payheadName
        ),
        ...['NET SALARY'],
      ];

      const payheadRow = workSheet.addRow(payheadData);

      setBorder(payheadRow);

      workSheet.columns.forEach((column) => {
        column.width = 15;
      });

      const ActualWorkingHrs = [
        ...['Actual WorkingHrs'],
        ...x.earning_paySlipData.map((e) => e.actualWorkingHrs || '-'),
        ...['-'],
        ...x.deduction_paySlipData.map((e) => '-'),
        ...['-'],
      ];

      const hrsRow = workSheet.addRow(ActualWorkingHrs);

      setBorder(hrsRow);

      const amount = [
        ...['Amount'],
        ...x.earning_paySlipData.map((e) => e.amount || '-'),
        ...[x.gross],
        ...x.deduction_paySlipData.map((e) => e.amount || '-'),
        ...[x.netPay],
      ];

      const amountRow = workSheet.addRow(amount);

      setBorder(amountRow);

      const YTD = [
        ...['YTD'],
        ...x.earning_paySlipData.map((e) => e.YTD || '-'),
        ...['-'],
        ...x.deduction_paySlipData.map((e) => e.YTD || '-'),
        ...['-'],
      ];

      const YTDRow = workSheet.addRow(YTD);

      setBorder(YTDRow);

      workSheet.addRow(['']);
      workSheet.addRow(['']);
      workSheet.addRow(['']);
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

function readFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

async function createZipFileForProfilePics(finalArray, res) {
  const fileName = 'profilePics';
  const zip = new JSZip();

  for (let i = 0; i < finalArray.length; i++) {
    const filePath = path.join(
      __dirname,
      '../uploads/user/photo',
      finalArray[i]?.photo
    );
    let extension = filePath?.split('.').pop();
    if (extension == 'bin') {
      extension = 'jpeg';
    }
    try {
      const imageBytes = await readFileAsync(filePath);
      const employeeCode = finalArray[i].employeeJoiningDetails[0].employeeCode
        ? `[${finalArray[i].employeeJoiningDetails[0].employeeCode}]`
        : '';
      const fileName = `${i + 1} ${finalArray[i].displayName} ${employeeCode}.${extension}`;

      zip.file(fileName, imageBytes);
    } catch (err) {}
  }

  const zipbuffer = await zip.generateAsync({ type: 'nodebuffer' });
  res.writeHead(200, {
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename=${fileName}.zip`,
  });
  res.end(zipbuffer);
}

const generateExcelForAttendanceCorrectionReport = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Employee Code',
      'Employee Name',
      'Branch',
      'Department',
      'Designation',
      'Division',
      'Attendance Date',
      'Auth Criteria',
      'Status',
      'Remarks',
      'Attendance Status',
      'Log Time',
      'Authorizations',
      'Create By',
      'Update By',
      'Created At',
      'Updated At',
    ];
    const headerRows = workSheet.addRow(headerNames);
    headerRows.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true, // Make text bold for better readability
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
    });
    data.map((x) => {
      workSheet.addRow([
        x.employeeCode,
        x.displayName,
        x.Branch,
        x.Department,
        x.Designation,
        x.Division,
        x.AttendanceDate,
        x.authCriteria,
        x.authorizationStatus,
        x.remark,
        x.attendanceStatus,
        Array.isArray(x.logTime) ? x?.logTime.join(',') : '',
        Array.isArray(x.authorizations) ? x?.authorizations.join(',') : '',
        x.createBy,
        x.updateBy,
        x.createdAt,
        x.updatedAt,
      ]);

      workSheet.getColumn(1).width = 20;
      workSheet.getColumn(2).width = 20;
      workSheet.getColumn(3).width = 20;
      workSheet.getColumn(4).width = 20;
      workSheet.getColumn(5).width = 20;
      workSheet.getColumn(6).width = 20;
      workSheet.getColumn(7).width = 20;
      workSheet.getColumn(8).width = 20;
      workSheet.getColumn(9).width = 20;
      workSheet.getColumn(10).width = 20;
      workSheet.getColumn(11).width = 20;
      workSheet.getColumn(12).width = 25;
      workSheet.getColumn(13).width = 5;
      workSheet.getColumn(14).width = 20;
      workSheet.getColumn(15).width = 20;
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForLeaveApplicationReport = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = Object.keys(data[0]);
    headerNames.pop();
    headerNames.push('Approved Leave Date');
    headerNames.push('Approved Leave Name');
    const headerRows = workSheet.addRow(headerNames);
    headerRows.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true, // Make text bold for better readability
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
    });
    const columnWidths = [
      20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 25, 20, 20, 20,
    ];
    columnWidths.forEach((width, i) => {
      workSheet.getColumn(i + 1).width = width;
    });

    let index1 = 0;

    data.forEach((x) => {
      if (x.Approved && x.Approved.length > 0) {
        x.Approved.forEach((leave) => {
          const rowData = headerNames.map((key) => {
            if (key === 'Approved Leave Date') return leave['Leave Date'];
            if (key === 'Approved Leave Name') return leave['Leave Name'];
            return x[key];
          });

          const newRow = workSheet.addRow(rowData);
          newRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };

            cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
          });
        });
        workSheet.mergeCells(
          index1 + 2,
          1,
          index1 + 2 + x.Approved?.length - 1,
          1
        );
        workSheet.mergeCells(
          index1 + 2,
          2,
          index1 + 2 + x.Approved?.length - 1,
          2
        );
        workSheet.mergeCells(
          index1 + 2,
          3,
          index1 + 2 + x.Approved?.length - 1,
          3
        );
        workSheet.mergeCells(
          index1 + 2,
          4,
          index1 + 2 + x.Approved?.length - 1,
          4
        );
        workSheet.mergeCells(
          index1 + 2,
          5,
          index1 + 2 + x.Approved?.length - 1,
          5
        );
        workSheet.mergeCells(
          index1 + 2,
          6,
          index1 + 2 + x.Approved?.length - 1,
          6
        );
        workSheet.mergeCells(
          index1 + 2,
          7,
          index1 + 2 + x.Approved?.length - 1,
          7
        );
        workSheet.mergeCells(
          index1 + 2,
          8,
          index1 + 2 + x.Approved?.length - 1,
          8
        );
        workSheet.mergeCells(
          index1 + 2,
          9,
          index1 + 2 + x.Approved?.length - 1,
          9
        );
        workSheet.mergeCells(
          index1 + 2,
          10,
          index1 + 2 + x.Approved?.length - 1,
          10
        );
        workSheet.mergeCells(
          index1 + 2,
          11,
          index1 + 2 + x.Approved?.length - 1,
          11
        );
        workSheet.mergeCells(
          index1 + 2,
          12,
          index1 + 2 + x.Approved?.length - 1,
          12
        );
        workSheet.mergeCells(
          index1 + 2,
          13,
          index1 + 2 + x.Approved?.length - 1,
          13
        );
        workSheet.mergeCells(
          index1 + 2,
          14,
          index1 + 2 + x.Approved?.length - 1,
          14
        );
        workSheet.mergeCells(
          index1 + 2,
          15,
          index1 + 2 + x.Approved?.length - 1,
          15
        );
        workSheet.mergeCells(
          index1 + 2,
          16,
          index1 + 2 + x.Approved?.length - 1,
          16
        );

        index1 += +x.Approved?.length;
      } else {
        const rowData = headerNames.map((key) => (x[key] ? x[key] : ''));
        index1++;
        const newRow = workSheet.addRow(rowData);
        newRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };

          cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
        });
      }
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};
const generateDemoExcelBranchJob = async (
  userData,
  excelData,
  uploadObject,
  fileName,
  fileType,
  res
) => {
  if (!userData.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const datatobeExportSheet = workBook.addWorksheet('Employee Data');
  const header = Object.keys(userData[0]);
  datatobeExportSheet.addRow(header);
  formatFirstRow(datatobeExportSheet, 1);
  const data1 = userData.map((row) => Object.values(row));
  data1.map((e) => datatobeExportSheet.addRow(e));
  if (uploadObject.isUploadBranch) {
    const branchSheet = workBook.addWorksheet('Branch');
    branchSheet.addRow(['Branch']);
    formatFirstRow(branchSheet, 1);
    const data = excelData.allBranch.map((row) => [row.branchName]);
    data.map((e) => branchSheet.addRow(e));
  }

  if (uploadObject.isUploadDepartment) {
    const departmentSheet = workBook.addWorksheet('Department');
    departmentSheet.addRow(['Department']);
    formatFirstRow(departmentSheet, 1);
    const data = excelData.allDepartment.map((row) => [row.departmentName]);
    data.map((e) => departmentSheet.addRow(e));
  }

  if (uploadObject.isUploadDesignation) {
    const designationSheet = workBook.addWorksheet('Designation');
    designationSheet.addRow(['Designation']);
    formatFirstRow(designationSheet, 1);
    const data = excelData.allDesignation.map((row) => [row.designationName]);
    data.map((e) => designationSheet.addRow(e));
  }
  if (uploadObject.isUploadDivision) {
    const divisionSheet = workBook.addWorksheet('Division');
    divisionSheet.addRow(['Division']);
    formatFirstRow(divisionSheet, 1);
    const data = excelData.allDivision.map((row) => [row.divisionName]);
    data.map((e) => divisionSheet.addRow(e));
  }
  if (uploadObject.isUploadWorkingArea) {
    const workingAreaSheet = workBook.addWorksheet('WorkingArea');
    workingAreaSheet.addRow(['WorkingArea']);
    formatFirstRow(workingAreaSheet, 1);
    const data = excelData.allWorkingArea.map((row) => [row.workingAreaName]);
    data.map((e) => workingAreaSheet.addRow(e));
  }

  if (uploadObject.isUploadWorkingLocation) {
    const workingLocationSheet = workBook.addWorksheet('WorkingLocation');
    workingLocationSheet.addRow(['WorkingLocation']);
    formatFirstRow(workingLocationSheet, 1);
    const data = excelData.allWorkingLocation.map((row) => [
      row.workingLocationName,
    ]);
    data.map((e) => workingLocationSheet.addRow(e));
  }

  if (uploadObject.isUploadProject) {
    const projectSheet = workBook.addWorksheet('Projects');

    projectSheet.addRow(['Project', 'Project Code']);
    formatFirstRow(projectSheet, 1);

    const data = excelData.allProjects.map((row) => [
      row.projectName,
      row.display_id || '',
    ]);

    data.forEach((e) => projectSheet.addRow(e));
  }

  if (uploadObject.isUploadSkillCategory) {
    const skillCategorySheet = workBook.addWorksheet('SkillCategory');
    skillCategorySheet.addRow(['SkillCategory']);
    formatFirstRow(skillCategorySheet, 1);
    const data = excelData.allSkillCategory.map((row) => [row]);
    data.map((e) => skillCategorySheet.addRow(e));
  }

  if (uploadObject.isUploadReportsTo) {
    let count = 0;
    const companyNameArray = [];
    for (let comp of excelData.companyWiseUserData) {
      count++;
      const companyNameLength = comp.companyName.length;

      let sheetName = comp.companyName;

      if (companyNameLength > 30) {
        sheetName = `${comp.companyName.slice(0, 25)}-${count}`;
      } else {
        const duplicateCompanyName = companyNameArray.find(
          (s) =>
            typeof s === 'string' &&
            s.toLowerCase() === comp.companyName.toLowerCase()
        );

        if (duplicateCompanyName) {
          sheetName = `${comp.companyName.slice(0, 25)}-${count}`;
        }
      }

      companyNameArray.push(comp.companyName);
      const employeeDatasheet = workBook.addWorksheet(sheetName);
      // Row 1 - Merge A1 to G1 for Company Name
      employeeDatasheet.mergeCells('A1:G1');
      employeeDatasheet.getCell('A1').value =
        `Company Name - ${comp.companyName}`; // dynamic company name
      employeeDatasheet.getCell('A1').alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
      employeeDatasheet.getCell('A1').font = { bold: true, size: 14 }; // Optional styling
      employeeDatasheet.addRow([
        'Company Name',
        'Branch',
        'Department',
        'Designation',
        'Employee Code',
        'Employee Name',
        'Employee Number',
      ]);
      setColorInBackground(employeeDatasheet, 1, '729fcf');
      setColorInBackground(employeeDatasheet, 2, '729fcf');
      comp.employeeData.forEach((data, index) => {
        const rowIndex = index + 3; // Start from Row 3

        employeeDatasheet.getCell(`A${rowIndex}`).value = data.company;
        employeeDatasheet.getCell(`B${rowIndex}`).value = data.branch;
        employeeDatasheet.getCell(`C${rowIndex}`).value = data.department;
        employeeDatasheet.getCell(`D${rowIndex}`).value = data.designation;
        employeeDatasheet.getCell(`E${rowIndex}`).value = data.employeeCode
          ? data.employeeCode
          : '';
        employeeDatasheet.getCell(`F${rowIndex}`).value = data.displayName;
        employeeDatasheet.getCell(`G${rowIndex}`).value = data.userNumber;

        // Apply border to all cells of current row
        employeeDatasheet.getRow(rowIndex).eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
    }
  }
  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};
const generateExcelForOfficeExpenseCategory = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = ['Office Expense Category', 'Company Name', 'Status'];
    const headerRows = workSheet.addRow(headerNames);
    headerRows.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true, // Make text bold for better readability
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
    });
    data.map((x) => {
      workSheet.addRow([x.officeExpenseCategory, x.companyName, x.status]);

      workSheet.getColumn(1).width = 20;
      workSheet.getColumn(2).width = 20;
      workSheet.getColumn(3).width = 20;
      workSheet.getColumn(4).width = 20;
      workSheet.getColumn(5).width = 20;
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateExcelForOfficeExpenseHead = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = [
      'Office Expense Head',
      'Office Expense Category',
      'Company Name',
      'Status',
    ];
    const headerRows = workSheet.addRow(headerNames);
    headerRows.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true, // Make text bold for better readability
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
    });
    data.map((x) => {
      workSheet.addRow([
        x.officeExpenseHead,
        x.officeExpenseCategory,
        x.companyName,
        x.status,
      ]);

      workSheet.getColumn(1).width = 20;
      workSheet.getColumn(2).width = 20;
      workSheet.getColumn(3).width = 20;
      workSheet.getColumn(4).width = 20;
      workSheet.getColumn(5).width = 20;
    });

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateDemoExcelForOfficeExpenseCategory = async (
  data,
  fileName,
  fileType,
  res
) => {
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('sheet');
    const headerNames = ['Office Expense Category', 'Company Name'];
    const headerRows = workSheet.addRow(headerNames);
    headerRows.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.font = {
        bold: true, // Make text bold for better readability
      };

      cell.alignment = { horizontal: 'center', vertical: 'middle' }; // Center align text
    });

    workSheet.getColumn(1).width = 20;
    workSheet.getColumn(2).width = 20;
    workSheet.getColumn(3).width = 20;
    workSheet.getColumn(4).width = 20;
    workSheet.getColumn(5).width = 20;

    // Set response headers and return the file
    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    throw new Error(error);
  }
};

const generateDemoExcelForOfficeExpenseHead = async (
  data,
  fileName,
  fileType,
  res
) => {
  try {
    const workBook = new Excel.Workbook();
    const workSheet = workBook.addWorksheet('Office Expense Head');
    const expenseHeadSheet = workBook.addWorksheet('OfficeExpenseHead');
    expenseHeadSheet.addRow(['Office Expense Category']);

    workSheet.addRow(['Office Expense Category', 'Office Expense Head']);
    setColorInBackground(expenseHeadSheet, 1, '729fcf');

    const RequiredColumnStyle = [
      { index: 1, color: 'FFFF6666' },
      { index: 2, color: 'FFFF6666' },
    ];

    // Apply the styles to each specified column
    RequiredColumnStyle.forEach((column) => {
      workSheet
        .getColumn(column.index)
        .eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: column.color }, // Set the background color
          };
        });
    });

    const ExpenseCategoryData = data;
    ExpenseCategoryData.forEach((Category, index) => {
      expenseHeadSheet.getCell(`A${index + 2}`).value = Category;
    });

    // Hide the ExpenseHead worksheet to keep it clean
    expenseHeadSheet.state = 'hidden';
    for (let i = 0; i < 100; i++) {
      workSheet.addRow([null, null]);
    }

    workSheet
      .getColumn(1)
      .eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        if (rowNumber !== 1) {
          // Skip the header row
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: [`OfficeExpenseHead!$A$2:$A$${data.length + 1}`],
          };
        }
      });

    res.attachment(`${fileName}.${fileType}`);
    res.set({ 'Access-Control-Expose-Headers': '*' });

    return fileType === 'csv'
      ? workBook.csv.write(res)
      : workBook.xlsx.write(res);
  } catch (error) {
    console.error(error);
  }
};
const generateExcelForMarsExpenseReport = async (
  expenseData,
  fileName,
  fileType,
  res,
  status
) => {
  if (!expenseData.length)
    throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'User Name',
    'User Number',
    'Employee Code',
    'Branch',
    'Department',
    'Designation',
    'Applied Date',
    status === expenseApprovalTypes.APPROVED ? 'TAT' : 'Ageing Days',
    'Expense Date',
    'Voucher Number',
    'Project ID',
    'Project Name',
    'Expense Data',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Expense Category',
    'Expense Head',
    'Amount',
    'Description',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 14, 1, 17);

  for (let i = 1; i <= 13; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = expenseData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 13; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }
  // var indexofIndex1 = 0
  // for (let j = 3; j <= data2.length; j = j + index1[indexofIndex1]) {
  //   for (let i = 1; i <= 8; i++) {
  //     worksheet.mergeCells(j, i, j + 2, i);
  //   }
  // }
  worksheet.getColumn(8).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForMyExpense = async (
  expenseData,
  fileName,
  fileType,
  res
) => {
  if (!expenseData.length)
    throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Expense Type',
    'Expense Date',
    'Voucher Number',
    'Applied Date',
    'Expense Transactions',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    'Expense Category',
    'Expense Head',
    'Amount',
    'Description',
    'Expense Auth Status',
    'Auth Data',
    'Attachment-1',
    'Attachment-2',
    'Attachment-3',
    'Attachment-4',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 6, 1, 15);

  for (let i = 1; i <= 5; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = expenseData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  // Add hyperlink to attachment columns
  const attachmentStartIndex = 11;
  const attachmentEndIndex = 14;

  for (let i = 0; i < expenseData.length; i++) {
    const rowIndex = i + 3;
    const row = worksheet.getRow(rowIndex);

    for (let j = attachmentStartIndex; j <= attachmentEndIndex; j++) {
      const link = expenseData[i][Object.keys(expenseData[i])[j]];
      if (link && typeof link === 'string' && link.startsWith('http')) {
        const cell = row.getCell(j + 1);
        cell.value = {
          text: 'View',
          hyperlink: link,
        };
        cell.font = { color: { argb: 'FF0000FF' }, underline: true };
      }
    }
  }

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 5; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }
  // var indexofIndex1 = 0
  // for (let j = 3; j <= data2.length; j = j + index1[indexofIndex1]) {
  //   for (let i = 1; i <= 8; i++) {
  //     worksheet.mergeCells(j, i, j + 2, i);
  //   }
  // }
  worksheet.getColumn(5).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateExcelForOfficeExpense = async (
  officeExpenseData,
  fileName,
  fileType,
  res
) => {
  if (!officeExpenseData.length)
    throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();

  const worksheet = workBook.addWorksheet('sheet');

  const header2 = [
    'Sr No',
    'Branch Name',
    'Site Name',
    'Expense Date',
    'Voucher Number',
    'Applied Date',
    'Expense Transactions',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const header3 = [
    '',
    '',
    '',
    '',
    '',
    '',
    'Expense Category',
    'Expense Head',
    'Amount',
    'Description',
    'Expense Auth Status',
    'Auth Data',
    'Attachment-1',
    'Attachment-2',
    'Attachment-3',
    'Attachment-4',
  ];

  worksheet.addRow(header2);
  worksheet.addRow(header3);

  await styleRow(worksheet, 1);
  await styleRow(worksheet, 2);

  worksheet.mergeCells(1, 7, 1, 16);

  for (let i = 1; i <= 6; i++) {
    worksheet.mergeCells(1, i, 2, i);
  }

  const row2 = worksheet.getRow(1);
  row2.height = 20;
  row2.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'ebf1de' }, // Red color
    };
  });

  worksheet.getRow(2).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'daeef3' }, // Red color
    };
  });

  const data2 = officeExpenseData.map((row) => Object.values(row));

  data2.map((e) => worksheet.addRow(e));

  // Add hyperlink to attachment columns
  const attachmentStartIndex = 11;
  const attachmentEndIndex = 14;

  for (let i = 0; i < officeExpenseData.length; i++) {
    const rowIndex = i + 3;
    const row = worksheet.getRow(rowIndex);

    for (let j = attachmentStartIndex; j <= attachmentEndIndex; j++) {
      const link = officeExpenseData[i][Object.keys(officeExpenseData[i])[j]];
      if (link && typeof link === 'string' && link.startsWith('http')) {
        const cell = row.getCell(j + 1);
        cell.value = {
          text: 'View',
          hyperlink: link,
        };
        cell.font = { color: { argb: 'FF0000FF' }, underline: true };
      }
    }
  }

  let counts = {};

  for (let j = 0; j < data2.length; j++) {
    let srNo = data2[j][0];
    if (counts[srNo]) {
      counts[srNo]++;
    } else {
      counts[srNo] = 1;
    }
  }

  for (let i = 0; i < data2.length; i++) {
    for (let j = 0; j < 6; j++) {
      worksheet.mergeCells(
        i + 3,
        j + 1,
        i + 3 + counts[data2[i][0]] - 1,
        j + 1
      );
    }
    i += counts[data2[i][0]] - 1;
  }
  // var indexofIndex1 = 0
  // for (let j = 3; j <= data2.length; j = j + index1[indexofIndex1]) {
  //   for (let i = 1; i <= 8; i++) {
  //     worksheet.mergeCells(j, i, j + 2, i);
  //   }
  // }
  worksheet.getColumn(4).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference
  worksheet.getColumn(6).numFmt = 'dd-mm-yyyy hh:mm:ss'; // Adjust format as per your preference

  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell, colNumber) => {
      worksheet.getRow(row).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };

      alignment2(worksheet, rowNumber);

      // if (cell.value !== null && cell.value !== '') {
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      // }
    });
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};

const generateDemoExcelForExpensePayment = async (
  data,
  fileName,
  fileType,
  res
) => {
  if (!data.length) throw new Error('No data found to generate the file!');
  const workBook = new Excel.Workbook();
  const workSheet = workBook.addWorksheet('Advance Data');
  const workSheet1 = workBook.addWorksheet('Basic Instructions');
  workSheet1.addRow(['Date Format must be in yyyy-mm-dd format.']);
  workSheet1.addRow([
    'Reference Date is required ,if you are selecting payment mode Cheque,UPI or NetBanking.',
  ]);

  setColorInBackground(workSheet1, 1, 'FF0000'); // light red
  setColorInBackground(workSheet1, 2, 'FF0000');

  const keysArray = Object.keys(data[0]);
  workSheet.addRow(keysArray);
  setColorInBackground(workSheet, 1, '729fcf'); // blue
  await styleRow(workSheet, 1);

  const data2 = data.map((row) => Object.values(row));

  data2.map((e) => workSheet.addRow(e));

  // set payment mode in dropdown
  const paymentModeColumn = workSheet.getColumn(10);
  const paymentModeValues = [
    paymentMode.CASH,
    paymentMode.UPI,
    paymentMode.CHEQUE,
    paymentMode.NETBANKING,
  ];
  paymentModeColumn.eachCell((cell, rowNumber) => {
    if (rowNumber !== 1) {
      // Skip the header row
      const dataValidation = {
        type: 'list',
        formulae: [`"${paymentModeValues.join(',')}"`],
        allowNulls: true,
      };
      cell.dataValidation = dataValidation;
    }
  });

  res.attachment(`${fileName}.${fileType}`);
  res.set({ 'Access-Control-Expose-Headers': '*' });

  return fileType === 'csv'
    ? workBook.csv.write(res)
    : workBook.xlsx.write(res);
};
module.exports = {
  generatePaySlipExcel,
  generateDemoExcelForPaySlipGenerator,
  generateExcelOTReportWithESIC,
  generateExcel_SlotWise_Attendance_Report,
  generateExcelForDailyCostReportMail,
  generateExcelForFYLeaveReportMail,
  generateExcelLateComeEarlyGoMail,
  getGradeForTarget,
  generateExcelDailyAttendanceCountDepartmentwise,
  generateDemoExcelForPreviousSalary,
  generateDemoExcelForDivision,
  generateDemoExcelForWorkingArea,
  generateExcelForMonthlyAttendanceReport,
  generateExcelForEmployeeWiseSalaryReport,
  generateExcelForSalaryRegister,
  generateExcel,
  generateExceltoMail,
  generateChecklistExcel,
  generateExcelforSalaryStructure,
  generateExcelForLeave,
  generateDemoExcelForVariable,
  generateExcelForLeaveBalance,
  generateExcelForDailyCost,
  generateExcelForBankReport,
  EmailSalarySlip,
  generateAttendanceExcel,
  generateExcelForAttendanceData,
  generateExcelForTackingReport,
  generateExcelForMusterRoll,
  generateExcelForFORM_D_AttendanceRegister,
  generateExcelForShift,
  generateExcelForFiveMinuteTackingReport,
  createZipFileForsalarySlip,
  generateDemoExcelForAdvance,
  generateExcelForPreboarding,
  generateExcelForEmployeeGatePass,
  generateDemoExcel,
  generateAuthorozationExcel,
  generateExcelForVisitReportMail,
  generateExcelDepartmentWisepunchinoutcountreport,
  createZipFileForPortraitidIdCards,
  generateExcelDepartmentWisepunchinoutcountreportMail,
  genrateDemoExcelForExpenseHead,
  genrateDemoExcelForWorkingLocation,
  genrateDemoExcelForBranch,
  genrateDemoExcelForCustomer,
  genrateDemoExcelForContractor,
  genrateDemoExcelForAssetMaster,
  generateExcelForPunchInPunchOutReport,
  generateExcelForAttendaceReport4,
  genrateDemoExcelForManualLeave,
  generateweekoffWorkDayExcel,
  genrateDemoExcelForAssignAsset,
  generateExcelForShiftRoster,
  generateDemoExcelForShiftRoster,
  genrateDemoExcelForBiometricAttendance,
  generateAuthorozationExcelWithUserData,
  generateExcelForVisitReport,
  generateExcelForIncrementReport,
  generateExcelForAssignBiometricCodeToUser,
  generateExcelGatePass,
  generateExcelForEmploeeMonthWiseSalary,
  generatePdfForEmploeeMonthWiseSalary,
  generateExcelForExtraDays,
  genrateDemoExcelForDesinationWiseDocument,
  createZipFileForProfilePics,
  generateExcelForAttendanceCorrectionReport,
  generateExcelForLeaveApplicationReport,
  generateDemoExcelBranchJob,
  generateExcelForOfficeExpenseCategory,
  generateExcelForOfficeExpenseHead,
  generateDemoExcelForOfficeExpenseCategory,
  generateDemoExcelForOfficeExpenseHead,
  formatFirstRow,
  generateExcelForMarsExpenseReport,
  generateExcelForMyExpense,
  generateExcelForOfficeExpense,
  generateDemoExcelForExpensePayment,
};
