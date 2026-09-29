/** @format */

const TicketStatusEnum = {
  CREATED: 'Created',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  CLOSED: 'Closed',
};

const TicketPriorityEnum = {
  HIGH: 'High',
  LOW: 'Low',
  MEDIUM: 'Medium',
};

const DatabaseOperationEnum = {
  CREATE: 'Create',
  GET: 'Get',
  UPDATE: 'Update',
  DELETE: 'Delete',
};

const SentimentMoodEnum = {
  SAD: 'sad',
  HAPPY: 'happy',
  STRESSED: 'stressed',
  ANGRY: 'angry',
  NOT_SURE: 'notSure',
  OK: 'ok',
};

const EmployeeGoalStatusEnum = {
  OPEN: 'Open',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
};

const PmsPolicyEnum = {
  FINANCIAL_YEAR: 'FinancialYear',
  CALENDAR_YEAR: 'CalendarYear',
};

const GoalTypeEnum = {
  INDIVIDUAL: 'Individual',
  GROUP: 'Group',
};

const GoalEvaluationPeriodEnum = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
  SEMI_ANNUALLY: 'Semi Annually',
};

const ReviewQuestionsResponseType = {
  RATING: 'Rating',
  TEXT: 'Text',
  GRADE: 'Grade',
  RATING_AND_TEXT: 'Rating and Text',
  GRADE_AND_TEXT: 'Grade and Text',
};

const PerformanceReviewStatus = {
  INITIATED: 'Initiated',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
};

const notificationCronTypes = {
  PUNCH_IN: 'punchIn',
  PUNCH_OUT: 'punchOut',
  HOLIDAY: 'holiday',
  BIRTHDAY: 'birthday',
  WORK_ANNIVERSARY: 'workAnniversary',
};

const notificationCronTimeType = {
  BEFORE: 'before',
  AFTER: 'after',
};

const notificationCronTimeFormat = {
  DAYS: 'days',
  MINUTES: 'minutes',
  HOURS: 'hours',
};

const EmployeeGatepassStatusEnum = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECT: 'Reject',
};
const EmployeeGatepassPurposeEnum = {
  COMPANY: 'Company',
  PERSONAL: 'Personal',
};
const EmployeeGatepassCheckStatusEnum = {
  CHECKOUT: 'Checkout',
  CHECKIN: 'Checkin',
  FINAL: 'FinalCheckin',
};
const mailCronTypes = {
  ATTENDANCE_REPORT: 'attendanceReport',
  LEAVE_REPORT: 'leaveReport',
  DAILY_PUNCH_IN_OUT: 'dailypuncinoutReport',
  DAILY_LEAVE: 'dailyleaveReport',
  VISIT_REPORT: 'visitReport',
  SHIFT_DEPARTMENTWISE_ATTENDANCE_COUNT_REPORT:
    'shiftdepartmentwiseDailyattendancecountReport',
  FY_LEAVE_REPORT: 'FYleaveReport',
  LC_EG_REPORT: 'lateComeEarlyGoReport',
  DEPARTMENTWISE_DAILY_COST_REPORT: 'departmentwiseDailyCostReport',
};
const roleType = {
  COMPANY_WISE: 'companyWise',
  BRANCH_WISE: 'branchWise',
};
const companyAccessType = {
  OWN_COMPANY: 'ownCompany',
  OWN_PLUS_CHILD_COMPANY: 'ownPlusChildCompany',
};

const FoodAllowanceTypeEnum = {
  NO_FOOD_ALLOWANCE: 'noFoodAllowance',
  ON_INOUT_TIME: 'onInOutTime',
  ON_WORKING_HOURS: 'onWorkingHours',
};

const TeaAllowanceTypeEnum = {
  NO_TEA_ALLOWANCE: 'noTeaAllowance',
  ON_IN_TIME: 'onInTime',
  ON_ATTN_STATUS: 'onAttnStatus',
};

const AllowanceTypeEnum = {
  FOOD_ALLOWANCE: 'food',
  TEA_ALLOEANCE: 'tea',
};

const JoiningRequestStatus = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECT: 'Reject',
};
const registrationStatus = {
  PENDING: 'Pending',
  REGISTERED: 'Registered',
};
const FileUploadType = {
  MOBILE_NUMBER: 'mobileNumber',
  EMPLOYEE_CODE: 'employeeCode',
};

