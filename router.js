'use strict';
const API = require('./middleware/apikey');
const countryMasterRoutes = require('./routes/countrymaster.router');
const stateMasterRoutes = require('./routes/statemaster.router');
const cityMasterRoutes = require('./routes/citymaster.router');
const professionalTaxMasterRoutes = require('./routes/professionaltaxmaster.router');
const productMasterRoutes = require('./routes/productmaster.router');
const branchMasterRoutes = require('./routes/branchmaster.router');
const bankMasterRoutes = require('./routes/bankmaster.router');
const masterAdminRoutes = require('./routes/masteradmin.router');
const testRoutes = require('./routes/test');
const companyMasterRoutes = require('./routes/companymaster.router');
const CompanyTypeRoutes = require('./routes/companytype.router');
// const CompanyContactRoutes = require('./routes/companycontact.router');
const ProfessionalTaxSetupRoutes = require('./routes/professionaltaxsetup.router');
const ESICSetupRoutes = require('./routes/esicsetup.router');
const formMasterRoutes = require('./routes/formmaster.router');
const probationPolicyRoutes = require('./routes/probationpolicy.router');
const costCenterRoutes = require('./routes/costcenter.router');
const CompanyContactRoutes = require('./routes/companycontact.router');
const subscriptionRoutes = require('./routes/subscription.route');
const companyregisterRoutes = require('./routes/companyregister.router');
const designationRoutes = require('./routes/designation.router');
const departmentRoutes = require('./routes/department.router');
const authRoutes = require('./routes/auth.router');
const pfsetupRoutes = require('./routes/pfsetup.router');
const hrSalaryFieldsRoutes = require('./routes/hrsalaryfields.router');
const userAddressRoutes = require('./routes/useraddress.router');
const userExperienceRoutes = require('./routes/userexperience.router');
const userEducationRoutes = require('./routes/usereducation.router');
const shiftRoutes = require('./routes/shift.router');
const documentListRoutes = require('./routes/documentlist.router');
const userDocumentRoutes = require('./routes/userdocument.router');
const gradeStructureRoutes = require('./routes/gradestructure.router');
const userfamilyroutes = require('./routes/userfamily.router');
const userSkillsRoutes = require('./routes/userskills.router');
const employeeReportToRoutes = require('./routes/employeereportto.router');
const employeeDepartmentRoutes = require('./routes/employeedepartment.router');
const employeeBranchRoutes = require('./routes/employeebranch.router');
const employeeHolidayPolicyRoutes = require('./routes/employeeholidaypolicy.router');
const employeeDesignationRoutes = require('./routes/employeedesignation.router');
const weekOffPolicyRoutes = require('./routes/weekoffpolicy.router');
const holidayPolicyRoutes = require('./routes/holidaypolicy.router');
const employeeWeekOffRoutes = require('./routes/employeeweekoff.router');
const customerRoutes = require('./routes/customer.router');
const visitPurposeRoutes = require('./routes/visitpurpose.router');
const productRoutes = require('./routes/product.router');
const visitRoutes = require('./routes/visit.router');
const gradeSalaryStructureRoutes = require('./routes/gradesalarystructure.router');
const hrSalaryFieldChildRoutes = require('./routes/hrsalaryfieldchild.router');
const companyDocumentTypeRoutes = require('./routes/companydocumenttype.router');
const companyDocumentRoutes = require('./routes/companydocument.router');
const announcementRoutes = require('./routes/announcement.router');
const employeeDigitalSignatureRoutes = require('./routes/employeedigitalsignature.router');
const userTrackingRoutes = require('./routes/usertracking.router');
const payheadRoutes = require('./routes/payhead.router');
const assetCategoryRoutes = require('./routes/assetcategory.router');
const penaltyRoutes = require('./routes/penalty.router');
const companyLetterheadRoutes = require('./routes/companyletterhead.router');
const employeeAssetRoutes = require('./routes/assignassettoemp.router');
const commonRoutes = require('./routes/common.router');
const spRoutes = require('./routes/storedprocedure.router');
const viewRoutes = require('./routes/views.router');
const functionRoutes = require('./routes/function.router');
const empPenaltyRoutes = require('./routes/employeepenalty.router');
const expenseCategoryRoutes = require('./routes/expensecategory.router');
const expenseHeadRoutes = require('./routes/expensehead.router');
const expensePriceRoutes = require('./routes/expenseprice.router');
const visitformcustomizeRoutes = require('./routes/visitformcustomize.router');
const visitformcustomizevalueRoutes = require('./routes/visitfieldcustomizevalue.router');
const hrLeaveTypes = require('./routes/hrleavetypes.router');
const operationRoutes = require('./routes/operation.router');
const hrSalarymasterRoutes = require('./routes/hrSalaryMaster.router');
const authorizationCriteriaMasterRoutes = require('./routes/authorizationcriteriamaster.router');
const formAuthorizationDetails = require('./routes/formAuthorizationDetails.router');
const visitReportMasterRoutes = require('./routes/visitreportmaster.router');
const empJoiningRoutes = require('./routes/employeeJoining.router');
const hrLeaveMasterRoutes = require('./routes/hrLeaveMaster.router');
const hrLeaveMonthlyTransRoutes = require('./routes/hrleavesmonthlytrans.router');
const VisitReportCustomizeRoutes = require('./routes/visitreportcustomize.router');
const VisitReportCustomizeValueRoutes = require('./routes/visitreportcustomizevalue.router');
const MailConfigRoutes = require('./routes/mailconfiguration.router');
const TrackingRoutes = require('./routes/tracking.router');
const toursMasterRoutes = require('./routes/toursMaster.router');
const attendancetransactionRoutes = require('./routes/attendanceTransaction.router');
const advancePaymentRoutes = require('./routes/advancepayment.router');
const overTimeCalculation = require('./routes/overTimeCalculation.router');
const overTimePolicy = require('./routes/overTimePolicy.router');
const userOverTimePolicyAssign = require('./routes/userOverTimePolicyAssign.router');

