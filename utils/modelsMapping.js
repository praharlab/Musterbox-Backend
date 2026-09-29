const AuthorizationDetails = require('../models/AuthorizationDetails');
const ndacategory = require('../models/Ndacategory');
const UserTasks = require('../models/User_Tasks');
const AppVersion = require('../models/appVersion');
const Announcement = require('../models/announcement');
const AssetCategory = require('../models/assetCategory');
const assetMaster = require('../models/assetMaster');
const advancePayment = require('../models/advancePayment');
const attedanceCorrection = require('../models/attendanceCorrection');
const AttendancePolicy = require('../models/attendancePolicy');
const attendanceTransaction = require('../models/attendanceTransaction');
const AttendanceLogs = require('../models/attendancelogs');
const AuthorizationCriteriaMaster = require('../models/authorizationCriteriaMaster');
const authorizationMaster = require('../models/authorizationMaster');
const FormAuthorizationRequest = require('../models/authorizationRequest');
const BankMaster = require('../models/bankMaster');
const CallFollowup = require('../models/callfollowup');
const CityMaster = require('../models/citymaster');
const BiometricIntegration = require('../models/biometricIntegration');
const coffMaster = require('../models/coffMaster');
const CompanyDocumentType = require('../models/companyDocumentType');
const CompanyDocument = require('../models/companyDocument');
const CompanyLetterFormat = require('../models/companyLetterFormat');
const BranchMaster = require('../models/branchMaster');
const CompanyLetterhead = require('../models/companyLetterhead');
const companyMaster = require('../models/companyMaster');
const CompanyType = require('../models/companytypeMaster');
const companyRegister = require('../models/companyRegister');
const CompanywiseReport = require('../models/companywiseReport');
const CostCenter = require('../models/costCenter');
const Customer = require('../models/customer');
const CountryMaster = require('../models/countrymaster');
const DailyTask = require('../models/dailyTask');
const datewiseattendancePolicy = require('../models/datewiseAttendancepolicy');
const Department = require('../models/department');
const deposit = require('../models/deposit');
const depositcategory = require('../models/depositCategory');
const Designation = require('../models/designation');
const DocumentList = require('../models/documentList');
const empletterhead = require('../models/empLetterHead');
const EmployeeAttendancePolicy = require('../models/employeeAttendancePolicy');
const EmploeeAccident = require('../models/employeeAccident');
const EmployeeBranch = require('../models/employeeBranch');
const EmployeeDepartment = require('../models/employeeDepartment');
const EmployeeDesignation = require('../models/employeeDesignation');
const EmployeeEmployeement = require('../models/employeeEmployeement');
const employeeHolidayPolicy = require('../models/employeeHolidayPolicy');
const EmployeeDigitalSignature = require('../models/employeeDigitalSignature');
const EmployeeJoiningDetailsChanges = require('../models/employeeJoiningChanges');
const EmployeeJoiningDetails = require('../models/employeeJoiningDetails');
const EmployeePenalty = require('../models/employeePenalty');
const EmployeeNda = require('../models/employeeNda');
const EmployeeReportTo = require('../models/employeeReportTo');
const EmployeeSalaryPolicy = require('../models/employeeSalaryPolicy');
const EmployeeShift = require('../models/employeeShift');
const Employeeincentive = require('../models/employeeincentive');
const EmployeeWeekOff = require('../models/employeeWeekOff');
const Employeement = require('../models/employeement');
const ESICSetup = require('../models/esicSetup');
const erpAcountMasters = require('../models/erpAccountMaster');
const executionStatus = require('../models/executionstatus');
const ExpenseAuthorizationRequest = require('../models/expenseAuthorization');
const ExpenseHead = require('../models/expenseHead');
const AssignAssetToEmployee = require('../models/assignAssetToEmployee');
const ExpenseCategory = require('../models/expenseCategory');
const expensePayment = require('../models/expensePayment');
const Form16 = require('../models/form16');
const Form16child = require('../models/form16child');
const FormMaster = require('../models/formMaster');
const FormAuthorizationDetails = require('../models/formAuthorizationDetails');
const gatePass = require('../models/gatePass');
const GradeSalaryStructure = require('../models/gradeSalaryStructure');
const GradeStructure = require('../models/gradeStructure');
const holidayList = require('../models/holidayList');
const HrLeaveMaster = require('../models/hrLeaveMaster');
const HrLeaveTypes = require('../models/hrLeaveTypes');
const holidayPolicy = require('../models/holidayPolicy');
const HrLeaveBalance = require('../models/hrLeaveBalance');
const HrLeaveMonthlyTrans = require('../models/hrLeavesMonthlyTrans');
const HRSalaryMasterFields = require('../models/hrSalaryMaster');
const HRSalaryFieldChild = require('../models/hrSalaryFieldChild');
const HRSalarySlip = require('../models/hrSalarySlip');
const HRSalaryFields = require('../models/hrSalaryFields');
const HRSalaryTrasaction = require('../models/hrSalaryTransaction');
const hrToolkit = require('../models/hrToolKit');
const IncrementAuthorizationRequest = require('../models/incrementAuthorization');
const InvestmentDetails = require('../models/investmentdetails');
const LeaveAuthorizationRequest = require('../models/leaveAuthorization');
const LetterFields = require('../models/letterFields');
const letterhead = require('../models/letterHead');
const LetterTemplateType = require('../models/letterTemplateType');
const letterTemplateEditor = require('../models/letterTemplateEditor');
const LoanAdvance = require('../models/loanAdvance');
const Incentivetype = require('../models/incentivetype');
const LoanMaster = require('../models/loanMaster');
const LoanTransaction = require('../models/loanTransaction');
const mailfields = require('../models/mailFields');
const mailTemplateEditor = require('../models/mailTemplateEditor');
const MailConfiguration = require('../models/mailConfiguration');
const mailTemplateType = require('../models/mailTemplateType');
const manualOldAttendance = require('../models/manualOldAttendance');
const masterAdmin = require('../models/master_admin');
const meetingPlace = require('../models/meetingPlace');
const ModuleDetails = require('../models/moduleDetails');
const ModuleList = require('../models/moduleList');
const MonthlySkillsetsform = require('../models/monthlySkillsetsform');
const notificationPolicy = require('../models/notificationPolicy');
const OperationMaster = require('../models/operation');
const otherpaymentdetails = require('../models/otherpaymentdetails');
const overTimeCalculation = require('../models/overTimeCalculation');
const overTimePolicy = require('../models/overTimePolicy');
const overtimeAuthorizationRequest = require('../models/overtimeAuthorization');
const Payheadmaster = require('../models/payhead');
const Penalty = require('../models/penalty');
const PFetup = require('../models/pfSetup');
const PolicyDocuments = require('../models/policyDocuments');
const Preboarding = require('../models/preboarding');
const PreboardingFormCustomize = require('../models/preboardingformcustomize');
const PreboardingFormCustomizeValue = require('../models/preboardingformcustomizevalue');
const overTimeCalculationMain = require('../models/overTimeCalculationMain');
const PreboardingRequest = require('../models/preboardingrequest');
const Product = require('../models/product');
const ProbationPolicy = require('../models/probationPolicy');
const ProductMaster = require('../models/productMaster');
const ProfessionalTaxSetup = require('../models/professionalTaxSetup');
const QuarterTaxChallan = require('../models/quartertaxchallan');
const ProfessionalTaxSlabMaster = require('../models/professionaltaxmaster');
const ResignProcess = require('../models/resignProcess');
const EmployeeResignation = require('../models/resignation');
const ResignationTaskAssign = require('../models/resignTaskAssign');
const ResignationTask = require('../models/resignTask');
const ResignationAuthorizationRequest = require('../models/resignationAuthorization');
const Increment = require('../models/salaryIncrement');
const salaryIncrementChild = require('../models/salaryIncrementChild');
const SalaryPolicy = require('../models/salaryPolicy');
const Shift = require('../models/shift');
const ShiftTIme = require('../models/shiftTime');
const SkillsetsForm = require('../models/skillsetsform');
const SkillSets = require('../models/skillsets');
const StateMaster = require('../models/statemaster');
const CompanySubscriptionMaster = require('../models/subscriptionPlan');
const TaskRemark = require('../models/taskremark');
const TaskStages = require('../models/tasks_stages');
const TdsSlabMaster = require('../models/tdsslabmaster');
const TaxChallanMaster = require('../models/taxchallanmaster');
const Test = require('../models/test');
const TicketUpdates = require('../models/ticketUpdates');
const toursMaster = require('../models/toursMaster');
const Ticket = require('../models/ticket');
const Tracking = require('../models/tracking');
const UserAddress = require('../models/userAddress');
const UserAnnouncement = require('../models/userAnnouncement');
const TicketCategory = require('../models/ticketCategory');
const UserChats = require('../models/userChats');
const UserActivity = require('../models/userActivity');
const UserDocument = require('../models/userDocument');
const TicketSubCategory = require('../models/ticketSubCategory');
const UserEducation = require('../models/userEducation');
const UserExpense = require('../models/userExpense');
const UserExpenseTransaction = require('../models/userExpenseTransaction');
const UserExperience = require('../models/userExperience');
const UserLeaveTransaction = require('../models/userLeaveTransaction');
const UserLetters = require('../models/userLetters');
const UserMaster = require('../models/userMaster');
const UserLogs = require('../models/userLogs');
const UserSkills = require('../models/userSkills');
const UserTracking = require('../models/userTracking');
const userFamily = require('../models/userfamily');
const UserLeave = require('../models/userleave');
const vehicleUsage = require('../models/vehicleUsage');
const Visit = require('../models/visit');
const VisitPurpose = require('../models/visitPurpose');
const VisitReportMaster = require('../models/visitReportMaster');
const VisitFormCustomize = require('../models/visitformcustomize');
const visitors = require('../models/visitors');
const VisitFormCustomizeValue = require('../models/visitformcustomizevalue');
const VisitReportCustomize = require('../models/visitreportcustomize');
const VisitReportCustomizeValue = require('../models/visitreportcustomizevalue');
const weekOffPolicy = require('../models/weekOffPolicy');
const WeekOffOptions = require('../models/weekOffOptions');
const ExpensePriceRule = require('../models/expencePriceRule');
const weekoffHolidayTran = require('../models/weekoffHolidayTran');
const UserOverTimePolicyAssign = require('../models/userOverTimePolicyAssign');

