const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const UserMaster = require('../models/userMaster');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDivision = require('../models/employeeDivision');
const Division = require('../models/division');
const UserAddress = require('../models/userAddress');
const CityMaster = require('../models/citymaster');
const CountryMaster = require('../models/countrymaster');
const StateMaster = require('../models/statemaster');
const {
  ToformatAddress,
  generateHTMLToPDF_base64Path,
  asiaKolkataDateTime,
  getUserSalaryMasterByMonth,
  generateLetterHTMLToPDF_base64Path,
  addPageBreak,
  addSalaryStructureKeyword,
  onTableHtmlAddSalaryStructureKeyword,
  getHTMLFileData,
} = require('../utils/commonUtilFunctions');
const moment = require('moment');
const Contractor = require('../models/contractor');
const companyMaster = require('../models/companyMaster');
const { userAttributes, companyAttributes } = require('../utils/commonVars');
const { mainApiUrl } = require('../utils/labelUtils');
const BankMaster = require('../models/bankMaster');
const UserLetters = require('../models/userLetters');
const EmployeeSkillCategory = require('../models/employeeSkillCategory');
const puppeteer = require('puppeteer');
const { ToWords } = require('to-words');
const { Translate } = require('@google-cloud/translate').v2;

const toMarathiWords = new ToWords({
  localeCode: 'mr-IN', // Indian Numbering System
  converterOptions: {
    currency: true,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});

const toEnglishWord = new ToWords({
  localeCode: 'en-IN', // Indian Numbering System
  converterOptions: {
    currency: true,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
  },
});

exports.downloadPersonalInformationForm = async (req, res, next) => {
  try {
    let { userMasterID, formName } = await req.body;
    const currentdate = asiaKolkataDateTime(new Date()).slice(0, 10);
    const currentYearMonth = moment(currentdate, 'YYYY-MM-DD').format('YYYYMM');
    const userData = await UserMaster.findOne({
      where: {
        userMasterID: userMasterID,
      },
      include: [
        // Employee Joining Details
        {
          separate: true,
          required: true,
          model: EmployeeJoiningDetails,
          include: [
            {
              required: false,
              model: Contractor,
              include: [
                {
                  model: CityMaster,
                  attributes: ['cityName'],
                  include: [
                    {
                      model: StateMaster,
                      attributes: ['stateName'],
                      include: [
                        { model: CountryMaster, attributes: ['countryName'] },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              required: false,
              model: BankMaster,
            },
          ],
        },
        // Employee Designation
        {
          required: false,
          model: EmployeeDesignation,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
              },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          attributes: ['designationID', 'applicableDate'],
          include: [
            {
              model: Designation,
              as: 'designation',
              attributes: ['designationName'],
            },
          ],
        },
        // Employee Department
        {
          required: false,
          model: EmployeeDepartment,
          where: {
            status: 1,
            applicableDate: {
              [Sequelize.Op.lte]: new Date(currentdate),
            },
            [Sequelize.Op.or]: [
              {
                endDate: {
                  [Sequelize.Op.gte]: new Date(currentdate),
                },
              },
              { endDate: { [Sequelize.Op.eq]: null } },
            ],
          },
          attributes: ['departmentID', 'applicableDate'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['departmentName'],
            },
          ],
        },

        // User Address
        {
          model: UserAddress,
          required: false,
          where: {
            status: 1,
            verifyStatus: 1,
          },
          include: [
            {
              model: CityMaster,
              attributes: ['cityName'],
              include: [
                {
                  model: StateMaster,
                  attributes: ['stateName'],
                  include: [
                    { model: CountryMaster, attributes: ['countryName'] },
                  ],
                },
              ],
            },
          ],
        },
        {
          required: true,
          model: companyMaster,
          attributes: companyAttributes,
        },

        // Employee skill category
        {
          required: false,
          model: EmployeeSkillCategory,
          where: {
            applicableYYYYMM: {
              [Sequelize.Op.lte]: +currentYearMonth,
            },
            [Sequelize.Op.or]: [
              {
                endYYYYMM: {
                  [Sequelize.Op.gte]: +currentYearMonth,
                },
              },
              {
                endYYYYMM: {
                  [Sequelize.Op.eq]: null,
                },
              },
            ],
          },
        },
      ],
    });

    // Employee Joining Details
    const employeeJoining =
      userData.employeeJoiningDetails &&
      userData.employeeJoiningDetails.length > 0
        ? userData.employeeJoiningDetails[0]
        : null;
    // Employee Joining Details
    const contractorData =
      employeeJoining && employeeJoining.contractor
        ? employeeJoining.contractor
        : null;

    const contractorAddressData = contractorData
      ? `${contractorData.contractorAddress ? contractorData.contractorAddress + ',' : ''} ${contractorData.cityMaster.cityName}, ${contractorData.cityMaster.stateMaster.stateName}, ${contractorData.cityMaster.stateMaster.countryMaster.countryName}`
      : '';

    const currentAddress =
      userData && userData.userAddresses && userData.userAddresses.length > 0
        ? userData.userAddresses.find((e) => e.addressType == 'temporary')
        : null;
    const permanentAddress =
      userData && userData.userAddresses && userData.userAddresses.length > 0
        ? userData.userAddresses.find((e) => e.addressType == 'permanent')
        : null;
    let userSkillCategory = '';
    if (
      userData.employeeSkillCategories &&
      userData.employeeSkillCategories.length > 0
    ) {
      let skillCategory = userData.employeeSkillCategories[0].skillCategory;

      if (skillCategory === 'skilled') {
        userSkillCategory = '( skilled (कुशल) )';
      } else if (skillCategory === 'unskilled') {
        userSkillCategory = '( unskilled (अकुशल) )';
      } else if (skillCategory === 'semiskilled') {
        userSkillCategory = '( semiskilled (अर्धकुशल) )';
      }
    }
    const marathiDisplayName = userData.localDisplayName
      ? `${userData.displayName} ( ${userData.localDisplayName} ) `
      : userData.displayName;

    const marathiFatherName =
      userData.middleName && userData.localMName
        ? `${userData.middleName} ${userData.lastName} ( ${userData.localMName} ${userData.localLName} ) `
        : '';

    let pdfData = {
      currentDate: moment(currentdate, 'YYYY-MM-DD').format('DD-MM-YYYY'),
      usersContractorName: contractorData?.contractorName
        ? `${contractorData.contractorName} ${contractorData.localName || ''}`.trim()
        : '',
      usersContractorAddress: contractorAddressData
        ? contractorAddressData
        : '',
      userEmployeeCode:
        employeeJoining && employeeJoining.employeeCode
          ? employeeJoining.employeeCode
          : '',
      userbankAccountNo:
        employeeJoining && employeeJoining.bankAccountNo
          ? employeeJoining.bankAccountNo
          : '',
      userbankName:
        employeeJoining && employeeJoining.bankMaster
          ? employeeJoining.bankMaster.bankName
          : '',
      userName: marathiDisplayName,
      userFatherName: marathiFatherName,
      userNumber: userData.userNumber,
      userDateOfJoining:
        employeeJoining && employeeJoining.joiningDate
          ? moment(employeeJoining.joiningDate, 'YYYY-MM-DD').format(
              'DD-MM-YYYY'
            )
          : '',
      userDepartment:
        userData.employeeDepartments && userData.employeeDepartments.length > 0
          ? userData.employeeDepartments[0].department
            ? userData.employeeDepartments[0].department.departmentName
            : ''
          : '',
      userDesignation:
        userData.employeeDesignations &&
        userData.employeeDesignations.length > 0
          ? userData.employeeDesignations[0].designation
            ? userData.employeeDesignations[0].designation.designationName
            : ''
          : '',
      userSkillCategory,
      userCompanyName: userData.companyMaster.companyName,
      userBiometricCode:
        employeeJoining && employeeJoining.biometricCode
          ? employeeJoining.biometricCode
          : '',
      userGender: userData.gender ? userData.gender.toUpperCase() : '',
      userDateOfBirth:
        employeeJoining && employeeJoining.dob
          ? moment(employeeJoining.dob, 'YYYY-MM-DD').format('DD-MM-YYYY')
          : '',
      userAdharCardNumber:
        employeeJoining && employeeJoining.adharCard
          ? employeeJoining.adharCard
          : '',
      userCurrentAddress: currentAddress ? ToformatAddress(currentAddress) : '',
      userPermanentAddress: permanentAddress
        ? ToformatAddress(permanentAddress)
        : '',
      userCurrentAddressMarathi:
        currentAddress && currentAddress.localLangAddress
          ? `( ${currentAddress.localLangAddress} )`
          : '',
      userPermanentAddressMarathi:
        permanentAddress && permanentAddress.localLangAddress
          ? `( ${permanentAddress.localLangAddress} )`
          : '',
      userPhotoURL:
        userData && userData.photo
          ? `${mainApiUrl}uploads/user/photo/${userData.photo}`
          : '',
    };

    const salary = await getUserSalaryMasterByMonth(
      userMasterID,
      currentYearMonth
    );

    salary.forEach((obj) => {
      obj.marathiEmployeeSalaryAmount = convertToMarathiDigits(
        obj.EmployeeSalaryAmount
      );
    });

    const filterMainSalary = salary.filter((item) => {
      return ![1, 50, 92].includes(item.payheadMasterId);
    });

    const monthlyMainSalryData = filterMainSalary.map(function (item) {
      const updatedSalary = item.EmployeeSalaryAmount * 26;
      return {
        ...item,
        EmployeeSalaryAmount: updatedSalary,
        marathiEmployeeSalaryAmount: convertToMarathiDigits(updatedSalary),
      };
    });

    pdfData.filterMainSalary = filterMainSalary;

    const filteredSalary = filterMainSalary.filter((item) => {
      if (item.salaryFieldSrNo === 'B') {
        return item.payheadMasterId == 4 || item.payheadMasterId == 13;
      }
      if (item.salaryFieldSrNo === 'C') {
        return false; // Exclude all records where salaryFieldSrNo is "C"
      }
      return true; // Include all other salaryFieldSrNo values
    });

    pdfData.salaryData = filteredSalary;

    const filterSalary_A = filterMainSalary.filter((item) => {
      return item.salaryFieldSrNo === 'A';
    });

    const monthlySalryData = filterMainSalary.map(function (item) {
      const updatedSalary = item.EmployeeSalaryAmount * 26;
      return {
        ...item,
        EmployeeSalaryAmount: updatedSalary,
        marathiEmployeeSalaryAmount: convertToMarathiDigits(updatedSalary),
      };
    });

    const daily_filterSalary_A = monthlySalryData.filter(function (item) {
      return item.salaryFieldSrNo === 'A';
    });
    pdfData.filterSalary_A = filterSalary_A;

    pdfData.dailySalaryData = daily_filterSalary_A;

    if (salary && salary.length > 0) {
      // PF
      const sumOfSalaryPayHead_PF = monthlyMainSalryData
        .filter((item) => +item.payheadMasterId == 4)
        .reduce((sum, item) => sum + item.EmployeeSalaryAmount, 0);
      const daily_sumOfSalaryPayHead_PF = filterMainSalary
        .filter((item) => +item.payheadMasterId == 4)
        .reduce((sum, item) => sum + item.EmployeeSalaryAmount, 0);

      pdfData.pfAmount = sumOfSalaryPayHead_PF;
      pdfData.dailypfAmount = daily_sumOfSalaryPayHead_PF;
      pdfData.marathiDailypfAmount = convertToMarathiDigits(
        daily_sumOfSalaryPayHead_PF
      );

      // ESIC
      const sumOfSalaryPayHead_ESIC = monthlyMainSalryData
        .filter(
          (item) => +item.payheadMasterId == 13 || +item.payheadMasterId == 14
        )
        .reduce((sum, item) => sum + item.EmployeeSalaryAmount, 0);
      const daily_sumOfSalaryPayHead_ESIC = filterMainSalary
        .filter((item) => +item.payheadMasterId == 13)
        .reduce((sum, item) => sum + item.EmployeeSalaryAmount, 0);
      pdfData.ESICAmount = sumOfSalaryPayHead_ESIC;
      pdfData.dailyESICAmount = daily_sumOfSalaryPayHead_ESIC;
      pdfData.marathiDailyESICAmount = daily_sumOfSalaryPayHead_ESIC;

      // Total PF ESIC
      pdfData.totalDudction_PF_ESIC =
        sumOfSalaryPayHead_PF + sumOfSalaryPayHead_ESIC;
      pdfData.dailyTotalDudction_PF_ESIC =
        daily_sumOfSalaryPayHead_PF + daily_sumOfSalaryPayHead_ESIC;
      pdfData.marathiDailyTotalDudction_PF_ESIC = convertToMarathiDigits(
        pdfData.dailyTotalDudction_PF_ESIC
      );
      pdfData.dailyTotalDudction_PF_ESICInEnglishWords = `( ${toEnglishWord.convert(pdfData.dailyTotalDudction_PF_ESIC)} )`;
      pdfData.dailyTotalDudction_PF_ESICInMarathiWords = `( ${toMarathiWords.convert(pdfData.dailyTotalDudction_PF_ESIC)} )`;

      // Gross Salary
      pdfData.daily_grossSalary =
        +[...salary].find((e) => e.payheadMasterId == 50)
          ?.EmployeeSalaryAmount || 0;
      pdfData.grossSalary = pdfData.daily_grossSalary * 26;
      pdfData.grossSalaryMarathiDigit = convertToMarathiDigits(
        pdfData.grossSalary
      );

      // Net Salary
      pdfData.dailyNetSalary =
        +[...salary].find((e) => e.payheadMasterId == 92)
          ?.EmployeeSalaryAmount || 0;
      pdfData.netSalary = +pdfData.netSalary * 26;
      pdfData.marathiDailyNetSalary = convertToMarathiDigits(
        pdfData.dailyNetSalary
      );
      pdfData.daily_netSalaryInEnglishWords = `( ${toEnglishWord.convert(pdfData.dailyNetSalary)} )`;
      pdfData.daily_netSalaryInMarathiWords = `( ${toMarathiWords.convert(pdfData.dailyNetSalary)} )`;

      // CTC Salary
      pdfData.daily_ctcSalary =
        +[...salary].find((e) => e.payheadMasterId == 1)
          ?.EmployeeSalaryAmount || 0;
      pdfData.ctcSalary = +pdfData.daily_ctcSalary * 26;

      const daily_sumOfsalaryFieldSrNo_B_Without_MLWF = filterMainSalary
        .filter(function (item) {
          return item.salaryFieldSrNo === 'B' && +item.payheadMasterId != 18;
        })
        .reduce(function (sum, item) {
          return sum + item.EmployeeSalaryAmount;
        }, 0);
    }

    let base64path = '';
    const PageBreak = `<div class="pageBreak" style="page-break-before: always; break-before: page; height: 0; margin: 0; display: block;"></div>`;
    if (formName == 'allPersonalInformationForm') {
      const htmlArray = [];

      const saveraGroupPersonalInformationForm = await getHTMLFileData(
        pdfData,
        'saveraGroupPersonalInformationForm',
        'html' //File Extension
      );
      htmlArray.push(saveraGroupPersonalInformationForm);
      const saveraGroupNewJoineeInductionTrainingForm = await getHTMLFileData(
        pdfData,
        'saveraGroupNewJoineeInductionTrainingForm',
        'html' //File Extension
      );
      htmlArray.push(saveraGroupNewJoineeInductionTrainingForm);

      const saveraGroupCheckSheetCoverSheetRecruitment = await getHTMLFileData(
        pdfData,
        'saveraGroupCheckSheetCoverSheetRecruitment',
        'html' //File Extension
      );
      htmlArray.push(saveraGroupCheckSheetCoverSheetRecruitment);

      const saveraGroupMultipleShiftWorkingConsentForm = await getHTMLFileData(
        pdfData,
        'saveraGroupMultipleShiftWorkingConsentForm',
        'html' //File Extension
      );
      htmlArray.push(saveraGroupMultipleShiftWorkingConsentForm);

      const saveraGroupContractForm = await getHTMLFileData(
        pdfData,
        'saveraGroupContractForm',
        'html' //File Extension
      );
      htmlArray.push(saveraGroupContractForm);

      const saveraGroupSalaryStructureContractualEmployee =
        await getHTMLFileData(
          pdfData,
          'saveraGroupSalaryStructureContractualEmployee',
          'html' //File Extension
        );
      htmlArray.push(saveraGroupSalaryStructureContractualEmployee);

      const userLetter = await UserLetters.findOne({
        where: {
          userMasterID: userMasterID,
        },
      });

      if (userLetter && userLetter.appointmentLetterID) {
        userLetter.appointmentletterHTML = addPageBreak(
          userLetter.appointmentletterHTML
        );
        userLetter.appointmentletterHTML = addSalaryStructureKeyword(
          userLetter.appointmentletterHTML
        );
        userLetter.appointmentletterHTML = onTableHtmlAddSalaryStructureKeyword(
          userLetter.appointmentletterHTML
        );
        const appointmentletterHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link
                href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                rel="stylesheet">
            <style>
              * {
                  font-family: "Noto Sans Devanagari", serif;
                }
            </style>
          </head>
          <body>
            <div class="container">
              ${userLetter.appointmentletterHTML}
            </div>
          </body>
          </html>
          `;
        htmlArray.push(appointmentletterHTML);
      }

      let newHTMLData = '';

      for (let i = 0; i < htmlArray.length; i++) {
        if (i === 0) {
          newHTMLData = `${htmlArray[i]}`;
        } else {
          newHTMLData += `${PageBreak} ${htmlArray[i]}`;
        }
      }

      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox'],
      });
      const page = await browser.newPage();

      // Set the HTML content of the page
      await page.setContent(newHTMLData);

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4', // Page format (A4 in this case)
        printBackground: true, // print background
        landscape: false,
        timeout: 120000,
      });
      await browser.close();
      base64path = Buffer.from(pdfBuffer).toString('base64');
    } else {
      if (formName == 'saveraGroupAppointmentLetter') {
        const userLetter = await UserLetters.findOne({
          where: {
            userMasterID: userMasterID,
          },
        });
        if (userLetter) {
          if (!userLetter.appointmentLetterID) {
            return res.status(200).json({
              status: 400,
              message:
                message.usermessage.notFoundMessage('Appointment Letter'),
            });
          } else {
            userLetter.appointmentletterHTML = addPageBreak(
              userLetter.appointmentletterHTML
            );
            userLetter.appointmentletterHTML = addSalaryStructureKeyword(
              userLetter.appointmentletterHTML
            );
            userLetter.appointmentletterHTML =
              onTableHtmlAddSalaryStructureKeyword(
                userLetter.appointmentletterHTML
              );
            const appointmentletterHTML = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link
                href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@100..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
                rel="stylesheet">
            <style>
              * {
                  font-family: "Noto Sans Devanagari", serif;
                }
            </style>
          </head>
          <body>
            <div class="container">
              ${userLetter.appointmentletterHTML}
            </div>
          </body>
          </html>
          `;
            base64path = await generateLetterHTMLToPDF_base64Path(
              appointmentletterHTML,
              'portrait'
            );
          }
        } else {
          return res.status(200).json({
            status: 400,
            message: message.usermessage.notFoundMessage('Letters'),
          });
        }
      } else {
        base64path = await generateHTMLToPDF_base64Path(
          pdfData,
          formName,
          'portrait',
          'html' //File Extension
        );
      }
    }
    return res.status(200).json({
      status: 200,
      data: base64path,
    });
  } catch (err) {
    next(err);
  }
};

function convertToMarathiDigits(number) {
  const marathiDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return number
    .toString()
    .split('')
    .map((char) => (char >= '0' && char <= '9' ? marathiDigits[char] : char))
    .join('');
}

exports.translateUserNames = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;
    const finduserMasterData = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: [0, 1],
      },
      attributes: ['userMasterID', 'firstName', 'middleName', 'lastName'],
      order: [['userMasterID', 'ASC']],
    });
    const updateData = [];
    for (let user of finduserMasterData) {
      let localFName = null;
      let localMName = null;
      let localLName = null;
      let localDisplayName = null;
      const translate = new Translate({
        key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
      });

      const response = await translate.translate(
        [user.firstName, user.middleName ? user.middleName : '', user.lastName],
        {
          from: 'en', // Explicitly specify English as the source
          to: 'mr',
          format: 'text',
          model: 'base',
        }
      );

      // Extract transliterated values
      localFName = response[0]?.[0] || null;
      localMName = response[0]?.[1] || null;
      localLName = response[0]?.[2] || null;

      localDisplayName = localMName
        ? `${localFName} ${localMName} ${localLName}`
        : `${localFName} ${localLName}`;

      const update = {
        userMasterID: user.userMasterID,
        localFName: localFName,
        localMName: localMName,
        localLName: localLName,
        localDisplayName: localDisplayName,
      };
      updateData.push(update);
    }
    const updateDataChunks = [];
    for (let i = 0; i < updateData.length; i += 50) {
      updateDataChunks.push(updateData.slice(i, i + 50));
    }

    for (let j = 0; j < updateDataChunks.length; j++) {
      const updatePromise = [];
      updateDataChunks[j].forEach((data) =>
        updatePromise.push(
          UserMaster.update(
            {
              localFName: data.localFName,
              localMName: data.localMName,
              localLName: data.localLName,
              localDisplayName: data.localDisplayName,
            },
            {
              where: { userMasterID: data.userMasterID },
            }
          )
        )
      );
      await Promise.all(updatePromise);
    }
    return res.status(200).json({
      status: 200,
      data: updateData,
    });
  } catch (err) {
    next(err);
  }
};