const preboardingRoutes = require('./routes/preboarding.router');
const preboardingformcustomizeRoutes = require('./routes/preboardingformcustomize.router');
const preboardingformcustomizevalueRoutes = require('./routes/preboardingfieldcustomizevalue.router');
const callfollowupRoutes = require('./routes/callfollowup.router');
const loanMasterRoutes = require('./routes/loanmaster.router');
const form16Routes = require('./routes/form16.router');
const investmentDetailsRoutes = require('./routes/investmentdetails.router');
const tdsSlabMasterRoutes = require('./routes/tdsslabmaster.router');
const taxChallanMasterRoutes = require('./routes/taxchallanmaster.router');
const quartertaxchallanRoutes = require('./routes/quartertaxchallan.router');
const attendancelogRoutes = require('./routes/attendancelogs.router');
const versionRoutes = require('./routes/appversion.router');
const preboardingRequestRoutes = require('./routes/preboardingRequest.router');
const employeeShiftRoutes = require('./routes/employeeshift.router');
const attendancePolicyRoutes = require('./routes/attendancepolicy.router');
const salaryPolicyRoutes = require('./routes/salarypolicy.router');
const employeeAttendancePolicyRoutes = require('./routes/employeeattendancepolicy.router');
const employeeSalaryPolicyRoutes = require('./routes/employeesalarypolicy.router');
const UserLeaveRoutes = require('./routes/userleave.router');
const authorizationRequestRoutes = require('./routes/authorizationRequest.router');
const leaveauthorizationRequestRoutes = require('./routes/leaveAuthorizationRequest.router');
const authorizationMaster = require('./routes/authorizationmaster.router');
const AuthorizationDetails = require('./routes/AuthorizationDetails.router');
const otherPaymentRouter = require('./routes/otherpaymentdetails.router');
const companyLetterFormatRoutes = require('./routes/companyletterformat.router');
const leavebalRoutes = require('./routes/HrLeaveBalance.router');
const companywiseReportRoutes = require('./routes/companywisereport.router');
const userExpenseRoutes = require('./routes/userExpense.router');
const salaryTransRoutes = require('./routes/hrSalaryTransaction.router');
const reportToRouters = require('./routes/reportTo.router');
const weekoffHolidayTranRouters = require('./routes/weekoffHolidayTran.router');
const biometricRouters = require('./routes/biometric.router');
const reportRouters = require('./routes/report.router');
const NdacategoryRouters = require('./routes/Ndacategory.router');
const EmployeeNdaRouters = require('./routes/employeeNda.router');
const depositcategory = require('./routes/depositCategory.router');
const depositRoutes = require('./routes/deposit.router');
const meetingPlaceRoutes = require('./routes/meetingPlace.router');
const visitorsRoutes = require('./routes/visitors.router');
const gatePass = require('./routes/gatePass.router');
const NdaReportRouters = require('./routes/Ndareport.router');
const AssetReportRouters = require('./routes/Assetreport.router');
const PenaltyReportRouters = require('./routes/penaltyReport.router');
const AdvanceReportRouters = require('./routes/advancepaymentreport.router');
const assetMasterRoutes = require('./routes/assetMaster.router');
const salaryIncrementRoutes = require('./routes/salaryIncrement.router');
const lastfiveattendance = require('./routes/lastfiveattendance.router');
const Employeement = require('./routes/employeement.router');
const employeeEmployeement = require('./routes/employeeEmployeement.router');
const erpAccountMaster = require('./routes/erpAccountMaster.router');
const userLogs = require('./routes/userLogs.router');
const letterHeadRouters = require('./routes/lettterHead.router');
const empLetterHeadRouters = require('./routes/empLetterHead.router');
const biometricIntegration = require('./routes/biometricIntegration.router');
const biometricDatabaseList = require('./routes/biometricconfigurationdb.router');
const mannualAttendanceRouters = require('./routes/mannualAttendance.router');
const datewiseattendancePolicy = require('./routes/datewiseAttendancepolicy.router');
const coffMaster = require('./routes/coffMaster.router');
const hrToolKitRouters = require('./routes/hrToolKit.router');
const ExecutionStatusRouters = require('./routes/executionStatus.router');

const Resignation = require('./routes/resignation.router');
const resignationAuthorization = require('./routes/resignationAuthorization.router');
const ResignProcessRouters = require('./routes/resignProcess.router');
const ResignTask = require('./routes/resignTask.router');
const ResignTaskAssign = require('./routes/resignTaskAssign.router');
const IncentivetypeRouters = require('./routes/incentivetype.router');
const employeeincentiveRouters = require('./routes/employeeincentive.router');
const dailyTaskRouters = require('./routes/dailyTask.router');
const VehicleUsage = require('./routes/vehicleUsage.router');
const employeeAccident = require('./routes/employeeAccident.router');
const expensePayment = require('./routes/expensePayment.router');

const Task_Stages_Router = require('./routes/tasks_stages.router');
const User_Task_Router = require('./routes/User_Tasks.router');
const UserChatsRouters = require('./routes/userChats.router');
const TaskRemark = require('./routes/taskremark.router');

const MailTemlateType = require('./routes/mailTemplateType.router');
const MailFields = require('./routes/mailFields.router');

const LetterTemplateType = require('./routes/letterTemplateType.router');

const LetterFields = require('./routes/letterFields.router');
const NotificationPolicy = require('./routes/notificationPolicy.router');
const MailTemplateEditor = require('./routes/mailTemplateEditor.router');
const SkillSets = require('./routes/skillsets.router');

const SkillSetsForm = require('./routes/skillsetsform.router');

const MonthlySkillsetsform = require('./routes/monthlySkillsetsform.router');
const LetterTemplateEditor = require('./routes/letterTamplateEditor.router');
const UserLetters = require('./routes/userLetters.router');
const TicketCategory = require('./routes/ticketCategory.router');
const TicketSubCategory = require('./routes/ticketSubCategory.router');
const Ticket = require('./routes/ticket.router');

const AttendanceCorrection = require('./routes/attendanceCorrection.router');
const PolicyDocument = require('./routes/policyDocument.router');

