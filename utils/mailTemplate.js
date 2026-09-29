const JobApplication = require('../models/jobApplication');
const companyMaster = require('../models/companyMaster');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const moment = require('moment');
const PreboardingMaster = require('../models/preboardingMaster');
const mailTemplateEditor = require('../models/mailTemplateEditor');
const { preboardingAppURL } = require('../utils/labelUtils');
const {
  InterViewTypeENUM,
  mailTemplateTypes,
  expenseTypes,
} = require('../utils/dbUtils');
const JobPosting = require('../models/jobPosting');
const Preboarding = require('../models/preboarding');
const CountryMaster = require('../models/countrymaster');
function jobMailtemplateReplacePlaceholders(template, data, mailTypeID) {
  let Remarks = '';

  let InterViewDate = '';
  let InterViewType = '';
  let InterViewTime = '';
  let BranchAddress = '';
  let InterViewLink = '';
  let PreBoardingFormLink = '';

  if (
    mailTypeID &&
    mailTypeID == mailTemplateTypes.jobApplicationAcceptMailTemplate
  ) {
    Remarks = data.acceptRemarks;
    InterViewDate = data.interViewDate
      ? moment(data.interViewDate, 'YYYY-MM-DD').format('DD-MM-YYYY')
      : '';
    InterViewType = data.interViewType;
    InterViewTime = data.interViewTime;
    BranchAddress =
      InterViewType == InterViewTypeENUM.INPERSON
        ? data.branchMaster.branchAddress
        : '';
    InterViewLink =
      InterViewType == InterViewTypeENUM.VIRTUAL
        ? `${data.interViewLink} `
        : '';
    PreBoardingFormLink = `${preboardingAppURL}${data?.preboardingMaster?.secretKey}?jobApplicationID=${data.jobApplicationID} `;
  }

  if (
    mailTypeID &&
    mailTypeID == mailTemplateTypes.jobApplicationRejectMailTemplate
  ) {
    Remarks = data.rejectionRemarks;
  }
  const middleName = data.middleName ? data.middleName : '';
  const finalData = template
    .replace(
      '[CandidateName]',
      `${data.firstName} ${middleName} ${data.lastName}`
    )
    .replace('[CandidateEmail]', data.email)
    .replace('[CandidateNumber]', data.userNumber)
    .replace('[CompanyName]', data.companyMaster?.companyName || '')
    .replace('[Branch]', data.branchMaster?.branchName || '')
    .replace('[Department]', data.department?.departmentName || '')
    .replace('[Designation]', data.designation?.designationName || '')
    .replace('[InterviewDate]', InterViewDate ? InterViewDate : '')
    .replace('[InterviewType]', InterViewType ? InterViewType : '')
    .replace('[Remarks]', Remarks ? Remarks : '')
    .replace('[InterviewTime]', InterViewTime ? InterViewTime : '')
    .replace('[InterViewAddress]', BranchAddress ? BranchAddress : '')
    .replace('[InterViewLink]', InterViewLink ? InterViewLink : '')
    .replace(
      '[PreBoardingFormLink]',
      PreBoardingFormLink ? PreBoardingFormLink : ''
    )
    .replace('[JobTitle]', data.jobPosting?.jobTitle || '')
    .replace('[JobLocation]', data.jobPosting?.jobLocation || '')
    .replace(
      '[JobAppliedDateTime]',
      moment(data.createdAt, 'YYYY-MM-DD').format('DD-MM-YYYY HH:mm:ss') || ''
    )
    .replace('[EmployeementType]', data.jobPosting?.employmentType || '')
    .replace('[JobLocation]', data.jobPosting?.jobLocation || '')
    .replace('[EmployeeType]', data.employeeType || '')
    .replace('[Nationality]', data.nationality || '');

  return finalData;
}

async function getJobMailtemplate(
  jobApplicationID,
  companyMasterID,
  mailTypeID,
  transaction
) {
  const get_MailTemplate = await mailTemplateEditor.findOne({
    where: {
      companyMasterID: companyMasterID,
      status: 1,
      mailTypeID: mailTypeID,
    },
  });

  if (!get_MailTemplate) return;

  const data = await JobApplication.findOne({
    where: {
      jobApplicationID,
    },
    transaction,
    include: [
      { model: companyMaster, attributes: ['companyName'] },
      { model: BranchMaster, attributes: ['branchName', 'branchAddress'] },
      { model: Department, attributes: ['departmentName'] },
      { model: Designation, attributes: ['designationName'] },
      { model: PreboardingMaster },
      { model: JobPosting },
    ],
  });
  if (!data) return;
  if (!data.email) return;
  get_MailTemplate.subject = jobMailtemplateReplacePlaceholders(
    get_MailTemplate.subject,
    data,
    mailTypeID
  );
  get_MailTemplate.body = jobMailtemplateReplacePlaceholders(
    get_MailTemplate.body,
    data,
    mailTypeID
  );

  return get_MailTemplate;
}

