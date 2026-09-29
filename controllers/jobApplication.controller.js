const Sequelize = require('sequelize');
const message = require('../response_message/message');
const sequelize = require('../config/database');
const JobApplication = require('../models/jobApplication');
const companyMaster = require('../models/companyMaster');
const BranchMaster = require('../models/branchMaster');
const Department = require('../models/department');
const Designation = require('../models/designation');
const JobPosting = require('../models/jobPosting');
const moment = require('moment');
const { generateExcel } = require('../utils/exportData');
const fs = require('fs');
const { sendEmailForJobApplication } = require('../middleware/sendemail');
const PreboardingMaster = require('../models/preboardingMaster');
const mailTemplateEditor = require('../models/mailTemplateEditor');
const path = require('path');
const JobRoleClassification = require('../models/jobRoleClassification');
const CountryMaster = require('../models/countrymaster');
const { preboardingAppURL } = require('../utils/labelUtils');
const { sendApplicationNotification } = require('../utils/sendNotification');
const {
  findCompanyNotificationPolicy,
} = require('../utils/commonUtilFunctions');
const { mailTemplateTypes, InterViewTypeENUM, Nationality } = require('../utils/dbUtils');
const { getJobMailtemplate } = require('../utils/mailTemplate');
const UserInbox = require('../models/UserInbox');