const DateTimeType = {
  SEPERATED: 'seperate',
  COMBINED: 'combine',
};

const SkillCategoryType = {
  SKILLED: 'skilled',
  SEMISKILLED: 'semiskilled',
  UNSKILLED: 'unskilled',
};

const PenaltyDeductFromEnum = {
  ATTENDANCE: 'attendance',
  SALARY: 'salary',
};

const Nationality = [
  'Afghan',
  'Albanian',
  'Algerian',
  'Andorran',
  'Angolan',
  'Antiguan or Barbudan',
  'Argentine',
  'Armenian',
  'Australian',
  'Austrian',
  'Azerbaijani, Azeri',
  'Bahamian',
  'Bahraini',
  'Bengali',
  'Barbadian',
  'Belarusian',
  'Belgian',
  'Belizean',
  'Beninese, Beninois',
  'Bhutanese',
  'Bolivian',
  'Bosnian or Herzegovinian',
  'Motswana, Botswanan',
  'Brazilian',
  'Bruneian',
  'Bulgarian',
  'Burkinabé',
  'Burmese',
  'Burundian',
  'Cabo Verdean',
  'Cambodian',
  'Cameroonian',
  'Canadian',
  'Central African',
  'Chadian',
  'Chilean',
  'Chinese',
  'Colombian',
  'Comoran, Comorian',
  'Congolese',
  'Congolese',
  'Costa Rican',
  'Ivorian',
  'Croatian',
  'Cuban',
  'Cypriot',
  'Czech',
  'Danish',
  'Djiboutian',
  'Dominican',
  'Dominican',
  'Timorese',
  'Ecuadorian',
  'Egyptian',
  'Salvadoran',
  'Equatorial Guinean, Equatoguinean',
  'Eritrean',
  'Estonian',
  'Ethiopian',
  'Fijian',
  'Finnish',
  'French',
  'Gabonese',
  'Gambian',
  'Georgian',
  'German',
  'Ghanaian',
  'Gibraltar',
  'Greek, Hellenic',
  'Grenadian',
  'Guatemalan',
  'Guinean',
  'Bissau-Guinean',
  'Guyanese',
  'Haitian',
  'Honduran',
  'Hungarian, Magyar',
  'Icelandic',
  'Indian',
  'Indonesian',
  'Iranian, Persian',
  'Iraqi',
  'Irish',
  'Israeli',
  'Italian',
  'Ivorian',
  'Jamaican',
  'Japanese',
  'Jordanian',
  'Kazakhstani, Kazakh',
  'Kenyan',
  'I-Kiribati',
  'North Korean',
  'South Korean',
  'Kuwaiti',
  'Kyrgyzstani, Kyrgyz, Kirgiz, Kirghiz',
  'Lao, Laotian',
  'Latvian, Lettish',
  'Lebanese',
  'Basotho',
  'Liberian',
  'Libyan',
  'Liechtensteiner',
  'Lithuanian',
  'Luxembourg, Luxembourgish',
  'Macedonian',
  'Malagasy',
  'Malawian',
  'Malaysian',
  'Maldivian',
  'Malian, Malinese',
  'Maltese',
  'Marshallese',
  'Martiniquais, Martinican',
  'Mauritanian',
  'Mauritian',
  'Mexican',
  'Micronesian',
  'Moldovan',
  'Monégasque, Monacan',
  'Mongolian',
  'Montenegrin',
  'Moroccan',
  'Mozambican',
  'Namibian',
  'Nauruan',
  'Nepali',
  'Dutch, Netherlandic',
  'New Zealand, NZ, Zelanian',
  'Nicaraguan',
  'Nigerien',
  'Nigerian',
  'Northern Marianan',
  'Norwegian',
  'Omani',
  'Pakistani',
  'Palauan',
  'Palestinian',
  'Panamanian',
  'Papua New Guinean, Papuan',
  'Paraguayan',
  'Peruvian',
  'Filipino, Philippine',
  'Polish',
  'Portuguese',
  'Puerto Rican',
  'Qatari',
  'Romanian',
  'Russian',
  'Rwandan',
  'Kittitian or Nevisian',
  'Saint Lucian',
  'Saint Vincentian, Vincentian',
  'Samoan',
  'Sammarinese',
  'São Toméan',
  'Saudi, Saudi Arabian',
  'Senegalese',
  'Serbian',
  'Seychellois',
  'Sierra Leonean',
  'Singapore, Singaporean',
  'Slovak',
  'Slovenian, Slovene',
  'Solomon Island',
  'Somali',
  'South African',
  'South Sudanese',
  'Spanish',
  'Sri Lankan',
  'Sudanese',
  'Surinamese',
  'Swazi',
  'Swedish',
  'Swiss',
  'Syrian',
  'Tajikistani',
  'Tanzanian',
  'Thai',
  'Timorese',
  'Togolese',
  'Tokelauan',
  'Tongan',
  'Trinidadian or Tobagonian',
  'Tunisian',
  'Turkish',
  'Turkmen',
  'Tuvaluan',
  'Ugandan',
  'Ukrainian',
  'Emirati, Emirian, Emiri',
  'UK, British',
  'United States, U.S., American',
  'Uruguayan',
  'Uzbekistani, Uzbek',
  'Ni-Vanuatu, Vanuatuan',
  'Vatican',
  'Venezuelan',
  'Vietnamese',
  'Yemeni',
  'Zambian',
  'Zimbabwean',
];