const moduleListRoutes = require('./routes/moduleList.router');
const moduleDetailsRoutes = require('./routes/moduleDetails.router');
const userActivityRoutes = require('./routes/userActivity.router');

const CheckListRouter = require('./routes/checklist.router');
const CheckListQuestionRouter = require('./routes/checkListQuestion.router');
const UserCheckListRouter = require('./routes/userCheckList.router');
const RoleMasterRoutes = require('./routes/roleMaster.router');
const incomeTaxSlabMaster = require('./routes/incomeTaxSlabMaster.router');
const incomeTaxSlabs = require('./routes/incomeTaxSlabs.router');
const { verifyToken } = require('./middleware/tokenverify');
const SentimentPunchInRouter = require('./routes/sentimentPunchIn.router');
const WorkingLocationRoutes = require('./routes/workingLocation.router');
const EmployeeWorkingLocationRoutes = require('./routes/employeeWorkingLocation.router');
const Goal = require('./routes/goal.router');
const KRA = require('./routes/kra.router');
const KPI = require('./routes/kpi.router');
const EmployeeGoal = require('./routes/employeeGoal.router');
const PmsPolicy = require('./routes/pmsPolicy.router');
const LateEarlyPolicyRoutes = require('./routes/lateEarlyPolicy.router');
const EmployeeLateEarlyPolicyRoutes = require('./routes/employeeLateEarly.router');
const GoalSettingRoutes = require('./routes/goalSetting.router');
const UserInboxRouter = require('./routes/userInbox.router');
const ReviewFormRouter = require('./routes/reviewForm.router');
const ReviewFormAnswerRouter = require('./routes/reviewFormAnswer.router');

const tdsSubSectionRouter = require('./routes/tdsSubSection.router');
const tdsSectionRouter = require('./routes/tdsSection.router');
const EmployeeTaxRegime = require('./routes/employeeTaxRegime.router');
const PerformanceReview = require('./routes/performanceReview.router');
const EmployeePerformanceReview = require('./routes/employeePerformanceReview.router');
const TdsSubSectionCategory = require('./routes/tdsSubSectionCategory.router');
const EmployeeDeclaration = require('./routes/employeeDeclaration.router');
const EmployeeGoalReview = require('./routes/employeeGoalReview.router');
const OfferLetter = require('./routes/offerLetter.router');
const EmployeeGatepass = require('./routes/employeeGatepass.router');
const EmployeeLeavePolicy = require('./routes/employeeLeavePolicy.router');
const EmployeeShortLeavePolicy = require('./routes/employeeShortLeavePolicy.router');
const CompanyNotificationSetup = require('./routes/companyNotificationSetup.router');
const SN_CodeRouter = require('./routes/sn_code.router');

const Division = require('./routes/division.router');
const WorkingArea = require('./routes/workingArea.router');
const EmployeeDivision = require('./routes/employeeDivision.router');
const EmployeeWorkingArea = require('./routes/employeeWorkingArea.router');
const AutoMailSetup = require('./routes/autoMailSetup.router');

const PreviousSalary = require('./routes/previousSalary.router');
const Contractor = require('./routes/contractor.router');
const EmployeerentedResidence = require('./routes/employeeRentedResidence.router');
const JoiningLetter = require('./routes/joiningLetter.router');
const AttendanceBonusPolicy = require('./routes/attendanceBonusPolicy.router');
const { permissionAccess } = require('./middleware/permissionAccess');
const EmployeeAttendanceBonusPolicy = require('./routes/empattandancebonuspolicy.router');

const FoodAllowancePolicy = require('./routes/foodAllowancePolicy.router');
const EmployeeFoodAllowancePolicy = require('./routes/employeeFoodAllowancePolicy.router');
const EmpLeavePolicy = require('./routes/empLeavePolicy.router');
const shortLeavePolicy = require('./routes/shortLeavePolicy.router');
const TerminationLetter = require('./routes/terminationLetter.router');
const IncrementLetter = require('./routes/incrementLetter.router');
const ExperienceLetter = require('./routes/experienceLetter.router');
const UserIncrementLetter = require('./routes/userIncrementLetter.router');
const AiBiometric = require('./routes/aibiometric.router');

const EmployeeJoiningRequest = require('./routes/employeeJoiningRequest.router');
const AnonymousFeedback = require('./routes/anonymousFeedback.router');

const UniformDetailRoute = require('./routes/uniformDetail.router');
const userIp = require('./routes/userIP.router');
const DealerPlan = require('./routes/dealerPlan.router');
const DealerSubscription = require('./routes/dealersubscription.router');

const GatePassAuthorizationRequest = require('./routes/gatePassAuthorization.router');
const LeadMasterRoutes = require('./routes/leadMaster.router');
const BiometricDataTransfer = require('./routes/biometricDataTransfer.router');
const RegistrationRoutes = require('./routes/registration.router');

const attendanceCorrectionrequest = require('./routes/attendanceCorrectionRequest.router');
const attendanceCorrectionAuthorization = require('./routes/attendanceCorrectionAuthorization.router');
const compensatoryOffAuthorizationRoutes = require('./routes/compensatoryOffAuthorization.router');
const erpIngegration = require('./routes/erpIntegration.router');
const biometricUser = require('./routes/biometricUser.router');
const AppointmentLetter = require('./routes/appointment.router');
const companyServiceStatus = require('./routes/companyServiceStatus.router');
const companyProgress = require('./routes/companyProgress.router');
const weekoffShuffle = require('./routes/weekoffShuffle.router');
const auditLogs = require('./routes/auditLogs.router');
const companyTraining = require('./routes/companyTraining.router');
const ResigantionReason = require('./routes/resigantionReason.router');
const JiningDocumentTypeRoutes = require('./routes/joiningDocumentType.router');
const DesignationWiseDocumentRoutes = require('./routes/designationWiseDocument.router');
const JobPostingRoutes = require('./routes/jobPosting.router');
const JoningDocumentRoutes = require('./routes/joiningDocument.router');
const JobApplication = require('./routes/jobApplication.router');
const ShiftRosterRoutes = require('./routes/shiftRoster.router');
const BranchBankRoutes = require('./routes/bankBranch.router');
const DiscrepancyLetter = require('./routes/discrepancyLetter.router');
const EmployeeDiscrepancyLetter = require('./routes/employeeDiscrepancyLetter.router');
const UserShortLeaveRoutes = require('./routes/userShortLeave.router');
const ShortLeaveAuthorizationRoutes = require('./routes/shortLeaveAuthorization.router');
const TrackingOutageRoutes = require('./routes/trackingOutageCategory.router');
const TrackingCategoryDetailsRoutes = require('./routes/trackingCategoryDetails.router');