exports.translateContractor = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;
    const finduserMasterData = await Contractor.findAll({
      where: {
        companyMasterID: companyMasterID,
        status: [0, 1],
      },
      attributes: [
        'contractorId',
        'contractorName',
        'contractorAddress',
        'cityMasterID',
      ],
      order: [['contractorId', 'ASC']],
    });
    const updateData = [];
    for (let user of finduserMasterData) {
      const translate = new Translate({
        key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
      });
      const cityWiseData = await CityMaster.findOne({
        where: { cityMasterID: user.cityMasterID },
        attributes: ['cityName'],
        include: [
          {
            required: true,
            model: StateMaster,
            attributes: ['stateName'],
            include: [
              {
                required: true,
                model: CountryMaster,
                attributes: ['countryName'],
              },
            ],
          },
        ],
      });
      const fullContractorAddress = user.contractorAddress
        ? `${user.contractorAddress}, ${cityWiseData.cityName}, ${cityWiseData.stateMaster.stateName},  ${cityWiseData.stateMaster.countryMaster.countryName}`
        : `${cityWiseData.cityName}, ${cityWiseData.stateMaster.stateName},  ${cityWiseData.stateMaster.countryMaster.countryName}`;

      const response = await translate.translate(
        [
          user.contractorName,
          fullContractorAddress ? fullContractorAddress : '',
        ],
        {
          from: 'en', // Explicitly specify English as the source
          to: 'mr',
          format: 'text',
          model: 'base',
        }
      );

      let localName = response[0]?.[0] || null;
      let localAddress = response[0]?.[1] || null;

      const update = {
        contractorId: user.contractorId,
        localName: localName,
        localAddress: localAddress,
      };
      updateData.push(update);
    }
    const updateDataChunks = [];
    for (let i = 0; i < updateData.length; i += 10) {
      updateDataChunks.push(updateData.slice(i, i + 50));
    }

    for (let j = 0; j < updateDataChunks.length; j++) {
      const updatePromise = [];
      updateDataChunks[j].forEach((data) =>
        updatePromise.push(
          Contractor.update(
            {
              localName: data.localName,
              localAddress: data.localAddress,
            },
            {
              where: { contractorId: data.contractorId },
            }
          )
        )
      );
      await Promise.all(updatePromise);
    }
    return res.status(200).json({
      status: 200,
      data: updateData,
    });
  } catch (err) {
    next(err);
  }
};