const nonEditableList_INC = [
  'attendance bonus',
  'food allowance',
  'tea/coffee allowance',
  'extra days',
];
const default_payheadMasterIds = [
  9, 16, 17, 24, 34, 43, 78, 83, 96, 97, 99, 1, 50, 92, 67, 101,
];

const requiredUserTypeEnum = {
  National: '1',
  Expart: '2',
  Both: '3',
};

const leaveOperationENUM = {
  Encashment: 'Encashment',
  Lapse: 'Lapse',
  AddLeaveBalance: 'AddLeaveBalance',
  cancelLeaveEncashment: 'cancelLeaveEncashment',
  cancelLeaveEncashmentAndLapse: 'cancelLeaveEncashmentAndLapse',
};

const leaveEncashmentStatusEnum = {
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  UNPAID: 'Un-Paid',
  LAPSED: 'Lapsed',
};

const employeeRepaymentType = {
  ADVANCE: 'Advance',
  PENALTY: 'Penalty',
};

const paymentMode = {
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  UPI: 'UPI',
  WAIVE_OFF: 'Waive Off',
  NETBANKING: 'NetBanking',
};

const weekoffTypeEnum = {
  FIX: 'fix',
  MONTHLYFIX: 'monthlyFix',
  ONPRESENTDAY: 'onPresentDay',
};

const yearCycleEnum = {
  JAN_DEC: 'January to December',
  APRIL_MARCH: 'April to March',
};

const bonusCreditCycleEnum = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  HALFYEARLY: 'halfYearly',
  YEARLY: 'yearly',
};

const bonusCreditTypeEnum = {
  PREVIOUS: 'previous',
  CURRENT: 'current',
};

const bonusPaymentMode = {
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  UPI: 'UPI',
};

const frequencyENUM = {
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  FORTNIGHT: 'fortnight',
  MONTHLY: 'monthly',
};

const bonusPaymentType = {
  PAID: 'Paid',
  UNPAID: 'Un-Paid',
};

const PayrollFrequencyType = {
  MONTHLY: 'Monthly',
  FORTNIGHTLY: 'Fortnightly',
  WEEKLY: 'Weekly',
};

const TaxApplicabilityType = {
  TAXABLE: 'TX',
  NON_TAXABLE: 'NT',
  NOT_APPLICABLE: 'NA',
};

const letterTypesENUM = {
  TERMINATIONLETTER: 'terminationletter',
  OFFERLETTER: 'offerletter',
  EXPERIENCELETTER: 'experienceletter',
  JOININGLETTER: 'joiningletter',
  APPOINTMENTLETTER: 'appointmentletter',
};