const personalInformationFormRoutes = require('./routes/personalInformationForm.router');
const JobRoleClassificationRoutes = require('./routes/jobRoleClassification.router');
const DistrictRoutes = require('./routes/districtMaster.router');

const employeeSkillCategoryRoutes = require('./routes/employeeSkillCategory.router');
const serviceChargeRoutes = require('./routes/serviceCharge.router');
const ProjectRoutes = require('./routes/project.router');
const EmployeeProjectRoutes = require('./routes/employeeProject.router');
const menuClickRoutes = require('./routes/menuclick.router');
const attendanceCorrectionReason = require('./routes/attendanceCorrectionReason.router');
const extraDaysRoutes = require('./routes/extraDays.router');
const extraDaysAuthorizationRoutes = require('./routes/extraDaysAuthorization.router');
const LeaveEncashmentRoutes = require('./routes/leaveEncashment.router');
const UserLapseLeave = require('./routes/userLeaveLapse.router');
const UserLeaveTransactionRoutes = require('./routes/userLeaveTransaction.router');

const FNFProcess = require('./routes/fnfProcess.router');

const BonusPolicy = require('./routes/bonusPolicy.router');
const EmployeeBonusPolicy = require('./routes/employeeBonusPolicy.router');
const EmployeeBonus = require('./routes/employeeBonus.router');

const EmployeePayment = require('./routes/employeePayment.router');
const bankStatementFormat = require('./routes/bankStatementFormat.router');
const PaySlipGenerator = require('./routes/paySlipGenerator.router');
const PreboardingDocument = require('./routes/prebordingDocument.router');
const customizeProfile = require('./routes/customizeProfile.router');
const TpMirrorRoutes = require('./routes/tpMirror.router');

const TaxRebateRoutes = require('./routes/taxRebate.router');
const TaxStandardDeductionRoutes = require('./routes/taxStandardDeduction.router');
const userExpenseTransactionRoutes = require('./routes/userExpenseTransaction.router');
const OfficeExpenseCategoryRoutes = require('./routes/officeExpenseCategory.router');
const OfficeExpenseHeadRoutes = require('./routes/officeExpenseHead.router');
const tdsSubSectionLimitRoutes = require('./routes/tdsSubSectionLimit.router');
const UpdateBranchJobRoutes = require('./routes/updateBranchJob.router');
const OrgAuthorizationTypeRoutes = require('./routes/orgAuthorizationType.router');
const SiteRoutes = require('./routes/site.router');
const OrganizationAuthorizationRoutes = require('./routes/organizationAuthorization.router');
const MinWagesMasterRoutes = require('./routes/minWagesMaster.router');
const CorporationRoutes = require('./routes/corporation.router');

const OfficeExpenseRoutes = require('./routes/officeExpense.router');
const AllocateOfficeExpense = require('./routes/allocateOfficeExpense.router');
const OfficeExpenseAuthRequest = require('./routes/officeExpenseAuthRequest.router');
const OfficeExpenseAdvance = require('./routes/officeExpenseAdvance.router');
const RolePermissionRoutes = require('./routes/rolePermission.router');

