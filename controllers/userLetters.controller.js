const UserLetters = require('../models/userLetters');
const letterTamplateEditor = require('../models/letterTemplateEditor');
const UserMaster = require('../models/userMaster');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const companyMaster = require('../models/companyMaster');
const path = require('path');
const Handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const { sendOfferLetter } = require('../middleware/sendemail');
const { generateOfferLetterPdf } = require('../utils/pdfGenerate');

const fs = require('fs');
// const { convert } = require('transform-doc');
const base64Img = require('base64-img');
const OfferLetter = require('../models/offerLetter');
const {
  employeeBranch,
  employeeDesignation,
  employeeDepartment,
  getEmployeeAddress,
  asiaKolkataDateTime,
  addPageBreak,
  addSalaryStructureKeyword,
  onTableHtmlAddSalaryStructureKeyword,
  findCompanyNotificationPolicy,
} = require('../utils/commonUtilFunctions');
const UserReportTO = require('../models/employeeReportTo');

exports.getAllUserLetter = async (req, res, next) => {
  try {
    const { userMasterID } = req.body;

    const userLetter = await UserLetters.findOne({
      where: {
        userMasterID: userMasterID,
      },
    });

    if (!userLetter) {
      return res.status(200).json({
        status: 200,
        data: [
          {
            label: 'Offer Letter',
            path: '',
          },
          {
            label: 'Joining Letter',
            path: '',
          },
          {
            label: 'Appointment Letter',
            path: '',
          },
          {
            label: 'Experience Letter',
            path: '',
          },
          {
            label: 'Termination Letter',
            path: '',
          },
        ],
      });
    }

    userLetter.offerletterHTML = addPageBreak(userLetter.offerletterHTML);

    userLetter.offerletterHTML = addSalaryStructureKeyword(
      userLetter.offerletterHTML
    );
    userLetter.offerletterHTML = onTableHtmlAddSalaryStructureKeyword(
      userLetter.offerletterHTML
    );

    userLetter.joiningletterHTML = addPageBreak(userLetter.joiningletterHTML);

    userLetter.joiningletterHTML = addSalaryStructureKeyword(
      userLetter.joiningletterHTML
    );
    userLetter.joiningletterHTML = onTableHtmlAddSalaryStructureKeyword(
      userLetter.joiningletterHTML
    );

    userLetter.experienceletterHTML = addPageBreak(
      userLetter.experienceletterHTML
    );
    userLetter.experienceletterHTML = addSalaryStructureKeyword(
      userLetter.experienceletterHTML
    );
    userLetter.experienceletterHTML = onTableHtmlAddSalaryStructureKeyword(
      userLetter.experienceletterHTML
    );

    userLetter.terminationletterHTML = addPageBreak(
      userLetter.terminationletterHTML
    );
    userLetter.terminationletterHTML = addSalaryStructureKeyword(
      userLetter.terminationletterHTML
    );
    userLetter.terminationletterHTML = onTableHtmlAddSalaryStructureKeyword(
      userLetter.terminationletterHTML
    );

    userLetter.appointmentletterHTML = addPageBreak(
      userLetter.appointmentletterHTML
    );
    userLetter.appointmentletterHTML = addSalaryStructureKeyword(
      userLetter.appointmentletterHTML
    );
    userLetter.appointmentletterHTML = onTableHtmlAddSalaryStructureKeyword(
      userLetter.appointmentletterHTML
    );

    return res.status(200).json({
      status: 200,
      data: [
        {
          label: 'Offer Letter',
          path: userLetter.offerLetter,
          htmlContent: userLetter.offerletterHTML,
          offerLetterID: userLetter.offerLetterID,
        },
        {
          label: 'Joining Letter',
          path: userLetter.joiningLetter,
          htmlContent: userLetter.joiningletterHTML,
          joiningLetterID: userLetter.joiningLetterID,
        },
        {
          label: 'Appointment Letter',
          path: userLetter.appointmentLetter,
          htmlContent: userLetter.appointmentletterHTML,
          appointmentLetterID: userLetter.appointmentLetterID,
        },
        {
          label: 'Experience Letter',
          path: userLetter.experienceLetter,
          htmlContent: userLetter.experienceletterHTML,
          experienceLetterID: userLetter.experienceLetterID,
        },
        {
          label: 'Termination Letter',
          path: userLetter.terminationLetter,
          htmlContent: userLetter.terminationletterHTML,
          terminationLetterID: userLetter.terminationLetterID,
        },
      ],
    });
  } catch (err) {
    next(err);
  }
};

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
        attributes: ['companyName', 'companyLogo', 'companyMasterID'],
      },
      {
        separate: true,
        required: false,
        model: EmployeeJoiningDetails,
        attributes: [
          'employeeCode',
          'joiningDate',
          'dob',
          'adharCard',
          'employment',
        ],
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
        attributes: ['branchID'],
        include: [
          {
            model: BranchMaster,
            as: 'branchMaster',
            attributes: ['branchName', 'branchAddress'],
          },
        ],
      },
      {
        required: false,
        model: EmployeeDepartment,
        attributes: ['departmentID'],
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
            as: 'department',
            attributes: ['departmentName'],
          },
        ],
      },
      {
        required: false,
        model: EmployeeDesignation,
        attributes: ['designationID'],
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
            as: 'designation',
            attributes: ['designationName'],
          },
        ],
      },
      {
        required: false,
        model: UserReportTO,
        include: [
          {
            model: UserMaster,
            as: 'reportTo',
            attributes: ['displayName'],
          },
        ],
        attributes: ['reportToID'],
      },
    ],

    attributes: [
      'email',
      'displayName',
      'userNumber',
      'userMasterID',
      'companyMasterId',
      'localDisplayName',
    ],
  });

  return data;
}