const mailTemplateTypes = {
  leaveEmailTemplate: 1,
  expenseMailTemplate: 2,
  leaveRejectEmailTemplate: 3,
  leaveAcceptEmailTemplate: 4,
  expenseAcceptMailTemplate: 5,
  expenseRejectMailTemplate: 6,
  leaveUpdateEmailTemplate: 7,
  expenseUpdateMailTemplate: 8,
  offerLetterMailTemplate: 9,
  joiningLetterMailTemplate: 10,
  appointmentLetterMailTemplate: 11,
  experienceLetterMailTemplate: 12,
  terminationLetterMailTemplate: 13,
  incrementLetterMailTemplate: 14,
  outdoorDutyEmailTemplate: 15,
  outdoorDutyRejectEmailTemplate: 16,
  outdoorDutyAcceptEmailTemplate: 17,
  jobApplicationAcceptMailTemplate: 18,
  discrepancyMailTemplate: 19,
  jobApplicationRejectMailTemplate: 20,
  preBoardingAcceptMailTemplate: 21,
  preBoardingRejectMailTemplate: 22,
  preBoardingApplicationAcknowledgementMailTemplate: 23,
  jobApplicationAcknowledgementMailTemplate: 24,
};

const letterTemplateTypes = {
  offerLetterTemplate: 1,
  joiningLetterTemplate: 2,
  experienceLetterTemplate: 3,
  incrementLetterTemplate: 4,
  terminationLetterTemplate: 5,
  appointmentLetterTemplate: 6,
  discrepancyLetterTemplate: 7,
};

const authorizationMasterTypes = {
  leave: 1,
  expense: 2,
  overtime: 3,
  resignation: 5,
  employeeGatePass: 6,
  attendanceCorrection: 7,
  compensatoryOff: 8,
};

const organizationAuthorizationMasterTypes = {
  officeExpense: 1,
};

const officeExpenseAdvanceTransactionType = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
};

const InterViewTypeENUM = {
  VIRTUAL: 'virtual',
  INPERSON: 'inperson',
};

const preboardingStatusTypes = {
  SCREENING: 'Screening',
  INTERVIEW: 'Interview',
  ACCEPT: 'Accept',
  REJECT: 'Reject',
  ONHOLD: 'OnHold',
  ONBOARDED: 'OnBoarded',
  HRROUND: 'HR Round',
};

const customizeProfileFields = {
  companyName: 'Company Name',
  address: 'Address',
  employeeCode: 'Employee Code',
  employeeName: 'Employee Name',
  email: 'Email',
  contactNo: 'Contact No',
  department: 'Department',
  designation: 'Designation',
  branchName: 'Branch Name',
  dateOfBirth: 'Date Of Birth',
};
const attendaceTransType = {
  biometricNotValidated: 0,
  biometricNC: 1,
  tpMirrorNotValidated: 3,
  tpMirrorNC: 4,
};

const attendanceTransactionType = {
  notValidated: 'Not Validated',
  notConsider: 'NC',
};

const attendanceDirection = {
  IN: 'in',
  OUT: 'out',
  NC: 'nc',
  NEWIN: 'NEWIN',
  CONTINUEIN: 'CONTINUEIN',
};

const RegimeType = {
  NEW_REGIME: 'New Regime',
  OLD_REGIME: 'Old Regime',
};

const allowedAttendanceSources = ['mobile', 'biometric', 'mobileandbiometric'];

const attendanceFromType = {
  MOBILE: 'mobile',
  BIOMETRIC: 'biometric',
  TPMIRROR: 'tpmirror',
  MOBILEANDBIOMETRIC: 'mobileandbiometric',
  MOBILEANDTPMIRROR: 'mobileandtpmirror',
};

const singleMultiplePunchInPunchOutTypes = {
  SINGLE: 'Single',
  MULTIPLE: 'Multiple',
};

const expenseTypeArray = [
  { name: 'Personal', value: 'Personal' },
  { name: 'Project', value: 'Project' },
  { name: 'Tour', value: 'Tour' },
  { name: 'Visit', value: 'Visit' },
];

const expenseTypes = {
  ALL: 'All',
  PERSONAL: 'Personal',
  PROJECT: 'Project',
  TOUR: 'Tour',
  VISIT: 'Visit',
};

const authorizationCriteriaType = {
  ANYTWO: 3,
  ANYONE: 4,
  SEQUENCENO: 5,
  ANYTHREE: 6,
};

const expenseTypeArrayForDropDown = [
  { name: 'All', value: 'All' },
  { name: 'Personal', value: 'Personal' },
  { name: 'Project', value: 'Project' },
  { name: 'Tour', value: 'Tour' },
  { name: 'Visit', value: 'Visit' },
];

const expenseApprovalTypes = {
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PENDING: 'Pending',
  PAID: 'Paid',
};