exports.ModelsMapping = {
  ndacategory,
  advancePayment,
  AppVersion,
  UserTasks,
  AuthorizationDetails,
  AssetCategory,
  assetMaster,
  Announcement,
  attedanceCorrection,
  attendanceTransaction,
  AuthorizationCriteriaMaster,
  AssignAssetToEmployee,
  AttendanceLogs,
  AttendancePolicy,
  authorizationMaster,
  FormAuthorizationRequest,
  BankMaster,
  BiometricIntegration,
  CityMaster,
  coffMaster,
  CallFollowup,
  CompanyDocument,
  CompanyLetterFormat,
  CompanyDocumentType,
  BranchMaster,
  companyMaster,
  CompanyType,
  CompanyLetterhead,
  companyRegister,
  CompanywiseReport,
  CostCenter,
  CountryMaster,
  Department,
  deposit,
  depositcategory,
  empletterhead,
  Designation,
  DocumentList,
  EmploeeAccident,
  DailyTask,
  EmployeeAttendancePolicy,
  EmployeeBranch,
  EmployeeDepartment,
  EmployeeDesignation,
  EmployeeEmployeement,
  EmployeeDigitalSignature,
  EmployeeJoiningDetailsChanges,
  employeeHolidayPolicy,
  Customer,
  EmployeeReportTo,
  datewiseattendancePolicy,
  EmployeeShift,
  EmployeeJoiningDetails,
  EmployeeWeekOff,
  EmployeeNda,
  Employeeincentive,
  Employeement,
  executionStatus,
  erpAcountMasters,
  ExpensePriceRule,
  ExpenseAuthorizationRequest,
  EmployeeSalaryPolicy,
  ExpenseCategory,
  ExpenseHead,
  gatePass,
  FormAuthorizationDetails,
  ESICSetup,
  expensePayment,
  Form16,
  Form16child,
  GradeSalaryStructure,
  GradeStructure,
  FormMaster,
  EmployeePenalty,
  holidayList,
  holidayPolicy,
  HrLeaveBalance,
  HrLeaveTypes,
  HrLeaveMonthlyTrans,
  HrLeaveMaster,
  HRSalarySlip,
  HRSalaryFieldChild,
  HRSalaryMasterFields,
  HRSalaryFields,
  hrToolkit,
  Incentivetype,
  HRSalaryTrasaction,
  letterhead,
  InvestmentDetails,
  LeaveAuthorizationRequest,
  letterTemplateEditor,
  MailConfiguration,
  LetterTemplateType,
  LoanTransaction,
  LetterFields,
  LoanMaster,
  LoanAdvance,
  mailfields,
  mailTemplateEditor,
  meetingPlace,
  masterAdmin,
  mailTemplateType,
  manualOldAttendance,
  MonthlySkillsetsform,
  ModuleList,
  notificationPolicy,
  OperationMaster,
  overTimeCalculation,
  Payheadmaster,
  overTimePolicy,
  IncrementAuthorizationRequest,
  ModuleDetails,
  Penalty,
  overtimeAuthorizationRequest,
  PreboardingFormCustomize,
  PreboardingRequest,
  overTimeCalculationMain,
  PolicyDocuments,
  otherpaymentdetails,
  ProbationPolicy,
  PFetup,
  Preboarding,
  ProfessionalTaxSetup,
  PreboardingFormCustomizeValue,
  Product,
  ProductMaster,
  QuarterTaxChallan,
  ProfessionalTaxSlabMaster,
  Increment,
  ResignationAuthorizationRequest,
  EmployeeResignation,
  SalaryPolicy,
  Shift,
  ResignationTaskAssign,
  SkillSets,
  ResignProcess,
  SkillsetsForm,
  salaryIncrementChild,
  CompanySubscriptionMaster,
  TaskRemark,
  TaxChallanMaster,
  StateMaster,
  ResignationTask,
  TdsSlabMaster,
  toursMaster,
  TicketUpdates,
  TaskStages,
  Ticket,
  UserTracking,
  UserAnnouncement,
  UserActivity,
  UserChats,
  UserAddress,
  TicketSubCategory,
  UserExpense,
  UserDocument,
  TicketCategory,
  UserLogs,
  UserLetters,
  Test,
  Tracking,
  userFamily,
  UserMaster,
  UserLeave,
  UserSkills,
  UserOverTimePolicyAssign,
  vehicleUsage,
  Visit,
  UserEducation,
  UserExpenseTransaction,
  UserExperience,
  VisitFormCustomizeValue,
  VisitFormCustomize,
  VisitPurpose,
  visitors,
  VisitReportCustomize,
  ShiftTIme,
  VisitReportCustomizeValue,
  UserLeaveTransaction,
  VisitReportMaster,
  weekoffHolidayTran,
  WeekOffOptions,
  weekOffPolicy,
};