exports.addJobApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let {
      firstName,
      middleName,
      lastName,
      userNumber,
      email,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      jobPostingID,
      resumeAttachment,
      candidateComment,
      userNumberCountryMasterID,
      employeeType,
      nationality,
    } = await req.body;
    const condition = {
      jobPostingID: jobPostingID,
      [Sequelize.Op.or]: [
        { email: { [Sequelize.Op.iLike]: '%' + email + '%' } },
        { userNumber: userNumber },
      ],
    };
    const alreadyApplied = await JobApplication.findOne(
      {
        where: condition,
      },
      { transaction }
    );
    if (alreadyApplied) {
      const filePath = path.join(
        __dirname,
        `../uploads/job/${req.file.filename}`
      );

      fs.unlink(filePath, function (err) {
        if (err) {
          console.log(err);
        }
      });
      await transaction.rollback();
      return res.status(200).json({
        status: 200,
        message: 'You already Applied For this Job!!',
      });
    }
    if (req.file) {
      resumeAttachment = 'uploads/job/' + req.file.filename;
    }
    const findJob = await JobPosting.findOne(
      {
        where: { jobPostingID },
      },
      { transaction }
    );
    const createApplication = await JobApplication.create(
      {
        firstName,
        middleName,
        lastName,
        userNumber,
        email,
        companyMasterID,
        branchMasterID,
        departmentId,
        designationId,
        jobPostingID,
        resumeAttachment,
        candidateComment,
        userNumberCountryMasterID,
        employeeType,
        nationality,
      },
      { transaction }
    );
    const userName = `${firstName} ${lastName}`;
    // Create UserInbox
    await UserInbox.create(
      {
        activityTable: JobApplication.getTableName(),
        activityTablePK: createApplication.toJSON().jobApplicationID,
        message: `${userName} has applied for job at ${moment().format("DD/MM/YYYY HH:mm")}.`,
        assignedTo: null,
        assignedBy: null,
        companyMasterID: findJob.companyMasterID
      },
      { transaction }
    );


    await sendApplicationNotification(
      companyMasterID,
      userName,
      'JobApplication',
      'Job Application',
      'jobApplication',
      'Job'
    );

    await sendJobApplicationMail(
      +createApplication.jobApplicationID,
      +companyMasterID,
      mailTemplateTypes.jobApplicationAcknowledgementMailTemplate,
      email,
      transaction
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message: 'Your Application Submitted Successfully!!',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// get all data api
exports.listJobApplication = async (req, res, next) => {
  try {
    let {
      page,
      limit,
      companyMasterID,
      branchMasterID,
      departmentId,
      designationId,
      jobPostingID,
      exportData,
      searchQuery,
      jobApplicationStatus,
    } = req.body;

    const condition = {};

    const paginationQuery = {};
    if (!exportData && page && limit) {
      paginationQuery.offset = (page - 1) * limit;
      paginationQuery.limit = limit;
    }
    if (companyMasterID) {
      condition.companyMasterID = companyMasterID;
    }
    if (branchMasterID) {
      condition.branchMasterID = branchMasterID;
    }
    if (departmentId) {
      condition.departmentId = departmentId;
    }
    if (designationId) {
      condition.designationId = designationId;
    }
    if (jobPostingID) {
      condition.jobPostingID = jobPostingID;
    }
    if (jobApplicationStatus) {
      condition.jobApplicationStatus = jobApplicationStatus;
    }
    if (searchQuery) {
      condition[Sequelize.Op.or] = [
        {
          firstName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          middleName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          lastName: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          userNumber: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          email: {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$jobPosting.jobTitle$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$jobPosting.employmentType$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
        {
          '$jobPosting.jobLocation$': {
            [Sequelize.Op.iLike]: '%' + searchQuery + '%',
          },
        },
      ];
    }
    const { rows: jobApplication, count } =
      await JobApplication.findAndCountAll({
        // raw: true,
        where: condition,
        ...paginationQuery,
        include: [
          {
            model: companyMaster,
            attributes: ['companyMasterID', 'companyName'],
          },
          {
            model: BranchMaster,
            attributes: ['branchMasterID', 'branchName', 'branchCode'],
          },
          {
            model: Department,
            attributes: ['departmentId', 'departmentName'],
          },
          {
            model: Designation,
            attributes: ['designationId', 'designationName'],
          },
          {
            model: JobPosting,
            attributes: ['jobTitle', 'employmentType', 'jobLocation'],
          },
          {
            model: BranchMaster,
            as: 'interviewBranch',
            attributes: [
              'branchMasterID',
              'branchName',
              'branchCode',
              'branchAddress',
            ],
          },
          {
            model: PreboardingMaster,
            attributes: [
              'preboardingMasterID',
              'preboardingMasterName',
              'preboardingMasterDescription',
              'jobDescription',
              'companyMasterID',
            ],
          },
          { model: CountryMaster, attributes: ['countryName', 'countryCode'] },
        ],
        order: [['createdAt', 'DESC']],
      });
    if (exportData) {
      const dataToEXport = jobApplication.map((e) => {
        return {
          'Application Status':
            e.jobApplicationStatus == 1
              ? 'Applied'
              : e.jobApplicationStatus == 0
                ? 'Rejected'
                : 'Accepted',
          Company: e.companyMaster.companyName,
          Branch: e.branchMaster.branchName,
          Department: e.department.departmentName,
          Designation: e.designation.designationName,
          'Job Title': e.jobPosting.jobTitle,
          'First Name': e.firstName,
          'Middle Name': e.middleName,
          'Last Name': e.lastName,
          'User Number': e.userNumberCountryMasterID
            ? `${e.countryMaster?.countryCode}-${e.userNumber}`
            : e.userNumber,
          Email: e.email,
          Nationality: e.nationality,
          "Employee Typee": e.employeeType,
          'Applied Date': e.createdAt
            ? moment(e.createdAt).format('DD-MM-YYYY')
            : '',
        };
      });
      await generateExcel(dataToEXport, 'Job Application', 'xlsx', res);
      return;
    }

    return res
      .status(200)
      .json({ status: 200, data: jobApplication, totalcount: count });
  } catch (error) {
    next(error);
  }
};

// get By ID
exports.getApplicationByID = async (req, res, next) => {
  try {
    let { jobApplicationID } = req.query;
    const jobApplicationData = await JobApplication.findOne({
      where: {
        jobApplicationID,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: BranchMaster,
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: Department,
          attributes: ['departmentId', 'departmentName'],
        },
        {
          model: Designation,
          attributes: ['designationId', 'designationName'],
        },
        {
          model: JobPosting,
          // attributes: ['jobTitle', 'employmentType', 'jobLocation'],
          include: [
            {
              model: JobRoleClassification,
              attributes: [
                'jobRoleClassificationID',
                'jobRoleClassificationName',
                'jobRoleClassificationDescription',
              ],
            },
          ],
        },
        {
          model: BranchMaster,
          as: 'interviewBranch',
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: PreboardingMaster,
          attributes: [
            'preboardingMasterID',
            'preboardingMasterName',
            'preboardingMasterDescription',
            'jobDescription',
            'companyMasterID',
          ],
        },
        { model: CountryMaster, attributes: ['countryName', 'countryCode'] },
      ],
    });
    return res.status(200).json({ status: 200, data: jobApplicationData });
  } catch (err) {
    next(err);
  }
};

exports.getApplicationByIDOpen = async (req, res, next) => {
  try {
    let { jobApplicationID } = req.query;
    const jobApplicationData = await JobApplication.findOne({
      where: {
        jobApplicationID,
        status: 1,
      },
      include: [
        {
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: BranchMaster,
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: Department,
          attributes: ['departmentId', 'departmentName'],
        },
        {
          model: Designation,
          attributes: ['designationId', 'designationName'],
        },
        {
          model: JobPosting,
          // attributes: ['jobTitle', 'employmentType', 'jobLocation'],
          include: [
            {
              model: JobRoleClassification,
              attributes: [
                'jobRoleClassificationID',
                'jobRoleClassificationName',
                'jobRoleClassificationDescription',
              ],
            },
          ],
        },
        {
          model: BranchMaster,
          as: 'interviewBranch',
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: PreboardingMaster,
          attributes: [
            'preboardingMasterID',
            'preboardingMasterName',
            'preboardingMasterDescription',
            'jobDescription',
            'companyMasterID',
          ],
        },
        { model: CountryMaster, attributes: ['countryName', 'countryCode'] },
      ],
    });
    return res.status(200).json({ status: 200, data: jobApplicationData });
  } catch (err) {
    next(err);
  }
};
exports.jobApplicationAcceptreject = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      jobApplicationID,
      jobApplicationStatus,
      interViewType,
      interViewDate,
      interViewTime,
      interViewLink,
      acceptRemarks,
      rejectionRemarks,
      interViewBranchMasterID,
      preboardingMasterID,
    } = req.body;

    const jobApplicationData = await JobApplication.findOne({
      where: { jobApplicationID: jobApplicationID },
      include: [
        {
          model: companyMaster,
          attributes: ['companyMasterID', 'companyName'],
        },
        {
          model: BranchMaster,
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: Department,
          attributes: ['departmentId', 'departmentName'],
        },
        {
          model: Designation,
          attributes: ['designationId', 'designationName'],
        },
        {
          model: JobPosting,
          attributes: ['jobTitle', 'employmentType', 'jobLocation'],
        },
        {
          model: BranchMaster,
          as: 'interviewBranch',
          attributes: [
            'branchMasterID',
            'branchName',
            'branchCode',
            'branchAddress',
          ],
        },
        {
          model: PreboardingMaster,
          attributes: [
            'preboardingMasterID',
            'preboardingMasterName',
            'preboardingMasterDescription',
            'jobDescription',
            'companyMasterID',
          ],
        },
      ],
    });

    if (!jobApplicationData) {
      await transaction.rollback();
      return res.status(200).json({
        status: 500,
        message: message.usermessage.notFoundMessage('Job Application'),
      });
    }
    await JobApplication.update(
      {
        jobApplicationStatus,
        interViewType,
        interViewDate,
        interViewTime,
        interViewLink,
        acceptRemarks,
        rejectionRemarks,
        updateBy: req.userDetails.userMasterId,
        updateByIp: req.userDetails.userIpAddress,
        interViewBranchMasterID,
        preboardingMasterID,
      },
      {
        where: { jobApplicationID: jobApplicationID },
        transaction,
      }
    );

    await UserInbox.destroy(
      {
        where: {
          activityTable: JobApplication.getTableName(),
          activityTablePK: jobApplicationID,
        },
      },
      { transaction }
    );
    const mailTypeID =
      jobApplicationStatus === 2
        ? mailTemplateTypes.jobApplicationAcceptMailTemplate
        : mailTemplateTypes.jobApplicationRejectMailTemplate;

    await sendJobApplicationMail(
      +jobApplicationID,
      +jobApplicationData.companyMasterID,
      mailTypeID,
      jobApplicationData.email,
      transaction
    );
    await transaction.commit();
    return res.status(200).json({
      status: 200,
      message:
        jobApplicationStatus === 2
          ? 'Job Application Accept Successfully'
          : 'Job Application Reject Successfully',
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

async function sendJobApplicationMail(
  jobApplicationID,
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
    const mailHeader = await getJobMailtemplate(
      jobApplicationID,
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
    throw new Error('Error in Sending Job Mail: ' + error.message);
  }
}