const LCEGPenaltyTypeEnum = {
  MINUTE: 'min',
  DAY: 'day',
  PERCENT: 'percent',
  AMOUNT: 'amount',
};

const attendanceBranchTypeRule = {
  ALL: 'all',
  SELECTED: 'selected',
  ASSIGNED: 'assigned',
};

const updateBranchJob = [
  { Label: 'Branch', value: 'BRANCH' },
  { Label: 'Department', value: 'DEPARTMENT' },
  { Label: 'Designation', value: 'DESIGNATION' },
  { Label: 'Division', value: 'DIVISION' },
  { Label: 'Project', value: 'PROJECT' },
  { Label: 'Reports To', value: 'REPORTSTO' },
  { Label: 'Skill Category', value: 'SKILLCATEGORY' },
  { Label: 'Working Area', value: 'WORKINGAREA' },
  { Label: 'Working Location', value: 'WORKINGLOCATION' },
];

const updateBranchJobTypes = {
  BRANCH: 'BRANCH', //
  DEPARTMENT: 'DEPARTMENT', //
  DESIGNATION: 'DESIGNATION', //
  DIVISION: 'DIVISION', //
  PROJECT: 'PROJECT', //
  REPORTSTO: 'REPORTSTO', //
  SKILLCATEGORY: 'SKILLCATEGORY', //
  WORKINGAREA: 'WORKINGAREA', //
  WORKINGLOCATION: 'WORKINGLOCATION', //
};
const geoFenseType = {
  INSIDE: 'in',
  OUTSIDE: 'out',
  OFFLINE: 'offline',
  GPS_OFF: 'gpsOff',
};

const FormulaPreferenceEnum = {
  HIGHER: 'higher',
  LOWER: 'lower',
};

const PTCalculationEnum = {
  MONTHLY: 'monthly',
  HALFYEARLY: 'halfYearly',
};

const AsopalavComapnyIds_Attn = [277, 298];

module.exports = {
  AsopalavComapnyIds_Attn,
  PTCalculationEnum,
  FormulaPreferenceEnum,
  LCEGPenaltyTypeEnum,
  PenaltyDeductFromEnum,
  RegimeType,
  TaxApplicabilityType,
  PayrollFrequencyType,
  bonusPaymentMode,
  bonusCreditTypeEnum,
  bonusCreditCycleEnum,
  yearCycleEnum,
  weekoffTypeEnum,
  paymentMode,
  employeeRepaymentType,
  default_payheadMasterIds,
  nonEditableList_INC,
  TicketStatusEnum,
  TicketPriorityEnum,
  DatabaseOperationEnum,
  SentimentMoodEnum,
  EmployeeGoalStatusEnum,
  PmsPolicyEnum,
  GoalTypeEnum,
  GoalEvaluationPeriodEnum,
  ReviewQuestionsResponseType,
  PerformanceReviewStatus,
  notificationCronTypes,
  notificationCronTimeType,
  notificationCronTimeFormat,
  EmployeeGatepassStatusEnum,
  EmployeeGatepassPurposeEnum,
  EmployeeGatepassCheckStatusEnum,
  mailCronTypes,
  roleType,
  companyAccessType,
  FoodAllowanceTypeEnum,
  JoiningRequestStatus,
  registrationStatus,
  TeaAllowanceTypeEnum,
  AllowanceTypeEnum,
  FileUploadType,
  Nationality,
  DateTimeType,
  requiredUserTypeEnum,
  SkillCategoryType,
  leaveOperationENUM,
  leaveEncashmentStatusEnum,
  frequencyENUM,
  bonusPaymentType,
  letterTypesENUM,
  mailTemplateTypes,
  letterTemplateTypes,
  authorizationMasterTypes,
  InterViewTypeENUM,
  preboardingStatusTypes,
  customizeProfileFields,
  attendaceTransType,
  attendanceTransactionType,
  attendanceDirection,
  allowedAttendanceSources,
  attendanceFromType,
  singleMultiplePunchInPunchOutTypes,
  updateBranchJob,
  updateBranchJobTypes,
  expenseTypeArray,
  expenseTypes,
  authorizationCriteriaType,
  expenseTypeArrayForDropDown,
  expenseApprovalTypes,
  attendanceBranchTypeRule,
  geoFenseType,
  organizationAuthorizationMasterTypes,
  officeExpenseAdvanceTransactionType,
};