module.exports = (app) => {
  app.use('/test', verifyToken, testRoutes);
  app.use('/countrymaster', countryMasterRoutes);
  app.use('/masterAdmin', verifyToken, masterAdminRoutes);
  app.use('/statemaster', stateMasterRoutes);
  app.use('/citymaster', cityMasterRoutes);
  app.use('/professionataxmaster', verifyToken, professionalTaxMasterRoutes);
  app.use('/productmaster', verifyToken, productMasterRoutes);
  app.use('/branchmaster', verifyToken, permissionAccess, branchMasterRoutes);
  app.use('/bankmaster', verifyToken, bankMasterRoutes);
  app.use('/masterAdmin', verifyToken, masterAdminRoutes);
  app.use('/companymaster', verifyToken, companyMasterRoutes);
  app.use('/companytype', verifyToken, CompanyTypeRoutes);
  app.use('/professionaltaxsetup', verifyToken, ProfessionalTaxSetupRoutes);
  app.use('/esicsetup', verifyToken, ESICSetupRoutes);
  app.use('/formmaster', verifyToken, formMasterRoutes);
  app.use('/probationpolicy', verifyToken, probationPolicyRoutes);
  app.use('/costcenter', verifyToken, costCenterRoutes);
  app.use('/hrsalaryfields', verifyToken, hrSalaryFieldsRoutes);
  app.use('/useraddress', verifyToken, permissionAccess, userAddressRoutes);
  app.use(
    '/userexperience',
    verifyToken,
    permissionAccess,
    userExperienceRoutes
  );
  app.use('/usereducation', verifyToken, permissionAccess, userEducationRoutes);
  app.use('/shift', verifyToken, shiftRoutes);
  app.use('/documentlist', verifyToken, documentListRoutes);
  app.use('/userdocument', verifyToken, permissionAccess, userDocumentRoutes);
  app.use('/gradestructure', verifyToken, gradeStructureRoutes);
  app.use('/userskills', verifyToken, permissionAccess, userSkillsRoutes);
  app.use('/reportto', verifyToken, employeeReportToRoutes);
  app.use('/empdepartment', verifyToken, employeeDepartmentRoutes);
  app.use('/empdesignation', verifyToken, employeeDesignationRoutes);
  app.use(
    '/empholidaypolicy',
    verifyToken,
    permissionAccess,
    employeeHolidayPolicyRoutes
  );
  app.use('/empbranch', verifyToken, employeeBranchRoutes);
  app.use('/weekoffpolicy', verifyToken, weekOffPolicyRoutes);
  app.use('/holidayspolicy', verifyToken, holidayPolicyRoutes);
  app.use('/empweekoff', verifyToken, permissionAccess, employeeWeekOffRoutes);
  app.use('/customer', verifyToken, customerRoutes);
  app.use('/visitpurpose', verifyToken, visitPurposeRoutes);
  app.use('/hrLeaveBal', verifyToken, leavebalRoutes);
  app.use('/product', verifyToken, productRoutes);
  app.use('/visit', verifyToken, visitRoutes);
  app.use('/gradesalarystructure', verifyToken, gradeSalaryStructureRoutes);
  app.use('/hrsalaryfieldchild', verifyToken, hrSalaryFieldChildRoutes);
  app.use('/compdoctype', verifyToken, companyDocumentTypeRoutes);
  app.use('/compdoc', verifyToken, permissionAccess, companyDocumentRoutes);
  app.use('/announcement', verifyToken, permissionAccess, announcementRoutes);
  app.use('/empdigitalsign', verifyToken, employeeDigitalSignatureRoutes);
  app.use('/usertracking', verifyToken, permissionAccess, userTrackingRoutes);
  app.use('/assetcategory', verifyToken, assetCategoryRoutes);
  app.use('/penalty', verifyToken, penaltyRoutes);
  app.use('/letterhead', verifyToken, companyLetterheadRoutes);
  app.use('/assignasset', verifyToken, permissionAccess, employeeAssetRoutes);
  app.use('/common', verifyToken, commonRoutes);
  app.use('/storedprocedure', verifyToken, spRoutes);
  app.use('/view', verifyToken, viewRoutes);
  app.use('/function', verifyToken, functionRoutes);
  app.use('/emppenalty', verifyToken, permissionAccess, empPenaltyRoutes);

  app.use('/companycontact', verifyToken, CompanyContactRoutes);
  app.use('/subscription', verifyToken, subscriptionRoutes);
  app.use('/companyregister', verifyToken, companyregisterRoutes);
  app.use('/designation', verifyToken, designationRoutes);
  app.use('/department', verifyToken, departmentRoutes);
  app.use('/auth', authRoutes);
  app.use('/pfsetup', verifyToken, pfsetupRoutes);
  app.use('/userfamily', verifyToken, permissionAccess, userfamilyroutes);
  app.use('/payhead', verifyToken, payheadRoutes);
  app.use('/expensecategory', verifyToken, expenseCategoryRoutes);
  app.use('/expensehead', verifyToken, expenseHeadRoutes);
  app.use('/expenseprice', verifyToken, expensePriceRoutes);
  app.use('/visitformcustomize', verifyToken, visitformcustomizeRoutes);
  app.use(
    '/visitformcustomizevalue',
    verifyToken,
    visitformcustomizevalueRoutes
  );
  app.use('/hrleavetypes', verifyToken, hrLeaveTypes);
  app.use('/operation', verifyToken, operationRoutes);
  app.use(
    '/hrSalaryMaster',
    verifyToken,
    permissionAccess,
    hrSalarymasterRoutes
  );
  app.use('/empJoining', verifyToken, permissionAccess, empJoiningRoutes);
  app.use(
    '/authorizationCriteriaMasterRoutes',
    authorizationCriteriaMasterRoutes
  );
  app.use('/formAuthorizationDetails', verifyToken, formAuthorizationDetails);
  app.use('/leaveMaster', verifyToken, hrLeaveMasterRoutes);

  app.use('/visitReportMaster', verifyToken, visitReportMasterRoutes);
  app.use(
    '/hrleavesmonthlytrans',
    verifyToken,
    permissionAccess,
    hrLeaveMonthlyTransRoutes
  );
  app.use('/visitReportCustomize', verifyToken, VisitReportCustomizeRoutes);
  app.use(
    '/visitReportCustomizevalue',
    verifyToken,
    VisitReportCustomizeValueRoutes
  );
  app.use('/mailconfig', verifyToken, MailConfigRoutes);

  app.use('/preboarding', preboardingRoutes);
  app.use('/preboardingformcustomize', preboardingformcustomizeRoutes);
  app.use(
    '/preboardingformcustomizevalue',
    verifyToken,
    preboardingformcustomizevalueRoutes
  );

  app.use('/callfollowup', verifyToken, permissionAccess, callfollowupRoutes);
  app.use('/loanmaster', verifyToken, permissionAccess, loanMasterRoutes);
  app.use('/form16', verifyToken, form16Routes);
  app.use(
    '/investmentdetails',
    verifyToken,
    permissionAccess,
    investmentDetailsRoutes
  );
  app.use('/tdsslabmaster', verifyToken, tdsSlabMasterRoutes);
  app.use('/taxchallanmaster', verifyToken, taxChallanMasterRoutes);
  app.use('/quartertaxchallan', verifyToken, quartertaxchallanRoutes);
  app.use('/attendancelogs', verifyToken, attendancelogRoutes);
  //app.use('/mailconfig', verifyToken,MailConfigRoutes);
  app.use('/Tracking', verifyToken, permissionAccess, TrackingRoutes);

  app.use('/toursMaster', verifyToken, permissionAccess, toursMasterRoutes);
  app.use('/appversion', verifyToken, versionRoutes);
  app.use(
    '/preboardingrequest',
    verifyToken,
    permissionAccess,
    preboardingRequestRoutes
  );
  app.use(
    '/attendanceTransaction',
    verifyToken,
    permissionAccess,
    attendancetransactionRoutes
  );
  app.use(
    '/advancePayment',
    verifyToken,
    permissionAccess,
    advancePaymentRoutes
  );
  app.use('/otherPayment', verifyToken, otherPaymentRouter);

  app.use('/employeeshift', verifyToken, permissionAccess, employeeShiftRoutes);
  app.use('/attendancepolicy', verifyToken, attendancePolicyRoutes);
  app.use('/salarypolicy', verifyToken, salaryPolicyRoutes);
  app.use('/salaryTrans', verifyToken, permissionAccess, salaryTransRoutes);
  app.use(
    '/employeeattendancepolicy',
    verifyToken,
    permissionAccess,
    employeeAttendancePolicyRoutes
  );
  app.use(
    '/employeesalarypolicy',
    verifyToken,
    permissionAccess,
    employeeSalaryPolicyRoutes
  );
  app.use('/userleave', verifyToken, UserLeaveRoutes);
  app.use(
    '/authorizationRequest',
    verifyToken,
    permissionAccess,
    authorizationRequestRoutes
  );
  app.use(
    '/leaveauthorizationRequest',
    verifyToken,
    permissionAccess,
    leaveauthorizationRequestRoutes
  );
  app.use('/authorizationmaster', verifyToken, authorizationMaster);
  app.use(
    '/AuthorizationDetails',
    verifyToken,
    permissionAccess,
    AuthorizationDetails
  );
  app.use('/companyLetterFormat', verifyToken, companyLetterFormatRoutes);
  app.use('/overTime', verifyToken, permissionAccess, overTimeCalculation);
  app.use('/overTimePolicy', verifyToken, overTimePolicy);
  app.use('/userOverTimePolicyAssign', verifyToken, userOverTimePolicyAssign);
  app.use('/companywiseReport', verifyToken, companywiseReportRoutes);
  app.use('/userExpense', verifyToken, permissionAccess, userExpenseRoutes);
  app.use('/reportTo', verifyToken, reportToRouters);
  app.use('/weekoffHolidayTran', verifyToken, weekoffHolidayTranRouters);
  app.use('/biometric', biometricRouters);
  app.use('/report', verifyToken, permissionAccess, reportRouters);
  app.use('/Ndacategory', verifyToken, NdacategoryRouters);
  app.use('/EmployeeNda', verifyToken, permissionAccess, EmployeeNdaRouters);
  app.use('/depositCategory', verifyToken, depositcategory);
  app.use('/deposit', verifyToken, permissionAccess, depositRoutes);
  app.use('/meetingPlace', verifyToken, meetingPlaceRoutes);
  app.use('/visitors', verifyToken, visitorsRoutes);
  app.use('/gatePass', verifyToken, permissionAccess, gatePass);
  app.use('/NdaReport', verifyToken, NdaReportRouters);
  app.use('/AssetReport', verifyToken, AssetReportRouters);
  app.use('/PenaltyReport', verifyToken, PenaltyReportRouters);
  app.use('/AdvanceReport', verifyToken, AdvanceReportRouters);
  app.use('/assetMaster', verifyToken, assetMasterRoutes);
  app.use('/salaryIncrement', verifyToken, salaryIncrementRoutes);
  app.use('/LastFiveAttendance', verifyToken, lastfiveattendance);
  app.use('/Employeement', verifyToken, Employeement);
  app.use('/empEmployeement', verifyToken, employeeEmployeement);
  app.use('/erpAccountMaster', verifyToken, erpAccountMaster);
  app.use('/userLogs', verifyToken, userLogs);
  app.use('/letterHeadsetup', verifyToken, letterHeadRouters);
  app.use('/empLetterHead', verifyToken, empLetterHeadRouters);
  app.use('/biometricintegration', verifyToken, biometricIntegration);
  app.use('/biometricDatabaseList', verifyToken, biometricDatabaseList),
    app.use(
      '/mannualAttendance',
      verifyToken,
      permissionAccess,
      mannualAttendanceRouters
    );

  app.use(
    '/datewiseattendancepolicy',
    verifyToken,
    permissionAccess,
    datewiseattendancePolicy
  );
  app.use('/coffMaster', verifyToken, permissionAccess, coffMaster);
  app.use('/hrToolKit', verifyToken, hrToolKitRouters);
  app.use('/executionStatus', verifyToken, ExecutionStatusRouters);
  app.use('/resignation', verifyToken, permissionAccess, Resignation);
  app.use('/resignationAuthorization', verifyToken, resignationAuthorization);
  app.use('/resignProcess', verifyToken, ResignProcessRouters);
  app.use('/resignTask', verifyToken, ResignTask);
  app.use('/resignTaskAssign', verifyToken, permissionAccess, ResignTaskAssign);
  app.use('/incentive', verifyToken, IncentivetypeRouters);
  app.use(
    '/employeeincentive',
    verifyToken,
    permissionAccess,
    employeeincentiveRouters
  );
  app.use('/dailyTask', verifyToken, permissionAccess, dailyTaskRouters);
  app.use('/vehicleUsage', verifyToken, permissionAccess, VehicleUsage);
  app.use('/employeeAccident', verifyToken, employeeAccident);

  app.use('/expensePayment', verifyToken, expensePayment);
  app.use('/Tasks_Stages', verifyToken, Task_Stages_Router);
  app.use('/user_tasks', verifyToken, permissionAccess, User_Task_Router);

  app.use('/userchats', verifyToken, UserChatsRouters);
  app.use('/taskRemark', verifyToken, TaskRemark);

  app.use('/letterTemplateType', verifyToken, LetterTemplateType);
  app.use('/letterFields', verifyToken, LetterFields);

  app.use('/mailTemplateType', verifyToken, MailTemlateType);
  app.use('/mailFields', verifyToken, MailFields);

  app.use('/notificationPolicy', verifyToken, NotificationPolicy);
  app.use('/mailTemplateEditor', verifyToken, MailTemplateEditor);

  app.use('/skillSets', verifyToken, SkillSets);

  app.use('/skillSetsForm', verifyToken, SkillSetsForm);
  app.use(
    '/monthlySkillsetsform',
    verifyToken,
    permissionAccess,
    MonthlySkillsetsform
  );

  app.use('/letterTamplateEditor', verifyToken, LetterTemplateEditor);
  app.use('/userLetters', verifyToken, UserLetters);
  app.use('/ticketCategory', verifyToken, permissionAccess, TicketCategory);
  app.use(
    '/ticketSubCategory',
    verifyToken,
    permissionAccess,
    TicketSubCategory
  );
  app.use('/ticket', verifyToken, permissionAccess, Ticket);
  app.use('/attendanceCorrection', verifyToken, AttendanceCorrection);
  app.use('/policyDocument', verifyToken, PolicyDocument);
  app.use('/moduleList', verifyToken, moduleListRoutes);
  app.use('/moduleDetails', verifyToken, moduleDetailsRoutes);
  app.use('/checkList', verifyToken, CheckListRouter);
  app.use('/checkListQuestion', verifyToken, CheckListQuestionRouter);
  app.use('/usercheckList', verifyToken, permissionAccess, UserCheckListRouter);
  app.use('/roleMaster', verifyToken, RoleMasterRoutes);
  app.use(
    '/sentimentPunchIn',
    verifyToken,
    permissionAccess,
    SentimentPunchInRouter
  );
  app.use('/workingLocation', verifyToken, WorkingLocationRoutes);
  app.use(
    '/employeeWorkingLocation',
    verifyToken,
    permissionAccess,
    EmployeeWorkingLocationRoutes
  );
  app.use('/goal', verifyToken, permissionAccess, Goal);
  app.use('/kra', verifyToken, KRA);
  app.use('/kpi', verifyToken, KPI);
  app.use('/userActivity', userActivityRoutes);
  app.use('/incomeTaxSlabMaster', verifyToken, incomeTaxSlabMaster);
  app.use('/incomeTaxSlabs', verifyToken, incomeTaxSlabs);
  app.use('/employeeGoal', verifyToken, permissionAccess, EmployeeGoal);
  app.use('/pmsPolicy', verifyToken, PmsPolicy);
  app.use('/LateEarlyPolicy', verifyToken, LateEarlyPolicyRoutes);
  app.use(
    '/EmployeeLateEarlyPolicyRoutes',
    verifyToken,
    permissionAccess,
    EmployeeLateEarlyPolicyRoutes
  );
  app.use('/goalSetting', verifyToken, GoalSettingRoutes);
  app.use('/userInbox', verifyToken, UserInboxRouter);
  app.use('/reviewForm', verifyToken, permissionAccess, ReviewFormRouter);
  app.use(
    '/reviewFormAnswer',
    verifyToken,
    permissionAccess,
    ReviewFormAnswerRouter
  );

  app.use('/tdsSubSection', verifyToken, tdsSubSectionRouter);
  app.use('/tdsSection', verifyToken, tdsSectionRouter);

  app.use(
    '/employeeTaxRegime',
    verifyToken,
    permissionAccess,
    EmployeeTaxRegime
  );
  app.use('/performanceReview', verifyToken, PerformanceReview);
  app.use(
    '/employeePerformanceReview',
    verifyToken,
    permissionAccess,
    EmployeePerformanceReview
  );
  app.use('/tdsSubSectionCategory', verifyToken, TdsSubSectionCategory);
  app.use(
    '/employeeDeclaration',
    verifyToken,
    permissionAccess,
    EmployeeDeclaration
  );
  app.use(
    '/employeeGoalReview',
    verifyToken,
    permissionAccess,
    EmployeeGoalReview
  );
  app.use(
    '/punchInPunchOutNotification',
    verifyToken,
    require('./routes/punchInOutNotificationSchedule.router')
  );

  app.use('/offerLetter', verifyToken, OfferLetter);
  app.use('/employeeGatepass', verifyToken, permissionAccess, EmployeeGatepass);
  app.use(
    '/employeeLeavePolicy',
    verifyToken,
    permissionAccess,
    EmployeeLeavePolicy
  );
  app.use(
    '/empShortLeavePolicy',
    verifyToken,
    permissionAccess,
    EmployeeShortLeavePolicy
  );
  app.use('/companyNotificationSetup', verifyToken, CompanyNotificationSetup);
  app.use('/SN_Code', verifyToken, permissionAccess, SN_CodeRouter);
  app.use('/division', verifyToken, Division);
  app.use('/workingArea', verifyToken, WorkingArea);
  app.use('/employeeDivision', verifyToken, permissionAccess, EmployeeDivision);
  app.use(
    '/employeeWorkingArea',
    verifyToken,
    permissionAccess,
    EmployeeWorkingArea
  );
  app.use('/autoMailSetup', verifyToken, AutoMailSetup);
  app.use('/previousSalary', verifyToken, permissionAccess, PreviousSalary);
  app.use('/contractor', verifyToken, Contractor);
  app.use(
    '/employeeRentedResidence',
    verifyToken,
    permissionAccess,
    EmployeerentedResidence
  );
  app.use('/joiningLetter', verifyToken, JoiningLetter);
  app.use('/attendanceBonusPolicy', verifyToken, AttendanceBonusPolicy);
  app.use(
    '/employeeattendancebonuspolicy',
    verifyToken,
    permissionAccess,
    EmployeeAttendanceBonusPolicy
  );

  app.use('/foodAllowancePolicy', verifyToken, FoodAllowancePolicy);
  app.use(
    '/employeeFoodAllowancePolicy',
    verifyToken,
    permissionAccess,
    EmployeeFoodAllowancePolicy
  );
  app.use('/empLeavePolicy', verifyToken, EmpLeavePolicy);
  app.use('/shortLeave', verifyToken, shortLeavePolicy);
  app.use('/experienceLetter', verifyToken, ExperienceLetter);
  app.use('/incrementLetter', verifyToken, IncrementLetter);
  app.use('/terminationLetter', verifyToken, TerminationLetter);
  app.use('/userIncrementLetter', verifyToken, UserIncrementLetter);
  app.use('/aibiometric', verifyToken, AiBiometric);

  app.use(
    '/employeeJoiningRequest',
    verifyToken,
    permissionAccess,
    EmployeeJoiningRequest
  );
  app.use('/anonymousFeedback', verifyToken, AnonymousFeedback);

  //router
  app.use('/uniform', verifyToken, UniformDetailRoute);
  app.use('/userIp', verifyToken, userIp);
  app.use('/dealerPlan', verifyToken, DealerPlan);
  app.use('/dealersubscription', verifyToken, DealerSubscription);

  app.use(
    '/gatepassauthorization',
    verifyToken,
    permissionAccess,
    GatePassAuthorizationRequest
  );

  app.use('/leadMaster', LeadMasterRoutes);
  app.use('/biometricDataTransfer', BiometricDataTransfer);
  app.use('/registration', RegistrationRoutes);
  app.use(
    '/attendanceCorrectionRequest',
    verifyToken,
    attendanceCorrectionrequest
  );
  app.use(
    '/attendanceCorrectionAuthorization',
    verifyToken,
    permissionAccess,
    attendanceCorrectionAuthorization
  );
  app.use(
    '/compensatoryOffAuthorizationRequest',
    verifyToken,
    permissionAccess,
    compensatoryOffAuthorizationRoutes
  );
  app.use('/erpIngegration', verifyToken, erpIngegration);
  app.use('/biometricUser', verifyToken, biometricUser);
  app.use('/appointmentLetter', verifyToken, AppointmentLetter);
  app.use('/companyServiceStatus', verifyToken, companyServiceStatus);
  app.use('/companyProgress', verifyToken, companyProgress);
  app.use('/weekoffShuffle', verifyToken, weekoffShuffle);
  app.use('/auditLogs', verifyToken, auditLogs);
  app.use('/companyTraining', verifyToken, companyTraining);
  app.use('/resigantionReason', verifyToken, ResigantionReason);
  app.use('/joiningDocumentType', verifyToken, JiningDocumentTypeRoutes);
  app.use('/designationWiseDocument', DesignationWiseDocumentRoutes);
  app.use('/jobPosting', JobPostingRoutes);
  app.use('/joiningDocument', verifyToken, JoningDocumentRoutes);
  app.use('/jobApplication', JobApplication);
  app.use('/shiftRoster', verifyToken, ShiftRosterRoutes);
  app.use('/bankBranch', verifyToken, BranchBankRoutes);
  app.use('/discrepancyLetter', verifyToken, DiscrepancyLetter);
  app.use('/employeeDiscrepancyLetter', verifyToken, EmployeeDiscrepancyLetter);

  app.use('/userShortLeave', verifyToken, UserShortLeaveRoutes);
  app.use(
    '/shortLeaveAuthorization',
    verifyToken,
    ShortLeaveAuthorizationRoutes
  );
  app.use(
    '/TrackingOutage',
    verifyToken,
    permissionAccess,
    TrackingOutageRoutes
  );
  app.use(
    '/TrackingCategoryDetails',
    verifyToken,
    permissionAccess,
    TrackingCategoryDetailsRoutes
  );

  app.use(
    '/personalInformationForm',
    verifyToken,
    personalInformationFormRoutes
  );
  app.use('/jobRoleClassification', verifyToken, JobRoleClassificationRoutes);
  app.use('/district', verifyToken, DistrictRoutes);

  app.use('/employeeSkillCategory', verifyToken, employeeSkillCategoryRoutes);
  app.use('/serviceCharge', verifyToken, serviceChargeRoutes);
  app.use('/project', verifyToken, ProjectRoutes);
  app.use('/employeeProject', verifyToken, EmployeeProjectRoutes);
  app.use('/menuClick', verifyToken, menuClickRoutes);
  app.use(
    '/attendanceCorrectionReason',
    verifyToken,
    attendanceCorrectionReason
  );
  app.use('/extraDays', verifyToken, extraDaysRoutes);
  app.use('/extraDaysAuthorization', verifyToken, extraDaysAuthorizationRoutes);
  app.use('/leaveEncashment', verifyToken, LeaveEncashmentRoutes);
  app.use('/userLapseLeave', verifyToken, UserLapseLeave);
  app.use('/userLeaveTransaction', verifyToken, UserLeaveTransactionRoutes);
  app.use('/fnfProcess', verifyToken, FNFProcess);

  app.use('/bonusPolicy', verifyToken, BonusPolicy);
  app.use('/employeeBonusPolicy', verifyToken, EmployeeBonusPolicy);
  app.use('/employeeBonus', verifyToken, EmployeeBonus);

  app.use('/employeePayment', verifyToken, EmployeePayment);
  app.use('/bankStatementFormat', verifyToken, bankStatementFormat);
  app.use('/paySlipGenerator', verifyToken, PaySlipGenerator);
  app.use('/preboardingDocument', PreboardingDocument);
  app.use('/customizeProfile', verifyToken, customizeProfile);
  app.use('/tpMirror', TpMirrorRoutes);

  app.use('/taxRebate', verifyToken, TaxRebateRoutes);
  app.use('/taxStandardDeduction', verifyToken, TaxStandardDeductionRoutes);
  app.use('/officeExpenseCategory', verifyToken, OfficeExpenseCategoryRoutes);
  app.use('/officeExpenseHead', verifyToken, OfficeExpenseHeadRoutes);
  app.use('/userExpenseTransaction', verifyToken, userExpenseTransactionRoutes);
  app.use('/tdsSubSectionLimit', verifyToken, tdsSubSectionLimitRoutes);
  app.use('/updateBranchJob', verifyToken, UpdateBranchJobRoutes);
  app.use('/orgAuthorizationType', verifyToken, OrgAuthorizationTypeRoutes);
  app.use('/site', verifyToken, SiteRoutes);
  app.use(
    '/organizationAuthorization',
    verifyToken,
    OrganizationAuthorizationRoutes
  );
  app.use('/minWagesMaster', verifyToken, MinWagesMasterRoutes);
  app.use('/corporation', verifyToken, CorporationRoutes);

  app.use('/officeExpense', verifyToken, OfficeExpenseRoutes);
  app.use('/allocateOfficeExpense', verifyToken, AllocateOfficeExpense);
  app.use(
    '/officeExpenseAuthRequest',
    verifyToken,
    permissionAccess,
    OfficeExpenseAuthRequest
  );
  app.use(
    '/officeExpenseAdvance',
    verifyToken,
    permissionAccess,
    OfficeExpenseAdvance
  );
  app.use('/rolePermission', verifyToken, RolePermissionRoutes);
};