exports.translateUserAddress = async (req, res, next) => {
  try {
    const { companyMasterID } = req.body;
    const findUserIDs = await UserMaster.findAll({
      where: {
        companyMasterId: companyMasterID,
        status: [0, 1],
      },
      attributes: ['userMasterID'],
      order: [['userMasterID', 'ASC']],
    });
    const userIDs = findUserIDs.map((e) => e.userMasterID);
    const finduserAddressData = await UserAddress.findAll({
      where: {
        userMasterID: userIDs,
        status: [0, 1],
      },
      order: [['userAddressID', 'ASC']],
      include: [
        {
          model: CityMaster,
          include: [
            {
              model: StateMaster,
              include: [
                {
                  model: CountryMaster,
                },
              ],
            },
          ],
        },
      ],
    });
    const updateData = [];
    for (let address of finduserAddressData) {
      const translate = new Translate({
        key: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
      });
      const userAddressData = ToformatAddress(address);

      const response = await translate.translate([userAddressData], {
        from: 'en', // Explicitly specify English as the source
        to: 'mr',
        format: 'text',
        model: 'base',
      });

      let localLangAddress = response[0]?.[0] || null;

      const update = {
        userAddressID: address.userAddressID,
        localLangAddress: localLangAddress,
      };
      updateData.push(update);
    }
    const updateDataChunks = [];
    for (let i = 0; i < updateData.length; i += 10) {
      updateDataChunks.push(updateData.slice(i, i + 50));
    }

    for (let j = 0; j < updateDataChunks.length; j++) {
      const updatePromise = [];
      updateDataChunks[j].forEach((data) =>
        updatePromise.push(
          UserAddress.update(
            {
              localLangAddress: data.localLangAddress,
            },
            {
              where: { userAddressID: data.userAddressID },
            }
          )
        )
      );
      await Promise.all(updatePromise);
    }
    return res.status(200).json({
      status: 200,
      data: updateData,
    });
  } catch (err) {
    next(err);
  }
};