//postAddUserLetters
async function generateLetter(
  userMasterID,
  letterDetails,
  lettertype,
  createBy,
  createByIp
) {
  let cont;
  try {
    const date = new Date().toISOString().slice(0, 10);
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
        : '';

    const Department =
      EmployeeData.employeeDepartments &&
      EmployeeData.employeeDepartments.length > 0 &&
      EmployeeData.employeeDepartments[0].department
        ? EmployeeData.employeeDepartments[0].department.departmentName
        : '';

    const Designation =
      EmployeeData.employeeDesignations &&
      EmployeeData.employeeDesignations.length > 0 &&
      EmployeeData.employeeDesignations[0].designation
        ? EmployeeData.employeeDesignations[0].designation.designationName
        : '';

    const ReportTOPerson =
      EmployeeData.employeeReportTos &&
      EmployeeData.employeeReportTos.length > 0 &&
      EmployeeData.employeeReportTos[0].reportTo
        ? EmployeeData.employeeReportTos[0].reportTo.displayName
        : '';

    const BranchAddress =
      EmployeeData.employeeBranches &&
      EmployeeData.employeeBranches.length > 0 &&
      EmployeeData.employeeBranches[0].branchMaster
        ? EmployeeData.employeeBranches[0].branchMaster.branchAddress
        : '';

    const CompanyName = EmployeeData.companyMaster.companyName;
    const UserName = EmployeeData.localDisplayName
      ? `${EmployeeData.displayName} ( ${EmployeeData.localDisplayName} )`
      : EmployeeData.displayName;

    const UserNumber = EmployeeData.userNumber;

    const DateOfBirth =
      Employeejoining && Employeejoining.dob
        ? Employeejoining.dob.split('-').reverse().join('-')
        : '';

    const employeement =
      Employeejoining && Employeejoining.employment
        ? Employeejoining.employment
        : '';

    const currentDateTime = new Date().toISOString();

    const employeecode =
      Employeejoining && Employeejoining.employeeCode
        ? Employeejoining.employeeCode
        : '';
    // Contractor
    const contractorData =
      Employeejoining && Employeejoining.contractor
        ? Employeejoining.contractor
        : null;

    let contractorAddressData = contractorData
      ? `${contractorData.contractorAddress ? contractorData.contractorAddress + ',' : ''} ${contractorData.cityMaster.cityName}, ${contractorData.cityMaster.stateMaster.stateName}, ${contractorData.cityMaster.stateMaster.countryMaster.countryName}`
      : '';

    contractorAddressData =
      contractorData && contractorData.localAddress
        ? `${contractorAddressData} ( ${contractorData.localAddress} )`
        : contractorAddressData;

    let contractorName = contractorData ? contractorData.contractorName : '';
    contractorName =
      contractorData && contractorData.localName
        ? `${contractorName} ( ${contractorData.localName} )`
        : contractorName;

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[EmployeeCode]')
      .join(employeecode);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[contractorName]')
      .join(contractorName);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[contractorAddress]')
      .join(contractorAddressData);

    const Email = EmployeeData.email;

    const JoiningDate =
      Employeejoining && Employeejoining.joiningDate
        ? Employeejoining.joiningDate.split('-').reverse().join('-')
        : '';

    const AdharcardNo =
      Employeejoining && Employeejoining.adharCard
        ? Employeejoining.adharCard
        : '';
    const shiftName = await getEmployeeShift(userMasterID, date);
    const systemDate = new Date()
      .toISOString()
      .slice(0, 10)
      .split('-')
      .reverse()
      .join('-');

    const PageBreak = `<div class="pageBreak"> </div>`;
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[PageBreak]')
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

    const DATA = await getSalaryStructureHTML(userMasterID);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[CTC]')
      .join(DATA.CTC);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Net]')
      .join(DATA.Net);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Gross]')
      .join(DATA.Gross);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[MonthlyCTC]')
      .join(DATA.MonthlyCTC);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[MonthlyNet]')
      .join(DATA.MonthlyNet);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[MonthlyGross]')
      .join(DATA.MonthlyGross);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[SalaryStructure]')
      .join(DATA.SalaryStructure);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Address]')
      .join(await getAddress(userMasterID));
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[CompanyName]')
      .join(CompanyName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[UserName]')
      .join(UserName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[UserNumber]')
      .join(UserNumber);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[DateOfBirth]')
      .join(DateOfBirth);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[EmployeementType]')
      .join(employeement);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Email]')
      .join(Email);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[ShiftName]')
      .join(shiftName);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Branch]')
      .join(Branch);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[BranchAddress]')
      .join(BranchAddress);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Designation]')
      .join(Designation);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[Department]')
      .join(Department);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[JoiningDate]')
      .join(JoiningDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[SystemDate]')
      .join(systemDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[CurrentDate]')
      .join(systemDate);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[CurrentDateTime]')
      .join(currentDateTime);
    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[EmployeeName]')
      .join(UserName);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[EmployeeNumber]')
      .join(UserNumber);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[EmployeeEmailid]')
      .join(Email);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[AadhaarCardNumber]')
      .join(AdharcardNo);

    letterDetails.letterTemplate = letterDetails.letterTemplate
      .split('[ReportingPerson]')
      .join(ReportTOPerson);

    const companyId = EmployeeData.companyMasterId;
    let letterName;

    if (lettertype == 'terminationletter') {
      letterName = 'Termination Letter';
    } else if (lettertype == 'offerletter') {
      letterName = 'Offer Letter';
    } else if (lettertype == 'experienceletter') {
      letterName = 'Experience Letter';
    } else if (lettertype == 'joiningletter') {
      letterName = 'Joining Letter';
    } else if (lettertype == 'appointmentletter') {
      letterName = 'Appointment Letter';
    }

    if (letterDetails.letterHead == 'yes') {
      const companyDetails = await companyMaster.findOne({
        raw: true,
        where: { companyMasterID: companyId },
      });

      let base64 = '';

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
      const readFile = (name) => fs.promises.readFile(name, 'utf-8');

      const filePath = getTemplate('preboardingLetterHead');
      companyDetails.base64 = base64;
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const headerTemplate = template(companyDetails);

      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: letterName };
      const pdfBuffer = await generatePDF(
        'preboardingOfferLetter',
        data1,
        headerTemplate
      );

      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}.pdf`
      );
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    } else if (letterDetails.letterHead == 'no') {
      cont = `<div class="main1" style="font-size: 12px !important">${letterDetails.letterTemplate}</div>`;
      const data1 = { content: cont, letterName: letterName };
      const pdfBuffer = await generatePDF(
        'preboardingOfferLetter',
        data1,
        null
      );

      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}.pdf`
      );
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    } else {
      const companyDetails = await companyMaster.findOne({
        raw: true,
        where: { companyMasterID: companyId },
        attributes: ['letterHead'],
      });

      if (companyDetails.letterHead && companyDetails.letterHead != '') {
        imagePath =
          process.env.APIURL +
          `uploads/company/letterHead/${companyDetails.letterHead}`;
      }else{
        return 'Company letter head not found! Please upload company letter head.';
      }

      const cont = `<div class="main1">
        ${letterDetails.letterTemplate}
      </div>`;

      const data1 = {
        content: cont,
        letterName: letterName,
        letterHead: companyDetails.letterHead,
      };
      const pdfBuffer = await generateOfferLetterPdf(
        'preboardingOfferLetter',
        data1
      );
      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${lettertype}_${userMasterID}.pdf`
      );
      fs.writeFileSync(pdfFilePath, pdfBuffer);
    }
    const users = await UserLetters.findOne({
      where: {
        userMasterID: userMasterID,
      },
    });

    if (users) {
      if (lettertype === 'offerletter') {
        await UserLetters.update(
          {
            offerLetter: `${lettertype}_${userMasterID}.pdf`,
            offerletterHTML: cont,
            offerLetterID: letterDetails.offerLetterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          { where: { userLettersID: users.userLettersID } }
        );
      } else if (lettertype === 'joiningletter') {
        await UserLetters.update(
          {
            joiningLetter: `${lettertype}_${userMasterID}.pdf`,
            joiningletterHTML: cont,
            joiningLetterID: letterDetails.joiningLetterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          { where: { userLettersID: users.userLettersID } }
        );
      } else if (lettertype === 'experienceletter') {
        await UserLetters.update(
          {
            experienceLetter: `${lettertype}_${userMasterID}.pdf`,
            experienceletterHTML: cont,
            experienceLetterID: letterDetails.experienceLetterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          { where: { userLettersID: users.userLettersID } }
        );
      } else if (lettertype === 'terminationletter') {
        await UserLetters.update(
          {
            terminationLetter: `${lettertype}_${userMasterID}.pdf`,
            terminationletterHTML: cont,
            terminationLetterID: letterDetails.terminationLetterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          { where: { userLettersID: users.userLettersID } }
        );
      } else if (lettertype === 'appointmentletter') {
        await UserLetters.update(
          {
            userMasterID,
            appointmentLetter: `${lettertype}_${userMasterID}.pdf`,
            appointmentletterHTML: cont,
            appointmentLetterID: letterDetails.appointmentLetterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          { where: { userLettersID: users.userLettersID } }
        );
      }
    } else {
      if (lettertype === 'offerletter') {
        await UserLetters.create({
          userMasterID,
          offerLetter: `${lettertype}_${userMasterID}.pdf`,
          offerletterHTML: cont,
          offerLetterID: letterDetails.offerLetterID,
          createBy,
          createByIp,
        });
      } else if (lettertype === 'joiningletter') {
        await UserLetters.create({
          userMasterID,
          joiningLetter: `${lettertype}_${userMasterID}.pdf`,
          joiningletterHTML: cont,
          joiningLetterID: letterDetails.joiningLetterID,
          createBy,
          createByIp,
        });
      } else if (lettertype === 'experienceletter') {
        await UserLetters.create({
          userMasterID,
          experienceLetter: `${lettertype}_${userMasterID}.pdf`,
          experienceletterHTML: cont,
          experienceLetterID: letterDetails.experienceLetterID,
          createBy,
          createByIp,
        });
      } else if (lettertype === 'terminationLetter') {
        await UserLetters.create({
          userMasterID,
          terminationLetter: `${lettertype}_${userMasterID}.pdf`,
          terminationletterHTML: cont,
          terminationLetterID: letterDetails.terminationLetterID,
          createBy,
          createByIp,
        });
      } else if (lettertype === 'appointmentletter') {
        await UserLetters.create({
          userMasterID,
          appointmentLetter: `${lettertype}_${userMasterID}.pdf`,
          appointmentletterHTML: cont,
          appointmentLetterID: letterDetails.appointmentLetterID,
          createBy,
          createByIp,
        });
      }
    }
  } catch (err) {
    console.error('Error generating letter:', err);
  }
}

exports.postAddUserLetters = async (req, res, next) => {
  try {
    const {
      userMasterID,
      lettertype,
      offerLetterID,
      joiningLetterID,
      experienceLetterID,
      terminationLetterID,
      appointmentLetterID,
    } = req.body;

    const createBy = req.userDetails.userMasterId;
    const createByIp = req.userDetails.userIpAddress;

    let letterDetails;
    if (lettertype === 'offerletter') {
      letterDetails = await OfferLetter.findOne({
        raw: true,
        where: { offerLetterID: offerLetterID },
      });
    } else if (lettertype === 'joiningletter') {
      letterDetails = await JoiningLetter.findOne({
        raw: true,
        where: { joiningLetterID: joiningLetterID },
      });
    } else if (lettertype === 'experienceletter') {
      letterDetails = await ExperienceLetter.findOne({
        raw: true,
        where: { experienceLetterID: experienceLetterID },
      });
    } else if (lettertype === 'terminationletter') {
      letterDetails = await TerminationLetter.findOne({
        raw: true,
        where: { terminationLetterID: terminationLetterID },
      });
    } else if (lettertype === 'appointmentletter') {
      letterDetails = await AppointmentLetter.findOne({
        raw: true,
        where: { appointmentLetterID: appointmentLetterID },
      });
    } else {
      return res
        .status(401)
        .json({ status: 401, message: 'Letter type not found' });
    }

    // const user = await UserMaster.findOne({
    //   raw: true,
    //   where: { userMasterID: userMasterID },
    //   include: [{ model: companyMaster, attributes: ['companyName'] }],
    // });

    if (!letterDetails) {
      return res.status(200).json({ status: 401, message: 'letter not found' });
    }

    // const empjoining = await EmployeeJoiningDetails.findOne({
    //   raw: true,
    //   where: { userMasterID: userMasterID },
    // });

    const message = await generateLetter(
      userMasterID,
      letterDetails,
      // user,
      // empjoining,
      lettertype,
      createBy,
      createByIp
    );

    if(message && message != ''){
      return res.status(200).json({
        message: message,
        status: 401
      })
    }

    return res
      .status(200)
      .json({ status: 200, message: 'Letter generated successfully' });
  } catch (err) {
    next(err);
  }
};

async function getAddress(userMasterID) {
  let Address = '';
  const EmpAddress = await getEmployeeAddress(userMasterID);
  if (EmpAddress) {
    if (EmpAddress.houseNumber) Address += `${EmpAddress.houseNumber}, `;
    if (EmpAddress.houseName) Address += `${EmpAddress.houseName}, `;
    if (EmpAddress.landmark) Address += `${EmpAddress.landmark}, `;
    if (EmpAddress.area) Address += `${EmpAddress.area}, `;
    if (EmpAddress['cityMaster.cityName'])
      Address += `${EmpAddress['cityMaster.cityName']}, `;
    if (EmpAddress['cityMaster.stateMaster.stateName'])
      Address += `${EmpAddress['cityMaster.stateMaster.stateName']}, `;
    if (EmpAddress['cityMaster.stateMaster.countryMaster.countryName'])
      Address += `${EmpAddress['cityMaster.stateMaster.countryMaster.countryName']} `;
    if (EmpAddress.zipcode) Address += `${EmpAddress.zipcode}`;
    if (EmpAddress.localLangAddress)
      Address += `( ${EmpAddress.localLangAddress} )`;
  }
  return Address;
}

const editgenerateLetter = async (
  letterType,
  userMasterID,
  letterHTML,
  letterID,
  createBy,
  createByIp,
  letterDetails
) => {
  const date = new Date().toISOString().slice(0, 10);
  const PageBreak = `<div class="pageBreak"> </div>`;
  letterHTML = letterHTML.split('[PageBreak]').join(PageBreak);
  letterHTML = letterHTML
    .split('class="ql-align-right"')
    .join('style="text-align:right"');
  letterHTML = letterHTML
    .split('class="ql-align-center"')
    .join('style="text-align:center"');
  letterHTML = letterHTML
    .split('class="ql-align-justify"')
    .join('style="text-align:justify;text-justify: inter-word;"');

  const DATA = await getSalaryStructureHTML(userMasterID);
  letterHTML = letterHTML.split('[SalaryStructure]').join(DATA.SalaryStructure);

  const user = await UserMaster.findOne({
    raw: true,
    where: { userMasterID },
    include: [{ model: companyMaster, attributes: ['companyName'] }],
  });

  if (!user) {
    return { status: 401, message: `User not found` };
  }

  let letterName;

  if (letterType == 'terminationletter') {
    letterName = 'Termination Letter';
  } else if (letterType == 'offerletter') {
    letterName = 'Offer Letter';
  } else if (letterType == 'experienceletter') {
    letterName = 'Experience Letter';
  } else if (letterType == 'joiningletter') {
    letterName = 'Joining Letter';
  } else if (letterType == 'appointmentletter') {
    letterName = 'Appointment Letter';
  }

  if (letterDetails.letterHead == 'yes') {
    const companyDetails = await companyMaster.findOne({
      raw: true,
      where: { companyMasterID: user.companyMasterId },
    });

    let base64 = '';

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

    companyDetails.companyName = companyDetails.companyName || '';
    companyDetails.companyAddress = companyDetails.companyAddress || '';
    companyDetails.companyEmail = companyDetails.companyEmail || '';
    companyDetails.companyLogo = companyDetails.companyLogo || '';
    companyDetails.cpMobileNo = companyDetails.cpMobileNo || '';
    companyDetails.companyWebsite = companyDetails.companyWebsite || '';

    const imagePath = path.join(
      __dirname,
      `../uploads/company/logo/${companyDetails.companyLogo}`
    );

    base64Img.base64(imagePath, async (err, data) => {
      if (err) {
        console.error('Error:', err);
      } else {
        base64 = data;
      }

      const getTemplate = (type) =>
        path.join(__dirname, `../html/${type}.html`);
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

      const filePath = await getTemplate('preboardingLetterHead');
      companyDetails.base64 = base64;
      const file = await readFile(filePath);
      const template = Handlebars.compile(file);
      const headerTemplate = template(companyDetails);

      const content =
        `<div class="main1" style="font-size: 12px !important">` +
        letterHTML +
        `</div>`;
      const data1 = { content, letterName };
      const pdfBuffer = await generatePDF(
        'preboardingOfferLetter',
        data1,
        headerTemplate
      );
      const pdfFilePath = path.join(
        __dirname,
        `../uploads/letter/${letterType}_${userMasterID}.pdf`
      );
      require('fs').writeFileSync(pdfFilePath, pdfBuffer);
    });
  } else {
    const content =
      `<div class="main1" style="font-size: 12px !important">` +
      letterHTML +
      `</div>`;
    const data1 = { content, letterName };
    const pdfBuffer = await generatePDF('preboardingOfferLetter', data1, null);

    const pdfFilePath = path.join(
      __dirname,
      `../uploads/letter/${letterType}_${userMasterID}.pdf`
    );
    require('fs').writeFileSync(pdfFilePath, pdfBuffer);
  }

  const users = await UserLetters.findOne({
    where: { userMasterID },
  });

  if (users) {
    switch (letterType.toLowerCase()) {
      case 'offerletter':
        await UserLetters.update(
          {
            offerLetter: `${letterType}_${userMasterID}.pdf`,
            offerletterHTML: letterHTML,
            offerLetterID: letterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userLettersID: users.userLettersID },
          }
        );
        break;
      case 'joiningletter':
        await UserLetters.update(
          {
            joiningLetter: `${letterType}_${userMasterID}.pdf`,
            joiningletterHTML: letterHTML,
            joiningLetterID: letterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userLettersID: users.userLettersID },
          }
        );
        break;
      case 'experienceletter':
        await UserLetters.update(
          {
            experienceLetter: `${letterType}_${userMasterID}.pdf`,
            experienceletterHTML: letterHTML,
            experienceLetterID: letterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userLettersID: users.userLettersID },
          }
        );
        break;
      case 'terminationletter':
        await UserLetters.update(
          {
            terminationLetter: `${letterType}_${userMasterID}.pdf`,
            terminationletterHTML: letterHTML,
            terminationLetterID: letterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userLettersID: users.userLettersID },
          }
        );
        break;
      case 'appointmentletter':
        await UserLetters.update(
          {
            appointmentLetter: `${letterType}_${userMasterID}.pdf`,
            appointmentletterHTML: letterHTML,
            appointmentLetterID: letterID,
            updateBy: createBy,
            updateByIp: createByIp,
          },
          {
            where: { userLettersID: users.userLettersID },
          }
        );
      default:
        break;
    }
  } else {
    switch (letterType.toLowerCase()) {
      case 'offerletter':
        await UserLetters.create({
          userMasterID,
          offerLetter: `${letterType}_${userMasterID}.pdf`,
          offerletterHTML: letterHTML,
          offerLetterID: letterID,
          createBy,
          createByIp,
        });
        break;
      case 'joiningletter':
        await UserLetters.create({
          userMasterID,
          joiningLetter: `${letterType}_${userMasterID}.pdf`,
          joiningletterHTML: letterHTML,
          joiningLetterID: letterID,
          createBy,
          createByIp,
        });
        break;
      case 'experienceletter':
        await UserLetters.create({
          userMasterID,
          experienceLetter: `${letterType}_${userMasterID}.pdf`,
          experienceletterHTML: letterHTML,
          experienceLetterID: letterID,
          createBy,
          createByIp,
        });
        break;
      case 'terminationletter':
        await UserLetters.create({
          userMasterID,
          terminationLetter: `${letterType}_${userMasterID}.pdf`,
          terminationletterHTML: letterHTML,
          terminationLetterID: letterID,
          createBy,
          createByIp,
        });
        break;
      case 'appointmentletter':
        await UserLetters.create({
          userMasterID,
          appointmentLetter: `${letterType}_${userMasterID}.pdf`,
          appointmentletterHTML: letterHTML,
          appointmentLetterID: letterID,
          createBy,
          createByIp,
        });
      default:
        break;
    }
  }
  return { status: 200, message: `${letterType} Updated Successfully` };
};

exports.postUpdateUserLetters = async (req, res, next) => {
  try {
    const {
      userMasterID,
      lettertype,
      offerLetterID,
      joiningLetterID,
      experienceLetterID,
      terminationLetterID,
      appointmentLetterID,
      createBy,
      createByIp,
    } = await req.body;

    let {
      offerletterHTML,
      joiningletterHTML,
      experienceletterHTML,
      terminationletterHTML,
      appointmentletterHTML,
    } = req.body;
    let letterDetails;
    switch (lettertype) {
      case 'offerletter':
        letterDetails = await OfferLetter.findOne({
          raw: true,
          where: { offerLetterID },
        });
        return res
          .status(200)
          .json(
            await editgenerateLetter(
              'OfferLetter',
              userMasterID,
              offerletterHTML,
              offerLetterID,
              createBy,
              createByIp,
              letterDetails
            )
          );

      case 'joiningletter':
        letterDetails = await JoiningLetter.findOne({
          raw: true,
          where: { joiningLetterID },
        });
        return res
          .status(200)
          .json(
            await editgenerateLetter(
              'JoiningLetter',
              userMasterID,
              joiningletterHTML,
              joiningLetterID,
              createBy,
              createByIp,
              letterDetails
            )
          );

      case 'experienceletter':
        letterDetails = await ExperienceLetter.findOne({
          raw: true,
          where: { experienceLetterID },
        });
        return res
          .status(200)
          .json(
            await editgenerateLetter(
              'ExperienceLetter',
              userMasterID,
              experienceletterHTML,
              experienceLetterID,
              createBy,
              createByIp,
              letterDetails
            )
          );

      case 'terminationletter':
        letterDetails = await TerminationLetter.findOne({
          raw: true,
          where: { terminationLetterID },
        });
        return res
          .status(200)
          .json(
            await editgenerateLetter(
              'TerminationLetter',
              userMasterID,
              terminationletterHTML,
              terminationLetterID,
              createBy,
              createByIp,
              letterDetails
            )
          );
      case 'appointmentletter':
        letterDetails = await AppointmentLetter.findOne({
          raw: true,
          where: { appointmentLetterID },
        });
        return res
          .status(200)
          .json(
            await editgenerateLetter(
              'AppointmentLetter',
              userMasterID,
              appointmentletterHTML,
              appointmentLetterID,
              createBy,
              createByIp,
              letterDetails
            )
          );

      default:
        return res
          .status(401)
          .json({ status: 401, message: 'letter type not found' });
    }
  } catch (err) {
    next(err);
  }
};

exports.postDeleteUserLetters = async (req, res, next) => {
  try {
    const { userMasterID, label } = await req.body;

    const userLetter = await UserLetters.findOne({
      where: { userMasterID: userMasterID },
    });

    if (userLetter) {
      if (label == 'Offer Letter') {
        await UserLetters.update(
          {
            offerLetter: '',
            offerletterHTML: '',
            offerLetterID: null,
          },
          {
            where: { userLettersID: userLetter.userLettersID },
          }
        );
      } else if (label == 'Joining Letter') {
        await UserLetters.update(
          {
            joiningLetter: '',
            joiningletterHTML: '',
            joiningLetterID: null,
          },
          {
            where: { userLettersID: userLetter.userLettersID },
          }
        );
      } else if (label == 'Experience Letter') {
        await UserLetters.update(
          {
            experienceLetter: '',
            experienceletterHTML: '',
            experienceLetterID: null,
          },
          {
            where: { userLettersID: userLetter.userLettersID },
          }
        );
      } else if (label == 'Termination Letter') {
        await UserLetters.update(
          {
            terminationLetter: '',
            terminationletterHTML: '',
            terminationLetterID: null,
          },
          {
            where: { userLettersID: userLetter.userLettersID },
          }
        );
      } else if (label == 'Appointment Letter') {
        await UserLetters.update(
          {
            appointmentLetter: '',
            appointmentletterHTML: '',
            appointmentLetterID: null,
          },
          {
            where: { userLettersID: userLetter.userLettersID },
          }
        );
      }

      return res
        .status(200)
        .json({ status: 200, message: 'Letter Deleted Successfully' });
    }

    return res.status(200).json({ status: 401, message: 'Not valid data' });
  } catch (err) {
    next(err);
  }
};

const { join } = require('path');
const { readFileSync } = require('fs');
const { launch } = require('puppeteer');
const { template, templateSettings } = require('lodash');
const { month_dict } = require('../utils/commonUtilFunctions');

async function generatePDF(htmlFileName, obj, headerTemplate) {
  try {
    const templatePath = join(__dirname, '../html/', `${htmlFileName}.html`);

    templateSettings.interpolate = /{{([\s\S]+?)}}/g;
    let content = readFileSync(templatePath, 'utf-8');
    const compiled = template(content);
    content = compiled(obj);

    const browser = await launch({
      // headless: true,
      headless: 'new',
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(content, {
      waitUntil: 'domcontentloaded',
    });
    await page.emulateMediaType('screen');

    if (headerTemplate) {
      const pdfBuffer = await page.pdf({
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: headerTemplate,
        footerTemplate: `
          <div style="width: 100%; font-size: 10px; color: #000; padding: 0 75px;">
            <div style="border-top: 1px solid black; width: 100%; margin-bottom: 60px;"></div>
          </div>
        `,
        margin: {
          top: '240px',
          bottom: '140px',
          right: '60px',
          left: '60px',
        },
        preferCSSPageSize: true,
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    } else {
      const pdfBuffer = await page.pdf({
        format: 'A4',
        displayHeaderFooter: false,
        margin: {
          top: '240px',
          bottom: '140px',
          right: '60px',
          left: '60px',
        },
        preferCSSPageSize: true,
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    }
  } catch (error) {
    console.log('Error in Generate PDF Function', error);
  }
}

const HRSalaryMaster = require('../models/hrSalaryMaster');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const GradeStructure = require('../models/gradeStructure');
const HRSalaryFields = require('../models/hrSalaryFields');
const Payheadmaster = require('../models/payhead');
const Sequelize = require('sequelize');
const JoiningLetter = require('../models/joiningLetter');
const EmployeeShift = require('../models/employeeShift');
const Shift = require('../models/shift');
const EmployeeBranch = require('../models/employeeBranch');
const BranchMaster = require('../models/branchMaster');
const EmployeeDepartment = require('../models/employeeDepartment');
const Department = require('../models/department');
const EmployeeDesignation = require('../models/employeeDesignation');
const Designation = require('../models/designation');
const mailTemplateEditor = require('../models/mailTemplateEditor');
const ExperienceLetter = require('../models/experienceletter');
const TerminationLetter = require('../models/terminationLetter');
const AppointmentLetter = require('../models/appointment');
const Contractor = require('../models/contractor');
const CityMaster = require('../models/citymaster');
const StateMaster = require('../models/statemaster');
const CountryMaster = require('../models/countrymaster');
const BankMaster = require('../models/bankMaster');

async function getSalaryStructureHTML(userMasterID) {
  let finalOBJ = {
    CTC: '',
    Net: '',
    Gross: '',
    MonthlyCTC: '',
    MonthlyNet: '',
    MonthlyGross: '',
    SalaryStructure: '',
  };
  const salaryMasterdata = await HRSalaryMaster.findAll({
    raw: true,
    where: {
      userMasterID: userMasterID,
      '$gradeSalaryStructure.hrSalaryField.payheadMasterId$': {
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
          ['salaryfieldindex', 'ASC'],
          [
            { model: HRSalaryFields, model: Payheadmaster },
            'payheadName',
            'ASC',
          ],
        ],
      },
    ],
    attributes: [
      [
        Sequelize.col(
          'gradeSalaryStructure.hrSalaryField.Payheadmaster.payheadName'
        ),
        'payheadName',
      ],
      'EmployeeSalaryAmount',
      'salaryFromYYYYMM',
      [
        Sequelize.col('gradeSalaryStructure.gradeStructure.baseOnCalculation'),
        'baseOnCalculation',
      ],
      [Sequelize.col('gradeSalaryStructure.formula'), 'formula'],
      [
        Sequelize.col('gradeSalaryStructure.hrSalaryField.salaryFieldSrNo'),
        'salaryFieldSrNo',
      ],
      [
        Sequelize.col('gradeSalaryStructure.hrSalaryField.payheadMasterId'),
        'payheadMasterId',
      ],
      [
        Sequelize.col('gradeSalaryStructure.hrSalaryField.considerIn'),
        'considerIn',
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
      if (item.salaryFieldSrNo === 'A' && item.considerIn != 'net') {
        groupedData[month].A.push(item);
      } else if (item.salaryFieldSrNo === 'B') {
        groupedData[month].B.push(item);
      } else if (item.salaryFieldSrNo === 'A' && item.considerIn == 'net') {
        groupedData[month].AB.push(item);
      } else if (item.salaryFieldSrNo === 'C') {
        groupedData[month].C.push(item);
      }
    }

    if (item.payheadMasterId == 1) {
      groupedData[month].ctc.push({
        ...item,
        salaryFieldSrNo: '',
        considerIn: '',
      });

      finalOBJ.MonthlyCTC = +item.EmployeeSalaryAmount;
      finalOBJ.CTC = +item.EmployeeSalaryAmount * 12;
    }

    if (item.payheadMasterId == 50) {
      groupedData[month].gross.push({
        ...item,
        salaryFieldSrNo: '',
        considerIn: '',
      });

      finalOBJ.MonthlyGross = +item.EmployeeSalaryAmount;
      finalOBJ.Gross = +item.EmployeeSalaryAmount * 12;
    }

    if (item.payheadMasterId == 92) {
      groupedData[month].netPay.push({
        ...item,
        salaryFieldSrNo: '',
        considerIn: '',
      });

      finalOBJ.MonthlyNet = +item.EmployeeSalaryAmount;
      finalOBJ.Net = +item.EmployeeSalaryAmount * 12;
    }
  });

  // Sort the grouped data by year and month
  const sortedKeys = Object.keys(groupedData).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  // Create the result array with the sums and categories
  const result = sortedKeys.map((key) => {
    const group = groupedData[key];
    const { A, gross, B, AB, netPay, C, ctc } = group;

    return [...A, ...gross, ...B, ...AB, ...netPay, ...C, ...ctc];

    // CheckListNames.push(key);

    // return items.concat(
    //   {
    //     payheadName: 'Gross',
    //     EmployeeSalaryAmount: A,
    //     salaryFromYYYYMM: '',
    //     salaryFieldSrNo: '',
    //     formula: '',
    //     baseOnCalculation: '',
    //   },
    //   {
    //     payheadName: 'Net Pay',
    //     EmployeeSalaryAmount: +A - +B,
    //     salaryFromYYYYMM: '',
    //     salaryFieldSrNo: '',
    //     formula: '',
    //     baseOnCalculation: '',
    //   },
    //   {
    //     payheadName: 'CTC',
    //     EmployeeSalaryAmount: +A + +C,
    //     salaryFromYYYYMM: '',
    //     salaryFieldSrNo: '',
    //     formula: '',
    //     baseOnCalculation: '',
    //   }
    // );
  });

  if (result.length == 0) return finalOBJ;

  const finalData = result[result.length - 1];
  let salaryType = finalData?.[0].baseOnCalculation || '';

  // const finalData = [];
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == 'A') {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == 'Gross') {
  //     finalData.push(item);
  //     finalOBJ.MonthlyGross = +item.EmployeeSalaryAmount;
  //     finalOBJ.Gross = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == 'B') {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == 'Net Pay') {
  //     finalData.push(item);
  //     finalOBJ.MonthlyNet = +item.EmployeeSalaryAmount;
  //     finalOBJ.Net = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }
  // for (var item of data) {
  //   if (item.salaryFieldSrNo == 'C') {
  //     finalData.push(item);
  //     salaryType = item.baseOnCalculation;
  //   }
  // }
  // for (var item of data) {
  //   if (item.payheadName == 'CTC') {
  //     finalData.push(item);
  //     finalOBJ.MonthlyCTC = +item.EmployeeSalaryAmount;
  //     finalOBJ.CTC = +item.EmployeeSalaryAmount * 12;
  //     break;
  //   }
  // }

  let html = `<table  border='1' id='SalaryStructureOfUser'
  style='border:1px solid black;border-collapse: collapse;'><tr><th colspan="5" style="text-align: center; background-color: lightgray">Salary Structure</th></tr>
  <tr>
    <th style="text-align: center;padding : 2px">Payhead Name</th>
    <th style="text-align: center;padding : 2px">Group</th>
    <th style="text-align: center;padding : 2px">Amount(Monthly)</th>
    <th style="text-align: center;padding : 2px">Amount(Yearly)</th>
  </tr>`;

  for (var item of finalData) {
    let tempData = '<tr>';

    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      item.payheadName +
      '</td>';
    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      item.salaryFieldSrNo +
      '</td>';
    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      item.EmployeeSalaryAmount +
      '</td>';
    let amt = salaryType == 'M' ? +item.EmployeeSalaryAmount * 12 : '';
    tempData =
      tempData +
      '<td style="text-align: center;padding : 2px">' +
      amt +
      '</td>';

    tempData = tempData + '</tr>';
    html = html + tempData;
  }

  html = html + `</table>`;

  finalOBJ.SalaryStructure = html;

  if (salaryType != 'M') {
    finalOBJ.CTC = '';
    finalOBJ.Gross = '';
    finalOBJ.Net = '';
  }

  return finalOBJ;
}

async function getEmployeeShift(userid, date) {
  let shiftName = '';
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
        attributes: ['shiftName'],
      });
      shiftName = getShiftName ? getShiftName.shiftName : '';
    } else if (getShift.shiftsID && getShift.shiftsID.length) {
      const getShiftName = await Shift.findOne({
        raw: true,
        where: {
          shiftID: getShift.shiftsID[0],
        },
        attributes: ['shiftName'],
      });
      shiftName = getShiftName ? getShiftName.shiftName : '';
    }
  }
  return shiftName;
}

async function getUserLetter(userMasterID, latterType) {
  const currentDate = asiaKolkataDateTime(new Date()).slice(0, 10);

  const data = await UserLetters.findOne({
    where: {
      userMasterID,
    },
    include: [
      {
        required: true,
        model: UserMaster,
        attributes: ['email', 'displayName', 'userNumber', 'companyMasterId'],
        include: [
          {
            model: EmployeeJoiningDetails,
            attributes: ['employeeCode'],
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
            attributes: ['branchID'],
            include: [
              {
                model: BranchMaster,
                as: 'branchMaster',
                attributes: ['branchName'],
              },
            ],
          },
          {
            model: EmployeeDepartment,
            attributes: ['departmentID'],
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
                as: 'department',
                attributes: ['departmentName'],
              },
            ],
          },
          {
            model: EmployeeDesignation,
            attributes: ['designationID'],
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
                as: 'designation',
                attributes: ['designationName'],
              },
            ],
          },
          {
            model: UserReportTO,
            attributes: ['reportToID'],
          },
          {
            model: companyMaster,
            attributes: ['companyName', 'companyLogo'],
          },
        ],
      },
    ],
    attributes: [latterType],
  });

  return data;
}

exports.sendEmailOfferLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: 'Please Set Email in Notification Policy.',
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 9,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: 'Email template not found.',
      });
    }

    const data1 = await getUserLetter(userMasterID, 'offerLetter');

    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : '';
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : '';
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : '';
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : '';

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: 'User Email Not found.',
      });
    }
    // Replace placeholders in subject and body directly using empData properties
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    const offerLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        '..',
        'uploads',
        'letter',
        data1.offerLetter
      ),
      secure: fromtomail.secure,
    };

    sendOfferLetter(offerLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: "Offer Letter sent to employee's emailid successfully.",
    });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailJoinigLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: 'Please Set Email in Notification Policy.',
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 10,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: 'Email template not found.',
      });
    }

    const data1 = await getUserLetter(userMasterID, 'joiningLetter');
    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : '';
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : '';
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : '';
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : '';

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: 'User Email Not found.',
      });
    }
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    const offerLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        '..',
        'uploads',
        'letter',
        data1.joiningLetter
      ),
      secure: fromtomail.secure,
    };

    sendOfferLetter(offerLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: 'Joining Letter Email sent successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailExperienceLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: 'Please Set Email in Notification Policy.',
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 12,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: 'Email template not found.',
      });
    }

    const data1 = await getUserLetter(userMasterID, 'experienceLetter');

    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : '';
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : '';
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : '';
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : '';

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: 'User Email Not found.',
      });
    }
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    const experienceLetterLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        '..',
        'uploads',
        'letter',
        data1.experienceLetter
      ),
      secure: fromtomail.secure,
    };

    sendOfferLetter(experienceLetterLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: 'Experience Letter Email sent successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailTerminationLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: 'Please Set Email in Notification Policy.',
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 13,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: 'Email template not found.',
      });
    }

    const data1 = await getUserLetter(userMasterID, 'terminationLetter');

    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : '';
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : '';
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : '';
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : '';

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: 'User Email Not found.',
      });
    }
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    const terminationLetterLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        '..',
        'uploads',
        'letter',
        data1.terminationLetter
      ),
      secure: fromtomail.secure,
    };

    sendOfferLetter(terminationLetterLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: 'Termination Letter Email sent successfully',
    });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailAppointmentLetter = async (req, res, next) => {
  try {
    const { userMasterID, companyMasterID } = req.body;

    const fromtomail = await findCompanyNotificationPolicy(+companyMasterID);

    if (!fromtomail) {
      return res.status(200).json({
        status: 401,
        message: 'Please Set Email in Notification Policy.',
      });
    }

    const get_MailTemplate = await mailTemplateEditor.findOne({
      raw: true,
      where: {
        companyMasterID: companyMasterID,
        status: 1,
        mailTypeID: 11,
      },
    });

    if (!get_MailTemplate) {
      return res.status(200).json({
        status: 401,
        message: 'Email template not found.',
      });
    }

    const data1 = await getUserLetter(userMasterID, 'appointmentLetter');
    const userData = data1 ? data1.userMaster : null;
    const empJoining =
      data1 &&
      data1.userMaster.employeeJoiningDetails &&
      data1.userMaster.employeeJoiningDetails.length > 0
        ? data1.userMaster.employeeJoiningDetails[0]
        : '';
    const empBranch =
      data1 &&
      data1.userMaster.employeeBranchs &&
      data1.userMaster.employeeBranchs.length > 0
        ? data1.userMaster.employeeBranchs[0]
        : '';
    const empDepart =
      data1 &&
      data1.userMaster.employeeDepartments &&
      data1.userMaster.employeeDepartments.length > 0
        ? data1.userMaster.employeeDepartments[0]
        : '';
    const empDesig =
      data1 &&
      data1.userMaster.employeeDesignations &&
      data1.userMaster.employeeDesignations.length > 0
        ? data1.userMaster.employeeDesignations[0]
        : '';

    const recipientEmail = userData && userData.email ? userData.email : null;

    if (!recipientEmail) {
      return res.status(200).json({
        status: 401,
        message: 'User Email Not found.',
      });
    }
    // Replace placeholders in subject and body directly using empData properties
    get_MailTemplate.subject = get_MailTemplate.subject
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    get_MailTemplate.body = get_MailTemplate.body
      .replace('[EmployeeCode]', empJoining ? empJoining.employeeCode : '')
      .replace('[EmployeeName]', userData ? userData.displayName : '')
      .replace('[EmployeeNumber]', userData ? userData.userNumber : '')
      .replace(
        '[Branch]',
        empBranch && empBranch.branchMaster
          ? empBranch.branchMaster.branchName
          : ''
      )
      .replace(
        '[Department]',
        empDepart && empDepart.department
          ? empDepart.department.departmentName
          : ''
      )
      .replace(
        '[Designation]',
        empDesig && empDesig.designation
          ? empDesig.designation.designationName
          : ''
      );

    const appointmentLetterData = {
      host: fromtomail.hostmail,
      port: fromtomail.port,
      email: fromtomail.email,
      password: fromtomail.password,
      email_id: recipientEmail,
      filePath: path.join(
        __dirname,
        '..',
        'uploads',
        'letter',
        data1.appointmentLetter
      ),
      secure: fromtomail.secure,
    };

    sendOfferLetter(appointmentLetterData, get_MailTemplate);

    return res.status(200).json({
      status: 200,
      message: "Appointment Letter sent to employee's emailid successfully.",
    });
  } catch (err) {
    next(err);
  }
};