async function getPreboardingMailTemplate(
  preboardingID,
  companyMasterID,
  mailTypeID,
  transaction
) {
  const get_MailTemplate = await mailTemplateEditor.findOne({
    where: {
      companyMasterID: companyMasterID,
      status: 1,
      mailTypeID: mailTypeID,
    },
  });

  if (!get_MailTemplate) return;

  const data = await Preboarding.findOne({
    where: {
      preboardingID,
    },
    transaction,
    include: [
      { model: companyMaster, attributes: ['companyName'] },
      { model: BranchMaster, attributes: ['branchName', 'branchAddress'] },
      { model: Designation, attributes: ['designationName'] },
      { model: PreboardingMaster },
      { model: CountryMaster },
      {
        required: false,
        model: JobApplication,
      },
    ],
  });
  if (!data) return;
  if (!data.email) return;
  get_MailTemplate.subject = preboardingMailtemplateReplacePlaceholders(
    get_MailTemplate.subject,
    data,
    mailTypeID
  );
  get_MailTemplate.body = preboardingMailtemplateReplacePlaceholders(
    get_MailTemplate.body,
    data,
    mailTypeID
  );

  return get_MailTemplate;
}
function preboardingMailtemplateReplacePlaceholders(
  template,
  data,
  mailTypeID
) {
  let JoiningDate = '';
  let offeredCtC = '';
  let Remarks = '';
  if (
    mailTypeID &&
    mailTypeID == mailTemplateTypes.preBoardingAcceptMailTemplate
  ) {
    JoiningDate = moment(data.joiningDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
    offeredCtC = data.ctc;
    // Remarks = data.ctc;
  }
  const middleName = data.middleName ? data.middleName : '';
  const finalData = template
    .replace(
      '[CandidateName]',
      `${data.firstName} ${middleName} ${data.lastName}`
    )
    .replace('[CandidateEmail]', data.email)
    .replace(
      '[CandidateNumber]',
      `${data.countryMaster?.countryCode}-${data.userNumber}`
    )
    .replace('[CompanyName]', data.companyMaster?.companyName || '')
    .replace('[Branch]', data.branchMaster?.branchName || '')
    .replace(
      '[CandidateDOB]',
      moment(data.dob, 'YYYY-MM-DD').format('DD-MM-YYYY') || ''
    )
    .replace('[Designation]', data.designation?.designationName || '')
    .replace('[Remarks]', Remarks ? Remarks : '')
    .replace(
      '[PreBoardingAppliedDateTime]',
      moment(data.createdAt, 'YYYY-MM-DD').format('DD-MM-YYYY HH:mm:ss') || ''
    )
    .replace('[CandidateAddress]', data.address || '')
    .replace('[OfferedCTC]', data.ctc || '')
    .replace('[EmployeeType]', data.employeeType || '')
    .replace('[Nationality]', data.nationality || '')
    .replace('[CandidateJoiningDate]', data.joiningDate || '');

  return finalData;
}

function getExpenseMailTemplate(
  Expense_Category,
  Expense_Head,
  Amount,
  Description,
  userData,
  expenseType,
  expense_date,
  expenseMailTemplate,
  currentAuthUserData,
  rejectedReason
) {
  if (!userData) return;
  if (!expenseMailTemplate) return;

  const subject = expenseMailtemplateReplacePlaceholders(
    expenseMailTemplate.subject,
    userData,
    Expense_Category,
    Expense_Head,
    Amount,
    Description,
    expenseType,
    expense_date,
    currentAuthUserData,
    rejectedReason
  );
  const body = expenseMailtemplateReplacePlaceholders(
    expenseMailTemplate.body,
    userData,
    Expense_Category,
    Expense_Head,
    Amount,
    Description,
    expenseType,
    expense_date,
    currentAuthUserData,
    rejectedReason
  );

  return { body, subject };
}

function expenseMailtemplateReplacePlaceholders(
  template,
  userData,
  expenseCategory,
  expenseHead,
  Amount,
  Description,
  ExpenseType,
  expense_date,
  currentAuthUserData,
  rejectedReason
) {
  const finalData = template
    .replace(
      '[EmployeeCode]',
      userData.employeeJoiningDetails?.[0]?.employeeCode || ''
    )
    .replace('[EmployeeName]', userData.displayName)
    .replace('[EmployeeNumber]', userData.userNumber)
    .replace(
      '[Branch]',
      userData.employeeBranches?.[0]?.branchMaster?.branchName || ''
    )
    .replace(
      '[Department]',
      userData.employeeDepartments?.[0]?.department?.departmentName || ''
    )
    .replace(
      '[Designation]',
      userData.employeeDesignations?.[0]?.designation?.designationName || ''
    )
    .replace('[ExpenseType]', ExpenseType)
    .replace('[ExpenseCategory]', expenseCategory)
    .replace('[ExpenseHead]', expenseHead)
    .replace(
      '[ExpenseDate]',
      moment(expense_date, 'YYYY-MM-DD').format('DD-MM-YYYY') || ''
    )
    .replace('[Amount]', Amount || '')
    .replace('[ExpenseDescription]', Description || '')
    .replace('[AcceptedBy]', currentAuthUserData?.displayName || '')
    .replace('[RejectedBy]', currentAuthUserData?.displayName || '')
    .replace('[RejectedReason]', rejectedReason || '');

  return finalData;
}

module.exports = {
  getJobMailtemplate,
  getPreboardingMailTemplate,
  getExpenseMailTemplate,
};
